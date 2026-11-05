import assert from 'node:assert/strict';
import {runner,ready,field,key,set,state,load,submit,sameOutcome} from './browser-harness.mjs';
import {engine,slugs} from './engine.mjs';
import {batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
const r=await runner('newton'),w=engine(),reps=new Map();
for(let i=0;i<1500&&reps.size<11;i++){const p=w.BatchMathAPTopicGenerators.get(slugs.newton)();reps.set(p.unit4Meta.family==='nonpolynomial_representation'?p.unit4Meta.subtype:p.unit4Meta.family,p);}
try{
  const p=await r.open(),legacy=await r.open({editor:'legacy'});await ready(p);
  for(const [family,problem] of reps)await r.test('Newton '+family+': actual complete notation, wrong bounds and final value parity',async()=>{
    const spec=problem.stage1.unit4Answer,full=`lim(n->infinity,sum(k=1,n,${spec.expression}))`;
    const a=await sameOutcome(p,legacy,problem,problem.stage1.answerTex,full);assert.match(a.result,/good/);
    if(problem.stage2){
      for(const editor of [p,legacy])await editor.locator('.staged-continue:visible').click();await ready(p);
      const raw=w.BatchMathUnit4Answers.expression(problem.stage2.unit4Answer.value);await set(p,batchmathToLatex(raw).latex);await set(legacy,raw,'legacy');await submit(p);await submit(legacy);assert.match((await state(p)).result,/good/);assert.equal((await state(p)).next,true);assert.equal((await state(p)).result,(await state(legacy)).result);
    }else assert.equal(a.next,true);
    const wrong=await sameOutcome(p,legacy,problem,problem.stage1.answerTex.replace('k=1','k=0'),`lim(n->infinity,sum(k=0,n,${spec.expression}))`);assert.match(wrong.result,/bad/);
  });
  await r.test('sum and limit buttons insert editable structures; bounds, body, fractions and exponents remain editable',async()=>{
    await p.evaluate(()=>advancedQA.make());await ready(p);await key(p,'Clear');await p.locator('.bm-calc-keypad:visible [aria-label^="Insert limit as n"]').click();await p.locator('.bm-calc-keypad:visible [aria-label^="Insert summation from k"]').click();await p.keyboard.type('k/n');let s=await state(p);assert.ok(s.raw.includes('lim(n->infinity,')&&s.raw.includes('sum(k=1,n,'),JSON.stringify(s));assert.ok(s.raw.includes('(k)/(n)'));
    const offset=await field(p).evaluate(f=>{for(let i=1;i<=f.lastOffset;i++)if(f.getElementInfo(i)?.latex==='k')return i;return null;});assert.ok(offset);
    await field(p).evaluate((f,i)=>{f.selection={ranges:[[i-1,i]],direction:'forward'};},offset);await p.keyboard.type('j');assert.ok((await state(p)).latex.includes('j=1'));
    // Native undo can coalesce typing with a preceding edit; restore this
    // selected bound explicitly so subsequent navigation tests keep the body.
    const changed=await field(p).evaluate(f=>{for(let i=1;i<=f.lastOffset;i++)if(f.getElementInfo(i)?.latex==='j')return i;});
    await field(p).evaluate((f,i)=>{f.selection={ranges:[[i-1,i]],direction:'forward'};},changed);await p.keyboard.type('k');assert.ok((await state(p)).latex.includes('k=1'));
    const upper=await field(p).evaluate(f=>{const n=[];for(let i=1;i<=f.lastOffset;i++)if(f.getElementInfo(i)?.latex==='n')n.push(i);return n[1];});assert.ok(upper);
    await field(p).evaluate((f,i)=>{f.selection={ranges:[[i-1,i]],direction:'forward'};},upper);await p.keyboard.type('n+1');assert.ok((await state(p)).raw.includes('sum(k=1,n+1,'));
    const variable=await field(p).evaluate(f=>{for(let i=1;i<=f.lastOffset;i++)if(f.getElementInfo(i)?.latex==='n')return i;});
    await field(p).evaluate((f,i)=>{f.selection={ranges:[[i-1,i]],direction:'forward'};},variable);await p.keyboard.type('m');assert.ok((await state(p)).raw.includes('lim(m->infinity,'));
    const infinity=await field(p).evaluate(f=>{for(let i=1;i<=f.lastOffset;i++)if(f.getElementInfo(i)?.latex==='\\infty')return i;});assert.ok(infinity);
    await field(p).evaluate((f,i)=>{f.selection={ranges:[[i-1,i]],direction:'forward'};},infinity);await p.keyboard.type('0');assert.ok((await state(p)).raw.includes('lim(m->0,'));
    assert.equal(await p.locator('.bm-calc-keypad:visible [aria-label*="integral"]').count(),0);
  });
  await r.test('wrong Part 1 does not auto-advance; Continue opens a distinct field and keypad',async()=>{
    const problem=[...reps.values()].find(q=>q.stage2);await load(p,problem);await set(p,problem.stage1.answerTex.replace('k=1','k=0'));await submit(p);await p.keyboard.press('Enter');assert.equal(await p.locator('.staged-part-two').count(),0);
    const old=await p.locator('.staged-part-one math-field').evaluate(f=>f.value);await p.locator('.staged-continue').click();await ready(p);assert.equal((await state(p)).raw,'');await key(p,'7');assert.equal((await state(p)).raw,'7');assert.equal(await p.locator('.staged-part-one math-field').evaluate(f=>f.value),old);
    await p.keyboard.press('Control+z');assert.equal((await state(p)).raw,'');const raw=w.BatchMathUnit4Answers.expression(problem.stage2.unit4Answer.value);await set(p,batchmathToLatex(raw).latex);await submit(p);assert.equal((await state(p)).next,true);
  });
  await r.test('incomplete bounds and denominators do not consume a part or drop entered content',async()=>{
    await p.evaluate(()=>advancedQA.make());await ready(p);for(const latex of ['\\sum_{k=1}^{}k','\\lim_{n\\to\\infty}\\sum_{k=1}^n\\frac{1}{}']){await set(p,latex);const before=await state(p);await submit(p);const after=await state(p);assert.equal(after.disabled,false);assert.equal(after.latex,before.latex);assert.ok(after.invalid);}
  });
  await r.test('native copy/paste retains complete bounds and summand; source uses the original Newton format',async()=>{
    const problem=[...reps.values()][0];await load(p,problem);await set(p,problem.stage1.answerTex);await field(p).click();await p.keyboard.press('Control+a');await p.keyboard.press('Control+c');await key(p,'Clear');await p.keyboard.press('Control+v');await p.waitForTimeout(100);assert.ok((await state(p)).raw.startsWith('lim('));await submit(p);assert.match((await state(p)).result,/good/);
  });
  for(const asset of ['runtime','fonts'])await r.test('Newton '+asset+' failure preserves native legacy notation entry',async()=>{const glob=asset==='runtime'?'**/vendor/mathlive/mathlive.min.mjs':'**/vendor/mathlive/fonts/*';const q=await r.open({routes:[[glob,async route=>{await new Promise(resolve=>setTimeout(resolve,600));await route.abort();}]]});await q.locator('.bm-calc-editor:visible').click();await q.keyboard.type('k/n');await q.waitForSelector('.bm-mathlive-notice');assert.ok((await state(q)).raw.includes('k'));await q.close();});
  await r.test('runtime failure preserves a complete lim/sum in the actual legacy editor',async()=>{const q=await r.open();await ready(q);const problem=[...reps.values()][0];await load(q,problem);await set(q,problem.stage1.answerTex);const before=(await state(q)).raw;await field(q).evaluate(f=>{f.executeCommand=()=>{throw Error('Injected failure');};});await key(q,'←');assert.equal(await q.locator('math-field').count(),0);assert.equal((await state(q)).raw,before);await submit(q);assert.match((await state(q)).result,/good/);await q.close();});
  await r.test('unsupported unexpanded indexed/delta notation offers lossless legacy recovery',async()=>{const q=await r.open();await ready(q);await set(q,'\\sum_{k=1}^n x_k\\Delta x');const latex=(await state(q)).latex;await q.getByRole('button',{name:'Use the standard editor for this notation'}).click();assert.equal(await q.locator('.bm-mathlive-recovery').inputValue(),latex);await q.close();});
  await p.close();await legacy.close();
  const lab=await r.browser.newPage({viewport:{width:1200,height:900}});await lab.goto(r.base+'/experiments/mathlive-advanced-notation/');await lab.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  const insert=async name=>{await lab.locator('#clear').click();await lab.selectOption('#template',name);await lab.locator('#insert').click();};
  for(const name of ['indefinite','definite','double','subscript','delta','sum','limit'])await r.test('isolated editable '+name+' template, with no grading contract',async()=>{
    await insert(name);
    if(name==='definite'){await lab.keyboard.type('0');await lab.locator('#slot').click();await lab.keyboard.type('1');await lab.locator('#slot').click();await lab.keyboard.type('x');}
    else if(name==='double'){await lab.keyboard.type('R');await lab.locator('#slot').click();await lab.keyboard.type('xy');}
    else if(name==='subscript')await lab.keyboard.type('k');
    else if(name==='limit'){await lab.keyboard.type('S');await lab.keyboard.press('_');await lab.keyboard.type('n');await lab.keyboard.press('ArrowRight');}
    else if(name!=='delta')await lab.keyboard.type('x');
    const value=await lab.locator('math-field').evaluate(f=>f.value);
    if(name==='definite')assert.ok(/\\int_\{?0/.test(value)&&value.includes('1')&&value.includes('x'),value);
    if(name==='double')assert.ok(value.includes('\\iint')&&value.includes('R')&&value.includes('xy')&&value.includes('A'),value);
    if(name==='subscript')assert.ok(value.includes('x_k')||value.includes('x_{k}'),value);
    if(name==='delta')assert.ok(value.includes('\\Delta')&&value.includes('x'),value);
    if(name==='limit')assert.ok(value.includes('\\lim')&&(value.includes('S_n')||value.includes('S_{n}')),value);
    if(name==='indefinite')assert.ok(value.includes('\\int')&&value.includes('d'),value);
    if(name==='sum')assert.ok(value.includes('\\sum')&&value.includes('k=1'),value);
  });
  await r.test('isolated nested integral/summation retains differential and editable limits',async()=>{await insert('definite');await lab.keyboard.type('0');await lab.locator('#slot').click();await lab.keyboard.type('1');await lab.locator('#slot').click();await lab.selectOption('#template','sum');await lab.locator('#insert').click();await lab.keyboard.type('x');const value=await lab.locator('math-field').evaluate(f=>f.value);assert.ok(value.includes('\\int')&&value.includes('\\sum')&&value.includes('d'),value);await lab.screenshot({path:r.output+'advanced-templates.png',fullPage:true});});
  await lab.close();
}finally{await r.finish();}
