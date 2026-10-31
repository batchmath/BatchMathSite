const functionLatex={sin:'sin',cos:'cos',tan:'tan',sec:'sec',csc:'csc',cot:'cot',ln:'ln',log:'log',exp:'exp','sin⁻¹':'arcsin','cos⁻¹':'arccos','tan⁻¹':'arctan','cot⁻¹':'arccot','sec⁻¹':'arcsec','csc⁻¹':'arccsc'};
const commands={'←':'moveToPreviousChar','→':'moveToNextChar','↑':'moveUp','↓':'moveDown','⌫':'deleteBackward',Del:'deleteForward',Clear:'deleteAll'};
const literals={'−':'-','·':'\\cdot ','π':'\\pi ','∞':'\\infty ','−∞':'-\\infty ','∪':'\\cup ','a₁':'a_{1}','aₙ':'a_{n}','aₙ₋₁':'a_{n-1}'};

export function focusMathfield(mf) {
  mf.focus();
  // Version-pinned DOM focus bridge. keyboard-sink is an officially exposed part.
  // 0.111.1 defers its focus by 60ms, which can send the first key to an old field
  // (or another comparison frame). Keep all actual key/edit handling in MathLive.
  mf.shadowRoot?.querySelector('[part~="keyboard-sink"]')?.focus({preventScroll:true});
}

export function bridgeKeypad(originalPad,{active,onCheck,onChange,onUnsupported,onError}) {
  // cloneNode intentionally preserves the actual current layout, but not its private callbacks.
  const clone=originalPad.cloneNode(true);clone.dataset.experimentalBridge='true';
  for(const button of clone.querySelectorAll('button')) {
    const label=button.textContent.trim();const aria=button.getAttribute('aria-label')||'';
    button.addEventListener('pointerdown',e=>e.preventDefault());
    button.addEventListener('click',()=>{try{
      const mf=active();if(!mf)return;focusMathfield(mf);
      if(label==='Check'){onCheck();return;}
      if(commands[label])mf.executeCommand(commands[label]);
      else if(aria==='Insert stacked fraction')mf.insert('\\frac{#?}{#?}');
      else if(label==='xⁿ')mf.executeCommand('moveToSuperscript');
      else if(label==='√')mf.insert('\\sqrt{#?}');
      else if(label==='∛')mf.insert('\\sqrt[3]{#?}');
      else if(label==='ⁿ√')mf.insert('\\sqrt[#?]{#?}');
      else if(label==='|u|')mf.insert('\\left|#?\\right|');
      else if(label==='f(x)')mf.insert('f(x)');
      else if(functionLatex[label])mf.insert(`\\${functionLatex[label]}(#?)`);
      else if(literals[label])mf.insert(literals[label]);
      else if(/^[0-9a-zA-Z.()\[\],=+\-]$/.test(label))mf.insert(label);
      else if(['DNE','None','Does not apply','No Solution','Infinite Solutions'].includes(label))mf.insert(`\\text{${label}}`);
      else {onUnsupported(`No experimental command mapping for ${label}.`);return;}
      onChange();
    }catch(error){onError(error);}
    });
  }
  return clone;
}
