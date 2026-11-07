import {readyVisibleEditor,fillVisibleAnswer} from './answered-enter-browser-qa.mjs';
// Real browser follow-up for U/V. Called by seeded-browser-qa on GitHub.
export async function exerciseUnit1Approved(context,base,{legacy=false}={}){
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let checks=0;
 const root=base+'/ap-calculus/unit-1-limits-continuity/topics/';
 await page.addInitScript(()=>{let current;Object.defineProperty(window,'BMAnalytics',{configurable:true,get(){return current;},set(api){current=api;const original=api.problemGenerated;api.problemGenerated=function(p,...args){window.__unit1QA=p;return original.call(this,p,...args);};}});});
 async function open(topic,suffix='practice'){await page.goto(root+topic+'/'+suffix+'/?bm_seed=173&bm_qa=1'+(legacy?'&editor=legacy':''),{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.BatchMathRepro?.problemCount>=1&&window.__unit1QA);}

 async function enterOnce(){const before=await page.evaluate(()=>window.BatchMathRepro.problemCount);await page.keyboard.press('Enter');await page.waitForTimeout(300);if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==before+1)throw Error('Unit 1 Enter failed to advance exactly once');checks++;}
 try{

  await open('squeeze-theorem-trigonometric-limits','course-practice');
  await readyVisibleEditor(page);
  const pad=page.locator(legacy?'.u1-keypad:visible':'[data-experimental-bridge]:visible').first();
  if(legacy){for(const label of ['1','a/b','2'])await pad.getByRole('button',{name:label,exact:true}).click();}
  else{
   const rendered=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await pad.getByRole('button',{name:'Insert stacked fraction',exact:true}).click();await rendered();
   await pad.getByRole('button',{name:'1',exact:true}).click();await rendered();await page.keyboard.press('ArrowDown');await rendered();
   await pad.getByRole('button',{name:'2',exact:true}).click();await rendered();await page.keyboard.press('ArrowRight');
  }
  const fractionSource=await page.locator('#numeric-answer').inputValue();
  if(fractionSource.replace(/[()\s]/g,'')!=='1/2')throw Error('Regular trig keypad fraction failed');
  (page._answerEvidence??=[]).push({editor:legacy?'legacy':'mathlive',source:fractionSource,operation:'visible-keypad fraction 1/2'});
  for(const raw of ['', 'undefined','1/0']){await fillVisibleAnswer(page,page.locator('#numeric-answer'),raw);await page.getByRole('button',{name:'Check Answer',exact:true}).click();if(await page.locator('#attempted-count').textContent()!=='0')throw Error('Regular trig invalid input counted');}
  const answer=await page.evaluate(()=>window.__unit1QA.ans.n+'/'+window.__unit1QA.ans.d);await fillVisibleAnswer(page,page.locator('#numeric-answer'),answer);await page.getByRole('button',{name:'Check Answer',exact:true}).click();await page.locator('.u1-method').waitFor({state:'visible'});await enterOnce();
  for(const topic of ['one-sided-limits','limits-at-infinity']){
   await open(topic);const answer=await page.evaluate(()=>{const a=window.__unit1QA.ans;return a.kind==='rat'?a.n+'/'+a.d:a.kind==='dne'?'DNE':a.sign<0?'-infinity':'infinity';});await fillVisibleAnswer(page,page.locator('#answer'),answer);await page.locator('#submit').click();
   const method=page.locator('.u1-method');await method.waitFor({state:'visible'});const style=await method.evaluate(b=>({border:getComputedStyle(b).borderTopColor,color:getComputedStyle(b).color}));if(style.border!=='rgb(215, 25, 32)'||style.color!=='rgb(255, 212, 0)')throw Error('Method button theme missing on '+topic);await method.click();await enterOnce();
  }
  await open('introduction-to-limits');
  for(const mode of ['tables','graphs']){await page.selectOption('#representation-mode',mode);const idx=await page.evaluate(()=>window.__unit1QA.correctIndex);await page.locator('#choices > .choice').nth(idx).click();if(!await page.locator('.u1-method').isVisible())throw Error('Correct representation answer missing Show Method');await page.locator('.u1-method').click();if(!(await page.locator('#feedback .method').last().textContent()).trim())throw Error('Method empty');await enterOnce();}
  await open('comprehensive-review');
  for(const category of ['tables','graphs','parameters','ivt']){
   await page.selectOption('#category',category);
   if(await page.locator('.bm-calc-editor').isVisible())throw Error('Numeric editor visible in '+category);
   if(category==='parameters'){
    const values=await page.evaluate(()=>window.__unit1QA.fields.map(f=>String(f.numericAnswer)));
    const inputs=page.locator('#u1-options .parameter-field input');
    if(await inputs.count()!==values.length)throw Error('Continuity Parameters field count mismatch');
    for(let i=0;i<values.length;i++)await fillVisibleAnswer(page,inputs.nth(i),values[i],page.locator('#u1-options .parameter-field').nth(i));
    await page.getByRole('button',{name:'Check All Parameters',exact:true}).click();
   }else{
    const idx=await page.evaluate(()=>window.__unit1QA.correctIndex);
    if(!Number.isInteger(idx))throw Error(category+' did not provide a multiple-choice correctIndex');
    await page.locator('#u1-options > .choice').nth(idx).click();
   }
   await page.locator('#feedback .u1-method').waitFor({state:'visible'});await enterOnce();
  }
  await page.selectOption('#category','continuous');
  for(const raw of ['undefined','1/0']){const before=await page.locator('#attempted').textContent();await readyVisibleEditor(page);if(legacy){await page.locator('.bm-calc-editor:visible').click();await page.keyboard.type(raw);}else await fillVisibleAnswer(page,page.locator('#answer'),raw);await page.locator('#submit').click();if(await page.locator('#attempted').textContent()!==before)throw Error('Invalid input counted');await page.selectOption('#category','continuous');checks++;}
  await page.selectOption('#category','discontinuities');const points=await page.evaluate(()=>window.__unit1QA.points);
  for(let i=0;i<points.length;i++){
   if(i){await fillVisibleAnswer(page,page.locator('#u1-options input'),String(points[0].x),page.locator('#u1-options'));await page.getByRole('button',{name:'Check Location',exact:true}).click();if(!(await page.locator('#u1-options').textContent()).includes('already'))throw Error('Repeated location was not recognized');checks++;}
   await fillVisibleAnswer(page,page.locator('#u1-options input'),String(points[i].x),page.locator('#u1-options'));await page.getByRole('button',{name:'Check Location',exact:true}).click();await page.getByRole('button',{name:points[i].type[0].toUpperCase()+points[i].type.slice(1),exact:true}).click();await page.getByRole('button',{name:i<points.length-1?'Input Another Discontinuity':'No More Discontinuities',exact:true}).click();
  }
  await page.locator('#next').waitFor({state:'visible'});await enterOnce();if(errors.length)throw Error(errors.join('; '));return checks;
 }finally{await page.close();}
}
