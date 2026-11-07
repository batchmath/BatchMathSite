// v13.0.E: the "Show 3D Model" button (no "Beta") and the Hide / Show control of the highlighted slice of the Unit 6
// 3D models, in Chromium with the real pages, at 1366x900 (mouse and keyboard) and 390x844 (touch).
// Cases: Volume by Cross Sections (several shapes in both directions, and a calculator question after Part A); Solids
// of Revolution (a disk, a washer, a shell, two axes with both models, and the calculator families with one and two
// axes). For every model:
//  - the button says "Show 3D Model" / "Hide 3D Model" and no text or accessible name of the 3D controls says "Beta";
//  - it opens with the slice shown ("Hide Cross Section", or "Hide Disk" / "Hide Washer" / "Hide Shell" for solids of
//    revolution), every slice object visible and the slice's yellow on the canvas;
//  - after a rotation and a zoom, Hide is immediate: one redraw, the same viewer, canvas and geometry buffers, the same
//    camera and display mode; every slice object (face, rim, slice, marks or radii, labels) is hidden, the yellow is
//    gone from the canvas, the button says "Show ..." and the slice's legend entry is dimmed;
//  - Opaque while hidden: the slice's faint hidden copies stay hidden; Show in Opaque brings back the slice and its
//    copies; Hide again gives back the hidden Opaque picture byte for byte; Transparent keeps it hidden and gives back
//    the hidden Transparent picture byte for byte;
//  - Reset view keeps the slice hidden (and returns to the starting view); Show then gives back, byte for byte, the
//    picture of the model as it first opened;
//  - keyboard (desktop): Enter and Space on the control toggle it and do not go to the next question;
//  - hidden, then the model closed (every GPU geometry and texture released) and opened again: still hidden;
//  - two axes: each model has its own control and state;
//  - the next question removes the models (memory released), and its own model opens with the slice shown;
//  - no console errors, no page wider than the screen.
// Pictures are read from the WebGL canvas itself (the viewer's snapshot hook).
// Usage: node tools/review-lab/unit6/slice3d-browser.mjs   (screenshots in $REVIEW_OUT/unit6/3d-e)
//        BM_PORT=<port>: use a server already running on 127.0.0.1:<port> (an extracted ZIP)
import {serve,browser,context,open,randomPort,outDir} from '../lib/browser.mjs';
const T='ap-calculus/unit-6-applications-integration/topics';
const CS_CASES={desktop:[['square','x','cap'],['semicircle_d','y','disk'],['equilateral','x','triangle'],['iso_hyp','y','under_root'],['rect2','x','pair'],['quarter','y','semicircle']],
 phone:[['square','x','cap'],['semicircle_d','y','disk'],['iso_leg','x','pair']]};
const SOLIDS=[{family:'disk_basic',tier:'foundational',calc:'non-calculator',graph:'shown',kind:'disk'},{family:'washer',tier:'intermediate',calc:'non-calculator',graph:'shown',kind:'washer'},
 {family:'shells',tier:'intermediate',calc:'non-calculator',graph:'shown'},{family:'two_axes',tier:'challenging',calc:'non-calculator',graph:'shown'},
 {family:'solid_calc',tier:'intermediate',calc:'calculator'},{family:'calc_two_axes',tier:'challenging',calc:'calculator'}];
