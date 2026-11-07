// v13.0.B experimental 3D cross sections, in Chromium with the real pages (Volume by Cross Sections, Non-Calculator
// Practice and Calculator Practice), at 1366x900 (mouse) and 390x844 (touch).
// Non-calculator page: every shape (square, rectangles 2s and 3s, semicircle on its diameter, quarter circle on its
// radius, equilateral triangle, isosceles right triangle on a leg or on its hypotenuse) x both directions, the regions
// rotated so that every region family of each direction appears; the page's own generator is made to serve the problem:
//  - the toggle appears closed right after the 2D "Show Graph" control, which still opens its graph; three.js is not
//    loaded before a model is opened;
//  - opened: "Hide 3D Model", one canvas with drawn pixels (and highlight yellow), and the geometry READ BACK FROM THE
//    DRAWN BUFFERS matches the problem, checked with independent formulas: the highlighted section lies in the plane of
//    the 2D slice (x = c, or y = c for slices perpendicular to the y-axis), stands on the whole slice from lo(c) to hi(c),
//    has the shape's height (s, 2s, 3s, s/2 for the semicircle and the hypotenuse triangle, sqrt(3)/2 s), arc points on
//    the right circle (semicircle: distance s/2 from the slice's midpoint; quarter: distance s from its lo end), and the
//    drawn area k s^2 (times the arc polygon's chord factor); the solid spans the region and the shape's largest height;
//    curved faces are smooth-shaded, flat faces flat-shaded; the labels are the shape's; the legend names the shape;
//  - rotation (mouse drag / one finger), zoom (wheel / pinch), Reset view; no redraws while idle; hiding releases every
//    GPU geometry and texture; quick repeated toggling leaves at most one canvas; a typed answer is graded correct with
//    the model open; no page wider than the screen, the model inside the question box.
// Calculator page (the region is shown only in Part A's explanation, after Part A is checked):
//  - before Part A is checked there is no toggle, no model, no 3D request and no region figure in the page;
//  - after it is checked (right or wrong) one closed toggle sits right after that figure; the model matches the problem
//    as above; it stays when Part B is opened and goes with the next question.
// Also: switching question with a model open (shape and direction change, no stale geometry), resizing with a model open,
// 12 open/close cycles (all GPU memory released each time), and a browser without WebGL (a clear message, the 2D graph
// still works, no console error). No console errors anywhere.
// Usage: node tools/review-lab/unit6/cs3d-browser.mjs   (writes screenshots to $REVIEW_OUT/unit6/3d-b)
//        BM_PORT=<port>: use a server already running on 127.0.0.1:<port> (python3 -m http.server serving an extracted ZIP)
import {serve,browser,context,open,randomPort,outDir} from '../lib/browser.mjs';
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const {chromium}=require('playwright');
const NONCALC='ap-calculus/unit-6-applications-integration/topics/volume-by-cross-sections/non-calculator-practice';
const CALC='ap-calculus/unit-6-applications-integration/topics/volume-by-cross-sections/calculator-practice';
const SHAPES=['square','rect2','rect3','semicircle_d','quarter','equilateral','iso_leg','iso_hyp'];
const REGIONS={x:[['cap','cs_basic','foundational'],['half_cap','cs_basic','intermediate'],['semicircle','cs_basic','foundational'],['disk','cs_basic','foundational'],['triangle','cs_basic','intermediate'],['pair','cs_basic','foundational'],
  ['under_root','cs_basic','foundational'],['under_power','cs_basic','foundational'],['left_of_power','cs_basic','foundational'],['exp_base','cs_setup','intermediate'],['root_line_axis','cs_setup','challenging']],
 y:[['cap','cs_basic','foundational'],['half_cap','cs_basic','foundational'],['semicircle','cs_basic','intermediate'],['disk','cs_basic','foundational'],['triangle','cs_basic','foundational'],['pair','cs_basic','intermediate'],
  ['under_root','cs_basic','foundational'],['under_power','cs_basic','foundational'],['left_of_power','cs_basic','foundational'],['exp_base','cs_setup','intermediate'],['wedge','cs_setup','challenging']]};
const CALC_CASES=[['log_line','x','rect2','intermediate',true],['log_line','y','iso_leg','challenging',true],['log_parabola','x','semicircle_d','challenging',true],['cos_parabola','x','quarter','intermediate',false],
 ['exp_axes','y','equilateral','intermediate',true],['exp_axes','x','iso_hyp','challenging',true],['log_line','x','square','challenging',true],['exp_axes','y','rect3','intermediate',false],
 ['log_line','y','square','intermediate',true],['cos_parabola','x','semicircle_d','challenging',true]];
