/* BatchMath v12.8.X — Unit 5 engine 6: Rate Problems / Accumulation.
   v12.8.X: routine practice is accumulation only. Families (mixed mode): accumulate one rate 25%, initial amount
   plus or minus accumulated change 25%, simultaneous inflow and outflow 25%, delayed starts / stops / piecewise
   rates 15%, connected accumulation multi-part problems 10%. W's increasing / decreasing family, the derivative of
   a rate (E'(t)), the net rate at an instant, greatest and least amounts, and target-time / above-a-level
   investigations are removed (they belong to a future FRQ-style section). Every family offers calculator problems
   (numerical integrals, three decimal places) and non-calculator problems (polynomial, √t, A + B·cos(πt/k) and
   c/(t+1) rates with exact integrals) on all three tiers; mixed practice draws a non-calculator problem 30% of the
   time. Integrals use the shared adaptive Gauss-Legendre rule; a rate is integrated only over the times it applies. */
(function(){
'use strict';
const U=window.BatchMathUnit5Core;
if(!U)return;
const {Q,qv,qadd,qsub,qmul,qneg,qzero,qtex,pick,ri,nz,step,m,question,problem,fix,integrate,Poly,termTex}=U;

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
  case 'cos':{const B=r1(M*pick([0.15,0.25,0.35]));return{tex:`${M}+${B}\\cos\\left(${frac('t',c3)}\\right)`,f:t=>M+B*Math.cos(t/c3)};}
  case 'sin':{const B=r1(M*pick([0.15,0.25,0.35]));return{tex:`${M}+${B}\\sin\\left(${frac('t',c3)}\\right)`,f:t=>M+B*Math.sin(t/c3)};}
  case 'sinsqrt':{const B=r1(M*pick([0.2,0.3,0.4])),c=pick([1,2,3]);return{tex:`${M}+${B}\\sin\\left(${c===1?'':c}\\sqrt{t}\\right)`,f:t=>M+B*Math.sin(c*Math.sqrt(t))};}
  case 'log':{const a=r1(M/Math.log(T/2+1)),b=pick([0,r1(M*0.2)]);return{tex:`${a}\\ln(t+1)${b?`+${b}`:''}`,f:t=>a*Math.log(t+1)+b,nonneg:true};}
  case 'exp':{const A=r1(M*pick([0.6,0.8])),b=r1(M*pick([0.2,0.4])),c=r1(T/pick([2,3,4]));return{tex:`${A}e^{-${frac('t',c)}}+${b}`,f:t=>A*Math.exp(-t/c)+b};}
  case 'bump':{const c=r1(T/pick([2,3])),A=Math.max(1,Math.round(M*Math.E/c));return{tex:`${A===1?'':A}te^{-${frac('t',c)}}`,f:t=>A*t*Math.exp(-t/c),nonneg:true};}
  case 'rational':{const c=pick([4,9,16,25]),A=r1(2*Math.sqrt(c)*M);return{tex:`\\frac{${A}t}{t^{2}+${c}}`,f:t=>A*t/(t*t+c),nonneg:true};}
  case 'cossq':{const B=r1(M*pick([0.15,0.25])),c=r1(T*T/pick([8,15,30]));return{tex:`${M}+${B}\\cos\\left(\\frac{t^{2}}{${nt(c)}}\\right)`,f:t=>M+B*Math.cos(t*t/c)};}
  case 'pow2':{const B=r1(M*pick([0.3,0.5])),c=r1(T/pick([3,5]));return{tex:`${M}+${B}\\cdot 2^{-${frac('t',c)}}`,f:t=>M+B*Math.pow(2,-t/c)};}
  case 'sqrtlin':{const c=pick([1,4,9]),A=r1(M/Math.sqrt(T/2+c));return{tex:`${A}\\sqrt{t+${c}}`,f:t=>A*Math.sqrt(t+c)};}
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
 return{prompt:`${prompt} ${DEC}`,answer:{kind:'numeric',value,places:3,wrongValues:wrong.filter(w=>Number.isFinite(w.value)&&U.roundScaled(w.value,3)!==U.roundScaled(value,3))},
  answerTex:`${fx(value)}${unit?`\\text{ ${unit}}`:''}`,explanation,keypadMode:'unit5-number',placeholder:'Decimal answer'};
}
function exactPart(prompt,x,unit,explanation,wrong=[]){
 const val=xval(x);
 return{prompt,answer:{kind:'exact',value:val,wrongValues:wrong.filter(w=>Number.isFinite(w.value)&&Math.abs(w.value-val)>1e-9*Math.max(1,Math.abs(val)))},answerTex:`${xtex(x)}${unit?`\\text{ ${unit}}`:''}`,explanation,
  keypadMode:x.l&&!qzero(x.l)?'unit5-rate-exact-ln':x.p&&!qzero(x.p)?'unit5-rate-exact-pi':'unit5-rate-exact',placeholder:'Exact value'};
}
function build(family,tier,id,ctx,formulas,parts,calculator){
 return problem({engine:'rate',family,tier,id:String(id).replace(/[^A-Za-z0-9_.-]+/g,''),calculator,
  questionHtml:question({context:ctx,formulas,prompt:parts.length>1?'Answer each part.':'',calculator}),parts});
}
const CALC_STEP=(F,a,b,v,why)=>step('Evaluate with the calculator.',why||'Use the numerical integration feature; store the result rather than retyping a rounded value.',`${int(F,a,b)}\\approx ${fx(v)}`);
const NONCALC_SHARE=0.3; // mixed practice: share of non-calculator problems in each family
const wantsCalc=calc=>calc===true||calc===false?calc:U.rand()>=NONCALC_SHARE;

// ---------- exact values r + p/π + l·ln(la) (non-calculator answers) ----------
const X=(r=Q(0),p=Q(0),l=Q(0),la=Q(1))=>({r,p,l,la});
function xadd(a,b,s=1){
 const S=q=>s===1?q:qneg(q);
 if(!qzero(a.l)&&!qzero(b.l)&&!(a.la.n===b.la.n&&a.la.d===b.la.d))throw Error('two different logarithms');
 return X(qadd(a.r,S(b.r)),qadd(a.p,S(b.p)),qadd(a.l,S(b.l)),qzero(a.l)?b.la:a.la);
}
const xval=x=>qv(x.r)+qv(x.p)/Math.PI+qv(x.l)*Math.log(qv(x.la));
const px=x=>{const t=xtex(x);return /^-| [-+] /.test(t)?`\\left(${t}\\right)`:t;}; // a value inside a sum, in parentheses only when needed
function xtex(x){
 const items=[];
 if(!qzero(x.r))items.push({q:x.r,body:''});
 if(!qzero(x.l))items.push({q:x.l,body:`\\ln ${x.la.d===1?x.la.n:`\\left(\\frac{${x.la.n}}{${x.la.d}}\\right)`}`});
 let tex=items.map((it,i)=>termTex(it.q,it.body,i===0)).join('');
 if(!qzero(x.p)){const a=Math.abs(x.p.n),d=x.p.d,piT=`\\frac{${a}}{${d===1?'':d}\\pi}`;tex+=tex?(x.p.n<0?' - ':' + ')+piT:(x.p.n<0?'-':'')+piT;}
 return tex||'0';
}
// exact rates: tex, numeric f, antiderivative tex, exact integral on [a,b] with its evaluation step
const ascTex=P=>{const items=P.c.map((q,i)=>({q,body:i===0?'':i===1?'t':`t^{${i}}`})).filter(it=>!qzero(it.q));return items.length?items.map((it,k)=>termTex(it.q,it.body,k===0)).join(''):'0';};
function polyRate(c){
 const P=new Poly(c.map(v=>Q(v))),F=P.integ(0);
 return{kind:'poly',tex:ascTex(P),f:t=>P.f(t),anti:ascTex(F),
  I:(a,b)=>X(qsub(F.at(Q(b)),F.at(Q(a)))),
  work:(a,b)=>{const hi=F.at(Q(b)),lo=F.at(Q(a));return `\\left[${ascTex(F)}\\right]_{${a}}^{${b}}=${qtex(hi)}${qzero(lo)?'':`${lo.n<0?'+'+qtex(qneg(lo)):'-'+qtex(lo)}=${qtex(qsub(hi,lo))}`}`;}};
}
function sqrtRate(c,d){ // c√t + d on perfect-square endpoints: (2c/3)t^{3/2} + dt
 const k=Q(2*c,3),F=t=>qadd(qmul(k,Q(Math.round(Math.sqrt(t))**3)),Q(d*t));
 const anti=`${termTex(k,'t^{\\frac{3}{2}}',true)}${d?termTex(Q(d),'t',false):''}`;
 return{kind:'sqrt',tex:`${c}\\sqrt{t}${d?`+${d}`:''}`,f:t=>c*Math.sqrt(t)+d,anti,I:(a,b)=>X(qsub(F(b),F(a))),work:(a,b)=>`\\left[${anti}\\right]_{${a}}^{${b}}=${qtex(F(b))}${qzero(F(a))?'':`-${qtex(F(a))}=${qtex(qsub(F(b),F(a)))}`}`};
}
function trigRate(A,B,k,fn){ // A + B·fn(πt/k) at multiples of k/2: antiderivative At ± (Bk/π)·sin or cos
 const arg=k===1?'\\pi t':`\\frac{\\pi t}{${k}}`,tex=`${A}${B<0?'-':'+'}${Math.abs(B)}\\${fn}\\left(${arg}\\right)`;
 const half=t=>Math.round(2*t/k); // t = half·k/2
 const sinH=h=>[0,1,0,-1][((h%4)+4)%4],cosH=h=>[1,0,-1,0][((h%4)+4)%4];
 const F=t=>{const h=half(t);return fn==='cos'?X(Q(A*t),Q(B*k*sinH(h))):X(Q(A*t),Q(-B*k*cosH(h)));}; // value of the antiderivative (r + p/π)
 const bk=Q(B*k),anti=`${A}t${fn==='cos'?(B<0?'-':'+'):(B<0?'+':'-')}\\frac{${Math.abs(B*k)}}{\\pi}\\${fn==='cos'?'sin':'cos'}\\left(${arg}\\right)`;
 return{kind:'trig',tex,f:t=>A+B*(fn==='cos'?Math.cos(Math.PI*t/k):Math.sin(Math.PI*t/k)),anti,I:(a,b)=>xadd(F(b),F(a),-1),
  work:(a,b)=>{const hi=F(b),lo=F(a),z=qzero(lo.r)&&qzero(lo.p);return `\\left[${anti}\\right]_{${a}}^{${b}}=${xtex(hi)}${z?'':`-${px(lo)}=${xtex(xadd(hi,lo,-1))}`}`;}};
}
function recipRate(c,s=1){ // c/(t+s): antiderivative c·ln(t+s)
 const tex=`\\frac{${c}}{t+${s}}`;
 return{kind:'ln',tex,f:t=>c/(t+s),anti:`${c}\\ln(t+${s})`,I:(a,b)=>X(Q(0),Q(0),Q(c),Q(b+s,a+s)),work:(a,b)=>`\\left[${c}\\ln(t+${s})\\right]_{${a}}^{${b}}=${c}\\ln ${b+s}${a+s===1?'':`-${c}\\ln ${a+s}=${xtex(X(Q(0),Q(0),Q(c),Q(b+s,a+s)))}`}`};
}
// an exact rate of typical size M on [0, T]; kinds: a list among poly, sqrt, trig, ln; T is adjusted to fit
function exactRate(kinds,M,T){
 const kind=pick(kinds);
 if(kind==='poly1'){const a=M,b=pick([2,4,6,10])*(M>=60?2:1);return{r:polyRate([a,b]),T};}
 if(kind==='poly1d'){const b=pick([2,4,6])*(M>=60?2:1),a=M+b*T;return{r:polyRate([a,-b]),T};} // decreasing, stays positive
 if(kind==='poly2'){const c=pick([1,2,3]),b=pick([6,8,10,12])*c,a=Math.round(M/2);const Tn=pick([2,3,4,6]);return{r:polyRate([a,b,-3*c]),T:Tn};} // 3c t^2 term integrates to whole numbers
 if(kind==='sqrt'){const c=pick([3,6,9,12])*(M>=60?2:1),d=pick([0,0,Math.round(M/4)]);return{r:sqrtRate(c,d),T:pick([4,9,16].filter(x=>x<=Math.max(T,4)))};}
 if(kind==='trig'){const k=pick([2,4,6,12].filter(x=>x<=2*T)),A=M,B=Math.round(M*pick([0.25,0.5]));return{r:trigRate(A,B,k,pick(['cos','sin'])),T:k/2*pick([1,2,3,4]),k};}
 if(kind==='ln'){const c=pick([20,30,40,60,100]),Tn=pick([1,2,3,4,7,9]);return{r:recipRate(c),T:Tn};}
 throw Error(kind);
}
const exactStep=(F,r,a,b,x,what)=>step(what||'Integrate exactly.',`Find an antiderivative of the rate and evaluate it at the limits${r.kind==='trig'?'; the sine and cosine values at these times are 0 and ±1':''}.`,`${int(F,a,b)}=${r.work(a,b)}`);
// allowed times for an exact rate (where its antiderivative has simple values)
function nodesOf(R){const {r,T}=R;const out=[];for(let t=0;t<=T;t++){if(r.kind==='sqrt'&&!Number.isInteger(Math.sqrt(t)))continue;if(r.kind==='trig'&&(2*t)%R.k!==0)continue;out.push(t);}return out;}
const positiveOn=(f,a,b,strict=true)=>{for(let i=0;i<=200;i++){const v=f(a+(b-a)*i/200);if(strict?!(v>0):v<0)return false;}return true;};
const NC_KINDS={foundational:['poly1','poly1d'],intermediate:['poly2','sqrt','poly1'],challenging:['trig','ln','sqrt','poly2']};
function exactFor(tier,M,T,kinds=NC_KINDS[tier]){
 for(let i=0;i<20;i++){const R=exactRate(kinds,M,T);if(positiveOn(R.r.f,0,R.T,R.r.kind!=='sqrt'))return R;}
 return null;
}

// ======================================================================
// 1. accumulate one rate
function famOne(tier,calc){
 const C=pick(ONE),M=pick(C.M),F=`${C.F}(t)`;
 const ctx=`${C.who} at a rate of ${m(F)} ${C.amt} per ${C.one}, where ${tUnits(C)}.`;
 if(!wantsCalc(calc)){ // exact integrals
  const R=exactFor(tier,M,pick(C.T));if(!R)return null;const {r,T}=R,nodes=nodesOf(R);
  let a=0,b=T;if(tier!=='foundational'&&U.rand()<0.4){const inner=nodes.filter(t=>t>0&&t<T);if(inner.length){a=pick(inner);b=pick(nodes.filter(t=>t>a));}}
  const x=r.I(a,b);if(!(xval(x)>0))return null;
  if(tier==='challenging'&&a===0&&U.rand()<0.4){ // average rate on [0, T]
   const avg=X(qmul(x.r,Q(1,T)),qmul(x.p,Q(1,T)),qmul(x.l,Q(1,T)),x.la);
   return build('one_rate',tier,`onea-ex-${C.F}-${r.kind}-${T}`,ctx,[`${F}=${r.tex}`],[exactPart(`What is the average rate, in ${C.amt} per ${C.one}, from ${m('t=0')} to ${m(`t=${T}`)}? Give an exact answer.`,avg,`${C.amt} per ${C.one}`,
    step('Use the average value of a function.','The average rate is the total accumulated divided by the length of the time interval.',`\\frac{1}{${T}-0}${int(F,0,T)}`)+exactStep(F,r,0,T,x)+
    step('Divide by the length of the interval.','',`${/^-| [-+] /.test(xtex(x))?`\\frac{1}{${T}}\\left(${xtex(x)}\\right)`:`\\frac{${xtex(x)}}{${T}}`}=${xtex(avg)}`),[{value:xval(x),note:'That is the total. The average rate divides the total by the length of the interval.'},{value:(r.f(0)+r.f(T))/2,note:'Averaging the two endpoint rates is not the average value of the rate. Integrate and divide by the interval length.'}])],false);
  }
  return build('one_rate',tier,`one-ex-${C.F}-${r.kind}-${a}-${b}`,ctx,[`${F}=${r.tex}`],[exactPart(`How many ${C.amt} ${C.ask} from ${at(C,a)} to ${at(C,b)}? Give an exact answer.`,x,C.amt,
   step('Set up the accumulation.',`${m(F)} is a rate in ${C.amt} per ${C.one}, so integrating it over the time interval gives the total number of ${C.amt}.${a>0?` Only ${m(`${a}\\le t\\le ${b}`)} counts, so the limits are ${m(a)} and ${m(b)}.`:''}`,int(F,a,b))+exactStep(F,r,a,b,x),
   [{value:r.f(b),note:`That is the rate at ${'t = '+b}, not the total. Integrate the rate over the time interval.`},{value:r.f(b)*(b-a),note:'The rate is not constant, so rate × time does not give the total. Integrate the rate.'}])],false);
 }
 const T=pick(C.T),s=positive(M,T);if(!s)return null;
 if(tier==='foundational'){
  const v=integrate(s.f,0,T);
  return build('one_rate',tier,`one-${C.F}-${M}-${T}`,ctx,[`${F}=${s.tex}`],[decPart(`How many ${C.amt} ${C.ask} from ${at(C,0)} to ${at(C,T)}?`,v,C.amt,
   step('Set up the accumulation.',`${m(F)} gives ${C.amt} per ${C.one}. The integral of a rate over a time interval is the total amount accumulated during that interval.`,int(F,0,T))+CALC_STEP(F,0,T,v)+
   step('Interpret.',`About ${fx(v)} ${C.amt} ${C.ask} during the first ${T} ${C.unit}.`),[{value:s.f(T),note:'That is the rate at the final time. The total comes from integrating the rate.'},{value:s.f(T)*T,note:'The rate is not constant, so rate × time does not give the total. Integrate the rate.'}])],true);
 }
 if(tier==='intermediate'){
  if(U.rand()<0.5){ // a window that does not start at 0
   const a=Math.round(T*pick([0.2,0.25,0.4])),b=Math.round(T*pick([0.6,0.75,1]));if(b<=a)return null;const v=integrate(s.f,a,b);
   return build('one_rate',tier,`onew-${C.F}-${M}-${T}-${a}-${b}`,ctx,[`${F}=${s.tex}`],[decPart(`How many ${C.amt} ${C.ask} from ${at(C,a)} to ${at(C,b)}?`,v,C.amt,
    step('Translate the times.',`${C.clock!==undefined?`Because ${tUnits(C)}, the window is ${m(`${a}\\le t\\le ${b}`)}.`:`The window is ${m(`${a}\\le t\\le ${b}`)}.`} Only what happens during that window counts, so the limits are ${m(a)} and ${m(b)}, not 0.`,int(F,a,b))+CALC_STEP(F,a,b,v),
    [{value:integrate(s.f,0,b),note:`That counts from ${'t = 0'}. Start the integral at ${'t = '+a}.`}])],true);
  }
  const v=integrate(s.f,0,T),avg=v/T; // average rate
  return build('one_rate',tier,`onea-${C.F}-${M}-${T}`,ctx,[`${F}=${s.tex}`],[decPart(`What is the average rate, in ${C.amt} per ${C.one}, from ${m('t=0')} to ${m(`t=${T}`)}?`,avg,`${C.amt} per ${C.one}`,
   step('Use the average value of a function.','The average rate is the total accumulated divided by the length of the time interval.',`\\frac{1}{${T}-0}${int(F,0,T)}`)+CALC_STEP(F,0,T,v)+
   step('Divide by the length of the interval.','',`\\frac{${fx(v)}}{${T}}\\approx ${fx(avg)}`),[{value:v,note:'That is the total. The average rate divides the total by the length of the interval.'},{value:(s.f(0)+s.f(T))/2,note:'Averaging the two endpoint rates is not the average value of the rate. Integrate and divide by the interval length.'}])],true);
 }
 // challenging (v12.8.X): compare two windows, or a window given in clock times
 if(C.clock!==undefined&&C.unit==='hours'&&U.rand()<0.5){
  const a=pick([0.5,1,1.5,2].filter(x=>x<T-1)),b=pick([T-1.5,T-1,T-0.5,T].filter(x=>x>a+1));if(b===undefined)return null;const v=integrate(s.f,a,b);
  return build('one_rate',tier,`oneclk-${C.F}-${M}-${T}-${a}-${b}`,ctx,[`${F}=${s.tex}`],[decPart(`How many ${C.amt} ${C.ask} from ${clock(C,a)} to ${clock(C,b)}?`,v,C.amt,
   step('Convert the clock times to values of t.',`${m('t')} counts ${C.unit} after ${clock(C,0)}, so ${clock(C,a)} is ${m(`t=${nt(a)}`)} and ${clock(C,b)} is ${m(`t=${nt(b)}`)}.`,int(F,a,b))+CALC_STEP(F,a,b,v),
   [{value:integrate(s.f,0,b),note:`That starts at ${clock(C,0)}. The window starts at ${clock(C,a)}.`}])],true);
 }
 const w=Math.max(1,Math.round(T/4)),a1=0,b1=w,a2=Math.round(T/2),b2=a2+w;if(b2>T)return null;
 const v1=integrate(s.f,a1,b1),v2=integrate(s.f,a2,b2),d=v2-v1;if(Math.abs(d)<0.5)return null;
 const more=d>0,F1=int(F,a1,b1),F2=int(F,a2,b2);
 return build('one_rate',tier,`onecmp-${C.F}-${M}-${T}-${w}`,ctx,[`${F}=${s.tex}`],[decPart(`How many ${more?'more':'fewer'} ${C.amt} ${C.ask} from ${at(C,a2)} to ${at(C,b2)} than from ${at(C,a1)} to ${at(C,b1)}?`,Math.abs(d),C.amt,
  step('Accumulate over each window.','Each total is the integral of the rate over its own window; keep the unrounded values for the subtraction.',`${F2}\\approx ${fx(v2,4)}`,`${F1}\\approx ${fx(v1,4)}`)+
  step('Compare.',`${more?'Subtract the first total from the second.':'The second total is smaller; subtract it from the first.'}`,`${more?`${fx(v2,4)}-${fx(v1,4)}`:`${fx(v1,4)}-${fx(v2,4)}`}\\approx ${fx(Math.abs(d))}`),
  [{value:s.f(b2)-s.f(b1),note:'That compares the rates at two instants. Compare the totals: integrate over each window.'},{value:v2+v1,note:'That adds the two totals. The question asks for their difference.'}])],true);
}

// ======================================================================
// 2. initial amount plus or minus accumulated change
function famInitial(tier,calc){
 const C=pick(TANK),M=pick(C.M),A0=pick(C.A0);
 if(!wantsCalc(calc)){
  const R=exactFor(tier,M,pick(C.T));if(!R)return null;const {r,T}=R;
  const sign=tier==='foundational'?pick([1,-1]):pick([1,-1]);const F=sign>0?`${C.inF}(t)`:`${C.outF}(t)`;
  const rateText=sign>0?C.inText(m(F)):C.outText(m(F)).replace(/^./,c=>c.toUpperCase());
  if(tier==='challenging'){ // work back from a later amount
   const nodes=nodesOf(R).filter(t=>t>0&&t<T);if(!nodes.length)return null;const t1=pick(nodes);
   const Iall=r.I(0,T),AT=Math.round(A0+sign*xval(Iall));if(AT<=0)return null;const I=r.I(t1,T);const At1=xadd(X(Q(AT)),I,sign>0?-1:1);if(!(xval(At1)>0))return null;
   const ctx=`At ${at(C,T)}, ${C.what} contains ${comma(AT)} ${C.amt}. Since ${at(C,0)}, ${rateText.replace(/^./,c=>c.toLowerCase())}, where ${tUnits(C)}.`;
   return build('initial_change',tier,`back-ex-${C.outF}-${r.kind}-${AT}-${T}-${t1}`,ctx,[`${F}=${r.tex}`],[exactPart(`How many ${C.amt} were in ${C.ref} at ${at(C,t1)}? Give an exact answer.`,At1,C.amt,
    step('Relate the two times.',`From ${m(`t=${t1}`)} to ${m(`t=${T}`)} the amount ${sign>0?'increases':'decreases'} by ${m(int(F,t1,T))}, so ${m(`A(${T})=A(${t1})${sign>0?'+':'-'}${int(F,t1,T)}`)}.`)+exactStep(F,r,t1,T,I)+
    step(`Solve for ${m(`A(${t1})`)}.`,`${sign>0?'Subtract':'Add'} the change.`,`A(${t1})=${nt(AT)}${sign>0?'-':'+'}${px(I)}=${xtex(At1)}`),
    [{value:AT+sign*xval(I),note:'Going back in time reverses the change: undo it rather than repeating it.'}])],false);
  }
  const x=r.I(0,T),v=xadd(X(Q(A0)),x,sign);if(!(xval(v)>0))return null;
  const ctx=`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${rateText}, where ${tUnits(C)}.`;
  return build('initial_change',tier,`ini-ex-${sign>0?C.inF:C.outF}-${r.kind}-${A0}-${T}`,ctx,[`${F}=${r.tex}`],[exactPart(`How many ${C.amt} are in ${C.ref} at ${at(C,T)}? Give an exact answer.`,v,C.amt,
   step('Start with the initial amount and account for the change.',`The integral of the rate is the amount ${sign>0?'added':'removed'}, so ${sign>0?'add it to':'subtract it from'} the starting amount.`,`A(${T})=${nt(A0)}${sign>0?'+':'-'}${int(F,0,T)}`)+exactStep(F,r,0,T,x)+
   step('Combine.','',`A(${T})=${nt(A0)}${sign>0?'+':'-'}${px(x)}=${xtex(v)}`),
   [{value:xval(x),note:`That is only the amount ${sign>0?'added':'removed'}. Include the initial ${comma(A0)} ${C.amt}.`},{value:A0-sign*xval(x),note:`The ${C.amt} are being ${sign>0?'added':'removed'}, so the change should be ${sign>0?'added to':'subtracted from'} the starting amount.`}])],false);
 }
 const T=pick(C.T),s=positive(M,T);if(!s)return null;
 const sign=tier==='foundational'?1:pick([1,-1]);const F=sign>0?`${C.inF}(t)`:`${C.outF}(t)`;
 const rateText=sign>0?C.inText(m(F)):C.outText(m(F)).replace(/^./,c=>c.toUpperCase());
 if(tier==='challenging'&&U.rand()<0.5){ // work backward from a later amount
  const AT=Math.round(A0+sign*integrate(s.f,0,T)),t1=Math.round(T*pick([0.25,0.5])),At1=AT-sign*integrate(s.f,t1,T);if(AT<=0||At1<=0)return null;
  const ctx=`At ${at(C,T)}, ${C.what} contains ${comma(AT)} ${C.amt}. Since ${at(C,0)}, ${rateText.replace(/^./,c=>c.toLowerCase())}, where ${tUnits(C)}.`;
  return build('initial_change',tier,`back-${C.outF}-${AT}-${T}-${t1}`,ctx,[`${F}=${s.tex}`],[decPart(`How many ${C.amt} were in ${C.ref} at ${at(C,t1)}?`,At1,C.amt,
   step('Relate the two times.',`From ${m(`t=${t1}`)} to ${m(`t=${T}`)} the amount ${sign>0?'increases':'decreases'} by ${m(int(F,t1,T))}, so ${m(`A(${T})=A(${t1})${sign>0?'+':'-'}${int(F,t1,T)}`)}.`)+
   step(`Solve for ${m(`A(${t1})`)}.`,`${sign>0?'Subtract':'Add'} the change.`,`A(${t1})=${nt(AT)}${sign>0?'-':'+'}${int(F,t1,T)}\\approx ${nt(AT)}${sign>0?'-':'+'}${fx(integrate(s.f,t1,T))}\\approx ${fx(At1)}`),
   [{value:AT+sign*integrate(s.f,t1,T),note:'Going back in time reverses the change: undo it rather than repeating it.'}])],true);
 }
 const t2=tier==='foundational'?T:Math.round(T*pick([0.5,0.75,1]));const I=integrate(s.f,0,t2),v=A0+sign*I;if(v<=0)return null;
 const ctx=`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${rateText}, where ${tUnits(C)}.`;
 return build('initial_change',tier,`ini-${sign>0?C.inF:C.outF}-${A0}-${M}-${t2}`,ctx,[`${F}=${s.tex}`],[decPart(`How many ${C.amt} are in ${C.ref} at ${at(C,t2)}?`,v,C.amt,
  step('Start with the initial amount and account for the change.',`The integral of the rate is the amount ${sign>0?'added':'removed'}, so ${sign>0?'add it to':'subtract it from'} the starting amount.`,`A(${t2})=${nt(A0)}${sign>0?'+':'-'}${int(F,0,t2)}`)+CALC_STEP(F,0,t2,I)+
  step('Combine.','',`A(${t2})\\approx ${nt(A0)}${sign>0?'+':'-'}${fx(I)}=${fx(v)}`),[{value:I,note:`That is only the amount ${sign>0?'added':'removed'}. Include the initial ${comma(A0)} ${C.amt}.`},{value:A0-sign*I,note:`The ${C.amt} are being ${sign>0?'added':'removed'}, so the change should be ${sign>0?'added to':'subtracted from'} the starting amount.`}])],true);
}

// ======================================================================
// 3. inflow and outflow at the same time
function inOut(C,T,M,opts={}){
 for(let i=0;i<30;i++){
  const constIn=opts.constIn,inS=constIn?{tex:String(M),f:()=>M,kind:'const'}:positive(M,T),outS=positive(Math.round(M*pick([0.85,1,1.15])),T);if(!inS||!outS||inS.kind===outS.kind)continue;
  return{inS,outS};
 }
 return null;
}
// exact inflow and outflow: tier sets the kinds; on the foundational tier the inflow is a constant
function exactPair(tier,M){
 const T0=pick([4,6,8]);
 if(tier==='foundational'){const out=exactFor('foundational',Math.round(M*pick([0.6,0.8])),T0,['poly1','poly1d']);if(!out)return null;return{inR:{kind:'const',tex:String(M),f:()=>M,I:(a,b)=>X(Q(M*(b-a))),work:(a,b)=>`${M}(${b}-${a})=${M*(b-a)}`},outR:out.r,T:out.T,R:out};}
 const inK=tier==='intermediate'?['poly1','poly2']:['trig','ln'],outK=tier==='intermediate'?['poly1d','sqrt']:['poly1','poly1d'];
 const a=exactFor('x',M,T0,inK);if(!a)return null;
 const b=exactFor('x',Math.round(M*pick([0.7,0.9])),a.T,outK);if(!b||b.T!==a.T||b.r.kind==='sqrt'&&!Number.isInteger(Math.sqrt(a.T)))return null;
 return{inR:a.r,outR:b.r,T:a.T,R:a};
}
function famInOut(tier,calc){
 const C=pick(TANK),M=pick(C.M),A0=pick(C.A0),Fi=`${C.inF}(t)`,Fo=`${C.outF}(t)`;
 if(!wantsCalc(calc)){
  const P=exactPair(tier,M);if(!P)return null;const {inR,outR,T}=P;
  const constIn=inR.kind==='const';
  const ctx=`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${C.inText(constIn?`${M}`:m(Fi))}, and ${C.outText(m(Fo))}, where ${tUnits(C)}.`;
  const forms=constIn?[`${Fo}=${outR.tex}`]:[`${Fi}=${inR.tex}`,`${Fo}=${outR.tex}`];
  const xi=inR.I(0,T),xo=outR.I(0,T);
  if(tier==='intermediate'&&U.rand()<0.35){
   return build('in_out',tier,`outtotal-ex-${C.outF}-${outR.kind}-${T}`,ctx,forms,[exactPart(`How many ${C.amt} ${C.outQ} from ${at(C,0)} to ${at(C,T)}? Give an exact answer.`,xo,C.amt,
    step('Use only the outflow rate.',`The question asks for the ${C.outNoun}, not the amount present, so integrate only ${m(Fo)}; the inflow and the initial amount do not matter.`,int(Fo,0,T))+exactStep(Fo,outR,0,T,xo),
    [{value:A0+xval(xi)-xval(xo),note:'That is the amount present at the end. The question asks only for the total outflow.'},{value:xval(xi)-xval(xo),note:'That is the net change. The question asks only for the total outflow.'}])],false);
  }
  const v=xadd(xadd(X(Q(A0)),xi),xo,-1);if(!(xval(v)>0))return null;
  return build('in_out',tier,`io-ex-${C.inF}${C.outF}-${inR.kind}${outR.kind}-${A0}-${T}`,ctx,forms,[exactPart(`How many ${C.amt} are in ${C.ref} at ${at(C,T)}? Give an exact answer.`,v,C.amt,
   step('Set up the amount.',`The amount changes at the net rate ${m(`${constIn?M:Fi}-${Fo}`)}: inflow adds and outflow removes.`,`A(${T})=${nt(A0)}+${constIn?`${T}(${M})`:int(Fi,0,T)}-${int(Fo,0,T)}`)+
   (constIn?step('The inflow is constant.','A constant rate times the elapsed time is the amount added.',`${T}(${M})=${nt(M*T)}`):exactStep(Fi,inR,0,T,xi,'Integrate the inflow rate.'))+exactStep(Fo,outR,0,T,xo,'Integrate the outflow rate.')+
   step('Combine.','',`A(${T})=${nt(A0)}+${px(xi)}-${px(xo)}=${xtex(v)}`),
   [{value:A0+xval(xi)+xval(xo),note:'Outflow removes material: subtract its integral.'},{value:xval(xi)-xval(xo),note:`That is the net change. Add the initial ${comma(A0)} ${C.amt}.`},{value:A0-xval(xi)+xval(xo),note:'Inflow adds and outflow removes; check the signs.'}])],false);
 }
 const T=pick(C.T),io=inOut(C,T,M,{constIn:tier==='foundational'});if(!io)return null;
 const {inS,outS}=io;
 const ctx=`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${C.inText(inS.kind==='const'?`${M}`:m(Fi))}, and ${C.outText(m(Fo))}, where ${tUnits(C)}.`;
 const forms=inS.kind==='const'?[`${Fo}=${outS.tex}`]:[`${Fi}=${inS.tex}`,`${Fo}=${outS.tex}`];
 const Iin=integrate(inS.f,0,T),Iout=integrate(outS.f,0,T);
 const inTex=inS.kind==='const'?`${T}(${M})`:int(Fi,0,T);
 if(tier==='intermediate'&&U.rand()<0.4){ // total that left (not the amount present)
  return build('in_out',tier,`outtotal-${C.outF}-${M}-${T}`,ctx,forms,[decPart(`How many ${C.amt} ${C.outQ} from ${at(C,0)} to ${at(C,T)}?`,Iout,C.amt,
   step('Use only the outflow rate.',`The question asks for the ${C.outNoun}, not the amount present, so integrate only ${m(Fo)}; the inflow and the initial amount do not matter.`,int(Fo,0,T))+CALC_STEP(Fo,0,T,Iout),
   [{value:A0+Iin-Iout,note:'That is the amount present at the end. The question asks only for the total outflow.'},{value:Iin-Iout,note:'That is the net change. The question asks only for the total outflow.'}])],true);
 }
 const v=A0+Iin-Iout;
 return build('in_out',tier,`io-${C.inF}${C.outF}-${A0}-${M}-${T}`,ctx,forms,[decPart(`How many ${C.amt} are in ${C.ref} at ${at(C,T)}?`,v,C.amt,
  step('Set up the amount.',`The amount changes at the net rate ${m(`${inS.kind==='const'?M:Fi}-${Fo}`)}: inflow adds and outflow removes.`,`A(${T})=${nt(A0)}+${inTex}-${int(Fo,0,T)}`)+
  step('Evaluate each part.',inS.kind==='const'?'A constant rate times the elapsed time is the amount added; integrate the outflow with the calculator.':'Integrate each rate with the calculator.',
   ...(inS.kind==='const'?[`${T}(${M})=${nt(M*T)}`]:[`${int(Fi,0,T)}\\approx ${fx(Iin)}`]),`${int(Fo,0,T)}\\approx ${fx(Iout)}`)+
  step('Combine.','',`A(${T})\\approx ${nt(A0)}+${fx(Iin)}-${fx(Iout)}\\approx ${fx(v)}`),
  [{value:A0+Iin+Iout,note:'Outflow removes material: subtract its integral.'},{value:Iin-Iout,note:`That is the net change. Add the initial ${comma(A0)} ${C.amt}.`},{value:A0-Iin+Iout,note:'Inflow adds and outflow removes; check the signs.'}])],true);
}

// ======================================================================
// 4. delayed starts, early stops and piecewise rates
function famDelayed(tier,calc){
 const C=pick(TANK),M=pick(C.M),A0=pick(C.A0),Fi=`${C.inF}(t)`,Fo=`${C.outF}(t)`;
 if(!wantsCalc(calc)){
  if(tier==='intermediate'){ // a piecewise inflow: two linear formulas that meet at the switch time
   const T=pick([6,8,10]),b=T/2,c1=pick([2,4,6])*(M>=60?2:1),p1=polyRate([M,c1]),top=M+c1*b,c2=pick([2,4])*(M>=60?2:1),p2=polyRate([top+c2*b,-c2]);
   if(!positiveOn(p2.f,b,T))return null;
   const x1=p1.I(0,b),x2=p2.I(b,T),v=xadd(xadd(X(Q(A0)),x1),x2);
   return build('delayed_piecewise',tier,`pw-ex-${C.inF}-${M}-${T}-${c1}-${c2}`,`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${C.inText(m(Fi))}, where ${tUnits(C)} and the rate is given by a piecewise formula. Nothing is removed.`,
    [`${Fi}=\\begin{cases}${p1.tex}, & 0\\le t\\lt ${b}\\\\ ${p2.tex}, & ${b}\\le t\\le ${T}\\end{cases}`],[exactPart(`How many ${C.amt} are in ${C.ref} at ${at(C,T)}? Give an exact answer.`,v,C.amt,
    step('Split the integral where the formula changes.','Each formula applies only on its own time interval, so integrate each piece over that interval and add.',`A(${T})=${nt(A0)}+\\int_{0}^{${b}}\\left(${p1.tex}\\right)dt+\\int_{${b}}^{${T}}\\left(${p2.tex}\\right)dt`)+
    step('Integrate each piece.','',`\\int_{0}^{${b}}\\left(${p1.tex}\\right)dt=${p1.work(0,b)}`,`\\int_{${b}}^{${T}}\\left(${p2.tex}\\right)dt=${p2.work(b,T)}`)+
    step('Combine.','',`A(${T})=${nt(A0)}+${xtex(x1)}+${xtex(x2)}=${xtex(v)}`),
    [{value:A0+xval(p1.I(0,T)),note:`The first formula applies only until ${'t = '+b}; switch formulas there.`},{value:A0+xval(p2.I(0,T)),note:`The second formula applies only from ${'t = '+b} on.`}])],false);
  }
  // constant or exact inflow with an outflow that starts late (and, on the challenging tier, an inflow that stops early)
  const T=pick([6,8,10,12]),s=pick([2,3,4].filter(x=>x<T-1)),e=tier==='challenging'?pick([T-2,T-3].filter(x=>x>s)):T;if(e===undefined)return null;
  const inR=tier==='foundational'?{kind:'const',tex:String(M),f:()=>M,I:(a,b)=>X(Q(M*(b-a))),work:(a,b)=>`${M}(${b}-${a})=${M*(b-a)}`}:polyRate([M,pick([2,4,6])]);
  const outR=tier==='foundational'?polyRate([Math.round(M*0.8),pick([2,4,6])]):(()=>{const R=exactFor('x',Math.round(M*0.9),T,['poly1','poly1d']);return R&&R.T===T?R.r:null;})();if(!outR||!positiveOn(outR.f,s,T))return null;
  const xi=inR.I(0,e),xo=outR.I(s,T),v=xadd(xadd(X(Q(A0)),xi),xo,-1);if(!(xval(v)>0))return null;
  const inWhen=e<T?` from ${at(C,0)} until ${at(C,e)}`:` from ${at(C,0)} to ${at(C,T)}`;
  const ctx=`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${C.inText(inR.kind==='const'?`${M}`:m(Fi))}${inWhen}. Also, ${C.outText(m(Fo))} starting at ${at(C,s)} and continuing until ${at(C,T)}. Here ${tUnits(C)}.`;
  const forms=inR.kind==='const'?[`${Fo}=${outR.tex}`]:[`${Fi}=${inR.tex}`,`${Fo}=${outR.tex}`];
  return build('delayed_piecewise',tier,`del-ex-${C.inF}-${M}-${T}-${s}-${e}`,ctx,forms,[exactPart(`How many ${C.amt} are in ${C.ref} at ${at(C,T)}? Give an exact answer.`,v,C.amt,
   step('Integrate each rate only while it applies.',`Inflow runs for ${m(`0\\le t\\le ${e}`)} and outflow for ${m(`${s}\\le t\\le ${T}`)}, so those are the limits.`,`A(${T})=${nt(A0)}+${inR.kind==='const'?`${e}(${M})`:int(Fi,0,e)}-${int(Fo,s,T)}`)+
   (inR.kind==='const'?step('The inflow is constant.','',`${e}(${M})=${nt(M*e)}`):step('Integrate the inflow.','',`${int(Fi,0,e)}=${inR.work(0,e)}`))+step('Integrate the outflow over its own window.','',`${int(Fo,s,T)}=${outR.work(s,T)}`)+
   step('Combine.','',`A(${T})=${nt(A0)}+${xtex(xi)}-${xtex(xo)}=${xtex(v)}`),
   [{value:A0+xval(inR.I(0,T))-xval(outR.I(0,T)),note:'Each rate only applies during its own time window; adjust the limits of integration.'},{value:xval(xi)-xval(xo),note:`That is the net change. Add the initial ${comma(A0)} ${C.amt}.`}])],false);
 }
 const T=pick(C.T);
 if(tier==='intermediate'&&U.rand()<0.5||tier==='challenging'&&U.rand()<0.3){ // a piecewise rate
  const s1=positive(M,T),s2=positive(Math.round(M*pick([0.7,1.2])),T);if(!s1||!s2)return null;const b=Math.round(T*pick([0.4,0.5,0.6]));
  const F=`${C.inF}(t)`,I1=integrate(s1.f,0,b),I2=integrate(s2.f,b,T),v=A0+I1+I2;
  return build('delayed_piecewise',tier,`pw-${C.inF}-${M}-${T}-${b}`,`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${C.inText(m(F))}, where ${tUnits(C)} and the rate is given by a piecewise formula. Nothing is removed.`,
   [`${F}=\\begin{cases}${s1.tex}, & 0\\le t\\lt ${b}\\\\ ${s2.tex}, & ${b}\\le t\\le ${T}\\end{cases}`],[decPart(`How many ${C.amt} are in ${C.ref} at ${at(C,T)}?`,v,C.amt,
   step('Split the integral where the formula changes.',`Each formula applies only on its own time interval, so integrate each piece over that interval and add.`,`A(${T})=${nt(A0)}+\\int_{0}^{${b}}\\left(${s1.tex}\\right)dt+\\int_{${b}}^{${T}}\\left(${s2.tex}\\right)dt`)+
   step('Evaluate with the calculator.','',`\\int_{0}^{${b}}\\left(${s1.tex}\\right)dt\\approx ${fx(I1)}`,`\\int_{${b}}^{${T}}\\left(${s2.tex}\\right)dt\\approx ${fx(I2)}`)+
   step('Combine.','',`A(${T})\\approx ${nt(A0)}+${fx(I1)}+${fx(I2)}=${fx(v)}`),
   [{value:A0+integrate(s1.f,0,T),note:`The first formula applies only until ${'t = '+b}; switch formulas there.`},{value:A0+integrate(s2.f,0,T),note:`The second formula applies only from ${'t = '+b} on.`}])],true);
 }
 const io=inOut(C,T,M,{});if(!io)return null;const {inS,outS}=io;
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
  [{value:A0+integrate(inS.f,0,T)-integrate(outS.f,0,T),note:'Each rate only applies during its own time window; adjust the limits of integration.'},{value:Iin-Iout,note:`That is the net change. Add the initial ${comma(A0)} ${C.amt}.`}])],true);
}

