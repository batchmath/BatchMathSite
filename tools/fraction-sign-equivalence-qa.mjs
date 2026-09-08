#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const errors=[];const warnings=[];const stats={};
const fail=m=>errors.push(m);

// Execute the exact production normalizer in a minimal DOM sandbox.
const documentStub={
  addEventListener(){},
  querySelectorAll(){return[];}
};
const sandbox={window:{},document:documentStub,console};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/answer-normalization.js'),'utf8'),sandbox,{filename:'answer-normalization.js'});
const normalize=sandbox.window.BatchMathAnswers?.normalizeFractionSigns;
if(typeof normalize!=='function')fail('production normalizeFractionSigns function did not load');

const exactCases=new Map([
  ['-1/2','-1/2'],['(-1)/2','-1/2'],['1/-2','-1/2'],['1/(-2)','-1/2'],['-(1/2)','-1/2'],['−(1/2)','-1/2'],
  ['-3/7','-3/7'],['3/-7','-3/7'],['3/(-7)','-3/7'],['-(3/7)','-3/7'],['(-3)/(7)','-3/7'],
  ['sqrt(2)/-2','-sqrt(2)/2'],['-(sqrt(2)/2)','-sqrt(2)/2'],['(x+1)/(-(x-2))','-(x+1)/(x-2)'],['1/-(x-2)','-1/(x-2)'],
  // These must NOT be rewritten by incorrectly pulling a minus from only one denominator term.
  ['1/(-x+2)','1/(-x+2)'],['(-x+2)/(x+1)','(-x+2)/(x+1)']
]);
for(const [input,expected] of exactCases){const got=normalize(input);if(got!==expected)fail(`exact case ${input} -> ${got}, expected ${expected}`);}
stats.explicitCases=exactCases.size;

