import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const context = { console, Math: Object.create(Math), Set, Array, Object, Number, String, RegExp };
context.window = context;
let seed = 0x12_08_2026;
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

const parser = context.BatchMathDerivativeExpressions;
const evaluate = expression => parser.evaluate(parser.parse(String(expression)), {});
const close = (a, b, tolerance = 1e-7) => Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
const texNumber = value => {
  let text = String(value).replace(/\\frac\{(-?\d+)\}\{(\d+)\}/g, '($1)/($2)').replace(/\\frac(-?\d+)\{(\d+)\}/g, '($1)/($2)');
  text = text.replace(/\\pi/g, 'pi').replace(/\\sqrt\{?(\d+)\}?/g, 'sqrt($1)');
  return evaluate(text);
};
const valuesOf = problem => {
  if (problem.answerType === 'numeric') return [Number(problem.numericAnswer)];
  if (problem.answerType === 'exact-expression') return [evaluate(problem.expressionAnswer)];
  return (problem.fields || []).map(field => field.numericAnswer == null ? evaluate(field.answer) : Number(field.numericAnswer));
};
const simpleRationalDistance = value => {
  let best = Infinity;
  for (let denominator = 1; denominator <= 10; denominator += 1) {
    best = Math.min(best, Math.abs(value - Math.round(value * denominator) / denominator));
  }
  return best;
};
const bisect = (fn, left, right) => {
  let a = left, b = right, fa = fn(a);
  for (let index = 0; index < 120; index += 1) {
    const midpoint = (a + b) / 2, fm = fn(midpoint);
    if (fa * fm <= 0) b = midpoint;
    else { a = midpoint; fa = fm; }
  }
  return (a + b) / 2;
};
const scanRoot = (fn, left, right) => {
  let priorX = left, priorY = fn(left);
  for (let index = 1; index <= 1000; index += 1) {
    const x = left + index * (right - left) / 1000, y = fn(x);
    if (priorY * y <= 0) return bisect(fn, priorX, x);
    priorX = x; priorY = y;
  }
  return NaN;
};

const expectedFamilies = {
  optimization: { noncalculator: 28, calculator: 9 },
  'related-rates': { noncalculator: 34, calculator: 34 }
};
const requiredNewFamilies = {
  optimization: [
    'capsule_unequal_material_costs',
    'square_pyramid_fixed_volume',
    'closest_point_polynomial',
    'open_box_dimensions_and_volume',
    'discrete_hotel_revenue',
    'discrete_orchard_yield'
  ],
  'related-rates': [
    'ladder_bottom',
    'ladder_wallAngle',
    'conical_tank_height_from_volume',
    'conical_tank_radius_from_volume',
    'conical_tank_volume_from_height',
    'cylindrical_tank_gallon_conversion',
    'semicircle_moving_point_area',
    'hemispherical_ice_layer'
  ]
};
const sampleCount = 18000;

