#!/usr/bin/env node
// Targeted real-page MathJax/layout/answer-flow checks, not a sitewide audit.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'qa-results','unit4-v128j-browser');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{try{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
const pages=['rectangular-approximations','trapezoidal-approximations','introduction-to-sigma-notation'],report={ok:false,cases:[],screenshots:[],failures:[]};let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [1280,375,320]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.route(/googletagmanager\.com|google-analytics\.com/,route=>route.abort());
  await context.addInitScript(()=>{
   let api;Object.defineProperty(window,'BatchMathAPTopicGenerators',{configurable:true,get:()=>api,set:original=>{api={...original,get:slug=>{const generator=original.get(slug);if(!generator)return generator;return opts=>{const p=window.__u4Forced||generator(opts);window.__u4Forced=null;window.__u4Current=p;return p;};}};}});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  for(const slug of pages){
   await page.goto(`${origin}/ap-calculus/unit-4-integrals/topics/${slug}/practice/?bm_seed=unit4-J-${width}`,{waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.MathJax?.typesetPromise&&window.__u4Current?.unit4Meta,{timeout:60000});
   await page.evaluate(()=>MathJax.startup.promise);
   const samples=await page.evaluate(slug=>{
    const samples=[],seen=new Set();for(let i=0;i<400;i++){const p=BatchMathAPTopicGenerators.get(slug)(),d=p.unit4Meta;const signature=d.kind==='sigma'?`${d.family}-${d.subtype}`:`${d.representation}-${d.family}-${d.mode}-${d.uniform?'equal':'unequal'}-${d.f?.coeff?.[2]?.[0]>0?'up':'other'}-${d.error?'error':'numeric'}-${d.relation?'relationship':'regular'}`;if(!seen.has(signature)){seen.add(signature);samples.push({p,signature});}}
    return samples.slice(0,60);
   },slug);
   for(let i=0;i<samples.length;i++){
    const {p,signature}=samples[i];
    if(await page.locator('#next').isHidden()){await page.locator('#choices > button').first().click();await page.waitForSelector('#feedback.shown');}
    await page.evaluate(p=>window.__u4Forced=p,p);await page.locator('#next').click();
    await page.evaluate(()=>MathJax.typesetPromise([document.querySelector('#question'),document.querySelector('#choices')]));
    const initial=await page.evaluate(()=>({id:window.__u4Current.id,attempted:Number(document.querySelector('#attempted-count').textContent),correct:Number(document.querySelector('#correct-count').textContent),count:window.BatchMathRepro?.problemCount}));
    assert.equal(initial.id,p.id);
    const ok=i%2===0,index=ok?p.correctIndex:(p.correctIndex+1)%4;await page.locator('#choices > button').nth(index).click();
    await page.evaluate(()=>MathJax.typesetPromise([document.querySelector('#feedback')]));
    const result=await page.evaluate(()=>{
     const overflow=[];for(const selector of ['#question','#choices','#feedback']){const el=document.querySelector(selector);if(el.scrollWidth>el.clientWidth+3)overflow.push(`${selector} scrolls: ${el.scrollWidth}/${el.clientWidth}`);}
     for(const el of document.querySelectorAll('#question mjx-math,#choices mjx-math,#feedback mjx-math')){const box=el.closest('.choice,#question,#feedback'),b=box.getBoundingClientRect(),r=el.getBoundingClientRect();if(r.left<b.left-2||r.right>b.right+2)overflow.push(`Math spills ${r.width.toFixed(1)} in ${box.id||box.className}`);}
     return {overflow,mathErrors:[...document.querySelectorAll('mjx-merror,[data-mjx-error]')].map(e=>e.textContent),math:document.querySelectorAll('#question mjx-container').length,attempted:Number(document.querySelector('#attempted-count').textContent),correct:Number(document.querySelector('#correct-count').textContent),feedback:document.querySelector('#feedback .result').textContent};
    });
    assert.ok(result.math>0,'Question math was not typeset');if(result.mathErrors.length||result.overflow.length){report.failures.push({slug,width,signature,result});await page.locator('.practice-shell').screenshot({path:path.join(out,`failure-${width}-${slug}-${i}.png`)});}assert.equal(result.attempted,initial.attempted+1);assert.equal(result.correct,initial.correct+(ok?1:0));assert.equal(result.feedback,ok?'Correct.':'Not quite.');
    if(i<12&&width!==320){const filename=`${width}-${slug}-${signature}.png`.replace(/[^a-zA-Z0-9_.-]/g,'_');await page.locator('.practice-shell').screenshot({path:path.join(out,filename)});report.screenshots.push(filename);}
    const before=await page.evaluate(()=>BatchMathRepro.problemCount);await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('Enter');await page.waitForTimeout(100);const after=await page.evaluate(()=>BatchMathRepro.problemCount);assert.equal(after,before+1,'Enter must advance exactly one question');
    report.cases.push({slug,width,signature,correctResponse:ok});
   }
  }
  // Review uses the unchanged Practice Type selector and the same renderer.
  await page.goto(`${origin}/ap-calculus/unit-4-integrals/topics/comprehensive-review/practice/?bm_seed=unit4-J-review-${width}`,{waitUntil:'networkidle'});
  for(const mode of ['rect','trap','sigma']){await page.selectOption('#unit4Mode',mode);await page.evaluate(()=>MathJax.typesetPromise());const p=await page.evaluate(()=>window.__u4Current);assert.ok(p.unit4Meta);assert.equal(p.unit4Meta.kind,{rect:'rectangular',trap:'trapezoidal',sigma:'sigma'}[mode]);}
  assert.deepEqual(errors,[],'Page errors');await context.close();
 }
 assert.deepEqual(report.failures,[],'Targeted rendering/layout failures');report.ok=true;console.log(`PASS targeted desktop/mobile MathJax, choices, feedback, Enter flow: ${report.cases.length} problems`);
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
