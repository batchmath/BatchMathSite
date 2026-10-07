#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),errors=[],checks=[];
function rng(seed){let state=seed>>>0;return()=>{state=(state+0x6D2B79F5)|0;let value=Math.imul(state^(state>>>15),1|state);value=(value+Math.imul(value^(value>>>7),61|value))^value;return((value^(value>>>14))>>>0)/4294967296;};}
class ClassList{
  constructor(element){this.element=element;this.values=new Set();}
  add(...values){values.forEach(value=>this.values.add(value));this.sync();}
  remove(...values){values.forEach(value=>this.values.delete(value));this.sync();}
  toggle(value,force){const add=force===undefined?!this.values.has(value):!!force;add?this.values.add(value):this.values.delete(value);this.sync();return add;}
  contains(value){return this.values.has(value);}
  sync(){this.element._className=[...this.values].join(' ');}
}
class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.dataset={};this.attributes={};this.classList=new ClassList(this);this._className='';this._innerHTML='';this.textContent='';this.value='';this.hidden=false;this.disabled=false;this.parentElement=null;this.selectionStart=0;this.selectionEnd=0;}
  set className(value){this._className=String(value);this.classList.values=new Set(String(value).split(/\s+/).filter(Boolean));}
  get className(){return this._className;}
  set innerHTML(value){this._innerHTML=String(value);if(value==='')this.children=[];}
  get innerHTML(){return this._innerHTML;}
  append(...nodes){for(const node of nodes){if(node==null)continue;this.children.push(node);if(typeof node==='object')node.parentElement=this;}}
  appendChild(node){this.append(node);return node;}
  insertAdjacentElement(_position,node){this.append(node);return node;}
  setAttribute(name,value){this.attributes[name]=String(value);if(name==='id')this.id=String(value);}
  addEventListener(type,listener){(this.listeners[type]||(this.listeners[type]=[])).push(listener);}
  dispatchEvent(event){event.target=this;for(const listener of this.listeners[event.type]||[])listener(event);return!event.defaultPrevented;}
  click(){this.dispatchEvent(new FakeEvent('click'));}
  focus(){document.activeElement=this;}
  setSelectionRange(start,end){this.selectionStart=start;this.selectionEnd=end;}
  querySelectorAll(selector){const all=[];const visit=node=>{for(const child of node.children||[]){all.push(child);visit(child);}};visit(this);if(selector==='button')return all.filter(node=>node.tagName==='BUTTON');if(selector.includes('.choice'))return all.filter(node=>node.classList?.contains('choice'));if(selector==='.practice-answer-input')return all.filter(node=>node.classList?.contains('practice-answer-input'));return[];}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  closest(){return null;}
}
class FakeEvent{
  constructor(type,options={}){this.type=type;this.key=options.key||'';this.defaultPrevented=false;this.bubbles=!!options.bubbles;}
  preventDefault(){this.defaultPrevented=true;}
}
const elements={};for(const id of ['analysisFocus','question','choices','feedback','next','correct-count','attempted-count']){elements[id]=new Element(id==='analysisFocus'?'select':id==='next'?'button':'div');elements[id].id=id;}
elements.analysisFocus.value='mixed';elements.next.hidden=true;
const document={body:new Element('body'),documentElement:new Element('html'),activeElement:null,listeners:{},getElementById:id=>elements[id]||null,createElement:tag=>new Element(tag),createTreeWalker:()=>({currentNode:null,nextNode:()=>false}),addEventListener(type,listener){(this.listeners[type]||(this.listeners[type]=[])).push(listener);},dispatchEvent(event){for(const listener of this.listeners[event.type]||[])listener(event);},querySelectorAll(selector){return Object.values(elements).flatMap(element=>element.querySelectorAll(selector));},querySelector(selector){return this.querySelectorAll(selector)[0]||null;}};
const window={document,BatchMathRNG:{random:rng(1)},BM_TOPIC_PRACTICE:{slug:'increasing-decreasing-intervals-concavity-and-extrema',defaultMode:'calculator',fixedMode:'calculator',analyticsSlug:'targeted-calculator-qa',generatorVersion:'11.13',unit3:true,modeSelectIds:['analysisFocus']},MathJax:{typesetPromise:()=>Promise.resolve()},BMAnalytics:{ensurePracticeStarted(){},problemGenerated(){},answerChecked(){},solutionRevealed(){}}};window.window=window;
const sandbox={window,document,NodeFilter:{SHOW_TEXT:4},Event:FakeEvent,console,Math,setTimeout:callback=>{callback();return 0;},clearTimeout(){}};vm.createContext(sandbox);
for(const file of ['assets/answer-normalization.js','assets/derivative-expression-checker.js','assets/ap-topic-generators.js','assets/unit3-applications-generators.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),sandbox,{filename:file});
const api=window.BatchMathAPTopicGenerators,originalGet=api.get.bind(api);window.__lastProblem=null;window.__forcedProblem=null;window.__generated=0;api.get=function(slug){const generator=originalGet(slug);if(slug!==window.BM_TOPIC_PRACTICE.slug)return generator;return options=>{const problem=window.__forcedProblem||generator(options);window.__forcedProblem=null;window.__lastProblem=problem;window.__generated++;return problem;};};
vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/ap-topic-practice.js'),'utf8'),sandbox,{filename:'assets/ap-topic-practice.js'});

function descendants(root){const result=[];for(const child of root.children||[]){result.push(child,...descendants(child));}return result;}
function inputAndButton(){const nodes=descendants(elements.choices),input=nodes.find(node=>node.tagName==='INPUT'),button=nodes.find(node=>node.tagName==='BUTTON'&&/^Check Answer$/i.test(node.textContent));return{input,button};}
function chooseFocus(focus){window.BatchMathRNG={random:rng(987654321+focus.length*73+window.__generated*997)};elements.analysisFocus.value=focus;elements.analysisFocus.dispatchEvent(new FakeEvent('change'));const problem=window.__lastProblem;if(problem?.analysisFocus!==focus)errors.push(`${focus}: selector generated ${problem?.analysisFocus}`);return problem;}
function submit(problem,correct){const{input,button}=inputAndButton();if(!input||!button){const summary=descendants(elements.choices).map(node=>`${node.tagName}:${node.textContent}:${node.className}`).join('|');errors.push(`${problem.analysisFocus}: answer input or check button did not render (${summary})`);return;}input.value=correct?problem.answerTex:(problem.answerType==='numeric'?'999.999':'[999.000,1000.000]');button.click();const expected=correct?'Correct.':'Not quite.';if(!elements.feedback.innerHTML.includes(expected))errors.push(`${problem.analysisFocus}: ${correct?'correct':'wrong'} answer was not checked correctly`);if(!elements.feedback.innerHTML.includes('worked-steps'))errors.push(`${problem.analysisFocus}: worked explanation did not appear after checking`);if(elements.next.hidden)errors.push(`${problem.analysisFocus}: Next Question did not appear after checking`);}
function mountForcedDecimalProblem(){
  window.__forcedCounter=(window.__forcedCounter||0)+1;
  window.__forcedProblem={id:'qa-leading-decimal-0234-'+window.__forcedCounter,variant:'qa_leading_decimal',analysisFocus:'poi',questionHtml:'<div>Enter the calculator value. Round to exactly three decimal places.</div>',answerType:'numeric',numericAnswer:.234,numericTolerance:.000500001,answerTex:'0.234',requiredDecimals:3,numericPlaceholder:'Enter an answer with exactly 3 decimal places',explanation:'<div class="worked-steps"><p><strong>Step 1:</strong> The checked value is \\(0.234\\).</p></div>'};
  elements.analysisFocus.value='poi';elements.analysisFocus.dispatchEvent(new FakeEvent('change'));return window.__lastProblem;
}
function submitRaw(problem,raw,expected){
  const{input,button}=inputAndButton();if(!input||!button){errors.push(`${problem.id}: answer input or check button did not render`);return;}
  input.value=raw;button.click();if(!elements.feedback.innerHTML.includes(expected))errors.push(`${problem.id}: ${JSON.stringify(raw)} did not produce ${JSON.stringify(expected)}`);
}

for(const focus of ['incdec','concavity','poi','extrema']){
  const correct=chooseFocus(focus);submit(correct,true);const before=window.__generated;document.dispatchEvent(new FakeEvent('keydown',{key:'Enter'}));if(window.__generated!==before+1)errors.push(`${focus}: Enter advanced ${window.__generated-before} problems instead of one`);
  const wrong=window.__lastProblem;submit(wrong,false);checks.push(`${focus}: selector, typed answer, feedback, worked solution, and one-step Enter advance`);
}
submitRaw(mountForcedDecimalProblem(),'.234','Correct.');
submitRaw(mountForcedDecimalProblem(),'0.234','Correct.');
submitRaw(mountForcedDecimalProblem(),'.23','exactly 3 digits after the decimal point');
submitRaw(mountForcedDecimalProblem(),'0.2340','exactly 3 digits after the decimal point');
checks.push('leading-decimal and leading-zero forms accepted; two- and four-decimal forms rejected');
const page=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-3-applications-derivative/topics/increasing-decreasing-intervals-concavity-and-extrema/calculator-practice/index.html'),'utf8');
for(const token of ['id="analysisFocus"','value="incdec"','value="concavity"','value="poi"','value="extrema"','"fixedMode":"calculator"','/assets/ap-topic-practice.js','/assets/calculus-keypad.js'])if(!page.includes(token))errors.push(`calculator page is missing ${token}`);
const report={ok:errors.length===0,generatedAt:new Date().toISOString(),checks,errors},out=path.join(ROOT,'qa-results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'unit3-analysis-calculator-interaction-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(`BatchMath Unit 3 calculator derivative-analysis interaction QA\nResult: ${report.ok?'PASS':'FAIL'}\n${checks.map(check=>`- ${check}`).join('\n')}\nErrors: ${errors.length}${errors.length?'\n'+errors.map(error=>`- ${error}`).join('\n'):''}`);if(errors.length)process.exit(1);
