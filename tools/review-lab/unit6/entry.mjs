// Unit 6 answer entry in a real browser (v12.9.C): for each generated problem, every part's correct answer is entered
// and submitted, and the result must be correct. Entry alternates between the physical keyboard and the on-screen
// keypad, and submission between Enter and Check.
// MathLive (default): every typed answer is a MathLive field. An integral setup starts as ONE blank, focused field
// (no integral, limits, integrand or dx is filled in, and none of the old boxes exist); the setup is built in it:
//   keypad   - digits and the π key for a number in front, the ∫ key, limits, Tab, the integrand, the dx / dy key
//   keyboard - "int" (MathLive's shortcut), limits, Tab, the integrand, "dx" / "dy" typed
// Integrands and structured answers that are not plain numbers are pasted into the field (as LaTeX); plain values are
// typed. After grading the field must be locked.
// BM_EDITOR=legacy (?editor=legacy): the standard editor; an integral setup is typed as int(lower,upper,integrand,x).
// Also records scroll boxes inside the practice card, page overflow, raw TeX, MathJax errors and console errors, and
// screenshots problem 1. BM_MODE=<practice type> selects a Practice Type. BM_GRAPH_AFTER=1 checks that the graph
// appears only in Part A's explanation after it is graded (calculator cross sections).
// Usage: node tools/review-lab/unit6/entry.mjs <page-path> [count=8] [width=1366] [height=768] [mobile]
import {serve,browser,context,open,outDir,randomPort} from '../lib/browser.mjs';
import {keypadForm,parse,keypad,strokes} from '../lib/keypad.mjs';
const [page,count='8',W='1366',H='768',mob='']=process.argv.slice(2);
if(!page){console.error('usage: unit6/entry.mjs <page-path> [count] [width] [height] [mobile]');process.exit(2);}
const LEGACY=process.env.BM_EDITOR==='legacy';
const PORT=randomPort(9300),srv=await serve(PORT),b=await browser({scrollbars:true}),c=await context(b,{width:+W,height:+H,mobile:!!mob});
const p=await open(c,`http://127.0.0.1:${PORT}/${page.replace(/^\/|\/$/g,'')}/?bm_seed=u6entry-${W}${LEGACY?'&editor=legacy':''}`);
if(process.env.BM_MODE){await p.selectOption('#u6Mode',process.env.BM_MODE);await p.waitForTimeout(800);}
const typeStrokes=async(lin,scope)=>{for(const st of strokes(lin)){if(st.key)await p.keyboard.press(st.key);else if(st.pad)await keypad(p,scope).key(st.pad);else await p.keyboard.type(st.text);}};
const stripLabel=t=>t.replace(/^[A-Za-z](\([a-z]\))?\s*=\s*/,'');
const typedForm=part=>{
 let tex=stripLabel(part.answerTex);
 if(part.answer.kind==='interval')tex=tex.replace(/\\left|\\right|\\,/g,'').replace(/\\infty/g,'infinity').replace(/\\cup/g,'U');
 if(part.answer.kind==='list')tex=tex.replace(/[a-z]=/g,'').replace(/\\ /g,'');
 return keypadForm(tex).replace(/\\text\{[^}]*\}/g,'');
};
const lin=t=>keypadForm(t).replace(/(\d)(pi|sqrt|ln|e\^|[a-z(])/g,'$1*$2');
// ---------- MathLive helpers ----------
const mfIn=scope=>p.locator(`${scope} math-field`).first();
const mlValue=scope=>mfIn(scope).evaluate(e=>e.value);
const blank=v=>!String(v).replace(/\\placeholder\{\}/g,'').trim();
async function mlKey(scope,aria){await p.locator(`${scope} [data-experimental-bridge] button[aria-label="${aria}"]`).first().click();}
async function mlKeyText(scope,text){const k=p.locator(`${scope} [data-experimental-bridge] button`).filter({hasText:new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`)}).first();await k.click();}
async function paste(scope,latex){await mfIn(scope).evaluate((e,l)=>{e.focus();e.executeCommand(['insert',l]);e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true}));},latex);}
const plain=t=>/^-?\d+(\.\d+)?$/.test(String(t).trim());
async function typePlain(scope,t,how){if(how==='keypad'){for(const ch of String(t))await mlKeyText(scope,ch==='-'?'−':ch);}else await p.keyboard.type(String(t));}
// one integral setup, built in the field
async function mlSetup(scope,rows,how){
 for(const [i,r] of rows.entries()){
  let coef=r.coef&&r.coef!=='1'?r.coef:'',neg=coef.startsWith('-');if(neg)coef=coef.slice(1);
  if(neg||i>0)await typePlain(scope,neg?'-':'+',how==='keypad'&&!neg?'keyboard':how);
  if(coef==='\\pi'||coef==='2\\pi'){if(coef==='2\\pi')await typePlain(scope,'2',how);if(how==='keypad')await mlKey(scope,'π').catch(()=>mlKeyText(scope,'π'));else await p.keyboard.type('pi');}
  else if(coef)await paste(scope,coef);
  if(how==='keypad')await mlKey(scope,'Insert definite integral');else await p.keyboard.type('int');
  for(const lim of [r.lower,r.upper]){if(plain(lim))await typePlain(scope,lim,how);else await paste(scope,lim);await p.keyboard.press('Tab');}
  if(/^[0-9]*[xy]?$/.test(r.integrand)&&r.integrand)await typePlain(scope,r.integrand,'keyboard');else await paste(scope,`\\left(${r.integrand}\\right)`);
  if(how==='keypad')await mlKey(scope,`Insert d${r.v}`);else await p.keyboard.type(` d${r.v}`);
 }
}
async function mlAnswer(scope,part,how){
 const tex=stripLabel(part.answerTex);
 if(plain(tex))await typePlain(scope,tex,how);else await paste(scope,tex.replace(/\\ /g,''));
}
// ---------- legacy helpers ----------
async function enter(editor,text,scope,how){
 await editor.click();
 if(how==='keypad'){try{await keypad(p,scope).emit(parse(text));return;}catch(e){await p.keyboard.press('Control+A');await p.keyboard.press('Backspace');}}
 await typeStrokes(text,scope);
}
const linearSetup=rows=>rows.map((r,i)=>{let c=r.coef&&r.coef!=='1'?r.coef:'',neg=c.startsWith('-');if(neg)c=c.slice(1);return (neg?'-':i?'+':'')+(c?`(${lin(c)})*`:'')+`int(${lin(r.lower)},${lin(r.upper)},${lin(r.integrand)},${r.v})`;}).join('');

const out={page,viewport:`${W}x${H}${mob?' mobile':''}`,editor:LEGACY?'legacy':'mathlive',mode:process.env.BM_MODE||'mixed',checked:0,parts:0,integrals:0,mathliveFields:0,blankAtStart:0,locked:0,failures:[],scrollBoxes:[],pageOverflow:0,errors:p._errs,entered:[]};
for(let i=0;i<+count;i++){
 const info=await p.evaluate(()=>{const q=window.BatchMathUnit5Last;return{id:q.id,variant:q.variant,staged:q.answerType==='unit5-staged',correctIndex:q.correctIndex,tier:q.unit5Meta?.tier,
  parts:(q.parts||[]).map(t=>({control:t.control||'input',answerTex:t.answerTex,answer:t.answer?{kind:t.answer.kind,rows:t.answer.rows,altRows:t.answer.altRows}:null,correctIndex:t.correctIndex,max:t.maxIntegrals}))};});
 const row=[];
 if(process.env.BM_GRAPH_AFTER){const pre=await p.evaluate(()=>({svg:document.querySelectorAll('.practice-shell svg.u6-svg').length,btn:[...document.querySelectorAll('.practice-shell button')].filter(b=>/graph/i.test(b.textContent)).length}));
  if(pre.svg||pre.btn)out.failures.push(`${info.id}: before answering, ${pre.svg} graph(s) and ${pre.btn} graph button(s) shown`);}
 if(!info.staged){await p.locator('#choices .choice').nth(info.correctIndex).click();await p.waitForTimeout(250);const fb=await p.$eval('#feedback',e=>e.innerText.trim()).catch(()=>'');out.parts++;if(!/correct/i.test(fb)||/incorrect|not correct/i.test(fb))out.failures.push(`${info.id}: multiple choice feedback "${fb.slice(0,60)}"`);row.push('multiple choice');}
 for(let k=0;k<info.parts.length;k++){
  const part=info.parts[k],scope=`#choices .unit5-part-${k+1}`,how=(i+k)%2?'keypad':'keyboard',submit=(i+k)%3===2?'Check':'Enter';
  if(part.control==='choice'){await p.locator(`${scope} .staged-choice`).nth(part.correctIndex).click();row.push('choice');}
  else if(!LEGACY&&['input','u6-expr','u6-integral'].includes(part.control)){
   // the MathLive field: present, blank at the start, nothing pre-built
   await p.waitForSelector(`${scope} math-field`,{timeout:8000}).catch(()=>{});
   const st=await p.evaluate(s=>({mf:document.querySelectorAll(`${s} math-field`).length,old:document.querySelectorAll(`${s} .u6-int-row,${s} .u6-dbtn,${s} .u6-add,${s} .u6-intsign`).length,legacyVisible:[...document.querySelectorAll(`${s} .bm-calc-editor`)].filter(e=>e.offsetParent).length,
    keys:[...document.querySelectorAll(`${s} [data-experimental-bridge] button`)].map(b=>b.getAttribute('aria-label')||b.textContent.trim())}),scope);
   if(st.mf!==1)out.failures.push(`${info.id} part ${k+1}: ${st.mf} MathLive fields (expected 1)`);
   if(st.old||st.legacyVisible)out.failures.push(`${info.id} part ${k+1}: old integral boxes (${st.old}) or visible standard editors (${st.legacyVisible})`);
   const v0=await mlValue(scope).catch(()=>'?');if(blank(v0))out.blankAtStart++;else out.failures.push(`${info.id} part ${k+1}: field not blank at the start: ${v0}`);
   out.mathliveFields++;
   if(part.control==='u6-integral'){out.integrals++;
    for(const kk of ['Insert definite integral','Insert dx','Insert dy'])if(!st.keys.includes(kk))out.failures.push(`${info.id} part ${k+1}: keypad lacks "${kk}"`);
    await mfIn(scope).click();await mlSetup(scope,part.answer.rows,how);
    row.push(`integral ${how}/${submit}: ${part.answer.rows.length} integral(s)`);}
   else{await mfIn(scope).click();await mlAnswer(scope,part,how);row.push(`${part.control} ${how}/${submit}`);}
   await p.waitForTimeout(80);
   const latex=await mlValue(scope),hidden=await p.$eval(`${scope} input.staged-exact-input, ${scope} input.practice-answer-input`,e=>e.value).catch(()=>'');
   row[row.length-1]+=`: ${hidden}`;
   if(submit==='Enter'){await mfIn(scope).click();await p.keyboard.press('End').catch(()=>{});await p.keyboard.press('Enter');}else await p.locator(`${scope} .staged-check`).click();
   if(!hidden)out.failures.push(`${info.id} part ${k+1}: nothing reached the answer from ${latex}`);
  }
  else if(LEGACY&&part.control==='u6-integral'){out.integrals++;
   const text=linearSetup(part.answer.rows);await p.locator(`${scope} .bm-calc-editor`).first().click();await p.keyboard.type(text);
   if(submit==='Enter')await p.keyboard.press('Enter');else await p.locator(`${scope} .staged-check`).click();row.push(`integral legacy/${submit}: ${text}`);}
  else if(part.control==='input'||part.control==='u6-expr'){
   const text=typedForm(part);await enter(p.locator(`${scope} .bm-calc-editor`).first(),text,scope,how);
   const src=await p.$eval(`${scope} .bm-calc-source`,e=>e.value);
   if(submit==='Enter')await p.keyboard.press('Enter');else await p.locator(`${scope} .staged-check`).click();
   row.push(`${part.control} ${how}/${submit}: ${src}`);
  }else{out.failures.push(`${info.id}: control ${part.control} not handled by this tool`);break;}
  await p.waitForTimeout(300);
  const res=await p.evaluate(s=>{const f=document.querySelector(`${s} .staged-feedback .result`);return f?f.textContent.trim():(document.querySelector(`${s} .staged-input-message`)?.textContent.trim()||'(no feedback)');},scope);
  out.parts++;
  if(!/is correct\.|^Correct\./.test(res))out.failures.push(`${info.id} part ${k+1} [${part.answer?.kind||part.control}]: ${res} | answer ${part.answerTex} | entered ${row[row.length-1]}`);
  if(!LEGACY&&part.control!=='choice'){const lockedNow=await mfIn(scope).evaluate(e=>e.getAttribute('aria-disabled')==='true'||e.readOnly).catch(()=>false);if(lockedNow)out.locked++;else out.failures.push(`${info.id} part ${k+1}: field not locked after grading`);}
  if(process.env.BM_GRAPH_AFTER){const g=await p.evaluate(({scope,k,n})=>({here:document.querySelectorAll(`${scope} svg.u6-svg`).length,shade:document.querySelectorAll(`${scope} svg.u6-svg .u6-shade`).length,later:[...Array(n).keys()].filter(j=>j>k).reduce((a,j)=>a+document.querySelectorAll(`#choices .unit5-part-${j+1} svg.u6-svg`).length,0)}),{scope,k,n:info.parts.length});
   if(k===0&&(g.here!==1||!g.shade))out.failures.push(`${info.id}: Part A explanation has ${g.here} graph(s), ${g.shade} shaded region(s)`);
   if(k>0&&g.here)out.failures.push(`${info.id}: part ${k+1} repeats the graph`);
   if(g.later)out.failures.push(`${info.id}: an unanswered part shows a graph`);
   out.graphChecks=(out.graphChecks||0)+1;}
  if(k<info.parts.length-1){const cont=p.locator(`${scope} .staged-continue`);if(await cont.count())await cont.click();await p.waitForTimeout(400);}
 }
 await p.evaluate(()=>window.MathJax?.typesetPromise?.()).catch(()=>{});await p.waitForTimeout(200);
 const lay=await p.evaluate(()=>{const boxes=[];for(const el of document.querySelectorAll('.practice-shell *')){const cs=getComputedStyle(el);if(cs.display==='inline'||el.closest('.bm-calc-keypad,.bm-calc-editor,mjx-assistive-mml,math-field,.bm-mathlive-answer'))continue;const sy=['auto','scroll'].includes(cs.overflowY)&&el.scrollHeight-el.clientHeight>1,sx=['auto','scroll'].includes(cs.overflowX)&&el.scrollWidth-el.clientWidth>1;if(sy||sx)boxes.push({cls:String(el.className).slice(0,50),v:el.scrollHeight-el.clientHeight,h:el.scrollWidth-el.clientWidth,text:el.textContent.replace(/\s+/g,' ').slice(0,60)});}
  const sh=document.querySelector('.practice-shell');return{boxes,page:document.documentElement.scrollWidth-window.innerWidth,raw:/\\\(|\\\)|\\frac|\\int_/.test(sh.innerText),merror:sh.querySelectorAll('mjx-merror').length};});
 if(lay.boxes.length)out.scrollBoxes.push({id:info.id,boxes:lay.boxes.slice(0,3)});if(lay.page>0)out.pageOverflow++;if(lay.raw)out.failures.push(`${info.id}: raw TeX visible`);if(lay.merror)out.failures.push(`${info.id}: ${lay.merror} MathJax error(s)`);
 if(i===0)await p.screenshot({path:`${outDir('unit6')}/${page.split('/').slice(-2).join('-')}-${out.mode}-${out.editor}-${W}x${H}.png`,fullPage:true});
 out.entered.push(`${info.variant}/${info.tier}: ${row.join(' | ')}`);out.checked++;
 if(await p.locator('#next').isHidden()){out.failures.push(`${info.id}: Next hidden`);break;}
 await p.locator('#next').click();await p.waitForTimeout(600);
}
console.log(JSON.stringify(out,null,1));
await b.close();srv.close();if(out.failures.length||out.errors.length||out.pageOverflow||out.scrollBoxes.length)process.exitCode=1;