const LABELS={square:['s','s'],rect2:['s','2s'],rect3:['s','3s'],semicircle_d:['d = s','r = s/2'],quarter:['r = s','s'],equilateral:['s','s','s'],iso_leg:['s','s'],iso_hyp:['s']};
const shots=outDir('unit6','3d-b'),PORT=process.env.BM_PORT?+process.env.BM_PORT:randomPort(9820),srv=process.env.BM_PORT?{close(){}}:await serve(PORT),b=await browser();
const out={nonCalculator:[],calculator:[],failures:[]};
const fail=m=>out.failures.push(m);
let recent=[];
// make the page's generator serve the next problem matching `want` (generated in the page by its own engine; never one
// of the last six problems shown on the page, which the driver would skip)
async function force(p,want){
 const id=await p.evaluate(want=>{
  const rng=seed=>{let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}};
  const V=window.BatchMathUnit6Volume,saved=window.BatchMathRNG;let hit=null;
  const key=d=>d&&(d.shape==='rect'?`rect${d.mult}`:d.shape);
  try{for(let s=1;s<80000&&!hit;s++){window.BatchMathRNG={random:rng(s*7+want.salt)};let q;try{q=V.makeCS({family:want.family,tier:want.tier,calc:want.calc});}catch(e){continue;}
   if(q.unit5Meta.region===want.region&&q.unit5Meta.dir===want.dir&&key(q.u6Solid)===want.shape&&!(want.avoid||[]).includes(q.id))hit=q;}}finally{window.BatchMathRNG=saved;}
  if(!hit)return null;
  const api=window.BatchMathAPTopicGenerators;if(!api.__orig){api.__orig=api.get;api.get=s=>{const g=api.__orig(s);return g&&(o=>{if(window.__force){const f=window.__force;window.__force=null;window.BatchMathUnit5Last=f;return f;}return g(o);});};}
  window.__force=hit;return hit.id;},{calc:'non-calculator',...want,avoid:recent});
 if(id){recent.push(id);recent=recent.slice(-6);}return id;
}
// the next question: switching the Practice Type generates one (the forced problem, when one is waiting)
async function next(p){const cur=await p.$eval('#u6Mode',e=>e.value);await p.selectOption('#u6Mode',cur==='perp_x'?'perp_y':'perp_x');await p.waitForTimeout(700);}
async function show(p,want){const mode=want.dir==='x'?'perp_x':'perp_y';if(await p.$eval('#u6Mode',e=>e.value)===mode){await p.selectOption('#u6Mode',mode==='perp_x'?'perp_y':'perp_x');await p.waitForTimeout(500);}
 const id=await force(p,want);await p.selectOption('#u6Mode',mode);await p.waitForTimeout(700);return id;}
