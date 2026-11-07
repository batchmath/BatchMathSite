// v13.0.A experimental 3D cross sections, in Chromium with the real page (Volume by Cross Sections, Non-Calculator
// Practice), at 1366x900 (mouse) and 390x844 (touch). For each region the generator uses with square cross sections
// perpendicular to the x-axis, the page's own generator is made to serve such a problem, and:
//  - the toggle appears closed under the question ("Show 3D Model (Beta)"), three.js is not loaded before it is opened,
//    the 2D "Show Graph" control is still there and opens its graph;
//  - opened: the button reads "Hide 3D Model", one canvas is drawn (non-background and highlight-yellow pixels), and the
//    geometry READ BACK FROM THE DRAWN BUFFERS matches the problem: the highlighted square stands at the 2D slice's x,
//    spans y from bot(x) to top(x) and z from 0 to s(x) = top(x) - bot(x) (the same length both ways); the solid spans
//    [a, b], the curves' lowest and highest y, and reaches the largest s;
//  - rotation (mouse drag / one finger), zoom (wheel / two-finger pinch) and Reset view work; nothing is redrawn while
//    idle; hiding releases the model; opening twice quickly still gives one canvas;
//  - the answer typed into the MathLive field with the model open is graded correct;
//  - a new question removes the old model (no stale geometry) and offers a closed toggle only if it is supported;
//    unsupported problems (other shapes, slices perpendicular to the y-axis) and the calculator page show no toggle;
//  - no page wider than the screen, no console errors.
// Usage: node tools/review-lab/unit6/cs3d-browser.mjs   (writes screenshots to $REVIEW_OUT/unit6/3d)
//        BM_PORT=<port>: use a server already running on 127.0.0.1:<port> (python3 -m http.server serving an extracted ZIP)
import {serve,browser,context,open,randomPort,outDir} from '../lib/browser.mjs';
const PAGE='ap-calculus/unit-6-applications-integration/topics/volume-by-cross-sections/non-calculator-practice';
const CALC='ap-calculus/unit-6-applications-integration/topics/volume-by-cross-sections/calculator-practice';
const REGIONS=[['cap','cs_basic','foundational'],['half_cap','cs_basic','foundational'],['semicircle','cs_basic','foundational'],['disk','cs_basic','foundational'],['triangle','cs_basic','intermediate'],
 ['pair','cs_basic','foundational'],['under_root','cs_basic','foundational'],['under_power','cs_basic','foundational'],['left_of_power','cs_basic','foundational'],['exp_base','cs_setup','intermediate'],['root_line_axis','cs_setup','challenging']];
