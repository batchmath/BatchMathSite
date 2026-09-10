#!/usr/bin/env node
import fs from 'node:fs';
import {exerciseUnit1Approved} from './unit1-approved-browser-qa.mjs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { exerciseAnsweredEnter, exerciseAdvancedHints, realEnterEngines } from './answered-enter-browser-qa.mjs';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const OUT=path.join(ROOT,'qa-results');
fs.mkdirSync(OUT,{recursive:true});
const PORT=Number(process.env.BM_QA_PORT||4173);
const SEED_COUNT=Math.max(2,Number(process.env.BM_QA_SEEDS||3));
const BASE_SEED=Number(process.env.BM_QA_BASE_SEED||1040000);
const errors=[];const warnings=[];const results=[];let enterAdvanceChecks=0;let answeredEnterChecks=0;
const ENTER_ADVANCE_EXCLUSIONS=new Set(['ap_classifying_discontinuities']);
const norm=p=>p.split(path.sep).join('/');

function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','tools','qa-results'].includes(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else out.push(f);}return out;}
function engines(){return walk(ROOT).filter(f=>f.endsWith('index.html')).flatMap(f=>{const html=fs.readFileSync(f,'utf8');if(!html.includes('problem-tracking.js'))return[];const m=html.match(/window\.BM_ANALYTICS_CONFIG=\{course:"([^"]+)",engineId:"([^"]+)",generatorVersion:"([^"]+)"\}/);return m?[{file:f,route:'/'+norm(path.relative(ROOT,path.dirname(f)))+'/',course:m[1],engineId:m[2],generatorVersion:m[3]}]:[];}).sort((a,b)=>a.engineId.localeCompare(b.engineId));}

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
function staticServer(){return http.createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost');let rel=decodeURIComponent(u.pathname).replace(/^\/+/, '');let f=path.resolve(ROOT,rel);if(!f.startsWith(ROOT)){res.writeHead(403).end();return;}if(u.pathname.endsWith('/'))f=path.join(f,'index.html');if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404,{'content-type':'text/plain'});res.end('Not found');return;}res.writeHead(200,{'content-type':mime[path.extname(f).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(f).pipe(res);}catch(e){res.writeHead(500).end(String(e));}});}

async function waitForServer(server){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(PORT,'127.0.0.1',resolve);});}

async function sample(context,engine,seed,checkEnterAdvance=false){
  const page=await context.newPage();const pageErrors=[];const consoleErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
  page.on('console',msg=>{if(msg.type()==='error'){const t=msg.text();if(!/ERR_FAILED|Failed to load resource/i.test(t))consoleErrors.push(t);}});
  const url=`http://127.0.0.1:${PORT}${engine.route}?bm_seed=${encodeURIComponent(seed)}&bm_qa=1&bm_debug=0`;
  try{
    const openAndStart=async()=>{
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
      await page.waitForFunction(()=>window.BatchMathRepro&&window.BatchMathRNG&&window.BatchMathAnswers,null,{timeout:5000});
      const start=page.locator('#startBtn');if(await start.count())await start.click();
    };
    await openAndStart();
    try{await page.waitForFunction(()=>window.BatchMathRepro?.problemCount>=1,null,{timeout:10000});}
    catch(firstError){
      // One transient CI navigation/render stall should not turn an otherwise
      // deterministic engine into a false failure. Reload once; a genuinely
      // broken engine will fail the second bounded wait as well.
      await openAndStart();
      await page.waitForFunction(()=>window.BatchMathRepro?.problemCount>=1,null,{timeout:15000});
    }
    const fractionNormalization=await page.evaluate(()=>{
      const f=window.BatchMathAnswers?.normalizeFractionSigns;
      if(typeof f!=='function')return null;
      const variants=['-1/2','(-1)/2','1/-2','1/(-2)','-(1/2)','−(1/2)'];
      return variants.map(v=>f(v));
    });
    if(!fractionNormalization||fractionNormalization.some(v=>v!=='-1/2'))throw new Error(`fraction-sign normalizer failed in browser: ${JSON.stringify(fractionNormalization)}`);
    const snap=await page.evaluate(()=>{
      const s=window.BatchMathRepro.snapshot();
      const candidates=['#question','#problem','.math-question','.question-box .question','.question-area .question'];
      let q='';for(const sel of candidates){const el=document.querySelector(sel);if(el&&String(el.innerHTML||el.textContent).trim()){q=String(el.innerHTML||el.textContent).replace(/\s+/g,' ').trim();break;}}
      const btn=document.getElementById('bm-report-problem');
      return {snap:s,questionSignature:q.slice(0,1000),reportButtonVisible:!!btn&&getComputedStyle(btn).display!=='none'};
    });
    if(String(snap.snap.seed)!==String(seed))throw new Error(`reported seed ${snap.snap.seed} != requested ${seed}`);
    if(snap.snap.problemCount!==1)throw new Error(`first question recorded ${snap.snap.problemCount} generation events instead of 1`);
    if(!snap.snap.problemId)throw new Error('generated problem has no reproducible problemId/key');
    if(!snap.reportButtonVisible)throw new Error('Report a Problem button did not become available after generation');
    if(!snap.questionSignature)throw new Error('generated question area appears empty');
    if(pageErrors.length)throw new Error(`page error: ${pageErrors.join(' | ')}`);
    if(consoleErrors.length)throw new Error(`console error: ${consoleErrors.join(' | ')}`);
    if(checkEnterAdvance && (engine.course==='ap_calculus_ab'||engine.course==='calculus_prep')){
      if(engine.engineId==='ap_advanced_trig_limits'){await exerciseAdvancedHints(page);answeredEnterChecks++;}
      if(realEnterEngines.has(engine.engineId)){
        await exerciseAnsweredEnter(page);
        answeredEnterChecks++;
      }
      // Routing-only smoke test for every standard engine. The separate tests
      // above submit real answers; this synthetic setup tests the visible control.
      const before=await page.evaluate(()=>window.BatchMathRepro.problemCount);
      const prep=await page.evaluate(()=>{
        const next=document.getElementById('next');
        if(next){next.hidden=false;next.disabled=false;next.style.display='inline-block';return {control:'next'};}
        const fresh=document.getElementById('new');
        if(fresh){
          fresh.hidden=false;fresh.disabled=false;fresh.style.display='inline-block';
          const feedback=document.querySelector('#feedback,.feedback');
          if(feedback){feedback.textContent='Incorrect answer explanation shown.';feedback.classList.add('shown','wrong');}
          return {control:'new'};
        }
        return {control:null};
      });
      if(!prep.control)throw new Error('no next/new-problem control available for Enter-advance QA');
      await page.evaluate(()=>document.activeElement?.blur());
      await page.keyboard.press('Enter');
      await page.waitForFunction(n=>Number(window.BatchMathRepro?.problemCount||0)>n,before,{timeout:3000});
      // Allow any competing delayed handler/default button activation to fire before
      // judging the final count. A correct Enter press must still advance exactly once.
      await page.waitForTimeout(220);
      const after=await page.evaluate(()=>Number(window.BatchMathRepro?.problemCount||0));
      if(after!==before+1)throw new Error(`Enter advance generated ${after-before} problems instead of exactly 1`);
      enterAdvanceChecks++;
    }
    if(pageErrors.length)throw new Error(`page error after interaction: ${pageErrors.join(" | ")}`);
    if(consoleErrors.length)throw new Error(`console error after interaction: ${consoleErrors.join(" | ")}`);
    return snap;
  } finally {await page.close();}
}

const server=staticServer();let browser;
try{
  await waitForServer(server);
  browser=await chromium.launch({headless:true,args:['--disable-background-networking']});
  const context=await browser.newContext({serviceWorkers:'block'});
  // CI tests generator behavior, not third-party availability. Abort external traffic
  // so Analytics/MathJax/YouTube cannot make results flaky or consume time.
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='127.0.0.1'||u.hostname==='localhost')route.continue();else route.abort();});
  try{answeredEnterChecks+=await exerciseUnit1Approved(context,`http://127.0.0.1:${PORT}`);}catch(e){errors.push('Unit 1 approved workflows: '+e.message);}
  const list=engines();if(list.length!==88)errors.push(`Expected 88 engines, found ${list.length}`);
  for(const engine of list){
    const seen=new Set();
    for(let i=0;i<SEED_COUNT;i++){
      const seed=String(BASE_SEED+i);
      try{
        const checkEnter=i===0&&!ENTER_ADVANCE_EXCLUSIONS.has(engine.engineId);
        const a=await sample(context,engine,seed,checkEnter);const b=await sample(context,engine,seed,false);
        const sigA=JSON.stringify({id:a.snap.problemId,calls:a.snap.randomCalls,q:a.questionSignature,settings:a.snap.settings});
        const sigB=JSON.stringify({id:b.snap.problemId,calls:b.snap.randomCalls,q:b.questionSignature,settings:b.snap.settings});
        if(sigA!==sigB)throw new Error(`same seed produced different first problem (${a.snap.problemId} vs ${b.snap.problemId})`);
        seen.add(a.snap.problemId);
        results.push({engineId:engine.engineId,route:engine.route,seed,problemId:a.snap.problemId,randomCalls:a.snap.randomCalls,ok:true});
      }catch(e){errors.push(`${engine.engineId} seed=${seed}: ${e.message}`);results.push({engineId:engine.engineId,route:engine.route,seed,ok:false,error:e.message});}
    }
    if(seen.size<2)warnings.push(`${engine.engineId}: ${SEED_COUNT} sampled seeds produced only ${seen.size} unique first-problem ID(s)`);
  }
  await context.close();
} catch(e){errors.push(`Browser QA infrastructure failure: ${e.stack||e.message||e}`);
} finally {if(browser)await browser.close().catch(()=>{});await new Promise(r=>server.close(r));}

const report={ok:errors.length===0,generatedAt:new Date().toISOString(),seedCount:SEED_COUNT,engineCount:new Set(results.map(r=>r.engineId)).size,samples:results.length,enterAdvanceChecks,answeredEnterChecks,errors,warnings,results};
fs.writeFileSync(path.join(OUT,'seeded-generator-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=[`BatchMath seeded generator browser QA`,`Result: ${report.ok?'PASS':'FAIL'}`,`Engines: ${report.engineCount}`,`Seeds per engine: ${SEED_COUNT}`,`Reproducibility samples: ${results.filter(r=>r.ok).length}`,`Calculus/Calculus Prep Enter routing checks: ${enterAdvanceChecks}`,`Real answer/Enter workflow checks: ${answeredEnterChecks}`,'',`Warnings: ${warnings.length}`,...warnings.map(x=>`- ${x}`),'',`Errors: ${errors.length}`,...errors.map(x=>`- ${x}`),''];fs.writeFileSync(path.join(OUT,'seeded-generator-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
