// Unit 6 screenshots of fresh (unanswered) problems: one per page and Practice Type, desktop and phone, for
// visual review of figures, the integral control and the keypad. Answers part 1 of integral problems only when
// asked (BM_ADVANCE=1) so later parts are visible too.
// Usage: node tools/review-lab/unit6/shots.mjs <page-path> <mode|mixed> [n=1] [width=1366] [height=768] [mobile]
import {serve,browser,context,open,outDir,randomPort} from '../lib/browser.mjs';
const [page,mode='mixed',n='1',W='1366',H='768',mob='']=process.argv.slice(2);
const PORT=randomPort(9700),srv=await serve(PORT),b=await browser({scrollbars:true}),c=await context(b,{width:+W,height:+H,mobile:!!mob});
const p=await open(c,`http://127.0.0.1:${PORT}/${page.replace(/^\/|\/$/g,'')}/?bm_seed=u6shot-${mode}`);
if(mode!=='mixed'){await p.selectOption('#u6Mode',mode);await p.waitForTimeout(600);}
const files=[];
for(let i=0;i<+n;i++){
 if(i){await p.evaluate(()=>{const s=document.getElementById('u6Mode');if(s)s.dispatchEvent(new Event('change'));});await p.waitForTimeout(600);}
 await p.evaluate(()=>window.MathJax?.typesetPromise?.()).catch(()=>{});await p.waitForTimeout(300);
 const f=`${outDir('unit6','shots')}/${page.split('/').slice(-2).join('-')}-${mode}-${i+1}-${W}x${H}.png`;await p.screenshot({path:f,fullPage:true});files.push(f);
}
console.log(JSON.stringify({files,errors:p._errs,variant:await p.evaluate(()=>window.BatchMathUnit5Last?.variant)}));
await b.close();srv.close();
