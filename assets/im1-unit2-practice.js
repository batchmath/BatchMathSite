(function(){
'use strict';
const cfg=window.BM_UNIT2_PRACTICE||{};
const gen=window.BatchMathIM1Unit2Generators?.get?.(cfg.slug);
if(typeof gen!=='function'){document.addEventListener('DOMContentLoaded',()=>{const q=document.getElementById('question');if(q)q.textContent='Practice generator unavailable.'});return;}
const $=id=>document.getElementById(id);let p=null,score=0,attempted=0,locked=false,recent=[],recentGraphs=[],entry=null;
function typeset(nodes){if(window.MathJax?.typesetPromise)window.MathJax.typesetPromise(nodes).catch(()=>{});}
function stats(){$('score').textContent=score;$('attempted').textContent=attempted;}
function render(){
 locked=false;entry=null;$('question').innerHTML=p.q;$('choices').innerHTML='';$('feedback').innerHTML='';$('feedback').className='feedback';$('nextBtn').hidden=true;
 if(p.kind==='polynomial'||p.kind==='equation'){
  const module=p.kind==='equation'?window.BatchMathIM1Equation:window.BatchMathIM1Algebra;
  entry=module.mount($('choices'),p,answerExpression);
 }else for(let i=0;i<p.choices.length;i++){
  const b=document.createElement('button');b.type='button';b.className='choice-btn';b.innerHTML=p.choices[i];b.addEventListener('click',()=>answer(i));$('choices').appendChild(b);
 }
 stats();typeset([$('question'),$('choices')]);
}
function newProblem(){
 let tries=0,graphKey='';do{p=gen();tries++;const points=p.graph?.points;graphKey=points?JSON.stringify(points.map(([x,y])=>[x-points[0][0],y-points[0][1]])):'';}while((recent.includes(p.id)||(graphKey&&recentGraphs.includes(graphKey)))&&tries<12);
 if(graphKey){recentGraphs.push(graphKey);if(recentGraphs.length>6)recentGraphs.shift();}
 recent.push(p.id);if(recent.length>6)recent.shift();
 p.problemType=cfg.slug;p.problemVariant=p.variant;p.problemId=p.id;p.generatorVersion=String(window.BM_ANALYTICS_CONFIG?.generatorVersion||'1');
 render();window.BMAnalytics?.problemGenerated(p);
}
function answer(i){
 if(locked)return;locked=true;attempted++;const ok=i===p.correctIndex;
 window.BMAnalytics?.answerChecked(p,ok);
 document.querySelectorAll('.choice-btn').forEach((b,j)=>{b.disabled=true;if(j===p.correctIndex)b.classList.add('right');else if(j===i)b.classList.add('wrong');});
 if(ok){score++;$('feedback').innerHTML='✓ Correct'+(p.part2||p.variant==='creation_solve'?`<br>${p.explain}`:'');$('feedback').className='feedback correct';}
 else{$('feedback').innerHTML=`✗ Incorrect.<br><strong>Correct answer:</strong> ${p.choices[p.correctIndex]}<br>${p.explain||''}`;$('feedback').className='feedback incorrect';window.BMAnalytics?.solutionRevealed(p,{reveal_reason:'incorrect_answer'});}
 if(p.part2){
  const button=document.createElement('button');button.id='continuePartBtn';button.type='button';button.className='algebra-check';button.textContent='Part 2: Solve';
  button.addEventListener('click',()=>{if(!p.part2)return;const parent=p;p=parent.part2;p.problemType=parent.problemType;p.problemVariant=p.variant;p.problemId=p.id;p.generatorVersion=parent.generatorVersion;render();});
  $('feedback').appendChild(button);
 }else $('nextBtn').hidden=false;
 stats();typeset([$('feedback')]);
}
function answerExpression(raw){
 if(locked)return;
 const module=p.kind==='equation'?window.BatchMathIM1Equation:window.BatchMathIM1Algebra;
 const result=module.check(raw,p.answer);
 if(result.error){$('feedback').textContent=result.error;$('feedback').className='feedback incorrect';return;}
 locked=true;attempted++;entry.disable();window.BMAnalytics?.answerChecked(p,result.ok);
 if(result.ok){score++;$('feedback').innerHTML=`✓ Correct.<br>${p.explain}`;$('feedback').className='feedback correct';}
 else{$('feedback').innerHTML=`${result.unsimplified?'Your expression is equivalent, but like terms still need to be combined.':'✗ Incorrect.'}<br><strong>Correct answer:</strong> ${p.answerTex}<br>${p.explain}`;$('feedback').className='feedback incorrect';window.BMAnalytics?.solutionRevealed(p,{reveal_reason:'incorrect_answer'});}
 stats();$('nextBtn').hidden=false;typeset([$('feedback')]);
}
function next(){if(!locked||p.part2)return;newProblem();}
document.addEventListener('DOMContentLoaded',()=>{
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&locked&&!p.kind&&!p.part2){e.preventDefault();next();}});
 $('nextBtn').addEventListener('click',next);$('resetBtn').addEventListener('click',()=>{score=0;attempted=0;recent=[];recentGraphs=[];newProblem();});newProblem();
});
})();
