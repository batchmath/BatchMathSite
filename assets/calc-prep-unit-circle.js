(function(){
'use strict';
const B=window.BMPrep,$=B.$;
const mode=$('mode'),quad=$('quadrant'),format=$('format'),prompt=$('prompt'),q=$('question'),submit=$('submit'),next=$('next');
let correct=0,attempted=0,current=null,locked=false,seen=new Set();
const SQ2=Math.sqrt(2),SQ3=Math.sqrt(3);
const ANGLES=[
 {deg:0,rad:[0,1],ref:0,sin:0,cos:1},
 {deg:30,rad:[1,6],ref:30,sin:.5,cos:SQ3/2},{deg:45,rad:[1,4],ref:45,sin:SQ2/2,cos:SQ2/2},{deg:60,rad:[1,3],ref:60,sin:SQ3/2,cos:.5},
 {deg:90,rad:[1,2],ref:90,sin:1,cos:0},{deg:120,rad:[2,3],ref:60,sin:SQ3/2,cos:-.5},{deg:135,rad:[3,4],ref:45,sin:SQ2/2,cos:-SQ2/2},{deg:150,rad:[5,6],ref:30,sin:.5,cos:-SQ3/2},
 {deg:180,rad:[1,1],ref:0,sin:0,cos:-1},{deg:210,rad:[7,6],ref:30,sin:-.5,cos:-SQ3/2},{deg:225,rad:[5,4],ref:45,sin:-SQ2/2,cos:-SQ2/2},{deg:240,rad:[4,3],ref:60,sin:-SQ3/2,cos:-.5},
 {deg:270,rad:[3,2],ref:90,sin:-1,cos:0},{deg:300,rad:[5,3],ref:60,sin:-SQ3/2,cos:.5},{deg:315,rad:[7,4],ref:45,sin:-SQ2/2,cos:SQ2/2},{deg:330,rad:[11,6],ref:30,sin:-.5,cos:SQ3/2}
];
const pools={q1:[30,45,60],q2:[120,135,150],q3:[210,225,240],q4:[300,315,330]};
const names={sin:'sin',cos:'cos',tan:'tan',csc:'csc',sec:'sec',cot:'cot'};
const base={
 0:{sin:'0',cos:'1',tan:'0',csc:'undefined',sec:'1',cot:'undefined'},
 30:{sin:'1/2',cos:'√3/2',tan:'√3/3',csc:'2',sec:'2√3/3',cot:'√3'},
 45:{sin:'√2/2',cos:'√2/2',tan:'1',csc:'√2',sec:'√2',cot:'1'},
 60:{sin:'√3/2',cos:'1/2',tan:'√3',csc:'2√3/3',sec:'2',cot:'√3/3'},
 90:{sin:'1',cos:'0',tan:'undefined',csc:'1',sec:'undefined',cot:'0'}
};
function quadrant(d){if(d===0||d===90||d===180||d===270)return 0;if(d<90)return 1;if(d<180)return 2;if(d<270)return 3;return 4}
function numeric(f,a){const s=a.sin,c=a.cos,e=1e-10;if(f==='sin')return s;if(f==='cos')return c;if(f==='tan')return Math.abs(c)<e?null:s/c;if(f==='csc')return Math.abs(s)<e?null:1/s;if(f==='sec')return Math.abs(c)<e?null:1/c;if(f==='cot')return Math.abs(s)<e?null:c/s}
function sign(f,a){const v=numeric(f,a);if(v===null)return 1;return v<0?-1:1}
function canon(f,a){const v=numeric(f,a);if(v===null)return 'undefined';if(Math.abs(v)<1e-12)return '0';const b=base[a.ref][f];if(b==='undefined')return b;return sign(f,a)<0?'-'+b:b}
function radText(a){let [n,d]=a.rad;if(n===0)return '0';if(d===1)return n===1?'π':n===-1?'−π':`${n}π`;const sign=n<0?'−':'',an=Math.abs(n),top=an===1?'π':`${an}π`;return `${sign}${top}/${d}`}
function radTextDeg(deg){if(deg===0)return '0';const g=B.gcd(Math.abs(deg),180),n=deg/g,d=180/g;if(d===1)return n===1?'π':n===-1?'−π':`${n}π`;const sign=n<0?'−':'',an=Math.abs(n),top=an===1?'π':`${an}π`;return `${sign}${top}/${d}`}
function exactText(s){if(s==='undefined')return 'Undefined';return String(s).replace(/^-/, '−')}
function pool(){if(quad.value==='all')return ANGLES;const set=new Set(pools[quad.value]);return ANGLES.filter(a=>set.has(a.deg))}
function funcs(){if(mode.value==='sct')return ['sin','cos','tan'];if(mode.value==='recip')return ['csc','sec','cot'];if(mode.value==='all')return ['sin','cos','tan','csc','sec','cot'];return [mode.value]}
function angleUseRad(){return format.value==='radians'||(format.value==='mixed'&&BatchMathRNG.random()<.5)}
function make(){const a=B.pick(pool()),f=B.pick(funcs()),r=angleUseRad();const c=canon(f,a);return {id:`${f}-${a.deg}-${r?'r':'d'}`,a,f,r,canonical:c,expected:numeric(f,a)}}
function explanation(c){const a=c.a,f=c.f,angle=c.r?radText(a):`${a.deg}°`;if(c.canonical==='undefined'){return `${f} is undefined at ${angle} because the reciprocal/quotient definition would require division by 0.`}if([0,90,180,270].includes(a.deg)){return `Use the unit-circle point (cos θ, sin θ) at ${angle}. The exact value is ${exactText(c.canonical)}.`}const qn=['','I','II','III','IV'][quadrant(a.deg)],ref=c.r?radTextDeg(a.ref):`${a.ref}°`;return `The reference angle is ${ref}. Start with the first-quadrant ${f} value ${exactText(base[a.ref][f])}, then apply the sign of ${f} in Quadrant ${qn}.`}
const editor=BMExactEditor.mount({input:'#answerRaw',editor:'#exactEditor',keypad:'#exactKeypad',onCheck:check});
function newQ(){locked=false;editor.lock(false);editor.clear();$('feedback').innerHTML='';$('feedback').className='feedback';next.style.display='none';let c,tries=0;do{c=make();tries++;if(tries>80){seen.clear();break}}while(seen.has(c.id));seen.add(c.id);current=c;window.BMAnalytics?.ensurePracticeStarted({practice_mode:(document.getElementById("mode")?.value||document.getElementById("qtype")?.value||document.getElementById("difficulty")?.value||document.getElementById("displayMode")?.value||"default")});window.BMAnalytics?.problemGenerated(current,{practice_mode:(document.getElementById("mode")?.value||document.getElementById("qtype")?.value||document.getElementById("difficulty")?.value||document.getElementById("displayMode")?.value||"default")});prompt.textContent='Find the exact value.';B.renderMath(q,`${names[c.f]}(${c.r?radText(c.a):`${c.a.deg}°`})`);editor.focus()}
function check(){if(locked)return;const raw=editor.raw.trim();if(!raw)return;attempted++;let ok=false;if(current.canonical==='undefined'){ok=/^(?:undefined|undef|dne)$/i.test(raw.trim())}else{const v=B.safeExactEval(raw);ok=Number.isFinite(v)&&Math.abs(v-current.expected)<1e-8}window.BMAnalytics?.answerChecked(current,ok);B.updateStats(correct+(ok?1:0),attempted);if(ok){correct++;B.updateStats(correct,attempted);B.showFeedback(true);locked=true;editor.lock(true);setTimeout(newQ,600)}else{window.BMAnalytics?.solutionRevealed(current,{reveal_reason:"incorrect_answer"});B.showFeedback(false,exactText(current.canonical),explanation(current));locked=true;editor.lock(true);next.style.display='inline-block'}}
submit.style.display='none';next.addEventListener('click',newQ);[mode,quad,format].forEach(el=>el.addEventListener('change',()=>{seen.clear();newQ()}));newQ();
})();
