import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const baselineCommit = '3345fdf84c9a0280c5260e0dc83fee4e4c2e3785';
const currentSource = read('assets/unit3-optimization-related-rates.js');
const baselineSource = execFileSync('git', ['show', `${baselineCommit}:assets/unit3-optimization-related-rates.js`], { cwd: root, encoding: 'utf8', maxBuffer: 2000000 });
const pageRenderer = /function renderPage\(data\)\{[\s\S]*?\n\}\n(?=function renderCurve)/;
assert.match(currentSource, pageRenderer);
assert.equal(currentSource.replace('(v12.8.I).', '(v12.8.H).').replace(pageRenderer, ''), baselineSource.replace(pageRenderer, ''), 'only the page renderer and release header may change in this shared source');

function contextFor(source) {
  const context = { console, Math: Object.create(Math), Set, Array, Object, Number, String, RegExp };
  context.window = context;
  let seed = 0x1289_2026;
  context.BatchMathRNG = { random() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 0x100000000; } };
  context.BatchMathAPTopicGenerators = { get: () => null, slugs: () => [], unit3Slugs: () => [] };
  context.BatchMathUnit3ApplicationsGenerators = { get: () => null, slugs: () => [] };
  vm.createContext(context);
  vm.runInContext(read('assets/derivative-expression-checker.js'), context);
  // Expose diagram metadata in this isolated test VM only, not in site code.
  source = source.replace('function diagramFor(family,spec){', 'function diagramFor(family,spec){window.__diagramData=spec&&spec.diagram;');
  vm.runInContext(source, context);
  return context;
}
const current = contextFor(currentSource), baseline = contextFor(baselineSource);
const attrs = text => Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const near = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-9;
const tidy = value => Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
const contentOnly = problem => { const copy = { ...problem }; delete copy.diagramHint; return JSON.stringify(copy); };

