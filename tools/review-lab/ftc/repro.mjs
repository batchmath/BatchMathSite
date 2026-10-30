// FTC checker in a real browser: generated answers with a factor directly before a function (2xsec(...),
// 3x^(2)cos(...)) are entered with the on-screen keypad, the physical keyboard and keyboard natural notation,
// and submitted with Enter or Check. Run it on another tree with BM_ROOT to compare (main reported these invalid).
// Usage: node ftc/repro.mjs [count=6]
import {serve,browser,context,open,recordGenerated,randomPort} from '../lib/browser.mjs';
import {keypadForm,parse,keypad,strokes} from '../lib/keypad.mjs';
const [count='6']=process.argv.slice(2);
const PORT=randomPort(9800),srv=await serve(PORT),b=await browser(),c=await context(b,{width:1366,height:768});
await recordGenerated(c);
const p=await open(c,`http://127.0.0.1:${PORT}/ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/practice/?bm_seed=ftc-repro`);
const k=keypad(p),rows=[];let n=0;
for(let i=0;i<120&&n<+count;i++){
 const info=await p.evaluate(()=>{const c=window.__bmLast;return{id:c.id,q:document.querySelector('#question')?.innerText.replace(/\s+/g,' ').slice(0,140),tex:c.stage1.answerTex};});
 const lin=keypadForm(info.tex);
 if(!/[0-9x)](sin|cos|tan|sec|csc|cot|ln)\(/.test(lin)||/\^\((-?\d+)\)\(/.test(lin)){await p.locator('#choices .bm-calc-editor').first().click();await p.keyboard.type('0');await p.keyboard.press('Enter');await p.waitForTimeout(150);await p.locator('#next').click();await p.waitForTimeout(150);continue;}
 const mode=['keypad','keyboard','keyboard-natural'][n%3],submit=n%2?'Enter':'Check';
 await p.locator('#choices .bm-calc-editor').first().click();await k.key('Clear');
 if(mode==='keypad')await k.emit(parse(lin));
 else for(const st of strokes(lin)){if(st.key)await p.keyboard.press(st.key);else await p.keyboard.type(st.text);}
 const serialized=await k.source();
 if(submit==='Enter')await p.keyboard.press('Enter');else await p.locator('#choices .staged-check').first().click();
 await p.waitForTimeout(350);
 const res=await p.evaluate(()=>{const f=document.querySelector('#choices .staged-feedback .result');return f?f.innerText.trim():(document.querySelector('#choices .staged-input-message')?.innerText.trim()||'');});
 rows.push({question:info.q,correct:info.tex,mode,submit,serialized,result:res});n++;
 // an invalid entry is not an attempt: finish the problem with 0 so the run can continue
 if(await p.locator('#next').isHidden()){await k.key('Clear');await k.key('0');await p.locator('#choices .staged-check').first().click();await p.waitForTimeout(250);}
 await p.locator('#next').click();await p.waitForTimeout(250);
}
for(const r of rows)console.log(r.mode.padEnd(17),r.submit.padEnd(6),r.serialized.padEnd(50),r.result);
console.log(`${rows.filter(r=>r.result==='Correct.').length} of ${rows.length} accepted; console errors ${p._errs.length}`);
await b.close();srv.close();if(rows.some(r=>r.result!=='Correct.')||p._errs.length)process.exitCode=1;
