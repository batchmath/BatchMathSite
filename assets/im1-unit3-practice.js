(function(){
'use strict';
const cfg=window.BM_UNIT3_PRACTICE||{};
const generator=window.BatchMathIM1Unit3Generators?.get?.(cfg.slug);
const byId=id=>document.getElementById(id);
let problem=null,score=0,attempted=0,locked=false,recent=[];

function typeset(nodes){if(window.MathJax?.typesetPromise)window.MathJax.typesetPromise(nodes).catch(()=>{});}
function updateStats(){byId('score').textContent=String(score);byId('attempted').textContent=String(attempted);}
function normalizeNumber(raw){
 const s=String(raw).replace(/−/g,'-').replace(/\s+/g,'').trim();
 if(!s)return{error:'Enter an answer.'};
 if(!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:\/-?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(s))return{error:'Enter a number, decimal, or fraction such as 3/4.'};
 const parts=s.split('/'),top=Number(parts[0]),bottom=parts.length===2?Number(parts[1]):1;
 if(!Number.isFinite(top)||!Number.isFinite(bottom)||bottom===0)return{error:'Enter a valid number with a nonzero denominator.'};
 return{value:top/bottom};
}
function numericEqual(raw,expected){const a=normalizeNumber(raw),b=normalizeNumber(expected);if(a.error)return a;return{ok:Math.abs(a.value-b.value)<1e-9};}

function formulaExpression(raw){
 let s=String(raw??'').toLowerCase().trim().replace(/[−–—]/g,'-').replace(/[×·⋅∙]/g,'*').replace(/aₙ/g,'a_n').replace(/[\[\{]/g,'(').replace(/[\]\}]/g,')').replace(/\s+/g,'');
 if(!s)return{error:'Enter an explicit formula.'};
 const parts=s.split('=');if(parts.length>2)return{error:'Use only one equals sign.'};
 const label=/^(?:a_?n|a\(n\)|f\(n\)|y)$/;
 if(parts.length===2){
  if(label.test(parts[0]))s=parts[1];
  else if(label.test(parts[1]))s=parts[0];
  else return{error:'Write the formula with aₙ, a(n), f(n), or y on one side.'};
 }
 const tokens=[];let i=0;
 while(i<s.length){
  const ch=s[i];
  if(/[0-9.]/.test(ch)){let j=i+1;while(j<s.length&&/[0-9.]/.test(s[j]))j++;const literal=s.slice(i,j);if(literal==='.'||(literal.match(/\./g)||[]).length>1)return{error:'Check the numbers in the formula.'};tokens.push({type:'num',value:Number(literal)});i=j;continue;}
  if(ch==='n'){tokens.push({type:'var'});i++;continue;}
  if('+-*/^()'.includes(ch)){tokens.push({type:ch});i++;continue;}
  return{error:'Use numbers, n, operations, and parentheses.'};
 }
 const expanded=[];
 const ends=t=>t&&(t.type==='num'||t.type==='var'||t.type===')'),starts=t=>t&&(t.type==='num'||t.type==='var'||t.type==='(');
 for(const token of tokens){if(ends(expanded.at(-1))&&starts(token))expanded.push({type:'*'});expanded.push(token);}
 let at=0;const peek=()=>expanded[at],take=()=>expanded[at++];
 function expression(){let node=product();while(peek()&&(peek().type==='+'||peek().type==='-')){const op=take().type;node={op,left:node,right:product()};}return node;}
 function product(){let node=unary();while(peek()&&(peek().type==='*'||peek().type==='/')){const op=take().type;node={op,left:node,right:unary()};}return node;}
 function unary(){if(peek()&&(peek().type==='+'||peek().type==='-')){const op=take().type;return{unary:op,value:unary()};}return power();}
 function power(){let node=primary();if(peek()?.type==='^'){take();node={op:'^',left:node,right:unary()};}return node;}
 function primary(){const token=take();if(!token)throw Error('end');if(token.type==='num')return{number:token.value};if(token.type==='var')return{variable:true};if(token.type==='('){const node=expression();if(take()?.type!==')')throw Error('parenthesis');return node;}throw Error('term');}
 try{const tree=expression();if(at!==expanded.length)throw Error('extra');return{tree};}catch(_){return{error:'Check the operations and parentheses in the formula.'};}
}
function evaluateFormula(tree,n){
 if(Object.hasOwn(tree,'number'))return tree.number;if(tree.variable)return n;
 if(tree.unary)return tree.unary==='-'?-evaluateFormula(tree.value,n):evaluateFormula(tree.value,n);
 const left=evaluateFormula(tree.left,n),right=evaluateFormula(tree.right,n);
 if(tree.op==='+')return left+right;if(tree.op==='-')return left-right;if(tree.op==='*')return left*right;if(tree.op==='/')return left/right;if(tree.op==='^')return Math.pow(left,right);throw Error('operator');
}
function formulaEquivalent(raw,expected){
 const parsed=formulaExpression(raw);if(parsed.error)return parsed;
 try{for(const n of [1,2,3,5,10]){const actual=evaluateFormula(parsed.tree,n),value=expected.a+(n-1)*expected.d;if(!Number.isFinite(actual)||Math.abs(actual-value)>1e-8)return{ok:false};}return{ok:true};}catch(_){return{error:'Enter a valid explicit formula.'};}
}
function fieldResult(raw,field){return field.check==='formula'?formulaEquivalent(raw,field.formula):numericEqual(raw,field.answer);}

function finish(ok){
 locked=true;attempted++;window.BMAnalytics?.answerChecked(problem,ok);
 if(ok){score++;byId('feedback').innerHTML=`✓ Correct.<br>${problem.explain||''}`;byId('feedback').className='feedback correct';}
 else{byId('feedback').innerHTML=`✗ Some entries need correction.<br><strong>Complete correct response:</strong> ${problem.answerText}<br>${problem.explain||''}`;byId('feedback').className='feedback incorrect';window.BMAnalytics?.solutionRevealed(problem,{reveal_reason:'incorrect_answer'});}
 updateStats();byId('nextBtn').hidden=false;typeset([byId('feedback')]);
}
function checkChoice(index){
 if(locked)return;document.querySelectorAll('.choice-btn').forEach((button,i)=>{button.disabled=true;if(i===problem.correctIndex)button.classList.add('right');else if(i===index)button.classList.add('wrong');});finish(index===problem.correctIndex);
}
function checkInput(){
 if(locked)return;const input=byId('answer'),result=numericEqual(input.value,problem.answer);
 if(result.error){byId('feedback').textContent=result.error;byId('feedback').className='feedback incorrect';return;}
 input.disabled=true;byId('checkBtn').disabled=true;finish(result.ok);
}
function checkStructured(){
 if(locked)return;const fields=problem.kind==='formula'?[{id:'formula',label:'Explicit formula',check:'formula',formula:problem.formula,answerText:problem.answerText,inputKind:'formula'}]:problem.fields;
 let allCorrect=true;
 for(const field of fields){
  const input=byId(`answer-${field.id}`),wrapper=input.closest('.bm-u3-answer-field'),result=fieldResult(input.value,field),display=wrapper.querySelector('.bm-u3-field-result');
  input.disabled=true;wrapper.classList.remove('is-correct','is-incorrect');
  if(result.ok){wrapper.classList.add('is-correct');display.innerHTML='✓ Correct';}
  else{allCorrect=false;wrapper.classList.add('is-incorrect');display.innerHTML=`✗ ${result.error||`Correct response: ${field.answerText}`}`;}
 }
 byId('checkBtn').disabled=true;document.querySelectorAll('.bm-u3-shared-keypad button').forEach(button=>button.disabled=true);finish(allCorrect);typeset([byId('answerArea')]);
}

function makeButton(label,className,action,ariaLabel){const button=document.createElement('button');button.type='button';button.className=`bm-key ${className||''}`.trim();button.textContent=label;if(ariaLabel)button.setAttribute('aria-label',ariaLabel);button.addEventListener('pointerdown',event=>event.preventDefault());button.addEventListener('click',action);return button;}
function createSharedKeypad(inputs,formulaMode){
 let active=inputs[0];const touch=Boolean((window.matchMedia&&window.matchMedia('(pointer: coarse)').matches)||(navigator.maxTouchPoints||0)>0);
 function activate(input){active=input;inputs.forEach(item=>item.closest('.bm-u3-answer-field')?.classList.toggle('is-active',item===input));}
 function set(value){active.value=value;active.dispatchEvent(new Event('input',{bubbles:true}));active.focus({preventScroll:true});}
 function append(value){if(!active.disabled)set(active.value+value);}
 if(touch)document.documentElement.classList.add('bm-keypad-touch');
 for(const input of inputs){input.readOnly=false;input.inputMode=input.dataset.bmStructuredKind==='formula'?'text':'decimal';input.addEventListener('focus',()=>activate(input));input.addEventListener('pointerdown',()=>activate(input));input.addEventListener('click',()=>activate(input));}
 const pad=document.createElement('div');pad.className='bm-keypad bm-u3-shared-keypad';pad.setAttribute('role','group');pad.setAttribute('aria-label',formulaMode?'Formula keypad':'Number keypad');
 const entries=formulaMode?[
  ['7',''],['8',''],['9',''],['n','symbol'],['⌫','utility','back'],
  ['4',''],['5',''],['6',''],['(','symbol'],[')','symbol'],
  ['1',''],['2',''],['3',''],['+','symbol'],['−','symbol','minus'],
  ['0',''],['aₙ=','symbol','label'],['×','symbol','times'],['Clear','utility','clear'],['Check','check-key','check']
 ]:[
  ['7',''],['8',''],['9',''],['−','symbol','minus'],['⌫','utility','back'],
  ['4',''],['5',''],['6',''],['0',''],['Clear','utility','clear'],
  ['1',''],['2',''],['3',''],['','spacer','spacer'],['Check','check-key','check']
 ];
 for(const [label,className,action] of entries){
  if(action==='spacer'){const spacer=document.createElement('span');spacer.className='bm-spacer';pad.appendChild(spacer);continue;}
  const handler=action==='back'?()=>set(active.value.slice(0,-1)):action==='clear'?()=>set(''):action==='check'?checkStructured:action==='minus'?()=>append('-'):action==='times'?()=>append('*'):action==='label'?()=>append('aₙ='):()=>append(label);
  const button=makeButton(label,className,handler,action==='back'?'Backspace':undefined);if(action==='check')button.id='checkBtn';pad.appendChild(button);
 }
 byId('answerArea').appendChild(pad);activate(active);requestAnimationFrame(()=>active.focus({preventScroll:true}));
}
function renderStructured(){
 const fields=problem.kind==='formula'?[{id:'formula',label:'Explicit formula',check:'formula',formula:problem.formula,answerText:problem.answerText,inputKind:'formula'}]:problem.fields;
 const grid=document.createElement('div');
 grid.className=`bm-u3-field-grid ${fields.length===1?'is-single-field':fields.length>2?'is-four-fields':''}`;
 const inputs=[];
 for(const field of fields){
  const wrapper=document.createElement('div');wrapper.className='bm-u3-answer-field';
  const label=document.createElement('label');label.htmlFor=`answer-${field.id}`;label.className='answer-label';label.textContent=field.label;
  const input=document.createElement('input');input.id=`answer-${field.id}`;input.type='text';input.autocomplete='off';input.spellcheck=false;input.dataset.bmStructuredKind=field.check;input.setAttribute('aria-describedby',`result-${field.id}`);
  const result=document.createElement('div');result.id=`result-${field.id}`;result.className='bm-u3-field-result';result.setAttribute('aria-live','polite');
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();checkStructured();}});
  wrapper.append(label,input,result);grid.appendChild(wrapper);inputs.push(input);
 }
 byId('answerArea').appendChild(grid);createSharedKeypad(inputs,fields.some(field=>field.check==='formula'));
}
function render(){
 locked=false;byId('question').innerHTML=problem.q;byId('answerArea').innerHTML='';byId('feedback').innerHTML='';byId('feedback').className='feedback';byId('nextBtn').hidden=true;
 if(problem.kind==='input'){
  const label=document.createElement('label');label.htmlFor='answer';label.className='answer-label';label.textContent='Your answer';
  const input=document.createElement('input');input.id='answer';input.type='text';input.autocomplete='off';input.spellcheck=false;input.dataset.bmKeypad=problem.inputKind||'fraction';
  const check=document.createElement('button');check.id='checkBtn';check.type='button';check.className='check-answer';check.textContent='Check Answer';check.addEventListener('click',checkInput);
  byId('answerArea').append(label,input,check);input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();checkInput();}});
  window.BatchMathKeypad?.initAll?.();requestAnimationFrame(()=>input.focus({preventScroll:true}));
 }else if(problem.kind==='formula'||problem.kind==='multi')renderStructured();
 else{
  const choices=document.createElement('div');choices.className='choices';
  problem.choices.forEach((choice,index)=>{const button=document.createElement('button');button.type='button';button.className='choice-btn';button.innerHTML=choice;button.addEventListener('click',()=>checkChoice(index));choices.appendChild(button);});byId('answerArea').appendChild(choices);
 }
 updateStats();typeset([byId('question'),byId('answerArea')]);
}
function newProblem(){
 if(typeof generator!=='function'){byId('question').textContent='Practice generator unavailable.';return;}
 const mode=cfg.modeElementId?byId(cfg.modeElementId)?.value||'mixed':'mixed';let tries=0;
 do{problem=generator({mode});tries++;}while(problem&&recent.includes(problem.id)&&tries<15);
 recent.push(problem.id);if(recent.length>8)recent.shift();
 problem.problemType=cfg.slug;problem.problemVariant=problem.variant;problem.problemId=problem.id;problem.generatorVersion=String(window.BM_ANALYTICS_CONFIG?.generatorVersion||'1');
 render();window.BMAnalytics?.problemGenerated(problem);
}
function next(){if(!locked)return;newProblem();}
window.BatchMathIM1Unit3PracticeQA=Object.freeze({normalizeNumber,numericEqual,formulaExpression,evaluateFormula,formulaEquivalent,fieldResult});
document.addEventListener('DOMContentLoaded',()=>{
 byId('nextBtn')?.addEventListener('click',next);byId('resetBtn')?.addEventListener('click',()=>{score=0;attempted=0;recent=[];newProblem();});
 if(cfg.modeElementId)byId(cfg.modeElementId)?.addEventListener('change',()=>{recent=[];newProblem();});
 document.addEventListener('keydown',event=>{if(event.key==='Enter'&&locked){event.preventDefault();next();}});newProblem();
});
})();
