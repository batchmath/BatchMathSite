import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {root,target,instrument} from './engine.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
export async function runner(key){
  const base=process.env.ADVANCED_URL||'http://127.0.0.1:8150',output=root+'tools/mathlive-advanced-pilot/artifacts/';fs.mkdirSync(output,{recursive:true});
  let server,fixtureDir,fixtureBase;const results=[],errors=[];const fixtures=process.env.MATHJAX_FIXTURE_ROOT;
  if(fixtures){fs.mkdirSync(root+'work',{recursive:true});fixtureDir=fs.mkdtempSync(root+'work/advanced-render-');for(const f of ['mathjax','mathjax-newcm'])fs.cpSync(path.join(fixtures,f),path.join(fixtureDir,f),{recursive:true});fixtureBase=base+'/work/'+path.basename(fixtureDir);}
  if(!process.env.ADVANCED_URL){server=spawn(process.env.PYTHON||'python3',['-m','http.server','8150','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}}
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
  async function open({editor='',routes=[],instrumented=true,engineKey=key}={}){
    const p=await browser.newPage({viewport:{width:1500,height:1000},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});p.on('pageerror',e=>errors.push(e.message));await p.route('https://**/*',r=>r.abort());
    if(fixtures)await p.route('https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js',r=>r.fulfill({contentType:'text/javascript',body:`MathJax.loader={paths:{mathjax:'${fixtureBase}/mathjax','mathjax-newcm':'${fixtureBase}/mathjax-newcm'}};MathJax.chtml=Object.assign({},MathJax.chtml,{fontURL:'${fixtureBase}/mathjax-newcm/chtml/woff2'});MathJax.output={font:'mathjax-newcm'};\n`+fs.readFileSync(fixtures+'/mathjax/tex-chtml.js','utf8')}));
    if(instrumented)await p.route('**/assets/ap-topic-practice.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:instrument(await response.text())});});
    for(const [glob,fn] of routes)await p.route(glob,fn);
    await p.goto(base+'/'+target(engineKey)+'?bm_seed=advanced-pilot'+(editor?'&editor='+editor:''));await p.waitForFunction(()=>document.getElementById('question').textContent.trim());return p;
  }
  async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name);}catch(e){results.push({name,passed:false,error:e.stack});console.log('FAIL',name,e.message);}}
  async function finish(){fs.writeFileSync(output+key+'-browser.json',JSON.stringify({browser:browser.version(),realMathJax:!!fixtures,results,pageErrors:errors},null,2)+'\n');await browser.close();server?.kill();if(fixtureDir)fs.rmSync(fixtureDir,{recursive:true,force:true});console.log(`${key}: ${results.filter(r=>r.passed).length}/${results.length} checks passed; ${errors.length} page errors`);if(results.some(r=>!r.passed)||errors.length)process.exitCode=1;}
  return{open,test,finish,fixtures,output,browser,base};
}
export const field=p=>p.locator('.staged-part:not(.staged-completed) math-field:not([aria-disabled="true"]):visible').first();
export const source=p=>p.locator('.staged-part:not(.staged-completed) input.staged-exact-input').first();
export const ready=p=>field(p).waitFor({state:'visible',timeout:12000});
export async function set(p,value,editor='mathlive'){
  if(editor==='legacy')await p.evaluate(value=>BatchMathCalculusKeypad.setRaw(value),value);
  else await field(p).evaluate((f,value)=>{f.setValue(value,{silenceNotifications:true});f.dispatchEvent(new Event('input',{bubbles:true}));},value);
}
export const key=(p,label)=>p.locator('.staged-part:not(.staged-completed) .bm-calc-keypad:visible button').filter({hasText:new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).click();
export const submit=p=>p.locator('.staged-part:not(.staged-completed) .staged-check:enabled').click();
export async function state(p){await p.waitForTimeout(45);return p.evaluate(()=>{const panel=document.querySelector('.staged-part:not(.staged-completed)'),input=panel?.querySelector('input.staged-exact-input');return{raw:input?.value,disabled:input?.disabled,latex:panel?.querySelector('math-field')?.value,result:panel?.querySelector('.staged-feedback .result')?.className,feedback:panel?.querySelector('.staged-feedback')?.textContent,invalid:panel?.querySelector('.staged-input-message')?.textContent,attempted:document.getElementById('attempted-count').textContent,next:!document.getElementById('next').hidden,id:window.advancedQA?.current.id};});}
export async function load(p,problem,editor='mathlive'){await p.evaluate(problem=>advancedQA.load(problem),problem);if(editor==='mathlive')await ready(p);else await p.locator('.staged-part:not(.staged-completed) .bm-calc-editor:visible').waitFor();}
export async function sameOutcome(p,legacy,problem,latex,raw){
  await load(p,problem);await load(legacy,problem,'legacy');await set(p,latex);await set(legacy,raw,'legacy');await submit(p);await submit(legacy);
  const a=await state(p),b=await state(legacy);for(const k of ['disabled','result','invalid','next'])assert.equal(a[k],b[k],`${problem.id}: ${k}: ${a.raw} vs ${b.raw}`);return a;
}
