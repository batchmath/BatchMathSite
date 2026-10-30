/* BatchMath v12.8.W — Unit 5 multi-part answer UI.
   A problem with answerType 'unit5-staged' has parts[]: each part has a prompt, a control and its own
   feedback and explanation. The flow matches the approved Unit 4 staged engines: answer a part, read its
   feedback, continue; the active part sits above the completed ones, and later parts stay hidden until reached.
   Controls: 'input' (math editor + keypad profile, optional "y =" label), 'choice' (text buttons, only for
   classifications such as increasing / decreasing), 'svg-choice' (graph matching), and the slope-field
   drawing parts provided by unit5-slope-fields.js. */
(function(){
'use strict';
const A=()=>window.BatchMathUnit5Answers;

function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e;}

function render(box,problem,host){
 const parts=problem.parts||[];const multi=parts.length>1;
 box.classList.add('composite-answer','staged-calculus-answer','unit4-typed-answer','unit4-revised-answer','unit5-answer');
 problem.blockEnterAdvance=true;problem.enterAdvanceAllowed=false;problem.pendingStageAdvance=null;
 problem.requirePhysicalNextClick=false;problem.nextPointerArmed=false;
 const results=[];let previous=null;
 const label=i=>multi?`Part ${String.fromCharCode(65+i)}`:'';

 function showPart(i){
  const part=parts[i];
  const panel=el('section',`staged-part unit5-part ${i===0?'staged-part-one':'staged-part-two'} unit5-part-${i+1}`);
  panel.setAttribute('aria-label',multi?label(i):'Answer');panel.dataset.part=String(i);
  if(previous){
   box.insertBefore(panel,previous);
   previous.classList.add('staged-completed');
   previous.querySelectorAll('.bm-calc-keypad,.staged-check,.staged-continue,.unit5-tools').forEach(e=>e.hidden=true);
   const heading=el('h3','staged-review-heading',`Completed ${label(i-1)}`);previous.prepend(heading);
  }else box.appendChild(panel);
  const prompt=el('div','question-prompt staged-part-prompt',`${multi?`<strong>${label(i)}.</strong> `:''}${part.prompt||'Enter your answer.'}`);
  panel.appendChild(prompt);
  control(part,panel,i,(ok,result)=>done(i,panel,ok,result));
  previous=panel;
  const ready=host.typeset([panel]);
  if(i>0){panel.tabIndex=-1;ready.then(()=>requestAnimationFrame(()=>{if(!panel.isConnected)return;panel.focus({preventScroll:true});window.scrollTo({top:Math.max(0,window.scrollY+panel.getBoundingClientRect().top-24),behavior:'instant'});}));}
 }

 function feedback(panel,part,i,ok,result){
  const note=el('div','feedback shown staged-feedback');note.tabIndex=-1;
  const head=ok?(part.correctFeedback||(multi?`${label(i)} is correct.`:'Correct.')):(multi?`${label(i)} is not correct.`:'Not correct.');
  const extra=!ok&&result?.note?`<div class="answer-format-note">${result.note}</div>`:'';
  const answer=!ok&&part.answerTex?`<div class="correct-answer">Correct answer: ${part.answerIsText?part.answerTex:`\\(${part.answerTex}\\)`}</div>`:'';
  const method=part.explanation?`<div class="method">${part.explanation}</div>`:'';
  note.innerHTML=`<div class="result ${ok?'good':'bad'}">${head}</div>${extra}${answer}${method}`;
  panel.appendChild(note);host.typeset([note]);return note;
 }

 function done(i,panel,ok,result){
  results[i]=ok;const part=parts[i];
  const note=feedback(panel,part,i,ok,result);
  if(typeof part.afterFeedback==='function')part.afterFeedback(panel,ok);
  if(i===parts.length-1){
   problem.answered=true;problem.pendingStageAdvance=null;problem.enterAdvanceAllowed=true;
   host.finish(results.every(Boolean));return;
  }
  const next=el('button','choice staged-continue',`Continue to ${label(i+1)}`);next.type='button';
  const advance=()=>{if(next.disabled)return;next.disabled=true;next.hidden=true;problem.pendingStageAdvance=null;problem.enterAdvanceAllowed=false;showPart(i+1);};
  next.addEventListener('click',advance);
  next.addEventListener('keydown',e=>{if(e.key==='Enter'&&!ok){e.preventDefault();e.stopPropagation();}});
  panel.appendChild(next);problem.pendingStageAdvance=advance;problem.enterAdvanceAllowed=ok;
  setTimeout(()=>(ok?next:note).focus(),0);
 }

 showPart(0);
}

function control(part,panel,i,done){
 const kind=part.control||'input';
 if(kind==='choice'||kind==='svg-choice')return choice(part,panel,done);
 const special=window.BatchMathUnit5SlopeUI?.controls?.[kind];
 if(special)return special(part,panel,done);
 return input(part,panel,done);
}

function choice(part,panel,done){
 const grid=el('div',`choice-grid staged-choice-grid unit5-choices${part.control==='svg-choice'?' unit5-figure-choices':''}`);
 panel.appendChild(grid);let answered=false;
 (part.choices||[]).forEach((c,index)=>{
  const b=el('button','choice staged-choice',c);b.type='button';
  b.addEventListener('click',()=>{
   if(answered)return;answered=true;const ok=index===part.correctIndex;
   grid.querySelectorAll('.choice').forEach((item,k)=>{item.disabled=true;if(k===part.correctIndex)item.classList.add('correct');else if(k===index)item.classList.add('wrong');});
   done(ok,{note:!ok?part.choiceNotes?.[index]||'':''});
  });
  grid.appendChild(b);
 });
}

function input(part,panel,done){
 const row=el('div','unit5-input-row');
 if(part.prefix){row.appendChild(el('span','unit5-prefix',`\\(${part.prefix}\\)`));row.classList.add('has-prefix');}
 const field=el('input','practice-answer-input staged-exact-input');field.type='text';
 field.placeholder=part.placeholder||'Enter your answer';field.autocomplete='off';field.autocapitalize='off';field.spellcheck=false;
 field.setAttribute('aria-label',part.ariaLabel||part.placeholder||'Answer');
 row.appendChild(field);
 const button=el('button','choice staged-check',part.checkLabel||'Check Answer');button.type='button';
 const invalid=el('div','staged-input-message');invalid.setAttribute('aria-live','polite');
 if(part.help)panel.appendChild(el('div','unit5-help',part.help));
 panel.append(row,button,invalid);
 let answered=false;
 const check=()=>{
  if(answered)return;
  const result=A().check(field.value,part.answer);
  if(!result.valid){field.classList.add('wrong');invalid.textContent=result.message;window.BatchMathCalculusKeypad?.focus?.();return;}
  answered=true;invalid.textContent='';field.disabled=true;button.disabled=true;field.classList.add(result.ok?'correct':'wrong');
  done(result.ok,result);
 };
 button.addEventListener('click',check);
 field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();check();}});
 const pad=window.BatchMathCalculusKeypad;
 if(pad?.mountInputs)pad.mountInputs([field],panel,{mode:part.keypadMode||'unit5-number',onCheck:check});
 else setTimeout(()=>field.focus(),0);
}

window.BatchMathUnit5UI=Object.freeze({render});
})();
