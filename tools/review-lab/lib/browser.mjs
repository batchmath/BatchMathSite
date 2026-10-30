// Shared browser helpers for the review lab: a static server for a site tree, Playwright contexts that load
// MathJax 4.1.3 from the local cache ($REVIEW_HOME/vendor, filled by setup.sh) instead of the CDN, and a
// page opener that waits for MathJax and collects console errors.
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const {chromium}=require('playwright');
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {LAB,REPO,ROOT,REVIEW_HOME} from './root.mjs';
export {LAB,REPO,ROOT,REVIEW_HOME};
const VENDOR=path.join(REVIEW_HOME,'vendor');
if(!fs.existsSync(path.join(VENDOR,'mathjax/package/package.json')))console.error('review-lab: MathJax is missing; run tools/review-lab/setup.sh first');
// REVIEW_OUT: where screenshots and results go; default $REVIEW_HOME/out
export function outDir(...sub){const d=path.join(process.env.REVIEW_OUT||path.join(REVIEW_HOME,'out'),...sub);fs.mkdirSync(d,{recursive:true});return d;}
export const randomPort=base=>base+Math.floor(Math.random()*400);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.pdf':'application/pdf','.webmanifest':'application/manifest+json','.txt':'text/plain','.xml':'application/xml'};
export function serve(port){return new Promise(res=>{const srv=http.createServer((req,rs)=>{const p=decodeURIComponent(new URL(req.url,'http://x').pathname);let f=path.join(ROOT,p);if(!f.startsWith(ROOT)){rs.writeHead(403).end();return;}if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){rs.writeHead(404).end('not found');return;}rs.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(rs);});srv.listen(port,'127.0.0.1',()=>res(srv));});}
// Headless Chromium hides scrollbars by default, which hides exactly the scroll boxes students see on Windows
// and ChromeOS. Pass {scrollbars:true} for any layout or screenshot check.
export async function browser({scrollbars=false}={}){return chromium.launch(scrollbars?{ignoreDefaultArgs:['--hide-scrollbars']}:{});}
const vendorFile=(dir,rel)=>{const f=path.join(VENDOR,dir,'package',rel);return fs.existsSync(f)?f:null;};
export async function context(b,{width=1366,height=768,mobile=false}={}){
 const c=await b.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
 await c.route(/cdn\.jsdelivr\.net/,r=>r.abort());
 await c.route(/googletagmanager|google-analytics|speech-rule-engine/,r=>r.abort());
 await c.route(/cdn\.jsdelivr\.net\/npm\/mathjax@4\.1\.3\/(.*)$/,r=>{const f=vendorFile('mathjax',r.request().url().match(/mathjax@4\.1\.3\/([^?]*)/)[1]);if(!f)return r.abort();r.fulfill({status:200,contentType:mime[path.extname(f)]||'text/javascript',body:fs.readFileSync(f)});});
 await c.route(/cdn\.jsdelivr\.net\/npm\/@mathjax\/mathjax-newcm-font@[^/]+\/(.*)$/,r=>{const f=vendorFile('newcm',r.request().url().match(/mathjax-newcm-font@[^/]+\/([^?]*)/)[1]);if(!f)return r.abort();r.fulfill({status:200,contentType:mime[path.extname(f)]||'text/javascript',body:fs.readFileSync(f)});});
 return c;
}
// Record the last generated problem as window.__bmLast (id, variant, stage answers) on AP topic practice pages.
export async function recordGenerated(c){await c.addInitScript(()=>{let real;Object.defineProperty(window,'BatchMathAPTopicGenerators',{configurable:true,get(){return real;},set(v){real={...v,get:s=>{const g=v.get(s);return g&&(o=>{const p=g(o);window.__bmLast=p;return p;});}};}});});}
export async function open(c,url){const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|net::/.test(m.text()))errs.push('console: '+m.text());});await p.goto(url,{waitUntil:'load'});await p.waitForFunction(()=>window.MathJax?.startup?.promise,null,{timeout:15000}).catch(()=>{});await p.evaluate(()=>window.MathJax?.startup?.promise).catch(()=>{});await p.waitForTimeout(300);p._errs=errs;return p;}
export async function rendered(p,sel='#question'){return p.$eval(sel,el=>({mjx:el.querySelectorAll('mjx-container').length,raw:/\\\(|\\\)|\\frac|\\int/.test(el.innerText)}));}
export const unit4Practice=slug=>`/ap-calculus/unit-4-integrals/topics/${slug}/practice/`;
