// v13.0.D: the Transparent / Opaque display control of the Unit 6 3D models, in Chromium with the real pages, at
// 1366x900 (mouse and keyboard) and 390x844 (touch). Volume by Cross Sections: all eight shapes (both directions on the
// desktop, alternating on the phone). Solids of Revolution: all seven families, plus washers whose region stays away from
// the axis (a hole along the whole solid), about horizontal and vertical axes. For every model:
//  - it opens Transparent (the control says so) with the solid's materials exactly as saved (the v13.0.A-C look);
//  - after a rotation and a zoom, Opaque (click, Enter/Space, or tap) switches at once: one redraw, the same viewer and
//    canvas, the same geometry buffers (by id), the same camera; the solid's materials are opaque and write depth; a
//    pixel where a ray actually hits the solid's surface turns from the dark see-through blend into solid blue;
//  - the highlighted slice stays visible: its hidden parts are drawn (dashed rim, faint film), measured by switching
//    those copies off and on (the pixels they change, at least 10), and its labels remain;
//  - washers with a hole: looking down the axis, a ray at a fraction of the least inner radius misses the solid (by ray
//    casting the geometry) and its pixel is not solid blue in Opaque mode: the hole stays open;
//  - Reset view in Opaque mode restores the starting view and keeps Opaque; back to Transparent, the picture is the
//    same, byte for byte, as before Opaque was ever chosen; the choice is kept when the model is hidden and shown again,
//    and a new question starts Transparent; hiding releases every GPU geometry and texture (the faint copies too);
//  - no console errors, no page wider than the screen.
// Pictures are read from the WebGL canvas itself (the viewer's snapshot hook), so nothing on the page that overlaps it
// (a keypad on the phone, a scrolled header) can change them.
// Usage: node tools/review-lab/unit6/display3d-browser.mjs   (screenshots in $REVIEW_OUT/unit6/3d-d)
//        BM_PORT=<port>: use a server already running on 127.0.0.1:<port> (an extracted ZIP)
import {serve,browser,context,open,randomPort,outDir} from '../lib/browser.mjs';
const T='ap-calculus/unit-6-applications-integration/topics';
const SHAPES=['square','rect2','rect3','semicircle_d','quarter','equilateral','iso_leg','iso_hyp'];
const CS_REGION={x:['cap','disk','pair','triangle','under_root','semicircle','half_cap','under_power'],y:['cap','disk','triangle','pair','under_root','semicircle','half_cap','left_of_power']};
const SOLIDS=[{family:'disk_basic',tier:'foundational',calc:'non-calculator',graph:'shown'},{family:'washer',tier:'intermediate',calc:'non-calculator',graph:'shown',kind:'washer'},
 {family:'shells',tier:'intermediate',calc:'non-calculator',graph:'shown'},{family:'two_axes',tier:'challenging',calc:'non-calculator',graph:'shown'},
 {family:'trig_solid',tier:'intermediate',calc:'non-calculator',graph:'shown'},{family:'solid_calc',tier:'intermediate',calc:'calculator'},{family:'calc_two_axes',tier:'challenging',calc:'calculator'},
 {family:'washer',tier:'challenging',calc:'non-calculator',graph:'shown',kind:'washer',hole:true,axisType:'y'},{family:'washer',tier:'intermediate',calc:'non-calculator',graph:'shown',kind:'washer',hole:true,axisType:'x'}];
