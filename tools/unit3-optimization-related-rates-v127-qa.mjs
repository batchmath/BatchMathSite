import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const context = {
  console,
  Math: Object.create(Math),
  Set,
  Array,
  Object,
  Number,
  String,
  RegExp
};
context.window = context;
let seed = 0x12_07_2026;
context.BatchMathRNG = {
  random() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0x1_0000_0000;
  }
};
context.BatchMathAPTopicGenerators = { get: () => null, slugs: () => [], unit3Slugs: () => [] };
context.BatchMathUnit3ApplicationsGenerators = { get: () => null, slugs: () => [] };
vm.createContext(context);
vm.runInContext(read('assets/derivative-expression-checker.js'), context, { filename: 'derivative-expression-checker.js' });
vm.runInContext(read('assets/unit3-optimization-related-rates.js'), context, { filename: 'unit3-optimization-related-rates.js' });

const expectedCounts = { optimization: { noncalculator: 25, calculator: 26 }, 'related-rates': { noncalculator: 26, calculator: 26 } };
for (const slug of ['optimization', 'related-rates']) {
  for (const mode of ['noncalculator', 'calculator']) {
    const generator = context.BatchMathAPTopicGenerators.get(slug);
    assert.equal(typeof generator, 'function');
    const families = new Set();
    const sources = { assignment: 0, test: 0, extension: 0 };
    let adjacentRepeats = 0;
    let previousFamily = '';
    for (let index = 0; index < 12000; index += 1) {
      const problem = generator({ mode });
      families.add(problem.familyId);
      sources[problem.sourceKind] += 1;
      if (problem.familyId === previousFamily) adjacentRepeats += 1;
      previousFamily = problem.familyId;
      const combined = `${problem.questionHtml}\n${problem.explanation}`;
      assert.doesNotMatch(combined, /NaN|undefined|null/);
      assert.ok((problem.explanation.match(/<strong>Step/g) || []).length >= 7, `${problem.familyId} needs detailed vertical work`);
      assert.match(problem.explanation, /Differentiate|derivative|differentiat/i);
      if (mode === 'calculator') {
        assert.equal(problem.answerType, 'numeric');
        assert.equal(problem.requiredDecimals, 3);
        assert.ok(Number.isFinite(problem.numericAnswer));
        assert.match(problem.numericPlaceholder, /exactly three decimal places/i);
      } else {
        assert.equal(problem.answerType, 'exact-expression');
        const tree = context.BatchMathDerivativeExpressions.parse(problem.expressionAnswer);
        assert.ok(Number.isFinite(context.BatchMathDerivativeExpressions.evaluate(tree, {})), `${problem.familyId} has an invalid exact answer`);
      }
    }
    assert.ok(families.size >= expectedCounts[slug][mode], `${slug}/${mode} did not expose every expected family`);
    assert.ok(adjacentRepeats / 12000 < 0.015, `${slug}/${mode} repeats families too often in short runs`);
    assert.ok(Math.abs(sources.test / 12000 - 0.15) < 0.02, `${slug}/${mode} test share drifted`);
    assert.ok(Math.abs(sources.extension / 12000 - 0.25) < 0.025, `${slug}/${mode} extension share drifted`);
  }
}

const pages = [
  'ap-calculus/unit-3-applications-derivative/topics/optimization/practice/index.html',
  'ap-calculus/unit-3-applications-derivative/topics/optimization/calculator-practice/index.html',
  'ap-calculus/unit-3-applications-derivative/topics/related-rates/practice/index.html',
  'ap-calculus/unit-3-applications-derivative/topics/related-rates/calculator-practice/index.html',
  'ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/assignment-practice/index.html',
  'ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/calculator-practice/index.html'
];
for (const page of pages) {
  const html = read(page);
  const baseIndex = html.indexOf('/assets/unit3-applications-generators.js');
  const overlayIndex = html.indexOf('/assets/unit3-optimization-related-rates.js');
  const keypadIndex = html.indexOf('/assets/calculus-keypad.js');
  assert.ok(baseIndex >= 0 && overlayIndex > baseIndex && keypadIndex > overlayIndex, `${page} has incorrect shared-generator load order`);
  assert.match(html, /"generatorVersion":"12\.7"/, `${page} has stale generator analytics metadata`);
}

assert.ok(fs.existsSync(path.join(root, '.github/workflows/batchmath-qa.yml')));
console.log('Unit 3 Optimization/Related Rates v12.7 QA passed.');
