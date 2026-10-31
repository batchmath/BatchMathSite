// v12.8.X Practice Type dropdowns in the real pages: on every Unit 5 practice page, select each option a few times;
// the problem the page shows must belong to that type (family, group, review topic or difficulty), and on a
// calculator or non-calculator page both the problem and its on-screen badge must be that kind; the static
// "Calculator Active" note appears only on calculator pages; a review problem's topic tag sits above the question.
// v12.8.Y: a Practice Type is one of the engine's MODES; a page without a dropdown is reloaded with new seeds and
// checked the same way; a retired combined URL must land on its topic page without showing a question.
// Console errors fail.
// Usage: node tools/review-lab/unit5/dropdown-browser.mjs [repeats=3] [width=1366] [height=768] [mobile]
import fs from 'node:fs';
import {serve,browser,context,open,randomPort} from '../lib/browser.mjs';
import {ROOT} from './qa/lib.mjs';
const [REP='3',W='1366',H='768',mob='']=process.argv.slice(2);
const U5='ap-calculus/unit-5-differential-equations/topics';
const pages=[];for(const t of fs.readdirSync(`${ROOT}/${U5}`))for(const pg of ['practice','calculator-practice','non-calculator-practice','assignment-practice'])if(fs.existsSync(`${ROOT}/${U5}/${t}/${pg}/index.html`))pages.push(`${t}/${pg}`);
const PORT=randomPort(9400),srv=await serve(PORT),b=await browser({scrollbars:true}),c=await context(b,{width:+W,height:+H,mobile:!!mob});
const out={viewport:`${W}x${H}${mob?' mobile':''}`,pages:0,redirects:0,selections:0,reloads:0,failures:[],errors:[]};
// one problem as the page shows it, judged against the chosen Practice Type (or the whole pool for mode null)
const shown=(p,mode)=>p.evaluate(mode=>{const q=window.BatchMathUnit5Last,m=q.unit5Meta,badge=document.querySelector('#question .u5-calculator-badge')?.textContent.trim()||'';
 const eng={basic:'BatchMathUnit5Basic',motion:'BatchMathUnit5Motion',slope:'BatchMathUnit5Slope',separable:'BatchMathUnit5Separable',growth:'BatchMathUnit5Growth',rate:'BatchMathUnit5Rate'}[m.engine];
 const F=window[eng]?.FAMILIES?.[m.family],M=mode&&window[eng]?.MODES?.[mode];
 const inMode=!mode||mode==='mixed'||(m.review?m.reviewTier===mode:M?m.family in M.families&&(!Array.isArray(M.families[m.family])||M.families[m.family].includes(m.tier))&&(!M.accept||M.accept(q)):(m.family===mode||F?.group===mode));
 const tag=document.querySelector('#question .u5-review-tag'),nx=tag?.nextElementSibling;
 const tagAbove=!tag||!!(nx&&tag.getBoundingClientRect().bottom<=nx.getBoundingClientRect().top+1);
 return{family:m.family,tier:m.tier,topic:m.reviewTopic||null,rtier:m.reviewTier||null,calc:q.calculatorActive,badge,tag:!!tag,tagAbove,inMode};},mode);
function judge(pg,conf,mode,s){
 const isReview=/comprehensive-review/.test(pg);
 if(!s.inMode)out.failures.push(`${pg} [${mode}]: shows ${s.topic||''}/${s.family} (${s.rtier||s.tier})`);
 // a review problem's topic tag sits above the question, not beside it
 if(isReview&&(!s.tag||!s.tagAbove))out.failures.push(`${pg} [${mode}]: review tag ${s.tag?'beside the question':'missing'}`);
 if(conf.calculator){const want=conf.calculator==='calculator';
  if(s.calc!==want)out.failures.push(`${pg} [${mode}]: ${s.calc?'calculator':'non-calculator'} problem on a ${conf.calculator} page`);
  if(s.badge!==(want?'Calculator active':'No calculator'))out.failures.push(`${pg} [${mode}]: badge "${s.badge}"`);}
 else if(s.badge!==(s.calc?'Calculator active':'No calculator'))out.failures.push(`${pg} [${mode}]: badge "${s.badge}" for a ${s.calc?'calculator':'non-calculator'} problem`);
}
for(const pg of pages){
 // v12.8.Y: a retired combined page redirects to its topic page and shows no question
 if(!/window\.BM_TOPIC_PRACTICE=/.test(fs.readFileSync(`${ROOT}/${U5}/${pg}/index.html`,'utf8'))){
  const p=await open(c,`http://127.0.0.1:${PORT}/${U5}/${pg}/`);await p.waitForURL(u=>!u.pathname.endsWith(`/${pg}/`),{timeout:5000}).catch(()=>{});await p.waitForTimeout(400);out.redirects++;
  const landed=new URL(p.url()).pathname,topic=`/${U5}/${pg.split('/')[0]}/`;
  if(landed!==topic)out.failures.push(`${pg}: lands on ${landed}, not the topic page`);
  if(await p.$('#question, #u5Mode'))out.failures.push(`${pg}: the landing page shows practice`);
  const btn=await p.$$eval('[data-bm-topic-practice] a',as=>as.map(a=>a.getAttribute('href')));
  if(btn.join()!=='non-calculator-practice/,calculator-practice/')out.failures.push(`${pg}: topic page buttons ${btn}`);
  out.errors.push(...(p._errs||[]).map(e=>`${pg}: ${e}`));await p.close();continue;}
 const p=await open(c,`http://127.0.0.1:${PORT}/${U5}/${pg}/?bm_seed=dropdown`);out.pages++;
 await p.waitForFunction(()=>window.BatchMathUnit5Last);
 const conf=await p.evaluate(()=>window.BM_TOPIC_PRACTICE);
 // the static "Calculator Active" note shows only on calculator pages (Mixed pages rely on each problem's badge)
 const note=await p.evaluate(()=>{const n=document.querySelector('.calculator-active-note');return !!(n&&n.offsetParent);});
 if(note&&conf.calculator!=='calculator')out.failures.push(`${pg}: "Calculator Active" note on a ${conf.calculator||'mixed'} page`);
 const options=await p.$$eval('#u5Mode option',os=>os.map(o=>o.value));
 // v12.8.Y: no dropdown: reload with new seeds and check each problem against the page's whole pool
 if(!options.length){for(let r=0;r<2*+REP;r++){if(r){await p.goto(`http://127.0.0.1:${PORT}/${U5}/${pg}/?bm_seed=dropdown-${r}`);await p.waitForFunction(()=>window.BatchMathUnit5Last);}
   out.reloads++;const s=await shown(p,null);judge(pg,conf,null,s);
   if(pg.startsWith('basic-first-order-differential-equations/')&&s.family!=='calc_value')out.failures.push(`${pg}: shows ${s.family}`);}}
 for(const mode of options)for(let r=0;r<+REP;r++){
  // move off and back so each repetition draws a new problem
  if(r>0||mode==='mixed'){const other=options.find(o=>o!==mode);await p.selectOption('#u5Mode',other);await p.waitForTimeout(120);}
  await p.selectOption('#u5Mode',mode);await p.waitForTimeout(200);out.selections++;
  judge(pg,conf,mode,await shown(p,mode));
 }
 out.errors.push(...(p._errs||[]).map(e=>`${pg}: ${e}`));await p.close();
}
console.log(JSON.stringify(out,null,1));await b.close();srv.close();if(out.failures.length||out.errors.length)process.exitCode=1;
