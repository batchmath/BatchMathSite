import fs from 'node:fs';
import vm from 'node:vm';
import {root,rng} from '../mathlive-power-rule/engine.mjs';
export {root,rng};
export const target='ap-calculus/unit-2-derivatives/topics/the-chain-rule/practice/index.html';
export const html=fs.readFileSync(root+target,'utf8');
export const engineScript=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(m=>!m[1].includes('src=')&&m[2].includes('function chainSimple'))[2];
export function instrument(source){
  return source.replace('function boot(){makeProblem()}',`globalThis.chainQA={chain,chainSimple,chainMultiple,normalizeInput,parseExpression,evalTree,equivalent,expandedPolynomial,check,makeProblem,
    get current(){return current},set current(p){current=p},get attempts(){return attempts},get correct(){return correctCount}};
    function boot(){makeProblem()}`);
}
export function engine(seed=1){
  const elements={};
  const el=id=>elements[id]??={value:id==='category'?'chain':id==='chain-mode'?'simple':'',innerHTML:'',textContent:'',className:'',disabled:false,style:{},addEventListener(){},focus(){}};
  const document={getElementById:el,addEventListener(){},querySelectorAll(){return[];}};
  const window={addEventListener(){},MathJax:null};
  const box={document,window,Math,console,BatchMathRNG:{random:rng(seed)}};vm.createContext(box);
  vm.runInContext(fs.readFileSync(root+'assets/answer-normalization.js','utf8'),box);
  vm.runInContext(instrument(engineScript(html)),box);
  return {...box,el,qa:box.chainQA};
}
export const modes=['simple','multiple','other','all'];
const trig=['sin','cos','tan','sec','csc','cot'];
export function familyKey(p){
  const a=p.id.split('-');
  return a[0]==='coj'?`coj-${a[2]}-${a[3]}-${a[8]}`:a[0]==='csj'?'csj-cube':a[0];
}
export function expectedFamilies(mode){
  const combinations=others=>['prod','quot'].flatMap(rule=>trig.flatMap(fn=>others.map(other=>`coj-${rule}-${fn}-${other}`)));
  if(mode==='simple')return ['csj-cube','csj1','csj2','csj3','csj6'];
  if(mode==='multiple')return ['cmj1','cmj2','cmj3','cmj5'];
  if(mode==='other')return combinations(['cube','poly']);
  return ['csj-cube',...Array.from({length:6},(_,i)=>'csj'+(i+1)),...Array.from({length:8},(_,i)=>'cmj'+(i+1)),...combinations(['cube','poly','exp'])];
}
export function representatives(mode='all'){
  const {qa,el,BatchMathRNG}=engine();el('chain-mode').value=mode;
  const found=new Map(),expected=expectedFamilies(mode);
  for(let i=1;i<=12000&&found.size<expected.length;i++){
    BatchMathRNG.random=rng(i*719+mode.length);const p=qa.chain(),key=familyKey(p);if(!found.has(key))found.set(key,p);
  }
  if(found.size!==expected.length)throw Error('Missing actual generator families in '+mode);
  return [...found.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([family,problem])=>({family,problem}));
}
