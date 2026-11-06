import fs from 'node:fs';
import assert from 'node:assert/strict';
import {harness,root,padSelector} from './browser-harness.mjs';

// A serialization probe, separate from complete-answer keypad pass counts.
// Only visible page buttons change the answer. The original expression parser
// checks the mirror; complete generated-answer grading is covered elsewhere.
const h=await harness(),results=[];
try{
 for(const topic of ['derivatives-with-the-power-rule','the-chain-rule']){
  const route=`ap-calculus/unit-2-derivatives/topics/${topic}/practice/index.html`;
  h.transforms.set(route,s=>s.replace('function boot(){makeProblem()}','window.__LEGACY_EQUIVALENT=equivalent;function boot(){makeProblem()}'));
  const page=await h.open(route,{legacy:true});
  await page.locator('.bm-calc-editor:visible').waitFor();
  const pad=page.locator(padSelector).first();
  for(const index of [3,4,5,12]){
   const used=[];
   async function press(label){
    const button=label==='→'?pad.locator('[aria-label="Move cursor right"]'):pad.locator('button').filter({hasText:new RegExp('^'+label+'$')});
    assert.equal(await button.count(),1);used.push(label);await button.click();
   }
   await press('Clear');await press('ⁿ√');for(const digit of String(index))await press(digit);
   const incomplete=await page.locator('#answer').inputValue();
   assert.match(incomplete,/root\(/,'Incomplete root must remain an incomplete expression');
   await press('→');await press('x');await press('→');
   const source=await page.locator('#answer').inputValue();
   assert.equal(source,`((x)^(1/(${index})))`);
   const visible=await page.locator('.bm-calc-editor:visible').getAttribute('aria-valuetext');
   assert.equal(visible,`root(${index},x)`,'Visible editor retains editable root slots');
   const equivalent=await page.evaluate(({source,index})=>__LEGACY_EQUIVALENT(source,`x^(1/${index})`,['x']),{source,index});
   assert.equal(equivalent,true);
   results.push({route,profile:await pad.getAttribute('data-audit-profile'),index,used,incomplete,source,visible,equivalent,passed:true});
  }
  await page.close();
 }
}finally{
 await h.close();
 fs.writeFileSync(root+'docs/audits/evidence/keypad-legacy-root-serialization.json',JSON.stringify({results,note:'Serialization probes, excluded from complete-answer assertion counts.'},null,2)+'\n');
}
console.log(results.length,'legacy root serialization probes passed');
