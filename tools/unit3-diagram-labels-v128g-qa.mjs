import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = read('assets/unit3-optimization-related-rates.js');
const out = path.join(root, 'qa-results', 'diagram-labels-v128g');
fs.mkdirSync(out, { recursive: true });
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const labels = html => [...html.matchAll(/<text\b[^>]*>[\s\S]*?<\/text>/g)].map(match => ({ ...attrs(match[0]), text: match[0].replace(/<[^>]*>/g, '') }));
const lines = html => [...html.matchAll(/<line\b[^>]*\/>/g)].map(match => attrs(match[0]));
const near = (a, b, tolerance = .025) => Math.abs(Number(a) - Number(b)) < tolerance;
const segmentIs = (label, points) => {
  const values = String(label?.['data-segment'] || '').split(',').map(Number);
  return values.length === 4 && values.every((value, index) => near(value, points[index]));
};
const findLabel = (all, text, segment) => all.find(label => label.text === text && (!segment || segmentIs(label, segment)));

function makeContext(code) {
  const context = { console, Math: Object.create(Math), Set, Array, Object, Number, String, RegExp };
  context.window = context;
  let seed = 0x128f2026;
  context.BatchMathRNG = { random() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 0x100000000; } };
  context.BatchMathAPTopicGenerators = { get: () => null, slugs: () => [], unit3Slugs: () => [] };
  context.BatchMathUnit3ApplicationsGenerators = { get: () => null, slugs: () => [] };
  vm.createContext(context);
  vm.runInContext(read('assets/derivative-expression-checker.js'), context);
  vm.runInContext(code, context);
  return context;
}
const context = makeContext(source);
const baselineRef = process.argv.find(value => value.startsWith('--baseline='))?.slice(11);
const baseline = baselineRef ? makeContext(execFileSync('git', ['show', `${baselineRef}:assets/unit3-optimization-related-rates.js`], { cwd: root, encoding: 'utf8', maxBuffer: 2000000 })) : null;
const unchangedContent = problem => {
  const copy = { ...problem };
  delete copy.diagramHint;
  return JSON.stringify(copy);
};

function verify(problem) {
  const html = problem.diagramHint;
  if (!html) return;
  assert.doesNotMatch(html, /NaN|undefined|null/);
  const all = labels(html), allLines = lines(html);
  for (const line of allLines) {
    if (line['marker-start'] || line['marker-end']) {
      assert.equal(line.class, 'diagram-axis', 'only genuine axes/directions may have arrowheads');
      assert.equal(line['marker-end'], 'url(#diagram-motion-arrow)');
    }
  }
  assert.doesNotMatch(html, /marker-(?:start|end)="url\(#diagram-arrow-(?:start|end)\)"/);
  for (const label of all.filter(item => item['data-segment'])) {
    const [x1, y1, x2, y2] = label['data-segment'].split(',').map(Number);
    assert.ok([x1, y1, x2, y2, Number(label.x), Number(label.y)].every(Number.isFinite));
    const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
    assert.ok(length > 0, 'a length label needs a nonzero geometric segment');
    const normalDistance = Math.abs((Number(label.x) - x1) * dy - (Number(label.y) - y1) * dx) / length;
    assert.ok(normalDistance >= 10 && normalDistance <= 22, 'labels must be close to, but not on top of, their segment');
  }
  if (problem.familyId === 'right_triangle_area') {
    assert.match(html, /d="M180 62V282H440Z"/);
    assert.match(html, /d="M180 265H197V282"/);
    assert.ok(findLabel(all, 'b', [180, 282, 440, 282]));
    assert.ok(findLabel(all, 'h', [180, 62, 180, 282]));
    assert.doesNotMatch(html, /diagram-hidden|data-measurement/);
  }
  if (problem.familyId === 'isosceles_triangle_area') {
    assert.match(html, /d="M175 292H425L300 42Z"/);
    assert.ok(allLines.find(line => line.class === 'diagram-hidden' && near(line.x1, 300) && near(line.x2, 300) && near(line.y1, 42) && near(line.y2, 292)));
    assert.ok(findLabel(all, 'b', [175, 292, 425, 292]));
    assert.ok(findLabel(all, 'h', [300, 42, 300, 292]));
  }
  if (/conical_tank|inverted_conical_tank/.test(problem.familyId)) {
    const outside = allLines.find(line => line['data-measurement'] === 'external');
    assert.ok(outside && near(outside.x1, 468) && near(outside.x2, 468) && near(outside.y1, 55) && near(outside.y2, 307));
    const fullHeight = all.find(label => label['data-label-style'] === 'guide');
    assert.ok(fullHeight && Number(fullHeight.x) > 468 && /ft$/.test(fullHeight.text));
    assert.ok(findLabel(all, 'h', [300, 188, 300, 307]));
    assert.ok(findLabel(all, 'r', [300, 188, 300 + 142 * 119 / 252, 188]));
  }
  if (/^ladder_|^multi_part_ladder$/.test(problem.familyId)) {
    assert.match(html, /d="M461 274V257H478"/);
    assert.ok(findLabel(all, 'x', [135, 274, 478, 274]));
    assert.ok(findLabel(all, 'y', [478, 68, 478, 274]));
    assert.ok(all.find(label => /ft$/.test(label.text) && segmentIs(label, [135, 274, 478, 68])));
    assert.ok(all.every(label => label['data-label-style'] !== 'guide'));
  }
  if (/shadow/.test(problem.familyId)) {
    const ray = allLines.find(line => line.class === 'diagram-accent');
    const vertical = allLines.filter(line => line.class === 'diagram-fixed-object' && near(line.x1, line.x2));
    assert.equal(vertical.length, 2);
    const person = vertical.find(line => !near(line.x1, 98));
    assert.ok(near((Number(person.x1) - Number(ray.x1)) * (Number(ray.y2) - Number(ray.y1)),
      (Number(person.y2) - Number(ray.y1)) * (Number(ray.x2) - Number(ray.x1)), 1e-6));
    assert.ok(findLabel(all, 'x', [98, 266, Number(person.x1), 266]));
    assert.ok(findLabel(all, 's', [Number(person.x1), 266, 524, 266]));
    assert.ok(all.every(label => label['data-label-style'] !== 'guide'));
  }
  const kind = html.match(/data-diagram-kind="([^"]+)"/)[1];
  if (kind === 'box') {
    assert.ok(all.find(label => segmentIs(label, [476, 126, 476, 257]) && label.text === 'h'));
    assert.ok(all.every(label => label['data-label-style'] === 'edge'));
  }
  if (kind === 'cylinder') {
    assert.ok(findLabel(all, 'r', [300, 72, 418, 72]));
    assert.ok(findLabel(all, 'h', [182, 72, 182, 258]));
  }
  if (kind === 'capsule') {
    assert.ok(findLabel(all, 'L', [170, 264, 430, 264]));
    assert.ok(findLabel(all, 'r', [430, 170, 524, 170]));
  }
  if (kind === 'pyramid') {
    assert.ok(findLabel(all, 's', [120, 246, 360, 287]));
    assert.ok(findLabel(all, 'h', [308, 42, 308, 234]));
  }
  if (kind === 'cone') {
    assert.ok(findLabel(all, 'r', [300, 79, 428, 79]));
    assert.ok(findLabel(all, 'h', [300, 79, 300, 297]));
    assert.ok(all.find(label => segmentIs(label, [428, 79, 300, 297]) && /√|\d/.test(label.text)));
  }
  if (kind === 'window') {
    assert.equal(all.filter(label => label.text === 'w').length, 1, 'the window must not have a floating/duplicate roof width');
  }
}