function numeric(s){
  s=String(s).replace(/\s+/g,'');
  const m=s.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\/([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  if(!m)return NaN;const d=Number(m[2]);return d?Number(m[1])/d:NaN;
}
let stress=0;
for(let n=1;n<=199;n++)for(let d=1;d<=199;d++){
  const variants=[`-${n}/${d}`,`(-${n})/${d}`,`${n}/-${d}`,`${n}/(-${d})`,`-(${n}/${d})`,`−(${n}/${d})`];
  for(const v of variants){const got=normalize(v),val=numeric(got),want=-n/d;if(!Number.isFinite(val)||Math.abs(val-want)>1e-12){fail(`numeric stress ${v} -> ${got} -> ${val}, expected ${want}`);if(errors.length>25)break;}stress++;}
  if(errors.length>25)break;
 }
stats.numericStressCases=stress;

// Every instrumented practice engine must load the sitewide normalizer. This is
// deliberately a release-gate rule so new engines cannot silently omit it.
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','qa-results'].includes(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else out.push(f);}return out;}
const htmlFiles=walk(ROOT).filter(f=>f.endsWith('index.html'));
let engines=0,staticAnswerInputs=0;
for(const f of htmlFiles){
  const html=fs.readFileSync(f,'utf8');if(!html.includes('problem-tracking.js'))continue;engines++;
  if(!html.includes('/assets/answer-normalization.js'))fail(`${path.relative(ROOT,f)}: instrumented engine missing answer-normalization.js`);
  const track=html.indexOf('problem-tracking.js'),norm=html.indexOf('answer-normalization.js');if(norm>track)fail(`${path.relative(ROOT,f)}: answer normalizer must load before problem tracking`);
  staticAnswerInputs += [...html.matchAll(/<(?:input|textarea)\b[^>]*(?:id|aria-label|class|data-bm-(?:calc-)?keypad)=["'][^"']*(?:answer|response|location|quotient|remainder|practice-answer|keypad|factor)[^"']*["'][^>]*>/gi)].length;
}
stats.instrumentedEngines=engines;stats.staticAnswerInputs=staticAnswerInputs;
if(engines!==88)fail(`expected 88 instrumented engines, found ${engines}`);

// Defense-in-depth assertions on the known direct parsers that historically
// handled rational answers themselves instead of using expression equivalence.
const directParserFiles=[
 'ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/practice/index.html',
 'ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html',
 'ap-calculus/unit-1-limits-continuity/topics/limits-of-continuous-functions/practice/index.html',
 'ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/practice/index.html',
 'ap-calculus/unit-1-limits-continuity/topics/one-sided-limits/practice/index.html',
 'ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/practice/index.html',
 'im1/unit-1-review/topics/fractions/practice/index.html',
 'im1/unit-1-review/topics/reducing-fractions/practice/index.html',
 'assets/ap-topic-practice.js','assets/calc-prep-common.js','assets/calc-prep-synthetic.js'
];
for(const rel of directParserFiles){const s=fs.readFileSync(path.join(ROOT,rel),'utf8');if(!s.includes('BatchMathAnswers?.normalizeFractionSigns'))fail(`${rel}: direct answer parser does not call sitewide fraction normalizer`);}
stats.directParserDefenseFiles=directParserFiles.length;

// Exact-expression practice engines commonly use normalizeInput(). Require each
// such parser to call the same fraction-sign normalizer directly as a second
// line of defense, in addition to the capture-phase sitewide input hook.
const expressionParserFiles=walk(ROOT).filter(f=>/\.(?:html|js)$/.test(f)).filter(f=>/\b(?:function\s+normalizeInput|normalizeInput\s*=)/.test(fs.readFileSync(f,'utf8')));
for(const f of expressionParserFiles){
  const rel=path.relative(ROOT,f),src=fs.readFileSync(f,'utf8');
  if(!src.includes('BatchMathAnswers?.normalizeFractionSigns'))fail(`${rel}: normalizeInput parser does not call sitewide fraction normalizer`);
}
stats.expressionParserDefenseFiles=expressionParserFiles.length;
if(expressionParserFiles.length!==16)fail(`expected 16 normalizeInput parser files, found ${expressionParserFiles.length}`);

// Execute the actual production numeric parser bodies from the limits pages.
function extractFunction(source,name){
  const start=source.indexOf(`function ${name}(`);if(start<0)return '';
  const brace=source.indexOf('{',start);if(brace<0)return '';
  let d=0;for(let i=brace;i<source.length;i++){if(source[i]==='{')d++;else if(source[i]==='}'){d--;if(d===0)return source.slice(start,i+1);}}
  return '';
}
const parserPages=[
 ['ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/practice/index.html','parse'],
 ['ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html','parse'],
 ['ap-calculus/unit-1-limits-continuity/topics/limits-of-continuous-functions/practice/index.html','parse'],
 ['ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/practice/index.html','parse'],
 ['ap-calculus/unit-1-limits-continuity/topics/one-sided-limits/practice/index.html','parse'],
 ['ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/practice/index.html','parseAnswer']
];
let parserExecutions=0;
for(const [rel,name] of parserPages){
  const src=fs.readFileSync(path.join(ROOT,rel),'utf8'),fn=extractFunction(src,name);if(!fn){fail(`${rel}: could not extract ${name}`);continue;}
  const box={window:{BatchMathAnswers:{normalizeFractionSigns:normalize}},console};vm.createContext(box);
  try{vm.runInContext(`${fn};this.__fn=${name};`,box,{filename:rel});}
  catch(e){fail(`${rel}: extracted ${name} did not compile: ${e.message}`);continue;}
  for(const v of ['-1/2','(-1)/2','1/-2','1/(-2)','-(1/2)','−(1/2)']){
    let got;try{got=box.__fn(v);}catch(e){fail(`${rel}: ${name} threw on ${v}: ${e.message}`);continue;}
    const value=typeof got==='number'?got:(got&&got.kind==='num'?got.value:(got&&got.kind==='rat'?got.n/got.d:NaN));
    if(!Number.isFinite(value)||Math.abs(value+0.5)>1e-12)fail(`${rel}: ${name}(${v}) -> ${JSON.stringify(got)}, expected -1/2`);
    parserExecutions++;
  }
}
stats.productionParserExecutions=parserExecutions;

// Targeted regression for the exact reported Basic Techniques / Factoring failure.
// Execute that page's production parse() AND isCorrect() functions over a wide
// rational grid, requiring every supported negative-sign placement to be accepted.
{
  const rel='ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/practice/index.html';
  const src=fs.readFileSync(path.join(ROOT,rel),'utf8');
  const parseFn=extractFunction(src,'parse'),correctFn=extractFunction(src,'isCorrect');
  if(!parseFn||!correctFn)fail(`${rel}: could not extract production parse/isCorrect for factoring regression`);
  else{
    const box={window:{BatchMathAnswers:{normalizeFractionSigns:normalize}},console};vm.createContext(box);
    try{vm.runInContext(`${parseFn};${correctFn};this.__parse=parse;this.__correct=isCorrect;`,box,{filename:rel});}
    catch(e){fail(`${rel}: production factoring parser/checker did not compile: ${e.message}`);}
    let checks=0;
    if(box.__parse&&box.__correct){
      outer: for(let n=1;n<=99;n++)for(let d=1;d<=99;d++){
        const variants=[`-${n}/${d}`,`(-${n})/${d}`,`${n}/-${d}`,`${n}/(-${d})`,`-(${n}/${d})`,`−(${n}/${d})`];
        for(const v of variants){
          let ok=false;try{ok=box.__correct(box.__parse(v),{kind:'num',n:-n,d});}catch(e){fail(`${rel}: production factoring acceptance threw on ${v}: ${e.message}`);break outer;}
          if(!ok){fail(`${rel}: production factoring checker rejected equivalent negative fraction ${v}`);break outer;}
          checks++;
        }
      }
    }
    stats.targetFactoringAcceptanceChecks=checks;
  }
}

const report={ok:errors.length===0,generatedAt:new Date().toISOString(),stats,warnings,errors};
fs.writeFileSync(path.join(OUT,'fraction-sign-equivalence-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath fraction-sign equivalence QA',`Result: ${report.ok?'PASS':'FAIL'}`,'',...Object.entries(stats).map(([k,v])=>`${k}: ${v}`),'',`Warnings: ${warnings.length}`,...warnings.map(x=>`- ${x}`),'',`Errors: ${errors.length}`,...errors.map(x=>`- ${x}`),''];
fs.writeFileSync(path.join(OUT,'fraction-sign-equivalence-qa.txt'),lines.join('\n'));
console.log(lines.join('\n'));if(errors.length)process.exit(1);
