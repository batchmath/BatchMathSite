// Unit 5 inventory: for every engine, family and tier, the number of generated problems, how many are
// calculator-active, how many distinct problems appear, and which answer kinds and tolerances they use.
// Usage: node tools/review-lab/unit5/qa/inventory.mjs [N per family and tier]
import {load} from './lib.mjs';
const N=+(process.argv[2]||300);
const ENG=[['basic-first-order-differential-equations','unit5-basic.js','BatchMathUnit5Basic'],['motion-problems','unit5-motion.js','BatchMathUnit5Motion'],['slope-fields','unit5-slope-fields.js','BatchMathUnit5Slope'],['separable-differential-equations','unit5-separable.js','BatchMathUnit5Separable'],['exponential-growth-and-decay-interest-newton-s-law-of-cooling','unit5-growth.js','BatchMathUnit5Growth'],['rate-problems','unit5-rate.js','BatchMathUnit5Rate']];
for(const [slug,file,glob] of ENG){
 const L=load([file]);const eng={...L.W[glob],families:L.W[glob].FAMILIES};console.log(`\n== ${slug}`);
 for(const [fam,f] of Object.entries(eng.families)){
  for(const tier of f.tiers){let calc=0;const ids=new Set(),kinds={},tols={};let fails=0;
   for(let i=1;i<=N;i++){L.seed(i*7717+tier.length);let p;try{p=eng.make({family:fam,tier});}catch(e){fails++;continue;}
    if(p.unit5Meta.tier!==tier||p.unit5Meta.family!==fam)kinds['MISMATCH']=(kinds['MISMATCH']||0)+1;
    if(p.calculatorActive)calc++;ids.add(p.id);for(const q of p.parts){const k=q.answer?.kind||q.control;kinds[k]=(kinds[k]||0)+1;if(q.answer?.tolerance!==undefined)tols[q.answer.tolerance]=(tols[q.answer.tolerance]||0)+1;}}
   console.log(`${fam.padEnd(22)} ${tier.padEnd(13)} w=${String(f.weight).padStart(2)} calc ${String(calc).padStart(4)}/${N} distinct ${String(ids.size).padStart(4)} fails ${fails} kinds ${JSON.stringify(kinds)} tol ${JSON.stringify(tols)}`);}}}
