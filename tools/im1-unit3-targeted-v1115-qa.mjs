#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[];
let checks=0,seed=151515151;
const assert=(condition,message)=>{checks++;if(!condition)errors.push(message);};
const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
const read=relative=>fs.readFileSync(path.join(ROOT,relative),'utf8');

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

function fractionValue(raw){const [top,bottom='1']=String(raw).split('/').map(Number);return top/bottom;}
function parenthesize(value){return value<0?`(${value})`:String(value);}
function plainSlopeIntercept(line,left='y'){
 const m=Number(line.m),b=Number(line.b),mText=m===1?'':m===-1?'-':String(m),bText=b===0?'':b>0?`+${b}`:String(b);
 return `${left}=${mText}x${bText}`;
}
function plainPointSlope(line,point=(line.points||[[line.x1,line.y1]])[0]){
 const [x,y]=point,m=Number(line.m),mText=m===1?'':m===-1?'-':String(m),left=y===0?'y':y>0?`y-${y}`:`y+${Math.abs(y)}`,inside=x===0?'x':x>0?`x-${x}`:`x+${Math.abs(x)}`;
 return `${left}=${mText}${x===0?'(x-0)':`(${inside})`}`;
}
function canonicalField(field){
 if(field.check==='line')return field.line.form==='slope-intercept'?plainSlopeIntercept(field.line,field.line.left?.[0]||'y'):plainPointSlope(field.line);
 if(field.check==='formula')return `a_n=${field.formula.a}+${field.formula.d}(n-1)`;
 return field.answer;
}
function checkWorkedExplanation(problem,label){
 assert(problem.explain.includes('class="bm-u3-worked-steps"'),`${label}: explanation is not in the vertical worked-step structure`);
 const stepCount=(problem.explain.match(/<strong>Step \d+:<\/strong>/g)||[]).length;
 assert(stepCount>=2,`${label}: explanation has fewer than two worked steps`);
 assert(!/Use the two highlighted lattice points/i.test(problem.explain),`${label}: removed highlighted-lattice wording remains`);
 assert(!/Therefore the requested|So the requested value is/i.test(problem.explain),`${label}: redundant generic final conclusion remains`);
}

function inspectGraphProblem(problem,label){
 const match=problem.id.match(/^u3-02e-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)$/);
 assert(Boolean(match),`${label}: graph id does not expose generated coordinates`);
 if(!match)return;
 const [,x1Text,y1Text,x2Text,y2Text]=match,[x1,y1,x2,y2]=[x1Text,y1Text,x2Text,y2Text].map(Number),rise=y2-y1,run=x2-x1;
 assert((problem.q.match(/class="bm-u3-grid-line"/g)||[]).length===22,`${label}: missing complete coordinate grid`);
 assert((problem.q.match(/class="bm-u3-highlight-point"/g)||[]).length===2,`${label}: expected exactly two highlighted points`);
 assert((problem.q.match(/class="bm-u3-highlight-point"[^>]*fill="#d71920"[^>]*stroke="none"/g)||[]).length===2,`${label}: both points are not solid red with no outline`);
 assert(!/stroke="#fff"|stroke="white"|fill="#f5c400"/i.test(problem.q),`${label}: white ring or old yellow point remains`);
 assert(problem.explain.includes(`(${x1},${y1})`)&&problem.explain.includes(`(${x2},${y2})`),`${label}: actual coordinates are missing from the explanation`);
 assert(problem.explain.includes(`y_2-y_1=${y2}-${parenthesize(y1)}=${rise}`),`${label}: actual rise work is missing`);
 assert(problem.explain.includes(`x_2-x_1=${x2}-${parenthesize(x1)}=${run}`),`${label}: actual run work is missing`);
 assert(Math.abs(fractionValue(problem.answer)-rise/run)<1e-12,`${label}: slope answer disagrees with coordinates`);
 checkWorkedExplanation(problem,label);
}

for(let index=0;index<5000;index++)inspectGraphProblem(generators.get('slope-from-graphs')(),`Slope graph ${index+1}`);
for(let index=0;index<5000;index++){
 const problem=generators.get('collinearity-and-slope')();
 assert(problem.kind==='mc',`Collinearity ${index+1}: answer type unexpectedly changed`);
 assert(problem.choices.length===2&&[...problem.choices].sort().join('|')==='No|Yes',`Collinearity ${index+1}: choices are not exactly Yes and No`);
 checkWorkedExplanation(problem,`Collinearity ${index+1}`);
}

