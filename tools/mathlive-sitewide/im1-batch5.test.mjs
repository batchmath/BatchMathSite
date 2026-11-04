import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {routes,valueEngine,algebraEngine,answer,rng,root} from './im1-engine.mjs';
import {im1Value,im1ToLatex,im1PolynomialContract,im1IntervalContract} from '../../assets/mathlive/im1-contracts.mjs';
const records=[],plain=v=>JSON.parse(JSON.stringify(v));
for(const route of routes.filter(r=>r.unit==='unit1'))test('IM1 value '+route.slug,()=>{
 const e=valueEngine(route),modes=[...e.html.matchAll(/<select\b[^>]*id="categorySelect"[^>]*>([\s\S]*?)<\/select>/g)].flatMap(m=>[...m[1].matchAll(/<option\b[^>]*value="([^"]*)"/g)].map(v=>v[1]));
 if(!modes.length)modes.push('default');const record={route:route.path,questions:0,pairs:0,modes,families:[],kindFamilies:[],questionCounts:[]};
 const plans=route.slug==='multiplication'?[...e.html.matchAll(/<select\b[^>]*id="questionSelect"[^>]*>([\s\S]*?)<\/select>/g)].flatMap(m=>[...m[1].matchAll(/<option\b[^>]*value="([^"]*)"/g)].map(v=>({mode:'default',count:Number(v[1]),seeds:2}))):modes.map(mode=>({mode,count:20,seeds:10}));
 for(const plan of plans){const {mode,count}=plan;if(!record.questionCounts.includes(count))record.questionCounts.push(count);for(let seed=1;seed<=plan.seeds;seed++)for(const q of e.generate(seed*719,mode==='default'?null:mode,count)){
  const raw=answer(q);assert.equal(e.check(q,raw).ok,true,route.slug+': '+JSON.stringify(q));record.questions++;if(q.kind&&!record.kindFamilies.includes(q.kind))record.kindFamilies.push(q.kind);const family=q.problemType||q.family||q.kind||q.key?.split('-')[0]||'catalog';if(!record.families.includes(family))record.families.push(family);
  const cases=[raw,'1234567','','1/()',raw+'+0','+'+raw,raw+'.0'];if(typeof q.answer==='object'){cases.push(q.answer.n*2+'/'+q.answer.d*2);cases.push(q.answer.n+'/'+(-q.answer.d));}
  for(const value of cases){const latex=im1ToLatex(value).latex,translated=latex===null?null:im1Value(latex).input;if(latex===null)continue;assert.deepEqual(plain(e.check(q,translated??(value?'?':''))),plain(e.check(q,value)),route.slug+': '+value+' -> '+translated);record.pairs++;}
 }
 }records.push(record);
});
for(const route of routes.filter(r=>r.unit==='unit2'))test('IM1 algebra '+route.slug,()=>{
 const b=algebraEngine(),gen=b.BatchMathIM1Unit2Generators.get(route.slug),families=new Set(),record={route:route.path,questions:0,pairs:0,families:[],typedFamilies:[],retainedChoices:0,templates:[]};
 for(let seed=1;seed<=1200;seed++){b.BatchMathRNG={random:rng(seed*719)};const q=gen();families.add(q.variant);record.questions++;if(!q.kind){record.retainedChoices++;continue;}
  const template=q.kind==='interval'?q.id.match(/^u2-int-solve-([^-]+)/)?.[1]:q.variant;if(template&&!record.templates.includes(template))record.templates.push(template);
  if(!record.typedFamilies.includes(q.variant))record.typedFamilies.push(q.variant);
  const module=q.kind==='polynomial'?b.BatchMathIM1Algebra:q.kind==='equation'?b.BatchMathIM1Equation:b.BatchMathIM1Interval,contract=q.kind==='polynomial'?im1PolynomialContract:q.kind==='interval'?im1IntervalContract:{translate:im1Value,toLatex:im1ToLatex},raw=q.answer;
  assert.equal(module.check(raw,raw).ok,true,q.id);if(q.kind==='equation'){const result=module.parse(raw),m=q.math;if(result.kind==='number')assert.ok(Math.abs((m.A-m.C)*result.value-(m.D-m.B))<1e-7,q.id);else assert.equal(result.kind,m.B===m.D?'all':'none');}
  for(const value of [raw,'1234567','','1/()',raw+'+0',q.kind==='polynomial'?q.answer+'+'+q.variables[0]+'-'+q.variables[0]:q.kind==='equation'?'x='+raw:raw.replace('(', '[')]){
   const tex=contract.toLatex(value).latex;if(tex===null)continue;const out=contract.translate(tex).input??(value?'?':'');
   const a=module.check(value,raw),c=module.check(out,raw);assert.equal(c.ok,a.ok,q.id+': '+value+' -> '+out);assert.equal(c.unsimplified,a.unsimplified);assert.equal(!!c.error,!!a.error);record.pairs++;
  }
 }record.families=[...families];records.push(record);
});
process.on('exit',()=>fs.writeFileSync(root+'tools/mathlive-sitewide/artifacts/im1-batch5-node.json',JSON.stringify(records,null,2)+'\n'));
