// Verify a real v12.9.E service worker cannot reuse previous-version MathLive cache entries.
// BM_ROOT points to the clean extracted ZIP; the page and worker use only that server.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {serve,randomPort,ROOT} from '../review-lab/lib/browser.mjs';

const port=randomPort(10800),server=await serve(port),base='http://127.0.0.1:'+port;
const proxy=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',...(proxy?{proxy:{server:proxy,bypass:'localhost,127.0.0.1,[::1]'}}:{})});
const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();
const out={version:'12.9.E',oldCachesSeeded:2,resources:[],failures:[]};
const names=['assets/mathlive/keypad-bridge.mjs','assets/mathlive/integral-setup.mjs',
             'assets/mathlive/vendor/mathlive/mathlive.min.mjs'];
const lock=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/mathlive/dependency-lock.json'))).mathlive.files;
names.push('assets/mathlive/'+lock.find(e=>e.path.endsWith('.woff2')).path);
try {
  await page.route('**/__pwa-seed__',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>PWA cache verification</title>'}));
  await page.goto(base+'/__pwa-seed__');
  await page.evaluate(async()=>{
    for(const key of ['batchmath-runtime-12.9.C','batchmath-shell-12.8.Y']) {
      const cache=await caches.open(key);
      await cache.put('/assets/mathlive/keypad-bridge.mjs',new Response('STALE OLD MATHLIVE'));
      await cache.put('/assets/mathlive/integral-setup.mjs',new Response('STALE OLD INTEGRAL ADAPTER'));
    }
    await navigator.serviceWorker.register('/sw.js');
  });
  await page.waitForFunction(()=>navigator.serviceWorker.controller,{timeout:60000});
  const state=await page.evaluate(async()=>{
    const version=await new Promise(resolve=>{const ch=new MessageChannel();ch.port1.onmessage=e=>resolve(e.data.version);navigator.serviceWorker.controller.postMessage({type:'GET_VERSION'},[ch.port2]);});
    return {version,keys:await caches.keys()};
  });
  assert.equal(state.version,'12.9.E');
  assert.ok(state.keys.includes('batchmath-shell-12.9.E'));
  assert.ok(!state.keys.some(k=>k.endsWith('12.9.C')||k.endsWith('12.8.Y')));
  out.activeWorkerVersion=state.version;out.cacheKeysAfterActivation=state.keys;
  async function fetchHash(name) {
    return page.evaluate(async name=>{
      const response=await fetch('/'+name);const bytes=await response.arrayBuffer();
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      return {status:response.status,bytes:bytes.byteLength,sha256:[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')};
    },name);
  }
  for(const name of names) {
    const expected=createHash('sha256').update(fs.readFileSync(path.join(ROOT,name))).digest('hex');
    const online=await fetchHash(name);assert.equal(online.status,200);assert.equal(online.sha256,expected);
    out.resources.push({path:name,expected,online});
  }
  await context.setOffline(true);
  for(const row of out.resources) {
    row.offline=await fetchHash(row.path);assert.equal(row.offline.status,200);assert.equal(row.offline.sha256,row.expected);
  }
  out.passed=true;
} catch(e) {out.passed=false;out.failures.push(e.stack);throw e;}
finally {
  fs.writeFileSync(process.env.PWA_OUT||'docs/final-integration/evidence/pwa-browser.json',JSON.stringify(out,null,2)+'\n');
  await browser.close();await new Promise(r=>server.close(r));
}
console.log('PASS: v12.9.E activation removes old caches; four MathLive modules/font resources match online and offline');
