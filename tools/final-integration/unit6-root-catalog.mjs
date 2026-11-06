// Reproduce the original-checker witnesses used by unit6-roots.mjs.
import fs from 'node:fs';
import {load} from '../review-lab/unit6/qa/lib.mjs';
import {indexedRootAlternative} from '../keypad-completeness/accepted-alternatives.mjs';
import {batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
import {translateIntegralSetup} from '../../assets/mathlive/integral-setup.mjs';
const L=load(['unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js']);
const W=L.W,C=L.C;
const engines=[['BatchMathUnit6Area','make','FAMILIES'],['BatchMathUnit6Area','makeY','FAMILIES_Y'],['BatchMathUnit6Volume','makeCS','FAMILIES_CS'],['BatchMathUnit6Volume','makeSolid','FAMILIES_SOLID'],['BatchMathUnit6FRQ','make','FAMILIES']];
const kt=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});
const out={problems:0,rootCandidates:0,acceptedRootRepresentations:[],canonicalNthRoots:[]};
for(const [name,method,registry] of engines)for(const [family,f] of Object.entries(W[name][registry]))for(const calc of ['calculator','non-calculator'])for(const tier of kt(f)[calc==='calculator'?'calculator':'noncalculator'])for(let i=0;i<12;i++) {
 const seed=i*7919+family.length*31+tier.length;L.seed(seed);let q;
 try{q=W[name][method]({family,tier,calc});}catch{continue;}out.problems++;
 for(const [partIndex,p] of q.parts.entries()) {
  const id={name,method,family,calc,tier,seed,questionId:q.id,partIndex,control:p.control};
  if(p.answer?.kind==='u6-integral')for(const [rowIndex,row] of p.answer.rows.entries()) {
   const alternative=indexedRootAlternative(row.integrand,'latex');if(!alternative)continue;out.rootCandidates++;
   const rows=p.answer.rows.map((r,j)=>({...r,integrand:j===rowIndex?batchmathToLatex(alternative).latex:r.integrand}));
   const tex=rows.map((r,j)=>(j&&!r.coef?.startsWith('-')?'+':'')+(r.coef||'')+`\\int_{${r.lower}}^{${r.upper}}(${r.integrand})\\,d${r.v}`).join('');
   const translated=translateIntegralSetup(tex),parsed=C.parseSetup(translated.input);
   const grade=parsed.error?{valid:false}:C.checkIntegral(parsed.rows,p.answer);
   if(grade.valid&&grade.ok)out.acceptedRootRepresentations.push({...id,rowIndex,canonical:row.integrand,alternative,rows});
  }
  if(p.control==='u6-expr') {
   const raw=p.answerTex.replace(/^.*?=/,''),alternative=indexedRootAlternative(raw,'latex');if(!alternative)continue;out.rootCandidates++;
   const grade=C.checkExpr(alternative,p.answer);
   if(grade.valid&&grade.ok)out.acceptedRootRepresentations.push({...id,canonical:raw,alternative});
  }
  if(/\\sqrt\[[3-9]/.test(p.answerTex||''))out.canonicalNthRoots.push({...id,answerTex:p.answerTex});
 }
}
fs.writeFileSync('docs/final-integration/evidence/unit6/root-contract-catalog.json',JSON.stringify(out,null,2)+'\n');
console.log({problems:out.problems,rootCandidates:out.rootCandidates,accepted:out.acceptedRootRepresentations.length,canonicalNth:out.canonicalNthRoots.length});
