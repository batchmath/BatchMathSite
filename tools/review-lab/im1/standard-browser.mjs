// Integrated Math 1 navigation standard, in Chromium on the real pages, at 1366x900 and 390x844 (touch), for Units 1-4.
// Every IM1 page loads with one H1, one breadcrumb trail, no script errors or failed local requests, and no horizontal
// overflow; every "Jump to topic" menu has the Section 1-4 groups and the standard part labels; no page shows a
// zero-padded code, a lettered section, a bare "Part A" or student notes. Every practice engine (41) starts and shows a
// question with an answer control; Unit 1 Multiplication grades a correct and a wrong answer; choice and practice-type
// engines respond. Navigation is exercised by clicking: section cards, part cards, menus (including Unit 4's anchored
// review documents), previous/next links, breadcrumbs and practice launch buttons. Every IM1 PDF link serves a PDF.
// Usage: BM_PORT=<port of a server for the site root> node tools/review-lab/im1/standard-browser.mjs
//        (results in $REVIEW_OUT/im1-standard/results.json; screenshots alongside)
import fs from 'node:fs';
import {browser, context, outDir} from '../lib/browser.mjs';
import {UNITS, pageInfo, sectionLabel, partLabel} from '../../im1-nav/structure.mjs';

const PORT = +process.env.BM_PORT, BASE = `http://127.0.0.1:${PORT}`, SITE = process.env.BM_SITE_ROOT || '.';
const shots = outDir('im1-standard'), out = {checks: 0, failures: [], pages: 0, practice: 0, flows: 0, pdfs: 0};
const ok = (c, m) => {out.checks++; if (!c) out.failures.push(m);};
const pages = [];
(function walk(d) {for (const e of fs.readdirSync(`${SITE}/${d}`, {withFileTypes: true})) {const p = `${d}/${e.name}`; if (e.isDirectory()) walk(p); else if (e.name === 'index.html') pages.push(p);}})('im1');
pages.sort();
const route = rel => '/' + rel.replace(/index\.html$/, '');
const FORBIDDEN = [[/\b0\d[A-Z]\b/, 'zero-padded code'], [/\bSection [A-Z]\b/, 'lettered section'], [/\bPart [A-Z]\b/, 'bare Part label'], [/\bSection (?:[5-9]|\d\d)\b/, 'Section 5+'], [/\bnotes?\b/i, 'notes']];

