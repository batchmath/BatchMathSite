// N checkpoint 1: reproduce the deployed seed before changing the QA helper.
// This observes the real interface; it never forces Next or advances a stage.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {localMathJax} from './mathjax-browser-qa.mjs';
import {exerciseAnsweredEnter} from './answered-enter-browser-qa.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'qa-results/unit4-v128n-baseline');fs.mkdirSync(out,{recursive:true});
const legacy=process.argv.includes('--expect-legacy-failure'),report={ok:false,legacy,cases:[],failures:[]};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{try{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;let browser;
try{
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});await localMathJax(context);await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.abort());
 await context.addInitScript(()=>{let api;Object.defineProperty(window,'BatchMathAPTopicGenerators',{configurable:true,get:()=>api,set:original=>{api={...original,get:slug=>{const gen=original.get(slug);return gen?opts=>{const p=gen(opts);window.__probeProblem=structuredClone(p);return p;}:gen;}};}});});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));const open=async seed=>{await page.goto(`${origin}/ap-calculus/unit-4-integrals/topics/rectangular-approximations/practice/?bm_seed=${seed}&bm_qa=1&bm_debug=0`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.BatchMathRepro?.problemCount===1&&window.__probeProblem&&window.MathJax?.typesetPromise);await page.evaluate(()=>MathJax.startup.promise);};
 const seeds=[1040000];let one=null,two=null;
 for(let seed=1040000;seed<1040040&&(one===null||two===null);seed++){await open(seed);const staged=await page.evaluate(()=>Boolean(window.__probeProblem.stage2));if(staged&&two===null)two=seed;if(!staged&&one===null)one=seed;}
 assert.notEqual(one,null);assert.notEqual(two,null);for(const seed of [one,two])if(!seeds.includes(seed))seeds.push(seed);
 for(const seed of seeds){
  await open(seed);const problem=await page.evaluate(()=>window.__probeProblem),before=await page.evaluate(()=>BatchMathRepro.problemCount),record={seed,twoPart:Boolean(problem.stage2),metadata:problem.unit4Meta};
  record.problemId=await page.evaluate(()=>BatchMathRepro.snapshot().problemId);await page.screenshot({path:path.join(out,`${seed}-initial.png`)});
  if(legacy){
   let failure;try{await exerciseAnsweredEnter(page);}catch(error){failure=error.message;}
   assert.equal(failure,'answer submission did not reveal feedback','Reproduce the exact deployed generic-harness failure');record.legacyError=failure;
   assert.equal(await page.evaluate(()=>BatchMathRepro.problemCount),before,'The student answer must not generate another question');assert.equal(await page.locator('.staged-part-one .result').isVisible(),true,'The real Part 1 feedback is present');assert.equal(await page.locator('#feedback').textContent(),'','The generic helper reads the wrong feedback container');
   if(problem.stage2){
    assert.equal(await page.locator('#next').isVisible(),false,'Do not expose Next before both parts are completed');assert.equal(await page.locator('.staged-part-two').count(),0);await page.locator('.staged-continue').click();await page.locator('.staged-part-two .staged-choice').nth(problem.stage2.correctIndex).click();assert.equal(await page.locator('.staged-part-two .result').isVisible(),true,'Part 2 has its own real feedback');
   }
   await page.locator('#next').waitFor({state:'visible'});await page.waitForFunction(()=>document.activeElement===document.getElementById('next'));await page.screenshot({path:path.join(out,`${seed}-completed.png`)});
   await page.keyboard.down('Enter');await page.waitForFunction(n=>BatchMathRepro.problemCount===n+1,before);await page.keyboard.down('Enter');await page.waitForTimeout(200);await page.keyboard.down('Enter');await page.keyboard.up('Enter');await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>BatchMathRepro.problemCount),before+1,'Completion and held Enter advance exactly one question');record.realStudentFlow='PASS';
  }else{record.helperResult=await exerciseAnsweredEnter(page);record.realStudentFlow='PASS';}
  report.cases.push(record);console.log(JSON.stringify({seed,twoPart:record.twoPart,legacyError:record.legacyError,realStudentFlow:record.realStudentFlow}));
 }
 assert.deepEqual(errors,[]);report.ok=true;await context.close();console.log('PASS exact production seed reproduction and real one-part/two-part student flows');
}catch(error){report.failures.push({error:String(error),stack:error.stack});throw error;}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
