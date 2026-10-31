import assert from 'node:assert/strict';
import {runner,ready,field,set,key,state,load,submit,sameOutcome} from './browser-harness.mjs';
import {engine,slugs,rng} from './engine.mjs';
import {batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
const r=await runner('ftc'),w=engine();
const families={ftc:['upper_identity','lower_identity','upper_linear','upper_power','lower_power','upper_trig','both_algebraic','both_transcendental'],rules:['reverse_limits','zero_width','linearity','interval_decomposition','combined_rules','reversed_combination']};
try{
  for(const type of ['ftc','rules']){
    const p=await r.open({engineKey:type}),legacy=await r.open({engineKey:type,editor:'legacy'});await ready(p);
    await r.test(type+' actual rendering, first key, matching engine-specific keypads',async()=>{
      if(r.fixtures)await p.waitForSelector('#question mjx-container');await p.keyboard.type('7');assert.equal((await state(p)).raw,'7');
      assert.deepEqual(await p.locator('.bm-calc-keypad:visible button').allTextContents(),await legacy.locator('.bm-calc-keypad:visible button').allTextContents());
      assert.equal(await p.locator('math-field:visible').count(),1);
    });
    const reps=new Map();for(let i=0;i<1000&&reps.size<families[type].length;i++){const q=w.BatchMathAPTopicGenerators.get(slugs[type])();reps.set(q.unit4Meta.family,q);}
    for(const family of families[type])await r.test(type+' '+family+' — actual correct/wrong/unsimplified/incomplete submissions',async()=>{
      const problem=reps.get(family),spec=problem.stage1.unit4Answer,raw=spec.expression||w.BatchMathUnit4Answers.expression(spec.value);
      const a=await sameOutcome(p,legacy,problem,problem.stage1.answerTex,raw);assert.match(a.result,/good/);
      for(const v of [`(${raw})+1`,`(${raw})+0`,'x^()'])await sameOutcome(p,legacy,problem,batchmathToLatex(v).latex,v);
    });
    await r.test(type+' Check/Enter, no blur submission, held Enter and fresh question history',async()=>{
      await p.evaluate(()=>advancedQA.make());await ready(p);await set(p,'12345');const before=await state(p);await p.locator('.page-title').click();assert.equal((await state(p)).disabled,false);await field(p).click();await p.keyboard.down('Enter');await p.keyboard.down('Enter');await p.keyboard.up('Enter');assert.equal((await state(p)).id,before.id);assert.equal(Number((await state(p)).attempted),Number(before.attempted)+1);await p.keyboard.press('Enter');await ready(p);await p.keyboard.press('Control+z');assert.equal((await state(p)).raw,'');
    });
    await p.close();await legacy.close();
  }
  await r.test('2x sec(x^6) reaches the existing FTC checker without losing its factor',async()=>{
    const p=await r.open(),legacy=await r.open({editor:'legacy'});await ready(p);const problem=await p.evaluate(()=>advancedQA.current);problem.stage1.unit4Answer={kind:'function-expression',expression:'2*x*sec(x^6)'};problem.stage1.answerTex='2x\\sec(x^6)';
    const a=await sameOutcome(p,legacy,problem,'2x\\sec(x^6)','2xsec(x^6)');assert.match(a.result,/good/);await sameOutcome(p,legacy,problem,'\\sec(x^6)','sec(x^6)');assert.match((await state(p)).result,/bad/);await p.close();await legacy.close();
  });
  await r.test('actual secant-squared factor followed by a parenthesized factor retains multiplication',async()=>{
    w.BatchMathRNG={random:rng(28*719+3)};const problem=w.BatchMathAPTopicGenerators.get(slugs.ftc)();assert.equal(problem.id,'u4N-ftc-both_transcendental-e54a8b12c19745f6');
    const p=await r.open(),legacy=await r.open({editor:'legacy'});await ready(p);const a=await sameOutcome(p,legacy,problem,problem.stage1.answerTex,problem.stage1.unit4Answer.expression);assert.match(a.result,/good/);await p.close();await legacy.close();
  });
  for(const asset of ['runtime','fonts'])await r.test('FTC '+asset+' failure retains a working legacy field',async()=>{
    const glob=asset==='runtime'?'**/vendor/mathlive/mathlive.min.mjs':'**/vendor/mathlive/fonts/*';const q=await r.open({routes:[[glob,async route=>{await new Promise(resolve=>setTimeout(resolve,600));await route.abort();}]]});await q.locator('.bm-calc-editor:visible').click();await q.keyboard.type('2x');await q.waitForSelector('.bm-mathlive-notice');assert.equal((await state(q)).raw,'2x');await submit(q);assert.equal((await state(q)).disabled,true);await q.close();
  });
}finally{await r.finish();}
