import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {harness,root} from './browser-harness.mjs';
import {engine,instrument,rng} from '../mathlive-sitewide/unit2-engine.mjs';
import {parseInput} from '../../assets/mathlive/answer-adapter.mjs';
import {enterWithKeypad} from '../mathlive-power-rule/keypad-entry.mjs';
const before=JSON.parse(fs.readFileSync(root+'docs/audits/evidence/keypad-completeness-unit2-indexed-roots-before.json'));
const cases=[before.results.find(r=>r.route?.includes('/derivatives-with-the-power-rule/practice/')&&r.meaningfulAlternative?.includes('root(4,')),before.results.find(r=>r.route?.includes('/the-chain-rule/practice/')&&r.questionId==='csj-cube-3-6')];
assert.ok(cases.every(Boolean));const h=await harness(),results=[];
if(process.env.LEGACY_ROOT_BASE_REF){const trace=h.transforms.get('assets/calculus-keypad.js'),source=execFileSync('git',['show',process.env.LEGACY_ROOT_BASE_REF+':assets/calculus-keypad.js'],{cwd:root,encoding:'utf8'});h.transforms.set('assets/calculus-keypad.js',()=>trace(source));}
try{
 for(const c of cases){
  const e=engine({path:c.route});for(const [id,value] of Object.entries(c.selector))e.el(id).value=value;
  e.b.BatchMathRNG.random=rng(c.seed);e.qa.makeProblem();const q=JSON.parse(JSON.stringify(e.qa.current));assert.equal(q.id,c.questionId);
  h.transforms.set(c.route,s=>instrument(s,'inline').replace(/current\s*=\s*(p|problem);/,(_,v)=>`${v}=window.__KEYPAD_FIXTURE||${v};current=${v};`));
  const page=await h.open(c.route,{legacy:true});await page.waitForFunction(()=>window.siteQA);
  const load=()=>page.evaluate(({q,selector})=>{for(const [id,value] of Object.entries(selector)){const input=document.getElementById(id);if(input)input.value=value;}window.__KEYPAD_FIXTURE={...q,answered:false};siteQA.makeProblem();delete window.__KEYPAD_FIXTURE;},{q,selector:c.selector});
  await load();await enterWithKeypad(page,parseInput('987654321').tree,{dom:true});await page.locator('#submit').click();assert.match(await page.locator('#feedback').getAttribute('class'),/wrong/);
  await load();const parsed=parseInput(c.meaningfulAlternative);assert.equal(parsed.status,'complete');await enterWithKeypad(page,parsed.tree,{dom:true});
  const source=await page.locator('#answer').inputValue(),visible=await page.locator('.bm-calc-editor:visible').getAttribute('aria-valuetext');
  const record={route:c.route,questionId:q.id,selector:c.selector,seed:c.seed,requiredAnswer:q.answerExpr,meaningfulAlternative:c.meaningfulAlternative,visible,serializedSource:source,wrongRejected:true};results.push(record);
  assert.ok(visible.includes('root('));assert.ok(!source.includes('root('));await page.locator('#submit').click();record.feedback=await page.locator('#feedback').innerText();
  if(process.env.LEGACY_ROOT_BASE_REF){assert.match(await page.locator('#feedback').getAttribute('class'),/wrong/,JSON.stringify(record));record.expectedFailure=true;record.passed=false;record.correctAccepted=false;}
  else{assert.match(await page.locator('#feedback').getAttribute('class'),/correct/,JSON.stringify(record));record.correctAccepted=true;record.passed=true;}
  await page.close();
 }
}finally{await h.close();fs.writeFileSync(root+'docs/audits/evidence/keypad-legacy-root-grading'+(process.env.LEGACY_ROOT_BASE_REF?'-precedence-before':'-final-d')+'.json',JSON.stringify({results,baselineRef:process.env.LEGACY_ROOT_BASE_REF,note:'Complete generated answers constructed through the visible legacy keypad and graded by the original page checker; separate from MathLive-only counts.'},null,2)+'\n');}
console.log(results.length,process.env.LEGACY_ROOT_BASE_REF?'legacy precedence failures reproduced':'legacy generated indexed-root answers pass original correct/wrong grading');
