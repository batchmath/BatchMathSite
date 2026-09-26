(function(){'use strict';

  const ri=(a,b)=>Math.floor(BatchMathRNG.random()*(b-a+1))+a;
  const pick=a=>a[Math.floor(BatchMathRNG.random()*a.length)];
  const nonzero=(a,b)=>{let n=0;while(n===0)n=ri(a,b);return n;};
  const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};
  const rat=(n,d=1)=>{if(d<0){n=-n;d=-d}const g=gcd(n,d);return {kind:"rat",n:n/g,d:d/g}};
  const dne=()=>({kind:"dne"});
  const inf=s=>({kind:"inf",sign:s<0?-1:1});
  const texRat=a=>a.kind==="exact"?a.tex:(a.kind==="rat"?(a.d===1?String(a.n):`\\frac{${a.n}}{${a.d}}`):(a.kind==="dne"?"\\text{DNE}":(a.sign<0?"-\\infty":"\\infty")));
  const textRat=a=>a.kind==="rat"?(a.d===1?String(a.n):`${a.n}/${a.d}`):(a.kind==="dne"?"DNE":(a.sign<0?"-infinity":"infinity"));
  const sgnTerm=(c,term,first=false)=>{
    if(c===0)return "";
    const abs=Math.abs(c), coeff=(abs===1&&term)?"":String(abs);
    const core=coeff+term;
    if(first)return (c<0?"-":"")+core;
    return (c<0?" - ":" + ")+core;
  };
  const lin=(a,b)=>sgnTerm(a,"x",true)+sgnTerm(b,"",false);
  const xPow=p=>p===1?"x":`x^{${p}}`;
  const absXPow=p=>p===1?"|x|":`|x|^{${p}}`;
  const mono=(c,p)=>sgnTerm(c,xPow(p),true);
  const trigArg=k=>k===1?"x":`${k}x`;
  const quadFromRoots=(r,s)=>{
    const B=-(r+s), C=r*s;
    return "x^2"+sgnTerm(B,"x",false)+sgnTerm(C,"",false);
  };
  const shifted=(x,a)=>a===0?x:(a>0?`${x}-${a}`:`${x}+${-a}`);
  const reciprocalConst=n=>n<0?`-\\frac1{${-n}}`:`\\frac1{${n}}`;
  const reciprocalDifference=(left,n)=>n<0?`${left}+\\frac1{${-n}}`:`${left}-\\frac1{${n}}`;
  const cleanSigns=s=>{
    let out=String(s);
    // Normalize only constant negative denominators. Do not pull a leading
    // minus out of a multi-term denominator; doing so would require flipping
    // every remaining term and can change the displayed mathematics.
    out=out.replace(/\\frac1\{-([0-9]+)\}/g,'-\\frac1{$1}');
    out=out.replace(/\\frac\{([^{}]+)\}\{-([0-9]+)\}/g,'-\\frac{$1}{$2}');
    for(let i=0;i<3;i++)out=out.replace(/-\s*-/g,"+").replace(/\+\s*-/g,"-").replace(/\+\s*\+/g,"+");
    return out.replace(/\^\{1\}/g,"").replace(/\^1(?!\d)/g,"");
  };
  const removeUnitCoefficients=s=>String(s??'').replace(/(^|[^0-9])1(?=x(?:\^\{?\d+\}?|\b)|\\sqrt)/g,'$1');
  const cleanProblem=p=>({...p,q:removeUnitCoefficients(p.q),sol:removeUnitCoefficients(p.sol)});
  let infinityDirBag=[];
  function nextInfinityDirection(){
    if(!infinityDirBag.length){
      infinityDirBag=BatchMathRNG.random()<0.5?[false,true]:[true,false];
    }
    return infinityDirBag.shift();
  }

  function infinityLimit(forcedType,forcedNeg){
    const type=forcedType||(BatchMathRNG.random()<.5?ri(4,14):pick([1,2,3,15,16,17,18,19,20,21,22,23,24]));
    const negDir=forcedNeg===undefined?nextInfinityDirection():forcedNeg,dir=negDir?'-\\infty':'\\infty';
    const dirSign=negDir?-1:1;
    if(type===23){
      const n=ri(2,6),A=ri(1,9),B=nonzero(-5,5),C=ri(1,8),positive=Math.sign(B)*(negDir&&n%2?-1:1)>0;
      return {cat:'infinity',id:`i23-log-zero-${n}-${A}-${B}-${C}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}}\\ln\\left(\\frac{${A}}{${mono(B,n)}+${C}}\\right)\\)`,ans:positive?inf(-1):{kind:'dne'},sol:`The denominator is dominated by \\(${mono(B,n)}\\), which tends to ${positive?'positive':'negative'} infinity in this direction. Thus the inner quotient tends to \\(0^{${positive?'+':'-'}}\\). ${positive?'For positive inputs approaching zero, the natural logarithm decreases without bound. The limit is \\(-\\infty\\); substituting zero into the logarithm is not valid.':'The inner quotient is negative for all sufficiently large inputs in this direction. A real logarithm requires a positive argument, so the function has no real values arbitrarily far in this direction. The requested real limit is DNE.'}`};
    }
    if(type===24){
      const m=ri(1,3),gap=ri(1,3),A=nonzero(-5,5),B=ri(1,7),C=nonzero(-5,5),D=ri(1,7),positive=Math.sign(A*C)*(negDir&&gap%2?-1:1)>0;
      return {cat:'infinity',id:`i24-log-ratio-zero-${m}-${gap}-${A}-${B}-${C}-${D}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}}\\ln\\left(\\frac{${mono(A,m)}+${B}}{${mono(C,m+gap)}+${D}}\\right)\\)`,ans:positive?inf(-1):{kind:'dne'},sol:`The denominator has ${gap} more power${gap===1?'':'s'} of x than the numerator, so the inner fraction tends to zero. Its eventual sign is the sign of \\(\\frac{${A}}{${C}x^{${gap}}}\\), which is ${positive?'positive':'negative'} in this direction. ${positive?'The argument approaches \\(0^+\\), so its natural logarithm tends to \\(-\\infty\\).':'The argument approaches \\(0^-\\). It is eventually negative, outside the real logarithm domain. Therefore the requested real limit is DNE.'}`};
    }

    if(type===1){
      const n=ri(2,6),A=nonzero(-8,8),B=nonzero(-8,8),C=ri(-15,15),D=ri(-15,15),E=ri(-10,10),F=ri(-12,12),a=rat(A,B);
      return {cat:"infinity",id:`i1-${n}-${A}-${B}-${C}-${D}-${E}-${F}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{${mono(A,n)}${sgnTerm(C,"x",false)}${sgnTerm(D,"",false)}}{${mono(B,n)}${sgnTerm(E,"x",false)}${sgnTerm(F,"",false)}}\\)`,ans:a,sol:`Divide numerator and denominator by \\(${xPow(n)}\\). Every lower-degree term approaches \\(0\\), leaving the ratio of leading coefficients \\(${texRat(a)}\\).`};
    }
    if(type===2){
      const n=ri(1,4),gap=ri(1,3),A=nonzero(-8,8),B=nonzero(-8,8),C=ri(-12,12),D=ri(-12,12);
      return {cat:"infinity",id:`i2-${n}-${gap}-${A}-${B}-${C}-${D}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{${mono(A,n)}${sgnTerm(C,"",false)}}{${mono(B,n+gap)}${sgnTerm(D,"",false)}}\\)`,ans:rat(0),sol:`Divide both parts by \\(x^{${n+gap}}\\):<br>\\(\\frac{${A}/x^{${gap}}+(${C})/x^{${n+gap}}}{${B}+(${D})/x^{${n+gap}}}\\).<br>The numerator tends to \\(0\\) and the denominator tends to \\(${B}\\ne0\\), so the limit is \\(0\\).`};
    }
    if(type===3){
      const n=ri(1,4),A=nonzero(-6,6),B=nonzero(-7,7),C=ri(-12,12),D=ri(-12,12);
      const sign=(A*B>0?1:-1)*dirSign;
      return {cat:"infinity",id:`i3-${n}-${A}-${B}-${C}-${D}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{${mono(A,n+1)}${sgnTerm(C,"x",false)}}{${mono(B,n)}${sgnTerm(D,"",false)}}\\)`,ans:inf(sign),sol:`The quotient has the same end behavior as \\(\\frac{${A}}{${B}}x\\). In the stated direction that expression tends to \\(${sign>0?'\\infty':'-\\infty'}\\).`};
    }
    if(type===4){
      const k=ri(2,9),B=nonzero(-14,14),C=ri(-18,18),m=nonzero(-8,8),n=ri(-10,10),a=rat(dirSign*k,m);
      return {cat:"infinity",id:`i4-radquad-over-lin-${k}-${B}-${C}-${m}-${n}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{\\sqrt{${k*k}x^2${sgnTerm(B,'x',false)}${sgnTerm(C,'',false)}}}{${lin(m,n)}}\\)`,ans:a,sol:`Factor \\(x^2\\) from the radical. Since \\(\\sqrt{x^2}=|x|\\), the leading ratio is \\(\\frac{${k}|x|}{${m}x}\\). Using \\(|x|/x\\to${dirSign}\\) gives \\(${texRat(a)}\\).`};
    }
    if(type===5){
      const k=ri(2,9),B=nonzero(-14,14),C=ri(-18,18),m=nonzero(-8,8),n=ri(-10,10),a=rat(dirSign*m,k);
      return {cat:"infinity",id:`i5-lin-over-radquad-${k}-${B}-${C}-${m}-${n}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{${lin(m,n)}}{\\sqrt{${k*k}x^2${sgnTerm(B,'x',false)}${sgnTerm(C,'',false)}}}\\)`,ans:a,sol:`Factor \\(x^2\\) from the radical and use \\(\\sqrt{x^2}=|x|\\):<br>\\(\\frac{${m}x+(${n})}{|x|\\sqrt{${k*k}+(${B})/x+(${C})/x^2}}\\).<br>Since \\(x/|x|\\to${dirSign}\\) and \\(${n}/|x|\\to0\\), the limit is \\(\\frac{${m}(${dirSign})}{${k}}=${texRat(a)}\\).`};
    }
    if(type===6){
      const k=ri(2,9),m=ri(2,9),B=nonzero(-12,12),C=ri(-16,16),D=nonzero(-12,12),E=ri(-16,16),a=rat(k,m);
      return {cat:"infinity",id:`i6-radquad-ratio-${k}-${m}-${B}-${C}-${D}-${E}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{\\sqrt{${k*k}x^2${sgnTerm(B,'x',false)}${sgnTerm(C,'',false)}}}{\\sqrt{${m*m}x^2${sgnTerm(D,'x',false)}${sgnTerm(E,'',false)}}}\\)`,ans:a,sol:`Factor \\(x^2\\) inside both radicals and cancel \\(|x|\\):<br>\\(\\frac{\\sqrt{${k*k}+(${B})/x+(${C})/x^2}}{\\sqrt{${m*m}+(${D})/x+(${E})/x^2}}\\longrightarrow\\frac{${k}}{${m}}=${texRat(a)}\\).`};
    }
    if(type===7){
      const k=ri(1,8),B=nonzero(-16,16),C=ri(-20,20),a=rat(dirSign*B,2*k),join=negDir?'+':'-';
      return {cat:"infinity",id:`i7-conjugate-${k}-${B}-${C}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\left(\\sqrt{${k*k}x^2${sgnTerm(B,'x',false)}${sgnTerm(C,'',false)}} ${join} ${k}x\\right)\\)`,ans:a,sol:`Multiply by the conjugate:<br>\\(\\sqrt{${k*k}x^2+(${B})x+(${C})}${join}${k}x=\\frac{${B}x+(${C})}{\\sqrt{${k*k}x^2+(${B})x+(${C})}${negDir?"-":"+"}${k}x}\\).<br>Divide both parts by \\(|x|\\). Since \\(x/|x|\\to${dirSign}\\), the numerator tends to \\(${B}(${dirSign})\\) and the denominator to \\(${k}+${k}=${2*k}\\). The limit is \\(${texRat(a)}\\).`};
    }
    if(type===8){
      const k=ri(1,8),B=nonzero(-16,16),C=ri(-20,20),a=rat(2*k,dirSign*B),join=negDir?'+':'-';
      return {cat:"infinity",id:`i8-recip-conjugate-${k}-${B}-${C}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{1}{\\sqrt{${k*k}x^2${sgnTerm(B,'x',false)}${sgnTerm(C,'',false)}} ${join} ${k}x}\\)`,ans:a,sol:`Rationalize the denominator:<br>\\(\\frac1{\\sqrt{${k*k}x^2+(${B})x+(${C})}${join}${k}x}=\\frac{\\sqrt{${k*k}x^2+(${B})x+(${C})}${negDir?"-":"+"}${k}x}{${B}x+(${C})}\\).<br>Divide both parts by \\(|x|\\). The numerator tends to \\(${2*k}\\) and the denominator to \\(${B}(${dirSign})\\ne0\\), giving \\(${texRat(a)}\\).`};
    }
    if(type===9){
      const k=ri(2,9),B=nonzero(-14,14),C=ri(-18,18),A=nonzero(-7,7),D=ri(-10,10);
      return {cat:"infinity",id:`i9-radquad-over-quad-${k}-${B}-${C}-${A}-${D}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{\\sqrt{${k*k}x^2${sgnTerm(B,'x',false)}${sgnTerm(C,'',false)}}}{${mono(A,2)}${sgnTerm(D,'',false)}}\\)`,ans:rat(0),sol:`Divide both parts by \\(x^2\\), using \\(\\sqrt{x^2}=|x|\\):<br>\\(\\frac{\\sqrt{${k*k}+(${B})/x+(${C})/x^2}}{|x|(${A}+(${D})/x^2)}\\).<br>The radical tends to \\(${k}\\), the parenthesis to \\(${A}\\ne0\\), and \\(1/|x|\\to0\\). Hence the limit is \\(0\\).`};
    }
    if(type===10){
      const k=ri(2,9),B=nonzero(-14,14),C=ri(-18,18),A=nonzero(-7,7),D=ri(-10,10),sign=A>0?1:-1;
      return {cat:"infinity",id:`i10-quad-over-radquad-${k}-${B}-${C}-${A}-${D}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{${mono(A,2)}${sgnTerm(D,'',false)}}{\\sqrt{${k*k}x^2${sgnTerm(B,'x',false)}${sgnTerm(C,'',false)}}}\\)`,ans:inf(sign),sol:`The quotient behaves like \\(\\frac{${A}x^2}{${k}|x|}=${texRat(rat(A,k))}|x|\\). Its magnitude grows without bound with sign determined by \\(${A}\\).`};
    }
    if(type===11){
      const A=ri(1,9),B=ri(-12,18),m=nonzero(-8,8),n=ri(-10,10),rad=negDir?lin(-A,B):lin(A,B);
      return {cat:"infinity",id:`i11-radlin-over-lin-${A}-${B}-${m}-${n}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{\\sqrt{${rad}}}{${lin(m,n)}}\\)`,ans:rat(0),sol:`In this direction the radicand is \\(${A}|x|+(${B})\\). Factor the leading powers to obtain<br>\\(\\frac{\\sqrt{${A}+(${B})/|x|}}{\\sqrt{|x|}(${m}x/|x|+(${n})/|x|)}\\).<br>The numerator tends to \\(\\sqrt{${A}}\\), the last parenthesis to \\(${m*dirSign}\\ne0\\), and \\(1/\\sqrt{|x|}\\to0\\), giving limit \\(0\\).`};
    }
    if(type===12){
      const A=ri(1,9),B=ri(-12,18),m=nonzero(-8,8),n=ri(-10,10),rad=negDir?lin(-A,B):lin(A,B),sign=m*dirSign>0?1:-1;
      return {cat:"infinity",id:`i12-lin-over-radlin-${A}-${B}-${m}-${n}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{${lin(m,n)}}{\\sqrt{${rad}}}\\)`,ans:inf(sign),sol:`In this direction, factor the radicand as \\(|x|(${A}+(${B})/|x|)\\). The quotient becomes<br>\\(\\sqrt{|x|}\\frac{${m}x/|x|+(${n})/|x|}{\\sqrt{${A}+(${B})/|x|}}\\).<br>The fraction tends to \\(\\frac{${m*dirSign}}{\\sqrt{${A}}}\\), a ${sign>0?"positive":"negative"} number, while \\(\\sqrt{|x|}\\to\\infty\\). Thus the limit is ${sign>0?"positive":"negative"} infinity.`};
    }
    if(type===13){
      const A=ri(1,9),B=ri(-10,16),k=ri(2,8),C=nonzero(-12,12),D=ri(-16,16),radLin=negDir?lin(-A,B):lin(A,B);
      return {cat:"infinity",id:`i13-radlin-over-radquad-${A}-${B}-${k}-${C}-${D}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{\\sqrt{${radLin}}}{\\sqrt{${k*k}x^2${sgnTerm(C,'x',false)}${sgnTerm(D,'',false)}}}\\)`,ans:rat(0),sol:`Factor the leading powers from the radicals:<br>\\(\\frac1{\\sqrt{|x|}}\\frac{\\sqrt{${A}+(${B})/|x|}}{\\sqrt{${k*k}+(${C})/x+(${D})/x^2}}\\).<br>The radical ratio tends to \\(\\sqrt{${A}}/${k}\\), while \\(1/\\sqrt{|x|}\\to0\\). The limit is \\(0\\).`};
    }
    if(type===14){
      const A=ri(1,9),B=ri(-10,16),k=ri(2,8),C=nonzero(-12,12),D=ri(-16,16),radLin=negDir?lin(-A,B):lin(A,B);
      return {cat:"infinity",id:`i14-radquad-over-radlin-${A}-${B}-${k}-${C}-${D}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{\\sqrt{${k*k}x^2${sgnTerm(C,'x',false)}${sgnTerm(D,'',false)}}}{\\sqrt{${radLin}}}\\)`,ans:inf(1),sol:`Factor the leading powers from the radicals:<br>\\(\\sqrt{|x|}\\frac{\\sqrt{${k*k}+(${C})/x+(${D})/x^2}}{\\sqrt{${A}+(${B})/|x|}}\\).<br>The radical ratio tends to the positive number \\(${k}/\\sqrt{${A}}\\), while \\(\\sqrt{|x|}\\to\\infty\\). Thus the limit is \\(\\infty\\).`};
    }
    if(type===15){
      const n=ri(1,7),base=pick([2,3,5]),coef=ri(1,5);
      return {cat:"infinity",id:`i15-poly-exp-${n}-${base}-${coef}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\frac{${coef===1?'':coef}${xPow(n)}}{${base}^{|x|}}\\)`,ans:rat(0),sol:`Let \\(t=|x|\\), so \\(t\\to\\infty\\). The absolute value of the quotient is \\(\\frac{${coef}t^{${n}}}{${base}^t}\\). Exponential growth with base \\(${base}>1\\) outpaces this fixed polynomial power, so that positive ratio tends to \\(0\\). The original quotient therefore also tends to \\(0\\).`};
    }
    if(type===16){
      const n=pick([2,3,4]),A=ri(1,8),B=nonzero(-12,12),C=ri(1,16),pow=2*n;
      return {cat:"infinity",id:`i16-logpoly-${pow}-${A}-${B}-${C}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\ln\\left(${mono(A,pow)}${sgnTerm(B,'x^2',false)}${sgnTerm(C,'',false)}\\right)\\)`,ans:inf(1),sol:`The expression inside the logarithm is eventually positive and grows without bound in either direction. Therefore its natural logarithm approaches \\(\\infty\\).`};
    }
    if(type===17){
      const n=pick([1,2,3]),A=ri(1,7),B=ri(1,10),C=ri(1,14),pow=2*n;
      return {cat:"infinity",id:`i17-logrecip-${pow}-${A}-${B}-${C}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\ln\\left(\\frac{1}{${mono(A,pow)}+${B}x^2+${C}}\\right)\\)`,ans:inf(-1),sol:`The positive fraction inside the logarithm approaches \\(0^+\\). Hence the logarithm approaches \\(-\\infty\\).`};
    }
    if(type===18){
      const k=ri(2,9),B=nonzero(-14,14),C=ri(-18,18);
      return {cat:"infinity",id:`i18-lograd-${k}-${B}-${C}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\ln\\left(\\sqrt{${k*k}x^2${sgnTerm(B,'x',false)}${sgnTerm(C,'',false)}}\\right)\\)`,ans:inf(1),sol:`The radical behaves like \\(${k}|x|\\) and grows without bound while remaining positive. Its natural logarithm therefore approaches \\(\\infty\\).`};
    }
    if(type===19){
      const lo=pick([2,4]),hi=lo+pick([2,4]),A=ri(1,6),B=ri(1,10),C=ri(1,6),D=ri(1,10);
      return {cat:"infinity",id:`i19-logratio-${hi}-${lo}-${A}-${B}-${C}-${D}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} \\ln\\left(\\frac{${mono(A,hi)}+${B}}{${mono(C,lo)}+${D}}\\right)\\)`,ans:inf(1),sol:`The inner rational expression has leading behavior \\(\\frac{${A}}{${C}}x^{${hi-lo}}\\). Its coefficient is positive and its power is even, so it tends to \\(+\\infty\\) in the requested direction and is eventually positive. Its logarithm therefore tends to \\(+\\infty\\).`};
    }
    if(type===20){
      const n=ri(1,4),A=ri(1,6),B=ri(-10,10),C=ri(-10,10),sgn=pick([-1,1]),lead=sgn*A,innerSign=sgn*(negDir&&n%2===1?-1:1),ans=innerSign>0?inf(1):rat(0),lower=n===1?sgnTerm(C,'',false):sgnTerm(B,'x',false)+sgnTerm(C,'',false);
      return {cat:"infinity",id:`i20-exp-poly-${n}-${lead}-${B}-${C}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} e^{${mono(lead,n)}${lower}}\\)`,ans,sol:`The exponent has leading term \\(${mono(lead,n)}\\). In the requested direction, \\(x^{${n}}\\) is ${negDir&&n%2===1?"negative":"positive"} with unbounded magnitude. Multiplying by \\(${lead}\\) makes the exponent tend to ${innerSign>0?"positive":"negative"} infinity, so the exponential tends to ${innerSign>0?"positive infinity":"zero"}.`};
    }
    if(type===21){
      const n=ri(1,4),A=nonzero(-6,6),B=nonzero(-7,7),C=ri(-10,10),D=ri(-10,10),linearSign=(A*B>0?1:-1)*dirSign,ans=linearSign>0?inf(1):rat(0);
      return {cat:"infinity",id:`i21-exp-rat-${n}-${A}-${B}-${C}-${D}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} e^{\\frac{${mono(A,n+1)}${sgnTerm(C,'',false)}}{${mono(B,n)}${sgnTerm(D,'',false)}}}\\)`,ans,sol:`The rational exponent behaves like \\(\\frac{${A}}{${B}}x\\), which approaches \\(${linearSign>0?'\\infty':'-\\infty'}\\). Thus the exponential approaches \\(${linearSign>0?'\\infty':'0'}\\).`};
    }
    const A=ri(1,10),B=ri(1,12),C=ri(1,15);
    return {cat:"infinity",id:`i22-exp-small-${A}-${B}-${C}-${negDir}`,q:`\\(\\displaystyle \\lim_{x\\to${dir}} e^{\\frac{${A}}{${B}x^2+${C}}}\\)`,ans:rat(1),sol:`The exponent approaches \\(0\\). By continuity of the exponential function, the limit is \\(e^0=1\\).`};
  }
  window.BMUnit1InfinityLegacy={generate:(...args)=>cleanProblem(infinityLimit(...args)),resetDirections:()=>{infinityDirBag=[];},removeUnitCoefficients};
})();
