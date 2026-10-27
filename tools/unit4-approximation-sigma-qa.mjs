#!/usr/bin/env node
// Focused independent mathematical QA for the three v12.8.J Unit 4 engines.
// No generated report is checked into the website; stdout is the current run.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'assets/ap-topic-generators.js'),'utf8');
let state=0x128abcdef;
function random(){state=(state+0x6D2B79F5)|0;let t=Math.imul(state^(state>>>15),1|state);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;}
const box={window:{BatchMathRNG:{random}},console};vm.createContext(box);vm.runInContext(source,box);
const get=slug=>box.window.BatchMathAPTopicGenerators.get(slug);
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
function Q(a,b=1n){a=BigInt(a);b=BigInt(b);if(b<0n){a=-a;b=-b;}const d=gcd(a,b);return[a/d,b/d];}
const add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),sub=(a,b)=>add(a,[-b[0],b[1]]),div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]);
const from=a=>Q(a[0],a[1]),number=a=>Number(a[0])/Number(a[1]),zero=()=>Q(0),sum=xs=>xs.reduce(add,zero());
const near=(a,b,context)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${context}: ${a} != ${b}`);
function exactNumber(e){let out=0;for(const[k,c]of Object.entries(e)){let atom=1;for(const part of k.split('*').filter(Boolean)){if(part==='pi')atom*=Math.PI;else if(part.startsWith('sqrt'))atom*=Math.sqrt(Number(part.slice(4)));else if(part.startsWith('ln'))atom*=Math.log(Number(part.slice(2)));else throw Error('Unknown exact atom '+part);}out+=c[0]/c[1]*atom;}return out;}
const poly=(coeff,x)=>coeff.reduceRight((a,c)=>add(mul(a,x),from(c)),zero());
function evaluate(f,x){if(f.coeff)return number(poly(f.coeff,x));const t=number(x);if(f.family==='logarithmic')return number(from(f.A))*(number(from(f.offset))+Math.log(t));if(f.family==='rational')return number(from(f.offset))+number(from(f.A))/(t+f.shift)**f.power;if(f.family==='trigonometric')return number(from(f.offset))+number(from(f.A))*Math[f.trig](Math.PI*t);throw Error('Unknown function');}
const inc=(map,key)=>map[key]=(map[key]||0)+1;
const stats={};
function nValue(p,n){const N=Q(n);return sum(Object.entries(p).map(([power,c])=>{const k=Number(power),term=Q(BigInt(n)**BigInt(Math.abs(k)));return k<0?div(from(c),term):mul(from(c),term);}));}
function sigma(p){
 const d=p.unit4Meta,choices=d.choiceValues;assert.equal(d.kind,'sigma');assert.equal(p.choices.length,4);assert.equal(new Set(p.choices).size,4);
 const selected=choices[p.correctIndex],text=[p.questionHtml,p.explanation,...p.choices].join(' ');
 assert.ok(!/(?:^|[^\d])1k|[kn]\^\{1\}|[kn]\^1(?!\d)|\\frac\{[^{}]+\}\{1\}/.test(text),'Bad sigma simplification');assert.ok(/<ol class="u4-work">/.test(p.explanation));
 const finite=(coeff,a,b)=>{const out=[];for(let k=a;k<=b;k++)out.push(poly(coeff,Q(k)));return out;};
 if(d.family==='read'){
  if(d.symbolic)assert.equal(selected,d.answer);
  else{const terms=finite(d.coeff,d.lower,d.upper).map(number);let answer;
   if(d.task==='expand')answer=terms;
   else if(d.task==='index')answer='k';
   else if(d.task==='first')answer=terms[0];else if(d.task==='last')answer=terms.at(-1);
   else if(d.task==='count')answer=d.upper-d.lower+1;else answer=d[d.task];
   assert.deepEqual(JSON.parse(JSON.stringify(selected)),answer,'Reading sigma notation');
  }
 }else if(d.family==='numerical')assert.equal(selected,number(sum(finite(d.coeff,d.lower,d.upper))),'Finite sum');
 else if(d.family==='write'){
  const expected=finite(d.coeff,d.lower,d.upper).map(number);
  choices.forEach((c,i)=>assert.equal(JSON.stringify(finite(c.coeff,c.lower,c.upper).map(number))===JSON.stringify(expected),i===p.correctIndex,'Writing sigma notation'));
 }else{
  const trials=[1,2,3,5,8,11];
  function actual(n){
   if(d.family==='identities')return sum(finite(d.coeff,1,n));
   if(d.subtype==='constant')return mul(Q(n),div(from(d.constant),Q(BigInt(n)**BigInt(d.power))));
   if(d.original){const {polynomial,a,width}=d.original;return sum(Array.from({length:n},(_,i)=>mul(poly(polynomial,add(Q(a),Q(width*(i+1),n))),Q(width,n))));}
   return sum(Array.from({length:n},(_,i)=>sum(d.coeff.map((c,p)=>div(mul(from(c),Q(BigInt(i+1)**BigInt(p))),Q(BigInt(n)**BigInt(p+1)))))));
  }
  trials.forEach(n=>{assert.deepEqual(nValue(d.expected,n),actual(n),'Independent symbolic sum at n='+n);assert.deepEqual(nValue(selected.npoly,n),actual(n),'Correct symbolic choice');});
  choices.forEach((c,i)=>{assert.ok(c.npoly);const equivalent=trials.every(n=>{const a=nValue(c.npoly,n),b=actual(n);return a[0]===b[0]&&a[1]===b[1];});assert.equal(equivalent,i===p.correctIndex,'Equivalent symbolic distractor');});
  if(d.original){for(const n of [2,5,9])for(let k=1;k<=n;k++){const original=mul(poly(d.original.polynomial,add(Q(d.original.a),Q(d.original.width*k,n))),Q(d.original.width,n)),expanded=sum(d.coeff.map((c,p)=>div(mul(from(c),Q(BigInt(k)**BigInt(p))),Q(BigInt(n)**BigInt(p+1)))));assert.deepEqual(original,expanded,'Substituted sample-point expansion');}}
 }
 const s=stats.sigma||(stats.sigma={total:0,family:{},subtype:{}});s.total++;inc(s.family,d.family);inc(s.subtype,`${d.family}/${d.subtype}`);
}
function approximation(p){
 const d=p.unit4Meta;assert.ok(d,'Missing shared Unit 4 metadata');
 assert.ok(p.choices.length===4&&p.correctIndex>=0&&p.correctIndex<4);
 assert.equal(new Set(p.choices).size,4,'Repeated choice text');
 const text=[p.questionHtml,p.explanation,...p.choices].join(' ');
 assert.ok(!/midpoint-endpoint|\\int_-|(?:^|[^\d])1k|[xkn]\^\{1\}|[xkn]\^1(?!\d)/.test(text),'Unwanted notation '+p.id);
 assert.ok(!/\.\d{5}/.test(text),'Unexpected decimal approximation');
 const ends=d.ends.map(from),mids=ends.slice(0,-1).map((x,i)=>div(add(x,ends[i+1]),Q(2))),widths=ends.slice(0,-1).map((x,i)=>sub(ends[i+1],x));
 assert.equal(ends.length,d.n+1);
 widths.forEach((w,i)=>{assert.ok(number(w)>0);assert.deepEqual(from(d.widths[i]),w);});
 if(d.uniform)widths.forEach(w=>assert.deepEqual(w,widths[0]));else assert.ok(new Set(widths.map(w=>w.join('/'))).size>1);
 const data=new Map(d.rows.map(r=>[from(r.x).join('/'),r.y]));
 const at=x=>{const e=data.get(x.join('/'));assert.ok(e,'Missing required sample '+x.join('/'));if(d.f)near(exactNumber(e),evaluate(d.f,x),'Independent function evaluation');return exactNumber(e);};
 const needed=[...ends,...((d.mode==='midpoint'||d.mode==='matched')?mids:[])];needed.forEach(at);
 if(d.extraData)assert.ok(d.rows.length>new Set(needed.map(x=>x.join('/'))).size,'Flagged extra data is not extra');
 const unit=d.f?.family==='trigonometric'?Math.PI:1;
 const left=widths.reduce((s,w,i)=>s+unit*number(w)*at(ends[i]),0),right=widths.reduce((s,w,i)=>s+unit*number(w)*at(ends[i+1]),0),trap=widths.reduce((s,w,i)=>s+unit*number(w)*(at(ends[i])+at(ends[i+1]))/2,0);
 near(exactNumber(d.answers.left),left,'Left sum');near(exactNumber(d.answers.right),right,'Right sum');near(exactNumber(d.answers.trapezoid),trap,'Trapezoids');
 if(d.answers.midpoint){const mid=widths.reduce((s,w,i)=>s+unit*number(w)*at(mids[i]),0);near(exactNumber(d.answers.midpoint),mid,'Midpoint sum');}
 // Independently compare exact rational answers, not just floating values.
 if(!d.f||d.f.coeff||d.f.family==='rational'){
  const rationalAt=x=>{if(!d.f)return from(data.get(x.join('/'))['']||[0,1]);if(d.f.coeff)return poly(d.f.coeff,x);const u=add(x,Q(d.f.shift)),den=d.f.power===1?u:mul(u,u);return add(from(d.f.offset),div(from(d.f.A),den));};
  const result=xs=>sum(xs.map((x,i)=>mul(widths[i],rationalAt(x))));
  for(const[mode,xs]of [['left',ends.slice(0,-1)],['right',ends.slice(1)],...(d.answers.midpoint?[['midpoint',mids]]:[])])assert.deepEqual(from(d.answers[mode]['']||[0,1]),result(xs),'Exact rational '+mode);
  assert.deepEqual(from(d.answers.trapezoid['']||[0,1]),div(add(result(ends.slice(0,-1)),result(ends.slice(1))),Q(2)),'Exact rational trapezoids');
 }
 if(d.error){
  assert.ok(d.f,'Error claim from arbitrary table alone');const useSecond=['midpoint','trapezoid'].includes(d.mode);let signs=[];
  for(let j=1;j<100;j++){const x=number(ends[0])+(number(ends.at(-1))-number(ends[0]))*j/100,t=d.f?.family==='trigonometric'?x*Math.PI:x;let derivative;
   if(d.f.coeff){const coeff=d.f.coeff.map(c=>c[0]/c[1]),ds=coeff.slice(1).map((c,i)=>c*(i+1)),dds=ds.slice(1).map((c,i)=>c*(i+1));derivative=(useSecond?dds:ds).reduceRight((a,c)=>a*x+c,0);}
   else if(d.f.family==='rational'){const A=d.f.A[0]/d.f.A[1],u=x+d.f.shift,k=d.f.power;derivative=useSecond?k*(k+1)*A/u**(k+2):-k*A/u**(k+1);}
   else if(d.f.family==='logarithmic'){const A=d.f.A[0]/d.f.A[1];derivative=useSecond?-A/x**2:A/x;}
   else derivative=useSecond?-d.f.A[0]/d.f.A[1]*Math[d.f.trig](t):d.f.A[0]/d.f.A[1]*(d.f.trig==='sin'?Math.cos(t):-Math.sin(t));
   if(Math.abs(derivative)>1e-9)signs.push(Math.sign(derivative));
  }
  assert.ok(signs.length&&new Set(signs).size===1,'Error rule not valid on full interval');const sign=signs[0],over=d.mode==='midpoint'?sign<0:d.mode==='trapezoid'?sign>0:d.mode==='left'?sign<0:sign>0;assert.equal(d.error.over,over,'Incorrect over/underestimate');
 }
 const expected=d.mode==='matched'?['left','right','midpoint'].map(m=>exactNumber(d.answers[m])):[exactNumber(d.answers[d.mode])],selected=d.choiceValues[p.correctIndex];
 (Array.isArray(selected)?selected:[selected]).forEach((v,i)=>near(exactNumber(v),expected[i],'Correct answer choice'));
 assert.ok(/<ol class="u4-work">/.test(p.explanation),'Missing vertical worked solution');
 const s=stats[d.kind]||(stats[d.kind]={total:0,representation:{},family:{},mode:{},n:{},tableSpacing:{},extra:0,errors:0,cross:{}});s.total++;inc(s.representation,d.representation);inc(s.family,d.family);inc(s.mode,d.mode);inc(s.n,d.n);if(d.representation==='table'){inc(s.tableSpacing,d.uniform?'equal':'unequal');if(d.extraData)s.extra++;}if(d.error)s.errors++;inc(s.cross,`${d.family}/${d.mode}/${d.n}`);
}
const sample=Number(process.env.BM_U4_QA_SAMPLES||12000),requested=process.argv.slice(2),slugs=requested.length?requested:['rectangular-approximations','trapezoidal-approximations','introduction-to-sigma-notation'];
for(const slug of slugs){for(let i=0;i<sample;i++){const p=get(slug)();if(p.unit4Meta?.kind==='sigma')sigma(p);else approximation(p);}console.log('PASS',slug,sample);}
for(const s of Object.values(stats).filter(s=>s.representation)){const ratio=s.representation.table/s.total;assert.ok(ratio>.47&&ratio<.53,'Representation not approximately 50/50');}
if(stats.sigma)for(const[family,target]of Object.entries({read:.2,numerical:.1,write:.15,identities:.25,riemann:.3}))assert.ok(Math.abs(stats.sigma.family[family]/stats.sigma.total-target)<.025,'Sigma weighting '+family);
// With identical RNG state, filtered review must produce the exact same object.
for(const[mode,slug]of [['rect','rectangular-approximations'],['trap','trapezoidal-approximations'],['sigma','introduction-to-sigma-notation']]){
 if(!slugs.includes(slug))continue;
 for(let i=0;i<200;i++){state=128000+i;const focused=get(slug)();state=128000+i;const review=get('unit-4-comprehensive')({unit4Mode:mode});assert.equal(JSON.stringify(review),JSON.stringify(focused),'Comprehensive Review diverged: '+mode);}
 console.log('PASS shared Comprehensive Review inheritance',mode,200);
}
console.log(JSON.stringify(stats,null,2));
if(process.env.BM_U4_QA_OUTPUT)fs.writeFileSync(process.env.BM_U4_QA_OUTPUT,JSON.stringify({ok:true,samplePerEngine:sample,stats},null,2)+'\n');
