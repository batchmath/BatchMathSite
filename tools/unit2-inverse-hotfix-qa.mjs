import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {definesInverse} from './inverse-prompt-contract.mjs';
const ROOT=path.resolve(new URL('../',import.meta.url).pathname),baseline='0bf61ebd86ae0da06d9f9e4f580ab9b3d386a81a';
// Reuse the production derivative suite's VM loader and seeded RNG verbatim.
const suite=fs.readFileSync(path.join(ROOT,'tools/derivative-topic-enhancements-qa.mjs'),'utf8');
const helpers=suite.slice(suite.indexOf('function hashSeed'),suite.indexOf('// Both handwritten'));
const results=[];
for(const [topic,label] of [['comprehensive-review','comprehensive review'],['derivatives-of-inverse-functions','focused inverse engine']]){
 const rel=`ap-calculus/unit-2-derivatives/topics/${topic}/practice/index.html`,file=path.join(ROOT,rel);
 const before=execFileSync('git',['show',baseline+':'+rel],{cwd:ROOT,encoding:'utf8'});
 function loader(old){
  const io=new Proxy(fs,{get(target,key){if(key==='readFileSync')return(f,...args)=>String(f)===file&&old?before:fs.readFileSync(f,...args);return target[key];}});
  const context=vm.createContext({fs:io,path,vm,ROOT,console});vm.runInContext(helpers+';globalThis.api={exposePage,rng};',context);
  return context.api;
 }
 const a=loader(true),b=loader(false),old=a.exposePage(rel,['inverseFunc'],label),current=b.exposePage(rel,['inverseFunc'],label);
 const row={topic,samples:500,oldAssertionFailures:0,falsePositives:0,ambiguous:0,currentFailures:0,allNonPromptContractsPreserved:true,families:{}};
 for(let i=0;i<500;i++){
  const seed=`inverse-prompt-${label}:${i}`;old.BatchMathRNG.random=a.rng(seed);current.BatchMathRNG.random=b.rng(seed);
  const p=JSON.parse(JSON.stringify(old.QA.inverseFunc())),q=JSON.parse(JSON.stringify(current.QA.inverseFunc()));
  const formerFailure=!p.q.includes('are inverses')&&!p.q.includes('g=f^{-1}');
  if(formerFailure){row.oldAssertionFailures++;row[definesInverse(p.q)?'falsePositives':'ambiguous']++;}
  if(!definesInverse(q.q))row.currentFailures++;
  const family=q.id.match(/^iv(?:[12]|-exp|-log|-table)/)[0];
  row.families[family]??={count:0,before:p.q,after:q.q};row.families[family].count++;
  delete p.q;delete q.q;assert.deepEqual(q,p,seed);
 }
 assert.equal(Object.keys(row.families).length,5);assert.equal(row.currentFailures,0);results.push(row);
}
assert.deepEqual(results.map(r=>[r.oldAssertionFailures,r.falsePositives,r.ambiguous]),[[400,218,182],[0,0,0]]);
fs.writeFileSync(path.join(ROOT,'docs/unit2-hotfix/evidence/inverse-before-after.json'),JSON.stringify({baseline,results},null,2)+'\n');
console.log('PASS: exact 400 = 218 false positives + 182 ambiguities; 1,000 generated non-prompt contracts preserved; all five families in both engines');
