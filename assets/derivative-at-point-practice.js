(function(){
"use strict";
const $=id=>document.getElementById(id),R=()=>window.BatchMathRNG.random(),ri=(a,b)=>Math.floor(R()*(b-a+1))+a,pick=a=>a[Math.floor(R()*a.length)];
const nz=(a,b)=>{let n=0;while(!n)n=ri(a,b);return n},gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1};
const rat=(n,d=1)=>{if(d<0){n=-n;d=-d}const g=gcd(n,d);return[n/g,d/g]},raw=(n,d=1)=>{const[a,b]=rat(n,d);return b===1?`${a}`:`${a}/${b}`},tex=(n,d=1)=>{const[a,b]=rat(n,d);return b===1?`${a}`:`${a<0?"-":""}\\frac{${Math.abs(a)}}{${b}}`};
const signed=(c,t="",first=false)=>{if(!c)return"";const core=`${Math.abs(c)===1&&t?"":Math.abs(c)}${t}`;return first?(c<0?"-":"")+core:(c<0?" - ":" + ")+core};
const coef=(c,t)=>c===1?t:c===-1?`-${t}`:`${c}${t}`,pow=(v,n)=>n===1?v:`${v}^{${n}}`,lin=(a,b=0)=>signed(a,"x",true)+signed(b),quad=(a,b,c=0)=>signed(a,"x^2",true)+signed(b,"x")+signed(c);
const trigTex=(name,argument)=>`\\${name}\\left(${argument}\\right)`,bareFunctionTex=(name,argument)=>`\\${name} ${argument}`,factorTex=value=>`\\left(${value}\\right)`,typeset=n=>window.MathJax?.typesetPromise?.(n).catch(()=>{}),seen=new Set();let current=null,correct=0,attempted=0;
const make=(group,family,id,math,answerExpr,answerTex,steps,meta={})=>({group,family,id,math,answerExpr,answerTex,steps,...meta});
const steps=(rule,sub,result)=>[rule,sub,`Simplify to obtain \\(${result}\\).`];
const point=(r,t=r,id=String(r).replace(/[^a-z0-9]+/gi,"_"))=>({raw:r,tex:t,id});

function exactTrig(kind){
 const table={
  sin:[[point("0"),"0","0","1","1"],[point("pi/2","\\frac{\\pi}{2}","pi2"),"1","1","0","0"],[point("pi","\\pi","pi"),"0","0","-1","-1"]],
  cos:[[point("0"),"1","1","0","0"],[point("pi/2","\\frac{\\pi}{2}","pi2"),"0","0","-1","-1"],[point("pi","\\pi","pi"),"-1","-1","0","0"]],
  tan:[[point("0"),"0","0","1","1"],[point("pi/4","\\frac{\\pi}{4}","pi4"),"1","1","2","2"],[point("-pi/4","-\\frac{\\pi}{4}","npi4"),"-1","-1","2","2"]],
  sec:[[point("0"),"1","1","0","0"],[point("pi/3","\\frac{\\pi}{3}","pi3"),"2","2","2*sqrt(3)","2\\sqrt3"]],
  csc:[[point("pi/2","\\frac{\\pi}{2}","pi2"),"1","1","0","0"],[point("pi/6","\\frac{\\pi}{6}","pi6"),"2","2","-2*sqrt(3)","-2\\sqrt3"]],
  cot:[[point("pi/4","\\frac{\\pi}{4}","pi4"),"1","1","-2","-2"],[point("3*pi/4","\\frac{3\\pi}{4}","3pi4"),"-1","-1","-2","-2"]]
 };
 const[p,valueRaw,valueTex,derivativeRaw,derivativeTex]=pick(table[kind]);return{point:p,valueRaw,valueTex,derivativeRaw,derivativeTex};
}

function basic(){
 const f=pick(["polynomial","negative-power","radical"]);
 if(f==="polynomial"){const a=nz(-5,5),b=nz(-8,8),c=ri(-9,9),x=ri(-3,4),v=2*a*x+b;return make("basic",f,`${f}-${a}-${b}-${c}-${x}`,`y=${quad(a,b,c)},\\quad x=${x}`,`${v}`,`${v}`,steps(`Use the power rule: \\(y'=${signed(2*a,"x",true)+signed(b)}\\).`,`Substitute \\(x=${x}\\): \\(y'=${2*a}(${x})${signed(b)}\\).`,v),{evaluationPoint:String(x)})}
 if(f==="negative-power"){const a=nz(-6,6),n=ri(2,5),x=ri(1,4),num=-n*a,den=x**(n+1);return make("basic",f,`${f}-${a}-${n}-${x}`,`y=${signed(a,`x^{-${n}}`,true)}${signed(ri(-5,5))},\\quad x=${x}`,raw(num,den),tex(num,den),steps(`Use the power rule: \\(y'=${signed(num,`x^{-${n+1}}`,true)}\\).`,`At \\(x=${x}\\), this is \\(\\frac{${num}}{${den}}\\).`,tex(num,den)),{evaluationPoint:String(x)})}
 const a=ri(1,6),x=pick([1,4,9,16]),d=2*Math.sqrt(x);return make("basic",f,`${f}-${a}-${x}`,`y=${coef(a,"\\sqrt{x}")},\\quad x=${x}`,raw(a,d),tex(a,d),steps(`Rewrite the root as \\(x^{\\frac{1}{2}}\\): \\(y'=\\frac{${a}}2x^{-\\frac{1}{2}}\\).`,`At \\(x=${x}\\), \\(y'=\\frac{${a}}{2\\sqrt{${x}}}\\).`,tex(a,d)),{evaluationPoint:String(x)});
}

function product(){
 const f=pick(["polynomial-trig","polynomial-exponential","polynomial-base-exponential","polynomial-logarithmic","trig-exponential","inverse-trig-polynomial","logarithmic-trig","radical-trig"]),a=nz(-5,5),b=nz(1,6);
 if(f==="polynomial-trig"){
  const t=pick(["sin","cos","tan"]),d=exactTrig(t),p=d.point,px=`(${a})*(${p.raw})+(${b})`,ans=`${a}*(${d.valueRaw})+(${px})*(${d.derivativeRaw})`,out=`${a}(${d.valueTex})+(${a}(${p.tex})${signed(b)})(${d.derivativeTex})`;
  return make("product",f,`${f}-${a}-${b}-${t}-${p.id}`,`y=${factorTex(lin(a,b))}${factorTex(bareFunctionTex(t,"x"))},\\quad x=${p.tex}`,ans,out,steps(`Use the product rule with \\(u=${lin(a,b)}\\) and \\(v=${bareFunctionTex(t,"x")}\\).`,`Insert the exact trig values at \\(x=${p.tex}\\): \\(${out}\\).`,out),{structure:"product",usesChain:false,evaluationPoint:p.raw,trigKind:t});
 }
 if(f==="polynomial-exponential"){
  const x=pick([-1,0,1,2]),px=a*x+b,ans=`exp(${x})*(${a}+(${px}))`,out=`e^{${x}}(${a}${signed(px)})`;
  return make("product",f,`${f}-${a}-${b}-${x}`,`y=${factorTex(lin(a,b))}${factorTex("e^x")},\\quad x=${x}`,ans,out,steps(`Use \\(y'=u'e^x+ue^x\\).`,`At \\(x=${x}\\), the linear factor is \\(${px}\\).`,out),{structure:"product",usesChain:false,evaluationPoint:String(x)});
 }
 if(f==="polynomial-base-exponential"){
  const q=pick([2,3,5]),x=pick([-1,0,1]),px=a*x+b,ans=`${q}^(${x})*(${a}+(${px})*ln(${q}))`,out=`${q}^{${x}}[${a}+${px}\\ln(${q})]`;
  return make("product",f,`${f}-${a}-${b}-${q}-${x}`,`y=${factorTex(lin(a,b))}${factorTex(`${q}^x`)},\\quad x=${x}`,ans,out,steps(`Use the product rule and \\((a^x)'=a^x\\ln a\\).`,`Substitute \\(x=${x}\\) after differentiating.`,out),{structure:"product",usesChain:false,evaluationPoint:String(x)});
 }
 if(f==="polynomial-logarithmic"){
  const p=pick([point("1"),point("2"),point("e","e","e")]),px=`(${a})*(${p.raw})+(${b})`,ans=`${a}*ln(${p.raw})+(${px})/(${p.raw})`,out=`${a}\\ln(${p.tex})+\\frac{${a}(${p.tex})${signed(b)}}{${p.tex}}`;
  return make("product",f,`${f}-${a}-${b}-${p.id}`,`y=${factorTex(lin(a,b))}${factorTex("\\ln x")},\\quad x=${p.tex}`,ans,out,steps(`Use the product rule and \\((\\ln x)'=1/x\\).`,`Substitute \\(x=${p.tex}\\).`,out),{structure:"product",usesChain:false,evaluationPoint:p.raw});
 }
 if(f==="trig-exponential"){
  const t=pick(["sin","cos","tan"]),d=exactTrig(t),p=d.point,ans=`exp(${p.raw})*((${d.derivativeRaw})+(${d.valueRaw}))`,out=`e^{${p.tex}}[${d.derivativeTex}+(${d.valueTex})]`;
  return make("product",f,`${f}-${t}-${p.id}`,`y=${factorTex(bareFunctionTex(t,"x"))}${factorTex("e^x")},\\quad x=${p.tex}`,ans,out,steps(`Differentiate with the product rule.`,`Use the exact ${t} values at \\(x=${p.tex}\\).`,out),{structure:"product",usesChain:false,evaluationPoint:p.raw,trigKind:t});
 }
 if(f==="inverse-trig-polynomial"){
  const x=pick([0,1,-1]),ans=`(${a}*${x}+${b})/(1+(${x})^2)+${a}*atan(${x})`,out=`\\frac{${a*x+b}}{1+(${x})^2}+${a}\\tan^{-1}(${x})`;
  return make("product",f,`${f}-${a}-${b}-${x}`,`y=${factorTex("\\tan^{-1}x")}${factorTex(lin(a,b))},\\quad x=${x}`,ans,out,steps(`Use the product rule and \\((\\tan^{-1}x)'=1/(1+x^2)\\).`,`Substitute \\(x=${x}\\) and use the exact inverse-tangent value.`,out),{structure:"product",usesChain:false,evaluationPoint:String(x)});
 }
 if(f==="logarithmic-trig"){
  const t=pick(["sin","cos"]),p=pick([point("1"),point("e","e","e")]),dt=t==="sin"?`cos(${p.raw})`:`-sin(${p.raw})`,dtTex=t==="sin"?trigTex("cos",p.tex):`-${trigTex("sin",p.tex)}`,ans=`${b}*${t}(${p.raw})/(${p.raw})+${b}*ln(${p.raw})*(${dt})`,out=`\\frac{${coef(b,trigTex(t,p.tex))}}{${p.tex}}+${b}\\ln(${p.tex})(${dtTex})`;
  return make("product",f,`${f}-${t}-${b}-${p.id}`,`y=${factorTex("\\ln x")}${factorTex(coef(b,bareFunctionTex(t,"x")))},\\quad x=${p.tex}`,ans,out,steps(`Use the product rule.`,`Substitute \\(x=${p.tex}\\) while keeping exact trig values.`,out),{structure:"product",usesChain:false,evaluationPoint:p.raw,trigKind:t});
 }
 const t=pick(["sin","cos"]),x=pick([1,4]),dt=t==="sin"?`cos(${x})`:`-sin(${x})`,dtTex=t==="sin"?trigTex("cos",String(x)):`-${trigTex("sin",String(x))}`,ans=`${t}(${x})/(2*sqrt(${x}))+sqrt(${x})*(${dt})`,out=`\\frac{${trigTex(t,String(x))}}{2\\sqrt{${x}}}+\\sqrt{${x}}(${dtTex})`;
 return make("product",f,`${f}-${t}-${x}`,`y=${factorTex("\\sqrt{x}")}${factorTex(bareFunctionTex(t,"x"))},\\quad x=${x}`,ans,out,steps(`Use the product rule.`,`At \\(x=${x}\\), evaluate the radical and keep the trig values exact.`,out),{structure:"product",usesChain:false,evaluationPoint:String(x),trigKind:t});
}

function polynomialQuotient(){
 const style=pick(["linear-linear","quadratic-linear"]),x=pick([-2,-1,0,1,2]),a=nz(-4,4),b=ri(-6,6),c=nz(-4,4);let d=ri(-6,6);while(c*x+d===0)d=ri(-6,6);
 const den=c*x+d;
 if(style==="linear-linear"){const num=a*x+b,top=a*den-num*c,bottom=den*den,out=tex(top,bottom);return make("quotient",style,`${style}-${a}-${b}-${c}-${d}-${x}`,`y=\\frac{${lin(a,b)}}{${lin(c,d)}},\\quad x=${x}`,raw(top,bottom),out,steps(`Use the quotient rule.`,`At \\(x=${x}\\), the derivative numerator is \\(${top}\\) and denominator is \\(${bottom}\\).`,out),{structure:"quotient",usesChain:false,polynomialQuotient:true,evaluationPoint:String(x)})}
 const e=nz(-3,3),num=a*x*x+b*x+e,numPrime=2*a*x+b,top=numPrime*den-num*c,bottom=den*den,out=tex(top,bottom);return make("quotient",style,`${style}-${a}-${b}-${e}-${c}-${d}-${x}`,`y=\\frac{${quad(a,b,e)}}{${lin(c,d)}},\\quad x=${x}`,raw(top,bottom),out,steps(`Use the quotient rule.`,`Differentiate each polynomial, then substitute \\(x=${x}\\).`,out),{structure:"quotient",usesChain:false,polynomialQuotient:true,evaluationPoint:String(x)});
}

function quotient(){
 if(R()<.25)return polynomialQuotient();
 const f=pick(["polynomial-exponential","base-exponential-polynomial","trig-linear","logarithmic-polynomial","inverse-trig-linear","exponential-trig","polynomial-logarithmic"]),a=nz(-5,5),b=ri(2,7);
 if(f==="polynomial-exponential"){const x=pick([-1,0,1,2]),px=a*x+b,ans=`(${a}-(${px}))/exp(${x})`,out=`\\frac{${a}-${px}}{e^{${x}}}`;return make("quotient",f,`${f}-${a}-${b}-${x}`,`y=\\frac{${lin(a,b)}}{e^x},\\quad x=${x}`,ans,out,steps(`Apply the quotient rule.`,`Substitute \\(x=${x}\\) after differentiating.`,out),{structure:"quotient",usesChain:false,polynomialQuotient:false,evaluationPoint:String(x)})}
 if(f==="base-exponential-polynomial"){const q=pick([2,3,5]),x=pick([-1,0,1]),den=x+b,ans=`${q}^(${x})*(ln(${q})*(${den})-1)/((${den})^2)`,out=`\\frac{${q}^{${x}}[${den}\\ln(${q})-1]}{${den*den}}`;return make("quotient",f,`${f}-${q}-${b}-${x}`,`y=\\frac{${q}^x}{x+${b}},\\quad x=${x}`,ans,out,steps(`Use the quotient rule and \\((a^x)'=a^x\\ln a\\).`,`Substitute \\(x=${x}\\).`,out),{structure:"quotient",usesChain:false,polynomialQuotient:false,evaluationPoint:String(x)})}
 if(f==="trig-linear"){const t=pick(["sin","cos","tan"]),d=exactTrig(t),p=d.point,den=`(${p.raw})+${b}`,ans=`((${d.derivativeRaw})*(${den})-(${d.valueRaw}))/(${den})^2`,out=`\\frac{(${d.derivativeTex})(${p.tex}+${b})-${d.valueTex}}{(${p.tex}+${b})^2}`;return make("quotient",f,`${f}-${t}-${b}-${p.id}`,`y=\\frac{${trigTex(t,"x")}}{x+${b}},\\quad x=${p.tex}`,ans,out,steps(`Apply the quotient rule.`,`Use exact ${t} values at \\(x=${p.tex}\\).`,out),{structure:"quotient",usesChain:false,polynomialQuotient:false,evaluationPoint:p.raw,trigKind:t})}
 if(f==="logarithmic-polynomial"){const p=pick([point("1"),point("2"),point("e","e","e")]),den=`(${p.raw})+${b}`,ans=`((1/(${p.raw}))*(${den})-ln(${p.raw}))/(${den})^2`,out=`\\frac{\\frac{${p.tex}+${b}}{${p.tex}}-\\ln(${p.tex})}{(${p.tex}+${b})^2}`;return make("quotient",f,`${f}-${b}-${p.id}`,`y=\\frac{\\ln x}{x+${b}},\\quad x=${p.tex}`,ans,out,steps(`Apply the quotient rule and use \\((\\ln x)'=1/x\\).`,`Substitute \\(x=${p.tex}\\).`,out),{structure:"quotient",usesChain:false,polynomialQuotient:false,evaluationPoint:p.raw})}
 if(f==="inverse-trig-linear"){const x=pick([0,1,-1]),den=x+b,ans=`((1/(1+(${x})^2))*(${den})-atan(${x}))/(${den})^2`,out=`\\frac{\\frac{${den}}{1+(${x})^2}-\\tan^{-1}(${x})}{${den*den}}`;return make("quotient",f,`${f}-${b}-${x}`,`y=\\frac{\\tan^{-1}\\left(x\\right)}{x+${b}},\\quad x=${x}`,ans,out,steps(`Apply the quotient rule.`,`Use the exact inverse-tangent value at \\(x=${x}\\).`,out),{structure:"quotient",usesChain:false,polynomialQuotient:false,evaluationPoint:String(x)})}
 if(f==="exponential-trig"){const p=pick([point("0"),point("pi","\\pi","pi")]),ans=p.raw==="0"?"1":"-e^pi",out=p.raw==="0"?"1":"-e^{\\pi}";return make("quotient",f,`${f}-${p.id}`,`y=\\frac{e^x}{${trigTex("cos","x")}},\\quad x=${p.tex}`,ans,out,steps(`Apply the quotient rule.`,`Use the exact sine and cosine values at \\(x=${p.tex}\\).`,out),{structure:"quotient",usesChain:false,polynomialQuotient:false,evaluationPoint:p.raw})}
 const x=pick([0,1]),arg=x+b,ans=`((2*${x})*ln(${arg})-(${x*x+1})/(${arg}))/(ln(${arg})^2)`,out=`\\frac{${2*x}\\ln(${arg})-\\frac{${x*x+1}}{${arg}}}{[\\ln(${arg})]^2}`;return make("quotient",f,`${f}-${b}-${x}`,`y=\\frac{x^2+1}{\\ln(x+${b})},\\quad x=${x}`,ans,out,steps(`Use the quotient rule.`,`At \\(x=${x}\\), the logarithm's argument is \\(${arg}\\).`,out),{structure:"quotient",usesChain:false,polynomialQuotient:false,evaluationPoint:String(x)});
}

function trig(){
 const r=R(),k=r<.2?"sin":r<.4?"cos":r<.6?"tan":r<.733333?"sec":r<.866666?"csc":"cot",style=R();
 if(style<.35){
  const d={sin:["pi/3","\\frac{\\pi}{3}","sqrt(pi/3)","\\sqrt{\\frac{\\pi}{3}}"],cos:["pi/6","\\frac{\\pi}{6}","-sqrt(pi/6)","-\\sqrt{\\frac{\\pi}{6}}"],tan:["pi/4","\\frac{\\pi}{4}","2*sqrt(pi)","2\\sqrt\\pi"],sec:["pi/3","\\frac{\\pi}{3}","4*sqrt(pi)","4\\sqrt\\pi"],csc:["pi/6","\\frac{\\pi}{6}","-2*sqrt(2*pi)","-2\\sqrt{2\\pi}"],cot:["pi/4","\\frac{\\pi}{4}","-2*sqrt(pi)","-2\\sqrt\\pi"]}[k],p=`sqrt(${d[0]})`,pt=`\\sqrt{${d[1]}}`;
  return make("trig",k,`${k}-square`, `y=${trigTex(k,"x^2")},\\quad x=${pt}`,d[2],d[3],steps(`Let \\(u=x^2\\), so \\(u'=2x\\).`,`At \\(x=${pt}\\), the angle is \\(${d[1]}\\).`,d[3]),{usesChain:true,trigKind:k,pointStyle:"quadratic-exact",evaluationPoint:p});
 }
 if(style<1){
  const x=pick([-2,-1,1,2]),m=ri(2,5),phase={sin:["0","0","1","1"],cos:["pi/2","\\frac{\\pi}{2}","-1","-1"],tan:["pi/4","\\frac{\\pi}{4}","2","2"],sec:["pi/3","\\frac{\\pi}{3}","2*sqrt(3)","2\\sqrt3"],csc:["pi/6","\\frac{\\pi}{6}","-2*sqrt(3)","-2\\sqrt3"],cot:["pi/4","\\frac{\\pi}{4}","-2","-2"]}[k],shift=x>0?`x-${x}`:`x+${-x}`,inside=`${m}(${shift})${phase[0]==="0"?"":`+${phase[1]}`}`,ans=`${m}*(${phase[2]})`,out=`${m}(${phase[3]})`;
  return make("trig",k,`${k}-shift-${m}-${x}`,`y=${trigTex(k,inside)},\\quad x=${x}`,ans,out,steps(`Let \\(u=${inside}\\), so \\(u'=${m}\\).`,`At \\(x=${x}\\), the angle is \\(${phase[1]}\\).`,out),{usesChain:true,trigKind:k,pointStyle:"shifted-numeric",evaluationPoint:String(x)});
 }
 const d=exactTrig(k),p=d.point;return make("trig",k,`${k}-direct-${p.id}`,`y=${trigTex(k,"x")},\\quad x=${p.tex}`,d.derivativeRaw,d.derivativeTex,steps(`Use the standard ${k} derivative rule.`,`Evaluate it at the familiar angle \\(x=${p.tex}\\).`,d.derivativeTex),{usesChain:false,trigKind:k,pointStyle:"direct-familiar",evaluationPoint:p.raw});
}

function exponential(){
 const f=pick(["e-linear","e-quadratic","e-cubic","base-x","base-polynomial","e-trig"]);
 if(f==="e-linear"){const x=pick([-2,-1,0,1,2]),m=nz(-3,3),u=pick([-1,0,1]),b=u-m*x,ans=`${m}*exp(${u})`,out=u===0?`${m}`:u===1?coef(m,"e"):`\\frac{${m}}e`;return make("exponential",f,`${f}-${m}-${b}-${x}`,`y=e^{${lin(m,b)}},\\quad x=${x}`,ans,out,steps(`Use \\((e^u)'=e^uu'\\).`,`At \\(x=${x}\\), the exponent is \\(${u}\\) and \\(u'=${m}\\).`,out),{usesChain:true,evaluationPoint:String(x)})}
 if(f==="e-quadratic"){const x=pick([-2,-1,1,2]),u=pick([0,1]),c=u-x*x,n=2*x,ans=`${n}*exp(${u})`,out=u===0?`${n}`:coef(n,"e");return make("exponential",f,`${f}-${c}-${x}`,`y=e^{x^2${signed(c)}},\\quad x=${x}`,ans,out,steps(`Use the exponential chain rule.`,`At \\(x=${x}\\), the exponent is \\(${u}\\) and its derivative is \\(${n}\\).`,out),{usesChain:true,evaluationPoint:String(x)})}
 if(f==="e-cubic"){const x=pick([-1,1,2]),a=pick([1,2]),b=nz(-3,3),u=pick([0,1]),c=u-a*x*x*x-b*x,up=3*a*x*x+b,inside=signed(a,"x^3",true)+signed(b,"x")+signed(c),ans=`${up}*exp(${u})`,out=u===0?`${up}`:coef(up,"e");return make("exponential",f,`${f}-${a}-${b}-${c}-${x}`,`y=e^{${inside}},\\quad x=${x}`,ans,out,steps(`Differentiate the cubic exponent, then use the exponential chain rule.`,`At \\(x=${x}\\), the exponent is \\(${u}\\) and its derivative is \\(${up}\\).`,out),{usesChain:true,evaluationPoint:String(x),testLike:true})}
 if(f==="base-x"){const a=pick([2,3,5]),x=pick([-1,0,1,2]),out=`${a}^{${x}}\\ln(${a})`;return make("exponential",f,`${f}-${a}-${x}`,`y=${a}^x,\\quad x=${x}`,`${a}^(${x})*ln(${a})`,out,steps(`Use \\((a^x)'=a^x\\ln a\\).`,`Substitute \\(x=${x}\\).`,out),{usesChain:false,evaluationPoint:String(x)})}
 if(f==="base-polynomial"){const a=pick([2,3,5]),x=pick([-2,-1,1,2]),m=nz(-3,3),u=pick([-1,0,1,2]),b=u-m*x,ans=`${m}*${a}^(${u})*ln(${a})`,out=coef(m,`${a}^{${u}}\\ln(${a})`);return make("exponential",f,`${f}-${a}-${m}-${b}-${x}`,`y=${a}^{${lin(m,b)}},\\quad x=${x}`,ans,out,steps(`Use \\((a^u)'=a^u\\ln(a)u'\\).`,`At \\(x=${x}\\), \\(u=${u}\\) and \\(u'=${m}\\).`,out),{usesChain:true,evaluationPoint:String(x)})}
 const m=ri(2,7),atPi=R()<.65,p=atPi?point(`pi/${m}`,`\\frac{\\pi}{${m}}`,`pi_${m}`):point("0"),ans=atPi?-m:m;return make("exponential",f,`${f}-${m}-${atPi}`,`y=e^{${trigTex("sin",`${m}x`)}},\\quad x=${p.tex}`,`${ans}`,`${ans}`,steps(`Differentiate the exponential, then the sine.`,`Use the exact trig values at \\(x=${p.tex}\\).`,ans),{usesChain:true,evaluationPoint:p.raw});
}

function logarithmic(){
 const f=pick(["natural-polynomial","base-polynomial","natural-trig","natural-radical","linear-plus-log","log-power","log-tangent"]);
 if(f==="linear-plus-log"){const x=pick([1,2,3]),a=nz(-4,4),b=ri(2,5),u=pick([2,3,4,5]),c=u-b*x,s=pick([-1,1]),num=a*u+s*b,out=tex(num,u),math=`${signed(a,"x",true)}${s<0?" - ":" + "}\\ln(${lin(b,c)})`;return make("logarithmic",f,`${f}-${a}-${b}-${c}-${s}-${x}`,`y=${math},\\quad x=${x}`,raw(num,u),out,steps(`Differentiate the linear term and the logarithm.`,`At \\(x=${x}\\), the log argument is \\(${u}\\).`,out),{usesChain:true,containsExponential:false,evaluationPoint:String(x),testLike:true})}
 if(f==="log-power"){const n=ri(2,5),x=pick([2,3,4]),out=tex(n,x);return make("logarithmic",f,`${f}-${n}-${x}`,`y=\\ln(x^{${n}}),\\quad x=${x}`,raw(n,x),out,steps(`Use \\((\\ln u)'=u'/u\\).`,`For \\(x>0\\), this simplifies to \\(y'=${n}/x\\).`,out),{usesChain:true,containsExponential:false,evaluationPoint:String(x),testLike:true})}
 if(f==="log-tangent"){const m=ri(2,10),p=point(`pi/(4*${m})`,`\\frac{\\pi}{${4*m}}`,`pi_${4*m}`),ans=2*m;return make("logarithmic",f,`${f}-${m}`,`y=\\ln(${trigTex("tan",`${m}x`)}),\\quad x=${p.tex}`,`${ans}`,`${ans}`,steps(`Differentiate the logarithm, then tangent.`,`At this point the angle is \\(\\pi/4\\), so \\(\\tan=1\\) and \\(\\sec^2=2\\).`,ans),{usesChain:true,containsExponential:false,evaluationPoint:p.raw,testLike:true})}
 const x=pick([-2,-1,0,1,2]),m=nz(-5,5),q=nz(-2,2),u=ri(2,8),c=u-q*x*x-m*x,up=2*q*x+m;
 if(f==="natural-polynomial"){const out=tex(up,u);return make("logarithmic",f,`${f}-${m}-${q}-${c}-${x}`,`y=\\ln(${quad(q,m,c)}),\\quad x=${x}`,raw(up,u),out,steps(`Use \\(y'=u'/u\\).`,`At \\(x=${x}\\), \\(u=${u}\\) and \\(u'=${up}\\).`,out),{usesChain:true,containsExponential:false,evaluationPoint:String(x)})}
 if(f==="base-polynomial"){const b=pick([2,3,5]),out=`\\frac{${up}}{${u}\\ln(${b})}`;return make("logarithmic",f,`${f}-${b}-${m}-${q}-${c}-${x}`,`y=\\log_{${b}}(${quad(q,m,c)}),\\quad x=${x}`,`${up}/(${u}*ln(${b}))`,out,steps(`Use \\((\\log_bu)'=u'/(u\\ln b)\\).`,`At \\(x=${x}\\), \\(u=${u}\\) and \\(u'=${up}\\).`,out),{usesChain:true,containsExponential:false,evaluationPoint:String(x)})}
 if(f==="natural-trig"){const a=ri(2,8),constant=ri(2,8),atPi=R()<.5,p=atPi?point(`pi/${a}`,`\\frac{\\pi}{${a}}`,`pi_${a}`):point("0"),num=atPi?-a:a,out=tex(num,constant);return make("logarithmic",f,`${f}-${a}-${constant}-${atPi}`,`y=\\ln(${constant}+${trigTex("sin",`${a}x`)}),\\quad x=${p.tex}`,raw(num,constant),out,steps(`Differentiate the logarithm, then the sine.`,`Use exact trig values at \\(x=${p.tex}\\).`,out),{usesChain:true,containsExponential:false,evaluationPoint:p.raw})}
 const rx=pick([1,4,9,16]),root=Math.sqrt(rx),constant=ri(2,8),out=tex(1,2*root*(root+constant));return make("logarithmic",f,`${f}-${constant}-${rx}`,`y=\\ln(\\sqrt{x}+${constant}),\\quad x=${rx}`,raw(1,2*root*(root+constant)),out,steps(`Let \\(u=\\sqrt{x}+${constant}\\), then use \\(y'=u'/u\\).`,`At \\(x=${rx}\\), \\(\\sqrt{x}=${root}\\).`,out),{usesChain:true,containsExponential:false,evaluationPoint:String(rx)});
}

function nonPolynomialInvtrig(){
 const m=ri(2,5),style=pick(["atan-exponential","acot-exponential","asin-trig","acos-trig","asec-exponential","acsc-exponential","atan-logarithmic","asin-radical","acos-radical","atan-radical","acot-radical","asec-radical","acsc-radical"]);
 let family,math,answerExpr,answerTex,evaluationPoint,firstStep,secondStep;
 if(style==="atan-exponential"||style==="acot-exponential"){
  const negative=style.startsWith("acot");family=negative?"acot":"atan";math=`y=\\${negative?"cot":"tan"}^{-1}\\left(e^x\\right),\\quad x=0`;answerExpr=negative?"-1/2":"1/2";answerTex=negative?"-\\frac12":"\\frac12";evaluationPoint="0";firstStep=`Let \\(u=e^x\\), so \\(u'=e^x\\).`;secondStep=`At \\(x=0\\), \\(u=u'=1\\); apply the inverse-${negative?"cotangent":"tangent"} derivative formula.`;
 }else if(style==="asin-trig"||style==="acos-trig"){
  const negative=style.startsWith("acos");family=negative?"acos":"asin";math=`y=\\${negative?"cos":"sin"}^{-1}\\left(\\frac{\\sin(${m}x)}{${m}}\\right),\\quad x=0`;answerExpr=negative?"-1":"1";answerTex=answerExpr;evaluationPoint="0";firstStep=`Let \\(u=\\frac{\\sin(${m}x)}{${m}}\\), so \\(u'=\\cos(${m}x)\\).`;secondStep=`At \\(x=0\\), \\(u=0\\) and \\(u'=1\\); apply the inverse-${negative?"cosine":"sine"} derivative formula.`;
 }else if(style==="asec-exponential"||style==="acsc-exponential"){
  const negative=style.startsWith("acsc");family=negative?"acsc":"asec";math=`y=\\${negative?"csc":"sec"}^{-1}\\left(e^x+1\\right),\\quad x=0`;answerExpr=negative?"-1/(2*sqrt(3))":"1/(2*sqrt(3))";answerTex=`${negative?"-":""}\\frac{1}{2\\sqrt3}`;evaluationPoint="0";firstStep=`Let \\(u=e^x+1\\), so \\(u'=e^x\\).`;secondStep=`At \\(x=0\\), \\(u=2\\) and \\(u'=1\\); apply the inverse-${negative?"cosecant":"secant"} derivative formula.`;
 }else if(style==="atan-logarithmic"){
  family="atan";math=`y=\\tan^{-1}\\left(\\ln(x+1)\\right),\\quad x=0`;answerExpr="1";answerTex="1";evaluationPoint="0";firstStep=`Let \\(u=\\ln(x+1)\\), so \\(u'=1/(x+1)\\).`;secondStep=`At \\(x=0\\), \\(u=0\\) and \\(u'=1\\); apply the inverse-tangent derivative formula.`;
 }else if(style==="asin-radical"||style==="acos-radical"){
  const negative=style.startsWith("acos");family=negative?"acos":"asin";math=`y=\\${negative?"cos":"sin"}^{-1}\\left(\\frac{\\sqrt{x}}{2}\\right),\\quad x=1`;answerExpr=negative?"-1/(2*sqrt(3))":"1/(2*sqrt(3))";answerTex=`${negative?"-":""}\\frac{1}{2\\sqrt3}`;evaluationPoint="1";firstStep=`Let \\(u=\\frac{\\sqrt{x}}2\\), so \\(u'=\\frac{1}{4\\sqrt{x}}\\).`;secondStep=`At \\(x=1\\), \\(u=1/2\\) and \\(u'=1/4\\); apply the inverse-${negative?"cosine":"sine"} derivative formula.`;
 }else if(style==="atan-radical"||style==="acot-radical"){
  const negative=style.startsWith("acot");family=negative?"acot":"atan";math=`y=\\${negative?"cot":"tan"}^{-1}\\left(\\sqrt{x}\\right),\\quad x=1`;answerExpr=negative?"-1/4":"1/4";answerTex=negative?"-\\frac14":"\\frac14";evaluationPoint="1";firstStep=`Let \\(u=\\sqrt{x}\\), so \\(u'=1/(2\\sqrt{x})\\).`;secondStep=`At \\(x=1\\), \\(u=1\\) and \\(u'=1/2\\); apply the inverse-${negative?"cotangent":"tangent"} derivative formula.`;
 }else{
  const negative=style.startsWith("acsc");family=negative?"acsc":"asec";math=`y=\\${negative?"csc":"sec"}^{-1}\\left(\\sqrt{x}+1\\right),\\quad x=1`;answerExpr=negative?"-1/(4*sqrt(3))":"1/(4*sqrt(3))";answerTex=`${negative?"-":""}\\frac{1}{4\\sqrt3}`;evaluationPoint="1";firstStep=`Let \\(u=\\sqrt{x}+1\\), so \\(u'=1/(2\\sqrt{x})\\).`;secondStep=`At \\(x=1\\), \\(u=2\\) and \\(u'=1/2\\); apply the inverse-${negative?"cosecant":"secant"} derivative formula.`;
 }
 return make("invtrig",family,`nonpolynomial-${style}-${m}`,math,answerExpr,answerTex,steps(firstStep,secondStep,answerTex),{usesChain:true,interiorType:"nonpolynomial",argumentFamily:style,evaluationPoint});
}

function invtrig(){
 if(R()<.15)return nonPolynomialInvtrig();
 const k=pick(["asin","acos","atan","acot","asec","acsc"]),mono=R()<.4,n=ri(1,5),name={asin:"\\sin^{-1}",acos:"\\cos^{-1}",atan:"\\tan^{-1}",acot:"\\cot^{-1}",asec:"\\sec^{-1}",acsc:"\\csc^{-1}"}[k];let u,x,ans,out;
 if(mono&&(k==="asin"||k==="acos")){const a=2**(n-1),s=k==="acos"?-1:1;u=coef(a,pow("x",n));x="\\frac12";ans=`${s*2*n}/sqrt(3)`;out=`${s<0?"-":""}\\frac{${2*n}}{\\sqrt3}`}
 else if(mono&&(k==="atan"||k==="acot")){const a=ri(1,3),s=k==="acot"?-1:1;u=coef(a,pow("x",n));x="1";ans=raw(s*a*n,1+a*a);out=tex(s*a*n,1+a*a)}
 else if(mono){const a=pick([2,3]),s=k==="acsc"?-1:1;u=coef(a,pow("x",n));x="1";ans=`${s*n}/sqrt(${a*a-1})`;out=`${s<0?"-":""}\\frac{${n}}{\\sqrt{${a*a-1}}}`}
 else{const xv=pick([-1,1,2]),a=nz(-2,2),b=nz(-4,4),target=["asec","acsc"].includes(k)?pick([2,3]):["asin","acos"].includes(k)?0:pick([-2,-1,0,1,2]),c=target-a*xv*xv-b*xv,up=2*a*xv+b;u=quad(a,b,c);x=String(xv);if(k==="asin"||k==="acos"){ans=String((k==="acos"?-1:1)*up);out=ans}else if(k==="atan"||k==="acot"){ans=raw((k==="acot"?-1:1)*up,1+target*target);out=tex((k==="acot"?-1:1)*up,1+target*target)}else{const num=(k==="acsc"?-1:1)*up;ans=`(${num})/(${Math.abs(target)}*sqrt(${target*target-1}))`;out=`\\frac{${num}}{${Math.abs(target)}\\sqrt{${target*target-1}}}`}}
 return make("invtrig",k,`${k}-${mono}-${n}-${u}-${x}`,`y=${name}\\left(${u}\\right),\\quad x=${x}`,ans,out,steps(`Let \\(u=${u}\\) and differentiate the inside.`,`Apply the standard \\(${name}(u)\\) derivative formula at \\(x=${x}\\).`,out),{usesChain:true,interiorType:mono?"monomial":"polynomial",evaluationPoint:x});
}

function implicit(){
 const f=pick(["circle","power-sum","product-powers","mixed-quadratic","test-linear-cubic","assignment-polynomial","assignment-sine","assignment-trig","assignment-rational","exponential","sin-sum"]);
 if(f==="circle"){const[x,y]=pick([[3,4],[4,3],[5,12],[8,15],[7,24]]),out=tex(-x,y);return make("implicit",f,`${f}-${x}-${y}`,`x^2+y^2=${x*x+y*y},\\quad (${x},${y})`,raw(-x,y),out,steps(`Differentiate: \\(2x+2yy'=0\\).`,`Solve for \\(y'\\), then substitute \\((${x},${y})\\).`,out),{evaluationPoint:`${x},${y}`})}
 if(f==="power-sum"){const n=pick([3,4]),m=pick([2,3,4]),[x,y]=pick([[1,1],[1,2],[2,1]]),C=x**n+y**m,num=-n*x**(n-1),den=m*y**(m-1),out=tex(num,den);return make("implicit",f,`${f}-${n}-${m}-${x}-${y}`,`x^{${n}}+y^{${m}}=${C},\\quad (${x},${y})`,raw(num,den),out,steps(`Differentiate each power implicitly.`,`Substitute the point and solve for \\(y'\\).`,out),{evaluationPoint:`${x},${y}`})}
 if(f==="product-powers"){const[x,y]=pick([[1,1],[1,2],[2,1],[2,2]]),C=x*x*y+x*y*y,num=-(2*x*y+y*y),den=x*x+2*x*y,out=tex(num,den);return make("implicit",f,`${f}-${x}-${y}`,`x^2y+xy^2=${C},\\quad (${x},${y})`,raw(num,den),out,steps(`Use the product rule on both terms.`,`Substitute the point, collect the \\(y'\\) terms, and solve.`,out),{evaluationPoint:`${x},${y}`,testLike:true})}
 if(f==="mixed-quadratic"){const a=pick([1,2,3]),b=pick([1,2,3]),c=pick([1,2,3]),[x,y]=pick([[1,1],[1,2],[2,1]]),C=a*x*x+b*x*y+c*y*y,num=-(2*a*x+b*y),den=b*x+2*c*y,out=tex(num,den);return make("implicit",f,`${f}-${a}-${b}-${c}-${x}-${y}`,`${signed(a,"x^2",true)+signed(b,"xy")+signed(c,"y^2")}=${C},\\quad (${x},${y})`,raw(num,den),out,steps(`Differentiate \\(xy\\) with the product rule.`,`Collect the \\(y'\\) terms, substitute the point, and solve.`,out),{evaluationPoint:`${x},${y}`})}
 if(f==="test-linear-cubic"){const a=pick([2,3]),b=5-2*a,answer=5-a,right=b<0?`${a}x-${-b}`:`${a}x+${b}`;return make("implicit",f,`${f}-${a}`,`xy+x^2-y^3=${right},\\quad (2,1)`,`${answer}`,`${answer}`,steps(`Differentiate: \\(y+xy'+2x-3y^2y'=${a}\\).`,`At \\((2,1)\\), collect the \\(y'\\) terms and solve.`,answer),{evaluationPoint:"2,1",testLike:true})}
 if(f==="assignment-polynomial")return make("implicit",f,f,`xy+y^3=x^2-y^2+13,\\quad (1,2)`,`0`,`0`,steps(`Differentiate: \\(y+xy'+3y^2y'=2x-2yy'\\).`,`At \\((1,2)\\), the non-derivative terms cancel and \\(17y'=0\\).`,`0`),{evaluationPoint:"1,2",testLike:true});
 if(f==="assignment-sine")return make("implicit",f,f,`\\sin(xy)+x^2-y=-\\frac{xy}{2}+4,\\quad (2,\\pi)`,`-2-3*pi/4`,`-2-\\frac{3\\pi}{4}`,steps(`Differentiate \\(\\sin(xy)\\) with the chain and product rules.`,`At \\((2,\\pi)\\), use \\(\\cos(2\\pi)=1\\), collect the \\(y'\\) terms, and solve.`,`-2-\\frac{3\\pi}{4}`),{evaluationPoint:"2,pi",testLike:true});
 if(f==="assignment-trig")return make("implicit",f,f,`x\\sin y+\\tan y=x^2,\\quad (\\sqrt2,\\frac{\\pi}{4})`,`sqrt(2)/2`,`\\frac{\\sqrt2}{2}`,steps(`Differentiate: \\(\\sin y+x\\cos(y)y'+\\sec^2(y)y'=2x\\).`,`Use the exact values at \\((\\sqrt2,\\pi/4)\\).`,`\\frac{\\sqrt2}{2}`),{evaluationPoint:"sqrt(2),pi/4",testLike:true});
 if(f==="assignment-rational")return make("implicit",f,f,`\\frac{x+y}{x-y}=x^2y^2-41,\\quad (2,3)`,`-21/10`,`-\\frac{21}{10}`,steps(`Differentiate the left side with the quotient rule and the right with the product rule.`,`At \\((2,3)\\), solve \\(4y'-6=36+24y'\\).`,`-\\frac{21}{10}`),{evaluationPoint:"2,3",testLike:true});
 if(f==="exponential"){const atOne=R()<.5,x=atOne?1:0,ans=atOne?"-1/(e+1)":"-1/e",out=atOne?"-\\frac1{e+1}":"-\\frac1e",C=atOne?"e+1":"e";return make("implicit",f,`${f}-${atOne}`,`e^y+xy=${C},\\quad (${x},1)`,ans,out,steps(`Differentiate: \\(e^yy'+y+xy'=0\\).`,`Substitute the point and solve.`,out),{evaluationPoint:`${x},1`})}
 const atPi=R()<.5,pt=atPi?"(0,\\pi)":"(0,0)",ans=atPi?"-pi-1":"-1",out=atPi?"-\\pi-1":"-1";return make("implicit",f,`${f}-${atPi}`,`\\sin(x+y)=xy,\\quad ${pt}`,ans,out,steps(`Differentiate: \\(\\cos(x+y)(1+y')=y+xy'\\).`,`Substitute the point and solve for \\(y'\\).`,out),{evaluationPoint:pt});
}

function composite(){
 const f=pick(["exponential-of-trig","base-exponential-of-trig","log-of-trig","trig-of-log","trig-of-exponential","exponential-of-inverse-trig","log-of-inverse-trig","inverse-trig-of-exponential","inverse-trig-of-trig","test-product-trig","powered-trig-at-point"]),k=ri(2,7),b=pick([2,3,5]),atPi=R()<.45,p=atPi?point(`pi/${k}`,`\\frac{\\pi}{${k}}`,`pi_${k}`):point("0"),s=atPi?-1:1;let math,ans,out;
 if(f==="test-product-trig"){const a=ri(2,4),x=pick([-1,1]),sign=x<0?"-":"";math=`${trigTex("cos",`${a}x`)}${trigTex("sin","x^2")}`;ans=`-${a}*sin(${a}*${x})*sin((${x})^2)+cos(${a}*${x})*cos((${x})^2)*2*${x}`;out=`-${a}\\sin(${sign}${a})\\sin(1)${x<0?"-":"+"}2\\cos(${sign}${a})\\cos(1)`;p.raw=String(x);p.tex=String(x)}
 else if(f==="powered-trig-at-point"){const t=pick(["sin","cos","tan"]),n=ri(3,5),m=ri(2,5);math=`\\${t}^{${n}}\\left(${m}x\\right)`;p.raw=`pi/(4*${m})`;p.tex=`\\frac{\\pi}{${4*m}}`;if(t==="tan"){ans=String(2*n*m);out=ans}else{const sign=t==="cos"?-1:1;ans=`${sign*n*m}*(sqrt(2)/2)^${n}`;out=`${sign<0?"-":""}${n*m}\\left(\\frac{\\sqrt2}{2}\\right)^{${n}}`}}
 else if(f==="exponential-of-trig"){math=`e^{${trigTex("sin",`${k}x`)}}`;ans=String(s*k);out=ans}
 else if(f==="base-exponential-of-trig"){math=`${b}^{${trigTex("sin",`${k}x`)}}`;ans=`${s*k}*ln(${b})`;out=coef(s*k,`\\ln(${b})`)}
 else if(f==="log-of-trig"){math=`\\ln(2+${trigTex("sin",`${k}x`)})`;ans=raw(s*k,2);out=tex(s*k,2)}
 else if(f==="trig-of-log"){math=trigTex("sin","\\ln(x+2)");ans=`cos(ln(2))/2`;out=`\\frac{\\cos(\\ln2)}2`;p.raw="0";p.tex="0"}
 else if(f==="trig-of-exponential"){math=trigTex("sin","e^x");ans=`cos(1)`;out=`\\cos(1)`;p.raw="0";p.tex="0"}
 else if(f==="exponential-of-inverse-trig"){math=`e^{\\tan^{-1}(${k}x)}`;ans=`${k}`;out=`${k}`;p.raw="0";p.tex="0"}
 else if(f==="log-of-inverse-trig"){math=`\\ln(2+\\tan^{-1}(${k}x))`;ans=raw(k,2);out=tex(k,2);p.raw="0";p.tex="0"}
 else if(f==="inverse-trig-of-exponential"){math=`\\tan^{-1}(e^x)`;ans=`1/2`;out=`\\frac12`;p.raw="0";p.tex="0"}
 else{math=`\\tan^{-1}(${trigTex("sin",`${k}x`)})`;ans=atPi?String(-k):String(k);out=ans}
 const rule=f==="test-product-trig"?`Use the product rule, applying the chain rule to both trig factors.`:f==="powered-trig-at-point"?`Use the power rule on the outside and the chain rule on the trig function.`:`Identify each nested layer and work from the outside inward.`;
 return make("mixed",f,`${f}-${k}-${b}-${p.id}`,`y=${math},\\quad x=${p.tex}`,ans,out,steps(rule,`Differentiate completely, then substitute \\(x=${p.tex}\\).`,out),{usesChain:true,mixedComposite:true,evaluationPoint:p.raw,testLike:f.startsWith("test-")||f.startsWith("powered-")});
}

const generators={basic,product,quotient,trig,exponential,logarithmic,invtrig,implicit},mixedGroups=[...Object.keys(generators),"composite","composite"];
const solution=p=>`<div class="solution-title">Step-by-step walkthrough</div><ol class="solution-steps">${p.steps.map(s=>`<li>${s}</li>`).join("")}</ol>`;
function reveal(reason){const method=$("method");if(!method||!method.hidden)return;method.hidden=false;$("show-explanation")?.setAttribute("hidden","");window.BMAnalytics?.solutionRevealed(current,{reveal_reason:reason});typeset([method])}
function next(){const selected=$("practice-type").value;let p;for(let i=0;i<160;i++){const g=selected==="mixed"?pick(mixedGroups):selected;p=g==="composite"?composite():generators[g]();if(!seen.has(p.id)){seen.add(p.id);break}if(seen.size>1000)seen.clear()}current=p;p.answered=false;if(new URLSearchParams(location.search).get("bm_qa")==="1")window.__BM_CURRENT_PROBLEM=p;$("question").innerHTML=`<div class="question-prompt">Find the derivative at the indicated x-value or point.</div><div>\\(${p.math}\\)</div>`;$("answer").value="";window.BatchMathCalculusKeypad?.reset?.();$("answer").disabled=false;$("submit").disabled=false;$("next").style.display="none";$("feedback").className="feedback";$("feedback").innerHTML="";$("topic-name").textContent=$("practice-type").selectedOptions[0].textContent;window.BMAnalytics?.ensurePracticeStarted({practice_mode:selected});window.BMAnalytics?.problemGenerated(p,{practice_mode:selected});typeset([$("question")]);window.BatchMathCalculusKeypad?.focus?.()}
function check(){if(!current||current.answered)return;const a=$("answer").value.trim();if(!a){$("feedback").className="feedback wrong";$("feedback").innerHTML='<div class="status">Enter an answer first.</div>';return}const ok=window.BatchMathDerivativeExpressions.equivalent(a,current.answerExpr,[{}]);current.answered=true;attempted++;if(ok)correct++;$("correct-count").textContent=correct;$("attempted").textContent=attempted;$("answer").disabled=true;$("submit").disabled=true;$("next").style.display="inline-block";$("feedback").className=`feedback ${ok?"correct":"wrong"}`;$("feedback").innerHTML=`<div class="status">${ok?"Correct.":"Not quite."}</div><div class="correct-answer">One correct answer: \\(${current.answerTex}\\)</div><button id="show-explanation" class="practice-button show-explanation" type="button"${ok?"":" hidden"}>Show Explanation</button><div id="method" class="method"${ok?" hidden":""}>${solution(current)}</div>`;$("show-explanation")?.addEventListener("click",()=>reveal("student_request"));if(!ok)window.BMAnalytics?.solutionRevealed(current,{reveal_reason:"wrong_answer"});window.BMAnalytics?.answerChecked(current,ok);typeset([$("feedback")]);$("next").focus()}
$("submit").addEventListener("click",check);$("next").addEventListener("click",next);$("practice-type").addEventListener("change",next);$("answer").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();current?.answered?next():check()}});
window.BatchMathAtPointQA=Object.freeze({generators,mixedCompositeProblem:composite,mixedGroups,polynomialQuotientProblem:polynomialQuotient});const boot=()=>next();if(window.MathJax?.startup?.promise)window.MathJax.startup.promise.then(boot);else window.addEventListener("load",boot);
})();
