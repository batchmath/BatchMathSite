// Real-page checks of only the v12.8.K work and the existing archive regression.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'qa-results','unit4-v128k-browser');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.csv':'text/csv'};
const server=http.createServer((req,res)=>{try{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
const report={ok:false,unit4:[],archive:[],screenshots:[],failures:[]};let browser;
async function screenshot(page,name,selector='body'){const file=name+'.png';await page.locator(selector).screenshot({path:path.join(out,file)});report.screenshots.push(file);}
async function rendered(page,selector='body'){await page.evaluate(selector=>MathJax.typesetPromise([document.querySelector(selector)]),selector);}
async function assertLayout(page,label){
 const result=await page.evaluate(()=>({errors:[...document.querySelectorAll('mjx-merror,[data-mjx-error]')].map(e=>e.textContent),bodyOverflow:document.documentElement.scrollWidth>innerWidth+3,overflow:[...document.querySelectorAll('#question,#choices,#feedback,.mile-card,.mile-hero,.mile-toolbar')].filter(e=>e.scrollWidth>e.clientWidth+3).map(e=>e.id||e.className)}));
 if(result.errors.length||result.overflow.length||result.bodyOverflow){report.failures.push({label,result});await screenshot(page,`failure-${label}`);}
 assert.deepEqual(result.errors,[],'MathJax error: '+label);assert.deepEqual(result.overflow,[],'Container overflow: '+label);assert.equal(result.bodyOverflow,false,'Page overflow: '+label);
}
const clone=x=>JSON.parse(JSON.stringify(x));
try{
 browser=await chromium.launch({headless:true});
 for(const width of [1280,375,320]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.abort());
  await context.addInitScript(()=>{let api;Object.defineProperty(window,'BatchMathAPTopicGenerators',{configurable:true,get:()=>api,set:original=>{api={...original,get:slug=>{const gen=original.get(slug);return gen?opts=>{const p=window.__forcedU4?structuredClone(window.__forcedU4):gen(opts);window.__currentU4=p;return p;}:gen;}};}});});
  const page=await context.newPage(),pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  for(const slug of ['rectangular-approximations','trapezoidal-approximations','introduction-to-sigma-notation']){
   await page.goto(`${origin}/ap-calculus/unit-4-integrals/topics/${slug}/practice/?bm_seed=unit4-K-${width}`,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>window.MathJax?.typesetPromise&&window.__currentU4?.unit4Meta,{timeout:60000});await page.evaluate(()=>MathJax.startup.promise);
   const samples=await page.evaluate(slug=>{const result=[],seen=new Set();for(let i=0;i<1500;i++){const p=BatchMathAPTopicGenerators.get(slug)(),d=p.unit4Meta,signature=d.kind==='sigma'?`${d.family}-${d.subtype}`:`${d.representation}-${d.family}-${d.mode}-${d.uniform?'equal':'unequal'}-${d.error?'reason':'value'}-${d.extraData?'extra':'regular'}-${d.relation?'relationship':''}`;if(!seen.has(signature)){seen.add(signature);result.push({p,signature});}}return result.slice(0,42);},slug);
   for(let index=0;index<samples.length;index++){
    const {p,signature}=samples[index];await page.evaluate(p=>{window.__forcedU4=p;document.querySelector('#next').hidden=false;},p);await page.locator('#next').click();await page.evaluate(()=>window.__forcedU4=null);await rendered(page,'#question');
    const initial=await page.evaluate(()=>({count:BatchMathRepro.problemCount,attempted:+document.querySelector('#attempted-count').textContent,correct:+document.querySelector('#correct-count').textContent,html:window.__currentU4.questionHtml}));assert.equal(initial.html,p.questionHtml,'Normalized display was altered');
    assert.equal(await page.locator('.staged-part-one .staged-choice').count(),0,'Numerical answers must not be multiple choice');assert.equal(await page.locator('.bm-calc-editor').count(),1,'Established structured editor missing');
    if(p.unit4Meta.representation==='table'){assert.equal(await page.locator('.u4-data-tables tr').count(),2);assert.equal(await page.locator('.u4-data-tables tr').first().locator('td').count(),p.unit4Meta.rows.length);}
    const canonical=await page.evaluate(p=>p.stage1.unit4Answer.kind==='scalar'?BatchMathUnit4Answers.expression(p.stage1.unit4Answer.value):Object.entries(p.stage1.unit4Answer.value).map(([k,c])=>`(${c[0]}/${c[1]})*n^(${k})`).join('+')||'0',p);
    const correct=index%3!==0,answer=correct?canonical:`(${canonical})+1`;
    // Exercise physical typing and the established structured paste path (a
    // slash typed interactively enters a denominator until the user leaves it).
    await page.locator('.bm-calc-editor').click();await page.keyboard.type('12');assert.equal(await page.locator('.staged-exact-input').inputValue(),'12');await page.keyboard.press('Control+z');assert.equal(await page.locator('.staged-exact-input').inputValue(),'1');await page.locator('.bm-calc-keypad button').filter({hasText:/^Clear$/}).click();
    await page.evaluate(answer=>{const data=new DataTransfer();data.setData('text/plain',answer);document.querySelector('.bm-calc-editor').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},answer);await page.keyboard.press('Enter');await page.waitForTimeout(30);
    assert.equal(await page.locator('.staged-part-one .result').count(),1);assert.equal((await page.locator('.staged-part-one .result').textContent()).includes('not correct'),!correct);
    if(p.stage2){
     if(!correct)await page.locator('.staged-continue').click();await page.waitForSelector('.staged-part-two');
     assert.equal(await page.locator('.staged-part-two .staged-choice').count(),8);const choice=index%4===0?(p.stage2.correctIndex+1)%8:p.stage2.correctIndex;await page.locator('.staged-part-two .staged-choice').nth(choice).click();
     const overall=correct&&choice===p.stage2.correctIndex;assert.equal(+(await page.locator('#correct-count').textContent()),initial.correct+(overall?1:0));
    }else assert.equal(+(await page.locator('#correct-count').textContent()),initial.correct+(correct?1:0));
    assert.equal(+(await page.locator('#attempted-count').textContent()),initial.attempted+1);await rendered(page,'#choices');await assertLayout(page,`${width}-${slug}-${index}`);
    if(index<7&&width!==320)await screenshot(page,`${width}-${slug}-${signature}`.replace(/[^a-zA-Z0-9_.-]/g,'_'),'.practice-shell');
    await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('Enter');await page.waitForTimeout(40);const after=await page.evaluate(()=>BatchMathRepro.problemCount);assert.equal(after,initial.count+1,'Completed Enter must advance exactly one problem');
    report.unit4.push({width,slug,signature});
   }
   if(slug==='rectangular-approximations'){
    assert.deepEqual(await page.locator('#rectangularMethod option').allTextContents(),['All','Right Endpoint','Left Endpoint','Midpoint']);
    for(const value of ['right','left','midpoint','all']){const before=await page.evaluate(()=>BatchMathRepro.problemCount);await page.selectOption('#rectangularMethod',value);assert.equal(await page.evaluate(()=>BatchMathRepro.problemCount),before,'Filter changed the current problem');await page.evaluate(()=>document.querySelector('#next').hidden=false);await page.locator('#next').click();if(value!=='all')assert.equal(await page.evaluate(()=>window.__currentU4.unit4Meta.mode),value);}
   }
  }
  await page.goto(`${origin}/ap-calculus/unit-4-integrals/topics/comprehensive-review/practice/?bm_seed=unit4-K-review-${width}`,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.__currentU4&&window.MathJax?.typesetPromise);await page.evaluate(()=>MathJax.startup.promise);
  for(const mode of ['rect','trap','sigma']){await page.selectOption('#unit4Mode',mode);await rendered(page,'#question');assert.equal(await page.locator('#rectangularMethod').count(),0);assert.equal(await page.locator('.bm-calc-editor').count(),1);assert.equal(await page.evaluate(()=>window.__currentU4.unit4Meta.kind),{rect:'rectangular',trap:'trapezoidal',sigma:'sigma'}[mode]);}
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('a.archive-spotlight[href="archive/"]').count(),1);assert.equal(await page.locator('a.mogollon-spotlight[href="/mogollon2026"]').count(),1);await screenshot(page,`${width}-homepage-archive-links`,'main');
  assert.deepEqual(pageErrors,[],'Unit 4 runtime errors');await context.close();
 }

 // Archive: real page, verified starter schema, then mutable network fixtures.
 const headers=['Mile','Published','Topic','ProblemLaTeX','SolutionLaTeX','Explanation','VideoURL','VideoLabel','PublishedDate'];
 const csv=rows=>rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');
 const starter=fs.readFileSync(path.join(root,'mogollon2026/starter.csv'),'utf8');
 for(const width of [1280,375,320]){
  const context=await browser.newContext({viewport:{width,height:768},serviceWorkers:'block'});await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(origin+'/mogollon2026',{waitUntil:'domcontentloaded'});await page.waitForSelector('.mile-card');await page.evaluate(()=>MathJax.startup.promise);await rendered(page);
  assert.deepEqual(await page.locator('.mile-card').evaluateAll(es=>es.map(e=>+e.dataset.mile)),[1,2,3,4,6,7]);assert.match(await page.locator('#mile-status').textContent(),/not connected/);
  assert.equal(await page.locator('.mile-solution[open]').count(),0);await page.locator('#mile-001 summary').click();await rendered(page);assert.ok(await page.locator('#mile-001 .mile-solution mjx-container').count()>0);await assertLayout(page,`${width}-archive-starter`);await screenshot(page,`${width}-mogollon-starter`);
  await page.locator('#mile-004 .mile-next').click();assert.equal(new URL(page.url()).hash,'#mile-006');await page.waitForTimeout(60);await page.locator('#mile-006 .mile-card-actions button').click();
  const portrait=await page.locator('.mile-video-dialog').evaluate(e=>{const r=e.getBoundingClientRect();return{portrait:e.classList.contains('is-portrait'),left:r.left,right:r.right,top:r.top,bottom:r.bottom,scroll:e.scrollHeight>e.clientHeight+1,width:innerWidth,height:innerHeight};});assert.ok(portrait.portrait);assert.ok(portrait.left>=0&&portrait.right<=portrait.width&&portrait.top>=0&&portrait.bottom<=portrait.height);assert.equal(portrait.scroll,false);await screenshot(page,`${width}-mogollon-portrait`);await page.keyboard.press('Escape');assert.equal(await page.locator('#mile-video-modal').isHidden(),true);
  await page.locator('#mile-search').fill('Mile 003');await page.waitForFunction(()=>document.querySelectorAll('.mile-card').length===1);assert.equal(await page.locator('.mile-card').getAttribute('id'),'mile-003');await page.locator('#mile-search').fill('');await page.selectOption('#mile-topic','Power Rule');await page.waitForFunction(()=>document.querySelectorAll('.mile-card').length===1);assert.equal(await page.locator('.mile-card').getAttribute('id'),'mile-007');await page.selectOption('#mile-topic','');
  let body=csv([headers,...Array.from({length:104},(_,i)=>i+1).filter(n=>n!==5).map(n=>[n,'TRUE',n%2?'Derivatives':'Limits',`x^{${n}}`,String.raw`\begin{aligned}A&=\frac{1}{2}+\frac{2}{3}+\frac{3}{4}+\frac{4}{5}\\&=\frac{163}{60}\end{aligned}`,String.raw`An inline expression: \(\frac{1}{2}\).`,'','',''])]);let requests=0,fail=false;const urls=[];
  await context.route('**/mogollon2026/starter.csv?*',route=>{requests++;urls.push(route.request().url());assert.match(route.request().url(),/_bm_refresh=/);return route.fulfill({status:fail?503:200,contentType:'text/csv',body});});
  await page.goto(origin+'/mogollon2026/#mile-104',{waitUntil:'domcontentloaded'});await page.waitForSelector('#mile-104');assert.equal(await page.locator('.mile-card').count(),103,'Direct-link target beyond the first page');assert.equal(await page.locator('#mile-005').count(),0);await page.locator('#mile-104 summary').click();await rendered(page);await assertLayout(page,`${width}-archive-growth`);
  await page.goto(origin+'/mogollon2026/',{waitUntil:'domcontentloaded'});await page.waitForSelector('.mile-card');assert.equal(await page.locator('.mile-card').count(),12);await page.locator('#mile-more').click();assert.equal(await page.locator('.mile-card').count(),24);await page.locator('#mile-search').fill('no match');await page.waitForSelector('.mile-empty');await page.locator('.mile-empty button').click();await page.waitForSelector('.mile-card');
  // Injecting arbitrary sheet text must never inject HTML or unsafe URLs.
  body=csv([headers,[1,'TRUE','<img src=x onerror=alert(1)>','x^2','2x','<script>throw Error("unsafe")</script>','javascript:alert(1)','',''],[5,'FALSE','','x','x','','','','']]);await page.locator('#mile-refresh').click();await page.waitForFunction(()=>document.querySelectorAll('.mile-card').length===1);assert.equal(await page.locator('.mile-card img,.mile-card script').count(),0);assert.equal(await page.locator('.mile-card-actions').count(),0);assert.equal(await page.locator('#mile-005').count(),0);
  // A landscape regular video must use the same local modal without distortion.
  body=csv([headers,[1,'TRUE','Test','x','x','','https://www.youtube.com/watch?v=IAn8hB0_lOM','Watch test video','']]);await page.locator('#mile-refresh').click();await page.waitForSelector('.mile-card-actions button');await page.locator('.mile-card-actions button').click();assert.equal(await page.locator('.mile-video-dialog').evaluate(e=>e.classList.contains('is-portrait')),false);const rect=await page.locator('.mile-video-dialog').boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=768);await page.keyboard.press('Escape');
  const before=requests;fail=true;await page.locator('#mile-refresh').click();await page.waitForSelector('#mile-error:not([hidden])');assert.equal(requests,before+2,'One retry only');assert.equal(await page.locator('.mile-card').count(),0,'No silently stale current content');fail=false;body=starter;await page.locator('#mile-retry').click();await page.waitForSelector('#mile-007');assert.equal(await page.locator('#mile-error').isHidden(),true);assert.ok(new Set(urls).size===urls.length,'Refresh URLs must not reuse cached requests');assert.deepEqual(errors,[],'Archive runtime errors');report.archive.push({width,requests,starterMiles:6,growthMiles:103});await context.close();
 }

 // Existing Problem of the Day: use its actual live CSV from a real browser.
 const context=await browser.newContext({viewport:{width:1280,height:768},serviceWorkers:'block'});await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.abort());const page=await context.newPage();
 await page.goto(origin+'/archive/',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('.problem-card',{timeout:60000});await page.evaluate(()=>MathJax.startup.promise);await rendered(page);const numbers=await page.locator('.problem-card').evaluateAll(es=>es.map(e=>+e.dataset.problemNumber));assert.ok(numbers.every((n,i)=>!i||numbers[i-1]>n));await page.locator('#solutions-tab').click();await page.waitForSelector('.solution-card');assert.equal(await page.locator('.solution-card button').filter({hasText:'Watch Original Short'}).count(),0);await page.locator('#problems-tab').click();await page.locator('#archive-search').fill('003');await page.waitForSelector('#problem-003');await page.locator('#refresh-archive').click();await page.waitForSelector('#problem-003');await screenshot(page,'1280-existing-pod-regression');await page.setViewportSize({width:375,height:812});await rendered(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3),false);await screenshot(page,'375-existing-pod-regression');await context.close();
 report.ok=true;console.log(`PASS v12.8.K browser QA: ${report.unit4.length} Unit 4 problems, all filters/review, ${report.archive.length} archive widths, live original archive regression`);
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
