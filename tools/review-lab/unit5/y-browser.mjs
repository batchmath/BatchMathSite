// v12.8.Y in the real pages: (1) Basic Calculator problems whose derivative has a scaled fraction are shown through
// the page's own driver, answered wrong so the explanation appears, and the rendered MathJax (question and
// explanation) must have no number standing directly before a fraction (outside sub/superscripts); (2) screenshots
// for the release report. Usage: node tools/review-lab/unit5/y-browser.mjs <out dir> [count=24] [width=1366] [height=900]
import fs from 'node:fs';import {serve,browser,context,open,randomPort} from '../lib/browser.mjs';
const [OUT,COUNT='24',W='1366',H='900']=process.argv.slice(2);if(!OUT){console.error('usage: y-browser.mjs <out dir> [count] [width] [height]');process.exit(2);}
fs.mkdirSync(OUT,{recursive:true});
const PORT=randomPort(9600),srv=await serve(PORT),b=await browser({scrollbars:true}),c=await context(b,{width:+W,height:+H});
const U5='ap-calculus/unit-5-differential-equations/topics';const out={fractions:0,adjacent:[],errors:[],shots:[]};
async function page(path,seed='y'){const p=await open(c,`http://127.0.0.1:${PORT}/${U5}/${path}/?bm_seed=${seed}`);await p.waitForTimeout(500);return p;}
// make the page's next problem the given engine problem (drawn in the page), then show it with a wrong entry
async function show(p,engineGlobal,opts,wantRe,start){
 const ok=await p.evaluate(({g,opts,want,start})=>{const api=window.BatchMathAPTopicGenerators;let pr;
  for(let i=0;i<500&&!pr;i++){let s=start+i;window.BatchMathRNG={random:()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;}};
   try{const q=window[g].make(opts);if(!want||new RegExp(want).test(q.questionHtml))pr=q;}catch(_){}}
  if(!pr)return false;pr.questionHtml+='<span data-y-marker="1"></span>';window.__pr=pr;api.get=()=>()=>window.__pr;return true;},{g:engineGlobal,opts,want:wantRe,start});
 if(!ok)return false;
 const sel=await p.$('#u5Mode');if(sel){const v=await sel.evaluate(e=>e.value);const other=await sel.evaluate(e=>[...e.options].map(o=>o.value).find(x=>x!==e.value));await p.selectOption('#u5Mode',other);await p.waitForTimeout(200);await p.selectOption('#u5Mode',v);}
 else await p.evaluate(()=>document.getElementById('next')?.click()); // no dropdown: Next is hidden, so redraw through the driver
 await p.waitForTimeout(300);
 if(!(await p.$('#question [data-y-marker]')))return false;
 await p.locator('#choices .unit5-part-1 .bm-calc-editor').first().click();await p.keyboard.type('0');await p.locator('#choices .unit5-part-1 .staged-check').click();await p.waitForTimeout(300);
 await p.evaluate(()=>window.MathJax?.typesetPromise?.()).catch(()=>{});await p.waitForTimeout(500);return true;}
// a number directly before a fraction in rendered MathJax (CHTML), outside scripts
const adjacency=p=>p.evaluate(()=>{const hits=[];for(const f of document.querySelectorAll('#question mjx-mfrac, #choices mjx-mfrac')){if(f.closest('mjx-script'))continue;let prev=f.previousElementSibling;
  while(prev&&/^MJX-(TEXATOM|MROW)$/.test(prev.tagName)&&prev.lastElementChild)prev=prev.lastElementChild;if(prev&&prev.tagName==='MJX-MN')hits.push(f.closest('mjx-container')?.getAttribute('aria-label')||prev.textContent+'·frac');}return hits;});
