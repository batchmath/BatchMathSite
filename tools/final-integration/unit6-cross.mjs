// Shared-keypad integration and teacher-case regressions on the real Unit 6 form.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {harness,root} from '../keypad-completeness/browser-harness.mjs';
import {enterAnswer} from '../keypad-completeness/enter-answer.mjs';
import {parseInput} from '../../assets/mathlive/answer-adapter.mjs';

const seeds=JSON.parse(fs.readFileSync(new URL('./teacher-seeds.json',import.meta.url)));
assert.ok(seeds.semi&&seeds.split,'Both original teacher cases must have recorded generator seeds');
const h=await harness(),results=[],errors=[];
const route='ap-calculus/unit-6-applications-integration/topics/volume-by-cross-sections/non-calculator-practice/index.html';
const target=root+'docs/final-integration/evidence/unit6/cross-integration.json';
const tree=raw=>{const p=parseInput(raw,'latex');assert.equal(p.status,'complete',raw);return p.tree;};
function setup(rows,change='correct') {
  return {type:'integral-setup',rows:rows.map((r,i)=>{
    let coef=r.coef||'1',f=r.integrand,a=r.lower,b=r.upper,v=r.v;
    if(i===0) {
      if(change==='same-value-integrand')f=`(${f})+${v}-\\frac{(${a})+(${b})}{2}`;
      if(change==='wrong-limit')b=`(${b})+1`;
      if(change==='missing-pi')coef=coef.replace(/\\pi/g,'1');
      if(change==='old-radius-semicircle')coef=`4*(${coef})`;
    }
    return {coefficient:coef==='1'?null:tree(coef),lower:tree(a),upper:tree(b),integrand:tree(f),variable:v};
  })};
}
const load=(page,seed)=>page.evaluate(seed=>{
  let s=seed;window.BatchMathRNG={random:()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}};
  const q=BatchMathUnit6Volume.makeCS({family:'cs_setup',tier:'intermediate',calc:'non-calculator'});
  advancedQA.load(q);
  return {id:q.id,question:q.questionHtml,parts:q.parts.map(p=>({rows:p.answer.rows,answerTex:p.answerTex,prompt:p.prompt}))};
},seed);

try {
  for(const width of [1366,390])for(const [name,witness] of Object.entries(seeds)) {
    const page=await h.open(route,{width,height:width===390?844:900});
    page.on('pageerror',e=>errors.push({name,width,message:e.message}));
    try {
      await page.waitForFunction(()=>window.advancedQA&&window.BatchMathUnit6Volume);
      let q=await load(page,witness.seed);assert.equal(q.id,witness.id);
      const field=page.locator('#choices .unit5-part-1 math-field');await field.waitFor();
      assert.equal(await field.count(),1);
      assert.equal((await field.evaluate(m=>m.value)).replace(/\\placeholder\{\}/g,'').trim(),'');
      assert.equal(await page.locator('.u6-int-row,.u6-add,.u6-intsign').count(),0);
      for(const aria of ['Insert definite integral','Insert dx','Insert dy'])assert.equal(await page.locator('#choices [data-experimental-bridge] button[aria-label="'+aria+'"]').count(),1);
      const variants=name==='semi'?['correct','same-value-integrand','wrong-limit','missing-pi','old-radius-semicircle']:['correct','same-value-integrand','wrong-limit'];
      for(const variant of variants) {
        const r={case:name,width,variant,seed:witness.seed,questionId:q.id};
        try {
          q=await load(page,witness.seed);
          r.entry=await enterAnswer(page,field,name+' '+variant,{tree:setup(q.parts[0].rows,variant)});
          assert.ok(r.entry.used.some(b=>b.aria==='Insert definite integral'));
          assert.ok(r.entry.latex&&r.entry.serializedSource);
          if(name==='split')assert.equal(r.entry.used.filter(b=>b.aria==='Insert definite integral').length,2);
          if(variant==='correct') {
            const before=await field.evaluate(m=>m.value);
            await page.keyboard.press('Control+z');
            const undone=await field.evaluate(m=>m.value);assert.notEqual(undone,before,'Undo acts on the active field');
            await page.keyboard.press('Control+Shift+z');assert.equal(await field.evaluate(m=>m.value),before,'Redo restores the setup');
            r.undoRedo=true;
          }
          await page.locator('#choices .unit5-part-1 .staged-check').click();
          await page.evaluate(async()=>{await MathJax.typesetPromise();await document.fonts.ready;});
          const feedback=await page.locator('#choices .unit5-part-1 .staged-feedback').innerText();
          const accepted=!!(await page.locator('#choices .unit5-part-1 .result.good').count());
          r.accepted=accepted;r.feedback=feedback;
          assert.equal(accepted,variant==='correct',feedback);
          if(variant!=='correct')assert.match(feedback,/not correct|incorrect/i);
          if(variant==='correct'&&name==='semi') {
            assert.match(feedback,/diameter/);assert.match(feedback,/radius/);
            assert.equal(await page.locator('svg[aria-label="One cross section: a semicircle with diameter s (radius s/2)"]').count(),1);
          }
          if(variant==='correct'&&name==='split') {
            assert.match(feedback.normalize('NFKC'),/Split the integral at x\s*=\s*8/);
            assert.match(feedback,/lower boundary/);assert.match(feedback,/one integrand cannot/);
          }
          r.layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,mathErrors:document.querySelectorAll('mjx-merror').length,raw:/\\\(|\\\)|\\frac|\\int_/.test(document.querySelector('.practice-shell').innerText)}));
          assert.ok(r.layout.overflow<=1);assert.equal(r.layout.mathErrors,0);assert.equal(r.layout.raw,false);
          r.passed=true;
        } catch(e) {r.passed=false;r.error=e.stack;console.log('FAIL',name,width,variant,e.message);}
        results.push(r);fs.writeFileSync(target,JSON.stringify({results,errors},null,2)+'\n');
      }
    } finally {await page.close();}
  }
} finally {await h.close();fs.writeFileSync(target,JSON.stringify({results,errors},null,2)+'\n');}
assert.equal(results.length,16);assert.ok(results.every(r=>r.passed));assert.equal(errors.length,0);
console.log('16/16 Unit 6 teacher-case and shared-keypad integration checks passed');