// the drawn model against the problem's own data, with formulas independent of the geometry module
async function geometry(p){
 return p.evaluate(()=>{const st=window.BatchMathCrossSections3D.state,P=window.BatchMathUnit5Last,d=P.u6Solid,v=st?.viewer;if(!v)return null;const dr=v.drawn();
  const key=d.shape==='rect'?`rect${d.mult}`:d.shape,R3=Math.sqrt(3);
  const HEIGHT={square:1,rect2:2,rect3:3,semicircle_d:.5,quarter:1,equilateral:R3/2,iso_leg:1,iso_hyp:.5},K={square:1,rect2:2,rect3:3,semicircle_d:Math.PI/8,quarter:Math.PI/4,equilateral:R3/4,iso_leg:.5,iso_hyp:.25};
  const CH={semicircle_d:64*Math.sin(Math.PI/64)/Math.PI,quarter:64*Math.sin(Math.PI/64)/Math.PI}[key]||1;
  const piece=t=>d.pieces.find(q=>t>=q.a-1e-9&&t<=q.b+1e-9);let lmin=Infinity,hmax=-Infinity,smax=0;
  for(const q of d.pieces)for(let i=0;i<=3000;i++){const t=q.a+(q.b-q.a)*i/3000,h=q.top(t),l=q.bot(t);lmin=Math.min(lmin,l);hmax=Math.max(hmax,h);smax=Math.max(smax,h-l);}
  const t=d.slice,Q=piece(t),lo=Q.bot(t),hi=Q.top(t),s=hi-lo,X=d.dir==='x';
  const E={key,dir:d.dir,t,lo,hi,s,height:HEIGHT[key]*s,area:K[key]*s*s*CH,a:d.pieces[0].a,b:d.pieces[d.pieces.length-1].b,lmin,hmax,smax,zmax:HEIGHT[key]*smax,k:d.k,kWant:K[key]};
  // the drawn highlighted outline in local coordinates: u along the slice from lo, w up; and its plane coordinate
  const L=dr.highlight.map(q=>({plane:X?q[0]:q[1],u:(X?q[1]:q[0])-lo,w:q[2]}));
  return{id:st.problemId,shownId:P.id,E,L,drawn:dr,legend:document.querySelector('.u6-3d-legend')?.textContent||'',label:document.querySelector('.u6-3d-canvas')?.getAttribute('aria-label')||'',frames:v.frames};});
}
const near=(a,b,t=3e-5)=>Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)); // GPU buffers are 32-bit floats
function checkGeometry(tag,g){
 const {E,L,drawn:D}=g,r={};const bad=m=>{fail(`${tag}: ${m}`);};
 if(g.id!==g.shownId)bad('the model is for another problem');
 if(!near(E.k,E.kWant,1e-12))bad(`the problem's area factor ${E.k} is not the ${E.key} factor`);
 if(!L.every(q=>near(q.plane,E.t)))bad(`the highlighted section is not in the plane ${E.dir} = ${E.t}`);
 if(!(near(L[0].u,0)&&near(L[0].w,0)&&near(L[1].u,E.s)&&near(L[1].w,0)))bad(`the section does not stand on the whole slice from ${E.lo} to ${E.hi}: ${JSON.stringify(L.slice(0,2))}`);
 if(!L.every(q=>q.u>=-3e-5*Math.max(1,E.s)&&q.u<=E.s*(1+3e-5)+3e-5&&q.w>=-3e-5))bad('the section leaves its slice');
 const H=Math.max(...L.map(q=>q.w));if(!near(H,E.height))bad(`height ${H}, expected ${E.height}`);
 if(E.key==='semicircle_d'&&!L.every(q=>near(Math.hypot(q.u-E.s/2,q.w),E.s/2,1e-4)))bad('the semicircle is not on the slice as its diameter');
 if(E.key==='quarter'&&!L.slice(1).every(q=>near(Math.hypot(q.u,q.w),E.s,1e-4)))bad('the quarter circle does not have the slice as its radius');
 if(E.key==='equilateral'&&!(L.length===3&&near(L[2].u,E.s/2)&&near(L[2].w,Math.sqrt(3)/2*E.s)))bad('the equilateral apex is not above the midpoint at sqrt(3)/2 s');
 if(E.key==='iso_leg'&&!(L.length===3&&near(L[2].u,0)&&near(L[2].w,E.s)))bad('the leg triangle has no vertical leg s at the lo end');
 if(E.key==='iso_hyp'&&!(L.length===3&&near(L[2].u,E.s/2)&&near(L[2].w,E.s/2)))bad('the hypotenuse triangle apex is not at (s/2, s/2)');
 if(!near(D.highlightArea,E.area,1e-4))bad(`drawn area ${D.highlightArea}, expected k s^2 = ${E.area}`);
 const S=D.solid,[p0,p1]=E.dir==='x'?['x','y']:['y','x'];
 if(!(near(S[p0+'min'],E.a)&&near(S[p0+'max'],E.b)))bad(`the solid runs ${S[p0+'min']}..${S[p0+'max']} along ${p0}, expected ${E.a}..${E.b}`);
 if(!(near(S[p1+'min'],E.lmin,1e-4)&&near(S[p1+'max'],E.hmax,1e-4)))bad(`the solid spans ${S[p1+'min']}..${S[p1+'max']} across, expected ${E.lmin}..${E.hmax}`);
 if(!(Math.abs(S.zmax-E.zmax)<=2e-3*Math.max(1,E.zmax)&&near(S.zmin,0)))bad(`the solid's height ${S.zmax}, expected ${E.zmax}`);
 const curved=E.key==='semicircle_d'||E.key==='quarter';
 if(!D.shading.flat||(curved&&(!D.shading.curvedSmooth||!S.curvedVertices))||(!curved&&S.curvedVertices))bad(`shading ${JSON.stringify(D.shading)} with ${S.curvedVertices} curved vertices`);
 const want=['x','y','z',...LABELS[E.key]].sort().join('|');if(D.labels.slice().sort().join('|')!==want)bad(`labels ${D.labels}`);
 if(/\d\.\d|\\int|dx|dy/.test(D.labels.join(' ')))bad('a label shows a value or an integral');
 if(!g.legend.includes('base region')||!g.legend.includes('solid made of')||!g.label.includes(`perpendicular to the ${E.dir}-axis`))bad(`legend "${g.legend}" / label "${g.label}"`);
 r.slice={dir:E.dir,at:+E.t.toFixed(4),s:+E.s.toFixed(4),height:+H.toFixed(4),area:+D.highlightArea.toFixed(5),expectedArea:+E.area.toFixed(5)};r.solid={vertices:S.vertices,curved:S.curvedVertices,zmax:+S.zmax.toFixed(4)};r.labels=D.labels.filter(l=>!['x','y','z'].includes(l));
 return r;
}
async function pixels(p){
 const png=(await p.locator('.u6-3d-canvas').screenshot()).toString('base64');
 return p.evaluate(async png=>{const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);
  const d=g.getImageData(0,0,c.width,c.height).data;let lit=0,yellow=0;for(let i=0;i<d.length;i+=4){const [r,gg,bb]=[d[i],d[i+1],d[i+2]];if(r+gg+bb>60)lit++;if(r>170&&gg>140&&bb<110&&r-bb>90)yellow++;}return{w:c.width,h:c.height,lit,yellow};},png);
}
async function drag(p,cdp,touch,dx){const r=await p.locator('.u6-3d-canvas').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
 if(!touch){await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx,y+dx/4,{steps:12});await p.mouse.up();return;}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
 for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/12,y:y+dx*i/48,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function zoom(p,cdp,touch){const r=await p.locator('.u6-3d-canvas').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
 if(!touch){await p.mouse.move(x,y);for(let i=0;i<5;i++){await p.mouse.wheel(0,-120);await p.waitForTimeout(40);}return;}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-20,y,id:1},{x:x+20,y,id:2}]});
 for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-20-i*6,y,id:1},{x:x+20+i*6,y,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
const view=p=>p.evaluate(()=>{const v=window.BatchMathCrossSections3D.state.viewer;return{az:v.azimuth,d:v.distance,f:v.frames};});
async function openModel(p){await p.click('.u6-3d-btn');await p.waitForFunction(()=>window.BatchMathCrossSections3D.state?.viewer,null,{timeout:20000}).catch(()=>{});}
// rotate, zoom, idle, reset, hide (GPU memory released), quick toggling
async function controls(p,cdp,mob,tag,run){
 const v0=await view(p);await drag(p,cdp,mob,140);await p.waitForTimeout(200);const v1=await view(p);
 await zoom(p,cdp,mob);await p.waitForTimeout(250);const v2=await view(p);
 await p.waitForTimeout(1200);const idle=(await view(p)).f-v2.f;
 await p.click('.u6-3d-reset');await p.waitForTimeout(150);const v3=await view(p);
 run.controls={rotated:+(v1.az-v0.az).toFixed(3),zoomed:+(v2.d/v1.d).toFixed(3),idleFrames:idle,reset:near(v3.az,v0.az,1e-6)&&near(v3.d,v0.d,1e-6)};
 if(Math.abs(v1.az-v0.az)<0.05)fail(`${tag}: ${mob?'one-finger':'mouse'} drag did not rotate`);
 if(!(v2.d<v1.d*0.95))fail(`${tag}: ${mob?'pinch':'wheel'} did not zoom in`);
 if(idle)fail(`${tag}: redrawn while idle (${idle} frames)`);
 if(!run.controls.reset)fail(`${tag}: Reset view did not restore the view`);
 const n0=await p.evaluate(()=>window.BatchMathCrossSections3D.disposals.length);
 await p.click('.u6-3d-btn');await p.waitForTimeout(150);
 const hid=await p.evaluate(n0=>({st:window.BatchMathCrossSections3D.state,canvas:document.querySelectorAll('.u6-3d-canvas').length,text:document.querySelector('.u6-3d-btn').textContent,released:window.BatchMathCrossSections3D.disposals.slice(n0)}),n0);
 run.released=hid.released;
 if(hid.st.open||hid.st.viewer||hid.canvas||hid.text!=='Show 3D Model')fail(`${tag}: hiding did not close the model: ${JSON.stringify(hid)}`);
 if(hid.released.length!==1||hid.released[0].geometries!==0||hid.released[0].textures!==0)fail(`${tag}: hiding left GPU memory: ${JSON.stringify(hid.released)}`);
 for(let i=0;i<5;i++)await p.click('.u6-3d-btn');await p.waitForTimeout(1200);
 const quick=await p.evaluate(()=>({canvas:document.querySelectorAll('.u6-3d-canvas').length,open:window.BatchMathCrossSections3D.state.open,viewer:!!window.BatchMathCrossSections3D.state.viewer}));
 run.quickToggle=quick;if(quick.canvas!==(quick.open?1:0)||quick.open!==quick.viewer)fail(`${tag}: after quick toggling ${JSON.stringify(quick)}`);
 if(!quick.open)await openModel(p);
}
async function layout(p,tag,run,box){
 const lay=await p.evaluate(box=>{const s=document.querySelector('.u6-3d-stage').getBoundingClientRect(),q=document.querySelector(box).getBoundingClientRect(),lg=[...document.querySelectorAll('.u6-3d-legend span')].map(e=>e.getBoundingClientRect());
  return{over:document.documentElement.scrollWidth-window.innerWidth,inside:s.left>=q.left-1&&s.right<=q.right+1,legend:lg.every(r=>r.left>=s.left-1&&r.right<=s.right+1),canvas:Math.round(document.querySelector('.u6-3d-canvas')?.getBoundingClientRect().width||0),stage:Math.round(s.width)};},box);
 run.layout=lay;if(lay.over>0||!lay.inside||!lay.legend)fail(`${tag}: layout ${JSON.stringify(lay)}`);
}
async function typeAnswer(p,scope,tex){
 await p.locator(`${scope} math-field`).first().evaluate((e,l)=>{e.focus();e.executeCommand(['insert',l]);e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true}));},tex);
 await p.waitForTimeout(120);await p.locator(`${scope} .staged-check`).click();await p.waitForTimeout(600);
 return p.evaluate(s=>document.querySelector(`${s} .staged-feedback .result`)?.textContent.trim()||document.querySelector(`${s} .staged-input-message`)?.textContent.trim()||'(none)',scope);
}

