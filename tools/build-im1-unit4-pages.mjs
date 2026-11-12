// Integrated Math 1 Unit 4 (Exponential Functions): downloadable assignments, answer keys, section reviews and unit
// comprehensive reviews, laid out like the Unit 3 pages (same head, breadcrumbs, structured data, styles and topic
// pager). Unit 4 has no student notes, no instructional videos (to be supplied later) and no practice engines.
//
// Usage (from the repository root):
//   node tools/build-im1-unit4-pages.mjs                  write the 27 pages
//   node tools/build-im1-unit4-pages.mjs --pdfs <dir>     also copy the 56 supplied PDFs, byte for byte, from <dir> (the
//                                                         folder of the classroom ZIP) and record their SHA-256 hashes
// The pages are complete as written (SEO metadata included). Sections, part codes (1A, 1B, ... 4E; the PDFs keep their
// zero-padded file names) and every menu, card, breadcrumb and previous/next link come from tools/im1-nav/structure.mjs,
// the IM1 navigation standard (docs/IM1-NAVIGATION-STANDARD.md); `node tools/im1-nav/apply.mjs --check` confirms agreement.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {UNITS, pageInfo, partLabel, partAnchor, topicSelect, unitCards, sectionCards, backLink, pager, breadcrumbs, unitRoute, sectionRoute, topicRoute, reviewRoute} from './im1-nav/structure.mjs';

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
 ['01F', 'Section A Comprehensive Review – Mixed', '01F - Section A Comprehensive Review HW - Mixed'],
 ['02A', 'Writing Recursive Formulas', '02A - Writing Recursive Formulas HW'],
 ['02B', 'Using Recursive Formulas', '02B - Using Recursive Formulas HW'],
 ['02C', 'Recursive Formulas from Tables and Contexts', '02C - Recursive Formulas from Tables and Contexts HW'],
 ['02D', 'Section B Comprehensive Review', '02D - Section B Comprehensive Review HW'],
 ['02E', 'Section B Comprehensive Review – Mixed', '02E - Section B Comprehensive Review HW - Mixed'],
 ['03A', 'Writing Explicit Formulas', '03A - Writing Explicit Formulas HW'],
 ['03B', 'Converting Recursive to Explicit', '03B - Converting Recursive to Explicit HW'],
 ['03C', 'Converting Explicit to Recursive', '03C - Converting Explicit to Recursive HW'],
 ['03D', 'Explicit Formulas from Tables and Terms', '03D - Explicit Formulas from Tables and Terms HW'],
 ['03E', 'Exponential Growth and Decay Models', '03E - Exponential Growth and Decay Models HW'],
 ['03F', 'Writing Exponential Equations from y-Intercept and Common Ratio', '03F - Writing Exponential Equations from y-Intercept and Common Ratio HW'],
 ['03G', 'Writing Equivalent Explicit Exponential Equations from a Point', '03G - Writing Equivalent Explicit Exponential Equations from a Point HW'],
 ['03H', 'Section C Comprehensive Review', '03H - Section C Comprehensive Review HW'],
 ['03I', 'Section C Comprehensive Review – Mixed', '03I - Section C Comprehensive Review HW - Mixed'],
 ['04A', 'Solving Basic Exponential Equations', '04A - Solving Basic Exponential Equations HW'],
 ['04B', 'Solving Exponential Equations with Algebraic Exponents', '04B - Solving Exponential Equations with Algebraic Exponents HW'],
 ['04C', 'Solving Exponential Equations with Coefficients', '04C - Solving Exponential Equations with Coefficients HW'],
 ['04D', 'Section D Comprehensive Review', '04D - Section D Comprehensive Review HW'],
 ['04E', 'Section D Comprehensive Review – Mixed', '04E - Section D Comprehensive Review HW - Mixed'],
 ['05A', 'Unit 4 Comprehensive Review – Version 1', '05A - Unit 4 Comprehensive Review - Version 1'],
 ['05B', 'Unit 4 Comprehensive Review – Version 2', '05B - Unit 4 Comprehensive Review - Version 2'],
 ['05C', 'Unit 4 Comprehensive Review – Mixed', '05C - Unit 4 Comprehensive Review - Mixed']
].map(([code, title, source]) => ({code, title, source,
  file: `${code.toLowerCase()}-${title.toLowerCase().replace(/–/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}));
const doc = code => documents.find(d => d.code === code);

// Page descriptions. The pages' sections, part codes and labels come from tools/im1-nav/structure.mjs (the IM1 navigation
// standard), which also renders the menus, cards, breadcrumbs and previous/next links shared by every IM1 unit.
const descriptions = {
 'geometric-or-not': 'Determine whether each sequence is geometric and, if it is, find the common ratio.',
 'common-ratios-and-next-terms': 'Find the common ratio of a geometric sequence and write the next three terms.',
 'finding-terms-of-geometric-sequences': 'Use a first term and common ratio to write the terms of a geometric sequence.',
 'geometric-growth-and-decay-modeling': 'Use geometric sequences to answer growth and decay questions and state the common ratio.',
 'section-a-review': 'Two comprehensive reviews of geometric sequences: the Section 1 review and a mixed version with a different set of problems.',
 'writing-recursive-formulas': 'Write a recursive formula for each geometric sequence.',
 'using-recursive-formulas': 'Use recursive formulas to write the requested terms of geometric sequences.',
 'recursive-formulas-from-tables-and-contexts': 'Find the common ratio from tables and real-world situations and write recursive formulas that include the first term.',
 'section-b-review': 'Two comprehensive reviews of recursive formulas: the Section 2 review and a mixed version with a different set of problems.',
 'writing-explicit-formulas': 'Write an explicit formula for each geometric sequence.',
 'converting-recursive-to-explicit': 'Convert recursive formulas for geometric sequences into explicit formulas.',
 'converting-explicit-to-recursive': 'Convert explicit formulas for geometric sequences into recursive formulas, including the first term.',
 'explicit-formulas-from-tables-and-terms': 'Find the common ratio from a table or given terms and write an explicit formula.',
 'exponential-growth-and-decay-models': 'Identify the y-intercept, common ratio, and percent growth or decay of exponential equations and contexts, and decide whether each shows growth or decay.',
 'writing-exponential-equations-from-y-intercept-and-common-ratio': 'Write explicit exponential equations from a y-intercept and a common ratio.',
 'writing-equivalent-explicit-exponential-equations-from-a-point': 'Use a point and a common ratio to write several different explicit equations for the same exponential function.',
 'section-c-review': 'Two comprehensive reviews of explicit formulas and exponential models: the Section 3 review and a mixed version with a different set of problems.',
 'solving-basic-exponential-equations': 'Solve basic exponential equations without a calculator.',
 'solving-exponential-equations-with-algebraic-exponents': 'Rewrite both sides with a common base, set the exponents equal, and solve equations with algebraic exponents, without a calculator.',
 'solving-exponential-equations-with-coefficients': 'Isolate the exponential expression first, then solve exponential equations with coefficients, without a calculator.',
 'section-d-review': 'Two comprehensive reviews of solving exponential equations: the Section 4 review and a mixed version with a different set of problems.',
 'comprehensive-review': 'Three cumulative Unit 4 reviews covering geometric sequences, recursive and explicit formulas, exponential models, and exponential equations: Version 1, Version 2, and a Mixed version.'
};
const U = UNITS.find(u => u.dir === UNIT.rel);
const sectionDescription = Object.fromEntries(sections.map((s, i) => [U.sections[i].slug, s.description]));
if (sections.some((s, i) => s.slug !== U.sections[i].slug)) throw new Error('Unit 4 sections disagree with tools/im1-nav/structure.mjs');

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const SOCIAL_IMAGE = `${ORIGIN}/assets/batchmath-social-card-v1.png`;
const SOCIAL_ALT = 'BatchMath — math resources for Integrated Math 1, Calculus Prep, and AP Calculus AB';

// crumbs: [{name, route}] from Home to this page
function head(title, description, route, crumbs) {
 const url = ORIGIN + route;
 const ld = {'@context': 'https://schema.org', '@graph': [
  {'@type': 'WebPage', '@id': `${url}#page`, name: title, url, description, isPartOf: {'@id': `${ORIGIN}/#website`}},
  {'@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({'@type': 'ListItem', position: i + 1, name: c.name, item: ORIGIN + c.route}))}]};
 return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><title>${esc(title)}</title><link rel="stylesheet" href="/assets/site.css" data-batchmath-shared-style="v10.0"><link rel="stylesheet" href="/assets/im1-unit3.css"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#030303"><script src="/assets/batchmath-storage.js" defer></script><script src="/assets/answer-normalization.js"></script><script src="/assets/pwa.js" defer></script><script async src="https://www.googletagmanager.com/gtag/js?id=G-377MTFXSF3"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-377MTFXSF3');</script>

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
</head>`;
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
 return `${head(page.title, description, page.route, page.crumbs)}${header()}<main id="main-content" class="main">${breadcrumbs(page.crumbs)}${backLink(U, page)}<h1 class="page-title">${esc(page.h1)}</h1><p class="topic-description">${esc(description)}</p>${topicSelect(U, page.route, page.kind === 'review' ? 'review' : page.topic)}<section class="resource-section"><div class="resource-list">${list}</div></section>${pager(U, page.route)}</main>${footer()}`;
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

// ---- the pages ----
write(`${UNIT.rel}/index.html`, unitPage());
let pages = 1;
for (const s of U.sections) {
 write(`${sectionRoute(U, s).slice(1)}index.html`, sectionPage(s)); pages++;
 for (const t of s.topics) {
  const items = t.parts.map(p => ({code: p.doc, label: partLabel(p), id: t.parts.length > 1 ? partAnchor(p) : null}));
  write(`${topicRoute(U, s, t).slice(1)}index.html`, topicPage(info(topicRoute(U, s, t)), items)); pages++;
 }
}
write(`${reviewRoute(U).slice(1)}index.html`, topicPage(info(reviewRoute(U)), U.review.documents.map(d => ({code: d.doc, label: d.title})))); pages++;
const covered = [...U.sections.flatMap(s => s.topics.flatMap(t => t.parts.map(p => p.doc))), ...U.review.documents.map(d => d.doc)];
if (covered.length !== documents.length || new Set(covered).size !== documents.length || covered.some(c => !doc(c))) throw new Error('every document must appear on exactly one page');
console.log(`Built ${pages} Unit 4 pages for ${documents.length} documents (${documents.length * 2} PDFs).`);
