// Standalone check of an EXTRACTED Unit 6 release ZIP (v12.9.C), served by `python3 -m http.server` on BM_PORT.
// Usage: python3 -m http.server 8790 --bind 127.0.0.1 --directory <extracted folder> &
//        BM_PORT=8790 OUT=<results folder> node tools/review-lab/unit6/zip-smoke.mjs
// 1. version file; 2. every Unit 6 practice page: MathLive on the first question, no old integral boxes;
// 3. an integral-setup part: ONE blank MathLive field, keypad with the integral, dx and dy keys, and same-value
//    impostors typed into the field are NOT accepted (the model integrand plus (v - midpoint), and a constant), with
//    the value equality confirmed by the ZIP's own translator and parser; the field locks after grading;
// 4. the reported cubic (y = x^3 - 4x + 3, y = -x^3 + 4x + 3) rendered in the real page: shading inside the frame;
// 5. ?editor=legacy and a missing MathLive runtime still give a usable standard editor.
import {browser,context,open} from '../lib/browser.mjs';
import fs from 'node:fs';
const PORT=+process.env.BM_PORT,OUT=process.env.OUT;fs.mkdirSync(OUT,{recursive:true});
const base=`http://127.0.0.1:${PORT}`,T='ap-calculus/unit-6-applications-integration/topics';
const pages=['area-below-and-between-curves/non-calculator-practice','area-below-and-between-curves/calculator-practice','finding-area-in-terms-of-y/practice',
 'integrals-on-piecewise-defined-functions/practice','volume-by-cross-sections/non-calculator-practice','volume-by-cross-sections/calculator-practice',
 'solids-of-revolution/non-calculator-practice','solids-of-revolution/calculator-practice','comprehensive-review/non-calculator-practice','comprehensive-review/calculator-practice'];
