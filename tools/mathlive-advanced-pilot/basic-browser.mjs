import assert from 'node:assert/strict';
import {runner,ready,field,key,set,state,load,submit,sameOutcome} from './browser-harness.mjs';
import {engine,slugs,rng} from './engine.mjs';
import {batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
const r=await runner('basic'),w=engine(),weights=w.BatchMathUnit4FinalFour.W.basic;
const families=Array.isArray(weights)?weights.map(x=>x[0]):Object.keys(weights);
try{
  const p=await r.open(),legacy=await r.open({editor:'legacy'});await ready(p);
  await r.test('default MathLive, local fonts, unchanged keypad and real question/feedback rendering',async()=>{
    assert.equal(await p.locator('math-field:visible').count(),1);assert.equal(await legacy.locator('math-field').count(),0);assert.equal(await p.locator('.bm-calc-keypad:visible').count(),1);
    assert.equal(await p.evaluate(()=>[...document.fonts].filter(f=>f.family.startsWith('KaTeX_')&&f.status==='loaded').length),20);
    assert.deepEqual(await p.locator('.bm-calc-keypad:visible button').allTextContents(),await legacy.locator('.bm-calc-keypad:visible button').allTextContents());
    if(r.fixtures)await p.waitForSelector('#question mjx-container');
  });
  for(const family of families)await r.test('actual grading parity '+family+': correct, wrong, unsimplified, missing C and incomplete',async()=>{
    w.BatchMathRNG={random:rng(37+family.length)};const problem=w.BatchMathAPTopicGenerators.get(slugs.basic)({family}),spec=problem.stage1.unit4Answer,raw=spec.expression+(spec.kind==='antiderivative'?'+C':'');
    const good=await sameOutcome(p,legacy,problem,problem.stage1.answerTex,raw);assert.match(good.result,/good/);
    for(const v of [`(${spec.expression})+${spec.kind==='antiderivative'?'x+C':'1'}`,`(${raw})+0`,'(1)/()',...(spec.kind==='antiderivative'?[spec.expression]:[])])await sameOutcome(p,legacy,problem,batchmathToLatex(v).latex,v);
  });
  await r.test('C is entered only by the student; keypad C, e, roots and native fraction/exponent editing work',async()=>{
    await p.evaluate(()=>advancedQA.family('basic_trig_exponential'));await ready(p);await key(p,'C');assert.equal((await state(p)).raw,'C');await key(p,'Clear');assert.equal((await state(p)).raw,'');
    await p.keyboard.type('3/4');await p.keyboard.press('ArrowRight');await p.keyboard.type('+x');await p.keyboard.press('Shift+6');await p.keyboard.type('2');await p.keyboard.press('ArrowRight');await key(p,'+');await key(p,'C');assert.ok((await state(p)).raw.endsWith('+x^2+C'));
    await key(p,'Clear');await key(p,'√');await key(p,'2');await key(p,'→');await key(p,'+');await key(p,'e');assert.equal((await state(p)).raw,'sqrt(2)+e');
  });
  await r.test('blank/incomplete remains editable; Enter checks once, held Enter cannot skip, reset clears history',async()=>{
    await p.evaluate(()=>advancedQA.make());await ready(p);const initial=await state(p);await p.keyboard.press('Enter');assert.equal((await state(p)).disabled,false);assert.equal((await state(p)).attempted,initial.attempted);
    await set(p,'\\frac{1}{}');await p.keyboard.press('Enter');assert.equal((await state(p)).disabled,false);assert.ok((await state(p)).invalid);
    await set(p,'12345');await field(p).click();await p.keyboard.down('Enter');await p.keyboard.down('Enter');await p.keyboard.up('Enter');const checked=await state(p);assert.equal(checked.id,initial.id);assert.equal(Number(checked.attempted),Number(initial.attempted)+1);
    await p.keyboard.press('Enter');await ready(p);assert.equal((await state(p)).raw,'');await p.keyboard.press('Control+z');assert.equal((await state(p)).latex.trim(),'');await p.keyboard.type('x');assert.equal((await state(p)).raw,'x');
    await p.evaluate(()=>advancedQA.make());await ready(p);await p.keyboard.type('x');assert.equal((await state(p)).raw,'x');
  });
  await r.test('native selection, delete, undo/redo, copy/paste and blur without submission',async()=>{
    await key(p,'Clear');await p.keyboard.type('12');await p.keyboard.press('ArrowLeft');await p.keyboard.press('Delete');assert.equal((await state(p)).raw,'1');await p.keyboard.press('Control+a');await p.keyboard.press('Backspace');assert.equal((await state(p)).raw,'');
    await p.keyboard.type('3/4');await p.keyboard.press('Control+z');assert.ok(!(await state(p)).raw.includes('4'));await p.keyboard.press('Control+Shift+z');assert.ok((await state(p)).raw.includes('4'));
    await p.keyboard.press('Control+a');await p.keyboard.press('Control+c');await key(p,'Clear');await p.keyboard.press('Control+v');await p.waitForTimeout(100);assert.equal((await state(p)).raw,'(3)/(4)');
    await p.locator('.page-title').click();assert.equal((await state(p)).disabled,false);
  });
  for(const width of [375,1500])await r.test('long answer remains inside '+width+'px viewport',async()=>{
    await p.setViewportSize({width,height:1000});await set(p,Array(30).fill('\\frac{x^2}{\\sqrt{x+1}}').join('+')+'+C');const dim=await p.evaluate(()=>({page:document.documentElement.scrollWidth,view:innerWidth}));assert.ok(dim.page<=dim.view+1,JSON.stringify(dim));await p.screenshot({path:r.output+`basic-${width}.png`,fullPage:true});
  });
  await p.close();await legacy.close();
  for(const asset of ['runtime','fonts','stylesheet'])await r.test('missing '+asset+' preserves a usable legacy answer',async()=>{
    const glob=asset==='runtime'?'**/vendor/mathlive/mathlive.min.mjs':asset==='fonts'?'**/vendor/mathlive/fonts/*':'**/assets/mathlive/pilot.css';
    const q=await r.open({routes:[[glob,async route=>{if(asset!=='stylesheet')await new Promise(resolve=>setTimeout(resolve,600));await route.abort();}]]});await q.locator('.bm-calc-editor:visible').click();await q.keyboard.type('x+C');await q.waitForSelector('.bm-mathlive-notice');assert.equal((await state(q)).raw,'x+C');await submit(q);assert.equal((await state(q)).disabled,true);await q.close();
  });
  await r.test('runtime exception restores the actual legacy field and current answer',async()=>{const q=await r.open();await ready(q);await set(q,'\\frac{3}{4}+C');const value=(await state(q)).raw;await field(q).evaluate(f=>{f.executeCommand=()=>{throw Error('Injected failure');};});await key(q,'←');assert.equal(await q.locator('math-field').count(),0);assert.equal((await state(q)).raw,value);await q.keyboard.type('+1');assert.ok((await state(q)).raw.includes('1'));await q.close();});
  await r.test('uninstrumented explicit MathLive page submits normally',async()=>{const q=await r.open({instrumented:false,editor:'mathlive'});await ready(q);await q.keyboard.type('12345');await submit(q);assert.equal(await q.locator('.staged-feedback .result').count(),1);await q.close();});
}finally{await r.finish();}
