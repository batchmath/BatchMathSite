import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const archive = require(path.join(root, 'archive/archive.js'));
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSE-I_jrGGCCHBosWe8aeBBp7CrN8s-Oxqz4tMXLE6UZ-jfr14jRIme4dRQasM-eg/pub?gid=599000823&single=true&output=csv';

const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('archive/index.html');
const css = read('archive/archive.css');
const js = read('archive/archive.js');
const sw = read('sw.js');
const pwa = read('assets/pwa.js');
const home = read('index.html');
const sitemap = read('sitemap.xml');

const response = await fetch(`${sheetUrl}&_batchmath_qa=${Date.now()}`, {
  cache: 'no-store',
  headers: { Origin: 'https://batchmath.net', Accept: 'text/csv' },
  redirect: 'follow'
});
assert.equal(response.ok, true, `Live sheet returned ${response.status}`);
assert.match(response.headers.get('content-type') || '', /text\/csv/i);
assert.ok(['*', 'https://batchmath.net'].includes(response.headers.get('access-control-allow-origin')), 'Live sheet does not advertise browser CORS access for BatchMath');
const csv = await response.text();
const rows = archive.parseCsv(csv);
const entries = archive.normalizeRows(rows);

assert.deepEqual(entries.slice(0, 4).map(entry => entry.number), [4, 3, 2, 1], 'Problems must render newest first');
for (const number of [1, 2, 3, 4]) assert.ok(entries.some(entry => entry.number === number), `Missing Problem #${number}`);
for (const number of [1, 2, 3]) assert.ok(entries.find(entry => entry.number === number).solution, `Problem #${number} must have a primary solution`);

