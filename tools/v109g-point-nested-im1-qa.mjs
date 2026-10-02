#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const errors=[];let checks=0;
const assert=(condition,message)=>{checks++;if(!condition)errors.push(message);};
const source=name=>fs.readFileSync(path.join(ROOT,"assets",name),"utf8");

function harness(scriptName,seedStart=1090701){
  const elements=new Map(),listeners=new Map();let seed=seedStart;
  function element(id){
    if(elements.has(id))return elements.get(id);
    const events=new Map();
    const node={id,value:id==="practice-type"?"mixed":"",disabled:false,innerHTML:"",textContent:"",className:"",hidden:false,style:{display:""},
      get selectedOptions(){return[{textContent:this.value}]},
      addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn);},
      dispatch(type,event={}){for(const fn of events.get(type)||[])fn({preventDefault(){},key:"",...event});},
      focus(){},setAttribute(name,value=""){this[name]=value;}
    };
    elements.set(id,node);return node;
  }
  const context={console,Math,URLSearchParams,location:{search:"?bm_qa=1"},document:{getElementById:element}};
  context.window=context;context.globalThis=context;
  context.addEventListener=(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);};
  context.BatchMathRNG={random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}};
  context.BatchMathCalculusKeypad={reset(){},focus(){}};
  context.BMAnalytics={ensurePracticeStarted(){},problemGenerated(){},answerChecked(){},solutionRevealed(){}};
  vm.createContext(context);
  vm.runInContext(source("derivative-expression-checker.js"),context,{filename:"derivative-expression-checker.js"});
  vm.runInContext(source(scriptName),context,{filename:scriptName});
  for(const fn of listeners.get("load")||[])fn();
  return context;
}

const at=harness("derivative-at-point-practice.js");
const checker=at.BatchMathDerivativeExpressions,atQA=at.BatchMathAtPointQA;
const display=problem=>[problem.math,problem.answerTex,...problem.steps].join(" ");
const badTrigCommand=/\\(?:sin|cos|tan|sec|csc|cot)[A-Za-z]/;
for(const [group,generator] of Object.entries(atQA.generators)){
  const families=new Set();
  for(let i=0;i<12000;i++){
    const problem=generator();families.add(problem.family);
    assert(problem.group===group,`${group}: returned ${problem.group}`);
    assert(!badTrigCommand.test(display(problem)),`${group}/${problem.family}: malformed TeX trig command in ${display(problem)}`);
    assert(checker.equivalent(problem.answerExpr,problem.answerExpr,[{}]),`${group}/${problem.family}: answer expression does not parse: ${problem.answerExpr}`);
    assert(problem.steps.length>=3,`${group}/${problem.family}: walkthrough is incomplete`);
    assert(!/(^|[^0-9])1x(?:\^|\b)/.test(display(problem)),`${group}/${problem.family}: displayed coefficient 1`);
  }
  assert(families.size>=3,`${group}: only ${families.size} families appeared`);
}

let polynomialQuotients=0;
for(let i=0;i<50000;i++){
  const problem=atQA.generators.quotient();
  if(problem.polynomialQuotient)polynomialQuotients++;
  assert(problem.usesChain===false,`quotient/${problem.family}: chain-rule problem leaked into the focused quotient group`);
}
const polynomialShare=polynomialQuotients/50000;
assert(polynomialShare>.235&&polynomialShare<.265,`polynomial-over-polynomial quotient share ${(100*polynomialShare).toFixed(2)}%, expected about 25%`);
for(let i=0;i<20000;i++){
  const problem=atQA.generators.product();
  assert(problem.usesChain===false,"product: chain-rule problem leaked into the focused product group");
  const statement=problem.math.split("\\quad")[0];
  assert(statement.startsWith("y=\\left(")&&statement.includes("\\right)\\left(")&&statement.endsWith("\\right),"),`product/${problem.family}: the two factors are not each parenthesized: ${problem.math}`);
  if(problem.family==="inverse-trig-polynomial"){
    assert(statement.includes("\\left(\\tan^{-1}x\\right)"),`product: inverse tangent factor is not written as (tan^-1 x): ${problem.math}`);
    assert(!statement.includes("\\tan^{-1}\\left(x\\right)"),`product: old tan^-1(x) display remains: ${problem.math}`);
  }
  if(problem.family==="polynomial-logarithmic"||problem.family==="logarithmic-trig")assert(statement.includes("\\left(\\ln x\\right)"),`product: logarithm factor is not written as (ln x): ${problem.math}`);
}

