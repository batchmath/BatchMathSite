
(function(){
'use strict';
const R=()=>window.BatchMathRNG?.random?.() ?? 0.5;
const ri=(a,b)=>Math.floor(R()*(b-a+1))+a;
const pick=a=>a[Math.floor(R()*a.length)];
const nz=(a,b)=>{let x=0;while(x===0)x=ri(a,b);return x};
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};
const rat=(n,d=1)=>{if(d<0){n=-n;d=-d}const g=gcd(n,d);return[n/g,d/g]};
const texRat=(n,d=1)=>{const[a,b]=rat(n,d);return b===1?String(a):`\\frac{${a}}{${b}}`};
const fmt=(x)=>Number.isInteger(x)?String(x):String(Number(x.toFixed(4)));
const signed=(c,body,first=false)=>{if(c===0)return'';const a=Math.abs(c),core=(a===1&&body?'':a)+body;if(first)return(c<0?'-':'')+core;return(c<0?' - ':' + ')+core};
const poly2=(A,B,C)=>signed(A,'x^2',true)+signed(B,'x')+signed(C,'');
const poly3=(A,B,C,D)=>signed(A,'x^3',true)+signed(B,'x^2')+signed(C,'x')+signed(D,'');
const lin=(A,B,v='x')=>signed(A,v,true)+signed(B,'');
const xm=a=>a===0?'x':a>0?`x-${a}`:`x+${-a}`;
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function mc(id,variant,prompt,math,correct,wrongs,explanation){
  const norm=x=>String(x??'').trim().replace(/\s+/g,' ');
  const correctNorm=norm(correct);let vals=[],seen=new Set();
  for(const x of [correct,...wrongs]){if(x==null)continue;const v=norm(x);if(!v||seen.has(v))continue;seen.add(v);vals.push(v)}
  let k=1;
  while(vals.length<4){
    let x;
    if(/^[-+]?\d+(?:\.\d+)?$/.test(correctNorm))x=fmt(Number(correctNorm)+(k%2?1:-1)*Math.ceil(k/2));
    else if(/^x=[-+]?\d+(?:\.\d+)?$/.test(correctNorm)){const n=Number(correctNorm.slice(2));x=`x=${n+(k%2?1:-1)*Math.ceil(k/2)}`;}
    else if(/^y=/.test(correctNorm))x=`${correctNorm}${k%2?'+':'-'}${Math.ceil(k/2)}`;
    else {const fallbacks=['None of the other choices.','No solution.','Infinitely many solutions.','All of the other choices.'];x=fallbacks[(k-1)%fallbacks.length];}
    x=norm(x);if(!seen.has(x)){seen.add(x);vals.push(x)}k++;
  }
  vals=shuffle(vals.slice(0,4));
  const content=math?(String(math).trim().startsWith('<')?math:`<div>\\(${math}\\)</div>`):'';const choicesAreText=vals.some(v=>/[—]|\b(?:yes|no|none|all|solution|solutions|local|maximum|minimum|speeding|slowing|rest|rise|fall|intercept|asymptote|continuous|discontinuous|underestimate|overestimate|cannot|guaranteed|increasing|decreasing|concave|tangent|corner)\b/i.test(v));return{id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${content}</div>`,choices:vals,correctIndex:vals.findIndex(x=>norm(x)===correctNorm),choicesAreText,explanation};
}
function numChoices(ans,step=1){const a=typeof ans==='number'?ans:Number(ans);return [fmt(a+step),fmt(a-step),fmt(-a===a?a+2*step:-a)];}
function fracChoices(n,d){const c=texRat(n,d),[a,b]=rat(n,d);return[c,texRat(a+1,b),texRat(a-1||a+2,b),texRat(a,b+1)];}
function eqY(m,b){let out='y=';const mn=Array.isArray(m)?m[0]:m,md=Array.isArray(m)?m[1]:1;if(mn===0){if(Array.isArray(b))return out+texRat(b[0],b[1]);return out+String(b)}out+=mn===md?'x':mn===-md?'-x':`${texRat(mn,md)}x`;if(Array.isArray(b)){const[n,d]=b;if(n)out+=n<0?`-${texRat(-n,d)}`:`+${texRat(n,d)}`;}else if(b)out+=b<0?`${b}`:`+${b}`;return out}

const G={};

// UNIT 1
G['introduction-to-limits']=()=>{
  const a=ri(-4,4),L=ri(-7,7),fa=L+pick([-4,-3,3,4]);
  const rows=[[-.1,-.04],[-.01,-.005],[0,null],[.01,.006],[.1,.05]].map(([dx,e])=>[fmt(a+dx),dx===0?String(fa):fmt(L+e)]);
  const table=`<table><tr><th>x</th>${rows.map(r=>`<td>${r[0]}</td>`).join('')}</tr><tr><th>f(x)</th>${rows.map(r=>`<td>${r[1]}</td>`).join('')}</tr></table>`;
  return mc(`intro-${a}-${L}-${fa}`,'table_two_sided',`Use the table to estimate \\(\\lim_{x\\to${a}}f(x)\\).`,table,String(L),[String(fa),String(L+1),'DNE'],`The nearby values on both sides of \\(x=${a}\\) suggest \\(${L}\\), so the estimated limit is \\(${L}\\). The separate point value \\(f(${a})=${fa}\\) does not determine the limit. A finite table supports an estimate, not a proof.`)
};
G['sin-one-over-x']=()=>{
  const a=ri(-3,3),k=ri(1,5),kind=pick(['raw','scaled','cosraw','absraw']);
  const shift=a===0?'x':a>0?`x-${a}`:`x+${-a}`;
  if(kind==='scaled')return mc(`osc-scaled-${a}-${k}`,'bounded_times_zero','Find the limit.',`\\displaystyle\\lim_{x\\to${a}}(${shift})\\sin\\left(\\frac{${k}}{${shift}}\\right)`,'0',['1','-1','DNE'],`Because \\(|\\sin u|\\le1\\), the absolute value of the expression is at most \\(|${shift}|\\). As \\(x\\to${a}\\), this bound tends to \\(0\\), so the expression tends to \\(0\\) by the Squeeze Theorem.`);
  const f=kind==='cosraw'?'\\cos':kind==='absraw'?'|\\sin':'\\sin',close=kind==='absraw'?'|':'';
  return mc(`osc-${kind}-${a}-${k}`,'oscillating_dne','Find the limit.',`\\displaystyle\\lim_{x\\to${a}}${f}\\left(\\frac{${k}}{${shift}}\\right)${close}`,'DNE',['0','1','-1'],`Arbitrarily close to \\(x=${a}\\), the expression repeatedly takes ${kind==="absraw"?"both 0 and 1":"both -1 and 1"}. These distinct values persist, so there is no single limiting value. The limit is DNE.`)
};
function ivtGuaranteedValue(){
  const a=ri(-4,0),b=a+ri(2,6),fa=ri(-8,-1),fb=ri(2,9),target=ri(fa+1,fb-1);
  const wrong1=fb+ri(1,4),wrong2=fa-ri(1,4),wrong3='No value is guaranteed';
  const p=mc(`ivt-value-${a}-${b}-${fa}-${fb}-${target}`,'guaranteed_value',`Suppose \\(f\\) is continuous on \\([${a},${b}]\\). Which output value is guaranteed at some \\(c\\in(${a},${b})\\)?`,`f(${a})=${fa},\\qquad f(${b})=${fb}`,String(target),[String(wrong1),String(wrong2),wrong3],`The target satisfies \\(${fa}<${target}<${fb}\\). Since \\(f\\) is continuous on \\([${a},${b}]\\), IVT guarantees at least one \\(c\\in(${a},${b})\\) with \\(f(c)=${target}\\). The theorem guarantees the output, not the exact location of \\(c\\).`);
  p.ivtMode='value';
  return p;
}
function ivtRootVerification(){
  const kind=pick(['polynomial_yes','polynomial_no','rational_pole_outside_yes','rational_pole_inside_no']);
  const yes='Yes — f is continuous on the interval and the endpoint values have opposite signs.';
  const noDisc='No — f is not continuous on the entire interval.';
  const noSign='No — the endpoint values do not have opposite signs.';
  const badYes='Yes — being defined at both endpoints is enough to guarantee a root.';
  let p;
  if(kind==='polynomial_yes'){
    const r=ri(-3,3),left=r-ri(1,4),right=r+ri(1,4),m=pick([-3,-2,-1,1,2,3]),s=right+ri(1,4);
    const fa=m*(left-r)*(left-s)*(left-s),fb=m*(right-r)*(right-s)*(right-s);
    const f=`${m===1?'':m===-1?'-':m}(x${r===0?'':r>0?`-${r}`:`+${-r}`})(x${s===0?'':s>0?`-${s}`:`+${-s}`})^2`;
    p=mc(`ivt-root-poly-yes-${m}-${r}-${s}-${left}-${right}`,'root_polynomial_yes','Can the Intermediate Value Theorem be used to verify that f has at least one root on the given interval?',`f(x)=${f},\\qquad [${left},${right}]`,yes,[noDisc,noSign,badYes],`Yes. Polynomials are continuous for all real numbers. Here \\(f(${left})=${fa}\\) and \\(f(${right})=${fb}\\), which have opposite signs. Therefore IVT guarantees some \\(c\\in(${left},${right})\\) such that \\(f(c)=0\\).`);
    p.ivtQA={mode:'root',kind,continuous:true,signChange:true};
  }else if(kind==='polynomial_no'){
    const h=ri(-3,3),k=ri(1,6),left=h-ri(1,4),right=h+ri(1,4),A=ri(1,4);
    const fa=A*(left-h)**2+k,fb=A*(right-h)**2+k;
    const shift=h===0?'x':h>0?`x-${h}`:`x+${-h}`;
    p=mc(`ivt-root-poly-no-${A}-${h}-${k}-${left}-${right}`,'root_polynomial_no_sign_change','Can the Intermediate Value Theorem be used to verify that f has at least one root on the given interval?',`f(x)=${A===1?'':A}(${shift})^2+${k},\\qquad [${left},${right}]`,noSign,[yes,noDisc,badYes],`No. The polynomial is continuous, but \\(f(${left})=${fa}\\) and \\(f(${right})=${fb}\\) are both positive. The endpoint values do not straddle \\(0\\), so IVT does not verify a root on \\([${left},${right}]\\). In general, endpoints of the same sign do not rule out roots between them.`);
    p.ivtQA={mode:'root',kind,continuous:true,signChange:false};
  }else if(kind==='rational_pole_outside_yes'){
    const r=ri(-2,2),left=r-ri(1,4),right=r+ri(1,4),side=pick([-1,1]),c=side<0?left-ri(1,4):right+ri(1,4),m=pick([-3,-2,-1,1,2,3]);
    const fa=rat(m*(left-r),left-c),fb=rat(m*(right-r),right-c);
    const num=`${m===1?'':m===-1?'-':m}(x${r===0?'':r>0?`-${r}`:`+${-r}`})`,den=`x${c===0?'':c>0?`-${c}`:`+${-c}`}`;
    p=mc(`ivt-root-rat-out-${m}-${r}-${c}-${left}-${right}`,'root_rational_discontinuity_outside','Can the Intermediate Value Theorem be used to verify that f has at least one root on the given interval?',`f(x)=\\frac{${num}}{${den}},\\qquad [${left},${right}]`,yes,[noDisc,noSign,badYes],`Yes. The only discontinuity is at \\(x=${c}\\), which is outside \\([${left},${right}]\\), so \\(f\\) is continuous on the entire stated interval. Also \\(f(${left})=${texRat(fa[0],fa[1])}\\) and \\(f(${right})=${texRat(fb[0],fb[1])}\\) have opposite signs. IVT therefore guarantees a root in \\(( ${left},${right} )\\).`);
    p.ivtQA={mode:'root',kind,continuous:true,signChange:true,pole:c,left,right};
  }else{
    const c=ri(-2,2),left=c-ri(1,4),right=c+ri(1,4),m=pick([1,2,3,4]);
    const fa=rat(m,left-c),fb=rat(m,right-c),den=`x${c===0?'':c>0?`-${c}`:`+${-c}`}`;
    p=mc(`ivt-root-rat-in-${m}-${c}-${left}-${right}`,'root_rational_discontinuity_inside','Can the Intermediate Value Theorem be used to verify that f has at least one root on the given interval?',`f(x)=\\frac{${m}}{${den}},\\qquad [${left},${right}]`,noDisc,[yes,noSign,badYes],`No. Although \\(f(${left})=${texRat(fa[0],fa[1])}\\) and \\(f(${right})=${texRat(fb[0],fb[1])}\\) have opposite signs, \\(f\\) is discontinuous at \\(x=${c}\\), which lies inside \\([${left},${right}]\\). IVT cannot be applied on the whole interval.`);
    p.ivtQA={mode:'root',kind,continuous:false,signChange:true,pole:c,left,right};
  }
  p.ivtMode='root';
  p.choicesAreText=true;
  return p;
}
G['intermediate-value-theorem']=(opts={})=>{
  const requested=opts&&opts.mode?String(opts.mode):'mixed';
  const mode=requested==='mixed'?pick(['value','root']):requested;
  return mode==='root'?ivtRootVerification():ivtGuaranteedValue();
};

// UNIT 2 difference quotient
G['difference-quotient']=()=>{
  const kind=pick(['linear','quadratic','cubic','radical','reciprocal']);
  if(kind==='linear'){
    const A=nz(-7,7),B=ri(-9,9),correct=String(A);
    return mc(`dq-lin-${A}-${B}`,'linear_difference_quotient','Simplify the difference quotient.',`f(x)=${lin(A,B)},\\qquad \\frac{f(x+h)-f(x)}{h}`,correct,[String(-A),`${A}h`,`${lin(A,B)}`],`Substitute x+h, subtract f(x), and factor h. Everything cancels except ${A}.`)
  }
  if(kind==='quadratic'){
    const A=nz(-4,4),B=nz(-6,6),C=ri(-7,7),correct=`${signed(2*A,'x',true)}${signed(A,'h')}${signed(B,'')}`;
    const w1=`${signed(2*A,'x',true)}${signed(B,'')}`,w2=`${signed(A,'x',true)}${signed(A,'h')}${signed(B,'')}`,w3=`${signed(2*A,'x',true)}${signed(A,'h')}${signed(C,'')}`;
    return mc(`dq-quad-${A}-${B}-${C}`,'quadratic_difference_quotient','Simplify the difference quotient.',`f(x)=${poly2(A,B,C)},\\qquad \\frac{f(x+h)-f(x)}{h}`,correct,[w1,w2,w3],`Expand f(x+h), subtract f(x), factor out h, and cancel. The simplified quotient is ${correct}.`)
  }
  if(kind==='cubic'){
    const A=nz(-3,3),B=nz(-4,4),C=nz(-5,5),D=ri(-6,6);
    const correct=`${signed(3*A,'x^2',true)}${signed(3*A,'xh')}${signed(A,'h^2')}${signed(2*B,'x')}${signed(B,'h')}${signed(C,'')}`;
    const w1=`${signed(3*A,'x^2',true)}${signed(2*B,'x')}${signed(C,'')}`;
    const w2=`${signed(3*A,'x^2',true)}${signed(A,'xh')}${signed(A,'h^2')}${signed(2*B,'x')}${signed(C,'')}`;
    const w3=`${signed(3*A,'x^2',true)}${signed(3*A,'xh')}${signed(A,'h^2')}${signed(B,'x')}${signed(B,'h')}${signed(C,'')}`;
    return mc(`dq-cubic-${A}-${B}-${C}-${D}`,'cubic_difference_quotient','Simplify the difference quotient.',`f(x)=${poly3(A,B,C,D)},\\qquad \\frac{f(x+h)-f(x)}{h}`,correct,[w1,w2,w3],`Expand (x+h)^3 and (x+h)^2, subtract f(x), then factor and cancel h. The simplified quotient is ${correct}.`)
  }
  if(kind==='radical'){
    const c=ri(1,9),root=`\\sqrt{x+${c}}`,shift=`\\sqrt{x+h+${c}}`,correct=`\\frac{1}{${shift}+${root}}`;
    return mc(`dq-rad-${c}`,'radical_difference_quotient','Simplify the difference quotient.',`f(x)=${root},\\qquad \\frac{f(x+h)-f(x)}{h}`,correct,[`\\frac{1}{2${root}}`,`\\frac{h}{${shift}+${root}}`,`${shift}+${root}`],`Multiply by the conjugate. The numerator becomes h, which cancels the denominator h, leaving ${correct}.`)
  }
  const c=ri(1,8),k=nz(-5,5),den1=`x+${c}`,den2=`x+h+${c}`,num=Math.abs(k),finalCorrect=k<0?`\\frac{${num}}{(${den1})(${den2})}`:`-\\frac{${num}}{(${den1})(${den2})}`;
  const kh=k===1?'h':k===-1?'-h':`${k}h`,negKh=k===1?'-h':k===-1?'h':`${-k}h`;
  return mc(`dq-recip-${k}-${c}`,'reciprocal_difference_quotient','Simplify the difference quotient.',`f(x)=\\frac{${k}}{${den1}},\\qquad \\frac{f(x+h)-f(x)}{h}`,finalCorrect,[`\\frac{${k}}{(${den1})^2}`,`-\\frac{${Math.abs(k)}}{(${den1})^2}`,`\\frac{${kh}}{(${den1})(${den2})}`],`Combine the two fractions in the numerator. Their numerator is ${negKh}; cancel h to obtain ${finalCorrect}.`)
};

// UNIT 3
const psLine=(y0,m,a)=>{const ys=y0===0?'y':y0>0?`y-${y0}`:`y+${-y0}`;const xs=a===0?'x':a>0?`(x-${a})`:`(x+${-a})`;return `${ys}=${m}${xs}`};
const shifted=(v,h)=>h===0?v:h>0?`${v}-${h}`:`${v}+${-h}`;
G['equations-of-tangent-and-normal-lines']=()=>{
  const family=pick(['quadratic','cubic','radical','reciprocal','exponential','logarithmic','sine','cosine']),which=pick(['tangent','normal']);
  let f,a,y,m,nm,variant;
  if(family==='quadratic'){const A=nz(-3,3),B=nz(-5,5),C=ri(-6,6);a=ri(-3,3);y=A*a*a+B*a+C;m=rat(2*A*a+B);f=poly2(A,B,C);variant='quadratic'}
  else if(family==='cubic'){const A=nz(-2,2),B=nz(-3,3),C=nz(-4,4),D=ri(-5,5);a=ri(-2,2);y=A*a**3+B*a*a+C*a+D;m=rat(3*A*a*a+2*B*a+C);f=poly3(A,B,C,D);variant='cubic'}
  else if(family==='radical'){const r=ri(2,6),c=ri(0,6),d=ri(-4,4);a=r*r-c;y=r+d;m=rat(1,2*r);f=`\\sqrt{x${c?`+${c}`:''}}${signed(d,'')}`;variant='radical'}
  else if(family==='reciprocal'){const c=ri(-4,4),k=nz(-5,5),d=ri(-4,4);a=1-c;y=k+d;m=rat(-k);f=`\\frac{${k}}{x${c===0?'':c>0?`+${c}`:`-${-c}`}}${signed(d,'')}`;variant='reciprocal'}
  else if(family==='exponential'){const d=ri(-4,4);a=0;y=1+d;m=rat(1);f=`e^x${signed(d,'')}`;variant='exponential'}
  else if(family==='logarithmic'){const d=ri(-4,4);a=1;y=d;m=rat(1);f=`\\ln x${signed(d,'')}`;variant='logarithmic'}
  else if(family==='sine'){a=0;y=0;m=rat(1);f='\\sin x';variant='trigonometric_sine'}
  else {a=0;y=1;m=rat(0);f='\\cos x';variant='trigonometric_cosine'}
  const mtex=texRat(m[0],m[1]);
  const tangent=m[0]===0?`y=${y}`:psLine(y,mtex,a);
  if(m[0]===0)nm=null;else nm=rat(-m[1],m[0]);
  const normal=m[0]===0?`x=${a}`:psLine(y,texRat(nm[0],nm[1]),a);
  const correct=which==='tangent'?tangent:normal,wrongs=which==='tangent'?[normal,`y=${y}`,m[0]===0?`x=${a}`:psLine(y,texRat(-m[0],m[1]),a)]:[tangent,`y=${y}`,m[0]===0?`x=${y}`:psLine(y,texRat(m[1],m[0]),a)];
  return mc(`tn-${variant}-${a}-${y}-${m[0]}-${m[1]}-${which}`,`${variant}_${which}`,`Find the equation of the ${which} line.`,`f(x)=${f}\\quad\\text{at }x=${a}`,correct,wrongs,`At x=${a}, the point is (${a},${y}) and the tangent slope is ${mtex}. ${which==='normal'?(m[0]===0?'A horizontal tangent has a vertical normal.':`The normal slope is the negative reciprocal, ${texRat(nm[0],nm[1])}.`):'Use the derivative as the tangent slope.'}`)
};
G['horizontal-and-vertical-tangent-lines']=()=>{
  const k=ri(1,6),h=ri(-5,5),A=ri(1,4),c=ri(-6,6),kind=pick(['horizontal','vertical']);
  const u=xm(h);
  if(kind==='horizontal'){
    const x1=h-k,x2=h+k,correct=`x=${x1}, ${x2}`;
    const f=`${A===1?'':A}${u}^3${signed(-3*A*k*k,u)}${signed(c,'')}`;
    return mc(`hv-h-${k}-${h}-${A}-${c}`,'horizontal_polynomial','Find all x-values where the graph has a horizontal tangent.',`f(x)=${f}`,correct,[`x=${h}`,`x=${x1}`,`x=${x2}`],`f'(x)=${3*A}[${u}^2-${k*k}], so f'(x)=0 when x=${x1} or x=${x2}.`)
  }
  return mc(`hv-v-${h}-${A}-${c}`,'vertical_cube_root','At which x-value does the graph have a vertical tangent?',`f(x)=${A===1?'':A}\\sqrt[3]{${u}}${signed(c,'')}`,`x=${h}`,[`x=${-h}`,`x=${h+1}`,'There is no vertical tangent'],`The derivative contains ${u}^{-2/3}, whose magnitude becomes unbounded at x=${h}.`)
};
G['horizontal-and-vertical-tangent-lines-implicitly']=()=>{
  const A=ri(1,4),B=ri(1,4),a=ri(1,6),b=ri(1,6),K=A*a*a+B*b*b,kind=pick(['slope','horizontal','vertical']);
  if(kind==='slope'){const correct=texRat(-A*a,B*b);return mc(`ihv-s-${A}-${B}-${a}-${b}`,'implicit_slope','Find dy/dx at the given point.',`${A===1?'':A}x^2+${B===1?'':B}y^2=${K}\\quad\\text{at }(${a},${b})`,correct,[texRat(A*a,B*b),texRat(-B*b,A*a),texRat(B*b,A*a)],`Implicit differentiation gives ${2*A}x+${2*B}y y'=0, so y'=${correct}.`)}
  if(kind==='horizontal')return mc(`ihv-h-${A}-${B}-${K}`,'implicit_horizontal','Where can horizontal tangents occur on this ellipse?',`${A===1?'':A}x^2+${B===1?'':B}y^2=${K}`,'x=0',['y=0','x=y','Nowhere'],`Since y'=-${A}x/(${B}y), the slope is 0 when x=0 and y is nonzero.`);
  return mc(`ihv-v-${A}-${B}-${K}`,'implicit_vertical','Where can vertical tangents occur on this ellipse?',`${A===1?'':A}x^2+${B===1?'':B}y^2=${K}`,'y=0',['x=0','x=y','Nowhere'],`Since y'=-${A}x/(${B}y), the derivative is undefined with nonzero numerator when y=0.`)
};
G['motion']=()=>{
  const kind=pick(['velocity','speed','acceleration']),family=pick(['cubic','quartic','trig','exponential','radical']);
  let q,v,a,variant,id;
  if(family==='cubic'){const A=nz(-3,3),B=nz(-5,5),C=nz(-6,6),D=ri(-5,5),t=ri(0,4);q=`s(t)=${signed(A,'t^3',true)}${signed(B,'t^2')}${signed(C,'t')}${signed(D,'')},\\quad t=${t}`;v=rat(3*A*t*t+2*B*t+C);a=rat(6*A*t+2*B);variant='cubic_position';id=`${A}-${B}-${C}-${D}-${t}`}
  else if(family==='quartic'){const A=nz(-2,2),B=nz(-3,3),C=nz(-4,4),t=ri(0,3);q=`s(t)=${signed(A,'t^4',true)}${signed(B,'t^2')}${signed(C,'t')},\\quad t=${t}`;v=rat(4*A*t**3+2*B*t+C);a=rat(12*A*t*t+2*B);variant='quartic_position';id=`${A}-${B}-${C}-${t}`}
  else if(family==='trig'){const A=nz(-6,6),B=nz(-4,4),point=pick(['0','pi2']);if(point==='0'){q=`s(t)=${A===1?'':A}\\sin t${signed(B,'t')},\\quad t=0`;v=rat(A+B);a=rat(0)}else{q=`s(t)=${A===1?'':A}\\sin t${signed(B,'t')},\\quad t=\\frac{\\pi}{2}`;v=rat(B);a=rat(-A)}variant='trigonometric_position';id=`${A}-${B}-${point}`}
  else if(family==='exponential'){const A=nz(-5,5),B=nz(-4,4);q=`s(t)=${A===1?'':A}e^t${signed(B,'t')},\\quad t=0`;v=rat(A+B);a=rat(A);variant='exponential_position';id=`${A}-${B}`}
  else {const r=ri(2,6),c=ri(0,5),A=nz(-6,6),t=r*r-c;q=`s(t)=${A===1?'':A}\\sqrt{t${c?`+${c}`:''}},\\quad t=${t}`;v=rat(A,2*r);a=rat(-A,4*r**3);variant='radical_position';id=`${A}-${r}-${c}`}
  const ansRat=kind==='acceleration'?a:kind==='speed'?rat(Math.abs(v[0]),v[1]):v,ans=texRat(ansRat[0],ansRat[1]);
  const distract=[texRat(-ansRat[0],ansRat[1]),texRat(ansRat[0]+ansRat[1],ansRat[1]),kind==='acceleration'?texRat(v[0],v[1]):texRat(a[0],a[1])];
  return mc(`motion-${variant}-${id}-${kind}`,`${variant}_${kind}`,`Find the particle's ${kind}.`,q,ans,distract,kind==='acceleration'?`Acceleration is s''(t). The value is ${ans}.`:kind==='speed'?`Velocity is s'(t)=${texRat(v[0],v[1])}. Speed is |v(t)|, so the speed is ${ans}.`:`Velocity is s'(t), which gives ${ans}.`)
};
G['absolute-and-local-extrema-and-the-extreme-value-theorem']=()=>{
  const family=pick(['quadratic_up','quadratic_down','cubic','sine','absolute_value','reciprocal']),kind=pick(['max','min']);
  if(family==='quadratic_up'||family==='quadratic_down'){
    const A=(family==='quadratic_up'?1:-1)*ri(1,4),h=ri(-3,3),k=ri(-6,6),L=ri(1,4),R=ri(L+1,L+5),left=h-L,right=h+R,vertex=k,fl=A*L*L+k,fr=A*R*R+k;const vals=[vertex,fl,fr],ans=kind==='max'?Math.max(...vals):Math.min(...vals);
    return mc(`ext-q-${A}-${h}-${k}-${L}-${R}-${kind}`,`${family}_${kind}`,`Find the absolute ${kind} value on the closed interval.`,`f(x)=${A===1?'':A===-1?'-':A}(${xm(h)})^2${signed(k,'')}\\quad\\text{on }[${left},${right}]`,String(ans),[String(vertex),String(fl),String(fr)],`Check the critical point x=${h} and both endpoints. Their values are ${vertex}, ${fl}, and ${fr}; the absolute ${kind} is ${ans}.`)
  }
  if(family==='cubic'){const k=ri(1,4),scale=ri(1,3),M=2*scale*k**3,m=-2*scale*k**3,ans=kind==='max'?M:m;return mc(`ext-cubic-${scale}-${k}-${kind}`,'cubic_closed_interval_'+kind,`Find the absolute ${kind} value.`,`f(x)=${scale===1?'':scale}(x^3-${3*k*k}x)\\quad\\text{on }[${-2*k},${2*k}]`,String(ans),[String(-ans),String(scale*k**3),String(0)],`Critical points occur at x=±${k}. Comparing them with the endpoints gives absolute maximum ${M} and absolute minimum ${m}.`)}
  if(family==='sine'){const A=ri(1,6),B=ri(-5,5),ans=kind==='max'?B+A:B-A;return mc(`ext-sin-${A}-${B}-${kind}`,'trig_closed_interval_'+kind,`Find the absolute ${kind} value.`,`f(x)=${A===1?'':A}\\sin x${signed(B,'')}\\quad\\text{on }[0,2\\pi]`,String(ans),[String(kind==='max'?B-A:B+A),String(B),String(A)],`On [0,2π], sin x ranges from -1 to 1. Therefore f ranges from ${B-A} to ${B+A}.`)}
  if(family==='absolute_value'){const A=ri(1,5),h=ri(-4,4),k=ri(-5,5),L=ri(2,5),R=ri(2,5),left=h-L,right=h+R,edge=k+A*Math.max(L,R),ans=kind==='min'?k:edge;return mc(`ext-abs-${A}-${h}-${k}-${L}-${R}-${kind}`,'absolute_value_'+kind,`Find the absolute ${kind} value.`,`f(x)=${A===1?'':A}|${xm(h)}|${signed(k,'')}\\quad\\text{on }[${left},${right}]`,String(ans),[String(k),String(edge),String(k+A*Math.min(L,R))],`The vertex gives ${k}; the farther endpoint gives ${edge}. Compare them to find the absolute ${kind}.`)}
  const K=ri(2,12),a=ri(1,5),b=a+ri(2,6),va=texRat(K,a),vb=texRat(K,b),ans=kind==='max'?va:vb;return mc(`ext-rec-${K}-${a}-${b}-${kind}`,'reciprocal_'+kind,`Find the absolute ${kind} value.`,`f(x)=\\frac{${K}}x\\quad\\text{on }[${a},${b}]`,ans,[kind==='max'?vb:va,String(K),texRat(K,a+b)],`On this positive interval, ${K}/x is decreasing. Thus the maximum is at x=${a} and the minimum is at x=${b}.`)
};
G['increasing-decreasing-intervals-concavity-and-extrema']=()=>{
  const family=pick(['increasing','decreasing','local_extrema','concave_up','concave_down','inflection','second_derivative_max','second_derivative_min']);
  if(['increasing','decreasing','local_extrema'].includes(family)){
    let r1=ri(-7,0),r2=ri(r1+1,7);const fp=`f'(x)=(${xm(r1)})(${xm(r2)})`;
    if(family==='increasing')return mc(`analysis-inc-${r1}-${r2}`,'increasing_intervals','Where is f increasing?',fp,`(-\\infty,${r1})\\cup(${r2},\\infty)`,[`(${r1},${r2})`,`(-\\infty,${r2})`,`(${r1},\\infty)`],`f'>0 outside the two zeros.`);
    if(family==='decreasing')return mc(`analysis-dec-${r1}-${r2}`,'decreasing_intervals','Where is f decreasing?',fp,`(${r1},${r2})`,[`(-\\infty,${r1})\\cup(${r2},\\infty)`,`(-\\infty,${r1})`,`(${r2},\\infty)`],`f'<0 between the two zeros.`);
    const p=mc(`analysis-ext-${r1}-${r2}`,'local_extrema_from_derivative','Classify the critical points.',fp,`Local maximum at x=${r1}; local minimum at x=${r2}`,[`Local minimum at x=${r1}; local maximum at x=${r2}`,`Local maxima at both points`,`Neither point is an extremum`],`f' changes + to - at ${r1} and - to + at ${r2}.`);p.choicesAreText=true;return p;
  }
  if(['concave_up','concave_down','inflection'].includes(family)){
    const c=ri(-6,6),A=pick([-4,-3,-2,-1,1,2,3,4]),fpp=`f''(x)=${A}(${xm(c)})`;
    if(family==='inflection')return mc(`analysis-inf-${A}-${c}`,'inflection_point','At which x-value does f have a point of inflection?',fpp,`x=${c}`,[`x=${-c}`,'There is no inflection point',`x=${c+1}`],`f'' changes sign at x=${c}.`);
    const up=A>0?`(${c},\\infty)`:`(-\\infty,${c})`,down=A>0?`(-\\infty,${c})`:`(${c},\\infty)`,ans=family==='concave_up'?up:down;
    return mc(`analysis-conc-${A}-${c}-${family}`,family==='concave_up'?'concave_up_intervals':'concave_down_intervals',`Where is f ${family==='concave_up'?'concave up':'concave down'}?`,fpp,ans,[family==='concave_up'?down:up,`(-\\infty,\\infty)`,`(${c-1},${c+1})`],`Concavity is determined by the sign of f''.`)
  }
  const c=ri(-5,5),fp0='f\'(c)=0',v=ri(1,7),max=family==='second_derivative_max',fpp=max?-v:v;const p=mc(`analysis-sdt-${c}-${v}-${family}`,family,`At x=${c}, f'(x)=0 and f''(${c})=${fpp}. What can be concluded?`,'',max?`f has a local maximum at x=${c}`:`f has a local minimum at x=${c}`,[max?`f has a local minimum at x=${c}`:`f has a local maximum at x=${c}`,`f has a point of inflection at x=${c}`,'No conclusion is possible'],`Because f'(${c})=0 and f''(${c}) is ${fpp<0?'negative':'positive'}, the second derivative test gives a local ${max?'maximum':'minimum'}.`);p.choicesAreText=true;return p;
};
G['graphing-functions']=()=>{
  const a=ri(-8,-1),b=ri(1,8),shape=pick(['maxmin','concavity']);
  if(shape==='maxmin'){const p=mc(`gf-mm-${a}-${b}`,'derivative_sign_features','Use the derivative information to identify the local extrema.',`f'(x)>0\\text{ on }(-\\infty,${a})\\cup(${b},\\infty),\\qquad f'(x)<0\\text{ on }(${a},${b})`,`Local maximum at x=${a}; local minimum at x=${b}`,[`Local minimum at x=${a}; local maximum at x=${b}`,`Local maxima at both points`,`No local extrema`],`A + to - change in f' gives a local maximum; a - to + change gives a local minimum.`);p.choicesAreText=true;return p;}
  const p=mc(`gf-c-${a}`,'second_derivative_sign','Use the second-derivative information to identify the feature.',`f''(x)<0\\text{ on }(-\\infty,${a}),\\qquad f''(x)>0\\text{ on }(${a},\\infty)`,`An inflection point at x=${a}`,[`A local maximum at x=${a}`,`A local minimum at x=${a}`,`A vertical tangent at x=${a}`],`A sign change in f'' means the concavity changes, so f has an inflection point.`);p.choicesAreText=true;return p;
};
G['linearization-and-differentials']=()=>{
  const family=pick(['square_root','cube_root','fourth_root','sine','tangent','differential_power','differential_trig']);
  if(family==='square_root'){const r=ri(2,10),a=r*r,d=pick([-2,-1,1,2]),correct=texRat(2*a+d,2*r);return mc(`lin-sqrt-${r}-${d}`,'square_root_linearization','Use linearization to approximate the indicated value.',`f(x)=\\sqrt{x},\\quad a=${a},\\quad \\sqrt{${a+d}}`,correct,[texRat(2*a-d,2*r),String(r+d),texRat(a+d,r)],`L(x)=${r}+\\frac1{${2*r}}(x-${a}). Substitution gives ${correct}.`)}
  if(family==='cube_root'){const r=ri(2,6),a=r**3,d=pick([-3,-1,1,3]),correct=texRat(3*a+d,3*r*r);return mc(`lin-cbrt-${r}-${d}`,'cube_root_linearization','Use linearization to approximate the indicated value.',`f(x)=\\sqrt[3]{x},\\quad a=${a},\\quad \\sqrt[3]{${a+d}}`,correct,[texRat(3*a-d,3*r*r),String(r+d),texRat(a+d,r*r)],`f'(${a})=1/${3*r*r}, so L(${a+d})=${correct}.`)}
  if(family==='fourth_root'){const r=ri(2,4),a=r**4,d=pick([-2,-1,1,2]),correct=texRat(4*a+d,4*r**3);return mc(`lin-4rt-${r}-${d}`,'fourth_root_linearization','Use linearization to approximate the indicated value.',`f(x)=\\sqrt[4]{x},\\quad a=${a},\\quad \\sqrt[4]{${a+d}}`,correct,[texRat(4*a-d,4*r**3),String(r+d),texRat(a+d,r**3)],`f'(${a})=1/${4*r**3}, so the linear approximation is ${correct}.`)}
  if(family==='sine'||family==='tangent'){const h=pick([0.05,0.1,0.2,-0.1]),fn=family==='sine'?'\\sin':'\\tan',correct=fmt(h);return mc(`lin-trig-${family}-${h}`,`${family}_linearization`,`Use the linearization at x=0 to approximate the value.`,`${fn}(${h})`,correct,[fmt(-h),fmt(1+h),fmt(h*h)],`At 0, both sin x and tan x have value 0 and derivative 1, so L(x)=x.`)}
  if(family==='differential_power'){const n=pick([2,3,4]),x=ri(1,5),dx=pick([0.01,0.02,-0.01]),dy=n*x**(n-1)*dx;return mc(`diff-pow-${n}-${x}-${dx}`,'differential_power','Use differentials to estimate dy.',`y=x^{${n}},\\quad x=${x},\\quad dx=${dx}`,fmt(dy),[fmt(-dy),fmt(n*x*dx),fmt(dy+dx)],`dy=f'(x)dx=${n*x**(n-1)}(${dx})=${fmt(dy)}.`)}
  const x=pick([0,Math.PI/2]),dx=pick([0.01,-0.02,0.05]),useSin=x===0,fn=useSin?'\\sin x':'\\cos x',der=useSin?1:-1,dy=der*dx;return mc(`diff-trig-${useSin?'sin':'cos'}-${dx}`,'differential_trig','Use differentials to estimate dy.',`y=${fn},\\quad x=${useSin?'0':'\\frac{\\pi}{2}'},\\quad dx=${dx}`,fmt(dy),[fmt(-dy),fmt(dx*dx),'0'],`dy=f'(x)dx=${der}(${dx})=${fmt(dy)}.`)
};
function approximationProblem(id,variant,prompt,math,approx,actual,explanation){
  const classification=approx<actual?'under':'over';return{id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div><div>\\(${math}\\)</div></div>`,answerType:'approx-classification',numericAnswer:fmt(approx),numericTolerance:0.0006,classification,explanation:`${explanation} Since the approximation ${fmt(approx)} is ${approx<actual?'less':'greater'} than the actual value ${fmt(actual)}, it is an ${classification}estimate.`};
}
G['tangent-and-secant-line-approximations']=()=>{
  const method=pick(['tangent','secant']),family=pick(['quadratic_up','quadratic_down','cubic','square_root','reciprocal']);
  if(method==='tangent'){
    if(family==='quadratic_up'||family==='quadratic_down'){const A=(family==='quadratic_up'?1:-1)*ri(1,3),B=nz(-4,4),C=ri(-5,5),a=ri(-2,2),h=pick([0.5,1]),f=x=>A*x*x+B*x+C,fp=x=>2*A*x+B,target=a+h,approx=f(a)+fp(a)*h,actual=f(target);return approximationProblem(`tsa-t-q-${A}-${B}-${C}-${a}-${h}`,`tangent_${family}`,`Use the tangent line at x=${a} to approximate f(${target}). Then classify the approximation.`,`f(x)=${poly2(A,B,C)}`,approx,actual,`L(${target})=f(${a})+f'(${a})(${h})=${fmt(approx)}.`)}
    if(family==='cubic'){const a=pick([-2,-1,1,2]),h=pick([0.25,0.5]),A=pick([1,-1]),f=x=>A*x**3,fp=x=>3*A*x*x,target=a+h,approx=f(a)+fp(a)*h,actual=f(target);return approximationProblem(`tsa-t-c-${A}-${a}-${h}`,'tangent_cubic',`Use the tangent line at x=${a} to approximate f(${fmt(target)}). Then classify the approximation.`,`f(x)=${A===1?'':'-'}x^3`,approx,actual,`The tangent-line value is ${fmt(approx)}.`)}
    if(family==='square_root'){const r=ri(2,6),a=r*r,h=pick([1,2,-1]),target=a+h,actual=Math.sqrt(target),approx=r+h/(2*r),step=h>=0?`${r}+${h}/(${2*r})`:`${r}-${-h}/(${2*r})`;return approximationProblem(`tsa-t-root-${r}-${h}`,'tangent_square_root',`Use the tangent line at x=${a} to approximate f(${target}). Then classify the approximation.`,`f(x)=\\sqrt{x}`,approx,actual,`L(${target})=${step}=${fmt(approx)}.`)}
    const a=ri(2,6),h=pick([0.5,1]),target=a+h,actual=1/target,approx=1/a-h/(a*a);return approximationProblem(`tsa-t-rec-${a}-${h}`,'tangent_reciprocal',`Use the tangent line at x=${a} to approximate f(${fmt(target)}). Then classify the approximation.`,`f(x)=\\frac1x`,approx,actual,`L(${fmt(target)})=1/${a}-${h}/${a*a}=${fmt(approx)}.`)
  }
  if(family==='quadratic_up'||family==='quadratic_down'){const A=(family==='quadratic_up'?1:-1)*ri(1,3),B=nz(-4,4),C=ri(-5,5),left=ri(-3,0),right=left+pick([2,4]),target=(left+right)/2,f=x=>A*x*x+B*x+C,approx=(f(left)+f(right))/2,actual=f(target);return approximationProblem(`tsa-s-q-${A}-${B}-${C}-${left}-${right}`,`secant_${family}`,`Use the secant line through x=${left} and x=${right} to approximate f(${target}). Then classify the approximation.`,`f(x)=${poly2(A,B,C)}`,approx,actual,`At the midpoint, the secant-line value is the average of the endpoint values, ${fmt(approx)}.`)}
  if(family==='square_root'){const left=pick([1,4,9]),right=left+pick([3,5,7]),target=(left+right)/2,f=Math.sqrt,approx=(f(left)+f(right))/2,actual=f(target);return approximationProblem(`tsa-s-root-${left}-${right}`,'secant_square_root',`Use the secant line through x=${left} and x=${right} to approximate f(${fmt(target)}). Then classify the approximation.`,`f(x)=\\sqrt{x}`,approx,actual,`At the midpoint, use the average of the endpoint function values.`)}
  const left=ri(1,4),right=left+ri(2,4),target=(left+right)/2,f=x=>1/x,approx=(f(left)+f(right))/2,actual=f(target);return approximationProblem(`tsa-s-rec-${left}-${right}`,'secant_reciprocal',`Use the secant line through x=${left} and x=${right} to approximate f(${fmt(target)}). Then classify the approximation.`,`f(x)=\\frac1x`,approx,actual,`At the midpoint, the secant-line value is the average of f(${left}) and f(${right}).`)
};
G['rolle-s-theorem-and-the-mean-value-theorem']=()=>{
  const family=pick(['mvt_quadratic','mvt_reciprocal','mvt_radical','mvt_cubic','rolle_quadratic','rolle_sine','rolle_cosine']);
  if(family==='mvt_quadratic'){const a=ri(-4,0),b=a+ri(2,6),A=nz(1,4),B=nz(-5,5),c=texRat(a+b,2);return mc(`mvt-q-${A}-${B}-${a}-${b}`,'mvt_quadratic','Find all c-values guaranteed by the Mean Value Theorem.',`f(x)=${A}x^2${signed(B,'x')}\\quad\\text{on }[${a},${b}]`,c,[String(a),String(b),texRat(a+b+2,2)],`Solve f'(c)=[f(b)-f(a)]/(b-a), giving c=${c}.`)}
  if(family==='mvt_reciprocal'){const a=pick([1,2,3]),r=pick([2,3]),b=a*r*r,c=`${r===1?'':r}\\sqrt{${a*a===1?'':a*a}}`;const actual=Math.sqrt(a*b),ans=Number.isInteger(actual)?String(actual):`\\sqrt{${a*b}}`;return mc(`mvt-rec-${a}-${b}`,'mvt_reciprocal','Find the c-value guaranteed by the Mean Value Theorem.',`f(x)=\\frac1x\\quad\\text{on }[${a},${b}]`,ans,[String(a),String(b),texRat(a+b,2)],`The secant slope is -1/(ab). Setting -1/c²=-1/(ab) gives c=√(ab)=${ans}.`)}
  if(family==='mvt_radical'){const p=ri(1,4),q=p+ri(1,4),a=p*p,b=q*q,c=texRat((p+q)**2,4);return mc(`mvt-root-${p}-${q}`,'mvt_square_root','Find the c-value guaranteed by the Mean Value Theorem.',`f(x)=\\sqrt{x}\\quad\\text{on }[${a},${b}]`,c,[String(a),String(b),texRat(a+b,2)],`The secant slope is 1/(${p+q}). Set 1/(2√c)=1/(${p+q}), giving c=${c}.`)}
  if(family==='mvt_cubic'){const a=ri(1,5);const ans=`c=\\pm\\frac{${a}}{\\sqrt3}`;return mc(`mvt-cubic-${a}`,'mvt_cubic','Find all c-values that satisfy the Mean Value Theorem conclusion.',`f(x)=x^3\\quad\\text{on }[-${a},${a}]`,ans,[`c=0`,`c=\\pm${a}`,`c=\\frac{${a}}2`],`The secant slope is ${a*a}. Solve 3c²=${a*a}, giving ${ans}.`)}
  if(family==='rolle_sine')return mc('rolle-sin','rolle_trigonometric_sine',`Rolle's Theorem applies. Find c.`,`f(x)=\\sin x\\quad\\text{on }[0,\\pi]`,`c=\\frac{\\pi}{2}`,[`c=0`,`c=\\pi`,`c=\\frac{\\pi}{4}`],`f'(x)=cos x, which is 0 at π/2.`);
  if(family==='rolle_cosine')return mc('rolle-cos','rolle_trigonometric_cosine',`Rolle's Theorem applies. Find c.`,`f(x)=\\cos x\\quad\\text{on }[-\\frac{\\pi}{2},\\frac{\\pi}{2}]`,`c=0`,[`c=\\frac{\\pi}{2}`,`c=-\\frac{\\pi}{2}`,`c=\\pi`],`The endpoint values agree and f'(x)=-sin x=0 at c=0.`);
  const h=ri(-3,3),r=ri(1,4),left=h-r,right=h+r;return mc(`rolle-q-${h}-${r}`,'rolle_quadratic',`Rolle's Theorem applies. Find c.`,`f(x)=(${xm(h)})^2\\quad\\text{on }[${left},${right}]`,`c=${h}`,[`c=${left}`,`c=${right}`,`c=${h+1}`],`f'(x)=2(${xm(h)}), so f'(c)=0 at c=${h}.`)
};
G['l-hopital-s-rule']=()=>{
  const family=pick(['exp_first','log_first','sin_first','tan_first','cos_second','exp_second','poly_second','poly_exp_second','log_infinity']);
  if(family==='exp_first'){const k=ri(1,10);return mc(`lh-e1-${k}`,'one_application_exponential','Evaluate using L’Hôpital’s Rule.',`\\displaystyle\\lim_{x\\to0}\\frac{e^{${k}x}-1}{x}`,String(k),[String(k+1),'0','1'],`One application gives ${k}e^{${k}x}, so the limit is ${k}.`)}
  if(family==='log_first'){const k=ri(1,10);return mc(`lh-l1-${k}`,'one_application_logarithm','Evaluate using L’Hôpital’s Rule.',`\\displaystyle\\lim_{x\\to0}\\frac{\\ln(1+${k}x)}{x}`,String(k),[String(k+1),'0','1'],`One application gives ${k}/(1+${k}x), so the limit is ${k}.`)}
  if(family==='sin_first'||family==='tan_first'){const k=ri(1,10),fn=family==='sin_first'?'\\sin':'\\tan';return mc(`lh-trig1-${family}-${k}`,family==='sin_first'?'one_application_sine':'one_application_tangent','Evaluate using L’Hôpital’s Rule.',`\\displaystyle\\lim_{x\\to0}\\frac{${fn}(${k}x)}{x}`,String(k),[String(-k),'0','1'],`Differentiate numerator and denominator once; the trig factor approaches 1, leaving ${k}.`)}
  if(family==='cos_second'){const k=ri(1,8),ans=texRat(k*k,2);return mc(`lh-c2-${k}`,'two_applications_cosine','Evaluate using L’Hôpital’s Rule.',`\\displaystyle\\lim_{x\\to0}\\frac{1-\\cos(${k}x)}{x^2}`,ans,[String(k*k),String(k),texRat(k,2)],`The first application is still 0/0. Applying L’Hôpital a second time gives ${k*k}cos(${k}x)/2 → ${ans}.`)}
  if(family==='exp_second'){const k=ri(1,8),ans=texRat(k*k,2);return mc(`lh-e2-${k}`,'two_applications_exponential','Evaluate using L’Hôpital’s Rule.',`\\displaystyle\\lim_{x\\to0}\\frac{e^{${k}x}-1-${k}x}{x^2}`,ans,[String(k*k),String(k),texRat(k,2)],`After one differentiation the form is still 0/0. Differentiate again to obtain ${k*k}e^{${k}x}/2 → ${ans}.`)}
  if(family==='poly_second'){const a=ri(1,10),b=ri(1,10);return mc(`lh-p2-${a}-${b}`,'two_applications_polynomial_infinity','Evaluate using L’Hôpital’s Rule.',`\\displaystyle\\lim_{x\\to\\infty}\\frac{${a}x^2+1}{${b}x^2-3}`,texRat(a,b),[texRat(2*a,b),texRat(a,2*b),'0'],`The first derivative still gives ∞/∞; the second gives ${2*a}/${2*b}=${texRat(a,b)}.`)}
  if(family==='poly_exp_second'){const k=ri(1,5);return mc(`lh-x2exp-${k}`,'two_applications_polynomial_over_exponential','Evaluate using L’Hôpital’s Rule.',`\\displaystyle\\lim_{x\\to\\infty}\\frac{x^2}{e^{${k}x}}`,'0',['1',String(k),'∞'],`Apply L’Hôpital twice: 2x/(${k}e^{${k}x}) then 2/(${k*k}e^{${k}x}), which approaches 0.`)}
  return mc('lh-loginf','one_application_log_over_linear','Evaluate using L’Hôpital’s Rule.',`\\displaystyle\\lim_{x\\to\\infty}\\frac{\\ln x}{x}`,'0',['1','∞','DNE'],`One application gives (1/x)/1, which approaches 0.`)
};
G['optimization']=()=>{
  const family=pick(['rectangle','river','open_box','hotel','orchard','open_cylinder','closest_point','two_poles','ships']);
  if(family==='rectangle'){const P=4*ri(3,20),s=P/4,area=s*s;return mc(`opt-rect-${P}`,'rectangle_fixed_perimeter',`A rectangle has perimeter ${P}. What is the maximum possible area?`,'',String(area),[String(area+s),String(P*P/8),String(s)],`The area is maximized by a square with side ${s}, so A=${area}.`)}
  if(family==='river'){const F=4*ri(5,25),x=F/4,y=F/2,area=x*y;return mc(`opt-river-${F}`,'three_side_fence',`A rectangular pen uses ${F} units of fencing on three sides, with the fourth side along a river. What is the maximum area?`,'',String(area),[String(F*F/16),String(F*F/4),String(area/2)],`A=x(${F}-2x) is maximized at x=${x}, y=${y}, giving area ${area}.`)}
  if(family==='open_box'){const m=ri(2,8),L=6*m,x=m,V=x*(L-2*x)**2;return mc(`opt-box-${L}`,'open_top_box',`Squares are cut from each corner of a ${L} by ${L} sheet and the sides are folded up. What cut size maximizes the box volume?`,'',String(x),[String(2*x),String(L/4),String(L/3)],`V=x(${L}-2x)^2. The interior critical point giving the maximum is x=${L}/6=${x}.`)}
  if(family==='hotel'){const base=pick([20,30,40]),target=base+ri(5,15),price=2*target-base;return mc(`opt-hotel-${base}-${price}`,'hotel_revenue',`A hotel charges $${price} per room for ${base} rooms. For each room rented beyond ${base}, the price of every room is reduced by $1. How many rooms maximize daily revenue?`,'',String(target),[String(base),String(target-1),String(target+base)],`Revenue is R(n)=n(${price+base}-n), a downward-opening quadratic whose vertex is at n=${target}.`)}
  if(family==='orchard'){const base=pick([20,24,30]),d=pick([4,6,8,10,12]),target=base+ri(6,18),yield0=2*d*target-d*base;return mc(`opt-orchard-${base}-${d}-${yield0}`,'orchard_yield',`An orchard produces ${yield0} apples per tree with ${base} trees per acre. Each additional tree reduces the yield of every tree by ${d} apples. How many trees per acre maximize total production?`,'',String(target),[String(base),String(target-1),String(target+1)],`Total production is n[${yield0+d*base}-${d}n], whose vertex occurs at n=${target}.`)}
  if(family==='open_cylinder'){const r=ri(2,8),K=r**3;return mc(`opt-cylinder-${K}`,'open_cylinder_min_material',`An open-top cylindrical container must have volume ${K}\\pi cubic units. What radius minimizes the material used?`,'',String(r),[String(r+1),String(2*r),texRat(r,2)],`With h=${K}/r², surface area is πr²+2πr h. Differentiation gives r³=${K}, so r=${r}.`)}
  if(family==='closest_point'){const n=pick([1,4,9,16,25]),p=n+0.5;return mc(`opt-close-${n}`,'closest_point_radical',`What x-coordinate of the point on y=√x is closest to (${p},0)?`,'',String(n),[String(n+1),String(p),String(Math.sqrt(n))],`Minimize D²=(x-${p})²+x. Then (D²)'=2(x-${p})+1=0, giving x=${n}.`)}
  if(family==='two_poles'){const h1=pick([6,8,12,16]),h2=pick([8,12,18,24]),D=(h1+h2)*pick([1,2]),x=D*h1/(h1+h2);return mc(`opt-poles-${h1}-${h2}-${D}`,'two_pole_cable',`Two poles ${h1} ft and ${h2} ft high are ${D} ft apart. A cable runs from the top of each pole to one common ground point between them. How far from the ${h1}-ft pole should that point be to minimize total cable?`,'',String(x),[String(D-x),String(D/2),String(h1)],`Reflect one pole top across the ground. The straight reflected path meets the ground in the ratio ${h1}:${h2}, giving x=${D}(${h1})/(${h1+h2})=${x}.`)}
  const va=pick([3,4,5,6]),vb=pick([3,4,5]),D=(va*va+vb*vb)*pick([1,2]),t=texRat(D*va,va*va+vb*vb);return mc(`opt-ships-${D}-${va}-${vb}`,'ships_min_distance',`At noon, ship A is ${D} miles south of ship B and sails north at ${va} mph while ship B sails west at ${vb} mph. How many hours after noon is the distance between them minimized?`,'',t,[texRat(D,va),texRat(D,vb),texRat(D*(va+vb),va*va+vb*vb)],`Minimize d²=(${vb}t)²+(${D}-${va}t)². Setting its derivative to 0 gives t=${t}.`)
};
G['related-rates']=()=>{
  const family=pick(['circle_area','circle_radius','sphere_radius','ladder','shadow','cone_pile','conical_tank','balloon_bicycle','diamond','wave']);
  if(family==='circle_area'){const r=ri(2,12),dr=ri(1,6),ans=2*r*dr;return mc(`rr-ca-${r}-${dr}`,'circle_area',`A circular pool's radius increases at ${dr} units/min. How fast is its area increasing when r=${r}?`,'',`${ans}\\pi`,[`${r*dr}\\pi`,`${2*dr}\\pi`,`${r*r*dr}\\pi`],`dA/dt=2πr dr/dt=${ans}π.`)}
  if(family==='circle_radius'){const r=ri(2,12),dr=ri(1,5),dA=2*r*dr;return mc(`rr-cr-${r}-${dA}`,'circle_radius_from_area',`The area of a circular spill is increasing at ${dA}\\pi square units/min. How fast is the radius changing when r=${r}?`,'',String(dr),[String(dA),texRat(dA,r),texRat(dr,2)],`2πr dr/dt=${dA}π, so dr/dt=${dr}.`)}
  if(family==='sphere_radius'){const r=ri(2,8),dr=ri(1,4),dV=4*r*r*dr;return mc(`rr-sr-${r}-${dV}`,'sphere_radius_from_volume',`Gas enters a spherical balloon at ${dV}\\pi cubic units/min. How fast is the radius changing when r=${r}?`,'',String(dr),[String(2*dr),texRat(dV,r*r),texRat(dr,2)],`dV/dt=4πr² dr/dt, so dr/dt=${dr}.`)}
  if(family==='ladder'){const triple=pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25]]),x=triple[0],y=triple[1],L=triple[2],dx=ri(1,5),dy=texRat(-x*dx,y);return mc(`rr-lad-${x}-${y}-${L}-${dx}`,'ladder',`A ${L}-ft ladder has its foot ${x} ft from a wall and its top ${y} ft high. The foot moves away at ${dx} ft/s. Find dy/dt.`,'',dy,[texRat(x*dx,y),texRat(-y*dx,x),String(-dx)],`Differentiate x²+y²=${L*L}: xx'+yy'=0, so y'=${dy}.`)}
  if(family==='shadow'){const H=pick([12,15,20,24]),h=pick([4,5,6,8]),dx=pick([2,3,4,5]),shadow=texRat(h*dx,H-h),tip=texRat(H*dx,H-h),ask=pick(['shadow','tip']);return mc(`rr-shadow-${H}-${h}-${dx}-${ask}`,'shadow_similarity',ask==='shadow'?`A ${h}-ft person walks away from a ${H}-ft lamp at ${dx} ft/s. How fast is the shadow length increasing?`:`A ${h}-ft person walks away from a ${H}-ft lamp at ${dx} ft/s. How fast is the tip of the shadow moving?`,'',ask==='shadow'?shadow:tip,[ask==='shadow'?tip:shadow,String(dx),texRat((H-h)*dx,h)],`Similar triangles give shadow length = ${h}/(${H-h}) times the person's distance. Differentiate to get the requested rate.`)}
  if(family==='cone_pile'){const h=ri(2,12),dh=ri(1,6),dV=h*h*dh;return mc(`rr-cone-${h}-${dh}`,'conical_pile',`A conical sand pile always has radius equal to height. If dh/dt=${dh} units/min, find dV/dt when h=${h}.`,'',`${dV}\\pi`,[`${h*dh}\\pi`,`${3*dV}\\pi`,`${texRat(dV,3)}\\pi`],`V=(1/3)πh³, so dV/dt=πh² dh/dt=${dV}π.`)}
  if(family==='conical_tank'){const h=pick([2,4,6,8]),dh=pick([1,2,3]),dV=texRat(h*h*dh,4);return mc(`rr-tank-${h}-${dh}`,'conical_tank',`Water in an inverted cone satisfies r=h/2. If the water level rises at ${dh} units/min, find dV/dt when h=${h}.`,'',`${dV}\\pi`,[`${h*h*dh}\\pi`,`${texRat(h*h*dh,12)}\\pi`,`${texRat(h*dh,4)}\\pi`],`V=(1/3)π(h/2)²h=πh³/12, so dV/dt=πh²h'/4=${dV}π.`)}
  if(family==='balloon_bicycle')return mc('rr-balloon-51-68','balloon_bicycle',`A balloon rises vertically at 1 ft/s. When it is 65 ft high, a bicycle directly below it moves horizontally at 17 ft/s. How fast is the distance between them changing 3 seconds later?`,'','11',[`17`,`18`,`10`],`After 3 s the horizontal and vertical distances are 51 and 68, so d=85. Then dd/dt=(51·17+68·1)/85=11.`);
  if(family==='diamond'){const L=60,x=pick([12,16,20,25]),speed=pick([12,18,24]),d=Math.sqrt(L*L+x*x),rate=-x*speed/d;return mc(`rr-diamond-${x}-${speed}`,'softball_diamond',`A runner moves from second toward third on a ${L}-ft square diamond at ${speed} ft/s. When she is ${x} ft from third, how fast is her distance from home changing?`,'',fmt(rate),[fmt(-rate),fmt(speed),fmt(x*speed/L)],`If x is the remaining distance to third, x'=-${speed} and d²=${L*L}+x². Thus d'=xx'/d=${fmt(rate)}.`)}
  const r=ri(2,12),dr=pick([0.5,1,2,3]),ans=2*Math.PI*dr;return mc(`rr-wave-${r}-${dr}`,'wave_circumference',`Circular waves have radius increasing at ${dr} m/s. How fast is circumference changing when r=${r}?`,'',`${fmt(2*dr)}\\pi`,[`${fmt(r*dr)}\\pi`,`${fmt(2*r*dr)}\\pi`,`${fmt(dr)}\\pi`],`C=2πr, so dC/dt=2π dr/dt=${fmt(2*dr)}π. The radius value does not affect the rate.`)
};


// UNIT 4
G['rectangular-approximations']=()=>{
  const n=pick([2,4,5,6]),b=pick([2,3,4,5,6]),p=pick([1,2,3]),k=ri(1,4),method=pick(['left','right','midpoint']),dx=b/n;let sum=0;
  for(let i=0;i<n;i++){let x=method==='left'?i*dx:method==='right'?(i+1)*dx:(i+.5)*dx;sum+=k*(x**p)*dx}
  const ans=fmt(sum);return mc(`rect-${n}-${b}-${p}-${k}-${method}`,'riemann_sum',`Approximate the area under f(x)=${k===1?'':k}x^${p} on [0,${b}] using ${n} equal subintervals and the ${method} rule.`,'',ans,numChoices(Number(ans),Math.max(.5,dx)),`Δx=${fmt(dx)}. Evaluate f at the ${method} sample points and add f(xᵢ)Δx. The approximation is ${ans}.`)
};
G['trapezoidal-approximations']=()=>{
  const h=pick([1,2]),vals=[ri(0,5),ri(2,8),ri(3,10),ri(2,9)];const ans=h*(vals[0]/2+vals[1]+vals[2]+vals[3]/2);const table=`<table><tr><th>x</th><td>0</td><td>${h}</td><td>${2*h}</td><td>${3*h}</td></tr><tr><th>f(x)</th>${vals.map(v=>`<td>${v}</td>`).join('')}</tr></table>`;return mc(`trap-${h}-${vals.join('-')}`,'table_trapezoid',`Use the trapezoidal rule to approximate ∫₀^${3*h} f(x) dx.`,table,fmt(ans),numChoices(ans,h),`With width ${h}, T=${h}[½f₀+f₁+f₂+½f₃]=${fmt(ans)}.`)
};
G['introduction-to-sigma-notation']=()=>{
  const n=ri(4,8),a=ri(1,4),b=ri(-3,4),sum=a*n*(n+1)/2+b*n;return mc(`sigma-${n}-${a}-${b}`,'evaluate_linear_sum',`Evaluate the sum.`,`\\displaystyle\\sum_{i=1}^{${n}}(${signed(a,'i',true)}${signed(b,'')})`,String(sum),[String(sum+a),String(sum-n),String(a*n+b)],`Use Σi=n(n+1)/2 and Σ1=n. The value is ${sum}.`)
};
G['converting-a-rectangular-approximation-into-exact-area']=()=>{
  const b=ri(2,10),p=pick([1,2,3,4]),k=ri(1,4),ans=texRat(k*(b**(p+1)),p+1);return mc(`exactarea-${b}-${p}-${k}`,'riemann_to_integral',`The rectangular approximations are refined indefinitely. What exact area do they approach?`,`y=${k===1?'':k}x^{${p}}\\quad\\text{on }[0,${b}]`,ans,[texRat(k*b**(p+1),p),texRat(b**(p+1),p+1),'0'],`The limit of the Riemann sums is ∫₀^${b}${k===1?'':k}x^${p}dx=${ans}.`)
};
G['evaluating-definite-integrals-with-a-limit-and-summation']=()=>{
  const p=pick([1,2,3,4,5]),b=ri(1,6),k=ri(1,4),correct=texRat(k*(b**(p+1)),p+1);return mc(`sumlim-${p}-${b}-${k}`,'canonical_riemann_limit',`Evaluate the limit by recognizing a definite integral.`,`\\displaystyle\\lim_{n\\to\\infty}\\sum_{i=1}^{n}${k===1?'':k}\\left(\\frac{${b}i}{n}\\right)^{${p}}\\frac{${b}}n`,correct,[texRat(k*b**p,p+1),texRat(k*p*b**(p+1),p+1),texRat(k*b**(p+1),p)],`This is a right-endpoint sum for ∫₀^${b}${k===1?'':k}x^${p}dx=${correct}.`)
};
G['fundamental-theorem-of-calculus-and-integral-rules']=()=>{
  const kind=pick(['linear_upper','quadratic_upper']);
  if(kind==='linear_upper'){const k=ri(1,6),c=ri(0,5),p=pick([1,2,3]),u=`${k===1?'':k}x${c?`+${c}`:''}`,correct=`${k===1?'':k}(${u})^{${p}}`;return mc(`ftc-l-${k}-${c}-${p}`,'ftc_chain',`Find F'(x).`,`F(x)=\\displaystyle\\int_0^{${u}} t^${p}\\,dt`,correct,[`(${u})^{${p}}`,`${p*k}(${u})^{${Math.max(0,p-1)}}`,`${k===1?'':k}x^${p}`],`By the FTC and chain rule, evaluate the integrand at the upper limit and multiply by ${k}.`)}
  const a=ri(1,6),p=pick([1,2]),correct=`2x((x^2)^${p}${a?`+${a}`:''})`;return mc(`ftc-q-${a}-${p}`,'ftc_chain',`Find F'(x).`,`F(x)=\\displaystyle\\int_1^{x^2} (t^${p}+${a})\\,dt`,correct,[`(x^2)^${p}+${a}`,`2x+${a}`,`2((x^2)^${p}+${a})`],`Evaluate the integrand at x² and multiply by d(x²)/dx: F'=2x((x²)^${p}+${a}).`)
};
G['integrals-using-geometry']=()=>{
  const kind=pick(['semicircle','triangle']);
  if(kind==='semicircle'){const r=ri(2,12),ans=`\\frac{${r*r}\\pi}{2}`;return mc(`geo-s-${r}`,'semicircle_area',`Evaluate the integral geometrically.`,`\\displaystyle\\int_{-${r}}^{${r}}\\sqrt{${r*r}-x^2}\\,dx`,ans,[`${r*r}\\pi`,`2${r*r}\\pi`,`\\frac{${r}\\pi}{2}`],`The graph is the upper semicircle of radius ${r}. Its area is ½πr²=${ans}.`)}
  const b=ri(2,12),h=ri(2,12),ans=texRat(b*h,2);return mc(`geo-t-${b}-${h}`,'triangle_area',`A nonnegative piecewise-linear function forms a triangle of base ${b} and height ${h}. Evaluate its definite integral over the base.`,'',ans,[String(b*h),String(b+h),texRat(b*h,4)],`The integral is the geometric area ½bh=${ans}.`)
};
G['basic-first-order-differential-equations']=()=>{
  const k=nz(-5,5),x=ri(-3,3),y=ri(-4,4),kind=pick(['slope','solution']);
  if(kind==='slope'){const ans=k*x+y;return mc(`de-s-${k}-${x}-${y}`,'slope_at_point',`For dy/dx=${signed(k,'x',true)}+y, find the slope at (${x},${y}).`,'',String(ans),numChoices(ans,1),`Substitute x=${x}, y=${y}: dy/dx=${k*x}+${y}=${ans}.`)}
  const C=ri(-5,5);return mc(`de-sol-${k}-${C}`,'simple_antiderivative',`Which function is a solution of dy/dx=${signed(k,'x',true)}?`,'',`${(()=>{const [n,d]=rat(k,2);const coeff=n===d?'':n===-d?'-':texRat(n,d);return `y=${coeff}x^2${signed(C,'')}`})()}`,[`${(()=>{const c=k===1?'':k===-1?'-':k;return `y=${c}x^2${signed(C,'')}`})()}`,`y=${signed(k,'x',true)}${signed(C,'')}`,`${(()=>{const [n,d]=rat(k,3),c=n===d?'':n===-d?'-':texRat(n,d);return `y=${c}x^3${signed(C,'')}`})()}`],`Integrating gives y=(${k}/2)x²+C.`)
};
G['motion-problems']=()=>{
  const a=nz(-4,4),v0=ri(-6,6),s0=ri(-5,5),t=ri(1,4),v=v0+a*t,s=s0+v0*t+a*t*t/2,kind=pick(['velocity','position']);const ans=kind==='velocity'?v:s;return mc(`dem-${a}-${v0}-${s0}-${t}-${kind}`,'constant_acceleration',`A particle has acceleration a(t)=${a}, v(0)=${v0}, and s(0)=${s0}. Find its ${kind} at t=${t}.`,'',fmt(ans),numChoices(ans,1),`Integrate acceleration to get v(t)=${signed(a,'t',true)}${signed(v0,'')}, then integrate again for position. The requested value is ${fmt(ans)}.`)
};
G['slope-fields']=()=>{
  const kind=pick(['xy','xminusy','yonly']),x=ri(-3,3),y=ri(-3,3);let expr,ans;if(kind==='xy'){expr='xy';ans=x*y}else if(kind==='xminusy'){expr='x-y';ans=x-y}else{const k=nz(-3,3);expr=signed(k,'y',true);ans=k*y}return mc(`sf-${kind}-${x}-${y}-${ans}`,'slope_field_local_slope',`A slope field is generated by dy/dx=${expr}. What slope should appear at (${x},${y})?`,'',String(ans),numChoices(ans,1),`A slope field plots the value of dy/dx at each point. Substitution gives slope ${ans}.`)
};
G['separable-differential-equations']=()=>{
  const k=ri(1,10),p=pick([1,2,3,4]),kind=pick(['exp','square']);
  if(kind==='exp'){const coef=texRat(k,p+1);return mc(`sep-e-${k}-${p}`,'separable_exponential',`Solve the differential equation in general form.`,`\\frac{dy}{dx}=${k===1?'':k}x^${p}y`, `y=Ce^{${coef}x^{${p+1}}}`,[`y=Ce^{${k}x}`,`y=${k===1?'':k}x^${p}e^y`,`y=Cx^{${k}}`],`Separate dy/y=${k}x^${p}dx, integrate, and exponentiate: y=Ce^{${coef}x^${p+1}}.`)}
  const coef=texRat(2*k,p+1);return mc(`sep-s-${k}-${p}`,'separable_square',`Which implicit family solves the equation?`,`y\\frac{dy}{dx}=${k}x^${p}`, `y^2=${coef}x^{${p+1}}+C`,[`y=${k}x+C`,`y^2=${k}x^${p}+C`,`y=${k}x^${p+1}+C`],`Separate y dy=${k}x^${p}dx. Integration gives y²=${coef}x^${p+1}+C.`)
};
G['exponential-growth-and-decay-interest-newton-s-law-of-cooling']=()=>{
  const P0=pick([25,50,75,100,150,200,300,500]),k=pick([1,2,3,4,5,6]),kind=pick(['model','value']);
  if(kind==='model')return mc(`growth-m-${P0}-${k}`,'growth_model',`A quantity satisfies P'=${k}P and P(0)=${P0}. Which model is correct?`,'',`P=${P0}e^{${k}t}`,[`P=${P0}+${k}t`,`P=${P0}e^{t/${k}}`,`P=${k}e^{${P0}t}`],`The solution to P'=kP is P=P₀e^{kt}.`);
  return mc(`growth-v-${P0}-${k}`,'growth_value',`For P(t)=${P0}e^{${k}t}, find P(1).`,'',`${P0}e^{${k}}`,[`${P0+k}e`,`${P0*k}e`,`e^{${P0*k}}`],`Substitute t=1 to obtain ${P0}e^${k}.`)
};
G['rate-problems']=()=>{
  const A0=ri(20,100),a=nz(-4,6),b=ri(1,8),t=ri(1,5),change=a*t*t/2+b*t,ans=A0+change;return mc(`rate-${A0}-${a}-${b}-${t}`,'accumulation_rate',`A quantity A has rate A'(t)=${a}t${signed(b,'')} and A(0)=${A0}. Find A(${t}).`,'',fmt(ans),numChoices(ans,2),`A(${t})=A(0)+∫₀^${t}A'(u)du=${A0}+${fmt(change)}=${fmt(ans)}.`)
};

// UNIT 6
G['area-below-and-between-curves']=()=>{
  const k=ri(1,8),a=ri(1,8),ans=texRat(k*a*a,6);return mc(`area-x-x2-${k}-${a}`,'between_linear_quadratic',`Find the area between the curves on [0,${a}].`,`y=${k}x,\\qquad y=\\frac{${k}}{${a}}x^2`,ans,[texRat(k*a*a,3),texRat(k*a*a,2),String(k*a)],`The curves meet at x=0 and x=${a}. Area=∫₀^${a}[${k}x-(${k}/${a})x²]dx=${ans}.`)
};
G['finding-area-in-terms-of-y']=()=>{
  const c=ri(1,8),h=ri(2,12),a=c*h,ans=texRat(c*h*h,2);return mc(`areay-${c}-${h}`,'horizontal_slices_triangle',`Find the area by integrating with respect to y. The region is bounded by x=${c===1?'':c}y, x=${a}, and y=0.`,'',ans,[String(c*h*h),String(a),texRat(c*h*h,3)],`Using horizontal slices, width=${a}-${c===1?'':c}y for 0≤y≤${h}. The area is ∫₀^${h}(${a}-${c}y)dy=${ans}.`)
};
G['integrals-on-piecewise-defined-functions']=()=>{
  const a=ri(1,5),b=ri(1,5),c=ri(1,5),ans=rat(2*(a+b)+5*c,2),ansTex=texRat(ans[0],ans[1]);const piece=`f(x)=\\begin{cases}${a},&0\\le x\\lt1\\\\${b},&1\\le x\\lt2\\\\${c}x,&2\\le x\\le3\\end{cases}`;return mc(`pieceint-${a}-${b}-${c}`,'piecewise_integral',`Evaluate the definite integral.`,`\\displaystyle\\int_0^3 f(x)dx,\\qquad ${piece}`,ansTex,[texRat(ans[0]-2,ans[1]),texRat(ans[0]+2,ans[1]),String(a+b+c)],`Integrate each piece separately: ${a}(1)+${b}(1)+\\int_2^3${c}x\\,dx=${ansTex}.`)
};
G['volume-by-cross-sections']=()=>{
  const k=ri(1,8),a=ri(1,8),ans=texRat(k*k*a**3,3);return mc(`cross-${k}-${a}`,'square_cross_sections',`The base runs from x=0 to x=${a}. Cross sections perpendicular to the x-axis are squares with side length ${k}x. Find the volume.`,'',ans,[texRat(k*a**3,3),texRat(k*k*a*a,2),String(k*k*a**3)],`Area of a cross section is (${k}x)². Thus V=∫₀^${a}${k*k}x²dx=${ans}.`)
};
G['solids-of-revolution']=()=>{
  const k=ri(1,8),a=ri(1,8),coef=rat(k*k*a**3,3),correct=coef[1]===1?`${coef[0]}\\pi`:`\\frac{${coef[0]}\\pi}{${coef[1]}}`;return mc(`solid-${k}-${a}`,'disk_linear',`Rotate the region under y=${k}x on [0,${a}] about the x-axis. Find the volume.`,'',correct,[`${k*a*a}\\pi`,`${k*k*a*a}\\pi`,`\\frac{${k*a**3}\\pi}{3}`],`Use disks: V=π∫₀^${a}(${k}x)²dx=${correct}.`)
};

// v10.5.7 assignment-fidelity enhancements.
// These wrappers preserve the previously validated families while adding
// structures drawn directly from the linked BatchMath coursework.
(function assignmentFidelityEnhancements(){
  const old = slug => G[slug];
  const texPiRat=(n,d=1)=>{const[a,b]=rat(n,d);if(a===0)return'0';const s=a<0?'-':'',aa=Math.abs(a);if(b===1)return aa===1?`${s}\\pi`:`${s}${aa}\\pi`;return aa===1?`${s}\\frac{\\pi}{${b}}`:`${s}\\frac{${aa}\\pi}{${b}}`;};
  const interval=(a,b)=>`[${a},${b}]`;
  const factorTex=r=>r===0?'x':r>0?`(x-${r})`:`(x+${-r})`;
  const lineChoice=(m,b)=>eqY([m,1],b);
  const fmtInterval=(a,b,leftOpen=false,rightOpen=false)=>`${leftOpen?'(':'['}${a},${b}${rightOpen?')':']'}`;
  const pyth=(a,b)=>Math.sqrt(a*a+b*b);

  // ---------- Unit 3 ----------
  {
    const base=old('motion');
    G['motion']=()=>{
      const kind=pick(['base','base','rest','direction','maxheight','position_from_velocity','total_distance']);
      if(kind==='base')return base();
      if(kind==='rest'){
        const r1=ri(1,3),r2=r1+ri(1,4),A=pick([1,2,3]);
        const B=-A*(r1+r2),C=A*r1*r2;
        return mc(`motion-rest-${A}-${r1}-${r2}`,'rest_times_from_position','A particle has position s(t) with velocity shown below. At what positive times is the particle at rest?',`v(t)=${poly2(A,B,C)}`,`${r1}, ${r2}`,[`${r1}`,`${r2}`,`${-r1}, ${-r2}`],`A particle is at rest when v(t)=0. Factoring gives ${A===1?'':A}${factorTex(r1)}${factorTex(r2)}=0, so t=${r1} and t=${r2}.`);
      }
      if(kind==='direction'){
        const r1=ri(1,3),r2=r1+ri(2,4),A=pick([1,2]);
        const B=-A*(r1+r2),C=A*r1*r2;
        const correct=`(${r1},${r2})`;
        return mc(`motion-left-${A}-${r1}-${r2}`,'direction_intervals','For t≥0, when is the particle moving to the left?',`v(t)=${poly2(A,B,C)}`,correct,[`(0,${r1})\\cup(${r2},\\infty)`,`(0,${r1})`,`(${r2},\\infty)`],`Moving left means v(t)<0. Since this upward-opening quadratic has zeros ${r1} and ${r2}, it is negative between them.`);
      }
      if(kind==='maxheight'){
        const T=ri(3,7),v0=ri(8,20),g=pick([2,4]),t=v0/g;
        const horizon=Math.max(T,Math.ceil(t)+1),s0=ri(0,8),smax=s0+v0*t-g*t*t/2;
        return mc(`motion-max-${s0}-${v0}-${g}-${horizon}`,'maximum_position','A vertical particle has velocity v(t) and initial position s(0). Find its maximum position for 0≤t≤'+horizon+'.',`v(t)=${v0}-${g}t,\\qquad s(0)=${s0}`,fmt(smax),numChoices(smax,2),`The maximum occurs when v(t)=0: t=${fmt(t)}. Integrating gives s(t)=${s0}+${v0}t-${texRat(g,2)}t^2. Evaluating at t=${fmt(t)} gives ${fmt(smax)}.`);
      }
      if(kind==='position_from_velocity'){
        const A=pick([1,2,3]),B=pick([-4,-2,2,4]),t0=ri(0,2),s0=ri(-5,8),t1=t0+ri(1,3);
        const delta=A*(t1**3-t0**3)/3+B*(t1-t0),ans=s0+delta;
        return mc(`motion-pos-${A}-${B}-${t0}-${s0}-${t1}`,'position_from_velocity','A particle has the given velocity and known position. Find the requested position.',`v(t)=${A}t^2${signed(B,'')},\\qquad s(${t0})=${s0}.\\quad Find\\ s(${t1}).`,fmt(ans),numChoices(ans,2),`Use s(${t1})=s(${t0})+∫_${t0}^${t1}v(t)dt. The displacement is ${fmt(delta)}, so s(${t1})=${fmt(ans)}.`);
      }
      // A factorable velocity with one direction change makes exact total distance accessible.
      const r=ri(1,3),T=r+ri(2,4),A=pick([1,2]),s0=ri(-3,5);
      const F=t=>A*(t**3/3-r*t*t/2); // integral of A*t*(t-r)
      const d1=Math.abs(F(r)-F(0)),d2=Math.abs(F(T)-F(r)),ans=d1+d2;
      return mc(`motion-dist-${A}-${r}-${T}-${s0}`,'total_distance','Find the total distance traveled on the stated interval.',`v(t)=${A===1?'':A}t(t-${r}),\\qquad 0\\le t\\le ${T}`,fmt(ans),[fmt(Math.abs(F(T)-F(0))),fmt(ans+1),fmt(Math.max(0,ans-1))],`Velocity changes sign at t=${r}. Total distance is |∫_0^${r}v(t)dt|+|∫_${r}^${T}v(t)dt|=${fmt(ans)}.`);
    };
  }
  {
    const base=old('absolute-and-local-extrema-and-the-extreme-value-theorem');
    G['absolute-and-local-extrema-and-the-extreme-value-theorem']=()=>{
      const kind=pick(['base','base','reciprocal_plus_linear','exp_times_x','critical_intervals']);
      if(kind==='base')return base();
      if(kind==='reciprocal_plus_linear'){
        const c=pick([1,4,9,16]),r=Math.sqrt(c),a=1,b=Math.max(3,r+ri(1,4));
        const f=x=>x+c/x,vals=[[a,f(a)],[b,f(b)]];if(r>=a&&r<=b)vals.push([r,f(r)]);vals.sort((u,v)=>u[1]-v[1]);const min=vals[0];
        return mc(`ext-xcx-${c}-${b}`,'rational_closed_interval_min','Find the absolute minimum value on the given interval.',`f(x)=x+\\frac{${c}}x,\\qquad [${a},${b}]`,fmt(min[1]),[fmt(f(a)),fmt(f(b)),fmt(r)],`Check endpoints and critical points. f'(x)=1-${c}/x^2, so x=${r} is the positive critical point. Comparing values gives the absolute minimum ${fmt(min[1])}.`);
      }
      if(kind==='exp_times_x'){
        const b=ri(2,6),k=ri(1,4),crit=1/k;
        return mc(`ext-xexp-${k}-${b}`,'exponential_product_max','On [0,'+b+'], at which x-value does f attain its absolute maximum?',`f(x)=xe^{-${k}x}`,fmt(crit),[String(0),String(b),fmt(1/(k+1))],`f'(x)=e^{-${k}x}(1-${k}x). The only interior critical point is x=${fmt(crit)}; comparison with the endpoints shows it gives the maximum.`);
      }
      const r1=ri(-3,-1),r2=ri(1,4),A=pick([1,2]);
      const der=`${A===1?'':A}${factorTex(r1)}${factorTex(r2)}`;
      return mc(`ext-local-${A}-${r1}-${r2}`,'local_extrema_from_original_function','The derivative of f is shown. Which statement about f is correct?',`f'(x)=${der}`,`f has a local maximum at x=${r1} and a local minimum at x=${r2}.`,[`f has a local minimum at x=${r1} and a local maximum at x=${r2}.`,`f has local maxima at x=${r1} and x=${r2}.`,`f has no local extrema.`],`Because f' changes + to − at ${r1}, f has a local maximum there. It changes − to + at ${r2}, so f has a local minimum there.`);
    };
  }
  {
    const base=old('increasing-decreasing-intervals-concavity-and-extrema');
    G['increasing-decreasing-intervals-concavity-and-extrema']=()=>{
      const kind=pick(['base','base','original_increasing','original_inflection','full_analysis']);
      if(kind==='base')return base();
      if(kind==='original_increasing'){
        const r1=ri(-4,-1),r2=ri(1,4),A=pick([1,2]),B=-3*A*(r1+r2)/2,C=3*A*r1*r2;
        // Build a cubic whose derivative is proportional to (x-r1)(x-r2).
        const qA=A,qB=-3*A*(r1+r2)/2,qC=3*A*r1*r2;
        const f=`${qA}x^3${signed(qB,'x^2')}${signed(qC,'x')}`;
        return mc(`analysis-inc-${A}-${r1}-${r2}`,'increasing_from_original','Find the intervals on which f is increasing.',`f(x)=${f}`,`(-\\infty,${r1})\\cup(${r2},\\infty)`,[`(${r1},${r2})`,`(-\\infty,${r2})`,`(${r1},\\infty)`],`Differentiate and factor. f'(x) is a positive multiple of (x-${r1})(x-${r2}), so f'>0 outside the two critical numbers.`);
      }
      if(kind==='original_inflection'){
        const h=ri(-3,3),A=pick([1,2,3]),B=-3*A*h;
        const f=`${A}x^3${signed(B,'x^2')}`;
        return mc(`analysis-infl-${A}-${h}`,'inflection_from_original','Find the x-coordinate of the inflection point.',`f(x)=${f}`,String(h),[String(-h),String(h+1),String(0)],`f''(x)=6${A===1?'':A}(x-${h}), which changes sign at x=${h}.`);
      }
      const r1=ri(-3,-1),r2=ri(1,3),h=ri(-2,2);
      return mc(`analysis-full-${r1}-${r2}-${h}`,'full_curve_analysis','Suppose f′ is positive on the outside intervals and negative between the critical points, while f″ changes from negative to positive at x='+h+'. Which feature list is correct?',`f'(x)=0\\text{ at }x=${r1},${r2};\\qquad f''(x)\\text{ changes sign at }x=${h}.`,`Local max at x=${r1}; local min at x=${r2}; inflection at x=${h}.`,[`Local min at x=${r1}; local max at x=${r2}; inflection at x=${h}.`,`Local maxima at x=${r1},${r2}; no inflection.`,`No extrema; inflection at x=${h}.`],`The first-derivative sign changes +→− at ${r1} and −→+ at ${r2}. The second derivative changes sign at ${h}.`);
    };
  }
  {
    const base=old('graphing-functions');
    G['graphing-functions']=()=>{
      const kind=pick(['base','rational_features','polynomial_features','asymptote_intercepts','curve_analysis_set']);
      if(kind==='base')return base();
      if(kind==='rational_features'){
        const h=ri(-3,3),k=nz(-4,4),A=nz(-4,4);
        return mc(`graph-rat-${A}-${h}-${k}`,'rational_feature_set','Which feature set is correct for the function?',`f(x)=${k}+\\frac{${A}}{x${h===0?'':h>0?`-${h}`:`+${-h}`}}`,`Vertical asymptote x=${h}; horizontal asymptote y=${k}.`,[`Vertical asymptote x=${k}; horizontal asymptote y=${h}.`,`Vertical asymptote y=${h}; horizontal asymptote x=${k}.`,`No asymptotes.`],`The denominator is zero at x=${h}. As |x|→∞, the reciprocal term approaches 0, so f(x)→${k}.`);
      }
      if(kind==='polynomial_features'){
        const r1=ri(-4,-1),r2=ri(1,4);
        return mc(`graph-poly-${r1}-${r2}`,'polynomial_intercepts','Which x-intercepts must the graph have?',`f(x)=${factorTex(r1)}${factorTex(r2)}^2`,`x=${r1} and x=${r2}`,['x=0 only',`x=${-r1} and x=${-r2}`,'No x-intercepts'],`Set each factor equal to zero. The squared factor changes multiplicity, not the intercept location.`);
      }
      if(kind==='asymptote_intercepts'){
        const h=ri(1,5),a=ri(1,5);
        return mc(`graph-ai-${h}-${a}`,'rational_intercept_asymptote','Find the vertical asymptote and x-intercept.',`f(x)=\\frac{x-${a}}{x-${h}}`,`VA: x=${h}; x-intercept: x=${a}`,[`VA: x=${a}; x-intercept: x=${h}`,`VA: y=${h}; x-intercept: x=${a}`,'No vertical asymptote'],`The denominator gives the vertical asymptote x=${h}; the numerator gives the x-intercept x=${a}.`);
      }
      const r1=ri(-3,-1),r2=ri(1,3),h=ri(-2,2);
      return mc(`graph-set-${r1}-${r2}-${h}`,'curve_analysis_feature_set','A curve analysis gives the derivative signs below. Which sketch description is consistent?',`f' : +\\;0\\;-\\;0\\;+\\quad\\text{at }x=${r1},${r2};\\qquad f''\\text{ changes }-\\to+\\text{ at }x=${h}`,`Rise to a local max at ${r1}, fall to a local min at ${r2}, and change concavity at ${h}.`,[`Fall to a local min at ${r1}, rise to a local max at ${r2}.`,`Rise everywhere with no extrema.`,`Fall everywhere with no inflection.`],`Translate the signs directly: +→− gives a maximum, −→+ gives a minimum, and a sign change in f″ gives an inflection point.`);
    };
  }
  {
    const base=old('linearization-and-differentials');
    G['linearization-and-differentials']=()=>{
      const kind=pick(['base','base','log_linearization','circle_differential','area_differential']);
      if(kind==='base')return base();
      if(kind==='log_linearization'){
        const a=pick([1,Math.E]),dx=pick([0.01,0.02,-0.01]);
        const L=a===1?dx:1+dx/a;
        return mc(`lin-log-${a}-${dx}`,'log_linearization','Use the linearization of ln x at the indicated center to approximate the value.',`\\ln(${fmt(a+dx)})\\quad\\text{near }a=${fmt(a)}`,fmt(L),numChoices(L,.01),`L(x)=ln(a)+(1/a)(x-a). Substituting x=${fmt(a+dx)} gives ${fmt(L)}.`);
      }
      if(kind==='circle_differential'){
        const r=ri(3,10),dr=pick([0.05,0.1,-0.05]),dA=2*Math.PI*r*dr;
        return mc(`diff-circle-${r}-${dr}`,'geometry_differential_circle','Use differentials to approximate the change in area of a circle.',`r=${r},\\qquad dr=${dr}`,fmt(dA),numChoices(dA,.5),`A=πr², so dA=2πr\,dr≈${fmt(dA)}.`);
      }
      const x=ri(3,10),dx=pick([0.05,0.1,-0.05]),k=ri(2,6),dy=2*k*x*dx;
      return mc(`diff-area-${k}-${x}-${dx}`,'applied_differential','A quantity satisfies A='+k+'x². Use differentials to approximate the change in A.',`x=${x},\\qquad dx=${dx}`,fmt(dy),numChoices(dy,.5),`dA=A'(x)dx=2(${k})(${x})(${dx})=${fmt(dy)}.`);
    };
  }
  {
    const base=old('rolle-s-theorem-and-the-mean-value-theorem');
    G['rolle-s-theorem-and-the-mean-value-theorem']=()=>{
      const kind=pick(['base','base','verify_yes','verify_no_discontinuous','verify_no_diff']);
      if(kind==='base')return base();
      if(kind==='verify_yes'){
        const a=ri(-3,0),b=a+ri(2,5);
        return mc(`mvt-hyp-yes-${a}-${b}`,'verify_mvt_hypotheses','Can the Mean Value Theorem be applied on the interval?',`f(x)=x^3-2x+1,\\qquad [${a},${b}]`,'Yes — f is continuous on the closed interval and differentiable on the open interval.',['No — f is not continuous.','No — f is not differentiable.','No — endpoint values must be equal.'],'Polynomials are continuous and differentiable everywhere, so the MVT hypotheses are satisfied.');
      }
      if(kind==='verify_no_discontinuous'){
        const c=ri(-2,2),a=c-ri(1,3),b=c+ri(1,3);
        return mc(`mvt-hyp-disc-${a}-${c}-${b}`,'mvt_discontinuity_failure','Can the Mean Value Theorem be applied on the interval?',`f(x)=\\frac1{${c===0?'x':c>0?`x-${c}`:`x+${-c}`}},\\qquad [${a},${b}]`,'No — f is not continuous on the closed interval.',['Yes — it is differentiable at the endpoints.','No — endpoint values must be equal.','Yes — rational functions always satisfy MVT.'],`The denominator is zero at x=${c}, inside the interval, so continuity fails.`);
      }
      const c=ri(-2,2),a=c-ri(2,4),b=c+ri(2,4);
      return mc(`mvt-hyp-cusp-${a}-${c}-${b}`,'mvt_differentiability_failure','Can the Mean Value Theorem be applied on the interval?',`f(x)=|${c===0?'x':c>0?`x-${c}`:`x+${-c}`}|,\\qquad [${a},${b}]`,'No — f is not differentiable at x='+c+'.',['Yes — absolute value is continuous, so that is sufficient.','No — f is not continuous.','No — endpoint values must be equal.'],`The function is continuous, but it has a corner at x=${c}, so it is not differentiable on the entire open interval.`);
    };
  }
  {
    const base=old('l-hopital-s-rule');
    G['l-hopital-s-rule']=()=>{
      const kind=pick(['base','base','inverse_trig','not_indeterminate','radical']);
      if(kind==='base')return base();
      if(kind==='inverse_trig'){
        const k=ri(1,6);
        return mc(`lh-atan-${k}`,'inverse_trig_lhopital','Evaluate the limit. L’Hôpital’s Rule may be used.',`\\displaystyle\\lim_{x\\to0}\\frac{\\arctan(${k}x)}x`,String(k),[String(1),String(-k),'0'],`The form is 0/0. Differentiate numerator and denominator: ${k}/(1+${k*k}x²)→${k}.`);
      }
      if(kind==='not_indeterminate'){
        const a=ri(1,5);
        return mc(`lh-no-${a}`,'lhopital_not_applicable','Should L’Hôpital’s Rule be applied directly?',`\\displaystyle\\lim_{x\\to0}\\frac{x+${a}}{x}`,'No — the form is nonzero/0, not 0/0 or ∞/∞.',['Yes — every quotient limit allows L’Hôpital.','Yes — the denominator approaches 0.','No — derivatives do not exist.'],`L’Hôpital applies only to the appropriate indeterminate forms. Here the numerator approaches ${a}, not 0.`);
      }
      const c=ri(1,6);
      return mc(`lh-rad-${c}`,'radical_lhopital','Evaluate the limit.',`\\displaystyle\\lim_{x\\to0}\\frac{\\sqrt{1+${c}x}-1}{x}`,texRat(c,2),[String(c),texRat(1,c),String(0)],`This is 0/0. Differentiating gives ${c}/(2√(1+${c}x)), which approaches ${texRat(c,2)}.`);
    };
  }
  {
    const base=old('optimization');
    G['optimization']=()=>{
      const kind=pick(['base','base','ladder_fence','semicircle_rectangle','window','capsule']);
      if(kind==='base')return base();
      if(kind==='ladder_fence'){
        const h=ri(2,6),d=ri(2,6),x=ri(3,9); // objective length from wall foot at x to fence top, then extension
        const L=Math.sqrt((x+d)**2+h*h);
        return mc(`opt-ladder-${h}-${d}-${x}`,'ladder_over_fence_setup','A ladder must clear a fence of height h located d units from a wall. Which expression represents the ladder length when its foot is x units beyond the fence?',`h=${h},\\quad d=${d}`,`\\sqrt{(x+${d})^2+${h*h}}`,[`\\sqrt{x^2+${h*h}}`,`x+${d}+${h}`,`\\sqrt{(x-${d})^2+${h*h}}`],`The horizontal distance from the wall to the foot is x+d and the vertical distance to the top of the fence is h, so the Pythagorean expression is correct.`);
      }
      if(kind==='semicircle_rectangle'){
        const r=ri(3,8);const x=r/Math.sqrt(2),area=r*r;
        return mc(`opt-semi-${r}`,'inscribed_semicircle_rectangle','A rectangle is inscribed under the upper semicircle x²+y²=r² with its base on the diameter. At what positive x-coordinate of the upper-right corner is its area maximized?',`r=${r}`,`${r}/\\sqrt2`,[`${r}/2`,`${r}/\\sqrt3`,String(r)],`A(x)=2x√(r²-x²). Maximizing A²=4x²(r²-x²) gives x²=r²/2, so x=r/√2.`);
      }
      if(kind==='window'){
        const P=ri(20,50),ratio=texRat(1,Math.PI?1:1);
        return mc(`opt-window-${P}`,'window_setup','A Norman-style window consists of a rectangle topped by a semicircle. If the total outside perimeter is P, which equation correctly relates width w and rectangle height h?',`P=${P}`,`${P}=2h+w+\\frac{\\pi w}{2}`,[`${P}=2h+2w+\\pi w`,`${P}=h+w+\\pi w^2`,`${P}=2h+w+\\pi w`],`The outside perimeter includes two vertical sides, the bottom width, and a semicircular arc of radius w/2, whose length is πw/2.`);
      }
      const r=ri(2,5),L=ri(8,18);
      return mc(`opt-capsule-${r}-${L}`,'capsule_tank_cost_setup','A capsule tank has cylindrical length L and two hemispherical ends of radius r. Which expression is its total volume?',`r=${r},\\quad L=${L}`,`\\pi(${r*r})(${L})+\\frac43\\pi(${r**3})`,[`2\\pi(${r})(${L})+4\\pi(${r*r})`,`\\pi(${r*r})(${L})+\\frac23\\pi(${r**3})`,`\\pi(${r})(${L})+\\frac43\\pi(${r**2})`],`The two hemispheres form one sphere. Add cylinder volume πr²L and sphere volume 4πr³/3.`);
    };
  }
  {
    const base=old('related-rates');
    G['related-rates']=()=>{
      const kind=pick(['base','base','ice_coating','equilateral','trough']);
      if(kind==='base')return base();
      if(kind==='ice_coating'){
        const r=ri(2,6),dr=pick([0.1,0.2,0.5]),dV=4*Math.PI*r*r*dr;
        return mc(`rr-ice-${r}-${dr}`,'ice_coating_sphere','Ice forms uniformly on a spherical object. At the instant the outside radius and its rate are given, how fast is the ice volume increasing?',`r=${r},\\qquad \\frac{dr}{dt}=${dr}`,fmt(dV),numChoices(dV,2),`V=4πr³/3, so dV/dt=4πr² dr/dt≈${fmt(dV)}.`);
      }
      if(kind==='equilateral'){
        const s=ri(2,10),ds=pick([0.5,1,2]),dA=Math.sqrt(3)/2*s*ds;
        return mc(`rr-eq-${s}-${ds}`,'equilateral_triangle_rate','An equilateral triangle has side length s changing at the given rate. How fast is its area changing?',`s=${s},\\qquad ds/dt=${ds}`,fmt(dA),numChoices(dA,.5),`A=(√3/4)s², so dA/dt=(√3/2)s(ds/dt)≈${fmt(dA)}.`);
      }
      const L=ri(4,12),top=ri(4,10),depth=ri(2,6),dh=pick([0.1,0.2,0.5]);
      const dV=L*top*dh; // similar-triangle triangular trough: width=(top/depth)h; V=.5 L width h
      return mc(`rr-trough-${L}-${top}-${depth}-${dh}`,'triangular_trough_rate','A triangular trough is L units long, top width W, and depth H. Water depth h is rising at dh/dt. At h=H, how fast is volume changing?',`L=${L},\\ W=${top},\\ H=${depth},\\ dh/dt=${dh}`,fmt(dV),numChoices(dV,1),`By similarity, width=(W/H)h. V=(1/2)L(W/H)h², so dV/dt=L(W/H)h dh/dt. At h=H this is ${fmt(dV)}.`);
    };
  }

  // ---------- Unit 4 ----------
  {
    const base=old('rectangular-approximations');
    G['rectangular-approximations']=()=>{
      const kind=pick(['base','varied_poly','all_methods']);
      if(kind==='base')return base();
      const a=ri(-3,1),n=pick([2,4]),dx=pick([1,2]),b=a+n*dx,A=pick([1,2]),B=ri(-3,4),C=ri(0,6);
      const f=x=>A*x*x+B*x+C;
      const sum=method=>{let s=0;for(let i=0;i<n;i++){const x=method==='left'?a+i*dx:method==='right'?a+(i+1)*dx:a+(i+.5)*dx;s+=f(x)*dx;}return s};
      if(kind==='varied_poly'){
        const method=pick(['left','right','midpoint']),ans=sum(method);
        return mc(`rect-poly-${a}-${b}-${n}-${A}-${B}-${C}-${method}`,'varied_polynomial_riemann',`Use ${method} rectangles with n=${n} equal subintervals to approximate the integral.`,`\\displaystyle\\int_${a}^{${b}}(${poly2(A,B,C)})\\,dx`,fmt(ans),numChoices(ans,dx),`Δx=${dx}. Evaluate f at the ${method} sample points and sum f(x_i)Δx to get ${fmt(ans)}.`);
      }
      const L=sum('left'),Rr=sum('right'),M=sum('midpoint');
      return mc(`rect-all-${a}-${b}-${n}-${A}-${B}-${C}`,'compare_three_riemann_sums','Which ordered triple gives (Left, Right, Midpoint) approximations?',`f(x)=${poly2(A,B,C)},\\quad ${interval(a,b)},\\quad n=${n}`,`(${fmt(L)}, ${fmt(Rr)}, ${fmt(M)})`,[`(${fmt(Rr)}, ${fmt(L)}, ${fmt(M)})`,`(${fmt(M)}, ${fmt(Rr)}, ${fmt(L)})`,`(${fmt(L)}, ${fmt(M)}, ${fmt(Rr)})`],`Compute the three sums with the same Δx=${dx}, changing only the sample point in each subinterval.`);
    };
  }
  {
    const base=old('trapezoidal-approximations');
    G['trapezoidal-approximations']=()=>{
      const kind=pick(['base','function_values','unequal_table']);
      if(kind==='base')return base();
      if(kind==='function_values'){
        const a=0,b=4,n=4,h=1,k=ri(1,4);const f=x=>k*x*x;const vals=[0,1,2,3,4].map(f);const ans=h*(vals[0]/2+vals[1]+vals[2]+vals[3]+vals[4]/2);
        return mc(`trap-f-${k}`,'function_trapezoid','Use n=4 trapezoids to approximate the integral.',`\\displaystyle\\int_0^4 ${k===1?'':k}x^2\\,dx`,fmt(ans),numChoices(ans,2),`Evaluate the function at 0,1,2,3,4 and apply T=Δx[½f_0+f_1+f_2+f_3+½f_4].`);
      }
      const xs=[0,1,3,4,7],ys=[ri(1,5),ri(2,8),ri(1,9),ri(2,8),ri(1,10)];let ans=0;for(let i=0;i<xs.length-1;i++)ans+=(xs[i+1]-xs[i])*(ys[i]+ys[i+1])/2;
      const table=`<table><tr><th>x</th>${xs.map(x=>`<td>${x}</td>`).join('')}</tr><tr><th>f(x)</th>${ys.map(y=>`<td>${y}</td>`).join('')}</tr></table>`;
      return mc(`trap-unequal-${ys.join('-')}`,'unequal_spacing_trapezoid','Use the trapezoidal rule with the tabulated (unequally spaced) data.',table,fmt(ans),numChoices(ans,1),`Apply a separate trapezoid on each interval: Σ (x_{i+1}-x_i)(f_i+f_{i+1})/2=${fmt(ans)}.`);
    };
  }
  {
    const base=old('evaluating-definite-integrals-with-a-limit-and-summation');
    G['evaluating-definite-integrals-with-a-limit-and-summation']=()=>{
      const kind=pick(['base','integral_to_sum_linear','integral_to_sum_quadratic']);
      if(kind==='base')return base();
      const a=ri(0,2),b=a+ri(2,5),nSym='n',dx=`\\frac{${b-a}}n`;
      if(kind==='integral_to_sum_linear'){
        const m=ri(1,5),c=ri(-3,4);const sample=`${a}+\\frac{${b-a}i}{n}`;
        const cTex=c===0?'':c>0?`+${c}`:`-${-c}`;
        const correct=`\\displaystyle\\lim_{n\\to\\infty}\\sum_{i=1}^n\\left(${m}(${sample})${cTex}\\right)${dx}`;
        return mc(`newton-l-${a}-${b}-${m}-${c}`,'integral_to_newton_sum','Which Newton/Riemann-sum expression represents the integral?',`\\displaystyle\\int_${a}^{${b}}(${m}x${cTex})\\,dx`,correct,[`\\displaystyle\\lim_{n\\to\\infty}\\sum_{i=1}^n(${m}i${cTex})\\frac1n`,`\\displaystyle\\sum_{i=1}^n(${m}(${sample})${cTex})`,`\\displaystyle\\lim_{n\\to\\infty}\\sum_{i=1}^n(${m}(${sample})${cTex})\\frac1n`],`For [${a},${b}], Δx=(${b-a})/n and x_i=${sample}. Substitute x_i into f and multiply by Δx.`);
      }
      const sample=`${a}+\\frac{${b-a}i}{n}`,correct=`\\displaystyle\\lim_{n\\to\\infty}\\sum_{i=1}^n(${sample})^2${dx}`;
      return mc(`newton-q-${a}-${b}`,'quadratic_integral_to_newton_sum','Which Newton/Riemann-sum expression represents the integral?',`\\displaystyle\\int_${a}^{${b}}x^2\\,dx`,correct,[`\\displaystyle\\lim_{n\\to\\infty}\\sum_{i=1}^n(\\frac{i}{n})^2`,`\\displaystyle\\lim_{n\\to\\infty}\\sum_{i=1}^n(${sample})^2\\frac1n`,`\\displaystyle\\sum_{i=1}^n(${sample})^2${dx}`],`Use x_i=${sample} and Δx=${dx}; the limit as n→∞ is essential.`);
    };
  }
  {
    const base=old('fundamental-theorem-of-calculus-and-integral-rules');
    G['fundamental-theorem-of-calculus-and-integral-rules']=()=>{
      const kind=pick(['base','variable_lower','two_variable_bounds','integral_rules_reverse','integral_rules_split']);
      if(kind==='base')return base();
      if(kind==='variable_lower'){
        const k=ri(1,4),p=pick([1,2,3]);
        return mc(`ftc-low-${k}-${p}`,'ftc_variable_lower','Find F′(x).',`F(x)=\\displaystyle\\int_{${k}x}^{7} t^{${p}}\\,dt`,`-${k}(${k}x)^{${p}}`,[`${k}(${k}x)^{${p}}`,`-(${k}x)^{${p}}`,`${k}x^{${p}}`],`A variable lower limit contributes a negative sign. Evaluate the integrand at ${k}x and multiply by d(${k}x)/dx=${k}.`);
      }
      if(kind==='two_variable_bounds'){
        const a=pick([1,2]),b=a+ri(1,3);
        return mc(`ftc-two-${a}-${b}`,'ftc_two_variable_limits','Find F′(x).',`F(x)=\\displaystyle\\int_{${a}x}^{${b}x} t^2\\,dt`,`${b}(${b}x)^2-${a}(${a}x)^2`,[`${b}x^2-${a}x^2`,`(${b}x)^2-(${a}x)^2`,`${a}(${a}x)^2-${b}(${b}x)^2`],`Differentiate the upper contribution minus the lower contribution: f(${b}x)·${b}−f(${a}x)·${a}.`);
      }
      if(kind==='integral_rules_reverse'){
        const a=ri(-8,8),b=nz(-8,8);
        return mc(`ir-rev-${a}-${b}`,'integral_reverse_bounds','Given the integral value, find the reversed integral.',`\\displaystyle\\int_1^5 f(x)dx=${a}`,String(-a),[String(a),String(0),String(a+1)],`Reversing the limits changes the sign: ∫_5^1 f=-∫_1^5 f=${-a}.`);
      }
      const A=ri(-8,8),B=ri(-8,8),ans=B-A;
      return mc(`ir-split-${A}-${B}`,'integral_interval_subtraction','Use the given integral values to find the missing interval.',`\\displaystyle\\int_1^3 f=${A},\\qquad \\int_1^7 f=${B}.\\quad Find\\ \\int_3^7 f.`,String(ans),[String(A+B),String(A-B),String(-ans)],`By additivity, ∫_1^7 f=∫_1^3 f+∫_3^7 f, so the missing value is ${B}-${A}=${ans}.`);
    };
  }
  {
    const base=old('integrals-using-geometry');
    G['integrals-using-geometry']=()=>{
      const kind=pick(['base','shifted_semicircle','absolute_triangle']);
      if(kind==='base')return base();
      if(kind==='shifted_semicircle'){
        const r=ri(2,8),h=ri(1,5),ans=h*2*r+Math.PI*r*r/2;
        return mc(`geo-shift-${r}-${h}`,'shifted_semicircle','Evaluate geometrically.',`\\displaystyle\\int_{-${r}}^{${r}}(${h}+\\sqrt{${r*r}-x^2})\\,dx`,fmt(ans),numChoices(ans,2),`The area is a rectangle of width ${2*r} and height ${h}, plus an upper semicircle of radius ${r}.`);
      }
      const a=ri(2,8),ans=a*a;
      return mc(`geo-abs-${a}`,'absolute_value_geometry','Evaluate the integral geometrically.',`\\displaystyle\\int_{-${a}}^{${a}}|x|\\,dx`,String(ans),[String(2*ans),String(a),String(0)],`The graph forms two congruent right triangles, each area ½(${a})(${a}); total area is ${ans}.`);
    };
  }

  // ---------- Unit 5 ----------
  {
    const base=old('basic-first-order-differential-equations');
    G['basic-first-order-differential-equations']=()=>{
      const kind=pick(['analytic_poly_ivp','analytic_trig_ivp','analytic_exp_ivp','recover_value','calculator_ivp','base']);
      if(kind==='base')return base();
      if(kind==='analytic_poly_ivp'){
        const A=pick([3,6]),B=ri(-4,4),x0=pick([0,1]),y0=ri(-5,8);
        const C=y0-(A/3)*x0**3-B*x0;const cubic=signed(A/3,'x^3',true),ans=`y=${cubic}${signed(B,'x')}${signed(C,'')}`;
        return mc(`ivp-poly-${A}-${B}-${x0}-${y0}`,'analytic_polynomial_ivp','Solve the initial-value problem.',`\\frac{dy}{dx}=${A}x^2${signed(B,'')},\\qquad y(${x0})=${y0}`,ans,[`y=${A}x^3${signed(B,'x')}${signed(C,'')}`,`y=${cubic}${signed(C,'')}`,`y=${A}x^2${signed(B,'')}`],`Integrate first, then use y(${x0})=${y0} to determine C. The particular solution is ${ans}.`);
      }
      if(kind==='analytic_trig_ivp'){
        const k=pick([1,2,3]),y0=ri(-3,5),cn=k*y0+1,arg=k===1?'x':`${k}x`,coef=k===1?'':`\\frac1{${k}}`,cpart=cn===0?'':cn>0?` + ${texRat(cn,k)}`:` - ${texRat(-cn,k)}`;
        const ans=`y=-${coef}\\cos(${arg})${cpart}`;
        return mc(`ivp-trig-${k}-${y0}`,'analytic_trig_ivp','Solve the initial-value problem.',`\\frac{dy}{dx}=\\sin(${arg}),\\qquad y(0)=${y0}`,ans,[`y=${coef}\\cos(${arg})${cpart}`,`y=-\\cos(${arg})${cpart}`,`y=\\sin(${arg})${signed(y0,'')}`],`Integrate sine and use the initial condition to determine the exact constant.`);
      }
      if(kind==='analytic_exp_ivp'){
        const k=pick([1,2,3]),y0=ri(1,6),cn=k*y0-1,coef=k===1?'':`\\frac1{${k}}`,expArg=k===1?'x':`${k}x`,cpart=cn===0?'':cn>0?` + ${texRat(cn,k)}`:` - ${texRat(-cn,k)}`;
        const ans=`y=${coef}e^{${expArg}}${cpart}`;
        return mc(`ivp-exp-${k}-${y0}`,'analytic_exponential_ivp','Solve the initial-value problem.',`\\frac{dy}{dx}=e^{${expArg}},\\qquad y(0)=${y0}`,ans,[`y=e^{${expArg}}${cpart}`,`y=${k}e^{${expArg}}${cpart}`,`y=${coef}e^x${cpart}`],`Integrate the exponential and use the initial condition to determine the exact constant.`);
      }
      if(kind==='calculator_ivp'){
        const y0=ri(-3,8),b=pick([1,1.5,2]),n=400,h=b/n;let sum=0;for(let i=0;i<=n;i++){const x=i*h,w=(i===0||i===n)?1:(i%2?4:2);sum+=w*Math.exp(-x*x)}const delta=h*sum/3,ans=y0+delta;
        return mc(`ivp-calc-${y0}-${b}`,'calculator_initial_value','Use a calculator definite integral and the initial condition to find the requested value.',`f'(x)=e^{-x^2},\\qquad f(0)=${y0}.\\quad Find\\ f(${b}).`,fmt(ans),numChoices(ans,.5),`Use f(${b})=f(0)+∫_0^${b}e^{-x²}dx. A calculator gives f(${b})≈${fmt(ans)}.`);
      }
      const x0=ri(0,2),x1=x0+ri(1,3),y0=ri(-3,8),A=pick([1,2,3]),B=ri(-2,4);const delta=A*(x1**3-x0**3)/3+B*(x1-x0),ans=y0+delta;
      return mc(`ivp-value-${x0}-${x1}-${y0}-${A}-${B}`,'initial_value_accumulation','Use the initial condition and the derivative to find the requested value.',`f' (x)=${A}x^2${signed(B,'')},\\qquad f(${x0})=${y0}.\\quad Find\\ f(${x1}).`,fmt(ans),numChoices(ans,1),`f(${x1})=f(${x0})+∫_${x0}^${x1}f'(x)dx=${fmt(ans)}.`);
    };
  }
  {
    const base=old('motion-problems');
    G['motion-problems']=()=>{
      const kind=pick(['base','velocity_to_position','displacement','total_distance','direction','speeding']);
      if(kind==='base')return base();
      if(kind==='velocity_to_position'){
        const A=pick([1,2,3]),B=ri(-5,5),t0=ri(0,2),s0=ri(-4,8),t=t0+ri(1,3),delta=A*(t**3-t0**3)/3+B*(t-t0),ans=s0+delta;
        return mc(`im-pos-${A}-${B}-${t0}-${s0}-${t}`,'integral_motion_position','A particle has the given velocity and known position. Find its later position.',`v(t)=${A}t^2${signed(B,'')},\\qquad s(${t0})=${s0}.\\quad Find\\ s(${t}).`,fmt(ans),numChoices(ans,2),`Position changes by the integral of velocity: s(${t})=${s0}+∫_${t0}^${t}v(u)du=${fmt(ans)}.`);
      }
      if(kind==='displacement'){
        const A=pick([1,2]),B=ri(-4,4),T=ri(2,5),ans=A*T**3/3+B*T;
        return mc(`im-disp-${A}-${B}-${T}`,'integral_motion_displacement','Find the displacement on the interval.',`v(t)=${A}t^2${signed(B,'')},\\quad 0\\le t\\le ${T}`,fmt(ans),numChoices(ans,2),`Displacement is ∫_0^${T}v(t)dt=${fmt(ans)}.`);
      }
      if(kind==='total_distance'){
        const r=ri(1,3),T=r+ri(2,4),A=pick([1,2]);const F=t=>A*(t**3/3-r*t*t/2),ans=Math.abs(F(r))+Math.abs(F(T)-F(r));
        return mc(`im-dist-${A}-${r}-${T}`,'integral_motion_total_distance','Find total distance traveled.',`v(t)=${A===1?'':A}t(t-${r}),\\quad 0\\le t\\le${T}`,fmt(ans),[fmt(Math.abs(F(T))),fmt(ans+1),fmt(Math.max(0,ans-1))],`Split at the zero t=${r} and add absolute displacements.`);
      }
      if(kind==='direction'){
        const r=ri(1,4);
        return mc(`im-dir-${r}`,'integral_motion_direction','For t≥0, when is the particle moving left?',`v(t)=t-${r}`,`0\\le t<${r}`,[`t>${r}`,`t=${r}`,'never'],`Moving left means v(t)<0, which occurs for t<${r}.`);
      }
      const r=ri(1,4),t=r+ri(1,3);const v=t-r,a=1;
      return mc(`im-speed-${r}-${t}`,'speeding_up_or_slowing','At the indicated time, is the particle speeding up or slowing down?',`v(t)=t-${r},\\qquad t=${t}`,'Speeding up',['Slowing down','At rest','Neither; speed is constant'],`At t=${t}, v=${v}>0 and a=v'=1>0. Velocity and acceleration have the same sign, so speed is increasing.`);
    };
  }
  {
    const base=old('slope-fields');
    const seg=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="1.4"/>`;
    const fieldSvg=(fn)=>{let s='<svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="slope field">';s+='<rect x="0" y="0" width="160" height="160" fill="none" stroke="currentColor" opacity=".25"/>';for(let gy=-2;gy<=2;gy++)for(let gx=-2;gx<=2;gx++){const m=fn(gx,gy);const len=12,den=Math.sqrt(1+Math.min(25,m*m)),dx=len/den,dy=-m*dx,cx=80+gx*28,cy=80-gy*28;s+=seg(cx-dx/2,cy-dy/2,cx+dx/2,cy+dy/2);}return s+'</svg>';};
    G['slope-fields']=()=>{
      const kind=pick(['match_field','grid_slopes','base']);if(kind==='base')return base();
      if(kind==='grid_slopes'){
        const k=pick([1,2,3]),vals=[-1,0,1].map(x=>k*x);
        return mc(`sf-grid-${k}`,'slope_field_grid_row','For dy/dx='+k+'x, what slopes should be drawn at the points (−1,0), (0,0), and (1,0)?','',`-${k}, 0, ${k}`,[`${k}, 0, -${k}`,`-${k}, ${k}, 0`,'0, 0, 0'],`Substitute each x-coordinate into dy/dx=${k}x. The y-coordinate does not affect the slope.`);
      }
      const forms=[{key:'x',tex:'x',fn:(x,y)=>x},{key:'y',tex:'y',fn:(x,y)=>y},{key:'x-y',tex:'x-y',fn:(x,y)=>x-y},{key:'xy',tex:'xy',fn:(x,y)=>x*y}];const chosen=pick(forms),others=forms.filter(f=>f!==chosen);const labels=['A','B','C','D'];const shuffled=shuffle([chosen,...others]);const html=`<div class="slope-field-choice-grid">${shuffled.map((f,i)=>`<div><strong>${labels[i]}</strong>${fieldSvg(f.fn)}</div>`).join('')}</div>`;const correct=labels[shuffled.indexOf(chosen)];
      const p=mc(`sf-match-${chosen.key}-${shuffled.map(x=>x.key).join('-')}`,'match_slope_field','Which displayed slope field is generated by the differential equation?',`\\frac{dy}{dx}=${chosen.tex}<div>${html}</div>`,correct,labels.filter(x=>x!==correct),`Compare slopes at easy reference points such as the axes and corners. Field ${correct} matches dy/dx=${chosen.tex}.`);p.choicesAreText=true;return p;
    };
  }
  {
    const base=old('separable-differential-equations');
    G['separable-differential-equations']=()=>{
      const kind=pick(['base','particular_exp','particular_reciprocal','interval_validity','shifted_separable']);if(kind==='base')return base();
      if(kind==='particular_exp'){
        const k=pick([1,2,3]),y0=pick([1,2,3,4]);
        return mc(`sep-ivp-exp-${k}-${y0}`,'separable_particular_exponential','Solve the IVP.',`\\frac{dy}{dx}=${k}xy,\\qquad y(0)=${y0}`,`y=${y0}e^{${texRat(k,2)}x^2}`,[`y=${y0}e^{${k}x}`,`y=${y0}+${texRat(k,2)}x^2`,`y=e^{${y0*k}x}`],`Separate dy/y=${k}x dx. Integration gives ln|y|=${texRat(k,2)}x²+C; the initial condition gives the multiplier ${y0}.`);
      }
      if(kind==='particular_reciprocal'){
        const y0=pick([1,2,3]),x0=0,k=pick([1,2]);const C=1/y0;
        return mc(`sep-recip-${k}-${y0}`,'separable_reciprocal_solution','Solve the IVP.',`\\frac{dy}{dx}=${k}y^2,\\qquad y(0)=${y0}`,`y=\\frac{1}{${fmt(C)}-${k}x}`,[`y=${y0}e^{${k}x}`,`y=\\frac1{${fmt(C)}+${k}x}`,`y=${k}x+${y0}`],`Separate y^{-2}dy=${k}dx. Then −1/y=${k}x+C and use y(0)=${y0}.`);
      }
      if(kind==='interval_validity'){
        const y0=pick([1,2,4]),k=1,C=1/y0,pole=C;
        return mc(`sep-int-${y0}`,'separable_interval_validity','The IVP solution is shown. What is its maximal interval of validity containing x=0?',`y=\\frac1{${fmt(C)}-x}`,`(-\\infty,${fmt(pole)})`,[`(${fmt(pole)},\\infty)`,`(-\\infty,\\infty)`,`[0,${fmt(pole)}]`],`The solution fails where the denominator is zero, x=${fmt(pole)}. The interval containing 0 is (-∞,${fmt(pole)}).`);
      }
      const a=ri(-3,3),b=ri(-3,3);
      return mc(`sep-shift-${a}-${b}`,'shifted_separable','Which separated form is correct?',`\\frac{dy}{dx}=(x${a>=0?`+${a}`:`-${-a}`})(y${b>=0?`+${b}`:`-${-b}`})`,`\\frac{dy}{y${b>=0?`+${b}`:`-${-b}`}}=(x${a>=0?`+${a}`:`-${-a}`})dx`,[`(y${b>=0?`+${b}`:`-${-b}`})dy=\\frac{dx}{x${a>=0?`+${a}`:`-${-a}`}}`,`dy=(x${a>=0?`+${a}`:`-${-a}`})dx`,`\\frac{dy}{x${a>=0?`+${a}`:`-${-a}`}}=(y${b>=0?`+${b}`:`-${-b}`})dx`],`Divide by the y-factor and multiply by dx so all y terms are on the left and all x terms on the right.`);
    };
  }
  {
    const base=old('exponential-growth-and-decay-interest-newton-s-law-of-cooling');
    G['exponential-growth-and-decay-interest-newton-s-law-of-cooling']=()=>{
      const kind=pick(['bacteria','half_life','newton_cooling','daily_interest','continuous_interest','base']);if(kind==='base')return base();
      if(kind==='bacteria'){
        const P0=pick([200,400,600]),factor=pick([2,3]),T=pick([2,3]),future=2*T,ans=P0*factor*factor;
        return mc(`growth-bact-${P0}-${factor}-${T}`,'bacteria_growth','A bacteria culture grows exponentially from P0 to factor·P0 in T hours. How many are present after 2T hours?',`P(0)=${P0},\\qquad P(${T})=${P0*factor}`,String(ans),[String(P0*factor),String(P0+2*factor),String(P0*factor**3)],`Each ${T}-hour interval multiplies the population by ${factor}; two such intervals multiply by ${factor}².`);
      }
      if(kind==='half_life'){
        const half=pick([4,8,10,20]),P0=pick([40,80,160]),target=P0/4,ans=2*half;
        return mc(`growth-half-${half}-${P0}`,'half_life_decay','A radioactive sample has the stated half-life. How long until only one-fourth remains?',`P_0=${P0},\\qquad t_{1/2}=${half}`,String(ans),[String(half),String(half/2),String(4*half)],`One-fourth is two halvings, so the time is 2(${half})=${ans}.`);
      }
      if(kind==='newton_cooling'){
        const Ts=pick([20,60,70]),T0=Ts+pick([80,120]),ratio=0.5,t1=pick([10,20]),t2=2*t1,ans=Ts+(T0-Ts)*ratio*ratio;
        return mc(`cool-${Ts}-${T0}-${t1}`,'newton_cooling','An object cools according to Newton’s Law. After t1 minutes, its temperature difference from room temperature has been halved. What is its temperature after 2t1 minutes?',`T_s=${Ts},\\quad T(0)=${T0},\\quad t_1=${t1}`,String(ans),[String((T0+Ts)/2),String(Ts+(T0-Ts)/2),String(Ts)],`Newton cooling makes the temperature difference decay exponentially. Two equal time intervals halve the difference twice: T=${Ts}+(${T0-Ts})/4=${ans}.`);
      }
      if(kind==='daily_interest'){
        const P=pick([1000,5000,10000]),r=pick([0.03,0.04,0.05]),years=pick([2,5,10]),ans=P*(1+r/365)**(365*years);
        return mc(`interest-daily-${P}-${r}-${years}`,'daily_compound_interest','Find the balance with daily compounding. Round to the nearest cent.',`P=${P},\\quad r=${fmt(100*r)}\\%,\\quad t=${years}`,fmt(Number(ans.toFixed(2))),[fmt(Number((P*Math.exp(r*years)).toFixed(2))),fmt(Number((P*(1+r)**years).toFixed(2))),String(P)],`Use A=P(1+r/365)^{365t}.`);
      }
      const P=pick([1000,5000,10000]),r=pick([0.02,0.04,0.06]),years=pick([2,5,10]),ans=P*Math.exp(r*years);
      return mc(`interest-cont-${P}-${r}-${years}`,'continuous_interest','Find the balance with continuous compounding. Round to the nearest cent.',`P=${P},\\quad r=${fmt(100*r)}\\%,\\quad t=${years}`,fmt(Number(ans.toFixed(2))),[fmt(Number((P*(1+r/12)**(12*years)).toFixed(2))),fmt(Number((P*(1+r)**years).toFixed(2))),String(P)],`Use A=Pe^{rt}.`);
    };
  }
  {
    const base=old('rate-problems');
    G['rate-problems']=()=>{
      const kind=pick(['base','traffic_cos','inflow_outflow','start_time']);if(kind==='base')return base();
      if(kind==='traffic_cos'){
        const A=ri(40,90),B=pick([3,6,9]),T=Math.PI,ans=A*T; // sine integral zero on symmetric full-ish interval 0..pi for cos(2t)
        return mc(`rate-traffic-${A}-${B}`,'trig_accumulation','Cars pass at the rate R(t). How many cars pass from t=0 to t=π?',`R(t)=${A}+${B}\\cos(2t)`,fmt(ans),numChoices(ans,5),`Total accumulation is ∫_0^π R(t)dt=${A}π because the cosine term integrates to zero. Numerically this is ${fmt(ans)}.`);
      }
      if(kind==='inflow_outflow'){
        const A0=ri(1000,3000),inflow=ri(80,140),out=ri(40,100),T=ri(5,12),ans=A0+(inflow-out)*T;
        return mc(`rate-tank-${A0}-${inflow}-${out}-${T}`,'inflow_outflow_accumulation','A tank starts with A0 gallons, receives a constant inflow, and loses water at a constant outflow. Find the amount after T hours.',`A_0=${A0},\\quad in=${inflow},\\quad out=${out},\\quad T=${T}`,String(ans),[String(A0+inflow*T),String(A0-out*T),String(A0+(out-inflow)*T)],`Net rate=${inflow-out}. Add net accumulation (${inflow-out})(${T}) to the initial amount.`);
      }
      const start=ri(2,8),end=start+ri(4,10),k=ri(1,5),ans=k*(end*end-start*start)/2;
      return mc(`rate-start-${start}-${end}-${k}`,'delayed_start_accumulation','A process begins at t=start and then accumulates at rate R(t)=kt. How much accumulates by t=end?',`start=${start},\\quad end=${end},\\quad R(t)=${k}t`,fmt(ans),numChoices(ans,2),`Integrate only over the active interval: ∫_${start}^${end}${k}t dt=${fmt(ans)}.`);
    };
  }

  // ---------- Unit 6 ----------
  {
    const base=old('area-below-and-between-curves');
    G['area-below-and-between-curves']=()=>{
      const kind=pick(['base','axis_sign_change','two_parabolas','trig_region','dy_region','multiple_intersections']);if(kind==='base')return base();
      if(kind==='axis_sign_change'){
        const r=ri(1,3),a=0,b=2*r;const F=x=>x*x/2-r*x,ans=Math.abs(F(r)-F(0))+Math.abs(F(b)-F(r));
        return mc(`area-sign-${r}`,'area_with_sign_change','Find the total area between the graph and the x-axis.',`y=x-${r},\\qquad 0\\le x\\le${b}`,fmt(ans),[fmt(Math.abs(F(b)-F(0))),fmt(ans*2),String(0)],`Split where y=0, at x=${r}, and add the absolute values of the two signed integrals.`);
      }
      if(kind==='two_parabolas'){
        const h=ri(1,4),top=ri(3,8),a=Math.sqrt(top/2);const ans=4*Math.pow(top,1.5)/(3*Math.sqrt(2));
        return mc(`area-par-${top}`,'area_two_parabolas','Find the enclosed area.',`y=-x^2+${top},\\qquad y=x^2`,fmt(ans),numChoices(ans,1),`The curves meet where 2x²=${top}. Integrate top-minus-bottom from -√(${top}/2) to +√(${top}/2).`);
      }
      if(kind==='trig_region'){
        const k=pick([1,2,3]),ans=2*k;
        return mc(`area-trig-${k}`,'trig_area','Find the area under the curve on the interval.',`y=${k}\\sin x,\\qquad 0\\le x\\le\\pi`,String(ans),[String(k),texPiRat(k),String(0)],`Sine is nonnegative on [0,π]. ∫_0^π ${k}sin x dx=${2*k}.`);
      }
      if(kind==='dy_region'){
        const h=ri(2,6),c=ri(1,4),ans=c*h*h/2;
        return mc(`area-dy-${c}-${h}`,'area_in_terms_of_y','Find the area using horizontal slices.',`x=${c}y,\\qquad x=${c*h},\\qquad 0\\le y\\le${h}`,fmt(ans),numChoices(ans,1),`Width=${c*h}-${c}y. Integrate with respect to y from 0 to ${h}.`);
      }
      const a=ri(1,3),ans=a**4/2;
      return mc(`area-multi-${a}`,'multiple_intersection_area','Find the total enclosed area between the curves.',`y=x^3-${a*a}x,\\qquad y=0`,fmt(ans),numChoices(ans,1),`The intersections are x=-${a},0,${a}. By symmetry, total area is twice the magnitude of the integral on [0,${a}], which is ${fmt(ans)}.`);
    };
  }
  {
    const base=old('finding-area-in-terms-of-y');
    G['finding-area-in-terms-of-y']=()=>{
      const kind=pick(['base','parabola_horizontal','two_curves_y']);if(kind==='base')return base();
      if(kind==='parabola_horizontal'){
        const h=ri(1,5),ans=4*Math.pow(h,1.5)/3;
        return mc(`areay-par-${h}`,'horizontal_parabola_region','Find the area by integrating with respect to y.',`x=\\pm\\sqrt{y},\\qquad 0\\le y\\le${h}`,fmt(ans),numChoices(ans,1),`Horizontal width is √y−(−√y)=2√y. Integrate 2√y from 0 to ${h}.`);
      }
      const h=ri(2,6),c=ri(1,4),ans=c*h*h/2;
      return mc(`areay-two-${c}-${h}`,'horizontal_between_lines','Find the area using dy.',`x=${c*h},\\qquad x=${c}y,\\qquad 0\\le y\\le${h}`,fmt(ans),numChoices(ans,1),`Right minus left is ${c*h}-${c}y; integrate over y.`);
    };
  }
  {
    const base=old('volume-by-cross-sections');
    G['volume-by-cross-sections']=()=>{
      const kind=pick(['base','rectangle','isosceles_hypotenuse','equilateral','semicircle','quarter_circle','dy_square']);if(kind==='base')return base();
      const a=ri(1,4),k=ri(1,4);
      if(kind==='rectangle'){
        const ans=2*k*k*a**3/3;
        return mc(`cross-rect-${k}-${a}`,'rectangle_cross_sections','Cross sections perpendicular to the x-axis are rectangles whose height is twice the base segment in the xy-plane. The base segment has length kx. Find the volume.',`0\\le x\\le${a},\\quad segment=${k}x`,fmt(ans),numChoices(ans,1),`Cross-sectional area=2(${k}x)². Integrate from 0 to ${a}.`);
      }
      if(kind==='isosceles_hypotenuse'){
        const ans=k*k*a**3/12;
        return mc(`cross-iso-${k}-${a}`,'isosceles_right_hypotenuse','Cross sections are isosceles right triangles whose hypotenuse is the base segment kx. Find the volume.',`0\\le x\\le${a}`,fmt(ans),numChoices(ans,.5),`For hypotenuse h, an isosceles-right triangle has area h²/4. Integrate (${k}x)²/4.`);
      }
      if(kind==='equilateral'){
        const ans=Math.sqrt(3)/4*k*k*a**3/3;
        return mc(`cross-eq-${k}-${a}`,'equilateral_cross_sections','Cross sections are equilateral triangles with side length kx. Find the volume.',`0\\le x\\le${a}`,fmt(ans),numChoices(ans,.5),`Area=(√3/4)s². Integrate (√3/4)(${k}x)² from 0 to ${a}.`);
      }
      if(kind==='semicircle'){
        const ans=Math.PI/8*k*k*a**3/3;
        return mc(`cross-semi-${k}-${a}`,'semicircle_cross_sections','Cross sections are semicircles whose diameter is kx. Find the volume.',`0\\le x\\le${a}`,fmt(ans),numChoices(ans,.5),`A semicircle with diameter d has area πd²/8. Integrate π(${k}x)²/8.`);
      }
      if(kind==='quarter_circle'){
        const ans=Math.PI/4*k*k*a**3/3;
        return mc(`cross-quarter-${k}-${a}`,'quarter_circle_cross_sections','Cross sections are quarter-circles whose radius is kx. Find the volume.',`0\\le x\\le${a}`,fmt(ans),numChoices(ans,.5),`Quarter-circle area=πr²/4. Integrate π(${k}x)²/4.`);
      }
      const h=ri(1,4),ans=2*h*h;
      return mc(`cross-dy-${h}`,'dy_square_cross_sections','The base is bounded by x=±√y for 0≤y≤h. Cross sections perpendicular to the y-axis are squares. Find the volume.',`0\\le y\\le${h}`,fmt(ans),numChoices(ans,1),`Square side=2√y, so area=4y. Integrate from 0 to ${h}; volume=${2*h*h}.`);
    };
  }
  {
    const base=old('solids-of-revolution');
    G['solids-of-revolution']=()=>{
      const kind=pick(['base','radical_disk','washer_constant_inner','washer_between_curves','shifted_horizontal','shell_y_axis','shifted_vertical_shell']);if(kind==='base')return base();
      if(kind==='radical_disk'){
        const k=ri(1,4),a=ri(1,5),ans=Math.PI*k*a*a/2;
        return mc(`solid-rad-${k}-${a}`,'disk_radical','Rotate the region under the curve about the x-axis. Find the volume.',`y=\\sqrt{${k}x},\\qquad 0\\le x\\le${a}`,fmt(ans),numChoices(ans,1),`Using disks, V=π∫_0^${a}(√(${k}x))²dx=π∫_0^${a}${k}x dx.`);
      }
      if(kind==='washer_constant_inner'){
        const R=ri(3,8),r=ri(1,R-1),a=ri(1,5),ans=Math.PI*(R*R-r*r)*a;
        return mc(`solid-wash-const-${R}-${r}-${a}`,'washer_constant_radii','A rectangular region between y=r and y=R for 0≤x≤a is revolved about the x-axis. Find the volume.',`r=${r},\\ R=${R},\\ a=${a}`,fmt(ans),numChoices(ans,2),`Washers have area π(R²−r²). Multiply by the interval length ${a}.`);
      }
      if(kind==='washer_between_curves'){
        const a=ri(1,3),k=ri(a+1,a+4),ans=Math.PI*((k*k)*a - a**3/3);
        return mc(`solid-wash-curves-${k}-${a}`,'washer_between_curves','Rotate the region between y=k and y=x on [0,a] about the x-axis, where k>a. Find the volume.',`k=${k},\\quad a=${a}`,fmt(ans),numChoices(ans,1),`Outer radius=${k}, inner radius=x. V=π∫_0^${a}(${k*k}-x²)dx.`);
      }
      if(kind==='shifted_horizontal'){
        const c=ri(1,4),a=ri(1,4),k=ri(1,3);const ans=Math.PI*(((c+k*a)**2-c*c)*a); // simplified rectangular-height linear endpoint not exact variable; use constant region instead
        return mc(`solid-shift-h-${c}-${k}-${a}`,'shifted_horizontal_axis_setup','A region between y=0 and y=k on 0≤x≤a is revolved about y=−c. Which washer area is correct?',`k=${k},\\ a=${a},\\ c=${c}`,`\\pi[(${c+k})^2-${c}^2]`,[`\\pi[${k}^2-${c}^2]`,`\\pi(${c+k})^2`,`2\\pi(${c})(${k})`],`Distances from y=−${c} are outer radius ${c+k} and inner radius ${c}.`);
      }
      if(kind==='shell_y_axis'){
        const a=ri(1,5),k=ri(1,4),ans=2*Math.PI*k*a**3/3;
        return mc(`solid-shell-y-${k}-${a}`,'shell_about_y_axis','Use cylindrical shells to rotate the region under y=kx on [0,a] about the y-axis. Find the volume.',`k=${k},\\quad a=${a}`,fmt(ans),numChoices(ans,1),`Shell radius=x, height=${k}x. V=2π∫_0^${a}x(${k}x)dx.`);
      }
      const a=ri(1,4),c=ri(a+1,a+4),k=ri(1,4);const ans=2*Math.PI*k*((c*a*a/2)-(a**3/3));
      return mc(`solid-shell-shift-${c}-${k}-${a}`,'shell_shifted_vertical_axis','The region under y=kx on [0,a] is revolved about x=c, with c>a. Find the shell-method setup factor for the radius.',`k=${k},\\ a=${a},\\ c=${c}`,`${c}-x`,[`x-${c}`,'x',String(c)],`For a vertical axis x=${c} to the right of the region, shell radius is horizontal distance ${c}-x.`);
    };
  }
})();



// Difference-quotient assignment-fidelity extension: point form and derivative-by-limit.
{
  const base=G['difference-quotient'];
  G['difference-quotient']=()=>{
    if(R()>=.35)return base();
    const kind=pick(['quadratic_point','cubic_point','radical_point','reciprocal_point']),askLimit=R()<.5;
    if(kind==='quadratic_point'){
      const A=nz(-4,4),B=nz(-6,6),C=ri(-6,6),a=ri(-3,3),fa=A*a*a+B*a+C;
      if(askLimit){const ans=2*A*a+B;return mc(`dq-point-lim-q-${A}-${B}-${C}-${a}`,'point_form_derivative_limit','Evaluate the derivative limit.',`f(x)=${poly2(A,B,C)},\\qquad \\lim_{x\\to ${a}}\\frac{f(x)-f(${a})}{${xm(a)}}`,String(ans),numChoices(ans,2),`This is f′(${a}). Since f′(x)=${signed(2*A,'x',true)}${signed(B,'')}, the limit is ${ans}.`)}
      const correct=`${signed(A,'x',true)}${signed(A*a+B,'')}`;
      return mc(`dq-point-simp-q-${A}-${B}-${C}-${a}`,'point_form_simplification','Simplify the point-form difference quotient.',`f(x)=${poly2(A,B,C)},\\qquad \\frac{f(x)-f(${a})}{${xm(a)}}`,correct,[`${signed(2*A,'x',true)}${signed(B,'')}`,`${signed(A,'x',true)}${signed(B,'')}`,String(2*A*a+B)],`Factor f(x)-f(${a}) by x-${a}. The remaining linear factor is ${correct}.`)
    }
    if(kind==='cubic_point'){
      const A=nz(-2,2),B=nz(-3,3),C=nz(-4,4),D=ri(-5,5),a=ri(-2,2),ans=3*A*a*a+2*B*a+C;
      return mc(`dq-point-lim-c-${A}-${B}-${C}-${D}-${a}`,'point_form_derivative_limit','Evaluate the derivative limit.',`f(x)=${poly3(A,B,C,D)},\\qquad \\lim_{x\\to ${a}}\\frac{f(x)-f(${a})}{${xm(a)}}`,String(ans),numChoices(ans,2),`The limit is f′(${a}). Differentiate the cubic and evaluate at ${a}.`)
    }
    if(kind==='radical_point'){
      const r=ri(2,6),c=ri(0,5),a=r*r-c,den=2*r;
      return mc(`dq-point-rad-${r}-${c}`,'point_form_radical','Evaluate the derivative limit.',`f(x)=\\sqrt{x+${c}},\\qquad \\lim_{x\\to ${a}}\\frac{f(x)-f(${a})}{${xm(a)}}`,texRat(1,den),[texRat(1,r),String(den),String(r)],`Rationalizing the quotient gives 1/(√(x+${c})+${r}); taking x→${a} gives ${texRat(1,den)}.`)
    }
    const c=ri(1,6),a=ri(0,4),den=(a+c)*(a+c),correct=texRat(-1,den);
    return mc(`dq-point-recip-${a}-${c}`,'point_form_reciprocal','Evaluate the derivative limit.',`f(x)=\\frac1{x+${c}},\\qquad \\lim_{x\\to ${a}}\\frac{f(x)-f(${a})}{${xm(a)}}`,correct,[texRat(1,den),texRat(-1,a+c),texRat(1,a+c)],`This is f′(${a}) for f(x)=1/(x+${c}); f′(x)=−1/(x+${c})², so the value is ${correct}.`)
  };
}

// Additional assignment-fidelity generators (v10.5.7).
G['continuity-parameters']=()=>{
  // Continuity-parameter practice: every prompt visibly contains the parameter(s)
  // being solved for.  About 50% are three-piece problems that require a 2x2
  // system for a and b; the remainder solve a single parameter k.
  const kind=R()<0.50?'three_piece_system':pick(['piecewise_value','removable_fill','piecewise_parameter','quadratic_parameter']);
  if(kind==='three_piece_system'){
    let r=pick([-3,-2,-1,1,2]),s0=pick([-3,-2,-1,1,2,3]);
    while(s0===r||s0===0||r===0)s0=pick([-3,-2,-1,1,2,3]);
    const left=Math.min(r,s0),right=Math.max(r,s0);
    const A=nz(-3,3),B=nz(-5,5),C=ri(-6,6);
    const m1=nz(-3,3),m2=nz(-3,3);
    const q=x=>A*x*x+B*x+C;
    const n1=q(left)-m1*left,n2=q(right)-m2*right;
    const correct=`a=${A},\\ b=${B}`;
    const wrongs=[`a=${A+1},\\ b=${B}`,`a=${A},\\ b=${B+(B===0?2:1)}`,`a=${-A},\\ b=${B}`];
    const leftEq=q(left),rightEq=q(right);
    return mc(`cont-param-system-${A}-${B}-${C}-${left}-${right}-${m1}-${m2}`,'three_piece_system',
      'Find a and b so the function is continuous everywhere.',
      `f(x)=\\begin{cases}${lin(m1,n1)},&x<${left}\\\\ax^2+bx${signed(C,'')},&${left}\\le x<${right}\\\\${lin(m2,n2)},&x\\ge ${right}\\end{cases}`,
      correct,wrongs,
      `Continuity is required at both breakpoints. At \\(x=${left}\\), the two adjacent pieces must agree, giving \\(${left*left}a${signed(left,'b')} ${C? (C>0?`+${C}`:`${C}`):''}=${leftEq}\\). At \\(x=${right}\\), continuity gives \\(${right*right}a${signed(right,'b')} ${C? (C>0?`+${C}`:`${C}`):''}=${rightEq}\\). Subtract the constant and divide each equation by its nonzero breakpoint:<br>\\(${left}a+b=${(leftEq-C)/left},\\qquad ${right}a+b=${(rightEq-C)/right}\\).<br>Subtract the first from the second: \\(${right-left}a=${A*(right-left)}\\), so \\(a=${A}\\). Then \\(b=${(leftEq-C)/left}-(${left})(${A})=${B}\\). Each piece is continuous on its interval, and these matches make both junctions continuous.`);
  }
  if(kind==='piecewise_value'){
    const a=nz(-4,4),b=ri(-6,6),c=ri(-3,3),k=a*c+b;
    return mc(`cont-param-value-${a}-${b}-${c}`,'piecewise_value',`Find k so the function is continuous at x=${c}.`,`f(x)=\\begin{cases}${lin(a,b)},&x<${c}\\\\k,&x\\ge ${c}\\end{cases}`,String(k),numChoices(k,1),`Continuity requires the left-hand limit, right-hand limit, and defined value to agree at \\(x=${c}\\). The linear piece gives \\(${lin(a,b).replace(/x/g,`(${c})`)}=${k}\\), so \\(k=${k}\\).`);
  }
  if(kind==='removable_fill'){
    const a=nz(-5,5),k=2*a;
    return mc(`cont-param-hole-${a}`,'removable_fill',`Find k so the function is continuous at x=${a}.`,`f(x)=\\begin{cases}\\dfrac{x^2-${a*a}}{${xm(a)}},&x\\ne ${a}\\\\k,&x=${a}\\end{cases}`,String(k),numChoices(k,1),`For \\(x\\ne ${a}\\), factor the numerator: \\(x^2-${a*a}=(${xm(a)})(x${a>=0?`+${a}`:`-${-a}`})\\). After canceling for \\(x\\ne${a}\\), the expression tends to \\(${a}+(${a})=${k}\\). Continuity requires the assigned point value \\(k\\) to equal this limit, so \\(k=${k}\\).`);
  }
  if(kind==='quadratic_parameter'){
    const c=pick([-3,-2,-1,1,2,3]),A=nz(-3,3),B=ri(-5,5),m=nz(-4,4),n=ri(-5,5);
    const target=m*c+n;
    const k=target-(A*c*c+B*c);
    return mc(`cont-param-quad-${A}-${B}-${c}-${m}-${n}`,'quadratic_parameter',`Find k so the function is continuous at x=${c}.`,`f(x)=\\begin{cases}${lin(m,n)},&x<${c}\\\\${signed(A,'x^2',true)}${signed(B,'x')}${signed(1,'k')},&x\\ge ${c}\\end{cases}`,String(k),numChoices(k,2),`Match the left-hand limit to the right-hand limit and defined value at \\(x=${c}\\): \\(${target}=${A*c*c+B*c}+k\\). Solving gives \\(k=${k}\\).`);
  }
  const m=nz(-4,4),n=ri(-5,5),p=nz(-4,4),c=ri(-3,3),k=(m-p)*c+n;
  return mc(`cont-param-coeff-${m}-${n}-${p}-${c}`,'piecewise_parameter',`Find k so the function is continuous at x=${c}.`,`f(x)=\\begin{cases}${lin(m,n)},&x<${c}\\\\${signed(p,'x',true)}+k,&x\\ge ${c}\\end{cases}`,String(k),numChoices(k,2),`Continuity requires the one-sided limits and defined value to agree at \\(x=${c}\\). Thus \\(${m*c+n}=${p*c}+k\\), so \\(k=${k}\\).`);
};

G['squeeze-course-practice']=()=>{
  // Course-assignment mix: about 20% Squeeze Theorem and 80% straightforward trig limits at x -> 0.
  if(R()<0.20){
    const power=ri(1,5),innerPower=ri(1,3),k=ri(1,6),coef=ri(1,4),fn=pick(['\\sin','\\cos']);
    const coefText=coef===1?'':String(coef);
    const xPow=power===1?'x':`x^${power}`;
    const innerDen=innerPower===1?'x':`x^${innerPower}`;
    const isSin=fn==='\\sin',variant=isSin?'squeeze_sine':'squeeze_cosine';
    const bound=coef===1?(power===1?'|x|':`|x|^${power}`):`${coef}${power===1?'|x|':`|x|^${power}`}`;
    return mc(`sq-bound-0-${isSin?'sin':'cos'}-${coef}-${power}-${k}-${innerPower}`,variant,'Find the limit.',`\\displaystyle\\lim_{x\\to0}${coefText}${xPow}${fn}\\left(\\frac{${k}}{${innerDen}}\\right)`,'0',['1','-1','DNE'],`The ${isSin?"sine":"cosine"} factor has absolute value at most \\(1\\), so the absolute value of the entire expression lies between \\(0\\) and \\(${bound}\\). Both bounds tend to \\(0\\), giving limit \\(0\\) by the Squeeze Theorem.`);
  }
  const kind=pick(['sin_over_x','x_over_sin','tan_over_x','x_over_tan','one_minus_cos','cos_minus_one']);
  const k=ri(1,9);
  if(kind==='sin_over_x')return mc(`sq-sinx-${k}`,'standard_sine_over_x','Find the limit.',`\\displaystyle\\lim_{x\\to0}\\frac{\\sin(${k}x)}{x}`,String(k),numChoices(k,1),`With angles in radians, write \\(\\frac{\\sin(${k}x)}x=${k}\\frac{\\sin(${k}x)}{${k}x}\\). The sine-over-angle ratio tends to \\(1\\), so the limit is \\(${k}\\).`);
  if(kind==='x_over_sin')return mc(`sq-xsin-${k}`,'standard_x_over_sine','Find the limit.',`\\displaystyle\\lim_{x\\to0}\\frac{x}{\\sin(${k}x)}`,texRat(1,k),[String(k),String(-k),'0'],`Write \\(\\frac{x}{\\sin(${k}x)}=\\frac1{${k}}\\frac{${k}x}{\\sin(${k}x)}\\). The last factor is the reciprocal of the sine-over-angle ratio, which tends to \\(1\\) in radians. Thus the limit is \\(${texRat(1,k)}\\).`);
  if(kind==='tan_over_x')return mc(`sq-tanx-${k}`,'standard_tangent_over_x','Find the limit.',`\\displaystyle\\lim_{x\\to0}\\frac{\\tan(${k}x)}{x}`,String(k),numChoices(k,1),`Use the quotient identity:<br>\\(\\frac{\\tan(${k}x)}x=${k}\\frac{\\sin(${k}x)}{${k}x}\\frac1{\\cos(${k}x)}\\).<br>With angles in radians, the last two factors tend to \\(1\\), so the limit is \\(${k}\\).`);
  if(kind==='x_over_tan')return mc(`sq-xtan-${k}`,'standard_x_over_tangent','Find the limit.',`\\displaystyle\\lim_{x\\to0}\\frac{x}{\\tan(${k}x)}`,texRat(1,k),[String(k),String(-k),'0'],`Use the quotient identity:<br>\\(\\frac{x}{\\tan(${k}x)}=\\frac1{${k}}\\frac{${k}x}{\\sin(${k}x)}\\cos(${k}x)\\).<br>The reciprocal sine ratio and cosine tend to \\(1\\), so the limit is \\(${texRat(1,k)}\\).`);
  if(kind==='one_minus_cos')return mc(`sq-1cos-${k}`,'one_minus_cosine_over_x','Find the limit.',`\\displaystyle\\lim_{x\\to0}\\frac{1-\\cos(${k}x)}{x}`,'0',[String(k),String(-k),'DNE'],`Multiply by the conjugate:<br>\\(\\frac{1-\\cos(${k}x)}x=\\frac{\\sin^2(${k}x)}{x(1+\\cos(${k}x))}=${k}\\frac{\\sin(${k}x)}{${k}x}\\frac{\\sin(${k}x)}{1+\\cos(${k}x)}\\).<br>The sine ratio tends to \\(1\\), while the last fraction tends to \\(0/2=0\\), giving limit \\(0\\).`);
  return mc(`sq-cos1-${k}`,'cosine_minus_one_over_x','Find the limit.',`\\displaystyle\\lim_{x\\to0}\\frac{\\cos(${k}x)-1}{x}`,'0',[String(-k),String(k*k),'DNE'],`Factor out a minus sign and use the conjugate:<br>\\(\\frac{\\cos(${k}x)-1}x=-\\frac{\\sin^2(${k}x)}{x(1+\\cos(${k}x))}=-${k}\\frac{\\sin(${k}x)}{${k}x}\\frac{\\sin(${k}x)}{1+\\cos(${k}x)}\\).<br>The sine ratio tends to \\(1\\) and the last fraction to \\(0\\), so the limit is \\(0\\).`);
};

G['derivatives-conceptual-review']=()=>{
  const make=(id,variant,prompt,math,correct,wrongs,explanation)=>{
    const vals=shuffle([correct,...wrongs]);
    return {id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${math}\\)</div>`:''}</div>`,choices:vals,correctIndex:vals.indexOf(correct),choicesAreText:true,choicesHtml:true,explanation};
  };
  const kind=pick(['diff_cont','derivative_meaning','second_derivative','inverse_rule','implicit_point','nondifferentiable']);
  if(kind==='diff_cont')return make('dconcept-diff-cont','differentiability_continuity','Which statement must be true?',`f\\text{ is differentiable at }x=a.`,`\\(f\\) is continuous at \\(x=a\\).`,[`\\(f\\) has a local maximum at \\(x=a\\).`,`\\(f'(a)=0\\).`,`\\(f''(a)\\) exists.`],`Differentiability at a point implies continuity there. It does not require \\(f'(a)=0\\), a local maximum, or the existence of \\(f''(a)\\).`);
  if(kind==='derivative_meaning'){
    const a=ri(-3,3),m=nz(-5,5);
    return make(`dconcept-meaning-${a}-${m}`,'derivative_interpretation','What does the derivative value tell you?',`f'(${a})=${m}`,`The tangent line at \\(x=${a}\\) has slope \\(${m}\\).`,[`\\(f(${a})=${m}\\).`,`The graph has a horizontal tangent at \\(x=${a}\\).`,`\\(f\\) is concave up at \\(x=${a}\\).`],`The derivative value \\(f'(${a})=${m}\\) is the slope of the tangent line at \\(x=${a}\\).`);
  }
  if(kind==='second_derivative'){
    const fp=pick([-4,-2,2,4]),fpp=pick([-3,-1,1,3]);
    const correct=fp>0?(fpp>0?'Increasing and concave up.':'Increasing and concave down.'):(fpp>0?'Decreasing and concave up.':'Decreasing and concave down.');
    const pool=['Increasing and concave up.','Increasing and concave down.','Decreasing and concave up.','Decreasing and concave down.'].filter(x=>x!==correct);
    return make(`dconcept-2nd-${fp}-${fpp}`,'first_second_derivative_signs','Describe the graph at the indicated point.',`f'(a)=${fp},\\qquad f''(a)=${fpp}`,correct,pool,`The sign of \\(f'\\) determines increasing or decreasing behavior, while the sign of \\(f''\\) determines concavity.`);
  }
  if(kind==='inverse_rule'){
    const m=pick([2,3,4,5]);
    return make(`dconcept-inv-${m}`,'inverse_derivative_rule','Find the indicated derivative.',`f(a)=b,\\qquad f'(a)=${m},\\qquad (f^{-1})'(b)=?`,`\\(\\frac{1}{${m}}\\)`,[`\\(${m}\\)`,`\\(-\\frac{1}{${m}}\\)`,`\\(-${m}\\)`],`Because \\(f(a)=b\\), \\((f^{-1})'(b)=\\frac{1}{f'(a)}=\\frac{1}{${m}}\\).`);
  }
  if(kind==='implicit_point'){
    const a=pick([1,2,3]),b=pick([1,2,3]),[n,d]=rat(-a,b);
    const correct=`\\(${texRat(n,d)}\\)`;
    return make(`dconcept-imp-${a}-${b}`,'implicit_slope_point','Find the derivative.',`${a}x+${b}y=c`,correct,[`\\(${texRat(-n,d)}\\)`,`\\(${texRat(n,b)}\\)`,`\\(${texRat(-b,a)}\\)`],`Differentiating gives \\(${a}+${b}\\frac{dy}{dx}=0\\), so \\(\\frac{dy}{dx}=${texRat(n,d)}\\).`);
  }
  return make('dconcept-corner','nondifferentiability','At which feature is a function not differentiable?','', 'A sharp corner.',['A smooth local minimum.','A horizontal tangent.','A point with positive slope.'],'At a sharp corner, the one-sided tangent slopes do not agree, so the derivative does not exist there.');
};

// v10.6.1 manual-review rebuilds and display hardening.
(function v1061ManualReview(){
 const cleanTex=t=>String(t).replace(/\+\s*-/g,'- ').replace(/-\s*-/g,'+ ');
 const textChoice=v=>/\b(?:and|or|yes|no|cannot|continuous|discontinuous|maximum|minimum|increasing|decreasing|concave|tangent|normal|horizontal|vertical|applies|does not apply|solution|solutions|left|right|speeding|slowing|disks|washers|shells)\b/i.test(String(v));
 function safeMc(id,variant,prompt,math,correct,wrongs,explanation){
   const vals=[],seen=new Set();for(const x of [correct,...wrongs]){if(x==null)continue;const v=cleanTex(String(x).trim());if(!v||seen.has(v))continue;seen.add(v);vals.push(v)}
   const fallback=['None of the other choices.','No solution.','Infinitely many solutions.','All of the other choices.'];let j=0;while(vals.length<4&&j<fallback.length){if(!seen.has(fallback[j])){seen.add(fallback[j]);vals.push(fallback[j])}j++;}
   const shuffled=shuffle(vals.slice(0,4)),cn=cleanTex(String(correct).trim());return{id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${cleanTex(math)}\\)</div>`:''}</div>`,choices:shuffled,correctIndex:shuffled.indexOf(cn),choicesAreText:shuffled.some(textChoice),explanation};
 }
 function exactNumeric(id,variant,prompt,math,n,d,explanation){const [a,b]=rat(n,d),val=a/b;return{id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${cleanTex(math)}\\)</div>`:''}</div>`,answerType:'numeric',numericAnswer:val,numericTolerance:1e-8,answerTex:texRat(a,b),explanation};}
 function calcNumeric(id,variant,prompt,math,value,explanation){return{id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${cleanTex(math)}\\)</div>`:''}</div>`,answerType:'numeric',numericAnswer:Number(value),numericTolerance:0.001,answerTex:Number(value).toFixed(3),explanation};}
 const ctex=(c,term='')=>c===1&&term?term:c===-1&&term?`-${term}`:`${c}${term}`;
 const texPiRat=(n,d=1)=>{const[a,b]=rat(n,d);if(a===0)return'0';const sg=a<0?'-':'',aa=Math.abs(a);if(b===1)return aa===1?`${sg}\\pi`:`${sg}${aa}\\pi`;return aa===1?`${sg}\\frac{\\pi}{${b}}`:`${sg}\\frac{${aa}\\pi}{${b}}`;};
 const plusminus=(a,bterm)=>a+(String(bterm).startsWith('-')?` - ${String(bterm).slice(1)}`:` + ${bterm}`);

 // Tangent/normal lines: no silly 1^3-style numeric substitutions in displayed questions/explanations.
 G['equations-of-tangent-and-normal-lines']=()=>{
   const fam=pick(['quadratic_tangent','cubic_normal','radical_tangent','reciprocal_normal','sine_tangent','log_tangent']);
   if(fam==='quadratic_tangent'){const A=pick([1,2,3,-1,-2]),B=nz(-5,5),C=ri(-4,4),x0=pick([-2,-1,0,1,2]),y0=A*x0*x0+B*x0+C,m=2*A*x0+B;return safeMc(`tn-q-${A}-${B}-${C}-${x0}`,'quadratic_tangent','Find the equation of the tangent line.',`f(x)=${poly2(A,B,C)},\\quad x=${x0}`,`y-${y0}=${m}(x-${x0})`,[`y-${y0}=${-m}(x-${x0})`,`y=${m}x`,`y-${m}=${y0}(x-${x0})`],`Differentiate first: \\(f'(x)=${signed(2*A,'x',true)}${signed(B,'')}\\). At \\(x=${x0}\\), the slope is \\(${m}\\), and the point is \\(( ${x0},${y0})\\).`)}
   if(fam==='cubic_normal'){const A=pick([1,2,-1]),B=pick([-3,-2,2,3]),x0=pick([-2,-1,1,2]),y0=A*x0**3+B*x0,m=3*A*x0*x0+B;if(m===0)return safeMc(`tn-cv-${A}-${B}-${x0}`,'cubic_normal','Find the equation of the normal line.',`f(x)=${signed(A,'x^3',true)}${signed(B,'x')},\\quad x=${x0}`,`x=${x0}`,[`y=${y0}`,`y=0`,`x=${-x0}`],`The tangent slope is 0, so the tangent is horizontal and the normal line is vertical through \\(x=${x0}\\).`);const nm=texRat(-1,m);return safeMc(`tn-c-${A}-${B}-${x0}`,'cubic_normal','Find the equation of the normal line.',`f(x)=${signed(A,'x^3',true)}${signed(B,'x')},\\quad x=${x0}`,`y-${y0}=${nm}(x-${x0})`,[`y-${y0}=${m}(x-${x0})`,`y=${nm}x`,`y-${y0}=${texRat(1,m)}(x-${x0})`],`The tangent slope is \\(${m}\\), so the normal slope is the negative reciprocal \\(${nm}\\). Use point-slope form through \\((${x0},${y0})\\).`)}
   if(fam==='radical_tangent'){const r=ri(2,6),x0=r*r,m=texRat(1,2*r);return safeMc(`tn-root-${r}`,'radical_tangent','Find the tangent line.',`f(x)=\\sqrt{x},\\quad x=${x0}`,`y-${r}=${m}(x-${x0})`,[`y-${r}=${2*r}(x-${x0})`,`y=${m}x`,`y-${x0}=${m}(x-${r})`],`Since \\(f'(x)=\\frac{1}{2\\sqrt{x}}\\), the slope at \\(x=${x0}\\) is \\(${m}\\).`)}
   if(fam==='reciprocal_normal'){const a=pick([1,2,3,4]),y0=texRat(1,a),tm=texRat(-1,a*a),nm=String(a*a);return safeMc(`tn-rec-${a}`,'reciprocal_normal','Find the normal line.',`f(x)=\\frac1x,\\quad x=${a}`,`y-${y0}=${nm}(x-${a})`,[`y-${y0}=${tm}(x-${a})`,`y=${nm}x`,`y-${y0}=-${nm}(x-${a})`],`The tangent slope is \\(-\\frac{1}{${a*a}}\\), so the normal slope is \\(${a*a}\\).`)}
   if(fam==='sine_tangent'){const k=pick([1,2,3,4]),x0=0,m=k;return safeMc(`tn-sin-${k}`,'sine_tangent','Find the tangent line at the indicated point.',`f(x)=\\sin(${ctex(k,'x')}),\\quad x=0`,`y=${m===1?'x':`${m}x`}`,[`y=${-m}x`,`y=${k+1}x`,`y=${m}x+1`],`\\(f'(x)=${ctex(k,`\\cos(${ctex(k,'x')})`)}\\), so \\(f'(0)=${m}\\) and \\(f(0)=0\\).`)}
   const k=pick([2,3,4,5]);return safeMc(`tn-log-${k}`,'log_tangent','Find the tangent line.',`f(x)=\\ln(${k}x),\\quad x=1`,`y-\\ln(${k})=x-1`,[`y-\\ln(${k})=${k}(x-1)`,`y=x`,`y-1=x-\\ln(${k})`],`Since \\(f'(x)=1/x\\), the tangent slope at \\(x=1\\) is 1. The point is \\((1,\\ln ${k})\\).`);
 };

 // Motion in Applications of Derivatives: differentiation only; never require integration.
 G['motion']=(opts={})=>{
   const given=pick(['position','position','velocity']);
   if(given==='position'){
     const fam=pick(['cubic','quartic','trig','exponential']);const ask=pick(['velocity','speed','acceleration']);
     if(fam==='cubic'){const A=pick([1,2,-1]),B=nz(-6,6),C=ri(-5,5),t=pick([0,1,2]);const v=3*A*t*t+2*B*t+C,a=6*A*t+2*B,ans=ask==='velocity'?v:ask==='speed'?Math.abs(v):a;return safeMc(`mot-pos-c-${A}-${B}-${C}-${t}-${ask}`,`position_${ask}`,`A particle has position s(t). Find its ${ask} at t=${t}.`,`s(t)=${signed(A,'t^3',true)}${signed(B,'t^2')}${signed(C,'t')}`,String(ans),numChoices(ans,2),`Differentiate position to obtain velocity, \\(v(t)=s'(t)\\), and differentiate again for acceleration. ${ask==='speed'?'Speed is \\(|v(t)|\\).':''}`)}
     if(fam==='quartic'){const A=pick([1,-1]),B=pick([1,2,3,-2]),t=pick([0,1,2]);const v=4*A*t**3+3*B*t*t,a=12*A*t*t+6*B*t,ans=ask==='velocity'?v:ask==='speed'?Math.abs(v):a;return safeMc(`mot-pos-q4-${A}-${B}-${t}-${ask}`,`position_${ask}`,`A particle has position s(t). Find its ${ask} at t=${t}.`,`s(t)=${signed(A,'t^4',true)}${signed(B,'t^3')}`,String(ans),numChoices(ans,2),`Use \\(v=s'\\) and \\(a=v'\\). ${ask==='speed'?'Then take the absolute value of velocity.':''}`)}
     if(fam==='trig'){const k=pick([1,2,3]),ask2=pick(['velocity','speed','acceleration']),t=0,v=k,a=0,ans=ask2==='speed'?Math.abs(v):ask2==='velocity'?v:a;return safeMc(`mot-pos-trig-${k}-${ask2}`,`position_${ask2}`,`A particle has position s(t). Find its ${ask2} at t=0.`,`s(t)=\\sin(${ctex(k,'t')})`,String(ans),[String(ans+1),String(-ans),String(k*k)],`Differentiate position. \\(v(t)=${ctex(k,`\\cos(${ctex(k,'t')})`)}\\) and acceleration is its derivative.`)}
     const k=pick([1,2,3]),ask2=pick(['velocity','speed','acceleration']),v=k,a=k*k,ans=ask2==='velocity'?v:ask2==='speed'?v:a;return safeMc(`mot-pos-exp-${k}-${ask2}`,`position_${ask2}`,`A particle has position s(t). Find its ${ask2} at t=0.`,`s(t)=e^{${ctex(k,'t')}}`,String(ans),[String(ans+1),String(-ans),String(k)],`Differentiate position. At \\(t=0\\), \\(e^0=1\\).`);
   }
   const fam=pick(['quadratic','cubic','trig','exponential']);const ask=pick(['speed','acceleration']);
   if(fam==='quadratic'){const A=pick([1,2,-1,-2]),B=nz(-6,6),C=ri(-5,5),t=pick([0,1,2]),v=A*t*t+B*t+C,a=2*A*t+B,ans=ask==='speed'?Math.abs(v):a;return safeMc(`mot-vel-q-${A}-${B}-${C}-${t}-${ask}`,`velocity_${ask}`,`A particle has velocity v(t). Find its ${ask} at t=${t}.`,`v(t)=${signed(A,'t^2',true)}${signed(B,'t')}${signed(C,'')}`,String(ans),numChoices(ans,2),ask==='speed'?`Speed is \\(|v(${t})|\\).`:`Acceleration is \\(v'(t)\\).`)}
   if(fam==='cubic'){const A=pick([1,-1]),B=pick([1,2,3]),t=pick([0,1,2]),v=A*t**3+B*t,a=3*A*t*t+B,ans=ask==='speed'?Math.abs(v):a;return safeMc(`mot-vel-c-${A}-${B}-${t}-${ask}`,`velocity_${ask}`,`A particle has velocity v(t). Find its ${ask} at t=${t}.`,`v(t)=${signed(A,'t^3',true)}${signed(B,'t')}`,String(ans),numChoices(ans,2),ask==='speed'?`Evaluate velocity and take its absolute value.`:`Differentiate velocity to obtain acceleration.`)}
   if(fam==='trig'){const k=pick([1,2,3]),t=0,v=0,a=k,ans=ask==='speed'?0:a;return safeMc(`mot-vel-trig-${k}-${ask}`,`velocity_${ask}`,`A particle has velocity v(t). Find its ${ask} at t=0.`,`v(t)=\\sin(${ctex(k,'t')})`,String(ans),[String(ans+1),String(-ans),String(k*k)],ask==='speed'?`Speed is \\(|v|\\).`:`Differentiate velocity.`)}
   const k=pick([1,2,3]),ans=ask==='speed'?1:k;return safeMc(`mot-vel-exp-${k}-${ask}`,`velocity_${ask}`,`A particle has velocity v(t). Find its ${ask} at t=0.`,`v(t)=e^{${ctex(k,'t')}}`,String(ans),[String(ans+1),String(-ans),String(k*k)],ask==='speed'?`Evaluate \\(|v(0)|\\).`:`\\(a(t)=v'(t)=${ctex(k,`e^{${ctex(k,'t')}}`)}\\).`);
 };

 G['absolute-and-local-extrema-and-the-extreme-value-theorem']=()=>{
   const fam=pick(['quadratic','cubic_interval','quartic','trig','absolute','rational']);
   if(fam==='quadratic'){const h=ri(-3,3),k=ri(-5,5),A=pick([1,2,-1,-2]),L=h-ri(2,4),Rr=h+ri(2,4),fv=x=>A*(x-h)**2+k,vals=[[L,fv(L)],[h,fv(h)],[Rr,fv(Rr)]],want=pick(['maximum','minimum']),best=vals.reduce((a,b)=>want==='maximum'?(b[1]>a[1]?b:a):(b[1]<a[1]?b:a));return safeMc(`ext-q-${A}-${h}-${k}-${L}-${Rr}-${want}`,`quadratic_${want}`,`Find the absolute ${want} value on the closed interval.`,`f(x)=${A===1?'':A===-1?'-':A}(x-${h})^2${signed(k,'')},\\quad [${L},${Rr}]`,String(best[1]),[String(vals[0][1]),String(vals[1][1]),String(vals[2][1])],`Check the endpoints and the critical point \\(x=${h}\\).`)}
   if(fam==='cubic_interval'){const f=x=>x**3-3*x, L=-2,Rr=2,vals=[[-2,f(-2)],[-1,f(-1)],[1,f(1)],[2,f(2)]],want=pick(['maximum','minimum']),best=vals.reduce((a,b)=>want==='maximum'?(b[1]>a[1]?b:a):(b[1]<a[1]?b:a));return safeMc(`ext-cubic-${want}`,'cubic_closed_interval',`Find the absolute ${want} value.`,`f(x)=x^3-3x,\\quad [-2,2]`,String(best[1]),['0','2','-2'],`Solve \\(f'(x)=3x^2-3=0\\), then compare the critical-point values with both endpoints.`)}
   if(fam==='quartic'){const a=pick([1,2]),f=x=>x**4-2*a*a*x*x,L=-2*a,Rr=2*a,want=pick(['maximum','minimum']);const vals=[[L,f(L)],[-a,f(-a)],[0,0],[a,f(a)],[Rr,f(Rr)]],best=vals.reduce((u,v)=>want==='maximum'?(v[1]>u[1]?v:u):(v[1]<u[1]?v:u));return safeMc(`ext-q4-${a}-${want}`,'quartic_closed_interval',`Find the absolute ${want} value.`,`f(x)=x^4-${2*a*a}x^2,\\quad [${L},${Rr}]`,String(best[1]),['0',String(-(a**4)),String(a**4)],`Find every critical point from \\(f'(x)\\) and compare with the endpoints.`)}
   if(fam==='trig')return safeMc('ext-sin','trig_closed_interval','Find the absolute maximum value on the given interval.',`f(x)=2\\sin x+1,\\quad [0,2\\pi]`,'3',['2','1','-1'],`The maximum of \\(\\sin x\\) is 1, so the maximum function value is 3.`);
   if(fam==='absolute'){const h=ri(-3,3),k=ri(-4,4);return safeMc(`ext-abs-${h}-${k}`,'absolute_value_min','Find the absolute minimum value on the given interval.',`f(x)=|x-${h}|${signed(k,'')},\\quad [${h-3},${h+4}]`,String(k),[String(k+1),String(h),String(-k)],`The vertex occurs at \\(x=${h}\\), where the absolute-value term is 0.`)}
   const c=pick([1,4,9]),r=Math.sqrt(c),b=r+2;return safeMc(`ext-rat-${c}`,'rational_closed_interval','Find the absolute minimum value on the given interval.',`f(x)=x+\\frac{${c}}x,\\quad [1,${b}]`,String(2*r),[String(r),String(c),String(b+c/b)],`\\(f'(x)=1-${c}/x^2\\), so the positive critical point is \\(x=${r}\\). Compare it with the endpoints.`);
 };

 G['increasing-decreasing-intervals-concavity-and-extrema']=()=>{
   const fam=pick(['inc_poly','dec_poly','concavity','inflection','critical']);
   if(fam==='inc_poly'){const a=ri(1,4);return safeMc(`inc-${a}`,'increasing_interval','Find where f is increasing.',`f(x)=x^3-${3*a*a}x`,`(-\\infty,-${a})\\cup(${a},\\infty)`,[`(-${a},${a})`,`(-\\infty,${a})`,`(-${a},\\infty)`],`\\(f'(x)=3(x^2-${a*a})\\), which is positive outside \\([-${a},${a}]\\).`)}
   if(fam==='dec_poly'){const a=ri(1,4);return safeMc(`dec-${a}`,'decreasing_interval','Find where f is decreasing.',`f(x)=x^3-${3*a*a}x`,`(-${a},${a})`,[`(-\\infty,-${a})\\cup(${a},\\infty)`,`(-\\infty,${a})`,`(${a},\\infty)`],`\\(f'(x)=3(x^2-${a*a})<0\\) between the critical numbers.`)}
   if(fam==='concavity'){const h=ri(-3,3),u=h===0?'x':h>0?`x-${h}`:`x+${-h}`;return safeMc(`conc-${h}`,'concavity','Where is f concave up?',`f(x)=(${u})^4-4(${u})^2`,`(-\\infty,${h-1})\\cup(${h+1},\\infty)`,[`(${h-1},${h+1})`,`(-\\infty,${h+1})`,`(${h-1},\\infty)`],`Compute \\(f''(x)=12(${u})^2-8\\) and solve \\(f''(x)>0\\).`)}
   if(fam==='inflection'){const h=ri(-4,4),u=h===0?'x':h>0?`x-${h}`:`x+${-h}`;return safeMc(`infl-${h}`,'inflection','Find the x-coordinate of the inflection point.',`f(x)=(${u})^3+2x`,String(h),[String(-h),String(h+1),'0'],`\\(f''(x)=6(${u})\\), which changes sign at \\(x=${h}\\).`)}
   const a=ri(1,4);return safeMc(`crit-${a}`,'local_extrema','Which statement is correct?',`f'(x)=(x+${a})(x-${a})`,`f has a local maximum at x=-${a} and a local minimum at x=${a}.`,[`f has a local minimum at x=-${a} and a local maximum at x=${a}.`,`f has local maxima at both critical points.`,`f has no local extrema.`],`Use a sign chart for \\(f'\\): positive, then negative, then positive.`);
 };

 G['graphing-functions']=()=>{
   const fam=pick(['from_fprime','from_fdoubleprime','rational','full_sign_chart']);
   if(fam==='from_fprime'){const a=ri(1,4);return safeMc(`graph-fp-${a}`,'derivative_sign_interpretation','The derivative is shown. Which statement about f is correct?',`f'(x)=(x+${a})(x-${a})`,`f decreases on (-${a},${a}) and increases outside that interval.`,[`f increases on (-${a},${a}) and decreases outside that interval.`,`f is increasing everywhere.`,`f is decreasing everywhere.`],`The sign of \\(f'\\) is positive outside the zeros and negative between them.`)}
   if(fam==='from_fdoubleprime'){const h=ri(-3,3);return safeMc(`graph-fpp-${h}`,'second_derivative_interpretation','The second derivative is shown. Which statement about f is correct?',`f''(x)=2(x-${h})`,`f is concave down for x<${h} and concave up for x>${h}.`,[`f is concave up for x<${h} and concave down for x>${h}.`,`f has a local maximum at x=${h}.`,`f is increasing for x>${h}.`],`Concavity is determined by the sign of \\(f''\\), not by the sign of \\(f'\\).`)}
   if(fam==='rational'){const h=ri(-3,3),k=ri(-4,4);return safeMc(`graph-rat-${h}-${k}`,'rational_features','Which feature statement is correct?',`f(x)=${k}+\\frac{2}{x-${h}}`,`Vertical asymptote x=${h}; horizontal asymptote y=${k}.`,[`Vertical asymptote x=${k}; horizontal asymptote y=${h}.`,`x-intercept x=${h}; y-intercept y=${k}.`,`There are no asymptotes.`],`The denominator gives the vertical asymptote; the reciprocal term tends to 0 at infinity.`)}
   const a=ri(1,3),h=ri(-2,2);return safeMc(`graph-full-${a}-${h}`,'curve_analysis','Suppose the sign charts are as stated. Which conclusion follows?',`f'(x): +\\;0\\;-\\;0\\;+\\text{ at }x=-${a},${a};\\qquad f''(x)\\text{ changes }-\\text{ to }+\\text{ at }x=${h}`,`Local maximum at x=-${a}; local minimum at x=${a}; inflection at x=${h}.`,[`Local minimum at x=-${a}; local maximum at x=${a}; inflection at x=${h}.`,`No extrema; inflection at x=${h}.`,`Local maxima at both x=-${a} and x=${a}.`],`Read extrema from sign changes of \\(f'\\) and inflection from the sign change of \\(f''\\).`);
 };

 G['linearization-and-differentials']=()=>{
   const fam=pick(['sqrt','cube_root','fourth_root','sine','power_diff']);
   if(fam==='sqrt'){const r=ri(2,8),a=r*r,h=pick([1,-1,2,-2]),num=2*r*r+h,den=2*r;return safeMc(`lin-root-${r}-${h}`,'sqrt_linearization','Use linearization at the indicated base point. Give an exact answer.',`f(x)=\\sqrt{x},\\quad a=${a},\\quad x=${a+h}`,texRat(num,den),[texRat(num+1,den),String(r),texRat(num,2*r+1)],`\\(L(x)=${r}+\\frac{1}{${2*r}}(x-${a})\\). Substituting \\(x=${a+h}\\) gives \\(${texRat(num,den)}\\).`)}
   if(fam==='cube_root'){const r=pick([2,3,4]),a=r**3,h=pick([1,-1,2]),num=3*r**3+h,den=3*r*r;return safeMc(`lin-cuberoot-${r}-${h}`,'cube_root_linearization','Use linearization and give an exact answer.',`f(x)=\\sqrt[3]{x},\\quad a=${a},\\quad x=${a+h}`,texRat(num,den),[texRat(num+1,den),String(r),texRat(num,den+1)],`\\(f'(a)=1/(3${r}^2)\\). Thus \\(L(${a+h})=${r}+${texRat(h,3*r*r)}=${texRat(num,den)}\\).`)}
   if(fam==='fourth_root'){const r=2,a=16,h=pick([1,-1]),num=8*4+h,den=32;return safeMc(`lin-fourth-${h}`,'fourth_root_linearization','Use linearization and give an exact answer.',`f(x)=\\sqrt[4]{x},\\quad a=16,\\quad x=${16+h}`,texRat(num,den),[texRat(num+1,den),'2',texRat(num,16)],`At 16, \\(f=2\\) and \\(f'=1/32\\).`)}
   if(fam==='sine'){return safeMc('lin-sin','sine_linearization','Use the tangent-line approximation at the given point. Leave the answer exact.',`f(x)=\\sin x,\\quad a=0,\\quad x=\\frac{\\pi}{12}`,`\\frac{\\pi}{12}`,[`\\frac{1}{12}`,`\\frac{\\pi}{6}`,'0'],`\\(L(x)=x\\) at \\(a=0\\), so the approximation is exactly \\(\\pi/12\\) in linearized form.`)}
   const x=ri(2,6),dx=pick([1,-1]);return safeMc(`diff-pow-${x}-${dx}`,'power_differential','Find the differential dy for the given dx.',`y=x^3,\\quad x=${x},\\quad dx=${dx}`,String(3*x*x*dx),numChoices(3*x*x*dx,2),`\\(dy=y'(x)dx=3x^2dx\\).`);
 };

 G['rolle-s-theorem-and-the-mean-value-theorem']=(opts={})=>{
   const mode=opts.mvtMode||opts.mode||'both';const pool=mode==='theorem'?['rolle','hypothesis']:mode==='find-c'?['find_c','find_c_recip']:['rolle','hypothesis','find_c','find_c_recip'];const fam=pick(pool);
   if(fam==='rolle'){const h=ri(-3,3),r=ri(1,4),u=h===0?'x':h>0?`x-${h}`:`x+${-h}`;return safeMc(`rolle-${h}-${r}`,'rolle_application',`Rolle's Theorem applies. Find the value of c.`,`f(x)=(${u})^2,\\quad [${h-r},${h+r}]`,`c=${h}`,[`c=${h-r}`,`c=${h+r}`,`c=${h+1}`],`The endpoint values agree and \\(f'(x)=2(${u})\\), so \\(f'(c)=0\\) at \\(c=${h}\\).`)}
   if(fam==='hypothesis'){const a=pick([1,2]),b=a+2;return safeMc(`mvt-hyp-${a}`,'mvt_hypotheses','Can the Mean Value Theorem be applied on the interval?',`f(x)=\\frac1{x-${a}},\\quad [${a-1},${b}]`,'No, because f is not continuous on the entire interval.',['Yes, because f is differentiable at the endpoints.','Yes, because the endpoint values are finite.','No, because the average rate of change is zero.'],`There is a vertical asymptote at \\(x=${a}\\), inside the interval, so the continuity hypothesis fails.`)}
   if(fam==='find_c'){const a=ri(-3,0),b=a+ri(2,5),A=pick([1,2,3]),B=nz(-5,5),c=texRat(a+b,2);return safeMc(`mvt-find-${A}-${B}-${a}-${b}`,'mvt_find_c','Find every c in the open interval where the derivative equals the average rate of change.',`f(x)=${A}x^2${signed(B,'x')},\\quad [${a},${b}]`,`c=${c}`,[`c=${a}`,`c=${b}`,`c=${texRat(a+b+2,2)}`],`Set \\(f'(c)=\\frac{f(${b})-f(${a})}{${b-a}}\\) and solve. This gives \\(c=${c}\\).`)}
   const a=1,b=4;return safeMc('mvt-find-rec','mvt_find_c_reciprocal','Find c where the derivative equals the average rate of change.',`f(x)=\\frac1x,\\quad [1,4]`,`c=2`,['c=1','c=4','c=3'],`The average rate of change is \\(-1/4\\). Solve \\(-1/c^2=-1/4\\) in \\((1,4)\\), giving \\(c=2\\).`);
 };

 G['l-hopital-s-rule']=()=>{
   const fam=pick(['evaluate_exp','evaluate_cos','apply_factor_yes','apply_factor_no','apply_radical_yes','apply_cancel_no']);
   if(fam==='evaluate_exp'){const k=ri(2,7);return safeMc(`lh-exp-${k}`,'evaluate_exponential','Evaluate using L’Hôpital’s Rule.',`\\lim_{x\\to0}\\frac{e^{${k}x}-1}{x}`,String(k),[String(k+1),'0','1'],`The original form is \\(0/0\\). Differentiate numerator and denominator once.`)}
   if(fam==='evaluate_cos'){const k=ri(1,5);return safeMc(`lh-cos-${k}`,'evaluate_two_applications','Evaluate using L’Hôpital’s Rule.',`\\lim_{x\\to0}\\frac{1-\\cos(${k}x)}{x^2}`,texRat(k*k,2),[String(k*k),texRat(-(k*k),2),texRat(k*k,4)],`The first differentiated form is still \\(0/0\\), so apply L’Hôpital a second time.`)}
   if(fam==='apply_factor_yes'){const a=ri(1,5);return safeMc(`lh-app-y-${a}`,'applicability_factorable_yes','Can L’Hôpital’s Rule be applied directly to the original limit?',`\\lim_{x\\to ${a}}\\frac{x^2-${a*a}}{x-${a}}`,'Yes. Direct substitution gives 0/0.',['No. The expression should be factored first.','No. Direct substitution gives a finite nonzero number.','No. L’Hôpital applies only at infinity.'],`Direct substitution gives \\(0/0\\), an indeterminate form. Factoring is another valid method, but it is not required before L’Hôpital.`)}
   if(fam==='apply_factor_no'){const a=ri(1,5),c=ri(1,4);return safeMc(`lh-app-n-${a}-${c}`,'applicability_factorable_no','Can L’Hôpital’s Rule be applied directly to the original limit?',`\\lim_{x\\to ${a}}\\frac{x^2-${a*a+c}}{x-${a}}`,'No. The numerator is nonzero while the denominator approaches 0.',['Yes. Direct substitution gives 0/0.','Yes. Any rational expression allows L’Hôpital.','No. The denominator must approach infinity.'],`Substitution gives a nonzero numerator over 0, not \\(0/0\\) or \\(\\infty/\\infty\\).`)}
   if(fam==='apply_radical_yes'){const a=ri(2,7);return safeMc(`lh-rad-y-${a}`,'applicability_radical_yes','Can L’Hôpital’s Rule be applied directly?',`\\lim_{x\\to ${a*a}}\\frac{\\sqrt{x}-${a}}{x-${a*a}}`,'Yes. Direct substitution gives 0/0.',['No. Radicals cannot be differentiated with L’Hôpital.','No. Rationalization must be used first.','No. The limit is already a number.'],`Both numerator and denominator approach 0.`)}
   const a=ri(1,5);return safeMc(`lh-cancel-n-${a}`,'applicability_cancellation_no','Can L’Hôpital’s Rule be applied directly?',`\\lim_{x\\to ${a}}\\frac{(x-${a})(x+2)+1}{x-${a}}`,'No. The numerator approaches 1, not 0.',['Yes. Both numerator and denominator contain x-'+a+'.','Yes. The denominator approaches 0.','No. Polynomial expressions are not allowed.'],`The visible factor does not make the whole numerator 0 because of the +1.`);
 };

 // Rectangular approximations with clean exact sums and explanations.
 G['rectangular-approximations']=()=>{
   const fam=pick(['left_x2','right_linear','mid_quad','table_left','table_right','varied_poly','varied_poly']);
   if(fam==='left_x2')return safeMc('rect-left-x2','left_function','Use four left-endpoint rectangles to approximate the integral.',`\\int_0^4 x^2\\,dx`,'14',['30','21','16'],`Here \\(\\Delta x=1\\). Use the four left endpoints 0,1,2,3.`);
   if(fam==='right_linear')return safeMc('rect-right-lin','right_function','Use four right-endpoint rectangles.',`\\int_0^4 (2x+1)\\,dx`,'24',['20','28','32'],`\\(\\Delta x=1\\) and the right endpoints are 1,2,3,4, so \\(R_4=3+5+7+9=24\\).`);
   if(fam==='mid_quad')return safeMc('rect-mid-q','midpoint_function','Use four midpoint rectangles.',`\\int_0^4 x^2\\,dx`,'21',['14','30','22'],`\\(\\Delta x=1\\) and the midpoints are \\(1/2,3/2,5/2,7/2\\).`);
   if(fam==='table_left'||fam==='table_right'){const vals=[2,5,3,7,6],ans=fam==='table_left'?17:21,which=fam==='table_left'?'left':'right';return safeMc(`rect-table-${which}`,'table_rectangles',`The table gives values at five equally spaced x-values. Use four ${which}-endpoint rectangles.`,`\\begin{array}{c|ccccc}x&0&1&2&3&4\\\\f(x)&2&5&3&7&6\\end{array}`,String(ans),[String(ans+2),String(ans-2),'23'],`There are four subintervals and \\(\\Delta x=1\\). Use the ${which} endpoint from each subinterval.`)}
   const a=ri(-2,2),b=a+4,A=nz(-2,2),B=ri(-3,3),C=ri(-4,4),D=pick([-1,0,1]),method=pick(['left','right','midpoint']),f=x=>D*x**3+A*x*x+B*x+C;let total=0;for(let j=0;j<4;j++){const x=method==='left'?a+j:method==='right'?a+j+1:a+j+.5;total+=f(x)}const den=method==='midpoint'?8:1,num=Math.round(total*den),ans=texRat(num,den),fn=`${signed(D,'x^3',true)}${signed(A,'x^2')}${signed(B,'x')}${signed(C,'')}`;return safeMc(`rect-var-${D}-${A}-${B}-${C}-${a}-${method}`,'varied_polynomial_riemann',`Use four ${method}-endpoint rectangles to approximate the integral.`,`\\int_${a}^${b}(${fn})\\,dx`,ans,[texRat(num+den,den),texRat(num-den,den),texRat(num+2*den,den)],`Here \\(\\Delta x=1\\). Evaluate the function at the four ${method} sample points and add the four rectangle areas.`);
 };

 G['trapezoidal-approximations']=()=>{
   const fam=pick(['function_x2','function_linear','table_equal','table_unequal','varied_poly','varied_table_equal','varied_table_unequal']);
   if(fam==='function_x2')return safeMc('trap-x2','trapezoid_function','Use four trapezoids to approximate the integral.',`\\int_0^4 x^2\\,dx`,'22',['21','20','24'],`There are four subintervals and \\(\\Delta x=1\\). Use \\(T_4=\\frac{\\Delta x}{2}[f(0)+2f(1)+2f(2)+2f(3)+f(4)]\\).`);
   if(fam==='function_linear')return safeMc('trap-lin','trapezoid_linear','Use four trapezoids to approximate the integral.',`\\int_0^4 (2x+1)\\,dx`,'20',['18','22','24'],`There are four equal subintervals with \\(\\Delta x=1\\).`);
   if(fam==='table_equal')return safeMc('trap-table-eq','trapezoid_table_equal','The table has four equal subintervals. Use the trapezoidal rule.',`\\begin{array}{c|ccccc}x&0&1&2&3&4\\\\f(x)&2&5&3&7&6\\end{array}`,'19',['17','20','21'],`There are four subintervals with \\(\\Delta x=1\\). Thus \\(T_4=\\frac12[2+2(5)+2(3)+2(7)+6]=19\\).`);
   if(fam==='table_unequal')return safeMc('trap-table-uneq','trapezoid_table_unequal','Use trapezoids on each of the four unequal subintervals.',`\\begin{array}{c|ccccc}x&0&1&3&4&7\\\\f(x)&2&4&5&3&1\\end{array}`,'22',['21','23','25'],`There are four unequal subintervals. Compute each trapezoid with its own width and add the four areas.`);
   if(fam==='varied_poly'){const a=ri(-2,2),A=nz(-2,2),B=ri(-3,3),C=ri(-4,4),f=x=>A*x*x+B*x+C,ys=[0,1,2,3,4].map(j=>f(a+j)),twice=ys[0]+2*ys[1]+2*ys[2]+2*ys[3]+ys[4],ans=texRat(twice,2),fn=`${signed(A,'x^2',true)}${signed(B,'x')}${signed(C,'')}`;return safeMc(`trap-var-${A}-${B}-${C}-${a}`,'trapezoid_varied_polynomial','Use four trapezoids to approximate the integral.',`\\int_${a}^${a+4}(${fn})\\,dx`,ans,[texRat(twice+2,2),texRat(twice-2,2),texRat(twice+4,2)],`There are four equal subintervals with \\(\\Delta x=1\\). Evaluate the five endpoints and apply the trapezoidal rule.`)}
   const ys=Array.from({length:5},()=>ri(1,9));if(fam==='varied_table_equal'){const twice=ys[0]+2*ys[1]+2*ys[2]+2*ys[3]+ys[4],ans=texRat(twice,2);return safeMc(`trap-eq-${ys.join('-')}`,'trapezoid_table_equal_varied','Use the trapezoidal rule on the four equal subintervals.',`\\begin{array}{c|ccccc}x&0&1&2&3&4\\\\f(x)&${ys.join('&')}\\end{array}`,ans,[texRat(twice+2,2),texRat(twice-2,2),texRat(twice+4,2)],`There are four equal subintervals of width 1.`)}
   const xs=[0,1,3,4,7];let twice=0;for(let j=0;j<4;j++)twice+=(xs[j+1]-xs[j])*(ys[j]+ys[j+1]);const ans=texRat(twice,2);return safeMc(`trap-uneq-${ys.join('-')}`,'trapezoid_table_unequal_varied','Use the trapezoidal rule on the four unequal subintervals.',`\\begin{array}{c|ccccc}x&0&1&3&4&7\\\\f(x)&${ys.join('&')}\\end{array}`,ans,[texRat(twice+2,2),texRat(twice-2,2),texRat(twice+4,2)],`Use each interval width separately; there is no single common \\(\\Delta x\\).`);
 };

 G['introduction-to-sigma-notation']=()=>{
   const fam=pick(['linear','quadratic','quadratic_shift']);
   if(fam==='linear'){const n=ri(4,8);const ans=n*(n+1)/2;return safeMc(`sig-lin-${n}`,'sigma_linear','Evaluate the sum.',`\\sum_{k=1}^{${n}} k`,String(ans),[String(ans+n),String(n*n),String(ans-1)],`Use \\(\\sum_{k=1}^n k=n(n+1)/2\\).`)}
   if(fam==='quadratic'){const n=ri(3,7),ans=n*(n+1)*(2*n+1)/6;return safeMc(`sig-q-${n}`,'sigma_quadratic','Evaluate the sum.',`\\sum_{k=1}^{${n}} k^2`,String(ans),[String(ans+n),String(n*n),String(ans-1)],`Use \\(\\sum_{k=1}^n k^2=n(n+1)(2n+1)/6\\).`)}
   const n=ri(3,6),ans=n*(n+1)*(2*n+1)/6+2*n*(n+1)/2+n;return safeMc(`sig-qs-${n}`,'sigma_quadratic_shift','Evaluate the sum.',`\\sum_{k=1}^{${n}}(k+1)^2`,String(ans),[String(ans-n),String(ans+n),String(n*n)],`Expand \\((k+1)^2=k^2+2k+1\\) and use the standard summation formulas.`);
 };

 // The old converting-rectangular engine is intentionally retired. The following topic becomes a two-stage Riemann engine.
 G['evaluating-definite-integrals-with-a-limit-and-summation']=()=>{
   const fam=pick(['linear','quadratic']);const a=pick([0,1,-1]),b=a+pick([2,3,4]),nSymbol='n',dx=`\\frac{${b-a}}{n}`,xk=a===0?`\\frac{${b-a}k}{n}`:`${a}+\\frac{${b-a}k}{n}`;
   if(fam==='linear'){const m=pick([1,2,3]),c=ri(-3,3),rep=`\\lim_{n\\to\\infty}\\sum_{k=1}^{n}\\left(${m}\\left(${xk}\\right)${signed(c,'')}\\right)${dx}`,wrong1=rep.replace('\\sum_{k=1}^{n}','\\sum_{k=0}^{n-1}'),wrong2=`\\lim_{n\\to\\infty}\\sum_{k=0}^{n}(${m}k${signed(c,'')})${dx}`,wrong3=`\\sum_{k=1}^{n}(${m}k${signed(c,'')})`;const val=m*(b*b-a*a)/2+c*(b-a);return{id:`riem2-l-${m}-${c}-${a}-${b}`,variant:'two_stage_linear',questionHtml:`<div><div class="question-prompt">For \\(f(x)=${m===1?'x':`${m}x`}${signed(c,'')}\\) on \\([${a},${b}]\\), first identify \\(\\Delta x\\) and \\(x_k\\) for n equal subintervals.</div><div>\\(\\Delta x=${dx},\\qquad x_k=${xk}\\)</div></div>`,answerType:'two-stage',stage1Prompt:'Part 1: Select the correct limit-and-summation representation.',stage1Choices:shuffle([rep,wrong1,wrong2,wrong3]),stage1CorrectIndex:-1,numericAnswer:val,answerTex:texRat(m*(b*b-a*a)+2*c*(b-a),2),numericTolerance:1e-8,stage2Prompt:'Part 2: Evaluate the definite integral.',explanation:`The correct Riemann sum uses \\(k\\), \\(x_k=${xk}\\), and \\(\\Delta x=${dx}\\). Then evaluate \\(\\int_${a}^${b}(${m===1?'x':`${m}x`}${signed(c,'')})\\,dx=${texRat(val,1)}\\).` ,_correctRep:rep};}
   const c=ri(-2,3),rep=`\\lim_{n\\to\\infty}\\sum_{k=1}^{n}\\left(\\left(${xk}\\right)^2${signed(c,'')}\\right)${dx}`,wrong1=rep.replace('\\sum_{k=1}^{n}','\\sum_{k=0}^{n-1}'),wrong2=`\\lim_{n\\to\\infty}\\sum_{k=0}^{n}(k^2${signed(c,'')})${dx}`,wrong3=`\\sum_{k=1}^{n}(k^2${signed(c,'')})`;const val=(b**3-a**3)/3+c*(b-a);return{id:`riem2-q-${c}-${a}-${b}`,variant:'two_stage_quadratic',questionHtml:`<div><div class="question-prompt">For \\(f(x)=x^2${signed(c,'')}\\) on \\([${a},${b}]\\), first identify \\(\\Delta x\\) and \\(x_k\\) for n equal subintervals.</div><div>\\(\\Delta x=${dx},\\qquad x_k=${xk}\\)</div></div>`,answerType:'two-stage',stage1Prompt:'Part 1: Select the correct limit-and-summation representation.',stage1Choices:shuffle([rep,wrong1,wrong2,wrong3]),stage1CorrectIndex:-1,numericAnswer:val,answerTex:texRat((b**3-a**3)+3*c*(b-a),3),numericTolerance:1e-8,stage2Prompt:'Part 2: Evaluate the definite integral.',explanation:`Use \\(k\\) in the Riemann sum, then evaluate the resulting definite integral exactly.`,_correctRep:rep};
 };
 const oldRiem=G['evaluating-definite-integrals-with-a-limit-and-summation'];G['evaluating-definite-integrals-with-a-limit-and-summation']=(o={})=>{const p=oldRiem(o);p.stage1CorrectIndex=p.stage1Choices.indexOf(p._correctRep);delete p._correctRep;return p;};

 G['integrals-using-geometry']=()=>{
   const fam=pick(['triangle','cross_axis','semicircle','quarter_circle','rectangle_semicircle','absolute']);
   if(fam==='triangle'){const b=ri(2,8),h=ri(2,8),area=b*h;return safeMc(`geo-tri-${b}-${h}`,'triangle_area','Evaluate the definite integral using geometry.',`\\int_0^{${b}} ${texRat(h,b)}x\\,dx`,texRat(area,2),[String(area),texRat(area,4),String(h)],`The graph forms a right triangle with base ${b} and height ${h}; its area is \\(${texRat(area,2)}\\).`)}
   if(fam==='cross_axis'){const a=ri(2,6);return safeMc(`geo-cross-${a}`,'signed_triangles','Evaluate using signed geometric area.',`\\int_{-${a}}^{${a}} x\\,dx`,'0',[String(a*a),String(-a*a),String(2*a*a)],`The two triangular regions have equal magnitude and opposite signs, so the signed areas cancel.`)}
   if(fam==='semicircle'){const r=ri(2,7);return safeMc(`geo-semi-${r}`,'semicircle','Evaluate using geometry.',`\\int_{-${r}}^{${r}}\\sqrt{${r*r}-x^2}\\,dx`,texPiRat(r*r,2),[`${r*r}\\pi`,texPiRat(r*r,4),String(r*r)],`The graph is the upper semicircle of radius ${r}; its area is \\(${texPiRat(r*r,2)}\\).`)}
   if(fam==='quarter_circle'){const r=ri(2,7);return safeMc(`geo-quarter-${r}`,'quarter_circle','Evaluate using geometry.',`\\int_0^{${r}}\\sqrt{${r*r}-x^2}\\,dx`,texPiRat(r*r,4),[texPiRat(r*r,2),`${r*r}\\pi`,String(r*r)],`This is one quarter of a circle of radius ${r}.`)}
   if(fam==='rectangle_semicircle'){const r=ri(2,6),c=ri(1,5);return safeMc(`geo-rectsemi-${r}-${c}`,'rectangle_plus_semicircle','Evaluate using geometry.',`\\int_{-${r}}^{${r}}(${c}+\\sqrt{${r*r}-x^2})\\,dx`,` ${2*r*c}+${texPiRat(r*r,2)}`.trim(),[`${2*r*c}+${r*r}\\pi`,`${r*c}+${texPiRat(r*r,2)}`,String(2*r*c)],`Separate the rectangle of area \\(${2*r*c}\\) and the upper semicircle of area \\(${texPiRat(r*r,2)}\\).`)}
   const a=ri(2,6);return safeMc(`geo-abs-${a}`,'absolute_value','Evaluate using geometry.',`\\int_{-${a}}^{${a}}|x|\\,dx`,String(a*a),[String(2*a*a),String(0),String(a)],`There are two congruent right triangles; together their area is \\(${a*a}\\).`);
 };

 G['fundamental-theorem-of-calculus-and-integral-rules']=(opts={})=>{
   const mode=opts.ftcMode||opts.mode||'ftc';
   if(mode==='rules'){
     const fam=pick(['reverse','split','combine','constant']);
     if(fam==='reverse'){const v=ri(2,10);return safeMc(`ir-rev-${v}`,'integral_reversal',`If \\(\\int_1^4 f(x)\\,dx=${v}\\), find \\(\\int_4^1 f(x)\\,dx\\).`,'',String(-v),[String(v),String(0),String(2*v)],`Reversing the limits changes the sign: \\(\\int_4^1 f=-\\int_1^4 f=-${v}\\).`)}
     if(fam==='split'){const a=ri(-8,8),b=ri(-8,8);return safeMc(`ir-split-${a}-${b}`,'integral_split',`If \\(\\int_0^2 f=${a}\\) and \\(\\int_2^5 f=${b}\\), find \\(\\int_0^5 f(x)\\,dx\\).`,'',String(a+b),[String(a-b),String(b-a),String(a*b)],`Adjacent definite integrals add: \\(\\int_0^5 f=\\int_0^2 f+\\int_2^5 f=${a+b}\\).`)}
     if(fam==='combine'){const a=ri(-6,8),b=ri(-6,8);return safeMc(`ir-comb-${a}-${b}`,'integral_linearity',`If \\(\\int_0^3 f=${a}\\) and \\(\\int_0^3 g=${b}\\), find \\(\\int_0^3(2f-g)\\,dx\\).`,'',String(2*a-b),[String(a-b),String(2*a+b),String(a-2*b)],`Use linearity: \\(2\\int f-\\int g=2(${a})-${b}=${2*a-b}\\).`)}
     const a=ri(-5,8),c=ri(2,5);return safeMc(`ir-const-${a}-${c}`,'constant_multiple',`If \\(\\int_1^6 f(x)\\,dx=${a}\\), find \\(\\int_1^6 ${c}f(x)\\,dx\\).`,'',String(c*a),[String(a+c),String(a),String(-c*a)],`A constant factor can be pulled outside the definite integral.`);
   }
   const fam=pick(['upper_x','upper_x2','lower_x','two_bounds']);
   if(fam==='upper_x'){const k=pick([1,2,3]);return safeMc(`ftc-x-${k}`,'ftc_upper','Differentiate the function.',`F(x)=\\int_1^x(t^2+${k})\\,dt`,`x^2+${k}`,[`2x`,`x^2`,`2x+${k}`],`By the Fundamental Theorem of Calculus, \\(F'(x)=x^2+${k}\\).`)}
   if(fam==='upper_x2'){return safeMc('ftc-x2','ftc_chain','Differentiate the function.',`F(x)=\\int_0^{x^2}\\sin(t^2)\\,dt`,`2x\\sin(x^4)`,[`\\sin(x^4)`,`2x\\sin(x^2)`,`x^2\\sin(x^4)`],`FTC gives the integrand evaluated at \\(x^2\\), then the chain rule contributes \\(2x\\).`)}
   if(fam==='lower_x'){return safeMc('ftc-lower','ftc_lower','Differentiate the function.',`F(x)=\\int_x^4 e^{t^2}\\,dt`,`-e^{x^2}`,[`e^{x^2}`,`-2xe^{x^2}`,`2xe^{x^2}`],`A variable lower limit contributes a negative sign.`)}
   return safeMc('ftc-two','ftc_two_variable_bounds','Differentiate the function.',`F(x)=\\int_x^{x^2}(t+1)\\,dt`,`2x(x^2+1)-(x+1)`,[`(x^2+1)-(x+1)`,`2x(x+1)`,`2x(x^2+1)+(x+1)`],`Differentiate the upper-bound contribution and subtract the lower-bound contribution.`);
 };

 G['basic-integrals']=()=>{
   const fam=pick(['poly','negative_power','fractional_power','mixed','definite']);
   if(fam==='poly'){const a=nz(-6,6),b=nz(-7,7);return safeMc(`basic-int-poly-${a}-${b}`,'polynomial','Find an antiderivative.',`${signed(a,'x^3',true)}${signed(b,'x')}`,`${texRat(a,4)}x^4${signed(b/2,'x^2')}+C`,[`${a}x^4+${b}x^2+C`,`${texRat(a,3)}x^3${signed(b,'x')}+C`,` ${texRat(a,4)}x^4+C`],`\\(\\int f(x)\\,dx=${texRat(a,4)}x^4+${texRat(b,2)}x^2+C\\).`)}
   if(fam==='negative_power')return safeMc('basic-int-neg','negative_power','Find an antiderivative.',`x^{-3}`,`-\\frac{1}{2x^2}+C`,[`\\frac{1}{2x^2}+C`,`-\\frac1{x^2}+C`,`\\ln|x|+C`],`Increase the exponent by 1 and divide by the new exponent.`);
   if(fam==='fractional_power')return safeMc('basic-int-frac','fractional_power','Find an antiderivative.',`x^{3/2}`,`\\frac25x^{5/2}+C`,[`\\frac32x^{1/2}+C`,`\\frac52x^{5/2}+C`,`\\frac25x^{3/2}+C`],`Apply the power rule for antiderivatives.`);
   if(fam==='mixed')return safeMc('basic-int-mix','mixed_powers','Find an antiderivative.',`3x^2-4x^{-2}+2`,`x^3+4x^{-1}+2x+C`,[`x^3-4x^{-1}+2x+C`,`6x+8x^{-3}+C`,`x^3+2x^{-1}+2x+C`],`Integrate each term separately.`);
   return safeMc('basic-int-def','definite_polynomial','Evaluate the definite integral.',`\\int_0^2(3x^2+1)\\,dx`,'10',['9','8','11'],`An antiderivative is \\(x^3+x\\); evaluate at 2 and 0.`);
 };

 G['u-substitution-integrals']=()=>{
   const fam=pick(['power_linear','trig_linear','exp_quad','radical','x5root','xrootshift','fourth_root']);
   if(fam==='power_linear'){const a=pick([2,3,4]),n=pick([2,3,4]);return safeMc(`usub-p-${a}-${n}`,'linear_inner_power','Find an antiderivative.',`(${a}x+1)^{${n}}`,`\\frac{(${a}x+1)^{${n+1}}}{${a*(n+1)}}+C`,[`\\frac{(${a}x+1)^{${n+1}}}{${n+1}}+C`,`(${a}x+1)^{${n+1}}+C`,`\\frac{(${a}x+1)^${n}}{${a}}+C`],`Let \\(u=${a}x+1\\).`)}
   if(fam==='trig_linear'){const a=pick([2,3,4,5]);return safeMc(`usub-sin-${a}`,'trig_linear','Find an antiderivative.',`\\sin(${a}x)`,`-\\frac1{${a}}\\cos(${a}x)+C`,[`-\\cos(${a}x)+C`,`\\frac1{${a}}\\cos(${a}x)+C`,`\\frac1{${a}}\\sin(${a}x)+C`],`Use \\(u=${a}x\\).`)}
   if(fam==='exp_quad')return safeMc('usub-expq','exponential_quadratic','Find an antiderivative.',`2xe^{x^2}`,`e^{x^2}+C`,[`2e^{x^2}+C`,`xe^{x^2}+C`,`e^{2x}+C`],`Let \\(u=x^2\\).`);
   if(fam==='radical')return safeMc('usub-rad','radical_linear','Find an antiderivative.',`\\sqrt{3x+1}`,`\\frac{2}{9}(3x+1)^{3/2}+C`,[`\\frac23(3x+1)^{3/2}+C`,`\\frac29\\sqrt{3x+1}+C`,`2(3x+1)^{3/2}+C`],`Use \\(u=3x+1\\).`);
   if(fam==='x5root')return safeMc('usub-x5root','power_times_root','Find an antiderivative.',`x^5\\sqrt{x^3+1}`,`\\frac{2}{15}(x^3+1)^{5/2}-\\frac{2}{9}(x^3+1)^{3/2}+C`,[`\\frac27(x^3+1)^{7/2}+C`,`\\frac23(x^3+1)^{3/2}+C`,`\\frac{2}{15}(x^3+1)^{5/2}+C`],`Let \\(u=x^3+1\\), then write \\(x^3=u-1\\).`);
   if(fam==='xrootshift')return safeMc('usub-xroot','x_times_shifted_root','Find an antiderivative.',`x\\sqrt{x-1}`,`\\frac25(x-1)^{5/2}+\\frac23(x-1)^{3/2}+C`,[`\\frac25(x-1)^{5/2}+C`,`\\frac23(x-1)^{3/2}+C`,`\\frac25x^{5/2}+C`],`Let \\(u=x-1\\), so \\(x=u+1\\).`);
   return safeMc('usub-fourth','fourth_root','Find an antiderivative.',`\\frac{x}{\\sqrt[4]{x^2+1}}`,`\\frac23(x^2+1)^{3/4}+C`,[`\\frac12(x^2+1)^{3/4}+C`,`\\frac43(x^2+1)^{3/4}+C`,`(x^2+1)^{7/8}+C`],`Use \\(u=x^2+1\\) and rewrite the fourth root as a fractional power.`);
 };

 G['mean-value-theorem-for-integrals']=()=>{
   const prompt='Find the average value of the function on the given interval.';const fam=pick(['poly','trig','odd_rational','radical','linear_power','tangent','exponential','shifted_power']);
   if(fam==='poly')return safeMc('av-poly','average_polynomial',prompt,`f(x)=x^2+1,\\quad [0,3]`,'4',['3','10','13'],`Average value is \\(\\frac1{3}\\int_0^3(x^2+1)\\,dx=4\\).`);
   if(fam==='trig')return safeMc('av-trig','average_trig',prompt,`f(x)=\\sin x,\\quad [0,\\pi]`,`\\frac2\\pi`,[`2\\pi`,`0`,`\\frac\\pi2`],`Use \\(f_{avg}=\\frac{1}{b-a}\\int_a^b f(x)dx\\).`);
   if(fam==='odd_rational')return safeMc('av-odd','average_odd',prompt,`f(x)=\\frac{x}{x^2+1},\\quad [-2,2]`,'0',['1','2','-1'],`The function is odd on a symmetric interval, so its integral and average value are 0.`);
   if(fam==='radical')return safeMc('av-root','average_radical',prompt,`f(x)=\\sqrt{x},\\quad [0,4]`,`\\frac43`,[`\\frac83`,`2`,`4`],`Compute \\(\\frac14\\int_0^4\\sqrt{x}dx\\).`);
   if(fam==='linear_power')return safeMc('av-linpow','average_linear_power',prompt,`f(x)=(2x+1)^2,\\quad [0,2]`,`\\frac{31}{3}`,[`\\frac{62}{3}`,'31','10'],`Average value is one over the interval length times the definite integral.`);
   if(fam==='tangent')return safeMc('av-tan','average_tangent',prompt,`f(x)=\\tan x,\\quad [0,\\pi/4]`,`\\frac{2\\ln 2}{\\pi}`,[`\\frac{4\\ln 2}{\\pi}`,`\\ln2`,'1'],`\\(\\int_0^{\\pi/4}\\tan x\\,dx=\\frac12\\ln2\\). Divide by the interval length \\(\\pi/4\\).`);
   if(fam==='exponential')return safeMc('av-exp','average_exponential',prompt,`f(x)=e^x,\\quad [0,1]`,'e-1',['e','1','e+1'],`The interval length is 1, so the average is \\(e-1\\).`);
   return safeMc('av-shift','average_shifted_power',prompt,`f(x)=(x-1)^4,\\quad [0,2]`,`\\frac15`,[`\\frac25`,`1`,`\\frac14`],`Use symmetry or integrate directly, then divide by the interval length 2.`);
 };

 G['basic-first-order-differential-equations']=()=>{
   const fam=pick(['poly','trig','exponential','secant','composition','log']);
   if(fam==='poly')return safeMc('de1-poly','initial_value_polynomial','Solve the initial-value problem.',`\\frac{dy}{dx}=3x^2-2x,\\quad y(0)=4`,`y=x^3-x^2+4`,[`y=3x^3-x^2+4`,`y=x^3-2x^2+4`,`y=x^3-x^2`],`Integrate: \\(y=x^3-x^2+C\\). Using \\(y(0)=4\\) gives \\(C=4\\).`);
   if(fam==='trig')return safeMc('de1-trig','initial_value_trig','Solve the initial-value problem.',`\\frac{dy}{dx}=2\\cos x,\\quad y(0)=3`,`y=2\\sin x+3`,[`y=-2\\sin x+3`,`y=2\\cos x+3`,`y=2\\sin x`],`Integrate \\(2\\cos x\\) and use the initial condition.`);
   if(fam==='exponential')return safeMc('de1-exp','initial_value_exponential','Solve the initial-value problem.',`\\frac{dy}{dx}=3e^{3x},\\quad y(0)=2`,`y=e^{3x}+1`,[`y=3e^{3x}+2`,`y=e^{3x}+2`,`y=e^{x}+1`],`An antiderivative is \\(e^{3x}\\). Then use \\(y(0)=2\\).`);
   if(fam==='secant')return safeMc('de1-sec','initial_value_secant','Solve the initial-value problem.',`\\frac{dy}{dx}=\\sec^2x,\\quad y(0)=1`,`y=\\tan x+1`,[`y=\\sec x+1`,`y=-\\tan x+1`,`y=\\tan x`],`Integrate \\(\\sec^2x\\) and apply the initial condition.`);
   if(fam==='composition')return safeMc('de1-comp','initial_value_composition','Solve the initial-value problem.',`\\frac{dy}{dx}=2x\\cos(x^2),\\quad y(0)=5`,`y=\\sin(x^2)+5`,[`y=2\\sin(x^2)+5`,`y=\\cos(x^2)+5`,`y=\\sin(x^2)`],`Use substitution \\(u=x^2\\), then apply \\(y(0)=5\\).`);
   return safeMc('de1-log','initial_value_log','Solve the initial-value problem and state the interval containing x=1 on which the solution is valid.',`\\frac{dy}{dx}=\\frac1x,\\quad y(1)=2`,`y=\\ln x+2,\\quad x>0`,[`y=\\ln|x|+2,\\quad x\\ne0`,`y=\\ln x,\\quad x>0`,`y=1/x+2,\\quad x>0`],`The antiderivative is \\(\\ln|x|+C\\). The initial point lies in the interval \\(x>0\\), and \\(C=2\\).`);
 };

 G['motion-problems']=()=>{
   const fam=pick(['velocity_from_accel','speed_from_accel','distance','speed_increasing','direction']);
   if(fam==='velocity_from_accel')return safeMc('imot-v','velocity_from_acceleration','Given acceleration and an initial velocity, find v(3).',`a(t)=2t-1,\\quad v(0)=4`,'10',['8','9','12'],`\\(v(3)=v(0)+\\int_0^3(2t-1)dt=4+6=10\\).`);
   if(fam==='speed_from_accel')return safeMc('imot-speed-a','speed_from_acceleration','Find the speed at t=2.',`a(t)=3t^2-4,\\quad v(0)=-2`,'2',['-2','4','6'],`Recover velocity: \\(v(2)=-2+\\int_0^2(3t^2-4)dt=-2\\). Speed is \\(|v|=2\\).`);
   if(fam==='distance')return safeMc('imot-dist','total_distance','Find total distance traveled on [0,3].',`v(t)=t-1`,'5/2',['2','3/2','4'],`Velocity changes sign at \\(t=1\\). Add \\(|\\int_0^1v|+|\\int_1^3v|=1/2+2=5/2\\).`);
   if(fam==='speed_increasing')return safeMc('imot-speedinc','speed_increasing','On which interval is the particle speeding up?',`v(t)=t^2-4t+3,\\quad a(t)=2t-4`,`(1,2)\\cup(3,\\infty)`,[`(-\\infty,1)\\cup(2,3)`,`(1,3)`,`(2,3)`],`A particle speeds up when velocity and acceleration have the same sign.`);
   return safeMc('imot-dir','direction_from_velocity','When is the particle moving to the right?',`v(t)=(t-1)(t-4)`,`(-\\infty,1)\\cup(4,\\infty)`,[`(1,4)`,`(-\\infty,4)`,`(1,\\infty)`],`Moving right means \\(v(t)>0\\).`);
 };

 G['separable-differential-equations']=()=>{
   const fam=pick(['general','initial_value','interval','context_heating','context_cooling']);
   if(fam==='general')return safeMc('sep-gen','general_solution','Solve the separable differential equation.',`\\frac{dy}{dx}=xy`,`y=Ce^{x^2/2}`,[`y=Ce^x`,`y=Cx^2`,`y=e^{xy}`],`Separate \\(dy/y=x\\,dx\\), integrate, then exponentiate.`);
   if(fam==='initial_value')return safeMc('sep-iv','initial_value_solution','Solve the separable differential equation with the given initial condition.',`\\frac{dy}{dx}=2xy,\\quad y(0)=3`,`y=3e^{x^2}`,[`y=3e^{2x}`,`y=e^{x^2}+2`,`y=3x^2`],`Separate variables and use the initial condition to determine the constant.`);
   if(fam==='interval')return safeMc('sep-int','validity_interval','Solve and give the interval containing x=0 on which the solution is valid.',`\\frac{dy}{dx}=\\frac{y}{x+2},\\quad y(0)=1`,`y=\\frac{x+2}{2},\\quad x>-2`,[`y=2(x+2),\\quad x>-2`,`y=\\frac{x+2}{2},\\quad x\\ne-2`,`y=e^{x+2},\\quad x>-2`],`Separate \\(dy/y=dx/(x+2)\\). The initial point lies on the interval \\((-2,\\infty)\\).`);
   if(fam==='context_heating')return safeMc('sep-heat','contextual_separable','A liquid temperature H satisfies the differential equation. Which general solution form is correct?',`\\frac{dH}{dt}=\\frac15(H-50)`,`H=50+Ce^{t/5}`,[`H=50+Ce^{-t/5}`,`H=Ce^{t/5}`,`H=50+Ct/5`],`Separate \\(dH/(H-50)=dt/5\\), integrate, and exponentiate.`);
   return safeMc('sep-cool','contextual_separable_cooling','A temperature H satisfies the differential equation. Which general solution form is correct?',`\\frac{dH}{dt}=-\\frac14(H-70)`,`H=70+Ce^{-t/4}`,[`H=70+Ce^{t/4}`,`H=Ce^{-t/4}`,`H=70-Ct/4`],`Separate variables; the negative coefficient produces exponential decay toward 70.`);
 };

 G['rate-problems']=()=>{
   const fam=pick(['traffic','tank','ballots','delayed_flow','attendance']);
   if(fam==='traffic'){const P0=pick([80,100,120,150]),A=pick([10,15,20]),B=pick([5,10,15,20]),T=pick([3,4,5]),value=P0+A*T+B*(T/2-Math.sin(2*T)/4);return calcNumeric(`rate-traffic-${P0}-${A}-${B}-${T}`,'calculator_traffic',`Calculator Active: ${P0} cars are initially in a parking area. Cars enter at rate R(t). How many cars are present at t=${T}? Round to three decimals.`,`R(t)=${A}+${B}\\sin^2t`,value,`Use initial amount plus \\(\\int_0^${T}R(t)\\,dt\\).`)}
   if(fam==='tank'){const P0=pick([300,400,500,600]),inn=pick([15,20,25]),c=pick([4,5,6,8]),q=pick([4,5,6]),T=pick([4,5,6]),value=P0+inn*T-c*q*(Math.exp(T/q)-1);return calcNumeric(`rate-tank-${P0}-${inn}-${c}-${q}-${T}`,'calculator_tank',`Calculator Active: A tank initially contains ${P0} gallons. Water enters at ${inn} gal/min and leaves at rate L(t). How much water is present after ${T} minutes? Round to three decimals.`,`L(t)=${c}e^{t/${q}}`,value,`Use \\(${P0}+\\int_0^${T}(${inn}-L(t))\\,dt\\).`)}
   if(fam==='ballots'){const P0=pick([200,250,300]),A=pick([30,40,50]),T=pick([4,5,6]),value=P0+A*(T-Math.sin(T));return calcNumeric(`rate-ballots-${P0}-${A}-${T}`,'calculator_ballots',`Calculator Active: At t=0, ${P0} ballots have been counted. Ballots are counted at rate R(t). How many have been counted by t=${T}? Round to three decimals.`,`R(t)=${A}(1-\\cos t)`,value,`Compute \\(${P0}+\\int_0^${T}R(t)\\,dt\\).`)}
   if(fam==='delayed_flow'){const P0=pick([250,300,400]),inn=pick([20,30,40]),c=pick([4,6,8]),T=pick([3,4,5]),value=P0+inn*T-c*T**3/3;return calcNumeric(`rate-delay-${P0}-${inn}-${c}-${T}`,'calculator_delayed_outflow',`Calculator Active: A reservoir contains ${P0} units at t=0. Inflow is ${inn} units/hour while outflow is R(t). How much remains at t=${T}? Round to three decimals.`,`R(t)=${c}t^2`,value,`Use \\(${P0}+\\int_0^${T}(${inn}-${c}t^2)\\,dt\\).`)}
   const P0=pick([400,500,600]),A=pick([50,60,70]),T=pick([2,3,4]),value=P0+A*(T+Math.cos(T)-1);return calcNumeric(`rate-attend-${P0}-${A}-${T}`,'calculator_attendance',`Calculator Active: A festival has ${P0} attendees at t=0. Net attendance changes at rate N(t). How many attendees are present at t=${T}? Round to three decimals.`,`N(t)=${A}(1-\\sin t)`,value,`Use \\(${P0}+\\int_0^${T}N(t)\\,dt\\).`);
 };

 G['area-below-and-between-curves']=(opts={})=>{
   const mode=opts.areaMode||opts.mode||'noncalc';
   if(mode==='calc'){const fam=pick(['trig','exp_line']);if(fam==='trig'){const k=pick([1,2,3,4]),value=2*k;return calcNumeric(`area-calc-trig-${k}`,'calculator_area_trig','Calculator Active: Find the area between the curve and the x-axis on the given interval. Round to three decimals.',`y=${k===1?'':k}\\sin x,\\quad 0\\le x\\le\\pi`,value,`The curve is above the x-axis. Evaluate the definite integral numerically.`)}const k=pick([1,2,3]),value=k*(Math.E-2.5);return calcNumeric(`area-calc-exp-${k}`,'calculator_area_exp_line','Calculator Active: Find the area between the curves on [0,1]. Round to three decimals.',`y=${k===1?'':k}e^x,\\qquad y=${k===1?'':k}(x+1)`,value,`The exponential curve is above its tangent line on this interval. Integrate top minus bottom.`)}
   const fam=pick(['axis_parabola','line_parabola','two_parabolas','sign_cubic','trig_exact']);
   if(fam==='axis_parabola'){const a=ri(2,5);return safeMc(`area-axis-${a}`,'curve_x_axis','Find the area between the curve and the x-axis.',`y=${a*a}-x^2,\\quad -${a}\\le x\\le${a}`,texRat(4*a**3,3),[texRat(2*a**3,3),String(2*a**2),String(4*a**2)],`The curve is above the x-axis on the interval. Integrate from \\(-${a}\\) to \\(${a}\\).`)}
   if(fam==='line_parabola'){const a=ri(2,5);return safeMc(`area-lp-${a}`,'line_parabola_clean','Find the area enclosed by the curves.',`y=${a}x,\\qquad y=x^2`,texRat(a**3,6),[texRat(a**3,3),texRat(a**2,2),String(a**2)],`The curves intersect at \\(x=0\\) and \\(x=${a}\\). Integrate top minus bottom.`)}
   if(fam==='two_parabolas'){const r=ri(1,4);return safeMc(`area-two-p-${r}`,'two_parabolas','Find the enclosed area.',`y=${r*r}-x^2,\\qquad y=x^2-${r*r}`,texRat(8*r**3,3),[texRat(4*r**3,3),String(4*r*r),texRat(16*r**3,3)],`The curves meet at \\(x=\\pm${r}\\). Integrate upper minus lower.`)}
   if(fam==='sign_cubic'){const r=ri(2,4);return safeMc(`area-sign-cubic-${r}`,'area_total_sign_change','Find the total area between the curve and the x-axis.',`y=x^3-${r*r}x,\\quad -${r}\\le x\\le${r}`,texRat(r**4,2),['0',texRat(r**4,4),String(r**4)],`Split at the zeros \\(-${r},0,${r}\\) and add absolute areas.`)}
   const k=ri(1,4);return safeMc(`area-trig-exact-${k}`,'trig_area_exact','Find the area between the curve and the x-axis.',`y=${k===1?'':k}\\cos x,\\quad -\\frac\\pi2\\le x\\le\\frac\\pi2`,String(2*k),[String(k),`${k}\\pi`,String(4*k)],`Cosine is nonnegative on the interval; evaluate exactly.`);
 };

 G['finding-area-in-terms-of-y']=()=>{
   const fam=pick(['sideways_parabola','line_parabola','two_sideways','triangle']);
   if(fam==='sideways_parabola'){const h=ri(1,5);return safeMc(`areay-par-${h}`,'horizontal_parabola','Find the area of the region by integrating with respect to y.',`x=y^2,\\qquad x=${h*h},\\qquad -${h}\\le y\\le${h}`,texRat(4*h**3,3),[texRat(2*h**3,3),String(2*h*h),String(4*h*h)],`Horizontal width is \\(${h*h}-y^2\\).`)}
   if(fam==='line_parabola'){const k=ri(2,6);return safeMc(`areay-line-par-${k}`,'horizontal_line_parabola','Find the area using horizontal slices.',`x=y^2,\\qquad x=${k}y`,texRat(k**3,6),[texRat(k**3,3),texRat(k**2,2),String(k**2)],`The curves meet at \\(y=0\\) and \\(y=${k}\\). Use right minus left.`)}
   if(fam==='two_sideways'){const r=ri(1,4);return safeMc(`areay-two-${r}`,'horizontal_two_curves','Find the area of the region using dy.',`x=y^2-${r*r},\\qquad x=${r*r}-y^2`,texRat(8*r**3,3),[texRat(4*r**3,3),String(4*r*r),texRat(16*r**3,3)],`The curves meet at \\(y=\\pm${r}\\). Use right minus left with horizontal slices.`)}
   const h=ri(2,6),c=ri(1,4);return safeMc(`areay-tri-${h}-${c}`,'horizontal_triangle','Find the area using horizontal slices.',`x=0,\\qquad x=${c}(${h}-y),\\qquad 0\\le y\\le${h}`,texRat(c*h*h,2),[String(c*h*h),texRat(c*h*h,4),String(c*h)],`Horizontal width is \\(${c}(${h}-y)\\). Integrate from 0 to ${h}.`);
 };

 G['integrals-on-piecewise-defined-functions']=()=>{
   const fam=pick(['three_piece','four_piece','trig_piece','reciprocal_piece']);
   if(fam==='three_piece'){const a=ri(1,4),b=ri(1,4),c=ri(3,7);const num=6*a+8*b+6*c-18;return safeMc(`piece-3-${a}-${b}-${c}`,'three_piece_polynomial','Evaluate the definite integral.',`f(x)=\\begin{cases}${a}x+${2*a},&-2\\le x<0\\\\${b}x^2,&0\\le x<2\\\\${c}-x,&2\\le x\\le4\\end{cases},\\quad \\int_{-2}^4f(x)dx`,texRat(num,3),[texRat(num+3,3),texRat(num-3,3),texRat(num+6,3)],`Split the integral at \\(x=0\\) and \\(x=2\\).`)}
   if(fam==='four_piece'){const a=ri(1,3),b=ri(1,3),c=ri(3,6),d=ri(1,4);const num=-9*a+4*b+6*c+3+12*d;return safeMc(`piece-4-${a}-${b}-${c}-${d}`,'four_piece','Evaluate the definite integral.',`f(x)=\\begin{cases}${a}x,&-2\\le x<-1\\\\${b}x^2+1,&-1\\le x<1\\\\${c}-x,&1\\le x<2\\\\${d},&2\\le x\\le4\\end{cases},\\quad \\int_{-2}^{4}f(x)dx`,texRat(num,6),[texRat(num+6,6),texRat(num-6,6),texRat(num+12,6)],`Break the integral at every formula change: \\(-1,1,2\\).`)}
   if(fam==='trig_piece'){const k=ri(1,4);return safeMc(`piece-trig-${k}`,'piecewise_trig','Evaluate the definite integral.',`f(x)=\\begin{cases}${k===1?'':k}\\cos x,&0\\le x<\\pi/2\\\\${2*k}-${k===1?'':k}\\sin x,&\\pi/2\\le x\\le\\pi\\end{cases},\\quad \\int_0^\\pi f(x)dx`,`${k}\\pi`,[String(2*k),`${k}\\pi+${k}`,`${k}\\pi-${k}`],`Integrate each formula on its own interval and add the results.`)}
   const k=ri(1,4);return safeMc(`piece-rec-${k}`,'piecewise_reciprocal','Evaluate the definite integral.',`f(x)=\\begin{cases}${k}/x,&1\\le x<e\\\\x,&e\\le x\\le e+1\\end{cases},\\quad \\int_1^{e+1}f(x)dx`,`${k}+e+\\frac12`,[`${k}+e`,`e+\\frac12`,`${k+1}+e+\\frac12`],`Split at \\(x=e\\). The reciprocal piece contributes ${k}.`);
 };

 G['volume-by-cross-sections']=()=>{
   const fam=pick(['square_semicircle_base','rectangle_parabola','iso_ellipse','equilateral_triangle','dy_square','semicircle','quarter_circle']);
   if(fam==='square_semicircle_base')return safeMc('cross-sq-semi','assignment_square_semicircle_base','The base is a semicircular region of radius 3 lying on the x-axis. Cross sections perpendicular to the y-axis are squares. Find the volume.','', '72',['36','54','108'],`At height \\(y\\), the square side is the full horizontal width \\(2\\sqrt{9-y^2}\\). Thus \\(V=\\int_0^3 4(9-y^2)\\,dy=72\\).`);
   if(fam==='rectangle_parabola')return safeMc('cross-rect-par','assignment_rectangles_twice_base','The base is bounded by \\(y=-x^2/9+4\\) and the x-axis. Cross sections perpendicular to the x-axis are rectangles whose height is twice the side in the xy-plane. Find the volume.','',`\\frac{1024}{5}`,[`\\frac{512}{5}`,`\\frac{1024}{15}`,'256'],`The base segment has length \\(4-x^2/9\\), so cross-sectional area is \\(2(4-x^2/9)^2\\). Integrate from \\(-6\\) to \\(6\\).`);
   if(fam==='iso_ellipse')return safeMc('cross-ellipse','assignment_iso_right_hypotenuse','The base is the ellipse \\(9x^2+4y^2=36\\). Cross sections perpendicular to the x-axis are isosceles right triangles with the hypotenuse in the base. Find the volume.','', '24',['12','18','48'],`The vertical segment is the hypotenuse. If its length is \\(h\\), triangle area is \\(h^2/4\\).`);
   if(fam==='equilateral_triangle')return safeMc('cross-eq-tri','assignment_equilateral_triangular_base','The base is the triangle with vertices (0,0), (0,1), and (1,0). Cross sections perpendicular to the y-axis are equilateral triangles. Find the volume.','',`\\frac{\\sqrt3}{12}`,[`\\frac{\\sqrt3}{4}`,`\\frac{\\sqrt3}{6}`,`\\frac{\\sqrt3}{3}`],`At height \\(y\\), the horizontal side length is \\(1-y\\). Integrate \\(\\frac{\\sqrt3}{4}(1-y)^2\\) from 0 to 1.`);
   if(fam==='dy_square')return safeMc('cross-dy-sq','assignment_dy_squares','The base is bounded by \\(y=1-x^2\\) and the x-axis. Cross sections perpendicular to the y-axis are squares. Find the volume.','', '2',['1','4','8/3'],`At height \\(y\\), the square side is \\(2\\sqrt{1-y}\\), so area is \\(4(1-y)\\). Integrate from 0 to 1.`);
   if(fam==='semicircle')return safeMc('cross-semi-assn','assignment_semicircle_sections','The base is bounded by \\(y=1-x^2\\) and the x-axis. Cross sections perpendicular to the x-axis are semicircles. Find the volume.','',`\\frac{2\\pi}{15}`,[`\\frac{\\pi}{15}`,`\\frac{4\\pi}{15}`,`\\frac{2\\pi}{5}`],`The diameter is \\(1-x^2\\). Semicircle area is \\(\\pi d^2/8\\), integrated from -1 to 1.`);
   return safeMc('cross-quarter-assn','assignment_quarter_circle_sections','The base is bounded by \\(y=2-x^2\\) and the x-axis. Cross sections perpendicular to the y-axis are quarter circles. Find the volume.','',`2\\pi`,[`\\pi`,`4\\pi`,`\\frac{4\\pi}{3}`],`At height \\(y\\), the horizontal segment has length \\(2\\sqrt{2-y}\\) and serves as the radius. Integrate \\(\\frac{\\pi}{4}[2\\sqrt{2-y}]^2\\) from 0 to 2.`);
 };

 G['solids-of-revolution']=(opts={})=>{
   const method=opts.solidMethod||'disk',calc=opts.solidCalcMode||'noncalc';
   if(calc==='calc'){
     if(method==='shell'){const val=Math.PI;return calcNumeric('solid-calc-shell','calculator_shells','Calculator Active: Use cylindrical shells to find the volume when the region under y=e^x-1 on 0≤x≤1 is revolved about the y-axis. Round to three decimals.','',val,`Use \\(V=2\\pi\\int_0^1x(e^x-1)dx\\).`)}
     const val=Math.PI*(Math.E**2-1)/2;return calcNumeric('solid-calc-wash','calculator_washers','Calculator Active: Use disks/washers to find the volume when the region under y=e^x on 0≤x≤1 is revolved about the x-axis. Round to three decimals.','',val,`Use \\(V=\\pi\\int_0^1e^{2x}dx\\).`);
   }
   if(method==='shell'){
     const fam=pick(['about_y','shifted_vertical','horizontal_shell']);
     if(fam==='about_y')return safeMc('solid-shell-y','shell_y_axis','Use cylindrical shells to rotate the region under y=x² on 0≤x≤2 about the y-axis. Find the volume.','',`8\\pi`,[`4\\pi`,`16\\pi`,`\\frac{8\\pi}{3}`],`\\(V=2\\pi\\int_0^2x(x^2)dx=8\\pi\\).`);
     if(fam==='shifted_vertical')return safeMc('solid-shell-x3','shell_shifted_vertical','Use cylindrical shells to rotate the region under y=x on 0≤x≤2 about x=3. Find the volume.','',`\\frac{20\\pi}{3}`,[`\\frac{16\\pi}{3}`,`4\\pi`,`8\\pi`],`Shell radius is \\(3-x\\), height is \\(x\\): \\(2\\pi\\int_0^2(3-x)x dx\\).`);
     return safeMc('solid-shell-horizontal','shell_horizontal','Use horizontal cylindrical shells to rotate the region bounded by x=y² and x=4 about the x-axis. Find the volume.','',`8\\pi`,[`4\\pi`,`16\\pi`,`\\frac{32\\pi}{3}`],`For horizontal shells, radius is \\(y\\) and height is \\(4-y^2\\). Integrate \\(2\\pi\\int_0^2 y(4-y^2)\\,dy=8\\pi\\).`);
   }
   const fam=pick(['disk','washer','shifted_horizontal','between_curves']);
   if(fam==='disk')return safeMc('solid-disk','disk_basic','Use disks to rotate the region under y=2x on 0≤x≤3 about the x-axis. Find the volume.','',`36\\pi`,[`18\\pi`,`12\\pi`,`108\\pi`],`\\(V=\\pi\\int_0^3(2x)^2dx=36\\pi\\).`);
   if(fam==='washer')return safeMc('solid-washer','washer_basic','Use washers to rotate the region between y=4 and y=x² on 0≤x≤2 about the x-axis. Find the volume.','',`\\frac{128\\pi}{5}`,[`\\frac{64\\pi}{5}`,`32\\pi`,`16\\pi`],`Outer radius is 4 and inner radius is \\(x^2\\): \\(V=\\pi\\int_0^2(16-x^4)dx\\).`);
   if(fam==='shifted_horizontal')return safeMc('solid-shift-h','washer_shifted_horizontal','Use washers to rotate the region between y=x and y=2 on 0≤x≤2 about y=-1. Find the volume.','',`\\frac{28\\pi}{3}`,[`\\frac{14\\pi}{3}`,`8\\pi`,`12\\pi`],`Outer radius is 3; inner radius is \\(x+1\\). Integrate \\(\\pi[9-(x+1)^2]\\) from 0 to 2.`);
   return safeMc('solid-curves','washer_between_curves','Use washers to rotate the region between y=√x and y=x² on 0≤x≤1 about the x-axis. Find the volume.','',`\\frac{3\\pi}{10}`,[`\\frac{3\\pi}{5}`,`\\frac{\\pi}{10}`,`\\frac{2\\pi}{5}`],`Outer radius is \\(\\sqrt{x}\\), inner radius is \\(x^2\\): integrate \\(\\pi(x-x^4)\\).`);
 };

 // Retired shared generators must not be reachable indirectly.
 delete G['optimization'];delete G['related-rates'];delete G['slope-fields'];delete G['exponential-growth-and-decay-interest-newton-s-law-of-cooling'];delete G['converting-a-rectangular-approximation-into-exact-area'];
})();

// v10.6.3.A cumulative Unit 3/4 manual-review completion.
(function v1063AUnit34(){
 const clean=t=>String(t).replace(/\+\s*-/g,'- ').replace(/-\s*-/g,'+ ');
 const isText=v=>/\b(?:and|or|yes|no|continuous|discontinuous|maximum|minimum|increasing|decreasing|concave|tangent|normal|horizontal|vertical|applies|solution|left|right|speeding|slowing|underestimate|overestimate)\b/i.test(String(v));
 function mcA(id,variant,prompt,math,correct,wrongs,explanation,extra={}){
   const vals=[],seen=new Set();
   for(const x of [correct,...(wrongs||[])]){if(x==null)continue;const v=clean(String(x).trim());if(!v||seen.has(v))continue;seen.add(v);vals.push(v);}
   for(const f of ['0','1','-1','2','-2']){if(vals.length>=4)break;if(!seen.has(f)){seen.add(f);vals.push(f);}}
   const cn=clean(String(correct).trim()),choices=shuffle(vals.slice(0,4));
   return Object.assign({id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${clean(math)}\\)</div>`:''}</div>`,choices,correctIndex:choices.indexOf(cn),choicesAreText:choices.some(isText),explanation},extra);
 }
 function table(xs,ys,label='f(x)'){return `<table><thead><tr><th>x</th>${xs.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody><tr><th>${label}</th>${ys.map(y=>`<td>${y}</td>`).join('')}</tr></tbody></table>`;}
 function frac(n,d=1){return texRat(n,d);}
 function exactIntPoly2(A,B,C,a,b){
   const F=x=>A*x*x*x/3+B*x*x/2+C*x;return F(b)-F(a);
 }
 function nice(v){return Number.isInteger(v)?String(v):String(Math.round(v*1e9)/1e9);}
 function ratTexValue(v){
   for(let d=1;d<=60;d++){const n=Math.round(v*d);if(Math.abs(n/d-v)<1e-10)return texRat(n,d);}return nice(v);
 }

 // Unit 3: fix escaped TeX in cubic normal lines and retain broader tangent/normal families.
 G['equations-of-tangent-and-normal-lines']=()=>{
   const fam=pick(['quadratic_tangent','cubic_normal','radical_tangent','reciprocal_normal','sine_tangent','cosine_normal','exponential_tangent','log_tangent']);
   if(fam==='quadratic_tangent'){const A=pick([1,2,3,-1,-2]),B=nz(-5,5),C=ri(-4,4),x0=pick([-2,-1,0,1,2]),y0=A*x0*x0+B*x0+C,m=2*A*x0+B;return mcA(`tnA-q-${A}-${B}-${C}-${x0}`,'quadratic_tangent','Find the equation of the tangent line.',`f(x)=${poly2(A,B,C)},\\quad x=${x0}`,`y-${y0}=${m}(x-${x0})`,[`y-${y0}=${-m}(x-${x0})`,`y=${m}x`,`y-${m}=${y0}(x-${x0})`],`Differentiate first. At \\(x=${x0}\\), the tangent slope is \\(${m}\\), and the point is \\(( ${x0},${y0})\\).`);}
   if(fam==='cubic_normal'){const A=pick([1,2,-1]),B=pick([-3,-2,2,3]),x0=pick([-2,-1,1,2]),y0=A*x0**3+B*x0,m=3*A*x0*x0+B;if(m===0)return mcA(`tnA-cv-${A}-${B}-${x0}`,'cubic_normal','Find the equation of the normal line.',`f(x)=${signed(A,'x^3',true)}${signed(B,'x')},\\quad x=${x0}`,`x=${x0}`,[`y=${y0}`,`y=0`,`x=${-x0}`],`The tangent slope is 0, so the tangent is horizontal and the normal line is vertical through \\(x=${x0}\\).`);const nm=texRat(-1,m);return mcA(`tnA-c-${A}-${B}-${x0}`,'cubic_normal','Find the equation of the normal line.',`f(x)=${signed(A,'x^3',true)}${signed(B,'x')},\\quad x=${x0}`,`y-${y0}=${nm}(x-${x0})`,[`y-${y0}=${m}(x-${x0})`,`y=${nm}x`,`y-${y0}=${texRat(1,m)}(x-${x0})`],`The tangent slope is \\(${m}\\), so the normal slope is the negative reciprocal \\(${nm}\\). Use point-slope form through \\((${x0},${y0})\\).`);}
   if(fam==='radical_tangent'){const r=ri(2,6),x0=r*r,m=texRat(1,2*r);return mcA(`tnA-root-${r}`,'radical_tangent','Find the equation of the tangent line.',`f(x)=\\sqrt{x},\\quad x=${x0}`,`y-${r}=${m}(x-${x0})`,[`y-${r}=${2*r}(x-${x0})`,`y=${m}x`,`y-${x0}=${m}(x-${r})`],`Since \\(f'(x)=\\frac{1}{2\\sqrt{x}}\\), the slope at \\(x=${x0}\\) is \\(${m}\\).`);}
   if(fam==='reciprocal_normal'){const a=pick([1,2,3,4]),y0=texRat(1,a),tm=texRat(-1,a*a),nm=String(a*a);return mcA(`tnA-rec-${a}`,'reciprocal_normal','Find the equation of the normal line.',`f(x)=\\frac1x,\\quad x=${a}`,`y-${y0}=${nm}(x-${a})`,[`y-${y0}=${tm}(x-${a})`,`y=${nm}x`,`y-${y0}=-${nm}(x-${a})`],`The tangent slope is \\(-\\frac{1}{${a*a}}\\), so the normal slope is \\(${a*a}\\).`);}
   if(fam==='sine_tangent'){const k=pick([1,2,3,4]);return mcA(`tnA-sin-${k}`,'sine_tangent','Find the equation of the tangent line.',`f(x)=\\sin(${k===1?'x':`${k}x`}),\\quad x=0`,`y=${k===1?'x':`${k}x`}`,[`y=${-k}x`,`y=${k+1}x`,`y=${k}x+1`],`At \\(x=0\\), \\(f(0)=0\\) and \\(f'(0)=${k}\\).`);}
   if(fam==='cosine_normal'){const k=pick([1,2,3]),x0='\\frac{\\pi}{2'+(k===1?'':k)+'}',m=-k,nm=texRat(1,k);return mcA(`tnA-cos-${k}`,'cosine_normal','Find the equation of the normal line.',`f(x)=\\cos(${k===1?'x':`${k}x`}),\\quad x=${x0}`,`y=${nm}(x-${x0})`,[`y=${m}(x-${x0})`,`y=-${nm}(x-${x0})`,`y=${nm}x`],`At the indicated point, \\(f(x)=0\\) and the tangent slope is \\(${-k}\\), so the normal slope is \\(${nm}\\).`);}
   if(fam==='exponential_tangent'){const k=pick([1,2,3]);return mcA(`tnA-exp-${k}`,'exponential_tangent','Find the equation of the tangent line.',`f(x)=e^{${k===1?'x':`${k}x`}},\\quad x=0`,`y-1=${k}(x-0)`,[`y-1=${-k}(x-0)`,`y=${k}x`,`y-${k}=x`],`The point is \\((0,1)\\), and \\(f'(0)=${k}\\).`);}
   const k=pick([2,3,4,5]);return mcA(`tnA-log-${k}`,'log_tangent','Find the equation of the tangent line.',`f(x)=\\ln(${k}x),\\quad x=1`,`y-\\ln(${k})=x-1`,[`y-\\ln(${k})=${k}(x-1)`,`y=x`,`y-1=x-\\ln(${k})`],`Since \\(f'(x)=1/x\\), the tangent slope at \\(x=1\\) is 1.`);
 };

 // Unit 3: broader hand-solvable horizontal/vertical tangent practice.
 G['horizontal-and-vertical-tangent-lines']=()=>{
   const fam=pick(['cubic_horizontal','quartic_horizontal','sine_horizontal','cosine_horizontal','cube_root_vertical','fifth_root_vertical']);
   if(fam==='cubic_horizontal'){const h=pick([-2,-1,1,2]);return mcA(`hvA-cubic-${h}`,'horizontal_cubic','Find all x-values where the graph has a horizontal tangent.',`f(x)=x^3-3${h*h===1?'':h*h}x`,`${h<0?`${h}, ${-h}`:`${-h}, ${h}`}`,[`0`,`${h}`,`${-h}`],`Set \\(f'(x)=3x^2-${3*h*h}=0\\).`);}
   if(fam==='quartic_horizontal'){const a=pick([1,2,3]);return mcA(`hvA-q4-${a}`,'horizontal_quartic','Find all x-values where the graph has a horizontal tangent.',`f(x)=x^4-${2*a*a}x^2`,`-${a}, 0, ${a}`,[`-${a}, ${a}`,`0, ${a}`,`-${a}, 0`],`Factor \\(f'(x)=4x(x^2-${a*a})\\).`);}
   if(fam==='sine_horizontal')return mcA('hvA-sin','horizontal_trig','On \\([0,2\\pi]\\), where does the graph have horizontal tangents?',`f(x)=\\sin x`,`\\frac{\\pi}{2}, \\frac{3\\pi}{2}`,[`0, \\pi, 2\\pi`,`\\pi`,`0, 2\\pi`],`Horizontal tangents occur where \\(f'(x)=\\cos x=0\\).`);
   if(fam==='cosine_horizontal')return mcA('hvA-cos','horizontal_trig','On \\([0,2\\pi]\\), where does the graph have horizontal tangents?',`f(x)=\\cos x`,`0, \\pi, 2\\pi`,[`\\frac{\\pi}{2}, \\frac{3\\pi}{2}`,`\\pi`,`0,2\\pi`],`Horizontal tangents occur where \\(f'(x)=-\\sin x=0\\).`);
   if(fam==='cube_root_vertical'){const h=pick([-3,-2,-1,1,2,3]),sh=h<0?`x+${-h}`:`x-${h}`;return mcA(`hvA-cuberoot-${h}`,'vertical_cube_root','At what x-value does the graph have a vertical tangent?',`f(x)=\\sqrt[3]{${sh}}`,String(h),[String(-h),'0',String(h+1)],`The derivative contains \\(( ${sh})^{-2/3}\\), which becomes unbounded at \\(x=${h}\\).`);}
   const h=pick([-3,-2,-1,1,2,3]),sh=h<0?`x+${-h}`:`x-${h}`;return mcA(`hvA-fifth-${h}`,'vertical_fifth_root','At what x-value does the graph have a vertical tangent?',`f(x)=\\sqrt[5]{${sh}}`,String(h),[String(-h),'0',String(h-1)],`The derivative is proportional to \\(( ${sh})^{-4/5}\\), so the tangent is vertical at \\(x=${h}\\).`);
 };

 G['absolute-and-local-extrema-and-the-extreme-value-theorem']=()=>{
   const fam=pick(['up_quad','down_quad','cubic','abs','reciprocal','trig']);
   if(fam==='up_quad'){const h=pick([-2,-1,0,1,2]),a=h-3,b=h+2;return mcA(`extA-up-${h}`,'absolute_min_quadratic','Find the absolute minimum of f on the given interval.',`f(x)=(x-${h})^2+1,\\quad [${a},${b}]`,'1',[String(5),String(10),String(-1)],`The vertex \\(x=${h}\\) lies in the interval, and \\(f(${h})=1\\).`);}
   if(fam==='down_quad'){return mcA('extA-down','absolute_max_quadratic','Find the absolute maximum of f on the given interval.',`f(x)=9-(x-1)^2,\\quad [-2,4]`,'9',['0','8','-1'],`Check the critical point \\(x=1\\) and both endpoints.`);}
   if(fam==='cubic'){return mcA('extA-cubic','closed_interval_cubic','Find the absolute maximum of f on the given interval.',`f(x)=x^3-3x,\\quad [-2,2]`,'2',['-2','4','0'],`Check endpoints and critical points \\(x=\\pm1\\). The largest function value is 2.`);}
   if(fam==='abs')return mcA('extA-abs','absolute_value_minimum','Find the absolute minimum of f on the given interval.',`f(x)=|x-2|+1,\\quad [-1,5]`,'1',['0','3','4'],`The vertex occurs at \\(x=2\\), where the function value is 1.`);
   if(fam==='reciprocal')return mcA('extA-rec','reciprocal_interval','Find the absolute minimum of f on the given interval.',`f(x)=\\frac1x,\\quad [1,4]`,`\\frac14`,['1','4','0'],`The function decreases on this interval, so the minimum is the right-endpoint value.`);
   return mcA('extA-trig','trig_extrema','Find the absolute maximum of f on the given interval.',`f(x)=2\\sin x+1,\\quad [0,2\\pi]`,'3',['2','1','-1'],`The maximum of \\(\\sin x\\) is 1, so the maximum function value is 3.`);
 };

 G['increasing-decreasing-intervals-concavity-and-extrema']=()=>{
   const fam=pick(['inc_poly','dec_poly','concavity_cubic','concavity_quartic','local_extrema','trig_inc','exp_concavity']);
   if(fam==='inc_poly')return mcA('curveA-inc','increasing_intervals','On which intervals is f increasing?',`f'(x)=(x+2)(x-1)`,`(-\\infty,-2)\\cup(1,\\infty)`,[`(-2,1)`,`(-\\infty,1)`,`(-2,\\infty)`],`A sign chart for \\(f'\\) is positive outside the zeros -2 and 1.`);
   if(fam==='dec_poly')return mcA('curveA-dec','decreasing_intervals','On which interval is f decreasing?',`f'(x)=-(x-3)(x+1)`,`(-\\infty,-1)\\cup(3,\\infty)`,[`(-1,3)`,`(-\\infty,3)`,`(-1,\\infty)`],`The derivative is negative outside the critical values -1 and 3.`);
   if(fam==='concavity_cubic')return mcA('curveA-conc3','concavity','Where is f concave up?',`f''(x)=6x-12`,`(2,\\infty)`,[`(-\\infty,2)`,`(-2,\\infty)`,`(-\\infty,-2)`],`Concave up means \\(f''(x)>0\\), so \\(x>2\\).`);
   if(fam==='concavity_quartic')return mcA('curveA-conc4','concavity','Where is f concave down?',`f''(x)=12(x^2-1)`,`(-1,1)`,[`(-\\infty,-1)\\cup(1,\\infty)`,`(1,\\infty)`,`(-\\infty,1)`],`Concave down where \\(x^2-1<0\\).`);
   if(fam==='local_extrema')return mcA('curveA-ext','local_extrema_from_derivative','What happens at x=2?',`f'(x)=(x-2)(x+4)`,'f has a local minimum at x=2.',['f has a local maximum at x=2.','f has an inflection point at x=2.','f is decreasing on both sides of x=2.'],`The derivative changes from negative to positive at \\(x=2\\).`);
   if(fam==='trig_inc')return mcA('curveA-trig','trig_increasing','On \\([0,2\\pi]\\), where is f increasing?',`f(x)=\\sin x`,`(0,\\frac{\\pi}{2})\\cup(\\frac{3\\pi}{2},2\\pi)`,[`(\\frac{\\pi}{2},\\frac{3\\pi}{2})`,`(0,\\pi)`,`(\\pi,2\\pi)`],`Since \\(f'(x)=\\cos x\\), the graph increases where cosine is positive.`);
   return mcA('curveA-exp','exponential_concavity','Which statement is true for all real x?',`f(x)=e^{-x}`,'f is decreasing and concave up.',['f is increasing and concave up.','f is decreasing and concave down.','f is increasing and concave down.'],`Here \\(f'(x)=-e^{-x}<0\\) and \\(f''(x)=e^{-x}>0\\).`);
 };

 G['graphing-functions']=()=>{
   const fam=pick(['derivative_sign','second_derivative','both_signs','trig_behavior','rational_behavior']);
   if(fam==='derivative_sign')return mcA('graphA-fp','graph_from_derivative_sign','On which intervals is f increasing?',`f'(x)=(x+1)(x-3)`,`(-\\infty,-1)\\cup(3,\\infty)`,[`(-1,3)`,`(-\\infty,3)`,`(-1,\\infty)`],`Use a sign chart for \\(f'\\); it is positive outside the zeros -1 and 3.`);
   if(fam==='second_derivative')return mcA('graphA-fpp','graph_from_second_derivative','On which intervals is f concave up?',`f''(x)=x(x-2)`,`(-\\infty,0)\\cup(2,\\infty)`,[`(0,2)`,`(-\\infty,2)`,`(0,\\infty)`],`Use a sign chart for \\(f''\\); it is positive outside 0 and 2.`);
   if(fam==='both_signs')return mcA('graphA-point','point_behavior_from_derivatives','Describe the graph at x=a.',`f'(a)<0,\\quad f''(a)>0`,'Decreasing and concave up',['Increasing and concave up','Decreasing and concave down','Increasing and concave down'],`The sign of \\(f'\\) controls increasing/decreasing; the sign of \\(f''\\) controls concavity.`);
   if(fam==='trig_behavior')return mcA('graphA-trig','graph_trig_features','Which statement is true on \\((0,\\pi)\\)?',`f(x)=\\sin x`,'f is concave down on the entire interval.',['f is concave up on the entire interval.','f is increasing on the entire interval.','f is decreasing on the entire interval.'],`Since \\(f''(x)=-\\sin x<0\\) on \\((0,\\pi)\\), f is concave down.`);
   return mcA('graphA-rat','graph_rational_features','On which intervals is f decreasing?',`f(x)=\\frac1x`,`(-\\infty,0)\\cup(0,\\infty)`,[`(-\\infty,0)`,`(0,\\infty)`,`(-1,1)`],`Because \\(f'(x)=-1/x^2<0\\) wherever the function is defined, f decreases on both domain intervals.`);
 };

 // Linearization only: exact, hand-solvable approximation questions; no differential prompts.
 G['linearization-and-differentials']=()=>{
   const fam=pick(['sqrt','cube_root','fourth_root','reciprocal','sine']);
   if(fam==='sqrt'){const a=pick([25,36,49,64]),r=Math.sqrt(a),delta=pick([-1,1,2]),x=a+delta,ans=ratTexValue(r+delta/(2*r));return mcA(`linA-sqrt-${a}-${delta}`,'sqrt_linearization',`Use linearization at x=${a} to approximate the value.`,`\\sqrt{${x}}`,ans,[String(r),ratTexValue(r+delta/r),ratTexValue(r-delta/(2*r))],`For \\(f(x)=\\sqrt{x}\\), \\(L(x)=${r}+\\frac{1}{${2*r}}(x-${a})\\).`);}
   if(fam==='cube_root'){const a=pick([27,64,125]),r=Math.round(Math.cbrt(a)),delta=pick([-5,-2,2,4]),x=a+delta,ans=ratTexValue(r+delta/(3*r*r));return mcA(`linA-cube-${a}-${delta}`,'cube_root_linearization',`Use linearization at x=${a} to approximate the value.`,`\\sqrt[3]{${x}}`,ans,[String(r),ratTexValue(r+delta/(r*r)),ratTexValue(r-delta/(3*r*r))],`For \\(f(x)=\\sqrt[3]{x}\\), \\(f'(${a})=\\frac{1}{${3*r*r}}\\).`);}
   if(fam==='fourth_root'){const a=pick([16,81,256]),r=Math.round(a**0.25),delta=pick([-1,1,2]),x=a+delta,den=4*r**3,ans=ratTexValue(r+delta/den);return mcA(`linA-fourth-${a}-${delta}`,'fourth_root_linearization',`Use linearization at x=${a} to approximate the value.`,`\\sqrt[4]{${x}}`,ans,[String(r),ratTexValue(r+delta/(4*r*r)),ratTexValue(r-delta/den)],`Use \\(f'(x)=\\frac{1}{4x^{3/4}}\\).`);}
   if(fam==='reciprocal'){const a=pick([2,4,5]),d=pick([1,-1]),den=10,xTex=`${a}${d>0?'+':'-'}\\frac1{10}`,val=1/a-d/(10*a*a),ans=ratTexValue(val);return mcA(`linA-rec-${a}-${d}`,'reciprocal_linearization',`Use linearization at x=${a} to approximate the value.`,`\\frac{1}{${xTex}}`,ans,[texRat(1,a),ratTexValue(1/a+d/(10*a*a)),ratTexValue(1/a-d/(10*a))],`For \\(f(x)=1/x\\), \\(f'(${a})=-1/${a*a}\\).`);}
   return mcA('linA-sine','sine_linearization','Use the linearization of sin x at x=0 to approximate the value.',`\\sin\\left(\\frac1{20}\\right)`,`\\frac1{20}`,[`\\frac1{400}`,'0','1'],`At 0, \\(f(0)=0\\) and \\(f'(0)=1\\), so \\(L(x)=x\\).`);
 };

 // Unit 4: rectangular approximations, with wording tied explicitly to the definite integral.
 G['rectangular-approximations']=()=>{
   const fam=pick(['left_linear','right_linear','mid_quad','left_quad','right_table','left_table','mid_table']);
   if(fam==='left_linear'){const m=pick([1,2,3]),b=pick([0,1,2]),a=0,c=4,n=4,dx=1,ys=[0,1,2,3].map(x=>m*x+b),ans=ys.reduce((s,x)=>s+x,0)*dx;return mcA(`rectA-ll-${m}-${b}`,'left_function','Use four left-endpoint rectangles to approximate the integral.',`\\int_0^4(${m}x${b?`+${b}`:''})\\,dx`,String(ans),[String(ans+m*4),String(ans-m*2),String(ans+2)],`Here \\(\\Delta x=1\\). Use the left endpoints 0,1,2,3.`);}
   if(fam==='right_linear'){const m=pick([1,2,3]),b=pick([0,1,2]),ys=[1,2,3,4].map(x=>m*x+b),ans=ys.reduce((s,x)=>s+x,0);return mcA(`rectA-rl-${m}-${b}`,'right_function','Use four right-endpoint rectangles to approximate the integral.',`\\int_0^4(${m}x${b?`+${b}`:''})\\,dx`,String(ans),[String(ans-m*4),String(ans+m*2),String(ans-2)],`Here \\(\\Delta x=1\\). Use the right endpoints 1,2,3,4.`);}
   if(fam==='mid_quad'){const ys=[.5,1.5,2.5,3.5].map(x=>x*x),ans=ys.reduce((s,x)=>s+x,0);return mcA('rectA-midq','midpoint_function','Use four midpoint rectangles to approximate the integral.',`\\int_0^4x^2\\,dx`,ratTexValue(ans),[String(14),String(30),String(16)],`With \\(\\Delta x=1\\), evaluate at the midpoints \\(1/2,3/2,5/2,7/2\\).`);}
   if(fam==='left_quad'){const ys=[0,1,4,9],ans=14;return mcA('rectA-lq','left_quadratic','Use four left-endpoint rectangles to approximate the integral.',`\\int_0^4x^2\\,dx`,String(ans),['30','21','16'],`Use left endpoints 0,1,2,3 with width 1.`);}
   const xs=fam==='mid_table'?[0,1,2,3,4]:[0,1,2,3,4],ys=fam==='mid_table'?[2,4,7,11,16]:[1,3,6,10,15];
   if(fam==='right_table'){const ans=3+6+10+15;return Object.assign(mcA('rectA-rtab','right_table','Use a right-endpoint rectangular approximation to approximate the integral from 0 to 4 of f(x).','',String(ans),['20','29','39'],`The widths are 1 and the right endpoints are 1,2,3,4.`),{questionHtml:`<div><div class="question-prompt">Use a right-endpoint rectangular approximation to approximate the integral from 0 to 4 of f(x).</div>${table(xs,ys)}</div>`});}
   if(fam==='left_table'){const ans=1+3+6+10;return Object.assign(mcA('rectA-ltab','left_table','Use a left-endpoint rectangular approximation to approximate the integral from 0 to 4 of f(x).','',String(ans),['34','15','25'],`The widths are 1 and the left endpoints are 0,1,2,3.`),{questionHtml:`<div><div class="question-prompt">Use a left-endpoint rectangular approximation to approximate the integral from 0 to 4 of f(x).</div>${table(xs,ys)}</div>`});}
   const mx=[0,1,2,3,4],my=[1,4,9,16,25];return Object.assign(mcA('rectA-mtab','midpoint_table','Use the table and a midpoint approximation with two equal subintervals to approximate the integral from 0 to 4 of f(x).','', '26',['20','34','30'],`The two subintervals have width 2 and midpoints 1 and 3: \\(2[f(1)+f(3)]=26\\).`),{questionHtml:`<div><div class="question-prompt">Use the table and a midpoint approximation with two equal subintervals to approximate the integral from 0 to 4 of f(x).</div>${table(mx,my)}</div>`});
 };

 G['trapezoidal-approximations']=()=>{
   const fam=pick(['equal_table','unequal_table','linear_function','quadratic_function','three_interval_table','unequal_table2']);
   if(fam==='equal_table'){const xs=[0,1,2,3,4],ys=[1,3,6,10,15],ans=.5*(ys[0]+2*(ys[1]+ys[2]+ys[3])+ys[4]);return Object.assign(mcA('trapA-eq','equal_table','Use the trapezoidal rule to approximate the integral from 0 to 4 of f(x).','',ratTexValue(ans),['32','29','36'],`For equal spacing 1, use \\(T=\\frac12[f(0)+2f(1)+2f(2)+2f(3)+f(4)]\\).`),{questionHtml:`<div><div class="question-prompt">Use the trapezoidal rule to approximate the integral from 0 to 4 of f(x).</div>${table(xs,ys)}</div>`});}
   if(fam==='unequal_table'){const xs=[0,1,3,6],ys=[2,5,4,8],ans=(1)*(2+5)/2+(2)*(5+4)/2+(3)*(4+8)/2;return Object.assign(mcA('trapA-uneq','unequal_table','Use the trapezoidal rule to approximate the integral from 0 to 6 of f(x).','',ratTexValue(ans),['24','28','33'],`For unequal spacing, compute each trapezoid separately using \\(\\frac{\\Delta x}{2}(y_L+y_R)\\).`),{questionHtml:`<div><div class="question-prompt">Use the trapezoidal rule to approximate the integral from 0 to 6 of f(x).</div>${table(xs,ys)}</div>`});}
   if(fam==='linear_function'){return mcA('trapA-lin','function_evaluation','Use four trapezoids of equal width to approximate the integral.',`\\int_0^4(2x+1)\\,dx`,'20',['16','18','22'],`A linear function is integrated exactly by the trapezoidal rule; the exact value is 20.`);}
   if(fam==='quadratic_function'){const ys=[0,1,4,9,16],ans=.5*(0+2*(1+4+9)+16);return mcA('trapA-quad','function_evaluation','Use four trapezoids of equal width to approximate the integral.',`\\int_0^4x^2\\,dx`,String(ans),['30','21','54'],`Use values at 0,1,2,3,4 with width 1.`);}
   if(fam==='three_interval_table'){const xs=[1,3,5,7],ys=[4,6,5,9],ans=2*(4+6)/2+2*(6+5)/2+2*(5+9)/2;return Object.assign(mcA('trapA-3','equal_table','Use the trapezoidal rule to approximate the integral from 1 to 7 of f(x).','',String(ans),['34','36','42'],`Add the areas of the three trapezoids, each of width 2.`),{questionHtml:`<div><div class="question-prompt">Use the trapezoidal rule to approximate the integral from 1 to 7 of f(x).</div>${table(xs,ys)}</div>`});}
   const xs=[-2,-1,2,5],ys=[3,6,4,10],ans=1*(3+6)/2+3*(6+4)/2+3*(4+10)/2;return Object.assign(mcA('trapA-uneq2','unequal_table','Use the trapezoidal rule to approximate the integral from -2 to 5 of f(x).','',ratTexValue(ans),['36','38','42'],`The widths are 1,3,3. Compute each trapezoid separately.`),{questionHtml:`<div><div class="question-prompt">Use the trapezoidal rule to approximate the integral from -2 to 5 of f(x).</div>${table(xs,ys)}</div>`});
 };

 G['introduction-to-sigma-notation']=()=>{
   const fam=pick(['linear','quadratic','k2plusk','quadratic_combo','constant_combo','shifted_square']);
   const n=pick([4,5,6,7,8]);let expr,calc;
   if(fam==='linear'){const a=pick([2,3,4]),b=pick([-2,-1,1,2]);expr=`${a}k${b>0?`+${b}`:b}`;calc=k=>a*k+b;}
   else if(fam==='quadratic'){const a=pick([1,2,3]),b=pick([1,2,4]);expr=`${a===1?'':a}k^2+${b}`;calc=k=>a*k*k+b;}
   else if(fam==='k2plusk'){const a=pick([1,2,3]);expr=`k^2+${a===1?'':a}k`;calc=k=>k*k+a*k;}
   else if(fam==='quadratic_combo'){const a=pick([1,2]),b=pick([1,2,3]),c=pick([-3,-1,1,3]);expr=`${a===1?'':a}k^2${b>0?`+${b===1?'':b}k`:`${b}k`}${c>0?`+${c}`:c}`;calc=k=>a*k*k+b*k+c;}
   else if(fam==='constant_combo'){const a=pick([2,3,4]),c=pick([3,5,7]);expr=`${a}k^2-${a-1}k+${c}`;calc=k=>a*k*k-(a-1)*k+c;}
   else {expr='(k+1)^2';calc=k=>(k+1)*(k+1);}
   let ans=0;for(let k=1;k<=n;k++)ans+=calc(k);return mcA(`sigmaA-${fam}-${n}`,'sigma_polynomial','Evaluate the sum.',`\\sum_{k=1}^{${n}}(${expr})`,String(ans),[String(ans+n),String(ans-n),String(ans+2*n)],`Evaluate the summand for \\(k=1,2,\\ldots,${n}\\) and add. The index is \\(k\\).`);
 };

 // Start from the integral; first construct the Riemann/Newton sum, then evaluate the integral.
 G['evaluating-definite-integrals-with-a-limit-and-summation']=()=>{
   const fam=pick(['x2_01','linear_24','shifted_quad']);
   if(fam==='x2_01')return{id:'riemA-x2',variant:'integral_to_sum',answerType:'two-stage',questionHtml:`<div><div class="question-prompt">Write the definite integral as a limit of a Riemann sum, then evaluate it.</div><div>\\(\\int_0^1 x^2\\,dx\\)</div></div>`,stage1Prompt:'Part 1: Select the equivalent limit of a Riemann sum.',stage1Choices:[`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\left(\\frac{k}{n}\\right)^2\\frac1n`,`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\left(\\frac{k}{n}\\right)^2`,`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\frac{k}{n^2}`,`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\left(\\frac{k}{n}\\right)\\frac1n`],stage1CorrectIndex:0,numericAnswer:1/3,numericTolerance:1e-8,answerTex:'\\frac13',stage2Prompt:'Part 2: Evaluate the definite integral.',explanation:`For \\([0,1]\\), \\(\\Delta x=1/n\\) and \\(x_k=k/n\\). The integral equals \\(1/3\\).`};
   if(fam==='linear_24')return{id:'riemA-lin',variant:'integral_to_sum',answerType:'two-stage',questionHtml:`<div><div class="question-prompt">Write the definite integral as a limit of a Riemann sum, then evaluate it.</div><div>\\(\\int_2^4(3x-1)\\,dx\\)</div></div>`,stage1Prompt:'Part 1: Select the equivalent limit of a Riemann sum.',stage1Choices:[`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\left[3\\left(2+\\frac{2k}{n}\\right)-1\\right]\\frac{2}{n}`,`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\left(3\\frac{k}{n}-1\\right)\\frac1n`,`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\left[3\\left(2+\\frac{k}{n}\\right)-1\\right]\\frac{2}{n}`,`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\left[3\\left(2+\\frac{2k}{n}\\right)-1\\right]`],stage1CorrectIndex:0,numericAnswer:16,numericTolerance:1e-8,answerTex:'16',stage2Prompt:'Part 2: Evaluate the definite integral.',explanation:`Here \\(\\Delta x=2/n\\) and \\(x_k=2+2k/n\\).`};
   return{id:'riemA-shift',variant:'integral_to_sum',answerType:'two-stage',questionHtml:`<div><div class="question-prompt">Write the definite integral as a limit of a Riemann sum, then evaluate it.</div><div>\\(\\int_1^3(x-1)^2\\,dx\\)</div></div>`,stage1Prompt:'Part 1: Select the equivalent limit of a Riemann sum.',stage1Choices:[`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\left(\\frac{2k}{n}\\right)^2\\frac{2}{n}`,`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\left(1+\\frac{2k}{n}\\right)^2\\frac{2}{n}`,`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\left(\\frac{k}{n}\\right)^2\\frac{1}{n}`,`\\lim_{n\\to\\infty}\\sum_{k=1}^n\\left(\\frac{2k}{n}\\right)^2`],stage1CorrectIndex:0,numericAnswer:8/3,numericTolerance:1e-8,answerTex:'\\frac83',stage2Prompt:'Part 2: Evaluate the definite integral.',explanation:`With \\(x_k=1+2k/n\\), the factor \\((x_k-1)^2\\) becomes \\((2k/n)^2\\), and \\(\\Delta x=2/n\\).`};
 };

 G['integrals-using-geometry']=()=>{
   const fam=pick(['triangle','signed_triangle','upper_semicircle','lower_semicircle','quarter_circle','shifted_semicircle','complement_semicircle','absolute_value','rectangle_plus_semicircle','cross_axis_line']);
   if(fam==='triangle')return mcA('geoA-tri','triangle_area','Evaluate the definite integral using geometry.',`\\int_0^4(4-x)\\,dx`,'8',['4','12','16'],`The region is a right triangle with base 4 and height 4, so its area is 8.`);
   if(fam==='signed_triangle')return mcA('geoA-signtri','signed_triangle','Evaluate the definite integral using geometry.',`\\int_0^6(x-3)\\,dx`,'0',['9','18','-9'],`The two congruent triangular regions have opposite signs and cancel.`);
   if(fam==='upper_semicircle')return mcA('geoA-semi','upper_semicircle','Evaluate the definite integral using geometry.',`\\int_{-3}^{3}\\sqrt{9-x^2}\\,dx`,`\\frac{9\\pi}{2}`,[`9\\pi`,`3\\pi`,`\\frac{3\\pi}{2}`],`The graph is the upper semicircle of radius 3.`);
   if(fam==='lower_semicircle')return mcA('geoA-lowsemi','lower_semicircle_signed_area','Evaluate the definite integral using geometry.',`\\int_{-2}^{2}-\\sqrt{4-x^2}\\,dx`,`-2\\pi`,[`2\\pi`,`-4\\pi`,`4\\pi`],`The graph is a lower semicircle of radius 2, so the signed area is negative.`);
   if(fam==='quarter_circle')return mcA('geoA-quarter','quarter_circle_area','Evaluate the definite integral using geometry.',`\\int_0^4\\sqrt{16-x^2}\\,dx`,`4\\pi`,[`8\\pi`,`16\\pi`,`2\\pi`],`This is one quarter of a circle of radius 4.`);
   if(fam==='shifted_semicircle')return mcA('geoA-shiftsemi','shifted_semicircle','Evaluate the definite integral using geometry.',`\\int_1^7\\sqrt{9-(x-4)^2}\\,dx`,`\\frac{9\\pi}{2}`,[`9\\pi`,`3\\pi`,`\\frac{3\\pi}{2}`],`Horizontal shifts do not change area; this is an upper semicircle of radius 3.`);
   if(fam==='complement_semicircle')return mcA('geoA-comp','complementary_semicircle','Evaluate the definite integral using geometry.',`\\int_{-2}^{2}\\left(2-\\sqrt{4-x^2}\\right)\\,dx`,`8-2\\pi`,[`8+2\\pi`,`4-2\\pi`,`2\\pi-8`],`Use rectangle area 8 minus the area of an upper semicircle of radius 2.`);
   if(fam==='absolute_value')return mcA('geoA-abs','absolute_value_geometry','Evaluate the definite integral using geometry.',`\\int_{-3}^{3}|x|\\,dx`,'9',['0','18','6'],`The graph forms two congruent right triangles, each with area \\(9/2\\).`);
   if(fam==='rectangle_plus_semicircle')return mcA('geoA-rplus','rectangle_plus_semicircle','Evaluate the definite integral using geometry.',`\\int_{-2}^{2}\\left(3+\\sqrt{4-x^2}\\right)\\,dx`,`12+2\\pi`,[`12+4\\pi`,`6+2\\pi`,`12-2\\pi`],`Add the rectangle of area 12 and the upper semicircle of area \\(2\\pi\\).`);
   return mcA('geoA-cross','cross_axis_linear','Evaluate the definite integral using geometry.',`\\int_{-2}^{4}(x-1)\\,dx`,'0',['9','-9','6'],`The line crosses the x-axis at 1. The negative and positive triangles have equal area.`);
 };

 G['fundamental-theorem-of-calculus-and-integral-rules']=(opts={})=>{
   const mode=opts.ftcMode||opts.mode||'ftc';
   if(mode==='rules'){
     const fam=pick(['reverse','split','combine','constant_multiple','solve_missing','sum_difference']);
     if(fam==='reverse')return mcA('rulesA-rev','reverse_bounds','If \\(\\int_1^5 f(x)\\,dx=7\\), find the requested integral.',`\\int_5^1 f(x)\\,dx`,'-7',['7','0','14'],`Reversing the limits changes the sign.`);
     if(fam==='split')return mcA('rulesA-split','split_interval','Given \\(\\int_0^2f=3\\) and \\(\\int_2^5f=8\\), find the requested integral.',`\\int_0^5 f(x)\\,dx`,'11',['5','24','-11'],`Add integrals over adjacent intervals.`);
     if(fam==='combine')return mcA('rulesA-comb','combine_functions','Given \\(\\int_0^3f=5\\) and \\(\\int_0^3g=-2\\), find the requested integral.',`\\int_0^3(2f-g)\\,dx`,'12',['8','3','-12'],`Use linearity: \\(2(5)-(-2)=12\\).`);
     if(fam==='constant_multiple')return mcA('rulesA-mult','constant_multiple','Given \\(\\int_{-1}^2 f(x)\\,dx=-4\\), find the requested integral.',`\\int_{-1}^2 -3f(x)\\,dx`,'12',['-12','7','-1'],`Pull the constant outside: \\(-3(-4)=12\\).`);
     if(fam==='solve_missing')return mcA('rulesA-miss','solve_missing_interval','Given \\(\\int_0^6f=10\\) and \\(\\int_0^2f=4\\), find the requested integral.',`\\int_2^6 f(x)\\,dx`,'6',['14','4','-6'],`Since \\(\\int_0^6f=\\int_0^2f+\\int_2^6f\\), subtract 4 from 10.`);
     return mcA('rulesA-sumd','sum_difference','Given \\(\\int_1^4f=6\\) and \\(\\int_1^4g=3\\), find the requested integral.',`\\int_1^4(3f+2g)\\,dx`,'24',['15','21','9'],`Use linearity: \\(3(6)+2(3)=24\\).`);
   }
   const fam=pick(['upper_linear','upper_quadratic','lower_linear','both_bounds','trig_upper','exp_upper','trig_lower','two_nonlinear']);
   if(fam==='upper_linear')return mcA('ftcA-lin','ftc_linear_upper','Differentiate the function.',`F(x)=\\int_1^{3x-2}(t^2+1)\\,dt`,`3[(3x-2)^2+1]`,[`(3x-2)^2+1`,`3(t^2+1)`,`(9x^2+1)`],`Evaluate the integrand at \\(3x-2\\) and multiply by the derivative 3.`);
   if(fam==='upper_quadratic')return mcA('ftcA-q','ftc_quadratic_upper','Differentiate the function.',`F(x)=\\int_0^{x^2}\\sin(t^2)\\,dt`,`2x\\sin(x^4)`,[`\\sin(x^4)`,`2x\\sin(x^2)`,`x^2\\sin(x^4)`],`FTC gives the integrand evaluated at \\(x^2\\), then the chain rule contributes \\(2x\\).`);
   if(fam==='lower_linear')return mcA('ftcA-low','ftc_variable_lower','Differentiate the function.',`F(x)=\\int_{2x+1}^{5}e^{t^2}\\,dt`,`-2e^{(2x+1)^2}`,[`2e^{(2x+1)^2}`,`-e^{(2x+1)^2}`,`-2e^{2x+1}`],`A variable lower limit contributes a minus sign and the chain factor 2.`);
   if(fam==='both_bounds')return mcA('ftcA-both','ftc_two_variable_bounds','Differentiate the function.',`F(x)=\\int_x^{x^2}(t+1)\\,dt`,`2x(x^2+1)-(x+1)`,[`(x^2+1)-(x+1)`,`2x(x+1)`,`2x(x^2+1)+(x+1)`],`Differentiate the upper-bound contribution and subtract the lower-bound contribution.`);
   if(fam==='trig_upper')return mcA('ftcA-trig','ftc_trig_upper','Differentiate the function.',`F(x)=\\int_0^{\\sin x}e^{t^2}\\,dt`,`e^{\\sin^2x}\\cos x`,[`e^{\\sin x}\\cos x`,`e^{\\sin^2x}`,`2\\sin x e^{\\sin^2x}`],`Evaluate at \\(t=\\sin x\\), then multiply by \\(\\cos x\\).`);
   if(fam==='exp_upper')return mcA('ftcA-exp','ftc_exponential_upper','Differentiate the function.',`F(x)=\\int_2^{e^x}\\ln(1+t^2)\\,dt`,`e^x\\ln(1+e^{2x})`,[`\\ln(1+e^{2x})`,`2e^{2x}/(1+e^{2x})`,`e^x\\ln(1+e^x)`],`FTC gives \\(\\ln(1+e^{2x})\\), then multiply by \\((e^x)'=e^x\\).`);
   if(fam==='trig_lower')return mcA('ftcA-tlow','ftc_trig_lower','Differentiate the function.',`F(x)=\\int_{\\cos x}^{3}\\sqrt{1+t^4}\\,dt`,`\\sin x\\sqrt{1+\\cos^4x}`,[`-\\sin x\\sqrt{1+\\cos^4x}`,`\\sqrt{1+\\cos^4x}`,`\\cos x\\sqrt{1+\\sin^4x}`],`The lower limit contributes a negative sign, which cancels the derivative \\(-\\sin x\\).`);
   return mcA('ftcA-nonlin','ftc_two_nonlinear_bounds','Differentiate the function.',`F(x)=\\int_{x^2}^{e^x}\\cos(t^2)\\,dt`,`e^x\\cos(e^{2x})-2x\\cos(x^4)`,[`\\cos(e^{2x})-\\cos(x^4)`,`e^x\\cos(e^x)-2x\\cos(x^2)`,`e^x\\cos(e^{2x})+2x\\cos(x^4)`],`Apply FTC and the chain rule at both variable limits; subtract the lower-limit contribution.`);
 };

 // Broaden the shared Basic Integral pool used by Unit 4 comprehensive practice.
 G['basic-integrals']=()=>{
   const fam=pick(['poly','negative_power','fractional_power','divide_terms','sin2','cos2','sec2','definite']);
   if(fam==='poly')return mcA('basicA-poly','polynomial','Find an antiderivative.',`3x^4-2x^2+5`,`\\frac35x^5-\\frac23x^3+5x+C`,[`15x^3-4x+5+C`,`\\frac34x^5-\\frac22x^3+5x+C`,`\\frac35x^5-\\frac23x^3+C`],`Integrate each term using the power rule.`);
   if(fam==='negative_power')return mcA('basicA-neg','negative_power','Find an antiderivative.',`4x^{-3}-3x^{-2}`,`-2x^{-2}+3x^{-1}+C`,[`2x^{-2}-3x^{-1}+C`,`-12x^{-4}+6x^{-3}+C`,`-2x^{-2}-3x^{-1}+C`],`Increase each exponent by 1 and divide by the new exponent.`);
   if(fam==='fractional_power')return mcA('basicA-frac','fractional_power','Find an antiderivative.',`2x^{3/2}-3x^{1/2}`,`\\frac45x^{5/2}-2x^{3/2}+C`,[`\\frac43x^{5/2}-\\frac32x^{3/2}+C`,`\\frac45x^{3/2}-2x^{1/2}+C`,`\\frac45x^{5/2}+2x^{3/2}+C`],`Use the power rule with fractional exponents.`);
   if(fam==='divide_terms')return mcA('basicA-div','divide_each_term','Rewrite by dividing each term, then integrate.',`\\int\\frac{3x^4-2x^2+5}{x^3}\\,dx`,`\\frac32x^2-2\\ln|x|-\\frac{5}{2x^2}+C`,[`3x^2-2\\ln|x|+5x^{-2}+C`,`\\frac32x^2-2x^{-1}-\\frac{5}{2x^2}+C`,`\\frac32x^2+2\\ln|x|-\\frac{5}{2x^2}+C`],`First rewrite as \\(3x-2/x+5x^{-3}\\), then integrate term-by-term.`);
   if(fam==='sin2')return mcA('basicA-sin2','trig_identity','Find an antiderivative.',`\\sin^2x`,`\\frac{x}{2}-\\frac{\\sin2x}{4}+C`,[`-\\frac{\\cos^3x}{3}+C`,`\\frac{x}{2}+\\frac{\\sin2x}{4}+C`,`2\\sin x\\cos x+C`],`Use \\(\\sin^2x=(1-\\cos2x)/2\\).`);
   if(fam==='cos2')return mcA('basicA-cos2','trig_identity','Find an antiderivative.',`\\cos^2x`,`\\frac{x}{2}+\\frac{\\sin2x}{4}+C`,[`\\frac{x}{2}-\\frac{\\sin2x}{4}+C`,`\\sin x+C`,`2\\sin x\\cos x+C`],`Use \\(\\cos^2x=(1+\\cos2x)/2\\).`);
   if(fam==='sec2')return mcA('basicA-sec','basic_trig','Find an antiderivative.',`3\\sec^2x-2\\csc x\\cot x`,`3\\tan x+2\\csc x+C`,[`3\\sec x+2\\csc x+C`,`3\\tan x-2\\csc x+C`,`3\\tan x+2\\cot x+C`],`Use the standard antiderivatives of \\(\\sec^2x\\) and \\(\\csc x\\cot x\\).`);
   return mcA('basicA-def','definite_polynomial','Evaluate the definite integral.',`\\int_0^2(3x^2+1)\\,dx`,'10',['9','8','11'],`An antiderivative is \\(x^3+x\\); evaluate at 2 and 0.`);
 };

 G['u-substitution-integrals']=()=>{
   const fam=pick(['power_linear','trig_linear','sec_tan','csc_cot','exp_trig','linear_denominator','radical','power_composition','x5root','fourth_root']);
   if(fam==='power_linear')return mcA('usubA-p','linear_inner_power','Find an antiderivative.',`(3x+1)^4`,`\\frac{(3x+1)^5}{15}+C`,[`\\frac{(3x+1)^5}{5}+C`,`(3x+1)^5+C`,`\\frac{(3x+1)^4}{12}+C`],`Let \\(u=3x+1\\).`);
   if(fam==='trig_linear')return mcA('usubA-trig','trig_linear','Find an antiderivative.',`\\sin(4x)`,`-\\frac14\\cos(4x)+C`,[`-\\cos(4x)+C`,`\\frac14\\cos(4x)+C`,`\\frac14\\sin(4x)+C`],`Use \\(u=4x\\).`);
   if(fam==='sec_tan')return mcA('usubA-sectan','secant_tangent','Find an antiderivative.',`5\\sec(5x)\\tan(5x)`,`\\sec(5x)+C`,[`5\\sec(5x)+C`,`\\tan(5x)+C`,`\\sec^2(5x)+C`],`Recognize the derivative of \\(\\sec(5x)\\).`);
   if(fam==='csc_cot')return mcA('usubA-csccot','cosecant_cotangent','Find an antiderivative.',`-3\\csc(3x)\\cot(3x)`,`\\csc(3x)+C`,[`-\\csc(3x)+C`,`\\cot(3x)+C`,`3\\csc(3x)+C`],`Recognize the derivative of \\(\\csc(3x)\\).`);
   if(fam==='exp_trig')return mcA('usubA-exptrig','exponential_of_trig','Find an antiderivative.',`\\cos x\\,e^{\\sin x}`,`e^{\\sin x}+C`,[`e^{\\cos x}+C`,`\\sin x\\,e^{\\sin x}+C`,`\\cos x\\,e^{\\sin x}+C`],`Let \\(u=\\sin x\\).`);
   if(fam==='linear_denominator')return mcA('usubA-den','linear_denominator','Find an antiderivative.',`\\frac{6}{3x+2}`,`2\\ln|3x+2|+C`,[`6\\ln|3x+2|+C`,`\\frac{2}{3x+2}+C`,`\\ln|3x+2|+C`],`Let \\(u=3x+2\\).`);
   if(fam==='radical')return mcA('usubA-rad','radical_linear','Find an antiderivative.',`\\sqrt{3x+1}`,`\\frac29(3x+1)^{3/2}+C`,[`\\frac23(3x+1)^{3/2}+C`,`\\frac29\\sqrt{3x+1}+C`,`2(3x+1)^{3/2}+C`],`Use \\(u=3x+1\\).`);
   if(fam==='power_composition')return mcA('usubA-comp','power_composition','Find an antiderivative.',`6x(3x^2+1)^4`,`\\frac15(3x^2+1)^5+C`,[`(3x^2+1)^5+C`,`\\frac1{30}(3x^2+1)^5+C`,`\\frac15(3x^2+1)^4+C`],`Let \\(u=3x^2+1\\), so \\(du=6x\\,dx\\).`);
   if(fam==='x5root')return mcA('usubA-x5','power_times_root','Find an antiderivative.',`x^5\\sqrt{x^3+1}`,`\\frac{2}{15}(x^3+1)^{5/2}-\\frac{2}{9}(x^3+1)^{3/2}+C`,[`\\frac27(x^3+1)^{7/2}+C`,`\\frac23(x^3+1)^{3/2}+C`,`\\frac{2}{15}(x^3+1)^{5/2}+C`],`Let \\(u=x^3+1\\), then write \\(x^3=u-1\\).`);
   return mcA('usubA-fourth','fourth_root','Find an antiderivative.',`\\frac{x}{\\sqrt[4]{x^2+1}}`,`\\frac23(x^2+1)^{3/4}+C`,[`\\frac12(x^2+1)^{3/4}+C`,`\\frac43(x^2+1)^{3/4}+C`,`(x^2+1)^{7/8}+C`],`Use \\(u=x^2+1\\) and rewrite the fourth root as a fractional power.`);
 };

 // Shared log/inverse-trig pool for comprehensive review. Individual Topic 10 remains titled Natural Log.
 G['integrals-resulting-in-natural-log-and-inverse-trigonometric-functions']=()=>{
   const fam=pick(['linear_log','poly_division','atan','asin']);
   if(fam==='linear_log')return mcA('logA-lin','natural_log','Find an antiderivative.',`\\frac{6}{3x-1}`,`2\\ln|3x-1|+C`,[`6\\ln|3x-1|+C`,`\\ln|3x-1|+C`,`\\frac2{3x-1}+C`],`Use the \\(u'/u\\) pattern.`);
   if(fam==='poly_division')return mcA('logA-div','polynomial_division_log','Find an antiderivative.',`\\frac{x^2+1}{x+1}`,`\\frac{x^2}{2}-x+2\\ln|x+1|+C`,[`\\frac{x^2}{2}+x+2\\ln|x+1|+C`,`x-2\\ln|x+1|+C`,`\\frac{x^2}{2}-x+\\ln|x+1|+C`],`Divide first: \\((x^2+1)/(x+1)=x-1+2/(x+1)\\).`);
   if(fam==='atan')return mcA('logA-atan','inverse_tangent_antiderivative','Find an antiderivative.',`\\frac1{x^2+9}`,`\\frac13\\tan^{-1}\\left(\\frac{x}{3}\\right)+C`,[`\\tan^{-1}(x/3)+C`,`\\frac19\\tan^{-1}(x/3)+C`,`\\frac13\\sin^{-1}(x/3)+C`],`Use \\(\\int dx/(x^2+a^2)=a^{-1}\\tan^{-1}(x/a)+C\\).`);
   return mcA('logA-asin','inverse_sine_antiderivative','Find an antiderivative.',`\\frac1{\\sqrt{16-x^2}}`,`\\sin^{-1}\\left(\\frac{x}{4}\\right)+C`,[`\\frac14\\sin^{-1}(x/4)+C`,`\\tan^{-1}(x/4)+C`,`-\\cos^{-1}(x)+C`],`Use the standard inverse-sine antiderivative.`);
 };

 G['mean-value-theorem-for-integrals']=()=>{
   const fam=pick(['average_poly','average_trig','average_radical','average_exp','find_c_linear','find_c_quad']);
   if(fam==='average_poly')return mcA('mvtA-poly','average_polynomial','Find the average value of the function on the given interval.',`f(x)=x^2+1,\\quad [0,3]`,'4',['3','10','13'],`Use \\(f_{avg}=\\frac1{b-a}\\int_a^b f(x)\\,dx\\).`);
   if(fam==='average_trig')return mcA('mvtA-trig','average_trig','Find the average value of the function on the given interval.',`f(x)=\\sin x,\\quad [0,\\pi]`,`\\frac2\\pi`,[`2\\pi`,'0',`\\frac\\pi2`],`The integral is 2 and the interval length is \\(\\pi\\).`);
   if(fam==='average_radical')return mcA('mvtA-root','average_radical','Find the average value of the function on the given interval.',`f(x)=\\sqrt{x},\\quad [0,4]`,`\\frac43`,[`\\frac83`,'2','4'],`Compute \\(\\frac14\\int_0^4\\sqrt{x}dx\\).`);
   if(fam==='average_exp')return mcA('mvtA-exp','average_exponential','Find the average value of the function on the given interval.',`f(x)=e^x,\\quad [0,1]`,'e-1',['e','1','e+1'],`The interval length is 1.`);
   if(fam==='find_c_linear')return mcA('mvtA-c-lin','find_c','Find the value c guaranteed by the Mean Value Theorem for Integrals.',`f(x)=2x+1,\\quad [0,4]`,'2',['1','3','4'],`The average value is 5. Solve \\(2c+1=5\\).`);
   return mcA('mvtA-c-quad','find_c','Find all values c in the interval guaranteed by the Mean Value Theorem for Integrals.',`f(x)=x^2,\\quad [-3,3]`,`-\\sqrt3, \\sqrt3`,[`0`,`-3,3`,`-\\sqrt{6},\\sqrt{6}`],`The average value is 3. Solve \\(c^2=3\\) inside the interval.`);
 };

 // Whole-Unit 4 comprehensive dispatcher.
 G['unit-4-comprehensive']=(opts={})=>{
   const mode=opts.unit4Mode||opts.mode||'mixed';
   const map={rect:'rectangular-approximations',trap:'trapezoidal-approximations',sigma:'introduction-to-sigma-notation',riemann:'evaluating-definite-integrals-with-a-limit-and-summation',geometry:'integrals-using-geometry',ftc:'fundamental-theorem-of-calculus-and-integral-rules',rules:'fundamental-theorem-of-calculus-and-integral-rules',basic:'basic-integrals',usub:'u-substitution-integrals',log:'integrals-resulting-in-natural-log-and-inverse-trigonometric-functions',mvt:'mean-value-theorem-for-integrals'};
   let chosen=mode;if(chosen==='mixed')chosen=pick(Object.keys(map));const slug=map[chosen]||map.basic;const gen=G[slug];
   const childOpts=Object.assign({},opts);if(chosen==='ftc')childOpts.ftcMode='ftc';if(chosen==='rules')childOpts.ftcMode='rules';return gen(childOpts);
 };
})();

// v10.6.3.A — Unit 4 variety hardening. Keep assignment-fidelity families, but vary constants/intervals so practice does not collapse to a tiny fixed pool.
(function v1063AUnit4Variety(){
  const cleanV=t=>String(t).replace(/\+\s*-/g,'- ').replace(/-\s*-/g,'+ ');
  const textChoiceV=v=>/\b(?:and|or|yes|no|continuous|discontinuous|maximum|minimum|increasing|decreasing|concave|tangent|normal|horizontal|vertical|applies|solution|speeding|slowing|underestimate|overestimate)\b/i.test(String(v));
  const gcdV=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1};
  const ratPairV=(n,d=1)=>{if(d<0){n=-n;d=-d}const g=gcdV(n,d);return[n/g,d/g]};
  const ratV=(n,d=1)=>{const [a,b]=ratPairV(n,d);return b===1?String(a):`\\frac{${a}}{${b}}`};
  const rationalizeV=v=>{for(let d=1;d<=120;d++){const n=Math.round(v*d);if(Math.abs(n/d-v)<1e-10)return ratV(n,d)}return String(Math.round(v*1e10)/1e10)};
  const signedV=(n,body='')=>n===0?'':`${n<0?'-':'+'}${Math.abs(n)===1&&body?'':Math.abs(n)}${body}`;
  const linearV=(m,b,varName='x')=>`${m===1?'':m===-1?'-':m}${varName}${b===0?'':signedV(b)}`;
  const powerTermV=(c,p,varName='x')=>`${c===1?'':c===-1?'-':c}${p===1?varName:`${varName}^{${p}}`}`;
  const piV=(n,d=1)=>{const [a,b]=ratPairV(n,d),sg=a<0?'-':'',aa=Math.abs(a);if(b===1){if(aa===1)return `${sg}\\pi`;return `${sg}${aa}\\pi`}if(aa===1)return `${sg}\\frac{\\pi}{${b}}`;return `${sg}\\frac{${aa}\\pi}{${b}}`};
  const tableV=(xs,ys,label='f(x)')=>`<table><thead><tr><th>x</th>${xs.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody><tr><th>${label}</th>${ys.map(y=>`<td>${y}</td>`).join('')}</tr></tbody></table>`;
  function mcV(id,variant,prompt,math,correct,wrongs,explanation,extra={}){
    const vals=[],seen=new Set();for(const x of [correct,...(wrongs||[])]){if(x==null)continue;const v=cleanV(String(x).trim());if(!v||seen.has(v))continue;seen.add(v);vals.push(v)}
    for(const x of ['0','1','-1','2','-2','3']){if(vals.length>=4)break;if(!seen.has(x)){seen.add(x);vals.push(x)}}
    const cn=cleanV(String(correct).trim()),choices=shuffle(vals.slice(0,4));
    return Object.assign({id,variant,questionHtml:`<div><div class="question-prompt">${cleanV(prompt)}</div>${math?`<div>\\(${cleanV(math)}\\)</div>`:''}</div>`,choices,correctIndex:choices.indexOf(cn),choicesAreText:choices.some(textChoiceV),explanation:cleanV(explanation)},extra);
  }
  function tableProblemV(id,variant,prompt,xs,ys,correct,wrongs,explanation){
    const p=mcV(id,variant,prompt,'',correct,wrongs,explanation);p.questionHtml=`<div><div class="question-prompt">${prompt}</div>${tableV(xs,ys)}</div>`;return p;
  }
  function twoStageV(id,math,correctRep,wrongReps,numericAnswer,answerTex,explanation){
    const reps=shuffle([correctRep,...wrongReps].map(cleanV));const cr=cleanV(correctRep);return{id,variant:'integral_to_sum',answerType:'two-stage',questionHtml:`<div><div class="question-prompt">Write the definite integral as a limit of a Riemann sum, then evaluate it.</div><div>\\(${cleanV(math)}\\)</div></div>`,stage1Prompt:'Part 1: Select the equivalent limit of a Riemann sum.',stage1Choices:reps,stage1CorrectIndex:reps.indexOf(cr),numericAnswer,numericTolerance:1e-8,answerTex:cleanV(answerTex),stage2Prompt:'Part 2: Evaluate the definite integral.',explanation:cleanV(explanation)};
  }
  const sumV=(sample,dx)=>`\\lim_{n\\to\\infty}\\sum_{k=1}^n${sample}${dx}`;

  G['rectangular-approximations']=()=>{
    const fam=pick(['left_linear','right_linear','mid_quad','left_quad','right_table','left_table','mid_table']);
    if(fam==='left_linear'||fam==='right_linear'){
      const method=fam==='left_linear'?'left':'right',a=ri(-3,1),h=pick([1,2]),n=4,b=a+n*h,m=pick([1,2,3]),c=ri(-4,4),f=x=>m*x+c;let ans=0;
      for(let j=0;j<n;j++){const x=method==='left'?a+j*h:a+(j+1)*h;ans+=f(x)*h}
      const fn=linearV(m,c),variant=method==='left'?'left_function':'right_function';
      return mcV(`rectV-${method}-${a}-${h}-${m}-${c}`,variant,`Use four ${method}-endpoint rectangles to approximate the integral.`,`\\int_${a}^{${b}}(${fn})\\,dx`,String(ans),[String(ans+h*m),String(ans-h*m),String(ans+2*h)],`Here \\(\\Delta x=${h}\\). Use the four ${method} endpoints and add \\(f(x_i)\\Delta x\\).`);
    }
    if(fam==='mid_quad'||fam==='left_quad'){
      const method=fam==='mid_quad'?'midpoint':'left',a=ri(-2,1),h=pick([1,2]),n=4,b=a+n*h,A=pick([1,2]),B=ri(-3,3),C=ri(-4,4),f=x=>A*x*x+B*x+C;let ans=0;
      for(let j=0;j<n;j++){const x=method==='midpoint'?a+(j+.5)*h:a+j*h;ans+=f(x)*h}
      const fn=`${powerTermV(A,2)}${B?signedV(B,'x'):''}${C?signedV(C):''}`,variant=method==='midpoint'?'midpoint_function':'left_quadratic',correct=rationalizeV(ans);
      return mcV(`rectV-${method}-q-${a}-${h}-${A}-${B}-${C}`,variant,`Use four ${method}-endpoint rectangles to approximate the integral.`,`\\int_${a}^{${b}}(${fn})\\,dx`,correct,[rationalizeV(ans+h),rationalizeV(ans-h),rationalizeV(ans+2*h)],`The subinterval width is \\(\\Delta x=${h}\\). Evaluate the quadratic at the four ${method} sample points.`);
    }
    if(fam==='right_table'||fam==='left_table'){
      const method=fam==='right_table'?'right':'left',a=ri(-3,2),h=pick([1,2]),xs=Array.from({length:5},(_,i)=>a+i*h),ys=Array.from({length:5},()=>ri(-4,12));let s=0;
      for(let i=0;i<4;i++)s+=ys[method==='left'?i:i+1]*h;
      return tableProblemV(`rectV-tab-${method}-${a}-${h}-${ys.join('_')}`,method==='right'?'right_table':'left_table',`Use a ${method}-endpoint rectangular approximation to approximate the integral from ${xs[0]} to ${xs[4]} of f(x).`,xs,ys,String(s),[String(s+h),String(s-h),String(s+2*h)],`Each subinterval has width ${h}; use the ${method} endpoint height on each interval.`);
    }
    const a=ri(-2,2),h=pick([1,2]),xs=Array.from({length:5},(_,i)=>a+i*h),ys=Array.from({length:5},()=>ri(1,15)),ans=2*h*(ys[1]+ys[3]);
    return tableProblemV(`rectV-tab-mid-${a}-${h}-${ys.join('_')}`,'midpoint_table',`Use the table and a midpoint approximation with two equal subintervals to approximate the integral from ${xs[0]} to ${xs[4]} of f(x).`,xs,ys,String(ans),[String(ans+2*h),String(ans-2*h),String(h*(ys[1]+ys[3]))],`The two subintervals each have width ${2*h}; their midpoints are ${xs[1]} and ${xs[3]}.`);
  };

  G['trapezoidal-approximations']=()=>{
    const fam=pick(['equal_table','unequal_table','linear_function','quadratic_function','three_interval_table','unequal_table2']);
    if(fam==='equal_table'||fam==='three_interval_table'){
      const intervals=fam==='equal_table'?4:3,a=ri(-3,2),h=pick([1,2]),xs=Array.from({length:intervals+1},(_,i)=>a+i*h),ys=Array.from({length:intervals+1},()=>ri(-3,12));let ans=0;
      for(let i=0;i<intervals;i++)ans+=h*(ys[i]+ys[i+1])/2;
      return tableProblemV(`trapV-eq-${intervals}-${a}-${h}-${ys.join('_')}`,'equal_table',`Use the trapezoidal rule to approximate the integral from ${xs[0]} to ${xs.at(-1)} of f(x).`,xs,ys,rationalizeV(ans),[rationalizeV(ans+h),rationalizeV(ans-h),rationalizeV(ans+2*h)],`Add the ${intervals} trapezoid areas. Each has width ${h}.`);
    }
    if(fam==='unequal_table'||fam==='unequal_table2'){
      const a=ri(-3,1),widths=fam==='unequal_table'?[pick([1,2]),pick([2,3]),pick([1,3])]:[pick([1,2]),pick([1,3]),pick([2,4])],xs=[a];for(const w of widths)xs.push(xs.at(-1)+w);const ys=Array.from({length:4},()=>ri(-2,12));let ans=0;for(let i=0;i<3;i++)ans+=widths[i]*(ys[i]+ys[i+1])/2;
      return tableProblemV(`trapV-un-${a}-${widths.join('_')}-${ys.join('_')}`,'unequal_table',`Use the trapezoidal rule to approximate the integral from ${xs[0]} to ${xs[3]} of f(x).`,xs,ys,rationalizeV(ans),[rationalizeV(ans+1),rationalizeV(ans-1),rationalizeV(ans+2)],`The x-values are not equally spaced. Compute each trapezoid separately with \\(\\frac{\\Delta x}{2}(y_L+y_R)\\).`);
    }
    if(fam==='linear_function'){
      const a=ri(-3,1),h=pick([1,2]),b=a+4*h,m=pick([1,2,3]),c=ri(-4,4),f=x=>m*x+c,ys=Array.from({length:5},(_,i)=>f(a+i*h));let ans=0;for(let i=0;i<4;i++)ans+=h*(ys[i]+ys[i+1])/2;
      return mcV(`trapV-lin-${a}-${h}-${m}-${c}`,'function_evaluation','Use four trapezoids of equal width to approximate the integral.',`\\int_${a}^{${b}}(${linearV(m,c)})\\,dx`,rationalizeV(ans),[rationalizeV(ans+h),rationalizeV(ans-h),rationalizeV(ans+2*h)],`Evaluate the function at the five endpoints and apply the trapezoidal rule.`);
    }
    const a=ri(-2,1),h=pick([1,2]),b=a+4*h,A=pick([1,2]),B=ri(-2,2),C=ri(-3,3),f=x=>A*x*x+B*x+C,ys=Array.from({length:5},(_,i)=>f(a+i*h));let ans=0;for(let i=0;i<4;i++)ans+=h*(ys[i]+ys[i+1])/2;const fn=`${powerTermV(A,2)}${B?signedV(B,'x'):''}${C?signedV(C):''}`;
    return mcV(`trapV-q-${a}-${h}-${A}-${B}-${C}`,'function_evaluation','Use four trapezoids of equal width to approximate the integral.',`\\int_${a}^{${b}}(${fn})\\,dx`,rationalizeV(ans),[rationalizeV(ans+h),rationalizeV(ans-h),rationalizeV(ans+2*h)],`Evaluate the quadratic at the five endpoints, then use the trapezoidal formula.`);
  };

  G['introduction-to-sigma-notation']=()=>{
    const fam=pick(['linear','quadratic','k2plusk','quadratic_combo','constant_combo','shifted_square']),n=pick([4,5,6,7,8]);let expr,calc,tag;
    if(fam==='linear'){const a=pick([2,3,4]),b=pick([-3,-2,-1,1,2,3]);expr=`${a}k${b>0?`+${b}`:b}`;calc=k=>a*k+b;tag=`${a}_${b}`;}
    else if(fam==='quadratic'){const a=pick([1,2,3]),b=pick([-3,-1,1,2,4]);expr=`${a===1?'':a}k^2${b>0?`+${b}`:b}`;calc=k=>a*k*k+b;tag=`${a}_${b}`;}
    else if(fam==='k2plusk'){const a=pick([-3,-2,1,2,3]);expr=`k^2${a>0?`+${a===1?'':a}k`:`${a}k`}`;calc=k=>k*k+a*k;tag=String(a);}
    else if(fam==='quadratic_combo'){const a=pick([1,2,3]),b=pick([-3,-2,1,2,3]),c=pick([-4,-2,1,3,5]);expr=`${a===1?'':a}k^2${b>0?`+${b===1?'':b}k`:`${b}k`}${c>0?`+${c}`:c}`;calc=k=>a*k*k+b*k+c;tag=`${a}_${b}_${c}`;}
    else if(fam==='constant_combo'){const a=pick([2,3,4]),b=pick([1,2,3]),c=pick([3,5,7]);expr=`${a}k^2-${b}k+${c}`;calc=k=>a*k*k-b*k+c;tag=`${a}_${b}_${c}`;}
    else {const h=pick([1,2,3]);expr=`(k+${h})^2`;calc=k=>(k+h)*(k+h);tag=String(h);}
    let ans=0;for(let k=1;k<=n;k++)ans+=calc(k);return mcV(`sigmaV-${fam}-${n}-${tag}`,'sigma_polynomial','Evaluate the sum.',`\\sum_{k=1}^{${n}}(${expr})`,String(ans),[String(ans+n),String(ans-n),String(ans+2*n)],`Evaluate the summand for \\(k=1,2,\\ldots,${n}\\) and add. The index is \\(k\\).`);
  };

  G['evaluating-definite-integrals-with-a-limit-and-summation']=()=>{
    const fam=pick(['monomial_zero','linear_shifted','shifted_square']);
    if(fam==='monomial_zero'){
      const b=pick([2,3,4,5]),p=pick([1,2,3]),c=pick([1,2,3]),xk=`\\frac{${b}k}{n}`,sample=`${c===1?'':c}\\left(${xk}\\right)^{${p}}`,dx=`\\frac{${b}}{n}`,correct=sumV(sample,dx),wrongs=[sumV(sample,''),sumV(`${c===1?'':c}\\left(\\frac{k}{n}\\right)^{${p}}`,dx),sumV(sample,'\\frac1n')],num=c*Math.pow(b,p+1)/(p+1),math=`\\int_0^{${b}}${c===1?'':c}x^{${p}}\\,dx`;
      return twoStageV(`riemV-mono-${b}-${p}-${c}`,math,correct,wrongs,num,rationalizeV(num),`Here \\(\\Delta x=${b}/n\\) and \\(x_k=${b}k/n\\).`);
    }
    if(fam==='linear_shifted'){
      const a=pick([1,2,3]),w=pick([2,3,4]),b=a+w,m=pick([1,2,3]),c=ri(-3,3),xk=`${a}+\\frac{${w}k}{n}`,fx=`${m}\\left(${xk}\\right)${c===0?'':c>0?`+${c}`:c}`,dx=`\\frac{${w}}{n}`,correct=sumV(`\\left[${fx}\\right]`,dx),wrongX=`${m}\\left(\\frac{${w}k}{n}\\right)${c===0?'':c>0?`+${c}`:c}`,wrongs=[sumV(`\\left[${fx}\\right]`,''),sumV(`\\left[${wrongX}\\right]`,dx),sumV(`\\left[${fx}\\right]`,'\\frac1n')],num=m*(b*b-a*a)/2+c*(b-a),math=`\\int_${a}^{${b}}(${linearV(m,c)})\\,dx`;
      return twoStageV(`riemV-lin-${a}-${w}-${m}-${c}`,math,correct,wrongs,num,rationalizeV(num),`Here \\(\\Delta x=${w}/n\\) and \\(x_k=${a}+${w}k/n\\).`);
    }
    const h=ri(-2,3),w=pick([2,3,4]),b=h+w,xk=`${h}+\\frac{${w}k}{n}`,sample=`\\left(\\frac{${w}k}{n}\\right)^2`,dx=`\\frac{${w}}{n}`,correct=sumV(sample,dx),wrongs=[sumV(`\\left(${xk}\\right)^2`,dx),sumV(sample,''),sumV(`\\left(\\frac{k}{n}\\right)^2`,'\\frac1n')],num=w**3/3,shift=h===0?'x':h>0?`(x-${h})`:`(x+${-h})`,math=`\\int_${h}^{${b}}${shift}^2\\,dx`;
    return twoStageV(`riemV-shift-${h}-${w}`,math,correct,wrongs,num,rationalizeV(num),`With \\(x_k=${h}+${w}k/n\\), the shifted factor becomes \\(${w}k/n\\), and \\(\\Delta x=${w}/n\\).`);
  };

  G['integrals-using-geometry']=()=>{
    const fam=pick(['triangle','signed_triangle','upper_semicircle','lower_semicircle','quarter_circle','shifted_semicircle','complement_semicircle','absolute_value','rectangle_plus_semicircle','cross_axis_line']);
    if(fam==='triangle'){const r=ri(2,7),ans=r*r/2;return mcV(`geoV-tri-${r}`,'triangle_area','Evaluate the definite integral using geometry.',`\\int_0^{${r}}(${r}-x)\\,dx`,rationalizeV(ans),[String(r*r),rationalizeV(r*r/4),String(r)],`The region is a right triangle with base ${r} and height ${r}.`);}
    if(fam==='signed_triangle'){const h=ri(2,6);return mcV(`geoV-sign-${h}`,'signed_triangle','Evaluate the definite integral using geometry.',`\\int_0^{${2*h}}(x-${h})\\,dx`,'0',[String(h*h),String(2*h*h),String(-h*h)],`The two congruent triangular regions have opposite signs and cancel.`);}
    if(fam==='upper_semicircle'){const r=ri(2,6);return mcV(`geoV-upper-${r}`,'upper_semicircle','Evaluate the definite integral using geometry.',`\\int_{-${r}}^{${r}}\\sqrt{${r*r}-x^2}\\,dx`,piV(r*r,2),[piV(r*r),piV(r,2),piV(2*r*r)],`This is the upper semicircle of radius ${r}.`);}
    if(fam==='lower_semicircle'){const r=ri(2,6);return mcV(`geoV-lower-${r}`,'lower_semicircle_signed_area','Evaluate the definite integral using geometry.',`\\int_{-${r}}^{${r}}-\\sqrt{${r*r}-x^2}\\,dx`,piV(-r*r,2),[piV(r*r,2),piV(-r*r),piV(r*r)],`The graph is a lower semicircle of radius ${r}, so its signed area is negative.`);}
    if(fam==='quarter_circle'){const r=pick([2,4,6,8]);return mcV(`geoV-quarter-${r}`,'quarter_circle_area','Evaluate the definite integral using geometry.',`\\int_0^{${r}}\\sqrt{${r*r}-x^2}\\,dx`,piV(r*r,4),[piV(r*r,2),piV(r*r),piV(r,4)],`The region is one quarter of a circle of radius ${r}.`);}
    if(fam==='shifted_semicircle'){const r=ri(2,5),h=ri(-4,5),a=h-r,b=h+r,inside=h===0?'x^2':h>0?`(x-${h})^2`:`(x+${-h})^2`;return mcV(`geoV-shift-${h}-${r}`,'shifted_semicircle','Evaluate the definite integral using geometry.',`\\int_${a}^{${b}}\\sqrt{${r*r}-${inside}}\\,dx`,piV(r*r,2),[piV(r*r),piV(r,2),piV(2*r*r)],`The horizontal shift changes location but not area; this is an upper semicircle of radius ${r}.`);}
    if(fam==='complement_semicircle'){const r=ri(2,6),rect=2*r*r,semi=piV(r*r,2);return mcV(`geoV-comp-${r}`,'complementary_semicircle','Evaluate the definite integral using geometry.',`\\int_{-${r}}^{${r}}\\left(${r}-\\sqrt{${r*r}-x^2}\\right)\\,dx`,`${rect}-${semi}`,[`${rect}+${semi}`,`${r*r}-${semi}`,semi],`Use rectangle area ${rect} minus the area of the upper semicircle.`);}
    if(fam==='absolute_value'){const r=ri(2,7);return mcV(`geoV-abs-${r}`,'absolute_value_geometry','Evaluate the definite integral using geometry.',`\\int_{-${r}}^{${r}}|x|\\,dx`,String(r*r),['0',String(2*r*r),String(r)],`The graph forms two congruent right triangles; together their area is ${r*r}.`);}
    if(fam==='rectangle_plus_semicircle'){const r=ri(2,5),c=ri(1,4),rect=2*r*c,semi=piV(r*r,2);return mcV(`geoV-rplus-${r}-${c}`,'rectangle_plus_semicircle','Evaluate the definite integral using geometry.',`\\int_{-${r}}^{${r}}\\left(${c}+\\sqrt{${r*r}-x^2}\\right)\\,dx`,`${rect}+${semi}`,[`${rect}+${piV(r*r)}`,`${rect}-${semi}`,`${r*c}+${semi}`],`Add the rectangle of area \\(${rect}\\) and the upper semicircle area \\(${semi}\\).`);}
    const h=ri(-4,4),r=ri(2,6),a=h-r,b=h+r,shift=h===0?'x':h>0?`x-${h}`:`x+${-h}`;return mcV(`geoV-cross-${h}-${r}`,'cross_axis_linear','Evaluate the definite integral using geometry.',`\\int_${a}^{${b}}(${shift})\\,dx`,'0',[String(r*r),String(-r*r),String(2*r)],`The line crosses the x-axis at ${h}; the negative and positive triangles have equal area.`);
  };

  G['fundamental-theorem-of-calculus-and-integral-rules']=(opts={})=>{
    const mode=opts.ftcMode||opts.mode||'ftc';
    if(mode==='rules'){
      const fam=pick(['reverse','split','combine','constant_multiple','solve_missing','sum_difference']);
      if(fam==='reverse'){const a=ri(-3,2),b=a+ri(2,6),v=nz(-9,9);return mcV(`rulesV-rev-${a}-${b}-${v}`,'reverse_bounds',`If \\(\\int_${a}^{${b}} f(x)\\,dx=${v}\\), find the requested integral.`,`\\int_${b}^{${a}}f(x)\\,dx`,String(-v),[String(v),'0',String(2*v)],`Reversing the limits changes the sign.`);}
      if(fam==='split'){const a=ri(-3,1),c=a+ri(1,3),b=c+ri(1,4),u=nz(-8,8),v=nz(-8,8),ans=u+v;return mcV(`rulesV-split-${a}-${c}-${b}-${u}-${v}`,'split_interval',`Given \\(\\int_${a}^{${c}}f=${u}\\) and \\(\\int_${c}^{${b}}f=${v}\\), find the requested integral.`,`\\int_${a}^{${b}}f(x)\\,dx`,String(ans),[String(u-v),String(v-u),String(u*v)],`Add the integrals over adjacent intervals: ${u}+(${v})=${ans}.`);}
      if(fam==='combine'){const F=nz(-7,7),H=nz(-7,7),a=pick([2,3]),b=pick([-2,-1,1,2]),ans=a*F+b*H,bt=b===1?'+g':b===-1?'-g':b>0?`+${b}g`:`${b}g`;return mcV(`rulesV-comb-${F}-${H}-${a}-${b}`,'combine_functions',`Given \\(\\int_0^3f=${F}\\) and \\(\\int_0^3g=${H}\\), find the requested integral.`,`\\int_0^3(${a}f${bt})\\,dx`,String(ans),[String(a*F-b*H),String(F+H),String(a+b)],`Use linearity: ${a}(${F})+${b}(${H})=${ans}.`);}
      if(fam==='constant_multiple'){const F=nz(-8,8),c=nz(-4,4),ans=c*F;return mcV(`rulesV-mult-${F}-${c}`,'constant_multiple',`Given \\(\\int_{-1}^{2}f(x)\\,dx=${F}\\), find the requested integral.`,`\\int_{-1}^{2}${c}f(x)\\,dx`,String(ans),[String(F),String(-ans),String(ans+c)],`Pull the constant outside: ${c}(${F})=${ans}.`);}
      if(fam==='solve_missing'){const a=ri(-2,1),c=a+ri(1,3),b=c+ri(1,4),whole=nz(-10,10),left=nz(-8,8),ans=whole-left;return mcV(`rulesV-miss-${a}-${c}-${b}-${whole}-${left}`,'solve_missing_interval',`Given \\(\\int_${a}^{${b}}f=${whole}\\) and \\(\\int_${a}^{${c}}f=${left}\\), find the requested integral.`,`\\int_${c}^{${b}}f(x)\\,dx`,String(ans),[String(whole+left),String(left-whole),String(left)],`Subtract the known first piece from the whole: ${whole}-(${left})=${ans}.`);}
      const F=nz(-7,7),H=nz(-7,7),a=pick([2,3,4]),b=pick([2,3]),ans=a*F-b*H;return mcV(`rulesV-sumd-${F}-${H}-${a}-${b}`,'sum_difference',`Given \\(\\int_1^4f=${F}\\) and \\(\\int_1^4g=${H}\\), find the requested integral.`,`\\int_1^4(${a}f-${b}g)\\,dx`,String(ans),[String(a*F+b*H),String(F-H),String(a-b)],`Use linearity: ${a}(${F})-${b}(${H})=${ans}.`);
    }
    const fam=pick(['upper_linear','upper_quadratic','lower_linear','both_bounds','trig_upper','exp_upper','trig_lower','two_nonlinear']);
    if(fam==='upper_linear'){const k=pick([2,3,4]),b=ri(-3,3),p=pick([1,2,3]),c=ri(1,3),u=linearV(k,b),inside=p===1?`(${u})`:`(${u})^{${p}}`,correct=`${k}\\left[${inside}+${c}\\right]`;return mcV(`ftcV-lin-${k}-${b}-${p}-${c}`,'ftc_linear_upper','Differentiate the function.',`F(x)=\\int_1^{${u}}(t^{${p}}+${c})\\,dt`,correct,[`\\left[${inside}+${c}\\right]`,`${k}\\left[x^{${p}}+${c}\\right]`,`-${correct}`],`Evaluate the integrand at the upper limit \\(${u}\\), then multiply by ${k}.`);}
    if(fam==='upper_quadratic'){const q=pick([1,2,3]),u=q===1?'x^2':`${q}x^2`,coef=2*q,correct=`${coef}x\\sin(${u})`;return mcV(`ftcV-q-${q}`,'ftc_quadratic_upper','Differentiate the function.',`F(x)=\\int_0^{${u}}\\sin t\\,dt`,correct,[`\\sin(${u})`,`${q}x\\sin(${u})`,`${coef}x\\cos(${u})`],`FTC gives \\(\\sin(${u})\\), then the chain rule contributes \\(${coef}x\\).`);}
    if(fam==='lower_linear'){const k=pick([2,3,4]),b=ri(-2,3),u=linearV(k,b),correct=`-${k}e^{${u}}`;return mcV(`ftcV-low-${k}-${b}`,'ftc_variable_lower','Differentiate the function.',`F(x)=\\int_{${u}}^{5}e^t\\,dt`,correct,[`${k}e^{${u}}`,`-e^{${u}}`,`-${k}e^x`],`A variable lower limit contributes a minus sign, and \\(( ${u})'=${k}\\).`);}
    if(fam==='both_bounds'){const q=pick([1,2,3]),d=pick([1,2]),c=ri(1,3),upper=q===1?'x^2':`${q}x^2`,lower=d===1?'x':`${d}x`,correct=`${2*q}x(${upper}+${c})-${d}(${lower}+${c})`;return mcV(`ftcV-both-${q}-${d}-${c}`,'ftc_two_variable_bounds','Differentiate the function.',`F(x)=\\int_{${lower}}^{${upper}}(t+${c})\\,dt`,correct,[`${upper}+${c}-(${lower}+${c})`,`${2*q}x(${upper}+${c})+${d}(${lower}+${c})`,`${2*q}x(${lower}+${c})-${d}(${upper}+${c})`],`Differentiate the upper-bound contribution and subtract the lower-bound contribution.`);}
    if(fam==='trig_upper'){const k=pick([1,2,3]),arg=k===1?'x':`${k}x`,correct=`${k===1?'':k}e^{\\sin(${arg})}\\cos(${arg})`;return mcV(`ftcV-trig-${k}`,'ftc_trig_upper','Differentiate the function.',`F(x)=\\int_0^{\\sin(${arg})}e^t\\,dt`,correct,[`e^{\\sin(${arg})}`,`${k===1?'':k}e^{\\cos(${arg})}\\sin(${arg})`,`-${correct}`],`Evaluate \\(e^t\\) at \\(t=\\sin(${arg})\\), then multiply by the derivative of the upper bound.`);}
    if(fam==='exp_upper'){const k=pick([1,2,3]),kx=k===1?'x':`${k}x`,coef=k===1?'':k,correct=`${coef}e^{${kx}}\\ln(1+e^{${2*k}x})`;return mcV(`ftcV-exp-${k}`,'ftc_exponential_upper','Differentiate the function.',`F(x)=\\int_2^{e^{${kx}}}\\ln(1+t^2)\\,dt`,correct,[`\\ln(1+e^{${2*k}x})`,`e^{${kx}}\\ln(1+e^{${kx}})`,`${coef}e^{${2*k}x}/(1+e^{${2*k}x})`],`Use FTC, then multiply by \\((e^{${kx}})'=${coef||1}e^{${kx}}\\).`);}
    if(fam==='trig_lower'){const k=pick([1,2,3]),arg=k===1?'x':`${k}x`,coef=k===1?'':k,correct=`${coef}\\sin(${arg})\\sqrt{1+\\cos^2(${arg})}`;return mcV(`ftcV-tlow-${k}`,'ftc_trig_lower','Differentiate the function.',`F(x)=\\int_{\\cos(${arg})}^{3}\\sqrt{1+t^2}\\,dt`,correct,[`-${correct}`,`\\sqrt{1+\\cos^2(${arg})}`,`${coef}\\cos(${arg})\\sqrt{1+\\sin^2(${arg})}`],`The lower-limit minus sign cancels the negative derivative of cosine.`);}
    const k=pick([1,2,3]),q=pick([1,2]),kx=k===1?'x':`${k}x`,lower=q===1?'x^2':`${q}x^2`,correct=`${k===1?'':k}e^{${kx}}\\cos(e^{${kx}})-${2*q}x\\cos(${lower})`;return mcV(`ftcV-nonlin-${k}-${q}`,'ftc_two_nonlinear_bounds','Differentiate the function.',`F(x)=\\int_{${lower}}^{e^{${kx}}}\\cos t\\,dt`,correct,[`\\cos(e^{${kx}})-\\cos(${lower})`,`${k===1?'':k}e^{${kx}}\\cos(e^{${kx}})+${2*q}x\\cos(${lower})`,`e^{${kx}}\\cos(${kx})-${2*q}x\\cos(x)`],`Apply FTC and the chain rule at both bounds; subtract the lower-bound contribution.`);
  };

  G['basic-integrals']=()=>{
    const fam=pick(['poly','negative_power','fractional_power','divide_terms','sin2','cos2','sec2','definite']);
    if(fam==='poly'){const p=ri(3,6),q=ri(1,p-1),a=nz(-6,6),b=nz(-6,6),c=ri(-6,6),correct=`${ratV(a,p+1)}x^{${p+1}}${signedV(b/(q+1)===Math.trunc(b/(q+1))?b/(q+1):0)}`;const t1=`${ratV(a,p+1)}x^{${p+1}}`,t2=`${ratV(b,q+1)}x^{${q+1}}`,t3=c===0?'':`${c>0?'+':'-'}${Math.abs(c)}x`,ans=`${t1}${b>0?'+':''}${t2}${t3}+C`;return mcV(`basicV-poly-${p}-${q}-${a}-${b}-${c}`,'polynomial','Find an antiderivative.',`${powerTermV(a,p)}${b?signedV(b,q===1?'x':`x^{${q}}`):''}${c?signedV(c):''}`,ans,[`${a*p}x^{${p-1}}+C`,`${t1}${b>0?'+':''}${t2}+C`,`${ratV(a,p)}x^{${p+1}}${t3}+C`],`Integrate each term with the power rule.`);}
    if(fam==='negative_power'){const a=pick([2,4,6,8]),b=pick([2,3,4,5]),ans=`-${ratV(a,2)}x^{-2}${b>0?'-':''}${ratV(b,1)}x^{-1}+C`;return mcV(`basicV-neg-${a}-${b}`,'negative_power','Find an antiderivative.',`${a}x^{-3}+${b}x^{-2}`,ans,[`${ratV(a,2)}x^{-2}+${b}x^{-1}+C`,`-${a*3}x^{-4}-${b*2}x^{-3}+C`,`-${ratV(a,2)}x^{-2}+${b}x^{-1}+C`],`Increase each exponent by 1 and divide by the new exponent.`);}
    if(fam==='fractional_power'){const a=pick([1,2,3,4]),b=pick([1,2,3,4]),ans=`${ratV(2*a,3)}x^{3/2}+${ratV(2*b,5)}x^{5/2}+C`;return mcV(`basicV-frac-${a}-${b}`,'fractional_power','Find an antiderivative.',`${a===1?'':a}x^{1/2}+${b===1?'':b}x^{3/2}`,ans,[`${ratV(a,2)}x^{3/2}+${ratV(b,2)}x^{5/2}+C`,`${ratV(2*a,3)}x^{1/2}+${ratV(2*b,5)}x^{3/2}+C`,`${ratV(3*a,2)}x^{3/2}+${ratV(5*b,2)}x^{5/2}+C`],`Apply the power rule to the fractional exponents.`);}
    if(fam==='divide_terms'){const A=pick([2,4,6]),B=nz(-5,5),C=pick([2,4,6]),ans=`${ratV(A,2)}x^2${B>0?'+':''}${B}\\ln|x|-${ratV(C,2)}x^{-2}+C`;return mcV(`basicV-div-${A}-${B}-${C}`,'divide_each_term','Rewrite by dividing each term, then integrate.',`\\int\\frac{${A}x^4${B>0?'+':''}${B}x^2+${C}}{x^3}\\,dx`,ans,[`${A}x^2${B>0?'+':''}${B}\\ln|x|+${C}x^{-2}+C`,`${ratV(A,2)}x^2${B>0?'+':''}${B}x^{-1}-${ratV(C,2)}x^{-2}+C`,`${ratV(A,2)}x^2${B>0?'-':'+'}${Math.abs(B)}\\ln|x|-${ratV(C,2)}x^{-2}+C`],`Rewrite the integrand as \\(${A}x${B>0?'+':''}${B}/x+${C}x^{-3}\\), then integrate term by term.`);}
    if(fam==='sin2'||fam==='cos2'){const a=pick([1,2,3,4]),sign=fam==='sin2'?'-':'+',correct=`${ratV(a,2)}x${sign}${ratV(a,4)}\\sin(2x)+C`,wrongSign=sign==='-'?'+':'-';return mcV(`basicV-${fam}-${a}`,'trig_identity','Find an antiderivative.',`${a===1?'':a}\\${fam==='sin2'?'sin':'cos'}^2x`,correct,[`${ratV(a,2)}x${wrongSign}${ratV(a,4)}\\sin(2x)+C`,`${a}\\sin x\\cos x+C`,`${ratV(a,2)}x+C`],`Use the power-reduction identity before integrating.`);}
    if(fam==='sec2'){const a=pick([1,2,3,4]),b=pick([1,2,3]),correct=`${a===1?'':a}\\tan x+${b===1?'':b}\\csc x+C`;return mcV(`basicV-sec-${a}-${b}`,'basic_trig','Find an antiderivative.',`${a===1?'':a}\\sec^2x-${b===1?'':b}\\csc x\\cot x`,correct,[`${a===1?'':a}\\sec x+${b===1?'':b}\\csc x+C`,`${a===1?'':a}\\tan x-${b===1?'':b}\\csc x+C`,`${a===1?'':a}\\tan x+${b===1?'':b}\\cot x+C`],`Use the standard antiderivatives of \\(\\sec^2x\\) and \\(\\csc x\\cot x\\).`);}
    const b=pick([1,2,3,4]),a=pick([1,2,3]),c=ri(-2,4),num=a*b**3/3+c*b;return mcV(`basicV-def-${a}-${b}-${c}`,'definite_polynomial','Evaluate the definite integral.',`\\int_0^{${b}}(${a}x^2${c?c>0?`+${c}`:c:''})\\,dx`,rationalizeV(num),[rationalizeV(num+b),rationalizeV(num-b),rationalizeV(num+1)],`An antiderivative is \\(${ratV(a,3)}x^3${c?c>0?`+${c}x`:`${c}x`:''}\\); evaluate at ${b} and 0.`);
  };

  G['u-substitution-integrals']=()=>{
    const fam=pick(['power_linear','trig_linear','sec_tan','csc_cot','exp_trig','linear_denominator','radical','power_composition','x5root','fourth_root']);
    if(fam==='power_linear'){const a=pick([2,3,4]),b=ri(-3,3),p=ri(2,5),u=linearV(a,b),den=a*(p+1);return mcV(`usubV-p-${a}-${b}-${p}`,'linear_inner_power','Find an antiderivative.',`(${u})^{${p}}`,`${ratV(1,den)}(${u})^{${p+1}}+C`,[`${ratV(1,p+1)}(${u})^{${p+1}}+C`,`(${u})^{${p+1}}+C`,`${ratV(1,den)}(${u})^{${p}}+C`],`Let \\(u=${u}\\), so \\(du=${a}dx\\).`);}
    if(fam==='trig_linear'){const k=pick([2,3,4,5]),which=pick(['sin','cos']),arg=`${k}x`,correct=which==='sin'?`-${ratV(1,k)}\\cos(${arg})+C`:`${ratV(1,k)}\\sin(${arg})+C`;return mcV(`usubV-trig-${which}-${k}`,'trig_linear','Find an antiderivative.',`\\${which}(${arg})`,correct,[which==='sin'?`-\\cos(${arg})+C`:`\\sin(${arg})+C`,`${ratV(1,k)}\\${which}(${arg})+C`,which==='sin'?`${ratV(1,k)}\\cos(${arg})+C`:`-${ratV(1,k)}\\sin(${arg})+C`],`Use \\(u=${arg}\\).`);}
    if(fam==='sec_tan'){const k=pick([2,3,4,5]);return mcV(`usubV-sectan-${k}`,'secant_tangent','Find an antiderivative.',`${k}\\sec(${k}x)\\tan(${k}x)`,`\\sec(${k}x)+C`,[`${k}\\sec(${k}x)+C`,`\\tan(${k}x)+C`,`\\sec^2(${k}x)+C`],`Recognize the derivative of \\(\\sec(${k}x)\\).`);}
    if(fam==='csc_cot'){const k=pick([2,3,4,5]);return mcV(`usubV-csccot-${k}`,'cosecant_cotangent','Find an antiderivative.',`-${k}\\csc(${k}x)\\cot(${k}x)`,`\\csc(${k}x)+C`,[`-\\csc(${k}x)+C`,`\\cot(${k}x)+C`,`${k}\\csc(${k}x)+C`],`Recognize the derivative of \\(\\csc(${k}x)\\).`);}
    if(fam==='exp_trig'){const k=pick([1,2,3,4]),arg=k===1?'x':`${k}x`,coef=k===1?'':k;return mcV(`usubV-exptrig-${k}`,'exponential_of_trig','Find an antiderivative.',`${coef}\\cos(${arg})e^{\\sin(${arg})}`,`e^{\\sin(${arg})}+C`,[`e^{\\cos(${arg})}+C`,`\\sin(${arg})e^{\\sin(${arg})}+C`,`${coef}e^{\\sin(${arg})}+C`],`Let \\(u=\\sin(${arg})\\).`);}
    if(fam==='linear_denominator'){const a=pick([2,3,4,5]),b=ri(-4,4),m=pick([1,2,3]),u=linearV(a,b),num=m*a;return mcV(`usubV-den-${a}-${b}-${m}`,'linear_denominator','Find an antiderivative.',`\\frac{${num}}{${u}}`,`${m}\\ln|${u}|+C`,[`${num}\\ln|${u}|+C`,`\\frac{${m}}{${u}}+C`,`\\ln|${u}|+C`],`Let \\(u=${u}\\), so \\(du=${a}dx\\).`);}
    if(fam==='radical'){const a=pick([2,3,4]),b=ri(1,5),u=linearV(a,b),coef=ratV(2,3*a);return mcV(`usubV-rad-${a}-${b}`,'radical_linear','Find an antiderivative.',`\\sqrt{${u}}`,`${coef}(${u})^{3/2}+C`,[`${ratV(2,3)}(${u})^{3/2}+C`,`${coef}\\sqrt{${u}}+C`,`2(${u})^{3/2}+C`],`Use \\(u=${u}\\).`);}
    if(fam==='power_composition'){const a=pick([2,3,4]),b=ri(1,5),p=ri(2,5),u=`${a}x^2+${b}`,der=2*a;return mcV(`usubV-comp-${a}-${b}-${p}`,'power_composition','Find an antiderivative.',`${der}x(${u})^{${p}}`,`${ratV(1,p+1)}(${u})^{${p+1}}+C`,[`(${u})^{${p+1}}+C`,`${ratV(1,der*(p+1))}(${u})^{${p+1}}+C`,`${ratV(1,p+1)}(${u})^{${p}}+C`],`Let \\(u=${u}\\), so \\(du=${der}x\\,dx\\).`);}
    if(fam==='x5root'){const c=pick([1,2,3,4]),u=`x^3+${c}`;return mcV(`usubV-x5-${c}`,'power_times_root','Find an antiderivative.',`x^5\\sqrt{${u}}`,`\\frac{2}{15}(${u})^{5/2}-\\frac{${2*c}}9(${u})^{3/2}+C`,[`\\frac27(${u})^{7/2}+C`,`\\frac23(${u})^{3/2}+C`,`\\frac{2}{15}(${u})^{5/2}+C`],`Let \\(u=${u}\\). Then \\(x^3=u-${c}\\), which produces two power terms in u.`);}
    const b=ri(1,6),u=`x^2+${b}`;return mcV(`usubV-fourth-${b}`,'fourth_root','Find an antiderivative.',`\\frac{x}{\\sqrt[4]{${u}}}`,`\\frac23(${u})^{3/4}+C`,[`\\frac12(${u})^{3/4}+C`,`\\frac43(${u})^{3/4}+C`,`(${u})^{7/8}+C`],`Use \\(u=${u}\\) and rewrite the fourth root as a fractional power.`);
  };

  G['integrals-resulting-in-natural-log-and-inverse-trigonometric-functions']=()=>{
    const fam=pick(['linear_log','poly_division','atan','asin']);
    if(fam==='linear_log'){const a=pick([2,3,4,5]),b=ri(-4,4),m=pick([1,2,3]),u=linearV(a,b),num=m*a;return mcV(`logV-lin-${a}-${b}-${m}`,'natural_log','Find an antiderivative.',`\\frac{${num}}{${u}}`,`${m}\\ln|${u}|+C`,[`${num}\\ln|${u}|+C`,`\\ln|${u}|+C`,`\\frac{${m}}{${u}}+C`],`Use the \\(u'/u\\) pattern.`);}
    if(fam==='poly_division'){const h=pick([1,2,3,4]),c=pick([1,2,3,5]),rem=h*h+c,den=`x+${h}`;return mcV(`logV-div-${h}-${c}`,'polynomial_division_log','Find an antiderivative.',`\\frac{x^2+${c}}{${den}}`,`\\frac{x^2}{2}-${h}x+${rem}\\ln|${den}|+C`,[`\\frac{x^2}{2}+${h}x+${rem}\\ln|${den}|+C`,`x-${rem}\\ln|${den}|+C`,`\\frac{x^2}{2}-${h}x+\\ln|${den}|+C`],`Divide first: \\((x^2+${c})/(${den})=x-${h}+${rem}/(${den})\\).`);}
    if(fam==='atan'){const a=ri(2,6);return mcV(`logV-atan-${a}`,'inverse_tangent_antiderivative','Find an antiderivative.',`\\frac1{x^2+${a*a}}`,`${ratV(1,a)}\\tan^{-1}\\left(\\frac{x}{${a}}\\right)+C`,[`\\tan^{-1}(x/${a})+C`,`${ratV(1,a*a)}\\tan^{-1}(x/${a})+C`,`${ratV(1,a)}\\sin^{-1}(x/${a})+C`],`Use \\(\\int dx/(x^2+a^2)=a^{-1}\\tan^{-1}(x/a)+C\\).`);}
    const a=ri(2,7);return mcV(`logV-asin-${a}`,'inverse_sine_antiderivative','Find an antiderivative.',`\\frac1{\\sqrt{${a*a}-x^2}}`,`\\sin^{-1}\\left(\\frac{x}{${a}}\\right)+C`,[`${ratV(1,a)}\\sin^{-1}(x/${a})+C`,`\\tan^{-1}(x/${a})+C`,`-\\cos^{-1}(x/${a})+C`],`Use the standard inverse-sine antiderivative.`);
  };

  G['mean-value-theorem-for-integrals']=()=>{
    const fam=pick(['average_poly','average_trig','average_radical','average_exp','find_c_linear','find_c_quad']);
    if(fam==='average_poly'){const b=pick([2,3,4,5,6]),c=ri(-2,4),avg=b*b/3+c;return mcV(`mvtV-poly-${b}-${c}`,'average_polynomial','Find the average value of the function on the given interval.',`f(x)=x^2${c?c>0?`+${c}`:c:''},\\quad [0,${b}]`,rationalizeV(avg),[rationalizeV(avg+b),rationalizeV(avg-b),String(c)],`Use \\(f_{avg}=\\frac1{b-a}\\int_a^b f(x)\\,dx\\).`);}
    if(fam==='average_trig'){const which=pick(['sin','cos']);if(which==='sin')return mcV('mvtV-trig-sin','average_trig','Find the average value of the function on the given interval.',`f(x)=\\sin x,\\quad [0,\\pi]`,`\\frac2\\pi`,[`2\\pi`,'0',`\\frac\\pi2`],`The integral is 2 and the interval length is \\(\\pi\\).`);return mcV('mvtV-trig-cos','average_trig','Find the average value of the function on the given interval.',`f(x)=\\cos x,\\quad [0,\\pi/2]`,`\\frac2\\pi`,['1','0',`\\frac\\pi2`],`The integral is 1 and the interval length is \\(\\pi/2\\).`);}
    if(fam==='average_radical'){const r=ri(2,7),b=r*r;return mcV(`mvtV-root-${r}`,'average_radical','Find the average value of the function on the given interval.',`f(x)=\\sqrt{x},\\quad [0,${b}]`,ratV(2*r,3),[ratV(r,3),ratV(4*r,3),String(r)],`Compute \\(\\frac1{${b}}\\int_0^{${b}}\\sqrt{x}dx\\).`);}
    if(fam==='average_exp'){const k=pick([1,2,3]),correct=k===1?'e-1':`\\frac{e^{${k}}-1}{${k}}`;return mcV(`mvtV-exp-${k}`,'average_exponential','Find the average value of the function on the given interval.',`f(x)=e^{${k===1?'x':`${k}x`}},\\quad [0,1]`,correct,[`e^{${k}}`,`e^{${k}}-1`,`${k}(e^{${k}}-1)`],`The interval length is 1; integrate the exponential over [0,1].`);}
    if(fam==='find_c_linear'){const a=ri(-4,1),b=a+pick([2,4,6]),m=pick([1,2,3]),d=ri(-3,3),c=(a+b)/2;return mcV(`mvtV-c-lin-${a}-${b}-${m}-${d}`,'find_c','Find the value c guaranteed by the Mean Value Theorem for Integrals.',`f(x)=${linearV(m,d)},\\quad [${a},${b}]`,rationalizeV(c),[String(a),String(b),rationalizeV((b-a)/2)],`For a linear function, the average value is attained at the midpoint of the interval.`);}
    const h=ri(-2,2),left=h-3,right=h+3,hm=h===0?'x':h>0?`x-${h}`:`x+${-h}`,shiftH=h===0?'x':h>0?`x-${h}`:`x+${-h}`,shiftC=h===0?'c':h>0?`c-${h}`:`c+${-h}`,c1=h===0?'-\\sqrt3':`${h}-\\sqrt3`,c2=h===0?'\\sqrt3':`${h}+\\sqrt3`,hid=h<0?`m${-h}`:`${h}`;return mcV(`mvtV-c-quad-${hid}`,'find_c','Find all values c in the interval guaranteed by the Mean Value Theorem for Integrals.',`f(x)=(${hm})^2,\\quad [${left},${right}]`,`${c1}, ${c2}`,[String(h),`${left},${right}`,`${h}-\\sqrt6, ${h}+\\sqrt6`],`The average value of \\(${shiftH}^2\\) on this symmetric interval is 3, so \\(${shiftC}^2=3\\).`);
  };

  G['unit-4-comprehensive']=(opts={})=>{
    const mode=opts.unit4Mode||opts.mode||'mixed',map={rect:'rectangular-approximations',trap:'trapezoidal-approximations',sigma:'introduction-to-sigma-notation',riemann:'evaluating-definite-integrals-with-a-limit-and-summation',geometry:'integrals-using-geometry',ftc:'fundamental-theorem-of-calculus-and-integral-rules',rules:'fundamental-theorem-of-calculus-and-integral-rules',basic:'basic-integrals',usub:'u-substitution-integrals',log:'integrals-resulting-in-natural-log-and-inverse-trigonometric-functions',mvt:'mean-value-theorem-for-integrals'};
    let chosen=mode;if(chosen==='mixed')chosen=pick(Object.keys(map));const child=Object.assign({},opts);if(chosen==='ftc')child.ftcMode='ftc';if(chosen==='rules')child.ftcMode='rules';return G[map[chosen]||map.basic](child);
  };
})();


// v10.6.3.A — Unit 3 variety hardening. Parameterize the reviewed families so repeated practice produces genuinely different problems.
(function v1063AUnit3Variety(){
  const idn=n=>n<0?`m${-n}`:`p${n}`;
  const plus=n=>n===0?'':n>0?`+${n}`:`-${-n}`;
  const interval=(a,b)=>`(${a},${b})`;
  const outside=(a,b)=>`(-\\infty,${a})\\cup(${b},\\infty)`;
  const shift=v=>v===0?'x':v>0?`x-${v}`:`x+${-v}`;
  const choiceClean=(id,variant,prompt,math,correct,wrongs,explanation)=>mc(id,variant,prompt,math,correct,wrongs,explanation);

  G['absolute-and-local-extrema-and-the-extreme-value-theorem']=()=>{
    const fam=pick(['up_quad','down_quad','cubic','abs','reciprocal','trig']);
    if(fam==='up_quad'){
      const h=ri(-4,4),A=ri(1,3),k=ri(-4,5),L=ri(2,4),Rr=ri(2,4),a=h-L,b=h+Rr,sh=shift(h),left=A*L*L+k,right=A*Rr*Rr+k;
      return choiceClean(`extV-up-${idn(h)}-${A}-${idn(k)}-${L}-${Rr}`,'absolute_min_quadratic','Find the absolute minimum of f on the given interval.',`f(x)=${A===1?'':A}(${sh})^2${plus(k)},\\quad [${a},${b}]`,String(k),[String(Math.min(left,right)),String(Math.max(left,right)),String(k+A)],`The vertex x=${h} lies on the given interval, so compare the vertex and endpoint values. The minimum value is ${k}.`);
    }
    if(fam==='down_quad'){
      const h=ri(-4,4),A=ri(1,3),k=ri(4,12),L=ri(2,4),Rr=ri(2,4),a=h-L,b=h+Rr,sh=shift(h),left=k-A*L*L,right=k-A*Rr*Rr;
      return choiceClean(`extV-down-${idn(h)}-${A}-${k}-${L}-${Rr}`,'absolute_max_quadratic','Find the absolute maximum of f on the given interval.',`f(x)=${k}-${A===1?'':A}(${sh})^2,\\quad [${a},${b}]`,String(k),[String(Math.max(left,right)),String(Math.min(left,right)),String(k-A)],`The vertex x=${h} lies on the given interval and has function value ${k}, the absolute maximum.`);
    }
    if(fam==='cubic'){
      const a=ri(1,3),k=ri(-5,5),amax=2*a*a*a+k,amin=-2*a*a*a+k;
      return choiceClean(`extV-cubic-${a}-${idn(k)}`,'closed_interval_cubic','Find the absolute maximum of f on the given interval.',`f(x)=x^3-${3*a*a}x${plus(k)},\\quad [${-2*a},${2*a}]`,String(amax),[String(amin),String(k),String(amax+a)],`The critical points are x=±${a}. Check them and both endpoints; the largest function value is ${amax}.`);
    }
    if(fam==='abs'){
      const h=ri(-4,4),A=ri(1,4),k=ri(-3,5),L=ri(2,5),Rr=ri(2,5),a=h-L,b=h+Rr,sh=shift(h);
      return choiceClean(`extV-abs-${idn(h)}-${A}-${idn(k)}-${L}-${Rr}`,'absolute_value_minimum','Find the absolute minimum of f on the given interval.',`f(x)=${A===1?'':A}|${sh}|${plus(k)},\\quad [${a},${b}]`,String(k),[String(k+A),String(k+A*Math.min(L,Rr)),String(k-1)],`The vertex occurs at x=${h}, which is on the interval, so the minimum value is ${k}.`);
    }
    if(fam==='reciprocal'){
      const b=pick([2,3,4,5,6]),a=ri(1,b-1),q=ri(1,4),k=ri(-3,3),c=q*b,ans=q+k;
      return choiceClean(`extV-rec-${a}-${b}-${q}-${idn(k)}`,'reciprocal_interval','Find the absolute minimum of f on the given interval.',`f(x)=\\frac{${c}}{x}${plus(k)},\\quad [${a},${b}]`,String(ans),[String(c/a+k),String(q),String(ans+1)],`Because ${c}/x is decreasing for positive x, the minimum occurs at the right endpoint x=${b}, giving ${ans}.`);
    }
    const A=ri(1,4),k=ri(-4,4),ans=A+k;
    return choiceClean(`extV-trig-${A}-${idn(k)}`,'trig_extrema','Find the absolute maximum of f on the given interval.',`f(x)=${A===1?'':A}\\sin x${plus(k)},\\quad [0,2\\pi]`,String(ans),[String(k),String(k-A),String(ans+1)],`The maximum of sin x is 1, so the maximum function value is ${A}+(${k})=${ans}.`);
  };

  G['increasing-decreasing-intervals-concavity-and-extrema']=()=>{
    const fam=pick(['inc_poly','dec_poly','concavity_cubic','concavity_quartic','local_extrema','trig_inc','exp_concavity']);
    if(fam==='inc_poly'){
      const r1=ri(-5,0),r2=ri(1,6),s1=shift(r1),s2=shift(r2);
      return choiceClean(`curveV-inc-${idn(r1)}-${r2}`,'increasing_intervals','On which intervals is f increasing?',`f'(x)=(${s1})(${s2})`,outside(r1,r2),[interval(r1,r2),`(-\\infty,${r2})`,`(${r1},\\infty)`],`The derivative is positive outside its two zeros ${r1} and ${r2}.`);
    }
    if(fam==='dec_poly'){
      const r1=ri(-5,0),r2=ri(1,6),s1=shift(r1),s2=shift(r2);
      return choiceClean(`curveV-dec-${idn(r1)}-${r2}`,'decreasing_intervals','On which intervals is f decreasing?',`f'(x)=-(${s1})(${s2})`,outside(r1,r2),[interval(r1,r2),`(-\\infty,${r2})`,`(${r1},\\infty)`],`The leading negative reverses the usual quadratic sign pattern, so f' is negative outside ${r1} and ${r2}.`);
    }
    if(fam==='concavity_cubic'){
      const h=ri(-4,5),m=pick([2,4,6,8]),sh=shift(h);
      return choiceClean(`curveV-conc3-${idn(h)}-${m}`,'concavity','Where is f concave up?',`f''(x)=${m}(${sh})`,`(${h},\\infty)`,[`(-\\infty,${h})`,`(${-h},\\infty)`,`(-\\infty,${-h})`],`Concave up means f''(x)>0, which occurs for x>${h}.`);
    }
    if(fam==='concavity_quartic'){
      const h=ri(-3,3),r=ri(1,4),left=h-r,right=h+r,sh=shift(h);
      return choiceClean(`curveV-conc4-${idn(h)}-${r}`,'concavity','Where is f concave down?',`f''(x)=12[(${sh})^2-${r*r}]`,interval(left,right),[outside(left,right),`(${right},\\infty)`,`(-\\infty,${right})`],`Concave down where (${sh})^2<${r*r}, namely between ${left} and ${right}.`);
    }
    if(fam==='local_extrema'){
      const r1=ri(-5,0),h=ri(1,6),s1=shift(r1),s2=shift(h);
      return choiceClean(`curveV-ext-${idn(r1)}-${h}`,'local_extrema_from_derivative',`What happens at x=${h}?`,`f'(x)=(${s1})(${s2})`,`f has a local minimum at x=${h}.`,[`f has a local maximum at x=${h}.`,`f has an inflection point at x=${h}.`,`f is decreasing on both sides of x=${h}.`],`At the larger zero x=${h}, the derivative changes from negative to positive.`);
    }
    if(fam==='trig_inc'){
      const A=ri(1,5),k=ri(-3,3);
      return choiceClean(`curveV-trig-${A}-${idn(k)}`,'trig_increasing','On [0,2π], where is f increasing?',`f(x)=${A===1?'':A}\\sin x${plus(k)}`,`(0,\\frac{\\pi}{2})\\cup(\\frac{3\\pi}{2},2\\pi)`,[`(\\frac{\\pi}{2},\\frac{3\\pi}{2})`,`(0,\\pi)`,`(\\pi,2\\pi)`],`The positive vertical scale does not change the sign of f'(x); f increases where cos x is positive.`);
    }
    const k=ri(1,5),A=ri(1,4);
    return choiceClean(`curveV-exp-${A}-${k}`,'exponential_concavity','Which statement is true for all real x?',`f(x)=${A===1?'':A}e^{-${k}x}`,'f is decreasing and concave up.',['f is increasing and concave up.','f is decreasing and concave down.','f is increasing and concave down.'],`Both the positive scale and k preserve f'(x)<0 and f''(x)>0 for every real x.`);
  };

  G['graphing-functions']=()=>{
    const fam=pick(['derivative_sign','second_derivative','both_signs','trig_behavior','rational_behavior']);
    if(fam==='derivative_sign'){
      const r1=ri(-6,0),r2=ri(1,7),s1=shift(r1),s2=shift(r2);
      return choiceClean(`graphV-fp-${idn(r1)}-${r2}`,'graph_from_derivative_sign','On which intervals is f increasing?',`f'(x)=(${s1})(${s2})`,outside(r1,r2),[interval(r1,r2),`(-\\infty,${r2})`,`(${r1},\\infty)`],`A sign chart for f' is positive outside the zeros ${r1} and ${r2}.`);
    }
    if(fam==='second_derivative'){
      const r1=ri(-5,0),r2=ri(1,6),s1=shift(r1),s2=shift(r2);
      return choiceClean(`graphV-fpp-${idn(r1)}-${r2}`,'graph_from_second_derivative','On which intervals is f concave up?',`f''(x)=(${s1})(${s2})`,outside(r1,r2),[interval(r1,r2),`(-\\infty,${r2})`,`(${r1},\\infty)`],`A sign chart for f'' is positive outside ${r1} and ${r2}.`);
    }
    if(fam==='both_signs'){
      const fp=pick([-1,1]),fpp=pick([-1,1]),correct=`${fp>0?'Increasing':'Decreasing'} and ${fpp>0?'concave up':'concave down'}`;
      return choiceClean(`graphV-point-${fp>0?'p':'m'}-${fpp>0?'p':'m'}`,'point_behavior_from_derivatives','Describe the graph at x=a.',`f'(a)${fp>0?'>':'<'}0,\\quad f''(a)${fpp>0?'>':'<'}0`,correct,['Increasing and concave up','Increasing and concave down','Decreasing and concave up','Decreasing and concave down'].filter(x=>x!==correct),`The sign of f' controls increasing/decreasing; the sign of f'' controls concavity.`);
    }
    if(fam==='trig_behavior'){
      const A=ri(1,5),k=ri(-4,4);
      return choiceClean(`graphV-trig-${A}-${idn(k)}`,'graph_trig_features','Which statement is true on (0,π)?',`f(x)=${A===1?'':A}\\sin x${plus(k)}`,'f is concave down on the entire interval.',['f is concave up on the entire interval.','f is increasing on the entire interval.','f is decreasing on the entire interval.'],`Since f''(x)=-${A===1?'':A}sin x<0 on (0,π), f is concave down.`);
    }
    const h=ri(-4,4),A=ri(1,5),k=ri(-3,3),sh=shift(h);
    return choiceClean(`graphV-rat-${idn(h)}-${A}-${idn(k)}`,'graph_rational_features','On which intervals is f decreasing?',`f(x)=\\frac{${A}}{${sh}}${plus(k)}`,`(-\\infty,${h})\\cup(${h},\\infty)`,[`(-\\infty,${h})`,`(${h},\\infty)`,`(${h-1},${h+1})`],`Its derivative is -${A}/(${sh})^2<0 wherever the function is defined.`);
  };

  G['horizontal-and-vertical-tangent-lines']=()=>{
    const fam=pick(['cubic_horizontal','quartic_horizontal','sine_horizontal','cosine_horizontal','cube_root_vertical','fifth_root_vertical']);
    if(fam==='cubic_horizontal'){
      const h=ri(-3,3),r=ri(1,4),sh=shift(h),a=h-r,b=h+r;
      return choiceClean(`hvV-cubic-${idn(h)}-${r}`,'horizontal_cubic','Find all x-values where the graph has a horizontal tangent.',`f(x)=(${sh})^3-${3*r*r}(${sh})`,`${a}, ${b}`,[String(h),`${a}`,`${b}`],`f'(x)=3(${sh})^2-${3*r*r}; set it equal to zero to get x=${a},${b}.`);
    }
    if(fam==='quartic_horizontal'){
      const h=ri(-3,3),r=ri(1,3),sh=shift(h),a=h-r,b=h+r;
      return choiceClean(`hvV-q4-${idn(h)}-${r}`,'horizontal_quartic','Find all x-values where the graph has a horizontal tangent.',`f(x)=(${sh})^4-${2*r*r}(${sh})^2`,`${a}, ${h}, ${b}`,[`${a}, ${b}`,`${h}, ${b}`,`${a}, ${h}`],`Factor f'(x)=4(${sh})[(${sh})^2-${r*r}].`);
    }
    if(fam==='sine_horizontal'){
      const A=ri(1,5),k=ri(-3,3);
      return choiceClean(`hvV-sin-${A}-${idn(k)}`,'horizontal_trig','On [0,2π], where does the graph have horizontal tangents?',`f(x)=${A===1?'':A}\\sin x${plus(k)}`,`\\frac{\\pi}{2}, \\frac{3\\pi}{2}`,[`0, \\pi, 2\\pi`,`\\pi`,`0, 2\\pi`],`Horizontal tangents occur where cos x=0.`);
    }
    if(fam==='cosine_horizontal'){
      const A=ri(1,5),k=ri(-3,3);
      return choiceClean(`hvV-cos-${A}-${idn(k)}`,'horizontal_trig','On [0,2π], where does the graph have horizontal tangents?',`f(x)=${A===1?'':A}\\cos x${plus(k)}`,`0, \\pi, 2\\pi`,[`\\frac{\\pi}{2}, \\frac{3\\pi}{2}`,`\\pi`,`0,2\\pi`],`Horizontal tangents occur where sin x=0.`);
    }
    if(fam==='cube_root_vertical'){
      const h=ri(-6,6),sh=shift(h);return choiceClean(`hvV-cuberoot-${idn(h)}`,'vertical_cube_root','At what x-value does the graph have a vertical tangent?',`f(x)=\\sqrt[3]{${sh}}`,String(h),[String(-h),String(h+1),String(h-1)],`The derivative is unbounded where ${sh}=0, at x=${h}.`);
    }
    const h=ri(-6,6),sh=shift(h);return choiceClean(`hvV-fifth-${idn(h)}`,'vertical_fifth_root','At what x-value does the graph have a vertical tangent?',`f(x)=\\sqrt[5]{${sh}}`,String(h),[String(-h),String(h+1),String(h-1)],`The derivative is unbounded where ${sh}=0, at x=${h}.`);
  };

  G['rolle-s-theorem-and-the-mean-value-theorem']=(opts={})=>{
    const mode=opts.mvtMode||opts.mode||'both',pool=mode==='theorem'?['rolle','hypothesis']:mode==='find-c'?['find_c','find_c_recip']:['rolle','hypothesis','find_c','find_c_recip'],fam=pick(pool);
    if(fam==='rolle'){
      const h=ri(-5,5),r=ri(1,5),sh=shift(h);return choiceClean(`rolleV-${idn(h)}-${r}`,'rolle_application',`Rolle's Theorem applies. Find the value of c.`,`f(x)=(${sh})^2,\\quad [${h-r},${h+r}]`,`c=${h}`,[`c=${h-r}`,`c=${h+r}`,`c=${h+1}`],`The endpoint values agree and f'(x)=2(${sh}), so f'(c)=0 at c=${h}.`);
    }
    if(fam==='hypothesis'){
      const a=ri(-4,4),left=a-ri(1,3),right=a+ri(1,3),sh=shift(a);return choiceClean(`mvtV-hyp-${idn(a)}-${left}-${right}`,'mvt_hypotheses','Can the Mean Value Theorem be applied on the interval?',`f(x)=\\frac1{${sh}},\\quad [${left},${right}]`,'No, because f is not continuous on the entire interval.',['Yes, because f is differentiable at the endpoints.','Yes, because the endpoint values are finite.','No, because the average rate of change is zero.'],`There is a vertical asymptote at x=${a}, inside the interval, so the continuity hypothesis fails.`);
    }
    if(fam==='find_c'){
      const a=ri(-5,0),b=a+ri(2,7),A=ri(1,4),B=ri(-5,5),c=texRat(a+b,2);return choiceClean(`mvtV-find-${A}-${idn(B)}-${idn(a)}-${b}`,'mvt_find_c','Find every c in the open interval where the derivative equals the average rate of change.',`f(x)=${A}x^2${B?signed(B,'x'):''},\\quad [${a},${b}]`,`c=${c}`,[`c=${a}`,`c=${b}`,`c=${texRat(a+b+2,2)}`],`Set f'(c) equal to the average rate of change and solve; this gives c=${c}.`);
    }
    const p=ri(1,3),q=ri(p+1,5),a=p*p,b=q*q,c=p*q;
    return choiceClean(`mvtV-find-rec-${p}-${q}`,'mvt_find_c_reciprocal','Find c where the derivative equals the average rate of change.',`f(x)=\\frac1x,\\quad [${a},${b}]`,`c=${c}`,[`c=${a}`,`c=${b}`,`c=${c+1}`],`The average rate of change is -1/${a*b}. Solve -1/c^2=-1/${a*b} in the open interval, giving c=${c}.`);
  };
})();


// Unit 5 cumulative working rebuild — broader variety, parameterization, and answer checking.
(function unit5CumulativeRebuild(){
  const idn=n=>n<0?`m${-n}`:`p${n}`;
  const plus=n=>n===0?'':n>0?`+${n}`:`-${-n}`;
  const vterm=(c,body)=>c===0?'':c===1?body:c===-1?`-${body}`:`${c}${body}`;
  const fmt3=x=>Number(x).toFixed(3);
  const numeric=(id,variant,prompt,math,value,explanation,tolerance=0.0006)=>({
    id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${math}\\)</div>`:''}</div>`,
    answerType:'numeric',numericAnswer:Number(value),numericTolerance:tolerance,answerTex:fmt3(value),explanation
  });
  const simpson=(f,a,b,n=800)=>{if(n%2)n++;const h=(b-a)/n;let total=f(a)+f(b);for(let i=1;i<n;i++)total+=(i%2?4:2)*f(a+i*h);return total*h/3;};
  const texLin=(a,b,v='x')=>`${vterm(a,v)}${plus(b)}`;
  const texPow=(a,p,v='x')=>vterm(a,p===1?v:`${v}^{${p}}`);

  G['basic-first-order-differential-equations']=()=>{
    const fam=pick(['slope','general_poly','ivp_poly','ivp_cos','ivp_sin','ivp_exp','ivp_sec','ivp_comp','ivp_log','accumulation','calculator_ivp']);
    if(fam==='slope'){
      const a=nz(-5,5),b=nz(-4,4),c=ri(-6,6),x0=ri(-3,3),y0=ri(-4,4),m=a*x0+b*y0+c;
      return mc(`de5-slope-${a}-${b}-${c}-${x0}-${y0}`,'slope_at_point','Find the slope of the solution curve at the given point.',`\\frac{dy}{dx}=${texLin(a,c)}${b>0?`+${vterm(b,'y')}`:vterm(b,'y')},\\quad (${x0},${y0})`,String(m),[String(m+1),String(m-1),String(-m)],`Substitute x=${x0} and y=${y0} into the differential equation. The slope is ${m}.`);
    }
    if(fam==='general_poly'){
      const n=ri(1,4),k=nz(-4,4),a=(n+1)*k,b=nz(-6,6),ans=`y=${texPow(k,n+1)}${plus(b)}x+C`,wrong1=`y=${texPow(a,n+1)}${plus(b)}x+C`,wrong2=`y=${texPow(k,n)}${plus(b)}+C`;
      return mc(`de5-gen-${n}-${k}-${b}`,'general_antiderivative','Find the general solution.',`\\frac{dy}{dx}=${texPow(a,n)}${plus(b)}`,ans,[wrong1,wrong2,`y=${texPow(k,n+1)}+C`],`Integrate each term and include the constant of integration.`);
    }
    if(fam==='ivp_poly'){
      const n=ri(1,3),k=nz(-4,4),a=(n+1)*k,b=ri(-5,5),y0=ri(-6,8),ans=`y=${texPow(k,n+1)}${b?plus(b)+'x':''}${plus(y0)}`;
      return mc(`de5-ivp-poly-${n}-${k}-${b}-${y0}`,'initial_value_polynomial','Solve the initial-value problem.',`\\frac{dy}{dx}=${texPow(a,n)}${plus(b)},\\quad y(0)=${y0}`,ans,[`${ans}+C`,`y=${texPow(a,n+1)}${b?plus(b)+'x':''}${plus(y0)}`,`y=${texPow(k,n+1)}${b?plus(b)+'x':''}`],`Integrate first, then use y(0)=${y0} to determine the constant.`);
    }
    if(fam==='ivp_cos'){
      const A=nz(-4,4),k=ri(1,4),c=ri(-5,7),coef=A*k,arg=k===1?'x':`${k}x`,ans=`y=${vterm(A,`\\sin(${arg})`)}${plus(c)}`;
      return mc(`de5-ivp-cos-${A}-${k}-${c}`,'initial_value_trig','Solve the initial-value problem.',`\\frac{dy}{dx}=${vterm(coef,`\\cos(${arg})`)},\\quad y(0)=${c}`,ans,[`y=${vterm(A,`\\cos(${arg})`)}${plus(c)}`,`y=${vterm(coef,`\\sin(${arg})`)}${plus(c)}`,`y=${vterm(A,`\\sin(${arg})`)}`],`Integrate the cosine term and apply the initial condition.`);
    }
    if(fam==='ivp_sin'){
      const A=nz(-4,4),k=ri(1,4),C=ri(-5,5),y0=A+C,coef=-A*k,arg=k===1?'x':`${k}x`,ans=`y=${vterm(A,`\\cos(${arg})`)}${plus(C)}`;
      return mc(`de5-ivp-sin-${A}-${k}-${C}`,'initial_value_trig','Solve the initial-value problem.',`\\frac{dy}{dx}=${vterm(coef,`\\sin(${arg})`)},\\quad y(0)=${y0}`,ans,[`y=${vterm(-A,`\\cos(${arg})`)}${plus(C)}`,`y=${vterm(A,`\\sin(${arg})`)}${plus(C)}`,`y=${vterm(A,`\\cos(${arg})`)}`],`An antiderivative is ${vterm(A,`cos(${arg})`)}+C. Use the given value at x=0.`);
    }
    if(fam==='ivp_exp'){
      const A=nz(-4,4),k=ri(1,3),C=ri(-5,6),y0=A+C,coef=A*k,arg=k===1?'x':`${k}x`,ans=`y=${vterm(A,`e^{${arg}}`)}${plus(C)}`;
      return mc(`de5-ivp-exp-${A}-${k}-${C}`,'initial_value_exponential','Solve the initial-value problem.',`\\frac{dy}{dx}=${vterm(coef,`e^{${arg}}`)},\\quad y(0)=${y0}`,ans,[`y=${vterm(coef,`e^{${arg}}`)}${plus(C)}`,`y=${vterm(A,`e^x`)}${plus(C)}`,`y=${vterm(A,`e^{${arg}}`)}`],`Integrate the exponential term, then use y(0)=${y0}.`);
    }
    if(fam==='ivp_sec'){
      const A=nz(-4,4),k=ri(1,3),C=ri(-5,6),coef=A*k,arg=k===1?'x':`${k}x`,ans=`y=${vterm(A,`\\tan(${arg})`)}${plus(C)}`;
      return mc(`de5-ivp-sec-${A}-${k}-${C}`,'initial_value_secant','Solve the initial-value problem.',`\\frac{dy}{dx}=${vterm(coef,`\\sec^2(${arg})`)},\\quad y(0)=${C}`,ans,[`y=${vterm(A,`\\sec(${arg})`)}${plus(C)}`,`y=${vterm(coef,`\\tan(${arg})`)}${plus(C)}`,`y=${vterm(A,`\\tan(${arg})`)}`],`Use the antiderivative of secant squared and then apply the initial condition.`);
    }
    if(fam==='ivp_comp'){
      const A=ri(1,4),k=ri(1,4),C=ri(-5,6),coef=2*A*k,arg=k===1?'x^2':`${k}x^2`,ans=`y=${vterm(A,`\\sin(${arg})`)}${plus(C)}`;
      return mc(`de5-ivp-comp-${A}-${k}-${C}`,'initial_value_composition','Solve the initial-value problem.',`\\frac{dy}{dx}=${coef}x\\cos(${arg}),\\quad y(0)=${C}`,ans,[`y=${vterm(A,`\\cos(${arg})`)}${plus(C)}`,`y=${coef}\\sin(${arg})${plus(C)}`,`y=${vterm(A,`\\sin(${arg})`)}`],`Let u=${arg}; the derivative has the needed inner derivative. Then use the initial condition.`);
    }
    if(fam==='ivp_log'){
      const A=nz(-5,5),C=ri(-4,7),ans=`y=${vterm(A,'\\ln x')}${plus(C)},\\quad x>0`;
      return mc(`de5-ivp-log-${A}-${C}`,'initial_value_log','Solve the initial-value problem and give the interval containing x=1 on which the solution is valid.',`\\frac{dy}{dx}=\\frac{${A}}{x},\\quad y(1)=${C}`,ans,[`y=${vterm(A,'\\ln|x|')}${plus(C)},\\quad x\\ne0`,`y=${vterm(A,'\\ln x')},\\quad x>0`,`y=\\frac{${A}}x${plus(C)},\\quad x>0`],`Integrate to ${A}ln|x|+C. The initial point x=1 lies on the interval x>0.`);
    }
    if(fam==='accumulation'){
      const A=2*nz(-4,4),B=ri(-5,6),f0=ri(-10,12),T=ri(1,4),ans=f0+A*T*T/2+B*T;
      return mc(`de5-acc-${A}-${B}-${f0}-${T}`,'initial_value_accumulation',`Given the derivative and one function value, find f(${T}).`,`f'(x)=${texLin(A,B)},\\quad f(0)=${f0}`,String(ans),[String(ans+T),String(ans-T),String(f0+A*T+B)],`Use f(${T})=f(0)+\\int_0^${T}f'(x)\\,dx.`);
    }
    const A=ri(1,4),B=nz(-3,3),f0=ri(-4,8),T=pick([1,1.5,2]),f=x=>A*Math.exp(-x*x)+B*Math.sin(x*x),val=f0+simpson(f,0,T,1000);
    return numeric(`de5-calc-${A}-${B}-${f0}-${String(T).replace('.','_')}`,'calculator_initial_value',`Calculator Active: If f(0)=${f0}, find f(${T}). Round to three decimals.`,`f'(x)=${A}e^{-x^2}${B>0?'+':''}${B}\\sin(x^2)`,val,`Use f(${T})=f(0)+\\int_0^${T}f'(x)\\,dx and evaluate the definite integral numerically.`);
  };

  G['motion-problems']=()=>{
    const fam=pick(['velocity_linear_accel','velocity_quad_accel','speed_trig_accel','position_from_velocity','displacement','distance_linear','distance_trig','direction','rest','speeding_up','slowing_down','exp_velocity','trig_displacement']);
    if(fam==='velocity_linear_accel'){
      const A=2*nz(-3,3),B=ri(-5,5),v0=ri(-8,8),T=ri(1,4),ans=v0+A*T*T/2+B*T;
      return mc(`mot5-vla-${A}-${B}-${v0}-${T}`,'velocity_from_acceleration',`Given acceleration and an initial velocity, find v(${T}).`,`a(t)=${texLin(A,B,'t')},\\quad v(0)=${v0}`,String(ans),[String(ans+T),String(ans-T),String(v0+A*T+B)],`Use v(${T})=v(0)+\\int_0^${T}a(t)\\,dt.`);
    }
    if(fam==='velocity_quad_accel'){
      const K=nz(-3,3),B=ri(-4,4),v0=ri(-7,7),T=ri(1,3),ans=v0+K*T**3+B*T;
      return mc(`mot5-vqa-${K}-${B}-${v0}-${T}`,'velocity_from_acceleration',`Given acceleration and an initial velocity, find v(${T}).`,`a(t)=${3*K}t^2${plus(B)},\\quad v(0)=${v0}`,String(ans),[String(ans+T),String(ans-T),String(v0+3*K*T*T+B*T)],`Integrate acceleration from 0 to ${T} and add the initial velocity.`);
    }
    if(fam==='speed_trig_accel'){
      const A=nz(-6,6),v0=ri(-6,6),v=v0+A,ans=Math.abs(v);
      return mc(`mot5-sta-${A}-${v0}`,'speed_from_acceleration','Find the speed at the indicated time.',`a(t)=${vterm(A,'\\cos t')},\\quad v(0)=${v0},\\quad t=\\frac{\\pi}{2}`,String(ans),[String(v),String(Math.abs(v0)),String(ans+1)],`v(π/2)=v(0)+\\int_0^{π/2}${A}cos t\\,dt=${v}. Speed is |v|=${ans}.`);
    }
    if(fam==='position_from_velocity'){
      const K=nz(-3,3),B=ri(-5,5),s0=ri(-8,8),T=ri(1,3),ans=s0+K*T**3+B*T;
      return mc(`mot5-pos-${K}-${B}-${s0}-${T}`,'position_from_velocity',`Given velocity and an initial position, find s(${T}).`,`v(t)=${3*K}t^2${plus(B)},\\quad s(0)=${s0}`,String(ans),[String(ans+T),String(ans-T),String(s0+3*K*T*T+B*T)],`Use s(${T})=s(0)+\\int_0^${T}v(t)\\,dt.`);
    }
    if(fam==='displacement'){
      const A=2*nz(-4,4),B=ri(-6,6),T=ri(2,5),ans=A*T*T/2+B*T;
      return mc(`mot5-disp-${A}-${B}-${T}`,'displacement','Find the displacement on the given interval.',`v(t)=${texLin(A,B,'t')},\\quad 0\\le t\\le${T}`,String(ans),[String(Math.abs(ans)),String(ans+T),String(ans-T)],`Displacement is the signed integral \\int_0^${T}v(t)dt.`);
    }
    if(fam==='distance_linear'){
      const A=2*pick([1,2,3,4]),r=ri(1,4),T=r+ri(1,4),ans=A*(r*r+(T-r)**2)/2;
      return mc(`mot5-distlin-${A}-${r}-${T}`,'total_distance','Find the total distance traveled on the interval.',`v(t)=${A}(t-${r}),\\quad 0\\le t\\le${T}`,String(ans),[String(A*T*T/2-A*r*T),String(ans+A),String(ans-A)],`Velocity changes sign at t=${r}. Split there and add the absolute values of the two signed displacements.`);
    }
    if(fam==='distance_trig'){
      const A=ri(1,6),ans=4*A;
      return mc(`mot5-disttrig-${A}`,'total_distance_trig','Find the total distance traveled.',`v(t)=${vterm(A,'\\sin t')},\\quad 0\\le t\\le2\\pi`,String(ans),[String(2*A),String(A),String(2*A*Math.PI)],`The velocity changes sign at π. Add the absolute area on [0,π] and [π,2π].`);
    }
    if(fam==='direction'){
      const r1=ri(-2,2),r2=r1+ri(2,5),A=pick([-3,-2,-1,1,2,3]),f1=r1===0?'t':r1>0?`(t-${r1})`:`(t+${-r1})`,f2=r2===0?'t':r2>0?`(t-${r2})`:`(t+${-r2})`,inside=`(${r1},${r2})`,outside=`(-\\infty,${r1})\\cup(${r2},\\infty)`,correct=A>0?outside:inside;
      return mc(`mot5-dir-${idn(A)}-${idn(r1)}-${idn(r2)}`,'direction_from_velocity','When is the particle moving to the right?',`v(t)=${A===1?'':A===-1?'-':A}${f1}${f2}`,correct,[A>0?inside:outside,`(-\\infty,${r2})`,`(${r1},\\infty)`],`Moving right means v(t)>0. Use a sign chart for the factored velocity.`);
    }
    if(fam==='rest'){
      const r1=ri(0,3),r2=r1+ri(2,5),A=nz(-4,4),f1=r1===0?'t':`(t-${r1})`,f2=`(t-${r2})`;
      return mc(`mot5-rest-${idn(A)}-${r1}-${r2}`,'rest_times','At what times is the particle at rest?',`v(t)=${A===1?'':A===-1?'-':A}${f1}${f2}`,`${r1}, ${r2}`,[String(r1),String(r2),String(r1+r2)],`A particle is at rest when v(t)=0, so use the zeros of the velocity function.`);
    }
    if(fam==='speeding_up'||fam==='slowing_down'){
      const h=ri(1,5),T=h+ri(2,5),A=nz(-5,5),correct=fam==='speeding_up'?`(${h},${T}]`:`[0,${h})`,other=fam==='speeding_up'?`[0,${h})`:`(${h},${T}]`;
      return mc(`mot5-${fam}-${A}-${h}-${T}`,fam==='speeding_up'?'speed_increasing':'speed_decreasing',`On [0,${T}], when is the particle ${fam==='speeding_up'?'speeding up':'slowing down'}?`,`v(t)=${A}(t-${h}),\\quad a(t)=${A}`,correct,[other,`[0,${T}]`,`(${h-1},${h+1})`],`${fam==='speeding_up'?'Speed increases':'Speed decreases'} where velocity and acceleration have ${fam==='speeding_up'?'the same':'opposite'} signs.`);
    }
    if(fam==='exp_velocity'){
      const A=nz(-6,6),k=ri(1,4),ans=A*k;
      return mc(`mot5-exp-${A}-${k}`,'acceleration_from_exponential_velocity','Find the acceleration at t=0.',`v(t)=${vterm(A,`e^{${k}t}`)}`,String(ans),[String(A),String(k),String(-ans)],`Differentiate velocity: a(t)=${A*k}e^{${k}t}, then evaluate at t=0.`);
    }
    const A=nz(-6,6),k=ri(1,4),ans=A/k;
    return mc(`mot5-trigdisp-${A}-${k}`,'trig_displacement','Find the displacement on the interval.',`v(t)=${vterm(A,`\\cos(${k}t)`)},\\quad 0\\le t\\le\\frac{\\pi}{${2*k}}`,texRat(A,k),[texRat(-A,k),String(A),texRat(A,2*k)],`Integrate velocity on the interval. The sine term changes from 0 to 1.`);
  };

  G['separable-differential-equations']=()=>{
    const fam=pick(['general_xy','ivp_xy','ivp_yden','interval','context_cooling','context_warming','context_growth','power_separable']);
    if(fam==='general_xy'){
      const a=nz(-5,5);return mc(`sep5-gen-${a}`,'general_solution','Solve the separable differential equation.',`\\frac{dy}{dx}=${a}xy`,`y=Ce^{${texRat(a,2)}x^2}`,[`y=Ce^{${a}x}`,`y=Cx^{${a}}`,`y=e^{${a}xy}`],`Separate dy/y=${a}x dx, integrate, and exponentiate.`);
    }
    if(fam==='ivp_xy'){
      const a=2*nz(-3,3),y0=pick([2,3,4,5,6]),ans=`y=${y0}e^{${a/2}x^2}`;return mc(`sep5-ivxy-${a}-${y0}`,'initial_value_solution','Solve the separable differential equation with the given initial condition.',`\\frac{dy}{dx}=${a}xy,\\quad y(0)=${y0}`,ans,[`y=${y0}e^{${a}x}`,`y=e^{${a/2}x^2}+${y0-1}`,`y=${y0}x^2`],`Separate variables, integrate, then use y(0)=${y0}.`);
    }
    if(fam==='ivp_yden'){
      const k=pick([1,2,3,4]),y0=pick([2,3,4,5]),ans=`y=\\sqrt{${k}x^2+${y0*y0}}`;
      return mc(`sep5-yden-${k}-${y0}`,'initial_value_power','Solve the initial-value problem.',`\\frac{dy}{dx}=\\frac{${k}x}{y},\\quad y(0)=${y0}`,ans,[`y=${k}x^2+${y0}`,`y=\\sqrt{${2*k}x^2+${y0*y0}}`,`y=-\\sqrt{${k}x^2+${y0*y0}}`],`Separate y dy=${k}x dx. Use y(0)=${y0}>0 to choose the positive branch.`);
    }
    if(fam==='interval'){
      const h=ri(-4,3),y0=pick([1,2,3,4]),x0=h+1,sh=h===0?'x':h>0?`x-${h}`:`x+${-h}`,wrongSh=h===0?'x':h>0?`x+${h}`:`x-${-h}`,ans=`y=${y0}(${sh}),\\quad x>${h}`;
      return mc(`sep5-int-${h}-${y0}`,'validity_interval','Solve and give the interval containing the initial x-value on which the solution is valid.',`\\frac{dy}{dx}=\\frac{y}{${sh}},\\quad y(${x0})=${y0}`,ans,[`y=${y0}(${sh}),\\quad x\\ne${h}`,`y=${y0}e^{${sh}},\\quad x>${h}`,`y=${y0}(${wrongSh}),\\quad x>${h}`],`Separate dy/y=dx/(${sh}). The initial point x=${x0} lies to the right of the singularity x=${h}.`);
    }
    if(fam==='context_cooling'||fam==='context_warming'){
      const dep=pick(['T','P','Q','M','N']),ambient=pick([20,50,60,70,80]),tau=pick([3,4,5,6]),delta=pick([10,15,20,30]),y0=fam==='context_cooling'?ambient+delta:ambient-delta,sign=fam==='context_cooling'?'-':'-',ans=`${dep}=${ambient}${y0-ambient>0?'+':''}${y0-ambient}e^{-t/${tau}}`;
      return mc(`sep5-${fam}-${dep}-${ambient}-${tau}-${delta}`,fam==='context_cooling'?'contextual_separable_cooling':'contextual_separable',`Solve the initial-value problem for ${dep}(t).`,`\\frac{d${dep}}{dt}=-\\frac1{${tau}}(${dep}-${ambient}),\\quad ${dep}(0)=${y0}`,ans,[`${dep}=${ambient}${y0-ambient>0?'+':''}${y0-ambient}e^{t/${tau}}`,`${dep}=${y0}e^{-t/${tau}}`,`${dep}=${ambient}${plus(y0-ambient)}t/${tau}`],`Separate d${dep}/(${dep}-${ambient})=-dt/${tau}, integrate, and use ${dep}(0)=${y0}.`);
    }
    if(fam==='context_growth'){
      const dep=pick(['P','Q','N','M','A']),tau=pick([2,3,4,5]),p0=pick([20,40,50,75,100]),ans=`${dep}=${p0}e^{t/${tau}}`;
      return mc(`sep5-growth-${dep}-${tau}-${p0}`,'contextual_separable_growth',`Solve the initial-value problem for ${dep}(t).`,`\\frac{d${dep}}{dt}=\\frac1{${tau}}${dep},\\quad ${dep}(0)=${p0}`,ans,[`${dep}=Ce^{t/${tau}}`,`${dep}=${p0}e^{-t/${tau}}`,`${dep}=${p0}+t/${tau}`],`Separate d${dep}/${dep}=dt/${tau} and use the initial condition at t=0.`);
    }
    const k=pick([2,4,6]),y0=pick([1,2,3]),ans=`y=\\sqrt[3]{${3*k/2}x^2+${y0**3}}`;
    return mc(`sep5-power-${k}-${y0}`,'power_separable_initial_value','Solve the initial-value problem.',`\\frac{dy}{dx}=\\frac{${k}x}{y^2},\\quad y(0)=${y0}`,ans,[`y=\\sqrt{${k}x^2+${y0*y0}}`,`y=\\sqrt[3]{${k}x^2+${y0**3}}`,`y=${3*k/2}x^2+${y0}`],`Separate y^2 dy=${k}x dx, integrate both sides, and apply y(0)=${y0}.`);
  };

  G['rate-problems']=()=>{
    const fam=pick(['traffic','tank','ballots','delayed_flow','attendance','reservoir_trig','population_non_elementary']);
    if(fam==='traffic'){
      const P0=pick([80,100,120,150]),A=pick([8,12,16,20]),B=pick([5,10,15,20]),T=pick([3,4,5]),value=P0+A*T+B*(T/2-Math.sin(2*T)/4);
      return numeric(`rate-traffic-${P0}-${A}-${B}-${T}`,'calculator_traffic',`Calculator Active: ${P0} cars are initially present. Cars enter at rate R(t). How many cars are present at t=${T}? Round to three decimals.`,`R(t)=${A}+${B}\\sin^2 t`,value,`Use initial amount plus \\int_0^${T}R(t)dt.`);
    }
    if(fam==='tank'){
      const P0=pick([300,400,500,600]),inn=pick([15,20,25,30]),c=pick([4,5,6,8]),q=pick([3,4,5,6]),T=pick([4,5,6]),value=P0+inn*T-c*q*(Math.exp(T/q)-1);
      return numeric(`rate-tank-${P0}-${inn}-${c}-${q}-${T}`,'calculator_tank',`Calculator Active: A tank initially contains ${P0} gallons. Water enters at ${inn} gal/min and leaves at rate L(t). How much water is present after ${T} minutes? Round to three decimals.`,`L(t)=${c}e^{t/${q}}`,value,`Use ${P0}+\\int_0^${T}(${inn}-L(t))dt.`);
    }
    if(fam==='ballots'){
      const P0=pick([200,250,300,350]),A=pick([30,40,50,60]),T=pick([4,5,6]),value=P0+A*(T-Math.sin(T));
      return numeric(`rate-ballots-${P0}-${A}-${T}`,'calculator_ballots',`Calculator Active: At t=0, ${P0} ballots have been counted. Ballots are counted at rate R(t). How many have been counted by t=${T}? Round to three decimals.`,`R(t)=${A}(1-\\cos t)`,value,`Compute ${P0}+\\int_0^${T}R(t)dt.`);
    }
    if(fam==='delayed_flow'){
      const P0=pick([250,300,400,500]),inn=pick([20,30,40,50]),c=pick([2,4,6,8]),T=pick([3,4,5]),value=P0+inn*T-c*T**3/3;
      return numeric(`rate-delay-${P0}-${inn}-${c}-${T}`,'calculator_delayed_outflow',`Calculator Active: A reservoir contains ${P0} units at t=0. Inflow is ${inn} units/hour and outflow is R(t). How much remains at t=${T}? Round to three decimals.`,`R(t)=${c}t^2`,value,`Use ${P0}+\\int_0^${T}(${inn}-${c}t^2)dt.`);
    }
    if(fam==='attendance'){
      const P0=pick([400,500,600,700]),A=pick([40,50,60,70]),T=pick([2,3,4,5]),value=P0+A*(T+Math.cos(T)-1);
      return numeric(`rate-attend-${P0}-${A}-${T}`,'calculator_attendance',`Calculator Active: An event has ${P0} attendees at t=0. Net attendance changes at rate N(t). How many attendees are present at t=${T}? Round to three decimals.`,`N(t)=${A}(1-\\sin t)`,value,`Use ${P0}+\\int_0^${T}N(t)dt.`);
    }
    if(fam==='reservoir_trig'){
      const P0=pick([300,450,600]),A=pick([15,20,25]),B=pick([10,15,20]),T=pick([3,4,5]),value=P0+A*T+B*(1-Math.cos(T));
      return numeric(`rate5-res-${P0}-${A}-${B}-${T}`,'calculator_reservoir_trig',`Calculator Active: A reservoir starts with ${P0} liters. Its net rate of change is R(t). How much is present at t=${T}? Round to three decimals.`,`R(t)=${A}+${B}\\sin t`,value,`Use initial amount plus the definite integral of the net rate.`);
    }
    const P0=pick([100,150,200]),A=pick([20,30,40]),B=pick([5,10,15]),T=pick([1.5,2,2.5]),f=t=>A*Math.exp(-t*t/4)+B*Math.cos(t*t),value=P0+simpson(f,0,T,1200);
    return numeric(`rate5-nonel-${P0}-${A}-${B}-${String(T).replace('.','_')}`,'calculator_non_elementary_rate',`Calculator Active: A population is ${P0} at t=0 and changes at rate R(t). Find the population at t=${T}. Round to three decimals.`,`R(t)=${A}e^{-t^2/4}+${B}\\cos(t^2)`,value,`Use ${P0}+\\int_0^${T}R(t)dt and evaluate the integral numerically.`);
  };
})();


// v10.6.3.C Unit 6 rebuild: broader families, stable choices, calculator answer checking,
// synchronized comprehensive review, and no generic "none/cannot determine" distractors.
(function v1063CUnit6(){
  const clean=t=>String(t).replace(/\+\s*-/g,'- ').replace(/-\s*-/g,'+ ');
  function mc6(id,variant,prompt,math,correct,wrongs,explanation){
    const vals=[],seen=new Set(),add=x=>{const v=clean(String(x).trim());if(v&&!seen.has(v)){seen.add(v);vals.push(v)}};
    add(correct);for(const w of wrongs||[])add(w);
    const c=clean(String(correct).trim());
    for(const w of [`(${c})+1`,`2(${c})`,`\\frac12(${c})`,`-(${c})`]){if(vals.length>=4)break;add(w)}
    const choices=shuffle(vals.slice(0,4));
    return {id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${clean(math)}\\)</div>`:''}</div>`,choices,correctIndex:choices.indexOf(c),choicesAreText:false,explanation};
  }
  const ratChoices=(n,d=1)=>[texRat(n,d),texRat(2*n,d),texRat(n,2*d),texRat(n+d,d)];
  function ratMc(id,variant,prompt,math,n,d,explanation){const c=ratChoices(n,d);return mc6(id,variant,prompt,math,c[0],c.slice(1),explanation)}
  const piRat=(n,d=1)=>{const [a,b]=rat(n,d);if(a===0)return'0';const sg=a<0?'-':'',aa=Math.abs(a);if(b===1)return aa===1?`${sg}\\pi`:`${sg}${aa}\\pi`;return aa===1?`${sg}\\frac{\\pi}{${b}}`:`${sg}\\frac{${aa}\\pi}{${b}}`;};
  function piMc(id,variant,prompt,math,n,d,explanation){const correct=piRat(n,d);return mc6(id,variant,prompt,math,correct,[piRat(2*n,d),piRat(n,2*d),piRat(n+d,d)],explanation)}
  function numeric6(id,variant,prompt,math,value,explanation){return {id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${clean(math)}\\)</div>`:''}</div>`,answerType:'numeric',numericAnswer:Number(value),numericTolerance:0.001,answerTex:Number(value).toFixed(3),numericPlaceholder:'Enter decimal answer',explanation};}
  function simpson6(f,a,b,n=1600){if(n%2)n++;const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;}

  G['area-below-and-between-curves']=(opts={})=>{
    const mode=opts.areaMode||opts.mode||'noncalc';
    if(mode==='calc'){
      const fam=pick(['fresnel_like','exp_log','sqrt_trig','oscillatory_gap','mixed_decay']);
      if(fam==='fresnel_like'){
        const A=pick([2,3,4]),B=pick([1,2]),T=pick([1.5,2,2.5]),f=x=>A+Math.sin(x*x)+B*x/5,value=simpson6(f,0,T);
        return numeric6(`u6-area-c1-${A}-${B}-${T}`,'calculator_non_elementary_axis',`Calculator Active: Find the area between the curve and the x-axis on [0,${T}]. Round to three decimals.`,`y=${A}+\\sin(x^2)+\\frac{${B}}5x`,value,`The function stays above the x-axis, so evaluate its definite integral numerically.`);
      }
      if(fam==='exp_log'){
        const q=pick([2,3,4]),r=pick([3,4,5]),T=pick([1.5,2]),top=x=>Math.exp(x/q)+Math.log(x+2),bot=x=>x*x/r+0.5*Math.cos(x),value=simpson6(x=>top(x)-bot(x),0,T);
        return numeric6(`u6-area-c2-${q}-${r}-${T}`,'calculator_between_exp_log',`Calculator Active: Find the area between the curves on [0,${T}]. Round to three decimals.`,`y=e^{x/${q}}+\\ln(x+2),\\qquad y=\\frac{x^2}{${r}}+\\frac12\\cos x`,value,`The first curve is above the second on the interval. Numerically integrate top minus bottom.`);
      }
      if(fam==='sqrt_trig'){
        const T=pick([1.5,2,2.5]),k=pick([1,2]),top=x=>2+Math.sqrt(x+3)+Math.sin(k*x*x/2),bot=x=>1+Math.log(x+1),value=simpson6(x=>top(x)-bot(x),0,T);
        return numeric6(`u6-area-c3-${k}-${T}`,'calculator_between_radical_trig',`Calculator Active: Find the area between the curves on [0,${T}]. Round to three decimals.`,`y=2+\\sqrt{x+3}+\\sin\\left(\\frac{${k}x^2}{2}\\right),\\qquad y=1+\\ln(x+1)`,value,`Subtract the lower curve from the upper curve and evaluate numerically.`);
      }
      if(fam==='oscillatory_gap'){
        const A=pick([3,4,5]),T=pick([2,2.5,3]),top=x=>A+Math.cos(x*x),bot=x=>Math.exp(-x/2)+x/3,value=simpson6(x=>top(x)-bot(x),0,T);
        return numeric6(`u6-area-c4-${A}-${T}`,'calculator_between_oscillatory_decay',`Calculator Active: Find the area between the curves on [0,${T}]. Round to three decimals.`,`y=${A}+\\cos(x^2),\\qquad y=e^{-x/2}+\\frac{x}{3}`,value,`The displayed upper curve stays above the lower curve. Evaluate the area integral numerically.`);
      }
      const A=pick([2,3,4]),T=pick([1.5,2,2.5]),top=x=>A+Math.exp(-x*x/3)+0.4*Math.sin(x*x),bot=x=>Math.sqrt(x+1)/2,value=simpson6(x=>top(x)-bot(x),0,T);
      return numeric6(`u6-area-c5-${A}-${T}`,'calculator_between_mixed_functions',`Calculator Active: Find the area between the curves on [0,${T}]. Round to three decimals.`,`y=${A}+e^{-x^2/3}+\\frac25\\sin(x^2),\\qquad y=\\frac12\\sqrt{x+1}`,value,`Integrate upper minus lower numerically.`);
    }
    const fam=pick(['shifted_parabola','line_parabola','two_shifted_parabolas','cubic_sign','cos_between','sin_between','absolute_triangle','semicircle_radical']);
    if(fam==='shifted_parabola'){
      const a=ri(2,5),c=ri(1,3),h=ri(-3,3),H=c*a*a,u=h===0?'x':h>0?`x-${h}`:`x+${-h}`;
      return ratMc(`u6-area-n1-${a}-${c}-${h}`,'shifted_scaled_parabola_axis','Find the area between the curve and the x-axis.',`y=${H}-${c===1?'':c}(${u})^2,\\quad ${h-a}\\le x\\le${h+a}`,4*c*a**3,3,`Shift with \(u=${u}\). The area is the integral of \(${c}(a^2-u^2)\) across the symmetric interval.`);
    }
    if(fam==='line_parabola'){
      const a=ri(2,6),k=ri(1,4);
      return ratMc(`u6-area-n2-${a}-${k}`,'parameterized_line_parabola','Find the area enclosed by the curves.',`y=${k*a}x,\\qquad y=${k}x^2`,k*a**3,6,`The curves intersect at x=0 and x=${a}. Integrate the line minus the parabola.`);
    }
    if(fam==='two_shifted_parabolas'){
      const a=ri(1,4),k=ri(1,3),m=ri(1,3),h=ri(-2,2),v=ri(-3,3),u=h===0?'x':h>0?`x-${h}`:`x+${-h}`,up=`${v+k*a*a}-${k===1?'':k}(${u})^2`,lo=`${v-m*a*a}+${m===1?'':m}(${u})^2`;
      return ratMc(`u6-area-n3-${a}-${k}-${m}-${h}-${v}`,'shifted_two_parabolas','Find the area enclosed by the curves.',`y=${clean(up)},\\qquad y=${clean(lo)}`,4*(k+m)*a**3,3,`The curves meet at x=${h-a} and x=${h+a}. Integrate upper minus lower.`);
    }
    if(fam==='cubic_sign'){
      const a=ri(2,5),k=ri(1,3),h=ri(-2,2),u=h===0?'x':h>0?`x-${h}`:`x+${-h}`;
      return ratMc(`u6-area-n4-${a}-${k}-${h}`,'translated_cubic_total_area','Find the total area between the curve and the x-axis.',`y=${k===1?'':k}(${u})(${a*a}-(${u})^2),\\quad ${h-a}\\le x\\le${h+a}`,k*a**4,2,`The curve changes sign at the midpoint. Split there and add the absolute values of the two symmetric areas.`);
    }
    if(fam==='cos_between'){
      const k=ri(1,5),c=ri(-2,3);return mc6(`u6-area-n5-${k}-${c}`,'trig_between_horizontal','Find the area between the curves.',`y=${c}+${k===1?'':k}\\cos x,\\qquad y=${c},\\quad -\\frac{\\pi}{2}\\le x\\le\\frac{\\pi}{2}`,String(2*k),[String(k),String(4*k),`${k}\\pi`],`Subtracting the horizontal line leaves ${k}cos x, which is nonnegative on the interval.`);
    }
    if(fam==='sin_between'){
      const k=ri(1,5),c=ri(-2,3);return mc6(`u6-area-n6-${k}-${c}`,'trig_between_horizontal_sine','Find the area between the curves.',`y=${c}+${k===1?'':k}\\sin x,\\qquad y=${c},\\quad 0\\le x\\le\\pi`,String(2*k),[String(k),String(4*k),`${k}\\pi`],`The vertical gap is ${k}sin x, which is nonnegative from 0 to pi.`);
    }
    if(fam==='absolute_triangle'){
      const a=ri(2,6),k=ri(1,4),h=ri(-3,3),u=h===0?'x':h>0?`x-${h}`:`x+${-h}`;return ratMc(`u6-area-n7-${a}-${k}-${h}`,'absolute_value_cap','Find the area between the curve and the x-axis.',`y=${k*a}-${k===1?'':k}|${u}|,\\quad ${h-a}\\le x\\le${h+a}`,k*a*a,1,`The region is a triangle with base ${2*a} and height ${k*a}.`);
    }
    const a=ri(1,5),k=ri(1,4);return piMc(`u6-area-n8-${a}-${k}`,'radical_semicircle_area','Find the area between the curve and the x-axis.',`y=${k===1?'':k}\\sqrt{${a*a}-x^2},\\quad -${a}\\le x\\le${a}`,k*a*a,2,`The graph is a vertically scaled upper semicircle, so its area is ${k} times one-half pi r squared.`);
  };

  G['finding-area-in-terms-of-y']=()=>{
    const fam=pick(['sideways_parabola','line_parabola','two_sideways','triangle','cubic_width','translated_sideways']);
    if(fam==='sideways_parabola'){const h=ri(1,5),k=ri(1,3);return ratMc(`u6-y1-${h}-${k}`,'horizontal_scaled_parabola','Find the area by integrating with respect to y.',`x=${k}y^2,\\qquad x=${k*h*h},\\qquad -${h}\\le y\\le${h}`,4*k*h**3,3,`Horizontal width is ${k}(h^2-y^2).`)}
    if(fam==='line_parabola'){const k=ri(2,6),c=ri(1,3);return ratMc(`u6-y2-${k}-${c}`,'horizontal_line_parabola','Find the area using horizontal slices.',`x=${c}y^2,\\qquad x=${c*k}y`,c*k**3,6,`The curves meet at y=0 and y=${k}. Use right minus left.`)}
    if(fam==='two_sideways'){const r=ri(1,4),k=ri(1,3);return ratMc(`u6-y3-${r}-${k}`,'horizontal_two_sideways','Find the area using dy.',`x=${k}(y^2-${r*r}),\\qquad x=${k}(${r*r}-y^2)`,8*k*r**3,3,`The curves meet at y=±${r}. Integrate right minus left.`)}
    if(fam==='triangle'){const h=ri(2,6),c=ri(1,4);return ratMc(`u6-y4-${h}-${c}`,'horizontal_triangle','Find the area using horizontal slices.',`x=0,\\qquad x=${c}(${h}-y),\\qquad 0\\le y\\le${h}`,c*h*h,2,`Horizontal width is ${c}(${h}-y).`)}
    if(fam==='cubic_width'){const a=ri(2,5),k=ri(1,3);return ratMc(`u6-y5-${a}-${k}`,'horizontal_cubic_width','Find the area by integrating with respect to y.',`x=${k}y^3,\\qquad x=${k*a**3},\\qquad 0\\le y\\le${a}`,3*k*a**4,4,`Use right minus left: ${k*a**3}-${k}y^3.`)}
    const h=ri(-2,2),a=ri(2,5),k=ri(1,3),u=h===0?'y':h>0?`y-${h}`:`y+${-h}`;return ratMc(`u6-y6-${h}-${a}-${k}`,'translated_horizontal_parabola','Find the area by integrating with respect to y.',`x=${k*a*a},\\qquad x=${k}(${u})^2,\\qquad ${h-a}\\le y\\le${h+a}`,4*k*a**3,3,`Translate with \(u=${u}\); the horizontal width is \(${k}(a^2-u^2)\).`);
  };

  G['integrals-on-piecewise-defined-functions']=()=>{
    const fam=pick(['two_linear','three_poly','four_piece','trig_piece','reciprocal_log','mixed_constant_quad']);
    if(fam==='two_linear'){
      const a=ri(1,4),b=ri(1,4),c=ri(-3,3);const val=(a*1*1/2+c*1)-(a*4/2+c*(-2)) + (b*9/2)-(b*1/2); // [-2,1] then [1,3]
      return ratMc(`u6-piece1-${a}-${b}-${c}`,'piecewise_two_linear','Evaluate the definite integral.',`f(x)=\\begin{cases}${a}x${c>=0?`+${c}`:c},&-2\\le x<1\\\\${b}x,&1\\le x\\le3\\end{cases},\\qquad \\int_{-2}^{3}f(x)\\,dx`,Math.round(val*2),2,`Split the integral at x=1 and integrate each formula only on its own interval.`);
    }
    if(fam==='three_poly'){
      const a=ri(1,4),b=ri(1,4),c=ri(2,6),num=6*a+8*b+6*c-18;return ratMc(`u6-piece2-${a}-${b}-${c}`,'piecewise_three_polynomial','Evaluate the definite integral.',`f(x)=\\begin{cases}${a}x+${2*a},&-2\\le x<0\\\\${b}x^2,&0\\le x<2\\\\${c}-x,&2\\le x\\le4\\end{cases},\\qquad \\int_{-2}^{4}f(x)\\,dx`,num,3,`Break the integral at x=0 and x=2, then add the three definite integrals.`);
    }
    if(fam==='four_piece'){
      const a=ri(1,3),b=ri(1,3),c=ri(3,6),d=ri(1,4),num=-9*a+4*b+6*c+3+12*d;return ratMc(`u6-piece3-${a}-${b}-${c}-${d}`,'piecewise_four_formula','Evaluate the definite integral.',`f(x)=\\begin{cases}${a}x,&-2\\le x<-1\\\\${b}x^2+1,&-1\\le x<1\\\\${c}-x,&1\\le x<2\\\\${d},&2\\le x\\le4\\end{cases},\\qquad \\int_{-2}^{4}f(x)\\,dx`,num,6,`Split at every formula change: -1, 1, and 2.`);
    }
    if(fam==='trig_piece'){
      const k=ri(1,4),m=ri(1,3),base=piRat(m),delta=k-m,correct=delta===0?base:`${base}${delta>0?`+${delta}`:`-${-delta}`}`,altDelta=delta+1,alt=altDelta===0?base:`${base}${altDelta>0?`+${altDelta}`:`-${-altDelta}`}`;return mc6(`u6-piece4-${k}-${m}`,'piecewise_trig_stable','Evaluate the definite integral.',`f(x)=\\begin{cases}${k===1?'':k}\\cos x,&0\\le x<\\frac{\\pi}{2}\\\\${2*m}-${m===1?'':m}\\sin x,&\\frac{\\pi}{2}\\le x\\le\\pi\\end{cases},\\qquad \\int_0^\\pi f(x)\\,dx`,correct,[base,piRat(k),alt],`Integrate each branch on its stated interval and add.`);
    }
    if(fam==='reciprocal_log'){
      const k=ri(1,4),c=ri(1,4),lt=k===1?'\\ln2':`${k}\\ln2`,correct=`${lt}+${6*c}`;return mc6(`u6-piece5-${k}-${c}`,'piecewise_log_linear','Evaluate the definite integral.',`f(x)=\\begin{cases}\\frac{${k}}{x},&1\\le x<2\\\\${c}x,&2\\le x\\le4\\end{cases},\\qquad \\int_1^4f(x)\\,dx`,correct,[`${lt}+${4*c}`,`${k===1?'\\ln4':`${k}\\ln4`}+${6*c}`,`${k}+${6*c}`],`The reciprocal branch contributes ${k===1?'ln 2':`${k} ln 2`}; the linear branch contributes ${6*c}.`);
    }
    const a=ri(1,5),b=ri(1,4),num=9*a+19*b;return ratMc(`u6-piece6-${a}-${b}`,'piecewise_constant_quadratic','Evaluate the definite integral.',`f(x)=\\begin{cases}${a},&-1\\le x<2\\\\${b}x^2,&2\\le x\\le3\\end{cases},\\qquad \\int_{-1}^{3}f(x)\\,dx`,num,3,`Integrate the constant branch from -1 to 2 and the quadratic branch from 2 to 3.`);
  };

  G['volume-by-cross-sections']=()=>{
    const fam=pick(['square_parabola','rectangle_triangle','semicircle_arch','equilateral_parabola','isosceles_leg','dy_square','quarter_circle']);
    if(fam==='square_parabola'){
      const a=ri(1,4),h=ri(1,5);return ratMc(`u6-cross1-${a}-${h}`,'squares_parameterized_parabola','A solid has base bounded by the curve and the x-axis. Cross sections perpendicular to the x-axis are squares. Find the volume.',`y=${h}\\left(1-\\frac{x^2}{${a*a}}\\right),\\qquad -${a}\\le x\\le${a}`,16*a*h*h,15,`The square side is the vertical base segment. Integrate its square across the interval.`);
    }
    if(fam==='rectangle_triangle'){
      const a=ri(2,6),h=ri(2,6),m=ri(2,4);return ratMc(`u6-cross2-${a}-${h}-${m}`,'rectangles_scaled_height','The base is the triangular region under the line shown. Cross sections perpendicular to the x-axis are rectangles whose height is ${m} times their base in the xy-plane. Find the volume.',`y=${h}\\left(1-\\frac{x}{${a}}\\right),\\qquad 0\\le x\\le${a}`,m*h*h*a,3,`If d(x) is the vertical base segment, each rectangle has area ${m}d(x)^2.`);
    }
    if(fam==='semicircle_arch'){
      const a=ri(2,5),k=ri(1,3);return piMc(`u6-cross3-${a}-${k}`,'semicircles_polynomial_arch','The base is bounded by the curve and the x-axis. Cross sections perpendicular to the x-axis are semicircles whose diameters lie in the base. Find the volume.',`y=${k}x(${a}-x),\\qquad 0\\le x\\le${a}`,k*k*a**5,240,`For diameter d, semicircle area is pi d²/8. Here d=${k}x(${a}-x).`);
    }
    if(fam==='equilateral_parabola'){
      const r=ri(1,4);const correct=`\\frac{${4*r**5}\\sqrt3}{15}`;return mc6(`u6-cross4-${r}`,'equilateral_parabola_sections','The base is bounded by the parabola and the x-axis. Cross sections perpendicular to the x-axis are equilateral triangles with a side in the base. Find the volume.',`y=${r*r}-x^2,\\qquad -${r}\\le x\\le${r}`,correct,[`\\frac{${2*r**5}\\sqrt3}{15}`,`\\frac{${8*r**5}\\sqrt3}{15}`,`\\frac{${4*r**5}}{15}`],`Each triangle has area sqrt(3)/4 times the square of the vertical base segment.`);
    }
    if(fam==='isosceles_leg'){
      const a=ri(2,6),h=ri(2,6);return ratMc(`u6-cross5-${a}-${h}`,'isosceles_right_leg_sections','The base is the triangular region under the line shown. Cross sections perpendicular to the x-axis are isosceles right triangles with a leg in the base. Find the volume.',`y=${h}\\left(1-\\frac{x}{${a}}\\right),\\qquad 0\\le x\\le${a}`,h*h*a,6,`If the leg is d(x), the triangle area is d(x)²/2.`);
    }
    if(fam==='dy_square'){
      const r=ri(1,4);return ratMc(`u6-cross6-${r}`,'horizontal_square_sections','The base is bounded by x=0 and the sideways parabola shown. Cross sections perpendicular to the y-axis are squares. Find the volume.',`x=${r*r}-y^2,\\qquad 0\\le y\\le${r}`,8*r**5,15,`The horizontal segment has length ${r*r}-y² and is the square side.`);
    }
    const r=ri(1,4);return piMc(`u6-cross7-${r}`,'quarter_circle_radius_sections','The base is bounded by the curve and the x-axis. Cross sections perpendicular to the x-axis are quarter circles whose radius is the vertical segment in the base. Find the volume.',`y=${r*r}-x^2,\\qquad -${r}\\le x\\le${r}`,4*r**5,15,`Quarter-circle area is pi r(x)²/4, where r(x) is the vertical base segment.`);
  };

  G['solids-of-revolution']=(opts={})=>{
    const method=opts.solidMethod||opts.mode||'disk',calc=opts.solidCalcMode||'noncalc';
    if(calc==='calc'){
      if(method==='shell'){
        const fam=pick(['gaussian_shell','shifted_fresnel_shell','horizontal_oscillatory_shell','log_shell']);
        if(fam==='gaussian_shell'){
          const A=pick([1,2,3]),T=pick([1.5,2,2.5]),f=x=>A+Math.exp(-x*x),value=2*Math.PI*simpson6(x=>x*f(x),0,T);return numeric6(`u6-solid-cs1-${A}-${T}`,'calculator_shell_gaussian','Calculator Active: Find the volume obtained by revolving the region under the curve on the stated interval about the y-axis. Round to three decimals.',`y=${A}+e^{-x^2},\\qquad 0\\le x\\le${T}`,value,`Using vertical shells gives 2pi times the integral of radius x times height y.`);
        }
        if(fam==='shifted_fresnel_shell'){
          const A=pick([2,3]),T=pick([1.5,2]),axis=pick([3,4]),f=x=>A+Math.sin(x*x),value=2*Math.PI*simpson6(x=>(axis-x)*f(x),0,T);return numeric6(`u6-solid-cs2-${A}-${T}-${axis}`,'calculator_shell_shifted_axis','Calculator Active: Find the volume obtained by revolving the region under the curve about the vertical line shown. Round to three decimals.',`y=${A}+\\sin(x^2),\\quad 0\\le x\\le${T},\\qquad x=${axis}`,value,`For vertical shells, radius is ${axis}-x and height is the function value.`);
        }
        if(fam==='horizontal_oscillatory_shell'){
          const T=pick([1.5,2]),A=pick([3,4]),width=y=>A+Math.cos(y*y)-y/4,value=2*Math.PI*simpson6(y=>y*width(y),0,T);return numeric6(`u6-solid-cs3-${A}-${T}`,'calculator_horizontal_shell_non_elementary','Calculator Active: Find the volume obtained by revolving the region between x=0 and the curve about the x-axis. Round to three decimals.',`x=${A}+\\cos(y^2)-\\frac y4,\\qquad 0\\le y\\le${T}`,value,`Horizontal shells have radius y and height equal to the horizontal width of the region.`);
        }
        const T=pick([1.5,2,2.5]),A=pick([2,3,4]),f=x=>Math.log(x*x+2)+A,value=2*Math.PI*simpson6(x=>x*f(x),0,T);return numeric6(`u6-solid-cs4-${A}-${T}`,'calculator_shell_logarithmic','Calculator Active: Find the volume obtained by revolving the region under the curve about the y-axis. Round to three decimals.',`y=${A}+\\ln(x^2+2),\\qquad 0\\le x\\le${T}`,value,`Use radius x and shell height y, then evaluate numerically.`);
      }
      const fam=pick(['fresnel_disk','exp_trig_washer','shifted_axis_radical','log_disk']);
      if(fam==='fresnel_disk'){
        const A=pick([2,3]),T=pick([1.5,2]),r=x=>A+Math.sin(x*x),value=Math.PI*simpson6(x=>r(x)**2,0,T);return numeric6(`u6-solid-cd1-${A}-${T}`,'calculator_disk_fresnel','Calculator Active: Find the volume obtained by revolving the region under the curve about the x-axis. Round to three decimals.',`y=${A}+\\sin(x^2),\\qquad 0\\le x\\le${T}`,value,`The cross-sectional radius is the function value; integrate pi times radius squared.`);
      }
      if(fam==='exp_trig_washer'){
        const q=pick([2,3,4]),T=pick([1.5,2]),R=x=>2+Math.exp(x/q),r=x=>1+0.5*Math.cos(x*x),value=Math.PI*simpson6(x=>R(x)**2-r(x)**2,0,T);return numeric6(`u6-solid-cd2-${q}-${T}`,'calculator_two_curve_revolution','Calculator Active: Find the volume obtained by revolving the region between the curves about the x-axis. Round to three decimals.',`y=2+e^{x/${q}},\\qquad y=1+\\frac12\\cos(x^2),\\qquad 0\\le x\\le${T}`,value,`Use the larger distance from the x-axis as the outer radius and subtract the inner-radius square.`);
      }
      if(fam==='shifted_axis_radical'){
        const T=pick([1.5,2]),f=x=>1+Math.sqrt(x+1)+0.5*Math.sin(x*x),value=Math.PI*simpson6(x=>(f(x)+1)**2-1,0,T);return numeric6(`u6-solid-cd3-${T}`,'calculator_shifted_horizontal_axis','Calculator Active: The region between the curve and y=0 is revolved about y=-1. Find the volume. Round to three decimals.',`y=1+\\sqrt{x+1}+\\frac12\\sin(x^2),\\qquad 0\\le x\\le${T}`,value,`Measure both radii from y=-1, then integrate the difference of their squares.`);
      }
      const A=pick([1,2,3]),T=pick([1.5,2,2.5]),r=x=>A+Math.log(x*x+2),value=Math.PI*simpson6(x=>r(x)**2,0,T);return numeric6(`u6-solid-cd4-${A}-${T}`,'calculator_log_disk','Calculator Active: Find the volume obtained by revolving the region under the curve about the x-axis. Round to three decimals.',`y=${A}+\\ln(x^2+2),\\qquad 0\\le x\\le${T}`,value,`Square the radius function and evaluate the volume integral numerically.`);
    }
    if(method==='shell'){
      const fam=pick(['power_yaxis','line_parabola','shifted_vertical','horizontal_sideways','horizontal_shifted']);
      if(fam==='power_yaxis'){const k=ri(1,4),p=pick([1,2,3,4]),a=ri(1,4);return piMc(`u6-solid-s1-${k}-${p}-${a}`,'shell_power_y_axis','Find the volume obtained by revolving the region under the curve about the y-axis.',`y=${k}x^{${p}},\\qquad 0\\le x\\le${a}`,2*k*a**(p+2),p+2,`Using vertical shells, radius is x and height is ${k}x^${p}.`)}
      if(fam==='line_parabola'){const a=ri(2,6),k=ri(1,3);return piMc(`u6-solid-s2-${a}-${k}`,'shell_line_parabola','Find the volume obtained by revolving the region between the curves about the y-axis.',`y=${k*a}x,\\qquad y=${k}x^2`,k*a**4,6,`The curves meet at 0 and ${a}. Shell height is line minus parabola.`)}
      if(fam==='shifted_vertical'){const a=ri(2,5),k=ri(1,4),b=a+ri(1,4);return piMc(`u6-solid-s3-${a}-${k}-${b}`,'shell_shifted_vertical_axis','Find the volume obtained by revolving the triangular region under the line about x=${b}.',`y=${k}(${a}-x),\\qquad 0\\le x\\le${a}`,k*a*a*(3*b-a),3,`Vertical shell radius is ${b}-x and height is ${k}(${a}-x).`)}
      if(fam==='horizontal_sideways'){const a=ri(1,5);return piMc(`u6-solid-s4-${a}`,'horizontal_shell_sideways','Find the volume obtained by revolving the region between x=y^2 and x=${a*a} about the x-axis.',`0\\le y\\le${a}`,a**4,2,`Horizontal shells have radius y and height ${a*a}-y².`)}
      const a=ri(2,6),c=ri(1,4);return piMc(`u6-solid-s5-${a}-${c}`,'horizontal_shell_shifted_axis','Find the volume obtained by revolving the triangular region about y=-${c}.',`x=${a}-y,\\qquad x=0,\\qquad 0\\le y\\le${a}`,a**3+3*c*a*a,3,`Horizontal shell radius is y+${c} and shell height is ${a}-y.`);
    }
    const fam=pick(['power_disk','sqrt_disk','cap_washer','shifted_horizontal','root_power_between']);
    if(fam==='power_disk'){const k=ri(1,4),p=pick([1,2,3]),a=ri(1,4);return piMc(`u6-solid-d1-${k}-${p}-${a}`,'disk_power_family','Find the volume obtained by revolving the region under the curve about the x-axis.',`y=${k}x^{${p}},\\qquad 0\\le x\\le${a}`,k*k*a**(2*p+1),2*p+1,`The region touches the axis of rotation, so each cross section has one radius, the function value.`)}
    if(fam==='sqrt_disk'){const k=ri(1,4),a=ri(1,6);return piMc(`u6-solid-d2-${k}-${a}`,'disk_radical_family','Find the volume obtained by revolving the region under the curve about the x-axis.',`y=${k}\\sqrt{x},\\qquad 0\\le x\\le${a}`,k*k*a*a,2,`Square the radius ${k}sqrt(x) before integrating.`)}
    if(fam==='cap_washer'){const p=pick([1,2,3]),k=ri(1,3),a=ri(1,4),H=k*a**p;return piMc(`u6-solid-d3-${p}-${k}-${a}`,'washer_constant_and_power','Find the volume obtained by revolving the region between the curves about the x-axis.',`y=${H},\\qquad y=${k}x^{${p}},\\qquad 0\\le x\\le${a}`,2*p*k*k*a**(2*p+1),2*p+1,`Decide which radius is outer and which is inner, then integrate the difference of their squares.`)}
    if(fam==='shifted_horizontal'){const m=ri(1,4),a=ri(1,4),c=ri(1,4),H=m*a;return piMc(`u6-solid-d4-${m}-${a}-${c}`,'washer_shifted_axis_parameterized','Find the volume obtained by revolving the region between y=${H} and y=${m}x on 0≤x≤${a} about y=-${c}.','',2*m*m*a**3+3*m*c*a*a,3,`Measure both radii from y=-${c}; the region does not touch the axis of rotation.`)}
    const r=ri(1,4),q=ri(1,3),a=r*r;return piMc(`u6-solid-d5-${r}-${q}`,'washer_radical_power','Find the volume obtained by revolving the region between the curves about the x-axis.',`y=${r*q}\\sqrt{x},\\qquad y=${q}x,\\qquad 0\\le x\\le${a}`,q*q*r**6,6,`The radical curve is above the line between their intersections. Use the squares of those distances from the axis.`);
  };

  G['unit-6-comprehensive']=()=>{
    const slug=pick(['area-below-and-between-curves','finding-area-in-terms-of-y','integrals-on-piecewise-defined-functions','volume-by-cross-sections','solids-of-revolution']);
    if(slug==='area-below-and-between-curves')return G[slug]({areaMode:R()<0.28?'calc':'noncalc'});
    if(slug==='solids-of-revolution')return G[slug]({solidMethod:R()<0.5?'shell':'disk',solidCalcMode:R()<0.28?'calc':'noncalc'});
    return G[slug]({});
  };
})();


// Difference Quotient final course specification (v10.6.3.J): simplify only.
// Students practice either [f(x+h)-f(x)]/h or [f(x)-f(a)]/(x-a); no derivative-limit evaluation prompts.
G['difference-quotient']=()=>{
  const pointForm=R()<0.38;
  if(!pointForm){
    const kind=pick(['linear','quadratic','cubic','radical','reciprocal']);
    if(kind==='linear'){
      const A=nz(-7,7),B=ri(-9,9),correct=String(A);
      return mc(`dqj-lin-${A}-${B}`,'linear_difference_quotient','Simplify the difference quotient.',`f(x)=${lin(A,B)},\\qquad \\frac{f(x+h)-f(x)}{h}`,correct,[String(-A),`${A}h`,`${lin(A,B)}`],`Substitute \\(x+h\\), subtract \\(f(x)\\), factor out \\(h\\), and cancel. The simplified quotient is \\(${correct}\\).`)
    }
    if(kind==='quadratic'){
      const A=nz(-4,4),B=nz(-6,6),C=ri(-7,7),correct=`${signed(2*A,'x',true)}${signed(A,'h')}${signed(B,'')}`;
      const w1=`${signed(2*A,'x',true)}${signed(B,'')}`,w2=`${signed(A,'x',true)}${signed(A,'h')}${signed(B,'')}`,w3=`${signed(2*A,'x',true)}${signed(A,'h')}${signed(C,'')}`;
      return mc(`dqj-quad-${A}-${B}-${C}`,'quadratic_difference_quotient','Simplify the difference quotient.',`f(x)=${poly2(A,B,C)},\\qquad \\frac{f(x+h)-f(x)}{h}`,correct,[w1,w2,w3],`Expand \\(f(x+h)\\), subtract \\(f(x)\\), factor out \\(h\\), and cancel. The simplified quotient is \\(${correct}\\).`)
    }
    if(kind==='cubic'){
      const A=nz(-3,3),B=nz(-4,4),C=nz(-5,5),D=ri(-6,6);
      const correct=`${signed(3*A,'x^2',true)}${signed(3*A,'xh')}${signed(A,'h^2')}${signed(2*B,'x')}${signed(B,'h')}${signed(C,'')}`;
      const w1=`${signed(3*A,'x^2',true)}${signed(2*B,'x')}${signed(C,'')}`;
      const w2=`${signed(3*A,'x^2',true)}${signed(A,'xh')}${signed(A,'h^2')}${signed(2*B,'x')}${signed(C,'')}`;
      const w3=`${signed(3*A,'x^2',true)}${signed(3*A,'xh')}${signed(A,'h^2')}${signed(B,'x')}${signed(B,'h')}${signed(C,'')}`;
      return mc(`dqj-cubic-${A}-${B}-${C}-${D}`,'cubic_difference_quotient','Simplify the difference quotient.',`f(x)=${poly3(A,B,C,D)},\\qquad \\frac{f(x+h)-f(x)}{h}`,correct,[w1,w2,w3],`Expand \\((x+h)^3\\) and \\((x+h)^2\\), subtract \\(f(x)\\), then factor and cancel \\(h\\). The simplified quotient is \\(${correct}\\).`)
    }
    if(kind==='radical'){
      const c=ri(1,9),root=`\\sqrt{x+${c}}`,shift=`\\sqrt{x+h+${c}}`,correct=`\\frac{1}{${shift}+${root}}`;
      return mc(`dqj-rad-${c}`,'radical_difference_quotient','Simplify the difference quotient.',`f(x)=${root},\\qquad \\frac{f(x+h)-f(x)}{h}`,correct,[`\\frac{1}{2${root}}`,`\\frac{h}{${shift}+${root}}`,`${shift}+${root}`],`Multiply by the conjugate. The numerator becomes \\(h\\), which cancels the denominator \\(h\\), leaving \\(${correct}\\).`)
    }
    const c=ri(1,8),k=nz(-5,5),den1=`x+${c}`,den2=`x+h+${c}`,num=Math.abs(k),correct=k<0?`\\frac{${num}}{(${den1})(${den2})}`:`-\\frac{${num}}{(${den1})(${den2})}`;
    const kh=k===1?'h':k===-1?'-h':`${k}h`,negKh=k===1?'-h':k===-1?'h':`${-k}h`;
    return mc(`dqj-recip-${k}-${c}`,'reciprocal_difference_quotient','Simplify the difference quotient.',`f(x)=\\frac{${k}}{${den1}},\\qquad \\frac{f(x+h)-f(x)}{h}`,correct,[`\\frac{${k}}{(${den1})^2}`,`-\\frac{${Math.abs(k)}}{(${den1})^2}`,`\\frac{${kh}}{(${den1})(${den2})}`],`Combine the fractions in the numerator. Their numerator simplifies to \\(${negKh}\\); cancel \\(h\\) to obtain \\(${correct}\\).`)
  }
  const kind=pick(['quadratic','cubic','radical','reciprocal']);
  if(kind==='quadratic'){
    const A=nz(-4,4),B=nz(-6,6),C=ri(-6,6),a=ri(-3,3),correct=`${signed(A,'x',true)}${signed(A*a+B,'')}`;
    return mc(`dqj-point-q-${A}-${B}-${C}-${a}`,'point_form_simplification','Simplify the difference quotient.',`f(x)=${poly2(A,B,C)},\\qquad \\frac{f(x)-f(${a})}{${xm(a)}}`,correct,[`${signed(2*A,'x',true)}${signed(B,'')}`,`${signed(A,'x',true)}${signed(B,'')}`,String(2*A*a+B)],`Factor \\(f(x)-f(${a})\\) by \\(${xm(a)}\\), then cancel that factor. The simplified quotient is \\(${correct}\\).`)
  }
  if(kind==='cubic'){
    const A=nz(-2,2),B=nz(-3,3),C=nz(-4,4),D=ri(-5,5),a=ri(-2,2);
    const q2=A*a+B, q1=A*a*a+B*a+C;
    const correct=`${signed(A,'x^2',true)}${signed(q2,'x')}${signed(q1,'')}`;
    const w1=`${signed(3*A,'x^2',true)}${signed(2*B,'x')}${signed(C,'')}`;
    const w2=`${signed(A,'x^2',true)}${signed(B,'x')}${signed(C,'')}`;
    const w3=String(3*A*a*a+2*B*a+C);
    return mc(`dqj-point-c-${A}-${B}-${C}-${D}-${a}`,'point_form_cubic_simplification','Simplify the difference quotient.',`f(x)=${poly3(A,B,C,D)},\\qquad \\frac{f(x)-f(${a})}{${xm(a)}}`,correct,[w1,w2,w3],`Factor the numerator by \\(${xm(a)}\\) and cancel. The remaining quadratic factor is \\(${correct}\\).`)
  }
  if(kind==='radical'){
    const r=ri(2,6),c=ri(0,5),a=r*r-c,root=`\\sqrt{x+${c}}`,correct=`\\frac{1}{${root}+${r}}`;
    return mc(`dqj-point-r-${r}-${c}`,'point_form_radical_simplification','Simplify the difference quotient.',`f(x)=${root},\\qquad \\frac{f(x)-f(${a})}{${xm(a)}}`,correct,[`\\frac{1}{${2*r}}`,`\\frac{1}{${root}}`,`${root}+${r}`],`Multiply by the conjugate. Since \\(f(${a})=${r}\\), the factor \\(${xm(a)}\\) cancels and the quotient becomes \\(${correct}\\).`)
  }
  const c=ri(1,6),a=ri(0,4),A=a+c,den=`x+${c}`,correct=`-\\frac{1}{${A}(${den})}`;
  return mc(`dqj-point-recip-${a}-${c}`,'point_form_reciprocal_simplification','Simplify the difference quotient.',`f(x)=\\frac1{${den}},\\qquad \\frac{f(x)-f(${a})}{${xm(a)}}`,correct,[`-\\frac{1}{(${den})^2}`,`\\frac{1}{${A}(${den})}`,`-\\frac{1}{${A}^2}`],`Combine the fractions in the numerator. A factor of \\(${xm(a)}\\) cancels, leaving \\(${correct}\\).`)
};


// v10.6.3.L — Unit 2 conceptual cleanup + Unit 3 tangent-line polish/variety.
(function v1063LUnit23(){
  const texPoint=(x,y)=>`(${x},${y})`;
  const ordered=(vals)=>vals.map(String).join(',\\ ');
  const slopeFactor=m=>m==='1'?'':m==='-1'?'-':m;
  const pointSlope=(y0,m,a)=>{
    if(m==='0')return `y=${y0}`;
    const ys=y0===0?'y':y0>0?`y-${y0}`:`y+${-y0}`;
    const xs=a===0?'x':a>0?`(x-${a})`:`(x+${-a})`;
    return `${ys}=${slopeFactor(String(m))}${xs}`;
  };

  // Conceptual derivative review: keep it genuinely conceptual/AP-style and remove
  // low-value coefficient-one implicit equations such as 1x+1y=c.
  G['derivatives-conceptual-review']=()=>{
    const make=(id,variant,prompt,math,correct,wrongs,explanation)=>{
      const vals=shuffle([correct,...wrongs]);
      return {id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${math}\\)</div>`:''}</div>`,choices:vals,correctIndex:vals.indexOf(correct),choicesAreText:true,choicesHtml:true,explanation};
    };
    const kind=pick(['diff_cont','derivative_meaning','second_derivative','inverse_rule','nondifferentiable','critical_point','motion_meaning','linearization_meaning']);
    if(kind==='diff_cont')return make('dconceptL-diff-cont','differentiability_continuity','Which statement must be true?',`f\\text{ is differentiable at }x=a.`,`\\(f\\) is continuous at \\(x=a\\).`,[`\\(f'(a)=0\\).`,`\\(f\\) has a local extremum at \\(x=a\\).`,`\\(f''(a)\\) exists.`],`Differentiability at a point implies continuity at that point. None of the other statements is required.`);
    if(kind==='derivative_meaning'){
      const a=ri(-4,4),m=nz(-6,6);
      return make(`dconceptL-meaning-${a}-${m}`,'derivative_interpretation','What does the derivative value tell you?',`f'(${a})=${m}`,`The tangent line to the graph of \\(f\\) at \\(x=${a}\\) has slope \\(${m}\\).`,[`\\(f(${a})=${m}\\).`,`The graph has a horizontal tangent at \\(x=${a}\\).`,`The graph is concave ${m>0?'up':'down'} at \\(x=${a}\\).`],`The derivative \\(f'(${a})\\) is the slope of the tangent line at \\(x=${a}\\).`);
    }
    if(kind==='second_derivative'){
      const fp=pick([-5,-3,-1,1,3,5]),fpp=pick([-4,-2,2,4]);
      const correct=fp>0?(fpp>0?'Increasing and concave up.':'Increasing and concave down.'):(fpp>0?'Decreasing and concave up.':'Decreasing and concave down.');
      const pool=['Increasing and concave up.','Increasing and concave down.','Decreasing and concave up.','Decreasing and concave down.'].filter(x=>x!==correct);
      return make(`dconceptL-2nd-${fp}-${fpp}`,'first_second_derivative_signs','Describe the graph at the indicated point.',`f'(a)=${fp},\\qquad f''(a)=${fpp}`,correct,pool,`The sign of \\(f'\\) determines increasing/decreasing behavior, and the sign of \\(f''\\) determines concavity.`);
    }
    if(kind==='inverse_rule'){
      const m=pick([2,3,4,5,6]);
      return make(`dconceptL-inv-${m}`,'inverse_derivative_rule','Which value is correct?',`f(a)=b,\\qquad f'(a)=${m},\\qquad (f^{-1})'(b)=?`,`\\(\\frac{1}{${m}}\\)`,[`\\(${m}\\)`,`\\(-\\frac{1}{${m}}\\)`,`\\(-${m}\\)`],`For inverse functions, \\((f^{-1})'(b)=\\frac{1}{f'(a)}\\), so the value is \\(\\frac{1}{${m}}\\).`);
    }
    if(kind==='nondifferentiable')return make('dconceptL-corner','nondifferentiability','At which feature is a function not differentiable?','', 'A sharp corner.',['A smooth local minimum.','A horizontal tangent.','A point with positive slope.'],'At a sharp corner, the one-sided tangent slopes do not agree, so the derivative does not exist there.');
    if(kind==='critical_point')return make('dconceptL-critical','critical_point_reasoning','Which statement is sufficient to conclude that f has a local maximum at x=a?',`f'\\text{ changes from positive to negative at }x=a.`,'The derivative changes from positive to negative at \\(x=a\\).',['The derivative is zero at \\(x=a\\), with no other information.','The second derivative is zero at \\(x=a\\).','The function is continuous at \\(x=a\\).'],`A change in \\(f'\\) from positive to negative means the function changes from increasing to decreasing, which gives a local maximum.`);
    if(kind==='motion_meaning'){
      const t=ri(1,8),v=nz(-12,12);
      return make(`dconceptL-motion-${t}-${v}`,'velocity_interpretation','A particle has position s(t). What does the given derivative value mean?',`s'(${t})=${v}`,`At \\(t=${t}\\), the particle's velocity is \\(${v}\\).`,[`At \\(t=${t}\\), the particle's position is \\(${v}\\).`,`At \\(t=${t}\\), the particle's acceleration is \\(${v}\\).`,`At \\(t=${t}\\), the particle's speed must be \\(${v}\\).`],`The first derivative of position is velocity. Speed would be the absolute value of velocity.`);
    }
    const a=ri(-3,3),fa=ri(-8,8),fp=nz(-5,5),h=pick([0.1,0.2,-0.1,-0.2]);
    return make(`dconceptL-lin-${a}-${fa}-${fp}-${String(h).replace('-','m')}`,'linearization_interpretation','Which expression is the tangent-line approximation for f(a+h)?',`f(a)=${fa},\\qquad f'(a)=${fp}`,`\\(f(a+h)\\approx ${fa}+${fp}h\\)`,[`\\(f(a+h)\\approx ${fa}+h^2\\)`,`\\(f(a+h)\\approx ${fp}+${fa}h\\)`,`\\(f(a+h)\\approx ${fa}-${fp}h\\)`],`Near \\(x=a\\), the tangent-line approximation is \\(f(a+h)\\approx f(a)+f'(a)h\\).`);
  };

  // Tangent/normal lines: suppress coefficient 1 everywhere in given functions
  // and use cleaner point-slope equations in the choices.
  G['equations-of-tangent-and-normal-lines']=()=>{
    const fam=pick(['quadratic_tangent','cubic_normal','radical_tangent','reciprocal_normal','sine_tangent','cosine_normal','exponential_tangent','log_tangent']);
    if(fam==='quadratic_tangent'){
      const A=pick([1,2,3,-1,-2]),B=nz(-5,5),C=ri(-4,4),x0=pick([-2,-1,0,1,2]),y0=A*x0*x0+B*x0+C,m=2*A*x0+B;
      const correct=pointSlope(y0,String(m),x0),wrong1=pointSlope(y0,String(-m||1),x0);
      return mc(`tnL-q-${A}-${B}-${C}-${x0}`,'quadratic_tangent','Find the equation of the tangent line.',`f(x)=${poly2(A,B,C)},\\qquad x=${x0}`,correct,[wrong1,`y=${m===1?'x':m===-1?'-x':`${m}x`}`,`y=${y0}`],`Differentiate to get \\(f'(x)=${signed(2*A,'x',true)}${signed(B,'')}\\). At \\(x=${x0}\\), the point is \\(${texPoint(x0,y0)}\\) and the tangent slope is \\(${m}\\).`);
    }
    if(fam==='cubic_normal'){
      const A=pick([1,2,-1,-2]),B=pick([-4,-3,-2,2,3,4]),x0=pick([-2,-1,1,2]),y0=A*x0**3+B*x0,m=3*A*x0*x0+B;
      if(m===0)return mc(`tnL-cv-${A}-${B}-${x0}`,'cubic_normal','Find the equation of the normal line.',`f(x)=${signed(A,'x^3',true)}${signed(B,'x')},\\qquad x=${x0}`,`x=${x0}`,[`y=${y0}`,`y=0`,`x=${-x0}`],`The tangent slope is \\(0\\), so the tangent is horizontal and the normal line is vertical through \\(x=${x0}\\).`);
      const nm=texRat(-1,m),correct=pointSlope(y0,nm,x0);
      return mc(`tnL-c-${A}-${B}-${x0}`,'cubic_normal','Find the equation of the normal line.',`f(x)=${signed(A,'x^3',true)}${signed(B,'x')},\\qquad x=${x0}`,correct,[pointSlope(y0,String(m),x0),pointSlope(y0,texRat(1,m),x0),`y=${nm}x`],`The tangent slope is \\(${m}\\), so the normal slope is the negative reciprocal \\(${nm}\\). Use the point \\(${texPoint(x0,y0)}\\).`);
    }
    if(fam==='radical_tangent'){
      const r=ri(2,7),x0=r*r,m=texRat(1,2*r),correct=pointSlope(r,m,x0);
      return mc(`tnL-root-${r}`,'radical_tangent','Find the equation of the tangent line.',`f(x)=\\sqrt{x},\\qquad x=${x0}`,correct,[pointSlope(r,String(2*r),x0),`y=${m}x`,pointSlope(x0,m,r)],`Since \\(f'(x)=\\frac{1}{2\\sqrt{x}}\\), the slope at \\(x=${x0}\\) is \\(${m}\\), and the point is \\(${texPoint(x0,r)}\\).`);
    }
    if(fam==='reciprocal_normal'){
      const a=pick([1,2,3,4,5]),y0=texRat(1,a),tm=texRat(-1,a*a),nm=String(a*a),correct=`y-${y0}=${nm}${a===0?'x':`(x-${a})`}`;
      return mc(`tnL-rec-${a}`,'reciprocal_normal','Find the equation of the normal line.',`f(x)=\\frac{1}{x},\\qquad x=${a}`,correct,[`y-${y0}=${tm}(x-${a})`,`y=${nm}x`,`y-${y0}=-${nm}(x-${a})`],`The tangent slope is \\(-\\frac{1}{${a*a}}\\), so the normal slope is \\(${a*a}\\).`);
    }
    if(fam==='sine_tangent'){
      const k=pick([1,2,3,4,5]),arg=k===1?'x':`${k}x`,correct=k===1?'y=x':`y=${k}x`;
      return mc(`tnL-sin-${k}`,'sine_tangent','Find the equation of the tangent line.',`f(x)=\\sin(${arg}),\\qquad x=0`,correct,[`y=${-k}x`,`y=${k+1}x`,`y=${k}x+1`],`At \\(x=0\\), \\(f(0)=0\\) and \\(f'(0)=${k}\\).`);
    }
    if(fam==='cosine_normal'){
      const k=pick([1,2,3,4]),x0=`\\frac{\\pi}{${2*k}}`,m=-k,nm=texRat(1,k),xf=`(x-${x0})`,correct=`y=${slopeFactor(nm)}${xf}`;
      return mc(`tnL-cos-${k}`,'cosine_normal','Find the equation of the normal line.',`f(x)=\\cos(${k===1?'x':`${k}x`}),\\qquad x=${x0}`,correct,[`y=${slopeFactor(String(m))}${xf}`,`y=-${slopeFactor(nm)}${xf}`,`y=${nm==='1'?'x':`${nm}x`}`],`At \\(x=${x0}\\), the point is on the x-axis and the tangent slope is \\(${-k}\\), so the normal slope is \\(${nm}\\).`);
    }
    if(fam==='exponential_tangent'){
      const k=pick([1,2,3,4]),arg=k===1?'x':`${k}x`,correct=pointSlope(1,String(k),0);
      return mc(`tnL-exp-${k}`,'exponential_tangent','Find the equation of the tangent line.',`f(x)=e^{${arg}},\\qquad x=0`,correct,[pointSlope(1,String(-k),0),`y=${k===1?'x':`${k}x`}`,`y-${k}=x`],`The point is \\((0,1)\\), and \\(f'(0)=${k}\\).`);
    }
    const k=pick([2,3,4,5,6]);
    return mc(`tnL-log-${k}`,'log_tangent','Find the equation of the tangent line.',`f(x)=\\ln(${k}x),\\qquad x=1`,`y-\\ln(${k})=x-1`,[`y-\\ln(${k})=${k}(x-1)`,`y=x`,`y-1=x-\\ln(${k})`],`Because \\(f'(x)=\\frac1x\\), the tangent slope at \\(x=1\\) is \\(1\\).`);
  };

  // Explicit horizontal/vertical tangents: broader families and fully MathJax-safe explanations.
  G['horizontal-and-vertical-tangent-lines']=()=>{
    const fam=pick(['cubic_horizontal','quartic_horizontal','sine_horizontal','cosine_horizontal','rational_horizontal','log_horizontal','exponential_horizontal','cube_root_vertical','fifth_root_vertical','cube_root_plus_linear_vertical']);
    if(fam==='cubic_horizontal'){
      const h=ri(-4,4),r=ri(1,4),c=ri(-5,5),u=xm(h),a=h-r,b=h+r;
      return mc(`hvL-cubic-${h}-${r}-${c}`,'horizontal_cubic','Find all x-values where the graph has horizontal tangents.',`f(x)=(${u})^3-${3*r*r}(${u})${signed(c,'')}`,`x=${a},\\ ${b}`,[`x=${h}`,`x=${a}`,`x=${b}`],`Differentiate: \\(f'(x)=3(${u})^2-${3*r*r}\\). Setting \\(f'(x)=0\\) gives \\(x=${a}\\) and \\(x=${b}\\).`);
    }
    if(fam==='quartic_horizontal'){
      const h=ri(-3,3),r=ri(1,3),c=ri(-4,4),u=xm(h),a=h-r,b=h+r;
      return mc(`hvL-q4-${h}-${r}-${c}`,'horizontal_quartic','Find all x-values where the graph has horizontal tangents.',`f(x)=(${u})^4-${2*r*r}(${u})^2${signed(c,'')}`,`x=${a},\\ ${h},\\ ${b}`,[`x=${a},\\ ${b}`,`x=${h},\\ ${b}`,`x=${a},\\ ${h}`],`Factor \\(f'(x)=4(${u})[(${u})^2-${r*r}]\\). Thus \\(f'(x)=0\\) at \\(x=${a},${h},${b}\\).`);
    }
    if(fam==='sine_horizontal'){
      const A=ri(1,5),c=ri(-4,4);
      return mc(`hvL-sin-${A}-${c}`,'horizontal_trig','On \\([0,2\\pi]\\), where does the graph have horizontal tangents?',`f(x)=${A===1?'':A}\\sin x${signed(c,'')}`,`x=\\frac{\\pi}{2},\\ \\frac{3\\pi}{2}`,[`x=0,\\ \\pi,\\ 2\\pi`,`x=\\pi`,`x=0,\\ 2\\pi`],`Here \\(f'(x)=${A===1?'':A}\\cos x\\). Horizontal tangents occur where \\(\\cos x=0\\).`);
    }
    if(fam==='cosine_horizontal'){
      const A=ri(1,5),c=ri(-4,4);
      return mc(`hvL-cos-${A}-${c}`,'horizontal_trig','On \\([0,2\\pi]\\), where does the graph have horizontal tangents?',`f(x)=${A===1?'':A}\\cos x${signed(c,'')}`,`x=0,\\ \\pi,\\ 2\\pi`,[`x=\\frac{\\pi}{2},\\ \\frac{3\\pi}{2}`,`x=\\pi`,`x=0,\\ 2\\pi`],`Here \\(f'(x)=-${A===1?'':A}\\sin x\\). Horizontal tangents occur where \\(\\sin x=0\\).`);
    }
    if(fam==='rational_horizontal'){
      const r=ri(2,6),a=r*r;
      return mc(`hvL-rat-${r}`,'horizontal_rational','For x>0, where does the graph have a horizontal tangent?',`f(x)=x+\\frac{${a}}{x}`,`x=${r}`,[`x=${a}`,`x=${r+1}`,`x=\\frac1{${r}}`],`Differentiate: \\(f'(x)=1-\\frac{${a}}{x^2}\\). On \\(x>0\\), \\(f'(x)=0\\) at \\(x=${r}\\).`);
    }
    if(fam==='log_horizontal'){
      const a=ri(2,7);
      return mc(`hvL-log-${a}`,'horizontal_logarithmic','Where does the graph have a horizontal tangent?',`f(x)=${a}\\ln x-x`,`x=${a}`,[`x=1`,`x=${a+1}`,`x=\\frac1{${a}}`],`Since \\(f'(x)=\\frac{${a}}x-1\\), the horizontal tangent occurs when \\(x=${a}\\).`);
    }
    if(fam==='exponential_horizontal'){
      const k=ri(1,4),ans=texRat(1,k);
      return mc(`hvL-exp-${k}`,'horizontal_exponential','Where does the graph have a horizontal tangent?',`f(x)=xe^{-${k===1?'x':`${k}x`}}`,`x=${ans}`,[`x=${k}`,`x=1`,`x=-${ans}`],`Using the product rule, \\(f'(x)=e^{-${k===1?'x':`${k}x`}}(1-${k}x)\\). Therefore \\(f'(x)=0\\) at \\(x=${ans}\\).`);
    }
    if(fam==='cube_root_vertical'){
      const h=ri(-6,6),A=ri(1,5),c=ri(-4,4),u=xm(h);
      return mc(`hvL-cuberoot-${h}-${A}-${c}`,'vertical_cube_root','At what x-value does the graph have a vertical tangent?',`f(x)=${A===1?'':A}\\sqrt[3]{${u}}${signed(c,'')}`,`x=${h}`,[`x=${-h}`,`x=${h+1}`,`x=${h-1}`],`The derivative contains a factor of \\(( ${u})^{-2/3}\\), whose magnitude becomes unbounded as \\(x\\to${h}\\).`);
    }
    if(fam==='fifth_root_vertical'){
      const h=ri(-6,6),A=ri(1,5),c=ri(-4,4),u=xm(h);
      return mc(`hvL-fifth-${h}-${A}-${c}`,'vertical_fifth_root','At what x-value does the graph have a vertical tangent?',`f(x)=${A===1?'':A}\\sqrt[5]{${u}}${signed(c,'')}`,`x=${h}`,[`x=${-h}`,`x=${h+1}`,`x=${h-1}`],`The derivative contains \\(( ${u})^{-4/5}\\), so its magnitude becomes unbounded at \\(x=${h}\\).`);
    }
    const h=ri(-5,5),m=nz(-3,3),c=ri(-4,4),u=xm(h);
    return mc(`hvL-rootlin-${h}-${m}-${c}`,'vertical_root_plus_linear','At what x-value does the graph have a vertical tangent?',`f(x)=\\sqrt[3]{${u}}${signed(m,`(${u})`)}${signed(c,'')}`,`x=${h}`,[`x=${-h}`,`x=${h+1}`,`x=${h-1}`],`The linear term has a finite derivative, while the cube-root derivative contains \\(( ${u})^{-2/3}\\). The unbounded term gives a vertical tangent at \\(x=${h}\\).`);
  };

  // Implicit horizontal/vertical tangents: broad curve families, mathematical
  // answer choices, and MathJax-safe worked explanations.
  G['horizontal-and-vertical-tangent-lines-implicitly']=()=>{
    const fam=pick(['ellipse_horizontal','ellipse_vertical','hyperbola_horizontal','hyperbola_vertical','mixed_horizontal','mixed_vertical','cubic_horizontal','cubic_vertical','trig_horizontal','trig_vertical','exponential_vertical','product_horizontal','product_vertical']);
    if(fam==='ellipse_horizontal'||fam==='ellipse_vertical'){
      const a=ri(2,6),b=ri(2,6),A=b*b,B=a*a,K=A*a*a;
      const math=`${A}x^2+${B}y^2=${K}`;
      if(fam==='ellipse_horizontal')return mc(`ihvL-eh-${a}-${b}`,'implicit_ellipse_horizontal','At which points does the curve have horizontal tangents?',math,`(0,\\pm ${b})`,[`(\\pm ${a},0)`,`(0,\\pm ${a})`,`(\\pm ${b},0)`],`Implicit differentiation gives \\(\\frac{dy}{dx}=-\\frac{${A}x}{${B}y}\\). A horizontal tangent requires numerator \\(=0\\) and denominator \\(\\ne0\\), so \\(x=0\\). Substituting into the curve gives \\(y=\\pm${b}\\).`);
      return mc(`ihvL-ev-${a}-${b}`,'implicit_ellipse_vertical','At which points does the curve have vertical tangents?',math,`(\\pm ${a},0)`,[`(0,\\pm ${b})`,`(\\pm ${b},0)`,`(0,\\pm ${a})`],`From \\(\\frac{dy}{dx}=-\\frac{${A}x}{${B}y}\\), a vertical tangent occurs when \\(y=0\\) and \\(x\\ne0\\). Substitution gives \\(x=\\pm${a}\\).`);
    }
    if(fam==='hyperbola_horizontal'){
      const a=ri(2,6),b=ri(2,6),A=a*a,B=b*b,K=A*b*b;
      return mc(`ihvL-hyh-${a}-${b}`,'implicit_hyperbola_horizontal','At which points does the curve have horizontal tangents?',`${A}y^2-${B}x^2=${K}`,`(0,\\pm ${b})`,[`(\\pm ${a},0)`,`(0,\\pm ${a})`,`(\\pm ${b},0)`],`Implicit differentiation gives \\(\\frac{dy}{dx}=\\frac{${B}x}{${A}y}\\). Horizontal tangents require \\(x=0\\), which gives \\(y=\\pm${b}\\).`);
    }
    if(fam==='hyperbola_vertical'){
      const a=ri(2,6),b=ri(2,6),A=b*b,B=a*a,K=A*a*a;
      return mc(`ihvL-hyv-${a}-${b}`,'implicit_hyperbola_vertical','At which points does the curve have vertical tangents?',`${A}x^2-${B}y^2=${K}`,`(\\pm ${a},0)`,[`(0,\\pm ${b})`,`(\\pm ${b},0)`,`(0,\\pm ${a})`],`Implicit differentiation gives \\(\\frac{dy}{dx}=\\frac{${A}x}{${B}y}\\). Vertical tangents require \\(y=0\\), which gives \\(x=\\pm${a}\\).`);
    }
    if(fam==='mixed_horizontal'||fam==='mixed_vertical'){
      const a=ri(1,4),K=3*a*a,ap=String(a),an=String(-a),two=2*a;
      if(fam==='mixed_horizontal')return mc(`ihvL-mh-${a}`,'implicit_mixed_quadratic_horizontal','At which points does the curve have horizontal tangents?',`x^2+xy+y^2=${K}`,`(${a},${-two}),\\ (${-a},${two})`,[`(${two},${-a}),\\ (${-two},${a})`,`(0,${a}),\\ (0,${-a})`,`(${a},0),\\ (${-a},0)`],`Differentiating gives \\(2x+y+(x+2y)\\frac{dy}{dx}=0\\), so \\(\\frac{dy}{dx}=-\\frac{2x+y}{x+2y}\\). Horizontal tangents satisfy \\(2x+y=0\\); together with the curve this gives the two listed points.`);
      return mc(`ihvL-mv-${a}`,'implicit_mixed_quadratic_vertical','At which points does the curve have vertical tangents?',`x^2+xy+y^2=${K}`,`(${two},${-a}),\\ (${-two},${a})`,[`(${a},${-two}),\\ (${-a},${two})`,`(0,${a}),\\ (0,${-a})`,`(${a},0),\\ (${-a},0)`],`Here \\(\\frac{dy}{dx}=-\\frac{2x+y}{x+2y}\\). Vertical tangents satisfy \\(x+2y=0\\) while the numerator is nonzero; solving with the curve gives the two listed points.`);
    }
    if(fam==='cubic_horizontal'){
      const c=ri(2,6),K=c**3;
      return mc(`ihvL-cubh-${c}`,'implicit_cubic_horizontal','At which point does the curve have a horizontal tangent?',`x^3+y^3=${K}`,`(0,${c})`,[`(${c},0)`,`(0,-${c})`,`(-${c},0)`],`Implicit differentiation gives \\(\\frac{dy}{dx}=-\\frac{x^2}{y^2}\\). The slope is zero when \\(x=0\\) and \\(y\\ne0\\), giving \\((0,${c})\\).`);
    }
    if(fam==='cubic_vertical'){
      const c=ri(2,6),K=c**3;
      return mc(`ihvL-cubv-${c}`,'implicit_cubic_vertical','At which point does the curve have a vertical tangent?',`x^3+y^3=${K}`,`(${c},0)`,[`(0,${c})`,`(0,-${c})`,`(-${c},0)`],`Since \\(\\frac{dy}{dx}=-\\frac{x^2}{y^2}\\), the derivative is undefined with nonzero numerator at \\(( ${c},0)\\), giving a vertical tangent.`);
    }
    if(fam==='trig_horizontal')return mc('ihvL-trigh','implicit_trig_horizontal','Which listed point has a horizontal tangent?',`\\sin x+\\cos y=1`,`(\\frac{\\pi}{2},\\frac{\\pi}{2})`,[`(0,0)`,`(\\pi,0)`,`(2\\pi,0)`],`Implicit differentiation gives \\(\\frac{dy}{dx}=\\frac{\\cos x}{\\sin y}\\). At \\((\\frac{\\pi}{2},\\frac{\\pi}{2})\\), the numerator is zero and the denominator is nonzero.`);
    if(fam==='trig_vertical')return mc('ihvL-trigv','implicit_trig_vertical','Which listed point has a vertical tangent?',`\\sin x+\\cos y=1`,`(0,0)`,[`(\\frac{\\pi}{2},\\frac{\\pi}{2})`,`(\\frac{\\pi}{6},\\frac{\\pi}{3})`,`(\\frac{5\\pi}{6},\\frac{\\pi}{3})`],`Here \\(\\frac{dy}{dx}=\\frac{\\cos x}{\\sin y}\\). At \\((0,0)\\), the denominator is zero while the numerator is nonzero, so the tangent is vertical.`);
    if(fam==='exponential_vertical')return mc('ihvL-expv','implicit_exponential_vertical','At which point does the curve have a vertical tangent?',`e^x+y^2=2`,`(\\ln 2,0)`,[`(0,1)`,`(0,-1)`,`(1,0)`],`Implicit differentiation gives \\(\\frac{dy}{dx}=-\\frac{e^x}{2y}\\). The denominator is zero at \\(y=0\\); the curve then requires \\(e^x=2\\), so \\(x=\\ln2\\).`);
    if(fam==='product_horizontal'){
      const k=ri(2,7);
      return mc(`ihvL-prodh-${k}`,'implicit_product_horizontal','At which point does the curve have a horizontal tangent?',`y(x^2+1)=${k}`,`(0,${k})`,[`(${k},0)`,`(1,${texRat(k,2)})`,`(-1,${texRat(k,2)})`],`Differentiating gives \\((x^2+1)\\frac{dy}{dx}+2xy=0\\), so \\(\\frac{dy}{dx}=-\\frac{2xy}{x^2+1}\\). Since the denominator is never zero, a horizontal tangent occurs at \\(x=0\\), giving \\(y=${k}\\).`);
    }
    const k=ri(2,7);
    return mc(`ihvL-prodv-${k}`,'implicit_product_vertical','At which point does the curve have a vertical tangent?',`x(y^2+1)=${k}`,`(${k},0)`,[`(0,${k})`,`(${texRat(k,2)},1)`,`(${texRat(k,2)},-1)`],`Differentiating gives \\(y^2+1+2xy\\frac{dy}{dx}=0\\), so \\(\\frac{dy}{dx}=-\\frac{y^2+1}{2xy}\\). The denominator is zero at \\(y=0\\), and the curve then gives \\(x=${k}\\).`);
  };
})();



// v10.6.3.M — Unit 3 manual-review rebuilds: assignment fidelity, variety, concavity reasoning, and numeric motion choices.
(function v1063MUnit3Rebuild(){
  const idn=n=>n<0?`m${-n}`:`p${n}`;
  const plus=n=>n===0?'':n>0?`+${n}`:`-${-n}`;
  const shift=h=>h===0?'x':h>0?`x-${h}`:`x+${-h}`;
  const interval=(a,b)=>`(${a},${b})`;
  const outside=(a,b)=>`(-\\infty,${a})\\cup(${b},\\infty)`;
  const texN=x=>Number.isInteger(x)?String(x):String(Number(x.toFixed(4)));
  const numWrongs=(ans,step=1)=>{
    const vals=[]; const add=v=>{const t=texN(v);if(t!==texN(ans)&&!vals.includes(t))vals.push(t)};
    [ans+step,ans-step,-ans,ans+2*step,ans-2*step,ans*2,ans/2,ans+3*step].forEach(add);
    return vals.slice(0,3);
  };
  const numericMC=(id,variant,prompt,math,ans,explanation,step=1)=>mc(id,variant,prompt,math,texN(ans),numWrongs(ans,step),explanation);
  const texPointSlope=(m,x0,y0)=>{
    const ys=y0===0?'y':y0>0?`y-${y0}`:`y+${-y0}`;
    const xs=x0===0?'x':x0>0?`(x-${x0})`:`(x+${-x0})`;
    const mt=m===1?'':m===-1?'-':String(m);
    return `${ys}=${mt}${xs}`;
  };

  // Motion: differentiation-based numeric questions only, with four genuinely numeric choices.
  G['motion']=()=>{
    const fam=pick(['pos_cubic','pos_quartic','pos_trig','pos_exp','vel_quad','vel_trig','vel_exp','rest_time','height_velocity','projectile_max']);
    if(fam==='pos_cubic'){
      const A=nz(-3,3),B=nz(-6,6),C=ri(-6,6),t=ri(0,3),ask=pick(['velocity','acceleration','speed']);
      const v=3*A*t*t+2*B*t+C,a=6*A*t+2*B,ans=ask==='velocity'?v:ask==='acceleration'?a:Math.abs(v);
      return numericMC(`motM-pc-${A}-${B}-${C}-${t}-${ask}`,`position_${ask}`,`A particle has position \\(s(t)\\). Find its ${ask} at \\(t=${t}\\).`,`s(t)=${signed(A,'t^3',true)}${signed(B,'t^2')}${signed(C,'t')}`,ans,`Differentiate \\(s(t)\\) to get velocity, and differentiate velocity to get acceleration.${ask==='speed'?' Speed is the absolute value of velocity.':''}`,2);
    }
    if(fam==='pos_quartic'){
      const A=nz(-2,2),B=nz(-4,4),C=ri(-5,5),t=ri(0,2),ask=pick(['velocity','acceleration','speed']);
      const v=4*A*t**3+3*B*t*t+C,a=12*A*t*t+6*B*t,ans=ask==='velocity'?v:ask==='acceleration'?a:Math.abs(v);
      return numericMC(`motM-pq-${A}-${B}-${C}-${t}-${ask}`,`position_${ask}`,`A particle has position \\(s(t)\\). Find its ${ask} at \\(t=${t}\\).`,`s(t)=${signed(A,'t^4',true)}${signed(B,'t^3')}${signed(C,'t')}`,ans,`Use \\(v(t)=s'(t)\\) and \\(a(t)=v'(t)\\).${ask==='speed'?' Then take \\(|v(t)|\\).':''}`,2);
    }
    if(fam==='pos_trig'){
      const k=ri(1,5),ask=pick(['velocity','acceleration','speed']),at=pick(['zero','quarter']);
      const tTex=at==='zero'?'0':`\\frac{\\pi}{${2*k}}`,v=at==='zero'?k:0,a=at==='zero'?0:-k*k,ans=ask==='velocity'?v:ask==='acceleration'?a:Math.abs(v);
      return numericMC(`motM-pt-${k}-${ask}-${at}`,`trig_position_${ask}`,`A particle has position \\(s(t)\\). Find its ${ask} at \\(t=${tTex}\\).`,`s(t)=\\sin(${k===1?'t':`${k}t`})`,ans,`Differentiate the position function. \\(v(t)=${k===1?'':k}\\cos(${k===1?'t':`${k}t`})\\), and acceleration is the derivative of velocity.`,Math.max(1,k));
    }
    if(fam==='pos_exp'){
      const k=ri(1,4),A=ri(1,5),ask=pick(['velocity','acceleration','speed']),v=A*k,a=A*k*k,ans=ask==='acceleration'?a:v;
      return numericMC(`motM-pe-${A}-${k}-${ask}`,`exponential_position_${ask}`,`A particle has position \\(s(t)\\). Find its ${ask} at \\(t=0\\).`,`s(t)=${A===1?'':A}e^{${k===1?'t':`${k}t`}}`,ans,`Differentiate the position function and use \\(e^0=1\\).${ask==='speed'?' Speed is \\(|v(0)|\\).':''}`,Math.max(1,k));
    }
    if(fam==='vel_quad'){
      const A=nz(-4,4),B=nz(-7,7),C=ri(-7,7),t=ri(0,3),ask=pick(['acceleration','speed']),v=A*t*t+B*t+C,a=2*A*t+B,ans=ask==='acceleration'?a:Math.abs(v);
      return numericMC(`motM-vq-${A}-${B}-${C}-${t}-${ask}`,`velocity_${ask}`,`A particle has velocity \\(v(t)\\). Find its ${ask} at \\(t=${t}\\).`,`v(t)=${signed(A,'t^2',true)}${signed(B,'t')}${signed(C,'')}`,ans,ask==='acceleration'?`Differentiate velocity: \\(a(t)=v'(t)\\).`:`Evaluate velocity and take its absolute value to get speed.`,2);
    }
    if(fam==='vel_trig'){
      const A=nz(-6,6),k=ri(1,4),at=pick(['zero','quarter']),ask=pick(['acceleration','speed']),tTex=at==='zero'?'0':`\\frac{\\pi}{${2*k}}`,v=at==='zero'?0:A,a=at==='zero'?A*k:0,ans=ask==='acceleration'?a:Math.abs(v);
      return numericMC(`motM-vt-${A}-${k}-${at}-${ask}`,`trig_velocity_${ask}`,`A particle has velocity \\(v(t)\\). Find its ${ask} at \\(t=${tTex}\\).`,`v(t)=${A===1?'':A===-1?'-':A}\\sin(${k===1?'t':`${k}t`})`,ans,ask==='acceleration'?`Differentiate \\(v(t)\\) and evaluate.`:`Speed is \\(|v(t)|\\).`,Math.max(1,k));
    }
    if(fam==='vel_exp'){
      const A=nz(-6,6),k=ri(1,4),ask=pick(['acceleration','speed']),v=A,a=A*k,ans=ask==='acceleration'?a:Math.abs(v);
      return numericMC(`motM-ve-${A}-${k}-${ask}`,`exponential_velocity_${ask}`,`A particle has velocity \\(v(t)\\). Find its ${ask} at \\(t=0\\).`,`v(t)=${A===1?'':A===-1?'-':A}e^{${k===1?'t':`${k}t`}}`,ans,ask==='acceleration'?`Differentiate velocity and evaluate at \\(t=0\\).`:`Evaluate \\(v(0)\\) and take its absolute value.`,Math.max(1,k));
    }
    if(fam==='rest_time'){
      const r=ri(1,6),s=ri(1,5),A=nz(-4,4);
      return numericMC(`motM-rest-${A}-${r}-${s}`,'rest_time_numeric','At what positive time is the particle at rest?',`v(t)=${A===1?'':A===-1?'-':A}(t-${r})(t+${s})`,r,`A particle is at rest when \\(v(t)=0\\). The roots are \\(t=${r}\\) and \\(t=-${s}\\), so the positive time is \\(t=${r}\\).`,1);
    }
    if(fam==='height_velocity'){
      const B=pick([2,4,6,8]),C=ri(2,12),t0=ri(2,6),height=t0*t0+B*t0+C,ans=2*t0+B;
      return numericMC(`motM-height-${B}-${C}-${t0}`,'velocity_at_position','A balloon has the given height function for \\(t\ge0\\). Find its velocity when it is at the indicated height.',`s(t)=t^2+${B}t+${C},\\qquad s(t)=${height}`,ans,`Because \\(s(t)\\) is increasing for \\(t\ge0\\), the stated height occurs at \\(t=${t0}\\). Then \\(v(t)=2t+${B}\\), so the velocity is \\(${ans}\\).`,2);
    }
    const V=32*ri(3,8),h=ri(0,20),tmax=V/32,ans=-16*tmax*tmax+V*tmax+h;
    return numericMC(`motM-proj-${V}-${h}`,'projectile_maximum_altitude','Find the maximum altitude of the object.',`s(t)=-16t^2+${V}t+${h}`,ans,`At maximum altitude, \\(v(t)=s'(t)=-32t+${V}=0\\), so \\(t=${tmax}\\). Evaluate the position there.`,16);
  };

  // Absolute/local extrema: broad function families, no absolute-value functions, and a true mix of absolute and local questions.
  G['absolute-and-local-extrema-and-the-extreme-value-theorem']=()=>{
    const fam=pick(['abs_cubic','abs_quartic','abs_rational','abs_radical','abs_trig','abs_exp','local_cubic','local_quartic','local_exp','local_log','local_trig','local_rational']);
    if(fam==='abs_cubic'){
      const r=ri(1,4),k=ri(-6,6),want=pick(['maximum','minimum']),f=x=>x**3-3*r*r*x+k,L=-2*r,U=2*r,pts=[L,-r,r,U],vals=pts.map(f),ans=want==='maximum'?Math.max(...vals):Math.min(...vals);
      return numericMC(`extM-ac-${r}-${idn(k)}-${want}`,'absolute_cubic',`Find the absolute ${want} value on the given closed interval.`,`f(x)=x^3-${3*r*r}x${plus(k)},\\quad [${L},${U}]`,ans,`Find the critical numbers from \\(f'(x)=3x^2-${3*r*r}\\), then compare the function values at those critical numbers and both endpoints.`,Math.max(1,r));
    }
    if(fam==='abs_quartic'){
      const r=ri(1,3),k=ri(-5,5),want=pick(['maximum','minimum']),max=8*r**4+k,min=k-r**4,ans=want==='maximum'?max:min;
      return numericMC(`extM-aq-${r}-${idn(k)}-${want}`,'absolute_quartic',`Find the absolute ${want} value on the given closed interval.`,`f(x)=x^4-${2*r*r}x^2${plus(k)},\\quad [${-2*r},${2*r}]`,ans,`The derivative factors as \\(4x(x^2-${r*r})\\). Compare the values at \\(x=0,\\pm${r}\\) and the endpoints.`,Math.max(1,r));
    }
    if(fam==='abs_rational'){
      const r=ri(2,6),b=r+ri(2,5),ans=2*r;
      return numericMC(`extM-ar-${r}-${b}`,'absolute_rational','Find the absolute minimum value on the given closed interval.',`f(x)=x+\\frac{${r*r}}{x},\\quad [1,${b}]`,ans,`On this positive interval, \\(f'(x)=1-${r*r}/x^2\\), so the interior critical point is \\(x=${r}\\). Compare it with both endpoints.`,1);
    }
    if(fam==='abs_radical'){
      const Rr=ri(2,7),h=ri(-4,4),k=ri(-4,5),want=pick(['maximum','minimum']),ans=want==='maximum'?Rr+k:k;
      return numericMC(`extM-root-${Rr}-${idn(h)}-${idn(k)}-${want}`,'absolute_radical',`Find the absolute ${want} value on the given closed interval.`,`f(x)=\\sqrt{${Rr*Rr}-(x${h===0?'':h>0?`-${h}`:`+${-h}`})^2}${plus(k)},\\quad [${h-Rr},${h+Rr}]`,ans,`The graph is the upper half of a circle shifted horizontally and vertically. The center gives the largest value and the endpoints give the smallest value.`,1);
    }
    if(fam==='abs_trig'){
      const [A,B,Rr]=pick([[3,4,5],[4,3,5],[5,12,13],[12,5,13]]),k=ri(-5,5),want=pick(['maximum','minimum']),ans=want==='maximum'?Rr+k:k-Rr;
      return numericMC(`extM-trig-${A}-${B}-${idn(k)}-${want}`,'absolute_trig_combination',`Find the absolute ${want} value on \\([0,2\\pi]\\).`,`f(x)=${A}\\sin x+${B}\\cos x${plus(k)}`,ans,`A linear combination \\(A\\sin x+B\\cos x\\) has amplitude \\(\\sqrt{A^2+B^2}=${Rr}\\). Use that amplitude to determine the extreme value.`,1);
    }
    if(fam==='abs_exp'){
      const h=ri(-2,3);const correct='\\frac1e';
      return mc(`extM-aexp-${idn(h)}`,'absolute_exponential_product','Find the absolute maximum value on the given closed interval.',`f(x)=(x${h===0?'':h>0?`-${h}`:`+${-h}`})e^{-(x${h===0?'':h>0?`-${h}`:`+${-h}`})},\\quad [${h},${h+3}]`,correct,['0','1','\\frac{3}{e^3}'],`Let \\(u=${shift(h)}\\). Then \\(f'(x)=e^{-u}(1-u)\\), so the interior critical point is \\(u=1\\), where the maximum value is \\(1/e\\).`);
    }
    if(fam==='local_cubic'){
      const h=ri(-4,4),r=ri(1,4),which=pick(['maximum','minimum']),x=which==='maximum'?h-r:h+r;
      return numericMC(`extM-lc-${idn(h)}-${r}-${which}`,'local_cubic',`At what x-value does \\(f\\) have a local ${which}?`,`f(x)=(${shift(h)})^3-${3*r*r}(${shift(h)})`,x,`The critical numbers are \\(x=${h-r}\\) and \\(x=${h+r}\\). A sign chart for \\(f'\\) identifies the local maximum and minimum.`,1);
    }
    if(fam==='local_quartic'){
      const h=ri(-3,3),r=ri(1,3),which=pick(['maximum','minimum']);
      if(which==='maximum')return numericMC(`extM-lqmax-${idn(h)}-${r}`,'local_quartic_max','At what x-value does \\(f\\) have a local maximum?',`f(x)=(${shift(h)})^4-${2*r*r}(${shift(h)})^2`,h,`The derivative is \\(4(${shift(h)})[(${shift(h)})^2-${r*r}]\\). The middle critical point is a local maximum.`,1);
      return mc(`extM-lqmin-${idn(h)}-${r}`,'local_quartic_min','At which x-values does \\(f\\) have local minima?',`f(x)=(${shift(h)})^4-${2*r*r}(${shift(h)})^2`,`${h-r}, ${h+r}`,[String(h),`${h-r}, ${h}`,`${h}, ${h+r}`],`The derivative changes from negative to positive at \\(x=${h-r}\\) and \\(x=${h+r}\\).`);
    }
    if(fam==='local_exp'){
      const a=ri(-2,5),x=a-1;
      return numericMC(`extM-lexp-${idn(a)}`,'local_exponential_product','At what x-value does \\(f\\) have a local minimum?',`f(x)=(${shift(a)})e^x`,x,`Since \\(f'(x)=e^x(${shift(a-1)})\\) and \\(e^x>0\\), the derivative changes from negative to positive at \\(x=${x}\\).`,1);
    }
    if(fam==='local_log'){
      const h=ri(-4,4),d=ri(1,6),inside=`x^2${h?`${-2*h>=0?'+':''}${-2*h}x`:''}+${h*h+d}`;
      return numericMC(`extM-llog-${idn(h)}-${d}`,'local_logarithm','At what x-value does \\(f\\) have a local minimum?',`f(x)=\\ln(${inside})`,h,`The logarithm is increasing, and its positive quadratic argument has its minimum at \\(x=${h}\\). Equivalently, \\(f'(x)\\) changes from negative to positive there.`,1);
    }
    if(fam==='local_trig'){
      const A=ri(1,5),which=pick(['maximum','minimum']),ans=which==='maximum'?'\\frac{\\pi}{2}':'\\frac{3\\pi}{2}';
      return mc(`extM-ltrig-${A}-${which}`,'local_trig',`On \\((0,2\\pi)\\), where does \\(f\\) have a local ${which}?`,`f(x)=${A===1?'':A}\\sin x`,ans,[which==='maximum'?'\\frac{3\\pi}{2}':'\\frac{\\pi}{2}','\\pi','2\\pi'],`Use \\(f'(x)=${A===1?'':A}\\cos x\\) and the sign changes at its zeros.`);
    }
    const r=ri(2,7);
    return numericMC(`extM-lrat-${r}`,'local_rational',`At what x-value does \\(f\\) have a local minimum on \\((0,\\infty)\\)?`,`f(x)=x+\\frac{${r*r}}x`,r,`Set \\(f'(x)=1-${r*r}/x^2=0\\). On the positive domain, the derivative changes from negative to positive at \\(x=${r}\\).`,1);
  };

  // Increasing/decreasing/concavity: about 10% already factored; most require differentiating f or f'.
  G['increasing-decreasing-intervals-concavity-and-extrema']=()=>{
    const fam=pick(['f_cubic_inc','f_quartic_dec','f_rational_inc','f_log_inc','f_trig_inc','f_exp_inc','fp_quad_inc','fp_cubic_conc','fpp_quad_conc','f_quartic_conc','f_rational_conc','fp_local_extrema','factored_fp']);
    if(fam==='f_cubic_inc'){
      const r=ri(1,5),k=ri(-5,5);return mc(`curveM-fc-${r}-${idn(k)}`,'f_given_increasing','Where is \\(f\\) increasing?',`f(x)=x^3-${3*r*r}x${plus(k)}`,outside(-r,r),[interval(-r,r),`(-\\infty,${r})`,`(${-r},\\infty)`],`Differentiate first: \\(f'(x)=3x^2-${3*r*r}\\). A sign chart shows \\(f'(x)>0\\) outside \\(x=\\pm${r}\\).`);
    }
    if(fam==='f_quartic_dec'){
      const r=ri(1,4),k=ri(-4,4);return mc(`curveM-fq-${r}-${idn(k)}`,'f_given_decreasing','Where is \\(f\\) decreasing?',`f(x)=x^4-${2*r*r}x^2${plus(k)}`,`(-\\infty,-${r})\\cup(0,${r})`,[`(-${r},0)\\cup(${r},\\infty)`,outside(-r,r),`(-${r},${r})`],`Differentiate: \\(f'(x)=4x(x^2-${r*r})\\). Use the three critical numbers \\(-${r},0,${r}\\) in a sign chart.`);
    }
    if(fam==='f_rational_inc'){
      const r=ri(2,7);return mc(`curveM-fr-${r}`,'f_given_rational_increasing','On \\((0,\\infty)\\), where is \\(f\\) increasing?',`f(x)=x+\\frac{${r*r}}x`,`(${r},\\infty)`,[`(0,${r})`,`(0,\\infty)`,`(-\\infty,-${r})\\cup(${r},\\infty)`],`Differentiate: \\(f'(x)=1-${r*r}/x^2\\). On the stated positive domain, \\(f'(x)>0\\) when \\(x>${r}\\).`);
    }
    if(fam==='f_log_inc'){
      const h=ri(-4,4),d=ri(1,6),B=-2*h,C=h*h+d,inside=`x^2${B?`${B>0?'+':''}${B}x`:''}+${C}`;
      return mc(`curveM-flog-${idn(h)}-${d}`,'f_given_log_increasing','Where is \\(f\\) increasing?',`f(x)=\\ln(${inside})`,`(${h},\\infty)`,[`(-\\infty,${h})`,`(-\\infty,${h})\\cup(${h},\\infty)`,`(${h-1},${h+1})`],`The quadratic argument is always positive. \\(f'(x)=\\frac{2(${shift(h)})}{${inside}}\\), so the sign is determined by \\(${shift(h)}\\).`);
    }
    if(fam==='f_trig_inc'){
      return mc('curveM-ftrig','f_given_trig_increasing','On \\([0,2\\pi]\\), where is \\(f\\) increasing?',`f(x)=\\sin(2x)`,`(0,\\frac{\\pi}{4})\\cup(\\frac{3\\pi}{4},\\frac{5\\pi}{4})\\cup(\\frac{7\\pi}{4},2\\pi)`,[`(\\frac{\\pi}{4},\\frac{3\\pi}{4})\\cup(\\frac{5\\pi}{4},\\frac{7\\pi}{4})`,`(0,\\pi)`,`(\\frac{\\pi}{2},\\frac{3\\pi}{2})`],`Differentiate: \\(f'(x)=2\\cos(2x)\\). Determine where cosine is positive over the stated interval.`);
    }
    if(fam==='f_exp_inc'){
      const a=ri(-2,6),c=a-1;return mc(`curveM-fexp-${idn(a)}`,'f_given_exponential_increasing','Where is \\(f\\) increasing?',`f(x)=(${shift(a)})e^x`,`(${c},\\infty)`,[`(-\\infty,${c})`,`(-\\infty,${a})`,`(${a},\\infty)`],`Differentiate: \\(f'(x)=e^x(${shift(c)})\\). Since \\(e^x>0\\), only the linear factor controls the sign.`);
    }
    if(fam==='fp_quad_inc'){
      const r1=ri(-6,-1),r2=ri(1,6),S=r1+r2,P=r1*r2;return mc(`curveM-fpq-${idn(r1)}-${r2}`,'first_derivative_given_increasing','Where is \\(f\\) increasing?',`f'(x)=x^2${S?`${-S>=0?'+':''}${-S}x`:''}${P?`${P>0?'+':''}${P}`:''}`,outside(r1,r2),[interval(r1,r2),`(-\\infty,${r2})`,`(${r1},\\infty)`],`The given derivative is not factored. Find its zeros \\(${r1}\\) and \\(${r2}\\), then use a sign chart for \\(f'\\).`);
    }
    if(fam==='fp_cubic_conc'){
      const r=ri(1,5),k=ri(-5,5);return mc(`curveM-fpc-${r}-${idn(k)}`,'first_derivative_given_concavity','Where is \\(f\\) concave up?',`f'(x)=x^3-${3*r*r}x${plus(k)}`,outside(-r,r),[interval(-r,r),`(-\\infty,${r})`,`(${-r},\\infty)`],`Differentiate the given \\(f'\\): \\(f''(x)=3x^2-${3*r*r}\\). Concavity is determined by the sign of \\(f''\\).`);
    }
    if(fam==='fpp_quad_conc'){
      const r1=ri(-6,-1),r2=ri(1,6),S=r1+r2,P=r1*r2;return mc(`curveM-fppq-${idn(r1)}-${r2}`,'second_derivative_given_concavity','Where is \\(f\\) concave down?',`f''(x)=x^2${S?`${-S>=0?'+':''}${-S}x`:''}${P?`${P>0?'+':''}${P}`:''}`,interval(r1,r2),[outside(r1,r2),`(-\\infty,${r2})`,`(${r1},\\infty)`],`Find the zeros of the given second derivative, then determine where \\(f''(x)<0\\).`);
    }
    if(fam==='f_quartic_conc'){
      const r=ri(1,4),k=ri(-5,5);return mc(`curveM-fqc-${r}-${idn(k)}`,'f_given_concavity_hard','Where is \\(f\\) concave up?',`f(x)=x^4-${6*r*r}x^2${plus(k)}`,outside(-r,r),[interval(-r,r),`(-\\infty,${r})`,`(${-r},\\infty)`],`Differentiate twice. \\(f''(x)=12x^2-${12*r*r}\\), so \\(f''(x)>0\\) outside \\(x=\\pm${r}\\).`);
    }
    if(fam==='f_rational_conc'){
      const h=ri(-4,4),sh=shift(h);return mc(`curveM-frc-${idn(h)}`,'f_given_rational_concavity','Where is \\(f\\) concave up?',`f(x)=\\frac1{${sh}}`,`(${h},\\infty)`,[`(-\\infty,${h})`,outside(h-1,h+1),`(-\\infty,\\infty)`],`Differentiate twice: \\(f''(x)=\\frac{2}{(${sh})^3}\\). Its sign is positive to the right of the vertical asymptote and negative to the left.`);
    }
    if(fam==='fp_local_extrema'){
      const r1=ri(-6,-1),r2=ri(1,6),S=r1+r2,P=r1*r2,which=pick(['maximum','minimum']),ans=which==='maximum'?r1:r2;
      return numericMC(`curveM-fpext-${idn(r1)}-${r2}-${which}`,'first_derivative_given_local_extrema',`At what x-value does \\(f\\) have a local ${which}?`,`f'(x)=x^2${S?`${-S>=0?'+':''}${-S}x`:''}${P?`${P>0?'+':''}${P}`:''}`,ans,`Find the two zeros of \\(f'\\). For this upward-opening quadratic derivative, the sign changes \\(+\to-\\) at the smaller zero and \\(-\to+\\) at the larger zero.`,1);
    }
    const r1=ri(-6,-1),r2=ri(1,6);return mc(`curveM-fact-${idn(r1)}-${r2}`,'factored_first_derivative','Where is \\(f\\) increasing?',`f'(x)=(${shift(r1)})(${shift(r2)})`,outside(r1,r2),[interval(r1,r2),`(-\\infty,${r2})`,`(${r1},\\infty)`],`This is the small factored portion of the pool. Use the zeros and a sign chart for \\(f'\\).`);
  };

  // Linearization/differentials rebuilt directly around the Unit 3 assignments.
  G['linearization-and-differentials']=()=>{
    const fam=pick(['lin_sqrt','lin_cuberoot','lin_log','lin_sine','lin_tangent','diff_poly','diff_trig_comp','diff_implicit','diff_sphere','diff_triangle','diff_sin_degrees']);
    if(fam==='lin_sqrt'){
      const r=ri(3,10),a=r*r,d=pick([-2,-1,1,2]),x=a+d,ans=r+d/(2*r);return numericMC(`linM-sqrt-${r}-${d}`,'linearization_square_root','Use linearization to approximate the value.',`\\sqrt{${x}}`,ans,`Use \\(f(x)=\\sqrt{x}\\) at the nearby perfect square \\(a=${a}\\): \\(L(x)=f(a)+f'(a)(x-a)\\).`,0.05);
    }
    if(fam==='lin_cuberoot'){
      const r=pick([4,5,10]),a=r**3,d=pick([-3,-1,1,3]),x=a+d,ans=r+d/(3*r*r);return numericMC(`linM-cube-${r}-${d}`,'linearization_cube_root','Use linearization to approximate the value.',`\\sqrt[3]{${x}}`,ans,`Linearize \\(f(x)=\\sqrt[3]{x}\\) at \\(a=${a}\\), where \\(f(a)=${r}\\) and \\(f'(a)=1/${3*r*r}\\).`,0.01);
    }
    if(fam==='lin_log'){
      const h=pick([-0.08,-0.05,0.04,0.07]),x=1+h,ans=h;return numericMC(`linM-log-${String(h).replace('.','_')}`,'linearization_logarithm','Use linearization at \\(x=1\\) to approximate the value.',`\\ln(${texN(x)})`,ans,`For \\(f(x)=\\ln x\\), \\(f(1)=0\\) and \\(f'(1)=1\\), so \\(L(x)=x-1\\).`,0.02);
    }
    if(fam==='lin_sine'){
      const h=pick([0.05,0.1,-0.05,-0.1]);return numericMC(`linM-sin-${String(h).replace('.','_')}`,'linearization_sine','Use linearization at \\(x=0\\) to approximate the value.',`\\sin(${h})`,h,`Since \\(\\sin0=0\\) and \\(\\cos0=1\\), the linearization is \\(L(x)=x\\).`,0.02);
    }
    if(fam==='lin_tangent'){
      const h=pick([0.02,0.04,-0.02]),target=Math.PI/4+h,ans=1+2*h;return numericMC(`linM-tan-${String(h).replace('.','_')}`,'linearization_tangent','Use linearization at \\(x=\\pi/4\\) to approximate the value.',`\\tan(\\frac{\\pi}{4}${h>=0?'+':'-'}${Math.abs(h)})`,ans,`At \\(a=\\pi/4\\), \\(\\tan a=1\\) and \\(\\sec^2a=2\\), so \\(L(x)=1+2(x-a)\\).`,0.02);
    }
    if(fam==='diff_poly'){
      const n=ri(2,4),x=ri(1,5),dx=pick([0.01,0.02,-0.01,-0.02]),A=nz(-3,4),B=nz(-5,5),dy=(A*n*x**(n-1)+B)*dx;
      return numericMC(`diffM-poly-${n}-${x}-${String(dx).replace('.','_')}-${A}-${B}`,'differential_polynomial',`Use differentials to find \\(dy\\).`,`y=${signed(A,`x^${n}`,true)}${signed(B,'x')},\\quad x=${x},\\quad dx=${dx}`,dy,`Compute \\(dy=f'(x)\\,dx\\) at the stated x-value.`,Math.max(0.01,Math.abs(dx)));
    }
    if(fam==='diff_trig_comp'){
      const x=1,dx=pick([0.01,-0.01,0.02]),k=ri(1,4),arg=x*x-1,dy=Math.cos(arg)*2*x*dx;
      return numericMC(`diffM-trig-${k}-${String(dx).replace('.','_')}`,'differential_trig_composition',`Use differentials to find \\(dy\\).`,`y=\\sin(x^2-1),\\quad x=1,\\quad dx=${dx}`,dy,`Differentiate first: \\(dy=2x\\cos(x^2-1)\\,dx\\). At \\(x=1\\), the cosine factor is \\(1\\).`,0.01);
    }
    if(fam==='diff_implicit'){
      const dx=-0.02,dy=0.032;return mc('diffM-implicit','differential_implicit','Use differentials to find \\(dy\\).',`5+x^2y=y+x^3y,\\quad x=2,\\quad dx=-0.02`,'0.032',['-0.032','0.016','-0.016'],`The equation gives \\(y=1\\) at \\(x=2\\). Implicit differentiation gives \\(dy/dx=-8/5\\) there, so \\(dy\\approx(dy/dx)dx=(-8/5)(-0.02)=0.032\\).`);
    }
    if(fam==='diff_sphere'){
      const r=ri(3,8),dr=pick([0.01,0.05,0.1]),coef=4*r*r*dr,ans=`${texN(coef)}\\pi`;
      return mc(`diffM-sphere-${r}-${String(dr).replace('.','_')}`,'differential_sphere','Estimate the change in volume using differentials.',`V=\\frac43\\pi r^3,\\quad r=${r},\\quad dr=${dr}`,ans,[`${texN(3*r*r*dr)}\\pi`,`${texN(4*r*dr)}\\pi`,`${texN(4*r*r*dr+dr)}\\pi`],`Use \\(dV=4\\pi r^2\\,dr\\).`);
    }
    if(fam==='diff_triangle'){
      const s=pick([6,8,9,10]),ds=pick([-0.1,-0.2,0.1]),coef=s*ds/2,ans=`${texN(coef)}\\sqrt3`;
      return mc(`diffM-tri-${s}-${String(ds).replace('.','_')}`,'differential_equilateral_triangle','Estimate the change in area of an equilateral triangle.',`A=\\frac{\\sqrt3}{4}s^2,\\quad s=${s},\\quad ds=${ds}`,ans,[`${texN(s*ds)}\\sqrt3`,`${texN(ds/2)}\\sqrt3`,`${texN(-coef)}\\sqrt3`],`Differentiate the area formula: \\(dA=\\frac{\\sqrt3}{2}s\\,ds\\).`);
    }
    return mc('diffM-sin46','differential_trig_degrees','Use differentials to approximate \\(\\sin 46^\\circ\\).',`46^\\circ=45^\\circ+1^\\circ`,`\\frac{\\sqrt2}{2}+\\frac{\\pi\\sqrt2}{360}`,[`\\frac{\\sqrt2}{2}+\\frac{\\pi\\sqrt2}{180}`,`\\frac{\\sqrt2}{2}-\\frac{\\pi\\sqrt2}{360}`,`\\frac12+\\frac{\\pi}{180}`],`Use \\(dy=\\cos x\\,dx\\) at \\(x=45^\\circ=\\pi/4\\), with \\(dx=\\pi/180\\).`);
  };

  // L'Hopital: 20% straightforward, 80% assignment-style multi-step limits.
  G['l-hopital-s-rule']=()=>{
    const trivial=R()<0.20;
    const fam=trivial?pick(['simple_exp','simple_radical']):pick(['exp_remainder','sin_remainder','cos_ratio','log_cos_sin','log_growth','exp_growth','exp_cos_ratio','cos_exp_ratio','radical_derivative','inverse_sine','shifted_exp_sin']);
    if(fam==='simple_exp'){
      const k=ri(2,7);return numericMC(`lhM-se-${k}`,'simple_exponential','Evaluate the limit.',`\\lim_{x\\to0}\\frac{e^{${k}x}-1}{x}`,k,`Direct substitution gives \\(0/0\\). One application of L'Hopital's Rule gives \\(k e^{kx}\to${k}\\).`,1);
    }
    if(fam==='simple_radical'){
      const r=ri(2,7),a=r*r;return mc(`lhM-sr-${r}`,'simple_radical','Evaluate the limit.',`\\lim_{x\\to${a}}\\frac{\\sqrt{x}-${r}}{x-${a}}`,texRat(1,2*r),[texRat(1,r),texRat(-1,2*r),texRat(1,2*r+2)],`The form is \\(0/0\\). Differentiate numerator and denominator once to obtain \\(1/(2\\sqrt{x})\\), then substitute \\(x=${a}\\).`);
    }
    if(fam==='exp_remainder'){
      const k=ri(1,6);return mc(`lhM-er-${k}`,'two_application_exponential','Evaluate the limit.',`\\lim_{x\\to0}\\frac{e^{${k}x}-1-${k}x}{x^2}`,texRat(k*k,2),[String(k*k),texRat(-(k*k),2),texRat(k*k,4)],`The first differentiated quotient is still \\(0/0\\). Apply L'Hopital's Rule a second time to get \\(${k*k}e^{${k}x}/2\to${texRat(k*k,2)}\\).`);
    }
    if(fam==='sin_remainder'){
      const k=ri(1,5);return mc(`lhM-sr3-${k}`,'three_application_trig','Evaluate the limit.',`\\lim_{x\\to0}\\frac{\\sin(${k}x)-${k}x}{x^3}`,texRat(-(k**3),6),[texRat(k**3,6),texRat(-(k**3),3),'0'],`The quotient remains indeterminate after the first two differentiations. After three applications, substitute \\(x=0\\) to obtain \\(-${k**3}/6\\).`);
    }
    if(fam==='cos_ratio'){
      let a=ri(1,6),b=ri(2,7);if(a===b)b+=1;return mc(`lhM-cr-${a}-${b}`,'cosine_ratio','Evaluate the limit.',`\\lim_{x\\to0}\\frac{1-\\cos(${a}x)}{1-\\cos(${b}x)}`,texRat(a*a,b*b),[texRat(a,b),texRat(b*b,a*a),'1'],`Two applications of L'Hopital's Rule reduce the limit to \\(${a*a}\\cos(${a}x)/(${b*b}\\cos(${b}x))\\), giving \\(${texRat(a*a,b*b)}\\).`);
    }
    if(fam==='log_cos_sin'){
      const k=ri(1,5);return mc(`lhM-lcs-${k}`,'nested_log_trig','Evaluate the limit.',`\\lim_{x\\to0}\\frac{\\ln(\\cos(\\sin(${k}x)))}{x^2}`,texRat(-k*k,2),[texRat(k*k,2),String(-k*k),'0'],`This is a nested \\(0/0\\) limit. Repeated differentiation and substitution at \\(0\\) gives \\(-${k*k}/2\\).`);
    }
    if(fam==='log_growth'){
      const p=ri(2,4);return mc(`lhM-lg-${p}`,'logarithm_over_power','Evaluate the limit.',`\\lim_{x\\to\\infty}\\frac{(\\ln x)^{${p}}}{x}`,'0',['1','\\infty',String(p)],`This is \\(\\infty/\\infty\\). Repeated applications of L'Hopital's Rule lower the power of \\(\\ln x\\); eventually the quotient tends to \\(0\\).`);
    }
    if(fam==='exp_growth'){
      const p=ri(2,5),k=ri(1,5);return mc(`lhM-eg-${p}-${k}`,'power_over_exponential','Evaluate the limit.',`\\lim_{x\\to\\infty}\\frac{x^{${p}}}{e^{${k}x}}`,'0',['1','\\infty',texRat(p,k)],`Repeated applications of L'Hopital's Rule eventually remove the polynomial numerator while the exponential remains, so the limit is \\(0\\).`);
    }
    if(fam==='exp_cos_ratio'){
      const a=ri(1,5),b=ri(1,6);return mc(`lhM-ecr-${a}-${b}`,'exponential_cosine_remainders','Evaluate the limit.',`\\lim_{x\\to0}\\frac{e^{${a}x}-1-${a}x}{1-\\cos(${b}x)}`,texRat(a*a,b*b),[texRat(a,b),texRat(-a*a,b*b),'1'],`Both numerator and denominator vanish to second order. Two applications of L'Hopital's Rule give the ratio \\(${a*a}/${b*b}\\).`);
    }
    if(fam==='cos_exp_ratio'){
      const a=ri(1,5),b=ri(1,6);return mc(`lhM-cer-${a}-${b}`,'cosine_exponential_remainders','Evaluate the limit.',`\\lim_{x\\to0}\\frac{\\cos(${a}x)-1}{e^{${b}x}-1-${b}x}`,texRat(-a*a,b*b),[texRat(a*a,b*b),texRat(-a,b),'0'],`After two applications of L'Hopital's Rule, the numerator approaches \\(-${a*a}\\) and the denominator approaches \\(${b*b}\\).`);
    }
    if(fam==='radical_derivative'){
      const r=ri(2,8),t=ri(1,8),c=r*r-t;return mc(`lhM-rd-${r}-${t}`,'radical_difference_quotient','Evaluate the limit.',`\\lim_{x\\to${t}}\\frac{\\sqrt{x${c>=0?`+${c}`:`-${-c}`}}-${r}}{x-${t}}`,texRat(1,2*r),[texRat(1,r),texRat(-1,2*r),texRat(1,2*r+2)],`The form is \\(0/0\\). Differentiate the radical once and evaluate at \\(x=${t}\\), where the square root equals \\(${r}\\).`);
    }
    if(fam==='inverse_sine'){
      const k=ri(1,6);return numericMC(`lhM-asin-${k}`,'inverse_trig_limit','Evaluate the limit.',`\\lim_{x\\to0}\\frac{\\sin^{-1}(${k}x)}{x}`,k,`Differentiate numerator and denominator. The derivative of \\(\\sin^{-1}(${k}x)\\) is \\(${k}/\\sqrt{1-${k*k}x^2}\\), which approaches \\(${k}\\).`,1);
    }
    const k=ri(1,5);return mc(`lhM-shift-${k}`,'shifted_exponential_trig','Evaluate the limit.',`\\lim_{x\\to0}\\frac{e^{2+${k}x}-\\sin x-e^2}{x}`,`${k}e^2-1`,[`${k}e^2+1`,`e^2-${k}`,`${k}e^2`],`The form is \\(0/0\\). One application of L'Hopital's Rule gives \\(${k}e^{2+${k}x}-\\cos x\\), which approaches \\(${k}e^2-1\\).`);
  };

  // Rolle/MVT: broader function variety and four concrete alternatives (no generic fallback choices).
  G['rolle-s-theorem-and-the-mean-value-theorem']=(opts={})=>{
    const mode=opts.mvtMode||opts.mode||'both';
    const all=['mvt_quad','mvt_cubic','mvt_recip','mvt_sqrt','mvt_log','mvt_exp','rolle_quad','rolle_sin','rolle_cos','hyp_rational','hyp_corner'];
    const theorem=['rolle_quad','rolle_sin','rolle_cos','hyp_rational','hyp_corner'];
    const findc=['mvt_quad','mvt_cubic','mvt_recip','mvt_sqrt','mvt_log','mvt_exp'];
    const fam=pick(mode==='theorem'?theorem:mode==='find-c'?findc:all);
    if(fam==='mvt_quad'){
      const a=ri(-5,0),b=a+ri(2,7),A=ri(1,4),B=ri(-5,5),c=texRat(a+b,2);return mc(`mvtM-q-${A}-${B}-${idn(a)}-${b}`,'mvt_quadratic','Find every value of \\(c\\) guaranteed by the Mean Value Theorem.',`f(x)=${A}x^2${B?signed(B,'x'):''},\\quad [${a},${b}]`,c,[String(a),String(b),texRat(a+b+2,2)],`Set \\(f'(c)\\) equal to the average rate of change on the interval and solve.`);
    }
    if(fam==='mvt_cubic'){
      const r=pick([3,6,9]),c=`\\pm\\frac{${r}}{\\sqrt3}`;return mc(`mvtM-cub-${r}`,'mvt_cubic_symmetric','Find every value of \\(c\\) guaranteed by the Mean Value Theorem.',`f(x)=x^3,\\quad [-${r},${r}]`,c,[`c=0`,`c=\\pm${r}`,`c=\\pm\\frac{${r}}3`],`The secant slope is \\(${r*r}\\). Solve \\(3c^2=${r*r}\\) and keep both solutions in the open interval.`);
    }
    if(fam==='mvt_recip'){
      const p=ri(1,4),q=p+ri(1,3),a=p*p,b=q*q,c=p*q;return mc(`mvtM-rec-${p}-${q}`,'mvt_reciprocal','Find the value of \\(c\\) guaranteed by the Mean Value Theorem.',`f(x)=\\frac1x,\\quad [${a},${b}]`,String(c),[String(a),String(b),texRat(a+b,2)],`Set \\(-1/c^2\\) equal to the secant slope \\(-1/(${a*b})\\). The solution in the interval is \\(c=${c}\\).`);
    }
    if(fam==='mvt_sqrt'){
      const p=pick([2,4,6]),q=p+pick([2,4]),a=p*p,b=q*q,c=((p+q)/2)**2;return numericMC(`mvtM-root-${p}-${q}`,'mvt_square_root','Find the value of \\(c\\) guaranteed by the Mean Value Theorem.',`f(x)=\\sqrt{x},\\quad [${a},${b}]`,c,`The secant slope is \\(1/(${p+q})\\). Set \\(1/(2\\sqrt c)=1/(${p+q})\\) and solve.`,1);
    }
    if(fam==='mvt_log')return mc('mvtM-log','mvt_logarithm','Find the value of \\(c\\) guaranteed by the Mean Value Theorem.',`f(x)=\\ln x,\\quad [1,e]`,'e-1',['1','e','\\ln(e-1)'],`The average rate of change is \\(1/(e-1)\\). Since \\(f'(c)=1/c\\), solve \\(1/c=1/(e-1)\\).`);
    if(fam==='mvt_exp')return mc('mvtM-exp','mvt_exponential','Find the value of \\(c\\) guaranteed by the Mean Value Theorem.',`f(x)=e^x,\\quad [0,1]`,'\\ln(e-1)',['e-1','1','\\ln e'],`The average rate of change is \\(e-1\\). Solve \\(e^c=e-1\\).`);
    if(fam==='rolle_quad'){
      const h=ri(-5,5),r=ri(1,5);return numericMC(`rolleM-q-${idn(h)}-${r}`,'rolle_quadratic','Rolle\'s Theorem applies. Find the value of \\(c\\).',`f(x)=(${shift(h)})^2,\\quad [${h-r},${h+r}]`,h,`The endpoint values agree. Solve \\(f'(c)=2(${h===0?'c':h>0?`c-${h}`:`c+${-h}`})=0\\).`,1);
    }
    if(fam==='rolle_sin')return mc('rolleM-sin','rolle_sine','Rolle\'s Theorem applies. Find the value of \\(c\\).',`f(x)=\\sin x,\\quad [0,\\pi]`,'\\frac{\\pi}{2}',['0','\\pi','\\frac{\\pi}{4}'],`The endpoints both have value \\(0\\). Solve \\(\\cos c=0\\) in \\((0,\\pi)\\).`);
    if(fam==='rolle_cos')return mc('rolleM-cos','rolle_cosine','Rolle\'s Theorem applies. Find the value of \\(c\\).',`f(x)=\\cos x,\\quad [0,2\\pi]`,'\\pi',['0','2\\pi','\\frac{\\pi}{2}'],`The endpoints both equal \\(1\\). Solve \\(-\\sin c=0\\) in the open interval.`);
    if(fam==='hyp_rational'){
      const a=ri(-3,3);return mc(`mvtM-hr-${idn(a)}`,'mvt_hypothesis_rational','Can the Mean Value Theorem be applied on the stated interval?',`f(x)=\\frac1{${shift(a)}},\\quad [${a-2},${a+2}]`,'No, because the function is not continuous on the entire interval.',['Yes, because both endpoint values exist.','Yes, because the function is differentiable at the endpoints.','No, because the secant slope is zero.'],`There is a vertical asymptote at \\(x=${a}\\) inside the interval, so the continuity hypothesis fails.`);
    }
    return mc('mvtM-hc','mvt_hypothesis_corner','Can the Mean Value Theorem be applied on the stated interval?',`f(x)=|x|,\\quad [-1,1]`,'No, because the function is not differentiable on the entire open interval.',['Yes, because the function is continuous.','Yes, because the endpoint values are equal.','No, because the function is not continuous at x=0.'],`The function is continuous, but it is not differentiable at \\(x=0\\), which lies inside the open interval.`);
  };

  // Tangent/secant approximations: classification comes explicitly from concavity.
  const approxProblem=(id,variant,method,prompt,math,approx,classification,concavity,work)=>({
    id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div><div>\\(${math}\\)</div></div>`,answerType:'approx-classification',numericAnswer:Number(approx),numericTolerance:0.001,answerTex:Number(approx).toFixed(3),classification,
    explanation:`${work} The function is ${concavity==='up'?'concave up':'concave down'} on the relevant interval because its second derivative has the corresponding sign. For a concave ${concavity==='up'?'up':'down'} function, the ${method==='tangent'?'tangent line lies '+(concavity==='up'?'below':'above')+' the graph':'secant line lies '+(concavity==='up'?'above':'below')+' the graph'}, so the approximation is an ${classification}estimate.`
  });
  G['tangent-and-secant-line-approximations']=()=>{
    const method=pick(['tangent','secant']),fam=pick(['quadratic_up','quadratic_down','sqrt','log','exp','reciprocal','trig']);
    if(method==='tangent'){
      if(fam==='quadratic_up'||fam==='quadratic_down'){
        const A=(fam==='quadratic_up'?1:-1)*ri(1,4),B=nz(-5,5),C=ri(-5,5),a=ri(-2,3),h=pick([0.2,0.5,-0.2]),t=a+h,f=x=>A*x*x+B*x+C,fp=x=>2*A*x+B,approx=f(a)+fp(a)*h,conc=A>0?'up':'down',cls=conc==='up'?'under':'over';
        return approxProblem(`tsaM-tq-${A}-${B}-${C}-${a}-${h}`,`tangent_quadratic_${conc}`,'tangent',`Use the tangent line at \\(x=${a}\\) to approximate \\(f(${texN(t)})\\), then classify the approximation.`,`f(x)=${poly2(A,B,C)}`,approx,cls,conc,`The tangent-line approximation is \\(L(${texN(t)})=${texN(approx)}\\).`);
      }
      if(fam==='sqrt'){
        const r=ri(2,7),a=r*r,h=pick([0.5,1,-0.5]),t=a+h,approx=r+h/(2*r);return approxProblem(`tsaM-tsqrt-${r}-${h}`,'tangent_sqrt','tangent',`Use the tangent line at \\(x=${a}\\) to approximate \\(f(${texN(t)})\\), then classify the approximation.`,`f(x)=\\sqrt{x}`,approx,'over','down',`The tangent-line approximation is \\(${texN(approx)}\\).`);
      }
      if(fam==='log'){
        const a=pick([1,2,4]),h=pick([0.1,0.2,-0.1]),t=a+h,approx=Math.log(a)+h/a;return approxProblem(`tsaM-tlog-${a}-${h}`,'tangent_log','tangent',`Use the tangent line at \\(x=${a}\\) to approximate \\(f(${texN(t)})\\), then classify the approximation.`,`f(x)=\\ln x`,approx,'over','down',`Use \\(L(x)=\\ln(${a})+\\frac1{${a}}(x-${a})\\), giving \\(${texN(approx)}\\).`);
      }
      if(fam==='exp'){
        const a=0,h=pick([0.1,0.2,-0.1]),t=h,approx=1+h;return approxProblem(`tsaM-texp-${h}`,'tangent_exponential','tangent',`Use the tangent line at \\(x=0\\) to approximate \\(f(${h})\\), then classify the approximation.`,`f(x)=e^x`,approx,'under','up',`The tangent line at \\(0\\) is \\(L(x)=1+x\\), so the approximation is \\(${texN(approx)}\\).`);
      }
      if(fam==='reciprocal'){
        const a=ri(2,6),h=pick([0.2,0.5,-0.2]),t=a+h,approx=1/a-h/(a*a);return approxProblem(`tsaM-trec-${a}-${h}`,'tangent_reciprocal','tangent',`Use the tangent line at \\(x=${a}\\) to approximate \\(f(${texN(t)})\\), then classify the approximation.`,`f(x)=\\frac1x`,approx,'under','up',`The tangent-line approximation is \\(${texN(approx)}\\).`);
      }
      const a=Math.PI/6,h=pick([0.05,0.1,-0.05]),t=a+h,approx=Math.sin(a)+Math.cos(a)*h;return approxProblem(`tsaM-ttrig-${h}`,'tangent_sine','tangent',`Use the tangent line at \\(x=\\pi/6\\) to approximate \\(f(\\pi/6${h>=0?'+':'-'}${Math.abs(h)})\\), then classify the approximation.`,`f(x)=\\sin x`,approx,'over','down',`The tangent-line approximation is \\(${texN(approx)}\\).`);
    }
    // Secant problems use a midpoint target so the interpolation is transparent.
    if(fam==='quadratic_up'||fam==='quadratic_down'){
      const A=(fam==='quadratic_up'?1:-1)*ri(1,4),B=nz(-5,5),C=ri(-5,5),l=ri(-3,1),r=l+pick([2,4]),t=(l+r)/2,f=x=>A*x*x+B*x+C,approx=(f(l)+f(r))/2,conc=A>0?'up':'down',cls=conc==='up'?'over':'under';
      return approxProblem(`tsaM-sq-${A}-${B}-${C}-${l}-${r}`,`secant_quadratic_${conc}`,'secant',`Use the secant line through \\(x=${l}\\) and \\(x=${r}\\) to approximate \\(f(${t})\\), then classify the approximation.`,`f(x)=${poly2(A,B,C)}`,approx,cls,conc,`At the midpoint, the secant-line value is the average of the two endpoint values, \\(${texN(approx)}\\).`);
    }
    if(fam==='sqrt'){
      const l=pick([1,4,9]),r=l+pick([3,5,7]),t=(l+r)/2,approx=(Math.sqrt(l)+Math.sqrt(r))/2;return approxProblem(`tsaM-ssqrt-${l}-${r}`,'secant_sqrt','secant',`Use the secant line through \\(x=${l}\\) and \\(x=${r}\\) to approximate \\(f(${texN(t)})\\), then classify the approximation.`,`f(x)=\\sqrt{x}`,approx,'under','down',`The midpoint secant value is \\(${texN(approx)}\\).`);
    }
    if(fam==='log'){
      const l=pick([1,2,3]),r=l+2,t=(l+r)/2,approx=(Math.log(l)+Math.log(r))/2;return approxProblem(`tsaM-slog-${l}`,'secant_log','secant',`Use the secant line through \\(x=${l}\\) and \\(x=${r}\\) to approximate \\(f(${t})\\), then classify the approximation.`,`f(x)=\\ln x`,approx,'under','down',`The midpoint secant value is \\(${texN(approx)}\\).`);
    }
    if(fam==='exp'){
      const l=pick([-1,0]),r=l+2,t=(l+r)/2,approx=(Math.exp(l)+Math.exp(r))/2;return approxProblem(`tsaM-sexp-${l}`,'secant_exponential','secant',`Use the secant line through \\(x=${l}\\) and \\(x=${r}\\) to approximate \\(f(${t})\\), then classify the approximation.`,`f(x)=e^x`,approx,'over','up',`The midpoint secant value is \\(${texN(approx)}\\).`);
    }
    if(fam==='reciprocal'){
      const l=ri(1,4),r=l+ri(2,4),t=(l+r)/2,approx=(1/l+1/r)/2;return approxProblem(`tsaM-srec-${l}-${r}`,'secant_reciprocal','secant',`Use the secant line through \\(x=${l}\\) and \\(x=${r}\\) to approximate \\(f(${texN(t)})\\), then classify the approximation.`,`f(x)=\\frac1x`,approx,'over','up',`The midpoint secant value is \\(${texN(approx)}\\).`);
    }
    const l=-0.5,r=0.5,t=0,approx=(Math.cos(l)+Math.cos(r))/2;return approxProblem('tsaM-scos','secant_cosine','secant',`Use the secant line through \\(x=-0.5\\) and \\(x=0.5\\) to approximate \\(f(0)\\), then classify the approximation.`,`f(x)=\\cos x`,approx,'under','down',`The secant-line value at the midpoint is \\(${texN(approx)}\\).`);
  };

  // The Graphing Functions generator has been intentionally removed.
  delete G['graphing-functions'];
})();

window.BatchMathAPTopicGenerators={get:(slug)=>G[slug],slugs:()=>Object.keys(G)};
})();
