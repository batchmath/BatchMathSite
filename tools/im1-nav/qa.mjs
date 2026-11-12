// Integrated Math 1 navigation QA (no browser): checks every IM1 page against the IM1 navigation standard
// (docs/IM1-NAVIGATION-STANDARD.md, tools/im1-nav/structure.mjs).
//  - structure: four sections per unit; part codes 1A, 1B, ... in order, unique, no leading zeros; reviews last
//  - every IM1 page belongs to the structure and matches it exactly (tools/im1-nav/apply.mjs --check)
//  - visible text: no zero-padded codes, lettered sections, bare "Part A", Section 5+, or student notes
//  - "Jump to topic" menus: Section 1-4 optgroups then Unit Review; every option resolves (anchors included)
//  - breadcrumbs: visible trail = JSON-LD trail, every link resolves; titles <= 85 characters and unique
//  - every internal link and asset on IM1 pages resolves; every published IM1 PDF is linked
//  - no student notes anywhere in im1/; Unit 4's 56 PDFs are the supplied files (SHA-256) and correctly paired
//  - practice engines: every published engine page exists and is linked from its topic page
//  - instructional videos: each mapped video sits on its page exactly once, in the block markup.mjs writes; with
//    IM1_VIDEO_BASE=<git ref> (default origin/main, the deployed site) every IM1 video block equals that ref's, byte for byte
// Usage: node tools/im1-nav/qa.mjs     (report in qa-results/im1-nav-qa.json)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {UNITS, pageInfo, sectionLabel, partLabel, topicLabel, reviewRoute, topicRoute, sectionRoute, unitRoute, sequence, partAnchor} from './structure.mjs';
import {withInstructionalVideo} from '../v13-im1-videos/markup.mjs';

