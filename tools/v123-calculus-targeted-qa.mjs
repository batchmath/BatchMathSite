#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const errors=[];
const stats={};
const expect=(value,message)=>{if(!value)errors.push(message);};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function generatorContext(seed){
  const sandbox={window:{BatchMathRNG:{random:rng(seed)}},console,Math};
  vm.createContext(sandbox);
  for(const file of ["assets/ap-topic-generators.js","assets/unit3-applications-generators.js"]){
    vm.runInContext(fs.readFileSync(path.join(ROOT,file),"utf8"),sandbox);
  }
  return sandbox;
}

{
  const sandbox=generatorContext(1203001);
  const generate=sandbox.window.BatchMathAPTopicGenerators.get("tangent-and-secant-line-approximations");
  for(let index=0;index<10000;index++){
    const problem=generate({});
    expect(problem.stage1?.prompt==="Part 1: Find the approximation.",`approximation wording drifted in ${problem.id}`);
  }
  const parserSandbox={window:{},console,Math};
  vm.createContext(parserSandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT,"assets/derivative-expression-checker.js"),"utf8"),parserSandbox);
  const parser=parserSandbox.window.BatchMathDerivativeExpressions;
  for(const [received,expected] of [
    ["ln(3^2)","2*ln(3)"],
    ["ln(2^3)","3*ln(2)"],
    ["ln(25)","2*ln(5)"],
    ["ln(2*sqrt(3))","ln(2)+ln(3)/2"]
  ])expect(parser.equivalent(received,expected,[{}],1e-8),`equivalent logarithmic answer rejected: ${received} versus ${expected}`);
  stats.approximation={samples:10000,logEquivalenceCases:4};
}

{
  const modeStats={};
  for(const mode of ["both","mvt","rolle"]){
    let total=0,applicable=0;
    const families=new Set(),templates=new Set();
    for(let session=1;session<=12;session++){
      const sandbox=generatorContext((session*2654435761+(mode==="mvt"?17:mode==="rolle"?41:73))>>>0);
      const generate=sandbox.window.BatchMathAPTopicGenerators.get("rolle-s-theorem-and-the-mean-value-theorem");
      const recentFamilies=[],recentTemplates=[];
      for(let index=0;index<500;index++){
        const problem=generate({mvtMode:mode});
        const family=problem.theoremFunctionFamily,template=problem.theoremTemplateSignature;
        expect(Boolean(family&&template),`theorem variety metadata missing in ${problem.id}`);
        expect(!recentFamilies.slice(-7).includes(family),`${mode}: family repeated within seven questions: ${family}`);
        expect(!recentTemplates.slice(-7).includes(template),`${mode}: template repeated within seven questions: ${template}`);
        recentFamilies.push(family);recentTemplates.push(template);
        families.add(family);templates.add(template);total++;if(problem.theoremApplies)applicable++;
      }
    }
    const share=applicable/total;
    expect(share>.72&&share<.78,`${mode}: theorem applicability share drifted to ${share.toFixed(4)}`);
    expect(families.size>=10,`${mode}: too few theorem function families sampled (${families.size})`);
    expect(templates.size>=20,`${mode}: too few theorem templates sampled (${templates.size})`);
    modeStats[mode]={samples:total,applicabilityShare:share,families:families.size,templates:templates.size};
  }
  stats.theoremVariety=modeStats;
}

{
  const sandbox=generatorContext(1203999);
  const generate=sandbox.window.BatchMathAPTopicGenerators.get("l-hopital-s-rule");
  const variants=new Set(),repeatedIds=new Map();
  let applicable=0;
  for(let index=0;index<100000;index++){
    const problem=generate({});
    variants.add(problem.variant);
    if(!problem.lhopitalApplies)continue;
    applicable++;
    const explanation=String(problem.stage2?.explanation||"");
    const steps=(explanation.match(/<strong>Step \d+:<\/strong>/g)||[]).length;
    expect(explanation.includes("Separately differentiate the numerator and denominator"),`L'Hopital wording is not explicit in ${problem.id}`);
    expect(!/(?:successive numerator derivatives|Each application lowers|After \d+ applications|Differentiate to get|Differentiate once:|Differentiate again:)/.test(explanation),`L'Hopital rounds are compressed in ${problem.id}`);
    expect(steps>=1,`L'Hopital worked steps missing in ${problem.id}`);
    if(problem.variant==="lhopital_infinity_polynomial_exponential"||problem.variant==="lhopital_product_exponential_decay"){
      repeatedIds.set(problem.id,steps);
      const expected=Number(problem.id.match(/-(\d+)$/)?.[1]);
      expect(steps===expected,`${problem.id}: expected ${expected} explicit derivative rounds, found ${steps}`);
    }
    const minimumSteps={
      lhopital_zero_cosine:2,
      lhopital_zero_repeated_exponential:2,
      lhopital_zero_log_trig_composition:2,
      lhopital_zero_trig_remainder:3,
      lhopital_zero_logarithmic_trig_difference:2,
      lhopital_zero_trig_difference:3,
      lhopital_product_radical_exponential:2
    }[problem.variant];
    if(minimumSteps)expect(steps>=minimumSteps,`${problem.id}: repeated applications are missing (${steps}/${minimumSteps})`);
  }
  for(const id of [
    "u3-lh-inf-poly-exp-2","u3-lh-inf-poly-exp-3","u3-lh-inf-poly-exp-4","u3-lh-inf-poly-exp-5",
    "u3-lh-product-exp-decay-1","u3-lh-product-exp-decay-2","u3-lh-product-exp-decay-3","u3-lh-product-exp-decay-4"
  ])expect(repeatedIds.has(id),`repeated L'Hopital family was not sampled: ${id}`);
  expect(variants.size>=42,`only ${variants.size} L'Hopital families sampled`);
  stats.lhopital={samples:100000,applicable,variants:variants.size,repeatedExamples:repeatedIds.size};
}

