import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {
  UNITS, pageInfo, unitRoute, sectionRoute, sequence, sectionLabel, partLabel,
} from '../im1-nav/structure.mjs';
import {all, first, document, attr, has, hasClass, tagged, label, source} from './html.mjs';

const ORIGIN = 'https://batchmath.net';
const ROOT = process.cwd();
const baseline = process.env.BM_NAV_BASELINE;
const publicRoots = ['ap-calculus', 'im1', 'calculus-prep', 'sat-act-math', 'archive', 'mogollon2026', 'about'];
function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const files = ['index.html', ...publicRoots.flatMap(walk)];
const pageFiles = files.filter(file => file.endsWith('.html'));
const originOf = filename => new URL('/' + filename.replace(/index\.html$/, ''), ORIGIN);
const destination = (url, filename) => {
  const resolved = new URL(url, originOf(filename));
  if (resolved.origin !== ORIGIN) return null;
  const local = decodeURIComponent(resolved.pathname.slice(1));
  return {file: local && !local.endsWith('/') ? local : local + 'index.html', hash: resolved.hash.slice(1)};
};
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const isEngine = html => /\bBM_ANALYTICS_CONFIG\s*=/.test(html) &&
  /<script\b[^>]*\bsrc=["'][^"']*\bproblem-tracking\.js/.test(html);
const engineFiles = new Set(pageFiles.filter(file => isEngine(read(file))));
const seen = new Map();
function markup(doc, html, condition) {
  return all(doc, node => node.sourceCodeLocation && condition(node)).map(node => source(html, node));
}
const scripts = node => tagged(node, 'script') && attr(node, 'type') !== 'application/ld+json' &&
  attr(node, 'src') !== '/assets/site-navigation.js';
const videos = node => has(node, 'data-video-id') || tagged(node, 'iframe') && /youtube/.test(attr(node, 'src'));
const options = node => tagged(node, 'select') && (hasClass(node, 'bm-practice-select') ||
  hasClass(node, 'bm-satact-filter'));
const engineControls = doc => all(doc, options).map(node => [attr(node, 'id'),
  all(node, child => tagged(child, 'option')).map(opt => [attr(opt, 'value'), has(opt, 'selected')])]);
const checksum = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

for (const unit of UNITS) {
  assert.deepEqual(unit.sections.map(section => section.n), [1, 2, 3, 4]);
  for (const section of unit.sections) {
    assert.ok(fs.existsSync(sectionRoute(unit, section).slice(1) + 'index.html'));
    const codes = section.topics.flatMap(topic => topic.parts.map(part => part.code));
    assert.deepEqual(codes, codes.map((_, i) => section.n + String.fromCharCode(65 + i)));
  }
  for (const entry of sequence(unit)) assert.ok(fs.existsSync(entry.route.slice(1) + 'index.html'), entry.route);
  assert.ok(fs.existsSync(unitRoute(unit).slice(1) + 'index.html'));
}

let menus = 0;
let related = 0;
let practiceLaunch = 0;
let videoEmbeds = 0;
for (const file of pageFiles) {
  const html = read(file);
  const {tree, main} = document(html);
  const menu = first(main, node => hasClass(node, 'bm-topics'));
  const launch = first(main, node => attr(node, 'id') === 'topic-practice');
  const relatedNav = first(main, node => has(node, 'data-bm-related-practice'));
  const hrefs = node => all(node, child => tagged(child, 'a') && has(child, 'href'));
  const targetFiles = node => hrefs(node).map(child => destination(attr(child, 'href'), file)?.file);
  if (menu) {
    menus++;
    assert.ok(!all(main, node => tagged(node, 'label')).some(node => /^Jump to topic\b/i.test(label(node))), file);
    assert.ok(!file.startsWith('sat-act-math/'), file);
    assert.ok(all(menu, node => has(node, 'aria-current')).length <= 1, file);
  }
  if (launch) {
    practiceLaunch++;
    const pages = targetFiles(launch);
    assert.ok(pages.length && pages.every(target => engineFiles.has(target)), file);
    assert.equal(new Set(pages).size, pages.length, file);
    const lesson = first(main, videos);
    if (lesson) assert.ok(launch.sourceCodeLocation.startOffset < lesson.sourceCodeLocation.startOffset, file);
  }
  if (relatedNav) {
    related++;
    assert.ok(engineFiles.has(file), file);
    assert.ok(!targetFiles(relatedNav).includes(file), file);
  }

  for (const nav of [menu, launch, relatedNav].filter(Boolean)) for (const a of hrefs(nav)) {
    const target = destination(attr(a, 'href'), file);
    assert.ok(target && fs.existsSync(target.file), file + ' → ' + attr(a, 'href'));
    if (target.hash) assert.ok(first(document(read(target.file)).tree, node => attr(node, 'id') === target.hash),
      file + ' → #' + target.hash);
  }
  const info = pageInfo(file);
  if (info) {
    const {unit} = info;
    assert.ok(menu, file);
    const breadcrumbs = first(main, node => hasClass(node, 'bm-breadcrumbs'));
    assert.deepEqual(all(breadcrumbs, node => tagged(node, 'li')).map(label), info.crumbs.map(crumb => crumb.name), file);
    const metadata = first(tree, node => attr(node, 'type') === 'application/ld+json');
    const ld = JSON.parse(label(metadata))['@graph'].find(node => node['@type'] === 'BreadcrumbList');
    assert.deepEqual(ld.itemListElement.map(item => item.name), info.crumbs.map(crumb => crumb.name), file);
    const labels = hrefs(menu).map(label);
    const expected = [...unit.sections.flatMap(section => [sectionLabel(section),
      ...section.topics.flatMap(topic => topic.parts.map(partLabel))]), unit.review.title];
    assert.deepEqual(labels, expected, file);
    const visible = all(main, node => /^h[1-6]$/.test(node.tagName) || tagged(node, 'option') || tagged(node, 'a') ||
      hasClass(node, 'resource-title')).map(label).join(' ');
    assert.doesNotMatch(visible, /\b0\d[A-Z]\b|\bSection [A-Z]\b|\bPart [A-Z]\b|\bstudent notes\b/i, file);
    const parent = file.replace(/\/practice\/index.html$/, '/index.html');
    if (engineFiles.has(file)) {
      assert.ok(relatedNav, file);
      assert.ok(targetFiles(relatedNav).includes(parent), file);
    }
  }

  if (!baseline || !fs.existsSync(path.join(baseline, file))) continue;
  const old = fs.readFileSync(path.join(baseline, file), 'utf8');
  const before = document(old);
  const oldEmbeds = markup(before.tree, old, videos);
  assert.deepEqual(markup(tree, html, videos), oldEmbeds, file + ' video markup');
  videoEmbeds += oldEmbeds.length;
  assert.deepEqual(markup(tree, html, scripts), markup(before.tree, old, scripts), file + ' scripts');
  assert.deepEqual(engineControls(tree), engineControls(before.tree), file + ' Practice Type values');
  if (!file.startsWith('im1/')) {
    assert.deepEqual(markup(tree, html, options), markup(before.tree, old, options), file + ' Practice Type markup');
    const heading = node => tagged(node, 'h1');
    if (file.startsWith('ap-calculus/') || file.startsWith('calculus-prep/')) {
      assert.deepEqual(markup(tree, html, heading), markup(before.tree, old, heading), file + ' course heading');
    }
  }
  if (isEngine(old)) {
    const legacyId = old.match(/engineId:"([^"]+)"/)?.[1];
    assert.ok(legacyId && !seen.has(legacyId), file);
    seen.set(legacyId, file);
    assert.ok(engineFiles.has(file), file);
  }
}

