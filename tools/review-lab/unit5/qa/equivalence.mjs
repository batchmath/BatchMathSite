// Acceptance of equivalent answers and rejection of plausible wrong ones, across every Unit 5 answer format.
// Function answers: SymPy rewrites (equiv_variants.py: expanded, factored, combined, logs and exponentials
// recombined) must all be accepted. Intervals: inequality notation, "infinity" spelled out, U or ∪ for unions.
// Numbers: units, a dollar sign and thousands separators, extra decimal places. Lists: any order, "t =" labels.
// Wrong answers that must be rejected: sign errors, an added constant, decimal approximations of exact values,
// closed brackets where the endpoint is excluded, missing list items.
// Usage: node tools/review-lab/unit5/qa/equivalence.mjs [N=300]   (needs python3 with sympy)
import {load} from './lib.mjs';import {spawnSync} from 'node:child_process';import path from 'node:path';import {fileURLToPath} from 'node:url';
const N=+(process.argv[2]||300);const HERE=path.dirname(fileURLToPath(import.meta.url));
const ENG=[['basic-first-order-differential-equations','unit5-basic.js'],['motion-problems','unit5-motion.js'],['separable-differential-equations','unit5-separable.js'],
 ['exponential-growth-and-decay-interest-newton-s-law-of-cooling','unit5-growth.js'],['rate-problems','unit5-rate.js'],['slope-fields','unit5-slope-fields.js']];
const T={};const tally=(k,ok)=>{T[k]=T[k]||{pass:0,fail:0,ex:[]};T[k][ok?'pass':'fail']++;};const fails=[];
const fnRecs=[];const parts=[];let seq=0;
for(const [slug,file] of ENG){const L=load([file]),gen=L.G.get(slug);
 for(let i=1;i<=N;i++){L.seed(i*1597);const p=gen({});for(const part of p.parts){if(!part.answer)continue;const key=`k${seq++}`;parts.push({L,p,part,key});
  if(['ivp','function'].includes(part.answer.kind))fnRecs.push({id:key,expr:part.answer.expression});}}}
