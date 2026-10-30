// v12.8.X Practice Type dropdowns in the real pages: on every Unit 5 practice page, select each option a few times;
// the problem the page shows must belong to that type (family, group, review topic or difficulty), and on a
// calculator or non-calculator page both the problem and its on-screen badge must be that kind. Console errors fail.
// Usage: node tools/review-lab/unit5/dropdown-browser.mjs [repeats=3] [width=1366] [height=768] [mobile]
import fs from 'node:fs';
import {serve,browser,context,open,randomPort} from '../lib/browser.mjs';
import {ROOT} from './qa/lib.mjs';
const [REP='3',W='1366',H='768',mob='']=process.argv.slice(2);
const U5='ap-calculus/unit-5-differential-equations/topics';
const pages=[];for(const t of fs.readdirSync(`${ROOT}/${U5}`))for(const pg of ['practice','calculator-practice','non-calculator-practice','assignment-practice'])if(fs.existsSync(`${ROOT}/${U5}/${t}/${pg}/index.html`))pages.push(`${t}/${pg}`);
const PORT=randomPort(9400),srv=await serve(PORT),b=await browser({scrollbars:true}),c=await context(b,{width:+W,height:+H,mobile:!!mob});
const out={viewport:`${W}x${H}${mob?' mobile':''}`,pages:0,selections:0,failures:[],errors:[]};
for(const pg of pages){
 const p=await open(c,`http://127.0.0.1:${PORT}/${U5}/${pg}/?bm_seed=dropdown`);out.pages++;
 await p.waitForFunction(()=>window.BatchMathUnit5Last);
 const conf=await p.evaluate(()=>window.BM_TOPIC_PRACTICE);
 const options=await p.$$eval('#u5Mode option',os=>os.map(o=>o.value));
 for(const mode of options)for(let r=0;r<+REP;r++){
  // move off and back so each repetition draws a new problem
  if(r>0||mode==='mixed'){const other=options.find(o=>o!==mode);await p.selectOption('#u5Mode',other);await p.waitForTimeout(120);}
  await p.selectOption('#u5Mode',mode);await p.waitForTimeout(200);out.selections++;
  const s=await p.evaluate(()=>{const q=window.BatchMathUnit5Last,m=q.unit5Meta,badge=document.querySelector('#question .u5-calculator-badge')?.textContent.trim()||'';
   const eng={basic:'BatchMathUnit5Basic',motion:'BatchMathUnit5Motion',slope:'BatchMathUnit5Slope',separable:'BatchMathUnit5Separable',growth:'BatchMathUnit5Growth',rate:'BatchMathUnit5Rate'}[m.engine];
   const F=window[eng]?.FAMILIES?.[m.family];return{family:m.family,group:F?.group||null,tier:m.tier,topic:m.reviewTopic||null,rtier:m.reviewTier||null,calc:q.calculatorActive,badge};});
  const isReview=/comprehensive-review/.test(pg);
  const matches=mode==='mixed'||(isReview?(s.topic===mode||s.rtier===mode):(s.family===mode||s.group===mode));
  if(!matches)out.failures.push(`${pg} [${mode}]: shows ${s.topic||''}/${s.family} (${s.rtier||s.tier})`);
  if(conf.calculator){const want=conf.calculator==='calculator';
   if(s.calc!==want)out.failures.push(`${pg} [${mode}]: ${s.calc?'calculator':'non-calculator'} problem on a ${conf.calculator} page`);
   if(s.badge!==(want?'Calculator active':'No calculator'))out.failures.push(`${pg} [${mode}]: badge "${s.badge}"`);}
  else if(s.badge!==(s.calc?'Calculator active':'No calculator'))out.failures.push(`${pg} [${mode}]: badge "${s.badge}" for a ${s.calc?'calculator':'non-calculator'} problem`);
 }
 out.errors.push(...(p._errs||[]).map(e=>`${pg}: ${e}`));await p.close();
}
console.log(JSON.stringify(out,null,1));await b.close();srv.close();if(out.failures.length||out.errors.length)process.exitCode=1;
