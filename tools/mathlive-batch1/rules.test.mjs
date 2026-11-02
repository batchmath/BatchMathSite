import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {engine,root,target,script,family,representatives,rng} from './engine.mjs';
import {translateDerivative,batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
const tr=s=>translateDerivative(s,{inverseTrig:true}),report={};
for(const rule of ['product','quotient'])test(rule+': reachable families, generated TeX, equivalent/wrong/incomplete actual check parity',()=>{
 const e=engine(rule),reps=representatives(rule),expected=rule==='product'?43:72;assert.equal(reps.size,expected,[...reps.keys()].join(','));let samples=0,pairs=0,preexistingDisplayDisagreements=0;
 const outcome=(p,raw)=>{e.qa.current={...p,answered:false};e.el('answer').value=raw;e.qa.check();return e.el('feedback').innerHTML;};
 for(const mode of ['basic','advanced','mixed']){e.el('ruleMode').value=mode;for(let i=1;i<=300;i++){e.BatchMathRNG.random=rng(i*113+mode.length);const p=e.qa[rule]();samples++;for(const latex of [p.answerTex,batchmathToLatex(p.answerExpr).latex]){const t=tr(latex);assert.equal(t.status,'complete',p.id+': '+latex+': '+t.message);if(!e.qa.equivalent(t.input,p.answerExpr,p.vars)){assert.ok(rule==='quotient'&&p.id.startsWith('qa8-')&&latex===p.answerTex,p.id+': '+t.input);preexistingDisplayDisagreements++;}}}}
 for(const [name,p]of reps){for(const raw of [p.answerExpr,`(${p.answerExpr})+0`,p.answerExpr+'+12345','(1)/()']){const t=tr(batchmathToLatex(raw).latex);assert.notEqual(t.input,null,p.id+raw);assert.equal(outcome(p,t.input),outcome(p,raw),p.id+raw);pairs++;}assert.match(outcome(p,p.answerExpr),/Correct\./);assert.match(outcome(p,p.answerExpr+'+12345'),/Not quite/);}
 assert.equal(script(fs.readFileSync(root+target(rule),'utf8')),script(execFileSync('git',['show','d01896853c8af0950089714fdc2a7a8eccba23d0:'+target(rule)],{cwd:root,encoding:'utf8'})));
 report[rule]={samples,preexistingDisplayDisagreements,families:[...reps.keys()],gradingPairs:pairs};fs.writeFileSync(root+'tools/mathlive-batch1/artifacts/math.json',JSON.stringify(report,null,2));
});
test('inverse opt-in and grouping retain old derivative contract',()=>{
 assert.equal(translateDerivative('\\arcsin(x)').status,'unsupported');assert.equal(tr('\\arcsin(x)').input,'asin(x)');
 for(const x of ['\\frac{1}{\\frac{x}{1+x}}','x^{-3}','\\sqrt[3]{x^2+4}'])assert.equal(tr(x).status,'complete');
});
