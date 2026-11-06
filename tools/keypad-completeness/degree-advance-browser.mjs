import fs from 'node:fs';import assert from 'node:assert/strict';
import {harness,root,padSelector} from './browser-harness.mjs';
import {instrument} from '../mathlive-sitewide/prep-engine.mjs';
import {enterAnswer} from './enter-answer.mjs';
const h=await harness(),results=[];
h.transforms.set('assets/calc-prep-angle-skills.js',instrument);
try{
 const page=await h.open('calculus-prep/trig-angle-skills/index.html',{width:375});
 await page.waitForFunction(()=>window.prepQA);
 for(const format of ['degrees','radians']){
  await page.locator('#mode').selectOption('reference');await page.locator('#format').selectOption(format);
  await page.evaluate(()=>MathJax.typesetPromise());await page.locator('math-field:visible').waitFor();
  const expectedProfile='ml-prep-'+format;
  assert.equal(await page.locator(padSelector).first().getAttribute('data-audit-profile'),expectedProfile);
  const wrongQuestion=await page.evaluate(()=>prepQA.current);
  const wrongEntry=await enterAnswer(page,page.locator('math-field:visible'),'987654321'+(format==='degrees'?'°':''));
  await page.locator(padSelector).locator('button').filter({hasText:/^Check$/}).click();assert.equal(await page.locator('#feedback').getAttribute('class'),'feedback wrong');
  await page.locator('#next').click();await page.waitForFunction(id=>prepQA.current.id!==id,wrongQuestion.id);
  await page.evaluate(()=>MathJax.typesetPromise());
  const correctQuestion=await page.evaluate(()=>prepQA.current);
  const correctEntry=await enterAnswer(page,page.locator('math-field:visible'),correctQuestion.correct);
  await page.locator(padSelector).locator('button').filter({hasText:/^Check$/}).click();assert.equal(await page.locator('#feedback').getAttribute('class'),'feedback correct');
  await page.waitForFunction(id=>prepQA.current.id!==id,correctQuestion.id);await page.evaluate(()=>MathJax.typesetPromise());
  assert.equal(await page.locator('#answerRaw').inputValue(),'');
  assert.equal(await page.locator(padSelector).first().getAttribute('data-audit-profile'),expectedProfile);
  results.push({format,wrongQuestionId:wrongQuestion.id,correctQuestionId:correctQuestion.id,correctExpected:correctQuestion.correct,wrongEntry,correctEntry,wrongRejected:true,correctAccepted:true,nativeNext:true,nativeAutomaticAdvance:true,cleared:true,profile:expectedProfile,passed:true});
 }
 await page.close();
}finally{await h.close();fs.writeFileSync(root+'docs/audits/evidence/keypad-degree-native-advance-final-d.json',JSON.stringify({results,note:'Native Next and the original 650ms automatic advance, with real unpinned generated questions. Correct and wrong assertions use separately recorded question IDs; these UI-flow checks are separate from same-question field-ledger counts.'},null,2)+'\n');}
console.log(results.length,'degree/radian native progression checks passed');
