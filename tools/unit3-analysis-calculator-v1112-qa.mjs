#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const errors=[],focusCounts=new Map(),familyCounts=new Map(),samples=new Map();

function rng(seed){let state=seed>>>0;return()=>{state=(state+0x6D2B79F5)|0;let value=Math.imul(state^(state>>>15),1|state);value=(value+Math.imul(value^(value>>>7),61|value))^value;return((value^(value>>>14))>>>0)/4294967296;};}
const sandbox={window:{BatchMathRNG:{random:rng(1)}},console,Math};vm.createContext(sandbox);
for(const file of ['assets/ap-topic-generators.js','assets/unit3-applications-generators.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),sandbox,{filename:file});
const generator=sandbox.window.BatchMathAPTopicGenerators.get('increasing-decreasing-intervals-concavity-and-extrema');
if(typeof generator!=='function')throw new Error('Calculator derivative-analysis generator is missing.');
function generate(seed,focus){sandbox.window.BatchMathRNG={random:rng(seed)};return generator({mode:'calculator',analysisFocus:focus});}
function fixed(value){const shown=Number(value).toFixed(3);return shown==='-0.000'?'0.000':shown;}
function bisect(fn,left,right){let a=left,b=right,fa=fn(a),fb=fn(b);if(!Number.isFinite(fa)||!Number.isFinite(fb)||fa*fb>0)return NaN;for(let index=0;index<100;index++){const middle=(a+b)/2,value=fn(middle);if(Math.abs(value)<1e-13)return middle;if(fa*value<=0){b=middle;fb=value;}else{a=middle;fa=value;}}return(a+b)/2;}
function scanRoots(fn,left,right,steps=2048){
  const roots=[],width=(right-left)/steps,push=root=>{if(Number.isFinite(root)&&root>left&&root<right&&!roots.some(value=>Math.abs(value-root)<width*1.8))roots.push(root);};
  let x0=left,y0=fn(x0);
  for(let index=1;index<=steps;index++){
    const x1=left+index*width,y1=fn(x1);if(!Number.isFinite(y0)||!Number.isFinite(y1))return[];
    if(y0*y1<0)push(bisect(fn,x0,x1));else if(Math.abs(y0)<1e-11)push(x0);
    x0=x1;y0=y1;
  }
  return roots.sort((a,b)=>a-b);
}
function independentlyNonNice(root){
  if(Math.abs(root)<.055)return false;
  if(/[05]$/.test(Math.abs(root).toFixed(3)))return false;
  for(let denominator=1;denominator<=10;denominator++){
    const tolerance=denominator<=2?.024:denominator<=4?.011:denominator<=6?.0055:.0022;
    if(Math.abs(root-Math.round(root*denominator)/denominator)<tolerance)return false;
  }
  for(let numerator=-24;numerator<=24;numerator++)if(Math.abs(root-numerator*Math.PI/12)<.009)return false;
  return true;
}
function parseExpectedIntervals(raw){
  return String(raw||'').split('U').map(piece=>{const text=piece.trim(),match=text.match(/^([[(])([^,]+),([^\])]+)([)\]])$/);if(!match)return null;return{leftClosed:match[1]==='[',left:Number(match[2]),right:Number(match[3]),rightClosed:match[4]===']'};});
}
function recordError(message,p){if(errors.length<300)errors.push(`${message}${p?` — ${p.id}`:''}`);}
function validateProblem(p,expectedFocus){
  if(!p||p.analysisFocus!==expectedFocus)return recordError(`focus mismatch: expected ${expectedFocus}`,p);
  const audit=p.calculatorAudit,fn=audit?.evaluate;
  if(!p.calculatorActive||!p.calculatorValidated||!p.calculatorRequired||!p.painfulMixedFunction)recordError('calculator validation metadata is incomplete',p);
  if(!audit||audit.validationVersion!=='11.13'||typeof fn!=='function')return recordError('calculator audit payload is missing',p);
  if(!audit.allRootsNonNice||!audit.rootStabilityValidated||!audit.signChangeValidated)recordError('a required validation gate was not passed',p);
  if(!['fp','fpp'].includes(p.analysisGiven)||/f\(x\)\s*=/.test(p.questionHtml||''))recordError('the engine supplied f instead of the requested derivative',p);
  if(!/^analysis_calculator_validated_/.test(p.variant||''))recordError('an old calculator family leaked into the engine',p);
  if(!/(\\sin|\\cos|\\ln|e\^|\\tan\^\{-1\})/.test(p.questionHtml||''))recordError('displayed derivative is not a mixed numerical family',p);
  if(/x\^2\s*-\s*16|\([^)]*x[^)]*\)\s*\([^)]*x[^)]*\)/.test(p.questionHtml||''))recordError('hand-solvable or factored form leaked',p);
  if(!/exactly three decimal/i.test(p.questionHtml||''))recordError('three-decimal direction is missing',p);
  const [left,right]=audit.domain,roots=audit.roots||[],dense=scanRoots(fn,left,right);
  if(!roots.length||roots.length>3)recordError('root count is unreasonable',p);
  if(['poi','extrema'].includes(expectedFocus)&&roots.length!==1)recordError('a point question is ambiguous',p);
  if(dense.length!==roots.length||dense.some((root,index)=>Math.abs(root-roots[index])>.0002))recordError(`independent scan found ${dense.length} roots instead of ${roots.length}`,p);
  for(let index=0;index<roots.length;index++){
    const root=roots[index];
    if(!independentlyNonNice(root))recordError(`root ${root} is too simple`,p);
    if(Math.abs(fn(root))>1e-7)recordError(`root residual is ${fn(root)}`,p);
    if(root-left<.18||right-root<.18)recordError('root is too close to a domain endpoint',p);
    if(index&&root-roots[index-1]<.38)recordError('roots are too close together',p);
    if(!(p.explanation||'').includes(fixed(root)))recordError('worked explanation omits an actual numerical root',p);
  }
  const boundaries=[left,...roots,right];
  for(let index=0;index<boundaries.length-1;index++){
    const expectedSign=audit.signs[index],a=boundaries[index],b=boundaries[index+1];
    for(const fraction of [.12,.29,.5,.71,.88]){const value=fn(a+(b-a)*fraction);if(!Number.isFinite(value)||Math.sign(value)!==expectedSign)recordError('independent interval sign check failed',p);}
  }
  for(const transition of audit.transitions||[])if(!(transition.leftSign*transition.rightSign<0&&transition.leftValue*transition.rightValue<0))recordError('a required sign change is absent',p);
  const explanation=String(p.explanation||''),stepCount=(explanation.match(/<strong>Step \d+:<\/strong>/g)||[]).length;
  if(!/TI-84 Plus.*2nd.*TRACE \(CALC\).*2:zero/is.test(explanation))recordError('specific TI-84 zero work is missing',p);
  if(/Use a test value|test \\?\(x=|Check the sign on both sides|f[′″]\\?\(-?\d+\.\d{3}\\?\)\\?\s*\\approx/i.test(explanation))recordError('an arbitrary numerical sign test leaked into the explanation',p);
  if(/Therefore the requested x-location/i.test(explanation))recordError('a redundant final x-location step leaked into the explanation',p);
  if(/(?:^|[+=-])\d+(?:\.\d+)?\\frac\{/.test(p.questionHtml||''))recordError('a scalar coefficient was left outside a fraction',p);
  if(/\\frac\{\s*-/.test(p.questionHtml||''))recordError('a negative sign was placed inside a fraction numerator',p);
  if(expectedFocus==='incdec'||expectedFocus==='concavity'){
    if(p.answerType!=='interval-answer'||p.intervalAnswer?.requiredDecimals!==3)recordError('interval answer contract is incorrect',p);
    if(stepCount!==5)recordError('interval explanation does not have five concrete steps',p);
    if(!/graph of .* is above the x-axis on .*below the x-axis on/is.test(explanation))recordError('graph-based positive/negative interval reasoning is missing',p);
    for(let index=0;index<audit.testPoints.length;index++)if(explanation.includes('test \\(x='+fixed(audit.testPoints[index]))||explanation.includes('\\approx'+fixed(audit.testValues[index])))recordError('a validator probe was exposed as student-facing sign work',p);
    if(expectedFocus==='incdec'&&!/Since we want to know where .* is (?:increasing|decreasing).*choose the intervals where .*f′\(x\)/s.test(explanation))recordError('increasing/decreasing sign interpretation is missing',p);
    if(expectedFocus==='concavity'&&!/Since we want to know where .* is concave (?:up|down).*choose the intervals where .*f″\(x\)/s.test(explanation))recordError('concavity sign interpretation is missing',p);
    const parsed=parseExpectedIntervals(p.intervalAnswer?.expected);if(parsed.some(part=>!part))recordError('expected interval answer does not parse',p);
    const displayed=String(p.answerTex||'').replace(/\\cup/g,'U'),displayedParts=displayed.split('U');
    if(displayedParts.length!==parsed.length||displayedParts.some(part=>!/^[[()]?-?\d+\.\d{3},-?\d+\.\d{3}[)\]]$/.test(part)))recordError('displayed interval answer does not use exact three-decimal endpoints',p);
  }else{
    if(p.answerType!=='numeric'||p.requiredDecimals!==3||!/^-?\d+\.\d{3}$/.test(String(p.answerTex)))recordError('numeric three-decimal answer contract is incorrect',p);
    if(Math.abs(Number(p.answerTex)-Number(p.numericAnswer))>Number(p.numericTolerance))recordError('the displayed rounded answer is not accepted',p);
    if(stepCount!==4)recordError('point explanation does not have four concrete steps',p);
    if(!/graph of .* is (?:above|below) the x-axis to the left of .* and (?:above|below) the x-axis to the right/is.test(explanation))recordError('graph-based two-sided sign reasoning is missing',p);
    const transition=audit.transitions[0];for(const value of [transition.leftX,transition.rightX,transition.leftValue,transition.rightValue])if(explanation.includes(fixed(value)))recordError('a validator probe leaked into the point explanation',p);
    if(expectedFocus==='extrema'){
      const maximum=/local maximum/i.test(p.questionHtml||''),valid=maximum?transition.leftSign>0&&transition.rightSign<0:transition.leftSign<0&&transition.rightSign>0;if(!valid)recordError('local-extremum sign change is wrong',p);
      if(!/f′.*changes from (?:positive to negative|negative to positive).*local (?:maximum|minimum)/is.test(explanation))recordError('local-extremum conclusion is incomplete',p);
    }else if(!/f″.*changes from (?:positive to negative|negative to positive).*concavity changes.*point of inflection/is.test(explanation))recordError('point-of-inflection conclusion is incomplete',p);
  }
  focusCounts.set(expectedFocus,(focusCounts.get(expectedFocus)||0)+1);
  const familyKey=`${expectedFocus}:${audit.family}`;familyCounts.set(familyKey,(familyCounts.get(familyKey)||0)+1);
  if((samples.get(expectedFocus)||[]).length<8)(samples.get(expectedFocus)||samples.set(expectedFocus,[]).get(expectedFocus)).push({id:p.id,family:audit.family,roots:roots.map(fixed),signs:audit.signs,question:p.questionHtml.replace(/<[^>]+>/g,' '),answer:p.answerTex});
}

const PER_FOCUS=1600;
for(const focus of ['incdec','concavity','poi','extrema'])for(let index=1;index<=PER_FOCUS;index++)validateProblem(generate((index*2654435761+focus.length*977)>>>0,focus),focus);

const mixedCounts=new Map();
for(let index=1;index<=3200;index++){
  const problem=generate((index*2246822519+99173)>>>0,'mixed');validateProblem(problem,problem.analysisFocus);mixedCounts.set(problem.analysisFocus,(mixedCounts.get(problem.analysisFocus)||0)+1);
}
for(const focus of ['incdec','concavity','poi','extrema']){
  const familyTotal=[...familyCounts.keys()].filter(key=>key.startsWith(`${focus}:`)).length,minimum=['incdec','concavity'].includes(focus)?15:9;
  if(familyTotal<minimum)errors.push(`${focus} produced only ${familyTotal} validated families; expected at least ${minimum}.`);
  const share=(mixedCounts.get(focus)||0)/3200;if(Math.abs(share-.25)>.035)errors.push(`Mixed ${focus} share ${share.toFixed(3)} is outside equal-weight tolerance.`);
}

const report={ok:errors.length===0,generatedAt:new Date().toISOString(),generatedProblems:[...focusCounts.values()].reduce((sum,value)=>sum+value,0),perFocus:Object.fromEntries(focusCounts),mixedDistribution:Object.fromEntries(mixedCounts),distinctFamilies:Object.fromEntries(['incdec','concavity','poi','extrema'].map(focus=>[focus,[...familyCounts.keys()].filter(key=>key.startsWith(`${focus}:`)).length])),samples:Object.fromEntries(samples),errors};
fs.writeFileSync(path.join(OUT,'unit3-analysis-calculator-v1113-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath Unit 3 calculator derivative-analysis targeted QA',`Result: ${report.ok?'PASS':'FAIL'}`,`Generated and independently checked: ${report.generatedProblems}`,`Per focus: ${JSON.stringify(report.perFocus)}`,`Mixed distribution: ${JSON.stringify(report.mixedDistribution)}`,`Distinct validated families: ${JSON.stringify(report.distinctFamilies)}`,`Errors: ${errors.length}`,...errors.slice(0,120).map(error=>`- ${error}`),''];
fs.writeFileSync(path.join(OUT,'unit3-analysis-calculator-v1113-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
