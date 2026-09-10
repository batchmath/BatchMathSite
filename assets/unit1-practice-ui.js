(function(){'use strict';
const M=s=>`\\(${s}\\)`;
function parse(raw){let s=String(raw??'').trim().toLowerCase().replace(/−/g,'-').replace(/\s+/g,'');s=window.BatchMathAnswers?.normalizeFractionSigns(s)??s;
 if((s.match(/\(/g)||[]).length!==(s.match(/\)/g)||[]).length)return{error:'Close each parenthesis before checking. No attempt counted.'};
 if(!s)return{error:'Enter an answer. This has not counted as an attempt.'};
 if(s==='undefined')return{error:'A function can be undefined at a point while its limit exists. Enter the limit, DNE, or signed infinity. This has not counted as an attempt.'};
 if(['dne','doesnotexist',"doesn'texist",'doesntexist'].includes(s))return{kind:'dne'};
 if(['inf','infinity','∞','+inf','+infinity','+∞'].includes(s))return{kind:'inf',sign:1};
 if(['-inf','-infinity','-∞'].includes(s))return{kind:'inf',sign:-1};
 const n='[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)',f=s.match(new RegExp('^\\(?('+n+')\\)?/\\(?('+n+')\\)?$'));let value;
 if(f){if(Number(f[2])===0)return{error:'Division by zero is undefined; 1/0 is not an accepted way to enter infinity. Enter infinity or -infinity when appropriate. No attempt counted.'};value=Number(f[1])/Number(f[2]);}
 else if(new RegExp('^'+n+'$').test(s))value=Number(s);
 if(Number.isFinite(value))return{kind:'num',value};
 return{error:'Enter a number, fraction, decimal, DNE, or signed infinity. This has not counted as an attempt.'};}
function typeset(nodes){window.MathJax?.typesetPromise?.(nodes).catch(()=>{});}
function methodButton(host,html,onReveal){const b=document.createElement('button');b.type='button';b.className='btn choice u1-method';b.textContent='Show Method';b.addEventListener('click',()=>{b.remove();const d=document.createElement('div');d.className='method';d.innerHTML=html;host.appendChild(d);typeset([d]);onReveal?.();});host.appendChild(b);}

function keypad(input,host){const pad=document.createElement('div');pad.className='u1-keypad';pad.setAttribute('aria-label','On-screen answer keypad');for(const [label,token] of [['7','7'],['8','8'],['9','9'],['−','-'],['4','4'],['5','5'],['6','6'],['a/b','/'],['1','1'],['2','2'],['3','3'],['.','.'],['0','0'],['DNE','DNE'],['∞','infinity'],['−∞','-infinity'],['←','left'],['→','right'],['⌫','backspace'],['Clear','clear']]){const b=document.createElement('button');b.type='button';b.className='u1-key';b.textContent=label;b.addEventListener('click',()=>{if(input.disabled)return;let a=input.selectionStart??input.value.length,z=input.selectionEnd??a;if(token==='left'||token==='right'){a=Math.max(0,Math.min(input.value.length,a+(token==='left'?-1:1)));}else if(token==='clear'){input.value='';a=0;}else if(token==='backspace'){if(a===z)a=Math.max(0,a-1);input.value=input.value.slice(0,a)+input.value.slice(z);}else{input.value=input.value.slice(0,a)+token+input.value.slice(z);a+=token.length;}input.focus();input.setSelectionRange(a,a);});pad.appendChild(b);}host.appendChild(pad);return pad;}
function render(p,host,done){host.innerHTML='';let finished=false;const finish=ok=>{if(finished)return;finished=true;done(ok);};
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
window.BMUnit1UI={parse,methodButton,render,keypad};
})();
