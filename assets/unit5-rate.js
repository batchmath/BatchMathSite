/* BatchMath v12.8.W — Unit 5 engine 6: Rate Problems / Accumulation.
   Families (mixed mode): accumulate one rate 25%, initial amount plus or minus accumulated change 20%,
   simultaneous inflow and outflow 20%, delayed starts / stops / piecewise rates 15%, increasing / decreasing
   analysis 10%, connected multi-part problems 10%. Most problems are calculator active (three decimal places);
   a few foundational ones use polynomial rates with exact answers. Integrals use the shared adaptive
   Gauss-Legendre rule; the QA tool cross-checks every value with the composite Simpson rule the earlier
   rate generator used. A rate is integrated only over the times it applies, and maximum / monotonicity
   questions come from the sign of the net rate, not from integrating blindly. */
(function(){
'use strict';
const U=window.BatchMathUnit5Core;
if(!U)return;
const {Q,qtex,pick,ri,step,m,question,problem,fix,integrate,roots}=U;

// ---------- formatting ----------
const comma=n=>{const [a,b]=String(n).split('.');return a.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(b!==undefined?'.'+b:'');};
const nt=n=>comma(n).replace(/,/g,'{,}');
const fx=(v,p=3)=>nt(fix(v,p));
const DEC='Give your answer correct to three decimal places.';
const int=(F,a,b)=>`\\int_{${nt(a)}}^{${nt(b)}}${F}\\,dt`;
const fe=v=>Math.abs(v-Math.round(v))<1e-9?nt(Math.round(v)):fx(v);   // an endpoint or time, exact when it is a whole number
const sgn=v=>v<0?`-${fx(-v)}`:fx(v);
const plusMinus=(v)=>v<0?` - ${fx(-v)}`:` + ${fx(v)}`;

// ---------- rate shapes: a positive rate of typical size M on [0, T] ----------
const r1=x=>Math.max(1,Math.round(x));
const frac=(num,c)=>c===1?num:`\\frac{${num}}{${c}}`;
function shape(kind,M,T){
 const c3=pick(T>40?[5,6,8,10]:T>15?[3,4,5]:[2,3,4]);
 switch(kind){
  case 'cos':{const B=r1(M*pick([0.15,0.25,0.35]));return{tex:`${M}+${B}\\cos\\left(${frac('t',c3)}\\right)`,f:t=>M+B*Math.cos(t/c3),d:t=>-B/c3*Math.sin(t/c3)};}
  case 'sin':{const B=r1(M*pick([0.15,0.25,0.35]));return{tex:`${M}+${B}\\sin\\left(${frac('t',c3)}\\right)`,f:t=>M+B*Math.sin(t/c3),d:t=>B/c3*Math.cos(t/c3)};}
  case 'sinsqrt':{const B=r1(M*pick([0.2,0.3,0.4])),c=pick([1,2,3]);return{tex:`${M}+${B}\\sin\\left(${c===1?'':c}\\sqrt{t}\\right)`,f:t=>M+B*Math.sin(c*Math.sqrt(t)),d:t=>B*Math.cos(c*Math.sqrt(t))*c/(2*Math.sqrt(t))};}
  case 'log':{const a=r1(M/Math.log(T/2+1)),b=pick([0,r1(M*0.2)]);return{tex:`${a}\\ln(t+1)${b?`+${b}`:''}`,f:t=>a*Math.log(t+1)+b,d:t=>a/(t+1),nonneg:true};}
  case 'exp':{const A=r1(M*pick([0.6,0.8])),b=r1(M*pick([0.2,0.4])),c=r1(T/pick([2,3,4]));return{tex:`${A}e^{-${frac('t',c)}}+${b}`,f:t=>A*Math.exp(-t/c)+b,d:t=>-A/c*Math.exp(-t/c)};}
  case 'bump':{const c=r1(T/pick([2,3])),A=Math.max(1,Math.round(M*Math.E/c));return{tex:`${A===1?'':A}te^{-${frac('t',c)}}`,f:t=>A*t*Math.exp(-t/c),d:t=>A*Math.exp(-t/c)*(1-t/c),nonneg:true};}
  case 'rational':{const c=pick([4,9,16,25]),A=r1(2*Math.sqrt(c)*M);return{tex:`\\frac{${A}t}{t^{2}+${c}}`,f:t=>A*t/(t*t+c),d:t=>A*(c-t*t)/((t*t+c)**2),nonneg:true};}
  case 'cossq':{const B=r1(M*pick([0.15,0.25])),c=r1(T*T/pick([8,15,30]));return{tex:`${M}+${B}\\cos\\left(\\frac{t^{2}}{${nt(c)}}\\right)`,f:t=>M+B*Math.cos(t*t/c),d:t=>-B*2*t/c*Math.sin(t*t/c)};}
  case 'pow2':{const B=r1(M*pick([0.3,0.5])),c=r1(T/pick([3,5]));return{tex:`${M}+${B}\\cdot 2^{-${frac('t',c)}}`,f:t=>M+B*Math.pow(2,-t/c),d:t=>-B*Math.LN2/c*Math.pow(2,-t/c)};}
  case 'sqrtlin':{const c=pick([1,4,9]),A=r1(M/Math.sqrt(T/2+c));return{tex:`${A}\\sqrt{t+${c}}`,f:t=>A*Math.sqrt(t+c),d:t=>A/(2*Math.sqrt(t+c))};}
 }
 throw Error(kind);
}
const SHAPES=['cos','sin','sinsqrt','log','exp','bump','rational','cossq','pow2','sqrtlin'];
// a shape that stays positive (or nonnegative for shapes that start at 0) on the whole interval
function positive(M,T,kinds=SHAPES){for(let i=0;i<20;i++){const k=pick(kinds),s=shape(k,M,T);s.kind=k;let lo=Infinity;for(let k=0;k<=200;k++)lo=Math.min(lo,s.f(T*k/200));if(lo>(s.nonneg?-1e-12:0.05*M))return s;}return null;}

// ---------- contexts ----------
const clock=(c,t)=>{if(!c.clock)return null;let mins=c.clock*60+t*(c.unit==='hours'?60:1);mins=((mins%1440)+1440)%1440;const h=Math.floor(mins/60),mm=Math.round(mins%60);const h12=(h+11)%12+1;if(mm===0&&h===0)return 'midnight';if(mm===0&&h===12)return 'noon';return `${h12}:${String(mm).padStart(2,'0')} ${h<12?'AM':'PM'}`;};
const ONE=[
 {who:'Cars pass through a busy intersection',ask:'pass through the intersection',amt:'cars',unit:'minutes',one:'minute',F:'C',M:[40,60,75,90],T:[20,30,45,60],clock:12,start:'noon'},
 {who:'Ballots are cast at a polling place',ask:'are cast',amt:'ballots',unit:'hours',one:'hour',F:'B',M:[40,60,80,120],T:[8,10,12],clock:7,start:'7:00 AM'},
 {who:'Visitors enter an amusement park',ask:'enter the park',amt:'visitors',unit:'hours',one:'hour',F:'V',M:[300,500,800],T:[6,8,10],clock:9,start:'9:00 AM'},
 {who:'Water flows through a pipe into a pool',ask:'flow into the pool',amt:'gallons',unit:'minutes',one:'minute',F:'W',M:[12,20,30],T:[30,45,60,90]},
 {who:'Songs are downloaded from a music service',ask:'are downloaded',amt:'songs',unit:'hours',one:'hour',F:'D',M:[150,250,400],T:[6,12,24]},
 {who:'Oil leaks from a damaged pipeline',ask:'of oil leak from the pipeline',amt:'barrels',unit:'hours',one:'hour',F:'R',M:[20,35,50],T:[12,24]},
 {who:'A runner burns calories during a long workout',ask:'are burned',amt:'calories',unit:'minutes',one:'minute',F:'K',M:[8,10,12],T:[30,45,60]},
 {who:'Gravel is delivered to a construction site',ask:'of gravel are delivered',amt:'tons',unit:'hours',one:'hour',F:'G',M:[10,15,25],T:[6,8]},
];
const TANK=[
 {what:'a water tank',ref:'the tank',outQ:'are drained from the tank',amt:'gallons',unit:'hours',one:'hour',A0:[500,800,1200,2500],M:[60,100,150],T:[8,12,18,24],clock:6,
  inF:'P',outF:'D',inText:F=>`Water is pumped into the tank at a rate of ${F} gallons per hour`,outText:F=>`water is drained from the tank at a rate of ${F} gallons per hour`,inNoun:'water pumped in',outNoun:'water drained out'},
 {what:'a parking garage',ref:'the garage',outQ:'leave the garage',amt:'cars',unit:'hours',one:'hour',A0:[120,200,350],M:[40,60,90],T:[6,8,10],clock:7,
  inF:'E',outF:'L',inText:F=>`Cars enter the garage at a rate of ${F} cars per hour`,outText:F=>`cars leave at a rate of ${F} cars per hour`,inNoun:'cars that enter',outNoun:'cars that leave'},
 {what:'a grain silo',ref:'the silo',outQ:'are unloaded from the silo',amt:'bushels',unit:'hours',one:'hour',A0:[2000,3500,5000],M:[120,200,300],T:[8,10,12],
  inF:'F',outF:'U',inText:F=>`Grain is loaded into the silo at a rate of ${F} bushels per hour`,outText:F=>`grain is unloaded at a rate of ${F} bushels per hour`,inNoun:'grain loaded',outNoun:'grain unloaded'},
 {what:'an online game server',ref:'the server',outQ:'leave the server',amt:'players',unit:'hours',one:'hour',A0:[1500,3000,4500],M:[200,400,600],T:[6,8,12],clock:16,
  inF:'J',outF:'Q',inText:F=>`Players join the server at a rate of ${F} players per hour`,outText:F=>`players leave at a rate of ${F} players per hour`,inNoun:'players who join',outNoun:'players who leave'},
 {what:'a storage tank of heating oil',ref:'the tank',outQ:'are removed from the tank',amt:'barrels',unit:'hours',one:'hour',A0:[400,600,900],M:[20,30,45],T:[10,12,24],
  inF:'P',outF:'R',inText:F=>`Oil is pumped into the tank at a rate of ${F} barrels per hour`,outText:F=>`oil is removed at a rate of ${F} barrels per hour`,inNoun:'oil pumped in',outNoun:'oil removed'},
];
const at=(c,t)=>{const k=clock(c,t);return k?`${m(`t=${nt(t)}`)} (${k})`:m(`t=${nt(t)}`);};
const tUnits=c=>`${m('t')} is measured in ${c.unit}${c.clock!==undefined?` after ${clock(c,0)}`:''}`;

// ---------- parts ----------
function decPart(prompt,value,unit,explanation,wrong=[]){
 return{prompt:`${prompt} ${DEC}`,answer:{kind:'numeric',value,tolerance:0.001,wrongValues:wrong.filter(w=>Number.isFinite(w.value)&&Math.abs(w.value-value)>0.002)},
  answerTex:`${fx(value)}${unit?`\\text{ ${unit}}`:''}`,explanation,keypadMode:'unit5-number',placeholder:'Decimal answer'};
}
function exactPart(prompt,q,unit,explanation,wrong=[]){
 return{prompt,answer:{kind:'exact',value:q.n/q.d,wrongValues:wrong},answerTex:`${qtex(q)}${unit?`\\text{ ${unit}}`:''}`,explanation,keypadMode:'unit5-rate-exact',placeholder:'Exact value'};
}
function build(family,tier,id,ctx,formulas,parts,calculator=true){
 return problem({engine:'rate',family,tier,id:String(id).replace(/[^A-Za-z0-9_.-]+/g,''),calculator,
  questionHtml:question({context:ctx,formulas,prompt:parts.length>1?'Answer each part.':'',calculator}),parts});
}
const CALC_STEP=(F,a,b,v,why)=>step('Evaluate with the calculator.',why||'Use the numerical integration feature; store the result rather than retyping a rounded value.',`${int(F,a,b)}\\approx ${fx(v)}`);

// ======================================================================
// 1. accumulate one rate
function famOne(tier){
 const C=pick(ONE),T=pick(C.T),M=pick(C.M),F=`${C.F}(t)`;
 if(tier==='foundational'&&U.rand()<0.35){ // no calculator: a polynomial rate
  const a=ri(2,9)*(C.M[0]>=40?5:1),b=ri(1,6)*(C.M[0]>=40?2:1),Tn=pick([2,3,4,6]);const val=Q(2*a*Tn+b*Tn*Tn,2);
  const tex=`${a}+${b}t`;
  const ctx=`${C.who} at a rate of ${m(F)} ${C.amt} per ${C.one}, where ${tUnits(C)}.`;
  return build('one_rate',tier,`one-poly-${C.F}-${a}-${b}-${Tn}`,ctx,[`${F}=${tex}`],[exactPart(`How many ${C.amt} ${C.ask} from ${m('t=0')} to ${m(`t=${Tn}`)}?`,val,C.amt,
   step('Set up the accumulation.',`${m(F)} is a rate in ${C.amt} per ${C.one}, so integrating it over time gives the total number of ${C.amt}.`,int(F,0,Tn))+
   step('Integrate.','Use the power rule on each term.',`\\int_{0}^{${Tn}}\\left(${tex}\\right)dt=\\left[${a}t+${termHalf(b)}t^{2}\\right]_{0}^{${Tn}}=${a*Tn}+${qtex(Q(b*Tn*Tn,2))}=${qtex(val)}`),
   [{value:a+b*Tn,note:`That is the rate at ${'t = '+Tn}, not the total. Integrate the rate over the time interval.`}])],false);
 }
 const s=positive(M,T);if(!s)return null;
 const ctx=`${C.who} at a rate of ${m(F)} ${C.amt} per ${C.one}, where ${tUnits(C)}.`;
 if(tier==='foundational'){
  const v=integrate(s.f,0,T);
  return build('one_rate',tier,`one-${C.F}-${M}-${T}`,ctx,[`${F}=${s.tex}`],[decPart(`How many ${C.amt} ${C.ask} from ${at(C,0)} to ${at(C,T)}?`,v,C.amt,
   step('Set up the accumulation.',`${m(F)} gives ${C.amt} per ${C.one}. The integral of a rate over a time interval is the total amount accumulated during that interval.`,int(F,0,T))+CALC_STEP(F,0,T,v)+
   step('Interpret.',`About ${fx(v)} ${C.amt} ${C.ask} during the first ${T} ${C.unit}.`),[{value:s.f(T),note:'That is the rate at the final time. The total comes from integrating the rate.'},{value:s.f(T)*T,note:'The rate is not constant, so rate × time does not give the total. Integrate the rate.'}])]);
 }
 if(tier==='intermediate'){
  if(U.rand()<0.5){ // a window that does not start at 0
   const a=Math.round(T*pick([0.2,0.25,0.4])),b=Math.round(T*pick([0.6,0.75,1]));if(b<=a)return null;const v=integrate(s.f,a,b);
   return build('one_rate',tier,`onew-${C.F}-${M}-${T}-${a}-${b}`,ctx,[`${F}=${s.tex}`],[decPart(`How many ${C.amt} ${C.ask} from ${at(C,a)} to ${at(C,b)}?`,v,C.amt,
    step('Translate the times.',`${C.clock!==undefined?`Because ${tUnits(C)}, the window is ${m(`${a}\\le t\\le ${b}`)}.`:`The window is ${m(`${a}\\le t\\le ${b}`)}.`} Only what happens during that window counts, so the limits are ${m(a)} and ${m(b)}, not 0.`,int(F,a,b))+CALC_STEP(F,a,b,v),
    [{value:integrate(s.f,0,b),note:`That counts from ${'t = 0'}. Start the integral at ${'t = '+a}.`}])]);
  }
  const v=integrate(s.f,0,T),avg=v/T; // average rate
  return build('one_rate',tier,`onea-${C.F}-${M}-${T}`,ctx,[`${F}=${s.tex}`],[decPart(`What is the average rate, in ${C.amt} per ${C.one}, from ${m('t=0')} to ${m(`t=${T}`)}?`,avg,`${C.amt} per ${C.one}`,
   step('Use the average value of a function.','The average rate is the total accumulated divided by the length of the time interval.',`\\frac{1}{${T}-0}${int(F,0,T)}`)+CALC_STEP(F,0,T,v)+
   step('Divide by the length of the interval.','',`\\frac{${fx(v)}}{${T}}\\approx ${fx(avg)}`),[{value:v,note:'That is the total. The average rate divides the total by the length of the interval.'},{value:(s.f(0)+s.f(T))/2,note:'Averaging the two endpoint rates is not the average value of the rate. Integrate and divide by the interval length.'}])]);
 }
 // challenging: when does the total reach a target, or the total while the rate is above a level
 if(U.rand()<0.5){
  const total=integrate(s.f,0,T),N=Math.round(total*pick([0.3,0.5,0.7])/10)*10||Math.round(total*0.5);
  let lo=0,hi=T;for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(integrate(s.f,0,mid)<N)lo=mid;else hi=mid;}const x=(lo+hi)/2;
  return build('one_rate',tier,`onet-${C.F}-${M}-${T}-${N}`,ctx,[`${F}=${s.tex}`],[decPart(`At what time ${m('t')} does the total since ${m('t=0')} reach ${comma(N)} ${C.amt}?`,x,C.unit,
   step('Write the total as a function of time.',`The total from 0 to ${m('x')} is an accumulation function; set it equal to ${comma(N)}.`,`\\int_{0}^{x}${F}\\,dt=${nt(N)}`)+
   step('Solve with the calculator.',`Because ${m(F)} is positive, the total increases, so there is exactly one solution. Graph ${m(`y=\\int_{0}^{x}${F}\\,dt-${nt(N)}`)} (or use a solver) and find its zero.`,`x\\approx ${fx(x)}`),[{value:N/s.f(0),note:'The rate is not constant, so dividing by the starting rate does not give the time.'}])]);
 }
 const L=Math.round(M*pick([0.9,1,1.1]));const zs=roots(t=>s.f(t)-L,0,T,{steps:4000});if(zs.length<1||zs.length>3)return null;
 const pts=[0,...zs,T],win=[];for(let i=0;i<pts.length-1;i++)if(s.f((pts[i]+pts[i+1])/2)>L)win.push([pts[i],pts[i+1]]);if(!win.length)return null;
 const v=win.reduce((acc,[a,b])=>acc+integrate(s.f,a,b),0);
 return build('one_rate',tier,`onel-${C.F}-${M}-${T}-${L}`,ctx,[`${F}=${s.tex}`],[decPart(`From ${m('t=0')} to ${m(`t=${T}`)}, how many ${C.amt} ${C.ask} during the times when the rate is greater than ${L} ${C.amt} per ${C.one}?`,v,C.amt,
  step(`Find when the rate equals ${L}.`,`Solve ${m(`${F}=${L}`)} on ${m(`[0,${T}]`)} with the calculator.`,zs.map(z=>`t\\approx ${fx(z)}`).join(',\\quad '))+
  step(`Keep the windows where ${m(`${F}\\gt ${L}`)}.`,'Test a value in each piece between those times.',win.map(([a,b])=>`${fe(a)}\\lt t\\lt ${fe(b)}`).join(',\\quad '))+
  step('Integrate the rate over those windows only.','',`${win.map(([a,b])=>int(F,fe(a),fe(b))).join('+')}\\approx ${fx(v)}`),[{value:integrate(s.f,0,T),note:'That integrates over the whole interval. Only the times when the rate is above the level count.'}])]);
}
const termHalf=b=>b%2===0?(b/2===1?'':String(b/2)):`\\frac{${b}}{2}`;

// ======================================================================
// 2. initial amount plus or minus accumulated change
function famInitial(tier){
 const C=pick(TANK),T=pick(C.T),M=pick(C.M),A0=pick(C.A0);
 if(tier==='foundational'&&U.rand()<0.35){ // no calculator: a net rate that is a polynomial
  const a=ri(2,8)*5,b=ri(1,4)*2,Tn=pick([2,3,4]),net=`${a}-${b}t`,val=Q(2*A0+2*a*Tn-b*Tn*Tn,2);
  return build('initial_change',tier,`ini-poly-${A0}-${a}-${b}-${Tn}`,`At ${m('t=0')}, ${C.what} contains ${comma(A0)} ${C.amt}. The amount changes at a net rate of ${m('N(t)')} ${C.amt} per ${C.one}, where ${tUnits(C)}.`,[`N(t)=${net}`],
   [exactPart(`How many ${C.amt} are in ${C.ref} at ${m(`t=${Tn}`)}?`,val,C.amt,step('Start with the initial amount and add the net change.','The integral of the net rate gives the change in the amount, so add it to the starting amount.',`A(${Tn})=${nt(A0)}+\\int_{0}^{${Tn}}\\left(${net}\\right)dt`)+
    step('Integrate.','',`\\int_{0}^{${Tn}}\\left(${net}\\right)dt=\\left[${a}t-${termHalf(b)}t^{2}\\right]_{0}^{${Tn}}=${qtex(Q(2*a*Tn-b*Tn*Tn,2))}`,`A(${Tn})=${nt(A0)}${2*a*Tn-b*Tn*Tn<0?'-'+qtex(Q(b*Tn*Tn-2*a*Tn,2)):'+'+qtex(Q(2*a*Tn-b*Tn*Tn,2))}=${qtex(val)}`),
    [{value:(2*a*Tn-b*Tn*Tn)/2,note:`That is only the change. Add the initial ${comma(A0)} ${C.amt}.`}])],false);
 }
 const s=positive(M,T);if(!s)return null;
 const sign=tier==='foundational'?1:pick([1,-1]);const F=sign>0?`${C.inF}(t)`:`${C.outF}(t)`;
 const rateText=sign>0?C.inText(m(F)):C.outText(m(F)).replace(/^./,c=>c.toUpperCase());
 if(tier==='challenging'&&U.rand()<0.5){ // work backward from a later amount
  const AT=Math.round(A0+sign*integrate(s.f,0,T)),t1=Math.round(T*pick([0.25,0.5])),At1=AT-sign*integrate(s.f,t1,T);if(AT<=0||At1<=0)return null;
  const ctx=`At ${at(C,T)}, ${C.what} contains ${comma(AT)} ${C.amt}. Since ${at(C,0)}, ${rateText.replace(/^./,c=>c.toLowerCase())}, where ${tUnits(C)}.`;
  return build('initial_change',tier,`back-${C.outF}-${AT}-${T}-${t1}`,ctx,[`${F}=${s.tex}`],[decPart(`How many ${C.amt} were in ${C.ref} at ${at(C,t1)}?`,At1,C.amt,
   step('Relate the two times.',`From ${m(`t=${t1}`)} to ${m(`t=${T}`)} the amount ${sign>0?'increases':'decreases'} by ${m(int(F,t1,T))}, so ${m(`A(${T})=A(${t1})${sign>0?'+':'-'}${int(F,t1,T)}`)}.`)+
   step(`Solve for ${m(`A(${t1})`)}.`,`${sign>0?'Subtract':'Add'} the change.`,`A(${t1})=${nt(AT)}${sign>0?'-':'+'}${int(F,t1,T)}\\approx ${nt(AT)}${sign>0?'-':'+'}${fx(integrate(s.f,t1,T))}\\approx ${fx(At1)}`),
   [{value:AT+sign*integrate(s.f,t1,T),note:'Going back in time reverses the change: undo it rather than repeating it.'}])]);
 }
 const t2=tier==='foundational'?T:Math.round(T*pick([0.5,0.75,1]));const I=integrate(s.f,0,t2),v=A0+sign*I;if(v<=0)return null;
 const ctx=`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${rateText}, where ${tUnits(C)}.`;
 return build('initial_change',tier,`ini-${sign>0?C.inF:C.outF}-${A0}-${M}-${t2}`,ctx,[`${F}=${s.tex}`],[decPart(`How many ${C.amt} are in ${C.ref} at ${at(C,t2)}?`,v,C.amt,
  step('Start with the initial amount and account for the change.',`The integral of the rate is the amount ${sign>0?'added':'removed'}, so ${sign>0?'add it to':'subtract it from'} the starting amount.`,`A(${t2})=${nt(A0)}${sign>0?'+':'-'}${int(F,0,t2)}`)+CALC_STEP(F,0,t2,I)+
  step('Combine.','',`A(${t2})\\approx ${nt(A0)}${sign>0?'+':'-'}${fx(I)}=${fx(v)}`),[{value:I,note:`That is only the amount ${sign>0?'added':'removed'}. Include the initial ${comma(A0)} ${C.amt}.`},{value:A0-sign*I,note:`The ${C.amt} are being ${sign>0?'added':'removed'}, so the change should be ${sign>0?'added to':'subtracted from'} the starting amount.`}])]);
}

// ======================================================================
// 3. inflow and outflow at the same time
function inOut(C,T,M,opts={}){
 // an inflow and an outflow of similar size; cross=true asks for the net rate to change sign on (0, T)
 for(let i=0;i<30;i++){
  const constIn=opts.constIn,inS=constIn?{tex:String(M),f:()=>M,d:()=>0,kind:'const'}:positive(M,T),outS=positive(Math.round(M*pick([0.85,1,1.15])),T);if(!inS||!outS||inS.kind===outS.kind)continue;
  const net=t=>inS.f(t)-outS.f(t),zs=roots(net,0,T,{steps:4000}).filter(z=>z>1e-6&&z<T-1e-6);
  if(opts.cross&&(zs.length<1||zs.length>2))continue;
  if(opts.cross&&zs.some(z=>{const h=1e-4;return Math.sign(net(z-h))===Math.sign(net(z+h));}))continue;
  return{inS,outS,net,zs};
 }
 return null;
}
function famInOut(tier){
 const C=pick(TANK),T=pick(C.T),M=pick(C.M),A0=pick(C.A0);
 const io=inOut(C,T,M,{constIn:tier==='foundational'});if(!io)return null;
 const {inS,outS}=io,Fi=`${C.inF}(t)`,Fo=`${C.outF}(t)`;
 const ctx=`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${C.inText(inS.kind==='const'?`${M}`:m(Fi))}, and ${C.outText(m(Fo))}, where ${tUnits(C)}.`;
 const forms=inS.kind==='const'?[`${Fo}=${outS.tex}`]:[`${Fi}=${inS.tex}`,`${Fo}=${outS.tex}`];
 const Iin=integrate(inS.f,0,T),Iout=integrate(outS.f,0,T);
 const inTex=inS.kind==='const'?`${T}(${M})`:int(Fi,0,T);
 if(tier==='intermediate'&&U.rand()<0.4){ // total that left (not the amount present)
  return build('in_out',tier,`outtotal-${C.outF}-${M}-${T}`,ctx,forms,[decPart(`How many ${C.amt} ${C.outQ} from ${at(C,0)} to ${at(C,T)}?`,Iout,C.amt,
   step('Use only the outflow rate.',`The question asks for the ${C.outNoun}, not the amount present, so integrate only ${m(Fo)}; the inflow and the initial amount do not matter.`,int(Fo,0,T))+CALC_STEP(Fo,0,T,Iout),
   [{value:A0+Iin-Iout,note:'That is the amount present at the end. The question asks only for the total outflow.'},{value:Iin-Iout,note:'That is the net change. The question asks only for the total outflow.'}])]);
 }
 const v=A0+Iin-Iout;
 return build('in_out',tier,`io-${C.inF}${C.outF}-${A0}-${M}-${T}`,ctx,forms,[decPart(`How many ${C.amt} are in ${C.ref} at ${at(C,T)}?`,v,C.amt,
  step('Set up the amount.',`The amount changes at the net rate ${m(`${inS.kind==='const'?M:Fi}-${Fo}`)}: inflow adds and outflow removes.`,`A(${T})=${nt(A0)}+${inTex}-${int(Fo,0,T)}`)+
  step('Evaluate each part.',inS.kind==='const'?'A constant rate times the elapsed time is the amount added; integrate the outflow with the calculator.':'Integrate each rate with the calculator.',
   ...(inS.kind==='const'?[`${T}(${M})=${nt(M*T)}`]:[`${int(Fi,0,T)}\\approx ${fx(Iin)}`]),`${int(Fo,0,T)}\\approx ${fx(Iout)}`)+
  step('Combine.','',`A(${T})\\approx ${nt(A0)}+${fx(Iin)}-${fx(Iout)}\\approx ${fx(v)}`),
  [{value:A0+Iin+Iout,note:'Outflow removes material: subtract its integral.'},{value:Iin-Iout,note:`That is the net change. Add the initial ${comma(A0)} ${C.amt}.`},{value:A0-Iin+Iout,note:'Inflow adds and outflow removes; check the signs.'}])]);
}

// ======================================================================
// 4. delayed starts, early stops and piecewise rates
function famDelayed(tier){
 const C=pick(TANK),T=pick(C.T),M=pick(C.M),A0=pick(C.A0);
 if(tier==='intermediate'&&U.rand()<0.5||tier==='challenging'&&U.rand()<0.3){ // a piecewise rate
  const s1=positive(M,T),s2=positive(Math.round(M*pick([0.7,1.2])),T);if(!s1||!s2)return null;const b=Math.round(T*pick([0.4,0.5,0.6]));
  const F=`${C.inF}(t)`,I1=integrate(s1.f,0,b),I2=integrate(s2.f,b,T),v=A0+I1+I2;
  return build('delayed_piecewise',tier,`pw-${C.inF}-${M}-${T}-${b}`,`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${C.inText(m(F))}, where ${tUnits(C)} and the rate is given by a piecewise formula. Nothing is removed.`,
   [`${F}=\\begin{cases}${s1.tex}, & 0\\le t\\lt ${b}\\\\ ${s2.tex}, & ${b}\\le t\\le ${T}\\end{cases}`],[decPart(`How many ${C.amt} are in ${C.ref} at ${at(C,T)}?`,v,C.amt,
   step('Split the integral where the formula changes.',`Each formula applies only on its own time interval, so integrate each piece over that interval and add.`,`A(${T})=${nt(A0)}+\\int_{0}^{${b}}\\left(${s1.tex}\\right)dt+\\int_{${b}}^{${T}}\\left(${s2.tex}\\right)dt`)+
   step('Evaluate with the calculator.','',`\\int_{0}^{${b}}\\left(${s1.tex}\\right)dt\\approx ${fx(I1)}`,`\\int_{${b}}^{${T}}\\left(${s2.tex}\\right)dt\\approx ${fx(I2)}`)+
   step('Combine.','',`A(${T})\\approx ${nt(A0)}+${fx(I1)}+${fx(I2)}=${fx(v)}`),
   [{value:A0+integrate(s1.f,0,T),note:`The first formula applies only until ${'t = '+b}; switch formulas there.`},{value:A0+integrate(s2.f,0,T),note:`The second formula applies only from ${'t = '+b} on.`}])]);
 }
 const io=inOut(C,T,M,{});if(!io)return null;const {inS,outS}=io,Fi=`${C.inF}(t)`,Fo=`${C.outF}(t)`;
 const kind=tier==='foundational'?'late_out':pick(['late_out','early_in','both']);
 const s=Math.round(T*pick([0.25,0.4,0.5])),e=kind==='early_in'||kind==='both'?Math.round(T*pick([0.6,0.75])):T;
 const inA=0,inB=kind==='early_in'||kind==='both'?e:T,outA=kind==='late_out'||kind==='both'?s:0,outB=T;if(outA>=outB||inB<=inA)return null;
 const Iin=integrate(inS.f,inA,inB),Iout=integrate(outS.f,outA,outB),v=A0+Iin-Iout;if(v<=0)return null;
 const inWhen=inB<T?` from ${at(C,0)} until ${at(C,inB)}`:` from ${at(C,0)} to ${at(C,T)}`,outWhen=outA>0?`starting at ${at(C,outA)} and continuing until ${at(C,T)}`:`from ${at(C,0)} to ${at(C,T)}`;
 const ctx=`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${C.inText(m(Fi))}${inWhen}. Also, ${C.outText(m(Fo))} ${outWhen}. Here ${tUnits(C)}.`;
 return build('delayed_piecewise',tier,`del-${kind}-${C.inF}-${M}-${T}-${s}-${e}`,ctx,[`${Fi}=${inS.tex}`,`${Fo}=${outS.tex}`],[decPart(`How many ${C.amt} are in ${C.ref} at ${at(C,T)}?`,v,C.amt,
  step('Integrate each rate only while it applies.',`Inflow runs for ${m(`${inA}\\le t\\le ${inB}`)} and outflow for ${m(`${outA}\\le t\\le ${outB}`)}, so those are the limits of the two integrals.`,`A(${T})=${nt(A0)}+${int(Fi,inA,inB)}-${int(Fo,outA,outB)}`)+
  step('Evaluate with the calculator.','',`${int(Fi,inA,inB)}\\approx ${fx(Iin)}`,`${int(Fo,outA,outB)}\\approx ${fx(Iout)}`)+
  step('Combine.','',`A(${T})\\approx ${nt(A0)}+${fx(Iin)}-${fx(Iout)}\\approx ${fx(v)}`),
  [{value:A0+integrate(inS.f,0,T)-integrate(outS.f,0,T),note:'Each rate only applies during its own time window; adjust the limits of integration.'},{value:Iin-Iout,note:`That is the net change. Add the initial ${comma(A0)} ${C.amt}.`}])]);
}

// ======================================================================
// 5. increasing / decreasing analysis
function famMonotonic(tier){
 const C=pick(TANK),T=pick(C.T),M=pick(C.M),A0=pick(C.A0);
 const io=inOut(C,T,M,{cross:true});if(!io)return null;const {inS,outS,net,zs}=io,Fi=`${C.inF}(t)`,Fo=`${C.outF}(t)`;
 const ctx=`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${C.inText(m(Fi))}, and ${C.outText(m(Fo))}, where ${tUnits(C)} and ${m(`0\\le t\\le ${T}`)}.`;
 const forms=[`${Fi}=${inS.tex}`,`${Fo}=${outS.tex}`];
 if(tier==='foundational'){
  const c=Math.round(T*pick([0.25,0.5,0.75]));const d=net(c);if(Math.abs(d)<0.05)return null;
  return build('monotonic',tier,`mono-${C.inF}-${M}-${T}-${c}`,ctx,forms,[decPart(`Find the rate at which the amount in ${C.ref} is changing at ${at(C,c)}. Include the sign.`,d,`${C.amt} per ${C.one}`,
   step('The rate of change of the amount is the net rate.',`${m(`A'(t)=${Fi}-${Fo}`)}: inflow minus outflow. No integral is needed for a rate at one instant.`,`A'(${c})=${C.inF}(${c})-${C.outF}(${c})\\approx ${fx(inS.f(c))}-${fx(outS.f(c))}\\approx ${sgn(d)}`)+
   step('Interpret the sign.',`${m(`A'(${c})`)} is ${d>0?'positive':'negative'}, so the amount is ${d>0?'increasing':'decreasing'} at that moment.`),
   [{value:A0+integrate(net,0,c),note:'That is the amount at that time. The question asks for its rate of change, inflow minus outflow.'},{value:inS.f(c)+outS.f(c),note:'Outflow decreases the amount: subtract the outflow rate.'}])]);
 }
 if(tier==='intermediate'){
  if(U.rand()<0.5){ // is the inflow rate itself increasing? (rate versus its derivative)
   const c=Math.round(T*pick([0.3,0.5,0.7]))||1,dd=inS.d(c);if(Math.abs(dd)<0.01||inS.kind==='const')return null;
   return build('monotonic',tier,`dmono-${C.inF}-${M}-${T}-${c}`,ctx,forms,[decPart(`Find ${m(`${C.inF}'(${c})`)}. Include the sign.`,dd,`${C.amt} per ${C.one} per ${C.one}`,
    step('Differentiate the rate, not the amount.',`${m(`${C.inF}'(t)`)} tells how fast the inflow rate itself is changing; use the calculator's numerical derivative at ${m(`t=${c}`)}.`,`${C.inF}'(${c})\\approx ${sgn(dd)}`)+
    step('Interpret.',`At ${m(`t=${c}`)} the inflow rate is ${dd>0?'increasing':'decreasing'} by about ${fx(Math.abs(dd))} ${C.amt} per ${C.one}, each ${C.one}. This describes the rate, not whether the amount in ${C.ref} is rising.`),
    [{value:inS.f(c),note:`That is the inflow rate at ${'t = '+c}. The question asks how fast that rate is changing: its derivative.`},{value:net(c),note:'That is the rate of change of the amount. The question asks about the derivative of the inflow rate.'}])]);
  }
  const pts=[0,...zs,T],up=[];for(let i=0;i<pts.length-1;i++)if(net((pts[i]+pts[i+1])/2)>0)up.push([pts[i],pts[i+1]]);if(!up.length)return null;
  const texIv=up.map(([a,b])=>`\\left(${fe(a)},\\,${fe(b)}\\right)`).join('\\cup ');
  return build('monotonic',tier,`imono-${C.inF}-${M}-${T}`,ctx,forms,[{prompt:`On what interval or intervals is the amount in ${C.ref} increasing? Give endpoints correct to three decimal places.`,
   answer:{kind:'interval',variable:'t',tolerance:0.0015,anyBrackets:true,parts:up.map(([a,b])=>({left:a,right:b}))},answerTex:texIv,keypadMode:'unit5-rate-intervals',placeholder:'Interval, e.g. (0, 2.5)',
   explanation:step('The amount increases where the net rate is positive.',`${m(`A'(t)=${Fi}-${Fo}`)}, so find where inflow exceeds outflow.`)+
    step('Find where inflow equals outflow.',`Solve ${m(`${Fi}=${Fo}`)} on ${m(`[0,${T}]`)} with the calculator.`,zs.map(z=>`t\\approx ${fx(z)}`).join(',\\quad '))+
    step('Test the sign on each piece.',`Choose a time in each piece and compare the two rates. The net rate is positive on ${up.length>1?'these intervals':'this interval'}:`,texIv)}]);
 }
 // challenging: when is the amount greatest (or least)?
 const pts=[0,...zs,T],A=t=>A0+integrate(net,0,t),vals=pts.map(A);
 const wantMax=pick([true,false]);let bi=0;vals.forEach((v,i)=>{if(wantMax?v>vals[bi]:v<vals[bi])bi=i;});
 const runner=[...vals].sort((a,b)=>wantMax?b-a:a-b)[1];if(Math.abs(vals[bi]-runner)<0.01)return null;
 const tStar=pts[bi];
 const cand=pts.map((t,i)=>`A(${fe(t)})\\approx ${fx(vals[i])}`);
 return build('monotonic',tier,`emono-${C.inF}-${M}-${T}-${wantMax?'max':'min'}`,ctx,forms,[decPart(`At what time ${m('t')} is the amount in ${C.ref} ${wantMax?'greatest':'least'} on ${m(`0\\le t\\le ${T}`)}?`,tStar,C.unit,
  step('Find the critical times.',`${m(`A'(t)=${Fi}-${Fo}`)}, so the critical times are where inflow equals outflow. Solve with the calculator.`,zs.map(z=>`t\\approx ${fx(z)}`).join(',\\quad '))+
  step('Compare the candidates.',`An absolute ${wantMax?'maximum':'minimum'} on a closed interval occurs at a critical time or an endpoint. Evaluate ${m(`A(t)=${nt(A0)}+\\int_{0}^{t}\\left(${Fi}-${Fo}\\right)dx`)} at each.`,...cand)+
  step('Choose.',`The ${wantMax?'largest':'smallest'} value occurs at ${m(`t\\approx ${fx(tStar)}`)}.`),
  [{value:pts[(bi+1)%pts.length],note:`Compare the amount at every candidate, including the endpoints; the ${wantMax?'greatest':'least'} amount is somewhere else.`}])]);
}

// ======================================================================
// 6. connected multi-part problems
function famMulti(tier){
 const C=pick(TANK),T=pick(C.T),M=pick(C.M),A0=pick(C.A0);
 const io=inOut(C,T,M,{cross:tier==='challenging'});if(!io)return null;const {inS,outS,net,zs}=io,Fi=`${C.inF}(t)`,Fo=`${C.outF}(t)`;
 const ctx=`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${C.inText(m(Fi))}, and ${C.outText(m(Fo))}, where ${tUnits(C)} and ${m(`0\\le t\\le ${T}`)}.`;
 const forms=[`${Fi}=${inS.tex}`,`${Fo}=${outS.tex}`];
 const Iin=integrate(inS.f,0,T),Iout=integrate(outS.f,0,T),AT=A0+Iin-Iout,c=Math.round(T*pick([0.3,0.5,0.7]))||1,d=net(c);
 const pIn=decPart(`How many ${C.amt} enter ${C.ref} from ${m('t=0')} to ${m(`t=${T}`)}?`,Iin,C.amt,step('Integrate the inflow rate only.',`The total that enters is the integral of the inflow rate; outflow does not affect it.`,`${int(Fi,0,T)}\\approx ${fx(Iin)}`));
 const pAmt=decPart(`How many ${C.amt} are in ${C.ref} at ${m(`t=${T}`)}?`,AT,C.amt,step('Add the net change to the initial amount.','The net change is inflow minus outflow over the whole interval.',`A(${T})=${nt(A0)}+${int(Fi,0,T)}-${int(Fo,0,T)}`,`\\approx ${nt(A0)}+${fx(Iin)}-${fx(Iout)}\\approx ${fx(AT)}`),
  [{value:Iin-Iout,note:`That is the net change. Add the initial ${comma(A0)} ${C.amt}.`}]);
 const pRate=decPart(`Find the rate at which the amount in ${C.ref} is changing at ${m(`t=${c}`)}. Include the sign.`,d,`${C.amt} per ${C.one}`,step('Use the net rate at that instant.',`${m(`A'(${c})=${C.inF}(${c})-${C.outF}(${c})`)}; ${d>0?'positive, so the amount is increasing':'negative, so the amount is decreasing'}.`,`A'(${c})\\approx ${fx(inS.f(c))}-${fx(outS.f(c))}\\approx ${sgn(d)}`));
 let parts;
 if(tier==='foundational')parts=[pIn,pAmt];
 else if(tier==='intermediate')parts=[pAmt,pRate];
 else{
  const pts=[0,...zs,T],A=t=>A0+integrate(net,0,t),vals=pts.map(A);let bi=0;vals.forEach((v,i)=>{if(v>vals[bi])bi=i;});
  const runner=[...vals].sort((a,b)=>b-a)[1];if(Math.abs(vals[bi]-runner)<0.01)return null;
  const pMax=decPart(`What is the greatest amount in ${C.ref} on ${m(`0\\le t\\le ${T}`)}?`,vals[bi],C.amt,step('Find the candidates.',`Critical times are where ${m(`${Fi}=${Fo}`)}; check them and the endpoints.`,zs.map(z=>`t\\approx ${fx(z)}`).join(',\\quad '))+
   step('Evaluate the amount at each candidate.','',...pts.map((t,i)=>`A(${fe(t)})\\approx ${fx(vals[i])}`))+step('Choose the largest.',`The greatest amount is about ${fx(vals[bi])} ${C.amt}, at ${m(`t\\approx ${fx(pts[bi])}`)}.`),
   [{value:pts[bi],note:'That is the time. The question asks for the greatest amount.'}]);
  parts=[pAmt,pRate,pMax];
 }
 return build('multipart',tier,`multi-${C.inF}${C.outF}-${A0}-${M}-${T}-${c}`,ctx,forms,parts);
}

const FAMILIES={
 one_rate:{weight:25,tiers:['foundational','intermediate','challenging'],make:famOne},
 initial_change:{weight:20,tiers:['foundational','intermediate','challenging'],make:famInitial},
 in_out:{weight:20,tiers:['foundational','intermediate','challenging'],make:famInOut},
 delayed_piecewise:{weight:15,tiers:['foundational','intermediate','challenging'],make:famDelayed},
 monotonic:{weight:10,tiers:['foundational','intermediate','challenging'],make:famMonotonic},
 multipart:{weight:10,tiers:['foundational','intermediate','challenging'],make:famMulti},
};
const engine=U.makeEngine('rate',FAMILIES);
U.profile('unit5-rate-exact',{fraction:true,arithmetic:true,parentheses:true});
U.profile('unit5-rate-intervals',{decimal:true,parentheses:true,list:true,interval:true,brackets:false});
window.BatchMathUnit5Rate=Object.freeze({make:engine.make,FAMILIES,weights:engine.weights,shape,SHAPES});
U.register('rate-problems',o=>engine.make(o||{}));
})();