for(const [vi,[w,h,mob]] of [[1366,900,false],[390,844,true]].entries()){
 const vp=`${w}x${h}`;
 // ---------- non-calculator page ----------
 {recent=[];const c=await context(b,{width:w,height:h,mobile:mob}),p=await open(c,`http://127.0.0.1:${PORT}/${NONCALC}/?bm_seed=cs3db-${w}`),cdp=mob?await c.newCDPSession(p):null;
  const req=[];p.on('request',r=>{if(/vendor\/three|unit6-3d\/viewer/.test(r.url()))req.push(r.url());});
  await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});
  let salt=vi*1000,i=0;
  for(const dir of ['x','y'])for(const shape of SHAPES){
   const [region,family,tier]=REGIONS[dir][(i+vi*8)%REGIONS[dir].length];i++;
   const tag=`${vp} ${shape} ${dir} ${region}`,run={viewport:vp,shape,dir,region,family,tier};out.nonCalculator.push(run);
   const id=await show(p,{region,family,tier,dir,shape,salt:++salt});if(!id){fail(`${tag}: not generated`);continue;}
   if(await p.evaluate(()=>window.BatchMathUnit5Last.id)!==id){fail(`${tag}: the forced problem was not shown`);continue;}
   const before=await p.evaluate(()=>({btn:document.querySelectorAll('.u6-3d-btn').length,text:document.querySelector('.u6-3d-btn')?.textContent,hidden:document.querySelector('.u6-3d-stage')?.hidden,canvas:document.querySelectorAll('.u6-3d-canvas').length,
    beside:document.querySelector('#question .u6-graph-toggle')?.nextElementSibling?.classList.contains('u6-3d')||false,pieces:window.BatchMathUnit5Last.u6Solid.pieces.length}));
   run.toggle=before;run.pieces=before.pieces;
   if(before.btn!==1||before.text!=='Show 3D Model'||!before.hidden||before.canvas||!before.beside)fail(`${tag}: toggle not present, closed and right after Show Graph: ${JSON.stringify(before)}`);
   if(i===1){run.threeBeforeOpen=req.length;if(req.length)fail(`${vp}: three.js was loaded before a model was opened`);}
   await p.click('#question .u6-graph-toggle>summary');await p.waitForTimeout(150);
   run.graph2d=await p.evaluate(()=>{const d=document.querySelector('#question .u6-graph-toggle');return d.open&&!!d.querySelector('svg.u6-svg .u6-shade');});
   if(!run.graph2d)fail(`${tag}: the 2D graph does not open`);
   await p.click('#question .u6-graph-toggle>summary');
   await openModel(p);
   const g=await geometry(p);if(!g){fail(`${tag}: the model did not open: ${await p.textContent('.u6-3d-view')}`);continue;}
   if(i===1)run.threeAfterOpen=req.length;
   run.button=await p.textContent('.u6-3d-btn');if(run.button!=='Hide 3D Model')fail(`${tag}: button reads "${run.button}"`);
   Object.assign(run,checkGeometry(tag,g));
   const px=await pixels(p);run.pixels={lit:px.lit,yellow:px.yellow};if(px.lit<px.w*px.h*0.02||px.yellow<30)fail(`${tag}: the canvas looks empty (${JSON.stringify(px)})`);
   if(!mob||i%4===1)await p.locator('.u6-3d').screenshot({path:`${shots}/${shape}-${dir}-${region}-${w}.png`});
   await controls(p,cdp,mob,tag,run);
   // a typed answer with the model open (single-part problems)
   const parts=await p.evaluate(()=>window.BatchMathUnit5Last.parts.map(q=>({control:q.control,tex:q.answerTex})));
   if(parts.length===1&&parts[0].control==='input'){run.answer=await typeAnswer(p,'#choices .unit5-part-1',parts[0].tex);
    if(!/is correct\.|^Correct\./.test(run.answer))fail(`${tag}: the typed answer ${parts[0].tex} was not graded correct: ${run.answer}`);
    if(!(await p.evaluate(()=>!!window.BatchMathCrossSections3D.state?.viewer)))fail(`${tag}: the model closed when the answer was checked`);}
   await layout(p,tag,run,'#question');
  }
  // switching question with a model open: the next problem (another shape, the other direction) replaces it
  {const a=await p.evaluate(()=>window.BatchMathCrossSections3D.state);if(!a?.viewer){await openModel(p);}
   const from=await p.evaluate(()=>{const s=window.BatchMathCrossSections3D.state;return{id:s.problemId,shape:s.shape,dir:s.dir,open:!!s.viewer};});
   const want={region:'disk',family:'cs_basic',tier:'foundational',dir:from.dir==='x'?'y':'x',shape:from.shape==='quarter'?'iso_hyp':'quarter',salt:7001+vi};
   const id=await force(p,want);await next(p);
   const st=await p.evaluate(()=>({st:window.BatchMathCrossSections3D.state,canvas:document.querySelectorAll('.u6-3d-canvas').length,wraps:document.querySelectorAll('.u6-3d').length}));
   out[`switch${vp}`]={from,to:{id,shape:want.shape,dir:want.dir},after:{problemId:st.st?.problemId,shape:st.st?.shape,dir:st.st?.dir,open:st.st?.open,canvas:st.canvas,wraps:st.wraps}};
   if(!from.open||st.st?.problemId!==id||st.st.open||st.st.viewer||st.canvas||st.wraps!==1||st.st.shape!==want.shape||st.st.dir!==want.dir)fail(`${vp}: switching question: ${JSON.stringify(out[`switch${vp}`])}`);
   await openModel(p);const g=await geometry(p);
   if(!g||g.E.key!==want.shape||g.E.dir!==want.dir)fail(`${vp}: after switching, the model is ${g&&g.E.key} ${g&&g.E.dir}`);else checkGeometry(`${vp} after switching`,g);}
  // resizing with a model open (desktop: narrower and back; phone: rotate to landscape and back)
  {const r0=await p.evaluate(()=>window.BatchMathCrossSections3D.state.viewer.resizes);const sizes=mob?[[844,390],[390,844]]:[[700,900],[1366,900]],res=[];
   for(const [W,Hh] of sizes){await p.setViewportSize({width:W,height:Hh});await p.waitForTimeout(500);
    res.push(await p.evaluate(()=>{const c=document.querySelector('.u6-3d-canvas'),v=document.querySelector('.u6-3d-view');return{canvas:Math.round(c.getBoundingClientRect().width),view:Math.round(v.getBoundingClientRect().width),over:document.documentElement.scrollWidth-window.innerWidth,resizes:window.BatchMathCrossSections3D.state.viewer.resizes};}));}
   out[`resize${vp}`]=res;if(!res.every(q=>Math.abs(q.canvas-q.view)<=1&&q.over<=0)||res[res.length-1].resizes<=r0)fail(`${vp}: resize ${JSON.stringify(res)}`);}
  // 12 open/close cycles: every model releases all its GPU geometries and textures; one canvas at most
  {const n0=await p.evaluate(()=>window.BatchMathCrossSections3D.disposals.length);if(await p.evaluate(()=>window.BatchMathCrossSections3D.state.open))await p.click('.u6-3d-btn');
   for(let k=0;k<12;k++){await openModel(p);await p.click('.u6-3d-btn');await p.waitForTimeout(60);}
   const m=await p.evaluate(n0=>({released:window.BatchMathCrossSections3D.disposals.slice(n0),canvas:document.querySelectorAll('.u6-3d-canvas').length}),n0);
   out[`cycles${vp}`]={cycles:12,released:m.released.length,leftGeometries:m.released.reduce((t,q)=>t+q.geometries,0),leftTextures:m.released.reduce((t,q)=>t+q.textures,0),canvas:m.canvas};
   if(m.released.length<12||m.released.some(q=>q.geometries||q.textures)||m.canvas)fail(`${vp}: open/close cycles ${JSON.stringify(out[`cycles${vp}`])}`);}
  out[`errors${vp}`]=p._errs.length;for(const e of p._errs)fail(`${vp} non-calculator: ${e}`);
  await c.close();}

 // ---------- calculator page ----------
 {recent=[];const c=await context(b,{width:w,height:h,mobile:mob}),p=await open(c,`http://127.0.0.1:${PORT}/${CALC}/?bm_seed=cs3db-calc-${w}`),cdp=mob?await c.newCDPSession(p):null;
  const req=[];p.on('request',r=>{if(/vendor\/three|unit6-3d\/viewer/.test(r.url()))req.push(r.url());});
  await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});
  out[`calcModule${vp}`]=await p.evaluate(()=>!!window.BatchMathCrossSections3D);if(!out[`calcModule${vp}`])fail(`${vp}: the calculator page has no 3D module`);
  let salt=5000+vi*1000,i=0;
  for(const [region,dir,shape,tier,right] of (vi?CALC_CASES.slice(5).concat(CALC_CASES.slice(0,1)):CALC_CASES.slice(0,6))){
   i++;const tag=`${vp} calculator ${shape} ${dir} ${region} ${tier}`,run={viewport:vp,region,dir,shape,tier};out.calculator.push(run);
   const id=await show(p,{region,family:'cs_calc',tier,dir,shape,calc:'calculator',salt:++salt});if(!id){fail(`${tag}: not generated`);continue;}
   if(await p.evaluate(()=>window.BatchMathUnit5Last.id)!==id){fail(`${tag}: the forced problem was not shown`);continue;}
   const pre=await p.evaluate(()=>({wraps:document.querySelectorAll('.u6-3d').length,canvas:document.querySelectorAll('.u6-3d-canvas').length,state:window.BatchMathCrossSections3D.state,figure:document.querySelectorAll('.u6-fig-row,#question svg.u6-svg').length,descriptor:!!window.BatchMathUnit5Last.u6Solid,calc:window.BatchMathUnit5Last.calculatorActive,parts:window.BatchMathUnit5Last.parts.length}));
   run.beforePartA={...pre,state:!!pre.state};run.parts=pre.parts;
   if(pre.wraps||pre.canvas||pre.state||pre.figure||!pre.descriptor||!pre.calc)fail(`${tag}: before Part A is checked: ${JSON.stringify(pre)}`);
   if(i===1&&req.length)fail(`${vp}: calculator page loaded three.js before a model was opened`);
   const tex=await p.evaluate(()=>window.BatchMathUnit5Last.parts[0].answerTex);
   const wrong=!right&&tier==='intermediate';run.partA=await typeAnswer(p,'#choices .unit5-part-1',wrong?'1':tex);run.partAWrongOnPurpose=wrong;
   await p.waitForTimeout(400);
   const post=await p.evaluate(()=>{const w=document.querySelectorAll('.u6-3d'),one=w[0];return{wraps:w.length,inPartA:!!one?.closest('#choices .unit5-part-1 .staged-feedback'),afterFigure:one?.previousElementSibling?.classList.contains('u6-fig-row')||false,
    hidden:one?.querySelector('.u6-3d-stage').hidden,text:one?.querySelector('.u6-3d-btn').textContent,canvas:document.querySelectorAll('.u6-3d-canvas').length};});
   run.afterPartA=post;
   if(wrong&&/is correct/.test(run.partA))fail(`${tag}: the wrong answer was graded correct`);
   if(!wrong&&!/is correct\.|^Correct\./.test(run.partA))fail(`${tag}: Part A ${tex} was not graded correct: ${run.partA}`);
   if(post.wraps!==1||!post.inPartA||!post.afterFigure||!post.hidden||post.text!=='Show 3D Model'||post.canvas)fail(`${tag}: after Part A: ${JSON.stringify(post)}`);
   await openModel(p);const g=await geometry(p);if(!g){fail(`${tag}: the model did not open: ${await p.textContent('.u6-3d-view')}`);continue;}
   Object.assign(run,checkGeometry(tag,g));
   const px=await pixels(p);run.pixels={lit:px.lit,yellow:px.yellow};if(px.lit<px.w*px.h*0.02||px.yellow<30)fail(`${tag}: the canvas looks empty (${JSON.stringify(px)})`);
   if(!mob||i===1)await p.locator('.u6-3d').screenshot({path:`${shots}/calc-${shape}-${dir}-${region}-${w}.png`});
   if(i<=2)await controls(p,cdp,mob,tag,run);
   await layout(p,tag,run,'#choices');
   // Part B: the model stays with Part A's explanation
   if(pre.parts>1){await p.click('#choices .unit5-part-1 .staged-continue');await p.waitForTimeout(500);
    const pb=await p.evaluate(()=>({partB:!!document.querySelector('#choices .unit5-part-2'),open:window.BatchMathCrossSections3D.state?.open,viewer:!!window.BatchMathCrossSections3D.state?.viewer,connected:document.querySelector('.u6-3d-canvas')?.isConnected||false,wraps:document.querySelectorAll('.u6-3d').length}));
    run.partB=pb;if(!pb.partB||!pb.open||!pb.viewer||!pb.connected||pb.wraps!==1)fail(`${tag}: Part B: ${JSON.stringify(pb)}`);}
  }
  // the next question removes the model; the new calculator problem shows nothing until its Part A is checked
  {const open0=await p.evaluate(()=>!!window.BatchMathCrossSections3D.state?.viewer);const want={region:'exp_axes',family:'cs_calc',tier:'intermediate',dir:'x',shape:'square',calc:'calculator',salt:8800+vi};
   const id=await force(p,want);await next(p);
   const st=await p.evaluate(()=>({id:window.BatchMathUnit5Last.id,wraps:document.querySelectorAll('.u6-3d').length,canvas:document.querySelectorAll('.u6-3d-canvas').length,state:window.BatchMathCrossSections3D.state}));
   out[`calcNext${vp}`]={from:open0,...st,state:!!st.state};if(!open0||st.id!==id||st.wraps||st.canvas||st.state)fail(`${vp}: calculator next question: ${JSON.stringify(out[`calcNext${vp}`])}`);}
  out[`calcErrors${vp}`]=p._errs.length;for(const e of p._errs)fail(`${vp} calculator: ${e}`);
  await c.close();}
}
await b.close();

