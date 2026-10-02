(function(){
"use strict";

const $=id=>document.getElementById(id),R=()=>window.BatchMathRNG.random(),ri=(a,b)=>Math.floor(R()*(b-a+1))+a,pick=a=>a[Math.floor(R()*a.length)];
const nz=(a,b)=>{let n=0;while(!n)n=ri(a,b);return n},gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1};
const reduce=(n,d=1)=>{if(d<0){n=-n;d=-d}const g=gcd(n,d);return[n/g,d/g]};
const exactRat=(n,d=1)=>{const[a,b]=reduce(n,d);return{raw:b===1?`${a}`:`${a}/${b}`,tex:b===1?`${a}`:`${a<0?"-":""}\\frac{${Math.abs(a)}}{${b}}`,rat:[a,b]}};
const exact=(raw,tex=raw)=>({raw,tex,rat:null}),isRat=(v,n,d=1)=>v?.rat&&v.rat[0]===n&&v.rat[1]===d,isZero=v=>isRat(v,0),isOne=v=>isRat(v,1),isNegOne=v=>isRat(v,-1);
const neg=a=>a.rat?exactRat(-a.rat[0],a.rat[1]):a.raw.startsWith("-")?exact(a.raw.slice(1),a.tex.slice(1)):exact(`-(${a.raw})`,`-\\left(${a.tex}\\right)`);
const add=(a,b)=>a.rat&&b.rat?exactRat(a.rat[0]*b.rat[1]+b.rat[0]*a.rat[1],a.rat[1]*b.rat[1]):isZero(a)?b:isZero(b)?a:b.raw.startsWith("-")?exact(`(${a.raw})-(${b.raw.slice(1)})`,`${a.tex}-${b.tex.slice(1)}`):exact(`(${a.raw})+(${b.raw})`,`${a.tex}+${b.tex}`);
const sub=(a,b)=>add(a,neg(b));
const mul=(a,b)=>a.rat&&b.rat?exactRat(a.rat[0]*b.rat[0],a.rat[1]*b.rat[1]):isZero(a)||isZero(b)?exactRat(0):isOne(a)?b:isOne(b)?a:isNegOne(a)?neg(b):isNegOne(b)?neg(a):exact(`(${a.raw})*(${b.raw})`,`\\left(${a.tex}\\right)\\left(${b.tex}\\right)`);
const div=(a,b)=>a.rat&&b.rat?exactRat(a.rat[0]*b.rat[1],a.rat[1]*b.rat[0]):isZero(a)?exactRat(0):isOne(b)?a:exact(`(${a.raw})/(${b.raw})`,`\\frac{${a.tex}}{${b.tex}}`);
const powE=(a,n)=>{if(n===0)return exactRat(1);if(n<0)return div(exactRat(1),powE(a,-n));let out=exactRat(1);for(let i=0;i<n;i++)out=mul(out,a);return out};
const expr=(v)=>v.tex,coef=(c,t)=>c===1?t:c===-1?`-${t}`:`${c}${t}`,pow=(v,n)=>n===1?v:`${v}^{${n}}`;
const signed=(c,t="",first=false)=>{if(!c)return"";const core=`${Math.abs(c)===1&&t?"":Math.abs(c)}${t}`;return first?(c<0?"-":"")+core:(c<0?" - ":" + ")+core};
const lin=(a,b=0)=>{let out=signed(a,"x",true);out+=signed(b,"",out==="");return out||"0"};
const quad=(a,b,c=0)=>{let out=signed(a,"x^2",true);out+=signed(b,"x",out==="");out+=signed(c,"",out==="");return out||"0"};
const trigTex=(name,arg)=>`\\${name}\\left(${arg}\\right)`,factorTex=value=>`\\left(${value}\\right)`,point=(raw,tex=raw,id=String(raw).replace(/[^a-z0-9]+/gi,"_"))=>({raw,tex,id});
const fallbackCleanTex=value=>String(value??"").replace(/\\frac\{\s*-\s*(\d+(?:\.\d+)?)\s*\}/g,"-\\frac{$1}");
const cleanTex=value=>window.BatchMathAnswers?.normalizeTexFractionSigns?.(value)??fallbackCleanTex(value);
const typeset=nodes=>window.MathJax?.typesetPromise?.(nodes).catch(()=>{}),seen=new Set();let current=null,correct=0,attempted=0;
const make=(stage,focus,family,id,math,answer,steps,meta={})=>({stage,focus,family,id:`${stage}-${family}-${id}`,math:cleanTex(math),answerExpr:answer.raw,answerTex:cleanTex(answer.tex),steps:steps.map(cleanTex),...meta});
const finalizeSteps=(items,answer)=>[...items,`Therefore, the derivative value is \\(${answer.tex}\\).`];
const pointText=p=>p.tex;

function polynomialTex(coeffs){
 let out="";
 for(let p=coeffs.length-1;p>=0;p--){const c=coeffs[p];if(!c)continue;out+=signed(c,p===0?"":pow("x",p),out==="");}
 return out||"0";
}
function derivativeCoeffs(coeffs){return coeffs.slice(1).map((c,i)=>c*(i+1))}
function polynomialValue(coeffs,x){return coeffs.reduceRight((sum,c)=>sum*x+c,0)}
function polynomialFactor(x,degree=pick([1,2,3])){
 let coeffs;
 do{coeffs=Array.from({length:degree+1},(_,p)=>p===degree?nz(-4,4):ri(-4,4))}while(coeffs.filter(Boolean).length<2);
 const derivative=derivativeCoeffs(coeffs),value=polynomialValue(coeffs,x),slope=polynomialValue(derivative,x);
 return{id:`poly-${coeffs.join("_")}`,tex:polynomialTex(coeffs),derivativeTex:polynomialTex(derivative),value:exactRat(value),derivative:exactRat(slope),types:["algebraic"],rules:["power"]};
}
function naturalLinearFactor(p,nonzeroValue=false){
 const m=nz(-4,4),x=Number(p.raw),b=ri(-5,5),numericValue=Number.isFinite(x)?m*x+b:null;
 if(nonzeroValue&&numericValue===0)return naturalLinearFactor(p,nonzeroValue);
 const value=numericValue===null?exact(`${m}*(${p.raw})+(${b})`,`${coef(m,factorTex(p.tex))}${signed(b)}`):exactRat(numericValue);
 return{id:`linear-${m}-${b}-${p.id}`,tex:lin(m,b),derivativeTex:`${m}`,value,derivative:exactRat(m),types:["algebraic"],rules:["power"]};
}
function reciprocalFactor(x){
 const a=nz(-5,5),n=ri(1,4),b=ri(-3,3),xp=x**n,xpn=x**(n+1),value=add(exactRat(a,xp),exactRat(b)),derivative=exactRat(-a*n,xpn);
 const frac=`${a<0?"-":""}\\frac{${Math.abs(a)}}{${pow("x",n)}}`,tex=b?`${frac}${signed(b)}`:frac,derivativeTex=`${-a*n<0?"-":""}\\frac{${Math.abs(a*n)}}{${pow("x",n+1)}}`;
 return{id:`recip-${a}-${n}-${b}`,tex,derivativeTex,value,derivative,types:["algebraic"],rules:["power"]};
}
function radicalFactor(x){
 const root=Math.sqrt(x),a=nz(-5,5),b=ri(-4,4),value=exactRat(a*root+b),derivative=exactRat(a,2*root);
 return{id:`rad-${a}-${b}`,tex:`${coef(a,"\\sqrt{x}")}${signed(b)}`,derivativeTex:`${a<0?"-":""}\\frac{${Math.abs(a)}}{2\\sqrt{x}}`,value,derivative,types:["algebraic"],rules:["power"]};
}
function fractionalFactor(x,q=pick([2,3])){
 const r=Math.round(x**(1/q)),choices=q===2?[1,3,-1,-3]:[1,2,-1,-2],p=pick(choices),a=nz(-4,4),b=ri(-3,3),powerValue=p>=0?exactRat(r**p):exactRat(1,r**(-p)),derivativePower=p-q>=0?exactRat(r**(p-q)):exactRat(1,r**(q-p));
 const value=add(mul(exactRat(a),powerValue),exactRat(b)),derivative=mul(exactRat(a*p,q),derivativePower),exponent=`${p<0?"-":""}\\frac{${Math.abs(p)}}{${q}}`,nextExponent=`${p-q<0?"-":""}\\frac{${Math.abs(p-q)}}{${q}}`;
 return{id:`frac-${a}-${p}-${q}-${b}`,tex:`${coef(a,`x^{${exponent}}`)}${signed(b)}`,derivativeTex:coef(a*p,`\\frac{1}{${q}}x^{${nextExponent}}`),value,derivative,types:["algebraic"],rules:["power"]};
}
function directFromFactor(stage,focus,family,p,factor){
 const answer=factor.derivative;
 const ruleNames=factor.rules.filter((rule,index,list)=>list.indexOf(rule)===index).map(rule=>({power:"power",trig:"trigonometric",chain:"chain",exponential:"exponential",logarithmic:"logarithmic",'inverse-trig':"inverse-trigonometric"}[rule]||rule));
 const ruleText=ruleNames.length===1?`${ruleNames[0]} rule`:`${ruleNames.slice(0,-1).join(", ")} and ${ruleNames.at(-1)} rules`;
 return make(stage,focus,family,`${factor.id}-${p.id}`,`y=${factor.tex},\\quad x=${p.tex}`,answer,finalizeSteps([
  `Differentiate using the ${ruleText}: \\(y'=${factor.derivativeTex}\\).`,
  `Substitute \\(x=${p.tex}\\) into the derivative.`
 ],answer),{rules:factor.rules,functionTypes:factor.types,evaluationPoint:p.raw,trigKind:factor.trigKind,invKind:factor.invKind,argumentStyle:factor.argumentStyle,interiorTermCount:factor.interiorTermCount});
}
function productFrom(stage,focus,family,p,u,v,extra={}){
 const answer=add(mul(u.derivative,v.value),mul(u.value,v.derivative));
 return make(stage,focus,family,`${u.id}-${v.id}-${p.id}`,`y=${factorTex(u.tex)}${factorTex(v.tex)},\\quad x=${p.tex}`,answer,finalizeSteps([
  `Use the product rule: \\(y'=u'v+uv'\\).`,
  `At \\(x=${p.tex}\\), \\(u=${u.value.tex}\\), \\(u'=${u.derivative.tex}\\), \\(v=${v.value.tex}\\), and \\(v'=${v.derivative.tex}\\).`,
  `Substitute: \\(y'=(${u.derivative.tex})(${v.value.tex})+(${u.value.tex})(${v.derivative.tex})\\).`
 ],answer),{rules:[...new Set(["product",...u.rules,...v.rules])],functionTypes:[...new Set([...u.types,...v.types])],evaluationPoint:p.raw,structure:"product",...extra});
}
function quotientFrom(stage,focus,family,p,u,v,extra={}){
 const answer=div(sub(mul(u.derivative,v.value),mul(u.value,v.derivative)),powE(v.value,2));
 return make(stage,focus,family,`${u.id}-${v.id}-${p.id}`,`y=\\frac{${u.tex}}{${v.tex}},\\quad x=${p.tex}`,answer,finalizeSteps([
  `Use the quotient rule: \\(y'=\\frac{u'v-uv'}{v^2}\\).`,
  `At \\(x=${p.tex}\\), \\(u=${u.value.tex}\\), \\(u'=${u.derivative.tex}\\), \\(v=${v.value.tex}\\), and \\(v'=${v.derivative.tex}\\).`,
  `Substitute these four values into the quotient-rule formula.`
 ],answer),{rules:[...new Set(["quotient",...u.rules,...v.rules])],functionTypes:[...new Set([...u.types,...v.types])],evaluationPoint:p.raw,structure:"quotient",...extra});
}

function powerPolynomial(){
 const p=point(String(ri(-2,3)));let factor;
 do{factor=polynomialFactor(Number(p.raw),ri(2,5))}while(Math.abs(factor.derivative.rat[0]/factor.derivative.rat[1])>180);
 return directFromFactor("power","polynomial","polynomial",p,factor);
}
function powerNegative(){const p=point(String(pick([-2,-1,1,2])));return directFromFactor("power","negative","negative-powers",p,reciprocalFactor(Number(p.raw)))}
function powerFractional(){const q=pick([2,3]),root=ri(1,q===2?3:2),p=point(String(root**q));return directFromFactor("power","fractional","fractional-powers",p,fractionalFactor(Number(p.raw),q))}
function powerRadical(){const p=point(String(pick([1,4,9,16])));return directFromFactor("power","radical","radical-form",p,radicalFactor(Number(p.raw)))}
function powerReciprocal(){const p=point(String(pick([-2,-1,1,2]))),f=reciprocalFactor(Number(p.raw));f.tex=f.tex.replace(/([+-]?\d+)\/x/g,"$1/x");return directFromFactor("power","reciprocal","reciprocal-form",p,f)}

function productPolynomial(){const p=point(String(ri(-2,2)));return productFrom("product","polynomial","polynomial-product",p,polynomialFactor(Number(p.raw),pick([1,2])),polynomialFactor(Number(p.raw),pick([2,3])))}
function productNegative(){const p=point(String(pick([-2,-1,1,2])));return productFrom("product","negative","reciprocal-product",p,polynomialFactor(Number(p.raw),pick([1,2])),reciprocalFactor(Number(p.raw)))}
function productRadical(){const p=point(String(pick([1,4])));return productFrom("product","radical","radical-product",p,polynomialFactor(Number(p.raw),pick([1,2])),radicalFactor(Number(p.raw)))}
function productMixed(){const q=pick([2,3]),root=q===2?ri(1,2):1,p=point(String(root**q));return productFrom("product","mixed-power","fractional-product",p,fractionalFactor(Number(p.raw),q),polynomialFactor(Number(p.raw),pick([1,2])))}

function nonzeroFactor(factory,x){let factor;for(let i=0;i<30;i++){factor=factory(x);if(!isZero(factor.value))return factor}return factor}
function polynomialQuotient(focus,numeratorDegrees,denominatorDegrees){
 const p=point(String(ri(-2,2))),x=Number(p.raw),u=polynomialFactor(x,pick(numeratorDegrees));let v;
 do{v=nonzeroFactor(value=>polynomialFactor(value,pick(denominatorDegrees)),x)}while(v.tex===u.tex);
 return quotientFrom("quotient",focus,`${focus}-polynomial-quotient`,p,u,v,{polynomialQuotient:true});
}
function quotientLinearLinear(){return polynomialQuotient("linear-linear",[1],[1])}
function quotientPolynomialLinear(){return polynomialQuotient("polynomial-linear",[2,3],[1])}
function quotientLinearPolynomial(){return polynomialQuotient("linear-polynomial",[1],[2,3])}
function quotientPolynomialPolynomial(){return polynomialQuotient("polynomial-polynomial",[2,3],[2,3])}

const TRIG_TABLE={
 sin:[{p:point("0"),v:exactRat(0),d:exactRat(1)},{p:point("pi/6","\\frac{\\pi}{6}","pi6"),v:exactRat(1,2),d:exact("sqrt(3)/2","\\frac{\\sqrt3}{2}")},{p:point("pi/4","\\frac{\\pi}{4}","pi4"),v:exact("sqrt(2)/2","\\frac{\\sqrt2}{2}"),d:exact("sqrt(2)/2","\\frac{\\sqrt2}{2}")},{p:point("pi/2","\\frac{\\pi}{2}","pi2"),v:exactRat(1),d:exactRat(0)}],
 cos:[{p:point("0"),v:exactRat(1),d:exactRat(0)},{p:point("pi/6","\\frac{\\pi}{6}","pi6"),v:exact("sqrt(3)/2","\\frac{\\sqrt3}{2}"),d:exactRat(-1,2)},{p:point("pi/4","\\frac{\\pi}{4}","pi4"),v:exact("sqrt(2)/2","\\frac{\\sqrt2}{2}"),d:exact("-sqrt(2)/2","-\\frac{\\sqrt2}{2}")},{p:point("pi/2","\\frac{\\pi}{2}","pi2"),v:exactRat(0),d:exactRat(-1)}],
 tan:[{p:point("0"),v:exactRat(0),d:exactRat(1)},{p:point("pi/4","\\frac{\\pi}{4}","pi4"),v:exactRat(1),d:exactRat(2)},{p:point("-pi/4","-\\frac{\\pi}{4}","npi4"),v:exactRat(-1),d:exactRat(2)}],
 sec:[{p:point("0"),v:exactRat(1),d:exactRat(0)},{p:point("pi/3","\\frac{\\pi}{3}","pi3"),v:exactRat(2),d:exact("2*sqrt(3)","2\\sqrt3")},{p:point("pi/4","\\frac{\\pi}{4}","pi4"),v:exact("sqrt(2)","\\sqrt2"),d:exact("sqrt(2)","\\sqrt2")}],
 csc:[{p:point("pi/2","\\frac{\\pi}{2}","pi2"),v:exactRat(1),d:exactRat(0)},{p:point("pi/6","\\frac{\\pi}{6}","pi6"),v:exactRat(2),d:exact("-2*sqrt(3)","-2\\sqrt3")},{p:point("pi/4","\\frac{\\pi}{4}","pi4"),v:exact("sqrt(2)","\\sqrt2"),d:exact("-sqrt(2)","-\\sqrt2")}],
 cot:[{p:point("pi/4","\\frac{\\pi}{4}","pi4"),v:exactRat(1),d:exactRat(-2)},{p:point("3*pi/4","\\frac{3\\pi}{4}","3pi4"),v:exactRat(-1),d:exactRat(-2)},{p:point("pi/2","\\frac{\\pi}{2}","pi2"),v:exactRat(0),d:exactRat(-1)}]
};
const TRIG_DERIVATIVE={
 sin:{sign:1,tex:"\\cos x"},
 cos:{sign:-1,tex:"\\sin x"},
 tan:{sign:1,tex:"\\sec^2 x"},
 sec:{sign:1,tex:"\\sec x\\tan x"},
 csc:{sign:-1,tex:"\\csc x\\cot x"},
 cot:{sign:-1,tex:"\\csc^2 x"}
};
function trigFactor(kind=null,entry=null){
 kind=kind||pick(Object.keys(TRIG_TABLE));entry=entry||pick(TRIG_TABLE[kind]);const c=pick([-3,-2,1,2,3]),value=mul(exactRat(c),entry.v),derivative=mul(exactRat(c),entry.d),rule=TRIG_DERIVATIVE[kind];
 return{id:`trig-${kind}-${c}-${entry.p.id}`,tex:coef(c,`\\${kind} x`),derivativeTex:coef(c*rule.sign,rule.tex),value,derivative,types:["trig"],rules:["trig"],point:entry.p,trigKind:kind};
}
function dividedFamiliarPoint(p,m){
 if(p.raw==="0")return point("0");
 const match=p.raw.match(/^(-)?(?:(\d+)\*)?pi(?:\/(\d+))?$/);if(!match)throw Error(`Unsupported familiar angle: ${p.raw}`);
 const sign=match[1]?-1:1,numerator=sign*Number(match[2]||1),denominator=Number(match[3]||1)*m,[n,d]=reduce(numerator,denominator),abs=Math.abs(n);
 const rawNumerator=abs===1?"pi":`${abs}*pi`,texNumerator=abs===1?"\\pi":`${abs}\\pi`,prefix=n<0?"-":"",rawPoint=d===1?`${prefix}${rawNumerator}`:`${prefix}${rawNumerator}/${d}`,texPoint=d===1?`${prefix}${texNumerator}`:`${prefix}\\frac{${texNumerator}}{${d}}`;
 return point(rawPoint,texPoint,`scaled_${p.id}_${m}`);
}
function trigOuterDerivativeTex(kind,arg){
 if(kind==="sin")return trigTex("cos",arg);
 if(kind==="cos")return `-${trigTex("sin",arg)}`;
 if(kind==="tan")return `\\sec^2\\left(${arg}\\right)`;
 if(kind==="sec")return `${trigTex("sec",arg)}${trigTex("tan",arg)}`;
 if(kind==="csc")return `-${trigTex("csc",arg)}${trigTex("cot",arg)}`;
 return `-\\csc^2\\left(${arg}\\right)`;
}
function trigOuterDerivativeRaw(kind,arg){
 if(kind==="sin")return `cos(${arg})`;
 if(kind==="cos")return `-sin(${arg})`;
 if(kind==="tan")return `sec(${arg})^2`;
 if(kind==="sec")return `sec(${arg})*tan(${arg})`;
 if(kind==="csc")return `-csc(${arg})*cot(${arg})`;
 return `-csc(${arg})^2`;
}
function trigDirect(){const f=trigFactor();return directFromFactor("trig","direct",`direct-${f.trigKind}`,f.point,f)}
function trigAlgebra(){const f=trigFactor(),p=f.point,u=naturalLinearFactor(p),answer=add(u.derivative,f.derivative);return make("trig","algebra-trig","algebra-plus-trig",`${u.id}-${f.id}`,`y=${u.tex}${f.tex.startsWith("-")?" - ":" + "}${f.tex.replace(/^-/,"")},\\quad x=${p.tex}`,answer,finalizeSteps([`Differentiate the algebraic and trigonometric terms separately.`,`At \\(x=${p.tex}\\), the algebraic derivative is \\(${u.derivative.tex}\\) and the trig derivative is \\(${f.derivative.tex}\\).`],answer),{rules:["power","trig"],functionTypes:["algebraic","trig"],evaluationPoint:p.raw,trigKind:f.trigKind})}
function trigProduct(){const f=trigFactor(),p=f.point,u=naturalLinearFactor(p,true);return productFrom("trig","product","algebra-trig-product",p,u,f,{trigKind:f.trigKind})}
function trigQuotient(){const f=trigFactor(),p=f.point,v=naturalLinearFactor(p,true);return quotientFrom("trig","quotient","trig-algebra-quotient",p,f,v,{trigKind:f.trigKind})}

function innerAtPoint(p,target,style=pick(["linear","quadratic","cubic"])){
 if(!target.rat||target.rat[1]!==1)throw Error("Natural polynomial interiors require an integer target.");
 const requestedDegree=style==="linear"?1:style==="quadratic"?2:3,a=Number(p.raw),degree=requestedDegree===1&&a===0&&target.rat[0]===0?2:requestedDegree,actualStyle=degree===1?"linear":degree===2?"quadratic":"cubic";let coeffs;
 do{
  coeffs=Array(degree+1).fill(0);coeffs[degree]=nz(-3,3);if(degree>=2)coeffs[1]=ri(-3,3);if(degree===3)coeffs[2]=ri(-2,2);
  coeffs[0]=target.rat[0]-coeffs.slice(1).reduce((sum,c,index)=>sum+c*(a**(index+1)),0);
 }while(coeffs.filter(Boolean).length<2);
 const derivativeCoefficients=derivativeCoeffs(coeffs),slope=polynomialValue(derivativeCoefficients,a);
 return{id:`inner-${actualStyle}-${coeffs.join("_")}-${p.id}`,tex:polynomialTex(coeffs),derivativeTex:polynomialTex(derivativeCoefficients),value:target,derivative:exactRat(slope),coeffs,termCount:coeffs.filter(Boolean).length,types:["algebraic"],rules:["power"]};
}
function chainPowerFactor(){const p=point(String(pick([-2,-1,1,2]))),target=exactRat(pick([-2,-1,1,2,3])),inner=innerAtPoint(p,target),n=ri(2,5),value=powE(target,n),derivative=mul(mul(exactRat(n),powE(target,n-1)),inner.derivative);return{id:`chain-power-${n}-${inner.id}`,tex:pow(factorTex(inner.tex),n),derivativeTex:`${n}${pow(factorTex(inner.tex),n-1)}${factorTex(inner.derivativeTex)}`,value,derivative,interiorTermCount:inner.termCount,types:["algebraic"],rules:["power","chain"],point:p}}
function chainRadicalFactor(){const p=point(String(pick([1,2]))),root=pick([1,2,3]),inner=innerAtPoint(p,exactRat(root*root),pick(["linear","quadratic"])),value=exactRat(root),derivative=div(inner.derivative,exactRat(2*root));return{id:`chain-rad-${inner.id}`,tex:`\\sqrt{${inner.tex}}`,derivativeTex:`\\frac{${inner.derivativeTex}}{2\\sqrt{${inner.tex}}}`,value,derivative,interiorTermCount:inner.termCount,types:["algebraic"],rules:["power","chain"],point:p}}
function chainReciprocalFactor(){const p=point(String(pick([-1,1,2]))),target=exactRat(pick([1,2,3,-1,-2])),inner=innerAtPoint(p,target,pick(["linear","quadratic"])),n=ri(1,3),value=div(exactRat(1),powE(target,n)),derivative=div(mul(exactRat(-n),inner.derivative),powE(target,n+1)),numerator=n===1?factorTex(inner.derivativeTex):`${n}${factorTex(inner.derivativeTex)}`;return{id:`chain-recip-${n}-${inner.id}`,tex:`\\frac{1}{${pow(factorTex(inner.tex),n)}}`,derivativeTex:`-\\frac{${numerator}}{${pow(factorTex(inner.tex),n+1)}}`,value,derivative,interiorTermCount:inner.termCount,types:["algebraic"],rules:["power","chain"],point:p}}
function scaledTrigChainFactor(){
 const kind=pick(["sin","cos","tan","sec","csc","cot"]),entry=pick(TRIG_TABLE[kind]),m=ri(2,5),p=dividedFamiliarPoint(entry.p,m),rule=TRIG_DERIVATIVE[kind],innerTex=coef(m,"x"),value=entry.v,derivative=mul(entry.d,exactRat(m));
 return{id:`chain-trig-linear-${kind}-${m}-${entry.p.id}`,tex:trigTex(kind,innerTex),derivativeTex:coef(m*rule.sign,trigOuterDerivativeTex(kind,innerTex).replace(/^-/,"")),value,derivative,types:["algebraic","trig"],rules:["power","trig","chain"],point:p,trigKind:kind,argumentStyle:"expanded-linear"};
}
function polynomialTrigChainFactor(){
 const kind=pick(["sin","cos","tan","sec"]),entry=TRIG_TABLE[kind].find(item=>item.p.raw==="0"),p=point(String(pick([-2,-1,1,2]))),inner=innerAtPoint(p,exactRat(0),pick(["linear","quadratic","cubic"])),value=entry.v,derivative=mul(entry.d,inner.derivative),outer=trigOuterDerivativeTex(kind,inner.tex);
 return{id:`chain-trig-polynomial-${kind}-${inner.id}`,tex:trigTex(kind,inner.tex),derivativeTex:`${outer}${factorTex(inner.derivativeTex)}`,value,derivative,interiorTermCount:inner.termCount,types:["algebraic","trig"],rules:["power","trig","chain"],point:p,trigKind:kind,argumentStyle:"expanded-polynomial"};
}
function chainTrigFactor(){return pick([scaledTrigChainFactor,polynomialTrigChainFactor])()}
function trigChain(){const f=chainTrigFactor();return directFromFactor("trig","chain",`trig-chain-${f.trigKind}`,f.point,f)}
function chainAlgebra(){const f=pick([chainPowerFactor,chainRadicalFactor,chainReciprocalFactor])();return directFromFactor("chain","algebraic","algebraic-composition",f.point,f)}
function chainTrig(){const f=chainTrigFactor();return directFromFactor("chain","trig-composition",`trig-composition-${f.trigKind}`,f.point,f)}
function chainProduct(){const v=pick([chainPowerFactor,chainRadicalFactor,chainTrigFactor])(),p=v.point,u=naturalLinearFactor(p,true);return productFrom("chain","product","product-with-chain",p,u,v,{interiorTermCount:v.interiorTermCount})}
function chainQuotient(){const u=pick([chainPowerFactor,chainRadicalFactor,chainTrigFactor])(),p=u.point,v=naturalLinearFactor(p,true);return quotientFrom("chain","quotient","quotient-with-chain",p,u,v,{interiorTermCount:u.interiorTermCount})}

function exponentialFactor(style=pick(["e","base"]),withChain=false){
 const p=point(String(pick([-1,0,1,2]))),base=pick([2,3,5]),target=withChain?exactRat(pick([0,1])):exactRat(Number(p.raw)),inner=withChain?innerAtPoint(p,target,pick(["linear","quadratic"])):{id:"x",tex:"x",derivativeTex:"1",value:target,derivative:exactRat(1),types:["algebraic"],rules:["power"]};
 if(style==="e"){
  const value=target.rat[0]===0?exactRat(1):target.rat[0]===1?exact("e","e"):target.rat[0]===-1?exact("1/e","\\frac1e"):exact(`exp(${target.raw})`,`e^{${target.tex}}`),derivative=mul(value,inner.derivative);
  return{id:`exp-e-${withChain}-${inner.id}`,tex:`e^{${inner.tex}}`,derivativeTex:`e^{${inner.tex}}${factorTex(inner.derivativeTex)}`,value,derivative,types:["algebraic","exponential"],rules:["power","exponential",...(withChain?["chain"]:[])],point:p};
 }
 const exponent=target.rat[0],value=exponent>=0?exactRat(base**exponent):exactRat(1,base**(-exponent)),derivative=mul(mul(value,exact(`ln(${base})`,`\\ln(${base})`)),inner.derivative);
 return{id:`exp-base-${base}-${withChain}-${inner.id}`,tex:`${base}^{${inner.tex}}`,derivativeTex:`${base}^{${inner.tex}}\\ln(${base})${factorTex(inner.derivativeTex)}`,value,derivative,types:["algebraic","exponential"],rules:["power","exponential",...(withChain?["chain"]:[])],point:p};
}
function expDirect(){const f=exponentialFactor(pick(["e","base"]),false);return directFromFactor("exponential","direct",f.id.includes("base")?"base-exponential":"natural-exponential",f.point,f)}
function expChain(){const f=exponentialFactor(pick(["e","base"]),true);return directFromFactor("exponential","chain","exponential-chain",f.point,f)}
function expProduct(){const v=exponentialFactor(pick(["e","base"]),R()<.6),p=v.point,u=naturalLinearFactor(p,true);return productFrom("exponential","product","exponential-product",p,u,v)}
function expQuotient(){const u=exponentialFactor(pick(["e","base"]),R()<.6),p=u.point,v=naturalLinearFactor(p,true);return quotientFrom("exponential","quotient","exponential-quotient",p,u,v)}
function expTrig(){
 const kind=pick(["sin","cos"]),m=ri(2,5),p=kind==="sin"?point("0"):point(`pi/(2*${m})`,`\\frac{\\pi}{${2*m}}`,`pi_${2*m}`),insideDerivative=kind==="sin"?exactRat(m):exactRat(-m),answer=insideDerivative,math=`y=e^{${trigTex(kind,`${m}x`)}},\\quad x=${p.tex}`;
 return make("exponential","trig-combination",`exponential-of-${kind}`,`${m}`,math,answer,finalizeSteps([`Differentiate the exponential first, then the ${kind} function inside.`,`At \\(x=${p.tex}\\), the exponent is zero, so the exponential factor is \\(1\\). Use the familiar-angle ${kind} values for the inner derivative.`],answer),{rules:["trig","chain","exponential"],functionTypes:["trig","exponential"],evaluationPoint:p.raw,trigKind:kind});
}

function implicitProblem(focus,family,id,equation,p,Fx,Fy,details,types,rules){
 const answer=div(neg(Fx),Fy);
 return make("implicit",focus,family,id,`${equation},\\quad ${p}`,answer,finalizeSteps([details,`Collect the \\(y'\\) terms. At the indicated point, the non-\\(y'\\) part is \\(${Fx.tex}\\) and the coefficient of \\(y'\\) is \\(${Fy.tex}\\).`,`Solve \\(${Fx.tex}+(${Fy.tex})y'=0\\).`],answer),{rules:[...rules,"implicit"],functionTypes:[...types,"implicit"],evaluationPoint:p,implicitFx:Fx.raw,implicitFy:Fy.raw});
}
function implicitPolynomial(){
 const style=pick(["ellipse","power-sum","mixed"]),pair=pick([[1,1],[1,2],[2,1],[2,3]]),[x,y]=pair;
 if(style==="ellipse"){const a=pick([1,2,3]),b=pick([1,2,3]),C=a*x*x+b*y*y;return implicitProblem("polynomial","ellipse",`${a}-${b}-${x}-${y}`,`${coef(a,"x^2")}${signed(b,"y^2")}=${C}`,`(${x},${y})`,exactRat(2*a*x),exactRat(2*b*y),`Differentiate both squared terms with respect to \\(x\\).`,["algebraic"],["power"])}
 if(style==="power-sum"){const n=pick([3,4,5]),m=pick([2,3,4]),C=x**n+y**m;return implicitProblem("polynomial","power-sum",`${n}-${m}-${x}-${y}`,`x^{${n}}+y^{${m}}=${C}`,`(${x},${y})`,exactRat(n*x**(n-1)),exactRat(m*y**(m-1)),`Differentiate each power, remembering that differentiating a power of \\(y\\) produces a factor of \\(y'\\).`,["algebraic"],["power"])}
 const a=pick([1,2,3]),b=pick([1,2,3]),c=pick([1,2,3]),C=a*x*x+b*x*y+c*y*y,Fx=exactRat(2*a*x+b*y),Fy=exactRat(b*x+2*c*y);return implicitProblem("polynomial","mixed-quadratic",`${a}-${b}-${c}-${x}-${y}`,`${coef(a,"x^2")}${signed(b,"xy")}${signed(c,"y^2")}=${C}`,`(${x},${y})`,Fx,Fy,`Differentiate \\(xy\\) with the product rule and the other terms with the power rule.`,["algebraic"],["power","product"]);
}
function implicitProduct(){const[x,y]=pick([[1,1],[1,2],[2,1],[2,2]]),style=pick(["x2y-y3","xy2-x3"]);if(style==="x2y-y3"){const C=x*x*y+y**3,Fx=exactRat(2*x*y),Fy=exactRat(x*x+3*y*y);return implicitProblem("products","power-products",`${style}-${x}-${y}`,`x^2y+y^3=${C}`,`(${x},${y})`,Fx,Fy,`Use the product rule on \\(x^2y\\) and implicit differentiation on \\(y^3\\).`,["algebraic"],["power","product"])}const C=x*y*y+x**3,Fx=exactRat(y*y+3*x*x),Fy=exactRat(2*x*y);return implicitProblem("products","power-products",`${style}-${x}-${y}`,`xy^2+x^3=${C}`,`(${x},${y})`,Fx,Fy,`Use the product rule on \\(xy^2\\), including \\(y'\\) when differentiating \\(y^2\\).`,["algebraic"],["power","product"])}
function implicitTrig(){
 if(R()<.5)return implicitProblem("trig","trig-relation","xsin-plus-cos",`x\\sin y+\\cos y=\\frac{3\\sqrt2}{2}`,`(2,\\frac{\\pi}{4})`,exact("sqrt(2)/2","\\frac{\\sqrt2}{2}"),exact("sqrt(2)/2","\\frac{\\sqrt2}{2}"),`Differentiate \\(x\\sin y\\) with the product and chain rules, and differentiate \\(\\cos y\\) implicitly.`,["algebraic","trig"],["power","product","trig","chain"]);
 return implicitProblem("trig","trig-relation","sin-sum",`\\sin(x+y)+x=0`,`(0,0)`,exactRat(2),exactRat(1),`Differentiate the sine with the chain rule and then differentiate the linear term.`,["algebraic","trig"],["power","trig","chain"]);
}
function implicitExponential(){
 const atOne=R()<.5,p=atOne?`(0,1)`:`(1,0)`;
 if(atOne)return implicitProblem("exponential","exponential-relation","exp-sum-01",`e^{x+y}+y^2=e+1`,p,exact("e","e"),add(exact("e","e"),exactRat(2)),`Differentiate \\(e^{x+y}\\) with the chain rule and differentiate \\(y^2\\) implicitly.`,["algebraic","exponential"],["power","chain","exponential"]);
 return implicitProblem("exponential","exponential-relation","x-exp-y",`xe^y+y=1`,p,exactRat(1),exactRat(2),`Use the product rule on \\(xe^y\\), then differentiate \\(e^y\\) and \\(y\\) implicitly.`,["algebraic","exponential"],["power","product","chain","exponential"]);
}

function logarithmFactor(style=pick(["natural","base"]),variant=pick(["linear","quadratic","trig","exponential"])){
 const p=point(String(pick([0,1,2]))),x=Number(p.raw),base=pick([2,3,5]);let inner,target;
 if(variant==="linear"){target=pick([1,2,4]);const m=nz(-4,4),b=target-m*x;inner={id:`log-lin-${m}-${b}`,tex:lin(m,b),derivativeTex:`${m}`,value:exactRat(target),derivative:exactRat(m),types:["algebraic"],rules:["power"]}}
 else if(variant==="quadratic"){target=pick([1,2,4]),inner=innerAtPoint(p,exactRat(target),"quadratic")}
 else if(variant==="trig"){p.raw="0";p.tex="0";p.id="0";const m=ri(2,6),c=pick([2,3,4]);target=c;inner={id:`log-trig-${m}-${c}`,tex:`${c}+${trigTex("sin",`${m}x`)}`,derivativeTex:`${m}\\cos(${m}x)`,value:exactRat(c),derivative:exactRat(m),types:["trig"],rules:["trig","chain"]}}
 else{p.raw="0";p.tex="0";p.id="0";const m=ri(2,5);target=1;inner={id:`log-exp-${m}`,tex:`e^{${m}x}`,derivativeTex:`${m}e^{${m}x}`,value:exactRat(1),derivative:exactRat(m),types:["exponential"],rules:["exponential","chain"]}}
 if(style==="natural"){
  const value=target===1?exactRat(0):target===Math.E?exactRat(1):exact(`ln(${target})`,`\\ln(${target})`),derivative=div(inner.derivative,inner.value);
  return{id:`ln-${inner.id}`,tex:`\\ln${factorTex(inner.tex)}`,derivativeTex:`\\frac{${inner.derivativeTex}}{${inner.tex}}`,value,derivative,types:[...new Set([...inner.types,"logarithmic"])],rules:[...new Set([...inner.rules,"logarithmic","chain"])],point:p};
 }
 const k=pick([1,2]),desired=base**k;if(variant==="linear"){const m=nz(-3,3),b=desired-m*Number(p.raw);inner={id:`logbase-lin-${m}-${b}`,tex:lin(m,b),derivativeTex:`${m}`,value:exactRat(desired),derivative:exactRat(m),types:["algebraic"],rules:["power"]}}
 const value=exactRat(k),derivative=div(inner.derivative,mul(inner.value,exact(`ln(${base})`,`\\ln(${base})`)));
 return{id:`log-${base}-${inner.id}`,tex:`\\log_{${base}}${factorTex(inner.tex)}`,derivativeTex:`\\frac{${inner.derivativeTex}}{${inner.tex}\\ln(${base})}`,value,derivative,types:[...new Set([...inner.types,"logarithmic"])],rules:[...new Set([...inner.rules,"logarithmic","chain"])],point:p};
}
function logNatural(){const f=logarithmFactor("natural",pick(["linear","quadratic"]));return directFromFactor("logarithmic","natural","natural-log",f.point,f)}
function logBase(){const f=logarithmFactor("base","linear");return directFromFactor("logarithmic","base","other-base-log",f.point,f)}
function logChain(){const f=logarithmFactor("natural",pick(["quadratic","trig","exponential"]));return directFromFactor("logarithmic","chain","log-chain",f.point,f)}
function logProduct(){const v=logarithmFactor("natural",pick(["linear","trig"])),p=v.point,u=naturalLinearFactor(p,true);return productFrom("logarithmic","product-quotient","log-product",p,u,v)}
function logQuotient(){const u=logarithmFactor("natural",pick(["linear","trig"])),p=u.point,v=naturalLinearFactor(p,true);return quotientFrom("logarithmic","product-quotient","log-quotient",p,u,v)}
function logPriorCombination(){
 const style=pick(["trig","exponential"]);
 if(style==="trig"){const c=ri(1,4),answer=exact(`${2*c}/pi`,c===1?"\\frac{2}{\\pi}":`\\frac{${2*c}}{\\pi}`);return make("logarithmic","prior-combinations","log-trig",`${c}`,`y=${coef(c,`\\ln\\left(\\frac{2x}{\\pi}\\right)\\sin x`)},\\quad x=\\frac{\\pi}{2}`,answer,finalizeSteps([`Use the product rule.`,`At \\(x=\\pi/2\\), the logarithm is \\(\\ln(1)=0\\), while \\(\\sin(\\pi/2)=1\\).`,`The surviving term is \\(${c}/x\\) evaluated at \\(x=\\pi/2\\).`],answer),{rules:["product","trig","logarithmic","chain"],functionTypes:["algebraic","trig","logarithmic"],evaluationPoint:"pi/2"})}
 const answer=exactRat(1);return make("logarithmic","prior-combinations","exp-log","0",`y=e^x\\ln(x+1),\\quad x=0`,answer,finalizeSteps([`Use the product rule, the exponential rule, and the logarithm chain rule.`,`At \\(x=0\\), \\(e^0=1\\), \\(\\ln(1)=0\\), and \\((\\ln(x+1))'=1/(x+1)=1\\).`],answer),{rules:["product","exponential","logarithmic","chain"],functionTypes:["algebraic","exponential","logarithmic"],evaluationPoint:"0"});
}
function logTrigComposition(){
 const kind=pick(["sin","cos","tan","sec","csc","cot"]),p=point(String(pick([-1,0,1]))),target=pick([2,3,4]),style=R()<.45?"linear":"quadratic";let inner;
 for(let attempt=0;attempt<40;attempt++){
  inner=innerAtPoint(p,exactRat(target),style);
  if(!isZero(inner.derivative)&&(style==="linear"||inner.termCount===3))break;
 }
 const angleRaw=`ln(${target})`,angleTex=`\\ln(${target})`,outer=exact(trigOuterDerivativeRaw(kind,angleRaw),trigOuterDerivativeTex(kind,angleTex)),logSlope=div(inner.derivative,exactRat(target)),answer=mul(outer,logSlope),logTex=`\\ln${factorTex(inner.tex)}`;
 return make("logarithmic","prior-combinations",`trig-of-log-${kind}-${style}`,`${inner.id}-${p.id}`,`y=${trigTex(kind,logTex)},\\quad x=${p.tex}`,answer,finalizeSteps([
  `Let \\(P(x)=${inner.tex}\\) and \\(u=\\ln(P(x))\\). Then \\(u'=P'(x)/P(x)\\).`,
  `At \\(x=${p.tex}\\), \\(P(x)=${target}\\) and \\(P'(x)=${inner.derivative.tex}\\), so \\(u'=${logSlope.tex}\\).`,
  `Differentiate the outer ${kind} function and evaluate it at \\(u=\\ln(${target})\\).`
 ],answer),{rules:["power","trig","chain","logarithmic"],functionTypes:["algebraic","trig","logarithmic"],evaluationPoint:p.raw,trigKind:kind,argumentStyle:`trig-of-log-${style}`,interiorTermCount:inner.termCount,logArgumentValue:target,logInnerCoefficients:inner.coeffs});
}

const INV_NAMES={asin:"\\sin^{-1}",acos:"\\cos^{-1}",atan:"\\tan^{-1}",acot:"\\cot^{-1}",asec:"\\sec^{-1}",acsc:"\\csc^{-1}"};
const INV_CASES={
 asin:[{u:exactRat(0),value:exactRat(0),base:exactRat(1)},{u:exactRat(1,2),value:exact("pi/6","\\frac{\\pi}{6}"),base:exact("2/sqrt(3)","\\frac{2}{\\sqrt3}")}],
 acos:[{u:exactRat(0),value:exact("pi/2","\\frac{\\pi}{2}"),base:exactRat(-1)},{u:exactRat(1,2),value:exact("pi/3","\\frac{\\pi}{3}"),base:exact("-2/sqrt(3)","-\\frac{2}{\\sqrt3}")}],
 atan:[{u:exactRat(0),value:exactRat(0),base:exactRat(1)},{u:exactRat(1),value:exact("pi/4","\\frac{\\pi}{4}"),base:exactRat(1,2)}],
 acot:[{u:exactRat(0),value:exact("pi/2","\\frac{\\pi}{2}"),base:exactRat(-1)},{u:exactRat(1),value:exact("pi/4","\\frac{\\pi}{4}"),base:exactRat(-1,2)}],
 asec:[{u:exactRat(2),value:exact("pi/3","\\frac{\\pi}{3}"),base:exact("1/(2*sqrt(3))","\\frac{1}{2\\sqrt3}")}],
 acsc:[{u:exactRat(2),value:exact("pi/6","\\frac{\\pi}{6}"),base:exact("-1/(2*sqrt(3))","-\\frac{1}{2\\sqrt3}")}]
};
function inverseTrigFactor(kind=null,argumentStyle="polynomial"){
 kind=kind||pick(Object.keys(INV_CASES));const candidates=argumentStyle==="polynomial"?INV_CASES[kind].filter(entry=>entry.u.rat?.[1]===1):INV_CASES[kind],inv=pick(candidates.length?candidates:INV_CASES[kind]),p=point(argumentStyle==="polynomial"?String(pick([-1,0,1])):argumentStyle==="sqrt"?"0":argumentStyle==="log"?"-1":"0");let inner;
 if(argumentStyle==="polynomial"){
  const x=Number(p.raw),m=nz(-3,3),q=pick([0,ri(-2,2)]),c=inv.u.rat[0]/inv.u.rat[1]-m*x-q*x*x,up=m+2*q*x;inner={id:`inv-poly-${m}-${q}-${c}-${p.id}`,tex:quad(q,m,c),derivativeTex:lin(2*q,m),value:inv.u,derivative:exactRat(up),types:["algebraic"],rules:["power"]};
 }else if(argumentStyle==="sqrt")inner={id:"inv-sqrt",tex:"\\sqrt{x+1}-1",derivativeTex:"\\frac{1}{2\\sqrt{x+1}}",value:exactRat(0),derivative:exactRat(1,2),types:["algebraic"],rules:["power","chain"]};
 else if(argumentStyle==="log")inner={id:"inv-log",tex:"\\ln(x+2)",derivativeTex:"\\frac1{x+2}",value:exactRat(0),derivative:exactRat(1),types:["logarithmic"],rules:["logarithmic","chain"]};
 else if(argumentStyle==="exponential")inner={id:"inv-exp",tex:"\\frac{e^x-1}{2}",derivativeTex:"\\frac{e^x}{2}",value:exactRat(0),derivative:exactRat(1,2),types:["exponential"],rules:["exponential","chain"]};
 else if(argumentStyle==="trig")inner={id:"inv-trig",tex:"\\frac{\\sin(2x)}{3}",derivativeTex:"\\frac{2\\cos(2x)}3",value:exactRat(0),derivative:exactRat(2,3),types:["trig"],rules:["trig","chain"]};
 else inner={id:"inv-prior",tex:"2+\\ln(x+1)",derivativeTex:"\\frac1{x+1}",value:exactRat(2),derivative:exactRat(1),types:["logarithmic"],rules:["logarithmic","chain"]};
 const suitable=inner.value.raw===inv.u.raw?inv:INV_CASES[kind].find(entry=>entry.u.raw===inner.value.raw);
 if(!suitable)return inverseTrigFactor(kind,"polynomial");
 const value=suitable.value,derivative=mul(suitable.base,inner.derivative);
 return{id:`inv-${kind}-${argumentStyle}-${inner.id}`,tex:`${INV_NAMES[kind]}${factorTex(inner.tex)}`,derivativeTex:`${factorTex(suitable.base.tex)}${factorTex(inner.derivativeTex)}`,value,derivative,types:[...new Set([...inner.types,"inverse-trig"])],rules:[...new Set([...inner.rules,"inverse-trig","chain"])],point:p,invKind:kind,argumentStyle};
}
function invPolynomial(){const f=inverseTrigFactor(null,"polynomial");return directFromFactor("inverse-trig","polynomial",`polynomial-${f.invKind}`,f.point,f)}
function invNonPolynomial(){const style=pick(["sqrt","log","exponential","trig","prior"]),allowed=style==="prior"?["asec","acsc"]:["asin","acos","atan","acot"],f=inverseTrigFactor(pick(allowed),style);return directFromFactor("inverse-trig","nonpolynomial",`${style}-${f.invKind}`,f.point,f)}
function invProduct(){const v=inverseTrigFactor(pick(["asin","acos","atan","acot"]),"polynomial"),p=v.point,u=naturalLinearFactor(p,true);return productFrom("inverse-trig","product-quotient","inverse-trig-product",p,u,v,{invKind:v.invKind})}
function invQuotient(){const u=inverseTrigFactor(pick(["asin","acos","atan","acot"]),"polynomial"),p=u.point,v=naturalLinearFactor(p,true);return quotientFrom("inverse-trig","product-quotient","inverse-trig-quotient",p,u,v,{invKind:u.invKind})}
function invAllSix(){const kind=pick(Object.keys(INV_CASES)),f=inverseTrigFactor(kind,"polynomial");return directFromFactor("inverse-trig","all-six",`all-six-${kind}`,f.point,f)}

const STAGES={
 power:{title:"Power Rule",options:[['mixed','Mixed'],['polynomial','Polynomial'],['negative','Negative Powers'],['fractional','Fractional Powers'],['radical','Radical Forms'],['reciprocal','Reciprocal Forms']],groups:{polynomial:[powerPolynomial],negative:[powerNegative],fractional:[powerFractional],radical:[powerRadical],reciprocal:[powerReciprocal]}},
 product:{title:"Product Rule",options:[['mixed','Mixed'],['polynomial','Polynomial Products'],['negative','Products with Negative Powers'],['radical','Products with Radicals'],['mixed-power','Mixed Power-Rule Products']],groups:{polynomial:[productPolynomial],negative:[productNegative],radical:[productRadical],'mixed-power':[productMixed]}},
 quotient:{title:"Quotient Rule",options:[['mixed','Mixed'],['linear-linear','Linear over Linear'],['polynomial-linear','Polynomial over Linear'],['linear-polynomial','Linear over Polynomial'],['polynomial-polynomial','Polynomial over Polynomial']],groups:{'linear-linear':[quotientLinearLinear],'polynomial-linear':[quotientPolynomialLinear],'linear-polynomial':[quotientLinearPolynomial],'polynomial-polynomial':[quotientPolynomialPolynomial]}},
 trig:{title:"Trigonometric Derivatives",options:[['mixed','Mixed'],['direct','Direct Trig'],['algebra-trig','Algebra + Trig'],['chain','Chain Rule with Trig'],['product','Product Rule with Trig'],['quotient','Quotient Rule with Trig']],groups:{direct:[trigDirect],'algebra-trig':[trigAlgebra],chain:[trigChain],product:[trigProduct],quotient:[trigQuotient]}},
 chain:{title:"Chain Rule",options:[['mixed','Mixed'],['algebraic','Algebraic Compositions'],['trig-composition','Trig Compositions'],['product','Products with Chain Rule'],['quotient','Quotients with Chain Rule']],groups:{algebraic:[chainAlgebra],'trig-composition':[chainTrig],product:[chainProduct],quotient:[chainQuotient]}},
 exponential:{title:"Exponential Functions",options:[['mixed','Mixed'],['direct','Basic Exponentials'],['chain','Exponential Chain Rule'],['product','Products with Exponentials'],['quotient','Quotients with Exponentials'],['trig-combination','Exponential + Trig']],groups:{direct:[expDirect],chain:[expChain],product:[expProduct],quotient:[expQuotient],'trig-combination':[expTrig]}},
 implicit:{title:"Implicit Differentiation",options:[['mixed','Mixed'],['polynomial','Polynomial Relations'],['products','Product Relations'],['trig','Trig Relations'],['exponential','Exponential Relations']],groups:{polynomial:[implicitPolynomial],products:[implicitProduct],trig:[implicitTrig],exponential:[implicitExponential]}},
 logarithmic:{title:"Logarithmic Functions",options:[['mixed','Mixed'],['natural','Natural Log'],['base','Other Log Bases'],['chain','Logarithmic Chain Rule'],['product-quotient','Products / Quotients'],['prior-combinations','Trig / Exponential Combinations']],groups:{natural:[logNatural],base:[logBase],chain:[logChain],'product-quotient':[logProduct,logQuotient],'prior-combinations':[logPriorCombination,logTrigComposition]}},
 'inverse-trig':{title:"Inverse Trigonometric Functions",options:[['mixed','Mixed'],['polynomial','Polynomial Arguments'],['nonpolynomial','Nonpolynomial Arguments'],['product-quotient','Products / Quotients'],['all-six','All Six Inverse Trig Functions']],groups:{polynomial:[invPolynomial],nonpolynomial:[invNonPolynomial],'product-quotient':[invProduct,invQuotient],'all-six':[invAllSix]}}
};
const ALLOWED={
 power:{rules:['power'],types:['algebraic']},product:{rules:['power','product'],types:['algebraic']},quotient:{rules:['power','quotient'],types:['algebraic']},trig:{rules:['power','product','quotient','trig','chain'],types:['algebraic','trig']},chain:{rules:['power','product','quotient','trig','chain'],types:['algebraic','trig']},exponential:{rules:['power','product','quotient','trig','chain','exponential'],types:['algebraic','trig','exponential']},implicit:{rules:['power','product','quotient','trig','chain','exponential','implicit'],types:['algebraic','trig','exponential','implicit']},logarithmic:{rules:['power','product','quotient','trig','chain','exponential','logarithmic'],types:['algebraic','trig','exponential','logarithmic']},'inverse-trig':{rules:['power','product','quotient','trig','chain','exponential','logarithmic','inverse-trig'],types:['algebraic','trig','exponential','logarithmic','inverse-trig']}
};
function generate(stage,focus='mixed'){
 const config=STAGES[stage];if(!config)throw Error(`Unknown derivative-at-point stage: ${stage}`);
 const actual=focus==='mixed'?pick(Object.keys(config.groups)):focus,pool=config.groups[actual];if(!pool)throw Error(`Unknown focus ${focus} for ${stage}`);
 let problem;
 for(let attempt=0;attempt<80;attempt++){
  problem=pick(pool)();
  try{const value=window.BatchMathDerivativeExpressions.evaluate(window.BatchMathDerivativeExpressions.parse(problem.answerExpr),{});if(Number.isFinite(value)&&Math.abs(value)<=200)return problem}catch(_){/* generate another manageable problem */}
 }
 return problem;
}

const solution=p=>`<div class="solution-title">Step-by-step walkthrough</div><ol class="solution-steps">${p.steps.map(s=>`<li>${s}</li>`).join("")}</ol>`;
function reveal(reason){const method=$("method");if(!method||!method.hidden)return;method.hidden=false;$("show-explanation")?.setAttribute("hidden","");window.BMAnalytics?.solutionRevealed(current,{reveal_reason:reason});typeset([method])}
function next(){const stage=window.BM_TOPIC_AT_POINT_CONFIG?.stage,focus=$("practice-type").value;let problem;for(let i=0;i<180;i++){problem=generate(stage,focus);if(!seen.has(problem.id)){seen.add(problem.id);break}if(seen.size>1400)seen.clear()}current=problem;problem.answered=false;if(new URLSearchParams(location.search).get("bm_qa")==="1")window.__BM_CURRENT_PROBLEM=problem;$("question").innerHTML=`<div class="question-prompt">${stage==="implicit"?"Find \\(dy/dx\\) at the indicated point.":"Find the derivative at the indicated x-value."}</div><div>\\(${problem.math}\\)</div>`;$("answer").value="";window.BatchMathCalculusKeypad?.reset?.();$("answer").disabled=false;$("submit").disabled=false;$("next").style.display="none";$("feedback").className="feedback";$("feedback").innerHTML="";$("topic-name").textContent=$("practice-type").selectedOptions[0].textContent;window.BMAnalytics?.ensurePracticeStarted({practice_mode:`${stage}:${focus}`});window.BMAnalytics?.problemGenerated(problem,{practice_mode:`${stage}:${focus}`});typeset([$("question")]);window.BatchMathCalculusKeypad?.focus?.()}
function check(){if(!current||current.answered)return;const value=$("answer").value.trim();if(!value){$("feedback").className="feedback wrong";$("feedback").innerHTML='<div class="status">Enter an answer first.</div>';return}const ok=window.BatchMathDerivativeExpressions.equivalent(value,current.answerExpr,[{}]);current.answered=true;attempted++;if(ok)correct++;$("correct-count").textContent=correct;$("attempted").textContent=attempted;$("answer").disabled=true;$("submit").disabled=true;$("next").style.display="inline-block";$("feedback").className=`feedback ${ok?"correct":"wrong"}`;$("feedback").innerHTML=`<div class="status">${ok?"Correct.":"Not quite."}</div><div class="correct-answer">One correct answer: \\(${current.answerTex}\\)</div><button id="show-explanation" class="practice-button show-explanation" type="button"${ok?"":" hidden"}>Show Explanation</button><div id="method" class="method"${ok?" hidden":""}>${solution(current)}</div>`;$("show-explanation")?.addEventListener("click",()=>reveal("student_request"));if(!ok)window.BMAnalytics?.solutionRevealed(current,{reveal_reason:"wrong_answer"});window.BMAnalytics?.answerChecked(current,ok);typeset([$("feedback")]);$("next").focus()}
function boot(){
 const stage=window.BM_TOPIC_AT_POINT_CONFIG?.stage,config=STAGES[stage];if(!config)return;
 $("practice-type").innerHTML=config.options.map(([value,label],index)=>`<option value="${value}"${index===0?' selected':''}>${label}</option>`).join("");
 $("submit").addEventListener("click",check);$("next").addEventListener("click",next);$("practice-type").addEventListener("change",next);$("answer").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();current?.answered?next():check()}});next();
}
window.BatchMathTopicAtPointQA=Object.freeze({stages:STAGES,allowed:ALLOWED,generate});
if(window.MathJax?.startup?.promise)window.MathJax.startup.promise.then(boot);else window.addEventListener("load",boot);
})();
