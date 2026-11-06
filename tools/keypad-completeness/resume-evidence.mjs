import fs from 'node:fs';
import assert from 'node:assert/strict';

const key=r=>JSON.stringify([r.route,r.questionId,r.family,r.seed,r.generatorSlug||null,Object.entries(r.selector||{}).sort(([a],[b])=>a.localeCompare(b))]);
export function loadResume(){
 const source=process.env.AUDIT_RESUME||null;
 if(!source)return{source:null,count:0,results:[],has:()=>false,finish(){}};
 assert.ok(!process.env.ALTERNATIVE_ROOTS,'Resume canonical and alternative runs separately');
 const data=JSON.parse(fs.readFileSync(source));assert.equal((data.errors||[]).length,0,'A resumed run must have no page errors');
 assert.ok(!data.results.some(r=>r.passed===false),'Failures must be investigated before resuming');
 const results=data.results.filter(r=>r.passed===true).map(r=>({...r,resumedFrom:source}));
 const prior=new Map(results.map(r=>[key(r),r])),used=new Set();assert.equal(prior.size,results.length,'Resume keys must be unique');
 return{source,count:results.length,results,has(r){const id=key(r),old=prior.get(id);if(!old)return false;if(r.requiredAnswer!==undefined)assert.equal(old.requiredAnswer,r.requiredAnswer);used.add(id);return true;},finish(){assert.equal(used.size,prior.size,'Every retained passing case must match the regenerated catalog');}};
}