const problem3 = entries.find(entry => entry.number === 3);
const problem4 = entries.find(entry => entry.number === 4);
assert.equal(problem3.primaryMethod, 'Reciprocal Rule');
assert.deepEqual(problem3.alternatives.map(alternative => alternative.method), ['Negative Exponent and Chain Rule', 'Quotient Rule']);
assert.ok(problem3.alternatives.every(alternative => alternative.solution));
assert.ok(problem3.alternatives.every(alternative => alternative.explanation.startsWith(`Alternative #${alternative.index}`)), 'Clearly labelled optional alternative explanations should follow their methods');
assert.match(problem3.explanation, /\\\(/, 'Inline LaTeX should remain intact');
assert.equal(problem4.solution, '', 'Problem #004 must remain unpublished in Worked Solutions');
assert.equal(problem4.location, 'Mt. Soledad, San Diego, CA');
assert.equal(problem4.date, '10/12/2026');
assert.equal(problem4.solutionVideo, '', 'Blank Solution Video URL cells must stay blank');
assert.equal(problem4.alternatives.every(alternative => !alternative.explanation), true, 'Orphan alternative notes must not attach to Problem #004');

const parserProbe = archive.parseCsv('number,problem_latex,explanation\r\n5,"x^2, x>0","first line\nsecond, line"\r\n');
assert.equal(parserProbe[1][1], 'x^2, x>0');
assert.equal(parserProbe[1][2], 'first line\nsecond, line');
const variantHeaders = [[' Problem Number ', ' DATE PUBLISHED ', 'Problem (LaTeX)', 'Worked Solution (LaTeX)', 'Video Link'], ['9', '', 'x^2', '', '']];
assert.equal(archive.normalizeRows(variantHeaders)[0].number, 9, 'Harmless header capitalization and spacing must be accepted');
const optionalVideoRows = [
  ['Problem Number', 'Problem (LaTeX)', 'Worked Solution (LaTeX)', 'Video Link', 'Solution Video URL', 'Topic'],
  ['10', 'x^2', '2x', 'https://www.youtube.com/shorts/original', 'https://youtu.be/solution', 'Exact Topic Text'],
  ['11', '', 'unused solution', 'https://youtu.be/unused', 'https://youtu.be/unused-solution', 'Must Not Render'],
  ['', 'x^3', 'unused solution', '', '', 'Must Not Render'],
  ['12', 'x^4', '', 'javascript:alert(1)', 'not a url', 'Blank Videos']
];
const optionalVideoEntries = archive.normalizeRows(optionalVideoRows);
assert.deepEqual(optionalVideoEntries.map(entry => entry.number), [12, 10], 'Rows without both a valid number and problem must be ignored');
assert.equal(optionalVideoEntries.find(entry => entry.number === 10).topic, 'Exact Topic Text');
assert.match(optionalVideoEntries.find(entry => entry.number === 10).video, /^https:\/\/www\.youtube\.com\//);
assert.match(optionalVideoEntries.find(entry => entry.number === 10).solutionVideo, /^https:\/\/youtu\.be\//);
assert.equal(optionalVideoEntries.find(entry => entry.number === 12).video, '');
assert.equal(optionalVideoEntries.find(entry => entry.number === 12).solutionVideo, '');
const growthRows = [['number', 'published_date', 'problem_latex']];
for (let number = 1; number <= 300; number += 1) growthRows.push([String(number), '', `x^{${number}}`]);
const growthEntries = archive.normalizeRows(growthRows);
assert.equal(growthEntries.length, 300);
assert.deepEqual(growthEntries.slice(0, 3).map(entry => entry.number), [300, 299, 298], 'Large archives with missing dates must fall back to newest problem number');
assert.equal(archive.safeUrl('javascript:alert(1)'), '');
assert.match(archive.safeUrl('https://www.youtube.com/watch?v=test'), /^https:\/\//);

assert.match(html, /id="problems-tab"[\s\S]*All Problems/);
assert.match(html, /id="solutions-tab"[\s\S]*Worked Solutions/);
assert.match(html, /mathjax@4\.1\.3\/tex-chtml\.js/i);
assert.match(html, /aria-live="polite"/);
assert.match(html, /id="retry-archive"/);
assert.doesNotMatch(html, /archive-loading|archive-skeleton/);
assert.doesNotMatch(css, /archive-loading|archive-skeleton|archive-shimmer/);
assert.doesNotMatch(js, /archive-loading|copyLink|Copy Link/);
assert.match(js, /element\('span', 'problem-number', entry\.numberLabel\)/);
assert.match(js, /Watch Original Short/);
assert.match(js, /Watch Video Solution/);
assert.match(js, /solutionVideo:\s*\[/);
assert.match(js, /entry\.solution && entry\.solutionVideo/);
assert.match(js, /cache:\s*'no-store'/);
assert.match(js, /_batchmath=\$\{Date\.now\(\)\}/);
assert.match(js, /AUTO_REFRESH_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/);
assert.match(js, /solutionOnly && !entry\.solution/);
assert.match(js, /right\.dateValue - left\.dateValue/);
assert.doesNotMatch(js, /\.innerHTML\s*=/, 'Spreadsheet content must never be inserted as HTML');
assert.match(css, /overflow-x:auto/);
assert.match(css, /@media\(max-width:760px\)/);
assert.match(css, /@media\(max-width:420px\)/);
assert.match(css, /min-width:max-content/);
assert.match(sw, /isArchiveDataRequest/);
assert.match(sw, /Never put its Google Sheet CSV in/);
assert.match(pwa, /ensureArchiveNavigation/);
assert.match(home, /<strong>Calculus Problem of the Day Archive<\/strong>/);
assert.match(home, /archive-spotlight-derivative/);
assert.match(home, /archive-spotlight-integral[^>]*>∫<\/span>/);
assert.match(home, /\.archive-spotlight\{[\s\S]*?border:2px solid var\(--red\)/);
assert.doesNotMatch(home, /archive-spotlight-arrow/);
assert.match(sitemap, /https:\/\/batchmath\.net\/archive\//);
for (const file of ['archive/index.html', 'archive/archive.css', 'archive/archive.js']) assert.equal(fs.existsSync(path.join(root, file)), true, `Archive route file missing: ${file}`);
assert.equal(fs.existsSync(path.join(root, '.github/workflows/batchmath-qa.yml')), true, 'GitHub Actions workflow must be preserved');

console.log(`Problem of the Day Archive QA passed: ${entries.length} live problems, ${entries.filter(entry => entry.solution).length} published solutions, newest ${entries[0].numberLabel}.`);
