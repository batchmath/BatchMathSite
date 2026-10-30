// Check pages of a site already served on http://127.0.0.1:8000 (zip/serve-check.sh starts it): app version,
// MathJax rendering, horizontal overflow, broken images and console errors, at laptop and phone size.
// EXPECT_VERSION=12.8.V makes a wrong version a failure. PAGES (comma-separated paths) overrides the list.
import {browser,context,open} from '../lib/browser.mjs';
const base='http://127.0.0.1:8000/',want=process.env.EXPECT_VERSION||'';
const u4=s=>`ap-calculus/unit-4-integrals/topics/${s}/practice/`;
const pages=process.env.PAGES?process.env.PAGES.split(','):['','ap-calculus/','ap-calculus/unit-4-integrals/','ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/',
 ...['basic-integrals','u-substitution-integrals','integrals-resulting-in-natural-log-and-inverse-trigonometric-functions','mean-value-theorem-for-integrals','comprehensive-review','fundamental-theorem-of-calculus-and-integral-rules','integrals-using-geometry'].map(u4),
 'ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/integral-rules-practice/','ap-calculus/unit-2-derivatives/topics/inverse-trigonometric-functions/practice/','im1/','calculus-prep/'];
const b=await browser(),out=[];
for(const [W,H,m] of [[1366,768,''],[390,844,'m']]){
 const c=await context(b,{width:W,height:H,mobile:!!m});
 for(const pg of pages){const p=await open(c,base+pg+'?bm_seed=zipcheck');await p.waitForTimeout(1000);
  const info=await p.evaluate(async()=>({title:document.title,mathjax:document.querySelectorAll('main mjx-container, #question mjx-container').length,question:!!document.querySelector('#question'),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,version:await fetch('/assets/app-version.json',{cache:'no-store'}).then(r=>r.json()).then(j=>j.version).catch(()=>'?'),brokenImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&!/ytimg|youtube/.test(i.src)).map(i=>i.src)}));
  const ok=(!want||info.version===want)&&(!info.question||info.mathjax>0)&&info.overflow<=0&&!info.brokenImages.length&&!p._errs.length;
  out.push({vp:`${W}x${H}`,page:pg||'/',ok,...info,errors:p._errs});await p.close();}
 await c.close();}
const sw=await (await fetch(base+'sw.js')).text();console.log('service worker',sw.match(/VERSION\s*=\s*['"][^'"]+/)?.[0]);
for(const r of out)console.log(r.vp.padEnd(9),r.ok?'ok     ':'PROBLEM',r.page.padEnd(96),'version',r.version,'| MathJax',r.mathjax,'| overflow',r.overflow,'| broken images',r.brokenImages.length,'| errors',r.errors.length,r.errors.join(' ').slice(0,120));
console.log(`${out.filter(r=>r.ok).length} of ${out.length} page checks ok`);
await b.close();if(out.some(r=>!r.ok))process.exitCode=1;
