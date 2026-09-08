(function(){
'use strict';
const B=BMPrep,$=B.$,mode=$('mode'),prompt=$('prompt'),question=$('question'),choicesEl=$('choices'),submit=$('submit'),next=$('next');
let correct=0,attempted=0,current=null,locked=false,getChoice=()=>null,seen=new Set();
const all='(−∞, ∞)';
function xm(a){return a===0?'x':a>0?`x − ${a}`:`x + ${-a}`}
function aMinusX(a){return a===0?'−x':`${a} − x`}
function unionEx(a){return `(−∞, ${a}) ∪ (${a}, ∞)`}
function unionTwo(a,b){[a,b]=[Math.min(a,b),Math.max(a,b)];return `(−∞, ${a}) ∪ (${a}, ${b}) ∪ (${b}, ∞)`}
function obj(id,q,a,cs,method){return {id,prompt:'Find the domain.',question:`f(x) = ${q}`,answer:a,choices:[a,...cs].filter((v,i,x)=>x.indexOf(v)===i).slice(0,4),method}}
function rational(){
 const a=B.randInt(-5,5),two=BatchMathRNG.random()<.55;
 if(!two){const n=B.randInt(1,6);return obj(`r1-${a}-${n}`,`(x + ${n}) / (${xm(a)})`,unionEx(a),[all,`(${a}, ∞)`,`(−∞, ${a})`],`The denominator cannot be 0, so x ≠ ${a}.`)}
 let b;do{b=B.randInt(-5,5)}while(b===a);const ans=unionTwo(a,b),lo=Math.min(a,b),hi=Math.max(a,b);
 return obj(`r2-${a}-${b}`,`(x^2 + 1) / ((${xm(a)})(${xm(b)}))`,ans,[`(−∞, ${lo}) ∪ (${hi}, ∞)`,`(${lo}, ${hi})`,all],'Exclude every value that makes the denominator 0.')
}
function radical(){
 const a=B.randInt(-5,5),t=B.randInt(0,2);
 if(t===0)return obj(`rad1-${a}`,`√(${xm(a)})`,`[${a}, ∞)`,[`(${a}, ∞)`,`(−∞, ${a}]`,all],'An even root requires the radicand to be at least 0.');
 if(t===1)return obj(`rad2-${a}`,`√(${aMinusX(a)})`,`(−∞, ${a}]`,[`(−∞, ${a})`,`[${a}, ∞)`,all],'Require the radicand to be at least 0.');
 const b=a+B.randInt(2,6);return obj(`rad3-${a}-${b}`,`√((${xm(a)})(${aMinusX(b)}))`,`[${a}, ${b}]`,[`(${a}, ${b})`,`(−∞, ${a}] ∪ [${b}, ∞)`,all],'The product under the square root is nonnegative between the two zeros, inclusive.')
}
function logarithmic(){
 const a=B.randInt(-5,5),t=BatchMathRNG.random()<.5;
 if(t)return obj(`log1-${a}`,`ln(${xm(a)})`,`(${a}, ∞)`,[`[${a}, ∞)`,`(−∞, ${a})`,all],'A logarithm requires its argument to be strictly positive.');
 return obj(`log2-${a}`,`log(${aMinusX(a)})`,`(−∞, ${a})`,[`(−∞, ${a}]`,`(${a}, ∞)`,all],'The logarithm argument must be strictly positive.')
}
function trig(){
 const f=B.pick(['sin','cos','tan','sec','csc','cot']);
 if(f==='sin'||f==='cos'){
  const arg=B.pick(['x','2x','3x','4x','2x + π/3','3x − π/4','x + π/6','x − π/3']);
  return obj(`tr-${f}-${arg}`,`${f}(${arg})`,all,['x ≠ kπ, k ∈ ℤ','x ≠ π/2 + kπ, k ∈ ℤ','[−1, 1]'],`${f} is defined for every real value of its argument, so the domain is all real numbers.`)
 }
 const scale=B.pick([1,2,3,4]),arg=scale===1?'x':`${scale}x`;
 if(f==='tan'||f==='sec'){
  const ans=scale===1?'x ≠ π/2 + kπ, k ∈ ℤ':scale===2?'x ≠ π/4 + kπ/2, k ∈ ℤ':scale===3?'x ≠ π/6 + kπ/3, k ∈ ℤ':'x ≠ π/8 + kπ/4, k ∈ ℤ';
  return obj(`tr-${f}-${scale}`,`${f}(${arg})`,ans,['x ≠ kπ, k ∈ ℤ',all,'x ≠ 2kπ, k ∈ ℤ'],'Set the cosine of the argument equal to 0 and solve for x; those values must be excluded.')
 }
 const ans=scale===1?'x ≠ kπ, k ∈ ℤ':scale===2?'x ≠ kπ/2, k ∈ ℤ':scale===3?'x ≠ kπ/3, k ∈ ℤ':'x ≠ kπ/4, k ∈ ℤ';
 return obj(`tr-${f}-${scale}`,`${f}(${arg})`,ans,['x ≠ π/2 + kπ, k ∈ ℤ',all,'x ≠ 2kπ, k ∈ ℤ'],'Set the sine of the argument equal to 0 and solve for x; those values must be excluded.')
}
function inverse(){
 const f=B.pick(['arcsin','arccos','arctan']),c=B.pick([1,2,3,4]);
 if(f==='arctan'){
  const arg=c===1?'x':`${c}x`;
  return obj(`inv-${f}-${c}`,`${f}(${arg})`,all,['[−1, 1]','(−π/2, π/2)','x ≠ 0'],'arctan accepts every real input.')
 }
 if(c===1)return obj(`inv-${f}-1`,`${f}(x)`,'[−1, 1]',['(−1, 1)',all,'[0, π]'],`${f} requires its input to lie between −1 and 1.`);
 return obj(`inv-${f}-${c}`,`${f}(x/${c})`,`[−${c}, ${c}]`,[`(−${c}, ${c})`,`[−1, 1]`,all],`Require −1 ≤ x/${c} ≤ 1, which gives −${c} ≤ x ≤ ${c}.`)
}
// Combined / Composite deliberately mixes several restrictions so students must think about
// denominators, logarithms, roots, trigonometric domains, and composition rather than apply one rule.
function fracExpr(n,d,extra='display-frac'){return B.fracHTMLText(n,d,extra)}
function rootExpr(inner,index=''){return `<span class="math-root">${index?`<span class="root-index">${index}</span>`:''}<span class="root-symbol">√</span><span class="root-body">${inner}</span></span>`}
function signedTerm(base,c){return c>0?`${base} + ${c}`:`${base} − ${-c}`}
function nonzeroShift(){let a;do{a=B.randInt(-4,4)}while(a===0);return a}
function numerator(){
 const t=B.randInt(0,5),c=B.randInt(1,5),d=B.randInt(1,5);
 if(t===0)return String(c);
 if(t===1)return xm(B.pick([-4,-3,-2,-1,1,2,3,4]));
 if(t===2)return `x^2 + ${c}`;
 if(t===3)return `${B.pick([2,3,4])}x ${BatchMathRNG.random()<.5?'−':'+'} ${d}`;
 if(t===4)return `(${xm(B.pick([-3,-2,-1,1,2,3]))})^2`;
 return `${B.pick([2,3,5])}x^2 + ${c}`;
}
function expBoundary(a,c){
 const e=c>0?`e^{−${c}}`:`e^{${-c}}`;
 if(a===0)return e;
 return a>0?`${a} + ${e}`:`${e} − ${-a}`;
}
function sinPositive(k,closed=false){
 if(k===1)return `${closed?'[':'('}2nπ, (2n + 1)π${closed?']':')'}, n ∈ ℤ`;
 if(k===2)return `${closed?'[':'('}nπ, nπ + π/2${closed?']':')'}, n ∈ ℤ`;
 return `${closed?'[':'('}2nπ/3, (2n + 1)π/3${closed?']':')'}, n ∈ ℤ`;
}
function cosPositive(k,closed=false){
 if(k===1)return `${closed?'[':'('}−π/2 + 2nπ, π/2 + 2nπ${closed?']':')'}, n ∈ ℤ`;
 if(k===2)return `${closed?'[':'('}−π/4 + nπ, π/4 + nπ${closed?']':')'}, n ∈ ℤ`;
 return `${closed?'[':'('}−π/6 + 2nπ/3, π/6 + 2nπ/3${closed?']':')'}, n ∈ ℤ`;
}
function tanPositive(k){
 if(k===1)return `(nπ, π/2 + nπ), n ∈ ℤ`;
 if(k===2)return `(nπ/2, π/4 + nπ/2), n ∈ ℤ`;
 return `(nπ/3, π/6 + nπ/3), n ∈ ℤ`;
}
function absSinHalf(k){
 if(k===1)return `[nπ − π/6, nπ + π/6], n ∈ ℤ`;
 if(k===2)return `[nπ/2 − π/12, nπ/2 + π/12], n ∈ ℤ`;
 return `[nπ/3 − π/18, nπ/3 + π/18], n ∈ ℤ`;
}
function absCosHalf(k){
 if(k===1)return `[π/3 + nπ, 2π/3 + nπ], n ∈ ℤ`;
 if(k===2)return `[π/6 + nπ/2, π/3 + nπ/2], n ∈ ℤ`;
 return `[π/9 + nπ/3, 2π/9 + nπ/3], n ∈ ℤ`;
}
function oddPiExclusion(k){
 if(k===1)return `x ≠ (2n + 1)π, n ∈ ℤ`;
 if(k===2)return `x ≠ (2n + 1)π/2, n ∈ ℤ`;
 return `x ≠ (2n + 1)π/3, n ∈ ℤ`;
}
function sinNegOneExclusion(k){
 if(k===1)return `x ≠ 3π/2 + 2nπ, n ∈ ℤ`;
 if(k===2)return `x ≠ 3π/4 + nπ, n ∈ ℤ`;
 return `x ≠ π/2 + 2nπ/3, n ∈ ℤ`;
}
function tanDenomExclusions(k){
 if(k===1)return `x ≠ π/2 + nπ and x ≠ −π/4 + nπ, n ∈ ℤ`;
 if(k===2)return `x ≠ π/4 + nπ/2 and x ≠ −π/8 + nπ/2, n ∈ ℤ`;
 return `x ≠ π/6 + nπ/3 and x ≠ −π/12 + nπ/3, n ∈ ℤ`;
}
function trigArg(k){return k===1?'x':`${k}x`}
function combined(){
 const t=B.randInt(0,15);
 if(t===0){
  const a=B.randInt(-4,4);
  return obj(`c0-${a}`,`1 / √(${xm(a)})`,`(${a}, ∞)`,[`[${a}, ∞)`,`(−∞, ${a})`,unionEx(a)],'The square-root radicand must be positive, not merely nonnegative, because the square root is also in the denominator.');
 }
 if(t===1){
  const a=B.randInt(-4,4);
  return obj(`c1-${a}`,`ln(√(${xm(a)}))`,`(${a}, ∞)`,[`[${a}, ∞)`,`(−∞, ${a})`,all],'The square root must be strictly positive because it is the argument of a logarithm.');
 }
 if(t===2){
  const a=B.randInt(-4,4);
  return obj(`c2-${a}`,`√(ln(${xm(a)}))`,`[${a+1}, ∞)`,[`(${a}, ∞)`,`(${a+1}, ∞)`,`[${a}, ∞)`],'Require the logarithm to be at least 0. That makes its argument at least 1.');
 }
 if(t===3){
  const a=B.randInt(-4,2),b=a+B.randInt(2,6);
  return obj(`c3-${a}-${b}`,`1 / √((${xm(a)})(${aMinusX(b)}))`,`(${a}, ${b})`,[`[${a}, ${b}]`,`(−∞, ${a}) ∪ (${b}, ∞)`,all],'The product under the square root must be strictly positive because the root is in the denominator.');
 }
 if(t===4){
  const a=B.randInt(-3,3),c=B.pick([-3,-2,-1,1,2,3]),num=numerator(),bound=expBoundary(a,c);
  const den=signedTerm(`ln(${xm(a)})`,c),html=`${fracExpr(num,den)}`;
  return obj(`c4-${a}-${c}-${num}`,html,`(${a}, ${bound}) ∪ (${bound}, ∞)`,[`(${a}, ∞)`,`[${a}, ∞)`,`(−∞, ${bound}) ∪ (${bound}, ∞)`],`The logarithm requires ${xm(a)} > 0, and the denominator cannot be 0. Solving ${den} = 0 excludes x = ${bound}.`);
 }
 if(t===5){
  let a=B.randInt(-5,5),b;do{b=B.randInt(-5,5)}while(b===a);const lo=Math.min(a,b),hi=Math.max(a,b);
  const inner=fracExpr(xm(a),xm(b),'nested-frac'),html=`ln(${inner})`;
  return obj(`c5-${a}-${b}`,html,`(−∞, ${lo}) ∪ (${hi}, ∞)`,[`(${lo}, ${hi})`,`(−∞, ${lo}] ∪ [${hi}, ∞)`,unionEx(b)],'A logarithm needs a positive argument. The rational expression is positive when its numerator and denominator have the same sign; its zero and undefined value are not included.');
 }
 if(t===6){
  let a=B.randInt(-5,5),b;do{b=B.randInt(-5,5)}while(b===a);const inner=fracExpr(xm(a),xm(b),'nested-frac'),html=rootExpr(inner);
  let ans,wrong1;
  if(a<b){ans=`(−∞, ${a}] ∪ (${b}, ∞)`;wrong1=`(−∞, ${a}) ∪ [${b}, ∞)`}
  else{ans=`(−∞, ${b}) ∪ [${a}, ∞)`;wrong1=`(−∞, ${b}] ∪ (${a}, ∞)`}
  return obj(`c6-${a}-${b}`,html,ans,[wrong1,`(${Math.min(a,b)}, ${Math.max(a,b)})`,all],'The rational expression under an even root must be nonnegative. A numerator zero may be included, but a denominator zero must always be excluded.');
 }
 if(t===7){
  const k=B.pick([1,2,3]),kind=B.pick(['ln','lnroot','reciproot']),arg=trigArg(k),ans=sinPositive(k,false);let q,method;
  if(kind==='ln'){q=`ln(sin(${arg}))`;method='The logarithm requires sin of the argument to be strictly positive.'}
  else if(kind==='lnroot'){q=`ln(√(sin(${arg})))`;method='The square root must be positive, not 0, because it is inside a logarithm. Therefore sin of the argument must be positive.'}
  else{q=`1 / √(sin(${arg}))`;method='Because the square root is in the denominator, sin of the argument must be strictly positive.'}
  return obj(`c7-${k}-${kind}`,q,ans,[sinPositive(k,true),cosPositive(k,false),all],method);
 }
 if(t===8){
  const k=B.pick([1,2,3]),kind=B.pick(['ln','lnroot','reciproot']),arg=trigArg(k),ans=cosPositive(k,false);let q,method;
  if(kind==='ln'){q=`ln(cos(${arg}))`;method='The logarithm requires cos of the argument to be strictly positive.'}
  else if(kind==='lnroot'){q=`ln(√(cos(${arg})))`;method='The square root must be positive, not 0, because it is inside a logarithm. Therefore cos of the argument must be positive.'}
  else{q=`1 / √(cos(${arg}))`;method='Because the square root is in the denominator, cos of the argument must be strictly positive.'}
  return obj(`c8-${k}-${kind}`,q,ans,[cosPositive(k,true),sinPositive(k,false),all],method);
 }
 if(t===9){
  const k=B.pick([1,2,3]),arg=trigArg(k);
  return obj(`c9-${k}`,`ln(tan(${arg}))`,tanPositive(k),[all,`x ≠ π/2 + nπ, n ∈ ℤ`,sinPositive(k,false)],'tan of the argument must be defined and strictly positive because it is inside a logarithm.');
 }
 if(t===10){
  const k=B.pick([1,2,3]),useSin=BatchMathRNG.random()<.5,arg=trigArg(k),q=useSin?`arcsin(2sin(${arg}))`:`arccos(2cos(${arg}))`,ans=useSin?absSinHalf(k):absCosHalf(k);
  return obj(`c10-${k}-${useSin?'s':'c'}`,q,ans,[all,useSin?sinPositive(k,true):cosPositive(k,true),useSin?absCosHalf(k):absSinHalf(k)],'The input of arcsin or arccos must stay between −1 and 1. This requires the inner sine or cosine value to have absolute value at most 1/2.');
 }
 if(t===11){
  const k=B.pick([1,2,3]),useSin=BatchMathRNG.random()<.5,arg=trigArg(k),kind=BatchMathRNG.random()<.5?'sqrtlog':'recipsqrtlog',ans=useSin?sinPositive(k,kind==='sqrtlog'):cosPositive(k,kind==='sqrtlog');
  const inside=useSin?`1 + sin(${arg})`:`1 + cos(${arg})`,q=kind==='sqrtlog'?`√(ln(${inside}))`:`1 / √(ln(${inside}))`;
  const method=kind==='sqrtlog'?'The logarithm must be at least 0, so its argument must be at least 1. That requires the trig value to be nonnegative.':'The logarithm is under a square root in the denominator, so it must be strictly positive. That requires the trig value to be positive.';
  return obj(`c11-${k}-${useSin?'s':'c'}-${kind}`,q,ans,[useSin?sinPositive(k,! (kind==='sqrtlog')):cosPositive(k,! (kind==='sqrtlog')),all,useSin?cosPositive(k,false):sinPositive(k,false)],method);
 }
 if(t===12){
  const k=B.pick([1,2,3]),useSin=BatchMathRNG.random()<.5,arg=trigArg(k),q=useSin?`ln(1 + sin(${arg}))`:`ln(1 + cos(${arg}))`,ans=useSin?sinNegOneExclusion(k):oddPiExclusion(k);
  return obj(`c12-${k}-${useSin?'s':'c'}`,q,ans,[all,useSin?sinPositive(k,false):cosPositive(k,false),useSin?oddPiExclusion(k):sinNegOneExclusion(k)],'The logarithm argument must be positive. Since 1 plus the sine or cosine is never negative, exclude only the angles where it equals 0.');
 }
 if(t===13){
  const k=B.pick([1,2,3]),arg=trigArg(k),num=numerator(),html=fracExpr(num,`1 + tan(${arg})`),ans=tanDenomExclusions(k);
  return obj(`c13-${k}-${num}`,html,ans,[all,`x ≠ π/2 + nπ, n ∈ ℤ`,tanPositive(k)],'The tangent must first be defined, and the entire denominator must also be nonzero. Exclude both sets of values.');
 }
 if(t===14){
  const k=B.pick([1,2,3]),useSec=BatchMathRNG.random()<.5,arg=trigArg(k),q=useSec?`ln(sec(${arg}))`:`ln(csc(${arg}))`,ans=useSec?cosPositive(k,false):sinPositive(k,false);
  return obj(`c14-${k}-${useSec?'sec':'csc'}`,q,ans,[all,useSec?sinPositive(k,false):cosPositive(k,false),useSec?cosPositive(k,true):sinPositive(k,true)],`The logarithm requires the ${useSec?'secant':'cosecant'} value to be positive. That is equivalent to requiring ${useSec?'cosine':'sine'} to be positive.`);
 }
 const c=B.pick([2,3,4]),kind=B.pick(['sqrtasin','lnacos','sqrtatan']);
 if(kind==='sqrtasin')return obj(`c15-asin-${c}`,`√(arcsin(x/${c}))`,`[0, ${c}]`,[`[−${c}, ${c}]`,`(0, ${c}]`,`[0, ∞)`],'arcsin requires its input to be between −1 and 1, and the outer square root requires the arcsin output to be nonnegative. Together these give 0 ≤ x ≤ the scale factor.');
 if(kind==='lnacos')return obj(`c15-acos-${c}`,`ln(arccos(x/${c}))`,`[−${c}, ${c})`,[`[−${c}, ${c}]`,`(−${c}, ${c})`,`(−∞, ${c})`],'arccos requires its input to be between −1 and 1. The outer logarithm also requires arccos to be positive, so exclude the endpoint where arccos equals 0.');
 const a=B.pick([-3,-2,-1,1,2,3]);return obj(`c15-atan-${a}`,`√(arctan(${xm(a)}))`,`[${a}, ∞)`,[`(${a}, ∞)`,`(−∞, ${a}]`,all],'arctan is defined for every real input, but the outer square root requires arctan(x−a) to be nonnegative, which occurs when x−a ≥ 0.');
}
function make(){let m=mode.value;if(m==='mixed')m=B.pick(['rational','radical','log','trig','inverse','combined']);return ({rational,radical,log:logarithmic,trig,inverse,combined})[m]()}
function newQ(){locked=false;choicesEl.dataset.locked='0';$('feedback').innerHTML='';$('feedback').className='feedback';next.style.display='none';let c,tries=0;do{c=make();tries++;if(tries>100){seen.clear();break}}while(seen.has(c.id));seen.add(c.id);current=c;window.BMAnalytics?.ensurePracticeStarted({practice_mode:(document.getElementById("mode")?.value||document.getElementById("qtype")?.value||document.getElementById("difficulty")?.value||document.getElementById("displayMode")?.value||"default")});window.BMAnalytics?.problemGenerated(current,{practice_mode:(document.getElementById("mode")?.value||document.getElementById("qtype")?.value||document.getElementById("difficulty")?.value||document.getElementById("displayMode")?.value||"default")});prompt.textContent=c.prompt;B.renderMath(question,c.question);getChoice=B.choiceButtons(choicesEl,c.choices.map(x=>({value:x,text:x})))}
function check(){if(locked)return;const v=getChoice();if(v==null)return;const ok=v===current.answer;window.BMAnalytics?.answerChecked(current,ok);attempted++;if(ok)correct++;B.updateStats(correct,attempted);locked=true;choicesEl.dataset.locked='1';if(ok){B.showFeedback(true);setTimeout(newQ,600)}else{window.BMAnalytics?.solutionRevealed(current,{reveal_reason:"incorrect_answer"});B.showFeedback(false,current.answer,current.method);next.style.display='inline-block'}}
submit.addEventListener('click',check);next.addEventListener('click',newQ);mode.addEventListener('change',()=>{seen.clear();newQ()});newQ();
})();