const samples = [], counts = {}, kinds = new Set(), sampled = new Map();
let total = 0, comparisons = 0;
for (const slug of ['optimization', 'related-rates']) {
  for (const mode of ['noncalculator', 'calculator']) {
    const generator = context.BatchMathAPTopicGenerators.get(slug);
    const original = baseline?.BatchMathAPTopicGenerators.get(slug);
    for (let i = 0; i < 6000; i += 1) {
      const problem = generator({ mode });
      if (original) {
        assert.equal(unchangedContent(problem), unchangedContent(original({ mode })), 'non-diagram content, answers, explanations or sampling changed');
        comparisons += 1;
      }
      if (!problem.diagramHint) continue;
      verify(problem);
      total += 1;
      const key = `${slug}/${mode}/${problem.familyId}`;
      counts[key] = (counts[key] || 0) + 1;
      const kind = problem.diagramHint.match(/data-diagram-kind="([^"]+)"/)[1];
      kinds.add(kind);
      if (!sampled.has(key)) sampled.set(key, new Set());
      const variants = sampled.get(key);
      if (variants.size < 8 && !variants.has(problem.diagramHint)) {
        variants.add(problem.diagramHint);
        samples.push({ key, family: problem.familyId, mode, slug, kind, question: problem.questionHtml, html: problem.diagramHint });
      }
    }
  }
}
for (const [key, count] of Object.entries(counts)) assert.ok(count >= 3, `insufficient randomized examples: ${key}`);
assert.ok(kinds.size >= 29, 'all shared renderer kinds must be encountered');
assert.ok(samples.some(sample => sample.family === 'right_triangle_area'));
assert.ok(samples.some(sample => sample.family === 'isosceles_triangle_area'));
for (const mode of ['assignment-practice', 'calculator-practice']) {
  const page = read(`ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/${mode}/index.html`);
  assert.match(page, /unit3-optimization-related-rates\.js/);
  assert.match(page, /"optimization","related-rates"/);
}
const summary = { total, comparisons, rendererKinds: [...kinds].sort(), familyModes: Object.keys(counts).length, counts };
fs.writeFileSync(path.join(out, 'samples.json'), JSON.stringify(samples));
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`Diagram-label QA passed: ${total} diagrams, ${kinds.size} kinds, ${Object.keys(counts).length} family/mode combinations, ${comparisons} unchanged-content comparisons.`);
