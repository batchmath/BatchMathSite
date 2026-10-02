#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),errors=[];let checks=0,seed=1090401;
const assert=(ok,message)=>{checks++;if(!ok)errors.push(message)};
const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
const sandbox={window:{BatchMathRNG:{random}},Math,console,document:{addEventListener(){},getElementById(){return null}},navigator:{maxTouchPoints:0},Event:class{}};
sandbox.window.window=sandbox.window;sandbox.window.document=sandbox.document;sandbox.window.navigator=sandbox.navigator;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/im1-unit3-generators.js'),'utf8'),sandbox,{filename:'im1-unit3-generators.js'});
vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/im1-unit3-practice.js'),'utf8'),sandbox,{filename:'im1-unit3-practice.js'});
const generators=sandbox.window.BatchMathIM1Unit3Generators,practice=sandbox.window.BatchMathIM1Unit3PracticeQA;

const identifySource=generators.get('identifying-arithmetic-sequences');
for(let i=0;i<2000;i++)assert(identifySource().kind==='mc','approved identification engine changed answer type');

for(let i=0;i<20000;i++){
 const p=generators.get('common-difference-next-terms')();
 assert(p.kind==='multi','common difference is not structured typed input');
 assert(p.fields?.length===4,'common difference does not have four fields');
 assert(p.fields?.every(field=>field.check==='number'),'common difference contains a nonnumeric field');
 const partial=p.fields.map((field,index)=>practice.fieldResult(index===3?String(Number(field.answer)+1):field.answer,field));
 assert(partial.slice(0,3).every(result=>result.ok)&&!partial[3].ok,'partial common-difference response was not checked field by field');
}

const acceptedFormulaCases=[
 [{a:5,d:3},['a_n=5+3(n-1)','a(n)=3n+2','f(n)=2+3*n','5+3(n-1)']],
 [{a:12,d:-4},['a_n=12-4(n-1)','y=-4n+16','a(n)=16-4*n']],
 [{a:-7,d:0},['a_n=-7','f(n)=-7+0n']]
];
acceptedFormulaCases[0][1].push('aₙ=5+3(n-1)');
for(const [target,forms] of acceptedFormulaCases)for(const form of forms)assert(practice.formulaEquivalent(form,target).ok,`equivalent formula rejected: ${form}`);
assert(!practice.formulaEquivalent('a_n=3n+3',{a:5,d:3}).ok,'incorrect formula accepted');
for(let i=0;i<20000;i++){
 const p=generators.get('explicit-formulas-arithmetic-sequences')();
 assert(p.kind==='formula','explicit formula is not typed input');
 assert(!/first five terms/i.test(p.q),'explicit formula still asks for first five terms');
 assert(practice.formulaEquivalent(`a_n=${p.formula.a}+(${p.formula.d})*(n-1)`,p.formula).ok,`generated formula target failed equivalence check: ${p.id}`);
}

let ordinary=0,extended=0;
for(let i=0;i<50000;i++){
 const p=generators.get('finding-a-specific-term')();
 assert(p.n>=10&&p.n<=50,`specific-term index outside 10–50: ${p.n}`);
 if(p.n<=25)ordinary++;else{extended++;assert(Math.abs(p.d)<4,`specific-term index ${p.n} used with |d|=${Math.abs(p.d)}`);}
 assert(p.calculationSize<=300,`specific-term product too large: ${p.calculationSize}`);
 assert(Math.abs(Number(p.answer))<=360,`specific-term answer too extreme: ${p.answer}`);
}
assert(ordinary>extended*3,'specific-term extended indices are not an occasional minority');

const storyCounts=new Map();
for(let i=0;i<120000;i++){
 const p=generators.get('arithmetic-sequence-word-problems')();storyCounts.set(p.storyKey,(storyCounts.get(p.storyKey)||0)+1);
 assert(p.kind==='multi','word problem is not structured typed input');
 assert(p.fields?.length===2&&p.fields[0].check==='formula'&&p.fields[1].check==='number','word problem fields are not model plus final value');
 assert(p.allValues.length===p.n,'word problem sequence length does not reach requested term');
 assert(p.allValues.every(Number.isInteger),'word problem generated a non-whole contextual quantity');
 assert(Math.min(...p.allValues)>=p.validRange[0]&&Math.max(...p.allValues)<=p.validRange[1],`impossible ${p.storyKey} quantity: ${Math.min(...p.allValues)}–${Math.max(...p.allValues)}`);
 assert(p.answer===p.allValues.at(-1)&&p.answer>=0,'word problem final answer is invalid');
 const simplified=`a_n=${p.d}n+${p.a-p.d}`;
 assert(practice.fieldResult(simplified,p.fields[0]).ok,`word model equivalent form rejected: ${simplified}`);
 const partial=[practice.fieldResult(simplified,p.fields[0]),practice.fieldResult(String(p.answer+1),p.fields[1])];
 assert(partial[0].ok&&!partial[1].ok,'word model and final answer were not checked independently');
}
for(const key of ['warehouse','tiles','seats','parking','plant','problems','tank','savings'])assert(storyCounts.has(key),`word-problem family not sampled: ${key}`);

