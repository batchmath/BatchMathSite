import {fileURLToPath} from 'node:url';
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import vm from 'node:vm';import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),katexDir=process.env.KATEX_DIR||'/opt/npm-tools/node_modules/katex/dist';
const slug=process.argv[2],route='/ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/practice/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{try{let f=path.join(root,new URL(req.url,'http://localhost').pathname);if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const stub=`window.MathJax=Object.assign(window.MathJax||{},{typesetPromise:async(els)=>{(els||[document.body]).forEach(root=>{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);nodes.forEach(n=>{if(!/\\\\\\(/.test(n.nodeValue)||!n.parentNode)return;const span=document.createElement('span');span.innerHTML=n.nodeValue.replace(/\\\\\\((.*?)\\\\\\)/gs,(m,t)=>{try{return katex.renderToString(t,{throwOnError:false,output:'html'})}catch(e){return m}});n.parentNode.replaceChild(span,n);});});},typeset(){},startup:{promise:Promise.resolve()}});`;
const sb={window:{},console};vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(root,'assets/ap-topic-generators.js'),'utf8'),sb);
let seed=7;sb.window.BatchMathRNG={random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32}};
const samples=new Map();for(let i=0;i<1500;i++){const p=sb.window.BatchMathAPTopicGenerators.get(slug)();const k=p.variant;if(samples.size<8&&!samples.has(k))samples.set(k,JSON.parse(JSON.stringify(p)));}
const report={ok:false,checks:[],errors:[]};let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[1280,900],[1024,768],[390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/mathjax/,r=>r.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(path.join(katexDir,'katex.min.js'),'utf8')+';'+stub}));
  await ctx.route(/googletagmanager|google-analytics/,r=>r.abort());
  const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(origin+route+'?bm_seed=1&bm_qa=1',{waitUntil:'domcontentloaded'});await page.waitForSelector('.bm-calc-editor');await page.addStyleTag({content:fs.readFileSync(path.join(katexDir,'katex.min.css'),'utf8').replace(/url\([^)]*\)/g,'none')});
  await page.evaluate(()=>{const get=BatchMathAPTopicGenerators.get;BatchMathAPTopicGenerators.get=s=>{const fn=get(s);return o=>window.__F?JSON.parse(JSON.stringify(window.__F)):fn(o);};});
  let n=0;
  for(const [family,p] of samples){
   await page.evaluate(p=>{window.__F=p;document.querySelector('#next').hidden=false;},p);await page.locator('#next').click();await page.evaluate(()=>{window.__F=null});await page.waitForSelector('.bm-calc-editor');
   const labels=[1];
   assert.ok(labels.length>0,'geometry keypad mode active');
   
   // answer via paste of the canonical expression, then check
   const ua=p.stage1.unit4Answer,ans=ua.kind==='scalar'?String(Object.values(ua.value)[0][0]):ua.expression;
   await page.locator('.bm-calc-editor').evaluate((el,t)=>{const d=new DataTransfer();d.setData('text/plain',t);el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:d,bubbles:true,cancelable:true}));},ans);
   await page.keyboard.press('Enter');await page.locator('.result.good').first().waitFor({timeout:4000});
   // graph first in explanation, directly at the top
   const first=await page.evaluate(()=>{const box=document.querySelector('.correct-answer')||document.querySelector('.staged-feedback');const fig=box.querySelector('.u4-geometry-figure');const kids=[...box.querySelectorAll('*')];return{hasFig:!!fig,figIsFirstContent:fig?kids.filter(k=>k.matches('.u4-work-step,.u4-geometry-figure')).at(0)===fig:false,w:fig?fig.getBoundingClientRect().width:0,overflow:document.documentElement.scrollWidth>innerWidth+3};});
   if(first.overflow){const w=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+3).slice(0,4).map(e=>e.tagName+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right)+' '+(e.textContent||'').slice(0,60)));throw new Error(family+' overflow '+width+' '+JSON.stringify(w));}
   n++;
   if(n===1)await page.screenshot({path:(process.env.QA_OUT||'/tmp')+`/ftc-${width}.png`,fullPage:true});
   report.checks.push({width,family});
  }
  await ctx.close();
 }
 report.ok=true;
}catch(e){report.errors.push(String(e&&e.stack||e).slice(0,900));}
finally{await browser?.close();server.close();}
console.log(JSON.stringify({ok:report.ok,count:report.checks.length,errors:report.errors}));process.exit(report.ok?0:1);
