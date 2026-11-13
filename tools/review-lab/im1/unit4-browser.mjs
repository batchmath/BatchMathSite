// IM1 Unit 4 (Exponential Functions) QA, in Chromium on the real pages, at 1366x900 and 390x844 (touch).
// Checks: all 27 pages load with one H1, one breadcrumb and no console errors or failed requests, and fit the screen;
// every document (23) appears exactly once with an assignment and an answer key of the same code; every PDF link (46)
// serves application/pdf with the SHA-256 recorded in tools/im1-unit4/pdf-manifest.json (the supplied file, byte for
// byte); no student notes or video players; a practice button on every assignment and review page (v13.0.I) and none
// on the unit and section pages; no retired mixed review (1F, 2E, 3I, 4E, 05C) anywhere; the topic menu and the
// previous/next pager work; the IM1 landing page, the Unit 1 unit menu and the home page list Unit 4.
// Usage: BM_PORT=<port of a server for the repository root> node tools/review-lab/im1/unit4-browser.mjs
//        (screenshots in $REVIEW_OUT/im1-unit4)
import fs from 'node:fs';
import crypto from 'node:crypto';
import {browser, context, outDir} from '../lib/browser.mjs';
import {UNITS, partLabel} from '../../im1-nav/structure.mjs';
// Labels follow the IM1 navigation standard: parts 1A-4D (files keep 01a-...), the unit review's two versions.
const U4 = UNITS.find(u => u.n === 4), MENU_OPTIONS = U4.sections.flatMap(s => s.topics.flatMap(t => t.parts)).length + 1;
const LABEL_OF_DOC = new Map([...U4.sections.flatMap(s => s.topics.flatMap(t => t.parts.map(p => [p.doc, partLabel(p)]))), ...U4.review.documents.map(d => [d.doc, d.title])]);
// these pages load no MathJax, so open them without the shared helper's MathJax wait
async function open(c, url) {const p = await c.newPage(), errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message));
 p.on('console', m => {if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push('console: ' + m.text());});
 await p.goto(url, {waitUntil: 'load'}); await p.waitForTimeout(150); p._errs = errs; return p;}
