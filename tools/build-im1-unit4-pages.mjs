// Integrated Math 1 Unit 4 (Exponential Functions): downloadable assignments, answer keys, section reviews and unit
// comprehensive reviews, laid out like the Unit 3 pages (same head, breadcrumbs, structured data, styles and topic
// pager). Unit 4 has no student notes and no instructional videos (to be supplied later). Every assignment page, each
// section review and the Unit 4 Comprehensive Review has a practice engine.
//
// Usage (from the repository root):
//   node tools/build-im1-unit4-pages.mjs                  write the 49 pages (27 resource pages, 22 practice pages)
//   node tools/build-im1-unit4-pages.mjs --pdfs <dir>     also copy the 46 supplied PDFs, byte for byte, from <dir> (the
//                                                         folder of the classroom ZIP) and record their SHA-256 hashes
// The pages are complete as written (SEO metadata included). Sections, part codes (1A, 1B, ... 4E; the PDFs keep their
// zero-padded file names) and every menu, card, breadcrumb and previous/next link come from tools/im1-nav/structure.mjs.
// v13.0.H: Section 1 practice engines. v13.0.I: practice engines for Sections 2-4 and the Unit 4 Comprehensive Review
// (see PRACTICE below); the mixed reviews are retired.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {UNITS, pageInfo, partLabel, topicLabel, partAnchor, topicSelect, unitCards, sectionCards, backLink, pager, breadcrumbs, unitRoute, sectionRoute, topicRoute, reviewRoute} from './im1-nav/structure.mjs';

const root = process.cwd();
const ORIGIN = 'https://batchmath.net';
const UNIT = {rel: 'im1/unit-4-exponential-functions', name: 'Unit 4 - Exponential Functions', short: 'Unit 4'};

const sections = [
 {slug: 'a-geometric-sequences',
  description: 'Decide whether a sequence is geometric, find common ratios and next terms, write terms from a first term and common ratio, and model growth and decay with geometric sequences.'},
 {slug: 'b-recursive-formulas',
  description: 'Write and use recursive formulas for geometric sequences, including recursive formulas from tables and real-world contexts.'},
 {slug: 'c-explicit-formulas-and-exponential-models',
  description: 'Write explicit formulas for geometric sequences, convert between recursive and explicit forms, and write and interpret exponential growth and decay equations.'},
 {slug: 'd-solving-exponential-equations',
  description: 'Solve exponential equations without a calculator, including equations with algebraic exponents and equations with coefficients.'}
];

