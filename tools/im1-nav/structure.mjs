// The authoritative organization of Integrated Math 1 (IM1): every unit, its four sections, every part code, and how the
// navigation that shows them is rendered. Builders, tools/im1-nav/apply.mjs, tools/seo-build.mjs and the IM1 QA all read
// this file, so section and part labels cannot drift between pages. The rules are in docs/IM1-NAVIGATION-STANDARD.md.
//
// Visible labels:  section  "Section 1 — Arithmetic Sequences"
//                  part     "1A — Identifying Arithmetic Sequences"   (section number + letter; never a leading zero)
//                  page with several documents  "1E–1F — Section 1 Review"
//                  unit review  "Unit 4 Comprehensive Review" (separate from the four sections; never "Section 5")
// Routes never change here: a topic's `path` is its existing public URL under the unit folder.
import path from 'node:path';

const part = (code, title, extra = {}) => ({code, title, ...extra});

export const UNITS = [
 {
  n: 1, dir: 'im1/unit-1-review', name: 'Unit 1 - Review', links: 'relative', nested: false, sectionHeading: 'Topics',
  sections: [
   {n: 1, name: 'Multiplication and Integer Operations', slug: 'section-1-multiplication-and-integer-operations', added: true,
    description: 'Review multiplication facts, then add, subtract, multiply, and divide positive and negative integers.',
    topics: [
     {slug: 'multiplication', parts: [part('1A', 'Multiplication')]},
     {slug: 'adding-and-subtracting-negative-numbers', parts: [part('1B', 'Adding and Subtracting Negative Numbers')]},
     {slug: 'multiplying-and-dividing-negative-numbers', parts: [part('1C', 'Multiplying and Dividing Negative Numbers')]}]},
   {n: 2, name: 'Exponents and Order of Operations', slug: 'section-2-exponents-and-order-of-operations', added: true,
    description: 'Evaluate square roots and powers, then simplify expressions using the order of operations.',
    topics: [
     {slug: 'square-roots-and-exponents', parts: [part('2A', 'Square Roots and Exponents')]},
     {slug: 'order-of-operations', parts: [part('2B', 'Order of Operations')]}]},
   {n: 3, name: 'Fractions, Decimals, and Percents', slug: 'section-3-fractions-decimals-and-percents', added: true,
    description: 'Reduce fractions, operate with fractions and decimals, and solve percent problems.',
    topics: [
     {slug: 'reducing-fractions', parts: [part('3A', 'Reducing Fractions')]},
     {slug: 'fractions', parts: [part('3B', 'Fractions')]},
     {slug: 'decimals', parts: [part('3C', 'Decimals')]},
     {slug: 'percents', parts: [part('3D', 'Percents')]}]},
   {n: 4, name: 'Classifying Numbers', slug: 'section-4-classifying-numbers', added: true,
    description: 'Classify real numbers as rational or irrational and as integers, whole numbers, and natural numbers.',
    topics: [
     {slug: 'classifying-numbers', parts: [part('4A', 'Classifying Numbers')]}]}],
  review: {slug: 'comprehensive-review', title: 'Unit 1 Comprehensive Review'},
  extras: [{path: 'practice/', title: 'Unit 1 Practice'}]
 },
 {
  n: 2, dir: 'im1/unit-2-algebraic-operations-equations-inequalities', name: 'Unit 2 - Algebraic Operations, Equations, and Inequalities',
  links: 'relative', nested: false, sectionHeading: 'Topics',
  sections: [
   {n: 1, name: 'Algebraic Expressions', slug: 'section-1-algebraic-expressions', added: true,
    description: 'Combine like terms, decide whether expressions are equivalent, and use the distributive property.',
    topics: [
     {slug: 'equivalent-expressions-combining-like-terms', parts: [part('1A', 'Equivalent Expressions and Combining Like Terms')]},
     {slug: 'distributive-property', parts: [part('1B', 'Distributive Property')]}]},
   {n: 2, name: 'Solving Linear Equations', slug: 'section-2-solving-linear-equations', added: true,
    description: 'Solve one-step and multi-step linear equations, including equations with no solution or infinitely many solutions.',
    topics: [
     {slug: 'solving-linear-equations', parts: [part('2A', 'Solving Linear Equations')]}]},
   {n: 3, name: 'Linear Inequalities', slug: 'section-3-linear-inequalities', added: true,
    description: 'Solve linear and compound inequalities, and move among inequalities, number-line graphs, and interval notation.',
    topics: [
     {slug: 'solving-linear-inequalities', parts: [part('3A', 'Solving Linear Inequalities')]},
     {slug: 'graphing-inequalities-interval-notation', parts: [part('3B', 'Graphing Inequalities and Interval Notation')]}]},
   {n: 4, name: 'The Coordinate System', slug: 'section-4-the-coordinate-system', added: true,
    description: 'Plot and read points on the coordinate plane and identify the nine key features of a graph.',
    topics: [
     {slug: 'coordinate-system-nine-key-features', parts: [part('4A', 'Coordinate System and Nine Key Features')]}]}],
  review: {slug: 'comprehensive-review', title: 'Unit 2 Comprehensive Review'}
 },
 {
  n: 3, dir: 'im1/unit-3-linear-equation', name: 'Unit 3 - Linear', links: 'absolute', nested: true, sectionHeading: 'Assignments and Practice',
  sections: [
   {n: 1, name: 'Arithmetic Sequences', slug: 'a-arithmetic-sequences-and-arithmetic-progression-models', topics: [
    {slug: 'identifying-arithmetic-sequences', parts: [part('1A', 'Identifying Arithmetic Sequences')]},
    {slug: 'common-difference-next-terms', parts: [part('1B', 'Common Difference and Next Terms')]},
    {slug: 'explicit-formulas-arithmetic-sequences', parts: [part('1C', 'Explicit Formulas for Arithmetic Sequences')]},
    {slug: 'finding-a-specific-term', parts: [part('1D', 'Finding a Specific Term')]},
    {slug: 'finding-the-term-number', parts: [part('1E', 'Finding the Term Number')]},
    {slug: 'arithmetic-sequence-word-problems', parts: [part('1F', 'Arithmetic Sequence Word Problems')]},
    {slug: 'section-a-review', review: true, parts: [part('1G', 'Section 1 Review')]}]},
   {n: 2, name: 'Functions, Function Notation, and Slope', slug: 'b-functions-function-notation-and-slope', topics: [
    {slug: 'evaluating-functions', parts: [part('2A', 'Evaluating Functions')]},
    {slug: 'solving-function-equations', parts: [part('2B', 'Solving Function Equations')]},
    {slug: 'slope-from-two-points', parts: [part('2C', 'Slope from Two Points')]},
    {slug: 'collinearity-and-slope', parts: [part('2D', 'Collinearity and Slope')]},
    {slug: 'slope-from-graphs', parts: [part('2E', 'Slope from Graphs')]},
    {slug: 'section-b-review', review: true, parts: [part('2F', 'Section 2 Review')]}]},
   {n: 3, name: 'Slope-Intercept and Point-Slope Form', slug: 'c-slope-intercept-form-and-point-slope-form', topics: [
    {slug: 'slope-intercept-form', parts: [part('3A', 'Slope-Intercept Form')]},
    {slug: 'writing-equations-of-lines', parts: [part('3B', 'Writing Equations of Lines')]},
    {slug: 'converting-point-slope-to-slope-intercept', parts: [part('3C', 'Converting Point-Slope to Slope-Intercept Form')]},
    {slug: 'linear-function-word-problems', parts: [part('3D', 'Linear Function Word Problems')]},
    {slug: 'section-c-review', review: true, parts: [part('3E', 'Section 3 Review')]}]},
   {n: 4, name: 'Recursive Formulas for Linear Relationships', slug: 'd-recursive-formulas-for-linear-relationships', topics: [
    {slug: 'recursive-formulas-from-sequences', parts: [part('4A', 'Recursive Formulas from Sequences')]},
    {slug: 'recursive-to-explicit-formulas', parts: [part('4B', 'Recursive to Explicit Formulas')]},
    {slug: 'common-difference-recursive-formulas', parts: [part('4C', 'Common Difference and Recursive Formulas')]},
    {slug: 'section-d-review', review: true, parts: [part('4D', 'Section 4 Review')]}]}],
  review: {slug: 'comprehensive-review', title: 'Unit 3 Comprehensive Review'}
 },
 {
  n: 4, dir: 'im1/unit-4-exponential-functions', name: 'Unit 4 - Exponential Functions', links: 'absolute', nested: true, sectionHeading: 'Assignments',
  sections: [
   {n: 1, name: 'Geometric Sequences', slug: 'a-geometric-sequences', topics: [
    {slug: 'geometric-or-not', parts: [part('1A', 'Geometric or Not', {doc: '01A'})]},
    {slug: 'common-ratios-and-next-terms', parts: [part('1B', 'Common Ratios and Next Terms', {doc: '01B'})]},
    {slug: 'finding-terms-of-geometric-sequences', parts: [part('1C', 'Finding Terms of Geometric Sequences', {doc: '01C'})]},
    {slug: 'geometric-growth-and-decay-modeling', parts: [part('1D', 'Geometric Growth and Decay Modeling', {doc: '01D'})]},
    {slug: 'section-a-review', review: true, title: 'Section 1 Review',
     parts: [part('1E', 'Section 1 Review', {doc: '01E'}), part('1F', 'Section 1 Review (Mixed)', {doc: '01F'})]}]},
   {n: 2, name: 'Recursive Formulas', slug: 'b-recursive-formulas', topics: [
    {slug: 'writing-recursive-formulas', parts: [part('2A', 'Writing Recursive Formulas', {doc: '02A'})]},
    {slug: 'using-recursive-formulas', parts: [part('2B', 'Using Recursive Formulas', {doc: '02B'})]},
    {slug: 'recursive-formulas-from-tables-and-contexts', parts: [part('2C', 'Recursive Formulas from Tables and Contexts', {doc: '02C'})]},
    {slug: 'section-b-review', review: true, title: 'Section 2 Review',
     parts: [part('2D', 'Section 2 Review', {doc: '02D'}), part('2E', 'Section 2 Review (Mixed)', {doc: '02E'})]}]},
   {n: 3, name: 'Explicit Formulas and Exponential Models', slug: 'c-explicit-formulas-and-exponential-models', topics: [
    {slug: 'writing-explicit-formulas', parts: [part('3A', 'Writing Explicit Formulas', {doc: '03A'})]},
    {slug: 'converting-recursive-to-explicit', parts: [part('3B', 'Converting Recursive to Explicit', {doc: '03B'})]},
    {slug: 'converting-explicit-to-recursive', parts: [part('3C', 'Converting Explicit to Recursive', {doc: '03C'})]},
    {slug: 'explicit-formulas-from-tables-and-terms', parts: [part('3D', 'Explicit Formulas from Tables and Terms', {doc: '03D'})]},
    {slug: 'exponential-growth-and-decay-models', parts: [part('3E', 'Exponential Growth and Decay Models', {doc: '03E'})]},
    // `short` keeps the browser-tab title within the site's 85-character limit; the page shows the full title.
    {slug: 'writing-exponential-equations-from-y-intercept-and-common-ratio',
     parts: [part('3F', 'Writing Exponential Equations from y-Intercept and Common Ratio', {doc: '03F', short: 'Exponential Equations from y-Intercept and Common Ratio'})]},
    {slug: 'writing-equivalent-explicit-exponential-equations-from-a-point',
     parts: [part('3G', 'Writing Equivalent Explicit Exponential Equations from a Point', {doc: '03G', short: 'Equivalent Exponential Equations from a Point'})]},
    {slug: 'section-c-review', review: true, title: 'Section 3 Review',
     parts: [part('3H', 'Section 3 Review', {doc: '03H'}), part('3I', 'Section 3 Review (Mixed)', {doc: '03I'})]}]},
   {n: 4, name: 'Solving Exponential Equations', slug: 'd-solving-exponential-equations', topics: [
    {slug: 'solving-basic-exponential-equations', parts: [part('4A', 'Solving Basic Exponential Equations', {doc: '04A'})]},
    {slug: 'solving-exponential-equations-with-algebraic-exponents', parts: [part('4B', 'Solving Exponential Equations with Algebraic Exponents', {doc: '04B'})]},
    {slug: 'solving-exponential-equations-with-coefficients', parts: [part('4C', 'Solving Exponential Equations with Coefficients', {doc: '04C'})]},
    {slug: 'section-d-review', review: true, title: 'Section 4 Review',
     parts: [part('4D', 'Section 4 Review', {doc: '04D'}), part('4E', 'Section 4 Review (Mixed)', {doc: '04E'})]}]}],
  review: {slug: 'comprehensive-review', title: 'Unit 4 Comprehensive Review',
   documents: [{doc: '05A', title: 'Unit 4 Comprehensive Review — Version 1'}, {doc: '05B', title: 'Unit 4 Comprehensive Review — Version 2'},
    {doc: '05C', title: 'Unit 4 Comprehensive Review — Mixed'}]}
 }
];

