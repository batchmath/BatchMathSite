import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const baselineCommit = 'e7bbd9bed215e24075b0d05aa91f5a36937c7f28';
const out = path.join(root, 'qa-results', 'diagram-refinements-v128h');
const allowed = new Set(['sheet-net', 'page', 'closest-curve', 'ladder-fence', 'triangular-trough', 'trapezoidal-trough']);
const attrs = text => Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const elements = (html, tag, className) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(match => attrs(match[0])).filter(item => String(item.class || '').split(' ').includes(className));
const texts = html => [...html.matchAll(/<text\b[^>]*>[^<]*<\/text>/g)].map(match => ({ ...attrs(match[0]), text: match[0].replace(/<[^>]*>/g, '') }));
const near = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-7;
const sameSegment = (line, a, b, c, d) => near(line.x1, a) && near(line.y1, b) && near(line.x2, c) && near(line.y2, d);
function contextFor(code) {
  const context = { console, Math: Object.create(Math), Set, Array, Object, Number, String, RegExp };
  context.window = context;
  let seed = 0x1288_2026;
  context.BatchMathRNG = { random() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 0x100000000; } };
  context.BatchMathAPTopicGenerators = { get: () => null, slugs: () => [], unit3Slugs: () => [] };
  context.BatchMathUnit3ApplicationsGenerators = { get: () => null, slugs: () => [] };
  vm.createContext(context);
  vm.runInContext(read('assets/derivative-expression-checker.js'), context);
  // Instrument this isolated test VM only; no debug API is added to the site.
  code = code.replace('function diagramFor(family,spec){', 'function diagramFor(family,spec){window.__diagramData=spec&&spec.diagram;');
  code = code.replace(/\}\)\(\);\s*$/, 'window.__render={sheet:renderSheetNet,page:renderPage,closest:renderCurve,ladder:renderLadderFence,trough:renderTrough,projection:curveProjection};})();');
  vm.runInContext(code, context);
  assert.ok(context.__render);
  return context;
}
const current = contextFor(read('assets/unit3-optimization-related-rates.js'));
const baseline = contextFor(execFileSync('git', ['show', `${baselineCommit}:assets/unit3-optimization-related-rates.js`], { cwd: root, encoding: 'utf8', maxBuffer: 2000000 }));
const contentOnly = problem => { const copy = { ...problem }; delete copy.diagramHint; return JSON.stringify(copy); };

function verify(html, data) {
  const labels = texts(html), lines = elements(html, 'line', 'diagram-dimension');
  assert.doesNotMatch(html, /undefined|NaN|null/);
  assert.doesNotMatch(html, /marker-(?:start|end)="url\(#diagram-arrow-(?:start|end)\)"/);
  if (data.kind === 'sheet-net') {
    const sheet = elements(html, 'rect', 'diagram-object-fill')[0];
    const left = Number(sheet.x), top = Number(sheet.y), right = left + Number(sheet.width), bottom = top + Number(sheet.height);
    const spans = [...html.matchAll(/data-original-extent="([^"]+)"/g)].map(match => match[1].split(',').map(Number));
    assert.ok(spans.some(span => near(span[0], left) && near(span[1], bottom) && near(span[2], right) && near(span[3], bottom)), 'original length must span the entire sheet');
    assert.ok(spans.some(span => near(span[0], left) && near(span[1], top) && near(span[2], left) && near(span[3], bottom)), 'original width must span past both corner cuts');
    assert.equal(labels.filter(label => label.text === 'x').length, 2);
    assert.ok(labels.some(label => label.text === `${data.length} ${data.unit}`));
    assert.ok(labels.some(label => label.text === `${data.width} ${data.unit}`));
  }
  if (data.kind === 'page') {
    const page = elements(html, 'rect', 'diagram-object-fill')[0], printed = elements(html, 'rect', 'diagram-accent-fill')[0];
    const left = Number(page.x), top = Number(page.y), right = left + Number(page.width), bottom = top + Number(page.height);
    const printLeft = Number(printed.x), printTop = Number(printed.y), printRight = printLeft + Number(printed.width), printBottom = printTop + Number(printed.height);
    assert.ok(lines.some(line => sameSegment(line, left, 52, printLeft, 52)));
    assert.ok(lines.some(line => sameSegment(line, printRight, 52, right, 52)));
    assert.ok(lines.some(line => sameSegment(line, 212, top, 212, printTop)));
    assert.ok(lines.some(line => sameSegment(line, 212, printBottom, 212, bottom)));
    assert.match(html, /data-margin-pair="vertical"/); assert.match(html, /data-margin-pair="horizontal"/);
    assert.ok(labels.some(label => label.text === `Left + right: ${data.horizontalMargins} ${data.unit}`));
    assert.ok(labels.some(label => label.text === `${data.verticalMargins} ${data.unit}`));
    assert.ok(labels.some(label => label.text === 'w') && labels.some(label => label.text === 'h'));
  }
  if (data.kind === 'closest-curve') {
    const fixed = elements(html, 'circle', 'diagram-point-fixed')[0], point = elements(html, 'circle', 'diagram-point-variable')[0];
    const projection = current.__render.projection(data);
    const fixedX = Number(data.fixedPoint[0]), fixedY = Number(data.fixedPoint[1]);
    assert.ok(near(fixed.cx, projection.mapX(fixedX)) && near(fixed.cy, projection.mapY(fixedY)));
    if (Math.abs(fixedY) > 1e-8) assert.ok(Math.abs(Number(fixed.cy) - Number(fixed['data-axis-y'])) >= 25, 'a nonzero fixed ordinate must remain visibly off the x-axis');
    else assert.ok(near(fixed.cy, fixed['data-axis-y']), 'a zero ordinate must stay on the x-axis');
    const [x, y] = point['data-world-point'].split(',').map(Number);
    assert.ok(Math.abs(data.fn(x) - y) < 1e-8);
    assert.ok(near(point.cx, projection.mapX(x)) && near(point.cy, projection.mapY(y)), 'both points and the curve must use one affine projection');
  }
  if (data.kind === 'ladder-fence') {
    const ladder = elements(html, 'line', 'diagram-accent')[0];
    const fence = elements(html, 'line', 'diagram-fixed-object').find(line => near(line.x1, 360));
    const cross = (Number(fence.x1) - Number(ladder.x1)) * (Number(ladder.y2) - Number(ladder.y1))
      - (Number(fence.y2) - Number(ladder.y1)) * (Number(ladder.x2) - Number(ladder.x1));
    assert.ok(Math.abs(cross) < 1e-8, 'the ladder must touch the exact top of the fence');
    assert.ok(labels.some(label => label.text === `${data.fenceHeight} ${data.unit}`));
    assert.ok(labels.some(label => label.text === `${data.gap} ${data.unit}`));
  }
  if (/trough$/.test(data.kind)) {
    assert.ok(Number.isFinite(data.fullHeight));
    assert.ok(lines.some(line => sameSegment(line, 76, 62, 76, 278)), 'full-height bracket must use the full trough levels');
    assert.ok(labels.some(label => label.text === `${data.fullHeight} ${data.unit}` && label['data-segment'] === '76,62,76,278'));
    assert.ok(labels.some(label => label.text === 'h') && labels.some(label => label.text === 'w'));
  }
}

