#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
let seed=90126;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const box={window:{BatchMathRNG:{random}}};vm.createContext(box);
for(const f of ['im1-unit2-generators.js','im1-algebra-input.js'])vm.runInContext(read('assets/'+f),box);
const algebra=box.window.BatchMathIM1Algebra,gen=box.window.BatchMathIM1Unit2Generators;
// Independent numeric evaluator for generated polynomial/distribution TeX only.
function evaluate(text,values){
 const s=text.replace(/\\[()]/g,'').replace(/[{}\s]/g,'');
 assert(/^[a-z0-9()+*^\-]+$/.test(s));
 const tokens=s.match(/\d+|[a-z]|[-+*^()]/g);let i=0;
 function atom(){const t=tokens[i++];if(t==='('){const n=sum();assert.equal(tokens[i++],')');return n;}if(t==='-')return -atom();if(t==='+')return atom();if(/^[a-z]$/.test(t))return values[t];assert(/^\d+$/.test(t));return Number(t);}
 function power(){let n=atom();if(tokens[i]==='^'){i++;n**=atom();}return n;}
 function product(){let n=power();while(i<tokens.length&&!['+', '-', ')'].includes(tokens[i])){if(tokens[i]==='*')i++;n*=power();}return n;}
 function sum(){let n=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++],v=product();n=op==='+'?n+v:n-v;}return n;}
 const n=sum();assert.equal(i,tokens.length);assert(Number.isFinite(n));return n;
}
const values=Object.fromEntries([...'abcdefghijklmnopqrstuvwxyz'].map((v,i)=>[v,(i%5)-2]));
const math=s=>[...s.matchAll(/\\\(([\s\S]*?)\\\)/g)].map(m=>m[1]);
let generated=0,identities=0;const seen=new Set(),variables=new Set(),degrees=new Set();
for(let n=0;n<12000;n++){
 const p=gen.get('equivalent-expressions-combining-like-terms')();generated++;seen.add(p.variant);
 assert(!/happen|equivalent|same value/.test(p.q));
 if(p.kind==='polynomial'){
  assert(!p.choices);assert(p.terms.every(([c])=>Math.abs(c)>=2));
  assert(algebra.check(p.answer,p.answer).ok);
  assert(!algebra.check(p.answer+'+2',p.answer).ok);
  p.variables.forEach(v=>variables.add(v));p.terms.forEach(([,t])=>[...t.matchAll(/\^\{(\d+)\}/g)].forEach(m=>degrees.add(Number(m[1]))));
  for(const coefficient of Object.values(algebra.parse(p.answer).terms))assert.notEqual(Math.abs(coefficient),1);
  const reordered=p.answer.match(/[+-]?\s*[^+-]+/g).reverse().map(t=>/^[+-]/.test(t.trim())?t.trim():'+'+t.trim()).join('');
  assert(algebra.check(reordered,p.answer).ok,'reordered '+p.answer);
  for(const x of [-3,0,2]){
   const vals=Object.fromEntries(Object.keys(values).map((v,i)=>[v,x+(i%3)]));
   const fromTerms=p.terms.reduce((sum,[c,t])=>sum+c*(t?evaluate(t,vals):1),0);
   assert(evaluate(math(p.q)[0],vals)===fromTerms);assert(evaluate(p.answer,vals)===fromTerms);identities++;
  }
 }else{
  assert.equal(p.variant,'like_terms');assert.equal(p.choices.length,4);
  for(const c of p.choices){assert.equal(math(c).length,2);assert(math(c).every(t=>!t.includes('and')));}
 }
}
assert.equal(seen.size,7);assert.equal(variables.size,12);assert.deepEqual([...degrees].sort(),[2,3,4]);
const distSeen=new Set();
for(let n=0;n<12000;n++){
 const p=gen.get('distributive-property')();generated++;distSeen.add(p.variant);
 assert(!p.choices.some(c=>/cannot be determined|not enough information|none of these|no solution|infinitely many/i.test(c)));
 if(p.variant==='equivalent'){
  const [l,r]=math(p.q);assert.equal(p.choices.length,2);
  const equal=[-2,0,3].every(x=>evaluate(l,Object.fromEntries(Object.keys(values).map(v=>[v,x])))===evaluate(r,Object.fromEntries(Object.keys(values).map(v=>[v,x]))));
  assert.equal(p.answer,equal?'Equivalent':'Not equivalent');
 }else{
  const target=math(p.q)[0];
  const used=[...new Set((target+p.choices.join('')).match(/[a-z]/g))];
  const assignments=[null,...used].map(active=>Object.fromEntries(Object.keys(values).map(v=>[v,v===active?2:0])));
  const valid=p.choices.map(c=>assignments.every(vals=>evaluate(math(c)[0],vals)===evaluate(target,vals)));
  assert.equal(valid.filter(Boolean).length,1,p.id+' ambiguous choices '+JSON.stringify(p.choices));assert(valid[p.correctIndex]);
 }
}
assert.equal(distSeen.size,9);
for(const [raw,want] of [['3y²x-2x','3xy^{2}-2x'],['-2x+3xy^2','3xy^{2}-2x'],['3*x*y^2-2*x','3xy^{2}-2x'],['0','0'],['x','x'],['-x','-x'],['5n^12','5n^{12}']])assert(algebra.check(raw,want).ok,raw);
for(const raw of ['','x^','2**x','2*','x/2','3.5x','x^(2)','x^0','x^-2','<script>','1e3','x+','x++y'])assert(algebra.parse(raw).error,raw);
for(const [raw,want] of [['2x+3x','5x'],['2xy+3yx','5xy'],['x*x','x^2'],['0+5x','5x']])assert(algebra.check(raw,want).unsimplified,raw);
// Minimal DOM, exercising the actual controller and keypad event handlers.
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.events={};this.style={};this.disabled=false;this.hidden=false;this.attributes={};this.value='';this.selectionStart=0;this.selectionEnd=0;this._html='';this.className='';this.classList={add:c=>{this.className+=' '+c;}};}
 set innerHTML(s){this._html=s;this.children=[];}get innerHTML(){return this._html;}
 appendChild(e){this.children.push(e);return e;}setAttribute(k,v){this.attributes[k]=v;}focus(){}setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}
 addEventListener(t,f){(this.events[t]??=[]).push(f);}click(){if(!this.disabled)this.events.click?.forEach(f=>f({}));}
 querySelectorAll(sel){return this.children.flatMap(c=>[...(sel==='button'&&c.tagName==='BUTTON'||sel==='.choice-btn'&&c.className==='choice-btn'?[c]:[]),...c.querySelectorAll(sel)]);}
}
const els=Object.fromEntries(['question','choices','feedback','score','attempted','nextBtn','resetBtn'].map(id=>[id,new Element()]));
function descend(e,id){if(e.id===id)return e;for(const c of e.children){const found=descend(c,id);if(found)return found;}}
const document={events:{},createElement:t=>new Element(t),getElementById:id=>els[id]||Object.values(els).map(e=>descend(e,id)).find(Boolean),querySelectorAll:s=>Object.values(els).flatMap(e=>e.querySelectorAll(s)),addEventListener(t,f){(this.events[t]??=[]).push(f);}};
let current,checks=0,generatedUI=0;
const UI={window:{BM_UNIT2_PRACTICE:{slug:'equivalent-expressions-combining-like-terms'},BatchMathIM1Unit2Generators:gen,BMAnalytics:{problemGenerated:p=>{current=p;generatedUI++;},answerChecked(){checks++;},solutionRevealed(){}}},document};vm.createContext(UI);
for(const f of ['im1-algebra-input.js','im1-unit2-practice.js'])vm.runInContext(read('assets/'+f),UI);
document.events.DOMContentLoaded.forEach(f=>f());
while(current.kind!=='polynomial')els.resetBtn.click();
const input=document.getElementById('algebra-answer'),submit=document.getElementById('algebra-check');
const keys=()=>els.choices.querySelectorAll('button');const press=label=>keys().find(b=>b.textContent===label).click();
const variable=current.variables[0];press('3');press(variable);press('xⁿ');press('2');press('→');press('+');press('4');
assert.equal(input.value,`3${variable}²+4`);press('Clear');assert.equal(input.value,'');
submit.click();assert.equal(checks,0);assert(!input.disabled);
input.value=current.answer;submit.click();assert.equal(checks,1);assert.equal(els.score.textContent,1);assert.equal(els.attempted.textContent,1);assert(!els.nextBtn.hidden);assert(input.disabled);assert(els.feedback.innerHTML.includes('<ol>'));
submit.click();assert.equal(checks,1);const before=generatedUI;document.events.keydown.forEach(f=>f({key:'Enter',preventDefault(){}}));assert.equal(generatedUI,before);
els.nextBtn.click();assert.equal(generatedUI,before+1);assert(els.nextBtn.hidden);
while(current.kind!=='polynomial')els.resetBtn.click();
document.getElementById('algebra-answer').value='123456';document.getElementById('algebra-check').click();assert(els.feedback.innerHTML.includes('Correct answer:'));assert(els.feedback.innerHTML.includes('<ol>'));
// The shared review generator must produce both new input and moved choice families.
const reviewSeen=new Set();for(let n=0;n<15000;n++){const p=gen.get('comprehensive-review')();if(p.kind==='polynomial')reviewSeen.add('typed');if(p.id.startsWith('u2-dist-equivalent'))reviewSeen.add('equivalent');if(p.id.startsWith('u2-dist-construct'))reviewSeen.add('construct');assert(!p.id.startsWith('u2-eq-same'));}
assert.equal(reviewSeen.size,3);
const report={ok:true,generated,identities,combiningFamilies:[...seen],distributingFamilies:[...distSeen],variables:[...variables],powers:[...degrees],controller:'PASS',browser:'not run'};
fs.writeFileSync(path.join(root,'qa-results/im1-like-terms-qa.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
