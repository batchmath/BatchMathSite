import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {load,ROOT,plain,contract} from './model.mjs';
import {disclosures} from './exposure.mjs';
const h=load(process.env.FEEDBACK_REF||null),baseline=process.env.FEEDBACK_COMPARE?load(process.env.FEEDBACK_COMPARE):null;
const N=+(process.env.FEEDBACK_SAMPLES||40),out=path.resolve(process.env.FEEDBACK_OUT||'docs/feedback-audit/evidence/audit-current.json');
const catalog=new Map(),configurations=[],leaks=[],numericCandidates=[];let problems=0,parts=0,pairs=0;
for(const config of h.configurations){
 const stats={...config,problems:0,multipart:0,parts:0,topologies:new Set(),leaks:0};
 for(let i=1;i<=N;i++){
  const seed=i*719+config.family.length*31,p=h.make(config,seed),calls=h.calls();problems++;parts+=p.parts.length;
  if(baseline){const before=baseline.make(config,seed);assert.deepEqual(contract(p),contract(before),`${config.family}/${config.tier}/${seed}: non-feedback contract changed`);assert.equal(calls,baseline.calls(),'RNG consumption changed');}
  stats.problems++;stats.parts+=p.parts.length;if(p.parts.length>1)stats.multipart++;
  pairs+=p.parts.length*(p.parts.length-1)/2;
  const shape=p.parts.map(q=>q.control+':'+plain(q.prompt).replace(/-?\d+(?:\.\d+)?/g,'#')).join('|');stats.topologies.add(shape);
  const key=[config.engine,config.family,config.tier,config.calc,p.unit5Meta.region||p.unit5Meta.sub||'',shape].join('/');
  const findings=disclosures(p,h.C);stats.leaks+=findings.leaks.length;
  if(findings.leaks.length)leaks.push({...config,seed,id:p.id,findings:findings.leaks});
  if(findings.candidates.length)numericCandidates.push({...config,seed,id:p.id,findings:findings.candidates});
  if(!catalog.has(key))catalog.set(key,{config,seed,id:p.id,meta:p.unit5Meta,question:plain(p.questionHtml),
   parts:p.parts.map(q=>({prompt:q.prompt,control:q.control,answerTex:q.answerTex,answerKind:q.answer?.kind,rows:q.answer?.rows,choices:q.choices,correctIndex:q.correctIndex,
    explanation:plain(q.explanation),graderHints:(q.answer?.notes||[]).map(n=>({expression:n.expr.tex(q.answer.variable),note:n.note}))})),findings});
 }
 configurations.push({...stats,topologies:stats.topologies.size});
 console.log(config.engine,config.family,config.tier,config.calc,stats.multipart+' multipart',stats.leaks+' disclosures');
}
const report={source:process.env.FEEDBACK_REF||'current branch',samplesPerConfiguration:N,families:h.engines.reduce((n,e)=>n+Object.keys(e.families).length,0),configurations,problems,parts,earlierLaterPairs:pairs,
 confirmedDisclosures:leaks.reduce((n,r)=>n+r.findings.length,0),leakingProblems:leaks.length,leaks,numericCandidates,sequenceCatalog:[...catalog.values()],
 preservationComparison:baseline?'All generated non-feedback contracts and RNG call counts agree with '+process.env.FEEDBACK_COMPARE:null,
 classification:'Complete setups use the unchanged structural grader; labeled expressions use the unchanged expression grader; graph justification flags combine derivative relations and sign/direction semantics. Equal scalar values are contextual candidates, not automatically declared defects.'};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({families:report.families,configurations:configurations.length,problems,parts,earlierLaterPairs:pairs,confirmedDisclosures:report.confirmedDisclosures,numericCandidateProblems:numericCandidates.length,catalog:catalog.size}));
if(process.env.FEEDBACK_REQUIRE_CLEAN&&report.confirmedDisclosures)process.exitCode=1;
