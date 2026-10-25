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
const visibleDiagramText = html => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const containsNumber = (text, value) => {
  const token = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\d.])${token}(?![\\d.])`).test(text);
};
const elementAttributes = tag => Object.fromEntries([...String(tag).matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const elementsWithClass = (html, tag, className) => [...String(html).matchAll(new RegExp(`<${tag}[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, 'g'))].map(match => elementAttributes(match[0]));
const targetedDiagramChecks = {
  spotlight: { noncalculator: 0, calculator: 0 },
  cone: { noncalculator: 0, calculator: 0 },
  triangularTrough: { noncalculator: 0, calculator: 0 },
  trapezoidalTrough: { noncalculator: 0, calculator: 0 },
  isosceles: { noncalculator: 0, calculator: 0 },
  ice: { noncalculator: 0, calculator: 0 },
  shadow: { noncalculator: 0, calculator: 0 },
  semicircle: { noncalculator: 0, calculator: 0 },
  softball: { noncalculator: 0, calculator: 0 },
  inscribedCircle: { noncalculator: 0, calculator: 0 }
};

function verifyRefinedDiagram(problem, mode) {
  const html = String(problem.diagramHint || '');
  const visible = visibleDiagramText(html);
  if (!html) return;

  if (problem.familyId === 'rotating_spotlight') {
    targetedDiagramChecks.spotlight[mode] += 1;
    const distanceMatch = problem.questionHtml.match(/is \\\(([\d.]+)\\\) feet from/);
    const thetaMatch = problem.questionHtml.match(/When \\\(\\theta=([^)]*?)\\\),/);
    const omegaMatch = problem.questionHtml.match(/at \\\(([\d.]+)\\\) radians per minute/);
    assert.ok(distanceMatch && thetaMatch && omegaMatch, 'spotlight prompt must identify the fixed distance, theta, and angular rate');
    assert.match(problem.questionHtml, /angle at the spotlight between that perpendicular and the beam/);
    assert.match(problem.questionHtml, /rotates away from the perpendicular/);
    assert.match(problem.explanation, /\\tan\\theta=\\frac\{x\}\{[\d.]+\}/);
    assert.match(problem.explanation, /\\sec\^2\\theta/);
    assert.doesNotMatch(problem.explanation, /\\cot\\theta|\\csc\^2\\theta/);
    assert.match(html, /<path class="diagram-fixed-object" d="M160 253H177V270"\/>/);
    assert.match(html, /<path class="diagram-angle" d="M160 108A42 42 0 0 0 /);
    const beam = elementsWithClass(html, 'line', 'diagram-accent')[0];
    assert.ok(beam && Number(beam.x1) === 160 && Number(beam.y1) === 66 && Number(beam.y2) === 270, 'spotlight beam must begin at the spotlight');
    const theta = texNumber(thetaMatch[1]), displayedTheta = Math.atan2(Number(beam.x2) - 160, 270 - 66);
    assert.ok(close(theta, displayedTheta, 8e-5), 'spotlight beam geometry must match the generated theta');
    const expected = Number(distanceMatch[1]) * Number(omegaMatch[1]) / Math.pow(Math.cos(theta), 2);
    assert.ok(close(valuesOf(problem)[0], expected), `spotlight answer must match the perpendicular-angle definition: actual ${valuesOf(problem)[0]}, expected ${expected}, theta ${theta}`);
    assert.ok(visible.includes(distanceMatch[1] + ' ft') && /\bx\b/.test(visible) && /θ/.test(visible));
  }

  if (/conical_tank|inverted_conical_tank/.test(problem.familyId)) {
    targetedDiagramChecks.cone[mode] += 1;
    assert.match(html, /<circle class="diagram-point-fixed" cx="300" cy="188" r="4"\/>/);
    const variableDimensions = elementsWithClass(html, 'line', 'diagram-dimension-variable');
    const waterRadius = variableDimensions.find(line => Number(line.y1) === 188 && Number(line.y2) === 188 && Number(line.x1) === 300);
    const waterHeight = variableDimensions.find(line => Number(line.x1) === 300 && Number(line.x2) === 300 && Number(line.y1) === 188 && Number(line.y2) === 307);
    const expectedWaterRight = 300 + 142 * (307 - 188) / (307 - 55);
    assert.ok(waterRadius && close(Number(waterRadius.x2), expectedWaterRight, 8e-5),
      'water-surface r must run from the center axis to the exact cone-wall intersection');
    assert.ok(waterHeight, 'water height h must use the cone vertex and exact water-surface level');
    assert.match(html, new RegExp('<path class="diagram-changing-fill" d="M'+(600-expectedWaterRight).toFixed(2)+' 188L300 307L'+expectedWaterRight.toFixed(2)+' 188Z"\\/>'),
      'water triangle must share the full cone vertex and wall lines');
    assert.match(html, new RegExp('<ellipse class="diagram-water-line" cx="300" cy="188" rx="'+(expectedWaterRight-300).toFixed(2)+'"'));
    assert.match(html, /class="diagram-dimension diagram-dimension-fixed" x1="300" y1="55" x2="442" y2="55"/,
      'fixed tank radius must run from the center axis to the rim');
  }

  if (problem.familyId === 'triangular_trough' || problem.familyId === 'trapezoidal_trough') {
    const triangle = problem.familyId === 'triangular_trough';
    targetedDiagramChecks[triangle ? 'triangularTrough' : 'trapezoidalTrough'][mode] += 1;
    const leftTop = 112, rightTop = 488, topY = 62, bottomY = 278, waterY = 174;
    const leftBottom = triangle ? 300 : 188, rightBottom = triangle ? 300 : 412;
    const fraction = (waterY - topY) / (bottomY - topY);
    const waterLeft = leftTop + (leftBottom - leftTop) * fraction;
    const waterRight = rightTop + (rightBottom - rightTop) * fraction;
    const waterLine = elementsWithClass(html, 'line', 'diagram-water-line')[0];
    assert.ok(waterLine && close(Number(waterLine.x1), waterLeft, 8e-5) && close(Number(waterLine.x2), waterRight, 8e-5)
      && Number(waterLine.y1) === waterY && Number(waterLine.y2) === waterY,
    `${problem.familyId} water surface must end at the exact wall intersections`);
    const changingPath = html.match(/<path class="diagram-changing-fill" d="([^"]+)"\/>/);
    const expectedPath = triangle
      ? `M${waterLeft.toFixed(2)} ${waterY}L300 ${bottomY}L${waterRight.toFixed(2)} ${waterY}Z`
      : `M${waterLeft.toFixed(2)} ${waterY}L188 ${bottomY}H412L${waterRight.toFixed(2)} ${waterY}Z`;
    assert.equal(changingPath?.[1], expectedPath, `${problem.familyId} water region must be built from the trough walls`);
    const variableDimensions = elementsWithClass(html, 'line', 'diagram-dimension-variable');
    const height = variableDimensions.find(line => Number(line.x1) === 300 && Number(line.x2) === 300
      && Number(line.y1) === waterY && Number(line.y2) === bottomY);
    const width = elementsWithClass(html, 'text', 'diagram-label-variable').find(label => {
      const segment = String(label['data-segment'] || '').split(',').map(Number);
      return segment.length === 4 && close(segment[0], waterLeft, 8e-5) && close(segment[2], waterRight, 8e-5)
        && segment[1] === waterY && segment[3] === waterY;
    });
    assert.ok(height, `${problem.familyId} h must span the exact bottom and water levels`);
    assert.ok(width, `${problem.familyId} w must use the exact water-surface endpoints`);
  }

  if (problem.familyId === 'isosceles_triangle_area') {
    targetedDiagramChecks.isosceles[mode] += 1;
    assert.match(html, /<path class="diagram-changing-fill" d="M175 292H425L300 42Z"\/>/,
      'isosceles triangle must be symmetric about the exact base midpoint');
    const altitude = elementsWithClass(html, 'line', 'diagram-hidden')[0];
    assert.ok(altitude && Number(altitude.x1) === 300 && Number(altitude.x2) === 300
      && Number(altitude.y1) === 42 && Number(altitude.y2) === 292,
    'isosceles altitude must connect the apex to the exact base midpoint');
    const leftLength = Math.hypot(300 - 175, 42 - 292), rightLength = Math.hypot(425 - 300, 292 - 42);
    assert.ok(close(leftLength, rightLength), 'isosceles sides must have exactly equal geometry');
    assert.ok(292 - 42 > Math.sqrt(3) * (425 - 175) / 2,
      'isosceles diagram must be visibly taller than an equilateral triangle on the same base');
  }

  if (problem.familyId === 'hemispherical_ice_layer') {
    targetedDiagramChecks.ice[mode] += 1;
    const innerMatch = problem.questionHtml.match(/radius \\\(([\d.]+)\\\) feet/);
    assert.ok(innerMatch, 'ice prompt must expose the generated fixed roof radius');
    const fixedRadius = elementsWithClass(html, 'line', 'diagram-dimension-fixed').find(line => Number(line.x1) === 300 && Number(line.y1) === 274);
    const outerRadius = elementsWithClass(html, 'line', 'diagram-dimension-variable').find(line => Number(line.x1) === 300 && Number(line.y1) === 274);
    assert.ok(fixedRadius && close(Math.hypot(Number(fixedRadius.x2)-300, Number(fixedRadius.y2)-274), 185, 8e-5),
      'fixed roof radius must run from the common center to the inner roof arc');
    assert.ok(outerRadius && close(Math.hypot(Number(outerRadius.x2)-300, Number(outerRadius.y2)-274), 204, 8e-5),
      'outer radius must run from the same center to the outer ice arc');
    assert.ok(visible.includes(innerMatch[1]+' ft'), 'ice diagram must show the generated fixed roof radius');
    assert.ok(visible.includes(innerMatch[1]+' + x'), 'ice diagram must label the full outer radius as fixed radius plus x');
    assert.doesNotMatch(visible, /\bR\b/, 'ice diagram must not replace the outer-radius relationship with R');
  }

  if (/shadow/.test(problem.familyId)) {
    targetedDiagramChecks.shadow[mode] += 1;
    assert.doesNotMatch(visible, /x\s*\+\s*s/, 'x+s must not be placed beside the person');
    const rays = elementsWithClass(html, 'line', 'diagram-accent');
    assert.equal(rays.length, 1, 'shadow diagram must contain one light ray');
    const fixedLines = elementsWithClass(html, 'line', 'diagram-fixed-object');
    const person = fixedLines.find(line => Number(line.x1) !== 98 && Number(line.x1) === Number(line.x2));
    assert.ok(person, 'shadow diagram must contain the person segment');
    const ray = rays[0], rayDx = Number(ray.x2) - Number(ray.x1), rayDy = Number(ray.y2) - Number(ray.y1);
    const headCross = (Number(person.x1) - Number(ray.x1)) * rayDy - (Number(person.y2) - Number(ray.y1)) * rayDx;
    assert.ok(Math.abs(headCross) < 1e-7, 'lamppost top, person head, and shadow tip must be collinear');
  }

  if (problem.familyId === 'semicircle_moving_point_area') {
    targetedDiagramChecks.semicircle[mode] += 1;
    const point = elementsWithClass(html, 'circle', 'diagram-point-variable')[0];
    assert.ok(point, 'semicircle diagram must show the moving point');
    const px = Number(point.cx), py = Number(point.cy);
    assert.ok(Math.abs(Math.pow(px - 300, 2) + Math.pow(py - 282, 2) - 190 * 190) < 3,
      'moving point must lie on the displayed semicircle');
    const radiusLine = elementsWithClass(html, 'line', 'diagram-distance')[0];
    assert.ok(radiusLine && Number(radiusLine.x1) === 300 && Number(radiusLine.y1) === 282 && Number(radiusLine.x2) === px && Number(radiusLine.y2) === py,
      'radius and moving point must share the same endpoint');
    const triangle = html.match(/<path class="diagram-changing-fill" d="([^"]+)"\/>/);
    assert.ok(triangle && triangle[1].includes(`L${point.cx} ${point.cy}L${point.cx} 282`), 'triangle legs must meet the moving point');
  }

  if (problem.familyId === 'softball_diamond') {
    targetedDiagramChecks.softball[mode] += 1;
    assert.match(html, /<path class="diagram-fixed-shape" d="M300 40L430 170L300 300L170 170Z"\/>/,
      'softball diamond must be square');
    const point = elementsWithClass(html, 'circle', 'diagram-point-variable')[0];
    const px = Number(point.cx), py = Number(point.cy);
    assert.ok(Math.abs(px + py - 340) < 1e-8, 'runner must lie on the second-to-third baseline');
    const dataMatch = problem.questionHtml.match(/side length \\\(([\d.]+)\\\)[\s\S]*when she is \\\(([\d.]+)\\\) feet from third/);
    assert.ok(dataMatch, 'softball prompt must provide side length and runner distance');
    const displayedFraction = Math.hypot(px - 170, py - 170) / Math.hypot(130, -130);
    assert.ok(close(displayedFraction, Number(dataMatch[2]) / Number(dataMatch[1]), 8e-5), 'runner position must match the generated distance from third');
    const distanceLine = elementsWithClass(html, 'line', 'diagram-distance')[0];
    assert.ok(distanceLine && Number(distanceLine.x1) === 300 && Number(distanceLine.y1) === 300 && Number(distanceLine.x2) === px && Number(distanceLine.y2) === py,
      'distance d must connect home to the runner');
    const variableDimension = elementsWithClass(html, 'text', 'diagram-label-variable').find(label => label['data-label-style'] === 'edge');
    const variableSegment = String(variableDimension?.['data-segment'] || '').split(',').map(Number);
    assert.ok(variableDimension && variableSegment.length === 4 && Math.abs((variableSegment[2] - variableSegment[0]) + (variableSegment[3] - variableSegment[1])) < 0.03,
      'runner distance x must follow the second-to-third baseline');
  }

  if (problem.familyId === 'rectangle_in_circle') {
    targetedDiagramChecks.inscribedCircle[mode] += 1;
    const circle = elementsWithClass(html, 'circle', 'diagram-object')[0];
    const rectangle = elementsWithClass(html, 'rect', 'diagram-accent-fill')[0];
    assert.ok(circle && rectangle, 'inscribed-circle diagram needs its circle and rectangle');
    const cx = Number(circle.cx), cy = Number(circle.cy), r = Number(circle.r);
    const left = Number(rectangle.x), top = Number(rectangle.y), width = Number(rectangle.width), height = Number(rectangle.height);
    for (const [x, y] of [[left, top], [left + width, top], [left, top + height], [left + width, top + height]]) {
      assert.ok(Math.abs(Math.pow(x - cx, 2) + Math.pow(y - cy, 2) - r * r) < 3, 'every rectangle corner must lie on the circle');
    }
    assert.ok(Math.max(width, height) / Math.min(width, height) > 1.3, 'diagram must show a visibly non-square rectangle');
    const radiusLine = elementsWithClass(html, 'line', 'diagram-distance')[0];
    assert.ok(radiusLine && Number(radiusLine.x1) === cx && Number(radiusLine.y1) === cy && close(Number(radiusLine.x2), left + width) && close(Number(radiusLine.y2), top),
      'radius must run from the common center to a rectangle corner');
  }
}

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
    let fixedValueDiagramChecks = 0;
    let variableLabelDiagramChecks = 0;
    const diagramKinds = new Set();
    const curveDiagramLabels = new Set();
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
      assert.doesNotMatch(combined + '\n' + String(problem.diagramHint || ''), /φ|α|\\phi|\\alpha|\\varphi/,
        problem.familyId + ' must use theta when it has a single angle variable');
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
        assert.match(problem.diagramHint,/<div class="geometry-diagram-hint" data-diagram-kind="[^"]+">/);
        assert.match(problem.diagramHint,/<div class="diagram-title">[^<]+<\/div>/);
        assert.match(problem.diagramHint,/<svg[^>]+viewBox="0 0 600 340"[^>]+preserveAspectRatio="xMidYMid meet"/);
        assert.doesNotMatch(problem.diagramHint,/NaN|undefined|null/);
        assert.doesNotMatch(problem.diagramHint,/\\frac\{d|critical value|correct answer|V\^\{?\\prime|A\^\{?\\prime/i,problem.familyId+' diagram leaks solution work');
        const kindMatch=problem.diagramHint.match(/data-diagram-kind="([^"]+)"/);
        diagramKinds.add(kindMatch[1]);
        const visible=visibleDiagramText(problem.diagramHint);
        assert.match(problem.diagramHint,/diagram-label-variable/,problem.familyId+' diagram needs a clearly styled changing quantity');
        for(const match of problem.diagramHint.matchAll(/\b(?:x|x1|x2|cx)="(-?\d+(?:\.\d+)?)"/g))assert.ok(Number(match[1])>=0&&Number(match[1])<=600,problem.familyId+' has a clipped horizontal coordinate');
        for(const match of problem.diagramHint.matchAll(/\b(?:y|y1|y2|cy)="(-?\d+(?:\.\d+)?)"/g))assert.ok(Number(match[1])>=0&&Number(match[1])<=340,problem.familyId+' has a clipped vertical coordinate');
        const labelPositions=[...problem.diagramHint.matchAll(/<text[^>]*x="([\d.]+)" y="([\d.]+)"[^>]*>[^<]*<\/text>/g)].map(match=>[Number(match[1]),Number(match[2])]);
        for(let first=0;first<labelPositions.length;first+=1)for(let second=first+1;second<labelPositions.length;second+=1)assert.ok(Math.hypot(labelPositions[first][0]-labelPositions[second][0],labelPositions[first][1]-labelPositions[second][1])>22,problem.familyId+' has colliding diagram labels');
        if(problem.diagramHint.includes('diagram-curve'))curveDiagramLabels.add(visible.replace(/^.*?y = /,'y = '));
        verifyRefinedDiagram(problem, mode);

        if(/^ladder_|^multi_part_ladder$/.test(problem.familyId)){
          const match=problem.questionHtml.match(/A \\\(([-\d.]+)\\\)-foot ladder/);
          assert.ok(match&&visible.includes(match[1]+' ft'),problem.familyId+' must show the generated fixed ladder length');
          assert.match(visible,/\bx\b/);assert.match(visible,/\by\b/);fixedValueDiagramChecks+=1;variableLabelDiagramChecks+=1;
        }else if(/shadow/.test(problem.familyId)){
          const match=problem.questionHtml.match(/A \\\(([-\d.]+)\\\)-foot person[\s\S]*\\\(([-\d.]+)\\\)-foot lamppost/);
          assert.ok(match&&visible.includes(match[1]+' ft')&&visible.includes(match[2]+' ft'),problem.familyId+' must show both generated fixed heights');
          assert.match(visible,/\bx\b/);assert.match(visible,/\bs\b/);fixedValueDiagramChecks+=1;variableLabelDiagramChecks+=1;
        }else if(/^sphere_/.test(problem.familyId)||/^circular_/.test(problem.familyId)){
          assert.match(visible,/\br\b/);variableLabelDiagramChecks+=1;
          const instant=problem.questionHtml.match(/(?:radius is|when \\\(r=)([-\d.]+)/);
          if(instant)assert.equal(containsNumber(visible,instant[1]),false,problem.familyId+' must keep the changing radius labeled r');
        }else if(/conical_tank|inverted_conical_tank/.test(problem.familyId)){
          assert.match(visible,/\bh\b/);assert.match(visible,/\br\b/);variableLabelDiagramChecks+=1;
          const depthMatch=problem.questionHtml.match(/(?:water depth is|water is )\\?\(?([-\d.]+)\\?\)? feet (?:deep|and)/);
          if(depthMatch)assert.equal(containsNumber(visible,depthMatch[1]),false,problem.familyId+' must not replace changing water depth h with its instant value');
          fixedValueDiagramChecks+=1;
        }else if(/trough/.test(problem.familyId)){
          assert.match(visible,/\bh\b/);assert.match(visible,/\bw\b/);variableLabelDiagramChecks+=1;fixedValueDiagramChecks+=1;
        }else if(/cylindrical_tank/.test(problem.familyId)){
          assert.match(visible,/\bh\b/);variableLabelDiagramChecks+=1;fixedValueDiagramChecks+=1;
        }else if(/_area$/.test(problem.familyId)&&slug==='related-rates'){
          assert.match(problem.diagramHint,/diagram-label-variable/);variableLabelDiagramChecks+=1;
        }else if(['softball_diamond','rotating_spotlight','angle_of_elevation','rope_spool_balloon','semicircle_moving_point_area','hemispherical_ice_layer'].includes(problem.familyId)){
          assert.match(problem.diagramHint,/diagram-label-fixed|diagram-fixed-notes/);fixedValueDiagramChecks+=1;variableLabelDiagramChecks+=1;
        }else if(slug==='optimization'){
          if(/sheet-net|poles|ladder-fence|inscribed|page|pig-pen|axis-triangle|fence|cylinder|capsule|pyramid|cone/.test(kindMatch[1]))fixedValueDiagramChecks+=1;
          variableLabelDiagramChecks+=1;
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
    assert.ok(variableLabelDiagramChecks>200,slug+'/'+mode+' needs changing-variable diagram checks');
    if(slug==='optimization'||slug==='related-rates')assert.ok(fixedValueDiagramChecks>200,slug+'/'+mode+' needs generated fixed-value diagram checks');
    const minimumDiagramKinds=slug==='optimization'?(mode==='calculator'?9:15):15;
    assert.ok(diagramKinds.size>=minimumDiagramKinds,slug+'/'+mode+' needs broad problem-specific diagram coverage');
    if(slug==='optimization')assert.ok(curveDiagramLabels.size>=3,mode+' optimization diagrams need actual generated curve variety');
  }
}

for (const [family, byMode] of Object.entries(targetedDiagramChecks)) {
  for (const mode of ['noncalculator', 'calculator']) {
    if (family === 'inscribedCircle' && mode === 'calculator') {
      assert.equal(byMode[mode], 0, 'rectangle-in-circle is intentionally non-calculator only');
      continue;
    }
    assert.ok(byMode[mode] >= 25, `${family}/${mode} needs repeated targeted randomized diagram checks`);
  }
}

const practiceSource = read('assets/ap-topic-practice.js');
assert.match(practiceSource, /answerType==='calculus-fields'/);
assert.match(practiceSource, /function renderCalculusFields/);
assert.match(practiceSource, /current\.requireExact/);
assert.match(practiceSource, /field\.requiredDecimals/);
assert.match(practiceSource, /current\?\.diagramHint/);
assert.match(practiceSource, /current\?\.hint\)hints\.push\(\{html:current\.hint,label:current\.hintButtonLabel\|\|'Show Hint',kind:'formula'\}\)/);
assert.match(practiceSource, /current\?\.diagramHint\)hints\.push\(\{html:current\.diagramHint,label:current\.diagramHintButtonLabel\|\|'Diagram Hint',kind:'diagram'\}\)/);
assert.match(practiceSource, /aria-expanded/);
const topicCss=read('assets/ap-topic-practice.css');
for(const token of ['.geometry-diagram','viewBox','max-height:min(50vh,380px)','.diagram-fixed-notes','.diagram-label-variable'])assert.ok(read('assets/unit3-optimization-related-rates.js').includes(token)||topicCss.includes(token),'diagram implementation missing '+token);
assert.match(topicCss,/@media\(max-width:520px\)[\s\S]*\.geometry-diagram\{width:100%;max-height:min\(44vh,285px\)/,'diagram CSS needs the narrow-screen responsive rule');

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
  assert.match(html, /"generatorVersion":"12\.8\.F"/, page + ' has stale generator analytics metadata');
  if(page.includes('/comprehensive-review/'))assert.match(html,/"slugs":\[[^\]]*"optimization","related-rates"\]/,page+' must inherit both shared diagram-enabled generators');
}

assert.equal(JSON.parse(read('assets/app-version.json')).version, '12.8.F');
assert.ok(fs.existsSync(path.join(root, '.github/workflows/batchmath-qa.yml')));
console.log('Unit 3 Optimization/Related Rates v12.8.F randomized QA passed.');
