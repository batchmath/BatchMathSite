import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../../',import.meta.url));
const evidence=path.join(root,'docs/integration/evidence');
const routes=JSON.parse(fs.readFileSync(path.join(evidence,'content-preservation.json'))).overlaps.map(r=>r.path);
const fixtures=process.env.MATHJAX_FIXTURE_ROOT;
assert.ok(fixtures,'Use the existing real MathJax fixture cache');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=pathname.startsWith('/__mathjax/')?path.join(fixtures,pathname.slice(11)):path.join(root,pathname);if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.BM_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
const results=[],errors=[];
async function advance(page){
 for(const selector of ['#startBtn:visible','#next:visible:enabled','#nextBtn:visible:enabled','#nextProblem:visible:enabled','.staged-continue:visible:enabled'])if(await page.locator(selector).count()){await page.locator(selector).first().click();return;}
 const choices=page.locator('.choice-btn:visible:enabled,.staged-choice:visible:enabled,.choice:visible:enabled').filter({hasNotText:/^(Check|Clear|Erase|Try again|Reset|Show|Hide|COURSES)/});
 if(await choices.count()){await choices.first().click();if(await page.locator('#submit:visible:enabled').count())await page.locator('#submit:visible:enabled').click();}
}
try{
 const jobs=routes.flatMap(route=>[375,768,1280].map(width=>({route,width})));let cursor=0;
 await Promise.all(Array.from({length:2},async()=>{while(cursor<jobs.length){
  const result=jobs[cursor++],{route,width}=result;
  const page=await browser.newPage({viewport:{width,height:950},serviceWorkers:'block'});page.setDefaultTimeout(10000);
  page.on('pageerror',e=>errors.push({...result,error:e.stack}));
  try{
   await page.route('https://**/*',r=>r.abort());
   await page.route('https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js',r=>r.fulfill({contentType:'text/javascript',body:`MathJax.loader={paths:{mathjax:'${base}/__mathjax/mathjax','mathjax-newcm':'${base}/__mathjax/mathjax-newcm'}};MathJax.chtml=Object.assign({},MathJax.chtml,{fontURL:'${base}/__mathjax/mathjax-newcm/chtml/woff2'});MathJax.output={font:'mathjax-newcm'};\n`+fs.readFileSync(fixtures+'/mathjax/tex-chtml.js','utf8')}));
   assert.equal((await page.goto(base+'/'+route+'?bm_seed=final-route-sweep',{waitUntil:'domcontentloaded'})).status(),200);
   for(let turn=0;turn<35;turn++){await page.waitForTimeout(150);if(await page.locator('math-field:visible').count())break;await advance(page);}
   await page.locator('math-field:visible').first().waitFor();
   await page.evaluate(async()=>{await window.MathJax?.startup?.promise;await document.fonts.ready;});
   const observed=await page.evaluate(()=>{
    const inputs=[...document.querySelectorAll('main input')].filter(i=>!i.disabled&&!i.readOnly&&!['checkbox','radio','button','submit'].includes(i.type)&&!i.closest('[hidden],.hidden,.staged-completed')&&(i.getClientRects().length||i.id==='answerRaw'));
    const fields=[...document.querySelectorAll('math-field')].filter(m=>m.getClientRects().length&&!m.readOnly);
    return {inputs:inputs.map(i=>({id:i.id,editor:i.dataset.editor})),fields:fields.length,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert.ok(observed.fields>0);assert.equal(observed.fields,observed.inputs.length);assert.ok(observed.inputs.every(i=>i.editor==='mathlive'));
   Object.assign(result,observed);
   await page.locator('math-field:visible').first().click();
   await page.waitForFunction(()=>document.activeElement?.tagName==='MATH-FIELD');
   await page.keyboard.type('7');
   await page.waitForFunction(()=>document.activeElement?.value?.includes('7'));
   result.focusAndPhysicalTyping=true;
   assert.equal(await page.locator('.bm-calc-editor:visible,#exactEditor:visible,.bm-fraction-editor:visible,.algebra-keypad:visible').count(),0);
   for(const element of await page.locator('math-field:visible,.bm-calc-keypad:visible').all()){
    const box=await element.boundingBox();assert.ok(box.width>0&&box.height>0&&box.x>=0&&box.x+box.width<=width+1,JSON.stringify(box));
   }
   const sources=await page.locator('script[src]').evaluateAll(s=>s.map(x=>x.getAttribute('src')).filter(x=>x.includes('/mathlive/')||x.includes('calculus-keypad')));
   assert.equal(new Set(sources).size,sources.length,'duplicate editor scripts');
   assert.equal(observed.overflow,false,'horizontal page overflow');
   Object.assign(result,{passed:true,...observed});
   if(route.includes('recursive-to-explicit-formulas')&&width===375)await page.screenshot({path:evidence+'/im1-recursive-375.png',fullPage:true});
  }catch(e){Object.assign(result,{passed:false,error:e.stack});console.log('FAIL',route,width,e.message);}
  finally{results.push(result);await page.close();}
 }}));
}finally{
 await browser.close();await new Promise(r=>server.close(r));
 fs.writeFileSync(path.join(evidence,'overlap-responsive.json'),JSON.stringify({results,errors,realMathJax:true},null,2)+'\n');
}
console.log(`${results.filter(r=>r.passed).length}/${results.length} overlap/width checks; ${errors.length} page errors`);
if(results.some(r=>!r.passed)||errors.length)process.exitCode=1;