// ---------- a browser without WebGL ----------
{const nb=await chromium.launch({executablePath:process.env.BATCHMATH_CHROMIUM_PATH||'/usr/bin/chromium',args:['--disable-webgl','--disable-3d-apis']});
 const c=await context(nb,{width:1366,height:900}),p=await open(c,`http://127.0.0.1:${PORT}/${NONCALC}/?bm_seed=cs3db-nogl`);recent=[];
 await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});
 const id=await show(p,{region:'cap',family:'cs_basic',tier:'foundational',dir:'y',shape:'semicircle_d',salt:9100});
 await p.click('.u6-3d-btn');await p.waitForTimeout(2500);
 const st=await p.evaluate(()=>({gl:!!document.createElement('canvas').getContext('webgl2'),text:document.querySelector('.u6-3d-view')?.textContent,canvas:document.querySelectorAll('.u6-3d-canvas').length,button:document.querySelector('.u6-3d-btn')?.textContent,state:window.BatchMathCrossSections3D.state}));
 await p.click('#question .u6-graph-toggle>summary');await p.waitForTimeout(150);
 const g2=await p.evaluate(()=>{const d=document.querySelector('#question .u6-graph-toggle');return d.open&&!!d.querySelector('svg.u6-svg .u6-shade');});
 await p.click('.u6-3d-btn');await p.waitForTimeout(150);const closed=await p.evaluate(()=>({button:document.querySelector('.u6-3d-btn')?.textContent,hidden:document.querySelector('.u6-3d-stage')?.hidden}));
 out.noWebGL={problem:id,webgl2Available:st.gl,message:st.text,canvas:st.canvas,button:st.button,graph2d:g2,closesAgain:closed,errors:p._errs};
 if(st.gl||!/cannot show the 3D model \(WebGL is not available\)/.test(st.text||'')||st.canvas||st.state?.viewer||!g2||closed.button!=='Show 3D Model'||!closed.hidden||p._errs.length)fail(`no WebGL: ${JSON.stringify(out.noWebGL)}`);
 await nb.close();}
srv.close();
console.log(JSON.stringify(out,null,1));
if(out.failures.length)process.exitCode=1;
