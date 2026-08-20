(function(){
'use strict';
const B=BMPrep,$=B.$,displayMode=$('displayMode'),prompt=$('prompt'),question=$('question'),submit=$('submit'),next=$('next');
const holesSel=$('holes'),verticalSel=$('vertical'),endSel=$('endAsymptote'),xintsSel=$('xints');
let correct=0,attempted=0,current=null,locked=false,seen=new Set();
function mul(a,b){const o=Array(a.length+b.length-1).fill(0);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)o[i+j]+=a[i]*b[j];return o}
function scale(a,k){return a.map(x=>x*k)}
function evalP(a,x){let y=0;for(const c of a)y=y*x+c;return y}
function fmtP(c){const n=c.length-1;let out='';c.forEach((a,i)=>{if(!a)return;const p=n-i,sg=a<0?'−':'+',aa=Math.abs(a);let t;if(p===0)t=String(aa);else if(p===1)t=(aa===1?'':aa)+'x';else t=(aa===1?'':aa)+`x^${p}`;if(!out)out=(a<0?'−':'')+t;else out+=` ${sg} ${t}`});return out||'0'}
function lin(r){return [1,-r]}
function factorText(r){return r===0?'x':`(x ${r>0?'−':'+'} ${Math.abs(r)})`}
function frac(n,d){[n,d]=B.reduce(n,d);return d===1?String(n):`${n}/${d}`}
function coord(x,n,d){return `(${x}, ${frac(n,d)})`}
function listX(arr){if(!arr.length)return 'None';return arr.slice().sort((a,b)=>a-b).map(x=>`x = ${x}`).join(', ')}
function xints(arr){if(!arr.length)return 'None';return arr.slice().sort((a,b)=>a-b).map(x=>`(${x}, 0)`).join(', ')}
function setOptions(sel,correct,extras){const vals=[];for(const v of [correct,...extras])if(v!=null&&!vals.includes(v))vals.push(v);for(const v of ['None','x = 0','y = 0','(0, 0)','x = 1','y = 1']){if(vals.length>=4)break;if(!vals.includes(v))vals.push(v)}const shuffled=B.shuffle(vals.slice(0,4));sel.innerHTML='';const blank=document.createElement('option');blank.value='';blank.textContent='Choose...';sel.appendChild(blank);for(const v of shuffled){const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o)}}
function clearFieldMarks(){document.querySelectorAll('.feature-box').forEach(x=>x.classList.remove('field-correct','field-wrong'))}
function build(){
 // About 75% horizontal asymptote problems and 25% slant asymptote problems.
 const type=Math.random()<.25?'slant':(Math.random()<.5?'equal':'zero');
 let vals=[];while(vals.length<5){const x=B.randInt(-4,4);if(!vals.includes(x))vals.push(x)}
 const [hole,va,r1,r2,v2]=vals,hasHole=Math.random()<.75;
 let N,D,redN,redD,ha='',vas=[],zeros=[];
 if(type==='equal'){
  const A=B.pick([-2,-1,1,2]);redN=scale(lin(r1),A);redD=lin(va);N=redN;D=redD;ha=`y = ${A}`;vas=[va];zeros=[r1];
 }else if(type==='zero'){
  redN=lin(r1);redD=mul(lin(va),lin(v2));N=redN;D=redD;ha='y = 0';vas=[va,v2];zeros=[r1];
 }else{
  redN=mul(lin(r1),lin(r2));redD=lin(va);N=redN;D=redD;const sum=r1+r2,b=va-sum;ha=`y = x ${b===0?'':b>0?`+ ${b}`:`− ${-b}`}`.trim();vas=[va];zeros=[r1,r2];
 }
 let holeAnswer='None';
 if(hasHole){N=mul(N,lin(hole));D=mul(D,lin(hole));const hn=evalP(redN,hole),hd=evalP(redD,hole);holeAnswer=coord(hole,hn,hd)}
 const dm=displayMode.value==='mixed'?(Math.random()<.5?'factored':'expanded'):displayMode.value;
 let numText,denText;
 if(dm==='expanded'){numText=fmtP(N);denText=fmtP(D)}else{
  if(type==='equal'){const A=redN[0];numText=(A===1?'':A===-1?'−':String(A))+factorText(r1);denText=factorText(va)}
  else if(type==='zero'){numText=factorText(r1);denText=factorText(va)+factorText(v2)}
  else{numText=factorText(r1)+factorText(r2);denText=factorText(va)}
  if(hasHole){numText=factorText(hole)+numText;denText=factorText(hole)+denText}
 }
 const holeMethod=hasHole?`The common factor ${factorText(hole)} cancels. The canceled x-value is ${hole}; evaluating the reduced function there gives the hole ${holeAnswer}.`:'No common factor cancels, so there is no hole.';
 const verticalMethod=vas.length===1?`After canceling any common factor, the remaining denominator is 0 at x = ${vas[0]}, so that value gives the vertical asymptote.`:`After canceling any common factor, the remaining denominator is 0 at x = ${vas.slice().sort((a,b)=>a-b).join(' and x = ')}, so those values give the vertical asymptotes.`;
 const endMethod=type==='equal'?`The reduced numerator and denominator have the same degree, so the horizontal asymptote is the ratio of leading coefficients: ${ha}.`:type==='zero'?`The reduced numerator has lower degree than the denominator, so the horizontal asymptote is ${ha}.`:`The reduced numerator is exactly one degree higher than the denominator. Polynomial division gives the slant asymptote ${ha}.`;
 const xMethod=zeros.length===1?`After cancellation, the remaining numerator is 0 at x = ${zeros[0]}, giving x-intercept (${zeros[0]}, 0).`:`After cancellation, the remaining numerator is 0 at x = ${zeros.slice().sort((a,b)=>a-b).join(' and x = ')}, giving the listed x-intercepts.`;
 const id=`${type}-${dm}-${N.join('_')}-${D.join('_')}`;
 return {id,type,dm,numText,denText,hole:holeAnswer,vertical:listX(vas),end:ha,xints:xints(zeros),hasHole,vas,zeros,methods:{hole:holeMethod,vertical:verticalMethod,end:endMethod,xints:xMethod}};
}
function newQ(){locked=false;clearFieldMarks();$('feedback').innerHTML='';$('feedback').className='feedback';next.style.display='none';let c,tries=0;do{c=build();tries++;if(tries>100){seen.clear();break}}while(seen.has(c.id));seen.add(c.id);current=c;prompt.textContent=`Analyze the rational function (${c.dm} form).`;B.renderHTML(question,`${B.inlineMathHTML('f(x) = ')}${B.fracHTMLText(c.numText,c.denText,'display-frac')}`);
 setOptions(holesSel,c.hole,[c.hasHole?'None':'(0, 0)',c.hasHole?'(0, 0)':'(1, 1)','None']);
 setOptions(verticalSel,c.vertical,[c.vas.length?`x = ${-c.vas[0]}`:'x = 0','None',c.vas.length>1?`x = ${c.vas[0]}`:'x = 1']);
 setOptions(endSel,c.end,[c.end==='y = 0'?'y = 1':'y = 0','None',c.type==='slant'?'y = x':'y = 2']);
 setOptions(xintsSel,c.xints,[c.zeros.length?`(${-c.zeros[0]}, 0)`:'(0, 0)','None',c.zeros.length>1?`(${c.zeros[0]}, 0)`:'(1, 0)']);
}
function check(){
 if(locked)return;if(!holesSel.value||!verticalSel.value||!endSel.value||!xintsSel.value)return;
 const checks=[
  {sel:holesSel,key:'hole',label:'Hole(s)',correct:current.hole},
  {sel:verticalSel,key:'vertical',label:'Vertical asymptote(s)',correct:current.vertical},
  {sel:endSel,key:'end',label:'Horizontal / slant asymptote',correct:current.end},
  {sel:xintsSel,key:'xints',label:'x-intercept(s)',correct:current.xints}
 ];
 const wrong=[];for(const item of checks){const ok=item.sel.value===item.correct,box=item.sel.closest('.feature-box');box?.classList.add(ok?'field-correct':'field-wrong');if(!ok)wrong.push(item)}
 const ok=wrong.length===0;attempted++;if(ok)correct++;B.updateStats(correct,attempted);locked=true;
 if(ok){B.showFeedback(true);setTimeout(newQ,700)}else{
  const f=$('feedback');f.className='feedback wrong';f.innerHTML=`<div class="status">✗ ${wrong.length===1?'One part needs correction.':`${wrong.length} parts need correction.`}</div>`+wrong.map(item=>`<div class="partial-explanation"><strong>${item.label}:</strong> Correct answer: <span class="correct-answer-text inline">${B.displayMathHTML(item.correct)}</span><br>${current.methods[item.key]}</div>`).join('');B.typeset([f]);next.style.display='inline-block';
 }
}
submit.addEventListener('click',check);next.addEventListener('click',newQ);displayMode.addEventListener('change',()=>{seen.clear();newQ()});newQ();
})();
