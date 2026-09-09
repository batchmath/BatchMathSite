#!/usr/bin/env node
// Bundle the production engine unchanged; navigation, analytics transport and
// service-worker registration are omitted from the standalone test shell.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=process.argv[2];if(!output)throw Error('Provide an output HTML path.');
const source=fs.readFileSync(path.join(root,'ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/practice/index.html'),'utf8');
const scripts=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const engine=scripts.find(s=>s.includes('const families=[]')),mathConfig=scripts.find(s=>s.includes('window.MathJax=')),config=scripts.find(s=>s.includes('window.BM_ANALYTICS_CONFIG='));
const css=source.match(/<style>([\s\S]*?)<\/style>/)[1];
const body=source.match(/<body>([\s\S]*?)<script>/)[1].replace(/<div class="prototype-note">[\s\S]*?<\/div>/,'').replace(/<a class="brand-mark"[^>]*>([\s\S]*?)<\/a>/,'<span class="brand-mark">$1</span>');
const asset=n=>fs.readFileSync(path.join(root,'assets',n),'utf8');
const pwa=asset('pwa.js'),keyboard=pwa.slice(pwa.indexOf('  // Own advancement'),pwa.indexOf('  if (!state.supported'));
const adapter=`window.BMAnalytics={ensurePracticeStarted(){},answerChecked(){},solutionRevealed(){},problemGenerated(p){window.BatchMathRepro.noteProblem(p);}};`;
const common=`<script>${mathConfig}</script>\n<script src="https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js" defer></script>`;
const logic=`<script>${config}</script>\n<script>${asset('reproducible-rng.js')}</script>\n<script>${asset('answer-normalization.js')}</script>\n<script>${adapter}</script>\n<script>${keyboard}</script>\n<script data-bm-engine="advanced-trig">${engine}</script>`;
const html=`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Advanced Trig Limits — Standalone v10.6.3.S</title><style>${css}</style>${common}</head><body>${body}${logic}</body></html>\n`;
fs.writeFileSync(output,html);
assert.equal(html.match(/<script data-bm-engine="advanced-trig">([\s\S]*?)<\/script>/)[1],engine);
const hash=crypto.createHash('sha256').update(engine).digest('hex');
console.log(JSON.stringify({standalone:path.resolve(output),engineSha256:hash,bytes:Buffer.byteLength(html),identicalEngine:true}));
// Optional conversation preview: the same controller and generator, with scoped
// styles and the same math rendering dependency, inside the conversation sandbox.
if(process.argv[3]){
 const id='batchmath-advanced-trig-preview';
 function scope(css){let out='',pos=0;while(pos<css.length){const start=css.indexOf('{',pos);if(start<0){out+=css.slice(pos);break;}let end=start+1,depth=1;for(;end<css.length&&depth;end++){if(css[end]==='{')depth++;else if(css[end]==='}')depth--;}
  const selector=css.slice(pos,start).trim(),inside=css.slice(start+1,end-1);
  if(selector.startsWith('@'))out+=selector+'{'+scope(inside)+'}';
  else out+=selector.split(',').map(s=>{s=s.trim();return s===':root'||s==='body'?'#'+id:'#'+id+' '+s;}).join(',')+'{'+inside+'}';pos=end;}return out;}
 const preview=`<div id="${id}">${body}</div>\n<style>${scope(css).replace('min-height:100vh;','')}</style>\n${common.replace(' defer','')}\n${logic}\n`;
 fs.writeFileSync(process.argv[3],preview);assert.equal(preview.match(/<script data-bm-engine="advanced-trig">([\s\S]*?)<\/script>/)[1],engine);
}