function verify(problem, data) {
  const html = problem.diagramHint;
  const body = html.match(/<\/defs>([\s\S]*?)<\/svg>/)[1];
  const rectangles = [...body.matchAll(/<rect\b[^>]*>/g)].map(match => attrs(match[0]));
  const lines = [...body.matchAll(/<line\b[^>]*>/g)].map(match => attrs(match[0]));
  const labels = [...body.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map(match => ({ ...attrs(match[0]), text: match[1] }));
  assert.equal(rectangles.length, 2, 'exactly one outer and one printed-region rectangle');
  assert.equal(lines.length, 4, 'exactly four short margin measurements');
  assert.equal(labels.length, 6, 'only w, h and four individual margin values');
  assert.doesNotMatch(body, /<path|<g\b|marker-(?:start|end)=|Left \+ right|Top \+ bottom|undefined|NaN/);
  const [page, printed] = rectangles;
  const left = Number(page.x), right = left + Number(page.width), top = Number(page.y), bottom = top + Number(page.height);
  const printLeft = Number(printed.x), printRight = printLeft + Number(printed.width), printTop = Number(printed.y), printBottom = printTop + Number(printed.height);
  assert.ok(left < printLeft && printRight < right && top < printTop && printBottom < bottom);
  const expected = {
    top: [(left + right) / 2, top, (left + right) / 2, printTop, data.verticalMargins / 2],
    bottom: [(left + right) / 2, printBottom, (left + right) / 2, bottom, data.verticalMargins / 2],
    left: [left, (top + bottom) / 2, printLeft, (top + bottom) / 2, data.horizontalMargins / 2],
    right: [printRight, (top + bottom) / 2, right, (top + bottom) / 2, data.horizontalMargins / 2]
  };
  for (const [name, coordinates] of Object.entries(expected)) {
    const line = lines.find(item => item['data-page-margin'] === name);
    assert.ok(line, `missing ${name} margin`);
    assert.equal(line['stroke-dasharray'], '1 5');
    assert.equal(line['stroke-linecap'], 'round');
    for (const [index, attribute] of ['x1', 'y1', 'x2', 'y2'].entries()) assert.ok(near(line[attribute], coordinates[index]), `${name} crosses only its margin gap`);
    const label = labels.find(item => item['data-label-style'] === 'margin' && item['data-segment'] === coordinates.slice(0, 4).join(','));
    assert.ok(label, `missing adjacent ${name} label`);
    assert.equal(label.text, `${tidy(coordinates[4])} ${data.unit}`);
    assert.doesNotMatch(label.text, /\.\d*0\s/);
    const midpoint = [(coordinates[0] + coordinates[2]) / 2, (coordinates[1] + coordinates[3]) / 2];
    assert.ok(Math.hypot(Number(label.x) - midpoint[0], Number(label.y) - midpoint[1]) <= 18.1, 'margin number must stay immediately beside its measurement');
  }
  assert.ok(labels.some(item => item.text === 'w' && item['data-segment'] === [left, bottom, right, bottom].join(',')), 'w labels the entire outer bottom edge');
  assert.ok(labels.some(item => item.text === 'h' && item['data-segment'] === [right, top, right, bottom].join(',')), 'h labels the entire outer right edge');
  assert.match(html, /Total page area:/, 'retain the existing area badge');
  assert.ok(problem.questionHtml.includes(`margins use \\(${data.horizontalMargins}\\) inches of width`));
  assert.ok(problem.questionHtml.includes(`margins use \\(${data.verticalMargins}\\) inches of height`));
}

const samples = [], counts = {}, unique = new Set();
let comparisons = 0, unchangedDiagrams = 0;
for (const mode of ['noncalculator', 'calculator']) {
  const generate = current.BatchMathAPTopicGenerators.get('optimization'), original = baseline.BatchMathAPTopicGenerators.get('optimization');
  counts[mode] = 0;
  for (let index = 0; index < 6000; index += 1) {
    const problem = generate({ mode }), data = current.__diagramData, previous = original({ mode });
    assert.equal(contentOnly(problem), contentOnly(previous), 'problem content, mathematics, answers, explanations and randomization must be unchanged');
    comparisons += 1;
    if (data?.kind !== 'page') {
      assert.equal(problem.diagramHint, previous.diagramHint, 'every other diagram must be byte-identical');
      unchangedDiagrams += 1;
      continue;
    }
    verify(problem, data);
    counts[mode] += 1;
    const key = `${mode}/${problem.diagramHint}`;
    if (!unique.has(key)) {
      unique.add(key);
      samples.push({ key: `${mode}/${samples.length}`, family: 'page_printed_area', mode, kind: 'page', html: problem.diagramHint, question: problem.questionHtml });
    }
  }
  assert.ok(counts[mode] > 100, `insufficient randomized ${mode} page examples`);
}
assert.equal(samples.filter(sample => sample.mode === 'calculator').length, 27, 'cover every generated combination of calculator margins and page area');
assert.equal(samples.filter(sample => sample.mode === 'noncalculator').length, 1);
for (const suffix of ['optimization/practice', 'optimization/calculator-practice', 'comprehensive-review/assignment-practice', 'comprehensive-review/calculator-practice']) {
  const html = read(`ap-calculus/unit-3-applications-derivative/topics/${suffix}/index.html`);
  assert.ok(html.indexOf('/assets/unit3-optimization-related-rates.js') > html.indexOf('/assets/unit3-applications-generators.js'), 'focused practice and review use the same shared renderer');
  if (suffix.startsWith('comprehensive-review')) assert.match(html, /"slugs":\[[^\]]*"optimization"/);
}
const out = path.join(root, 'qa-results', 'page-margins-v128i');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'samples.json'), JSON.stringify(samples, null, 2));
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({ comparisons, unchangedDiagrams, counts, distinctPageDiagrams: samples.length }, null, 2));
console.log(`v12.8.I page-margin QA passed: ${comparisons} unchanged-content comparisons, ${unchangedDiagrams} unchanged other diagrams, ${counts.noncalculator + counts.calculator} page checks, ${samples.length} distinct page examples.`);
