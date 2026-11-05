import test from 'node:test';import assert from 'node:assert/strict';
import {engine,rng,slugs} from './engine.mjs';
import {translateInterval,intervalToLatex} from '../../assets/mathlive/interval-adapter.mjs';
const w=engine(),check=w.BatchMathUnit5Answers.check;
for(const family of ['product','powers_y','log_rational','trig','exp_y','radical_branch'])test(family+': 400 actual intervals, unchanged grading and exact endpoint round trips',()=>{
 for(let i=0;i<400;i++){w.BatchMathRNG={random:rng(i*91+5)};const p=w.BatchMathAPTopicGenerators.get(slugs.separable)({family}),a=p.parts[1].answer;
 for(const raw of [`(${a.left},${a.right})`,`[${a.left},${a.right}]`,`(${a.right},${a.left})`,'(0,1)','(-infinity,infinity)','(1/2,sqrt(2))']){const l=intervalToLatex(raw);assert.equal(l.status,'complete');const t=translateInterval(l.latex);assert.equal(t.status,'complete');assert.deepEqual(check(t.input,a),check(raw,a),p.id+raw);}
 assert.equal(check(translateInterval(p.parts[1].answerTex).input,a).ok,true,p.id);
 }
});
test('interval punctuation, inequalities, unions, incompleteness and infinity conventions',()=>{
 const spec={kind:'interval',left:'0',right:'sqrt(2)',lc:false,rc:false,validity:true,x0:1};
 for(const raw of ['0<x<sqrt(2)','x>0','(-infinity,infinity)','[0,sqrt(2))','(0,1)∪(2,3)','[0,infinity]']){const t=translateInterval(intervalToLatex(raw).latex);assert.deepEqual(check(t.input,spec),check(raw,spec),raw);}
 for(const raw of ['(,3)','(0,)','(0,3','(\\frac{1}{},3)','(0,\\int x)'])assert.equal(translateInterval(raw).input,null,raw);
});
