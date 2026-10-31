import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {translatePowerRule,batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
import {engine,rng,root,html,target} from './engine.mjs';

test('all 24 pinned MathLive runtime, font and license files match the integrity manifest',()=>{
  const lock=JSON.parse(fs.readFileSync(root+'assets/mathlive/dependency-lock.json','utf8')).mathlive;
  assert.equal(lock.version,'0.111.1');assert.equal(lock.files.length,24);
  for(const file of lock.files){const bytes=fs.readFileSync(root+'assets/mathlive/'+file.path);assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);}
});

test('the complete engine script equals the verified main baseline',()=>{
  const base=execFileSync('git',['show','26ec4f15185c37f9e8843e96a09d583b47babcdf:'+target],{cwd:root,encoding:'utf8'});
  const script=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('function powerRuleProblem'))[1];
  assert.equal(createHash('sha256').update(script(html)).digest('hex'),createHash('sha256').update(script(base)).digest('hex'));
});
for(const order of ['first','higher'])for(const family of ['mixed','polynomial','negative','fractional','irrational']) {
  if(order==='higher'&&family==='irrational')continue;
  test(`actual ${order}:${family}: 120 seeded correct/incorrect round trips and checker outcomes`,()=>{
    const {qa,BatchMathRNG,el}=engine();
    for(let i=1;i<=120;i++) {
      BatchMathRNG.random=rng(i*719+family.length*19+(order==='higher'?13:0));
      const p=qa.powerRuleProblem(order,family);
      const imported=batchmathToLatex(p.answerExpr);
      assert.equal(imported.status,'complete',p.answerExpr);
      const translated=translatePowerRule(imported.latex);
      assert.equal(translated.status,'complete',imported.latex);
      assert.ok(qa.equivalent(translated.input,p.answerExpr,p.vars),`${p.id}: ${p.answerExpr} => ${imported.latex} => ${translated.input}`);
      const outcome=raw=>{qa.current={...p,answered:false};el('answer').value=raw;qa.check();return [el('feedback').className,el('feedback').innerHTML];};
      assert.deepEqual(outcome(translated.input),outcome(p.answerExpr));
      const wrong=p.answerExpr+'+12345';
      const translatedWrong=translatePowerRule(batchmathToLatex(wrong).latex).input;
      assert.deepEqual(outcome(translatedWrong),outcome(wrong));
      assert.equal(el('feedback').className,'feedback wrong');
      // An unevaluated zero term, fraction and explicit grouping stay present.
      const unsimplified=`(${p.answerExpr})+0`;
      assert.deepEqual(outcome(translatePowerRule(batchmathToLatex(unsimplified).latex).input),outcome(unsimplified));
    }
  });
}
const equivalents=[
  ['-x^{2}','-x^2'],['(-x)^{2}','(-x)^2'],['x^{-2}','x^(-2)'],
  ['x^{\\frac{2}{3}}','x^(2/3)'],['\\frac{1}{\\frac{2}{x}}','1/(2/x)'],
  ['\\sqrt{x}','sqrt(x)'],['\\sqrt[3]{x}','x^(1/3)'],['\\sqrt[5]{x+1}','(x+1)^(1/5)'],
  ['\\sin^{2}(x)+\\cos^{2}(x)','sin(x)^2+cos(x)^2'],
  ['\\ln(x)+\\log(x)+\\exp(x)','ln(x)+log(x)+exp(x)'],
  ['\\frac{-(x+1)}{x-2}','-(x+1)/(x-2)'],['2(x+1)','2(x+1)'],
  ['\\left|x\\right|','abs(x)'],['3x^{2}+2x-7','3x^2+2x-7'],
  ['\\cos 3x','cos(3x)'],['\\sin x\\cos x','sin(x)*cos(x)'],
  ['\\sin x\\sqrt{x}','sin(x)*sqrt(x)'],['\\sin x\\left|x\\right|','sin(x)*abs(x)']
];
for(const [latex,expected] of equivalents)test(`grouping and structure: ${latex}`,()=>{
  const {qa}=engine();const result=translatePowerRule(latex);
  assert.equal(result.status,'complete');assert.ok(qa.equivalent(result.input,expected,['x']),result.input);
});
for(const latex of ['\\frac{1}{}','x^{}','\\frac{\\placeholder{}}{x}','\\sqrt[]{}','x+','(x+1'])test(`incomplete remains ungradable: ${latex}`,()=>{
  const result=translatePowerRule(latex);assert.equal(result.status,'incomplete');
  if(result.input!==null)assert.throws(()=>engine().qa.parseExpression(result.input));
});
for(const latex of ['\\int x','\\arcsin(x)','\\log_2(x)','z+1'])test(`unsupported is refused: ${latex}`,()=>{
  const r=translatePowerRule(latex);assert.equal(r.status,'unsupported');assert.equal(r.input,null);
});
test('answer labels before equals follow the existing checker policy',()=>{
  const {qa}=engine();const r=translatePowerRule("f'(x)=3x^2");assert.equal(r.input,'=3x^2');assert.ok(qa.equivalent(r.input,"f'(x)=3x^2",['x']));
  assert.equal(translatePowerRule("f'(x)=").input,'=');
});
test('no simplification and existing formatting gate is preserved, including dormant pb gate',()=>{
  const {qa,el}=engine();
  for(const raw of ['2(x+1)','x+x+2','4/2*x+2','2x+2','-x^2+2']) {
    const translated=translatePowerRule(batchmathToLatex(raw).latex).input;
    assert.equal(qa.expandedPolynomial(translated),qa.expandedPolynomial(raw),`${raw} -> ${translated}`);
    const p={id:'pb-test',answerExpr:'2x+2',vars:['x'],answerTex:'2x+2',solution:'test'};
    const check=v=>{qa.current={...p,answered:false};el('answer').value=v;qa.check();return el('feedback').innerHTML;};
    assert.equal(check(translated),check(raw));
  }
  assert.equal(translatePowerRule('\\frac{4}{2}').input,'(4)/(2)');
});
test('blank is non-consuming; malformed nonempty answers consume an attempt in the actual baseline',()=>{
  const {qa,el}=engine();const p=qa.powerRuleProblem('first','polynomial');
  qa.current={...p,answered:false};el('answer').value='';qa.check();assert.equal(qa.attempts,0);
  assert.match(el('feedback').innerHTML,/Enter an answer first/);
  el('answer').value=translatePowerRule('x^{}').input;qa.check();assert.equal(qa.attempts,1);
  assert.match(el('feedback').innerHTML,/Not quite/);
});