async function open(c, url, practice) {
 const p = await c.newPage(), errs = [], failed = [];
 p.on('pageerror', e => errs.push(`pageerror at ${p.url()}: ${e.message} ${(e.stack || '').split('\n')[1] || ''}`));
 p.on('console', m => {if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) errs.push('console: ' + m.text());});
 p.on('requestfailed', r => {if (r.url().startsWith(BASE) && !/\.pdf$/.test(r.url())) failed.push(r.url());});
 p.on('response', r => {if (r.url().startsWith(BASE) && r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);});
 await p.goto(url, {waitUntil: 'load'}); await p.waitForTimeout(practice ? 400 : 120);
 p._errs = errs; p._failed = failed; return p;
}
// The review lab blocks MathJax's speech-rule engine (lib/browser.mjs), so MathJax's speech step can throw in addSpeech
// after math is typeset. That is an artifact of the lab, identical on the unchanged site; it is counted, not hidden.
const LAB_ARTIFACT = /at addSpeech \(https:\/\/cdn\.jsdelivr\.net\/npm\/mathjax@4\.1\.3\//;
const finish = async (p, label) => {for (const e of p._errs) if (LAB_ARTIFACT.test(e)) out.labSpeechEngineErrors = (out.labSpeechEngineErrors || 0) + 1; else ok(false, `${label}: ${e}`); for (const f of p._failed) ok(false, `${label}: failed request ${f}`); await p.close();};

const b = await browser();
for (const [w, h, mob] of [[1366, 900, false], [390, 844, true]]) {
 const vp = `${w}x${h}`, c = await context(b, {width: w, height: h, mobile: mob});
 for (const rel of pages) {
  const info = pageInfo(rel), practice = /\/practice\/index\.html$/.test(rel) && info?.kind !== 'extra';
  const p = await open(c, BASE + route(rel), practice), label = `${vp} ${route(rel)}`;
  const s = await p.evaluate(() => ({
   h1: document.querySelectorAll('h1').length, crumbs: document.querySelectorAll('nav.bm-breadcrumbs').length,
   overflow: document.documentElement.scrollWidth - window.innerWidth,
   text: [document.title, document.body.innerText, ...[...document.querySelectorAll('option,optgroup')].map(o => o.label || o.textContent)].join('\n'),
   groups: [...document.querySelectorAll('#unit-select optgroup')].map(g => g.label),
   options: [...document.querySelectorAll('#unit-select option')].filter(o => o.value).map(o => o.textContent.trim()),
   isTopicMenu: /Jump to topic/.test(document.querySelector('label[for="unit-select"]')?.textContent || '')}));
  ok(s.h1 === 1, `${label}: ${s.h1} H1`);
  ok(s.crumbs === (rel === 'im1/index.html' ? 1 : 1), `${label}: ${s.crumbs} breadcrumb trails`);
  ok(s.overflow <= 0, `${label}: wider than the screen by ${s.overflow}px`);
  for (const [re, what] of FORBIDDEN) {const m = s.text.match(re); ok(!m, `${label}: shows ${what} "${m && s.text.slice(Math.max(0, m.index - 30), m.index + 30)}"`);}
  if (info && s.isTopicMenu) {
   ok(JSON.stringify(s.groups) === JSON.stringify([...info.unit.sections.map(sectionLabel), 'Unit Review']), `${label}: menu groups ${JSON.stringify(s.groups)}`);
   ok(JSON.stringify(s.options) === JSON.stringify([...info.unit.sections.flatMap(x => x.topics.flatMap(t => t.parts.map(partLabel))), info.unit.review.title]), `${label}: menu options differ`);
  }
  if (practice) {
   // start the engine if it has a start screen, then a question and an answer control must be showing
   if (await p.$('#startBtn:visible')) {await p.click('#startBtn'); await p.waitForTimeout(250);}
   const q = await p.waitForFunction(() => {const el = document.querySelector('#question'); return el && el.textContent.trim().length > 0 ? el.textContent.trim() : null;}, null, {timeout: 15000}).then(x => x.jsonValue()).catch(() => null);
   ok(q, `${label}: practice engine shows no question`);
   const control = await p.evaluate(() => !!document.querySelector('#answer, #answerArea input, #answerArea math-field, #answerArea button, #answerArea [contenteditable], #choices button, #choices input, .choice, math-field'));
   ok(control, `${label}: practice engine has no answer control`);
   if (!mob) out.practice++;
  }
  if (!mob && rel === 'im1/unit-1-review/topics/section-3-fractions-decimals-and-percents/index.html') await p.screenshot({path: `${shots}/unit1-section3-${w}.png`, fullPage: true});
  await finish(p, label); out.pages++;
 }

 // ---- navigation flows, by clicking ----
 const p = await open(c, BASE + '/im1/'), click = async (sel, want, note) => {
  const el = p.locator(sel).first(); ok(await el.count() && await el.isVisible(), `${vp} ${note}: ${sel} not visible`);
  await Promise.all([p.waitForURL(u => u.href === BASE + want, {timeout: 10000}).catch(() => {}), mob ? el.tap() : el.click()]);
  ok(p.url() === BASE + want, `${vp} ${note}: went to ${p.url()}, expected ${want}`); out.flows++;
 };
 const choose = async (value, want, note) => {
  await Promise.all([p.waitForURL(u => u.href === BASE + want, {timeout: 10000}).catch(() => {}), p.selectOption('#unit-select', value)]);
  ok(p.url() === BASE + want, `${vp} ${note}: menu went to ${p.url()}, expected ${want}`); out.flows++;
 };
 const U1 = '/im1/unit-1-review/', U2 = '/im1/unit-2-algebraic-operations-equations-inequalities/', U3 = '/im1/unit-3-linear-equation/', U4 = '/im1/unit-4-exponential-functions/';
 // Unit 1: IM1 page -> unit -> Section 3 -> 3C -> next (3D) -> back to section -> menu to 4A -> practice
 await click('.unit-grid a[href="unit-1-review/"]', U1, 'IM1 Unit 1 card');
 await click('.topic-grid a[href="topics/section-3-fractions-decimals-and-percents/"]', `${U1}topics/section-3-fractions-decimals-and-percents/`, 'Unit 1 Section 3 card');
 await click('.topic-grid a:has-text("3C — Decimals")', `${U1}topics/decimals/`, 'Unit 1 part 3C card');
 await click('.topic-pager-link.next', `${U1}topics/percents/`, 'Unit 1 next link (3D)');
 await click('a.back', `${U1}topics/section-3-fractions-decimals-and-percents/`, 'Unit 1 back link to its section');
 await choose('../classifying-numbers/', `${U1}topics/classifying-numbers/`, 'Unit 1 menu (4A)');
 await click('a[data-bm-resource="practice"]', `${U1}topics/classifying-numbers/practice/`, 'Unit 1 practice launch');
 // Unit 1 Multiplication grades a correct and a wrong answer (typed on the keyboard, on desktop; on the phone the
 // engine takes input from its on-screen keypad, whose presence the practice-page checks above already confirm)
 if (!mob) {
  await p.goto(BASE + `${U1}topics/multiplication/practice/`); await p.click('#startBtn');
  for (const [right, want] of [[true, /\bcorrect\b/], [false, /\bincorrect\b/]]) {
   // the question appears as TeX first and is readable once MathJax has rendered it
   const shown = await p.waitForFunction(() => /\d+\s*×\s*\d+/.test(document.querySelector('#question')?.textContent || '') && document.querySelector('#question').textContent, null, {timeout: 10000}).then(x => x.jsonValue()).catch(() => '');
   const q = shown.match(/(\d+)\s*×\s*(\d+)/);
   ok(q, `${vp} Unit 1 multiplication: unreadable question`);
   if (q) {
    await p.keyboard.type(String(+q[1] * +q[2] + (right ? 0 : 1))); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    const cls = await p.getAttribute('#feedback', 'class');
    ok(want.test(cls) && (right ? !/incorrect/.test(cls) : true), `${vp} Unit 1 multiplication: ${right ? 'correct' : 'wrong'} answer graded as "${cls}"`);
    out.graded = (out.graded || 0) + 1;
   }
   await p.waitForTimeout(1300);
  }
 }
 // Unit 2: unit -> Section 3 -> 3B -> breadcrumb back to section -> a choice engine responds
 await p.goto(BASE + U2);
 await click('.topic-grid a[href="topics/section-3-linear-inequalities/"]', `${U2}topics/section-3-linear-inequalities/`, 'Unit 2 Section 3 card');
 await click('.topic-grid a:has-text("3B — Graphing Inequalities")', `${U2}topics/graphing-inequalities-interval-notation/`, 'Unit 2 part 3B card');
 await click(`nav.bm-breadcrumbs a[href="${U2}topics/section-3-linear-inequalities/"]`, `${U2}topics/section-3-linear-inequalities/`, 'Unit 2 breadcrumb to Section 3');
 await p.goto(BASE + `${U2}topics/distributive-property/practice/`); await p.waitForSelector('#choices button', {timeout: 15000}).catch(() => {});
 if (await p.$('#choices button')) {await p.locator('#choices button').first().click(); await p.waitForTimeout(300);
  ok((await p.textContent('#feedback')).trim().length > 0, `${vp} Unit 2 distributive property: choosing an answer gave no feedback`);}
 else ok(false, `${vp} Unit 2 distributive property: no answer choices`);
 // Unit 3: menu to 2C -> previous link -> video on 1A -> practice type switch on the Section 1 review
 await p.goto(BASE + U3);
 await choose(`${U3}topics/b-functions-function-notation-and-slope/slope-from-two-points/`, `${U3}topics/b-functions-function-notation-and-slope/slope-from-two-points/`, 'Unit 3 menu (2C)');
 await click('.topic-pager-link:not(.next)', `${U3}topics/b-functions-function-notation-and-slope/solving-function-equations/`, 'Unit 3 previous link (2B)');
 await p.goto(BASE + `${U3}topics/a-arithmetic-sequences-and-arithmetic-progression-models/identifying-arithmetic-sequences/`);
 ok(await p.locator('[data-video-id="j5XM6_T7CA4"]').count() === 1, `${vp} Unit 3 1A: instructional video missing`);
 await p.goto(BASE + `${U3}topics/a-arithmetic-sequences-and-arithmetic-progression-models/section-a-review/practice/`);
 await p.waitForFunction(() => document.querySelector('#question')?.textContent.trim(), null, {timeout: 15000}).catch(() => {});
 const typeLabels = await p.$$eval('#practiceMode option', os => os.map(o => o.textContent.trim()));
 ok(typeLabels[1] === '1A — Identifying Arithmetic Sequences', `${vp} Unit 3 practice type labels ${JSON.stringify(typeLabels)}`);
 await p.selectOption('#practiceMode', 'finding-a-specific-term'); await p.waitForTimeout(400);
 ok((await p.textContent('#question')).trim().length > 0, `${vp} Unit 3 practice type switch: no question`);
 // Unit 4: menu to 1F (anchored review document) -> section card to 3I -> comprehensive review via next link
 await p.goto(BASE + U4);
 await choose(`${U4}topics/a-geometric-sequences/section-a-review/#part-1f`, `${U4}topics/a-geometric-sequences/section-a-review/#part-1f`, 'Unit 4 menu (1F)');
 ok(await p.locator('#part-1f .resource-title').textContent() === '1F — Section 1 Review (Mixed)', `${vp} Unit 4 1F anchor target`);
 await p.goto(BASE + `${U4}topics/c-explicit-formulas-and-exponential-models/`);
 await click('.topic-grid a:has-text("3I — Section 3 Review (Mixed)")', `${U4}topics/c-explicit-formulas-and-exponential-models/section-c-review/#part-3i`, 'Unit 4 part 3I card');
 await p.goto(BASE + `${U4}topics/d-solving-exponential-equations/section-d-review/`);
 await click('.topic-pager-link.next', `${U4}topics/comprehensive-review/`, 'Unit 4 next link (unit review)');
 await finish(p, `${vp} flows`); await c.close();
}

// ---- every IM1 PDF link serves a PDF ----
const pdfs = new Set();
for (const rel of pages) for (const m of fs.readFileSync(`${SITE}/${rel}`, 'utf8').matchAll(/href="([^"]+\.pdf)"/g)) pdfs.add(new URL(m[1], BASE + route(rel)).href);
for (const href of pdfs) {
 const r = await fetch(href), bytes = Buffer.from(await r.arrayBuffer());
 ok(r.status === 200 && /application\/pdf/.test(r.headers.get('content-type') || '') && bytes.subarray(0, 5).toString() === '%PDF-', `${href}: ${r.status} ${r.headers.get('content-type')}`);
 out.pdfs++;
}
await b.close();
fs.writeFileSync(`${shots}/results.json`, JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({...out, failures: out.failures.slice(0, 60), failureCount: out.failures.length}, null, 1));
if (out.failures.length) process.exitCode = 1;
