#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const errors=[];
const stats={};
const expect=(condition,message)=>{if(!condition)errors.push(message);};
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function generatorContext(seed){
  const sandbox={window:{BatchMathRNG:{random:rng(seed)}},console,Math};
  vm.createContext(sandbox);
  for(const file of ["assets/ap-topic-generators.js","assets/unit3-applications-generators.js"])vm.runInContext(read(file),sandbox,{filename:file});
  return sandbox;
}

/* Tangent/Secant: approved prompt, four-step secant work, an unnumbered
 * midpoint note, clean targets, and symbolic logarithmic equivalence. */
{
  const sandbox=generatorContext(1240101);
  const generate=sandbox.window.BatchMathAPTopicGenerators.get("tangent-and-secant-line-approximations");
  const families=new Set();let secants=0,midpoints=0,nonMidpoints=0,logCases=0,specificLogCase=false;
  const parserBox={window:{},console,Math};vm.createContext(parserBox);vm.runInContext(read("assets/derivative-expression-checker.js"),parserBox);
  const parser=parserBox.window.BatchMathDerivativeExpressions;
  expect(parser.equivalent("ln(2sqrt(3))","ln(2)+(1/2)*ln(3)",[{}],1e-8),"ln(2sqrt(3)) is not recognized as an equivalent exact logarithmic answer");
  expect(parser.equivalent("ln(3^2)","2ln(3)",[{}],1e-8),"moving a valid coefficient inside a logarithm is not accepted");
  for(let index=0;index<24000;index++){
    const problem=generate({});families.add(problem.variant);
    expect(problem.stage1?.prompt==="Part 1: Find the approximation.",`Part 1 wording drifted in ${problem.id}`);
    expect(problem.stage1?.requireExact===true,`exact-answer requirement missing in ${problem.id}`);
    expect(!/1\s*\+\s*\\frac\{?2\}?\{?5\}?\s*\\?\(?:left\)?\(?e-1/.test(problem.questionHtml||""),`ugly endpoint interpolation target leaked in ${problem.id}`);
    if(problem.approximationMethod!=="secant")continue;
    secants++;
    const explanation=String(problem.stage1?.explanation||"");
    const stepCount=(explanation.match(/<strong>Step \d+:<\/strong>/g)||[]).length;
    const noteCount=(explanation.match(/class="worked-note"/g)||[]).length;
    expect(stepCount===4,`${problem.id}: secant explanation has ${stepCount} numbered steps instead of four`);
    expect(!/Step 5:/.test(explanation),`${problem.id}: midpoint observation is still Step 5`);
    if(problem.secantTargetIsMidpoint){
      midpoints++;expect(noteCount===1&&/<strong>Note:<\/strong> Because the requested x-value is the midpoint/.test(explanation),`${problem.id}: midpoint note is missing or not separate`);
    }else{
      nonMidpoints++;expect(noteCount===0,`${problem.id}: non-midpoint problem received a midpoint note`);
    }
    if(problem.variant==="secant_log_composition"){
      logCases++;
      const t=problem.secantTargetFraction;
      expect(Array.isArray(problem.stage1.acceptedExpressions)&&problem.stage1.acceptedExpressions.length>0,`${problem.id}: logarithmic secant lacks symbolic expected forms`);
      if(t){
        const equivalent=`ln(2*3^(${t.n}/${t.d}))`;
        expect(problem.stage1.acceptedExpressions.some(answer=>parser.equivalent(equivalent,String(answer),[{}],1e-8)),`${problem.id}: equivalent combined-log form was rejected`);
        if(t.n===1&&t.d===2){
          specificLogCase=true;
          expect(problem.stage1.acceptedExpressions.some(answer=>parser.equivalent("ln(2sqrt(3))",String(answer),[{}],1e-8)),`${problem.id}: ln(2sqrt(3)) was rejected`);
        }
      }
    }
  }
  expect(families.size>=30,`only ${families.size} tangent/secant families were sampled`);
  expect(secants>10000&&midpoints>1000&&nonMidpoints>8000,`secant target variation is inadequate (${JSON.stringify({secants,midpoints,nonMidpoints})})`);
  expect(logCases>500&&specificLogCase,"logarithmic-equivalence family or its square-root form was not sampled");
  stats.tangentSecant={samples:24000,families:families.size,secants,midpoints,nonMidpoints,logCases};
}

/* MVT/Rolle: applicability stays fixed at 75%, while recent family, outer,
 * pattern, and exact-template history produce true short-run variety. */
{
  const byMode={};
  for(const mode of ["both","mvt","rolle"]){
    let total=0,applicable=0,familyConflicts=0,outerConflicts=0,templateConflicts=0;
    const families=new Set(),outers=new Set(),patterns=new Set(),templates=new Set(),variants=new Set();
    for(let session=1;session<=60;session++){
      const sandbox=generatorContext((session*2654435761+(mode==="mvt"?19:mode==="rolle"?43:79))>>>0);
      const generate=sandbox.window.BatchMathAPTopicGenerators.get("rolle-s-theorem-and-the-mean-value-theorem");
      const recentFamilies=[],recentOuters=[],recentTemplates=[];
      for(let index=0;index<40;index++){
        const problem=generate({mvtMode:mode});
        const family=problem.theoremFunctionFamily,outer=problem.theoremOuterFunction,pattern=problem.theoremCompositionPattern,template=problem.theoremTemplateSignature;
        expect(Boolean(family&&outer&&pattern&&template),`${mode}: variety metadata missing in ${problem.id}`);
        if(recentFamilies.slice(-5).includes(family))familyConflicts++;
        if(recentOuters.slice(-3).includes(outer))outerConflicts++;
        if(recentTemplates.slice(-9).includes(template))templateConflicts++;
        recentFamilies.push(family);recentOuters.push(outer);recentTemplates.push(template);
        families.add(family);outers.add(outer);patterns.add(pattern);templates.add(template);variants.add(problem.variant);
        total++;if(problem.theoremApplies)applicable++;
      }
    }
    const share=applicable/total;
    expect(share>.71&&share<.79,`${mode}: applicability share drifted to ${share.toFixed(4)}`);
    expect(familyConflicts===0,`${mode}: ${familyConflicts} major-family repeats occurred inside the five-question window`);
    expect(templateConflicts/total<.005,`${mode}: exact templates repeated too often in the ten-question window (${templateConflicts}/${total})`);
    expect(outerConflicts/total<.02,`${mode}: outer functions repeated too often in the recent window (${outerConflicts}/${total})`);
    expect(families.size>=8,`${mode}: only ${families.size} major function families were sampled`);
    expect(templates.size>=25,`${mode}: only ${templates.size} theorem templates were sampled`);
    byMode[mode]={samples:total,applicabilityShare:share,families:families.size,outers:outers.size,patterns:patterns.size,templates:templates.size,familyConflicts,outerConflicts,templateConflicts};
  }
  stats.theoremVariety=byMode;
}

/* The five active keypad implementations all use a fixed unit grid, an exact
 * two-unit class for long labels, consistent heights, and 0 below 3. */
{
  const calcJs=read("assets/calculus-keypad.js"),calcCss=read("assets/calculus-keypad.css");
  const im1Js=read("assets/im1-keypad.js"),im1Css=read("assets/im1-keypad.css");
  const unit1Js=read("assets/unit1-practice-ui.js"),unit1Css=read("assets/unit1-practice.css");
  const apJs=read("assets/ap-topic-practice.js"),apCss=read("assets/ap-topic-practice.css");
  const prepJs=read("assets/calc-prep-exact-editor.js"),prepCss=read("assets/calc-prep.css");
  for(const [name,js] of [["calculus",calcJs],["IM1",im1Js],["Unit 1",unit1Js],["AP fallback",apJs],["Calc Prep",prepJs]]){
    expect(/0\s*:\s*\[4,3\]|["']0["']\s*:\s*\[4,3\]/.test(js),`${name}: 0 is not fixed directly below 3`);
  }
  expect(/auxiliary\.forEach\(button=>main\.appendChild\(button\)\)/.test(calcJs),"calculus keypad auxiliary rows are not consolidated into the dense main grid");
  for(const [name,css,columns] of [["calculus",calcCss,5],["IM1",im1Css,4],["Unit 1",unit1Css,5],["AP fallback",apCss,5],["Calc Prep",prepCss,5]]){
    expect(css.includes(`grid-template-columns:repeat(${columns},minmax(0,1fr))`),`${name}: standard grid width is missing`);
    expect(/grid-column:span 2/.test(css),`${name}: exact double-width rule is missing`);
    expect(!/grid-column:span (?!2\b)\d+/.test(css),`${name}: arbitrary keypad span remains`);
  }
  expect(/grid-auto-flow:row dense/.test(calcCss)&&/grid-auto-flow:row dense/.test(im1Css)&&/grid-auto-flow:row dense/.test(unit1Css)&&/grid-auto-flow:row dense/.test(apCss)&&/grid-auto-flow:row dense/.test(prepCss),"one or more keypad systems lack dense bottom-row packing");
  expect(!/\.bm-calc-key\.wide/.test(calcCss),"legacy arbitrary calculus wide-key styling remains");
  expect(/label==='Undefined'\?' double'/.test(prepJs),"Calc Prep long-label key is not exactly double-width");
  expect(!/(?:nth-child|first-child)[^{]*\{[^}]*min-height/.test([calcCss,im1Css,unit1Css,apCss,prepCss].join("\n")),"a keypad row still uses a different key height");
  stats.keypads={systems:5,desktopAndMobileRules:true,standardWidths:true,doubleWidths:true,zeroBelowThree:true};
}

{
  const review=read("ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/assignment-practice/index.html");
  for(const slug of ["tangent-and-secant-line-approximations","rolle-s-theorem-and-the-mean-value-theorem"])expect(review.includes(`"${slug}"`),`Comprehensive Review omits ${slug}`);
  for(const asset of ["/assets/unit3-applications-generators.js","/assets/ap-topic-practice.js","/assets/calculus-keypad.js"])expect(review.includes(asset),`Comprehensive Review does not share ${asset}`);
  expect(fs.existsSync(path.join(ROOT,".github/workflows/batchmath-qa.yml")),".github/workflows/batchmath-qa.yml is missing");
  stats.review={sharedFamilies:2,sharedKeypad:true,workflowPreserved:true};
}

const report={ok:errors.length===0,errors,stats};
fs.mkdirSync(path.join(ROOT,"qa-results"),{recursive:true});
fs.writeFileSync(path.join(ROOT,"qa-results/v124-keypad-tangent-mvt-qa.json"),JSON.stringify(report,null,2)+"\n");
if(errors.length){console.error(errors.slice(0,100).join("\n"));console.error(`FAILED with ${errors.length} error(s)`);process.exit(1);}
console.log(JSON.stringify(stats,null,2));
console.log("Version 12.4 targeted keypad/Tangent-Secant/MVT-Rolle QA passed.");
