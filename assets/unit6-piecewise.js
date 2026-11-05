/* BatchMath v12.9.B — Unit 6 engine: Integrals on Piecewise Defined Functions (typed exact answers).
   The same six families and parameter ranges as the former multiple-choice generator (ap-topic-generators.js), now
   answered by typing the exact value (fractions, integers, multiples of pi, ln 2 and their sums):
     two_linear              a x + c on [-2, 1), b x on [1, 3]
     mixed_constant_quad     a on [-1, 2), b x^2 on [2, 3]
     three_poly              a x + 2a on [-2, 0), b x^2 on [0, 2), c - x on [2, 4]
     reciprocal_log          k/x on [1, 2), c x on [2, 4]
     trig_piece              k cos x on [0, pi/2), 2m - m sin x on [pi/2, pi]
     four_piece              a x on [-2, -1), b x^2 + 1 on [-1, 1), c - x on [1, 2), d on [2, 4]
   The explanation splits the integral where the formula changes, evaluates each piece and adds the values. */
(function(){
'use strict';
const C=window.BatchMathUnit6Core;
if(!C){console.error('unit6-piecewise: load unit6-core.js first');return;}
const {U5,Q,K,ex,eadd,etex,P,pc,pm,padd,pint,pdef,ptex,bq,exactAnswer,step,question,problem,exactPart}=C;
const {ri}=U5,qtex=U5.qtex;
const etexN=e=>{const r=e.get('1');return etex(e,r&&r.q.n<0&&e.size>1?{lead:'last'}:{});};
const ans=e=>({...exactAnswer(e),tex:etexN(e)});
const poly=terms=>P(terms.map(([c,e])=>({c:typeof c==='number'?Q(c):c,e:Q(e)})));
const bound=q=>typeof q==='number'?{tex:String(q),q:Q(q)}:q;
// a polynomial branch on [lo, hi]: its TeX, the integral, the antiderivative and the exact value
function polyBranch(Pp,lo,hi){
 const L=bound(lo),H=bound(hi),F=pint(Pp),v=pdef(Pp,bq(L.q),bq(H.q)),tex=ptex(Pp,'x',Pp.some(t=>t.e.n!==0&&t.c.n<0)); // 5-x, but 2x+4
 return{tex,lo:L.tex,hi:H.tex,value:ex(v),line:`\\int_{${L.tex}}^{${H.tex}}${C.parTex(tex)}\\,dx=\\left[${ptex(F,'x')}\\right]_{${L.tex}}^{${H.tex}}=${qtex(v)}`};
}
function piecewiseProblem(family,tier,id,branches,wrong){
 const lo=branches[0].lo,hi=branches[branches.length-1].hi;
 const cases=branches.map((b,i)=>`${b.tex},&${b.lo}\\le x${i===branches.length-1?'\\le':'<'}${b.hi}`).join('\\\\');
 const total=branches.reduce((s,b)=>eadd(s,b.value),ex(0));
 const cuts=branches.slice(1).map(b=>`x=${b.lo}`);
 const split=step('Split the integral where the formula changes.',`The formula changes at ${cuts.map(c=>`\\(${c}\\)`).join(cuts.length>2?', ':' and ').replace(/, (?=[^,]*$)/,' and ')}, so integrate each branch only on its own interval.`,
  `\\int_{${lo}}^{${hi}}f(x)\\,dx=${branches.map(b=>`\\int_{${b.lo}}^{${b.hi}}${C.parTex(b.tex)}\\,dx`).join('+')}`);
 const evalStep=step('Evaluate each integral and add.','',...branches.map(b=>b.line),`\\int_{${lo}}^{${hi}}f(x)\\,dx=${branches.map(b=>{const t=etexN(b.value);return /^-/.test(t)?`\\left(${t}\\right)`:t;}).join('+')}=${etexN(total)}`);
 const part=exactPart(`Evaluate \\(\\displaystyle\\int_{${lo}}^{${hi}}f(x)\\,dx\\).`,ans(total),split+evalStep,{wrong:wrong?[{value:C.evalE(wrong),note:'Each formula applies only on its own interval: split the integral at every point where the formula changes.'}]:[]});
 return problem({engine:'piecewise',family,tier,id,questionHtml:question({context:'The function f is defined piecewise.',prompt:'',formulas:[`f(x)=\\begin{cases}${cases}\\end{cases}`],calculator:false}),parts:[part],data:{pieces:branches.length}});
}
const FAMILIES={
 two_linear:{weight:1,tiers:['foundational'],calculator:false,make:tier=>{const a=ri(1,4),b=ri(1,4),c=ri(-3,3);
  const B=[polyBranch(poly([[a,1],[c,0]]),-2,1),polyBranch(poly([[b,1]]),1,3)];
  return piecewiseProblem('two_linear',tier,`pw1-${a}-${b}-${c}`,B,ex(pdef(poly([[a,1],[c,0]]),bq(-2),bq(3))));}},
 mixed_constant_quad:{weight:1,tiers:['foundational'],calculator:false,make:tier=>{const a=ri(1,5),b=ri(1,4);
  const B=[polyBranch(pc(a),-1,2),polyBranch(poly([[b,2]]),2,3)];
  return piecewiseProblem('mixed_constant_quad',tier,`pw6-${a}-${b}`,B,ex(pdef(poly([[b,2]]),bq(-1),bq(3))));}},
 three_poly:{weight:1,tiers:['intermediate'],calculator:false,make:tier=>{const a=ri(1,4),b=ri(1,4),c=ri(2,6);
  const B=[polyBranch(poly([[a,1],[2*a,0]]),-2,0),polyBranch(poly([[b,2]]),0,2),polyBranch(poly([[c,0],[-1,1]]),2,4)];
  return piecewiseProblem('three_poly',tier,`pw2-${a}-${b}-${c}`,B);}},
 reciprocal_log:{weight:1,tiers:['intermediate'],calculator:false,make:tier=>{const k=ri(1,4),c=ri(1,4),kt=k===1?'':k;
  const B=[{tex:`\\frac{${k}}{x}`,lo:'1',hi:'2',value:ex(k,K.ln2),line:`\\int_{1}^{2}\\frac{${k}}{x}\\,dx=\\left[${kt}\\ln x\\right]_{1}^{2}=${kt}\\ln 2-${kt}\\ln 1=${kt}\\ln 2`},polyBranch(poly([[c,1]]),2,4)];
  return piecewiseProblem('reciprocal_log',tier,`pw5-${k}-${c}`,B);}},
 trig_piece:{weight:1,tiers:['intermediate'],calculator:false,make:tier=>{const k=ri(1,4),m=ri(1,3),kt=k===1?'':k,mt=m===1?'':m;
  const B=[{tex:`${kt}\\cos x`,lo:'0',hi:'\\frac{\\pi}{2}',value:ex(k),line:`\\int_{0}^{\\frac{\\pi}{2}}${kt}\\cos x\\,dx=\\left[${kt}\\sin x\\right]_{0}^{\\frac{\\pi}{2}}=${k}`},
   {tex:`${2*m}-${mt}\\sin x`,lo:'\\frac{\\pi}{2}',hi:'\\pi',value:eadd(ex(m,K.pi),ex(-m)),line:`\\int_{\\frac{\\pi}{2}}^{\\pi}\\left(${2*m}-${mt}\\sin x\\right)dx=\\left[${2*m}x+${mt}\\cos x\\right]_{\\frac{\\pi}{2}}^{\\pi}=\\left(${2*m}\\pi-${m}\\right)-${m===1?'':m}\\pi=${etexN(eadd(ex(m,K.pi),ex(-m)))}`}];
  return piecewiseProblem('trig_piece',tier,`pw4-${k}-${m}`,B);}},
 four_piece:{weight:1,tiers:['intermediate','challenging'],calculator:false,make:tier=>{const a=ri(1,3),b=ri(1,3),c=ri(3,6),d=ri(1,4);
  const B=[polyBranch(poly([[a,1]]),-2,-1),polyBranch(poly([[b,2],[1,0]]),-1,1),polyBranch(poly([[c,0],[-1,1]]),1,2),polyBranch(pc(d),2,4)];
  return piecewiseProblem('four_piece',tier,`pw3-${a}-${b}-${c}-${d}`,B);}},
};
const engine=U5.makeEngine('unit6-piecewise',FAMILIES);
window.BatchMathUnit6Piecewise=Object.freeze({make:engine.make,FAMILIES});
U5.register('integrals-on-piecewise-defined-functions',o=>engine.make(o||{}));
})();
