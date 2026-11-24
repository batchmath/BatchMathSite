#!/usr/bin/env node
// SAT & ACT Math Practice — static QA (no browser).
//
//   node tools/sat-act/sat-act-qa.mjs            development checks (expected to pass on the prototype branch)
//   node tools/sat-act/sat-act-qa.mjs --release  also requires authorization for every question
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadLibrary, SECTION, SLUG_RE } from './lib/library.mjs';
import { escapeHtml, tokenize } from './lib/markup.mjs';
import { ImportError, pythonCanonicalDigest, sha256, stableJson, YOUTUBE_ID } from './lib/source-records.mjs';
import { initialWebsiteRelease } from './lib/initial-website-release.mjs';
import { importApprovedExport, EXPORT_SCHEMA } from './import-approved-export.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const RELEASE = process.argv.includes('--release');
const errors = [];
const notes = [];
const stats = {};
const fail = m => errors.push(m);
const check = (cond, m) => { if (!cond) fail(m); };
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const pageFile = url => path.join(ROOT, url.replace(/^\//, ''), 'index.html');

// ------------------------------------------------------------------ library and records
const lib = loadLibrary(HERE);
stats.questions = lib.problems.length;
stats.topicPages = lib.subjects.length;
stats.contentStatus = lib.contentStatus;
check(lib.problems.length >= 5, `expected at least the five prototype questions, found ${lib.problems.length}`);
const recordFiles = fs.readdirSync(path.join(HERE, 'records')).filter(f => f.endsWith('.json') && f !== 'IMPORT-MANIFEST.json');
check(recordFiles.length === lib.problems.length, 'every record must be registered, active and published');

for (const p of lib.problems) {
  const r = p.record;
  const where = `#${p.displayNumber} ${p.id}`;
  check(SLUG_RE.test(p.slug), `${where}: slug format`);
  check(r.choices.length === 4 && r.choices.filter(c => c.correct).length === 1, `${where}: needs four choices with one correct`);
  check(r.choices.find(c => c.correct).label === r.answer.label, `${where}: answer key disagrees with choices`);
  check(r.provenance && /^[0-9a-f]{40}$/.test(r.provenance.commit) && r.provenance.verification.passed && r.provenance.verification.failed === 0,
    `${where}: provenance must name a verified source commit`);
  const v = r.video || {};
  const t = v.timing || {};
  if (r.video) {
    check(Number.isInteger(v.explanationStartSeconds), `${where}: explanation start must be a whole second`);
    check(v.explanationStartSeconds >= t.countdownEndSeconds && v.explanationStartSeconds <= t.firstExplanationNarrationSeconds,
      `${where}: explanation start ${v.explanationStartSeconds}s is not between the countdown end and the first explanation sentence`);
    check(/^[0-9a-f]{64}$/.test(String(v.mediaSha256 || '')), `${where}: timing is not bound to an MP4 hash`);
  }
  if (r.contentStatus === 'development-fixture') {
    check(r.approval && r.approval.releaseEligible === false && r.approval.text === null && r.approval.video === null,
      `${where}: a development fixture must not carry approvals`);
    check(v.youtubeId === null && v.published === false, `${where}: a development fixture must not have a YouTube ID`);
  }
  if (v.youtubeId) {
    check(YOUTUBE_ID.test(v.youtubeId) && v.published && r.contentStatus === 'approved' && r.approval.video,
      `${where}: YouTube ID without an approved, published video`);
  }
}
const expectedStarts = { 'right-triangle-trig-s0031': 19, 'radical-equation-s0003': 16, 'system-no-solution-s0001': 20, 'reverse-percent-s0001': 23, 'circle-radius-s0001': 18 };
for (const [id, s] of Object.entries(expectedStarts)) {
  const p = lib.problems.find(x => x.id === id);
  if (p?.record.contentStatus === 'development-fixture') {
    check(p.video?.explanationStartSeconds === s, `${id}: explanation start changed from the audited render (${s}s)`);
  }
}

// ------------------------------------------------------------------ registry permanence
try {
  const committed = JSON.parse(execFileSync('git', ['-C', ROOT, 'show', 'HEAD:tools/sat-act/config/registry.json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  const now = new Map(lib.registry.problems.map(p => [p.number, p]));
  for (const old of committed.problems) {
    const cur = now.get(old.number);
    check(cur && cur.sourceId === old.sourceId && cur.slug === old.slug,
      `registry: #${old.number} (${old.sourceId}, ${old.slug}) was renumbered, re-pointed or removed`);
  }
  stats.registryPermanence = `checked against HEAD (${committed.problems.length} entries)`;
} catch (_) {
  stats.registryPermanence = 'no committed registry yet (first commit)';
}

// ------------------------------------------------------------------ generated pages
const pages = [SECTION, `${SECTION}problems/`, ...lib.subjects.map(s => s.url), ...lib.problems.map(p => p.url)];
const titles = new Set();
const sitemap = read('sitemap.xml');
const feedConfig = { window: {}, URL, location: new URL('https://batchmath.net/') };
vm.createContext(feedConfig);
for (const script of ['video-feed-config.js', 'video-index.js']) {
  vm.runInContext(read(`assets/sat-act/${script}`), feedConfig, { filename: script });
}
check(feedConfig.window.BMSatActVideoIndex?.valid, 'video feed configuration must be blank or a published Google Sheets CSV URL');
for (const url of pages) {
  const file = pageFile(url);
  if (!fs.existsSync(file)) { fail(`${url}: page missing`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
  check(title && title.length <= 85 && !titles.has(title), `${url}: title missing, too long or duplicated`);
  titles.add(title);
  check(html.includes(`<link rel="canonical" href="https://batchmath.net${url}">`), `${url}: canonical missing`);
  check(/data-batchmath-breadcrumbs="11"/.test(html), `${url}: visible breadcrumb missing (run the build so seo-build adds it)`);
  const ld = (html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/) || [])[1];
  check(ld && /"BreadcrumbList"/.test(ld) && !/"(?:Course|PracticeProblem|VideoObject|Quiz)"/.test(ld), `${url}: structured data missing or unsupported type`);
  check(sitemap.includes(`<loc>https://batchmath.net${url}</loc>`), `${url}: not in sitemap.xml`);
  check(html.includes('G-377MTFXSF3'), `${url}: GA4 tag missing`);
  const videoScripts = ['catalog.js', 'video-feed-config.js', 'video-index.js', 'sat-act-practice.js']
    .map(script => html.indexOf(`/assets/sat-act/${script}`));
  check(videoScripts.every((position, i) => position >= 0 && (!i || position > videoScripts[i - 1])),
    `${url}: practice and video scripts are missing or out of order`);
  check(!html.includes('problem-tracking.js') && !html.includes('BM_ANALYTICS_CONFIG'),
    `${url}: must not declare a generator-engine analytics config (the runtime loads the shared tracker)`);
  check((html.match(/<h1\b/g) || []).length === 1, `${url}: expected one H1`);
  check(/not official SAT or ACT questions/.test(html), `${url}: missing the original-practice / trademark statement`);
  check(!/\.mp4\b|output\/videos|data\/scenes|youtube\.com\/embed\//i.test(html), `${url}: references private media or a hard-coded embed`);
  check(!/(?:ghp_|github_pat_|gho_|x-access-token|Authorization:)/i.test(html), `${url}: credential-like text`);
  check(!/endorsed by|official (?:SAT|ACT) (?:practice )?question(?!s?\b[^<]{0,20}not)/i.test(html.replace(/not an official SAT® or ACT® question|not official SAT or ACT questions/g, '')),
    `${url}: implies an official SAT/ACT affiliation`);
  check(html.includes('satact-preview-notice') === !lib.releaseReady, `${url}: preview notice disagrees with authorization status`);
}
stats.pagesChecked = pages.length;
const sitemapCount = (sitemap.match(/<loc>https:\/\/batchmath\.net\/sat-act-math\//g) || []).length;
check(sitemapCount === pages.length, `sitemap has ${sitemapCount} SAT & ACT URLs, expected ${pages.length}`);

// Verbatim mathematics: every TeX string of every record appears unchanged in its page.
let texChecked = 0;
for (const p of lib.problems) {
  const html = fs.readFileSync(pageFile(p.url), 'utf8');
  const r = p.record;
  const tex = [];
  const fromMarkup = s => tokenize(s).filter(t => t.type === 'math').forEach(t => tex.push(t.value));
  r.question.stem.forEach(part => typeof part === 'string' ? fromMarkup(part) : tex.push(part.math));
  fromMarkup(r.question.prompt);
  r.choices.forEach(c => { fromMarkup(c.display); fromMarkup(c.why); });
  r.solution.steps.forEach(s => {
    [s.caption, s.caption2, s.note].filter(Boolean).forEach(fromMarkup);
    (s.lines || []).forEach(l => tex.push(l.tex));
    ((s.check || {}).lines || []).forEach(l => tex.push(l.tex));
  });
  fromMarkup(r.solution.keyIdea);
  for (const t of tex) {
    texChecked++;
    check(html.includes(escapeHtml(t)), `#${p.displayNumber}: TeX not found verbatim: ${t}`);
  }
  const data = JSON.parse((html.match(/<script type="application\/json" id="satact-problem-data">([\s\S]*?)<\/script>/) || [])[1] || '{}');
  check(data.id === p.id && data.number === p.number && data.answer === r.answer.label, `#${p.displayNumber}: page data does not match the record`);
  check(data.video && data.video.explanationStartSeconds === (p.video?.explanationStartSeconds ?? null) && data.video.youtubeId === (p.hasVideo ? p.video.youtubeId : null),
    `#${p.displayNumber}: page video data does not match the record`);
  check((html.match(/class="satact-choice"/g) || []).length === 4, `#${p.displayNumber}: expected four answer choices`);
  check((html.match(/class="satact-step"/g) || []).length === r.solution.steps.length, `#${p.displayNumber}: missing solution steps`);
  if (r.figure) check(/<svg class="satact-fig-svg"[\s\S]*?role="img"/.test(html), `#${p.displayNumber}: question figure missing`);
}
stats.texStringsVerifiedVerbatim = texChecked;

// ------------------------------------------------------------------ homepage entry
const home = read('index.html');
check((home.match(/<a class="satact-spotlight" href="sat-act-math\/">/g) || []).length === 1, 'homepage: SAT & ACT button missing or duplicated');
check(/SAT &amp; ACT Math Practice<\/strong>/.test(home), 'homepage: button label');
check(home.indexOf('class="satact-spotlight"') < home.indexOf('class="archive-spotlight"'), 'homepage: SAT & ACT button should sit just above the archive button');
const classAttrs = [...home.matchAll(/\bclass="([^"]*)"/g)].map(m => m[1].split(/\s+/));
check((home.match(/<a class="archive-spotlight" href="archive\/">/g) || []).length === 1 &&
  !classAttrs.some(c => c.includes('archive-spotlight') && c.some(x => x.startsWith('satact'))),
  'homepage: archive button changed or its class reused');
check(/\.archive-spotlight\{[\s\S]*?border:2px solid var\(--red\)/.test(home), 'homepage: archive button styles changed');

// ------------------------------------------------------------------ deterministic rebuild
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-satact-build-'));
  try {
    for (const rel of ['tools/seo-build.mjs', 'sitemap.xml', 'index.html']) {
      fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
      fs.copyFileSync(path.join(ROOT, rel), path.join(tmp, rel));
    }
    fs.cpSync(HERE, path.join(tmp, 'tools/sat-act'), { recursive: true });
    execFileSync(process.execPath, [path.join(tmp, 'tools/sat-act/build-sat-act-pages.mjs')], { cwd: tmp, stdio: 'pipe' });
    const diff = [];
    const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
    const ours = walk(path.join(ROOT, 'sat-act-math')).map(f => path.relative(ROOT, f)).sort();
    const theirs = walk(path.join(tmp, 'sat-act-math')).map(f => path.relative(tmp, f)).sort();
    if (JSON.stringify(ours) !== JSON.stringify(theirs)) diff.push('page list');
    for (const rel of [...theirs, 'assets/sat-act/catalog.js', 'sitemap.xml']) {
      const a = path.join(ROOT, rel), b = path.join(tmp, rel);
      if (!fs.existsSync(a) || !fs.existsSync(b) || !fs.readFileSync(a).equals(fs.readFileSync(b))) diff.push(rel);
    }
    check(!diff.length, `committed output differs from a fresh build: ${diff.join(', ')} (run npm run sat-act:build)`);
    stats.deterministicRebuild = diff.length ? 'FAIL' : 'identical';
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ------------------------------------------------------------------ analytics contract (real tracker in a sandbox)
{
  const tracker = read('assets/problem-tracking.js');
  const runtime = read('assets/sat-act/sat-act-practice.js');
  check(!runtime.includes('Math.random'), 'runtime: raw Math.random');
  check(runtime.includes("engineId: 'sat_act_library'") && runtime.includes("course: 'sat_act_math'"), 'runtime: analytics engine identity');
  for (const forbidden of ['answer_text', 'selected_choice', 'choice_label', 'user_answer']) check(!runtime.includes(forbidden), `runtime: sends ${forbidden}`);
  const events = [];
  const store = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
  const doc = { body: null, visibilityState: 'visible', getElementById: () => null, createElement: () => ({ setAttribute() {}, style: {}, appendChild() {}, addEventListener() {} }), addEventListener() {} };
  const win = { BM_ANALYTICS_CONFIG: { course: 'sat_act_math', engineId: 'sat_act_library', generatorVersion: '1' }, location: { search: '' }, addEventListener() {}, gtag: (...a) => events.push(a) };
  const sb = { window: win, document: doc, navigator: { onLine: true }, localStorage: store(), sessionStorage: store(), URLSearchParams, console, setTimeout: () => 0, clearTimeout() {}, Date, JSON, Object, String, Number, Array, Math };
  vm.createContext(sb);
  vm.runInContext(tracker, sb, { filename: 'problem-tracking.js' });
  const A = sb.window.BMAnalytics;
  const meta = { id: 'qa', problemType: 'right-triangle-trig', problemVariant: 'right-triangle-trig-s0031' };
  A.answerChecked(meta, true, { problem_id: 'right-triangle-trig-s0031', attempt_number: 1 });
  let names = events.map(e => e[1]);
  check(names.join() === 'answer_checked,answer_correct', `tracker contract changed: ${names}`);
  events.length = 0;
  check(A.trackEvent('explanation_video_start', meta, { start_seconds: 19 }) === true, 'trackEvent rejected a valid event');
  const ev = events[0] || [];
  check(ev[1] === 'explanation_video_start' && ev[2].engine_id === 'sat_act_library' && ev[2].problem_type === 'right_triangle_trig' &&
    ev[2].problem_variant === 'right_triangle_trig_s0031' && ev[2].start_seconds === 19 && ev[2].app_version, 'trackEvent params');
  for (const bad of ['answer_correct', 'answer_checked', 'practice_started', 'problem_generated', 'solution_revealed', 'Bad-Name', 'ga_x', 'x']) {
    check(A.trackEvent(bad, meta, {}) === false, `trackEvent accepted reserved or invalid name ${bad}`);
  }
  check(events.length === 1, 'reserved or invalid names must not emit');
  stats.analyticsContract = 'pass';
}

// ------------------------------------------------------------------ production importer refuses unapproved content
{
  const base = lib.problems[0].record;
  const sourceRecord = {
    id: base.sourceId, series: base.series, topic: base.topicLabel, classification: base.classification,
    template: Object.assign({ format: base.format, difficulty: base.difficulty }, base.template), question: base.question,
    figure: base.figure || undefined, choices: base.choices.map(c => ({ label: c.label, display: c.display, note: c.note, why: c.why, rationale: c.rationale })),
    answer: base.answer, solution: { steps: base.solution.steps, key_idea: base.solution.keyIdea, summary: base.solution.summary },
    meta: base.meta, status: 'verified', content_hash: base.provenance.contentHash,
    verification: { passed: true, n_checks: base.provenance.verification.checks, n_failed: 0, tools: {} }, quality: { passed: true, errors: [], flags: [] }
  };
  if (base.rightAngle) sourceRecord.question = Object.assign({}, base.question, { spec: { right_angle: base.rightAngle } });
  const first = base.solution.steps[0].id;
  const sceneJson = JSON.stringify({ duration: 60, root: { type: 'box', children: [
    { type: 'timer', t0: 10, d: 7, anims: [{ type: 'in', t: 10 }, { type: 'out', t: 17 }] },
    { type: 'box', anims: [{ type: 'in', t: 17.5 }] }] } });
  const media = 'a'.repeat(64);
  let sceneDigest;
  try { sceneDigest = pythonCanonicalDigest(Buffer.from(sceneJson)); } catch (e) { sceneDigest = null; notes.push('python3 unavailable: approved-import video checks skipped'); }
  const manifest = { id: `${base.sourceId}-narrated`, source_id: base.sourceId, content_hash: base.provenance.contentHash, duration: 60,
    narration: { segments: [{ seg: 'question', key: 'question:0', t: 1, dur: 3 }, { seg: 'pause', key: 'pause:0', t: 10.5, dur: 1.5 }, { seg: first, key: `${first}:0`, t: 18.2, dur: 2 }] },
    release_provenance: { media_hash: media, scene_hash: sceneDigest } };
  // Synthetic taxonomy text for the gate test only: every skill of the test record sits under its topic.
  const topicIndex = lib.taxonomy.subjects.findIndex(s => s.sourceTopic === base.classification.topic);
  const skillLines = Object.entries(base.skillNames).map(([id, name]) => `Skill("${id}", "${name}", TOPICS[${topicIndex}])`);
  const taxonomyText = `TOPICS = [\n${lib.taxonomy.subjects.map(s => `    "${s.sourceTopic}",`).join('\n')}\n]\n${skillLines.join('\n')}\n`;
  const decision = extra => Object.assign({ decision: 'approved', releaseEligible: true, reviewer: 'qa-synthetic', approvedRevision: 'rev-text-1', decidedAt: '2026-11-17T12:00:00Z' }, extra);
  const makeExport = (mut = {}) => ({
    schema: EXPORT_SCHEMA, exportedAt: '2026-11-17T12:00:00Z',
    source: { repository: 'batchmath/Shorts', commit: base.provenance.commit, taxonomy: taxonomyText },
    items: [{
      recordJson: JSON.stringify(Object.assign({}, sourceRecord, mut.record || {})),
      text: decision(Object.assign({ contentHash: base.provenance.contentHash }, mut.text || {})),
      video: mut.noVideo ? undefined : decision(Object.assign({ approvedRevision: 'rev-video-1', textApprovedRevision: 'rev-text-1', mediaSha256: media,
        manifestJson: JSON.stringify(manifest), sceneJson }, mut.video || {}))
    }]
  });
  const pubs = list => ({ schema: 'batchmath.sat-act.youtube-publications/1', publications: list });
  const goodPub = { sourceId: base.sourceId, youtubeId: 'Abc_123-xyZ', mediaSha256: media, publishedOn: '2026-11-18' };
  const attempt = (label, exportData, publications, expectOk) => {
    try {
      const out = importApprovedExport({ exportData, publications, registry: lib.registry, outDir: '', write: false });
      check(expectOk, `approved importer accepted: ${label}`);
      return out;
    } catch (e) {
      if (!(e instanceof ImportError)) throw e;
      check(!expectOk, `approved importer refused a valid export (${label}): ${e.message}`);
      return null;
    }
  };
  if (sceneDigest) {
    const ok = attempt('valid approved export with publication', makeExport(), pubs([goodPub]), true);
    if (ok) {
      const w = ok[0];
      check(w.contentStatus === 'approved' && w.video.youtubeId === goodPub.youtubeId && w.video.explanationStartSeconds === 17 && w.approval.releaseEligible === true,
        'approved importer output');
      check(!JSON.stringify(w).includes('qa-synthetic'), 'approved importer stored a reviewer identity');
    }
    attempt('approved export without a publication (no video ID)', makeExport(), pubs([]), true);
    attempt('text decision rejected', makeExport({ text: { decision: 'rejected' } }), pubs([]), false);
    attempt('not release eligible', makeExport({ text: { releaseEligible: false } }), pubs([]), false);
    attempt('no reviewer recorded', makeExport({ text: { reviewer: '' } }), pubs([]), false);
    attempt('approval for different content', makeExport({ text: { contentHash: 'ffffffffffffffff' } }), pubs([]), false);
    attempt('unverified record', makeExport({ record: { status: 'draft' } }), pubs([]), false);
    attempt('video approval bound to another text revision', makeExport({ video: { textApprovedRevision: 'rev-text-0' } }), pubs([]), false);
    attempt('approved MP4 differs from manifest', makeExport({ video: { mediaSha256: 'b'.repeat(64) } }), pubs([]), false);
    attempt('published MP4 is not the approved MP4', makeExport(), pubs([Object.assign({}, goodPub, { mediaSha256: 'c'.repeat(64) })]), false);
    attempt('invented / malformed YouTube ID', makeExport(), pubs([Object.assign({}, goodPub, { youtubeId: 'not-an-id' })]), false);
    attempt('publication without an approved video', makeExport({ noVideo: true }), pubs([goodPub]), false);
    attempt('unregistered problem', makeExport({ record: { id: 'unregistered-s0001' } }), pubs([]), false);
    stats.approvedImporterGateCases = 13;
  }
}

// ------------------------------------------------------------------ initial website authorization and publication
{
  const json = file => JSON.parse(read(`tools/sat-act/config/${file}.json`));
  const release = json('initial-website-release');
  const source = json('dev-fixture-source');
  const records = new Map(lib.problems.map(p => [p.id, p.record]));
  const { registry } = lib;
  if (release.records.every(r => records.get(r.sourceId)?.contentStatus === 'development-fixture')) {
    const auth = { decision: 'authorize-website-publication', owner: 'QA only', authorizedOn: '2026-11-17', recordsSha256: sha256(stableJson(release.records)) };
    const authorizedRelease = { ...release, authorization: auth };
    const { sourceId } = release.records[0];
    const record = records.get(sourceId);
    const publication = { sourceId, youtubeId: 'Abc_123-xyZ', mediaSha256: record.video.mediaSha256, publishedOn: '2026-11-17' };
    const publications = entries => ({ schema: 'batchmath.sat-act.youtube-publications/1', initialWebsitePublications: entries });
    const input = { release: authorizedRelease, source, publications: publications([]), records, registry };
    const linked = initialWebsiteRelease({ ...input, publications: publications([publication]) });
    check(linked.authorized.size === 5 && linked.links.get(sourceId).explanationStartSeconds === record.video.explanationStartSeconds,
      'initial website authorization or audited upload did not resolve');
    check(!record.approval.text && !record.approval.video && !record.video.youtubeId, 'website authorization changed Shorts record state');
    const pending = initialWebsiteRelease({ ...input, release: { ...release, authorization: null } });
    check(pending.authorized.size === 0 && pending.links.size === 0, 'pending authorization unexpectedly released questions or videos');

    const rejects = (overrides, message) => {
      try {
        initialWebsiteRelease({ ...input, ...overrides });
        fail(`initial website release accepted ${message}`);
      } catch (e) {
        if (!(e instanceof ImportError)) throw e;
      }
    };
    rejects({ release: { ...authorizedRelease, authorization: { ...auth, recordsSha256: '0'.repeat(64) } } }, 'signoff for another record set');
    rejects({ release: { ...authorizedRelease, authorization: { ...auth, owner: '' } } }, 'signoff without an owner');
    rejects({ records: new Map(records).set(sourceId, { ...record, question: { ...record.question, prompt: 'Changed' } }) }, 'changed verified text');
    rejects({ records: new Map([...records].filter(([id]) => id !== sourceId)) }, 'missing signed question');
    rejects({ publications: publications([{ ...publication, mediaSha256: '0'.repeat(64) }]) }, 'upload with a different MP4 hash');
    rejects({ publications: publications([{ ...publication, youtubeId: 'bad-id' }]) }, 'malformed ID');
    rejects({ publications: publications([{ ...publication, publishedOn: '2026-11-31' }]) }, 'invalid upload date');
    rejects({ publications: publications([{ ...publication, sourceId: 'qa-extra' }]) }, 'upload outside the five records');
    rejects({ publications: publications([publication, publication]) }, 'duplicate upload');
    stats.initialWebsiteRelease = 'pending, signed and 9 refusal cases checked';
  }
}

// ------------------------------------------------------------------ release gate
if (RELEASE) {
  for (const p of lib.problems) {
    check(p.releaseAuthorized, `RELEASE GATE: #${p.displayNumber} ${p.id} has no recorded authorization for website publication`);
  }
  check(lib.releaseReady, 'RELEASE GATE: signoff is pending. See docs/sat-act/PUBLISHING-WORKFLOW.md');
}

const lines = [`SAT & ACT Math Practice QA${RELEASE ? ' (release gate)' : ''}`, `Result: ${errors.length ? 'FAIL' : 'PASS'}`, '',
  ...Object.entries(stats).map(([k, v]) => `${k}: ${v}`), '', `Notes: ${notes.length}`, ...notes.map(n => '- ' + n), '',
  `Errors: ${errors.length}`, ...errors.map(e => '- ' + e), ''];
fs.mkdirSync(path.join(ROOT, 'qa-results'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'qa-results', RELEASE ? 'sat-act-release-gate.txt' : 'sat-act-qa.txt'), lines.join('\n'));
console.log(lines.join('\n'));
if (errors.length) process.exit(1);
