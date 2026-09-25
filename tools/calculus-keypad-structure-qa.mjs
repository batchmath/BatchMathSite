#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let document;
class FakeElement{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.dataset={};this.value='';this.disabled=false;this.tabIndex=0;this.innerHTML='';this.children=[];this.events={};this.classList={add(){},remove(){},toggle(){},contains(){return false}};}
 addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
 dispatchEvent(event){for(const fn of this.events[event.type]||[])fn(event);return true;}
 setAttribute(name,value){this[name]=String(value);}
 appendChild(child){this.children.push(child);child.parentElement=this;return child;}
 insertAdjacentElement(where,child){if(where==='afterend'){this.after=child;return child}return this.parentElement?.appendChild(child)||child;}
 closest(selector){if(selector==='.answer-row')return row;return null;}
 focus(){if(document)document.activeElement=this;this.dispatchEvent({type:'focus'});}
 getBoundingClientRect(){return{left:0,width:10};}
}
const row=new FakeElement('div'),input=new FakeElement('input');
input.dataset.bmCalcKeypad='derivative';input.dataset.bmInverseTrigKeypad='1';input.parentElement=row;row.children.push(input);
document={readyState:'complete',body:new FakeElement('body'),activeElement:input,querySelector:s=>['input[data-bm-calc-keypad]','input[data-bm-inverse-trig-keypad="1"]'].includes(s)?input:null,createElement:t=>new FakeElement(t),addEventListener(){}};
class FakeEvent{constructor(type,opts={}){this.type=type;Object.assign(this,opts);}}
const sandbox={window:{},document,Event:FakeEvent,MutationObserver:class{observe(){}},getComputedStyle:()=>({display:'none'}),console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'assets/calculus-keypad.js'),'utf8'),sandbox,{filename:'calculus-keypad.js'});
const k=sandbox.window.BatchMathCalculusKeypad;
assert(k,'keypad API missing');
const raw=()=>k.raw;
const set=(value,cursor)=>{k.setRaw(value);k.setCursor(cursor);};
const validStructure=value=>{
 let depth=0;for(const ch of value){if(ch==='(')depth++;if(ch===')'&&--depth<0)return false;}return depth===0&&!/\^\($|\)\/\($/.test(value);
};

set('()/()',1);k.backspace();assert.equal(raw(),'');
set('()/()',0);k.del();assert.equal(raw(),'');
set('sqrt(()/())',6);k.backspace();assert.equal(raw(),'sqrt()');k.backspace();assert.equal(raw(),'');
set('sqrt(sin())',9);k.backspace();assert.equal(raw(),'sqrt()');k.backspace();assert.equal(raw(),'');
set('sin()',4);k.backspace();assert.equal(raw(),'');
set('ln()',0);k.del();assert.equal(raw(),'');
set('asin()',5);k.backspace();assert.equal(raw(),'');
set('acsc()',0);k.del();assert.equal(raw(),'');
set('^()',2);k.backspace();assert.equal(raw(),'');
set('^()',0);k.del();assert.equal(raw(),'');

// A function name now has a usable caret stop before its opening parenthesis.
// This is the keypad workflow for entering sec^2(x), csc^2(x), and similar forms.
set('sec(x)',4);k.move(-1);assert.equal(k.cursor,3);
const allKeys=(row.after?.children||[]).flatMap(group=>group.children||[]);
const exponentKey=allKeys.find(button=>button['aria-label']==='Insert exponent');
const twoKey=allKeys.find(button=>button.textContent==='2');
assert(exponentKey&&twoKey,'required keypad keys missing');
exponentKey.events.click[0]({preventDefault(){}});
twoKey.events.click[0]({preventDefault(){}});
assert.equal(raw(),'sec^(2)(x)');
set('tan(x)',0);k.move(1);assert.equal(k.cursor,3);k.move(1);assert.equal(k.cursor,4);

set('(x)/(y)',7);k.backspace();assert.equal(raw(),'(x)/(y)');assert.equal(k.cursor,6);k.backspace();assert.equal(raw(),'(x)/()');
k.backspace();assert.equal(raw(),'(x)/()');assert.equal(k.cursor,2);
set('(x)/(y)',2);k.del();assert.equal(raw(),'(x)/(y)');assert.equal(k.cursor,5);
set('sqrt((x)/(y))',15);for(let i=0;i<7;i++){k.backspace();assert(validStructure(raw()),raw());}

const editor=row.children.find(x=>x.className==='bm-calc-editor');
const press=key=>editor.events.keydown[0]({key,preventDefault(){}});
assert.equal(document.activeElement,editor,'visible editor should receive focus as soon as the shared keypad initializes');
set('',0);input.focus();assert.equal(document.activeElement,editor,'legacy source-input focus should redirect to the visible editor');press('7');assert.equal(raw(),'7','first physical keystroke should enter immediately');
set('root(,)',5);assert(editor.innerHTML.includes('bm-calc-nroot-index'));assert(editor.innerHTML.includes('bm-calc-nroot-radicand'));
press('5');press('ArrowRight');press('3');assert.equal(raw(),'root(5,3)');
set('root(5,3)',9);k.backspace();assert.equal(k.cursor,8);k.backspace();assert.equal(raw(),'root(5,)');
set('root(,)',5);k.backspace();assert.equal(raw(),'');

const buttons=(row.after?.children||[]).flatMap(x=>x.children||[]).map(x=>x.textContent);
for(const label of ['sin⁻¹','cos⁻¹','tan⁻¹','cot⁻¹','sec⁻¹','csc⁻¹'])assert(buttons.includes(label),`inverse trig keypad missing ${label}`);
const report={ok:true,cases:43,editors:['shared calculus keypad','advanced trig keypad'],focus:['initial visible-editor focus','legacy source-focus redirect','first physical keystroke'],structures:['square roots','editable nth roots','functions','function powers','inverse trig functions','fractions','exponents','nested structures']};
fs.mkdirSync(path.join(root,'qa-results'),{recursive:true});
fs.writeFileSync(path.join(root,'qa-results/calculus-keypad-structure-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(report);
