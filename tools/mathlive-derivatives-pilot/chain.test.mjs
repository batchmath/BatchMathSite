import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {translateDerivative,batchmathToLatex,parseInput} from '../../assets/mathlive/answer-adapter.mjs';
import {engine,engineScript,html,root,target,rng,modes,familyKey,expectedFamilies} from './engine.mjs';

test('Chain Rule complete engine and grading grammar are unchanged',()=>{
  const baseline=execFileSync('git',['show','1fdbcbec2550d08dc900aacbc83529389e942e7f:'+target],{cwd:root,encoding:'utf8'});
  assert.equal(engineScript(html),engineScript(baseline));
  const power=fs.readFileSync(root+'ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/index.html','utf8');
  const grammar=s=>s.slice(s.indexOf('const FUNCS='),s.indexOf('function typeset(nodes)'));
  assert.equal(grammar(html),grammar(power));
  assert.deepEqual([...html.matchAll(/<option[^>]+value="(simple|multiple|other|all)"/g)].map(x=>x[1]),modes);
});
const counts={},coverage={},symbols=new Set(),functions=new Set();let gradingPairs=0;
function visit(n){
  if(n.type==='sym')symbols.add(n.name);if(n.type==='call')functions.add(n.name);
  for(const child of Object.values(n)){if(Array.isArray(child))child.forEach(x=>x&&typeof x==='object'&&visit(x));else if(child&&typeof child==='object')visit(child);}
}
for(const mode of modes)test(`Chain Rule ${mode}: 3000 seeded questions, both structural representations and real grading parity`,()=>{
  const {qa,el,BatchMathRNG}=engine();el('chain-mode').value=mode;
  const found=new Set(),variants=new Set();counts[mode]=0;
  for(let i=1;i<=3000;i++){
    BatchMathRNG.random=rng(i*719+mode.length);const p=qa.chain(),family=familyKey(p);
    counts[mode]++;assert.ok(expectedFamilies(mode).includes(family),p.id);
    const parsed=parseInput(p.answerExpr);assert.equal(parsed.status,'complete',p.id);visit(parsed.tree);
    for(const latex of [batchmathToLatex(p.answerExpr).latex,p.answerTex]){
      const r=translateDerivative(latex);assert.equal(r.status,'complete',`${p.id}: ${latex}: ${r.message}`);
      assert.ok(qa.equivalent(r.input,p.answerExpr,p.vars),`${p.id}: ${latex} -> ${r.input} != ${p.answerExpr}`);
    }
    if(p.id.startsWith('coj-')){const bits=p.id.split('-');variants.add('high:'+bits[7]);if(bits[2]==='quot')variants.add('trigTop:'+bits[9]);}
    if(!found.has(family)){
      const outcome=raw=>{qa.current={...p,answered:false};el('answer').value=raw;qa.check();return [el('feedback').className,el('feedback').innerHTML];};
      for(const raw of [p.answerExpr,p.answerExpr+'+12345',`(${p.answerExpr})+0`,'(1)/()']){
        const latex=batchmathToLatex(raw).latex;const r=translateDerivative(latex);
        assert.notEqual(r.input,null);assert.deepEqual(outcome(r.input),outcome(raw),`${p.id}: ${raw}`);gradingPairs++;
      }
    }
    found.add(family);
  }
  assert.deepEqual([...found].sort(),expectedFamilies(mode).sort());coverage[mode]=[...found].sort();
  if(['other','all'].includes(mode))assert.deepEqual([...variants].sort(),['high:false','high:true','trigTop:false','trigTop:true']);
});
test('Chain Rule keypad matches the actual generator and supported log/root notation',()=>{
  assert.deepEqual([...symbols].sort(),['e','x']);
  assert.deepEqual([...functions].sort(),['cos','cot','csc','sec','sin','sqrt','tan']);
  const text=fs.readFileSync(root+'assets/calculus-keypad.js','utf8');
  const profile=vm.runInNewContext('('+text.match(/"derivative-chain":(\{[^\n]+\})/)[1]+')');
  for(const fn of functions)assert.ok(fn==='sqrt'?profile.radical:profile.functions.some(([,name])=>name===fn),fn);
  assert.ok(profile.constants.includes('e')&&profile.variables.includes('x'));
  assert.ok(profile.logarithm&&profile.fraction&&profile.exponent&&profile.parentheses&&profile.arithmetic);
  assert.equal(profile.nthRoot,undefined);assert.ok(!profile.constants.includes('pi'));
  assert.equal(profile.functions.some(([,name])=>/^(?:asin|acos|atan)/.test(name)),false);
  fs.mkdirSync(root+'tools/mathlive-derivatives-pilot/artifacts',{recursive:true});
  fs.writeFileSync(root+'tools/mathlive-derivatives-pilot/artifacts/mathematical-results.json',JSON.stringify({samples:counts,families:coverage,gradingPairs,identifiers:[...symbols].sort(),functions:[...functions].sort()},null,2)+'\n');
});
const correct=[
  ['2x\\cos(x^2)','2*x*cos(x^2)'],['\\sin^2(x)','sin(x)^2'],['\\sin(x^2)','sin(x^2)'],
  ['\\cos(\\sin(x^2))','cos(sin(x^2))'],['e^{\\sin^2(3x)}','e^(sin(3*x)^2)'],
  ['\\frac{2x}{3(x^2+4)^{\\frac23}}','2*x/(3*(x^2+4)^(2/3))'],
  ['\\frac{1}{\\frac{x}{e^x}}','1/(x/e^x)'],['\\sec^2(\\sqrt{e^{3x}+2})','sec(sqrt(e^(3*x)+2))^2'],
  ['-\\csc(2x)\\cot(2x)','-csc(2*x)*cot(2*x)'],['\\ln(\\sqrt{x^2+1})','ln(sqrt(x^2+1))'],
  ['\\log(x^2+1)','log(x^2+1)'],['\\sqrt[3]{x^2+4}','(x^2+4)^(1/3)'],
  ['-(x+1)^2','-(x+1)^2'],['(-x+1)^2','(-x+1)^2'],['\\frac{x+1}{x-1}\\cos x','(x+1)/(x-1)*cos(x)']
];
for(const [latex,expected] of correct)test(`Chain Rule structure: ${latex}`,()=>{
  const {qa}=engine();const r=translateDerivative(latex);assert.equal(r.status,'complete');assert.ok(qa.equivalent(r.input,expected,['x']),r.input);
});
test('trig power and argument power stay distinct; a missing chain factor stays wrong',()=>{
  const {qa}=engine();
  assert.equal(qa.equivalent(translateDerivative('\\sin^2(x)').input,'sin(x^2)',['x']),false);
  assert.equal(qa.equivalent(translateDerivative('\\cos(x^2)').input,'2*x*cos(x^2)',['x']),false);
  assert.equal(translateDerivative('2(x+1)').input,'2(x+1)');assert.equal(translateDerivative('\\frac{4}{2}').input,'(4)/(2)');
});
test('blank, malformed and unsupported keep the original Chain Rule outcomes',()=>{
  const {qa,el}=engine();const p=qa.chain();
  qa.current={...p,answered:false};el('answer').value='';qa.check();assert.equal(qa.attempts,0);
  for(const latex of ['\\frac{x}{}','e^{}','\\sin(\\placeholder{})','\\int x','\\arcsin x']){
    const r=translateDerivative(latex);assert.notEqual(r.status,'complete');
    qa.current={...p,answered:false};el('answer').value=r.input??'?';const before=qa.attempts;qa.check();assert.equal(qa.attempts,before+1);assert.match(el('feedback').innerHTML,/Not quite/);
  }
});
