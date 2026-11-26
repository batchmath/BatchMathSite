#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  UNITS, unitRoute, sectionRoute, partRoute, reviewRoute, sequence, sectionLabel, partLabel,
} from '../im1-nav/structure.mjs';
import {
  all, first, document, attr, has, hasClass, tagged, label, escape, source, start, end,
  beforeClose, replacement, insert, apply,
} from './html.mjs';
import {practiceDescription} from './practice-copy.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const ORIGIN = 'https://batchmath.net';
const COURSE = /^(?:\/ap-calculus\/|\/im1\/|\/calculus-prep\/)/;
const SCRIPT = '<script defer src="/assets/site-navigation.js"></script>';
const flags = process.argv.slice(2);
const check = flags.includes('--check');
const selectedRoutes = flags.filter(flag => flag.startsWith('--only=')).map(flag => flag.slice(7));

function walk(dir) {
  const skips = new Set(['.git', 'docs', 'node_modules', 'qa-results', 'tools']);
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory() && !skips.has(entry.name)) return walk(file);
    return entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  });
}

function routeFor(file) {
  return '/' + path.relative(ROOT, file).split(path.sep).join('/').replace(/(^|\/)index\.html$/, '$1');
}

function internal(raw, route) {
  if (!raw) return null;
  const url = new URL(raw, ORIGIN + route);
  if (url.origin !== ORIGIN) return null;
  const pathname = url.pathname.replace(/\/index\.html$/, '/');
  return {path: pathname, hash: url.hash};
}

const isAnchor = node => tagged(node, 'a') && has(node, 'href');
const isLegacyTopicSelect = node => hasClass(node, 'unit-nav') && first(node, child =>
  tagged(child, 'label') && /^Jump to topic\b/i.test(label(child)));
const isLaunch = node => has(node, 'data-bm-topic-practice') || attr(node, 'id') === 'topic-practice';
const isRelated = node => has(node, 'data-bm-related-practice') ||
  tagged(node, 'nav') && /^Related practice and topics$/i.test(attr(node, 'aria-label'));
const intro = main => first(main, node => tagged(node, 'p') && (
  hasClass(node, 'topic-description') || hasClass(node, 'intro')));
const h1 = main => first(main, node => tagged(node, 'h1'));
const seoContext = node => tagged(node, 'p') && has(node, 'data-batchmath-seo-context');

