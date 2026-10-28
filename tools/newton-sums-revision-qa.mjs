import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'qa-results');fs.mkdirSync(out,{recursive:true});
const baseline='561ca3e1a20ded8a0443bed73d07b3a00d1ccf70',slug='evaluating-definite-integrals-with-a-limit-and-summation';
const rng=seed=>{let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)|0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};};
function box(source){const sb={window:{},console,Math:Object.create(Math)};sb.Math.random=()=>sb.window.BatchMathRNG.random();vm.createContext(sb);vm.runInContext(source,sb);return sb;}
const current=box(fs.readFileSync(path.join(root,'assets/ap-topic-generators.js'),'utf8')),old=box(execFileSync('git',['show',baseline+':assets/ap-topic-generators.js'],{cwd:root,encoding:'utf8',maxBuffer:3000000}));
for(const f of ['derivative-expression-checker','unit4-exact-answers'])vm.runInContext(fs.readFileSync(path.join(root,'assets/'+f+'.js'),'utf8'),current);
const w=current.window,check=w.BatchMathUnit4Answers.check,parser=w.BatchMathDerivativeExpressions,report={ok:false,samples:10000,constructionSubtypes:{},intervals:{positive:0,negative:0,mixed:0},unchangedFactories:[],errors:[]};
try{
 for(const s of old.window.BatchMathAPTopicGenerators.slugs()){
  // P explicitly revises these three engines; the P gate freezes Newton at dfe1f8a.
  if([slug,'unit-4-comprehensive','integrals-using-geometry','fundamental-theorem-of-calculus','combining-integral-rules','fundamental-theorem-of-calculus-and-integral-rules'].includes(s))continue;
  for(let i=0;i<40;i++){old.window.BatchMathRNG={random:rng(1040000+i)};w.BatchMathRNG={random:rng(1040000+i)};let a,b;try{a=JSON.stringify(old.window.BatchMathAPTopicGenerators.get(s)());}catch(e){a='error:'+e.message;}try{b=JSON.stringify(w.BatchMathAPTopicGenerators.get(s)());}catch(e){b='error:'+e.message;}assert.equal(b,a,'Other factory changed: '+s);}
  report.unchangedFactories.push(s);
 }
 for(const mode of ['rect','trap','sigma','basic','usub','log','mvt'])for(let i=0;i<40;i++){old.window.BatchMathRNG={random:rng(i+372)};w.BatchMathRNG={random:rng(i+372)};assert.equal(JSON.stringify(w.BatchMathAPTopicGenerators.get('unit-4-comprehensive')({unit4Mode:mode})),JSON.stringify(old.window.BatchMathAPTopicGenerators.get('unit-4-comprehensive')({unit4Mode:mode})),'Other review mode changed');}
 w.BatchMathRNG={random:rng(19847)};
 for(let i=0;i<10000;i++){
  const p=w.BatchMathAPTopicGenerators.get(slug)(),d=p.unit4Meta,a=p.stage1.unit4Answer,body=a.expression;report.intervals[d.a>=0?'positive':d.b<=0?'negative':'mixed']++;
  assert.equal(p.stage1.hidePrompt,true);assert.equal(p.stage1.prompt,'');assert.doesNotMatch(p.explanation+p.stage1.explanation,/Construct the right-endpoint summand/);
  for(const latex of [...(p.questionHtml+p.explanation+p.stage1.explanation).matchAll(/\\\(([\s\S]*?)\\\)/g)].map(m=>m[1]))assert.ok(!latex.includes('/'),'Displayed slash fraction: '+latex);
  const full=`lim(n->infinity,sum(k=1,n,${body}))`,unsimplified=`lim(n->+infinity,sum(k=(2-1),n+0,(${body})+0))`;
  for(const raw of [body,full,unsimplified,p.stage1.answerTex,p.stage1.answerTex.replace('^{n}','^n'),full.toUpperCase()])assert.equal(check(raw,a).ok,true,'Accept equivalent complete/summand representation '+p.id);
  const term=body.slice(1,body.lastIndexOf(')*')),factor=`(${d.width})/n`,factored=`lim(n->infinity,${factor}*sum(k=1,n,${term}))`;assert.equal(check(factored,a).ok,true,'Width may be factored outside the sum');
  for(const raw of [`lim(n->0,sum(k=1,n,${body}))`,`lim(n->infinity,sum(k=0,n,${body}))`,`lim(n->infinity,sum(k=1,n-1,${body}))`,`lim(n->infinity,sum(k=1,n,(${body})+1))`])assert.notEqual(check(raw,a).ok,true,'Reject wrong bound/term');
  assert.equal(check('lim(n->infinity,sum(k=1,n,))',a).valid,false);
  if(d.coefficients){
   assert.ok(p.stage2);assert.equal(p.stage2.keypadMode,'unit4-newton-value');assert.equal(JSON.stringify(d.neededPowers),JSON.stringify(d.expanded.map((n,j)=>n?j:-1).filter(j=>j>=0)));
   for(const n of [2,9,31]){const finite=d.expanded[0]+d.expanded[1]*(n+1)/(2*n)+d.expanded[2]*(n+1)*(2*n+1)/(6*n*n),step=d.finiteTex;assert.ok(step);assert.ok(Number.isFinite(finite));}
   const html=p.stage2.explanation,markers=[...html.matchAll(/data-newton-step="([^"]+)"/g)].map(m=>m[1]);for(const name of ['width','endpoint','summand','sum','expanded','identities','finite','limit','substitution','result'])assert.ok(markers.includes(name),name);
   assert.ok(markers.indexOf('finite')<markers.indexOf('limit')&&markers.indexOf('limit')<markers.indexOf('substitution')&&markers.indexOf('substitution')<markers.indexOf('result'));
   assert.ok(d.explicitLimitTex.includes(d.finiteTex),'Take the limit of the actual simplified finite sum');
   for(let j=0;j<3;j++)assert.equal(html.includes(`data-newton-step="identity-${j}"`),d.neededPowers.includes(j),'Show only relevant identities');
  }else{
   assert.equal(p.stage2,undefined);report.constructionSubtypes[d.subtype]=(report.constructionSubtypes[d.subtype]||0)+1;
   // The expression has exactly two top-level terms before multiplication by delta x.
   const tree=parser.parse(w.BatchMathUnit4DefiniteAnswers.prepare(body,'newton-expression'));assert.ok(tree);assert.ok(d.u&&d.v);
   if(d.subtype==='radical_linear'){
    const alternative=`(${d.u}*((${d.a}+${d.width}*k/n+${d.shiftBy})^(1/2))+(${d.v})*(${d.a}+${d.width}*k/n))*${d.width}/n`;
    assert.equal(check(`lim(n->infinity,sum(k=1,n,${alternative}))`,a).ok,true,'Square-root and half-power forms agree');
   }
   if(['radical_linear','logarithm_polynomial','logarithm_radical'].includes(d.subtype))assert.ok(d.a+d.shiftBy>0,'Continuous root/log domain');
   if(d.subtype==='rational_polynomial')assert.ok(d.denominator>0,'No rational pole');
   if(d.subtype==='exponential_tangent')assert.ok(d.a>-Math.PI/2&&d.b<Math.PI/2,'No tangent pole');
  }
 }
 assert.equal(Object.keys(report.constructionSubtypes).length,8);assert.ok(Object.values(report.intervals).every(n=>n>500));report.ok=true;
}catch(e){report.errors.push(e.stack);process.exitCode=1;console.error(e.stack);}
fs.writeFileSync(path.join(out,'newton-sums-revision-math.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,unchangedFactories:report.unchangedFactories.length},null,2));