const unit4Documents = JSON.parse(read('tools/im1-unit4/pdf-manifest.json'));
assert.equal(unit4Documents.filter(entry => entry.kind === 'assignment').length, 23);
assert.equal(unit4Documents.filter(entry => entry.kind === 'answer-key').length, 23);
for (const entry of unit4Documents) assert.equal(checksum(entry.published), entry.sha256, entry.published);
const im1Files = files.filter(file => file.startsWith('im1/'));
assert.ok(im1Files.every(file => !/\/notes?\/|notes?\.pdf$/i.test(file)));
assert.equal([...engineFiles].filter(file => file.startsWith('im1/unit-4-')).length, 22);
assert.ok(!im1Files.some(file => file.startsWith('im1/unit-4-') && /^(?:01f|02e|03i|04e|05c)-/.test(path.basename(file))), 'a retired Unit 4 document is public');
let removedNotes = 0;
if (baseline) {
  const baselineFiles = publicRoots.flatMap(root => walk(path.join(baseline, root)));
  for (const old of baselineFiles) {
    const file = path.relative(baseline, old);
    if (!file.endsWith('.pdf')) continue;
    if (/^im1\/.*\/resources\/notes\//.test(file)) {
      assert.ok(!fs.existsSync(file), file);
      removedNotes++;
    } else {
      assert.equal(checksum(file), checksum(old), file);
    }
  }
  assert.equal(removedNotes, 12);
  assert.equal(seen.size, engineFiles.size);
}
assert.equal(related, engineFiles.size, 'each first-party practice page has related links');
console.log(JSON.stringify({menus, practiceLaunch, related, enginePages: engineFiles.size, videoEmbeds, removedNotes,
  unit4Pdfs: unit4Documents.length, baseline: !!baseline}, null, 2));