// ---- labels ----
export const sectionLabel = s => `Section ${s.n} — ${s.name}`;
export const partLabel = p => `${p.code} — ${p.title}`;
export const topicLabel = t => t.parts.length === 1 ? partLabel(t.parts[0]) : `${t.parts[0].code}–${t.parts.at(-1).code} — ${t.title}`;
const topicShortLabel = t => t.parts.length === 1 && t.parts[0].short ? `${t.parts[0].code} — ${t.parts[0].short}` : topicLabel(t);
export const partAnchor = p => `part-${p.code.toLowerCase()}`;

// ---- routes (absolute, ending in "/") ----
export const unitRoute = u => `/${u.dir}/`;
export const sectionRoute = (u, s) => `/${u.dir}/topics/${s.slug}/`;
export const topicRoute = (u, s, t) => u.nested ? `${sectionRoute(u, s)}${t.slug}/` : `/${u.dir}/topics/${t.slug}/`;
export const reviewRoute = u => `/${u.dir}/topics/${u.review.slug}/`;
// a part on a page that holds several documents is reached through its anchor
export const partRoute = (u, s, t, p) => t.parts.length > 1 ? `${topicRoute(u, s, t)}#${partAnchor(p)}` : topicRoute(u, s, t);

// The topics of a unit in teaching order, then the unit review: the order of the previous/next pager.
export function sequence(u) {
 return [...u.sections.flatMap(s => s.topics.map(t => ({kind: 'topic', section: s, topic: t, route: topicRoute(u, s, t), label: topicLabel(t)}))),
  {kind: 'review', route: reviewRoute(u), label: u.review.title}];
}

