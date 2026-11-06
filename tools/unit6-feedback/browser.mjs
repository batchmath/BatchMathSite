import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {harness} from '../keypad-completeness/browser-harness.mjs';
import {load,ROOT,BASE} from './model.mjs';
import {disclosures} from './exposure.mjs';
const ref=process.env.FEEDBACK_REF||null,model=load(ref),h=await harness();
if(ref)for(const name of ['unit6-area.js','unit6-volume.js','unit6-frq.js'])h.transforms.set('assets/'+name,()=>execFileSync('git',['show',ref+':assets/'+name],{cwd:ROOT,encoding:'utf8',maxBuffer:8e6}));
const fixtures=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/unit6-feedback/fixtures.json'))).filter(f=>!process.env.FEEDBACK_CASES||process.env.FEEDBACK_CASES.split(',').includes(f.name));
const output=path.resolve(process.env.FEEDBACK_BROWSER_OUT||'docs/feedback-audit/evidence/browser-after.json');
const results=[],errors=[];let expectedDisclosures=0;
try{
 for(const fixture of fixtures)for(const wrapped of (fixture.config.slug?[false,true]:[true]))for(const width of [1366,390])for(const wrong of [false,true]){
  const {config,seed}=fixture,topic={area:'area',solids:config.family==='shells'?'shells':'washers',frq:'frq_graph'}[config.engine],mode=config.engine==='frq'?'frq_graph':'short';
  const prefix=wrapped?model.reviewPlan(config,topic,mode):[];
  const route='ap-calculus/unit-6-applications-integration/topics/'+(wrapped?'comprehensive-review/non-calculator-practice':config.slug+'/non-calculator-practice')+'/index.html';
  const page=await h.open(route,{width,height:width===390?844:900});page.on('pageerror',e=>errors.push({fixture:fixture.name,width,message:e.message}));
  const r={fixture:fixture.name,wrapped,width,wrong,route,source:ref||'current',parts:[],failures:[]};
  try{
   await page.waitForFunction(({api,wrapped})=>window.advancedQA&&window[api]&&(!wrapped||window.BatchMathUnit6Review)&&window.MathJax?.startup?.promise,{api:config.api,wrapped});await page.evaluate(()=>MathJax.startup.promise);
   const generated=await page.evaluate(({config,seed,prefix,wrapped,mode})=>{
    let s=seed>>>0;const queue=[...prefix];window.BatchMathRNG={random:()=>{if(queue.length)return queue.shift();s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;}};
    const p=wrapped?BatchMathUnit6Review.make({calc:config.calc,tier:config.tier,mode}):window[config.api][config.method]({family:config.family,calc:config.calc,tier:config.tier});
    window.__FEEDBACK_PROBLEM=p;advancedQA.load(p);
    return{id:p.id,parts:p.parts.map(q=>({prompt:q.prompt,control:q.control,answerTex:q.answerTex,correctIndex:q.correctIndex,choiceCount:q.choices?.length,answerKind:q.answer?.kind,value:q.answer?.value,rows:q.answer?.rows})),family:p.unit5Meta.family,review:p.unit6Review?.reviewTopic};
   },{config,seed,prefix,wrapped,mode});
   const p=wrapped?model.makeReview(config,seed,topic,mode):model.make(config,seed);assert.equal(generated.id,p.id);assert.equal(generated.family,config.family);if(wrapped)assert.equal(generated.review,topic);
   r.id=generated.id;
   for(let i=0;i<generated.parts.length;i++){
    const part=generated.parts[i],scope=`#choices .unit5-part-${i+1}`;
    assert.equal(await page.locator('#choices .unit5-part').count(),i+1,'Later parts must not render before they are reached');
    if(part.control==='choice')await page.locator(`${scope} .staged-choice`).nth(wrong?(part.correctIndex+1)%part.choiceCount:part.correctIndex).click();
    else{
     const field=page.locator(`${scope} math-field`);await field.waitFor();await page.waitForFunction(s=>document.querySelector(s+' math-field')?.getAttribute('aria-disabled')!=='true',scope);
     let latex=part.answerTex.replace(/^[A-Za-z](?:\([a-z]\))?\s*=\s*/,'');
     if(wrong){
      if(part.control==='u6-integral')latex=part.rows.map((r,j)=>`${r.coef||''}\\int_{${r.lower}}^{${r.upper}}\\left(${r.integrand}${j===0?'+1':''}\\right)\\,d${r.v}`).join('+');
      else if(part.control==='u6-expr')latex=i===0&&generated.parts[1]?.control==='u6-expr'?generated.parts[1].answerTex.replace(/^[A-Za-z]\([a-z]\)=/,''):`(${latex})+987`;
      else latex=part.answerKind==='numeric'?(part.value+987).toFixed(3):'987654321';
     }
     await field.evaluate((e,value)=>{e.focus();e.executeCommand('selectAll');e.executeCommand(['insert',value]);e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true}));},latex);
     await page.locator(`${scope} .staged-check`).click();
    }
    const feedback=page.locator(`${scope} .staged-feedback`);await feedback.waitFor();await page.evaluate(()=>MathJax.typesetPromise());
    const observed=await feedback.evaluate(el=>({text:el.innerText,note:el.querySelector('.answer-format-note')?.innerText||'',correct:!!el.querySelector('.result.good'),math:[...MathJax.startup.document.getMathItemsWithin(el)].map(m=>m.math)}));
    assert.equal(observed.correct,!wrong,'Original correct/wrong grading');
    const probe={...p,parts:p.parts.map((q,j)=>j===i?{...q,explanation:observed.text+' '+observed.math.map(t=>'\\('+t+'\\)').join(' '),answer:{...q.answer,notes:observed.note?[{note:observed.note}]:[]}}:q)};
    const found=disclosures(probe,model.C).leaks.filter(x=>x.earlier===i);r.parts.push({index:i,control:part.control,prompt:part.prompt,correct:observed.correct,renderedText:observed.text,renderedMath:observed.math,futureDisclosures:found});
    if(!ref)assert.deepEqual(found,[],'Rendered feedback discloses a future answer');
    if(i<generated.parts.length-1)await page.locator(`${scope} .staged-continue`).click();
   }
   if(ref){const count=r.parts.reduce((s,p)=>s+p.futureDisclosures.length,0);assert.ok(count>0,'Original E browser must reproduce the reported disclosure');expectedDisclosures+=count;}
   const layout=await page.evaluate(()=>({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),mathErrors:document.querySelectorAll('mjx-merror').length,fields:document.querySelectorAll('math-field').length,locked:[...document.querySelectorAll('math-field')].every(f=>f.readOnly||f.getAttribute('aria-disabled')==='true')}));
   assert.equal(layout.overflow,0);assert.equal(layout.mathErrors,0);assert.ok(layout.locked);r.layout=layout;r.passed=true;
  }catch(e){r.passed=false;r.failures.push(e.stack);}
  finally{results.push(r);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({results,errors,expectedOriginalDisclosures:expectedDisclosures},null,2)+'\n');await page.close();}
  console.log(fixture.name,wrapped?'review':'topic',width,wrong?'wrong':'correct',r.passed?'PASS':'FAIL');
 }
}finally{await h.close();}
assert.equal(errors.length,0);assert.ok(results.every(r=>r.passed),JSON.stringify(results.filter(r=>!r.passed).map(r=>({fixture:r.fixture,failures:r.failures}))));
