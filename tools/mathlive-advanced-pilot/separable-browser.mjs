import assert from 'node:assert/strict';
import {runner,ready,field,key,set,state,submit} from './browser-harness.mjs';
import {intervalToLatex} from '../../assets/mathlive/interval-adapter.mjs';
import {slugs} from './engine.mjs';
import {batchmathToLatex,parseInput} from '../../assets/mathlive/answer-adapter.mjs';
import {enterWithKeypad} from '../mathlive-power-rule/keypad-entry.mjs';
const r=await runner('separable');
const cases={product:['kxyq','kxy','lin','yx'],powers_y:['y2','y3','xy','cbrt','sqrty'],log_rational:['y2x','lnxy','xlnx'],trig:['cos2','y2sin','cosxy','xsin','tany'],exp_y:['exmy','quad','xey','eyt','cosesin'],radical_branch:['circ','shift','xpb','expsq']};
async function choose(p,family,stem,seed,variable){
  await p.evaluate(({family,stem,seed,variable,slug})=>{
    let s=seed>>>0;window.BatchMathRNG={random:()=>{s=(s+0x6d2b79f5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}};
    const api=BatchMathAPTopicGenerators,prior=api.get,gen=prior(slug);api.get=name=>name===slug?opts=>{for(let i=0;i<500;i++){const p=gen({...opts,family});if((!stem||p.id.split('-')[2]===stem)&&(!variable||p.parts[0].answer.variable===variable))return p;}throw Error('Missing IVP form');}:prior(name);
    try{advancedQA.make();}finally{api.get=prior;}
  },{family,stem,seed,variable,slug:slugs.separable});
}
async function pair(p,legacy,family,stem,seed,variable){await choose(p,family,stem,seed,variable);await choose(legacy,family,stem,seed,variable);await ready(p);const a=await p.evaluate(()=>advancedQA.current),b=await legacy.evaluate(()=>advancedQA.current);assert.equal(a.id,b.id);return a;}
function particular(problem){const a=problem.parts[0].answer;return a.expression.replace(/\bx\b/g,a.variable==='theta'?'θ':a.variable);}
const interval=problem=>`(${problem.parts[1].answer.left},${problem.parts[1].answer.right})`;
async function finishA(p,legacy,problem,raw=particular(problem),latex=problem.parts[0].answerTex){await set(p,latex);await set(legacy,raw,'legacy');await submit(p);await submit(legacy);const a=await state(p),b=await state(legacy);for(const k of ['disabled','result','invalid','next'])assert.equal(a[k],b[k],problem.id+': '+k);return a;}
async function continueB(p){await p.locator('.staged-continue:visible').click();if(new URL(p.url()).searchParams.get('editor')==='legacy'||await p.locator('p.bm-mathlive-notice:visible').count())await p.locator('.staged-part:not(.staged-completed) .bm-calc-editor:visible').waitFor();else await ready(p);}
async function setB(p,raw){if(await field(p).count())await set(p,intervalToLatex(raw).latex);else await set(p,raw,'legacy');}
try{
  const p=await r.open(),legacy=await r.open({editor:'legacy'});await ready(p);let index=0;
  for(const [family,stems] of Object.entries(cases))for(const stem of stems)await r.test('actual IVP '+family+'/'+stem+': particular solution and interval through both editor paths',async()=>{
    const problem=await pair(p,legacy,family,stem,3000+(index++)*29);const a=await finishA(p,legacy,problem);assert.match(a.result,/good/);assert.equal(a.next,false);
    const first=await p.locator('.unit5-part-1 math-field').evaluate(f=>f.value);for(const editor of [p,legacy])await continueB(editor);
    assert.equal(await field(p).count(),1);assert.equal(await p.locator('.unit5-part-2 .bm-calc-editor:visible').count(),0);
    await setB(p,interval(problem));await set(legacy,interval(problem),'legacy');await submit(p);await submit(legacy);assert.match((await state(p)).result,/good/);assert.equal((await state(p)).next,true);assert.equal((await state(p)).result,(await state(legacy)).result);assert.equal(await p.locator('.unit5-part-1 math-field').evaluate(f=>f.value),first);
  });
  for(const family of Object.keys(cases))await r.test(family+': wrong, unsimplified, unwanted C and incomplete particular answers preserve feedback',async()=>{
    for(const kind of ['wrong','unsimplified','C','incomplete']){
      const problem=await pair(p,legacy,family,null,501+family.length);const value=particular(problem),raw=kind==='wrong'?`(${value})+1`:kind==='unsimplified'?`(${value})+0`:kind==='C'?value+'+C':'(1)/()';
      const a=await finishA(p,legacy,problem,raw,batchmathToLatex(raw).latex);
      if(kind==='incomplete')assert.equal(a.disabled,false);else assert.match(a.result,kind==='unsimplified'?/good/:/bad/);
    }
  });
  await r.test('Greek theta is a working keypad key; a complete actual theta solution can be entered on screen',async()=>{
    const problem=await pair(p,legacy,'log_rational','y2x',91,'theta');await key(p,'θ');assert.equal((await state(p)).raw,'θ');
    const latex=problem.parts[0].answerTex.replace(/^[^=]*=/,'');const tree=parseInput(latex,'latex');assert.equal(tree.status,'complete');
    for(const editor of [p,legacy]){await enterWithKeypad(editor,tree.tree);await submit(editor);assert.match((await state(editor)).result,/good/);}
  });
  await r.test('inverse trig, cube roots, logs, absolute value and exponentials remain native editable input',async()=>{
    await choose(p,'product','kxy',701,'x');await ready(p);
    for(const [label,expected] of [['sin⁻¹','asin(0)'],['cos⁻¹','acos(0)'],['tan⁻¹','atan(0)'],['√','sqrt(0)'],['∛','root(3,0)'],['ln','ln(0)'],['|u|','abs(0)']]){await key(p,'Clear');await key(p,label);await key(p,'0');await key(p,'→');assert.equal((await state(p)).raw,expected);}
    await key(p,'Clear');await key(p,'e');await key(p,'xⁿ');await key(p,'x');await key(p,'→');assert.equal((await state(p)).raw,'e^(x)');
  });
  await r.test('wrong Part A waits for Continue; Part B blank/bracket errors, correct interval and Enter progression stay intact',async()=>{
    const problem=await pair(p,legacy,'radical_branch','circ',913);const raw=`(${particular(problem)})+1`;await finishA(p,legacy,problem,raw,batchmathToLatex(raw).latex);await p.keyboard.press('Enter');assert.equal(await p.locator('.unit5-part-2').count(),0);
    await continueB(p);assert.equal((await state(p)).raw,'');const count=(await state(p)).attempted;await p.keyboard.press('Enter');assert.equal((await state(p)).attempted,count);assert.equal((await state(p)).disabled,false);
    const a=problem.parts[1].answer;await setB(p,`[${a.left},${a.right}]`);await submit(p);assert.match((await state(p)).result,/bad/);assert.equal((await state(p)).next,true);
    await p.keyboard.down('Enter');await p.keyboard.down('Enter');await p.keyboard.up('Enter');await ready(p);assert.equal((await state(p)).raw,'');await p.keyboard.press('Control+z');assert.equal((await state(p)).raw,'');await p.keyboard.type('x');assert.equal((await state(p)).raw,'x');
  });
  await r.test('first-key focus, copy/paste, undo/redo and no blur/change grading in Part A',async()=>{
    await choose(p,'product','kxy',1001,'x');await ready(p);await p.keyboard.type('3/4');await p.keyboard.press('Control+z');assert.ok(!(await state(p)).raw.includes('4'));await p.keyboard.press('Control+Shift+z');assert.ok((await state(p)).raw.includes('4'));
    await p.keyboard.press('Control+a');await p.keyboard.press('Control+c');await key(p,'Clear');await p.keyboard.press('Control+v');await p.waitForTimeout(100);assert.equal((await state(p)).raw,'(3)/(4)');await p.locator('.page-title').click();assert.equal((await state(p)).disabled,false);
    await field(p).evaluate(f=>f.dispatchEvent(new Event('change',{bubbles:true})));assert.equal((await state(p)).disabled,false);
  });
  for(const width of [375,1500])await r.test('particular-solution prefix and long expression fit '+width+'px',async()=>{
    await p.setViewportSize({width,height:1000});await set(p,Array(30).fill('\\frac{\\ln(x)}{\\sqrt{x+1}}').join('+'));const dims=await p.evaluate(()=>({page:document.documentElement.scrollWidth,view:innerWidth}));assert.ok(dims.page<=dims.view+1,JSON.stringify(dims));await p.screenshot({path:r.output+`separable-${width}.png`,fullPage:true});
  });
  await p.close();await legacy.close();
  for(const asset of ['runtime','fonts'])await r.test('Separable '+asset+' failure preserves Part A and keeps the native interval stage usable',async()=>{const glob=asset==='runtime'?'**/vendor/mathlive/mathlive.min.mjs':'**/vendor/mathlive/fonts/*';const q=await r.open({routes:[[glob,async route=>{await new Promise(resolve=>setTimeout(resolve,600));await route.abort();}]]});await q.locator('.bm-calc-editor:visible').click();await q.keyboard.type('2x');await q.waitForSelector('.bm-mathlive-notice');assert.equal((await state(q)).raw,'2x');await submit(q);await continueB(q);assert.equal(await field(q).count(),0);const current=await q.evaluate(()=>advancedQA.current);await set(q,interval(current),'legacy');await submit(q);assert.match((await state(q)).result,/good/);await q.close();});
  await r.test('runtime failure preserves the current particular solution and exact latex for unsupported input',async()=>{
    for(const latex of ['\\frac{1}{1+e^x}','\\int x']){const q=await r.open();await ready(q);await set(q,latex);const raw=(await state(q)).raw;await field(q).evaluate(f=>{f.executeCommand=()=>{throw Error('Injected failure');};});await key(q,'←');assert.equal(await q.locator('math-field').count(),0);if(raw==='?')assert.equal(await q.locator('.bm-mathlive-recovery').inputValue(),latex);else assert.equal((await state(q)).raw,raw);await q.close();}
  });
  await r.test('uninstrumented separable page defaults to MathLive for both parts',async()=>{const q=await r.open({instrumented:false});await ready(q);await q.keyboard.type('12345');await submit(q);await continueB(q);assert.equal(await field(q).count(),1);assert.equal(await q.locator('.unit5-part-2 .bm-calc-editor:visible').count(),0);await q.close();});
}finally{await r.finish();}
