// v12.9.C Unit 6 integral setups through the new single-field path, without a browser: each setup is written as the
// LaTeX a MathLive field holds, translated by assets/mathlive/integral-setup.mjs, read by unit6-core parseSetup and
// graded by the unchanged structural checker (checkIntegral). For every integral-setup part of every family and tier:
//   the model setup (as one expression: coefficients, limits, integrands, dx/dy, sums) is accepted, also with
//   reversed limits and a minus sign, expanded into separate terms, and (calculator) with limits rounded to 3 places;
//   listed alternatives (the other variable or method) are accepted; excluded correct setups are refused with the
//   method note; same-value impostors (a constant, a rescaled integrand) are refused; common mistakes are refused.
// Malformed entries get a message instead of a grade. Usage: node tools/review-lab/unit6/qa/setup-pipeline.mjs [n=12]
import {load} from './lib.mjs';
import {translateIntegralSetup} from '../../../../assets/mathlive/integral-setup.mjs';
const N=+(process.argv[2]||12);
const L=load(['unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js']);L.ctx.console={...console,warn(){}};
const W=L.W,C=L.C;
const ENG=[[W.BatchMathUnit6Area,'make','FAMILIES'],[W.BatchMathUnit6Area,'makeY','FAMILIES_Y'],[W.BatchMathUnit6Volume,'makeCS','FAMILIES_CS'],[W.BatchMathUnit6Volume,'makeSolid','FAMILIES_SOLID'],[W.BatchMathUnit6FRQ,'make','FAMILIES']];
const kt=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});
// rows (TeX pieces) -> one LaTeX expression as a student would write it
const latex=(rows,{reverse=false,round=0}={})=>rows.map((r,i)=>{
 let lo=r.lower,up=r.upper;if(round){const f=t=>/^-?\d*\.\d+$/.test(t)?(+t).toFixed(round):t;lo=f(lo);up=f(up);}
 const coef=r.coef&&r.coef!=='1'?r.coef:'',neg=coef.startsWith('-');let c=neg?coef.slice(1):coef,sign=neg?'-':'+';
 if(reverse){[lo,up]=[up,lo];sign=sign==='-'?'+':'-';}
 return (i===0&&sign==='+'?'':sign)+c+`\\int_{${lo}}^{${up}}\\left(${r.integrand}\\right)\\,d${r.v}`;}).join('');
const grade=(tex,a,max=3)=>{const t=translateIntegralSetup(tex),p=C.parseSetup(t.input);if(p.error)return{valid:false,message:p.error,linear:t.input};
 if(p.rows.length>max)return{valid:false,message:'too many integrals'};return{...C.checkIntegral(p.rows,a),linear:t.input};};
