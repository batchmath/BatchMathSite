import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
export const root=fileURLToPath(new URL('../../',import.meta.url));
export const baseline='58d98cda663ff21b0a7e9f434bf0e5ca504ae03b';
export const slugs={basic:'basic-integrals',ftc:'fundamental-theorem-of-calculus-and-integral-rules',newton:'evaluating-definite-integrals-with-a-limit-and-summation',separable:'separable-differential-equations'};
export const target=key=>`ap-calculus/${key==='separable'?'unit-5-differential-equations':'unit-4-integrals'}/topics/${slugs[key]}/practice/`;
export function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export function engine(seed=1){
  const window={BatchMathRNG:{random:rng(seed)}};
  const box={window,document:{addEventListener(){},querySelectorAll(){return[];}},console,Math:Object.create(Math)};box.Math.random=()=>window.BatchMathRNG.random();vm.createContext(box);
  for(const f of ['derivative-expression-checker','unit4-exact-answers','ap-topic-generators','unit5-core','unit5-answers','unit5-separable'])vm.runInContext(fs.readFileSync(root+'assets/'+f+'.js','utf8'),box,{filename:f+'.js'});
  return window;
}
export function instrument(source){
  const i=source.lastIndexOf('})();');
  const hook=`globalThis.advancedQA={get current(){return current},get attempted(){return attempted},get correct(){return correct},make,
  family(name){const api=window.BatchMathAPTopicGenerators,prior=api.get;api.get=slug=>{const gen=prior(slug);return opts=>{for(let i=0;i<10000;i++){const p=gen(opts);if((p.unit4Meta?.family||p.unit5Meta?.family||p.family||p.variant)===name)return p;}throw Error('Missing family '+name);};};try{make();}finally{api.get=prior;}},
  load(problem){const api=window.BatchMathAPTopicGenerators,prior=api.get;api.get=()=>()=>problem;try{make();}finally{api.get=prior;}}};`;
  return source.slice(0,i)+hook+source.slice(i);
}