const sectionC=generators.sections.c,sectionD=generators.sections.d;
const observedC=new Set(),observedD=new Set();
for(const slug of [...sectionC,...sectionD]){
 const make=generators.get(slug);
 for(let index=0;index<2500;index++){
  const problem=make();
  (sectionC.includes(slug)?observedC:observedD).add(`${slug}:${problem.variant}`);
  assert(problem.kind!=='mc',`${slug} ${index+1}: old multiple-choice output remains`);
  assert(problem.kind==='multi'||problem.kind==='formula',`${slug} ${index+1}: expected typed/formula answer entry`);
  checkWorkedExplanation(problem,`${slug} ${index+1}`);
  if(problem.kind==='multi')for(const field of problem.fields){
   const value=canonicalField(field),result=qa.fieldResult(value,field);
   assert(result.ok===true,`${slug} ${index+1}: canonical typed answer was rejected (${field.id}: ${value})`);
  }
  if(problem.kind==='formula')assert(qa.formulaEquivalent(`a_n=${problem.formula.a}+${problem.formula.d}(n-1)`,problem.formula).ok===true,`${slug} ${index+1}: canonical formula was rejected`);
 }
}

for(let index=0;index<10000;index++){
 const problem=generators.get('writing-equations-of-lines')();
 const field=problem.fields[0];
 assert(/in (?:slope-intercept|point-slope) form/i.test(problem.q),`Writing-lines ${index+1}: requested form is not explicit`);
 if(field.line.form==='slope-intercept'){
  assert(qa.lineEquationEquivalent(plainSlopeIntercept(field.line),field.line).ok===true,`Writing-lines ${index+1}: slope-intercept answer rejected`);
  const standard=`${field.line.m}x-y=${-field.line.b}`;
  assert(qa.lineEquationEquivalent(standard,field.line).ok!==true,`Writing-lines ${index+1}: non-requested standard form was accepted`);
 }else{
  assert(qa.lineEquationEquivalent(plainPointSlope(field.line),field.line).ok===true,`Writing-lines ${index+1}: point-slope answer rejected`);
  const [x,y]=(field.line.points||[[field.line.x1,field.line.y1]])[0],b=y-field.line.m*x;
  assert(qa.lineEquationEquivalent(plainSlopeIntercept({m:field.line.m,b}),field.line).ok!==true,`Writing-lines ${index+1}: non-requested slope-intercept form was accepted`);
  if((field.line.points||[]).length===2)assert(qa.lineEquationEquivalent(plainPointSlope(field.line,field.line.points[1]),field.line).ok===true,`Writing-lines ${index+1}: equivalent point-slope form using the second given point was rejected`);
 }
}

for(let index=0;index<10000;index++){
 const problem=generators.get('converting-point-slope-to-slope-intercept')();
 assert(!/y(?:\+|-)0(?!\d)/.test(problem.q),`Conversion ${index+1}: y plus/minus zero appears in the question`);
 assert(!/=\s*(?:-?\d+|\\frac\{[^}]+\}\{[^}]+\})\(x\)/.test(problem.q),`Conversion ${index+1}: unnecessary coefficient(x) appears`);
 assert(qa.fieldResult(plainSlopeIntercept(problem.fields[0].line),problem.fields[0]).ok===true,`Conversion ${index+1}: correct converted equation was rejected`);
}

for(let index=0;index<10000;index++){
 const problem=generators.get('linear-function-word-problems')();
 assert(problem.kind==='multi'&&problem.fields.length===2,`Word problem ${index+1}: expected exactly two typed fields`);
 assert(problem.fields[0].check==='line'&&problem.fields[1].check==='number',`Word problem ${index+1}: fields are not equation then amount`);
 const model=qa.fieldResult(plainSlopeIntercept(problem.fields[0].line,problem.fields[0].line.left[0]),problem.fields[0]);
 const amount=qa.fieldResult(problem.fields[1].answer,problem.fields[1]);
 const wrongAmount=qa.fieldResult(String(Number(problem.fields[1].answer)+1),problem.fields[1]);
 assert(model.ok===true&&amount.ok===true&&wrongAmount.ok!==true,`Word problem ${index+1}: independent model/value checking failed`);
}

for(const [reviewSlug,section,keys] of [['section-b-review','b',generators.sections.b],['section-c-review','c',sectionC],['section-d-review','d',sectionD]]){
 const review=generators.get(reviewSlug);
 for(const key of keys)for(let index=0;index<200;index++){
  const problem=review({mode:key});
  assert(problem.id.startsWith(`u3-0${'abcd'.indexOf(section)+1}`),`${reviewSlug}/${key}: focused mode returned the wrong section`);
  if(section==='b'&&key==='slope-from-graphs')inspectGraphProblem(problem,`${reviewSlug}/${key} ${index+1}`);
  if(section==='c'||section==='d')assert(problem.kind!=='mc',`${reviewSlug}/${key}: stale multiple-choice review output remains`);
 }
}

const comprehensive=generators.get('unit-3-comprehensive-review');
for(const section of ['b','c','d'])for(let index=0;index<3000;index++){
 const problem=comprehensive({mode:section});
 assert(problem.id.startsWith(`u3-0${'abcd'.indexOf(section)+1}`),`Comprehensive ${section} ${index+1}: returned the wrong section`);
 if(section==='b'&&problem.id.startsWith('u3-02e-'))inspectGraphProblem(problem,`Comprehensive graph ${index+1}`);
 if(section==='c'||section==='d')assert(problem.kind!=='mc',`Comprehensive ${section} ${index+1}: stale multiple-choice output remains`);
 checkWorkedExplanation(problem,`Comprehensive ${section} ${index+1}`);
}

