// v12.9.D: every split explanation's displays fit on phones. The explanations of many generated Unit 6 problems (the
// steps that split an integral, with their piecewise braces or per-piece lines) are rendered inside the real feedback
// container of a Unit 6 practice page, with the page's own CSS and MathJax, at 360, 375, 390 and 1366 px. A brace row
// cannot wrap, so each display's rendered width must not exceed its container. Also: no raw TeX, no MathJax errors.
// Usage: node tools/review-lab/unit6/piecewise-fit.mjs [problems per family, tier and kind=30]
import {serve,browser,context,open,randomPort} from '../lib/browser.mjs';
import {load} from './qa/lib.mjs';
const N=+(process.argv[2]||30);
const L=load(['unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js']);L.ctx.console={...console,warn(){}};
const W=L.W,ENG=[['BatchMathUnit6Area','make','FAMILIES'],['BatchMathUnit6Area','makeY','FAMILIES_Y'],['BatchMathUnit6Volume','makeCS','FAMILIES_CS'],['BatchMathUnit6Volume','makeSolid','FAMILIES_SOLID'],['BatchMathUnit6FRQ','make','FAMILIES']];
const kt=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});
const steps=new Set();
for(const [o,mk,FK] of ENG)for(const [fam,f] of Object.entries(W[o][FK]))for(const kind of ['calculator','non-calculator'])for(const tier of kt(f)[kind==='calculator'?'calculator':'noncalculator'])for(let i=0;i<N;i++){
 L.seed(i*7919+fam.length*131+tier.length*17+kind.length+5);let p;try{p=W[o][mk]({family:fam,tier,calc:kind});}catch(e){continue;}
 for(const q of p.parts)for(const m of String(q.explanation||'').matchAll(/<div class="u4-work-step"><strong>Split the integral at[\s\S]*?(?=<div class="u4-work-step">|$)/g))steps.add(m[0]);
}
const list=[...steps],PORT=randomPort(9760),srv=await serve(PORT),b=await browser({scrollbars:true}),out={steps:list.length,widths:{}};
for(const [w,h,mob] of [[360,740,true],[375,812,true],[390,844,true],[1366,768,false]]){
 const c=await context(b,{width:w,height:h,mobile:mob});
 const p=await open(c,`http://127.0.0.1:${PORT}/ap-calculus/unit-6-applications-integration/topics/volume-by-cross-sections/non-calculator-practice/?bm_seed=fit`);
 await p.waitForSelector('#choices .unit5-part-1',{timeout:20000});
 const r=await p.evaluate(async list=>{
  const host=document.querySelector('#choices .unit5-part-1'),box=document.createElement('div');box.className='unit4-revised-answer staged-feedback';host.appendChild(box);
  box.innerHTML=list.map(s=>`<div class="staged-explanation">${s}</div>`).join('');
  await window.MathJax.typesetPromise([box]);
  const res={braces:0,lines:0,overflowBraces:[],overflowLines:0,raw:/\\\(|\\\)|\\begin\{cases\}/.test(box.innerText),merror:box.querySelectorAll('mjx-merror').length};
  for(const d of box.querySelectorAll('.u4-work-equation')){const m=d.querySelector('mjx-container');if(!m)continue;
   const need=Math.max(...[...m.querySelectorAll('mjx-math')].map(x=>x.getBoundingClientRect().width),m.getBoundingClientRect().width),have=d.clientWidth,brace=d.classList.contains('u6-piecewise');
   if(brace)res.braces++;else res.lines++;
   if(need>have+0.5){if(brace)res.overflowBraces.push(`${Math.round(need)}>${have}: ${d.textContent.slice(0,60)}`);else res.overflowLines++;}}
  return res;},list);
 out.widths[w]={...r,overflowBraces:r.overflowBraces.length,examples:r.overflowBraces.slice(0,3),errors:p._errs.length};await c.close();
}
await b.close();srv.close();
console.log(JSON.stringify(out,null,1));
if(Object.values(out.widths).some(x=>x.overflowBraces||x.raw||x.merror||x.errors))process.exitCode=1;
