import fs from 'node:fs';
import assert from 'node:assert/strict';
import {serve,browser,randomPort,ROOT} from '../review-lab/lib/browser.mjs';
const {videos}=JSON.parse(fs.readFileSync(new URL('./videos.json',import.meta.url)));
const port=process.env.BM_PORT?Number(process.env.BM_PORT):randomPort(11200),server=process.env.BM_PORT?{close(done){done?.();}}:await serve(port),b=await browser(),results=[];
try{
 for(const width of [1366,390])for(const video of videos){
  const context=await b.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='127.0.0.1')return r.continue();if(u.hostname.includes('youtube'))return r.fulfill({contentType:'text/html',body:'<title>Simulated video transport</title><button>Player</button>'});if(u.hostname==='i.ytimg.com')return r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"/>'});return r.abort();});
  const row={part:video.part,path:video.path,width,video:video.id};
  try{
   await page.goto(`http://127.0.0.1:${port}/`+video.path);const box=page.locator('[data-video-id]');
   assert.equal(await box.count(),1);assert.equal(await box.getAttribute('data-video-id'),video.id);assert.equal(await page.locator('.video-title').innerText(),video.title);
   assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.locator('[data-bm-videos]').getAttribute('data-video-layout'),'large');
   const play=page.getByRole('button',{name:'Play '+video.title,exact:true});
   if(width===390){await play.tap();row.interaction='touch tap';}else{await play.focus();await page.keyboard.press('Enter');row.interaction='keyboard Enter';}
   const frame=page.locator('iframe');await frame.waitFor();assert.equal(await frame.count(),1);
   const url=new URL(await frame.getAttribute('src'));assert.equal(url.pathname,'/embed/'+video.id);assert.equal(url.protocol,'https:');
   for(const name of ['start','t','end'])assert.ok(!url.searchParams.has(name));assert.equal(await frame.getAttribute('title'),video.title);
   const layout=await frame.evaluate(e=>{const r=e.getBoundingClientRect();return{width:r.width,height:r.height,overflow:document.documentElement.scrollWidth-innerWidth};});
   assert.ok(layout.width>0&&Math.abs(layout.width/layout.height-16/9)<0.04);assert.ok(layout.overflow<=1);assert.equal(await page.locator('[data-video-id] .video-play').count(),0);
   for(const href of await page.locator('a[href]').evaluateAll(a=>a.map(e=>e.getAttribute('href')).filter(h=>h&&!/^(https?:|mailto:|#|javascript:)/.test(h)))){
    const response=await page.request.get(new URL(href,page.url()).href);assert.equal(response.status(),200,href);
   }
   assert.deepEqual(errors,[]);row.passed=true;row.playerUrl=url.href;row.layout=layout;
  }catch(e){row.passed=false;row.failure=e.stack;}finally{results.push(row);await context.close();}
 }
}finally{await b.close();await new Promise(r=>server.close(r));}
const out=process.env.VIDEO_QA_OUT||'docs/v13.0.F/evidence/videos-browser.json';fs.writeFileSync(out,JSON.stringify({siteRoot:process.env.BM_ROOT?'clean-extracted-ZIP':'source checkout',results,externalPlaybackVerified:false},null,2)+'\n');
console.log(`${results.filter(r=>r.passed).length}/${results.length} desktop/mobile video checks pass`);if(results.some(r=>!r.passed)){console.log(results.filter(r=>!r.passed));process.exitCode=1;}