const res={server:`python3 -m http.server on port ${PORT}, serving the extracted ZIP`,version:null,pages:[],setup:[],cubic:[],fallback:[],failures:[]};
const fail=m=>res.failures.push(m);
const b=await browser({scrollbars:true});
for(const [w,h,mob] of [[1366,768,false],[390,844,true]]){
 const vp=`${w}x${h}`,c=await context(b,{width:w,height:h,mobile:mob});
 // 2. every page, first question
 for(const pg of pages){
  const p=await open(c,`${base}/${T}/${pg}/?bm_seed=zipcheck-${w}`);
  await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});await p.waitForTimeout(400);
  const st=await p.evaluate(async()=>({
   version:await fetch('/assets/app-version.json').then(r=>r.json()).catch(()=>null),
   mathlive:document.querySelectorAll('#choices math-field').length,
   legacyVisible:[...document.querySelectorAll('#choices .bm-calc-editor')].filter(e=>e.offsetParent).length,
   oldIntegralBoxes:document.querySelectorAll('#choices .u6-int-row,#choices .u6-dbtn,#choices .u6-add,#choices .u6-intsign').length,
   firstControl:window.BatchMathUnit5Last?.parts?.[0]?.control||null,problem:window.BatchMathUnit5Last?.id||null,
   overflow:document.documentElement.scrollWidth-window.innerWidth}));
  if(!res.version)res.version=st.version;
  const firstIsChoice=st.firstControl==='choice';
  if(!firstIsChoice&&st.mathlive<1)fail(`${vp} ${pg}: no MathLive field on the first question`);
  if(st.legacyVisible||st.oldIntegralBoxes)fail(`${vp} ${pg}: visible standard editor (${st.legacyVisible}) or old integral boxes (${st.oldIntegralBoxes})`);
  if(st.overflow>0)fail(`${vp} ${pg}: page wider than the screen by ${st.overflow}px`);
  if(p._errs.length)fail(`${vp} ${pg}: ${p._errs.join(' / ')}`);
  delete st.version;res.pages.push({viewport:vp,page:pg,...st,errors:p._errs.length});await p.close();
 }
 // 3. an integral setup in the field: blank start, keys, and same-value impostors typed into it
 //    shifted: the model integrand plus (v - midpoint) on the first integral (exactly the same value, wrong integrand)
 //    constant: one integral of a constant with the same value
 for(const [kind,pg] of [['shifted','solids-of-revolution/non-calculator-practice'],['shifted','area-below-and-between-curves/non-calculator-practice'],['constant','solids-of-revolution/calculator-practice']]){
  let p=null,found=false;
  // a new seed per load until the first part is an integral setup (Next stays hidden until a problem is answered)
  for(let i=0;i<30&&!found;i++){
   if(p)await p.close();p=await open(c,`${base}/${T}/${pg}/?bm_seed=zipsetup-${kind}-${w}-${i}`);
   await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});await p.waitForTimeout(300);
   found=await p.evaluate(()=>window.BatchMathUnit5Last?.parts?.[0]?.control==='u6-integral');
  }
  if(!found){fail(`${vp}: no integral-setup first part found on ${pg}`);if(p)await p.close();continue;}
  const scope='#choices .unit5-part-1';await p.waitForSelector(`${scope} math-field`,{timeout:8000});
  const st=await p.evaluate(s=>({fields:document.querySelectorAll(`${s} math-field`).length,value:document.querySelector(`${s} math-field`).value,
   keys:[...document.querySelectorAll(`${s} [data-experimental-bridge] button`)].map(b=>b.getAttribute('aria-label')||b.textContent.trim()),
   id:window.BatchMathUnit5Last.id}),scope);
  const blank=!String(st.value).replace(/\\placeholder\{\}/g,'').trim();
  if(st.fields!==1)fail(`${vp}: ${st.fields} fields in the setup part (expected 1)`);
  if(!blank)fail(`${vp}: setup field not blank at the start: ${st.value}`);
  for(const k of ['Insert definite integral','Insert dx','Insert dy'])if(!st.keys.includes(k))fail(`${vp}: setup keypad lacks "${k}"`);
  // values computed with the ZIP's own translator, parser and checker
  const imp=await p.evaluate(async kind=>{
   const {translateIntegralSetup}=await import('/assets/mathlive/integral-setup.mjs');
   const C=window.BatchMathUnit6Core,part=window.BatchMathUnit5Last.parts[0],rows=part.answer.rows;
   const texOf=(rs,shift)=>rs.map((r,i)=>{const co=r.coef&&r.coef!=='1'?r.coef:'';const f=i===0&&shift?`${r.integrand}+${r.v}-\\frac{${r.lower}+${r.upper}}{2}`:r.integrand;
    return (i&&!co.startsWith('-')?'+':'')+co+`\\int_{${r.lower}}^{${r.upper}}\\left(${f}\\right)\\,d${r.v}`;}).join('');
   const valueOf=tex=>{const lin=translateIntegralSetup(tex).input,parsed=C.parseSetup(lin);if(parsed.error)return{lin,error:parsed.error};let V=0;
    for(const r of parsed.rows){const a=C.readExpr(r.lower,null).f(0),bb=C.readExpr(r.upper,null).f(0),k=String(r.coef||'').trim()?C.readExpr(r.coef,null).f(0):1,g=C.readExpr(r.integrand,r.v).f;
     const n=4000,hh=(bb-a)/n;let s=g(a)+g(bb);for(let j=1;j<n;j++)s+=(j%2?4:2)*g(a+j*hh);V+=k*s*hh/3;}
    return{lin,rows:parsed.rows,V,check:C.checkIntegral(parsed.rows,part.answer)};};
   const model=valueOf(texOf(rows,false));let impTex;
   if(kind==='shifted')impTex=texOf(rows,true);
   else{const r0=rows[0],a=C.readExpr(model.rows[0].lower,null).f(0),bb=C.readExpr(model.rows[0].upper,null).f(0);impTex=`\\int_{${r0.lower}}^{${r0.upper}}${(model.V/(bb-a)).toFixed(10)}\\,d${r0.v}`;}
   const im=valueOf(impTex);
   return{modelLinear:model.lin,modelAccepted:model.check.valid&&model.check.ok,value:model.V,impostorTex:impTex,impostorLinear:im.lin,impostorValue:im.V,
    sameValue:Math.abs(im.V-model.V)<=1e-7*Math.max(1,Math.abs(model.V)),checkerOnImpostor:im.check};},kind);
  if(!imp.modelAccepted)fail(`${vp}: the model setup was not accepted by the ZIP's checker: ${imp.modelLinear}`);
  if(!imp.sameValue)fail(`${vp} ${kind}: impostor value ${imp.impostorValue} differs from ${imp.value}; not a same-value test`);
  await p.locator(`${scope} math-field`).first().evaluate((e,l)=>{e.focus();e.executeCommand(['insert',l]);e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true}));},imp.impostorTex);
  await p.waitForTimeout(150);
  const hidden=await p.$eval(`${scope} input.staged-exact-input, ${scope} input.practice-answer-input`,e=>e.value).catch(()=>'');
  await p.locator(`${scope} .staged-check`).click({timeout:10000});await p.waitForTimeout(500);
  const fb=await p.evaluate(s=>{const f=document.querySelector(`${s} .staged-feedback`);return f?f.innerText.replace(/\s+/g,' ').trim():(document.querySelector(`${s} .staged-input-message`)?.textContent.trim()||'(no feedback)');},scope);
  const accepted=/is correct\.|^Correct\./.test(fb),graded=/not correct|incorrect/i.test(fb);
  if(accepted||!graded)fail(`${vp} ${kind}: same-value impostor ${accepted?'ACCEPTED':'not graded'}: ${imp.impostorTex} -> ${fb.slice(0,120)}`);
  const locked=await p.locator(`${scope} math-field`).first().evaluate(e=>e.getAttribute('aria-disabled')==='true'||e.readOnly).catch(()=>false);
  if(!locked)fail(`${vp} ${kind}: field not locked after grading`);
  await p.locator(scope).screenshot({path:`${OUT}/setup-impostor-${kind}-${pg.split('/')[0]}-${vp}.png`}).catch(()=>{});
  res.setup.push({viewport:vp,page:pg,kind,problem:st.id,fields:st.fields,blankAtStart:blank,integralKeys:['Insert definite integral','Insert dx','Insert dy'].every(k=>st.keys.includes(k)),
   modelLinear:imp.modelLinear,modelAccepted:imp.modelAccepted,value:imp.value,impostor:imp.impostorTex,impostorLinear:imp.impostorLinear,impostorValue:imp.impostorValue,sameValue:imp.sameValue,
   reachedAnswer:hidden,feedback:fb.slice(0,240),impostorAccepted:accepted,locked,errors:p._errs.length});
  if(p._errs.length)fail(`${vp} setup: ${p._errs.join(' / ')}`);
  await p.close();
 }
 // 4. the reported cubic, rendered in the real practice page from the ZIP's own engine
 {const p=await open(c,`${base}/${T}/area-below-and-between-curves/non-calculator-practice/?bm_seed=zipcubic`);
  await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});
  const r=await p.evaluate(async()=>{
   const rng=seed=>{let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}};
   const want='y=x^{3} - 4x + 3|y=-x^{3} + 4x + 3',saved=window.BatchMathRNG;let hit=null;
   try{for(let s=1;s<20000&&!hit;s++){window.BatchMathRNG={random:rng(s)};const q=window.BatchMathUnit6Area.make({family:'between_enclosed',tier:'intermediate',calc:'non-calculator'});if(q.id.includes(want))hit=q;}}finally{window.BatchMathRNG=saved;}
   if(!hit)return{found:false};
   const figs=[hit.questionHtml,...hit.parts.map(t=>t.explanation)].flatMap(t=>String(t).match(/<figure[\s\S]*?<\/figure>/g)||[]);
   document.querySelector('#question').innerHTML=`<div class="u5-question" style="width:100%">${figs.join('')}</div>`;
   await window.MathJax?.typesetPromise?.();await new Promise(z=>setTimeout(z,300));
   const box=document.querySelector('.question-box').getBoundingClientRect();
   return{found:true,id:hit.id,figures:[...document.querySelectorAll('#question svg.u6-svg')].map(svg=>{
    const [, , W, H]=svg.getAttribute('viewBox').split(/\s+/).map(Number),sr=svg.getBoundingClientRect();
    const pts=[...svg.querySelectorAll('polygon.u6-shade')].flatMap(pg=>pg.getAttribute('points').trim().split(/\s+/).map(t=>t.split(',').map(Number)));
    const xs=pts.map(q=>q[0]),ys=pts.map(q=>q[1]);
    const shadeRects=[...svg.querySelectorAll('polygon.u6-shade')].map(pg=>pg.getBoundingClientRect());
    return{viewBox:[W,H],shadedPoints:pts.length,margin:Math.min(Math.min(...xs)/W,(W-Math.max(...xs))/W,Math.min(...ys)/H,(H-Math.max(...ys))/H),
     shadingInsideRenderedSvg:shadeRects.every(q=>q.left>=sr.left-0.5&&q.right<=sr.right+0.5&&q.top>=sr.top-0.5&&q.bottom<=sr.bottom+0.5),
     figureInsideQuestionBox:sr.left>=box.left-0.5&&sr.right<=box.right+0.5,ticksZero:[...svg.querySelectorAll('text.u6-tick')].filter(t=>t.textContent.trim()==='0').length};}),
    overflow:document.documentElement.scrollWidth-window.innerWidth};});
  if(!r.found)fail(`${vp}: the cubic case was not generated`);
  else for(const [i,f] of r.figures.entries()){
   if(!(f.shadedPoints>0))fail(`${vp}: cubic figure ${i+1} has no shading`);
   if(!(f.margin>=0.025))fail(`${vp}: cubic figure ${i+1} shading margin ${f.margin}`);
   if(!f.shadingInsideRenderedSvg||!f.figureInsideQuestionBox)fail(`${vp}: cubic figure ${i+1} clipped or overflowing`);
   if(f.ticksZero)fail(`${vp}: cubic figure ${i+1} has a tick labelled 0`);}
  if(r.overflow>0)fail(`${vp}: cubic page overflow ${r.overflow}`);
  await p.locator('.question-box').screenshot({path:`${OUT}/cubic-${vp}.png`}).catch(()=>{});
  res.cubic.push({viewport:vp,...r,errors:p._errs.length});if(p._errs.length)fail(`${vp} cubic: ${p._errs.join(' / ')}`);await p.close();}
 await c.close();
 // 5. fallbacks: ?editor=legacy, and the MathLive runtime missing
 for(const mode of ['legacy','no-runtime']){
  const c2=await context(b,{width:w,height:h,mobile:mob});
  if(mode==='no-runtime')await c2.route(/\/assets\/mathlive\/vendor\//,r=>r.abort());
  const p=await open(c2,`${base}/${T}/solids-of-revolution/non-calculator-practice/?bm_seed=zipfb${mode==='legacy'?'&editor=legacy':''}`);
  await p.waitForSelector('#choices .bm-calc-editor',{timeout:20000}).catch(()=>{});await p.waitForTimeout(2500);
  const st=await p.evaluate(()=>({mathlive:document.querySelectorAll('#choices math-field').length,legacyVisible:[...document.querySelectorAll('#choices .bm-calc-editor')].filter(e=>e.offsetParent).length}));
  const errs=p._errs.filter(e=>!(mode==='no-runtime'&&/mathlive|Failed to fetch dynamically imported module|net::ERR_FAILED/i.test(e)));
  if(st.legacyVisible<1||st.mathlive)fail(`${vp} ${mode}: ${st.legacyVisible} visible standard editors, ${st.mathlive} MathLive fields`);
  if(errs.length)fail(`${vp} ${mode}: ${errs.join(' / ')}`);
  res.fallback.push({viewport:vp,mode,...st,errors:errs.length,expectedRuntimeErrors:p._errs.length-errs.length});await c2.close();
 }
}
await b.close();
fs.writeFileSync(`${OUT}/zip-smoke.json`,JSON.stringify(res,null,1)+'\n');
console.log(JSON.stringify({version:res.version,pages:res.pages.length,setup:res.setup.map(s=>({vp:s.viewport,kind:s.kind,page:s.page.split('/')[0],blank:s.blankAtStart,keys:s.integralKeys,model:s.modelAccepted,sameValue:s.sameValue,impostorAccepted:s.impostorAccepted,locked:s.locked,feedback:s.feedback.slice(0,110)})),
 cubic:res.cubic.map(c=>({vp:c.viewport,figures:c.figures?.length,margin:c.figures?Math.min(...c.figures.map(f=>f.margin)).toFixed(3):null})),fallback:res.fallback,failures:res.failures},null,1));
if(res.failures.length)process.exitCode=1;
