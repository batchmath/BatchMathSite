import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {derivatives,root,rng,signature} from '../mathlive-sitewide/reviews-static-engine.mjs';
export {root,rng,signature};
export const reviewPath='ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html';
export const baseline='9c395be1b765366b9459bd8db7af6d5d70468b9d';
export function promptEngine(ref){const target=root+reviewPath,read=fs.readFileSync,source=ref?execFileSync('git',['show',ref+':'+reviewPath],{cwd:root,encoding:'utf8',maxBuffer:8000000}):read(target,'utf8');
 fs.readFileSync=function(file,...args){if(String(file)===target)return source.replace('return {cat,id,q:','return {cat,id,__authoredPrompt:prompt,q:');return read.call(fs,file,...args);};
 try{return derivatives();}finally{fs.readFileSync=read;}}
export const contract=q=>Object.fromEntries(['cat','id','answerExpr','answerTex','solution','vars'].map(k=>[k,JSON.parse(JSON.stringify(q[k]))]));
export function instructionSignature(q){if(q.cat==='difference')return q.cat+':'+q.id.split('-').slice(0,2).join('-');if(q.cat==='basic')return q.cat+':'+q.id.split('-').slice(0,3).join('-');return signature(q);}
export function instructionCases(){const e=promptEngine(process.env.REVIEW_INSTRUCTION_REF),old=promptEngine(baseline),reps=new Map(),changed=new Map();let generated=0;
 const modes=[...e.html.match(/<select[^>]*id="category"[^>]*>([\s\S]*?)<\/select>/)[1].matchAll(/<option[^>]*value="([^"]+)"/g)].map(m=>m[1]);
 for(const mode of modes){e.el('category').value=mode;old.el('category').value=mode;for(let seed=1;seed<=1200;seed++){
  for(const f of[e,old]){f.b.BatchMathRNG.random=rng(seed*719);f.qa.makeProblem();}generated++;
  const q=JSON.parse(JSON.stringify(e.qa.current)),before=JSON.parse(JSON.stringify(old.qa.current));assert.deepEqual(contract(q),contract(before),mode+': '+q.id);
  const key=mode+'|'+instructionSignature(q)+'|'+q.__authoredPrompt;
  if(!reps.has(key))reps.set(key,{q,before,mode,seed:seed*719});if(q.q!==before.q&&!changed.has(key))changed.set(key,{q,before,mode,seed:seed*719});
 }}return{e,old,reps,changed,modes,generated};}