let trigNonZero=0,quadraticExact=0;const trigKinds={};
for(let i=0;i<40000;i++){
  const problem=atQA.generators.trig();
  trigKinds[problem.trigKind]=(trigKinds[problem.trigKind]||0)+1;
  if(problem.evaluationPoint!=="0")trigNonZero++;
  if(problem.pointStyle==="quadratic-exact")quadraticExact++;
  assert(problem.usesChain===true,`trig/${problem.family}: missing chain rule`);
}
assert(trigNonZero/40000>.9,`trig: only ${(100*trigNonZero/40000).toFixed(1)}% use nonzero evaluation points`);
assert(quadraticExact/40000>.32&&quadraticExact/40000<.38,`trig: quadratic exact-point share ${(100*quadraticExact/40000).toFixed(1)}%`);
for(const kind of ["sin","cos","tan"])assert(trigKinds[kind]/40000>.18&&trigKinds[kind]/40000<.22,`trig ${kind}: unexpected share`);
for(const kind of ["sec","csc","cot"])assert(trigKinds[kind]/40000>.115&&trigKinds[kind]/40000<.15,`trig ${kind}: unexpected share`);

let exponentialNonZero=0;const exponentialFamilies=new Set();
for(let i=0;i<25000;i++){const problem=atQA.generators.exponential();exponentialFamilies.add(problem.family);if(problem.evaluationPoint!=="0")exponentialNonZero++;}
assert(exponentialFamilies.has("e-cubic"),"exponential: test-like cubic exponent family never appeared");
assert(exponentialNonZero/25000>.68,`exponential: nonzero evaluation-point share only ${(100*exponentialNonZero/25000).toFixed(1)}%`);

const inverseInteriors={monomial:0,polynomial:0,nonpolynomial:0},nonPolynomialArguments=new Set();
for(let i=0;i<30000;i++){
  const problem=atQA.generators.invtrig();inverseInteriors[problem.interiorType]++;
  if(problem.interiorType==="nonpolynomial"){
    nonPolynomialArguments.add(problem.argumentFamily);
    assert(problem.usesChain===true,`inverse trig/${problem.argumentFamily}: chain-rule flag missing`);
  }else assert(!/\\frac\{[^{}]+\}\{\d+\}/.test(problem.math.split("\\quad")[0]),`inverse trig: arbitrary denominator remains in polynomial argument: ${problem.math}`);
}
assert(inverseInteriors.nonpolynomial/30000>.135&&inverseInteriors.nonpolynomial/30000<.165,`inverse trig: non-polynomial share ${(100*inverseInteriors.nonpolynomial/30000).toFixed(1)}%, expected about 15%`);
assert(inverseInteriors.monomial/30000>.32&&inverseInteriors.monomial/30000<.36,`inverse trig: monomial share ${(100*inverseInteriors.monomial/30000).toFixed(1)}%, expected about 34% overall`);
assert(inverseInteriors.polynomial/30000>.48&&inverseInteriors.polynomial/30000<.54,`inverse trig: polynomial share ${(100*inverseInteriors.polynomial/30000).toFixed(1)}%, expected about 51% overall`);
assert(nonPolynomialArguments.size===13,`inverse trig: found ${nonPolynomialArguments.size} of 13 non-polynomial argument families`);

const implicitFamilies=new Set(),testLikeImplicit=new Set();
for(let i=0;i<24000;i++){const problem=atQA.generators.implicit();implicitFamilies.add(problem.family);if(problem.testLike)testLikeImplicit.add(problem.family);}
for(const family of ["test-linear-cubic","assignment-polynomial","assignment-sine","assignment-trig","assignment-rational"])assert(implicitFamilies.has(family),`implicit: ${family} never appeared`);
assert(testLikeImplicit.size>=5,`implicit: only ${testLikeImplicit.size} test/assignment-like families appeared`);

const composites=new Set();
for(let i=0;i<20000;i++){const problem=atQA.mixedCompositeProblem();composites.add(problem.family);assert(!badTrigCommand.test(display(problem)),`mixed/${problem.family}: malformed trig TeX`);}
for(const family of ["test-product-trig","powered-trig-at-point"])assert(composites.has(family),`mixed: ${family} never appeared`);

const nested=harness("nested-chain-rule-practice.js",1090702),nestedQA=nested.BatchMathNestedChainQA;
const operations=new Set(),innerStyles=new Set();let cotProblems=0;
for(const [group,generator] of Object.entries(nestedQA.generators)){
  const ids=new Set();
  for(let i=0;i<12000;i++){
    const problem=generator();ids.add(problem.id);
    for(const operation of problem.operations){operations.add(operation);if(operation==="cot")cotProblems++;assert(!["sec","csc"].includes(operation),`${group}: forbidden ${operation} layer generated`);}
    for(const style of ["linear","affine","quadratic","cubic","power-affine"])if(problem.innerId.includes(style))innerStyles.add(style);
    assert(problem.operations.length<=5,`${group}: exceeded five chain-rule layers`);
    let parses=true;try{checker.parse(problem.answerExpr);}catch(_){parses=false;}
    assert(parses,`${group}: answer expression does not parse: ${problem.answerExpr}`);
  }
  assert(ids.size>=25,`${group}: only ${ids.size} distinct IDs in seeded sample`);
}
assert(operations.has("cot"),"nested chain: cotangent never appeared");
assert(cotProblems>4000,`nested chain: cotangent appeared only ${cotProblems} times`);
for(const style of ["linear","affine","quadratic","cubic","power-affine"])assert(innerStyles.has(style),`nested chain: ${style} inner arguments never appeared`);

