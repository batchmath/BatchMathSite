(function(){
'use strict';
const cfg=window.BM_UNIT3_PRACTICE||{};
const sectionBSlugs=new Set(['evaluating-functions','solving-function-equations','slope-from-two-points','collinearity-and-slope','slope-from-graphs','section-b-review']);
if(sectionBSlugs.has(cfg.slug))document.documentElement.classList.add('bm-u3-section-b-practice');
const generator=window.BatchMathIM1Unit3Generators?.get?.(cfg.slug);
const byId=id=>document.getElementById(id);
let problem=null,score=0,attempted=0,locked=false,enterAdvanceAllowed=false,recent=[],problemSerial=0;

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

function initialTermEquivalent(raw,expected){
 const entered=String(raw??'').trim().replace(/[−–—]/g,'-').replace(/\s+/g,'');
 if(!entered)return{error:'Enter the initial term.'};
 const numberOnly=normalizeNumber(entered),target=normalizeNumber(expected);
 if(!numberOnly.error)return{ok:Math.abs(numberOnly.value-target.value)<1e-9};
 const normalized=entered.toLowerCase().replace(/^a₁/,'a1').replace(/^a_\{1\}/,'a1').replace(/^a_1/,'a1').replace(/^a\(1\)/,'a1');
 if(normalized==='a1'||normalized==='a1=')return{error:'Enter the value of the initial term.'};
 if(!normalized.startsWith('a1='))return{error:'Enter the number, or write a₁ followed by an equals sign and the number.'};
 const value=normalizeNumber(normalized.slice(3));
 if(value.error)return{error:'Enter a complete initial-term value after a₁ =.'};
 return{ok:Math.abs(value.value-target.value)<1e-9};
}

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
function recursiveFormulaParts(raw){
 let value=String(raw??'').toLowerCase().trim().replace(/[−–—]/g,'-').replace(/\\quad/g,',').replace(/\\,/g,'').replace(/\s+/g,'');
 if(!value)return{error:'Enter a recursive formula.'};
 value=value.replace(/aₙ₋₁/g,'aprev').replace(/a_\{n-1\}/g,'aprev').replace(/a_\(n-1\)/g,'aprev').replace(/a\(n-1\)/g,'aprev');
 value=value.replace(/aₙ/g,'an').replace(/a_\{n\}/g,'an').replace(/a_n/g,'an');
 value=value.replace(/a₁/g,'a1').replace(/a_\{1\}/g,'a1').replace(/a_1/g,'a1');
 const parts=value.split(/[,;]/).filter(Boolean);if(parts.length!==2)return{error:'Enter both the initial value and the recursive rule, separated by a comma.'};
 let initial=null,change=null;
 for(const part of parts){
  if(part.startsWith('a1=')){
   if(initial!==null)return{error:'Enter the initial value once.'};
   const parsed=normalizeNumber(part.slice(3));if(parsed.error)return{error:'Check the initial value in the recursive formula.'};initial=parsed.value;continue;
  }
  if(part.startsWith('an=')){
   if(change!==null)return{error:'Enter the recursive rule once.'};
   const right=part.slice(3);if(!right.startsWith('aprev'))return{error:'Write the recursive rule using aₙ₋₁.'};
   const tail=right.slice(5);if(!tail){change=0;continue;}
   if(!/^[+-]/.test(tail))return{error:'Add or subtract the common difference after aₙ₋₁.'};
   const parsed=normalizeNumber(tail.slice(1));if(parsed.error)return{error:'Check the common difference in the recursive rule.'};change=(tail[0]==='-'?-1:1)*parsed.value;continue;
  }
  return{error:'Use a₁ for the initial value and aₙ with aₙ₋₁ for the recursive rule.'};
 }
 if(initial===null||change===null)return{error:'Enter both the initial value and the recursive rule.'};
 return{a:initial,d:change};
}
function recursiveFormulaEquivalent(raw,expected){const parsed=recursiveFormulaParts(raw);if(parsed.error)return parsed;return{ok:Math.abs(parsed.a-expected.a)<1e-9&&Math.abs(parsed.d-expected.d)<1e-9};}
function recursiveRuleEquivalent(raw,expected){
 let value=String(raw??'').toLowerCase().trim().replace(/[−–—]/g,'-').replace(/\s+/g,'');
 value=value.replace(/aₙ₋₁/g,'aprev').replace(/a_\{n-1\}/g,'aprev').replace(/a_\(n-1\)/g,'aprev').replace(/a\(n-1\)/g,'aprev');
 value=value.replace(/aₙ/g,'an').replace(/a_\{n\}/g,'an').replace(/a_n/g,'an');
 if(!value.startsWith('an='))return{error:'Write the recursive rule using aₙ and aₙ₋₁.'};
 const right=value.slice(3);if(!right.startsWith('aprev'))return{error:'Write the recursive rule using aₙ₋₁.'};
 const tail=right.slice(5);if(!tail)return{ok:Math.abs(expected.d)<1e-9};
 if(!/^[+-]/.test(tail))return{error:'Add or subtract the common difference after aₙ₋₁.'};
 const parsed=normalizeNumber(tail.slice(1));if(parsed.error)return{error:'Check the common difference in the recursive rule.'};
 const change=(tail[0]==='-'?-1:1)*parsed.value;return{ok:Math.abs(change-expected.d)<1e-9};
}
function normalizeEquationText(raw){
 return String(raw??'').toLowerCase().trim().replace(/[−–—]/g,'-').replace(/[×·⋅∙]/g,'*').replace(/[⁄÷]/g,'/').replace(/\\left|\\right/g,'').replace(/\\,/g,'').replace(/\\frac\s*\{(-?\d+(?:\.\d+)?)\}\s*\{(-?\d+(?:\.\d+)?)\}/g,'($1/$2)').replace(/\s+/g,'');
}
function stripOuterParentheses(raw){
 let value=raw;
 while(value.startsWith('(')&&value.endsWith(')')){
  let depth=0,wraps=true;
  for(let index=0;index<value.length;index++){if(value[index]==='(')depth++;else if(value[index]===')')depth--;if(depth===0&&index<value.length-1){wraps=false;break;}}
  if(!wraps)break;value=value.slice(1,-1);
 }
 return value;
}
function mathNumber(raw){
 const value=stripOuterParentheses(String(raw).replace(/^\+/,''));
 const stacked=value.match(/^(-?)\(([^()]+)\)\/\(([^()]+)\)$/);
 if(stacked){
  const parsed=normalizeNumber(`${stacked[2]}/${stacked[3]}`);
  return parsed.error?parsed:{value:(stacked[1]==='-'?-1:1)*parsed.value};
 }
 return normalizeNumber(value);
}
function coefficientValue(raw){
 const token=String(raw).replace(/\*$/,'');
 if(token===''||token==='+')return{value:1};if(token==='-')return{value:-1};
 const signedParentheses=token.match(/^([+-])\(([^()]*)\)$/);if(signedParentheses){const parsed=mathNumber(signedParentheses[2]);return parsed.error?parsed:{value:(signedParentheses[1]==='-'?-1:1)*parsed.value};}
 return mathNumber(token);
}
function shiftedVariableValue(raw,variable){
 if(raw===variable)return{value:0};if(!raw.startsWith(variable))return{error:`Use ${variable} first in this part of the equation.`};
 const rest=raw.slice(variable.length);if(!/^[+-]/.test(rest))return{error:`Write this part as ${variable} minus or plus a number.`};
 const number=mathNumber(rest.slice(1));if(number.error)return number;
 return{value:rest[0]==='-'?number.value:-number.value};
}
function parseSlopeExpression(raw){
 const expression=String(raw).replace(/\(x\)/g,'x').replace(/\*/g,''),matches=expression.match(/x/g)||[];
 if(matches.length!==1)return{error:'Write exactly one x-term.'};
 const at=expression.indexOf('x');let before=expression.slice(0,at),after=expression.slice(at+1),slope=coefficientValue(before);
 if(slope.error)return{error:'Check the coefficient of x.'};
 if(after.startsWith('/')){
  const match=after.match(/^\/((?:\([^()]+\))|(?:[+-]?(?:\d+(?:\.\d*)?|\.\d+)))(.*)$/);
  if(!match)return{error:'Check the denominator attached to x.'};
  const denominator=mathNumber(match[1]);if(denominator.error||denominator.value===0)return{error:'Use a nonzero denominator.'};
  slope={value:slope.value/denominator.value};after=match[2];
 }
 let intercept={value:0};if(after){if(!/^[+-]/.test(after))return{error:'Write the constant after the x-term.'};intercept=mathNumber(after);if(intercept.error)return{error:'Check the constant term.'};}
 return{m:slope.value,b:intercept.value};
}
function lineEquationEquivalent(raw,expected){
 const equation=normalizeEquationText(raw);if(!equation)return{error:'Enter an equation.'};
 const parts=equation.split('=');if(parts.length!==2||!parts[0]||!parts[1])return{error:'Enter one complete equation with an equals sign.'};
 const [left,right]=parts,allowedLeft=expected.left||['y'];
 if(expected.form==='slope-intercept'){
  if(!allowedLeft.includes(left))return{error:`Use slope-intercept form with ${allowedLeft[0]} isolated on the left.`};
  if(/[yfn]/.test(right.replace(/f\(x\)/g,'')))return{error:'The right side should contain only an x-term and a constant.'};
  const parsed=parseSlopeExpression(right);if(parsed.error)return{error:'Use slope-intercept form with the x-term before the constant.'};
  return{ok:Math.abs(parsed.m-expected.m)<1e-9&&Math.abs(parsed.b-expected.b)<1e-9};
 }
 if(expected.form==='point-slope'){
  const yShift=shiftedVariableValue(left,'y');if(yShift.error)return{error:'Use point-slope form with y minus the point’s y-coordinate on the left.'};
  const cleanedRight=right.replace(/\*\(/g,'(');let slope,xShift;
  if(Math.abs(expected.m-1)<1e-9){slope={value:1};xShift=shiftedVariableValue(stripOuterParentheses(cleanedRight),'x');}
  else{
   const grouped=cleanedRight.match(/^(.*?)\((x(?:[+-].+)?)\)$/);
   if(!grouped)return{error:'Use point-slope form with the slope multiplying a parenthesized x-shift.'};
   slope=coefficientValue(grouped[1]);xShift=shiftedVariableValue(grouped[2],'x');
  }
  if(slope.error||xShift.error)return{error:'Check the slope and the point used in point-slope form.'};
  const points=expected.points||[[expected.x1,expected.y1]],matchesPoint=points.some(([x,y])=>Math.abs(xShift.value-x)<1e-9&&Math.abs(yShift.value-y)<1e-9);
  return{ok:Math.abs(slope.value-expected.m)<1e-9&&matchesPoint};
 }
 return{error:'This equation type is not available.'};
}
function fieldResult(raw,field){if(field.check==='formula')return formulaEquivalent(raw,field.formula);if(field.check==='recursive')return recursiveFormulaEquivalent(raw,field.recursive);if(field.check==='recursive-rule')return recursiveRuleEquivalent(raw,field.recursive);if(field.check==='initial-term')return initialTermEquivalent(raw,field.answer);if(field.check==='line')return lineEquationEquivalent(raw,field.line);return numericEqual(raw,field.answer);}

function isYesNoProblem(item){return (item?.kind==='mc'||item?.kind==='arithmetic-identification')&&item.choices?.length===2&&[...item.choices].sort().join('|')==='No|Yes';}
function enterAdvanceRule(ok,responseType){return Boolean(ok&&(responseType==='typed'||responseType==='completed-no'));}
function finish(ok,responseType){
 locked=true;attempted++;window.BMAnalytics?.answerChecked(problem,ok);
 if(ok){score++;byId('feedback').innerHTML=`✓ Correct.<br>${problem.explain||''}`;byId('feedback').className='feedback correct';}
 else{byId('feedback').innerHTML=`✗ Some entries need correction.<br><strong>Complete correct response:</strong> ${problem.answerText}<br>${problem.explain||''}`;byId('feedback').className='feedback incorrect';window.BMAnalytics?.solutionRevealed(problem,{reveal_reason:'incorrect_answer'});}
 enterAdvanceAllowed=enterAdvanceRule(ok,responseType);
 updateStats();byId('nextBtn').hidden=false;typeset([byId('feedback')]);
}
function markChoices(index){document.querySelectorAll('.choice-btn').forEach((button,i)=>{button.disabled=true;if(i===problem.correctIndex)button.classList.add('right');else if(i===index)button.classList.add('wrong');});}
function renderArithmeticDifferenceStage(){
 const stage=document.createElement('div');stage.className='bm-u3-arithmetic-followup';
 const label=document.createElement('label');label.htmlFor='answer';label.className='answer-label';label.textContent=problem.differencePrompt;
 const input=document.createElement('input');input.id='answer';input.type='text';input.autocomplete='off';input.spellcheck=false;input.dataset.bmKeypad='integer';
 const check=document.createElement('button');check.id='checkBtn';check.type='button';check.className='check-answer';check.textContent='Check Answer';check.addEventListener('click',checkArithmeticDifference);
 stage.append(label,input,check);byId('answerArea').appendChild(stage);
 input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();checkArithmeticDifference();}});
 window.BatchMathKeypad?.initAll?.();requestAnimationFrame(()=>input.focus({preventScroll:true}));
}
function checkArithmeticDifference(){
 if(locked)return;const input=byId('answer'),result=numericEqual(input.value,String(problem.difference));
 if(result.error){byId('feedback').textContent=result.error;byId('feedback').className='feedback incorrect';return;}
 input.disabled=true;byId('checkBtn').disabled=true;finish(result.ok,'typed');
}
function checkChoice(index){
 if(locked)return;markChoices(index);const ok=index===problem.correctIndex;
 if(problem.kind==='arithmetic-identification'&&ok&&problem.arithmetic){
  byId('feedback').textContent=`✓ ${problem.decisionFeedback}`;byId('feedback').className='feedback correct';renderArithmeticDifferenceStage();return;
 }
 finish(ok,problem.kind==='arithmetic-identification'&&ok&&!problem.arithmetic?'completed-no':'choice');
}
function checkInput(){
 if(locked)return;const input=byId('answer'),result=numericEqual(input.value,problem.answer);
 if(result.error){byId('feedback').textContent=result.error;byId('feedback').className='feedback incorrect';return;}
 input.disabled=true;byId('checkBtn').disabled=true;finish(result.ok,'typed');
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
 if(byId('checkBtn'))byId('checkBtn').disabled=true;document.querySelectorAll('.bm-u3-shared-keypad button,.bm-calc-keypad button').forEach(button=>button.disabled=true);finish(allCorrect,'typed');typeset([byId('answerArea')]);
}

