// Targeted browser QA of the two new live, written-only document views.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {localMathJax} from './mathjax-browser-qa.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'qa-results/running-documents-v128m');fs.mkdirSync(out,{recursive:true});
const require=createRequire(import.meta.url),pod=require(path.join(root,'archive/archive.js')),mog=require(path.join(root,'mogollon2026/mogollon2026.js'));
const sources=[{key:'pod',path:'/archive/',api:pod,min:19},{key:'mogollon',path:'/mogollon2026/',api:mog,min:6}];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.csv':'text/csv','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'};
const server=http.createServer((req,res)=>{try{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,report={ok:false,live:[],fixtures:[],printing:[],failures:[]};let browser;
const csv=rows=>rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
async function ready(page,{formatted=true}={}){await page.waitForFunction(()=>document.querySelector('#running-content')?.getAttribute('aria-busy')==='false'&&(document.querySelector('.running-entry')||!document.querySelector('#running-error').hidden),null,{timeout:60000});assert.equal(await page.locator('#running-error').isHidden(),true,await page.locator('#running-status').textContent());if(formatted){assert.equal(await page.locator('#running-math-warning').isHidden(),true,'Math must render in the real pinned-renderer tests');await page.evaluate(()=>MathJax.startup.promise);}assert.equal(await page.locator('script[src="/assets/pwa.js"]').count(),0,'Document-only pages need no PWA registration');}
async function clean(page){
 assert.equal(await page.locator('iframe,video,a[href*="youtu"],a[href*="vimeo"],[class*="video"],input[type="search"],select').count(),0,'Written documents contain no video/filter UI');
 assert.equal(await page.locator('mjx-merror,[data-mjx-error]').count(),0,'Document MathJax error');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'Document page overflow');
 assert.equal(await page.locator('button').filter({hasText:/Show More|Show Older|Watch/i}).count(),0,'No pagination/video controls');
 assert.ok(await page.locator('mjx-container').count()>0);
}
async function checkPrinting(page,source,numbers,{pdf=false,sentinels=false,suffix='live'}={}){
 const original=await page.locator('#running-content').innerHTML(),written=await page.locator('.running-written-section').count();
 const full=page.getByRole('button',{name:'Print / Save as PDF',exact:true}),problems=page.getByRole('button',{name:'Print / Save Problems Only',exact:true});
 assert.equal(await full.isEnabled(),true);assert.equal(await problems.isEnabled(),true);
 await page.evaluate(()=>{window.__printModes=[];window.print=()=>window.__printModes.push(document.body.classList.contains('running-problems-only'));});
 let fullPages;
 for(const mode of ['full','problems']){
  await (mode==='full'?full:problems).click();assert.equal(await page.evaluate(()=>window.__printModes.at(-1)),mode==='problems','Separate controls must select the intended print mode');
  await page.emulateMedia({media:'print'});
  const layout=await page.evaluate(()=>{const style=e=>getComputedStyle(e),entries=[...document.querySelectorAll('.running-entry')];return {bg:style(document.body).backgroundColor,color:style(document.body).color,nav:style(document.querySelector('.running-nav')).display,controls:style(document.querySelector('.running-controls')).display,status:style(document.querySelector('.running-status')).display,footer:style(document.querySelector('.running-footer')).display,numbers:entries.filter(e=>style(e).display!=='none').map(e=>+e.dataset.number),written:[...document.querySelectorAll('.running-written-section')].filter(e=>style(e).display!=='none').length,metadata:[...document.querySelectorAll('.running-meta')].filter(e=>style(e).display!=='none').length,entries:entries.map(e=>{const s=style(e);return {before:s.breakBefore,after:s.breakAfter,inside:s.breakInside,padding:parseFloat(s.paddingTop)+parseFloat(s.paddingBottom),heading:parseFloat(style(e.querySelector('h2')).fontSize)};})};});
  assert.deepEqual({bg:layout.bg,color:layout.color,nav:layout.nav,controls:layout.controls,status:layout.status,footer:layout.footer},{bg:'rgb(255, 255, 255)',color:'rgb(0, 0, 0)',nav:'none',controls:'none',status:'none',footer:'none'});
  assert.deepEqual(layout.numbers,numbers,'Print every current problem in the original increasing order');
  assert.equal(layout.written,mode==='full'?written:0,'Problems Only must hide every solution, explanation, and alternative section');
  if(mode==='problems'){
   assert.equal(layout.metadata,0,'Omit large metadata blocks');
   for(const entry of layout.entries){assert.equal(entry.before,'auto');assert.equal(entry.after,'auto');assert.ok(['avoid','avoid-page'].includes(entry.inside));assert.ok(entry.padding<=21,'Use compact worksheet spacing');assert.ok(entry.heading<=14.1,'Use compact problem headings');}
  }
  assert.equal(await page.locator('iframe,video,a[href*="youtu"],a[href*="vimeo"]').count(),0,'Never print video content or links');
  if(pdf){
   const file=path.join(out,`${source.key}-${suffix}-${mode}-print.pdf`);await page.pdf({path:file,format:'Letter',printBackground:true});
   const text=execFileSync('pdftotext',['-layout',file,'-'],{encoding:'utf8'}),info=execFileSync('pdfinfo',[file],{encoding:'utf8'}),pages=+info.match(/^Pages:\s+(\d+)/m)[1];
   const printed=[...text.matchAll(/^\s*(?:Problem|Mile)\s+(\d+)\s*$/gm)].map(m=>+m[1]);assert.deepEqual(printed,numbers,'The actual PDF must contain every numbered problem in order');
   if(mode==='full')fullPages=pages;
   else{
    assert.doesNotMatch(text,/Primary:|Worked Solution|Alternative #|WRITTENSOLUTIONMARKER|EXPLANATIONMARKER|ALTERNATIVEMETHODMARKER|ALTERNATIVESOLUTIONMARKER|youtu\.?be|vimeo/i,'No written answer or video content may leak into the problems-only PDF');
    if(sentinels){assert.ok(pages<fullPages,'The worksheet must be shorter than the full document');assert.ok(pages<=Math.ceil(numbers.length/3),'Multiple short fixture problems must fit on each page');}
   }
   if(sentinels&&mode==='full'){assert.match(text,/WRITTENSOLUTIONMARKER/);assert.match(text,/EXPLANATIONMARKER/);if(source.key==='pod'){assert.match(text,/ALTERNATIVEMETHODMARKER/);assert.match(text,/ALTERNATIVESOLUTIONMARKER/);}}
   report.printing.push({source:source.key,suffix,mode,problems:printed.length,pages});
  }
  // The same browser event fires after either completing or canceling printing.
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await page.emulateMedia({media:'screen'});
  assert.equal(await page.evaluate(()=>document.body.classList.contains('running-problems-only')),false,'Restore the normal document after print/cancel');
  assert.equal(await page.locator('#running-content').innerHTML(),original,'Printing must preserve the full document and typeset mathematics');
  assert.equal(await page.locator('.running-written-section').evaluateAll(es=>es.filter(e=>getComputedStyle(e).display!=='none').length),written);
 }
 assert.deepEqual(await page.evaluate(()=>window.__printModes),[false,true]);
 // A canceled Problems Only dialog must also restore the full view, without
 // switching media or relying on print() to block until the dialog closes.
 await problems.click();await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));assert.equal(await page.evaluate(()=>document.body.classList.contains('running-problems-only')),false);
 await full.click();assert.equal(await page.evaluate(()=>window.__printModes.at(-1)),false);await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
}
try{
 browser=await chromium.launch({headless:true});
 for(const source of sources)for(const width of [1280,375,320]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];await localMathJax(context);await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.abort());
  let liveCsv;context.on('response',r=>{if(/text\/csv/i.test(r.headers()['content-type']||''))liveCsv=r.text();});
  const archive=await context.newPage();archive.on('pageerror',e=>errors.push(String(e)));await archive.goto(origin+source.path,{waitUntil:'domcontentloaded'});
  const link=archive.getByRole('link',{name:'View Running Document',exact:true});assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener');
  const popup=context.waitForEvent('page');await link.click();const page=await popup;page.on('pageerror',e=>errors.push(String(e)));await page.waitForLoadState('domcontentloaded');assert.equal(new URL(page.url()).pathname,source.path+'problem-list/');await ready(page);await clean(page);
  assert.ok(liveCsv,'Live browser CSV response was not observed');const entries=source.api.normalizeRows(source.api.parseCsv(await liveCsv)).sort((a,b)=>(a.number??a.mile)-(b.number??b.mile));
  const numbers=await page.locator('.running-entry').evaluateAll(es=>es.map(e=>+e.dataset.number));assert.deepEqual(numbers,entries.map(e=>e.number??e.mile),'The entire currently published collection must be present');assert.ok(numbers.length>=source.min);
  if(source.key==='pod'){assert.equal(await page.locator('#problem-003 .running-written-section').count(),3);assert.ok(await page.locator('#problem-003 .running-explanation mjx-container').count()>0);}
  const publishedSolutions=entries.filter(e=>e.solution||source.key==='mogollon'&&e.explanation).length;assert.equal(await page.locator('.running-entry').evaluateAll(es=>es.filter(e=>e.querySelector('.running-written-section')).length),publishedSolutions);
  await page.screenshot({path:path.join(out,`${source.key}-${width}-screen.png`)});
  await checkPrinting(page,source,numbers,{pdf:width===1280});
  const before=await page.locator('#running-status').textContent();await page.getByRole('button',{name:'Refresh',exact:true}).click();await ready(page);await clean(page);assert.match(await page.locator('#running-status').textContent(),/published/);assert.deepEqual(errors,[],'Archive/document runtime errors');report.live.push({source:source.key,width,count:numbers.length,solutions:publishedSolutions});await context.close();
 }
 // Controlled mutable responses prove growth, publication, blanks, safe text,
 // current-data failure/retry, and fresh reads without editing either sheet.
 for(const source of sources){
  const context=await browser.newContext({viewport:{width:375,height:812},serviceWorkers:'block'});await localMathJax(context);await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.abort());
  // Verify the actual Fetch cache policy. Playwright route interception does
  // not consistently expose Chromium's synthesized cache-control headers.
  await context.addInitScript(()=>{window.__documentFetchOptions=[];const fetch=window.fetch;window.fetch=function(input,options){if(String(input).includes('docs.google.com/spreadsheets/'))window.__documentFetchOptions.push({cache:options?.cache,credentials:options?.credentials});return fetch.call(this,input,options);};});
  const podHead=['Problem Number','Date Published','Location','Topic','Problem (LaTeX)','Worked Solution (LaTeX)','Explanation','Video Link','Alternative 1 Method','Alternative 1 Solution','Alternative 2 Method','Alternative 2 Solution','Solution Video URL','Solution Video Orientation'];
  const mogHead=['Mile','Published','Topic','ProblemLaTeX','SolutionLaTeX','Explanation','VideoURL','VideoLabel','PublishedDate'];
  const rows=[source.key==='pod'?podHead:mogHead];
  for(let n=104;n>=1;n--)if(n!==5)rows.push(source.key==='pod'?[n,'','Location','Exact Topic',String.raw`\frac{x}{2}`,String.raw`\text{WRITTENSOLUTIONMARKER}`,String.raw`EXPLANATIONMARKER Use \(x^2\).`,'https://www.youtube.com/shorts/MQif1qWGxQ0','ALTERNATIVEMETHODMARKER',String.raw`\text{ALTERNATIVESOLUTIONMARKER}`,'','','https://youtu.be/IAn8hB0_lOM','Portrait']:[n,'TRUE','Exact Topic',String.raw`\frac{x}{2}`,String.raw`\text{WRITTENSOLUTIONMARKER}`,String.raw`EXPLANATIONMARKER Use \(x^2\).`,'https://youtu.be/MQif1qWGxQ0','Watch fixture','']);
  if(source.key==='pod')rows.push(['','','','','','',''],['105','','','Unpublished solution','x','','Explanation without a primary solution','https://youtu.be/IAn8hB0_lOM','Alternate','x']);
  else rows.push([5,'FALSE','Not published','x','x'],[105,'TRUE','Incomplete','x','','']);
  let body=csv(rows),fail=false,requests=0;const urls=[];
  await context.route(source.api.sourceUrl.split('?')[0]+'?*',route=>{requests++;urls.push(route.request().url());assert.match(route.request().url(),/_bm_refresh=/);return route.fulfill({status:fail?503:200,contentType:'text/csv',headers:{'access-control-allow-origin':'*'},body});});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='warning')console.log('Document diagnostic:',source.key,m.text());});await page.goto(origin+source.path+'problem-list/',{waitUntil:'domcontentloaded'});await ready(page);await clean(page);
  assert.equal(await page.locator('.running-entry').count(),source.key==='pod'?104:103);assert.equal(await page.locator(source.key==='pod'?'#problem-005':'#mile-005').count(),0);
  if(source.key==='pod')assert.equal(await page.locator('#problem-105 .running-written-section').count(),0,'No invented missing primary solution');
  const first=page.locator('.running-entry').first();assert.equal(await first.locator('img,script').count(),0);
  await checkPrinting(page,source,await page.locator('.running-entry').evaluateAll(es=>es.map(e=>+e.dataset.number)),{pdf:true,sentinels:true,suffix:'growth'});
  // Replace live data and refresh, with no file changes/redeployment.
  body=csv(source.key==='pod'?[podHead,['106','','','<img src=x onerror=alert(1)>','x','x','<script>bad</script>','javascript:alert(1)']]:[mogHead,['106','TRUE','<img src=x onerror=alert(1)>','x','x','<script>bad</script>','','','']]);
  await page.locator('#running-refresh').click();await ready(page);assert.deepEqual(await page.locator('.running-entry').evaluateAll(es=>es.map(e=>+e.dataset.number)),[106]);assert.equal(await page.locator('.running-entry img,.running-entry script').count(),0);await clean(page);
  const before=requests;fail=true;await page.locator('#running-refresh').click();await page.waitForSelector('#running-error:not([hidden])');assert.equal(requests,before+2);assert.equal(await page.locator('.running-entry').count(),0);assert.equal(await page.locator('#running-print').isDisabled(),true);assert.equal(await page.locator('#running-print-problems').isDisabled(),true);assert.equal(await page.locator('#running-math-warning').isHidden(),true,'Data failures must remain distinct from formatting failures');
  fail=false;await page.locator('#running-retry').click();await ready(page);assert.equal(await page.locator('#running-error').isHidden(),true);assert.equal(await page.locator('#running-print').isEnabled(),true);assert.equal(await page.locator('#running-print-problems').isEnabled(),true);assert.equal(new Set(urls).size,urls.length,'Refresh must use unique cache-busting URLs');assert.deepEqual(await page.evaluate(()=>window.__documentFetchOptions),Array.from({length:requests},()=>({cache:'no-store',credentials:'omit'})),'Every live request must explicitly bypass caches');assert.deepEqual(errors,[]);
  report.fixtures.push({source:source.key,growth:source.key==='pod'?104:103,refresh:true,errorRetry:true,requests});await context.close();
  // Missing CDN, rejected startup, failed typesetting, and explicit math errors
  // must retain every current written entry and never impersonate a CSV error.
  for(const failure of ['missing','startup','typeset','math-error']){
   const context=await browser.newContext({viewport:{width:375,height:812},serviceWorkers:'block'});await localMathJax(context);let recover=false;
   await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.abort());
   const fixture=csv([rows[0],...rows.slice(1,4)]);await context.route(source.api.sourceUrl.split('?')[0]+'?*',r=>r.fulfill({status:200,contentType:'text/csv',headers:{'access-control-allow-origin':'*'},body:fixture}));
   await context.route('https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js',r=>{
    if(recover)return r.fallback();if(failure==='missing')return r.abort('failed');
    const script=failure==='startup'?`const p=Promise.reject(Error('Controlled startup failure'));p.catch(()=>{});window.MathJax={startup:{promise:p}};`:failure==='typeset'?`window.MathJax={startup:{promise:Promise.resolve()},typesetPromise:async()=>{throw Error('Controlled formatter failure');}};`:`window.MathJax={startup:{promise:Promise.resolve()},typesetPromise:async nodes=>{nodes[0].append(document.createElement('mjx-merror'));}};`;
    return r.fulfill({status:200,contentType:'text/javascript',body:script});
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(origin+source.path+'problem-list/',{waitUntil:'domcontentloaded'});await ready(page,{formatted:false});
   assert.equal(await page.locator('.running-entry').count(),3);assert.equal(await page.locator('.running-written-section').count(),source.key==='pod'?6:3,'All written solutions/alternatives survive formatting failure');
   assert.equal(await page.locator('#running-math-warning').isVisible(),true);assert.match(await page.locator('#running-status').textContent(),/3 published/);assert.doesNotMatch(await page.locator('#running-status').textContent(),/No current|could not|spreadsheet failed/);assert.equal(await page.locator('#running-print').isDisabled(),true);assert.equal(await page.locator('#running-print-problems').isDisabled(),true);assert.equal(await page.locator('#running-error').isHidden(),true);assert.equal(await page.locator('iframe,video,a[href*="youtu"]').count(),0);
   recover=true;const navigation=page.waitForEvent('domcontentloaded');await page.locator('#running-math-retry').click();await navigation;await ready(page);await clean(page);assert.equal(await page.locator('.running-entry').count(),3);assert.equal(await page.locator('#running-print').isEnabled(),true);assert.equal(await page.locator('#running-print-problems').isEnabled(),true);assert.deepEqual(errors,[]);
   report.fixtures.push({source:source.key,formattingFailure:failure,dataPreserved:true,recovery:true});await context.close();
  }
 }
 report.ok=true;console.log('PASS live running documents, written solutions/alternatives, desktop/mobile, new tabs, full/problems-only PDF output and condensation, publication/gaps, growth, safety, refresh, and failure/retry');
}catch(error){report.failures.push({error:String(error),stack:error.stack});const page=browser?.contexts().at(-1)?.pages().at(-1);if(page){report.failureUrl=page.url();await page.screenshot({path:path.join(out,'failure-final.png'),fullPage:true}).catch(()=>{});}throw error;}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
