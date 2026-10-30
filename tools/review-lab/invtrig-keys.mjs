// Inverse-trig keypad keys on every page that has them: label, fit, what the key inserts, editor display,
// arrow navigation, editing and backspace. Product/quotient-rule pages are included to confirm they have none.
// Usage: node invtrig-keys.mjs [width=1366] [height=768] [mobile]
import fs from 'node:fs';
import {serve,browser,context,open,recordGenerated,outDir,randomPort} from './lib/browser.mjs';
const [W='1366',H='768',mob='']=process.argv.slice(2);
const PORT=randomPort(9700),srv=await serve(PORT),b=await browser(),c=await context(b,{width:+W,height:+H,mobile:!!mob});
await recordGenerated(c);
const pages=['ap-calculus/unit-2-derivatives/topics/inverse-trigonometric-functions/practice','ap-calculus/unit-2-derivatives/topics/the-product-rule/practice','ap-calculus/unit-2-derivatives/topics/the-quotient-rule/practice','ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice','ap-calculus/unit-4-integrals/topics/integrals-resulting-in-natural-log-and-inverse-trigonometric-functions/practice','ap-calculus/unit-4-integrals/topics/mean-value-theorem-for-integrals/practice'];
const expectName={'sin⁻¹':'asin','cos⁻¹':'acos','tan⁻¹':'atan','cot⁻¹':'acot','sec⁻¹':'asec','csc⁻¹':'acsc'};
const out=[];
for(const path of pages){
 const p=await open(c,`http://127.0.0.1:${PORT}/${path}/?bm_seed=invtrig-${W}`);let scope=(await p.locator('#choices .bm-calc-keypad').count())?'#choices':'body';
 if(path.includes('natural-log')){// skip ahead to an inverse-trig problem, where the keypad shows the inverse keys
  for(let i=0;i<40;i++){if((await p.locator('#choices .bm-calc-keypad button').filter({hasText:/⁻¹/}).count())>0)break;const ed=p.locator('#choices .bm-calc-editor').first();await ed.click();await p.keyboard.type('0');await p.keyboard.press('Enter');await p.waitForTimeout(150);await p.locator('#next').click();await p.waitForTimeout(200);}}
 if(path.includes('mean-value')){// reach part 2 of a trig find-c problem, where the sin⁻¹ / cos⁻¹ keypad appears
  for(let i=0;i<60;i++){const sub=await p.evaluate(()=>window.__bmLast?.unit4Meta?.subtype);const ed=p.locator('#choices .bm-calc-editor').first();await ed.click();await p.keyboard.type('0');await p.keyboard.press('Enter');await p.waitForTimeout(150);
   if(/trig_/.test(sub||'')){await p.locator('#choices .staged-continue').first().click();await p.waitForTimeout(250);scope='#choices .staged-part-two';break;}
   const cont=p.locator('#choices .staged-continue:not([hidden])').first();if(await cont.count()&&await cont.isVisible()){await cont.click();await p.waitForTimeout(150);const e2=p.locator('#choices .staged-part-two .bm-calc-editor').first();await e2.click();await p.keyboard.type('0');await p.keyboard.press('Enter');await p.waitForTimeout(150);}
   await p.locator('#next').click();await p.waitForTimeout(200);}
 }
 const keys=await p.$$eval(`${scope} .bm-calc-keypad button`,bs=>bs.filter(b=>/⁻¹/.test(b.textContent)&&b.offsetParent).map(b=>({label:b.textContent.trim(),aria:b.getAttribute('aria-label'),w:Math.round(b.getBoundingClientRect().width),h:Math.round(b.getBoundingClientRect().height),fits:b.scrollWidth<=b.clientWidth+1,font:getComputedStyle(b).fontSize})));
 const rows=[];
 for(const k of keys){
  const pad=p.locator(`${scope} .bm-calc-keypad button`),ed=p.locator(`${scope} .bm-calc-editor`).first();await ed.click();
  await pad.filter({hasText:/^Clear$/}).first().click();
  await pad.filter({hasText:new RegExp(`^${k.label}$`)}).first().click();
  const inserted=await p.$eval(`${scope} .bm-calc-source`,e=>e.value);
  await p.keyboard.type('x');
  await pad.filter({hasText:/^←$/}).first().click();await pad.filter({hasText:/^→$/}).first().click();
  await pad.filter({hasText:/^→$/}).first().click();await p.keyboard.type('+1');
  const edited=await p.$eval(`${scope} .bm-calc-source`,e=>e.value),shown=(await ed.innerText()).replace(/\s+/g,'');
  await p.keyboard.press('Backspace');await p.keyboard.press('Backspace');const afterBackspace=await p.$eval(`${scope} .bm-calc-source`,e=>e.value);
  const want=expectName[k.label];
  const ok=inserted===`${want}()`&&edited===`${want}(x)+1`&&shown.includes(k.label)&&afterBackspace===`${want}(x)`&&k.fits&&!/1\/|\^\(-1\)/.test(edited);
  rows.push({...k,inserted,edited,shown,afterBackspace,ok});
 }
 out.push({page:path.split('/topics/')[1],keys:rows.length,allOk:rows.every(r=>r.ok),rows,errors:p._errs});await p.close();
}
for(const o of out)console.log(`${W}x${H}`,o.page.padEnd(90),'keys',o.keys,o.allOk?'ok':'PROBLEM',o.rows.map(r=>`${r.label}:${r.w}px${r.ok?'':'!'}`).join(' '),'errors',o.errors.length);
fs.writeFileSync(`${outDir('invtrig')}/invtrig-${W}x${H}.json`,JSON.stringify({viewport:`${W}x${H}`,out},null,1));
await b.close();srv.close();if(out.some(o=>!o.allOk||o.errors.length))process.exitCode=1;