function makeButton(label,className,action,ariaLabel){const button=document.createElement('button');button.type='button';button.className=`bm-key ${className||''}`.trim();button.textContent=label;if(ariaLabel)button.setAttribute('aria-label',ariaLabel);button.addEventListener('pointerdown',event=>event.preventDefault());button.addEventListener('click',action);return button;}
function createSharedKeypad(inputs,keypadMode){
 let active=inputs[0];const touch=Boolean((window.matchMedia&&window.matchMedia('(pointer: coarse)').matches)||(navigator.maxTouchPoints||0)>0);
 function activate(input){active=input;inputs.forEach(item=>item.closest('.bm-u3-answer-field')?.classList.toggle('is-active',item===input));}
 function set(value){active.value=value;active.dispatchEvent(new Event('input',{bubbles:true}));active.focus({preventScroll:true});}
 function append(value){if(!active.disabled)set(active.value+value);}
 if(touch)document.documentElement.classList.add('bm-keypad-touch');
 for(const input of inputs){input.readOnly=false;input.inputMode=['formula','recursive','line'].includes(input.dataset.bmStructuredKind)?'text':'decimal';input.addEventListener('focus',()=>activate(input));input.addEventListener('pointerdown',()=>activate(input));input.addEventListener('click',()=>activate(input));}
 const pad=document.createElement('div');pad.className=`bm-keypad bm-u3-shared-keypad bm-u3-${keypadMode}-keypad`;pad.setAttribute('role','group');pad.setAttribute('aria-label',keypadMode==='equation'?'Equation keypad':keypadMode==='formula'?'Formula keypad':keypadMode==='recursive'?'Recursive-formula keypad':'Number keypad');
 const formulaEntries=[
  ['7',''],['8',''],['9',''],['n','symbol'],['⌫','utility','back'],
  ['4',''],['5',''],['6',''],['(','symbol'],[')','symbol'],
  ['1',''],['2',''],['3',''],['+','symbol'],['−','symbol','minus'],
  ['0',''],['aₙ=','symbol','label'],['×','symbol','times'],['Clear','utility','clear'],['Check','check-key','check']
 ];
 const equationEntries=[
  ['7',''],['8',''],['9',''],['x','symbol'],['⌫','utility','back'],
  ['4',''],['5',''],['6',''],['y','symbol'],['(','symbol'],
  ['1',''],['2',''],['3',''],[')','symbol'],['a⁄b','symbol','insert','/'],
  ['0',''],['.','symbol'],['+','symbol'],['−','symbol','minus'],['=','symbol'],
  ['f(x)','symbol'],['×','symbol','times'],['Clear','utility','clear'],['Check','check-key','check'],['','spacer','spacer']
 ];
 const numberEntries=[
  ['7',''],['8',''],['9',''],['−','symbol','minus'],['⌫','utility','back'],
  ['4',''],['5',''],['6',''],['0',''],['Clear','utility','clear'],
  ['1',''],['2',''],['3',''],['.','symbol'],['Check','check-key','check']
 ];
 const recursiveEntries=[
  ['7',''],['8',''],['9',''],['a₁=','symbol','insert','a₁='],['⌫','utility','back'],
  ['4',''],['5',''],['6',''],['aₙ=','symbol','insert','aₙ='],['(','symbol'],
  ['1',''],['2',''],['3',''],['aₙ₋₁','symbol','insert','aₙ₋₁'],[')','symbol'],
  ['0',''],[',','symbol'],['+','symbol'],['−','symbol','minus'],['Clear','utility','clear'],
  ['a⁄b','symbol','insert','/'],['×','symbol','times'],['','spacer','spacer'],['','spacer','spacer'],['Check','check-key','check']
 ];
 const entries=keypadMode==='equation'?equationEntries:keypadMode==='formula'?formulaEntries:keypadMode==='recursive'?recursiveEntries:numberEntries;
 for(const [label,className,action,insertValue] of entries){
  if(action==='spacer'){const spacer=document.createElement('span');spacer.className='bm-spacer';pad.appendChild(spacer);continue;}
  const handler=action==='back'?()=>set(active.value.slice(0,-1)):action==='clear'?()=>set(''):action==='check'?checkStructured:action==='minus'?()=>append('-'):action==='times'?()=>append('*'):action==='label'?()=>append('aₙ='):action==='insert'?()=>append(insertValue):()=>append(label);
  const button=makeButton(label,className,handler,action==='back'?'Backspace':undefined);if(action==='check')button.id='checkBtn';pad.appendChild(button);
 }
 byId('answerArea').appendChild(pad);activate(active);requestAnimationFrame(()=>active.focus({preventScroll:true}));
}
function renderStructured(){
 const fields=problem.kind==='formula'?[{id:'formula',label:'Explicit formula',check:'formula',formula:problem.formula,answerText:problem.answerText,inputKind:'formula'}]:problem.fields;
 const grid=document.createElement('div');
 grid.className=`bm-u3-field-grid ${fields.length===1?'is-single-field':fields.length===3?'is-three-fields':fields.length>4?'is-many-fields':fields.length>3?'is-four-fields':''}`;
 const inputs=[];
 for(const field of fields){
  const wrapper=document.createElement('div');wrapper.className='bm-u3-answer-field';
  const label=document.createElement('label');label.htmlFor=`answer-${field.id}`;label.className='answer-label';
  if(field.labelHtml)label.innerHTML=field.labelHtml;else label.textContent=field.label;
  const input=document.createElement('input');input.id=`answer-${field.id}`;input.type='text';input.autocomplete='off';input.spellcheck=false;input.dataset.bmStructuredKind=field.check;input.setAttribute('aria-describedby',`result-${field.id}`);
  const result=document.createElement('div');result.id=`result-${field.id}`;result.className='bm-u3-field-result';result.setAttribute('aria-live','polite');
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();checkStructured();}});
  wrapper.append(label,input,result);grid.appendChild(wrapper);inputs.push(input);
 }
 const keypadMode=fields.some(field=>field.check==='line')?'equation':fields.some(field=>field.check==='recursive'||field.check==='recursive-rule')?'recursive':fields.some(field=>field.check==='formula')?'formula':'number';
 byId('answerArea').appendChild(grid);
 if(fields.some(field=>['line','initial-term','formula','recursive','recursive-rule'].includes(field.check))&&window.BatchMathCalculusKeypad?.mountInputs){
  window.BatchMathCalculusKeypad.mountInputs(inputs,byId('answerArea'),{mode:'unit3',onCheck:checkStructured});
 }else createSharedKeypad(inputs,keypadMode);
}
function render(){
 locked=false;enterAdvanceAllowed=false;byId('question').innerHTML=problem.q;byId('answerArea').innerHTML='';byId('feedback').innerHTML='';byId('feedback').className='feedback';byId('nextBtn').hidden=true;
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
 problemSerial++;const sectionNumber=problem.id?.match(/^u3-0([1-4])/i)?.[1];problem.unitSection=sectionNumber?['a','b','c','d'][Number(sectionNumber)-1]:'';
 document.documentElement.classList.toggle('bm-u3-section-b-problem',problem.unitSection==='b');
 problem.problemType=cfg.slug;problem.problemVariant=problem.variant;problem.problemId=problem.id;problem.generatorVersion=String(window.BM_ANALYTICS_CONFIG?.generatorVersion||'1');
 render();window.BMAnalytics?.problemGenerated(problem);
}
function next(){if(!locked)return;newProblem();}
window.BatchMathIM1Unit3PracticeQA=Object.freeze({normalizeNumber,numericEqual,formulaExpression,evaluateFormula,formulaEquivalent,recursiveFormulaParts,recursiveFormulaEquivalent,recursiveRuleEquivalent,initialTermEquivalent,normalizeEquationText,lineEquationEquivalent,fieldResult,isYesNoProblem,enterAdvanceRule});
document.addEventListener('DOMContentLoaded',()=>{
 document.addEventListener('keydown',event=>{
  if(event.key!=='Enter')return;
  if(event.repeat){event.preventDefault();event.stopImmediatePropagation();return;}
  if(!locked)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(enterAdvanceAllowed)next();
 },true);
 byId('nextBtn')?.addEventListener('click',next);byId('resetBtn')?.addEventListener('click',()=>{score=0;attempted=0;recent=[];newProblem();});
 if(cfg.modeElementId)byId(cfg.modeElementId)?.addEventListener('change',()=>{recent=[];newProblem();});
 newProblem();
});
})();
