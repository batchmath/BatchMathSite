import {insertTemplate} from './templates.mjs';
const functionLatex={sin:'sin',cos:'cos',tan:'tan',sec:'sec',csc:'csc',cot:'cot',ln:'ln',log:'log',exp:'exp','sin⁻¹':'arcsin','cos⁻¹':'arccos','tan⁻¹':'arctan','cot⁻¹':'arccot','sec⁻¹':'arcsec','csc⁻¹':'arccsc'};
const commands={'←':'moveToPreviousChar','→':'moveToNextChar','↑':'moveUp','↓':'moveDown','⌫':'deleteBackward',Del:'deleteForward',Clear:'deleteAll'};
const literals={'±':'\\pm ','−':'-','·':'\\cdot ','π':'\\pi ','θ':'\\theta ','∞':'\\infty ','−∞':'-\\infty ','∪':'\\cup ','a₁':'a_{1}','aₙ':'a_{n}','aₙ₋₁':'a_{n-1}'};

export function focusMathfield(mf) {
  // Version-pinned DOM focus bridge. keyboard-sink is an officially exposed part.
  // MathfieldElement.focus() in 0.111.1 discards FocusOptions and unconditionally
  // calls scrollIntoView(). Refocusing it for each keypad key therefore moves
  // the page when the student has scrolled the answer above the visible keypad.
  // Native focus on the exposed sink dispatches MathLive's normal focus events,
  // preserves selection/physical typing, and avoids that forced viewport move.
  const sink=mf.shadowRoot?.querySelector('[part~="keyboard-sink"]');
  if(sink)sink.focus({preventScroll:true});
  else mf.focus(); // Retain initialization compatibility before its DOM exists.
}

export function redirectInputFocus(input,focus,enabled) {
  // A focus event is too late: focusing a clipped mirror can already scroll its
  // ancestor. Route the established programmatic call to the visible field.
  const own=Object.getOwnPropertyDescriptor(input,'focus'),original=input.focus;
  input.focus=function(...args){if(enabled())return focus();return original.apply(this,args);};
  return()=>{if(own)Object.defineProperty(input,'focus',own);else delete input.focus;};
}

function stableKeypadAction(mf,action) {
  // Cursor/delete commands also request host scrolling. Suppress only that
  // page-level request during this synchronous keypad action, using MathLive's
  // public callback. Its internal caret scrolling still runs. Physical typing,
  // direct focus, user scrolling and later question progression keep their
  // original policy; no viewport position is saved or forcibly restored.
  const previous=mf.onScrollIntoView;
  mf.onScrollIntoView=()=>{};
  // Its option copier turns null into {}, so remove the optional callback with
  // undefined when restoring the default; retain an existing function exactly.
  try{return action();}finally{mf.onScrollIntoView=previous??undefined;}
}

export function bridgeKeypad(originalPad,{active,onCheck,onChange,onUnsupported,onError}) {
  // cloneNode intentionally preserves the actual current layout, but not its private callbacks.
  const clone=originalPad.cloneNode(true);clone.dataset.experimentalBridge='true';
  for(const button of clone.querySelectorAll('button')) {
    const label=button.textContent.trim();const aria=button.getAttribute('aria-label')||'';
    button.addEventListener('pointerdown',e=>e.preventDefault());
    button.addEventListener('click',()=>{try{
      const mf=active();if(!mf)return;
      stableKeypadAction(mf,()=>{
      focusMathfield(mf);
      if(label==='Check'){onCheck();return;}
      if(aria==='Insert approach arrow')mf.insert('\\to ');
      else if(aria==='Toggle negative sign'){const value=mf.value.trim();mf.setValue(value.startsWith('-')?value.slice(1):'-'+value,{mode:'math'});mf.executeCommand('moveToMathfieldEnd');mf.mode='math';}
      else if(aria==='Decimal point in a literal number'){
        const value=mf.value.replace(/\\placeholder\{\}/g,'').trim();
        if(!value.includes('.')){if(!value||value==='-'){mf.setValue((value==='-'?'-':'')+'0.',{mode:'math'});mf.executeCommand('moveToMathfieldEnd');}else mf.insert('.');}
      }
      else if(label==='Clear'){mf.setValue(' ',{mode:'math'});mf.executeCommand('moveToMathfieldEnd');mf.mode='math';}
      else if(commands[label])mf.executeCommand(commands[label]);
      else if(aria.startsWith('Insert limit as n'))insertTemplate(mf,'limit');
      else if(aria.startsWith('Insert summation from k'))insertTemplate(mf,'sum');
      else if(aria==='Insert bare limit operator')mf.insert('\\lim ');
      else if(aria==='Insert subscript')mf.executeCommand('moveToSubscript');
      else if(aria==='Insert approach arrow')mf.insert('\\to ');
      else if(aria==='Insert stacked fraction')mf.insert('\\frac{#?}{#?}');
      else if(label==='xⁿ')mf.executeCommand('moveToSuperscript');
      else if(label==='√')mf.insert('\\sqrt{#?}');
      else if(label==='∛')mf.insert('\\sqrt[3]{#?}');
      else if(label==='ⁿ√')mf.insert('\\sqrt[#?]{#?}');
      else if(label==='|u|')mf.insert('\\left|#?\\right|');
      else if(button.classList.contains('function')&&['f','g','f′','g′'].includes(label))mf.insert(label[0]+(label.includes('′')?"'":'')+'(#?)');
      else if(label==='f(x)'||label==='f(n)')mf.insert(label);
      else if(functionLatex[label])mf.insert(`\\${functionLatex[label]}(#?)`);
      else if(literals[label])mf.insert(literals[label]);
      else if(/^[0-9a-zA-Z.()\[\],=+\-]$/.test(label))mf.insert(label);
      else if(label==='°')mf.insert('^{\\circ}');
      else if(['DNE','None','Undefined','Does not apply','No Solution','Infinite Solutions'].includes(label))mf.insert(`\\text{${label}}`);
      else {onUnsupported(`No experimental command mapping for ${label}.`);return;}
      onChange();
      });
    }catch(error){onError(error);}
    });
  }
  return clone;
}
