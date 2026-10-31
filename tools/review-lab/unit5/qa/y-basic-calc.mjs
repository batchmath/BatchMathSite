// v12.8.Y Basic First-Order Calculator checks (prompt items 2 and 3).
// - Every calculator problem (page pool, every stale Practice Type value, and the Calculator Review's Basic topic)
//   comes from calc_value; the retired families calc_initial and calc_two_point cannot be requested.
// - No scalar stands directly before a stacked fraction (3\frac{…}{…}) in the question or the explanation; every
//   fraction template is seen with every coefficient (1, -1, 2, 3, -2, 4).
// - Against final X (same seed, same family and tier): the answer value is identical, f' evaluates to the same
//   numbers, and the question and explanation are X's with only the derivative's TeX replaced.
// Usage: node tools/review-lab/unit5/qa/y-basic-calc.mjs [N per tier] [X tree]   (the X comparison needs an X tree)
import path from 'node:path';import {load,keypadForm} from './lib.mjs';
const [NS='1500',XTREE]=process.argv.slice(2);const N=+NS;
const XL=XTREE?(await import(path.join(path.resolve(XTREE),'tools/review-lab/unit5/qa/lib.mjs'))).load(['unit5-basic.js']):null;
const YL=load(['unit5-basic.js','unit5-motion.js','unit5-growth.js','unit5-rate.js','unit5-slope-fields.js','unit5-separable.js','unit5-review.js']);
const YB=YL.W.BatchMathUnit5Basic,XB=XL?.W.BatchMathUnit5Basic,R=YL.W.BatchMathUnit5Review,A=YL.A;
const fails=[];const fail=s=>{if(fails.length<40)fails.push(s);fails.n=(fails.n||0)+1;};
const TIERS=['foundational','intermediate','challenging'];
const ADJ=/\d\s*\\(?:d|t)?frac/; // a number directly before a stacked fraction
const formula=p=>(p.questionHtml.match(/\\displaystyle ([a-z])'\(([a-z])\)=(.*?)\\\)/)||[]).slice(1);
// 1. pool, stale values and retired families
let pool=0;const fam={};
for(const tier of [null,...TIERS])for(let i=1;i<=N;i++){YL.seed(i*131+(tier||'').length);const p=YB.make(tier?{calc:'calculator',tier}:{calc:'calculator'});pool++;fam[p.unit5Meta.family]=(fam[p.unit5Meta.family]||0)+1;}
for(const stale of ['calc_initial','calc_two_point','calculator_ftc','calc_value','mixed','poly_power'])for(let i=1;i<=200;i++){YL.seed(i*7+stale.length);let p;try{p=YB.make({calc:'calculator',mode:stale});}catch(e){fail(`stale "${stale}" threw ${e.message}`);break;}if(p.unit5Meta.family!=='calc_value'){fail(`stale "${stale}" gave ${p.unit5Meta.family}`);break;}}
for(const retired of ['calc_initial','calc_two_point']){let threw=false;try{YB.make({calc:'calculator',family:retired});}catch(_){threw=true;}if(!threw)fail(`retired family ${retired} can still be requested`);if(retired in YB.FAMILIES)fail(`${retired} is still registered`);}
for(const f of Object.keys(fam))if(f!=='calc_value')fail(`calculator pool gave ${f} ${fam[f]} times`);
let review=0;for(let i=1;i<=6*N;i++){YL.seed(i*389);const p=R.make({calc:'calculator'});if(p.unit5Meta.reviewTopic==='basic'){review++;if(p.unit5Meta.family!=='calc_value')fail(`Calculator Review gave Basic ${p.unit5Meta.family}`);}}
// 2 and 3. fraction coefficients, and the comparison with X
const combos=new Set();let compared=0,fracProblems=0;
for(const tier of TIERS)for(let i=1;i<=N;i++){const seed=i*977+tier.length;
 YL.seed(seed);const y=YB.make({calc:'calculator',family:'calc_value',tier});let x=y;if(XL){XL.seed(seed);x=XB.make({calc:'calculator',family:'calc_value',tier});}
 const texts=[y.questionHtml,...y.parts.map(q=>q.explanation)];
 if(texts.some(t=>ADJ.test(t)))fail(`${y.id}: number before a fraction: ${texts.find(t=>ADJ.test(t)).match(/.{0,40}\d\s*\\(?:d|t)?frac.{0,30}/)[0]}`);
 const [fy,vy,dy]=formula(y),[,,dx]=formula(x);if(!dy||!dx){fail(`${y.id}: derivative not found`);continue;}
 // the template and coefficient, read from Y's TeX: [-]\frac{[c]numerator}{denominator}[ + linear term]
 {const lead=dy.replace(/[+-]\d*[xt]$/,''),mm=lead.match(/^(-?)\\frac\{(\d*)(.*)\}\{(.*)\}$/);
  if(mm){fracProblems++;const [,sg,c,num,den]=mm;const coef=(sg?-1:1)*(num===''?+c:(c===''?1:+c));const tmpl=`\\frac{${num===''?'1':num}}{${den}}`.replace(new RegExp(`(?<![a-z\\\\])${vy}(?![a-z])`,'g'),'v');combos.add(`${tmpl} × ${coef}`);}}
 if(!XL){compared--;}
 if(y.parts[0].answer.value!==x.parts[0].answer.value)fail(`${y.id}: answer ${y.parts[0].answer.value} vs X ${x.parts[0].answer.value}`);
 // f' evaluates to the same numbers as X's
 try{const ty=A.parse(keypadForm(dy),vy),tx=A.parse(keypadForm(dx),vy);
  for(const z of [0.37,0.81,1.23,1.77,2.29,-0.63,-1.41]){const a=A.value(ty,z),b=A.value(tx,z);if(Number.isFinite(b)&&Math.abs(a-b)>1e-9*Math.max(1,Math.abs(b))){fail(`${y.id}: f' differs at ${z}: ${dy} vs X ${dx}`);break;}}}catch(e){fail(`${y.id}: cannot evaluate ${dy}: ${e.message}`);}
 // same question and explanation as X apart from the derivative's TeX (in x or t, and in s inside the integral)
 const swap=t=>t.split(dx).join(dy).split(dx.replace(new RegExp(`(?<![a-z\\\\])${vy}(?![a-z])`,'g'),'s')).join(dy.replace(new RegExp(`(?<![a-z\\\\])${vy}(?![a-z])`,'g'),'s'));
 if(swap(x.questionHtml)!==y.questionHtml)fail(`${y.id}: question differs from X beyond the derivative`);
 if(swap(x.parts[0].explanation)!==y.parts[0].explanation)fail(`${y.id}: explanation differs from X beyond the derivative`);
 compared++;}
const want=[];for(const t of ['\\frac{\\sin v}{v}','\\frac{e^{v}}{v}','\\frac{1}{\\ln v}','\\frac{1}{1+v^{4}}','\\frac{\\cos v}{1+v^{2}}'])for(const c of ['1','-1','2','3','-2','4'])want.push(`${t} × ${c}`);
const missing=want.filter(w=>!combos.has(w));if(missing.length)fail(`fraction templates × coefficients not seen: ${missing.join('; ')}`);
console.log(`calculator pool problems ${pool} (${Object.entries(fam).map(([k,v])=>`${k} ${v}`).join(', ')}); Calculator Review Basic problems ${review}`);
console.log(`compared with X ${compared}; fraction-bearing ${fracProblems}; template × coefficient combinations ${want.length-missing.length}/${want.length}; failures ${fails.n||0}`);
if(fails.length)console.log(fails.join('\n'));process.exitCode=fails.length?1:0;
