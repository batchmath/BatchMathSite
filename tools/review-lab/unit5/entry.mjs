// Unit 5 answer entry in a real browser: for each generated problem, every part's correct answer is entered
// (physical keyboard or on-screen keypad, alternating) and submitted (Enter or Check, alternating); the result
// must be correct. Choice parts click the correct choice. Also records scroll boxes inside the practice card
// (with real scrollbars), page overflow, MathJax rendering and console errors, and screenshots problem 1.
// Usage: node tools/review-lab/unit5/entry.mjs <page-path> [count=8] [width=1366] [height=768] [mobile]
//   page-path e.g. ap-calculus/unit-5-differential-equations/topics/basic-first-order-differential-equations/practice
//   BM_MODE=<practice type value> selects a Practice Type.
import {serve,browser,context,open,outDir,randomPort} from '../lib/browser.mjs';
import {keypadForm,parse,keypad,strokes} from '../lib/keypad.mjs';
const [page,count='8',W='1366',H='768',mob='']=process.argv.slice(2);
if(!page){console.error('usage: unit5/entry.mjs <page-path> [count] [width] [height] [mobile]');process.exit(2);}
const PORT=randomPort(8900),srv=await serve(PORT),b=await browser({scrollbars:true}),c=await context(b,{width:+W,height:+H,mobile:!!mob});
const p=await open(c,`http://127.0.0.1:${PORT}/${page.replace(/^\/|\/$/g,'')}/?bm_seed=u5entry-${W}`);
if(process.env.BM_MODE){await p.selectOption('#u5Mode',process.env.BM_MODE);await p.waitForTimeout(400);}
const typedForm=(part)=>{
 let tex=part.answerTex.replace(/^[A-Za-z]\s*=\s*/,'');
 if(part.answer.kind==='interval')tex=tex.replace(/\\left|\\right|\\,/g,'').replace(/\\infty/g,'infinity');
 return keypadForm(tex).replace(/\\text\{[^}]*\}/g,'');
};
const out={page,viewport:`${W}x${H}${mob?' mobile':''}`,mode:process.env.BM_MODE||'mixed',checked:0,parts:0,failures:[],scrollBoxes:[],pageOverflow:0,errors:p._errs,entered:[]};
for(let i=0;i<+count;i++){
 const info=await p.evaluate(()=>{const q=window.BatchMathUnit5Last;return{id:q.id,variant:q.variant,tier:q.unit5Meta.tier,parts:q.parts.map(t=>({control:t.control||'input',answerTex:t.answerTex,answer:t.answer?{kind:t.answer.kind}:null,correctIndex:t.correctIndex}))};});
 const row=[];
 for(let k=0;k<info.parts.length;k++){
  const part=info.parts[k],scope=`#choices .unit5-part-${k+1}`;
  if(part.control==='choice'||part.control==='svg-choice'){await p.locator(`${scope} .staged-choice`).nth(part.correctIndex).click();}
  else if(part.control==='input'){
   const lin=typedForm(part),mode=(i+k)%2?'keypad':'keyboard',submit=(i+k)%3===2?'Check':'Enter';
   await p.locator(`${scope} .bm-calc-editor`).first().click();
   if(mode==='keypad'){try{const kp=keypad(p,scope);await kp.emit(parse(lin));}catch(e){out.failures.push(`${info.id} part ${k+1}: keypad entry error ${e.message.slice(0,100)} for ${lin}`);await p.keyboard.press('Control+A');await p.keyboard.press('Backspace');for(const st of strokes(lin)){if(st.key)await p.keyboard.press(st.key);else await p.keyboard.type(st.text);}}}
   else for(const st of strokes(lin)){if(st.key)await p.keyboard.press(st.key);else await p.keyboard.type(st.text);}
   const src=await p.$eval(`${scope} .bm-calc-source`,e=>e.value);
   if(submit==='Enter')await p.keyboard.press('Enter');else await p.locator(`${scope} .staged-check`).click();
   row.push(`${mode}/${submit}: ${src}`);
  }else{out.failures.push(`${info.id}: control ${part.control} not handled by this tool`);break;}
  await p.waitForTimeout(250);
  const res=await p.evaluate(s=>{const f=document.querySelector(`${s} .staged-feedback .result`);return f?f.textContent.trim():(document.querySelector(`${s} .staged-input-message`)?.textContent.trim()||'(no feedback)');},scope);
  out.parts++;
  if(!/is correct\.|^Correct\./.test(res))out.failures.push(`${info.id} part ${k+1} [${part.answer?.kind||part.control}]: ${res} | answer ${part.answerTex}`);
  if(k<info.parts.length-1){const cont=p.locator(`${scope} .staged-continue`);if(await cont.count())await cont.click();await p.waitForTimeout(300);}
 }
 await p.evaluate(()=>window.MathJax?.typesetPromise?.()).catch(()=>{});await p.waitForTimeout(200);
 const lay=await p.evaluate(()=>{const boxes=[];for(const el of document.querySelectorAll('.practice-shell *')){const cs=getComputedStyle(el);if(cs.display==='inline'||el.closest('.bm-calc-keypad,.bm-calc-editor,mjx-assistive-mml'))continue;const sy=['auto','scroll'].includes(cs.overflowY)&&el.scrollHeight-el.clientHeight>1,sx=['auto','scroll'].includes(cs.overflowX)&&el.scrollWidth-el.clientWidth>1;if(sy||sx)boxes.push({cls:String(el.className).slice(0,50),v:el.scrollHeight-el.clientHeight,h:el.scrollWidth-el.clientWidth,text:el.textContent.replace(/\s+/g,' ').slice(0,60)});}return{boxes,page:document.documentElement.scrollWidth-document.documentElement.clientWidth,raw:/\\\(|\\frac|\\int/.test(document.querySelector('.practice-shell').innerText),merror:document.querySelectorAll('.practice-shell mjx-merror').length};});
 if(lay.boxes.length)out.scrollBoxes.push({id:info.id,boxes:lay.boxes.slice(0,3)});if(lay.page>0)out.pageOverflow++;if(lay.raw)out.failures.push(`${info.id}: raw TeX visible`);if(lay.merror)out.failures.push(`${info.id}: ${lay.merror} MathJax error(s)`);
 if(i===0)await p.screenshot({path:`${outDir('unit5')}/${page.split('/').slice(-2).join('-')}-${out.mode}-${W}x${H}.png`,fullPage:true});
 out.entered.push(`${info.variant}/${info.tier}: ${row.join(' | ')}`);out.checked++;
 if(await p.locator('#next').isHidden()){out.failures.push(`${info.id}: Next hidden`);break;}
 await p.locator('#next').click();await p.waitForTimeout(300);
}
console.log(JSON.stringify(out,null,1));
await b.close();srv.close();if(out.failures.length||out.errors.length||out.pageOverflow||out.scrollBoxes.length)process.exitCode=1;
