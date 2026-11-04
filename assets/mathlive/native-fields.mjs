import {loadMathLive,verifyFonts,resetMathfield} from './runtime.mjs';
import {batchmathToLatex} from './answer-adapter.mjs';
import {bridgeKeypad,focusMathfield} from './keypad-bridge.mjs';

// Opt-in bridge for native/local inputs. Keep their original listeners, pads,
// checks and reset lifecycle available for legacy comparison and recovery.
export function installNativeFields({hostSelector,inputSelector,padSelector,contract,profile,label='Answer'}){
 if(new URLSearchParams(location.search).get('editor')==='legacy')return;
 const seen=new WeakSet(),groups=new Set(),api=window.BatchMathCalculusKeypad;
 function mount(host,inputs){
  inputs.forEach(input=>seen.add(input));
  const check=[...host.querySelectorAll('button')].find(b=>/^Check\b/.test(b.textContent));
  if(!check)return;
  const oldPads=padSelector?[...document.querySelectorAll(padSelector)].filter(p=>host.contains(p)||p.previousElementSibling===host):[];
  const records=inputs.map(input=>({input,field:null,display:input.style.display,clipped:input.classList.contains('bm-calc-source'),tab:input.getAttribute('tabindex'),aria:input.getAttribute('aria-hidden'),last:input.value})),padState=oldPads.map(p=>[p,p.style.display]);
  let active=0,clone,notice,ready=false,disposed=false;const removes=[];
  const alive=()=>host.isConnected&&inputs.every(i=>i.isConnected);
  const listen=(node,event,fn,capture=false)=>{node.addEventListener(event,fn,capture);removes.push(()=>node.removeEventListener(event,fn,capture));};
  function read(r){const result=contract.translate(r.field.value);r.last=r.input.value=result.input??(r.field.value.trim()?'?':'');if(notice)notice.hidden=result.status!=='unsupported';return result;}
  function sync(){records.forEach(read);}
  function importSource(r){if(r.input.value===r.last)return;const converted=(contract.toLatex||batchmathToLatex)(r.input.value);if(converted.latex===null)throw Error('Cannot import the current answer.');resetMathfield(r.field,converted.latex);r.last=r.input.value;}
  function reflect(){if(!ready)return;for(const r of records){if(!r.input.disabled)importSource(r);r.field.readOnly=r.input.disabled;r.field.setAttribute('aria-disabled',String(r.input.disabled));r.field.classList.toggle('wrong',r.input.classList.contains('wrong'));}for(const b of clone.querySelectorAll('button'))b.disabled=records[active].input.disabled;}
  function focus(){if(ready&&!records[active].input.disabled){reflect();focusMathfield(records[active].field);}}
  function dispose(){disposed=true;ready=false;removes.forEach(fn=>fn());watch.disconnect();records.forEach(r=>r.field?.remove());clone?.remove();notice?.remove();}
  function fallback(error){
   if(disposed)return;const saved=records.map(r=>{if(!ready||!r.field)return{raw:r.input.value};const result=contract.translate(r.field.value);return{raw:result.input??r.field.value,latex:result.input===null?r.field.value:''};});dispose();
   padState.forEach(([pad,display])=>pad.style.display=display);
   records.forEach((r,i)=>{r.input.style.display=r.display;if(!r.clipped)r.input.classList.remove('bm-calc-source');r.input.value=saved[i].raw;r.input.dataset.editor='legacy';for(const [name,value]of [['tabindex',r.tab],['aria-hidden',r.aria]])value===null?r.input.removeAttribute(name):r.input.setAttribute(name,value);});
   const note=document.createElement('p');note.className='bm-mathlive-notice';note.setAttribute('role','status');note.textContent='The standard answer editor is active. Your answer has been kept.';host.append(note);
   for(const item of saved)if(item.latex){const copy=document.createElement('textarea');copy.readOnly=true;copy.className='bm-mathlive-recovery';copy.setAttribute('aria-label','Saved MathLive answer in LaTeX');copy.value=item.latex;note.append(copy);}
   console.warn(label+' MathLive fallback:',error);if(!records[active].input.disabled)records[active].input.focus();
  }
  const guard=fn=>(...args)=>{if(disposed)return;try{return fn(...args);}catch(error){fallback(error);}};
  const watch=new MutationObserver(guard(reflect)),group={connected:alive,dispose};groups.add(group);
  (async()=>{
   const {MathfieldElement}=await loadMathLive();if(!alive())return;
   if(getComputedStyle(document.documentElement).getPropertyValue('--bm-mathlive-pilot-ready').trim()!=='1')throw Error('MathLive styling is unavailable.');
   for(const r of records){const f=r.field=new MathfieldElement();f.hidden=true;f.className='bm-mathlive-answer bm-mathlive-dynamic';f.setAttribute('aria-label',r.input.getAttribute('aria-label')||label);f.mathVirtualKeyboardPolicy='manual';f.smartSuperscript=false;f.smartFence=false;f.removeExtraneousParentheses=false;f.defaultMode='math';r.input.before(f);}
   await verifyFonts(alive);if(!alive())return;
   records.forEach(r=>{const converted=(contract.toLatex||batchmathToLatex)(r.input.value);if(converted.latex===null)throw Error('Cannot import the current answer.');resetMathfield(r.field,converted.latex);r.last=r.input.value;});
   clone=bridgeKeypad(api.createPad(profile),{active:()=>records[active].input.disabled?null:records[active].field,onChange:guard(sync),onCheck:guard(()=>{sync();check.click();}),onUnsupported:message=>fallback(Error(message)),onError:fallback});
   if(oldPads.length)oldPads.at(-1).after(clone);else host.append(clone);
   notice=document.createElement('button');notice.type='button';notice.hidden=true;notice.className='bm-mathlive-notice';notice.textContent='Use the standard editor for this notation';notice.addEventListener('click',()=>fallback(Error('Requested standard editor.')));host.append(notice);
   records.forEach((r,index)=>{
    r.input.classList.add('bm-calc-source');r.input.tabIndex=-1;r.input.setAttribute('aria-hidden','true');r.input.dataset.editor='mathlive';r.field.hidden=false;
    listen(r.field,'input',guard(()=>read(r)));listen(r.field,'focusin',()=>{active=index;reflect();});
    listen(r.input,'focus',guard(e=>{e.stopImmediatePropagation();active=index;focus();}),true);
    listen(r.field,'pointerdown',guard(()=>{active=index;focus();}),true);
    listen(r.field,'keydown',guard(e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&!r.input.disabled){sync();r.input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',cancelable:true}));}}else if(e.shiftKey&&e.code==='Digit6'&&e.key!=='^'){e.preventDefault();e.stopImmediatePropagation();r.field.executeCommand('moveToSuperscript');read(r);}}),true);
    listen(r.field,'beforeinput',e=>{if(e.inputType==='insertLineBreak')e.preventDefault();});
    watch.observe(r.input,{attributes:true,attributeFilter:['disabled','class']});
   });
   listen(check,'click',guard(sync),true);listen(window,'error',e=>{if(e.filename?.includes('/mathlive/vendor/mathlive/'))fallback(e.error||Error(e.message));});
   padState.forEach(([pad])=>pad.style.display='none');ready=true;reflect();focus();
  })().catch(fallback);
 }
 function scan(){for(const group of groups)if(!group.connected()){group.dispose();groups.delete(group);}for(const host of document.querySelectorAll(hostSelector)){const inputs=[...host.querySelectorAll(inputSelector)].filter(i=>!seen.has(i));if(inputs.length)mount(host,inputs);}}
 const observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true});scan();
}
