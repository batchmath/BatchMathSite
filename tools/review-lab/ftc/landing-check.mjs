// The FTC and Integral Rules topic page at laptop, phone and tablet size: the practice buttons are in the launch
// section after the resources and before the pager, FTC first; both open their practice page; HW videos expand;
// no horizontal overflow. Screenshots go to out/landing.
// Usage: node ftc/landing-check.mjs
import {serve,browser,context,open,outDir,randomPort} from '../lib/browser.mjs';
const PORT=randomPort(9990),srv=await serve(PORT),b=await browser({scrollbars:true}),OUT=outDir('landing'),out=[];
const base=`http://127.0.0.1:${PORT}/ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/`;
for(const [W,H,m] of [[1366,768,''],[390,844,'m'],[1024,768,'']]){
 const c=await context(b,{width:W,height:H,mobile:!!m});const p=await open(c,base);
 const info=await p.evaluate(()=>{const sec=document.querySelector('section[data-bm-topic-practice="1"]'),btns=[...document.querySelectorAll('a[data-bm-resource="practice"]')];
  const pager=document.querySelector('.topic-pager'),lastRes=[...document.querySelectorAll('section.resource-section:not([data-bm-topic-practice])')].at(-1);
  return{buttons:btns.map(a=>({label:a.getAttribute('aria-label'),href:a.getAttribute('href'),inLaunch:!!a.closest('[data-bm-topic-practice]')})),
   launchAfterResources:!!(lastRes&&sec&&lastRes.compareDocumentPosition(sec)&Node.DOCUMENT_POSITION_FOLLOWING),pagerAfterLaunch:!!(sec&&pager&&sec.compareDocumentPosition(pager)&Node.DOCUMENT_POSITION_FOLLOWING),
   hwButtons:document.querySelectorAll('button[aria-controls^="hw-video"]').length,pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};});
 await p.screenshot({path:`${OUT}/ftc-landing-${W}x${H}.png`,fullPage:true});
 const hw=p.locator('button[aria-controls^="hw-video"]').first();await hw.click();await p.waitForTimeout(300);info.hwOpens=(await hw.getAttribute('aria-expanded'))==='true';
 info.opens={};for(const href of ['practice/','integral-rules-practice/']){const q=await c.newPage();const r=await q.goto(base+href);info.opens[href]=r.ok()?await q.title():`HTTP ${r.status()}`;await q.close();}
 const ok=info.buttons.map(b=>b.href).join(',')==='practice/,integral-rules-practice/'&&info.buttons.every(b=>b.inLaunch)&&info.launchAfterResources&&info.pagerAfterLaunch&&info.hwOpens&&info.pageOverflow<=0&&!p._errs.length;
 out.push({viewport:`${W}x${H}`,ok,...info,errors:p._errs});await c.close();
}
for(const o of out)console.log(o.viewport.padEnd(9),o.ok?'ok':'PROBLEM',JSON.stringify({order:o.buttons.map(b=>b.href),inLaunch:o.buttons.every(b=>b.inLaunch),afterResources:o.launchAfterResources,beforePager:o.pagerAfterLaunch,hwOpens:o.hwOpens,overflow:o.pageOverflow,opens:o.opens,errors:o.errors.length}));
await b.close();srv.close();if(out.some(o=>!o.ok))process.exitCode=1;
