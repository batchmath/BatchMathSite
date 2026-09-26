(function(){'use strict';
const R=()=>window.BatchMathRNG.random(),ri=(a,b)=>Math.floor(R()*(b-a+1))+a,pick=a=>a[Math.floor(R()*a.length)],nz=(a,b)=>{let n=0;while(!n)n=ri(a,b);return n};
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1},rat=(n,d=1)=>{if(d<0){n=-n;d=-d}const g=gcd(n,d);return{kind:'rat',n:n/g,d:d/g}},inf=s=>({kind:'inf',sign:s<0?-1:1}),dne=()=>({kind:'dne'});
const shift=(a,rev=false)=>rev?(a===0?'-x':a>0?`${a}-x`:`-${-a}-x`):(a===0?'x':a>0?`x-${a}`:`x+${-a}`),sideWord=s=>s==='+'?'right':'left',sideSign=s=>s==='+'?1:-1;
const ansTex=a=>a.kind==='rat'?(a.d===1?String(a.n):`${a.n<0?'-':''}\\frac{${Math.abs(a.n)}}{${a.d}}`):a.kind==='inf'?(a.sign<0?'-\\infty':'\\infty'):'\\mathrm{DNE}';
const problem=(family,id,q,ans,sol,data={})=>({cat:'oneSided',familyId:family,id,q,ans,sol,data:{family,...data}}),limit=(a,s='')=>`\\lim_{x\\to${a}${s?`^{${s}}`:''}}`;
const coef=(c,body)=>c===1?body:c===-1?`-${body}`:`${c}${body}`;
const signed=(c,body,first=false)=>{if(!c)return'';const core=(Math.abs(c)===1&&body?'':Math.abs(c))+body;return first?(c<0?'-':'')+core:(c<0?' - ':' + ')+core};
const lin=(m,b)=>signed(m,'x',true)+signed(b,'');
const grouped=body=>body==='x'||body==='-x'?body:`(${body})`;
const negated=body=>body==='x'?'-x':body==='-x'?'x':`-(${body})`;
const pow=(body,n)=>n===1?grouped(body):`${grouped(body)}^{${n}}`;
const wordSign=s=>s>0?'positive':'negative';

function absoluteValue(){
 const family=pick(['legacy_direct','legacy_inverse','reversed','coefficient','product_cancellation','linear_product','scaled_absolute']),a=ri(-8,8),side=pick(['+','-']),s=sideSign(side),dx=shift(a);
 if(family==='legacy_direct')return problem('one_sided_absolute_legacy_direct',`os-abs-direct-${a}-${side}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${dx}}{|${dx}|}\\)`,rat(s),`As \\(x\\) approaches \\(${a}\\) from the ${sideWord(side)}, \\(${dx}\\) is ${wordSign(s)}. On that side, \\(|${dx}|=${s>0?dx:negated(dx)}\\), so the fraction equals \\(${s}\\).`,{focus:'absolute',a,side});
 if(family==='legacy_inverse')return problem('one_sided_absolute_legacy_inverse',`os-abs-inverse-${a}-${side}`,`\\(\\displaystyle ${limit(a,side)}\\frac{|${dx}|}{${dx}}\\)`,rat(s),`As \\(x\\) approaches \\(${a}\\) from the ${sideWord(side)}, \\(${dx}\\) is ${wordSign(s)}. Therefore \\(\\frac{|${dx}|}{${dx}}=${s}\\) on that side, so the limit is \\(${s}\\).`,{focus:'absolute',a,side});
 if(family==='reversed'){const value=-s,rev=shift(a,true);return problem('one_sided_absolute_reversed_sign',`os-abs-reversed-${a}-${side}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${rev}}{|${dx}|}\\)`,rat(value),`The numerator \\(${rev}\\) is the opposite of \\(${dx}\\). As \\(x\\) approaches \\(${a}\\) from the ${sideWord(side)}, the fraction equals \\(${value}\\), so the limit is \\(${value}\\).`,{focus:'absolute',a,side});}
 if(family==='coefficient'){
  const c=nz(-9,9),value=c*s,numerator=coef(c,grouped(dx));
  return problem('one_sided_absolute_coefficient',`os-abs-coeff-${a}-${side}-${c}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${numerator}}{|${dx}|}\\)`,rat(value),`As \\(x\\) approaches \\(${a}\\) from the ${sideWord(side)}, \\(\\frac{${dx}}{|${dx}|}=${s}\\). Multiplying by \\(${c}\\) gives the limit \\(${value}\\).`,{focus:'absolute',a,side,c});
 }
 if(family==='product_cancellation'){
  const c=nz(-9,9),value=c*s,numerator=coef(c,`${grouped(dx)}|${dx}|`);
  return problem('one_sided_absolute_product_cancellation',`os-abs-product-${a}-${side}-${c}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${numerator}}{${pow(dx,2)}}\\)`,rat(value),`For \\(x\\ne${a}\\), cancel one factor of \\(${dx}\\). This leaves \\(\\frac{${coef(c,`|${dx}|`)}}{${dx}}\\). On the ${sideWord(side)} of \\(${a}\\), \\(\\frac{|${dx}|}{${dx}}=${s}\\), so the limit is \\(${value}\\).`,{focus:'absolute',a,side,c});
 }
 if(family==='linear_product'){
  const m=nz(-5,5),b=ri(-10,10),at=m*a+b,value=at*s,linear=lin(m,b);
  return problem('one_sided_absolute_linear_product',`os-abs-linear-product-${a}-${side}-${m}-${b}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${grouped(linear)}${grouped(dx)}}{|${dx}|}\\)`,rat(value),`As \\(x\\) approaches \\(${a}\\), \\(${linear}\\) approaches \\(${at}\\). From the ${sideWord(side)}, \\(\\frac{${dx}}{|${dx}|}=${s}\\). Multiplying gives \\(${at}(${s})=${value}\\).`,{focus:'absolute',a,side,m,b,c:at});
 }
 const c=nz(-8,8),value=Math.abs(c)*s,numerator=`|${coef(c,grouped(dx))}|`;
 return problem('one_sided_absolute_scaled_inside',`os-abs-scaled-${a}-${side}-${c}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${numerator}}{${dx}}\\)`,rat(value),`First, \\(|${coef(c,grouped(dx))}|=${Math.abs(c)}|${dx}|\\). As \\(x\\) approaches \\(${a}\\) from the ${sideWord(side)}, \\(\\frac{|${dx}|}{${dx}}=${s}\\). Therefore the limit is \\(${Math.abs(c)}(${s})=${value}\\).`,{focus:'absolute',a,side,c:Math.abs(c)});
}

function rational(){
 const family=pick(['legacy_simple','legacy_square','nonconstant_numerator','repeated_factors','removable','cancelled_pole','scaled_denominator','quadratic_numerator']),a=ri(-8,8),side=pick(['+','-']),s=sideSign(side),dx=shift(a);
 if(family==='legacy_simple')return problem('one_sided_rational_legacy_simple',`os-rat-simple-${a}-${side}`,`\\(\\displaystyle ${limit(a,side)}\\frac1{${dx}}\\)`,inf(s),`As \\(x\\) approaches \\(${a}\\) from the ${sideWord(side)}, \\(${dx}\\) is a very small ${wordSign(s)} number. Dividing \\(1\\) by those numbers makes the function approach \\(${s>0?'\\infty':'-\\infty'}\\).`,{focus:'rational',a,side});
 if(family==='legacy_square'){
  const c=pick([-1,1]),numerator=c<0?'-1':'1';
  return problem('one_sided_rational_legacy_square',`os-rat-square-${a}-${side}-${c}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${numerator}}{${pow(dx,2)}}\\)`,inf(c),`The denominator \\(${pow(dx,2)}\\) is a very small positive number from either side. The numerator is ${c>0?'positive':'negative'}, so the function approaches \\(${c>0?'\\infty':'-\\infty'}\\).`,{focus:'rational',a,side,c});
 }
 if(family==='removable'){
  const c=nz(-9,9),b=pick(Array.from({length:21},(_,i)=>i-10).filter(v=>v!==a)),value=rat(c,a-b),numerator=coef(c,grouped(dx)),other=shift(b);
  return problem('one_sided_rational_removable',`os-rat-removable-${a}-${b}-${c}-${side}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${numerator}}{${grouped(dx)}${grouped(other)}}\\)`,value,`For \\(x\\ne${a}\\), cancel the common factor \\(${dx}\\). The expression becomes \\(\\frac{${c}}{${other}}\\). Now substitute \\(x=${a}\\): \\(\\frac{${c}}{${a-b}}=${ansTex(value)}\\).`,{focus:'rational',a,b,c,side});
 }
 if(family==='cancelled_pole'){
  const c=nz(-9,9),power=pick([2,3,4,5]),remaining=power-1,denSign=remaining%2?s:1,sign=Math.sign(c)*denSign,numerator=coef(c,grouped(dx));
  return problem('one_sided_rational_cancellation_leaves_pole',`os-rat-pole-after-cancel-${a}-${c}-${power}-${side}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${numerator}}{${pow(dx,power)}}\\)`,inf(sign),`Cancel one factor of \\(${dx}\\), leaving \\(\\frac{${c}}{${pow(dx,remaining)}}\\). As \\(x\\) approaches \\(${a}\\) from the ${sideWord(side)}, the denominator is a very small ${wordSign(denSign)} number. Combining its sign with the ${wordSign(c)} numerator gives \\(${sign>0?'\\infty':'-\\infty'}\\).`,{focus:'rational',a,c,power,side});
 }
 if(family==='scaled_denominator'){
  const n=pick([1,2,3,4,5]),A=nz(-6,6),B=ri(-12,12),scale=nz(-7,7),raw=A*a+B,num=raw||Math.sign(A||1),adjB=raw?B:B+num,top=lin(A,adjB),denSign=Math.sign(scale)*(n%2?s:1),sign=Math.sign(num)*denSign;
  return problem('one_sided_rational_scaled_denominator',`os-rat-scaled-den-${a}-${side}-${n}-${A}-${adjB}-${scale}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${top}}{${coef(scale,pow(dx,n))}}\\)`,inf(sign),`As \\(x\\) approaches \\(${a}\\), the numerator approaches \\(${num}\\), which is ${wordSign(num)}. From the ${sideWord(side)}, the denominator is a very small ${wordSign(denSign)} number. A ${wordSign(num)} number divided by a very small ${wordSign(denSign)} number approaches \\(${sign>0?'\\infty':'-\\infty'}\\).`,{focus:'rational',a,side,n,A,B:adjB,num,scale});
 }
 if(family==='quadratic_numerator'){
  const n=pick([1,2,3,4]),c=nz(-9,9),m=pick([1,2,3,4]),other=pick(Array.from({length:21},(_,i)=>i-10).filter(v=>v!==a)),otherValue=a-other,denSign=(n%2?s:1)*Math.sign(otherValue),sign=Math.sign(c)*denSign;
  return problem('one_sided_rational_quadratic_numerator',`os-rat-quad-num-${a}-${side}-${n}-${c}-${m}-${other}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${coef(m,pow(dx,2))}${c>0?'+':''}${c}}{${pow(dx,n)}${grouped(shift(other))}}\\)`,inf(sign),`As \\(x\\) approaches \\(${a}\\), the numerator approaches \\(${c}\\), so it is ${wordSign(c)}. From the ${sideWord(side)}, the denominator is a very small ${wordSign(denSign)} number. The signs show that the function approaches \\(${sign>0?'\\infty':'-\\infty'}\\).`,{focus:'rational',a,side,n,c,m,other,num:c});
 }
 const b=pick(Array.from({length:21},(_,i)=>i-10).filter(v=>v!==a)),m=pick([1,2,3]),n=pick([1,2,3,4,5]),A=nz(-7,7),B=ri(-12,12),raw=A*a+B,num=raw||Math.sign(A),adjB=raw?B:B+num,otherValue=(a-b)**m,denSign=(n%2?s:1)*Math.sign(otherValue),sign=Math.sign(num)*denSign;
 const numerator=lin(A,adjB),fam=family==='repeated_factors'?'one_sided_rational_repeated_factors':'one_sided_rational_nonconstant_numerator';
 return problem(fam,`os-rat-rich-${a}-${b}-${m}-${n}-${A}-${adjB}-${side}`,`\\(\\displaystyle ${limit(a,side)}\\frac{${numerator}}{${pow(dx,n)}${pow(shift(b),m)}}\\)`,inf(sign),`As \\(x\\) approaches \\(${a}\\), the numerator approaches \\(${num}\\), so it is ${wordSign(num)}. From the ${sideWord(side)}, the denominator is a very small ${wordSign(denSign)} number. The signs show that the function approaches \\(${sign>0?'\\infty':'-\\infty'}\\).`,{focus:'rational',a,b,m,n,A,B:adjB,num,side});
}

function piecewiseContext(){
 const a=ri(-7,7),family=pick(['linear_quadratic','quadratic_linear','linear_linear']),L=ri(-10,10),matching=R()<.5,Rv=matching?L:L+pick([-7,-5,-3,-2,2,3,5,7]),fv=R()<.35?L:L+pick([-6,-4,-2,2,4,6]);
 let leftExpr,rightExpr;
 if(family==='linear_quadratic'){
  const lm=nz(-5,5),rq=nz(-3,3),lb=L-lm*a,rb=Rv-rq*a*a;leftExpr=lin(lm,lb);rightExpr=signed(rq,'x^2',true)+signed(rb,'');
 }else if(family==='quadratic_linear'){
  const lq=nz(-3,3),rm=nz(-5,5),lb=L-lq*a*a,rb=Rv-rm*a;leftExpr=signed(lq,'x^2',true)+signed(lb,'');rightExpr=lin(rm,rb);
 }else{
  const lm=nz(-6,6),rm=nz(-6,6),lb=L-lm*a,rb=Rv-rm*a;leftExpr=lin(lm,lb);rightExpr=lin(rm,rb);
 }
 const f=`f(x)=\\begin{cases}${leftExpr},&x<${a}\\\\${fv},&x=${a}\\\\${rightExpr},&x>${a}\\end{cases}`,piecewiseQuestion=lim=>`<div class="u1-piecewise-question"><div class="u1-piecewise-limit">\\(\\displaystyle ${lim}f(x)\\)</div><div class="u1-piecewise-definition">\\(\\displaystyle ${f}\\)</div></div>`,data={focus:'piecewise',a,L,R:Rv,pointValue:fv,pieceFamily:family};
 return[
  problem('one_sided_piecewise_left',`os-piece-${family}-${a}-${L}-${Rv}-${fv}-left`,piecewiseQuestion(limit(a,'-')),rat(L),`As \\(x\\) approaches \\(${a}\\) from the left, use the branch labeled \\(x<${a}\\). That branch approaches \\(${L}\\), so the left-hand limit is \\(${L}\\). The value assigned exactly at \\(x=${a}\\) does not affect this limit.`,data),
  problem('one_sided_piecewise_right',`os-piece-${family}-${a}-${L}-${Rv}-${fv}-right`,piecewiseQuestion(limit(a,'+')),rat(Rv),`As \\(x\\) approaches \\(${a}\\) from the right, use the branch labeled \\(x>${a}\\). That branch approaches \\(${Rv}\\), so the right-hand limit is \\(${Rv}\\). The value assigned exactly at \\(x=${a}\\) does not affect this limit.`,data),
  problem('one_sided_piecewise_two_sided',`os-piece-${family}-${a}-${L}-${Rv}-${fv}-both`,piecewiseQuestion(limit(a)),matching?rat(L):dne(),matching?`The left-hand and right-hand limits both equal \\(${L}\\), so the two-sided limit is \\(${L}\\). ${fv===L?'The point value happens to agree as well.':`The separate point value \\(f(${a})=${fv}\\) does not change the limit.`}`:`The left-hand limit is \\(${L}\\), while the right-hand limit is \\(${Rv}\\). Since the one-sided limits differ, the two-sided limit is DNE.`,data)
 ];
}
const piecewise=()=>pick(piecewiseContext());

function endpointContext(){
 const a=ri(-7,7),orientation=pick(['right','left']),family=pick(['sqrt','fourth_root','log','log_root','reciprocal_root','exp_sqrt','exp_recip_sqrt','exp_negative_recip_sqrt']),inside=orientation==='right'?shift(a):shift(a,true),goodSide=orientation==='right'?'+':'-',badSide=goodSide==='+'?'-':'+';let expr,goodAns,work;
 if(family==='sqrt'){expr=`\\sqrt{${inside}}`;goodAns=rat(0);work='the square root approaches \\(0\\)';}
 else if(family==='fourth_root'){expr=`\\sqrt[4]{${inside}}`;goodAns=rat(0);work='the fourth root approaches \\(0\\)';}
 else if(family==='log'){expr=`\\ln(${inside})`;goodAns=inf(-1);work=`the logarithm's argument approaches \\(0^+\\), so the logarithm approaches \\(-\\infty\\)`;}
 else if(family==='log_root'){expr=`\\ln\\!\\left(\\sqrt{${inside}}\\right)`;goodAns=inf(-1);work=`the square root approaches \\(0^+\\), so its logarithm approaches \\(-\\infty\\)`;}
 else if(family==='reciprocal_root'){expr=`\\frac1{\\sqrt{${inside}}}`;goodAns=inf(1);work='the positive denominator approaches \\(0^+\\), so the reciprocal approaches \\(\\infty\\)';}
 else if(family==='exp_sqrt'){expr=`e^{\\sqrt{${inside}}}`;goodAns=rat(1);work='the exponent approaches \\(0\\), so the exponential approaches \\(1\\)';}
 else if(family==='exp_recip_sqrt'){expr=`e^{\\frac{1}{\\sqrt{${inside}}}}`;goodAns=inf(1);work='the exponent approaches \\(\\infty\\), so the exponential approaches \\(\\infty\\)';}
 else{expr=`e^{-\\frac{1}{\\sqrt{${inside}}}}`;goodAns=rat(0);work='the exponent approaches \\(-\\infty\\), so the exponential approaches \\(0\\)';}
 const data={focus:'endpoint',a,orientation,family};
 return[
  problem(`one_sided_endpoint_${family}_admissible`,`os-end-${family}-${a}-${orientation}-good`,`\\(\\displaystyle ${limit(a,goodSide)}${expr}\\)`,goodAns,`As \\(x\\) approaches \\(${a}\\) from the ${orientation}, the function is defined and ${work}. Therefore the limit is \\(${ansTex(goodAns)}\\).`,data),
  problem(`one_sided_endpoint_${family}_missing_side`,`os-end-${family}-${a}-${orientation}-missing`,`\\(\\displaystyle ${limit(a,badSide)}${expr}\\)`,dne(),`As \\(x\\) approaches \\(${a}\\) from the ${sideWord(badSide)}, the function has no real domain values. Therefore this one-sided limit is DNE.`,data),
  problem(`one_sided_endpoint_${family}_two_sided`,`os-end-${family}-${a}-${orientation}-both`,`\\(\\displaystyle ${limit(a)}${expr}\\)`,dne(),`The function has real domain values near \\(${a}\\) only on the ${orientation}. There are no function values approaching from the other side, so the two-sided limit is DNE under the course convention.`,data)
 ];
}
const endpoint=()=>{const c=endpointContext();return R()<.72?c[0]:pick(c.slice(1))};

function sequence(focus='mixed'){
 const resolved=focus==='mixed'?pick(['absolute','rational','piecewise','endpoint']):focus;
 if(resolved==='piecewise')return piecewiseContext();
 if(resolved==='endpoint')return endpointContext();
 if(resolved==='absolute'){
  const a=ri(-8,8),c=nz(-9,9),dx=shift(a),numerator=coef(c,grouped(dx)),q=`\\frac{${numerator}}{|${dx}|}`,data={focus:'absolute',a,c};
  return[
   problem('one_sided_absolute_linked_left',`os-linked-abs-${a}-${c}-left`,`\\(\\displaystyle ${limit(a,'-')}${q}\\)`,rat(-c),`As \\(x\\) approaches \\(${a}\\) from the left, \\(${dx}<0\\), so \\(\\frac{${dx}}{|${dx}|=-1\\). Multiplying by \\(${c}\\) gives \\(${-c}\\).`,data),
   problem('one_sided_absolute_linked_right',`os-linked-abs-${a}-${c}-right`,`\\(\\displaystyle ${limit(a,'+')}${q}\\)`,rat(c),`As \\(x\\) approaches \\(${a}\\) from the right, \\(${dx}>0\\), so \\(\\frac{${dx}}{|${dx}|=1\\). Multiplying by \\(${c}\\) gives \\(${c}\\).`,data),
   problem('one_sided_absolute_linked_two_sided',`os-linked-abs-${a}-${c}-both`,`\\(\\displaystyle ${limit(a)}${q}\\)`,dne(),`The left-hand limit is \\(${-c}\\), while the right-hand limit is \\(${c}\\). Since \\(c\\ne0\\), they differ, so the two-sided limit is DNE.`,data)
  ];
 }
 const a=ri(-8,8),n=pick([1,2,3,4,5]),c=nz(-9,9),dx=shift(a),leftDenSign=n%2?-1:1,rightDenSign=1,ls=Math.sign(c)*leftDenSign,rs=Math.sign(c)*rightDenSign,q=`\\frac{${c}}{${pow(dx,n)}}`,data={focus:'rational',a,n,c};
 const explainSide=(which,denSign,result)=>`As \\(x\\) approaches \\(${a}\\) from the ${which}, the denominator is a very small ${wordSign(denSign)} number. The numerator \\(${c}\\) is ${wordSign(c)}. Combining those signs shows that the function approaches \\(${result>0?'\\infty':'-\\infty'}\\).`;
 return[
  problem('one_sided_rational_linked_left',`os-linked-rat-${a}-${n}-${c}-left`,`\\(\\displaystyle ${limit(a,'-')}${q}\\)`,inf(ls),explainSide('left',leftDenSign,ls),data),
  problem('one_sided_rational_linked_right',`os-linked-rat-${a}-${n}-${c}-right`,`\\(\\displaystyle ${limit(a,'+')}${q}\\)`,inf(rs),explainSide('right',rightDenSign,rs),data),
  problem('one_sided_rational_linked_two_sided',`os-linked-rat-${a}-${n}-${c}-both`,`\\(\\displaystyle ${limit(a)}${q}\\)`,ls===rs?inf(rs):dne(),ls===rs?`Both one-sided limits equal \\(${rs>0?'\\infty':'-\\infty'}\\), so the two-sided infinite limit has that value.`:`The left-hand limit is \\(${ls>0?'\\infty':'-\\infty'}\\), while the right-hand limit is \\(${rs>0?'\\infty':'-\\infty'}\\). Since they differ, the two-sided limit is DNE.`,data)
 ];
}

const generators={absolute:absoluteValue,rational,piecewise,endpoint};
function generate(focus='mixed'){const resolved=focus==='mixed'?pick(Object.keys(generators)):focus;return(generators[resolved]||generators.absolute)()}
window.BMUnit1OneSided={generate,sequence};
})();
