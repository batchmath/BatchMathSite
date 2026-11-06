// Canonical cube-root forms from the original Unit 6 generators, entered with actual displayed keys.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {harness,root} from '../keypad-completeness/browser-harness.mjs';
import {enterAnswer} from '../keypad-completeness/enter-answer.mjs';
import {parseInput} from '../../assets/mathlive/answer-adapter.mjs';

const catalog=JSON.parse(fs.readFileSync(root+'docs/final-integration/evidence/unit6/root-contract-catalog.json'));
const witnesses=catalog.acceptedRootRepresentations;
const h=await harness(),results=[],errors=[];
const target=process.env.UNIT6_ROOT_OUT||root+'docs/final-integration/evidence/unit6/cube-root-browser.json';
const tree=raw=>{const p=parseInput(raw,'latex');assert.equal(p.status,'complete',raw);return p.tree;};
const setup=(rows,wrong)=>({type:'integral-setup',rows:rows.map((r,i)=>({coefficient:r.coef&&r.coef!=='1'?tree(r.coef):null,lower:tree(r.lower),upper:tree(r.upper),variable:r.v,integrand:tree(wrong&&i===0?`(${r.integrand})+1`:r.integrand)}))});
const routes={make:'area-below-and-between-curves/non-calculator-practice',makeY:'finding-area-in-terms-of-y/practice',makeCS:'volume-by-cross-sections/non-calculator-practice',makeSolid:'solids-of-revolution/non-calculator-practice',frq:'comprehensive-review/non-calculator-practice'};
const click=loc=>loc.evaluate(b=>{if(b.disabled||!b.getClientRects().length)throw Error('Displayed enabled control required');b.click();});
try {
 for(const width of (process.env.UNIT6_ROOT_WIDTH?[+process.env.UNIT6_ROOT_WIDTH]:[1366,390])) {
  for(const [index,witness] of witnesses.entries()) {
   if(process.env.UNIT6_ROOT_INDEX&&!process.env.UNIT6_ROOT_INDEX.split(',').map(Number).includes(index))continue;
   const type=witness.name==='BatchMathUnit6FRQ'?'frq':witness.method;
   const route='ap-calculus/unit-6-applications-integration/topics/'+routes[type]+'/index.html';
   const page=await h.open(route,{width,height:width===390?844:900});page.on('pageerror',e=>errors.push({index,width,message:e.message}));
   const r={catalogIndex:index,width,...witness};
   try {
    await page.waitForFunction(name=>window.advancedQA&&window[name],witness.name);
    const load=()=>page.evaluate(w=>{
     let s=w.seed;window.BatchMathRNG={random:()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}};
     const q=window[w.name][w.method]({family:w.family,tier:w.tier,calc:w.calc});
     if(q.id!==w.questionId)throw Error('Original generator question mismatch');
     advancedQA.load(q);
     return q.parts.map(p=>({control:p.control,answerTex:p.answerTex,correctIndex:p.correctIndex,rows:p.answer?.rows}));
    },witness);
    async function enter(wrong) {
     const parts=await load();let entry;
     for(let part=0;part<=witness.partIndex;part++) {
      const panel=page.locator('#choices .unit5-part-'+(part+1)),p=parts[part];
      if(p.control==='choice')await click(panel.locator('.staged-choice').nth(p.correctIndex));
      else {
       const field=panel.locator('math-field');await field.waitFor();
       assert.equal((await field.evaluate(m=>m.value)).replace(/\\placeholder\{\}/g,'').trim(),'');
       entry=p.control==='u6-integral'?await enterAnswer(page,field,'canonical Unit 6 setup',{tree:setup(p.rows,wrong&&part===witness.partIndex)}):await enterAnswer(page,field,wrong&&part===witness.partIndex?'987654321':p.answerTex.replace(/^.*?=/,''),{format:'latex'});
       await click(panel.locator('.staged-check'));
       const feedback=await panel.locator('.staged-feedback').innerText();
       const good=!!await panel.locator('.result.good').count();
       assert.equal(good,!(wrong&&part===witness.partIndex),feedback);
       if(wrong&&part===witness.partIndex)assert.match(feedback,/not correct|incorrect/i);
      }
      if(part<witness.partIndex) {
       await click(panel.locator('.staged-continue:visible'));
       await page.locator('#choices .unit5-part-'+(part+2)+' math-field').waitFor();
      }
     }
     return entry;
    }
    r.correctEntry=await enter(false);
    assert.ok(r.correctEntry.used.some(k=>k.label==='∛'),'Canonical cube root uses the displayed cube-root key');
    r.correctAccepted=true;r.wrongEntry=await enter(true);r.wrongRejected=true;
    r.layout=await page.evaluate(async()=>{await MathJax.typesetPromise();await document.fonts.ready;return {overflow:document.documentElement.scrollWidth-innerWidth,errors:document.querySelectorAll('mjx-merror').length};});
    assert.ok(r.layout.overflow<=1);assert.equal(r.layout.errors,0);r.passed=true;
   } catch(e){r.passed=false;r.error=e.stack;console.log('FAIL',index,width,e.message);}
   finally {await page.close();results.push(r);fs.writeFileSync(target,JSON.stringify({results,errors},null,2)+'\n');}
  }
 }
} finally {await h.close();}
const expected=(process.env.UNIT6_ROOT_WIDTH?1:2)*(process.env.UNIT6_ROOT_INDEX?process.env.UNIT6_ROOT_INDEX.split(',').length:16);
assert.equal(results.length,expected);assert.ok(results.every(r=>r.passed));assert.equal(errors.length,0);
console.log(expected+'/'+expected+' Unit 6 canonical cube-root field checks passed with keypad-only correct/wrong grading');
