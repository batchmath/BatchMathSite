#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function generator(seed) {
  const sandbox = { window: { BatchMathRNG: { random: seededRandom(seed) } }, console, Math };
  vm.createContext(sandbox);
  for (const file of ['assets/ap-topic-generators.js', 'assets/unit3-applications-generators.js']) {
    vm.runInContext(read(file), sandbox, { filename: file });
  }
  return sandbox.window.BatchMathAPTopicGenerators.get('tangent-and-secant-line-approximations');
}

for (const [focus, expected] of [['secant', 'secant'], ['tangent', 'tangent']]) {
  const generate = generator(focus === 'secant' ? 12601 : 12602);
  for (let index = 0; index < 3000; index += 1) {
    const problem = generate({ approximationType: focus });
    assert.equal(problem.approximationMethod, expected, `${focus} filter produced ${problem.approximationMethod} in ${problem.id}`);
  }
}

{
  const generate = generator(12603);
  let tangent = 0;
  let secant = 0;
  for (let index = 0; index < 12000; index += 1) {
    const problem = generate({ approximationType: 'mixed' });
    if (problem.approximationMethod === 'tangent') tangent += 1;
    if (problem.approximationMethod === 'secant') secant += 1;
  }
  const tangentShare = tangent / (tangent + secant);
  assert.ok(tangentShare > 0.48 && tangentShare < 0.52, `Mixed distribution drifted to ${tangentShare}`);
}

const page = read('ap-calculus/unit-3-applications-derivative/topics/tangent-and-secant-line-approximations/practice/index.html');
assert.match(page, /<label for="approximationType" class="bm-practice-select-label">Practice Type<\/label>/);
assert.match(page, /<option value="mixed" selected>Mixed<\/option>/);
assert.match(page, /<option value="secant">Secant Lines<\/option>/);
assert.match(page, /<option value="tangent">Tangent Lines<\/option>/);
assert.match(page, /"modeSelectIds":\["approximationType"\]/);

assert.ok(fs.existsSync(path.join(root, '.github/workflows/batchmath-qa.yml')), 'GitHub Actions workflow is missing');
console.log('Version 12.6 archive and Tangent/Secant filter QA passed.');
