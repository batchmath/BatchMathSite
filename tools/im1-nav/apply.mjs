// Apply the IM1 navigation standard (tools/im1-nav/structure.mjs) to the published Integrated Math 1 pages, in place.
// It rewrites only navigation and labels: titles, social titles, JSON-LD names and breadcrumbs, visible breadcrumbs,
// headings, back links, "Jump to topic" menus, section and unit cards, resource titles, practice-launch labels,
// previous/next links and the practice-type menu labels. Everything else on a page (videos, PDFs, practice engines and
// their scripts, analytics, descriptions) is left byte for byte. It also creates the Unit 1 and Unit 2 section pages.
// Running it twice changes nothing.
//
// Usage (from the repository root):
//   node tools/im1-nav/apply.mjs            apply to Units 1-3 and create the missing section pages
//   node tools/im1-nav/apply.mjs --check    change nothing; list every IM1 page (Units 1-4) that differs from the standard
// Unit 4 is written complete by tools/build-im1-unit4-pages.mjs from the same structure; --check confirms it agrees.
import fs from 'node:fs';
import path from 'node:path';
import {UNITS, pageInfo, sectionLabel, partLabel, topicLabel, partAnchor, topicSelect, unitCards, sectionCards, backLink, pager,
 breadcrumbs, structuredData, esc, sectionRoute} from './structure.mjs';

const root = process.cwd(), check = process.argv.includes('--check');
const ORIGIN = 'https://batchmath.net';
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

// Replace the single match of `re` (which must match exactly once) with `to` (a string or a function of the match).
function once(html, re, to, what, rel) {
 const all = [...html.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))];
 if (all.length !== 1) throw new Error(`${rel}: expected one ${what}, found ${all.length}`);
 return html.replace(re, typeof to === 'function' ? to : () => to);
}
const escTitle = esc; // titles are plain text; the same escaping as the page builders

function updateHead(html, info, rel) {
 if (info.title) {
  html = once(html, /<title>[\s\S]*?<\/title>/, `<title>${escTitle(info.title)}</title>`, 'title', rel);
  html = once(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(info.title)}">`, 'og:title', rel);
  html = once(html, /<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(info.title)}">`, 'twitter:title', rel);
 }
 return once(html, /(<script type="application\/ld\+json" data-batchmath-structured-data="11">)([\s\S]*?)(<\/script>)/, (all, open, json, close) => {
  const data = JSON.parse(json);
  for (const node of data['@graph']) {
   if (node['@type'] === 'WebPage' && info.title) node.name = info.title;
   if (node['@type'] === 'BreadcrumbList') node.itemListElement = info.crumbs.map((c, i) => ({'@type': 'ListItem', position: i + 1, name: c.name, item: ORIGIN + c.route}));
  }
  const out = JSON.stringify(data);
  if (out.includes('<')) throw new Error(`${rel}: unexpected "<" in structured data`);
  return open + out + close;
 }, 'JSON-LD block', rel);
}

