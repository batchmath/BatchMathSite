// BatchMath Integrated Math 1 Unit 4 (Exponential Functions): practice engines for all four sections and the unit review.
// Randomized practice modeled on the Unit 4 assignments (01A-01E, 02A-02D, 03A-03H, 04A-04D, 05A-05B). Every value is
// computed with exact fractions, so common ratios such as 1/3 or -2/3 and terms such as 448/729 are exact. Problems use
// the IM1 Unit 3 practice runtime (assets/im1-unit3-practice.js) and two of its problem kinds:
//   arithmetic-identification  1A only: a Yes/No decision; when the answer is Yes, a second step asks for the ratio
//                              (the runtime's two-step identification flow; `arithmetic` means "ask the follow-up")
//   multi                      typed answers in separate labeled fields
// There are no multiple-choice problems. A field is graded by the runtime (numbers: exact equivalence, 3/2 = 1.5 = 6/4;
// first terms: 5 or a1 = 5) or, when it names a `custom` check, by checkField below: formulas and equations are
// compared by value (a_n = 4(2)^(n-1) = 2^(n+1)), solutions accept 3 or x = 3, percents 20 or 20%, and the words
// growth and decay are typed.
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
// A percent typed without the % sign (20 for 20%), and the word growth or decay, typed.
function percentField(id,labelHtml,p){return{id,labelHtml,label:labelHtml.replace(/\\\(|\\\)|\\|[{}_]/g,''),answer:plain(p),answerText:`${decimal(p)}%`,check:'number',custom:'percent',mathKind:'percent',inputKind:'fraction'};}
function wordField(id,labelHtml,word){return{id,labelHtml,label:labelHtml,answer:word,answerText:word[0].toUpperCase()+word.slice(1),check:'word',custom:'word',placeholder:'growth or decay'};}

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
function multiplicationChain(a1,r,n,factor=par(r)){
 const terms=termsOf(a1,r,n);
 return terms.slice(1).map((t,i)=>tex(`${sub(i+2)}=${par(terms[i])}\\cdot ${factor}=${texF(t)}`)).join('<br>');
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
// Three typed question forms (v13.0.I replaces the earlier choice questions):
//   state_factor    the common ratio of a stated change ("increases by 25%" -> 1.25 = 5/4; "loses one third" -> 2/3)
//   ratio_and_type  the common ratio, and whether it is growth or decay (two fields)
//   read_factor     from a ratio, the percent change and whether it is growth or decay ("multiplied by 0.8" -> 20, decay)
function growthFactor(){
 const c=changeFactor(),growth=value(c.r)>1,pool=growth?GROWING:DECAYING,[subject,unit]=pick(pool),who=`${growth?'g':'d'}${pool.findIndex(x=>x[0]===subject)}`;
 const type=growth?'growth':'decay',compare=`Because ${tex(`r${growth?'>':'<'}1`)}, this is ${type}.`;
 const conclusion=`${c.why} So ${tex(`r=${ratioText(c.r)}`)}. ${compare}`;
 const change=F(Math.abs(c.r.n-c.r.d)*100,c.r.d),percentChange=c.kind==='up'||c.kind==='down';
 const style=weighted([['state_factor',4],['ratio_and_type',3],['read_factor',isWhole(change)?3:0]]);
 if(style==='read_factor'){
  const kept=F(c.r.n*100,c.r.d);
  return multiInput(`u4-01d-factor-read-${plain(c.r)}-${unit}`,'read_factor',
   `Each ${unit}, an amount is multiplied by ${tex(ratioText(c.r))}. By what percent does it change each ${unit}, and is the change growth or decay?`,
   [percentField('percent','Percent change (%)',change),wordField('type','Growth or decay?',type)],`${decimal(change)}% ${type}`,
   steps(`Compare the common ratio with 1: ${tex(`${ratioText(c.r)}${growth?'>':'<'}1`)}, so the amount ${growth?'grows':'decays'}. (A ratio greater than 1 is growth; a ratio between 0 and 1 is decay.)`,
    `Write the ratio as a percent: ${tex(ratioText(c.r))} is ${decimal(kept)}% of the amount before.`,
    `${growth?`${decimal(kept)}% − 100%`:`100% − ${decimal(kept)}%`} = ${decimal(change)}%, so the amount ${growth?'grows':'decays'} by ${decimal(change)}% each ${unit}.`));
 }
 if(style==='ratio_and_type')
  return multiInput(`u4-01d-factor-type-${plain(c.r)}-${who}`,'ratio_and_type',
   `${statement(subject,c,unit)} What is the common ratio of the geometric sequence that models it, and is it growth or decay?`,
   [numberField('ratio','Common ratio \\(r\\)',c.r),wordField('type','Growth or decay?',type)],`${tex(`r=${ratioText(c.r)}`)}; ${type}`,
   steps(c.why,`So ${tex(`r=${ratioText(c.r)}`)}${c.r.d!==1&&terminates(c.r)?` (or ${tex(texF(c.r))})`:''}.${percentChange?` (${tex(ratioText(F(c.p,100)))} is only the change, not the whole new amount.)`:''}`,compare));
 return multiInput(`u4-01d-factor-${plain(c.r)}-${who}`,'state_factor',`${statement(subject,c,unit)} What is the common ratio of the geometric sequence that models it?`,
  [numberField('ratio','Common ratio \\(r\\)',c.r)],tex(`r=${ratioText(c.r)}`),steps(conclusion+(percentChange?` (${tex(ratioText(F(c.p,100)))} is only the change, not the whole new amount.)`:'')));
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
// The Section 1 review mixes the lessons in the proportions of review 01E (24 problems): about 6 identifications,
// 4 next-terms, 10 term-finding and 4 growth/decay problems.
const REVIEW_WEIGHTS=[['geometric-or-not',6],['common-ratios-and-next-terms',4],['finding-terms-of-geometric-sequences',10],['geometric-growth-and-decay-modeling',4]];
function sectionReview(options={}){
 const mode=options.mode;
 if(mode&&lessonGenerators[mode])return lessonGenerators[mode]();
 const slug=weighted(REVIEW_WEIGHTS);
 return slug==='geometric-growth-and-decay-modeling'?growthWordProblem():lessonGenerators[slug]();
}

// =====================================================================================================================
// Answer checking for the typed formulas, equations, solutions, percents and words (the runtime calls checkField for a
// field that names a `custom` check). Formulas and equations are compared by value, so every equivalent form is
// accepted: a_n = 4(2)^(n-1), 4*2^(n-1) and 2^(n+1) are the same formula; y = (12)(1/4)^(x-1) = 48(0.25)^x.
// =====================================================================================================================
// MathLive's text (a_n=4*(2)^(n-1)), the legacy keypads' text (aₙ=4(2)^(n−1)) and keyboard spellings (an=4*2^(n-1),
// a1=5) all reduce to one form. The sequence names become single letters: P = a(n-1), A = a(n), B = a(1), F = f(x) or f(n).
function mathText(raw){
 let s=String(raw??'').trim().toLowerCase();
 s=s.replace(/[−–—]/g,'-').replace(/[×·⋅∙]/g,'*').replace(/÷/g,'/')
  .replace(/\\[dt]?frac/g,'\\frac').replace(/\\(?:cdot|times|ast)(?![a-z])/g,'*').replace(/\\(?:left|right)(?![a-z])/g,'')
  .replace(/\\(?:[,;:! ]|quad|qquad)/g,'').replace(/\\%/g,'%').replace(/\\text\{([^{}]*)\}/g,'$1');
 s=s.replace(/a\s*(?:_\s*\{\s*n\s*-\s*1\s*\}|_\s*\(\s*n\s*-\s*1\s*\)|\(\s*n\s*-\s*1\s*\)|ₙ₋₁)/g,'P')
  .replace(/a\s*(?:_\s*\{\s*1\s*\}|_\s*1(?![\d.])|\(\s*1\s*\)|₁|1(?![\d.]))/g,'B')
  .replace(/a\s*(?:_\s*\{\s*n\s*\}|_\s*n|\(\s*n\s*\)|ₙ|n)/g,'A')
  .replace(/f\s*\(\s*[nx]\s*\)/g,'F');
 for(let i=0;i<12&&s.includes('\\frac');i++){
  const before=s;s=s.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,'(($1)/($2))').replace(/\\frac\s*(\d)\s*(\d)/g,'(($1)/($2))');
  if(s===before)break;
 }
 return s.replace(/[{[]/g,'(').replace(/[}\]]/g,')').replace(/\s+/g,'');
}
function mathTokens(s){
 const out=[];
 for(let i=0;i<s.length;){
  const m=/^(?:\d+(?:\.\d*)?|\.\d+)/.exec(s.slice(i));
  if(m){out.push({t:'num',v:Number(m[0])});i+=m[0].length;continue;}
  const c=s[i++];
  if('nxyPABF'.includes(c))out.push({t:'var',v:c});
  else if('+-*/^()='.includes(c))out.push({t:c});
  else return null;
 }
 return out;
}
// Standard precedence: ^ before unary minus (-2^2 = -4), then * / and implied products (4(2)^n, 2a_(n-1)), then + -.
function parseTokens(toks){
 let i=0;const peek=()=>toks[i],take=()=>toks[i++],opens=t=>t&&(t.t==='num'||t.t==='var'||t.t==='(');
 const expr=()=>{let node=term();while(peek()&&(peek().t==='+'||peek().t==='-')){const op=take().t;node={op,a:node,b:term()};}return node;};
 const term=()=>{let node=unary();for(;;){const t=peek();if(t&&(t.t==='*'||t.t==='/')){take();node={op:t.t,a:node,b:unary()};}else if(opens(t))node={op:'*',a:node,b:power()};else return node;}};
 const unary=()=>{const t=peek();if(t&&(t.t==='-'||t.t==='+')){take();const v=unary();return t.t==='-'?{op:'neg',a:v}:v;}return power();};
 const power=()=>{const base=primary();if(peek()?.t==='^'){take();return{op:'^',a:base,b:unary()};}return base;};
 const primary=()=>{const t=take();if(t?.t==='num')return{num:t.v};if(t?.t==='var')return{v:t.v};if(t?.t==='('){const node=expr();if(take()?.t!==')')throw Error('parenthesis');return node;}throw Error('term');};
 const node=expr();if(i!==toks.length)throw Error('extra');return node;
}
function evaluate(node,env){
 if('num' in node)return node.num;
 if('v' in node){if(!(node.v in env))throw Error('variable');return env[node.v];}
 const a=evaluate(node.a,env);if(node.op==='neg')return -a;
 const b=evaluate(node.b,env);
 return node.op==='+'?a+b:node.op==='-'?a-b:node.op==='*'?a*b:node.op==='/'?a/b:Math.pow(a,b);
}
const variablesOf=(node,set=new Set())=>{if('v' in node)set.add(node.v);for(const k of ['a','b'])if(node[k])variablesOf(node[k],set);return set;};
const SYMBOLS_ONLY='Use numbers, the variable, and + − · / ^ ( ) only.';
function readEquation(raw){
 const s=mathText(raw);
 if(!s||s==='?')return{error:s?'Complete your answer.':'Enter an answer.'};
 if(s.includes(','))return{error:'Enter one formula or equation in this box.'};
 const toks=s.includes('\\')?null:mathTokens(s);
 if(!toks)return{error:SYMBOLS_ONLY};
 const sides=[[]];for(const t of toks){if(t.t==='=')sides.push([]);else sides.at(-1).push(t);}
 if(sides.some(side=>!side.length))return{error:'Complete both sides of the equation.'};
 try{return{trees:sides.map(parseTokens)};}catch{return{error:'This entry is incomplete. Check the parentheses and operations.'};}
}
// The right side of "rhs", "name = rhs" or "y = f(x) = rhs", where the names on the left are the allowed ones.
function rightSide(raw,names,start){
 const read=readEquation(raw);if(read.error)return read;
 const heads=read.trees.slice(0,-1);
 if(heads.length>2||heads.some(h=>!('v' in h)||!names.includes(h.v)))return{error:`Start with ${start} or enter only the right side.`};
 return{rhs:read.trees.at(-1)};
}
const close=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b));
const fractionValue=s=>{const [n,d='1']=String(s).split('/');return Number(n)/Number(d);};
// a constant: 3, -3/2, 1.5, x = 3 (when allowed)
function constantValue(raw,{variable}={}){
 const read=readEquation(raw);if(read.error)return read;
 const {trees}=read;
 if(trees.length>2||(trees.length===2&&!(variable&&'v' in trees[0]&&trees[0].v===variable)))return{error:variable?`Enter the value of ${variable}, such as 3 or ${variable} = 3.`:'Enter a number.'};
 const rhs=trees.at(-1);if(variablesOf(rhs).size)return{error:'Enter a number, decimal, or fraction.'};
 const v=evaluate(rhs,{});if(!Number.isFinite(v))return{error:'Enter a number with a nonzero denominator.'};
 return{value:v};
}
// A form of an equation for "write different equations": numbers are combined (1/4 = 0.25), products ignore order.
function canonical(node){
 if(!variablesOf(node).size){const v=evaluate(node,{});return Number.isFinite(v)?String(Number(v.toPrecision(12))):'NaN';}
 if('v' in node)return node.v;
 if(node.op==='neg')return `-(${canonical(node.a)})`;
 if(node.op==='*'){
  const flat=[],walk=n=>{if(n.op==='*'){walk(n.a);walk(n.b);}else flat.push(n);};walk(node);
  const constant=flat.filter(n=>!variablesOf(n).size).reduce((p,n)=>p*evaluate(n,{}),1);
  return [String(Number(constant.toPrecision(12))),...flat.filter(n=>variablesOf(n).size).map(canonical).sort()].join('*');
 }
 return `(${canonical(node.a)})${node.op}(${canonical(node.b)})`;
}
const GROWTH_WORDS=/^(?:exponential)?(?:growth|grow|grows|growing|increase|increases|increasing)$/,DECAY_WORDS=/^(?:exponential)?(?:decay|decays|decaying|decrease|decreases|decreasing)$/;
const CHECKS={
 // a_n in terms of n: equal to a1*r^(n-1) for n = 1..8
 explicit(raw,field){
  const side=rightSide(raw,['A','F'],'aₙ =');if(side.error)return side;
  const vars=variablesOf(side.rhs);
  if(vars.has('P')||vars.has('A')||vars.has('B'))return{error:'An explicit formula uses n, not other terms of the sequence.'};
  if([...vars].some(v=>v!=='n'))return{error:'Write the formula in terms of n.'};
  const a1=fractionValue(field.a1),r=fractionValue(field.ratio);
  for(let n=1;n<=8;n++)if(!close(evaluate(side.rhs,{n}),a1*r**(n-1)))return{ok:false};
  return{ok:true};
 },
 // a_n from a_(n-1): equal to r*a_(n-1) for several values of a_(n-1)
 rule(raw,field){
  const side=rightSide(raw,['A'],'aₙ =');if(side.error)return side;
  const vars=variablesOf(side.rhs);
  if(!vars.has('P'))return{error:'The rule must use aₙ₋₁, the term before aₙ.'};
  if([...vars].some(v=>v!=='P'))return{error:'A recursive rule gives aₙ from aₙ₋₁ only.'};
  const r=fractionValue(field.ratio);
  for(const p of [1,2,-3,7,0.5])if(!close(evaluate(side.rhs,{P:p}),r*p))return{ok:false};
  return{ok:true};
 },
 // y in terms of x: equal to b*r^x for x = -2..5; when several equations are asked for, each must be a different form
 exponential(raw,field,values){
  const side=rightSide(raw,['y','F'],'y =');if(side.error)return side;
  const vars=variablesOf(side.rhs);
  if([...vars].some(v=>v!=='x'))return{error:'Write the equation in terms of x.'};
  const b=fractionValue(field.b),r=fractionValue(field.ratio);
  for(let x=-2;x<=5;x++)if(!close(evaluate(side.rhs,{x}),b*r**x))return{ok:false};
  for(const other of field.distinctFrom||[]){
   const prior=rightSide(values?.[other.id],['y','F'],'y =');
   if(prior.rhs&&canonical(prior.rhs)===canonical(side.rhs))return{error:`This is the same equation as ${other.label}. Write a different form.`};
  }
  return{ok:true};
 },
 solution(raw,field){const v=constantValue(raw,{variable:'x'});return v.error?v:{ok:close(v.value,fractionValue(field.answer))};},
 percent(raw,field){const v=constantValue(String(raw??'').trim().replace(/\\?%$|percent$/i,''));return v.error?v:{ok:close(v.value,fractionValue(field.answer))};},
 word(raw,field){
  const w=String(raw??'').toLowerCase().replace(/[^a-z]/g,''),said=GROWTH_WORDS.test(w)?'growth':DECAY_WORDS.test(w)?'decay':null;
  return said?{ok:said===field.answer}:{error:'Type growth or decay.'};
 }
};
function checkField(raw,field,values){const check=CHECKS[field.custom];return check?check(raw,field,values):{error:'This answer cannot be checked.'};}

