import {loadMathLive,verifyFonts,resetMathfield} from './runtime.mjs';
import {batchmathToLatex} from './answer-adapter.mjs';
import {bridgeKeypad,focusMathfield} from './keypad-bridge.mjs';

// Opt-in bridge for native/local inputs. Keep their original listeners, pads,
// checks and reset lifecycle available for legacy comparison and recovery.
export function installNativeFields({hostSelector,inputSelector,padSelector,contract,profile,label='Answer',whenVisible=false,submitSelector,onSubmit,onRestore}){
 if(new URLSearchParams(location.search).get('editor')==='legacy')return;
 const seen=new WeakSet(),groups=new Set(),api=window.BatchMathCalculusKeypad;
 function mount(host,inputs){
  inputs.forEach(input=>seen.add(input));
  const spec=typeof contract==='function'?contract({host,inputs}):contract;
  const check=submitSelector?document.querySelector(submitSelector):[...host.querySelectorAll('button')].find(b=>/^Check\b/.test(b.textContent));
  if(!check)return;
  const oldPads=[],padState=[];
  const records=inputs.map(input=>({input,spec:spec.fieldContract?.(input)||spec,field:null,latex:'',display:input.style.display,clipped:input.classList.contains('bm-calc-source'),tab:input.getAttribute('tabindex'),aria:input.getAttribute('aria-hidden'),last:input.value}));
  let active=0,clone,notice,ready=false,disposed=false,question=window.BatchMathRepro?.problemCount;const removes=[];
  const alive=()=>host.isConnected&&inputs.every(i=>i.isConnected);
  const listen=(node,event,fn,capture=false)=>{node.addEventListener(event,fn,capture);removes.push(()=>node.removeEventListener(event,fn,capture));};
  function read(r){r.latex=r.field.value;const result=r.spec.translate(r.latex);const previous=r.input.value;r.last=r.input.value=result.input??(r.latex.trim()?'?':'');if(r.input.value!==previous)r.spec.onInput?.(r.input,result);if(notice)notice.hidden=result.status!=='unsupported';return result;}
  function sync(){records.forEach(read);}
  function syncForCheck(){sync();window.BatchMathAnswers?.normalizeAnswerInputs?.(document);records.forEach(r=>r.last=r.input.value);}
  function importSource(r,force=false){if(!force&&r.input.value===r.last)return;const converted=(r.spec.toLatex||batchmathToLatex)(r.input.value);if(converted.latex===null)throw Error('Cannot import the current answer.');resetMathfield(r.field,r.input.value.trim()?converted.latex:'');r.latex=r.field.value;r.last=r.input.value;}
  function reflect(){if(!ready)return;const currentQuestion=window.BatchMathRepro?.problemCount,changed=currentQuestion!==question;question=currentQuestion;for(const r of records){
   // Reused empty inputs do not change value when a new problem starts. Clear
   // their old Undo/inline-shortcut snapshots without serializing or editing the answer.
   if(changed)resetMathfield(r.field,r.field.value);
   if(!r.input.disabled)importSource(r);if(r.spec.visible){const visible=!!r.spec.visible(r.input);if(r.field.hidden===visible)r.field.hidden=!visible;}r.field.readOnly=r.input.disabled;r.field.setAttribute('aria-disabled',String(r.input.disabled));r.field.classList.toggle('wrong',r.input.classList.contains('wrong'));}const visible=records.filter(r=>r.field.getClientRects().length);if(whenVisible&&visible.length&&!visible.includes(records[active]))active=records.indexOf(visible[0]);selectPad();const hide=Boolean(whenVisible&&!visible.length||records[active].spec.hideWhenDisabled&&records.every(r=>r.input.disabled));if(clone.hidden!==hide)clone.hidden=hide;if(whenVisible)for(const[pad,display]of padState)if(pad===check)pad.style.display=visible.length?'none':display;for(const b of clone.querySelectorAll('button'))b.disabled=records[active].input.disabled;}
  function focus(){if(ready&&!records[active].input.disabled){reflect();focusMathfield(records[active].field);}}
  function dispose(){disposed=true;ready=false;removes.forEach(fn=>fn());watch.disconnect();records.forEach(r=>r.field?.remove());clone?.remove();notice?.remove();}
  function fallback(error){
   if(disposed)return;const saved=records.map(r=>{
    if(!ready||!r.field)return{raw:r.input.value};
    try{r.latex=r.field.value;}catch{/* retain the last input snapshot */}
    let result;try{result=r.spec.translate(r.latex);}catch{result={input:null};}
    return{raw:result.input??r.latex,latex:result.input===null?r.latex:''};
   });dispose();
   padState.forEach(([pad,display])=>pad.style.display=display);
   records.forEach((r,i)=>{r.input.style.display=r.display;if(!r.clipped)r.input.classList.remove('bm-calc-source');r.input.value=saved[i].raw;r.input.dataset.editor='legacy';for(const [name,value]of [['tabindex',r.tab],['aria-hidden',r.aria]])value===null?r.input.removeAttribute(name):r.input.setAttribute(name,value);onRestore?.(r.input,saved[i].raw);r.input.dispatchEvent(new Event('input',{bubbles:true}));});
   const note=document.createElement('p');note.className='bm-mathlive-notice';note.setAttribute('role','status');note.textContent='The standard answer editor is active. Your answer has been kept.';host.append(note);
   for(const item of saved)if(item.latex){const copy=document.createElement('textarea');copy.readOnly=true;copy.className='bm-mathlive-recovery';copy.setAttribute('aria-label','Saved MathLive answer in LaTeX');copy.value=item.latex;note.append(copy);}
   console.warn(label+' MathLive fallback:',error);if(!records[active].input.disabled)records[active].input.focus();
  }
  const guard=fn=>(...args)=>{if(disposed)return;try{return fn(...args);}catch(error){fallback(error);}};
  const watch=new MutationObserver(guard(reflect)),group={connected:alive,dispose,refresh:guard(reflect)};groups.add(group);
  const submit=guard(()=>{syncForCheck();if(onSubmit)onSubmit();else check.click();});let shownMode;
  function selectPad(){
   const r=records[active],mode=r.spec.keypad||(typeof profile==='function'?profile({host,inputs,input:r.input}):profile);
   if(clone&&shownMode===mode)return;
   const originalPad=api.createPad(mode);
   for(const button of originalPad.querySelectorAll('button')){
    if(r.spec.toggleNegative&&button.textContent.trim()==='−')button.setAttribute('aria-label','Toggle negative sign');
    if(r.spec.literalDecimal&&button.textContent.trim()==='.')button.setAttribute('aria-label','Decimal point in a literal number');
   }
   const next=bridgeKeypad(originalPad,{active:()=>records[active].input.disabled?null:records[active].field,onChange:guard(sync),onCheck:submit,onUnsupported:message=>fallback(Error(message)),onError:fallback});
   if(clone)clone.replaceWith(next);else if(oldPads.length)oldPads.at(-1).after(next);else host.append(next);clone=next;shownMode=mode;
  }
  (async()=>{
   const {MathfieldElement}=await loadMathLive();if(!alive())return;
   if(getComputedStyle(document.documentElement).getPropertyValue('--bm-mathlive-pilot-ready').trim()!=='1')throw Error('MathLive styling is unavailable.');
   for(const r of records){const f=r.field=new MathfieldElement();f.hidden=true;f.className='bm-mathlive-answer bm-mathlive-dynamic';f.setAttribute('aria-label',r.input.getAttribute('aria-label')||r.input.labels?.[0]?.textContent||label);if(r.input.getAttribute('aria-describedby'))f.setAttribute('aria-describedby',r.input.getAttribute('aria-describedby'));f.mathVirtualKeyboardPolicy='manual';f.smartSuperscript=false;f.smartFence=false;f.removeExtraneousParentheses=false;f.defaultMode='math';r.input.before(f);}
   await verifyFonts(alive);if(!alive())return;
   records.forEach(r=>{const converted=(r.spec.toLatex||batchmathToLatex)(r.input.value);if(converted.latex===null)throw Error('Cannot import the current answer.');resetMathfield(r.field,r.input.value.trim()?converted.latex:'');r.latex=r.field.value;r.last=r.input.value;});
   if(padSelector)for(const pad of document.querySelectorAll(padSelector))if(host.contains(pad)||pad.previousElementSibling===host){oldPads.push(pad);padState.push([pad,pad.style.display]);}
   selectPad();
   notice=document.createElement('button');notice.type='button';notice.hidden=true;notice.className='bm-mathlive-notice';notice.textContent='Use the standard editor for this notation';notice.addEventListener('click',()=>fallback(Error('Requested standard editor.')));host.append(notice);
   records.forEach((r,index)=>{
    r.input.classList.add('bm-calc-source');r.input.tabIndex=-1;r.input.setAttribute('aria-hidden','true');r.input.dataset.editor='mathlive';r.field.hidden=false;
    listen(r.field,'input',guard(()=>read(r)));listen(r.field,'focusin',guard(()=>{active=index;reflect();}));
    listen(r.input,'input',guard(reflect));
    listen(r.input,'batchmath:mathlive-reset',guard(()=>importSource(r,true)));
    listen(r.input,'focus',guard(e=>{e.stopImmediatePropagation();active=index;focus();}),true);
    listen(r.field,'pointerdown',guard(()=>{active=index;focus();}),true);
    listen(r.field,'keydown',guard(e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&!r.input.disabled){if(onSubmit)submit();else{sync();r.input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',cancelable:true}));}}}else if(r.spec.onKey?.(e,r.field)){e.preventDefault();e.stopImmediatePropagation();read(r);}else if(e.shiftKey&&e.code==='Digit6'&&e.key!=='^'){e.preventDefault();e.stopImmediatePropagation();r.field.executeCommand('moveToSuperscript');read(r);}}),true);
    listen(r.field,'beforeinput',e=>{if(e.inputType==='insertLineBreak')e.preventDefault();});
    watch.observe(r.input,{attributes:true,attributeFilter:['disabled','class','hidden']});
   });
   listen(check,'click',guard(syncForCheck),true);listen(window,'error',e=>{if(e.filename?.includes('/mathlive/vendor/mathlive/'))fallback(e.error||Error(e.message));});
   padState.forEach(([pad])=>pad.style.display='none');ready=true;reflect();focus();
  })().catch(fallback);
 }
 function scan(){for(const group of groups)if(!group.connected()){group.dispose();groups.delete(group);}else group.refresh();for(const host of document.querySelectorAll(hostSelector)){if(whenVisible&&!host.getClientRects().length)continue;const inputs=[...host.querySelectorAll(inputSelector)].filter(i=>!seen.has(i));if(inputs.length)mount(host,inputs);}}
 const observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true,...(whenVisible?{attributes:true,attributeFilter:['class','hidden']}:{})});scan();
}
