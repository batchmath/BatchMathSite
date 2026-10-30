// v12.8.X screenshots for the release report: a topic page with its three practice buttons, a rounding rejection, a
// calculator total-distance explanation, a Separable exponent-law explanation, a non-calculator Rate answer with π,
// and the Calculator Review. Each problem is drawn from the page's own engine with a fixed family and tier, shown
// through the page's real driver and UI, and answered with the given entry (a wrong entry shows the correct answer and
// the worked explanation). Usage: node tools/review-lab/unit5/evidence.mjs <out dir> [width=1366] [height=900]
import {serve,browser,context,open,randomPort} from '../lib/browser.mjs';
const [OUT,W='1366',H='900']=process.argv.slice(2);if(!OUT){console.error('usage: evidence.mjs <out dir> [width] [height]');process.exit(2);}
const fs=await import('node:fs');fs.mkdirSync(OUT,{recursive:true});
const PORT=randomPort(9300),srv=await serve(PORT),b=await browser({scrollbars:true}),c=await context(b,{width:+W,height:+H});
const U5='ap-calculus/unit-5-differential-equations/topics';const shots=[];
async function page(path){const p=await open(c,`http://127.0.0.1:${PORT}/${U5}/${path}/?bm_seed=evidence`);await p.waitForTimeout(600);return p;}
// show one engine problem (made in the page) and enter `entry` in its first part
async function show(path,name,engineGlobal,opts,entry){
 const p=await page(path);
 await p.waitForFunction(g=>window[g]&&window.BatchMathUnit5Last,engineGlobal);
 await p.evaluate(({g,opts})=>{const api=window.BatchMathAPTopicGenerators;let seed=opts.seed||1;let pr;
  for(let i=0;i<400&&!pr;i++){window.BatchMathRNG={random:(()=>{let s=seed+i;return()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};})()};try{const q=window[g].make(opts);if(!opts.want||new RegExp(opts.want).test(q.parts.map(x=>x.answerTex).join('|')+q.questionHtml))pr=q;}catch(_){}}
  window.__pr=pr;api.get=()=>()=>window.__pr;},{g:engineGlobal,opts});
 const sel=await p.$('#u5Mode');if(sel){const v=await sel.evaluate(e=>e.value);const other=await sel.evaluate(e=>[...e.options].map(o=>o.value).find(x=>x!==e.value));await p.selectOption('#u5Mode',other);await p.waitForTimeout(300);await p.selectOption('#u5Mode',v);}
 await p.waitForTimeout(500);
 const ans=await p.evaluate(()=>window.__pr.parts[0].answerTex);
 if(entry==='__NEIGHBOUR__')entry=await p.evaluate(()=>{const U=window.BatchMathUnit5Core,a=window.__pr.parts[0].answer;return U.scaledText(U.roundScaled(a.value,a.places)-1,a.places);}); // one last place below the rounded value
 if(entry!==null){await p.locator('#choices .unit5-part-1 .bm-calc-editor').first().click();await p.keyboard.type(entry);await p.locator('#choices .unit5-part-1 .staged-check').click();await p.waitForTimeout(400);}
 await p.evaluate(()=>window.MathJax?.typesetPromise?.()).catch(()=>{});await p.waitForTimeout(800);
 const file=`${OUT}/${name}.png`;await p.locator('.practice-shell').screenshot({path:file});
 const fb=await p.evaluate(()=>document.querySelector('#choices .unit5-part-1 .staged-feedback')?.innerText.slice(0,240)||'');
 shots.push({name,file,answer:ans,entered:entry,feedback:fb});await p.close();
}
// 1. topic page with Mixed, Non-Calculator and Calculator buttons
{const p=await page('rate-problems');const f=`${OUT}/rate-topic-buttons.png`;await p.locator('[data-bm-topic-practice]').screenshot({path:f});shots.push({name:'rate-topic-buttons',file:f});await p.close();}
// 2. rounding: the neighbouring value is graded wrong with a rounding note
await show('basic-first-order-differential-equations/calculator-practice','rounding-neighbour-rejected','BatchMathUnit5Basic',{family:'calc_value',tier:'foundational',calc:'calculator'},'__NEIGHBOUR__');
// 3. calculator total distance with absolute values only on the negative piece
await show('motion-problems/calculator-practice','motion-calculator-total-distance','BatchMathUnit5Motion',{family:'calc_distance',tier:'intermediate',calc:'calculator',want:'^[^|]*$'},'0');
// 4. Separable exponent laws: |y| = e^{x + ln 6} = e^x e^{ln 6} = 6e^x
await show('separable-differential-equations/practice','separable-exponent-laws','BatchMathUnit5Separable',{family:'product',tier:'foundational'},'0');
// 5. non-calculator Rate with an exact answer containing π
await show('rate-problems/non-calculator-practice','rate-noncalculator-pi','BatchMathUnit5Rate',{family:'one_rate',tier:'challenging',calc:'non-calculator',want:'\\\\pi\\}\\\\text'},null);
// 6. the Calculator Review page
{const p=await page('comprehensive-review/calculator-practice');const f=`${OUT}/calculator-review.png`;await p.locator('.practice-shell').screenshot({path:f});shots.push({name:'calculator-review',file:f});await p.close();}
console.log(JSON.stringify(shots,null,1));await b.close();srv.close();
