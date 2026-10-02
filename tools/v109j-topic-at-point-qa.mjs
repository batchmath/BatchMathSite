#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const errors=[];let checks=0,seed=1091001;
const assert=(ok,message)=>{checks++;if(!ok)errors.push(message)};
const source=name=>fs.readFileSync(path.join(ROOT,"assets",name),"utf8");
const elements=new Map(),listeners=new Map();
function element(id){
 if(elements.has(id))return elements.get(id);const events=new Map();
 const node={id,value:id==="practice-type"?"mixed":"",disabled:false,innerHTML:"",textContent:"",className:"",hidden:false,style:{display:""},
  get selectedOptions(){return[{textContent:this.value}]},addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn)},dispatch(type,event={}){for(const fn of events.get(type)||[])fn({preventDefault(){},key:"",...event})},focus(){},setAttribute(name,value=""){this[name]=value}};
 elements.set(id,node);return node;
}
const context={console,Math,URLSearchParams,location:{search:"?bm_qa=1"},document:{getElementById:element},BM_TOPIC_AT_POINT_CONFIG:{stage:"power"}};
context.window=context;context.globalThis=context;context.addEventListener=(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)};
context.BatchMathRNG={random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}};
context.BatchMathCalculusKeypad={reset(){},focus(){}};context.BMAnalytics={ensurePracticeStarted(){},problemGenerated(){},answerChecked(){},solutionRevealed(){}};
vm.createContext(context);
vm.runInContext(source("derivative-expression-checker.js"),context,{filename:"derivative-expression-checker.js"});
vm.runInContext(source("topic-derivative-at-point-practice.js"),context,{filename:"topic-derivative-at-point-practice.js"});
const qa=context.BatchMathTopicAtPointQA,parser=context.BatchMathDerivativeExpressions;
for(const fn of listeners.get("load")||[])fn();
const firstUiProblem=context.__BM_CURRENT_PROBLEM;
element("answer").value=firstUiProblem.answerExpr;element("answer").dispatch("keydown",{key:"Enter"});
assert(firstUiProblem.answered===true,"UI: Enter did not check a valid answer");
assert(element("attempted").textContent===1,"UI: valid answer was not counted exactly once");
assert(element("feedback").innerHTML.includes("Show Explanation"),"UI: correct-answer explanation option is missing");
element("answer").dispatch("keydown",{key:"Enter"});
const secondUiProblem=context.__BM_CURRENT_PROBLEM;
assert(secondUiProblem.id!==firstUiProblem.id,"UI: second Enter did not advance to exactly one new problem");
assert(element("attempted").textContent===1,"UI: advancing with Enter changed the attempt count");
element("answer").value="9999999";element("answer").dispatch("keydown",{key:"Enter"});
assert(element("attempted").textContent===2&&element("feedback").innerHTML.includes("Step-by-step walkthrough"),"UI: wrong-answer feedback did not reveal the walkthrough");
const malformedTrig=/\\(?:sin|cos|tan|sec|csc|cot)[A-Za-z]/,coefficientOne=/(^|[^\d])(?:-?1x(?:\^|\b)|-?1\\(?:sqrt|sin|cos|tan|sec|csc|cot)\b)/,powerOne=/\^\{?1\}?(?![\d/])/;
const counts={},families={},ids={};
for(const [stage,config] of Object.entries(qa.stages)){
 counts[stage]={};families[stage]=new Set();ids[stage]=new Set();
 const allowedRules=new Set(qa.allowed[stage].rules),allowedTypes=new Set(qa.allowed[stage].types);
 for(const [focus] of config.options){
  const total=focus==="mixed"?12000:4000;counts[stage][focus]={};
  for(let i=0;i<total;i++){
   const problem=qa.generate(stage,focus),display=[problem.math,problem.answerTex,...problem.steps].join(" ");
   families[stage].add(problem.family);ids[stage].add(problem.id);counts[stage][focus][problem.focus]=(counts[stage][focus][problem.focus]||0)+1;
   assert(problem.stage===stage,`${stage}/${focus}: returned stage ${problem.stage}`);
   if(focus!=="mixed")assert(problem.focus===focus,`${stage}/${focus}: returned focus ${problem.focus}`);
   assert(problem.steps.length>=3,`${stage}/${problem.family}: walkthrough has fewer than three steps`);
   assert(!malformedTrig.test(display),`${stage}/${problem.family}: malformed trig TeX: ${display}`);
   assert(!coefficientOne.test(display),`${stage}/${problem.family}: unnecessary coefficient 1: ${display}`);
   assert(!powerOne.test(display),`${stage}/${problem.family}: displayed exponent 1: ${display}`);
   for(const rule of problem.rules||[])assert(allowedRules.has(rule),`${stage}/${problem.family}: later rule ${rule} leaked into this stage`);
   for(const type of problem.functionTypes||[])assert(allowedTypes.has(type),`${stage}/${problem.family}: later function type ${type} leaked into this stage`);
   let value=NaN;try{value=parser.evaluate(parser.parse(problem.answerExpr),{})}catch(error){errors.push(`${stage}/${problem.family}: answer does not parse: ${problem.answerExpr} (${error.message})`)}checks++;
   assert(Number.isFinite(value),`${stage}/${problem.family}: answer is not finite: ${problem.answerExpr}`);
   assert(Math.abs(value)<500,`${stage}/${problem.family}: unreasonable arithmetic result ${value}`);
   assert(parser.equivalent(problem.answerExpr,problem.answerExpr,[{}]),`${stage}/${problem.family}: expected answer is not self-equivalent`);
   if(stage==="implicit"){
    let fx,fy;try{fx=parser.evaluate(parser.parse(problem.implicitFx),{});fy=parser.evaluate(parser.parse(problem.implicitFy),{})}catch(_){fx=fy=NaN}
    assert(Number.isFinite(fx)&&Number.isFinite(fy)&&Math.abs(fy)>1e-10,`${stage}/${problem.family}: invalid implicit partial values`);
    assert(Math.abs(value+fx/fy)<1e-7,`${stage}/${problem.family}: implicit answer does not equal -Fx/Fy`);
   }
  }
 }
 const mixedGroups=Object.keys(config.groups),mixed=counts[stage].mixed;
 for(const group of mixedGroups){const share=(mixed[group]||0)/12000,target=1/mixedGroups.length;assert(Math.abs(share-target)<.025,`${stage}: mixed ${group} share ${(100*share).toFixed(1)}%, expected about ${(100*target).toFixed(1)}%`)}
 assert(ids[stage].size>=stage==="implicit"?35:50,`${stage}: only ${ids[stage].size} distinct seeded problems`);
}