// 1. Basic Calculator: scaled fractions render with the coefficient in the numerator
{const p=await page('basic-first-order-differential-equations/calculator-practice');
 // the page shows a problem only after its driver ran; replace it with chosen problems
 await p.waitForFunction(()=>window.BatchMathUnit5Last&&window.BatchMathUnit5Basic);
 let shot=false;
 for(let k=0;k<+COUNT;k++){const tier=k%2?'challenging':'intermediate';
  // a derivative that starts with a scaled fraction, such as f'(x)=\frac{3\sin x}{x} or -\frac{2e^{x}}{x}
  if(!(await show(p,'BatchMathUnit5Basic',{family:'calc_value',tier,calc:'calculator'},String.raw`[fgh]'\([xt]\)=-?\\frac\{\d`,1000+k*97)))continue;
  const shown=await p.evaluate(()=>!!document.querySelector('#question mjx-mfrac'));if(!shown){out.errors.push(`problem ${k}: no rendered fraction`);continue;}
  out.fractions++;const hits=await adjacency(p);if(hits.length)out.adjacent.push(...hits);
  if(!shot){const f=`${OUT}/basic-calculator-fraction.png`;await p.locator('.practice-shell').screenshot({path:f});out.shots.push(f);shot=true;}
  // a fresh page for the next problem keeps the driver state simple
  await p.reload();await p.waitForFunction(()=>window.BatchMathUnit5Last&&window.BatchMathUnit5Basic);}
 out.errors.push(...(p._errs||[]));await p.close();}
// 2. screenshots
const shotOf=async(path,name,sel='.practice-shell',seed='y')=>{const p=await page(path,seed);const f=`${OUT}/${name}.png`;await p.locator(sel).first().screenshot({path:f});out.shots.push(f);out.errors.push(...(p._errs||[]));await p.close();};
await shotOf('rate-problems','rate-topic-buttons','[data-bm-topic-practice]');
await shotOf('comprehensive-review','review-topic-buttons','[data-bm-topic-practice]');
{const p=await open(c,`http://127.0.0.1:${PORT}/${U5}/rate-problems/practice/`);await p.waitForURL(u=>u.pathname.endsWith('/rate-problems/'),{timeout:5000}).catch(()=>{});await p.waitForTimeout(400);
 const f=`${OUT}/legacy-rate-practice-lands-on-topic.png`;await p.screenshot({path:f});out.shots.push(f);out.legacyLanded=new URL(p.url()).pathname;out.errors.push(...(p._errs||[]));await p.close();}
{const p=await page('motion-problems/calculator-practice');await p.waitForFunction(()=>window.BatchMathUnit5Last&&window.BatchMathUnit5Motion);
 // a one-part problem, so the wrong entry goes to the total-distance part
 if(await show(p,'BatchMathUnit5Motion',{family:'calc_distance',tier:'intermediate',calc:'calculator'},String.raw`Use your calculator\.<`,4242)){const f=`${OUT}/motion-calculator-distance-speed.png`;await p.locator('.practice-shell').screenshot({path:f});out.shots.push(f);}
 out.errors.push(...(p._errs||[]));await p.close();}
await shotOf('separable-differential-equations/practice','separable-no-dropdown');
await shotOf('comprehensive-review/calculator-practice','calculator-review');
await shotOf('comprehensive-review/non-calculator-practice','non-calculator-review');
// the menus as listed (a native dropdown cannot be screenshotted open)
out.menus={};for(const path of ['basic-first-order-differential-equations/calculator-practice','basic-first-order-differential-equations/non-calculator-practice','motion-problems/calculator-practice','motion-problems/non-calculator-practice','slope-fields/practice','separable-differential-equations/practice','exponential-growth-and-decay-interest-newton-s-law-of-cooling/practice','rate-problems/calculator-practice','rate-problems/non-calculator-practice','comprehensive-review/calculator-practice','comprehensive-review/non-calculator-practice']){
 const p=await page(path);out.menus[path]=await p.$$eval('#u5Mode option',os=>os.map(o=>o.textContent));out.errors.push(...(p._errs||[]).map(e=>`${path}: ${e}`));await p.close();}
console.log(JSON.stringify(out,null,1));await b.close();srv.close();if(out.adjacent.length||out.errors.length||out.fractions<+COUNT/2)process.exitCode=1;
