import test from 'node:test';import assert from 'node:assert/strict';
import {engine,rng} from './engine.mjs';import {translateDerivative} from '../../assets/mathlive/answer-adapter.mjs';
test('qa8: all 80 a/b/k combinations agree with independent derivative; wrong denominators fail',()=>{
 const e=engine('quotient');e.el('ruleMode').value='advanced';const cases=new Map();
 for(let i=1;i<=40000&&cases.size<80;i++){e.BatchMathRNG.random=rng(i*757);const p=e.qa.quotient();if(p.id.startsWith('qa8-'))cases.set(p.id,p);}
 assert.equal(cases.size,80);
 for(const p of cases.values()){
  const [,a,b,k]=p.id.split('-').map((x,i)=>i?Number(x):x);
  const expected=`(${a}/(${a}*x+${b})-${k}*ln(${a}*x+${b}))*e^(-${k}*x)`;
  const wrong=`(${a}/(${a}*x+${b})-${k}*ln(${a}*x+${b}))/e^((${k}*x)^2-${k}*x)`;
  assert.ok(e.qa.equivalent(p.answerExpr,expected,['x']),p.id);
  assert.ok(!e.qa.equivalent(wrong,expected,['x']),p.id);
  const t=translateDerivative(p.answerTex,{inverseTrig:true});assert.ok(e.qa.equivalent(t.input,expected,['x']),p.id);
  for(const [raw,correct]of [[expected,true],[expected+'+1',false],[wrong,false]]){e.qa.current={...p,answered:false};e.el('answer').value=raw;e.qa.check();assert.equal(e.el('feedback').innerHTML.includes('Correct.'),correct,p.id+raw);}
 }
});
