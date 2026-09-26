(function(){'use strict';
const R=()=>window.BatchMathRNG.random();
const options=[
 ['all','Everything — Full Unit Review'],['tables','Tables'],['graphs','Graphs'],
 ['continuous','Direct Substitution / Continuous Functions'],['factoring','Factoring'],
 ['substitution','Root Substitution'],['rationalizing','Rationalizing'],
 ['complex','Complex Fractions'],['oneSided','One-Sided Limits'],
 ['regularTrig','Regular Trigonometric Limits'],['squeeze','Squeeze Theorem'],
 ['special','Finite-Point Oscillation / sin(1/x)'],['advancedTrig','Advanced Trigonometric Limits'],
 ['infinity','Limits at Infinity'],['discontinuities','Classifying Discontinuities'],
 ['parameters','Continuity Parameters'],['ivt','Intermediate Value Theorem']
];
const labels=Object.fromEntries(options);
const targets={algebra:25,regularTrig:12,advancedTrig:8,squeezeOscillation:8,oneSided:10,infinity:12,graphs:8,tables:2,discontinuities:5,parameters:5,ivt:5};
const algebraWeights={continuous:1,factoring:3,substitution:3,rationalizing:3,complex:3};
const algebraBag=['continuous','factoring','factoring','factoring','substitution','substitution','substitution','rationalizing','rationalizing','rationalizing','complex','complex','complex'];
const pick=a=>a[Math.floor(R()*a.length)];
const fromMC=(p,cat)=>({...p,cat,q:p.q||p.questionHtml,sol:p.sol||p.explanation});
let oneSidedQueue=[],continuationCategory=null,setSerial=0;

function mixedCategory(){
 const r=100*R();
 if(r<25)return pick(algebraBag);
 if(r<37)return'regularTrig';
 if(r<45)return'advancedTrig';
 if(r<53)return R()<.5?'squeeze':'special';
 if(r<63)return'oneSided';
 if(r<75)return'infinity';
 if(r<83)return'graphs';
 if(r<85)return'tables';
 if(r<90)return'discontinuities';
 if(r<95)return'parameters';
 return'ivt';
}
function advanced(){
 const p=window.BMAdvancedTrigAll.generate('mixed'),a=p.ans;
 let ans=a;
 if(a?.kind==='surd'){
  const sign=a.n<0?'-':'',coef=Math.abs(a.n)===1?'':String(Math.abs(a.n));
  const num=`${sign}${coef}\\sqrt{${a.rad}}`,tex=a.d===1?num:`\\frac{${num}}{${a.d}}`;
  ans={kind:'exact',value:a.n*Math.sqrt(a.rad)/a.d,tex};
 }
 const {family,...serializable}=p;
 return {...serializable,ans,cat:'advancedTrig',q:p.q||p.questionHtml,sol:p.sol||p.explanation};
}
function courseTrig(wantSqueeze){
 let p,guard=0;do{p=window.BMUnit1CourseTrig.generate();guard++;}while((/^squeeze_/.test(p.variant))!==wantSqueeze&&guard<250);
 return fromMC(p,wantSqueeze?'squeeze':'regularTrig');
}
function oneSided(){
 if(!oneSidedQueue.length){
  const sequence=R()<.28;
  oneSidedQueue=sequence?window.BMUnit1OneSided.sequence('mixed'):[window.BMUnit1OneSided.generate('mixed')];
  const setId=`one-sided-set-${++setSerial}`;
  oneSidedQueue=oneSidedQueue.map((p,i)=>({...p,reviewSetId:setId,reviewPart:i+1,reviewPartCount:oneSidedQueue.length}));
 }
 const p=oneSidedQueue.shift();
 continuationCategory=oneSidedQueue.length?'oneSided':null;
 return p;
}
function graph(){
 const p=fromMC(window.BMUnit1Representations.graph(),'graphs'),d=p.representationData;
 continuationCategory=d?.multi&&d.part<d.partCount?'graphs':null;
 return p;
}
function discontinuity(){
 const p=window.BMUnit1Discontinuities.generate();
 const checks=p.candidateChecks||p.points?.map(t=>`At \\(x=${t.x}\\): ${t.type}. ${t.why}`)||[];
 return {...p,cat:'discontinuities',q:`<div class="u1-review-discontinuity"><div class="u1-review-discontinuity-prompt">Find and classify every discontinuity.</div><div class="u1-review-discontinuity-function">\\[\\displaystyle ${p.tex}\\]</div></div>`,sol:checks.join('<br>')};
}
const generators={
 tables:()=>fromMC(window.BMUnit1Representations.table(),'tables'),graphs:graph,
 continuous:()=>window.BMUnit1CoreExpansions.continuous('mixed'),
 factoring:()=>window.BMUnit1BasicTechniques.generate('factoring'),
 substitution:()=>window.BMUnit1BasicTechniques.generate('substitution'),
 rationalizing:()=>window.BMUnit1BasicTechniques.generate('rationalizing'),
 complex:()=>window.BMUnit1BasicTechniques.generate('complex'),oneSided,
 regularTrig:()=>courseTrig(false),squeeze:()=>courseTrig(true),
 special:()=>fromMC(window.BatchMathAPTopicGenerators.get('sin-one-over-x')(),'special'),
 advancedTrig:advanced,
 infinity:()=>window.BMUnit1InfinityExpansions.generate('mixed',window.BMUnit1InfinityLegacy.generate),
 discontinuities:discontinuity,
 parameters:()=>fromMC(window.BMUnit1ContinuityParameters.generate(),'parameters'),
 ivt:()=>fromMC(window.BMUnit1IVT.generate({mode:'mixed'}),'ivt')
};
function normalize(p,cat){
 p={...p};for(const[k,v]of Object.entries(p))if(typeof v==='function')delete p[k];
 const clean=s=>String(s??'').replace(/\\frac1\{-([0-9]+)\}/g,'-\\frac1{$1}').replace(/\\frac\{([^{}]+)\}\{-([0-9]+)\}/g,'-\\frac{$1}{$2}').replace(/-\s*-/g,'+').replace(/\+\s*-/g,'-').replace(/\+\s*\+/g,'+').replace(/\^\{1\}/g,'').replace(/\^1(?!\d)/g,'');
 p.cat=p.cat||cat;p.q=clean(p.q||p.questionHtml);p.sol=clean(p.sol||p.explanation||'');
 p.id=p.id||p.problemId||`${cat}-${++setSerial}`;p.problemId=p.problemId||p.id;
 p.problemType=p.problemType||`unit1_${cat}`;p.problemVariant=p.problemVariant||p.variant||p.familyId||p.id;
 p.generatorVersion=p.generatorVersion||'19';return p;
}
function generate(selected='all'){
 const cat=continuationCategory||(selected==='all'?mixedCategory():selected);
 if(!generators[cat])throw new Error(`Unknown comprehensive-review category: ${cat}`);
 const p=normalize(generators[cat](),cat);
 if(cat!=='graphs'&&cat!=='oneSided')continuationCategory=null;
 return p;
}
function reset(){oneSidedQueue=[];continuationCategory=null;window.BMUnit1Representations?.resetGraph?.();window.BMUnit1InfinityLegacy?.resetDirections?.();}
function texAnswer(a){if(!a)return'';if(a.kind==='rat')return a.d===1?String(a.n):`${a.n<0?'-':''}\\frac{${Math.abs(a.n)}}{${a.d}}`;if(a.kind==='exact')return a.tex;if(a.kind==='dne')return'\\mathrm{DNE}';return a.sign<0?'-\\infty':'\\infty';}
function isCorrect(parsed,ans){if(!parsed||!ans)return false;if(ans.kind==='dne')return parsed.kind==='dne';if(ans.kind==='inf')return parsed.kind==='inf'&&parsed.sign===ans.sign;if(parsed.kind!=='num')return false;const expected=ans.kind==='exact'?ans.value:ans.n/ans.d;return Math.abs(parsed.value-expected)<1e-7*Math.max(1,Math.abs(expected));}
function mount(){
 const $=id=>document.getElementById(id),select=$('category');if(!select)return;
 select.innerHTML=options.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');select.value='all';
 let current=null,correct=0,attempts=0;const seen=new Set();
 const typeset=nodes=>{
  if(!window.MathJax?.typesetPromise)return Promise.resolve();
  window.MathJax.typesetClear?.(nodes);
  return Promise.resolve(window.MathJax.typesetPromise(nodes)).catch(()=>{});
 };
 const fitReviewMath=(host,cat)=>{
  if(!host||!['regularTrig','discontinuities'].includes(cat))return;
  const scope=cat==='discontinuities'&&typeof host.querySelector==='function'?(host.querySelector('.u1-review-discontinuity-function')||host):host;
  const fit=()=>{
   const available=Math.max(1,(Number(scope.clientWidth)||1)-16);
   (scope.querySelectorAll?.('mjx-container')||[]).forEach(container=>{
    container.style.fontSize='';
    const math=container.querySelector('mjx-math')||container;
    const needed=Math.max(math.scrollWidth||0,math.getBoundingClientRect?.().width||0);
    if(needed>available){
     const scale=Math.min(1,(available/needed)*.98);
     container.style.fontSize=`${scale}em`;
    }
   });
  };
  const schedule=()=>(window.requestAnimationFrame||((fn)=>setTimeout(fn,0)))(fit);
  const startup=window.MathJax?.startup?.promise;
  if(startup?.then)startup.then(schedule).catch(schedule);else schedule();
 };
 function finish(ok){
  if(!current||current.answered)return;current.answered=true;attempts++;$('attempted').textContent=attempts;
  window.BMAnalytics?.answerChecked(current,ok);if(ok){correct++;$('correct-count').textContent=correct;}
  $('answer').disabled=true;$('submit').disabled=true;$('next').style.display='inline-block';
  $('feedback').className='feedback '+(ok?'correct':'wrong');$('feedback').dataset.answerState='answered';
  $('feedback').innerHTML=ok?'✓ Correct':`<div class="correct-answer">${current.ans?`Correct answer: \\(${texAnswer(current.ans)}\\)`:'Review the method below.'}</div><div class="method">${current.sol}</div>`;
  if(ok)window.BMUnit1UI.methodButton($('feedback'),current.sol,()=>window.BMAnalytics?.solutionRevealed(current,{reveal_reason:'requested_method'}));
  else window.BMAnalytics?.solutionRevealed(current,{reveal_reason:'incorrect_answer'});
  typeset([$('feedback')]);
  if(current.choices||current.points||current.fields)setTimeout(()=>$('next').focus(),0);
 }
 function makeProblem(){
  let p;for(let tries=0;tries<100;tries++){p=generate(select.value);if(continuationCategory||!seen.has(p.id)){seen.add(p.id);break;}if(seen.size>600)seen.clear();}
  current=p;current.answered=false;window.BMAnalytics?.ensurePracticeStarted({practice_mode:select.value});window.BMAnalytics?.problemGenerated(p,{practice_mode:select.value});
  $('question').className=`question-box u1-review-question u1-review-question-${p.cat}`;$('question').innerHTML=p.q;$('answer').value='';window.BatchMathCalculusKeypad?.reset?.();$('answer').disabled=false;$('submit').disabled=false;
  delete $('feedback').dataset.answerState;$('feedback').className='feedback';$('feedback').innerHTML='';$('next').style.display='none';
  $('topic-name').textContent=select.value==='all'?'Everything — Full Unit Review':labels[p.cat]||labels[select.value]||'Comprehensive Review';
  let extra=document.getElementById('u1-options');if(!extra){extra=document.createElement('div');extra.id='u1-options';$('question').after(extra);}extra.className=`u1-options u1-review-options u1-review-options-${p.cat}`;extra.innerHTML='';
  const custom=!!(p.choices||p.points||p.fields);document.body?.classList.toggle('u1-custom-answer',custom);$('answer').hidden=custom;$('submit').hidden=custom;
  if(custom){$('answer').disabled=true;$('submit').disabled=true;window.BMUnit1UI.render(p,extra,finish);}
  typeset([$('question')]).then(()=>fitReviewMath($('question'),p.cat));if(!custom){if(window.BatchMathCalculusKeypad)window.BatchMathCalculusKeypad.focus();else $('answer').focus();}
 }
 function submit(){if(!current||current.answered)return;const parsed=window.BMUnit1UI.parse($('answer').value);if(parsed.error){$('feedback').className='feedback wrong';$('feedback').dataset.answerState='invalid';$('feedback').textContent=parsed.error;return;}finish(isCorrect(parsed,current.ans));}
 select.addEventListener('change',()=>{reset();seen.clear();makeProblem();});$('submit').addEventListener('click',submit);$('next').addEventListener('click',makeProblem);
 $('answer').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.defaultPrevented&&!$('submit').disabled){e.preventDefault();submit();}});makeProblem();
 window.addEventListener('resize',()=>fitReviewMath($('question'),current?.cat),{passive:true});
 window.addEventListener('load',()=>fitReviewMath($('question'),current?.cat),{once:true});
 }
window.BMUnit1ComprehensiveReview={options,labels,targets,algebraWeights,mixedCategory,generate,reset,isCorrect,texAnswer,mount};
})();