const NAME={disk:'Disk',washer:'Washer',shell:'Shell'};
const shots=outDir('unit6','3d-e'),PORT=process.env.BM_PORT?+process.env.BM_PORT:randomPort(9890),srv=process.env.BM_PORT?{close(){}}:await serve(PORT),b=await browser();
const out={runs:[],models:0,failures:[]};const fail=m=>out.failures.push(m);
let recent=[];
async function force(p,want){
 const id=await p.evaluate(want=>{
  const rng=seed=>{let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}};
  const V=window.BatchMathUnit6Volume,saved=window.BatchMathRNG;let hit=null;const key=d=>d&&(d.shape==='rect'?`rect${d.mult}`:d.shape);
  try{for(let s=1;s<80000&&!hit;s++){window.BatchMathRNG={random:rng(s*7+want.salt)};let q;
   try{q=want.cs?V.makeCS({family:'cs_basic',tier:'foundational',calc:'non-calculator'}):V.makeSolid({family:want.family,tier:want.tier,calc:want.calc});}catch(e){continue;}
   if((want.avoid||[]).includes(q.id))continue;
   if(want.cs){if(q.unit5Meta.region===want.region&&q.unit5Meta.dir===want.dir&&key(q.u6Solid)===want.shape)hit=q;continue;}
   const d=q.u6Revolution,r=d&&d.rotations[0];if(!d||(want.graph&&d.graph!==want.graph)||(want.kind&&r.kind!==want.kind))continue;
   hit=q;}}finally{window.BatchMathRNG=saved;}
  if(!hit)return null;
  const api=window.BatchMathAPTopicGenerators;if(!api.__orig){api.__orig=api.get;api.get=s=>{const g=api.__orig(s);return g&&(o=>{if(window.__force){const f=window.__force;window.__force=null;window.BatchMathUnit5Last=f;return f;}return g(o);});};}
  window.__force=hit;return hit.id;},{...want,avoid:recent});
 if(id){recent.push(id);recent=recent.slice(-6);}return id;
}
async function next(p){const cur=await p.$eval('#u6Mode',e=>e.value),opts=await p.$$eval('#u6Mode option',o=>o.map(x=>x.value));await p.selectOption('#u6Mode',opts.find(v=>v!==cur&&v!=='mixed')||opts.find(v=>v!==cur));await p.waitForTimeout(800);}
const API=cs=>cs?'BatchMathCrossSections3D':'BatchMathSolids3D';
const W=k=>`.u6-3d >> nth=${k}`;
// the state of model k (the k-th 3D control on the page)
const st=(p,k)=>p.evaluate(k=>{const w=document.querySelectorAll('.u6-3d')[k],cv=w?.querySelector('.u6-3d-canvas'),v=cv?.__bm3d;if(!w)return null;
 const aria=[...w.querySelectorAll('[aria-label]')].map(e=>e.getAttribute('aria-label')).join(' | ');
 return{button:w.querySelector('.u6-3d-btn').textContent,aria,beta:/beta/i.test(w.textContent+' '+aria),slice:w.querySelector('.u6-3d-slice')?.textContent,dimmed:!!w.querySelector('.u6-3d-legend .u6-3d-off'),
  open:!w.querySelector('.u6-3d-stage').hidden,viewer:!!v,frames:v?.frames,cam:v?[v.azimuth,v.distance,v.polar]:null,display:v?.display,ids:v?.geometryIds().join(','),sliceVisible:v?.sliceVisible,parts:v?.sliceParts(),
  mark:cv?.__mark||null,problem:window.BatchMathUnit5Last?.id};},k);
const snap=(p,k)=>p.evaluate(k=>document.querySelectorAll('.u6-3d')[k].querySelector('.u6-3d-canvas').__bm3d.snapshot().split(',')[1],k);
async function decode(p,png){return p.evaluate(async png=>{const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);return{w:c.width,h:c.height,data:Array.from(g.getImageData(0,0,c.width,c.height).data)};},png);}
const yellow=im=>{let n=0;for(let i=0;i<im.data.length;i+=4){const [r,g,bb]=[im.data[i],im.data[i+1],im.data[i+2]];if(r>140&&g>120&&bb<110&&r-bb>70)n++;}return n;};
const changed=(a,b)=>{let n=0;for(let i=0;i<a.data.length;i+=4)if(Math.max(Math.abs(a.data[i]-b.data[i]),Math.abs(a.data[i+1]-b.data[i+1]),Math.abs(a.data[i+2]-b.data[i+2]))>8)n++;return n;};
async function press(p,k,sel,how){const loc=p.locator(W(k)).locator(sel);
 if(how==='tap')await loc.tap();else if(how==='enter'||how==='space'){await loc.focus();await p.keyboard.press(how==='enter'?'Enter':'Space');}else await loc.click();await p.waitForTimeout(250);}
