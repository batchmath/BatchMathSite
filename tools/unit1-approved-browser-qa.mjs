// Real browser follow-up for U/V. Called by seeded-browser-qa on GitHub.
export async function exerciseUnit1Approved(context,base){
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let checks=0;
 const root=base+'/ap-calculus/unit-1-limits-continuity/topics/';
 async function open(topic,suffix='practice'){await page.goto(root+topic+'/'+suffix+'/?bm_seed=173&bm_qa=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.BatchMathRepro?.problemCount>=1);await page.evaluate(()=>{const original=window.BMAnalytics.problemGenerated;window.BMAnalytics.problemGenerated=function(p,...args){window.__unit1QA=p;return original.call(this,p,...args)};document.querySelector('#next, #new').click();});}
 async function enterOnce(){const before=await page.evaluate(()=>window.BatchMathRepro.problemCount);await page.keyboard.press('Enter');await page.waitForTimeout(300);if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==before+1)throw Error('Unit 1 Enter failed to advance exactly once');checks++;}
 try{

  await open('squeeze-theorem-trigonometric-limits','course-practice');
  for(const label of ['1','a/b','2'])await page.locator('.u1-keypad').getByRole('button',{name:label,exact:true}).click();
  if(await page.locator('#numeric-answer').inputValue()!=='1/2')throw Error('Regular trig keypad fraction failed');
  for(const raw of ['', 'undefined','1/0']){await page.locator('#numeric-answer').fill(raw);await page.getByRole('button',{name:'Check Answer',exact:true}).click();if(await page.locator('#attempted-count').textContent()!=='0')throw Error('Regular trig invalid input counted');}
  const answer=await page.evaluate(()=>window.__unit1QA.ans.n+'/'+window.__unit1QA.ans.d);await page.locator('#numeric-answer').fill(answer);await page.getByRole('button',{name:'Check Answer',exact:true}).click();await page.locator('.u1-method').waitFor({state:'visible'});await enterOnce();
  for(const topic of ['one-sided-limits','limits-at-infinity']){
   await open(topic);await page.evaluate(()=>{const a=window.__unit1QA.ans;document.getElementById('answer').value=a.kind==='rat'?a.n+'/'+a.d:a.kind==='dne'?'DNE':a.sign<0?'-infinity':'infinity';window.BatchMathCalculusKeypad?.reset();});await page.locator('#submit').click();
   const method=page.locator('.u1-method');await method.waitFor({state:'visible'});const style=await method.evaluate(b=>({border:getComputedStyle(b).borderTopColor,color:getComputedStyle(b).color}));if(style.border!=='rgb(215, 25, 32)'||style.color!=='rgb(255, 212, 0)')throw Error('Method button theme missing on '+topic);await method.click();await enterOnce();
  }
  await open('introduction-to-limits');
  for(const mode of ['tables','graphs']){await page.selectOption('#representation-mode',mode);const idx=await page.evaluate(()=>window.__unit1QA.correctIndex);await page.locator('#choices > .choice').nth(idx).click();if(!await page.locator('.u1-method').isVisible())throw Error('Correct representation answer missing Show Method');await page.locator('.u1-method').click();if(!(await page.locator('#feedback .method').last().textContent()).trim())throw Error('Method empty');await enterOnce();}
  await open('comprehensive-review');
  for(const category of ['tables','graphs','parameters','ivt']){await page.selectOption('#category',category);if(await page.locator('.bm-calc-editor').isVisible())throw Error('Numeric editor visible in '+category);const idx=await page.evaluate(()=>window.__unit1QA.correctIndex);await page.locator('#u1-options > .choice').nth(idx).click();await page.locator('#feedback .u1-method').waitFor({state:'visible'});await enterOnce();}
  await page.selectOption('#category','continuous');
  for(const raw of ['undefined','1/0']){const before=await page.locator('#attempted').textContent();await page.locator('.bm-calc-editor').click();await page.keyboard.type(raw);await page.locator('#submit').click();if(await page.locator('#attempted').textContent()!==before)throw Error('Invalid input counted');await page.selectOption('#category','continuous');checks++;}
  await page.selectOption('#category','discontinuities');const points=await page.evaluate(()=>window.__unit1QA.points);
  for(let i=0;i<points.length;i++){
   if(i){await page.locator('#u1-options input').fill(String(points[0].x));await page.getByRole('button',{name:'Check Location',exact:true}).click();if(!(await page.locator('#u1-options').textContent()).includes('already'))throw Error('Repeated location was not recognized');checks++;}
   await page.locator('#u1-options input').fill(String(points[i].x));await page.getByRole('button',{name:'Check Location',exact:true}).click();await page.getByRole('button',{name:points[i].type[0].toUpperCase()+points[i].type.slice(1),exact:true}).click();await page.getByRole('button',{name:i<points.length-1?'Input Another Discontinuity':'No More Discontinuities',exact:true}).click();
  }
  await page.locator('#next').waitFor({state:'visible'});await enterOnce();if(errors.length)throw Error(errors.join('; '));return checks;
 }finally{await page.close();}
}
