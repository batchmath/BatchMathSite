import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {engine,root,rng,slugs} from './engine.mjs';
import {translateAdvancedExpression,batchmathToLatex,parseInput} from '../../assets/mathlive/answer-adapter.mjs';
const w=engine(),summary=[],found=new Set(),variables=new Set(),functions=new Set();
function visit(n){if(!n)return;if(n.type==='call')functions.add(n.name);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(x=>x&&typeof x==='object'&&visit(x));else if(v&&typeof v==='object')visit(v);}}
export const families=['product','powers_y','log_rational','trig','exp_y','radical_branch'];
export const stems=['kxyq','kxy','lin','yx','y2','y3','xy','cbrt','sqrty','y2x','lnxy','xlnx','cos2','y2sin','cosxy','xsin','tany','exmy','quad','xey','eyt','cosesin','circ','shift','xpb','expsq'];
for(const family of families)test('Separable '+family+': 500 actual IVPs, particular-solution parity and native intervals',()=>{
  const gen=w.BatchMathAPTopicGenerators.get(slugs.separable),check=w.BatchMathUnit5Answers.check,tiers=new Set();let pairs=0;
  for(let i=1;i<=500;i++){
    w.BatchMathRNG={random:rng(i*173+family.length*47)};const p=gen({family}),spec=p.parts[0].answer;tiers.add(p.unit5Meta.tier);found.add(p.id.split('-')[2]);variables.add(spec.variable);
    const variable=spec.variable==='theta'?'θ':spec.variable,raw=spec.expression.replace(/\bx\b/g,variable);visit(parseInput(raw).tree);
    const translated=translateAdvancedExpression(p.parts[0].answerTex);assert.equal(translated.status,'complete',`${p.id}: ${p.parts[0].answerTex}: ${translated.message}`);assert.equal(check(translated.input,spec).ok,true,`${p.id}: ${translated.input}`);
    for(const value of [raw,`(${raw})+1`,`(${raw})+0`,raw+'+C','(1)/()']){
      const latex=batchmathToLatex(value).latex;assert.notEqual(latex,null,value);const t=translateAdvancedExpression(latex);assert.notEqual(t.input,null,value);assert.deepEqual(check(t.input,spec),check(value,spec),p.id+': '+value);pairs++;
    }
    assert.equal(check(raw+'+C',spec).ok,false);
    const interval=p.parts[1].answer,valid=`(${interval.left},${interval.right})`;assert.equal(check(valid,interval).ok,true,p.id+': '+valid);
    assert.notEqual(check(`[${interval.left},${interval.right}]`,interval).ok,true);
  }
  assert.deepEqual([...tiers].sort(),[...w.BatchMathUnit5Separable.FAMILIES[family].tiers].sort());summary.push({family,samples:500,gradingPairs:pairs,tiers:[...tiers].sort()});
});
test('all six preserved families, every subtype and variable form are exercised',()=>{
  assert.deepEqual([...found].sort(),[...stems].sort());assert.deepEqual([...variables].sort(),['t','theta','x']);
  fs.writeFileSync(root+'tools/mathlive-advanced-pilot/artifacts/separable-math.json',JSON.stringify({families:summary,subtypes:[...found].sort(),variables:[...variables].sort(),functions:[...functions].sort(),weights:w.BatchMathUnit5Separable.weights},null,2)+'\n');
});
