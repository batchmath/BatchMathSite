#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[];let checks=0,seed=314159265;
const assert=(condition,message)=>{checks++;if(!condition)errors.push(message);};
const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
const read=relative=>fs.readFileSync(path.join(ROOT,relative),'utf8');

const sandbox={window:{BatchMathRNG:{random}},Math,console};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
vm.runInContext(read('assets/im1-unit3-generators.js'),sandbox,{filename:'assets/im1-unit3-generators.js'});
const generators=sandbox.window.BatchMathIM1Unit3Generators;

function fractionValue(raw){const [top,bottom='1']=String(raw).split('/').map(Number);return top/bottom;}
function parenthesize(value){return value<0?`(${value})`:String(value);}
function inspectGraphProblem(problem,label){
  const match=problem.id.match(/^u3-02e-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)$/);
  assert(Boolean(match),`${label}: graph problem id does not expose its generated coordinates`);
  if(!match)return;
  const [,x1Text,y1Text,x2Text,y2Text]=match,[x1,y1,x2,y2]=[x1Text,y1Text,x2Text,y2Text].map(Number);
  const rise=y2-y1,run=x2-x1;
  assert((problem.q.match(/class="bm-u3-grid-line"/g)||[]).length===22,`${label}: graph does not contain the complete 11-by-11 grid`);
  assert((problem.q.match(/class="bm-u3-highlight-point"/g)||[]).length===2,`${label}: graph does not contain exactly two highlighted points`);
  assert((problem.q.match(/class="bm-u3-highlight-point"[^>]*fill="#d71920"/g)||[]).length===2,`${label}: both highlighted points are not red`);
  assert(!problem.q.includes('fill="#f5c400"'),`${label}: an old yellow highlighted point remains`);
  for(const step of ['Step 1:','Step 2:','Step 3:','Step 4:'])assert(problem.explain.includes(step),`${label}: explanation is missing ${step}`);
  assert(problem.explain.includes(`(${x1},${y1})`)&&problem.explain.includes(`(${x2},${y2})`),`${label}: explanation omits the actual point coordinates`);
  assert(problem.explain.includes(`y_2-y_1=${y2}-${parenthesize(y1)}=${rise}`),`${label}: explanation does not calculate the actual rise`);
  assert(problem.explain.includes(`x_2-x_1=${x2}-${parenthesize(x1)}=${run}`),`${label}: explanation does not calculate the actual run`);
  assert(Math.abs(fractionValue(problem.answer)-rise/run)<1e-12,`${label}: slope answer disagrees with the generated coordinates`);
  assert(!/Use the two highlighted lattice points/i.test(problem.explain),`${label}: removed highlighted-lattice-points wording remains`);
}

for(let i=0;i<5000;i++)inspectGraphProblem(generators.get('slope-from-graphs')(),`slope-from-graphs sample ${i+1}`);

for(let i=0;i<5000;i++){
  const problem=generators.get('collinearity-and-slope')();
  assert(problem.kind==='mc',`collinearity sample ${i+1}: answer type changed`);
  assert(problem.choices.length===2,`collinearity sample ${i+1}: expected two choices, found ${problem.choices.length}`);
  assert([...problem.choices].sort().join('|')==='No|Yes',`collinearity sample ${i+1}: choices are not exactly Yes and No`);
  assert(problem.answerText==='Yes'||problem.answerText==='No',`collinearity sample ${i+1}: answer text is not Yes or No`);
  const values=problem.id.replace(/^u3-02d-/,'').split('_').map(Number),points=[];
  for(let at=0;at<values.length;at+=2)points.push([values[at],values[at+1]]);
  const slopes=points.slice(1).map((point,index)=>(point[1]-points[index][1])/(point[0]-points[index][0]));
  const isCollinear=slopes.every(value=>Math.abs(value-slopes[0])<1e-12);
  assert(problem.answerText===(isCollinear?'Yes':'No'),`collinearity sample ${i+1}: Yes/No answer does not match the generated points`);
}