// ---- formulas and fields shared by Sections 2-4 ----
const coefficient=(r,dec)=>r.d===1?String(r.n):dec?ratioText(r):texF(r);        // "2", "-\frac{1}{2}", "1.25"
const recTex=(a1,r,dec)=>`a_1=${texF(a1)},\\ a_n=${coefficient(r,dec)}a_{n-1}`;
const ruleTex=(r,dec)=>`a_n=${coefficient(r,dec)}a_{n-1}`;
const explicitTex=(a1,r,exp='n-1')=>`a_n=${texF(a1)}\\left(${texF(r)}\\right)^{${exp}}`;
const shiftTex=h=>h===0?'x':h>0?`x-${h}`:`x+${-h}`;
const expTex=(b,r,h=0,dec=false)=>`y=f(x)=\\left(${texF(b)}\\right)\\left(${dec?ratioText(r):texF(r)}\\right)^{${shiftTex(h)}}`;
const pow=(r,k)=>{let out=F(1);for(let i=0;i<Math.abs(k);i++)out=mul(out,r);return k<0?div(F(1),out):out;};
function initialField(a1){return{id:'a1',labelHtml:'First term \\(a_1\\)',label:'First term a1',answer:plain(a1),answerText:tex(`a_1=${texF(a1)}`),check:'initial-term',inputKind:'fraction'};}
function ruleField(r,dec){return{id:'rule',labelHtml:'Recursive rule \\(a_n=\\)',label:'Recursive rule a_n =',ratio:plain(r),answerText:tex(ruleTex(r,dec)),check:'recursive-rule',custom:'rule',mathKind:'rule'};}
function explicitField(a1,r){return{id:'formula',labelHtml:'Explicit formula \\(a_n=\\)',label:'Explicit formula a_n =',a1:plain(a1),ratio:plain(r),answerText:tex(explicitTex(a1,r)),check:'formula',custom:'explicit',mathKind:'explicit'};}
function equationField(b,r,{id='equation',labelHtml='Equation \\(y=\\)',answerText,distinctFrom}={}){
 return{id,labelHtml,label:labelHtml.replace(/\\\(|\\\)|\\/g,''),b:plain(b),ratio:plain(r),answerText:answerText||tex(expTex(b,r)),check:'line',custom:'exponential',mathKind:'exponential',...(distinctFrom?{distinctFrom}:{})};
}
function solutionField(x){return{id:'x',labelHtml:'\\(x=\\)',label:'x =',answer:plain(x),answerText:tex(`x=${texF(x)}`),check:'number',custom:'solution',mathKind:'number',inputKind:'fraction'};}
function valueField(id,label,v){return{...numberField(id,label,v),answerText:tex(terminates(v)?decimal(v):texF(v))};}
// A two-row table, as in the assignments: the period (Hour 1-4) and the amount.
function valueTable(period,quantity,first,values){
 return `<div class="bm-u4-table-wrap"><table class="bm-u4-table"><tbody><tr><th scope="row">${period}</th>${values.map((_,i)=>`<td>${first+i}</td>`).join('')}</tr><tr><th scope="row">${quantity}</th>${values.map(v=>`<td>${tex(texF(v))}</td>`).join('')}</tr></tbody></table></div>`;
}
const SEQ_RATIOS={
 whole:[[F(2),6],[F(3),5],[F(4),3],[F(5),2],[F(-2),4],[F(-3),2]],
 unit:[[F(1,2),6],[F(1,3),4],[F(1,4),2],[F(1,5),2],[F(1,10),1],[F(-1,2),4],[F(-1,3),2]],
 other:[[F(3,2),2],[F(2,3),2],[F(3,4),1],[F(4,3),1],[F(3,10),1],[F(5,2),1],[F(-3,2),1],[F(-2,3),1]]
};
const seqRatio=(kinds={whole:5,unit:4,other:2})=>weighted(Object.entries(kinds).map(([k,w])=>[weighted(SEQ_RATIOS[k]),w]));
const ratioVariant=r=>(r.n<0?'negative_':'')+(r.d===1?'whole_ratio':Math.abs(r.n)===1?'unit_fraction_ratio':'fraction_ratio');
const PERCENT_RATIOS=new Set(['4/5','9/10','3/5','5/4','6/5','11/10']),asDecimal=r=>PERCENT_RATIOS.has(plain(r));
const ratioCheck=(terms,dec)=>{const r=div(terms[1],terms[0]);return `Divide each term by the term before it: ${ratioWork(terms)}. The common ratio is ${tex(`r=${texF(r)}${dec?`=${ratioText(r)}`:''}`)}.`;};
const capital=s=>s[0].toUpperCase()+s.slice(1);