const trigKinds=new Set(),inverseKinds=new Set();
for(let i=0;i<12000;i++){
 const trig=qa.generate("trig","direct");trigKinds.add(trig.trigKind);
 const inv=qa.generate("inverse-trig","all-six");inverseKinds.add(inv.invKind);
}
for(const kind of ["sin","cos","tan","sec","csc","cot"])assert(trigKinds.has(kind),`trig: ${kind} never appeared in direct practice`);
for(const kind of ["asin","acos","atan","acot","asec","acsc"])assert(inverseKinds.has(kind),`inverse trig: ${kind} never appeared in all-six practice`);

const pages=[
 ["derivatives-with-the-power-rule","power","ap_power_rule_at_point"],
 ["the-product-rule","product","ap_product_rule_at_point"],
 ["the-quotient-rule","quotient","ap_quotient_rule_at_point"],
 ["derivatives-of-trigonometric-functions","trig","ap_trig_derivatives_at_point"],
 ["the-chain-rule","chain","ap_chain_rule_at_point"],
 ["exponential-functions","exponential","ap_exponential_at_point"],
 ["implicit-differentiation","implicit","ap_implicit_at_point"],
 ["derivatives-of-logarithmic-functions","logarithmic","ap_logarithmic_at_point"],
 ["inverse-trigonometric-functions","inverse-trig","ap_inverse_trig_at_point"]
];
const analyticsIds=new Set();
for(const [slug,stage,engineId] of pages){
 const topicRel=`ap-calculus/unit-2-derivatives/topics/${slug}/index.html`,practiceRel=`ap-calculus/unit-2-derivatives/topics/${slug}/derivative-at-a-point-practice/index.html`;
 const topic=fs.readFileSync(path.join(ROOT,topicRel),"utf8"),practice=fs.readFileSync(path.join(ROOT,practiceRel),"utf8");
 assert(topic.includes('href="derivative-at-a-point-practice/"'),`${slug}: topic page is missing the at-a-point companion link`);
 assert(topic.includes('<span class="bm-deriv-num">d²y</span><span class="bm-deriv-den">dx²</span>'),`${slug}: at-a-point companion is not labeled d²y/dx²`);
 assert(practice.includes(`BM_TOPIC_AT_POINT_CONFIG={stage:"${stage}"}`),`${slug}: wrong or missing curriculum-stage configuration`);
 assert(practice.includes(`engineId:"${engineId}"`),`${slug}: wrong analytics engine ID`);analyticsIds.add(engineId);
 assert(practice.includes('id="practice-type"')&&practice.includes('>Practice Type</label>'),`${slug}: Practice Type selector is missing`);
 assert(practice.includes('data-bm-calc-keypad="derivative"'),`${slug}: shared derivative keypad is missing`);
 assert(practice.includes('assets/derivative-expression-checker.js')&&practice.includes('assets/topic-derivative-at-point-practice.js'),`${slug}: shared parser/generator infrastructure is not loaded`);
}
assert(analyticsIds.size===pages.length,`topic derivative-at-point pages use only ${analyticsIds.size} distinct analytics IDs`);
const chainTopic=fs.readFileSync(path.join(ROOT,"ap-calculus/unit-2-derivatives/topics/the-chain-rule/index.html"),"utf8");
const chainOrder=[chainTopic.indexOf('href="practice/"'),chainTopic.indexOf('href="derivative-at-a-point-practice/"'),chainTopic.indexOf('href="nested-chain-rule-practice/"')];
assert(chainOrder.every(index=>index>=0)&&chainOrder[0]<chainOrder[1]&&chainOrder[1]<chainOrder[2],"Chain Rule engines are not ordered regular, at-a-point, nested");
assert(chainTopic.includes('<span class="bm-deriv-num">d³y</span><span class="bm-deriv-den">dx³</span></span><span class="bm-practice-label">Nested Chain Rule Practice</span>'),"Nested Chain Rule was not moved to the d³y/dx³ third-engine label");

const hash=rel=>crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT,rel))).digest("hex");
assert(hash("ap-calculus/unit-2-derivatives/topics/comprehensive-review/derivatives-at-a-point-practice/index.html")==="737e34224ee3a859903951b18a4910ad8c6882fe00ea24474fd9d1b1d5635026","Comprehensive Review derivative-at-point page was changed");

console.log("BatchMath v10.9.L curriculum-aware derivative-at-point QA");
console.log(`Result: ${errors.length?"FAIL":"PASS"}`);console.log(`Checks: ${checks}`);
for(const stage of Object.keys(qa.stages))console.log(`${stage}: ${ids[stage].size} distinct IDs; families ${[...families[stage]].sort().join(", ")}`);
console.log(`Direct trig coverage: ${[...trigKinds].sort().join(", ")}`);console.log(`Inverse-trig coverage: ${[...inverseKinds].sort().join(", ")}`);
console.log(`Errors: ${errors.length}`);for(const error of errors.slice(0,120))console.log(`- ${error}`);if(errors.length)process.exit(1);