const samples = [], counts = {}, variants = new Map();
let comparisons = 0, unaffected = 0;
for (const slug of ['optimization', 'related-rates']) for (const mode of ['noncalculator', 'calculator']) {
  const generate = current.BatchMathAPTopicGenerators.get(slug), original = baseline.BatchMathAPTopicGenerators.get(slug);
  for (let index = 0; index < 6000; index += 1) {
    const problem = generate({ mode }), data = current.__diagramData, previous = original({ mode });
    assert.equal(contentOnly(problem), contentOnly(previous), 'non-diagram content, answer, explanation or distribution changed');
    comparisons += 1;
    const kind = problem.diagramHint?.match(/data-diagram-kind="([^"]+)"/)?.[1];
    if (!allowed.has(kind)) { assert.equal(problem.diagramHint, previous.diagramHint, 'an approved unrelated diagram changed'); unaffected += 1; continue; }
    verify(problem.diagramHint, data);
    const key = `${slug}/${mode}/${problem.familyId}`;
    counts[key] = (counts[key] || 0) + 1;
    if (!variants.has(key)) variants.set(key, new Set());
    if (variants.get(key).size < 8 && !variants.get(key).has(problem.diagramHint)) {
      variants.get(key).add(problem.diagramHint);
      samples.push({ key, family: problem.familyId, slug, mode, kind, question: problem.questionHtml, html: problem.diagramHint });
    }
  }
}
const fixtures = [
  ['reference-sheet-30', 'sheet', { kind: 'sheet-net', length: 30, width: 30, unit: 'in' }],
  ['reference-sheet-rectangle', 'sheet', { kind: 'sheet-net', length: 32.7, width: 13.7, unit: 'in' }],
  ['reference-page', 'page', { kind: 'page', horizontalMargins: 1.6, verticalMargins: 1.1, unit: 'in', fixedNotes: ['Total page area: 91.7 square inches'] }],
  ['reference-point-4-3-0-6', 'closest', { kind: 'closest-curve', domain: [.05, 8], fn: x => x ** 1.5 - 4, fixedPoint: [4.3, .6], includePoints: [[4.3, .6]], previewX: .05 + .58 * 7.95, fixedPointLabel: '(4.3, 0.6)', variablePointLabel: 'P = (x, f(x))', curveLabel: 'y = x³ᐟ² − 4' }],
  ['reference-ladder', 'ladder', { kind: 'ladder-fence', fenceHeight: 12.3, gap: 3.4, unit: 'ft' }],
  ['reference-triangular-trough', 'trough', { kind: 'triangular-trough', topWidth: 3, fullHeight: 1, unit: 'ft' }],
  ['reference-trapezoidal-trough', 'trough', { kind: 'trapezoidal-trough', topWidth: 5, bottomWidth: 3, fullHeight: 2, unit: 'ft' }]
];
for (const [family, renderer, data] of fixtures) {
  const html = current.__render[renderer](data); verify(html, data);
  samples.push({ family, key: family, slug: 'reference', mode: 'reference', kind: data.kind, html });
}
for (const kind of allowed) for (const mode of ['noncalculator', 'calculator']) assert.ok(samples.some(sample => sample.kind === kind && sample.mode === mode), `missing ${kind}/${mode}`);
for (const count of Object.values(counts)) assert.ok(count >= 8);
for (const mode of ['assignment-practice', 'calculator-practice']) {
  const html = read(`ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/${mode}/index.html`);
  assert.match(html, /unit3-optimization-related-rates\.js/);
  assert.match(html, /"optimization","related-rates"/);
}
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'samples.json'), JSON.stringify(samples));
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({ comparisons, unaffected, counts, samples: samples.length }, null, 2));
console.log(`v12.8.H targeted diagram QA passed: ${comparisons} unchanged-content checks, ${unaffected} unchanged approved diagrams/non-geometric cases, ${samples.length} distinct affected examples.`);
