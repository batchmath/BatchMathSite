import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {root,target,instrument} from './engine.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=process.env.PILOT_URL||'http://127.0.0.1:8138';
const output=root+'tools/mathlive-power-rule/artifacts/';fs.mkdirSync(output,{recursive:true});
const mathjaxFixture=process.env.MATHJAX_FIXTURE_ROOT;
const results=[],pageErrors=[];let browser,server,fixtureDir,fixtureBase;
async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name);}catch(e){results.push({name,passed:false,error:e.stack});console.log('FAIL',name,e.message);}}
async function page({mode='',seed='pilot',routes=[],instrumented=true}={}) {
  const p=await browser.newPage({viewport:{width:1600,height:1100},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});
  p.on('pageerror',e=>pageErrors.push(e.message));
  // Isolate external analytics/CDN availability from editor testing. The normal
  // page's MathJax boot has an existing load-event fallback. No math is mocked.
  await p.route('https://**/*',r=>r.abort());
  if(mathjaxFixture){
    // Optional cached *real* MathJax 4.1.3 and NewCM font files. Only CDN
    // transport is replaced; typesetting, engine boot and feedback remain real.
    await p.route('https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js',r=>r.fulfill({contentType:'text/javascript',body:
      `MathJax.loader={paths:{mathjax:'${fixtureBase}/mathjax','mathjax-newcm':'${fixtureBase}/mathjax-newcm'}};MathJax.chtml.fontURL='${fixtureBase}/mathjax-newcm/chtml/woff2';MathJax.output={font:'mathjax-newcm'};\n`+
      fs.readFileSync(mathjaxFixture+'/mathjax/tex-chtml.js','utf8')}));
  }
  if(instrumented)await p.route('**/'+target.replace('index.html','')+'?*',async route=>{
    const response=await route.fetch();await route.fulfill({response,body:instrument(await response.text())});
  });
  for(const [glob,fn] of routes)await p.route(glob,fn);
  await p.goto(`${base}/${target.replace('index.html','')}?bm_seed=${seed}${mode?'&editor='+mode:''}`);
  await p.waitForFunction(()=>document.querySelector('#question').textContent.trim());
  return p;
}
const ready=p=>p.waitForFunction(()=>document.getElementById('answer').dataset.editor==='mathlive');
// MathLive batches input notifications; wait for that notification when reading
// the source mirror. Submission tests deliberately do not wait before Enter.
const state=async p=>{await p.waitForTimeout(35);return p.evaluate(()=>({raw:document.getElementById('answer').value,latex:document.querySelector('math-field')?.value,attempts:powerQA.attempts,correct:powerQA.correct,current:powerQA.current,status:document.querySelector('#feedback .status')?.textContent,feedback:document.getElementById('feedback').innerHTML,count:window.BatchMathRepro.problemCount,focus:document.activeElement.tagName}));};
const set=async(p,latex)=>p.evaluate(latex=>{const mf=document.querySelector('math-field');mf.setValue(latex,{silenceNotifications:true});mf.resetUndo();mf.dispatchEvent(new Event('input',{bubbles:true}));},latex);
const clear=async p=>set(p,'');
const key=(p,label)=>p.locator('[data-experimental-bridge] button').filter({hasText:new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).click();
try {
  if(mathjaxFixture){
    // A real same-origin endpoint serves worker importScripts(), which page
    // routes do not intercept. These scratch assets never ship with the pilot.
    fs.mkdirSync(root+'work',{recursive:true});fixtureDir=fs.mkdtempSync(root+'work/qa-mathjax-');
    for(const folder of ['mathjax','mathjax-newcm'])fs.cpSync(path.join(mathjaxFixture,folder),path.join(fixtureDir,folder),{recursive:true});
    fixtureBase=base+'/work/'+path.basename(fixtureDir);
  }
  if(!process.env.PILOT_URL){server=spawn(process.env.PYTHON||'python3',['-m','http.server','8138','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}}
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
  const p=await page();await ready(p);
  if(mathjaxFixture)await test('real MathJax renders the existing question and worked feedback alongside MathLive',async()=>{
    await p.waitForSelector('#question mjx-container');await set(p,'12345');await p.locator('#submit').click();await p.waitForSelector('#feedback mjx-container');await p.evaluate(()=>powerQA.makeProblem());
  });
  await test('default MathLive, 20 local fonts, no Compute Engine or duplicate keypad',async()=>{
    assert.equal(await p.locator('math-field:visible').count(),1);
    assert.equal(await p.locator('.bm-calc-keypad:visible').count(),1);
    assert.equal(await p.evaluate(()=>[...document.fonts].filter(f=>f.family.startsWith('KaTeX_')&&f.status==='loaded').length),20);
    assert.equal(await p.evaluate(()=>MathfieldElement.computeEngine==null),true);
    assert.deepEqual(await p.locator('[data-experimental-bridge] button').allTextContents(),await p.locator('.bm-calc-keypad:not([data-experimental-bridge]) button').allTextContents());
    assert.equal(await p.locator('math-field').evaluate(mf=>mf.mathVirtualKeyboardPolicy),'manual');
  });
  await test('first key reaches the field on a new question, without clicking',async()=>{
    await p.evaluate(()=>powerQA.makeProblem());await p.keyboard.type('7');assert.equal(await p.locator('math-field').evaluate(m=>m.value),'7');assert.equal((await state(p)).raw,'7');
  });
  await test('blank prompts without consuming an attempt',async()=>{
    await p.evaluate(()=>powerQA.makeProblem());const before=(await state(p)).attempts;await p.keyboard.press('Enter');assert.equal((await state(p)).attempts,before);assert.match((await state(p)).feedback,/Enter an answer first/);
  });
  const legacy=await page({mode:'legacy'});
  for(const order of ['first','higher'])for(const family of ['mixed','polynomial','negative','fractional','irrational']) {
    if(order==='higher'&&family==='irrational')continue;
    await test(`actual browser grading parity ${order}:${family}: correct, wrong, unsimplified, incomplete`,async()=>{
      for(const editor of [p,legacy])await editor.evaluate(({order,family})=>{
        document.getElementById('derivativeOrder').value=order;document.getElementById('powerType').value=family;powerQA.makeProblem();
      },{order,family});
      // Same actual generated problem for both editors; the function and
      // checker used below are the page's own unchanged closures.
      const problem=(await state(p)).current;
      for(const kind of ['tex','wrong','unsimplified','incomplete']) {
        for(const editor of [p,legacy])await editor.evaluate(problem=>{powerQA.current={...problem,answered:false};document.getElementById('answer').disabled=false;document.getElementById('submit').disabled=false;document.getElementById('next').style.display='none';},problem);
        let latex,raw;
        if(kind==='tex'){latex=problem.answerTex;raw=problem.answerExpr;}
        if(kind==='wrong'){latex=problem.answerTex+'+12345';raw=problem.answerExpr+'+12345';}
        if(kind==='unsimplified'){raw=`(${problem.answerExpr})+0`;latex=await p.evaluate(async raw=>(await import('/assets/mathlive/answer-adapter.mjs')).batchmathToLatex(raw).latex,raw);}
        if(kind==='incomplete'){latex='\\frac{1}{}';raw='(1)/()';}
        await set(p,latex);
        await legacy.evaluate(raw=>{BatchMathCalculusKeypad.setRaw(raw);},raw);
        await p.locator('#submit').click();await legacy.locator('#submit').click();
        const a=await state(p),b=await state(legacy);
        assert.equal(a.status,b.status,`${problem.id} ${kind}: ${a.raw}`);
        if(kind==='unsimplified')assert.ok(a.raw.endsWith('+0'),a.raw);
        assert.match(a.feedback,kind==='tex'||kind==='unsimplified'?/Correct\./:/Not quite/);
      }
    });
  }
  await test('45 more actual generated answerTex responses survive MathLive canonicalization',async()=>{
    for(const order of ['first','higher'])for(const family of ['mixed','polynomial','negative','fractional','irrational']){
      if(order==='higher'&&family==='irrational')continue;
      for(let i=0;i<5;i++){
        await p.evaluate(({order,family})=>{document.getElementById('derivativeOrder').value=order;document.getElementById('powerType').value=family;powerQA.makeProblem();},{order,family});
        const problem=(await state(p)).current;await set(p,problem.answerTex);await p.locator('#submit').click();
        assert.match((await state(p)).feedback,/Correct\./,`${problem.id}: ${(await state(p)).raw}`);
      }
    }
  });
  await test('native typing, slash capture, fraction navigation and keyboard undo/redo',async()=>{
    await p.evaluate(()=>powerQA.makeProblem());await p.keyboard.type('3/4');
    assert.match((await state(p)).raw,/3.*4/);assert.match((await state(p)).latex,/\\frac/);
    await p.keyboard.press('Control+z');assert.ok(!(await state(p)).raw.includes('4'));
    await p.keyboard.press('Control+Shift+z');assert.ok((await state(p)).raw.includes('4'));
    await p.keyboard.press('ArrowRight');await p.keyboard.type('+x');assert.ok((await state(p)).raw.endsWith('+x'));
  });
  await test('physical exponent, dead-key Shift+6 bridge and exponent exit',async()=>{
    await p.evaluate(()=>powerQA.makeProblem());await p.keyboard.type('x');await p.keyboard.press('Shift+6');await p.keyboard.type('2');await p.keyboard.press('ArrowRight');await p.keyboard.type('+1');
    const physical=await state(p);assert.equal(physical.raw,'x^2+1',JSON.stringify(physical));
    await clear(p);await p.keyboard.type('x');await p.locator('math-field').dispatchEvent('keydown',{key:'Dead',code:'Digit6',shiftKey:true});await p.keyboard.type('3');await p.keyboard.press('ArrowRight');await p.keyboard.type('+2');
    const dead=await state(p);assert.equal(dead.raw,'x^3+2',JSON.stringify(dead));
  });
  await test('question reset flushes native inline-shortcut snapshots as well as undo history',async()=>{
    await p.evaluate(()=>powerQA.makeProblem());await p.keyboard.type('3/4');await p.keyboard.press('ArrowRight');await p.keyboard.type('+x');
    await p.evaluate(()=>powerQA.makeProblem());await p.keyboard.type('x');assert.equal((await state(p)).raw,'x');
    await p.keyboard.press('Control+z');assert.equal((await state(p)).latex.trim(),'');assert.equal((await state(p)).raw,'');
  });
  await test('every existing keypad button is mapped and edits the real field',async()=>{
    await p.evaluate(()=>powerQA.makeProblem());
    const buttons=p.locator('[data-experimental-bridge] button');
    for(let i=0;i<await buttons.count();i++) {
      const label=(await buttons.nth(i).textContent()).trim();if(label==='Check')continue;
      await clear(p);await buttons.nth(i).click();
      assert.equal(await p.locator('math-field:visible').count(),1,`fallback on ${label}`);
    }
    await clear(p);await key(p,'2');await key(p,'x');await key(p,'xⁿ');await key(p,'3');
    assert.ok((await state(p)).raw.includes('2x^3'),(await state(p)).raw);
    await clear(p);await p.locator('[data-experimental-bridge] [aria-label="Insert stacked fraction"]').click();await key(p,'1');await key(p,'↓');await key(p,'2');
    assert.equal((await state(p)).raw,'(1)/(2)');
  });
  await test('nested fractions, fractional exponents, roots and supported functions retain structure',async()=>{
    for(const [latex,expected] of [['\\frac{1}{\\frac{2}{x}}','1/(2/x)'],['x^{\\frac{2}{3}}','x^(2/3)'],['\\sqrt{x}','sqrt(x)'],['\\sqrt[3]{x}','x^(1/3)'],['\\ln(x)+\\sin(x)','ln(x)+sin(x)']]){
      await set(p,latex);assert.equal(await p.evaluate(expected=>powerQA.equivalent(document.getElementById('answer').value,expected,['x']),expected),true,(await state(p)).raw);
    }
  });
  await test('structural selection, Backspace, Delete and cursor movement',async()=>{
    await clear(p);await p.locator('math-field').click();await p.keyboard.type('12');await p.keyboard.press('ArrowLeft');await p.keyboard.press('Delete');assert.equal((await state(p)).raw,'1');
    await p.keyboard.press('Control+a');await p.keyboard.press('Backspace');assert.equal((await state(p)).raw,'');
    await set(p,'\\frac{1}{2}');await p.keyboard.press('Control+a');await p.keyboard.press('Backspace');assert.equal((await state(p)).raw,'');
  });
  await test('native clipboard copy and paste plus ordinary LaTeX paste',async()=>{
    await set(p,'\\frac{3}{4}');await p.locator('math-field').click();await p.keyboard.press('Control+a');await p.keyboard.press('Control+c');
    const copied=await p.evaluate(()=>navigator.clipboard.readText());assert.ok(copied.includes('3')&&copied.includes('4'),copied);
    await clear(p);await p.keyboard.press('Control+v');await p.waitForTimeout(100);assert.equal((await state(p)).raw,'(3)/(4)');
    await clear(p);await p.evaluate(()=>navigator.clipboard.writeText('\\sqrt[3]{x}'));await p.keyboard.press('Control+v');await p.waitForTimeout(100);assert.ok((await state(p)).raw.includes('1'),(await state(p)).raw);
  });
  await test('legacy private structured clipboard imports without losing fraction slots',async()=>{
    await clear(p);await p.evaluate(()=>{const data=new DataTransfer();data.setData('application/x-batchmath-expression',JSON.stringify({raw:'\uE0003\uE0014\uE002'}));document.querySelector('math-field').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));});
    assert.equal((await state(p)).raw,'(3)/(4)');
  });
  await test('change and blur do not submit; Enter grades once; held Enter cannot skip feedback',async()=>{
    await p.evaluate(()=>powerQA.makeProblem());await set(p,'12345');const before=await state(p);
    await p.evaluate(()=>document.querySelector('math-field').dispatchEvent(new Event('change',{bubbles:true})));await p.locator('.page-title').click();assert.equal((await state(p)).attempts,before.attempts);
    await p.locator('math-field').click();await p.keyboard.down('Enter');await p.keyboard.down('Enter');await p.keyboard.down('Enter');await p.keyboard.up('Enter');
    let now=await state(p);assert.equal(now.attempts,before.attempts+1);assert.equal(now.count,before.count);assert.ok(now.feedback);
    await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>document.activeElement.id),'next');
    await p.keyboard.down('Enter');await p.keyboard.down('Enter');await p.keyboard.down('Enter');await p.keyboard.up('Enter');
    now=await state(p);assert.equal(now.count,before.count+1);assert.equal(now.attempts,before.attempts+1);assert.equal(now.raw,'');assert.equal(now.latex.trim(),'');
    await p.keyboard.press('Control+z');assert.equal((await state(p)).latex.trim(),'');await p.keyboard.type('9');assert.equal((await state(p)).raw,'9');
  });
  await test('keypad Check invokes one existing check; source and keypad disable after grading',async()=>{
    await p.evaluate(()=>powerQA.makeProblem());await set(p,'12345');const before=await state(p);await key(p,'Check');assert.equal((await state(p)).attempts,before.attempts+1);
    assert.equal(await p.locator('[data-experimental-bridge] button:enabled').count(),0);assert.equal(await p.locator('math-field').evaluate(m=>m.readOnly),true);
  });
  await test('immediate Enter synchronizes the final key before the unmodified checker reads it',async()=>{
    await p.evaluate(()=>{powerQA.makeProblem();powerQA.current={...powerQA.current,answerExpr:'7',answerTex:'7',vars:[],answered:false};});
    await p.keyboard.type('7');await p.keyboard.press('Enter');assert.match((await state(p)).feedback,/Correct\./);
  });
  await test('practice selections preserve higher-order restrictions and reset state',async()=>{
    await p.selectOption('#derivativeOrder','first');await p.selectOption('#powerType','irrational');await p.selectOption('#derivativeOrder','higher');
    assert.equal(await p.locator('#powerType').inputValue(),'mixed');assert.equal(await p.locator('#powerType option[value="irrational"]').evaluate(e=>e.disabled&&e.hidden),true);
    assert.match((await state(p)).current.id,/^pr-\w+-[234]-/);assert.equal((await state(p)).raw,'');
  });
  for(const width of [375,1600])await test(`responsive ${width}px and horizontal overflow`,async()=>{
    await p.setViewportSize({width,height:1100});await p.evaluate(()=>powerQA.makeProblem());await set(p,Array(60).fill('x^{2}').join('+'));
    const sizes=await p.evaluate(()=>{const m=document.querySelector('math-field'),r=m.getBoundingClientRect();return {page:document.documentElement.scrollWidth,view:innerWidth,right:r.right,left:r.left,width:r.width};});
    assert.ok(sizes.page<=width+1,JSON.stringify(sizes));assert.ok(sizes.right<=width&&sizes.left>=0,JSON.stringify(sizes));
    await p.screenshot({path:output+`power-rule-${width}.png`,fullPage:true});
  });
  await p.close();await legacy.close();
  await test('explicit mathlive mode and original HTML work without test instrumentation',async()=>{
    const q=await page({mode:'mathlive',instrumented:false});await ready(q);await q.keyboard.type('12345');await q.keyboard.press('Enter');assert.match(await q.locator('#feedback').textContent(),/Not quite/);await q.close();
  });
  await test('missing runtime: legacy remains usable and a pending answer survives',async()=>{
    const q=await page({routes:[['**/vendor/mathlive/mathlive.min.mjs',async r=>{await new Promise(resolve=>setTimeout(resolve,800));await r.abort();}]]});
    await q.locator('.bm-calc-editor').click();await q.keyboard.type('7x');
    await q.waitForFunction(()=>document.getElementById('answer').dataset.editor==='legacy');assert.equal((await state(q)).raw,'7x');await q.keyboard.press('Enter');assert.match((await state(q)).feedback,/Not quite/);await q.close();
  });
  await test('missing pilot stylesheet leaves a usable legacy editor',async()=>{
    const q=await page({routes:[['**/assets/mathlive/pilot.css',r=>r.abort()]]});await q.waitForFunction(()=>document.getElementById('answer').dataset.editor==='legacy');
    await q.locator('.bm-calc-editor').click();await q.keyboard.type('5x');assert.equal((await state(q)).raw,'5x');assert.equal(await q.locator('math-field').count(),0);await q.close();
  });
  await test('successful delayed initialization imports an answer typed into legacy during loading',async()=>{
    const q=await page({routes:[['**/vendor/mathlive/mathlive.min.mjs',async r=>{await new Promise(resolve=>setTimeout(resolve,800));await r.continue();}]]});
    await q.locator('.bm-calc-editor').click();await q.keyboard.type('6x');await ready(q);assert.equal((await state(q)).latex.replace(/\s/g,''),'6x');assert.equal((await state(q)).raw,'6x');await q.close();
  });
  await test('unsupported legacy syntax during startup is retained when import refuses it',async()=>{
    const q=await page({routes:[['**/vendor/mathlive/mathlive.min.mjs',async r=>{await new Promise(resolve=>setTimeout(resolve,800));await r.continue();}]]});
    await q.evaluate(()=>BatchMathCalculusKeypad.setRaw('x??'));await q.waitForFunction(()=>document.getElementById('answer').dataset.editor==='legacy');
    assert.equal((await state(q)).raw,'x??');assert.equal(await q.locator('.bm-calc-editor:visible').count(),1);await q.close();
  });
  await test('missing font: typed legacy answer survives and can be checked',async()=>{
    const q=await page({routes:[['**/vendor/mathlive/fonts/*',async r=>{await new Promise(resolve=>setTimeout(resolve,800));await r.abort();}]]});
    await q.locator('.bm-calc-editor').click();await q.keyboard.type('8x');await q.waitForFunction(()=>document.getElementById('answer').dataset.editor==='legacy');
    assert.equal((await state(q)).raw,'8x');assert.equal(await q.locator('math-field').count(),0);await q.locator('#submit').click();assert.match((await state(q)).feedback,/Not quite/);await q.close();
  });
  await test('runtime command exception restores the actual legacy editor with the current answer',async()=>{
    const q=await page();await ready(q);await set(q,'\\frac{3}{4}');await q.evaluate(()=>{document.querySelector('math-field').executeCommand=()=>{throw Error('Injected runtime failure');};});
    await key(q,'←');assert.equal(await q.locator('.bm-calc-editor:visible').count(),1);assert.equal((await state(q)).raw,'(3)/(4)');
    await q.keyboard.type('+2');assert.ok((await state(q)).raw.includes('2'));await q.keyboard.press('Enter');assert.match((await state(q)).feedback,/Not quite/);await q.close();
  });
  await test('unsupported LaTeX survives a library error as a selectable recovery copy',async()=>{
    const q=await page();await ready(q);await set(q,'\\int x');assert.equal((await state(q)).raw,'?');
    const original=(await state(q)).latex;await q.evaluate(()=>window.dispatchEvent(new ErrorEvent('error',{message:'Injected library failure',filename:location.origin+'/assets/mathlive/vendor/mathlive/mathlive.min.mjs'})));
    assert.equal(await q.locator('.bm-mathlive-recovery').inputValue(),original);assert.equal((await state(q)).raw,original);await q.close();
  });
  await test('unrelated Product Rule page loads only its existing editor and shared keypad',async()=>{
    const q=await browser.newPage({serviceWorkers:'block'});await q.route('https://**/*',r=>r.abort());const requests=[];q.on('request',r=>requests.push(r.url()));
    await q.goto(base+'/ap-calculus/unit-2-derivatives/topics/the-product-rule/practice/?editor=mathlive');await q.waitForSelector('.bm-calc-editor');assert.equal(await q.locator('math-field').count(),0);assert.equal(requests.some(url=>url.includes('/assets/mathlive/')),false);await q.close();
  });
} finally {
  fs.writeFileSync(output+'browser-results.json',JSON.stringify({browser:browser?.version(),mathjax:mathjaxFixture?'Real cached MathJax 4.1.3 + NewCM; CDN transport substituted':'External CDN blocked; engine load-event fallback',results,pageErrors},null,2)+'\n');
  await browser?.close();server?.kill();if(fixtureDir)fs.rmSync(fixtureDir,{recursive:true,force:true});
}
console.log(`${results.filter(r=>r.passed).length}/${results.length} browser checks passed`);
if(results.some(r=>!r.passed)||pageErrors.length)process.exitCode=1;
