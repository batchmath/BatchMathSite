import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {engine,routes,answer,root,rng} from './unit1-engine.mjs';import {batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';import {translateLimit} from '../../assets/mathlive/unit1-contracts.mjs';
const report=[];
for(const route of routes)test('Unit 1 checker '+route.path,()=>{
 const e=engine(route),summary={route:route.path,families:[],modes:[],questions:0,pairs:0};
 if(route.kind==='location'){for(const [index,family]of e.qa.families.entries())for(let seed=1;seed<=10;seed++){e.b.BatchMathRNG={random:rng(seed*719)};const p=family();for(const point of p.points){const raw=point.x+'/1',modern=translateLimit(batchmathToLatex(raw).latex);assert.equal(e.b.BMUnit1UI.parse(modern.input).value,point.x);assert.notEqual(e.b.BMUnit1UI.parse('1234567').value,point.x);summary.pairs++;}summary.questions++;if(!summary.families.includes(p.variant))summary.families.push(p.variant);}report.push(summary);return;}
 const modes=[...e.html.matchAll(/<option\b[^>]*value="([^"]*)"/g)].map(m=>m[1]);const iterations=route.kind==='advanced'?e.qa.families.map(f=>({name:f.id,build:()=>({...f.make(),family:f})})):modes.length?modes.map(mode=>({name:mode,build:i=>e.make(i*719,mode)})):[{name:'mixed',build:i=>e.make(i*719)}];
 for(const it of iterations){summary.modes.push(it.name);for(let i=1;i<=(route.kind==='advanced'?10:200);i++){
  const p=it.build(i);summary.questions++;const f=p.family?.id||p.infinityVariant||p.problemVariant||p.variant||p.data?.family||p.cat;if(!summary.families.includes(f))summary.families.push(f);if(p.choices)continue;
  const raw=answer(p);assert.equal(e.check(p,raw).ok,true,p.id+': '+raw);
  for(const s of [raw,'1234567','','1/0','(1)/()',raw+'+0']){const t=batchmathToLatex(s),r=t.latex===null?{input:null}:translateLimit(t.latex),modern=r.input??(s?'?':'');assert.deepEqual(e.check(p,modern),e.check(p,s),p.id+': '+s+' -> '+modern);summary.pairs++;}
 } }report.push(summary);
});
process.on('exit',()=>fs.writeFileSync(root+'tools/mathlive-sitewide/artifacts/unit1-node.json',JSON.stringify(report,null,2)+'\n'));
