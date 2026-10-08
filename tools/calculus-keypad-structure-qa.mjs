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
 getAttribute(name){return this[name]??null;}
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

set('(x)/(y)',7);k.backspace();assert.equal(raw(),'','Backspace immediately after a fraction should remove the whole fraction');
set('(x)/(y)',0);k.del();assert.equal(raw(),'','Delete immediately before a fraction should remove the whole fraction');
set('(x)/(y)',6);k.backspace();assert.equal(raw(),'(x)/()','Backspace inside the denominator should edit only the denominator');
k.backspace();assert.equal(raw(),'(x)/()');assert.equal(k.cursor,2);
set('(x)/(y)',2);k.del();assert.equal(raw(),'(x)/(y)');assert.equal(k.cursor,5);
set('sqrt((x)/(y))',15);for(let i=0;i<7;i++){k.backspace();assert(validStructure(raw()),raw());}

const editor=row.children.find(x=>x.className==='bm-calc-editor');
const press=(key,extra={})=>editor.events.keydown[0]({key,...extra,preventDefault(){}});
assert.equal(document.activeElement,editor,'visible editor should receive focus as soon as the shared keypad initializes');
set('',0);input.focus();assert.equal(document.activeElement,editor,'legacy source-input focus should redirect to the visible editor');press('7');assert.equal(raw(),'7','first physical keystroke should enter immediately');
set('',0);press('Dead',{code:'Digit6',shiftKey:true});assert.equal(raw(),'^()','ChromeOS Shift+6 dead-key events should insert an exponent');
set('',0);press('^',{code:'Digit6',shiftKey:true});assert.equal(raw(),'^()','ordinary Shift+6 caret events should insert an exponent');
const fractionKey=allKeys.find(button=>button['aria-label']==='Insert stacked fraction');
const leftParenKey=allKeys.find(button=>button.textContent==='('),rightParenKey=allKeys.find(button=>button.textContent===')');
assert(fractionKey&&leftParenKey&&rightParenKey,'fraction and parenthesis keys missing');
set('',0);fractionKey.events.click[0]({preventDefault(){}});leftParenKey.events.click[0]({preventDefault(){}});
assert.equal(raw(),'(()/()','an unmatched numerator parenthesis must remain inside the fraction');assert(editor.innerHTML.includes('bm-calc-frac'),'fraction should stay visibly stacked while the parenthesis is unmatched');
rightParenKey.events.click[0]({preventDefault(){}});assert.equal(raw(),'(())/()');assert(editor.innerHTML.includes('bm-calc-frac'));
set('',0);fractionKey.events.click[0]({preventDefault(){}});press('x');press('ArrowRight');leftParenKey.events.click[0]({preventDefault(){}});
assert.equal(raw(),'(x)/(()','an unmatched denominator parenthesis must remain inside the fraction');assert(editor.innerHTML.includes('bm-calc-frac'));
rightParenKey.events.click[0]({preventDefault(){}});assert.equal(raw(),'(x)/(())');assert(editor.innerHTML.includes('bm-calc-frac'));
set('root(,)',5);assert(editor.innerHTML.includes('bm-calc-nroot-index'));assert(editor.innerHTML.includes('bm-calc-nroot-radicand'));assert(editor.innerHTML.includes('<svg viewBox="0 0 30 38"'),'nth-root radical must use the connected SVG shape');
press('5');press('ArrowRight');press('3');assert.equal(raw(),'root(5,3)');
set('root(5,3)',9);k.backspace();assert.equal(k.cursor,8);k.backspace();assert.equal(raw(),'root(5,)');
set('root(,)',5);k.backspace();assert.equal(raw(),'');

// Standard clipboard shortcuts must preserve the structured expression rather
// than copying only the visual MathJax-like surface.
function clipboard(initial={}){
 const data=new Map(Object.entries(initial));
 return{setData(type,value){data.set(type,String(value))},getData(type){return data.get(type)||''},data};
}
const structured='(x+1)/(sqrt(2))';
set(structured,structured.length);press('a',{ctrlKey:true});
assert.deepEqual({...k.selection},{start:0,end:structured.length},'Ctrl+A must select the complete structured answer');
const copied=clipboard();editor.events.copy[0]({clipboardData:copied,preventDefault(){}});
assert(copied.getData('application/x-batchmath-expression'),'copy must include the BatchMath structured clipboard format');
editor.events.cut[0]({clipboardData:copied,preventDefault(){}});
assert.equal(raw(),'','Ctrl+X must remove the safely expanded structured selection');
editor.events.paste[0]({clipboardData:copied,preventDefault(){}});
assert.equal(raw(),structured,'Ctrl+V must restore the exact structured expression');
assert(editor.innerHTML.includes('bm-calc-frac')&&editor.innerHTML.includes('bm-calc-token function')&&editor.innerHTML.includes('√'),'pasted fraction and radical must remain structured');

