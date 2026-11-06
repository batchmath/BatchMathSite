/* BatchMath v12.9.C — Unit 6 answer controls for the staged (multi-part) problems drawn by unit5-ui.js.
   unit5-ui.js renders every part and asks window.BatchMathUnit5SlopeUI.controls for any control it does not draw
   itself; Unit 6 pages do not load the slope-field engine, so Unit 6 registers its two controls there:
   - 'u6-integral' (v12.9.C): an integral setup written by the student as one expression in a single blank field (one
     to three integrals added or subtracted, numbers in front allowed). unit6-core parseSetup reads it and
     checkIntegral grades the setup itself, not only its value: it must match the problem's setup or a listed
     alternative (another method or variable where the problem allows it);
   - 'u6-expr': one expression in x or y, such as a radius or a cross-sectional area A(y).
   Both use the shared math keypad (one keypad for all fields of a part), Enter to check, and the same feedback
   flow as every other part. */
(function(){
'use strict';
const C=()=>window.BatchMathUnit6Core;
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e;}
function field(label,cls){const f=el('input',`practice-answer-input staged-exact-input ${cls}`);f.type='text';f.dataset.bmNoNormalize='true';f.autocomplete='off';f.autocapitalize='off';f.spellcheck=false;f.setAttribute('aria-label',label);return f;}

// v12.9.C: an integral setup is ONE blank field. The student writes the whole setup (the integral sign, limits,
// integrand, dx or dy, any number in front, and sums or differences of integrals) with the keyboard or the keypad's
// integral key; nothing is filled in. With MathLive (assets/mathlive/unit6.mjs) the field holds the linear form that
// unit6-core parseSetup reads; the standard editor accepts the same form typed directly: int(lower,upper,integrand,x).
// The rows parseSetup returns are graded by the structural checker (checkIntegral), unchanged.
function integralControl(part,panel,done){
 const max=Math.max(1,Math.min(3,part.maxIntegrals||3));
 if(part.help)panel.appendChild(el('div','unit5-help',part.help));
 const row=el('div','unit5-input-row u6-setup-row');
 const f=field('Integral setup: write the whole integral, with its limits, integrand and dx or dy','u6-setup');
 f.placeholder='';row.appendChild(f);
 const button=el('button','choice staged-check',part.checkLabel||'Check Answer');button.type='button';
 const invalid=el('div','staged-input-message');invalid.setAttribute('aria-live','polite');
 panel.append(row,button,invalid);
 let answered=false;
 const check=()=>{
  if(answered)return;
  const parsed=C().parseSetup(f.value);
  const result=parsed.error?{valid:false,message:parsed.error}
   :parsed.rows.length>max?{valid:false,message:max===1?'This part asks for a single integral.':`Use at most ${max} integrals.`}
   :C().checkIntegral(parsed.rows,part.answer);
  if(!result.valid){invalid.innerHTML=result.message;window.MathJax?.typesetPromise?.([invalid]).catch(()=>{});window.BatchMathCalculusKeypad?.focus?.();return;}
  answered=true;invalid.textContent='';f.disabled=true;button.disabled=true;f.classList.add(result.ok?'correct':'wrong');
  done(result.ok,result);
 };
 button.addEventListener('click',check);
 f.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();check();}});
 const pad=window.BatchMathCalculusKeypad,mode=part.answer?.decimals?'unit6-setup-calc':'unit6-setup';
 if(pad?.mountInputs)pad.mountInputs([f],panel,{mode,onCheck:check});else setTimeout(()=>f.focus(),0);
}

function exprControl(part,panel,done){
 const row=el('div','unit5-input-row');
 if(part.prefix){row.appendChild(el('span','unit5-prefix',`\\(${part.prefix}\\)`));row.classList.add('has-prefix');}
 const f=field(part.ariaLabel||part.placeholder||'Answer','');f.placeholder=part.placeholder||'Enter your answer';row.appendChild(f);
 const button=el('button','choice staged-check',part.checkLabel||'Check Answer');button.type='button';
 const invalid=el('div','staged-input-message');invalid.setAttribute('aria-live','polite');
 panel.append(row,button,invalid);let answered=false;
 const check=()=>{
  if(answered)return;const result=C().checkExpr(f.value,part.answer);
  if(!result.valid){f.classList.add('wrong');invalid.textContent=result.message;window.BatchMathCalculusKeypad?.focus?.();return;}
  answered=true;invalid.textContent='';f.disabled=true;button.disabled=true;f.classList.add(result.ok?'correct':'wrong');done(result.ok,result);
 };
 button.addEventListener('click',check);
 f.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();check();}});
 const pad=window.BatchMathCalculusKeypad;
 if(pad?.mountInputs)pad.mountInputs([f],panel,{mode:part.keypadMode||'unit6-integral',onCheck:check});else setTimeout(()=>f.focus(),0);
}

if(!window.BatchMathUnit5SlopeUI)window.BatchMathUnit5SlopeUI=Object.freeze({controls:Object.freeze({'u6-integral':integralControl,'u6-expr':exprControl})});
else console.error('unit6-ui: another engine already registered special controls on this page');
})();
