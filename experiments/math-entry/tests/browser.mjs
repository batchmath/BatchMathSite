import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {fixtures} from '../fixtures.mjs';
import {root} from './checkers.mjs';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const artifact=path.join(root,'experiments/math-entry/test-artifacts');fs.mkdirSync(artifact,{recursive:true});
const base=process.env.ENTRY_LAB_URL||'http://127.0.0.1:8137';
let server,browser;
const results=[],errors=[],badResponses=[],external=[],consoleWarnings=[],measurements={};
async function test(label,fn){try{await fn();results.push({test:label,passed:true});console.log('PASS',label);}catch(e){results.push({test:label,passed:false,error:e.message});console.log('FAIL',label,e.message);}}
try {
  if(!process.env.ENTRY_LAB_URL){server=spawn(process.env.PYTHON||'python3',['-m','http.server','8137','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}}
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1600,height:1100}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning')consoleWarnings.push(m.text());});
  page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))external.push(r.url());});
  page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url()});});
  await page.goto(base+'/experiments/math-entry/');
  const frames={};for(const option of ['A','B','C']){const handle=await page.locator('#frame-'+option).elementHandle();frames[option]=await handle.contentFrame();await frames[option].waitForFunction(()=>window.entryLab?.getState().ready&&window.entryLab.getState().fields.length===2);}
  const state=frame=>frame.evaluate(()=>window.entryLab.getState());
  const load=async(id,option)=>{for(const name of option?[option]:['A','B','C'])await frames[name].evaluate(id=>window.entryLab.loadFixture(id),id);};
  const key=async(frame,label)=>frame.getByRole('button',{name:label,exact:true}).last().click();
  await test('Actual MathLive 0.111.1 and unchanged BatchMath editor loaded',async()=>{
    assert.ok(await frames.C.locator('math-field').count());assert.ok(await frames.A.locator('.bm-calc-dynamic-editor').count());
    assert.equal(await frames.C.evaluate(()=>window.MathfieldElement?.computeEngine==null),true);
    const labels=await frames.A.locator('#keypad-host button').allTextContents();assert.deepEqual(await frames.C.locator('#keypad-host button').allTextContents(),labels);
  });
  await test('MathJax renders a visibly stacked fraction with its layout stylesheet',async()=>{
    await frames.B.waitForSelector('.math-preview mjx-container',{timeout:20000});await frames.B.waitForFunction(()=>document.getElementById('lab-mathjax-styles'));
    const geometry=await frames.B.locator('.math-preview').first().evaluate(node=>{const n=node.querySelector('mjx-num')?.getBoundingClientRect(),d=node.querySelector('mjx-den')?.getBoundingClientRect();return{numeratorTop:n?.top,denominatorTop:d?.top};});assert.ok(geometry.denominatorTop>geometry.numeratorTop+5,JSON.stringify(geometry));
  });
  await test('All 20 MathLive font faces load without a false warning',async()=>{
    await frames.C.waitForFunction(()=>[...document.fonts].filter(f=>f.family.startsWith('KaTeX_')&&f.status==='loaded').length===20);await page.waitForTimeout(100);assert.equal(await frames.C.locator('#font-warning').isVisible(),false);
  });
  for(const fixture of fixtures)await test('All three fixture/checker results: '+fixture.id,async()=>{
    await load(fixture.id);const statuses=[];
    for(const name of ['A','B','C']){await frames[name].locator('#check').click();statuses.push((await state(frames[name])).outcomes.map(x=>x.status));}
    assert.deepEqual(statuses[1],statuses[0]);assert.deepEqual(statuses[2],statuses[0]);
    const expected=fixture.id.startsWith('incomplete')?'incomplete':fixture.id==='unsimplified'?'unsimplified':['pair','geometric'].includes(fixture.id)?'unsupported':'correct';
    assert.ok(statuses[0].every(s=>s===expected),JSON.stringify(statuses));
  });
  for(const option of ['A','B','C']) {
    const frame=frames[option];
    await test(option+' physical typing, smart slash, selection, undo/redo, deletion',async()=>{
      await load('fraction',option);const scratch=option==='C'?frame.locator('math-field').nth(1):frame.locator('.bm-calc-editor').nth(1);
      await scratch.click();await page.keyboard.type('3');await page.keyboard.press('/');await page.keyboard.type('4');
      let data=await state(frame);assert.ok(data.fields[1].input?.includes('3')&&data.fields[1].input?.includes('4'),JSON.stringify(data.fields[1]));
      assert.equal(data.fields[0].input,option==='C'?'(3)/(4)':'(3)/(4)');
      await frame.locator('#undo').click();data=await state(frame);assert.ok(!data.fields[1].input?.includes('4'));
      await frame.locator('#redo').click();data=await state(frame);assert.ok(data.fields[1].input?.includes('4'));
      await scratch.click();await page.keyboard.press('Control+a');await page.keyboard.press('Backspace');assert.equal((await state(frame)).fields[1].status,'incomplete');
      await page.keyboard.type('12');await page.keyboard.press('ArrowLeft');await page.keyboard.press('Delete');assert.ok((await state(frame)).fields[1].input?.includes('1'));
    });
    await test(option+' keypad targets the selected field; nested fraction/exponent/root insertion',async()=>{
      await load('fraction',option);const scratch=option==='C'?frame.locator('math-field').nth(1):frame.locator('.bm-calc-editor').nth(1);await scratch.click();
      await key(frame,'Clear answer');await key(frame,'Insert stacked fraction');await key(frame,'2');await key(frame,'Insert exponent');await key(frame,'Insert stacked fraction');await key(frame,'1');
      const data=await state(frame);assert.equal(data.fields[0].input,'(3)/(4)');assert.equal(data.fields[1].status,'incomplete');
      await key(frame,'Clear answer');await key(frame,'Insert nth root; enter the index, then move right to enter the radicand');await key(frame,'3');await key(frame,'Move cursor right');await key(frame,'8');assert.ok((await state(frame)).fields[1].input?.includes('root(3,8)'),JSON.stringify((await state(frame)).fields[1]));
    });
    await test(option+' Enter submits once; blur does not submit; reset clears history',async()=>{
      await load('fraction',option);const editor=option==='C'?frame.locator('math-field').first():frame.locator('.bm-calc-editor').first();await editor.click();await page.keyboard.press('Enter');assert.equal((await state(frame)).submissionCount,1);
      await frame.locator('#diagnostic-details summary').click();assert.equal((await state(frame)).submissionCount,1);
      await frame.locator('#reset-pane').click();assert.equal((await state(frame)).submissionCount,0);await frame.locator('#undo').click();assert.equal((await state(frame)).fields[0].input,'(3)/(4)');
    });
    await test(option+' physical exponent and ChromeOS-shaped Shift+6 event',async()=>{
      await load('fraction',option);const scratch=option==='C'?frame.locator('math-field').nth(1):frame.locator('.bm-calc-editor').nth(1);await scratch.click();await page.keyboard.type('x');
      await scratch.dispatchEvent('keydown',{key:'Dead',code:'Digit6',shiftKey:true,bubbles:true,cancelable:true});await page.keyboard.type('2');await page.keyboard.press('ArrowRight');await page.keyboard.type('+1');
      const data=(await state(frame)).fields[1];assert.equal(data.status,'complete',JSON.stringify(data));assert.ok(data.input.includes('x^')&&data.input.includes('+1'),JSON.stringify(data));
    });
    await test(option+' partial keyboard selection and deletion',async()=>{
      await load('fraction',option);const scratch=option==='C'?frame.locator('math-field').nth(1):frame.locator('.bm-calc-editor').nth(1);await scratch.click();await page.keyboard.type('x+12');await page.keyboard.press('Shift+ArrowLeft');await page.keyboard.press('Shift+ArrowLeft');await page.keyboard.press('Backspace');await page.keyboard.type('3');assert.equal((await state(frame)).fields[1].input,'x+3');
    });
    await test(option+' structured clipboard import in the real browser DOM',async()=>{
      await load('fraction',option);await frame.evaluate(()=>{
        const board=new DataTransfer();board.setData('application/x-batchmath-expression',JSON.stringify({version:1,raw:'(x+1)/(sqrt(2))'}));board.setData('text/plain','(x+1)/(sqrt(2))');
        const target=document.querySelectorAll(document.querySelector('math-field')?'math-field':'.bm-calc-editor')[1];target.dispatchEvent(new ClipboardEvent('paste',{clipboardData:board,bubbles:true,cancelable:true}));
      });const data=(await state(frame)).fields[1];assert.equal(data.status,'complete');assert.equal(data.input,'(x+1)/(sqrt(2))');
    });
  }
  await test('C physical fraction inside exponent can be completed and exited',async()=>{
    await load('fraction','C');await frames.C.locator('math-field').nth(1).click();await page.keyboard.type('x');await page.keyboard.press('^');await page.keyboard.type('1');await page.keyboard.press('/');await page.keyboard.type('2');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.keyboard.type('+1');
    const field=(await state(frames.C)).fields[1];assert.equal(field.status,'complete',JSON.stringify(field));
    assert.equal(await frames.C.evaluate(raw=>BatchMathDerivativeExpressions.evaluate(BatchMathDerivativeExpressions.parse(raw),{x:9}),field.input),4);
  });
  await test('B warm live preview updates after physical typing',async()=>{
    await load('fraction','B');await frames.B.locator('.bm-calc-editor').nth(1).click();const start=Date.now();await page.keyboard.type('x^2');await frames.B.locator('.math-preview').nth(1).locator('mjx-msup').waitFor({timeout:1500});measurements.warmPreviewTypingToRenderedMs=Date.now()-start;
  });
  await test('Changing the parent example resets all three independently',async()=>{
    await page.locator('#example').selectOption('decimal');for(const f of Object.values(frames))await f.waitForFunction(()=>window.entryLab.getState().fixture==='decimal'&&window.entryLab.getState().fields[0].input==='1.250');
    await frames.C.locator('math-field').first().click();await page.keyboard.press('Control+a');await page.keyboard.type('9');assert.equal((await state(frames.A)).fields[0].input,'1.250');assert.equal((await state(frames.B)).fields[0].input,'1.250');
    await page.locator('#load').click();await frames.C.waitForFunction(()=>window.entryLab.getState().fields[0].input==='1.250');
  });
  await test('Long answers stay inside each pane at desktop and mobile widths',async()=>{
    await load('long');for(const viewport of [{width:1600,height:1100},{width:375,height:900}]){await page.setViewportSize(viewport);await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));for(const frame of Object.values(frames))assert.ok(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
    await page.screenshot({path:path.join(artifact,'mobile.png'),fullPage:true});await page.setViewportSize({width:1600,height:1100});
  });
  await test('No analytics, storage, service-worker registrations, or external network requests',async()=>{
    assert.deepEqual(external,[]);assert.deepEqual(badResponses,[]);
    for(const frame of Object.values(frames))assert.deepEqual(await frame.evaluate(async()=>({storage:localStorage.length,workers:(await navigator.serviceWorker.getRegistrations()).length})),{storage:0,workers:0});
  });
  await test('Unavailable MathLive runtime has an explicit fallback message; A/B still work',async()=>{
    const failed=await browser.newPage();await failed.route('**/vendor/mathlive/mathlive.min.mjs',r=>r.abort());await failed.goto(base+'/experiments/math-entry/');
    const candidate=await (await failed.locator('#frame-C').elementHandle()).contentFrame();await candidate.waitForSelector('#failure:not([hidden])');assert.match(await candidate.locator('#failure').textContent(),/Options A and B remain available/);
    for(const o of ['A','B']){const f=await (await failed.locator('#frame-'+o).elementHandle()).contentFrame();await f.waitForFunction(()=>window.entryLab?.getState().ready);await f.locator('#check').click();assert.equal((await state(f)).outcomes[0].status,'correct');}await failed.close();
  });
  await test('Unavailable MathLive fonts leave the controls available and do not grade partial loading as a success',async()=>{
    const failed=await browser.newPage();await failed.route('**/vendor/mathlive/fonts/**',r=>r.abort());await failed.goto(base+'/experiments/math-entry/editor.html?option=C');await failed.waitForFunction(()=>window.entryLab?.getState().ready);await failed.waitForSelector('#font-warning:not([hidden])');assert.equal(await failed.locator('#check').isEnabled(),true);await failed.close();
  });
  await test('No uncaught errors in the normal browser session',async()=>assert.deepEqual(errors,[]));
  await page.locator('#example').selectOption('fraction');await page.locator('#load').click();for(const f of Object.values(frames)){await f.locator('#diagnostic-details').evaluate(e=>e.open=false);await f.waitForFunction(()=>window.entryLab.getState().fixture==='fraction');}await page.waitForTimeout(500);await page.screenshot({path:path.join(artifact,'desktop.png'),fullPage:true});
  const report={browser:await browser.version(),device:'Linux headless Chromium; no actual Chromebook/tablet/assistive technology validation',passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,results,errors,badResponses,external,consoleWarnings,measurements};
  fs.writeFileSync(path.join(artifact,'browser-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:report.failed,browser:report.browser}));if(report.failed)process.exitCode=1;
} finally {await browser?.close();server?.kill();}
