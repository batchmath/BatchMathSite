(function(){
'use strict';
const B=BMPrep,$=B.$,setSel=$('set'),qtype=$('qtype'),prompt=$('prompt'),question=$('question'),choicesEl=$('choices'),submit=$('submit'),next=$('next');
let correct=0,attempted=0,current=null,locked=false,getChoice=()=>null,seen=new Set();
const F=[
 // Calculus 1 required: reciprocal and quotient
 ['calc1','sin x','1 / csc x'],['calc1','cos x','1 / sec x'],['calc1','tan x','1 / cot x'],['calc1','csc x','1 / sin x'],['calc1','sec x','1 / cos x'],['calc1','cot x','1 / tan x'],
 ['calc1','tan x','sin x / cos x'],['calc1','cot x','cos x / sin x'],
 // Pythagorean
 ['calc1','sin²x + cos²x','1'],['calc1','1 + tan²x','sec²x'],['calc1','1 + cot²x','csc²x'],
 // Double angle / power reducing
 ['calc1','sin(2x)','2 sin x cos x'],['calc1','cos(2x)','cos²x − sin²x'],['calc1','cos(2x)','1 − 2sin²x'],['calc1','cos(2x)','2cos²x − 1'],
 ['calc1','sin²x','(1 − cos(2x)) / 2'],['calc1','cos²x','(1 + cos(2x)) / 2'],
 // even odd
 ['calc1','sin(−x)','−sin x'],['calc1','cos(−x)','cos x'],['calc1','tan(−x)','−tan x'],['calc1','csc(−x)','−csc x'],['calc1','sec(−x)','sec x'],['calc1','cot(−x)','−cot x'],
 // General calculus additions from broader sheet
 ['general','tan(2x)','2tan x / (1 − tan²x)'],
 ['general','sin(a + b)','sin a cos b + cos a sin b'],['general','sin(a − b)','sin a cos b − cos a sin b'],
 ['general','cos(a + b)','cos a cos b − sin a sin b'],['general','cos(a − b)','cos a cos b + sin a sin b'],
 ['general','tan(a + b)','(tan a + tan b) / (1 − tan a tan b)'],['general','tan(a − b)','(tan a − tan b) / (1 + tan a tan b)'],
 ['general','sin²(x/2)','(1 − cos x) / 2'],['general','cos²(x/2)','(1 + cos x) / 2'],
 ['general','sin a sin b','(cos(a−b) − cos(a+b)) / 2'],['general','cos a cos b','(cos(a−b) + cos(a+b)) / 2'],
 ['general','sin a cos b','(sin(a+b) + sin(a−b)) / 2'],['general','cos a sin b','(sin(a+b) − sin(a−b)) / 2'],
 ['general','sin a + sin b','2 sin((a+b)/2) cos((a−b)/2)'],['general','sin a − sin b','2 cos((a+b)/2) sin((a−b)/2)'],
 ['general','cos a + cos b','2 cos((a+b)/2) cos((a−b)/2)'],['general','cos a − cos b','−2 sin((a+b)/2) sin((a−b)/2)'],
 ['general','sin(π/2 − x)','cos x'],['general','cos(π/2 − x)','sin x'],['general','tan(π/2 − x)','cot x'],
 ['general','sin(x + 2π)','sin x'],['general','cos(x + 2π)','cos x'],['general','tan(x + π)','tan x']
].map((x,i)=>({id:'f'+i,set:x[0],lhs:x[1],rhs:x[2]}));
const R=[
 ['calc1','1 − cos²x','sin²x'],['calc1','sec²x − 1','tan²x'],['calc1','csc²x − 1','cot²x'],
 ['calc1','2sin x cos x','sin(2x)'],['calc1','1 − 2sin²x','cos(2x)'],['calc1','2cos²x − 1','cos(2x)'],
 ['calc1','(1 − cos(2x))/2','sin²x'],['calc1','(1 + cos(2x))/2','cos²x'],
 ['calc1','sin x / tan x','cos x'],['calc1','cos x / cot x','sin x'],['calc1','tan x cos x','sin x'],['calc1','cot x sin x','cos x'],
 ['general','sin(a+b)+sin(a−b)','2 sin a cos b'],['general','cos(a−b)+cos(a+b)','2 cos a cos b'],
 ['general','cos(a−b)−cos(a+b)','2 sin a sin b'],['general','sin(x+2π)','sin x'],['general','tan(x+π)','tan x'],
 ['general','2sin²(x/2)','1 − cos x'],['general','2cos²(x/2)','1 + cos x']
].map((x,i)=>({id:'r'+i,set:x[0],expr:x[1],ans:x[2]}));
function poolFor(arr){return arr.filter(x=>setSel.value==='general'||x.set==='calc1')}
function distract(answer,pool,exclude=[]){const blocked=new Set([answer,...exclude]);let vals=[...new Set(pool.map(x=>x.rhs||x.ans).filter(x=>!blocked.has(x)))];vals=B.shuffle(vals).slice(0,3);for(const v of ['1','sin x','cos x','tan x','sec²x','csc²x']){if(vals.length>=3)break;if(!blocked.has(v)&&!vals.includes(v))vals.push(v)}return vals.slice(0,3)}
function make(){let typ=qtype.value;if(typ==='mixed')typ=Math.random()<.55?'recall':'rewrite';if(typ==='recall'){const p=poolFor(F),f=B.pick(p),valid=[...new Set(p.filter(x=>x.lhs===f.lhs).map(x=>x.rhs))],ds=distract(f.rhs,p,valid);return {id:'rec-'+f.id,prompt:'Complete the identity.',question:`${f.lhs} = ?`,answer:f.rhs,validAnswers:valid,choices:[f.rhs,...ds],method:`Identity: ${f.lhs} = ${f.rhs}.`}}const p=poolFor(R),r=B.pick(p),ds=distract(r.ans,p);return {id:'rew-'+r.id,prompt:'Choose an equivalent form.',question:r.expr,answer:r.ans,validAnswers:[r.ans],choices:[r.ans,...ds],method:`Using the relevant trigonometric identity, ${r.expr} rewrites as ${r.ans}.`}}
function newQ(){locked=false;choicesEl.dataset.locked='0';$('feedback').innerHTML='';$('feedback').className='feedback';next.style.display='none';let c,tries=0;do{c=make();tries++;if(tries>100){seen.clear();break}}while(seen.has(c.id));seen.add(c.id);current=c;window.BMAnalytics?.ensurePracticeStarted({practice_mode:(document.getElementById("mode")?.value||document.getElementById("qtype")?.value||document.getElementById("difficulty")?.value||document.getElementById("displayMode")?.value||"default")});window.BMAnalytics?.problemGenerated(current,{practice_mode:(document.getElementById("mode")?.value||document.getElementById("qtype")?.value||document.getElementById("difficulty")?.value||document.getElementById("displayMode")?.value||"default")});prompt.textContent=c.prompt;B.renderMath(question,c.question);getChoice=B.choiceButtons(choicesEl,c.choices.map(x=>({value:x,text:x})))}
function check(){if(locked)return;const v=getChoice();if(v==null)return;const ok=(current.validAnswers||[current.answer]).includes(v);window.BMAnalytics?.answerChecked(current,ok);attempted++;if(ok)correct++;B.updateStats(correct,attempted);locked=true;choicesEl.dataset.locked='1';if(ok){B.showFeedback(true);setTimeout(newQ,600)}else{window.BMAnalytics?.solutionRevealed(current,{reveal_reason:"incorrect_answer"});B.showFeedback(false,current.answer,current.method);next.style.display='inline-block'}}
submit.addEventListener('click',check);next.addEventListener('click',newQ);[setSel,qtype].forEach(x=>x.addEventListener('change',()=>{seen.clear();newQ()}));newQ();
})();