const out={setups:0,accepted:0,reversed:0,rounded:0,alternatives:0,excludedRefused:0,impostorsRefused:0,mistakesRefused:0,malformedMessages:0,failures:[],wrongAccepted:[]};
const fail=m=>{if(out.failures.length<40)out.failures.push(m);};
for(const [E,mk,FK] of ENG)for(const [fam,f] of Object.entries(E[FK]))for(const kind of ['calculator','non-calculator'])for(const tier of kt(f)[kind==='calculator'?'calculator':'noncalculator'])for(let i=0;i<N;i++){
 L.seed(i*7919+fam.length*31+tier.length);let p;try{p=E[mk]({family:fam,tier,calc:kind});}catch(e){continue;}
 for(const [j,q] of p.parts.entries()){const a=q.answer;if(a?.kind!=='u6-integral')continue;out.setups++;const max=q.maxIntegrals||3,id=`${p.id} [${j}]`;
  const r0=grade(latex(a.rows),a,max);if(r0.valid&&r0.ok)out.accepted++;else fail(`${id} model refused: ${latex(a.rows)} -> ${r0.linear} -> ${JSON.stringify(r0).slice(0,200)}`);
  const r1=grade(latex(a.rows,{reverse:true}),a,max);if(r1.valid&&r1.ok)out.reversed++;else fail(`${id} reversed refused: ${JSON.stringify(r1).slice(0,160)}`);
  if(a.decimals&&a.rows.some(r=>/^-?\d*\.\d+$/.test(r.lower+'')||/^-?\d*\.\d+$/.test(r.upper+''))){const r2=grade(latex(a.rows,{round:3}),a,max);if(r2.valid&&r2.ok)out.rounded++;else fail(`${id} 3-place limits refused: ${JSON.stringify(r2).slice(0,160)}`);}
  for(const alt of a.altRows||[]){const r=grade(latex(alt),a,max);if(r.valid&&r.ok)out.alternatives++;else fail(`${id} alternative refused: ${latex(alt)} -> ${JSON.stringify(r).slice(0,160)}`);}
  for(const oth of a.otherRows||[]){const r=grade(latex(oth),a,max);if(r.valid&&!r.ok)out.excludedRefused++;else if(r.ok)out.wrongAccepted.push(`${id} excluded accepted: ${latex(oth)}`);}
  // impostors with the right value: a constant integrand, and the model integrand rescaled onto [0, 1]
  const R=a.rows[0],v=R.v,V=a.value;
  // (skipped when the "impostor" is itself the model setup, as for a wedge whose width is linear on [0, 1])
  const model=C.parseSetup(translateIntegralSetup(latex(a.rows)).input).rows,same=(rows)=>rows.length===1&&model.length===1&&rows[0].v===model[0].v&&[0.21,0.5,0.83].every(z=>{
   const lo=C.readExpr(model[0].lower,null).f(0),hi=C.readExpr(model[0].upper,null).f(0);if(Math.abs(lo)>1e-12||Math.abs(hi-1)>1e-12)return false;
   const k=C.readExpr(model[0].coef||'1',null).f(0),g=C.readExpr(model[0].integrand,v).f(z),h=C.readExpr(rows[0].integrand,v).f(z);return Math.abs(k*g-h)<1e-9;});
  for(const tex of [`\\int_{0}^{1}${V.toFixed(10)}\\,d${v}`,`\\int_{0}^{1}${(2*V).toFixed(10)}${v}\\,d${v}`]){const r=grade(tex,a,max);
   if(r.valid&&!r.ok)out.impostorsRefused++;else if(r.ok&&same(C.parseSetup(translateIntegralSetup(tex).input).rows))out.impostorsEqualToModel=(out.impostorsEqualToModel||0)+1;else if(r.ok)out.wrongAccepted.push(`${id} impostor accepted: ${tex}`);}
  // a common mistake for disks/washers: (R - r)^2, and the missing pi
  if(a.rows.length===1&&/\\pi/.test(R.coef||'')&&!/2\\pi/.test(R.coef)){const r=grade(`\\int_{${R.lower}}^{${R.upper}}\\left(${R.integrand}\\right)\\,d${v}`,a,max);if(r.valid&&!r.ok)out.mistakesRefused++;else if(r.ok)out.wrongAccepted.push(`${id} missing pi accepted`);}
 }}
// malformed entries: a message, never a grade
const anyA={kind:'u6-integral',value:1,models:[],rows:[]};
for(const [tex,want] of [['',/Enter an integral/],['\\int_{0}^{1}x^2',/dx or dy/],['\\int_{}^{1}x\\,dx',/lower and the upper limit/],['\\int_{0}^{1}\\,dx',/integrand/],['3x+1',/definite integral/],['2+\\int_0^1x\\,dx',/Every term must be an integral/],['\\int_0^1x\\,dx\\cdot 2',/in front of it/],['\\int_0^1x\\,dt',/dx or dy/],['\\int_{\\placeholder{}}^{\\placeholder{}}\\placeholder{}',/limit/]]){
 const t=translateIntegralSetup(tex),p=C.parseSetup(t.input);if(p.error&&want.test(p.error))out.malformedMessages++;else fail(`malformed ${JSON.stringify(tex)} -> ${t.input} -> ${JSON.stringify(p).slice(0,140)}`);}
console.log(JSON.stringify(out,null,1));if(out.failures.length||out.wrongAccepted.length)process.exitCode=1;
