#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
let seed=973510;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const box={window:{BatchMathRNG:{random}}};vm.createContext(box);
for(const f of ['im1-unit2-generators.js','im1-equation-input.js'])vm.runInContext(read('assets/'+f),box);
const gen=box.window.BatchMathIM1Unit2Generators,entry=box.window.BatchMathIM1Equation;
// Independent evaluator for generated TeX, with grouped fraction numerators.
function evaluate(s,x){
 s=s.replace(/\s/g,'');const t=s.match(/\\frac|\d+|[a-z]|[-+*/(){}]/g)||[];assert.equal(t.join(''),s,'unsupported TeX '+s);let i=0;
 function atom(){const a=t[i++];if(a==='-'||a==='+')return (a==='-'?-1:1)*atom();if(a==='('||a==='{'){const n=sum();assert.equal(t[i++],a==='('?')':'}');return n;}if(a==='\\frac')return atom()/atom();if(a==='x')return x;assert(/^\d+$/.test(a),'token '+a);return Number(a);}
 function product(){let n=atom();while(i<t.length&&!['+','-',')','}'].includes(t[i])){if(t[i]==='*')i++;if(t[i]==='/'){i++;n/=atom();}else n*=atom();}return n;}
 function sum(){let n=product();while(t[i]==='+'||t[i]==='-'){const op=t[i++],v=product();n=op==='+'?n+v:n-v;}return n;}
 const n=sum();assert.equal(i,t.length);return n;
}
const math=s=>[...s.matchAll(/\\\(([\s\S]*?)\\\)/g)].map(m=>m[1]);
const noArtifacts=s=>{assert(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(s),'control character');assert(!/(?:^|[^\d])1x|\+\s*0(?=\D|$)|\+\s*-|\bNaN\b|undefined/.test(s),'display: '+s);};
let equations=0,identities=0,none=0,all=0;const families=new Set();
for(let i=0;i<30000;i++){
 const p=gen.get('solving-linear-equations')();equations++;families.add(p.variant);assert.equal(p.kind,'equation');assert(!p.choices);assert(p.hint.length>20);assert(entry.check(p.answer,p.answer).ok);
 noArtifacts(p.q+p.explain);if(p.variant.startsWith('fraction_')){const rhs=math(p.q)[0].split('=')[1];assert(!rhs.includes('frac'));if(p.variant==='fraction_x')assert(/^[-]?[2-9]x$/.test(rhs));if(p.variant==='fraction_linear')assert(/[+-]\s*\d+$/.test(rhs));}const [l,r]=math(p.q)[0].split('=');const {A,B,C,D,scale,solution}=p.math;
 if(p.answer==='No solution')none++;else if(p.answer==='Infinitely many solutions')all++;
 for(const x of [solution??-3,(solution??0)+1,0,7]){
  const residual=evaluate(l,x)-evaluate(r,x),want=((A-C)*x+B-D)/scale;
  assert(Math.abs(residual-want)<1e-8,p.id+' original mismatch');identities++;
  for(const line of math(p.explain).filter(m=>m.includes('='))){
   const [a,b]=line.split('='),isTrue=Math.abs(evaluate(a,x)-evaluate(b,x))<1e-8;
   assert.equal(isTrue,Math.abs(want)<1e-8,p.id+' invalid solution step '+line);identities++;
  }
 }
 if(solution!==null){assert((D-B)/(A-C)===solution);assert(entry.check('x='+solution,p.answer).ok);assert(entry.check(`${solution*2}/2`,p.answer).ok);assert(!entry.check(String(solution+1),p.answer).ok);}
}
assert.equal(families.size,10);assert(Math.abs((none+all)/equations-.22)<.012);assert(Math.abs(none/equations-.11)<.01);assert(Math.abs(all/equations-.11)<.01);
for(const s of ['','1/0','2.5','x=','infinity','NaN','2+3','<img>'])assert(entry.parse(s).error,s);
for(const [s,w] of [['Infinite Solutions','Infinitely many solutions'],['no solution','No solution'],['-6/2','-3'],['x=-3','-3']])assert(entry.check(s,w).ok,s);
let three=0,twoPart=0,moved=0;
for(let i=0;i<10000;i++){
 const d=gen.get('distributive-property')();noArtifacts(d.q+d.choices.join('')+d.explain);assert(!d.choices.some(c=>/cannot be determined|no solution|none of these/i.test(c)));if(d.variant==='three_groups'){three++;assert.equal((math(d.q)[0].match(/\(/g)||[]).length,3);}
 const p=gen.get('solving-linear-inequalities')();assert.notEqual(p.variant,'interval_result');noArtifacts(p.q+p.explain);assert.equal(p.choices.length,4);assert.equal(new Set(p.choices).size,4);assert(math(p.choices.join(' ')).every(m=>!m.includes(' or ')));if(p.part2)assert.equal(p.part2.choices.length,4);assert(!p.choices.some(c=>/cannot be determined|no solution|none of these/i.test(c)));
 if(p.part2){twoPart++;assert.equal(p.variant,'creation');const raw=math(p.part2.q)[0],m=raw.match(/^(.*?)\s*([<>≤≥])\s*(.*)$/);assert(m);const answer=math(p.part2.answer)[0],sol=answer.match(/^x\s*([<>≤≥])\s*(-?\d+)$/);assert(sol);
 const cmp=(a,op,b)=>op==='<'?a<b:op==='>'?a>b:op==='≤'?a<=b:a>=b;
 for(const x of [Number(sol[2])-1,Number(sol[2]),Number(sol[2])+1])assert.equal(cmp(evaluate(m[1],x),m[2],evaluate(m[3],x)),cmp(x,sol[1],Number(sol[2])));
 }
 const interval=gen.get('graphing-inequalities-interval-notation')();if(interval.variant==='interval_result')moved++;
}
assert(three>500);assert(twoPart>1000);assert(moved>1000);
// Actual shared controller + equation keypad in a minimal DOM.
class Element{constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.events={};this.style={};this.disabled=false;this.hidden=false;this.attributes={};this.value='';this.selectionStart=0;this.selectionEnd=0;this._html='';this.className='';this.classList={add:c=>{this.className+=' '+c;}};}set innerHTML(s){this._html=s;this.children=[];}get innerHTML(){return this._html;}appendChild(e){this.children.push(e);return e;}setAttribute(k,v){this.attributes[k]=v;}focus(){}setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}addEventListener(t,f){(this.events[t]??=[]).push(f);}click(){if(!this.disabled)this.events.click?.forEach(f=>f({}));}querySelectorAll(sel){return this.children.flatMap(c=>[...(sel==='button'&&c.tagName==='BUTTON'||sel==='.choice-btn'&&c.className==='choice-btn'?[c]:[]),...c.querySelectorAll(sel)]);}}
function UI(slug){
 const els=Object.fromEntries(['question','choices','feedback','score','attempted','nextBtn','resetBtn'].map(id=>[id,new Element()]));
 function descend(e,id){if(e.id===id)return e;for(const c of e.children){const found=descend(c,id);if(found)return found;}}
 const doc={events:{},createElement:t=>new Element(t),getElementById:id=>els[id]||Object.values(els).map(e=>descend(e,id)).find(Boolean),querySelectorAll:s=>Object.values(els).flatMap(e=>e.querySelectorAll(s)),addEventListener(t,f){(this.events[t]??=[]).push(f);}};
 const log={generated:0,checked:0};let current;
 const b={window:{BM_UNIT2_PRACTICE:{slug},BatchMathIM1Unit2Generators:gen,BMAnalytics:{problemGenerated:p=>{current=p;log.generated++;},answerChecked(){log.checked++;},solutionRevealed(){}}},document:doc,navigator:{maxTouchPoints:0}};doc.readyState='loading';vm.createContext(b);
 for(const f of ['im1-keypad.js','im1-equation-input.js','im1-unit2-practice.js'])vm.runInContext(read('assets/'+f),b);doc.events.DOMContentLoaded.forEach(f=>f());
 return {els,doc,log,get current(){return current;}};
}
const ui=UI('solving-linear-equations'),get=id=>ui.doc.getElementById(id);
let input=get('equation-answer');input.value='5';const q=ui.els.question.innerHTML;get('equation-hint').click();assert(!get('equation-hint-panel').hidden);assert.equal(input.value,'5');assert.equal(ui.log.checked,0);assert.equal(ui.els.question.innerHTML,q);get('equation-hint').click();assert(get('equation-hint-panel').hidden);
const press=label=>ui.els.choices.querySelectorAll('button').find(b=>b.textContent===label).click();press('Clear');input.setSelectionRange(0,0);press('−');press('3');press('a/b');press('2');assert.equal(input.value,'-3/2');const seven=ui.els.choices.querySelectorAll('button').find(b=>b.textContent==='7');assert.equal(seven.style.gridRow,'1');assert.equal(seven.style.gridColumn,'1');const four=ui.els.choices.querySelectorAll('button').find(b=>b.textContent==='4');assert.equal(four.style.gridRow,'2');press('No Solution');assert.equal(input.value,'No Solution');press('Infinite Solutions');assert.equal(input.value,'Infinite Solutions');
input.value='1/0';get('equation-check').click();assert.equal(ui.log.checked,0);assert(!input.disabled);
input.value=ui.current.answer;get('equation-check').click();assert.equal(ui.log.checked,1);assert(input.disabled);assert.equal(ui.els.score.textContent,1);assert(ui.els.feedback.innerHTML.includes('<ol>'));get('equation-check').click();assert.equal(ui.log.checked,1);
ui.els.nextBtn.click();assert.equal(ui.log.generated,2);assert(get('equation-hint-panel').hidden);assert.equal(get('equation-answer').value,'');get('equation-answer').value='123456';get('equation-check').click();assert(ui.els.feedback.innerHTML.includes('Correct answer:'));assert(ui.els.feedback.innerHTML.includes('<ol>'));
for(const wrong of [false,true]){
 const u=UI('solving-linear-inequalities');while(!u.current.part2)u.els.resetBtn.click();const first=u.current;const index=wrong?(first.correctIndex+1)%first.choices.length:first.correctIndex;
 u.els.choices.children[index].click();assert(u.els.nextBtn.hidden);assert(u.doc.getElementById('continuePartBtn'));const count=u.log.generated;u.els.nextBtn.click();assert.equal(u.log.generated,count);u.doc.getElementById('continuePartBtn').click();assert(u.els.question.innerHTML.includes('Part 2'));assert(u.els.nextBtn.hidden);assert.equal(u.log.generated,count);
 u.els.choices.children[first.part2.correctIndex].click();assert(!u.els.nextBtn.hidden);assert.equal(u.log.checked,2);u.els.nextBtn.click();assert.equal(u.log.generated,count+1);
}
const report={ok:true,equations,identities,families:[...families],noSolution:none,infiniteSolutions:all,combinedSpecialShare:(none+all)/equations,threeParentheses:three,twoPart,movedIntervals:moved,controller:'PASS',browser:'not run'};
fs.writeFileSync(path.join(root,'qa-results/im1-equations-update-qa.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
