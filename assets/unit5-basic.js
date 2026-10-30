/* BatchMath v12.8.X — Unit 5 engine 1: Basic First-Order Differential Equations (dy/dx = f(x)).
   Families (mixed mode): polynomial / rational-power / radical IVPs 20%, trig and inverse-trig IVPs 20%,
   exponential and composition IVPs 20%, logarithmic / rational / domain-restricted IVPs 15%, calculator FTC
   IVPs 15% (v12.8.X: values 6, starting value 4, net change / two values 5), general solutions 10%. IVPs ask for the particular solution and, where the domain matters (and
   sometimes when it does not), its interval of validity: the maximal interval containing the initial value
   on which the solution is defined and satisfies the differential equation. */
(function(){
'use strict';
const U=window.BatchMathUnit5Core;
if(!U)return;
const {Q,qv,qadd,qsub,qmul,qdiv,qneg,qint,qzero,qone,qtex,qexpr,ri,pick,nz,shuffle,E,ex,eadd,esub,escale,etex,eexpr,K,termTex,step,eq,m,question,problem,fix,integrate}=U;
const evE=U.eval;

// ---------- exact trig values at rational multiples of π ----------
const R2=K.sqrt2,R3=K.sqrt3;
const TRIG_CANDIDATES=(()=>{const list=[];const add=(e)=>{list.push(e);list.push(escale(e,Q(-1)));};
 add(E());add(ex(Q(1,2)));add(ex(1));add(ex(2));add(ex(Q(1,2),R2));add(ex(1,R2));add(ex(Q(1,2),R3));add(ex(1,R3));add(ex(Q(1,3),R3));add(ex(Q(2,3),R3));
 return list;})();
function trigExact(fn,qpi){
 if(![1,2,3,4,6].includes(qpi.d))return null;
 const a=qv(qpi)*Math.PI,s=Math.sin(a),c=Math.cos(a);
 const val={sin:s,cos:c,tan:s/c,sec:1/c,csc:1/s,cot:c/s}[fn];
 if(!Number.isFinite(val)||Math.abs(val)>1e6)return undefined; // undefined there
 for(const cand of TRIG_CANDIDATES)if(Math.abs(evE(cand)-val)<1e-12)return cand;
 return null;
}
// x-values: {tex, val, exact (E), qpi (Q multiple of π) or q (rational)}
const xRat=q=>{q=typeof q==='number'?Q(q):q;return{tex:qtex(q),val:qv(q),exact:ex(q),q};};
function piTexQ(q){if(qzero(q))return '0';const s=q.n<0?'-':'',a=Math.abs(q.n);if(q.d===1)return `${s}${a===1?'':a}\\pi`;return `${s}\\frac{${a===1?'':a}\\pi}{${q.d}}`;}
const xPi=q=>{q=typeof q==='number'?Q(q):q;return{tex:piTexQ(q),val:qv(q)*Math.PI,exact:qzero(q)?E():ex(q,K.pi),qpi:q};};
const xE=k=>({tex:k===1?'e':`e^{${k}}`,val:Math.exp(k),exact:ex(1,U.expAtom(Q(k))),ek:k});
const xInvE=()=>({tex:'\\frac{1}{e}',val:1/Math.E,exact:ex(1,U.atom('1/e','\\frac{1}{e}','(1/e)',1/Math.E)),ek:-1});
const INF={tex:'\\infty',val:Infinity},NINF={tex:'-\\infty',val:-Infinity};
const piTex=q=>xPi(q).tex;

// ---------- variable and notation ----------
function vars(tier){
 const useT=U.rand()<0.25;
 if(!useT){const dep=pick(['y','y','y','u','z']);return{v:'x',dep,d:`\\frac{d${dep}}{dx}`,keypad:'unit5-basic-x',name:'x'};}
 const dep=pick(['y','v','r','A']);return{v:'t',dep,d:`\\frac{d${dep}}{dt}`,keypad:'unit5-basic-t',name:'t'};
}
const vt=(V,s)=>s.replace(/@/g,V.v);

// ---------- terms ----------
// Each term: integrand piece (itex(first), iexpr, f) and antiderivative piece (aq coefficient, abody tex/expr/f),
// exact antiderivative value at x0 (aAt(x0) -> E, null if not exact, undefined if undefined there),
// and its domain around x0 (bounds(x0) -> {lo:{x,closed}, hi:{x,closed}}, reasons).
const ALL=()=>({lo:{x:NINF,closed:false},hi:{x:INF,closed:false}});
function powTex(q,n,v,first){ // q·v^n, n a Q; negative integer powers as fractions
 q=U.asQ(q);n=U.asQ(n);
 if(qzero(n))return termTex(q,'',first);
 if(qone(n))return termTex(q,v,first);
 if(n.d===1&&n.n>0)return termTex(q,`${v}^{${n.n}}`,first);
 if(n.d===2&&n.n===1)return termTex(q,`\\sqrt{${v}}`,first);
 if(n.d===3&&n.n===1)return termTex(q,`\\sqrt[3]{${v}}`,first);
 if(n.n<0){
  const sign=q.n<0?'-':'',a=Math.abs(q.n),den=n.d===1?(n.n===-1?v:`${v}^{${-n.n}}`):(n.n===-1&&n.d===2?`\\sqrt{${v}}`:`${v}^{\\frac{${-n.n}}{${n.d}}}`);
  const body=q.d===1?`\\frac{${a}}{${den}}`:`\\frac{${a}}{${q.d}${den}}`;
  return first?sign+body:(sign?' - ':' + ')+body;
 }
 return termTex(q,`${v}^{\\frac{${n.n}}{${n.d}}}`,first);
}
const realPow=(x,n)=>{if(x>=0||n.d%2===1&&Number.isInteger(qv(n))||n.d%2===1)return x<0&&n.d%2===1?((n.n%2===0)?1:-1)*Math.pow(-x,qv(n)):Math.pow(x,qv(n));return NaN;};
function tPow(c,n){ // c·v^n with n integer (≠ -1) or n in {1/2, -1/2, 1/3}
 c=U.asQ(c);n=U.asQ(n);const n1=qadd(n,Q(1)),aq=qdiv(c,n1);
 const negInt=n.d===1&&n.n<0,half=n.d===2,third=n.d===3;
 return{
  kind:'pow',n,c,
  itex:(V,first)=>powTex(c,n,V.v,first),iexpr:`${qexpr(c)}*x^(${n.n}/${n.d})`,f:x=>qv(c)*realPow(x,n),
  atex:(V,first)=>powTex(aq,n1,V.v,first),aexpr:`${qexpr(aq)}*x^(${n1.n}/${n1.d})`,af:x=>qv(aq)*realPow(x,n1),
  aAt:x0=>{if(!x0.q)return null;const v=qv(x0.q);if(negInt&&v===0)return undefined;if(half&&v<0)return undefined;
   if(n1.d===1){let p=Q(1);for(let i=0;i<Math.abs(n1.n);i++)p=qmul(p,x0.q);if(n1.n<0)p=qdiv(Q(1),p);return ex(qmul(aq,p));}
   const r=Math.round(Math.pow(Math.abs(v),1/n1.d));if(x0.q.d!==1||Math.pow(r,n1.d)!==Math.abs(v))return null; // perfect square/cube only
   let p=Q(1);const base=v<0?-r:r;for(let i=0;i<n1.n;i++)p=qmul(p,Q(base));return ex(qmul(aq,p));},
  bounds:(x0,V)=>{
   if(negInt)return x0.val>0?{lo:{x:xRat(0),closed:false},hi:{x:INF,closed:false},why:`${m(powTex(Q(1),n,V.v,true))} is undefined at ${m(`${V.v}=0`)}`}:{lo:{x:NINF,closed:false},hi:{x:xRat(0),closed:false},why:`${m(powTex(Q(1),n,V.v,true))} is undefined at ${m(`${V.v}=0`)}`};
   if(half&&n.n>0)return{lo:{x:xRat(0),closed:true},hi:{x:INF,closed:false},why:`${m(`\\sqrt{${V.v}}`)} requires ${m(`${V.v}\\ge 0`)}; at ${m(`${V.v}=0`)} the equation and the solution are both defined`,closedAt0:true};
   if(half)return{lo:{x:xRat(0),closed:false},hi:{x:INF,closed:false},why:`${m(`\\frac{1}{\\sqrt{${V.v}}}`)} requires ${m(`${V.v}>0`)}`};
   return ALL();
  },
  note:half||third||negInt?'rewrite':null,
  rewriteTex:V=>powTex(c,n,V.v,true).includes('\\frac')||half||third?powTex(c,n,V.v,true).replace(/\\sqrt\{(\w)\}/,'$1^{\\frac{1}{2}}'):null,
 };
}
// trig: fn in sin, cos, sec2, csc2, sectan, csccot; argument k·v
const TRIG={
 sin:{tex:a=>`\\sin ${a}`,expr:a=>`sin(${a})`,f:a=>Math.sin(a),anti:'cos',sgn:-1},
 cos:{tex:a=>`\\cos ${a}`,expr:a=>`cos(${a})`,f:a=>Math.cos(a),anti:'sin',sgn:1},
 sec2:{tex:a=>`\\sec^{2} ${a}`,expr:a=>`sec(${a})^2`,f:a=>1/Math.cos(a)**2,anti:'tan',sgn:1,zero:'cos'},
 csc2:{tex:a=>`\\csc^{2} ${a}`,expr:a=>`csc(${a})^2`,f:a=>1/Math.sin(a)**2,anti:'cot',sgn:-1,zero:'sin'},
 sectan:{tex:a=>`\\sec ${a}\\tan ${a}`,expr:a=>`sec(${a})*tan(${a})`,f:a=>Math.tan(a)/Math.cos(a),anti:'sec',sgn:1,zero:'cos'},
 csccot:{tex:a=>`\\csc ${a}\\cot ${a}`,expr:a=>`csc(${a})*cot(${a})`,f:a=>1/(Math.sin(a)*Math.tan(a)),anti:'csc',sgn:-1,zero:'sin'},
};
const ANTI={sin:{tex:a=>`\\sin ${a}`,expr:a=>`sin(${a})`,f:Math.sin},cos:{tex:a=>`\\cos ${a}`,expr:a=>`cos(${a})`,f:Math.cos},tan:{tex:a=>`\\tan ${a}`,expr:a=>`tan(${a})`,f:Math.tan},cot:{tex:a=>`\\cot ${a}`,expr:a=>`cot(${a})`,f:a=>1/Math.tan(a)},sec:{tex:a=>`\\sec ${a}`,expr:a=>`sec(${a})`,f:a=>1/Math.cos(a)},csc:{tex:a=>`\\csc ${a}`,expr:a=>`csc(${a})`,f:a=>1/Math.sin(a)}};
const argTex=(k,v)=>k===1?v:`(${k}${v})`;
function tTrig(c,fn,k=1){
 c=U.asQ(c);const T=TRIG[fn],A=ANTI[T.anti],aq=qmul(c,Q(T.sgn,k));
 return{
  kind:'trig',fn,k,c,
  itex:(V,first)=>termTex(c,T.tex(argTex(k,V.v)),first),iexpr:`${qexpr(c)}*${T.expr(`${k}*x`)}`,f:x=>qv(c)*T.f(k*x),
  atex:(V,first)=>termTex(aq,A.tex(argTex(k,V.v)),first),aexpr:`${qexpr(aq)}*${A.expr(`${k}*x`)}`,af:x=>qv(aq)*A.f(k*x),
  aAt:x0=>{const angle=x0.qpi?qmul(x0.qpi,Q(k)):(x0.q&&qzero(x0.q)?Q(0):null);if(!angle)return null;const v=trigExact(T.anti,angle);if(v===undefined)return undefined;return v?escale(v,aq):null;},
  bounds:(x0,V)=>{
   if(!T.zero)return ALL();
   // zeros of cos(kv): (2j+1)π/(2k); zeros of sin(kv): jπ/k
   const step=Q(1,k),offset=T.zero==='cos'?Q(1,2*k):Q(0);const t=(x0.val/Math.PI-qv(offset))/qv(step);const j=Math.floor(t+1e-12);
   const lo=qadd(offset,qmul(Q(j),step)),hi=qadd(lo,step);
   if(Math.abs(qv(lo)*Math.PI-x0.val)<1e-12)return null;
   const name=fn==='sec2'||fn==='sectan'?'\\cos':'\\sin';
   return{lo:{x:xPi(lo),closed:false},hi:{x:xPi(hi),closed:false},why:`${m(T.tex(argTex(k,V.v)))} is undefined where ${m(`${name} ${argTex(k,V.v)}=0`)}`};
  },
 };
}
// inverse trig
function tAtan(c,a){ // c/(a^2+v^2) -> (c/a) atan(v/a)
 c=U.asQ(c);const aq=qdiv(c,Q(a));
 const arg=V=>a===1?V.v:`\\frac{${V.v}}{${a}}`;
 return{kind:'atan',a,c,
  itex:(V,first)=>{const den=`${a*a}+${V.v}^{2}`;const s=c.n<0?'-':'',body=c.d===1?`\\frac{${Math.abs(c.n)}}{${den}}`:`\\frac{${Math.abs(c.n)}}{${c.d}\\left(${den}\\right)}`;return first?s+body:(s?' - ':' + ')+body;},
  iexpr:`${qexpr(c)}/(${a*a}+x^2)`,f:x=>qv(c)/(a*a+x*x),
  atex:(V,first)=>termTex(aq,a===1?`\\tan^{-1}${V.v}`:`\\tan^{-1}\\left(${arg(V)}\\right)`,first),aexpr:`${qexpr(aq)}*atan(x/${a})`,af:x=>qv(aq)*Math.atan(x/a),
  aAt:x0=>{if(!x0.q)return null;const r=qdiv(x0.q,Q(a));if(qzero(r))return E();if(qeq1(r))return escale(ex(Q(1,4),K.pi),aq);if(qeq1(qneg(r)))return escale(ex(Q(-1,4),K.pi),aq);return null;},
  bounds:()=>ALL()};
}
const qeq1=q=>q.n===1&&q.d===1;
function tAsin(c,a){ // c/sqrt(a^2-v^2) -> c asin(v/a), (-a, a)
 c=U.asQ(c);
 const arg=V=>a===1?V.v:`\\frac{${V.v}}{${a}}`;
 return{kind:'asin',a,c,
  itex:(V,first)=>{const den=`\\sqrt{${a===1?1:a*a}-${V.v}^{2}}`;const s=c.n<0?'-':'',body=c.d===1?`\\frac{${Math.abs(c.n)}}{${den}}`:`\\frac{${Math.abs(c.n)}}{${c.d}${den}}`;return first?s+body:(s?' - ':' + ')+body;},
  iexpr:`${qexpr(c)}/sqrt(${a*a}-x^2)`,f:x=>qv(c)/Math.sqrt(a*a-x*x),
  atex:(V,first)=>termTex(c,a===1?`\\sin^{-1}${V.v}`:`\\sin^{-1}\\left(${arg(V)}\\right)`,first),aexpr:`${qexpr(c)}*asin(x/${a})`,af:x=>qv(c)*Math.asin(x/a),
  aAt:x0=>{if(!x0.q)return null;const r=qdiv(x0.q,Q(a));if(qzero(r))return E();if(r.n===1&&r.d===2)return escale(ex(Q(1,6),K.pi),c);if(r.n===-1&&r.d===2)return escale(ex(Q(-1,6),K.pi),c);return null;},
  bounds:(x0,V)=>({lo:{x:xRat(-a),closed:false},hi:{x:xRat(a),closed:false},why:`${m(`\\sqrt{${a*a}-${V.v}^{2}}`)} must be positive (it is a denominator), so ${m(`-${a}<${V.v}<${a}`)}`})};
}
function tAsinSq(c){ // c·2v/sqrt(1-v^4) -> c asin(v^2), (-1,1)
 c=U.asQ(c);const c2=qmul(c,Q(2));
 return{kind:'asinsq',c,
  itex:(V,first)=>{const num=c2.d===1?(Math.abs(c2.n)===1?V.v:`${Math.abs(c2.n)}${V.v}`):`${Math.abs(c2.n)}${V.v}`;const den=c2.d===1?`\\sqrt{1-${V.v}^{4}}`:`${c2.d}\\sqrt{1-${V.v}^{4}}`;const s=c2.n<0?'-':'',body=`\\frac{${num}}{${den}}`;return first?s+body:(s?' - ':' + ')+body;},
  iexpr:`${qexpr(c2)}*x/sqrt(1-x^4)`,f:x=>qv(c2)*x/Math.sqrt(1-x**4),
  atex:(V,first)=>termTex(c,`\\sin^{-1}\\left(${V.v}^{2}\\right)`,first),aexpr:`${qexpr(c)}*asin(x^2)`,af:x=>qv(c)*Math.asin(x*x),
  aAt:x0=>{if(x0.q&&qzero(x0.q))return E();if(x0.invsqrt2)return escale(ex(Q(1,6),K.pi),c);return null;},
  bounds:(x0,V)=>({lo:{x:xRat(-1),closed:false},hi:{x:xRat(1),closed:false},why:`${m(`\\sqrt{1-${V.v}^{4}}`)} is a denominator, so ${m(`1-${V.v}^{4}>0`)}, which means ${m(`-1<${V.v}<1`)}`}),
  note:V=>`For ${m(`\\frac{2${V.v}}{\\sqrt{1-${V.v}^{4}}}`)}, let ${m(`u=${V.v}^{2}`)}, so ${m(`du=2${V.v}\\,d${V.v}`)} and the integral becomes ${m(`\\int\\frac{du}{\\sqrt{1-u^{2}}}=\\sin^{-1}u`)}.`};
}
// exponentials and compositions
function tExp(c,k){ // c e^{kv} -> (c/k) e^{kv}
 c=U.asQ(c);const aq=qdiv(c,Q(k));const etx=V=>k===1?`e^{${V.v}}`:k===-1?`e^{-${V.v}}`:`e^{${k}${V.v}}`;
 return{kind:'exp',k,c,
  itex:(V,first)=>termTex(c,etx(V),first),iexpr:`${qexpr(c)}*e^(${k}*x)`,f:x=>qv(c)*Math.exp(k*x),
  atex:(V,first)=>termTex(aq,etx(V),first),aexpr:`${qexpr(aq)}*e^(${k}*x)`,af:x=>qv(aq)*Math.exp(k*x),
  aAt:x0=>{if(!x0.q||x0.q.d!==1)return null;if(qzero(x0.q))return ex(aq);return ex(aq,U.expAtom(Q(k*x0.q.n)));},
  bounds:()=>ALL()};
}
function tExpBase(c,b){ // c·b^v -> c b^v / ln b
 c=U.asQ(c);const lnb=U.atom(`1/ln${b}`,`\\frac{1}{\\ln ${b}}`,`(1/ln(${b}))`,1/Math.log(b));
 return{kind:'expb',b,c,
  itex:(V,first)=>{const a=Math.abs(c.n),s=c.n<0?(first?'-':' - '):(first?'':' + ');return s+(a===1&&c.d===1?`${b}^{${V.v}}`:`${c.d===1?a:`\\frac{${a}}{${c.d}}`}\\cdot ${b}^{${V.v}}`);},iexpr:`${qexpr(c)}*${b}^x`,f:x=>qv(c)*b**x,
  atex:(V,first)=>{const s=c.n<0?'-':'',a=Math.abs(c.n),num=a===1&&c.d===1?`${b}^{${V.v}}`:`${a}\\cdot ${b}^{${V.v}}`,den=c.d===1?`\\ln ${b}`:`${c.d}\\ln ${b}`,body=`\\frac{${num}}{${den}}`;return first?s+body:(s?' - ':' + ')+body;},
  aexpr:`${qexpr(c)}*${b}^x/ln(${b})`,af:x=>qv(c)*b**x/Math.log(b),
  aAt:x0=>{if(!x0.q||x0.q.d!==1||x0.q.n<0||x0.q.n>2)return null;return ex(qmul(c,Q(b**x0.q.n)),lnb);},
  bounds:()=>ALL(),
  note:V=>`${m(`\\int ${b}^{${V.v}}\\,d${V.v}=\\frac{${b}^{${V.v}}}{\\ln ${b}}+C`)} because ${m(`\\frac{d}{d${V.v}}\\,${b}^{${V.v}}=${b}^{${V.v}}\\ln ${b}`)}.`};
}
function tComp(kind,c){
 c=U.asQ(c);
 const T={
  esin:{i:V=>`\\cos ${V.v}\\,e^{\\sin ${V.v}}`,ie:'cos(x)*e^(sin(x))',f:x=>Math.cos(x)*Math.exp(Math.sin(x)),a:V=>`e^{\\sin ${V.v}}`,ae:'e^(sin(x))',af:x=>Math.exp(Math.sin(x)),k:Q(1),u:V=>`u=\\sin ${V.v}`,du:V=>`du=\\cos ${V.v}\\,d${V.v}`,at:x0=>x0.qpi?(()=>{const s=trigExact('sin',x0.qpi);if(!s)return null;if(Math.abs(evE(s))<1e-12)return ex(1);if(Math.abs(evE(s)-1)<1e-12)return ex(1,K.e);if(Math.abs(evE(s)+1)<1e-12)return ex(1,U.expAtom(Q(-1)));return null;})():(x0.q&&qzero(x0.q)?ex(1):null)},
  ecos:{i:V=>`\\sin ${V.v}\\,e^{\\cos ${V.v}}`,ie:'sin(x)*e^(cos(x))',f:x=>Math.sin(x)*Math.exp(Math.cos(x)),a:V=>`e^{\\cos ${V.v}}`,ae:'e^(cos(x))',af:x=>Math.exp(Math.cos(x)),k:Q(-1),u:V=>`u=\\cos ${V.v}`,du:V=>`du=-\\sin ${V.v}\\,d${V.v}`,at:x0=>x0.qpi?(()=>{const s=trigExact('cos',x0.qpi);if(!s)return null;if(Math.abs(evE(s))<1e-12)return ex(1);if(Math.abs(evE(s)-1)<1e-12)return ex(1,K.e);if(Math.abs(evE(s)+1)<1e-12)return ex(1,U.expAtom(Q(-1)));return null;})():(x0.q&&qzero(x0.q)?ex(1,K.e):null)},
  esq:{i:V=>`${V.v}e^{${V.v}^{2}}`,ie:'x*e^(x^2)',f:x=>x*Math.exp(x*x),a:V=>`e^{${V.v}^{2}}`,ae:'e^(x^2)',af:x=>Math.exp(x*x),k:Q(1,2),u:V=>`u=${V.v}^{2}`,du:V=>`du=2${V.v}\\,d${V.v}`,at:x0=>x0.q&&x0.q.d===1&&Math.abs(x0.q.n)<=1?(x0.q.n===0?ex(1):ex(1,K.e)):null},
  cossq:{i:V=>`${V.v}\\cos\\left(${V.v}^{2}\\right)`,ie:'x*cos(x^2)',f:x=>x*Math.cos(x*x),a:V=>`\\sin\\left(${V.v}^{2}\\right)`,ae:'sin(x^2)',af:x=>Math.sin(x*x),k:Q(1,2),u:V=>`u=${V.v}^{2}`,du:V=>`du=2${V.v}\\,d${V.v}`,at:x0=>x0.q&&qzero(x0.q)?E():null},
  sinsq:{i:V=>`${V.v}\\sin\\left(${V.v}^{2}\\right)`,ie:'x*sin(x^2)',f:x=>x*Math.sin(x*x),a:V=>`\\cos\\left(${V.v}^{2}\\right)`,ae:'cos(x^2)',af:x=>Math.cos(x*x),k:Q(-1,2),u:V=>`u=${V.v}^{2}`,du:V=>`du=2${V.v}\\,d${V.v}`,at:x0=>x0.q&&qzero(x0.q)?ex(1):null},
  ecube:{i:V=>`${V.v}^{2}e^{${V.v}^{3}}`,ie:'x^2*e^(x^3)',f:x=>x*x*Math.exp(x**3),a:V=>`e^{${V.v}^{3}}`,ae:'e^(x^3)',af:x=>Math.exp(x**3),k:Q(1,3),u:V=>`u=${V.v}^{3}`,du:V=>`du=3${V.v}^{2}\\,d${V.v}`,at:x0=>x0.q&&x0.q.d===1&&Math.abs(x0.q.n)<=1?(x0.q.n===0?ex(1):x0.q.n===1?ex(1,K.e):ex(1,U.expAtom(Q(-1)))):null},
 }[kind];
 const aq=qmul(c,T.k);
 return{kind:'comp_'+kind,c,
  itex:(V,first)=>termTex(c,T.i(V),first),iexpr:`${qexpr(c)}*${T.ie}`,f:x=>qv(c)*T.f(x),
  atex:(V,first)=>termTex(aq,T.a(V),first),aexpr:`${qexpr(aq)}*${T.ae}`,af:x=>qv(aq)*T.af(x),
  aAt:x0=>{const v=T.at(x0);return v?escale(v,aq):v;},bounds:()=>ALL(),
  note:V=>`For ${m(T.i(V))}, let ${m(T.u(V))}, so ${m(T.du(V))}.`};
}
function tPowComp(c,a,n){ // c·v(v^2+a)^n -> c/(2(n+1)) (v^2+a)^{n+1}, n in {1,2,1/2}
 c=U.asQ(c);n=U.asQ(n);const n1=qadd(n,Q(1)),aq=qdiv(c,qmul(Q(2),n1));
 const inner=V=>`${V.v}^{2}+${a}`,pw=(V,p)=>p.d===2&&p.n===1?`\\sqrt{${inner(V)}}`:p.d===1?`\\left(${inner(V)}\\right)^{${p.n}}`:`\\left(${inner(V)}\\right)^{\\frac{${p.n}}{${p.d}}}`;
 return{kind:'powcomp',c,
  itex:(V,first)=>termTex(c,`${V.v}${pw(V,n)}`,first),iexpr:`${qexpr(c)}*x*(x^2+${a})^(${n.n}/${n.d})`,f:x=>qv(c)*x*Math.pow(x*x+a,qv(n)),
  atex:(V,first)=>termTex(aq,pw(V,n1),first),aexpr:`${qexpr(aq)}*(x^2+${a})^(${n1.n}/${n1.d})`,af:x=>qv(aq)*Math.pow(x*x+a,qv(n1)),
  aAt:x0=>{if(!x0.q||x0.q.d!==1)return null;const base=x0.q.n**2+a;if(n1.d===1)return ex(qmul(aq,Q(base**n1.n)));const r=Math.round(Math.sqrt(base));if(r*r!==base)return null;return ex(qmul(aq,Q(r**n1.n)));},
  bounds:()=>ALL(),note:V=>`For ${m(`${V.v}${pw(V,n)}`)}, let ${m(`u=${inner(V)}`)}, so ${m(`du=2${V.v}\\,d${V.v}`)}.`};
}
// logarithmic and domain-restricted terms
function tRecip(c,k,b){ // c/(k v + b) -> (c/k) ln|k v + b|, boundary -b/k
 c=U.asQ(c);const aq=qdiv(c,Q(k));const lin=V=>`${k===1?'':k}${V.v}${b>0?` + ${b}`:b<0?` - ${-b}`:''}`;
 const root=Q(-b,k);
 return{kind:'recip',c,k,b,
  itex:(V,first)=>{const s=c.n<0?'-':'',a=Math.abs(c.n),body=c.d===1?`\\frac{${a}}{${lin(V)}}`:`\\frac{${a}}{${c.d}\\left(${lin(V)}\\right)}`;return first?s+body:(s?' - ':' + ')+body;},
  iexpr:`${qexpr(c)}/(${k}*x+(${b}))`,f:x=>qv(c)/(k*x+b),
  atex:(V,first)=>termTex(aq,`\\ln\\left|${lin(V)}\\right|`,first),aexpr:`${qexpr(aq)}*ln(abs(${k}*x+(${b})))`,af:x=>qv(aq)*Math.log(Math.abs(k*x+b)),
  aAt:x0=>{if(!x0.q)return null;const w=qadd(qmul(Q(k),x0.q),Q(b));if(qzero(w))return undefined;if(w.d!==1)return null;const a=Math.abs(w.n);if(a===1)return E();return ex(aq,U.lnAtom(a));},
  bounds:(x0,V)=>{const r=qv(root);const why=`${m(`\\frac{1}{${lin(V)}}`)} is undefined at ${m(`${V.v}=${qtex(root)}`)}`;return x0.val>r?{lo:{x:xRat(root),closed:false},hi:{x:INF,closed:false},why}:{lo:{x:NINF,closed:false},hi:{x:xRat(root),closed:false},why};},
  note:V=>`${m(`\\int\\frac{d${V.v}}{${lin(V)}}=${k===1?'':`\\frac{1}{${k}}`}\\ln\\left|${lin(V)}\\right|+C`)}${k===1?'':` (the ${m(`\\frac{1}{${k}}`)} undoes the chain-rule factor ${k})`}.`};
}
function tQuadLog(c,a){ // c·2v/(v^2+a) -> c ln(v^2+a)
 c=U.asQ(c);const c2=qmul(c,Q(2));
 return{kind:'quadlog',c,
  itex:(V,first)=>{const s=c2.n<0?'-':'',A=Math.abs(c2.n),num=A===1?V.v:`${A}${V.v}`,den=c2.d===1?`${V.v}^{2}+${a}`:`${c2.d}\\left(${V.v}^{2}+${a}\\right)`,body=`\\frac{${num}}{${den}}`;return first?s+body:(s?' - ':' + ')+body;},
  iexpr:`${qexpr(c2)}*x/(x^2+${a})`,f:x=>qv(c2)*x/(x*x+a),
  atex:(V,first)=>termTex(c,`\\ln\\left(${V.v}^{2}+${a}\\right)`,first),aexpr:`${qexpr(c)}*ln(x^2+${a})`,af:x=>qv(c)*Math.log(x*x+a),
  aAt:x0=>{if(!x0.q||x0.q.d!==1)return null;const w=x0.q.n**2+a;return w===1?E():ex(c,U.lnAtom(w));},
  bounds:()=>ALL(),note:V=>`For ${m(`\\frac{2${V.v}}{${V.v}^{2}+${a}}`)}, let ${m(`u=${V.v}^{2}+${a}`)}, so ${m(`du=2${V.v}\\,d${V.v}`)}; since ${m(`${V.v}^{2}+${a}>0`)}, no absolute value is needed.`};
}
function tTan(c){ // c tan v -> -c ln|cos v|
 c=U.asQ(c);const aq=qneg(c);
 return{kind:'tan',c,
  itex:(V,first)=>termTex(c,`\\tan ${V.v}`,first),iexpr:`${qexpr(c)}*tan(x)`,f:x=>qv(c)*Math.tan(x),
  atex:(V,first)=>termTex(aq,`\\ln\\left|\\cos ${V.v}\\right|`,first),aexpr:`${qexpr(aq)}*ln(abs(cos(x)))`,af:x=>qv(aq)*Math.log(Math.abs(Math.cos(x))),
  aAt:x0=>{const q=x0.qpi||(x0.q&&qzero(x0.q)?Q(0):null);if(!q)return null;const cv=trigExact('cos',q);if(cv===undefined)return null;const v=Math.abs(evE(cv||E()));if(Math.abs(v-1)<1e-12)return E();if(Math.abs(v-0.5)<1e-12)return escale(ex(-1,K.ln2),aq);if(Math.abs(v-Math.SQRT1_2)<1e-12)return escale(ex(Q(-1,2),K.ln2),aq);return null;},
  bounds:(x0,V)=>{const j=Math.floor(x0.val/Math.PI+0.5);const lo=Q(2*j-1,2),hi=Q(2*j+1,2);return{lo:{x:xPi(lo),closed:false},hi:{x:xPi(hi),closed:false},why:`${m(`\\tan ${V.v}`)} is undefined where ${m(`\\cos ${V.v}=0`)}`};},
  note:V=>`${m(`\\int\\tan ${V.v}\\,d${V.v}=\\int\\frac{\\sin ${V.v}}{\\cos ${V.v}}\\,d${V.v}`)}; with ${m(`u=\\cos ${V.v}`)}, ${m(`du=-\\sin ${V.v}\\,d${V.v}`)}, this is ${m(`-\\ln\\left|\\cos ${V.v}\\right|+C`)}.`};
}
function tXlnx(c){ // c/(v ln v) -> c ln|ln v|, v > 0, v ≠ 1
 c=U.asQ(c);
 return{kind:'xlnx',c,
  itex:(V,first)=>{const s=c.n<0?'-':'',a=Math.abs(c.n),body=c.d===1?`\\frac{${a}}{${V.v}\\ln ${V.v}}`:`\\frac{${a}}{${c.d}${V.v}\\ln ${V.v}}`;return first?s+body:(s?' - ':' + ')+body;},
  iexpr:`${qexpr(c)}/(x*ln(x))`,f:x=>qv(c)/(x*Math.log(x)),
  atex:(V,first)=>termTex(c,`\\ln\\left|\\ln ${V.v}\\right|`,first),aexpr:`${qexpr(c)}*ln(abs(ln(x)))`,af:x=>qv(c)*Math.log(Math.abs(Math.log(x))),
  aAt:x0=>{if(x0.ek===undefined)return null;const a=Math.abs(x0.ek);return a===1?E():ex(c,U.lnAtom(a));},
  bounds:(x0,V)=>x0.val>1?{lo:{x:xRat(1),closed:false},hi:{x:INF,closed:false},why:`${m(`\\ln ${V.v}`)} requires ${m(`${V.v}>0`)}, and ${m(`\\frac{1}{${V.v}\\ln ${V.v}}`)} is undefined at ${m(`${V.v}=1`)} where ${m(`\\ln ${V.v}=0`)}`}:{lo:{x:xRat(0),closed:false},hi:{x:xRat(1),closed:false},why:`${m(`\\ln ${V.v}`)} requires ${m(`${V.v}>0`)}, and ${m(`\\frac{1}{${V.v}\\ln ${V.v}}`)} is undefined at ${m(`${V.v}=1`)} where ${m(`\\ln ${V.v}=0`)}`},
  note:V=>`For ${m(`\\frac{1}{${V.v}\\ln ${V.v}}`)}, let ${m(`u=\\ln ${V.v}`)}, so ${m(`du=\\frac{1}{${V.v}}\\,d${V.v}`)} and the integral becomes ${m(`\\int\\frac{du}{u}=\\ln|u|`)}.`};
}
function tExpLog(c,a){ // c e^v/(e^v+a) -> c ln(e^v + a)
 c=U.asQ(c);
 return{kind:'explog',c,
  itex:(V,first)=>{const s=c.n<0?'-':'',A=Math.abs(c.n),num=A===1&&c.d===1?`e^{${V.v}}`:`${A}e^{${V.v}}`,den=c.d===1?`e^{${V.v}}+${a}`:`${c.d}\\left(e^{${V.v}}+${a}\\right)`;const body=`\\frac{${num}}{${den}}`;return first?s+body:(s?' - ':' + ')+body;},
  iexpr:`${qexpr(c)}*e^x/(e^x+${a})`,f:x=>qv(c)*Math.exp(x)/(Math.exp(x)+a),
  atex:(V,first)=>termTex(c,`\\ln\\left(e^{${V.v}}+${a}\\right)`,first),aexpr:`${qexpr(c)}*ln(e^x+${a})`,af:x=>qv(c)*Math.log(Math.exp(x)+a),
  aAt:x0=>x0.q&&qzero(x0.q)?ex(c,U.lnAtom(1+a)):null,bounds:()=>ALL(),
  note:V=>`For ${m(`\\frac{e^{${V.v}}}{e^{${V.v}}+${a}}`)}, let ${m(`u=e^{${V.v}}+${a}`)}, so ${m(`du=e^{${V.v}}\\,d${V.v}`)}; ${m(`u>0`)} always.`};
}
function tShiftRoot(c,a,half){ // half: c sqrt(v-a) -> (2c/3)(v-a)^(3/2) on [a,inf); else c/sqrt(v-a) -> 2c sqrt(v-a) on (a,inf)
 c=U.asQ(c);const inner=V=>`${V.v}${a>0?` - ${a}`:` + ${-a}`}`;
 const aq=half?qmul(c,Q(2,3)):qmul(c,Q(2));
 return{kind:half?'sqrtshift':'invsqrtshift',c,
  itex:(V,first)=>half?termTex(c,`\\sqrt{${inner(V)}}`,first):(()=>{const s=c.n<0?'-':'',A=Math.abs(c.n),body=c.d===1?`\\frac{${A}}{\\sqrt{${inner(V)}}}`:`\\frac{${A}}{${c.d}\\sqrt{${inner(V)}}}`;return first?s+body:(s?' - ':' + ')+body;})(),
  iexpr:half?`${qexpr(c)}*sqrt(x-(${a}))`:`${qexpr(c)}/sqrt(x-(${a}))`,f:x=>half?qv(c)*Math.sqrt(x-a):qv(c)/Math.sqrt(x-a),
  atex:(V,first)=>termTex(aq,half?`\\left(${inner(V)}\\right)^{\\frac{3}{2}}`:`\\sqrt{${inner(V)}}`,first),aexpr:half?`${qexpr(aq)}*(x-(${a}))^(3/2)`:`${qexpr(aq)}*sqrt(x-(${a}))`,af:x=>qv(aq)*(half?Math.pow(x-a,1.5):Math.sqrt(x-a)),
  aAt:x0=>{if(!x0.q||x0.q.d!==1)return null;const w=x0.q.n-a;if(w<0)return undefined;const r=Math.round(Math.sqrt(w));if(r*r!==w)return null;return ex(qmul(aq,Q(half?r**3:r)));},
  bounds:(x0,V)=>half?{lo:{x:xRat(a),closed:true},hi:{x:INF,closed:false},why:`${m(`\\sqrt{${inner(V)}}`)} requires ${m(`${V.v}\\ge ${a}`)}; at ${m(`${V.v}=${a}`)} the equation and the solution are both defined`}:{lo:{x:xRat(a),closed:false},hi:{x:INF,closed:false},why:`${m(`\\frac{1}{\\sqrt{${inner(V)}}}`)} requires ${m(`${V.v}>${a}`)}`},
  note:null};
}

// ---------- assembling an IVP ----------
function ivpFromTerms(o){
 const {V,terms,x0,tier,family,includeInterval,display,idTag}=o;
 // exact antiderivative at x0
 let F0=E();for(const t of terms){const v=t.aAt(x0);if(v===null||v===undefined)throw Error('x0 not exact');F0=eadd(F0,v);}
 const y0=o.y0??pick([-6,-5,-4,-3,-2,-1,1,2,3,4,5,6,7,8,9]);
 const Cval=esub(ex(y0),F0);
 // interval of validity: intersection of every term's domain piece containing x0
 let lo={x:NINF,closed:false},hi={x:INF,closed:false};const why=[];
 for(const t of terms){const b=t.bounds(x0,V);if(b===null)throw Error('x0 at a boundary');if(b.why&&!why.includes(b.why))why.push(b.why);
  if(b.lo.x.val>lo.x.val||(b.lo.x.val===lo.x.val&&!b.lo.closed))lo=b.lo;if(b.hi.x.val<hi.x.val||(b.hi.x.val===hi.x.val&&!b.hi.closed))hi=b.hi;}
 if(!(lo.x.val<x0.val&&x0.val<hi.x.val)&&!(lo.closed&&lo.x.val===x0.val))throw Error('x0 outside');
 const restricted=Number.isFinite(lo.x.val)||Number.isFinite(hi.x.val);
 // texts
 const rhs=display?.rhsTex||terms.map((t,i)=>t.itex(V,i===0)).join('');
 const anti=terms.map((t,i)=>t.atex(V,i===0)).join('');
 const solution=U.sum(terms.map(t=>({q:Q(1),tex:'',expr:t.aexpr,f:t.af})),Cval);
 const solTex=`${anti}${ezeroTex(Cval)}`;
 const exprStr=`${terms.map(t=>`(${t.aexpr})`).join('+')}+(${eexpr(Cval)})`;
 const fx=x=>terms.reduce((s,t)=>s+t.af(x),0)+evE(Cval),fprime=x=>terms.reduce((s,t)=>s+t.f(x),0);
 // self-check: derivative and initial condition
 selfCheck(fx,fprime,x0,y0,lo.x.val,hi.x.val);
 const icTex=pick([0,1])?`${V.dep}(${x0.tex})=${y0}`:`${V.dep}=${y0}\\text{ when }${V.v}=${x0.tex}`;
 const formulas=[`${V.d}=${rhs}`,icTex];
 // explanation, part A
 const notes=terms.map(t=>typeof t.note==='function'?t.note(V):null).filter(Boolean);
 const steps=[];
 if(display?.splitTex)steps.push(step('Split the fraction.','Divide each term of the numerator by the denominator.',`${display.splitFrom}=${display.splitTex}`));
 steps.push(step('Integrate both sides.',`${notes.join(' ')}${notes.length?' ':''}Antidifferentiate each term and add the constant of integration.`,`${V.dep}=\\int\\left(${display?.splitTex||rhs}\\right)d${V.v}=${anti}+C`));
 const F0tex=etex(F0),subV={...V,v:`(${x0.tex})`},subTex=terms.map((t,i)=>t.atex(subV,i===0)).join('').replace(/\{\(([^(){}]*)\)\}/g,'{$1}');
 const cLine=U.erational(F0)?`C=${y0}${F0tex.startsWith('-')?` + ${F0tex.slice(1)}`:` - ${F0tex==='0'?'0':F0tex}`}=${etex(Cval)}`:`C=${etex(Cval,{lead:'first'})}`;
 steps.push(step('Use the initial condition.',`Substitute ${m(`${V.v}=${x0.tex}`)} and ${m(`${V.dep}=${y0}`)} into the general solution, then solve for ${m('C')}.`,`${y0}=${subTex}+C=${F0tex} + C`,F0tex==='0'?`C=${etex(Cval)}`:cLine));
 steps.push(step('Write the particular solution.','',`${V.dep}=${solTex}`));
 const partA={prompt:`Find the particular solution ${m(`${V.dep}`)} as a function of ${m(V.v)}.`,control:'input',prefix:`${V.dep}=`,
  answer:{kind:'ivp',variable:V.v,expression:exprStr,interval:[lo.x.val,hi.x.val],x0:x0.val,x0Tex:x0.tex,y0,ode:(x)=>fprime(x)},
  answerTex:`${V.dep}=${solTex}`,explanation:steps.join(''),keypadMode:V.keypad,placeholder:`Enter ${V.dep} in terms of ${V.v}`};
 const parts=[partA];
 if(includeInterval){
  const iv=intervalTex(lo,hi);
  const bsteps=[],reasons=display?.why?[display.why]:mergeWhy(why);
  if(restricted)bsteps.push(step('Find where the equation and the solution are defined.',reasons.map(w=>w[0].toUpperCase()+w.slice(1)).join('. ')+'.'));
  else bsteps.push(step('Find where the equation and the solution are defined.',`Every term of the differential equation and of the solution is defined for all real ${m(V.v)}.`));
  const ends=[Number.isFinite(lo.x.val)?m(`${V.v}=${lo.x.tex}`):null,Number.isFinite(hi.x.val)?m(`${V.v}=${hi.x.tex}`):null].filter(Boolean);
  const nearest=ends.length===2?` The closest excluded values on either side of ${m(`${V.v}=${x0.tex}`)} are ${ends[0]} and ${ends[1]}.`:'';
  const closedNote=lo.closed||hi.closed?` The endpoint ${m(`${V.v}=${(lo.closed?lo:hi).x.tex}`)} is included because the equation and the solution are both defined there.`:'';
  bsteps.push(step(restricted?'Keep the interval that contains the initial value.':'There are no restrictions.',restricted?`${nearest.trim()}${nearest?' ':''}The solution is valid on the single interval that contains ${m(`${V.v}=${x0.tex}`)}.${closedNote}`:`The solution is valid for every real ${m(V.v)}.`,iv));
  parts.push({prompt:'State the interval of validity of this solution.',control:'input',
   answer:{kind:'interval',validity:true,variable:V.v,x0:x0.val,x0Tex:x0.tex,left:endExpr(lo.x),right:endExpr(hi.x),lc:lo.closed,rc:hi.closed},
   answerTex:iv,explanation:bsteps.join(''),keypadMode:'unit5-interval-basic',placeholder:'Enter an interval, e.g. (0, ∞)'});
 }
 return problem({engine:'basic',family,tier,id:`${family}-${idTag}-${x0.tex}-${y0}`.replace(/[^a-z0-9_-]/gi,''),
  questionHtml:question({prompt:includeInterval?'Solve the initial-value problem, then state its interval of validity.':'Solve the initial-value problem.',formulas,calculator:false}),
  parts,calculator:false,data:{restricted,interval:includeInterval}});
}
// "A is undefined at x=0" + "B is undefined at x=0" -> "A and B are undefined at x=0"
function mergeWhy(list){
 const out=[],tails=new Map();
 for(const w of list){const k=w.indexOf(' is undefined at ');if(k<0){out.push(w);continue;}const head=w.slice(0,k),tail=w.slice(k+' is undefined at '.length);if(!tails.has(tail)){tails.set(tail,[]);out.push({tail});}tails.get(tail).push(head);}
 return out.map(o=>typeof o==='string'?o:(()=>{const h=tails.get(o.tail);return h.length===1?`${h[0]} is undefined at ${o.tail}`:`${h.slice(0,-1).join(', ')} and ${h[h.length-1]} are undefined at ${o.tail}`;})());
}
const ezeroTex=c=>{if(U.ezero(c))return '';const t=etex(c,{lead:'first'});return t.startsWith('-')?` - ${t.slice(1)}`:` + ${t}`;};
const endExpr=x=>x.val===Infinity?'infinity':x.val===-Infinity?'-infinity':eexpr(x.exact);
function intervalTex(lo,hi){return `\\left${lo.closed?'[':'('}${lo.x.tex},\\,${hi.x.tex}\\right${hi.closed?']':')'}`;}
function selfCheck(f,fp,x0,y0,a,b){
 if(Math.abs(f(x0.val)-y0)>1e-9*Math.max(1,Math.abs(y0)))throw Error('IC self-check');
 const lo=Number.isFinite(a)?a:x0.val-5,hi=Number.isFinite(b)?b:x0.val+5;
 for(let k=1;k<12;k++){const x=lo+(hi-lo)*k/12,h=1e-6*Math.max(1,Math.abs(x)),d=(f(x+h)-f(x-h))/(2*h),want=fp(x);if(Number.isFinite(want)&&Math.abs(want)<1e6&&Math.abs(d-want)>1e-4*Math.max(1,Math.abs(want)))throw Error(`ODE self-check at ${x}`);}
}

// ---------- families ----------
const coef=(lo=-6,hi=6)=>nz(lo,hi);
function famPoly(tier){
 const V=vars(tier);
 if(tier==='foundational'){
  const n1=ri(1,3),terms=[tPow(coef()*(n1+1)/gcdNice(n1+1),n1),tPow(coef(),0)];if(U.rand()<0.5)terms.splice(1,0,tPow(coef(-5,5)*1,ri(0,1)===0?1:0));
  const clean=dedupe(terms),x0=xRat(pick([0,0,1,-1,2]));
  return ivpFromTerms({V,terms:clean,x0,tier,family:'poly_power',includeInterval:U.rand()<0.3,idTag:clean.map(t=>`${t.n.n}_${t.c.n}`).join('_')});
 }
 if(tier==='intermediate'){
  const kind=pick(['negpow','sqrt','cbrt']);
  if(kind==='negpow'){const n=pick([-2,-3]),terms=[tPow(nz(-4,4)*(-n-1),n),tPow(coef(),pick([0,1,2]))];if(U.rand()<0.5)terms.push(tPow(nz(-3,3)*3,-4));const x0=xRat(pick([1,1,2,-1,-2]));
   return ivpFromTerms({V,terms:dedupe(terms),x0,tier,family:'poly_power',includeInterval:true,idTag:`neg${n}`});}
  if(kind==='sqrt'){const terms=[tPow(3*nz(-3,3),Q(1,2)),tPow(coef(),pick([0,1]))];const x0=xRat(pick([0,1,4,9]));
   return ivpFromTerms({V,terms:dedupe(terms),x0,tier,family:'poly_power',includeInterval:true,idTag:'sqrt'});}
  const terms=[tPow(4*nz(-3,3),Q(1,3)),tPow(coef(),pick([0,2]))];const x0=xRat(pick([0,1,-1,8,-8]));
  return ivpFromTerms({V,terms:dedupe(terms),x0,tier,family:'poly_power',includeInterval:U.rand()<0.5,idTag:'cbrt'});
 }
 // challenging: (a v + b)/sqrt(v) split, or several negative powers like the homework
 if(U.rand()<0.55){
  const a=3*nz(-3,3),b=nz(-6,6);const terms=[tPow(a,Q(1,2)),tPow(b,Q(-1,2))];const x0=xRat(pick([1,4,9]));
  const num=`${a}${V.v}${b>0?` + ${b}`:` - ${-b}`}`;
  return ivpFromTerms({V,terms,x0,tier,family:'poly_power',includeInterval:true,idTag:`split${a}_${b}`,
   display:{rhsTex:`\\frac{${num}}{\\sqrt{${V.v}}}`,splitFrom:`\\frac{${num}}{\\sqrt{${V.v}}}`,splitTex:`${termTex(Q(a),`${V.v}^{\\frac{1}{2}}`,true)}${termTex(Q(b),`${V.v}^{-\\frac{1}{2}}`)}`,
    why:`the equation has ${m(`\\sqrt{${V.v}}`)} in a denominator, so it requires ${m(`${V.v}>0`)}`}});
 }
 const terms=[tPow(-nz(1,4),-2),tPow(-3*nz(1,3),-4),tPow(coef(2,12),0)];const x0=xRat(pick([1,-1]));
 return ivpFromTerms({V,terms,x0,tier,family:'poly_power',includeInterval:true,idTag:'negpows'});
}
const gcdNice=n=>1;
function dedupe(terms){const seen=new Set();return terms.filter(t=>{const k=`${t.kind}${t.fn||''}${t.n?`${t.n.n}/${t.n.d}`:''}`;if(seen.has(k))return false;seen.add(k);return true;});}
function famTrig(tier){
 const V=vars(tier);
 if(tier==='foundational'){
  const fn=pick(['sin','cos']),k=pick([1,1,2,3]);const terms=[tTrig(coef()*k,fn,k)];if(U.rand()<0.6)terms.push(tPow(nz(-4,4)*2,1));
  const x0=pick([xRat(0),xPi(Q(1,2)),xPi(Q(1)),xRat(0)]);
  return ivpFromTerms({V,terms,x0,tier,family:'trig',includeInterval:U.rand()<0.3,idTag:`${fn}${k}`});
 }
 if(tier==='intermediate'){
  const fn=pick(['sec2','sectan','csc2','csccot']),k=pick([1,1,2]);
  const terms=[tTrig(nz(-4,4)*k,fn,k)];const extra=pick(['poly','exp','trig','none']);
  if(extra==='poly')terms.push(tPow(nz(-3,3)*2,1));if(extra==='exp')terms.push(tExp(nz(-3,3),1));if(extra==='trig')terms.push(tTrig(nz(-3,3),pick(['sin','cos']),1));
  const x0=fn==='sec2'||fn==='sectan'?pick([xRat(0),xPi(Q(1,4*k)),xPi(Q(1,3*k)),xPi(Q(-1,4*k))]):pick([xPi(Q(1,2*k)),xPi(Q(1,4*k)),xPi(Q(1,6*k))]);
  return ivpFromTerms({V,terms,x0,tier,family:'trig',includeInterval:true,idTag:`${fn}${k}_${extra}`});
 }
 const kind=pick(['atan','asin','asinsq']);
 if(kind==='atan'){const a=pick([1,2,3,4]),terms=[tAtan(nz(-4,4)*a,a)];if(U.rand()<0.5)terms.push(tPow(nz(-3,3)*3,2));const x0=pick([xRat(0),xRat(a),xRat(-a)]);
  return ivpFromTerms({V,terms,x0,tier,family:'trig',includeInterval:U.rand()<0.4,idTag:`atan${a}`});}
 if(kind==='asin'){const a=pick([1,2,3,4]),terms=[tAsin(nz(-5,5),a)];if(U.rand()<0.5)terms.push(tPow(nz(-3,3)*2,1));const x0=pick([xRat(0),xRat(Q(a,2)),xRat(Q(-a,2))]);
  return ivpFromTerms({V,terms,x0,tier,family:'trig',includeInterval:true,idTag:`asin${a}`});}
 const terms=[tPow(nz(1,3)*3,2),tAsinSq(Q(-nz(1,3)))];const x0=U.rand()<0.6?xRat(0):Object.assign(xRat(0),{tex:'\\frac{1}{\\sqrt{2}}',val:Math.SQRT1_2,q:null,invsqrt2:true,exact:ex(Q(1,2),K.sqrt2)});
 if(x0.invsqrt2){terms[0]=tPow(nz(1,3)*3,0);} // keep the constant exact at 1/sqrt 2
 return ivpFromTerms({V,terms,x0,tier,family:'trig',includeInterval:true,idTag:`asinsq${x0.invsqrt2?'r':'0'}`});
}
function famExp(tier){
 const V=vars(tier);
 if(tier==='foundational'){
  const k=pick([1,2,3,-1,-2]),terms=[tExp(nz(-4,4)*Math.abs(k),k)];if(U.rand()<0.7)terms.push(tPow(nz(-4,4)*2,pick([1,0])));
  return ivpFromTerms({V,terms:dedupe(terms),x0:xRat(0),tier,family:'exp_composition',includeInterval:U.rand()<0.25,idTag:`e${k}`});
 }
 if(tier==='intermediate'){
  const kind=pick(['base','esq','cossq','sinsq']);
  if(kind==='base'){const b=pick([2,3,10]),terms=[tExpBase(nz(-3,3),b),tPow(nz(-3,3)*2,1)];return ivpFromTerms({V,terms,x0:xRat(pick([0,1])),tier,family:'exp_composition',includeInterval:U.rand()<0.25,idTag:`b${b}`});}
  const terms=[tComp(kind,2*nz(-3,3))];if(U.rand()<0.5)terms.push(tPow(nz(-3,3),0));
  return ivpFromTerms({V,terms,x0:xRat(0),tier,family:'exp_composition',includeInterval:U.rand()<0.25,idTag:kind});
 }
 const kind=pick(['esin','ecos','ecube','powcomp']);
 if(kind==='powcomp'){const n=pick([Q(1,2),Q(1),Q(2)]);const a=qv(n)===0.5?pick([1,4,9,16]):pick([1,2,3]);const terms=[tPowComp(nz(1,3)*(qv(n)===0.5?3:2),a,n)];if(U.rand()<0.5)terms.push(tExp(nz(-3,3),1));
  return ivpFromTerms({V,terms,x0:xRat(0),tier,family:'exp_composition',includeInterval:U.rand()<0.25,idTag:`pc${a}_${n.n}`});}
 const terms=[tComp(kind,kind==='ecube'?3*nz(-2,2):nz(-4,4))];if(U.rand()<0.6)terms.push(kind==='ecube'?tPow(nz(-3,3)*2,1):tTrig(nz(-3,3),pick(['sin','cos']),1));
 const x0=kind==='ecube'?pick([xRat(0),xRat(1)]):pick([xRat(0),xPi(Q(1,2)),xPi(Q(1))]);
 return ivpFromTerms({V,terms,x0,tier,family:'exp_composition',includeInterval:U.rand()<0.25,idTag:kind});
}
function famLog(tier){
 const V=vars(tier);
 if(tier==='intermediate'){
  const kind=pick(['recip','recip','quadlog','invsqrt']);
  if(kind==='recip'){const k=pick([1,1,2,3]),b=nz(-6,6),root=-b/k;const side=pick([1,-1]);const w=pick([1,1,2]);const x0q=Q(side*w-b,k);
   const terms=[tRecip(nz(-4,4)*k,k,b)];if(U.rand()<0.6)terms.push(pick([tExp(nz(-3,3),1),tPow(nz(-3,3)*2,1),tPow(nz(-4,4)*3,2)]));
   return ivpFromTerms({V,terms:dedupe(terms),x0:xRat(x0q),tier,family:'log_domain',includeInterval:true,idTag:`r${k}_${b}`});}
  if(kind==='quadlog'){const a=pick([1,2,3,4,9]),terms=[tQuadLog(nz(-4,4),a)];if(U.rand()<0.5)terms.push(tPow(nz(-3,3),0));
   return ivpFromTerms({V,terms,x0:xRat(0),tier,family:'log_domain',includeInterval:true,idTag:`q${a}`});}
  const a=nz(-4,4),w=pick([1,4,9]),terms=[tShiftRoot(nz(-3,3),a,false)];if(U.rand()<0.5)terms.push(tPow(nz(-3,3)*2,1));
  return ivpFromTerms({V,terms,x0:xRat(a+w),tier,family:'log_domain',includeInterval:true,idTag:`is${a}`});
 }
 const kind=pick(['tan','xlnx','sqrtshift','explog','recip2']);
 if(kind==='tan'){const terms=[tTan(nz(-4,4))];if(U.rand()<0.5)terms.push(tTrig(nz(-3,3)*1,'sec2',1));const x0=pick([xRat(0),xPi(Q(1,4)),xPi(Q(1,3)),xPi(Q(-1,4))]);
  return ivpFromTerms({V,terms:dedupe(terms),x0,tier,family:'log_domain',includeInterval:true,idTag:'tan'});}
 if(kind==='xlnx'){const x0=pick([xE(1),xE(2),xInvE()]);const terms=[tXlnx(nz(-4,4))];if(U.rand()<0.4)terms.push(tPow(nz(-3,3),0));
  return ivpFromTerms({V,terms:dedupe(terms),x0,tier,family:'log_domain',includeInterval:true,idTag:`xl${x0.ek}`});}
 if(kind==='sqrtshift'){const a=nz(-4,4),w=pick([0,1,4,9]),terms=[tShiftRoot(3*nz(-2,2),a,true)];if(U.rand()<0.5)terms.push(tPow(nz(-3,3)*2,1));const x0=xRat(a+w);
  if(w===0)return null;
  return ivpFromTerms({V,terms,x0,tier,family:'log_domain',includeInterval:true,idTag:`s${a}`});}
 if(kind==='explog'){const a=pick([1,2,3]),terms=[tExpLog(nz(-4,4),a)];if(U.rand()<0.5)terms.push(tPow(nz(-3,3),0));
  return ivpFromTerms({V,terms,x0:xRat(0),tier,family:'log_domain',includeInterval:true,idTag:`el${a}`});}
 // two singular terms like the homework: 1/(x-a) + e^{x-a}
 const a=nz(-4,5),side=pick([1,-1]),terms=[tRecip(nz(-3,3),1,-a),tPow(nz(-3,3)*2,1)];
 return ivpFromTerms({V,terms,x0:xRat(a+side),tier,family:'log_domain',includeInterval:true,idTag:`r2${a}`});
}

// ---------- calculator FTC IVPs ----------
// ---------- calculator IVPs (v12.8.X: three families in the 'calculator_ftc' group) ----------
// f' has no convenient antiderivative (or one not worth finding), so the Fundamental Theorem of Calculus and the
// calculator's definite integral give values of f. Points are halves or, as in the homework, multiples of π.
const NONELEM=[
 {tex:v=>`e^{-${v}^{2}}`,f:x=>Math.exp(-x*x),dom:[-4,4]},
 {tex:v=>`\\sin\\left(${v}^{2}\\right)`,f:x=>Math.sin(x*x),dom:[-3,3],pi:true},
 {tex:v=>`\\cos\\left(${v}^{2}\\right)`,f:x=>Math.cos(x*x),dom:[-3,3],pi:true},
 {tex:v=>`\\sqrt{1+${v}^{3}}`,f:x=>Math.sqrt(1+x**3),dom:[0,4]},
 {tex:v=>`\\frac{\\sin ${v}}{${v}}`,f:x=>Math.sin(x)/x,dom:[0.2,4],pi:true},
 {tex:v=>`\\frac{e^{${v}}}{${v}}`,f:x=>Math.exp(x)/x,dom:[0.5,3.5],pi:true},
 {tex:v=>`\\frac{1}{\\ln ${v}}`,f:x=>1/Math.log(x),dom:[1.5,6]},
 {tex:v=>`\\sqrt{100-${v}^{4}}`,f:x=>Math.sqrt(100-x**4),dom:[-3,3]},
 {tex:v=>`\\ln\\left(1+${v}^{2}\\right)\\cos ${v}`,f:x=>Math.log(1+x*x)*Math.cos(x),dom:[-3,3],pi:true},
 {tex:v=>`\\frac{1}{1+${v}^{4}}`,f:x=>1/(1+x**4),dom:[-3,3],elementary:true},
 {tex:v=>`${v}e^{-${v}}`,f:x=>x*Math.exp(-x),dom:[0,5],elementary:true},
 {tex:v=>`\\sqrt{${v}^{2}+4}`,f:x=>Math.sqrt(x*x+4),dom:[-3,3],elementary:true},
 {tex:v=>`\\sqrt{1-${v}^{4}}`,f:x=>Math.sqrt(1-x**4),dom:[-1,1],small:true},
 {tex:v=>`\\cos\\left(\\sqrt{${v}}\\right)`,f:x=>Math.cos(Math.sqrt(x)),dom:[0,9],pi:true},
 {tex:v=>`\\ln\\left(1+${v}^{3}\\right)`,f:x=>Math.log(1+x**3),dom:[0,3]},
 {tex:v=>`\\sin\\left(e^{${v}}\\right)`,f:x=>Math.sin(Math.exp(x)),dom:[-2,1.5]},
 {tex:v=>`e^{${v}^{2}}`,f:x=>Math.exp(x*x),dom:[-1.5,1.5]},
 {tex:v=>`\\frac{\\cos ${v}}{1+${v}^{2}}`,f:x=>Math.cos(x)/(1+x*x),dom:[-3,3],pi:true},
];
const PI_Q=[Q(1,6),Q(1,4),Q(1,3),Q(1,2),Q(2,3),Q(3,4),Q(1),Q(-1,6),Q(-1,4),Q(-1,3),Q(-1,2),Q(-1)];
// points strictly inside the integrand's domain: halves (tenths for the small domain [-1, 1]) or multiples of π
function calcPoints(it,n,{usePi=false}={}){
 const [lo,hi]=it.dom,inside=v=>v>lo+1e-9&&v<hi-1e-9;
 const pool=[];
 if(it.small)for(let k=-9;k<=9;k++){const q=Q(k,10);if(inside(qv(q)))pool.push({tex:qtex(q),val:qv(q),key:`${k}/10`});}
 else for(let k=Math.ceil(lo*2);k<=Math.floor(hi*2);k++){const q=Q(k,2);if(inside(qv(q)))pool.push({tex:qtex(q),val:qv(q),key:`${k}/2`});}
 if(usePi&&it.pi){const pis=PI_Q.map(q=>({tex:U.piTexQ(q),val:qv(q)*Math.PI,key:`${q.n}pi/${q.d}`})).filter(p=>inside(p.val));if(pis.length)for(let k=0;k<3;k++)pool.push(...pis);}
 for(let i=0;i<40;i++){const pts=U.shuffle(pool).slice(0,n);if(pts.length===n&&pts.every((p,j)=>pts.slice(0,j).every(q=>Math.abs(q.val-p.val)>=0.4)))return pts;}
 return null;
}
// f'(x): a scaled non-elementary term, sometimes plus a polynomial term on the challenging tier
function calcDerivative(tier){
 const it=pick(NONELEM),scale=tier==='foundational'?1:pick([2,3,-2,4,-1]);
 const lin=tier==='challenging'&&U.rand()<0.4?nz(-3,3)*2:0; // + c·x, still integrated numerically with the rest
 const coef=scale===1?'':scale===-1?'-':String(scale);
 const tex=v=>`${coef}${it.tex(v)}${lin?`${lin<0?'-':'+'}${Math.abs(lin)===1?'':Math.abs(lin)}${v}`:''}`;
 return{it,tex,g:x=>scale*it.f(x)+lin*x,lin};
}
const calcVars=()=>({v:pick(['x','x','t']),fn:pick(['f','g','h'])});
const intOf=(D,a,b)=>`\\int_{${a.tex}}^{${b.tex}}\\left(${D.tex('s')}\\right)ds`;
const calcWhy=D=>D.it.elementary&&!D.lin?`Use the calculator's definite-integral feature; there is no need to find an antiderivative.`:`${D.lin?'Part of this integrand':'This integrand'} has no elementary antiderivative, so evaluate the definite integral numerically.`;
const DEC3B='Give your answer correct to three decimal places.';
const numPart=(prompt,value,steps,wrong=[])=>({prompt:`${prompt} ${DEC3B}`,control:'input',answer:{kind:'numeric',value,places:3,wrongValues:wrong},answerTex:fix(value,3),explanation:steps,keypadMode:'unit5-number',placeholder:'Decimal answer'});
const calcQuestion=(V,D,lines,prompt)=>question({prompt:`Use your calculator. ${prompt}`,formulas:[`${V.fn}'(${V.v})=${D.tex(V.v)}`,...lines],calculator:true});

// 1. a value of f from the initial condition (forward or, above the foundational tier, backward)
function famCalcValue(tier){
 const V=calcVars(),D=calcDerivative(tier);const pts=calcPoints(D.it,2,{usePi:tier!=='foundational'});if(!pts)return null;
 let [a,b]=pts;if(tier==='foundational'&&b.val<a.val)[a,b]=[b,a];
 const ya=pick([-4,-3,-2,-1,1,2,3,4,5,6,7]),I=integrate(D.g,a.val,b.val),value=ya+I,back=b.val<a.val;
 const steps=step('Use the Fundamental Theorem of Calculus.',`${m(V.fn)} is an antiderivative of ${m(`${V.fn}'`)}, so the change in ${m(V.fn)} from ${m(`${V.v}=${a.tex}`)} to ${m(`${V.v}=${b.tex}`)} is the definite integral of ${m(`${V.fn}'`)}.${back?` Here ${m(`${b.tex}\\lt ${a.tex}`)}, so the integral runs backward and its sign takes care of the direction.`:''}`,`${V.fn}\\left(${b.tex}\\right)=${V.fn}\\left(${a.tex}\\right)+${intOf(D,a,b)}`)+
  step('Evaluate with a calculator.',calcWhy(D),`${intOf(D,a,b)}\\approx ${fix(I,4)}`,`${V.fn}\\left(${b.tex}\\right)\\approx ${ya}${I<0?' - ':' + '}${fix(Math.abs(I),4)}\\approx ${fix(value,3)}`);
 return problem({engine:'basic',family:'calc_value',tier,id:`cval-${a.key}-${b.key}-${ya}`,calculator:true,
  questionHtml:calcQuestion(V,D,[`${V.fn}\\left(${a.tex}\\right)=${ya}`],`${m(V.fn)} is the solution of the initial-value problem below.`),
  parts:[numPart(`Find ${m(`${V.fn}\\left(${b.tex}\\right)`)}.`,value,steps,[{value:ya-I,note:'Check the direction: integrate from the point you know to the point you want.'},{value:I,note:`That is only the change in ${V.fn}. Add the known value.`}])]});
}
// 2. work back to the starting value: f(a) from a later value f(b)
function famCalcInitial(tier){
 const V=calcVars(),D=calcDerivative(tier);const pts=calcPoints(D.it,2,{usePi:tier==='challenging'});if(!pts)return null;
 let [a,b]=pts;if(b.val<a.val)[a,b]=[b,a];if(tier==='challenging'&&U.rand()<0.5)[a,b]=[b,a]; // the known point may lie on either side
 const yb=pick([-3,-2,-1,1,2,3,4,5,8,10]),I=integrate(D.g,a.val,b.val),ya=yb-I;
 const steps=step('Relate the two values with the Fundamental Theorem of Calculus.',`The change from ${m(`${V.v}=${a.tex}`)} to ${m(`${V.v}=${b.tex}`)} is the integral of ${m(`${V.fn}'`)}, so ${m(`${V.fn}\\left(${b.tex}\\right)=${V.fn}\\left(${a.tex}\\right)+${intOf(D,a,b)}`)}.`)+
  step(`Solve for ${m(`${V.fn}\\left(${a.tex}\\right)`)}.`,`Subtract the integral from the known value. ${calcWhy(D)}`,`${V.fn}\\left(${a.tex}\\right)=${V.fn}\\left(${b.tex}\\right)-${intOf(D,a,b)}\\approx ${yb}-\\left(${fix(I,4)}\\right)\\approx ${fix(ya,3)}`);
 return problem({engine:'basic',family:'calc_initial',tier,id:`cini-${a.key}-${b.key}-${yb}`,calculator:true,
  questionHtml:calcQuestion(V,D,[`${V.fn}\\left(${b.tex}\\right)=${yb}`],`${m(V.fn)} satisfies the differential equation below and the given value.`),
  parts:[numPart(`Find ${m(`${V.fn}\\left(${a.tex}\\right)`)}.`,ya,steps,[{value:yb+I,note:'Going back undoes the change: subtract the integral rather than adding it.'},{value:-I,note:`That is the change between the two points, with its sign reversed. Use the known value of ${V.fn}.`}])]});
}
// 3. net change with no initial condition, or two values on either side of the initial point
function famCalcTwo(tier){
 const V=calcVars(),D=calcDerivative(tier);
 if(tier==='foundational'){
  const pts=calcPoints(D.it,2);if(!pts)return null;let [a,b]=pts;if(b.val<a.val)[a,b]=[b,a];const I=integrate(D.g,a.val,b.val);
  const steps=step('The change in a function is the integral of its derivative.','No initial condition is needed: the Fundamental Theorem of Calculus gives the change directly.',`${V.fn}\\left(${b.tex}\\right)-${V.fn}\\left(${a.tex}\\right)=${intOf(D,a,b)}`)+step('Evaluate with a calculator.',calcWhy(D),`${intOf(D,a,b)}\\approx ${fix(I,3)}`);
  return problem({engine:'basic',family:'calc_two_point',tier,id:`cchg-${a.key}-${b.key}`,calculator:true,
   questionHtml:calcQuestion(V,D,[],`${m(V.fn)} is a differentiable function with the derivative below.`),
   parts:[numPart(`Find the change in ${m(V.fn)} from ${m(`${V.v}=${a.tex}`)} to ${m(`${V.v}=${b.tex}`)}, that is, ${m(`${V.fn}\\left(${b.tex}\\right)-${V.fn}\\left(${a.tex}\\right)`)}.`,I,steps,[{value:-I,note:'Integrate from the first point to the second; the order sets the sign.'},{value:D.g(b.val)-D.g(a.val),note:`That is the change in ${V.fn}'. The change in ${V.fn} is the integral of ${V.fn}'.`}])]});
 }
 const pts=calcPoints(D.it,3,{usePi:tier==='challenging'});if(!pts)return null;const sorted=[...pts].sort((p,q)=>p.val-q.val);const [c,a,b]=sorted; // known point in the middle
 const ya=pick([-3,-1,1,2,3,4,6]),Ib=integrate(D.g,a.val,b.val),Ic=integrate(D.g,a.val,c.val);
 const part=(x,I,label)=>numPart(`Find ${m(`${V.fn}\\left(${x.tex}\\right)`)}.`,ya+I,
  step(label,`${m(`${V.fn}\\left(${x.tex}\\right)=${V.fn}\\left(${a.tex}\\right)+${intOf(D,a,x)}`)}.${x.val<a.val?` The integral runs backward (${m(`${x.tex}\\lt ${a.tex}`)}), so its sign takes care of the direction.`:''}`)+step('Evaluate with a calculator.',calcWhy(D),`${intOf(D,a,x)}\\approx ${fix(I,4)}`,`${V.fn}\\left(${x.tex}\\right)\\approx ${ya}${I<0?' - ':' + '}${fix(Math.abs(I),4)}\\approx ${fix(ya+I,3)}`),
  [{value:ya-I,note:'Check the direction: integrate from the point you know to the point you want.'}]);
 return problem({engine:'basic',family:'calc_two_point',tier,id:`ctwo-${c.key}-${a.key}-${b.key}-${ya}`,calculator:true,
  questionHtml:calcQuestion(V,D,[`${V.fn}\\left(${a.tex}\\right)=${ya}`],`${m(V.fn)} is the solution of the initial-value problem below. Answer each part.`),
  parts:[part(b,Ib,'Start from the initial condition and integrate forward.'),part(c,Ic,'Start again from the initial condition and integrate backward.')]});
}

// ---------- general solutions ----------
function famGeneral(tier){
 const V=vars(tier);
 const options=tier==='foundational'?[
  ()=>[tPow(nz(-4,4)*3,2),tPow(nz(-5,5)*2,1),tPow(nz(-6,6),0)],
  ()=>[tTrig(nz(-4,4),pick(['sin','cos']),1),tPow(nz(-3,3)*2,1)],
  ()=>[tExp(nz(-4,4)*2,2),tPow(nz(-3,3)*3,2)]]:[
  ()=>[tTrig(nz(-3,3)*2,'sec2',2)],
  ()=>[tComp(pick(['esq','cossq']),2*nz(-3,3))],
  ()=>[tPow(nz(-3,3)*3,Q(1,2)),tExp(nz(-3,3),-1)],
  ()=>[tAtan(nz(-3,3),1),tPow(nz(-3,3),0)]];
 const terms=dedupe(pick(options)());
 let comps=[[-3,3]];
 if(terms.some(t=>t.kind==='trig'&&(t.fn==='sec2')))comps=[[-0.7,0.7]];
 if(terms.some(t=>t.kind==='pow'&&t.n.d===2))comps=[[0.05,4]];
 const rhs=terms.map((t,i)=>t.itex(V,i===0)).join(''),anti=terms.map((t,i)=>t.atex(V,i===0)).join('');
 const notes=terms.map(t=>typeof t.note==='function'?t.note(V):null).filter(Boolean);
 const steps=[step('Integrate both sides.',`${notes.join(' ')}${notes.length?' ':''}With no initial condition, the constant stays as ${m('C')}.`,`${V.dep}=\\int\\left(${rhs}\\right)d${V.v}=${anti}+C`)];
 const part={prompt:`Find the general solution. Include ${m('+\\,C')}.`,control:'input',prefix:`${V.dep}=`,
  answer:{kind:'general',variable:V.v,expression:terms.map(t=>`(${t.aexpr})`).join('+'),components:comps},
  answerTex:`${V.dep}=${anti}+C`,explanation:steps.join(''),keypadMode:V.keypad+'-c',placeholder:`Enter ${V.dep} in terms of ${V.v}, with + C`};
 return problem({engine:'basic',family:'general_solution',tier,id:`gen-${terms.map(t=>t.kind).join('-')}-${terms.map(t=>t.c?t.c.n:0).join('_')}`,
  questionHtml:question({prompt:'Find the general solution of the differential equation.',formula:`${V.d}=${rhs}`,calculator:false}),parts:[part]});
}

const FAMILIES={
 poly_power:{weight:20,tiers:['foundational','intermediate','challenging'],make:famPoly,label:'Polynomial, power and radical IVPs',calculator:false},
 trig:{weight:20,tiers:['foundational','intermediate','challenging'],make:famTrig,label:'Trigonometric and inverse-trig IVPs',calculator:false},
 exp_composition:{weight:20,tiers:['foundational','intermediate','challenging'],make:famExp,label:'Exponential and composition IVPs',calculator:false},
 log_domain:{weight:15,tiers:['intermediate','challenging'],make:famLog,label:'Logarithmic and domain-restricted IVPs',calculator:false},
 // W's 15% calculator share is now three families in the 'calculator_ftc' group (the Practice Type keeps its value)
 calc_value:{weight:6,group:'calculator_ftc',tiers:['foundational','intermediate','challenging'],make:famCalcValue,label:'Calculator: values from an initial condition',calculator:true},
 calc_initial:{weight:4,group:'calculator_ftc',tiers:['foundational','intermediate','challenging'],make:famCalcInitial,label:'Calculator: find the starting value',calculator:true},
 calc_two_point:{weight:5,group:'calculator_ftc',tiers:['foundational','intermediate','challenging'],make:famCalcTwo,label:'Calculator: net change and two values',calculator:true},
 general_solution:{weight:10,tiers:['foundational','intermediate'],make:famGeneral,label:'General solutions',calculator:false},
};
const engine=U.makeEngine('basic',FAMILIES);
const fnKeys=[['sin','sin'],['cos','cos'],['tan','tan'],['sec','sec'],['csc','csc'],['cot','cot'],['sin⁻¹','asin'],['tan⁻¹','atan'],['|u|','abs']];
for(const v of ['x','t']){
 U.profile(`unit5-basic-${v}`,{fraction:true,radical:true,exponent:true,logarithm:true,constants:['pi','e'],variables:[v],functions:fnKeys,arithmetic:true,parentheses:true});
 U.profile(`unit5-basic-${v}-c`,{fraction:true,exponent:true,constants:['e'],variables:[v,'C'],functions:fnKeys.filter(([,n])=>['sin','cos','tan','atan'].includes(n)),arithmetic:true,parentheses:true});
}
U.profile('unit5-interval-basic',{fraction:true,constants:['pi'],parentheses:true,list:true,interval:true,union:false,infinity:true});
window.BatchMathUnit5Basic=Object.freeze({make:engine.make,FAMILIES,weights:engine.weights});
U.register('basic-first-order-differential-equations',o=>engine.make(o||{}));
})();