async function drag(p,k,mob,cdp){const r=await p.locator(W(k)).locator('.u6-3d-canvas').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
 if(!mob){await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+90,y+25,{steps:10});await p.mouse.up();await p.mouse.wheel(0,-120);}
 else{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+6*i,y:y+2*i,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-20,y,id:1},{x:x+20,y,id:2}]});for(let i=1;i<=4;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-20-i*5,y,id:1},{x:x+20+i*5,y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 await p.waitForTimeout(250);}
async function typePart(p,k){const tex=await p.evaluate(k=>{const q=window.BatchMathUnit5Last.parts[k];return q.control==='u6-expr'?q.answerTex.slice(q.prefix.length):q.answerTex;},k);
 await p.locator(`#choices .unit5-part-${k+1} math-field`).first().evaluate((e,l)=>{e.focus();e.executeCommand(['insert',l]);e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true}));},tex);
 await p.waitForTimeout(120);await p.locator(`#choices .unit5-part-${k+1} .staged-check`).click();await p.waitForTimeout(700);}
const all=(a,v)=>Array.isArray(a)&&a.every(x=>x===v);
async function exercise(p,cs,k,name,tag,run,{mob,cdp,shot}){
 const how=mob?'tap':'click';
 const c0=await st(p,k);run.closed={button:c0.button,aria:c0.aria};
 if(c0.button!=='Show 3D Model'||c0.beta||c0.open)fail(`${tag}: closed control ${JSON.stringify(run.closed)}`);
 await press(p,k,'.u6-3d-btn',how);await p.waitForFunction(k=>!!document.querySelectorAll('.u6-3d')[k]?.querySelector('.u6-3d-canvas')?.__bm3d,k,{timeout:20000}).catch(()=>{});await p.waitForTimeout(300);
 await p.evaluate(k=>{document.querySelectorAll('.u6-3d')[k].querySelector('.u6-3d-canvas').__mark='first';},k);
 const s0=await st(p,k);if(!s0?.viewer){fail(`${tag}: the model did not open`);return;}
 const home=await snap(p,k),yHome=yellow(await decode(p,home));
 run.opened={button:s0.button,slice:s0.slice,visible:s0.sliceVisible,parts:s0.parts,yellow:yHome,display:s0.display};
 if(s0.button!=='Hide 3D Model'||s0.beta)fail(`${tag}: open control ${s0.button} ${s0.aria}`);
 if(s0.slice!==`Hide ${name}`||!s0.sliceVisible||!all(s0.parts.objects,true)||s0.dimmed||!(yHome>0)||s0.display!=='transparent')fail(`${tag}: does not open with the slice shown: ${JSON.stringify(run.opened)}`);
 // after a rotation and a zoom: Hide, immediately, nothing else changes
 await drag(p,k,mob,cdp);const A=await snap(p,k),s1=await st(p,k);
 await press(p,k,'.u6-3d-slice',how);const s2=await st(p,k),B=await snap(p,k);
 const [iA,iB]=[await decode(p,A),await decode(p,B)];
 run.hide={frames:s2.frames-s1.frames,camera:JSON.stringify(s1.cam)===JSON.stringify(s2.cam),sameGeometry:s1.ids===s2.ids,sameCanvas:s2.mark==='first',display:s2.display,button:s2.slice,dimmed:s2.dimmed,parts:s2.parts,yellowBefore:yellow(iA),yellowAfter:yellow(iB),changed:changed(iA,iB)};
 if(run.hide.frames!==1||!run.hide.camera||!run.hide.sameGeometry||!run.hide.sameCanvas||s2.display!=='transparent')fail(`${tag}: Hide rebuilt or moved something: ${JSON.stringify(run.hide)}`);
 if(s2.sliceVisible!==false||!all(s2.parts.objects,false)||s2.slice!==`Show ${name}`||!s2.dimmed)fail(`${tag}: Hide did not hide the slice: ${JSON.stringify(run.hide)}`);
 if(!(run.hide.changed>0)||run.hide.yellowAfter>Math.max(12,run.hide.yellowBefore*0.03))fail(`${tag}: the slice's yellow is still on the canvas: ${JSON.stringify(run.hide)}`);
 if(shot)await p.locator(W(k)).screenshot({path:`${shots}/${shot}-hidden.png`});
 // Opaque while hidden; Show and Hide in Opaque
 await press(p,k,'.u6-3d-mode[data-mode="opaque"]',how);const s3=await st(p,k),C=await snap(p,k),yC=yellow(await decode(p,C));
 await press(p,k,'.u6-3d-slice',how);const s4=await st(p,k),Dp=await snap(p,k),yD=yellow(await decode(p,Dp));
 await press(p,k,'.u6-3d-slice',how);const s5=await st(p,k),E=await snap(p,k);
 run.opaque={hiddenDisplay:s3.display,hiddenParts:s3.parts,yellowHidden:yC,shownParts:s4.parts,yellowShown:yD,hideAgainIdentical:E===C,camera:JSON.stringify(s3.cam)===JSON.stringify(s5.cam)};
 if(s3.display!=='opaque'||s3.sliceVisible!==false||!all(s3.parts.objects,false)||!all(s3.parts.ghosts,false)||!s3.parts.ghosts.length)fail(`${tag}: Opaque while hidden: ${JSON.stringify(run.opaque)}`);
 if(s4.sliceVisible!==true||!all(s4.parts.objects,true)||!all(s4.parts.ghosts,true)||!(yD>yC)||s4.display!=='opaque')fail(`${tag}: Show in Opaque: ${JSON.stringify(run.opaque)}`);
 if(!run.opaque.hideAgainIdentical||!run.opaque.camera||s5.sliceVisible!==false)fail(`${tag}: Hide again in Opaque: ${JSON.stringify(run.opaque)}`);
 // back to Transparent: still hidden, the same picture as before
 await press(p,k,'.u6-3d-mode[data-mode="transparent"]',how);const s6=await st(p,k),F=await snap(p,k);
 run.transparentHidden={display:s6.display,visible:s6.sliceVisible,identical:F===B};
 if(s6.display!=='transparent'||s6.sliceVisible!==false||F!==B)fail(`${tag}: Transparent while hidden: ${JSON.stringify(run.transparentHidden)}`);
 // Reset view keeps it hidden; Show then gives back the first picture
 await press(p,k,'.u6-3d-reset',how);const s7=await st(p,k);await press(p,k,'.u6-3d-slice',how);const s8=await st(p,k),G=await snap(p,k);
 run.reset={hiddenAfterReset:s7.sliceVisible===false,home:JSON.stringify(s7.cam)===JSON.stringify(s0.cam),button:s7.slice,shownIdenticalToFirst:G===home};
 if(!run.reset.hiddenAfterReset||!run.reset.home||s7.slice!==`Show ${name}`||s8.sliceVisible!==true||!run.reset.shownIdenticalToFirst)fail(`${tag}: Reset view ${JSON.stringify(run.reset)}`);
 // keyboard: Enter hides, Space shows; the question stays
 if(!mob){const q0=s8.problem;await press(p,k,'.u6-3d-slice','enter');const k1=await st(p,k);await press(p,k,'.u6-3d-slice','space');const k2=await st(p,k);
  run.keyboard={enter:k1?.sliceVisible,space:k2?.sliceVisible,sameQuestion:k2?.problem===q0};
  if(k1?.sliceVisible!==false||k2?.sliceVisible!==true||!run.keyboard.sameQuestion)fail(`${tag}: keyboard ${JSON.stringify(run.keyboard)}`);}
 // hidden, closed (released) and opened again: still hidden
 await press(p,k,'.u6-3d-slice',how);
 const n0=await p.evaluate(api=>window[api].disposals.length,API(cs));await press(p,k,'.u6-3d-btn',how);
 const rel=await p.evaluate(([api,n0])=>window[api].disposals.slice(n0),[API(cs),n0]);
 await press(p,k,'.u6-3d-btn',how);await p.waitForFunction(k=>!!document.querySelectorAll('.u6-3d')[k]?.querySelector('.u6-3d-canvas')?.__bm3d,k,{timeout:20000}).catch(()=>{});await p.waitForTimeout(250);
 const s9=await st(p,k);run.reopened={released:rel,visible:s9?.sliceVisible,button:s9?.slice,parts:s9?.parts?.objects};
 if(rel.length!==1||rel[0].geometries||rel[0].textures)fail(`${tag}: closing left GPU memory ${JSON.stringify(rel)}`);
 if(!s9||s9.sliceVisible!==false||s9.slice!==`Show ${name}`||!all(s9.parts.objects,false))fail(`${tag}: not kept hidden on reopening: ${JSON.stringify(run.reopened)}`);
 out.models++;
}
// the next question removes the models and releases them
async function nextQuestion(p,cs,tag,run){const before=await p.evaluate(()=>({id:window.BatchMathUnit5Last.id,n:document.querySelectorAll('.u6-3d').length}));
 const n0=await p.evaluate(api=>window[api].disposals.length,API(cs));await next(p);
 const after=await p.evaluate(([id,api,n0])=>({id:window.BatchMathUnit5Last.id,old:document.querySelectorAll(`.u6-3d[data-problem-id="${CSS.escape(id)}"]`).length,canvases:[...document.querySelectorAll('.u6-3d-canvas')].length,released:window[api].disposals.slice(n0)}),[before.id,API(cs),n0]);
 run.next={from:before.id,to:after.id,old:after.old,canvases:after.canvases,released:after.released};
 if(after.id===before.id||after.old||after.canvases||after.released.some(r=>r.geometries||r.textures))fail(`${tag}: the next question did not clear the models: ${JSON.stringify(run.next)}`);}
