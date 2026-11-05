import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
export const root=fileURLToPath(new URL('../../',import.meta.url));
export const target='ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/index.html';
export const html=fs.readFileSync(root+target,'utf8');
export function instrument(source) {
  // Test-only closure access. No QA hooks or replacement math in shipped HTML.
  return source.replace('function boot(){makeProblem()}',`globalThis.powerQA={powerRuleProblem,parseExpression,evalTree,equivalent,expandedPolynomial,check,makeProblem,
    get current(){return current},set current(p){current=p},get attempts(){return attempts},get correct(){return correctCount}};
    function boot(){makeProblem()}`);
}
export function rng(seed) {let s=seed>>>0;return ()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function engine(seed=1) {
  const elements={};
  const el=id=>elements[id]??=( {value:'',innerHTML:'',textContent:'',className:'',disabled:false,style:{},addEventListener(){},focus(){}} );
  const document={getElementById:el,addEventListener(){}};
  const window={addEventListener(){},MathJax:null};
  const box={document,window,Math,console,BatchMathRNG:{random:rng(seed)}};
  vm.createContext(box);
  const code=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(m=>!m[1].includes('src=')&&m[2].includes('function powerRuleProblem'))[2];
  vm.runInContext(instrument(code),box);
  return {...box,el,qa:box.powerQA};
}
