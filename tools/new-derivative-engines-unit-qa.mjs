#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const checkerSource=fs.readFileSync(path.join(ROOT,'assets/derivative-expression-checker.js'),'utf8');
const errors=[];let checks=0;
const assert=(condition,message)=>{checks++;if(!condition)errors.push(message);};

function harness(scriptName,options){
  const elements=new Map(),windowListeners=new Map();let seed=10901;
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  function element(id){
    if(elements.has(id))return elements.get(id);
    const listeners=new Map();
    const node={id,value:id==='practice-type'?'mixed':'',disabled:false,innerHTML:'',textContent:'',className:'',hidden:false,style:{display:''},
      get selectedOptions(){return[{textContent:this.value}]},
      addEventListener(type,callback){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(callback);},
      dispatch(type,event={}){for(const callback of listeners.get(type)||[])callback({preventDefault(){},key:'',...event});},
      focus(){},setAttribute(name,value=''){this[name]=value;}
    };
    elements.set(id,node);return node;
  }
  const document={getElementById:element};
  const context={console,Math,URLSearchParams,location:{search:'?bm_qa=1'},document};
  context.window=context;context.globalThis=context;
  context.addEventListener=(type,callback)=>{if(!windowListeners.has(type))windowListeners.set(type,[]);windowListeners.get(type).push(callback);};
  context.BatchMathRNG={random};context.BatchMathCalculusKeypad={reset(){},focus(){}};context.BMAnalytics={ensurePracticeStarted(){},problemGenerated(){},answerChecked(){},solutionRevealed(){}};
  vm.createContext(context);vm.runInContext(checkerSource,context,{filename:'derivative-expression-checker.js'});
  vm.runInContext(fs.readFileSync(path.join(ROOT,'assets',scriptName),'utf8'),context,{filename:scriptName});
  for(const callback of windowListeners.get('load')||[])callback();
  assert(!!context.__BM_CURRENT_PROBLEM,`${scriptName}: no initial problem was generated`);
  for(const option of options){
    element('practice-type').value=option;element('practice-type').dispatch('change');
    const ids=new Set();
    for(let i=0;i<120;i++){
      const problem=context.__BM_CURRENT_PROBLEM;ids.add(problem.id);
      assert(option==='mixed'||problem.group===option,`${scriptName}/${option}: generated group ${problem.group}`);
      assert(problem.steps.length>=3,`${scriptName}/${option}: walkthrough has fewer than three steps`);
      assert(!/(^|[^0-9])1x(?:\^|\b)/.test(problem.math),`${scriptName}/${option}: unnecessary coefficient 1 in ${problem.math}`);
      if(scriptName==='nested-chain-rule-practice.js'){
        const api=context.BatchMathDerivativeExpressions,fnTree=api.parse(problem.functionExpr),derivativeTree=api.parse(problem.answerExpr);
        const samples=[.73,.91,1.11,1.29,1.47,1.73,2.03].flatMap((x,index)=>[
          {x,f:u=>.42*Math.sin(u)+.31*u+2.1,fp:u=>.42*Math.cos(u)+.31,g:u=>.36*Math.cos(u)+.27*u-.2,gp:u=>-.36*Math.sin(u)+.27},
          {x:x+.013*(index+1),f:u=>-.28*Math.sin(u)+.47*u+2.4,fp:u=>-.28*Math.cos(u)+.47,g:u=>.51*Math.cos(u)-.19*u+.35,gp:u=>-.51*Math.sin(u)-.19}
        ]);
        let stableChecks=0;
        for(const sample of samples){
          const claimed=api.evaluate(derivativeTree,sample);
          if(!Number.isFinite(claimed)||Math.abs(claimed)>2e6)continue;
          const h=2e-6/Math.max(1,Math.sqrt(Math.abs(claimed))),plus={...sample,x:sample.x+h},minus={...sample,x:sample.x-h};
          const numerical=(api.evaluate(fnTree,plus)-api.evaluate(fnTree,minus))/(2*h);
          if(!Number.isFinite(numerical)||Math.abs(numerical)>2e6)continue;
          const close=Math.abs(numerical-claimed)<=3e-3*Math.max(1,Math.abs(numerical),Math.abs(claimed));
          assert(close,`${scriptName}/${option}: derivative check failed for ${problem.id}; numerical=${numerical}, claimed=${claimed}; f=${problem.functionExpr}; d=${problem.answerExpr}`);
          if(close&&++stableChecks>=3)break;
        }
        assert(stableChecks>=2,`${scriptName}/${option}: fewer than two stable numerical checks for ${problem.id}`);
      }
      element('answer').value=problem.answerExpr;element('submit').dispatch('click');
      assert(element('feedback').innerHTML.includes('Correct.'),`${scriptName}/${option}: rejected its own answer ${problem.answerExpr}`);
      element('next').dispatch('click');
    }
    assert(ids.size>=10,`${scriptName}/${option}: only ${ids.size} unique problems in 120 generations`);
  }
  const problem=context.__BM_CURRENT_PROBLEM;element('answer').value='999999';element('submit').dispatch('click');
  assert(element('feedback').innerHTML.includes('Not quite.'),`${scriptName}: obvious wrong answer was accepted for ${problem.id}`);
  assert(element('feedback').innerHTML.includes('Step-by-step walkthrough'),`${scriptName}: wrong feedback omitted walkthrough`);
  const source=fs.readFileSync(path.join(ROOT,'assets',scriptName),'utf8');
  assert(/Show Explanation/.test(source),`${scriptName}: no correct-answer explanation control`);
  assert(/method\.hidden=false/.test(source),`${scriptName}: explanation reveal handler missing`);
}

harness('derivative-at-point-practice.js',['mixed','basic','product','quotient','trig','exponential','logarithmic','invtrig','implicit']);
harness('nested-chain-rule-practice.js',['mixed','foundation','three','four','five']);

const checkerContext={window:{}};checkerContext.window.window=checkerContext.window;vm.createContext(checkerContext);vm.runInContext(checkerSource,checkerContext);
const api=checkerContext.window.BatchMathDerivativeExpressions;
const contexts=[1.35,1.5,1.7].map(x=>({x,f:u=>.4*Math.sin(u)+.3*u+2,fp:u=>.4*Math.cos(u)+.3,g:u=>.5*Math.cos(u)-.2*u,gp:u=>-.5*Math.sin(u)-.2}));
assert(api.equivalent("f'(sin(x))*cos(x)",'fp(sin(x))*cos(x)',contexts),"checker rejected prime notation");
assert(api.equivalent('3*x^2*gp(x^3)','gp(x^3)*3*x^2',contexts),"checker rejected reordered product factors");
assert(api.equivalent("g'(sin3x)(3cos3x)",'gp(sin(3*x))*3*cos(3*x)',contexts),"checker rejected equivalent shorthand trig notation from reported answer");
assert(!api.equivalent('fp(sin(x))','fp(sin(x))*cos(x)',contexts),"checker accepted a missing chain-rule factor");

console.log('New derivative engines unit QA');
console.log(`Result: ${errors.length?'FAIL':'PASS'}`);
console.log(`Checks: ${checks}`);
console.log(`Errors: ${errors.length}`);
for(const error of errors.slice(0,100))console.log(`- ${error}`);
if(errors.length>100)console.log(`- ... ${errors.length-100} additional errors`);
if(errors.length)process.exit(1);
