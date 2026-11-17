#!/usr/bin/env node
// Imports the five audited Shorts records as DEVELOPMENT FIXTURES for the private prototype.
//
//   node tools/sat-act/import-shorts-fixtures.mjs --shorts <path to a local batchmath/Shorts checkout>
//
// Every file is read with `git show <pinned commit>:<path>`, so the checkout's current branch
// or working tree cannot change what is imported. The importer:
//   * verifies the pinned content commit and that the audit commit's parent is that commit;
//   * validates each record (verified status, zero failed checks, quality gate, answer key);
//   * hashes the exact narrated MP4 and checks it against the manifest and the audit report;
//   * reproduces the manifest's canonical scene digest;
//   * derives the explanation-start timestamp from the rendered countdown and narration timing.
// It never writes to the Shorts repository, never copies media, and never marks anything approved.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ImportError, must, sha256, gitShow, gitResolve, gitParent, pythonCanonicalDigest,
  parseShortsTaxonomy, parseAuditMediaTable, validateSourceRecord, extractVideoTiming,
  toWebsiteRecord, stableJson
} from './lib/source-records.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(HERE, 'config/dev-fixture-source.json'), 'utf8'));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(HERE, 'config/registry.json'), 'utf8'));

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i >= 0) return process.argv[i + 1];
  const eq = process.argv.find(a => a.startsWith(name + '='));
  return eq ? eq.slice(name.length + 1) : undefined;
}

