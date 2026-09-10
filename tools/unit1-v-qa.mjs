import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');let state=9317;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);const c={window:{BatchMathRNG:{random}},BatchMathRNG:{random},assert};vm.createContext(c);for(const name of ['ap-topic-generators','unit1-course-trig','unit1-discontinuities'])vm.runInContext(read('assets/'+name+'.js'),c);
const source=read('tools/unit1-explanations-qa.mjs');vm.runInContext(source.slice(source.indexOf('function evaluate('),source.indexOf('function close(')),c);
let trigSamples=0,discSamples=0,polynomialChecks=0,eligible=0,factored=0,three=0;const trigFamilies={},discFamilies={};
for(let i=0;i<20000;i++){
 const p=c.window.BMUnit1CourseTrig.generate();trigSamples++;trigFamilies[p.variant]=(trigFamilies[p.variant]||0)+1;assert.equal(p.answerType,'numeric');assert(!p.choices);assert(Number.isFinite(p.numericAnswer));assert(p.explanation.length>100);assert(!/NaN|undefined/.test(p.questionHtml));
 if(p.courseData){const expr=p.questionHtml.split('\\lim_{x\\to0}')[1].split('\\)')[0];const near=[-.000001,.000001].map(x=>c.evaluate(expr,{x}));const expected=p.numericAnswer;for(const v of near)assert(Math.abs(v-expected)<.02*Math.max(1,Math.abs(expected)),p.variant+': '+v+' vs '+expected);}
 const param=c.window.BatchMathAPTopicGenerators.get('continuity-parameters')();if(param.variant==='three_piece_system')three++;
}
for(const f of ['sine_power','tangent_power','cosine_power','sine_ratio','product','split_sum','split_cosine','expanded_cosine','pythagorean','sine_cosine_product','cosine_ratio','polynomial_product'])assert(trigFamilies[f]>500,f);
assert(three>9700&&three<10300,'piece count balance '+three);
const evalPoly=(a,x)=>a.reduceRight((v,n)=>v*x+n,0);
for(let i=0;i<30000;i++){
 const p=c.window.BMUnit1Discontinuities.generate();discSamples++;discFamilies[p.variant]=(discFamilies[p.variant]||0)+1;assert.equal(new Set(p.points.map(x=>x.x)).size,p.points.length);assert(!/NaN|undefined|\+\-/.test(p.tex));assert(p.points.every(x=>x.why.length>50));
 if(p.presentation){eligible++;if(p.presentation.factored)factored++;}
 const d=p.discData;if(!d)continue;let expected;
 if(d.family==='repeated')expected=[{x:d.h,type:d.m>=d.n?'removable':'infinite'},{x:d.v,type:'infinite'}];
 else if(d.family==='trigpoly')expected=[{x:0,type:d.p>=d.q?'removable':'infinite'}];
 else expected=[{x:0,type:(d.family==='cos'?2*d.p:d.p)>=d.q?'removable':'infinite'},{x:d.h,type:d.m>=d.n?'removable':'infinite'}];
 assert.equal(JSON.stringify(p.points.map(({x,type})=>({x,type}))),JSON.stringify(expected),p.id);
 for(const x of [-5.37,-.73,.43,5.81]){let n,den;
  if(d.family==='repeated'){n=(x-d.h)**d.m*(x-d.q);den=(x-d.h)**d.n*(x-d.v)**d.r;}
  else if(d.family==='trigpoly'){n=(x+d.h)**d.r;den=x**d.q*(x*x+d.c);}
  else{n=(x-d.h)**d.m;den=x**d.q*(x-d.h)**d.n;}
  assert(Math.abs(evalPoly(p.presentation.num,x)-n)<1e-7*Math.max(1,Math.abs(n)),p.id+' numerator expansion');assert(Math.abs(evalPoly(p.presentation.den,x)-den)<1e-7*Math.max(1,Math.abs(den)),p.id+' denominator expansion');
  const actual=c.evaluate(p.tex.slice(5),{x});let value=n/den;if(d.family!=='repeated')value*=d.family==='cos'?(1-Math.cos(d.k*x))**d.p:Math.sin(d.k*x)**d.p;
  assert(Math.abs(actual-value)<1e-7*Math.max(1,Math.abs(value)),p.id+' displayed function mismatch');polynomialChecks++;
 }
}
assert.equal(Object.keys(discFamilies).length,9);assert(factored/eligible>.04&&factored/eligible<.06,'factored share');
const discPage=read('ap-calculus/unit-1-limits-continuity/topics/introduction-to-continuity/practice/index.html');const defs=discPage.slice(discPage.indexOf('const factor='),discPage.indexOf('function make()'));assert(read('assets/unit1-discontinuities.js').includes(defs));
const review=read('ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html');assert(!review.includes('value="asymptotes"'));assert(!review.includes(",'asymptotes'"));assert(review.includes('BMUnit1CourseTrig.generate()'));assert(review.includes('<h1 class="page-title">Comprehensive Review</h1>'));
const adv=read('ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/practice/index.html');for(let n=0;n<10;n++)assert(adv.includes(`data-insert="${n}"`));
const report={ok:true,trigSamples,trigFamilies,discSamples,discFamilies,polynomialChecks,eligibleFactoringProblems:eligible,factoredProblems:factored,factoredShare:factored/eligible,threePieceShare:three/20000,browser:'not run'};fs.writeFileSync(path.join(root,'qa-results/unit1-v-qa.json'),JSON.stringify(report,null,2));console.log(report);