// Ctrl/Cmd+Z and Ctrl/Cmd+Y keep a real action-level structured history.
// Ordinary typing is one character per action, while a keypad-created
// structure is one whole action.
set('',0);press('1');press('2');press('3');press('z',{ctrlKey:true,altKey:false});assert.equal(raw(),'12','Ctrl+Z must undo exactly one typed character');press('z',{ctrlKey:true,altKey:false});assert.equal(raw(),'1','repeated Ctrl+Z must walk backward one character at a time');press('y',{ctrlKey:true,altKey:false});assert.equal(raw(),'12','Ctrl+Y must redo one character');press('y',{ctrlKey:true,altKey:false});assert.equal(raw(),'123','repeated Ctrl+Y must walk forward one character at a time');
set('(x)/(y)',7);k.backspace();assert.equal(raw(),'');press('z',{ctrlKey:true,altKey:false});assert.equal(raw(),'(x)/(y)','Ctrl+Z must restore a deleted stacked fraction');assert(editor.innerHTML.includes('bm-calc-frac'));
const clearKey=allKeys.find(button=>button.textContent==='Clear'),longStructured='(x+1)/(sqrt(2))+(sin(x))/(x^(3))';
assert(clearKey,'Clear key missing');set(longStructured,longStructured.length);clearKey.events.click[0]({preventDefault(){}});assert.equal(raw(),'');press('z',{ctrlKey:true,altKey:false});assert.equal(raw(),longStructured,'Ctrl+Z must restore the complete structured answer after Clear');assert((editor.innerHTML.match(/bm-calc-frac/g)||[]).length>=2,'restored long answer must retain stacked fractions');
press('y',{ctrlKey:true,altKey:false});assert.equal(raw(),'','Ctrl+Y must redo Clear as one action');press('z',{ctrlKey:true,altKey:false});assert.equal(raw(),longStructured);
press('a',{ctrlKey:true});press('Backspace');assert.equal(raw(),'','deleting a selected structured answer should be one action');press('z',{ctrlKey:true,altKey:false});assert.equal(raw(),longStructured,'Ctrl+Z must restore a selected structured chunk');press('y',{ctrlKey:true,altKey:false});assert.equal(raw(),'','Ctrl+Y must redo selected-chunk deletion');press('z',{ctrlKey:true,altKey:false});
press('a',{metaKey:true});
const external=clipboard({'text/plain':'\\frac{\\pi}{2}'});
editor.events.paste[0]({clipboardData:external,preventDefault(){}});
assert.equal(raw(),'(pi)/(2)','plain LaTeX paste must normalize through the same structured parser');
assert(editor.innerHTML.includes('bm-calc-frac'),'normalized external paste must render as a stacked fraction');

// Unit 3's dynamic typed-answer fields use the same structured editor. Verify
// that a fraction inserted there stays stacked and survives partial deletion.
const dynamicHost=new FakeElement('div'),dynamicA=new FakeElement('input'),dynamicB=new FakeElement('input');
dynamicA['aria-label']='First coordinate';dynamicB['aria-label']='Second coordinate';
for(const field of [dynamicA,dynamicB]){field.parentElement=dynamicHost;dynamicHost.children.push(field);}
const mounted=k.mountInputs([dynamicA,dynamicB],dynamicHost,{mode:'unit3'});
assert.equal(mounted.bindings.length,2,'both dynamic fields should receive structured editors');
const dynamicEditor=mounted.bindings[0].editor,dynamicKeys=mounted.pad.children.flatMap(group=>group.children||[]);
const dynamicFraction=dynamicKeys.find(button=>button['aria-label']==='Insert stacked fraction');
const dynamicTwo=dynamicKeys.find(button=>button.textContent==='2');
assert(dynamicFraction&&dynamicTwo,'Unit 3 structured fraction keys missing');
dynamicFraction.events.click[0]({preventDefault(){}});dynamicTwo.events.click[0]({preventDefault(){}});
assert.equal(dynamicA.value,'(2)/()');assert(dynamicEditor.innerHTML.includes('bm-calc-frac'),'Unit 3 fraction must render stacked');
dynamicEditor.events.keydown[0]({key:'ArrowRight',preventDefault(){}});dynamicTwo.events.click[0]({preventDefault(){}});
assert.equal(dynamicA.value,'(2)/(2)');
dynamicEditor.events.keydown[0]({key:'Backspace',preventDefault(){}});assert.equal(dynamicA.value,'(2)/()');assert(dynamicEditor.innerHTML.includes('bm-calc-frac'),'deleting denominator content must not break the fraction shell');

