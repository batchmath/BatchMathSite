#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const UNIT=path.join(ROOT,'ap-calculus/unit-3-applications-derivative/topics');
const topics=[
  ['equations-of-tangent-and-normal-lines','Equations of Tangent and Normal Lines','noncalculator'],
  ['horizontal-and-vertical-tangent-lines','Horizontal and Vertical Tangent Lines','noncalculator'],
  ['horizontal-and-vertical-tangent-lines-implicitly','Horizontal and Vertical Tangent Lines Implicitly','dual'],
  ['using-your-graphing-calculator','Using Your Graphing Calculator','calculator'],
  ['motion','Motion','dual'],
  ['absolute-and-local-extrema-and-the-extreme-value-theorem','Absolute and Local Extrema and the Extreme Value Theorem','noncalculator'],
  ['increasing-decreasing-intervals-concavity-and-extrema','Increasing/Decreasing Intervals, Concavity, and Extrema','dual'],
  ['linearization-and-differentials','Linearization and Differentials','noncalculator'],
  ['newton-s-method-for-approximating-roots-of-a-function',"Newton's Method for Approximating Roots of a Function",'calculator'],
  ['tangent-and-secant-line-approximations','Tangent and Secant Line Approximations','noncalculator'],
  ['rolle-s-theorem-and-the-mean-value-theorem',"Rolle's Theorem and the Mean Value Theorem",'noncalculator'],
  ['l-hopital-s-rule',"L'Hopital's Rule",'noncalculator'],
  ['optimization','Optimization','dual'],
  ['related-rates','Related Rates','dual']
];