// ======================================================================
// 5. connected multi-part problems: every part is an accumulation (v12.8.X: no net rate at an instant, no extremes)
function famMulti(tier,calc){
 const C=pick(TANK),M=pick(C.M),A0=pick(C.A0),Fi=`${C.inF}(t)`,Fo=`${C.outF}(t)`;
 const calcOn=wantsCalc(calc);
 let T,fIn,fOut,inTex,outTex,Iin,Iout,Iab,amtAt,forms,valOf,texOf,EX;
 if(calcOn){
  T=pick(C.T);const io=inOut(C,T,M,{});if(!io)return null;fIn=io.inS;fOut=io.outS;inTex=fIn.tex;outTex=fOut.tex;
  Iin=(a,b)=>integrate(fIn.f,a,b);Iout=(a,b)=>integrate(fOut.f,a,b);
 }else{
  const P=exactPair(tier==='foundational'?'intermediate':tier,M);if(!P||P.inR.kind==='const')return null;T=P.T;fIn=P.inR;fOut=P.outR;inTex=fIn.tex;outTex=fOut.tex;
  Iin=(a,b)=>fIn.I(a,b);Iout=(a,b)=>fOut.I(a,b);
 }
 forms=[`${Fi}=${inTex}`,`${Fo}=${outTex}`];
 const ctx=`At ${at(C,0)}, ${C.what} contains ${comma(A0)} ${C.amt}. ${C.inText(m(Fi))}, and ${C.outText(m(Fo))}, where ${tUnits(C)} and ${m(`0\\le t\\le ${T}`)}.`;
 const V=x=>calcOn?x:xval(x);
 const part=(prompt,x,expl,wrong)=>calcOn?decPart(prompt,x,C.amt,expl,wrong):exactPart(`${prompt} Give an exact answer.`,x,C.amt,expl,wrong);
 const evalStep=(F,R,a,b,x,what)=>calcOn?step(what||'Evaluate with the calculator.','',`${int(F,a,b)}\\approx ${fx(x)}`):exactStep(F,R,a,b,x,what);
 const plus=(a,b)=>calcOn?a+b:xadd(a,b),minus=(a,b)=>calcOn?a-b:xadd(a,b,-1),base=calcOn?A0:X(Q(A0)),show=x=>calcOn?fx(x):xtex(x);
 const t1=(()=>{if(calcOn)return Math.round(T*pick([0.4,0.5,0.6]))||1;const R={r:fIn,T,k:fIn.kind==='trig'?Number((fIn.tex.match(/\\frac\{\\pi t\}\{(\d+)\}/)||[])[1]||1):undefined};
  const ok=[];for(let t=1;t<T;t++){if(fIn.kind==='sqrt'||fOut.kind==='sqrt'){if(!Number.isInteger(Math.sqrt(t)))continue;}if(fIn.kind==='trig'&&(2*t)%R.k!==0)continue;ok.push(t);}return ok.length?pick(ok):null;})();
 const xin=Iin(0,T),xout=Iout(0,T),AT=minus(plus(base,xin),xout);if(!(V(AT)>0))return null;
 const pIn=part(`How many ${C.amt} enter ${C.ref} from ${m('t=0')} to ${m(`t=${T}`)}?`,xin,step('Integrate the inflow rate only.','The total that enters is the integral of the inflow rate; outflow does not affect it.')+evalStep(Fi,fIn,0,T,xin,calcOn?undefined:'Integrate the inflow rate.'),
  [{value:V(minus(xin,xout)),note:'That is the net change. The question asks only for what enters.'}]);
 const pOut=part(`How many ${C.amt} ${C.outQ} from ${m('t=0')} to ${m(`t=${T}`)}?`,xout,step('Integrate the outflow rate only.','The total that leaves is the integral of the outflow rate.')+evalStep(Fo,fOut,0,T,xout,calcOn?undefined:'Integrate the outflow rate.'),
  [{value:V(xin),note:'That is the inflow total. The question asks for the outflow.'}]);
 const pAmt=(full)=>part(`How many ${C.amt} are in ${C.ref} at ${m(`t=${T}`)}?`,AT,(full?'':evalStep(Fo,fOut,0,T,xout,calcOn?undefined:'Integrate the outflow rate.'))+step('Add the net change to the initial amount.','The net change is inflow minus outflow over the whole interval.',`A(${T})=${nt(A0)}+${int(Fi,0,T)}-${int(Fo,0,T)}`,`${calcOn?'\\approx':'='} ${nt(A0)}+${calcOn?fx(xin):px(xin)}-${calcOn?fx(xout):px(xout)}${calcOn?'\\approx':'='} ${show(AT)}`),
  [{value:V(minus(xin,xout)),note:`That is the net change. Add the initial ${comma(A0)} ${C.amt}.`},{value:V(plus(plus(base,xin),xout)),note:'Outflow removes material: subtract its integral.'}]);
 let parts;
 if(tier==='foundational')parts=[pIn,pAmt(false)];
 else if(tier==='intermediate')parts=[pIn,pOut,pAmt(true)];
 else{
  if(t1===null)return null;
  const ni=Iin(0,t1),no=Iout(0,t1),net=minus(ni,no),A1=plus(base,net);if(!(V(A1)>0))return null;
  const pNet=part(`By how much does the amount in ${C.ref} change from ${m('t=0')} to ${m(`t=${t1}`)}? (A decrease is negative.)`,net,
   step('The net change is the integral of inflow minus outflow.','',`\\int_{0}^{${t1}}\\left(${Fi}-${Fo}\\right)dt=${int(Fi,0,t1)}-${int(Fo,0,t1)}`)+evalStep(Fi,fIn,0,t1,ni,calcOn?undefined:'Integrate the inflow rate.')+evalStep(Fo,fOut,0,t1,no,calcOn?undefined:'Integrate the outflow rate.')+
   step('Subtract.','',`${show(ni)}-${calcOn?show(no):px(no)}${calcOn?'\\approx':'='} ${show(net)}`),[{value:V(A1),note:'That is the amount present. The question asks for the change.'}]);
  const pA1=part(`How many ${C.amt} are in ${C.ref} at ${m(`t=${t1}`)}?`,A1,step('Add the net change to the initial amount.','',`A(${t1})=${nt(A0)}+${calcOn?show(net):px(net)}${calcOn?'\\approx':'='} ${show(A1)}`),[{value:V(net),note:`That is only the change. Add the initial ${comma(A0)} ${C.amt}.`}]);
  const ri2=Iin(t1,T),ro2=Iout(t1,T);
  const pAT=part(`How many ${C.amt} are in ${C.ref} at ${m(`t=${T}`)}?`,AT,step(`Continue from ${m(`t=${t1}`)}.`,`Start from the amount at ${m(`t=${t1}`)} and add the net change over the rest of the interval (or start again from ${m('t=0')}; the result is the same).${!calcOn&&!qzero(A1.l)&&!qzero(ri2.l||Q(0))?` The logarithms combine by ${m('\\ln a+\\ln b=\\ln(ab)')}.`:''}`,`A(${T})=A(${t1})+${int(Fi,t1,T)}-${int(Fo,t1,T)}`,`${calcOn?'\\approx':'='} ${show(A1)}+${calcOn?show(ri2):px(ri2)}-${calcOn?show(ro2):px(ro2)}${calcOn?'\\approx':'='} ${show(AT)}`),
   [{value:V(minus(xin,xout)),note:`That is the net change from ${'t = 0'}. Add the initial ${comma(A0)} ${C.amt}.`}]);
  parts=[pNet,pA1,pAT];
 }
 return build('multipart',tier,`multi-${calcOn?'c':'ex'}-${C.inF}${C.outF}-${A0}-${M}-${T}-${t1}`,ctx,forms,parts,calcOn);
}

