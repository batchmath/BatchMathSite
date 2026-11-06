import test from 'node:test';
import assert from 'node:assert/strict';
import {translateIntegralSetup} from '../../assets/mathlive/integral-setup.mjs';
import {load} from '../review-lab/unit6/qa/lib.mjs';

const L=load(['unit6-regions.js','unit6-volume.js']);
L.seed(1162);
const answer=L.W.BatchMathUnit6Volume.makeCS({family:'cs_setup',tier:'intermediate',calc:'non-calculator'}).parts[0].answer;
const body='\\int_0^4(2\\sqrt{4-y})^2\\,dy';
function grade(tex) {
  const translated=translateIntegralSetup(tex);
  assert.equal(translated.status,'complete',JSON.stringify(translated));
  const parsed=L.C.parseSetup(translated.input);
  assert.ok(!parsed.error,parsed.error);
  return L.C.checkIntegral(parsed.rows,answer);
}

test('explicit coefficient multiplication reaches the original structural checker',()=>{
  for(const product of ['\\cdot','\\times','*','·','×']) {
    const result=grade('\\frac{\\pi}{8}'+product+body);
    assert.equal(result.valid&&result.ok,true,product);
  }
});
test('implicit coefficients and parenthesized coefficients retain their meaning',()=>{
  for(const coefficient of ['\\frac{\\pi}{8}','(\\frac{\\pi}{8})\\cdot','(\\pi/8)*']) {
    const r=grade(coefficient+body);assert.equal(r.valid&&r.ok,true,coefficient);
  }
});
test('missing pi and the retired radius-across area coefficient are still rejected',()=>{
  for(const coefficient of ['\\frac{1}{8}\\cdot','\\frac{\\pi}{2}\\cdot']) {
    const r=grade(coefficient+body);assert.equal(r.ok,false,coefficient);
  }
});
test('same-value wrong integrands remain structurally wrong',()=>{
  const r=grade('\\frac{\\pi}{8}\\cdot\\int_0^4((2\\sqrt{4-y})^2+y-2)\\,dy');
  assert.equal(r.valid,true);assert.equal(r.ok,false);
});
test('wrong limits and variables remain rejected',()=>{
  for(const tex of ['\\frac{\\pi}{8}\\cdot\\int_0^3(2\\sqrt{4-y})^2\\,dy',
                   '\\frac{\\pi}{8}\\cdot\\int_0^4(2\\sqrt{4-x})^2\\,dx']) {
    assert.equal(grade(tex).ok,false,tex);
  }
});
test('bare or doubled multiplication cannot become an implied coefficient of one',()=>{
  for(const tex of ['\\cdot'+body,'\\times'+body,'2\\cdot\\cdot'+body,'2**'+body])
    assert.equal(translateIntegralSetup(tex).status,'incomplete',tex);
});
test('multiplication after an integral remains outside the accepted setup grammar',()=>{
  const translated=translateIntegralSetup('\\frac{\\pi}{8}'+body+'\\cdot 2');
  const parsed=L.C.parseSetup(translated.input);
  assert.ok(parsed.error||!L.C.checkIntegral(parsed.rows,answer).ok);
});