// ===================================================== Section 2 =====================================================
// 2A — Writing Recursive Formulas: the first term and the rule, from four terms.
function writingRecursive(){
 const r=seqRatio(),a1=firstTerm(r,4,{fractionalTail:.25,limit:3000}),terms=termsOf(a1,r,4);
 return multiInput(`u4-02a-${plain(a1)}-${plain(r)}`,ratioVariant(r),`Write a recursive formula for the geometric sequence ${seqTex(terms)}`,
  [initialField(a1),ruleField(r)],tex(recTex(a1,r)),
  steps(`The first term is ${tex(`a_1=${texF(a1)}`)}.`,ratioCheck(terms),
   `Each term is the term before it multiplied by ${tex(texF(r))}, so the rule is ${tex(ruleTex(r))}. (Multiply; do not add.)`,
   `A recursive formula needs both the first term and the rule: ${tex(recTex(a1,r))}.`));
}
// 2B — Using Recursive Formulas: the first 4-6 terms, two requested terms, or the terms after a given term.
function usingRecursive(options={}){
 const type=options.type||weighted([['first_terms',5],['requested_terms',3],['from_given_term',2]]);
 const r=seqRatio({whole:5,unit:4,other:3});
 if(type==='first_terms'){
  const k=ri(4,6),a1=firstTerm(r,k,{fractionalTail:.35,limit:5000}),terms=termsOf(a1,r,k);
  return multiInput(`u4-02b-first-${plain(a1)}-${plain(r)}-${k}`,'first_terms',`Write the first ${k} terms of the sequence if ${tex(recTex(a1,r))}.`,
   terms.map((t,i)=>numberField(`term-${i+1}`,`\\(${sub(i+1)}\\)`,t)),tex(terms.map(texF).join(', ')),
   steps(`The formula gives the first term, ${tex(`a_1=${texF(a1)}`)}.`,`The rule ${tex(ruleTex(r))} says: multiply a term by ${tex(texF(r))} to get the next term.<br>${multiplicationChain(a1,r,k)}`,
    `The first ${k} terms are ${tex(terms.map(texF).join(', '))}.`));
 }
 if(type==='requested_terms'){
  const j=ri(5,7),i=ri(2,j-2),a1=firstTerm(r,j,{fractionalTail:.3,limit:5000}),terms=termsOf(a1,r,j);
  if(Math.abs(terms.at(-1).n)>50000)return usingRecursive(options);
  return multiInput(`u4-02b-terms-${plain(a1)}-${plain(r)}-${i}-${j}`,'requested_terms',`A geometric sequence is defined by ${tex(recTex(a1,r))}. Find ${tex(sub(i))} and ${tex(sub(j))}.`,
   [numberField(`term-${i}`,`\\(${sub(i)}\\)`,terms[i-1]),numberField(`term-${j}`,`\\(${sub(j)}\\)`,terms[j-1])],tex(`${sub(i)}=${texF(terms[i-1])},\\ ${sub(j)}=${texF(terms[j-1])}`),
   steps(`Start with ${tex(`a_1=${texF(a1)}`)} and multiply by ${tex(texF(r))} to get each next term. (A recursive formula finds each term from the one before it, so work through every term in order.)`,
    multiplicationChain(a1,r,j),`So ${tex(`${sub(i)}=${texF(terms[i-1])}`)} and ${tex(`${sub(j)}=${texF(terms[j-1])}`)}.`));
 }
 for(let tries=0;tries<200;tries++){
  const m=ri(2,5),am=F((random()<.15?-1:1)*pick([2,3,4,5,6,8,9,10,12,16,18,20,24,27,32,36,40,48,54,64,72,80,81,96,100,128,160,243])),next=termsOf(am,r,3).slice(1);
  if(next.some(t=>t.d>243||Math.abs(t.n)>20000))continue;
  return multiInput(`u4-02b-given-${plain(am)}-${plain(r)}-${m}`,'from_given_term',`A geometric sequence follows the rule ${tex(ruleTex(r))}, and ${tex(`${sub(m)}=${texF(am)}`)}. Find ${tex(sub(m+1))} and ${tex(sub(m+2))}.`,
   next.map((t,i)=>numberField(`term-${m+1+i}`,`\\(${sub(m+1+i)}\\)`,t)),tex(`${sub(m+1)}=${texF(next[0])},\\ ${sub(m+2)}=${texF(next[1])}`),
   steps(`The rule ${tex(ruleTex(r))} says each term is ${tex(texF(r))} times the term before it. The given term ${tex(`${sub(m)}=${texF(am)}`)} is the starting value.`,
    `${tex(`${sub(m+1)}=${par(r)}\\cdot ${par(am)}=${texF(next[0])}`)}`,`${tex(`${sub(m+2)}=${par(r)}\\cdot ${par(next[0])}=${texF(next[1])}`)}`));
 }
 return usingRecursive({type:'first_terms'});
}
// 2C — Recursive Formulas from Tables and Contexts.
// "The end of hour 1" is the first term a1, as in the assignments.
const TABLES=[
 {intro:'The table shows the number of milligrams of medication in a patient’s system at the end of each hour.',period:'Hour',quantity:'Milligrams',decay:true},
 {intro:'The table shows the number of people infected at the end of each week.',period:'Week',quantity:'People infected'},
 {intro:'The table shows the value of a car, in dollars, at the end of each year.',period:'Year',quantity:'Car value ($)',decay:true},
 {intro:'The table shows the number of points earned at the end of each round.',period:'Round',quantity:'Points'},
 {intro:'The table shows the number of views of a video at the end of each day.',period:'Day',quantity:'Views'},
 {intro:'The table shows the mass, in grams, of a radioactive sample at the end of each day.',period:'Day',quantity:'Mass (grams)',decay:true},
 {intro:'The table shows the number of bacteria cells at the end of each hour.',period:'Hour',quantity:'Cells'},
 {intro:'The table shows the value of a computer, in dollars, at the end of each year.',period:'Year',quantity:'Value ($)',decay:true}
];
const GROW_RATIOS=[[F(2),5],[F(3),5],[F(4),3],[F(5),2],[F(3,2),2],[F(5,4),1],[F(6,5),1]];
const DECAY_RATIOS=[[F(1,2),5],[F(1,3),4],[F(1,4),2],[F(1,5),1],[F(2,3),2],[F(3,4),2],[F(4,5),2],[F(1,10),1],[F(9,10),1]];
// whole, positive values for `count` periods
function tableStart(r,count,limit=60000){
 for(let tries=0;tries<200;tries++){
  const a1=F(pick([1,1,2,2,3,4,5,6,7,8,9,10,12,15,16,18,20,25])*r.d**(count-1)*(r.d===1&&random()<.4?pick([5,10]):1));
  const terms=termsOf(a1,r,count);
  if(terms.every(t=>isWhole(t)&&t.n>0&&t.n<=limit)&&a1.n>=4)return a1;
 }
 return F(r.d**(count-1));
}
const CONTEXT_STARTS=[
 {start:n=>`A population has ${n} organisms at the end of hour 1`,unit:'hour',noun:'the population',what:'organisms',label:'Population'},
 {start:n=>`A video has ${n} views at the end of day 1`,unit:'day',noun:'the number of views',what:'views',label:'Views'},
 {start:n=>`A bacteria culture has ${n} cells at the end of hour 1`,unit:'hour',noun:'the number of cells',what:'cells',label:'Cells'},
 {start:n=>`A game prize is worth ${n} points in level 1`,unit:'level',noun:'the prize',what:'points',level:true,label:'Points'},
 {start:n=>`A medication contains ${n} mg at the end of hour 1`,unit:'hour',noun:'the amount of medication',what:'mg',decay:true,label:'Amount (mg)'},
 {start:n=>`A radioactive sample has ${n} grams at the end of day 1`,unit:'day',noun:'the mass',what:'grams',decay:true,label:'Mass (grams)'},
 {start:n=>`A machine is worth $${n} at the end of year 1`,unit:'year',noun:'its value',what:'dollars',decay:true,money:true,label:'Value (dollars)'}
];
const CONTEXT_CHANGES={
 grow:[['increases by 25% each %u',F(5,4),'An increase of 25% keeps the whole amount (100%) and adds 25%: 125% = 1.25.',true],['increases by 50% each %u',F(3,2),'An increase of 50% keeps 100% and adds 50%: 150% = 1.5.',true],
  ['increases by 20% each %u',F(6,5),'An increase of 20% keeps 100% and adds 20%: 120% = 1.2.',true],['increases by 10% each %u',F(11,10),'An increase of 10% keeps 100% and adds 10%: 110% = 1.1.',true],
  ['doubles each %u',F(2),'Doubling multiplies by 2.'],['triples each %u',F(3),'Tripling multiplies by 3.'],['quadruples each %u',F(4),'Quadrupling multiplies by 4.']],
 decay:[['decreases by 20% each %u',F(4,5),'A decrease of 20% leaves 100% − 20% = 80% = 0.8.',true],['decreases by 10% each %u',F(9,10),'A decrease of 10% leaves 100% − 10% = 90% = 0.9.',true],
  ['decreases by 25% each %u',F(3,4),'A decrease of 25% leaves 100% − 25% = 75% = 0.75.',true],['decreases by 40% each %u',F(3,5),'A decrease of 40% leaves 100% − 40% = 60% = 0.6.',true],
  ['is cut in half each %u',F(1,2),'Cutting in half multiplies by \\(\\frac{1}{2}\\).'],['one third of it remains each %u',F(1,3),'If one third remains, each term is \\(\\frac{1}{3}\\) of the term before.'],
  ['loses one fourth of it each %u',F(3,4),'If one fourth is lost, three fourths remain: \\(\\frac{3}{4}\\).']]
};
function tablesAndContexts(options={}){
 const type=options.type||weighted([['table',4],['context',4],['formula_terms',2]]);
 if(type==='table'){
  const ctx=pick(TABLES),r=weighted(ctx.decay?DECAY_RATIOS:GROW_RATIOS),a1=tableStart(r,4),terms=termsOf(a1,r,4),dec=asDecimal(r);
  return multiInput(`u4-02c-table-${ctx.period}-${a1.n}-${plain(r)}`,'table',`${ctx.intro}${valueTable(ctx.period,ctx.quantity,1,terms)}Find the common ratio and write a recursive formula to model the situation. Include the first term.`,
   [numberField('ratio','Common ratio \\(r\\)',r),initialField(a1),ruleField(r,dec)],`${tex(`r=${dec?ratioText(r):texF(r)}`)}; ${tex(recTex(a1,r,dec))}`,
   steps(ratioCheck(terms,dec),`${ctx.period} 1 is the first term, so ${tex(`a_1=${a1.n}`)}.`,`Each ${ctx.period.toLowerCase()}, the amount is multiplied by ${tex(dec?ratioText(r):texF(r))}: ${tex(ruleTex(r,dec))}.`,
    `The recursive formula, with its first term: ${tex(recTex(a1,r,dec))}.`));
 }
 if(type==='context'){
  const ctx=pick(CONTEXT_STARTS),[phrase,r,why,dec=false]=pick(CONTEXT_CHANGES[ctx.decay?'decay':'grow']);
  const askValue=random()<.4,n=ri(3,5),a1=tableStart(r,askValue?n:2,ctx.money?200000:60000),an=termsOf(a1,r,n).at(-1);
  const at=ctx.level?`in level ${n}`:`at the end of ${ctx.unit} ${n}`,amount=x=>ctx.money?`$${x}`:`${x} ${ctx.what}`;
  const fields=[initialField(a1),ruleField(r,dec),...(askValue?[valueField('value',`${ctx.label}, ${ctx.unit} ${n}`,an)]:[])];
  return multiInput(`u4-02c-context-${ctx.unit}-${a1.n}-${plain(r)}-${askValue?n:0}`,askValue?'context_and_value':'context',
   `${ctx.start(a1.n)} and ${phrase.replace('%u',ctx.unit)}. Write a recursive formula.${askValue?` Then find ${ctx.noun} ${at}.${ctx.money?' (Enter the number of dollars.)':''}`:''}`,fields,
   `${tex(recTex(a1,r,dec))}${askValue?`; ${amount(an.n)}`:''}`,
   steps(`${ctx.level?'Level 1':`The end of ${ctx.unit} 1`} gives the first term: ${tex(`a_1=${a1.n}`)}.`,`${why} So ${tex(`r=${dec?ratioText(r):texF(r)}`)}, and each term is ${tex(dec?ratioText(r):texF(r))} times the term before: ${tex(ruleTex(r,dec))}.`,
    `The recursive formula is ${tex(recTex(a1,r,dec))}.`,
    ...(askValue?[`${capital(ctx.unit)} ${n} is the ${ordinal(n)} term, ${n} − 1 = ${n-1} multiplications after ${tex('a_1')}:<br>${multiplicationChain(a1,r,n,dec?ratioText(r):par(r))}<br>So ${ctx.noun} ${at} is ${amount(an.n)}.`]:[])));
 }
 const r=seqRatio({whole:5,unit:4,other:1}),a1=firstTerm(r,5,{fractionalTail:.3,limit:5000}),terms=termsOf(a1,r,5);
 return multiInput(`u4-02c-formula-${plain(a1)}-${plain(r)}`,'formula_terms',`A sequence has the recursive formula ${tex(recTex(a1,r))}. What is the common ratio? Write the first five terms.`,
  [numberField('ratio','Common ratio \\(r\\)',r),...terms.map((t,i)=>numberField(`term-${i+1}`,`\\(${sub(i+1)}\\)`,t))],`${tex(`r=${texF(r)}`)}; ${tex(terms.map(texF).join(', '))}`,
  steps(`The rule ${tex(ruleTex(r))} multiplies each term by ${tex(texF(r))}, so the common ratio is ${tex(`r=${texF(r)}`)}.`,`Start with ${tex(`a_1=${texF(a1)}`)} and multiply by ${tex(texF(r))} each time:<br>${multiplicationChain(a1,r,5)}`,
   `The first five terms are ${tex(terms.map(texF).join(', '))}.`));
}

