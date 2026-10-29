// v12.8.Q focused browser test: real clicks on the integrated lim/sum template keys.
// MathJax is replaced by a KaTeX stub when the CDN is unreachable (visual fidelity differs; DOM/keypad logic is real).
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {chromium} from 'playwright';import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const katexDir=process.env.KATEX_DIR||'/opt/npm-tools/node_modules/katex/dist';
const slug='evaluating-definite-integrals-with-a-limit-and-summation',route='/ap-calculus/unit-4-integrals/topics/'+slug+'/practice/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{try{let f=path.join(root,new URL(req.url,'http://localhost').pathname);if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const stub=`window.MathJax=Object.assign(window.MathJax||{},{typesetPromise:async(els)=>{(els||[document.body]).forEach(root=>{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);nodes.forEach(n=>{if(!/\\\\\\(/.test(n.nodeValue)||!n.parentNode)return;const span=document.createElement('span');span.innerHTML=n.nodeValue.replace(/\\\\\\((.*?)\\\\\\)/gs,(m,t)=>{try{return katex.renderToString(t,{throwOnError:false})}catch(e){return m}});n.parentNode.replaceChild(span,n);});});},typeset(){},startup:{promise:Promise.resolve()}});`;
const sb={window:{},console};vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(root,'assets/ap-topic-generators.js'),'utf8'),sb);
let seed=99;sb.window.BatchMathRNG={random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32}};
const samples=new Map();for(let i=0;i<3000;i++){const p=sb.window.BatchMathAPTopicGenerators.get(slug)();const k=p.variant;if(!samples.has(k))samples.set(k,JSON.parse(JSON.stringify(p)));}
const report={ok:false,checks:[],errors:[]};let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[1280,900],[1024,768],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
  await context.route(/cdn\.jsdelivr\.net\/npm\/mathjax/,r=>r.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(path.join(katexDir,'katex.min.js'),'utf8')+';'+stub}));
  await context.route(/googletagmanager|google-analytics/,r=>r.abort());
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(origin+route+'?bm_seed=1040477&bm_qa=1',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.bm-calc-editor');
  const pad=page.locator('.bm-calc-mode-unit4-newton');
  // Keypad content for Part 1
  const labels=await pad.locator('button').evaluateAll(b=>b.map(x=>x.getAttribute('aria-label')||x.textContent));
  for(const bad of ['Set limit to n approaches infinity','Set lower summation index k equals 1','Set upper summation bound n','Insert infinity'])assert.ok(!labels.includes(bad),'Removed key present: '+bad);
  assert.equal(await pad.locator('.bm-newton-key').count(),2,'two template keys');
  // Template keys: click lim, then sum; both structures must exist and be nested.
  await pad.getByRole('button',{name:'Insert limit as n approaches infinity template'}).click();
  await pad.getByRole('button',{name:'Insert summation from k equals 1 to n template'}).click();
  assert.equal(await page.locator('.bm-calc-newton-structure.limit').count(),1);
  assert.equal(await page.locator('.bm-calc-newton-structure.sum').count(),1);
  const empty=await page.evaluate(()=>BatchMathCalculusKeypad.raw);assert.equal(empty,'lim(n->infinity,sum(k=1,n,))','templates prefilled');
  await page.evaluate(()=>{const get=BatchMathAPTopicGenerators.get;BatchMathAPTopicGenerators.get=s=>{const fn=get(s);return o=>window.__F?JSON.parse(JSON.stringify(window.__F)):fn(o);};});
  async function inject(p){await page.evaluate(p=>{window.__F=p;document.querySelector('#next').hidden=false;},p);await page.locator('#next').click();await page.evaluate(()=>{window.__F=null});await page.waitForSelector('.bm-calc-editor');}
  for(const [family,p] of samples){
   await inject(p);
   const pd=page.locator('.bm-calc-mode-unit4-newton');
   await pd.getByRole('button',{name:'Insert limit as n approaches infinity template'}).click();
   await pd.getByRole('button',{name:'Insert summation from k equals 1 to n template'}).click();
   const body=p.stage1.unit4Answer.expression;
   await page.locator('.bm-calc-editor').evaluate((el,text)=>{const d=new DataTransfer();d.setData('text/plain',text);el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:d,bubbles:true,cancelable:true}));},body);
   const raw1=await page.evaluate(()=>BatchMathCalculusKeypad.raw);
   assert.ok(await page.evaluate(({raw,a})=>BatchMathUnit4Answers.check(raw,a).ok,{raw:raw1,a:p.stage1.unit4Answer}),family+' Part 1 typed via templates should be accepted: '+raw1);
   // undo / redo, then arrows and backspace sanity
   await page.keyboard.press('Control+z');const u=await page.evaluate(()=>BatchMathCalculusKeypad.raw);assert.notEqual(u,raw1,'undo');
   await page.keyboard.press('Control+y');assert.equal(await page.evaluate(()=>BatchMathCalculusKeypad.raw),raw1,'redo');
   await page.keyboard.press('Enter');
   if(p.stage2){
    await page.locator('.staged-part-one .result.good').waitFor();await page.locator('.staged-continue').click();
    const p2=page.locator('.bm-calc-mode-unit4-newton-value');assert.equal(await p2.count(),1,'Part 2 keypad');
    const l2=await p2.locator('button').evaluateAll(b=>b.map(x=>x.getAttribute('aria-label')||x.textContent));
    for(const bad of ['Insert exponent','Insert limit as n approaches infinity template','Insert infinity'])assert.ok(!l2.includes(bad),'Part 2 should not have '+bad);
    const [num,den]=Object.values(p.stage2.unit4Answer.value)[0];
    // real clicks: minus key, digit keys, fraction key
    const click=async t=>{await p2.getByRole('button',{name:t,exact:true}).first().click();};
    if(num<0)await click('−');
    if(den!==1){await p2.locator('button[aria-label*="fraction" i]').first().click();for(const ch of String(Math.abs(num)))await click(ch);await click('Move cursor right');for(const ch of String(den))await click(ch);}
    else for(const ch of String(Math.abs(num)))await click(ch);
    const raw2=await page.evaluate(()=>BatchMathCalculusKeypad.raw);
    await page.keyboard.press('Enter');
    await page.locator('.staged-part-two .result.good').waitFor({timeout:4000}).catch(()=>{throw new Error(family+' Part 2 not accepted, raw='+raw2)});
   }else{await page.locator('.result.good').first().waitFor();}
   report.checks.push({width,family,parts:p.stage2?2:1});
  }
  // Reference example typed with real keystrokes after clicking the templates (linear 4x on [-3,3]).
  {const q=[.1,.25,.75,.5,.75];const sb2={window:{},console};vm.createContext(sb2);vm.runInContext(fs.readFileSync(path.join(root,'assets/ap-topic-generators.js'),'utf8'),sb2);sb2.window.BatchMathRNG={random:()=>q.length?q.shift():.5};
   const ex=JSON.parse(JSON.stringify(sb2.window.BatchMathAPTopicGenerators.get(slug)()));assert.deepEqual(ex.unit4Meta.coefficients,[0,4]);
   await inject(ex);const pd=page.locator('.bm-calc-mode-unit4-newton');
   await pd.getByRole('button',{name:'Insert limit as n approaches infinity template'}).click();
   await pd.getByRole('button',{name:'Insert summation from k equals 1 to n template'}).click();
   await page.keyboard.type('4*(-3+6*k');await page.keyboard.press('/');await page.keyboard.type('n');await pd.getByRole('button',{name:'Move cursor right'}).click();await page.keyboard.type(')*6');await page.keyboard.press('/');await page.keyboard.type('n');
   const raw=await page.evaluate(()=>BatchMathCalculusKeypad.raw);
   assert.ok(await page.evaluate(({raw,a})=>BatchMathUnit4Answers.check(raw,a).ok,{raw,a:ex.stage1.unit4Answer}),'Hand-typed reference accepted: '+raw);
   assert.ok(await page.locator('.bm-calc-frac').count()>=2,'stacked fractions rendered');
   // backspace removes last typed char; Delete/arrow keys do not throw
   await page.keyboard.press('Backspace');assert.notEqual(await page.evaluate(()=>BatchMathCalculusKeypad.raw),raw);await page.keyboard.type('n');
   await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowRight');
   await page.keyboard.press('Enter');await page.locator('.staged-part-one .result.good').waitFor();report.checks.push({width,reference:'typed+accepted'});
   await page.screenshot({path:(process.env.QA_OUT||'/tmp')+'/shot-'+width+'-part1.png',fullPage:true});
  }
  await context.close();
 }
 report.ok=true;
}catch(e){report.errors.push(String(e&&e.stack||e));}
finally{await browser?.close();server.close();}
console.log(JSON.stringify(report,null,1));process.exit(report.ok&&!report.errors.length?0:1);
