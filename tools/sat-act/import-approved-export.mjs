#!/usr/bin/env node
// PRODUCTION importer: accepts only an explicitly approved content export from batchmath/Shorts.
//
//   node tools/sat-act/import-approved-export.mjs --export <approved-export.json> \
//        [--publications tools/sat-act/config/youtube-publications.json] [--replace] [--out <dir>]
//
// The export format is specified in docs/sat-act/APPROVED-EXPORT-SPEC.md. This importer:
//   * refuses anything that is not a recorded human approval with release eligibility;
//   * re-validates every record and requires its content hash to match the approval;
//   * recomputes the explanation-start timestamp from the approved video's scene and manifest,
//     after checking the manifest's media hash and canonical scene digest;
//   * adds a YouTube ID only from the separate publication file, and only when that entry is
//     bound to the SHA-256 of the exact approved MP4;
//   * requires every problem to be registered (numbered) before import;
//   * never stores reviewer names or other personal details in website files.
// With --replace, records not present in the export (for example development fixtures) are removed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ImportError, must, sha256, pythonCanonicalDigest, parseShortsTaxonomy, validateSourceRecord,
  extractVideoTiming, toWebsiteRecord, stableJson, YOUTUBE_ID
} from './lib/source-records.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const EXPORT_SCHEMA = 'batchmath.shorts.approved-export/1';

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i >= 0) return process.argv[i + 1];
  const eq = process.argv.find(a => a.startsWith(name + '='));
  return eq ? eq.slice(name.length + 1) : undefined;
}
const isoDate = value => typeof value === 'string' && !Number.isNaN(Date.parse(value));
const approvedDecision = (d, where) => {
  must(d && d.decision === 'approved', `${where}: decision is not "approved"`);
  must(d.releaseEligible === true, `${where}: not release eligible`);
  must(typeof d.reviewer === 'string' && d.reviewer.trim(), `${where}: no human reviewer recorded`);
  must(typeof d.approvedRevision === 'string' && d.approvedRevision.trim(), `${where}: approved revision missing`);
  must(isoDate(d.decidedAt), `${where}: decidedAt missing or invalid`);
};

