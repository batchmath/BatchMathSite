(function(){
'use strict';
const B=BMPrep,$=B.$,mode=$('mode'),prompt=$('prompt'),question=$('question'),choicesEl=$('choices'),freeArea=$('freeArea'),freeAnswer=$('freeAnswer'),submit=$('submit'),next=$('next');
let correct=0,attempted=0,current=null,locked=false,getChoice=()=>null;
function fracHTML(n,d,extra=''){const fmt=v=>String(v).includes('<')?String(v):B.inlineMathHTML(v);return `<span class="math-frac ${extra}"><span class="num">${fmt(n)}</span><span class="bar"></span><span class="den">${fmt(d)}</span></span>`}
function choiceObj(id,p,qHTML,a,cs,m){const vals=[a,...cs].filter((v,i,x)=>x.indexOf(v)===i);for(const v of ['0','1','x','x + 1','x − 1','None']){if(vals.length>=4)break;if(!vals.includes(v))vals.push(v)}return {id,kind:'choice',prompt:p,questionHTML:qHTML,answer:a,choices:vals.slice(0,4),method:m}}
function freeObj(id,p,qHTML,a,m){return {id,kind:'free',prompt:p,questionHTML:qHTML,answer:a,method:m}}
function rationalize(){
 if(BatchMathRNG.random()<.55){
  const cases=[
   {n:'1',d:'2 + √3',a:'2 − √3',bad:['2 + √3','(2 − √3)/7','√3 − 2']},
   {n:'1',d:'2 − √3',a:'2 + √3',bad:['2 − √3','(2 + √3)/7','√3 + 2']},
   {n:'1',d:'3 + √5',a:'(3 − √5)/4',bad:['(3 + √5)/4','3 − √5','(√5 − 3)/4']},
   {n:'1',d:'3 − √5',a:'(3 + √5)/4',bad:['(3 − √5)/4','3 + √5','(√5 + 3)/4']},
   {n:'2',d:'3 + √5',a:'(3 − √5)/2',bad:['(3 + √5)/2','3 − √5','2(3 − √5)']},
   {n:'2',d:'3 − √5',a:'(3 + √5)/2',bad:['(3 − √5)/2','3 + √5','2(3 + √5)']}
  ];
  const c=B.pick(cases);return choiceObj(`rat-num-${c.n}-${c.d}`,'Rationalize the denominator.',fracHTML(c.n,c.d,'display-frac'),c.a,c.bad,`Multiply numerator and denominator by the conjugate of ${c.d}. The denominator becomes a difference of squares, then simplify.`)
 }
 const a=B.pick([1,2,3]),b=B.pick([1,2,3,4]),minus=BatchMathRNG.random()<.5;
 const den=minus?`√x − ${b}`:`√x + ${b}`,conj=minus?`√x + ${b}`:`√x − ${b}`,denFinal=`x − ${b*b}`;
 const numerator=a===1?conj:`${a}(${conj})`,answer=fracHTML(numerator,denFinal);
 const textAnswer=a===1?`(${conj})/(${denFinal})`:`${a}(${conj})/(${denFinal})`;
 const bad=[minus?`(${a===1?'':a+'('}√x − ${b}${a===1?'':')'})/(${denFinal})`:`(${a===1?'':a+'('}√x + ${b}${a===1?'':')'})/(${denFinal})`,`${a}/${conj}`,`${numerator}/(x + ${b*b})`];
 return choiceObj(`rat-var-${a}-${b}-${minus}`,'Rationalize the denominator.',fracHTML(String(a),den,'display-frac'),textAnswer,bad,`Multiply by the conjugate ${conj}. The denominator becomes ${denFinal}.`)
}
function complex(){
 const a=B.pick([1,2,3,4]),b=B.pick([1,2,3,4]);
 const small1=fracHTML(String(a),'x','nested-frac'),small2=fracHTML(String(b),'x','nested-frac');
 const q=fracHTML(`1 + ${small1}`,small2,'display-frac complex-frac');
 const ans=b===1?`x + ${a}`:`(x + ${a})/${b}`;
 return choiceObj(`cx-${a}-${b}`,'Simplify the complex fraction.',q,ans,[`(x + ${a*b})/${b}`,`${b}(x + ${a})`,`(1 + ${a}x)/${b}`],'Multiply the entire numerator and denominator by x to clear the smaller fractions, then simplify.')
}
function rational(){
 const a=B.pick([1,2,3,4,5]),b=B.pick([1,2,3,4,5].filter(x=>x!==a)),t=B.randInt(0,2);
 if(t===0)return freeObj(`rs-${a}`,'Simplify the rational expression.',fracHTML(`x² − ${a*a}`,`x − ${a}`,'display-frac'),`x + ${a}`,'Factor the numerator as a difference of squares and cancel the common factor.');
 if(t===1)return freeObj(`rs2-${a}-${b}`,'Simplify the rational expression.',fracHTML(`x² + ${a+b}x + ${a*b}`,`x + ${a}`,'display-frac'),`x + ${b}`,'Factor the quadratic numerator as (x+a)(x+b), then cancel the common factor.');
 const sum=a+b,prod=a*b;return freeObj(`rs3-${a}-${b}`,'Simplify the rational expression.',fracHTML(`x² − ${sum}x + ${prod}`,`x − ${a}`,'display-frac'),`x − ${b}`,'Factor the numerator as (x−a)(x−b), then cancel the common factor.')
}
function make(){let m=mode.value;if(m==='mixed')m=B.pick(['rationalize','complex','rational']);return ({rationalize,complex,rational})[m]()}
function newQ(){locked=false;choicesEl.dataset.locked='0';$('feedback').innerHTML='';$('feedback').className='feedback';next.style.display='none';freeAnswer.value='';current=make();window.BMAnalytics?.ensurePracticeStarted({practice_mode:(document.getElementById("mode")?.value||document.getElementById("qtype")?.value||document.getElementById("difficulty")?.value||document.getElementById("displayMode")?.value||"default")});window.BMAnalytics?.problemGenerated(current,{practice_mode:(document.getElementById("mode")?.value||document.getElementById("qtype")?.value||document.getElementById("difficulty")?.value||document.getElementById("displayMode")?.value||"default")});prompt.textContent=current.prompt;B.renderHTML(question,current.questionHTML);if(current.kind==='choice'){choicesEl.style.display='grid';freeArea.style.display='none';getChoice=B.choiceButtons(choicesEl,current.choices.map(x=>({value:x,text:x})))}else{choicesEl.style.display='none';freeArea.style.display='block';getChoice=()=>null;setTimeout(()=>freeAnswer.focus(),0)}}
function check(){if(locked)return;let ok=false;if(current.kind==='choice'){const v=getChoice();if(v==null)return;ok=v===current.answer}else{const raw=freeAnswer.value.trim();if(!raw)return;ok=!raw.includes('/')&&B.exprEquivalent(raw,current.answer)}window.BMAnalytics?.answerChecked(current,ok);attempted++;if(ok)correct++;B.updateStats(correct,attempted);locked=true;choicesEl.dataset.locked='1';freeAnswer.disabled=true;if(ok){B.showFeedback(true);setTimeout(()=>{freeAnswer.disabled=false;newQ()},600)}else{window.BMAnalytics?.solutionRevealed(current,{reveal_reason:"incorrect_answer"});B.showFeedback(false,current.answer,current.method);next.style.display='inline-block'}}
submit.addEventListener('click',check);next.addEventListener('click',()=>{freeAnswer.disabled=false;newQ()});mode.addEventListener('change',()=>{freeAnswer.disabled=false;newQ()});freeAnswer.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();check()}});newQ();
})();
