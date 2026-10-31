// Unit 6 answer entry in a real browser: for each generated problem, every part's correct answer is entered and
// submitted, and the result must be correct. Typed parts alternate between the physical keyboard and the on-screen
// keypad, and between Enter and Check. Integral setups fill every row of the integral control (number in front,
// upper and lower limits, integrand), add rows with "+ Add another integral" and choose dx or dy. Choice parts click
// the correct choice; the review's piecewise problems (multiple choice) click the correct button. Also records scroll
// boxes inside the practice card, page overflow, raw TeX, MathJax errors and console errors, and screenshots problem 1.
// Usage: node tools/review-lab/unit6/entry.mjs <page-path> [count=8] [width=1366] [height=768] [mobile]
//   BM_MODE=<practice type value> selects a Practice Type.
import {serve,browser,context,open,outDir,randomPort} from '../lib/browser.mjs';
import {keypadForm,parse,keypad,strokes} from '../lib/keypad.mjs';
const [page,count='8',W='1366',H='768',mob='']=process.argv.slice(2);
if(!page){console.error('usage: unit6/entry.mjs <page-path> [count] [width] [height] [mobile]');process.exit(2);}
const PORT=randomPort(9300),srv=await serve(PORT),b=await browser({scrollbars:true}),c=await context(b,{width:+W,height:+H,mobile:!!mob});
const p=await open(c,`http://127.0.0.1:${PORT}/${page.replace(/^\/|\/$/g,'')}/?bm_seed=u6entry-${W}`);
if(process.env.BM_MODE){await p.selectOption('#u6Mode',process.env.BM_MODE);await p.waitForTimeout(500);}
const typeStrokes=async(lin,scope)=>{for(const st of strokes(lin)){if(st.key)await p.keyboard.press(st.key);else if(st.pad)await keypad(p,scope).key(st.pad);else await p.keyboard.type(st.text);}};
const typedForm=part=>{
 let tex=part.answerTex.replace(/^[A-Za-z](\([a-z]\))?\s*=\s*/,'');
 if(part.answer.kind==='interval')tex=tex.replace(/\\left|\\right|\\,/g,'').replace(/\\infty/g,'infinity').replace(/\\cup/g,'U');
 if(part.answer.kind==='list')tex=tex.replace(/[a-z]=/g,'').replace(/\\ /g,'');
 return keypadForm(tex).replace(/\\text\{[^}]*\}/g,'');
};
async function enter(editor,lin,scope,how){
 await editor.click();
 if(how==='keypad'){try{await keypad(p,scope).emit(parse(lin));return;}catch(e){await p.keyboard.press('Control+A');await p.keyboard.press('Backspace');}}
 await typeStrokes(lin,scope);
}
const out={page,viewport:`${W}x${H}${mob?' mobile':''}`,mode:process.env.BM_MODE||'mixed',checked:0,parts:0,integrals:0,failures:[],scrollBoxes:[],pageOverflow:0,errors:p._errs,entered:[]};
for(let i=0;i<+count;i++){
 const info=await p.evaluate(()=>{const q=window.BatchMathUnit5Last;return{id:q.id,variant:q.variant,staged:q.answerType==='unit5-staged',correctIndex:q.correctIndex,tier:q.unit5Meta?.tier,
  parts:(q.parts||[]).map(t=>({control:t.control||'input',answerTex:t.answerTex,answer:t.answer?{kind:t.answer.kind,rows:t.answer.rows}:null,correctIndex:t.correctIndex}))};});
 const row=[];
 if(!info.staged){ // the old multiple-choice piecewise problems in the review
  await p.locator('#choices .choice').nth(info.correctIndex).click();await p.waitForTimeout(250);
  const fb=await p.$eval('#feedback',e=>e.innerText.trim()).catch(()=>'');out.parts++;
  if(!/correct/i.test(fb)||/incorrect|not correct/i.test(fb))out.failures.push(`${info.id}: multiple choice feedback "${fb.slice(0,60)}"`);
  row.push('multiple choice');
 }
 for(let k=0;k<info.parts.length;k++){
  const part=info.parts[k],scope=`#choices .unit5-part-${k+1}`,how=(i+k)%2?'keypad':'keyboard',submit=(i+k)%3===2?'Check':'Enter';
  if(part.control==='choice'){await p.locator(`${scope} .staged-choice`).nth(part.correctIndex).click();row.push('choice');}
  else if(part.control==='u6-integral'){
   const rows=part.answer.rows;out.integrals++;
   for(let r=0;r<rows.length;r++){
    if(r>0)await p.locator(`${scope} .u6-add`).click();
    const rowEl=p.locator(`${scope} .u6-int-row`).nth(r),eds=rowEl.locator('.bm-calc-editor'),R=rows[r];
    const vals=[R.coef,R.upper,R.lower,R.integrand].map(t=>t?keypadForm(t).replace(/(\d)(pi|sqrt|ln|e\^|[a-z(])/g,'$1*$2'):'');
    for(let f=0;f<4;f++)if(vals[f])await enter(eds.nth(f),vals[f],scope,how);
    await rowEl.locator(`.u6-dbtn`,{hasText:`d${R.v}`}).click();
   }
   if(submit==='Enter'){await p.locator(`${scope} .u6-int-row`).first().locator('.bm-calc-editor').last().click();await p.keyboard.press('End');await p.keyboard.press('Enter');}
   else await p.locator(`${scope} .staged-check`).click();
   row.push(`integral ${how}/${submit}: ${rows.length} row(s)`);
  }
  else if(part.control==='input'||part.control==='u6-expr'){
   const lin=typedForm(part);
   await enter(p.locator(`${scope} .bm-calc-editor`).first(),lin,scope,how);
   const src=await p.$eval(`${scope} .bm-calc-source`,e=>e.value);
   if(submit==='Enter')await p.keyboard.press('Enter');else await p.locator(`${scope} .staged-check`).click();
   row.push(`${part.control} ${how}/${submit}: ${src}`);
  }else{out.failures.push(`${info.id}: control ${part.control} not handled by this tool`);break;}
  await p.waitForTimeout(250);
  const res=await p.evaluate(s=>{const f=document.querySelector(`${s} .staged-feedback .result`);return f?f.textContent.trim():(document.querySelector(`${s} .staged-input-message`)?.textContent.trim()||'(no feedback)');},scope);
  out.parts++;
  if(!/is correct\.|^Correct\./.test(res))out.failures.push(`${info.id} part ${k+1} [${part.answer?.kind||part.control}]: ${res} | answer ${part.answerTex} | entered ${row[row.length-1]}`);
  if(k<info.parts.length-1){const cont=p.locator(`${scope} .staged-continue`);if(await cont.count())await cont.click();await p.waitForTimeout(300);}
 }
 await p.evaluate(()=>window.MathJax?.typesetPromise?.()).catch(()=>{});await p.waitForTimeout(200);
 const lay=await p.evaluate(()=>{const boxes=[];for(const el of document.querySelectorAll('.practice-shell *')){const cs=getComputedStyle(el);if(cs.display==='inline'||el.closest('.bm-calc-keypad,.bm-calc-editor,mjx-assistive-mml'))continue;const sy=['auto','scroll'].includes(cs.overflowY)&&el.scrollHeight-el.clientHeight>1,sx=['auto','scroll'].includes(cs.overflowX)&&el.scrollWidth-el.clientWidth>1;if(sy||sx)boxes.push({cls:String(el.className).slice(0,50),v:el.scrollHeight-el.clientHeight,h:el.scrollWidth-el.clientWidth,text:el.textContent.replace(/\s+/g,' ').slice(0,60)});}
  const sh=document.querySelector('.practice-shell');return{boxes,page:document.documentElement.scrollWidth-window.innerWidth,raw:/\\\(|\\\)|\\frac|\\int_/.test(sh.innerText),merror:sh.querySelectorAll('mjx-merror').length};});
 if(lay.boxes.length)out.scrollBoxes.push({id:info.id,boxes:lay.boxes.slice(0,3)});if(lay.page>0)out.pageOverflow++;if(lay.raw)out.failures.push(`${info.id}: raw TeX visible`);if(lay.merror)out.failures.push(`${info.id}: ${lay.merror} MathJax error(s)`);
 if(i===0)await p.screenshot({path:`${outDir('unit6')}/${page.split('/').slice(-2).join('-')}-${out.mode}-${W}x${H}.png`,fullPage:true});
 out.entered.push(`${info.variant}/${info.tier}: ${row.join(' | ')}`);out.checked++;
 if(await p.locator('#next').isHidden()){out.failures.push(`${info.id}: Next hidden`);break;}
 await p.locator('#next').click();await p.waitForTimeout(350);
}
console.log(JSON.stringify(out,null,1));
await b.close();srv.close();if(out.failures.length||out.errors.length||out.pageOverflow||out.scrollBoxes.length)process.exitCode=1;
