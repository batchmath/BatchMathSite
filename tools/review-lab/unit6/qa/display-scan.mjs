// v12.9.B Unit 6 display scan: generates problems from every Unit 6 page and Practice Type (seeded) and reports, in the
// displayed text (question, formulas, prompts, answers, explanations, choices):
//   parens   a whole right-hand side in redundant outer parentheses, such as x = (1 - y^2)
//   one      a coefficient of 1 written out: 1x, 1\sin x, 1\ln x, 1e^{x}, 1\left(...), 1\sqrt{...}, 1\pi
//   calcnote "Use your calculator" on a calculator problem (the badge and the page already say so)
// and, with a second tree (BM_ROOT_B), checks that every problem's answers are identical seed by seed.
// Usage: node tools/review-lab/unit6/qa/display-scan.mjs [count per page and type=60] [other tree to compare]
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
import {ROOT,rng} from './lib.mjs';
const N=+(process.argv[2]||60),OTHER=process.argv[3];
function engines(root){const ctx={window:{},console:{...console,warn(){}},document:{addEventListener(){}},Math};vm.createContext(ctx);ctx.window.BatchMathRNG={random:rng(1)};
 for(const f of ['derivative-expression-checker.js','unit4-exact-answers.js','ap-topic-generators.js','unit5-core.js','unit5-answers.js','unit6-core.js','unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-review.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',f),'utf8'),ctx,{filename:f});
 return{G:ctx.window.BatchMathAPTopicGenerators,seed:s=>{ctx.window.BatchMathRNG={random:rng(s)};}};}
const PAGES=[['area-below-and-between-curves','non-calculator',['mixed','under_curve','between']],['area-below-and-between-curves','calculator',['mixed','under_curve','between']],['finding-area-in-terms-of-y',null,['mixed']],
 ['volume-by-cross-sections','non-calculator',['mixed','perp_x','perp_y']],['volume-by-cross-sections','calculator',['mixed','perp_x','perp_y']],['solids-of-revolution','non-calculator',['mixed','disks_washers','shells']],['solids-of-revolution','calculator',['mixed','disks_washers','shells']],
 ['unit6-comprehensive-review','non-calculator',['mixed','frq_region','frq_graph','short']],['unit6-comprehensive-review','calculator',['mixed','frq_region','short']]];
const mathOf=t=>[...String(t||'').matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g)].map(m=>m[1]??m[2]);
// displayed equations in explanation steps and formulas are also inside \( \) or are bare TeX in step equations
function texts(p){const out=[];const add=(t,where)=>{if(t)out.push([String(t),where]);};
 add(p.questionHtml,'question');for(const q of p.parts||[]){add(q.prompt,'prompt');add(q.answerTex,'answer');add(q.explanation,'explanation');for(const c of q.choices||[])add(c,'choice');}
 if(!p.parts){add(p.explanation,'explanation');for(const c of p.choices||[])add(c,'choice');}return out;}
// whole right-hand side in parentheses: "= \left( ... \right)" ending the math, with nothing after it and balanced inside
function redundantParens(math){const hits=[];for(const seg of math.split(/(?:\\qquad|,\\quad|\\quad)/)){const m=seg.match(/^\s*[a-zA-Z](?:\([a-z]\))?\s*=\s*(\\left\(|\()([\s\S]*)(\\right\)|\))\s*$/);if(!m)continue;
  const inner=m[2];let d=0,ok=true;for(let i=0;i<inner.length;i++){if(inner.startsWith('\\left(',i)||inner[i]==='('){d++;}else if(inner.startsWith('\\right)',i)||inner[i]===')'){d--;if(d<0){ok=false;break;}}}if(ok&&d===0)hits.push(seg.trim());}return hits;}
const ONE=/(^|[^0-9.}^_{a-zA-Z])1(?=\s*(?:[a-zA-Z]|\\(?:sin|cos|tan|sec|csc|cot|ln|log|sqrt|pi|left|frac)\b|\())/;
function scan(p){const found=[];for(const [t,where] of texts(p)){
  const maths=where==='question'||where==='explanation'||where==='prompt'?mathOf(t).concat((t.match(/<div class="u4-formula">\\\(\\displaystyle ([\s\S]*?)\\\)<\/div>/g)||[])):[t];
  for(const m of maths){for(const h of redundantParens(m.replace(/\\displaystyle\s*/,'')))found.push(['parens',where,h]);const o=m.match(ONE);if(o){const i=m.search(ONE);found.push(['one',where,m.slice(Math.max(0,i-25),i+25)]);}}
  if(/Use your calculator/i.test(t)&&p.calculatorActive)found.push(['calcnote',where,t.match(/[^.>]*Use your calculator[^.<]*\.?/i)[0]]);}
 return found;}
const answerKey=p=>JSON.stringify((p.parts||[{answer:{choices:p.choices,correctIndex:p.correctIndex}}]).map(q=>{const a=q.answer||{};return{k:a.kind,v:a.value,vs:a.values,pl:a.places,p:a.parts,var:a.variable,ci:q.correctIndex,nc:q.choices?.length,c:q.control};}));
const A=engines(ROOT),B=OTHER?engines(path.resolve(OTHER)):null;
const counts={parens:0,one:0,calcnote:0},examples={parens:new Map(),one:new Map(),calcnote:new Map()};let n=0,same=0,diff=[];
for(const [slug,calc,modes] of PAGES)for(const mode of modes)for(let i=0;i<N;i++){const s=i*7919+slug.length*31+mode.length+(calc||'').length;
 A.seed(s);let p;try{p=A.G.get(slug)({...(calc?{calc}:{}),mode});}catch(e){console.error(slug,mode,e.message);continue;}n++;
 for(const [k,where,h] of scan(p)){counts[k]++;const key=`${p.variant}|${where}`;if(!examples[k].has(key))examples[k].set(key,h);}
 if(B){B.seed(s);const q=B.G.get(slug)({...(calc?{calc}:{}),mode});if(answerKey(p)===answerKey(q)&&p.variant===q.variant&&(p.parts||[]).length===(q.parts||[]).length)same++;else if(diff.length<5)diff.push(`${slug}/${mode}#${i}: ${p.variant} vs ${q.variant}`);}}
console.log(JSON.stringify({tree:ROOT,problems:n,counts,...(B?{comparedWith:path.resolve(OTHER),identicalAnswers:`${same} of ${n}`,differences:diff}:{})},null,1));
for(const k of Object.keys(examples))for(const [key,h] of examples[k])console.log(k.padEnd(9),key.padEnd(48),h.slice(0,110));
if(counts.parens||counts.one||counts.calcnote||(B&&same!==n))process.exitCode=1;