function updateMain(html, info, rel) {
 const u = info.unit;
 html = once(html, /<nav class="bm-breadcrumbs"[\s\S]*?<\/nav>/, breadcrumbs(info.crumbs), 'breadcrumb trail', rel);
 if (info.h1) html = once(html, /(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/, (a, open, close) => open + esc(info.h1) + close, 'H1', rel);
 const back = backLink(u, info);
 if (back) html = once(html, /<a class="back" href="[^"]*">[^<]*<\/a>/, back, 'back link', rel);
 if (['unit', 'section', 'topic', 'review'].includes(info.kind)) {
  const selected = info.kind === 'topic' ? info.topic : info.kind === 'review' ? 'review' : null;
  html = once(html, /<div class="unit-nav"><label for="unit-select">Jump to (?:topic|unit):<\/label><select[\s\S]*?<\/select><\/div>/,
   topicSelect(u, info.route, selected), 'topic menu', rel);
 }
 if (info.kind === 'unit') {
  // Unit 1's page held its cards (and the Unit 1 Practice card) in a bare grid; every unit now uses the same section block.
  html = once(html, /<section class="resource-section"><h2>(?:Sections|Topics)<\/h2><div class="topic-grid">[\s\S]*?<\/div><\/section>|<div class="topic-grid">[\s\S]*?<\/div>(?=\s*<\/main>)/, block => {
   const extras = (block.match(/<a [^>]*bm-practice-launch[^>]*>[\s\S]*?<\/a>/g) || []).join('');
   return unitCards(u, extras);
  }, 'unit card grid', rel);
  if (u.n === 1) html = once(html, /<div class="bm-context-bar">[\s\S]*?<\/div>/,
   '<div class="bm-context-bar"><strong>4 sections</strong><span class="bm-context-dot">•</span><span>10 topics</span><span class="bm-context-dot">•</span><span>Unit practice</span><span class="bm-context-dot">•</span><span>Comprehensive review</span></div>', 'context bar', rel);
 }
 if (info.kind === 'section') html = once(html, /<section class="resource-section"><h2>[^<]*<\/h2><div class="topic-grid">[\s\S]*?<\/div><\/section>/, sectionCards(u, info.section), 'section card grid', rel);
 if (info.kind === 'topic' || info.kind === 'review') {
  const label = info.kind === 'topic' ? topicLabel(info.topic) : u.review.title;
  // resource titles: a topic's documents carry their part labels; the unit review keeps its documents' own names
  const titles = info.kind === 'topic' ? info.topic.parts.map(partLabel) : (u.review.documents || []).map(d => d.title);
  const found = html.match(/<div class="resource-title">[^<]*<\/div>/g) || [];
  if (titles.length && found.length) {
   if (found.length !== titles.length) throw new Error(`${rel}: ${found.length} resource titles for ${titles.length} documents`);
   let i = 0; html = html.replace(/<div class="resource-title">[^<]*<\/div>/g, () => `<div class="resource-title">${esc(titles[i++])}</div>`);
  } else if (info.kind === 'topic' && found.length) throw new Error(`${rel}: unexpected resource titles`);
  if (info.kind === 'topic' && info.topic.parts.length > 1) {
   let i = 0; html = html.replace(/<div class="resource-item"(?: id="[^"]*")?>/g, () => `<div class="resource-item" id="${partAnchor(info.topic.parts[i++])}">`);
   if (i !== info.topic.parts.length) throw new Error(`${rel}: ${i} resource items for ${info.topic.parts.length} parts`);
  }
  if (/class="bm-practice-label"/.test(html)) {
   html = once(html, /(<span class="bm-practice-label">)[^<]*(<\/span>)/, (a, open, close) => `${open}${esc(label)} Practice${close}`, 'practice label', rel);
   html = html.replace(/(<a aria-label=")[^"]*(" class="resource-link bm-practice-launch)/, (a, open, rest) => `${open}${esc(label)} Practice${rest}`);
  }
  html = once(html, /<nav (?:class="topic-pager" aria-label="[^"]*"|aria-label="[^"]*" class="topic-pager")>[\s\S]*?<\/nav>/, pager(u, info.route), 'previous/next links', rel);
 }
 if (info.kind === 'topic-practice' || info.kind === 'review-practice') {
  // practice-type menus on review practice pages: same values, standard labels
  // ("Mixed" options keep their wording; the values, which the engines read, never change)
  html = html.replace(/(<select id="practiceMode" class="bm-practice-select">)([\s\S]*?)(<\/select>)/, (a, open, options, close) => open + options.replace(/<option value="([^"]*)"([^>]*)>[^<]*<\/option>/g, (o, value, attrs) => {
   if (value === 'mixed') return o;
   const sectionIndex = ['a', 'b', 'c', 'd'].indexOf(value);
   const topic = u.sections.flatMap(s => s.topics).find(t => t.slug === value);
   const label = sectionIndex >= 0 ? sectionLabel(u.sections[sectionIndex]) : topic ? partLabel(topic.parts[0]) : null;
   if (!label) throw new Error(`${rel}: unknown practice type ${value}`);
   return `<option value="${value}"${attrs}>${esc(label)}</option>`;
  }) + close);
 }
 if (info.kind === 'extra' && u.n === 1) {
  // the Unit 1 Practice page lists every engine
  html = html.replace(/<a class="card" href="\.\.\/topics\/([^/]+)\/practice\/">[^<]*<\/a>/g, (a, slug) => {
   const t = u.sections.flatMap(s => s.topics).find(x => x.slug === slug);
   if (!t) throw new Error(`${rel}: unknown practice card ${slug}`);
   return `<a class="card" href="../topics/${slug}/practice/">${esc(topicLabel(t))}</a>`;
  });
 }
 return html;
}

