// v12.8.Y Motion check (prompt item 4), against final X with the same seed, family and tier:
// - every non-calculator problem is identical to X (question, parts, answers, explanations);
// - calculator problems are identical except the total-distance part's explanation (one integral of speed) and its
//   |displacement| note; the answer values, rounding and the other parts are unchanged.
// Usage: node tools/review-lab/unit5/qa/y-motion.mjs <X tree> [N per family and tier]
import path from 'node:path';import {load} from './lib.mjs';
const [XTREE,NS='300']=process.argv.slice(2);const N=+NS;
if(!XTREE){console.error('usage: y-motion.mjs <X tree> [N]');process.exit(2);}
const XL=(await import(path.join(path.resolve(XTREE),'tools/review-lab/unit5/qa/lib.mjs'))).load(['unit5-motion.js']);
const YL=load(['unit5-motion.js']);const XM=XL.W.BatchMathUnit5Motion,YM=YL.W.BatchMathUnit5Motion;
const KT=F=>F.calc||(F.calculator?{calculator:F.tiers,noncalculator:[]}:{calculator:[],noncalculator:F.tiers});
const fails=[];let same=0,distParts=0,n=0;
const strip=p=>JSON.stringify({q:p.questionHtml,parts:p.parts.map(x=>({...x,explanation:undefined,answer:{...x.answer,wrongValues:(x.answer?.wrongValues||[]).map(w=>w.value)}}))});
for(const [fam,F] of Object.entries(XM.FAMILIES))for(const calc of ['calculator','non-calculator'])for(const tier of KT(F)[calc==='calculator'?'calculator':'noncalculator'])for(let i=1;i<=N;i++){
 const seed=i*613+tier.length*7+fam.length;XL.seed(seed);const x=XM.make({calc,family:fam,tier});YL.seed(seed);const y=YM.make({calc,family:fam,tier});n++;
 if(calc==='non-calculator'||fam!=='calc_distance'){if(JSON.stringify(x)!==JSON.stringify(y))fails.push(`${fam}/${tier}/${calc} seed ${seed}: differs from X`);else same++;continue;}
 // calc_distance: everything but the total-distance explanation and its |displacement| note is X's
 if(strip(x)!==strip(y)){fails.push(`${y.id}: question, answers or wrong values differ from X`);continue;}
 y.parts.forEach((py,j)=>{const px=x.parts[j];const isDist=/total distance/.test(py.prompt);
  if(!isDist){if(px.explanation!==py.explanation)fails.push(`${y.id}: part ${j+1} explanation changed`);return;}
  distParts++;if(px.answer.value!==py.answer.value||px.answerTex!==py.answerTex)fails.push(`${y.id}: total distance answer changed`);
  if(/Find the sign|Find where the velocity is zero/.test(py.explanation))fails.push(`${y.id}: calculator distance explanation still shows the pieces`);
  if(!py.explanation.includes(`\\approx ${py.answerTex}`))fails.push(`${y.id}: explanation does not end at the answer`);});}
console.log(`problems compared with X ${n}; identical ${same}; calculator total-distance parts re-explained ${distParts}; failures ${fails.length}`);
if(fails.length)console.log(fails.slice(0,20).join('\n'));process.exitCode=fails.length?1:0;
