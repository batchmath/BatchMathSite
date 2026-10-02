#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const errors=[];let checks=0;
const assert=(condition,message)=>{checks++;if(!condition&&errors.length<300)errors.push(message)};
const source=name=>fs.readFileSync(path.join(ROOT,"assets",name),"utf8");

function harness(scriptName,seedStart,topicStage="power"){
 const elements=new Map(),listeners=new Map();let seed=seedStart;
 function element(id){
  if(elements.has(id))return elements.get(id);const events=new Map();
  const node={id,value:id==="practice-type"?"mixed":"",disabled:false,innerHTML:"",textContent:"",className:"",hidden:false,style:{display:""},
   get selectedOptions(){return[{textContent:this.value}]},addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn)},focus(){},setAttribute(name,value=""){this[name]=value}};
  elements.set(id,node);return node;
 }
 const context={console,Math,URLSearchParams,location:{search:""},document:{getElementById:element,querySelectorAll(){return[]},addEventListener(){}},BM_TOPIC_AT_POINT_CONFIG:{stage:topicStage}};
 context.window=context;context.globalThis=context;context.addEventListener=(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)};
 context.BatchMathRNG={random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}};
 context.BatchMathCalculusKeypad={reset(){},focus(){}};context.BMAnalytics={ensurePracticeStarted(){},problemGenerated(){},answerChecked(){},solutionRevealed(){}};
 vm.createContext(context);vm.runInContext(source("answer-normalization.js"),context,{filename:"answer-normalization.js"});vm.runInContext(source("derivative-expression-checker.js"),context,{filename:"derivative-expression-checker.js"});vm.runInContext(source(scriptName),context,{filename:scriptName});
 return context;
}

const noNegativeFraction=problem=>!/[\\]frac\{\s*-/.test([problem.math,problem.answerTex,...problem.steps].join(" "));
const centeredScaffold=/\d+\\left\(x(?:\^\{?[23]\}?)?\s*[+-]/;

const topic=harness("topic-derivative-at-point-practice.js",1091101),topicQA=topic.BatchMathTopicAtPointQA,parser=topic.BatchMathDerivativeExpressions;
const argumentStyles=new Set(),quotientFocuses=new Set();
for(const [stage,config] of Object.entries(topicQA.stages)){
 for(const [focus] of config.options){
  for(let i=0;i<2400;i++){
   const problem=topicQA.generate(stage,focus);const label=`${stage}/${focus}/${problem.family}`;
   assert(noNegativeFraction(problem),`${label}: negative sign remains inside a displayed fraction numerator: ${[problem.math,problem.answerTex,...problem.steps].join(" ")}`);
   assert(!centeredScaffold.test(problem.math),`${label}: artificial centered scaffold remains: ${problem.math}`);
   assert(!/\^\{\\frac\{\s*-/.test(problem.math),`${label}: fractional exponent keeps its sign inside the numerator`);
   assert(parser.equivalent(problem.answerExpr,problem.answerExpr,[{}]),`${label}: answer no longer parses`);
   if(problem.argumentStyle)argumentStyles.add(problem.argumentStyle);
   if(stage==="quotient"){
    quotientFocuses.add(problem.focus);
    assert(problem.polynomialQuotient===true,`${label}: quotient is not marked polynomial-over-polynomial`);
    assert((problem.functionTypes||[]).every(type=>type==="algebraic"),`${label}: a non-polynomial function type leaked into quotient practice`);
    assert(!/\\(?:sqrt|sin|cos|tan|sec|csc|cot|ln|log)|e\^|\^\{-/.test(problem.math),`${label}: quotient contains a non-polynomial family: ${problem.math}`);
   }
  }
 }
}
for(const focus of ["linear-linear","polynomial-linear","linear-polynomial","polynomial-polynomial"])assert(quotientFocuses.has(focus),`quotient: ${focus} focus never appeared`);
for(const oldFocus of ["negative","radical","mixed-power"])assert(!quotientFocuses.has(oldFocus),`quotient: retired ${oldFocus} focus still appears`);
assert(argumentStyles.has("expanded-linear"),"trig/chain: clean scaled-linear arguments never appeared");
assert(argumentStyles.has("expanded-polynomial"),"trig/chain: expanded polynomial arguments never appeared");
assert(!source("topic-derivative-at-point-practice.js").includes("centeredLinearFactor"),"topic generator still contains the centered-linear helper");

const comprehensive=harness("derivative-at-point-practice.js",1091102),reviewQA=comprehensive.BatchMathAtPointQA,reviewParser=comprehensive.BatchMathDerivativeExpressions;
let scaledTrig=0,quadraticTrig=0;
for(const [group,generator] of Object.entries(reviewQA.generators)){
 for(let i=0;i<9000;i++){
  const problem=generator(),label=`review/${group}/${problem.family}`;
  assert(noNegativeFraction(problem),`${label}: negative sign remains inside a displayed fraction numerator`);
  assert(!centeredScaffold.test(problem.math),`${label}: artificial centered scaffold remains: ${problem.math}`);
  assert(problem.pointStyle!=="shifted-numeric",`${label}: retired shifted-numeric trig family remains`);
  assert(reviewParser.equivalent(problem.answerExpr,problem.answerExpr,[{}]),`${label}: answer no longer parses`);
  if(problem.pointStyle==="scaled-familiar")scaledTrig++;
  if(problem.pointStyle==="quadratic-exact")quadraticTrig++;
 }
}
assert(scaledTrig>4000,"review trig: clean scaled familiar-angle family did not appear often enough");
assert(quadraticTrig>2000,"review trig: quadratic exact-angle family did not remain available");
assert(!source("derivative-at-point-practice.js").includes("shifted-numeric"),"Comprehensive Review still contains the shifted-numeric trig family");

const answerContext={window:null,document:{querySelectorAll(){return[]},addEventListener(){}}};answerContext.window=answerContext;vm.createContext(answerContext);vm.runInContext(source("answer-normalization.js"),answerContext,{filename:"answer-normalization.js"});
const normalize=answerContext.BatchMathAnswers?.normalizeTexFractionSigns;
assert(typeof normalize==="function","shared TeX fraction-sign normalizer is not exported");
assert(normalize?.("x^{\\frac{-3}{2}}+\\frac{-5}{7}")==="x^{-\\frac{3}{2}}-\\frac{5}{7}","shared TeX fraction-sign normalizer did not move both signs outside");
assert(normalize?.("\\frac{-6x+2}{y}")==="-\\frac{6x-2}{y}","shared TeX fraction-sign normalizer changed a multi-term numerator incorrectly");
assert(normalize?.("A-\\frac{-6x-2}{y}")==="A+\\frac{6x+2}{y}","shared TeX fraction-sign normalizer did not simplify subtraction of a negative fraction");
assert(normalize?.(normalize("\\frac{-6x+2}{y}"))==="-\\frac{6x-2}{y}","shared TeX fraction-sign normalizer is not idempotent");

console.log("BatchMath v10.9.L derivative-at-point display QA");
console.log(`Result: ${errors.length?"FAIL":"PASS"}`);
console.log(`Checks: ${checks}`);
console.log(`Natural argument styles: ${[...argumentStyles].sort().join(", ")}`);
console.log(`Polynomial quotient focuses: ${[...quotientFocuses].sort().join(", ")}`);
console.log(`Comprehensive trig samples: scaled=${scaledTrig}, quadratic=${quadraticTrig}`);
console.log(`Errors: ${errors.length}`);for(const error of errors)console.log(`- ${error}`);if(errors.length)process.exit(1);