const BOTH={calc:{calculator:['foundational','intermediate','challenging'],noncalculator:['foundational','intermediate','challenging']}};
const FAMILIES={
 one_rate:{weight:25,tiers:['foundational','intermediate','challenging'],make:famOne,...BOTH},
 initial_change:{weight:25,tiers:['foundational','intermediate','challenging'],make:famInitial,...BOTH},
 in_out:{weight:25,tiers:['foundational','intermediate','challenging'],make:famInOut,...BOTH},
 delayed_piecewise:{weight:15,tiers:['foundational','intermediate','challenging'],make:famDelayed,...BOTH},
 multipart:{weight:10,tiers:['foundational','intermediate','challenging'],make:famMulti,...BOTH},
};
const engine=U.makeEngine('rate',FAMILIES);
U.profile('unit5-rate-exact',{parentheses:true}); // these exact answers are whole numbers (even coefficients, multiples of 3 under a root)
U.profile('unit5-rate-exact-pi',{fraction:true,arithmetic:true,parentheses:true,constants:['pi']});
U.profile('unit5-rate-exact-ln',{fraction:true,arithmetic:true,parentheses:true,logarithm:true});
window.BatchMathUnit5Rate=Object.freeze({make:engine.make,FAMILIES,weights:engine.weights,shape,SHAPES});
U.register('rate-problems',o=>engine.make(o||{}));
})();