export function importApprovedExport({ exportData, publications, registry, outDir, replace = false, write = true }) {
  must(exportData && exportData.schema === EXPORT_SCHEMA, `export schema must be ${EXPORT_SCHEMA}`);
  const src = exportData.source || {};
  must(src.repository === 'batchmath/Shorts', 'export must come from batchmath/Shorts');
  must(/^[0-9a-f]{40}$/.test(String(src.commit || '')), 'export source commit must be a full SHA');
  must(typeof src.taxonomy === 'string' && src.taxonomy.includes('TOPICS'), 'export must include the source taxonomy (shorts/taxonomy.py text)');
  const taxonomy = parseShortsTaxonomy(src.taxonomy);
  must(Array.isArray(exportData.items) && exportData.items.length, 'export contains no items');
  must(publications && publications.schema === 'batchmath.sat-act.youtube-publications/1', 'invalid publications file');

  const registered = new Map(registry.problems.filter(p => p.status === 'active').map(p => [p.sourceId, p]));
  const pubs = new Map();
  const seenIds = new Set();
  for (const p of publications.publications || []) {
    must(!pubs.has(p.sourceId), `duplicate publication for ${p.sourceId}`);
    must(YOUTUBE_ID.test(String(p.youtubeId || '')), `${p.sourceId}: invalid YouTube ID`);
    must(!seenIds.has(p.youtubeId), `YouTube ID ${p.youtubeId} is assigned to more than one problem`);
    must(/^[0-9a-f]{64}$/.test(String(p.mediaSha256 || '')), `${p.sourceId}: publication must give the MP4 SHA-256`);
    must(isoDate(p.publishedOn), `${p.sourceId}: publishedOn missing or invalid`);
    seenIds.add(p.youtubeId);
    pubs.set(p.sourceId, p);
  }

  const written = [];
  const importedIds = new Set();
  for (const item of exportData.items) {
    // Raw JSON text is required so hashes and the Python canonical digest see the exact source bytes.
    must(typeof item.recordJson === 'string', 'export items must carry recordJson as the exact source text');
    const rec = JSON.parse(item.recordJson);
    const id = rec && rec.id;
    must(id && !importedIds.has(id), `export item without a unique record id`);
    importedIds.add(id);
    must(registered.has(id), `${id}: not registered; assign its permanent number in config/registry.json first`);
    validateSourceRecord(rec, id);
    must(!rec.question.table && !rec.question.figure && rec.visual?.type !== 'scatter_fit',
      `${id}: the website cannot yet display the table or figure required to answer this question`);
    approvedDecision(item.text, `${id} text approval`);
    must(item.text.contentHash === rec.content_hash, `${id}: text approval is for content ${item.text.contentHash}, record is ${rec.content_hash}`);

    let video = null;
    let videoApproval = null;
    const pub = pubs.get(id);
    if (item.video) {
      const v = item.video;
      approvedDecision(v, `${id} video approval`);
      must(v.textApprovedRevision === item.text.approvedRevision, `${id}: video approval is bound to a different text revision`);
      must(typeof v.manifestJson === 'string' && typeof v.sceneJson === 'string', `${id}: video must carry manifestJson and sceneJson text`);
      const manifest = JSON.parse(v.manifestJson);
      const scene = JSON.parse(v.sceneJson);
      const prov = manifest.release_provenance || {};
      must(manifest.source_id === id && manifest.content_hash === rec.content_hash, `${id}: video manifest does not match the record`);
      must(/^[0-9a-f]{64}$/.test(String(v.mediaSha256 || '')) && v.mediaSha256 === prov.media_hash,
        `${id}: approved MP4 hash does not match the manifest`);
      must(pythonCanonicalDigest(Buffer.from(v.sceneJson, 'utf8')) === prov.scene_hash,
        `${id}: approved scene does not match the manifest digest`);
      const timing = extractVideoTiming(scene, manifest, rec);
      if (pub) must(pub.mediaSha256 === v.mediaSha256, `${id}: the published video is not the approved MP4`);
      video = {
        variantId: manifest.id,
        mediaSha256: v.mediaSha256,
        durationSeconds: manifest.duration,
        explanationStartSeconds: timing.explanationStartSeconds,
        timing,
        youtubeId: pub ? pub.youtubeId : null,
        published: Boolean(pub),
        publication: pub ? { publishedOn: pub.publishedOn } : null
      };
      videoApproval = { approvedRevision: v.approvedRevision, decidedAt: v.decidedAt };
    } else {
      must(!pub, `${id}: a YouTube publication exists but the export has no approved video`);
    }

    const approval = {
      text: { approvedRevision: item.text.approvedRevision, decidedAt: item.text.decidedAt },
      video: videoApproval,
      releaseEligible: true,
      note: 'Approved through the Shorts review gate; imported from an approved content export.'
    };
    const provenance = {
      repository: src.repository,
      commit: src.commit,
      exportedAt: exportData.exportedAt || null,
      recordSha256: sha256(Buffer.from(item.recordJson, 'utf8')),
      contentHash: rec.content_hash,
      verification: {
        passed: rec.verification.passed,
        checks: rec.verification.n_checks,
        failed: rec.verification.n_failed,
        tools: rec.verification.tools || {}
      }
    };
    const web = toWebsiteRecord({ rec, contentStatus: 'approved', approval, provenance, video, taxonomy });
    written.push(web);
  }
  for (const id of pubs.keys()) must(importedIds.has(id), `${id}: publication listed for a problem that is not in the export`);

  if (write) {
    fs.mkdirSync(outDir, { recursive: true });
    if (replace) {
      for (const f of fs.readdirSync(outDir)) {
        if (f.endsWith('.json') && f !== 'IMPORT-MANIFEST.json' && !importedIds.has(f.slice(0, -5))) fs.rmSync(path.join(outDir, f));
      }
    }
    for (const web of written) fs.writeFileSync(path.join(outDir, `${web.sourceId}.json`), stableJson(web));
    fs.writeFileSync(path.join(outDir, 'IMPORT-MANIFEST.json'), stableJson({
      schema: 'batchmath.sat-act.import-manifest/1',
      contentStatus: 'approved',
      source: { repository: src.repository, commit: src.commit, exportedAt: exportData.exportedAt || null },
      records: written.map(w => ({
        sourceId: w.sourceId,
        number: registered.get(w.sourceId).number,
        contentHash: w.provenance.contentHash,
        mediaSha256: w.video ? w.video.mediaSha256 : null,
        youtubeId: w.video ? w.video.youtubeId : null,
        explanationStartSeconds: w.video ? w.video.explanationStartSeconds : null
      }))
    }));
  }
  return written;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const exportPath = arg('--export');
    must(exportPath, 'usage: import-approved-export.mjs --export <approved-export.json> [--publications <file>] [--replace]');
    const exportData = JSON.parse(fs.readFileSync(path.resolve(exportPath), 'utf8'));
    const publications = JSON.parse(fs.readFileSync(path.resolve(arg('--publications') || path.join(HERE, 'config/youtube-publications.json')), 'utf8'));
    const registry = JSON.parse(fs.readFileSync(path.join(HERE, 'config/registry.json'), 'utf8'));
    const outDir = path.resolve(arg('--out') || path.join(HERE, 'records'));
    const written = importApprovedExport({ exportData, publications, registry, outDir, replace: process.argv.includes('--replace') });
    console.log(`Imported ${written.length} approved record(s); ${written.filter(w => w.video && w.video.youtubeId).length} with a published YouTube video.`);
  } catch (error) {
    if (error instanceof ImportError) {
      console.error('IMPORT REFUSED: ' + error.message);
      process.exit(2);
    }
    throw error;
  }
}