function main() {
  const shorts = path.resolve(arg('--shorts') || process.env.BM_SHORTS_DIR || '');
  must(arg('--shorts') || process.env.BM_SHORTS_DIR, 'usage: import-shorts-fixtures.mjs --shorts <local Shorts checkout>');
  must(fs.existsSync(path.join(shorts, '.git')), `${shorts} is not a git checkout`);
  const outDir = path.resolve(arg('--out') || path.join(HERE, 'records'));

  const commit = gitResolve(shorts, CONFIG.commit);
  must(commit === CONFIG.commit, `pinned content commit ${CONFIG.commit} not found`);
  const auditCommit = gitResolve(shorts, CONFIG.audit.commit);
  must(auditCommit === CONFIG.audit.commit, `pinned audit commit ${CONFIG.audit.commit} not found (fetch ${CONFIG.audit.branch})`);
  must(gitParent(shorts, auditCommit) === commit, 'the audit commit is not a direct child of the pinned content commit');
  const auditReport = gitShow(shorts, auditCommit, CONFIG.audit.report).toString('utf8');
  must(auditReport.includes(CONFIG.commit), 'audit report does not name the pinned content commit');
  must(auditReport.includes(CONFIG.audit.verdict), `audit report does not contain the verdict "${CONFIG.audit.verdict}"`);
  const auditMedia = parseAuditMediaTable(auditReport);
  const taxonomy = parseShortsTaxonomy(gitShow(shorts, commit, 'shorts/taxonomy.py').toString('utf8'));

  const registered = new Map(REGISTRY.problems.map(p => [p.sourceId, p]));
  const summary = [];
  fs.mkdirSync(outDir, { recursive: true });

  for (const item of CONFIG.records) {
    const id = item.sourceId;
    must(registered.has(id), `${id} is not in the numbering registry`);
    const recordBytes = gitShow(shorts, commit, item.recordPath);
    const rec = JSON.parse(recordBytes.toString('utf8'));
    validateSourceRecord(rec, id);

    const variant = `${id}-${CONFIG.videoVariant}`;
    const manifestPath = `output/videos/${variant}.json`;
    const scenePath = `data/scenes/${variant}.json`;
    const mediaPath = `output/videos/${variant}.mp4`;
    const manifestBytes = gitShow(shorts, commit, manifestPath);
    const sceneBytes = gitShow(shorts, commit, scenePath);
    const manifest = JSON.parse(manifestBytes.toString('utf8'));
    const scene = JSON.parse(sceneBytes.toString('utf8'));
    const prov = manifest.release_provenance || {};
    must(manifest.id === variant && manifest.source_id === id, `${variant}: manifest identity mismatch`);
    must(manifest.content_hash === rec.content_hash, `${variant}: manifest content hash ${manifest.content_hash} != record ${rec.content_hash}`);
    must(String(prov.content_hash || '').startsWith(rec.content_hash), `${variant}: provenance content hash does not extend the record hash`);
    must(prov.variant === CONFIG.videoVariant, `${variant}: provenance variant is ${prov.variant}`);

    const mediaSha256 = sha256(gitShow(shorts, commit, mediaPath));
    must(mediaSha256 === prov.media_hash, `${variant}: MP4 bytes do not match the manifest media hash`);
    must(auditMedia[id] && auditMedia[id].mediaSha256 === mediaSha256, `${variant}: MP4 is not the file identified in the audit report`);
    const sceneDigest = pythonCanonicalDigest(sceneBytes);
    must(sceneDigest === prov.scene_hash, `${variant}: scene digest does not match the manifest`);

    const timing = extractVideoTiming(scene, manifest, rec);
    const video = {
      variantId: variant,
      mediaSha256,
      durationSeconds: manifest.duration,
      explanationStartSeconds: timing.explanationStartSeconds,
      timing,
      youtubeId: null,
      published: false,
      publication: null
    };

    const provenance = {
      repository: CONFIG.repository,
      branch: CONFIG.branch,
      commit,
      recordPath: item.recordPath,
      recordSha256: sha256(recordBytes),
      contentHash: rec.content_hash,
      verification: {
        passed: rec.verification.passed,
        checks: rec.verification.n_checks,
        failed: rec.verification.n_failed,
        tools: rec.verification.tools || {}
      },
      video: {
        manifestPath,
        manifestSha256: sha256(manifestBytes),
        scenePath,
        sceneCanonicalSha256: sceneDigest,
        mediaPath,
        mediaSha256,
        renderInputsSha256: prov.inputs_hash || null
      },
      audit: {
        branch: CONFIG.audit.branch,
        commit: auditCommit,
        report: CONFIG.audit.report,
        reportSha256: sha256(Buffer.from(auditReport, 'utf8')),
        verdict: CONFIG.audit.verdict,
        auditDate: CONFIG.audit.auditDate
      }
    };
    const approval = {
      text: null,
      video: null,
      releaseEligible: false,
      note: 'Development fixture. Independent content audit only; no human approval has been recorded. Not for publication.'
    };
    const web = toWebsiteRecord({ rec, contentStatus: CONFIG.contentStatus, approval, provenance, video, taxonomy });
    const file = path.join(outDir, `${id}.json`);
    fs.writeFileSync(file, stableJson(web));
    summary.push({
      sourceId: id,
      number: registered.get(id).number,
      recordSha256: provenance.recordSha256,
      contentHash: rec.content_hash,
      mediaSha256,
      explanationStartSeconds: timing.explanationStartSeconds,
      countdownEndSeconds: timing.countdownEndSeconds,
      firstExplanationNarrationSeconds: timing.firstExplanationNarrationSeconds
    });
    console.log(`imported ${id} (#${String(registered.get(id).number).padStart(3, '0')}): verified, ` +
      `${rec.verification.n_checks} checks, explanation starts at ${timing.explanationStartSeconds}s ` +
      `(countdown ends ${timing.countdownEndSeconds}s, narration ${timing.firstExplanationNarrationSeconds}s)`);
  }
  const manifestOut = {
    schema: 'batchmath.sat-act.import-manifest/1',
    contentStatus: CONFIG.contentStatus,
    source: { repository: CONFIG.repository, branch: CONFIG.branch, commit },
    audit: { branch: CONFIG.audit.branch, commit: auditCommit, verdict: CONFIG.audit.verdict },
    records: summary
  };
  fs.writeFileSync(path.join(outDir, 'IMPORT-MANIFEST.json'), stableJson(manifestOut));
  console.log(`Wrote ${summary.length} development-fixture records to ${path.relative(ROOT, outDir) || outDir}. Nothing was approved or published.`);
}

try {
  main();
} catch (error) {
  if (error instanceof ImportError) {
    console.error('IMPORT REFUSED: ' + error.message);
    process.exit(2);
  }
  throw error;
}
