#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

let seed=117117117;
const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
const generatorSandbox={window:{BatchMathRNG:{random}},Math,console};
generatorSandbox.window.window=generatorSandbox.window;
vm.createContext(generatorSandbox);
vm.runInContext(read('assets/im1-unit3-generators.js'),generatorSandbox,{filename:'assets/im1-unit3-generators.js'});
const generators=generatorSandbox.window.BatchMathIM1Unit3Generators;

const practiceSandbox={
  window:{BM_UNIT3_PRACTICE:{}},
  document:{documentElement:{classList:{add(){},toggle(){}}},addEventListener(){}},
  navigator:{maxTouchPoints:0},Event:class{},requestAnimationFrame(){},console,Math
};
practiceSandbox.window.window=practiceSandbox.window;
practiceSandbox.window.document=practiceSandbox.document;
vm.createContext(practiceSandbox);
vm.runInContext(read('assets/im1-unit3-practice.js'),practiceSandbox,{filename:'assets/im1-unit3-practice.js'});
const qa=practiceSandbox.window.BatchMathIM1Unit3PracticeQA;
const unit3Css=read('assets/im1-unit3.css');
assert(unit3Css.includes('.bm-u3-field-grid.is-three-fields{grid-template-columns:repeat(3,minmax(0,1fr));max-width:720px;justify-content:center}'),'three-field desktop layout is not centered and balanced');
assert(unit3Css.includes('@media(max-width:760px){.bm-u3-field-grid.is-three-fields{grid-template-columns:1fr;max-width:360px}}'),'three-field mobile layout is not safely stacked');

assert.equal(qa.enterAdvanceRule(true,'completed-no'),true,'a completed correct No branch must allow physical Enter to advance');
assert.equal(qa.enterAdvanceRule(true,'choice'),false,'ordinary Yes/No choices must preserve manual advancement');
assert.equal(qa.enterAdvanceRule(false,'completed-no'),false,'an incorrect No response must not advance');
assert.equal(qa.enterAdvanceRule(true,'typed'),true,'a completed correct typed stage must still advance');

assert.equal(qa.numericEqual('1.5','3/2').ok,true,'decimal slope must equal the fractional slope');
assert.equal(qa.numericEqual('.75','3/4').ok,true,'leading-decimal slope must be accepted');
assert.equal(qa.lineEquationEquivalent('y=1.5x+4',{form:'slope-intercept',m:1.5,b:4,left:['y']}).ok,true,'decimal line coefficient rejected');
assert.equal(qa.lineEquationEquivalent('y=(3)/(2)x+4',{form:'slope-intercept',m:1.5,b:4,left:['y']}).ok,true,'stacked fraction line coefficient rejected');
assert.equal(qa.lineEquationEquivalent('y-1=-(4)/(5)(x-2)',{form:'point-slope',m:-.8,x1:2,y1:1,points:[[2,1]]}).ok,true,'negative stacked fractional point-slope equation rejected');

for(let index=0;index<500;index++){
  const problem=generators.get('common-difference-recursive-formulas')();
  assert.equal(Array.from(problem.fields,field=>field.id).join(','),'difference,initial,recursive');
  assert(problem.fields[1].labelHtml.includes('a_1'),'initial-term label must use rendered a_1 notation');
  assert.equal(qa.fieldResult(String(problem.d),problem.fields[0]).ok,true);
  assert.equal(qa.fieldResult(String(problem.a),problem.fields[1]).ok,true,'numeric-only initial term rejected');
  assert.equal(qa.fieldResult(`a_1=${problem.a}`,problem.fields[1]).ok,true,'full a_1 notation rejected');
  assert.equal(qa.fieldResult(`a₁=${problem.a}`,problem.fields[1]).ok,true,'rendered a₁ notation rejected');
  assert.notEqual(qa.fieldResult('a_1',problem.fields[1]).ok,true,'a_1 by itself must not be accepted');
  const rule=`a_n=a_{n-1}${problem.d<0?problem.d:`+${problem.d}`}`;
  assert.equal(qa.fieldResult(rule,problem.fields[2]).ok,true,'separate recursive rule field rejected its correct rule');
}

