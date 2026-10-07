#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
class FakeClassList{
  constructor(){this.values=new Set();}
  add(...names){for(const name of names)this.values.add(name);}
  remove(...names){for(const name of names)this.values.delete(name);}
  contains(name){return this.values.has(name);}
  toggle(name,force){const next=force===undefined?!this.values.has(name):Boolean(force);if(next)this.values.add(name);else this.values.delete(name);return next;}
}
let activeDocument=null;
class FakeElement{
  constructor(tag='div'){
    this.tagName=tag.toUpperCase();this.dataset={};this.events={};this.children=[];this.classList=new FakeClassList();
    this.value='';this.innerHTML='';this.style={};this.disabled=false;this.readOnly=false;this.type='text';this.tabIndex=0;this.attributes={};
  }
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
  dispatchEvent(event){for(const fn of this.events[event.type]||[])fn(event);return true;}
  setAttribute(name,value){this.attributes[name]=String(value);this[name]=String(value);}
  getAttribute(name){return this.attributes[name]??this[name]??null;}
  appendChild(child){this.children.push(child);child.parentElement=this;return child;}
  insertAdjacentElement(where,child){if(where==='beforebegin')this.before=child;else if(where==='afterend')this.after=child;child.parentElement=this.parentElement;return child;}
  closest(selector){if(selector==='.question-area')return this.questionArea||this.parentElement;if(selector.startsWith('['))return null;return null;}
  querySelectorAll(selector){const out=[];const walk=node=>{for(const child of node.children||[]){if(selector==='button'&&child.tagName==='BUTTON')out.push(child);walk(child);}};walk(this);return out;}
  focus(){if(activeDocument)activeDocument.activeElement=this;}
  blur(){}
  contains(target){if(target===this)return true;return this.children.some(child=>child.contains?.(target));}
  getBoundingClientRect(){return{left:0,width:20};}
  setSelectionRange(){}
}
class FakeEvent{constructor(type,opts={}){this.type=type;Object.assign(this,opts);}}
function clipboard(initial={}){
  const data=new Map(Object.entries(initial));
  return{setData(type,value){data.set(type,String(value))},getData(type){return data.get(type)||''}};
}

// Calculus Prep exact editor runtime clipboard check.
{
  const document={activeElement:null,createElement:tag=>new FakeElement(tag),querySelector:()=>null,elementFromPoint:()=>null};
  activeDocument=document;
  const sandbox={window:{},document,Event:FakeEvent,console};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/calc-prep-exact-editor.js'),'utf8'),sandbox,{filename:'calc-prep-exact-editor.js'});
  const input=new FakeElement('input'),editor=new FakeElement('div'),keypad=new FakeElement('div');
  const api=sandbox.window.BMExactEditor.mount({input,editor,keypad,onCheck(){}});
  const raw='sqrt(2)+3/4';api.set(raw);
  editor.events.keydown[0]({key:'a',ctrlKey:true,altKey:false,preventDefault(){}});
  const board=clipboard();editor.events.copy[0]({clipboardData:board,preventDefault(){}});
  assert(board.getData('application/x-batchmath-exact'),'exact editor must copy its structured format');
  editor.events.cut[0]({clipboardData:board,preventDefault(){}});
  assert.equal(api.raw,'','exact editor Ctrl+X must remove the selected answer');
  editor.events.paste[0]({clipboardData:board,preventDefault(){}});
  assert.equal(api.raw,raw,'exact editor Ctrl+V must restore the structured answer');
  editor.events.keydown[0]({key:'a',metaKey:true,altKey:false,preventDefault(){}});
  editor.events.paste[0]({clipboardData:clipboard({'text/plain':'\\frac{\\pi}{2}'}),preventDefault(){}});
  assert.equal(api.raw,'pi/2','exact editor must normalize external LaTeX paste');
  assert(editor.innerHTML.includes('answer-frac'),'exact editor pasted fraction must remain stacked');
}

// Integrated Math fraction editor runtime clipboard check.
{
  const area=new FakeElement('div'),input=new FakeElement('input');input.dataset.bmKeypad='fraction';input.value='3/4';input.parentElement=area;input.questionArea=area;area.children.push(input);
  const document={
    readyState:'complete',activeElement:null,documentElement:new FakeElement('html'),
    createElement:tag=>new FakeElement(tag),
    querySelectorAll:selector=>selector==='input[data-bm-keypad]'?[input]:[],
    getElementById:()=>null,addEventListener(){}
  };
  activeDocument=document;
  const window={matchMedia:()=>({matches:false}),scrollTo(){}};window.window=window;window.document=document;
  const sandbox={window,document,navigator:{maxTouchPoints:0},Event:FakeEvent,MutationObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),console};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/im1-keypad.js'),'utf8'),sandbox,{filename:'im1-keypad.js'});
  const editor=input.before;assert(editor&&editor.className==='bm-fraction-editor','IM1 fraction editor did not initialize');
  editor.events.keydown[0]({key:'a',ctrlKey:true,altKey:false,preventDefault(){}});
  const board=clipboard();editor.events.copy[0]({clipboardData:board,preventDefault(){}});
  assert(board.getData('application/x-batchmath-im1-fraction'),'IM1 editor must copy its fraction structure');
  editor.events.cut[0]({clipboardData:board,preventDefault(){}});
  assert.equal(input.value,'','IM1 Ctrl+X must remove the selected fraction');
  editor.events.paste[0]({clipboardData:board,preventDefault(){}});
  assert.equal(input.value,'3/4','IM1 Ctrl+V must restore the complete fraction');
  assert(editor.innerHTML.includes('bm-im1-frac'),'IM1 pasted fraction must remain stacked');
}

const report={ok:true,editors:['Calculus Prep exact editor','Integrated Math stacked-fraction editor'],shortcuts:['Ctrl/Cmd+A','Ctrl/Cmd+C','Ctrl/Cmd+X','Ctrl/Cmd+V'],structuredPaste:true};
const out=path.join(ROOT,'qa-results');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'clipboard-editor-runtime-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(report);
