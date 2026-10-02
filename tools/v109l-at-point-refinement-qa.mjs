#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=name=>fs.readFileSync(path.join(ROOT,"assets",name),"utf8");
const errors=[];let checks=0,seed=1091201;
const assert=(condition,message)=>{checks++;if(!condition&&errors.length<200)errors.push(message)};
const elements=new Map(),listeners=new Map();
function element(id){
 if(elements.has(id))return elements.get(id);const events=new Map();
 const node={id,value:id==="practice-type"?"mixed":"",disabled:false,innerHTML:"",textContent:"",className:"",hidden:false,style:{display:""},get selectedOptions(){return[{textContent:this.value}]},addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn)},focus(){},setAttribute(name,value=""){this[name]=value}};
 elements.set(id,node);return node;
}
const context={console,Math,URLSearchParams,location:{search:""},document:{getElementById:element,querySelectorAll(){return[]},addEventListener(){}},BM_TOPIC_AT_POINT_CONFIG:{stage:"chain"}};
context.window=context;context.globalThis=context;context.addEventListener=(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)};
context.BatchMathRNG={random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}};
context.BatchMathCalculusKeypad={reset(){},focus(){}};context.BMAnalytics={ensurePracticeStarted(){},problemGenerated(){},answerChecked(){},solutionRevealed(){}};
vm.createContext(context);for(const file of ["answer-normalization.js","derivative-expression-checker.js","topic-derivative-at-point-practice.js"])vm.runInContext(source(file),context,{filename:file});
const qa=context.BatchMathTopicAtPointQA,parser=context.BatchMathDerivativeExpressions;

const singleMonomialPower=/\\left\(\s*-?(?:\d+)?x(?:\^\{?[2-5]\}?)?\s*\\right\)\^\{?[2-5]\}?/;
const leadingPlus=/(?:^|[=(,{])\s*\+\s*(?:x|\d|\\)/;
for(const [focus] of qa.stages.chain.options){
 for(let i=0;i<10000;i++){
  const problem=qa.generate("chain",focus),label=`chain/${focus}/${problem.family}`;
  assert(!singleMonomialPower.test(problem.math),`${label}: a single monomial is being used as a powered chain interior: ${problem.math}`);
  if(Number.isFinite(problem.interiorTermCount))assert(problem.interiorTermCount>=2,`${label}: chain interior has only ${problem.interiorTermCount} term`);
  assert(!leadingPlus.test(problem.math),`${label}: leading plus remains: ${problem.math}`);
  assert(parser.equivalent(problem.answerExpr,problem.answerExpr,[{}]),`${label}: answer does not parse`);
 }
}

const inverseKinds=new Set();
for(const [focus] of qa.stages["inverse-trig"].options){
 for(let i=0;i<10000;i++){
  const problem=qa.generate("inverse-trig",focus),label=`inverse-trig/${focus}/${problem.family}`;
  inverseKinds.add(problem.invKind);
  assert(!/\\(?:sin|cos|tan|sec|csc|cot)\^\{-1\}\\left\(\s*\+/.test(problem.math),`${label}: inverse-trig argument starts with +: ${problem.math}`);
  assert(!leadingPlus.test(problem.math),`${label}: leading plus remains: ${problem.math}`);
  assert(parser.equivalent(problem.answerExpr,problem.answerExpr,[{}]),`${label}: answer does not parse`);
 }
}

function outerDerivative(kind,u){
 if(kind==="sin")return Math.cos(u);if(kind==="cos")return-Math.sin(u);if(kind==="tan")return 1/Math.cos(u)**2;
 if(kind==="sec")return Math.sin(u)/Math.cos(u)**2;if(kind==="csc")return-Math.cos(u)/Math.sin(u)**2;return-1/Math.sin(u)**2;
}
const logKinds=new Set(),logStyles=new Set();let trigOfLog=0;
for(let i=0;i<50000;i++){
 const problem=qa.generate("logarithmic","prior-combinations"),label=`logarithmic/${problem.family}`;
 if(!problem.argumentStyle?.startsWith("trig-of-log-"))continue;
 trigOfLog++;logKinds.add(problem.trigKind);logStyles.add(problem.argumentStyle);
 assert(problem.logArgumentValue>=2&&problem.logArgumentValue<=4,`${label}: log argument is not a controlled positive value`);
 assert(problem.interiorTermCount===(problem.argumentStyle.endsWith("quadratic")?3:2),`${label}: polynomial argument does not have the intended number of terms`);
 assert(problem.math.includes(`\\${problem.trigKind}\\left(\\ln\\left(`),`${label}: displayed form is not trig(log(polynomial)): ${problem.math}`);
 const coefficients=problem.logInnerCoefficients,x=Number(problem.evaluationPoint),slope=coefficients.slice(1).reduce((sum,c,power)=>sum+c*(power+1)*x**power,0),expected=outerDerivative(problem.trigKind,Math.log(problem.logArgumentValue))*slope/problem.logArgumentValue,actual=parser.evaluate(parser.parse(problem.answerExpr),{});
 assert(Number.isFinite(actual)&&Math.abs(actual-expected)<1e-9,`${label}: answer ${actual} does not match independent derivative ${expected}`);
 assert(!leadingPlus.test(problem.math),`${label}: leading plus remains: ${problem.math}`);
}
assert(trigOfLog>23500&&trigOfLog<26500,`trig-of-log share ${(100*trigOfLog/50000).toFixed(2)}%, expected about 50% of the combination focus`);
for(const kind of ["sin","cos","tan","sec","csc","cot"])assert(logKinds.has(kind),`trig-of-log: ${kind} never appeared`);
for(const style of ["trig-of-log-linear","trig-of-log-quadratic"])assert(logStyles.has(style),`trig-of-log: ${style} never appeared`);

const generatorSource=source("topic-derivative-at-point-practice.js");
assert(generatorSource.includes('const lin=(a,b=0)=>{let out='),"robust linear formatter is missing");
assert(generatorSource.includes('const quad=(a,b,c=0)=>{let out='),"robust quadratic formatter is missing");

console.log("BatchMath v10.9.L derivative-at-point refinement QA");
console.log(`Result: ${errors.length?"FAIL":"PASS"}`);
console.log(`Checks: ${checks}`);
console.log(`Trig-of-log samples: ${trigOfLog}; kinds: ${[...logKinds].sort().join(", ")}; styles: ${[...logStyles].sort().join(", ")}`);
console.log(`Inverse-trig kinds: ${[...inverseKinds].sort().join(", ")}`);
console.log(`Errors: ${errors.length}`);for(const error of errors)console.log(`- ${error}`);if(errors.length)process.exit(1);
