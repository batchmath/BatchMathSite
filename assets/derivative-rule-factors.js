/* Factor catalog shared by the Product Rule, Quotient Rule, and Derivatives Review. */
(function(){
  'use strict';
  const choose=xs=>xs[Math.floor(BatchMathRNG.random()*xs.length)];
  const integer=(a,b)=>a+Math.floor(BatchMathRNG.random()*(b-a+1));
  const nz=(a,b)=>{let x;do{x=integer(a,b)}while(!x);return x};
  const texTerm=(c,part)=>c===1?part:c===-1?`-${part}`:`${c}${part}`;
  const linear=(a,b)=>`${a===1?'':a===-1?'-':a}x${b<0?`-${-b}`:`+${b}`}`;
  function positiveInner(){
    const a=nz(-3,3),c=a*a+integer(3,8),quartic=BatchMathRNG.random()<.5;
    if(quartic)return {id:`q4_${a}_${c}`,tex:`x^{4}${a<0?`-${-a}x^{2}`:`+${a}x^{2}`}+${c}`,expr:`x^4+(${a})*x^2+${c}`,dtex:`4x^3${a<0?`-${-2*a}x`:`+${2*a}x`}`,dexpr:`4*x^3+(${2*a})*x`};
    return {id:`q2_${a}_${c}`,tex:`x^{2}${a<0?`-${-a}x`:`+${a}x`}+${c}`,expr:`x^2+(${a})*x+${c}`,dtex:`2x${a<0?`-${-a}`:`+${a}`}`,dexpr:`2*x+(${a})`};
  }
  function factor(kind){
    let k=integer(2,5),c=integer(2,7),a=nz(-4,4),b=integer(2,5);
    if(kind==='polynomial'){
      const n=integer(2,4),constant=choose([0,0,integer(2,8)]),t=constant?`${texTerm(a,`x^{${n}}`)}+${constant}`:texTerm(a,`x^{${n}}`);
      return {id:`p${a}_${n}_${constant}`,tex:t,expr:`(${a})*x^${n}+(${constant})`,dtex:texTerm(a*n,n===2?'x':`x^{${n-1}}`),dexpr:`(${a*n})*x^${n-1}`};
    }
    if(kind==='reciprocal'){const n=integer(1,3),power=n===1?'x':`x^{${n}}`;return{id:`r${a}_${n}`,tex:`\\frac{${a}}{${power}}`,expr:`(${a})/x^${n}`,dtex:`\\frac{${-a*n}}{x^{${n+1}}}`,dexpr:`(${-a*n})/x^${n+1}`}}
    if(kind==='radical'){const u=positiveInner();return{id:`s${u.id}`,tex:`\\sqrt{${u.tex}}`,expr:`sqrt(${u.expr})`,dtex:`\\frac{${u.dtex}}{2\\sqrt{${u.tex}}}`,dexpr:`(${u.dexpr})/(2*sqrt(${u.expr}))`};}
    if(kind==='cuberoot'){const u=positiveInner();return{id:`cube${u.id}`,tex:`\\sqrt[3]{${u.tex}}`,expr:`(${u.expr})^(1/3)`,dtex:`\\frac{${u.dtex}}{3(${u.tex})^{2/3}}`,dexpr:`(${u.dexpr})/(3*(${u.expr})^(2/3))`};}
    if(kind==='fractional'){const [n,d]=choose([[3,2],[2,3],[5,2],[-1,2]]);return{id:`f${n}_${d}`,tex:`x^{\\frac{${n}}{${d}}}`,expr:`x^(${n}/${d})`,dtex:`\\frac{${n}}{${d}}x^{\\frac{${n-d}}{${d}}}`,dexpr:`(${n}/${d})*x^((${n-d})/${d})`}}
    if(kind==='sin')return{id:`sin${k}`,tex:`\\sin(${k}x)`,expr:`sin(${k}*x)`,dtex:`${k}\\cos(${k}x)`,dexpr:`${k}*cos(${k}*x)`};
    if(kind==='cos')return{id:`cos${k}`,tex:`\\cos(${k}x)`,expr:`cos(${k}*x)`,dtex:`-${k}\\sin(${k}x)`,dexpr:`-${k}*sin(${k}*x)`};
    if(kind==='tan')return{id:`tan${k}`,tex:`\\tan(${k}x)`,expr:`tan(${k}*x)`,dtex:`${k}\\sec^{2}(${k}x)`,dexpr:`${k}*sec(${k}*x)^2`};
    if(kind==='sec')return{id:`sec${k}`,tex:`\\sec(${k}x)`,expr:`sec(${k}*x)`,dtex:`${k}\\sec(${k}x)\\tan(${k}x)`,dexpr:`${k}*sec(${k}*x)*tan(${k}*x)`};
    if(kind==='csc')return{id:`csc${k}`,tex:`\\csc(${k}x)`,expr:`csc(${k}*x)`,dtex:`-${k}\\csc(${k}x)\\cot(${k}x)`,dexpr:`-${k}*csc(${k}*x)*cot(${k}*x)`};
    if(kind==='cot')return{id:`cot${k}`,tex:`\\cot(${k}x)`,expr:`cot(${k}*x)`,dtex:`-${k}\\csc^{2}(${k}x)`,dexpr:`-${k}*csc(${k}*x)^2`};
    if(kind==='ln'){const u=positiveInner();return{id:`ln${u.id}`,tex:`\\ln(${u.tex})`,expr:`ln(${u.expr})`,dtex:`\\frac{${u.dtex}}{${u.tex}}`,dexpr:`(${u.dexpr})/(${u.expr})`};}
    if(kind==='logbase'){const u=positiveInner();return{id:`log${b}_${u.id}`,tex:`\\log_{${b}}(${u.tex})`,expr:`ln(${u.expr})/ln(${b})`,dtex:`\\frac{${u.dtex}}{(${u.tex})\\ln ${b}}`,dexpr:`(${u.dexpr})/((${u.expr})*ln(${b}))`};}
    if(kind==='exp')return{id:`exp${k}`,tex:`e^{${k}x}`,expr:`e^(${k}*x)`,dtex:`${k}e^{${k}x}`,dexpr:`${k}*e^(${k}*x)`};
    if(kind==='baseexp')return{id:`base${b}_${k}`,tex:`${b}^{${k}x}`,expr:`${b}^(${k}*x)`,dtex:`${k}\\ln(${b})\\,${b}^{${k}x}`,dexpr:`${k}*ln(${b})*${b}^(${k}*x)`};
    if(kind==='asin'){k=integer(6,9);return{id:`asin${k}`,tex:`\\sin^{-1}\\!\\left(\\frac{x}{${k}}\\right)`,expr:`asin(x/${k})`,dtex:`\\frac{1}{${k}\\sqrt{1-(x/${k})^{2}}}`,dexpr:`1/(${k}*sqrt(1-(x/${k})^2))`}}
    if(kind==='acos'){k=integer(6,9);return{id:`acos${k}`,tex:`\\cos^{-1}\\!\\left(\\frac{x}{${k}}\\right)`,expr:`acos(x/${k})`,dtex:`-\\frac{1}{${k}\\sqrt{1-(x/${k})^{2}}}`,dexpr:`-1/(${k}*sqrt(1-(x/${k})^2))`}}
    if(kind==='atan')return{id:`atan${k}`,tex:`\\tan^{-1}\\!\\left(\\frac{x}{${k}}\\right)`,expr:`atan(x/${k})`,dtex:`\\frac{${k}}{x^{2}+${k*k}}`,dexpr:`${k}/(x^2+${k*k})`};
    if(kind==='acot')return{id:`acot${k}`,tex:`\\cot^{-1}\\!\\left(\\frac{x}{${k}}\\right)`,expr:`acot(x/${k})`,dtex:`-\\frac{${k}}{x^{2}+${k*k}}`,dexpr:`-${k}/(x^2+${k*k})`};
    if(kind==='asec')return{id:`asec${c}`,tex:`\\sec^{-1}(x^{2}+${c})`,expr:`asec(x^2+${c})`,dtex:`\\frac{2x}{(x^{2}+${c})\\sqrt{(x^{2}+${c})^{2}-1}}`,dexpr:`2*x/((x^2+${c})*sqrt((x^2+${c})^2-1))`};
    if(kind==='acsc')return{id:`acsc${c}`,tex:`\\csc^{-1}(x^{2}+${c})`,expr:`acsc(x^2+${c})`,dtex:`-\\frac{2x}{(x^{2}+${c})\\sqrt{(x^{2}+${c})^{2}-1}}`,dexpr:`-2*x/((x^2+${c})*sqrt((x^2+${c})^2-1))`};
    throw Error(`Unknown derivative factor ${kind}`);
  }
  // Each pairing ensures the named family actually appears. Order is varied in
  // quotient questions so it can occur in the numerator or denominator.
  const pairs=[
    ['polynomial','polynomial'],['polynomial','reciprocal'],['polynomial','radical'],
    ['cuberoot','polynomial'],['cuberoot','sin'],['cot','cuberoot'],['fractional','polynomial'],['fractional','sin'],['reciprocal','exp'],
    ['sin','cos'],['tan','polynomial'],['sec','ln'],['csc','exp'],['cot','radical'],
    ['ln','polynomial'],['ln','sin'],['logbase','polynomial'],['logbase','cos'],
    ['exp','polynomial'],['exp','ln'],['baseexp','polynomial'],['baseexp','sin'],
    ['asin','polynomial'],['asin','exp'],['acos','ln'],['acos','sin'],
    ['atan','polynomial'],['atan','logbase'],['atan','baseexp'],
    ['acot','polynomial'],['asec','sin'],['acsc','exp']
  ];
  function make(kind,mk,allowedKinds){
    const pool=allowedKinds?pairs.filter(([left,right])=>allowedKinds.includes(left)&&allowedKinds.includes(right)):pairs;
    if(!pool.length)throw Error('No derivative factor pairs available for this practice stage');
    let [left,right]=choose(pool);
    if(kind==='quotient'&&BatchMathRNG.random()<.5)[left,right]=[right,left];
    const u=factor(left),v=factor(right);
    if(kind==='quotient')for(const f of [u,v]){
      // Avoid a stacked fraction inside another fraction in question text.
      if(/^r-?\d+_\d+$/.test(f.id)){
        const match=f.id.match(/^r(-?\d+)_(\d+)$/),coefficient=Number(match[1]),power=Number(match[2]);
        f.tex=texTerm(coefficient,power===1?'x^{-1}':`x^{-${power}}`);
      }
      f.tex=f.tex.replace(/\\left\(\\frac\{x\}\{(\d+)\}\\right\)/g,'(x/$1)');
    }
    const ue=`(${u.expr})`,ve=`(${v.expr})`,up=`(${u.dexpr})`,vp=`(${v.dexpr})`;
    const ans=kind==='product'?`${up}*${ve}+${ue}*${vp}`:`(${up}*${ve}-${ue}*${vp})/(${ve}^2)`;
    const uT=`\\left(${u.tex}\\right)`,vT=`\\left(${v.tex}\\right)`,upT=`\\left(${u.dtex}\\right)`,vpT=`\\left(${v.dtex}\\right)`;
    const tex=kind==='product'?`${upT}${vT}+${uT}${vpT}`:`\\frac{${upT}${vT}-${uT}${vpT}}{${vT}^{2}}`;
    const math=kind==='product'?`f(x)=${uT}${vT}`:`f(x)=\\frac{${u.tex}}{${v.tex}}`;
    const identity=kind==='product'?`u'v+uv'`:`\\frac{u'v-uv'}{v^{2}}`;
    const explanation=`Let \\(u=${u.tex}\\) and \\(v=${v.tex}\\). Then \\(u'=${u.dtex}\\) and \\(v'=${v.dtex}\\). Substitute these into \\(f'=${identity}\\) to obtain \\(f'(x)=${tex}\\).`;
    const p=mk(kind,`${kind==='product'?'pa':'qa'}-wide-${u.id}-${v.id}`,'Find the derivative.',math,ans,tex,explanation);
    p.factorKinds=[left,right];
    p.factorExpressions=[u.expr,v.expr];
    return p;
  }
  window.BatchMathDerivativeRuleFactors={make,types:[...new Set(pairs.flat())]};
})();