// Every IM1 page the standard covers, keyed by its file (relative to the repository root). The `practice` pages exist only
// where an engine was published; callers pass the list of files that exist.
export function pageInfo(rel) {
 for (const u of UNITS) {
  if (!rel.startsWith(u.dir + '/')) continue;
  const route = '/' + rel.replace(/index\.html$/, '');
  const crumbsUnit = [{name: 'Home', route: '/'}, {name: 'Integrated Math 1', route: '/im1/'}, {name: u.name, route: unitRoute(u)}];
  if (route === unitRoute(u)) return {unit: u, kind: 'unit', route, crumbs: crumbsUnit};
  for (const x of u.extras || []) if (route === unitRoute(u) + x.path)
   return {unit: u, kind: 'extra', route, extra: x, h1: x.title, crumbs: [...crumbsUnit, {name: x.title, route}]};
  const review = reviewRoute(u);
  if (route === review || route === review + 'practice/') {
   const practice = route !== review, base = [...crumbsUnit, {name: u.review.title, route: review}];
   const h1 = u.review.title + (practice ? ' Practice' : '');
   return {unit: u, kind: practice ? 'review-practice' : 'review', route, h1, subject: u.review.title,
    title: `${h1} | Integrated Math 1 | BatchMath`, crumbs: practice ? [...base, {name: h1, route}] : base};
  }
  for (const s of u.sections) {
   const sCrumbs = [...crumbsUnit, {name: sectionLabel(s), route: sectionRoute(u, s)}];
   if (route === sectionRoute(u, s)) {
    const h1 = `Unit ${u.n}: ${sectionLabel(s)}`;
    return {unit: u, kind: 'section', route, section: s, h1, title: fitTitle([h1]), crumbs: sCrumbs};
   }
   for (const t of s.topics) {
    const tr = topicRoute(u, s, t);
    if (route !== tr && route !== tr + 'practice/') continue;
    const practice = route !== tr, suffix = practice ? ' Practice' : '';
    const h1 = `Unit ${u.n}: ${topicLabel(t)}${suffix}`, short = `Unit ${u.n}: ${topicShortLabel(t)}${suffix}`;
    const tCrumbs = [...sCrumbs, {name: topicLabel(t), route: tr}];
    return {unit: u, kind: practice ? 'topic-practice' : 'topic', route, section: s, topic: t, h1, title: fitTitle([h1, short]),
     subject: t.parts.length === 1 ? t.parts[0].title : t.title,
     crumbs: practice ? [...tCrumbs, {name: topicLabel(t) + suffix, route}] : tCrumbs};
   }
  }
  return null;
 }
 return null;
}
// The browser-tab title: "<heading> | BatchMath" when it fits the 85-character limit, else a shorter form.
function fitTitle(headings) {
 for (const candidate of [...headings.map(h => `${h} | BatchMath`), ...headings]) if (candidate.length <= 85) return candidate;
 throw new Error(`No title within 85 characters for ${headings[0]}`);
}

