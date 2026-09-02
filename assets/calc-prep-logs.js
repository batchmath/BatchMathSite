(function(){
'use strict';
const B=BMPrep,$=B.$,mode=$('mode'),prompt=$('prompt'),question=$('question'),choicesEl=$('choices'),submit=$('submit'),next=$('next');
let correct=0,attempted=0,current=null,locked=false,getChoice=()=>null,seen=new Set();

function uniq(a){return a.filter((v,i,x)=>x.indexOf(v)===i)}
function qobj(id,p,q,a,cs,m){
 const vals=uniq([a,...cs]);
 const fillers=['0','1','−1','x','x + 1','x − 1','undefined'];
 for(const v of fillers){if(vals.length>=4)break;if(!vals.includes(v))vals.push(v)}
 return {id,prompt:p,question:q,answer:a,choices:vals.slice(0,4),method:m};
}
function base(){return B.pick([2,3,4,5,7,8,10,'ln'])}
function htmlPart(v){return B.hasMathMarkup(v)?String(v):B.inlineMathHTML(v)}
function L(b,arg){const name=b==='ln'?'ln':`log<sub>${b}</sub>`;return `${name}(${htmlPart(arg)})`}
function shift(a){return a===0?'x':a>0?`x + ${a}`:`x − ${-a}`}
function pow(base,n){return n===1?base:`${base}^${n}`}
function frac(n,d){return `<span class="math-frac nested-frac"><span class="num">${htmlPart(n)}</span><span class="bar"></span><span class="den">${htmlPart(d)}</span></span>`}
function expHTML(b,e){return `${htmlPart(b)}<sup>${htmlPart(e)}</sup>`}
function logCoeff(n,expr){return n===1?expr:`${n} ${expr}`}
function factorPow(f,n){return n===1?`(${f})`:`(${f})^${n}`}
function posShift(){return shift(B.pick([-5,-4,-3,-2,-1,1,2,3,4,5]))}

function product(){
 const b=base(),t=B.randInt(0,7),c=B.pick([2,3,4,5,6,7]),f1=posShift(),n=B.pick([2,3,4]),m=B.pick([2,3,4]);let f2;do{f2=posShift()}while(f2===f1);
 if(t===0){
  const q=L(b,`${c}x`),a=`${L(b,String(c))} + ${L(b,'x')}`;
  return qobj(`prod0-${b}-${c}`,'Apply the product rule.',q,a,[`${L(b,String(c))} − ${L(b,'x')}`,`${c} ${L(b,'x')}`,`${L(b,String(c))} + ${c} ${L(b,'x')}`],'Split the product inside the logarithm into a sum of logarithms with the same base.');
 }
 if(t===1){
  const q=L(b,`(${f1})(${f2})`),a=`${L(b,f1)} + ${L(b,f2)}`;
  return qobj(`prod1-${b}-${f1}-${f2}`,'Apply the product rule.',q,a,[`${L(b,f1)} − ${L(b,f2)}`,`${L(b,f2)} − ${L(b,f1)}`,`2 ${L(b,`${f1} + ${f2}`)}`],'A logarithm of a product becomes a sum of logarithms.');
 }
 if(t===2){
  const q=L(b,`${c}${pow('x',n)}`),a=`${L(b,String(c))} + ${n} ${L(b,'x')}`;
  return qobj(`prod2-${b}-${c}-${n}`,'Expand using the product and power rules.',q,a,[`${L(b,String(c))} − ${n} ${L(b,'x')}`,`${n} ${L(b,String(c))} + ${L(b,'x')}`,`${c} ${L(b,'x')} + ${n} ${L(b,String(c))}`],'Separate the constant and variable factors, then bring the variable exponent in front.');
 }
 if(t===3){
  const q=L(b,`x${factorPow(f1,n)}`),a=`${L(b,'x')} + ${n} ${L(b,f1)}`;
  return qobj(`prod3-${b}-${f1}-${n}`,'Expand completely.',q,a,[`${L(b,'x')} − ${n} ${L(b,f1)}`,`${n} ${L(b,'x')} + ${L(b,f1)}`,`${n} ${L(b,'x')} − ${L(b,f1)}`],'Use the product rule first, then use the power rule on the powered factor.');
 }
 if(t===4){
  const q=L(b,`${factorPow(f1,n)}${factorPow(f2,m)}`),a=`${n} ${L(b,f1)} + ${m} ${L(b,f2)}`;
  return qobj(`prod4-${b}-${f1}-${f2}-${n}-${m}`,'Expand the product completely.',q,a,[`${n} ${L(b,f1)} − ${m} ${L(b,f2)}`,`${m} ${L(b,f1)} + ${n} ${L(b,f2)}`,`${n+m} ${L(b,f1)} + ${L(b,f2)}`],'Split the product, then bring each exponent in front of its logarithm.');
 }
 if(t===5){
  const q=L(b,`${c}x(${f1})`),a=`${L(b,String(c))} + ${L(b,'x')} + ${L(b,f1)}`;
  return qobj(`prod5-${b}-${c}-${f1}`,'Expand the three-factor product.',q,a,[`${L(b,String(c))} + ${L(b,'x')} − ${L(b,f1)}`,`${L(b,String(c))} − ${L(b,'x')} + ${L(b,f1)}`,`${c} ${L(b,'x')} + ${L(b,f1)}`],'Each factor in a product becomes its own added logarithm.');
 }
 if(t===6){
  const q=L(b,`√(x)${factorPow(f1,n)}`),a=`<span class="math-frac nested-frac"><span class="num">1</span><span class="bar"></span><span class="den">2</span></span> ${L(b,'x')} + ${n} ${L(b,f1)}`;
  return qobj(`prod6-${b}-${f1}-${n}`,'Expand completely.',q,a,[`2 ${L(b,'x')} + ${n} ${L(b,f1)}`,`<span class="math-frac nested-frac"><span class="num">1</span><span class="bar"></span><span class="den">2</span></span> ${L(b,'x')} − ${n} ${L(b,f1)}`,`${n} ${L(b,'x')} + 2 ${L(b,f1)}`],'Rewrite the square root as a one-half power, split the product, and then use the power rule.');
 }
 const q=L(b,`(x^2 + ${c})(${f1})(${f2})`),a=`${L(b,`x^2 + ${c}`)} + ${L(b,f1)} + ${L(b,f2)}`;
 return qobj(`prod7-${b}-${c}-${f1}-${f2}`,'Expand the product completely.',q,a,[`${L(b,`x^2 + ${c}`)} + ${L(b,f1)} − ${L(b,f2)}`,`${L(b,`x^2 + ${c}`)} − ${L(b,f1)} − ${L(b,f2)}`,`2 ${L(b,`x^2 + ${c}`)} + ${L(b,f1)}`],'A product of three factors becomes the sum of three logarithms. Do not split an addition inside a single factor.');
}

function quotient(){
 const b=base(),t=B.randInt(0,7),c=B.pick([2,3,4,5,6,7]),f1=posShift(),n=B.pick([2,3,4]),m=B.pick([2,3,4]);let f2;do{f2=posShift()}while(f2===f1);
 if(t===0){
  const q=L(b,frac(f1,String(c))),a=`${L(b,f1)} − ${L(b,String(c))}`;
  return qobj(`quo0-${b}-${f1}-${c}`,'Apply the quotient rule.',q,a,[`${L(b,f1)} + ${L(b,String(c))}`,`${L(b,String(c))} − ${L(b,f1)}`,`${c} ${L(b,f1)}`],'A logarithm of a quotient becomes the logarithm of the numerator minus the logarithm of the denominator.');
 }
 if(t===1){
  const q=L(b,frac(f1,f2)),a=`${L(b,f1)} − ${L(b,f2)}`;
  return qobj(`quo1-${b}-${f1}-${f2}`,'Apply the quotient rule.',q,a,[`${L(b,f1)} + ${L(b,f2)}`,`${L(b,f2)} − ${L(b,f1)}`,`2 ${L(b,f1)} − ${L(b,f2)}`],'Subtract the logarithm of the denominator from the logarithm of the numerator.');
 }
 if(t===2){
  const q=L(b,frac(pow('x',n),f1)),a=`${n} ${L(b,'x')} − ${L(b,f1)}`;
  return qobj(`quo2-${b}-${f1}-${n}`,'Expand completely.',q,a,[`${n} ${L(b,'x')} + ${L(b,f1)}`,`${L(b,'x')} − ${n} ${L(b,f1)}`,`${n} ${L(b,f1)} − ${L(b,'x')}`],'Use the quotient rule and then bring the numerator exponent in front.');
 }
 if(t===3){
  const q=L(b,frac(String(c),factorPow(f1,n))),a=`${L(b,String(c))} − ${n} ${L(b,f1)}`;
  return qobj(`quo3-${b}-${f1}-${c}-${n}`,'Expand the quotient completely.',q,a,[`${L(b,String(c))} + ${n} ${L(b,f1)}`,`${n} ${L(b,String(c))} − ${L(b,f1)}`,`${L(b,f1)} − ${n} ${L(b,String(c))}`],'Use the quotient rule, then bring the denominator exponent in front.');
 }
 if(t===4){
  const q=L(b,frac(`${c}${pow('x',n)}`,factorPow(f1,m))),a=`${L(b,String(c))} + ${n} ${L(b,'x')} − ${m} ${L(b,f1)}`;
  return qobj(`quo4-${b}-${f1}-${c}-${n}-${m}`,'Expand the quotient completely.',q,a,[`${L(b,String(c))} + ${n} ${L(b,'x')} + ${m} ${L(b,f1)}`,`${L(b,String(c))} − ${n} ${L(b,'x')} − ${m} ${L(b,f1)}`,`${n} ${L(b,'x')} − ${L(b,String(c))} − ${m} ${L(b,f1)}`],'Apply the quotient rule, split the numerator product, and then use the power rule.');
 }
 if(t===5){
  const q=L(b,frac(`(${f1})(${f2})`,pow('x',n))),a=`${L(b,f1)} + ${L(b,f2)} − ${n} ${L(b,'x')}`;
  return qobj(`quo5-${b}-${f1}-${f2}-${n}`,'Expand completely.',q,a,[`${L(b,f1)} − ${L(b,f2)} − ${n} ${L(b,'x')}`,`${L(b,f1)} + ${L(b,f2)} + ${n} ${L(b,'x')}`,`${n} ${L(b,f1)} + ${L(b,f2)} − ${L(b,'x')}`],'Use the quotient rule first, split the numerator product, then apply the power rule to the denominator.');
 }
 if(t===6){
  const q=L(b,frac(`x^2 + ${c}`,factorPow(f1,n))),a=`${L(b,`x^2 + ${c}`)} − ${n} ${L(b,f1)}`;
  return qobj(`quo6-${b}-${c}-${f1}-${n}`,'Expand completely.',q,a,[`${L(b,`x^2 + ${c}`)} + ${n} ${L(b,f1)}`,`${n} ${L(b,`x^2 + ${c}`)} − ${L(b,f1)}`,`${L(b,f1)} − ${n} ${L(b,`x^2 + ${c}`)}`],'The numerator is one factor because its terms are added. Subtract the powered denominator logarithm.');
 }
 const q=L(b,frac(`${c}${factorPow(f1,n)}`,factorPow(f2,m))),a=`${L(b,String(c))} + ${n} ${L(b,f1)} − ${m} ${L(b,f2)}`;
 return qobj(`quo7-${b}-${c}-${f1}-${f2}-${n}-${m}`,'Expand the quotient completely.',q,a,[`${L(b,String(c))} + ${n} ${L(b,f1)} + ${m} ${L(b,f2)}`,`${n} ${L(b,String(c))} + ${L(b,f1)} − ${m} ${L(b,f2)}`,`${L(b,String(c))} − ${n} ${L(b,f1)} − ${m} ${L(b,f2)}`],'Split the numerator product, subtract the denominator logarithm, and bring both exponents in front.');
}

function powerRule(){
 const b=base(),n=B.randInt(2,7),inside=B.pick(['x',posShift(),'sin(x)','cos(x)','x^2 + 1']);
 const q=L(b,pow(`(${inside})`,n)),a=`${n} ${L(b,inside)}`;
 return qobj(`pow-${b}-${n}-${inside}`,'Apply the power rule.',q,a,[`${n+1} ${L(b,inside)}`,`${L(b,inside)} + ${n}`,`${n} − ${L(b,inside)}`],'An exponent on the logarithm argument moves in front as a coefficient.');
}

function expand(){
 const b=base(),m=B.randInt(2,5),n=B.randInt(2,4),p=B.randInt(2,4),c=B.pick([2,3,5,7]);
 const q=L(b,frac(`${c}${pow('x',m)}${pow('y',n)}`,pow('z',p)));
 const a=`${L(b,String(c))} + ${m} ${L(b,'x')} + ${n} ${L(b,'y')} − ${p} ${L(b,'z')}`;
 return qobj(`exp-${b}-${c}-${m}-${n}-${p}`,'Expand completely.',q,a,[`${L(b,String(c))} + ${m} ${L(b,'x')} + ${n} ${L(b,'y')} + ${p} ${L(b,'z')}`,`${L(b,String(c))} − ${m} ${L(b,'x')} + ${n} ${L(b,'y')} − ${p} ${L(b,'z')}`,`${m} ${L(b,'x')} + ${n} ${L(b,'y')} − ${p} ${L(b,'z')}`],'Use product, quotient, and power rules. Numerator factors add; denominator factors subtract.');
}

function condense(){
 const b=base(),m=B.randInt(2,5),n=B.randInt(2,4),p=B.randInt(2,4),c=B.pick([2,3,5,7]);
 const q=`${L(b,String(c))} + ${m} ${L(b,'x')} + ${n} ${L(b,'y')} − ${p} ${L(b,'z')}`;
 const a=L(b,frac(`${c}${pow('x',m)}${pow('y',n)}`,pow('z',p)));
 return qobj(`con-${b}-${c}-${m}-${n}-${p}`,'Condense to one logarithm.',q,a,[L(b,frac(`${c}${pow('x',m)}`,`${pow('y',n)}${pow('z',p)}`)),L(b,frac(`${pow('x',m)}${pow('y',n)}`,`${c}${pow('z',p)}`)),L(b,`${c}${pow('x',m)}${pow('y',n)}${pow('z',p)}`)],'Move coefficients back to exponents, combine sums as products, and combine subtraction as division.');
}

function changebase(){
 const b=B.pick([2,3,4,5,7,8,10]),x=B.pick(['x','17','25','a','x + 3','2x − 1']),useLn=Math.random()<.6;
 const top=useLn?`ln(${htmlPart(x)})`:`log(${htmlPart(x)})`,bot=useLn?`ln(${b})`:`log(${b})`,a=frac(top,bot);
 return qobj(`cb-${b}-${x}-${useLn}`,'Use the change-of-base formula.',`${L(b,x)} = ?`,a,[frac(bot,top),`${top} − ${bot}`,`${top} + ${bot}`],`Change of base divides a logarithm of the argument by a logarithm of the base. ${useLn?'Natural logarithms':'Common logarithms'} are being used here.`);
}

function evaluate(){
 const b=B.pick([2,3,4,5,10]),k=B.pick([-3,-2,-1,0,1,2,3,4]);
 const val=k>=0?String(b**k):frac('1',String(b**(-k)));
 return qobj(`eval-${b}-${k}`,'Evaluate exactly.',L(b,val),String(k),[String(-k),String(k+1),String(k-1)],`Ask what exponent on ${b} produces the displayed argument.`);
}

function inverse(){
 const b=B.pick([2,3,4,5,7,8,10]),type=B.randInt(0,11);
 const simple=B.pick(['x','x^2','x^2 + 1','3x − 2','sin(x)','cos(x)','√(x + 1)']);
 const advanced=B.pick(['sin(x)','cos(x)','x^2','x^2 + 3','sin(2x)','cos(x^2)','(x − 2)^3']);
 if(type===0){const e=expHTML(String(b),simple);return qobj(`inv0-${b}-${simple}`,'Use an inverse logarithm/exponential fact.',L(b,e),simple,[String(b),'1',L(b,simple)],'A logarithm and exponential with the same base undo each other.');}
 if(type===1){const e=expHTML(String(b),L(b,simple));return qobj(`inv1-${b}-${simple}`,'Use an inverse logarithm/exponential fact.',`${e} = ?`,simple,[String(b),'1',L(b,simple)],'An exponential and logarithm with the same base undo each other.');}
 if(type===2)return qobj(`inv2-${b}`,'Use a basic logarithm fact.',`${L(b,'1')} = ?`,'0',['1',String(b),'undefined'],'Every valid logarithm base produces 0 when the argument is 1.');
 if(type===3)return qobj(`inv3-${b}`,'Use a basic logarithm fact.',`${L(b,String(b))} = ?`,'1',['0',String(b),'undefined'],'The logarithm of a base to itself is 1.');
 if(type===4){const e=expHTML('e',advanced);return qobj(`inv4-${advanced}`,'Simplify using inverse functions.',`ln(${e}) = ?`,advanced,['e','1',`ln(${advanced})`],'Natural logarithm and the exponential function with base e undo each other.');}
 if(type===5){const e=expHTML('e',`ln(${htmlPart(simple)})`);return qobj(`inv5-${simple}`,'Simplify using inverse functions.',`${e} = ?`,simple,['e','1',`ln(${simple})`],'The exponential function with base e and ln undo each other.');}
 if(type===6){const v=B.pick(['sin(x)','cos(x)','sin(2x)','x^2','x^2 + 3']);const e=expHTML('e',v);return qobj(`inv6-${v}`,'Simplify using inverse functions.',`ln(${e}) = ?`,v,['e',`ln(${v})`,e],'The outer natural logarithm cancels the exponential with base e, even when the exponent is itself a function.');}
 if(type===7){const v=B.pick(['x^2','x^2 + 1','3x − 2','sin(x)','cos(2x)']);const e=expHTML(String(b),v);return qobj(`inv7-${b}-${v}`,'Simplify using inverse functions.',`${L(b,e)} = ?`,v,[String(b),L(b,v),e],'The logarithm and exponential have the same base, so the composition simplifies to the entire exponent.');}
 if(type===8){const v=B.pick(['x + 2','x^2 + 1','√(x + 3)','2 + sin(x)']);const e=expHTML(String(b),L(b,v));return qobj(`inv8-${b}-${v}`,'Simplify using inverse functions.',`${e} = ?`,v,[String(b),L(b,v),`${b}(${htmlPart(v)})`],'The exponential and logarithm have the same base, so the composition simplifies to the logarithm argument.');}
 if(type===9){const v=B.pick(['sin(x)','x^2','x^2 + 4','cos(3x)']);const e=expHTML('e',v);return qobj(`inv9-${v}`,'Simplify using inverse functions.',`ln(${e}) = ?`,v,[e,`ln(${v})`,'1'],'Natural logarithm and the exponential with base e are inverse functions.');}
 if(type===10){const v=B.pick(['sin(x)','x^2','x^2 + sin(x)','cos(x)^2']);const e=expHTML(String(b),v);return qobj(`inv10-${b}-${v}`,'Simplify the composition.',`${L(b,e)} = ?`,v,[`${b}${htmlPart(v)}`,L(b,v),'1'],'The base of the logarithm matches the base of the exponential, so the whole exponent remains.');}
 const v=B.pick(['x^2 + 2','3 + cos(x)','4 + sin(x)','x^2 + 5']),e=expHTML('e',`ln(${htmlPart(v)})`);
 return qobj(`inv11-${v}`,'Simplify the composition.',`${e} = ?`,v,[`ln(${v})`,'e','1'],'The functions e^x and ln(x) are inverses, so the composition returns the logarithm argument.');
}

function make(){let m=mode.value;if(m==='mixed')m=B.pick(['product','quotient','power','expand','condense','changebase','evaluate','inverse']);return ({product,quotient,power:powerRule,expand,condense,changebase,evaluate,inverse})[m]()}
function newQ(){
 locked=false;choicesEl.dataset.locked='0';$('feedback').innerHTML='';$('feedback').className='feedback';next.style.display='none';
 let c,tries=0;do{c=make();tries++;if(tries>180){seen.clear();break}}while(seen.has(c.id));seen.add(c.id);current=c;window.BMAnalytics?.ensurePracticeStarted({practice_mode:(document.getElementById("mode")?.value||document.getElementById("qtype")?.value||document.getElementById("difficulty")?.value||document.getElementById("displayMode")?.value||"default")});window.BMAnalytics?.problemGenerated(current,{practice_mode:(document.getElementById("mode")?.value||document.getElementById("qtype")?.value||document.getElementById("difficulty")?.value||document.getElementById("displayMode")?.value||"default")});
 prompt.textContent=c.prompt;B.renderMath(question,c.question);
 getChoice=B.choiceButtons(choicesEl,c.choices.map(x=>({value:x,html:B.displayMathHTML(x)})));
}
function check(){if(locked)return;const v=getChoice();if(v==null)return;const ok=v===current.answer;window.BMAnalytics?.answerChecked(current,ok);attempted++;if(ok)correct++;B.updateStats(correct,attempted);locked=true;choicesEl.dataset.locked='1';if(ok){B.showFeedback(true);setTimeout(newQ,600)}else{window.BMAnalytics?.solutionRevealed(current,{reveal_reason:"incorrect_answer"});B.showFeedback(false,current.answer,current.method);next.style.display='inline-block'}}
submit.addEventListener('click',check);next.addEventListener('click',newQ);mode.addEventListener('change',()=>{seen.clear();newQ()});newQ();
})();