// ===================================================== Section 3 =====================================================
const explicitSteps=(a1,r)=>[`An explicit formula has the form ${tex('a_n=a_1\\cdot r^{\\,n-1}')}. The exponent is ${tex('n-1')} because the first term has been multiplied by ${tex('r')} zero times, the second term once, and so on.`,
 `Substitute ${tex(`a_1=${texF(a1)}`)} and ${tex(`r=${texF(r)}`)}: ${tex(explicitTex(a1,r))}.`];
// a later term, from the explicit formula
function termFromFormula(a1,r,k){const ak=mul(a1,pow(r,k-1));return{ak,step:`Substitute ${tex(`n=${k}`)}: ${tex(`${sub(k)}=${texF(a1)}\\left(${texF(r)}\\right)^{${k-1}}=${texF(a1)}\\cdot ${par(pow(r,k-1))}=${texF(ak)}`)}.`};}
const termReady=ak=>Math.abs(ak.n)<=500000&&ak.d<=19683;
// 3A — Writing Explicit Formulas, from four terms; sometimes a later term from the formula.
function writingExplicit(){
 const r=seqRatio(),a1=firstTerm(r,4,{fractionalTail:.2,limit:3000}),terms=termsOf(a1,r,4),k=ri(6,9),later=termFromFormula(a1,r,k),withTerm=random()<.3&&termReady(later.ak);
 return multiInput(`u4-03a-${plain(a1)}-${plain(r)}${withTerm?`-${k}`:''}`,withTerm?'formula_and_term':ratioVariant(r),
  `Write an explicit formula for the geometric sequence ${seqTex(terms)}${withTerm?` Then use your formula to find ${tex(sub(k))}.`:''}`,
  [explicitField(a1,r),...(withTerm?[numberField('term',`\\(${sub(k)}\\)`,later.ak)]:[])],`${tex(explicitTex(a1,r))}${withTerm?`; ${tex(`${sub(k)}=${texF(later.ak)}`)}`:''}`,
  steps(`The first term is ${tex(`a_1=${texF(a1)}`)}. ${ratioCheck(terms)}`,...explicitSteps(a1,r),
   `Check: ${tex(`n=2`)} gives ${tex(`${texF(a1)}\\left(${texF(r)}\\right)^{1}=${texF(terms[1])}`)}, the second term.`,...(withTerm?[later.step]:[])));
}
// 3B — Converting Recursive to Explicit.
function recursiveToExplicit(){
 const r=seqRatio({whole:5,unit:4,other:3}),a1=firstTerm(r,4,{fractionalTail:.15,limit:3000}),a2=mul(a1,r),k=ri(5,8),later=termFromFormula(a1,r,k),withTerm=random()<.25&&termReady(later.ak);
 return multiInput(`u4-03b-${plain(a1)}-${plain(r)}${withTerm?`-${k}`:''}`,withTerm?'convert_and_term':ratioVariant(r),
  `Convert the recursive formula to an explicit formula: ${tex(recTex(a1,r))}.${withTerm?` Then find ${tex(sub(k))}.`:''}`,
  [explicitField(a1,r),...(withTerm?[numberField('term',`\\(${sub(k)}\\)`,later.ak)]:[])],`${tex(explicitTex(a1,r))}${withTerm?`; ${tex(`${sub(k)}=${texF(later.ak)}`)}`:''}`,
  steps(`Read the recursive formula: the first term is ${tex(`a_1=${texF(a1)}`)}, and the rule multiplies by ${tex(texF(r))}, so ${tex(`r=${texF(r)}`)}.`,...explicitSteps(a1,r),
   `Check: the recursive rule gives ${tex(`a_2=${par(r)}\\cdot ${par(a1)}=${texF(a2)}`)}, and the explicit formula gives ${tex(`${texF(a1)}\\left(${texF(r)}\\right)^{1}=${texF(a2)}`)}.`,...(withTerm?[later.step]:[])));
}
// 3C — Converting Explicit to Recursive; sometimes the formula uses the exponent n, so a1 is not the number in front.
function explicitToRecursive(){
 const r=seqRatio({whole:5,unit:4,other:3}),shifted=random()<.15;
 if(shifted){
  for(let tries=0;tries<100;tries++){
   const c=firstTerm(r,3,{fractionalTail:.2,limit:2000}),a1=mul(c,r);
   if(a1.d>81||Math.abs(a1.n)>5000)continue;
   const given=explicitTex(c,r,'n');
   return multiInput(`u4-03c-power-n-${plain(c)}-${plain(r)}`,'explicit_power_n',`Convert the explicit formula to a recursive formula: ${tex(given)}. Include the first term.`,
    [initialField(a1),ruleField(r)],tex(recTex(a1,r)),
    steps(`This formula uses the exponent ${tex('n')}, not ${tex('n-1')}, so the number in front is not the first term. Substitute ${tex('n=1')}: ${tex(`a_1=${texF(c)}\\left(${texF(r)}\\right)^{1}=${texF(a1)}`)}.`,
     `The base of the power is the common ratio, ${tex(`r=${texF(r)}`)}: each term is ${tex(texF(r))} times the term before, so ${tex(ruleTex(r))}.`,
     `The recursive formula, with its first term: ${tex(recTex(a1,r))}.`));
  }
 }
 const a1=firstTerm(r,4,{fractionalTail:.15,limit:3000});
 return multiInput(`u4-03c-${plain(a1)}-${plain(r)}`,ratioVariant(r),`Convert the explicit formula to a recursive formula: ${tex(explicitTex(a1,r))}. Include the first term.`,
  [initialField(a1),ruleField(r)],tex(recTex(a1,r)),
  steps(`In ${tex('a_n=a_1\\cdot r^{\\,n-1}')}, the number in front is the first term: ${tex(`a_1=${texF(a1)}`)}. (Check: ${tex('n=1')} gives ${tex(`${texF(a1)}\\left(${texF(r)}\\right)^{0}=${texF(a1)}`)}.)`,
   `The base of the power is the common ratio, ${tex(`r=${texF(r)}`)}: each term is ${tex(texF(r))} times the term before, so ${tex(ruleTex(r))}.`,
   `A recursive formula needs the first term and the rule: ${tex(recTex(a1,r))}.`));
}
// 3D — Explicit Formulas from Tables and Terms.
// Two terms g places apart give r^g. An odd g has one real root; an even g has two (r and -r), so those problems state
// the sign of the common ratio and no problem has two answers.
function explicitFromTablesTerms(options={}){
 const type=options.type||weighted([['table',1],['two_terms',1]]);
 if(type==='table'){
  const ctx=pick(TABLES),r=weighted(ctx.decay?DECAY_RATIOS:GROW_RATIOS),m=ri(5,6),a1=tableStart(r,m,200000),terms=termsOf(a1,r,m),dec=asDecimal(r);
  const period=ctx.period.toLowerCase();
  return multiInput(`u4-03d-table-${ctx.period}-${a1.n}-${plain(r)}-${m}`,'table',
   `${ctx.intro.replace(/ at the end of each \w+\.$/,` for ${period}s 1 through 4.`)}${valueTable(ctx.period,ctx.quantity,1,terms.slice(0,4))}Find the common ratio, write an explicit formula, and find the value at ${period} ${m}.`,
   [numberField('ratio','Common ratio \\(r\\)',r),explicitField(a1,r),valueField('value',`Value at ${period} ${m}`,terms[m-1])],
   `${tex(`r=${dec?ratioText(r):texF(r)}`)}; ${tex(explicitTex(a1,r))}; ${tex(`${sub(m)}=${texF(terms[m-1])}`)}`,
   steps(ratioCheck(terms.slice(0,4),dec),`${ctx.period} 1 is the first term, ${tex(`a_1=${a1.n}`)}.`,...explicitSteps(a1,r),termFromFormula(a1,r,m).step));
 }
 for(let tries=0;tries<400;tries++){
  const gap=weighted([[3,6],[2,3],[4,1]]),even=gap%2===0;
  const r=weighted(gap===4?[[F(2),3],[F(1,2),3],[F(-2),1],[F(3),1],[F(1,3),1]]:[[F(2),5],[F(3),3],[F(-2),3],[F(-3),1],[F(1,2),4],[F(-1,2),2],[F(1,3),2],[F(-1,3),1],[F(3,2),1],[F(2,3),1]]);
  const m=ri(2,4),n2=m+gap;if(n2>8)continue;
  const am=F((random()<.2?-1:1)*pick([1,2,3,4,5,6,7,8,9,10,12,16,18,20,24,27,32,36,40,48,54,64,80,81,96,100,128,160,162,243]));
  const a1=div(am,pow(r,m-1)),an2=mul(am,pow(r,gap));
  if(a1.d>64||Math.abs(a1.n)>6000||an2.d>729||Math.abs(an2.n)>30000||(isWhole(a1)&&random()<.15))continue;
  const sign=r.n>0?'positive':'negative',q=div(an2,am),root=F(Math.abs(r.n),r.d);
  const solve=even?`Because ${gap} is even, ${tex(`r=${texF(root)}`)} and ${tex(`r=${texF(F(-root.n,root.d))}`)} both give ${tex(`r^{${gap}}=${texF(q)}`)}. The problem says the common ratio is ${sign}, so ${tex(`r=${texF(r)}`)}.`
   :`Because ${gap} is odd, only one number works: ${tex(`\\left(${texF(r)}\\right)^{${gap}}=${texF(q)}`)}, so ${tex(`r=${texF(r)}`)}.`;
  const back=m===1?'':` Work back to the first term: ${tex(`${sub(m)}=a_1\\cdot r^{${m-1}}`)}, so ${tex(`a_1=${texF(am)}\\div ${par(pow(r,m-1))}=${texF(a1)}`)}.`;
  return multiInput(`u4-03d-terms-${m}-${plain(am)}-${n2}-${plain(an2)}`,even?'two_terms_even_gap':'two_terms_odd_gap',
   `A geometric sequence${even?` with a ${sign} common ratio`:''} has ${tex(`${sub(m)}=${texF(am)}`)} and ${tex(`${sub(n2)}=${texF(an2)}`)}. Find the common ratio and write an explicit formula for the sequence.`,
   [numberField('ratio','Common ratio \\(r\\)',r),explicitField(a1,r)],`${tex(`r=${texF(r)}`)}; ${tex(explicitTex(a1,r))}`,
   steps(`From ${tex(sub(m))} to ${tex(sub(n2))} there are ${n2} − ${m} = ${gap} multiplications by ${tex('r')}: ${tex(`${sub(n2)}=${sub(m)}\\cdot r^{${gap}}`)}, so ${tex(`r^{${gap}}=${texF(an2)}\\div ${par(am)}=${texF(q)}`)}.`,
    solve+back,`Substitute into ${tex('a_n=a_1\\cdot r^{\\,n-1}')}: ${tex(explicitTex(a1,r))}.`,
    `Check: ${tex(`${sub(n2)}=${texF(a1)}\\left(${texF(r)}\\right)^{${n2-1}}=${texF(an2)}`)}.`));
 }
 return explicitFromTablesTerms({type:'table'});
}
// 3E — Exponential Growth and Decay Models: reading an equation, or modeling a context ("x periods since the start").
const MODEL_PERCENTS=[2,3,4,5,6,8,10,12,15,20,25,30,40,50,60,75];
const MODEL_CONTEXTS=[
 {start:b=>`A population has ${b} organisms when an observation begins`,unit:'year',since:'the observation began',ask:'the population',what:'organisms',whole:true,up:true,starts:[1000,1200,1500,2000,2400,2500,4000,5000]},
 {start:b=>`A machine is worth ${b} dollars when it is purchased`,unit:'year',since:'it was purchased',ask:'its value',what:'dollars',money:true,up:false,starts:[1000,2000,4000,5000,8000,10000,12000,20000]},
 {start:b=>`A bacteria culture has ${b} cells when an experiment starts`,unit:'hour',since:'the experiment started',ask:'the number of cells',what:'cells',whole:true,up:true,starts:[64,80,100,128,160,200,256,400,500]},
 {start:b=>`A medication contains ${b} mg when treatment starts`,up:false,unit:'hour',since:'treatment started',ask:'the amount of medication',what:'mg',starts:[200,250,400,500,640,800,1000]},
 {start:b=>`A sample has ${b} grams when an experiment starts`,up:false,unit:'day',since:'the experiment started',ask:'the mass of the sample',what:'grams',starts:[100,200,250,400,500,625,800,1000]},
 {start:b=>`A game score is ${b} points when a bonus stage begins`,unit:'level',since:'the bonus stage began',ask:'the score',what:'points',whole:true,up:true,starts:[64,80,100,128,200,256,400]},
 {start:b=>`A savings account has ${b} dollars when it is opened`,unit:'year',since:'it was opened',ask:'the balance',what:'dollars',money:true,up:true,starts:[500,1000,2000,2500,4000,5000]},
 {start:b=>`A quantity is ${b} when a process begins`,unit:'period',since:'the process began',ask:'the quantity',what:'',starts:[100,200,400,500,800,1000]}
];
function growthDecayModels(options={}){
 const type=options.type||weighted([['identify',4],['context',6]]);
 if(type==='identify'){
  const up=random()<.5,p=pick(MODEL_PERCENTS),r=F(up?100+p:100-p,100),b=pick([50,64,80,100,120,150,200,250,300,400,500,600,750,800,900,1000,1200,1500,2000,2400,5000]),kind=up?'growth':'decay';
  return multiInput(`u4-03e-identify-${b}-${plain(r)}`,'identify',`For ${tex(`y=(${b})(${ratioText(r)})^{x}`)}, identify the \\(y\\)-intercept and the common ratio. At what percent is the function growing or decaying? Is it growth or decay?`,
   [numberField('intercept','\\(y\\)-intercept',F(b)),numberField('ratio','Common ratio \\(r\\)',r),percentField('percent','Percent (%)',F(p)),wordField('type','Growth or decay?',kind)],
   `\\(y\\)-intercept ${b}; ${tex(`r=${ratioText(r)}`)}; ${p}% ${kind}`,
   steps(`In ${tex('y=(b)(r)^{x}')}, the \\(y\\)-intercept is ${tex('b')}: at ${tex('x=0')}, ${tex('r^{0}=1')}, so ${tex(`y=${b}`)}.`,`The base of the power is the common ratio: ${tex(`r=${ratioText(r)}`)}.`,
    `${tex(`${ratioText(r)}${up?'>':'<'}1`)}, so this is ${kind}. ${tex(ratioText(r))} is ${up?100+p:100-p}% of the amount before, and ${up?`${100+p}% − 100%`:`100% − ${100-p}%`} = ${p}%, so it is ${p}% ${kind}.`));
 }
 for(let tries=0;tries<400;tries++){
  const ctx=pick(MODEL_CONTEXTS),up=ctx.up??random()<.4,p=pick(up?[5,10,20,25,50]:[10,15,20,25,40,50]),r=F(up?100+p:100-p,100),b=pick(ctx.starts),k=ri(2,ctx.money||ctx.whole?3:4);
  const value=mul(F(b),pow(r,k));
  if(ctx.whole?!isWhole(value):ctx.money?100%value.d!==0:!terminates(value)||value.d>100)continue;
  if(!ctx.money&&!ctx.whole&&!isWhole(value)&&random()<.5)continue;
  const units=`${ctx.unit}s`,shown=decimal(value),chain=[...Array(k)].map(()=>ratioText(r)).join('\\cdot ');
  const phrase=up?`increases by ${p}% each ${ctx.unit}`:ctx.money?`loses ${p}% of its value each ${ctx.unit}`:`decreases by ${p}% each ${ctx.unit}`;
  return multiInput(`u4-03e-context-${ctx.unit}-${b}-${plain(r)}-${k}`,up?'context_growth':'context_decay',
   `${ctx.start(b)} and ${phrase}. Let \\(x\\) be the number of ${units} since ${ctx.since}. Write an exponential equation for ${ctx.ask} after \\(x\\) ${units}. What is ${ctx.ask} after ${k} ${units}?`,
   [equationField(F(b),r,{answerText:tex(expTex(F(b),r,0,true))}),valueField('value',`Value after ${k} ${units}`,value)],`${tex(expTex(F(b),r,0,true))}; at ${tex(`x=${k}`)}, ${tex(`y=${shown}`)}`,
   steps(`At the start, ${tex('x=0')}, the amount is ${b}, so the \\(y\\)-intercept is ${b}. (Here ${tex('x')} counts ${units} since the start; the starting amount is the value at ${tex('x=0')}.)`,
    `${up?`An increase of ${p}% keeps 100% and adds ${p}%: ${100+p}%`:`A decrease of ${p}% leaves 100% − ${p}% = ${100-p}%`}, so ${tex(`r=${ratioText(r)}`)}.`,
    `The equation is ${tex(expTex(F(b),r,0,true))}.`,
    `Substitute ${tex(`x=${k}`)}: ${tex(`y=(${b})(${ratioText(r)})^{${k}}=${b}\\cdot ${chain}=${shown}`)}. After ${k} ${units}, ${ctx.ask} is ${ctx.money?`$${isWhole(value)?shown:(value.n/value.d).toFixed(2)}`:`${shown}${ctx.what?` ${ctx.what}`:''}`}.`));
 }
 return growthDecayModels({type:'identify'});
}
// 3F — Writing Exponential Equations from the y-Intercept and Common Ratio (given, as the point (0, b), or in a table).
const INTERCEPTS=[[F(2),2],[F(3),2],[F(4),2],[F(5),2],[F(6),1],[F(8),1],[F(9),1],[F(10),1],[F(12),1],[F(15),1],[F(20),1],[F(-2),2],[F(-3),1],[F(-4),1],[F(-6),1],[F(-8),1],[F(1,2),2],[F(1,3),1],[F(1,4),1],[F(2,3),1],[F(-2,3),1],[F(3,4),1],[F(5,2),1]];
const BASES_3F=[[F(2),4],[F(3),3],[F(4),2],[F(5),2],[F(6),1],[F(7),1],[F(1,2),3],[F(1,3),2],[F(1,4),2],[F(1,5),1],[F(2,3),2],[F(3,4),1],[F(3,2),1],[F(5,2),1]];
function fromInterceptRatio(options={}){
 const type=options.type||weighted([['given',6],['point',2],['table',2]]);
 const b=weighted(INTERCEPTS),r=weighted(BASES_3F),eq=expTex(b,r);
 const why=`In ${tex('y=f(x)=(b)(r)^{x}')}, ${tex('b')} is the \\(y\\)-intercept (at ${tex('x=0')}, ${tex('r^{0}=1')}, so ${tex('y=b')}) and ${tex('r')} is the common ratio.`;
 if(type==='table'){
  const values=[0,1,2,3].map(x=>mul(b,pow(r,x)));
  if(values.some(v=>v.d>729||Math.abs(v.n)>20000))return fromInterceptRatio(options);
  return multiInput(`u4-03f-table-${plain(b)}-${plain(r)}`,'table',`The table shows values of an exponential function.${valueTable('\\(x\\)','\\(y\\)',0,values)}Find the \\(y\\)-intercept and the common ratio, and write an explicit equation for the function.`,
   [numberField('intercept','\\(y\\)-intercept',b),numberField('ratio','Common ratio \\(r\\)',r),equationField(b,r)],`\\(y\\)-intercept ${tex(texF(b))}; ${tex(`r=${texF(r)}`)}; ${tex(eq)}`,
   steps(`The \\(y\\)-intercept is the value at ${tex('x=0')}: ${tex(`b=${texF(b)}`)}.`,`Divide each value by the one before it: ${ratioWork(values)}. So ${tex(`r=${texF(r)}`)}.`,why,`The equation is ${tex(eq)}.`));
 }
 const q=type==='point'?`An exponential function has common ratio ${tex(texF(r))} and passes through the point ${tex(`(0,\\ ${texF(b)})`)}. Write an explicit equation for the function.`
  :`The \\(y\\)-intercept is ${tex(texF(b))} and the common ratio is ${tex(texF(r))}. Write an explicit equation for the exponential function.`;
 return multiInput(`u4-03f-${type}-${plain(b)}-${plain(r)}`,type==='point'?'point_on_y_axis':b.n<0?'negative_intercept':isWhole(b)?'given':'fractional_intercept',q,
  [equationField(b,r)],tex(eq),
  steps(type==='point'?`The point ${tex(`(0,\\ ${texF(b)})`)} is on the \\(y\\)-axis, so the \\(y\\)-intercept is ${tex(texF(b))}.`:`The \\(y\\)-intercept is ${tex(`b=${texF(b)}`)} and the common ratio is ${tex(`r=${texF(r)}`)}.`,why,
   `Substitute: ${tex(eq)}.`,`Check: at ${tex('x=0')}, ${tex(`y=${texF(b)}`)}; at ${tex('x=1')}, ${tex(`y=${texF(mul(b,r))}`)}.`));
}
// 3G — Equivalent Explicit Exponential Equations from a Point: two or three different equations for the same function.
function equivalentFromPoint(){
 for(let tries=0;tries<400;tries++){
  const count=random()<.6?2:3,r=weighted([[F(2),5],[F(3),4],[F(1,2),4],[F(1,3),3],[F(1,4),2],[F(4),1],[F(3,2),1]]),h=ri(1,4);
  const k=weighted([[F(pick([1,2,3,4,5,6,8,9,12,16,18,20,24,27,32,36,48,64,81])),8],[F(-pick([1,2,3,4,6,8,9,12])),2],[pick([F(1,2),F(1,3),F(1,4),F(1,8),F(1,9),F(1,16),F(2,3),F(3,4)]),2]]);
  const b=div(k,pow(r,h));
  if(b.d>256||Math.abs(b.n)>2000)continue;
  const third=h>=2?{h:h-1,v:div(k,r)}:{h:h+1,v:mul(k,r)};
  if(third.v.d>256||Math.abs(third.v.n)>2000)continue;
  const forms=[expTex(k,r,h),expTex(b,r,0),expTex(third.v,r,third.h)].slice(0,count),labels=['Equation 1','Equation 2','Equation 3'];
  const fields=forms.map((form,i)=>equationField(b,r,{id:`eq-${i+1}`,labelHtml:`Equation ${i+1}: \\(y=\\)`,answerText:tex(form),distinctFrom:labels.slice(0,i).map((label,j)=>({id:`eq-${j+1}`,label}))}));
  return multiInput(`u4-03g-${h}-${plain(k)}-${plain(r)}-${count}`,count===2?'two_equations':'three_equations',
   `Point: ${tex(`(${h},\\ ${texF(k)})`)}; common ratio ${tex(texF(r))}. Write ${count===2?'two':'three'} different explicit equations that represent the same exponential function.`,
   fields,forms.map(tex).join('; '),
   steps(`Use the point directly. In ${tex(`y=(${texF(k)})\\left(${texF(r)}\\right)^{x-${h}}`)}, the exponent is 0 at ${tex(`x=${h}`)}, so ${tex(`y=${texF(k)}`)} there: ${tex(forms[0])}.`,
    `Find the \\(y\\)-intercept: going back ${h} step${h>1?'s':''} from ${tex(`x=${h}`)} to ${tex('x=0')} divides by ${tex(texF(r))} each time, so ${tex(`b=${texF(k)}\\div ${par(r)}^{${h}}=${texF(b)}`)}: ${tex(expTex(b,r,0))}.`,
    ...(count===3?[`Use another point of the function, ${tex(`(${third.h},\\ ${texF(third.v)})`)}: ${tex(forms[2])}.`]:[]),
    `Every one of these equations gives ${tex(`y=${texF(k)}`)} at ${tex(`x=${h}`)} and multiplies by ${tex(texF(r))} for each step in ${tex('x')}, so they are the same function. Any equivalent equations are correct, as long as they are written differently.`));
 }
 return equivalentFromPoint();
}

