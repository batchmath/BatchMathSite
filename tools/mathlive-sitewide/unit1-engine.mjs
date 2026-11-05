import fs from 'node:fs';import vm from 'node:vm';import {Node,root,rng} from './applications-engine.mjs';import {instrument} from '../mathlive-advanced-pilot/engine.mjs';export {root,rng};
export const routes=JSON.parse(fs.readFileSync(root+'tools/mathlive-sitewide/unit1-routes.json'));
export function instrumentUnit1(code,kind){
 if(kind==='course')return instrument(code);
 const names=kind==='advanced'?'current:()=>current,make:newProblem,families,check,load:p=>{current=p;methodShown=false;}':kind==='location'?'current:()=>cur,make,check:checkLocation,families:discFamilies':'current:()=>current,make:makeProblem,check:submit,load:p=>{current=p;}';
 const at=code.lastIndexOf('})();');return code.slice(0,at)+'window.unit1QA={'+names+'};'+code.slice(at);
}
export function engine(route){
 const html=fs.readFileSync(root+route.path,'utf8'),els={},checked=[];let current;
 const el=id=>els[id]??=Object.assign(new Node(),{id,textContent:''});
 const b={console,Math:Object.create(Math),URLSearchParams,Promise,setTimeout(){},clearTimeout(){},requestAnimationFrame(){},NodeFilter:{SHOW_TEXT:4},location:{search:''},BatchMathRNG:{random:rng(1)},BMAnalytics:{ensurePracticeStarted(){},problemGenerated:p=>current=p,answerChecked:(p,ok)=>checked.push(ok),solutionRevealed(){}}},
 doc={activeElement:null,body:new Node(),createElement:t=>new Node(t),getElementById:el,addEventListener(){},querySelector(){return null},querySelectorAll(){return[]},createTreeWalker(){return{nextNode:()=>false}}};
 b.window=b;b.document=doc;b.Math.random=()=>b.BatchMathRNG.random();vm.createContext(b);
 for(const select of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){const options=[...select[2].matchAll(/<option\b([^>]*)value="([^"]*)"([^>]*)>/g)];el(select[1]).value=(options.find(m=>(m[1]+m[3]).includes('selected'))||options[0])?.[2]||'';}
 for(const file of [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]).filter(f=>/\/assets\/(?:unit1-|ap-topic-generators|answer-normalization)/.test(f)))vm.runInContext(fs.readFileSync(root+'assets/'+file.split('/').at(-1),'utf8'),b,{filename:file});
 if(route.kind==='course'){b.BM_TOPIC_PRACTICE={unit1:true,slug:'squeeze-course-practice'};vm.runInContext(instrumentUnit1(fs.readFileSync(root+'assets/ap-topic-practice.js','utf8'),'course'),b);}
 else{
  const code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>route.kind==='advanced'?s.includes('function newProblem('):route.kind==='location'?s.includes('function numeric(raw)'):s.includes('function makeProblem('));
  if(!code)throw Error('Controller missing '+route.path);vm.runInContext(instrumentUnit1(code,route.kind),b,{filename:route.path});
 }
 return{b,el,checked,html,get current(){return current},get qa(){return b.unit1QA||b.advancedQA},make(seed,mode){b.BatchMathRNG={random:rng(seed)};if(mode)el('category').value=mode;if(route.kind==='course')b.advancedQA.make();else b.unit1QA.make();return current;},
  check(p,raw){checked.length=0;if(route.kind==='course'){b.advancedQA.load(p);const input=el('choices').querySelector('input');input.value=raw;el('choices').querySelectorAll('button').find(n=>/^Check/.test(n.textContent)).click();return{ok:checked.at(-1),disabled:input.disabled,feedback:el('feedback').innerHTML};}
   b.unit1QA.load(p);p.answered=false;el('answer').value=raw;el('answer').disabled=false;el(route.kind==='advanced'?'check':'submit').disabled=false;el('feedback').innerHTML='';el('feedback').textContent='';delete el('feedback').dataset.answerState;b.unit1QA.check();return{ok:checked.at(-1),disabled:el('answer').disabled,feedback:el('feedback').innerHTML,text:el('feedback').textContent,state:el('feedback').dataset.answerState};
  }};
}
export function answer(p){const a=p.ans;if(a?.kind==='rat')return a.n+'/'+a.d;if(a?.kind==='exact')return a.input||a.text||String(a.value);if(a?.kind==='surd')return a.n+'*sqrt('+a.rad+')/'+a.d;if(a?.kind==='inf')return a.sign<0?'-infinity':'infinity';if(a?.kind==='dne')return'DNE';return String(p.numericAnswer);}