const sectionBReview=generators.get('section-b-review');
for(let i=0;i<500;i++){
  const collinearity=sectionBReview({mode:'collinearity-and-slope'});
  assert(collinearity.choices.length===2&&[...collinearity.choices].sort().join('|')==='No|Yes',`Section B Review collinearity sample ${i+1} did not inherit Yes/No choices`);
  inspectGraphProblem(sectionBReview({mode:'slope-from-graphs'}),`Section B Review graph sample ${i+1}`);
}

class ClassList{
  constructor(element){this.element=element;this.values=new Set();}
  add(...values){values.forEach(value=>this.values.add(value));this.sync();}
  remove(...values){values.forEach(value=>this.values.delete(value));this.sync();}
  contains(value){return this.values.has(value);}
  toggle(value,force){const active=force===undefined?!this.values.has(value):Boolean(force);active?this.values.add(value):this.values.delete(value);this.sync();return active;}
  sync(){this.element._className=[...this.values].join(' ');}
}
class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.dataset={};this.attributes={};this.classList=new ClassList(this);this._className='';this._innerHTML='';this.textContent='';this.value='';this.hidden=false;this.disabled=false;this.readOnly=false;this.parentElement=null;this.style={};}
  set className(value){this._className=String(value);this.classList.values=new Set(String(value).split(/\s+/).filter(Boolean));}
  get className(){return this._className;}
  set innerHTML(value){this._innerHTML=String(value);}
  get innerHTML(){return this._innerHTML;}
  appendChild(node){this.children.push(node);node.parentElement=this;return node;}
  insertAdjacentElement(position,node){if(position==='beforebegin')this.before=node;else if(position==='afterend')this.after=node;node.parentElement=this.parentElement;return node;}
  setAttribute(name,value){this.attributes[name]=String(value);}
  addEventListener(type,listener){(this.listeners[type]||(this.listeners[type]=[])).push(listener);}
  dispatchEvent(event){event.target=this;for(const listener of this.listeners[event.type]||[])listener(event);return!event.defaultPrevented;}
  focus(){this.ownerDocument.activeElement=this;}
  blur(){}
  setSelectionRange(){}
  closest(selector){if(selector==='.question-area')return this.questionArea||this.parentElement;return null;}
  querySelectorAll(selector){const all=[];const visit=node=>{for(const child of node.children||[]){if(selector==='button'&&child.tagName==='BUTTON')all.push(child);visit(child);}};visit(this);return all;}
}
class FakeEvent{
  constructor(type,options={}){this.type=type;Object.assign(this,options);this.defaultPrevented=false;}
  preventDefault(){this.defaultPrevented=true;}
}
function runEnterInteraction(slug){
  const root=new Element('html'),area=new Element('div'),practice=new Element('section'),input=new Element('input'),checkButton=new Element('button'),nextButton=new Element('button');
  area.className='question-area';input.dataset.bmKeypad='fraction';input.value='3/4';input.parentElement=area;input.questionArea=area;area.children.push(input);nextButton.hidden=true;
  let checkClicks=0,nextClicks=0;
  checkButton.click=()=>{checkClicks++;input.disabled=true;checkButton.disabled=true;};nextButton.click=()=>{nextClicks++;};
  const elements={practiceCard:practice,checkBtn:checkButton,nextBtn:nextButton};
  const document={readyState:'complete',documentElement:root,activeElement:null,createElement:tag=>{const element=new Element(tag);element.ownerDocument=document;return element;},querySelectorAll:selector=>selector==='input[data-bm-keypad]'?[input]:[],getElementById:id=>elements[id]||null,addEventListener(){}};
  for(const element of [root,area,practice,input,checkButton,nextButton])element.ownerDocument=document;
  const window={document,BM_UNIT3_PRACTICE:{slug},matchMedia:()=>({matches:false}),scrollTo(){}};window.window=window;
  const runtime={window,document,navigator:{maxTouchPoints:0},Event:FakeEvent,MutationObserver:class{observe(){}},requestAnimationFrame:callback=>{callback();return 0;},console};
  vm.createContext(runtime);vm.runInContext(read('assets/im1-keypad.js'),runtime,{filename:'assets/im1-keypad.js'});
  const editor=input.before;
  assert(editor?.className==='bm-fraction-editor',`${slug}: stacked fraction editor did not initialize`);
  editor.dispatchEvent(new FakeEvent('keydown',{key:'Enter',ctrlKey:false,metaKey:false,altKey:false}));
  assert(checkClicks===1,`${slug}: physical Enter did not check exactly once`);
  assert(nextClicks===0,`${slug}: physical Enter advanced instead of checking`);
  editor.dispatchEvent(new FakeEvent('keydown',{key:'Enter',ctrlKey:false,metaKey:false,altKey:false}));
  assert(checkClicks===1,`${slug}: a second Enter double-submitted the checked answer`);
  assert(nextClicks===0,`${slug}: Enter advanced after the answer was checked`);
}
for(const slug of ['solving-function-equations','slope-from-two-points','slope-from-graphs'])runEnterInteraction(slug);