// ===================================================== Section 4 =====================================================
// Same-base equations: write the number as a power of the base and set the exponents equal. No logarithms.
// the largest powers in the assignments: 2^10 = 1024, 3^6 = 729, 4^5 = 1024, 5^5 = 3125 (04A, 04D); smaller ones once the
// exponent is an expression or there is a coefficient (04B, 04C)
const POWER_LIMIT={2:10,3:6,4:5,5:5,6:4,7:3,8:4,9:4,10:6},EXPRESSION_LIMIT={2:8,3:5,4:4,5:5,6:3,7:2,8:3,9:3,10:4};
const powerOf=(b,k)=>k>=0?F(b**k):F(1,b**(-k));
function powerStep(b,k){
 if(k===0)return `Write 1 as a power of ${b}: ${tex(`1=${b}^{0}`)} (any nonzero number to the zero power is 1).`;
 if(k===1)return `${tex(`${b}=${b}^{1}`)}.`;
 if(k>0)return `Write ${b**k} as a power of ${b}: ${tex(`${b**k}=${Array(k).fill(b).join('\\cdot ')}=${b}^{${k}}`)}.`;
 return `Write ${tex(texF(powerOf(b,k)))} as a power of ${b}: ${tex(`${texF(powerOf(b,k))}=\\frac{1}{${b}^{${-k}}}=${b}^{${k}}`)} (a negative exponent means the reciprocal).`;
}
const linTex=(m,c)=>`${m===1?'':m===-1?'-':m}x${c>0?`+${c}`:c<0?`-${-c}`:''}`;
const BASES_4=[[2,5],[3,4],[4,3],[5,3],[6,1],[7,1],[8,2],[9,2],[10,2]];
// 4A — Solving Basic Exponential Equations: b^x = b^k, 1/b^k, 1 or b.
function basicExponential(){
 const b=weighted(BASES_4),form=weighted([['power',11],['reciprocal',8],['special',1]]);
 const k=form==='power'?ri(2,POWER_LIMIT[b]):form==='reciprocal'?-ri(1,Math.min(POWER_LIMIT[b],6)):pick([0,1,-1]),N=powerOf(b,k);
 return multiInput(`u4-04a-${b}-${k}`,form==='special'?(k===0?'equals_one':k===1?'equals_base':'reciprocal'):form,`Solve ${tex(`${b}^{x}=${texF(N)}`)}.`,
  [solutionField(F(k))],tex(`x=${k}`),
  steps(powerStep(b,k),`Now both sides are powers of ${b}: ${tex(`${b}^{x}=${b}^{${k}}`)}. Equal powers of the same base have equal exponents, so ${tex(`x=${k}`)}.`,
   `Check: ${tex(`${b}^{${k}}=${texF(N)}`)}.`));
}
// solving m x + c = k (or p x + q = s x + t) in plain steps
function linearSteps(m,c,k){
 const x=F(k-c,m),out=[];
 if(c!==0)out.push(`${c>0?'Subtract':'Add'} ${Math.abs(c)} ${c>0?'from':'to'} both sides: ${tex(`${linTex(m,0)}=${k-c}`)}.`);
 if(m!==1)out.push(`Divide both sides by ${m}: ${tex(`x=${texF(x)}`)}.`);
 if(!out.length)out.push(`So ${tex(`x=${k}`)}.`);
 return out;
}
// 4B — Exponential Equations with Algebraic Exponents.
function algebraicExponents(options={}){
 const form=options.form||weighted([['power',4],['reciprocal',2],['both_sides',3]]);
 for(let tries=0;tries<400;tries++){
  const b=weighted([[2,5],[3,4],[4,2],[5,2],[8,1],[9,1],[10,1]]);
  if(form==='both_sides'){
   const fractional=random()<.15,p=ri(2,9),s=ri(1,p-1),x=fractional?F(pick([1,3,5,7]),p-s):F(ri(-3,6)),q=ri(-9,9);
   if(fractional&&(x.d===1||p-s<2))continue;
   const t=mul(x,F(p-s)).n/mul(x,F(p-s)).d+q;
   if(!Number.isInteger(t)||Math.abs(t)>12||q===t)continue;
   const left=linTex(p,q),right=linTex(s,t);
   return multiInput(`u4-04b-both-${b}-${p}-${q}-${s}-${t}`,'both_sides',`Solve ${tex(`${b}^{${left}}=${b}^{${right}}`)}.`,[solutionField(x)],tex(`x=${texF(x)}`),
    steps(`Both sides are already powers of ${b}, so the exponents are equal: ${tex(`${left}=${right}`)}.`,
     `Subtract ${tex(linTex(s,0))} from both sides: ${tex(`${linTex(p-s,q)}=${t}`)}.`,...linearSteps(p-s,q,t),
     `Check: both exponents equal ${tex(texF(F(p*x.n+q*x.d,x.d)))} when ${tex(`x=${texF(x)}`)}.`));
  }
  const m=weighted([[1,5],[2,3],[3,2],[4,1],[5,1]]),fractional=m>1&&random()<.25;
  const x=fractional?F(pick([1,-1,3,-3,5,7]),m):F(ri(-4,6)),c=ri(-9,9);
  if(x.d===1&&fractional)continue;
  const k=m*x.n/x.d+c;
  if(!Number.isInteger(k)||c===0&&m===1)continue;
  if(form==='power'?(k<2||k>EXPRESSION_LIMIT[b]):(k>-1||k<-Math.min(EXPRESSION_LIMIT[b],5)))continue;
  const N=powerOf(b,k),exponent=linTex(m,c);
  return multiInput(`u4-04b-${form}-${b}-${m}-${c}-${k}`,form==='power'?'power':'reciprocal',`Solve ${tex(`${b}^{${exponent}}=${texF(N)}`)}.`,[solutionField(x)],tex(`x=${texF(x)}`),
   steps(powerStep(b,k),`Now ${tex(`${b}^{${exponent}}=${b}^{${k}}`)}, so the exponents are equal: ${tex(`${exponent}=${k}`)}.`,...linearSteps(m,c,k),
    `Check: ${tex(`${linTex(m,c).replace(/x/,`\\left(${texF(x)}\\right)`)}=${k}`)}, and ${tex(`${b}^{${k}}=${texF(N)}`)}.`));
 }
 return algebraicExponents({form:'power'});
}
// 4C — Exponential Equations with Coefficients: isolate the power first (whole or fractional coefficients).
function withCoefficients(){
 for(let tries=0;tries<400;tries++){
  const b=weighted([[2,5],[3,4],[4,2],[5,3],[6,1],[10,1]]),fractionCoef=random()<.2;
  const a=fractionCoef?pick([F(1,2),F(1,3),F(2,3),F(3,4),F(1,4),F(2,5),F(3,2)]):F(pick([2,3,4,5,6,7,8,9,10,12]));
  const shape=weighted([['x',5],['x+c',3],['mx',1],['mx+c',1]]),m=shape.startsWith('mx')?pick([2,3]):1,c=shape.endsWith('+c')?pick([-3,-2,-1,1,2,3]):0;
  const x=ri(-3,6),k=m*x+c;
  if(k>EXPRESSION_LIMIT[b]||k<-4||(k<0&&random()<.5&&!fractionCoef)||(k>=0&&k<2&&random()<.7))continue;
  const N=powerOf(b,k),M=mul(a,N);
  if(M.d>1000||M.n>50000)continue;
  const exponent=linTex(m,c),aTex=isWhole(a)?String(a.n):texF(a);
  return multiInput(`u4-04c-${plain(a)}-${b}-${m}-${c}-${x}`,fractionCoef?'fraction_coefficient':k<0?'negative_exponent':'whole_coefficient',
   `Solve ${tex(`${aTex}\\cdot ${b}^{${exponent}}=${texF(M)}`)}.`,[solutionField(F(x))],tex(`x=${x}`),
   steps(`Isolate the power first. ${isWhole(a)?`Divide both sides by ${a.n}`:`Multiply both sides by ${tex(texF(div(F(1),a)))}, the reciprocal of ${tex(texF(a))}`}: ${tex(`${b}^{${exponent}}=${texF(M)}\\div ${par(a)}=${texF(N)}`)}.`,
    powerStep(b,k),`Set the exponents equal: ${tex(`${exponent}=${k}`)}.`,...(exponent==='x'?[]:linearSteps(m,c,k)),
    `Check: ${tex(`${aTex}\\cdot ${b}^{${k}}=${aTex}\\cdot ${par(N)}=${texF(M)}`)}.`));
 }
 return withCoefficients();
}

