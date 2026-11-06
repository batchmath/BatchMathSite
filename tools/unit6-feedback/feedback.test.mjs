import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {load,ROOT,plain} from './model.mjs';
import {disclosures} from './exposure.mjs';
const h=load(process.env.FEEDBACK_REF||null);
const fixtures=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/unit6-feedback/fixtures.json')));
for(const fixture of fixtures)test(fixture.name+': no completed part supplies a future answer',()=>{
 const p=h.make(fixture.config,fixture.seed);
 const found=disclosures(p,h.C).leaks;
 assert.deepEqual(found,[],JSON.stringify({id:p.id,found}));
 if(fixture.name==='choose_dx_dy'){
  assert.equal(p.parts.length,3);
  assert.ok(h.C.checkIntegral(h.C.parseSetup('int(0,2,3*x-x,x)').rows,p.parts[0].answer).ok);
  assert.ok(h.C.checkIntegral(h.C.parseSetup('int(0,2,y-y/3,y)+int(2,6,2-y/3,y)').rows,p.parts[1].answer).ok);
  assert.match(plain(p.parts[1].explanation),/boundary|boundaries/);
  assert.match(plain(p.parts[1].explanation),/split/);
 }
 if(['washer','shells'].includes(fixture.config.family)){
  assert.ok(p.parts[0].explanation&&p.parts[1].explanation);
  assert.ok(p.parts[2].explanation.includes('\\int'));
 }
 if(fixture.name.startsWith('graph_')){
  const i=p.parts.findIndex(q=>q.control==='choice');
  assert.ok(i>=0&&p.parts[i+1]?.answer?.kind==='list','reason precedes its location exercise');
  assert.match(plain(p.parts[i+1].explanation),/complete written answer/i);
 }
});