const practiceSource=read('assets/im1-unit3-practice.js'),keypadSource=read('assets/im1-keypad.js'),css=read('assets/im1-unit3.css');
assert(!practiceSource.includes("event.key==='Enter'&&locked"),'Unit 3 still contains Enter-to-advance behavior after checking');
assert(!keypadSource.includes('next.click()'),'shared IM1 fraction editor can still advance with Enter');
for(const slug of ['evaluating-functions','solving-function-equations','slope-from-two-points','collinearity-and-slope','slope-from-graphs','section-b-review'])assert(practiceSource.includes(`'${slug}'`),`Section B font scope omits ${slug}`);
for(const token of ['bm-u3-section-b-practice.bm-practice-active','font-size:1.04rem!important','font-size:.88rem!important','font-size:1rem!important','font-size:.76rem!important','.bm-u3-grid-line{stroke:#444'])assert(css.includes(token),`Section B readability styling is missing ${token}`);

const sectionBRoot=path.join(ROOT,'im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope');
for(const slug of ['evaluating-functions','solving-function-equations','slope-from-two-points','collinearity-and-slope','slope-from-graphs','section-b-review']){
  const page=fs.readFileSync(path.join(sectionBRoot,slug,'practice/index.html'),'utf8');
  assert(page.includes('/assets/im1-unit3.css')&&page.includes('/assets/im1-unit3-practice.js'),`${slug}: practice page is not wired to the shared Section B styling/runtime`);
}

const workflowPath=path.join(ROOT,'.github/workflows/batchmath-qa.yml');
assert(fs.existsSync(workflowPath),'.github/workflows/batchmath-qa.yml is missing');
if(fs.existsSync(workflowPath)){
  const digest=crypto.createHash('sha256').update(fs.readFileSync(workflowPath)).digest('hex');
  assert(digest==='d8823214cd05a010f6d2dedd12c1de1d290ab73736ac13f631e6539a44293f36','batchmath-qa.yml was not preserved byte-for-byte');
}

const report={ok:errors.length===0,checks,graphSamples:5500,collinearitySamples:5500,enterEngines:['solving-function-equations','slope-from-two-points','slope-from-graphs'],errors};
fs.mkdirSync(path.join(ROOT,'qa-results'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'qa-results/im1-unit3-section-b-v1114-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(`IM1 Unit 3 Section B v11.14 targeted QA: ${report.ok?'PASS':'FAIL'}`);
console.log(`Checks: ${checks}`);
console.log(`Slope-from-graphs samples: ${report.graphSamples}`);
console.log(`Collinearity samples: ${report.collinearitySamples}`);
console.log(`Physical Enter engines: ${report.enterEngines.length}`);
console.log(`Errors: ${errors.length}`);
for(const error of errors.slice(0,100))console.log(`- ${error}`);
if(errors.length)process.exit(1);
