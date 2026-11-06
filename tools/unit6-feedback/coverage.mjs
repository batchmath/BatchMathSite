import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load,BASE,contract} from './model.mjs';
import {disclosures} from './exposure.mjs';
const current=load(),before=load(BASE),rows=[];
const N=+(process.env.FEEDBACK_MODE_SAMPLES||8);
for(const config of current.configurations){
 const engine=current.engines.find(e=>e.key===config.engine);
 const modes=['mixed',...Object.entries(engine.modes).filter(([,m])=>config.family in m.families&&(!Array.isArray(m.families[config.family])||m.families[config.family].includes(config.tier))).map(([k])=>k)];
 for(const mode of modes)for(let i=1;i<=N;i++){
  const seed=i*1223+config.family.length;
  const p=current.make(config,seed,{mode}),calls=current.calls(),q=before.make(config,seed,{mode});
  assert.deepEqual(contract(p),contract(q));assert.equal(calls,before.calls());
  assert.deepEqual(disclosures(p,current.C).leaks,[],`${config.family}/${mode}/${seed}`);
  rows.push({scope:'topic-mode',...config,mode,seed,id:p.id,parts:p.parts.length});
 }
 for(const mode of ['mixed','short','frq_region','frq_graph'])for(const topic of current.W.BatchMathUnit6Review.topicsFor(config.calc,mode==='mixed'?null:mode)){
  const [families,only]=topic.src();if(!(config.family in families)||only&&!(config.family in only))continue;
  const sourceEngine=current.engines.find(e=>e.families===families);if(sourceEngine?.key!==config.engine)continue;
  if(Array.isArray(only?.[config.family])&&!only[config.family].includes(config.tier))continue;
  for(let i=1;i<=N;i++){
   const seed=i*1949+config.family.length;
   const p=current.makeReview(config,seed,topic.key,mode),calls=current.calls(),q=before.makeReview(config,seed,topic.key,mode);
   assert.deepEqual(contract(p),contract(q));assert.equal(calls,before.calls());
   assert.equal(p.unit6Review.reviewTopic,topic.key);assert.equal(p.unit5Meta.family,config.family);
   assert.deepEqual(disclosures(p,current.C).leaks,[],`${topic.key}/${config.family}/${mode}/${seed}`);
   rows.push({scope:'review-wrapper',...config,mode,topic:topic.key,seed,id:p.id,parts:p.parts.length});
  }
 }
}
const result={samplesPerCombination:N,topicModeProblems:rows.filter(r=>r.scope==='topic-mode').length,reviewWrapperProblems:rows.filter(r=>r.scope==='review-wrapper').length,allNonFeedbackContractsAndRngCountsMatchE:true,allFutureDisclosureChecksPass:true,rows};
fs.writeFileSync('docs/feedback-audit/evidence/modes-and-reviews.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({topicModeProblems:result.topicModeProblems,reviewWrapperProblems:result.reviewWrapperProblems,total:rows.length}));
