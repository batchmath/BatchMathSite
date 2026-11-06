import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url));
const fixtures=process.env.MATHJAX_FIXTURE_ROOT;
assert.ok(fixtures,'Set MATHJAX_FIXTURE_ROOT to the real MathJax/NewCM fixture cache');
const targets=JSON.parse(fs.readFileSync(root+'tools/integration/keypad-stability-routes.json'));
const padSelector='.bm-calc-keypad,.bm-keypad,.bm-u3-shared-keypad,.algebra-keypad,#exactKeypad';
const fieldSelector='math-field,.bm-calc-editor,.bm-fraction-editor,#exactEditor,main input:not([type=checkbox]):not([type=radio]):not([type=hidden]),main [role=textbox]';
const results=[],errors=[];
const baselineRef=process.env.STABILITY_BASE_REF;
const baselineFiles=new Set(['assets/calculus-keypad.js','assets/mathlive/answer-field.mjs','assets/mathlive/native-fields.mjs','assets/mathlive/dynamic-fields.mjs','assets/mathlive/keypad-bridge.mjs','assets/mathlive/pilot.css','assets/im1-keypad.css','im1/unit-1-review/topics/multiplication/practice/index.html']);
const baselineCache=new Map();
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{try{const n=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let f=n.startsWith('/__mathjax/')?path.join(fixtures,n.slice(11)):path.join(root,n);if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('content-type',mime[path.extname(f)]||'application/octet-stream');const relative=path.relative(root,f);if(baselineRef&&baselineFiles.has(relative)){if(!baselineCache.has(relative))baselineCache.set(relative,execFileSync('git',['show',baselineRef+':'+relative],{cwd:root,maxBuffer:8000000}));res.end(baselineCache.get(relative));}else res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.BM_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
async function advance(p){
 for(const s of ['#startBtn:visible','#next:visible:enabled','#nextBtn:visible:enabled','#nextProblem:visible:enabled','.staged-continue:visible:enabled'])if(await p.locator(s).count()){await p.locator(s).first().click();return;}
 for(const text of ['Type slopes instead','Enter points instead']){const b=p.getByRole('button',{name:text,exact:true});if(await b.count()&&await b.isVisible()){await b.click();return;}}
 const choices=p.locator('.choice-btn:visible:enabled,.staged-choice:visible:enabled,.choice:visible:enabled').filter({hasNotText:/^(Check|Clear|Erase|Try again|Reset|Show|Hide|COURSES)/});
 if(await choices.count()){await choices.first().click();if(await p.locator('#submit:visible:enabled').count())await p.locator('#submit:visible:enabled').click();}
}
async function reach(p,mode){
 for(let i=0;i<45;i++){
  await p.waitForTimeout(150);
  const ready=await p.evaluate(({mode,fieldSelector,padSelector})=>{
   const visible=e=>{const r=e.getBoundingClientRect();return r.width>10&&r.height>10&&!e.closest('[hidden],.hidden,.staged-completed');};
   return [...document.querySelectorAll(padSelector)].some(visible)&&(mode==='mathlive'?[...document.querySelectorAll('math-field')].some(e=>visible(e)&&!e.readOnly):[...document.querySelectorAll(fieldSelector)].some(e=>visible(e)&&!e.disabled));
  },{mode,fieldSelector,padSelector});
  if(ready)return;await advance(p);
 }
 throw Error('No active typed question/keypad reached');
}
async function instrument(p){await p.evaluate(({padSelector,fieldSelector})=>{
 const visible=e=>{const r=e.getBoundingClientRect();return r.width>10&&r.height>10&&!e.closest('[hidden],.hidden,.staged-completed');};
 const first=s=>[...document.querySelectorAll(s)].find(visible);
 const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,docX:r.x+scrollX,docY:r.y+scrollY};};
 const ids=new WeakMap();let serial=0;const id=n=>{if(!ids.has(n))ids.set(n,++serial);return ids.get(n);};
 window.__keypadMetrics=()=>{
  const pad=first(padSelector),fields=[...document.querySelectorAll(fieldSelector)].filter(visible);
  const question=first('#question,#questionArea,#problem,#prompt,.question');
  return{x:scrollX,y:scrollY,width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,visualViewport:visualViewport?{x:visualViewport.offsetLeft,y:visualViewport.offsetTop,width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale}:null,
   fields:fields.map(e=>({tag:e.tagName,id:e.id,box:box(e),readOnly:e.readOnly||false})),fieldHeight:fields.filter(e=>!fields.some(parent=>parent!==e&&parent.contains(e))).reduce((s,e)=>s+e.getBoundingClientRect().height,0),pad:box(pad),padId:pad?id(pad):null,question:box(question),check:box(pad?[...pad.querySelectorAll('button')].find(b=>/^Check/.test(b.textContent.trim())):null),focus:document.activeElement?.tagName,focusId:document.activeElement?.id,feedback:document.querySelector('#feedback')?.textContent?.slice(0,240),validationHeight:[...document.querySelectorAll('.staged-input-message')].reduce((s,e)=>s+e.getBoundingClientRect().height,0),validationContainerHeight:[...new Set([...document.querySelectorAll('.staged-input-message')].map(e=>e.parentElement))].reduce((s,e)=>s+e.getBoundingClientRect().height,0),nextAvailable:[...document.querySelectorAll('#next,#nextBtn,#nextProblem,.staged-continue')].some(e=>visible(e)&&!e.disabled),hookRestored:[...document.querySelectorAll('math-field')].every(m=>m.onScrollIntoView==null)};
 };
 window.__keypadDOM={addedPads:0,removedPads:0};
 new MutationObserver(records=>{for(const record of records)for(const[k,which]of [['addedPads','addedNodes'],['removedPads','removedNodes']])for(const n of record[which])if(n.nodeType===1&&(n.matches(padSelector)||n.querySelector(padSelector)))__keypadDOM[k]++;}).observe(document.body,{childList:true,subtree:true});
 window.__keypadBefore=null;
 document.addEventListener('pointerdown',e=>{if(e.target.closest(padSelector)){window.__keypadBefore=__keypadMetrics();__keypadDOM={addedPads:0,removedPads:0};}},true);
 const pad=first(padSelector);if(pad)scrollTo({top:pad.getBoundingClientRect().top+scrollY-20,behavior:'instant'});
 },{padSelector,fieldSelector});await p.waitForTimeout(350);}
