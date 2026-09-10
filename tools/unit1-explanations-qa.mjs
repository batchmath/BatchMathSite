#!/usr/bin/env node
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),baseline=process.env.BM_UNIT1_BASELINE;
const rel='ap-calculus/unit-1-limits-continuity/topics/';
function rng(){let s=9173;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
function legacy(dir){const h=fs.readFileSync(path.join(dir,rel,'comprehensive-review/practice/index.html'),'utf8');let s=[...h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const generators='));s=s.slice(0,s.indexOf('  function makeProblem()'))+'globalThis.qa={generators};})();';const c={BatchMathRNG:{random:rng()},document:{addEventListener(){},getElementById(){}},window:{}};vm.createContext(c);c.window.BatchMathRNG=c.BatchMathRNG;for(const dep of ['ap-topic-generators','unit1-course-trig'])if(fs.existsSync(path.join(dir,'assets/'+dep+'.js')))vm.runInContext(fs.readFileSync(path.join(dir,'assets/'+dep+'.js'),'utf8'),c);vm.runInContext(s,c);return c.qa;}
function shared(dir){const c={window:{BatchMathRNG:{random:rng()}}};vm.runInNewContext(fs.readFileSync(path.join(dir,'assets/ap-topic-generators.js'),'utf8'),c);return c.window.BatchMathAPTopicGenerators;}
function strip(p){const q=JSON.parse(JSON.stringify(p));delete q.sol;delete q.explanation;return q;}
const results={samples:0,baselineComparisons:0,identityChecks:0,skippedEquations:0,browser:'not run'};
function textcheck(s,id){assert(!/NaN|[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(s),id+' bad text');assert(!s.includes('\\\\('),id+' double-escaped math');assert.equal((s.match(/\\\(/g)||[]).length,(s.match(/\\\)/g)||[]).length,id+' unbalanced math');}
function evaluate(s,vars={x:.173}){
  s=s.replace(/\\(sin|cos|tan|sec|csc|cot)\s+(\d*x)/g,'\\$1($2)');
  s=s.replace(/\\(?:left|right|displaystyle)\b/g,'').replace(/\\[,!; ]/g,'').replace(/\\cdot/g,'*').replace(/\s/g,'');
  s=s.replace(/\|([^|]+)\|/g,(_,v)=>'\\sqrt{('+v+')^2}');
  const tokens=s.match(/\\[A-Za-z]+|\d+(?:\.\d+)?|[A-Za-z]|[-+*/^(){}\[\]]/g)||[];let i=0;
  const take=()=>tokens[i++],peek=()=>tokens[i];
  const fn={sin:Math.sin,cos:Math.cos,tan:Math.tan,sec:x=>1/Math.cos(x),csc:x=>1/Math.sin(x),cot:x=>1/Math.tan(x)};
  function group(){const t=peek();if(['{','(','['].includes(t)){take();const v=expr();assert.equal(take(),{'{':'}','(':')','[':']'}[t],s);return v;}return atom();}
  function atom(){
    const t=take();if(t===undefined)throw Error('Missing atom: '+s);
    if(t==='+')return atom();if(t==='-')return -atom();
    if(['{','(','['].includes(t)){i--;return group();}
    if(t==='\\frac')return group()/group();
    if(t==='\\sqrt')return Math.sqrt(group());
    if(t==='\\pi')return Math.PI;
    if(fn[t.slice(1)]&&t.startsWith('\\')){
      let power=1;if(peek()==='^'){take();power=group();}
      let arg=group();if(/^\d/.test(tokens[i-1]||'')&&peek()==='x'){take();arg*=vars.x;}
      return fn[t.slice(1)](arg)**power;
    }
    if(/^\d/.test(t))return Number(t);
    if(t in vars)return vars[t];throw Error('Unknown token '+t+' in '+s);
  }
  function power(){if(peek()==='-'){take();return -power();}if(peek()==='+'){take();return power();}let v=atom();if(peek()==='^'){take();v**=group();}return v;}
  const begins=t=>t&&t!==')'&&t!==']'&&t!=='}'&&t!=='+'&&t!=='-';
  function product(){let v=power();while(begins(peek())){if(peek()==='*'){take();v*=power();}else if(peek()==='/'){take();v/=power();}else v*=power();}return v;}
  function expr(){let v=product();while(peek()==='+'||peek()==='-'){const op=take();const w=product();v=op==='+'?v+w:v-w;}return v;}
  const v=expr();assert.equal(i,tokens.length,'unparsed '+s);assert(Number.isFinite(v),'nonfinite '+s);return v;
}
function close(a,b,where,tol=1e-8){assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${where}: ${a} != ${b}`);}
function identities(s,id){for(const m of s.matchAll(/\\\(([\s\S]*?)\\\)/g))for(const piece of m[1].split('\\longrightarrow')){
 if(!piece.includes('=')||/^[xu]=/.test(piece.trim())||/\\(?:lim|to|ne|le|ge|infty|quad)|\bf\(/.test(piece))continue;
 try{let parts=piece.split('=');if(piece.includes('x')&&piece.includes('u'))parts=parts.filter(p=>!p.includes('x'));if(parts.length<2)continue;const side=id.match(/^o[12]-(-?\d+)-([+-])$/);const x=side?Number(side[1])+(side[2]==='+'?.137:-.137):2.137;const vals=parts.map(p=>evaluate(p,{x,u:1.713}));for(const v of vals)close(v,vals[0],id+' identity '+piece,2e-8);results.identityChecks++;}
 catch(e){if(/Unknown token|nonfinite|Missing atom/.test(e.message)){results.skippedEquations++;continue;}throw e;}
}}
const n=legacy(root),o=baseline?legacy(baseline):null;
for(const cat of ['continuous','factoring','substitution','rationalizing','complex','squeeze','trig','oneSided','infinity','special'])for(let i=0;i<1000;i++){
 const p=n.generators[cat]();results.samples++;textcheck(p.sol,p.id);identities(p.sol,p.id);if(o){assert.deepEqual(strip(p),strip(o.generators[cat]()),cat+' data changed');results.baselineComparisons++;}
}
const ns=shared(root),os=baseline?shared(baseline):null;
for(const slug of ['introduction-to-limits','sin-one-over-x','squeeze-course-practice','continuity-parameters','intermediate-value-theorem'])for(let i=0;i<1000;i++){
 const p=ns.get(slug)();results.samples++;textcheck(p.questionHtml+p.explanation,p.id);identities(p.explanation,p.id);
 if(os){const a=strip(p),b=strip(os.get(slug)());if(['introduction-to-limits','intermediate-value-theorem'].includes(slug)){a.questionHtml=a.questionHtml.replace(/<div class="question-prompt">[\s\S]*?<\/div>/,'');b.questionHtml=b.questionHtml.replace(/<div class="question-prompt">[\s\S]*?<\/div>/,'');}assert.deepEqual(a,b,slug+' problem changed');results.baselineComparisons++;}
}
function disc(dir){const h=fs.readFileSync(path.join(dir,rel,'introduction-to-continuity/practice/index.html'),'utf8');let s=[...h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function rational()'));s=s.slice(0,s.indexOf('function make()'))+'globalThis.qa={rational,trig,singleHole,twoJumps,mixedPiece};})();';const c={window:{},document:{getElementById(){}},BatchMathRNG:{random:rng()}};vm.runInNewContext(s,c);return c.qa;}
const nd=disc(root),od=baseline?disc(baseline):null;
for(const key of Object.keys(nd))for(let i=0;i<500;i++){
 const p=nd[key]();results.samples++;p.points.forEach(t=>{textcheck(t.why,p.id);identities(t.why,p.id);delete t.why;});if(od){const q=od[key]();q.points.forEach(t=>delete t.why);assert.deepEqual(strip(p),strip(q),key+' changed');results.baselineComparisons++;}
}
const block=s=>s.slice(s.indexOf('  function continuous()'),s.indexOf('  const generators='));const reference=block(fs.readFileSync(path.join(root,rel,'comprehensive-review/practice/index.html'),'utf8'));
for(const name of ['basic-techniques-indeterminate-limits','limits-of-continuous-functions','one-sided-limits','limits-at-infinity'])assert.equal(block(fs.readFileSync(path.join(root,rel,name,'practice/index.html'),'utf8')),reference,name+' out of sync');
results.ok=true;fs.mkdirSync(path.join(root,'qa-results'),{recursive:true});fs.writeFileSync(path.join(root,'qa-results/unit1-explanations-qa.json'),JSON.stringify(results,null,2)+'\n');console.log(results);
