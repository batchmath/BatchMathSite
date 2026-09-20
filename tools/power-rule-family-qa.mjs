#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const POWER='ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/index.html';
const REVIEW='ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html';
const errors=[];
const counts={};

function hashSeed(value){let h=2166136261>>>0;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let s=hashSeed(seed)||0x6d2b79f5;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function html(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8')}
function selectValues(source,id){const m=source.match(new RegExp(`<select[^>]+id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/select>`,'i'));return m?[...m[1].matchAll(/<option[^>]+value=["']([^"']+)["']/gi)].map(x=>x[1]):[]}
function expose(rel,names,seed){
 const source=html(rel),scripts=[...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!(/\bsrc\s*=/.test(m[1]))).map(m=>m[2]);
 const code=scripts.find(x=>x.includes('function basic()')&&x.includes('function parseExpression'));
 if(!code)throw Error(`generator script missing: ${rel}`);
 const values={},elements={};
 const el=id=>elements[id]||(elements[id]={value:values[id]||'',innerHTML:'',textContent:'',className:'',disabled:false,style:{display:''},addEventListener(){},focus(){},classList:{add(){},remove(){},contains(){return false}}});
 const document={getElementById:el,querySelector(){return null},querySelectorAll(){return[]},addEventListener(){}};
 const close=code.lastIndexOf('})();'),body=code.slice(0,close)+`;globalThis.QA={${names.join(',')}};`+code.slice(close);
 const window={MathJax:null,BatchMathCalculusKeypad:null,BMAnalytics:null,addEventListener(){}};
 const box={console,Math,document,window,BatchMathRNG:{random:rng(seed)},setTimeout(){return 0},clearTimeout(){},location:{},navigator:{}};
 vm.createContext(box);vm.runInContext(body,box,{filename:path.basename(rel),timeout:10000});
 box.setValue=(id,value)=>{values[id]=value;el(id).value=value};return box;
}
function parseable(box,p){
 try{const tree=box.QA.parseExpression(p.answerExpr);let good=0;for(const x of [.23,.61,1.1,1.8,2.7,4.2]){try{const v=box.QA.evalTree(tree,{x});if(Number.isFinite(v)&&Math.abs(v)<1e12)good++}catch{}}return good>=3}catch{return false}
}
function inspect(p,label,box){
 const all=[p.q,p.answerTex,p.solution,p.answerExpr].join(' ');
 if(/\b(?:NaN|undefined)\b/.test(all))errors.push(`${label} ${p.id}: NaN/undefined`);
 if(/(^|[^\\])(?:frac\{|sqrt\{|displaystyle)/.test([p.q,p.answerTex,p.solution].join(' ')))errors.push(`${label} ${p.id}: dropped TeX backslash`);
 if(!parseable(box,p))errors.push(`${label} ${p.id}: answer expression does not parse/evaluate`);
 if(/\b\d{4,}\b/.test(p.answerTex)&&!/^pr-irr-/.test(p.id))errors.push(`${label} ${p.id}: unnecessarily large arithmetic in ${p.answerTex}`);
}

const powerHtml=html(POWER);
const orderValues=selectValues(powerHtml,'derivativeOrder'),typeValues=selectValues(powerHtml,'powerType');
if(JSON.stringify(orderValues)!==JSON.stringify(['first','higher']))errors.push(`Derivative Order selector is ${JSON.stringify(orderValues)}`);
if(JSON.stringify(typeValues)!==JSON.stringify(['mixed','polynomial','negative','fractional','irrational']))errors.push(`Function Type selector is ${JSON.stringify(typeValues)}`);
if(/Divide each term|dividing term by term/i.test(powerHtml))errors.push('Term-by-term division family leaked into Power Rule practice');

const box=expose(POWER,['powerRuleProblem','parseExpression','evalTree'],'power-rule');
const expected={polynomial:'pr-poly-',negative:'pr-neg-',fractional:'pr-frac-',irrational:'pr-irr-'};
for(const orderMode of orderValues){
 for(const type of typeValues){
  if(orderMode==='higher'&&type==='irrational')continue;
  const key=`${orderMode}:${type}`,seen=new Set();counts[key]=0;
  for(let i=0;i<2500;i++){
   box.BatchMathRNG.random=rng(`${key}:${i}`);const p=box.QA.powerRuleProblem(orderMode,type);counts[key]++;inspect(p,key,box);
   const m=p.id.match(/^pr-(?:poly|neg|frac|irr|mixed)-(\d)-/);if(!m){errors.push(`${key}: unknown id ${p.id}`);continue}
   const order=Number(m[1]);seen.add(p.id.split('-')[1]);
   if(orderMode==='first'&&order!==1)errors.push(`${key}: generated order ${order}`);
   if(orderMode==='higher'&&(order<2||order>4))errors.push(`${key}: generated order ${order}`);
   if(type!=='mixed'&&!p.id.startsWith(expected[type]))errors.push(`${key}: leaked ${p.id}`);
  }
  if(type==='mixed')for(const family of (orderMode==='higher'?['poly','neg','frac','mixed']:['poly','neg','frac','irr','mixed']))if(!seen.has(family))errors.push(`${key}: mixed pool missed ${family}`);
 }
}

let sawRoot=false,sawFractionalExponent=false,sawReciprocal=false,sawNegativeExponent=false;
for(let i=0;i<5000;i++){
 box.BatchMathRNG.random=rng(`forms:${i}`);let p=box.QA.powerRuleProblem('first','fractional');sawRoot||=/\\sqrt/.test(p.q);sawFractionalExponent||=/x\^\{\\frac/.test(p.q);
 box.BatchMathRNG.random=rng(`negative:${i}`);p=box.QA.powerRuleProblem('first','negative');sawReciprocal||=/\\frac/.test(p.q);sawNegativeExponent||=/x\^\{-/.test(p.q);
}
if(!sawRoot)errors.push('Fractional category did not expose radical/root notation');
if(!sawFractionalExponent)errors.push('Fractional category did not expose fractional-exponent notation');
if(!sawReciprocal)errors.push('Negative category did not expose reciprocal notation');
if(!sawNegativeExponent)errors.push('Negative category did not expose negative-exponent notation');

const review=expose(REVIEW,['basic','parseExpression','evalTree'],'review-power-rule'),reviewSeen=new Set(),orders=new Set();
for(let i=0;i<12000;i++){
 review.BatchMathRNG.random=rng(`review:${i}`);const p=review.QA.basic();inspect(p,'review',review);const m=p.id.match(/^pr-(poly|neg|frac|irr|mixed)-(\d)-/);if(!m)errors.push(`review: unknown id ${p.id}`);else{reviewSeen.add(m[1]);orders.add(Number(m[2]))}
}
for(const family of ['poly','neg','frac','irr','mixed'])if(!reviewSeen.has(family))errors.push(`Comprehensive Review missed ${family}`);
for(const order of [1,2,3,4])if(!orders.has(order))errors.push(`Comprehensive Review missed derivative order ${order}`);

const out=path.join(ROOT,'qa-results');fs.mkdirSync(out,{recursive:true});
const report={ok:errors.length===0,generatedAt:new Date().toISOString(),counts,errors};
fs.writeFileSync(path.join(out,'power-rule-family-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath Power Rule family QA',`Result: ${report.ok?'PASS':'FAIL'}`,`Individual-engine samples: ${Object.values(counts).reduce((a,b)=>a+b,0)}`,'Comprehensive Review samples: 12000',`Errors: ${errors.length}`,...errors.slice(0,100).map(e=>'- '+e),''];
fs.writeFileSync(path.join(out,'power-rule-family-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
