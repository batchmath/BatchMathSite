/* BatchMath v12.8.W — Unit 5 engine 4: Separable Differential Equations.
   Every question is an initial-value problem with two parts: (A) the particular solution, (B) its interval
   of validity — the maximal connected interval containing the initial x-value on which the solution is
   defined and satisfies the original differential equation (so points where the equation itself is
   undefined, such as y = 0 in a denominator or x = 0 in y/x, are excluded even if the formula is defined).
   Families (mixed mode): product forms 20%, powers of y 20%, logarithmic and rational 15%, trigonometric 15%,
   exponentials of y 15%, radicals and branch selection 15%. */
(function(){
'use strict';
const U=window.BatchMathUnit5Core;
if(!U)return;
const {Q,qv,qadd,qsub,qmul,qdiv,qneg,qzero,qeq,qtex,qexpr,ri,pick,nz,termTex,step,eq,m,question,problem,Poly}=U;

// ---------- value objects {tex, expr, val} ----------
const R=q=>{q=typeof q==='number'?Q(q):q;return{tex:qtex(q),expr:qexpr(q),val:qv(q),q};};
const V_=(tex,expr,val)=>({tex,expr,val});
const NINF=V_('-\\infty','-infinity',-Infinity),INF=V_('\\infty','infinity',Infinity);
function sqrtQ(q){ // √q for rational q > 0, simplified: (s/d)√r
 q=typeof q==='number'?Q(q):q;const n=q.n,d=q.d;let a=n*d,s=1;for(let f=2;f*f<=a;f++)while(a%(f*f)===0){a/=f*f;s*=f;}
 const c=Q(s,d);const val=Math.sqrt(qv(q));
 if(a===1)return{tex:qtex(c),expr:qexpr(c),val};
 const root=`\\sqrt{${a}}`;let tex;
 if(c.d===1)tex=c.n===1?root:`${c.n}${root}`;else tex=`\\frac{${c.n===1?'':c.n}${root}}{${c.d}}`;
 return{tex,expr:`sqrt(${n}/${d})`,val};
}
const neg=o=>({tex:o.tex==='0'?'0':o.tex.startsWith('-')?o.tex.slice(1):`-${o.tex}`,expr:`-(${o.expr})`,val:-o.val});
const coefTex=(k,body,first=true)=>termTex(Q(k),body,first);
// a fraction with any minus sign written in front of it, not inside the numerator
const signedFrac=(num,den)=>num.startsWith('-')?'-'+'\\frac{'+num.slice(1)+'}{'+den+'}':'\\frac{'+num+'}{'+den+'}';
const coefStr=q=>qeq(q,Q(1))?'':qeq(q,Q(-1))?'-':qtex(q);           // coefficient in front of a factor
const negRecip=q=>q.d===1&&Math.abs(q.n)===1?String(-q.n):`-\\frac{1}{${q.d===1?q.n:`${q.n}/${q.d}`}}`; // -1/y0 without a fraction inside a fraction
const negExp=t=>t.startsWith('-')?`\\left(${t}\\right)`:t;           // exponent -(y0) that only needs parentheses for a negative y0
const lcmDen=qs=>qs.reduce((L,q)=>L*q.d/U.gcd(L,q.d),1);                  // common denominator of rational coefficients
// a sum of terms [{q, body}] written with a positive term first when one exists (1 - 2x rather than -2x + 1)
function niceSum(terms){const t=terms.filter(x=>!qzero(x.q));const i=t.findIndex(x=>qv(x.q)>0);if(i>0)t.unshift(...t.splice(i,1));return t.map((x,k)=>termTex(x.q,x.body,k===0)).join('')||'0';}
const polyTerms=(P,v)=>P.c.map((q,i)=>({q,body:i===0?'':i===1?v:`${v}^{${i}}`})).reverse();
const nicePoly=(P,v)=>niceSum(polyTerms(P,v));
// num / (sum of terms), with the minus sign moved out front when every term is negative
function niceRecip(num,terms){const t=terms.filter(x=>!qzero(x.q));if(t.every(x=>qv(x.q)<0))return `-\\frac{${num}}{${niceSum(t.map(x=>({q:qneg(x.q),body:x.body})))}}`;return `\\frac{${num}}{${niceSum(t)}}`;}
const CLEAR=L=>` Multiply the numerator and denominator by ${m(L)} to clear the fraction.`;
const NEG_EXP={'0':'-1','\\ln 2':'-\\frac{1}{2}','-\\ln 2':'-2','1':'-e^{-1}'};

// ---------- variables ----------
function vars(){const r=U.rand();
 if(r<0.7)return{x:'x',y:'y',d:'\\frac{dy}{dx}',vx:'x',keypad:'unit5-sep-x'};
 if(r<0.9)return{x:'t',y:'y',d:'\\frac{dy}{dt}',vx:'t',keypad:'unit5-sep-t'};
 return{x:'x',y:'u',d:'\\frac{du}{dx}',vx:'x',keypad:'unit5-sep-x'};
}
const sub=(V,s)=>s.replace(/@x/g,V.x).replace(/@y/g,V.y);

// ---------- builder ----------
function build(o){
 const {V,family,tier,id}=o;
 const sol=o.solution,x0=o.x0,y0=o.y0;
 // self-checks: initial condition, equation on the interval, and a genuine break at every finite endpoint
 if(Math.abs(sol.f(x0.val)-y0.val)>1e-9*Math.max(1,Math.abs(y0.val)))throw Error(`IC ${id}`);
 const lo=o.lo,hi=o.hi;if(!(lo.val<x0.val&&x0.val<hi.val))throw Error('x0 outside interval');
 const a=Number.isFinite(lo.val)?lo.val:x0.val-6,b=Number.isFinite(hi.val)?hi.val:x0.val+6;
 for(let k=1;k<40;k++){const x=a+(b-a)*k/40,y=sol.f(x),h=1e-6*Math.max(1,Math.abs(x)),d=(sol.f(x+h)-sol.f(x-h))/(2*h),want=o.f(x,y);
  if(!Number.isFinite(y))throw Error(`solution undefined inside ${id} at ${x}`);
  if(Number.isFinite(want)&&Math.abs(want)<1e6&&Math.abs(d-want)>1e-4*Math.max(1,Math.abs(want)))throw Error(`residual ${id} at ${x}`);}
 // no hidden pole inside the interval: a sign change between huge values on a dense scan means the solution blows up
 {let prev=null;for(let k=1;k<4000;k++){const x=a+(b-a)*k/4000,y=sol.f(x);if(!Number.isFinite(y))throw Error(`solution undefined inside ${id}`);
  if(prev!==null&&Math.sign(prev)!==Math.sign(y)&&Math.min(Math.abs(prev),Math.abs(y))>1e3)throw Error(`pole inside ${id} near ${x}`);prev=y;}}
 // an endpoint is a break when, at it or just past it, the solution is undefined or the equation is undefined or unbounded
 const bad=x=>{const y=sol.f(x);if(!Number.isFinite(y))return true;const fx=o.f(x,y);return !Number.isFinite(fx)||Math.abs(fx)>1e6;};
 for(const [e,dir] of [[lo,-1],[hi,1]])if(Number.isFinite(e.val)){const s=Math.max(1,Math.abs(e.val));
  if(![0,1e-10,1e-8,1e-6,1e-4].some(d=>bad(e.val+dir*d*s))&&![1e-10,1e-8].some(d=>bad(e.val-dir*d*s)))throw Error(`endpoint ${e.tex} is not a break (${id})`);}
 const restricted=Number.isFinite(lo.val)||Number.isFinite(hi.val);
 const iv=`\\left(${lo.tex},\\,${hi.tex}\\right)`;
 // part A explanation
 const A=[
  step('Separate the variables.',o.sepText||`Move every ${m(V.y)} to the left with ${m(`d${V.y}`)} and every ${m(V.x)} to the right with ${m(`d${V.x}`)}.${o.eqNote?' '+o.eqNote:''}`,o.sepTex),
  step('Integrate both sides.',o.intText||'',...o.intTex),
  step('Use the initial condition.',`Substitute ${m(`${V.x}=${x0.tex}`)} and ${m(`${V.y}=${y0.tex}`)} right after integrating, then solve for ${m('C')}.`,...o.icTex),
  step(`Solve for ${m(V.y)}.`,o.solveText||'',...o.solveTex.filter(t=>t!==`${V.y}=${sol.tex}`),`${V.y}=${sol.tex}`)].join('');
 const reasons=o.why.map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
 const B=[
  step('Find where the solution and the differential equation are defined.',reasons),
  step(restricted?`Keep the interval that contains ${m(`${V.x}=${x0.tex}`)}.`:'There are no restrictions.',restricted?(o.pickText||pickDefault(V,x0,lo,hi)):`The solution satisfies the differential equation for every real ${m(V.x)}.`,iv)].join('');
 const parts=[
  {prompt:`Find the particular solution ${m(V.y)} as a function of ${m(V.x)}.`,control:'input',prefix:`${V.y}=`,
   answer:{kind:'ivp',variable:V.vx,expression:sol.expr,interval:[lo.val,hi.val],x0:x0.val,x0Tex:x0.tex,y0:y0.val,ode:o.f,branchNote:!!o.branch},
   answerTex:`${V.y}=${sol.tex}`,explanation:A,keypadMode:V.keypad,placeholder:`Enter ${V.y} in terms of ${V.x}`},
  {prompt:'State the interval of validity of this solution.',control:'input',
   answer:{kind:'interval',validity:true,variable:V.vx,x0:x0.val,x0Tex:x0.tex,left:lo.expr,right:hi.expr,lc:false,rc:false,
    bracketNote:'The endpoints are right, but they are not included: the solution or the differential equation is undefined at each endpoint.'},
   answerTex:iv,explanation:B,keypadMode:'unit5-sep-interval',placeholder:'Enter an interval, e.g. (0, ∞)'}];
 const ic=pick([0,1])?`${V.y}\\left(${x0.tex}\\right)=${y0.tex}`.replace(/\\left\(([^\\]*)\\right\)=/,'($1)='):`${V.y}=${y0.tex}\\text{ when }${V.x}=${x0.tex}`;
 return problem({engine:'separable',family,tier,id:String(id).replace(/[^A-Za-z0-9_.-]+/g,''),
  questionHtml:question({prompt:'Solve the initial-value problem. Then state the interval of validity of the particular solution.',formulas:[`${V.d}=${o.rhsTex}`,ic],calculator:false}),
  parts,data:{restricted}});
}
// why the interval is the one containing x0, from its endpoints
function pickDefault(V,x0,lo,hi){
 const fl=Number.isFinite(lo.val),fh=Number.isFinite(hi.val),X=m(`${V.x}=${x0.tex}`);
 const tail=' The endpoints are not included, because the solution or the differential equation is undefined there.';
 if(fl&&fh)return `The initial value ${X} lies between the excluded values ${m(lo.tex)} and ${m(hi.tex)}, and nothing between them is excluded, so the solution is valid on the whole interval between them.`+tail;
 if(fl)return `The initial value ${X} lies to the right of the excluded value ${m(lo.tex)}, and nothing to its right is excluded.`+tail;
 return `The initial value ${X} lies to the left of the excluded value ${m(hi.tex)}, and nothing to its left is excluded.`+tail;
}
const eqNote=(V,val,tex)=>`Dividing by ${m(tex)} assumes ${m(tex.replace(/^\\left\(|\\right\)$/g,'')+'\\ne 0')}; the constant solution ${m(`${V.y}=${val}`)} also satisfies the equation, but it does not pass through the initial point.`;

// ---------- family 1: product forms ----------
function famProduct(tier){
 const V=vars();
 if(tier==='foundational'){ // y' = k x^n y
  const n=pick([0,1,2]),k=nz(-3,3)*(n+1),y0=nz(-5,6),x0=R(0);
  const g=new Poly(Array(n).fill(0).concat([k]));const G=g.integ(0);
  const Gt=G.tex(V.x);
  const sol={tex:`${y0===1?'':y0===-1?'-':y0}e^{${Gt}}`,expr:`(${y0})*e^(${G.expr()})`,f:x=>y0*Math.exp(G.f(x))};
  return build({V,family:'product',tier,id:`kxy-${n}-${k}-${y0}`,rhsTex:`${n===0?coefStr(g.c[0]):g.tex(V.x)}${V.y}`,f:(x,y)=>g.f(x)*y,x0,y0:R(y0),solution:sol,
   eqNote:eqNote(V,0,V.y),sepTex:`\\frac{d${V.y}}{${V.y}}=${n===0?(coefStr(g.c[0])==='-'?'-':coefStr(g.c[0])?coefStr(g.c[0])+'\\,':''):g.tex(V.x)+'\\,'}d${V.x}`,intTex:[`\\ln\\left|${V.y}\\right|=${Gt}+C`],
   icTex:[`\\ln\\left|${y0}\\right|=0+C\\quad\\Longrightarrow\\quad C=${Math.abs(y0)===1?'0':`\\ln ${Math.abs(y0)}`}`],
   solveText:`Exponentiate: ${m(`\\left|${V.y}\\right|=${Math.abs(y0)===1?'':Math.abs(y0)}e^{${Gt}}`)}. Since ${m(`${V.y}`)} starts ${y0>0?'positive':'negative'} and can never equal 0, ${m(V.y)} keeps that sign.`,solveTex:[],
   lo:NINF,hi:INF,why:[`${m(`e^{${Gt}}`)} is defined for every ${m(V.x)}, and the differential equation has no restrictions.`]});
 }
 if(tier==='intermediate'||U.rand()<0.4){ // y' = (2x + q)(y - a), Extra Separable #3
  const q=nz(-4,4),a=nz(-4,4),x0v=pick([0,-q]),y0=a+nz(-3,3);const G=new Poly([0,q,1]);// x^2 + q x
  const G0=G.f(x0v),A=y0-a;
  const expo=G0===0?G.tex(V.x):`${G.tex(V.x)}${termTex(Q(-G0),'')}`;
  const ya=`${V.y}${a>0?` - ${a}`:` + ${-a}`}`;
  const sol={tex:`${A===1?'':A===-1?'-':A}e^{${expo}}${termTex(Q(a),'')}`,expr:`(${A})*e^(x^2+(${q})*x-(${G0}))+(${a})`,f:x=>A*Math.exp(G.f(x)-G0)+a};
  const lin=`2${V.x}${q>0?` + ${q}`:` - ${-q}`}`;
  return build({V,family:'product',tier,id:`lin-${q}-${a}-${x0v}-${y0}`,rhsTex:`\\left(${lin}\\right)\\left(${ya}\\right)`,f:(x,y)=>(2*x+q)*(y-a),x0:R(x0v),y0:R(y0),solution:sol,
   eqNote:eqNote(V,a,`\\left(${ya}\\right)`),sepTex:`\\frac{d${V.y}}{${ya}}=\\left(${lin}\\right)d${V.x}`,intTex:[`\\ln\\left|${ya}\\right|=${G.tex(V.x)}+C`],
   icTex:[`\\ln\\left|${y0}${a>0?` - ${a}`:` + ${-a}`}\\right|=${G0}+C\\quad\\Longrightarrow\\quad C=${Math.abs(A)===1?(G0?qtex(Q(-G0)):'0'):`\\ln ${Math.abs(A)}${G0?termTex(Q(-G0),''):''}`}`],
   solveText:`Exponentiate: ${m(`\\left|${ya}\\right|=${Math.abs(A)===1?'':Math.abs(A)}e^{${expo}}`)}. At the initial point ${m(`${ya}=${A}`)} is ${A>0?'positive':'negative'}, and it can never be 0, so it keeps that sign.`,
   solveTex:[`${ya}=${A===1?'':A===-1?'-':A}e^{${expo}}`],lo:NINF,hi:INF,why:['The exponential is defined for every real number, and the differential equation has no restrictions.']});
 }
 // challenging: y' = k (y - a)/(x - h): the formula may be defined at x = h, the equation is not
 const k=pick([1,1,2,-1]),h=nz(-3,3),a=pick([0,0,nz(-4,4)]),side=pick([1,-1]),x0v=h+side*ri(1,3),y0=a+nz(-4,5);
 const d0=x0v-h,A=Q(y0-a,d0**k);// y - a = A (x - h)^k
 const xh=`${V.x}${h>0?` - ${h}`:` + ${-h}`}`,ya=a===0?V.y:`${V.y}${a>0?` - ${a}`:` + ${-a}`}`;
 const powTex=k===1?`\\left(${xh}\\right)`:k===2?`\\left(${xh}\\right)^{2}`:null;
 let solTex,solExpr;
 if(k===-1){const c=Q((y0-a)*d0);solTex=`${c.n<0?'-':''}\\frac{${Math.abs(c.n)}}{${c.d===1?'':c.d}\\left(${xh}\\right)}${a?termTex(Q(a),''):''}`;solExpr=`(${c.n}/${c.d})/(x-(${h}))+(${a})`;}
 else{solTex=`${termTex(A,powTex,true)}${a?termTex(Q(a),''):''}`;solExpr=`(${A.n}/${A.d})*(x-(${h}))^${k}+(${a})`;}
 const sol={tex:solTex.replace(/^\\left\((.*)\\right\)$/,'$1'),expr:solExpr,f:x=>qv(A)*Math.pow(x-h,k)+a};
 if(k===-1)sol.f=x=>(y0-a)*d0/(x-h)+a;
 const kTex=k===1?'':k===-1?'-':k;
 const rhs=k===1?`\\frac{${ya}}{${xh}}`:k===-1?`-\\frac{${ya}}{${xh}}`:`\\frac{2\\left(${ya}\\right)}{${xh}}`;
 return build({V,family:'product',tier,id:`yx-${k}-${h}-${a}-${x0v}-${y0}`,rhsTex:rhs,f:(x,y)=>k*(y-a)/(x-h),x0:R(x0v),y0:R(y0),solution:sol,
  eqNote:eqNote(V,a,a===0?V.y:`\\left(${ya}\\right)`),sepTex:`\\frac{d${V.y}}{${ya}}=${k===1?'':k===-1?'-':k}\\frac{d${V.x}}{${xh}}`,intTex:[`\\ln\\left|${ya}\\right|=${kTex}\\ln\\left|${xh}\\right|+C`],
  icTex:[`\\ln\\left|${y0-a}\\right|=${kTex}\\ln\\left|${d0}\\right|+C\\quad\\Longrightarrow\\quad C=${lnCombo(Math.abs(y0-a),-k,Math.abs(d0))}`],
  solveText:`Exponentiate both sides. On the interval around ${m(`${V.x}=${x0v}`)}, ${m(xh)} keeps one sign, so the absolute values combine into one constant fixed by the initial condition.`,
  solveTex:[k===-1?`${ya}=\\frac{${(y0-a)*d0}}{${xh}}`:`${ya}=${termTex(A,powTex,true)}`],
  lo:side>0?R(h):NINF,hi:side>0?INF:R(h),branch:false,
  why:[`The differential equation divides by ${m(xh)}, so it is undefined at ${m(`${V.x}=${h}`)}${k===-1?', where the solution is undefined too':', even though the formula for the solution is defined there'}.`],
  pickText:`The initial value ${m(`${V.x}=${x0v}`)} is ${side>0?'to the right':'to the left'} of ${m(`${V.x}=${h}`)}, so the interval of validity stops at ${m(`${V.x}=${h}`)}.`});
}

// C = ln p + c ln q, written without ln 1 terms
function lnCombo(p,c,q){const t=[];if(p!==1)t.push(`\\ln ${p}`);if(q!==1&&c)t.push(`${c<0?(t.length?' - ':'-'):(t.length?' + ':'')}${Math.abs(c)===1?'':Math.abs(c)}\\ln ${q}`);return t.join('')||'0';}

// ---------- family 2: powers of y ----------
function famPower(tier){
 const V=vars();
 const kind=tier==='foundational'?pick(['y2const','y3']):tier==='intermediate'?pick(['y2x','xover y','sqrty']):pick(['y2x','xover y','cuberoot','y3']);
 if(kind==='y2const'||kind==='y2x'){ // y' = g(x) y^2 -> y = 1/(c - G(x))
  let g,G,x0v,y0q;
  if(kind==='y2const'){const k=nz(-3,3);g=new Poly([k]);G=g.integ(0);x0v=0;y0q=Q(1,nz(-4,4));}
  else{const k=2*nz(-3,3);g=new Poly([0,k]);G=g.integ(0);x0v=pick([0,0,1]);y0q=pick([Q(1),Q(1,2),Q(-1),Q(1,4),Q(-1,2),Q(2)]);}
  const c=qadd(qdiv(Q(1),y0q),G.at(x0v)); // 1/y = c - G(x)
  const den=new Poly([c]).add(G.scale(-1));
  const denTex=nicePoly(den,V.x),L=lcmDen(den.c);
  const sol={tex:niceRecip(L,polyTerms(den.scale(L),V.x)),expr:`1/(${den.expr()})`,f:x=>1/den.f(x)};
  // poles of den around x0
  let lo=NINF,hi=INF;const why=[];
  if(den.deg===1){const r=qdiv(qneg(den.c[0]),den.c[1]);if(qv(r)>x0v)hi=R(r);else lo=R(r);why.push(`The solution is undefined where ${m(`${denTex}=0`)}, at ${m(`${V.x}=${qtex(r)}`)}.`);}
  else{const r2=qdiv(qneg(den.c[0]),den.c[2]);if(qzero(r2)){if(x0v===0)return null;if(x0v>0)lo=R(0);else hi=R(0);why.push(`The solution is undefined where ${m(`${denTex}=0`)}, which happens only at ${m(`${V.x}=0`)}.`);}else if(qv(r2)>0){const s=sqrtQ(r2);lo=neg(s);hi=s;if(x0v>s.val||x0v< -s.val)return null;why.push(`The solution is undefined where ${m(`${denTex}=0`)}, at ${m(`${V.x}=\\pm ${s.tex}`)}.`);}else why.push(`${m(`${denTex}`)} is never 0, so the solution is defined for every ${m(V.x)}.`);}
  const gT=g.tex(V.x),y0=R(y0q);
  return build({V,family:'powers_y',tier,id:`y2-${g.c.map(q=>q.n).join('_')}-${x0v}-${y0q.n}_${y0q.d}`,rhsTex:`${gT==='1'?'':gT==='-1'?'-':gT}${V.y}^{2}`,f:(x,y)=>g.f(x)*y*y,x0:R(x0v),y0,solution:sol,
   eqNote:eqNote(V,0,`${V.y}^{2}`),sepTex:`\\frac{d${V.y}}{${V.y}^{2}}=${gT==='1'?'':gT==='-1'?'-':gT+'\\,'}d${V.x}`,intTex:[`-\\frac{1}{${V.y}}=${G.tex(V.x)}+C`],
   icTex:[`${negRecip(y0q)}=${qtex(G.at(x0v))}+C\\quad\\Longrightarrow\\quad C=${qtex(qneg(c))}`],
   solveText:'Multiply by −1, then take reciprocals.'+(L===1?'':CLEAR(L)),solveTex:[`\\frac{1}{${V.y}}=${denTex}`],lo,hi,why});
 }
 if(kind==='y3'){ // y' = k y^3 -> y^2 = 1/(c - 2k x), branch by sign of y0
  const k=pick([1,-1,2,Q(1,2)].map(v=>typeof v==='number'?v:qv(v))),kq=Q(k*2,2),y0=pick([1,-1,2,-2]),c=Q(1,y0*y0); // 1/y^2 = c - 2k x  at x0 = 0
  const twok=qmul(Q(2),kq),den=new Poly([c,qneg(twok)]),denTex=nicePoly(den,V.x),r=qdiv(c,twok);
  const sgn=y0>0?'':'-';
  const L3=lcmDen(den.c);let sq=1;while((sq*sq)%L3)sq++;
  const sol={tex:sq===1?`${sgn}\\frac{1}{\\sqrt{${denTex}}}`:`${sgn}\\frac{${sq}}{\\sqrt{${nicePoly(den.scale(sq*sq),V.x)}}}`,expr:`${sgn}1/sqrt(${den.expr()})`,f:x=>(y0>0?1:-1)/Math.sqrt(den.f(x))};
  const lo=qv(twok)>0?NINF:R(r),hi=qv(twok)>0?R(r):INF;
  return build({V,family:'powers_y',tier,id:`y3-${k}-${y0}`,rhsTex:`${coefStr(kq)}${V.y}^{3}`,f:(x,y)=>k*y**3,x0:R(0),y0:R(y0),solution:sol,branch:true,
   eqNote:eqNote(V,0,`${V.y}^{3}`),sepTex:`\\frac{d${V.y}}{${V.y}^{3}}=${coefStr(kq)?coefStr(kq)+'\\,':''}d${V.x}`,intTex:[`-\\frac{1}{2${V.y}^{2}}=${termTex(kq,V.x,true)}+C`],
   icTex:[`-\\frac{1}{2\\left(${y0}\\right)^{2}}=0+C\\quad\\Longrightarrow\\quad C=${qtex(qmul(Q(-1,2),c))}`],
   solveText:`Multiply by −2, take reciprocals, then take a square root${sq===1?'':` (writing ${m(`\\sqrt{${denTex}}=\\frac{\\sqrt{${nicePoly(den.scale(sq*sq),V.x)}}}{${sq}}`)} clears the fraction under the root)`}. Take the ${y0>0?'positive':'negative'} square root because ${m(`${V.y}(0)=${y0}`)} is ${y0>0?'positive':'negative'}.`,
   solveTex:[`\\frac{1}{${V.y}^{2}}=${denTex}`,`${V.y}^{2}=\\frac{1}{${denTex}}`],lo,hi,
   why:[`The solution needs ${m(`${denTex}>0`)} (a positive radicand in a denominator), so ${m(`${V.x}${qv(twok)>0?'<':'>'}${qtex(r)}`)}.`]});
 }
 if(kind==='xover y'){ // y' = k x / y -> y^2 = k x^2 + C
  const k=pick([1,1,2,-1,-2,4]),x0v=pick([0,1,2,3]),sgn=pick([1,-1]);
  let y0v=sgn*ri(1,4);const C=Q(y0v*y0v-k*x0v*x0v);
  const inner=new Poly([C,0,k]),innerTex=inner.tex(V.x);
  if(qzero(C))return null;
  const s=sgn>0?'':'-';
  const sol={tex:`${s}\\sqrt{${innerTex}}`,expr:`${s}sqrt(${inner.expr()})`,f:x=>sgn*Math.sqrt(inner.f(x))};
  let lo=NINF,hi=INF;const why=[];
  if(k>0&&qv(C)>0)why.push(`${m(innerTex)} is always positive, so the solution is defined and nonzero for every ${m(V.x)}.`);
  else{const r=sqrtQ(qdiv(qneg(C),Q(k)).n<0?qdiv(C,Q(-k)):qdiv(qneg(C),Q(k)));
   if(k>0){if(x0v>r.val)lo=r;else if(x0v< -r.val)hi=neg(r);else return null;}
   else{lo=neg(r);hi=r;}
   why.push(`The square root requires ${m(`${innerTex}\\ge 0`)}, and the differential equation divides by ${m(V.y)}, so ${m(`${V.y}\\ne 0`)}: together, ${m(`${innerTex}>0`)}. The radicand is 0 at ${m(`${V.x}=\\pm ${r.tex}`)}.`);}
 const kT=k===1?'':k===-1?'-':k;
  return build({V,family:'powers_y',tier,id:`xy-${k}-${x0v}-${y0v}`,rhsTex:signedFrac(`${kT}${V.x}`,V.y),f:(x,y)=>k*x/y,x0:R(x0v),y0:R(y0v),solution:sol,branch:true,
   sepText:`Multiply both sides by ${m(`${V.y}\\,d${V.x}`)}.`,sepTex:`${V.y}\\,d${V.y}=${kT}${V.x}\\,d${V.x}`,intTex:[`\\frac{${V.y}^{2}}{2}=${termTex(Q(k,2),`${V.x}^{2}`,true)}+C`],
   icTex:[`\\frac{\\left(${y0v}\\right)^{2}}{2}=${termTex(Q(k,2),`\\left(${x0v}\\right)^{2}`,true)}+C\\quad\\Longrightarrow\\quad C=${qtex(qdiv(C,Q(2)))}`],
   solveText:`Multiply by 2: ${m(`${V.y}^{2}=${innerTex}`)}. The initial value ${m(`${V.y}=${y0v}`)} is ${sgn>0?'positive':'negative'}, so take the ${sgn>0?'positive':'negative'} square root.`,solveTex:[],lo,hi,why});
 }
 if(kind==='cuberoot'){ // y' = k x / y^2 -> y^3 = (3k/2) x^2 + C
  const k=pick([2,-2,4,-4]),y0=pick([1,2,-1,-2]),C=Q(y0**3);const kk=Q(3*k,2);const inner=new Poly([C,0,kk]),innerTex=inner.tex(V.x);
  const cbrt=x=>Math.cbrt(inner.f(x));const sol={tex:`\\sqrt[3]{${innerTex}}`,expr:`cbrt(${inner.expr()})`,f:cbrt};
  let lo=NINF,hi=INF;const why=[];
  const r2=qdiv(qneg(C),kk);
  if(qv(r2)>0){const r=sqrtQ(r2);lo=neg(r);hi=r;why.push(`The cube root is defined for every number, but the differential equation divides by ${m(`${V.y}^{2}`)}, so ${m(`${V.y}\\ne 0`)}. The solution is 0 where ${m(`${innerTex}=0`)}, at ${m(`${V.x}=\\pm ${r.tex}`)}.`);}
  else why.push(`${m(innerTex)} is never 0 (it is ${qv(C)>0?'at least':'at most'} ${m(qtex(C))} for every ${m(V.x)}), so ${m(`${V.y}\\ne 0`)} and the solution is valid everywhere.`);
  return build({V,family:'powers_y',tier,id:`cbrt-${k}-${y0}`,rhsTex:signedFrac(`${k}${V.x}`,`${V.y}^{2}`),f:(x,y)=>k*x/(y*y),x0:R(0),y0:R(y0),solution:sol,
   sepText:`Multiply both sides by ${m(`${V.y}^{2}\\,d${V.x}`)}.`,sepTex:`${V.y}^{2}\\,d${V.y}=${k}${V.x}\\,d${V.x}`,intTex:[`\\frac{${V.y}^{3}}{3}=${termTex(Q(k,2),`${V.x}^{2}`,true)}+C`],
   icTex:[`\\frac{\\left(${y0}\\right)^{3}}{3}=0+C\\quad\\Longrightarrow\\quad C=${qtex(Q(y0**3,3))}`],
   solveText:`Multiply by 3, then take the cube root (one real cube root, so no sign choice is needed).`,solveTex:[`${V.y}^{3}=${innerTex}`],lo,hi,why});
 }
 // sqrt y: y' = k x sqrt(y), k > 0
 const k=pick([2,4,6]),r0=ri(1,4),y0=r0*r0;const inner=new Poly([r0,0,Q(k,4)]),innerTex=inner.tex(V.x);
 const sol={tex:`\\left(${innerTex}\\right)^{2}`,expr:`(${inner.expr()})^2`,f:x=>inner.f(x)**2};
 return build({V,family:'powers_y',tier,id:`sqrty-${k}-${r0}`,rhsTex:`${k}${V.x}\\sqrt{${V.y}}`,f:(x,y)=>k*x*Math.sqrt(y),x0:R(0),y0:R(y0),solution:sol,
  sepText:`Divide by ${m(`\\sqrt{${V.y}}`)}.`,sepTex:`${V.y}^{-\\frac{1}{2}}\\,d${V.y}=${k}${V.x}\\,d${V.x}`,intTex:[`2\\sqrt{${V.y}}=${termTex(Q(k,2),`${V.x}^{2}`,true)}+C`],
  icTex:[`2\\sqrt{${y0}}=0+C\\quad\\Longrightarrow\\quad C=${2*r0}`],
  solveText:`Divide by 2: ${m(`\\sqrt{${V.y}}=${innerTex}`)}. A square root is never negative, and ${m(innerTex)} is positive for every ${m(V.x)}, so squaring gives a valid solution everywhere.`,solveTex:[],
  lo:NINF,hi:INF,why:[`${m(innerTex)} is always positive, so ${m(`\\sqrt{${V.y}}=${innerTex}`)} holds for every ${m(V.x)} and the solution satisfies the equation everywhere.`]});
}

// ---------- family 3: logarithmic and rational ----------
function famLogRational(tier){
 const V=vars();
 const kind=tier==='intermediate'?pick(['y2overx','lnx_over_xy']):pick(['y2overx','y_over_xlnx','theta']);
 if(kind==='y2overx'||kind==='theta'){ // y' = k y^2 / x -> 1/y = c - k ln|x|; x0 = 1 or -1
  const W=kind==='theta'?{x:'\\theta',y:'r',d:'\\frac{dr}{d\\theta}',vx:'theta',keypad:'unit5-sep-theta'}:V;
  const k=pick([1,1,2,-1]),side=kind==='theta'?1:pick([1,1,-1]),x0v=side,y0q=pick([Q(1,3),Q(1,2),Q(1),Q(-1,2),Q(2),Q(1,4)]);
  const c=qdiv(Q(1),y0q); // 1/y = c - k ln|x| (ln|x0| = 0)
  const bnd=qdiv(c,Q(k)); // ln|x| = c/k
  const eTex=bnd.d===1?(bnd.n===1?'e':`e^{${bnd.n}}`):(bnd.n===1&&bnd.d===2?'\\sqrt{e}':`e^{${qtex(bnd)}}`),eVal=Math.exp(qv(bnd));
  const absX=side>0?W.x:`\\left|${W.x}\\right|`;
  const den=niceSum([{q:c,body:''},{q:Q(-k),body:`\\ln ${absX}`}]);
  const sol={tex:niceRecip(c.d,[{q:Q(c.n),body:''},{q:Q(-k*c.d),body:`\\ln ${absX}`}]),expr:`1/(${qexpr(c)}-${k}*ln(abs(x)))`,f:x=>1/(qv(c)-k*Math.log(Math.abs(x)))};
  // interval: x on the side of x0, excluding 0 and |x| = e^(c/k)
  let lo,hi;const E1=V_(eTex,`e^(${qexpr(bnd)})`,eVal);
  if(side>0){if(eVal>1){lo=R(0);hi=E1;}else{lo=E1;hi=INF;}}
  else{if(eVal>1){lo=neg(E1);hi=R(0);}else{lo=NINF;hi=neg(E1);}}
  const kT=k===1?'':k===-1?'-':k;
  return build({V:W,family:'log_rational',tier,id:`y2x-${kind}-${k}-${side}-${y0q.n}_${y0q.d}`,rhsTex:signedFrac(`${kT}${W.y}^{2}`,W.x),f:(x,y)=>k*y*y/x,x0:R(x0v),y0:R(y0q),solution:sol,
   eqNote:eqNote(W,0,`${W.y}^{2}`),sepTex:`\\frac{d${W.y}}{${W.y}^{2}}=${kT}\\frac{d${W.x}}{${W.x}}`,intTex:[`-\\frac{1}{${W.y}}=${kT}\\ln\\left|${W.x}\\right|+C`],
   icTex:[`${negRecip(y0q)}=${kT}\\ln\\left|${x0v}\\right|+C=0+C\\quad\\Longrightarrow\\quad C=${qtex(qneg(c))}`],
   solveText:`Multiply by −1 and take reciprocals.${c.d===1?'':CLEAR(c.d)}${side>0?` Near ${m(`${W.x}=1`)}, ${m(`${W.x}>0`)}, so ${m(`\\ln\\left|${W.x}\\right|=\\ln ${W.x}`)}.`:''}`,solveTex:[`\\frac{1}{${W.y}}=${den}`],lo,hi,
   why:[`The differential equation divides by ${m(W.x)}, so ${m(`${W.x}\\ne 0`)}, and ${m(`\\ln\\left|${W.x}\\right|`)} requires the same.`,`The solution is undefined where ${m(`${den}=0`)}, that is where ${m(`\\ln\\left|${W.x}\\right|=${qtex(bnd)}`)}, so ${m(`\\left|${W.x}\\right|=${eTex}`)}.`]});
 }
 if(kind==='lnx_over_xy'){ // y' = ln x/(x y), x0 = 1 -> y^2 = (ln x)^2 + y0^2
  const y0=pick([1,2,3,-1,-2,-3]),C=y0*y0;
  const sgn=y0>0?'':'-';
  const sol={tex:`${sgn}\\sqrt{\\left(\\ln ${V.x}\\right)^{2}+${C}}`,expr:`${sgn}sqrt(ln(x)^2+${C})`,f:x=>Math.sign(y0)*Math.sqrt(Math.log(x)**2+C)};
  return build({V,family:'log_rational',tier,id:`lnxy-${y0}`,rhsTex:`\\frac{\\ln ${V.x}}{${V.x}${V.y}}`,f:(x,y)=>Math.log(x)/(x*y),x0:R(1),y0:R(y0),solution:sol,branch:true,
   sepText:`Multiply both sides by ${m(`${V.y}\\,d${V.x}`)}.`,sepTex:`${V.y}\\,d${V.y}=\\frac{\\ln ${V.x}}{${V.x}}\\,d${V.x}`,
   intText:`For the right side, let ${m(`u=\\ln ${V.x}`)}, so ${m(`du=\\frac{1}{${V.x}}\\,d${V.x}`)}.`,intTex:[`\\frac{${V.y}^{2}}{2}=\\frac{\\left(\\ln ${V.x}\\right)^{2}}{2}+C`],
   icTex:[`\\frac{\\left(${y0}\\right)^{2}}{2}=\\frac{\\left(\\ln 1\\right)^{2}}{2}+C\\quad\\Longrightarrow\\quad C=${qtex(Q(C,2))}`],
   solveText:`Multiply by 2: ${m(`${V.y}^{2}=\\left(\\ln ${V.x}\\right)^{2}+${C}`)}. The initial value is ${y0>0?'positive':'negative'}, so take the ${y0>0?'positive':'negative'} square root.`,solveTex:[],
   lo:R(0),hi:INF,why:[`${m(`\\ln ${V.x}`)} requires ${m(`${V.x}>0`)}. The radicand ${m(`\\left(\\ln ${V.x}\\right)^{2}+${C}`)} is always positive, so ${m(`${V.y}\\ne 0`)} and the equation holds for every ${m(`${V.x}>0`)}.`]});
 }
 // y' = k y/(x ln x): y = y0 (ln x)^k with x0 = e (or 1/e)
 const k=pick([1,2,1]),inv=pick([false,false,true]),y0=nz(-4,5);
 const x0=inv?V_('\\frac{1}{e}','1/e',1/Math.E):V_('e','e',Math.E);
 const A=inv&&k%2===1?-y0:y0;// (ln x0)^k = (-1)^k
 const pw=k===1?`\\ln ${V.x}`:`\\left(\\ln ${V.x}\\right)^{${k}}`;
 const sol={tex:`${A===1?'':A===-1?'-':A}${pw}`,expr:`(${A})*ln(x)^${k}`,f:x=>A*Math.log(x)**k};
 const kT=k===1?'':k;
 return build({V,family:'log_rational',tier,id:`xlnx-${k}-${inv}-${y0}`,rhsTex:`\\frac{${kT}${V.y}}{${V.x}\\ln ${V.x}}`,f:(x,y)=>k*y/(x*Math.log(x)),x0,y0:R(y0),solution:sol,
  eqNote:eqNote(V,0,V.y),sepTex:`\\frac{d${V.y}}{${V.y}}=\\frac{${kT||1}}{${V.x}\\ln ${V.x}}\\,d${V.x}`,intText:`For the right side, let ${m(`u=\\ln ${V.x}`)}, so ${m(`du=\\frac{1}{${V.x}}\\,d${V.x}`)}.`,
  intTex:[`\\ln\\left|${V.y}\\right|=${kT}\\ln\\left|\\ln ${V.x}\\right|+C`],
  icTex:[`\\ln\\left|${y0}\\right|=${kT}\\ln\\left|\\ln ${x0.tex}\\right|+C=0+C\\quad\\Longrightarrow\\quad C=${Math.abs(y0)===1?'0':`\\ln ${Math.abs(y0)}`}`],
  solveText:`Exponentiate: ${m(`\\left|${V.y}\\right|=${Math.abs(y0)===1?'':Math.abs(y0)}\\left|\\ln ${V.x}\\right|${k===1?'':`^{${k}}`}`)}; the sign is fixed by the initial point, where ${m(`\\ln ${x0.tex}=${inv?-1:1}`)}.`,solveTex:[],
  lo:inv?R(0):R(1),hi:inv?R(1):INF,
  why:[`${m(`\\ln ${V.x}`)} requires ${m(`${V.x}>0`)}, and the differential equation divides by ${m(`\\ln ${V.x}`)}, which is 0 at ${m(`${V.x}=1`)}. The formula for the solution is defined at ${m(`${V.x}=1`)}, but the differential equation is not.`]});
}

// ---------- family 4: trigonometric ----------
function famTrig(tier){
 const V=vars();
 const kind=tier==='foundational'?'cos2y':tier==='intermediate'?pick(['cos2y','y2sinx','cosx_cosy']):pick(['y2sinx','cosx_cosy','x_siny','tany']);
 if(kind==='cos2y'){ // y' = k cos^2 y -> y = atan(kx + C)
  const k=nz(-3,3),x0v=pick([0,1,-1]),y0=pick([[Q(0),0,'0'],[Q(1),Math.PI/4,'\\frac{\\pi}{4}'],[Q(-1),-Math.PI/4,'-\\frac{\\pi}{4}']]);
  const C=qsub(y0[0],Q(k*x0v));const inner=new Poly([C,k]),innerTex=nicePoly(inner,V.x);
  const sol={tex:`\\tan^{-1}\\left(${innerTex}\\right)`,expr:`atan(${inner.expr()})`,f:x=>Math.atan(inner.f(x))};
  const kT=k===1?'':k===-1?'-':k;
  return build({V,family:'trig',tier,id:`cos2-${k}-${x0v}-${y0[2]}`,rhsTex:`${kT}\\cos^{2}${V.y}`,f:(x,y)=>k*Math.cos(y)**2,x0:R(x0v),y0:V_(y0[2],`atan(${qexpr(y0[0])})`,y0[1]),solution:sol,
   sepText:`Divide by ${m(`\\cos^{2}${V.y}`)} and use ${m(`\\frac{1}{\\cos^{2}${V.y}}=\\sec^{2}${V.y}`)}.`,sepTex:`\\sec^{2}${V.y}\\,d${V.y}=${kT===''||kT==='-'?kT:kT+'\\,'}d${V.x}`,
   intTex:[`\\tan ${V.y}=${termTex(Q(k),V.x,true)}+C`],icTex:[`\\tan\\left(${y0[2]}\\right)=${qtex(Q(k*x0v))}+C\\quad\\Longrightarrow\\quad C=${qtex(C)}`],
   solveText:`The initial value ${m(`${V.y}=${y0[2]}`)} lies in ${m('\\left(-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right)')}, the range of ${m('\\tan^{-1}')}, so take the inverse tangent.`,solveTex:[`\\tan ${V.y}=${innerTex}`],
   lo:NINF,hi:INF,why:[`${m('\\tan^{-1}')} is defined for every real number, and ${m(`\\cos ${V.y}`)} is never 0 for this solution because ${m(V.y)} stays strictly between ${m('-\\frac{\\pi}{2}')} and ${m('\\frac{\\pi}{2}')}.`]});
 }
 if(kind==='y2sinx'){ // y' = y^2 sin x, y(0)=y0 -> y = 1/(cos x - C), C = 1 - 1/y0
  const opt=pick([[Q(2),Q(1,2),'\\frac{\\pi}{3}',Math.PI/3],[Q(1),Q(0),'\\frac{\\pi}{2}',Math.PI/2],[Q(2,3),Q(-1,2),'\\frac{2\\pi}{3}',2*Math.PI/3],[Q(1,2),Q(-1),'\\pi',Math.PI],[Q(-1),Q(2),null,null],[Q(1,3),Q(-2),null,null]]);
  const [y0q,C,bTex,bVal]=opt;const den=`\\cos ${V.x}${qzero(C)?'':termTex(qneg(C),'')}`;
  const sol={tex:C.d===1?`\\frac{1}{${den}}`:`\\frac{${C.d}}{${C.d}\\cos ${V.x}${termTex(Q(-C.n),'')}}`,expr:`1/(cos(x)-(${qexpr(C)}))`,f:x=>1/(Math.cos(x)-qv(C))};
  const lo=bTex?V_(`-${bTex}`,`-(${bVal})`,-bVal):NINF,hi=bTex?V_(bTex,String(bVal),bVal):INF;
  if(bTex){lo.expr=`-acos(${qexpr(C)})`;hi.expr=`acos(${qexpr(C)})`;}
  return build({V,family:'trig',tier,id:`y2sin-${y0q.n}_${y0q.d}`,rhsTex:`${V.y}^{2}\\sin ${V.x}`,f:(x,y)=>y*y*Math.sin(x),x0:R(0),y0:R(y0q),solution:sol,
   eqNote:eqNote(V,0,`${V.y}^{2}`),sepTex:`\\frac{d${V.y}}{${V.y}^{2}}=\\sin ${V.x}\\,d${V.x}`,intTex:[`-\\frac{1}{${V.y}}=-\\cos ${V.x}+C`],
   icTex:[`${negRecip(y0q)}=-\\cos 0+C\\quad\\Longrightarrow\\quad C=${qtex(qsub(Q(1),qdiv(Q(1),y0q)))}`],
   solveText:'Multiply by −1 and take reciprocals.'+(C.d===1?'':CLEAR(C.d)),solveTex:[`\\frac{1}{${V.y}}=${den}`],lo,hi,
   why:bTex?[`The solution is undefined where ${m(`\\cos ${V.x}=${qtex(C)}`)}. The solutions of that equation closest to ${m(`${V.x}=0`)} are ${m(`${V.x}=\\pm ${bTex}`)}.`]:[`${m(`\\cos ${V.x}`)} is between −1 and 1, so ${m(den)} is never 0 and the solution is defined for every ${m(V.x)}.`]});
 }
 if(kind==='cosx_cosy'){ // y' = k cos x / cos y, y(0)=y0 -> y = asin(k sin x + s0)
  const opt=pick([[Q(1),Q(1,2),'\\frac{\\pi}{6}',['-\\frac{7\\pi}{6}','\\frac{\\pi}{6}'],[-7*Math.PI/6,Math.PI/6]],[Q(1,2),Q(-1,2),'-\\frac{\\pi}{6}',['-\\frac{\\pi}{2}','\\frac{3\\pi}{2}'],[-Math.PI/2,3*Math.PI/2]],[Q(2),Q(0),'0',['-\\frac{\\pi}{6}','\\frac{\\pi}{6}'],[-Math.PI/6,Math.PI/6]],[Q(1,2),Q(0),'0',null,null],[Q(1,2),Q(1,2),'\\frac{\\pi}{6}',['-\\frac{3\\pi}{2}','\\frac{\\pi}{2}'],[-3*Math.PI/2,Math.PI/2]],[Q(1),Q(-1,2),'-\\frac{\\pi}{6}',['-\\frac{\\pi}{6}','\\frac{7\\pi}{6}'],[-Math.PI/6,7*Math.PI/6]]]);
  const [kq,s0,y0tex,bt,bv]=opt;
  const inner=`${termTex(kq,`\\sin ${V.x}`,true)}${qzero(s0)?'':termTex(s0,'')}`;
  const sol={tex:`\\sin^{-1}\\left(${inner}\\right)`,expr:`asin(${qexpr(kq)}*sin(x)+(${qexpr(s0)}))`,f:x=>Math.asin(qv(kq)*Math.sin(x)+qv(s0))};
  const lo=bt?V_(bt[0],String(bv[0]),bv[0]):NINF,hi=bt?V_(bt[1],String(bv[1]),bv[1]):INF;
  const kT=qv(kq)===1?'':qtex(kq);
  return build({V,family:'trig',tier,id:`cosxy-${kq.n}_${kq.d}-${s0.n}_${s0.d}`,rhsTex:`\\frac{${kq.n===1?'':kq.n}\\cos ${V.x}}{${kq.d===1?'':kq.d}\\cos ${V.y}}`, // k = n/d written as n cos x over d cos y
   f:(x,y)=>qv(kq)*Math.cos(x)/Math.cos(y),x0:R(0),y0:V_(y0tex,`asin(${qexpr(s0)})`,Math.asin(qv(s0))),solution:sol,
   sepText:`Multiply both sides by ${m(`\\cos ${V.y}\\,d${V.x}`)}.`,sepTex:`\\cos ${V.y}\\,d${V.y}=${kT}\\cos ${V.x}\\,d${V.x}`,intTex:[`\\sin ${V.y}=${termTex(kq,`\\sin ${V.x}`,true)}+C`],
   icTex:[`\\sin\\left(${y0tex}\\right)=${kT}\\sin 0+C\\quad\\Longrightarrow\\quad C=${qtex(s0)}`],
   solveText:`The initial value ${m(`${y0tex}`)} lies in ${m('\\left(-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right)')}, so ${m(V.y)} is the inverse sine.`,solveTex:[`\\sin ${V.y}=${inner}`],lo,hi,
   why:bt?[`${m('\\sin^{-1}')} needs its input between −1 and 1, and the differential equation divides by ${m(`\\cos ${V.y}`)}, which is 0 when the input is exactly ${m('\\pm 1')}. So the solution requires ${m(`-1<${inner}<1`)}.`,`Around ${m(`${V.x}=0`)} this holds until ${m(`${V.x}=${bt[0]}`)} on the left and ${m(`${V.x}=${bt[1]}`)} on the right.`]
    :[`${m(inner)} stays strictly between −1 and 1 for every ${m(V.x)}, so the solution and the differential equation are defined everywhere.`]});
 }
 if(kind==='x_siny'){ // y' = k x / sin y, y(0) = pi/2 -> y = acos(-k x^2/2)
  const k=pick([1,2,4]),r=sqrtQ(Q(2,k));
  const sol={tex:`\\cos^{-1}\\left(${termTex(Q(-k,2),`${V.x}^{2}`,true)}\\right)`,expr:`acos(-(${k}/2)*x^2)`,f:x=>Math.acos(-k*x*x/2)};
  return build({V,family:'trig',tier,id:`xsin-${k}`,rhsTex:`\\frac{${k===1?'':k}${V.x}}{\\sin ${V.y}}`,f:(x,y)=>k*x/Math.sin(y),x0:R(0),y0:V_('\\frac{\\pi}{2}','pi/2',Math.PI/2),solution:sol,
   sepText:`Multiply both sides by ${m(`\\sin ${V.y}\\,d${V.x}`)}.`,sepTex:`\\sin ${V.y}\\,d${V.y}=${k===1?'':k}${V.x}\\,d${V.x}`,intTex:[`-\\cos ${V.y}=${termTex(Q(k,2),`${V.x}^{2}`,true)}+C`],
   icTex:[`-\\cos\\frac{\\pi}{2}=0+C\\quad\\Longrightarrow\\quad C=0`],
   solveText:`So ${m(`\\cos ${V.y}=${termTex(Q(-k,2),`${V.x}^{2}`,true)}`)}. The initial value ${m('\\frac{\\pi}{2}')} lies in ${m('(0,\\pi)')}, the range of ${m('\\cos^{-1}')}, so take the inverse cosine.`,solveTex:[],
   lo:neg(r),hi:r,why:[`${m('\\cos^{-1}')} needs its input between −1 and 1, and the differential equation divides by ${m(`\\sin ${V.y}`)}, which is 0 when the input is ${m('\\pm 1')}. So ${m(`${termTex(Q(k,2),`${V.x}^{2}`,true)}<1`)}, which gives ${m(`-${r.tex}<${V.x}<${r.tex}`)}.`]});
 }
 // y' = 2kx tan y, y(0) = pi/6 or pi/4 -> sin y = s0 e^{k x^2}
 const k=pick([1,2]),opt=pick([[Q(1,2),'\\frac{\\pi}{6}',Math.PI/6,'\\ln 2','ln(2)',Math.LN2],[null,'\\frac{\\pi}{4}',Math.PI/4,'\\frac{1}{2}\\ln 2','ln(2)/2',Math.LN2/2]]);
 const s0tex=opt[0]?'\\frac{1}{2}':'\\frac{\\sqrt{2}}{2}',s0=opt[0]?0.5:Math.SQRT1_2;
 const bound=opt[5]/k;// x^2 < ln(1/s0)/k
 const bTex=k===1?`\\sqrt{${opt[3]}}`:`\\sqrt{${opt[0]?'\\frac{\\ln 2}{2}':'\\frac{\\ln 2}{4}'}}`,bExpr=`sqrt(${opt[4]}/${k})`;
 const ek=k===1?`e^{${V.x}^{2}}`:`e^{2${V.x}^{2}}`;
 const sol={tex:`\\sin^{-1}\\left(${s0tex}${ek}\\right)`,expr:`asin(${s0}*e^(${k}*x^2))`,f:x=>Math.asin(s0*Math.exp(k*x*x))};
 return build({V,family:'trig',tier,id:`tany-${k}-${opt[1]}`,rhsTex:`${2*k}${V.x}\\tan ${V.y}`,f:(x,y)=>2*k*x*Math.tan(y),x0:R(0),y0:V_(opt[1],String(opt[2]),opt[2]),solution:sol,
  eqNote:eqNote(V,0,`\\tan ${V.y}`),sepTex:`\\cot ${V.y}\\,d${V.y}=${2*k}${V.x}\\,d${V.x}`,intText:`${m(`\\int\\cot ${V.y}\\,d${V.y}=\\ln\\left|\\sin ${V.y}\\right|`)}.`,
  intTex:[`\\ln\\left|\\sin ${V.y}\\right|=${k===1?'':k}${V.x}^{2}+C`],icTex:[`\\ln\\left(\\sin ${opt[1]}\\right)=0+C\\quad\\Longrightarrow\\quad C=\\ln ${s0tex}`],
  solveText:`Exponentiate: ${m(`\\sin ${V.y}=${s0tex}${ek}`)} (positive at the initial point). The initial value lies in ${m('\\left(-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right)')}, so take the inverse sine.`,solveTex:[],
  lo:V_(`-${bTex}`,`-${bExpr}`,-Math.sqrt(bound)),hi:V_(bTex,bExpr,Math.sqrt(bound)),
  why:[`${m('\\sin^{-1}')} needs ${m(`${s0tex}${ek}\\le 1`)}, and ${m(`\\tan ${V.y}`)} is undefined when ${m(`${V.y}=\\frac{\\pi}{2}`)}, so ${m(`${s0tex}${ek}<1`)}. That means ${m(`${k===1?'':k}${V.x}^{2}<${opt[0]?'\\ln 2':'\\frac{1}{2}\\ln 2'}`)}.`]});
}

// ---------- family 5: exponentials of y ----------
function famExpY(tier){
 const V=vars();
 const kind=tier==='intermediate'?pick(['exmy','quad','xey']):pick(['quad','eyt','cosesin','exmy']);
 if(kind==='exmy'){ // y' = e^{x-y} -> y = ln(e^x + C), C = e^{y0} - 1 at x0 = 0
  const opt=pick([['\\ln 2','ln(2)',Math.LN2,Q(1)],['\\ln 3','ln(3)',Math.log(3),Q(2)],['-\\ln 2','-ln(2)',-Math.LN2,Q(-1,2)],['0','0',0,Q(0)],['1','1',1,null]]);
  if(opt[3]&&qzero(opt[3]))return null;
  const C=opt[3];const Ctex=C?qtex(C):'e - 1',Cval=C?qv(C):Math.E-1;
  const inside=`e^{${V.x}}${C?termTex(C,''):' + e - 1'}`;
  const sol={tex:`\\ln\\left(${inside}\\right)`,expr:`ln(e^x+(${C?qexpr(C):'e-1'}))`,f:x=>Math.log(Math.exp(x)+Cval)};
  const lo=Cval<0?V_(`\\ln ${qtex(qneg(C))}`.replace('\\ln \\frac{1}{2}','-\\ln 2'),`ln(${-Cval})`,Math.log(-Cval)):NINF;
  return build({V,family:'exp_y',tier,id:`exmy-${opt[0]}`,rhsTex:`e^{${V.x}-${V.y}}`,f:(x,y)=>Math.exp(x-y),x0:R(0),y0:V_(opt[0],opt[1],opt[2]),solution:sol,
   sepText:`Write ${m(`e^{${V.x}-${V.y}}=e^{${V.x}}e^{-${V.y}}`)} and multiply both sides by ${m(`e^{${V.y}}`)}.`,sepTex:`e^{${V.y}}\\,d${V.y}=e^{${V.x}}\\,d${V.x}`,intTex:[`e^{${V.y}}=e^{${V.x}}+C`],
   icTex:[`e^{${opt[0]}}=e^{0}+C\\quad\\Longrightarrow\\quad C=${Ctex}`],solveText:'Take the natural log of both sides.',solveTex:[`e^{${V.y}}=${inside}`],
   lo,hi:INF,why:Cval>0?[`${m(inside)} is always positive, so the logarithm is defined for every ${m(V.x)}.`]:[`The logarithm requires ${m(`${inside}>0`)}, so ${m(`e^{${V.x}}>${qtex(qneg(C))}`)}, which means ${m(`${V.x}>${lo.tex}`)}.`]});
 }
 if(kind==='quad'){ // y' = e^{-y}(2x + b), y(x0) = 0 -> y = ln(x^2 + b x + C)
  const b=2*nz(-3,3),x0v=pick([1,2,3,4,5,-1,-2]),C=1-x0v*x0v-b*x0v;const qP=new Poly([C,b,1]),qT=qP.tex(V.x);
  const D=b*b-4*C;const sol={tex:`\\ln\\left(${qT}\\right)`,expr:`ln(${qP.expr()})`,f:x=>Math.log(qP.f(x))};
  let lo=NINF,hi=INF;const why=[];
  if(D<0)why.push(`${m(qT)} is always positive (its discriminant is negative), so the logarithm is defined for every ${m(V.x)}.`);
  else{const h=-b/2,r=sqrtQ(Q(D,4));const rv=r.val;const L=V_(`${h}${h===0?'':''}`,'',0);
   const mk=(sgn)=>{const v=h+sgn*rv;const tex=h===0?(sgn>0?r.tex:`-${r.tex}`):`${h}${sgn>0?' + ':' - '}${r.tex}`;return V_(tex,`${h}+(${sgn})*${r.expr}`,v);};
   const left=mk(-1),right=mk(1);if(Math.abs(x0v-left.val)<1e-9||Math.abs(x0v-right.val)<1e-9)return null;
   if(x0v>right.val)lo=right;else if(x0v<left.val)hi=left;else{lo=left;hi=right;}
   if(x0v>left.val&&x0v<right.val)return null; // quadratic is negative between its roots
   why.push(`The logarithm requires ${m(`${qT}>0`)}. The quadratic is 0 at ${m(`${V.x}=${h===0?'\\pm '+r.tex:`${h}\\pm ${r.tex}`}`)} (quadratic formula) and positive outside those roots.`);}
  const lin=`2${V.x}${b>0?` + ${b}`:` - ${-b}`}`;
  return build({V,family:'exp_y',tier,id:`quad-${b}-${x0v}`,rhsTex:`e^{-${V.y}}\\left(${lin}\\right)`,f:(x,y)=>Math.exp(-y)*(2*x+b),x0:R(x0v),y0:R(0),solution:sol,
   sepText:`Multiply both sides by ${m(`e^{${V.y}}`)}.`,sepTex:`e^{${V.y}}\\,d${V.y}=\\left(${lin}\\right)d${V.x}`,intTex:[`e^{${V.y}}=${new Poly([0,b,1]).tex(V.x)}+C`],
   icTex:[`e^{0}=${new Poly([0,b,1]).tex(`(${x0v})`)}+C\\quad\\Longrightarrow\\quad C=${C}`],solveText:'Take the natural log of both sides.',solveTex:[`e^{${V.y}}=${qT}`],lo,hi,why});
 }
 if(kind==='xey'){ // y' = x e^{y}, y(0)=y0 -> y = -ln(e^{-y0} - x^2/2)
  const opt=pick([['0','0',0,Q(1),'\\sqrt{2}','sqrt(2)'],['-\\ln 2','-ln(2)',-Math.LN2,Q(2),'2','2']]);
  const [y0t,y0e,y0v,A,bt,be]=opt;const inside=`${qtex(A)} - \\frac{${V.x}^{2}}{2}`;
  const sol={tex:`-\\ln\\left(${inside}\\right)`,expr:`-ln(${qexpr(A)}-x^2/2)`,f:x=>-Math.log(qv(A)-x*x/2)};
  const bv=Math.sqrt(2*qv(A));
  return build({V,family:'exp_y',tier,id:`xey-${y0t}`,rhsTex:`${V.x}e^{${V.y}}`,f:(x,y)=>x*Math.exp(y),x0:R(0),y0:V_(y0t,y0e,y0v),solution:sol,
   sepText:`Multiply both sides by ${m(`e^{-${V.y}}`)}.`,sepTex:`e^{-${V.y}}\\,d${V.y}=${V.x}\\,d${V.x}`,intTex:[`-e^{-${V.y}}=\\frac{${V.x}^{2}}{2}+C`],
   icTex:[`-e^{-${negExp(y0t)}}=0+C\\quad\\Longrightarrow\\quad C=-${qtex(A)}`],solveText:`Multiply by −1 and take the natural log.`,solveTex:[`e^{-${V.y}}=${inside}`,`-${V.y}=\\ln\\left(${inside}\\right)`],
   lo:V_(`-${bt}`,`-${be}`,-bv),hi:V_(bt,be,bv),why:[`The logarithm requires ${m(`${inside}>0`)}, so ${m(`${V.x}^{2}<${qtex(qmul(Q(2),A))}`)}.`]});
 }
 if(kind==='eyt'){ // y' = e^{y+x}, y(0)=y0 -> y = -ln(1 + e^{-y0} - e^{x})
  const opt=pick([['0','0',0,'2','2'],['-\\ln 2','-ln(2)',-Math.LN2,'3','3'],['1','1',1,'1+e^{-1}','1+e^(-1)']]);
  const [y0t,y0e,y0v,Kt,Ke]=opt;const K=1+Math.exp(-y0v);
  const sol={tex:`-\\ln\\left(${Kt} - e^{${V.x}}\\right)`,expr:`-ln(${Ke}-e^x)`,f:x=>-Math.log(K-Math.exp(x))};
  const hiT=Kt==='2'?'\\ln 2':Kt==='3'?'\\ln 3':'\\ln\\left(1+e^{-1}\\right)';
  return build({V,family:'exp_y',tier,id:`eyt-${y0t}`,rhsTex:`e^{${V.y}+${V.x}}`,f:(x,y)=>Math.exp(y+x),x0:R(0),y0:V_(y0t,y0e,y0v),solution:sol,
   sepText:`Write ${m(`e^{${V.y}+${V.x}}=e^{${V.y}}e^{${V.x}}`)} and multiply by ${m(`e^{-${V.y}}`)}.`,sepTex:`e^{-${V.y}}\\,d${V.y}=e^{${V.x}}\\,d${V.x}`,intTex:[`-e^{-${V.y}}=e^{${V.x}}+C`],
   icTex:[`-e^{-${negExp(y0t)}}=e^{0}+C\\quad\\Longrightarrow\\quad ${NEG_EXP[y0t]}=1+C\\quad\\Longrightarrow\\quad C=${Kt.includes('+')?`-\\left(${Kt}\\right)`:`-${Kt}`}`],
   solveText:'Multiply by −1, take the natural log, and multiply by −1 again.',solveTex:[`e^{-${V.y}}=${Kt} - e^{${V.x}}`],
   lo:NINF,hi:V_(hiT,`ln(${Ke})`,Math.log(K)),why:[`The logarithm requires ${m(`${Kt} - e^{${V.x}}>0`)}, so ${m(`e^{${V.x}}<${Kt}`)}, which means ${m(`${V.x}<${hiT}`)}.`]});
 }
 // y' = cos x e^{y + sin x}, y(0)=y0 (Extra Separable #2 with the corrected interval)
 const opt=pick([['0','0',0,'2','2'],['\\ln 2','ln(2)',Math.LN2,'\\frac{3}{2}','3/2'],['-\\ln 2','-ln(2)',-Math.LN2,'3','3']]);
 const [y0t,y0e,y0v,Kt,Ke]=opt;const K=1+Math.exp(-y0v),L=Math.log(K);
 const sol={tex:`-\\ln\\left(${Kt} - e^{\\sin ${V.x}}\\right)`,expr:`-ln(${Ke}-e^(sin(x)))`,f:x=>-Math.log(K-Math.exp(Math.sin(x)))};
 const lnK=Kt==='2'?'\\ln 2':Kt==='3'?'\\ln 3':'\\ln\\left(\\frac{3}{2}\\right)',lnKe=`ln(${Ke})`;
 let lo=NINF,hi=INF;const why=[`The logarithm requires ${m(`${Kt} - e^{\\sin ${V.x}}>0`)}, so ${m(`\\sin ${V.x}<${lnK}`)}.`];
 if(L<1){hi=V_(`\\sin^{-1}\\left(${lnK}\\right)`,`asin(${lnKe})`,Math.asin(L));lo=V_(`-\\pi - \\sin^{-1}\\left(${lnK}\\right)`,`-pi-asin(${lnKe})`,-Math.PI-Math.asin(L));
  why.push(`Since ${m(`${lnK}<1`)}, ${m(`\\sin ${V.x}=${lnK}`)} has solutions. Around ${m(`${V.x}=0`)}, ${m(`\\sin ${V.x}`)} first reaches ${m(lnK)} at ${m(`${V.x}=\\sin^{-1}\\left(${lnK}\\right)`)} going right, and at ${m(`${V.x}=-\\pi - \\sin^{-1}\\left(${lnK}\\right)`)} going left (the sine curve's next crossing of that level).`);}
 else why.push(`Since ${m(`${lnK}>1`)} and ${m(`\\sin ${V.x}\\le 1`)}, the condition holds for every ${m(V.x)}.`);
 return build({V,family:'exp_y',tier,id:`cosesin-${y0t}`,rhsTex:`\\left(\\cos ${V.x}\\right)e^{${V.y}+\\sin ${V.x}}`,f:(x,y)=>Math.cos(x)*Math.exp(y+Math.sin(x)),x0:R(0),y0:V_(y0t,y0e,y0v),solution:sol,
  sepText:`Write ${m(`e^{${V.y}+\\sin ${V.x}}=e^{${V.y}}e^{\\sin ${V.x}}`)} and multiply by ${m(`e^{-${V.y}}`)}.`,sepTex:`e^{-${V.y}}\\,d${V.y}=\\cos ${V.x}\\,e^{\\sin ${V.x}}\\,d${V.x}`,
  intText:`For the right side, let ${m(`u=\\sin ${V.x}`)}, so ${m(`du=\\cos ${V.x}\\,d${V.x}`)}.`,intTex:[`-e^{-${V.y}}=e^{\\sin ${V.x}}+C`],
  icTex:[`-e^{-${negExp(y0t)}}=e^{0}+C\\quad\\Longrightarrow\\quad ${NEG_EXP[y0t]}=1+C\\quad\\Longrightarrow\\quad C=-${Kt}`],solveText:'Multiply by −1, take the natural log, and multiply by −1 again.',solveTex:[`e^{-${V.y}}=${Kt} - e^{\\sin ${V.x}}`],lo,hi,why});
}

// ---------- family 6: radicals and branch selection ----------
function famBranch(tier){
 const V=vars();
 const kind=tier==='intermediate'?pick(['circle','shiftroot']):pick(['xplusb','shiftroot','circle','exp_sq']);
 if(kind==='circle'){ // y' = -x/y -> y = ±sqrt(R^2 - x^2)
  const opt=pick([[3,4],[4,3],[0,2],[1,1],[2,1],[1,2],[0,-3],[3,-4],[-1,-1],[2,-2]]);const [x0v,y0v]=opt;const R2=x0v*x0v+y0v*y0v,r=sqrtQ(Q(R2));
  const s=y0v>0?'':'-';const sol={tex:`${s}\\sqrt{${R2} - ${V.x}^{2}}`,expr:`${s}sqrt(${R2}-x^2)`,f:x=>Math.sign(y0v)*Math.sqrt(R2-x*x)};
  return build({V,family:'radical_branch',tier,id:`circ-${x0v}-${y0v}`,rhsTex:`-\\frac{${V.x}}{${V.y}}`,f:(x,y)=>-x/y,x0:R(x0v),y0:R(y0v),solution:sol,branch:true,
   sepText:`Multiply both sides by ${m(`${V.y}\\,d${V.x}`)}.`,sepTex:`${V.y}\\,d${V.y}=-${V.x}\\,d${V.x}`,intTex:[`\\frac{${V.y}^{2}}{2}=-\\frac{${V.x}^{2}}{2}+C`],
   icTex:[`\\frac{\\left(${y0v}\\right)^{2}}{2}=-\\frac{\\left(${x0v}\\right)^{2}}{2}+C\\quad\\Longrightarrow\\quad C=${qtex(Q(R2,2))}`],
   solveText:`Multiply by 2: ${m(`${V.y}^{2}=${R2} - ${V.x}^{2}`)} (a circle). The initial value ${m(`${V.y}=${y0v}`)} is ${y0v>0?'positive':'negative'}, so the solution is the ${y0v>0?'upper':'lower'} half: take the ${y0v>0?'positive':'negative'} square root.`,solveTex:[],
   lo:neg(r),hi:r,why:[`The radicand must be positive: the square root needs ${m(`${R2} - ${V.x}^{2}\\ge 0`)}, and the differential equation divides by ${m(V.y)}, which is 0 when ${m(`${V.x}=\\pm ${r.tex}`)}.`]});
 }
 if(kind==='shiftroot'){ // y' = x/(y - a) -> y = a ± sqrt(x^2 + C)
  const a=nz(-3,3),x0v=pick([0,1,2,3]),dy=pick([1,2,3,-1,-2,-3]),y0v=a+dy;const C=dy*dy-x0v*x0v;if(C===0)return null;
  const inner=new Poly([C,0,1]),iT=inner.tex(V.x),s=dy>0?' + ':' - ';
  const sol={tex:`${a}${s}\\sqrt{${iT}}`,expr:`${a}+(${Math.sign(dy)})*sqrt(${inner.expr()})`,f:x=>a+Math.sign(dy)*Math.sqrt(inner.f(x))};
  let lo=NINF,hi=INF;const why=[];const ya=`${V.y}${a>0?` - ${a}`:` + ${-a}`}`;
  if(C>0)why.push(`${m(iT)} is always positive, so ${m(`${V.y}\\ne ${a}`)} and the solution is valid for every ${m(V.x)}.`);
  else{const r=sqrtQ(Q(-C));if(x0v>r.val)lo=r;else return null;why.push(`The square root needs ${m(`${iT}\\ge 0`)}, and the differential equation divides by ${m(ya)}, which is 0 when the radicand is 0, at ${m(`${V.x}=\\pm ${r.tex}`)}. So ${m(`${iT}>0`)}.`);}
  return build({V,family:'radical_branch',tier,id:`shift-${a}-${x0v}-${dy}`,rhsTex:`\\frac{${V.x}}{${ya}}`,f:(x,y)=>x/(y-a),x0:R(x0v),y0:R(y0v),solution:sol,branch:true,
   sepText:`Multiply both sides by ${m(`\\left(${ya}\\right)d${V.x}`)}.`,sepTex:`\\left(${ya}\\right)d${V.y}=${V.x}\\,d${V.x}`,intTex:[`\\frac{\\left(${ya}\\right)^{2}}{2}=\\frac{${V.x}^{2}}{2}+C`],
   icTex:[`\\frac{\\left(${dy}\\right)^{2}}{2}=\\frac{\\left(${x0v}\\right)^{2}}{2}+C\\quad\\Longrightarrow\\quad C=${qtex(Q(C,2))}`],
   solveText:`Multiply by 2: ${m(`\\left(${ya}\\right)^{2}=${iT}`)}. At the initial point ${m(`${ya}=${dy}`)} is ${dy>0?'positive':'negative'}, so take the ${dy>0?'positive':'negative'} square root.`,solveTex:[`${ya}=${dy>0?'':'-'}\\sqrt{${iT}}`],lo,hi,why});
 }
 if(kind==='xplusb'){ // y' = (x + b)/y (Test Review l)
  const b=nz(-3,3),x0v=pick([0,1,-1,2]),y0v=pick([2,3,-2,-3,1,-1]);const C=y0v*y0v-x0v*x0v-2*b*x0v;
  const inner=new Poly([C,2*b,1]),iT=inner.tex(V.x);const D=4*b*b-4*C;
  const sgn=y0v>0?'':'-';const sol={tex:`${sgn}\\sqrt{${iT}}`,expr:`${sgn}sqrt(${inner.expr()})`,f:x=>Math.sign(y0v)*Math.sqrt(inner.f(x))};
  let lo=NINF,hi=INF;const why=[];
  if(D<0)why.push(`${m(iT)} is always positive (negative discriminant), so the solution is defined and nonzero for every ${m(V.x)}.`);
  else if(D===0)return null;
  else{const r=sqrtQ(Q(D,4)),h=-b;const mk=s=>V_(h===0?(s>0?r.tex:`-${r.tex}`):`${h}${s>0?' + ':' - '}${r.tex}`,`${h}+(${s})*${r.expr}`,h+s*r.val);const L=mk(-1),Rr=mk(1);
   if(x0v>Rr.val)lo=Rr;else if(x0v<L.val)hi=L;else return null;
   why.push(`The square root needs ${m(`${iT}\\ge 0`)}, and the differential equation divides by ${m(V.y)}, so ${m(`${iT}>0`)}. The radicand is 0 at ${m(`${V.x}=${h===0?'\\pm '+r.tex:`${h}\\pm ${r.tex}`}`)}.`);}
  const lin=`${V.x}${b>0?` + ${b}`:` - ${-b}`}`;
  return build({V,family:'radical_branch',tier,id:`xpb-${b}-${x0v}-${y0v}`,rhsTex:`\\frac{${lin}}{${V.y}}`,f:(x,y)=>(x+b)/y,x0:R(x0v),y0:R(y0v),solution:sol,branch:true,
   sepText:`Multiply both sides by ${m(`${V.y}\\,d${V.x}`)}.`,sepTex:`${V.y}\\,d${V.y}=\\left(${lin}\\right)d${V.x}`,intTex:[`\\frac{${V.y}^{2}}{2}=\\frac{${V.x}^{2}}{2}${termTex(Q(b),V.x)}+C`],
   icTex:[`\\frac{\\left(${y0v}\\right)^{2}}{2}=${x0v===0?'0':`\\frac{\\left(${x0v}\\right)^{2}}{2}${termTex(Q(b),`(${x0v})`)}`}+C\\quad\\Longrightarrow\\quad C=${qtex(Q(C,2))}`],
   solveText:`Multiply by 2: ${m(`${V.y}^{2}=${iT}`)}. The initial value ${m(`${V.y}=${y0v}`)} is ${y0v>0?'positive':'negative'}, so take the ${y0v>0?'positive':'negative'} square root.`,solveTex:[],lo,hi,why});
 }
 // y' = x (y^2 + 1)/y, y(0)=y0 -> y = ±sqrt((y0^2+1) e^{x^2} - 1)
 const y0v=pick([1,2,-1,-2,3,-3]),A=y0v*y0v+1;const sgn=y0v>0?'':'-';
 const sol={tex:`${sgn}\\sqrt{${A}e^{${V.x}^{2}} - 1}`,expr:`${sgn}sqrt(${A}*e^(x^2)-1)`,f:x=>Math.sign(y0v)*Math.sqrt(A*Math.exp(x*x)-1)};
 return build({V,family:'radical_branch',tier,id:`expsq-${y0v}`,rhsTex:`\\frac{${V.x}\\left(${V.y}^{2}+1\\right)}{${V.y}}`,f:(x,y)=>x*(y*y+1)/y,x0:R(0),y0:R(y0v),solution:sol,branch:true,
  sepText:`Multiply by ${m(`\\frac{${V.y}}{${V.y}^{2}+1}`)} and by ${m(`d${V.x}`)}.`,sepTex:`\\frac{${V.y}}{${V.y}^{2}+1}\\,d${V.y}=${V.x}\\,d${V.x}`,intText:`On the left, let ${m(`u=${V.y}^{2}+1`)}, so ${m(`du=2${V.y}\\,d${V.y}`)}.`,
  intTex:[`\\frac{1}{2}\\ln\\left(${V.y}^{2}+1\\right)=\\frac{${V.x}^{2}}{2}+C`],icTex:[`\\frac{1}{2}\\ln\\left(${A}\\right)=0+C\\quad\\Longrightarrow\\quad C=\\frac{1}{2}\\ln ${A}`],
  solveText:`Multiply by 2 and exponentiate: ${m(`${V.y}^{2}+1=${A}e^{${V.x}^{2}}`)}. The initial value is ${y0v>0?'positive':'negative'}, so take the ${y0v>0?'positive':'negative'} square root.`,solveTex:[],
  lo:NINF,hi:INF,why:[`${m(`${A}e^{${V.x}^{2}} - 1\\ge ${A-1}>0`)}, so ${m(`${V.y}\\ne 0`)} and the solution is valid for every ${m(V.x)}.`]});
}

const FAMILIES={
 product:{weight:20,tiers:['foundational','intermediate','challenging'],make:famProduct},
 powers_y:{weight:20,tiers:['foundational','intermediate','challenging'],make:famPower},
 log_rational:{weight:15,tiers:['intermediate','challenging'],make:famLogRational},
 trig:{weight:15,tiers:['foundational','intermediate','challenging'],make:famTrig},
 exp_y:{weight:15,tiers:['intermediate','challenging'],make:famExpY},
 radical_branch:{weight:15,tiers:['intermediate','challenging'],make:famBranch},
};
const engine=U.makeEngine('separable',FAMILIES);
const fns=[['sin','sin'],['cos','cos'],['sin⁻¹','asin'],['cos⁻¹','acos'],['tan⁻¹','atan'],['|u|','abs']];
U.profile('unit5-sep-x',{fraction:true,radical:true,cubeRoot:true,exponent:true,logarithm:true,constants:['e'],variables:['x'],functions:fns,arithmetic:true,parentheses:true});
U.profile('unit5-sep-t',{fraction:true,radical:true,cubeRoot:true,exponent:true,logarithm:true,constants:['e'],variables:['t'],functions:fns,arithmetic:true,parentheses:true});
U.profile('unit5-sep-theta',{fraction:true,logarithm:true,variables:['θ'],arithmetic:true,parentheses:true});
U.profile('unit5-sep-interval',{fraction:true,radical:true,exponent:true,logarithm:true,constants:['pi','e'],functions:[['sin⁻¹','asin']],arithmetic:true,parentheses:true,list:true,interval:true,brackets:false,union:false,infinity:true});
window.BatchMathUnit5Separable=Object.freeze({make:engine.make,FAMILIES,weights:engine.weights});
U.register('separable-differential-equations',o=>engine.make(o||{}));
})();
