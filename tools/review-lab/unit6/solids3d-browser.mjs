// v13.0.C experimental 3D solids of revolution, in Chromium with the real pages (Solids of Revolution, Non-Calculator
// Practice and Calculator Practice), at 1366x900 (mouse) and 390x844 (touch). The page's own generator is made to serve
// a problem of each family (disk_basic, washer, shells, two_axes, trig_solid, solid_calc, calc_two_axes), with and
// without a graph in the question, about axes of every kind (the coordinate axes, lines above, below, left and right
// of the region, boundary lines), with disks, washers and both kinds of shells:
//  - placement: a toggle appears only where the region's 2D picture for that rotation is: after the question's graph
//    (one rotation), under each part's prompt when that part is reached (two rotations, graph in the question), or
//    after the picture in the explanation of the part that first draws the rotation, once that part is checked
//    (questions without a graph, and every calculator question); before that there is no toggle, model or 3D request;
//  - each model, read back from the GPU buffers and checked against the problem's own data with independent formulas:
//    the solid spans the region along the axis and reaches exactly the region's least and greatest distances from the
//    axis; the highlighted disk / washer / shell is at the explanation's slice with R and r (or radius r and height h)
//    equal to the slice's distances from the axis; the pink rod lies on the axis (y = c, z = 0 or x = c, z = 0); the
//    labels are the axis equation and R, r or r, h; the surface is smooth; the canvas has drawn and highlight pixels;
//  - two rotations: two models, each with its own part and its own axis, never the same solid twice;
//  - controls (rotation, zoom, Reset view, no redraws while idle), hiding releases all GPU memory, quick toggling,
//    the next question releases every model (no stale geometry), typed answers graded correct with a model open;
//  - layout (no page wider than the screen), no console errors; a browser without WebGL gets a message.
// Usage: node tools/review-lab/unit6/solids3d-browser.mjs   (writes screenshots to $REVIEW_OUT/unit6/3d-c)
//        BM_PORT=<port>: use a server already running on 127.0.0.1:<port> (python3 -m http.server serving an extracted ZIP)
import {serve,browser,context,open,randomPort,outDir} from '../lib/browser.mjs';
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const {chromium}=require('playwright');
const T='ap-calculus/unit-6-applications-integration/topics/solids-of-revolution';
const NONCALC=[
 {family:'disk_basic',tier:'foundational',graph:'shown',axisType:'y'},{family:'disk_basic',tier:'intermediate',graph:'none',axisType:'x'},
 {family:'washer',tier:'intermediate',graph:'shown',kind:'washer',shifted:true},{family:'washer',tier:'challenging',graph:'none',kind:'washer',axisType:'x'},
 {family:'shells',tier:'intermediate',graph:'shown',axisType:'x'},{family:'shells',tier:'challenging',graph:'none',axisType:'y'},
 {family:'two_axes',tier:'challenging',graph:'shown'},{family:'two_axes',tier:'challenging',graph:'none'},
 {family:'trig_solid',tier:'intermediate',graph:'shown'},{family:'trig_solid',tier:'challenging',graph:'none'}];
const CALC=[{family:'solid_calc',tier:'foundational'},{family:'solid_calc',tier:'intermediate',kind:'shell'},{family:'solid_calc',tier:'challenging',kind:'washer'},
 {family:'calc_two_axes',tier:'intermediate'},{family:'calc_two_axes',tier:'challenging'}];
