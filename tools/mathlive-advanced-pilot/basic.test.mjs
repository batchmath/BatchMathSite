import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {engine,root,baseline,rng,slugs} from './engine.mjs';
import {translateAdvancedExpression,batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
const w=engine(),weights=w.BatchMathUnit4FinalFour.W.basic;
const families=Array.isArray(weights)?weights.map(x=>x[0]):Object.keys(weights);
export {families};
const results=[];
for(const family of families)test('Basic Integrals: '+family+' — 200 generated questions, actual checker parity',()=>{
  const gen=w.BatchMathAPTopicGenerators.get(slugs.basic),check=w.BatchMathUnit4Answers.check;let pairs=0;
  for(let i=1;i<=200;i++){
    w.BatchMathRNG={random:rng(i*173+family.length)};const p=gen({family}),spec=p.stage1.unit4Answer;
    const raw=spec.expression+(spec.kind==='antiderivative'?'+C':'');
    const latex=translateAdvancedExpression(p.stage1.answerTex);assert.equal(latex.status,'complete',`${p.id}: ${p.stage1.answerTex}: ${latex.message}`);
    assert.equal(check(latex.input,spec).ok,true,`${p.id}: ${latex.input}`);
    for(const value of [raw,`(${spec.expression})+${spec.kind==='antiderivative'?'x+C':'1'}`,`(${raw})+0`,'(1)/()']){
      const imported=batchmathToLatex(value);assert.ok(imported.latex!==null);
      const translated=translateAdvancedExpression(imported.latex);assert.notEqual(translated.input,null);
      assert.deepEqual(check(translated.input,spec),check(value,spec),`${p.id}: ${value} => ${translated.input}`);pairs++;
    }
    if(spec.kind==='antiderivative'){
      const missing=translateAdvancedExpression(batchmathToLatex(spec.expression).latex);
      assert.equal(check(missing.input,spec).ok,false);assert.match(check(missing.input,spec).note,/C/);
    }
  }
  results.push({family,samples:200,gradingPairs:pairs});
});
test('advanced translation preserves constants, precision, roots and unsupported content',()=>{
  for(const [latex,expected] of [['C','C'],['c','c'],['1.00','1.00'],['\\frac{4}{2}','(4)/(2)'],['\\sqrt[3]{x}','root(3,x)'],['x+C','x+C']])assert.equal(translateAdvancedExpression(latex).input,expected);
  assert.equal(translateAdvancedExpression('\\int x').input,null);
  assert.equal(translateAdvancedExpression('x^{}').status,'incomplete');
  assert.equal(translateAdvancedExpression('y=x+C').input,'y=x+C');
  assert.notEqual(translateAdvancedExpression('y=x=2').input,'2');
});
test('production generators, graders and UI renderer are unchanged',()=>{
  for(const name of ['ap-topic-generators.js','unit4-exact-answers.js','derivative-expression-checker.js','ap-topic-practice.js','unit5-separable.js','unit5-answers.js','unit5-ui.js','unit5-core.js','calculus-keypad.js']){
    const old=execFileSync('git',['show',baseline+':assets/'+name],{cwd:root,encoding:'utf8',maxBuffer:8000000});assert.equal(fs.readFileSync(root+'assets/'+name,'utf8'),old,name);
  }
  fs.mkdirSync(root+'tools/mathlive-advanced-pilot/artifacts',{recursive:true});fs.writeFileSync(root+'tools/mathlive-advanced-pilot/artifacts/basic-math.json',JSON.stringify({families:results},null,2)+'\n');
});