// SymPy variants for function answers
const py=spawnSync('python3',['-I',path.join(HERE,'equiv_variants.py')],{input:fnRecs.map(r=>JSON.stringify(r)).join('\n'),encoding:'utf8',maxBuffer:256*1024*1024});
const variants={};for(const line of (py.stdout||'').split('\n'))if(line.trim()){const r=JSON.parse(line);variants[r.id]=r.variants;}
const sub=(s,v)=>v==='t'?s.replace(/(?<![a-z])x(?![a-z])/g,'t'):v==='theta'?s.replace(/(?<![a-z])x(?![a-z])/g,'θ'):s;
for(const {L,p,part,key} of parts){const a=part.answer,A=L.A;const chk=(raw,label,expect)=>{const r=A.check(raw,a);const ok=expect?r.ok===true:r.ok===false;tally(`${a.kind}: ${label}`,ok);if(!ok&&fails.length<25)fails.push(`${p.id} ${a.kind} ${label}: ${raw} -> ${JSON.stringify(r)}`);};
 if(a.kind==='ivp'||a.kind==='function'){
  for(const v of variants[key]||[])chk(sub(v,a.variable),'SymPy-equivalent form accepted',true);
  chk(sub(`(${a.expression})+1`,a.variable),'plus a constant rejected',false);
  if(Math.abs(A.value(A.parse(a.expression,'x'),a.x0??0))>1e-6)chk(sub(`-(${a.expression})`,a.variable),'negated rejected',false);}
 else if(a.kind==='numeric'){const v=a.value,k=a.places,C=L.W.BatchMathUnit5Core,r=C.fix(v,k),sc=C.roundScaled(v,k); // v12.8.X: correctly rounded values only
  chk(k?`${r}00`:`${r}.00`,'rounded value with trailing zeros accepted',true);
  if(a.money){chk(`$${Number(r).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`,'dollar sign and commas accepted',true);}
  else{const unit=(part.answerTex.match(/minutes|hours|years|days/)||[''])[0];if(unit)chk(`${r} ${unit}`,'rounded value with a unit word accepted',true);}
  if(Math.abs(v)>0&&k>0&&Math.abs(v)<1)chk(r.replace(/^(-?)0\./,'$1.'),'leading decimal point accepted',true);
  chk(C.scaledText(sc+1,k),'next rounded value up rejected',false);chk(C.scaledText(sc-1,k),'next rounded value down rejected',false);
  const raw=v.toFixed(k+3);if(C.roundScaled(Number(raw),k)===sc&&/[1-9]/.test(raw.slice(-3)))chk(raw,'unrounded value (more digits) rejected',false);
  if(sc!==0)chk(C.scaledText(-sc,k),'wrong sign rejected',false);}
 else if(a.kind==='exact'){const v=typeof a.value==='number'?a.value:NaN;if(!Number.isFinite(v))continue;
  if(Math.abs(v*1000-Math.round(v*1000))>1e-6)chk(v.toFixed(3),'rounded decimal of a non-terminating exact value rejected',false);
  if(Math.abs(v*1e6-Math.round(v*1e6))<1e-6)chk(String(v),'terminating decimal of the exact value accepted',true);
  if(Math.abs(v)>1e-9)chk(String(-v),'negated rejected',false);}
 else if(a.kind==='interval'){const ps=a.parts||[{left:a.left,right:a.right,lc:a.lc,rc:a.rc}];const val=e=>typeof e==='number'?e:/infinity/.test(String(e))?(String(e).startsWith('-')?-Infinity:Infinity):A.value(A.parse(String(e),null),0);
  const fmt=x=>x===Infinity?'infinity':x===-Infinity?'-infinity':a.places!==undefined?L.W.BatchMathUnit5Core.fix(x,a.places):String(Number(x.toFixed(9))); // v12.8.X: calculator endpoints are entered rounded
  const vals=ps.map(q=>[val(q.left),val(q.right)]);const vv=a.variable==='t'?'t':a.variable==='theta'?'θ':a.variable==='y'?'y':'x';
  chk(vals.map(([l,r],k)=>`${ps[k].lc?'[':'('}${fmt(l)}, ${fmt(r)}${ps[k].rc?']':')'}`).join(' ∪ '),'decimal endpoints with ∪ accepted',true);
  if(vals.length===1){const [l,r]=vals[0],q=ps[0];const ineq=l===-Infinity&&r===Infinity?null:l===-Infinity?`${vv}${q.rc?'<=':'<'}${fmt(r)}`:r===Infinity?`${vv}${q.lc?'>=':'>'}${fmt(l)}`:`${fmt(l)}${q.lc?'<=':'<'}${vv}${q.rc?'<=':'<'}${fmt(r)}`;
   if(ineq)chk(ineq,'inequality notation accepted',true);
   if(Number.isFinite(l)&&!q.lc&&!a.anyBrackets)chk(`[${fmt(l)}, ${fmt(r)}${q.rc?']':')'}`,'closed bracket at an excluded endpoint rejected',false);
   if(Number.isFinite(l))chk(`(${fmt(l-0.5)}, ${fmt(r)})`,'wrong endpoint rejected',false);}}
 else if(a.kind==='list'&&a.values.length){chk([...a.values].reverse().map(v=>`t = ${v}`).join(', '),'reordered with labels accepted',true);
  if(a.values.length>1)chk(String(a.values[0]),'missing value rejected',false);}}
let bad=0;for(const [k,v] of Object.entries(T).sort()){console.log(`${v.fail?'FAIL':'ok  '}  ${k}: ${v.pass} passed${v.fail?`, ${v.fail} failed`:''}`);bad+=v.fail;}
if(py.status!==0)console.log('SymPy variant generation failed:',py.stderr.slice(0,400));
console.log(fails.slice(0,25).join('\n'));process.exitCode=bad?1:0;
