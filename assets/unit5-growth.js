/* BatchMath v12.8.X — Unit 5 engine 5: Exponential Growth and Decay, Interest, Newton's Law of Cooling.
   Calculator-active applications of dy/dt = ky. Families (mixed mode): growth 20%, decay 25%, cooling 20%,
   heating 10%, interest 15%, reverse / unknown quantity 10%; about 30% are connected multi-part problems.
   Conventions (Differential Equation Reminders): growth y = y0 e^{kt}, decay y = y0 e^{-kt} with k > 0, and
   Newton's Law T - Ts = (T0 - Ts) e^{-kt} with k > 0 for both cooling and heating (for heating T0 - Ts < 0 and
   the gap still shrinks). Data are chosen so k has an exact form; answers are graded to three decimal places,
   whole numbers for counts, and money to the cent. */
(function(){
'use strict';
const U=window.BatchMathUnit5Core;
if(!U)return;
const {Q,qv,qtex,pick,ri,step,m,question,problem,fix,money}=U;

// ---------- formatting ----------
const comma=n=>{const [a,b]=String(n).split('.');return a.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(b!==undefined?'.'+b:'');};
const nt=n=>comma(n).replace(/,/g,'{,}');                                   // a number inside TeX
const fx=(v,p=3)=>nt(fix(v,p));                                            // a rounded value inside TeX
const kd=v=>String(Number(v.toPrecision(6)));                                // k shown to six significant digits
const lnQ=q=>q.d===1?`\\ln ${q.n}`:`\\ln\\left(\\frac{${q.n}}{${q.d}}\\right)`;
const over=(num,T)=>String(T)==='1'?num:`\\frac{${num}}{${nt(T)}}`;
const times=(T,unit,one)=>T===1?`1 ${one}`:`${comma(T)} ${unit}`;
const kp=tex=>tex.startsWith('\\frac')?tex:`\\left(${tex}\\right)`;   // k inside a product, with parentheses when it is a bare logarithm
const kT=T=>String(T)==='1'?'k':`${nt(T)}k`;
const pct=p=>String(Number((p*100).toFixed(4)));
const DEC='Give your answer correct to three decimal places.';
const KEEP=`Keep the exact value of ${m('k')} (or store it in the calculator) and round only the final answer.`;

// ---------- answer parts ----------
function decPart(prompt,value,unit,explanation,o={}){
 const whole=!!o.whole;
 return{prompt:`${prompt} ${whole?'Round to the nearest whole number.':DEC}`,
  answer:{kind:'numeric',value,places:whole?0:3,...(o.wrong?{wrongValues:o.wrong.filter(w=>Number.isFinite(w.value)&&U.roundScaled(w.value,whole?0:3)!==U.roundScaled(value,whole?0:3))}:{})},
  answerTex:`${nt(fix(value,whole?0:3))}${unit==='%'?'\\%':unit?`\\text{ ${unit}}`:''}`,explanation,keypadMode:'unit5-number',placeholder:whole?'Whole number':'Decimal answer'};
}
function moneyPart(prompt,value,explanation,wrong=[]){
 return{prompt:`${prompt} Round to the nearest cent.`,answer:{kind:'numeric',value,places:2,money:true,wrongValues:wrong.filter(w=>Number.isFinite(w.value)&&U.roundScaled(w.value,2)!==U.roundScaled(value,2))},
  answerTex:`\\$${nt(money(value))}`,explanation,keypadMode:'unit5-money',placeholder:'Dollars and cents'};
}
function exactPart(prompt,value,tex,explanation,name='k'){
 return{prompt,answer:{kind:'exact',value},answerTex:`${name}=${tex}`,explanation,keypadMode:'unit5-growth-exact',placeholder:'Exact value'};
}
function formulaPart(prompt,expr,tex,hi,explanation,name){
 return{prompt,control:'input',prefix:`${name}=`,answer:{kind:'function',variable:'t',expression:expr,interval:[0,hi],x0:0},answerTex:`${name}=${tex}`,
  explanation,keypadMode:'unit5-growth-formula',placeholder:`Enter ${name} in terms of t`};
}
function build(family,tier,id,intro,parts,data={}){
 const prompt=parts.length>1?'Answer each part.':'';
 return problem({engine:'growth',family,tier,id:String(id).replace(/[^A-Za-z0-9_.-]+/g,''),calculator:true,
  questionHtml:question({context:intro,prompt,calculator:true}),parts,data});
}
// how often a family asks a connected multi-part question, by tier (about 30% overall)
const MULTI={foundational:0.15,intermediate:0.3,challenging:0.45};
const multi=tier=>U.rand()<MULTI[tier];

// ---------- shared explanation steps ----------
const growthModel=(y0,unit,name='y')=>step('Write the model.',`The rate of change is proportional to the amount, ${m(`\\frac{d${name}}{dt}=k${name}`)}, and the solution of this separable equation is ${m(`${name}=${name}_0e^{kt}`)}, where ${m('t')} is measured in ${unit} and ${m(`${name}_0=${nt(y0)}`)} is the amount at ${m('t=0')}.`,`${name}=${nt(y0)}e^{kt}`);
const decayModel=(y0,unit)=>step('Write the model.',`The amount decreases at a rate proportional to the amount present, ${m('\\frac{dy}{dt}=-ky')} with ${m('k>0')}, so ${m('y=y_0e^{-kt}')}, where ${m('t')} is measured in ${unit}${y0===null?'':` and ${m(`y_0=${nt(y0)}`)}`}.`,y0===null?'y=y_0e^{-kt}':`y=${nt(y0)}e^{-kt}`);
const halfLifeK=(h,unit)=>step(`Find ${m('k')} from the half-life.`,`After one half-life (${comma(h)} ${unit}) half of any amount remains, so ${m(`\\frac{1}{2}y_0=y_0e^{-${nt(h)}k}`)}. Divide by ${m('y_0')} and take the natural log.`,`\\ln\\frac{1}{2}=-${nt(h)}k`,`k=\\frac{\\ln 2}{${nt(h)}}\\approx ${kd(Math.LN2/h)}`);

// ======================================================================
// growth
const GROW=[
 {who:'The number of bacteria in a culture',qty:'number of bacteria',noun:'bacteria',unit:'hours',one:'hour',whole:true,y0:[200,300,400,500,600,800,1000,1200],T:[1,2,3,4],r:[Q(2),Q(3),Q(3,2),Q(5,2),Q(4)]},
 {who:'The number of fruit flies in a lab colony',qty:'number of fruit flies',noun:'fruit flies',unit:'days',one:'day',whole:true,y0:[40,50,60,80,100,120],T:[2,3,4,5,6],r:[Q(2),Q(3),Q(3,2),Q(5,2)]},
 {who:'The population of a town',qty:'population',noun:'people',unit:'years',one:'year',whole:true,y0:[12000,15000,18000,24000,30000,45000],T:[4,5,8,10],r:[Q(6,5),Q(5,4),Q(4,3),Q(3,2),Q(9,8)]},
 {who:'The area of a pond covered by algae',qty:'area covered by algae',noun:'square meters',unit:'days',one:'day',whole:false,y0:[2,3,4,5,6,8],T:[2,3,4,5],r:[Q(2),Q(3),Q(3,2),Q(5,2)]},
 {who:'The number of subscribers to an online newsletter',qty:'number of subscribers',noun:'subscribers',unit:'weeks',one:'week',whole:true,y0:[160,240,400,600,900],T:[2,3,4,5],r:[Q(2),Q(3,2),Q(5,4),Q(4,3)]},
];
function famGrowth(tier){
 const C=pick(GROW),T=pick(C.T),r=pick(C.r),y0=pick(C.y0.filter(v=>v%r.d===0)),y1=y0*r.n/r.d;
 const k=Math.log(qv(r))/T,kTex=over(lnQ(r),T),Y=t=>y0*Math.exp(k*t);
 const intro=`${C.who} grows at a rate proportional to its size. At time ${m('t=0')} it is ${comma(y0)} ${C.noun}, and ${times(T,C.unit,C.one)} later it is ${comma(y1)} ${C.noun}.`;
 const model=growthModel(y0,C.unit),findK=step(`Use the second measurement to find ${m('k')}.`,`Substitute ${m(`t=${T}`)} and ${m(`y=${nt(y1)}`)}, divide by ${m(nt(y0))} and take the natural log.`,
  `${nt(y1)}=${nt(y0)}e^{${kT(T)}}`,`e^{${kT(T)}}=${qtex(r)}`,`${kT(T)}=${lnQ(r)}`,`k=${kTex}\\approx ${kd(k)}`);
 const t2=pick([2*T,3*T,T+1,2*T+1].filter(v=>v!==T)),v2=Y(t2);
 const valuePart=(first)=>decPart(`Find the ${C.qty} after ${times(t2,C.unit,C.one)}.`,v2,C.noun,(first?model+findK:'')+step('Evaluate the model.',KEEP+(C.whole?` Rounded to the nearest whole number, that is ${m(nt(Math.round(v2)))}.`:''),`y(${t2})=${nt(y0)}e^{${kp(kTex)}\\cdot ${t2}}\\approx ${nt(fix(v2))}`),{whole:C.whole});
 const M=y0*pick([5,6,8,10,12].filter(f=>Math.abs(f-qv(r))>1e-9&&Math.abs(Math.log(f)/Math.log(qv(r))-Math.round(Math.log(f)/Math.log(qv(r))))>1e-9)),Mq=Q(M,y0),tM=Math.log(qv(Mq))/k;
 const timePart=(first)=>decPart(`When will the ${C.qty} reach ${comma(M)}${C.whole?'':' '+C.noun}?`,tM,C.unit,(first?model+findK:'')+step(`Solve for ${m('t')}.`,'Set the model equal to the target, divide, and take the natural log of both sides.',
  `${nt(M)}=${nt(y0)}e^{kt}`,`e^{kt}=${qtex(Mq)}`,`t=\\frac{${lnQ(Mq)}}{k}=\\frac{${String(T)==='1'?'':nt(T)}${lnQ(Mq)}}{${lnQ(r)}}\\approx ${fx(tM)}`));
 const dbl=T*Math.LN2/Math.log(qv(r));
 const doublePart=(first)=>decPart(`How long does it take the ${C.qty} to double?`,dbl,C.unit,(first?model+findK:'')+step('Use the doubling condition.',`Doubling means ${m('y=2y_0')}, so ${m('e^{kt}=2')} no matter what the starting amount is.`,`t=\\frac{\\ln 2}{k}=\\frac{${String(T)==='1'?'':nt(T)}\\ln 2}{${lnQ(r)}}\\approx ${fx(dbl)}`));
 const kPart=()=>exactPart(`Find the exact value of the growth constant ${m('k')} in ${m('y=y_0e^{kt}')}.`,k,kTex,model+findK);
 const formula=()=>formulaPart(`Write the ${C.qty} ${m('y')} as a function of ${m('t')}. Use exact values.`,`${y0}*e^(ln(${r.n}/${r.d})/${T}*x)`,`${nt(y0)}e^{${String(T)==='1'?`t${kTex}`:`${kTex}t`}}`,3*T,model+findK+step('Write the function.','Substitute the exact value of k into the model.',`y=${nt(y0)}e^{${String(T)==='1'?`t${kTex}`:`${kTex}t`}}`),'y');
 const t3=pick([T+1,2*T,3*T].filter(v=>v!==t2)),rate=k*Y(t3);
 const ratePart=(first)=>decPart(`At what rate is the ${C.qty} increasing at ${m(`t=${t3}`)}?`,rate,`${C.noun} per ${C.one}`,(first?model+findK:'')+step('Use the differential equation.',`The rate is ${m('\\frac{dy}{dt}=ky')}, so find ${m(`y(${t3})`)} and multiply by ${m('k')}.`,`\\frac{dy}{dt}\\Big|_{t=${t3}}=k\\,y(${t3})=${kp(kTex)}\\cdot ${nt(y0)}e^{${kp(kTex)}\\cdot ${t3}}\\approx ${fx(rate)}`));
 let parts;
 if(tier==='foundational')parts=multi(tier)?[formula(),valuePart(false)]:[pick([valuePart,kPart,formula])(true)];
 else if(tier==='intermediate')parts=multi(tier)?[kPart(),pick([timePart,valuePart])(false)]:[pick([timePart,doublePart,valuePart])(true)];
 else parts=multi(tier)?[valuePart(true),pick([timePart,ratePart])(false)]:[pick([ratePart,timePart,doublePart])(true)];
 if(qv(r)===2&&parts.some(p=>/double\?/.test(p.prompt)))return null;
 return build('growth',tier,`grow-${C.noun}-${y0}-${r.n}_${r.d}-${T}`,intro,parts);
}

// ======================================================================
// decay
const ISO=[{name:'cobalt-60',h:5.27,unit:'years',one:'year'},{name:'cesium-137',h:30.17,unit:'years',one:'year'},{name:'carbon-14',h:5730,unit:'years',one:'year'},
 {name:'phosphorus-32',h:14.3,unit:'days',one:'day'},{name:'technetium-99m',h:6.01,unit:'hours',one:'hour'},{name:'sodium-24',h:14.96,unit:'hours',one:'hour'},
 {name:'radium-226',h:1600,unit:'years',one:'year'},{name:'gold-198',h:2.7,unit:'days',one:'day'},{name:'iron-59',h:44.5,unit:'days',one:'day'},{name:'polonium-210',h:138.4,unit:'days',one:'day'}];
const DRUG=[{name:'caffeine',h:5,unit:'hours',one:'hour',where:"a person's bloodstream"},{name:'an antibiotic',h:2,unit:'hours',one:'hour',where:"a patient's bloodstream"},
 {name:'a pain reliever',h:3,unit:'hours',one:'hour',where:"a patient's bloodstream"},{name:'an allergy medicine',h:8,unit:'hours',one:'hour',where:"a patient's bloodstream"}];
// a time near f half-lives, rounded to a sensible number for the unit
const niceTime=(h,f)=>{const t=h*f;return t>=1000?Math.round(t/100)*100:t>=100?Math.round(t/10)*10:t>=10?Math.round(t):Math.round(t*2)/2;};
function famDecay(tier){
 const iso=U.rand()<0.7,S=iso?pick(ISO):pick(DRUG),h=S.h,k=Math.LN2/h,m0=pick([20,40,50,80,100,120,200,250,500]);
 const Y=t=>m0*Math.exp(-k*t);
 const intro0=iso?`The radioactive isotope ${S.name} has a half-life of ${comma(h)} ${S.unit}. A sample contains ${comma(m0)} milligrams.`
  :`The amount of ${S.name} in ${S.where} decreases at a rate proportional to the amount present, with a half-life of ${comma(h)} ${S.unit}. A dose of ${comma(m0)} milligrams is taken at ${m('t=0')}.`;
 const t1=niceTime(h,pick([0.4,1.5,2.3,3.2,0.8,2.6])),a1=Y(t1);
 const amount=(first)=>decPart(`How many milligrams remain after ${times(t1,S.unit,S.one)}?`,a1,'mg',(first?decayModel(m0,S.unit)+halfLifeK(h,S.unit):'')+step('Evaluate the model.',KEEP,`y(${nt(t1)})=${nt(m0)}e^{-\\frac{\\ln 2}{${nt(h)}}\\cdot ${nt(t1)}}\\approx ${fx(a1)}`),
  {wrong:[{value:m0*(1-k*t1),note:'The amount does not decrease by the same number of milligrams each unit of time; use the exponential model.'}]});
 const p=pick([0.3,0.2,0.15,0.1,0.05,0.25]),m1=+(m0*p).toFixed(6),tP=Math.log(1/p)/k;
 const timeTo=(first)=>decPart(`After how many ${S.unit} will ${comma(m1)} milligrams remain?`,tP,S.unit,(first?decayModel(m0,S.unit)+halfLifeK(h,S.unit):'')+step(`Solve for ${m('t')}.`,'Set the model equal to the target amount, divide, and take the natural log.',
  `${nt(m1)}=${nt(m0)}e^{-kt}`,`e^{-kt}=${p}`,`t=\\frac{\\ln ${p}}{-k}=\\frac{${nt(h)}\\ln ${p}}{-\\ln 2}\\approx ${fx(tP)}`));
 const rateAt=(first)=>{const t3=niceTime(h,pick([0.5,1,2]));const r=-k*Y(t3);
  return decPart(`At what rate is the amount changing at ${m(`t=${nt(t3)}`)}? Include the sign.`,r,`mg per ${S.one}`,(first?decayModel(m0,S.unit)+halfLifeK(h,S.unit):'')+step('Use the differential equation.',`The rate of change is ${m('\\frac{dy}{dt}=-ky')}, which is negative because the amount is decreasing.`,`\\frac{dy}{dt}\\Big|_{t=${nt(t3)}}=-k\\,y(${nt(t3)})=-\\frac{\\ln 2}{${nt(h)}}\\cdot ${nt(m0)}e^{-\\frac{\\ln 2}{${nt(h)}}\\cdot ${nt(t3)}}\\approx ${fx(r)}`));};
 // percent remaining after a time: half-life and time to a smaller percent (homework 8)
 if(tier!=='foundational'&&U.rand()<0.4){
  const P=pick([Q(3,4),Q(4,5),Q(7,10),Q(9,10),Q(3,5),Q(17,20)]),T=pick(iso?[2,3,4,5,6,10]:[1,2,3]),unit=iso?pick(['days','years','hours']):'hours',one=unit.slice(0,-1);
  const kk=Math.log(1/qv(P))/T,kTex=over(lnQ(Q(P.d,P.n)),T),hl=Math.LN2/kk,q=pick([0.1,0.05,0.2,0.25].filter(v=>v<qv(P))),tq=Math.log(1/q)/kk;
  const what=iso?'a radioactive sample':`the amount of ${pick(DRUG).name} in a patient's bloodstream`;
  const intro=`After ${times(T,unit,one)}, ${what} has decayed to ${pct(qv(P))}% of its original amount. Assume the amount decays at a rate proportional to the amount present.`;
  const findK=step(`Find ${m('k')} from the percent remaining.`,`${pct(qv(P))}% remaining means ${m(`y=${qtex(P)}y_0`)} at ${m(`t=${T}`)}. Divide by ${m('y_0')} and take the natural log.`,`${qtex(P)}=e^{-${kT(T)}}`,`k=${kTex}\\approx ${kd(kk)}`);
  const hlPart=decPart(`Find the half-life.`,hl,unit,decayModel(null,unit)+findK+step('Use the half-life condition.',`Half remains when ${m('e^{-kt}=\\frac{1}{2}')}.`,`t_{1/2}=\\frac{\\ln 2}{k}=\\frac{${String(T)==='1'?'':nt(T)}\\ln 2}{${lnQ(Q(P.d,P.n))}}\\approx ${fx(hl)}`));
  const qPart=decPart(`How long will it take to decay to ${pct(q)}% of its original amount?`,tq,unit,(tier==='challenging'?'':decayModel(null,unit)+findK)+step(`Solve for ${m('t')}.`,`${pct(q)}% remaining means ${m(`e^{-kt}=${q}`)}; the original amount cancels.`,`t=\\frac{\\ln ${q}}{-k}\\approx ${fx(tq)}`));
  const parts=tier==='challenging'||multi(tier)?[hlPart,qPart]:[pick([hlPart,qPart])];
  if(parts.length===2)parts[1].explanation=step(`Solve for ${m('t')}.`,`Use ${m(`k=${kTex}`)} from Part A. ${pct(q)}% remaining means ${m(`e^{-kt}=${q}`)}; the original amount cancels.`,`t=\\frac{\\ln ${q}}{-k}\\approx ${fx(tq)}`);
  return build('decay',tier,`pct-${P.n}_${P.d}-${T}-${q}`,intro,parts);
 }
 // a decay equation with a decimal constant (test review 11-12 style): half-life and time
 if(tier!=='foundational'&&U.rand()<0.35&&iso){
  const kk=Number((Math.LN2/h).toPrecision(5)),hl=Math.LN2/kk,tq=Math.log(m0/m1)/kk;
  const intro=`A radioactive isotope decays according to ${m(`\\frac{dy}{dt}=-${kk}y`)}, where ${m('t')} is measured in ${S.unit}. A sample contains ${comma(m0)} milligrams at ${m('t=0')}.`;
  const model=step('Write the model.',`The solution of ${m('\\frac{dy}{dt}=-ky')} is ${m('y=y_0e^{-kt}')}; here ${m(`k=${kk}`)}.`,`y=${nt(m0)}e^{-${kk}t}`);
  const hlPart=decPart('Find the half-life of the isotope.',hl,S.unit,model+step('Use the half-life condition.',`Half remains when ${m(`e^{-${kk}t}=\\frac{1}{2}`)}.`,`t_{1/2}=\\frac{\\ln 2}{${kk}}\\approx ${fx(hl)}`));
  const both=multi(tier);
  const tPart=decPart(`After how many ${S.unit} will ${comma(m1)} milligrams remain?`,tq,S.unit,(both?'':model)+step(`Solve for ${m('t')}.`,'Set the model equal to the target amount and take the natural log.',`${nt(m1)}=${nt(m0)}e^{-${kk}t}`,`t=\\frac{\\ln ${p}}{-${kk}}\\approx ${fx(tq)}`));
  const parts=both?[hlPart,tPart]:[pick([hlPart,tPart])];
  return build('decay',tier,`dk-${S.name}-${m0}-${p}`,intro,parts);
 }
 let parts;
 if(tier==='foundational')parts=multi(tier)?[amount(true),timeTo(false)]:[pick([amount,amount,timeTo])(true)];
 else if(tier==='intermediate')parts=multi(tier)?[amount(true),timeTo(false)]:[pick([timeTo,amount])(true)];
 else parts=multi(tier)?[timeTo(true),rateAt(false)]:[pick([rateAt,timeTo])(true)];
 return build('decay',tier,`dec-${S.name}-${m0}-${t1}-${p}`,intro0,parts);
}

// ======================================================================
// Newton's Law of Cooling (cooling and heating)
const HOT=[
 {what:'A cup of coffee',place:'a room kept at',T0:[180,185,190,195,200],Ts:[68,70,72],t:[3,4,5,6,8],deg:'°F'},
 {what:'A bowl of soup',place:'a kitchen kept at',T0:[85,88,90,92,95],Ts:[20,21,22,24],t:[4,5,6,8,10],deg:'°C'},
 {what:'A metal casting',place:'a workshop kept at',T0:[400,450,500,600],Ts:[70,72,75,80],t:[10,15,20,30],deg:'°F'},
 {what:'A loaf of bread taken out of the oven',place:'a kitchen kept at',T0:[200,205,210],Ts:[68,70,72,75],t:[5,10,15],deg:'°F'},
 {what:'A pot of boiling water taken off the stove',place:'a room kept at',T0:[100],Ts:[20,22,25],t:[5,10,15],deg:'°C'},
];
const COLD=[
 {what:'A can of soda taken from a refrigerator',place:'a room kept at',T0:[36,38,40],Ts:[72,74,75,76,78],t:[10,15,20],deg:'°F'},
 {what:'A glass of iced tea set out on a porch',place:'outdoor air at',T0:[38,40,42],Ts:[85,88,90],t:[5,10,15],deg:'°F'},
 {what:'A bottle of milk from the refrigerator',place:'a warm water bath kept at',T0:[4,5,6],Ts:[38,40,42],t:[2,3,4,5],deg:'°C'},
 {what:'A roast from the refrigerator',place:'an oven set to',T0:[40,42,45],Ts:[325,350],t:[30,45,60],deg:'°F'},
];
const RATIOS=[Q(3,4),Q(2,3),Q(4,5),Q(1,2),Q(3,5),Q(5,6),Q(7,8)];
function newton(family,tier){
 const heat=family==='heating',C=pick(heat?COLD:HOT),T0=pick(C.T0),Ts=pick(C.Ts),t1=pick(C.t),q=pick(RATIOS),D0=T0-Ts;
 if(D0%q.d)return null;
 const D1=D0*q.n/q.d,T1=Ts+D1,k=Math.log(q.d/q.n)/t1,kTex=over(lnQ(Q(q.d,q.n)),t1),Tf=t=>Ts+D0*Math.exp(-k*t),deg=C.deg;
 const intro=`${C.what} is at ${T0}${deg} when it is placed in ${C.place} ${Ts}${deg}. After ${t1} minutes its temperature is ${T1}${deg}. Assume Newton's Law of ${heat?'Cooling (which also describes warming)':'Cooling'}.`;
 const model=step("Write Newton's Law of Cooling.",`The difference between the object's temperature and the surroundings changes exponentially: ${m('T-T_s=(T_0-T_s)e^{-kt}')} with ${m('k>0')}.${heat?` The object is warming, so ${m('T_0-T_s')} is negative; the gap still shrinks toward 0, so the same formula with ${m('k>0')} applies.`:''}`,
  `T-${Ts}=(${T0}-${Ts})e^{-kt}=${D0}e^{-kt}`);
 const findK=step(`Use the reading at ${m(`t=${t1}`)} to find ${m('k')}.`,`Substitute ${m(`T=${T1}`)}, divide by ${m(D0)} and take the natural log.`,`${T1}-${Ts}=${D0}e^{-${t1}k}`,`e^{-${t1}k}=\\frac{${D1}}{${D0}}=${qtex(q)}`,`k=${kTex}\\approx ${kd(k)}`);
 // the same steps without Ts, for the "forgot the surroundings" wrong answer
 const k0=Math.log(T0/T1)/t1,naive=t=>T0*Math.exp(-k0*t);
 const NAIVE="Newton's law applies to the difference between the object's temperature and the surroundings, T − Tₛ, not to the temperature itself.";
 const t2=pick([2*t1,3*t1,t1+pick([5,10]),Math.round(t1*1.5)].filter(v=>v!==t1)),T2=Tf(t2);
 const tempAt=(first)=>decPart(`Find the temperature after ${t2} minutes.`,T2,deg,(first?model+findK:'')+step('Evaluate the model.',`${KEEP} Then add ${m(Ts)} back.`,`T(${t2})=${Ts}${D0<0?'-':'+'}${Math.abs(D0)}e^{-${kTex}\\cdot ${t2}}\\approx ${fx(T2)}`),{wrong:[{value:naive(t2),note:NAIVE}]});
 const f=pick([0.25,0.2,0.1,0.3,0.15].filter(v=>v<qv(q)-0.05)),Tstar=Math.round(Ts+D0*f);if(Tstar===T1||Math.abs(Tstar-Ts)<1)return null;
 const ts=Math.log(D0/(Tstar-Ts))/k,lnArg=Q(D0,Tstar-Ts);
 const solveT=step(`Solve for ${m('t')}.`,`Set ${m(`T=${Tstar}`)}, subtract ${m(Ts)}, divide by ${m(D0)} and take the natural log.`,`${Tstar}-${Ts}=${D0}e^{-kt}`,`e^{-kt}=${qtex(Q(Tstar-Ts,D0))}`,`t=\\frac{${lnQ(lnArg)}}{k}\\approx ${fx(ts)}`);
 const timeTo=(first)=>decPart(`When will the temperature be ${Tstar}${deg}?`,ts,'minutes',(first?model+findK:'')+solveT,{wrong:[{value:Math.log(T0/Tstar)/k0,note:NAIVE}]});
 const longer=(first)=>decPart(`How much longer after the ${t1}-minute reading will it take the temperature to reach ${Tstar}${deg}?`,ts-t1,'minutes',(first?model+findK:'')+solveT+step('Subtract the time already passed.',`The reading was at ${m(`t=${t1}`)}, so the additional time is the difference.`,`${fx(ts)}-${t1}\\approx ${fx(ts-t1)}`),
  {wrong:[{value:ts,note:`That is the time from the start. The question asks how much longer after ${t1} minutes.`},{value:Math.log(T0/Tstar)/k0-t1,note:NAIVE}]});
 const t3=pick([t1,2*t1,Math.round(t1/2)].filter(v=>v>0)),rate=-k*(Tf(t3)-Ts);
 const rateAt=(first)=>decPart(`At what rate is the temperature changing at ${m(`t=${t3}`)} minutes? Include the sign.`,rate,`${deg} per minute`,(first?model+findK:'')+step('Use the differential equation.',`Newton's law says ${m('\\frac{dT}{dt}=-k(T-T_s)')}; ${heat?'the temperature is rising, so the rate is positive':'the temperature is falling, so the rate is negative'}.`,`\\frac{dT}{dt}\\Big|_{t=${t3}}=-k\\left(T(${t3})-${Ts}\\right)=-${kTex}\\cdot ${D0<0?`\\left(${D0}e^{-${kTex}\\cdot ${t3}}\\right)`:`${D0}e^{-${kTex}\\cdot ${t3}}`}\\approx ${fx(rate)}`));
 const kPart=()=>exactPart(`Find the exact value of ${m('k')} in ${m('T-T_s=(T_0-T_s)e^{-kt}')}.`,k,kTex,model+findK);
 let parts;
 if(tier==='foundational')parts=multi(tier)?[kPart(),tempAt(false)]:[pick([tempAt,tempAt,kPart])(true)];
 else if(tier==='intermediate')parts=multi(tier)?[tempAt(true),timeTo(false)]:[pick([timeTo,tempAt])(true)];
 else parts=multi(tier)?[pick([tempAt,timeTo])(true),pick([longer,rateAt])(false)]:[pick([longer,rateAt,timeTo])(true)];
 if(parts.length===2&&parts[0].prompt===parts[1].prompt)return null;
 return build(family,tier,`${family}-${T0}-${Ts}-${t1}-${q.n}_${q.d}`,intro,parts);
}

// ======================================================================
// interest
const COMP=[[1,'annually'],[2,'semiannually'],[4,'quarterly'],[12,'monthly'],[365,'daily']];
function famInterest(tier){
 const P=pick([500,800,1200,1500,2000,2500,3000,4000,5000,7500,10000]),rp=pick([1.25,1.5,1.85,2.1,2.4,2.75,3.05,3.2,3.6,3.95,4.25,4.6,5.1]),r=rp/100,t=pick([2,3,4,5,6,8,10,12,15]);
 const [n,how]=pick(COMP),A=P*Math.pow(1+r/n,n*t),Ac=P*Math.exp(r*t),simple=P*(1+r*t);
 const SIMPLE={value:simple,note:'That is simple interest. Compound interest also earns interest on earlier interest.'};
 const compStep=step('Use the compound interest formula.',`For interest compounded ${m('n')} times per year, ${m('A=P\\left(1+\\frac{r}{n}\\right)^{nt}')}. Here ${m(`P=${nt(P)}`)}, ${m(`r=${r}`)} (the rate as a decimal), ${m(`n=${n}`)} and ${m(`t=${t}`)}.`,
  `A=${nt(P)}\\left(1+\\frac{${r}}{${n}}\\right)^{${n}\\cdot ${t}}\\approx ${nt(money(A))}`);
 const contStep=step('Use continuous compounding.',`Continuous compounding is the solution of ${m('\\frac{dA}{dt}=rA')}, so ${m('A=Pe^{rt}')} with ${m(`P=${nt(P)}`)}, ${m(`r=${r}`)} and ${m(`t=${t}`)}.`,`A=${nt(P)}e^{${r}\\cdot ${t}}\\approx ${nt(money(Ac))}`);
 const intro=`A deposit of ${comma(P)} dollars is made into a savings account that pays ${rp}% annual interest.`;
 const compPart=()=>moneyPart(`What is the balance after ${t} years if the interest is compounded ${how}?`,A,compStep,[{value:Ac,note:`That is the continuously compounded amount. This account compounds ${how}, so use A = P(1 + r/n)^(nt).`},SIMPLE]);
 const contPart=()=>moneyPart(`What is the balance after ${t} years if the interest is compounded continuously?`,Ac,contStep,[{value:A,note:'That uses a finite number of compoundings. Continuous compounding uses A = Pe^(rt).'},SIMPLE]);
 if(tier==='foundational')return build('interest',tier,`int-${P}-${rp}-${t}-${n}`,intro,multi(tier)&&n!==365?[compPart(),contPart()]:[pick([compPart,contPart])()]);
 if(tier==='intermediate'){
  if(multi(tier)&&n!==365&&Math.abs(Ac-A)>=0.05)return build('interest',tier,`intc-${P}-${rp}-${t}-${n}`,intro,[compPart(),contPart()]);
  // time to reach a target with continuous compounding
  const f=pick([2,1.5,3]),target=P*f,tt=Math.log(f)/r;
  return build('interest',tier,`intt-${P}-${rp}-${f}`,`A deposit of ${comma(P)} dollars is made into a savings account that pays ${rp}% annual interest compounded continuously.`,
   [decPart(`How many years will it take for the account to reach ${comma(target)} dollars?`,tt,'years',step('Write the model.','Continuous compounding gives',`A=${nt(P)}e^{${r}t}`)+step(`Solve for ${m('t')}.`,'Set the model equal to the target, divide, and take the natural log.',`${nt(target)}=${nt(P)}e^{${r}t}`,`e^{${r}t}=${f}`,`t=\\frac{\\ln ${f}}{${r}}\\approx ${fx(tt)}`))]);
 }
 // challenging: time to a target with periodic compounding, or interest earned and the difference
 if(U.rand()<0.5){
  const [n2,how2]=pick(COMP.slice(0,4)),f=pick([2,1.5]),tt=Math.log(f)/(n2*Math.log(1+r/n2));
  const parts=[decPart(`How many years will it take for the account to grow to ${comma(P*f)} dollars?`,tt,'years',step('Use the compound interest formula.',`With interest compounded ${how2}, ${m(`A=${nt(P)}\\left(1+\\frac{${r}}{${n2}}\\right)^{${n2}t}`)}.`)+
   step(`Solve for ${m('t')}.`,'Divide by the principal, then take the natural log of both sides; the exponent comes down as a factor.',`\\left(1+\\frac{${r}}{${n2}}\\right)^{${n2}t}=${f}`,`${n2}t\\ln\\left(1+\\frac{${r}}{${n2}}\\right)=\\ln ${f}`,`t=\\frac{\\ln ${f}}{${n2}\\ln\\left(1+\\frac{${r}}{${n2}}\\right)}\\approx ${fx(tt)}`),{wrong:[{value:Math.log(f)/r,note:'That is the time for continuous compounding. This account compounds a whole number of times per year.'}]})];
  if(multi(tier)){parts.unshift(moneyPart(`What is the balance after ${t} years?`,P*Math.pow(1+r/n2,n2*t),step('Use the compound interest formula.',`${m('A=P\\left(1+\\frac{r}{n}\\right)^{nt}')} with ${m(`n=${n2}`)}.`,`A=${nt(P)}\\left(1+\\frac{${r}}{${n2}}\\right)^{${n2}\\cdot ${t}}\\approx ${nt(money(P*Math.pow(1+r/n2,n2*t)))}`)));}
  return build('interest',tier,`intn-${P}-${rp}-${n2}-${f}`,`A deposit of ${comma(P)} dollars is made into a savings account that pays ${rp}% annual interest compounded ${how2}.`,parts);
 }
 const [n3,how3]=pick(COMP.slice(0,4)),A3=P*Math.pow(1+r/n3,n3*t);if(Math.abs(Ac-A3)<0.05)return null;
 const s3=step('Use the compound interest formula.',`${m('A=P\\left(1+\\frac{r}{n}\\right)^{nt}')} with ${m(`n=${n3}`)}.`,`A=${nt(P)}\\left(1+\\frac{${r}}{${n3}}\\right)^{${n3}\\cdot ${t}}\\approx ${nt(money(A3))}`);
 const earned=moneyPart(`How much interest does the account earn in ${t} years if the interest is compounded ${how3}?`,A3-P,s3+step('Subtract the principal.','The interest earned is the final balance minus the amount deposited.',`${nt(money(A3))}-${nt(P)}=${nt(money(A3-P))}`),[{value:A3,note:'That is the final balance. The interest earned is the balance minus the amount invested.'}]);
 const diff=moneyPart(`How much more would the account contain after ${t} years with continuous compounding instead?`,Ac-A3,step('Compute both balances and subtract.',`Continuous: ${m(`${nt(P)}e^{${r}\\cdot ${t}}\\approx ${nt(money(Ac))}`)}. Compounded ${how3}: ${m(`\\approx ${nt(money(A3))}`)}.`,`${nt(money(Ac))}-${nt(money(A3))}\\approx ${nt(money(Ac-A3))}`));
 return build('interest',tier,`inte-${P}-${rp}-${t}-${n3}`,intro,multi(tier)?[earned,diff]:[earned]);
}

// ======================================================================
// reverse / unknown quantity
function famReverse(tier){
 const kind=tier==='foundational'?pick(['principal','dose']):tier==='intermediate'?pick(['rate','initial_count','dose','ambient','equiv_rate']):pick(['initial_temp','halflife_two','ambient3']);
 if(kind==='principal'){
  const A=pick([5000,8000,10000,15000,20000,25000]),rp=pick([2.5,3,3.25,3.75,4,4.5,5]),r=rp/100,t=pick([5,8,10,12,15,18]),P=A*Math.exp(-r*t);
  return build('reverse',tier,`pv-${A}-${rp}-${t}`,`An account earns ${rp}% annual interest compounded continuously.`,
   [moneyPart(`How much must be deposited now so that the account contains ${comma(A)} dollars after ${t} years?`,P,step('Write the model.','Continuous compounding gives',`A=Pe^{rt}`)+step(`Solve for ${m('P')}.`,'Substitute the target balance, the rate and the time, then divide by the exponential.',`${nt(A)}=Pe^{${r}\\cdot ${t}}`,`P=\\frac{${nt(A)}}{e^{${r}\\cdot ${t}}}=${nt(A)}e^{-${r}\\cdot ${t}}\\approx ${nt(money(P))}`),
    [{value:A*(1-r*t),note:'Divide by the growth factor e^(rt) instead of subtracting simple interest.'}])]);
 }
 if(kind==='dose'){
  const drug=U.rand()<0.5;
  if(drug){const S=pick(DRUG),need=pick([20,30,40,50,60,75]),t=pick([2,3,4,6,8].filter(v=>v!==S.h)),k=Math.LN2/S.h,D=need*Math.exp(k*t);
   const intro=`The amount of ${S.name} in ${S.where} decreases at a rate proportional to the amount present, with a half-life of ${S.h} hours. A treatment requires at least ${need} milligrams to remain ${t} hours after a single dose.`;
   const parts=[decPart('What is the smallest dose, in milligrams, that will do this?',D,'mg',decayModel(null,'hours')+halfLifeK(S.h,'hours')+step(`Solve for ${m('y_0')}.`,`Set ${m(`y=${need}`)} at ${m(`t=${t}`)} and divide by the exponential.`,`${need}=y_0e^{-\\frac{\\ln 2}{${S.h}}\\cdot ${t}}`,`y_0=${need}e^{\\frac{\\ln 2}{${S.h}}\\cdot ${t}}\\approx ${fx(D)}`),
    {wrong:[{value:need*Math.exp(-k*t),note:'That is the amount left from a dose of the required size. Solve for the starting dose instead.'}]})];
   if(multi(tier))parts.unshift(exactPart(`Find the exact value of ${m('k')} in ${m('y=y_0e^{-kt}')}.`,k,`\\frac{\\ln 2}{${S.h}}`,decayModel(null,'hours')+halfLifeK(S.h,'hours')));
   return build('reverse',tier,`dose-${S.h}-${need}-${t}`,intro,parts);}
  const S=pick(ISO.filter(s=>s.unit!=='years')),need=pick([20,25,30,40,50]),t=Math.max(1,Math.round(S.h*pick([0.3,0.5,0.8]))),k=Math.LN2/S.h,D=need*Math.exp(k*t);
  const intro=`A laboratory orders ${S.name}, which has a half-life of ${S.h} ${S.unit}. Delivery takes ${times(t,S.unit,S.one)}, and the experiment needs ${need} units of ${S.name} when the shipment arrives.`;
  return build('reverse',tier,`ship-${S.name}-${need}-${t}`,intro,[decPart('How many units should be ordered?',D,'units',decayModel(null,S.unit)+halfLifeK(S.h,S.unit)+step(`Solve for ${m('y_0')}.`,`The amount ordered decays during shipping, so ${m(`y=${need}`)} at ${m(`t=${t}`)}.`,`${need}=y_0e^{-\\frac{\\ln 2}{${nt(S.h)}}\\cdot ${t}}`,`y_0=${need}e^{\\frac{\\ln 2}{${nt(S.h)}}\\cdot ${t}}\\approx ${fx(D)}`))]);
 }
 if(kind==='rate'){
  const P=pick([1000,2000,2500,4000,5000]),f=pick([2,3,1.5]),t=pick([8,10,12,15,20,25]),r=Math.log(f)/t;
  return build('reverse',tier,`rate-${P}-${f}-${t}`,`An investment of ${comma(P)} dollars earns interest compounded continuously.`,
   [decPart(`What annual interest rate will make the investment grow to ${comma(P*f)} dollars in ${t} years? Give the rate as a percent.`,100*r,'%',step('Write the model.','Continuous compounding gives',`${nt(P*f)}=${nt(P)}e^{${t}r}`)+
    step(`Solve for ${m('r')}.`,'Divide by the principal and take the natural log.',`e^{${t}r}=${f}`,`r=\\frac{\\ln ${f}}{${t}}\\approx ${fx(r,6)}`)+step('Write the rate as a percent.','Multiply the decimal rate by 100.',`${fx(r,6)}\\times 100\\approx ${fx(100*r)}\\%`),
    {wrong:[{value:r,note:'That is the rate as a decimal. Give it as a percent.'}]})]);
 }
 if(kind==='initial_count'){
  const C=pick(GROW.filter(c=>c.whole)),T=pick(C.T),r=pick(C.r),t1=pick([1,2,3]),a=pick(C.y0)*pick([2,3]);if(a%r.d)return null;
  const b=a*r.n/r.d,t2=t1+T,k=Math.log(qv(r))/T,kTex=over(lnQ(r),T),y0=a*Math.exp(-k*t1);
  const intro=`${C.who} grows at a rate proportional to its size. After ${times(t1,C.unit,C.one)} it is ${comma(a)} ${C.noun}, and after ${times(t2,C.unit,C.one)} it is ${comma(b)} ${C.noun}.`;
  const parts=[decPart(`What was the ${C.qty} at ${m('t=0')}?`,y0,C.noun,step('Write the model.','Growth proportional to size gives',`y=y_0e^{kt}`)+step(`Find ${m('k')} from the two measurements.`,`Divide the later measurement by the earlier one; ${m('y_0')} cancels and the time between them is ${T}.`,`\\frac{${nt(b)}}{${nt(a)}}=\\frac{y_0e^{${kT(t2)}}}{y_0e^{${kT(t1)}}}=e^{${kT(T)}}`,`k=${kTex}\\approx ${kd(k)}`)+
   step(`Solve for ${m('y_0')}.`,`Use the measurement at ${m(`t=${t1}`)}, then round to the nearest whole number: ${m(nt(Math.round(y0)))}.`,`${nt(a)}=y_0e^{${t1===1?kTex:`${kp(kTex)}\\cdot ${t1}`}}`,`y_0=${nt(a)}e^{-${t1===1?kTex:`${kp(kTex)}\\cdot ${t1}`}}\\approx ${fx(y0)}`),{whole:true})];
  return build('reverse',tier,`init-${C.noun}-${a}-${r.n}_${r.d}-${t1}-${T}`,intro,parts);
 }
 if(kind==='initial_temp'){
  const C=pick(HOT.filter(c=>!/boiling/.test(c.what))),T0=pick(C.T0),Ts=pick(C.Ts),t1=pick(C.t),q=pick(RATIOS),D0=T0-Ts;if(D0%(q.d*q.d))return null;
  const D1=D0*q.n/q.d,D2=D1*q.n/q.d,T1=Ts+D1,T2=Ts+D2,k=Math.log(q.d/q.n)/t1;
  const intro=`${C.what} cools in ${C.place} ${Ts}${C.deg}. Its temperature is ${T1}${C.deg} after ${t1} minutes and ${T2}${C.deg} after ${2*t1} minutes. Assume Newton's Law of Cooling.`;
  const parts=[decPart(`What was its temperature at time ${m('t=0')}?`,T0,C.deg,step("Write Newton's Law of Cooling.",'The difference from the room temperature decays exponentially:',`T-${Ts}=(T_0-${Ts})e^{-kt}`)+
   step(`Find ${m('e^{-k\\cdot '+t1+'}')} from the two readings.`,`The readings are ${t1} minutes apart, so the difference shrinks by the same factor over each ${t1}-minute period.`,`\\frac{${T2}-${Ts}}{${T1}-${Ts}}=e^{-${t1}k}=${qtex(q)}`,`k=${over(lnQ(Q(q.d,q.n)),t1)}\\approx ${kd(k)}`)+
   step(`Solve for ${m('T_0')}.`,`Over the first ${t1} minutes the difference also shrank by the factor ${m(qtex(q))}.`,`${D1}=(T_0-${Ts})\\cdot ${qtex(q)}`,`T_0-${Ts}=${D0}`,`T_0=${T0}`))];
  return build('reverse',tier,`t0-${Ts}-${t1}-${D1}-${q.n}_${q.d}`,intro,parts);
 }
 if(kind==='ambient'){ // surrounding temperature from a known k
  const heat=U.rand()<0.3,C=pick(heat?COLD:HOT),T0=pick(C.T0),Ts=pick(C.Ts),t1=pick(C.t),q=pick([Q(1,2),Q(2,3),Q(3,4),Q(3,5)]),D0=T0-Ts;if(D0%q.d)return null;
  const T1=Ts+D0*q.n/q.d,kTex=over(lnQ(Q(q.d,q.n)),t1);
  const intro=`${C.what} is at ${T0}${C.deg} when it is placed in ${C.place.replace(/ (kept at|set to|at)$/,'')} whose temperature is unknown. Its temperature follows Newton's Law of Cooling with ${m(`k=${kTex}`)} per minute, and after ${t1} minutes it is ${T1}${C.deg}.`;
  return build('reverse',tier,`amb-${T0}-${Ts}-${t1}-${q.n}_${q.d}`,intro,[decPart(`Find the temperature ${m('T_s')} of the surroundings.`,Ts,C.deg,
   step("Write Newton's Law of Cooling.",`The unknown is now ${m('T_s')}; everything else is given.`,`T-T_s=(${T0}-T_s)e^{-kt}`)+
   step(`Evaluate the exponential at ${m(`t=${t1}`)}.`,`With ${m(`k=${kTex}`)}, the exponent is a logarithm, so the exponential simplifies exactly.`,`e^{-${t1}k}=e^{-${lnQ(Q(q.d,q.n))}}=${qtex(q)}`)+
   step(`Solve the linear equation for ${m('T_s')}.`,`Substitute ${m(`T=${T1}`)}, distribute, and collect the ${m('T_s')} terms.`,`${T1}-T_s=${qtex(q)}\\left(${T0}-T_s\\right)`,`${T1}-${qtex(Q(T0*q.n,q.d))}=T_s-${qtex(q)}T_s=${qtex(Q(q.d-q.n,q.d))}T_s`,`T_s=${Ts}`))]);
 }
 if(kind==='ambient3'){ // surrounding temperature from three equally spaced readings
  const C=pick(HOT.filter(c=>!/boiling/.test(c.what))),T0=pick(C.T0),Ts=pick(C.Ts),h=pick(C.t),q=pick(RATIOS),D0=T0-Ts;if(D0%(q.d*q.d))return null;
  const a=T0,b=Ts+D0*q.n/q.d,c=Ts+D0*q.n*q.n/(q.d*q.d);
  const intro=`${C.what} cools in ${C.place.replace(/ (kept at|set to|at)$/,'')} whose temperature is unknown. Its temperature is ${a}${C.deg} at ${m('t=0')}, ${b}${C.deg} at ${m(`t=${h}`)} and ${c}${C.deg} at ${m(`t=${2*h}`)} minutes. Assume Newton's Law of Cooling.`;
  return build('reverse',tier,`amb3-${a}-${b}-${c}`,intro,[decPart(`Find the temperature ${m('T_s')} of the surroundings.`,Ts,C.deg,
   step("Use Newton's law over equal time steps.",`Over each ${h}-minute step the difference ${m('T-T_s')} is multiplied by the same factor ${m(`e^{-${h}k}`)}, so the ratios of consecutive differences are equal.`,`\\frac{${b}-T_s}{${a}-T_s}=\\frac{${c}-T_s}{${b}-T_s}`)+
   step('Cross-multiply and solve.',`The ${m('T_s^{2}')} terms cancel, leaving a linear equation.`,`\\left(${b}-T_s\\right)^{2}=\\left(${a}-T_s\\right)\\left(${c}-T_s\\right)`,`${nt(b*b)}-${nt(2*b)}T_s=${nt(a*c)}-${nt(a+c)}T_s`,`${nt(a+c-2*b)}T_s=${nt(a*c-b*b)}`,`T_s=${Ts}`)+
   step('Check.',`The differences are ${a-Ts}, ${b-Ts} and ${c-Ts}; each is ${m(qtex(q))} of the one before.`))]);
 }
 if(kind==='equiv_rate'){ // continuous rate with the same growth as periodic compounding
  const rp=pick([3,3.5,4,4.5,5,5.5,6,6.5,7,8]),r=rp/100,[n,how]=pick(COMP.slice(1)),rc=n*Math.log(1+r/n);
  return build('reverse',tier,`eqr-${rp}-${n}`,`An account pays ${rp}% annual interest compounded ${how}.`,
   [decPart('What continuously compounded annual rate would give exactly the same balance after every whole number of years? Give the rate as a percent.',100*rc,'%',
    step('Match the growth factors for one year.',`Both accounts must multiply the balance by the same factor each year: ${m('e^{r_c}')} for continuous compounding and ${m('\\left(1+\\frac{r}{n}\\right)^{n}')} for compounding ${how}.`,`e^{r_c}=\\left(1+\\frac{${r}}{${n}}\\right)^{${n}}`)+
    step(`Solve for ${m('r_c')}.`,'Take the natural log of both sides.',`r_c=${n}\\ln\\left(1+\\frac{${r}}{${n}}\\right)\\approx ${fx(rc,6)}`,`${fx(rc,6)}\\times 100\\approx ${fx(100*rc)}\\%`)+
    step('Interpret.',`The continuous rate is slightly lower than ${rp}%: compounding continuously earns interest on interest at every instant, so it needs a smaller stated rate for the same growth.`),
    {wrong:[{value:rc,note:'That is the rate as a decimal. Give it as a percent.'},{value:rp,note:`Continuous compounding grows faster than compounding ${how} at the same stated rate, so the equivalent continuous rate is a little less than ${rp}%.`}]})]);
 }
 // half-life and initial amount from two later measurements
 const P=pick([Q(3,4),Q(2,3),Q(4,5),Q(1,2)]),a=pick([60,80,90,120,150,240]),gap=pick([2,3,4,5]),t1=pick([1,2,3]);if(a%P.d)return null;
 const b=a*P.n/P.d,k=Math.log(P.d/P.n)/gap,kTex=over(lnQ(Q(P.d,P.n)),gap),hl=Math.LN2/k,y0=a*Math.exp(k*t1),unit=pick(['days','hours']);
 const intro=`A radioactive sample has ${a} milligrams remaining after ${t1} ${t1===1?unit.slice(0,-1):unit} and ${b} milligrams remaining after ${t1+gap} ${unit}. Assume it decays at a rate proportional to the amount present.`;
 const findK=step(`Find ${m('k')} from the two measurements.`,`Divide the later amount by the earlier one; ${m('y_0')} cancels and the measurements are ${gap} ${unit} apart.`,`\\frac{${b}}{${a}}=e^{-${kT(gap)}}`,`k=${kTex}\\approx ${kd(k)}`);
 const hlPart=decPart('Find the half-life.',hl,unit,decayModel(null,unit)+findK+step('Use the half-life condition.',`Half remains when ${m('e^{-kt}=\\frac{1}{2}')}.`,`t_{1/2}=\\frac{\\ln 2}{k}\\approx ${fx(hl)}`));
 const y0Part=decPart(`How many milligrams were present at ${m('t=0')}?`,y0,'mg',step(`Solve for ${m('y_0')}.`,`Use ${m(`k=${kTex}`)} and the measurement at ${m(`t=${t1}`)}.`,`${a}=y_0e^{-${kTex}\\cdot ${t1}}`,`y_0=${a}e^{${kTex}\\cdot ${t1}}\\approx ${fx(y0)}`));
 return build('reverse',tier,`two-${a}-${P.n}_${P.d}-${gap}-${t1}`,intro,[hlPart,y0Part]);
}

const FAMILIES={
 growth:{weight:20,tiers:['foundational','intermediate','challenging'],make:famGrowth,calculator:true},
 decay:{weight:25,tiers:['foundational','intermediate','challenging'],make:famDecay,calculator:true},
 cooling:{weight:20,tiers:['foundational','intermediate','challenging'],make:t=>newton('cooling',t),calculator:true},
 heating:{weight:10,tiers:['foundational','intermediate','challenging'],make:t=>newton('heating',t),calculator:true},
 interest:{weight:15,tiers:['foundational','intermediate','challenging'],make:famInterest,calculator:true},
 reverse:{weight:10,tiers:['foundational','intermediate','challenging'],make:famReverse,calculator:true},
};
// v12.8.Y Practice Types; the find-the-unknown problems (reverse) appear in All Problems
const MODES={
 growth_decay:{families:{growth:true,decay:true}},
 newton:{families:{cooling:true,heating:true}},
 interest:{families:{interest:true}},
};
const engine=U.makeEngine('growth',FAMILIES,MODES);
U.profile('unit5-growth-exact',{fraction:true,logarithm:true,parentheses:true,decimal:true});
U.profile('unit5-growth-formula',{fraction:true,exponent:true,logarithm:true,constants:['e'],variables:['t'],parentheses:true,decimal:true});
window.BatchMathUnit5Growth=Object.freeze({make:engine.make,FAMILIES,MODES,weights:engine.weights});
U.register('exponential-growth-and-decay-interest-newton-s-law-of-cooling',o=>engine.make(o||{}));
})();
