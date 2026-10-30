// Physical-keyboard test for a typed Unit 4 practice page: each displayed answer is typed as a student would
// ("/" and "^" open a slot, → leaves it), submitted alternately with Enter and the Check button. Every third
// indefinite answer leaves off + C and must be marked incorrect with the forgot-+C note. MVT lists are typed
// in reverse order every other time; "Does not apply" uses its key. Also: MathJax rendering, raw TeX, errors.
// Usage: node keypad/keyboard-entry.mjs <unit-4-topic-slug> [count=10] [width=1366] [height=768] [mobile]
//   BM_SELECT picks a comprehensive-review mode (with slug comprehensive-review).
import {serve,browser,context,open,rendered,recordGenerated,outDir,randomPort,unit4Practice} from '../lib/browser.mjs';
import {keypadForm,strokes,readResult,isCorrect} from '../lib/keypad.mjs';
const [slug,count='10',W='1366',H='768',mob='']=process.argv.slice(2);
if(!slug){console.error('usage: keypad/keyboard-entry.mjs <slug> [count] [width] [height] [mobile]');process.exit(2);}
const PORT=randomPort(8800),srv=await serve(PORT),b=await browser(),c=await context(b,{width:+W,height:+H,mobile:!!mob});
await recordGenerated(c);
const p=await open(c,`http://127.0.0.1:${PORT}${unit4Practice(slug)}?bm_seed=keyboard-${slug}`);
if(process.env.BM_SELECT){await p.selectOption('#unit4Mode',process.env.BM_SELECT);await p.waitForTimeout(500);}
const typeIn=async(text,scope='#choices')=>{const ed=p.locator(`${scope} .bm-calc-editor`).first();await ed.click();await p.keyboard.press('Control+A');await p.keyboard.press('Backspace');
 for(const st of strokes(text)){if(st.key)await p.keyboard.press(st.key);else if(st.pad)await p.locator(`${scope} .bm-calc-keypad button`,{hasText:st.pad}).first().click();else await p.keyboard.type(st.text);}
 return p.$eval(`${scope} .bm-calc-source`,e=>e.value);};
const problems=[];
for(let i=0;i<+count;i++){
 const info=await p.evaluate(()=>{const c=window.__bmLast;return{id:c.id,variant:c.variant,mode:c.unit4Meta?.mode,tex:c.stage1.answerTex,stage2:c.stage2?{tex:c.stage2.answerTex,none:!!c.stage2.unit4Answer?.none}:null};});
 const s1=info.stage2?'#choices .staged-part-one':'#choices',row={...info,question:await rendered(p)};
 const typed=keypadForm(info.tex),dropC=info.mode==='indefinite'&&i%3===1;
 row.typed=dropC?typed.replace(/\+C$/,''):typed;row.source=await typeIn(row.typed,s1);
 if(i%2)await p.keyboard.press('Enter');else await p.locator(`${s1} .staged-check`).first().click();
 await p.waitForTimeout(350);
 const r=await readResult(p,s1);row.feedback=`${r.result} ${r.note} ${r.message}`.trim();
 if(dropC){if(r.result!=='Not correct.'||!/forgot \+ C/.test(r.note))row.problem='missing + C not reported';}
 else if(!isCorrect(r.result))row.problem='typed answer not accepted';
 if(info.stage2&&isCorrect(r.result)){
  await p.locator('#choices .staged-continue').first().click();await p.waitForTimeout(300);const s2='#choices .staged-part-two';
  if(info.stage2.none){await p.locator(`${s2} .bm-calc-editor`).first().click();await p.locator(`${s2} .bm-calc-keypad button[aria-label="Insert does not apply"]`).first().click();row.typed2='[Does not apply key]';row.source2=await p.$eval(`${s2} .bm-calc-source`,e=>e.value);}
  else{const vals=info.stage2.tex.split(',\\ ').map(keypadForm);if(i%2)vals.reverse();row.typed2=vals.join(',');row.source2=await typeIn(row.typed2,s2);}
  if(i%2)await p.keyboard.press('Enter');else await p.locator(`${s2} .staged-check`).first().click();
  await p.waitForTimeout(350);const r2=await readResult(p,s2);row.feedback2=`${r2.result} ${r2.note} ${r2.message}`.trim();
  if(!isCorrect(r2.result))row.problem=(row.problem?row.problem+'; ':'')+'part 2 not accepted';
 }
 row.explanation=await rendered(p,'#choices');if(row.explanation.raw)row.problem=(row.problem?row.problem+'; ':'')+'raw TeX in explanation';
 problems.push(row);
 if(i===0)await p.screenshot({path:`${outDir('keyboard')}/${slug}${process.env.BM_SELECT?'-'+process.env.BM_SELECT:''}-${W}x${H}.png`,fullPage:true});
 if(await p.locator('#next').isHidden()){row.problem=(row.problem?row.problem+'; ':'')+'Next hidden';break;}
 await p.locator('#next').click();await p.waitForTimeout(300);
}
const failures=problems.filter(r=>r.problem).map(r=>`${r.variant} ${r.id}: ${r.problem} | typed ${r.typed} -> ${r.source} | ${r.feedback}${r.typed2?` | part 2 ${r.typed2} -> ${r.source2} | ${r.feedback2}`:''}`);
console.log(JSON.stringify({slug,viewport:`${W}x${H}${mob?' mobile':''}`,mode:process.env.BM_SELECT||'',checked:problems.length,failures,consoleErrors:p._errs,twoPart:problems.filter(r=>r.typed2).length,sample:problems.slice(0,3).map(r=>({v:r.variant,typed:r.typed,fb:r.feedback,typed2:r.typed2,fb2:r.feedback2}))},null,1));
await b.close();srv.close();if(failures.length||p._errs.length)process.exitCode=1;