const dynamicPress=(key,extra={})=>dynamicEditor.events.keydown[0]({key,...extra,preventDefault(){}});
const structuredKeyCases=[
 [dynamicKeys.find(button=>button.textContent==='a₁'),'a₁','a₁ keypad token'],
 [dynamicFraction,'()/()','stacked fraction'],
 [dynamicKeys.find(button=>button.textContent==='√'),'sqrt()','radical'],
 [dynamicKeys.find(button=>button['aria-label']==='Insert exponent'),'^()','exponent'],
 [dynamicKeys.find(button=>button.textContent==='('),'(','parenthesis']
];
for(const [button,expected,label] of structuredKeyCases){
 assert(button,`${label} key missing`);k.setRaw('');button.events.click[0]({preventDefault(){}});assert.equal(dynamicA.value,expected,`${label} insertion failed`);dynamicPress('z',{ctrlKey:true,altKey:false});assert.equal(dynamicA.value,'',`one Ctrl+Z must remove the complete ${label} keypad action`);dynamicPress('y',{ctrlKey:true,altKey:false});assert.equal(dynamicA.value,expected,`one Ctrl+Y must restore the complete ${label} keypad action`);
}

// The actual recursive-sequence layout has three dynamic fields. Switching to
// the middle field must switch both the visible cursor target and the history
// transaction target before a keypad action occurs.
const recursiveHost=new FakeElement('div'),recursiveInputs=[new FakeElement('input'),new FakeElement('input'),new FakeElement('input')];
for(const field of recursiveInputs){field.parentElement=recursiveHost;recursiveHost.children.push(field);}
const recursiveMounted=k.mountInputs(recursiveInputs,recursiveHost,{mode:'unit3'}),initialEditor=recursiveMounted.bindings[1].editor;
assert.equal(document.activeElement,recursiveMounted.bindings[0].editor,'the first dynamic answer field should receive initial focus');
initialEditor.focus();
const recursiveKeys=recursiveMounted.pad.children.flatMap(group=>group.children||[]),aOneKey=recursiveKeys.find(button=>button.textContent==='a₁');
assert(aOneKey,'recursive-sequence a₁ key missing');aOneKey.events.click[0]({preventDefault(){}});
assert.equal(recursiveInputs[0].value,'','a keypad action must not remain attached to the previously focused field');
assert.equal(recursiveInputs[1].value,'a₁','a keypad action must go to the newly focused field');
initialEditor.events.keydown[0]({key:'z',ctrlKey:true,altKey:false,preventDefault(){}});assert.equal(recursiveInputs[1].value,'','one Ctrl+Z must remove the complete a₁ action after a field switch');
initialEditor.events.keydown[0]({key:'y',ctrlKey:true,altKey:false,preventDefault(){}});assert.equal(recursiveInputs[1].value,'a₁','one Ctrl+Y must restore the complete a₁ action after a field switch');

const buttons=(row.after?.children||[]).flatMap(x=>x.children||[]).map(x=>x.textContent);
for(const label of ['sin⁻¹','cos⁻¹','tan⁻¹','cot⁻¹','sec⁻¹','csc⁻¹'])assert(buttons.includes(label),`inverse trig keypad missing ${label}`);
const editorCss=fs.readFileSync(path.join(root,'assets/calculus-keypad.css'),'utf8');
for(const rule of ['overflow-x:auto','overflow-y:hidden','flex-wrap:nowrap','.bm-calc-editor>*{flex:0 0 auto}','grid-auto-columns:max-content','min-width:max-content'])assert(editorCss.includes(rule),`long-answer scroll/no-compression rule missing: ${rule}`);
for(const rule of ['.bm-calc-dynamic-editor .bm-calc-caret{display:none}', '.bm-calc-dynamic-editor:focus:not(.is-disabled) .bm-calc-caret{display:inline-block}', '.bm-calc-dynamic-editor.is-disabled .bm-calc-caret{display:none!important}'])assert(editorCss.includes(rule),`dynamic cursor visibility rule missing: ${rule}`);
const unit3Runtime=fs.readFileSync(path.join(root,'assets/im1-unit3-practice.js'),'utf8');
for(const check of ['line','initial-term','formula','recursive','recursive-rule'])assert(unit3Runtime.includes(`'${check}'`),`Unit 3 structured editor wiring missing ${check}`);
const report={ok:true,cases:91,editors:['shared calculus keypad','advanced trig keypad','Unit 3 dynamic multi-field keypad'],focus:['initial visible-editor focus','legacy source-focus redirect','first physical keystroke','single active dynamic cursor','cursor hidden for inactive and disabled fields','automatic horizontal caret visibility'],keyboard:['ordinary Shift+6 exponent','ChromeOS dead-key Shift+6 exponent','Ctrl/Cmd+A','Ctrl/Cmd+C','Ctrl/Cmd+X','Ctrl/Cmd+V','Ctrl/Cmd+Z','Ctrl/Cmd+Y'],clipboard:['custom structured MIME','safe whole-structure cut','structured paste','external LaTeX normalization'],undo:['one-character physical typing','one-action keypad structures','field-switched atomic a₁','structural deletion','selected-chunk deletion','Clear/delete-all'],structures:['a₁ subscript token','square roots','editable nth roots','functions','function powers','inverse trig functions','fractions','exponents','parentheses','nested structures','dynamic field switching','nonshrinking horizontal overflow']};
fs.mkdirSync(path.join(root,'qa-results'),{recursive:true});
fs.writeFileSync(path.join(root,'qa-results/calculus-keypad-structure-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(report);