const noncalc=topics.filter(([, ,kind])=>kind!=='calculator').map(([slug])=>slug);
const calc=topics.filter(([, ,kind])=>kind!=='noncalculator').map(([slug])=>slug);

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function compactSeoTitle(title){
  return title
    .replace('Absolute and Local Extrema and the Extreme Value Theorem','Extrema & EVT')
    .replace('Horizontal and Vertical Tangent Lines Implicitly','Implicit Tangent Lines')
    .replace('Increasing/Decreasing Intervals, Concavity, and Extrema','Derivative Analysis')
    .replace("Newton's Method for Approximating Roots of a Function","Newton's Method")
    .replace("Rolle's Theorem and the Mean Value Theorem",'Rolle & Mean Value Theorems')
    .replace('Applications of the Derivative Non-Calculator Mixed','Unit 3 Non-Calculator Mixed')
    .replace('Applications of the Derivative Calculator Mixed','Unit 3 Calculator Mixed');
}
function practicePage({title,backHref,backLabel,slug,slugs,mode,analytics}){
  const calculator=mode==='calculator';
  const description=calculator
    ? 'Calculator-active randomized practice with immediate feedback and worked explanations.'
    : 'Non-calculator randomized practice with immediate feedback and worked explanations.';
  const metaDescription=`Randomized ${compactSeoTitle(title)} for AP Calculus AB with immediate feedback and worked explanations.`;
  const configObject=Object.assign(slugs?{slugs}:{slug},{defaultMode:mode,analyticsSlug:analytics,title,generatorVersion:'11.13',unit3:true});
  const isMvt=slug==='rolle-s-theorem-and-the-mean-value-theorem';
  const isAnalysis=slug==='increasing-decreasing-intervals-concavity-and-extrema';
  if(isMvt)configObject.modeSelectIds=['mvtMode'];
  if(isAnalysis){configObject.modeSelectIds=['analysisFocus'];configObject.fixedMode=mode;}
  const config=JSON.stringify(configObject);
  const controls=isMvt?'<div class="controls"><div class="control"><label for="mvtMode" class="bm-practice-select-label">Practice Type</label><select id="mvtMode" class="bm-practice-select"><option value="both" selected>Both Types</option><option value="theorem">Theorem / Hypotheses</option><option value="find-c">Derivative = Average Rate of Change</option></select></div></div>':isAnalysis?'<div class="controls"><div class="control"><label for="analysisFocus" class="bm-practice-select-label">Practice Type</label><select id="analysisFocus" class="bm-practice-select"><option value="mixed" selected>Mixed</option><option value="incdec">Increasing / Decreasing</option><option value="concavity">Concavity</option><option value="poi">Points of Inflection</option><option value="extrema">Local Maxima / Minima</option></select></div></div>':'';
  const modeBanner=calculator?'<div class="u3-mode-banner calculator"><span aria-hidden="true" class="u3-banner-calculator"></span> Calculator Active</div>':'';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<title>${esc(compactSeoTitle(title))} | AP Calculus AB | BatchMath</title><meta name="description" content="${esc(metaDescription)}">
<link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/ap-topic-practice.css"><link rel="stylesheet" href="/assets/calculus-keypad.css"><link rel="stylesheet" href="/assets/unit3-applications.css">
<script>window.MathJax={tex:{inlineMath:[["\\\\(","\\\\)"],["$","$"]]},options:{enableMenu:false}};</script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js"></script>
<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#030303"><script src="/assets/batchmath-storage.js" defer></script><script src="/assets/answer-normalization.js"></script><script src="/assets/line-equation-checker.js"></script><script src="/assets/derivative-expression-checker.js"></script><script src="/assets/pwa.js" defer></script>
<script src="/assets/reproducible-rng.js"></script><script>window.BM_ANALYTICS_CONFIG={course:"ap_calculus_ab",engineId:${JSON.stringify(analytics)},generatorVersion:"11.13"};</script><script src="/assets/problem-tracking.js"></script><script src="/assets/ap-topic-generators.js"></script><script src="/assets/unit3-applications-generators.js"></script><script src="/assets/calculus-keypad.js"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-377MTFXSF3"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-377MTFXSF3');</script>
</head><body><a class="skip-link" href="#main-content">Skip to main content</a><header class="topbar"><img class="corner" src="/assets/batchmath-portrait.jpg" alt=""><a class="logo" href="/">BatchMath<span class="tm-mark">™</span></a><div class="profile"><img src="/assets/batchmath-portrait.jpg" alt="BatchMath"><button class="menu-toggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="course-menu" aria-label="Open course menu">COURSES ▼</button><nav id="course-menu" class="dropdown"><a href="/im1/">Integrated Math 1</a><a href="/ap-calculus/" class="current-section" aria-current="page">AP Calculus AB</a><a href="/calculus-prep/">Calculus Prep</a><a href="/about/">About</a><a href="/">Home</a></nav></div></header>
<main id="main-content" class="main"><a class="back" href="${backHref}">← ${esc(backLabel)}</a><h1 class="page-title">${esc(title)}</h1><p class="topic-description">${description}</p>${modeBanner}<section class="practice-shell">${controls}<div class="stats">Correct: <span id="correct-count">0</span> &nbsp;•&nbsp; Attempted: <span id="attempted-count">0</span></div><div id="question" class="question-box"></div><div id="choices" class="choice-grid"></div><div id="feedback" class="feedback" aria-live="polite"></div><div class="actions"><button id="next" class="btn primary" type="button" hidden>Next Question</button></div></section></main>
<footer class="footer"><div>© 2026 BatchMath. All rights reserved. BatchMath™.</div><div class="bm-footer-links"><a href="/about/">About BatchMath</a></div><div class="bm-legal-note">AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this website.</div></footer>
<script>document.addEventListener('DOMContentLoaded',function(){const b=document.querySelector('.menu-toggle'),m=document.querySelector('.dropdown');if(b&&m){b.addEventListener('click',e=>{e.stopPropagation();m.classList.toggle('open');b.setAttribute('aria-expanded',m.classList.contains('open')?'true':'false')});document.addEventListener('click',()=>{m.classList.remove('open');b.setAttribute('aria-expanded','false')});m.addEventListener('click',e=>e.stopPropagation())}});window.BM_TOPIC_PRACTICE=${config};</script><script src="/assets/ap-topic-practice.js"></script></body></html>`;
}
function derivativeIcon(){return '<span aria-hidden="true" class="bm-practice-icon bm-practice-icon-derivative"><span class="bm-deriv-num">dy</span><span class="bm-deriv-den">dx</span></span>';}
function calculatorIcon(){return '<span aria-hidden="true" class="bm-practice-icon bm-practice-icon-calculator"><span class="bm-calculator-glyph"></span></span>';}
function launch(href,label,calculator=false){return `<a aria-label="${esc(label)}" class="resource-link bm-practice-launch bm-practice-derivative" data-bm-resource="practice" href="${href}">${calculator?calculatorIcon():derivativeIcon()}<span class="bm-practice-label">${esc(label)}</span><span aria-hidden="true" class="bm-practice-arrow">›</span></a>`;}
function replacePracticeSection(file,buttons){
  let html=fs.readFileSync(file,'utf8');
  const section=`<section class="resource-section" data-bm-topic-practice="1"><div class="resource-actions bm-practice-launch-row">${buttons}</div></section>`;
  const re=/<section class="resource-section" data-bm-topic-practice="1">[\s\S]*?<\/section>/;
  if(re.test(html))html=html.replace(re,section);
  else if(/<nav aria-label="Previous and next calculus topics"/.test(html))html=html.replace(/<nav aria-label="Previous and next calculus topics"/,`${section}<nav aria-label="Previous and next calculus topics"`);
  else html=html.replace(/<nav class="topic-pager" aria-label="Previous and next calculus topics"/,`${section}<nav class="topic-pager" aria-label="Previous and next calculus topics"`);
  fs.writeFileSync(file,html);
}

function removePracticeSection(file){
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/<section class="resource-section" data-bm-topic-practice="1">[\s\S]*?<\/section>/,'');
  fs.writeFileSync(file,html);
}

const graphingDerivativeDir=path.join(UNIT,'graphing-the-derivative');
removePracticeSection(path.join(graphingDerivativeDir,'index.html'));
fs.rmSync(path.join(graphingDerivativeDir,'practice'),{recursive:true,force:true});
fs.rmSync(path.join(graphingDerivativeDir,'calculator-practice'),{recursive:true,force:true});
const graphingFunctionsDir=path.join(UNIT,'graphing-functions');
removePracticeSection(path.join(graphingFunctionsDir,'index.html'));
fs.rmSync(path.join(graphingFunctionsDir,'practice'),{recursive:true,force:true});
fs.rmSync(path.join(graphingFunctionsDir,'calculator-practice'),{recursive:true,force:true});
fs.rmSync(path.join(UNIT,'linearization-and-differentials/calculator-practice'),{recursive:true,force:true});

for(const [slug,name,kind] of topics){
  const topicDir=path.join(UNIT,slug),topicFile=path.join(topicDir,'index.html');
  if(!fs.existsSync(topicFile))throw new Error(`Missing topic page: ${slug}`);
  const standardTitle=`${name} Practice`,calculatorTitle=name.includes('Graphing Calculator')?standardTitle:`${name} Calculator Practice`;
  const standardMode=kind==='calculator'?'calculator':'noncalculator';
  const practiceDir=path.join(topicDir,'practice');fs.mkdirSync(practiceDir,{recursive:true});
  fs.writeFileSync(path.join(practiceDir,'index.html'),practicePage({title:kind==='calculator'?calculatorTitle:kind==='dual'?`${name} Non-Calculator Practice`:standardTitle,backHref:'../',backLabel:name,slug,mode:standardMode,analytics:`ap_unit3_${slug}_${standardMode}`}));
  let buttons='';
  if(kind==='calculator')buttons=launch('practice/',calculatorTitle,true);
  else if(kind==='noncalculator')buttons=launch('practice/',standardTitle,false);
  else{
    buttons=launch('practice/',`${name} Non-Calculator Practice`,false);
    const calcDir=path.join(topicDir,'calculator-practice');fs.mkdirSync(calcDir,{recursive:true});
    fs.writeFileSync(path.join(calcDir,'index.html'),practicePage({title:`${name} Calculator Practice`,backHref:'../',backLabel:name,slug,mode:'calculator',analytics:`ap_unit3_${slug}_calculator`}));
    buttons+=launch('calculator-practice/',`${name} Calculator Practice`,true);
  }
  replacePracticeSection(topicFile,buttons);
}

const reviewDir=path.join(UNIT,'comprehensive-review');
const noncalcDir=path.join(reviewDir,'assignment-practice');fs.mkdirSync(noncalcDir,{recursive:true});
fs.writeFileSync(path.join(noncalcDir,'index.html'),practicePage({title:'Applications of the Derivative Non-Calculator Mixed Practice',backHref:'../',backLabel:'Comprehensive Review',slugs:noncalc,mode:'noncalculator',analytics:'ap_unit3_review_noncalculator'}));
const calcDir=path.join(reviewDir,'calculator-practice');fs.mkdirSync(calcDir,{recursive:true});
fs.writeFileSync(path.join(calcDir,'index.html'),practicePage({title:'Applications of the Derivative Calculator Mixed Practice',backHref:'../',backLabel:'Comprehensive Review',slugs:calc,mode:'calculator',analytics:'ap_unit3_review_calculator'}));
replacePracticeSection(path.join(reviewDir,'index.html'),launch('assignment-practice/','Applications of the Derivative Non-Calculator Mixed Practice',false)+launch('calculator-practice/','Applications of the Derivative Calculator Mixed Practice',true));

function addResourceCard(file,marker,card){
  let html=fs.readFileSync(file,'utf8');if(html.includes(marker))return;
  const boundary='</div></section><section class="resource-section" data-bm-topic-practice="1">';
  if(!html.includes(boundary))throw new Error(`Resource insertion boundary missing in ${file}`);
  html=html.replace(boundary,`${card}</div></section><section class="resource-section" data-bm-topic-practice="1">`);
  fs.writeFileSync(file,html);
}
const card=(title,assignment,key,marker)=>`<div class="resource-item" data-v11-resource="${marker}"><div class="resource-title">${esc(title)}</div><div class="resource-actions"><a class="resource-link" data-bm-resource="assignment" href="../../resources/assignments/${assignment}" rel="noopener" target="_blank">Assignment</a><a class="resource-link key" data-bm-resource="answer-key" href="../../resources/answer-keys/${key}" rel="noopener" target="_blank">Answer Key</a></div></div>`;
const unit2=path.join(ROOT,'ap-calculus/unit-2-derivatives/topics');
addResourceCard(path.join(unit2,'the-quotient-rule/index.html'),'data-v11-resource="05a-tables"',card('Product and Quotient Rule Derivatives from Tables','05a-product-and-quotient-rule-derivatives-from-tables.pdf','05a-product-and-quotient-rule-derivatives-from-tables-answer-key.pdf','05a-tables'));
const chainFile=path.join(unit2,'the-chain-rule/index.html');
addResourceCard(chainFile,'data-v11-resource="07a-tables"',card('Derivatives from Tables','07a-derivatives-from-tables.pdf','07a-derivatives-from-tables-answers.pdf','07a-tables'));
addResourceCard(chainFile,'data-v11-resource="07b-at-point"',card('Finding Derivatives at a Point with Power, Product, Quotient, Trig, and Chain Rules','07b-finding-derivatives-at-a-point-power-product-quotient-trig-chain.pdf','07b-finding-derivatives-at-a-point-power-product-quotient-trig-chain-answers.pdf','07b-at-point'));
addResourceCard(chainFile,'data-v11-resource="07c-nested"',card('Nested Chain Rule Derivatives','07c-nested-chain-rule-derivatives.pdf','07c-nested-chain-rule-derivatives-answers.pdf','07c-nested'));

console.log(`Built ${topics.length} Unit 3 topic practice sets, ${topics.filter(x=>x[2]==='dual').length} calculator companions, and two comprehensive tracks.`);
