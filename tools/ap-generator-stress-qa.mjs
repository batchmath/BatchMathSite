#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const PER_CATEGORY=Math.max(100,Number(process.env.BM_QA_AP_PER_CATEGORY||10000));
const VERSION=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/app-version.json'),'utf8')).version;
const errors=[];const results=[];

const specs=[
  {name:'Limits',file:'ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html',categories:['continuous','factoring','substitution','rationalizing','complex','squeeze','trig','oneSided','infinity','special']},
  {name:'Derivatives',file:'ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html',categories:['basic','product','quotient','trig','chain','exponential','implicit','log','logdiff','invtrig','inverse','point']}
];
// Unit 4 comprehensive practice moved to the shared topic-generator architecture in v10.6.3.A.
// Its much broader 12-mode stress/coverage checks live in unit4-rebuild-qa.mjs rather than this legacy inline-generator harness.

function hashSeed(value){let h=2166136261>>>0;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}h+=h<<13;h^=h>>>7;h+=h<<3;h^=h>>>17;h+=h<<5;return h>>>0;}
function rng(seed){let state=hashSeed(seed)||0x6d2b79f5;return()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function scriptsFromHtml(html){return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!(/\bsrc\s*=/.test(m[1]))).map(m=>m[2]);}
function generatorScript(html){const candidates=scriptsFromHtml(html).filter(s=>s.includes('function makeProblem')&&s.includes('problemGenerated')&&s.includes('const generators='));if(candidates.length!==1)throw new Error(`Expected one generator script, found ${candidates.length}`);return candidates[0];}
function elem(value=''){return {dataset:{},value,innerHTML:'',textContent:'',className:'',disabled:false,placeholder:'',style:{display:''},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},focus(){},classList:{add(){},remove(){},contains(){return false;},toggle(){}}};}
function finiteNumbers(value,path='root',bad=[]){if(typeof value==='number'&&!Number.isFinite(value))bad.push(path);else if(Array.isArray(value))value.forEach((v,i)=>finiteNumbers(v,`${path}[${i}]`,bad));else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))finiteNumbers(v,`${path}.${k}`,bad);return bad;}
function stringFields(value,out=[]){if(typeof value==='string')out.push(value);else if(Array.isArray(value))value.forEach(v=>stringFields(v,out));else if(value&&typeof value==='object')Object.values(value).forEach(v=>stringFields(v,out));return out;}

function reducedRat(n,d){if(d<0){n=-n;d=-d;}const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};const g=gcd(n,d);return [n/g,d/g];}
function parseLinearTex(tex){
  const s=String(tex).replace(/\s+/g,'');
  const m=s.match(/^([+-]?)(\d*)x(?:([+-])(\d+))?$/);
  if(!m)return null;
  const A=(m[1]==='-'?-1:1)*(m[2]?Number(m[2]):1);
  const B=m[3]?(m[3]==='-'?-1:1)*Number(m[4]):0;
  return {A,B};
}
function displayedContinuousRationalValue(q){
  const m=String(q).match(/^\\\(\\displaystyle \\lim_\{x\\to (-?\d+)\} (-?)\\frac\{([^{}]+)\}\{([^{}]+)\}\\\)$/);
  if(!m)return null;
  const a=Number(m[1]),outer=m[2]==='-'?-1:1,num=parseLinearTex(m[3]),den=parseLinearTex(m[4]);
  if(!num||!den)return null;
  const nv=num.A*a+num.B,dv=den.A*a+den.B;
  if(dv===0)return {a,value:NaN};
  return {a,value:outer*nv/dv};
}
function validateContinuousRational(problem){
  const id=String(problem.id||"");
  const m=id.match(/^c-rat-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)$/);
  if(!m)return "";
  const [a,A,B,C,D]=m.slice(1).map(Number);
  const num=A*a+B,den=C*a+D;
  if(den===0)return "continuous rational id encodes zero denominator";
  const expected=num/den;
  const shown=displayedContinuousRationalValue(problem.q);
  if(!shown||shown.a!==a||!Number.isFinite(shown.value))return `could not independently parse displayed rational: ${problem.q}`;
  if(Math.abs(shown.value-expected)>1e-12)return `display changed mathematics: displayed value ${shown.value}, intended value ${expected}, q=${problem.q}`;
  const [en,ed]=reducedRat(num,den);
  if(!problem.ans||problem.ans.kind!=="rat"||problem.ans.n!==en||problem.ans.d!==ed)return `answer mismatch: expected ${en}/${ed}, got ${JSON.stringify(problem.ans)}`;
  return "";
}
function validateProblem(problem,spec,category,index){
  if(!problem||typeof problem!=='object')return 'problem is not an object';
  if(!String(problem.id||problem.key||'').trim())return 'missing id/key';
  if(!String(problem.q||problem.question||'').trim())return 'missing question content';
  if(spec.name==='Limits'&&category==='continuous'){const semanticErr=validateContinuousRational(problem);if(semanticErr)return semanticErr;}
  if(problem.cat&&category!=='infinitySpecial'&&String(problem.cat)!==category)return `category mismatch: expected ${category}, got ${problem.cat}`;
  const badNums=finiteNumbers(problem);if(badNums.length)return `non-finite numeric value at ${badNums[0]}`;
  const strings=stringFields(problem);for(const s of strings){
    if(/\b(?:undefined|NaN)\b/.test(s))return `literal undefined/NaN in generated string: ${s.slice(0,120)}`;
  }
  const display=[problem.q,problem.question,problem.sol,problem.solution].filter(Boolean).join(' ');
  if(/\\frac1\{-\d+\}/.test(display))return 'negative reciprocal denominator display';
  if(/(?:^|[^\^])--/.test(display))return 'double minus display';
  if(/\+\s*-/.test(display))return 'plus-negative display';
  return '';
}

