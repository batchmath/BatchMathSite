#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
let seed=0x10713;const random=()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
const ctx={window:{},BatchMathRNG:{random},console};ctx.window.BatchMathRNG=ctx.BatchMathRNG;vm.createContext(ctx);vm.runInContext(read('assets/unit1-infinity-expansions.js'),ctx);
const api=ctx.window.BMUnit1InfinityExpansions;assert(api&&api.generate&&api.endBehavior);
const legacy=(type,neg)=>({cat:'infinity',id:`i${type}-stub-${neg}`,q:`\\(\\displaystyle\\lim_{x\\to${neg?'-\\infty':'\\infty'}}f(x)\\)`,ans:{kind:'rat',n:0,d:1},sol:'Checked legacy family.'});
const N=100000,groups={},dirs={},rad={all:0,complex:0},variants={},growth=new Set();
for(let i=0;i<N;i++){
 const p=api.generate('mixed',legacy),g=p.infinityGroup;groups[g]=(groups[g]||0)+1;dirs[g]??={positive:0,negative:0};dirs[g][p.approachDirection]++;
 assert(p.q&&p.sol&&p.ans&&!/NaN|undefined/.test(p.q+p.sol),`malformed ${p.id}`);
 if(g==='radicals'){rad.all++;if(p.radicalStructure==='complex')rad.complex++;}
 if(g==='explog')variants[p.infinityVariant]=(variants[p.infinityVariant]||0)+1;
 if(g==='growth')growth.add(p.growthFamily);
}
const pct=g=>groups[g]/N;
assert(pct('rational')>.165&&pct('rational')<.185,`rational ${pct('rational')}`);
assert(pct('radicals')>.24&&pct('radicals')<.26,`radicals ${pct('radicals')}`);
assert(pct('explog')>.315&&pct('explog')<.335,`explog ${pct('explog')}`);
assert(pct('growth')>.19&&pct('growth')<.21,`growth ${pct('growth')}`);
assert(pct('oscillation')>.04&&pct('oscillation')<.06,`oscillation ${pct('oscillation')}`);
for(const[g,d]of Object.entries(dirs)){const share=d.negative/(d.negative+d.positive);assert(share>.485&&share<.515,`${g} negative-direction share ${share}`);}
const complexShare=rad.complex/rad.all;assert(complexShare>.115&&complexShare<.135,`complex radical share ${complexShare}`);
const recipShare=(variants['log-reciprocal']||0)/groups.explog;assert(recipShare>.28,`ln(constant/f) prominence ${recipShare}`);
assert.equal(growth.size,6,'not all six growth-rate families appeared');
for(let i=0;i<100;i++){const p=api.endBehavior();assert(p.choicesHtml&&p.choices.length===3&&p.correctIndex===0);assert(p.q.includes('Find both end limits')&&p.q.includes('end-function'));assert(!/\\\\\(|Bothendlimits/.test(p.choices.join('')));}
const page=read('ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/practice/index.html'),review=read('ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html');
assert(page.includes('Growth-Rate Comparisons')&&page.includes('End Behavior and Horizontal Asymptotes'));assert(!page.includes('Oscillation at Infinity'));assert(review.includes("generate('mixed',infinityLimit)"));
const report={ok:true,samples:N,groupShares:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v/N])),directions:dirs,complexRadicalShare:complexShare,logReciprocalShare:recipShare,growthFamilies:[...growth]};
fs.mkdirSync(path.join(root,'qa-results'),{recursive:true});fs.writeFileSync(path.join(root,'qa-results/unit1-infinity-update-qa.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
