// Read-only production preflight/post-deployment checks. Never deploys or changes refs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const base='https://batchmath.net/',baseline='d846d75a427b44cda4c7840e0e2c67054b533e43';
const {videos}=JSON.parse(fs.readFileSync('tools/v13-im1-videos/videos.json'));
const additions=JSON.parse(fs.readFileSync('tools/v13g-im1-videos/approved-additions.json')).videos;
const preflight=process.env.LIVE_MODE==='preflight';
const out={mode:preflight?'production baseline preflight':'post-deployment',baseline,externalPlaybackVerified:false,metadata:[],checks:[],passed:false};
const output=process.env.LIVE_OUT||'qa-results/v13g-live.json';fs.mkdirSync('qa-results',{recursive:true});
const save=()=>fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
async function get(p){const r=await fetch(new URL(p,base),{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,p);return Buffer.from(await r.arrayBuffer());}
const expected=p=>preflight?execFileSync('git',['show',baseline+':'+p]):fs.readFileSync(p);
const same=async p=>assert.deepEqual(await get(p),expected(p),p+': served bytes differ from approved source');
let b,warm;
try{
 if(preflight){
  assert.equal(JSON.parse((await get('assets/app-version.json')).toString()).version,'13.0.F');
  for(const v of videos.slice(0,5))await same(v.path);
  for(const p of ['assets/instructional-videos.css','assets/instructional-videos.js','assets/unit6-3d/viewer.mjs','assets/unit6-3d/revolution-viewer.mjs','assets/mathlive/unit6.mjs'])await same(p);
  for(const v of additions){
   const row={part:v.part,id:v.id,approvedTitle:v.title};
   try{const r=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+v.id),{signal:AbortSignal.timeout(8000)});row.status=r.status;if(r.ok){const m=await r.json();row.publicTitle=m.title;row.author=m.author_name;}else row.metadataUnavailable=true;}catch(e){row.metadataUnavailable=true;row.reason=e.message;}
   try{const r=await fetch(`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,{signal:AbortSignal.timeout(8000)});row.thumbnailStatus=r.status;row.thumbnailBytes=(await r.arrayBuffer()).byteLength;}catch(e){row.thumbnailUnavailable=true;}
   out.metadata.push(row);save();
  }
  out.checks.push('Production F version, original five pages and preserved video/3D/MathLive assets match baseline');
 }else{
  // Warm a real live context before waiting for Pages. If Pages already switched,
  // report that an F-to-G cached-context test was no longer feasible.
  b=await chromium.launch();warm=await b.newContext();const p=await warm.newPage();
  await warm.route(/googletagmanager|google-analytics/,r=>r.abort());
  await p.goto(new URL(videos[0].path,base).href,{waitUntil:'load'});
  out.cachedContext={initialVersion:await p.evaluate(()=>window.BatchMathPWA?.version||null)};
  await p.evaluate(()=>Promise.race([navigator.serviceWorker?.ready,new Promise(r=>setTimeout(r,8000))]));
  out.cachedContext.initialController=await p.evaluate(()=>!!navigator.serviceWorker?.controller);
  for(const v of videos)await p.goto(new URL(v.path,base).href,{waitUntil:'load'});
  out.cachedContext.warmedLessonPages=videos.length;
  const deadline=Date.now()+15*60*1000;let ready=false;
  while(Date.now()<deadline){
   try{
    for(const name of ['assets/app-version.json','assets/pwa.js','assets/problem-tracking.js','assets/reproducible-rng.js','sw.js','assets/instructional-videos.css','assets/instructional-videos.js',...videos.map(v=>v.path)])await same(name);
    ready=true;break;
   }catch(e){out.lastReadinessFailure=e.message;save();await new Promise(r=>setTimeout(r,10000));}
  }
  assert.ok(ready,'Pages did not serve the complete tested G content within 15 minutes');delete out.lastReadinessFailure;
  await p.reload({waitUntil:'load'});await p.waitForFunction(()=>window.BatchMathPWA?.version==='13.0.G');
  const registration=await p.evaluate(async()=>{
   const r=await navigator.serviceWorker.getRegistration();if(!r)return false;
   await r.update();if(r.installing){const worker=r.installing;await Promise.race([new Promise(resolve=>worker.addEventListener('statechange',()=>{if(worker.state==='installed'||worker.state==='redundant')resolve();})),new Promise(resolve=>setTimeout(resolve,30000))]);}
   if(r.waiting)r.waiting.postMessage({type:'SKIP_WAITING'});return true;
  });
  await p.reload({waitUntil:'load'});assert.equal(await p.evaluate(()=>window.BatchMathPWA?.version),'13.0.G');
  if(registration)await p.waitForFunction(async()=>{
   const r=await navigator.serviceWorker.getRegistration();if(!r?.active)return false;
   return new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=e=>resolve(e.data.version==='13.0.G');r.active.postMessage({type:'GET_VERSION'},[channel.port2]);setTimeout(()=>resolve(false),1000);});
  });
  for(const v of videos){const response=await p.goto(new URL(v.path,base).href,{waitUntil:'load'});assert.equal(await response.text(),fs.readFileSync(v.path,'utf8'));assert.equal(await p.locator(`[data-video-id="${v.id}"]`).count(),1);}
  out.cachedContext.finalCacheNames=await p.evaluate(()=>caches.keys());
  assert.ok(out.cachedContext.finalCacheNames.every(k=>!k.includes('13.0.F')),'old F caches must be removed after service-worker activation');
  out.cachedContext.finalVersion='13.0.G';out.cachedContext.registration=registration;out.cachedContext.passed=true;
  out.cachedContext.previouslyF=out.cachedContext.initialVersion==='13.0.F';
  out.checks.push('All 18 live lesson pages and all changed runtime/cache assets match tested source byte-for-byte');
  await warm.close();warm=null;await b.close();b=null;
 }
 for(const p of ['','im1/','ap-calculus/','calculus-prep/','assets/unit6-3d/vendor/three/three.module.min.mjs','assets/mathlive/vendor/mathlive/mathlive.min.mjs']){await get(p);out.checks.push('HTTP 200: /'+p);}
 out.passed=true;save();console.log(JSON.stringify(out,null,2));
}catch(e){out.failure=e.stack;save();throw e;}finally{await warm?.close();await b?.close();}