for (const slug of ['optimization', 'related-rates']) {
  for (const mode of ['noncalculator', 'calculator']) {
    const generator = context.BatchMathAPTopicGenerators.get(slug);
    assert.equal(typeof generator, 'function');
    const families = new Set();
    const sources = { assignment: 0, test: 0, extension: 0 };
    let adjacentRepeats = 0;
    let previousFamily = '';
    let multiPart = 0;
    let negative = 0;
    let answerCount = 0;
    let calculatorQuality = 0;
    let independentChecks = 0;
    let diagrams = 0;
    let specializedDiagramChecks = 0;
    const symmetricStructures = new Set();
    const closestStructures = new Set();
    const changingShapes = new Set();

    for (let index = 0; index < sampleCount; index += 1) {
      const problem = generator({ mode });
      families.add(problem.familyId);
      sources[problem.sourceKind] += 1;
      if (problem.familyId === previousFamily) adjacentRepeats += 1;
      previousFamily = problem.familyId;
      if (problem.familyId.startsWith('multi_part_')) multiPart += 1;

      const combined = String(problem.questionHtml) + '\n' + String(problem.explanation);
      assert.doesNotMatch(combined, /NaN|undefined|null/);
      assert.doesNotMatch(combined, /\^1(?!\d)|\^\{1\}/);
      assert.doesNotMatch(combined, /\\frac\{[^{}]+\}\{1\}|\\frac\d+\{1\}/);
      assert.doesNotMatch(combined, /\b1[xyhrst]\b/);
      assert.doesNotMatch(combined, /\b1 feet\b|\b1 inches\b|\b1 radians\b/);
      assert.doesNotMatch(combined, /At this event|relevant interior critical value|admissible critical value/i);
      assert.doesNotMatch(combined, /The requested rate is the rate found above|The sign follows the geometry|No length values were substituted/i);
      assert.doesNotMatch(combined, /one-variable objective|physical (?:domain|interval)|endpoint rectangles|units per unit(?: of)? time/i);
      assert.doesNotMatch(problem.questionHtml, /(^|[^\\])\$/m, problem.familyId + ' contains an unsafe currency delimiter');
      assert.ok((problem.explanation.match(/<strong>Step/g) || []).length >= 4, problem.familyId + ' needs complete vertical work');
      assert.match(problem.explanation, /Differentiat|derivative/i);

      if (/^rectangle_under_/.test(problem.familyId)) symmetricStructures.add(problem.familyId);
      if (/^closest_point_/.test(problem.familyId)) closestStructures.add(problem.familyId);
      if (/_area$/.test(problem.familyId) && ['equilateral_area','square_area','rectangle_area','right_triangle_area','isosceles_triangle_area','circle_area','semicircle_area'].includes(problem.familyId)) changingShapes.add(problem.familyId);
      if (problem.hint) {
        assert.equal(problem.hintButtonLabel, 'Geometric Formula Hint');
        assert.doesNotMatch(problem.hint, /\\frac\{d|A\^{\\prime}|V\^{\\prime}|=\s*[-\d.]+(?:\\text|<)/, problem.familyId + ' hint gives away calculus or generated values');
      }
      if (['two_number_product','linear_price_demand_revenue','discrete_hotel_revenue','discrete_orchard_yield','implicit_equation_rates'].includes(problem.familyId)) assert.equal(problem.hint, undefined, problem.familyId + ' should not show a geometry hint');
      const diagramExcluded=['hotel_room_revenue','wholesale_order_revenue','linear_price_demand_revenue','orchard_yield','discrete_hotel_revenue','discrete_orchard_yield','two_number_product','implicit_equation_rates'];
      if(diagramExcluded.includes(problem.familyId))assert.equal(problem.diagramHint,undefined,problem.familyId+' should not show a diagram');
      if(problem.diagramHint){
        diagrams+=1;
        assert.equal(problem.diagramHintButtonLabel,'Diagram Hint');
        assert.match(problem.diagramHint,/<svg[^>]+viewBox="0 0 420 240"/);
        assert.match(problem.diagramHint,/<strong>Given:<\/strong>/);
        assert.doesNotMatch(problem.diagramHint,/\\frac\{d|critical value|correct answer|V\^\{?\\prime|A\^\{?\\prime/i,problem.familyId+' diagram leaks solution work');
        if(['two_poles_minimum_cable','shortest_ladder_over_fence','ladder_top','ladder_bottom','ladder_area','ladder_angle','ladder_wallAngle','multi_part_ladder','lamppost_shadow_length','lamppost_shadow_tip','multi_part_shadow'].includes(problem.familyId)){
          const shown=[...problem.questionHtml.matchAll(/\\\(([-\d.]+)\\\)/g)].slice(0,3).map(match=>match[1]);
          assert.ok(shown.some(value=>problem.diagramHint.includes(value)),problem.familyId+' diagram should use current values');
          specializedDiagramChecks+=1;
        }
      }
      assert.equal(problem.keypadMode,mode==='calculator'?'unit3-rounded':'unit3-geometry-exact',problem.familyId+' has the wrong keypad profile');
      if (slug === 'related-rates') {
        assert.doesNotMatch(problem.questionHtml, /(?:Find|find)\s*\\\(\\frac\{d/i, problem.familyId + ' asks only with derivative notation');
        if (problem.answerType === 'calculus-fields') problem.fields.forEach(field => assert.ok(field.labelText, problem.familyId + ' needs a contextual field label'));
        else assert.ok(problem.answerLabelText, problem.familyId + ' needs a contextual answer label');
        if (problem.familyId === 'rope_spool_balloon') {
          assert.match(problem.questionHtml, /balloon[^.]*rising|it is rising/i);
          assert.doesNotMatch(problem.questionHtml, /paid out/i);
        }
      }

      const answerValues = valuesOf(problem);
      assert.ok(answerValues.length >= 1);
      answerValues.forEach(value => {
        assert.ok(Number.isFinite(value), problem.familyId + ' has a non-finite answer');
        answerCount += 1;
        if (value < 0) negative += 1;
      });

      if (mode === 'calculator') {
        if (problem.answerType === 'numeric') {
          assert.equal(problem.requiredDecimals, 3);
          assert.match(problem.numericPlaceholder, /exactly three decimal places/i);
        } else {
          assert.equal(problem.answerType, 'calculus-fields');
          problem.fields.forEach(field => {
            assert.equal(field.requiredDecimals, 3);
            assert.ok(Number.isFinite(Number(field.numericAnswer)));
          });
        }
        if (/^closest_point_/.test(problem.familyId) || /^rectangle_under_.*arch$/.test(problem.familyId) || ['rigid_four_piece_barn_pen', 'open_top_rectangular_cardboard'].includes(problem.familyId)) calculatorQuality += 1;
      } else {
        assert.ok(['exact-expression', 'calculus-fields'].includes(problem.answerType));
        assert.doesNotMatch(combined, /\\approx|approximately|\d+\.\d{4,}/i, problem.familyId + ' introduced a non-calculator approximation');
        if (problem.answerType === 'exact-expression') {
          assert.ok(Number.isFinite(evaluate(problem.expressionAnswer)));
          if (/\b(?:pi|sqrt)\b|\/\(\s*(?:3|6|7|9|11|12|13|14|15|18|21|24)\s*\)/i.test(problem.expressionAnswer)) assert.equal(problem.requireExact, true);
        } else {
          problem.fields.forEach(field => {
            assert.ok(Number.isFinite(evaluate(field.answer)));
            assert.equal(field.requireExact, true);
          });
        }
      }

      if (problem.familyId === 'open_top_rectangular_cardboard' && problem.answerType === 'numeric') {
        const match = problem.questionHtml.match(/\\\(([\d.]+)\\\)-inch by \\\(([\d.]+)\\\)-inch/);
        assert.ok(match, problem.questionHtml);
        const length = Number(match[1]), width = Number(match[2]);
        const expected = (length + width - Math.sqrt(length * length - length * width + width * width)) / 6;
        assert.ok(close(problem.numericAnswer, expected));
        assert.ok(simpleRationalDistance(expected) > 1e-4);
        independentChecks += 1;
      }
      if (problem.familyId === 'closest_point_power_curve' && problem.variant === 'optimization_closest_point_x_three_halves') {
        const match = problem.questionHtml.match(/closest to \\\(\(([-\d.]+),([-\d.]+)\)\\\)/);
        assert.ok(match);
        const pointX = Number(match[1]), pointY = Number(match[2]);
        const derivative = x => 2 * (x - pointX) + 3 * Math.sqrt(x) * (Math.pow(x, 1.5) - 4 - pointY);
        const expected = scanRoot(derivative, 0.05, 9);
        assert.ok(close(problem.numericAnswer, expected));
        assert.ok(simpleRationalDistance(expected) > 1e-4);
        independentChecks += 1;
      }
      if (problem.familyId === 'rectangle_under_trig_arch') {
        const match = problem.questionHtml.match(/y=([\d.]+)\(1\+\\cos\((\d*)x\)\)/);
        assert.ok(match, problem.questionHtml);
        const scale = Number(match[1]), frequency = Number(match[2] || 1);
        const derivative = x => 2 * scale * (1 + Math.cos(frequency * x)) - 2 * scale * frequency * x * Math.sin(frequency * x);
        const rootValue = bisect(derivative, 0.0001, Math.PI / frequency - 0.0001);
        const width = 2 * rootValue, height = scale * (1 + Math.cos(frequency * rootValue)), area = width * height;
        if (problem.answerType === 'calculus-fields') {
          assert.ok(close(problem.fields[0].numericAnswer, width));
          assert.ok(close(problem.fields[1].numericAnswer, height));
        } else if (problem.variant.endsWith('_area')) assert.ok(close(problem.numericAnswer, area));
        else assert.ok(close(problem.numericAnswer, width));
        independentChecks += 1;
      }
      if (problem.familyId === 'capsule_unequal_material_costs') {
        const volumeMatch = problem.questionHtml.match(/holds \\\(([\d.]+)\\pi\\\)/);
        const costMatch = problem.questionHtml.match(/costs ([\d.]+) cents[\s\S]*costs ([\d.]+) cents/);
        assert.ok(volumeMatch && costMatch);
        const volume = Number(volumeMatch[1]), sideCost = Number(costMatch[1]), endCost = Number(costMatch[2]);
        const expectedRadius = Math.cbrt(sideCost * volume / (4 * endCost - 8 * sideCost / 3));
        const actualRadius = problem.answerType === 'numeric' ? problem.numericAnswer : evaluate(problem.fields[0].answer);
        assert.ok(close(actualRadius, expectedRadius));
        independentChecks += 1;
      }
      if (problem.familyId === 'hemispherical_ice_layer' && mode === 'noncalculator') {
        const innerMatch = problem.questionHtml.match(/radius \\\(([\d.]+)\\\) feet/);
        const thickMatch = problem.questionHtml.match(/ice is \\\(([^)]+)\\\)/);
        const rateMatch = problem.questionHtml.match(/changes at \\\(([^)]+)\\\)/);
        assert.ok(innerMatch && thickMatch && rateMatch);
        const inner = Number(innerMatch[1]), thicknessInches = texNumber(thickMatch[1]), rateInches = texNumber(rateMatch[1]);
        const expected = 2 * Math.PI * Math.pow(inner + thicknessInches / 12, 2) * rateInches / 12;
        assert.ok(close(evaluate(problem.expressionAnswer), expected));
        assert.match(problem.explanation, /Convert the measurements/);
        independentChecks += 1;
      }
      if (problem.familyId === 'cylindrical_tank_gallon_conversion') {
        const radiusMatch = problem.questionHtml.match(/radius \\\(([-\d.]+)\\\) feet/);
        const gallonsMatch = problem.questionHtml.match(/at \\\(([-\d.]+)\\\) gallons/);
        const conversionMatch = problem.questionHtml.match(/cubic foot}=([^\\]+|\\frac\{15\}\{2\})/);
        assert.ok(radiusMatch && gallonsMatch);
        const radius = Number(radiusMatch[1]), gallons = Number(gallonsMatch[1]);
        const conversion = mode === 'calculator' ? 7.48052 : 7.5;
        const expected = gallons / conversion / (Math.PI * radius * radius);
        assert.ok(close(answerValues[0], expected));
        assert.match(problem.explanation, /convert the volume rate/i);
        independentChecks += 1;
      }
      if (problem.familyId === 'semicircle_moving_point_area') {
        const relation = problem.questionHtml.match(/x\^2\+y\^2=([\d.]+)/);
        const xMatch = problem.questionHtml.match(/moment \\\(x=([-\d.]+)\\\)/);
        const dxMatch = problem.questionHtml.match(/\\frac\{dx\}\{dt\}=([-\d.]+)/);
        assert.ok(relation && xMatch && dxMatch);
        const radiusSquared = Number(relation[1]), x = Number(xMatch[1]), dx = Number(dxMatch[1]), y = Math.sqrt(radiusSquared - x * x);
        const expected = dx * (y * y - x * x) / (2 * y);
        assert.ok(close(answerValues[0], expected));
        independentChecks += 1;
      }
      if (problem.familyId.startsWith('multi_part_')) {
        assert.equal(problem.answerType, 'calculus-fields');
        assert.ok(problem.fields.length >= 2);
        assert.match(problem.questionHtml, /same instant|same moment|this moment|one situation/i);
      }
    }

    assert.ok(families.size >= expectedFamilies[slug][mode], slug + '/' + mode + ' did not expose enough families');
    assert.equal(adjacentRepeats, 0, slug + '/' + mode + ' repeated the same family back-to-back');
    assert.ok(Math.abs(sources.test / sampleCount - 0.15) < 0.025, slug + '/' + mode + ' test share drifted');
    assert.ok(Math.abs(sources.extension / sampleCount - 0.25) < 0.03, slug + '/' + mode + ' extension share drifted');
    assert.ok(independentChecks > 100, slug + '/' + mode + ' needs more independent checks');
    if (slug === 'optimization' && mode === 'calculator') assert.ok(calculatorQuality / sampleCount > 0.45, 'calculator optimization needs more numerical-root families');
    if (slug === 'optimization') {
      assert.ok(symmetricStructures.size >= 4, mode + ' symmetric rectangles need broader function structures');
      assert.ok(closestStructures.size >= 3, mode + ' closest-point problems need broader curve structures');
    }
    if (slug === 'related-rates') {
      assert.ok(multiPart / sampleCount >= 0.20 && multiPart / sampleCount <= 0.25, mode + ' multi-part share drifted');
      assert.ok(negative / answerCount >= 0.30 && negative / answerCount <= 0.50, mode + ' decreasing/outflow balance drifted');
      assert.ok(changingShapes.size >= 6, mode + ' changing-shape problems need broader geometry');
    }
    if (mode === 'noncalculator') {
      for (const family of requiredNewFamilies[slug]) assert.ok(families.has(family), slug + ' did not expose ' + family);
    }
    assert.ok(diagrams>sampleCount*0.70,slug+'/'+mode+' needs diagram coverage for geometric families');
    assert.ok(specializedDiagramChecks>200,slug+'/'+mode+' needs exact-value diagram checks');
  }
}

const practiceSource = read('assets/ap-topic-practice.js');
assert.match(practiceSource, /answerType==='calculus-fields'/);
assert.match(practiceSource, /function renderCalculusFields/);
assert.match(practiceSource, /current\.requireExact/);
assert.match(practiceSource, /field\.requiredDecimals/);
assert.match(practiceSource, /current\?\.diagramHint/);
assert.match(practiceSource, /aria-expanded/);
const topicCss=read('assets/ap-topic-practice.css');
for(const token of ['.geometry-diagram','viewBox','max-height:min(46vh,320px)','.diagram-givens'])assert.ok(read('assets/unit3-optimization-related-rates.js').includes(token)||topicCss.includes(token),'diagram implementation missing '+token);

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
  assert.ok(baseIndex >= 0 && overlayIndex > baseIndex && keypadIndex > overlayIndex, page + ' has incorrect shared-generator load order');
  assert.match(html, /"generatorVersion":"12\.8\.B"/, page + ' has stale generator analytics metadata');
}

assert.equal(JSON.parse(read('assets/app-version.json')).version, '12.8.B');
assert.ok(fs.existsSync(path.join(root, '.github/workflows/batchmath-qa.yml')));
console.log('Unit 3 Optimization/Related Rates v12.8.B randomized QA passed.');