const shots=outDir('unit6','3d-d'),PORT=process.env.BM_PORT?+process.env.BM_PORT:randomPort(9870),srv=process.env.BM_PORT?{close(){}}:await serve(PORT),b=await browser();
const out={runs:[],failures:[]};const fail=m=>out.failures.push(m);
let recent=[];
async function force(p,want){
 const id=await p.evaluate(want=>{
  const rng=seed=>{let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}};
  const V=window.BatchMathUnit6Volume,saved=window.BatchMathRNG;let hit=null;const key=d=>d&&(d.shape==='rect'?`rect${d.mult}`:d.shape);
  try{for(let s=1;s<80000&&!hit;s++){window.BatchMathRNG={random:rng(s*7+want.salt)};let q;
   try{q=want.cs?V.makeCS({family:'cs_basic',tier:'foundational',calc:'non-calculator'}):V.makeSolid({family:want.family,tier:want.tier,calc:want.calc});}catch(e){continue;}
   if((want.avoid||[]).includes(q.id))continue;
   if(want.cs){if(q.unit5Meta.region===want.region&&q.unit5Meta.dir===want.dir&&key(q.u6Solid)===want.shape)hit=q;continue;}
   const d=q.u6Revolution,r=d&&d.rotations[0];if(!d||(want.graph&&d.graph!==want.graph)||(want.kind&&r.kind!==want.kind)||(want.axisType&&r.axis.type!==want.axisType))continue;
   if(want.hole){// the region stays away from the axis everywhere: a hole along the whole solid
    const ps=d.xs||d.ys,X=!!d.xs;let m=Infinity;for(const pc of ps)for(let k=0;k<=200;k++){const t=pc.a+(pc.b-pc.a)*k/200;for(const w of [pc.bot(t),pc.top(t)]){const [x,y]=X?[t,w]:[w,t];m=Math.min(m,Math.abs(r.axis.type==='y'?y-r.axis.c:x-r.axis.c));}}
    if(!(m>0.4))continue;}
   hit=q;}}finally{window.BatchMathRNG=saved;}
  if(!hit)return null;
  const api=window.BatchMathAPTopicGenerators;if(!api.__orig){api.__orig=api.get;api.get=s=>{const g=api.__orig(s);return g&&(o=>{if(window.__force){const f=window.__force;window.__force=null;window.BatchMathUnit5Last=f;return f;}return g(o);});};}
  window.__force=hit;return hit.id;},{...want,avoid:recent});
 if(id){recent.push(id);recent=recent.slice(-6);}return id;
}
async function next(p){const cur=await p.$eval('#u6Mode',e=>e.value),opts=await p.$$eval('#u6Mode option',o=>o.map(x=>x.value));await p.selectOption('#u6Mode',opts.find(v=>v!==cur&&v!=='mixed')||opts.find(v=>v!==cur));await p.waitForTimeout(800);}
const API=cs=>cs?'BatchMathCrossSections3D':'BatchMathSolids3D';
// the viewer info of the first model on the page
const vinfo='';
async function openPage(c,url){await c.addInitScript(()=>{window.__v=api=>{const s=window[api]?.state;return s&&(s.viewer||s.models?.find(m=>m?.viewer)?.viewer)||null;};});return open(c,url);}
const st=(p,cs)=>p.evaluate(([api,f])=>{const v=window.__v(api);if(!v)return null;const c=v.__canvas||null;return{display:v.display,frames:v.frames,az:v.azimuth,d:v.distance,polar:v.polar,ghosts:v.ghosts,mat:v.materials(),saved:v.savedMaterials(),ids:v.geometryIds().join(','),
 pressed:[...document.querySelectorAll('.u6-3d')[0].querySelectorAll('.u6-3d-mode')].map(b=>b.dataset.mode+':'+b.getAttribute('aria-pressed')).join(' '),marker:document.querySelector('.u6-3d-canvas')?.__mark||null,memory:v.memory};},[API(cs),vinfo]);