const PORT = +process.env.BM_PORT, BASE = `http://127.0.0.1:${PORT}`, UNIT = '/im1/unit-4-exponential-functions/';
const manifest = JSON.parse(fs.readFileSync('tools/im1-unit4/pdf-manifest.json', 'utf8'));
const shots = outDir('im1-unit4'), b = await browser(), out = {checks: 0, failures: [], pages: 0, pdfs: 0};
const ok = (c, m) => {out.checks++; if (!c) out.failures.push(m);};
const pages = [];
(function walk(d) {for (const e of fs.readdirSync(d, {withFileTypes: true})) {const p = `${d}/${e.name}`; if (e.isDirectory()) walk(p); else if (e.name === 'index.html' && !/\/practice$/.test(d)) pages.push('/' + p.replace(/index\.html$/, ''));}})('im1/unit-4-exponential-functions');
// v13.0.I: every assignment page, section review and the unit review has a practice engine (tested by
// unit4-practice-browser.mjs); the unit page and the four section pages have none.
const SECTION_PAGES = U4.sections.map(s => `${UNIT}topics/${s.slug}/`), practicePage = route => route.startsWith(UNIT + 'topics/') && !SECTION_PAGES.includes(route);
pages.sort();
ok(pages.length === 27, `expected 27 Unit 4 pages, found ${pages.length}`);
const seenCodes = new Map(), pdfLinks = new Set();
for (const [w, h, mob] of [[1366, 900, false], [390, 844, true]]) {
 const vp = `${w}x${h}`, c = await context(b, {width: w, height: h, mobile: mob});
 for (const route of pages) {
  const p = await open(c, BASE + route), failed = [];
  p.on('requestfailed', r => {if (r.url().startsWith(BASE)) failed.push(r.url());});
  p.on('response', r => {if (r.url().startsWith(BASE) && r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);});
  await p.waitForLoadState('load');
  const s = await p.evaluate(() => ({
   h1: [...document.querySelectorAll('h1')].map(e => e.textContent.trim()),
   crumbs: document.querySelectorAll('nav.bm-breadcrumbs').length,
   items: [...document.querySelectorAll('.resource-item')].map(i => ({title: i.querySelector('.resource-title')?.textContent.trim(),
    links: [...i.querySelectorAll('a')].map(a => ({kind: a.dataset.bmResource, href: a.href, text: a.textContent.trim(), target: a.target}))})),
   videos: document.querySelectorAll('[data-video-id], iframe, .video-section, [data-bm-videos]').length,
   practice: [...document.querySelectorAll('a')].filter(a => a.dataset.bmResource === 'practice' || /\/practice\//.test(a.getAttribute('href') || '')).length,
   notes: [...document.querySelectorAll('a')].filter(a => /notes?\b/i.test(a.textContent) || /notes?/i.test(a.getAttribute('href') || '')).length + (/\bnotes\b/i.test(document.querySelector('main').innerText) ? 1 : 0),
   pager: [...document.querySelectorAll('.topic-pager a')].map(a => a.href),
   options: [...document.querySelectorAll('#unit-select option')].map(o => o.value).filter(Boolean),
   overflow: document.documentElement.scrollWidth - window.innerWidth,
   title: document.title, mixed: /\bMixed\b|0?1F\b|0?2E\b|0?3I\b|0?4E\b|05C\b/.test(document.querySelector('main').innerText)}));
  ok(s.h1.length === 1, `${vp} ${route}: ${s.h1.length} H1`);
  ok(s.crumbs === 1, `${vp} ${route}: ${s.crumbs} breadcrumbs`);
  ok(s.videos === 0, `${vp} ${route}: video markup present`);
  ok(s.practice === (practicePage(route) ? 1 : 0), `${vp} ${route}: ${s.practice} practice links, expected ${practicePage(route) ? 1 : 0}`);
  ok(s.notes === 0, `${vp} ${route}: notes present`);
  ok(!s.mixed, `${vp} ${route}: a retired mixed review is mentioned`);
  ok(s.overflow <= 0, `${vp} ${route}: wider than the screen by ${s.overflow}px`);
  ok(s.options.length === MENU_OPTIONS, `${vp} ${route}: topic menu has ${s.options.length} options`);
  for (const it of s.items) {
   const [a, k] = [it.links.find(l => l.kind === 'assignment'), it.links.find(l => l.kind === 'answer-key')];
   const code = a ? a.href.split('/').pop().slice(0, 3).toUpperCase() : '';   // the document code in the file name (01A ...)
   ok(it.links.length === 2 && a && k, `${vp} ${route} ${it.title}: links ${JSON.stringify(it.links)}`);
   ok(LABEL_OF_DOC.get(code) === it.title, `${vp} ${route}: document ${code} is labeled "${it.title}", expected "${LABEL_OF_DOC.get(code)}"`);
   ok(a && k && k.href.split('/').pop() === a.href.split('/').pop().replace(/\.pdf$/, '-answer-key.pdf'), `${vp} ${route} ${it.title}: assignment/key mismatch`);
   ok(a && k && a.target === '_blank' && k.target === '_blank', `${vp} ${route} ${it.title}: PDFs should open in a new tab`);
   if (!mob) {seenCodes.set(code, (seenCodes.get(code) || 0) + 1); if (a) pdfLinks.add(a.href); if (k) pdfLinks.add(k.href);}
  }
  for (const href of s.pager) {const r = await p.request.get(href); ok(r.status() === 200, `${vp} ${route}: pager link ${href} -> ${r.status()}`);}
  for (const e of p._errs) ok(false, `${vp} ${route} console: ${e}`);
  for (const f of failed) ok(false, `${vp} ${route} failed request: ${f}`);
  if (['', 'topics/a-geometric-sequences/', 'topics/a-geometric-sequences/geometric-or-not/', 'topics/a-geometric-sequences/section-a-review/', 'topics/comprehensive-review/'].map(x => UNIT + x).includes(route))
   await p.screenshot({path: `${shots}/${route.replace(UNIT, '').replace(/\/$/, '').replace(/\//g, '_') || 'unit'}-${w}.png`, fullPage: true});
  out.pages++;
  await p.close();
 }
 // the topic menu navigates (unit page -> a topic)
 const p = await open(c, BASE + UNIT);
 const target = UNIT + 'topics/c-explicit-formulas-and-exponential-models/converting-recursive-to-explicit/';
 await Promise.all([p.waitForURL(BASE + target), p.selectOption('#unit-select', target)]);
 ok(p.url() === BASE + target, `${vp}: topic menu did not navigate (${p.url()})`);
 await p.close(); await c.close();
}
// every document once, every PDF the supplied file
ok(seenCodes.size === 23 && [...seenCodes.values()].every(n => n === 1), `documents shown: ${JSON.stringify([...seenCodes])}`);
ok(pdfLinks.size === 46, `distinct PDF links: ${pdfLinks.size}`);
// the retired mixed reviews are not served
for (const f of ['assignments/01f-section-a-comprehensive-review-mixed.pdf', 'assignments/05c-unit-4-comprehensive-review-mixed.pdf', 'answer-keys/03i-section-c-comprehensive-review-mixed-answer-key.pdf']) {
 const r = await fetch(`${BASE}${UNIT}resources/${f}`); ok(r.status === 404, `${f}: retired file served (${r.status})`);
}
const bySha = new Map(manifest.map(m => ['/' + m.published, m]));
for (const href of pdfLinks) {
 const res = await fetch(href), bytes = Buffer.from(await res.arrayBuffer()), m = bySha.get(new URL(href).pathname);
 ok(res.status === 200 && /application\/pdf/.test(res.headers.get('content-type') || ''), `${href}: ${res.status} ${res.headers.get('content-type')}`);
 ok(m && crypto.createHash('sha256').update(bytes).digest('hex') === m.sha256, `${href}: not the supplied file`);
 out.pdfs++;
}
// the entry points
const c = await context(b, {width: 1366, height: 900});
for (const [route, sel, want] of [['/im1/', '.unit-grid a[href="unit-4-exponential-functions/"]', 'Unit 4 - Exponential Functions'], ['/im1/', '#unit-select option[value="unit-4-exponential-functions/"]', 'Unit 4 - Exponential Functions'],
 ['/im1/unit-1-review/', '#unit-select option[value="../unit-4-exponential-functions/"]', 'Unit 4 - Exponential Functions'], ['/', '.course-card-note', 'Units 1–4']]) {
 const p = await open(c, BASE + route);
 const t = await p.$eval(sel, e => e.textContent).catch(() => null);
 ok(t && t.includes(want), `${route} ${sel}: ${t}`);
 if (route === '/im1/') {const bar = await p.$eval('.bm-context-bar', e => e.textContent); ok(/Units 1–4/.test(bar), `/im1/ context bar: ${bar}`);}
 for (const e of p._errs) ok(false, `${route} console: ${e}`);
 await p.close();
}
await c.close(); await b.close();
console.log(JSON.stringify(out, null, 1));
if (out.failures.length) process.exitCode = 1;
