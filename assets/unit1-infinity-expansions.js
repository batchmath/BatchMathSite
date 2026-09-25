(function(){'use strict';
const R=()=>window.BatchMathRNG.random(),ri=(a,b)=>Math.floor(R()*(b-a+1))+a,pick=a=>a[ri(0,a.length-1)];
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a)||1;
const rat=(n,d=1)=>{if(d<0){n=-n;d=-d;}const g=gcd(n,d);return{kind:'rat',n:n/g,d:d/g};};
const inf=sign=>({kind:'inf',sign:sign<0?-1:1}),dne=()=>({kind:'dne'}),exact=(value,tex)=>({kind:'exact',value,tex});
const directionBags=new Map();
function direction(key){let bag=directionBags.get(key);if(!bag||!bag.length){bag=R()<.5?[false,true]:[true,false];directionBags.set(key,bag);}return bag.shift();}
const dirTex=n=>n?'-\\infty':'\\infty';
const base=(id,group,n,q,ans,sol,extra={})=>({cat:'infinity',id:`${id}-${n}`,infinityGroup:group,approachDirection:n?'negative':'positive',q:`\\(\\displaystyle\\lim_{x\\to${dirTex(n)}}${q}\\)`,ans,sol,...extra});

function rational(legacy){
 const useLegacy=legacy&&R()<.72,type=useLegacy?pick([1,2,3]):'cube',n=direction(`rational:${type}`);
 if(useLegacy)return tag(legacy(type,n),'rational',n);
 const a=pick([2,3,5,6,7,10]),b=pick([2,3,4,5,7]);
 return base(`ix-cuberoot-${a}-${b}`,'rational',n,`\\frac{\\sqrt[3]{${a}x^3+5x}}{${b}x-1}`,exact(Math.cbrt(a)/b,`\\frac{\\sqrt[3]{${a}}}{${b}}`),`Factor \\(x^3\\) inside the cube root. Because \\(\\sqrt[3]{x^3}=x\\) at both ends, the quotient tends to \\(\\sqrt[3]{${a}}/${b}\\).`);
}

function radicals(legacy){
 const complex=R()<.125;
 if(complex){
  const kind=pick(['legacy','legacy','exact']),type=pick([6,7,8,13,14]),n=direction(`radicals:complex:${kind==='exact'?'exact':type}`);
  if(kind==='legacy'&&legacy)return tag(legacy(type,n),'radicals',n,{radicalStructure:'complex'});
  const a=pick([2,3,5,6,7]),b=pick([2,3,5,6,7]);
  return base(`ix-rad-nonsquare-${a}-${b}`,'radicals',n,`\\frac{\\sqrt{${a}x^2+3x}}{\\sqrt{${b}x^2-5x+1}}`,exact(Math.sqrt(a/b),`\\sqrt{\\frac{${a}}{${b}}}`),`Factor \\(x^2\\) from both radicals. Each contributes \\(|x|\\), which cancels, leaving the exact limit \\(\\sqrt{${a}/${b}}\\). This remains valid at negative infinity because \\(\\sqrt{x^2}=|x|\\), not x.`,{radicalStructure:'complex'});
 }
 const type=pick([4,5,9,10,11,12]),n=direction(`radicals:simple:${type}`);
 if(legacy)return tag(legacy(type,n),'radicals',n,{radicalStructure:'single'});
 const k=ri(2,8),m=pick([-5,-3,-2,2,3,5]);
 return base(`ix-rad-single-${k}-${m}`,'radicals',n,`\\frac{\\sqrt{${k*k}x^2+3x+1}}{${m}x+2}`,rat((n?-1:1)*k,m),`Factor \\(x^2\\) inside the radical and use \\(\\sqrt{x^2}=|x|\\). Then \\(|x|/x\\to${n?'-1':'1'}\\), which gives the stated signed ratio.`,{radicalStructure:'single'});
}

function expLog(legacy){
 const roll=R();let type,variant;
 if(roll<.30){type=pick([17,17,23,23,24]);variant='log-reciprocal';}
 else if(roll<.57){type=pick([20,21,22]);variant='exp-composition';}
 else if(roll<.80){type=pick([16,18,19]);variant='log-composition';}
 else type='added',variant='added-exp-log';
 const n=direction(`explog:${type}`);
 if(type!=='added'&&legacy)return tag(legacy(type,n),'explog',n,{infinityVariant:variant});
 if(R()<.5)return base('ix-ln-added','explog',n,'\\ln(2+e^x)',n?exact(Math.log(2),'\\ln 2'):inf(1),n?'Since \\(e^x\\to0\\), continuity of the logarithm gives the exact limit \\(\\ln2\\).':'The exponential term grows without bound, so \\(\\ln(2+e^x)\\to\\infty\\).',{infinityVariant:variant});
 const p=pick([2,4,6]),c=pick([2,3,5,7]);
 return base(`ix-ln-constant-over-${p}-${c}`,'explog',n,`\\ln\\left(\\frac{${c}}{x^{${p}}+1}\\right)`,inf(-1),`The denominator is positive and unbounded, so the logarithm's argument approaches \\(0^+\\). Therefore the limit is \\(-\\infty\\); zero is not substituted into the logarithm.`,{infinityVariant:'log-reciprocal'});
}

function growth(){
 const family=ri(1,6),n=direction(`growth:${family}`),p=pick([12,20,35,50,64]),b=pick([2,3,5]);
 const hierarchy='For unbounded positive inputs, exponential growth dominates polynomial growth, polynomial growth dominates root growth, and every positive power dominates logarithmic growth.';
 if(family===1)return base(`ix-growth-exp-over-poly-${b}-${p}`,'growth',n,`\\frac{${b}^{x}}{x^{${p}}}`,n?rat(0):inf(1),n?`Here \\(${b}^x\\to0^+\\) while the polynomial has unbounded magnitude, so the quotient tends to zero. ${hierarchy}`:`The numerator is exponential and the denominator is a fixed polynomial power. ${hierarchy} Hence the limit is \\(\\infty\\).`,{growthFamily:'exponential-vs-polynomial'});
 if(family===2){const sign=n&&p%2?-1:1;return base(`ix-growth-poly-over-exp-${b}-${p}`,'growth',n,`\\frac{x^{${p}}}{${b}^{x}}`,n?inf(sign):rat(0),n?`As \\(x\\to-\\infty\\), the denominator tends to \\(0^+\\), while \\(x^{${p}}\\) has ${sign<0?'negative':'positive'} unbounded sign. The quotient tends to \\(${sign<0?'-':''}\\infty\\). ${hierarchy}`:`The exponential denominator outgrows the fixed polynomial numerator, so the limit is zero. ${hierarchy}`,{growthFamily:'polynomial-vs-exponential'});}
 if(family===3){const root=pick([3,4,5]);return base(`ix-growth-log-over-root-${root}`,'growth',n,`\\frac{\\ln(x^2+1)}{(x^2+1)^{1/${root}}}`,rat(0),`Let \\(t=x^2+1\\to\\infty\\). A positive fractional power of t outgrows \\(\\ln t\\), so the quotient tends to zero. ${hierarchy}`,{growthFamily:'logarithm-vs-root'});}
 if(family===4){const power=pick([3,4,5,6]),sign=n&&power%2?-1:1;return base(`ix-growth-poly-over-root-${power}`,'growth',n,`\\frac{x^{${power}}}{\\sqrt{x^2+1}}`,inf(sign),`Use \\(\\sqrt{x^2}=|x|\\). The expression behaves like \\(x^{${power}}/|x|\\); its magnitude grows without bound and its sign is ${sign<0?'negative':'positive'} at the requested end. ${hierarchy}`,{growthFamily:'polynomial-vs-root'});}
 if(family===5)return base(`ix-growth-root-over-log-${p}`,'growth',n,`\\frac{\\sqrt{x^2+1}}{\\ln(x^2+2)}`,inf(1),`Both numerator and denominator grow, but the numerator behaves like \\(|x|\\), a positive power. Positive powers outgrow logarithms, so the quotient tends to \\(\\infty\\). ${hierarchy}`,{growthFamily:'root-vs-logarithm'});
 const power=pick([2,3,4,5]),sign=n&&power%2?-1:1;
 return base(`ix-growth-poly-over-log-${power}`,'growth',n,`\\frac{x^{${power}}}{\\ln(x^2+2)}`,inf(sign),`The denominator is positive and grows logarithmically, while the polynomial magnitude grows much faster. The sign comes from \\(x^{${power}}\\), so the limit is \\(${sign<0?'-':''}\\infty\\). ${hierarchy}`,{growthFamily:'polynomial-vs-logarithm'});
}

function oscillation(){const vanish=R()<.5,n=direction(`oscillation:${vanish?'vanish':'dne'}`);return vanish?base('ix-osc-vanish','oscillation',n,'\\frac{\\sin x}{\\sqrt{|x|}}',rat(0),'The numerator is bounded by 1 in absolute value while the denominator grows without bound. Squeeze gives zero. This is oscillation as x itself becomes unbounded, not finite-point \\(\\sin(1/x)\\).',{infinityVariant:'oscillation'}):base('ix-osc-dne','oscillation',n,'\\sin x',dne(),'Along sequences tending to the requested infinity, \\(\\sin x\\) repeatedly equals 1 and -1. Those different subsequential values prove that the limit is DNE.',{infinityVariant:'oscillation'});}

function tag(p,group,n,extra={}){return{...p,infinityGroup:group,approachDirection:n?'negative':'positive',...extra};}
function generate(group='mixed',legacy){
 if(group==='mixed'){const r=R();group=r<.175?'rational':r<.425?'radicals':r<.75?'explog':r<.95?'growth':'oscillation';}
 if(group==='rational')return rational(legacy);
 if(group==='radicals')return radicals(legacy);
 if(group==='explog')return expLog(legacy);
 if(group==='growth')return growth();
 if(group==='oscillation')return oscillation();
 return rational(legacy);
}

function endBehavior(){
 const type=ri(1,5),forms=[
  {f:'\\frac{2x+1}{\\sqrt{x^2+4}}',l:'-2',r:'2',ha:'\\(y=-2\\) and \\(y=2\\)',why:'Use \\(\\sqrt{x^2}=|x|\\): \\(x/|x|\\) tends to -1 on the left and 1 on the right.'},
  {f:'e^x',l:'0',r:'\\infty',ha:'\\(y=0\\)',why:'Only the negative-end limit is finite.'},
  {f:'\\frac{x^2+1}{x^2+3}',l:'1',r:'1',ha:'\\(y=1\\)',why:'Both end limits equal the ratio of leading coefficients.'},
  {f:'\\ln(2+e^x)',l:'\\ln 2',r:'\\infty',ha:'\\(y=\\ln2\\)',why:'At the negative end, \\(e^x\\to0\\); at the positive end, the logarithm grows without bound.'},
  {f:'\\frac{3^x}{1+3^x}',l:'0',r:'1',ha:'\\(y=0\\) and \\(y=1\\)',why:'Use \\(3^x\\to0\\) at the negative end and divide by \\(3^x\\) at the positive end.'}
 ][type-1];
 const good=`<span class="end-choice"><span>Left end: \\(\\displaystyle ${forms.l}\\)</span><span>Right end: \\(\\displaystyle ${forms.r}\\)</span><span>Horizontal asymptote${forms.ha.includes(' and ')?'s':''}: ${forms.ha}</span></span>`;
 return{cat:'infinity',id:`ix-end-behavior-${type}`,infinityGroup:'endbehavior',q:`<div class="end-behavior-question"><div class="question-prompt">Find both end limits, then identify every horizontal asymptote.</div><div class="end-function">\\(\\displaystyle f(x)=${forms.f}\\)</div></div>`,choicesHtml:true,choices:[good,`<span class="end-choice"><span>Left end: \\(\\displaystyle ${forms.r}\\)</span><span>Right end: \\(\\displaystyle ${forms.l}\\)</span><span>No horizontal asymptote</span></span>`,`<span class="end-choice"><span>Both end limits are DNE</span><span>No horizontal asymptote</span></span>`],correctIndex:0,sol:`${forms.why} A horizontal asymptote occurs at each finite end limit, so the horizontal asymptote result is ${forms.ha}.`};
}

window.BMUnit1InfinityExpansions={generate,endBehavior,asymptote:endBehavior,weights:{rational:.175,radicals:.25,explog:.325,growth:.20,oscillation:.05}};
})();
