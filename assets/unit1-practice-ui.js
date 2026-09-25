(function(){'use strict';
const M=s=>`\\(${s}\\)`;
function exactNumberExpression(source){
 const s=String(source).toLowerCase().replace(/π/g,'pi').replace(/√(?=\()/g,'sqrt').replace(/∛(?=\()/g,'cbrt').replace(/√(-?(?:\d+(?:\.\d*)?|\.\d+))/g,'sqrt($1)').replace(/∛(-?(?:\d+(?:\.\d*)?|\.\d+))/g,'cbrt($1)').replace(/\s+/g,'');let i=0;
 const peek=()=>s[i],take=c=>peek()===c?(i++,true):false,fail=()=>{throw new Error('syntax')};
 function primary(){
  if(take('(')){const v=sum();if(!take(')'))fail();return v;}
  const number=s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);if(number){i+=number[0].length;return Number(number[0]);}
  const name=s.slice(i).match(/^[a-z]+/);if(!name)fail();i+=name[0].length;
  if(name[0]==='pi')return Math.PI;if(name[0]==='e')return Math.E;
  if(!take('('))fail();const first=sum();let second=null;if(take(','))second=sum();if(!take(')'))fail();
  if(name[0]==='sqrt'&&second===null)return Math.sqrt(first);
  if(name[0]==='cbrt'&&second===null)return Math.cbrt(first);
  if(name[0]==='ln'&&second===null)return Math.log(first);
  if(name[0]==='log'&&second===null)return Math.log10(first);
  if(name[0]==='root'&&second!==null&&Number.isInteger(first)&&first>=2){if(second<0&&first%2===0)return NaN;return second<0?-Math.pow(-second,1/first):Math.pow(second,1/first);}
  fail();
 }
 function unary(){if(take('+'))return unary();if(take('-'))return-unary();return primary();}
 function power(){const left=unary();return take('^')?Math.pow(left,power()):left;}
 function product(){let v=power();while(peek()==='*'||peek()==='/'||peek()==='('||/[a-z]/.test(peek()||'')){const explicit=peek()==='*'||peek()==='/',op=explicit?s[i++]:'*',r=power();v=op==='*'?v*r:v/r;}return v;}
 function sum(){let v=product();while(peek()==='+'||peek()==='-'){const op=s[i++],r=product();v=op==='+'?v+r:v-r;}return v;}
 try{const value=sum();return i===s.length&&Number.isFinite(value)?value:null;}catch{return null;}
}
function parse(raw){let s=String(raw??'').trim().toLowerCase().replace(/[−–—]/g,'-').replace(/\s+/g,'');s=window.BatchMathAnswers?.normalizeFractionSigns(s)??s;
 if((s.match(/\(/g)||[]).length!==(s.match(/\)/g)||[]).length)return{error:'Close each parenthesis before checking. No attempt counted.'};
 if(!s)return{error:'Enter an answer. This has not counted as an attempt.'};
 if(s==='undefined')return{error:'A function can be undefined at a point while its limit exists. Enter the limit, DNE, or signed infinity. This has not counted as an attempt.'};
 if(['dne','doesnotexist',"doesn'texist",'doesntexist'].includes(s))return{kind:'dne'};
 if(['inf','infinity','∞','+inf','+infinity','+∞'].includes(s))return{kind:'inf',sign:1};
 if(['-inf','-infinity','-∞'].includes(s))return{kind:'inf',sign:-1};
 const n='[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)',f=s.match(new RegExp('^\\(?('+n+')\\)?/\\(?('+n+')\\)?$'));let value;
 if(f&&Number(f[2])===0)return{error:'Division by zero is undefined; 1/0 is not an accepted way to enter infinity. Enter infinity or -infinity when appropriate. No attempt counted.'};
 value=exactNumberExpression(s);
 if(Number.isFinite(value))return{kind:'num',value};
 return{error:'Enter a valid exact value, decimal, DNE, or signed infinity. You may use fractions, roots, pi, e, and ln. This has not counted as an attempt.'};}
function typeset(nodes){window.MathJax?.typesetPromise?.(nodes).catch(()=>{});}
function methodButton(host,html,onReveal){const b=document.createElement('button');b.type='button';b.className='btn choice u1-method';b.textContent='Show Method';b.addEventListener('click',()=>{b.remove();const d=document.createElement('div');d.className='method';d.innerHTML=html;host.appendChild(d);typeset([d]);onReveal?.();});host.appendChild(b);}

function keypad(input,host){const pad=document.createElement('div');pad.className='u1-keypad';pad.setAttribute('aria-label','On-screen answer keypad');for(const [label,token] of [['7','7'],['8','8'],['9','9'],['−','-'],['4','4'],['5','5'],['6','6'],['a/b','/'],['1','1'],['2','2'],['3','3'],['.','.'],['0','0'],['DNE','DNE'],['∞','infinity'],['−∞','-infinity'],['←','left'],['→','right'],['⌫','backspace'],['Clear','clear']]){const b=document.createElement('button');b.type='button';b.className='u1-key';b.textContent=label;b.addEventListener('click',()=>{if(input.disabled)return;let a=input.selectionStart??input.value.length,z=input.selectionEnd??a;if(token==='left'||token==='right'){a=Math.max(0,Math.min(input.value.length,a+(token==='left'?-1:1)));}else if(token==='clear'){input.value='';a=0;}else if(token==='backspace'){if(a===z)a=Math.max(0,a-1);input.value=input.value.slice(0,a)+input.value.slice(z);}else{input.value=input.value.slice(0,a)+token+input.value.slice(z);a+=token.length;}input.focus();input.setSelectionRange(a,a);});pad.appendChild(b);}host.appendChild(pad);return pad;}
function render(p,host,done){host.innerHTML='';let finished=false;const finish=ok=>{if(finished)return;finished=true;done(ok);};
 if(p.fields){let active=null;const inputs=[];for(const f of p.fields){const label=document.createElement('label');label.className='parameter-field';label.innerHTML=`<span>${M(`${f.label}=`)}</span>`;const input=document.createElement('input');input.type='text';input.className='practice-answer-input';input.placeholder=`Enter ${f.label}`;input.setAttribute('aria-label',`Value of ${f.label}`);input.addEventListener('focus',()=>active=input);label.appendChild(input);host.appendChild(label);inputs.push(input);}active=inputs[0];const hint=document.createElement('button');hint.type='button';hint.className='choice';hint.textContent='Show Hint';hint.addEventListener('click',()=>{hint.disabled=true;const d=document.createElement('div');d.className='feedback shown';d.innerHTML=p.hint||'Match adjacent branch values at every boundary.';host.appendChild(d);typeset([d]);});const check=document.createElement('button');check.type='button';check.className='choice';check.textContent='Check All Parameters';const submit=()=>{if(finished)return;const parsed=inputs.map(x=>parse(x.value)),bad=parsed.findIndex(x=>x.error||x.kind!=='num');if(bad>=0){inputs[bad].classList.add('wrong');inputs[bad].focus();return;}const oks=parsed.map((x,i)=>Math.abs(x.value-Number(p.fields[i].numericAnswer))<=Number(p.fields[i].numericTolerance||1e-8));inputs.forEach((x,i)=>{x.disabled=true;x.classList.add(oks[i]?'correct':'wrong');});host.querySelectorAll('button').forEach(x=>x.disabled=true);finish(oks.every(Boolean));};check.addEventListener('click',submit);inputs.forEach(x=>x.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();submit();}}));host.append(hint,check);const pad=document.createElement('div');pad.className='u1-keypad';for(const [label,token] of [['7','7'],['8','8'],['9','9'],['−','-'],['4','4'],['5','5'],['6','6'],['a/b','/'],['1','1'],['2','2'],['3','3'],['.','.'],['0','0'],['⌫','backspace'],['Clear','clear']]){const b=document.createElement('button');b.type='button';b.className='u1-key';b.textContent=label;b.addEventListener('click',()=>{if(!active||active.disabled)return;let a=active.selectionStart??active.value.length,z=active.selectionEnd??a;if(token==='clear'){active.value='';a=0;}else if(token==='backspace'){if(a===z)a=Math.max(0,a-1);active.value=active.value.slice(0,a)+active.value.slice(z);}else{active.value=active.value.slice(0,a)+token+active.value.slice(z);a+=token.length;}active.focus();active.setSelectionRange(a,a);});pad.appendChild(b);}host.appendChild(pad);typeset([host]);setTimeout(()=>active?.focus(),0);return;}
 if(p.choices){p.choices.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='choice';b.innerHTML=p.choicesHtml?c:(p.choicesAreText&&!/^[-+]?\d|^\\|^x=|^y=/.test(c)?c:M(c));b.addEventListener('click',()=>{if(finished)return;host.querySelectorAll('button').forEach((x,j)=>{x.disabled=true;if(j===p.correctIndex)x.classList.add('correct');else if(j===i)x.classList.add('wrong');});finish(i===p.correctIndex);});host.appendChild(b);});typeset([host]);return;}
 if(!p.points)return;
 let remaining=p.points.slice(),found=[],allCorrect=true;
 const note=document.createElement('div'),stage=document.createElement('div'),history=document.createElement('div');note.className='feedback';host.append(stage,note,history);
 function feedback(text){note.innerHTML=text;typeset([note]);}
 function button(label,fn){const b=document.createElement('button');b.type='button';b.className='choice';b.textContent=label;b.addEventListener('click',fn);stage.appendChild(b);return b;}
 function explain(point,ok){const d=document.createElement('div');d.className='method';d.innerHTML=`<strong>${M(`x=${point.x}`)}: ${point.type}</strong> `;history.appendChild(d);if(ok)methodButton(d,point.why);else{d.innerHTML+=point.why;}typeset([d]);}
 function more(){stage.innerHTML='<p>Are there more discontinuities?</p>';for(const yes of [false,true])button(yes?'Input Another Discontinuity':'No More Discontinuities',()=>{const hasMore=remaining.length>0;if(yes!==hasMore)allCorrect=false;if(hasMore){feedback(yes?'Enter another location.':'There is another discontinuity. Find the remaining location.');location();}else{feedback(yes?'There are no more discontinuities.':'You have found every discontinuity.');stage.innerHTML='';finish(allCorrect);}});}
 function location(){stage.innerHTML='<label>Discontinuity location <input aria-label="Discontinuity location" class="practice-answer-input" placeholder="x ="></label>';const input=stage.querySelector('input');
 const check=()=>{const v=parse(input.value.replace(/^x\s*=\s*/i,''));if(v.error||v.kind!=='num'){feedback(v.error||'Enter a numerical x-location. No attempt counted.');return;}if(found.some(x=>Math.abs(x-v.value)<1e-9)){feedback('You already found this location. Enter another. No penalty.');return;}
 const idx=remaining.findIndex(x=>Math.abs(x.x-v.value)<1e-9);const point=remaining.splice(idx<0?0:idx,1)[0];found.push(point.x);
 if(idx<0){allCorrect=false;feedback(`Not quite. One discontinuity is at ${M(`x=${point.x}`)}.`);explain(point,false);more();return;}
 feedback(`Correct location: ${M(`x=${point.x}`)}. Classify it.`);stage.innerHTML='';for(const type of ['removable','jump','infinite'])button(type[0].toUpperCase()+type.slice(1),()=>{const ok=type===point.type;if(!ok)allCorrect=false;feedback(ok?'Correct.':`The correct classification is ${point.type}.`);explain(point,ok);more();});};
 button('Check Location',check);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();check();}});input.focus();}
 location();}
window.BMUnit1UI={parse,exactNumberExpression,methodButton,render,keypad};
})();
