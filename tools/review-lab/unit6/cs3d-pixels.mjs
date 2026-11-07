// v13.0.C: the cross-section models are unchanged by the shared scene code. For every link in LOCAL-TESTING.txt's
// Volume by Cross Sections list (every shape in both directions, and calculator questions after Part A), the same
// question is opened in two site trees (BM_OLD and BM_NEW: ports of servers already running), the model is opened, and
// the drawn canvas (pixel by pixel), the geometry read back from the GPU buffers and the camera are compared.
// Usage: BM_OLD=<port> BM_NEW=<port> node tools/review-lab/unit6/cs3d-pixels.mjs <LOCAL-TESTING.txt of the old tree>
import fs from 'node:fs';
import {browser,context,open} from '../lib/browser.mjs';
const links=[...fs.readFileSync(process.argv[2],'utf8').matchAll(/http:\/\/localhost:8000(\/\S*volume-by-cross-sections\S+\?bm_seed=\S+)/g)].map(m=>m[1]);
const b=await browser(),out={links:links.length,identical:0,results:[],failures:[]};
async function shot(port,path){
 const c=await context(b,{width:1100,height:800}),p=await open(c,`http://127.0.0.1:${port}${path}`);await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});await p.waitForTimeout(300);
 if(path.includes('/calculator-practice/')){const tex=await p.evaluate(()=>window.BatchMathUnit5Last.parts[0].answerTex);
  await p.locator('#choices .unit5-part-1 math-field').first().evaluate((e,l)=>{e.focus();e.executeCommand(['insert',l]);e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true}));},tex);
  await p.waitForTimeout(120);await p.locator('#choices .unit5-part-1 .staged-check').click();await p.waitForTimeout(800);}
 await p.click('.u6-3d-btn');await p.waitForFunction(()=>window.BatchMathCrossSections3D.state?.viewer,null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(400);
 const png=(await p.locator('.u6-3d-canvas').screenshot()).toString('base64');
 const st=await p.evaluate(()=>{const v=window.BatchMathCrossSections3D.state.viewer;return{id:window.BatchMathUnit5Last.id,drawn:JSON.stringify(v.drawn()),highlight:JSON.stringify(v.highlight),bounds:JSON.stringify(v.bounds),camera:[v.distance,v.azimuth,v.polar].map(x=>+x.toFixed(9)).join(','),label:document.querySelector('.u6-3d-canvas').getAttribute('aria-label'),legend:document.querySelector('.u6-3d-legend').innerHTML,frames:v.frames};});
 const errs=p._errs;await c.close();return{png,st,errs};
}
const decode=async png=>{const c=await context(b,{width:200,height:200}),p=await c.newPage();const r=await p.evaluate(async png=>{const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);return{w:c.width,h:c.height,d:Array.from(g.getImageData(0,0,c.width,c.height).data)};},png);await c.close();return r;};
for(const path of links){
 const A=await shot(process.env.BM_OLD,path),B=await shot(process.env.BM_NEW,path);
 let diff=0,maxd=0;
 if(A.png!==B.png){const a=await decode(A.png),bb=await decode(B.png);if(a.w!==bb.w||a.h!==bb.h)diff=-1;else for(let i=0;i<a.d.length;i+=4){const d=Math.max(...[0,1,2].map(k=>Math.abs(a.d[i+k]-bb.d[i+k])));if(d){diff++;maxd=Math.max(maxd,d);}}}
 const same=['id','drawn','highlight','bounds','camera','label','legend'].filter(k=>A.st[k]!==B.st[k]);
 const r={link:path.split('?')[1],calc:path.includes('/calculator-practice/'),pngIdentical:A.png===B.png,pixelsDiffering:diff,maxChannelDiff:maxd,stateDiffers:same,errors:[...A.errs,...B.errs]};out.results.push(r);
 if(r.pngIdentical&&!same.length&&!r.errors.length)out.identical++;else out.failures.push(r);
}
await b.close();console.log(JSON.stringify(out,null,1));if(out.failures.length)process.exitCode=1;