const ROOT = process.cwd(), errors = [], warnings = [], stats = {};
const fail = m => errors.push(m);
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8217;/g, '’');
const text = s => decode(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

const files = [];
(function walk(dir) {for (const e of fs.readdirSync(path.join(ROOT, dir), {withFileTypes: true})) {
 const rel = `${dir}/${e.name}`; if (e.isDirectory()) walk(rel); else files.push(rel);}})('im1');
const pages = files.filter(f => f.endsWith('/index.html') && f !== 'im1/index.html').sort();
stats.im1Pages = pages.length + 1;

// ---- structure rules ----
for (const u of UNITS) {
 if (u.sections.length !== 4 || u.sections.some((s, i) => s.n !== i + 1)) fail(`Unit ${u.n}: expected Sections 1-4, found ${u.sections.map(s => s.n)}`);
 const codes = [];
 for (const s of u.sections) {
  const parts = s.topics.flatMap(t => t.parts);
  parts.forEach((p, i) => {
   const want = `${s.n}${String.fromCharCode(65 + i)}`;
   if (p.code !== want) fail(`Unit ${u.n} Section ${s.n}: part ${i + 1} is ${p.code}, expected ${want}`);
   if (/^0/.test(p.code)) fail(`Unit ${u.n}: zero-padded code ${p.code}`);
   codes.push(p.code);
  });
  const firstReview = s.topics.findIndex(t => t.review);
  if (firstReview >= 0 && s.topics.slice(firstReview).some(t => !t.review)) fail(`Unit ${u.n} Section ${s.n}: a section review must come after the lessons`);
 }
 if (new Set(codes).size !== codes.length) fail(`Unit ${u.n}: duplicate part codes`);
 if (!/^Unit \d+ Comprehensive Review$/.test(u.review.title) || u.review.title !== `Unit ${u.n} Comprehensive Review`) fail(`Unit ${u.n}: unit review must be "Unit ${u.n} Comprehensive Review"`);
 stats[`unit${u.n}Parts`] = codes.length;
}

// ---- every page is in the structure and matches it exactly ----
for (const rel of pages) if (!pageInfo(rel)) fail(`${rel}: not in tools/im1-nav/structure.mjs`);
for (const u of UNITS) {
 for (const route of [unitRoute(u), ...u.sections.map(s => sectionRoute(u, s)), ...sequence(u).map(x => x.route), ...(u.extras || []).map(x => unitRoute(u) + x.path)])
  if (!exists(`${route.slice(1)}index.html`)) fail(`missing IM1 page ${route}`);
}
try {execFileSync(process.execPath, ['tools/im1-nav/apply.mjs', '--check'], {cwd: ROOT, encoding: 'utf8'}); stats.pagesMatchingStandard = pages.length;}
catch (e) {fail(`pages differ from the standard (node tools/im1-nav/apply.mjs --check):\n${e.stdout}`);}

// ---- per-page checks ----
const titles = new Map(), linked = new Set();
let menus = 0, options = 0, internalLinks = 0, crumbTrails = 0;
const resolve = (rel, url) => {
 const [p, hash] = url.split('#');
 const base = '/' + path.posix.dirname(rel) + '/';
 let target = p.startsWith('/') ? p : path.posix.normalize(path.posix.join(base, p));
 if (p === '') target = '/' + rel;
 if (target.endsWith('/')) target += 'index.html';
 return {file: target.replace(/^\//, ''), hash};
};
for (const rel of ['im1/index.html', ...pages]) {
 const html = read(rel), info = pageInfo(rel);
 const visible = text([
  (html.match(/<title>[\s\S]*?<\/title>/) || [''])[0],
  ...[...html.matchAll(/<meta (?:property|name)="(?:og:title|twitter:title|description|og:description|twitter:description)" content="([^"]*)"/g)].map(m => `<x>${m[1]}</x>`),
  ...[...html.matchAll(/"name":"([^"]*)"/g)].map(m => `<x>${m[1]}</x>`),
  ...[...html.matchAll(/(?:aria-label|label)="([^"]*)"/g)].map(m => `<x>${m[1]}</x>`),
  html.slice(html.indexOf('<body'), html.lastIndexOf('</body>')).replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<style\b[\s\S]*?<\/style>/g, '')
 ].join(' '));
 for (const [re, what] of [[/\b0\d[A-Z]\b/, 'a zero-padded part code'], [/\bSection [A-Z]\b/, 'a lettered section'], [/\bPart [A-Z]\b/, 'a bare "Part" label'],
  [/\bSection (?:[5-9]|\d\d)\b/, 'a section beyond Section 4'], [/\bnotes?\b/i, 'student notes']]) {
  const m = visible.match(re); if (m) fail(`${rel}: shows ${what} ("…${visible.slice(Math.max(0, m.index - 40), m.index + 40)}…")`);
 }
 const title = text((html.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]);
 if (title.length > 85) fail(`${rel}: title longer than 85 characters`);
 if (titles.has(title)) fail(`${rel}: title duplicates ${titles.get(title)}`); titles.set(title, rel);
 // breadcrumbs
 const crumbNav = (html.match(/<nav class="bm-breadcrumbs"[\s\S]*?<\/nav>/) || [''])[0];
 const visibleCrumbs = [...crumbNav.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m => text(m[1]));
 const ld = JSON.parse((html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/) || [, '{}'])[1]);
 const list = (ld['@graph'] || []).find(n => n['@type'] === 'BreadcrumbList');
 if (rel !== 'im1/index.html') {
  if (!list || JSON.stringify(list.itemListElement.map(i => i.name)) !== JSON.stringify(visibleCrumbs)) fail(`${rel}: visible breadcrumbs differ from JSON-LD`);
  if (info && JSON.stringify(info.crumbs.map(c => c.name)) !== JSON.stringify(visibleCrumbs)) fail(`${rel}: breadcrumbs differ from the standard`);
  if (list && list.itemListElement.at(-1).item !== `https://batchmath.net/${rel.replace(/index\.html$/, '')}`) fail(`${rel}: breadcrumb trail does not end at the page`);
  crumbTrails++;
 }
 // menus
 const menu = html.match(/<label for="unit-select">Jump to topic:<\/label><select[^>]*>([\s\S]*?)<\/select>/);
 if (info && ['unit', 'section', 'topic', 'review'].includes(info.kind)) {
  if (!menu) fail(`${rel}: no "Jump to topic" menu`);
  else {
   menus++;
   const u = info.unit, groups = [...menu[1].matchAll(/<optgroup label="([^"]*)"/g)].map(m => decode(m[1]));
   const want = [...u.sections.map(sectionLabel), 'Unit Review'];
   if (JSON.stringify(groups) !== JSON.stringify(want)) fail(`${rel}: menu groups ${JSON.stringify(groups)}`);
   const opts = [...menu[1].matchAll(/<option value="([^"]*)"( selected)?>([^<]*)<\/option>/g)].map(m => ({value: m[1], selected: !!m[2], label: decode(m[3])}));
   const labels = opts.filter(o => o.value).map(o => o.label), wantLabels = [...u.sections.flatMap(s => s.topics.flatMap(t => t.parts.map(partLabel))), u.review.title];
   if (JSON.stringify(labels) !== JSON.stringify(wantLabels)) fail(`${rel}: menu options differ from the standard`);
   const selected = opts.filter(o => o.selected);
   if (['topic', 'review'].includes(info.kind) ? selected.length !== 1 || resolve(rel, selected[0].value).file !== rel : selected.length) fail(`${rel}: wrong selected menu option`);
   for (const o of opts.filter(x => x.value)) {
    options++;
    const {file, hash} = resolve(rel, o.value);
    if (!exists(file)) fail(`${rel}: menu option ${o.label} -> missing ${file}`);
    else if (hash && !read(file).includes(`id="${hash}"`)) fail(`${rel}: menu option ${o.label} -> missing anchor #${hash}`);
   }
  }
 }
 // every internal link and asset resolves
 for (const m of html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
  const url = m[1];
  if (/^(?:https?:|mailto:|tel:|data:|javascript:)/.test(url)) continue;
  const {file, hash} = resolve(rel, url.split('?')[0]);
  internalLinks++;
  if (!exists(file)) fail(`${rel}: broken link ${url}`);
  else if (hash && file.endsWith('.html') && !read(file).includes(`id="${hash}"`)) fail(`${rel}: missing anchor ${url}`);
  if (file.endsWith('.pdf')) linked.add(file);
  if (/notes?/i.test(url.replace(/[^/]*\.html$/, ''))) fail(`${rel}: link to notes ${url}`);
 }
 // the pager follows the structure
 if (info && ['topic', 'review'].includes(info.kind)) {
  const seq = sequence(info.unit), i = seq.findIndex(x => x.route === info.route);
  const pager = (html.match(/<nav (?:class="topic-pager" aria-label="[^"]*"|aria-label="[^"]*" class="topic-pager")>([\s\S]*?)<\/nav>/) || [, ''])[1];
  const got = [...pager.matchAll(/<a [^>]*>([^<]*)<\/a>/g)].map(m => decode(m[1]));
  const want = [...(seq[i - 1] ? [`← ${seq[i - 1].label}`] : []), ...(seq[i + 1] ? [`${seq[i + 1].label} →`] : [])];
  if (JSON.stringify(got) !== JSON.stringify(want)) fail(`${rel}: previous/next links ${JSON.stringify(got)}`);
 }
}
Object.assign(stats, {topicMenus: menus, menuOptionsResolved: options, internalLinksResolved: internalLinks, breadcrumbTrails: crumbTrails});

// ---- PDFs and notes ----
const pdfs = files.filter(f => f.endsWith('.pdf'));
for (const f of pdfs) if (!linked.has(f)) fail(`${f}: published but not linked from any IM1 page`);
for (const f of files) if (/notes?/i.test(f)) fail(`${f}: student notes must not be published`);
if (files.some(f => /\.docx$/i.test(f))) fail('a DOCX source is published under im1/');
stats.im1Pdfs = pdfs.length;
const manifest = JSON.parse(read('tools/im1-unit4/pdf-manifest.json'));
const u4pdfs = pdfs.filter(f => f.startsWith('im1/unit-4-exponential-functions/'));
if (u4pdfs.length !== 56 || manifest.length !== 56) fail(`Unit 4: expected 56 PDFs, found ${u4pdfs.length}`);
for (const m of manifest) {
 if (!exists(m.published)) {fail(`Unit 4: missing ${m.published}`); continue;}
 const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, m.published))).digest('hex');
 if (sha !== m.sha256) fail(`Unit 4: ${m.published} is not the supplied file`);
 if (m.kind === 'assignment' && !manifest.some(k => k.kind === 'answer-key' && k.code === m.code && k.published === m.published.replace('/assignments/', '/answer-keys/').replace(/\.pdf$/, '-answer-key.pdf'))) fail(`Unit 4: ${m.code} has no matching answer key`);
}
stats.unit4PdfsVerified = manifest.length;

