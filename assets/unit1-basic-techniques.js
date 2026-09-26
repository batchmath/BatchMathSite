(function(){'use strict';
  const ri=(a,b)=>Math.floor(BatchMathRNG.random()*(b-a+1))+a;
  const pick=a=>a[Math.floor(BatchMathRNG.random()*a.length)];
  const nonzero=(a,b)=>{let n=0;while(n===0)n=ri(a,b);return n;};
  const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};
  const rat=(n,d=1)=>{if(d<0){n=-n;d=-d}const g=gcd(n,d);return {kind:"rat",n:n/g,d:d/g}};
  const dne=()=>({kind:"dne"});
  const inf=s=>({kind:"inf",sign:s<0?-1:1});
  const texRat=a=>a.kind==="rat"?(a.d===1?String(a.n):`${a.n<0?"-":""}\\frac{${Math.abs(a.n)}}{${a.d}}`):(a.kind==="exact"?a.tex:(a.kind==="dne"?"\\text{DNE}":(a.sign<0?"-\\infty":"\\infty")));
  const textRat=a=>a.kind==="rat"?(a.d===1?String(a.n):`${a.n}/${a.d}`):(a.kind==="exact"?(a.text||a.tex):(a.kind==="dne"?"DNE":(a.sign<0?"-infinity":"infinity")));
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
  const joinPositive=prefix=>{
    const before=prefix.replace(/\s+$/,'');
    if(!before||before.endsWith('\\(')||before.endsWith('\\[')||/[=({[,]/.test(before.at(-1)))return '';
    return ' + ';
  };
  const normalizeSubtractedNegativeFractions=value=>{
    const source=String(value??'');let out='',i=0;
    const groupEnd=(start,open,close)=>{let depth=0;for(let k=start;k<source.length;k++){if(source[k]===open)depth++;else if(source[k]===close&&!--depth)return k;}return-1;};
    while(i<source.length){
      if(source[i]==='-'){
        let j=i+1;while(/\s/.test(source[j]||''))j++;
        if(source.startsWith('\\frac{',j)){
          const open=j+5,close=groupEnd(open,'{','}');
          if(close>open){const numerator=source.slice(open+1,close),m=numerator.match(/^\s*-\s*([\s\S]+)$/);if(m){out=out.replace(/\s+$/,'');out+=joinPositive(out);out+=`\\frac{${m[1]}}`;i=close+1;continue;}}
        }
        if(source[j]==='('){const close=groupEnd(j,'(',')'),inner=close>j?source.slice(j+1,close):'',m=inner.match(/^\s*-\s*([\s\S]+)$/);if(m){out=out.replace(/\s+$/,'');out+=joinPositive(out);out+=m[1];i=close+1;continue;}}
      }
      out+=source[i++];
    }
    return cleanSigns(out);
  };
  const normalizeComplexProblem=p=>{
    p={...p};
    for(const key of ['q','questionHtml','sol','explanation','hint'])if(typeof p[key]==='string')p[key]=normalizeSubtractedNegativeFractions(p[key]);
    if(Array.isArray(p.choices))p.choices=p.choices.map(choice=>typeof choice==='string'?normalizeSubtractedNegativeFractions(choice):choice);
    return p;
  };
  const approach=a=>String(a);
  function factoring(){
    const type=ri(1,4);
    if(type===1){
      const a=ri(2,9);
      return {cat:"factoring",id:`f-ds-${a}`,q:`\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{x^2-${a*a}}{x-${a}}\\)`,ans:rat(2*a),sol:`Substitution gives \\(0/0\\), so simplify first. Factor \\(x^2-${a*a}=(x-${a})(x+${a})\\). For \\(x\\ne${a}\\), cancel \\(x-${a}\\), leaving \\(x+${a}\\). Thus the limit is \\(${a}+${a}=${2*a}\\). Cancellation describes nearby values; it does not fill the original hole.`};
    }
    if(type===2){
      let r=ri(-5,5),s=ri(-6,6);while(s===r)s=ri(-6,6);
      const ans=r-s;
      return {cat:"factoring",id:`f-q-${r}-${s}`,q:`\\(\\displaystyle \\lim_{x\\to ${r}} \\frac{${quadFromRoots(r,s)}}{${shifted("x",r)}}\\)`,ans:rat(ans),sol:`Factor the numerator as \\((${shifted("x",r)})(${shifted("x",s)})\\). For \\(x\\ne${r}\\), cancel \\(${shifted("x",r)}\\), leaving \\(${shifted("x",s)}\\). Evaluate this continuous expression at \\(x=${r}\\): \\(${r}-(${s})=${ans}\\).`};
    }
    if(type===3){
      let r=ri(-4,4),s=ri(-6,6),t=ri(-6,6);while(s===r)s=ri(-6,6);while(t===r)t=ri(-6,6);
      const a=rat(r-s,r-t);
      return {cat:"factoring",id:`f-ratio-${r}-${s}-${t}`,q:`\\(\\displaystyle \\lim_{x\\to ${r}} \\frac{${quadFromRoots(r,s)}}{${quadFromRoots(r,t)}}\\)`,ans:a,sol:`Factor both polynomials. For \\(x\\ne${r}\\),<br>\\(\\frac{(${shifted("x",r)})(${shifted("x",s)})}{(${shifted("x",r)})(${shifted("x",t)})}=\\frac{${shifted("x",s)}}{${shifted("x",t)}}\\).<br>The remaining denominator is nonzero at \\(x=${r}\\), so the limit is \\(\\frac{${r}-(${s})}{${r}-(${t})}=${texRat(a)}\\).`};
    }
    const a=ri(2,6),a3=a*a*a;
    return {cat:"factoring",id:`f-cube-${a}`,q:`\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{x^3-${a3}}{x-${a}}\\)`,ans:rat(3*a*a),sol:`Use \\(x^3-${a3}=(x-${a})(x^2+${a}x+${a*a})\\). For \\(x\\ne${a}\\), cancel the common factor. The remaining polynomial is continuous, so the limit is \\(${a*a}+${a*a}+${a*a}=${3*a*a}\\).`};
  }

  const fracPowerTex=(p,n)=>{
    const g=gcd(p,n);p/=g;n/=g;
    if(n===1)return p===1?"x":`x^{${p}}`;
    return p===1?`x^{\\frac{1}{${n}}}`:`x^{\\frac{${p}}{${n}}}`;
  };
  const radicalPowerTex=(p,n)=>{
    if(n===2)return p===1?"\\sqrt{x}":`\\sqrt{x^{${p}}}`;
    return p===1?`\\sqrt[${n}]{x}`:`\\sqrt[${n}]{x^{${p}}}`;
  };
  const fractionalPowerDisplay=(p,n,notation)=>notation==="radical"?radicalPowerTex(p,n):fracPowerTex(p,n);
  const subProblem=(variant,id,q,ans,sol)=>({cat:"substitution",problemType:"variable_substitution",problemVariant:variant,id,q,ans,sol});

  const powerSum=(n,k)=>Array.from({length:n},(_,i)=>{const e=n-1-i,c=k**i,v=e===0?'':e===1?'u':`u^{${e}}`;return `${c===1&&v?'':c}${v}`;}).join('+');
  function substitution(){
    // U-substitution is deliberately distinct from the Rationalizing category:
    // no square-root / x^(1/2) problems appear here. About 60% of problems are
    // cube-root based; the other 40% use fourth-, fifth-, or sixth-root powers.
    const family=pick([
      // 12/20 = 60% cube-root based
      "cube_root_over_power","cube_root_over_power","cube_root_over_power",
      "power_over_cube_root","power_over_cube_root",
      "higher_cube_root_power","higher_cube_root_power",
      "clean_shifted_cube_root","clean_shifted_cube_root","clean_shifted_cube_root",
      "cube_root_quadratic","cube_root_polynomial_ratio",
      // 8/20 = 40% other fractional powers (never reducible to denominator 2 or 3)
      "higher_root_over_power","higher_root_over_power",
      "power_over_higher_root","power_over_higher_root",
      "higher_fractional_power","higher_fractional_power",
      "mixed_fractional_powers","mixed_fractional_powers"
    ]);

    if(family==="cube_root_over_power" || family==="power_over_cube_root"){
      const k=pick([1,1,2,2,3,4]),target=k*k*k;
      const notation=pick(["radical","radical","radical","fractional","fractional"]);
      const root=fractionalPowerDisplay(1,3,notation),den=shifted("x",target),factor=3*k*k;
      if(family==="cube_root_over_power"){
        const ans=rat(1,factor);
        return subProblem("cube_root_over_power",`sub-cuberoot-over-power-${k}-${notation}`,
          `\\(\\displaystyle \\lim_{x\\to ${target}} \\frac{${root}-${k}}{${den}}\\)`,ans,
          `Let \\(u=\\sqrt[3]{x}\\), so \\(x=u^3\\) and \\(u\\to${k}\\). For \\(u\\ne${k}\\),<br>\\(\\frac{u-${k}}{u^3-${target}}=\\frac1{u^2+${k}u+${k*k}}\\).<br>Substituting \\(u=${k}\\) gives \\(\\frac1{${k*k}+${k*k}+${k*k}}=${texRat(ans)}\\).`);
      }
      const ans=rat(factor);
      return subProblem("power_over_cube_root",`sub-power-over-cuberoot-${k}-${notation}`,
        `\\(\\displaystyle \\lim_{x\\to ${target}} \\frac{${den}}{${root}-${k}}\\)`,ans,
        `Let \\(u=\\sqrt[3]{x}\\), so \\(x=u^3\\) and \\(u\\to${k}\\). Factor the difference of cubes. For \\(u\\ne${k}\\),<br>\\(\\frac{u^3-${target}}{u-${k}}=u^2+${k}u+${k*k}\\).<br>Its limit is \\(${k*k}+${k*k}+${k*k}=${texRat(ans)}\\).`);
    }

    if(family==="higher_cube_root_power"){
      const k=pick([1,1,2,2,3,4]),target=k*k*k;
      const notation=pick(["fractional","fractional","fractional","radical"]);
      const high=fractionalPowerDisplay(2,3,notation),root=fractionalPowerDisplay(1,3,notation);
      const ans=rat(2*k);
      return subProblem("higher_cube_root_power",`sub-higher-cuberoot-${k}-${notation}`,
        `\\(\\displaystyle \\lim_{x\\to ${target}} \\frac{${high}-${k*k}}{${root}-${k}}\\)`,ans,
        `Let \\(u=x^{\\frac{1}{3}}\\), so \\(u\\to${k}\\). The expression becomes \\(\\frac{u^2-${k*k}}{u-${k}}\\). Factor \\(u^2-${k*k}=(u-${k})(u+${k})\\), cancel, and substitute to get \\(${2*k}\\).`);
    }

    if(family==="higher_root_over_power" || family==="power_over_higher_root"){
      const n=pick([4,4,5,5,6,6]);
      const k=n>=5?pick([1,1,1,2,2]):pick([1,1,1,2,2,3]);
      const target=Math.pow(k,n),notation=pick(["fractional","fractional","fractional","fractional","radical"]);
      const root=fractionalPowerDisplay(1,n,notation),den=shifted("x",target),factor=n*Math.pow(k,n-1);
      if(family==="higher_root_over_power"){
        const ans=rat(1,factor);
        return subProblem("higher_root_over_power",`sub-higher-root-over-power-${n}-${k}-${notation}`,
          `\\(\\displaystyle \\lim_{x\\to ${target}} \\frac{${root}-${k}}{${den}}\\)`,ans,
          `Let \\(u=x^{\\frac{1}{${n}}}\\), so \\(x=u^{${n}}\\) and \\(u\\to${k}\\). Factor \\(u^{${n}}-${target}=(u-${k})(${powerSum(n,k)})\\). Cancel for \\(u\\ne${k}\\), leaving \\(\\frac1{${powerSum(n,k)}}\\). At \\(u=${k}\\), each of the \\(${n}\\) denominator terms is \\(${k**(n-1)}\\), giving \\(\\frac1{${n}\\cdot${k**(n-1)}}=${texRat(ans)}\\).`);
      }
      const ans=rat(factor);
      return subProblem("power_over_higher_root",`sub-power-over-higher-root-${n}-${k}-${notation}`,
        `\\(\\displaystyle \\lim_{x\\to ${target}} \\frac{${den}}{${root}-${k}}\\)`,ans,
        `Let \\(u=x^{\\frac{1}{${n}}}\\), so \\(x=u^{${n}}\\) and \\(u\\to${k}\\). The difference-of-powers factorization gives, for \\(u\\ne${k}\\),<br>\\(\\frac{u^{${n}}-${target}}{u-${k}}=${powerSum(n,k)}\\).<br>Each of its \\(${n}\\) terms tends to \\(${k**(n-1)}\\), so the limit is \\(${n}\\cdot${k**(n-1)}=${texRat(ans)}\\).`);
    }

    if(family==="higher_fractional_power"){
      // These exponents stay genuinely outside the square-root and cube-root cases.
      const [n,m]=pick([[4,3],[5,2],[5,3],[5,4],[6,5]]),k=pick([1,1,1,2,2]);
      const target=Math.pow(k,n),notation=pick(["fractional","fractional","fractional","fractional","radical"]);
      const high=fractionalPowerDisplay(m,n,notation),root=fractionalPowerDisplay(1,n,notation);
      const km=Math.pow(k,m),ans=rat(m*Math.pow(k,m-1));
      return subProblem("higher_fractional_power",`sub-higher-power-${n}-${m}-${k}-${notation}`,
        `\\(\\displaystyle \\lim_{x\\to ${target}} \\frac{${high}-${km}}{${root}-${k}}\\)`,ans,
        `Let \\(u=x^{\\frac{1}{${n}}}\\), so \\(u\\to${k}\\). Then \\(u^{${m}}-${km}=(u-${k})(${powerSum(m,k)})\\). Cancel the common factor for \\(u\\ne${k}\\). The remaining sum has \\(${m}\\) terms, each tending to \\(${k**(m-1)}\\), so the limit is \\(${m}\\cdot${k**(m-1)}=${texRat(ans)}\\).`);
    }

    if(family==="mixed_fractional_powers"){
      // Every displayed fractional exponent below stays reduced and avoids denominator 2 or 3.
      const patterns=[
        [4,1,3],
        [5,1,2],[5,1,3],[5,1,4],[5,2,3],[5,2,4],[5,3,4],
        [6,1,5]
      ];
      const [n,p,q]=pick(patterns),k=pick([1,1,1,2]),target=Math.pow(k,n);
      const kp=Math.pow(k,p),kq=Math.pow(k,q);
      const ans=rat(p*Math.pow(k,p-1),q*Math.pow(k,q-1));
      return subProblem("mixed_fractional_powers",`sub-mixed-powers-${n}-${p}-${q}-${k}`,
        `\\(\\displaystyle \\lim_{x\\to ${target}} \\frac{${fracPowerTex(p,n)}-${kp}}{${fracPowerTex(q,n)}-${kq}}\\)`,ans,
        `Let \\(u=x^{\\frac{1}{${n}}}\\), so \\(u\\to${k}\\). The quotient becomes \\(\\frac{u^{${p}}-${kp}}{u^{${q}}-${kq}}\\). Factor both differences and cancel \\(u-${k}\\) for \\(u\\ne${k}\\):<br>\\(\\frac{${powerSum(p,k)}}{${powerSum(q,k)}}\\longrightarrow\\frac{${p}\\cdot${k**(p-1)}}{${q}\\cdot${k**(q-1)}}=${texRat(ans)}\\).`);
    }

    if(family==="clean_shifted_cube_root"){
      // Visually "unclean" shifts are welcome when the approach value makes the radicand a perfect cube.
      // Example: x -> 2 with cubeRoot(x + 62) -> 4, since 2 + 62 = 64.
      const k=pick([2,2,3,3,4,5]),cube=k*k*k,a=pick([-3,-2,-1,0,0,1,2,2,3,4,5]),m=pick([1,1,1,2,3]);
      const c=cube-a,inside=shifted("x",-c),xa=shifted("x",a),ans=rat(m*3*k*k);
      const numerator=m===1?xa:(a===0?`${m}x`:`${m}(${xa})`);
      return subProblem("clean_shifted_cube_root",`sub-shifted-cuberoot-${k}-${a}-${m}`,
        `\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{${numerator}}{\\sqrt[3]{${inside}}-${k}}\\)`,ans,
        `Let \\(u=\\sqrt[3]{${inside}}\\). Because \\(${a}+${c}=${cube}=${k}^3\\), we have \\(u\\to${k}\\). Also \\(${xa}=u^3-${cube}=(u-${k})(u^2+${k}u+${k*k})\\). The displayed numerator is ${m===1?`\\(${xa}\\)`:`\\(${m}(${xa})\\)`}, so after substitution it becomes ${m===1?`\\(u^3-${cube}\\)`:`\\(${m}(u^3-${cube})\\)`}. Cancel \\(u-${k}\\); the remaining expression approaches \\(${m===1?`${3*k*k}`:`${m}(${3*k*k})`}=${texRat(ans)}\\).`);
    }

    if(family==="cube_root_quadratic"){
      const k=pick([2,2,3,3,4]),cube=k*k*k,a=pick([-2,-1,0,0,1,2,3]),m=pick([1,1,2,3]);
      const c=cube-a,root=`\\sqrt[3]{${shifted("x",-c)}}`,xa=shifted("x",a);
      const coef=m===1?"":String(m),ans=rat(9*m*Math.pow(k,4)),middle=2*k,constant=k*k;
      const numerator=m===1?`(${xa})^2`:`${m}(${xa})^2`;
      return subProblem("cube_root_quadratic_substitution",`sub-cuberoot-quadratic-${k}-${a}-${m}`,
        `\\(\\displaystyle \\lim_{x\\to${a}} \\frac{${numerator}}{\\left(${root}\\right)^2-${middle}${root}+${constant}}\\)`,ans,
        `Let \\(u=${root}\\), so \\(u\\to${k}\\). We have \\(${xa}=u^3-${cube}=(u-${k})(u^2+${k}u+${k*k})\\). The numerator is \\(${m}(u-${k})^2(u^2+${k}u+${k*k})^2\\) and the denominator is \\((u-${k})^2\\). Cancel for \\(u\\ne${k}\\). The remaining expression is \\(${m}(u^2+${k}u+${k*k})^2\\), whose limit is \\(${m}(${3*k*k})^2=${texRat(ans)}\\).`);
    }

    const k=pick([2,2,3,3,4]),cube=k*k*k,a=pick([-2,-1,0,0,1,2,3]);
    const candidates=[1,2,3,4,5].filter(v=>v!==k),r=pick(candidates),A=pick([1,1,2,3]);
    const c=cube-a,root=`\\sqrt[3]{${shifted("x",-c)}}`,sum=k+r,prod=k*r;
    const ans=rat(A*k,k-r),lead=A===1?"":String(A),mid=A*k;
    return subProblem("cube_root_polynomial_ratio",`sub-cuberoot-poly-${k}-${r}-${A}-${a}`,
      `\\(\\displaystyle \\lim_{x\\to${a}} \\frac{${lead}\\left(${root}\\right)^2-${mid}${root}}{\\left(${root}\\right)^2-${sum}${root}+${prod}}\\)`,ans,
      `Let \\(u=${root}\\), so \\(u\\to${k}\\). The expression becomes \\(\\frac{${A===1?"":A}u(u-${k})}{(u-${k})(u-${r})}\\). Cancel \\(u-${k}\\) and substitute \\(u=${k}\\) to get \\(${texRat(ans)}\\).`);
  }

  function rationalizing(){
    const k=ri(2,9),a=k*k,type=ri(1,3);
    if(type===1){
      const ans=rat(1,2*k);
      return {cat:"rationalizing",id:`r1-${k}`,q:`\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{\\sqrt{x}-${k}}{x-${a}}\\)`,ans,sol:`Rationalize the numerator by multiplying the numerator and denominator by the conjugate \\(\\sqrt{x}+${k}\\). This gives \\(\\frac{x-${a}}{(x-${a})(\\sqrt{x}+${k})}\\). Cancel \\(x-${a}\\), then substitute \\(x=${a}\\): \\(\\frac{1}{\\sqrt{${a}}+${k}}=${texRat(ans)}\\).`};
    }
    if(type===2){
      const ans=rat(2*k);
      return {cat:"rationalizing",id:`r2-${k}`,q:`\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{x-${a}}{\\sqrt{x}-${k}}\\)`,ans,sol:`Rationalize the denominator by multiplying the numerator and denominator by the conjugate \\(\\sqrt{x}+${k}\\). The denominator becomes \\((\\sqrt{x}-${k})(\\sqrt{x}+${k})=x-${a}\\), so \\(x-${a}\\) cancels and the expression becomes \\(\\sqrt{x}+${k}\\). Substitute \\(x=${a}\\) to get \\(${k}+${k}=${2*k}\\). This problem can also be simplified by factoring \\(x-${a}\\) as \\((\\sqrt{x}-${k})(\\sqrt{x}+${k})\\).`};
    }
    const target=ri(-3,6),c=a-target,inside=c===0?"x":(c>0?`x+${c}`:`x-${-c}`),ans=rat(1,2*k);
    return {cat:"rationalizing",id:`r3-${k}-${target}`,q:`\\(\\displaystyle \\lim_{x\\to ${target}} \\frac{\\sqrt{${inside}}-${k}}{${shifted("x",target)}}\\)`,ans,sol:`Rationalize the numerator by multiplying the numerator and denominator by the conjugate \\(\\sqrt{${inside}}+${k}\\). The numerator becomes \\((\\sqrt{${inside}}-${k})(\\sqrt{${inside}}+${k})=x-${target}\\), which cancels with the denominator. Substitute \\(x=${target}\\) to get \\(\\frac{1}{2(${k})}=${texRat(ans)}\\).`};
  }

  const complexProblem=(variant,id,q,ans,sol)=>({cat:"complex",problemType:"complex_fraction_limits",problemVariant:variant,id,q,ans,sol});

  function complexFraction(){
    // Difficulty comes from the algebraic structure, not from ugly constants.
    // Rough mix: 44% routine, 31% intermediate, 25% challenging.
    const family=pick([
      "reciprocal_basic","reciprocal_basic",
      "reciprocal_denominator","reciprocal_denominator",
      "shifted_reciprocal","shifted_reciprocal",
      "shifted_reciprocal_denominator",
      "reciprocal_quadratic","reciprocal_quadratic",
      "reciprocal_square",
      "rational_linear_difference","rational_linear_difference",
      "double_reciprocal","double_reciprocal",
      "reciprocal_square_over_reciprocal",
      "reciprocal_over_factored"
    ]);
    const a=pick([-6,-5,-4,-3,-2,2,3,4,5,6]),xa=shifted("x",a),a2=a*a;

    if(family==="reciprocal_basic"){
      const gap=reciprocalDifference("\\frac1x",a),ans=rat(-1,a2);
      const combined=a>0?`-\\frac{${xa}}{${a}x}`:`\\frac{${xa}}{${-a}x}`;
      return complexProblem("routine_reciprocal_basic",`cf-recip-basic-${a}`,
        `\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{${gap}}{${xa}}\\)`,ans,
        `Combine the numerator: \\(${gap}=${combined}\\). For \\(x\\ne${a}\\), cancel \\(${xa}\\) from the full quotient, leaving \\(-\\frac1{${a}x}\\). Its limit is \\(-\\frac1{${a2}}=${texRat(ans)}\\).`);
    }

    if(family==="reciprocal_denominator"){
      const gap=reciprocalDifference("\\frac1x",a),ans=rat(-a2);
      const combined=a>0?`-\\frac{${xa}}{${a}x}`:`\\frac{${xa}}{${-a}x}`;
      const after=a>0?`-${a}x`:`${-a}x`;
      return complexProblem("routine_reciprocal_denominator",`cf-recip-den-${a}`,
        `\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{${xa}}{${gap}}\\)`,ans,
        `Combine the denominator: \\(${gap}=${combined}\\). Dividing by this fraction and canceling \\(${xa}\\) leaves \\(${after}\\). Substitution gives \\(${texRat(ans)}\\).`);
    }

    if(family==="shifted_reciprocal" || family==="shifted_reciprocal_denominator"){
      let c=ri(-4,4);while(c===0||Math.abs(a+c)<2)c=ri(-4,4);
      const d=a+c,xc=shifted("x",-c),left=`\\frac1{${xc}}`,gap=reciprocalDifference(left,d);
      const combined=d>0?`-\\frac{${xa}}{${d}(${xc})}`:`\\frac{${xa}}{${-d}(${xc})}`;
      if(family==="shifted_reciprocal"){
        const ans=rat(-1,d*d);
        return complexProblem("routine_shifted_reciprocal",`cf-shifted-${a}-${c}`,
          `\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{${gap}}{${xa}}\\)`,ans,
          `Combine the numerator: \\(${gap}=${combined}\\). Cancel \\(${xa}\\) for \\(x\\ne${a}\\), leaving \\(-\\frac1{${d}(${xc})}\\). Substitution gives \\(-\\frac1{${d*d}}=${texRat(ans)}\\).`);
      }
      const ans=rat(-(d*d)),after=d>0?`-${d}(${xc})`:`${-d}(${xc})`;
      return complexProblem("routine_shifted_reciprocal_denominator",`cf-shifted-den-${a}-${c}`,
        `\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{${xa}}{${gap}}\\)`,ans,
        `The denominator simplifies to \\(${combined}\\). Dividing by that fraction and canceling \\(${xa}\\) leaves \\(${after}\\). Substitute \\(x=${a}\\) to get \\(${texRat(ans)}\\).`);
    }

    if(family==="reciprocal_quadratic"){
      const c=ri(1,5),A=a2+c,ans=rat(-2*a,A*A);
      return complexProblem("intermediate_reciprocal_quadratic",`cf-recip-quad-${a}-${c}`,
        `\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{\\frac1{x^2+${c}}-\\frac1{${A}}}{${xa}}\\)`,ans,
        `Combine the numerator:<br>\\(\\frac{${A}-(x^2+${c})}{${A}(x^2+${c})}=\\frac{-(${xa})(x+${a})}{${A}(x^2+${c})}\\).<br>Cancel \\(${xa}\\) from the full quotient for \\(x\\ne${a}\\), leaving \\(-\\frac{x+${a}}{${A}(x^2+${c})}\\). Its limit is \\(-\\frac{${2*a}}{${A*A}}=${texRat(ans)}\\).`);
    }

    if(family==="reciprocal_square"){
      const ans=rat(-2,a*a*a);
      return complexProblem("intermediate_reciprocal_square",`cf-recip-square-${a}`,
        `\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{\\frac1{x^2}-\\frac1{${a2}}}{${xa}}\\)`,ans,
        `Combine the numerator:<br>\\(\\frac1{x^2}-\\frac1{${a2}}=-\\frac{(${xa})(x+${a})}{${a2}x^2}\\).<br>Cancel \\(${xa}\\) from the full quotient for \\(x\\ne${a}\\). The remaining expression is \\(-\\frac{x+${a}}{${a2}x^2}\\), giving \\(-\\frac{${2*a}}{${a2*a2}}=${texRat(ans)}\\).`);
    }

    if(family==="rational_linear_difference"){
      const aa=ri(1,5);let b=ri(1,5),c=ri(1,5);while(c===b)c=ri(1,5);
      const denA=aa+c,numA=aa+b,xa2=shifted("x",aa),fx=`\\frac{x+${b}}{x+${c}}`,atA=rat(numA,denA);
      const ans=rat(c-b,denA*denA);
      return complexProblem("intermediate_rational_difference",`cf-rational-diff-${aa}-${b}-${c}`,
        `\\(\\displaystyle \\lim_{x\\to ${aa}} \\frac{${fx}-${texRat(atA)}}{${xa2}}\\)`,ans,
        `Combining the numerator over a common denominator gives \\(\\frac{${c-b}(${xa2})}{${denA}(x+${c})}\\). Cancel \\(${xa2}\\) from the full quotient for \\(x\\ne${aa}\\), leaving \\(\\frac{${c-b}}{${denA}(x+${c})}\\). Its limit is \\(\\frac{${c-b}}{${denA*denA}}=${texRat(ans)}\\).`);
    }

    if(family==="double_reciprocal"){
      let c=ri(-4,4);while(c===0||Math.abs(a+c)<2)c=ri(-4,4);
      const d=a+c,xc=shifted("x",-c),top=reciprocalDifference("\\frac1x",a),bottom=reciprocalDifference(`\\frac1{${xc}}`,d);
      const topCombined=a>0?`-\\frac{${xa}}{${a}x}`:`\\frac{${xa}}{${-a}x}`;
      const bottomCombined=d>0?`-\\frac{${xa}}{${d}(${xc})}`:`\\frac{${xa}}{${-d}(${xc})}`;
      const ans=rat(d*d,a2);
      return complexProblem("challenging_double_reciprocal",`cf-double-recip-${a}-${c}`,
        `\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{${top}}{${bottom}}\\)`,ans,
        `Combine each difference: the numerator is \\(${topCombined}\\) and the denominator is \\(${bottomCombined}\\). Divide by multiplying by the reciprocal. For \\(x\\ne${a}\\), the common factor cancels, leaving \\(\\frac{${d}(${xc})}{${a}x}\\). Its limit is \\(\\frac{${d*d}}{${a2}}=${texRat(ans)}\\).`);
    }

    if(family==="reciprocal_square_over_reciprocal"){
      const bottom=reciprocalDifference("\\frac1x",a),ans=rat(2,a);
      return complexProblem("challenging_reciprocal_square_over_reciprocal",`cf-square-over-recip-${a}`,
        `\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{\\frac1{x^2}-\\frac1{${a2}}}{${bottom}}\\)`,ans,
        `Combine both differences:<br>\\(\\frac1{x^2}-\\frac1{${a2}}=\\frac{(${a}-x)(${a}+x)}{${a2}x^2},\\quad ${bottom}=\\frac{${a}-x}{${a}x}\\).<br>Divide and cancel \\(${a}-x\\) for \\(x\\ne${a}\\), leaving \\(\\frac{${a}+x}{${a}x}\\). The limit is \\(\\frac{${2*a}}{${a2}}=${texRat(ans)}\\).`);
    }

    const top=reciprocalDifference("\\frac1x",a),ans=rat(-1,2*a*a*a);
    const combined=a>0?`-\\frac{${xa}}{${a}x}`:`\\frac{${xa}}{${-a}x}`;
    return complexProblem("challenging_reciprocal_over_factored",`cf-recip-over-factor-${a}`,
      `\\(\\displaystyle \\lim_{x\\to ${a}} \\frac{${top}}{x^2-${a2}}\\)`,ans,
      `The numerator simplifies to \\(${combined}\\), and the denominator factors as \\((${xa})(x+${a})\\). Cancel \\(${xa}\\) for \\(x\\ne${a}\\), leaving \\(-\\frac1{${a}x(x+${a})}\\). Its limit is \\(-\\frac1{${2*a*a*a}}=${texRat(ans)}\\).`);
  }

  const core=window.BMUnit1CoreExpansions;
  const legacy={factoring,substitution,rationalizing,complex:complexFraction};
  const mixedWeights=['continuous',...Array(3).fill('factoring'),...Array(3).fill('substitution'),...Array(3).fill('rationalizing'),...Array(3).fill('complex')];
  const generators={
    continuous:()=>core.continuous('core'),
    factoring:()=>BatchMathRNG.random()<.5?legacy.factoring():core.factoring(),
    substitution:()=>BatchMathRNG.random()<.7?legacy.substitution():core.substitution(),
    rationalizing:()=>BatchMathRNG.random()<.5?legacy.rationalizing():core.rationalizing(),
    complex:()=>BatchMathRNG.random()<.8?legacy.complex():core.complex()
  };
  const finalize=(p,resolved)=>{
    p={...p,q:cleanSigns(p.q),sol:cleanSigns(p.sol)};
    return resolved==='complex'?normalizeComplexProblem(p):p;
  };
  function generate(mode='all'){
    const resolved=mode==='all'?pick(mixedWeights):mode;
    const generator=generators[resolved];
    if(!generator)throw new Error('Unknown Basic Techniques mode: '+mode);
    return finalize(generator(),resolved);
  }
  window.BMUnit1BasicTechniques={generate,generators,mixedWeights:[...mixedWeights],normalizeComplexDisplay:normalizeSubtractedNegativeFractions};
})();
