#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const moduleRoot=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if(!moduleRoot)throw new Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required');
const {chromium}=await import(pathToFileURL(path.join(moduleRoot,'playwright','index.mjs')).href);
const errors=[];let checks=0;
const assert=(condition,message)=>{checks++;if(!condition)errors.push(message);};
const PORT=4319;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
const server=http.createServer((request,response)=>{
  try{
    const url=new URL(request.url,'http://localhost'),relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
    let file=path.resolve(ROOT,relative);if(url.pathname.endsWith('/'))file=path.join(file,'index.html');
    if(!file.startsWith(ROOT)||!fs.existsSync(file)){response.writeHead(404).end('Not found');return;}
    response.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(file).pipe(response);
  }catch(error){response.writeHead(500).end(String(error));}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(PORT,'127.0.0.1',resolve);});

const routes=[
  {name:'at-point',path:'/ap-calculus/unit-2-derivatives/topics/comprehensive-review/derivatives-at-a-point-practice/',options:['mixed','basic','product','quotient','trig','exponential','logarithmic','invtrig','implicit']},
  {name:'nested-chain',path:'/ap-calculus/unit-2-derivatives/topics/the-chain-rule/nested-chain-rule-practice/',options:['mixed','foundation','three','four','five']}
];

let browser;
try{
  browser=await chromium.launch({headless:true,args:['--disable-background-networking']});
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1280,height:900}});
  await context.route('**/*',route=>{const host=new URL(route.request().url()).hostname;if(host==='127.0.0.1'||host==='localhost')route.continue();else route.abort();});

  const comp=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-2-derivatives/topics/comprehensive-review/index.html'),'utf8');
  assert(comp.includes('derivatives-at-a-point-practice/'),'Comprehensive Review launch for derivatives at a point is missing');
  const chain=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-2-derivatives/topics/the-chain-rule/index.html'),'utf8');
  assert(chain.includes('nested-chain-rule-practice/'),'Chain Rule launch for nested practice is missing');
  const review=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html'),'utf8');
  assert(!review.includes('<option value="point">'),'Old focused at-point option remains in the general Comprehensive Review selector');
  assert(!/const mixedWeights=\[[^\]]*"point"/.test(review),'At-point questions remain in Comprehensive Review Mixed practice');

  for(const engine of routes){
    const page=await context.newPage();const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(String(error.message||error)));
    await page.goto(`http://127.0.0.1:${PORT}${engine.path}?bm_seed=10901&bm_qa=1`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__BM_CURRENT_PROBLEM&&window.BatchMathDerivativeExpressions&&window.BatchMathCalculusKeypad);
    assert(await page.locator('label[for="practice-type"]').textContent()==='Practice Type',`${engine.name}: selector label is not Practice Type`);
    assert(await page.locator('#practice-type option').count()===engine.options.length,`${engine.name}: unexpected selector option count`);

    if(engine.name==='nested-chain'){
      await page.locator('.bm-calc-editor').click();
      await page.keyboard.type("f'(x)");
      assert(await page.locator('#answer').inputValue()==='fp(x)',`nested-chain: physical f'(x) entry did not normalize to fp(x)`);
      await page.locator('.bm-calc-key', {hasText:'Clear'}).click();
      await page.locator('.bm-calc-key', {hasText:'f′'}).first().click();
      assert(await page.locator('#answer').inputValue()==='fp()',`nested-chain: f′ keypad key did not insert fp()`);
      await page.locator('.bm-calc-key', {hasText:'Clear'}).click();
    }

    for(const option of engine.options){
      await page.selectOption('#practice-type',option);
      await page.waitForFunction(value=>window.__BM_CURRENT_PROBLEM?.group&&(value==='mixed'||window.__BM_CURRENT_PROBLEM.group===value),option);
      const ids=new Set();
      for(let i=0;i<8;i++){
        const problem=await page.evaluate(()=>({id:window.__BM_CURRENT_PROBLEM.id,group:window.__BM_CURRENT_PROBLEM.group,answerExpr:window.__BM_CURRENT_PROBLEM.answerExpr,steps:window.__BM_CURRENT_PROBLEM.steps.length}));
        ids.add(problem.id);
        assert(option==='mixed'||problem.group===option,`${engine.name}/${option}: generated wrong family ${problem.group}`);
        assert(problem.steps>=3,`${engine.name}/${option}: walkthrough has fewer than three steps`);
        await page.evaluate(answer=>{const input=document.getElementById('answer');input.value=answer;input.dispatchEvent(new Event('input',{bubbles:true}));},problem.answerExpr);
        await page.click('#submit');
        assert((await page.locator('#feedback .status').textContent())==='Correct.',`${engine.name}/${option}: engine rejected its own correct answer`);
        assert(await page.locator('#show-explanation').isVisible(),`${engine.name}/${option}: correct response lacks Show Explanation`);
        assert(await page.locator('#method').isHidden(),`${engine.name}/${option}: correct walkthrough was not optional`);
        await page.click('#show-explanation');
        assert(await page.locator('#method').isVisible(),`${engine.name}/${option}: Show Explanation did not reveal walkthrough`);
        await page.click('#next');
        await page.waitForFunction(previous=>window.__BM_CURRENT_PROBLEM.id!==previous,problem.id);
      }
      assert(ids.size>=5,`${engine.name}/${option}: insufficient problem variety across eight generations (${ids.size})`);
    }

    const wrong=await page.evaluate(()=>window.__BM_CURRENT_PROBLEM.id);
    await page.evaluate(()=>{const input=document.getElementById('answer');input.value='999999';input.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.click('#submit');
    assert((await page.locator('#feedback .status').textContent())==='Not quite.',`${engine.name}: wrong answer was not marked wrong`);
    assert(await page.locator('#method').isVisible(),`${engine.name}: wrong answer did not automatically reveal walkthrough`);
    await page.click('#next');await page.waitForFunction(previous=>window.__BM_CURRENT_PROBLEM.id!==previous,wrong);

    const correctProblem=await page.evaluate(()=>window.__BM_CURRENT_PROBLEM);
    await page.evaluate(answer=>{const input=document.getElementById('answer');input.value=answer;input.dispatchEvent(new Event('input',{bubbles:true}));},correctProblem.answerExpr);
    await page.click('#submit');
    const before=await page.evaluate(()=>({id:window.__BM_CURRENT_PROBLEM.id,count:window.BatchMathRepro?.snapshot?.().problemCount}));
    await page.locator('#next').focus();await page.keyboard.press('Enter');
    await page.waitForFunction(id=>window.__BM_CURRENT_PROBLEM.id!==id,before.id);
    const after=await page.evaluate(()=>({id:window.__BM_CURRENT_PROBLEM.id,count:window.BatchMathRepro?.snapshot?.().problemCount}));
    assert(after.id!==before.id,`${engine.name}: Enter did not advance`);
    if(Number.isFinite(before.count)&&Number.isFinite(after.count))assert(after.count===before.count+1,`${engine.name}: Enter advanced more than one problem`);

    await page.setViewportSize({width:390,height:844});
    const layout=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth,select:document.getElementById('practice-type').getBoundingClientRect().right}));
    assert(layout.doc<=layout.viewport+1&&layout.body<=layout.viewport+1,`${engine.name}: mobile page overflows horizontally`);
    assert(layout.select<=layout.viewport,`${engine.name}: mobile selector overflows`);
    assert(pageErrors.length===0,`${engine.name}: page errors: ${pageErrors.join(' | ')}`);
    await page.close();
  }
  await context.close();
}finally{
  if(browser)await browser.close().catch(()=>{});
  await new Promise(resolve=>server.close(resolve));
}

console.log('New derivative engines QA');
console.log(`Result: ${errors.length?'FAIL':'PASS'}`);
console.log(`Checks: ${checks}`);
console.log(`Errors: ${errors.length}`);
for(const error of errors)console.log(`- ${error}`);
if(errors.length)process.exit(1);
