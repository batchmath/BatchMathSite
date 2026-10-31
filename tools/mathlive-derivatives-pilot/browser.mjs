import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {root,target,instrument,representatives,modes} from './engine.mjs';
import {parseInput,batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
import {enterWithKeypad} from '../mathlive-power-rule/keypad-entry.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=process.env.CHAIN_PILOT_URL||'http://127.0.0.1:8139';
const output=root+'tools/mathlive-derivatives-pilot/artifacts/';fs.mkdirSync(output,{recursive:true});
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
const state=async p=>{await p.waitForTimeout(35);return p.evaluate(()=>({raw:document.getElementById('answer').value,latex:document.querySelector('math-field')?.value,attempts:chainQA.attempts,correct:chainQA.correct,current:chainQA.current,status:document.querySelector('#feedback .status')?.textContent,feedback:document.getElementById('feedback').innerHTML,count:BatchMathRepro.problemCount}));};
const set=(p,latex)=>p.evaluate(latex=>{const mf=document.querySelector('math-field');mf.setValue(latex,{silenceNotifications:true});mf.dispatchEvent(new Event('input',{bubbles:true}));},latex);
const key=(p,label)=>p.locator('.bm-calc-keypad:visible button').filter({hasText:new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).click();
const load=(p,problem)=>p.evaluate(problem=>{chainQA.current={...problem,answered:false};document.getElementById('question').innerHTML=problem.q;document.getElementById('feedback').innerHTML='';document.getElementById('answer').value='';document.getElementById('answer').disabled=false;document.getElementById('submit').disabled=false;document.getElementById('next').style.display='none';BatchMathCalculusKeypad.reset();BatchMathCalculusKeypad.focus();},problem);
async function parity(p,legacy,problem,latex,raw,expected){
  for(const editor of [p,legacy])await load(editor,problem);
  await set(p,latex);await legacy.evaluate(raw=>BatchMathCalculusKeypad.setRaw(raw),raw);
  const beforeA=(await state(p)).attempts,beforeB=(await state(legacy)).attempts;
  await p.locator('#submit').click();await legacy.locator('#submit').click();
  const a=await state(p),b=await state(legacy);assert.equal(a.status,b.status,`${problem.id}: ${a.raw}`);
  if(expected)assert.equal(a.status,expected,`${problem.id}: ${a.raw}`);
  assert.equal(a.attempts,beforeA+1);assert.equal(b.attempts,beforeB+1);gradingPairs++;
}
try{
  if(mathjaxFixture){
    fs.mkdirSync(root+'work',{recursive:true});fixtureDir=fs.mkdtempSync(root+'work/qa-chain-mathjax-');
    for(const folder of ['mathjax','mathjax-newcm'])fs.cpSync(path.join(mathjaxFixture,folder),path.join(fixtureDir,folder),{recursive:true});
    fixtureBase=base+'/work/'+path.basename(fixtureDir);
  }
  if(!process.env.CHAIN_PILOT_URL){server=spawn(process.env.PYTHON||'python3',['-m','http.server','8139','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}}
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
  const p=await page();await ready(p);const legacy=await page({mode:'legacy'}),reps=representatives();
  await test('default and explicit legacy modes use one visible editor/keypad; all 20 local fonts load',async()=>{
    assert.equal(await p.locator('math-field:visible').count(),1);assert.equal(await p.locator('.bm-calc-keypad:visible').count(),1);assert.equal(await legacy.locator('math-field').count(),0);
    assert.equal(await p.evaluate(()=>[...document.fonts].filter(f=>f.family.startsWith('KaTeX_')&&f.status==='loaded').length),20);
    assert.equal(await p.evaluate(()=>MathfieldElement.computeEngine==null),true);
    assert.deepEqual(await p.locator('.bm-calc-keypad:visible button').allTextContents(),await legacy.locator('.bm-calc-keypad:visible button').allTextContents());
    assert.equal(await p.locator('math-field').evaluate(m=>m.mathVirtualKeyboardPolicy),'manual');
  });
  if(mathjaxFixture)await test('real MathJax renders the actual Chain Rule question and worked feedback',async()=>{
    await p.waitForSelector('#question mjx-container');await set(p,'12345');await p.locator('#submit').click();await p.waitForSelector('#feedback mjx-container');
  });
  for(const mode of modes)await test(`actual selector ${mode}: correct, wrong, unsimplified and incomplete grading matches legacy`,async()=>{
    await p.selectOption('#chain-mode',mode);const problem=(await state(p)).current;
    await parity(p,legacy,problem,problem.answerTex,problem.answerExpr,'Correct.');
    await parity(p,legacy,problem,problem.answerTex+'+12345',problem.answerExpr+'+12345','Not quite.');
    const unsimplified=`(${problem.answerExpr})+0`;
    await parity(p,legacy,problem,batchmathToLatex(unsimplified).latex,unsimplified,'Correct.');
    assert.ok((await state(p)).raw.endsWith('+0'));
    await parity(p,legacy,problem,'\\frac{1}{}','(1)/()','Not quite.');
  });
  await test('every one of the 51 actual Chain Rule generator families grades correctly through both editor paths',async()=>{
    assert.equal(reps.length,51);
    for(const {problem} of reps)await parity(p,legacy,problem,problem.answerTex,problem.answerExpr,'Correct.');
  });
  await test('complete answers using only keypad clicks: compositions, trig powers, exponentials, sec/csc, product and quotient',async()=>{
    const names=['csj1','csj2','csj3','csj-cube','cmj2','cmj4','coj-prod-sec-poly','coj-quot-csc-poly'];
    for(const family of names){
      const problem=reps.find(x=>x.family===family).problem;
      for(const editor of [p,legacy]){
        await load(editor,problem);const tree=parseInput(problem.answerTex,'latex');assert.equal(tree.status,'complete');await enterWithKeypad(editor,tree.tree);
        const entered=await state(editor);assert.equal(await editor.evaluate(expected=>chainQA.equivalent(document.getElementById('answer').value,expected,['x']),problem.answerExpr),true,`${problem.id}: ${entered.raw}`);
        await key(editor,'Check');assert.equal((await state(editor)).status,'Correct.');
      }
    }
  });
  await test('all necessary function keys insert the intended call; irrelevant inverse trig/pi keys are absent',async()=>{
    await p.evaluate(()=>chainQA.makeProblem());
    for(const fn of ['sin','cos','tan','sec','csc','cot','ln','√']){
      await key(p,'Clear');await key(p,fn);await key(p,'2');await key(p,'→');assert.equal((await state(p)).raw,(fn==='√'?'sqrt':fn)+'(2)');
    }
    const labels=await p.locator('.bm-calc-keypad:visible button').allTextContents();assert.ok(labels.includes('e'));assert.ok(!labels.includes('π'));assert.ok(!labels.some(x=>x.includes('⁻¹')));
  });
  await test('alternate cube-root answer notation retains meaning for an actual generated question',async()=>{
    const problem=reps.find(x=>x.family==='csj-cube').problem;
    const [, ,k,c]=problem.id.split('-');const latex=`\\frac{${2*Number(k)}x}{3\\sqrt[3]{(${k}x^2+${c})^2}}`;
    await parity(p,legacy,problem,latex,problem.answerExpr,'Correct.');
  });
  await test('missing inner derivative factor stays wrong in an actual sine-composition question',async()=>{
    const problem=reps.find(x=>x.family==='csj2').problem;
    // Use the actual parse tree to remove the first factor, preserving the
    // generated signed coefficients instead of splitting minus-delimited IDs.
    const parsed=parseInput(problem.answerExpr).tree;const wrong=parsed.right;
    const {toLatex}=await import('../../assets/mathlive/answer-adapter.mjs');const latex=toLatex(wrong);
    const raw=await p.evaluate(async latex=>(await import('/assets/mathlive/answer-adapter.mjs')).translateDerivative(latex).input,latex);
    await parity(p,legacy,problem,latex,raw,'Not quite.');
  });
  await test('blank is non-consuming; unsupported cannot submit a previous valid answer',async()=>{
    await p.evaluate(()=>chainQA.makeProblem());const before=(await state(p)).attempts;await p.keyboard.press('Enter');assert.equal((await state(p)).attempts,before);assert.match((await state(p)).feedback,/Enter an answer first/);
    await set(p,(await state(p)).current.answerTex);await set(p,'\\int x');assert.equal((await state(p)).raw,'?');await p.locator('#submit').click();assert.equal((await state(p)).status,'Not quite.');
  });
  await test('first-key focus, native slash, fraction movement, exponent exit and nested insertion',async()=>{
    await p.evaluate(()=>chainQA.makeProblem());await p.keyboard.type('3/4');assert.match((await state(p)).latex,/\\frac/);await p.keyboard.press('ArrowRight');await p.keyboard.type('+x');await p.keyboard.press('Shift+6');await p.keyboard.type('2');await p.keyboard.press('ArrowRight');await p.keyboard.type('+1');assert.ok((await state(p)).raw.endsWith('+x^2+1'));
    await key(p,'Clear');await p.locator('.bm-calc-keypad:visible [aria-label="Insert stacked fraction"]').click();await key(p,'1');await key(p,'↓');await p.locator('.bm-calc-keypad:visible [aria-label="Insert stacked fraction"]').click();await key(p,'2');await key(p,'↓');await key(p,'x');
    assert.ok(await p.evaluate(()=>chainQA.equivalent(document.getElementById('answer').value,'1/(2/x)',['x'])));
  });
  await test('selection, structural deletion, cursor movement, undo and redo',async()=>{
    await key(p,'Clear');await p.keyboard.type('12');await p.keyboard.press('ArrowLeft');await p.keyboard.press('Delete');assert.equal((await state(p)).raw,'1');
    await p.keyboard.press('Control+a');await p.keyboard.press('Backspace');assert.equal((await state(p)).raw,'');
    await p.keyboard.type('3/4');await p.keyboard.press('Control+z');assert.ok(!(await state(p)).raw.includes('4'));await p.keyboard.press('Control+Shift+z');assert.ok((await state(p)).raw.includes('4'));
    await p.keyboard.press('Control+a');await p.keyboard.press('Backspace');assert.equal((await state(p)).raw,'');
  });
  await test('native copy/paste and legacy structured clipboard preserve nested content',async()=>{
    await set(p,'\\frac{3}{\\sqrt{x}}');await p.locator('math-field').click();await p.keyboard.press('Control+a');await p.keyboard.press('Control+c');const text=await p.evaluate(()=>navigator.clipboard.readText());assert.ok(text.includes('3'));
    await key(p,'Clear');await p.keyboard.press('Control+v');await p.waitForTimeout(100);assert.ok(await p.evaluate(()=>chainQA.equivalent(document.getElementById('answer').value,'3/sqrt(x)',['x'])));
    await key(p,'Clear');await p.evaluate(()=>{const data=new DataTransfer();data.setData('application/x-batchmath-expression',JSON.stringify({raw:'\uE0001\uE001x\uE002'}));document.querySelector('math-field').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));});assert.equal((await state(p)).raw,'(1)/(x)');
  });
  await test('one Enter action, held-key protection, blur/change isolation, reset focus and no stale history across consecutive questions',async()=>{
    for(let i=0;i<3;i++){
      await p.evaluate(()=>chainQA.makeProblem());await p.keyboard.type('12345');const before=await state(p);
      await p.evaluate(()=>document.querySelector('math-field').dispatchEvent(new Event('change',{bubbles:true})));await p.locator('.page-title').click();assert.equal((await state(p)).attempts,before.attempts);
      await p.locator('math-field').click();await p.keyboard.down('Enter');await p.keyboard.down('Enter');await p.keyboard.up('Enter');assert.equal((await state(p)).attempts,before.attempts+1);assert.equal((await state(p)).count,before.count);
      await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>document.activeElement.id),'next');
      await p.keyboard.down('Enter');await p.keyboard.down('Enter');await p.keyboard.up('Enter');assert.equal((await state(p)).count,before.count+1);assert.equal((await state(p)).raw,'');
      await p.keyboard.press('Control+z');assert.equal((await state(p)).latex.trim(),'');await p.keyboard.type('x');assert.equal((await state(p)).raw,'x');
    }
    await p.evaluate(()=>chainQA.makeProblem());await p.keyboard.type('x');assert.equal((await state(p)).raw,'x');await p.keyboard.press('Control+z');assert.equal((await state(p)).raw,'');
  });
  await test('Practice Type changes reset the field and preserve the actual available family pools',async()=>{
    for(const mode of modes){await p.selectOption('#chain-mode',mode);await p.keyboard.type('9');assert.equal((await state(p)).raw,'9');await p.selectOption('#chain-mode',mode==='simple'?'multiple':'simple');assert.equal((await state(p)).raw,'');}
    assert.deepEqual(await p.locator('#chain-mode option').evaluateAll(x=>x.map(e=>e.value)),modes);assert.equal(await p.locator('input[data-bm-calc-keypad]').count(),1);
  });
  for(const width of [375,1600])await test(`long nested expression and keypad layout at ${width}px`,async()=>{
    await p.setViewportSize({width,height:1100});await p.selectOption('#chain-mode','all');await p.evaluate(()=>chainQA.makeProblem());await set(p,Array(30).fill('\\frac{\\sin(x^2)}{\\sqrt{e^{3x}+2}}').join('+'));
    const dims=await p.evaluate(()=>({page:document.documentElement.scrollWidth,view:innerWidth,right:document.querySelector('math-field').getBoundingClientRect().right}));assert.ok(dims.page<=width+1&&dims.right<=width,JSON.stringify(dims));await p.screenshot({path:output+`chain-rule-${width}.png`,fullPage:true});
  });
  await p.close();await legacy.close();
  await test('explicit MathLive mode works on the uninstrumented actual page',async()=>{const q=await page({mode:'mathlive',instrumented:false});await ready(q);await q.keyboard.type('12345');await q.keyboard.press('Enter');assert.match(await q.locator('#feedback').textContent(),/Not quite/);await q.close();});
  for(const asset of ['runtime','fonts','stylesheet'])await test(`missing ${asset} preserves a usable legacy answer`,async()=>{
    const glob=asset==='runtime'?'**/vendor/mathlive/mathlive.min.mjs':asset==='fonts'?'**/vendor/mathlive/fonts/*':'**/assets/mathlive/pilot.css';
    const q=await page({routes:[[glob,async r=>{if(asset!=='stylesheet')await new Promise(resolve=>setTimeout(resolve,750));await r.abort();}]]});
    await q.locator('.bm-calc-editor:visible').click();await q.keyboard.type('7x');await q.waitForFunction(()=>document.getElementById('answer').dataset.editor==='legacy');assert.equal((await state(q)).raw,'7x');await q.locator('#submit').click();assert.equal((await state(q)).status,'Not quite.');await q.close();
  });
  await test('late successful startup imports a legacy answer, and refuses unsupported import without losing it',async()=>{
    for(const raw of ['6x','x??']){
      const q=await page({routes:[['**/vendor/mathlive/mathlive.min.mjs',async r=>{await new Promise(resolve=>setTimeout(resolve,750));await r.continue();}]]});
      await q.evaluate(raw=>BatchMathCalculusKeypad.setRaw(raw),raw);
      await q.waitForFunction(expected=>document.getElementById('answer').dataset.editor===expected,raw==='6x'?'mathlive':'legacy');assert.equal((await state(q)).raw,raw);await q.close();
    }
  });
  await test('runtime command failure restores current nested answer into the real legacy editor',async()=>{
    const q=await page();await ready(q);await set(q,'\\frac{\\sin(x^2)}{e^x}');const raw=(await state(q)).raw;
    await q.evaluate(()=>{document.querySelector('math-field').executeCommand=()=>{throw Error('Injected runtime failure');};});await key(q,'←');assert.equal(await q.locator('math-field').count(),0);assert.equal((await state(q)).raw,raw);await q.keyboard.type('+1');await q.keyboard.press('Enter');assert.equal((await state(q)).status,'Not quite.');await q.close();
  });
  await test('unsupported MathLive input is retained exactly in a recovery copy on runtime failure',async()=>{
    const q=await page();await ready(q);await set(q,'\\int x');const latex=(await state(q)).latex;await q.evaluate(()=>window.dispatchEvent(new ErrorEvent('error',{filename:location.origin+'/assets/mathlive/vendor/mathlive/mathlive.min.mjs',message:'Injected error'})));assert.equal(await q.locator('.bm-mathlive-recovery').inputValue(),latex);await q.close();
  });
  await test('unrelated Quotient Rule uses only its existing editor even with the pilot query parameter',async()=>{
    const q=await browser.newPage({serviceWorkers:'block'});const requests=[];q.on('request',r=>requests.push(r.url()));await q.route('https://**/*',r=>r.abort());await q.goto(base+'/ap-calculus/unit-2-derivatives/topics/the-quotient-rule/practice/?editor=mathlive');await q.waitForSelector('.bm-calc-editor');assert.equal(await q.locator('math-field').count(),0);assert.equal(requests.some(x=>x.includes('/assets/mathlive/')),false);await q.close();
  });
}finally{
  fs.writeFileSync(output+'browser-results.json',JSON.stringify({browser:browser?.version(),mathjax:!!mathjaxFixture,gradingPairs,results,pageErrors:errors},null,2)+'\n');
  await browser?.close();server?.kill();if(fixtureDir)fs.rmSync(fixtureDir,{recursive:true,force:true});
}
console.log(`${results.filter(x=>x.passed).length}/${results.length} Chain Rule browser checks passed; ${gradingPairs} paired grading submissions`);
if(results.some(x=>!x.passed)||errors.length)process.exitCode=1;
