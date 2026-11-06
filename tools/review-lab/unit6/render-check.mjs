// v12.9.B: renders chosen Unit 6 problems in their real practice page and checks the display. For each case the page's
// own generator is called with seeded random numbers until a problem matches (for example x = 1 - y^2, ln(x + 1) with
// no coefficient, a piecewise branch x or x^2, a calculator problem); its question, answers and explanations are put
// in the page and typeset by MathJax. Reported per case: MathJax errors, raw TeX left visible, the matched text, and
// that no "Use your calculator" line is shown. Screenshots of the rendered cases go to $REVIEW_HOME/out/unit6/render.
// v12.9.B checkpoint 5 adds signed-area explanations (the combined arithmetic before the final answer).
// Usage: node tools/review-lab/unit6/render-check.mjs
import {serve,browser,context,open,outDir,randomPort} from '../lib/browser.mjs';
const T='ap-calculus/unit-6-applications-integration/topics';
const CASES=[
 {name:'area in y: x = 1 - y^2 (no parentheses)',page:`${T}/finding-area-in-terms-of-y/practice`,slug:'finding-area-in-terms-of-y',opts:{},want:'x=1-y^{2}',bad:/x=\\left\(1-y\^\{2\}\\right\)/},
 {name:'area in y: x = h - y with c = 1 (no parentheses)',page:`${T}/finding-area-in-terms-of-y/practice`,slug:'finding-area-in-terms-of-y',opts:{},want:/x=[2-5]-y\\\)/,bad:/x=\([2-5]-y\)/},
 {name:'calculator log region: ln(x + 1), not 1 ln(x + 1)',page:`${T}/area-below-and-between-curves/calculator-practice`,slug:'area-below-and-between-curves',opts:{calc:'calculator',mode:'between'},want:'y=\\ln(x+1)',bad:/1\\ln/},
 {name:'cross sections over the log region (calculator)',page:`${T}/volume-by-cross-sections/calculator-practice`,slug:'volume-by-cross-sections',opts:{calc:'calculator'},want:'y=\\ln(x+1)',bad:/1\\ln/},
 {name:'piecewise review problem: a branch x or x^2',page:`${T}/comprehensive-review/non-calculator-practice`,slug:'integrals-on-piecewise-defined-functions',opts:{},want:/\\\\x(\^2)?(\+1)?,&|cases\}x(\^2)?(\+\d)?,&/,bad:/(^|[^0-9])1x/},
 {name:'signed area in x: three intervals, the middle one below the axis',page:`${T}/area-below-and-between-curves/non-calculator-practice`,slug:'area-below-and-between-curves',opts:{calc:'non-calculator',mode:'under_curve'},want:/A=\\frac\{\d+\}\{\d+\} - \\left\(-[^=]*\+ /,bad:/\+ -\\int|\+ -\\left/},
 {name:'signed area in x: first interval below the axis',page:`${T}/area-below-and-between-curves/non-calculator-practice`,slug:'area-below-and-between-curves',opts:{calc:'non-calculator',mode:'under_curve'},want:/A=-\\left\(-\\frac/,bad:/\+ -\\left/},
 {name:'signed area in y: a piece left of the y-axis',page:`${T}/finding-area-in-terms-of-y/practice`,slug:'finding-area-in-terms-of-y',opts:{},want:/A=[^=]*\\left\(-[^=]*=/,bad:/\+ -\\left/},
 {name:'calculator solid: no "Use your calculator"',page:`${T}/solids-of-revolution/calculator-practice`,slug:'solids-of-revolution',opts:{calc:'calculator'},want:'Calculator active',bad:/Use your calculator/},
 {name:'calculator free response: no "Use your calculator"',page:`${T}/comprehensive-review/calculator-practice`,slug:'unit6-comprehensive-review',opts:{calc:'calculator',mode:'frq_region'},want:'Answer each part.',bad:/Use your calculator/},
];
const PORT=randomPort(9500),srv=await serve(PORT),b=await browser(),c=await context(b,{width:1100,height:900});
const out=[];let fails=0;
for(const k of CASES){
 const p=await open(c,`http://127.0.0.1:${PORT}/${k.page}/`);
 const r=await p.evaluate(async({k})=>{
  const want=k.wantRe?new RegExp(k.wantRe):null,bad=new RegExp(k.badRe);
  const rng=seed=>{let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};};
  const gen=window.BatchMathAPTopicGenerators.get(k.slug),keep=window.BatchMathRNG;let prob=null,seed=0;
  for(seed=1;seed<4000&&!prob;seed++){window.BatchMathRNG={random:rng(seed)};const q=gen(k.opts);const html=[q.questionHtml,...(q.parts||[]).flatMap(x=>[x.prompt,x.answerTex?`\\(${x.answerTex}\\)`:'',x.explanation]),q.explanation||'',...(q.choices||[]).map(x=>`\\(${x}\\)`)].join('<hr>');
   if(want?want.test(html):html.includes(k.want))prob={q,html};}
  window.BatchMathRNG=keep;if(!prob)return{found:false};
  const box=document.getElementById('question');box.innerHTML=`<div class="bm-render-check">${prob.html}</div>`;
  await window.MathJax.typesetPromise([box]);
  const text=box.innerText;
  return{found:true,seed,id:prob.q.id,merror:box.querySelectorAll('mjx-merror').length,mjx:box.querySelectorAll('mjx-container').length,raw:/\\\(|\\\)|\\frac|\\int_|\\left/.test(text),badShown:bad.test(prob.html),calcNote:/Use your calculator/i.test(text)};
 },{k:{...k,want:typeof k.want==='string'?k.want:undefined,wantRe:k.want instanceof RegExp?k.want.source:undefined,badRe:k.bad.source}});
 const ok=r.found&&!r.merror&&!r.raw&&!r.badShown&&!r.calcNote&&r.mjx>0&&!p._errs.length;if(!ok)fails++;
 if(r.found)await p.locator('#question').screenshot({path:`${outDir('unit6','render')}/${out.length+1}.png`}).catch(()=>{});
 out.push({case:k.name,ok,...r,errors:p._errs});await p.close();
}
console.log(JSON.stringify(out,null,1));console.log(fails?`${fails} case(s) failed`:'all cases render correctly');
await b.close();srv.close();if(fails)process.exitCode=1;
