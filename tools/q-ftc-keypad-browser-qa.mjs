// v12.8.T: FTC page with the PDF problem, real keypad entry, equivalent answers, rendering at 3 widths.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import vm from 'node:vm';import {fileURLToPath} from 'node:url';import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),katexDir=process.env.KATEX_DIR||'/opt/npm-tools/node_modules/katex/dist',out=process.env.QA_OUT||'/tmp';
const route='/ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/practice/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{try{let f=path.join(root,new URL(req.url,'http://localhost').pathname);if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const stub=`window.MathJax=Object.assign(window.MathJax||{},{typesetPromise:async(els)=>{(els||[document.body]).forEach(root=>{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);nodes.forEach(n=>{if(!/\\\\\\(/.test(n.nodeValue)||!n.parentNode)return;const span=document.createElement('span');span.innerHTML=n.nodeValue.replace(/\\\\\\((.*?)\\\\\\)/gs,(m,t)=>{try{return katex.renderToString(t,{throwOnError:false,output:'html'})}catch(e){return m}});n.parentNode.replaceChild(span,n);});});},typeset(){},startup:{promise:Promise.resolve()}});`;
const sb={window:{},console};vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(root,'assets/ap-topic-generators.js'),'utf8'),sb);
let seed=1;sb.window.BatchMathRNG={random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;}};
const G=sb.window.BatchMathAPTopicGenerators.get('fundamental-theorem-of-calculus');let pdf=null;
for(let n=0;n<600000&&!pdf;n++){const p=G(),d=p.unit4Meta;if(d.integrandType==='power_exponential'&&d.k===2&&d.upper.type==='tan'&&d.upper.k===1&&d.lower.type==='power'&&d.lower.k===3&&d.lower.d===2)pdf=JSON.parse(JSON.stringify(p));}
assert.ok(pdf,'PDF problem generated');
const report={ok:false,checks:[],errors:[]};let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[1280,900],[1024,768],[390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/mathjax/,r=>r.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(path.join(katexDir,'katex.min.js'),'utf8')+';'+stub}));
  await ctx.route(/googletagmanager|google-analytics/,r=>r.abort());
  const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(origin+route+'?bm_seed=1&bm_qa=1',{waitUntil:'domcontentloaded'});await page.waitForSelector('.bm-calc-editor');
  await page.addStyleTag({content:fs.readFileSync(path.join(katexDir,'katex.min.css'),'utf8').replace(/url\([^)]*\)/g,'none')});
  await page.evaluate(()=>{const get=BatchMathAPTopicGenerators.get;BatchMathAPTopicGenerators.get=s=>{const fn=get(s);return o=>window.__F?JSON.parse(JSON.stringify(window.__F)):fn(o);};});
  const load=async()=>{await page.evaluate(p=>{window.__F=p;document.querySelector('#next').hidden=false;},pdf);await page.locator('#next').click();await page.evaluate(()=>{window.__F=null;});await page.waitForSelector('.bm-calc-editor');};
  const raw=()=>page.evaluate(()=>BatchMathCalculusKeypad.raw);
  const clear=async()=>{await page.evaluate(()=>BatchMathCalculusKeypad.setRaw(''));};
  const submit=async()=>{await page.keyboard.press('Enter');await page.locator('.staged-feedback .result, .result').first().waitFor({timeout:4000});};
  const verdict=async()=>page.evaluate(()=>document.querySelector('.result.good')?'good':document.querySelector('.result')?'bad':'none');
  // --- 1. real key presses: sec^2 x tan^2 x (2+e^(tan x)) - 54 x^5 (2+e^(3x^2))
  await load();
  const pad=page.locator('.bm-calc-mode-unit4-ftc');assert.ok(await pad.count()===1,'FTC keypad present');
  const labels=await pad.locator('button').evaluateAll(b=>b.map(x=>x.getAttribute('aria-label')||x.textContent));
  const click=async name=>{await pad.getByRole('button',{name,exact:true}).first().click();};
  const arrow=async()=>{await pad.getByRole('button',{name:'Move cursor right'}).click();};
  await click('Insert sec');await page.keyboard.type('x');await arrow();await click('Insert exponent');await page.keyboard.type('2');await arrow();
  await click('Insert tan');await page.keyboard.type('x');await arrow();await click('Insert exponent');await page.keyboard.type('2');await arrow();
  await page.keyboard.type('(2+');await click('e');await click('Insert exponent');await click('Insert tan');await page.keyboard.type('x');await arrow();await arrow();await page.keyboard.type(')-54x');await click('Insert exponent');await page.keyboard.type('5');await arrow();
  await page.keyboard.type('(2+');await click('e');await click('Insert exponent');await page.keyboard.type('3x');await click('Insert exponent');await page.keyboard.type('2');await arrow();await arrow();await page.keyboard.type(')');
  const typed=await raw();
  const ok=await page.evaluate(({raw,a})=>BatchMathUnit4DefiniteAnswers.check(raw,a),{raw:typed,a:pdf.stage1.unit4Answer});
  assert.ok(ok.valid&&ok.ok,'keypad-built simplified answer accepted by checker: '+typed+' '+JSON.stringify(ok));
  await page.screenshot({path:path.join(out,`ftc-${width}-entry.png`),fullPage:false});
  await submit();assert.equal(await verdict(),'good','page marks keypad answer correct');
  await page.screenshot({path:path.join(out,`ftc-${width}-correct.png`),fullPage:true});
  // layout checks in the feedback
  const layout=await page.evaluate(()=>({overflowX:document.documentElement.scrollWidth>innerWidth+3,errors:document.querySelectorAll('.katex-error,mjx-merror').length,sec:document.body.textContent.includes('sec(x)2')}));
  assert.equal(layout.overflowX,false,'no horizontal overflow');assert.equal(layout.errors,0,'no math errors');
  // --- 2. equivalent forms by paste
  const paste=async t=>{await clear();await page.locator('.bm-calc-editor').focus();await page.locator('.bm-calc-editor').evaluate((el,text)=>{const d=new DataTransfer();d.setData('text/plain',text);el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:d,bubbles:true,cancelable:true}));},t);};
  for(const [t,want] of [['tan(x)^2*(2+e^(tan(x)))*sec(x)^2-6x*(3x^2)^2*(2+e^(3x^2))','good'],['sec(x)^2*tan(x)^2*(2+e^(tan(x)))-108x^5-54x^5*e^(3x^2)','good'],['sec(x)^2*tan(x)^2*(2+e^(tan(x)))+54x^5*(2+e^(3x^2))','bad'],['tan(x)^2*(2+e^(tan(x)))-54x^5*(2+e^(3x^2))','bad']]){
   await load();await paste(t);await submit();assert.equal(await verdict(),want,`${t} -> ${want}`);}
  // --- 3. the worked explanation shows the full simplification and standard notation
  await load();await paste('x');await submit();
  const body=await page.locator('main').innerText();
  assert.ok(!/tan\(x\)2|sec\(x\)2|\^2/.test(body),'no literal exponent text');
  const html=await page.locator('.correct-answer, .staged-feedback').first().innerHTML();
  assert.ok(html.includes('54')&&html.includes('9'),'explanation reaches 54x^5 through 9x^4');
  await page.screenshot({path:path.join(out,`ftc-${width}-worked.png`),fullPage:true});
  report.checks.push({width,typed});
  await ctx.close();
 }
 report.ok=true;
}catch(e){report.errors.push(String(e&&e.stack||e).slice(0,1200));}
finally{await browser?.close();server.close();}
console.log(JSON.stringify(report,null,1));process.exit(report.ok&&!report.errors.length?0:1);
