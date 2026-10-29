// Q changes presentation, not the sampled curriculum or the independent mathematics.
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const baseline='d29a0d3782398df4e01ae26456a4af3610bb3393',source=fs.readFileSync('assets/ap-topic-generators.js','utf8');
function box(src){let seed=17345;const w={BatchMathRNG:{random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;}}},s={window:w};vm.createContext(s);vm.runInContext(src,s);return s;}
const now=box(source),old=box(execFileSync('git',['show',baseline+':assets/ap-topic-generators.js'],{encoding:'utf8',maxBuffer:3000000}));
for(const f of ['derivative-expression-checker','unit4-exact-answers'])vm.runInContext(fs.readFileSync(`assets/${f}.js`,'utf8'),now);
function texInput(tex){
 let s=tex.replace(/\\(?:left|right)/g,'').replace(/\\(sin|cos|tan|sec|ln)/g,'$1');
 const group=start=>{assert.equal(s[start],'{');let depth=1,end=start+1;for(;end<s.length&&depth;end++){if(s[end]==='{')depth++;if(s[end]==='}')depth--;}assert.equal(depth,0);return {text:s.slice(start+1,end-1),end};};
 while(s.includes('\\frac')){const at=s.lastIndexOf('\\frac'),a=group(at+5),b=group(a.end);s=s.slice(0,at)+`((${a.text})/(${b.text}))`+s.slice(b.end);}
 return s.replace(/[\{\[]/g,'(').replace(/[\}\]]/g,')').replace(/\s+/g,'*');
}
const report={ok:false,samples:0,texChecks:0,errors:[]};
try{
 for(const slug of ['evaluating-definite-integrals-with-a-limit-and-summation','integrals-using-geometry','fundamental-theorem-of-calculus','combining-integral-rules'])for(let i=0;i<3000;i++){
  const p=now.window.BatchMathAPTopicGenerators.get(slug)(),b=old.window.BatchMathAPTopicGenerators.get(slug)();assert.equal(JSON.stringify(p.unit4Meta),JSON.stringify(b.unit4Meta),'No sampled parameter, family, weight or answer metadata change');assert.equal(p.variant,b.variant);assert.equal(!!p.stage2,!!b.stage2);
  if(p.unit4Meta.kind==='geometry')assert.equal(p.explanation.match(/<figure[\s\S]*?<\/figure>/)?.[0],b.explanation.match(/<figure[\s\S]*?<\/figure>/)?.[0],'Exact P figure retained');
  if(p.unit4Meta.kind==='newton'){assert.equal(JSON.stringify(p.stage1.unit4Answer),JSON.stringify(b.stage1.unit4Answer));assert.doesNotMatch(p.explanation+p.stage1.explanation+(p.stage2?.explanation||''),/T\(k,n\)|S_n/);}
  if(p.unit4Meta.kind==='ftc'&&i%5===0){assert.equal(now.window.BatchMathUnit4Answers.check(b.stage1.unit4Answer.expression,p.stage1.unit4Answer).ok,true,'Simplification preserves P derivative');assert.equal(now.window.BatchMathUnit4Answers.check(texInput(p.stage1.answerTex),p.stage1.unit4Answer).ok,true,'Displayed derivative equals checked answer: '+p.stage1.answerTex+' raw: '+p.stage1.unit4Answer.expression);for(const match of p.explanation.matchAll(/\\\(\\displaystyle H'\(x\)=([\s\S]*?)\\\)/g)){if(match[1].includes("F'"))continue;assert.equal(now.window.BatchMathUnit4Answers.check(texInput(match[1]),p.stage1.unit4Answer).ok,true,'Displayed substitution: '+match[1]);report.texChecks++;}}
  if(p.unit4Meta.kind==='rules')for(const f of p.unit4Meta.facts.filter(f=>f.a>f.b))assert.ok(p.explanation.includes(`=-(${f.value})=${-f.value}`),'Each reversed given value is normalized explicitly');
  report.samples++;
 }
 report.ok=true;
}catch(e){report.errors.push(e.stack);process.exitCode=1;console.error(e.stack);}
fs.mkdirSync('qa-results',{recursive:true});fs.writeFileSync('qa-results/unit4-v128q-preservation.json',JSON.stringify(report,null,2));console.log(report);
