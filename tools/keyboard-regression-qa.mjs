#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=name=>fs.readFileSync(path.join(ROOT,'assets',name),'utf8');
let checks=0;
function keyboardHarness(route='/ap-calculus/test/'){
  const listeners=[];let advances=0;
  const next={hidden:false,disabled:false,style:{display:'block'},getClientRects:()=>[{}],click(){advances++;this.hidden=true;}};
  const fresh={...next,hidden:true,click(){advances++;}};
  const feedback={textContent:'Explanation',classList:{contains:x=>x==='shown'}};
  const document={readyState:'loading',body:null,addEventListener(){},querySelector(s){return s==='button#next'?next:s==='button#new'?fresh:s==='#feedback, .feedback'?feedback:null;}};
  const window={addEventListener(type,fn,capture){if(type==='keydown')listeners.push({fn,capture});}};
  const sb={window,document,navigator:{},location:{pathname:route,protocol:'http:'},getComputedStyle:b=>({visibility:'visible',...b.style})};
  vm.runInNewContext(source('pwa.js'),sb);
  function press(overrides={},native=()=>{}){
    const e={key:'Enter',target:{closest:()=>null},defaultPrevented:false,stopped:false,preventDefault(){this.defaultPrevented=true},stopImmediatePropagation(){this.stopped=true},...overrides};
    for(const {fn,capture} of listeners.filter(x=>x.capture)){fn(e);if(e.stopped)break;}
    if(!e.stopped)native(e);
    for(const {fn,capture} of listeners.filter(x=>!x.capture)){if(!e.stopped)fn(e);}
    return e;
  }
  return {next,fresh,feedback,press,listeners,get advances(){return advances;}};
}
for(const route of ['/ap-calculus/test/','/calculus-prep/test/']){
  let h=keyboardHarness(route),native=0;
  const e=h.press({},()=>native++);
  assert.equal(h.advances,1);assert.equal(native,0);assert.equal(e.defaultPrevented,true);checks++;
  h=keyboardHarness(route);h.next.hidden=true;
  const submit=h.press({},()=>{native++;h.next.hidden=false;});
  assert.equal(h.advances,0);assert.equal(submit.defaultPrevented,false);
  h.press();assert.equal(h.advances,1);checks++;
  h=keyboardHarness(route);h.press({repeat:true});assert.equal(h.advances,0);checks++;
  h=keyboardHarness(route);h.next.hidden=true;h.press({repeat:true},()=>assert.fail('repeat submitted'));checks++;
  for(const props of [{isComposing:true},{ctrlKey:true},{metaKey:true},{altKey:true},{shiftKey:true},{key:'Escape'},{target:{closest:()=>({})}}]){
    h=keyboardHarness(route);h.press(props);assert.equal(h.advances,0);checks++;
  }
  for(const state of [{hidden:true},{disabled:true},{style:{display:'none'}},{style:{visibility:'hidden'}}]){
    h=keyboardHarness(route);Object.assign(h.next,state);h.press();assert.equal(h.advances,0);checks++;
  }
  h=keyboardHarness(route);h.next.hidden=true;h.fresh.hidden=false;h.press();assert.equal(h.advances,1);checks++;
  h=keyboardHarness(route);h.next.hidden=true;h.fresh.hidden=false;h.feedback.textContent='';h.press();assert.equal(h.advances,0);checks++;
  h=keyboardHarness(route);h.press();h.next.hidden=false;h.press();assert.equal(h.advances,2);checks++;
  h=keyboardHarness(route);h.next.hidden=true;h.fresh.hidden=false;h.feedback.dataset={answerState:'invalid'};h.press();assert.equal(h.advances,0);checks++;
}
const im1=keyboardHarness('/im1/test/');im1.press();assert.equal(im1.advances,0);checks++;
// Run the real RNG/reporting API and analytics API together, online and offline.
for(const online of [true,false]){
  const document={body:null,readyState:'loading',visibilityState:'visible',getElementById:()=>null,querySelectorAll:()=>[],addEventListener(){}};
  const location={search:'?bm_seed=1040000',pathname:'/ap-calculus/test/'};
  const window={location,addEventListener(){},BM_ANALYTICS_CONFIG:{course:'ap_calculus_ab',engineId:'qa',generatorVersion:'1'}};
  const storage={getItem:()=>null,setItem(){},removeItem(){}};
  const sb={window,document,location,navigator:{onLine:online},localStorage:storage,sessionStorage:storage,URLSearchParams,setTimeout:()=>0,clearTimeout(){},console};
  vm.createContext(sb);vm.runInContext(source('reproducible-rng.js'),sb);vm.runInContext(source('problem-tracking.js'),sb);
  window.BMAnalytics.problemGenerated({id:'one'});assert.equal(window.BatchMathRepro.problemCount,1);checks++;
  window.BMAnalytics.answerChecked({id:'one'},false);assert.equal(window.BatchMathRepro.problemCount,1);checks++;
  // Identical IDs must still count separately when genuinely generated again.
  window.BMAnalytics.problemGenerated({id:'one'});assert.equal(window.BatchMathRepro.problemCount,2);checks++;
}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>['node_modules','tools','qa-results','.git'].includes(e.name)?[]:e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of walk(ROOT).filter(f=>/\.(html|js)$/.test(f)&&!f.endsWith('/problem-tracking.js'))){
  assert.doesNotMatch(fs.readFileSync(file,'utf8'),/BatchMathRepro\??\.noteProblem\(/,`generation must be recorded only by problemGenerated: ${file}`);
}
checks++;
console.log(`Keyboard/accounting executable regressions: PASS (${checks} cases; production scripts in Node VM, not a browser)`);