const shots=outDir('unit6','3d-c'),PORT=process.env.BM_PORT?+process.env.BM_PORT:randomPort(9850),srv=process.env.BM_PORT?{close(){}}:await serve(PORT),b=await browser();
const out={runs:[],failures:[]};const fail=m=>out.failures.push(m);
let recent=[];
async function force(p,want){
 const id=await p.evaluate(want=>{
  const rng=seed=>{let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}};
  const V=window.BatchMathUnit6Volume,saved=window.BatchMathRNG;let hit=null;
  try{for(let s=1;s<60000&&!hit;s++){window.BatchMathRNG={random:rng(s*7+want.salt)};let q;try{q=V.makeSolid({family:want.family,tier:want.tier,calc:want.calc});}catch(e){continue;}
   const d=q.u6Revolution,r=d&&d.rotations[0];if(!d||(want.graph&&d.graph!==want.graph)||(want.kind&&r.kind!==want.kind)||(want.axisType&&r.axis.type!==want.axisType)||(want.shifted&&r.axis.c===0)||(want.avoid||[]).includes(q.id))continue;hit=q;}}finally{window.BatchMathRNG=saved;}
  if(!hit)return null;
  const api=window.BatchMathAPTopicGenerators;if(!api.__orig){api.__orig=api.get;api.get=s=>{const g=api.__orig(s);return g&&(o=>{if(window.__force){const f=window.__force;window.__force=null;window.BatchMathUnit5Last=f;return f;}return g(o);});};}
  window.__force=hit;return hit.id;},{...want,avoid:recent});
 if(id){recent.push(id);recent=recent.slice(-6);}return id;
}
async function next(p){const cur=await p.$eval('#u6Mode',e=>e.value),opts=await p.$$eval('#u6Mode option',o=>o.map(x=>x.value));await p.selectOption('#u6Mode',opts.find(v=>v!==cur&&v!=='mixed')||opts.find(v=>v!==cur));await p.waitForTimeout(800);}
const models=p=>p.evaluate(()=>[...document.querySelectorAll('.u6-3d')].map(w=>({rotation:+w.dataset.rotation,axis:w.dataset.axis,kind:w.dataset.kind,part:w.closest('.unit5-part')?.dataset.part??null,inQuestion:!!w.closest('#question'),afterFigure:w.previousElementSibling?.classList.contains('u6-fig-row')||false,afterGraph:w.previousElementSibling?.matches('figure.u6-figure')||false,afterPrompt:w.previousElementSibling?.classList.contains('staged-part-prompt')||false,open:!w.querySelector('.u6-3d-stage').hidden})));
async function typePart(p,k){
 const part=await p.evaluate(k=>{const q=window.BatchMathUnit5Last.parts[k];return{control:q.control,tex:q.control==='u6-expr'?q.answerTex.slice(q.prefix.length):q.answerTex,choice:q.correctIndex};},k);
 const scope=`#choices .unit5-part-${k+1}`;
 if(part.control==='choice'){await p.locator(`${scope} .staged-choice`).nth(part.choice).click();}
 else{await p.locator(`${scope} math-field`).first().evaluate((e,l)=>{e.focus();e.executeCommand(['insert',l]);e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true}));},part.tex);
  await p.waitForTimeout(120);await p.locator(`${scope} .staged-check`).click();}
 await p.waitForTimeout(700);
 return p.evaluate(s=>document.querySelector(`${s} .staged-feedback .result`)?.textContent.trim()||document.querySelector(`${s} .staged-input-message`)?.textContent.trim()||'(none)',scope);
}
const graded=r=>/is correct\.|^Correct\./.test(r);
async function openModel(p,i){await p.click(`.u6-3d[data-rotation="${i}"] .u6-3d-btn`);await p.waitForFunction(i=>window.BatchMathSolids3D.state?.models?.[i]?.viewer,i,{timeout:20000}).catch(()=>{});await p.waitForTimeout(200);}
// the drawn model against the problem's own data (independent formulas)
async function geometry(p,i){
 return p.evaluate(i=>{const st=window.BatchMathSolids3D.state,m=st.models[i],v=m&&m.viewer;if(!v)return null;const d=window.BatchMathUnit5Last.u6Revolution,rot=d.rotations[i],ax=rot.axis,dr=v.drawn();
  const rho=(x,y)=>ax.type==='y'?y-ax.c:x-ax.c,al=(x,y)=>ax.type==='y'?x:y;let a0=Infinity,a1=-Infinity,r0=Infinity,r1=0;
  const see=(x,y)=>{a0=Math.min(a0,al(x,y));a1=Math.max(a1,al(x,y));const r=Math.abs(rho(x,y));r0=Math.min(r0,r);r1=Math.max(r1,r);};
  const ps=d.xs||d.ys,X=!!d.xs;for(const q of ps)for(let k=0;k<=4000;k++){const t=q.a+(q.b-q.a)*k/4000;if(X){see(t,q.top(t));see(t,q.bot(t));}else{see(q.top(t),t);see(q.bot(t),t);}}
  // the region's least distance from the axis is reached inside it too (a vertical or horizontal edge): along the slices
  for(const q of ps)for(let k=0;k<=400;k++){const t=q.a+(q.b-q.a)*k/400,lo=q.bot(t),hi=q.top(t);for(let j=0;j<=20;j++){const w=lo+(hi-lo)*j/20;if(X)see(t,w);else see(w,t);}}
  const s=rot.seg,d1=Math.abs(rho(s[0],s[1])),d2=Math.abs(rho(s[2],s[3]));
  const E={axis:ax,kind:rot.kind,axial:[a0,a1],radius:[r0,r1],R:Math.max(d1,d2),r:rot.kind==='disk'?0:Math.min(d1,d2),at:rot.at,shellR:d1,shellAxial:[Math.min(al(s[0],s[1]),al(s[2],s[3])),Math.max(al(s[0],s[1]),al(s[2],s[3]))]};
  return{E,info:{problemId:v.problemId,rotation:v.rotation,kind:v.kind,highlight:v.highlight},drawn:dr,legend:document.querySelector(`.u6-3d[data-rotation="${i}"] .u6-3d-legend`)?.textContent||'',caption:document.querySelector(`.u6-3d[data-rotation="${i}"] .u6-3d-title`)?.textContent||''};},i);
}
const near=(a,b,t=3e-5)=>Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));
function check(tag,g){
 const {E,drawn:D}=g,bad=m=>fail(`${tag}: ${m}`),r={};
 if(!(near(D.solid.axial[0],E.axial[0],1e-4)&&near(D.solid.axial[1],E.axial[1],1e-4)))bad(`solid along the axis ${D.solid.axial}, region ${E.axial}`);
 if(!(Math.abs(D.solid.radius[0]-E.radius[0])<=2e-3*Math.max(1,E.radius[1])&&near(D.solid.radius[1],E.radius[1],2e-4)))bad(`solid radii ${D.solid.radius}, region's distances from the axis ${E.radius}`);
 if(!D.solid.smooth)bad('the solid is not smooth-shaded');
 const H=D.highlight,th=g.info.highlight.thickness;
 if(E.kind==='shell'){if(!(near(H.radius[0],E.shellR-th/2,1e-4)&&near(H.radius[1],E.shellR+th/2,1e-4)&&near(H.axial[0],E.shellAxial[0],1e-4)&&near(H.axial[1],E.shellAxial[1],1e-4)))bad(`shell radii ${H.radius} along ${H.axial}, expected r = ${E.shellR}, h from ${E.shellAxial}`);}
 else if(!(near(H.radius[1],E.R,1e-4)&&(E.kind==='disk'?H.radius[0]<1e-4:near(H.radius[0],E.r,1e-4))&&near((H.axial[0]+H.axial[1])/2,E.at,1e-4)))bad(`${E.kind} radii ${H.radius} at ${H.axial}, expected R = ${E.R}, r = ${E.r} at ${E.at}`);
 const rc=D.rod.center;if(!(E.axis.type==='y'?near(rc[1],E.axis.c,1e-5)&&Math.abs(rc[2])<1e-5:near(rc[0],E.axis.c,1e-5)&&Math.abs(rc[2])<1e-5))bad(`the axis rod is at ${rc}, not on ${E.axis.type} = ${E.axis.c}`);
 const want=['x','y','z',`${E.axis.type} = ${String(E.axis.c).replace('-','−')}`,...(E.kind==='shell'?['r','h']:E.kind==='disk'?['R']:['R','r'])].sort().join('|');
 if(D.labels.slice().sort().join('|')!==want)bad(`labels ${D.labels}`);
 if(!g.legend.includes(`axis of rotation ${E.axis.type} = ${String(E.axis.c).replace('-','\u2212')}`))bad(`legend "${g.legend}"`);
 r.model={axis:`${E.axis.type}=${E.axis.c}`,kind:E.kind,solidRadius:D.solid.radius.map(x=>+x.toFixed(4)),slice:E.kind==='shell'?{r:+E.shellR.toFixed(4),h:+(E.shellAxial[1]-E.shellAxial[0]).toFixed(4)}:{R:+E.R.toFixed(4),r:+E.r.toFixed(4),at:+E.at.toFixed(4)},triangles:D.solid.triangles};
 return r;
}
async function pixels(p,i){
 const png=(await p.locator(`.u6-3d[data-rotation="${i}"] .u6-3d-canvas`).screenshot()).toString('base64');
 return p.evaluate(async png=>{const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);
  const d=g.getImageData(0,0,c.width,c.height).data;let lit=0,yellow=0,pink=0;for(let k=0;k<d.length;k+=4){const [r,gg,bb]=[d[k],d[k+1],d[k+2]];if(r+gg+bb>60)lit++;if(r>170&&gg>140&&bb<110&&r-bb>90)yellow++;if(r>200&&gg<140&&bb>110)pink++;}return{w:c.width,h:c.height,lit,yellow,pink};},png);
}
async function drag(p,cdp,touch,sel,dx){const r=await p.locator(sel).boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
 if(!touch){await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx,y+dx/4,{steps:12});await p.mouse.up();return;}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
 for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/12,y:y+dx*i/48,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function zoom(p,cdp,touch,sel){const r=await p.locator(sel).boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
 if(!touch){await p.mouse.move(x,y);for(let i=0;i<5;i++){await p.mouse.wheel(0,-120);await p.waitForTimeout(40);}return;}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-20,y,id:1},{x:x+20,y,id:2}]});
 for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-20-i*6,y,id:1},{x:x+20+i*6,y,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
const view=(p,i)=>p.evaluate(i=>{const v=window.BatchMathSolids3D.state.models[i].viewer;return{az:v.azimuth,d:v.distance,f:v.frames};},i);
async function controls(p,cdp,mob,tag,i,run){
 const sel=`.u6-3d[data-rotation="${i}"] .u6-3d-canvas`;
 const v0=await view(p,i);await drag(p,cdp,mob,sel,140);await p.waitForTimeout(200);const v1=await view(p,i);
 await zoom(p,cdp,mob,sel);await p.waitForTimeout(250);const v2=await view(p,i);await p.waitForTimeout(1200);const idle=(await view(p,i)).f-v2.f;
 await p.click(`.u6-3d[data-rotation="${i}"] .u6-3d-reset`);await p.waitForTimeout(150);const v3=await view(p,i);
 run.controls={rotated:+(v1.az-v0.az).toFixed(3),zoomed:+(v2.d/v1.d).toFixed(3),idleFrames:idle,reset:near(v3.az,v0.az,1e-6)&&near(v3.d,v0.d,1e-6)};
 if(Math.abs(v1.az-v0.az)<0.05)fail(`${tag}: drag did not rotate`);if(!(v2.d<v1.d*0.95))fail(`${tag}: no zoom`);if(idle)fail(`${tag}: ${idle} redraws while idle`);if(!run.controls.reset)fail(`${tag}: Reset view did not restore the view`);
 const n0=await p.evaluate(()=>window.BatchMathSolids3D.disposals.length);await p.click(`.u6-3d[data-rotation="${i}"] .u6-3d-btn`);await p.waitForTimeout(150);
 const rel=await p.evaluate(n0=>window.BatchMathSolids3D.disposals.slice(n0),n0);run.released=rel;
 if(rel.length!==1||rel[0].geometries||rel[0].textures)fail(`${tag}: hiding left GPU memory ${JSON.stringify(rel)}`);
 for(let k=0;k<5;k++)await p.click(`.u6-3d[data-rotation="${i}"] .u6-3d-btn`);await p.waitForTimeout(1200);
 const q=await p.evaluate(i=>({canvas:document.querySelectorAll(`.u6-3d[data-rotation="${i}"] .u6-3d-canvas`).length,open:window.BatchMathSolids3D.state.models[i].open}),i);run.quickToggle=q;
 if(q.canvas!==(q.open?1:0))fail(`${tag}: quick toggling left ${q.canvas} canvases`);if(!q.open)await openModel(p,i);
}
async function inspect(p,i,tag,run,{mob,cdp,controlsToo,shot}){
 await openModel(p,i);const g=await geometry(p,i);if(!g){fail(`${tag}: model ${i+1} did not open: ${await p.textContent(`.u6-3d[data-rotation="${i}"] .u6-3d-view`)}`);return;}
 const m=run.models[i]={...check(`${tag} model ${i+1}`,g),caption:g.caption};
 const px=await pixels(p,i);m.pixels={lit:px.lit,yellow:px.yellow,pink:px.pink};if(px.lit<px.w*px.h*0.02||px.yellow<30||px.pink<5)fail(`${tag} model ${i+1}: canvas ${JSON.stringify(px)}`);
 if(shot)await p.locator(`.u6-3d[data-rotation="${i}"]`).screenshot({path:`${shots}/${shot}-${i+1}.png`});
 if(controlsToo)await controls(p,cdp,mob,`${tag} model ${i+1}`,i,m);
}
for(const [vi,[w,h,mob]] of [[1366,900,false],[390,844,true]].entries()){
 const vp=`${w}x${h}`;
 for(const [page,cases,calc] of [['non-calculator-practice',NONCALC,'non-calculator'],['calculator-practice',CALC,'calculator']]){
  recent=[];const c=await context(b,{width:w,height:h,mobile:mob}),p=await open(c,`http://127.0.0.1:${PORT}/${T}/${page}/?bm_seed=sol3d-${w}`),cdp=mob?await c.newCDPSession(p):null;
  const req=[];p.on('request',r=>{if(/vendor\/three|revolution-viewer/.test(r.url()))req.push(r.url());});
  await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});
  let salt=vi*500+(calc==='calculator'?200:0),i=0;
  for(const want of cases){i++;
   const tag=`${vp} ${want.family} ${want.tier} ${want.graph||'calc'}`,run={viewport:vp,page,...want,models:[]};out.runs.push(run);
   const id=await force(p,{...want,calc,salt:++salt});if(!id){fail(`${tag}: not generated`);continue;}
   await next(p);if(await p.evaluate(()=>window.BatchMathUnit5Last.id)!==id){fail(`${tag}: the forced problem was not shown`);continue;}
   const d=await p.evaluate(()=>{const d=window.BatchMathUnit5Last.u6Revolution;return{graph:d.graph,rotations:d.rotations.map(r=>({axis:r.axisTex,kind:r.kind,ask:r.ask,reveal:r.reveal})),parts:window.BatchMathUnit5Last.parts.length,eqs:d.eqs};});
   run.problem={id,graph:d.graph,rotations:d.rotations,parts:d.parts};
   const two=d.rotations.length>1,inQuestion=d.graph==='shown'&&calc==='non-calculator';
   if(i===1&&req.length)fail(`${tag}: three.js was requested before a model was opened`);
   // the stage before any part is checked
   let M=await models(p);run.atStart=M;
   if(inQuestion&&!two){if(M.length!==1||!M[0].inQuestion||!M[0].afterGraph||M[0].open)fail(`${tag}: at the start ${JSON.stringify(M)}`);}
   else if(inQuestion&&two){if(M.length!==1||M[0].rotation!==0||M[0].part!=='0'||!M[0].afterPrompt)fail(`${tag}: at the start (two axes, graph) ${JSON.stringify(M)}`);}
   else if(M.length)fail(`${tag}: a model is offered before its picture is shown: ${JSON.stringify(M)}`);
   if(inQuestion){await p.waitForTimeout(100);await inspect(p,0,tag,run,{mob,cdp,controlsToo:i<=3,shot:mob?null:`${want.family}-${want.graph}-${w}`});}
   // the parts, in order: each checked with its typed answer; the models appear at their stages
   const answers=[];
   for(let k=0;k<d.parts;k++){
    answers.push(await typePart(p,k));
    if(!graded(answers[k]))fail(`${tag}: Part ${k+1} answer not graded correct: ${answers[k]}`);
    M=await models(p);
    for(const [ri,r] of d.rotations.entries()){const has=M.find(x=>x.rotation===ri),due=inQuestion?(two?r.ask<=k+1:true):r.reveal<=k;
     // (two axes with a graph: a part's model is under its prompt as soon as that part is shown, i.e. after Continue)
     if(inQuestion&&two&&r.ask===k+1)continue;
     if(due&&!has)fail(`${tag}: after Part ${k+1} the model for rotation ${ri+1} is missing (${JSON.stringify(M)})`);
     if(!due&&has)fail(`${tag}: after Part ${k+1} the model for rotation ${ri+1} is already shown`);
     if(has&&!inQuestion&&(!has.afterFigure||has.part!==String(r.reveal)))fail(`${tag}: rotation ${ri+1}'s model is not after Part ${r.reveal+1}'s picture: ${JSON.stringify(has)}`);}
    // open each model that just appeared in an explanation
    for(const [ri,r] of d.rotations.entries())if(!inQuestion&&r.reveal===k)await inspect(p,ri,tag,run,{mob,cdp,controlsToo:i<=2,shot:mob&&i>2?null:`${want.family}-${want.graph||'calc'}-${w}`});
    if(k+1<d.parts){await p.click(`#choices .unit5-part-${k+1} .staged-continue`);await p.waitForTimeout(500);
     if(inQuestion&&two){M=await models(p);const r2=M.find(x=>x.rotation===1);if(d.rotations[1].ask===k+1){if(!r2||r2.part!==String(k+1)||!r2.afterPrompt)fail(`${tag}: Part ${k+2}'s model is not under its prompt: ${JSON.stringify(M)}`);else await inspect(p,1,tag,run,{mob,cdp,shot:mob?null:`${want.family}-${want.graph}-${w}`});}}}
   }
   run.answers=answers;
   if(two){const ax=run.models.map(m=>m?.model?.axis);if(ax.length!==2||ax[0]===ax[1]||run.models.some(m=>!m))fail(`${tag}: two rotations gave ${JSON.stringify(ax)}`);}
   const lay=await p.evaluate(()=>({over:document.documentElement.scrollWidth-window.innerWidth,inside:[...document.querySelectorAll('.u6-3d-stage')].filter(s=>!s.hidden).every(s=>{const r=s.getBoundingClientRect(),q=document.querySelector('.practice-shell,main')?.getBoundingClientRect();return!q||(r.left>=q.left-1&&r.right<=q.right+1);})}));
   run.layout=lay;if(lay.over>0||!lay.inside)fail(`${tag}: layout ${JSON.stringify(lay)}`);
  }
  // the next question releases every model: no stale geometry, no toggle until the new problem's picture is shown
  {const open0=await p.evaluate(()=>(window.BatchMathSolids3D.state?.models||[]).filter(m=>m?.viewer).length),n0=await p.evaluate(()=>window.BatchMathSolids3D.disposals.length);
   const id=await force(p,{family:calc==='calculator'?'solid_calc':'disk_basic',tier:calc==='calculator'?'intermediate':'foundational',calc,graph:calc==='calculator'?undefined:'none',salt:9000+vi});await next(p);
   const st=await p.evaluate(n0=>({id:window.BatchMathUnit5Last.id,wraps:document.querySelectorAll('.u6-3d').length,canvas:document.querySelectorAll('.u6-3d-canvas').length,released:window.BatchMathSolids3D.disposals.slice(n0)}),n0);
   out[`next ${vp} ${page}`]={openBefore:open0,...st};
   if(!open0||st.id!==id||st.wraps||st.canvas||st.released.length<open0||st.released.some(r=>r.geometries||r.textures))fail(`${vp} ${page}: next question ${JSON.stringify(out[`next ${vp} ${page}`])}`);}
  // 10 open/close cycles of one model
  if(calc==='non-calculator'){const id=await force(p,{family:'washer',tier:'intermediate',calc,graph:'shown',salt:9100+vi});await next(p);const n0=await p.evaluate(()=>window.BatchMathSolids3D.disposals.length);
   for(let k=0;k<10;k++){await openModel(p,0);await p.click('.u6-3d[data-rotation="0"] .u6-3d-btn');await p.waitForTimeout(60);}
   const m=await p.evaluate(n0=>({released:window.BatchMathSolids3D.disposals.slice(n0),canvas:document.querySelectorAll('.u6-3d-canvas').length}),n0);
   out[`cycles ${vp}`]={problem:id,cycles:10,released:m.released.length,left:m.released.reduce((t,q)=>t+q.geometries+q.textures,0),canvas:m.canvas};
   if(m.released.length<10||m.released.some(q=>q.geometries||q.textures)||m.canvas)fail(`${vp}: cycles ${JSON.stringify(out[`cycles ${vp}`])}`);}
  out[`errors ${vp} ${page}`]=p._errs.length;for(const e of p._errs)fail(`${vp} ${page}: ${e}`);
  await c.close();
 }
}
await b.close();
// a browser without WebGL
{const nb=await chromium.launch({executablePath:process.env.BATCHMATH_CHROMIUM_PATH||'/usr/bin/chromium',args:['--disable-webgl','--disable-3d-apis']});
 const c=await context(nb,{width:1366,height:900}),p=await open(c,`http://127.0.0.1:${PORT}/${T}/non-calculator-practice/?bm_seed=sol3d-nogl`);recent=[];
 await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});
 const id=await force(p,{family:'washer',tier:'intermediate',calc:'non-calculator',graph:'shown',salt:9300});await next(p);
 await p.click('.u6-3d-btn');await p.waitForTimeout(2500);
 const st=await p.evaluate(()=>({text:document.querySelector('.u6-3d-view')?.textContent,canvas:document.querySelectorAll('.u6-3d-canvas').length,graph:!!document.querySelector('#question figure.u6-figure svg')}));
 out.noWebGL={problem:id,...st,errors:p._errs};if(!/WebGL is not available/.test(st.text||'')||st.canvas||!st.graph||p._errs.length)fail(`no WebGL: ${JSON.stringify(out.noWebGL)}`);
 await nb.close();}
srv.close();
console.log(JSON.stringify(out,null,1));
if(out.failures.length)process.exitCode=1;
