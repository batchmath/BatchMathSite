import {batchmathToLatex} from './answer-adapter.mjs';
import {bridgeKeypad,focusMathfield} from './keypad-bridge.mjs';

// A source-input adapter, not an engine: the caller retains generation,
// submission, scoring and progression. Legacy remains mounted for recovery.
export async function mountMathLiveAnswer({source,legacy,submit,translate}) {
  const oldEditor=source.previousElementSibling;
  const oldPad=source.closest('.answer-row').nextElementSibling;
  if(!oldEditor?.classList.contains('bm-calc-editor')||!oldPad?.classList.contains('bm-calc-keypad'))throw Error('Legacy editor is not ready.');
  const library=await Promise.race([
    import('./vendor/mathlive/mathlive.min.mjs'),
    new Promise((_,reject)=>setTimeout(()=>reject(Error('MathLive load timed out.')),8000))
  ]);
  const {MathfieldElement}=library;
  MathfieldElement.fontsDirectory=new URL('./vendor/mathlive/fonts/',import.meta.url).href;
  MathfieldElement.soundsDirectory=null;
  const mf=new MathfieldElement();
  mf.className='bm-mathlive-answer';mf.hidden=true;
  mf.setAttribute('aria-label',source.getAttribute('aria-label')||'Answer');
  mf.mathVirtualKeyboardPolicy='manual';
  mf.smartSuperscript=false;mf.smartFence=false;mf.removeExtraneousParentheses=false;
  mf.defaultMode='math';
  source.before(mf);
  try {
    // FontFace registration is asynchronous; an unknown family can otherwise
    // report success with an empty array. Keep legacy usable throughout this wait.
    for(let attempt=0;;attempt++) {
      const faces=[...document.fonts].filter(face=>face.family.startsWith('KaTeX_'));
      if(faces.some(face=>face.status==='error')||attempt===100)throw Error('MathLive fonts are unavailable.');
      if(faces.length===20&&faces.every(face=>face.status==='loaded'))break;
      await new Promise(resolve=>setTimeout(resolve,50));
    }
  } catch(error){mf.remove();throw error;}

  const original={reset:legacy.reset,focus:legacy.focus};
  const dispose=[];
  let active=true,lastLatex='',pad;
  const listen=(target,type,callback,options)=>{target.addEventListener(type,callback,options);dispose.push(()=>target.removeEventListener(type,callback,options));};
  function read() {
    lastLatex=mf.value;
    const result=translate(lastLatex);
    // A nonempty unsupported expression must never submit a previous valid
    // answer. '?' is deliberately outside this checker's grammar. Keep the
    // original LaTeX for recovery; never truncate placeholders into valid math.
    source.value=result.input??(lastLatex.trim()?'?':'');
    source.dataset.mathliveStatus=result.status;
    return result;
  }
  function recover(error) {
    if(!active)return;
    try{lastLatex=mf.value;}catch{/* keep the last input snapshot */}
    active=false;
    const result=translate(lastLatex);
    const recovered=result.input??lastLatex;
    for(const remove of dispose)remove();
    observer.disconnect();legacy.reset=original.reset;legacy.focus=original.focus;
    mf.remove();pad?.remove();oldEditor.hidden=false;oldPad.hidden=false;
    source.value=recovered;original.reset();
    delete source.dataset.mathliveStatus;
    source.dataset.editor='legacy';
    const notice=document.createElement('p');notice.className='bm-mathlive-notice';notice.setAttribute('role','status');
    notice.textContent='The standard answer editor is active. Your answer has been kept.';
    oldPad.after(notice);
    if(result.input===null&&lastLatex) {
      const recovery=document.createElement('textarea');recovery.className='bm-mathlive-recovery';
      recovery.readOnly=true;recovery.setAttribute('aria-label','Saved MathLive answer in LaTeX');recovery.value=lastLatex;
      notice.append(' Saved LaTeX:',recovery);
    }
    console.warn('Power Rule MathLive fallback:',error);
    if(!source.disabled)original.focus();
  }
  const guard=fn=>(...args)=>{if(!active)return;try{return fn(...args);}catch(error){recover(error);}};
  const reflect=()=>{
    mf.readOnly=source.disabled;
    mf.setAttribute('aria-disabled',String(source.disabled));
    for(const button of pad.querySelectorAll('button'))button.disabled=source.disabled;
    pad.classList.toggle('is-disabled',source.disabled);
  };
  const reset=()=>{
    const converted=batchmathToLatex(source.value);
    if(converted.latex===null)throw Error('Cannot import the current legacy answer.');
    mf.resetUndo();
    // Seed a fresh undo baseline *after* clearing history. The trailing TeX
    // space renders nothing and avoids setValue's identical-value early return
    // when both questions are blank. Otherwise the first new character cannot
    // be undone back to the empty field.
    mf.setValue((source.value.trim()?converted.latex:'')+' ',{silenceNotifications:true});
    // 0.111.1 resetUndo() does not clear inline-shortcut snapshots. Without a
    // selection command, typing x after a prior question ending in x can apply
    // the native xx -> times shortcut and restore that previous expression.
    // This public command flushes the buffer and establishes the expected caret.
    mf.executeCommand('moveToMathfieldEnd');
    lastLatex=mf.value;delete source.dataset.mathliveStatus;
  };
  pad=bridgeKeypad(oldPad,{
    active:guard(()=>source.disabled?null:mf),
    onCheck:guard(()=>submit.click()),onChange:guard(read),
    onUnsupported:message=>recover(Error(message)),onError:recover
  });
  oldPad.after(pad);
  const observer=new MutationObserver(guard(reflect));
  observer.observe(source,{attributes:true,attributeFilter:['disabled']});
  try{reset();reflect();}catch(error){
    // Initial import can refuse legacy syntax. At this point source is still
    // authoritative: do not overwrite it with an empty staging math-field.
    observer.disconnect();mf.remove();pad.remove();throw error;
  }
  oldEditor.hidden=true;oldPad.hidden=true;mf.hidden=false;
  source.dataset.editor='mathlive';
  legacy.reset=guard(()=>{original.reset();reset();});
  legacy.focus=guard(()=>{reflect();if(!source.disabled)focusMathfield(mf);});
  listen(source,'focus',guard(event=>{event.stopImmediatePropagation();legacy.focus();}),true);
  listen(mf,'pointerdown',guard(()=>{if(!source.disabled)focusMathfield(mf);}),true);
  listen(mf,'input',guard(()=>{read();source.dispatchEvent(new Event('input',{bubbles:true}));}));
  listen(submit,'click',guard(read),true);
  listen(mf,'keydown',guard(event=>{
    if(event.key==='Enter') {
      event.preventDefault();event.stopImmediatePropagation();
      if(!event.repeat){read();source.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',cancelable:true}));}
    } else if(event.shiftKey&&event.code==='Digit6'&&event.key!=='^') {
      event.preventDefault();event.stopImmediatePropagation();mf.executeCommand('moveToSuperscript');read();
    }
  }),true);
  listen(document,'keydown',event=>{
    // Focus moves to Next after grading. Stop repeat there as well as in mf.
    if(event.key==='Enter'&&event.repeat&&[mf,submit,document.getElementById('next')].includes(event.target)){
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);
  listen(mf,'beforeinput',event=>{if(event.inputType==='insertLineBreak')event.preventDefault();});
  listen(mf,'paste',guard(event=>{
    const custom=event.clipboardData?.getData('application/x-batchmath-expression');
    if(!custom)return; // MathLive owns ordinary text/LaTeX paste and copy/cut.
    const payload=JSON.parse(custom);
    const raw=payload.raw.replace(/\uE000/g,'(').replace(/\uE001/g,')/(').replace(/\uE002/g,')');
    const converted=batchmathToLatex(raw);
    event.preventDefault();event.stopImmediatePropagation();
    if(converted.latex===null)throw Error('Structured clipboard input is unsupported.');
    mf.insert(converted.latex);read();
  }),true);
  // Catch failures originating inside the pinned library too, after mounting.
  listen(window,'error',event=>{
    if(event.filename?.includes('/mathlive/vendor/mathlive/'))recover(event.error||Error(event.message));
  });
  if(!source.disabled&&[document.body,source,oldEditor].includes(document.activeElement))legacy.focus();
  return {field:mf};
}