// Every document in the classroom ZIP: code, title (as printed on the document) and source file name. The answer key's
// source is the same name followed by " - Answer Key".
const documents = [
 ['01A', 'Geometric or Not', '01A - Geometric or Not HW'],
 ['01B', 'Common Ratios and Next Terms', '01B - Common Ratios and Next Terms HW'],
 ['01C', 'Finding Terms of Geometric Sequences', '01C - Finding Terms of Geometric Sequences HW'],
 ['01D', 'Geometric Growth and Decay Modeling', '01D - Geometric Growth and Decay Modeling HW'],
 ['01E', 'Section A Comprehensive Review', '01E - Section A Comprehensive Review HW'],
 ['02A', 'Writing Recursive Formulas', '02A - Writing Recursive Formulas HW'],
 ['02B', 'Using Recursive Formulas', '02B - Using Recursive Formulas HW'],
 ['02C', 'Recursive Formulas from Tables and Contexts', '02C - Recursive Formulas from Tables and Contexts HW'],
 ['02D', 'Section B Comprehensive Review', '02D - Section B Comprehensive Review HW'],
 ['03A', 'Writing Explicit Formulas', '03A - Writing Explicit Formulas HW'],
 ['03B', 'Converting Recursive to Explicit', '03B - Converting Recursive to Explicit HW'],
 ['03C', 'Converting Explicit to Recursive', '03C - Converting Explicit to Recursive HW'],
 ['03D', 'Explicit Formulas from Tables and Terms', '03D - Explicit Formulas from Tables and Terms HW'],
 ['03E', 'Exponential Growth and Decay Models', '03E - Exponential Growth and Decay Models HW'],
 ['03F', 'Writing Exponential Equations from y-Intercept and Common Ratio', '03F - Writing Exponential Equations from y-Intercept and Common Ratio HW'],
 ['03G', 'Writing Equivalent Explicit Exponential Equations from a Point', '03G - Writing Equivalent Explicit Exponential Equations from a Point HW'],
 ['03H', 'Section C Comprehensive Review', '03H - Section C Comprehensive Review HW'],
 ['04A', 'Solving Basic Exponential Equations', '04A - Solving Basic Exponential Equations HW'],
 ['04B', 'Solving Exponential Equations with Algebraic Exponents', '04B - Solving Exponential Equations with Algebraic Exponents HW'],
 ['04C', 'Solving Exponential Equations with Coefficients', '04C - Solving Exponential Equations with Coefficients HW'],
 ['04D', 'Section D Comprehensive Review', '04D - Section D Comprehensive Review HW'],
 ['05A', 'Unit 4 Comprehensive Review – Version 1', '05A - Unit 4 Comprehensive Review - Version 1'],
 ['05B', 'Unit 4 Comprehensive Review – Version 2', '05B - Unit 4 Comprehensive Review - Version 2']
].map(([code, title, source]) => ({code, title, source,
  file: `${code.toLowerCase()}-${title.toLowerCase().replace(/–/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}));
const doc = code => documents.find(d => d.code === code);
// v13.0.I: the mixed reviews (01F, 02E, 03I, 04E) and the mixed unit review (05C) are no longer published. Their supplied
// files are kept, outside the site, in tools/im1-unit4/retired-mixed-reviews/ (see its manifest.json).
const RETIRED = ['01F', '02E', '03I', '04E', '05C'];

// Page descriptions. The pages' sections, part codes and labels come from tools/im1-nav/structure.mjs (the IM1 navigation
// standard), which also renders the menus, cards, breadcrumbs and previous/next links shared by every IM1 unit.
const descriptions = {
 'geometric-or-not': 'Determine whether each sequence is geometric and, if it is, find the common ratio.',
 'common-ratios-and-next-terms': 'Find the common ratio of a geometric sequence and write the next three terms.',
 'finding-terms-of-geometric-sequences': 'Use a first term and common ratio to write the terms of a geometric sequence.',
 'geometric-growth-and-decay-modeling': 'Use geometric sequences to answer growth and decay questions and state the common ratio.',
 'section-a-review': 'The Section 1 comprehensive review of geometric sequences, common ratios, terms, and growth and decay models.',
 'writing-recursive-formulas': 'Write a recursive formula for each geometric sequence.',
 'using-recursive-formulas': 'Use recursive formulas to write the requested terms of geometric sequences.',
 'recursive-formulas-from-tables-and-contexts': 'Find the common ratio from tables and real-world situations and write recursive formulas that include the first term.',
 'section-b-review': 'The Section 2 comprehensive review of writing and using recursive formulas, including tables and real-world contexts.',
 'writing-explicit-formulas': 'Write an explicit formula for each geometric sequence.',
 'converting-recursive-to-explicit': 'Convert recursive formulas for geometric sequences into explicit formulas.',
 'converting-explicit-to-recursive': 'Convert explicit formulas for geometric sequences into recursive formulas, including the first term.',
 'explicit-formulas-from-tables-and-terms': 'Find the common ratio from a table or given terms and write an explicit formula.',
 'exponential-growth-and-decay-models': 'Identify the y-intercept, common ratio, and percent growth or decay of exponential equations and contexts, and decide whether each shows growth or decay.',
 'writing-exponential-equations-from-y-intercept-and-common-ratio': 'Write explicit exponential equations from a y-intercept and a common ratio.',
 'writing-equivalent-explicit-exponential-equations-from-a-point': 'Use a point and a common ratio to write several different explicit equations for the same exponential function.',
 'section-c-review': 'The Section 3 comprehensive review of explicit formulas, conversions, tables and terms, exponential models, and equivalent exponential equations.',
 'solving-basic-exponential-equations': 'Solve basic exponential equations without a calculator.',
 'solving-exponential-equations-with-algebraic-exponents': 'Rewrite both sides with a common base, set the exponents equal, and solve equations with algebraic exponents, without a calculator.',
 'solving-exponential-equations-with-coefficients': 'Isolate the exponential expression first, then solve exponential equations with coefficients, without a calculator.',
 'section-d-review': 'The Section 4 comprehensive review of solving exponential equations with common bases, algebraic exponents, and coefficients.',
 'comprehensive-review': 'Two cumulative Unit 4 reviews covering geometric sequences, recursive and explicit formulas, exponential models, and exponential equations: Version 1 and Version 2.'
};
const U = UNITS.find(u => u.dir === UNIT.rel);
const sectionDescription = Object.fromEntries(sections.map((s, i) => [U.sections[i].slug, s.description]));
if (sections.some((s, i) => s.slug !== U.sections[i].slug)) throw new Error('Unit 4 sections disagree with tools/im1-nav/structure.mjs');

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const SOCIAL_IMAGE = `${ORIGIN}/assets/batchmath-social-card-v1.png`;
const SOCIAL_ALT = 'BatchMath — math resources for Integrated Math 1, Calculus Prep, and AP Calculus AB';

// crumbs: [{name, route}] from Home to this page
function head(title, description, route, crumbs, {before = '', after = ''} = {}) {
 const url = ORIGIN + route;
 const ld = {'@context': 'https://schema.org', '@graph': [
  {'@type': 'WebPage', '@id': `${url}#page`, name: title, url, description, isPartOf: {'@id': `${ORIGIN}/#website`}},
  {'@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({'@type': 'ListItem', position: i + 1, name: c.name, item: ORIGIN + c.route}))}]};
 return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><title>${esc(title)}</title><link rel="stylesheet" href="/assets/site.css" data-batchmath-shared-style="v10.0"><link rel="stylesheet" href="/assets/im1-unit3.css"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#030303"><script src="/assets/batchmath-storage.js" defer></script><script src="/assets/answer-normalization.js"></script><script src="/assets/pwa.js" defer></script><script async src="https://www.googletagmanager.com/gtag/js?id=G-377MTFXSF3"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-377MTFXSF3');</script>${before}

<!-- BatchMath technical SEO metadata — v11 -->
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="BatchMath">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SOCIAL_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="${SOCIAL_ALT}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SOCIAL_IMAGE}">
<meta name="twitter:image:alt" content="${SOCIAL_ALT}">
<script type="application/ld+json" data-batchmath-structured-data="11">${JSON.stringify(ld).replaceAll('</', '<\\/')}</script>
${after}</head>`;
}
function header() {
 return `<body><a class="skip-link" href="#main-content">Skip to main content</a><header class="topbar"><img class="corner" src="/assets/batchmath-portrait.jpg" alt=""><a class="logo" href="/">BatchMath<span class="tm-mark">™</span></a><div class="profile"><img src="/assets/batchmath-portrait.jpg" alt="BatchMath"><button class="menu-toggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="course-menu">COURSES ▼</button><nav id="course-menu" class="dropdown"><a href="/im1/" class="current-section" aria-current="page">Integrated Math 1</a><a href="/calculus-prep/">Calculus Prep</a><a href="/ap-calculus/">AP Calculus AB</a><a href="/about/">About</a><a href="/">Home</a></nav></div></header>`;
}
function footer() {
 return `<footer class="footer"><div class="bm-footer-main">© 2026 BatchMath. All rights reserved. BatchMath™.</div><div class="bm-footer-links"><a href="/about/">About BatchMath</a></div><div class="bm-legal-note">AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this website.</div></footer><script src="/assets/im1-unit3-nav.js"></script></body></html>`;
}
const info = route => pageInfo(`${route.slice(1)}index.html`);

function unitPage() {
 const description = 'Integrated Math 1 Unit 4 assignments and answer keys for geometric sequences, recursive and explicit formulas, exponential growth and decay models, and solving exponential equations.';
 const route = unitRoute(U), crumbs = info(route).crumbs;
 return `${head(`${UNIT.name} | Integrated Math 1 | BatchMath`, description, route, crumbs)}${header()}<main id="main-content" class="main">${breadcrumbs(crumbs)}<a class="back" href="/im1/">← Integrated Math 1</a><h1 class="page-title">${UNIT.name}</h1><p class="topic-description">Geometric sequences, recursive and explicit formulas, exponential growth and decay models, and solving exponential equations.</p>${topicSelect(U, route, null)}${unitCards(U)}</main>${footer()}`;
}
function sectionPage(s) {
 const page = info(sectionRoute(U, s)), description = sectionDescription[s.slug];
 return `${head(page.title, description, page.route, page.crumbs)}${header()}<main id="main-content" class="main">${breadcrumbs(page.crumbs)}${backLink(U, page)}<h1 class="page-title">${esc(page.h1)}</h1><p class="topic-description">${esc(description)}</p>${topicSelect(U, page.route, null)}${sectionCards(U, s)}</main>${footer()}`;
}
// A topic page (one or several documents) or the unit review page (its three versions).
function topicPage(page, items) {
 const description = descriptions[page.kind === 'review' ? U.review.slug : page.topic.slug];
 const resources = page.kind === 'review' ? '../../resources' : '../../../resources';
 const list = items.map(({id, label, code}) => {const d = doc(code); return `<div class="resource-item"${id ? ` id="${id}"` : ''}><div class="resource-title">${esc(label)}</div><div class="resource-actions"><a class="resource-link" data-bm-resource="assignment" href="${resources}/assignments/${d.file}.pdf" target="_blank" rel="noopener">Assignment PDF</a><a class="resource-link key" data-bm-resource="answer-key" href="${resources}/answer-keys/${d.file}-answer-key.pdf" target="_blank" rel="noopener">Answer Key PDF</a></div></div>`;}).join('');
 return `${head(page.title, description, page.route, page.crumbs)}${header()}<main id="main-content" class="main">${breadcrumbs(page.crumbs)}${backLink(U, page)}<h1 class="page-title">${esc(page.h1)}</h1><p class="topic-description">${esc(description)}</p>${topicSelect(U, page.route, page.kind === 'review' ? 'review' : page.topic)}<section class="resource-section"><div class="resource-list">${list}</div></section>${page.kind === 'review' ? practiceLaunch(U.review.title) : hasPractice(page.topic) ? practiceLaunch(topicLabel(page.topic)) : ''}${pager(U, page.route)}</main>${footer()}`;
}


// ---- practice engines ----
// Topic slug -> its Practice Type options (none for a single-skill engine). The engines are in
// assets/im1-unit4-generators.js and run on the IM1 Unit 3 practice runtime. Each section review practices its section
// (Mixed, or one assignment); the Unit 4 Comprehensive Review practices the whole unit (Mixed) or one section.
const lessonsOf = s => s.topics.filter(t => !t.review);
const PRACTICE = {
 'geometric-growth-and-decay-modeling': [['mixed', 'Mixed'], ['factors', 'Growth and Decay Factors'], ['models', 'Growth and Decay Word Problems']]
};
for (const s of U.sections) for (const t of s.topics)
 PRACTICE[t.slug] ??= t.review ? [['mixed', 'Mixed'], ...lessonsOf(s).map(l => [l.slug, partLabel(l.parts[0])])] : [];
const UNIT_PRACTICE = [['mixed', 'Mixed (Sections 1–4)'], ...U.sections.map(s => [`section-${s.n}`, `Section ${s.n} — ${s.name}`])];
// the words that finish "Practice <subject> in Integrated Math 1 Unit 4 ..."
const SECTION_SUBJECT = {'a-geometric-sequences': 'geometric sequences', 'b-recursive-formulas': 'recursive formulas',
 'c-explicit-formulas-and-exponential-models': 'explicit formulas and exponential models', 'd-solving-exponential-equations': 'solving exponential equations'};
const hasPractice = t => t && Object.hasOwn(PRACTICE, t.slug);
function practiceLaunch(label) {
 return `<section class="resource-section" data-bm-topic-practice="1"><div class="resource-actions bm-practice-launch-row"><a class="resource-link bm-practice-launch bm-practice-function" data-bm-resource="practice" href="practice/"><span aria-hidden="true" class="bm-practice-icon bm-practice-icon-function">f(x)</span><span class="bm-practice-label">${esc(label)} Practice</span><span aria-hidden="true" class="bm-practice-arrow">›</span></a></div></section>`;
}
// A topic's practice page (t in section s), or with no topic the Unit 4 Comprehensive Review practice page.
function practicePage(s, t) {
 const route = t ? `${topicRoute(U, s, t)}practice/` : `${reviewRoute(U)}practice/`, page = info(route), subject = page.subject;
 const modes = t ? PRACTICE[t.slug] : UNIT_PRACTICE, slug = t ? t.slug : U.review.slug;
 const description = t ? `Practice ${subject} in Integrated Math 1 Unit 4 ${SECTION_SUBJECT[s.slug]} with randomized questions and immediate feedback.`
  : 'Practice the whole of Integrated Math 1 Unit 4, or one section at a time, with randomized questions and immediate feedback.';
 const engineId = `im1_unit4_${(t ? t.slug : 'unit_review').replaceAll('-', '_')}`;
 const config = `window.BM_ANALYTICS_CONFIG={course:"im1",engineId:"${engineId}",generatorVersion:"1"};window.BM_UNIT3_PRACTICE={slug:"${slug}",registry:"BatchMathIM1Unit4Generators"${modes.length ? ',modeElementId:"practiceMode"' : ''}};`;
 const before = `<link rel="stylesheet" href="/assets/im1-keypad.css"><link rel="stylesheet" href="/assets/calculus-keypad.css"><link rel="stylesheet" href="/assets/im1-unit4.css"><script>window.MathJax={tex:{inlineMath:[["\\\\(","\\\\)"]]}};</script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js"></script><script src="/assets/reproducible-rng.js"></script><script>${config}</script><script src="/assets/problem-tracking.js"></script><script src="/assets/im1-unit4-generators.js"></script><script src="/assets/im1-keypad.js" defer></script><script src="/assets/calculus-keypad.js" defer></script><script src="/assets/im1-unit3-practice.js" defer></script>`;
 const after = '<link rel="stylesheet" href="/assets/mathlive/pilot.css"><script type="module" src="/assets/mathlive/im1-unit4.mjs"></script>';
 const filter = modes.length ? `<div class="practice-filter"><label for="practiceMode" class="bm-practice-select-label">Practice Type</label><select id="practiceMode" class="bm-practice-select">${modes.map(([value, label], i) => `<option value="${value}"${i === 0 ? ' selected' : ''}>${esc(label)}</option>`).join('')}</select></div>` : '';
 return `${head(page.title, description, page.route, page.crumbs, {before, after})}${header()}<main id="main-content" class="main">${breadcrumbs(page.crumbs)}<a class="back" href="../">← ${t ? 'Topic Page' : 'Unit 4 Comprehensive Review'}</a><h1 class="page-title">${esc(page.h1)}</h1><p class="bm-seo-context" data-batchmath-seo-context="11">Use this interactive Integrated Math 1 practice to work on ${esc(subject)} with immediate answer checking.</p><p class="topic-description">Randomized practice for ${esc(subject)}, modeled on the Unit 4 assignments.</p><div class="practice-shell">${filter}<div class="stats"><div class="stat">Correct<span id="score">0</span></div><div class="stat">Attempted<span id="attempted">0</span></div></div><section id="practiceCard" class="question-card"><div id="question" class="question"></div><div id="answerArea" class="question-area"></div><div id="feedback" class="feedback" aria-live="polite"></div><div class="practice-actions"><button id="nextBtn" class="next" type="button" hidden>Next Problem</button><button id="resetBtn" class="reset" type="button">Reset Score</button></div></section></div></main>${footer()}`;
}

function write(rel, content) {const file = path.join(root, rel); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, content);}

// ---- the PDFs ----
const pdfArg = process.argv.indexOf('--pdfs');
const manifestRel = 'tools/im1-unit4/pdf-manifest.json';
if (pdfArg > 0) {
 const src = process.argv[pdfArg + 1];
 const manifest = [];
 for (const d of documents) for (const [kind, from, to] of [['assignment', `${d.source}.pdf`, `assignments/${d.file}.pdf`], ['answer-key', `${d.source} - Answer Key.pdf`, `answer-keys/${d.file}-answer-key.pdf`]]) {
  const bytes = fs.readFileSync(path.join(src, from));
  if (bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error(`${from} is not a PDF`);
  write(`${UNIT.rel}/resources/${to}`, bytes);
  manifest.push({code: d.code, kind, source: from, published: `${UNIT.rel}/resources/${to}`, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex')});
 }
 write(manifestRel, JSON.stringify(manifest, null, 1) + '\n');
}
// every PDF the pages link to must be present
const missing = documents.flatMap(d => [`assignments/${d.file}.pdf`, `answer-keys/${d.file}-answer-key.pdf`]).filter(f => !fs.existsSync(path.join(root, UNIT.rel, 'resources', f)));
if (missing.length) throw new Error(`Missing PDFs (run with --pdfs <dir>): ${missing.join(', ')}`);
// the retired mixed reviews must not be published
const stale = fs.readdirSync(path.join(root, UNIT.rel, 'resources'), {recursive: true}).filter(f => RETIRED.some(code => path.basename(String(f)).startsWith(code.toLowerCase() + '-')));
if (stale.length) throw new Error(`Retired mixed-review files are still published: ${stale.join(', ')}`);

// ---- the pages ----
write(`${UNIT.rel}/index.html`, unitPage());
let pages = 1, engines = 0;
for (const s of U.sections) {
 write(`${sectionRoute(U, s).slice(1)}index.html`, sectionPage(s)); pages++;
 for (const t of s.topics) {
  const items = t.parts.map(p => ({code: p.doc, label: partLabel(p), id: t.parts.length > 1 ? partAnchor(p) : null}));
  write(`${topicRoute(U, s, t).slice(1)}index.html`, topicPage(info(topicRoute(U, s, t)), items)); pages++;
  if (hasPractice(t)) {write(`${topicRoute(U, s, t).slice(1)}practice/index.html`, practicePage(s, t)); pages++; engines++;}
 }
}
write(`${reviewRoute(U).slice(1)}index.html`, topicPage(info(reviewRoute(U)), U.review.documents.map(d => ({code: d.doc, label: d.title})))); pages++;
write(`${reviewRoute(U).slice(1)}practice/index.html`, practicePage(null, null)); pages++; engines++;
const covered = [...U.sections.flatMap(s => s.topics.flatMap(t => t.parts.map(p => p.doc))), ...U.review.documents.map(d => d.doc)];
if (covered.length !== documents.length || new Set(covered).size !== documents.length || covered.some(c => !doc(c))) throw new Error('every document must appear on exactly one page');
console.log(`Built ${pages} Unit 4 pages (${engines} practice engines) for ${documents.length} documents (${documents.length * 2} PDFs).`);
