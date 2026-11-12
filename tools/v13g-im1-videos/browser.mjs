import fs from 'node:fs';
import assert from 'node:assert/strict';
import {serve,browser,randomPort,ROOT} from '../review-lab/lib/browser.mjs';
import {chromium} from 'playwright';
import path from 'node:path';
const {videos}=JSON.parse(fs.readFileSync(new URL('../v13-im1-videos/videos.json',import.meta.url)));
const port=process.env.BM_PORT?Number(process.env.BM_PORT):randomPort(11200),server=(process.env.BM_PORT||process.env.BM_BASE_URL)?{close(done){done?.();}}:await serve(port),b=await chromium.launch({executablePath:process.env.BM_CHROMIUM_EXECUTABLE||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)}),results=[],links=new Set();
const base=process.env.BM_BASE_URL||`http://127.0.0.1:${port}/`;const origin=new URL(base).origin;
let thumbnailFallback;
try{
 for(const width of [1366,768,390])for(const video of videos){
  const context=await b.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===origin)return r.continue();if(u.hostname.includes('youtube'))return r.fulfill({contentType:'text/html',body:'<title>Simulated video transport</title><button>Player</button>'});if(u.hostname==='i.ytimg.com')return r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"/>'});return r.abort();});
  const row={part:video.part,path:video.path,width,video:video.id};
  try{
   const response=await page.goto(new URL(video.path,base).href);assert.equal(response.status(),200);if(process.env.BM_BASE_URL)assert.equal(await response.text(),fs.readFileSync(path.join(ROOT,video.path),'utf8'),'live HTML must match tested source');const box=page.locator('[data-video-id]');
   assert.equal(await box.count(),1);assert.equal(await box.getAttribute('data-video-id'),video.id);assert.equal(await page.locator('.video-title').innerText(),video.title);
   assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.locator('[data-bm-videos]').getAttribute('data-video-layout'),'large');
   await page.locator('img.video-thumb').scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const e=document.querySelector('img.video-thumb');return e.complete&&e.naturalWidth>0;});
   const play=page.getByRole('button',{name:'Play '+video.title,exact:true});
   if(width===390){await play.tap();row.interaction='touch tap';}else if(width===768){await play.click();row.interaction='pointer click';}else{await play.focus();await page.keyboard.press('Enter');row.interaction='keyboard Enter';}
   const frame=page.locator('iframe');await frame.waitFor();assert.equal(await frame.count(),1);
   const url=new URL(await frame.getAttribute('src'));assert.equal(url.pathname,'/embed/'+video.id);assert.equal(url.protocol,'https:');
   for(const name of ['start','t','end'])assert.ok(!url.searchParams.has(name));assert.equal(await frame.getAttribute('title'),video.title);
   const layout=await frame.evaluate(e=>{const r=e.getBoundingClientRect();return{width:r.width,height:r.height,overflow:document.documentElement.scrollWidth-innerWidth};});
   assert.ok(layout.width>0&&Math.abs(layout.width/layout.height-16/9)<0.04);assert.ok(layout.overflow<=1);assert.equal(await page.locator('[data-video-id] .video-play').count(),0);
   for(const href of await page.locator('a[href]').evaluateAll(a=>a.map(e=>e.getAttribute('href')).filter(h=>h&&!/^(https?:|mailto:|#|javascript:)/.test(h)))){
    const url=new URL(href,page.url()).href;if(!links.has(url)){const response=await page.request.get(url);assert.equal(response.status(),200,href);links.add(url);}
   }
   assert.deepEqual(errors,[]);row.passed=true;row.playerUrl=url.href;row.layout=layout;
  }catch(e){row.passed=false;row.failure=e.stack;}finally{results.push(row);await context.close();}
 }
 const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),p=await c.newPage(),v=videos.at(-1);
 try{
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===origin)return r.continue();if(u.hostname.includes('youtube'))return r.fulfill({contentType:'text/html',body:'<title>Simulated iframe</title>'});return r.abort();});
  await p.goto(new URL(v.path,base).href);const play=p.getByRole('button',{name:'Play '+v.title,exact:true});assert.ok(await play.isVisible());assert.equal(await p.locator('.video-title').innerText(),v.title);await play.tap();assert.equal(new URL(await p.locator('iframe').getAttribute('src')).pathname,'/embed/'+v.id);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));thumbnailFallback={id:v.id,passed:true,titleAndNativePlayRemainUsableWithThumbnailUnavailable:true};
 }finally{await c.close();}
}finally{await b.close();await new Promise(r=>server.close(r));}
const out=process.env.VIDEO_QA_OUT||'docs/v13.0.G/evidence/videos-browser.json';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({siteRoot:process.env.BM_BASE_URL||'source checkout',results,thumbnailFallback,externalPlaybackVerified:false,thumbnailTransportSimulated:true,internalLinksChecked:links.size},null,2)+'\n');
console.log(`${results.filter(r=>r.passed).length}/${results.length} desktop/mobile video checks pass`);if(results.some(r=>!r.passed)){console.log(results.filter(r=>!r.passed));process.exitCode=1;}