// A new section page for Units 1-2, made from a page of the same unit at the same depth (same styles, scripts, header and
// footer), with its own metadata and content.
const TEMPLATES = {1: 'im1/unit-1-review/topics/multiplication/index.html', 2: 'im1/unit-2-algebraic-operations-equations-inequalities/topics/solving-linear-inequalities/index.html'};
function metadataBlock(title, description, canonical, crumbs) {
 const SOCIAL_IMAGE = `${ORIGIN}/assets/batchmath-social-card-v1.png`, SOCIAL_ALT = 'BatchMath — math resources for Integrated Math 1, Calculus Prep, and AP Calculus AB';
 const t = esc(title), d = esc(description), json = JSON.stringify(structuredData(title, description, canonical, crumbs)).replace(/</g, '\\u003c');
 return ['<!-- BatchMath technical SEO metadata — v11 -->', `<meta name="description" content="${d}">`, `<link rel="canonical" href="${canonical}">`,
  '<meta property="og:site_name" content="BatchMath">', '<meta property="og:type" content="website">', `<meta property="og:title" content="${t}">`,
  `<meta property="og:description" content="${d}">`, `<meta property="og:url" content="${canonical}">`, `<meta property="og:image" content="${SOCIAL_IMAGE}">`,
  '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">', '<meta property="og:image:type" content="image/png">',
  `<meta property="og:image:alt" content="${esc(SOCIAL_ALT)}">`, '<meta name="twitter:card" content="summary_large_image">', `<meta name="twitter:title" content="${t}">`,
  `<meta name="twitter:description" content="${d}">`, `<meta name="twitter:image" content="${SOCIAL_IMAGE}">`, `<meta name="twitter:image:alt" content="${esc(SOCIAL_ALT)}">`,
  `<script type="application/ld+json" data-batchmath-structured-data="11">${json}</script>`, ''].join('\n');
}
function newSectionPage(u, s) {
 const rel = `${sectionRoute(u, s).slice(1)}index.html`, info = pageInfo(rel), template = read(TEMPLATES[u.n]);
 if (/data-video-id|instructional-videos/.test(template)) throw new Error('section page template must not carry videos');
 // nothing of the template's own identity may survive: its canonical URL or its description
 const leftovers = [`${ORIGIN}/${TEMPLATES[u.n].replace(/index\.html$/, '')}`, template.match(/<meta name="description" content="([^"]*)">/)[1]];
 let html = once(template, /<title>[\s\S]*?<\/title>/, `<title>${escTitle(info.title)}</title>`, 'template title', rel);
 html = once(html, /<!-- BatchMath technical SEO metadata — v11 -->\n[\s\S]*?<\/script>\n/, metadataBlock(info.title, s.description, ORIGIN + info.route, info.crumbs), 'template metadata', rel);
 html = once(html, /(<main\b[^>]*>)[\s\S]*?(<\/main>)/, (a, open, close) => `${open}${breadcrumbs(info.crumbs)}${backLink(u, info)}<h1 class="page-title">${esc(info.h1)}</h1><p class="topic-description">${esc(s.description)}</p>${topicSelect(u, info.route, null)}${sectionCards(u, s)}${close}`, 'template main', rel);
 for (const x of leftovers) if (html.includes(x)) throw new Error(`${rel}: still carries its template's ${x}`);
 return html;
}

// ---- run ----
const files = [];
(function walk(dir) {for (const e of fs.readdirSync(path.join(root, dir), {withFileTypes: true})) {
 const rel = `${dir}/${e.name}`; if (e.isDirectory()) walk(rel); else if (e.name === 'index.html') files.push(rel);}})('im1');
const units = check ? UNITS : UNITS.filter(u => u.n <= 3);
const changed = [], created = [];
for (const u of units) {
 for (const s of u.sections.filter(x => x.added)) {
  const rel = `${sectionRoute(u, s).slice(1)}index.html`;
  if (!files.includes(rel)) {created.push(rel); if (!check) {fs.mkdirSync(path.dirname(path.join(root, rel)), {recursive: true}); fs.writeFileSync(path.join(root, rel), newSectionPage(u, s)); files.push(rel);}}
 }
 for (const rel of files.filter(f => f.startsWith(u.dir + '/')).sort()) {
  const info = pageInfo(rel);
  if (!info) throw new Error(`${rel} is not in tools/im1-nav/structure.mjs`);
  const before = read(rel), after = updateMain(updateHead(before, info, rel), info, rel);
  if (after !== before) {changed.push(rel); if (!check) fs.writeFileSync(path.join(root, rel), after);}
 }
}
if (check) {
 for (const f of [...created.map(f => `missing: ${f}`), ...changed.map(f => `differs: ${f}`)]) console.log(f);
 console.log(`IM1 navigation check: ${changed.length + created.length} page(s) differ from the standard.`);
 if (changed.length + created.length) process.exitCode = 1;
} else console.log(`IM1 navigation: ${created.length} section page(s) created, ${changed.length} page(s) updated.`);
