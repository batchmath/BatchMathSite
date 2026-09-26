(function(){'use strict';
const R=()=>window.BatchMathRNG.random(),ri=(a,b)=>Math.floor(R()*(b-a+1))+a,pick=a=>a[ri(0,a.length-1)];
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a)||1;
const rat=(n,d=1)=>{if(d<0){n=-n;d=-d;}const g=gcd(n,d);return{kind:'rat',n:n/g,d:d/g};};
const inf=sign=>({kind:'inf',sign:sign<0?-1:1}),dne=()=>({kind:'dne'}),exact=(value,tex)=>({kind:'exact',value,tex});
const directionBags=new Map();
function direction(key){let bag=directionBags.get(key);if(!bag||!bag.length){bag=R()<.5?[false,true]:[true,false];directionBags.set(key,bag);}return bag.shift();}
const dirTex=n=>n?'-\\infty':'\\infty';
const base=(id,group,n,q,ans,sol,extra={})=>({cat:'infinity',id:`${id}-${n}`,infinityGroup:group,approachDirection:n?'negative':'positive',q:`\\(\\displaystyle\\lim_{x\\to${dirTex(n)}}${q}\\)`,ans,sol,...extra});
const ansTex=a=>a.kind==='rat'?(a.d===1?String(a.n):`\\frac{${a.n}}{${a.d}}`):a.kind==='inf'?(a.sign<0?'-\\infty':'\\infty'):a.kind==='exact'?a.tex:'\\text{DNE}';

function plainLegacy(p){
 const a=ansTex(p.ans),id=p.id;
 if(/^i1-/.test(id))p.sol=`The numerator and denominator have the same highest power of x. Divide both by that power. Every smaller term goes to 0, so only the leading coefficients remain and the limit is \\(${a}\\).`;
 else if(/^i2-/.test(id))p.sol=`The denominator has the higher power of x, so it grows faster than the numerator. The fraction therefore approaches \\(0\\).`;
 else if(/^i3-/.test(id))p.sol=`After canceling the common power of x, the expression behaves like a constant times x. Following that sign toward the stated end gives \\(${a}\\).`;
 else if(/^i4-/.test(id))p.sol=`Inside the square root, the \\(x^2\\) term controls the end behavior. Pulling it out gives \\(\\sqrt{x^2}=|x|\\), not x. Compare \\(|x|\\) with the linear denominator; the limit is \\(${a}\\).`;
 else if(/^i5-/.test(id))p.sol=`The square root in the denominator grows like a positive constant times \\(|x|\\). Compare the linear numerator with \\(|x|\\). The sign changes at negative infinity because \\(x/|x|=-1\\) there, giving \\(${a}\\).`;
 else if(/^i6-/.test(id))p.sol=`The top square root grows like its leading coefficient times \\(|x|\\), and so does the bottom square root. The \\(|x|\\) factors cancel, leaving \\(${a}\\).`;
 else if(/^i7-|^i8-/.test(id))p.sol=`Multiply by the conjugate. The square-root terms then simplify to an ordinary polynomial expression. Keep \\(\\sqrt{x^2}=|x|\\) when taking the end limit; the result is \\(${a}\\).`;
 else if(/^i9-|^i11-|^i13-/.test(id))p.sol=`The denominator grows faster than the numerator. After dividing out the largest common power, a factor tending to 0 remains, so the limit is \\(0\\).`;
 else if(/^i10-|^i12-|^i14-/.test(id))p.sol=`The numerator grows faster than the denominator. The remaining growing factor and its sign give the limit \\(${a}\\).`;
 else if(/^i15-/.test(id))p.sol=`Write \\(t=|x|\\). An exponential \\(b^t\\) grows faster than any fixed power \\(t^n\\), so the quotient approaches \\(0\\).`;
 else if(/^i16-/.test(id))p.sol=`The expression inside the logarithm becomes positive and grows without bound. Therefore the logarithm also grows without bound, so the limit is \\(\\infty\\).`;
 else if(/^i17-/.test(id))p.sol=`The positive fraction inside the logarithm approaches \\(0^+\\). Since \\(\\ln u\\to-\\infty\\) as \\(u\\to0^+\\), the limit is \\(-\\infty\\).`;
 else if(/^i18-/.test(id))p.sol=`The square root is positive and grows like a constant times \\(|x|\\), so it approaches \\(\\infty\\). Its logarithm therefore approaches \\(\\infty\\).`;
 else if(/^i19-/.test(id))p.sol=`Inside the logarithm, the numerator has the higher power and the fraction becomes positive and grows without bound. Therefore the logarithm approaches \\(\\infty\\).`;
 else if(/^i20-|^i21-/.test(id))p.sol=`First find the limit of the exponent. It approaches ${p.ans.kind==='rat'?'negative infinity':'positive infinity'}. Then use \\(e^u\\): it approaches 0 when \\(u\\to-\\infty\\) and grows without bound when \\(u\\to\\infty\\). The limit is \\(${a}\\).`;
 else if(/^i22-/.test(id))p.sol=`The exponent approaches \\(0\\). Therefore the whole expression approaches \\(e^0=1\\).`;
 else if(/^i23-|^i24-/.test(id))p.sol=p.ans.kind==='dne'?`The expression inside the logarithm approaches 0 through negative values. A real logarithm is not defined for negative inputs, so the function has no real values far enough in this direction. The limit is DNE.`:`The expression inside the logarithm stays positive and approaches \\(0^+\\). Therefore the logarithm approaches \\(-\\infty\\).`;
 return p;
}

function rational(legacy){
 const useLegacy=legacy&&R()<.72,type=useLegacy?pick([1,2,3]):'cube',n=direction(`rational:${type}`);
 if(useLegacy)return tag(plainLegacy(legacy(type,n)),'rational',n);
 const a=pick([2,3,5,6,7,10]),b=pick([2,3,4,5,7]);
 return base(`ix-cuberoot-${a}-${b}`,'rational',n,`\\frac{\\sqrt[3]{${a}x^3+5x}}{${b}x-1}`,exact(Math.cbrt(a)/b,`\\frac{\\sqrt[3]{${a}}}{${b}}`),`The cube root grows like \\(\\sqrt[3]{${a}}x\\), and the denominator grows like \\(${b}x\\). The x factors cancel at either end, leaving \\(\\frac{\\sqrt[3]{${a}}}{${b}}\\).`);
}

function quadraticLinearRadicals(legacy){
 const type=R()<.5?4:5,n=direction(`radicals:quadratic-linear:${type}`);
 if(legacy)return tag(plainLegacy(legacy(type,n)),'radicals',n,{radicalStructure:'quadratic-linear',infinityVariant:type===4?'sqrt-quadratic-over-linear':'linear-over-sqrt-quadratic'});
 const k=ri(2,9),m=pick([-7,-5,-3,-2,2,3,5,7]),B=pick([-13,-9,-5,5,9,13]),C=ri(-15,15);
 if(type===4)return base(`ix-radquad-over-lin-${k}-${m}-${B}-${C}`,'radicals',n,`\\frac{\\sqrt{${k*k}x^2${B>0?'+':''}${B}x${C?C>0?`+${C}`:C:''}}}{${m}x${C>=0?'+1':'-1'}}`,rat((n?-1:1)*k,m),`The square root grows like \\(${k}|x|\\), while the denominator grows like \\(${m}x\\). Since \\(|x|/x\\) is 1 at positive infinity and -1 at negative infinity, the limit is \\(${ansTex(rat((n?-1:1)*k,m))}\\).`,{radicalStructure:'quadratic-linear',infinityVariant:'sqrt-quadratic-over-linear'});
 return base(`ix-lin-over-radquad-${k}-${m}-${B}-${C}`,'radicals',n,`\\frac{${m}x${C>=0?'+1':'-1'}}{\\sqrt{${k*k}x^2${B>0?'+':''}${B}x${C?C>0?`+${C}`:C:''}}}`,rat((n?-1:1)*m,k),`The denominator grows like \\(${k}|x|\\), while the numerator grows like \\(${m}x\\). Since \\(x/|x|\\) is 1 at positive infinity and -1 at negative infinity, the limit is \\(${ansTex(rat((n?-1:1)*m,k))}\\).`,{radicalStructure:'quadratic-linear',infinityVariant:'linear-over-sqrt-quadratic'});
}

function otherRadicals(legacy){
 const type=pick([6,7,8,9,10,11,12,13,14]),n=direction(`radicals:other:${type}`);
 if(legacy)return tag(plainLegacy(legacy(type,n)),'radicals',n,{radicalStructure:'other',infinityVariant:'other-radical-power'});
 return radicals();
}

function radicals(legacy){
 const complex=R()<.125;
 if(complex){
  const kind=pick(['legacy','legacy','exact']),type=pick([6,7,8,13,14]),n=direction(`radicals:complex:${kind==='exact'?'exact':type}`);
  if(kind==='legacy'&&legacy)return tag(plainLegacy(legacy(type,n)),'radicals',n,{radicalStructure:'complex'});
  const a=pick([2,3,5,6,7]),b=pick([2,3,5,6,7]);
  return base(`ix-rad-nonsquare-${a}-${b}`,'radicals',n,`\\frac{\\sqrt{${a}x^2+3x}}{\\sqrt{${b}x^2-5x+1}}`,exact(Math.sqrt(a/b),`\\sqrt{\\frac{${a}}{${b}}}`),`The top square root grows like \\(\\sqrt{${a}}|x|\\), and the bottom one grows like \\(\\sqrt{${b}}|x|\\). The \\(|x|\\) factors cancel, leaving \\(\\sqrt{\\frac{${a}}{${b}}}\\).`,{radicalStructure:'complex'});
 }
 const type=pick([4,5,9,10,11,12]),n=direction(`radicals:simple:${type}`);
 if(legacy)return tag(plainLegacy(legacy(type,n)),'radicals',n,{radicalStructure:'single'});
 const k=ri(2,8),m=pick([-5,-3,-2,2,3,5]);
 return base(`ix-rad-single-${k}-${m}`,'radicals',n,`\\frac{\\sqrt{${k*k}x^2+3x+1}}{${m}x+2}`,rat((n?-1:1)*k,m),`The square root grows like \\(${k}|x|\\), while the denominator grows like \\(${m}x\\). At this end, \\(|x|/x\\to${n?'-1':'1'}\\), so the limit is \\(${ansTex(rat((n?-1:1)*k,m))}\\).`,{radicalStructure:'single'});
}

function logarithmic(legacy){
 const type=pick([16,16,17,17,17,18,19,23,24]),n=direction(`explog:log:${type}`),variant=[17,23,24].includes(type)?'log-reciprocal':'log-composition';
 if(legacy)return tag(plainLegacy(legacy(type,n)),'explog',n,{infinityVariant:variant,expLogKind:'logarithmic'});
 const p=pick([2,4,6]),c=pick([2,3,5,7]);
 return base(`ix-ln-constant-over-${p}-${c}`,'explog',n,`\\ln\\left(\\frac{${c}}{x^{${p}}+1}\\right)`,inf(-1),`The fraction inside the logarithm is positive and approaches \\(0^+\\). Therefore its logarithm approaches \\(-\\infty\\).`,{infinityVariant:'log-reciprocal',expLogKind:'logarithmic'});
}

function exponentialComposition(legacy){
 const type=pick([20,20,21,21,22]),n=direction(`explog:exp:${type}`);
 if(legacy)return tag(plainLegacy(legacy(type,n)),'explog',n,{infinityVariant:'exp-composition',expLogKind:'exponential'});
 const p=pick([2,3,4]),positive=R()<.5,sign=positive?1:-1;
 return base(`ix-exp-power-${sign}-${p}`,'explog',n,`e^{${sign<0?'-':''}x^{${2*p}}}`,positive?inf(1):rat(0),`The exponent approaches \\(${positive?'\\infty':'-\\infty'}\\). Therefore the exponential approaches \\(${positive?'\\infty':'0'}\\).`,{infinityVariant:'exp-composition',expLogKind:'exponential'});
}

function expLog(legacy){return R()<.5?logarithmic(legacy):exponentialComposition(legacy);}

function growth(){
 const family=ri(1,6),n=direction(`growth:${family}`),p=pick([12,20,35,50,64]),b=pick([2,3,5]);
 if(family===1)return base(`ix-growth-exp-over-poly-${b}-${p}`,'growth',n,`\\frac{${b}^{x}}{x^{${p}}}`,n?rat(0):inf(1),n?`As \\(x\\to-\\infty\\), \\(${b}^x\\to0\\) while the polynomial grows in size. The quotient approaches \\(0\\).`:`An exponential grows faster than any fixed power of x. The numerator wins, so the limit is \\(\\infty\\).`,{growthFamily:'exponential-vs-polynomial'});
 if(family===2){const sign=n&&p%2?-1:1;return base(`ix-growth-poly-over-exp-${b}-${p}`,'growth',n,`\\frac{x^{${p}}}{${b}^{x}}`,n?inf(sign):rat(0),n?`As \\(x\\to-\\infty\\), the denominator approaches \\(0^+\\). The numerator is ${sign<0?'negative':'positive'} and grows in size, so the quotient approaches \\(${sign<0?'-':''}\\infty\\).`:`The exponential denominator grows faster than the polynomial numerator, so the limit is \\(0\\).`,{growthFamily:'polynomial-vs-exponential'});}
 if(family===3){const root=pick([3,4,5]);return base(`ix-growth-log-over-root-${root}`,'growth',n,`\\frac{\\ln(x^2+1)}{(x^2+1)^{\\frac{1}{${root}}}}`,rat(0),`Let \\(t=x^2+1\\). Then \\(t\\to\\infty\\), and the root power grows faster than \\(\\ln t\\). Therefore the limit is \\(0\\).`,{growthFamily:'logarithm-vs-root'});}
 if(family===4){const power=pick([3,4,5,6]),sign=n&&power%2?-1:1;return base(`ix-growth-poly-over-root-${power}`,'growth',n,`\\frac{x^{${power}}}{\\sqrt{x^2+1}}`,inf(sign),`The denominator grows like \\(|x|\\), so the expression behaves like \\(x^{${power}}/|x|\\). This grows without bound with a ${sign<0?'negative':'positive'} sign, giving \\(${sign<0?'-':''}\\infty\\).`,{growthFamily:'polynomial-vs-root'});}
 if(family===5)return base(`ix-growth-root-over-log-${p}`,'growth',n,`\\frac{\\sqrt{x^2+1}}{\\ln(x^2+2)}`,inf(1),`The numerator grows like \\(|x|\\), which is faster than a logarithm. The quotient stays positive and grows without bound, so the limit is \\(\\infty\\).`,{growthFamily:'root-vs-logarithm'});
 const power=pick([2,3,4,5]),sign=n&&power%2?-1:1;
 return base(`ix-growth-poly-over-log-${power}`,'growth',n,`\\frac{x^{${power}}}{\\ln(x^2+2)}`,inf(sign),`A polynomial grows faster than a logarithm. The denominator is positive, so the sign comes from \\(x^{${power}}\\). The limit is \\(${sign<0?'-':''}\\infty\\).`,{growthFamily:'polynomial-vs-logarithm'});
}

function oscillation(){const vanish=R()<.5,n=direction(`oscillation:${vanish?'vanish':'dne'}`);return vanish?base('ix-osc-vanish','oscillation',n,'\\frac{\\sin x}{\\sqrt{|x|}}',rat(0),'The sine factor always stays between -1 and 1, while the denominator grows without bound. The whole fraction is squeezed to 0.',{infinityVariant:'oscillation'}):base('ix-osc-dne','oscillation',n,'\\sin x',dne(),`As x continues toward ${n?'negative':'positive'} infinity, \\(\\sin x\\) keeps cycling through values from -1 to 1. It never approaches one number, so the limit is DNE.`,{infinityVariant:'oscillation'});}

function tag(p,group,n,extra={}){return{...p,infinityGroup:group,approachDirection:n?'negative':'positive',...extra};}
function generate(group='mixed',legacy){
 if(group==='mixed'){
  const r=R();
  if(r<.20)return quadraticLinearRadicals(legacy);
  if(r<.25)return otherRadicals(legacy);
  if(r<.50)return growth();
  if(r<.70)return logarithmic(legacy);
  if(r<.90)return exponentialComposition(legacy);
  if(r<.95)return rational(legacy);
  return oscillation();
 }
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

window.BMUnit1InfinityExpansions={generate,endBehavior,asymptote:endBehavior,weights:{rational:.05,radicals:.25,explog:.40,growth:.25,oscillation:.05},mixedBreakdown:{quadraticLinearRadicals:.20,otherRadicals:.05,growth:.25,logarithmic:.20,exponential:.20,rational:.05,oscillation:.05}};
})();