for(const slug of generators.list()){
 const make=generators.get(slug);
 for(let index=0;index<500;index++)checkWorkedExplanation(make(),`${slug} explanation ${index+1}`);
}

const yesNo=generators.get('collinearity-and-slope')();
const ordinaryTyped=generators.get('slope-from-two-points')();
assert(qa.shouldAutoAdvance(ordinaryTyped,true)===true,'Correct non-Yes/No response does not auto-advance');
assert(qa.shouldAutoAdvance(ordinaryTyped,false)===false,'Wrong response can auto-advance');
assert(qa.shouldAutoAdvance(yesNo,true)===false,'Correct Yes/No response can auto-advance');
assert(qa.shouldAutoAdvance(yesNo,false)===false,'Wrong Yes/No response can auto-advance');

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
 stopPropagation(){this.propagationStopped=true;}
}
function runPhysicalEnterCheck(slug){
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
 assert(editor?.className==='bm-fraction-editor',`${slug}: fraction editor did not initialize`);
 editor.dispatchEvent(new FakeEvent('keydown',{key:'Enter',ctrlKey:false,metaKey:false,altKey:false}));
 assert(checkClicks===1,`${slug}: physical Enter did not check exactly once`);
 assert(nextClicks===0,`${slug}: physical Enter directly advanced instead of submitting once`);
 editor.dispatchEvent(new FakeEvent('keydown',{key:'Enter',ctrlKey:false,metaKey:false,altKey:false}));
 assert(checkClicks===1,`${slug}: a second Enter double-submitted the locked response`);
 assert(nextClicks===0,`${slug}: a second Enter caused direct advancement`);
}
for(const slug of ['solving-function-equations','slope-from-two-points','slope-from-graphs'])runPhysicalEnterCheck(slug);

const css=read('assets/im1-unit3.css'),practiceSource=read('assets/im1-unit3-practice.js');
for(const token of ['bm-u3-section-b-practice.bm-practice-active','bm-u3-section-b-problem.bm-practice-active','font-size:1.12rem!important','font-size:.98rem!important','font-size:1.06rem!important','font-size:.96rem!important','.bm-u3-grid-line{stroke:#444'])assert(css.includes(token),`Section B styling is missing ${token}`);
assert(practiceSource.includes("classList.toggle('bm-u3-section-b-problem',problem.unitSection==='b')"),'Comprehensive review does not dynamically inherit Section B font styling');
assert((practiceSource.match(/window\.setTimeout\(/g)||[]).length===1,'Unit 3 runtime has more than one auto-advance timer source');
assert(practiceSource.includes('problemSerial===submittedSerial'),'Auto-advance timer is not guarded against stale/double advancement');

const sectionRoot=path.join(ROOT,'im1/unit-3-linear-equation/topics');
for(const relative of [
 'b-functions-function-notation-and-slope/section-b-review/practice/index.html',
 'c-slope-intercept-form-and-point-slope-form/section-c-review/practice/index.html',
 'd-recursive-formulas-for-linear-relationships/section-d-review/practice/index.html',
 'comprehensive-review/practice/index.html'
]){
 const page=fs.readFileSync(path.join(sectionRoot,relative),'utf8');
 assert(page.includes('/assets/im1-unit3-generators.js')&&page.includes('/assets/im1-unit3-practice.js'),`${relative}: review page is not wired to shared Unit 3 logic`);
}

const workflowPath=path.join(ROOT,'.github/workflows/batchmath-qa.yml');
assert(fs.existsSync(workflowPath),'.github/workflows/batchmath-qa.yml is missing');
if(fs.existsSync(workflowPath)){
 const digest=crypto.createHash('sha256').update(fs.readFileSync(workflowPath)).digest('hex');
 assert(digest==='d8823214cd05a010f6d2dedd12c1de1d290ab73736ac13f631e6539a44293f36','batchmath-qa.yml changed unexpectedly');
}

const report={
 ok:errors.length===0,
 checks,
 generatedSamples:{slopeGraphs:5000,collinearity:5000,sectionC:sectionC.length*2500,sectionD:sectionD.length*2500,writingForms:10000,conversions:10000,wordProblems:10000,comprehensive:9000},
 observedSectionCVariants:[...observedC].sort(),
 observedSectionDVariants:[...observedD].sort(),
 workflowSha256:fs.existsSync(workflowPath)?crypto.createHash('sha256').update(fs.readFileSync(workflowPath)).digest('hex'):null,
 errors
};
fs.mkdirSync(path.join(ROOT,'qa-results'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'qa-results/im1-unit3-targeted-v1115-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(`IM1 Unit 3 targeted v11.15 QA: ${report.ok?'PASS':'FAIL'}`);
console.log(`Checks: ${checks}`);
console.log(`Errors: ${errors.length}`);
for(const error of errors.slice(0,100))console.log(`- ${error}`);
if(errors.length)process.exit(1);
