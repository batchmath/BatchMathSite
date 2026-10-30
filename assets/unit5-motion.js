/* BatchMath v12.8.X — Unit 5 engine 2: Motion Problems.
   Families (mixed mode): recover velocity or position 25%, displacement versus total distance 25%,
   direction / rest / speed 20%, calculator motion 15% (v12.8.X: position 4, total distance 5, speed 3,
   direction 3, each with all three tiers), connected multi-part problems 15%.
   Total distance is always the integral of |v|: every zero of v in the interval is found and the signed
   pieces are added in absolute value. Direction comes from the sign of v; speed increases when v and a
   have the same sign. */
(function(){
'use strict';
const U=window.BatchMathUnit5Core;
if(!U)return;
const {Q,qv,qadd,qsub,qmul,qdiv,qneg,qzero,qtex,qexpr,ri,pick,nz,shuffle,E,ex,eadd,esub,escale,etex,eexpr,K,termTex,step,eq,m,question,problem,fix,integrate,roots,Poly,trigExact,xRat,xPi,piTexQ}=U;
const evE=U.eval;

const CONTEXTS=[
 {intro:'A particle moves along the x-axis.',pos:'x',dirs:['right','left'],unit:'feet',rate:'feet per second',acc:'feet per second per second'},
 {intro:'A particle moves along a horizontal line.',pos:'s',dirs:['right','left'],unit:'meters',rate:'meters per second',acc:'meters per second per second'},
 {intro:'An object moves along a straight track.',pos:'s',dirs:['right','left'],unit:'centimeters',rate:'centimeters per second',acc:'centimeters per second per second'},
];
const ctx=()=>pick(CONTEXTS);
const sgnWord=v=>v>0?'positive':'negative';
const listJoin=a=>a.length<2?a.join(''):a.length===2?`${a[0]} and ${a[1]}`:`${a.slice(0,-1).join(', ')}, and ${a[a.length-1]}`;
const nice=q=>qtex(q);
const plusC=(tex)=>`${tex}+C`;
const vTex=(p)=>p.tex('t');
const solveConstant=(F,t0,v0,name)=>{ // returns C with F(t0)+C=v0
 const val=F.at(t0);const C=qsub(Q(v0),val);return{C,val};
};
const tq=t=>typeof t==='number'?Q(t):t;
const intTex=(p)=>p.tex('t');

// ---------- explanation pieces ----------
function integrateStep(from,toName,fromName,poly,anti,t0,y0,C,{value=null,note=''}={}){
 // e.g. v(t) = ∫a(t) dt = ... + C, then use v(t0) = y0
 const subTex=anti.tex(`(${qtex(tq(t0))})`).replace(/\{\(([^(){}]*)\)\}/g,'{$1}');
 return step(`Find ${m(`${toName}(t)`)}.`,`${note}${toName==='v'?'Velocity':'Position'} is an antiderivative of ${fromName==='a'?'acceleration':'velocity'}.`,
  `${toName}(t)=\\int ${fromName}(t)\\,dt=\\int\\left(${poly.tex('t')}\\right)dt=${plusC(anti.tex('t'))}`)+
  step(`Use ${m(`${toName}(${qtex(tq(t0))})=${y0}`)}.`,'',`${y0}=${subTex}+C=${qtex(anti.at(t0))}+C`,`C=${qtex(C)}`,`${toName}(t)=${anti.add(new Poly([C])).tex('t')}`);
}

// ---------- family 1: recover velocity or position ----------
function famRecover(tier){
 const C0=ctx();
 if(tier==='foundational'){
  if(U.rand()<0.5){ // constant acceleration, two values (Integral Motion #1)
   const a=nz(-6,6),v0=nz(-8,8),s0=ri(-6,10),T1=ri(1,4),T2=ri(1,5);
   const aP=new Poly([a]),vP=aP.integ(v0),sP=vP.integ(s0);
   const vT=vP.at(T1),sT=sP.at(T2);
   const A=step('Find the velocity.',`Integrate the acceleration and use ${m(`v(0)=${v0}`)}: the constant is the initial velocity.`,`v(t)=\\int ${a}\\,dt=${plusC(new Poly([0,a]).tex('t'))}`,`v(0)=C=${v0}\\quad\\Longrightarrow\\quad v(t)=${vP.tex('t')}`)+step(`Evaluate at ${m(`t=${T1}`)}.`,'',`v(${T1})=${vP.tex(`(${T1})`)}=${qtex(vT)}`);
   const B=step('Find the position.',`Integrate the velocity and use ${m(`s(0)=${s0}`)}.`,`s(t)=\\int\\left(${vP.tex('t')}\\right)dt=${plusC(vP.integ(0).tex('t'))}`,`s(0)=C=${s0}\\quad\\Longrightarrow\\quad s(t)=${sP.tex('t')}`)+step(`Evaluate at ${m(`t=${T2}`)}.`,'',`s(${T2})=${qtex(sT)}`);
   return problem({engine:'motion',family:'recover',tier,id:`const-${a}-${v0}-${s0}-${T1}-${T2}`,
    questionHtml:question({context:`A particle moves along a line with constant acceleration ${m(`a(t)=${a}`)} ${C0.acc}. Its initial velocity is ${m(`v(0)=${v0}`)} ${C0.rate} and its initial position is ${m(`s(0)=${s0}`)} ${C0.unit}.`,prompt:'Answer each part.',calculator:false}),
    parts:[{prompt:`Find ${m(`v(${T1})`)}.`,answer:{kind:'exact',value:qv(vT)},answerTex:qtex(vT),explanation:A,keypadMode:'unit5-motion-value',placeholder:'Exact value'},
           {prompt:`Find ${m(`s(${T2})`)}.`,answer:{kind:'exact',value:qv(sT)},answerTex:qtex(sT),explanation:B,keypadMode:'unit5-motion-value',placeholder:'Exact value'}]});
  }
  // linear acceleration, velocity function (Integral Motion #6a)
  const A=nz(-3,3)*2,B=nz(-6,6),t0=ri(0,3),v0=nz(-6,9);
  const aP=new Poly([B,A]),F=aP.integ(0),{C}=solveConstant(F,t0,v0),vP=F.add(new Poly([C]));
  return problem({engine:'motion',family:'recover',tier,id:`lin-${A}-${B}-${t0}-${v0}`,
   questionHtml:question({context:`${C0.intro} Its acceleration is ${m(`a(t)=${aP.tex('t')}`)} and its velocity at ${m(`t=${t0}`)} is ${m(`v(${t0})=${v0}`)}.`,prompt:'',calculator:false}),
   parts:[{prompt:`Find the velocity function ${m('v(t)')}.`,prefix:'v(t)=',answer:{kind:'ivp',variable:'t',expression:vP.expr(),interval:[0,Infinity],x0:t0,y0:v0,ode:x=>aP.f(x)},answerTex:`v(t)=${vP.tex('t')}`,
    explanation:integrateStep('a','v','a',aP,F,t0,v0,C),keypadMode:'unit5-motion-t',placeholder:'Enter v(t)'}]});
 }
 if(tier==='intermediate'){
  const kind=pick(['poly_s','log_s','sec_v']);
  if(kind==='poly_s'){ // velocity polynomial, position value (More Integral Motion style)
   const vP=new Poly([nz(-6,6),nz(-4,4)*2,nz(-3,3)*3]),t0=ri(0,3),s0=ri(-8,12),T=t0+ri(1,3);
   const F=vP.integ(0),{C}=solveConstant(F,t0,s0),sP=F.add(new Poly([C])),sT=sP.at(T);
   const expl=integrateStep('v','s','v',vP,F,t0,s0,C)+step(`Evaluate at ${m(`t=${T}`)}.`,'',`s(${T})=${qtex(sT)}`);
   return problem({engine:'motion',family:'recover',tier,id:`polys-${vP.c.map(q=>q.n).join('_')}-${t0}-${s0}-${T}`,
    questionHtml:question({context:`${C0.intro} Its velocity is ${m(`v(t)=${vP.tex('t')}`)} ${C0.rate}, and its position at ${m(`t=${t0}`)} is ${m(`${C0.pos}(${t0})=${s0}`)} ${C0.unit}.`,calculator:false}),
    parts:[{prompt:`Find the position of the particle at ${m(`t=${T}`)}.`,answer:{kind:'exact',value:qv(sT)},answerTex:qtex(sT),explanation:expl.replace(/s\(/g,`${C0.pos}(`),keypadMode:'unit5-motion-value',placeholder:'Exact value'}]});
  }
  if(kind==='log_s'){ // v = k/t + m t (Integral Motion #2), s(1) given, find s(e^n)
   const k=nz(1,4),mm=nz(1,3)*2,s1=ri(-4,8),n=pick([1,2]);
   // s = k ln t + (m/2) t^2 + C, s(1) = m/2 + C
   const half=Q(mm,2),Cq=qsub(Q(s1),half);
   // s(e^n) = k n + (m/2) e^{2n} + C
   const val=eadd(ex(qadd(Q(k*n),Cq)),ex(half,U.expAtom(Q(2*n))));
   const vtex=`\\frac{${k}}{t}+${mm}t`,stex=`${k===1?'':k}\\ln t${termTex(half,'t^{2}')}`;
   const Tt=n===1?'e':'e^{2}';
   const expl=step('Find the position function.',`Integrate the velocity. Since ${m('t>0')}, ${m('\\int\\frac{1}{t}\\,dt=\\ln t')}.`,`s(t)=\\int\\left(${vtex}\\right)dt=${stex}+C`)+
    step(`Use ${m(`s(1)=${s1}`)}.`,`${m('\\ln 1=0')}.`,`${s1}=${k}\\ln 1${termTex(half,'(1)^{2}')}+C=${qtex(half)}+C`,`C=${qtex(Cq)}`)+
    step(`Evaluate at ${m(`t=${Tt}`)}.`,`${m(`\\ln ${Tt}=${n}`)}.`,`s(${Tt})=${k}(${n})${termTex(half,`(${Tt})^{2}`)}${qzero(Cq)?'':termTex(Cq,'')}=${etex(val)}`);
   return problem({engine:'motion',family:'recover',tier,id:`logs-${k}-${mm}-${s1}-${n}`,
    questionHtml:question({context:`For ${m('t>0')}, a particle moves with velocity ${m(`v(t)=${vtex}`)}. Its position at ${m('t=1')} is ${m(`s(1)=${s1}`)}.`,calculator:false}),
    parts:[{prompt:`Find ${m(`s(${Tt})`)}.`,answer:{kind:'exact',value:evE(val)},answerTex:etex(val),explanation:expl,keypadMode:'unit5-motion-value-e',placeholder:'Exact value'}]});
  }
  // a = k sec^2 t, v(pi/4) given, find v(pi/6) or v(0) or v(pi/3) (Integral Motion #3)
  const k=nz(-4,4),v1=nz(-5,6),T=pick([Q(1,6),Q(0),Q(1,3),Q(-1,4)]);
  // v = k tan t + C; v(pi/4) = k + C
  const Cq=qsub(Q(v1),Q(k));const tanT=trigExact('tan',T);const val=eadd(escale(tanT,Q(k)),ex(Cq));
  const tt=piTexQ(T);
  const expl=step('Find the velocity function.','Velocity is an antiderivative of acceleration.',`v(t)=\\int ${k===1?'':k===-1?'-':k}\\sec^{2}t\\,dt=${termTex(Q(k),'\\tan t',true)}+C`)+
   step(`Use ${m(`v\\left(\\frac{\\pi}{4}\\right)=${v1}`)}.`,`${m('\\tan\\frac{\\pi}{4}=1')}.`,`${v1}=${qtex(Q(k))}+C`,`C=${qtex(Cq)}`)+
   step(`Evaluate at ${m(`t=${tt}`)}.`,'',`v\\left(${tt}\\right)=${termTex(Q(k),`\\tan\\left(${tt}\\right)`,true)}${qzero(Cq)?'':termTex(Cq,'')}=${etex(val)}`);
  return problem({engine:'motion',family:'recover',tier,id:`sec-${k}-${v1}-${T.n}_${T.d}`,
   questionHtml:question({context:`A particle accelerates according to ${m(`a(t)=${termTex(Q(k),'\\sec^{2}t',true)}`)} for ${m('-\\frac{\\pi}{2}<t<\\frac{\\pi}{2}')}. Its velocity at ${m('t=\\frac{\\pi}{4}')} is ${m(String(v1))}.`,calculator:false}),
   parts:[{prompt:`Find the velocity of the particle at ${m(`t=${tt}`)}.`,answer:{kind:'exact',value:evE(val)},answerTex:etex(val),explanation:expl,keypadMode:'unit5-motion-value-r',placeholder:'Exact value'}]});
 }
 // challenging
 if(U.rand()<0.5){ // a = A sin t + B cos t, s(0) and s(pi/2) given (Integral Motion #4)
  const A=nz(-3,3),B=nz(-3,3),s0=ri(-4,6),s1=ri(-4,8),T=pick([Q(1,6),Q(1,3),Q(1),Q(3,2)]);
  // v = -A cos t + B sin t + C1 ; s = -A sin t - B cos t + C1 t + C2
  const C2=qadd(Q(s0),Q(B)); // s(0) = -B + C2
  // s(pi/2) = -A + C1*pi/2 + C2 = s1  => C1 = 2(s1 + A - C2)/pi
  const K1=qmul(Q(2),qsub(qadd(Q(s1),Q(A)),C2)); // C1 = K1/pi
  const sinT=trigExact('sin',T),cosT=trigExact('cos',T);
  // s(T) = -A sinT - B cosT + C1*T*pi + C2  where T is a multiple of pi: C1*T*pi = K1*T
  const val=eadd(escale(sinT,Q(-A)),escale(cosT,Q(-B)),ex(qmul(K1,T)),ex(C2));
  const aTex=`${termTex(Q(A),'\\sin t',true)}${termTex(Q(B),'\\cos t')}`,vT=`${termTex(Q(-A),'\\cos t',true)}${termTex(Q(B),'\\sin t')}`,sT=`${termTex(Q(-A),'\\sin t',true)}${termTex(Q(-B),'\\cos t')}`;
  const tt=piTexQ(T),C1tex=qzero(K1)?'0':K1.d===1&&Math.abs(K1.n)===1?`${K1.n<0?'-':''}\\frac{1}{\\pi}`:`${K1.n<0?'-':''}\\frac{${Math.abs(K1.n)}}{${K1.d===1?'':K1.d}\\pi}`;
  const expl=step('Integrate twice.','Each integration adds a constant.',`v(t)=\\int\\left(${aTex}\\right)dt=${vT}+C_1`,`s(t)=\\int\\left(${vT}+C_1\\right)dt=${sT}+C_1t+C_2`)+
   step(`Use ${m(`s(0)=${s0}`)}.`,`${m('\\sin 0=0')} and ${m('\\cos 0=1')}.`,`${s0}=${qtex(Q(-B))}+C_2\\quad\\Longrightarrow\\quad C_2=${qtex(C2)}`)+
   step(`Use ${m(`s\\left(\\frac{\\pi}{2}\\right)=${s1}`)}.`,`${m('\\sin\\frac{\\pi}{2}=1')} and ${m('\\cos\\frac{\\pi}{2}=0')}.`,`${s1}=${qtex(Q(-A))}+\\frac{\\pi}{2}C_1${qzero(C2)?'':termTex(C2,'')}\\quad\\Longrightarrow\\quad C_1=${C1tex}`)+
   step(`Evaluate at ${m(`t=${tt}`)}.`,'',`s\\left(${tt}\\right)=${termTex(Q(-A),`\\sin\\left(${tt}\\right)`,true)}${termTex(Q(-B),`\\cos\\left(${tt}\\right)`)}+\\left(${C1tex}\\right)\\left(${tt}\\right)${qzero(C2)?'':termTex(C2,'')}=${etex(val)}`);
  return problem({engine:'motion',family:'recover',tier,id:`trig2-${A}-${B}-${s0}-${s1}-${T.n}_${T.d}`,
   questionHtml:question({context:`A particle's acceleration is ${m(`a(t)=${aTex}`)}. Its position is ${m(String(s0))} at ${m('t=0')} and ${m(String(s1))} at ${m('t=\\frac{\\pi}{2}')}.`,calculator:false}),
   parts:[{prompt:`Find the position of the particle at ${m(`t=${tt}`)}.`,answer:{kind:'exact',value:evE(val)},answerTex:etex(val),explanation:expl,keypadMode:'unit5-motion-value-r',placeholder:'Exact value'}]});
 }
 // polynomial acceleration with a velocity at one time and a position at another
 const aP=new Poly([nz(-6,6),nz(-3,3)*6]),t1=ri(1,3),v1=nz(-6,8),t2=ri(0,2),s2=ri(-6,8),T=ri(2,4);
 const F=aP.integ(0),{C:C1}=solveConstant(F,t1,v1),vP=F.add(new Poly([C1]));
 const G=vP.integ(0),{C:C2}=solveConstant(G,t2,s2),sP=G.add(new Poly([C2])),sT=sP.at(T);
 const expl=integrateStep('a','v','a',aP,F,t1,v1,C1)+integrateStep('v','s','v',vP,G,t2,s2,C2)+step(`Evaluate at ${m(`t=${T}`)}.`,'',`s(${T})=${qtex(sT)}`);
 return problem({engine:'motion',family:'recover',tier,id:`two-${aP.c.map(q=>q.n).join('_')}-${t1}-${v1}-${t2}-${s2}-${T}`,
  questionHtml:question({context:`${C0.intro} Its acceleration is ${m(`a(t)=${aP.tex('t')}`)}. The velocity at ${m(`t=${t1}`)} is ${m(String(v1))} and the position at ${m(`t=${t2}`)} is ${m(String(s2))}.`,calculator:false}),
  parts:[{prompt:`Find the position at ${m(`t=${T}`)}.`,answer:{kind:'exact',value:qv(sT)},answerTex:qtex(sT),explanation:expl,keypadMode:'unit5-motion-value',placeholder:'Exact value'}]});
}

// ---------- family 2: displacement versus total distance ----------
function famDistance(tier){
 const C0=ctx();
 let vP,lo,hi,roots;
 if(tier==='foundational'){const r=ri(1,4),A=nz(-4,4);vP=Poly.fromRoots(Q(A),[r]);lo=0;hi=r+ri(1,4);roots=[r];}
 else if(tier==='intermediate'){const r1=ri(0,3),r2=r1+ri(1,4),A=nz(-3,3);vP=Poly.fromRoots(Q(A),[r1,r2]);lo=Math.max(0,r1-ri(0,1));hi=r2+ri(1,2);if(r1===lo&&U.rand()<0.5)lo=0;roots=[r1,r2];}
 else{const r1=ri(0,2),r2=r1+ri(1,3),r3=r2+ri(1,3),A=pick([1,-1,2,-2]);vP=Poly.fromRoots(Q(A),[r1,r2,r3]);lo=0;hi=r3+ri(0,1);roots=[r1,r2,r3];}
 let rts=roots.filter(r=>r>lo&&r<hi); // only after both endpoints are final
 if(!rts.length)return null;
 const S=vP.integ(0),disp=qsub(S.at(hi),S.at(lo));
 const pts=[lo,...rts,hi];let dist=Q(0);const pieces=[];
 for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],val=qsub(S.at(b),S.at(a));pieces.push({a,b,val,sign:vP.f((a+b)/2)>0?1:-1});dist=qadd(dist,val.n<0?qneg(val):val);}
 if(pieces.length<2)return null;
 const mode=tier==='foundational'?pick(['both','distance']):pick(['both','both','distance','displacement_distance_compare']);
 const vt=vP.tex('t'),St=S.tex('t');
 const signText=pieces.map(p=>`${m(`v(t)${p.sign>0?'>':'<'}0`)} on ${m(`(${p.a},${p.b})`)}`).join(', ');
 const zerosText=`${m(`v(t)=${vt}=0`)} at ${listJoin(rts.map(r=>m(`t=${r}`)))}`;
 const less=q=>qzero(q)?'':q.n<0?`+${qtex(qneg(q))}`:`-${qtex(q)}`; // F(b) - F(a), with nothing to subtract when F(a) = 0
 const dispExpl=step('Displacement is the signed integral of velocity.','Movement to the left subtracts from movement to the right, so no absolute value is used.',`\\int_{${lo}}^{${hi}}v(t)\\,dt=\\Big[${St}\\Big]_{${lo}}^{${hi}}=${qtex(S.at(hi))}${less(S.at(lo))}${qzero(S.at(lo))?'':`=${qtex(disp)}`}`);
 // v12.8.X: after the sign of v is known on each piece, only the negative pieces need an absolute value
 const pieceInt=p=>`\\int_{${p.a}}^{${p.b}}v(t)\\,dt`;
 const distExpl=step('Find where the velocity changes sign.',`${zerosText}. A test value in each piece gives ${signText}.`)+
  step('Evaluate the integral of v on each piece.',`Use the antiderivative ${m(`${St}`)}.`,...pieces.map(p=>`${pieceInt(p)}=${qtex(S.at(p.b))}${less(S.at(p.a))}${qzero(S.at(p.a))?'':`=${qtex(p.val)}`}`))+
  step('Add the distance traveled on each piece.',`Where ${m('v\\gt 0')} the particle moves right and the integral is already the distance traveled; where ${m('v\\lt 0')} it moves left, the integral is negative, and its absolute value is the distance.`,
   `\\text{Total distance}=${pieces.map((p,j)=>`${j?'+':''}${p.sign>0?pieceInt(p):`\\left|${pieceInt(p)}\\right|`}`).join('')}`,
   `=${pieces.map((p,j)=>`${j?'+':''}${p.sign>0?qtex(p.val):`\\left|${qtex(p.val)}\\right|`}`).join('')}=${qtex(dist)}`);
 const ctxHtml=`${C0.intro} Its velocity is ${m(`v(t)=${vt}`)} ${C0.rate} for ${m(`${lo}\\le t\\le ${hi}`)}.`;
 const parts=[];
 if(mode!=='distance')parts.push({prompt:`Find the displacement of the particle from ${m(`t=${lo}`)} to ${m(`t=${hi}`)}.`,answer:{kind:'exact',value:qv(disp)},answerTex:qtex(disp),explanation:dispExpl,keypadMode:'unit5-motion-value',placeholder:'Exact value'});
 parts.push({prompt:`Find the total distance traveled by the particle from ${m(`t=${lo}`)} to ${m(`t=${hi}`)}.`,answer:{kind:'exact',value:qv(dist)},answerTex:qtex(dist),explanation:distExpl,keypadMode:'unit5-motion-value',placeholder:'Exact value'});
 parts[parts.length-1].answer.wrongValues=[{value:qv(disp),note:'That is the displacement. Total distance adds the absolute value of each piece, so it is never smaller than the displacement.'}];
 return problem({engine:'motion',family:'displacement_distance',tier,id:`dist-${vP.c.map(q=>q.n).join('_')}-${lo}-${hi}-${mode}`,
  questionHtml:question({context:ctxHtml,calculator:false}),parts});
}

// ---------- family 3: direction, rest, speed ----------
function famDirection(tier){
 const C0=ctx();
 const kind=tier==='foundational'?pick(['rest','speed_point']):tier==='intermediate'?pick(['direction_intervals','speed_point','rest']):pick(['change_direction','speeding_intervals','direction_intervals']);
 if(kind==='rest'){
  const neg=U.rand()<0.5;const r1=neg?-ri(1,4):ri(1,3),r2=ri(Math.max(1,r1+1),r1+5>1?r1+5:5),A=nz(-3,3);
  const vP=Poly.fromRoots(Q(A),[r1,r2]);const keep=[r1,r2].filter(r=>r>=0);
  if(r1===r2||!keep.length)return null;
  const vt=vP.tex('t');
  const expl=step('A particle is at rest when its velocity is zero.',`Set ${m(`v(t)=0`)} and factor.`,`${vt}=${A===1?'':A===-1?'-':A}\\left(t${r1<0?`+${-r1}`:`-${r1}`}\\right)\\left(t-${r2}\\right)=0`)+
   step('Keep the times in the domain.',neg?`${m(`t=${r1}`)} is negative, so it is not in the domain ${m('t\\ge 0')}.`:'Both times are in the domain.',`t=${keep.join(',\\ ')}`);
  return problem({engine:'motion',family:'direction_speed',tier,id:`rest-${A}-${r1}-${r2}`,
   questionHtml:question({context:`${C0.intro} Its velocity is ${m(`v(t)=${vt}`)} for ${m('t\\ge 0')}.`,calculator:false}),
   parts:[{prompt:'At what time or times is the particle at rest? Separate multiple times with commas.',answer:{kind:'list',values:keep.map(String),extraNote:'A negative time is outside the domain t ≥ 0.'},answerTex:keep.map(r=>`t=${r}`).join(',\\ '),explanation:expl,keypadMode:'unit5-motion-list',placeholder:'e.g. 1, 3'}]});
 }
 if(kind==='speed_point'){
  const r1=ri(0,3),r2=r1+ri(2,4),A=nz(-3,3),vP=Poly.fromRoots(Q(A),[r1,r2]),aP=vP.deriv();
  let c=ri(0,r2+2);if(c===r1||c===r2||qzero(aP.at(c)))return null;
  const vc=vP.at(c),ac=aP.at(c),inc=qv(vc)*qv(ac)>0;
  const vt=vP.tex('t');
  const P1={prompt:`Find the velocity at ${m(`t=${c}`)}.`,answer:{kind:'exact',value:qv(vc)},answerTex:qtex(vc),explanation:step('Evaluate the velocity.','',`v(${c})=${vP.tex(`(${c})`)}=${qtex(vc)}`),keypadMode:'unit5-motion-value',placeholder:'Exact value'};
  const P2={prompt:`Find the acceleration at ${m(`t=${c}`)}.`,answer:{kind:'exact',value:qv(ac)},answerTex:qtex(ac),explanation:step('Differentiate the velocity.','Acceleration is the derivative of velocity.',`a(t)=v'(t)=${aP.tex('t')}`,`a(${c})=${qtex(ac)}`),keypadMode:'unit5-motion-value',placeholder:'Exact value'};
  const P3={prompt:`Is the particle's speed increasing or decreasing at ${m(`t=${c}`)}?`,control:'choice',choices:['Increasing','Decreasing'],correctIndex:inc?0:1,answerIsText:true,answerTex:inc?'Increasing':'Decreasing',
   explanation:step('Compare the signs of velocity and acceleration.',`${m(`v(${c})=${qtex(vc)}`)} is ${sgnWord(qv(vc))} and ${m(`a(${c})=${qtex(ac)}`)} is ${sgnWord(qv(ac))}. ${inc?'They have the same sign, so the speed is increasing.':'They have opposite signs, so the speed is decreasing.'} (The sign of ${m('a')} alone does not decide this.)`)};
  return problem({engine:'motion',family:'direction_speed',tier,id:`speed-${A}-${r1}-${r2}-${c}`,
   questionHtml:question({context:`${C0.intro} Its velocity is ${m(`v(t)=${vt}`)} for ${m('t\\ge 0')}.`,calculator:false}),parts:[P1,P2,P3]});
 }
 if(kind==='direction_intervals'){
  const r1=ri(1,3),r2=r1+ri(1,4),A=nz(-3,3),T=r2+ri(1,3);const vP=Poly.fromRoots(Q(A),[r1,r2]);
  const want=C0.dirs[pick([0,1])],sign=want===C0.dirs[0]?1:-1;
  const pieces=[[0,r1],[r1,r2],[r2,T]].filter(([a,b])=>sign*vP.f((a+b)/2)>0);
  const vt=vP.tex('t');
  const rows=[[0,r1],[r1,r2],[r2,T]].map(([a,b])=>`${m(`(${a},${b})`)}: ${m(`v${vP.f((a+b)/2)>0?'>':'<'}0`)}`).join('; ');
  const ivTex=pieces.map(([a,b])=>`(${a},${b})`).join('\\cup ');
  const expl=step('Moving right means v > 0; moving left means v < 0.',`The velocity is zero at ${m(`t=${r1}`)} and ${m(`t=${r2}`)}, where it can change sign.`)+
   step('Make a sign chart.',`Test one value in each interval: ${rows}.`)+step(`The particle moves ${want} where ${m(`v(t)${sign>0?'>':'<'}0`)}.`,'',ivTex);
  return problem({engine:'motion',family:'direction_speed',tier,id:`dir-${A}-${r1}-${r2}-${T}-${want}`,
   questionHtml:question({context:`${C0.intro} Its velocity is ${m(`v(t)=${vt}`)} for ${m(`0<t<${T}`)}.`,calculator:false}),
   parts:[{prompt:`On what interval or intervals is the particle moving to the ${want}?`,answer:{kind:'interval',variable:'t',anyBrackets:true,parts:pieces.map(([a,b])=>({left:String(a),right:String(b)}))},answerTex:ivTex,explanation:expl,keypadMode:'unit5-motion-intervals',placeholder:'e.g. (0,2)∪(5,7)'}]});
 }
 if(kind==='change_direction'){
  // v has a double root (no sign change) and a simple root
  const d=ri(1,3),s=d+ri(1,3)*pick([1,-1]),A=pick([1,-1,2]);if(s<=0||s===d)return null;const T=Math.max(d,s)+ri(1,2);
  const vP=Poly.fromRoots(Q(A),[d,d,s]),aP=vP.deriv();
  const vt=vP.tex('t');
  const fac=`${A===1?'':A===-1?'-':A}\\left(t-${d}\\right)^{2}\\left(t-${s}\\right)`;
  const expl=step('Find where the velocity is zero.','',`v(t)=${vt}=${fac}=0\\quad\\Longrightarrow\\quad t=${Math.min(d,s)}\\text{ or }t=${Math.max(d,s)}`)+
   step('Check for a sign change at each zero.',`${m(`(t-${d})^{2}`)} is never negative, so ${m('v')} has the same sign on both sides of ${m(`t=${d}`)}: the particle stops there but keeps its direction. Across ${m(`t=${s}`)} the factor ${m(`t-${s}`)} changes sign, so the velocity changes sign.`)+
   step('The particle changes direction only where v changes sign.','',`t=${s}`);
  return problem({engine:'motion',family:'direction_speed',tier,id:`chg-${A}-${d}-${s}`,
   questionHtml:question({context:`${C0.intro} Its velocity is ${m(`v(t)=${vt}`)} for ${m(`0<t<${T}`)}.`,calculator:false}),
   parts:[{prompt:'At what time or times does the particle change direction?',answer:{kind:'list',values:[String(s)],extraNote:`At t = ${d} the velocity is zero but does not change sign, so the particle does not change direction there.`},answerTex:`t=${s}`,explanation:expl,keypadMode:'unit5-motion-list',placeholder:'e.g. 3'}]});
 }
 // speeding up intervals: v quadratic with roots r1<r2, a linear with zero at the vertex
 const r1=ri(1,3),r2=r1+2*ri(1,2),A=nz(-2,2),T=r2+ri(1,3);const vP=Poly.fromRoots(Q(A),[r1,r2]),aP=vP.deriv();const mid=(r1+r2)/2;
 const marks=[0,r1,mid,r2,T];const segs=[];for(let i=0;i<marks.length-1;i++){const a=marks[i],b=marks[i+1],c=(a+b)/2;segs.push({a,b,v:vP.f(c),acc:aP.f(c)});}
 const up=segs.filter(s=>s.v*s.acc>0);
 const ivTex=up.map(s=>`(${s.a},${s.b})`).join('\\cup ');
 const rows=segs.map(s=>`${m(`(${s.a},${s.b})`)}: ${m(`v${s.v>0?'>':'<'}0`)}, ${m(`a${s.acc>0?'>':'<'}0`)}`).join('; ');
 const expl=step('Find the zeros of velocity and acceleration.',`${m(`v(t)=${vP.tex('t')}=0`)} at ${m(`t=${r1}`)} and ${m(`t=${r2}`)}; ${m(`a(t)=v'(t)=${aP.tex('t')}=0`)} at ${m(`t=${mid}`)}.`)+
  step('Compare signs on each interval.',`Speed increases where ${m('v')} and ${m('a')} have the same sign. ${rows}.`,ivTex);
 return problem({engine:'motion',family:'direction_speed',tier,id:`spdint-${A}-${r1}-${r2}-${T}`,
  questionHtml:question({context:`${C0.intro} Its velocity is ${m(`v(t)=${vP.tex('t')}`)} for ${m(`0<t<${T}`)}.`,calculator:false}),
  parts:[{prompt:'On what interval or intervals is the speed of the particle increasing?',answer:{kind:'interval',variable:'t',anyBrackets:true,parts:up.map(s=>({left:String(s.a),right:String(s.b)}))},answerTex:ivTex,explanation:expl,keypadMode:'unit5-motion-intervals',placeholder:'e.g. (1,2)∪(3,5)'}]});
}

// ---------- family 4: calculator motion ----------
// ---------- family 4: calculator motion (v12.8.X: four families in the 'calculator' group) ----------
// Velocities: transcendental templates with drawn coefficients, and polynomials whose zeros are irrational
// (found with the calculator, as in the homework's v(t) = 4t^3 - 8t + 1). Times are whole seconds.
const dec=v=>String(v);
const VEL=[
 ()=>{const A=pick([2,3,4]),k=pick([3,4,5]),c=pick([-1,1,-0.5]);return{tex:`${A}\\sin\\left(\\frac{t^{2}}{${k}}\\right)${c<0?'-':'+'}${dec(Math.abs(c))}`,f:t=>A*Math.sin(t*t/k)+c,T:[4,5,6]};},
 ()=>{const A=pick([3,4,5]),k=pick([2,3,4]);return{tex:`${A}e^{-\\frac{t}{${k}}}\\cos t`,f:t=>A*Math.exp(-t/k)*Math.cos(t),T:[5,6,7]};},
 ()=>{const c=pick([1,1.5,2]);return{tex:`\\ln\\left(t^{2}+1\\right)-${dec(c)}`,f:t=>Math.log(t*t+1)-c,T:[3,4,5]};},
 ()=>{const c=pick([1,2]),b=pick([1.5,1.8,2]),k=pick([2,3]);return{tex:`${c}-${dec(b)}te^{-\\frac{t}{${k}}}`,f:t=>c-b*t*Math.exp(-t/k),T:[6,8]};},
 ()=>({tex:'\\frac{1+2t\\cos t}{t^{2}+2}',f:t=>(1+2*t*Math.cos(t))/(t*t+2),T:[5,6]}),
 ()=>{const A=pick([3,4,5]);return{tex:`${A}\\cos\\left(\\sqrt{t+1}\\right)`,f:t=>A*Math.cos(Math.sqrt(t+1)),T:[6,8,10]};},
 ()=>{const c=pick([1,2]);return{tex:`t\\sin t-${c}`,f:t=>t*Math.sin(t)-c,T:[4,5,6]};},
 ()=>{const c=pick([1.2,1.5,2]);return{tex:`e^{\\sin t}-${dec(c)}`,f:t=>Math.exp(Math.sin(t))-c,T:[5,6,7]};},
 ()=>{const A=pick([2,3]),k=pick([2,3]),c=pick([1,2]);return{tex:`${A}\\cos t+\\frac{t}{${k}}-${c}`,f:t=>A*Math.cos(t)+t/k-c,T:[5,6,7]};},
 ()=>({tex:'\\sqrt{t}\\cos t',f:t=>Math.sqrt(t)*Math.cos(t),T:[4,5,6]}),
 ()=>{const c=pick([1,1.5,2]);return{tex:`${dec(c)}-t^{2}e^{-\\frac{t}{2}}`,f:t=>c-t*t*Math.exp(-t/2),T:[6,8,10]};},
 ()=>{const A=pick([2,3]),k=pick([2,3]);return{tex:`${A}\\sin\\left(\\frac{t}{${k}}\\right)-\\frac{t}{${A}}`,f:t=>A*Math.sin(t/k)-t/A,T:[6,8]};},
];
// a polynomial velocity with irrational zeros in (0, T): quadratic at^2+bt+c or cubic at^3+bt+c
function polyVel(){
 for(let i=0;i<40;i++){
  const cubic=U.rand()<0.5,a=pick([1,2,3,4]),b=nz(-9,9),c=nz(-6,6);
  const P=cubic?new Poly([Q(c),Q(b),Q(0),Q(a)]):new Poly([Q(c),Q(b),Q(a)]);
  const T=pick([3,4,5]);const zs=roots(t=>P.f(t),0,T,{steps:6000}).filter(z=>z>1e-9&&z<T-1e-9);
  if(!zs.length||zs.some(z=>z<0.1||z>T-0.1||Math.abs(z-Math.round(z*2)/2)<1e-6))continue; // irrational zeros away from the ends
  return{tex:P.tex('t'),f:t=>P.f(t),T:[T],poly:true};
 }
 return null;
}
// a velocity with zeros (sign changes) on (0, T), between lo and hi of them
function calcVel(lo,hi,{poly=false}={}){
 for(let i=0;i<40;i++){
  const V=poly?polyVel():pick(VEL)();if(!V)continue;const T=pick(V.T);
  // every zero inside (0, T) counts; a zero too close to an endpoint makes the velocity unusable (never drop it)
  const zs=roots(V.f,0,T,{steps:6000}).filter(z=>z>1e-9&&z<T-1e-9);
  if(zs.some(z=>z<0.05||z>T-0.05))continue;
  const change=zs.filter(z=>{const h=1e-4;return Math.sign(V.f(z-h))!==Math.sign(V.f(z+h));});
  if(change.length!==zs.length||change.length<lo||change.length>hi)continue;
  // each piece moves a visible amount
  const pts=[0,...zs,T];if(pts.slice(1).some((b,j)=>Math.abs(integrate(V.f,pts[j],b))<0.02))continue;
  return{...V,T,zs};
 }
 return null;
}
const DEC3='Give your answer correct to three decimal places.';
const zName=(i,n)=>n===1?'t_{1}':`t_{${i+1}}`;
function zerosStep(V,C0,T){
 return step('Find where the velocity is zero.',`Use the calculator to solve ${m(`${V.tex}=0`)} on ${m(`0\\lt t\\lt ${T}`)}${V.zs.length>1?'; call the zeros':', and call the zero'} ${listJoin(V.zs.map((z,i)=>m(`${zName(i,V.zs.length)}\\approx ${fix(z)}`)))}.`);
}
// the sign on each piece and the total distance: absolute values only on the pieces where v is negative
function distanceSteps(V,a,b,zs,C0){
 const pts=[a,...zs,b],names=[String(a),...zs.map((_,i)=>zName(i,zs.length)),String(b)];
 const pieces=pts.slice(1).map((hi,j)=>({lo:pts[j],hi,from:names[j],to:names[j+1],I:integrate(V.f,pts[j],hi),pos:V.f((pts[j]+hi)/2)>0}));
 const sign=step('Find the sign of the velocity on each piece.',`Test a time in each piece (or read the calculator graph of ${m('v')}):`,
  pieces.map(q=>`v(t)${q.pos?'\\gt':'\\lt'} 0\\ \\text{on}\\ \\left(${q.from},\\,${q.to}\\right)`).join(',\\quad '));
 const sym=pieces.map((q,j)=>{const I=`\\int_{${q.from}}^{${q.to}}v(t)\\,dt`;return `${j?(q.pos?'+':'+'):''}${q.pos?I:`\\left|${I}\\right|`}`;}).join('');
 const num=pieces.map((q,j)=>`${j?'+':''}${q.pos?fix(q.I,4):`\\left|${fix(q.I,4)}\\right|`}`).join('');
 const d=pieces.reduce((s,q)=>s+Math.abs(q.I),0);
 const total=step('Add the distance traveled on each piece.',`Where ${m('v\\gt 0')} the integral is already the distance traveled; where ${m('v\\lt 0')} the integral is negative, so take its absolute value. Evaluate each integral with the calculator.`,
  `\\text{Total distance}=${sym}`,`\\approx ${num}\\approx ${fix(d)}`);
 return{pieces,d,steps:sign+total};
}

function famCalcPosition(tier){
 const C0=ctx();
 if(tier==='foundational'){
  const V=pick(VEL)(),T=pick(V.T),s0=ri(-3,6),t1=ri(2,T);const I=integrate(V.f,0,t1),val=s0+I;
  return problem({engine:'motion',family:'calc_position',tier,id:`cpos-${T}-${s0}-${t1}`,calculator:true,
   questionHtml:question({context:`${C0.intro} Its velocity is ${m(`v(t)=${V.tex}`)} ${C0.rate} for ${m(`0\\le t\\le ${T}`)}, and ${m(`${C0.pos}(0)=${s0}`)}.`,prompt:'Use your calculator.',calculator:true}),
   parts:[{prompt:`Find the position of the particle at ${m(`t=${t1}`)}. ${DEC3}`,answer:{kind:'numeric',value:val,places:3,wrongValues:[{value:I,note:'That is the displacement. Add the starting position.'}]},answerTex:fix(val),keypadMode:'unit5-number',placeholder:'Decimal answer',
    explanation:step('Add the displacement to the starting position.','The change in position is the integral of velocity (signed, because position can decrease).',`${C0.pos}(${t1})=${C0.pos}(0)+\\int_{0}^{${t1}}v(t)\\,dt=${s0}+\\int_{0}^{${t1}}\\left(${V.tex}\\right)dt`,`\\approx ${s0}${I<0?'-':'+'}${fix(Math.abs(I),4)}\\approx ${fix(val)}`)}]});
 }
 // position known at a later time; the requested time may come before it (the integral then runs backward)
 const V=pick(VEL)(),T=pick(V.T),t0=ri(1,T-1),x0=ri(-4,8);let t1=ri(0,T);if(t1===t0)t1=t0>1?t0-1:t0+1;
 const I=integrate(V.f,t0,t1),val=x0+I,back=t1<t0;
 const partA={prompt:`Find the position of the particle at ${m(`t=${t1}`)}. ${DEC3}`,answer:{kind:'numeric',value:val,places:3,wrongValues:[{value:x0-I,note:'Check the direction of the integral: integrate from the time you know to the time you want.'}]},answerTex:fix(val),keypadMode:'unit5-number',placeholder:'Decimal answer',
  explanation:step('Start from the known position.',`The position at ${m(`t=${t1}`)} is the position at ${m(`t=${t0}`)} plus the displacement from ${m(`t=${t0}`)} to ${m(`t=${t1}`)}.${back?` Here ${m(`${t1}\\lt ${t0}`)}, so the integral runs backward; its sign takes care of the direction.`:''}`,
   `${C0.pos}(${t1})=${C0.pos}(${t0})+\\int_{${t0}}^{${t1}}v(t)\\,dt=${x0}+\\int_{${t0}}^{${t1}}\\left(${V.tex}\\right)dt`,`\\approx ${x0}${I<0?'-':'+'}${fix(Math.abs(I),4)}\\approx ${fix(val)}`)};
 const parts=[partA];
 if(tier==='challenging'){
  const a=Math.min(t0,t1),b=Math.max(t0,t1);const disp=integrate(V.f,a,b),avg=disp/(b-a);
  parts.push({prompt:`Find the average velocity of the particle from ${m(`t=${a}`)} to ${m(`t=${b}`)}. ${DEC3}`,answer:{kind:'numeric',value:avg,places:3,wrongValues:[{value:(V.f(a)+V.f(b))/2,note:'Averaging the two endpoint velocities is not the average velocity. Divide the displacement by the elapsed time.'},{value:disp,note:'That is the displacement. Divide it by the elapsed time.'}]},answerTex:fix(avg),keypadMode:'unit5-number',placeholder:'Decimal answer',
   explanation:step('Average velocity is displacement divided by elapsed time.','',`\\frac{1}{${b}-${a}}\\int_{${a}}^{${b}}v(t)\\,dt\\approx\\frac{${fix(disp,4)}}{${b-a}}\\approx ${fix(avg)}`)});
 }
 return problem({engine:'motion',family:'calc_position',tier,id:`cposk-${T}-${t0}-${x0}-${t1}`,calculator:true,
  questionHtml:question({context:`${C0.intro} Its velocity is ${m(`v(t)=${V.tex}`)} ${C0.rate} for ${m(`0\\le t\\le ${T}`)}, and ${m(`${C0.pos}(${t0})=${x0}`)}.`,prompt:parts.length>1?'Use your calculator. Answer each part.':'Use your calculator.',calculator:true}),parts});
}

function famCalcDistance(tier){
 const C0=ctx();
 const V=tier==='foundational'?calcVel(1,2,{poly:true}):tier==='intermediate'?calcVel(1,2):calcVel(2,3);if(!V)return null;
 const T=V.T,D=distanceSteps(V,0,T,V.zs,C0),disp=integrate(V.f,0,T);
 const pDist={prompt:`Find the total distance traveled by the particle from ${m('t=0')} to ${m(`t=${T}`)}. ${DEC3}`,
  answer:{kind:'numeric',value:D.d,places:3,wrongValues:[{value:disp,note:'That is the displacement. Total distance counts every piece of the motion as positive.'},{value:Math.abs(disp),note:'That is the absolute value of the displacement. Split the interval where the velocity changes sign and add the distance on each piece.'}]},
  answerTex:fix(D.d),keypadMode:'unit5-number',placeholder:'Decimal answer',explanation:zerosStep(V,C0,T)+D.steps};
 const parts=[];
 if(tier!=='foundational'&&U.rand()<0.5)parts.push({prompt:`Find the displacement of the particle from ${m('t=0')} to ${m(`t=${T}`)}. ${DEC3}`,answer:{kind:'numeric',value:disp,places:3},answerTex:fix(disp),keypadMode:'unit5-number',placeholder:'Decimal answer',
  explanation:step('Displacement is the integral of velocity.','Positive and negative pieces cancel, so no splitting is needed.',`\\int_{0}^{${T}}\\left(${V.tex}\\right)dt\\approx ${fix(disp)}`)});
 parts.push(pDist);
 return problem({engine:'motion',family:'calc_distance',tier,id:`cdist-${T}-${parts.length}`,calculator:true,
  questionHtml:question({context:`${C0.intro} Its velocity is ${m(`v(t)=${V.tex}`)} ${C0.rate} for ${m(`0\\le t\\le ${T}`)}.`,prompt:parts.length>1?'Use your calculator. Answer each part.':'Use your calculator.',calculator:true}),parts});
}

function famCalcSpeed(tier){
 const C0=ctx(),h=1e-5;
 if(tier==='challenging'){ // acceleration given: velocity from an integral, then the speed at that time
  const A=pick(VEL)(),T=pick(A.T),t0=0,v0=ri(-3,3),c=ri(2,T);const vc=v0+integrate(A.f,t0,c),ac=A.f(c);
  if(Math.abs(vc)<0.05||Math.abs(ac)<0.05)return null;const inc=vc*ac>0;
  return problem({engine:'motion',family:'calc_speed',tier,id:`cspa-${T}-${v0}-${c}`,calculator:true,
   questionHtml:question({context:`${C0.intro} Its acceleration is ${m(`a(t)=${A.tex}`)} ${C0.acc} for ${m(`0\\le t\\le ${T}`)}, and ${m(`v(0)=${v0}`)}.`,prompt:'Use your calculator. Answer each part.',calculator:true}),
   parts:[{prompt:`Find the velocity of the particle at ${m(`t=${c}`)}. ${DEC3}`,answer:{kind:'numeric',value:vc,places:3},answerTex:fix(vc),keypadMode:'unit5-number',placeholder:'Decimal answer',
     explanation:step('Velocity is the starting velocity plus the integral of acceleration.','',`v(${c})=v(0)+\\int_{0}^{${c}}a(t)\\,dt=${v0}+\\int_{0}^{${c}}\\left(${A.tex}\\right)dt\\approx ${fix(vc)}`)},
    {prompt:`Find the speed of the particle at ${m(`t=${c}`)}. ${DEC3}`,answer:{kind:'numeric',value:Math.abs(vc),places:3,wrongValues:vc<0?[{value:vc,note:'Speed is the absolute value of velocity, so it is never negative.'}]:[]},answerTex:fix(Math.abs(vc)),keypadMode:'unit5-number',placeholder:'Decimal answer',
     explanation:step('Speed is the absolute value of velocity.','',`\\left|v(${c})\\right|\\approx ${fix(Math.abs(vc))}`)},
    {prompt:`Is the particle's speed increasing or decreasing at ${m(`t=${c}`)}?`,control:'choice',choices:['Increasing','Decreasing'],correctIndex:inc?0:1,answerIsText:true,answerTex:inc?'Increasing':'Decreasing',
     explanation:step('Compare the signs of velocity and acceleration.',`${m(`v(${c})\\approx ${fix(vc)}`)} is ${sgnWord(vc)} and ${m(`a(${c})=${fix(ac)}`)} (evaluate the given acceleration) is ${sgnWord(ac)}. ${inc?'Same sign: the speed is increasing.':'Opposite signs: the speed is decreasing.'}`)}]});
 }
 const V=pick(VEL)(),T=pick(V.T),c=ri(1,T-1),vc=V.f(c),ac=(V.f(c+h)-V.f(c-h))/(2*h);if(Math.abs(vc)<0.05||Math.abs(ac)<0.05)return null;const inc=vc*ac>0;
 const parts=[{prompt:`Find the acceleration of the particle at ${m(`t=${c}`)}. ${DEC3}`,answer:{kind:'numeric',value:ac,places:3,wrongValues:[{value:vc,note:'That is the velocity. Acceleration is the derivative of velocity.'}]},answerTex:fix(ac),keypadMode:'unit5-number',placeholder:'Decimal answer',
  explanation:step('Acceleration is the derivative of velocity.','Use the calculator to evaluate the derivative at the point.',`a(${c})=v'(${c})\\approx ${fix(ac)}`)}];
 if(tier==='intermediate')parts.push({prompt:`Is the particle's speed increasing or decreasing at ${m(`t=${c}`)}?`,control:'choice',choices:['Increasing','Decreasing'],correctIndex:inc?0:1,answerIsText:true,answerTex:inc?'Increasing':'Decreasing',
  explanation:step('Compare the signs of velocity and acceleration.',`${m(`v(${c})\\approx ${fix(vc)}`)} is ${sgnWord(vc)} and ${m(`a(${c})\\approx ${fix(ac)}`)} is ${sgnWord(ac)}. ${inc?'Same sign: the speed is increasing.':'Opposite signs: the speed is decreasing.'}`)});
 return problem({engine:'motion',family:'calc_speed',tier,id:`cspd-${T}-${c}-${parts.length}`,calculator:true,
  questionHtml:question({context:`${C0.intro} Its velocity is ${m(`v(t)=${V.tex}`)} ${C0.rate} for ${m(`0\\le t\\le ${T}`)}.`,prompt:parts.length>1?'Use your calculator. Answer each part.':'Use your calculator.',calculator:true}),parts});
}

function famCalcDirection(tier){
 const C0=ctx();
 const V=tier==='foundational'?calcVel(1,2,{poly:true}):tier==='intermediate'?calcVel(1,3):calcVel(2,3);if(!V)return null;const T=V.T,zs=V.zs;
 const ctxHtml=`${C0.intro} Its velocity is ${m(`v(t)=${V.tex}`)} ${C0.rate} for ${m(`0\\le t\\le ${T}`)}.`;
 const pts=[0,...zs,T],pieces=pts.slice(1).map((b,j)=>[pts[j],b]),dirOf=([a,b])=>V.f((a+b)/2)>0;
 const ivTex=list=>list.map(([a,b])=>`\\left(${a===0||a===T?a:fix(a)},\\,${b===0||b===T?b:fix(b)}\\right)`).join('\\cup ');
 const signs=step('Test the sign of v on each piece.',`Moving right means ${m('v(t)\\gt 0')}; moving left means ${m('v(t)\\lt 0')}. Test a time in each piece between consecutive zeros.`,
  pieces.map(q=>`v(t)${dirOf(q)?'\\gt':'\\lt'} 0\\ \\text{on}\\ ${ivTex([q])}`).join(',\\quad '));
 let parts;
 if(tier==='foundational'){
  parts=[{prompt:`For ${m(`0\\lt t\\lt ${T}`)}, at what time or times is the particle at rest? Give each time correct to three decimal places; separate times with commas.`,answer:{kind:'list',values:zs,places:3},answerTex:zs.map(z=>`t=${fix(z)}`).join(',\\ '),keypadMode:'unit5-motion-list-dec',placeholder:'e.g. 1.234',
   explanation:step('A particle is at rest when its velocity is zero.',`Use the calculator to solve ${m(`${V.tex}=0`)} on ${m(`(0,${T})`)}.`,zs.map(z=>`t\\approx ${fix(z)}`).join(',\\quad '))}];
 }else{
  const want=tier==='intermediate'?pick([true,false]):false;const sel=pieces.filter(q=>dirOf(q)===want);if(!sel.length)return null;
  parts=[{prompt:`For ${m(`0\\lt t\\lt ${T}`)}, on what interval or intervals is the particle moving to the ${want?'right':'left'}? Give endpoints that are not whole numbers correct to three decimal places.`,
   answer:{kind:'interval',variable:'t',anyBrackets:true,places:3,parts:sel.map(([a,b])=>({left:a,right:b}))},answerTex:ivTex(sel),keypadMode:'unit5-motion-intervals-dec',placeholder:'e.g. (0, 1.234)',
   explanation:zerosStep(V,C0,T)+signs+step(`Keep the pieces where ${m(want?'v\\gt 0':'v\\lt 0')}.`,'',ivTex(sel))}];
  if(tier==='challenging')parts.push({prompt:`At what time or times does the particle change direction on ${m(`0\\lt t\\lt ${T}`)}? Give each time correct to three decimal places.`,answer:{kind:'list',values:zs,places:3},answerTex:zs.map(z=>`t=${fix(z)}`).join(',\\ '),keypadMode:'unit5-motion-list-dec',placeholder:'e.g. 1.234, 3.456',
   explanation:step('The particle changes direction where the velocity changes sign.',`Each zero above is a sign change of ${m('v')}, so the particle reverses direction there.`,zs.map(z=>`t\\approx ${fix(z)}`).join(',\\quad '))});
 }
 return problem({engine:'motion',family:'calc_direction',tier,id:`cdir-${T}-${parts.length}`,calculator:true,
  questionHtml:question({context:ctxHtml,prompt:parts.length>1?'Use your calculator. Answer each part.':'Use your calculator.',calculator:true}),parts});
}

// ---------- family 5: connected multi-part ----------
function famMulti(tier){
 const C0=ctx();
 const r1=ri(1,3),r2=r1+ri(1,3),A=pick([1,2,3,-1,-2]);
 const vP=Poly.fromRoots(Q(A),[r1,r2]),aP=vP.deriv();
 const t0=pick([0,1]),v0=vP.at(t0),s0=ri(-5,8);
 const F=aP.integ(0),{C:C1}=solveConstant(F,t0,qv(v0));
 const G=vP.integ(0),{C:C2}=solveConstant(G,0,s0),sP=G.add(new Poly([C2]));
 const T=r2+ri(1,2);
 const PA={prompt:`Find the velocity function ${m('v(t)')}.`,prefix:'v(t)=',answer:{kind:'ivp',variable:'t',expression:vP.expr(),interval:[0,Infinity],x0:t0,y0:qv(v0),ode:x=>aP.f(x)},answerTex:`v(t)=${vP.tex('t')}`,
  explanation:integrateStep('a','v','a',aP,F,t0,qtex(v0),C1),keypadMode:'unit5-motion-t',placeholder:'Enter v(t)'};
 const PB={prompt:`Find the position function ${m(`${C0.pos}(t)`)}.`,prefix:`${C0.pos}(t)=`,answer:{kind:'ivp',variable:'t',expression:sP.expr(),interval:[0,Infinity],x0:0,y0:s0,ode:x=>vP.f(x)},answerTex:`${C0.pos}(t)=${sP.tex('t')}`,
  explanation:integrateStep('v','s','v',vP,G,0,s0,C2).replace(/s\(/g,`${C0.pos}(`),keypadMode:'unit5-motion-t',placeholder:`Enter ${C0.pos}(t)`};
 const last=tier==='challenging'?pick(['distance','left']):pick(['displacement','distance','position']);
 let PC;
 if(last==='position'){const val=sP.at(T);PC={prompt:`Find the position at ${m(`t=${T}`)}.`,answer:{kind:'exact',value:qv(val)},answerTex:qtex(val),explanation:step('Evaluate the position function.','',`${C0.pos}(${T})=${qtex(val)}`),keypadMode:'unit5-motion-value',placeholder:'Exact value'};}
 if(last==='displacement'){const d=qsub(sP.at(T),sP.at(0));PC={prompt:`Find the displacement from ${m('t=0')} to ${m(`t=${T}`)}.`,answer:{kind:'exact',value:qv(d)},answerTex:qtex(d),explanation:step('Displacement is the change in position.','',`${C0.pos}(${T})-${C0.pos}(0)=${qtex(sP.at(T))}-\\left(${qtex(sP.at(0))}\\right)=${qtex(d)}`),keypadMode:'unit5-motion-value',placeholder:'Exact value'};}
 if(last==='distance'){
  const pts=[0,r1,r2,T];let dist=Q(0);const vals=[];for(let i=0;i<3;i++){const v=qsub(sP.at(pts[i+1]),sP.at(pts[i]));vals.push(v);dist=qadd(dist,v.n<0?qneg(v):v);}
  PC={prompt:`Find the total distance traveled from ${m('t=0')} to ${m(`t=${T}`)}.`,answer:{kind:'exact',value:qv(dist),wrongValues:[{value:qv(qsub(sP.at(T),sP.at(0))),note:'That is the displacement. Split at the times where v changes sign and add absolute values.'}]},answerTex:qtex(dist),
   explanation:(()=>{const segs=[[0,r1],[r1,r2],[r2,T]].map(([a,b],i)=>({a,b,val:vals[i],pos:vP.f((a+b)/2)>0}));const d=(a,b)=>`${C0.pos}(${b})-${C0.pos}(${a})`; // v12.8.X: bars only where v < 0
    return step('Split where the velocity changes sign.',`${m('v(t)=0')} at ${m(`t=${r1}`)} and ${m(`t=${r2}`)}. A test value in each piece gives ${segs.map(q=>`${m(`v(t)${q.pos?'\\gt':'\\lt'}0`)} on ${m(`(${q.a},${q.b})`)}`).join(', ')}, so the particle reverses direction at each zero.`)+
    step('Add the distance traveled on each piece.',`Where ${m('v\\gt 0')} the change in position is the distance traveled; where ${m('v\\lt 0')} the change in position is negative, and its absolute value is the distance.`,
     `\\text{Total distance}=${segs.map((q,j)=>`${j?'+':''}${q.pos?`\\left[${d(q.a,q.b)}\\right]`:`\\left|${d(q.a,q.b)}\\right|`}`).join('')}`,`=${segs.map((q,j)=>`${j?'+':''}${q.pos?qtex(q.val):`\\left|${qtex(q.val)}\\right|`}`).join('')}=${qtex(dist)}`);})(),keypadMode:'unit5-motion-value',placeholder:'Exact value'};
 }
 if(last==='left'){
  const left=[[0,r1],[r1,r2],[r2,T]].filter(([a,b])=>vP.f((a+b)/2)<0);const ivTex=left.map(([a,b])=>`(${a},${b})`).join('\\cup ');
  PC={prompt:`On what interval or intervals, for ${m(`0<t<${T}`)}, is the particle moving to the left?`,answer:{kind:'interval',variable:'t',anyBrackets:true,parts:left.map(([a,b])=>({left:String(a),right:String(b)}))},answerTex:ivTex,
   explanation:step('Moving left means v(t) < 0.',`The velocity is zero at ${m(`t=${r1}`)} and ${m(`t=${r2}`)}. Test a value in each interval of ${m(`(0,${T})`)}: ${[[0,r1],[r1,r2],[r2,T]].map(([a,b])=>`${m(`(${a},${b})`)}: ${m(`v${vP.f((a+b)/2)>0?'>':'<'}0`)}`).join('; ')}.`,ivTex),keypadMode:'unit5-motion-intervals',placeholder:'e.g. (1,3)'};
 }
 const parts=tier==='foundational'?[PA,PB]:[PA,PB,PC];
 return problem({engine:'motion',family:'multipart',tier,id:`multi-${A}-${r1}-${r2}-${t0}-${s0}-${last}`,
  questionHtml:question({context:`${C0.intro} Its acceleration is ${m(`a(t)=${aP.tex('t')}`)} ${C0.acc}. At ${m(`t=${t0}`)} its velocity is ${m(qtex(v0))} ${C0.rate}, and its position at ${m('t=0')} is ${m(`${C0.pos}(0)=${s0}`)} ${C0.unit}.`,prompt:'Answer each part in order.',calculator:false}),parts});
}

const FAMILIES={
 recover:{weight:25,tiers:['foundational','intermediate','challenging'],make:famRecover,calculator:false},
 displacement_distance:{weight:25,tiers:['foundational','intermediate','challenging'],make:famDistance,calculator:false},
 direction_speed:{weight:20,tiers:['foundational','intermediate','challenging'],make:famDirection,calculator:false},
 // the calculator group keeps W's 15% of mixed practice; the Practice Type "calculator" selects the whole group
 calc_position:{weight:4,group:'calculator',tiers:['foundational','intermediate','challenging'],make:famCalcPosition,calculator:true},
 calc_distance:{weight:5,group:'calculator',tiers:['foundational','intermediate','challenging'],make:famCalcDistance,calculator:true},
 calc_speed:{weight:3,group:'calculator',tiers:['foundational','intermediate','challenging'],make:famCalcSpeed,calculator:true},
 calc_direction:{weight:3,group:'calculator',tiers:['foundational','intermediate','challenging'],make:famCalcDirection,calculator:true},
 multipart:{weight:15,tiers:['foundational','intermediate','challenging'],make:famMulti,calculator:false},
};
const engine=U.makeEngine('motion',FAMILIES);
U.profile('unit5-motion-value',{fraction:true,parentheses:true});
U.profile('unit5-motion-value-e',{exponent:true,constants:['e'],arithmetic:true,parentheses:true});
U.profile('unit5-motion-value-r',{fraction:true,radical:true,arithmetic:true,parentheses:true});
U.profile('unit5-motion-t',{fraction:true,exponent:true,variables:['t'],arithmetic:true,parentheses:true});
U.profile('unit5-motion-list',{list:true});
U.profile('unit5-motion-list-dec',{list:true,decimal:true});
U.profile('unit5-motion-intervals',{parentheses:true,list:true,interval:true,brackets:false});
U.profile('unit5-motion-intervals-dec',{decimal:true,parentheses:true,list:true,interval:true,brackets:false});
window.BatchMathUnit5Motion=Object.freeze({make:engine.make,FAMILIES,weights:engine.weights});
U.register('motion-problems',o=>engine.make(o||{}));
})();