// ---- markup ----
export const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
// A link from the page at `from` to `to` in the unit's own style: absolute for Units 3-4, relative for Units 1-2 (whose
// pages also work when opened straight from disk).
export function href(u, from, to, {forceRelative = false} = {}) {
 if (u.links === 'absolute' && !forceRelative) return to;
 const [toPath, hash] = to.split('#');
 let rel = path.posix.relative(from, toPath);
 rel = rel === '' ? `../${path.posix.basename(toPath)}/` : rel + '/';
 return rel + (hash ? '#' + hash : '');
}
export function breadcrumbs(crumbs) {
 return `<nav class="bm-breadcrumbs" aria-label="Breadcrumb" data-batchmath-breadcrumbs="11"><ol>${crumbs.map((c, i) => i === crumbs.length - 1
  ? `<li aria-current="page"><span>${esc(c.name)}</span></li>` : `<li><a href="${c.route}">${esc(c.name)}</a></li>`).join('')}</ol></nav>`;
}
// The "Jump to topic" menu: one optgroup per section, every part as an option, then the unit review. `selected` is the
// topic (its first part is selected) or the string 'review'; null shows the "Select a topic" prompt.
export function topicSelect(u, from, selected) {
 const groups = u.sections.map(s => `<optgroup label="${esc(sectionLabel(s))}">${s.topics.map(t => t.parts.map((p, i) =>
  `<option value="${href(u, from, partRoute(u, s, t, p))}"${selected === t && i === 0 ? ' selected' : ''}>${esc(partLabel(p))}</option>`).join('')).join('')}</optgroup>`).join('');
 const review = `<optgroup label="Unit Review"><option value="${href(u, from, reviewRoute(u))}"${selected === 'review' ? ' selected' : ''}>${esc(u.review.title)}</option></optgroup>`;
 return `<div class="unit-nav"><label for="unit-select">Jump to topic:</label><select id="unit-select" class="unit-select">${selected ? '' : '<option value="">Select a topic</option>'}${groups}${review}</select></div>`;
}
// Unit page: the four section cards, any unit-wide extra (passed in as markup), then the unit review.
export function unitCards(u, extraMarkup = '') {
 const from = unitRoute(u);
 return `<section class="resource-section"><h2>Sections</h2><div class="topic-grid">${u.sections.map(s => `<a class="card" href="${href(u, from, sectionRoute(u, s), {forceRelative: true})}">${esc(sectionLabel(s))}</a>`).join('')}${extraMarkup}<a class="card" href="${href(u, from, reviewRoute(u), {forceRelative: true})}">${esc(u.review.title)}</a></div></section>`;
}
// Section page: one card per part (a page with several documents gets a card for each, linking to its anchor).
export function sectionCards(u, s) {
 const from = sectionRoute(u, s);
 return `<section class="resource-section"><h2>${esc(u.sectionHeading)}</h2><div class="topic-grid">${s.topics.map(t => t.parts.map(p =>
  `<a class="card" href="${href(u, from, partRoute(u, s, t, p), {forceRelative: true})}">${esc(partLabel(p))}</a>`).join('')).join('')}</div></section>`;
}
export function backLink(u, info) {
 const from = info.route;
 if (info.kind === 'section' || info.kind === 'review') return `<a class="back" href="${href(u, from, unitRoute(u), {forceRelative: true})}">← ${esc(u.name)}</a>`;
 if (info.kind === 'topic') return `<a class="back" href="${href(u, from, sectionRoute(u, info.section), {forceRelative: true})}">← ${esc(sectionLabel(info.section))}</a>`;
 return null;
}
// Previous/next links between the unit's topics, in each unit's existing pager markup.
export function pager(u, route) {
 const seq = sequence(u), i = seq.findIndex(x => x.route === route);
 if (i < 0) throw new Error(`${route} is not in the Unit ${u.n} sequence`);
 const prev = seq[i - 1], next = seq[i + 1], aria = `Previous and next Unit ${u.n} topics`;
 if (u.links === 'absolute')
  return `<nav class="topic-pager" aria-label="${aria}">${prev ? `<a class="topic-pager-link" href="${prev.route}">← ${esc(prev.label)}</a>` : '<span></span>'}${next ? `<a class="topic-pager-link next" href="${next.route}">${esc(next.label)} →</a>` : ''}</nav>`;
 return `<nav aria-label="${aria}" class="topic-pager">${prev ? `<a class="topic-pager-link prev" href="${href(u, route, prev.route)}">← ${esc(prev.label)}</a>` : ''}${next ? `<a class="topic-pager-link next" href="${href(u, route, next.route)}">${esc(next.label)} →</a>` : ''}</nav>`;
}
// The BreadcrumbList and WebPage nodes of the page's JSON-LD (the format tools/seo-build.mjs writes).
export function structuredData(title, description, canonical, crumbs) {
 const ORIGIN = 'https://batchmath.net';
 return {'@context': 'https://schema.org', '@graph': [
  {'@type': 'WebPage', '@id': `${canonical}#page`, name: title, url: canonical, description, isPartOf: {'@id': `${ORIGIN}/#website`}},
  {'@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({'@type': 'ListItem', position: i + 1, name: c.name, item: ORIGIN + c.route}))}]};
}

// The elements this standard owns, blanked: what remains of a page must not change when only navigation or labels change.
// QA uses it to prove that a relabeling left videos, documents, practice engines and content byte for byte.
const NAVIGATION_ELEMENTS = [
 [/<title>[\s\S]*?<\/title>/g, '<title></title>'],
 [/<meta property="og:title" content="[^"]*">/g, '<og:title>'],
 [/<meta name="twitter:title" content="[^"]*">/g, '<twitter:title>'],
 [/(<script type="application\/ld\+json" data-batchmath-structured-data="11">)[\s\S]*?(<\/script>)/g, '$1$2'],
 [/<nav class="bm-breadcrumbs"[\s\S]*?<\/nav>/g, '<breadcrumbs>'],
 [/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/g, '$1$2'],
 [/<a class="back" href="[^"]*">[^<]*<\/a>/g, '<back>'],
 [/<div class="unit-nav"><label for="unit-select">Jump to (?:topic|unit):<\/label><select[\s\S]*?<\/select><\/div>/g, '<menu>'],
 [/<section class="resource-section"><h2>[^<]*<\/h2><div class="topic-grid">[\s\S]*?<\/div><\/section>/g, '<cards>'],
 [/<div class="topic-grid">[\s\S]*?<\/div>(?=\s*<\/main>)/g, '<cards>'],
 [/(<div class="resource-title">)[^<]*(<\/div>)/g, '$1$2'],
 [/<div class="resource-item"(?: id="[^"]*")?>/g, '<div class="resource-item">'],
 [/(<span class="bm-practice-label">)[^<]*(<\/span>)/g, '$1$2'],
 [/(<a aria-label=")[^"]*(" class="resource-link bm-practice-launch)/g, '$1$2'],
 [/<nav (?:class="topic-pager" aria-label="[^"]*"|aria-label="[^"]*" class="topic-pager")>[\s\S]*?<\/nav>/g, '<pager>'],
 [/<div class="bm-context-bar">[\s\S]*?<\/div>/g, '<context>'],
 [/(<select id="practiceMode" class="bm-practice-select">)([\s\S]*?)(<\/select>)/g, (a, open, options, close) => open + options.replace(/(<option value="[^"]*"[^>]*>)[^<]*(<\/option>)/g, '$1$2') + close],
 [/(<a class="card" href="\.\.\/topics\/[^/]+\/practice\/">)[^<]*(<\/a>)/g, '$1$2']
];
export function navigationMask(html) {
 for (const [pattern, replacement] of NAVIGATION_ELEMENTS) html = html.replace(pattern, replacement);
 return html;
}
