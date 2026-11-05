import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {engine,root,rng,slugs} from './engine.mjs';
import {translateAdvancedExpression,batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
import {canonicalNewtonLatex,translateNewtonLatex,newtonToLatex} from '../../assets/mathlive/newton-notation.mjs';
const w=engine(),notation=w.BatchMathNewtonNotation,check=w.BatchMathUnit4Answers.check;
test('Newton: 4000 generated questions, all construction families/subtypes, both parts and wrong bounds',()=>{
  const families=new Set(),subtypes=new Set();let second=0,pairs=0;
  for(let i=1;i<=4000;i++){
    w.BatchMathRNG={random:rng(i*719+7)};const p=w.BatchMathAPTopicGenerators.get(slugs.newton)(),spec=p.stage1.unit4Answer;families.add(p.unit4Meta.family);if(p.unit4Meta.family==='nonpolynomial_representation')subtypes.add(p.unit4Meta.subtype);
    const full=`lim(n->infinity,sum(k=1,n,${spec.expression}))`;
    const translated=translateNewtonLatex(p.stage1.answerTex,notation.normalize);assert.equal(translated.status,'complete',p.stage1.answerTex+': '+translated.message);assert.equal(check(translated.input,spec).ok,true,p.id+': '+translated.input);
    const imported=newtonToLatex(full,notation.read);assert.equal(imported.status,'complete');assert.equal(check(translateNewtonLatex(imported.latex,notation.normalize).input,spec).ok,true,p.id+': '+imported.latex);
    const body=translateAdvancedExpression(batchmathToLatex(spec.expression).latex);assert.deepEqual(check(body.input,spec),check(spec.expression,spec));pairs++;
    for(const raw of [p.stage1.answerTex.replace('n\\to\\infty','n\\to0'),p.stage1.answerTex.replace('k=1','k=0'),p.stage1.answerTex.replace('^{n}','^{n-1}')]){
      const r=translateNewtonLatex(raw,notation.normalize);assert.deepEqual(check(r.input??'?',spec),check(raw,spec),p.id+': '+raw);pairs++;
    }
    if(p.stage2){const s=p.stage2.unit4Answer,raw=w.BatchMathUnit4Answers.expression(s.value);assert.equal(check(translateAdvancedExpression(batchmathToLatex(raw).latex).input,s).ok,true);second++;}
  }
  assert.deepEqual([...families].sort(),['linear_construction','nonpolynomial_representation','quadratic_combination','quadratic_monomial']);assert.equal(subtypes.size,8);
  fs.writeFileSync(root+'tools/mathlive-advanced-pilot/artifacts/newton-math.json',JSON.stringify({samples:4000,families:[...families].sort(),nonpolynomialSubtypes:[...subtypes].sort(),secondParts:second,gradingPairs:pairs},null,2)+'\n');
});
test('TeX argument canonicalization keeps unreduced fractions, bounds and missing slots',()=>{
  assert.equal(canonicalNewtonLatex('\\frac12').latex,'\\frac{1}{2}');assert.equal(canonicalNewtonLatex('\\frac{12}{34}').latex,'\\frac{12}{34}');
  const raw='\\lim_{n\\to\\infty}\\sum_{k=2-1}^{n+0}\\frac{4}{2}';const r=translateNewtonLatex(raw,notation.normalize);assert.ok(r.input.includes('k=2-1'));assert.ok(r.input.includes('n+0'));assert.ok(r.input.includes('(4)/(2)'));
  for(const s of ['\\lim_{n\\to\\infty}\\sum_{k=1}^{n}\\frac{1}{}','\\sum_{}^{n}k','\\sum_{k=1}^{}k'])assert.notEqual(translateNewtonLatex(s,notation.normalize).status,'complete');
});
test('unsupported integral, delta and indexed notation is retained, never evaluated or expanded',()=>{
  for(const s of ['\\int_0^1x\\,dx','\\lim_{n\\to\\infty}S_n','\\sum_{k=1}^n x_k\\Delta x'])assert.equal(translateNewtonLatex(s,notation.normalize).input,null);
  assert.equal(newtonToLatex('lim(n->infinity,(1/n)*sum(k=1,n,k))',notation.read).latex,null);
});
