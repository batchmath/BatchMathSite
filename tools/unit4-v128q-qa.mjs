// P: independently verify region areas, all full semicircular arcs, scope and revised flow.
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const baseline='d29a0d3782398df4e01ae26456a4af3610bb3393';
const rng=seed=>{let x=seed;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/2**32;};};
function box(src){const s={window:{},Math:Object.create(Math),console};s.Math.random=()=>s.window.BatchMathRNG.random();vm.createContext(s);vm.runInContext(src,s);return s;}
const source=fs.readFileSync('assets/ap-topic-generators.js','utf8'),oldSource=execFileSync('git',['show',baseline+':assets/ap-topic-generators.js'],{encoding:'utf8',maxBuffer:3000000}),sb=box(source),old=box(oldSource),w=sb.window;
for(const f of ['derivative-expression-checker','unit4-exact-answers'])vm.runInContext(fs.readFileSync('assets/'+f+'.js','utf8'),sb);
const report={ok:false,geometrySamples:30000,semicircles:{total:0,categories:{},types:{},sides:{}},regionShapes:{},unchangedFactories:[],errors:[]},q=a=>a[0]/a[1],near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
try{
 assert.equal(source.slice(0,source.indexOf('(function definiteIntegralCurriculumN')),oldSource.slice(0,oldSource.indexOf('(function definiteIntegralCurriculumN')),'All factories before the four scoped engines unchanged');
 const allowed=['evaluating-definite-integrals-with-a-limit-and-summation','integrals-using-geometry','fundamental-theorem-of-calculus','combining-integral-rules','fundamental-theorem-of-calculus-and-integral-rules','unit-4-comprehensive'];
 for(const s of old.window.BatchMathAPTopicGenerators.slugs()){
  if(allowed.includes(s))continue;
  for(let i=0;i<150;i++){old.window.BatchMathRNG={random:rng(1040000+i)};w.BatchMathRNG={random:rng(1040000+i)};let a,b;try{a=JSON.stringify(old.window.BatchMathAPTopicGenerators.get(s)());}catch(e){a='error:'+e.message;}try{b=JSON.stringify(w.BatchMathAPTopicGenerators.get(s)());}catch(e){b='error:'+e.message;}assert.equal(b,a,'Unrelated factory changed: '+s);}report.unchangedFactories.push(s);
 }
 for(const mode of ['rect','trap','sigma','basic','usub','log','mvt'])for(let i=0;i<150;i++){old.window.BatchMathRNG={random:rng(377+i)};w.BatchMathRNG={random:rng(377+i)};assert.equal(JSON.stringify(w.BatchMathAPTopicGenerators.get('unit-4-comprehensive')({unit4Mode:mode})),JSON.stringify(old.window.BatchMathAPTopicGenerators.get('unit-4-comprehensive')({unit4Mode:mode})),'Unrelated review mode '+mode);}
 for(const f of ['assets/unit4-exact-answers.js'])assert.equal(fs.readFileSync(f,'utf8'),execFileSync('git',['show',baseline+':'+f],{encoding:'utf8',maxBuffer:3000000}),'Immutable editor/Newton file '+f);
 const get=kind=>w.BatchMathAPTopicGenerators.get(kind),check=w.BatchMathUnit4Answers.check;
 w.BatchMathRNG={random:rng(735294)};
 for(let i=0;i<report.geometrySamples;i++){
  const p=get('integrals-using-geometry')(),d=p.unit4Meta;assert.equal(p.stage1.prompt,'');assert.equal(p.stage1.hidePrompt,true);assert.doesNotMatch(p.questionHtml+p.explanation,/Enter the exact signed value|\\left\(x\\right\)/);
  assert.equal((p.explanation.match(/<svg /g)||[]).length,1);assert.ok(p.explanation.indexOf('<svg ')<p.explanation.indexOf('u4-work-step'));assert.equal(p.stage1.keypadMode,'unit4-geometry');
  if(d.shape!=='circle'){
   let integral=0,last=d.a;assert.ok(d.regions.length);
   for(const g of d.regions){
    const a=q(g.a),b=q(g.b),fn=x=>d.m*(d.shape==='absolute'?Math.abs(x-d.h):x-d.h)+d.offset;near(a,last);last=b;assert.ok(b>a);near(q(g.y1),fn(a));near(q(g.y2),fn(b));assert.ok(fn(a)*fn(b)>=-1e-9);near(q(g.area),(b-a)*(Math.abs(fn(a))+Math.abs(fn(b)))/2);assert.ok(q(g.area)>0);assert.equal(g.side,Math.sign(fn((a+b)/2)));integral+=g.side*q(g.area);assert.ok(p.explanation.includes(`data-region="${g.label}"`));assert.ok(p.explanation.includes(`A_{${g.label}}=`));report.regionShapes[g.shape]=(report.regionShapes[g.shape]||0)+1;
   }near(last,d.b);near(integral,q(d.rat));
  }else{
   const low=d.offset+(d.sign<0?-d.r:0),high=d.offset+(d.sign>0?d.r:0);assert.ok(d.side>0?low>=0:high<=0,'Whole arc remains on assigned side');
   const divisor=d.quarter?4:2,area=d.side*(d.offset*(d.b-d.a)+d.sign*Math.PI*d.r*d.r/divisor);assert.ok(area>0);near(q(d.rat),d.offset*(d.b-d.a));near(q(d.pi),d.sign*d.r*d.r/divisor);
   if(d.offset){assert.match(p.explanation,/rectangle has width/);assert.ok(p.explanation.includes(`A_{\\rm rectangle}=(${d.b-d.a})(${Math.abs(d.offset)})=${(d.b-d.a)*Math.abs(d.offset)}`));assert.ok(p.explanation.includes(d.sign===d.side?'Add':'Subtract'));}
   if(!d.quarter){const t=report.semicircles;t.total++;t.categories[d.shiftCategory]=(t.categories[d.shiftCategory]||0)+1;t.types[d.shiftType]=(t.types[d.shiftType]||0)+1;(t.sides[d.shiftCategory]??={above:0,below:0})[d.side>0?'above':'below']++;assert.equal(d.shiftCategory,!d.h&&!d.offset?'origin':d.h&&d.offset?'both':'single');}
  }
  if(i%53===0){const e=w.BatchMathUnit4Answers.expression(p.stage1.unit4Answer.value);assert.equal(check(`(${e})+0`,p.stage1.unit4Answer).ok,true);assert.notEqual(check(`(${e})+1`,p.stage1.unit4Answer).ok,true);}
 }
 const t=report.semicircles;for(const category of ['origin','single','both']){assert.ok(Math.abs(t.categories[category]/t.total-1/3)<.025,category);const c=t.sides[category];assert.ok(Math.abs(c.above/(c.above+c.below)-.5)<.04,'side balance '+category);}assert.ok(Math.abs(t.types.horizontal/t.categories.single-.5)<.09,'Both single-shift types');
 let queue=[.2,.5,.5,0,.8,.9,0];w.BatchMathRNG={random:()=>queue.length?queue.shift():.5};const example=get('integrals-using-geometry')();assert.equal(example.unit4Meta.a,7);assert.equal(example.unit4Meta.b,8);assert.equal(example.unit4Meta.m,1);assert.match(example.questionHtml,/\\int_\{7\}\^\{8\}x\\,dx/);assert.match(example.explanation,/parallel sides/);assert.ok(example.explanation.includes('\\frac{1}{2}\\left(7+8\\right)\\left(1\\right)=\\frac{15}{2}'));
 w.BatchMathRNG={random:rng(938251)};
 const ftcFamilies=new Set(),rulesFamilies=new Set();
 for(let i=0;i<10000;i++){
  const p=get('fundamental-theorem-of-calculus')(),d=p.unit4Meta;if(i%23===0){assert.equal(check(`(${p.stage1.unit4Answer.expression})+0`,p.stage1.unit4Answer).ok,true);assert.notEqual(check(`(${p.stage1.unit4Answer.expression})+1`,p.stage1.unit4Answer).ok,true);}ftcFamilies.add(p.variant);assert.match(p.questionHtml,/H\(x\)=/);assert.ok(p.explanation.includes('upper limit minus the lower limit'));assert.ok(p.explanation.includes("F'=f"));for(const t of [...(p.explanation+p.questionHtml).matchAll(/\\\(([\s\S]*?)\\\)/g)].map(x=>x[1]))assert.doesNotMatch(t,/\\(?:qquad|quad|hspace|phantom)|\\!|\//);assert.ok(p.explanation.includes("H'(x)="));if(d.lower.type==='constant')assert.match(p.explanation,/-0/);if(d.upper.type==='constant')assert.match(p.explanation,/H'\(x\)=0-/);if(p.variant==='upper_identity')assert.doesNotMatch(p.answerTex,/\\left\(1\\right\)/);
  const r=get('combining-integral-rules')();rulesFamilies.add(r.variant);assert.equal(r.stage2,undefined);assert.equal(r.unit4Meta.firstAnswer,undefined);assert.doesNotMatch(r.questionHtml+r.stage1.prompt+r.explanation,/Part [12]|[Dd]o not (?:take|find).*antiderivative/);if(r.variant==='zero_width'){assert.equal(r.unit4Meta.facts.length,0);assert.ok(r.questionHtml.includes(r.unit4Meta.target));assert.equal(r.stage1.hidePrompt,true);assert.equal(check('0',r.stage1.unit4Answer).ok,true);}
 }
 assert.equal(ftcFamilies.size,8);assert.equal(rulesFamilies.size,6);report.ok=true;
}catch(e){report.errors.push(e.stack);console.error(e.stack);process.exitCode=1;}
fs.mkdirSync('qa-results',{recursive:true});fs.writeFileSync('qa-results/unit4-v128q-math.json',JSON.stringify(report,null,2)+'\n');console.log('Q revision QA:',report.ok?'PASS':'FAIL',JSON.stringify({...report,unchangedFactories:report.unchangedFactories.length}));
