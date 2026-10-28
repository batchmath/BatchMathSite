import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import vm from 'node:vm';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {chromium} from 'playwright';import {localMathJax} from './mathjax-browser-qa.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'qa-results/newton-sums-browser');fs.mkdirSync(out,{recursive:true});
const baseline='561ca3e1a20ded8a0443bed73d07b3a00d1ccf70',slug='evaluating-definite-integrals-with-a-limit-and-summation',route='/ap-calculus/unit-4-integrals/topics/'+slug+'/practice/';
const sb={window:{},console};vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(root,'assets/ap-topic-generators.js'),'utf8'),sb);let value=7281;const random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/2**32;};sb.window.BatchMathRNG={random};
const samples=new Map();for(let i=0;i<4000;i++){const p=sb.window.BatchMathAPTopicGenerators.get(slug)(),d=p.unit4Meta;const key=d.coefficients?p.variant:d.subtype;samples.set(key,samples.get(key)||JSON.parse(JSON.stringify(p)));}
let queue=[.1,.25,.75,.5,.75];sb.window.BatchMathRNG.random=()=>queue.length?queue.shift():.5;const example=JSON.parse(JSON.stringify(sb.window.BatchMathAPTopicGenerators.get(slug)()));assert.deepEqual(example.unit4Meta.coefficients,[0,4]);assert.equal(example.unit4Meta.a,-3);assert.equal(example.unit4Meta.b,3);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{try{let f=path.join(root,new URL(req.url,'http://localhost').pathname);if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
let browser,active;const report={ok:false,checks:[],unchangedAppearance:[],screenshots:[],errors:[]};
async function ready(page){await page.evaluate(()=>MathJax.typesetPromise([document.querySelector('main')]));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function open(context,url){const page=await context.newPage();active=page;page.on('pageerror',e=>report.errors.push(e.message));await page.goto(origin+url+'?bm_seed=1040477&bm_qa=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.BatchMathRepro?.problemCount===1);await ready(page);return page;}
async function paste(page,editor,text){await editor.focus();await editor.evaluate((el,text)=>{const data=new DataTransfer();data.setData('text/plain',text);el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},text);}
async function inject(page,p){await page.evaluate(p=>{window.__NewtonForced=p;document.querySelector('#next').hidden=false;},p);await page.locator('#next').click();await page.evaluate(()=>window.__NewtonForced=null);await ready(page);}
async function install(page){await page.evaluate(()=>{const get=BatchMathAPTopicGenerators.get;BatchMathAPTopicGenerators.get=slug=>{const fn=get(slug);return opts=>window.__NewtonForced?JSON.parse(JSON.stringify(window.__NewtonForced)):fn(opts);};});}
async function noVerticalBars(page,label){
 await ready(page);const result=await page.evaluate(()=>{
  const containers=[document.querySelector('#question'),...document.querySelectorAll('.u4-newton-question .u4-formula,.u4-newton-equation,.unit4-newton-answer .staged-feedback,.unit4-newton-answer .correct-answer')].filter(Boolean);
  return{mathErrors:document.querySelectorAll('mjx-merror,[data-mjx-error]').length,overflow:document.documentElement.scrollWidth>innerWidth+3,verticalBars:containers.filter(e=>['scroll','auto'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1).map(e=>e.className),clipped:containers.flatMap(e=>[...e.querySelectorAll(':scope > mjx-container')].filter(m=>{const a=e.getBoundingClientRect(),b=m.getBoundingClientRect();return b.top<a.top-2||b.bottom>a.bottom+2;}).map(()=>e.className))};
 });assert.deepEqual(result,{mathErrors:0,overflow:false,verticalBars:[],clipped:[]},label);
}
async function submit(page,host,answer){const input=host.locator('.bm-calc-editor');await ready(page);await paste(page,input,answer);const count=await page.evaluate(()=>BatchMathRepro.problemCount);await page.keyboard.press('Enter');await host.locator('.staged-feedback').waitFor();assert.equal(await host.locator('.result.good').count(),1,'Correct representation accepted');assert.equal(await page.evaluate(()=>BatchMathRepro.problemCount),count);await ready(page);}
async function key(page,label){await page.getByRole('button',{name:label,exact:true}).click();}
try{
 browser=await chromium.launch({headless:true});
 for(const width of [1280,1024,390]){
  const context=await browser.newContext({viewport:{width,height:width===1024?768:900},serviceWorkers:'block'});await localMathJax(context);await context.route(/https:\/\/(?:www\.googletagmanager\.com|www\.google-analytics\.com)\//,r=>r.abort());
  const page=await open(context,route);await install(page);await inject(page,example);
  // Construct the PDF's exact example with actual math keys and physical typing.
  await key(page,'Insert limit as n approaches infinity');await key(page,'Set limit to n approaches infinity');await key(page,'Insert summation from k equals 1 to n');await key(page,'Set lower summation index k equals 1');await key(page,'Set upper summation bound n');
  assert.equal(await page.locator('.bm-calc-newton-structure.limit').count(),1);assert.equal(await page.locator('.bm-calc-newton-structure.sum').count(),1);
  await page.keyboard.type('4*(-3+6*k');await page.keyboard.press('/');await page.keyboard.type('n');await key(page,'Move cursor right');await page.keyboard.type(')*6');await page.keyboard.press('/');await page.keyboard.type('n');
  const raw=await page.evaluate(()=>BatchMathCalculusKeypad.raw);
  assert.equal(await page.evaluate(({raw,a})=>BatchMathUnit4Answers.check(raw,a).ok,{raw,a:example.stage1.unit4Answer}),true,'Actual buttons build the full correct limit/sum');
  assert.ok(await page.locator('.bm-calc-frac').count()>=2);const before=raw;await page.keyboard.press('Control+z');assert.notEqual(await page.evaluate(()=>BatchMathCalculusKeypad.raw),before);await page.keyboard.press('Control+y');assert.equal(await page.evaluate(()=>BatchMathCalculusKeypad.raw),before,'Undo/redo retained');
  const name=`${width}-structured-limit.png`;await page.locator('main').screenshot({path:path.join(out,name)});report.screenshots.push(name);
  await page.keyboard.press('Enter');await page.locator('.staged-part-one .result.good').waitFor();await page.locator('.staged-continue').click();await submit(page,page.locator('.staged-part-two'),'0');
  assert.equal(await page.locator('.staged-part-one .staged-part-prompt').count(),0,'No repeated Part 1 instruction');assert.doesNotMatch(await page.locator('main').textContent(),/Construct the right-endpoint summand/);
  const finite=await page.locator('[data-newton-step="finite"]').textContent();assert.ok(finite);assert.equal(await page.locator('[data-newton-step="identity-2"]').count(),0,'Linear example omits square identity');assert.equal(await page.locator('[data-newton-step="limit"]').count(),1);assert.equal(await page.locator('[data-newton-step="substitution"]').count(),1);await noVerticalBars(page,'Reference example '+width);
  const solution=`${width}-worked-limit.png`;await page.locator('main').screenshot({path:path.join(out,solution)});report.screenshots.push(solution);
  const count=await page.evaluate(()=>BatchMathRepro.problemCount);await page.keyboard.down('Enter');await page.waitForTimeout(400);await page.keyboard.up('Enter');assert.equal(await page.evaluate(()=>BatchMathRepro.problemCount),count+1,'Held Enter advances exactly once');
  for(const [family,p]of samples){
   await inject(page,p);const pad=page.locator('.bm-calc-mode-unit4-newton');for(const aria of ['Insert limit as n approaches infinity','Insert summation from k equals 1 to n','Insert stacked fraction','Insert exponent','Insert infinity'])assert.equal(await pad.getByRole('button',{name:aria,exact:true}).count(),1);assert.equal(await pad.getByRole('button',{name:/Insert (?:π|sec|x)$/}).count(),0,'Omit unrelated symbols');
   await submit(page,page.locator('.staged-part-one'),p.stage1.fullExpression);
   if(p.stage2){await page.locator('.staged-continue').click();assert.equal(await page.locator('.bm-calc-mode-unit4-newton-value').count(),1);assert.equal(await page.locator('.staged-part-two').getByRole('button',{name:/^Insert (?:ln|sin|e|infinity)$/}).count(),0,'Evaluation keypad contains numerical tools');const answer=await page.evaluate(a=>BatchMathUnit4Answers.expression(a.value),p.stage2.unit4Answer);await submit(page,page.locator('.staged-part-two'),answer);}
   await noVerticalBars(page,`${width}/${family}`);report.checks.push({width,family,parts:p.stage2?2:1});
  }
  await context.close();
 }
 // Exact before/after screenshots and editor DOM for other approved profiles.
 const unchanged=[['rectangular-approximations','(5)/(2)'],['trapezoidal-approximations','(5)/(2)'],['introduction-to-sigma-notation','(n*(n+1))/(2)'],['fundamental-theorem-of-calculus-and-integral-rules','2*x*sin(x)'],['integrals-using-geometry','(3*pi)/(2)']];
 const originals={};for(const f of ['calculus-keypad.js','calculus-keypad.css','ap-topic-practice.js','ap-topic-practice.css','unit4-exact-answers.js'])originals[f]=execFileSync('git',['show',baseline+':assets/'+f],{cwd:root,encoding:'utf8',maxBuffer:1000000});
 for(const width of [1280,390])for(const [other,raw]of unchanged){const shots=[],doms=[];
  for(const old of [true,false]){const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});await localMathJax(context);
   if(old)await context.route('**/assets/*',async r=>{const filename=new URL(r.request().url()).pathname.split('/').at(-1);if(originals[filename])await r.fulfill({status:200,contentType:filename.endsWith('.css')?'text/css':'text/javascript',body:originals[filename]});else await r.continue();});
   const page=await open(context,'/ap-calculus/unit-4-integrals/topics/'+other+'/practice/');await page.addStyleTag({content:'.bm-calc-caret{visibility:hidden!important;animation:none!important}'});await page.evaluate(raw=>BatchMathCalculusKeypad.setRaw(raw),raw);await ready(page);
   doms.push(await page.locator('#choices').innerHTML());const bytes=await page.locator('.practice-shell').screenshot();shots.push(crypto.createHash('sha256').update(bytes).digest('hex'));await context.close();
  }
  assert.equal(doms[0],doms[1],'Other editor markup changed: '+other);assert.equal(shots[0],shots[1],'Other engine appearance changed: '+other);report.unchangedAppearance.push({width,engine:other,identical:true});
 }
 // Every other existing keypad profile retains identical markup, controls and computed geometry.
 const modes=[...new Set([...originals['calculus-keypad.js'].matchAll(/"([a-z0-9-]+)":\{/g)].map(m=>m[1]).filter(x=>x!=='unit4-newton').concat(['derivative','integral','limits','unit3']))];
 report.unchangedKeypadProfiles=[];
 for(const width of [1280,390]){const snapshots=[];
  for(const old of [true,false]){const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();active=page;await page.setContent('<!doctype html><html><head></head><body></body></html>');await page.addStyleTag({content:old?originals['calculus-keypad.css']:fs.readFileSync(path.join(root,'assets/calculus-keypad.css'),'utf8')});await page.addScriptTag({content:old?originals['calculus-keypad.js']:fs.readFileSync(path.join(root,'assets/calculus-keypad.js'),'utf8')});
   snapshots.push(await page.evaluate(modes=>modes.map(mode=>{const host=document.createElement('section'),input=document.createElement('input');host.append(input);document.body.append(host);BatchMathCalculusKeypad.mountInputs([input],host,{mode,onCheck(){}});BatchMathCalculusKeypad.setRaw('(1)/(2)+x^(2)+sin(x)');const editor=host.querySelector('.bm-calc-editor');return{mode,html:host.innerHTML,metrics:[...host.querySelectorAll('.bm-calc-key')].map(e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();return[e.textContent,c.color,c.backgroundColor,c.fontSize,c.gridRow,c.gridColumn,r.width,r.height];}),height:editor.getBoundingClientRect().height};}),modes));await context.close();
  }
  assert.deepEqual(snapshots[1],snapshots[0],'Unrelated keypad profile changed at '+width);report.unchangedKeypadProfiles.push({width,count:modes.length,identical:true});
 }
 assert.deepEqual(report.errors,[]);report.ok=true;
}catch(e){report.errors.push(e.stack);console.error(e.stack);process.exitCode=1;if(active&&!active.isClosed())await active.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});}
finally{await browser?.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('Newton sums browser revision QA:',report.ok?'PASS':'FAIL',JSON.stringify({cases:report.checks.length,unchangedAppearance:report.unchangedAppearance.length}));}
