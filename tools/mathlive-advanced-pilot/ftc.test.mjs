import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {engine,root,rng,slugs} from './engine.mjs';
import {translateAdvancedExpression,batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
export const ftcFamilies=['upper_identity','lower_identity','upper_linear','upper_power','lower_power','upper_trig','both_algebraic','both_transcendental'];
export const rulesFamilies=['reverse_limits','zero_width','linearity','interval_decomposition','combined_rules','reversed_combination'];
const w=engine(),results=[];
for(const key of ['ftc','rules'])test(`${key}: 4000 actual generated questions, all families, exact checker parity`,()=>{
  const found=new Set();let pairs=0;
  for(let i=1;i<=4000;i++){
    w.BatchMathRNG={random:rng(i*719+key.length)};const p=w.BatchMathAPTopicGenerators.get(slugs[key])(),s=p.stage1,spec=s.unit4Answer;found.add(p.unit4Meta.family);
    const raw=spec.expression||w.BatchMathUnit4Answers.expression(spec.value);
    const translated=translateAdvancedExpression(s.answerTex);assert.equal(translated.status,'complete',s.answerTex);assert.equal(w.BatchMathUnit4Answers.check(translated.input,spec).ok,true,`${p.id}: ${translated.input}`);
    for(const value of [raw,`(${raw})+1`,`(${raw})+0`,'(1)/()']){
      const t=translateAdvancedExpression(batchmathToLatex(value).latex);assert.notEqual(t.input,null);assert.deepEqual(w.BatchMathUnit4Answers.check(t.input,spec),w.BatchMathUnit4Answers.check(value,spec),`${p.id}: ${value}`);pairs++;
    }
  }
  assert.deepEqual([...found].sort(),[...(key==='ftc'?ftcFamilies:rulesFamilies)].sort());results.push({engine:key,samples:4000,gradingPairs:pairs,families:[...found].sort()});
});
test('2x sec(x^6), nested powers and a missing factor retain actual FTC checker behavior',()=>{
  const spec={kind:'function-expression',expression:'2*x*sec(x^6)'},check=w.BatchMathUnit4Answers.check;
  const good=translateAdvancedExpression('2x\\sec(x^6)');assert.equal(check(good.input,spec).ok,true);assert.equal(check('2xsec(x^6)',spec).ok,true);
  assert.equal(check(translateAdvancedExpression('\\sec(x^6)').input,spec).ok,false);
  assert.equal(check(translateAdvancedExpression('2x\\sec^6(x)').input,spec).ok,false);
  assert.equal(check(translateAdvancedExpression('2x\\sec((x^2)^3)').input,spec).ok,true);
  const product={kind:'function-expression',expression:'sec(x)^2*(-2+tan(x))'};
  assert.equal(check(translateAdvancedExpression('\\sec^2 x\\left(-2+\\tan x\\right)').input,product).ok,true);
  fs.mkdirSync(root+'tools/mathlive-advanced-pilot/artifacts',{recursive:true});fs.writeFileSync(root+'tools/mathlive-advanced-pilot/artifacts/ftc-math.json',JSON.stringify(results,null,2)+'\n');
});
