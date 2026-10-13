#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const errors=[];
const stats={};
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1;};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const sandbox={window:{BatchMathRNG:{random:rng(1)}},console,Math};
vm.createContext(sandbox);
for(const file of ["assets/ap-topic-generators.js","assets/unit3-applications-generators.js"])vm.runInContext(fs.readFileSync(path.join(ROOT,file),"utf8"),sandbox);
const get=slug=>sandbox.window.BatchMathAPTopicGenerators.get(slug);
function generate(slug,seed,options={}){sandbox.window.BatchMathRNG={random:rng(seed)};return get(slug)(options);}
function expect(value,message){if(!value)errors.push(message);}
function unreducedFractions(text){
  const bad=[];
  for(const match of String(text||"").matchAll(/\\frac\{(\d+)(?:\\pi)?\}\{(\d+)\}/g)){
    if(gcd(Number(match[1]),Number(match[2]))>1)bad.push(match[0]);
  }
  return bad;
}
function malformedFunctionPrompt(text){
  const expression=String(text||"");
  const marker="approximate \\(f(";
  const at=expression.indexOf(marker);
  if(at<0)return false;
  const close=expression.indexOf("\\).",at+marker.length);
  return close<0||expression[close-1]!==")";
}

{
  const methods={tangent:0,secant:0},families={tangent:new Set(),secant:new Set()};
  let secants=0,midpoints=0;
  for(let i=1;i<=30000;i++){
    const p=generate("tangent-and-secant-line-approximations",(i*2654435761)>>>0);
    const method=p.approximationMethod;
    methods[method]++;families[method].add(p.variant);
    expect(!malformedFunctionPrompt(p.questionHtml),"approximation: missing closing parenthesis in "+p.id);
    const badFractions=unreducedFractions(p.questionHtml);
    expect(!badFractions.length,"approximation: unreduced argument "+badFractions.join(", ")+" in "+p.id);
    expect(Number.isFinite(Number(p.stage1?.numericAnswer)),"approximation: non-finite answer in "+p.id);
    expect(!/(?:undefined|NaN)/.test(p.questionHtml+p.stage1.explanation),"approximation: invalid display token in "+p.id);
    expect(/Step 1:/.test(p.stage1.explanation),"approximation: worked steps are missing in "+p.id);
    if(method==="tangent")expect(p.stage1.explanation.includes("actual tangent line")||p.stage1.explanation.includes("Write the tangent line")||p.stage1.explanation.includes("Write \\(L(x)="),"approximation: actual tangent equation is missing in "+p.id);
    if(method==="secant"){
      secants++;
      const t=p.secantTargetFraction;
      expect(t&&t.n>0&&t.n<t.d,"secant: target is not strictly inside the interval in "+p.id);
      expect(t&&gcd(t.n,t.d)===1,"secant: target fraction is unreduced in "+p.id);
      if(p.secantTargetIsMidpoint)midpoints++;
      const explanation=String(p.stage1.explanation||"");
      expect(/Step 4:/.test(explanation),"secant: four-step derivation missing in "+p.id);
      expect(/m_\{\\text\{sec\}\}/.test(explanation),"secant: actual secant slope missing in "+p.id);
      expect(/S\(x\)=/.test(explanation),"secant: actual secant equation missing in "+p.id);
      expect(/Evaluate the line at the requested input/.test(explanation),"secant: target evaluation missing in "+p.id);
      const midpointAt=explanation.indexOf("midpoint"),step4At=explanation.indexOf("Step 4:");
      if(p.secantTargetIsMidpoint)expect(midpointAt>step4At,"secant: midpoint note precedes full line work in "+p.id);
      else expect(midpointAt<0,"secant: non-midpoint problem contains a midpoint shortcut in "+p.id);
    }
  }
  const midpointShare=midpoints/secants;
  expect(methods.tangent>14000&&methods.secant>14000,"approximation: tangent/secant allocation drifted "+JSON.stringify(methods));
  expect(midpointShare>.11&&midpointShare<.18,"secant: midpoint share "+midpointShare.toFixed(3)+" is not occasional");
  expect(families.tangent.size>=15,"approximation: only "+families.tangent.size+" tangent families sampled");
  expect(families.secant.size>=15,"approximation: only "+families.secant.size+" secant families sampled");
  stats.approximation={methods,midpointShare,tangentFamilies:families.tangent.size,secantFamilies:families.secant.size};
}

