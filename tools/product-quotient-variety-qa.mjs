#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const slugs=['the-product-rule','the-quotient-rule','comprehensive-review'];
const errors=[],coverage={};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function build(slug){
 const html=fs.readFileSync(path.join(root,`ap-calculus/unit-2-derivatives/topics/${slug}/practice/index.html`),'utf8');
 const source=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!m[1].includes('src=')).map(m=>m[2]).find(s=>s.includes('function product()')&&s.includes('function quotient()'));
 if(!source)throw Error('Missing engine source: '+slug);
 const el={ruleMode:{value:'all',addEventListener(){}}},document={getElementById:id=>el[id]||(el[id]={value:'',addEventListener(){},style:{},focus(){}}),addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}};
 const box={Math,console,document,window:{MathJax:null,BatchMathCalculusKeypad:null,addEventListener(){}},BatchMathRNG:{random:rng(7)},setTimeout(){},clearTimeout(){}};
 vm.createContext(box);
 vm.runInContext(fs.readFileSync(path.join(root,'assets/derivative-rule-factors.js'),'utf8'),box);
 box.BatchMathDerivativeRuleFactors=box.window.BatchMathDerivativeRuleFactors;
 const cut=source.lastIndexOf('})();');
 vm.runInContext(source.slice(0,cut)+';globalThis.QA={product,quotient,parseExpression,evalTree,equivalent};'+source.slice(cut),box,{timeout:8000});
 return box;
}
const xs=[.12,.19,.31,.47,.73,.98];
function numericDerivative(fn,x){const h=1e-5;return(fn(x+h)-fn(x-h))/(2*h)}
function test(slug,kind){
 const box=build(slug),seen=new Set(),places=new Set();let checked=0,samples=0;
 let legacy=0,expanded=0;
 for(let i=0;i<2000;i++){
  box.BatchMathRNG.random=rng(900001+i*337+(kind==='quotient'?29:0));
  const p=box.QA[kind]();
  if(p.id.startsWith(kind==='product'?'pa-wide-':'qa-wide-'))expanded++;
  else if(p.id.startsWith(kind==='product'?'pa':'qa'))legacy++;
  else errors.push(`${slug}/${kind}: unexpected All Function Types family ${p.id}`);
 }
 if((slug==='comprehensive-review'||slug===`the-${kind}-rule`)&&(!legacy||!expanded))errors.push(`${slug}/${kind}: existing or expanded families absent from All Function Types`);
 // Test the new shared catalog directly so every sample has factor expressions
 // available for a finite-difference check, including numerator/denominator order.
 for(let i=0;i<7000;i++){
  box.BatchMathRNG.random=rng(i*227+17+(kind==='product'?0:17));
  const p=box.BatchMathDerivativeRuleFactors.make(kind,(cat,id,prompt,math,answerExpr,answerTex,solution)=>({cat,id,q:`<div class="question-prompt">${prompt}</div>\\(${math}\\)`,answerExpr,answerTex,solution}));
  samples++;for(const name of p.factorKinds)seen.add(name);
  if(kind==='quotient')for(let j=0;j<2;j++)places.add(`${p.factorKinds[j]}:${j}`);
  if(!p.solution.includes("u'=")||!p.solution.includes("v'="))errors.push(`${slug}/${kind}: missing factor derivative in ${p.id}`);
  let expected,first,second;
  try{expected=box.QA.parseExpression(p.answerExpr);first=box.QA.parseExpression(p.factorExpressions[0]);second=box.QA.parseExpression(p.factorExpressions[1])}
  catch(e){errors.push(`${slug}/${kind}: cannot parse ${p.id}: ${e.message}`);continue}
  for(const x of xs){
   try{
    const evaluate=(tree,z)=>box.QA.evalTree(tree,{x:z});
    const u=z=>evaluate(first,z),v=z=>evaluate(second,z);
    const f=z=>kind==='product'?u(z)*v(z):u(z)/v(z);
    const actual=evaluate(expected,x),independent=numericDerivative(f,x);
    if(!Number.isFinite(actual)||!Number.isFinite(independent)||Math.max(Math.abs(actual),Math.abs(independent))>1e6)continue;
    checked++;
    if(Math.abs(actual-independent)>3e-4*Math.max(1,Math.abs(actual),Math.abs(independent))){errors.push(`${slug}/${kind}: derivative mismatch ${p.id} at x=${x}: ${actual} vs ${independent}`);break}
   }catch(e){errors.push(`${slug}/${kind}: evaluation error ${p.id}: ${e.message}`);break}
  }
 }
 const expected=box.BatchMathDerivativeRuleFactors.types;
 for(const family of expected)if(!seen.has(family))errors.push(`${slug}/${kind}: family ${family} absent`);
 if(checked<samples*3)errors.push(`${slug}/${kind}: too few independent derivative checks ${checked}`);
 if(kind==='quotient')for(const family of ['asin','acos','atan','ln','logbase','exp','baseexp'])for(const pos of [0,1])if(!places.has(`${family}:${pos}`))errors.push(`${slug}/${kind}: ${family} absent from ${pos?'denominator':'numerator'}`);
 coverage[`${slug}/${kind}`]={samples,checked,legacy,expanded,families:[...seen].sort()};
}
for(const slug of slugs)for(const kind of ['product','quotient'])test(slug,kind);
const report={ok:errors.length===0,coverage,errors};
fs.mkdirSync(path.join(root,'qa-results'),{recursive:true});
fs.writeFileSync(path.join(root,'qa-results/product-quotient-variety-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Product/Quotient variety QA: ${report.ok?'PASS':'FAIL'}; ${Object.values(coverage).reduce((s,c)=>s+c.samples,0)} generated; ${Object.values(coverage).reduce((s,c)=>s+c.checked,0)} independent derivative checks; ${errors.length} errors`);
if(errors.length){console.error(errors.slice(0,25).join('\n'));process.exit(1)}