{
  const renderer=fs.readFileSync(path.join(ROOT,"assets/ap-topic-practice.js"),"utf8");
  expect(/finishProblem\(current\.stage1Correct&&ok,note,ok\)/.test(renderer),"Part 2 result is not passed to the advancement guard");
  expect(/current\.requirePhysicalNextClick=!lastStageOk/.test(renderer),"wrong Part 2 does not require a physical Next click");
  expect(/pointerdown[^\n]+nextPointerArmed=true/.test(renderer),"physical Next click is not armed by pointer input");
  expect(/current\?\.requirePhysicalNextClick&&!current\.nextPointerArmed/.test(renderer),"synthetic/Enter Next click guard is missing");
  expect(/stopImmediatePropagation\(\)/.test(renderer),"capture-phase Enter blocking is missing");
  expect(/current\.enterAdvanceAllowed=Boolean\(lastStageOk\)/.test(renderer),"correct Part 2 Enter-to-next behavior is not preserved");
  stats.stagedFlow={staticGuards:6};
}

{
  const keypad=fs.readFileSync(path.join(ROOT,"assets/calculus-keypad.js"),"utf8");
  const css=fs.readFileSync(path.join(ROOT,"assets/calculus-keypad.css"),"utf8");
  expect((keypad.match(/bm-calc-balanced-row/g)||[]).length>=6,"shared keypad rows were not balanced");
  expect(/display:flex;flex-wrap:wrap;justify-content:center/.test(css),"balanced keypad wrapping/centering is missing");
  expect(/bm-calc-main-grid\{display:flex;flex-wrap:wrap;justify-content:center/.test(css),"partial numeric rows are not centered");
  expect(/@media\(max-width:760px\)/.test(css)&&/bm-calc-utility-row\.bm-calc-balanced-row/.test(css),"mobile keypad layout support is missing");
  stats.keypadLayout={balancedRows:(keypad.match(/bm-calc-balanced-row/g)||[]).length};
}

{
  const reviewPath=path.join(ROOT,"ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/assignment-practice/index.html");
  const review=fs.readFileSync(reviewPath,"utf8");
  for(const slug of ["tangent-and-secant-line-approximations","rolle-s-theorem-and-the-mean-value-theorem","l-hopital-s-rule"]){
    expect(review.includes(`"${slug}"`),`Comprehensive Review omits ${slug}`);
  }
  for(const asset of ["/assets/unit3-applications-generators.js","/assets/ap-topic-practice.js","/assets/calculus-keypad.js"]){
    expect(review.includes(asset),`Comprehensive Review does not share ${asset}`);
  }
  expect(fs.existsSync(path.join(ROOT,".github/workflows/batchmath-qa.yml")),".github/workflows/batchmath-qa.yml is missing");
  stats.review={sharedFamilies:3,workflowPreserved:true};
}

const report={ok:errors.length===0,errors,stats};
fs.mkdirSync(path.join(ROOT,"qa-results"),{recursive:true});
fs.writeFileSync(path.join(ROOT,"qa-results/v123-calculus-targeted-qa.json"),JSON.stringify(report,null,2)+"\n");
if(errors.length){
  console.error(errors.slice(0,100).join("\n"));
  console.error(`FAILED with ${errors.length} error(s)`);
  process.exit(1);
}
console.log(JSON.stringify(stats,null,2));
console.log("Version 12.3 targeted calculus QA passed.");
