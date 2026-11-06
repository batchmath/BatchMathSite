// The new cube-root controls also work in Unit 6's original text-editor fallback.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {harness,root} from '../keypad-completeness/browser-harness.mjs';
import {keypadForm,strokes} from '../review-lab/lib/keypad.mjs';
const h=await harness(),results=[],errors=[];
const catalog=JSON.parse(fs.readFileSync(root+'docs/final-integration/evidence/unit6/root-contract-catalog.json'));
const write=(page,text)=> (async()=>{for(const step of strokes(text)){if(step.key)await page.keyboard.press(step.key);else if(step.text)await page.keyboard.type(step.text);else throw Error('Unexpected fallback entry token');}})();
const click=locator=>locator.evaluate(b=>{if(b.disabled||!b.getClientRects().length)throw Error('Visible enabled key required');b.click();});
try {
 for(const width of [1366,390])for(const index of [1,11]) {
  const w=catalog.acceptedRootRepresentations[index],route='ap-calculus/unit-6-applications-integration/topics/'+(index===1?'finding-area-in-terms-of-y/practice':'solids-of-revolution/non-calculator-practice')+'/index.html';
  const page=await h.open(route,{legacy:true,width,height:900});page.on('pageerror',e=>errors.push(e.message));
  const r={index,width,questionId:w.questionId};
  try {
   await page.waitForFunction(n=>window.advancedQA&&window[n],w.name);
   const parts=await page.evaluate(w=>{let s=w.seed;window.BatchMathRNG={random:()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}};const q=window[w.name][w.method]({family:w.family,tier:w.tier,calc:w.calc});if(q.id!==w.questionId)throw Error('Question mismatch');advancedQA.load(q);return q.parts.map(p=>({answerTex:p.answerTex,rows:p.answer?.rows}));},w);
   assert.equal(await page.locator('math-field').count(),0);
   for(let part=0;part<=w.partIndex;part++) {
    const panel=page.locator('.unit5-part-'+(part+1)),editor=panel.locator('.bm-calc-editor').first();await editor.click();
    if(part<w.partIndex)await write(page,keypadForm(parts[part].answerTex.replace(/^.*?=/,'')));
    else {
     if(index===1)await write(page,'int(0,1,');
     const key=panel.locator('.bm-calc-keypad button').filter({hasText:/^∛$/});assert.equal(await key.count(),1);await click(key);
     await click(panel.locator('.bm-calc-keypad button').filter({hasText:/^y$/}));
     await click(panel.locator('.bm-calc-keypad button[aria-label="Move cursor right"]'));
     await write(page,index===1?',y)':'-y/4');
     r.serializedSource=await panel.locator('input.staged-exact-input').first().inputValue();
     assert.match(r.serializedSource,/(?:root\(3,y\)|cbrt\(y\))/);
    }
    await click(panel.locator('.staged-check'));assert.equal(await panel.locator('.result.good').count(),1,await panel.innerText());
    if(part<w.partIndex)await click(panel.locator('.staged-continue:visible'));
   }
   r.passed=true;
  } catch(e){r.passed=false;r.error=e.stack;console.log('FAIL',index,width,e.message);}
  finally {await page.close();results.push(r);}
 }
} finally {await h.close();fs.writeFileSync(root+'docs/final-integration/evidence/unit6/legacy-cube-root.json',JSON.stringify({results,errors},null,2)+'\n');}
assert.equal(results.length,4);assert.ok(results.every(r=>r.passed));assert.equal(errors.length,0);
console.log('4/4 Unit 6 legacy whole-answer cube-root button checks passed');
