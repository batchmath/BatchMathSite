#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const errors=[];const notes=[];
function hashSeed(value){let h=2166136261>>>0;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}h+=h<<13;h^=h>>>7;h+=h<<3;h^=h>>>17;h+=h<<5;return h>>>0;}
function rng(seed){let state=hashSeed(seed)||0x6d2b79f5;return()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function elem(value=''){return {value,innerHTML:'',textContent:'',className:'',disabled:false,style:{display:''},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},focus(){},classList:{add(){},remove(){},contains(){return false;},toggle(){}}};}
function scriptsFromHtml(html){return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!(/\bsrc\s*=/.test(m[1]))).map(m=>m[2]);}
function generatorScript(html){const found=scriptsFromHtml(html).filter(s=>s.includes('function makeProblem')&&s.includes('const generators='));if(found.length!==1)throw new Error(`Expected one generator script, found ${found.length}`);return found[0];}
function generateLimit(category,count){
 const file=path.join(ROOT,'ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html');
 const code=generatorScript(fs.readFileSync(file,'utf8')),generated=[];
 const elements={category:elem(category),question:elem(),answer:elem(),submit:elem(),next:elem(),feedback:elem(),'topic-name':elem(),'correct-count':elem('0'),attempted:elem('0')};
 const random=rng(`v1063g:${category}`),winListeners={};
 const doc={getElementById:id=>elements[id]||(elements[id]=elem()),addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};
 const window={BMAnalytics:{ensurePracticeStarted(){},problemGenerated(p){generated.push(structuredClone(p));},answerChecked(){},solutionRevealed(){}},MathJax:null,addEventListener:(t,fn)=>{winListeners[t]=fn;},BatchMathCalculusKeypad:null};
 const sandbox={window,document:doc,BatchMathRNG:{random},console,Math,structuredClone,setTimeout:()=>0,clearTimeout:()=>{},location:{},navigator:{}};
 vm.createContext(sandbox);vm.runInContext(code,sandbox,{timeout:5000});winListeners.load?.();
 const next=elements.next.listeners.click;if(typeof next!=='function')throw new Error('next handler missing');
 while(generated.length<count)next();return generated;
}
const subs=generateLimit('substitution',20000);let shifted=0,k5=0,grouped=0;
for(const p of subs){const m=String(p.id).match(/^sub-shifted-cuberoot-(\d+)-(-?\d+)-(\d+)$/);if(!m)continue;shifted++;const k=+m[1],a=+m[2],coef=+m[3];if(k===5)k5++;const q=String(p.q||'');if(coef>1&&a!==0){const xa=a>0?`x-${a}`:`x+${-a}`;if(!q.includes(`${coef}(${xa})`))errors.push(`Ungrouped shifted cube-root numerator for ${p.id}: ${q}`);else grouped++;}}
if(!shifted)errors.push('No clean_shifted_cube_root problems generated');if(!k5)errors.push('No k=5 shifted cube-root problems generated');
notes.push(`Shifted cube-root substitution samples: ${shifted}; k=5 samples: ${k5}; grouped nontrivial numerators checked: ${grouped}`);
const infs=generateLimit('infinity',30000);const seen=new Set();
for(const p of infs){const id=String(p.id);const m=id.match(/^i(\d+)-/);if(m)seen.add(+m[1]);if(/[\f\v]|(^|[^\\])(?:frac\{|ln\(|toinfty)/.test(`${p.q} ${p.sol}`))errors.push(`Malformed infinity display: ${id}`);}
for(let i=8;i<=15;i++)if(!seen.has(i))errors.push(`New infinity family i${i} did not generate`);
notes.push(`Infinity families seen: ${[...seen].sort((a,b)=>a-b).join(', ')}`);
const dcomp=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html'),'utf8');
for(const token of [',\"Use the chain rule.',',\"Use the chain rule more than once.',",'Use all needed derivative rules.",',\"Use logarithmic differentiation.',',\"Find dy/dx by implicit differentiation.'])if(dcomp.includes(token))errors.push(`Method-hint prompt remains in derivative comprehensive review: ${token}`);
if(!/generatorVersion:"8"/.test(dcomp))errors.push('Derivative comprehensive generatorVersion is not 8');
const concept=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-2-derivatives/topics/comprehensive-review/conceptual-practice/index.html'),'utf8');
if(!/generatorVersion:"4"/.test(concept))errors.push('Derivative conceptual review generatorVersion is not 4');
const shared=fs.readFileSync(path.join(ROOT,'assets/ap-topic-practice.js'),'utf8');
if(!/mixedMath=current\.choicesAreText/.test(shared)||!shared.includes("typeset([$('feedback')])"))errors.push('Shared topic-practice MathJax feedback/choice handling is missing');
const css=fs.readFileSync(path.join(ROOT,'assets/site.css'),'utf8');
if(!/\.bm-practice-label\{[^}]*white-space:normal!important/.test(css))errors.push('Practice-button labels are not allowed to wrap');
const review=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/index.html'),'utf8');
for(const rel of ['../../resources/assignments/15-unit-1-homework-packet.pdf','../../resources/answer-keys/15-unit-1-homework-packet-answers.pdf'])if(!review.includes(rel))errors.push(`Unit 1 comprehensive review missing link ${rel}`);
for(const rel of ['ap-calculus/unit-1-limits-continuity/resources/assignments/15-unit-1-homework-packet.pdf','ap-calculus/unit-1-limits-continuity/resources/answer-keys/15-unit-1-homework-packet-answers.pdf'])if(!fs.existsSync(path.join(ROOT,rel)))errors.push(`Missing bundled PDF ${rel}`);
const lines=['BatchMath v10.6.3.G targeted patch QA',`Result: ${errors.length?'FAIL':'PASS'}`,...notes,`Errors: ${errors.length}`,...errors.slice(0,100).map(e=>`- ${e}`),''];
fs.writeFileSync(path.join(ROOT,'qa-results/v1063g-targeted-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