// ===================================================== reviews and the registry =====================================================
const SECTION_LESSONS={
 a:lessonGenerators,
 b:{'writing-recursive-formulas':writingRecursive,'using-recursive-formulas':usingRecursive,'recursive-formulas-from-tables-and-contexts':tablesAndContexts},
 c:{'writing-explicit-formulas':writingExplicit,'converting-recursive-to-explicit':recursiveToExplicit,'converting-explicit-to-recursive':explicitToRecursive,
  'explicit-formulas-from-tables-and-terms':explicitFromTablesTerms,'exponential-growth-and-decay-models':growthDecayModels,
  'writing-exponential-equations-from-y-intercept-and-common-ratio':fromInterceptRatio,'writing-equivalent-explicit-exponential-equations-from-a-point':equivalentFromPoint},
 d:{'solving-basic-exponential-equations':basicExponential,'solving-exponential-equations-with-algebraic-exponents':algebraicExponents,'solving-exponential-equations-with-coefficients':withCoefficients}
};
// The mixed proportions of reviews 02D (8 : 8 : 8), 03H (4 : 4 : 4 : 4 : 5 : 5 : 6) and 04D (8 : 12 : 8).
const SECTION_WEIGHTS={b:[8,8,8],c:[4,4,4,4,5,5,6],d:[8,12,8]};
function reviewOf(key){
 const lessons=SECTION_LESSONS[key],weights=Object.keys(lessons).map((slug,i)=>[slug,SECTION_WEIGHTS[key][i]]);
 return(options={})=>{const mode=options.mode;return lessons[mode&&lessons[mode]?mode:weighted(weights)]();};
}
const sectionReviews={a:sectionReview,b:reviewOf('b'),c:reviewOf('c'),d:reviewOf('d')};
// The Unit 4 Comprehensive Review: the whole unit in the proportions of 05A and 05B (12 : 12 : 19 : 12 problems by
// section), or one section.
const UNIT_WEIGHTS=[['section-1',12],['section-2',12],['section-3',19],['section-4',12]],UNIT_SECTIONS={'section-1':'a','section-2':'b','section-3':'c','section-4':'d'};
function unitReview(options={}){const mode=options.mode;return sectionReviews[UNIT_SECTIONS[UNIT_SECTIONS[mode]?mode:weighted(UNIT_WEIGHTS)]]();}

const REVIEW_SLUGS={a:'section-a-review',b:'section-b-review',c:'section-c-review',d:'section-d-review'};
const allLessons=Object.assign({},...Object.values(SECTION_LESSONS));
const generators={...allLessons,...Object.fromEntries(Object.entries(REVIEW_SLUGS).map(([key,slug])=>[slug,sectionReviews[key]])),'comprehensive-review':unitReview};

global.BatchMathIM1Unit4Generators={
 get:slug=>generators[slug],
 list:()=>Object.keys(generators),
 lessons:allLessons,
 sections:Object.fromEntries(Object.entries(SECTION_LESSONS).map(([key,lessons])=>[key,Object.keys(lessons)])),
 reviews:{...REVIEW_SLUGS,unit:'comprehensive-review'},
 checkField,
 qa:{F,mul,div,value,plain,texF,termsOf,growthFactor,growthWordProblem,findingTerms,usingRecursive,tablesAndContexts,explicitFromTablesTerms,growthDecayModels,fromInterceptRatio,algebraicExponents,
  mathText,readEquation,canonical,SECTION_WEIGHTS,UNIT_WEIGHTS}
};
})(window);
