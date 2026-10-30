/* BatchMath v12.8.W — Unit 5 engine 2: Motion Problems.
   Families (mixed mode): recover velocity or position 25%, displacement versus total distance 25%,
   direction / rest / speed 20%, calculator motion 15%, connected multi-part problems 15%.
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
    step(`Evaluate at ${m(`t=${Tt}`)}.`,`${m(`\\ln ${Tt}=${n}`)}.`,`s(${Tt})=${k}(${n})${termTex(half,`(${Tt})^{2}`)}${termTex(Cq,'')}=${etex(val)}`);
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
   step(`Evaluate at ${m(`t=${tt}`)}.`,'',`v\\left(${tt}\\right)=${termTex(Q(k),`\\tan\\left(${tt}\\right)`,true)}${termTex(Cq,'')}=${etex(val)}`);
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
   step(`Use ${m(`s\\left(\\frac{\\pi}{2}\\right)=${s1}`)}.`,`${m('\\sin\\frac{\\pi}{2}=1')} and ${m('\\cos\\frac{\\pi}{2}=0')}.`,`${s1}=${qtex(Q(-A))}+\\frac{\\pi}{2}C_1${termTex(C2,'')}\\quad\\Longrightarrow\\quad C_1=${C1tex}`)+
   step(`Evaluate at ${m(`t=${tt}`)}.`,'',`s\\left(${tt}\\right)=${termTex(Q(-A),`\\sin\\left(${tt}\\right)`,true)}${termTex(Q(-B),`\\cos\\left(${tt}\\right)`)}+\\left(${C1tex}\\right)\\left(${tt}\\right)${termTex(C2,'')}=${etex(val)}`);
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
 let vP,lo,hi,rts;
 if(tier==='foundational'){const r=ri(1,4),A=nz(-4,4);vP=Poly.fromRoots(Q(A),[r]);lo=0;hi=r+ri(1,4);rts=[r];}
 else if(tier==='intermediate'){const r1=ri(0,3),r2=r1+ri(1,4),A=nz(-3,3);vP=Poly.fromRoots(Q(A),[r1,r2]);lo=Math.max(0,r1-ri(0,1));hi=r2+ri(1,2);rts=[r1,r2].filter(r=>r>lo&&r<hi);if(r1===lo&&U.rand()<0.5){lo=0;}}
 else{const r1=ri(0,2),r2=r1+ri(1,3),r3=r2+ri(1,3),A=pick([1,-1,2,-2]);vP=Poly.fromRoots(Q(A),[r1,r2,r3]);lo=0;hi=r3+ri(0,1);rts=[r1,r2,r3].filter(r=>r>lo&&r<hi);}
 rts=rts.filter(r=>r>lo&&r<hi);
 if(!rts.length)return null;
 const S=vP.integ(0),disp=qsub(S.at(hi),S.at(lo));
 const pts=[lo,...rts,hi];let dist=Q(0);const pieces=[];
 for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],val=qsub(S.at(b),S.at(a));pieces.push({a,b,val,sign:vP.f((a+b)/2)>0?1:-1});dist=qadd(dist,val.n<0?qneg(val):val);}
 if(pieces.length<2)return null;
 const mode=tier==='foundational'?pick(['both','distance']):pick(['both','both','distance','displacement_distance_compare']);
 const vt=vP.tex('t'),St=S.tex('t');
 const signText=pieces.map(p=>`${m(`v(t)${p.sign>0?'>':'<'}0`)} on ${m(`(${p.a},${p.b})`)}`).join(', ');
 const zerosText=`${m(`v(t)=${vt}=0`)} at ${listJoin(rts.map(r=>m(`t=${r}`)))}`;
 const dispExpl=step('Displacement is the signed integral of velocity.','Movement to the left subtracts from movement to the right, so no absolute value is used.',`\\int_{${lo}}^{${hi}}v(t)\\,dt=\\Big[${St}\\Big]_{${lo}}^{${hi}}=${qtex(S.at(hi))}-\\left(${qtex(S.at(lo))}\\right)=${qtex(disp)}`);
 const distExpl=step('Find where the velocity changes sign.',`${zerosText}. A test value in each piece gives ${signText}.`)+
  step('Total distance is the integral of speed, |v|.','Integrate each piece separately and add the absolute values, because distance traveled to the left still counts.',
   `\\int_{${lo}}^{${hi}}\\left|v(t)\\right|dt=${pieces.map(p=>`\\left|\\int_{${p.a}}^{${p.b}}v(t)\\,dt\\right|`).join('+')}`,
   `=${pieces.map(p=>`\\left|${qtex(p.val)}\\right|`).join('+')}=${qtex(dist)}`);
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
  const P3={prompt:`Is the speed of the particle increasing or decreasing at ${m(`t=${c}`)}?`,control:'choice',choices:['Increasing','Decreasing'],correctIndex:inc?0:1,answerIsText:true,answerTex:inc?'Increasing':'Decreasing',
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
   parts:[{prompt:`On what interval or intervals is the particle moving to the ${want}?`,answer:{kind:'interval',variable:'t',parts:pieces.map(([a,b])=>({left:String(a),right:String(b)}))},answerTex:ivTex,explanation:expl,keypadMode:'unit5-motion-intervals',placeholder:'e.g. (0,2)∪(5,7)'}]});
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
  parts:[{prompt:'On what interval or intervals is the speed of the particle increasing?',answer:{kind:'interval',variable:'t',parts:up.map(s=>({left:String(s.a),right:String(s.b)}))},answerTex:ivTex,explanation:expl,keypadMode:'unit5-motion-intervals',placeholder:'e.g. (1,2)∪(3,5)'}]});
}

// ---------- family 4: calculator motion ----------
const CALC_V=[
 {tex:'3\\sin\\left(\\frac{t^{2}}{4}\\right)-1',f:t=>3*Math.sin(t*t/4)-1,T:[4,5]},
 {tex:'4e^{-0.3t}\\cos t',f:t=>4*Math.exp(-0.3*t)*Math.cos(t),T:[5,6,7]},
 {tex:'\\ln\\left(t^{2}+1\\right)-1.5',f:t=>Math.log(t*t+1)-1.5,T:[3,4]},
 {tex:'2-1.8te^{-\\frac{t}{3}}',f:t=>2-1.8*t*Math.exp(-t/3),T:[6,8]},
 {tex:'\\frac{1+2t\\cos t}{t^{2}+2}',f:t=>(1+2*t*Math.cos(t))/(t*t+2),T:[5,6]},
 {tex:'5\\cos\\left(\\sqrt{t+1}\\right)',f:t=>5*Math.cos(Math.sqrt(t+1)),T:[6,8]},
 {tex:'t\\sin t-1',f:t=>t*Math.sin(t)-1,T:[4,5]},
];
function famCalc(tier){
 const C0=ctx(),V=pick(CALC_V),T=pick(V.T),s0=ri(-3,6);
 const zs=roots(V.f,0,T,{steps:6000}).filter(z=>z>1e-6&&z<T-1e-6);
 const kind=tier==='intermediate'?pick(['position','distance','speed']):pick(['distance','right_intervals','speed','position_distance']);
 const ctxHtml=`${C0.intro} Its velocity is ${m(`v(t)=${V.tex}`)} ${C0.rate} for ${m(`0\\le t\\le ${T}`)}, and ${m(`${C0.pos}(0)=${s0}`)}.`;
 const parts=[];
 const pos=(t)=>s0+integrate(V.f,0,t);
 const distance=()=>{const pts=[0,...zs,T];let d=0;const pcs=[];for(let i=0;i<pts.length-1;i++){const v=integrate(V.f,pts[i],pts[i+1]);pcs.push({a:pts[i],b:pts[i+1],v});d+=Math.abs(v);}return{d,pcs};};
 if(kind==='position'||kind==='position_distance'){
  const t1=pick([Math.round(T/2),T-1,T]);const val=pos(t1),I=val-s0;
  parts.push({prompt:`Find the position of the particle at ${m(`t=${t1}`)}. Give your answer correct to three decimal places.`,answer:{kind:'numeric',value:val,tolerance:0.001},answerTex:fix(val),
   explanation:step('Add the displacement to the starting position.','The change in position is the integral of velocity (signed, because position can decrease).',`${C0.pos}(${t1})=${C0.pos}(0)+\\int_{0}^{${t1}}v(t)\\,dt=${s0}+\\int_{0}^{${t1}}\\left(${V.tex}\\right)dt`,`\\approx ${s0}${I<0?'-':'+'}${fix(Math.abs(I),4)}\\approx ${fix(val)}`),keypadMode:'unit5-number',placeholder:'Decimal answer'});
 }
 if(kind==='distance'||kind==='position_distance'){
  if(!zs.length&&U.rand()<0.7)return null;
  const {d,pcs}=distance();
  parts.push({prompt:`Find the total distance traveled from ${m('t=0')} to ${m(`t=${T}`)}. Give your answer correct to three decimal places.`,answer:{kind:'numeric',value:d,tolerance:0.001},answerTex:fix(d),
   explanation:step('Total distance is the integral of speed.',`Speed is ${m('|v(t)|')}. ${zs.length?`On ${m(`[0,${T}]`)} the velocity is zero at ${zs.map(z=>m(`t\\approx ${fix(z)}`)).join(', ')} (found with the calculator), and the calculator integrates ${m('|v|')} directly.`:`The velocity does not change sign on ${m(`[0,${T}]`)}, so the distance equals the absolute value of the displacement.`}`,`\\int_{0}^{${T}}\\left|${V.tex}\\right|dt\\approx ${fix(d)}`)+
    (zs.length?step('Check by pieces.','The same total comes from adding the absolute value of the integral on each piece.',`${pcs.map(p=>`\\left|${fix(p.v,4)}\\right|`).join('+')}\\approx ${fix(d)}`):''),keypadMode:'unit5-number',placeholder:'Decimal answer'});
 }
 if(kind==='speed'){
  const c=pick([1,2,3,T-1].filter(x=>x>0&&x<T));const h=1e-5,vc=V.f(c),ac=(V.f(c+h)-V.f(c-h))/(2*h);if(Math.abs(vc)<0.05||Math.abs(ac)<0.05)return null;
  const inc=vc*ac>0;
  parts.push({prompt:`Find the acceleration of the particle at ${m(`t=${c}`)}. Give your answer correct to three decimal places.`,answer:{kind:'numeric',value:ac,tolerance:0.001},answerTex:fix(ac),explanation:step('Acceleration is the derivative of velocity.','Use the calculator to evaluate the derivative at the point.',`a(${c})=v'(${c})\\approx ${fix(ac)}`),keypadMode:'unit5-number',placeholder:'Decimal answer'});
  parts.push({prompt:`Is the speed of the particle increasing or decreasing at ${m(`t=${c}`)}?`,control:'choice',choices:['Increasing','Decreasing'],correctIndex:inc?0:1,answerIsText:true,answerTex:inc?'Increasing':'Decreasing',
   explanation:step('Compare the signs of velocity and acceleration.',`${m(`v(${c})\\approx ${fix(vc)}`)} is ${sgnWord(vc)} and ${m(`a(${c})\\approx ${fix(ac)}`)} is ${sgnWord(ac)}. ${inc?'Same sign: the speed is increasing.':'Opposite signs: the speed is decreasing.'}`)});
 }
 if(kind==='right_intervals'){
  if(!zs.length)return null;
  const pts=[0,...zs,T],right=[];for(let i=0;i<pts.length-1;i++)if(V.f((pts[i]+pts[i+1])/2)>0)right.push([pts[i],pts[i+1]]);
  if(!right.length)return null;
  const ivTex=right.map(([a,b])=>`(${fix(a)},\\,${fix(b)})`).join('\\cup ');
  parts.push({prompt:`For ${m(`0<t<${T}`)}, on what interval or intervals is the particle moving to the right? Round endpoints to three decimal places.`,answer:{kind:'interval',variable:'t',tolerance:0.0015,parts:right.map(([a,b])=>({left:a,right:b}))},answerTex:ivTex,
   explanation:step('Moving right means v(t) > 0.',`Graph ${m('v')} or use the calculator's zero finder: on ${m(`(0,${T})`)} the velocity is zero at ${zs.map(z=>m(`t\\approx ${fix(z)}`)).join(', ')}. Testing a value between consecutive zeros shows where ${m('v>0')}.`,ivTex),keypadMode:'unit5-motion-intervals-dec',placeholder:'e.g. (0, 1.234)'});
  parts.forEach(p=>{if(p.answer.kind==='interval')p.answer.parts=p.answer.parts.map(q=>({left:+fix(q.left,6),right:+fix(q.right,6)}));});
 }
 if(!parts.length)return null;
 return problem({engine:'motion',family:'calculator',tier,id:`calc-${CALC_V.indexOf(V)}-${T}-${s0}-${kind}`,
  questionHtml:question({context:ctxHtml,prompt:'Use your calculator.',calculator:true}),parts,calculator:true});
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
   explanation:step('Split where the velocity changes sign.',`${m('v(t)=0')} at ${m(`t=${r1}`)} and ${m(`t=${r2}`)}, and ${m('v')} changes sign at each, so the particle reverses direction there.`)+
    step('Add the distance on each piece.','Each piece is the change in position over that piece, taken in absolute value.',`\\left|${C0.pos}(${r1})-${C0.pos}(0)\\right|+\\left|${C0.pos}(${r2})-${C0.pos}(${r1})\\right|+\\left|${C0.pos}(${T})-${C0.pos}(${r2})\\right|`,`=${vals.map(v=>`\\left|${qtex(v)}\\right|`).join('+')}=${qtex(dist)}`),keypadMode:'unit5-motion-value',placeholder:'Exact value'};
 }
 if(last==='left'){
  const left=[[0,r1],[r1,r2],[r2,T]].filter(([a,b])=>vP.f((a+b)/2)<0);const ivTex=left.map(([a,b])=>`(${a},${b})`).join('\\cup ');
  PC={prompt:`On what interval or intervals, for ${m(`0<t<${T}`)}, is the particle moving to the left?`,answer:{kind:'interval',variable:'t',parts:left.map(([a,b])=>({left:String(a),right:String(b)}))},answerTex:ivTex,
   explanation:step('Moving left means v(t) < 0.',`The velocity is zero at ${m(`t=${r1}`)} and ${m(`t=${r2}`)}. Test a value in each interval of ${m(`(0,${T})`)}: ${[[0,r1],[r1,r2],[r2,T]].map(([a,b])=>`${m(`(${a},${b})`)}: ${m(`v${vP.f((a+b)/2)>0?'>':'<'}0`)}`).join('; ')}.`,ivTex),keypadMode:'unit5-motion-intervals',placeholder:'e.g. (1,3)'};
 }
 const parts=tier==='foundational'?[PA,PB]:[PA,PB,PC];
 return problem({engine:'motion',family:'multipart',tier,id:`multi-${A}-${r1}-${r2}-${t0}-${s0}-${last}`,
  questionHtml:question({context:`${C0.intro} Its acceleration is ${m(`a(t)=${aP.tex('t')}`)} ${C0.acc}. At ${m(`t=${t0}`)} its velocity is ${m(qtex(v0))} ${C0.rate}, and its position at ${m('t=0')} is ${m(`${C0.pos}(0)=${s0}`)} ${C0.unit}.`,prompt:'Answer each part in order.',calculator:false}),parts});
}

const FAMILIES={
 recover:{weight:25,tiers:['foundational','intermediate','challenging'],make:famRecover},
 displacement_distance:{weight:25,tiers:['foundational','intermediate','challenging'],make:famDistance},
 direction_speed:{weight:20,tiers:['foundational','intermediate','challenging'],make:famDirection},
 calculator:{weight:15,tiers:['intermediate','challenging'],make:famCalc},
 multipart:{weight:15,tiers:['foundational','intermediate','challenging'],make:famMulti},
};
const engine=U.makeEngine('motion',FAMILIES);
U.profile('unit5-motion-value',{fraction:true,arithmetic:true,parentheses:true});
U.profile('unit5-motion-value-e',{fraction:true,exponent:true,constants:['e'],arithmetic:true,parentheses:true});
U.profile('unit5-motion-value-r',{fraction:true,radical:true,arithmetic:true,parentheses:true});
U.profile('unit5-motion-t',{fraction:true,exponent:true,variables:['t'],arithmetic:true,parentheses:true});
U.profile('unit5-motion-list',{list:true,none:true});
U.profile('unit5-motion-intervals',{parentheses:true,list:true,interval:true,brackets:false});
U.profile('unit5-motion-intervals-dec',{decimal:true,parentheses:true,list:true,interval:true,brackets:false});
window.BatchMathUnit5Motion=Object.freeze({make:engine.make,FAMILIES,weights:engine.weights});
U.register('motion-problems',o=>engine.make(o||{}));
})();
