// v12.8.Y: every surviving family keeps X's problems. For each engine, family, calculator kind and tier, the problem
// made with the same seed is identical to final X's (question, parts, answers, explanations), except the two families
// Y changes on purpose: Basic calc_value (fraction coefficients; y-basic-calc.mjs) and Motion calc_distance
// (total-distance explanation; y-motion.mjs). Retired families (Basic calc_initial, calc_two_point) must be gone.
// Also counts slope-field vertical targets and Separable radical_branch problems among the identical problems. Usage: node tools/review-lab/unit5/qa/y-unchanged.mjs <X tree> [N]
import path from 'node:path';import {load} from './lib.mjs';
const [XTREE,NS='60']=process.argv.slice(2);const N=+NS;
if(!XTREE){console.error('usage: y-unchanged.mjs <X tree> [N]');process.exit(2);}
const XLIB=await import(path.join(path.resolve(XTREE),'tools/review-lab/unit5/qa/lib.mjs'));
const ENG=[['unit5-basic.js','BatchMathUnit5Basic'],['unit5-motion.js','BatchMathUnit5Motion'],['unit5-slope-fields.js','BatchMathUnit5Slope'],['unit5-separable.js','BatchMathUnit5Separable'],['unit5-growth.js','BatchMathUnit5Growth'],['unit5-rate.js','BatchMathUnit5Rate']];
const CHANGED={BatchMathUnit5Basic:['calc_value'],BatchMathUnit5Motion:['calc_distance']},RETIRED={BatchMathUnit5Basic:['calc_initial','calc_two_point']};
const KT=F=>F.calc||(F.calculator?{calculator:F.tiers,noncalculator:[]}:{calculator:[],noncalculator:F.tiers});
const fails=[];let same=0,verticals=0,branch=0;const lines=[];
for(const [file,g] of ENG){const XL=XLIB.load([file]),YL=load([file]);const X=XL.W[g],Y=YL.W[g];let n=0;
 for(const r of RETIRED[g]||[])if(r in Y.FAMILIES)fails.push(`${g}: retired ${r} still registered`);
 for(const [fam,F] of Object.entries(X.FAMILIES)){if((RETIRED[g]||[]).includes(fam)||(CHANGED[g]||[]).includes(fam))continue;
  if(!(fam in Y.FAMILIES)){fails.push(`${g}: family ${fam} missing`);continue;}
  if(JSON.stringify({w:F.weight,t:F.tiers,c:KT(F)})!==JSON.stringify({w:Y.FAMILIES[fam].weight,t:Y.FAMILIES[fam].tiers,c:KT(Y.FAMILIES[fam])}))fails.push(`${g}/${fam}: weight or tiers changed`);
  for(const kind of ['calculator','non-calculator'])for(const tier of KT(F)[kind==='calculator'?'calculator':'noncalculator'])for(let i=1;i<=N;i++){
   const seed=i*7919+tier.length*31+fam.length;XL.seed(seed);const x=X.make({calc:kind,family:fam,tier});YL.seed(seed);const y=Y.make({calc:kind,family:fam,tier});n++;
   if(JSON.stringify(x)!==JSON.stringify(y)){fails.push(`${g}/${fam}/${tier}/${kind} seed ${seed}: differs from X`);continue;}same++;
   if(g==='BatchMathUnit5Slope')verticals+=(JSON.stringify(y).match(/"vertical":true/g)||[]).length;
   if(fam==='radical_branch')branch++;}}
 lines.push(`${g.replace('BatchMathUnit5','')}: ${n} problems compared`);}
console.log(lines.join('\n'));console.log(`identical to X ${same}; slope-field vertical targets seen ${verticals}; Separable radical_branch problems identical ${branch}; failures ${fails.length}`);
if(fails.length)console.log(fails.slice(0,20).join('\n'));process.exitCode=fails.length||!verticals?1:0;