function checkMovement(action){
 const before=action.before;assert.ok(before,'Pointer/touch activation was not measured');
 for(const after of action.samples){
  const dx=after.x-before.x,dy=after.y-before.y,flow=after.pad.docY-before.pad.docY,height=after.fieldHeight-before.fieldHeight;
  // A visible fraction/root may naturally change the field's intrinsic height.
  // Accept only its measured local reflow, never unrelated scrolling/replacement.
  const natural=action.structural&&Math.abs(height)<=70&&Math.abs(flow-height)<=2;
  assert.ok(Math.abs(dx)<=2,`horizontal viewport shift ${dx}`);
  assert.ok(Math.abs(dy)<=2||natural&&Math.abs(dy-flow)<=2,`vertical viewport shift ${dy}, field reflow ${height}`);
  assert.ok(Math.abs(flow)<=2||natural,`keypad document movement ${flow}`);
  if(before.question&&after.question)assert.ok(Math.abs(after.question.docY-before.question.docY)<=2,'question moved in document');
  assert.equal(after.padId,before.padId,'active keypad was replaced on ordinary input');
  assert.equal(after.hookRestored,true,'keypad scroll policy leaked outside its action');
  if(before.visualViewport&&after.visualViewport){assert.ok(Math.abs(after.visualViewport.x-before.visualViewport.x)<=2);assert.ok(Math.abs(after.visualViewport.y-before.visualViewport.y)<=2);assert.equal(after.visualViewport.width,before.visualViewport.width);assert.equal(after.visualViewport.height,before.visualViewport.height);}
 }
 assert.equal(action.dom.addedPads,0);assert.equal(action.dom.removedPads,0);
}
async function run(job){
 const state={...job,actions:[]};const p=await browser.newPage({viewport:{width:job.resizeFrom||job.width,height:job.height},hasTouch:!!job.touch,isMobile:!!job.touch,serviceWorkers:'block'});p.setDefaultTimeout(12000);
 p.on('pageerror',e=>errors.push({route:job.route,mode:job.mode,error:e.stack}));
 try{
  await p.route('https://**/*',r=>r.abort());await p.route('https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js',r=>r.fulfill({contentType:'text/javascript',body:`MathJax.loader={paths:{mathjax:'${base}/__mathjax/mathjax','mathjax-newcm':'${base}/__mathjax/mathjax-newcm'}};MathJax.chtml=Object.assign({},MathJax.chtml,{fontURL:'${base}/__mathjax/mathjax-newcm/chtml/woff2'});MathJax.output={font:'mathjax-newcm'};\n`+fs.readFileSync(fixtures+'/mathjax/tex-chtml.js','utf8')}));
  await p.goto(base+'/'+job.route+'?bm_seed=final-route-sweep'+(job.mode==='legacy'?'&editor=legacy':''),{waitUntil:'domcontentloaded'});await reach(p,job.mode);
  if(job.resizeFrom)await p.setViewportSize({width:job.width,height:job.height});
  if(job.zoom)await p.evaluate(zoom=>document.documentElement.style.zoom=String(zoom),job.zoom);
  await p.evaluate(async()=>{await window.MathJax?.startup?.promise;await window.MathJax?.typesetPromise?.();await document.fonts.ready;});await p.waitForTimeout(200);await instrument(p);
  const visiblePad=p.locator(padSelector.split(',').map(s=>s+':visible').join(',')).first();
  async function press(label,options={}){
   let b=options.aria?visiblePad.locator('button[aria-label="'+options.aria+'"]'):visiblePad.locator('button').filter({hasText:new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')});
   b=b.first();if(!await b.count()||await b.isDisabled())return false;
   await p.evaluate(()=>{__keypadBefore=null;__keypadDOM={addedPads:0,removedPads:0};});
   const samples=[];
   if(job.touch)await b.tap();
   else if(label==='7'&&!state.heldPointerTested){
    await b.hover();await p.waitForTimeout(180);await p.mouse.down();await p.waitForTimeout(90);
    samples.push(await p.evaluate(()=>__keypadMetrics()));await p.mouse.up();state.heldPointerTested=true;
   }else await b.click();
   for(const ms of [25,75,150]){await p.waitForTimeout(ms);samples.push(await p.evaluate(()=>__keypadMetrics()));}
   const extra=await p.evaluate(()=>({before:__keypadBefore,dom:__keypadDOM}));const action={label,structural:!!options.structural,...extra,samples};state.actions.push(action);
   if(label!=='Check')checkMovement(action);
   else for(const s of samples){
    const before=extra.before;
    const graded=s.nextAvailable||s.fields.some(f=>f.readOnly&&!before.fields.find(b=>b.id===f.id&&b.tag===f.tag)?.readOnly);
    const validation=s.validationHeight-before.validationHeight,feedbackFlow=s.validationContainerHeight-before.validationContainerHeight;
    const localFeedback=validation>0&&feedbackFlow>=validation&&Math.abs(s.fieldHeight-before.fieldHeight)<=2&&s.pad&&before.pad&&Math.abs((s.pad.docY-before.pad.docY)-feedbackFlow)<=2&&Math.abs((s.y-before.y)-feedbackFlow)<=2&&Math.abs(s.pad.y-before.pad.y)<=2;
    if(graded)action.intentionalGradingNavigation=true;
    else if(localFeedback)action.measuredValidationReflow=true;
    else assert.ok(Math.abs(s.x-before.x)<=2&&Math.abs(s.y-before.y)<=2,'Check shifted viewport without grading or measured feedback reflow');
   }
   return true;
  }
  for(let round=0;round<2;round++)for(const label of ['7','8','−','.','←','→','⌫','Clear'])await press(label,{structural:label==='Clear'});
  for(const [label,aria]of [['fraction','Insert stacked fraction'],['xⁿ',null],['√',null]]){
   if(await press(label,{aria,structural:true})){await press('3',{structural:true});await press('→',{structural:true});await press('4',{structural:true});await press('Clear',{structural:true});}
  }
  const fields=p.locator(job.mode==='mathlive'?'math-field:visible':'.bm-calc-editor:visible,.bm-fraction-editor:visible,#exactEditor:visible,main input:not([type=checkbox]):not([type=radio]):not([type=hidden]):visible').filter({visible:true});
  let typedFields=0;
  for(const field of await fields.all()){
   const rect=await field.boundingBox();if(!rect||rect.width<10||rect.height<10||await field.isDisabled())continue;
   if(typedFields++>=2)break;
   await p.mouse.move(4,4);await p.waitForTimeout(80);
   await field.click();await p.waitForFunction(e=>document.activeElement===e,await field.elementHandle());await p.waitForTimeout(60);await p.keyboard.type('12',{delay:35});await p.waitForTimeout(80);
   const typed=await field.evaluate(e=>e.tagName==='MATH-FIELD'?e.value:e.tagName==='INPUT'?e.value:e.getAttribute('aria-valuetext')||e.textContent);
   assert.ok(typed.includes('12'),`physical typing missing: ${typed}; ${await field.evaluate(e=>JSON.stringify({html:e.outerHTML,focus:document.activeElement?.outerHTML,fields:[...document.querySelectorAll('input.staged-exact-input')].map(n=>({value:n.value,disabled:n.disabled}))}))}`);
   // A deliberate field navigation/physical keystroke may start caret scrolling.
   // Let that finish before measuring the following independent keypad action.
   await p.waitForTimeout(400);
   await press('Clear',{structural:true});
  }
  state.physicalTyping=true;
  const metrics=await p.evaluate(()=>__keypadMetrics());state.final=metrics;
  // All actual buttons must fit, not just the outer keypad rectangle.
  const bounds=await visiblePad.locator('button').evaluateAll(bs=>bs.filter(b=>b.getClientRects().length).map(b=>({text:b.textContent.trim(),left:b.getBoundingClientRect().left,right:b.getBoundingClientRect().right})));
  assert.ok(bounds.every(b=>b.left>=-2&&b.right<=job.width+2),JSON.stringify(bounds.filter(b=>b.left< -2||b.right>job.width+2)));
  if(!job.zoom)assert.ok(metrics.documentWidth<=job.width+1,'horizontal document overflow '+metrics.documentWidth);
  await press('Check');
  const scroll=await p.evaluate(()=>{const max=document.documentElement.scrollHeight-innerHeight;scrollTo({top:Math.max(0,max/3),behavior:'instant'});return{y:scrollY,max};});
  await p.mouse.move(4,Math.min(200,job.height-20));await p.mouse.wheel(0,80);await p.waitForTimeout(300);const afterScroll=await p.evaluate(()=>scrollY);if(scroll.max>160)assert.ok(afterScroll>scroll.y+10,'legitimate user wheel scrolling blocked');state.userScrollingPreserved=true;
  state.passed=true;
 }catch(e){state.passed=false;state.error=e.stack;if(process.env.STABILITY_SCREENSHOT)await p.screenshot({path:process.env.STABILITY_SCREENSHOT,fullPage:true});console.log('FAIL',job.controller,job.route,job.mode,job.width,job.touch?'touch':'mouse',e.message);}
 finally{results.push(state);await p.close();if(results.length%10===0)console.log('Progress',results.length,'cases',results.filter(r=>r.passed).length,'pass');}
}
const jobs=[];for(const t of targets){jobs.push({...t,width:375,height:480,mode:'mathlive'});jobs.push({...t,width:375,height:667,mode:'legacy'});jobs.push({...t,width:390,height:667,mode:'mathlive',touch:true});if(t.wideCoverage)for(const width of [768,1280])jobs.push({...t,width,height:900,mode:'mathlive'});}
const multiplication=targets.find(t=>t.route.includes('/multiplication/'));
for(const width of [320,375,390,768,1280])jobs.push({...multiplication,width,height:667,mode:'mathlive'});
for(const width of [320,390,768,1280])jobs.push({...multiplication,width,height:667,mode:'legacy'});
for(const width of [320,375])jobs.push({...multiplication,width,height:667,mode:'mathlive',touch:true});
for(const t of targets.filter(t=>t.route.includes('/fractions/')||t.controller==='power-rule.mjs'||t.controller==='prep.mjs'))jobs.push({...t,width:375,height:667,mode:'legacy',touch:true});
for(const zoom of [1.25,1.5,2])jobs.push({...multiplication,width:1280,height:900,mode:'mathlive',zoom});
for(const width of [320,375,768])jobs.push({...multiplication,width,height:667,resizeFrom:1280,mode:'mathlive'});
for(const job of jobs)if(job.mode==='legacy'&&job.legacyRoute)job.route=job.legacyRoute;
try{let cursor=0;await Promise.all(Array.from({length:Number(process.env.STABILITY_CONCURRENCY||2)},async()=>{while(cursor<jobs.length){const job=jobs[cursor++];if(process.env.STABILITY_FILTER&&!process.env.STABILITY_FILTER.split(',').some(filter=>job.route.includes(filter))||process.env.STABILITY_MODE&&job.mode!==process.env.STABILITY_MODE||process.env.STABILITY_WIDTH&&job.width!==Number(process.env.STABILITY_WIDTH))continue;for(let repeat=1;repeat<=Number(process.env.STABILITY_REPEATS||1);repeat++)await run({...job,repeat});}}));}
finally{await browser.close();await new Promise(r=>server.close(r));const out=root+'docs/audits/evidence/keypad-stability'+(process.env.REPORT_SUFFIX||(baselineRef?'-baseline':''))+'.json';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({results,errors,baselineRef,realMathJax:true,controllerCount:new Set(results.map(r=>r.controller)).size,routeCount:new Set(results.map(r=>r.route)).size,actions:results.reduce((s,r)=>s+r.actions.length,0),note:'Viewport and document geometry sampled after actual pointer/touch activation. <=2px covers subpixel rounding/empty glyph metrics; structural changes allow only measured local field-height reflow, not unrelated movement. Root CSS zoom 125/150/200% and resizing are emulated Chromium checks.'},null,2)+'\n');}
console.log(results.filter(r=>r.passed).length+'/'+results.length,'stability cases',errors.length,'page errors');if(results.some(r=>!r.passed)||errors.length)process.exitCode=1;
