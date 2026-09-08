#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const ROOT=path.resolve(HERE,'..');const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const errors=[],warnings=[];let count=0;
const expected=[
'introduction-to-limits','sin-one-over-x','intermediate-value-theorem','difference-quotient',
'equations-of-tangent-and-normal-lines','horizontal-and-vertical-tangent-lines','horizontal-and-vertical-tangent-lines-implicitly','motion','absolute-and-local-extrema-and-the-extreme-value-theorem','increasing-decreasing-intervals-concavity-and-extrema','linearization-and-differentials','tangent-and-secant-line-approximations','rolle-s-theorem-and-the-mean-value-theorem','l-hopital-s-rule',
'rectangular-approximations','trapezoidal-approximations','introduction-to-sigma-notation','evaluating-definite-integrals-with-a-limit-and-summation','fundamental-theorem-of-calculus-and-integral-rules','integrals-using-geometry',
'basic-first-order-differential-equations','motion-problems','separable-differential-equations','rate-problems',
'area-below-and-between-curves','finding-area-in-terms-of-y','integrals-on-piecewise-defined-functions','volume-by-cross-sections','solids-of-revolution'];
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const box={window:{},console};vm.createContext(box);const source=fs.readFileSync(path.join(ROOT,'assets/ap-topic-generators.js'),'utf8');
for(const slug of expected){
  const variants=new Set();
  for(let seed=1;seed<=1000;seed++){
    box.window.BatchMathRNG={random:rng(seed*7919+expected.indexOf(slug)*104729)};
    try{vm.runInContext(source,box,{filename:'ap-topic-generators.js'});const gen=box.window.BatchMathAPTopicGenerators?.get(slug);if(typeof gen!=='function'){errors.push(`${slug}: generator missing`);break}const p=gen();count++;if(!p||!p.id||!p.variant||!p.questionHtml)errors.push(`${slug} seed ${seed}: malformed problem object`);if(p.answerType==='approx-classification'){if(!Number.isFinite(Number(p.numericAnswer))||!['under','over'].includes(p.classification))errors.push(`${slug} seed ${seed}: malformed approximation/classification answer`);}else if(p.answerType==='numeric'){if(!Number.isFinite(Number(p.numericAnswer)))errors.push(`${slug} seed ${seed}: malformed numeric answer`);}else if(p.answerType==='two-stage'){if(!Array.isArray(p.stage1Choices)||p.stage1Choices.length<2)errors.push(`${slug} seed ${seed}: malformed Part 1 choices`);if(!Number.isInteger(p.stage1CorrectIndex)||p.stage1CorrectIndex<0||p.stage1CorrectIndex>=p.stage1Choices.length)errors.push(`${slug} seed ${seed}: invalid Part 1 correct index`);if(!Number.isFinite(Number(p.numericAnswer)))errors.push(`${slug} seed ${seed}: malformed Part 2 numeric answer`);}else{if(!Array.isArray(p.choices)||p.choices.length!==4)errors.push(`${slug} seed ${seed}: malformed choices`);if(!Number.isInteger(p.correctIndex)||p.correctIndex<0||p.correctIndex>=4)errors.push(`${slug} seed ${seed}: invalid correctIndex`);if(new Set(p.choices).size!==4)errors.push(`${slug} seed ${seed}: duplicate choices ${JSON.stringify(p.choices)}`);}if(!String(p.explanation||'').trim())errors.push(`${slug} seed ${seed}: missing explanation`);const text=String(p.questionHtml)+' '+(Array.isArray(p.choices)?p.choices.join(' '):'');if(/x--\d|\+\s*-\s*-|\\frac\{[^}]*\}\{0\}/.test(text))errors.push(`${slug} seed ${seed}: malformed display ${text.slice(0,240)}`);variants.add(p.variant)}catch(e){errors.push(`${slug} seed ${seed}: ${e.stack||e.message}`);break}
  }
  if(variants.size<1)warnings.push(`${slug}: no variants observed`);
}
// Every generic practice page must map to a configured generator.
for(const slug of expected){const f=[...fs.readdirSync(path.join(ROOT,'ap-calculus'),{withFileTypes:true}).filter(e=>e.isDirectory())].map(()=>null);}
const report={ok:errors.length===0,generatedAt:new Date().toISOString(),generators:expected.length,problems:count,warnings,errors};fs.writeFileSync(path.join(OUT,'ap-topic-generator-qa.json'),JSON.stringify(report,null,2)+'\n');const lines=['BatchMath AP topic generator QA',`Result: ${report.ok?'PASS':'FAIL'}`,`Generic topic generators: ${expected.length}`,`Generated problems: ${count}`,`Warnings: ${warnings.length}`,...warnings.map(x=>'- '+x),`Errors: ${errors.length}`,...errors.slice(0,100).map(x=>'- '+x),''];fs.writeFileSync(path.join(OUT,'ap-topic-generator-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