// (always at the same place on the screen, the mouse away: clicking a control can scroll the page, and a screenshot of
// the canvas then includes what overlaps it there)
// (read straight from the WebGL canvas right after a redraw of the model as it is: nothing on the page that overlaps the
// canvas, such as a keypad, can change it)
async function canvasPng(p){return p.evaluate(()=>document.querySelector('.u6-3d-canvas').__bm3d.snapshot().split(',')[1]);}
const changed=(a,b)=>{let n=0;for(let i=0;i<a.data.length;i+=4)if(Math.max(Math.abs(a.data[i]-b.data[i]),Math.abs(a.data[i+1]-b.data[i+1]),Math.abs(a.data[i+2]-b.data[i+2]))>8)n++;return n;};
async function decode(p,png){return p.evaluate(async png=>{const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);return{w:c.width,h:c.height,data:Array.from(g.getImageData(0,0,c.width,c.height).data)};},png);}
const yellowCount=im=>{let n=0;for(let i=0;i<im.data.length;i+=4){const [r,g,bb]=[im.data[i],im.data[i+1],im.data[i+2]];if(r>140&&g>120&&bb<110&&r-bb>70)n++;}return n;};
const pix=(im,x,y,dpr)=>{const X=Math.round(x*dpr),Y=Math.round(y*dpr),k=(Y*im.w+X)*4;return[im.data[k],im.data[k+1],im.data[k+2]];};
// a canvas point (CSS px) where a ray hits the solid, with its 3x3 neighbours hitting it too
// (candidates nearest first; the test then keeps one whose transparent pixel is plain see-through blue, not the
// highlighted slice, the axis, a label or a line)
async function surfacePoints(p,cs){
 return p.evaluate(([api,f])=>{const v=window.__v(api),c=document.querySelector('.u6-3d-canvas'),W=c.clientWidth,H=c.clientHeight,all=[];
  for(let gy=0.2;gy<=0.8;gy+=0.04)for(let gx=0.15;gx<=0.85;gx+=0.04){const x=W*gx,y=H*gy;if(![-3,0,3].every(dx=>[-3,0,3].every(dy=>v.hitSolid(x+dx,y+dy))))continue;all.push({x,y,d:v.hitSolid(x,y).distance});}
  return all.sort((a,b)=>a.d-b.d);},[API(cs),vinfo]);
}
const plainBlue=([r,g,b])=>b>r+40&&g>r&&b>=g,notOverlay=([r,g,b])=>!(r>170&&b<110)&&!(r>200&&g<140&&b>110);
async function clickMode(p,mode,how,mob){const sel=`.u6-3d-mode[data-mode="${mode}"]`;
 if(how==='keyboard'){await p.focus(sel,{timeout:5000});await p.keyboard.press(mode==='opaque'?'Space':'Enter');}else if(mob)await p.tap(sel);else await p.click(sel);await p.waitForTimeout(250);}
async function drag(p,mob,cdp){const r=await p.locator('.u6-3d-canvas').first().boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
 if(!mob){await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+90,y+25,{steps:10});await p.mouse.up();await p.mouse.wheel(0,-240);}
 else{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+6*i,y:y+2*i,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-20,y,id:1},{x:x+20,y,id:2}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-20-i*5,y,id:1},{x:x+20+i*5,y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 await p.waitForTimeout(250);}
async function typePart(p,k){const part=await p.evaluate(k=>{const q=window.BatchMathUnit5Last.parts[k];return{tex:q.control==='u6-expr'?q.answerTex.slice(q.prefix.length):q.answerTex};},k);
 await p.locator(`#choices .unit5-part-${k+1} math-field`).first().evaluate((e,l)=>{e.focus();e.executeCommand(['insert',l]);e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true}));},part.tex);
 await p.waitForTimeout(120);await p.locator(`#choices .unit5-part-${k+1} .staged-check`).click();await p.waitForTimeout(700);}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