for(const [vi,[w,h,mob]] of [[1366,900,false],[390,844,true]].entries()){
 const vp=`${w}x${h}`;
 // ---- Volume by Cross Sections, Non-Calculator ----
 {recent=[];const c=await context(b,{width:w,height:h,mobile:mob}),p=await open(c,`http://127.0.0.1:${PORT}/${T}/volume-by-cross-sections/non-calculator-practice/?bm_seed=slice-${w}`),cdp=mob?await c.newCDPSession(p):null;
  await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});let salt=5000+vi*300;
  for(const [shape,dir,region] of CS_CASES[mob?'phone':'desktop']){const tag=`${vp} cross sections ${shape} ${dir}`,run={viewport:vp,engine:'cross sections',shape,dir,region};out.runs.push(run);
   const id=await force(p,{cs:true,shape,dir,region,salt:++salt});if(!id){fail(`${tag}: not generated`);continue;}await next(p);
   if(await p.evaluate(()=>window.BatchMathUnit5Last.id)!==id){fail(`${tag}: not shown`);continue;}
   try{await exercise(p,true,0,'Cross Section',tag,run,{mob,cdp,shot:`cs-${shape}-${dir}-${w}`});}catch(e){fail(`${tag}: ${String(e.message).split('\n')[0]}`);}}
  {const run={viewport:vp,engine:'cross sections',check:'next question'};out.runs.push(run);await nextQuestion(p,true,`${vp} cross sections`,run);
   const s=await st(p,0);run.newModel=s&&{button:s.button,open:s.open};if(s&&(s.open||s.button!=='Show 3D Model'))fail(`${vp} cross sections: the next question's control ${JSON.stringify(run.newModel)}`);}
  const lay=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);if(lay>0)fail(`${vp} cross sections: page wider than the screen`);
  out[`errors ${vp} cs`]=p._errs.length;for(const e of p._errs)fail(`${vp} cs: ${e}`);await c.close();}
 // ---- Volume by Cross Sections, Calculator: the model appears after Part A ----
 {const c=await context(b,{width:w,height:h,mobile:mob}),p=await open(c,`http://127.0.0.1:${PORT}/${T}/volume-by-cross-sections/calculator-practice/?bm_seed=slice-calc-${w}`),cdp=mob?await c.newCDPSession(p):null;
  await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});const tag=`${vp} cross sections calculator`,run={viewport:vp,engine:'cross sections',calc:true};out.runs.push(run);
  run.problem=await p.evaluate(()=>window.BatchMathUnit5Last.id);run.beforePartA=await p.$$eval('.u6-3d',e=>e.length);if(run.beforePartA)fail(`${tag}: a model before Part A`);
  await typePart(p,0);
  try{await exercise(p,true,0,'Cross Section',tag,run,{mob,cdp,shot:`cs-calc-${w}`});}catch(e){fail(`${tag}: ${String(e.message).split('\n')[0]}`);}
  out[`errors ${vp} cs calc`]=p._errs.length;for(const e of p._errs)fail(`${tag}: ${e}`);await c.close();}
 // ---- Solids of Revolution ----
 for(const page of ['non-calculator-practice','calculator-practice']){
  recent=[];const c=await context(b,{width:w,height:h,mobile:mob}),p=await open(c,`http://127.0.0.1:${PORT}/${T}/solids-of-revolution/${page}/?bm_seed=slice-${w}`),cdp=mob?await c.newCDPSession(p):null;
  await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});let salt=6000+vi*300;
  for(const want of SOLIDS.filter(s=>(s.calc==='calculator')===(page==='calculator-practice'))){const tag=`${vp} solids ${want.family}`,run={viewport:vp,engine:'solids',...want};out.runs.push(run);
   const id=await force(p,{...want,salt:++salt});if(!id){fail(`${tag}: not generated`);continue;}await next(p);
   if(await p.evaluate(()=>window.BatchMathUnit5Last.id)!==id){fail(`${tag}: not shown`);continue;}
   const rots=await p.evaluate(()=>window.BatchMathUnit5Last.u6Revolution.rotations.map(r=>({kind:r.kind,axis:r.axisTex,ask:r.ask,reveal:r.reveal})));run.rotations=rots.map(r=>`${r.axis} ${r.kind}`).join(', ');
   try{
    // the first model: under the graph, or once Part A is checked
    if(!(await p.$('.u6-3d-btn')))await typePart(p,0);
    await exercise(p,false,0,NAME[rots[0].kind],`${tag} model 1`,run,{mob,cdp,shot:`sol-${want.family}-1-${w}`});
    if(rots.length>1){
     // the second model, with its own state: answer Part A, go on to Part B (and check it on the calculator page)
     const r1={viewport:vp,engine:'solids',family:want.family,model:2};out.runs.push(r1);
     const answered=j=>p.evaluate(j=>!!document.querySelector(`#choices .unit5-part-${j+1} .staged-feedback .result`),j),nParts=await p.evaluate(()=>window.BatchMathUnit5Last.parts.length);
     for(let j=0;j<nParts&&(await p.$$('.u6-3d')).length<2;j++){if(!(await answered(j)))await typePart(p,j);
      if((await p.$$('.u6-3d')).length<2){const cont=await p.$(`#choices .unit5-part-${j+1} .staged-continue`);if(cont){await cont.click();await p.waitForTimeout(500);}}}
     const n=(await p.$$('.u6-3d')).length;r1.models=n;if(n<2){fail(`${tag}: the second model did not appear`);}
     else{const m1=await st(p,0);r1.firstStillHidden=m1.sliceVisible===false&&m1.slice===`Show ${NAME[rots[0].kind]}`;if(!r1.firstStillHidden)fail(`${tag}: model 1 lost its state: ${JSON.stringify(m1.slice)}`);
      await exercise(p,false,1,NAME[rots[1].kind],`${tag} model 2`,r1,{mob,cdp,shot:`sol-${want.family}-2-${w}`});
      const m1b=await st(p,0);if(m1b.sliceVisible!==false)fail(`${tag}: model 2's control changed model 1`);}}
   }catch(e){fail(`${tag}: ${String(e.message).split('\n')[0]}`);}
   const run2={viewport:vp,engine:'solids',family:want.family,check:'next question'};out.runs.push(run2);await nextQuestion(p,false,`${tag}`,run2);}
  const lay=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);if(lay>0)fail(`${vp} ${page}: page wider than the screen`);
  out[`errors ${vp} ${page}`]=p._errs.length;for(const e of p._errs)fail(`${vp} ${page}: ${e}`);await c.close();}
}
await b.close();srv.close();
console.log(JSON.stringify(out,null,1));
if(out.failures.length)process.exitCode=1;
