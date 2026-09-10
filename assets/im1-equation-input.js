(function(global){
'use strict';
function parse(raw){
 let s=String(raw).trim().toLowerCase().replace(/−/g,'-').replace(/^x\s*=\s*/,'');
 s=global.BatchMathAnswers?.normalizeFractionSigns(s)??s;s=s.replace(/\s+/g,'');
 if(['nosolution','nosolutions','none','∅'].includes(s))return {kind:'none'};
 if(['infinitesolutions','infinitelymanysolutions','allrealnumbers','allreals'].includes(s))return {kind:'all'};
 const m=s.match(/^([+-]?\d+)(?:\/([+-]?\d+))?$/);
 if(!m)return {error:'Enter an integer or fraction, or use No Solution / Infinite Solutions.'};
 const n=Number(m[1]),d=Number(m[2]||1);
 if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0)return {error:'Enter a valid integer or fraction with a nonzero denominator.'};
 return {kind:'number',n,d};
}
function check(raw,expected){
 const p=parse(raw);if(p.error)return p;const q=parse(expected);
 if(q.error)throw Error('Invalid generated equation answer');
 return {ok:p.kind===q.kind&&(p.kind!=='number'||BigInt(p.n)*BigInt(q.d)===BigInt(q.n)*BigInt(p.d))};
}
function mount(host,p,onCheck){
 const form=document.createElement('div');form.className='im1-algebra-entry';
 const hint=document.createElement('button');hint.type='button';hint.id='equation-hint';hint.className='algebra-hint';hint.textContent='Show Hint';hint.setAttribute('aria-expanded','false');hint.setAttribute('aria-controls','equation-hint-panel');form.appendChild(hint);
 const panel=document.createElement('div');panel.id='equation-hint-panel';panel.className='algebra-help';panel.hidden=true;form.appendChild(panel);
 hint.addEventListener('click',()=>{panel.hidden=!panel.hidden;panel.textContent=p.hint;hint.textContent=panel.hidden?'Show Hint':'Hide Hint';hint.setAttribute('aria-expanded',String(!panel.hidden));});
 const label=document.createElement('label');label.htmlFor='equation-answer';label.textContent='Solution (enter the value of x)';form.appendChild(label);
 const input=document.createElement('input');input.id='equation-answer';input.type='text';input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-describedby','equation-help');form.appendChild(input);
 const help=document.createElement('div');help.id='equation-help';help.className='algebra-help';help.textContent='Integers and fractions are accepted. Use the buttons below if there is no solution or infinitely many solutions.';form.appendChild(help);
 const pad=document.createElement('div');pad.className='algebra-keypad';pad.setAttribute('aria-label','Equation solution keypad');form.appendChild(pad);
 function insert(text){if(input.disabled)return;const a=input.selectionStart??input.value.length,b=input.selectionEnd??a;input.value=input.value.slice(0,a)+text+input.value.slice(b);input.focus();input.setSelectionRange(a+text.length,a+text.length);}
 function key(label,fn,aria){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',aria||label);b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('click',()=>{if(!input.disabled)fn();});pad.appendChild(b);}
 for(const n of ['7','8','9','4','5','6','1','2','3','0'])key(n,()=>insert(n));
 key('−',()=>insert('-'),'Minus');key('a/b',()=>insert('/'),'Fraction');
 for(const [label,delta] of [['←',-1],['→',1]])key(label,()=>{const i=Math.max(0,Math.min(input.value.length,(input.selectionStart??input.value.length)+delta));input.focus();input.setSelectionRange(i,i);},delta<0?'Move cursor left':'Move cursor right');
 key('⌫',()=>{let a=input.selectionStart??input.value.length,b=input.selectionEnd??a;if(a===b)a=Math.max(0,a-1);input.setSelectionRange(a,b);insert('');},'Backspace');
 key('Clear',()=>{input.value='';input.focus();});
 for(const label of ['No Solution','Infinite Solutions'])key(label,()=>{input.value=label;input.focus();input.setSelectionRange(label.length,label.length);});
 const submit=document.createElement('button');submit.id='equation-check';submit.type='button';submit.className='algebra-check';submit.textContent='Check Answer';submit.addEventListener('click',()=>onCheck(input.value));form.appendChild(submit);
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();if(!input.disabled)onCheck(input.value);}});
 host.appendChild(form);
 return {disable(){input.disabled=true;submit.disabled=true;pad.querySelectorAll('button').forEach(b=>b.disabled=true);}};
}
global.BatchMathIM1Equation={parse,check,mount};
})(window);
