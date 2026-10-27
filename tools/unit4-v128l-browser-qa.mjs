// Real-page checks of only the v12.8.L work and the existing archive regression.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'qa-results','unit4-v128l-browser');fs.mkdirSync(out,{recursive:true});
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
async function pasteAnswer(page,answer){await page.locator('.bm-calc-editor').click();await page.evaluate(answer=>{const data=new DataTransfer();data.setData('text/plain',answer);document.querySelector('.bm-calc-editor').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},answer);await page.keyboard.press('Enter');}
async function checkReview(page,mode,width){
 const examples=await page.evaluate(mode=>{const gen=BatchMathAPTopicGenerators.get({rect:'rectangular-approximations',trap:'trapezoidal-approximations',sigma:'introduction-to-sigma-notation'}[mode]),out=[];for(let i=0;i<1000&&out.length<(mode==='sigma'?1:2);i++){const p=gen();if(mode==='sigma'||p.unit4Meta.representation==='table'&&Boolean(p.stage2)===(out.length===1))out.push(p);}return out;},mode);
 assert.equal(examples.length,mode==='sigma'?1:2);
 for(const p of examples){
  await page.evaluate(p=>{window.__forcedU4=p;document.querySelector('#next').hidden=false;},p);await page.locator('#next').click();await page.evaluate(()=>window.__forcedU4=null);await rendered(page,'#choices');
  assert.equal(await page.locator('.staged-check').textContent(),p.stage2?'Check Part 1':'Check Answer');assert.equal(await page.locator('.u4-partition-endpoint,.u4-table-key').count(),0);
  assert.equal(await page.locator('.u4-data-tables td').evaluateAll(es=>es.every(e=>e.attributes.length===0)),true);
  const answer=await page.evaluate(p=>p.stage1.unit4Answer.kind==='scalar'?BatchMathUnit4Answers.expression(p.stage1.unit4Answer.value):Object.entries(p.stage1.unit4Answer.value).map(([k,c])=>`(${c[0]}/${c[1]})*n^(${k})`).join('+')||'0',p);
  await pasteAnswer(page,answer);
  if(p.stage2){await page.locator('.staged-continue').click();await page.locator('.staged-part-two .staged-choice').nth(p.stage2.correctIndex).click();assert.equal(await page.locator('.u4-approximation-sketch svg').count(),1);assert.equal(await page.locator('#choices > section').first().getAttribute('aria-label'),'Part 2');}
  else assert.doesNotMatch(await page.locator('.result').textContent(),/Part 1/);
  await rendered(page,'#choices');await assertLayout(page,`${width}-review-${mode}-${p.stage2?'two':'one'}`);
 }
}
async function checkHomework(page,width){
 await page.goto(origin+'/ap-calculus/unit-2-derivatives/topics/the-quotient-rule/',{waitUntil:'domcontentloaded'});
 const resource=page.locator('[data-v11-resource="05a-tables"]'),buttons=resource.locator('.hw-video-button');
 assert.deepEqual(await resource.locator('a').evaluateAll(es=>es.map(e=>e.getAttribute('href'))),['../../resources/assignments/05a-product-and-quotient-rule-derivatives-from-tables.pdf','../../resources/answer-keys/05a-product-and-quotient-rule-derivatives-from-tables-answer-key.pdf']);
 assert.equal(await buttons.count(),2);
 for(const [index,id,title]of [[0,'SBptj5k5CUQ','Derivatives with Tables — Product & Quotient Rule'],[1,'HMngqzrVM98','Derivatives from Tables']]){
  const button=buttons.nth(index),slot=page.locator('#hw-video-'+id),frame=slot.locator('iframe');
  assert.equal(await button.getAttribute('aria-controls'),'hw-video-'+id);assert.equal(await button.getAttribute('aria-expanded'),'false');assert.equal(await slot.isVisible(),false);
  await button.click();assert.equal(await button.getAttribute('aria-expanded'),'true');assert.equal(await slot.isVisible(),true);assert.match(await frame.getAttribute('src'),new RegExp('/embed/'+id+'\\?'));assert.equal(await frame.getAttribute('title'),title);assert.equal(await frame.getAttribute('loading'),'lazy');assert.equal(await frame.getAttribute('allowfullscreen'),'');assert.doesNotMatch(await frame.getAttribute('src'),/autoplay=1/);
  const bounds=await frame.boundingBox();assert.ok(Math.abs(bounds.width/bounds.height-16/9)<.02);assert.equal(await buttons.nth(1-index).getAttribute('aria-expanded'),'false');
  await button.click();assert.equal(await slot.isVisible(),false);assert.equal(await button.getAttribute('aria-expanded'),'false');await button.click();assert.equal(await slot.isVisible(),true);await button.click();
 }
 await buttons.nth(0).click();await buttons.nth(1).click();assert.equal(await resource.locator('.hw-video-slot.open').count(),2);await screenshot(page,`${width}-quotient-table-walkthroughs`,'.resource-list');await buttons.nth(0).click();await buttons.nth(1).click();
 for(const id of ['Z9mNk5zIf9k','1CtXXmE-Gms']){const button=page.locator(`[aria-controls="hw-video-${id}"]`);await button.click();assert.equal(await page.locator('#hw-video-'+id).isVisible(),true);await button.click();assert.equal(await page.locator('#hw-video-'+id).isVisible(),false);}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3),false,'Quotient page overflow');
}
async function checkPodVideo(page){
 const button=page.locator('.solution-card button,.problem-card button').filter({hasText:/Watch (?:Video Solution|Original Short)/}).first();
 if(await button.count()){await button.click();await page.waitForSelector('#archive-video-modal:not([hidden])');await page.keyboard.press('Escape');}
}
async function checkSharedTheoremFlow(page){
 for(const slug of ['rolle-s-theorem-and-the-mean-value-theorem','l-hopital-s-rule']){
  await page.goto(`${origin}/ap-calculus/unit-3-applications-derivative/topics/${slug}/practice/`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__currentU4&&window.MathJax?.typesetPromise);
  for(const firstCorrect of [false,true]){
   const p=await page.evaluate(slug=>{for(let i=0;i<1000;i++){const p=BatchMathAPTopicGenerators.get(slug)();if(p.stage2)return p;}throw Error('No applicable theorem problem');},slug);
   await page.evaluate(p=>{window.__forcedU4=p;document.querySelector('#next').hidden=false;},p);await page.locator('#next').click();await page.evaluate(()=>window.__forcedU4=null);const before=await page.evaluate(()=>BatchMathRepro.problemCount);
   await page.locator('.staged-part-one .staged-choice').nth(firstCorrect?p.stage1.correctIndex:(p.stage1.correctIndex+1)%p.stage1.choices.length).click();
   if(await page.locator('.staged-continue').count())await page.locator('.staged-continue').click();await page.waitForSelector('.staged-part-two .bm-calc-editor');
   const input=page.locator('.staged-part-two .bm-calc-editor');await input.click();await page.evaluate(answer=>{const data=new DataTransfer();data.setData('text/plain',answer);document.querySelector('.staged-part-two .bm-calc-editor').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},Number(p.stage2.numericAnswer)===0?'1':'0');await page.keyboard.press('Enter');await page.waitForSelector('.staged-part-two .result.bad');
   await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>BatchMathRepro.problemCount),before,'Wrong theorem Part 2 must still block Enter-to-next');await page.locator('#next').click();assert.equal(await page.evaluate(()=>BatchMathRepro.problemCount),before+1);
  }
 }
}
try{
 browser=await chromium.launch({headless:true});
 for(const width of [1280,375,320]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.abort());
  await context.addInitScript(()=>{let api;Object.defineProperty(window,'BatchMathAPTopicGenerators',{configurable:true,get:()=>api,set:original=>{api={...original,get:slug=>{const gen=original.get(slug);return gen?opts=>{const p=window.__forcedU4?structuredClone(window.__forcedU4):gen(opts);window.__currentU4=p;return p;}:gen;}};}});});
  const page=await context.newPage(),pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  for(const slug of ['rectangular-approximations','trapezoidal-approximations','introduction-to-sigma-notation']){
   await page.goto(`${origin}/ap-calculus/unit-4-integrals/topics/${slug}/practice/?bm_seed=unit4-L-${width}`,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>window.MathJax?.typesetPromise&&window.__currentU4?.unit4Meta,{timeout:60000});await page.evaluate(()=>MathJax.startup.promise);
   const samples=await page.evaluate(slug=>{const result=[],seen=new Set();for(let i=0;i<1500;i++){const p=BatchMathAPTopicGenerators.get(slug)(),d=p.unit4Meta,signature=d.kind==='sigma'?`${d.family}-${d.subtype}`:`${d.representation}-${d.family}-${d.mode}-${d.uniform?'equal':'unequal'}-${d.error?'reason':'value'}-${d.extraData?'extra':'regular'}-${d.relation?'relationship':''}`;if(!seen.has(signature)){seen.add(signature);result.push({p,signature});}}return result.slice(0,42);},slug);
   for(let index=0;index<samples.length;index++){
    const {p,signature}=samples[index];await page.evaluate(p=>{window.__forcedU4=p;document.querySelector('#next').hidden=false;},p);await page.locator('#next').click();await page.evaluate(()=>window.__forcedU4=null);await rendered(page,'#question');
    assert.equal(await page.locator('.staged-check').textContent(),p.stage2?'Check Part 1':'Check Answer');
    assert.equal(await page.locator('.u4-partition-endpoint,.u4-table-key').count(),0);
    assert.equal(await page.locator('.u4-data-tables td').evaluateAll(es=>es.every(e=>e.attributes.length===0)),true,'No answer-relevant cell attributes');
    const initial=await page.evaluate(()=>({count:BatchMathRepro.problemCount,attempted:+document.querySelector('#attempted-count').textContent,correct:+document.querySelector('#correct-count').textContent,html:window.__currentU4.questionHtml}));assert.equal(initial.html,p.questionHtml,'Normalized display was altered');
    assert.equal(await page.locator('.staged-part-one .staged-choice').count(),0,'Numerical answers must not be multiple choice');assert.equal(await page.locator('.bm-calc-editor').count(),1,'Established structured editor missing');
    if(p.unit4Meta.representation==='table'){assert.equal(await page.locator('.u4-data-tables tr').count(),2);assert.equal(await page.locator('.u4-data-tables tr').first().locator('td').count(),p.unit4Meta.rows.length);}
    const canonical=await page.evaluate(p=>p.stage1.unit4Answer.kind==='scalar'?BatchMathUnit4Answers.expression(p.stage1.unit4Answer.value):Object.entries(p.stage1.unit4Answer.value).map(([k,c])=>`(${c[0]}/${c[1]})*n^(${k})`).join('+')||'0',p);
    const correct=index%3!==0,answer=correct?canonical:`(${canonical})+1`;
    // Exercise physical typing and the established structured paste path (a
    // slash typed interactively enters a denominator until the user leaves it).
    await page.locator('.bm-calc-editor').click();await page.keyboard.type('12');assert.equal(await page.locator('.staged-exact-input').inputValue(),'12');await page.keyboard.press('Control+z');assert.equal(await page.locator('.staged-exact-input').inputValue(),'1');await page.locator('.bm-calc-keypad button').filter({hasText:/^Clear$/}).click();
    if(index===0){await page.getByRole('button',{name:'Insert stacked fraction',exact:true}).click();assert.equal(await page.locator('.bm-calc-editor .bm-calc-frac').count(),1);await page.keyboard.press('Control+z');assert.equal(await page.locator('.bm-calc-editor .bm-calc-frac').count(),0);await page.keyboard.press('Control+y');assert.equal(await page.locator('.bm-calc-editor .bm-calc-frac').count(),1);await page.locator('.bm-calc-keypad button').filter({hasText:/^Clear$/}).click();}
    if(p.stage1.keypadMode==='unit4-sigma'&&index===0){await page.locator('.bm-calc-keypad button').filter({hasText:/^n$/}).click();assert.equal(await page.locator('.staged-exact-input').inputValue(),'n');await page.locator('.bm-calc-keypad button').filter({hasText:/^Clear$/}).click();}
    await page.evaluate(answer=>{const data=new DataTransfer();data.setData('text/plain',answer);document.querySelector('.bm-calc-editor').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},answer);await page.keyboard.press('Enter');await page.waitForTimeout(30);
    assert.equal(await page.locator('.staged-part-one .result').count(),1);if(!p.stage2)assert.doesNotMatch(await page.locator('.staged-part-one .result').textContent(),/Part 1/);assert.equal((await page.locator('.staged-part-one .result').textContent()).toLowerCase().includes('not correct'),!correct);
    if(p.stage2){
     await page.locator('.staged-continue').click();await page.waitForSelector('.staged-part-two');
     assert.equal(await page.locator('#choices > section').first().getAttribute('aria-label'),'Part 2');assert.equal(await page.locator('.staged-review-heading').textContent(),'Completed Part 1');await page.waitForFunction(()=>document.querySelector('.staged-part-two')===document.activeElement);assert.equal(await page.locator('.staged-part-two').evaluate(e=>e===document.activeElement),true);await page.waitForFunction(()=>{const r=document.querySelector('.staged-part-two').getBoundingClientRect();return r.top>=0&&r.top<100;});const activeTop=await page.locator('.staged-part-two').boundingBox();assert.ok(activeTop.y>=0&&activeTop.y<100,'Part 2 should be at the top of the viewport: '+JSON.stringify(activeTop));assert.equal(await page.locator('.staged-part-two .staged-choice').count(),8);const choice=index%4===0?(p.stage2.correctIndex+1)%8:p.stage2.correctIndex;await page.locator('.staged-part-two .staged-choice').nth(choice).click();
     assert.equal(await page.locator('.staged-part-two .u4-approximation-sketch svg').count(),1);assert.equal(await page.locator('.staged-part-two .u4-sketch-approximation').count(),p.unit4Meta.n);const overall=correct&&choice===p.stage2.correctIndex;assert.equal(+(await page.locator('#correct-count').textContent()),initial.correct+(overall?1:0));
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
  await page.goto(`${origin}/ap-calculus/unit-4-integrals/topics/comprehensive-review/practice/?bm_seed=unit4-L-review-${width}`,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>window.__currentU4&&window.MathJax?.typesetPromise);await page.evaluate(()=>MathJax.startup.promise);
  for(const mode of ['rect','trap','sigma']){await page.selectOption('#unit4Mode',mode);await rendered(page,'#question');assert.equal(await page.locator('#rectangularMethod').count(),0);assert.equal(await page.locator('.bm-calc-editor').count(),1);assert.equal(await page.evaluate(()=>window.__currentU4.unit4Meta.kind),{rect:'rectangular',trap:'trapezoidal',sigma:'sigma'}[mode]);await checkReview(page,mode,width);}
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('a.archive-spotlight[href="archive/"]').count(),1);assert.equal(await page.locator('a.mogollon-spotlight[href="/mogollon2026"]').count(),1);await page.locator('.mogollon-spotlight').scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const i=document.querySelector('.mogollon-spotlight img');return i?.complete&&i.naturalWidth>0;});const sizes=await page.evaluate(()=>{const a=document.querySelector('a.archive-spotlight').getBoundingClientRect(),b=document.querySelector('a.mogollon-spotlight').getBoundingClientRect(),i=document.querySelector('.mogollon-spotlight img');return {a:{width:a.width,bottom:a.bottom},b:{width:b.width,top:b.top,left:b.left,right:b.right},loaded:i.complete&&i.naturalWidth>0,w:innerWidth};});assert.ok(sizes.loaded);assert.ok(sizes.b.width<sizes.a.width*.82);assert.ok(sizes.b.top>sizes.a.bottom);assert.ok(Math.abs((sizes.b.left+sizes.b.right)/2-sizes.w/2)<3);await screenshot(page,`${width}-homepage-archive-links`,'main');await checkHomework(page,width);
  if(width===1280)await checkSharedTheoremFlow(page);
  assert.deepEqual(pageErrors,[],'Unit 4 runtime errors');await context.close();
 }

 // Archive: actual published Google CSV in the browser, then mutable network fixtures.
 const headers=['Mile','Published','Topic','ProblemLaTeX','SolutionLaTeX','Explanation','VideoURL','VideoLabel','PublishedDate'];
 const csv=rows=>rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');
 const starter=fs.readFileSync(path.join(root,'mogollon2026/starter.csv'),'utf8');
 for(const width of [1280,375,320]){
  const context=await browser.newContext({viewport:{width,height:768},serviceWorkers:'block'});await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(origin+'/mogollon2026',{waitUntil:'domcontentloaded'});await page.waitForSelector('.mile-card');await page.evaluate(()=>MathJax.startup.promise);await rendered(page);
  await page.keyboard.press('Tab');assert.equal(await page.locator('.skip-link').evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Tab');assert.equal(await page.locator('.skip-link').evaluate(e=>getComputedStyle(e).clipPath),'inset(50%)');
  assert.deepEqual(await page.locator('.mile-card').evaluateAll(es=>es.map(e=>+e.dataset.mile)),[1,2,3,4,6,7]);assert.doesNotMatch(await page.locator('#mile-status').textContent(),/not connected|starter/i);assert.match(await page.locator('#mile-status').textContent(),/Updated/);
  assert.equal(await page.locator('.mile-solution[open]').count(),0);await page.locator('#mile-001 summary').click();await rendered(page);assert.ok(await page.locator('#mile-001 .mile-solution mjx-container').count()>0);await assertLayout(page,`${width}-archive-starter`);await screenshot(page,`${width}-mogollon-starter`);
  await page.locator('#mile-004 .mile-next').click();assert.equal(new URL(page.url()).hash,'#mile-006');await page.waitForTimeout(60);await page.locator('#mile-006 .mile-card-actions button').click();
  const portrait=await page.locator('.mile-video-dialog').evaluate(e=>{const r=e.getBoundingClientRect();return{portrait:e.classList.contains('is-portrait'),left:r.left,right:r.right,top:r.top,bottom:r.bottom,scroll:e.scrollHeight>e.clientHeight+1,width:innerWidth,height:innerHeight};});assert.ok(portrait.portrait);assert.ok(portrait.left>=0&&portrait.right<=portrait.width&&portrait.top>=0&&portrait.bottom<=portrait.height);assert.equal(portrait.scroll,false);await screenshot(page,`${width}-mogollon-portrait`);await page.keyboard.press('Escape');assert.equal(await page.locator('#mile-video-modal').isHidden(),true);
  await page.locator('#mile-search').fill('Mile 003');await page.waitForFunction(()=>document.querySelectorAll('.mile-card').length===1);assert.equal(await page.locator('.mile-card').getAttribute('id'),'mile-003');await page.locator('#mile-search').fill('');await page.selectOption('#mile-topic','Power Rule');await page.waitForFunction(()=>document.querySelectorAll('.mile-card').length===1);assert.equal(await page.locator('.mile-card').getAttribute('id'),'mile-007');await page.selectOption('#mile-topic','');
  let body=csv([headers,...Array.from({length:104},(_,i)=>i+1).filter(n=>n!==5).map(n=>[n,'TRUE',n%2?'Derivatives':'Limits',`x^{${n}}`,String.raw`\begin{aligned}A&=\frac{1}{2}+\frac{2}{3}+\frac{3}{4}+\frac{4}{5}\\&=\frac{163}{60}\end{aligned}`,String.raw`An inline expression: \(\frac{1}{2}\).`,'','',''])]);let requests=0,fail=false;const urls=[];
  await context.route('https://docs.google.com/spreadsheets/d/e/2PACX-1vSk4KcSiCIWnvCibqoiMlieK0ivKTttMMpnoqLKWAIC1wv1hx4LE_TwF63_W3InPnfRJ5sylvvN4fN3/pub?*',route=>{requests++;urls.push(route.request().url());assert.match(route.request().url(),/_bm_refresh=/);return route.fulfill({status:fail?503:200,contentType:'text/csv',headers:{'access-control-allow-origin':'*'},body});});
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
 await page.goto(origin+'/archive/',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('.problem-card',{timeout:60000});await page.evaluate(()=>MathJax.startup.promise);await rendered(page);const numbers=await page.locator('.problem-card').evaluateAll(es=>es.map(e=>+e.dataset.problemNumber));assert.ok(numbers.every((n,i)=>!i||numbers[i-1]>n));await page.locator('#solutions-tab').click();await page.waitForSelector('.solution-card');assert.equal(await page.locator('.solution-card button').filter({hasText:'Watch Original Short'}).count(),0);await checkPodVideo(page);await page.locator('#problems-tab').click();await page.locator('#archive-search').fill('003');await page.waitForSelector('#problem-003');await page.locator('#refresh-archive').click();await page.waitForSelector('#problem-003');await screenshot(page,'1280-existing-pod-regression');await page.setViewportSize({width:375,height:812});await rendered(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3),false);await screenshot(page,'375-existing-pod-regression');await checkPodVideo(page);await context.close();
 report.ok=true;console.log(`PASS v12.8.L browser QA: ${report.unit4.length} Unit 4 problems, all filters/review, ${report.archive.length} archive widths, live original archive regression`);
}catch(error){report.failures.push({error:String(error),stack:error.stack});const page=browser?.contexts().at(-1)?.pages().at(-1);if(page){report.failureUrl=page.url();report.failureGeometry=await page.evaluate(()=>({scrollY,focused:document.activeElement?.className,part:document.querySelector('.staged-part-two')?.getBoundingClientRect().toJSON(),problem:window.__currentU4?.unit4Meta})).catch(()=>null);await page.screenshot({path:path.join(out,'failure-final.png'),fullPage:true}).catch(()=>{});}throw error;}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}

