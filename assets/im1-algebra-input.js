(function(global){
'use strict';
const supers='⁰¹²³⁴⁵⁶⁷⁸⁹';
function normalize(raw){return String(raw).replace(/−/g,'-').replace(/\s+/g,'').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,s=>'^'+[...s].map(c=>supers.indexOf(c)).join('')).replace(/\^\{(\d+)\}/g,'^$1');}
// Exact integer monomials: no sampling-based equivalence or executable input.
function parse(raw){
 const s=normalize(raw);
 if(!s||s.length>400)return {error:'Enter a simplified expression.'};
 if(!/^[a-z0-9+*^\-]+$/.test(s))return {error:'Use whole-number coefficients, variables, +, −, and exponents such as x^2.'};
 const chunks=s.match(/[+-]?[^+-]+/g);
 if(!chunks||chunks.join('')!==s)return {error:'Complete each term before checking.'};
 const terms={},seen=new Set();let simplified=true;
 for(let chunk of chunks){
  let sign=1;if(chunk[0]==='-'||chunk[0]==='+'){sign=chunk[0]==='-'?-1:1;chunk=chunk.slice(1);}
  const coefficient=chunk.match(/^\d+/);let n=coefficient?Number(coefficient[0]):1,rest=chunk.slice(coefficient?.[0].length||0);
  if(rest.startsWith('*')&&coefficient)rest=rest.slice(1);
  if(!Number.isSafeInteger(n))return {error:'That coefficient is too large.'};
  const powers={};
  while(rest){
   const m=rest.match(/^([a-z])(?:\^(\d+))?/);if(!m)return {error:'Complete the exponent or variable term before checking.'};
   const exponent=m[2]===undefined?1:Number(m[2]);
   if(exponent<1||exponent>99)return {error:'Use positive whole-number exponents from 1 to 99.'};
   if(powers[m[1]])simplified=false;
   powers[m[1]]=(powers[m[1]]||0)+exponent;rest=rest.slice(m[0].length);
   if(rest.startsWith('*')){rest=rest.slice(1);if(!rest)return {error:'Complete the term after the multiplication sign.'};}
  }
  if(!coefficient&&!Object.keys(powers).length)return {error:'Enter a term.'};
  // A dangling multiplication sign following a constant is never a complete term.
  if(/\*$/.test(chunk))return {error:'Complete the term after the multiplication sign.'};
  const key=Object.keys(powers).sort().map(v=>v+'^'+powers[v]).join('*');
  if(seen.has(key))simplified=false;seen.add(key);
  if(n===0&&chunks.length>1)simplified=false;
  terms[key]=(terms[key]||0)+sign*n;
 }
 for(const k of Object.keys(terms))if(terms[k]===0)delete terms[k];
 return {terms,simplified};
}
function check(raw,expected){
 const actual=parse(raw);if(actual.error)return actual;
 const want=parse(expected);if(want.error)throw Error('Invalid generated polynomial');
 const keys=Object.keys(actual.terms),equal=keys.length===Object.keys(want.terms).length&&keys.every(k=>actual.terms[k]===want.terms[k]);
 return {ok:equal&&actual.simplified,unsimplified:equal&&!actual.simplified};
}
function mount(host,p,onCheck){
 const form=document.createElement('div');form.className='im1-algebra-entry';
 const label=document.createElement('label');label.htmlFor='algebra-answer';label.textContent='Simplified expression';form.appendChild(label);
 const input=document.createElement('input');input.id='algebra-answer';input.type='text';input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-describedby','algebra-help');form.appendChild(input);
 const help=document.createElement('div');help.id='algebra-help';help.className='algebra-help';help.textContent='Use xⁿ for an exponent; enter its digits, then → to return to the baseline. You can also type x^2.';form.appendChild(help);
 const preview=document.createElement('div');preview.className='algebra-preview';preview.setAttribute('aria-label','Formatted answer');form.appendChild(preview);
 const pad=document.createElement('div');pad.className='algebra-keypad';pad.setAttribute('aria-label','Algebra answer keypad');form.appendChild(pad);
 let exponentMode=false;let exponentButton;
 function refresh(){
  const raw=normalize(input.value);
  preview.textContent=/^[a-z0-9+*^\-]*$/.test(raw)&&raw?`\\(${raw.replace(/\^(\d+)/g,'^{$1}').replace(/\*/g,'\\cdot ')}\\)`:'';
  global.MathJax?.typesetPromise?.([preview]).catch(()=>{});
  if(exponentButton)exponentButton.setAttribute('aria-pressed',String(exponentMode));
 }
 function insert(text){if(input.disabled)return;const a=input.selectionStart??input.value.length,b=input.selectionEnd??a;input.value=input.value.slice(0,a)+text+input.value.slice(b);input.focus();input.setSelectionRange(a+text.length,a+text.length);refresh();}
 function key(label,action,aria){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',aria||label);b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('click',()=>{if(!input.disabled)action();});pad.appendChild(b);return b;}
 for(const digit of ['7','8','9','4','5','6','1','2','3','0'])key(digit,()=>insert(exponentMode?supers[Number(digit)]:digit));
 for(const v of p.variables)key(v,()=>{exponentMode=false;insert(v);});
 for(const [label,text] of [['+','+'],['−','-']])key(label,()=>{exponentMode=false;insert(text);});
 exponentButton=key('xⁿ',()=>{exponentMode=!exponentMode;refresh();input.focus();},'Toggle exponent entry');
 for(const [label,delta] of [['←',-1],['→',1]])key(label,()=>{const step=exponentMode&&delta>0?0:delta;exponentMode=false;const pos=Math.max(0,Math.min(input.value.length,(input.selectionStart??input.value.length)+step));input.focus();input.setSelectionRange(pos,pos);refresh();},delta<0?'Move cursor left':'Return to baseline or move cursor right');
 key('⌫',()=>{let a=input.selectionStart??input.value.length,b=input.selectionEnd??a;if(a===b)a=Math.max(0,a-1);input.setSelectionRange(a,b);insert('');},'Backspace');
 key('Clear',()=>{input.value='';exponentMode=false;input.focus();refresh();},'Clear answer');
 const submit=document.createElement('button');submit.id='algebra-check';submit.type='button';submit.className='algebra-check';submit.textContent='Check Answer';submit.addEventListener('click',()=>onCheck(input.value));form.appendChild(submit);
 input.addEventListener('input',()=>{exponentMode=false;refresh();});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();if(!input.disabled)onCheck(input.value);}});
 host.appendChild(form);
 return {disable(){input.disabled=true;submit.disabled=true;pad.querySelectorAll('button').forEach(b=>b.disabled=true);}};
}
global.BatchMathIM1Algebra={parse,check,mount};
})(window);
