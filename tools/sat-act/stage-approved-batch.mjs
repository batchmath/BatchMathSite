#!/usr/bin/env node
// Creates a review patch in an isolated worktree. This command never changes the current checkout or pushes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { displayNumber } from './lib/library.mjs';
import { must, stableJson } from './lib/source-records.mjs';
import { EXPORT_SCHEMA, importApprovedExport } from './import-approved-export.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const REGISTRY = 'tools/sat-act/config/registry.json';
const RECORDS = 'tools/sat-act/records';
const MANIFEST = `${RECORDS}/IMPORT-MANIFEST.json`;
const PUBLICATIONS = { schema: 'batchmath.sat-act.youtube-publications/1', publications: [] };
const SOURCE_ID = /^[a-z0-9][a-z0-9-]{0,159}$/;
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });

function verifyContentHashes(items) {
  // Shorts pipeline.canonical has Python's default JSON spacing and float formatting.
  const program = `import hashlib,json,sys
for raw in json.load(sys.stdin):
    rec=json.loads(raw)
    core={k:v for k,v in rec.items() if k not in ('verification','quality','status','content_hash')}
    actual=hashlib.sha256(json.dumps(core,sort_keys=True,ensure_ascii=False,allow_nan=False).encode()).hexdigest()[:16]
    if actual != rec.get('content_hash'):
        sys.exit(f"{rec['id']}: pinned record content hash does not match its mathematics")`;
  execFileSync('python3', ['-I', '-c', program], { input: JSON.stringify(items.map(item => item.recordJson)),
    encoding: 'utf8' });
}

export function planImport(exportData, registry) {
  const src = exportData?.source;
  must(exportData?.schema === EXPORT_SCHEMA && src?.repository === 'batchmath/Shorts' && /^[0-9a-f]{40}$/.test(src.commit) &&
    typeof src.taxonomy === 'string' && Array.isArray(exportData.items) && exportData.items.length, 'Invalid approved-export manifest');
  must(registry?.schema === 'batchmath.sat-act.registry/1' && Array.isArray(registry.problems), 'Invalid website registry');
  const registered = new Set(registry.problems.map(entry => entry.sourceId));
  const byId = new Map();
  for (const item of exportData.items) {
    must(typeof item.recordJson === 'string', 'Approved export item is missing exact source bytes');
    const record = JSON.parse(item.recordJson);
    must(SOURCE_ID.test(record?.id ?? '') && !byId.has(record.id), 'Invalid or duplicate Shorts source ID');
    byId.set(record.id, { item, record });
  }
  const ids = [...byId.keys()].sort();
  const skipped = ids.filter(id => registered.has(id));
  let number = Math.max(0, ...registry.problems.map(entry => entry.number));
  const additions = ids.filter(id => !registered.has(id)).map(id => {
    const { record } = byId.get(id);
    number += 1;
    const title = String(record.topic || '').replace(/\s+/g, ' ').trim();
    must(title, `${id}: source topic is missing`);
    return { number, sourceId: id, slug: `${displayNumber(number)}-${id}`, title: title.length > 48 ? `${title.slice(0, 47).trimEnd()}…` : title,
      status: 'active', registeredIn: `shorts:${src.commit}` };
  });
  if (!additions.length) return { additions, skipped, records: [] };
  const items = additions.map(({ sourceId }) => byId.get(sourceId).item);
  const nextRegistry = { ...registry, problems: [...registry.problems, ...additions] };
  const records = importApprovedExport({ exportData: { ...exportData, items }, publications: PUBLICATIONS, registry: nextRegistry, write: false });
  verifyContentHashes(items);
  return { additions, skipped, records, registry: nextRegistry };
}

function run(cwd, script) {
  execFileSync('npm', ['run', script], { cwd, stdio: 'inherit' });
}

function seoReport(cwd) {
  let foundErrors = false;
  try { run(cwd, 'qa:seo'); }
  catch (error) {
    if (error.status !== 1) throw error;
    foundErrors = true;
  }
  const result = readJson(path.join(cwd, 'qa-results/seo-qa.json'));
  must(result.ok === !foundErrors && Array.isArray(result.errors) && Array.isArray(result.warnings), 'SEO report could not be verified');
  return result;
}

function writeCandidate(checkout, plan) {
  const manifest = readJson(path.join(checkout, MANIFEST));
  must(manifest.schema === 'batchmath.sat-act.import-manifest/1' && Array.isArray(manifest.records), 'Invalid existing import manifest');
  const manifestIds = new Set(manifest.records.map(entry => entry.sourceId));
  const added = plan.records.map((record, index) => {
    const { number, sourceId, slug, title } = plan.additions[index];
    must(!manifestIds.has(sourceId), `${sourceId} already exists in the import manifest`);
    const file = path.join(checkout, RECORDS, `${sourceId}.json`);
    fs.writeFileSync(file, stableJson(record), { flag: 'wx' });
    const { recordSha256, contentHash, commit } = record.provenance;
    const explanationStartSeconds = record.video?.explanationStartSeconds ?? null;
    manifest.records.push({ sourceId, number, sourceCommit: commit, recordSha256, contentHash,
      mediaSha256: record.video?.mediaSha256 ?? null, youtubeId: null, explanationStartSeconds });
    return { number, sourceId, title, url: `/sat-act-math/problems/${slug}/`, explanationStartSeconds };
  });
  fs.writeFileSync(path.join(checkout, REGISTRY), stableJson(plan.registry));
  fs.writeFileSync(path.join(checkout, MANIFEST), stableJson(manifest));
  return added;
}

