import fs from 'node:fs';import vm from 'node:vm';
export {rng} from '../mathlive-power-rule/engine.mjs';
import {rng,root} from '../mathlive-power-rule/engine.mjs';export {root};
export const target=rule=>`ap-calculus/unit-2-derivatives/topics/the-${rule}-rule/practice/index.html`;
export const script=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(m=>!m[1].includes('src=')&&m[2].includes('function product()'))[2];
export const instrument=s=>s.replace('function boot(){makeProblem()}',`globalThis.ruleQA={product,quotient,check,makeProblem,equivalent,expandedPolynomial,get current(){return current},set current(p){current=p},get attempts(){return attempts}};function boot(){makeProblem()}`);
export function engine(rule){const elements={};const el=id=>elements[id]??={value:id==='category'?rule:id==='ruleMode'?'mixed':'',innerHTML:'',style:{},addEventListener(){},focus(){}};
 const window={addEventListener(){},MathJax:null},document={getElementById:el,querySelectorAll(){return[]},addEventListener(){}};const box={window,document,console,Math,BatchMathRNG:{random:rng(1)}};vm.createContext(box);
 for(const name of ['answer-normalization','derivative-rule-factors'])vm.runInContext(fs.readFileSync(root+'assets/'+name+'.js','utf8'),box);
 box.BatchMathDerivativeRuleFactors=window.BatchMathDerivativeRuleFactors;vm.runInContext(instrument(script(fs.readFileSync(root+target(rule),'utf8'))),box);return {...box,qa:box.ruleQA,el};}
export const family=p=>p.factorKinds?'wide:'+p.factorKinds.join('/'):p.id.startsWith('qb')?'qb-poly':p.id.split('-')[0];
export function representatives(rule){const e=engine(rule),found=new Map();for(const mode of ['basic','advanced']){e.el('ruleMode').value=mode;for(let i=1;i<=1600;i++){e.BatchMathRNG.random=rng(i*719+mode.length);const p=e.qa[rule]();if(!found.has(family(p)))found.set(family(p),p);}}return found;}