const pages = new Map(walk(ROOT).sort().map(file => {
  const html = fs.readFileSync(file, 'utf8');
  const route = routeFor(file);
  const engine = COURSE.test(route) && /\bBM_ANALYTICS_CONFIG\s*=/.test(html) &&
    /<script\b[^>]*\bsrc=["'][^"']*\bproblem-tracking\.js/.test(html);
  return [route, {file, html, route, engine, public: !/<meta\b[^>]*(?:noindex|http-equiv=["']refresh)/i.test(html)}];
}));

function routeLabel(node, page) {
  const heading = first(node, child => tagged(child, 'h2'));
  return label(heading || node) || label(h1(document(page.html).main));
}

function syllabus(route, accepts) {
  const landing = pages.get(route);
  if (!landing) return [];
  const {main} = document(landing.html);
  const found = new Map();
  for (const link of all(main, isAnchor)) {
    const target = internal(attr(link, 'href'), route)?.path;
    const page = pages.get(target);
    if (page?.public && accepts(target)) found.set(target, {route: target, label: routeLabel(link, page)});
  }
  return [...found.values()];
}

const collections = new Map();
for (const unit of UNITS) {
  const route = unitRoute(unit);
  const groups = unit.sections.map(section => ({
    title: sectionLabel(section), route: sectionRoute(unit, section), items: section.topics.flatMap(topic =>
      topic.parts.map(part => ({route: partRoute(unit, section, topic, part), label: partLabel(part)}))),
  }));
  groups.push({title: 'Unit Review', items: [{route: reviewRoute(unit), label: unit.review.title}]});
  const entries = sequence(unit);
  collections.set(route, {groups, entries});
}
for (const route of pages.keys()) {
  if (!/^\/ap-calculus\/unit-[^/]+\/$/.test(route)) continue;
  const prefix = route + 'topics/';
  const entries = syllabus(route, target => target.startsWith(prefix) && /^[^/]+\/$/.test(target.slice(prefix.length)));
  if (entries.length) collections.set(route, {groups: [{items: entries}], entries});
}
const prep = '/calculus-prep/';
const prepEntries = syllabus(prep, target => pages.get(target).engine);
collections.set(prep, {groups: [{items: prepEntries}], entries: prepEntries});

const enginesByTopic = new Map();
const enginePages = [...pages.values()].filter(page => page.engine && page.public);
function parentTopic(page, entries) {
  return entries.find(item => page.route.startsWith(item.route) && page.route !== item.route);
}

for (const page of pages.values()) {
  if (!page.public || !COURSE.test(page.route)) continue;
  const collection = [...collections].find(([prefix]) => page.route.startsWith(prefix));
  if (!collection) continue;
  [page.unit, page.syllabus] = collection;
  page.topic = parentTopic(page, page.syllabus.entries);
  if (!page.engine || !page.topic) continue;
  const siblings = enginesByTopic.get(page.topic.route) || [];
  siblings.push(page);
  enginesByTopic.set(page.topic.route, siblings);
}

function linkItem(item, page) {
  const destination = internal(item.route, page.route);
  if (!pages.get(destination.path)?.public) throw new Error(`${page.route}: topic destination ${item.route} is not public`);
  const current = item.route === page.route ? ' aria-current="page"' :
    item.route === page.topic?.route && page.engine ? ' aria-current="location"' : '';
  return `<a href="${escape(item.route)}"${current}>${escape(item.label)}</a>`;
}

function topicMenu(page) {
  const groups = page.syllabus.groups.map(group => {
    const section = group.title ? `<p>${group.route ? linkItem({route: group.route, label: group.title}, page) : escape(group.title)}</p>` : '';
    return `${section}<ul>${group.items.map(item => `<li>${linkItem(item, page)}</li>`).join('')}</ul>`;
  }).join('');
  return '<details class="bm-topics"><summary aria-controls="bm-topics-panel">Topics</summary>' +
    `<nav id="bm-topics-panel" class="bm-topics-panel" aria-label="Topics">${groups}</nav></details>`;
}

function withTopicMenu(page, html, report) {
  if (!page.syllabus?.entries.length) return html;
  const {main} = document(html);
  if (!main || !h1(main)) throw new Error(`${page.route}: no main heading for topic navigation`);
  const old = all(main, isLegacyTopicSelect);
  const current = first(main, node => hasClass(node, 'bm-topics'));
  const edits = old.map(node => replacement(node));
  const heading = h1(main);
  edits.push(current ? replacement(current, topicMenu(page)) : insert(end(heading), topicMenu(page)));
  report.topicsMenu = true;
  report.legacyTopicSelectors = old.length;
  return apply(html, edits);
}

function engineMode(engine) {
  const slug = engine.route.split('/').at(-2);
  if (slug === 'calculator-practice') return 'Calculator practice';
  if (slug === 'non-calculator-practice') return 'Non-calculator practice';
  const {main} = document(engine.html);
  const heading = label(h1(main));
  const description = label(intro(main));
  if (/calculator/i.test(heading)) {
    if (/non[- ]calculator|without a calculator/i.test(heading)) return 'Non-calculator practice';
    if (/\bcalculator\s+practice\b/i.test(heading)) return 'Calculator practice';
  }
  if (/^(?:calculator[- ]active|use a graphing calculator)/i.test(description)) return 'Calculator practice';
  if (/^(?:non[- ]calculator|no calculator)/i.test(description)) return 'Non-calculator practice';
  return null;
}

function engineLinks(page, engines, html, main) {
  const links = new Map();
  for (const anchor of all(main, isAnchor)) {
    if (anchor.parentNode && isRelated(anchor.parentNode)) continue;
    const target = internal(attr(anchor, 'href'), page.route)?.path;
    if (!engines.some(engine => engine.route === target) || links.has(target)) continue;
    const text = attr(anchor, 'aria-label') || label(first(anchor, node => hasClass(node, 'bm-practice-label'))) || label(anchor);
    links.set(target, {text, anchor});
  }
  const ordered = [...links.keys(), ...engines.map(item => item.route).filter(route => !links.has(route))];
  return ordered.map(route => {
    const engine = pages.get(route);
    const found = links.get(route);
    const name = label(h1(document(engine.html).main));
    const mode = engineMode(engine);
    const text = mode ?? (found?.text || name);
    return {route, text, anchor: found?.anchor, markup: found?.anchor && hasClass(found.anchor, 'bm-practice-launch') &&
      (!mode || new RegExp(mode, 'i').test(found.text)) ? source(html, found.anchor) : null};
  });
}

function withPracticeLaunch(page, html, report) {
  const engines = enginesByTopic.get(page.route);
  if (!engines?.length) return html;
  const {main} = document(html);
  const links = engineLinks(page, engines, html, main);
  const list = links.map(({route, text, markup}) => markup ??
    `<a class="resource-link" data-bm-resource="practice" href="${escape(route)}">${escape(text)}</a>`).join('');
  const block = '<section id="topic-practice" class="resource-section bm-topic-practice" data-bm-topic-practice="1" aria-labelledby="topic-practice-heading">' +
    `<h2 id="topic-practice-heading">Practice This Topic</h2><div class="resource-actions bm-practice-launch-row">${list}</div></section>`;

  const wrappers = all(main, isLaunch).filter(node => !all(node, isAnchor).some(anchor =>
    !links.some(link => link.route === internal(attr(anchor, 'href'), page.route)?.path)));
  const outer = wrappers.filter(node => !wrappers.some(parent => parent !== node && start(parent) < start(node) && end(parent) >= end(node)));
  const description = intro(main);
  const place = end(description || h1(main));
  const edits = outer.filter(node => start(node) !== place).map(node => replacement(node));
  const inPlace = outer.find(node => start(node) === place);
  edits.push(inPlace ? replacement(inPlace, block) : insert(place, block));
  report.practiceLaunch = links.map(item => item.route);
  return apply(html, edits);
}

function withRelated(page, html, report) {
  if (!page.engine || !page.syllabus) return html;
  const {main} = document(html);
  if (!main) throw new Error(`${page.route}: engine has no main`);
  const entries = page.syllabus.entries;
  const position = entries.findIndex(item => item.route === (page.topic?.route || page.route));
  const next = position >= 0 ? entries[position + 1] : entries[0];
  const links = [];
  if (page.topic) {
    const parent = pages.get(page.topic.route);
    const video = /data-video-id=|<iframe[^>]+youtube(?:-nocookie)?\.com|youtube\.com\/embed\//i.test(parent.html);
    links.push({route: page.topic.route, text: video ? 'Lesson videos and resources' : 'Topic overview and resources',
      type: video ? 'lesson' : 'topic'});
    const parentMain = document(parent.html).main;
    links.push(...engineLinks(parent, enginesByTopic.get(parent.route), parent.html, parentMain)
      .filter(item => item.route !== page.route).map(item => ({...item, type: 'related-practice'})));
  }
  if (next) links.push({route: next.route, text: next.label, type: 'next-topic'});
  if (page.route.startsWith('/ap-calculus/') && /\/(?:comprehensive-review|semester-1-review)\//.test(page.route)) {
    links.push({route: '/ap-calculus/ap-test-preparation/', text: 'AP Calculus exam preparation', type: 'exam-prep'});
  }
  if (!page.topic || !next) links.push({route: page.unit,
    text: page.unit === prep ? 'All Calculus Prep skills' : 'Back to the unit', type: 'unit'});
  const items = links.map(item => `<li><a data-bm-engagement="${item.type}" href="${escape(item.route)}">${escape(item.text)}</a></li>`).join('');
  const title = page.unit === prep ? 'Related skills' : 'Related practice and topics';
  const block = `<nav class="bm-related-practice" data-bm-related-practice aria-labelledby="bm-related-heading"><h2 id="bm-related-heading">${title}</h2><ul>${items}</ul></nav>`;
  const prior = all(main, isRelated);
  report.related = links.map(item => item.route);
  return apply(html, prior.length ? [replacement(prior[0], block), ...prior.slice(1).map(node => replacement(node))] :
    [insert(beforeClose(main), block)]);
}

function withPracticeCopy(page, html) {
  if (!page.engine) return html;
  const {main} = document(html);
  const heading = h1(main);
  const original = intro(main);
  const context = first(main, seoContext);
  const parent = pages.get(page.topic?.route);
  const topicCopy = parent ? label(intro(document(parent.html).main)) : '';
  const described = practiceDescription(page.route, label(original), topicCopy);
  if (!described && (!context || !original || context === original)) return html;
  if (original && described && /[<](?:span|code|em|strong|math)\b/i.test(source(html, original))) return html;
  const marker = context ? ' data-batchmath-seo-context="11"' : '';
  const markup = described
    ? `<p class="topic-description"${marker}>${escape(described)}</p>`
    : source(html, original).replace(/^<p\b/, '<p' + marker);
  const primary = original || context;
  const edits = [primary ? replacement(primary, markup) : insert(end(heading), markup)];
  if (context && primary !== context) edits.push(replacement(context));
  return apply(html, edits);
}

function withExamLink(page, html) {
  if (!/^\/ap-calculus\/unit-[^/]+\/topics\/(?:comprehensive-review|semester-1-review)\/$/.test(page.route)) return html;
  const {main} = document(html);
  if (first(main, node => attr(node, 'data-bm-engagement') === 'exam-prep')) return html;
  const target = '/ap-calculus/ap-test-preparation/';
  if (!pages.get(target)?.public) return html;
  const link = '<p class="bm-exam-review-link"><a data-bm-engagement="exam-prep" href="' + target +
    '">AP Calculus exam format and past free-response questions</a></p>';
  return apply(html, [insert(beforeClose(main), link)]);
}

function withLectureHeading(page, html) {
  if (!/^\/ap-calculus\/unit-1-limits-continuity\/topics\/[^/]+\/$/.test(page.route)) return html;
  const {main} = document(html);
  const grid = first(main, node => hasClass(node, 'video-grid') && has(node, 'data-bm-videos'));
  if (!grid || !tagged(first(main, node => /^h[2-6]$/.test(node.tagName) &&
    start(node) >= start(grid)), 'h3')) return html;
  if (grid.parentNode !== main || first(main, node => hasClass(node, 'bm-lecture-heading'))) return html;
  return apply(html, [insert(start(grid), '<h2 class="bm-lecture-heading">Lecture Videos</h2>')]);
}

function withRuntime(html, report) {
  const needsAnalytics = /data-bm-resource\s*=|data-bm-engagement\s*=|data-video-id\s*=|frq-data\.js/.test(html);
  if (!report.topicsMenu && !needsAnalytics) return html;
  if (html.includes(SCRIPT)) return html;
  const {tree} = document(html);
  const head = first(tree, node => tagged(node, 'head'));
  if (!head?.sourceCodeLocation?.endTag) throw new Error('Missing document head');
  const css = /<link\b[^>]*href=["'][^"']*\/site\.css/.test(html) ? '' :
    '<link rel="stylesheet" href="/assets/site.css" data-batchmath-shared-style="v10.0">';
  return apply(html, [insert(beforeClose(head), css + SCRIPT)]);
}

const rows = [];
for (const page of pages.values()) {
  const report = {route: page.route, topicsMenu: false, legacyTopicSelectors: 0};
  rows.push(report);
  if (!page.public || (selectedRoutes.length && !selectedRoutes.includes(page.route))) continue;
  try {
    let html = withTopicMenu(page, page.html, report);
    html = withPracticeLaunch(page, html, report);
    html = withPracticeCopy(page, html);
    html = withRelated(page, html, report);
    html = withLectureHeading(page, html);
    html = withExamLink(page, html);
    html = withRuntime(html, report);
    report.changed = html !== page.html;
    if (report.changed && !check) fs.writeFileSync(page.file, html);
  } catch (error) {
    throw new Error(`${page.route}: ${error.message}`, {cause: error});
  }
}
const changed = rows.filter(row => row.changed);
const counts = {
  inspected: rows.length,
  changed: changed.length,
  menus: rows.filter(row => row.topicsMenu).length,
  legacyTopicSelectors: rows.reduce((count, row) => count + row.legacyTopicSelectors, 0),
  practiceLaunch: rows.filter(row => row.practiceLaunch).length,
  related: rows.filter(row => row.related).length,
  enginePages: enginePages.length,
};
console.log(JSON.stringify(counts));
const reportPath = process.env.BM_NAV_REPORT;
if (reportPath) fs.writeFileSync(reportPath, JSON.stringify({counts, pages: rows}, null, 2) + '\n');
if (check && changed.length) {
  console.error('Navigation needs regeneration on:\n' + changed.map(row => row.route).join('\n'));
  process.exitCode = 1;
}
