/* BatchMath v12.9.A — Unit 6 answer controls for the staged (multi-part) problems drawn by unit5-ui.js.
   unit5-ui.js renders every part and asks window.BatchMathUnit5SlopeUI.controls for any control it does not draw
   itself; Unit 6 pages do not load the slope-field engine, so Unit 6 registers its two controls there:
   - 'u6-integral': an integral setup typed as one to three integrals, each [number] ∫ from [a] to [b] of [integrand]
     d(x or y). It is graded by its value (unit6-core checkIntegral), so any correct setup is accepted;
   - 'u6-expr': one expression in x or y, such as a radius or a cross-sectional area A(y).
   Both use the shared math keypad (one keypad for all fields of a part), Enter to check, and the same feedback
   flow as every other part. */
(function(){
'use strict';
const C=()=>window.BatchMathUnit6Core;
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e;}
function field(label,cls){const f=el('input',`practice-answer-input staged-exact-input ${cls}`);f.type='text';f.dataset.bmNoNormalize='true';f.autocomplete='off';f.autocapitalize='off';f.spellcheck=false;f.setAttribute('aria-label',label);return f;}

function integralControl(part,panel,done){
 const max=Math.max(1,Math.min(3,part.maxIntegrals||3)),rows=[],wrap=el('div','u6-integrals');
 if(part.help)panel.appendChild(el('div','unit5-help',part.help));
 for(let i=0;i<max;i++){
  const row=el('div','u6-int-row');row.hidden=i>0;
  const n=max>1?` (integral ${i+1})`:'';
  const coef=field(`Number in front of the integral${n}, such as pi; leave empty for 1`,'u6-coef'),lower=field(`Lower limit${n}`,'u6-bound'),upper=field(`Upper limit${n}`,'u6-bound'),body=field(`Integrand${n}`,'u6-body');
  coef.placeholder='';lower.placeholder='a';upper.placeholder='b';body.placeholder='integrand';
  const plus=el('span','u6-plus',i?'+':'');
  const sign=el('span','u6-intsign','∫');
  const limits=el('span','u6-limits');limits.append(upper,lower);
  const dsel=el('span','u6-dvar');dsel.setAttribute('role','radiogroup');dsel.setAttribute('aria-label',`Variable of integration${n}`);
  const state={v:null};
  for(const v of ['x','y']){const b=el('button','choice u6-dbtn',`d${v}`);b.type='button';b.setAttribute('role','radio');b.setAttribute('aria-checked','false');
   b.addEventListener('click',()=>{state.v=v;dsel.querySelectorAll('.u6-dbtn').forEach(x=>{const on=x===b;x.classList.toggle('selected',on);x.setAttribute('aria-checked',String(on));});});dsel.appendChild(b);}
  row.append(plus,coef,sign,limits,body,dsel);
  rows.push({row,coef,lower,upper,body,state});wrap.appendChild(row);
 }
 panel.appendChild(wrap);
 const tools=el('div','unit5-tools u6-int-tools');
 const add=el('button','choice u6-add','+ Add another integral'),remove=el('button','choice u6-remove','Remove last integral');add.type=remove.type='button';
 const shown=()=>rows.filter(r=>!r.row.hidden).length;
 const sync=()=>{add.hidden=shown()>=max;remove.hidden=shown()<=1;};
 add.addEventListener('click',()=>{const r=rows.find(x=>x.row.hidden);if(r){r.row.hidden=false;sync();r.row.querySelector('.bm-calc-editor')?.focus();}});
 remove.addEventListener('click',()=>{const vis=rows.filter(x=>!x.row.hidden);const r=vis[vis.length-1];if(r&&vis.length>1){r.row.hidden=true;sync();}}); // a hidden integral is not graded
 if(max>1)tools.append(add,remove);sync();
 const button=el('button','choice staged-check',part.checkLabel||'Check Answer');button.type='button';
 const invalid=el('div','staged-input-message');invalid.setAttribute('aria-live','polite');
 panel.append(tools,button,invalid);
 let answered=false;
 const check=()=>{
  if(answered)return;
  const typed=rows.filter(r=>!r.row.hidden).map(r=>({coef:r.coef.value,lower:r.lower.value,upper:r.upper.value,integrand:r.body.value,v:r.state.v}));
  const result=C().checkIntegral(typed,part.answer);
  if(!result.valid){invalid.innerHTML=result.message;window.MathJax?.typesetPromise?.([invalid]).catch(()=>{});window.BatchMathCalculusKeypad?.focus?.();return;}
  answered=true;invalid.textContent='';
  for(const r of rows){for(const f of [r.coef,r.lower,r.upper,r.body])f.disabled=true;r.row.querySelectorAll('button').forEach(b=>b.disabled=true);r.row.classList.add(result.ok?'correct':'wrong');}
  add.disabled=remove.disabled=button.disabled=true;
  done(result.ok,result);
 };
 button.addEventListener('click',check);
 const all=rows.flatMap(r=>[r.coef,r.lower,r.upper,r.body]);
 for(const f of all)f.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();check();}});
 const pad=window.BatchMathCalculusKeypad;
 if(pad?.mountInputs){pad.mountInputs(all,panel,{mode:'unit6-integral',onCheck:check});setTimeout(()=>rows[0].lower.previousElementSibling?.focus?.(),0);}
 else setTimeout(()=>rows[0].lower.focus(),0);
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
