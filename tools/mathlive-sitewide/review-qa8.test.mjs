import test from 'node:test';import assert from 'node:assert/strict';import {engine,rng} from './unit2-engine.mjs';import {translateDerivative} from '../../assets/mathlive/answer-adapter.mjs';
const route={path:'ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html'};
test('reachable symbolic review qa8 stores the square of the exponential denominator',()=>{const e=engine(route),tuples=new Set();e.el('category').value='quotient';e.el('ruleMode').value='mixed';let count=0;
 const check=(p,raw)=>{e.qa.current={...p,answered:false};e.el('answer').value=raw;e.qa.check();return e.el('feedback').innerHTML.includes('class="status">Correct.');};
 for(let seed=1;seed<=1600;seed++){e.b.BatchMathRNG.random=rng(seed*719);e.qa.makeProblem();const p=JSON.parse(JSON.stringify(e.qa.current));if(!p.id.startsWith('qa8-'))continue;const[a,b,k]=p.id.slice(4).split('-').map(Number),correct=`(${a}/(${a}*x+${b})-${k}*ln(${a}*x+${b}))/e^(${k}*x)`,display=translateDerivative(p.answerTex,{inverseTrig:true});assert.equal(check(p,correct),true,p.id+': '+p.answerExpr);assert.equal(check(p,display.input),true,p.id);assert.equal(check(p,p.answerExpr),true,p.id);assert.equal(check(p,correct+'+1'),false,p.id);tuples.add([a,b,k].join(','));count++;}
 assert.ok(count>=25);assert.ok(tuples.size>=20);
});