function stage(exportData, out, browser) {
  must(!fs.existsSync(out), `Output folder must not already exist: ${out}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'batchmath-approved-import-'));
  const output = fs.mkdtempSync(path.join(path.dirname(out), '.batchmath-approved-output-'));
  const checkout = path.join(dir, 'website');
  let worktree = false;
  try {
    git(ROOT, 'worktree', 'add', '--quiet', '--detach', checkout, 'HEAD');
    worktree = true;
    const base = git(checkout, 'rev-parse', 'HEAD').trim();
    const plan = planImport(exportData, readJson(path.join(checkout, REGISTRY)));
    const summary = { base, added: [], skipped: plan.skipped };
    if (plan.records.length) {
      const baselineSeo = seoReport(checkout);
      summary.added = writeCandidate(checkout, plan);
      run(checkout, 'sat-act:build');
      // Browsing links on existing question pages are part of the published pages.
      // The catalog and index can grow without rewriting any of those pages.
      const oldPages = git(checkout, 'diff', '--name-only', '-z', '--', 'sat-act-math/problems/')
        .split('\0').filter(file => /^sat-act-math\/problems\/[^/]+\/index\.html$/.test(file));
      if (oldPages.length) git(checkout, 'restore', '--', ...oldPages);
      for (const script of ['qa:sat-act', 'qa:sat-act-release', 'qa:static', 'qa:analytics', 'qa:browser-infra']) run(checkout, script);
      const candidateSeo = seoReport(checkout);
      const newErrors = candidateSeo.errors.filter(error => error.startsWith('sat-act-math/') || !baselineSeo.errors.includes(error));
      const newWarnings = candidateSeo.warnings.filter(warning => !baselineSeo.warnings.includes(warning));
      must(!newErrors.length && !newWarnings.length, `SEO regressions: ${[...newErrors, ...newWarnings].join('; ')}`);
      summary.preexistingSeoFindings = candidateSeo.errors.length;
      if (browser) {
        fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(checkout, 'node_modules'), 'junction');
        run(checkout, 'qa:sat-act-browser');
      }
      git(checkout, 'add', '--', REGISTRY, RECORDS, 'assets/sat-act/catalog.js', 'sat-act-math', 'sitemap.xml');
      git(checkout, 'diff', '--cached', '--check');
      must(!git(checkout, 'diff', '--name-only').trim(), 'Build modified files outside the generated SAT/ACT section');
      const patch = git(checkout, 'diff', '--cached', '--full-index', '--no-color');
      fs.writeFileSync(path.join(output, 'website.patch'), patch);
      const csv = ['ProblemID,YouTubeURL,ExplanationStartSeconds,Status', ...summary.added.map(row =>
        `${row.sourceId},,${row.explanationStartSeconds ?? ''},Pending`), ''].join('\n');
      fs.writeFileSync(path.join(output, 'video-rows.csv'), csv);
      fs.writeFileSync(path.join(output, 'review.md'), [
        '## Approved SAT/ACT questions', '',
        ...summary.added.map(p => `- #${displayNumber(p.number)} [${p.sourceId}](https://batchmath.net${p.url})`), '',
        'The links above are the permanent URLs once deployed. Append the `video-rows.csv` artifact to the owner video worksheet.',
        'Rows start Pending. A blank cue needs a timestamp before the owner marks that row Published.', '',
        `Release, content, static, analytics, and browser-infrastructure checks passed. ${browser ? 'SAT/ACT browser checks passed. ' : ''}` +
        `SEO compared against the base with ${summary.preexistingSeoFindings} pre-existing findings.`, ''
      ].join('\n'));
    }
    fs.writeFileSync(path.join(output, 'summary.json'), stableJson(summary));
    fs.renameSync(output, out);
    console.log(`${summary.added.length} new, ${plan.skipped.length} already registered. Review files: ${out}`);
  } finally {
    if (worktree) git(ROOT, 'worktree', 'remove', '--force', checkout);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(output, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { export: { type: 'string' }, out: { type: 'string' }, browser: { type: 'boolean' } } });
    must(values.export && values.out, 'Usage: stage-approved-batch.mjs --export <file> --out <new folder> [--browser]');
    stage(readJson(values.export), path.resolve(values.out), Boolean(values.browser));
  } catch (error) {
    console.error('BATCH REFUSED: ' + error.message);
    process.exitCode = 1;
  }
}
