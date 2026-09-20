/* Interval notation input for IM1 inequalities. */
(function(global){
 'use strict';
 const canonical=raw=>String(raw).trim().toLowerCase().replace(/\s/g,'').replace(/−/g,'-').replace(/(?:infinity|inf|∞)/g,'∞');
 function parse(raw){
  const s=canonical(raw);
  const m=s.match(/^([[(])(-∞|[+-]?\d+),([+-]?\d+|∞)([\])])$/);
  if(!m)return {error:'Use interval notation, for example (−∞, 5] or [2, ∞).'};
  if((m[2]==='-∞'&&m[1]!=='(')||(m[3]==='∞'&&m[4]!==')'))return {error:'Infinity always uses a parenthesis.'};
  return {value:`${m[1]}${m[2]},${m[3]}${m[4]}`};
 }
 function check(raw,expected){const got=parse(raw);if(got.error)return got;const want=parse(expected);if(want.error)throw Error('Invalid generated interval');return {ok:got.value===want.value};}
 function mount(host,p,onCheck){
  const form=document.createElement('div');form.className='im1-algebra-entry';
  const label=document.createElement('label');label.htmlFor='interval-answer';label.textContent='Answer in interval notation';form.appendChild(label);
  const input=document.createElement('input');input.id='interval-answer';input.type='text';input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label','Answer in interval notation');form.appendChild(input);
  const help=document.createElement('div');help.className='algebra-help';help.textContent='Use parentheses for infinity; a bracket includes a finite endpoint.';form.appendChild(help);
  const pad=document.createElement('div');pad.className='algebra-keypad';pad.setAttribute('aria-label','Interval notation keypad');form.appendChild(pad);
  function insert(value){if(input.disabled)return;const a=input.selectionStart??input.value.length,b=input.selectionEnd??a;input.value=input.value.slice(0,a)+value+input.value.slice(b);input.focus({preventScroll:true});input.setSelectionRange(a+value.length,a+value.length);}
  function key(text,action){const b=global.BatchMathKeypad.button(text,/^\d$/.test(text)?'':'utility',action,text);pad.appendChild(b);}
  for(const digit of ['7','8','9','4','5','6','1','2','3','0'])key(digit,()=>insert(digit));
  for(const sym of ['(',')','[',']',',','−','∞'])key(sym,()=>insert(sym==='−'?'-':sym));
  key('←',()=>{const i=Math.max(0,input.selectionStart-1);input.focus({preventScroll:true});input.setSelectionRange(i,i);});
  key('→',()=>{const i=Math.min(input.value.length,input.selectionEnd+1);input.focus({preventScroll:true});input.setSelectionRange(i,i);});
  key('⌫',()=>{let a=input.selectionStart??input.value.length,b=input.selectionEnd??a;if(a===b)a=Math.max(0,a-1);input.setSelectionRange(a,b);insert('');});
  key('Clear',()=>{input.value='';input.focus({preventScroll:true});});
  const submit=document.createElement('button');submit.type='button';submit.className='algebra-check';submit.textContent='Check Answer';submit.addEventListener('click',()=>onCheck(input.value));form.appendChild(submit);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();if(!input.disabled)onCheck(input.value);}});
  global.BatchMathKeypad.layoutUnit2(pad);
  const positions={7:[1,1],8:[1,2],9:[1,3],'(':[1,4],4:[2,1],5:[2,2],6:[2,3],')':[2,4],1:[3,1],2:[3,2],3:[3,3],'[':[3,4],'−':[4,1],0:[4,2],',':[4,3],']':[4,4],'∞':[5,1],'←':[5,2],'→':[5,3],'⌫':[5,4],'Clear':[6,1]};
  pad.querySelectorAll('button').forEach(b=>{const cell=positions[b.textContent];if(cell){b.style.gridRow=String(cell[0]);b.style.gridColumn=b.textContent==='Clear'?'1 / span 4':String(cell[1]);}});
  host.appendChild(form);input.focus({preventScroll:true});
  return {disable(){input.disabled=true;submit.disabled=true;pad.querySelectorAll('button').forEach(b=>b.disabled=true);}};
 }
 global.BatchMathIM1Interval={parse,check,mount};
})(window);
