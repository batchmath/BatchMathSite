import assert from 'node:assert/strict';
import {runner,ready,field,key,set,state,submit} from './browser-harness.mjs';
import {batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
import {intervalToLatex} from '../../assets/mathlive/interval-adapter.mjs';
const r=await runner('corrections');
try{
 const p=await r.open({engineKey:'newton'});await ready(p);
 await r.test('standalone signed infinity, approach and subscript respect selection',async()=>{
  for(const [label,want] of [['∞','infinity'],['−∞','-infinity']]){await key(p,'Clear');await key(p,label);assert.equal((await state(p)).raw,want);}
  await key(p,'Clear');await key(p,'lim');await key(p,'xₙ');await key(p,'n');await p.locator('.bm-calc-keypad:visible [aria-label="Insert approach arrow"]').click();await key(p,'∞');await p.locator('.bm-calc-keypad:visible [aria-label="Move cursor right"]').click();
  const head=(await state(p)).latex;assert.match(head,/\\lim/);assert.match(head,/n\\to\\infty/);
  const problem=await p.evaluate(()=>advancedQA.current);await p.locator('.bm-calc-keypad:visible [aria-label^="Insert summation from k"]').click();await field(p).evaluate((f,latex)=>{f.insert(latex);f.dispatchEvent(new Event('input',{bubbles:true}));},batchmathToLatex(problem.stage1.unit4Answer.expression).latex);
  await submit(p);assert.match((await state(p)).result,/good/);
  await p.evaluate(()=>advancedQA.make());await ready(p);const wrong=await p.evaluate(()=>advancedQA.current.stage1.answerTex);await set(p,wrong.replace('\\infty','-\\infty'));assert.ok((await state(p)).raw.includes('-infinity'));await submit(p);assert.match((await state(p)).result,/bad/);
 });
 const legacy=await r.open({engineKey:'newton',editor:'legacy'});
 await r.test('legacy standalone infinities retain original checker syntax',async()=>{for(const [label,want] of [['∞','infinity'],['−∞','-infinity']]){await key(legacy,'Clear');await key(legacy,label);assert.equal((await state(legacy)).raw,want);}});
 await p.close();await legacy.close();
 const q=await r.open({engineKey:'separable'});await ready(q);
 await set(q,'12345');await submit(q);await q.locator('.staged-continue:visible').click();await ready(q);
 await r.test('Part B interval keypad only creates infinite endpoints and has isolated history',async()=>{
  assert.equal((await state(q)).raw,'');await q.keyboard.press('Control+z');assert.equal((await state(q)).raw,'');
  await q.keyboard.type('(0,3)');assert.equal((await state(q)).raw,'(0,3)');await key(q,'Clear');
  for(const label of ['(','−∞',',','∞',')'])await key(q,label);
  assert.equal((await state(q)).raw,'(-infinity,infinity)');
  await q.keyboard.press('Control+a');await q.keyboard.press('Control+c');await key(q,'Clear');await q.keyboard.press('Control+v');await q.waitForTimeout(100);assert.equal((await state(q)).raw,'(-infinity,infinity)');
  await q.setViewportSize({width:375,height:1000});assert.ok(await q.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await q.screenshot({path:r.output+'interval-part-b-375.png',fullPage:true});await q.setViewportSize({width:1500,height:1000});
 });
 await r.test('Part B incomplete/order/closed infinity preserve native invalid feedback; exact endpoints and inequalities serialize',async()=>{
  for(const latex of ['(0,)','(3,0)','[0,\\infty]']){await set(q,latex);await submit(q);assert.equal((await state(q)).disabled,false);assert.ok((await state(q)).invalid);}
  for(const raw of ['(-sqrt(2),sqrt(2))','(1/2,pi)','0<x<sqrt(2)']){await set(q,intervalToLatex(raw).latex);assert.notEqual((await state(q)).raw,'?');}
 });
 await r.test('Part B runtime failure keeps the actual interval and restores standard editor',async()=>{
  await set(q,'(-\\infty,\\sqrt{2})');const raw=(await state(q)).raw;await field(q).evaluate(f=>{f.executeCommand=()=>{throw Error('test');};});await key(q,'←');assert.equal(await field(q).count(),0);assert.equal((await state(q)).raw,raw);
 });
 await q.close();
}finally{await r.finish();}