for(let index=0;index<2000;index++){
  const problem=generators.get('linear-function-word-problems')();
  assert(!/requested amount/i.test(problem.explain),'generic contextual conclusion remains');
  assert(/So the (?:total cost|cost to rent|battery percentage|amount of water|candle's height|total amount saved)/.test(problem.explain),'word-problem conclusion does not name its real-world quantity');
}

for(const [review,mode] of [['section-d-review','common-difference-recursive-formulas'],['unit-3-comprehensive-review','d']]){
  let found=false;
  for(let index=0;index<2000&&!found;index++){
    const problem=generators.get(review)({mode});
    if(problem.id.startsWith('u3-04c-')){
      found=true;
      assert.equal(Array.from(problem.fields,field=>field.id).join(','),'difference,initial,recursive',`${review} retained a stale 04C field layout`);
    }
  }
  assert(found,`${review} did not expose the updated 04C family`);
}

class ClassList{add(){} remove(){} toggle(){} contains(){return false;}}
let activeDocument=null;
class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.dataset={};this.value='';this.disabled=false;this.children=[];this.events={};this.classList=new ClassList();this.attributes={};this.style={};this.parentElement=null;this.className='';}
  addEventListener(type,listener){(this.events[type]??=[]).push(listener);}
  dispatchEvent(event){event.target=this;for(const listener of this.events[event.type]||[])listener(event);return true;}
  setAttribute(name,value){this.attributes[name]=String(value);}
  appendChild(child){this.children.push(child);child.parentElement=this;return child;}
  insertAdjacentElement(position,child){if(position==='beforebegin')this.before=child;if(position==='afterend')this.after=child;child.parentElement=this.parentElement;return child;}
  closest(selector){if(selector==='.question-area')return this.questionArea||this.parentElement;return null;}
  querySelectorAll(selector){const out=[];const walk=node=>{for(const child of node.children||[]){if(selector==='button'&&child.tagName==='BUTTON')out.push(child);walk(child);}};walk(this);return out;}
  focus(){if(activeDocument)activeDocument.activeElement=this;}
  setSelectionRange(){}
}
class Event{constructor(type,options={}){this.type=type;Object.assign(this,options);}preventDefault(){}stopPropagation(){}}
function keypadRuntime(unit3){
  const area=new Element('div'),input=new Element('input');input.dataset.bmKeypad='fraction';input.parentElement=area;input.questionArea=area;area.children.push(input);
  const document={readyState:'complete',activeElement:null,documentElement:new Element('html'),createElement:tag=>new Element(tag),querySelectorAll:selector=>selector==='input[data-bm-keypad]'?[input]:[],getElementById:()=>null,addEventListener(){}};
  activeDocument=document;
  const window={document,matchMedia:()=>({matches:false}),scrollTo(){}};if(unit3)window.BM_UNIT3_PRACTICE={slug:'slope-from-two-points'};window.window=window;
  const sandbox={window,document,navigator:{maxTouchPoints:0},Event,MutationObserver:class{observe(){}},requestAnimationFrame:callback=>callback(),console};
  vm.createContext(sandbox);vm.runInContext(read('assets/im1-keypad.js'),sandbox,{filename:'assets/im1-keypad.js'});
  return{input,editor:input.before,pad:input.after};
}
const unit3Keypad=keypadRuntime(true),unit3Buttons=unit3Keypad.pad.querySelectorAll('button');
assert(unit3Buttons.some(button=>button.textContent==='.'),'Unit 3 slope keypad is missing its decimal-point key');
unit3Keypad.editor.dispatchEvent(new Event('keydown',{key:'.',ctrlKey:false,metaKey:false,altKey:false}));
assert.equal(unit3Keypad.input.value,'0.','physical decimal entry failed in a Unit 3 slope field');
const unit1Keypad=keypadRuntime(false),unit1Buttons=unit1Keypad.pad.querySelectorAll('button');
assert(!unit1Buttons.some(button=>button.textContent==='.'),'fraction-specific Unit 1 keypad unexpectedly gained a decimal key');

const equationSandbox={window:{BatchMathAnswers:{normalizeFractionSigns:value=>value}},console};
equationSandbox.window.window=equationSandbox.window;
vm.createContext(equationSandbox);vm.runInContext(read('assets/im1-equation-input.js'),equationSandbox,{filename:'assets/im1-equation-input.js'});
assert.equal(equationSandbox.window.BatchMathIM1Equation.check('1.5','3/2').ok,true,'shared IM1 numeric-equation checker rejects a decimal equivalent');

const practicePages=[];
function walk(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())walk(file);else if(file.endsWith('/practice/index.html'))practicePages.push(file);}}
walk(path.join(root,'im1/unit-3-linear-equation'));
assert.equal(practicePages.length,23);
for(const page of practicePages){const html=fs.readFileSync(page,'utf8');assert(html.includes('/assets/calculus-keypad.css'));assert(html.includes('/assets/calculus-keypad.js'));assert(html.includes('data-batchmath-structured-data="11"'),'existing SEO metadata was lost');}

const workflow=path.join(root,'.github/workflows/batchmath-qa.yml');
assert(fs.existsSync(workflow),'batchmath-qa.yml is missing');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(workflow)).digest('hex'),'d8823214cd05a010f6d2dedd12c1de1d290ab73736ac13f631e6539a44293f36','batchmath-qa.yml changed unexpectedly');

console.log({ok:true,recursiveProblems:500,contextProblems:2000,unit3PracticePages:practicePages.length});
