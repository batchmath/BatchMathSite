// v12.8.Q focused QA: FTC and Integral Rules worked explanations are self-consistent.
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sb={window:{},console};vm.createContext(sb);vm.runInContext(fs.readFileSync(process.env.GEN||path.join(root,'assets/ap-topic-generators.js'),'utf8'),sb);
let seed=2026;sb.window.BatchMathRNG={random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32}};
const G=sb.window.BatchMathAPTopicGenerators,errors=[];
const toJs=e=>e.replace(/\^/g,'**').replace(/\b(sin|cos|tan|sec|ln|exp)\(/g,'F.$1(');
const F={sin:Math.sin,cos:Math.cos,tan:Math.tan,sec:x=>1/Math.cos(x),ln:Math.log,exp:Math.exp};
const evalAt=(e,x)=>new Function('F','x',`return ${toJs(e)}`)(F,x);
const eqs=h=>[...h.matchAll(/<div class="u4-work-equation[^"]*">\\\(\\displaystyle ([\s\S]*?)\\\)<\/div>/g)].map(m=>m[1]);
const counts={ftc:{},rules:{}};
// ---- FTC ----
for(let i=0;i<1500;i++){
 const p=G.get('fundamental-theorem-of-calculus')(),d=p.unit4Meta,fam=p.variant;counts.ftc[fam]=(counts.ftc[fam]||0)+1;
 const ex=p.stage1.unit4Answer.expression,tex=p.stage1.explanation;
 const xs=p.unit4Meta.family==='both_transcendental'||/tan/.test(ex)?[-.2,-.1,.05,.15]:[-.9,-.3,.4,.8,1.3];
 for(const x of xs){const lo=d.rawLower,up=d.rawUpper;let a,b;try{a=evalAt(up,x)-evalAt(lo,x);b=evalAt(ex,x);}catch(e){errors.push('ftc eval '+e.message+' '+up+' | '+lo);break;}
  if(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)>1e-8*(1+Math.abs(b)))errors.push(`ftc mismatch ${fam} x=${x}: ${a} vs ${b}`);}
 for(const bad of [/\\cdot 1(?![0-9.])/,/(?<![0-9a-z{^.])1\\cdot/,/\\left\(\\left\([^()]*\\right\)\\right\)/,/\d \d/,/\\left\(\\right\)/,/\(\)/,/\+-/,/--/]){if(bad.test(tex))errors.push('ftc tex hygiene '+bad+' :: '+tex.match(new RegExp('.{0,60}'+bad.source+'.{0,40}'))?.[0]);}
 for(const need of ['Apply the FTC','Substitute'])if(!tex.includes(need))errors.push('ftc missing '+need);
 const last=eqs(tex).at(-1);if(!last.startsWith("H'(x)="))errors.push('ftc last line '+last);
}
// ---- Rules ----
const num=s=>{const t=s.replace(/\s/g,'').replace(/(\d|\))\(/g,'$1*(').replace(/\)(\d)/g,')*$1');if(!/^[-+*()0-9]+$/.test(t))return null;try{return new Function(`return ${t}`)();}catch{return null;}};
for(let i=0;i<4000;i++){
 const p=G.get('combining-integral-rules')(),fam=p.variant;counts.rules[fam]=(counts.rules[fam]||0)+1;
 const tex=p.stage1.explanation,ans=p.unit4Meta.answer;
 assert.equal(Object.values(p.stage1.unit4Answer.value)[0][0]*1,ans);
 {const chain=[];for(const line of eqs(tex)){const segs=line.split('=').map(t=>t.trim());
   if(segs[0]===p.unit4Meta.target)segs.slice(1).forEach(sg=>{const n=num(sg);if(n!==null)chain.push([n,line]);});}
  const ok=chain.length===0||chain.every(([n])=>n===ans);if(!ok)errors.push(`rules arithmetic ${fam}: ${chain.filter(([n])=>n!==ans).map(c=>c[1]).join(' || ')}`);
  if(fam!=='zero_width'&&chain.length<2)errors.push('rules chain too short '+fam);} const lines=eqs(tex);const lastNum=num(lines.at(-1).split('=').at(-1));if(lastNum!==ans&&lastNum!==null)errors.push(`rules final ${fam}: ${lines.at(-1)} != ${ans}`);
 for(const need of ['Rule','Original integral','Apply','Why it works','Answer'])if(!tex.includes(need)&&!(need==='Apply'&&/Apply|Identify/.test(tex)))errors.push('rules missing '+need+' '+fam);
 if(/NaN|undefined|\(\)/.test(tex))errors.push('rules tex junk '+fam);
}
console.log(JSON.stringify({ok:!errors.length,counts,errors:errors.slice(0,15),errorCount:errors.length},null,1));process.exit(errors.length?1:0);
