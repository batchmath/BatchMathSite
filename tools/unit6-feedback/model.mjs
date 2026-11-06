import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const BASE='6de1b027f45f43285be9fdc98d38d5f49419aecd';
export const FILES=['derivative-expression-checker.js','unit4-exact-answers.js','ap-topic-generators.js','unit5-core.js','unit5-answers.js','unit6-core.js','unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js'];
export function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
export function load(ref=null){
 const W={},ctx={window:W,console,document:{addEventListener(){}},Math};vm.createContext(ctx);
 let calls=0;const seed=(s,prefix=[])=>{calls=0;const random=rng(s),queue=[...prefix];W.BatchMathRNG={random:()=>{calls++;return queue.length?queue.shift():random();}};};seed(1);
 for(const file of FILES){const source=ref?execFileSync('git',['show',ref+':assets/'+file],{cwd:ROOT,encoding:'utf8',maxBuffer:8e6}):fs.readFileSync(path.join(ROOT,'assets',file),'utf8');vm.runInContext(source,ctx,{filename:file});}
 const A=W.BatchMathUnit6Area,V=W.BatchMathUnit6Volume,F=W.BatchMathUnit6FRQ,P=W.BatchMathUnit6Piecewise;
 const engines=[{key:'area',api:'BatchMathUnit6Area',method:'make',families:A.FAMILIES,modes:A.MODES,slug:'area-below-and-between-curves'},
  {key:'area_y',api:'BatchMathUnit6Area',method:'makeY',families:A.FAMILIES_Y,modes:{},slug:'finding-area-in-terms-of-y'},
  {key:'cross_sections',api:'BatchMathUnit6Volume',method:'makeCS',families:V.FAMILIES_CS,modes:V.MODES_CS,slug:'volume-by-cross-sections'},
  {key:'solids',api:'BatchMathUnit6Volume',method:'makeSolid',families:V.FAMILIES_SOLID,modes:V.MODES_SOLID,slug:'solids-of-revolution'},
  {key:'frq',api:'BatchMathUnit6FRQ',method:'make',families:F.FAMILIES,modes:F.MODES,slug:null},
  {key:'piecewise',api:'BatchMathUnit6Piecewise',method:'make',families:P.FAMILIES,modes:{},slug:'integrals-on-piecewise-defined-functions'}];
 const configurations=[];
 for(const engine of engines)for(const [family,f] of Object.entries(engine.families))for(const calc of ['non-calculator','calculator']){
  const tiers=f.calc?f.calc[calc==='calculator'?'calculator':'noncalculator']:(f.calculator===(calc==='calculator')?f.tiers:[]);
  for(const tier of tiers||[])configurations.push({engine:engine.key,api:engine.api,method:engine.method,slug:engine.slug,family,calc,tier});
 }
 function make(config,s,options={}){seed(s);return W[config.api][config.method]({family:config.family,calc:config.calc,tier:config.tier,...options});}
 function reviewPlan(config,topicKey,mode){
  const kind=config.calc==='calculator'?'calculator':'noncalculator',topics=W.BatchMathUnit6Review.topicsFor(config.calc,mode==='mixed'||mode==='all'?null:mode);
  const ti=topics.findIndex(t=>t.key===topicKey);if(ti<0)throw Error('Review topic unavailable: '+topicKey);
  const total=topics.reduce((s,t)=>s+t.w[kind],0),start=topics.slice(0,ti).reduce((s,t)=>s+t.w[kind],0);
  const [fams,only]=topics[ti].src();
  const pool=Object.entries(fams).filter(([k,f])=>{
   if(only&&!(k in only))return false;
   const tiers=f.calc?f.calc[kind]:(f.calculator===(kind==='calculator')?f.tiers:[]);
   return tiers?.includes(config.tier)&&(!Array.isArray(only?.[k])||only[k].includes(config.tier));
  });
  const fi=pool.findIndex(([k])=>k===config.family);if(fi<0)throw Error('Review family unavailable: '+config.family);
  const ft=pool.reduce((s,[,f])=>s+f.weight,0),fs=pool.slice(0,fi).reduce((s,[,f])=>s+f.weight,0);
  return[(start+topics[ti].w[kind]/2)/total,(fs+pool[fi][1].weight/2)/ft];
 }
 function makeReview(config,s,topicKey,mode){seed(s,reviewPlan(config,topicKey,mode));return W.BatchMathUnit6Review.make({calc:config.calc,tier:config.tier,mode});}
 return{W,C:W.BatchMathUnit6Core,engines,configurations,seed,make,reviewPlan,makeReview,calls:()=>calls};
}
export function plain(s){return String(s||'').replace(/<svg\b[\s\S]*?<\/svg>/g,' [figure] ').replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>'})[m]).replace(/\s+/g,' ').trim();}
export function maths(s){return [...plain(s).matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g)].map(m=>(m[1]||m[2]).replace(/\\displaystyle\s*/g,'').trim());}
export function contract(p){
 function clean(v,key=''){
  if(key==='explanation'||key==='afterFeedback')return undefined;
  if(key==='note'||key==='extraNote')return undefined; // feedback prose only; note expressions/values remain exact
  if(typeof v==='function')return v.toString();
  if(v&&typeof v==='object'){
   if(v.constructor?.name==='Map')return [...v].map(([k,x])=>[k,clean(x)]);
   if(Array.isArray(v))return Array.from(v,x=>clean(x));
   return Object.fromEntries(Object.keys(v).sort().map(k=>[k,clean(v[k],k)]).filter(([,v])=>v!==undefined));
  }
  return v;
 }
 const out=clean({...p,id:undefined});
 // Graph justification/location pairs are deliberately reordered. Compare each
 // unchanged answer contract by content; only the generic reason prompt changes.
 if(['graph_derivative','graph_accum'].includes(p.unit5Meta?.family)){
  out.parts=out.parts.map(q=>q.control==='choice'?{...q,prompt:'GRAPH JUSTIFICATION'}:q)
   .sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 }
 return out;
}
