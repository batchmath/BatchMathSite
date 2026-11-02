import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {root,target as targetFor,instrument,representatives as findReps} from './engine.mjs';
const rule=process.env.RULE||'product',target=targetFor(rule);
import {parseInput,batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
import {enterWithKeypad} from '../mathlive-power-rule/keypad-entry.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=process.env.CHAIN_PILOT_URL||'http://127.0.0.1:8157';
const output=root+'tools/mathlive-batch1/artifacts/';fs.mkdirSync(output,{recursive:true});
const mathjaxFixture=process.env.MATHJAX_FIXTURE_ROOT,results=[],errors=[];
let browser,server,fixtureDir,fixtureBase,gradingPairs=0;
async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name);}catch(e){results.push({name,passed:false,error:e.stack});console.log('FAIL',name,e.message);}}
async function page({mode='',routes=[],instrumented=true}={}){
  const p=await browser.newPage({viewport:{width:1600,height:1100},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});
  p.on('pageerror',e=>errors.push(e.message));await p.route('https://**/*',r=>r.abort());
  if(mathjaxFixture)await p.route('https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js',r=>r.fulfill({contentType:'text/javascript',body:
    `MathJax.loader={paths:{mathjax:'${fixtureBase}/mathjax','mathjax-newcm':'${fixtureBase}/mathjax-newcm'}};MathJax.chtml.fontURL='${fixtureBase}/mathjax-newcm/chtml/woff2';MathJax.output={font:'mathjax-newcm'};\n`+fs.readFileSync(mathjaxFixture+'/mathjax/tex-chtml.js','utf8')}));
  if(instrumented)await p.route('**/'+target.replace('index.html','')+'?*',async r=>{const response=await r.fetch();await r.fulfill({response,body:instrument(await response.text())});});
  for(const [glob,fn] of routes)await p.route(glob,fn);
  await p.goto(base+'/'+target.replace('index.html','')+'?bm_seed=derivatives-pilot'+(mode?'&editor='+mode:''));
  await p.waitForFunction(()=>document.querySelector('#question').textContent.trim());return p;
}
const ready=p=>p.waitForFunction(()=>document.getElementById('answer').dataset.editor==='mathlive');
const state=async p=>{await p.waitForTimeout(35);return p.evaluate(()=>({raw:document.getElementById('answer').value,latex:document.querySelector('math-field')?.value,attempts:ruleQA.attempts,correct:ruleQA.correct,current:ruleQA.current,status:document.querySelector('#feedback .status')?.textContent,feedback:document.getElementById('feedback').innerHTML,count:BatchMathRepro.problemCount}));};
const set=(p,latex)=>p.evaluate(latex=>{const mf=document.querySelector('math-field');mf.setValue(latex,{silenceNotifications:true});mf.dispatchEvent(new Event('input',{bubbles:true}));},latex);
const key=(p,label)=>p.locator('.bm-calc-keypad:visible button').filter({hasText:new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).click();
const load=(p,problem)=>p.evaluate(problem=>{ruleQA.current={...problem,answered:false};document.getElementById('question').innerHTML=problem.q;document.getElementById('feedback').innerHTML='';document.getElementById('answer').value='';document.getElementById('answer').disabled=false;document.getElementById('submit').disabled=false;document.getElementById('next').style.display='none';BatchMathCalculusKeypad.reset();BatchMathCalculusKeypad.focus();},problem);
async function parity(p,legacy,problem,latex,raw,expected){
  for(const editor of [p,legacy])await load(editor,problem);
  await set(p,latex);await legacy.evaluate(raw=>BatchMathCalculusKeypad.setRaw(raw),raw);
  const beforeA=(await state(p)).attempts,beforeB=(await state(legacy)).attempts;
  await p.locator('#submit').click();await legacy.locator('#submit').click();
  const a=await state(p),b=await state(legacy);assert.equal(a.status,b.status,`${problem.id}: ${a.raw}`);
  if(expected)assert.equal(a.status,expected,`${problem.id}: ${a.raw}`);
  assert.equal(a.attempts,beforeA+1);assert.equal(b.attempts,beforeB+1);gradingPairs++;
}try{
 if(mathjaxFixture){fs.mkdirSync(root+'work',{recursive:true});fixtureDir=fs.mkdtempSync(root+'work/batch1-render-');for(const folder of ['mathjax','mathjax-newcm'])fs.cpSync(path.join(mathjaxFixture,folder),path.join(fixtureDir,folder),{recursive:true});fixtureBase=base+'/work/'+path.basename(fixtureDir);}
 server=spawn('python3',['-m','http.server',new URL(base).port,'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await page(),legacy=await page({mode:'legacy'});await ready(p);const reps=findReps(rule);
 for(const [family,problem]of (process.env.INTERACTIONS_ONLY?[]:reps))await test(family+': actual correct/wrong grading matches legacy',async()=>{
  await parity(p,legacy,problem,batchmathToLatex(problem.answerExpr).latex,problem.answerExpr,'Correct.');
  await parity(p,legacy,problem,batchmathToLatex(problem.answerExpr+'+12345').latex,problem.answerExpr+'+12345','Not quite.');
 });
 if(rule==='quotient')await test('qa8 displayed answer and wrong squared-exponent denominator through actual editors',async()=>{
  const problem=reps.get('qa8'),[,a,b,k]=problem.id.split('-');
  const expected=`(${a}/(${a}*x+${b})-${k}*ln(${a}*x+${b}))*e^(-${k}*x)`;
  await parity(p,legacy,problem,problem.answerTex,expected,'Correct.');
  const wrong=`(${a}/(${a}*x+${b})-${k}*ln(${a}*x+${b}))/e^((${k}*x)^2-${k}*x)`;
  await parity(p,legacy,problem,batchmathToLatex(wrong).latex,wrong,'Not quite.');
 });
 await test('basic simplification gate, advanced equivalence and incomplete answer policy',async()=>{
  for(const problem of [reps.get(rule==='product'?'pb1':'qb-poly'),reps.get(rule==='product'?'pa1':'qa1')]){const raw=`(${problem.answerExpr})+0`;await parity(p,legacy,problem,batchmathToLatex(raw).latex,raw,problem.id.startsWith('pb')?'Equivalent, but distribute and combine like terms to simplify completely.':'Correct.');await parity(p,legacy,problem,'\\frac{1}{}','(1)/()','Not quite.');}
 });
 await test('every required function button is editable and serialized',async()=>{
  await p.evaluate(()=>ruleQA.makeProblem());await legacy.evaluate(()=>ruleQA.makeProblem());
  for(const editor of [p,legacy]){await key(editor,'Clear');await key(editor,'0');await key(editor,'.');await key(editor,'5');assert.equal((await state(editor)).raw,'0.5');}
  for(const [label,raw]of [['sin','sin'],['cos','cos'],['tan','tan'],['sec','sec'],['csc','csc'],['cot','cot'],['ln','ln'],['log','log'],['sin⁻¹','asin'],['cos⁻¹','acos'],['tan⁻¹','atan'],['cot⁻¹','acot'],['sec⁻¹','asec'],['csc⁻¹','acsc']]){await key(p,'Clear');await key(p,label);await key(p,'x');await key(p,'→');assert.equal((await state(p)).raw,raw+'(x)');}
 });
 await test('physical input, nested fractions, cursor deletion, undo/redo, Enter and reset',async()=>{
  await p.evaluate(()=>ruleQA.makeProblem());await p.keyboard.type('3/4');await p.keyboard.press('ArrowRight');await p.keyboard.type('+x');assert.ok((await state(p)).raw.includes('4'));
  await p.keyboard.press('Control+z');await p.keyboard.press('Control+Shift+z');await set(p,'\\frac{x^{-2}}{\\frac{1}{x+1}}');const raw=(await state(p)).raw;assert.ok(raw.includes('x+1'));await p.keyboard.press('Control+a');await p.keyboard.press('Backspace');assert.equal((await state(p)).raw,'');
  const problem=reps.get(rule==='product'?'pa1':'qa1');await load(p,problem);await set(p,batchmathToLatex(problem.answerExpr).latex);const before=(await state(p)).attempts;await p.keyboard.press('Enter');assert.equal((await state(p)).status,'Correct.');assert.equal((await state(p)).attempts,before+1);await p.keyboard.press('Enter');assert.equal((await state(p)).raw,'');await p.keyboard.press('Control+z');assert.equal((await state(p)).raw,'');
 });
 await test('narrow layout and current answer survive runtime failure',async()=>{
  await p.setViewportSize({width:375,height:1000});await set(p,'\\arcsin(x)+\\frac{x^2}{1+x}');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:output+rule+'-375.png',fullPage:true});const raw=(await state(p)).raw;await p.evaluate(()=>document.querySelector('math-field').executeCommand=()=>{throw Error('Injected');});await key(p,'←');assert.equal(await p.locator('math-field').count(),0);assert.equal((await state(p)).raw,raw);
 });
 await test('uninstrumented default and missing runtime fallback',async()=>{
  const q=await page({instrumented:false});await ready(q);await q.keyboard.type('12345');await q.keyboard.press('Enter');assert.equal(await q.locator('#feedback .status').textContent(),'Not quite.');await q.close();
  const f=await page({routes:[['**/vendor/mathlive/mathlive.min.mjs',r=>r.abort()]]});await f.waitForSelector('.bm-mathlive-notice');assert.equal(await f.locator('.bm-calc-editor:visible').count(),1);await f.close();
 });
 await p.close();await legacy.close();
}finally{
 fs.writeFileSync(output+(process.env.INTERACTIONS_ONLY?rule+'-current-profile-browser.json':rule+'-browser.json'),JSON.stringify({browser:browser?.version(),results,pageErrors:errors,gradingPairs},null,2));await browser?.close();server?.kill();if(fixtureDir)fs.rmSync(fixtureDir,{recursive:true,force:true});
}
console.log(`${results.filter(x=>x.passed).length}/${results.length}; ${gradingPairs} pairs; ${errors.length} page errors`);if(results.some(x=>!x.passed)||errors.length)process.exitCode=1;