{
  const output={};
  for(const theorem of ["mvt","rolle"]){
    let applies=0,midpointComparable=0,midpointAnswers=0;
    const families=new Set(),applicableFamilies=new Set(),failureFamilies=new Set();
    for(let i=1;i<=25000;i++){
      const p=generate("rolle-s-theorem-and-the-mean-value-theorem",(i*2246822519+(theorem==="rolle"?71:0))>>>0,{mvtMode:theorem});
      families.add(p.variant);
      (p.theoremApplies?applicableFamilies:failureFamilies).add(p.variant);
      if(p.theoremApplies)applies++;
      expect(p.stage1?.explainOnCorrect===false&&p.stage1?.autoAdvanceOnCorrect===true,"theorem: correct Part 1 does not auto-reveal Part 2 in "+p.id);
      expect(/Step 1:/.test(p.stage1?.explanation||""),"theorem: wrong-answer hypothesis explanation is missing in "+p.id);
      if(theorem==="rolle"){
        const yes=p.stage1.choices[0]||"";
        expect(/continuous on the closed interval/i.test(yes)&&/differentiable on the open interval/i.test(yes)&&/f\(a\)=f\(b\)/.test(yes),"Rolle: affirmative choice omits a hypothesis in "+p.id);
      }
      if(p.theoremApplies){
        expect(p.stage2?.type==="exact-list"&&p.stage2.expectedValues.every(Number.isFinite),"theorem: invalid Part 2 in "+p.id);
        expect(/Step 1:/.test(p.stage2.explanation)&&/(?:Differentiat|derivative|f'|f′)/i.test(p.stage2.explanation),"theorem: c-value work is incomplete in "+p.id);
        if(Number.isFinite(p.intervalMidpointValue)){
          midpointComparable++;
          if(p.stage2.expectedValues.some(value=>Math.abs(value-p.intervalMidpointValue)<1e-9))midpointAnswers++;
        }
      }else expect(!p.stage2,"theorem: non-applicable problem has a Part 2 in "+p.id);
      expect(!/(?:NaN|\[object Object\])/.test(p.questionHtml+p.stage1.explanation+(p.stage2?.explanation||"")),"theorem: invalid display token in "+p.id);
    }
    const share=applies/25000,midpointShare=midpointComparable?midpointAnswers/midpointComparable:1;
    expect(share>.72&&share<.78,"theorem: "+theorem+" applies share "+share.toFixed(3)+" is not approximately 75%");
    expect(midpointComparable>12000,"theorem: too few asymmetric examples were sampled for "+theorem);
    expect(midpointShare<.05,"theorem: "+theorem+" midpoint share "+midpointShare.toFixed(3)+" remains predictable");
    expect(families.size>=20,"theorem: only "+families.size+" "+theorem+" families sampled");
    expect(applicableFamilies.size>=10&&failureFamilies.size>=6,"theorem: "+theorem+" applies/fails variety is too narrow");
    output[theorem]={appliesShare:share,midpointShare,families:families.size};
  }
  stats.theorems=output;
}

{
  const counts={none:0,zero:0,infinity:0,product:0},families=new Set();
  for(let i=1;i<=40000;i++){
    const p=generate("l-hopital-s-rule",(i*3266489917)>>>0);
    counts[p.lhopitalForm]++;families.add(p.variant);
    const allText=[p.questionHtml,...p.stage1.choices,p.stage1.explanation,p.stage2?.explanation||""].join(" ");
    expect(p.stage1?.explainOnCorrect===false&&p.stage1?.autoAdvanceOnCorrect===true,"LHopital: correct Part 1 does not auto-reveal Part 2 in "+p.id);
    expect(!/\\\(0\/0\\\)|\\\(\\infty\/\\infty\\\)|\\frac\s*0\s*0/.test(allText),"LHopital: flat indeterminate form remains in "+p.id);
    expect(/Step 1:/.test(p.stage1.explanation),"LHopital: specific form check missing in "+p.id);
    if(p.lhopitalApplies){
      expect(p.stage2?.type==="exact"&&p.stage2.requireExact===false,"LHopital: decimal equivalents are not enabled in "+p.id);
      expect(Number.isFinite(Number(p.stage2.numericAnswer)),"LHopital: non-finite answer in "+p.id);
      expect(/Step 1:/.test(p.stage2.explanation),"LHopital: worked limit solution missing in "+p.id);
    }else expect(!p.stage2,"LHopital: non-applicable problem has Part 2 in "+p.id);
    if(p.lhopitalForm==="product")expect(/Rewrite/i.test(p.stage1.explanation),"LHopital: product rewrite missing in "+p.id);
    expect(!/(?:undefined|NaN)/.test(allText),"LHopital: invalid display token in "+p.id);
  }
  const noShare=counts.none/40000,applicable=40000-counts.none,zeroShare=counts.zero/applicable;
  expect(noShare>.18&&noShare<.22,"LHopital: non-applicable share "+noShare.toFixed(3)+" is not 20%");
  expect(zeroShare>.77&&zeroShare<.83,"LHopital: zero-over-zero share "+zeroShare.toFixed(3)+" is not 80% of applicable problems");
  expect(counts.infinity>2500&&counts.product>2500,"LHopital: infinity/product forms are underrepresented "+JSON.stringify(counts));
  expect(families.size>=40,"LHopital: only "+families.size+" families sampled");
  stats.lhopital={counts,noShare,zeroShare,families:families.size};
}

{
  const renderer=fs.readFileSync(path.join(ROOT,"assets/ap-topic-practice.js"),"utf8");
  expect(/if\(ok&&stage1\.autoAdvanceOnCorrect\)/.test(renderer)&&/renderPart2\(\);return;/.test(renderer),"staging: correct Part 1 does not immediately reveal Part 2");
  expect(/current\.blockEnterAdvance&&!current\.enterAdvanceAllowed/.test(renderer),"staging: wrong-answer Enter guard is missing");
  expect(/stage\.requireExact\?'Enter an exact answer/.test(renderer),"LHopital: exact/decimal input messaging is not conditional");
  expect(/const direct=Number\(s\)/.test(renderer),"LHopital: leading-decimal numeric parsing is missing");
  const stageStart=renderer.indexOf(" function normalizeStageRaw");
  const stageEnd=renderer.indexOf(" function renderStageControl",stageStart);
  const stageSource=renderer.slice(stageStart,stageEnd);
  const scalar=raw=>{
    const value=String(raw||"").trim();
    if(/^[-+]?\d+\s*\/\s*[-+]?\d+$/.test(value)){
      const parts=value.split("/").map(Number);
      return parts[1]?parts[0]/parts[1]:NaN;
    }
    return Number(value);
  };
  for(const raw of ["1/10","0.1",".1"]){
    const context={exactScalarValue:scalar,parseValueList:()=>({valid:false}),Number,Math,result:null};
    vm.createContext(context);
    vm.runInContext(stageSource+';result=exactResult("'+raw+'",{requireExact:false,type:"exact",numericAnswer:0.1,tolerance:1e-9});',context);
    expect(context.result?.valid&&context.result?.ok,"LHopital: equivalent decimal/fraction entry was rejected: "+raw);
  }
  const keypad=fs.readFileSync(path.join(ROOT,"assets/calculus-keypad.js"),"utf8");
  expect(/"unit3-theorem":\{[^}]*logarithm:true/.test(keypad),"theorem: logarithm keypad support is missing");
}

{
  const review=fs.readFileSync(path.join(ROOT,"ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/assignment-practice/index.html"),"utf8");
  for(const slug of ["tangent-and-secant-line-approximations","rolle-s-theorem-and-the-mean-value-theorem","l-hopital-s-rule"])expect(review.includes('"'+slug+'"'),"review: "+slug+" is not included");
  for(const script of ["/assets/unit3-applications-generators.js","/assets/ap-topic-practice.js"])expect(review.includes(script),"review: shared "+script+" is not loaded");
  expect(fs.existsSync(path.join(ROOT,".github/workflows/batchmath-qa.yml")),"packaging: .github/workflows/batchmath-qa.yml is missing");
}

const report={ok:errors.length===0,errors,stats};
fs.mkdirSync(path.join(ROOT,"qa-results"),{recursive:true});
fs.writeFileSync(path.join(ROOT,"qa-results/v122-three-engine-targeted-qa.json"),JSON.stringify(report,null,2)+"\n");
if(errors.length){
  console.error(errors.slice(0,100).join("\n"));
  console.error("FAILED with "+errors.length+" error(s)");
  process.exit(1);
}
console.log(JSON.stringify(stats,null,2));
console.log("Version 12.2 targeted three-engine QA passed.");