const updatedKinds={
 'common-difference-next-terms':'multi',
 'explicit-formulas-arithmetic-sequences':'formula',
 'finding-a-specific-term':'input',
 'arithmetic-sequence-word-problems':'multi'
};
const sectionA=generators.get('section-a-review');
for(const [mode,kind] of Object.entries(updatedKinds))for(let i=0;i<1000;i++)assert(sectionA({mode}).kind===kind,`Section A Review ${mode} used stale behavior`);
const comprehensive=generators.get('unit-3-comprehensive-review');
for(const [mode,kind] of Object.entries(updatedKinds))for(let i=0;i<1000;i++)assert(comprehensive({mode}).kind===kind,`Comprehensive Practice ${mode} adapter used stale behavior`);
let sawCommon=false,sawFormula=false,sawSpecific=false,sawWord=false;
for(let i=0;i<30000;i++){
 const p=comprehensive({mode:'a'});if(p.id.startsWith('u3-01b-')){sawCommon=true;assert(p.kind==='multi','Comprehensive A emitted old common-difference problem');}
 if(p.id.startsWith('u3-01c-')){sawFormula=true;assert(p.kind==='formula','Comprehensive A emitted old explicit-formula problem');}
 if(p.id.startsWith('u3-01d-')){sawSpecific=true;assert(p.n<=25||Math.abs(p.d)<4,'Comprehensive A emitted unreasonable specific-term index');}
 if(p.id.startsWith('u3-01f-')){sawWord=true;assert(p.kind==='multi'&&Math.min(...p.allValues)>=p.validRange[0],'Comprehensive A emitted stale/invalid word problem');}
}
assert(sawCommon&&sawFormula&&sawSpecific&&sawWord,'Comprehensive A did not sample every updated family');

const practiceSource=fs.readFileSync(path.join(ROOT,'assets/im1-unit3-practice.js'),'utf8'),keypadSource=fs.readFileSync(path.join(ROOT,'assets/im1-keypad.js'),'utf8'),css=fs.readFileSync(path.join(ROOT,'assets/im1-unit3.css'),'utf8');
for(const token of ['bm-u3-field-grid','bm-u3-field-result','is-correct','is-incorrect','bm-u3-shared-keypad'])assert(practiceSource.includes(token)||css.includes(token),`structured UI token missing: ${token}`);
assert(css.includes('font-size:.96rem!important'),'effective desktop Unit 3 font override missing');
assert(css.includes('font-size:.92rem!important'),'effective mobile Unit 3 font override missing');
assert(css.includes('overflow:visible!important'),'nested problem scrolling was not removed');
assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'narrow four-field layout missing');
assert(practiceSource.includes("append('aₙ=')")&&!practiceSource.includes("append('a_n=')"),'formula keypad does not insert a true subscript glyph');
assert(practiceSource.includes("input.readOnly=false"),'structured Unit 3 fields are not keyboard-editable');
assert(keypadSource.includes('touchMode && !window.BM_UNIT3_PRACTICE'),'ordinary Unit 3 numeric fields remain keypad-only on touch-capable devices');

console.log('IM1 Unit 3 Section A v10.9.F QA');
console.log(`Result: ${errors.length?'FAIL':'PASS'}`);console.log(`Checks: ${checks}`);
console.log(`Specific-term indices: ordinary=${ordinary}, extended=${extended}`);
console.log(`Word-problem families: ${[...storyCounts.entries()].sort().map(([key,count])=>`${key}=${count}`).join(', ')}`);
console.log(`Errors: ${errors.length}`);for(const error of errors.slice(0,100))console.log(`- ${error}`);if(errors.length)process.exit(1);