const shots=outDir('unit6','3d'),PORT=process.env.BM_PORT?+process.env.BM_PORT:randomPort(9820),srv=process.env.BM_PORT?{close(){}}:await serve(PORT),b=await browser(),out={runs:[],failures:[]};
const fail=m=>out.failures.push(m);
// make the page's generator serve the next problem matching `want` (generated in the page by its own engine)
// (never one of the last six problems shown on this page: the driver skips a problem it showed that recently)
let recent=[];
async function force(p,want){
 const id=await p.evaluate(want=>{
  const rng=seed=>{let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}};
  const V=window.BatchMathUnit6Volume,saved=window.BatchMathRNG;let hit=null;
  try{for(let s=1;s<60000&&!hit;s++){window.BatchMathRNG={random:rng(s*7+want.salt)};const q=V.makeCS({family:want.family,tier:want.tier,calc:'non-calculator'});
   if(q.unit5Meta.region===want.region&&q.unit5Meta.dir===want.dir&&q.u6Solid?.shape===want.shape&&!(want.avoid||[]).includes(q.id))hit=q;}}finally{window.BatchMathRNG=saved;}
  if(!hit)return null;
  const api=window.BatchMathAPTopicGenerators;if(!api.__orig){api.__orig=api.get;api.get=s=>{const g=api.__orig(s);return g&&(o=>{if(window.__force){const f=window.__force;window.__force=null;window.BatchMathUnit5Last=f;return f;}return g(o);});};}
  window.__force=hit;return hit.id;},{...want,avoid:recent});
 if(id){recent.push(id);recent=recent.slice(-6);}return id;
}
// the next question: switching the Practice Type generates one (the forced problem, when one is waiting)
async function next(p){const cur=await p.$eval('#u6Mode',e=>e.value);await p.selectOption('#u6Mode',cur==='perp_x'?'perp_y':'perp_x');await p.waitForTimeout(700);}
// show a forced problem: switch the Practice Type away (that generates a question of its own), force, switch back
async function show(p,want,mode){if(await p.$eval('#u6Mode',e=>e.value)===mode){await p.selectOption('#u6Mode',mode==='perp_x'?'perp_y':'perp_x');await p.waitForTimeout(500);}const id=await force(p,want);await p.selectOption('#u6Mode',mode);await p.waitForTimeout(700);return id;}
// expected values from the problem's own data, sampled densely, and the drawn geometry
async function geometry(p){
 return p.evaluate(()=>{const st=window.BatchMathCrossSections3D.state,d=window.BatchMathUnit5Last.u6Solid,v=st?.viewer;if(!v)return null;const dr=v.drawn();
  const piece=x=>d.pieces.find(q=>x>=q.a-1e-9&&x<=q.b+1e-9);let ymin=Infinity,ymax=-Infinity,smax=0;
  for(const q of d.pieces)for(let i=0;i<=2000;i++){const x=q.a+(q.b-q.a)*i/2000,t=q.top(x),bo=q.bot(x);ymin=Math.min(ymin,bo);ymax=Math.max(ymax,t);smax=Math.max(smax,t-bo);}
  const x=d.slice,P=piece(x);return{id:st.problemId,shownId:window.BatchMathUnit5Last.id,expect:{x,bot:P.bot(x),top:P.top(x),s:P.top(x)-P.bot(x),a:d.pieces[0].a,b:d.pieces[d.pieces.length-1].b,ymin,ymax,smax},drawn:dr,info:{highlight:v.highlight,frames:v.frames}};});
}
async function pixels(p){
 const png=(await p.locator('.u6-3d-canvas').screenshot()).toString('base64');
 return p.evaluate(async png=>{const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);
  const d=g.getImageData(0,0,c.width,c.height).data;let lit=0,yellow=0;for(let i=0;i<d.length;i+=4){const [r,gg,bb]=[d[i],d[i+1],d[i+2]];if(r+gg+bb>60)lit++;if(r>170&&gg>140&&bb<110&&r-bb>90)yellow++;}return{w:c.width,h:c.height,lit,yellow};},png);
}
const near=(a,b,t=2e-5)=>Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)); // GPU buffers are 32-bit floats
async function drag(p,cdp,touch,dx){const r=await p.locator('.u6-3d-canvas').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
 if(!touch){await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx,y+dx/4,{steps:12});await p.mouse.up();return;}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
 for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/12,y:y+dx*i/48,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function zoom(p,cdp,touch){const r=await p.locator('.u6-3d-canvas').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
 if(!touch){await p.mouse.move(x,y);for(let i=0;i<5;i++){await p.mouse.wheel(0,-120);await p.waitForTimeout(40);}return;}
 // two fingers moving apart: pinch out (zoom in)
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-20,y,id:1},{x:x+20,y,id:2}]});
 for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-20-i*6,y,id:1},{x:x+20+i*6,y,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
for(const [w,h,mob] of [[1366,900,false],[390,844,true]]){
 recent=[];
 const vp=`${w}x${h}`,c=await context(b,{width:w,height:h,mobile:mob}),p=await open(c,`http://127.0.0.1:${PORT}/${PAGE}/?bm_seed=cs3d-${w}`),cdp=mob?await c.newCDPSession(p):null;
 const threeReq=[];p.on('request',r=>{if(/vendor\/three|unit6-3d\/viewer/.test(r.url()))threeReq.push(r.url());});
 await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});
 let salt=0;
 for(const [region,family,tier] of REGIONS){
  const run={viewport:vp,region};out.runs.push(run);
  const id=await show(p,{region,family,tier,dir:'x',shape:'square',salt:++salt},'perp_x');if(!id){fail(`${vp} ${region}: not generated`);continue;}
  const shown=await p.evaluate(()=>window.BatchMathUnit5Last.id);if(shown!==id){fail(`${vp} ${region}: the forced problem was not shown`);continue;}
  const before=await p.evaluate(()=>({btn:document.querySelectorAll('.u6-3d-btn').length,text:document.querySelector('.u6-3d-btn')?.textContent,hidden:document.querySelector('.u6-3d-stage')?.hidden,canvas:document.querySelectorAll('.u6-3d-canvas').length,graph:!!document.querySelector('#question .u6-graph-toggle'),afterGraph:document.querySelector('#question .u6-graph-toggle')?.nextElementSibling?.classList.contains('u6-3d')}));
  run.toggle=before;
  if(before.btn!==1||before.text!=='Show 3D Model (Beta)'||!before.hidden||before.canvas)fail(`${vp} ${region}: toggle not present and closed: ${JSON.stringify(before)}`);
  if(!before.graph||!before.afterGraph)fail(`${vp} ${region}: the 2D Show Graph control is missing or the 3D toggle is not beside it`);
  if(region==='cap'&&threeReq.length)fail(`${vp}: three.js was loaded before the model was opened`);
  // the 2D graph still opens
  await p.click('#question .u6-graph-toggle>summary');await p.waitForTimeout(150);
  run.graph2d=await p.evaluate(()=>{const d=document.querySelector('#question .u6-graph-toggle');return d.open&&!!d.querySelector('svg.u6-svg .u6-shade');});
  if(!run.graph2d)fail(`${vp} ${region}: the 2D graph does not open`);
  await p.click('#question .u6-graph-toggle>summary');
  // open the model
  await p.click('.u6-3d-btn');
  await p.waitForFunction(()=>window.BatchMathCrossSections3D.state?.viewer,null,{timeout:20000}).catch(()=>{});
  const g=await geometry(p);if(!g){fail(`${vp} ${region}: the model did not open: ${await p.textContent('.u6-3d-view')}`);continue;}
  run.button=await p.textContent('.u6-3d-btn');if(run.button!=='Hide 3D Model')fail(`${vp} ${region}: button reads "${run.button}"`);
  if(g.id!==id||g.shownId!==id)fail(`${vp} ${region}: the model is for another problem`);
  const [c0,c1,c2,c3]=g.drawn.highlight,E=g.expect;
  const okSlice=[c0,c1,c2,c3].every(q=>near(q[0],E.x))&&near(c0[1],E.bot)&&near(c1[1],E.top)&&near(c2[1],E.top)&&near(c3[1],E.bot)&&near(c0[2],0)&&near(c1[2],0)&&near(c2[2],E.s)&&near(c3[2],E.s)&&near(c1[1]-c0[1],c2[2]-c1[2]);
  if(!okSlice)fail(`${vp} ${region}: the drawn highlighted square is not ${E.s} by ${E.s} at x = ${E.x}: ${JSON.stringify(g.drawn.highlight)}`);
  const S=g.drawn.solid,okSolid=near(S.xmin,E.a)&&near(S.xmax,E.b)&&near(S.ymin,E.ymin,1e-4)&&near(S.ymax,E.ymax,1e-4)&&Math.abs(S.zmax-E.smax)<=2e-3*Math.max(1,E.smax);
  if(!okSolid)fail(`${vp} ${region}: the drawn solid spans ${JSON.stringify(S)}, expected x ${E.a}..${E.b}, y ${E.ymin}..${E.ymax}, z up to ${E.smax}`);
  run.slice={x:+E.x.toFixed(4),s:+E.s.toFixed(4),drawnSide:+(c1[1]-c0[1]).toFixed(4),drawnHeight:+(c2[2]-c1[2]).toFixed(4)};run.solid={xRange:[E.a,E.b],zmax:+S.zmax.toFixed(4),expectedSmax:+E.smax.toFixed(4),vertices:S.vertices};
  run.labels=g.drawn.labels;if(!['x','y','z','s'].every(l=>g.drawn.labels.includes(l)))fail(`${vp} ${region}: labels ${g.drawn.labels}`);
  // (the highlighted square can be small: y = x^3 at x = 0.42 has s = 0.07)
  const px=await pixels(p);run.pixels=px;if(px.lit<px.w*px.h*0.02||px.yellow<40)fail(`${vp} ${region}: the canvas looks empty (${JSON.stringify(px)})`);
  if(region==='cap'||region==='root_line_axis'||region==='disk')await p.locator('.u6-3d').screenshot({path:`${shots}/${region}-${w}.png`});
  // rotate, zoom, idle, reset
  const v0=await p.evaluate(()=>{const v=window.BatchMathCrossSections3D.state.viewer;return{az:v.azimuth,d:v.distance,f:v.frames};});
  await drag(p,cdp,mob,140);await p.waitForTimeout(200);
  const v1=await p.evaluate(()=>{const v=window.BatchMathCrossSections3D.state.viewer;return{az:v.azimuth,d:v.distance,f:v.frames};});
  await zoom(p,cdp,mob);await p.waitForTimeout(250);
  const v2=await p.evaluate(()=>{const v=window.BatchMathCrossSections3D.state.viewer;return{az:v.azimuth,d:v.distance,f:v.frames};});
  await p.waitForTimeout(1200);const idle=await p.evaluate(()=>window.BatchMathCrossSections3D.state.viewer.frames);
  await p.click('.u6-3d-reset');await p.waitForTimeout(150);
  const v3=await p.evaluate(()=>{const v=window.BatchMathCrossSections3D.state.viewer;return{az:v.azimuth,d:v.distance};});
  run.controls={rotated:+(v1.az-v0.az).toFixed(3),zoomed:+(v2.d/v1.d).toFixed(3),idleFrames:idle-v2.f,reset:near(v3.az,v0.az,1e-6)&&near(v3.d,v0.d,1e-6)};
  if(Math.abs(v1.az-v0.az)<0.05)fail(`${vp} ${region}: ${mob?'one-finger':'mouse'} drag did not rotate`);
  if(!(v2.d<v1.d*0.95))fail(`${vp} ${region}: ${mob?'pinch':'wheel'} did not zoom in`);
  if(idle!==v2.f)fail(`${vp} ${region}: redrawn while idle (${idle-v2.f} frames)`);
  if(!run.controls.reset)fail(`${vp} ${region}: Reset view did not restore the view`);
  // hide, then open twice quickly: one canvas
  await p.click('.u6-3d-btn');await p.waitForTimeout(150);
  const hid=await p.evaluate(()=>({st:window.BatchMathCrossSections3D.state,canvas:document.querySelectorAll('.u6-3d-canvas').length,text:document.querySelector('.u6-3d-btn').textContent}));
  if(hid.st.open||hid.st.viewer||hid.canvas||hid.text!=='Show 3D Model (Beta)')fail(`${vp} ${region}: hiding did not release the model: ${JSON.stringify(hid)}`);
  await p.click('.u6-3d-btn');await p.click('.u6-3d-btn');await p.click('.u6-3d-btn');await p.waitForTimeout(1200);
  const twice=await p.evaluate(()=>({canvas:document.querySelectorAll('.u6-3d-canvas').length,open:window.BatchMathCrossSections3D.state.open}));
  if(twice.canvas!==(twice.open?1:0))fail(`${vp} ${region}: after quick toggling, ${twice.canvas} canvases (open: ${twice.open})`);
  if(!twice.open){await p.click('.u6-3d-btn');await p.waitForFunction(()=>window.BatchMathCrossSections3D.state?.viewer,null,{timeout:20000}).catch(()=>{});}
  // the answer, typed with the model open (single-part problems)
  const parts=await p.evaluate(()=>window.BatchMathUnit5Last.parts.map(q=>({control:q.control,tex:q.answerTex})));
  if(parts.length===1&&parts[0].control==='input'){
   const scope='#choices .unit5-part-1';await p.locator(`${scope} math-field`).first().evaluate((e,l)=>{e.focus();e.executeCommand(['insert',l]);e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true}));},parts[0].tex);
   await p.waitForTimeout(120);await p.locator(`${scope} .staged-check`).click();await p.waitForTimeout(500);
   run.answer=await p.evaluate(s=>document.querySelector(`${s} .staged-feedback .result`)?.textContent.trim()||document.querySelector(`${s} .staged-input-message`)?.textContent.trim()||'(none)',scope);
   if(!/is correct\.|^Correct\./.test(run.answer))fail(`${vp} ${region}: the typed answer ${parts[0].tex} was not graded correct: ${run.answer}`);
   if(!(await p.evaluate(()=>!!window.BatchMathCrossSections3D.state?.viewer)))fail(`${vp} ${region}: the model closed when the answer was checked`);}
  const lay=await p.evaluate(()=>({over:document.documentElement.scrollWidth-window.innerWidth,stage:(()=>{const s=document.querySelector('.u6-3d-stage').getBoundingClientRect(),q=document.querySelector('#question').getBoundingClientRect();return s.left>=q.left-1&&s.right<=q.right+1;})()}));
  run.layout=lay;if(lay.over>0||!lay.stage)fail(`${vp} ${region}: layout ${JSON.stringify(lay)}`);
 }
 // stale geometry: with a model open, the next question replaces it (a supported one: closed toggle for the new problem)
 {const prev=await p.evaluate(()=>window.BatchMathCrossSections3D.state?.problemId);const open0=await p.evaluate(()=>!!window.BatchMathCrossSections3D.state?.viewer);
  // (the model of the last region is open here) the next question comes straight from the generator: force it, then Next
  const id=await force(p,{region:'triangle',family:'cs_basic',tier:'foundational',dir:'x',shape:'square',salt:901});
  await next(p);
  out.staleFromOpenModel=open0;
  const st=await p.evaluate(()=>({st:window.BatchMathCrossSections3D.state,canvas:document.querySelectorAll('.u6-3d-canvas').length,wraps:document.querySelectorAll('.u6-3d').length}));
  out.stale={from:prev,to:id,...st};
  if(st.st?.problemId!==id||st.st.open||st.st.viewer||st.canvas||st.wraps!==1)fail(`${vp}: stale model after a new question: ${JSON.stringify(st)}`);}
 // unsupported problems: no toggle at all
 let round=0;
 for(const want of [{region:'cap',family:'cs_basic',tier:'foundational',dir:'x',shape:'semicircle_d'},{region:'triangle',family:'cs_basic',tier:'foundational',dir:'x',shape:'quarter'},{region:'cap',family:'cs_basic',tier:'foundational',dir:'y',shape:'square'},{region:'exp_base',family:'cs_setup',tier:'intermediate',dir:'x',shape:'equilateral'}]){
  // open a supported model first, so a stale model would show
  // (a different problem each round: the driver skips a problem it showed recently)
  round++;const sid=await show(p,{region:'cap',family:'cs_basic',tier:'foundational',dir:'x',shape:'square',salt:950+round*13},'perp_x');
  const shownS=await p.evaluate(()=>({id:window.BatchMathUnit5Last.id,mode:document.querySelector('#u6Mode').value}));
  if(shownS.id!==sid){fail(`${vp}: the supported problem before the unsupported check was not shown (${JSON.stringify({sid,...shownS})})`);continue;}
  await p.click('.u6-3d-btn',{timeout:8000});await p.waitForFunction(()=>window.BatchMathCrossSections3D.state?.viewer,null,{timeout:20000}).catch(()=>{});
  // the next question is the unsupported one
  const uid=await force(p,{...want,salt:977+round*17});if(!uid){fail(`${vp}: unsupported ${JSON.stringify(want)} not generated`);continue;}
  await next(p);
  const st=await p.evaluate(()=>({id:window.BatchMathUnit5Last.id,wraps:document.querySelectorAll('.u6-3d').length,canvas:document.querySelectorAll('.u6-3d-canvas').length,state:window.BatchMathCrossSections3D.state,graph:!!document.querySelector('#question .u6-graph-toggle')}));
  (out.unsupported=out.unsupported||[]).push({viewport:vp,...want,...st,state:!!st.state});
  if(st.id!==uid||st.wraps||st.canvas||st.state||!st.graph)fail(`${vp}: unsupported ${want.shape} ${want.dir} shows 3D (${JSON.stringify(st)})`);}
 out.errors=(out.errors||0)+p._errs.length;for(const e of p._errs)fail(`${vp}: ${e}`);
 await c.close();
}
// the calculator page: no 3D module, no toggle, normal questions
{const c=await context(b,{width:1366,height:900}),p=await open(c,`http://127.0.0.1:${PORT}/${CALC}/?bm_seed=cs3d-calc`);await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});
 const st=await p.evaluate(()=>({module:!!window.BatchMathCrossSections3D,wraps:document.querySelectorAll('.u6-3d').length,question:!!document.querySelector('#question .u5-question')}));
 out.calculatorPage=st;if(st.module||st.wraps||!st.question)fail(`calculator page: ${JSON.stringify(st)}`);for(const e of p._errs)fail(`calculator page: ${e}`);await c.close();}
await b.close();srv.close();
console.log(JSON.stringify(out,null,1));
if(out.failures.length)process.exitCode=1;
