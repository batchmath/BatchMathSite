#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[];let checks=0,seed=1090301;
const assert=(ok,message)=>{checks++;if(!ok)errors.push(message)};
const elements=new Map(),listeners=new Map();
function element(id){
 if(elements.has(id))return elements.get(id);const events=new Map();
 const node={id,value:id==='practice-type'?'mixed':'',disabled:false,innerHTML:'',textContent:'',className:'',hidden:false,style:{display:''},
  get selectedOptions(){return[{textContent:this.value}]},addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn)},dispatch(type,event={}){for(const fn of events.get(type)||[])fn({preventDefault(){},key:'',...event})},focus(){},setAttribute(name,value=''){this[name]=value}};
 elements.set(id,node);return node;
}
const context={console,Math,URLSearchParams,location:{search:'?bm_qa=1'},document:{getElementById:element}};context.window=context;context.globalThis=context;
context.addEventListener=(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)};
context.BatchMathRNG={random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}};
context.BatchMathCalculusKeypad={reset(){},focus(){}};context.BMAnalytics={ensurePracticeStarted(){},problemGenerated(){},answerChecked(){},solutionRevealed(){}};
vm.createContext(context);
for(const file of ['derivative-expression-checker.js','derivative-at-point-practice.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,'assets',file),'utf8'),context,{filename:file});
for(const fn of listeners.get('load')||[])fn();
const api=context.BatchMathDerivativeExpressions,qa=context.BatchMathAtPointQA;
const displayed=p=>[p.math,p.answerTex,...p.steps].join(' ');
const audit=(group,count,seen=new Set())=>{for(let i=0;i<count;i++){const p=qa.generators[group]();seen.add(p.family);assert(p.group===group,`${group}: wrong group ${p.group}`);assert(!/(^|[^\d])1x(?:\^|\b)/.test(displayed(p)),`${group}/${p.family}: displayed 1x`);assert(!/x\^\{?1\}?(?![\d/])/.test(displayed(p)),`${group}/${p.family}: displayed exponent one`);assert(api.equivalent(p.answerExpr,p.answerExpr,[{}]),`${group}/${p.family}: answer did not parse`);assert(p.steps.length>=3,`${group}/${p.family}: missing walkthrough`) }return seen};
audit('basic',4000);
const productFamilies=audit('product',7000);const quotientFamilies=audit('quotient',7000);
for(const f of productFamilies)assert(f!==undefined,`product: unnamed family`);for(const f of quotientFamilies)assert(f!==undefined,`quotient: unnamed family`);
for(let i=0;i<30000;i++){const p=qa.generators.trig();context.__trig=context.__trig||{};context.__trig[p.trigKind]=(context.__trig[p.trigKind]||0)+1;assert(p.usesChain===true,'trig: chain rule flag missing')}
for(const k of ['sin','cos','tan']){const share=(context.__trig[k]||0)/30000;assert(share>.18&&share<.22,`trig ${k}: ${(share*100).toFixed(1)}%, expected about 20%`)}
for(const k of ['sec','csc','cot']){const share=(context.__trig[k]||0)/30000;assert(share>.115&&share<.15,`trig ${k}: ${(share*100).toFixed(1)}%, expected about 13.3%`)}
audit('exponential',9000);audit('logarithmic',9000);
let mono=0,poly=0,nonpoly=0;const nonpolyFamilies=new Set();for(let i=0;i<18000;i++){const p=qa.generators.invtrig();if(p.interiorType==='monomial')mono++;else if(p.interiorType==='polynomial')poly++;else{nonpoly++;nonpolyFamilies.add(p.argumentFamily)}assert(!/x\^\{1\}/.test(p.math),'inverse trig: displayed x^1')}
assert(nonpoly/18000>.13&&nonpoly/18000<.17,`inverse trig non-polynomial share ${(100*nonpoly/18000).toFixed(1)}%`);
assert(mono/18000>.31&&mono/18000<.37,`inverse trig monomial share ${(100*mono/18000).toFixed(1)}%`);
assert(nonpolyFamilies.size===13,`inverse trig: found ${nonpolyFamilies.size} of 13 non-polynomial argument families`);
audit('implicit',9000);
const mixed=new Set();for(let i=0;i<12000;i++){const p=qa.mixedCompositeProblem();mixed.add(p.family);assert(p.mixedComposite===true,'mixed composite flag missing');assert(api.equivalent(p.answerExpr,p.answerExpr,[{}]),`${p.family}: mixed answer did not parse`)}
assert(mixed.size===11,`mixed composites: found ${mixed.size} of 11 families`);
const contexts=[1.35,1.5,1.7].map(x=>({x,g:u=>.5*Math.cos(u)-.2*u,gp:u=>-.5*Math.sin(u)-.2}));
assert(api.equivalent("g'(sin3x)(3cos3x)",'gp(sin(3*x))*3*cos(3*x)',contexts),'reported equivalent answer is still rejected');
const chainHtml=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-2-derivatives/topics/the-chain-rule/index.html'),'utf8');
assert(chainHtml.includes('bm-practice-icon-derivative2')&&chainHtml.includes('d²y')&&chainHtml.includes('dx²'),'nested engine does not use the second-engine derivative icon');
assert(!chainHtml.includes('bm-practice-icon-function">f(g(x))'),'old nested-engine icon remains');
const css=fs.readFileSync(path.join(ROOT,'assets/site.css'),'utf8');assert(css.includes('border:2px solid var(--bm-red)'),'topic navigation lacks full red border');assert(!/border-(?:left|right):4px solid var\(--bm-red\)/.test(css),'one-sided red border remains');

console.log('BatchMath v10.9.I derivative-special QA');
console.log(`Result: ${errors.length?'FAIL':'PASS'}`);console.log(`Checks: ${checks}`);
console.log(`Trig distribution: ${Object.entries(context.__trig).map(([k,v])=>`${k}=${(100*v/30000).toFixed(1)}%`).join(', ')}`);
console.log(`Inverse-trig interiors: monomial=${(100*mono/18000).toFixed(1)}%, polynomial=${(100*poly/18000).toFixed(1)}%, non-polynomial=${(100*nonpoly/18000).toFixed(1)}%`);
console.log(`Product families: ${[...productFamilies].sort().join(', ')}`);console.log(`Quotient families: ${[...quotientFamilies].sort().join(', ')}`);console.log(`Mixed-only composite families: ${[...mixed].sort().join(', ')}`);
console.log(`Errors: ${errors.length}`);for(const e of errors.slice(0,80))console.log(`- ${e}`);if(errors.length)process.exit(1);
