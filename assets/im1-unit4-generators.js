// BatchMath Integrated Math 1 Unit 4 (Exponential Functions), Section 1: Geometric Sequences.
// Randomized practice modeled on assignments 01A-01F. Every value is computed with exact fractions, so common ratios
// such as 1/3 or -2/3 and terms such as 448/729 are exact. Problems use the IM1 Unit 3 practice runtime
// (assets/im1-unit3-practice.js) and its problem kinds:
//   arithmetic-identification  a Yes/No decision; when the answer is Yes, a second step asks for the common ratio
//                              (the runtime's two-step identification flow; `arithmetic` means "ask the follow-up")
//   multi                      typed answers, each graded for exact equivalence (3/2 = 1.5 = 6/4)
//   mc                         one choice from four
(function(global){
'use strict';

const random=()=>global.BatchMathRNG?.random?.() ?? 0.5;
const ri=(a,b)=>Math.floor(random()*(b-a+1))+a;
const pick=a=>a[Math.floor(random()*a.length)];
const weighted=pairs=>{let t=random()*pairs.reduce((s,[,w])=>s+w,0);for(const [v,w] of pairs){t-=w;if(t<0)return v;}return pairs.at(-1)[0];};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1;};

// ---- exact fractions ----
function F(n,d=1){if(d<0){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};}
const mul=(a,b)=>F(a.n*b.n,a.d*b.d);
const div=(a,b)=>F(a.n*b.d,a.d*b.n);
const same=(a,b)=>a.n===b.n&&a.d===b.d;
const value=f=>f.n/f.d;
const plain=f=>f.d===1?String(f.n):`${f.n}/${f.d}`;                     // what the checker compares against
const texF=f=>f.d===1?String(f.n):`${f.n<0?'-':''}\\frac{${Math.abs(f.n)}}{${f.d}}`;
const par=f=>f.n<0||f.d!==1?`\\left(${texF(f)}\\right)`:texF(f);        // a factor in a product or quotient
const isWhole=f=>f.d===1;
const decimal=f=>{const x=value(f);return Number.isInteger(x)?String(x):String(Number(x.toFixed(6)));};
const terminates=f=>{let d=f.d;for(const p of [2,5])while(d%p===0)d/=p;return d===1;};
const ratioText=f=>terminates(f)&&!isWhole(f)?decimal(f):texF(f);           // 1.25 for growth rates, 2/3 for thirds

const tex=s=>`\\(${s}\\)`;
const seqTex=terms=>tex((terms.some(t=>!isWhole(t))?'\\displaystyle ':'')+terms.map(texF).join(', ')+', \\ldots');   // full-size fractions in a sequence
const steps=(...items)=>`<div class="bm-u3-worked-steps">${items.map((item,i)=>`<p><strong>Step ${i+1}:</strong> ${item}</p>`).join('')}</div>`;
const termsOf=(a1,r,count)=>{const out=[a1];while(out.length<count)out.push(mul(out.at(-1),r));return out;};
const sub=n=>`a_{${n}}`;
const ordinal=n=>n+(n%100>=11&&n%100<=13?'th':['th','st','nd','rd'][n%10]||'th');

function multiInput(id,variant,q,fields,answerText,explain,meta={}){return{id,variant,kind:'multi',q,fields,answerText,explain,...meta};}
function numberField(id,labelHtml,answer){return{id,labelHtml,label:labelHtml.replace(/\\\(|\\\)|\\|[{}_]/g,''),answer:plain(answer),answerText:tex(texF(answer)),check:'number',inputKind:'fraction'};}
function mc(id,variant,q,correct,distractors,explain){
 const unique=[];for(const c of [correct,...distractors])if(c!=null&&!unique.includes(String(c)))unique.push(String(c));
 const choices=shuffle(unique.slice(0,4));
 return{id,variant,kind:'mc',q,choices,correctIndex:choices.indexOf(String(correct)),answerText:String(correct),explain};
}

// ---- geometric sequences ----
// Common ratios used in 01A-01F: whole numbers, unit fractions, a few non-unit fractions, and their negatives.
const RATIOS={
 whole:[[F(2),5],[F(3),5],[F(4),2],[F(5),1],[F(-2),4],[F(-3),3]],
 unit:[[F(1,2),5],[F(1,3),4],[F(1,4),2],[F(1,5),2],[F(-1,2),4],[F(-1,3),2]],
 other:[[F(3,2),2],[F(2,3),2],[F(-3,2),1],[F(-2,3),1],[F(4,3),1],[F(3,4),1]]
};
const pickRatio=(kinds={whole:5,unit:4,other:2})=>weighted(Object.entries(kinds).map(([k,w])=>[weighted(RATIOS[k]),w]));
// A first term that keeps the shown terms readable: whole numbers most of the time (a1 a multiple of q^(count-1)),
// sometimes a fractional tail (25/2, 81/4), as in the assignments.
function firstTerm(r,count,{fractionalTail=0.25,limit=2500}={}){
 for(let tries=0;tries<200;tries++){
  const q=r.d,power=q===1?0:random()<fractionalTail?ri(0,count-2):count-1;
  const k=pick(q===1?[1,2,3,4,5,6,7,8,9,10,12,15]:[1,1,1,2,3,4,5,6,7]);
  const sign=random()<.15?-1:1,a1=F(sign*k*q**power);
  const terms=termsOf(a1,r,count);
  if(terms.every(t=>Math.abs(t.n)<=limit&&t.d<=729&&t.n!==0)&&!same(terms[0],terms[1]))return a1;
 }
 return F(r.d===1?2:r.d**(count-1));
}
function ratioWork(terms){
 return terms.slice(1).map((t,i)=>tex(`${texF(t)}\\div ${par(terms[i])}=${texF(div(t,terms[i]))}`)).join(', ');
}

// 1A — Geometric or Not: geometric sequences, and look-alikes that are not geometric (arithmetic sequences, a
// geometric pattern with one wrong term, squares and other quadratic patterns, irregular changes).
function notGeometric(){
 const family=weighted([['arithmetic',3],['one_wrong_term',3],['quadratic',2],['irregular',1]]);
 let terms;
 if(family==='arithmetic'){const a=ri(-20,30),d=pick([-12,-8,-6,-5,-4,-3,3,4,5,6,8,10]);terms=[0,1,2,3].map(i=>F(a+i*d));}
 else if(family==='one_wrong_term'){
  const r=pick([F(2),F(3),F(-2),F(1,2)]),base=termsOf(firstTerm(r,4,{fractionalTail:0}),r,4),at=ri(2,3);
  const shift=pick([-1,1])*Math.max(1,Math.round(Math.abs(value(base[at]))*pick([.1,.125,.15,.2,.25])));
  terms=base.map((t,i)=>i===at?F(t.n+shift*t.d,t.d):t);
 }
 else if(family==='quadratic'){const c=pick([0,1,2,-1]),s=ri(1,3),b=pick([0,0,2]);terms=[0,1,2,3].map(i=>F((s+i)**2+b*(s+i)+c));}
 else{const a=ri(8,40),changes=shuffle([-4,-4,-2,-6,-3]).slice(0,3);terms=[F(a)];for(const c of changes)terms.push(F(terms.at(-1).n+c));}
 const ratios=terms.slice(1).map((t,i)=>t.n&&terms[i].n?div(t,terms[i]):null);
 if(terms.some(t=>t.n===0)||ratios.some(x=>!x)||ratios.every(x=>same(x,ratios[0]))||new Set(terms.map(plain)).size<4)return notGeometric();
 return{terms,family};
}
function geometricOrNot(){
 const geometric=random()<.55;
 let terms,family='geometric',r=null;
 if(geometric){r=pickRatio();terms=termsOf(firstTerm(r,4),r,4);}else({terms,family}=notGeometric());
 const work=ratioWork(terms);
 const differences=terms.slice(1).map((t,i)=>F(t.n*terms[i].d-terms[i].n*t.d,t.d*terms[i].d));
 const additive=!geometric&&differences.every(d=>same(d,differences[0]));
 const explain=steps('Divide each term by the term before it.',work,
  geometric?`Every ratio is ${tex(texF(r))}, so the sequence is geometric with common ratio ${tex(`r=${texF(r)}`)}.`
   :`The ratios are not all the same, so the sequence is not geometric.${additive?` (It adds ${tex(texF(differences[0]))} each time. Adding the same amount makes an arithmetic sequence; a geometric sequence multiplies by the same number.)`:''}`);
 return{
  id:`u4-01a-${terms.map(plain).join('_')}`,variant:geometric?'geometric':`not_${family}`,kind:'arithmetic-identification',
  q:`Determine whether the sequence is geometric: ${seqTex(terms)}`,
  choices:['Yes','No'],correctIndex:geometric?0:1,
  arithmetic:geometric,difference:geometric?plain(r):'',followupKeypad:'fraction',
  differencePrompt:'Enter the common ratio r.',
  decisionFeedback:geometric?'Yes. The sequence is geometric. Now enter its common ratio r.':'No. The consecutive ratios are not constant, so the sequence is not geometric.',
  answerText:geometric?`Yes; ${tex(`r=${texF(r)}`)}`:'No; the consecutive ratios are not constant.',
  explain
 };
}

// 1B — Common Ratios and Next Terms.
function commonRatioNextTerms(){
 const r=pickRatio({whole:5,unit:4,other:2});
 if(Math.abs(r.n)===5&&r.d===1)return commonRatioNextTerms();               // 5^6 is too large for the next terms
 const all=termsOf(firstTerm(r,7,{fractionalTail:.3,limit:9000}),r,7),shown=all.slice(0,4),next=all.slice(4);
 const fields=[numberField('ratio','Common ratio \\(r\\)',r),...next.map((t,i)=>numberField(`next-${i+1}`,`Next term \\(${sub(i+5)}\\)`,t))];
 const explain=steps(`Find the common ratio: ${tex(`r=${texF(shown[1])}\\div ${par(shown[0])}=${texF(r)}`)}. Check it with the next pair: ${tex(`${texF(shown[2])}\\div ${par(shown[1])}=${texF(r)}`)}.`,
  `Multiply the last shown term by the common ratio: ${tex(`${sub(5)}=${par(shown[3])}\\cdot ${par(r)}=${texF(next[0])}`)}.`,
  `Keep multiplying by ${tex(texF(r))}: ${tex(`${sub(6)}=${par(next[0])}\\cdot ${par(r)}=${texF(next[1])}`)} and ${tex(`${sub(7)}=${par(next[1])}\\cdot ${par(r)}=${texF(next[2])}`)}.`);
 return multiInput(`u4-01b-${plain(shown[0])}-${plain(r)}`,r.d===1?'whole_ratio':r.n===1||r.n===-1?'unit_fraction_ratio':'fraction_ratio',
  `Find the common ratio and write the next three terms: ${seqTex(shown)}`,fields,
  `${tex(`r=${texF(r)}`)}; next terms: ${tex(next.map(texF).join(', '))}`,explain);
}

// 1C — Finding Terms of Geometric Sequences: the first five terms from a1 and r, or a single term a_n.
function multiplicationChain(a1,r,n){
 const terms=termsOf(a1,r,n);
 return terms.slice(1).map((t,i)=>tex(`${sub(i+2)}=${par(terms[i])}\\cdot ${par(r)}=${texF(t)}`)).join('<br>');
}
function findingTerms(options={}){
 const type=options.type||(random()<.35?'first_five':'nth_term');
 if(type==='first_five'){
  const r=pickRatio({whole:6,unit:4,other:1}),a1=firstTerm(r,5,{fractionalTail:.35,limit:5000}),terms=termsOf(a1,r,5);
  const fields=terms.map((t,i)=>numberField(`term-${i+1}`,`\\(${sub(i+1)}\\)`,t));
  return multiInput(`u4-01c-five-${plain(a1)}-${plain(r)}`,'first_five_terms',
   `A geometric sequence has ${tex(`a_1=${texF(a1)}`)} and common ratio ${tex(`r=${texF(r)}`)}. Write the first five terms.`,fields,
   tex(terms.map(texF).join(', ')),
   steps(`Start with the first term, ${tex(`a_1=${texF(a1)}`)}.`,`Multiply by ${tex(`r=${texF(r)}`)} to get each next term:<br>${multiplicationChain(a1,r,5)}`,
    `The first five terms are ${tex(terms.map(texF).join(', '))}.`));
 }
 for(let tries=0;tries<200;tries++){
  const r=pickRatio({whole:5,unit:4,other:1}),n=ri(4,8);
  const q=r.d,power=q===1?0:ri(Math.max(1,n-3),n-1),k=pick([1,2,3,4,5,6,7,8,9,10,12]),sign=random()<.15?-1:1;
  const a1=F(sign*k*q**power),an=termsOf(a1,r,n).at(-1);
  if(Math.abs(an.n)>9000||an.d>243||Math.abs(a1.n)>2500||an.n===0)continue;
  const phrasing=random()<.5?`A geometric sequence has ${tex(`a_1=${texF(a1)}`)} and ${tex(`r=${texF(r)}`)}. Find ${tex(sub(n))}.`:`Find ${tex(sub(n))} if ${tex(`a_1=${texF(a1)}`)} and ${tex(`r=${texF(r)}`)}.`;
  return multiInput(`u4-01c-term-${plain(a1)}-${plain(r)}-${n}`,'nth_term',phrasing,[numberField('term',`\\(${sub(n)}\\)`,an)],tex(`${sub(n)}=${texF(an)}`),
   steps(`${tex(sub(n))} is ${n} − 1 = ${n-1} multiplications by ${tex(`r=${texF(r)}`)} after ${tex(`a_1`)}. (Multiply; do not add.)`,multiplicationChain(a1,r,n),
    `So ${tex(`${sub(n)}=${texF(an)}`)}.`));
 }
 return findingTerms(options);
}

// 1D — Geometric Growth and Decay Modeling.
// Common ratios from percent changes, fractions lost, and multiplying words.
const PERCENT_UP=[2,3,4,5,6,8,10,12,15,20,25,30,35,40,50,60,75,100],PERCENT_DOWN=[2,3,4,5,6,8,10,12,15,20,25,30,35,40,45,50,60,75,80];
function changeFactor(){
 const kind=weighted([['up',4],['down',4],['words',2],['fraction',2]]);
 if(kind==='up'){const p=pick(PERCENT_UP);return{kind,p,r:F(100+p,100),phrase:`increases by ${p}%`,why:`An increase of ${p}% keeps the whole amount (100%) and adds ${p}%: 100% + ${p}% = ${100+p}%.`};}
 if(kind==='down'){const p=pick(PERCENT_DOWN);return{kind,p,r:F(100-p,100),phrase:`decreases by ${p}%`,why:`A decrease of ${p}% leaves 100% − ${p}% = ${100-p}% of the amount.`};}
 if(kind==='words'){const [phrase,r,why]=pick([['doubles',F(2),'Doubling multiplies by 2.'],['triples',F(3),'Tripling multiplies by 3.'],['quadruples',F(4),'Quadrupling multiplies by 4.'],['is cut in half',F(1,2),'Cutting in half multiplies by \\(\\frac{1}{2}\\).'],['becomes 5 times as large',F(5),'Five times as large multiplies by 5.']]);return{kind,r,phrase,why};}
 const [lost,r,why]=pick([['one third',F(2,3),'If one third is lost, two thirds remain.'],['one fourth',F(3,4),'If one fourth is lost, three fourths remain.'],['half',F(1,2),'If half is lost, half remains.'],['two thirds',F(1,3),'If two thirds are lost, one third remains.']]);
 return{kind,r,lost,why};
}
// "A town’s population increases by 25% each year." / "Each hour, one third of the amount ... is lost."
const statement=(subject,c,unit)=>c.kind==='fraction'?`Each ${unit}, ${c.lost} of ${subject[0].toLowerCase()+subject.slice(1)} is lost.`:`${subject} ${c.phrase} each ${unit}.`;
const GROWING=[['A town’s population','year'],['The number of cells in a culture','hour'],['The number of shares of a post','day'],['The balance of a savings account','year'],['The number of points in a game prize','level']];
const DECAYING=[['The amount of a medicine in the body','hour'],['The value of a machine','year'],['The mass of a sample','day'],['The value of a car','year'],['The temperature difference of a cooling drink','minute']];
function growthFactor(){
 const c=changeFactor(),growth=value(c.r)>1,pool=growth?GROWING:DECAYING,[subject,unit]=pick(pool),who=`${growth?'g':'d'}${pool.findIndex(x=>x[0]===subject)}`;
 const conclusion=`${c.why} So ${tex(`r=${ratioText(c.r)}`)}. Because ${tex(`r${growth?'>':'<'}1`)}, this is ${growth?'growth':'decay'}.`;
 if((c.kind==='up'||c.kind==='down')&&random()<.45){
  if(random()<.5){
   const pct=c.p,correct=`${c.kind==='up'?'Growth':'Decay'} by ${pct}%`,other=`${c.kind==='up'?'Decay':'Growth'} by ${pct}%`,keep=`${c.kind==='up'?'Growth':'Decay'} by ${c.kind==='up'?100+pct:100-pct}%`;
   const dir=c.kind==='up'?'Growth':'Decay',otherDir=c.kind==='up'?'Decay':'Growth',kept=c.kind==='up'?100+pct:100-pct;
   return mc(`u4-01d-factor-read-${plain(c.r)}-${unit}`,'read_factor',`Each ${unit}, an amount is multiplied by ${tex(ratioText(c.r))}. Which describes the change each ${unit}?`,correct,[other,keep,`${otherDir} by ${kept}%`,`${dir} by ${pct*2}%`,`${otherDir} by ${pct*2}%`],
    steps(`Compare the common ratio with 1: ${tex(`${ratioText(c.r)}${growth?'>':'<'}1`)}, so the amount ${growth?'grows':'decays'}.`,`${tex(ratioText(c.r))} is ${c.kind==='up'?100+pct:100-pct}%, which is ${pct}% ${growth?'more':'less'} than 100%.`,`The amount ${growth?'grows':'decays'} by ${pct}% each ${unit}.`));
  }
  const p=c.p,opposite=F(c.kind==='up'?100-p:100+p,100),bare=F(p,100);
  return mc(`u4-01d-factor-choose-${plain(c.r)}-${who}`,'choose_factor',`${statement(subject,c,unit)} Which common ratio models this?`,ratioText(c.r),[ratioText(opposite),ratioText(bare),String(p),ratioText(F(p,10))],
   steps(c.why,conclusion,`(${tex(ratioText(bare))} is only the change, not the whole new amount.)`));
 }
 return multiInput(`u4-01d-factor-${plain(c.r)}-${who}`,'state_factor',`${statement(subject,c,unit)} What is the common ratio of the geometric sequence that models it?`,
  [numberField('ratio','Common ratio \\(r\\)',c.r)],tex(`r=${ratioText(c.r)}`),steps(conclusion));
}
// Word problems: "at the end of hour 1" is a1, so "the end of hour n" is a_n, n - 1 multiplications later.
const CONTEXTS=[
 {noun:'A bacteria culture',has:'has',what:'cells',unit:'hour',ask:'the number of cells',it:'The number of cells',label:'Cells',words:['doubles','triples'],up:[50,100]},
 {noun:'A population',has:'has',what:'organisms',unit:'year',ask:'the population',it:'The population',label:'Population',words:['doubles'],up:[10,20,25,50]},
 {noun:'A medicine amount',has:'is',what:'mg',unit:'hour',ask:'the amount',it:'The amount',label:'Amount (mg)',words:['is cut in half'],down:[20,25,50]},
 {noun:'A social media post',has:'has',what:'shares',unit:'day',ask:'the number of shares',it:'The number of shares',label:'Shares',words:['doubles','triples'],up:[50,100]},
 {noun:'A machine',has:'is worth',what:'dollars',money:true,unit:'year',ask:'its value',it:'It',label:'Value (dollars)',down:[10,20,25]},
 {noun:'A rumor',has:'reaches',what:'people',unit:'day',ask:'the number of people reached',label:'People reached',times:[3,4,5]},
 {noun:'A sample',has:'has mass',what:'grams',unit:'day',ask:'the mass',label:'Mass (grams)',fractions:true},
 {noun:'A game prize',has:'is',what:'points',unit:'level',ask:'the points',it:'The prize',label:'Points',words:['doubles']}
];
function growthWordProblem(){
 const ctx=pick(CONTEXTS);let r,phrase,stateRatio;
 const options=[...(ctx.words||[]).map(w=>['words',w]),...(ctx.up||[]).map(p=>['up',p]),...(ctx.down||[]).map(p=>['down',p]),...(ctx.times||[]).map(k=>['times',k]),...(ctx.fractions?[['fraction','one third'],['fraction','one fourth'],['fraction','half']]:[])];
 const [kind,detail]=pick(options);
 if(kind==='words'){r={doubles:F(2),triples:F(3),'is cut in half':F(1,2)}[detail];phrase=`${detail} each ${ctx.unit}`;stateRatio=random()<.5;}
 else if(kind==='up'){r=F(100+detail,100);phrase=`increases by ${detail}% each ${ctx.unit}`;stateRatio=true;}
 else if(kind==='down'){r=F(100-detail,100);phrase=`${ctx.money?'loses':'decreases by'} ${detail}%${ctx.money?' of its value':''} each ${ctx.unit}`;stateRatio=true;}
 else if(kind==='times'){r=F(detail);phrase=`reaches ${detail} times as many people each ${ctx.unit} as the ${ctx.unit} before`;stateRatio=random()<.5;}
 else{r={'one third':F(2,3),'one fourth':F(3,4),half:F(1,2)}[detail];phrase=`loses ${detail} of its mass each ${ctx.unit}`;stateRatio=true;}
 for(let tries=0;tries<300;tries++){
  const n=ri(3,value(r)>=2?(r.n<=2?7:5):6),q=r.d;
  const k=pick([1,2,3,4,5,6,8,10,12,15,16,20,25]),a1=F(k*q**(n-1)*(ctx.money&&q<5?pick([10,25,50,100]):1));
  const an=termsOf(a1,r,n).at(-1);
  if(!isWhole(an)||an.n<=0||a1.n>20000||an.n>100000||(ctx.money&&a1.n<500)||(!ctx.money&&a1.n<4))continue;
  const unitCap=ctx.unit[0].toUpperCase()+ctx.unit.slice(1),money=x=>ctx.money?`$${x}`:`${x} ${ctx.what}`;
  const start=ctx.unit==='level'?`in level 1`:`at the end of ${ctx.unit} 1`,target=ctx.unit==='level'?`in level ${n}`:`at the end of ${ctx.unit} ${n}`;
  const q1=kind==='times'?`${ctx.noun} reaches ${a1.n} people on day 1. Each day, it reaches ${detail} times as many people as the day before.`
   :`${ctx.noun} ${ctx.has} ${money(a1.n)} ${start}. ${kind==='fraction'?`Each ${ctx.unit}, ${detail} of the sample is lost.`:`${ctx.it} ${phrase}.`}`;
  const question=`${q1} ${stateRatio?'State the common ratio and find':'Find'} ${ctx.ask} ${kind==='times'?`on day ${n}`:target}.`;
  const fields=[...(stateRatio?[numberField('ratio','Common ratio \\(r\\)',r)]:[]),numberField('value',`${ctx.label}, ${ctx.unit} ${n}`,an)];
  const chain=termsOf(a1,r,n),factor=ratioText(r).includes('frac')?`\\left(${ratioText(r)}\\right)`:ratioText(r);
  const table=chain.map((t,i)=>`${unitCap} ${i+1}: ${i===0?tex(texF(t)):tex(`${texF(chain[i-1])}\\cdot ${factor}=${texF(t)}`)}`).join('<br>');
  const ratioStep=kind==='up'?`An increase of ${detail}% means each ${ctx.unit} is 100% + ${detail}% = ${100+detail}% of the ${ctx.unit} before, so ${tex(`r=${ratioText(r)}`)}.`
   :kind==='down'?`A loss of ${detail}% leaves 100% − ${detail}% = ${100-detail}%, so ${tex(`r=${ratioText(r)}`)}.`
   :kind==='fraction'?`If ${detail} is lost, ${detail==='one third'?'two thirds':detail==='one fourth'?'three fourths':'half'} remains, so ${tex(`r=${ratioText(r)}`)}.`
   :`The amount ${kind==='times'?`becomes ${detail} times as large`:detail}, so ${tex(`r=${ratioText(r)}`)}.`;
  const answer=ctx.money?`$${an.n}`:`${an.n} ${ctx.what}`;
  return multiInput(`u4-01d-model-${ctx.unit}-${a1.n}-${plain(r)}-${n}`,`model_${kind}`,question+(ctx.money?' (Enter the number of dollars.)':''),fields,
   `${stateRatio?`${tex(`r=${ratioText(r)}`)}; `:''}value = ${answer}`,
   steps(ratioStep,`${unitCap} 1 gives the first term, ${tex(`a_1=${a1.n}`)}, so ${ctx.unit} ${n} is the ${ordinal(n)} term. From ${ctx.unit} 1 to ${ctx.unit} ${n} there are ${n} − 1 = ${n-1} multiplications by ${tex(ratioText(r))}. (Multiply each ${ctx.unit}; do not add.)`,table,`${ctx.ask[0].toUpperCase()+ctx.ask.slice(1)} ${kind==='times'?`on day ${n}`:target} is ${answer}.`));
 }
 return growthWordProblem();
}
function growthAndDecay(options={}){
 const mode=options.mode;
 if(mode==='factors')return growthFactor();
 if(mode==='models')return growthWordProblem();
 return random()<.4?growthFactor():growthWordProblem();
}

const lessonGenerators={
 'geometric-or-not':geometricOrNot,
 'common-ratios-and-next-terms':commonRatioNextTerms,
 'finding-terms-of-geometric-sequences':findingTerms,
 'geometric-growth-and-decay-modeling':growthAndDecay
};
// The Section 1 review mixes the lessons in the proportions of reviews 01E and 01F (24 problems each):
// about 6 identifications, 4 next-terms, 10 term-finding and 4 growth/decay word problems.
const REVIEW_WEIGHTS=[['geometric-or-not',6],['common-ratios-and-next-terms',4],['finding-terms-of-geometric-sequences',10],['geometric-growth-and-decay-modeling',4]];
function sectionReview(options={}){
 const mode=options.mode;
 if(mode&&lessonGenerators[mode])return lessonGenerators[mode]();
 const slug=weighted(REVIEW_WEIGHTS);
 return slug==='geometric-growth-and-decay-modeling'?growthWordProblem():lessonGenerators[slug]();
}
const generators={...lessonGenerators,'section-a-review':sectionReview};

global.BatchMathIM1Unit4Generators={
 get:slug=>generators[slug],
 list:()=>Object.keys(generators),
 lessons:lessonGenerators,
 sections:{a:Object.keys(lessonGenerators)},
 qa:{F,mul,div,value,plain,texF,termsOf,growthFactor,growthWordProblem,findingTerms}
};
})(window);