// ---- practice engines ----
const practice = pages.filter(p => /\/practice\/index\.html$/.test(p));
const expectedPractice = {1: 11, 2: 7, 3: 23, 4: 0};
for (const u of UNITS) {
 const n = practice.filter(p => p.startsWith(u.dir + '/')).length;
 if (n !== expectedPractice[u.n]) fail(`Unit ${u.n}: ${n} practice pages, expected ${expectedPractice[u.n]}`);
 for (const x of sequence(u)) {
  const page = `${x.route.slice(1)}index.html`, engine = `${x.route.slice(1)}practice/index.html`;
  if (exists(engine) && !/data-bm-resource="practice" href="practice\/(?:\?[^"]*)?"/.test(read(page))) fail(`${page}: practice engine not linked`);
  if (!exists(engine) && /data-bm-resource="practice"/.test(read(page))) fail(`${page}: practice button without an engine`);
 }
}
stats.practicePages = practice.length;

// ---- instructional videos ----
const {videos} = JSON.parse(read('tools/v13-im1-videos/videos.json'));
const block = s => (s.match(/<section class="video-section lecture-section im1-video-section"[\s\S]*?<\/section>/) || [])[0];
for (const v of videos) {
 const s = read(v.path), slug = v.path.split('/').at(-2);
 if ((s.match(/data-video-id=/g) || []).length !== 1 || !s.includes(`data-video-id="${v.id}"`)) fail(`${v.path}: video ${v.id} missing or duplicated`);
 const expected = block(withInstructionalVideo('<head></head><section class="resource-section">', slug));
 if (block(s) !== expected) fail(`${v.path}: video block differs from tools/v13-im1-videos/markup.mjs`);
 if ((s.match(/\/assets\/instructional-videos\.(?:js|css)/g) || []).length !== 2) fail(`${v.path}: video assets not loaded exactly once`);
}
stats.unit3VideosVerified = videos.length;
// compare with production: IM1_VIDEO_BASE, else origin/main (the deployed site), else main
const refOk = ref => {try {execFileSync('git', ['rev-parse', '--verify', '--quiet', ref + '^{commit}'], {cwd: ROOT, stdio: 'pipe'}); return true;} catch {return false;}};
let base = [process.env.IM1_VIDEO_BASE, 'origin/main', 'main'].filter(Boolean).find(refOk) || null;
if (base) {
 const allBlocks = s => [...s.matchAll(/<section class="video-section[\s\S]*?<\/section>/g)].map(m => m[0]).join('\n');
 const baseFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', base, 'im1'], {cwd: ROOT, encoding: 'utf8'}).split('\n').filter(f => f.endsWith('index.html'));
 let compared = 0, ids = 0;
 for (const f of baseFiles) {
  const old = execFileSync('git', ['show', `${base}:${f}`], {cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26});
  if (!/data-video-id=/.test(old)) continue;
  compared++; ids += (old.match(/data-video-id=/g) || []).length;
  if (!exists(f) || allBlocks(read(f)) !== allBlocks(old)) fail(`${f}: instructional videos differ from ${base}`);
 }
 for (const f of pages) if (/data-video-id=/.test(read(f)) && !baseFiles.includes(f)) fail(`${f}: has videos that ${base} does not`);
 Object.assign(stats, {videoBase: base, videoPagesComparedWithBase: compared, videoIdsComparedWithBase: ids});
} else warnings.push('video comparison skipped: no git ref for production (set IM1_VIDEO_BASE)');

// ---- report ----
const report = {ok: !errors.length, generatedAt: new Date().toISOString(), stats, warnings, errors};
fs.mkdirSync(path.join(ROOT, 'qa-results'), {recursive: true});
fs.writeFileSync(path.join(ROOT, 'qa-results/im1-nav-qa.json'), JSON.stringify(report, null, 2) + '\n');
console.log(['BatchMath IM1 navigation QA', `Result: ${report.ok ? 'PASS' : 'FAIL'}`, ...Object.entries(stats).map(([k, v]) => `${k}: ${v}`),
 `Warnings: ${warnings.length}`, ...warnings.map(w => '- ' + w), `Errors: ${errors.length}`, ...errors.slice(0, 80).map(e => '- ' + e), ''].join('\n'));
if (errors.length) process.exit(1);
