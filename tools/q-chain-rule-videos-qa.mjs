// v12.8.T: Chain Rule homework walkthroughs and button labels.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
// ---- static: every hw-video button on the whole site uses the one label ----
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.name==='node_modules'?[]:e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.html')?[path.join(d,e.name)]:[]);
let buttons=0;const odd=[];
for(const f of walk(root)){const s=fs.readFileSync(f,'utf8');for(const m of s.matchAll(/<button[^>]*hw-video-button[^>]*>([^<]*)<\/button>/g)){buttons++;if(m[1].trim()!=='HW Walkthrough Video'||/data-walkthrough-label/.test(m[0]))odd.push(path.relative(root,f)+': '+m[0].slice(0,120));}}
assert.deepEqual(odd,[],'all hw-video buttons use exactly "HW Walkthrough Video"');
const page0=fs.readFileSync(path.join(root,'ap-calculus/unit-2-derivatives/topics/the-chain-rule/index.html'),'utf8');
for(const id of ['_tkaZzJF9XY','2XwwwSuLO24']){assert.equal((page0.match(new RegExp('embed/'+id,'g'))||[]).length,1,id+' embedded exactly once');assert.ok(!/video-item/.test(page0.slice(page0.indexOf('Additional Examples'),page0.indexOf('resource-section')).split(id).length>1?'video-item':''),'not in Additional Examples');}
const server=http.createServer((req,res)=>{try{let f=path.join(root,new URL(req.url,'http://localhost').pathname);if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});const errors=[];
try{
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));
  await page.route(/youtube|ytimg|googletag|google-analytics|jsdelivr/,r=>r.abort());
  await page.goto(origin+'/ap-calculus/unit-2-derivatives/topics/the-chain-rule/',{waitUntil:'domcontentloaded'});
  const items=await page.locator('.resource-item').evaluateAll(els=>els.map(e=>({title:e.querySelector('.resource-title')?.textContent.trim(),button:e.querySelector('.hw-video-button')?.textContent.trim(),embed:(e.querySelector('iframe')?.getAttribute('src')||'').match(/embed\/([^?]+)/)?.[1]||null})));
  assert.equal(items.length,6);
  for(const it of items)assert.equal(it.button,'HW Walkthrough Video',it.title+' has a walkthrough button');
  assert.equal(items[3].embed,'HMngqzrVM98');
  assert.equal(items[4].title,'Finding Derivatives at a Point with Power, Product, Quotient, Trig, and Chain Rules');assert.equal(items[4].embed,'2XwwwSuLO24');
  assert.equal(items[5].title,'Nested Chain Rule Derivatives');assert.equal(items[5].embed,'_tkaZzJF9XY');
  assert.equal(items[0].embed,'mtPMQKwYI4w');assert.equal(items[1].embed,'mJRx9_5o564');assert.equal(items[2].embed,'AO8bpmrze8Y');
  for(const i of [4,5]){const item=page.locator('.resource-item').nth(i),btn=item.locator('.hw-video-button'),slot=item.locator('.hw-video-slot');
   assert.equal(await slot.evaluate(e=>getComputedStyle(e).display),'none');await btn.click();assert.ok(await slot.evaluate(e=>e.classList.contains('open')&&getComputedStyle(e).display!=='none'),'slot opens');
   assert.equal((await btn.textContent()).trim(),'Hide HW Walkthrough Video');await btn.click();assert.equal((await btn.textContent()).trim(),'HW Walkthrough Video');}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3),false,'no horizontal overflow');
  await page.close();
 }
}finally{await browser.close();server.close();}
console.log(JSON.stringify({ok:!errors.length,buttonsChecked:buttons,errors}));process.exit(errors.length?1:0);
