// v13.0.D: the default (Transparent) look of every Unit 6 3D model is unchanged. For every link in LOCAL-TESTING.txt
// (Volume by Cross Sections: every shape in both directions and calculator questions; Solids of Revolution: every
// family), the same question is opened in two site trees (BM_OLD and BM_NEW: ports of servers already running), each
// model is opened at its stage (answering the parts in order when the model appears in an explanation), and the drawn
// canvas (byte for byte), the geometry read back from the GPU buffers, the camera, the aria label and the legend are
// compared.
// Usage: BM_OLD=<port> BM_NEW=<port> node tools/review-lab/unit6/pixels3d.mjs <LOCAL-TESTING.txt>
import fs from 'node:fs';
import {browser,context,open} from '../lib/browser.mjs';
const links=[...fs.readFileSync(process.argv[2],'utf8').matchAll(/http:\/\/localhost:8000(\/\S+\?bm_seed=\S+)/g)].map(m=>m[1]);
const b=await browser(),out={links:links.length,models:0,identical:0,results:[],failures:[]};
async function models(port,path){
 const c=await context(b,{width:1100,height:820}),p=await open(c,`http://127.0.0.1:${port}${path}`);await p.waitForSelector('#choices math-field',{timeout:20000}).catch(()=>{});await p.waitForTimeout(300);
 const solids=path.includes('solids-of-revolution'),res=[];
 const nParts=await p.evaluate(()=>window.BatchMathUnit5Last.parts.length);
 const capture=async()=>{for(const w of await p.$$('.u6-3d:not([data-done])')){await w.evaluate(e=>e.dataset.done='1');await (await w.$('.u6-3d-btn')).click();await p.waitForTimeout(1500);
   const png=(await (await w.$('.u6-3d-canvas')).screenshot()).toString('base64');
   const st=await w.evaluate(w=>{const v=w.querySelector('.u6-3d-canvas').__bm3d;return{drawn:JSON.stringify(v.drawn()),camera:[v.distance,v.azimuth,v.polar].map(x=>+x.toFixed(9)).join(','),label:w.querySelector('.u6-3d-canvas').getAttribute('aria-label'),legend:w.querySelector('.u6-3d-legend').innerHTML,rotation:w.dataset.rotation||'0'};});
   res.push({png,st});}};
 await capture();
 const typed=async k=>{const tex=await p.evaluate(k=>{const q=window.BatchMathUnit5Last.parts[k];return q.control==='u6-expr'?q.answerTex.slice(q.prefix.length):q.answerTex;},k);
  await p.locator(`#choices .unit5-part-${k+1} math-field`).first().evaluate((e,l)=>{e.focus();e.executeCommand(['insert',l]);e.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true}));},tex);
  await p.waitForTimeout(120);await p.locator(`#choices .unit5-part-${k+1} .staged-check`).click();await p.waitForTimeout(800);};
 for(let k=0;k<nParts&&(solids||path.includes('calculator-practice'));k++){await typed(k);await capture();if(k+1<nParts){await p.click(`#choices .unit5-part-${k+1} .staged-continue`);await p.waitForTimeout(500);await capture();}}
 const errs=p._errs;await c.close();return{res,errs};
}
for(const path of links){
 const A=await models(process.env.BM_OLD,path),B=await models(process.env.BM_NEW,path);
 const r={link:path.replace(/^.*topics\//,''),models:[A.res.length,B.res.length],differ:[],errors:[...A.errs,...B.errs]};
 if(A.res.length!==B.res.length||!A.res.length)r.differ.push('number of models');
 A.res.forEach((a,i)=>{const n=B.res[i];if(!n)return;out.models++;const d=['drawn','camera','label','legend','rotation'].filter(k=>a.st[k]!==n.st[k]);if(a.png!==n.png)d.push('pixels');if(d.length)r.differ.push(`model ${i+1}: ${d}`);else out.identical++;});
 out.results.push(r);if(r.differ.length||r.errors.length)out.failures.push(r);
}
await b.close();console.log(JSON.stringify(out,null,1));if(out.failures.length)process.exitCode=1;