async function exercise(p,cs,tag,run,{mob,cdp,hole,shot}){
 const dpr=await p.evaluate(()=>Math.min(2,window.devicePixelRatio||1));
 await p.click('.u6-3d-btn');await p.waitForFunction(([api,f])=>!!window.__v(api),[API(cs),vinfo],{timeout:20000}).catch(()=>{});await p.waitForTimeout(300);
 await p.evaluate(()=>{document.querySelector('.u6-3d-canvas').__mark='first';});
 let s0=await st(p,cs);if(!s0){fail(`${tag}: the model did not open`);return;}
 run.start={display:s0.display,pressed:s0.pressed,materials:s0.mat};
 if(s0.display!=='transparent'||s0.pressed!=='transparent:true opaque:false'||!same(s0.mat,s0.saved)||s0.ghosts)fail(`${tag}: does not open Transparent: ${JSON.stringify(run.start)}`);
 const home=await canvasPng(p);
 await drag(p,mob,cdp);const s1=await st(p,cs),t1=await canvasPng(p);
 // Opaque: immediate, nothing rebuilt, view kept
 await clickMode(p,'opaque',mob?'tap':'click',mob);const s2=await st(p,cs);
 run.opaque={frames:s2.frames-s1.frames,camera:same([s1.az,s1.d,s1.polar],[s2.az,s2.d,s2.polar]),sameGeometry:s1.ids===s2.ids,sameCanvas:s2.marker==='first',materials:s2.mat,ghosts:s2.ghosts,pressed:s2.pressed};
 if(s2.display!=='opaque'||s2.pressed!=='transparent:false opaque:true')fail(`${tag}: Opaque not selected: ${JSON.stringify(run.opaque)}`);
 if(run.opaque.frames!==1||!run.opaque.camera||!run.opaque.sameGeometry||!run.opaque.sameCanvas)fail(`${tag}: switching to Opaque rebuilt or moved something: ${JSON.stringify(run.opaque)}`);
 if(!s2.mat.every(m=>m.transparent===false&&m.opacity===1&&m.depthWrite===true))fail(`${tag}: the solid is not opaque: ${JSON.stringify(s2.mat)}`);
 // a pixel on the solid's surface: dark see-through blend -> solid blue
 const o=await decode(p,await canvasPng(p)),t=await decode(p,t1),sp=(await surfacePoints(p,cs)).find(q=>[[-2,-2],[0,0],[2,2],[-2,2],[2,-2]].every(([dx,dy])=>notOverlay(pix(t,q.x+dx,q.y+dy,dpr))&&plainBlue(pix(o,q.x+dx,q.y+dy,dpr))));
 if(!sp)fail(`${tag}: no plain canvas point found on the solid`);
 else{const po=pix(o,sp.x,sp.y,dpr),pt=pix(t,sp.x,sp.y,dpr);run.surfacePixel={transparent:pt,opaque:po};
  if(!(po[2]>=120&&po[2]>po[0]+25&&po[0]+po[1]+po[2]>pt[0]+pt[1]+pt[2]+40))fail(`${tag}: the surface pixel is not opaque blue: transparent ${pt}, opaque ${po}`);}
 // the highlighted slice stays visible: what its hidden copies add
 const withImg=await decode(p,await canvasPng(p));await p.evaluate(([api,f])=>window.__v(api).testGhosts(false),[API(cs),vinfo]);
 const withoutImg=await decode(p,await canvasPng(p));await p.evaluate(([api,f])=>window.__v(api).testGhosts(true),[API(cs),vinfo]);
 run.hiddenSlice={pixelsDrawnForHiddenParts:changed(withImg,withoutImg),yellowWith:yellowCount(withImg),yellowWithout:yellowCount(withoutImg)};
 if(run.hiddenSlice.pixelsDrawnForHiddenParts<10)fail(`${tag}: the hidden parts of the highlighted slice are not drawn (${JSON.stringify(run.hiddenSlice)})`);
 if(shot)await p.locator('.u6-3d').first().screenshot({path:`${shots}/${shot}-opaque.png`});
 // a hole along the axis stays open
 if(hole){const h=await p.evaluate(([api,f])=>{const v=window.__v(api),d=window.BatchMathUnit5Last.u6Revolution,r=d.rotations[0],ax=r.axis,ps=d.xs||d.ys,X=!!d.xs;let m=Infinity,a0=Infinity,a1=-Infinity;
   for(const pc of ps)for(let k=0;k<=400;k++){const t=pc.a+(pc.b-pc.a)*k/400;for(const w of [pc.bot(t),pc.top(t)]){const [x,y]=X?[t,w]:[w,t];m=Math.min(m,Math.abs(ax.type==='y'?y-ax.c:x-ax.c));const al=ax.type==='y'?x:y;a0=Math.min(a0,al);a1=Math.max(a1,al);}}
   v.look(ax.type==='y'?[1,0.004,0.006]:[0.006,1,0.004]);const mid=(a0+a1)/2;
   for(const f of [0.3,0.15,0.08]){const P=ax.type==='y'?[mid,ax.c,f*m]:[ax.c,mid,f*m],q=v.project(P);if(!v.hitSolid(q.x,q.y))return{least:m,fraction:f,x:q.x,y:q.y};}
   return{least:m,blocked:true};},[API(cs),vinfo]);
  run.hole=h;if(h.blocked)fail(`${tag}: every ray down the axis hits the solid (least radius ${h.least})`);
  else{const im=await decode(p,await canvasPng(p)),c=pix(im,h.x,h.y,dpr);run.hole.pixel=c;if(c[2]>110&&c[2]>c[0]+30)fail(`${tag}: the hole is drawn blue in Opaque mode (${c})`);
   if(shot)await p.locator('.u6-3d').first().screenshot({path:`${shots}/${shot}-hole.png`});}}
 // keyboard: Enter on Transparent, Space on Opaque (desktop)
 if(!mob){await clickMode(p,'transparent','keyboard');const k1=await st(p,cs);await clickMode(p,'opaque','keyboard');const k2=await st(p,cs);run.keyboard=[k1.display,k2.display];if(k1.display!=='transparent'||k2.display!=='opaque')fail(`${tag}: keyboard ${run.keyboard}`);}
 // Reset view keeps Opaque; Transparent then gives back exactly the first picture
 await p.click('.u6-3d .u6-3d-reset');await p.waitForTimeout(200);const s3=await st(p,cs);
 run.reset={display:s3.display,home:same([s3.az,s3.d,s3.polar],[s0.az,s0.d,s0.polar])};if(s3.display!=='opaque'||!run.reset.home)fail(`${tag}: Reset view ${JSON.stringify(run.reset)}`);
 await clickMode(p,'transparent',mob?'tap':'click',mob);const s4=await st(p,cs),back=await canvasPng(p);
 run.restored={materials:same(s4.mat,s0.saved),identicalPicture:back===home};
 if(!run.restored.materials||!run.restored.identicalPicture)fail(`${tag}: Transparent does not restore the original look: ${JSON.stringify(run.restored)}`);
 // kept when hidden and shown again; hiding releases everything
 await clickMode(p,'opaque',mob?'tap':'click',mob);
 const n0=await p.evaluate(api=>window[api].disposals.length,API(cs));await p.click('.u6-3d-btn');await p.waitForTimeout(200);
 const rel=await p.evaluate(([api,n0])=>window[api].disposals.slice(n0),[API(cs),n0]);run.released=rel;
 if(rel.length!==1||rel[0].geometries||rel[0].textures)fail(`${tag}: hiding left GPU memory ${JSON.stringify(rel)}`);
 await p.click('.u6-3d-btn');await p.waitForFunction(([api,f])=>!!window.__v(api),[API(cs),vinfo],{timeout:20000}).catch(()=>{});await p.waitForTimeout(200);
 const s5=await st(p,cs);run.reopened={display:s5?.display,pressed:s5?.pressed};if(!s5||s5.display!=='opaque'||s5.pressed!=='transparent:false opaque:true'||!s5.mat.every(m=>m.opacity===1))fail(`${tag}: the choice was not kept on reopening: ${JSON.stringify(run.reopened)}`);
}
for(const [vi,[w,h,mob]] of [[1366,900,false],[390,844,true]].entries()){
 const vp=`${w}x${h}`;
 // ---- Volume by Cross Sections ----
 if(!process.env.ONLY){recent=[];const c=await context(b,{width:w,height:h,mobile:mob}),p=await openPage(c,`http://127.0.0.1:${PORT}/${T}/volume-by-cross-sections/non-calculator-practice/?bm_seed=disp-${w}`),cdp=mob?await c.newCDPSession(p):null;
  await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});let salt=vi*300,i=0;
  const cases=mob?SHAPES.map((s,k)=>[s,k%2?'y':'x']):[...SHAPES.map(s=>[s,'x']),...SHAPES.map(s=>[s,'y'])];
  for(const [shape,dir] of cases){i++;const region=CS_REGION[dir][i%8],tag=`${vp} cross sections ${shape} ${dir} ${region}`,run={viewport:vp,engine:'cross sections',shape,dir,region};out.runs.push(run);
   const id=await force(p,{cs:true,shape,dir,region,salt:++salt});if(!id){fail(`${tag}: not generated`);continue;}await next(p);
   if(await p.evaluate(()=>window.BatchMathUnit5Last.id)!==id){fail(`${tag}: not shown`);continue;}
   try{await exercise(p,true,tag,run,{mob,cdp,shot:!mob||i<3?`cs-${shape}-${dir}-${w}`:null});}
   catch(e){fail(`${tag}: ${String(e.message).split('\n')[0]}`);}}
  // a new question starts Transparent
  {const id=await force(p,{cs:true,shape:'square',dir:'x',region:'cap',salt:777+vi});await next(p);const pr=await p.evaluate(()=>[...document.querySelectorAll('.u6-3d-mode')].map(b=>b.dataset.mode+':'+b.getAttribute('aria-pressed')).join(' '));
   out[`newQuestion ${vp} cs`]=pr;if(pr!=='transparent:true opaque:false')fail(`${vp} cs: a new question does not start Transparent (${pr})`);}
  const lay=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);if(lay>0)fail(`${vp} cs: page wider than the screen`);
  out[`errors ${vp} cs`]=p._errs.length;for(const e of p._errs)fail(`${vp} cs: ${e}`);await c.close();}
 // ---- Solids of Revolution ----
 for(const page of ['non-calculator-practice','calculator-practice'].filter(x=>!process.env.ONLY||x===process.env.ONLY)){
  recent=[];const c=await context(b,{width:w,height:h,mobile:mob}),p=await openPage(c,`http://127.0.0.1:${PORT}/${T}/solids-of-revolution/${page}/?bm_seed=disp-${w}`),cdp=mob?await c.newCDPSession(p):null;
  await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});let salt=1000+vi*300,i=0;
  for(const want of SOLIDS.filter(s=>(s.calc==='calculator')===(page==='calculator-practice'))){i++;const tag=`${vp} solids ${want.family}${want.hole?` hole about ${want.axisType==='y'?'y = c':'x = c'}`:''}`,run={viewport:vp,engine:'solids',...want};out.runs.push(run);
   const id=await force(p,{...want,salt:++salt});if(!id){fail(`${tag}: not generated`);continue;}await next(p);
   if(await p.evaluate(()=>window.BatchMathUnit5Last.id)!==id){fail(`${tag}: not shown`);continue;}
   run.problem=await p.evaluate(()=>{const d=window.BatchMathUnit5Last.u6Revolution;return d.rotations.map(r=>`${r.axisTex} ${r.kind}`).join(', ');});
   // calculator: the model appears after Part A is checked
   if(!(await p.$('.u6-3d-btn')))await typePart(p,0);
   try{await exercise(p,false,tag,run,{mob,cdp,hole:!!want.hole,shot:`sol-${want.family}${want.hole?'-hole-'+want.axisType:''}-${w}`});}
   catch(e){fail(`${tag}: ${String(e.message).split('\n')[0]} (page: ${await p.evaluate(()=>({id:window.BatchMathUnit5Last?.id,wraps:document.querySelectorAll('.u6-3d').length,active:document.activeElement?.className})).then(JSON.stringify).catch(()=>'?')})`);}}
  {const id=await force(p,{...SOLIDS.find(s=>(s.calc==='calculator')===(page==='calculator-practice')),salt:1777+vi});await next(p);if(!(await p.$('.u6-3d-btn')))await typePart(p,0);
   const pr=await p.evaluate(()=>[...document.querySelectorAll('.u6-3d-mode')].map(b=>b.dataset.mode+':'+b.getAttribute('aria-pressed')).join(' '));out[`newQuestion ${vp} ${page}`]=pr;if(pr!=='transparent:true opaque:false')fail(`${vp} ${page}: a new question does not start Transparent (${pr})`);}
  const lay=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);if(lay>0)fail(`${vp} ${page}: page wider than the screen`);
  out[`errors ${vp} ${page}`]=p._errs.length;for(const e of p._errs)fail(`${vp} ${page}: ${e}`);await c.close();}
}
await b.close();srv.close();
console.log(JSON.stringify(out,null,1));
if(out.failures.length)process.exitCode=1;
