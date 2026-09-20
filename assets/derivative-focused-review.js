/* Focused combinations for the Derivatives Comprehensive Review. */
(function(){
 'use strict';
 const rand=(a,b)=>a+Math.floor(BatchMathRNG.random()*(b-a+1));
 const choose=xs=>xs[Math.floor(BatchMathRNG.random()*xs.length)];
 function makeChain(kind,mk){
  const a=rand(2,4),b=rand(2,7),u=`${a}x+${b}`,ue=`(${a}*x+${b})`;
  let id,math,expr,tex,reason;
  if(kind==='power'){
   const n=choose([2,3,4,-1,-2]);id=`power-${n}`;
   math=`f(x)=(${u})^{${n}}`;
   expr=`${a*n}*${ue}^(${n-1})`;
   tex=n<0?`\\frac{${Math.abs(a*n)}}{(${u})^{${1-n}}}`:`${a*n}(${u})^{${n-1}}`;
   if(n<0)tex='-'+tex;
   reason=`The outer function is a power: differentiate it, then multiply by the derivative ${a} of the inside.`;
  }else if(kind==='radical'){
   id='sqrt';math=`f(x)=\\sqrt{${u}}`;
   expr=`${a}/(2*sqrt(${ue}))`;tex=`\\frac{${a}}{2\\sqrt{${u}}}`;
   reason=`Treat the square root as a power of 1/2, then multiply by the inside derivative ${a}.`;
  }else if(kind==='reciprocal'){
   const n=rand(1,3),c=rand(2,6);id=`recip-${c}-${n}`;
   math=`f(x)=\\frac{${c}}{(${u})^{${n}}}`;
   expr=`-${a*n*c}/${ue}^(${n+1})`;tex=`-\\frac{${a*n*c}}{(${u})^{${n+1}}}`;
   reason=`Rewrite the reciprocal as ${c}(${u})^{-${n}}, then apply the power and chain rules.`;
  }else if(kind==='trig'){
   const f=choose(['sin','cos','tan','sec','csc','cot']);id=f;
   const outer={sin:[`\\sin(${u})`,`cos(${ue})`,`\\cos(${u})`],cos:[`\\cos(${u})`,`-sin(${ue})`,`-\\sin(${u})`],tan:[`\\tan(${u})`,`sec(${ue})^2`,`\\sec^2(${u})`],sec:[`\\sec(${u})`,`sec(${ue})*tan(${ue})`,`\\sec(${u})\\tan(${u})`],csc:[`\\csc(${u})`,`-csc(${ue})*cot(${ue})`,`-\\csc(${u})\\cot(${u})`],cot:[`\\cot(${u})`,`-csc(${ue})^2`,`-\\csc^2(${u})`]}[f];
   math=`f(x)=${outer[0]}`;expr=`${a}*(${outer[1]})`;tex=`${a}\\left(${outer[2]}\\right)`;
   reason=`Differentiate the ${f} outer function, keep its argument ${u}, and multiply by the inside derivative ${a}.`;
  }else if(kind==='exponential'){
   const base=choose(['e',2,3,5]);id=String(base);
   math=`f(x)=${base}^{${u}}`;
   expr=base==='e'?`${a}*e^${ue}`:`${a}*ln(${base})*${base}^${ue}`;
   tex=base==='e'?`${a}e^{${u}}`:`${a}\\ln(${base})\\,${base}^{${u}}`;
   reason=`Differentiate the exponential with its original exponent, then multiply by the exponent's derivative ${a}${base==='e'?'':` and by \\(\\ln ${base}\\)`}.`;
  }else if(kind==='logarithmic'){
   const base=choose(['e',2,3,5]);id=String(base);
   math=base==='e'?`f(x)=\\ln(${u})`:`f(x)=\\log_{${base}}(${u})`;
   expr=base==='e'?`${a}/${ue}`:`${a}/(${ue}*ln(${base}))`;
   tex=base==='e'?`\\frac{${a}}{${u}}`:`\\frac{${a}}{(${u})\\ln ${base}}`;
   reason=`Differentiate the argument (${a}), then divide by the argument${base==='e'?'':` and by \\(\\ln ${base}\\)`}.`;
  }else if(kind==='inverse_trig'){
   const f=choose(['asin','acos','atan','acot','asec','acsc']);id=f;
   if(f==='asin'||f==='acos'){
    const d=rand(10,13),v=`(${u})/${d}`;
    math=`f(x)=\\${f==='asin'?'sin':'cos'}^{-1}\\left(\\frac{${u}}{${d}}\\right)`;
    expr=`${f==='acos'?'-':''}${a}/(${d}*sqrt(1-(${v})^2))`;
    tex=`${f==='acos'?'-':''}\\frac{${a}}{${d}\\sqrt{1-(\\frac{${u}}{${d}})^2}}`;
   }else if(f==='atan'||f==='acot'){
    math=`f(x)=\\${f==='atan'?'tan':'cot'}^{-1}(${u})`;
    expr=`${f==='acot'?'-':''}${a}/(1+${ue}^2)`;
    tex=`${f==='acot'?'-':''}\\frac{${a}}{1+(${u})^2}`;
   }else{
    const v=`${a}x+${rand(6,9)}`,ve=`(${v.replace('x','*x')})`;
    math=`f(x)=\\${f==='asec'?'sec':'csc'}^{-1}(${v})`;
    expr=`${f==='acsc'?'-':''}${a}/(abs(${ve})*sqrt(${ve}^2-1))`;
    tex=`${f==='acsc'?'-':''}\\frac{${a}}{|${v}|\\sqrt{(${v})^2-1}}`;
   }
   reason=`Use the inverse ${f.slice(1)} derivative with its full argument, then multiply by the argument's derivative ${a}.`;
  }else throw Error(`Unknown review focus ${kind}`);
  return mk('chain',`review-chain-${kind}-${id}-${a}-${b}`,'Find the derivative.',math,expr,tex,`${reason} Hence \\(f'(x)=${tex}\\).`);
 }
 window.BatchMathDerivativeFocusedReview={makeChain};
})();