for(const spec of specs){
  const html=fs.readFileSync(path.join(ROOT,spec.file),'utf8');let code;
  try{code=generatorScript(html);}catch(e){errors.push(`${spec.name}: ${e.message}`);continue;}
  for(const category of spec.categories){
    const generated=[];const elements={category:elem(category),question:elem(),answer:elem(),submit:elem(),next:elem(),feedback:elem(),'topic-name':elem(),'correct-count':elem('0'),attempted:elem('0')};
    const winListeners={};const random=rng(`${spec.name}:${category}:${VERSION}`);
    const fakeDocument={getElementById:id=>elements[id]||(elements[id]=elem()),addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};
    const BMAnalytics={ensurePracticeStarted(){},problemGenerated(p){generated.push(structuredClone(p));},answerChecked(){},solutionRevealed(){}};
    const window={BMAnalytics,MathJax:null,addEventListener:(t,fn)=>{winListeners[t]=fn;},BatchMathCalculusKeypad:null};
    const sandbox={window,document:fakeDocument,BatchMathRNG:{random},console,Math,structuredClone,setTimeout:()=>0,clearTimeout:()=>{},location:{},navigator:{}};
    vm.createContext(sandbox);sandbox.window.BatchMathRNG=sandbox.BatchMathRNG;for(const dep of ['ap-topic-generators','unit1-course-trig'])vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/'+dep+'.js'),'utf8'),sandbox);
    try{
      vm.runInContext(code,sandbox,{filename:`${spec.name}-${category}.js`,timeout:5000});
      if(winListeners.load)winListeners.load();
      if(!generated.length)throw new Error('generator did not create initial problem');
      const next=elements.next.listeners.click;if(typeof next!=='function')throw new Error('Next Question generator handler not registered');
      while(generated.length<PER_CATEGORY)next();
      const ids=new Set();
      for(let i=0;i<generated.length;i++){
        const p=generated[i],id=String(p.id||p.key||'');const err=validateProblem(p,spec,category,i);if(err){errors.push(`${spec.name}/${category} #${i+1} id=${id}: ${err}`);break;}ids.add(id);
      }
      results.push({engine:spec.name,category,generated:generated.length,uniqueIds:ids.size,seed:`${spec.name}:${category}:${VERSION}`});
    }catch(e){errors.push(`${spec.name}/${category}: ${e.message}`);results.push({engine:spec.name,category,generated:generated.length,error:e.message});}
  }
}
const total=results.reduce((s,r)=>s+(r.generated||0),0);const report={ok:errors.length===0,generatedAt:new Date().toISOString(),perCategory:PER_CATEGORY,totalGenerated:total,errors,results};fs.writeFileSync(path.join(OUT,'ap-generator-stress-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath deterministic AP generator stress QA',`Result: ${report.ok?'PASS':'FAIL'}`,`Problems generated: ${total}`,`Problems per category: ${PER_CATEGORY}`,`Categories: ${results.length}`,'',`Errors: ${errors.length}`,...errors.map(x=>`- ${x}`),''];fs.writeFileSync(path.join(OUT,'ap-generator-stress-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
