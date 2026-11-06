// Fit the longest new radius/height feedback in the actual Unit 6 feedback CSS.
// This is a layout test; actual correct/wrong grading is covered by browser.mjs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {load,maths} from './model.mjs';
import {harness} from '../keypad-completeness/browser-harness.mjs';
const model=load(),selected=new Map();
for(const c of model.configurations.filter(c=>c.engine==='solids'&&['washer','shells'].includes(c.family)))for(let i=1;i<=100;i++){
 const p=model.make(c,i*977);
 for(const q of p.parts.filter(q=>q.control==='u6-expr')){
  const key=[c.family,q.prefix,p.unit5Meta.axis[0],/=-/.test(p.unit5Meta.axis)?'negative':'nonnegative'].join('/');
  const score=Math.max(...maths(q.explanation).map(t=>t.length));
  if(!selected.has(key)||selected.get(key).score<score)selected.set(key,{config:c,seed:i*977,id:p.id,prompt:q.prompt,html:q.explanation,score});
 }
}
const h=await harness(),results=[];
try{
 for(const width of [320,360,375,390,1366]){
  const page=await h.open('ap-calculus/unit-6-applications-integration/topics/solids-of-revolution/non-calculator-practice/index.html',{width,height:900});
  await page.waitForFunction(()=>window.MathJax?.startup?.promise);await page.evaluate(()=>MathJax.startup.promise);
  const result=await page.evaluate(async cases=>{
   const box=document.getElementById('choices');box.innerHTML=cases.map((q,i)=>`<section class="staged-part unit5-part"><h3>Case ${i+1}</h3><div class="staged-feedback feedback shown"><div class="method">${q.html}</div></div></section>`).join('');
   await MathJax.typesetPromise([box]);
   const issues=[];
   for(const [index,panel] of [...box.querySelectorAll('.staged-part')].entries())for(const el of panel.querySelectorAll('.u4-work-equation,mjx-container')){
    if(el.closest('mjx-assistive-mml'))continue;
    const r=el.getBoundingClientRect(),parent=el.parentElement.getBoundingClientRect();
    if(el.scrollWidth-el.clientWidth>2||r.left<parent.left-2||r.right>parent.right+2)issues.push({index,tag:el.tagName,cls:el.className,width:r.width,parentWidth:parent.width,scroll:el.scrollWidth-el.clientWidth});
   }
   return{issues,mathErrors:box.querySelectorAll('mjx-merror').length,documentOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)};
  },[...selected.values()]);
  results.push({width,cases:selected.size,...result});await page.close();
 }
}finally{await h.close();}
const report={selectedCases:[...selected.values()].map(({html,...q})=>q),results};
fs.writeFileSync('docs/feedback-audit/evidence/radius-height-layout.json',JSON.stringify(report,null,2)+'\n');
assert.ok(results.every(r=>!r.issues.length&&!r.mathErrors&&!r.documentOverflow),JSON.stringify(results));
console.log('PASS',selected.size,'long-form feedback cases at five widths');
