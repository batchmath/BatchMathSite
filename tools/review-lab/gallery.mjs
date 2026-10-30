// Visual regression gallery: find a problem of each listed kind, reveal its explanation (answer 0, continue
// staged parts), screenshot the practice card with real scrollbars, and count scroll boxes, MathJax nodes,
// horizontal page overflow and console errors.
// Usage: node gallery.mjs [viewport ...]   viewports like 1366x768 or 390x844m (m = phone); default: all four.
// Screenshots: out/gallery/<case>-<viewport>.png; results: out/gallery/results.json
// To add a case: [name, Unit 4 topic slug, generator variant, optional test on unit4Meta.subtype].
import fs from 'node:fs';import path from 'node:path';
import {serve,browser,context,open,recordGenerated,outDir,randomPort,unit4Practice} from './lib/browser.mjs';
const CASES=[
 ['fractions-and-fractional-exponents','basic-integrals','radicals_negative_powers'],
 ['negative-exponents-power-rule','basic-integrals','divide_each_term'],
 ['definite-trig-with-bounds','basic-integrals','definite_trig_exponential'],
 ['long-substitution-back-substitution','u-substitution-integrals','definite_back_substitution'],
 ['odd-trig-powers','u-substitution-integrals','odd_trig_powers'],
 ['polynomial-division','integrals-resulting-in-natural-log-and-inverse-trigonometric-functions','division_to_log'],
 ['inverse-trig','integrals-resulting-in-natural-log-and-inverse-trigonometric-functions','inverse_tangent'],
 ['radicals-inverse-sine','integrals-resulting-in-natural-log-and-inverse-trigonometric-functions','inverse_sine'],
 ['mvt-piecewise-two-part','mean-value-theorem-for-integrals','find_c_piecewise',/continuous/],
 ['mvt-trig-long-question','mean-value-theorem-for-integrals','find_c_single',/trig/],
];
const viewports=(process.argv.slice(2).length?process.argv.slice(2):['1920x1080','1366x768','1024x768','390x844m']).map(v=>{const m=v.match(/^(\d+)x(\d+)(m?)$/);return{W:+m[1],H:+m[2],mob:!!m[3],label:`${m[1]}x${m[2]}`};});
const OUT=outDir('gallery'),PORT=randomPort(9600),srv=await serve(PORT),b=await browser({scrollbars:true}),results=[];
for(const vp of viewports)for(const [name,slug,variant,subtype] of CASES){
 const c=await context(b,{width:vp.W,height:vp.H,mobile:vp.mob});await recordGenerated(c);
 const p=await open(c,`http://127.0.0.1:${PORT}${unit4Practice(slug)}?bm_seed=gallery-${name}`);let found=false;
 for(let i=0;i<80&&!found;i++){
  const v=await p.evaluate(()=>window.__bmLast?.variant),sub=await p.evaluate(()=>window.__bmLast?.unit4Meta?.subtype||'');
  const want=v===variant&&(!subtype||subtype.test(sub));
  for(let k=0;k<2;k++){const ed=p.locator('#choices .staged-part:not(.staged-completed) .bm-calc-editor, #choices > .bm-calc-editor').first();if(await ed.count()&&await ed.isVisible()){await ed.click();await p.keyboard.type('0');await p.keyboard.press('Enter');await p.waitForTimeout(200);}
   const cont=p.locator('#choices .staged-continue:not([hidden])').first();if(await cont.count()&&await cont.isVisible()){await cont.click();await p.waitForTimeout(200);}else break;}
  if(want){found=true;await p.evaluate(()=>window.MathJax?.typesetPromise?.());await p.waitForTimeout(500);
   await p.locator('.practice-shell').first().screenshot({path:path.join(OUT,`${name}-${vp.label}.png`)});
   const m=await p.evaluate(()=>{let scroll=0;for(const el of document.querySelectorAll('.practice-shell *')){const cs=getComputedStyle(el);if(cs.display==='inline')continue;const sy=['auto','scroll'].includes(cs.overflowY)&&el.scrollHeight-el.clientHeight>1,sx=['auto','scroll'].includes(cs.overflowX)&&el.scrollWidth-el.clientWidth>1;if((sy||sx)&&!el.closest('.bm-calc-keypad,.bm-calc-editor'))scroll++;}return{scrollBoxes:scroll,mathjaxNodes:document.querySelectorAll('.practice-shell mjx-container').length,pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};});
   results.push({viewport:vp.label,name,variant,...m,consoleErrors:p._errs.length});}
  else{await p.locator('#next').click();await p.waitForTimeout(150);}
 }
 if(!found)results.push({viewport:vp.label,name,variant,found:false});await c.close();
}
fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(results,null,1));
const bad=results.filter(r=>r.found===false||r.scrollBoxes||r.pageOverflow>0||r.consoleErrors||!r.mathjaxNodes);
for(const r of results)console.log(r.viewport.padEnd(10),r.name.padEnd(38),r.found===false?'NOT FOUND':`scroll boxes ${r.scrollBoxes}, MathJax ${r.mathjaxNodes}, page overflow ${r.pageOverflow}, errors ${r.consoleErrors}`);
console.log(`gallery: ${results.length-bad.length} of ${results.length} clean; screenshots in ${OUT}`);
await b.close();srv.close();if(bad.length)process.exitCode=1;