const im1JS=source("im1-unit3-practice.js"),im1CSS=source("im1-unit3.css");
assert(im1JS.includes("fields.length===1?'is-single-field'"),"IM1 Unit 3: single explicit-formula field is not tagged for centering");
assert(im1CSS.includes(".bm-u3-field-grid.is-single-field"),"IM1 Unit 3: centered single-field CSS is missing");
for(const rel of [
  "im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/explicit-formulas-arithmetic-sequences/practice/index.html",
  "im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/section-a-review/practice/index.html",
  "im1/unit-3-linear-equation/topics/comprehensive-review/practice/index.html"
])assert(fs.readFileSync(path.join(ROOT,rel),"utf8").includes("/assets/im1-unit3.css"),`${rel}: shared Unit 3 styling is not loaded`);

const topicFiles=fs.readdirSync(path.join(ROOT,"ap-calculus/unit-2-derivatives/topics"),{withFileTypes:true})
  .filter(entry=>entry.isDirectory()).map(entry=>path.join(ROOT,"ap-calculus/unit-2-derivatives/topics",entry.name,"index.html")).filter(file=>fs.existsSync(file));
let dyIcons=0,secondIcons=0,thirdIcons=0,oldIcons=0;
for(const file of topicFiles){const html=fs.readFileSync(file,"utf8");dyIcons+=(html.match(/<span class="bm-deriv-num">dy<\/span><span class="bm-deriv-den">dx<\/span>/g)||[]).length;secondIcons+=(html.match(/<span class="bm-deriv-num">d²y<\/span><span class="bm-deriv-den">dx²<\/span>/g)||[]).length;thirdIcons+=(html.match(/<span class="bm-deriv-num">d³y<\/span><span class="bm-deriv-den">dx³<\/span>/g)||[]).length;oldIcons+=(html.match(/<span class="bm-deriv-num">(?:d|f′|d²)<\/span>/g)||[]).length;}
assert(dyIcons===13,`derivative topic buttons: found ${dyIcons} dy/dx first-engine icons, expected 13`);
assert(secondIcons===2,`derivative topic buttons: found ${secondIcons} d²y/dx² second-engine icons, expected 2`);
assert(thirdIcons===1,`derivative topic buttons: found ${thirdIcons} d³y/dx³ third-engine icons, expected 1`);
assert(oldIcons===0,`derivative topic buttons: ${oldIcons} incomplete or old derivative icons remain`);
const comprehensiveHtml=fs.readFileSync(path.join(ROOT,"ap-calculus/unit-2-derivatives/topics/comprehensive-review/index.html"),"utf8");
const comprehensiveOrder=["dy</span><span class=\"bm-deriv-den\">dx","d²y</span><span class=\"bm-deriv-den\">dx²","d³y</span><span class=\"bm-deriv-den\">dx³"].map(token=>comprehensiveHtml.indexOf(token));
assert(comprehensiveOrder.every(index=>index>=0)&&comprehensiveOrder[0]<comprehensiveOrder[1]&&comprehensiveOrder[1]<comprehensiveOrder[2],"Comprehensive Review buttons are not ordered dy/dx, d²y/dx², d³y/dx³");

console.log("BatchMath v10.9.I targeted derivative/IM1 QA");
console.log(`Result: ${errors.length?"FAIL":"PASS"}`);
console.log(`Checks: ${checks}`);
console.log(`Polynomial quotient share: ${(100*polynomialShare).toFixed(2)}%`);
console.log(`Trig nonzero points: ${(100*trigNonZero/40000).toFixed(1)}%; quadratic exact points: ${(100*quadraticExact/40000).toFixed(1)}%`);
console.log(`Exponential nonzero points: ${(100*exponentialNonZero/25000).toFixed(1)}%`);
console.log(`Inverse-trig interiors: monomial=${(100*inverseInteriors.monomial/30000).toFixed(1)}%, polynomial=${(100*inverseInteriors.polynomial/30000).toFixed(1)}%, non-polynomial=${(100*inverseInteriors.nonpolynomial/30000).toFixed(1)}%`);
console.log(`Non-polynomial inverse-trig arguments: ${[...nonPolynomialArguments].sort().join(", ")}`);
console.log(`Nested operations: ${[...operations].sort().join(", ")}`);
console.log(`Nested inner styles: ${[...innerStyles].sort().join(", ")}`);
console.log(`Errors: ${errors.length}`);
for(const error of errors.slice(0,100))console.log(`- ${error}`);
if(errors.length)process.exit(1);
