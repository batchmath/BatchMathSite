import {loadMathLive,verifyFonts,resetMathfield} from './runtime.mjs';
import {batchmathToLatex} from './answer-adapter.mjs';
import {bridgeKeypad,focusMathfield} from './keypad-bridge.mjs';

// Page-opt-in adapter for the existing public mountInputs contract. It owns no
// questions, scores, checks, Continue/Next policy or field-type inference.
export function installDynamicFields({profiles,label}){
  if(new URLSearchParams(location.search).get('editor')==='legacy')return;
  const api=window.BatchMathCalculusKeypad,originalMount=api.mountInputs,originalFocus=api.focus;
  const groups=new Set();let latest=null;
  api.mountInputs=function(inputs,host,options={}){
    const mount=originalMount.call(api,inputs,host,options);
    const contract=profiles[options.mode];latest={mount,adapter:null};
    if(mount&&contract){const record=latest;record.adapter=attach(mount,host,options,contract,()=>latest===record,label);groups.add(record.adapter);}
    return mount;
  };
  api.focus=()=>{if(latest?.adapter?.ready)latest.adapter.focus();else originalFocus();};
  const observer=new MutationObserver(()=>{for(const group of groups)if(!group.connected){group.dispose();groups.delete(group);}});
  observer.observe(document.getElementById('choices'),{childList:true,subtree:true});
  // Existing stage renderers focus their new section after typesetting. Route
  // that established focus to its enabled field without affecting feedback.
  document.addEventListener('focusin',event=>{
    if(!event.target.matches?.('.staged-part'))return;
    const input=event.target.querySelector('input.staged-exact-input:not(:disabled)');
    if(input)input.focus();
  });

  function attach(mount,host,options,contract,isLatest,label){
    const records=mount.bindings.map(binding=>({binding,input:binding.input,editor:binding.editor,field:null,latex:'',display:binding.editor.style.display}));
    const pad=mount.pad,display=pad.style.display,removers=[];let clone,active=0,ready=false,disposed=false,unsupported;
    const alive=()=>!disposed&&host.isConnected&&records.every(r=>r.input.isConnected);
    const listen=(node,event,fn,capture=false)=>{node.addEventListener(event,fn,capture);removers.push(()=>node.removeEventListener(event,fn,capture));};
    function focus(){const r=records[active];if(r&&!r.input.disabled&&alive())focusMathfield(r.field);}
    function read(r){
      r.latex=r.field.value;const result=contract.translate(r.latex);
      r.input.value=result.input??(r.latex.trim()?'?':'');r.input.dataset.mathliveStatus=result.status;
      if(unsupported)unsupported.hidden=result.status!=='unsupported';
      return result;
    }
    function sync(){for(const r of records)read(r);}
    function reflect(){
      for(const r of records){r.field.readOnly=r.input.disabled;r.field.setAttribute('aria-disabled',String(r.input.disabled));r.field.classList.toggle('wrong',r.input.classList.contains('wrong'));}
      if(clone){clone.hidden=pad.hidden;for(const b of clone.querySelectorAll('button'))b.disabled=records[active].input.disabled;}
    }
    function dispose(){
      disposed=true;ready=false;for(const remove of removers)remove();watch.disconnect();
      for(const r of records)r.field?.remove();clone?.remove();unsupported?.remove();
    }
    function fallback(error){
      if(disposed)return;
      if(!alive()){dispose();return;}
      const saved=records.map(r=>{
        if(!r.field||!ready)return {r,raw:r.input.value,latex:''};
        try{r.latex=r.field.value;}catch{/* retain the last input snapshot */}
        const parsed=contract.translate(r.latex);return {r,raw:parsed.input??r.latex,latex:parsed.input===null?r.latex:''};
      });
      dispose();pad.style.display=display;
      for(const {r,raw} of saved){r.editor.style.display=r.display;r.binding.raw=raw;r.input.value=raw;r.input.dataset.editor='legacy';delete r.input.dataset.mathliveStatus;}
      // Activating the original editor restores the actual legacy binding and
      // its view through its public API, including fractions and roots.
      for(const {r,raw} of saved){r.editor.dispatchEvent(new FocusEvent('focus'));api.setRaw(raw);}
      latest?.mount?.bindings[0]?.editor.dispatchEvent(new FocusEvent('focus'));
      const note=document.createElement('p');note.className='bm-mathlive-notice';note.setAttribute('role','status');note.textContent='The standard answer editor is active. Your answer has been kept.';host.append(note);
      for(const {latex} of saved)if(latex){const copy=document.createElement('textarea');copy.className='bm-mathlive-recovery';copy.readOnly=true;copy.setAttribute('aria-label','Saved MathLive answer in LaTeX');copy.value=latex;note.append(copy);}
      console.warn(label+' MathLive fallback:',error);
      if(isLatest())originalFocus();
    }
    const guard=fn=>(...args)=>{if(disposed)return;try{return fn(...args);}catch(error){fallback(error);}};
    const watch=new MutationObserver(guard(reflect));
    const control={get ready(){return ready;},get connected(){return alive();},focus:guard(focus),dispose};
    (async()=>{
      const {MathfieldElement}=await loadMathLive();if(!alive())return;
      if(getComputedStyle(document.documentElement).getPropertyValue('--bm-mathlive-pilot-ready').trim()!=='1')throw Error('MathLive styling is unavailable.');
      for(const r of records){
        const field=new MathfieldElement();r.field=field;field.className='bm-mathlive-answer bm-mathlive-dynamic';field.hidden=true;field.setAttribute('aria-label',r.input.getAttribute('aria-label')||'Answer');field.mathVirtualKeyboardPolicy='manual';field.smartSuperscript=false;field.smartFence=false;field.removeExtraneousParentheses=false;field.defaultMode='math';r.editor.after(field);
      }
      await verifyFonts(alive);if(!alive())return;
      for(const r of records){
        const converted=(contract.toLatex||batchmathToLatex)(r.input.value);if(converted.latex===null)throw Error('Cannot import this legacy answer.');
        resetMathfield(r.field,r.input.value.trim()?converted.latex:'');r.latex=r.field.value;
      }
      clone=bridgeKeypad(pad,{active:()=>records[active].input.disabled?null:records[active].field,onCheck:guard(()=>{sync();options.onCheck?.();}),onChange:guard(sync),onUnsupported:message=>fallback(Error(message)),onError:fallback});pad.after(clone);
      unsupported=document.createElement('button');unsupported.type='button';unsupported.className='bm-mathlive-notice';unsupported.textContent='Use the standard editor for this notation';unsupported.hidden=true;listen(unsupported,'click',()=>fallback(Error('Requested standard editor.')));host.append(unsupported);
      records.forEach((r,index)=>{
        r.editor.style.display='none';r.field.hidden=false;r.input.dataset.editor='mathlive';
        listen(r.field,'focusin',()=>{active=index;reflect();});
        listen(r.field,'pointerdown',guard(()=>{active=index;focus();}),true);
        listen(r.input,'focus',guard(e=>{e.stopImmediatePropagation();active=index;focus();}),true);
        listen(r.field,'input',guard(()=>read(r)));
        listen(r.field,'keydown',guard(e=>{
          if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&!r.input.disabled){sync();options.onCheck?.();}}
          else if(e.shiftKey&&e.code==='Digit6'&&e.key!=='^'){e.preventDefault();e.stopImmediatePropagation();r.field.executeCommand('moveToSuperscript');read(r);}
        }),true);
        listen(r.field,'beforeinput',e=>{if(e.inputType==='insertLineBreak')e.preventDefault();});
        listen(r.field,'paste',guard(e=>{
          const custom=e.clipboardData?.getData('application/x-batchmath-expression');if(!custom)return;
          const raw=JSON.parse(custom).raw.replace(/\uE000/g,'(').replace(/\uE001/g,')/(').replace(/\uE002/g,')');
          const converted=(contract.toLatex||batchmathToLatex)(raw);if(converted.latex===null)throw Error('Structured paste is unsupported.');
          e.preventDefault();e.stopImmediatePropagation();r.field.insert(converted.latex);read(r);
        }),true);
        watch.observe(r.input,{attributes:true,attributeFilter:['disabled','class']});
      });
      listen(host,'click',guard(e=>{if(e.target.closest('button')?.classList.contains('staged-check'))sync();}),true);
      listen(host,'keydown',e=>{if(e.key==='Enter'&&e.repeat){e.preventDefault();e.stopImmediatePropagation();}},true);
      listen(window,'error',e=>{if(e.filename?.includes('/mathlive/vendor/mathlive/'))fallback(e.error||Error(e.message));});
      watch.observe(pad,{attributes:true,attributeFilter:['hidden']});pad.style.display='none';ready=true;reflect();
      if(isLatest()&&!records[active].input.disabled)focus();
    })().catch(fallback);
    return control;
  }
}
