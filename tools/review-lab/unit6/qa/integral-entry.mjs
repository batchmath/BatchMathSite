// v12.9.A Unit 6: every integral-setup part, typed as a student would enter it (the keypad's linear form of the model
// setup), must be graded correct; on calculator problems the same setup with limits rounded to four and to three
// decimals must also be graded correct (one-decimal limits are reported only if accepted with a changed value). Wrong setups must be graded wrong:
// the integrand without its square, the factor pi dropped, the limits reversed, the other variable of integration.
// v12.9.B: also the alternative accepted setups, the excluded correct setups and two engineered same-value integrands.
// Usage: node tools/review-lab/unit6/qa/integral-entry.mjs [count per family=25]
import {load} from './lib.mjs';import {keypadForm} from '../../lib/keypad.mjs';
const N=+(process.argv[2]||25);
const L=load(['unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js']),W=L.W,C=L.C;
const ENG=[[W.BatchMathUnit6Area,'make','FAMILIES'],[W.BatchMathUnit6Area,'makeY','FAMILIES_Y'],[W.BatchMathUnit6Volume,'makeCS','FAMILIES_CS'],[W.BatchMathUnit6Volume,'makeSolid','FAMILIES_SOLID'],[W.BatchMathUnit6FRQ,'make','FAMILIES']];
const kt=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});
const lin=t=>keypadForm(t).replace(/(\d)(pi|sqrt|ln|e\^|[a-z(])/g,'$1*$2');
const typed=(rows,round)=>rows.map(r=>{const lim=t=>round&&/^-?\d*\.\d+$/.test(t)?(+t).toFixed(round):lin(t);return{coef:r.coef?lin(r.coef):'',lower:lim(r.lower),upper:lim(r.upper),integrand:lin(r.integrand),v:r.v};});
const out={setups:0,calculator:0,coarse:0,coarseRejected:0,alts:0,excluded:0,engineered:0,failures:[],wrongAccepted:[]};
for(const [E,mk,FK] of ENG)for(const [fam,f] of Object.entries(E[FK]))for(const kind of ['calculator','non-calculator'])for(const tier of kt(f)[kind==='calculator'?'calculator':'noncalculator'])for(let i=1;i<=N;i++){
 L.seed(i*7919+fam.length*31+tier.length);let p;try{p=E[mk]({family:fam,tier,calc:kind});}catch(e){continue;}
 for(const [j,q] of p.parts.entries()){const a=q.answer;if(a?.kind!=='u6-integral')continue;out.setups++;
  const r0=C.checkIntegral(typed(a.rows,0),a);
  if(!r0.valid||!r0.ok)out.failures.push(`${p.id} [${j}] model setup typed as ${JSON.stringify(typed(a.rows,0))} -> ${JSON.stringify(r0)}`);
  if(a.decimals){out.calculator++;
   for(const pl of [4,3]){const r=C.checkIntegral(typed(a.rows,pl),a);if(!r.ok)out.failures.push(`${p.id} [${j}] ${pl}-decimal limits rejected: ${JSON.stringify(typed(a.rows,pl).map(x=>[x.lower,x.upper]))} ${JSON.stringify(r)}`);}
   // one-decimal limits: counted when rejected (accepted only when the rounding leaves the value within the tolerance,
   // as for an integrand that is 0 where the region's curves meet)
   if(a.rows.some(r=>/^-?\d*\.\d+$/.test(r.lower)||/^-?\d*\.\d+$/.test(r.upper))){out.coarse++;if(!C.checkIntegral(typed(a.rows,1),a).ok)out.coarseRejected++;}
  }
  // v12.9.B: the other accepted setups (the other variable or method) are accepted; correct setups the question
  // excludes are refused; integrands engineered to give the same value (a constant, a linear function) are refused
  for(const alt of a.altRows||[]){out.alts++;const r=C.checkIntegral(typed(alt,0),a);if(!r.ok)out.failures.push(`${p.id} [${j}] alternative setup rejected: ${JSON.stringify(typed(alt,0))} -> ${JSON.stringify(r)}`);}
  for(const oth of a.otherRows||[]){out.excluded++;const r=C.checkIntegral(typed(oth,0),a);if(r.ok)out.wrongAccepted.push(`${p.id} [${j}] excluded setup accepted: ${JSON.stringify(typed(oth,0))}`);}
  {const r0w=a.rows[0],lo=C.readExpr(lin(r0w.lower),null).f(0),hi=C.readExpr(lin(r0w.upper),null).f(0),V=a.value;out.engineered+=2;
   const v=r0w.v,cst=[{coef:'',lower:lin(r0w.lower),upper:lin(r0w.upper),integrand:`${V/(hi-lo)}+0*${v}`,v}],lin1=[{coef:'',lower:lin(r0w.lower),upper:lin(r0w.upper),integrand:`(${2*V/((hi-lo)**2)})*(${v}-(${lo}))`,v}];
   // (skipped where the engineered integrand is the model itself, as for the linear width of a wedge between two lines)
   const asTerms=w=>w.map(x=>({k:1,a:lo,b:hi,v:x.v,f:C.readExpr(x.integrand,x.v).f}));
   for(const [name,w] of [['constant',cst],['linear',lin1]]){if(a.models.some(M=>C.sameSetup(asTerms(w),M))){out.engineered--;continue;}const r=C.checkIntegral(w,a);if(r.ok)out.wrongAccepted.push(`${p.id} [${j}] engineered same-value ${name} integrand accepted`);}}
  // wrong setups
  const base=typed(a.rows,0);
  const wrongs=[['no pi',base.map(r=>({...r,coef:r.coef.replace(/\*?pi/,'')||''}))],['reversed',base.map(r=>({...r,lower:r.upper,upper:r.lower}))],
   ['unsquared',base.map(r=>({...r,integrand:r.integrand.replace(/\^\(2\)/g,'')}))]];
  for(const [name,w] of wrongs){if(JSON.stringify(w)===JSON.stringify(base))continue;const r=C.checkIntegral(w,a);if(r.valid&&r.ok){
   // dropping a square can be harmless only when the squared quantity is the same everywhere; report it for review
   out.wrongAccepted.push(`${p.id} [${j}] ${name}: ${JSON.stringify(w.map(x=>x.integrand))}`);}}
  if(a.variable){const other=base.map(r=>({...r,v:r.v==='x'?'y':'x',integrand:r.integrand.replace(/x/g,'Q').replace(/y/g,'x').replace(/Q/g,'y')}));const r=C.checkIntegral(other,a);if(r.valid&&r.ok)out.wrongAccepted.push(`${p.id} [${j}] other variable accepted`);}
 }}
console.log(JSON.stringify({setups:out.setups,calculator:out.calculator,alternativesAccepted:out.alts,excludedRefused:out.excluded,engineeredSameValueRefused:out.engineered,oneDecimalLimits:`${out.coarseRejected} of ${out.coarse} rejected`,failures:out.failures.length,wrongAccepted:out.wrongAccepted.length},null,1));
console.log(out.failures.slice(0,12).join('\n'));console.log(out.wrongAccepted.slice(0,12).join('\n'));
if(out.failures.length||out.wrongAccepted.length)process.exitCode=1;
