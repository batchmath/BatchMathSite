(function(){
'use strict';

/*
 * BatchMath AP Calculus AB — Unit 3 Applications of the Derivative
 * Version 12.4 curriculum layer.
 *
 * This file intentionally sits on top of ap-topic-generators.js.  It keeps the
 * common renderer, answer parser, analytics hooks, and seeded RNG while giving
 * Unit 3 a course-specific pool.  Each generated problem records whether it is
 * assignment-aligned (85%) or recent-test-style (15%).  Calculator-active
 * pages pass mode="calculator"; all other pages pass mode="noncalculator".
 */

const base=window.BatchMathAPTopicGenerators;
const R=()=>window.BatchMathRNG?.random?.() ?? 0.5;
const ri=(a,b)=>Math.floor(R()*(b-a+1))+a;
const pick=a=>a[Math.floor(R()*a.length)];
const nz=(a,b)=>{let n=0;while(!n)n=ri(a,b);return n;};
const fmt=(n,d=4)=>Number.isInteger(Number(n))?String(Number(n)):String(Number(Number(n).toFixed(d)));
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a||1;};
const frac=(n,d=1)=>{if(d<0){n=-n;d=-d;}const g=gcd(n,d);n/=g;d/=g;return d===1?String(n):`${n<0?'-':''}\\frac{${Math.abs(n)}}{${d}}`;};
const sgn=(n,body,first=false)=>{if(!n)return'';const a=Math.abs(n),term=`${a===1&&body?'':a}${body}`;return first?`${n<0?'-':''}${term}`:`${n<0?' - ':' + '}${term}`;};
const lin=(a,b,v='x')=>sgn(a,v,true)+sgn(b,'');
const quad=(a,b,c,v='x')=>sgn(a,`${v}^2`,true)+sgn(b,v)+sgn(c,'');
const cubic=(a,b,c,d,v='x')=>sgn(a,`${v}^3`,true)+sgn(b,`${v}^2`)+sgn(c,v)+sgn(d,'');
const shift=(v,a)=>a===0?v:a>0?`${v}-${a}`:`${v}+${-a}`;
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function textChoice(v){return /\b(?:yes|no|local|absolute|maximum|minimum|increasing|decreasing|concave|continuous|differentiable|horizontal|vertical|tangent|normal|moving|speeding|slowing|underestimate|overestimate|cannot|none|both|neither|theorem|root|line|point)\b/i.test(String(v));}
function mc(id,variant,prompt,math,correct,wrongs,explanation,extra={}){
  const clean=v=>String(v??'').trim().replace(/\+\s*-/g,'- ').replace(/-\s*-/g,'+ ');
  const c=clean(correct),vals=[],seen=new Set();
  for(const raw of [correct,...(wrongs||[])]){const v=clean(raw);if(v&&!seen.has(v)){seen.add(v);vals.push(v);}}
  for(const v of ['0','1','-1','None of these choices']){if(vals.length>=4)break;if(!seen.has(v)){seen.add(v);vals.push(v);}}
  const choices=shuffle(vals.slice(0,4));
  const content=math?(String(math).trim().startsWith('<')?math:`<div>\\(${math}\\)</div>`):'';
  return Object.assign({id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${content}</div>`,choices,correctIndex:choices.indexOf(c),choicesAreText:choices.some(textChoice),explanation},extra);
}
function numeric(id,variant,prompt,math,answer,answerTex,explanation,tolerance=.0006,extra={}){
  return Object.assign({id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${math}\\)</div>`:''}</div>`,answerType:'numeric',numericAnswer:Number(answer),numericTolerance:tolerance,answerTex:answerTex??fmt(answer),numericPlaceholder:'Enter a numerical answer',explanation},extra);
}
function exactExpression(id,variant,prompt,math,answerExpr,answerTex,explanation,extra={}){
  const acceptedExpressions=[answerExpr,...(extra.acceptedExpressions||[])];
  const problem=Object.assign({id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${math}\\)</div>`:''}</div>`,answerType:'exact-expression',expressionAnswer:String(answerExpr),answerTex:String(answerTex),expressionPlaceholder:extra.expressionPlaceholder||'Enter your answer',explanation,fullWidthChoices:true},extra);
  problem.acceptedExpressions=acceptedExpressions.map(String);return problem;
}
function textAnswer(id,variant,prompt,math,answer,explanation,extra={}){
  const acceptedText=[answer,...(extra.acceptedText||[])].map(v=>String(v).toLowerCase());
  const problem=Object.assign({id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${math}\\)</div>`:''}</div>`,answerType:'text-answer',answerTex:String(answer),textPlaceholder:extra.textPlaceholder||'Enter your answer',explanation,fullWidthChoices:true},extra);
  problem.acceptedText=acceptedText;return problem;
}
function intervalAnswer(id,variant,prompt,math,expected,answerTex,explanation,extra={}){
  return Object.assign({id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${math}\\)</div>`:''}</div>`,answerType:'interval-answer',intervalAnswer:{expected,requiredDecimals:Number(extra.requiredDecimals||0)},answerTex,intervalPlaceholder:'Enter interval notation',explanation,fullWidthChoices:true},extra);
}
function classifyApprox(id,variant,prompt,math,answer,classification,explanation){
  return {id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div><div>\\(${math}\\)</div></div>`,answerType:'approx-classification',numericAnswer:Number(answer),numericTolerance:.001,answerTex:Number(answer).toFixed(3),classification,explanation};
}
function bisect(fn,a,b,steps=80){let fa=fn(a),fb=fn(b);if(!Number.isFinite(fa)||!Number.isFinite(fb)||fa*fb>0)return NaN;for(let i=0;i<steps;i++){const m=(a+b)/2,fm=fn(m);if(Math.abs(fm)<1e-12)return m;if(fa*fm<=0){b=m;fb=fm;}else{a=m;fa=fm;}}return(a+b)/2;}
function braceEnd(text,open){let depth=0;for(let i=open;i<text.length;i++){if(text[i]==='{')depth++;else if(text[i]==='}'&&--depth===0)return i;}return-1;}
function oppositeNumerator(text){const raw=String(text).trim();if(!raw.startsWith('-'))return null;const body=raw.slice(1).trim();if(!body)return null;let out='',depth=0;for(let i=0;i<body.length;i++){const ch=body[i];if(ch==='{')depth++;else if(ch==='}')depth--;if(depth===0&&(ch==='+'||ch==='-'))out+=ch==='+'?'-':'+';else out+=ch;}return out;}
function normalizeTexSigns(value){
  let text=String(value??''),from=0;
  while(from<text.length){const found=/\\(?:dfrac|tfrac|frac)\{/.exec(text.slice(from));if(!found)break;const at=from+found.index,open=at+found[0].length-1,close=braceEnd(text,open);if(close<0)break;const numerator=oppositeNumerator(text.slice(open+1,close));if(numerator===null){from=at+1;continue;}let prefix=text.slice(0,at),sign='-';const adjacent=prefix.match(/([+-])\s*$/);if(adjacent){prefix=prefix.slice(0,adjacent.index);sign=adjacent[1]==='+'?'-':'+';}text=`${prefix}${sign}${text.slice(at,open+1)}${numerator}${text.slice(close)}`;from=at+1;}
  return text;
}
function texToInput(value){
  let text=String(value??'').trim();
  text=text.replace(/\\left|\\right/g,'').replace(/\\,/g,'').replace(/\\;/g,'').replace(/\\quad/g,' ');
  text=text.replace(/\\text\{[^}]*\}/g,'').replace(/\\mathrm\{[^}]*\}/g,'');
  let previous='';
  while(previous!==text){
    previous=text;
    text=text.replace(/\\(?:dfrac|tfrac|frac)\{([^{}]*)\}\{([^{}]*)\}/g,'($1)/($2)');
    text=text.replace(/\\sqrt\[([^\]]+)\]\{([^{}]*)\}/g,'($2)^(1/($1))');
    text=text.replace(/\\sqrt\{([^{}]*)\}/g,'sqrt($1)');
  }
  text=text.replace(/\\(?:dfrac|tfrac|frac)\{([^{}]+)\}([A-Za-z0-9]+)/g,'($1)/($2)');
  text=text.replace(/\\(?:dfrac|tfrac|frac)([A-Za-z0-9]+)\{([^{}]+)\}/g,'($1)/($2)');
  text=text.replace(/\\(?:dfrac|tfrac|frac)(-?\d)(\d)/g,'($1)/($2)');
  text=text.replace(/\\sqrt([0-9]+)/g,'sqrt($1)');
  text=text.replace(/\\(?:cdot|times)/g,'*').replace(/\\pi/g,'pi').replace(/\\infty/g,'infinity').replace(/\\cup/g,'U');
  text=text.replace(/\\(sin|cos|tan|sec|csc|cot|ln|log|arcsin|arccos|arctan)\s*/g,'$1');
  text=text.replace(/\^\{([^{}]+)\}/g,'^($1)').replace(/[{}]/g,'').replace(/\s+/g,'').replace(/\+\-/g,'-').replace(/--/g,'+');
  return text.replace(/^\(([^()]*)\)$/,'$1');
}
function numericFromInput(value){
  const raw=texToInput(value).replace(/^\s*[a-z]\s*=\s*/i,'');
  if(/^[-+]?\d+(?:\.\d+)?$/.test(raw))return Number(raw);
  const f=raw.match(/^\(?([-+]?\d+)\)?\/\(?([-+]?\d+)\)?$/);if(f&&Number(f[2]))return Number(f[1])/Number(f[2]);
  const safe=raw.replace(/sqrt\(/g,'Math.sqrt(').replace(/\bpi\b/g,'Math.PI');if(/^[0-9+*/().\-MathsqrtPI]+$/.test(safe)){try{const n=Function(`"use strict";return (${safe})`)();if(Number.isFinite(n))return n;}catch(_){}}
  return NaN;
}
function choiceToTyped(p){
  if(!Array.isArray(p?.choices)||!p.choices.length)return p;
  const correct=String(p.choices[p.correctIndex]??'').trim(),plain=texToInput(correct),lower=correct.toLowerCase();
  if(/\\pm/.test(correct)){
    const variable=(correct.match(/^\s*([a-z])\s*=/i)||[])[1]?.toLowerCase()||'c',magnitude=numericFromInput(correct.replace(/^\s*[a-z]\s*=\s*/i,'').replace(/\\pm/g,''));
    if(Number.isFinite(magnitude)){p.answerType='value-list';p.valueList={variable,values:[-Math.abs(magnitude),Math.abs(magnitude)]};p.answerTex=correct;p.valueListPlaceholder=`Enter ${variable} = a, b, c, …`;p.fullWidthChoices=true;}
  }else if(/^[[(].+[)\]](?:\\cup|\s*[u∪]\s*)?/i.test(correct)&&/(interval|increasing|decreasing|concave)/i.test(p.questionHtml||'')){
    p.answerType='interval-answer';p.intervalAnswer={expected:plain.replace(/infinity/gi,'infinity'),requiredDecimals:0};p.answerTex=correct;p.intervalPlaceholder='Enter interval notation';p.fullWidthChoices=true;
  }else if(/[,;]/.test(correct)&&/^\s*[a-z]\s*=/.test(correct)){
    const variable=(correct.match(/^\s*([a-z])\s*=/i)||[])[1]?.toLowerCase()||'x';const values=plain.replace(/^\s*[a-z]\s*=\s*/i,'').split(/[,;]/).map(numericFromInput);
    if(values.length&&values.every(Number.isFinite)){p.answerType='value-list';p.valueList={variable,values};p.answerTex=correct;p.valueListPlaceholder=`Enter ${variable} = a, b, c, …`;p.fullWidthChoices=true;}
    else{p.answerType='text-answer';p.acceptedText=[correct,plain];p.answerTex=correct;p.fullWidthChoices=true;}
  }else if(p.choicesAreText||/\\text\{|\b(?:yes|no|maximum|minimum|increasing|decreasing|continuous|cannot|none|both|neither|tangent|normal|by)\b/i.test(lower)){
    const normalized=plain.replace(/^[a-z]=/i,''),yesNo=correct.match(/^\s*(yes|no)\b/i)?.[1]?.toLowerCase(),short=yesNo==='yes'?'y':yesNo==='no'?'n':'';p.answerType='text-answer';p.acceptedText=[correct,plain,normalized,yesNo,short].filter(Boolean);p.answerTex=correct;p.textPlaceholder='Enter your answer';p.fullWidthChoices=true;
  }else{
    const expression=plain.replace(/^\s*(?:[acrtvxy]|speed|velocity|acceleration)\s*=\s*/i,'');
    p.answerType='exact-expression';p.expressionAnswer=expression;p.acceptedExpressions=[expression];p.answerTex=correct;p.expressionPlaceholder='Enter your answer';p.fullWidthChoices=true;
  }
  delete p.choices;delete p.correctIndex;delete p.choicesAreText;delete p.choicesHtml;return p;
}
function classificationToTyped(p){
  if(p?.answerType!=='approx-classification')return p;
  p.answerType='approximation-fields';p.approximationAnswer={value:Number(p.numericAnswer),classification:p.classification,requiredDecimals:Number(p.requiredDecimals||0)};p.fullWidthChoices=true;return p;
}
function normalizeMathInequalities(value){
  const text=String(value??'');
  const cleanBody=body=>body.replace(/</g,'\\lt ').replace(/>/g,'\\gt ');
  return text.replace(/\\\(([\s\S]*?)\\\)/g,(_,body)=>`\\(${cleanBody(body)}\\)`).replace(/\\\[([\s\S]*?)\\\]/g,(_,body)=>`\\[${cleanBody(body)}\\]`);
}
function stamp(p,slug,mode,source,family){
  if(!p)return p;
  const clean=s=>typeof s!=='string'?s:normalizeTexSigns(normalizeMathInequalities(s))
    .replace(/\\frac\s*0\s*0/g,'\\frac{0}{0}')
    .replace(/\\\(0\/0\\\)/g,'\\(\\frac{0}{0}\\)')
    .replace(/\\\(\\infty\/\\infty\\\)/g,'\\(\\frac{\\infty}{\\infty}\\)')
    .replace(/\+\s*-/g,'- ')
    .replace(/-\s*-/g,'+ ')
    .replace(/\^\{1\}/g,'')
    .replace(/\^1(?!\d)/g,'')
    .replace(/(?<![.\d])\b1(?=[a-zA-Z])/g,'')
    .replace(/-1(?=[a-zA-Z])/g,'-')
    .replace(/(?<![.\d])\b1(?=\\(?:sin|cos|tan|sec|csc|cot|ln|log|sqrt))/g,'')
    .replace(/-1(?=\\(?:sin|cos|tan|sec|csc|cot|ln|log|sqrt))/g,'-');
  for(const key of ['questionHtml','explanation','answerTex','hint'])if(key in p)p[key]=clean(p[key]);
  for(const stageKey of ['stage1','stage2']){
    const stage=p[stageKey];
    if(!stage)continue;
    for(const key of ['prompt','explanation','answerTex','correctFeedback','incorrectFeedback']){
      if(key in stage)stage[key]=clean(stage[key]);
    }
    if(Array.isArray(stage.choices))stage.choices=stage.choices.map(clean);
  }
  if(Array.isArray(p.choices)){
    const correct=clean(p.choices[p.correctIndex]),seen=new Set(),choices=[];
    for(const value of p.choices.map(clean)){if(!seen.has(value)){seen.add(value);choices.push(value);}}
    if(p.retainChoices){p.choices=choices;p.correctIndex=p.choices.indexOf(correct);}
    else{p.choices=choices;p.correctIndex=p.choices.indexOf(correct);choiceToTyped(p);}
  }
  classificationToTyped(p);
  if(mode==='calculator'&&p.answerType==='numeric'){
    const places=Number.isInteger(p.requiredDecimals)&&p.requiredDecimals>0?p.requiredDecimals:3;
    p.requiredDecimals=places;p.numericTolerance=Number(p.numericTolerance)>0&&places>3?p.numericTolerance:.5*10**(-places)+1e-12;
    p.answerTex=Number(p.numericAnswer).toFixed(places);
    p.numericPlaceholder=`Enter an answer with exactly ${places} decimal places`;
    const word=places===3?'three':String(places);if(!new RegExp(`${word} decimal`,'i').test(p.questionHtml||''))p.questionHtml=String(p.questionHtml||'').replace('</div>',` Round to exactly ${word} decimal places.</div>`);
    if(places===3){p.questionHtml=String(p.questionHtml).replace(/(?:four|six) decimals?/gi,'three decimals');p.explanation=String(p.explanation||'').replace(/(?:four|six) decimals?/gi,'three decimals');}
  }
  if(mode==='calculator'&&p.answerType==='interval-answer'){
    p.intervalAnswer=Object.assign({},p.intervalAnswer,{requiredDecimals:3});
    p.intervalPlaceholder='Enter interval notation with three-decimal endpoints';
    if(!/three decimal/i.test(p.questionHtml||''))p.questionHtml=String(p.questionHtml||'').replace('</div>',' Enter the answer in interval notation and round every finite endpoint to exactly three decimal places.</div>');
  }
  p.unit3V11=true;p.topicSlug=slug;p.calculatorActive=mode==='calculator';p.sourceKind=source;p.sourceWeight=source==='test'?15:85;p.familyId=family||p.familyId||p.variant;
  p.data=Object.assign({},p.data,{unit:'ap_calc_unit_3',mode,sourceKind:source,family:p.familyId});
  return p;
}
function weighted(slug,mode,assignment,test){
  const source=R()<.15?'test':'assignment',pool=source==='test'?test:assignment;
  const p=pick(pool)();return stamp(p,slug,mode,source,p.variant);
}
function old(slug,opts){const g=base?.get?.(slug);return typeof g==='function'?g(opts||{}):null;}
function modeOf(opts,fallback='noncalculator'){const m=String(opts?.mode||opts?.calcMode||opts?.practiceMode||fallback).toLowerCase();return m.includes('calc')&&!m.includes('non')?'calculator':'noncalculator';}

const U3={};

/* Shared exact line-answer helpers for the typed Unit 3 engines. */
const Q=(n,d=1)=>{if(d<0){n=-n;d=-d;}const g=gcd(Math.round(n),Math.round(d));return{n:Math.round(n)/g,d:Math.round(d)/g};};
const qAdd=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d);
const qSub=(a,b)=>Q(a.n*b.d-b.n*a.d,a.d*b.d);
const qMul=(a,b)=>Q(a.n*b.n,a.d*b.d);
const qDiv=(a,b)=>Q(a.n*b.d,a.d*b.n);
const qNeg=a=>Q(-a.n,a.d);
const qPlain=q=>q.d===1?String(q.n):`${q.n}/${q.d}`;
const qTex=q=>frac(q.n,q.d);
function texSlopeIntercept(m,b){
  let out='y=';
  if(m.n){const negative=m.n<0,abs=Q(Math.abs(m.n),m.d),coef=abs.n===abs.d?'':qTex(abs);out+=(negative?'-':'')+coef+'x';}
  else out+=qTex(b);
  if(m.n&&b.n){const abs=Q(Math.abs(b.n),b.d);out+=(b.n<0?'-':'+')+qTex(abs);}
  return out;
}
function slopeLine(m,b){return{equation:`y=(${qPlain(m)})*x+(${qPlain(b)})`,answerTex:texSlopeIntercept(m,b)};}
function horizontalLine(y){return{equation:`y=${qPlain(y)}`,answerTex:`y=${qTex(y)}`,requiredVariable:'y'};}
function verticalLine(x){return{equation:`x=${qPlain(x)}`,answerTex:`x=${qTex(x)}`,requiredVariable:'x'};}
function symbolicLine(equation,answerTex,requiredVariable=''){return{equation,answerTex,requiredVariable};}
function lineAtPoint(kind,x0,y0,tangentSlope){
  if(kind==='normal'&&tangentSlope.n===0){const line=verticalLine(x0);line.requiredVariable='';return line;}
  const m=kind==='normal'?qDiv(Q(-1),tangentSlope):tangentSlope;
  return slopeLine(m,qSub(y0,qMul(m,x0)));
}
function lineProblem(id,variant,prompt,math,line,explanation,extra={}){
  const required=line.requiredVariable||extra.requiredVariable||'';
  return Object.assign({id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div>${math?`<div>\\(${math}\\)</div>`:''}</div>`,answerType:'line-equation',lineAnswer:{equation:line.equation,answerTex:line.answerTex,requiredVariable:required},answerTex:line.answerTex,linePlaceholder:required?`Enter ${required} = ...`:'Enter the equation of the line',lineInputHint:required==='y'?'Your answer must begin with y =.':required==='x'?'Your answer must begin with x =.':'Equivalent slope-intercept, point-slope, and standard forms are accepted.',explanation,fullWidthChoices:true},extra);
}
function pointTex(x,y){return`(${qTex(x)},${qTex(y)})`;}
function kindLabel(kind){return kind==='normal'?'normal':'tangent';}
function poly(coeffs,v='x'){
  let out='';const degree=coeffs.length-1;
  coeffs.forEach((coefficient,index)=>{const power=degree-index;if(!coefficient)return;const body=power===0?'':power===1?v:`${v}^${power}`;out+=sgn(coefficient,body,out==='');});
  return out||'0';
}
function polyValue(coeffs,x){return coeffs.reduce((sum,c)=>sum*x+c,0);}
function polyDerivative(coeffs){const degree=coeffs.length-1;return coeffs.slice(0,-1).map((c,i)=>c*(degree-i));}
function expandedShiftPower(A,h,power,B=0,C=0){
  const coefficients=Array(power+1).fill(0);
  for(let j=0;j<=power;j++){
    let binomial=1;for(let k=1;k<=j;k++)binomial=binomial*(power-k+1)/k;
    coefficients[j]+=A*binomial*((-h)**j);
  }
  coefficients[power-1]+=B;coefficients[power]+=C-B*h;
  return coefficients;
}
function expandedSquare(h,extra=0){return quad(1,-2*h,h*h+extra);}
function trigArg(fn,arg){return `\\${fn}${arg==='x'?` ${arg}`:`\\left(${arg}\\right)`}`;}
function groupedPower(body,power){return /^[a-zA-Z]$/.test(body)?`${body}^${power}`:`(${body})^${power}`;}
function valueListProblem(id,variant,prompt,math,variable,values,explanation,answerTexParts=null){
  const sorted=[...values].sort((a,b)=>a-b);
  const labels=answerTexParts?.length===values.length?values.map((value,index)=>({value,label:answerTexParts[index]})).sort((a,b)=>a.value-b.value).map(item=>item.label):sorted.map(v=>qTex(Q(v)));
  return {id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div><div>\\(${math}\\)</div></div>`,answerType:'value-list',valueList:{variable,values:sorted},answerTex:`${variable}=${labels.join(', ')}`,valueListPlaceholder:`Enter all ${variable}-values`,explanation,fullWidthChoices:true};
}
function roundedLineProblem(id,variant,prompt,math,variable,values,explanation){
  const fields=values.map(value=>({variable,value:Number(value),answerText:Number(value).toFixed(3)}));
  return {id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div><div>\\(${math}\\)</div></div>`,answerType:'rounded-line-fields',roundedLines:fields,answerTex:fields.map(f=>`${f.variable}=${f.answerText}`).join(',\\;'),lineInputHint:`Enter each line with ${variable} = and exactly three digits after the decimal.`,explanation,fullWidthChoices:true};
}
function intervalText(parts,tex=false){
  const endpoint=value=>{
    if(value&&typeof value==='object')return tex?value.tex:value.raw;
    if(value===-Infinity||value==='-inf')return tex?'-\\infty':'-inf';
    if(value===Infinity||value==='inf')return tex?'\\infty':'inf';
    return String(value);
  };
  return parts.map(part=>`${part.leftClosed?'[':'('}${endpoint(part.left)},${endpoint(part.right)}${part.rightClosed?']':')'}`).join(tex?'\\cup':'U');
}
function intervalProblem(id,variant,prompt,math,parts,explanation,extra={}){
  return intervalAnswer(id,variant,prompt,math,intervalText(parts,false),intervalText(parts,true),explanation,extra);
}
function calculatorIntervalProblem(id,variant,prompt,math,parts,explanation,extra={}){
  const fixed=parts.map(part=>Object.assign({},part,{left:Number.isFinite(part.left)?{raw:String(part.left),tex:Number(part.left).toFixed(3)}:part.left,right:Number.isFinite(part.right)?{raw:String(part.right),tex:Number(part.right).toFixed(3)}:part.right}));
  return intervalAnswer(id,variant,prompt,math,intervalText(parts,false),intervalText(fixed,true),explanation,Object.assign({requiredDecimals:3},extra));
}
function piValue(n,d=1){
  const g=gcd(n,d);n/=g;d/=g;
  const sign=n<0?'-':'';n=Math.abs(n);
  const raw=d===1?(n===1?'pi':`${n}*pi`):(n===1?`pi/${d}`:`${n}*pi/${d}`);
  const tex=d===1?(n===1?'\\pi':`${n}\\pi`):(n===1?`\\frac{\\pi}{${d}}`:`\\frac{${n}\\pi}{${d}}`);
  return {raw:sign+raw,tex:sign+tex,value:(sign? -1:1)*n*Math.PI/d};
}
function exactScaledRadical(coefficient,value,constant=0){
  let n=coefficient*value.n,d=value.d,rad=value.rad||1;const g=gcd(n,d);n/=g;d/=g;
  if(!n)return{raw:String(constant),tex:String(constant),value:constant};
  const sign=n<0?'-':'',a=Math.abs(n),root=rad===1?'':`sqrt(${rad})`,rootTex=rad===1?'':`\\sqrt{${rad}}`;
  let raw,tex;
  if(rad===1){raw=frac(n,d).replace(/\\frac\{(\d+)\}\{(\d+)\}/,'$1/$2');tex=frac(n,d);}
  else{
    const rawNumerator=`${a===1?'':a}${root}`,texNumerator=`${a===1?'':a}${rootTex}`;
    raw=`${sign}${d===1?rawNumerator:`${rawNumerator}/${d}`}`;
    tex=`${sign}${d===1?texNumerator:`\\frac{${texNumerator}}{${d}}`}`;
  }
  if(constant){raw+=constant>0?`+${constant}`:String(constant);tex+=constant>0?`+${constant}`:String(constant);}
  return {raw,tex,value:coefficient*value.n*Math.sqrt(rad)/value.d+constant};
}
function solveIncreasing(fn,lo,hi){return bisect(fn,lo,hi,100);}

/* 1. Tangent and normal lines — exact, non-calculator. */
function tangentPolynomial(){
  const a=ri(-3,3),A=nz(-3,3),B=ri(-5,5),C=ri(-6,6),y=A*a*a+B*a+C,m=2*A*a+B,kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(y),Q(m));
  return lineProblem(`u3-tn-q-${kind}-${A}-${B}-${C}-${a}`,`polynomial_quadratic_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=${a}\\).`,`f(x)=${quad(A,B,C)}`,line,`Differentiate: \\(f'(x)=${lin(2*A,B)}\\). At \\(x=${a}\\), the point is \\(${pointTex(Q(a),Q(y))}\\) and the tangent slope is \\(${m}\\). ${kind==='normal'?'Use the negative reciprocal for the normal slope. ':''}The line is \\(${line.answerTex}\\).`);
}
function tangentCubic(){
  const a=ri(-2,2),A=nz(-2,2),B=ri(-3,3),C=ri(-4,4),D=ri(-5,5),y=A*a**3+B*a*a+C*a+D,m=3*A*a*a+2*B*a+C,kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(y),Q(m));
  return lineProblem(`u3-tn-cubic-${kind}-${A}-${B}-${C}-${D}-${a}`,`polynomial_cubic_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=${a}\\).`,`f(x)=${cubic(A,B,C,D)}`,line,`The derivative is \\(f'(x)=${quad(3*A,2*B,C)}\\). Substitution gives the point \\(${pointTex(Q(a),Q(y))}\\) and tangent slope \\(${m}\\). ${kind==='normal'?'Take the negative reciprocal of that slope. ':''}Therefore the requested line is \\(${line.answerTex}\\).`);
}
function tangentShiftedQuartic(){
  const A=nz(-2,2),h=ri(-3,3),B=nz(-5,5),C=ri(-6,6),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(h),Q(C),Q(B)),coefficients=expandedShiftPower(A,h,4,B,C),derivative=polyDerivative(coefficients);
  return lineProblem(`u3-tn-quartic-${kind}-${A}-${h}-${B}-${C}`,`expanded_quartic_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=${h}\\).`,`f(x)=${poly(coefficients)}`,line,`Differentiate: \\(f'(x)=${poly(derivative)}\\). At \\(x=${h}\\), the point is \\(${pointTex(Q(h),Q(C))}\\) and the tangent slope is \\(${B}\\). ${kind==='normal'?'Use its negative reciprocal. ':''}The requested line is \\(${line.answerTex}\\).`);
}
function tangentRadical(){
  const a=ri(-2,3),r=ri(2,5),d=ri(1,3),k=2*d*r,c=r*r-k*a,C=ri(-4,4),kind=R()<.5?'tangent':'normal',y=r+C,line=lineAtPoint(kind,Q(a),Q(y),Q(d));
  return lineProblem(`u3-tn-radical-${kind}-${a}-${r}-${d}-${C}`,`radical_chain_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=${a}\\).`,`f(x)=\\sqrt{${lin(k,c)}}${sgn(C,'')}`,line,`Since \\(f'(x)=\\frac{${k}}{2\\sqrt{${lin(k,c)}}}\\), the tangent slope at \\(x=${a}\\) is \\(${d}\\). The point is \\(${pointTex(Q(a),Q(y))}\\). ${kind==='normal'?'The normal slope is the negative reciprocal. ':''}Thus the line is \\(${line.answerTex}\\).`);
}
function tangentFractionalPower(){
  const A=nz(-3,3),s=ri(1,3),a=s*s,C=ri(-5,5),y=A*s**3+C,m=Q(3*A*s,2),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(y),m);
  return lineProblem(`u3-tn-fracpow-${kind}-${A}-${s}-${C}`,`fractional_power_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=${a}\\).`,`f(x)=${sgn(A,'x^{\\frac{3}{2}}',true)}${sgn(C,'')}`,line,`The derivative is \\(f'(x)=${frac(3*A,2)}\\sqrt{x}\\). At \\(x=${a}\\), the point is \\(${pointTex(Q(a),Q(y))}\\) and the tangent slope is \\(${qTex(m)}\\). ${kind==='normal'?'Use the negative reciprocal for the normal slope. ':''}The line is \\(${line.answerTex}\\).`);
}
function tangentReciprocal(){
  const A=nz(-6,6),h=ri(-3,3),r=ri(1,3),C=ri(-4,4),a=h+r,y=qAdd(Q(C),Q(A,r)),m=Q(-A,r*r),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),y,m),den=shift('x',h);
  return lineProblem(`u3-tn-recip-${kind}-${A}-${h}-${r}-${C}`,`reciprocal_shift_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=${a}\\).`,`f(x)=\\frac{${A}}{${den}}${sgn(C,'')}`,line,`Differentiate: \\(f'(x)=-\\frac{${A}}{(${den})^2}\\). At \\(x=${a}\\), the point is \\(${pointTex(Q(a),y)}\\) and the tangent slope is \\(${qTex(m)}\\). ${kind==='normal'?'Use the negative reciprocal. ':''}The requested line is \\(${line.answerTex}\\).`);
}

function tangentExponential(){
  const A=nz(-4,4),k=nz(-3,3),C=ri(-5,5),kind=R()<.5?'tangent':'normal',y=A+C,m=A*k,line=lineAtPoint(kind,Q(0),Q(y),Q(m));
  return lineProblem(`u3-tn-exp-${kind}-${A}-${k}-${C}`,`exponential_chain_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=0\\).`,`f(x)=${sgn(A,`e^{${lin(k,0)}}`,true)}${sgn(C,'')}`,line,`The derivative is \\(f'(x)=${sgn(A*k,`e^{${lin(k,0)}}`,true)}\\). At \\(x=0\\), the point is \\(${pointTex(Q(0),Q(y))}\\) and the tangent slope is \\(${m}\\). ${kind==='normal'?'Use the negative reciprocal for the normal slope. ':''}The line is \\(${line.answerTex}\\).`);
}
function tangentLogarithmic(){
  const A=nz(-6,6),C=ri(-5,5),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(1),Q(C),Q(A));
  return lineProblem(`u3-tn-log-${kind}-${A}-${C}`,`logarithmic_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=1\\).`,`f(x)=${sgn(A,'\\ln x',true)}${sgn(C,'')}`,line,`The point is \\((1,${C})\\). Since \\(f'(x)=\\frac{${A}}{x}\\), the tangent slope is \\(${A}\\). ${kind==='normal'?'The normal slope is its negative reciprocal. ':''}The requested line is \\(${line.answerTex}\\).`);
}
function tangentSine(){
  const A=nz(-4,4),k=ri(1,5),C=ri(-5,5),kind=R()<.5?'tangent':'normal',m=A*k,line=lineAtPoint(kind,Q(0),Q(C),Q(m));
  return lineProblem(`u3-tn-sine-${kind}-${A}-${k}-${C}`,`sine_chain_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=0\\).`,`f(x)=${sgn(A,trigArg('sin',`${k}x`),true)}${sgn(C,'')}`,line,`Differentiate: \\(f'(x)=${sgn(A*k,trigArg('cos',`${k}x`),true)}\\). At \\(x=0\\), the point is \\((0,${C})\\) and the tangent slope is \\(${m}\\). ${kind==='normal'?'Use the negative reciprocal. ':''}The line is \\(${line.answerTex}\\).`);
}
function tangentCosine(){
  const A=nz(-4,4),k=ri(1,4),C=ri(-4,4),kind=R()<.5?'tangent':'normal',m=kind==='tangent'?Q(-A*k):Q(1,A*k),xTex=k===1?'\\frac{\\pi}{2}':`\\frac{\\pi}{${2*k}}`,xPlain=`pi/${2*k}`,ySide=C===0?'y':C>0?`y-${C}`:`y+${-C}`,mTex=m.n===m.d?'':m.n===-m.d?'-':qTex(m),line=symbolicLine(`${ySide}=(${qPlain(m)})*(x-${xPlain})`,`${ySide}=${mTex}\\left(x-${xTex}\\right)`);
  return lineProblem(`u3-tn-cos-${kind}-${A}-${k}-${C}`,`cosine_special_angle_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=${xTex}\\).`,`f(x)=${sgn(A,`\\cos(${k}x)`,true)}${sgn(C,'')}`,line,`At \\(x=${xTex}\\), the point is \\(( ${xTex},${C} )\\). The tangent slope is \\(${-A*k}\\). ${kind==='normal'?`Its negative reciprocal is \\(${qTex(m)}\\).`:'Use that tangent slope in point-slope form.'} The requested line is \\(${line.answerTex}\\).`);
}
function tangentTangent(){
  const A=nz(-4,4),k=ri(1,4),C=ri(-5,5),kind=R()<.5?'tangent':'normal',m=A*k,line=lineAtPoint(kind,Q(0),Q(C),Q(m));
  return lineProblem(`u3-tn-tan-${kind}-${A}-${k}-${C}`,`tangent_function_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=0\\).`,`f(x)=${sgn(A,trigArg('tan',`${k}x`),true)}${sgn(C,'')}`,line,`The derivative is \\(f'(x)=${sgn(A*k,`\\sec^2\\left(${k}x\\right)`,true)}\\). At \\(x=0\\), the point is \\((0,${C})\\) and the tangent slope is \\(${m}\\). ${kind==='normal'?'Use the negative reciprocal. ':''}Therefore the line is \\(${line.answerTex}\\).`);
}
function tangentProductExponential(){
  let A,B,k,m;do{A=nz(-4,4);B=nz(-4,4);k=nz(-2,2);m=A+k*B;}while(!m);const C=ri(-4,4),kind=R()<.5?'tangent':'normal',y=B+C,line=lineAtPoint(kind,Q(0),Q(y),Q(m));
  return lineProblem(`u3-tn-prodexp-${kind}-${A}-${B}-${k}-${C}`,`product_exponential_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=0\\).`,`f(x)=(${lin(A,B)})e^{${lin(k,0)}}${sgn(C,'')}`,line,`At \\(x=0\\), the product rule gives \\(f'(0)=${A}+(${k})(${B})=${m}\\). The point is \\((0,${y})\\). ${kind==='normal'?'Use the negative reciprocal of the tangent slope. ':''}The line is \\(${line.answerTex}\\).`);
}
function tangentProductTrig(){
  const A=nz(-4,4),B=nz(-5,5),C=ri(-4,4),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(0),Q(C),Q(B));
  return lineProblem(`u3-tn-prodtrig-${kind}-${A}-${B}-${C}`,`product_trigonometric_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=0\\).`,`f(x)=(${lin(A,B)})\\sin x${sgn(C,'')}`,line,`By the product rule, \\(f'(x)=${A}\\sin x+(${lin(A,B)})\\cos x\\), so \\(f'(0)=${B}\\). The point is \\((0,${C})\\). ${kind==='normal'?'Use the negative reciprocal. ':''}The requested line is \\(${line.answerTex}\\).`);
}
function tangentQuotient(){
  let A,B,c,m;do{A=nz(-4,4);B=nz(-6,6);c=ri(1,5);m=A*c-B;}while(!m);const C=ri(-3,3),kind=R()<.5?'tangent':'normal',y=qAdd(Q(B,c),Q(C)),slope=Q(m,c*c),line=lineAtPoint(kind,Q(0),y,slope);
  return lineProblem(`u3-tn-quot-${kind}-${A}-${B}-${c}-${C}`,`rational_quotient_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=0\\).`,`f(x)=\\frac{${lin(A,B)}}{x+${c}}${sgn(C,'')}`,line,`The quotient rule gives \\(f'(0)=\\frac{${A*c}-${B}}{${c*c}}=${qTex(slope)}\\). The point is \\(${pointTex(Q(0),y)}\\). ${kind==='normal'?'Take the negative reciprocal for the normal slope. ':''}The line is \\(${line.answerTex}\\).`);
}
function tangentInverseTrig(){
  const A=nz(-5,5),C=ri(-5,5),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(0),Q(C),Q(A));
  return lineProblem(`u3-tn-atan-${kind}-${A}-${C}`,`inverse_trigonometric_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(x=0\\).`,`f(x)=${sgn(A,'\\tan^{-1}x',true)}${sgn(C,'')}`,line,`Since \\(f'(x)=\\frac{${A}}{1+x^2}\\), the tangent slope at \\(x=0\\) is \\(${A}\\), and the point is \\((0,${C})\\). ${kind==='normal'?'Use the negative reciprocal. ':''}The requested line is \\(${line.answerTex}\\).`);
}
function tangentImplicit(){
  const a=ri(1,4),b=ri(1,4),A=ri(1,4),B=ri(1,4),C=ri(1,4),K=A*a*a+C*a*b+B*b*b,m=Q(-(2*A*a+C*b),C*a+2*B*b),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(b),m);
  return lineProblem(`u3-tn-implicit-${kind}-${A}-${B}-${C}-${a}-${b}`,`implicit_mixed_quadratic_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(( ${a},${b} )\\).`,`${sgn(A,'x^2',true)}${sgn(C,'xy')}${sgn(B,'y^2')}=${K}`,line,`Implicit differentiation gives \\(${2*A}x+${C}y+(${C}x+${2*B}y)y'=0\\). At the point, \\(y'=${qTex(m)}\\). ${kind==='normal'?'Use its negative reciprocal for the normal slope. ':''}The line is \\(${line.answerTex}\\).`);
}
function tangentImplicitPowerSum(){
  const a=ri(1,3),b=ri(1,3),A=ri(1,4),B=ri(1,4),p=pick([2,3,4]),q=pick([2,3,4]),K=A*a**p+B*b**q,m=Q(-A*p*a**(p-1),B*q*b**(q-1)),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(b),m);
  return lineProblem(`u3-tn-ipower-${kind}-${A}-${B}-${p}-${q}-${a}-${b}`,`implicit_power_sum_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(( ${a},${b} )\\).`,`${sgn(A,`x^${p}`,true)}${sgn(B,`y^${q}`)}=${K}`,line,`Differentiate implicitly: \\(${A*p}x^{${p-1}}+${B*q}y^{${q-1}}y'=0\\). Substitution gives \\(y'=${qTex(m)}\\). ${kind==='normal'?'Use the negative reciprocal. ':''}The requested line is \\(${line.answerTex}\\).`);
}
function tangentImplicitCubicLinear(){
  const a=ri(-2,2),b=nz(-3,3),C=ri(-5,5),D=ri(1,4),K=a**3+D*b*b+C*a,m=Q(-(3*a*a+C),2*D*b),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(b),m);
  return lineProblem(`u3-tn-icubic-${kind}-${a}-${b}-${C}-${D}`,`implicit_cubic_square_linear_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(( ${a},${b} )\\).`,`x^3${sgn(D,'y^2')}${sgn(C,'x')}=${K}`,line,`Differentiating gives \\(3x^2+${2*D}yy'${sgn(C,'')}=0\\), so the tangent slope at the point is \\(${qTex(m)}\\). ${kind==='normal'?'Use its negative reciprocal. ':''}The line is \\(${line.answerTex}\\).`);
}
function tangentImplicitProduct(){
  const a=ri(1,3),b=ri(1,3),A=ri(1,3),B=ri(1,3),C=ri(1,4),K=A*a*a*b+B*b**3+C*a,m=Q(-(2*A*a*b+C),A*a*a+3*B*b*b),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(b),m);
  return lineProblem(`u3-tn-iproduct-${kind}-${A}-${B}-${C}-${a}-${b}`,`implicit_product_cubic_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(( ${a},${b} )\\).`,`${sgn(A,'x^2y',true)}${sgn(B,'y^3')}${sgn(C,'x')}=${K}`,line,`Implicit differentiation gives \\(${2*A}xy+${C}+(${A}x^2+${3*B}y^2)y'=0\\). At the stated point, \\(y'=${qTex(m)}\\). ${kind==='normal'?'Use its negative reciprocal. ':''}The line is \\(${line.answerTex}\\).`);
}
function tangentImplicitKampyle(){
  const a=ri(1,3),b=ri(1,5),A=ri(1,3),B=nz(-4,4),C=b*b-A*a**4-B*a*a,m=Q(4*A*a**3+2*B*a,2*b),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(b),m);
  return lineProblem(`u3-tn-ikampyle-${kind}-${A}-${B}-${C}-${a}-${b}`,`implicit_quartic_kampyle_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(( ${a},${b} )\\).`,`y^2=${sgn(A,'x^4',true)}${sgn(B,'x^2')}${sgn(C,'')}`,line,`Differentiating gives \\(2yy'=${4*A}x^3${sgn(2*B,'x')}\\). At the point, the tangent slope is \\(${qTex(m)}\\). ${kind==='normal'?'Use the negative reciprocal. ':''}The requested line is \\(${line.answerTex}\\).`);
}
function tangentImplicitExponential(){
  const b=nz(-4,4),A=ri(1,4),B=ri(1,4),K=A+B*b*b,m=Q(-A,2*B*b),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(0),Q(b),m);
  return lineProblem(`u3-tn-iexp-${kind}-${A}-${B}-${b}`,`implicit_exponential_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\((0,${b})\\).`,`${sgn(A,'e^x',true)}${sgn(B,'y^2')}=${K}`,line,`Implicit differentiation gives \\(${A}e^x+${2*B}yy'=0\\). At \\((0,${b})\\), the tangent slope is \\(${qTex(m)}\\). ${kind==='normal'?'Use its negative reciprocal. ':''}The line is \\(${line.answerTex}\\).`);
}
function tangentImplicitTrig(){
  const A=ri(1,5),B=ri(1,5),kind=R()<.5?'tangent':'normal',m=kind==='tangent'?Q(A,B):Q(-B,A),plainFactor=m.n===m.d?'x':m.n===-m.d?'-x':`(${qPlain(m)})*x`,texFactor=m.n===m.d?'x':m.n===-m.d?'-x':`${qTex(m)}x`,line=symbolicLine(`y-pi/2=${plainFactor}`,`y-\\frac{\\pi}{2}=${texFactor}`);
  return lineProblem(`u3-tn-itrig-${kind}-${A}-${B}`,`implicit_trigonometric_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(\\left(0,\\frac{\\pi}{2}\\right)\\).`,`${sgn(A,'\\sin x',true)}${sgn(B,'\\cos y')}=0`,line,`Differentiating gives \\(${A}\\cos x-${B}\\sin y\\,y'=0\\), so the tangent slope at the point is \\(\\frac{${A}}{${B}}\\). ${kind==='normal'?'The normal slope is its negative reciprocal. ':''}The requested line is \\(${line.answerTex}\\).`);
}
function tangentImplicitMixedProduct(){
  const a=ri(1,3),b=ri(1,3),A=ri(1,4),B=ri(1,4),C=ri(1,4),K=A*a*a*b+B*a*a+C*b*b,m=Q(-(2*A*a*b+2*B*a),A*a*a+2*C*b),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(b),m);
  return lineProblem(`u3-tn-imixedproduct-${kind}-${A}-${B}-${C}-${a}-${b}`,`implicit_assignment_style_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \\(( ${a},${b} )\\).`,`${sgn(A,'x^2y',true)}${sgn(B,'x^2')}${sgn(C,'y^2')}=${K}`,line,`Differentiation gives \\(${2*A}xy+${2*B}x+(${A}x^2+${2*C}y)y'=0\\). Substitution gives \\(y'=${qTex(m)}\\). ${kind==='normal'?'Use its negative reciprocal. ':''}The line is \\(${line.answerTex}\\).`);
}
function tangentImplicitLogarithmic(){
  let A,B,C,b,den;do{A=nz(-5,5);B=nz(-3,3);C=nz(-5,5);b=nz(-3,3);den=2*B*b+C;}while(!den);const K=B*b*b+C*b,m=Q(-A,den),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(1),Q(b),m);
  return lineProblem(`u3-tn-ilog-${kind}-${A}-${B}-${C}-${b}`,`implicit_logarithmic_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \((1,${b})\).`,`${sgn(A,'\\ln x',true)}${sgn(B,'y^2')}${sgn(C,'y')}=${K}`,line,`Implicit differentiation gives \(\\frac{${A}}{x}+(${2*B}y${sgn(C,'')})y'=0\). At the point, \(y'=${qTex(m)}\). ${kind==='normal'?'Use the negative reciprocal for the normal slope. ':''}The requested line is \(${line.answerTex}\).`);
}
function tangentImplicitExponentialProduct(){
  let A,B,C,b,num;do{A=nz(-4,4);B=nz(-5,5);C=nz(-5,5);b=nz(-3,3);num=A*b+B;}while(!num);const K=A+C*b,m=Q(-num,C),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(0),Q(b),m);
  return lineProblem(`u3-tn-iexpprod-${kind}-${A}-${B}-${C}-${b}`,`implicit_exponential_product_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \((0,${b})\).`,`${sgn(A,'e^{xy}',true)}${sgn(B,'x')}${sgn(C,'y')}=${K}`,line,`Differentiating gives \(${A}e^{xy}(y+xy')${sgn(B,'')}+${C}y'=0\). At \((0,${b})\), the tangent slope is \(${qTex(m)}\). ${kind==='normal'?'Use its negative reciprocal. ':''}Thus the line is \(${line.answerTex}\).`);
}
function tangentImplicitTrigProduct(){
  const A=nz(-5,5),B=nz(-4,4),C=nz(-4,4),b=nz(-3,3),K=C*b*b,m=Q(-A,2*C),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(0),Q(b),m);
  return lineProblem(`u3-tn-itrigprod-${kind}-${A}-${B}-${C}-${b}`,`implicit_trigonometric_product_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \((0,${b})\).`,`${sgn(A,'\\sin(xy)',true)}${sgn(B,'x^2')}${sgn(C,'y^2')}=${K}`,line,`Implicit differentiation gives \(${A}\\cos(xy)(y+xy')${sgn(2*B,'x')}+${2*C}yy'=0\). Substitution gives \(y'=${qTex(m)}\). ${kind==='normal'?'Use the negative reciprocal. ':''}The line is \(${line.answerTex}\).`);
}
function tangentImplicitReciprocal(){
  let a,b,A,B,C,D,num,den;do{a=ri(1,4);b=ri(1,4);A=nz(-5,5);B=nz(-5,5);C=nz(-3,3);D=nz(-3,3);num=(A-C*a*a)*b*b;den=a*a*(D*b*b-B);}while(!den||!num);const K=Q(A*b+B*a+C*a*a*b+D*a*b*b,a*b),m=Q(num,den),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(b),m);
  return lineProblem(`u3-tn-irecip-${kind}-${A}-${B}-${C}-${D}-${a}-${b}`,`implicit_reciprocal_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \(( ${a},${b} )\).`,`\\frac{${A}}{x}+\\frac{${B}}{y}${sgn(C,'x')}${sgn(D,'y')}=${qTex(K)}`,line,`Differentiating gives \(-\\frac{${A}}{x^2}-\\frac{${B}}{y^2}y'${sgn(C,'')}+${D}y'=0\). Substitute the point and solve for \(y'=${qTex(m)}\). ${kind==='normal'?'Then use the negative reciprocal. ':''}The line is \(${line.answerTex}\).`);
}
function tangentImplicitHigherProduct(){
  let a,b,A,B,C,D,fx,fy;do{a=nz(-2,2);b=nz(-2,2);A=nz(-3,3);B=nz(-3,3);C=nz(-4,4);D=nz(-4,4);fx=3*A*a*a*b+B*b*b+C;fy=A*a**3+2*B*a*b+D;}while(!fx||!fy);const K=A*a**3*b+B*a*b*b+C*a+D*b,m=Q(-fx,fy),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(b),m);
  return lineProblem(`u3-tn-ihigherprod-${kind}-${A}-${B}-${C}-${D}-${a}-${b}`,`implicit_higher_product_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \(( ${a},${b} )\).`,`${sgn(A,'x^3y',true)}${sgn(B,'xy^2')}${sgn(C,'x')}${sgn(D,'y')}=${K}`,line,`Implicit differentiation and collection of the \(y'\)-terms gives \(y'=-\\frac{${sgn(3*A,'x^2y',true)}${sgn(B,'y^2')}${sgn(C,'')}}{${sgn(A,'x^3',true)}${sgn(2*B,'xy')}${sgn(D,'')}}\). At the point, \(y'=${qTex(m)}\). ${kind==='normal'?'Use its negative reciprocal. ':''}The requested line is \(${line.answerTex}\).`);
}
function tangentImplicitShiftedConic(){
  const h=ri(-3,3),k=ri(-3,3),r=nz(-3,3),s=nz(-3,3),A=ri(1,4),B=ri(1,4),a=h+r,b=k+s,K=A*r*r+B*s*s,m=Q(-A*r,B*s),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(b),m),u=shift('x',h),v=shift('y',k);
  return lineProblem(`u3-tn-iconic-${kind}-${A}-${B}-${h}-${k}-${r}-${s}`,`implicit_shifted_conic_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \(( ${a},${b} )\).`,`${sgn(A,groupedPower(u,2),true)}${sgn(B,groupedPower(v,2))}=${K}`,line,`Differentiation gives \(${2*A}(${u})+${2*B}(${v})y'=0\). Substitution gives \(y'=${qTex(m)}\). ${kind==='normal'?'Use the negative reciprocal. ':''}Therefore the line is \(${line.answerTex}\).`);
}
function tangentImplicitSineSum(){
  let A,B,C,mn;do{A=nz(-5,5);B=nz(-5,5);C=nz(-4,4);mn=A+C;}while(!mn);const m=Q(-mn,B),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(0),Q(0),m);
  return lineProblem(`u3-tn-isinesum-${kind}-${A}-${B}-${C}`,`implicit_sine_sum_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \((0,0)\).`,`${sgn(A,'\\sin x',true)}${sgn(B,'\\sin y')}${sgn(C,'x')}=0`,line,`Differentiate to obtain \(${A}\\cos x+${B}\\cos y\,y'${sgn(C,'')}=0\). At \((0,0)\), \(y'=${qTex(m)}\). ${kind==='normal'?'Use the negative reciprocal. ':''}The requested line is \(${line.answerTex}\).`);
}
function tangentImplicitRadical(){
  let a,b,r,A,B,den;do{a=ri(-2,3);b=nz(-3,3);r=ri(1,5);A=nz(-3,3);B=nz(-5,5);den=2*r*(2*A*b+B);}while(!den);const c=r*r-a,K=r+A*b*b+B*b,m=Q(-1,den),kind=R()<.5?'tangent':'normal',line=lineAtPoint(kind,Q(a),Q(b),m);
  return lineProblem(`u3-tn-iroot-${kind}-${A}-${B}-${a}-${b}-${r}`,`implicit_radical_${kind}`,`Find the equation of the ${kindLabel(kind)} line at \(( ${a},${b} )\).`,`\\sqrt{${lin(1,c)}}${sgn(A,'y^2')}${sgn(B,'y')}=${K}`,line,`Implicit differentiation gives \(\\frac{1}{2\\sqrt{${lin(1,c)}}}+(${2*A}y${sgn(B,'')})y'=0\). At the point, \(y'=${qTex(m)}\). ${kind==='normal'?'Use its negative reciprocal. ':''}The line is \(${line.answerTex}\).`);
}
const tangentLineFamilies=[tangentPolynomial,tangentCubic,tangentShiftedQuartic,tangentRadical,tangentFractionalPower,tangentReciprocal,tangentExponential,tangentLogarithmic,tangentSine,tangentCosine,tangentTangent,tangentProductExponential,tangentProductTrig,tangentQuotient,tangentInverseTrig];
const tangentImplicitFamilies=[tangentImplicit,tangentImplicitPowerSum,tangentImplicitCubicLinear,tangentImplicitProduct,tangentImplicitKampyle,tangentImplicitExponential,tangentImplicitTrig,tangentImplicitMixedProduct,tangentImplicitLogarithmic,tangentImplicitExponentialProduct,tangentImplicitTrigProduct,tangentImplicitReciprocal,tangentImplicitHigherProduct,tangentImplicitShiftedConic,tangentImplicitSineSum,tangentImplicitRadical];
U3['equations-of-tangent-and-normal-lines']=(opts={})=>{const source=R()<.15?'test':'assignment',pool=R()<.30?tangentImplicitFamilies:tangentLineFamilies,p=pick(pool)();return stamp(p,'equations-of-tangent-and-normal-lines','noncalculator',source,p.variant);};

/* 2. Explicit horizontal and vertical tangents. */
function horizontalPolynomialQuadratic(){
  const r1=ri(-4,-1),r2=ri(1,4),target=R()<.5?r1:r2,s=R()<.5?-1:1,C=ri(-8,8),coeff=[2*s,-3*s*(r1+r2),6*s*r1*r2,C],y=polyValue(coeff,target),line=horizontalLine(Q(y));
  return lineProblem(`u3-hv-polyquad-${r1}-${r2}-${target}-${s}-${C}`,'horizontal_polynomial_quadratic_derivative',`Find the horizontal tangent line at ${target===r1?'the smaller':'the larger'} critical number.`,`f(x)=${poly(coeff)}`,line,`Differentiate and factor: \\(f'(x)=${6*s}(x-${r1})(x-${r2})\\). The requested critical number is \\(x=${target}\\). Since \\(f(${target})=${y}\\), the horizontal tangent line is \\(${line.answerTex}\\).`);
}
function horizontalPolynomialGrouping(){
  const a=nz(-4,4),b=ri(1,6),s=R()<.5?-1:1,C=ri(-8,8),coeff=[3*s,4*s*a,6*s*b,12*s*a*b,C],x=-a,y=polyValue(coeff,x),line=horizontalLine(Q(y));
  return lineProblem(`u3-hv-polygroup-${a}-${b}-${s}-${C}`,'horizontal_polynomial_factoring_by_grouping',`Find the equation of the horizontal tangent line.`,`f(x)=${poly(coeff)}`,line,`The derivative factors by grouping: \\(f'(x)=${12*s}(x^3${sgn(a,'x^2')}${sgn(b,'x')}${sgn(a*b,'')})=${12*s}(x${sgn(a,'')})(x^2+${b})\\). The only real critical number is \\(x=${x}\\). Substitution gives \\(f(${x})=${y}\\), so the line is \\(${line.answerTex}\\).`);
}
function horizontalPolynomialSubstitution(){
  const r=ri(1,3),t=ri(r+1,5),target=R()<.5?r:t,s=R()<.5?-1:1,C=ri(-6,6),sum=r*r+t*t,product=r*r*t*t,coeff=[3*s,0,-5*s*sum,0,15*s*product,C],y=polyValue(coeff,target),line=horizontalLine(Q(y));
  return lineProblem(`u3-hv-polysub-${r}-${t}-${target}-${s}-${C}`,'horizontal_polynomial_variable_substitution',`Find the horizontal tangent line corresponding to the positive critical number \\(x=${target}\\).`,`f(x)=${poly(coeff)}`,line,`Differentiate: \\(f'(x)=${15*s}(x^4-${sum}x^2+${product})\\). With \\(u=x^2\\), this factors as \\(${15*s}(u-${r*r})(u-${t*t})\\), so the positive critical numbers are \\(${r}\\) and \\(${t}\\). At \\(x=${target}\\), the function value is \\(${y}\\); therefore the line is \\(${line.answerTex}\\).`);
}
function horizontalLog(){
  const A=nz(-4,4),C=ri(-5,5),line=horizontalLine(Q(A+C));
  return lineProblem(`u3-hv-log-${A}-${C}`,'horizontal_logarithmic',`Find the equation of the horizontal tangent line.`,`f(x)=${sgn(A,'x^2',true)}${sgn(-2*A,'\\ln x')}${sgn(C,'')}`,line,`For \\(x>0\\), \\(f'(x)=${2*A}x-\\frac{${2*A}}x=${2*A}\\left(x-\\frac1x\\right)\\). The derivative is zero at \\(x=1\\). Then \\(f(1)=${A+C}\\), so the line is \\(${line.answerTex}\\).`);
}
function horizontalExponentialProduct(){
  const A=nz(-4,4),h=ri(-3,3),factor=shift('x',h),factorTex=h===0?'x':`(${factor})`,exponent=lin(-1,h),rhsPlain=`(${A})/e`,rhsTex=`${A<0?'-':''}\\frac{${Math.abs(A)}}{e}`,line=symbolicLine(`y=${rhsPlain}`,`y=${rhsTex}`,'y'),valueTex=`${A<0?'-':''}\\frac{${Math.abs(A)}}{e}`;
  return lineProblem(`u3-hv-expprod-${A}-${h}`,'horizontal_exponential_product',`Find the equation of the horizontal tangent line.`,`f(x)=${sgn(A,`${factorTex}e^{${exponent}}`,true)}`,line,`The derivative is \\(f'(x)=${sgn(A,`e^{${exponent}}`,true)}(${lin(-1,h+1)})\\). It equals zero at \\(x=${h+1}\\). The function value there is \\(${valueTex}\\), so the line is \\(${line.answerTex}\\).`);
}
function horizontalSine(){
  const A=nz(-5,5),k=ri(1,5),C=ri(-5,5),xTex=k===1?'\\frac{\\pi}{2}':`\\frac{\\pi}{${2*k}}`,line=horizontalLine(Q(A+C));
  return lineProblem(`u3-hv-sine-${A}-${k}-${C}`,'horizontal_sine',`Find the equation of the first horizontal tangent line for \\(x>0\\).`,`f(x)=${sgn(A,`\\sin(${k}x)`,true)}${sgn(C,'')}`,line,`Since \\(f'(x)=${A*k}\\cos(${k}x)\\), the first positive critical number is \\(x=${xTex}\\). The function value is \\(${A+C}\\), so the horizontal tangent line is \\(${line.answerTex}\\).`);
}
function horizontalCosine(){
  const A=nz(-5,5),k=ri(1,5),C=ri(-5,5),line=horizontalLine(Q(A+C));
  return lineProblem(`u3-hv-cos-${A}-${k}-${C}`,'horizontal_cosine',`Find the equation of the horizontal tangent line at \\(x=0\\).`,`f(x)=${sgn(A,`\\cos(${k}x)`,true)}${sgn(C,'')}`,line,`The derivative is \\(${-A*k}\\sin(${k}x)\\), so the tangent is horizontal at \\(x=0\\). Because \\(f(0)=${A+C}\\), the line is \\(${line.answerTex}\\).`);
}
function horizontalTangentCombination(){
  const A=nz(-5,5),C=ri(-6,6),line=horizontalLine(Q(C));
  return lineProblem(`u3-hv-tancombo-${A}-${C}`,'horizontal_tangent_combination',`Find the equation of the horizontal tangent line at the critical number nearest zero.`,`f(x)=${sgn(A,'(\\tan x-x)',true)}${sgn(C,'')}`,line,`Differentiate: \\(f'(x)=${A}(\\sec^2x-1)=${A}\\tan^2x\\). The nearest critical number is \\(x=0\\), where \\(f(0)=${C}\\). Thus the line is \\(${line.answerTex}\\).`);
}
function horizontalRadical(){
  const h=ri(-4,4),r=ri(1,5),C=ri(-5,5),inside=expandedSquare(h,r*r),line=horizontalLine(Q(r+C));
  return lineProblem(`u3-hv-radical-${h}-${r}-${C}`,'horizontal_radical',`Find the equation of the horizontal tangent line.`,`f(x)=\\sqrt{${inside}}${sgn(C,'')}`,line,`The derivative is \\(f'(x)=\\frac{${shift('x',h)}}{\\sqrt{${inside}}}\\), so it is zero at \\(x=${h}\\). The function value is \\(${r+C}\\), giving \\(${line.answerTex}\\).`);
}
function horizontalRational(){
  const A=nz(-6,6),s=ri(1,4),C=ri(-4,4),y=qAdd(Q(C),Q(A,2*s)),line=horizontalLine(y);
  return lineProblem(`u3-hv-rational-${A}-${s}-${C}`,'horizontal_rational',`Find the horizontal tangent line corresponding to the positive critical number.`,`f(x)=\\frac{${A}x}{x^2+${s*s}}${sgn(C,'')}`,line,`The derivative is \\(f'(x)=\\frac{${A}(${s*s}-x^2)}{(x^2+${s*s})^2}\\), so the positive critical number is \\(x=${s}\\). There, \\(f(${s})=${qTex(y)}\\), and the line is \\(${line.answerTex}\\).`);
}
function horizontalCubicTwoCritical(){
  const a=ri(1,4),C=ri(-6,6),y=C-2*a**3,line=horizontalLine(Q(y));
  return lineProblem(`u3-hv-cubiccrit-${a}-${C}`,'horizontal_cubic_positive_critical',`Find the horizontal tangent line corresponding to the positive critical number.`,`f(x)=x^3-${3*a*a}x${sgn(C,'')}`,line,`The derivative is \\(3x^2-${3*a*a}=3(x-${a})(x+${a})\\), so the positive critical number is \\(x=${a}\\). The function value is \\(${y}\\), giving \\(${line.answerTex}\\).`);
}
function verticalFractionalPower(){
  const h=ri(-5,5),C=ri(-5,5),family=pick(['cube_root','two_thirds','four_fifths','cube_root_plus_linear']),u=shift('x',h),B=family==='cube_root_plus_linear'?ri(1,4):0,body=family==='cube_root'?`\\sqrt[3]{${u}}`:family==='two_thirds'?`\\sqrt[3]{${expandedSquare(h)}}`:family==='four_fifths'?`\\sqrt[5]{${poly(expandedShiftPower(1,h,4))}}`:`\\sqrt[3]{${u}}${sgn(B,'x')}${sgn(-B*h,'')}`,line=verticalLine(Q(h));
  return lineProblem(`u3-hv-${family}-${h}-${C}-${B}`,`vertical_${family}`,`Find the equation of the vertical tangent line.`,`f(x)=${body}${sgn(C,'')}`,line,`The function is defined at \\(x=${h}\\), but its derivative contains a negative fractional power of \\(${u}\\), so the derivative becomes unbounded there. The vertical tangent line is \\(${line.answerTex}\\).`);
}
function verticalSquareRoot(){
  const A=nz(-4,4),h=ri(-5,5),C=ri(-5,5),u=shift('x',h),line=verticalLine(Q(h));
  return lineProblem(`u3-hv-sqrt-${A}-${h}-${C}`,'vertical_square_root_endpoint',`Find the equation of the vertical tangent line.`,`f(x)=${sgn(A,`\\sqrt{${u}}`,true)}${sgn(C,'')}`,line,`The graph begins at \\(x=${h}\\). Its derivative is \\(\\frac{${A}}{2\\sqrt{${u}}}\\), whose magnitude grows without bound as \\(x\\) approaches ${h} from within the domain. Therefore the vertical tangent is \\(${line.answerTex}\\).`);
}
function verticalInverseTrig(){
  const A=nz(-4,4),h=ri(-4,4),r=ri(1,4),C=ri(-4,4),useSine=R()<.5,x=h+r,arg=`\\frac{${shift('x',h)}}{${r}}`,fn=useSine?'\\sin^{-1}':'\\cos^{-1}',line=verticalLine(Q(x));
  return lineProblem(`u3-hv-invtrig-${useSine}-${A}-${h}-${r}-${C}`,'vertical_inverse_trigonometric',`Find the vertical tangent line at the right endpoint of the domain.`,`f(x)=${sgn(A,`${fn}\\left(${arg}\\right)`,true)}${sgn(C,'')}`,line,`The derivative contains \\(\\sqrt{1-(${arg})^2}\\) in the denominator. At the right endpoint, \\(x=${x}\\), that denominator approaches zero while the graph has an endpoint. The vertical tangent line is \\(${line.answerTex}\\).`);
}
const explicitHVFamilies=[horizontalPolynomialQuadratic,horizontalPolynomialGrouping,horizontalPolynomialSubstitution,horizontalLog,horizontalExponentialProduct,horizontalSine,horizontalCosine,horizontalTangentCombination,horizontalRadical,horizontalRational,horizontalCubicTwoCritical,verticalFractionalPower,verticalSquareRoot,verticalInverseTrig];
U3['horizontal-and-vertical-tangent-lines']=(opts={})=>weighted('horizontal-and-vertical-tangent-lines','noncalculator',explicitHVFamilies,[horizontalExponentialProduct,horizontalRational,verticalInverseTrig,verticalFractionalPower]);

/* 3. Implicit horizontal/vertical tangents: separate exact and calculator pools. */
function implicitCircle(){
  const h=ri(-3,3),k=ri(-3,3),r=ri(2,6),horizontal=R()<.5,positive=R()<.5,line=horizontal?horizontalLine(Q(k+(positive?r:-r))):verticalLine(Q(h+(positive?r:-r))),u=shift('x',h),v=shift('y',k),side=positive?(horizontal?'upper':'rightmost'):(horizontal?'lower':'leftmost');
  return lineProblem(`u3-ihv-circle-${horizontal}-${positive}-${h}-${k}-${r}`,`implicit_circle_${horizontal?'horizontal':'vertical'}`,`Find the ${side} ${horizontal?'horizontal':'vertical'} tangent line.`,`${groupedPower(u,2)}+${groupedPower(v,2)}=${r*r}`,line,`Implicit differentiation gives \\(y'=-\\frac{${u}}{${v}}\\). A horizontal tangent occurs when \\(x=${h}\\); a vertical tangent occurs when \\(y=${k}\\). Using the stated side of the circle gives \\(${line.answerTex}\\).`);
}
function implicitEllipse(){
  const a=ri(2,6),b=ri(2,6),horizontal=R()<.5,positive=R()<.5,line=horizontal?horizontalLine(Q(positive?b:-b)):verticalLine(Q(positive?a:-a)),side=positive?(horizontal?'upper':'rightmost'):(horizontal?'lower':'leftmost');
  return lineProblem(`u3-ihv-ellipse-${horizontal}-${positive}-${a}-${b}`,`implicit_ellipse_${horizontal?'horizontal':'vertical'}`,`Find the ${side} ${horizontal?'horizontal':'vertical'} tangent line.`,`\\frac{x^2}{${a*a}}+\\frac{y^2}{${b*b}}=1`,line,`Differentiating gives \\(\\frac{2x}{${a*a}}+\\frac{2y}{${b*b}}y'=0\\). Horizontal tangents occur at \\(x=0\\), where \\(y=\\pm${b}\\); vertical tangents occur at \\(y=0\\), where \\(x=\\pm${a}\\). The requested side gives \\(${line.answerTex}\\).`);
}
function implicitCubicSum(){
  const c=ri(1,6),A=ri(1,4),B=ri(1,4),horizontal=R()<.5,line=horizontal?horizontalLine(Q(c)):verticalLine(Q(c)),constant=horizontal?B*c**3:A*c**3,reason=horizontal?`For a horizontal tangent, set the numerator equal to zero. Then \\(x=0\\), so the positive point has \\(y=${c}\\).`:`For a vertical tangent, set the denominator equal to zero. Then \\(y=0\\), so the positive point has \\(x=${c}\\).`;
  return lineProblem(`u3-ihv-cubicsum-${horizontal}-${A}-${B}-${c}`,`implicit_cubic_sum_${horizontal?'horizontal':'vertical'}`,`Find the ${horizontal?'horizontal tangent line with positive y':'vertical tangent line with positive x'}.`,`${sgn(A,'x^3',true)}${sgn(B,'y^3')}=${constant}`,line,`Implicit differentiation gives \\(y'=-\\frac{${A}x^2}{${B}y^2}\\). ${reason} Therefore the line is \\(${line.answerTex}\\).`);
}
function implicitMixedQuadratic(){
  const a=ri(1,5),horizontal=R()<.5,line=horizontal?horizontalLine(Q(2*a)):verticalLine(Q(2*a)),reason=horizontal?`A horizontal tangent requires \\(2x+y=0\\). Substitution into the curve and \\(y>0\\) give \\((x,y)=(-${a},${2*a})\\).`:`A vertical tangent requires \\(x+2y=0\\). Substitution and \\(x>0\\) give \\((x,y)=(${2*a},-${a})\\).`;
  return lineProblem(`u3-ihv-mixedquad-${horizontal}-${a}`,`implicit_mixed_quadratic_${horizontal?'horizontal':'vertical'}`,`Find the ${horizontal?'horizontal tangent line with positive y':'vertical tangent line with positive x'}.`,`x^2+xy+y^2=${3*a*a}`,line,`Differentiation gives \\(y'=-\\frac{2x+y}{x+2y}\\). ${reason} Thus the line is \\(${line.answerTex}\\).`);
}
function implicitCrossQuadratic(){
  const a=ri(1,5),horizontal=R()<.5,line=horizontal?horizontalLine(Q(a)):verticalLine(Q(a)),reason=horizontal?`For a horizontal tangent, \\(x=-2y\\). Substitution and \\(y>0\\) give \\(y=${a}\\).`:`For a vertical tangent, \\(y=-2x\\). Substitution and \\(x>0\\) give \\(x=${a}\\).`;
  return lineProblem(`u3-ihv-crossquad-${horizontal}-${a}`,`implicit_cross_quadratic_${horizontal?'horizontal':'vertical'}`,`Find the ${horizontal?'horizontal tangent line with positive y':'vertical tangent line with positive x'}.`,`x^2+4xy+y^2=-${3*a*a}`,line,`Differentiation gives \\(y'=-\\frac{2x+4y}{4x+2y}\\). ${reason} Therefore the line is \\(${line.answerTex}\\).`);
}
function implicitProductCubic(){
  const c=ri(1,5),line=horizontalLine(Q(c));
  return lineProblem(`u3-ihv-productcubic-${c}`,'implicit_product_cubic_horizontal',`Find the horizontal tangent line with positive y.`,`x^2y+y^3=${c**3}`,line,`Implicit differentiation gives \\(2xy+(x^2+3y^2)y'=0\\), so \\(y'=-\\frac{2xy}{x^2+3y^2}\\). With \\(y>0\\), the numerator is zero at \\(x=0\\). The curve then gives \\(y=${c}\\), so the line is \\(${line.answerTex}\\).`);
}
function implicitHigherPowers(){
  const c=ri(1,5),p=pick([3,4,5]),q=pick([3,4,5]),A=ri(1,4),B=ri(1,4),horizontal=R()<.5,line=horizontal?horizontalLine(Q(c)):verticalLine(Q(c)),constant=horizontal?B*c**q:A*c**p,reason=horizontal?`The numerator is zero at \\(x=0\\), and the positive point on the curve has \\(y=${c}\\).`:`The denominator is zero at \\(y=0\\), and the positive point on the curve has \\(x=${c}\\).`;
  return lineProblem(`u3-ihv-higher-${horizontal}-${A}-${B}-${p}-${q}-${c}`,`implicit_higher_powers_${horizontal?'horizontal':'vertical'}`,`Find the ${horizontal?'horizontal tangent line with positive y':'vertical tangent line with positive x'}.`,`${sgn(A,`x^${p}`,true)}${sgn(B,`y^${q}`)}=${constant}`,line,`Differentiation gives \\(y'=-\\frac{${A*p}x^{${p-1}}}{${B*q}y^{${q-1}}}\\). ${reason} The requested line is \\(${line.answerTex}\\).`);
}
function implicitExponentialHorizontal(){
  const line=horizontalLine(Q(0));
  return lineProblem('u3-ihv-exp-horizontal','implicit_exponential_horizontal',`Find the horizontal tangent line through the point \\((0,0)\\).`,`x^2+e^y=1`,line,`Differentiate: \\(2x+e^y y'=0\\), so \\(y'=-2xe^{-y}\\). At \\((0,0)\\), the slope is zero. The horizontal line through the point is \\(${line.answerTex}\\).`);
}
function implicitExponentialVertical(){
  const line=verticalLine(Q(0));
  return lineProblem('u3-ihv-exp-vertical','implicit_exponential_vertical',`Find the vertical tangent line through the point \\((0,0)\\).`,`e^x+y^2=1`,line,`Differentiation gives \\(e^x+2yy'=0\\), so \\(y'=-\\frac{e^x}{2y}\\). At \\((0,0)\\), the denominator is zero while the numerator is not, so the tangent is vertical. Its equation is \\(${line.answerTex}\\).`);
}
function implicitTrigHorizontal(){
  const line=symbolicLine('y=pi/2','y=\\frac{\\pi}{2}','y');
  return lineProblem('u3-ihv-trig-horizontal','implicit_trigonometric_horizontal',`Find the horizontal tangent line through \\(\\left(\\frac{\\pi}{2},\\frac{\\pi}{2}\\right)\\).`,`\\sin x+\\cos y=1`,line,`Differentiation gives \\(y'=\\frac{\\cos x}{\\sin y}\\). At the stated point, the numerator is zero and the denominator is nonzero, so the tangent is horizontal. The line is \\(${line.answerTex}\\).`);
}
function implicitTrigVertical(){
  const line=verticalLine(Q(0));
  return lineProblem('u3-ihv-trig-vertical','implicit_trigonometric_vertical',`Find the vertical tangent line through \\((0,0)\\).`,`\\sin x+\\cos y=1`,line,`Differentiation gives \\(y'=\\frac{\\cos x}{\\sin y}\\). At \\((0,0)\\), the denominator is zero and the numerator is nonzero, so the tangent is vertical. Its equation is \\(${line.answerTex}\\).`);
}
function implicitCoordinateQuadratic(horizontal=R()<.5){
  const a=ri(1,5),C=ri(-9,9),variable=horizontal?'x':'y',math=horizontal?`x^3-${3*a*a}x+y^3+y=${C}`:`x^3+x+y^3-${3*a*a}y=${C}`,values=[-a,a],kind=horizontal?'horizontal':'vertical';
  const derivative=horizontal?`y'=-\\frac{3x^2-${3*a*a}}{3y^2+1}`:`y'=-\\frac{3x^2+1}{3y^2-${3*a*a}}`;
  return valueListProblem(`u3-ihv-coordquad-${horizontal}-${a}-${C}`,`implicit_all_${kind}_coordinates_quadratic`,`Find all ${variable}-coordinates where the curve has a ${kind} tangent.`,math,variable,values,`Implicit differentiation gives \\(${derivative}\\). ${horizontal?'Horizontal tangents occur when the numerator is zero':'Vertical tangents occur when the denominator is zero'}, so \\(${variable}^2=${a*a}\\) and \\(${variable}=-${a},${a}\\).`);
}
function implicitCoordinateGrouping(horizontal=R()<.5){
  const a=nz(-4,4),b=ri(1,6),C=ri(-9,9),variable=horizontal?'x':'y',P=v=>`3${v}^4${sgn(4*a,`${v}^3`)}${sgn(6*b,`${v}^2`)}${sgn(12*a*b,v)}`,math=horizontal?`${P('x')}+y^3+y=${C}`:`x^3+x+${P('y')}=${C}`,root=-a,kind=horizontal?'horizontal':'vertical';
  return valueListProblem(`u3-ihv-coordgroup-${horizontal}-${a}-${b}-${C}`,`implicit_all_${kind}_coordinates_grouping`,`Find all ${variable}-coordinates where the curve has a ${kind} tangent.`,math,variable,[root],`The relevant derivative factor is \\(12(${variable}^3${sgn(a,`${variable}^2`)}${sgn(b,variable)}${sgn(a*b,'')})=12(${variable}${sgn(a,'')})(${variable}^2+${b})\\). Factoring by grouping gives the only real solution \\(${variable}=${root}\\).`);
}
function implicitCoordinateSubstitution(horizontal=R()<.5){
  const r=ri(1,3),t=ri(r+1,5),C=ri(-7,7),sum=r*r+t*t,product=r*r*t*t,variable=horizontal?'x':'y',P=v=>`3${v}^5-${5*sum}${v}^3+${15*product}${v}`,math=horizontal?`${P('x')}+y^3+y=${C}`:`x^3+x+${P('y')}=${C}`,values=[-t,-r,r,t],kind=horizontal?'horizontal':'vertical';
  return valueListProblem(`u3-ihv-coordsub-${horizontal}-${r}-${t}-${C}`,`implicit_all_${kind}_coordinates_substitution`,`Find all ${variable}-coordinates where the curve has a ${kind} tangent.`,math,variable,values,`The relevant derivative is \\(15(${variable}^4-${sum}${variable}^2+${product})\\). Let \\(u=${variable}^2\\); then \\((u-${r*r})(u-${t*t})=0\\). Therefore \\(${variable}=-${t},-${r},${r},${t}\\).`);
}
const implicitHVExactFamilies=[implicitCircle,implicitEllipse,implicitCubicSum,implicitMixedQuadratic,implicitCrossQuadratic,implicitProductCubic,implicitHigherPowers,()=>implicitCoordinateQuadratic(true),()=>implicitCoordinateQuadratic(false),()=>implicitCoordinateGrouping(true),()=>implicitCoordinateGrouping(false),()=>implicitCoordinateSubstitution(true),()=>implicitCoordinateSubstitution(false)];

function cubicLinearRoot(a,target){return solveIncreasing(x=>a*x*x*x+x-target,-30,30);}
function nonInteger(values){return values.every(v=>Number.isFinite(v)&&Math.abs(v-Math.round(v))>.002);}
function calculatorLogVerticalOne(){
  const k=ri(1,6),x=Math.cbrt(2*k)*Math.exp(1/3);
  return roundedLineProblem(`u3-ihv-calc-logxy-${k}`,'calculator_log_product_vertical',`Find the vertical tangent line. Round the final line value to three decimals.`,`x^2\\ln(xy)=${k}xy^2,\\qquad x>0,\\ y>0`,'x',[x],`Implicit differentiation gives \\(y'=\\frac{${k}y^2-2x\\ln(xy)-x}{x^2/y-${2*k}xy}\\). For a vertical tangent, set the denominator equal to zero and keep the numerator nonzero. Combining \\(x=${2*k}y^2\\) with the original equation gives \\(x=\\sqrt[3]{${2*k}e}\\approx${x.toFixed(3)}\\), so the line is \\(x=${x.toFixed(3)}\\).`);
}
function calculatorLogVerticalTwo(){
  const k=ri(1,7),x=1/(k*Math.E);
  return roundedLineProblem(`u3-ihv-calc-logy-${k}`,'calculator_log_square_vertical',`Find the vertical tangent line. Round the final line value to three decimals.`,`x\\ln(y^2)=${k}x^2y^2,\\qquad x>0,\\ y>0`,'x',[x],`After implicit differentiation, the coefficient of \\(y'\\) is \\(\\frac{2x}{y}-${2*k}x^2y\\). Setting it equal to zero and using the original equation gives \\(x=\\frac1{${k}e}\\approx${x.toFixed(3)}\\). Therefore the vertical tangent line is \\(x=${x.toFixed(3)}\\).`);
}
function calculatorPolynomialProductHorizontal(){
  const k=pick([1,3,4,5,6,7]),y=-Math.cbrt(4/(k*k));
  return roundedLineProblem(`u3-ihv-calc-product-${k}`,'calculator_polynomial_product_horizontal',`Find the nonzero horizontal tangent line. Round the final line value to three decimals.`,`x^2y-y^2=${sgn(k,'xy^3',true)}`,'y',[y],`Implicit differentiation gives \\(y'=\\frac{${sgn(k,'y^3',true)}-2xy}{x^2-2y-${sgn(3*k,'xy^2',true)}}\\). On the nonzero branch, a horizontal tangent requires \\(x=\\frac{${k===1?'':k}y^2}{2}\\). Substitution into the curve gives \\(y^3=${qTex(Q(-4,k*k))}\\), so \\(y\\approx${y.toFixed(3)}\\). The line is \\(y=${y.toFixed(3)}\\).`);
}
function calculatorWeightedLogHorizontal(){
  let A,B,C,y;do{A=ri(1,5);B=ri(1,4);C=nz(-6,6);y=cubicLinearRoot(B,C+A/Math.E);}while(!nonInteger([y]));
  return roundedLineProblem(`u3-ihv-calc-wlogh-${A}-${B}-${C}`,'calculator_weighted_log_horizontal',`Find the horizontal tangent line. Round the final line value to three decimals.`,`${sgn(A,'x\\ln x',true)}${sgn(B,'y^3')}${sgn(1,'y')}=${C},\\qquad x>0`,'y',[y],`Differentiation gives \\(${A}(\\ln x+1)+( ${3*B}y^2+1)y'=0\\). A horizontal tangent occurs at \\(x=e^{-1}\\). Substitute that value into the original curve, then solve \\(${B}y^3+y=${fmt(C+A/Math.E,6)}\\) numerically. This gives \\(y\\approx${y.toFixed(3)}\\), so the line is \\(y=${y.toFixed(3)}\\).`);
}
function calculatorWeightedLogVertical(){
  let A,B,C,x;do{A=ri(1,4);B=ri(1,5);C=nz(-6,6);x=cubicLinearRoot(A,C+B/Math.E);}while(!nonInteger([x]));
  return roundedLineProblem(`u3-ihv-calc-wlogv-${A}-${B}-${C}`,'calculator_weighted_log_vertical',`Find the vertical tangent line. Round the final line value to three decimals.`,`${sgn(A,'x^3',true)}${sgn(1,'x')}${sgn(B,'y\\ln y')}=${C},\\qquad y>0`,'x',[x],`Differentiation gives \\(( ${3*A}x^2+1)+${B}(\\ln y+1)y'=0\\). A vertical tangent occurs at \\(y=e^{-1}\\). Substitute that value and solve \\(${A}x^3+x=${fmt(C+B/Math.E,6)}\\) numerically. Thus \\(x\\approx${x.toFixed(3)}\\), and the line is \\(x=${x.toFixed(3)}\\).`);
}
function calculatorTrigHorizontal(){
  const C=nz(-5,7),x=solveIncreasing(v=>v+Math.cos(v),-1,0),target=C-x*x-2*Math.sin(x),y=cubicLinearRoot(1,target);
  return roundedLineProblem(`u3-ihv-calc-trigh-${C}`,'calculator_trigonometric_horizontal',`Find the horizontal tangent line. Round the final line value to three decimals.`,`x^2+2\\sin x+y^3+y=${C}`,'y',[y],`Implicit differentiation gives \\(y'=-\\frac{2x+2\\cos x}{3y^2+1}\\). Solve \\(x+\\cos x=0\\) numerically, substitute that \\(x\\)-value into the curve, and solve for \\(y\\). The result is \\(y\\approx${y.toFixed(3)}\\), so the line is \\(y=${y.toFixed(3)}\\).`);
}
function calculatorTrigVertical(){
  const C=nz(-5,7),y=solveIncreasing(v=>v+Math.cos(v),-1,0),target=C-y*y-2*Math.sin(y),x=cubicLinearRoot(1,target);
  return roundedLineProblem(`u3-ihv-calc-trigv-${C}`,'calculator_trigonometric_vertical',`Find the vertical tangent line. Round the final line value to three decimals.`,`x^3+x+y^2+2\\sin y=${C}`,'x',[x],`Implicit differentiation gives \\(y'=-\\frac{3x^2+1}{2y+2\\cos y}\\). Solve \\(y+\\cos y=0\\) numerically, substitute that value into the curve, and solve for \\(x\\). This gives \\(x\\approx${x.toFixed(3)}\\), so the line is \\(x=${x.toFixed(3)}\\).`);
}
function calculatorExponentialHorizontal(){
  const C=nz(-6,7),x=Math.log(2),target=C-Math.exp(x)+2*x,y=cubicLinearRoot(1,target);
  return roundedLineProblem(`u3-ihv-calc-exph-${C}`,'calculator_exponential_horizontal',`Find the horizontal tangent line. Round the final line value to three decimals.`,`e^x-2x+y^3+y=${C}`,'y',[y],`Differentiation gives \\(y'=-\\frac{e^x-2}{3y^2+1}\\). The numerator is zero at \\(x=\\ln2\\). Substitute \\(x=\\ln2\\) into the curve and solve for \\(y\\), obtaining \\(y\\approx${y.toFixed(3)}\\). Therefore the line is \\(y=${y.toFixed(3)}\\).`);
}
function calculatorExponentialVertical(){
  const C=nz(-6,7),y=Math.log(2),target=C-Math.exp(y)+2*y,x=cubicLinearRoot(1,target);
  return roundedLineProblem(`u3-ihv-calc-expv-${C}`,'calculator_exponential_vertical',`Find the vertical tangent line. Round the final line value to three decimals.`,`x^3+x+e^y-2y=${C}`,'x',[x],`Implicit differentiation gives \\(y'=-\\frac{3x^2+1}{e^y-2}\\). The denominator is zero at \\(y=\\ln2\\). Substitute that value and solve for \\(x\\), giving \\(x\\approx${x.toFixed(3)}\\). The vertical tangent line is \\(x=${x.toFixed(3)}\\).`);
}
function calculatorPolynomialHorizontalLines(){
  let a,C,values;do{a=ri(1,3);C=nz(-7,7);values=[cubicLinearRoot(1,C+2*a**3),cubicLinearRoot(1,C-2*a**3)];}while(!nonInteger(values)||Math.abs(values[0]-values[1])<.01);
  return roundedLineProblem(`u3-ihv-calc-polyh-${a}-${C}`,'calculator_polynomial_multiple_horizontal',`Find all horizontal tangent lines. Round each final line value to three decimals.`,`x^3-${3*a*a}x+y^3+y=${C}`,'y',values,`Differentiation gives \\(y'=-\\frac{3x^2-${3*a*a}}{3y^2+1}\\), so horizontal tangents occur at \\(x=\\pm${a}\\). Substitute both \\(x\\)-values into the original curve and solve for \\(y\\). The line values are \\(y=${values.map(v=>v.toFixed(3)).join('\\text{ and }y=')}\\).`);
}
function calculatorPolynomialVerticalLines(){
  let a,C,values;do{a=ri(1,3);C=nz(-7,7);values=[cubicLinearRoot(1,C+2*a**3),cubicLinearRoot(1,C-2*a**3)];}while(!nonInteger(values)||Math.abs(values[0]-values[1])<.01);
  return roundedLineProblem(`u3-ihv-calc-polyv-${a}-${C}`,'calculator_polynomial_multiple_vertical',`Find all vertical tangent lines. Round each final line value to three decimals.`,`x^3+x+y^3-${3*a*a}y=${C}`,'x',values,`Differentiation gives \\(y'=-\\frac{3x^2+1}{3y^2-${3*a*a}}\\), so vertical tangents occur at \\(y=\\pm${a}\\). Substitute both \\(y\\)-values into the curve and solve for \\(x\\). The line values are \\(x=${values.map(v=>v.toFixed(3)).join('\\text{ and }x=')}\\).`);
}
const implicitHVCalculatorFamilies=[calculatorLogVerticalOne,calculatorLogVerticalTwo,calculatorPolynomialProductHorizontal,calculatorWeightedLogHorizontal,calculatorWeightedLogVertical,calculatorTrigHorizontal,calculatorTrigVertical,calculatorExponentialHorizontal,calculatorExponentialVertical,calculatorPolynomialHorizontalLines,calculatorPolynomialVerticalLines];
U3['horizontal-and-vertical-tangent-lines-implicitly']=(opts={})=>{const m=modeOf(opts);return m==='calculator'?weighted('horizontal-and-vertical-tangent-lines-implicitly',m,implicitHVCalculatorFamilies,[calculatorPolynomialHorizontalLines,calculatorPolynomialVerticalLines,calculatorLogVerticalOne,calculatorPolynomialProductHorizontal]):weighted('horizontal-and-vertical-tangent-lines-implicitly',m,implicitHVExactFamilies,[implicitMixedQuadratic,implicitCrossQuadratic,implicitCircle,()=>implicitCoordinateSubstitution(R()<.5)]);};

/* 4. Calculator skills: zeros, derivative values, tangent slopes, and extrema. */
function calculatorInterceptTrig(){
  const k=ri(2,7),root=bisect(x=>Math.cos(x)-x/k,0,Math.PI/2);
  return numeric(`u3-calc-xint-trig-${k}`,'calculator_x_intercept_trigonometric',`Calculator Active: Find the positive x-intercept of the function.`,`f(x)=\\cos x-\\frac{x}{${k}}`,root,root.toFixed(3),`Solve \\(\\cos x-\\frac{x}{${k}}=0\\) numerically. The positive x-intercept is \\(x=${root.toFixed(3)}\\).`);
}
function calculatorInterceptPolynomial(){
  const c=pick([3,4,5,6,7,8,9,10]),root=bisect(x=>x**5+x-c,0,2);
  return numeric(`u3-calc-xint-poly-${c}`,'calculator_x_intercept_polynomial',`Calculator Active: Find the x-intercept in \\((0,2)\\).`,`f(x)=x^5+x-${c}`,root,root.toFixed(3),`Graph the function or solve \\(x^5+x-${c}=0\\) on \\((0,2)\\). The intercept is \\(x=${root.toFixed(3)}\\).`);
}
function calculatorInterceptLogarithmic(){
  const c=ri(2,8),root=bisect(x=>Math.log(x)+x-c,.001,c);
  return numeric(`u3-calc-xint-log-${c}`,'calculator_x_intercept_logarithmic',`Calculator Active: Find the positive x-intercept of the function.`,`f(x)=\\ln x+x-${c}`,root,root.toFixed(3),`Solve \\(\\ln x+x-${c}=0\\) with a numerical zero finder. This gives \\(x=${root.toFixed(3)}\\).`);
}
function calculatorSlopeAtIntercept(){
  const k=ri(2,8),root=bisect(x=>Math.exp(-x)-x/k,0,2),slope=-Math.exp(-root)-1/k;
  return numeric(`u3-calc-slope-xint-${k}`,'calculator_slope_at_x_intercept',`Calculator Active: Find the slope of the graph at its positive x-intercept.`,`f(x)=e^{-x}-\\frac{x}{${k}}`,slope,slope.toFixed(3),`First solve \\(e^{-x}-\\frac{x}{${k}}=0\\), obtaining \\(x=${root.toFixed(3)}\\). Then evaluate \\(f'(x)=-e^{-x}-\\frac1{${k}}\\) there. The slope is \\(${slope.toFixed(3)}\\).`);
}
function calculatorDerivativeAtPoint(){
  const t=ri(1,3),value=2*t*Math.cos(t*t)-Math.exp(-t);
  return numeric(`u3-calc-derivative-point-${t}`,'calculator_derivative_at_point',`Calculator Active: Find \\(f'(${t})\\).`,`f(x)=\\sin(x^2)+e^{-x}`,value,value.toFixed(3),`Differentiate: \\(f'(x)=2x\\cos(x^2)-e^{-x}\\). Substituting \\(x=${t}\\) gives \\(f'(${t})=${value.toFixed(3)}\\).`);
}
function calculatorTangentSlope(){
  const c=ri(2,7),k=ri(2,4),t=ri(1,3),value=2*t/(t*t+c)+k*Math.cos(k*t);
  return numeric(`u3-calc-tangent-slope-${c}-${k}-${t}`,'calculator_tangent_slope',`Calculator Active: Find the slope of the tangent line at \\(x=${t}\\).`,`f(x)=\\ln(x^2+${c})+\\sin(${k}x)`,value,value.toFixed(3),`The derivative is \\(f'(x)=\\frac{2x}{x^2+${c}}+${k}\\cos(${k}x)\\). Evaluate it at \\(x=${t}\\) to get \\(${value.toFixed(3)}\\).`);
}
function calculatorNormalSlope(){
  let k,t,tangent;do{k=ri(2,6);t=ri(1,3);tangent=Math.exp(t/k)/k-Math.sin(t);}while(Math.abs(tangent)<.12);const normal=-1/tangent;
  return numeric(`u3-calc-normal-slope-${k}-${t}`,'calculator_normal_slope',`Calculator Active: Find the slope of the normal line at \\(x=${t}\\).`,`f(x)=e^{\\frac{x}{${k}}}+\\cos x`,normal,normal.toFixed(3),`The tangent slope is \\(f'(${t})=\\frac1{${k}}e^{\\frac{${t}}{${k}}}-\\sin(${t})\\). The normal slope is its negative reciprocal, \\(${normal.toFixed(3)}\\).`);
}
function calculatorMaximum(){
  const root=bisect(x=>Math.sin(x)+x*Math.cos(x),Math.PI/2,Math.PI);
  return numeric('u3-calc-maximum-xsinx','calculator_maximum_location',`Calculator Active: Find the x-coordinate of the absolute maximum on \\([0,\\pi]\\).`,`f(x)=x\\sin x`,root,root.toFixed(3),`Solve \\(f'(x)=\\sin x+x\\cos x=0\\) in the interval and compare with the endpoints. The maximum occurs at \\(x=${root.toFixed(3)}\\).`);
}
function calculatorMinimum(){
  const k=ri(3,9),root=bisect(x=>-Math.exp(-x)+2*x/k,0,2);
  return numeric(`u3-calc-minimum-${k}`,'calculator_minimum_location',`Calculator Active: Find the x-coordinate of the absolute minimum on \\([0,3]\\).`,`f(x)=e^{-x}+\\frac{x^2}{${k}}`,root,root.toFixed(3),`Solve \\(f'(x)=-e^{-x}+\\frac{2x}{${k}}=0\\), then compare the function value there with both endpoint values. The minimum occurs at \\(x=${root.toFixed(3)}\\).`);
}
function calculatorTestSlopeAtIntercept(){
  const c=ri(2,7),root=bisect(x=>x+Math.sin(x)-c,c-1,c+1),slope=1+Math.cos(root);
  return numeric(`u3-calc-test-slope-xint-${c}`,'test_slope_at_x_intercept',`Calculator Active: Find the slope of the tangent line where the graph crosses the x-axis.`,`f(x)=x+\\sin x-${c}`,slope,slope.toFixed(3),`First solve \\(x+\\sin x-${c}=0\\), giving \\(x=${root.toFixed(3)}\\). Then evaluate \\(f'(x)=1+\\cos x\\) there. The tangent slope is \\(${slope.toFixed(3)}\\).`);
}
const calculatorSkillFamilies=[calculatorInterceptTrig,calculatorInterceptPolynomial,calculatorInterceptLogarithmic,calculatorSlopeAtIntercept,calculatorDerivativeAtPoint,calculatorTangentSlope,calculatorNormalSlope,calculatorMaximum,calculatorMinimum];
U3['using-your-graphing-calculator']=(opts={})=>weighted('using-your-graphing-calculator','calculator',calculatorSkillFamilies,[calculatorTestSlopeAtIntercept,calculatorMaximum,calculatorNormalSlope]);

/* 5. Motion: typed exact answers or calculator answers rounded to three decimals. */
const unitCircleValues=[
  {n:1,d:6,sin:{n:1,d:2,rad:1},cos:{n:1,d:2,rad:3}},
  {n:1,d:4,sin:{n:1,d:2,rad:2},cos:{n:1,d:2,rad:2}},
  {n:1,d:3,sin:{n:1,d:2,rad:3},cos:{n:1,d:2,rad:1}},
  {n:1,d:2,sin:{n:1,d:1,rad:1},cos:{n:0,d:1,rad:1}},
  {n:2,d:3,sin:{n:1,d:2,rad:3},cos:{n:-1,d:2,rad:1}},
  {n:3,d:4,sin:{n:1,d:2,rad:2},cos:{n:-1,d:2,rad:2}},
  {n:5,d:6,sin:{n:1,d:2,rad:1},cos:{n:-1,d:2,rad:3}},
  {n:7,d:6,sin:{n:-1,d:2,rad:1},cos:{n:-1,d:2,rad:3}},
  {n:5,d:4,sin:{n:-1,d:2,rad:2},cos:{n:-1,d:2,rad:2}},
  {n:5,d:3,sin:{n:-1,d:2,rad:3},cos:{n:1,d:2,rad:1}}
];
function motionPositionPolynomial(){
  const A=nz(-3,3),B=nz(-5,5),C=nz(-6,6),D=ri(-5,5),t=ri(1,4),v=3*A*t*t+2*B*t+C,acc=6*A*t+2*B,ask=pick(['velocity','speed','acceleration']),ans=ask==='velocity'?v:ask==='speed'?Math.abs(v):acc;
  return exactExpression(`u3-motion-pospoly-${A}-${B}-${C}-${D}-${t}-${ask}`,`motion_position_${ask}_polynomial`,`The position is given. Find the particle's ${ask} at \\(t=${t}\\).`,`s(t)=${cubic(A,B,C,D,'t')}`,String(ans),String(ans),`${ask==='acceleration'?`Differentiate position once to get \\(v(t)=${quad(3*A,2*B,C,'t')}\\). Differentiate that velocity function to get \\(a(t)=${lin(6*A,2*B,'t')}\\).`:`Differentiate position once to get \\(v(t)=${quad(3*A,2*B,C,'t')}\\).`} ${ask==='speed'?`Evaluate \\(v(${t})=${v}\\), then take the absolute value: \\(|${v}|=${ans}\\).`:`Substitute \\(t=${t}\\) into the ${ask} function to get \\(${ans}\\).`}`);
}
function motionPositionExponential(){
  const A=nz(-6,6),B=nz(-5,5),C=ri(-5,5),ask=R()<.5?'velocity':'acceleration',ans=ask==='velocity'?2*A+B:2*A;
  return exactExpression(`u3-motion-posexp-${A}-${B}-${C}-${ask}`,`motion_position_${ask}_exponential`,`The position is given. Find the particle's ${ask} at \\(t=\\ln2\\).`,`s(t)=${sgn(A,'e^t',true)}${sgn(B,'t')}${sgn(C,'')}`,String(ans),String(ans),`${ask==='velocity'?`Differentiate position once: \\(v(t)=${sgn(A,'e^t',true)}${sgn(B,'')}\\).`:`Differentiate position once: \\(v(t)=${sgn(A,'e^t',true)}${sgn(B,'')}\\). Differentiate velocity: \\(a(t)=${sgn(A,'e^t',true)}\\).`} Since \\(e^{\\ln2}=2\\), evaluating at \\(t=\\ln2\\) gives \\(${ans}\\).`);
}
function motionPositionLogarithmic(){
  const c=ri(2,7),A=nz(-6,6),B=nz(-5,5),D=ri(-5,5),t=ri(1,4),ask=R()<.5?'velocity':'acceleration',ans=ask==='velocity'?Q(A+B*(t+c),t+c):Q(-A,(t+c)**2),correct=qTex(ans);
  return exactExpression(`u3-motion-poslog-${A}-${B}-${c}-${D}-${t}-${ask}`,`motion_position_${ask}_logarithmic`,`The position is given. Find the particle's ${ask} at \\(t=${t}\\).`,`s(t)=${sgn(A,`\\ln(t+${c})`,true)}${sgn(B,'t')}${sgn(D,'')}`,qPlain(ans),correct,`${ask==='velocity'?`Differentiate position once: \\(v(t)=\\frac{${A}}{t+${c}}${sgn(B,'')}\\).`:`Differentiate position once: \\(v(t)=\\frac{${A}}{t+${c}}${sgn(B,'')}\\). Differentiate velocity: \\(a(t)=-\\frac{${A}}{(t+${c})^2}\\).`} Substitute \\(t=${t}\\) to obtain \\(${correct}\\).`);
}
function motionPositionRadical(){
  const t=ri(1,4),r=ri(2,5),c=r*r-t,A=nz(-6,6),B=nz(-5,5),D=ri(-5,5),ask=R()<.5?'velocity':'acceleration',ans=ask==='velocity'?Q(A+2*B*r,2*r):Q(-A,4*r**3),correct=qTex(ans);
  return exactExpression(`u3-motion-posroot-${A}-${B}-${c}-${D}-${t}-${ask}`,`motion_position_${ask}_radical`,`The position is given. Find the particle's ${ask} at \\(t=${t}\\).`,`s(t)=${sgn(A,`\\sqrt{t+${c}}`,true)}${sgn(B,'t')}${sgn(D,'')}`,qPlain(ans),correct,`${ask==='velocity'?`Differentiate position once: \\(v(t)=\\frac{${A}}{2\\sqrt{t+${c}}}${sgn(B,'')}\\).`:`Differentiate position once: \\(v(t)=\\frac{${A}}{2\\sqrt{t+${c}}}${sgn(B,'')}\\). Differentiate velocity: \\(a(t)=-\\frac{${A}}{4(t+${c})^{\\frac{3}{2}}}\\).`} Substitute \\(t=${t}\\) to obtain \\(${correct}\\).`);
}
function motionPositionTrig(){
  const A=nz(-5,5),B=nz(-4,4),C=ri(-5,5),k=ri(1,3),angle=pick(unitCircleValues),time=piValue(angle.n,angle.d*k),useSine=R()<.5,ask=R()<.5?'velocity':'acceleration';
  const trigValue=ask==='velocity'?(useSine?angle.cos:angle.sin):(useSine?angle.sin:angle.cos),coefficient=ask==='velocity'?(useSine?A*k:-A*k):(useSine?-A*k*k:-A*k*k),constant=ask==='velocity'?B:0,answer=exactScaledRadical(coefficient,trigValue,constant),fn=useSine?'sin':'cos';
  const velocity=useSine?`${sgn(A*k,`\\cos(${k===1?'':k}t)`,true)}${sgn(B,'')}`:`${sgn(-A*k,`\\sin(${k===1?'':k}t)`,true)}${sgn(B,'')}`;
  const acceleration=useSine?sgn(-A*k*k,`\\sin(${k===1?'':k}t)`,true):sgn(-A*k*k,`\\cos(${k===1?'':k}t)`,true);
  return exactExpression(`u3-motion-postrig-${fn}-${A}-${B}-${C}-${k}-${angle.n}-${angle.d}-${ask}`,`motion_position_${ask}_trigonometric`,`The position is given. Find the particle's ${ask} at \\(t=${time.tex}\\).`,`s(t)=${sgn(A,`\\${fn}(${k===1?'':k}t)`,true)}${sgn(B,'t')}${sgn(C,'')}`,answer.raw,answer.tex,`${ask==='velocity'?`Differentiate position once: \\(v(t)=${velocity}\\).`:`Differentiate position once: \\(v(t)=${velocity}\\). Differentiate velocity: \\(a(t)=${acceleration}\\).`} At \\(t=${time.tex}\\), the angle is \\(${piValue(angle.n,angle.d).tex}\\). Use the unit-circle value to obtain \\(${answer.tex}\\).`);
}
function motionVelocityTrig(){
  const A=nz(-6,6),k=ri(1,4),angle=pick(unitCircleValues),time=piValue(angle.n,angle.d*k),useSine=R()<.5,ask=R()<.5?'speed':'acceleration',base=useSine?angle.sin:angle.cos;
  let answer;if(ask==='speed'){answer=exactScaledRadical(Math.abs(A),{...base,n:Math.abs(base.n)});}else answer=exactScaledRadical(useSine?A*k:-A*k,useSine?angle.cos:angle.sin);
  const fn=useSine?'sin':'cos';
  return exactExpression(`u3-motion-veltrig-${fn}-${A}-${k}-${angle.n}-${angle.d}-${ask}`,`motion_velocity_${ask}_trigonometric`,`The velocity is given. Find the particle's ${ask} at \\(t=${time.tex}\\).`,`v(t)=${sgn(A,`\\${fn}(${k===1?'':k}t)`,true)}`,answer.raw,answer.tex,`${ask==='speed'?'Evaluate velocity and take its absolute value.':`Differentiate velocity to find acceleration.`} The unit-circle value at \\(${k===1?'':k}t=${piValue(angle.n,angle.d).tex}\\) gives \\(${answer.tex}\\).`);
}
function motionVelocityExponential(){
  const A=nz(-6,6),B=nz(-6,6),ask=R()<.5?'speed':'acceleration',ans=ask==='speed'?Math.abs(2*A+B):2*A;
  return exactExpression(`u3-motion-velexp-${A}-${B}-${ask}`,`motion_velocity_${ask}_exponential`,`The velocity is given. Find the particle's ${ask} at \\(t=\\ln2\\).`,`v(t)=${sgn(A,'e^t',true)}${sgn(B,'')}`,String(ans),String(ans),`${ask==='speed'?`Evaluate \\(v(\\ln2)\\) and take its absolute value.`:`Differentiate velocity and use \\(e^{\\ln2}=2\\).`} The result is \\(${ans}\\).`);
}
function motionDirectionPolynomial(){
  const r1=ri(1,3),r2=ri(r1+1,6),C=ri(-5,5),sum=r1+r2,product=r1*r2,coeff=[2,-3*sum,6*product,C];
  return valueListProblem(`u3-motion-dirpoly-${r1}-${r2}-${C}`,'motion_position_direction_change_polynomial',`The position is given for \\(t\\ge0\\). At what times does the particle change direction?`,`s(t)=${poly(coeff,'t')}`,'t',[r1,r2],`Velocity is \\(v(t)=6t^2-${6*sum}t+${6*product}=6(t-${r1})(t-${r2})\\). Its sign changes at both zeros, so direction changes at \\(t=${r1}\\) and \\(t=${r2}\\).`);
}
function motionDirectionTrig(){
  const A=ri(1,5),C=ri(-5,5),time=piValue(1,6);
  return exactExpression(`u3-motion-dirtrig-${A}-${C}`,'motion_position_direction_change_trigonometric',`The position is given for \\(0\\lt t\\lt\\pi\\). When does the particle first change direction?`,`s(t)=${2*A}\\cos t${sgn(A,'t')}${sgn(C,'')}`,time.raw,time.tex,`Velocity is \\(v(t)=-${2*A}\\sin t${sgn(A,'')}\\). Its first zero occurs when \\(\\sin t=\\frac12\\), so \\(t=${time.tex}\\). The sign of velocity changes there.`,{expressionPlaceholder:'Enter the time'});
}
function motionDirectionExponential(){
  const B=ri(1,5),C=ri(-5,5);
  return exactExpression(`u3-motion-direxp-${B}-${C}`,'motion_position_direction_change_exponential',`The position is given for \\(t>0\\). When does the particle change direction?`,`s(t)=${2*B}e^{-t}${sgn(B,'t')}${sgn(C,'')}`,'ln(2)','\\ln2',`Velocity is \\(v(t)=-${2*B}e^{-t}${sgn(B,'')}\\). Setting it equal to zero gives \\(e^{-t}=\\frac12\\), so \\(t=\\ln2\\). The sign of velocity changes there.`,{expressionPlaceholder:'Enter the time'});
}
function motionAccelerationAtDirectionChange(){
  const A=ri(1,5),C=ri(-5,5),time=piValue(1,6),answer=exactScaledRadical(-A,{n:1,d:1,rad:3});
  return exactExpression(`u3-motion-accel-direction-${A}-${C}`,'motion_acceleration_first_direction_change',`The position is given for \\(0\\lt t\\lt\\pi\\). What is the acceleration the first time the particle changes direction?`,`s(t)=${2*A}\\cos t${sgn(A,'t')}${sgn(C,'')}`,answer.raw,answer.tex,`Velocity is \\(v(t)=-${2*A}\\sin t${sgn(A,'')}\\), so the first direction change occurs at \\(t=${time.tex}\\). Since \\(a(t)=-${2*A}\\cos t\\), the acceleration then is \\(${answer.tex}\\).`);
}
function motionVelocityWhenPosition(){
  const A=nz(-4,4),C=ri(-6,6),T=ri(1,5),position=A*T*T+C,answer=2*A*T;
  return exactExpression(`u3-motion-v-at-position-${A}-${C}-${T}`,'motion_velocity_when_position_known',`For \\(t\\ge0\\), what is the velocity when the position is \\(${position}\\)?`,`s(t)=${sgn(A,'t^2',true)}${sgn(C,'')}`,String(answer),String(answer),`Solve \\(${sgn(A,'t^2',true)}${sgn(C,'')}=${position}\\) with \\(t\\ge0\\), giving \\(t=${T}\\). Then \\(v(t)=${2*A}t\\), so the velocity is \\(${answer}\\).`);
}
function motionAccelerationWhenPosition(){
  const A=nz(-3,3),B=ri(-6,6),T=ri(1,4),position=A*T**3+B,answer=6*A*T;
  return exactExpression(`u3-motion-a-at-position-${A}-${B}-${T}`,'motion_acceleration_when_position_known',`For \\(t\\ge0\\), what is the acceleration when the position is \\(${position}\\)?`,`s(t)=${sgn(A,'t^3',true)}${sgn(B,'')}`,String(answer),String(answer),`Solve \\(${sgn(A,'t^3',true)}${sgn(B,'')}=${position}\\) on \\(t\\ge0\\), giving \\(t=${T}\\). Differentiate position once: \\(v(t)=${sgn(3*A,'t^2',true)}\\). Differentiate velocity: \\(a(t)=${6*A}t\\). Therefore \\(a(${T})=${answer}\\).`);
}
function motionAccelerationWhenVelocity(){
  const A=nz(-3,3),B=ri(-6,6),C=ri(-5,5),T=ri(1,4),velocity=3*A*T*T+B,answer=6*A*T;
  return exactExpression(`u3-motion-a-at-velocity-${A}-${B}-${C}-${T}`,'motion_acceleration_when_velocity_known',`For \\(t\\ge0\\), what is the acceleration when the velocity is \\(${velocity}\\)?`,`s(t)=${sgn(A,'t^3',true)}${sgn(B,'t')}${sgn(C,'')}`,String(answer),String(answer),`Velocity is \\(v(t)=${sgn(3*A,'t^2',true)}${sgn(B,'')}\\). On \\(t\\ge0\\), the stated velocity occurs at \\(t=${T}\\). Since \\(a(t)=${6*A}t\\), the answer is \\(${answer}\\).`);
}
function motionExponentialPositionRelation(){
  const A=nz(-5,5),C=ri(-6,6),position=2*A+C,answer=2*A;
  return exactExpression(`u3-motion-exp-a-at-position-${A}-${C}`,'motion_acceleration_when_position_exponential',`What is the acceleration when the position is \\(${position}\\)?`,`s(t)=${sgn(A,'e^t',true)}${sgn(C,'')}`,String(answer),String(answer),`The position equation gives \\(e^t=2\\), so \\(t=\\ln2\\). Differentiate position once: \\(v(t)=${sgn(A,'e^t',true)}\\). Differentiate velocity: \\(a(t)=${sgn(A,'e^t',true)}\\). Thus \\(a(\\ln2)=${answer}\\).`);
}
function motionLogVelocityRelation(){
  const A=nz(-6,6),B=ri(-5,5),velocityTex=`${sgn(A,'\\ln2',true)}${sgn(B,'')}`,answer=Q(A,2);
  return exactExpression(`u3-motion-log-a-at-velocity-${A}-${B}`,'motion_acceleration_when_velocity_logarithmic',`For \\(t\\ge0\\), what is the acceleration when the velocity is \\(${velocityTex}\\)?`,`v(t)=${sgn(A,'\\ln(t+1)',true)}${sgn(B,'')}`,qPlain(answer),qTex(answer),`The stated velocity occurs when \\(t+1=2\\), so \\(t=1\\). Differentiate: \\(a(t)=\\frac{${A}}{t+1}\\). Therefore \\(a(1)=${qTex(answer)}\\).`);
}
const motionExactFamilies=[motionPositionPolynomial,motionPositionExponential,motionPositionLogarithmic,motionPositionRadical,motionPositionTrig,motionVelocityTrig,motionVelocityExponential,motionDirectionPolynomial,motionDirectionTrig,motionDirectionExponential,motionAccelerationAtDirectionChange,motionVelocityWhenPosition,motionAccelerationWhenPosition,motionAccelerationWhenVelocity,motionExponentialPositionRelation,motionLogVelocityRelation];

function motionCalcCompositeSpeed(){
  const k=ri(2,5),T=ri(1,3),v=Math.cos(Math.exp(-T)+T/k)*(-Math.exp(-T)+1/k),speed=Math.abs(v);
  return numeric(`u3-motion-calc-composite-${k}-${T}`,'motion_calculator_speed_composite',`Calculator Active: The position is given. Find the speed at \\(t=${T}\\).`,`s(t)=\\sin\\left(e^{-t}+\\frac{t}{${k}}\\right)`,speed,speed.toFixed(3),`Differentiate position once: \\(v(t)=\\cos\\left(e^{-t}+\\frac{t}{${k}}\\right)\\left(-e^{-t}+\\frac1{${k}}\\right)\\). Evaluate \\(v(${T})\\approx${v.toFixed(6)}\\), then take its absolute value. The speed is \\(${speed.toFixed(3)}\\).`);
}
function motionCalcPositionExponential(){
  const k=ri(2,7),T=ri(1,3),ask=R()<.5?'velocity':'acceleration',v=-2*T*Math.exp(-T*T)+3*T*T/k,a=(4*T*T-2)*Math.exp(-T*T)+6*T/k,value=ask==='velocity'?v:a;
  return numeric(`u3-motion-calc-posexp-${k}-${T}-${ask}`,`motion_calculator_position_${ask}_exponential`, `Calculator Active: The position is given. Find the ${ask} at \\(t=${T}\\).`,`s(t)=e^{-t^2}+\\frac{t^3}{${k}}`,value,value.toFixed(3),`${ask==='velocity'?`Differentiate position once: \\(v(t)=-2te^{-t^2}+\\frac{3t^2}{${k}}\\).`:`Differentiate position once: \\(v(t)=-2te^{-t^2}+\\frac{3t^2}{${k}}\\). Differentiate velocity: \\(a(t)=(4t^2-2)e^{-t^2}+\\frac{6t}{${k}}\\).`} Substitute \\(t=${T}\\) to obtain \\(${value.toFixed(3)}\\).`);
}
function motionCalcVelocityLogTrig(){
  const c=ri(2,8),k=ri(2,5),T=ri(1,3),ask=R()<.5?'speed':'acceleration',v=Math.log(T*T+c)+Math.sin(k*T),a=2*T/(T*T+c)+k*Math.cos(k*T),value=ask==='speed'?Math.abs(v):a;
  return numeric(`u3-motion-calc-vellog-${c}-${k}-${T}-${ask}`,`motion_calculator_velocity_${ask}_log_trig`,`Calculator Active: The velocity is given. Find the particle's ${ask} at \\(t=${T}\\).`,`v(t)=\\ln(t^2+${c})+\\sin(${k}t)`,value,value.toFixed(3),`${ask==='speed'?`Evaluate the displayed velocity: \\(v(${T})=\\ln(${T*T+c})+\\sin(${k*T})\\approx${v.toFixed(6)}\\). Take the absolute value: \\(|v(${T})|=${value.toFixed(3)}\\).`:`Differentiate velocity: \\(a(t)=\\frac{2t}{t^2+${c}}+${k}\\cos(${k}t)\\). Substituting \\(t=${T}\\) gives \\(a(${T})=${value.toFixed(3)}\\).`}`);
}
function motionCalcPositionRadical(){
  const c=ri(2,8),k=ri(2,5),T=ri(1,3),inside=T**3+c,v=3*T*T/(2*Math.sqrt(inside))+k*Math.cos(k*T),speed=Math.abs(v);
  return numeric(`u3-motion-calc-posroot-${c}-${k}-${T}`,'motion_calculator_speed_radical_trig',`Calculator Active: The position is given. Find the speed at \\(t=${T}\\).`,`s(t)=\\sqrt{t^3+${c}}+\\sin(${k}t)`,speed,speed.toFixed(3),`Differentiate position: \\(v(t)=\\frac{3t^2}{2\\sqrt{t^3+${c}}}+${k}\\cos(${k}t)\\). Evaluate at \\(t=${T}\\): \\(v(${T})\\approx${v.toFixed(6)}\\). Take the absolute value, so the speed is \\(${speed.toFixed(3)}\\).`);
}
function motionCalcVelocityRational(){
  const A=nz(-6,6),c=ri(2,7),T=ri(1,3),ask=R()<.5?'speed':'acceleration',v=A/(T+c)+Math.cos(T),a=-A/(T+c)**2-Math.sin(T),value=ask==='speed'?Math.abs(v):a,rationalDerivative=A>0?`-\\frac{${A}}{(t+${c})^2}`:`\\frac{${-A}}{(t+${c})^2}`;
  return numeric(`u3-motion-calc-velrat-${A}-${c}-${T}-${ask}`,`motion_calculator_velocity_${ask}_rational`,`Calculator Active: The velocity is given. Find the particle's ${ask} at \\(t=${T}\\).`,`v(t)=\\frac{${A}}{t+${c}}+\\cos t`,value,value.toFixed(3),`${ask==='speed'?`Evaluate velocity: \\(v(${T})=\\frac{${A}}{${T+c}}+\\cos(${T})\\approx${v.toFixed(6)}\\). Take the absolute value, so the speed is \\(${value.toFixed(3)}\\).`:`Differentiate velocity: \\(a(t)=${rationalDerivative}-\\sin t\\). Substituting \\(t=${T}\\) gives \\(a(${T})=${value.toFixed(3)}\\).`}`);
}
function motionCalcDirectionExp(){
  const k=ri(3,9),root=bisect(t=>-Math.exp(-t)+2*t/k,0,2);
  return numeric(`u3-motion-calc-direxp-${k}`,'motion_calculator_direction_change_exponential',`Calculator Active: The position is given for \\(t>0\\). Find the first time the particle changes direction.`,`s(t)=e^{-t}+\\frac{t^2}{${k}}`,root,root.toFixed(3),`Velocity is \\(v(t)=-e^{-t}+\\frac{2t}{${k}}\\). Its first positive zero is \\(t=${root.toFixed(3)}\\), and the velocity changes sign there.`);
}
function motionCalcDirectionTrig(){
  const k=ri(2,7),root=Math.acos(-1/k);
  return numeric(`u3-motion-calc-dirtrig-${k}`,'motion_calculator_direction_change_trigonometric',`Calculator Active: The position is given for \\(0\\lt t\\lt2\\pi\\). Find the first time the particle changes direction.`,`s(t)=\\sin t+\\frac{t}{${k}}`,root,root.toFixed(3),`Velocity is \\(v(t)=\\cos t+\\frac1{${k}}\\). The first zero in the interval is \\(t=${root.toFixed(3)}\\), and the sign of velocity changes there.`);
}
function motionCalcPositionLogCos(){
  const c=ri(2,7),T=ri(1,3),a=-1/(T+c)**2-2*Math.sin(T*T)-4*T*T*Math.cos(T*T);
  return numeric(`u3-motion-calc-poslogcos-${c}-${T}`,'motion_calculator_acceleration_log_trig',`Calculator Active: The position is given. Find the acceleration at \\(t=${T}\\).`,`s(t)=\\ln(t+${c})+\\cos(t^2)`,a,a.toFixed(3),`Differentiate position once: \\(v(t)=\\frac1{t+${c}}-2t\\sin(t^2)\\). Differentiate velocity: \\(a(t)=-\\frac1{(t+${c})^2}-2\\sin(t^2)-4t^2\\cos(t^2)\\). Substitute \\(t=${T}\\) to obtain \\(${a.toFixed(3)}\\).`);
}
function motionCalcTest(){
  const c=ri(2,7),T=ri(1,3),v=(c-T*T)/(T*T+c)**2-Math.exp(-T),speed=Math.abs(v);
  return numeric(`u3-motion-calc-test-rational-${c}-${T}`,'test_motion_speed_rational_exponential',`Calculator Active: The position is given. Find the particle's speed at \\(t=${T}\\).`,`s(t)=\\frac{t}{t^2+${c}}+e^{-t}`,speed,speed.toFixed(3),`Differentiate position: \\(v(t)=\\frac{${c}-t^2}{(t^2+${c})^2}-e^{-t}\\). Evaluate at \\(t=${T}\\): \\(v(${T})\\approx${v.toFixed(6)}\\). Take the absolute value to obtain the speed \\(${speed.toFixed(3)}\\).`);
}
function motionCalcAccelerationAtDirectionChange(){
  const k=ri(2,7),root=Math.acos(-1/k),value=-Math.sin(root);
  return numeric(`u3-motion-calc-accel-direction-${k}`,'motion_calculator_acceleration_first_direction_change',`Calculator Active: The position is given for \\(0\\lt t\\lt2\\pi\\). Find the acceleration the first time the particle changes direction.`,`s(t)=\\sin t+\\frac{t}{${k}}`,value,value.toFixed(3),`Velocity is \\(v(t)=\\cos t+\\frac1{${k}}\\). Its first zero is \\(t=${root.toFixed(3)}\\). Evaluate \\(a(t)=-\\sin t\\) there to obtain \\(${value.toFixed(3)}\\).`);
}
function motionCalcVelocityAtPosition(){
  const k=ri(3,8),target=2,root=bisect(t=>Math.exp(-t)+t*t/k-target,1,4),value=-Math.exp(-root)+2*root/k;
  return numeric(`u3-motion-calc-v-position-${k}`,'motion_calculator_velocity_when_position_known',`Calculator Active: For \\(1\\lt t\\lt4\\), find the velocity when the position is \\(${target}\\).`,`s(t)=e^{-t}+\\frac{t^2}{${k}}`,value,value.toFixed(3),`Solve \\(e^{-t}+\\frac{t^2}{${k}}=${target}\\) on the stated interval, giving \\(t\\approx${root.toFixed(6)}\\). Differentiate position: \\(v(t)=-e^{-t}+\\frac{2t}{${k}}\\). Evaluate at the unrounded time to obtain \\(v(t)=${value.toFixed(3)}\\).`);
}
function motionCalcAccelerationAtPosition(){
  const target=2,root=bisect(t=>Math.log(t+2)+Math.sin(t)-target,0,2),value=-1/(root+2)**2-Math.sin(root);
  return numeric('u3-motion-calc-a-position','motion_calculator_acceleration_when_position_known',`Calculator Active: For \\(0\\lt t\\lt2\\), find the acceleration when the position is \\(${target}\\).`,`s(t)=\\ln(t+2)+\\sin t`,value,value.toFixed(3),`Solve \\(\\ln(t+2)+\\sin t=${target}\\), giving \\(t\\approx${root.toFixed(6)}\\). Differentiate position once: \\(v(t)=\\frac1{t+2}+\\cos t\\). Differentiate velocity: \\(a(t)=-\\frac1{(t+2)^2}-\\sin t\\). Evaluate at the unrounded time to obtain \\(${value.toFixed(3)}\\).`);
}
function motionCalcAccelerationAtVelocity(){
  const target=2,root=bisect(t=>Math.log(t+2)+Math.sin(t)-target,0,2),value=1/(root+2)+Math.cos(root);
  return numeric('u3-motion-calc-a-velocity','motion_calculator_acceleration_when_velocity_known',`Calculator Active: For \\(0\\lt t\\lt2\\), find the acceleration when the velocity is \\(${target}\\).`,`v(t)=\\ln(t+2)+\\sin t`,value,value.toFixed(3),`Solve \\(\\ln(t+2)+\\sin t=${target}\\), giving \\(t\\approx${root.toFixed(6)}\\). Differentiate velocity: \\(a(t)=\\frac1{t+2}+\\cos t\\). Evaluate at the unrounded time to obtain \\(${value.toFixed(3)}\\).`);
}
const motionCalculatorFamilies=[motionCalcCompositeSpeed,motionCalcPositionExponential,motionCalcVelocityLogTrig,motionCalcPositionRadical,motionCalcVelocityRational,motionCalcDirectionExp,motionCalcDirectionTrig,motionCalcPositionLogCos,motionCalcAccelerationAtDirectionChange,motionCalcVelocityAtPosition,motionCalcAccelerationAtPosition,motionCalcAccelerationAtVelocity];
U3.motion=(opts={})=>{const m=modeOf(opts);return m==='calculator'?weighted('motion',m,motionCalculatorFamilies,[motionCalcTest,motionCalcAccelerationAtDirectionChange,motionCalcVelocityAtPosition,motionCalcAccelerationAtVelocity]):weighted('motion',m,motionExactFamilies,[motionDirectionPolynomial,motionAccelerationAtDirectionChange,motionVelocityWhenPosition,motionAccelerationWhenVelocity]);};

/* 6. Reading/sketching a derivative from a graph or table. */
function derivativeTable(){
  const start=ri(-5,1),xs=[0,1,2,3,4].map(i=>start+i),slopes=shuffle([-4,-1,2,5]),ys=[ri(-5,5)];for(const m of slopes)ys.push(ys.at(-1)+m);
  const table=`<table><tr><th>x</th>${xs.map(x=>`<td>${x}</td>`).join('')}</tr><tr><th>f(x)</th>${ys.map(y=>`<td>${y}</td>`).join('')}</tr></table>`;
  const best=slopes.indexOf(5),intervals=slopes.map((_,i)=>`(${xs[i]},${xs[i+1]})`);
  return mc(`u3-gd-table-${start}-${slopes.join('-')}-${ys[0]}`,'assignment_derivative_from_table',`Using secant slopes on each listed interval, on which interval is the estimated derivative largest?`,table,intervals[best],intervals.filter((_,i)=>i!==best),`Compute each change in \\(f\\) divided by the corresponding change in \\(x\\). The slopes are \\(${slopes.join(', ')}\\), so the largest occurs on \\(${intervals[best]}\\).`);
}
function derivativePiecewise(){
  const patterns=[[1,-1,1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,-1],[-1,1,1]],pattern=pick(patterns),startY=pick([80,95,110]),ys=[startY];for(const s of pattern)ys.push(ys.at(-1)-30*s);const words=pattern.map(s=>s>0?'positive':'negative'),correct=words.join(', '),inverse=pattern.map(s=>s>0?'negative':'positive').join(', '),rotate=[words[1],words[2],words[0]].join(', '),third=[words[2],words[0],words[1]].join(', ');
  const svg=`<svg class="u3-mini-graph" viewBox="0 0 360 190" role="img" aria-label="Piecewise linear graph"><line x1="25" y1="100" x2="340" y2="100"/><line x1="180" y1="15" x2="180" y2="175"/><polyline points="40,${ys[0]} 125,${ys[1]} 220,${ys[2]} 325,${ys[3]}" fill="none" stroke="#f5c400" stroke-width="5" stroke-linejoin="round"/><text x="112" y="172">a</text><text x="212" y="172">b</text></svg>`;
  return mc(`u3-gd-piecewise-${pattern.join('')}-${startY}`,'assignment_sketch_derivative_piecewise',`Which sign pattern matches \\(f'\\) on the three linear pieces?`,svg,correct,[inverse,rotate,third],`Read each segment from left to right. The graph ${pattern.map(s=>s>0?'rises':'falls').join(', then ')}, so the derivative signs are ${correct}. At each corner, the derivative is undefined.`);
}
function derivativeGraphTest(){
  const a=ri(0,2),b=a+ri(1,3),c=b+ri(1,2),d=c+ri(1,3),correct=`(${a},${b})\\cup(${c},${d})`;
  return mc(`u3-gd-test-${a}-${b}-${c}-${d}`,'test_derivative_graph_motion',`The graph shown is \\(v(t)\\), the velocity of a particle. When is the speed increasing?`,`v(t)\\lt0\\text{ and }v'(t)\\lt0\\text{ on }(${a},${b});\\quad v(t)>0\\text{ and }v'(t)>0\\text{ on }(${c},${d})`,correct,[`(${b},${c})`,`(${a},${d})`,`(${b},${c})\\cup(${d},\\infty)`],`Speed increases when velocity and acceleration have the same sign. That happens on \\((${a},${b})\\), where both are negative, and on \\((${c},${d})\\), where both are positive.`);
}
U3['graphing-the-derivative']=(opts={})=>weighted('graphing-the-derivative','noncalculator',[derivativeTable,derivativePiecewise],[derivativeGraphTest,derivativePiecewise]);

/* 7. Absolute/local extrema and EVT. */
function extremaRadical(){
  const r=ri(2,10),r2=r*r,answer=frac(r2,2);
  return mc(`u3-ext-radical-${r}`,'assignment_absolute_extrema_radical',`Find the absolute maximum value on the closed interval.`,`f(x)=x\\sqrt{${r2}-x^2},\\qquad [-${r},${r}]`,answer,[String(r),String(r2),`-${answer}`],`The endpoints give \\(0\\). Differentiation gives \\(f'(x)=(${r2}-2x^2)/\\sqrt{${r2}-x^2}\\), so the positive critical point is \\(x=${r}/\\sqrt2\\). Evaluating there gives \\(${answer}\\), the absolute maximum.`);
}
function extremaTest(){
  const b=3*ri(1,6),critical=2*b/3;
  return mc(`u3-ext-test-${b}`,'test_absolute_extrema_rational_root',`Which \\(x\\)-values must be checked to find the absolute extrema?`,`f(x)=x\\sqrt{${b}-x},\\qquad [0,${b}]`,`x=0,\\ ${critical},\\ ${b}`,[`x=0,\\ ${b}`,`x=${critical}`,`x=0,\\ ${b/2},\\ ${b}`],`On a closed interval, check endpoints and critical numbers. Here \\(f'(x)=(${2*b}-3x)/(2\\sqrt{${b}-x})\\), so the interior critical number is \\(x=${critical}\\).`);
}
U3['absolute-and-local-extrema-and-the-extreme-value-theorem']=(opts={})=>weighted('absolute-and-local-extrema-and-the-extreme-value-theorem','noncalculator',[()=>old('absolute-and-local-extrema-and-the-extreme-value-theorem'),extremaRadical],[extremaTest,extremaRadical]);

/* 8. Increasing/decreasing, concavity, extrema — exact and numerical. */
function analysisExact(){
  const a=ri(-5,-1),b=ri(1,5);
  return mc(`u3-analysis-${a}-${b}`,'assignment_sign_chart',`Where is \\(f\\) decreasing?`,`f'(x)=(${shift('x',a)})^2(${shift('x',b)})`,`(-\\infty,${b})`,[`(${b},\\infty)`,`(-\\infty,${a})\\cup(${b},\\infty)`,`(${a},${b})`],`The squared factor never changes sign at \\(x=${a}\\). Therefore the sign of \\(f'\\) is controlled by \\(x-${b}\\): negative for \\(x\\lt${b}\\), positive for \\(x>${b}\\).`);
}
function analysisTest(){
  return mc('u3-analysis-test','test_second_derivative_product',`At which \\(x\\)-values can \\(f\\) have inflection points?`,`f''(x)=x(x-2)^2(x+3)`,`x=-3,\\ 0`,[`x=-3,\\ 0,\\ 2`,`x=2`,`x=0,\\ 2`],`Potential inflection points occur at zeros of \\(f''\\), but concavity must change. The odd-multiplicity zeros \\(-3\\) and \\(0\\) change sign. The squared factor at \\(2\\) does not.`);
}
function analysisCalc(){
  const c=pick([.4,.7,1.1]),r=bisect(x=>Math.cos(x)-c*x,0,2);
  return numeric(`u3-analysis-calc-${c}`,'assignment_numerical_critical_point',`Calculator Active: \\(f'(x)=\\cos x-${c}x\\). Find the critical number in \\((0,2)\\) to three decimals.`,'',r,r.toFixed(3),`Find the zero of \\(f'\\) on \\((0,2)\\). A graph or numerical solver gives \\(x\\approx${r.toFixed(3)}\\). Use values on either side to complete the increasing/decreasing sign chart.`,.0006);
}
function analysisCalcTest(){
  const r=bisect(x=>Math.exp(-x)-x*x/5,0,3);
  return numeric('u3-analysis-calc-test','test_numerical_inflection',`Calculator Active: Find the possible inflection-point \\(x\\)-coordinate to three decimals.`,`f''(x)=e^{-x}-\\frac{x^2}{5},\\qquad 0\\lt x\\lt3`,r,r.toFixed(3),`Solve \\(f''(x)=0\\) numerically. The zero is \\(x\\approx${r.toFixed(3)}\\), and the sign of \\(f''\\) changes there.`,.0006);
}
U3['increasing-decreasing-intervals-concavity-and-extrema']=(opts={})=>{const m=modeOf(opts);return m==='calculator'?weighted('increasing-decreasing-intervals-concavity-and-extrema',m,[analysisCalc],[analysisCalcTest]):weighted('increasing-decreasing-intervals-concavity-and-extrema',m,[()=>old('increasing-decreasing-intervals-concavity-and-extrema'),analysisExact],[analysisTest]);};

/* v11.4 typed extrema/EVT replacement. */
function extremaTypedCubic(){
  const a=ri(1,5),C=ri(-8,8),ask=R()<.5?'maximum':'minimum',x=ask==='maximum'?-a:a;
  return exactExpression(`u3-ext-cubic-${a}-${C}-${ask}`,'extrema_cubic_local',`Enter the x-coordinate of the local ${ask}.`,`f(x)=x^3-${3*a*a}x${sgn(C,'')}`,String(x),String(x),`Differentiate: \\(f'(x)=3(x^2-${a*a})=3(x-${a})(x+${a})\\). A sign chart shows a local maximum at \\(x=-${a}\\) and a local minimum at \\(x=${a}\\).`,{expressionPlaceholder:`Enter the x-coordinate of the local ${ask}`});
}
function extremaTypedQuartic(){
  const a=ri(1,4),C=ri(-6,6),ask=R()<.5?'maximum':'minimum',values=ask==='maximum'?[0]:[-a,a];
  return valueListProblem(`u3-ext-quartic-${a}-${C}-${ask}`,'extrema_quartic_local',`Enter every x-coordinate where a local ${ask} occurs.`,`f(x)=x^4-${2*a*a}x^2${sgn(C,'')}`,'x',values,`The derivative is \\(f'(x)=4x(x-${a})(x+${a})\\). Its sign changes from positive to negative at \\(0\\), giving a local maximum there, and from negative to positive at \\(\\pm${a}\\), giving local minima.`);
}
function extremaTypedExponential(){
  const n=ri(2,6);
  return exactExpression(`u3-ext-exp-${n}`,'extrema_exponential_product',`Enter the x-coordinate of the local maximum on \\(x>0\\).`,`f(x)=x^{${n}}e^{-x}`,String(n),String(n),`Factor the derivative: \\(f'(x)=x^{${n-1}}e^{-x}(${n}-x)\\). The positive factors do not change sign, and \\(${n}-x\\) changes from positive to negative at \\(x=${n}\\).`,{expressionPlaceholder:'Enter the x-coordinate'});
}
function extremaTypedLogarithmic(){
  const a=ri(2,7);
  return exactExpression(`u3-ext-log-${a}`,'extrema_logarithmic',`Enter the x-coordinate of the local minimum.`,`f(x)=x-${a}\\ln x,\\qquad x>0`,String(a),String(a),`For \\(x>0\\), \\(f'(x)=1-\\frac{${a}}x=\\frac{x-${a}}x\\). The derivative changes from negative to positive at \\(x=${a}\\), so that point is a local minimum.`,{expressionPlaceholder:'Enter the x-coordinate'});
}
function extremaTypedRational(){
  const a=ri(1,6),ask=R()<.5?'maximum':'minimum',x=ask==='maximum'?a:-a;
  return exactExpression(`u3-ext-rational-${a}-${ask}`,'extrema_rational',`Enter the x-coordinate of the local ${ask}.`,`f(x)=\\frac{x}{x^2+${a*a}}`,String(x),String(x),`The derivative is \\(f'(x)=\\frac{${a*a}-x^2}{(x^2+${a*a})^2}\\). Its sign changes at \\(x=\\pm${a}\\): the local minimum is at \\(-${a}\\), and the local maximum is at \\(${a}\\).`,{expressionPlaceholder:`Enter the x-coordinate of the local ${ask}`});
}
function extremaTypedTrig(){
  const A=ri(2,7),C=ri(-5,5),ask=R()<.5?'maximum':'minimum',answer=ask==='maximum'?A+C:C-A;
  return exactExpression(`u3-ext-trig-${A}-${C}-${ask}`,'extrema_trigonometric_closed_interval',`Enter the absolute ${ask} value on \\([0,2\\pi]\\).`,`f(x)=${A}\\sin x${sgn(C,'')}`,String(answer),String(answer),`On \\([0,2\\pi]\\), sine ranges from \\(-1\\) to \\(1\\). Therefore the absolute maximum value is \\(${A+C}\\), and the absolute minimum value is \\(${C-A}\\).`,{expressionPlaceholder:`Enter the absolute ${ask} value`});
}
function extremaTypedRadical(){
  const r=pick([2,4,6,8,10]),r2=r*r,q=Q(r2,2);
  return exactExpression(`u3-ext-radical-${r}`,'extrema_radical_closed_interval',`Enter the absolute maximum value on the closed interval.`,`f(x)=x\\sqrt{${r2}-x^2},\\qquad [0,${r}]`,qPlain(q),qTex(q),`The endpoints give \\(0\\). Also \\(f'(x)=\\frac{${r2}-2x^2}{\\sqrt{${r2}-x^2}}\\), so the interior critical number is \\(x=\\frac{${r}}{\\sqrt2}\\). Evaluating the function there gives the absolute maximum \\(${qTex(q)}\\).`,{expressionPlaceholder:'Enter the absolute maximum value'});
}
function extremaTypedAbsolutePolynomial(){
  const a=ri(1,4),C=ri(-5,5),bound=2*a,maxValue=2*a*a*a+C,minValue=-2*a*a*a+C,ask=R()<.5?'maximum':'minimum',answer=ask==='maximum'?maxValue:minValue;
  return exactExpression(`u3-ext-absolute-poly-${a}-${C}-${ask}`,'extrema_polynomial_closed_interval',`Enter the absolute ${ask} value on the stated interval.`,`f(x)=x^3-${3*a*a}x${sgn(C,'')},\\qquad [-${bound},${bound}]`,String(answer),String(answer),`Check the endpoints and the critical numbers \\(x=\\pm${a}\\). Comparing all four function values gives an absolute maximum of \\(${maxValue}\\) and an absolute minimum of \\(${minValue}\\).`,{expressionPlaceholder:`Enter the absolute ${ask} value`});
}
function evtTypedPolynomial(){
  const a=ri(1,5),b=a+ri(2,5);
  return textAnswer(`u3-evt-poly-${a}-${b}`,'evt_polynomial_closed_interval',`Does the Extreme Value Theorem guarantee both an absolute maximum and an absolute minimum on the stated interval?`,`f(x)=x^3-${a}x+${b},\\qquad [-${a},${b}]`,'yes',`Yes. A polynomial is continuous everywhere, and the interval \\([-${a},${b}]\\) is closed and bounded. EVT therefore guarantees both absolute extrema.`,{acceptedText:['y'],answerTex:'\\text{Yes}',textInputHint:'Enter yes or no.'});
}
function evtTypedRationalHole(){
  const a=ri(-4,1),b=a+ri(2,5),left=a-1,right=b+1,n=Math.abs(b)+1;
  return textAnswer(`u3-evt-rational-${a}-${b}`,'evt_rational_interior_discontinuity',`Does the Extreme Value Theorem guarantee both absolute extrema on the stated interval?`,`f(x)=\\frac{x+${n}}{(x-${a})(x-${b})},\\qquad [${left},${right}]`,'no',`No. The denominator is zero at \\(x=${a}\\) and \\(x=${b}\\), both inside the interval. The function is not continuous on the entire closed interval, so EVT does not apply.`,{acceptedText:['n'],answerTex:'\\text{No}',textInputHint:'Enter yes or no.'});
}
function evtTypedRoot(){
  const a=ri(1,5),right=a+ri(3,8);
  return textAnswer(`u3-evt-root-${a}-${right}`,'evt_radical_domain',`Does the Extreme Value Theorem guarantee both absolute extrema on the stated interval?`,`f(x)=\\sqrt{x-${a}}+x,\\qquad [${a},${right}]`,'yes',`Yes. The square root is defined and continuous for every \\(x\\ge${a}\\), including the left endpoint. The function is continuous on this closed, bounded interval, so EVT applies.`,{acceptedText:['y'],answerTex:'\\text{Yes}',textInputHint:'Enter yes or no.'});
}
function evtTypedLogFailure(){
  const a=ri(1,5),right=a+ri(3,7);
  return textAnswer(`u3-evt-log-${a}-${right}`,'evt_logarithmic_excluded_endpoint',`Does the Extreme Value Theorem guarantee both absolute extrema on the stated interval?`,`f(x)=\\ln(x-${a}),\\qquad [${a},${right}]`,'no',`No. The function is not defined at the left endpoint \\(x=${a}\\). It is therefore not continuous on the full closed interval, so EVT gives no guarantee.`,{acceptedText:['n'],answerTex:'\\text{No}',textInputHint:'Enter yes or no.'});
}
const extremaTypedAssignments=[extremaTypedCubic,extremaTypedQuartic,extremaTypedExponential,extremaTypedLogarithmic,extremaTypedRational,extremaTypedTrig,extremaTypedRadical,extremaTypedAbsolutePolynomial,evtTypedPolynomial,evtTypedRationalHole,evtTypedRoot,evtTypedLogFailure];
const extremaTypedTests=[extremaTypedCubic,extremaTypedAbsolutePolynomial,extremaTypedRadical,evtTypedRationalHole,evtTypedRoot,extremaTypedRational];
U3['absolute-and-local-extrema-and-the-extreme-value-theorem']=(opts={})=>weighted('absolute-and-local-extrema-and-the-extreme-value-theorem','noncalculator',extremaTypedAssignments,extremaTypedTests);

/* v11.4 typed derivative-analysis replacement. */
const isFiniteEndpoint=value=>(value&&typeof value==='object')||Number.isFinite(value);
const closedPart=(left,right)=>({left,right,leftClosed:isFiniteEndpoint(left),rightClosed:isFiniteEndpoint(right)});
const openPart=(left,right)=>({left,right,leftClosed:false,rightClosed:false});
function analysisTypedFCubic(){
  const [a,b]=pick([[-4,-2],[-3,1],[-2,2],[-1,3],[1,3],[2,4]]),C=ri(-7,7),sum=a+b,coeff=[1,-3*sum/2,3*a*b,C],ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(-Infinity,a),closedPart(b,Infinity)]:[closedPart(a,b)];
  return intervalProblem(`u3-analysis-f-cubic-${a}-${b}-${C}-${ask}`,'analysis_from_f_cubic',`Where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f(x)=${poly(coeff)}`,parts,`Differentiate and factor: \\(f'(x)=3(x-${a})(x-${b})\\). Its sign is positive outside the two critical numbers and negative between them. Use brackets at the finite critical endpoints for increasing and decreasing intervals.`,{analysisGiven:'f'});
}
function analysisTypedFQuartic(){
  const a=ri(1,4),C=ri(-6,6),ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(-a,0),closedPart(a,Infinity)]:[closedPart(-Infinity,-a),closedPart(0,a)];
  return intervalProblem(`u3-analysis-f-quartic-${a}-${C}-${ask}`,'analysis_from_f_quartic',`Where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f(x)=x^4-${2*a*a}x^2${sgn(C,'')}`,parts,`Differentiate and factor: \\(f'(x)=4x(x-${a})(x+${a})\\). The derivative is negative on \\(( -\\infty,-${a})\\), positive on \\((-${a},0)\\), negative on \\((0,${a})\\), and positive on \\((${a},\\infty)\\). Select the intervals with the requested sign and include finite critical endpoints with brackets.`,{analysisGiven:'f'});
}
function analysisTypedFQuadraticFormula(){
  const left={raw:'-1-sqrt(2)',tex:'-1-\\sqrt2'},right={raw:'-1+sqrt(2)',tex:'-1+\\sqrt2'},ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(-Infinity,left),closedPart(right,Infinity)]:[closedPart(left,right)];
  return intervalProblem(`u3-analysis-f-qf-${ask}`,'analysis_from_f_quadratic_formula',`Where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f(x)=x^3+3x^2-3x+2`,parts,`The derivative is \\(f'(x)=3x^2+6x-3=3(x^2+2x-1)\\). Completing the square or using the quadratic formula gives \\(x=-1\\pm\\sqrt2\\). Since the quadratic opens upward, \\(f'\\) is positive outside those values and negative between them.`,{analysisGiven:'f'});
}
function analysisTypedFExponential(){
  const ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(-Infinity,1)]:[closedPart(1,Infinity)];
  return intervalProblem(`u3-analysis-f-exp-${ask}`,'analysis_from_f_exponential_product',`Where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f(x)=xe^{-x}`,parts,`Differentiate: \\(f'(x)=e^{-x}(1-x)\\). Because \\(e^{-x}>0\\), the sign is determined by \\(1-x\\): positive before \\(1\\) and negative after \\(1\\).`,{analysisGiven:'f'});
}
function analysisTypedFLogarithmic(){
  const a=ri(2,7),ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(a,Infinity)]:[{left:0,right:a,leftClosed:false,rightClosed:true}];
  return intervalProblem(`u3-analysis-f-log-${a}-${ask}`,'analysis_from_f_logarithmic',`Where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f(x)=x-${a}\\ln x`,parts,`The domain is \\(x>0\\), and \\(f'(x)=\\frac{x-${a}}x\\). The derivative is negative on \\((0,${a})\\) and positive on \\((${a},\\infty)\\). The domain endpoint \\(0\\) stays open; the critical endpoint \\(${a}\\) is bracketed.`,{analysisGiven:'f'});
}
function analysisTypedFRational(){
  const a=ri(1,6),ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(-a,a)]:[closedPart(-Infinity,-a),closedPart(a,Infinity)];
  return intervalProblem(`u3-analysis-f-rational-${a}-${ask}`,'analysis_from_f_rational',`Where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f(x)=\\frac{x}{x^2+${a*a}}`,parts,`The derivative is \\(f'(x)=\\frac{${a*a}-x^2}{(x^2+${a*a})^2}\\). The denominator is always positive. The numerator is positive between \\(-${a}\\) and \\(${a}\\), and negative outside.`,{analysisGiven:'f'});
}
function analysisTypedFTrig(){
  const half={raw:'pi/2',tex:'\\frac{\\pi}{2}'},three={raw:'3*pi/2',tex:'\\frac{3\\pi}{2}'},two={raw:'2*pi',tex:'2\\pi'},ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(0,half),closedPart(three,two)]:[closedPart(half,three)];
  return intervalProblem(`u3-analysis-f-trig-${ask}`,'analysis_from_f_trigonometric',`Where is \\(f\\) ${ask} on \\([0,2\\pi]\\)? Enter your answer in interval notation.`,`f(x)=\\sin x+2`,parts,`Since \\(f'(x)=\\cos x\\), the derivative is positive from \\(0\\) to \\(\\frac\\pi2\\) and from \\(\\frac{3\\pi}2\\) to \\(2\\pi\\), and negative between the two critical numbers. Include the finite endpoints with brackets.`,{analysisGiven:'f'});
}
function analysisTypedFConcavity(){
  const h=ri(-4,4),C=ri(-6,6),ask=R()<.5?'up':'down',parts=ask==='up'?[openPart(h,Infinity)]:[openPart(-Infinity,h)],middle=-3*h,fpp=h===0?'6x':'6('+shift('x',h)+')';
  return intervalProblem(`u3-analysis-f-concavity-${h}-${C}-${ask}`,'analysis_from_f_concavity_polynomial',`Where is \\(f\\) concave ${ask}? Enter your answer in interval notation.`,`f(x)=x^3${sgn(middle,'x^2')}${sgn(C,'')}`,parts,`Differentiate twice: \\(f''(x)=${fpp}\\). It is negative to the left of \\(${h}\\) and positive to the right, so concavity changes there. Concavity intervals use parentheses at the inflection value.`,{analysisGiven:'f'});
}
const analysisTypedFFamilies=[analysisTypedFCubic,analysisTypedFQuartic,analysisTypedFQuadraticFormula,analysisTypedFExponential,analysisTypedFLogarithmic,analysisTypedFRational,analysisTypedFTrig,analysisTypedFConcavity];
function analysisDerivativeShown(factored,factoredTex,expandedTex){return factored?factoredTex:expandedTex;}
function analysisTypedPrimeQuadratic(){
  const [a,b]=pick([[-4,-1],[-3,2],[-2,3],[1,4]]),factored=R()<.25,ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(-Infinity,a),closedPart(b,Infinity)]:[closedPart(a,b)],shown=analysisDerivativeShown(factored,`(x-${a})(x-${b})`,poly([1,-a-b,a*b]));
  return intervalProblem(`u3-analysis-fp-quad-${a}-${b}-${factored}-${ask}`,'analysis_from_first_derivative_quadratic',`Given \\(f'\\), where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f'(x)=${shown}`,parts,`The zeros are \\(x=${a}\\) and \\(x=${b}\\). The upward-opening quadratic is positive outside the roots and negative between them.`,{analysisGiven:'fp',givenFactored:factored});
}
function analysisTypedPrimeCubic(){
  const a=ri(1,4),b=ri(1,4),factored=R()<.25,ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(-a,0),closedPart(b,Infinity)]:[closedPart(-Infinity,-a),closedPart(0,b)],shown=analysisDerivativeShown(factored,`x(x+${a})(x-${b})`,poly([1,a-b,-a*b,0]));
  return intervalProblem(`u3-analysis-fp-cubic-${a}-${b}-${factored}-${ask}`,'analysis_from_first_derivative_cubic',`Given \\(f'\\), where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f'(x)=${shown}`,parts,`Factor to find the simple zeros \\(-${a},0,${b}\\). The signs of \\(f'\\), from left to right, are negative, positive, negative, and positive. Use the positive intervals for increasing and the negative intervals for decreasing.`,{analysisGiven:'fp',givenFactored:factored});
}
function analysisTypedPrimeGrouping(){
  const a=nz(-4,4),b=ri(1,7),root=-a,factored=R()<.25,ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(root,Infinity)]:[closedPart(-Infinity,root)],shown=analysisDerivativeShown(factored,`(x${sgn(a,'')})(x^2+${b})`,poly([1,a,b,a*b]));
  return intervalProblem(`u3-analysis-fp-group-${a}-${b}-${factored}-${ask}`,'analysis_from_first_derivative_grouping',`Given \\(f'\\), where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f'(x)=${shown}`,parts,`Factor by grouping: \\(f'(x)=(x${sgn(a,'')})(x^2+${b})\\). The quadratic factor is always positive, so the sign changes only at \\(x=${root}\\).`,{analysisGiven:'fp',givenFactored:factored});
}
function analysisTypedPrimeBiquadratic(){
  const a=ri(1,2),b=ri(a+1,5),factored=R()<.25,ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(-Infinity,-b),closedPart(-a,a),closedPart(b,Infinity)]:[closedPart(-b,-a),closedPart(a,b)],shown=analysisDerivativeShown(factored,`(x^2-${a*a})(x^2-${b*b})`,poly([1,0,-a*a-b*b,0,a*a*b*b]));
  return intervalProblem(`u3-analysis-fp-biquad-${a}-${b}-${factored}-${ask}`,'analysis_from_first_derivative_variable_substitution',`Given \\(f'\\), where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f'(x)=${shown}`,parts,`Factor the derivative as \\((x^2-${a*a})(x^2-${b*b})=(x-${a})(x+${a})(x-${b})(x+${b})\\). Its zeros are \\(\\pm${a}\\) and \\(\\pm${b}\\). The signs of \\(f'\\), from left to right, are positive, negative, positive, negative, and positive. Use those signs to select the requested intervals.`,{analysisGiven:'fp',givenFactored:factored});
}
const analysisTypedPrimeFamilies=[analysisTypedPrimeQuadratic,analysisTypedPrimeCubic,analysisTypedPrimeGrouping,analysisTypedPrimeBiquadratic];
function analysisTypedSecondQuadratic(){
  const a=ri(-4,-1),b=ri(1,4),factored=R()<.25,ask=R()<.5?'up':'down',parts=ask==='up'?[openPart(-Infinity,a),openPart(b,Infinity)]:[openPart(a,b)],shown=analysisDerivativeShown(factored,`(x-${a})(x-${b})`,poly([1,-a-b,a*b]));
  return intervalProblem(`u3-analysis-fpp-quad-${a}-${b}-${factored}-${ask}`,'analysis_from_second_derivative_quadratic',`Given \\(f''\\), where is \\(f\\) concave ${ask}? Enter your answer in interval notation.`,`f''(x)=${shown}`,parts,`The second derivative is zero at \\(${a}\\) and \\(${b}\\). It is positive outside the roots and negative between them. Concavity intervals use parentheses.`,{analysisGiven:'fpp',givenFactored:factored});
}
function analysisTypedSecondCubic(){
  const a=ri(1,4),b=ri(1,4),factored=R()<.25,ask=R()<.5?'up':'down',parts=ask==='up'?[openPart(-a,0),openPart(b,Infinity)]:[openPart(-Infinity,-a),openPart(0,b)],shown=analysisDerivativeShown(factored,`x(x+${a})(x-${b})`,poly([1,a-b,-a*b,0]));
  return intervalProblem(`u3-analysis-fpp-cubic-${a}-${b}-${factored}-${ask}`,'analysis_from_second_derivative_cubic',`Given \\(f''\\), where is \\(f\\) concave ${ask}? Enter your answer in interval notation.`,`f''(x)=${shown}`,parts,`Factor to find the simple zeros \\(-${a},0,${b}\\). The signs of \\(f''\\), from left to right, are negative, positive, negative, and positive. Therefore \\(f\\) is concave up where \\(f''>0\\) and concave down where \\(f''\\lt0\\).`,{analysisGiven:'fpp',givenFactored:factored});
}
function analysisTypedSecondInflections(){
  const a=ri(1,4),b=ri(a+1,6),factored=R()<.25,shown=analysisDerivativeShown(factored,`(x+${a})(x-${b})^2`,poly([1,a-2*b,b*b-2*a*b,a*b*b])),p=valueListProblem(`u3-analysis-fpp-poi-${a}-${b}-${factored}`,'analysis_inflection_points_from_second_derivative',`Enter every x-coordinate at which \\(f\\) has an inflection point.`,`f''(x)=${shown}`,'x',[-a],`The second derivative is zero at \\(-${a}\\) and \\(${b}\\). Its sign changes at the odd-multiplicity zero \\(-${a}\\), but the squared factor at \\(${b}\\) does not change sign.`);
  p.analysisGiven='fpp';p.givenFactored=factored;return p;
}
const analysisTypedSecondFamilies=[analysisTypedSecondQuadratic,analysisTypedSecondCubic,analysisTypedSecondInflections];
function analysisTypedExact(){
  const roll=R();if(roll<.75)return pick(analysisTypedFFamilies)();if(roll<.90)return pick(analysisTypedPrimeFamilies)();return pick(analysisTypedSecondFamilies)();
}
function analysisTypedCalcPrimeCos(){
  const c=pick([.4,.7,1.1]),r=bisect(x=>Math.cos(x)-c*x,0,2),ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(0,r)]:[closedPart(r,4)];
  return calculatorIntervalProblem(`u3-analysis-calc-fp-cos-${c}-${ask}`,'analysis_calculator_first_derivative_cosine',`Calculator Active: Given \\(f'\\), where is \\(f\\) ${ask} on \\([0,4]\\)?`,`f'(x)=\\cos x-${c}x`,parts,`Find the zero \\(x=${r.toFixed(3)}\\). The derivative is positive before that value and negative after it, so use the corresponding part of the domain.`,{analysisGiven:'fp'});
}
function analysisTypedCalcPrimeSine(){
  const c=pick([.2,.35,.6]),a=Math.asin(c),b=Math.PI-a,ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(a,b)]:[closedPart(0,a),closedPart(b,2*Math.PI)];
  return calculatorIntervalProblem(`u3-analysis-calc-fp-sin-${c}-${ask}`,'analysis_calculator_first_derivative_sine',`Calculator Active: Given \\(f'\\), where is \\(f\\) ${ask} on \\([0,2\\pi]\\)?`,`f'(x)=\\sin x-${c}`,parts,`The zeros are \\(x=${a.toFixed(3)}\\) and \\(x=${b.toFixed(3)}\\). The derivative is positive between them and negative outside them.`,{analysisGiven:'fp'});
}
function analysisTypedCalcPrimeLog(){
  const c=pick([.8,1.1,1.4]),r=Math.exp(c)-2,ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(r,5)]:[closedPart(0,r)];
  return calculatorIntervalProblem(`u3-analysis-calc-fp-log-${c}-${ask}`,'analysis_calculator_first_derivative_logarithmic',`Calculator Active: Given \\(f'\\), where is \\(f\\) ${ask} on \\([0,5]\\)?`,`f'(x)=\\ln(x+2)-${c}`,parts,`A numerical zero finder gives \\(x=${r.toFixed(3)}\\). The derivative is negative before that value and positive after it.`,{analysisGiven:'fp'});
}
function analysisTypedCalcPrimeMixed(){
  const k=pick([2,3,5]),r=bisect(x=>Math.exp(-x)-x/k,0,3),ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(0,r)]:[closedPart(r,4)];
  return calculatorIntervalProblem(`u3-analysis-calc-fp-mixed-${k}-${ask}`,'analysis_calculator_first_derivative_exponential',`Calculator Active: Given \\(f'\\), where is \\(f\\) ${ask} on \\([0,4]\\)?`,`f'(x)=e^{-x}-\\frac{x}{${k}}`,parts,`The only zero on the interval is \\(x=${r.toFixed(3)}\\). The derivative is positive to its left and negative to its right.`,{analysisGiven:'fp'});
}
function analysisTypedCalcLocalMaximum(){
  const c=pick([.45,.75,1.05]),r=bisect(x=>Math.cos(x)-c*x,0,2);
  return numeric(`u3-analysis-calc-max-${c}`,'analysis_calculator_local_maximum',`Calculator Active: Given \\(f'\\), find the x-coordinate of the local maximum on \\((0,3)\\).`,`f'(x)=\\cos x-${c}x`,r,r.toFixed(3),`Solve \\(f'(x)=0\\) to get \\(x=${r.toFixed(3)}\\). The derivative changes from positive to negative there, so \\(f\\) has a local maximum.`,.0006,{analysisGiven:'fp'});
}
function analysisTypedCalcLocalMinimum(){
  const c=pick([.85,1.05,1.25]),r=Math.exp(c)-2;
  return numeric(`u3-analysis-calc-min-${c}`,'analysis_calculator_local_minimum',`Calculator Active: Given \\(f'\\), find the x-coordinate of the local minimum on \\((0,4)\\).`,`f'(x)=\\ln(x+2)-${c}`,r,r.toFixed(3),`The zero is \\(x=${r.toFixed(3)}\\). Since \\(f'\\) changes from negative to positive there, \\(f\\) has a local minimum.`,.0006,{analysisGiven:'fp'});
}
function analysisTypedCalcSecondExp(){
  const k=pick([4,5,7]),r=bisect(x=>Math.exp(-x)-x*x/k,0,3),ask=R()<.5?'up':'down',parts=ask==='up'?[openPart(0,r)]:[openPart(r,3)];
  return calculatorIntervalProblem(`u3-analysis-calc-fpp-exp-${k}-${ask}`,'analysis_calculator_second_derivative_exponential',`Calculator Active: Given \\(f''\\), where is \\(f\\) concave ${ask} on \\(0\\lt x\\lt3\\)?`,`f''(x)=e^{-x}-\\frac{x^2}{${k}}`,parts,`The second derivative is zero at \\(x=${r.toFixed(3)}\\). It is positive before the zero and negative after it.`,{analysisGiven:'fpp'});
}
function analysisTypedCalcSecondSine(){
  const c=pick([.25,.4,.65]),a=Math.asin(c),b=Math.PI-a,ask=R()<.5?'up':'down',parts=ask==='up'?[openPart(a,b)]:[openPart(0,a),openPart(b,2*Math.PI)];
  return calculatorIntervalProblem(`u3-analysis-calc-fpp-sin-${c}-${ask}`,'analysis_calculator_second_derivative_sine',`Calculator Active: Given \\(f''\\), where is \\(f\\) concave ${ask} on \\(0\\lt x\\lt2\\pi\\)?`,`f''(x)=\\sin x-${c}`,parts,`The zeros are \\(${a.toFixed(3)}\\) and \\(${b.toFixed(3)}\\). The second derivative is positive between them and negative outside them.`,{analysisGiven:'fpp'});
}
function analysisTypedCalcInflection(){
  const k=pick([3,4,6]),r=bisect(x=>Math.cos(x)-x/k,0,2);
  return numeric(`u3-analysis-calc-poi-${k}`,'analysis_calculator_inflection_point',`Calculator Active: Given \\(f''\\), find the x-coordinate of the point of inflection on \\((0,3)\\).`,`f''(x)=\\cos x-\\frac{x}{${k}}`,r,r.toFixed(3),`The numerical zero is \\(x=${r.toFixed(3)}\\). The sign of \\(f''\\) changes from positive to negative there, so concavity changes.`,.0006,{analysisGiven:'fpp'});
}
const analysisTypedCalcAssignments=[analysisTypedCalcPrimeCos,analysisTypedCalcPrimeSine,analysisTypedCalcPrimeLog,analysisTypedCalcPrimeMixed,analysisTypedCalcLocalMaximum,analysisTypedCalcLocalMinimum,analysisTypedCalcSecondExp,analysisTypedCalcSecondSine,analysisTypedCalcInflection];
const analysisTypedCalcTests=[analysisTypedCalcPrimeCos,analysisTypedCalcPrimeSine,analysisTypedCalcLocalMaximum,analysisTypedCalcSecondExp,analysisTypedCalcInflection];
U3['increasing-decreasing-intervals-concavity-and-extrema']=(opts={})=>{
  const mode=modeOf(opts);
  if(mode==='calculator')return weighted('increasing-decreasing-intervals-concavity-and-extrema',mode,analysisTypedCalcAssignments,analysisTypedCalcTests);
  const source=R()<.15?'test':'assignment',p=analysisTypedExact();return stamp(p,'increasing-decreasing-intervals-concavity-and-extrema',mode,source,p.variant);
};

/* 9. Curve analysis/graphing functions. */
function graphPolynomial(){
  const h=ri(1,6),b=3*h;
  return mc(`u3-graph-poly-${h}`,'assignment_curve_analysis_polynomial',`Which statement belongs on the complete graph analysis?`,`f(x)=x^3-${b}x^2`,`f has a local maximum at x=0 and a local minimum at x=${2*h}.`,[`f has a local minimum at x=0 and a local maximum at x=${2*h}.`,'f has no local extrema.',`f is increasing on (0,${2*h}).`],`Since \\(f'(x)=3x(x-${2*h})\\), its sign changes from positive to negative at \\(0\\) and from negative to positive at \\(${2*h}\\). Thus \\(x=0\\) is a local maximum and \\(x=${2*h}\\) is a local minimum.`);
}
function graphRational(){
  const a=ri(1,5),b=a+ri(1,4);
  return mc(`u3-graph-rat-${a}-${b}`,'assignment_curve_analysis_rational',`Identify the vertical asymptotes before completing the derivative analysis.`,`f(x)=\\frac{x+1}{(${shift('x',a)})(${shift('x',b)})}`,`x=${a}\\text{ and }x=${b}`,[`x=-1`,`y=0`,`x=${a+b}`],`The denominator is zero at \\(x=${a}\\) and \\(x=${b}\\), and neither factor cancels with the numerator. Both are vertical asymptotes.`);
}
function graphTrig(){
  const k=ri(1,6),half=k===1?'\\pi':`\\frac{\\pi}{${k}}`,whole=k===1?'2\\pi':`\\frac{2\\pi}{${k}}`,fn=k===1?'\\sin x':`\\sin(${k}x)`;
  return mc(`u3-graph-trig-${k}`,'assignment_curve_analysis_trig',`On which interval is the function concave down?`,`f(x)=${fn},\\qquad 0\\lt x\\lt${whole}`,`(0,${half})`,[`(${half},${whole})`,`(0,${whole})`,`(0,\\frac{\\pi}{${2*k}})`],`Since \\(f''(x)=-${k*k}\\sin(${k===1?'':k}x)\\), the graph is concave down where the sine factor is positive, namely \\((0,${half})\\).`);
}
function graphTest(){
  const n=ri(2,7),even=n%2===0,correct=even?`f decreases on (-${n},0) and increases on (-\\infty,-${n})\\cup(0,\\infty).`:`f decreases on (-\\infty,-${n}) and increases on (-${n},\\infty).`;
  return mc(`u3-graph-test-${n}`,'test_full_curve_exponential_product',`Which statement is correct for the complete graph analysis?`,`f(x)=x^{${n}}e^x`,correct,[even?`f increases on (-${n},0) only.`:`f increases on (-\\infty,-${n}).`,'f decreases for every \\(x\\lt0\\).','f has no critical numbers.'],`Differentiate and factor: \\(f'(x)=e^x x^{${n-1}}(x+${n})\\). Since \\(e^x>0\\), a sign chart at \\(-${n}\\) and \\(0\\) gives the stated intervals.`);
}
U3['graphing-functions']=(opts={})=>weighted('graphing-functions','noncalculator',[graphPolynomial,graphRational,graphTrig],[graphTest,graphRational]);

/* 10. Linearization and differentials — exact and calculator-active. */
function linExact(){return old('linearization-and-differentials');}
function linTestExact(){
  return mc('u3-lin-test-sphere','test_differential_sphere',`Use differentials to approximate the change in volume when the radius increases from \\(5\\) to \\(5.02\\).`,`V=\\frac43\\pi r^3`,`2\\pi`,[`\\frac{2\\pi}{3}`,`50\\pi`,`0.02\\pi`],`Use \\(dV=4\\pi r^2dr\\). At \\(r=5\\) and \\(dr=.02\\), \\(dV=4\\pi(25)(.02)=2\\pi\\).`);
}
function linCalc(){
  const R0=pick([5,6,8]),r0=pick([2,3]),dR=.02,dr=-.01;
  const dV=2*Math.PI*Math.PI*R0*r0*dR+Math.PI*Math.PI*R0*R0*dr;
  return numeric(`u3-lin-calc-torus-${R0}-${r0}`,'assignment_calculator_multivariable_differential',`Calculator Active: For \\(V=2\\pi^2Rr\\), estimate \\(dV\\) at \\(R=${R0},r=${r0}\\) when \\(dR=${dR}\\) and \\(dr=${dr}\\). Round to three decimals.`,'',dV,dV.toFixed(3),`Use \\(dV=2\\pi^2(r\\,dR+R\\,dr)\\). Substitution gives \\(dV\\approx${dV.toFixed(3)}\\).`,.0006);
}
function linCalcTest(){
  const a=pick([3,4,5,6]),base=a**4,d=pick([-10,-5,-2,-1,1,2,5,10]),n=base+d,approx=a+d/(4*a**3);
  return numeric(`u3-lin-calc-test-${n}`,'test_calculator_fourth_root_linearization',`Calculator Active: Use the linearization of \\(x^{\\frac{1}{4}}\\) at \\(x=${base}\\) to approximate \\(\\sqrt[4]{${n}}\\). Round to exactly three decimal places.`,'',approx,approx.toFixed(3),`At \\(a=${base}\\), \\(f(a)=${a}\\) and \\(f'(a)=1/(4${a}^3)\\). Thus \\(L(${n})=${a}+(${n}-${base})/(4${a}^3)\\approx${approx.toFixed(3)}\\).`,.000500001);
}
U3['linearization-and-differentials']=(opts={})=>{const m=modeOf(opts);return m==='calculator'?weighted('linearization-and-differentials',m,[linCalc],[linCalcTest]):weighted('linearization-and-differentials',m,[linExact],[linTestExact]);};

/* 11. Newton's method — calculator active. */
function newtonPolynomial(){
  const n=pick([2,3,5,6,7,8,10,11,12,13,14,15,17,18,19,20,21,22,23,24,26,27,28,30]),x0=pick([1,2,3,4,5,6]),f=x=>x*x-n,fp=x=>2*x,x1=x0-f(x0)/fp(x0),x2=x1-f(x1)/fp(x1);
  return numeric(`u3-newton-root-${n}-${x0}`,'assignment_newton_square_root',`Calculator Active: Use Newton's method twice, beginning with \\(x_0=${x0}\\), to approximate \\(\\sqrt{${n}}\\). Round \\(x_2\\) to exactly three decimal places.`,`x_{k+1}=x_k-\\frac{x_k^2-${n}}{2x_k}`,x2,x2.toFixed(3),`First, \\(x_1=${fmt(x1,6)}\\). Substitute that value again to obtain \\(x_2=${x2.toFixed(3)}\\).`,.000500001);
}
function newtonTrig(){
  const c=pick([.5,.75,1,1.25,1.5]),x0=pick([.5,.7,1]),f=x=>Math.cos(x)-c*x,fp=x=>-Math.sin(x)-c,x1=x0-f(x0)/fp(x0),x2=x1-f(x1)/fp(x1);
  return numeric(`u3-newton-trig-${c}-${x0}`,'assignment_newton_trig',`Calculator Active: Apply Newton's method twice to \\(f(x)=\\cos x-${c}x\\), beginning with \\(x_0=${x0}\\). Round \\(x_2\\) to exactly three decimal places.`,'',x2,x2.toFixed(3),`Use \\(x_{n+1}=x_n-(\\cos x_n-${c}x_n)/(-\\sin x_n-${c})\\). This gives \\(x_1=${x1.toFixed(6)}\\) and \\(x_2=${x2.toFixed(3)}\\).`,.000500001);
}
function newtonTest(){
  const c=pick([1,2,3,4,5]),x0=pick([1.5,2]),f=x=>x*x*x-x-c,fp=x=>3*x*x-1,x1=x0-f(x0)/fp(x0),x2=x1-f(x1)/fp(x1);
  return numeric(`u3-newton-test-cubic-${c}-${x0}`,'test_newton_cubic_ivt',`Calculator Active: Use Newton's method on \\(x^3-x-${c}=0\\). Starting with \\(x_0=${x0}\\), find \\(x_2\\) to exactly three decimal places.`,'',x2,x2.toFixed(3),`Newton's formula is \\(x_{n+1}=x_n-(x_n^3-x_n-${c})/(3x_n^2-1)\\). Two iterations give \\(x_2=${x2.toFixed(3)}\\).`,.000500001);
}
U3['newton-s-method-for-approximating-roots-of-a-function']=(opts={})=>weighted('newton-s-method-for-approximating-roots-of-a-function','calculator',[newtonPolynomial,newtonTrig],[newtonTest,newtonPolynomial]);

/* 12. Tangent/secant approximations and concavity. */
function tangentSecantTest(){
  const approx=2+1/4,actual=Math.sqrt(5);
  return classifyApprox('u3-ts-test','test_tangent_approximation_concavity',`Use the tangent line to \\(f(x)=\\sqrt{x}\\) at \\(x=4\\) to approximate \\(\\sqrt5\\), then classify it.`,`f(x)=\\sqrt{x}`,approx,'over',`The tangent line is \\(L(x)=2+\\frac14(x-4)\\), so \\(L(5)=2.25\\). Since \\(f''(x)\\lt0\\), the graph is concave down and its tangent line lies above the graph. The result is an overestimate.`);
}
U3['tangent-and-secant-line-approximations']=(opts={})=>weighted('tangent-and-secant-line-approximations','noncalculator',[()=>old('tangent-and-secant-line-approximations')],[tangentSecantTest,()=>old('tangent-and-secant-line-approximations')]);

/* 13. Rolle and Mean Value Theorems. */
function mvtTest(){
  return mc('u3-mvt-test','test_mvt_hypotheses',`Can the Mean Value Theorem be applied on the stated interval?`,`f(x)=\\frac{x+1}{x-2},\\qquad [0,4]`,'No, because f is not continuous on the entire closed interval.',['Yes, because both endpoint values exist.','Yes, because f is differentiable at both endpoints.','No, because the average rate of change is zero.'],`The function has a vertical asymptote at \\(x=2\\), inside the interval. Therefore it is not continuous on \\([0,4]\\), so the Mean Value Theorem does not apply.`);
}
function mvtFindCTest(){
  const a=ri(-4,1),span=pick([2,4,6]),b=a+span,c=(a+b)/2,k=ri(1,5);
  return mc(`u3-mvt-test-find-c-${a}-${b}-${k}`,'test_mvt_find_c',`For the function and interval shown, find the value of \\(c\\) guaranteed by the Mean Value Theorem.`,`f(x)=x^2+${k},\\qquad [${a},${b}]`,`c=${fmt(c)}`,[`c=${fmt(a)}`,`c=${fmt(b)}`,`c=${fmt(b-a)}`],`The average rate of change is \\(\\frac{f(${b})-f(${a})}{${b}-${a}}=${a+b}\\). Since \\(f'(x)=2x\\), solve \\(2c=${a+b}\\) to get \\(c=${fmt(c)}\\), which lies in \\(( ${a},${b} )\\).`);
}
U3['rolle-s-theorem-and-the-mean-value-theorem']=(opts={})=>{
  const focus=opts.mvtMode||opts.mode||'both';
  const assignment=()=>old('rolle-s-theorem-and-the-mean-value-theorem',{mvtMode:focus});
  const tests=focus==='theorem'?[mvtTest]:focus==='find-c'?[mvtFindCTest]:[mvtTest,mvtFindCTest];
  return weighted('rolle-s-theorem-and-the-mean-value-theorem','noncalculator',[assignment],[...tests,assignment]);
};

/* 14. L'Hopital's Rule — exact, non-calculator. */
function lhopitalTest(){
  return mc('u3-lh-test','test_lhopital_repeated',`Evaluate the limit.`,`\\displaystyle\\lim_{x\\to0}\\frac{e^x-1-x}{x^2}`,'\\frac12',['0','1','2'],`Direct substitution gives \\(\\frac00\\). Differentiate numerator and denominator twice: \\(\\frac{e^x}{2}\\to\\frac12\\).`);
}
U3['l-hopital-s-rule']=(opts={})=>weighted('l-hopital-s-rule','noncalculator',[()=>old('l-hopital-s-rule')],[lhopitalTest,()=>old('l-hopital-s-rule')]);

/* Version 12.2 staged practice shared by Topics 12–14 and Unit 3 Review. */
const u3QValue=q=>q.n/q.d;
const u3Factorial=n=>{let value=1;for(let k=2;k<=n;k++)value*=k;return value;};
function u3WorkedSteps(items){
  return '<div class="worked-method"><div class="worked-steps">'+items.map(function(step,index){
    return '<p><strong>Step '+(index+1)+':</strong> '+step+'</p>';
  }).join('')+'</div></div>';
}
function u3WorkedNote(text){
  return text?'<div class="worked-note"><strong>Note:</strong> '+text+'</div>':'';
}

/* 12. Tangent and Secant Line Approximations — exact Part 1, concavity Part 2. */
const U3_APPROX_CHOICES=[
  'Overestimate because the function is concave up on the interval',
  'Overestimate because the function is concave down on the interval',
  'Underestimate because the function is concave up on the interval',
  'Underestimate because the function is concave down on the interval'
];
function u3ApproximationProblem(spec){
  const classification=spec.method==='tangent'
    ?(spec.concavity==='up'?'under':'over')
    :(spec.concavity==='up'?'over':'under');
  const correctChoice=(classification==='over'?'Overestimate':'Underestimate')+
    ' because the function is concave '+spec.concavity+' on the interval';
  const geometricReason=spec.method==='tangent'
    ?'For a concave '+spec.concavity+' function, the tangent line lies '+
      (spec.concavity==='up'?'below':'above')+' the graph. Therefore the tangent-line approximation is an '+classification+'estimate.'
    :'For a concave '+spec.concavity+' function, the secant line lies '+
      (spec.concavity==='up'?'above':'below')+' the graph. Therefore the secant-line approximation is an '+classification+'estimate.';
  return {
    id:spec.id,
    variant:spec.variant,
    answerType:'staged-calculus',
    stagedFamily:'tangent-secant',
    approximationMethod:spec.method,
    concavity:spec.concavity,
    functionFamily:spec.functionFamily||spec.variant,
    secantTargetFraction:spec.secantTargetFraction||null,
    secantTargetIsMidpoint:Boolean(spec.secantTargetIsMidpoint),
    questionHtml:'<div class="u3-staged-question"><div class="question-prompt">'+spec.prompt+'</div><div>\\('+spec.functionTex+'\\)</div></div>',
    stage1:{
      type:'exact',
      prompt:'Part 1: Find the approximation.',
      numericAnswer:spec.answerValue,
      acceptedExpressions:spec.acceptedExpressions||null,
      answerTex:spec.answerTex,
      requireExact:true,
      tolerance:1e-7,
      placeholder:'Enter the exact approximation',
      checkLabel:'Check Part 1',
      keypadMode:'unit3-approximation',
      explainOnCorrect:false,
      correctFeedback:'The exact approximation is correct.',
      incorrectFeedback:'The approximation is not correct.',
      explanation:u3WorkedSteps(spec.approximationSteps)+u3WorkedNote(spec.approximationNote)
    },
    stage2:{
      type:'choice',
      prompt:'Part 2: On the actual interval \\('+spec.intervalTex+'\\), is this an overestimate or underestimate, and why?',
      choices:U3_APPROX_CHOICES,
      correctIndex:U3_APPROX_CHOICES.indexOf(correctChoice),
      answerTex:correctChoice,
      answerIsText:true,
      correctFeedback:'The classification and concavity reason are correct.',
      incorrectFeedback:'That classification or concavity reason is not correct.',
      explanation:u3WorkedSteps([
        'Differentiate again: \\('+spec.secondDerivative+'\\). On \\('+spec.intervalTex+'\\), this is '+(spec.concavity==='up'?'positive':'negative')+', so \\(f\\) is concave '+spec.concavity+'.',
        geometricReason
      ])
    },
    answerTex:spec.answerTex,
    fullWidthChoices:true
  };
}
function u3QInterval(a,b){
  return a.n/a.d<=b.n/b.d?'['+qTex(a)+','+qTex(b)+']':'['+qTex(b)+','+qTex(a)+']';
}
function u3TangentApproximation(){
  const family=pick(['quadratic','cubic','reciprocal','reciprocal-square','radical','logarithm','exponential','sine','cosine']);
  if(family==='quadratic'){
    const A=pick([-3,-2,-1,1,2,3]),B=ri(-5,5),C=ri(-6,6),a=ri(-3,3);
    const h=pick([Q(1,2),Q(-1,2),Q(1,3),Q(-1,3)]),target=qAdd(Q(a),h);
    const fa=A*a*a+B*a+C,slope=2*A*a+B,answer=qAdd(Q(fa),qMul(Q(slope),h));
    return u3ApproximationProblem({
      id:'u3-ts-tq-'+A+'-'+B+'-'+C+'-'+a+'-'+h.n+'-'+h.d,
      variant:'tangent_quadratic',
      method:'tangent',
      concavity:A>0?'up':'down',
      functionTex:'f(x)='+quad(A,B,C),
      prompt:'Use the tangent line to \\(f\\) at \\(x='+a+'\\) to approximate \\(f('+qTex(target)+'\\).',
      intervalTex:u3QInterval(Q(a),target),
      answerValue:u3QValue(answer),
      answerTex:qTex(answer),
      secondDerivative:"f''(x)="+(2*A),
      approximationSteps:[
        'Evaluate the function at the point of tangency: \\(f('+a+')='+fa+'\\).',
        "Differentiate: \\(f'(x)="+lin(2*A,B)+"\\), so \\(f'("+a+')='+slope+'\\).',
        'Write the actual tangent line: \\(L(x)='+u3PointLineTex(Q(fa),Q(slope),Q(a))+'\\).',
        'Evaluate it: \\(L('+qTex(target)+')='+u3PointLineTex(Q(fa),Q(slope),Q(a)).replace(/x/g,qTex(target))+'='+qTex(answer)+'\\).'
      ]
    });
  }
  if(family==='cubic'){
    const A=pick([-2,-1,1,2]),B=ri(-4,4),a=ri(2,4),h=pick([Q(1,2),Q(-1,2)]);
    const target=qAdd(Q(a),h),fa=A*a*a*a+B*a,slope=3*A*a*a+B,answer=qAdd(Q(fa),qMul(Q(slope),h));
    return u3ApproximationProblem({
      id:'u3-ts-tc-'+A+'-'+B+'-'+a+'-'+h.n,
      variant:'tangent_cubic',
      method:'tangent',
      concavity:A>0?'up':'down',
      functionTex:'f(x)='+cubic(A,0,B,0),
      prompt:'Use the tangent line to \\(f\\) at \\(x='+a+'\\) to approximate \\(f('+qTex(target)+'\\).',
      intervalTex:u3QInterval(Q(a),target),
      answerValue:u3QValue(answer),
      answerTex:qTex(answer),
      secondDerivative:"f''(x)="+(6*A)+'x',
      approximationSteps:[
        '\\(f('+a+')='+fa+'\\).',
        "\\(f'(x)="+quad(3*A,0,B)+"\\), so \\(f'("+a+')='+slope+'\\).',
        'Write the actual tangent line: \\(L(x)='+u3PointLineTex(Q(fa),Q(slope),Q(a))+'\\).',
        'Evaluate it: \\(L('+qTex(target)+')='+u3PointLineTex(Q(fa),Q(slope),Q(a)).replace(/x/g,qTex(target))+'='+qTex(answer)+'\\).'
      ]
    });
  }
  if(family==='reciprocal'||family==='reciprocal-square'){
    const power=family==='reciprocal'?1:2,a=ri(2,5),h=pick([Q(1,2),Q(-1,2)]);
    const target=qAdd(Q(a),h),fa=Q(1,a**power),slope=Q(-power,a**(power+1)),answer=qAdd(fa,qMul(slope,h));
    return u3ApproximationProblem({
      id:'u3-ts-tr-'+power+'-'+a+'-'+h.n,
      variant:'tangent_reciprocal_power_'+power,
      method:'tangent',
      concavity:'up',
      functionTex:'f(x)=\\frac{1}{x'+(power===1?'':'^'+power)+'}',
      prompt:'Use the tangent line to \\(f\\) at \\(x='+a+'\\) to approximate \\(f('+qTex(target)+'\\).',
      intervalTex:u3QInterval(Q(a),target),
      answerValue:u3QValue(answer),
      answerTex:qTex(answer),
      secondDerivative:power===1?"f''(x)=\\frac{2}{x^3}":"f''(x)=\\frac{6}{x^4}",
      approximationSteps:[
        '\\(f('+a+')='+qTex(fa)+'\\).',
        "\\(f'(x)=-\\frac{"+power+'}{x^{'+(power+1)+"}}\\), so \\(f'("+a+')='+qTex(slope)+'\\).',
        'Write the actual tangent line: \\(L(x)='+u3PointLineTex(fa,slope,Q(a))+'\\).',
        'Evaluate it: \\(L('+qTex(target)+')='+u3PointLineTex(fa,slope,Q(a)).replace(/x/g,qTex(target))+'='+qTex(answer)+'\\).'
      ]
    });
  }
  if(family==='radical'){
    const r=ri(2,7),a=r*r,h=pick([Q(1),Q(-1)]),target=qAdd(Q(a),h),answer=qAdd(Q(r),Q(h.n,2*r));
    return u3ApproximationProblem({
      id:'u3-ts-root-'+r+'-'+h.n,
      variant:'tangent_square_root',
      method:'tangent',
      concavity:'down',
      functionTex:'f(x)=\\sqrt{x}',
      prompt:'Use the tangent line to \\(f\\) at \\(x='+a+'\\) to approximate \\(f('+qTex(target)+'\\).',
      intervalTex:u3QInterval(Q(a),target),
      answerValue:u3QValue(answer),
      answerTex:qTex(answer),
      secondDerivative:"f''(x)=-\\frac{1}{4x^{3/2}}",
      approximationSteps:[
        '\\(f('+a+')='+r+'\\).',
        "\\(f'(x)=\\frac{1}{2\\sqrt{x}}\\), so \\(f'("+a+')=\\frac{1}{'+(2*r)+'}\\).',
        'Write the actual tangent line: \\(L(x)='+u3PointLineTex(Q(r),Q(1,2*r),Q(a))+'\\).',
        'Evaluate it: \\(L('+qTex(target)+')='+u3PointLineTex(Q(r),Q(1,2*r),Q(a)).replace(/x/g,qTex(target))+'='+qTex(answer)+'\\).'
      ]
    });
  }
  if(family==='logarithm'){
    const h=pick([Q(1,2),Q(-1,2),Q(1,3),Q(-1,3)]),target=qAdd(Q(1),h);
    return u3ApproximationProblem({
      id:'u3-ts-log-'+h.n+'-'+h.d,
      variant:'tangent_logarithm',
      method:'tangent',
      concavity:'down',
      functionTex:'f(x)=\\ln x',
      prompt:'Use the tangent line to \\(f\\) at \\(x=1\\) to approximate \\(f('+qTex(target)+'\\).',
      intervalTex:u3QInterval(Q(1),target),
      answerValue:u3QValue(h),
      answerTex:qTex(h),
      secondDerivative:"f''(x)=-\\frac{1}{x^2}",
      approximationSteps:[
        '\\(f(1)=\\ln 1=0\\).',
        "\\(f'(x)=\\frac1x\\), so \\(f'(1)=1\\).",
        'Write the actual tangent line: \\(L(x)=x-1\\).',
        '\\(L('+qTex(target)+')='+qTex(target)+'-1='+qTex(h)+'\\).'
      ]
    });
  }
  if(family==='exponential'){
    const h=pick([Q(1,2),Q(-1,2),Q(1,3),Q(-1,3)]),answer=qAdd(Q(1),h);
    return u3ApproximationProblem({
      id:'u3-ts-exp-'+h.n+'-'+h.d,
      variant:'tangent_exponential',
      method:'tangent',
      concavity:'up',
      functionTex:'f(x)=e^x',
      prompt:'Use the tangent line to \\(f\\) at \\(x=0\\) to approximate \\(f('+qTex(h)+'\\).',
      intervalTex:u3QInterval(Q(0),h),
      answerValue:u3QValue(answer),
      answerTex:qTex(answer),
      secondDerivative:"f''(x)=e^x",
      approximationSteps:[
        '\\(f(0)=1\\).',
        "\\(f'(x)=e^x\\), so \\(f'(0)=1\\).",
        'Write the actual tangent line: \\(L(x)=1+x\\).',
        '\\(L('+qTex(h)+')=1+'+qTex(h)+'='+qTex(answer)+'\\).'
      ]
    });
  }
  if(family==='sine'){
    const atThird=R()<.5,hSign=R()<.5?-1:1;
    const aTex=atThird?'\\frac{\\pi}{3}':'\\frac{\\pi}{6}',h=hSign*Math.PI/12;
    const fa=atThird?Math.sqrt(3)/2:.5,slope=atThird?.5:Math.sqrt(3)/2,answer=fa+slope*h;
    const targetTex=atThird?'\\frac{'+(hSign>0?5:3)+'\\pi}{12}':'\\frac{'+(hSign>0?3:1)+'\\pi}{12}';
    const answerTex=atThird?'\\frac{\\sqrt3}{2}'+(hSign>0?'+':'-')+'\\frac{\\pi}{24}':'\\frac12'+(hSign>0?'+':'-')+'\\frac{\\pi\\sqrt3}{24}';
    return u3ApproximationProblem({
      id:'u3-ts-sin-'+(atThird?3:6)+'-'+hSign,
      variant:'tangent_sine',
      method:'tangent',
      concavity:'down',
      functionTex:'f(x)=\\sin x',
      prompt:'Use the tangent line to \\(f\\) at \\(x='+aTex+'\\) to approximate \\(f('+targetTex+'\\).',
      intervalTex:hSign>0?'['+aTex+','+targetTex+']':'['+targetTex+','+aTex+']',
      answerValue:answer,
      answerTex,
      secondDerivative:"f''(x)=-\\sin x",
      approximationSteps:[
        '\\(f('+aTex+')='+(atThird?'\\frac{\\sqrt3}{2}':'\\frac12')+'\\).',
        "\\(f'(x)=\\cos x\\), so \\(f'("+aTex+')='+(atThird?'\\frac12':'\\frac{\\sqrt3}{2}')+'\\).',
        'The change in \\(x\\) is \\('+(hSign>0?'':'-')+'\\frac{\\pi}{12}\\), so the tangent-line value is \\('+answerTex+'\\).'
      ]
    });
  }
  const hSign=R()<.5?-1:1,h=hSign*Math.PI/12,answer=.5-Math.sqrt(3)*h/2;
  const targetTex='\\frac{'+(hSign>0?5:3)+'\\pi}{12}',answerTex='\\frac12'+(hSign>0?'-':'+')+'\\frac{\\pi\\sqrt3}{24}';
  return u3ApproximationProblem({
    id:'u3-ts-cos-'+hSign,
    variant:'tangent_cosine',
    method:'tangent',
    concavity:'down',
    functionTex:'f(x)=\\cos x',
    prompt:'Use the tangent line to \\(f\\) at \\(x=\\frac{\\pi}{3}\\) to approximate \\(f('+targetTex+'\\).',
    intervalTex:hSign>0?'[\\frac{\\pi}{3},'+targetTex+']':'['+targetTex+',\\frac{\\pi}{3}]',
    answerValue:answer,
    answerTex,
    secondDerivative:"f''(x)=-\\cos x",
    approximationSteps:[
      '\\(f(\\frac{\\pi}{3})=\\frac12\\).',
      "\\(f'(x)=-\\sin x\\), so \\(f'(\\frac{\\pi}{3})=-\\frac{\\sqrt3}{2}\\).",
      'The change in \\(x\\) is \\('+(hSign>0?'':'-')+'\\frac{\\pi}{12}\\), so the tangent-line value is \\('+answerTex+'\\).'
    ]
  });
}
function u3SecantApproximation(){
  const family=pick(['quadratic','cubic','radical','negative-radical','reciprocal','logarithm','exponential','sine']);
  if(family==='quadratic'||family==='cubic'){
    const A=pick([-3,-2,-1,1,2,3]),B=ri(-4,4),C=ri(-5,5),left=family==='cubic'?ri(1,2):ri(-3,1),right=left+pick([2,4]);
    const target=Q(left+right,2),value=family==='cubic'?x=>A*x**3+B*x+C:x=>A*x*x+B*x+C;
    const fl=value(left),fr=value(right),answer=Q(fl+fr,2);
    return u3ApproximationProblem({
      id:'u3-ts-s'+family+'-'+A+'-'+B+'-'+C+'-'+left+'-'+right,
      variant:'secant_'+family,
      method:'secant',
      concavity:A>0?'up':'down',
      functionTex:'f(x)='+(family==='cubic'?cubic(A,0,B,C):quad(A,B,C)),
      prompt:'Use the secant line through \\(x='+left+'\\) and \\(x='+right+'\\) to approximate \\(f('+qTex(target)+'\\).',
      intervalTex:'['+left+','+right+']',
      answerValue:u3QValue(answer),
      answerTex:qTex(answer),
      secondDerivative:family==='cubic'?"f''(x)="+(6*A)+'x':"f''(x)="+(2*A),
      approximationSteps:[
        'Evaluate the endpoints: \\(f('+left+')='+fl+'\\) and \\(f('+right+')='+fr+'\\).',
        'The target is the midpoint, so its secant-line value is the average of the endpoint values.',
        '\\(S('+qTex(target)+')=\\frac{'+fl+(fr<0?'':'+')+fr+'}{2}='+qTex(answer)+'\\).'
      ]
    });
  }
  if(family==='radical'||family==='negative-radical'){
    const p=ri(1,4),q=p+pick([1,2,3]),left=p*p,right=q*q,target=Q(left+right,2),sign=family==='radical'?1:-1,answer=Q(sign*(p+q),2);
    return u3ApproximationProblem({
      id:'u3-ts-sroot-'+sign+'-'+p+'-'+q,
      variant:sign>0?'secant_square_root':'secant_negative_square_root',
      method:'secant',
      concavity:sign>0?'down':'up',
      functionTex:'f(x)='+(sign<0?'-':'')+'\\sqrt{x}',
      prompt:'Use the secant line through \\(x='+left+'\\) and \\(x='+right+'\\) to approximate \\(f('+qTex(target)+'\\).',
      intervalTex:'['+left+','+right+']',
      answerValue:u3QValue(answer),
      answerTex:qTex(answer),
      secondDerivative:"f''(x)="+(sign>0?'-':'')+'\\frac{1}{4x^{3/2}}',
      approximationSteps:[
        'The endpoint values are \\(f('+left+')='+(sign*p)+'\\) and \\(f('+right+')='+(sign*q)+'\\).',
        'The target is the midpoint, so average the two endpoint values.',
        '\\(S('+qTex(target)+')=\\frac{'+(sign*p)+(sign*q<0?'':'+')+(sign*q)+'}{2}='+qTex(answer)+'\\).'
      ]
    });
  }
  if(family==='reciprocal'){
    const left=ri(1,3),right=left+pick([1,2]),target=Q(left+right,2),answer=Q(left+right,2*left*right);
    return u3ApproximationProblem({
      id:'u3-ts-srec-'+left+'-'+right,
      variant:'secant_reciprocal',
      method:'secant',
      concavity:'up',
      functionTex:'f(x)=\\frac1x',
      prompt:'Use the secant line through \\(x='+left+'\\) and \\(x='+right+'\\) to approximate \\(f('+qTex(target)+'\\).',
      intervalTex:'['+left+','+right+']',
      answerValue:u3QValue(answer),
      answerTex:qTex(answer),
      secondDerivative:"f''(x)=\\frac{2}{x^3}",
      approximationSteps:[
        '\\(f('+left+')=\\frac1{'+left+'}\\) and \\(f('+right+')=\\frac1{'+right+'}\\).',
        'The target is the midpoint, so average the endpoint values.',
        '\\(S('+qTex(target)+')=\\frac12\\left(\\frac1{'+left+'}+\\frac1{'+right+'}\\right)='+qTex(answer)+'\\).'
      ]
    });
  }
  if(family==='logarithm')return u3ApproximationProblem({
    id:'u3-ts-slog',variant:'secant_logarithm',method:'secant',concavity:'down',
    functionTex:'f(x)=\\ln x',
    prompt:'Use the secant line through \\(x=1\\) and \\(x=e^2\\) to approximate \\(f\\left(\\frac{1+e^2}{2}\\right)\\).',
    intervalTex:'[1,e^2]',answerValue:1,answerTex:'1',secondDerivative:"f''(x)=-\\frac1{x^2}",
    approximationSteps:['\\(f(1)=0\\) and \\(f(e^2)=2\\).','The target is the midpoint of the interval.','\\(S\\left(\\frac{1+e^2}{2}\\right)=\\frac{0+2}{2}=1\\).']
  });
  if(family==='exponential')return u3ApproximationProblem({
    id:'u3-ts-sexp',variant:'secant_exponential',method:'secant',concavity:'up',
    functionTex:'f(x)=e^x',
    prompt:'Use the secant line through \\(x=0\\) and \\(x=\\ln 4\\) to approximate \\(f(\\ln 2)\\).',
    intervalTex:'[0,\\ln 4]',answerValue:2.5,answerTex:'\\frac52',secondDerivative:"f''(x)=e^x",
    approximationSteps:['\\(f(0)=1\\) and \\(f(\\ln 4)=4\\).','Because \\(\\ln 2\\) is the midpoint, average the endpoint values.','\\(S(\\ln 2)=\\frac{1+4}{2}=\\frac52\\).']
  });
  return u3ApproximationProblem({
    id:'u3-ts-ssin',variant:'secant_sine',method:'secant',concavity:'down',
    functionTex:'f(x)=\\sin x',
    prompt:'Use the secant line through \\(x=0\\) and \\(x=\\frac{\\pi}{2}\\) to approximate \\(f\\left(\\frac{\\pi}{4}\\right)\\).',
    intervalTex:'[0,\\frac{\\pi}{2}]',answerValue:.5,answerTex:'\\frac12',secondDerivative:"f''(x)=-\\sin x",
    approximationSteps:['\\(f(0)=0\\) and \\(f(\\frac{\\pi}{2})=1\\).','The target \\(\\frac{\\pi}{4}\\) is the midpoint.','\\(S\\left(\\frac{\\pi}{4}\\right)=\\frac{0+1}{2}=\\frac12\\).']
  });
}
U3['tangent-and-secant-line-approximations']=function(){
  const source=R()<.15?'test':'assignment';
  const problem=(R()<.5?u3TangentApproximation:u3SecantApproximation)();
  return stamp(problem,'tangent-and-secant-line-approximations','noncalculator',source,problem.variant);
};

/* Version 12.2: reduced arguments, varied secant targets, and full line work. */
function u3PiTex(q){
  q=Q(q.n,q.d);if(!q.n)return'0';
  const sign=q.n<0?'-':'',n=Math.abs(q.n),numerator=n===1?'\\pi':n+'\\pi';
  return sign+(q.d===1?numerator:'\\frac{'+numerator+'}{'+q.d+'}');
}
function u3SignedAtom(coefficient,atom){
  coefficient=Q(coefficient.n,coefficient.d);if(!coefficient.n)return'';
  const sign=coefficient.n<0?'-':'+';const magnitude=Q(Math.abs(coefficient.n),coefficient.d);
  return sign+(magnitude.n===magnitude.d?'':qTex(magnitude))+atom;
}
function u3XShiftTex(a){
  a=Q(a.n,a.d);if(!a.n)return'x';
  return a.n>0?'x-'+qTex(a):'x+'+qTex(Q(-a.n,a.d));
}
function u3PointLineTex(y,m,a){
  y=Q(y.n,y.d);m=Q(m.n,m.d);const body='\\left('+u3XShiftTex(a)+'\\right)';
  let out=y.n?qTex(y):'';
  if(m.n){
    const sign=m.n<0?'-':'+';const magnitude=Q(Math.abs(m.n),m.d);const term=(magnitude.n===magnitude.d?'':qTex(magnitude))+body;
    out+=out?(sign+term):(sign==='-'?'-'+term:term);
  }
  return out||'0';
}
function u3SecantTargetFraction(){return pick([Q(1,4),Q(1,3),Q(2,5),Q(1,2),Q(3,5),Q(2,3),Q(3,4)]);}
function u3MidpointNote(t){return t&&t.n*2===t.d?'Because the requested x-value is the midpoint of the interval, the secant-line value is also the average of the two endpoint function values.':'';}
function u3SecantQProblem(spec){
  const t=spec.t||u3SecantTargetFraction(),dx=qSub(spec.b,spec.a),dy=qSub(spec.fb,spec.fa),slope=qDiv(dy,dx);
  const target=qAdd(spec.a,qMul(t,dx)),delta=qSub(target,spec.a),answer=qAdd(spec.fa,qMul(slope,delta));
  const aTex=qTex(spec.a),bTex=qTex(spec.b),targetTex=qTex(target),lineTex=u3PointLineTex(spec.fa,slope,spec.a);
  const steps=[
    'Evaluate the endpoint values: \\(f('+aTex+')='+qTex(spec.fa)+'\\) and \\(f('+bTex+')='+qTex(spec.fb)+'\\).',
    'Find the secant slope: \\(m_{\\text{sec}}=\\frac{f('+bTex+')-f('+aTex+')}{'+bTex+'-'+aTex+'}=\\frac{'+qTex(dy)+'}{'+qTex(dx)+'}='+qTex(slope)+'\\).',
    'Use the left endpoint to write the actual secant line: \\(S(x)='+lineTex+'\\).',
    'Evaluate the line at the requested input: \\(S('+targetTex+')='+lineTex.replace(/x/g,targetTex)+'='+qTex(answer)+'\\).'
  ];
  const note=u3MidpointNote(t);
  return u3ApproximationProblem({
    id:spec.id+'-'+t.n+'-'+t.d,variant:spec.variant,functionFamily:spec.functionFamily||spec.variant,method:'secant',concavity:spec.concavity,
    functionTex:spec.functionTex,
    prompt:'Use the secant line through \\(x='+aTex+'\\) and \\(x='+bTex+'\\) to approximate \\(f\\left('+targetTex+'\\right)\\).',
    intervalTex:'['+aTex+','+bTex+']',answerValue:u3QValue(answer),answerTex:qTex(answer),secondDerivative:spec.secondDerivative,
    approximationSteps:steps,approximationNote:note,secantTargetFraction:t,secantTargetIsMidpoint:t.n*2===t.d
  });
}
function u3SecantSymbolicProblem(spec){
  const steps=[
    'Evaluate the endpoint values: \\(f('+spec.aTex+')='+spec.faTex+'\\) and \\(f('+spec.bTex+')='+spec.fbTex+'\\).',
    'Find the secant slope: \\(m_{\\text{sec}}=\\frac{f('+spec.bTex+')-f('+spec.aTex+')}{'+spec.bTex+'-'+spec.aTex+'}='+spec.slopeWorkTex+'='+spec.slopeTex+'\\).',
    'Use the left endpoint to write the actual secant line: \\(S(x)='+spec.lineTex+'\\).',
    'Evaluate the line at the requested input: \\(S('+spec.targetTex+')='+spec.evaluationTex+'='+spec.answerTex+'\\).'
  ];
  const midpoint=spec.secantTargetIsMidpoint===undefined?Boolean(spec.t&&spec.t.n*2===spec.t.d):Boolean(spec.secantTargetIsMidpoint);
  const note=midpoint?'Because the requested x-value is the midpoint of the interval, the secant-line value is also the average of the two endpoint function values.':'';
  const targetId=spec.targetId||(spec.t?spec.t.n+'-'+spec.t.d:'clean-target');
  return u3ApproximationProblem({
    id:spec.id+'-'+targetId,variant:spec.variant,functionFamily:spec.functionFamily||spec.variant,method:'secant',concavity:spec.concavity,
    functionTex:spec.functionTex,prompt:'Use the secant line through \\(x='+spec.aTex+'\\) and \\(x='+spec.bTex+'\\) to approximate \\(f\\left('+spec.targetTex+'\\right)\\).',
    intervalTex:'['+spec.aTex+','+spec.bTex+']',answerValue:spec.answerValue,answerTex:spec.answerTex,secondDerivative:spec.secondDerivative,
    acceptedExpressions:spec.acceptedExpressions||null,approximationSteps:steps,approximationNote:note,secantTargetFraction:spec.t||null,secantTargetIsMidpoint:midpoint
  });
}
function u3RepairOldTangent(problem){
  const text=String(problem.questionHtml||''),start=text.indexOf('approximate '),close=text.indexOf('\\).',start);
  problem.questionHtml=start>=0&&close>=0&&text[close-1]!==')'?text.slice(0,close)+')'+text.slice(close):text;
  problem.functionFamily=problem.variant;return problem;
}
function u3TangentCompositionV122(){
  const family=pick(['log-composition','sine-composition','cosine-composition','arctangent','arcsine-composition','rational-linear','scaled-reciprocal-composition','product-exponential','product-logarithm','exponential-composition','radical-composition']);
  const sign=R()<.5?-1:1,h=Q(sign,4),target=qAdd(Q(1),h);
  if(family==='log-composition'){
    const delta=Q(3*sign,8),answerTex='\\ln2'+u3SignedAtom(delta,'');
    return u3ApproximationProblem({id:'u3-ts-t-logcomp-'+sign,variant:'tangent_log_composition',functionFamily:'logarithmic composition',method:'tangent',concavity:'down',functionTex:'f(x)=\\ln(x^2+x)',
      prompt:'Use the tangent line to \\(f\\) at \\(x=1\\) to approximate \\(f\\left('+qTex(target)+'\\right)\\).',intervalTex:u3QInterval(Q(1),target),answerValue:Math.log(2)+u3QValue(delta),answerTex,secondDerivative:"f''(x)=-\\frac{2x^2+2x+1}{(x^2+x)^2}",
      approximationSteps:['Evaluate \\(f(1)=\\ln2\\).',"Differentiate: \\(f'(x)=\\frac{2x+1}{x^2+x}\\), so \\(f'(1)=\\frac32\\).",'Write the actual tangent line: \\(L(x)=\\ln2+\\frac32(x-1)\\).','Evaluate it: \\(L('+qTex(target)+')=\\ln2+\\frac32\\left('+qTex(h)+'\\right)='+answerTex+'\\).']});
  }
  if(family==='sine-composition'){
    const hPi=Q(sign,24),aPi=Q(1,6),targetPi=qAdd(aPi,hPi),answerTex='\\frac{\\sqrt3}{2}'+(sign>0?'+':'-')+'\\frac{\\pi}{24}';
    return u3ApproximationProblem({id:'u3-ts-t-sin2-'+sign,variant:'tangent_sine_composition',functionFamily:'trigonometric composition',method:'tangent',concavity:'down',functionTex:'f(x)=\\sin(2x)',
      prompt:'Use the tangent line to \\(f\\) at \\(x='+u3PiTex(aPi)+'\\) to approximate \\(f\\left('+u3PiTex(targetPi)+'\\right)\\).',intervalTex:'['+(sign>0?u3PiTex(aPi)+','+u3PiTex(targetPi):u3PiTex(targetPi)+','+u3PiTex(aPi))+']',answerValue:Math.sqrt(3)/2+sign*Math.PI/24,answerTex,secondDerivative:"f''(x)=-4\\sin(2x)",
      approximationSteps:['Evaluate \\(f(\\frac{\\pi}{6})=\\sin(\\frac{\\pi}{3})=\\frac{\\sqrt3}{2}\\).',"Differentiate: \\(f'(x)=2\\cos(2x)\\), so \\(f'(\\frac{\\pi}{6})=1\\).",'Write \\(L(x)=\\frac{\\sqrt3}{2}+\\left(x-\\frac{\\pi}{6}\\right)\\).','Evaluate: \\(L('+u3PiTex(targetPi)+')='+answerTex+'\\).']});
  }
  if(family==='cosine-composition'){
    const hPi=Q(sign,36),aPi=Q(1,9),targetPi=qAdd(aPi,hPi),answerTex='\\frac12'+(sign>0?'-':'+')+'\\frac{\\pi\\sqrt3}{24}';
    return u3ApproximationProblem({id:'u3-ts-t-cos3-'+sign,variant:'tangent_cosine_composition',functionFamily:'trigonometric composition',method:'tangent',concavity:'down',functionTex:'f(x)=\\cos(3x)',
      prompt:'Use the tangent line to \\(f\\) at \\(x='+u3PiTex(aPi)+'\\) to approximate \\(f\\left('+u3PiTex(targetPi)+'\\right)\\).',intervalTex:'['+(sign>0?u3PiTex(aPi)+','+u3PiTex(targetPi):u3PiTex(targetPi)+','+u3PiTex(aPi))+']',answerValue:.5-sign*Math.PI*Math.sqrt(3)/24,answerTex,secondDerivative:"f''(x)=-9\\cos(3x)",
      approximationSteps:['Evaluate \\(f(\\frac{\\pi}{9})=\\cos(\\frac{\\pi}{3})=\\frac12\\).',"Differentiate: \\(f'(x)=-3\\sin(3x)\\), so \\(f'(\\frac{\\pi}{9})=-\\frac{3\\sqrt3}{2}\\).",'Write \\(L(x)=\\frac12-\\frac{3\\sqrt3}{2}\\left(x-\\frac{\\pi}{9}\\right)\\).','Evaluate: \\(L('+u3PiTex(targetPi)+')='+answerTex+'\\).']});
  }
  if(family==='arctangent'){
    const answerTex='\\frac{\\pi}{4}'+(sign>0?'+':'-')+'\\frac18';
    return u3ApproximationProblem({id:'u3-ts-t-atan-'+sign,variant:'tangent_inverse_tangent',functionFamily:'inverse trigonometric',method:'tangent',concavity:'down',functionTex:'f(x)=\\tan^{-1}x',prompt:'Use the tangent line to \\(f\\) at \\(x=1\\) to approximate \\(f\\left('+qTex(target)+'\\right)\\).',intervalTex:u3QInterval(Q(1),target),answerValue:Math.PI/4+sign/8,answerTex,secondDerivative:"f''(x)=-\\frac{2x}{(1+x^2)^2}",
      approximationSteps:['Evaluate \\(f(1)=\\tan^{-1}(1)=\\frac{\\pi}{4}\\).',"Differentiate: \\(f'(x)=\\frac1{1+x^2}\\), so \\(f'(1)=\\frac12\\).",'Write \\(L(x)=\\frac{\\pi}{4}+\\frac12(x-1)\\).','Evaluate: \\(L('+qTex(target)+')='+answerTex+'\\).']});
  }
  if(family==='arcsine-composition'){
    const answerTex='\\frac{\\pi}{6}'+(sign>0?'+':'-')+'\\frac{\\sqrt3}{12}';
    return u3ApproximationProblem({id:'u3-ts-t-asin-'+sign,variant:'tangent_inverse_sine_composition',functionFamily:'inverse trigonometric composition',method:'tangent',concavity:'up',functionTex:'f(x)=\\sin^{-1}(x/2)',prompt:'Use the tangent line to \\(f\\) at \\(x=1\\) to approximate \\(f\\left('+qTex(target)+'\\right)\\).',intervalTex:u3QInterval(Q(1),target),answerValue:Math.PI/6+sign*Math.sqrt(3)/12,answerTex,secondDerivative:"f''(x)=\\frac{x}{8(1-x^2/4)^{3/2}}",
      approximationSteps:['Evaluate \\(f(1)=\\sin^{-1}(\\frac12)=\\frac{\\pi}{6}\\).',"Differentiate: \\(f'(x)=\\frac1{2\\sqrt{1-x^2/4}}\\), so \\(f'(1)=\\frac{\\sqrt3}{3}\\).",'Write \\(L(x)=\\frac{\\pi}{6}+\\frac{\\sqrt3}{3}(x-1)\\).','Evaluate: \\(L('+qTex(target)+')='+answerTex+'\\).']});
  }
  if(family==='rational-linear'){
    const localH=Q(sign,4),localTarget=localH,answer=Q(8+sign,16);
    return u3ApproximationProblem({id:'u3-ts-t-ratlin-'+sign,variant:'tangent_rational_linear',functionFamily:'rational',method:'tangent',concavity:'down',functionTex:'f(x)=\\frac{x+1}{x+2}',prompt:'Use the tangent line to \\(f\\) at \\(x=0\\) to approximate \\(f\\left('+qTex(localTarget)+'\\right)\\).',intervalTex:u3QInterval(Q(0),localTarget),answerValue:u3QValue(answer),answerTex:qTex(answer),secondDerivative:"f''(x)=-\\frac{2}{(x+2)^3}",
      approximationSteps:['Evaluate \\(f(0)=\\frac12\\).',"Differentiate: \\(f'(x)=\\frac1{(x+2)^2}\\), so \\(f'(0)=\\frac14\\).",'Write \\(L(x)=\\frac12+\\frac14x\\).','Evaluate: \\(L('+qTex(localTarget)+')='+qTex(answer)+'\\).']});
  }
  if(family==='scaled-reciprocal-composition'){
    const answer=Q(12-3*sign,8),answerTex=qTex(answer);
    return u3ApproximationProblem({id:'u3-ts-t-scaledrec-'+sign,variant:'tangent_scaled_reciprocal_composition',functionFamily:'constant over a function',method:'tangent',concavity:'up',functionTex:'f(x)=\\frac3{x^2+1}',prompt:'Use the tangent line to \\(f\\) at \\(x=1\\) to approximate \\(f\\left('+qTex(target)+'\\right)\\).',intervalTex:u3QInterval(Q(1),target),answerValue:u3QValue(answer),answerTex,secondDerivative:"f''(x)=\\frac{3(6x^2-2)}{(x^2+1)^3}",
      approximationSteps:['Evaluate \\(f(1)=\\frac32\\).',"Differentiate: \\(f'(x)=-\\frac{6x}{(x^2+1)^2}\\), so \\(f'(1)=-\\frac32\\).",'Write \\(L(x)=\\frac32-\\frac32(x-1)\\).','Evaluate: \\(L('+qTex(target)+')='+answerTex+'\\).']});
  }
  if(family==='product-exponential'){
    const localH=Q(sign,3);
    return u3ApproximationProblem({id:'u3-ts-t-xexp-'+sign,variant:'tangent_product_exponential',functionFamily:'product with exponential',method:'tangent',concavity:'up',functionTex:'f(x)=xe^x',prompt:'Use the tangent line to \\(f\\) at \\(x=0\\) to approximate \\(f\\left('+qTex(localH)+'\\right)\\).',intervalTex:u3QInterval(Q(0),localH),answerValue:u3QValue(localH),answerTex:qTex(localH),secondDerivative:"f''(x)=e^x(x+2)",
      approximationSteps:['Evaluate \\(f(0)=0\\).',"Use the product rule: \\(f'(x)=e^x(x+1)\\), so \\(f'(0)=1\\).",'Write the tangent line \\(L(x)=x\\).','Evaluate: \\(L('+qTex(localH)+')='+qTex(localH)+'\\).']});
  }
  if(family==='product-logarithm'){
    return u3ApproximationProblem({id:'u3-ts-t-xlog-'+sign,variant:'tangent_product_logarithm',functionFamily:'product with logarithm',method:'tangent',concavity:'up',functionTex:'f(x)=x\\ln x',prompt:'Use the tangent line to \\(f\\) at \\(x=1\\) to approximate \\(f\\left('+qTex(target)+'\\right)\\).',intervalTex:u3QInterval(Q(1),target),answerValue:u3QValue(h),answerTex:qTex(h),secondDerivative:"f''(x)=\\frac1x",
      approximationSteps:['Evaluate \\(f(1)=0\\).',"Use the product rule: \\(f'(x)=\\ln x+1\\), so \\(f'(1)=1\\).",'Write \\(L(x)=x-1\\).','Evaluate: \\(L('+qTex(target)+')='+qTex(h)+'\\).']});
  }
  if(family==='exponential-composition'){
    const multiplier=Q(2+sign,2),answerTex=(multiplier.n===multiplier.d?'':qTex(multiplier))+'e';
    return u3ApproximationProblem({id:'u3-ts-t-expx2-'+sign,variant:'tangent_exponential_composition',functionFamily:'exponential composition',method:'tangent',concavity:'up',functionTex:'f(x)=e^{x^2}',prompt:'Use the tangent line to \\(f\\) at \\(x=1\\) to approximate \\(f\\left('+qTex(target)+'\\right)\\).',intervalTex:u3QInterval(Q(1),target),answerValue:u3QValue(multiplier)*Math.E,answerTex,secondDerivative:"f''(x)=2e^{x^2}(1+2x^2)",
      approximationSteps:['Evaluate \\(f(1)=e\\).',"Differentiate with the chain rule: \\(f'(x)=2xe^{x^2}\\), so \\(f'(1)=2e\\).",'Write \\(L(x)=e+2e(x-1)\\).','Evaluate: \\(L('+qTex(target)+')='+answerTex+'\\).']});
  }
  const answer=Q(16+sign,8);
  return u3ApproximationProblem({id:'u3-ts-t-rootcomp-'+sign,variant:'tangent_radical_composition',functionFamily:'radical composition',method:'tangent',concavity:'up',functionTex:'f(x)=\\sqrt{x^2+3}',prompt:'Use the tangent line to \\(f\\) at \\(x=1\\) to approximate \\(f\\left('+qTex(target)+'\\right)\\).',intervalTex:u3QInterval(Q(1),target),answerValue:u3QValue(answer),answerTex:qTex(answer),secondDerivative:"f''(x)=\\frac3{(x^2+3)^{3/2}}",
    approximationSteps:['Evaluate \\(f(1)=2\\).',"Differentiate: \\(f'(x)=\\frac{x}{\\sqrt{x^2+3}}\\), so \\(f'(1)=\\frac12\\).",'Write \\(L(x)=2+\\frac12(x-1)\\).','Evaluate: \\(L('+qTex(target)+')='+qTex(answer)+'\\).']});
}
function u3TangentApproximationV122(){
  if(R()<.62)return u3TangentCompositionV122();
  let problem;do{problem=u3TangentApproximation();}while(['tangent_sine','tangent_cosine'].includes(problem.variant));
  return u3RepairOldTangent(problem);
}
function u3SecantApproximationV122(){
  const family=pick(['quadratic','cubic','square-root','negative-square-root','reciprocal','shifted-radical','rational-linear','scaled-reciprocal-composition','log-composition','sine-composition','arctangent','arcsine-composition','exponential-composition','product-exponential','product-logarithm']);
  const t=u3SecantTargetFraction();
  if(family==='quadratic'||family==='cubic'){
    const A=pick([-3,-2,-1,1,2,3]),B=ri(-4,4),C=ri(-5,5),a=Q(family==='cubic'?ri(1,2):ri(-3,1)),b=qAdd(a,Q(pick([2,3,4]))),value=family==='cubic'?x=>A*x**3+B*x+C:x=>A*x*x+B*x+C;
    return u3SecantQProblem({id:'u3-ts-v122-s'+family+'-'+A+'-'+B+'-'+C+'-'+a.n+'-'+b.n,variant:'secant_'+family,functionFamily:family,concavity:A>0?'up':'down',functionTex:'f(x)='+(family==='cubic'?cubic(A,0,B,C):quad(A,B,C)),a,b,fa:Q(value(u3QValue(a))),fb:Q(value(u3QValue(b))),secondDerivative:family==='cubic'?"f''(x)="+(6*A)+'x':"f''(x)="+(2*A),t});
  }
  if(family==='square-root'||family==='negative-square-root'){
    const p=ri(1,4),q=p+pick([1,2,3]),sign=family==='square-root'?1:-1;
    return u3SecantQProblem({id:'u3-ts-v122-root-'+sign+'-'+p+'-'+q,variant:sign>0?'secant_square_root':'secant_negative_square_root',functionFamily:'radical',concavity:sign>0?'down':'up',functionTex:'f(x)='+(sign<0?'-':'')+'\\sqrt{x}',a:Q(p*p),b:Q(q*q),fa:Q(sign*p),fb:Q(sign*q),secondDerivative:"f''(x)="+(sign>0?'-':'')+'\\frac1{4x^{3/2}}',t});
  }
  if(family==='reciprocal'){
    const a=ri(1,3),b=a+pick([1,2]);
    return u3SecantQProblem({id:'u3-ts-v122-recip-'+a+'-'+b,variant:'secant_reciprocal',functionFamily:'reciprocal',concavity:'up',functionTex:'f(x)=\\frac1x',a:Q(a),b:Q(b),fa:Q(1,a),fb:Q(1,b),secondDerivative:"f''(x)=\\frac2{x^3}",t});
  }
  if(family==='shifted-radical')return u3SecantQProblem({id:'u3-ts-v122-shift-root',variant:'secant_shifted_radical',functionFamily:'radical composition',concavity:'down',functionTex:'f(x)=\\sqrt{x+1}',a:Q(0),b:Q(3),fa:Q(1),fb:Q(2),secondDerivative:"f''(x)=-\\frac1{4(x+1)^{3/2}}",t});
  if(family==='rational-linear')return u3SecantQProblem({id:'u3-ts-v122-ratlin',variant:'secant_rational_linear',functionFamily:'rational',concavity:'down',functionTex:'f(x)=\\frac{x+1}{x+2}',a:Q(0),b:Q(2),fa:Q(1,2),fb:Q(3,4),secondDerivative:"f''(x)=-\\frac2{(x+2)^3}",t});
  if(family==='scaled-reciprocal-composition')return u3SecantQProblem({id:'u3-ts-v122-scaled-rec',variant:'secant_scaled_reciprocal_composition',functionFamily:'constant over a function',concavity:'up',functionTex:'f(x)=\\frac3{x^2+1}',a:Q(1),b:Q(2),fa:Q(3,2),fb:Q(3,5),secondDerivative:"f''(x)=\\frac{3(6x^2-2)}{(x^2+1)^3}",t});
  if(family==='log-composition'){
    const target=qAdd(Q(1),t),answerTex='\\ln2'+u3SignedAtom(t,'\\ln3');
    return u3SecantSymbolicProblem({id:'u3-ts-v122-logcomp',variant:'secant_log_composition',functionFamily:'logarithmic composition',concavity:'down',functionTex:'f(x)=\\ln(x^2+x)',aTex:'1',bTex:'2',faTex:'\\ln2',fbTex:'\\ln6',targetTex:qTex(target),slopeWorkTex:'\\frac{\\ln6-\\ln2}{1}',slopeTex:'\\ln3',lineTex:'\\ln2+\\ln3(x-1)',evaluationTex:'\\ln2+\\ln3\\left('+qTex(t)+'\\right)',answerValue:Math.log(2)+u3QValue(t)*Math.log(3),answerTex,acceptedExpressions:['ln(2)+('+qPlain(t)+')*ln(3)'],secondDerivative:"f''(x)=-\\frac{2x^2+2x+1}{(x^2+x)^2}",t});
  }
  if(family==='sine-composition'){
    const targetPi=Q(t.n,4*t.d);
    return u3SecantSymbolicProblem({id:'u3-ts-v122-sin2',variant:'secant_sine_composition',functionFamily:'trigonometric composition',concavity:'down',functionTex:'f(x)=\\sin(2x)',aTex:'0',bTex:'\\frac{\\pi}{4}',faTex:'0',fbTex:'1',targetTex:u3PiTex(targetPi),slopeWorkTex:'\\frac{1-0}{\\frac{\\pi}{4}}',slopeTex:'\\frac4\\pi',lineTex:'\\frac4\\pi x',evaluationTex:'\\frac4\\pi\\left('+u3PiTex(targetPi)+'\\right)',answerValue:u3QValue(t),answerTex:qTex(t),secondDerivative:"f''(x)=-4\\sin(2x)",t});
  }
  if(family==='arctangent'){
    const answerPi=Q(t.n,4*t.d);
    return u3SecantSymbolicProblem({id:'u3-ts-v122-atan',variant:'secant_inverse_tangent',functionFamily:'inverse trigonometric',concavity:'down',functionTex:'f(x)=\\tan^{-1}x',aTex:'0',bTex:'1',faTex:'0',fbTex:'\\frac{\\pi}{4}',targetTex:qTex(t),slopeWorkTex:'\\frac{\\frac{\\pi}{4}-0}{1}',slopeTex:'\\frac{\\pi}{4}',lineTex:'\\frac{\\pi}{4}x',evaluationTex:'\\frac{\\pi}{4}\\left('+qTex(t)+'\\right)',answerValue:u3QValue(answerPi)*Math.PI,answerTex:u3PiTex(answerPi),secondDerivative:"f''(x)=-\\frac{2x}{(1+x^2)^2}",t});
  }
  if(family==='arcsine-composition'){
    const target=Q(t.n,2*t.d),answerPi=Q(t.n,6*t.d);
    return u3SecantSymbolicProblem({id:'u3-ts-v122-asin',variant:'secant_inverse_sine',functionFamily:'inverse trigonometric',concavity:'up',functionTex:'f(x)=\\sin^{-1}x',aTex:'0',bTex:'\\frac12',faTex:'0',fbTex:'\\frac{\\pi}{6}',targetTex:qTex(target),slopeWorkTex:'\\frac{\\frac{\\pi}{6}}{\\frac12}',slopeTex:'\\frac{\\pi}{3}',lineTex:'\\frac{\\pi}{3}x',evaluationTex:'\\frac{\\pi}{3}\\left('+qTex(target)+'\\right)',answerValue:u3QValue(answerPi)*Math.PI,answerTex:u3PiTex(answerPi),secondDerivative:"f''(x)=\\frac{x}{(1-x^2)^{3/2}}",t});
  }
  if(family==='exponential-composition'){
    const targetTex=u3SignedAtom(Q(t.n,2*t.d),'\\ln2').replace(/^\+/,'');const answer=qAdd(Q(1),t);
    return u3SecantSymbolicProblem({id:'u3-ts-v122-exp2',variant:'secant_exponential_composition',functionFamily:'exponential composition',concavity:'up',functionTex:'f(x)=e^{2x}',aTex:'0',bTex:'\\frac{\\ln2}{2}',faTex:'1',fbTex:'2',targetTex,slopeWorkTex:'\\frac{2-1}{\\frac{\\ln2}{2}}',slopeTex:'\\frac2{\\ln2}',lineTex:'1+\\frac2{\\ln2}x',evaluationTex:'1+\\frac2{\\ln2}\\left('+targetTex+'\\right)',answerValue:u3QValue(answer),answerTex:qTex(answer),secondDerivative:"f''(x)=4e^{2x}",t});
  }
  if(family==='product-exponential'){
    const targetTex=u3SignedAtom(t,'\\ln2').replace(/^\+/,'');const coefficient=qMul(Q(2),t),answerTex=u3SignedAtom(coefficient,'\\ln2').replace(/^\+/,'');
    return u3SecantSymbolicProblem({id:'u3-ts-v122-xexp',variant:'secant_product_exponential',functionFamily:'product with exponential',concavity:'up',functionTex:'f(x)=xe^x',aTex:'0',bTex:'\\ln2',faTex:'0',fbTex:'2\\ln2',targetTex,slopeWorkTex:'\\frac{2\\ln2}{\\ln2}',slopeTex:'2',lineTex:'2x',evaluationTex:'2\\left('+targetTex+'\\right)',answerValue:2*u3QValue(t)*Math.log(2),answerTex,secondDerivative:"f''(x)=e^x(x+2)",t});
  }
  return u3SecantSymbolicProblem({id:'u3-ts-v124-xlog',targetId:'x-2',variant:'secant_product_logarithm',functionFamily:'product with logarithm',concavity:'up',functionTex:'f(x)=x\\ln x',aTex:'1',bTex:'e',faTex:'0',fbTex:'e',targetTex:'2',slopeWorkTex:'\\frac{e-0}{e-1}',slopeTex:'\\frac{e}{e-1}',lineTex:'\\frac{e}{e-1}(x-1)',evaluationTex:'\\frac{e}{e-1}(2-1)',answerValue:Math.E/(Math.E-1),answerTex:'\\frac{e}{e-1}',acceptedExpressions:['e/(e-1)'],secondDerivative:"f''(x)=\\frac1x",secantTargetIsMidpoint:false});
}
U3['tangent-and-secant-line-approximations']=function(opts={}){
  const focus=opts.approximationType;
  const source=R()<.15?'test':'assignment';
  const makeProblem=focus==='secant'?u3SecantApproximationV122:focus==='tangent'?u3TangentApproximationV122:(R()<.5?u3TangentApproximationV122:u3SecantApproximationV122);
  const problem=makeProblem();
  return stamp(problem,'tangent-and-secant-line-approximations','noncalculator',source,problem.variant);
};

/* 13. Mean Value Theorem and Rolle's Theorem — decision first, c-values second. */
const U3_MVT_CHOICES=[
  'Yes, because the function is continuous on the closed interval and differentiable on the open interval',
  'No, because it is not continuous on the closed interval',
  'No, because it is not differentiable on the open interval',
  'No, because it is neither continuous on the closed interval nor differentiable on the open interval'
];
const U3_ROLLE_CHOICES=[
  'Yes, because the function is continuous on the closed interval, differentiable on the open interval, and \\(f(a)=f(b)\\)',
  ...U3_MVT_CHOICES.slice(1),
  'No, because \\(f(a)\\ne f(b)\\)'
];
function u3TheoremProblem(spec){
  const choices=spec.theorem==='rolle'?U3_ROLLE_CHOICES:U3_MVT_CHOICES;
  const theoremName=spec.theorem==='rolle'?"Rolle's Theorem":'the Mean Value Theorem';
  return {
    id:spec.id,
    variant:spec.variant,
    answerType:'staged-calculus',
    stagedFamily:'mvt-rolle',
    theoremKind:spec.theorem,
    theoremApplies:spec.applies,
    questionHtml:'<div class="u3-staged-question"><div class="question-prompt">'+
      (spec.theorem==='rolle'?"Rolle's Theorem":'Mean Value Theorem')+
      ' on the stated interval</div><div>\\('+spec.functionTex+',\\qquad '+spec.intervalTex+'\\)</div></div>',
    stage1:{
      type:'choice',
      prompt:'Part 1: Does '+theoremName+' apply?',
      choices,
      correctIndex:spec.reasonIndex,
      answerTex:choices[spec.reasonIndex],
      answerIsText:true,
      correctFeedback:'The theorem decision and reason are correct.',
      incorrectFeedback:'That theorem decision or reason is not correct.',
      explanation:u3WorkedSteps(spec.hypothesisSteps),
      explainOnCorrect:false,
      autoAdvanceOnCorrect:true
    },
    stage2:spec.applies?{
      type:'exact-list',
      prompt:'Part 2: Find every value of \\(c\\) in \\('+spec.openIntervalTex+'\\) guaranteed by '+theoremName+'.',
      expectedValues:spec.cValues,
      answerTex:spec.cAnswerTex,
      requireExact:true,
      tolerance:1e-7,
      placeholder:'Enter all exact c-values',
      checkLabel:'Check Part 2',
      keypadMode:'unit3-theorem',
      correctFeedback:'Every required value of c is correct.',
      incorrectFeedback:'The value or list of c-values is not correct.',
      explanation:u3WorkedSteps(spec.cSteps)
    }:null,
    answerTex:spec.applies?spec.cAnswerTex:choices[spec.reasonIndex],
    intervalMidpointValue:spec.intervalMidpointValue,
    cIsRoutineMidpoint:Boolean(spec.cIsRoutineMidpoint),
    fullWidthChoices:true
  };
}
function u3MvtApplies(){
  const family=pick(['quadratic','cubic','rational','radical','logarithm','exponential-combination','trigonometric']);
  if(family==='quadratic'){
    const A=ri(1,4),B=ri(-5,5),C=ri(-5,5),a=ri(-4,0),b=a+pick([2,4,6]);
    const c=Q(a+b,2),fa=A*a*a+B*a+C,fb=A*b*b+B*b+C,slope=A*(a+b)+B;
    return u3TheoremProblem({
      id:'u3-mvt-q-'+A+'-'+B+'-'+C+'-'+a+'-'+b,
      variant:'mvt_quadratic_applies',theorem:'mvt',applies:true,reasonIndex:0,
      functionTex:'f(x)='+quad(A,B,C),intervalTex:'['+a+','+b+']',openIntervalTex:'('+a+','+b+')',
      hypothesisSteps:[
        'A polynomial is continuous on \\(['+a+','+b+']\\) and differentiable on \\(('+a+','+b+')\\).',
        'Both hypotheses of the Mean Value Theorem are satisfied.'
      ],
      cValues:[u3QValue(c)],cAnswerTex:'c='+qTex(c),
      cSteps:[
        'Compute the average rate of change: \\(\\frac{f('+b+')-f('+a+')}{'+(b-a)+'}=\\frac{'+fb+'-'+fa+'}{'+(b-a)+'}='+slope+'\\).',
        "Differentiate: \\(f'(x)="+lin(2*A,B)+'\\). Set \\(f\'(c)='+slope+'\\).',
        'Solving gives \\(c='+qTex(c)+'\\), which lies in the open interval.'
      ]
    });
  }
  if(family==='cubic'){
    const r=pick([3,6,9]),c=r/Math.sqrt(3),cTex='\\frac{'+r+'}{\\sqrt3}';
    return u3TheoremProblem({
      id:'u3-mvt-cubic-'+r,variant:'mvt_cubic_applies',theorem:'mvt',applies:true,reasonIndex:0,
      functionTex:'f(x)=x^3',intervalTex:'[-'+r+','+r+']',openIntervalTex:'(-'+r+','+r+')',
      hypothesisSteps:[
        'The polynomial \\(x^3\\) is continuous on the closed interval and differentiable on the open interval.',
        'Therefore the Mean Value Theorem applies.'
      ],
      cValues:[-c,c],cAnswerTex:'c=-'+cTex+',\\ '+cTex,
      cSteps:[
        'The average rate of change is \\(\\frac{'+r+'^3-(-'+r+')^3}{'+(2*r)+'}='+r*r+'\\).',
        "Since \\(f'(x)=3x^2\\), solve \\(3c^2="+r*r+'\\).',
        'Thus \\(c=-'+cTex+'\\) or \\(c='+cTex+'\\); both are in the open interval.'
      ]
    });
  }
  if(family==='rational'){
    const p=ri(1,3),q=p+ri(1,3),a=p*p,b=q*q,c=p*q;
    return u3TheoremProblem({
      id:'u3-mvt-rec-'+p+'-'+q,variant:'mvt_rational_applies',theorem:'mvt',applies:true,reasonIndex:0,
      functionTex:'f(x)=\\frac1x',intervalTex:'['+a+','+b+']',openIntervalTex:'('+a+','+b+')',
      hypothesisSteps:[
        'Every \\(x\\) in the interval is positive, so the denominator never equals zero. The rational function is continuous on the closed interval.',
        'Its derivative exists throughout the open interval, so the Mean Value Theorem applies.'
      ],
      cValues:[c],cAnswerTex:'c='+c,
      cSteps:[
        'The average rate of change is \\(\\frac{1/'+b+'-1/'+a+'}{'+(b-a)+'}=-\\frac1{'+(a*b)+'}\\).',
        "Because \\(f'(x)=-\\frac1{x^2}\\), solve \\(-\\frac1{c^2}=-\\frac1{"+(a*b)+'}\\).',
        'The solution in the open interval is \\(c=\\sqrt{'+(a*b)+'}='+c+'\\).'
      ]
    });
  }
  if(family==='radical'){
    const p=ri(1,4),q=p+pick([2,4]),a=p*p,b=q*q,c=(p+q)*(p+q)/4,cTex=frac((p+q)*(p+q),4);
    return u3TheoremProblem({
      id:'u3-mvt-root-'+p+'-'+q,variant:'mvt_radical_applies',theorem:'mvt',applies:true,reasonIndex:0,
      functionTex:'f(x)=\\sqrt{x}',intervalTex:'['+a+','+b+']',openIntervalTex:'('+a+','+b+')',
      hypothesisSteps:[
        'The interval lies in the real domain \\(x\\ge0\\), so \\(\\sqrt{x}\\) is continuous on the closed interval.',
        "Every point of the open interval is positive, so \\(f'(x)=\\frac1{2\\sqrt{x}}\\) exists there."
      ],
      cValues:[c],cAnswerTex:'c='+cTex,
      cSteps:[
        'The average rate of change is \\(\\frac{'+q+'-'+p+'}{'+b+'-'+a+'}=\\frac1{'+(p+q)+'}\\).',
        "Set \\(f'(c)=\\frac1{2\\sqrt c}=\\frac1{"+(p+q)+'}\\).',
        'Then \\(2\\sqrt c='+(p+q)+'\\), so \\(c='+cTex+'\\).'
      ]
    });
  }
  if(family==='logarithm'){
    const k=pick([1,2]),bTex=k===1?'e':'e^2',b=Math.exp(k),c=(b-1)/k,cTex=k===1?'e-1':'\\frac{e^2-1}{2}';
    return u3TheoremProblem({
      id:'u3-mvt-log-'+k,variant:'mvt_logarithm_applies',theorem:'mvt',applies:true,reasonIndex:0,
      functionTex:'f(x)=\\ln x',intervalTex:'[1,'+bTex+']',openIntervalTex:'(1,'+bTex+')',
      hypothesisSteps:[
        'The interval is entirely in the domain \\(x>0\\), so \\(\\ln x\\) is continuous on the closed interval.',
        'Its derivative \\(1/x\\) exists throughout the open interval.'
      ],
      cValues:[c],cAnswerTex:'c='+cTex,
      cSteps:[
        'The average rate of change is \\(\\frac{\\ln('+bTex+')-\\ln1}{'+bTex+'-1}=\\frac{'+k+'}{'+bTex+'-1}\\).',
        "Set \\(f'(c)=\\frac1c=\\frac{"+k+'}{'+bTex+'-1}\\).',
        'Solving gives \\(c='+cTex+'\\), which lies between the endpoints.'
      ]
    });
  }
  if(family==='exponential-combination'){
    return u3TheoremProblem({
      id:'u3-mvt-exp-combo',variant:'mvt_exponential_combination_applies',theorem:'mvt',applies:true,reasonIndex:0,
      functionTex:'f(x)=e^x+e^{-x}',intervalTex:'[-1,1]',openIntervalTex:'(-1,1)',
      hypothesisSteps:[
        'Both exponential terms are continuous on \\([-1,1]\\), so their sum is continuous there.',
        'The derivative exists for every real \\(x\\), so the Mean Value Theorem applies.'
      ],
      cValues:[0],cAnswerTex:'c=0',
      cSteps:[
        'The endpoint values agree: \\(f(-1)=e^{-1}+e=f(1)\\), so the average rate of change is \\(0\\).',
        "Differentiate: \\(f'(x)=e^x-e^{-x}\\). Set \\(f'(c)=0\\).",
        'Then \\(e^c=e^{-c}\\), so \\(e^{2c}=1\\) and \\(c=0\\).'
      ]
    });
  }
  return u3TheoremProblem({
    id:'u3-mvt-sine',variant:'mvt_trigonometric_applies',theorem:'mvt',applies:true,reasonIndex:0,
    functionTex:'f(x)=\\sin x',intervalTex:'[0,\\pi]',openIntervalTex:'(0,\\pi)',
    hypothesisSteps:[
      'The sine function is continuous on \\([0,\\pi]\\).',
      'It is differentiable on \\((0,\\pi)\\), so the Mean Value Theorem applies.'
    ],
    cValues:[Math.PI/2],cAnswerTex:'c=\\frac{\\pi}{2}',
    cSteps:[
      'The endpoint values are both \\(0\\), so the average rate of change is \\(0\\).',
      "Since \\(f'(x)=\\cos x\\), solve \\(\\cos c=0\\).",
      'The value in \\((0,\\pi)\\) is \\(c=\\frac{\\pi}{2}\\).'
    ]
  });
}
function u3MvtFails(){
  const family=pick(['rational-pole','absolute-value','radical-domain','log-endpoint','rational-hole','exponential-rational']);
  if(family==='rational-pole'){
    const h=ri(-2,2);
    return u3TheoremProblem({
      id:'u3-mvt-fail-pole-'+h,variant:'mvt_rational_fails',theorem:'mvt',applies:false,reasonIndex:3,
      functionTex:'f(x)=\\frac{x+1}{'+shift('x',h)+'}',intervalTex:'['+(h-2)+','+(h+2)+']',
      hypothesisSteps:[
        'The denominator is zero at \\(x='+h+'\\), which is inside the interval, so the function is not continuous on the closed interval.',
        'The derivative also does not exist at that interior point. Neither hypothesis holds.'
      ]
    });
  }
  if(family==='absolute-value')return u3TheoremProblem({
    id:'u3-mvt-fail-abs',variant:'mvt_absolute_value_fails',theorem:'mvt',applies:false,reasonIndex:2,
    functionTex:'f(x)=|x-1|',intervalTex:'[-1,3]',
    hypothesisSteps:[
      'The absolute-value function is continuous on \\([-1,3]\\).',
      "At \\(x=1\\), inside the open interval, the graph has a corner and \\(f'(1)\\) does not exist."
    ]
  });
  if(family==='radical-domain')return u3TheoremProblem({
    id:'u3-mvt-fail-root',variant:'mvt_radical_fails',theorem:'mvt',applies:false,reasonIndex:3,
    functionTex:'f(x)=\\sqrt{x+1}',intervalTex:'[-2,3]',
    hypothesisSteps:[
      'For \\(x<-1\\), \\(\\sqrt{x+1}\\) is not real, so the function is not defined on the full closed interval.',
      'It is therefore neither continuous on the closed interval nor differentiable throughout the open interval.'
    ]
  });
  if(family==='log-endpoint')return u3TheoremProblem({
    id:'u3-mvt-fail-log',variant:'mvt_logarithm_fails',theorem:'mvt',applies:false,reasonIndex:1,
    functionTex:'f(x)=\\ln x',intervalTex:'[0,e]',
    hypothesisSteps:[
      '\\(\\ln0\\) is not defined, so \\(f\\) is not continuous at the left endpoint.',
      "Although \\(f'(x)=1/x\\) exists on \\((0,e)\\), continuity on the entire closed interval is required."
    ]
  });
  if(family==='rational-hole')return u3TheoremProblem({
    id:'u3-mvt-fail-hole',variant:'mvt_removable_rational_fails',theorem:'mvt',applies:false,reasonIndex:3,
    functionTex:'f(x)=\\frac{x^2-1}{x-1}',intervalTex:'[0,2]',
    hypothesisSteps:[
      'The original rational function is undefined at \\(x=1\\), even though its expression cancels elsewhere.',
      'That hole makes the function neither continuous nor differentiable throughout the required intervals.'
    ]
  });
  return u3TheoremProblem({
    id:'u3-mvt-fail-exp-rational',variant:'mvt_exponential_rational_fails',theorem:'mvt',applies:false,reasonIndex:3,
    functionTex:'f(x)=\\frac{e^x}{x-1}',intervalTex:'[0,2]',
    hypothesisSteps:[
      'The denominator is zero at \\(x=1\\), inside the interval.',
      'The vertical asymptote breaks both continuity and differentiability at an interior point.'
    ]
  });
}
function u3RolleApplies(){
  const family=pick(['quadratic','quartic','sine','cosine','rational','radical','logarithmic','exponential']);
  if(family==='quadratic'||family==='quartic'){
    const h=ri(-3,3),r=ri(1,4),power=family==='quadratic'?2:4,k=ri(-4,4);
    const body=h===0?'x':h>0?'x-'+h:'x+'+(-h);
    return u3TheoremProblem({
      id:'u3-rolle-'+power+'-'+h+'-'+r+'-'+k,variant:'rolle_'+family+'_applies',theorem:'rolle',applies:true,reasonIndex:0,
      functionTex:'f(x)=('+body+')^'+power+(k?sgn(k,''):''),intervalTex:'['+(h-r)+','+(h+r)+']',openIntervalTex:'('+(h-r)+','+(h+r)+')',
      hypothesisSteps:[
        'This polynomial is continuous on the closed interval and differentiable on the open interval.',
        'The endpoints are equally far from \\(x='+h+'\\), so \\(f('+(h-r)+')=f('+(h+r)+')\\).'
      ],
      cValues:[h],cAnswerTex:'c='+h,
      cSteps:[
        "Differentiate: \\(f'(x)="+power+'('+body+')^{'+(power-1)+'}\\).',
        "Set \\(f'(c)=0\\), so \\(c="+h+'\\).',
        'This value lies in the open interval.'
      ]
    });
  }
  if(family==='sine')return u3TheoremProblem({
    id:'u3-rolle-sine',variant:'rolle_trigonometric_sine_applies',theorem:'rolle',applies:true,reasonIndex:0,
    functionTex:'f(x)=\\sin x',intervalTex:'[0,\\pi]',openIntervalTex:'(0,\\pi)',
    hypothesisSteps:['Sine is continuous on the closed interval and differentiable on the open interval.','Also, \\(f(0)=0=f(\\pi)\\), so all three conditions hold.'],
    cValues:[Math.PI/2],cAnswerTex:'c=\\frac{\\pi}{2}',
    cSteps:["\\(f'(x)=\\cos x\\).",'Solve \\(\\cos c=0\\) for \\(0<c<\\pi\\).','The required value is \\(c=\\frac{\\pi}{2}\\).']
  });
  if(family==='cosine')return u3TheoremProblem({
    id:'u3-rolle-cosine',variant:'rolle_trigonometric_cosine_applies',theorem:'rolle',applies:true,reasonIndex:0,
    functionTex:'f(x)=\\cos x',intervalTex:'[0,2\\pi]',openIntervalTex:'(0,2\\pi)',
    hypothesisSteps:['Cosine is continuous on the closed interval and differentiable on the open interval.','\\(f(0)=1=f(2\\pi)\\), so the endpoint condition also holds.'],
    cValues:[Math.PI],cAnswerTex:'c=\\pi',
    cSteps:["\\(f'(x)=-\\sin x\\).",'Solve \\(-\\sin c=0\\) in \\((0,2\\pi)\\).','The only interior solution is \\(c=\\pi\\).']
  });
  if(family==='rational')return u3TheoremProblem({
    id:'u3-rolle-rational',variant:'rolle_rational_applies',theorem:'rolle',applies:true,reasonIndex:0,
    functionTex:'f(x)=x+\\frac1x',intervalTex:'[\\frac12,2]',openIntervalTex:'(\\frac12,2)',
    hypothesisSteps:[
      'The interval contains only positive values, so the denominator never vanishes. The function is continuous and differentiable where required.',
      '\\(f(\\frac12)=\\frac52=f(2)\\), so the endpoint values agree.'
    ],
    cValues:[1],cAnswerTex:'c=1',
    cSteps:["Differentiate: \\(f'(x)=1-\\frac1{x^2}\\).",'Solve \\(1-\\frac1{c^2}=0\\), giving \\(c^2=1\\).','Only \\(c=1\\) lies in the open interval.']
  });
  if(family==='radical'){
    const r=ri(2,5);
    return u3TheoremProblem({
      id:'u3-rolle-radical-'+r,variant:'rolle_radical_applies',theorem:'rolle',applies:true,reasonIndex:0,
      functionTex:'f(x)=\\sqrt{'+(r*r)+'-x^2}',intervalTex:'[-'+r+','+r+']',openIntervalTex:'(-'+r+','+r+')',
      hypothesisSteps:[
        'The upper semicircle is continuous on the closed interval. Its vertical endpoint tangents do not matter because differentiability is required only inside.',
        '\\(f(-'+r+')=0=f('+r+')\\), and the derivative exists for every interior point.'
      ],
      cValues:[0],cAnswerTex:'c=0',
      cSteps:[
        "\\(f'(x)=-\\frac{x}{\\sqrt{"+(r*r)+'-x^2}}\\).',
        'Inside the interval the denominator is nonzero, so the derivative is zero when the numerator is zero.',
        'Thus \\(c=0\\).'
      ]
    });
  }
  if(family==='logarithmic')return u3TheoremProblem({
    id:'u3-rolle-log',variant:'rolle_logarithmic_applies',theorem:'rolle',applies:true,reasonIndex:0,
    functionTex:'f(x)=(\\ln x)^2',intervalTex:'[e^{-1},e]',openIntervalTex:'(e^{-1},e)',
    hypothesisSteps:['The interval is positive, so \\((\\ln x)^2\\) is continuous and differentiable where required.','\\(f(e^{-1})=(-1)^2=1=f(e)\\).'],
    cValues:[1],cAnswerTex:'c=1',
    cSteps:["Differentiate: \\(f'(x)=\\frac{2\\ln x}{x}\\).",'The derivative is zero when \\(\\ln c=0\\).','Therefore \\(c=1\\).']
  });
  return u3TheoremProblem({
    id:'u3-rolle-exp',variant:'rolle_exponential_combination_applies',theorem:'rolle',applies:true,reasonIndex:0,
    functionTex:'f(x)=e^x+e^{-x}',intervalTex:'[-1,1]',openIntervalTex:'(-1,1)',
    hypothesisSteps:['The function is continuous and differentiable for every real number.','\\(f(-1)=e^{-1}+e=f(1)\\), so the endpoint condition holds.'],
    cValues:[0],cAnswerTex:'c=0',
    cSteps:["\\(f'(x)=e^x-e^{-x}\\).",'Set \\(e^c-e^{-c}=0\\), or \\(e^{2c}=1\\).','Thus \\(c=0\\).']
  });
}
function u3RolleFails(){
  const family=pick(['unequal-polynomial','absolute-value','rational-pole','radical-domain','removable-hole']);
  if(family==='unequal-polynomial')return u3TheoremProblem({
    id:'u3-rolle-fail-endpoints',variant:'rolle_polynomial_fails_endpoints',theorem:'rolle',applies:false,reasonIndex:4,
    functionTex:'f(x)=x^2+x',intervalTex:'[0,2]',
    hypothesisSteps:['The polynomial is continuous on \\([0,2]\\) and differentiable on \\((0,2)\\).','However, \\(f(0)=0\\) while \\(f(2)=6\\). Since the endpoint values are unequal, Rolle\'s Theorem does not apply.']
  });
  if(family==='absolute-value')return u3TheoremProblem({
    id:'u3-rolle-fail-abs',variant:'rolle_absolute_value_fails',theorem:'rolle',applies:false,reasonIndex:2,
    functionTex:'f(x)=|x|',intervalTex:'[-2,2]',
    hypothesisSteps:['The function is continuous, and \\(f(-2)=2=f(2)\\).',"At \\(x=0\\), the graph has a corner and \\(f'(0)\\) does not exist."]
  });
  if(family==='rational-pole')return u3TheoremProblem({
    id:'u3-rolle-fail-pole',variant:'rolle_rational_fails',theorem:'rolle',applies:false,reasonIndex:3,
    functionTex:'f(x)=\\frac1{x^2}',intervalTex:'[-1,1]',
    hypothesisSteps:['The endpoint values agree: \\(f(-1)=1=f(1)\\).','But \\(f\\) is undefined at \\(x=0\\), so it is neither continuous on the closed interval nor differentiable throughout the open interval.']
  });
  if(family==='radical-domain')return u3TheoremProblem({
    id:'u3-rolle-fail-root',variant:'rolle_radical_fails',theorem:'rolle',applies:false,reasonIndex:3,
    functionTex:'f(x)=\\sqrt{x+1}',intervalTex:'[-2,2]',
    hypothesisSteps:['The function has no real values for \\(x<-1\\), so it is not defined on the full closed interval.','It consequently fails both the continuity and differentiability conditions.']
  });
  return u3TheoremProblem({
    id:'u3-rolle-fail-hole',variant:'rolle_removable_rational_fails',theorem:'rolle',applies:false,reasonIndex:3,
    functionTex:'f(x)=\\frac{x^2-1}{x-1}',intervalTex:'[0,2]',
    hypothesisSteps:['The original function is undefined at \\(x=1\\), so it has a hole inside the interval.','The hole makes the function neither continuous on the closed interval nor differentiable throughout the open interval.']
  });
}

/* Version 12.2 adds asymmetric, course-appropriate theorem examples so the
 * guaranteed c-value is not predictably the midpoint of the interval. */
function u3MvtAppliesV122(){
  const family=pick(['cubic-plus-linear','rational','radical-composition','logarithm','exponential','trigonometric','inverse-trigonometric','product-logarithm','logarithmic-composition','exponential-composition','shifted-reciprocal','trigonometric-composition']);
  if(family==='cubic-plus-linear'){
    const r=pick([2,3,4]),c=r/Math.sqrt(3),cTex='\\frac{'+r+'}{\\sqrt3}';
    return u3TheoremProblem({id:'u3-v122-mvt-cubic-'+r,variant:'mvt_cubic_plus_linear_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=x^3+x',intervalTex:'[0,'+r+']',openIntervalTex:'(0,'+r+')',intervalMidpointValue:r/2,
      hypothesisSteps:['The polynomial is continuous on \\([0,'+r+']\\) and differentiable on \\((0,'+r+')\\), so the Mean Value Theorem applies.'],
      cValues:[c],cAnswerTex:'c='+cTex,cSteps:['Compute the secant slope: \\(\\frac{f('+r+')-f(0)}{'+r+'-0}=\\frac{'+(r**3+r)+'}{'+r+'}='+(r*r+1)+'\\).',"Differentiate: \\(f'(x)=3x^2+1\\). Set \\(f'(c)="+(r*r+1)+'\\).','Then \\(3c^2='+r*r+'\\), so the value in \\((0,'+r+')\\) is \\(c='+cTex+'\\).']});
  }
  if(family==='rational')return u3TheoremProblem({id:'u3-v122-mvt-rational',variant:'mvt_rational_product_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=x+\\frac1x',intervalTex:'[\\frac12,2]',openIntervalTex:'(\\frac12,2)',intervalMidpointValue:1.25,
    hypothesisSteps:['Every number in the interval is positive, so the denominator is never zero. The function is continuous on the closed interval and differentiable on the open interval.'],cValues:[1],cAnswerTex:'c=1',
    cSteps:['The endpoint values are \\(f(\\frac12)=\\frac52\\) and \\(f(2)=\\frac52\\), so the secant slope is \\(0\\).',"Differentiate: \\(f'(x)=1-\\frac1{x^2}\\). Solve \\(f'(c)=0\\).",'The only solution in \\((\\frac12,2)\\) is \\(c=1\\).']});
  if(family==='radical-composition')return u3TheoremProblem({id:'u3-v122-mvt-radical',variant:'mvt_radical_composition_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=(x+1)^{3/2}',intervalTex:'[0,3]',openIntervalTex:'(0,3)',intervalMidpointValue:1.5,
    hypothesisSteps:['Because \\(x+1>0\\) throughout the interval, the function is continuous on \\([0,3]\\) and differentiable on \\((0,3)\\).'],cValues:[115/81],cAnswerTex:'c=\\frac{115}{81}',
    cSteps:['Compute the secant slope: \\(\\frac{f(3)-f(0)}{3-0}=\\frac{8-1}{3}=\\frac73\\).',"Differentiate: \\(f'(x)=\\frac32\\sqrt{x+1}\\). Set \\(\\frac32\\sqrt{c+1}=\\frac73\\).",'Then \\(\\sqrt{c+1}=\\frac{14}{9}\\), so \\(c=\\frac{196}{81}-1=\\frac{115}{81}\\).']});
  if(family==='logarithm')return u3TheoremProblem({id:'u3-v122-mvt-log',variant:'mvt_logarithm_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=\\ln x',intervalTex:'[1,e^2]',openIntervalTex:'(1,e^2)',intervalMidpointValue:(1+Math.E**2)/2,
    hypothesisSteps:['The interval lies entirely in \\(x>0\\), so \\(\\ln x\\) is continuous on the closed interval and differentiable on the open interval.'],cValues:[(Math.E**2-1)/2],cAnswerTex:'c=\\frac{e^2-1}{2}',
    cSteps:['The secant slope is \\(\\frac{\\ln(e^2)-\\ln1}{e^2-1}=\\frac2{e^2-1}\\).',"Since \\(f'(x)=\\frac1x\\), solve \\(\\frac1c=\\frac2{e^2-1}\\).",'Thus \\(c=\\frac{e^2-1}{2}\\), which lies in \\((1,e^2)\\).']});
  if(family==='exponential')return u3TheoremProblem({id:'u3-v122-mvt-exp',variant:'mvt_exponential_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=e^x',intervalTex:'[0,\\ln4]',openIntervalTex:'(0,\\ln4)',intervalMidpointValue:Math.log(4)/2,
    hypothesisSteps:['The exponential function is continuous and differentiable for every real number, so both hypotheses hold on this interval.'],cValues:[Math.log(3/Math.log(4))],cAnswerTex:'c=\\ln\\left(\\frac3{\\ln4}\\right)',
    cSteps:['The secant slope is \\(\\frac{e^{\\ln4}-e^0}{\\ln4-0}=\\frac3{\\ln4}\\).',"Because \\(f'(x)=e^x\\), solve \\(e^c=\\frac3{\\ln4}\\).",'Taking the natural logarithm gives \\(c=\\ln\\left(\\frac3{\\ln4}\\right)\\), which lies in the open interval.']});
  if(family==='trigonometric')return u3TheoremProblem({id:'u3-v122-mvt-sine',variant:'mvt_trigonometric_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=\\sin x',intervalTex:'[0,2\\pi]',openIntervalTex:'(0,2\\pi)',intervalMidpointValue:Math.PI,
    hypothesisSteps:['Sine is continuous on \\([0,2\\pi]\\) and differentiable on \\((0,2\\pi)\\), so the Mean Value Theorem applies.'],cValues:[Math.PI/2,3*Math.PI/2],cAnswerTex:'c=\\frac{\\pi}{2},\\ \\frac{3\\pi}{2}',
    cSteps:['The endpoint values are both \\(0\\), so the secant slope is \\(0\\).',"Differentiate: \\(f'(x)=\\cos x\\). Solve \\(\\cos c=0\\) for \\(0<c<2\\pi\\).",'The required values are \\(c=\\frac{\\pi}{2}\\) and \\(c=\\frac{3\\pi}{2}\\).']});
  if(family==='inverse-trigonometric')return u3TheoremProblem({id:'u3-v122-mvt-atan',variant:'mvt_inverse_trigonometric_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=\\tan^{-1}x',intervalTex:'[0,1]',openIntervalTex:'(0,1)',intervalMidpointValue:.5,
    hypothesisSteps:['The inverse tangent function is continuous on \\([0,1]\\) and differentiable on \\((0,1)\\).'],cValues:[Math.sqrt(4/Math.PI-1)],cAnswerTex:'c=\\sqrt{\\frac4\\pi-1}',
    cSteps:['The secant slope is \\(\\frac{\\tan^{-1}(1)-\\tan^{-1}(0)}{1-0}=\\frac{\\pi}{4}\\).',"Since \\(f'(x)=\\frac1{1+x^2}\\), solve \\(\\frac1{1+c^2}=\\frac{\\pi}{4}\\).",'Thus \\(c^2=\\frac4\\pi-1\\), and the value in \\((0,1)\\) is \\(c=\\sqrt{\\frac4\\pi-1}\\).']});
  if(family==='logarithmic-composition')return u3TheoremProblem({id:'u3-v124-mvt-log-composition',variant:'mvt_logarithmic_composition_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=\\ln(x+1)',intervalTex:'[0,e-1]',openIntervalTex:'(0,e-1)',intervalMidpointValue:(Math.E-1)/2,
    hypothesisSteps:['Every \\(x\\) in the interval satisfies \\(x+1>0\\), so the logarithmic composition is continuous on the closed interval and differentiable on the open interval.'],cValues:[Math.E-2],cAnswerTex:'c=e-2',
    cSteps:['The secant slope is \\(\\frac{\\ln e-\\ln1}{e-1}=\\frac1{e-1}\\).',"Differentiate: \\(f'(x)=\\frac1{x+1}\\). Set \\(\\frac1{c+1}=\\frac1{e-1}\\).",'Therefore \\(c=e-2\\), which lies in \\((0,e-1)\\).']});
  if(family==='exponential-composition')return u3TheoremProblem({id:'u3-v124-mvt-exp-composition',variant:'mvt_exponential_composition_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=e^{2x}',intervalTex:'[0,\\ln2]',openIntervalTex:'(0,\\ln2)',intervalMidpointValue:Math.log(2)/2,
    hypothesisSteps:['The exponential composition is continuous and differentiable for every real number, so the Mean Value Theorem applies on this interval.'],cValues:[.5*Math.log(3/(2*Math.log(2)))],cAnswerTex:'c=\\frac12\\ln\\left(\\frac3{2\\ln2}\\right)',
    cSteps:['The secant slope is \\(\\frac{e^{2\\ln2}-e^0}{\\ln2}=\\frac3{\\ln2}\\).',"Differentiate: \\(f'(x)=2e^{2x}\\). Set \\(2e^{2c}=\\frac3{\\ln2}\\).",'Solving gives \\(c=\\frac12\\ln\\left(\\frac3{2\\ln2}\\right)\\), which lies in the open interval.']});
  if(family==='shifted-reciprocal')return u3TheoremProblem({id:'u3-v124-mvt-shifted-reciprocal',variant:'mvt_shifted_reciprocal_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=\\frac1{x+1}',intervalTex:'[0,3]',openIntervalTex:'(0,3)',intervalMidpointValue:1.5,
    hypothesisSteps:['The denominator is positive throughout the interval, so the function is continuous on \\([0,3]\\) and differentiable on \\((0,3)\\).'],cValues:[1],cAnswerTex:'c=1',
    cSteps:['The secant slope is \\(\\frac{\\frac14-1}{3}=-\\frac14\\).',"Differentiate: \\(f'(x)=-\\frac1{(x+1)^2}\\). Set \\(-\\frac1{(c+1)^2}=-\\frac14\\).",'Because \\(c\\) is in \\((0,3)\\), solving gives \\(c=1\\).']});
  if(family==='trigonometric-composition')return u3TheoremProblem({id:'u3-v124-mvt-trig-composition',variant:'mvt_trigonometric_composition_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=\\sin(2x)',intervalTex:'[0,\\frac{\\pi}{2}]',openIntervalTex:'(0,\\frac{\\pi}{2})',intervalMidpointValue:Math.PI/4,
    hypothesisSteps:['The sine composition is continuous on the closed interval and differentiable on the open interval.'],cValues:[Math.PI/4],cAnswerTex:'c=\\frac{\\pi}{4}',
    cSteps:['The endpoint values are both \\(0\\), so the secant slope is \\(0\\).',"Differentiate: \\(f'(x)=2\\cos(2x)\\). Solve \\(2\\cos(2c)=0\\).",'The value in \\((0,\\frac{\\pi}{2})\\) is \\(c=\\frac{\\pi}{4}\\).']});
  return u3TheoremProblem({id:'u3-v122-mvt-xlnx',variant:'mvt_product_logarithm_applies',theorem:'mvt',applies:true,reasonIndex:0,functionTex:'f(x)=x\\ln x',intervalTex:'[1,e]',openIntervalTex:'(1,e)',intervalMidpointValue:(1+Math.E)/2,
    hypothesisSteps:['Both factors are continuous on \\([1,e]\\), and the product is differentiable on \\((1,e)\\).'],cValues:[Math.exp(1/(Math.E-1))],cAnswerTex:'c=e^{\\frac1{e-1}}',
    cSteps:['The secant slope is \\(\\frac{e\\ln e-1\\ln1}{e-1}=\\frac{e}{e-1}\\).',"By the product rule, \\(f'(x)=\\ln x+1\\). Set \\(\\ln c+1=\\frac{e}{e-1}\\).",'Then \\(\\ln c=\\frac1{e-1}\\), so \\(c=e^{\\frac1{e-1}}\\).']});
}
function u3RolleAppliesV122(){
  const family=pick(['cubic','radical-product','log-product','exponential-product','trigonometric','inverse-trigonometric','rational','logarithmic','cosine-composition','logarithmic-composition','mixed-exponential-product','rational-product-quotient']);
  if(family==='cubic')return u3TheoremProblem({id:'u3-v122-rolle-cubic',variant:'rolle_cubic_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=x^3-7x^2+12x',intervalTex:'[0,4]',openIntervalTex:'(0,4)',intervalMidpointValue:2,
    hypothesisSteps:['The polynomial is continuous on \\([0,4]\\) and differentiable on \\((0,4)\\). Also, \\(f(0)=0=f(4)\\), so all three conditions hold.'],cValues:[(7-Math.sqrt(13))/3,(7+Math.sqrt(13))/3],cAnswerTex:'c=\\frac{7-\\sqrt{13}}3,\\ \\frac{7+\\sqrt{13}}3',
    cSteps:["Differentiate: \\(f'(x)=3x^2-14x+12\\).",'Set \\(3c^2-14c+12=0\\) and use the quadratic formula.','Both \\(c=\\frac{7-\\sqrt{13}}3\\) and \\(c=\\frac{7+\\sqrt{13}}3\\) lie in \\((0,4)\\).']});
  if(family==='radical-product'){
    const a=pick([3,6,9,12]),c=Q(a,3);
    return u3TheoremProblem({id:'u3-v122-rolle-root-'+a,variant:'rolle_radical_product_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=\\sqrt{x}('+a+'-x)',intervalTex:'[0,'+a+']',openIntervalTex:'(0,'+a+')',intervalMidpointValue:a/2,
      hypothesisSteps:['The function is continuous on \\([0,'+a+']\\) and differentiable for every \\(x\\) in \\((0,'+a+')\\). Its endpoint values are both \\(0\\).'],cValues:[u3QValue(c)],cAnswerTex:'c='+qTex(c),
      cSteps:["Use the product rule: \\(f'(x)=\\frac{"+a+'-x}{2\\sqrt{x}}-\\sqrt{x}=\\frac{'+a+'-3x}{2\\sqrt{x}}\\).','The denominator is nonzero inside the interval, so set \\('+a+'-3c=0\\).','Therefore \\(c='+qTex(c)+'\\).']});
  }
  if(family==='log-product')return u3TheoremProblem({id:'u3-v122-rolle-log-product',variant:'rolle_logarithmic_product_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=\\ln x\\,\\ln\\left(\\frac9x\\right)',intervalTex:'[1,9]',openIntervalTex:'(1,9)',intervalMidpointValue:5,
    hypothesisSteps:['The interval lies in the logarithms’ real domain, so the function is continuous and differentiable where required. At both endpoints, one logarithmic factor is \\(0\\), so \\(f(1)=f(9)=0\\).'],cValues:[3],cAnswerTex:'c=3',
    cSteps:["Differentiate and combine terms: \\(f'(x)=\\frac{\\ln(9/x)-\\ln x}{x}=\\frac{\\ln9-2\\ln x}{x}\\).",'Set the numerator equal to zero: \\(2\\ln c=\\ln9\\).','Thus \\(\\ln c=\\ln3\\), so \\(c=3\\).']});
  if(family==='exponential-product')return u3TheoremProblem({id:'u3-v122-rolle-exp-product',variant:'rolle_exponential_product_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=(e^x-1)(e^x-4)',intervalTex:'[0,\\ln4]',openIntervalTex:'(0,\\ln4)',intervalMidpointValue:Math.log(4)/2,
    hypothesisSteps:['The product of exponential functions is continuous and differentiable everywhere. The first factor is zero at \\(x=0\\), and the second is zero at \\(x=\\ln4\\), so the endpoint values agree.'],cValues:[Math.log(2.5)],cAnswerTex:'c=\\ln\\left(\\frac52\\right)',
    cSteps:["Differentiate: \\(f'(x)=e^x(2e^x-5)\\).",'Since \\(e^c\\ne0\\), solve \\(2e^c-5=0\\).','Thus \\(e^c=\\frac52\\), so \\(c=\\ln\\left(\\frac52\\right)\\).']});
  if(family==='trigonometric')return u3TheoremProblem({id:'u3-v122-rolle-sin2',variant:'rolle_trigonometric_composition_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=\\sin(2x)',intervalTex:'[0,\\pi]',openIntervalTex:'(0,\\pi)',intervalMidpointValue:Math.PI/2,
    hypothesisSteps:['The sine composition is continuous and differentiable everywhere, and \\(f(0)=0=f(\\pi)\\).'],cValues:[Math.PI/4,3*Math.PI/4],cAnswerTex:'c=\\frac{\\pi}{4},\\ \\frac{3\\pi}{4}',
    cSteps:["Differentiate: \\(f'(x)=2\\cos(2x)\\).",'Solve \\(\\cos(2c)=0\\) for \\(0<c<\\pi\\).','The two values are \\(c=\\frac{\\pi}{4}\\) and \\(c=\\frac{3\\pi}{4}\\).']});
  if(family==='inverse-trigonometric')return u3TheoremProblem({id:'u3-v122-rolle-atan',variant:'rolle_inverse_trigonometric_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=(\\tan^{-1}x)(\\tan^{-1}x-\\frac{\\pi}{4})',intervalTex:'[0,1]',openIntervalTex:'(0,1)',intervalMidpointValue:.5,
    hypothesisSteps:['Inverse tangent is continuous and differentiable throughout the interval. One factor is zero at each endpoint, so \\(f(0)=0=f(1)\\).'],cValues:[Math.SQRT2-1],cAnswerTex:'c=\\sqrt2-1',
    cSteps:["Differentiate: \\(f'(x)=\\frac{2\\tan^{-1}x-\\pi/4}{1+x^2}\\).",'The denominator is positive, so solve \\(2\\tan^{-1}c-\\frac{\\pi}{4}=0\\).','Then \\(\\tan^{-1}c=\\frac{\\pi}{8}\\), so \\(c=\\tan(\\frac{\\pi}{8})=\\sqrt2-1\\).']});
  if(family==='rational')return u3TheoremProblem({id:'u3-v122-rolle-rational',variant:'rolle_rational_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=\\frac{x}{x^2+1}',intervalTex:'[\\frac12,2]',openIntervalTex:'(\\frac12,2)',intervalMidpointValue:1.25,
    hypothesisSteps:['The denominator is positive throughout the interval, so the rational function is continuous and differentiable where required. Also, \\(f(\\frac12)=\\frac25=f(2)\\).'],cValues:[1],cAnswerTex:'c=1',
    cSteps:["Use the quotient rule: \\(f'(x)=\\frac{1-x^2}{(x^2+1)^2}\\).",'The denominator is positive, so solve \\(1-c^2=0\\).','Only \\(c=1\\) lies in \\((\\frac12,2)\\).']});
  if(family==='cosine-composition')return u3TheoremProblem({id:'u3-v124-rolle-cos-composition',variant:'rolle_cosine_composition_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=\\cos(2x)',intervalTex:'[0,\\pi]',openIntervalTex:'(0,\\pi)',intervalMidpointValue:Math.PI/2,
    hypothesisSteps:['The cosine composition is continuous and differentiable everywhere, and \\(f(0)=1=f(\\pi)\\).'],cValues:[Math.PI/2],cAnswerTex:'c=\\frac{\\pi}{2}',
    cSteps:["Differentiate: \\(f'(x)=-2\\sin(2x)\\).",'Solve \\(\\sin(2c)=0\\) for \\(0<c<\\pi\\).','The only interior solution is \\(c=\\frac{\\pi}{2}\\).']});
  if(family==='logarithmic-composition')return u3TheoremProblem({id:'u3-v124-rolle-log-composition',variant:'rolle_logarithmic_composition_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=(\\ln(x+1)-1)^2',intervalTex:'[0,e^2-1]',openIntervalTex:'(0,e^2-1)',intervalMidpointValue:(Math.E**2-1)/2,
    hypothesisSteps:['The logarithm has positive input throughout the interval, so the function is continuous and differentiable where required. Also, \\(f(0)=1=f(e^2-1)\\).'],cValues:[Math.E-1],cAnswerTex:'c=e-1',
    cSteps:["Differentiate: \\(f'(x)=\\frac{2(\\ln(x+1)-1)}{x+1}\\).",'The denominator is positive, so set \\(\\ln(c+1)-1=0\\).','Thus \\(c+1=e\\), so \\(c=e-1\\).']});
  if(family==='mixed-exponential-product')return u3TheoremProblem({id:'u3-v124-rolle-mixed-exp-product',variant:'rolle_mixed_exponential_product_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=x(2-x)e^x',intervalTex:'[0,2]',openIntervalTex:'(0,2)',intervalMidpointValue:1,
    hypothesisSteps:['This product is continuous and differentiable everywhere, and the polynomial factor makes \\(f(0)=0=f(2)\\).'],cValues:[Math.SQRT2],cAnswerTex:'c=\\sqrt2',
    cSteps:["Use the product rule and simplify: \\(f'(x)=e^x(2-x^2)\\).",'Since \\(e^c>0\\), solve \\(2-c^2=0\\).','The solution in \\((0,2)\\) is \\(c=\\sqrt2\\).']});
  if(family==='rational-product-quotient')return u3TheoremProblem({id:'u3-v124-rolle-rational-product',variant:'rolle_rational_product_quotient_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=\\frac{(x-1)(3-x)}{x+1}',intervalTex:'[1,3]',openIntervalTex:'(1,3)',intervalMidpointValue:2,
    hypothesisSteps:['The denominator is nonzero throughout the interval, so the function is continuous and differentiable where required. Its numerator is zero at both endpoints.'],cValues:[-1+2*Math.SQRT2],cAnswerTex:'c=-1+2\\sqrt2',
    cSteps:["Use the quotient rule and simplify: \\(f'(x)=\\frac{-x^2-2x+7}{(x+1)^2}\\).",'The denominator is positive, so solve \\(-c^2-2c+7=0\\).','Only \\(c=-1+2\\sqrt2\\) lies in \\((1,3)\\).']});
  return u3TheoremProblem({id:'u3-v122-rolle-logsq',variant:'rolle_logarithmic_applies',theorem:'rolle',applies:true,reasonIndex:0,functionTex:'f(x)=(\\ln x)^2',intervalTex:'[e^{-2},e^2]',openIntervalTex:'(e^{-2},e^2)',intervalMidpointValue:(Math.exp(-2)+Math.exp(2))/2,
    hypothesisSteps:['The entire interval is positive, so the function is continuous and differentiable where required. Also, \\(f(e^{-2})=4=f(e^2)\\).'],cValues:[1],cAnswerTex:'c=1',cSteps:["Differentiate: \\(f'(x)=\\frac{2\\ln x}{x}\\).",'Since the denominator is positive, set \\(\\ln c=0\\).','Therefore \\(c=1\\).']});
}
function u3MvtFailsV122(){
  const family=pick(['trigonometric','inverse-trigonometric','cube-root','rational','logarithmic','absolute-value','secant-pole','logarithmic-hole','radical-quotient']);
  if(family==='trigonometric')return u3TheoremProblem({id:'u3-v122-mvt-fail-tan',variant:'mvt_trigonometric_fails',theorem:'mvt',applies:false,reasonIndex:3,functionTex:'f(x)=\\tan x',intervalTex:'[0,\\pi]',hypothesisSteps:['The function is undefined at \\(x=\\frac{\\pi}{2}\\), an interior point. Therefore it is not continuous on the closed interval and not differentiable throughout the open interval.']});
  if(family==='inverse-trigonometric')return u3TheoremProblem({id:'u3-v122-mvt-fail-asin',variant:'mvt_inverse_trigonometric_fails',theorem:'mvt',applies:false,reasonIndex:3,functionTex:'f(x)=\\sin^{-1}x',intervalTex:'[-2,1]',hypothesisSteps:['Inverse sine has real domain \\([-1,1]\\). The function is not defined on the part of the stated interval from \\(-2\\) to \\(-1\\), so neither required hypothesis holds on the full interval.']});
  if(family==='cube-root')return u3TheoremProblem({id:'u3-v122-mvt-fail-cuberoot',variant:'mvt_radical_fails_differentiability',theorem:'mvt',applies:false,reasonIndex:2,functionTex:'f(x)=\\sqrt[3]{x}',intervalTex:'[-1,1]',hypothesisSteps:['The cube-root function is continuous on \\([-1,1]\\). However, \\(f\'(x)=\\frac1{3x^{2/3}}\\) is undefined at the interior point \\(x=0\\), so the differentiability condition fails.']});
  if(family==='rational')return u3MvtFails();
  if(family==='logarithmic')return u3TheoremProblem({id:'u3-v122-mvt-fail-log',variant:'mvt_logarithmic_fails',theorem:'mvt',applies:false,reasonIndex:1,functionTex:'f(x)=\\ln(x+1)',intervalTex:'[-1,2]',hypothesisSteps:['At the left endpoint, \\(f(-1)=\\ln0\\) is undefined. The function is differentiable on \\((-1,2)\\), but it is not continuous on the full closed interval.']});
  if(family==='secant-pole')return u3TheoremProblem({id:'u3-v124-mvt-fail-secant',variant:'mvt_secant_pole_fails',theorem:'mvt',applies:false,reasonIndex:3,functionTex:'f(x)=\\sec x',intervalTex:'[0,\\pi]',hypothesisSteps:['The function is undefined at \\(x=\\frac{\\pi}{2}\\), an interior point. It is therefore not continuous on the closed interval or differentiable throughout the open interval.']});
  if(family==='logarithmic-hole')return u3TheoremProblem({id:'u3-v124-mvt-fail-log-hole',variant:'mvt_logarithmic_composition_hole_fails',theorem:'mvt',applies:false,reasonIndex:3,functionTex:'f(x)=\\ln((x-1)^2)',intervalTex:'[0,2]',hypothesisSteps:['At the interior point \\(x=1\\), the logarithm has input \\(0\\), so the function is undefined. The required continuity and differentiability conditions both fail there.']});
  if(family==='radical-quotient')return u3TheoremProblem({id:'u3-v124-mvt-fail-radical-quotient',variant:'mvt_radical_quotient_pole_fails',theorem:'mvt',applies:false,reasonIndex:3,functionTex:'f(x)=\\frac{\\sqrt{x+1}}{x-1}',intervalTex:'[-1,2]',hypothesisSteps:['Although the square root is real on the interval, the denominator is zero at the interior point \\(x=1\\). The resulting vertical asymptote breaks continuity and differentiability.']});
  return u3TheoremProblem({id:'u3-v122-mvt-fail-abs',variant:'mvt_absolute_value_fails',theorem:'mvt',applies:false,reasonIndex:2,functionTex:'f(x)=|2x-1|',intervalTex:'[-1,2]',hypothesisSteps:['The absolute-value function is continuous on the closed interval. Its graph has a corner at \\(x=\\frac12\\), so it is not differentiable throughout the open interval.']});
}
function u3RolleFailsV122(){
  const family=pick(['trigonometric','exponential','rational','radical','logarithmic','inverse-trigonometric','cusp','secant-pole','logarithmic-endpoint']);
  if(family==='trigonometric')return u3TheoremProblem({id:'u3-v122-rolle-fail-sin',variant:'rolle_trigonometric_fails_endpoints',theorem:'rolle',applies:false,reasonIndex:4,functionTex:'f(x)=\\sin x',intervalTex:'[0,\\frac{\\pi}{2}]',hypothesisSteps:['Sine is continuous and differentiable where required, but \\(f(0)=0\\) and \\(f(\\frac{\\pi}{2})=1\\). The endpoint values are not equal.']});
  if(family==='exponential')return u3TheoremProblem({id:'u3-v122-rolle-fail-exp',variant:'rolle_exponential_fails_endpoints',theorem:'rolle',applies:false,reasonIndex:4,functionTex:'f(x)=e^x',intervalTex:'[0,1]',hypothesisSteps:['The exponential function is continuous and differentiable, but \\(f(0)=1\\) while \\(f(1)=e\\). The endpoint values are not equal.']});
  if(family==='inverse-trigonometric')return u3TheoremProblem({id:'u3-v122-rolle-fail-asin',variant:'rolle_inverse_trigonometric_fails',theorem:'rolle',applies:false,reasonIndex:3,functionTex:'f(x)=\\sin^{-1}x',intervalTex:'[-2,2]',hypothesisSteps:['Inverse sine is not real outside \\([-1,1]\\), so it is not defined on the full closed interval and fails the continuity and differentiability requirements.']});
  if(family==='logarithmic')return u3TheoremProblem({id:'u3-v122-rolle-fail-log',variant:'rolle_logarithmic_fails',theorem:'rolle',applies:false,reasonIndex:1,functionTex:'f(x)=\\ln x',intervalTex:'[0,1]',hypothesisSteps:['The function is undefined at the left endpoint \\(x=0\\), so it is not continuous on the closed interval.']});
  if(family==='cusp')return u3TheoremProblem({id:'u3-v124-rolle-fail-cusp',variant:'rolle_cusp_fails_differentiability',theorem:'rolle',applies:false,reasonIndex:2,functionTex:'f(x)=x^{2/3}',intervalTex:'[-1,1]',hypothesisSteps:['The function is continuous and its endpoint values agree: \\(f(-1)=1=f(1)\\). However, the graph has a cusp at \\(x=0\\), so the function is not differentiable throughout the open interval.']});
  if(family==='secant-pole')return u3TheoremProblem({id:'u3-v124-rolle-fail-secant',variant:'rolle_secant_pole_fails',theorem:'rolle',applies:false,reasonIndex:3,functionTex:'f(x)=\\sec x',intervalTex:'[-\\pi,\\pi]',hypothesisSteps:['The endpoint values agree: \\(f(-\\pi)=-1=f(\\pi)\\). But the function is undefined at \\(x=-\\frac{\\pi}{2}\\) and \\(x=\\frac{\\pi}{2}\\), so continuity and differentiability fail inside the interval.']});
  if(family==='logarithmic-endpoint')return u3TheoremProblem({id:'u3-v124-rolle-fail-log-composition',variant:'rolle_logarithmic_composition_endpoint_fails',theorem:'rolle',applies:false,reasonIndex:1,functionTex:'f(x)=\\ln(x+1)',intervalTex:'[-1,1]',hypothesisSteps:['At the left endpoint, the logarithm has input \\(0\\), so \\(f(-1)\\) is undefined. The function is not continuous on the full closed interval, and Rolle’s Theorem cannot apply.']});
  return u3RolleFails();
}

/* Keep recognizable theorem families and templates from repeating in a short
 * practice run. Applicability is selected first, so this only varies the
 * presentation within the already-approved theorem/applicability bucket. */
const U3_THEOREM_RECENT={families:[],outers:[],patterns:[],templates:[]};
function u3TheoremVarietyKeys(problem){
  const variant=String(problem?.variant||'unknown');
  const tex=String(problem?.functionTex||'');
  let family='polynomial';
  if(/inverse_trigonometric/.test(variant)||/\\(?:sin|cos|tan)\^{-1}/.test(tex))family='inverse trigonometric';
  else if(/logarithm|logarithmic/.test(variant)||/\\ln/.test(tex))family='logarithmic';
  else if(/exponential/.test(variant)||/e\^/.test(tex))family='exponential';
  else if(/trigonometric|sine|cosine|secant/.test(variant)||/\\(?:sin|cos|tan|sec)/.test(tex))family='trigonometric';
  else if(/radical|root|cuberoot/.test(variant)||/\\sqrt/.test(tex))family='radical';
  else if(/rational|reciprocal|quotient|removable/.test(variant)||/\\frac/.test(tex))family='rational';
  else if(/absolute/.test(variant))family='absolute value';
  let pattern='direct';
  if(/hole|pole|domain|endpoint/.test(variant))pattern='domain restriction';
  else if(/cusp|absolute|cuberoot/.test(variant))pattern='nondifferentiable point';
  else if(/composition/.test(variant))pattern='composition';
  else if(/product/.test(variant))pattern='product';
  else if(/quotient|rational|reciprocal/.test(variant))pattern='quotient';
  else if(/combination/.test(variant))pattern='sum';
  let outer=family;
  if(pattern==='product')outer='product';
  else if(pattern==='quotient')outer='quotient';
  else if(family==='trigonometric'){
    if(/secant/.test(variant)||/\\sec/.test(tex))outer='secant';
    else if(/tangent|_tan/.test(variant)||/\\tan/.test(tex))outer='tangent';
    else if(/cosine|_cos/.test(variant)||/\\cos/.test(tex))outer='cosine';
    else outer='sine';
  }
  return{family,outer,pattern,template:variant};
}
function u3TheoremCandidate(theorem,applies){
  return theorem==='rolle'
    ?(applies?(R()<.8?u3RolleAppliesV122():u3RolleApplies()):(R()<.8?u3RolleFailsV122():u3RolleFails()))
    :(applies?(R()<.8?u3MvtAppliesV122():u3MvtApplies()):(R()<.8?u3MvtFailsV122():u3MvtFails()));
}
function u3VariedTheoremProblem(theorem,applies){
  let selected=null,selectedKeys=null,bestScore=Infinity;
  for(let attempt=0;attempt<384;attempt++){
    const candidate=u3TheoremCandidate(theorem,applies),keys=u3TheoremVarietyKeys(candidate);
    const familyConflict=U3_THEOREM_RECENT.families.includes(keys.family);
    const outerConflict=U3_THEOREM_RECENT.outers.includes(keys.outer);
    const patternConflict=U3_THEOREM_RECENT.patterns.includes(keys.pattern);
    const templateConflict=U3_THEOREM_RECENT.templates.includes(keys.template);
    /* Family and exact template are the strongest visual signals of a repeat.
     * Give them lexicographic-style weight, then use outer function and
     * composition pattern to break ties among otherwise fresh candidates. */
    const score=(familyConflict?100:0)+(templateConflict?50:0)+(outerConflict?25:0)+(patternConflict?10:0);
    if(score<bestScore){selected=candidate;selectedKeys=keys;bestScore=score;}
    if(score===0)break;
  }
  /* Applicability is deliberately never changed to avoid a repeat. The
   * recent-history pass only chooses a less familiar presentation within the
   * already-selected theorem/applicability bucket. */
  selected.theoremFunctionFamily=selectedKeys.family;
  selected.theoremOuterFunction=selectedKeys.outer;
  selected.theoremCompositionPattern=selectedKeys.pattern;
  selected.theoremTemplateSignature=selectedKeys.template;
  U3_THEOREM_RECENT.families.push(selectedKeys.family);
  U3_THEOREM_RECENT.outers.push(selectedKeys.outer);
  U3_THEOREM_RECENT.patterns.push(selectedKeys.pattern);
  U3_THEOREM_RECENT.templates.push(selectedKeys.template);
  while(U3_THEOREM_RECENT.families.length>5)U3_THEOREM_RECENT.families.shift();
  while(U3_THEOREM_RECENT.outers.length>3)U3_THEOREM_RECENT.outers.shift();
  while(U3_THEOREM_RECENT.patterns.length>4)U3_THEOREM_RECENT.patterns.shift();
  while(U3_THEOREM_RECENT.templates.length>9)U3_THEOREM_RECENT.templates.shift();
  return selected;
}
U3['rolle-s-theorem-and-the-mean-value-theorem']=function(opts){
  opts=opts||{};
  const focus=opts.mvtMode||opts.mode||'both';
  const theorem=focus==='rolle'?'rolle':(focus==='mvt'||focus==='theorem'?'mvt':(R()<.5?'mvt':'rolle'));
  const applies=R()<.75;
  const problem=u3VariedTheoremProblem(theorem,applies);
  const source=R()<.15?'test':'assignment';
  return stamp(problem,'rolle-s-theorem-and-the-mean-value-theorem','noncalculator',source,problem.variant);
};

/* 14. L'Hopital's Rule — identify the form first, then evaluate when valid. */
const U3_LHOPITAL_CHOICES=[
  'Yes, because direct substitution gives \\(\\frac{0}{0}\\)',
  'Yes, because direct substitution gives \\(\\frac{\\infty}{\\infty}\\)',
  'Yes, after rewriting the indeterminate product \\(0\\cdot\\infty\\) as a quotient',
  "No, because direct substitution does not give an indeterminate form handled by L'Hopital's Rule"
];
function u3LimitDisplay(approach,expression){
  return '<div class="u3-limit-display">\\[\\displaystyle\\lim\\limits_{'+approach+'} '+expression+'\\]</div>';
}
function u3LhopitalClearStep(step){
  return String(step)
    .replace(/^Differentiate the numerator and denominator to obtain /,'Separately differentiate the numerator and denominator to get ')
    .replace(/^Differentiate the numerator and denominator to get /,'Separately differentiate the numerator and denominator to get ')
    .replace(/^Differentiate the numerator and denominator: /,'Separately differentiate the numerator and denominator to get ')
    .replace(/^Differentiate numerator and denominator to get /,'Separately differentiate the numerator and denominator to get ')
    .replace(/^Differentiate numerator and denominator: /,'Separately differentiate the numerator and denominator to get ')
    .replace(/^Differentiate to obtain /,'Separately differentiate the numerator and denominator to get ')
    .replace(/^Differentiate to get /,'Separately differentiate the numerator and denominator to get ')
    .replace(/^Differentiate once: /,'Separately differentiate the numerator and denominator to get ')
    .replace(/^Differentiate a second time: /,'Separately differentiate the numerator and denominator again to get ')
    .replace(/^Differentiate again: /,'Separately differentiate the numerator and denominator again to get ')
    .replace(/^Differentiate: /,'Separately differentiate the numerator and denominator to get ')
    .replace(/^Use the chain rule on the numerator: /,'Separately differentiate the numerator and denominator, using the chain rule in the numerator, to get ')
    .replace(/^Apply L'Hopital's Rule: /,'Separately differentiate the numerator and denominator to get ')
    .replace('Differentiate with respect to \\(u\\): ','Separately differentiate the numerator and denominator with respect to \\(u\\) to get ');
}
function u3RepeatedPolynomialExpSteps(n){
  const steps=[];
  for(let round=1;round<=n;round++){
    const coefficient=u3Factorial(n)/u3Factorial(n-round),power=n-round;
    const numerator=power===0?String(coefficient):(coefficient===1?'':String(coefficient))+(power===1?'x':'x^{'+power+'}');
    const quotient='\\frac{'+numerator+'}{e^x}';
    if(round<n)steps.push('Separately differentiate the numerator and denominator to get \\('+quotient+'\\). As \\(x\\to\\infty\\), this is still the indeterminate form \\(\\frac{\\infty}{\\infty}\\), so apply L\'Hopital\'s Rule again.');
    else steps.push('Separately differentiate the numerator and denominator to get \\('+quotient+'\\). The numerator is constant while \\(e^x\\to\\infty\\), so the limit is \\(0\\).');
  }
  return steps;
}
function u3LhopitalProblem(spec){
  const reasonIndex=spec.form==='zero'?0:spec.form==='infinity'?1:spec.form==='product'?2:3;
  const applies=reasonIndex<3;
  return {
    id:spec.id,
    variant:spec.variant,
    answerType:'staged-calculus',
    stagedFamily:'lhopital',
    lhopitalForm:spec.form,
    lhopitalApplies:applies,
    questionHtml:'<div class="u3-staged-question"><div class="question-prompt">Consider the limit.</div>'+u3LimitDisplay(spec.approach,spec.expression)+'</div>',
    stage1:{
      type:'choice',
      prompt:"Part 1: Does L'Hopital's Rule apply to the expression as written, or after the indicated product is rewritten?",
      choices:U3_LHOPITAL_CHOICES,
      correctIndex:reasonIndex,
      answerTex:U3_LHOPITAL_CHOICES[reasonIndex],
      answerIsText:true,
      correctFeedback:"The decision about L'Hopital's Rule and the indeterminate form is correct.",
      incorrectFeedback:"That decision about L'Hopital's Rule is not correct.",
      explanation:u3WorkedSteps(spec.formSteps),
      explainOnCorrect:false,
      autoAdvanceOnCorrect:true
    },
    stage2:applies?{
      type:'exact',
      prompt:'Part 2: Evaluate the limit.',
      numericAnswer:spec.answerValue,
      answerTex:spec.answerTex,
      requireExact:false,
      tolerance:1e-7,
      placeholder:'Enter the limit',
      checkLabel:'Check Part 2',
      keypadMode:'unit3-limit',
      correctFeedback:'The limit is correct.',
      incorrectFeedback:'That exact limit is not correct.',
      explanation:u3WorkedSteps((spec.limitSteps||[]).map(u3LhopitalClearStep))
    }:null,
    answerTex:applies?spec.answerTex:U3_LHOPITAL_CHOICES[reasonIndex],
    fullWidthChoices:true
  };
}
function u3LhopitalZero(){
  const family=pick(['sine','exponential','logarithm','cosine','radical','polynomial','tan-sine','second-order-exponential']);
  if(family==='sine'){
    const k=ri(1,6);
    return u3LhopitalProblem({id:'u3-lh-zero-sin-'+k,variant:'lhopital_zero_sine',form:'zero',approach:'x\\to0',expression:'\\frac{\\sin('+k+'x)}{x}',answerValue:k,answerTex:String(k),
      formSteps:['Direct substitution gives \\(\\frac{\\sin0}{0}=\\frac00\\), so the quotient has the indeterminate form \\(0/0\\).'],
      limitSteps:['Separately differentiate the numerator and denominator to get \\(\\frac{'+k+'\\cos('+k+'x)}{1}='+k+'\\cos('+k+'x)\\).','Now substitute \\(x=0\\): \\('+k+'\\cos0='+k+'\\).']});
  }
  if(family==='exponential'){
    const k=ri(1,5);
    return u3LhopitalProblem({id:'u3-lh-zero-exp-'+k,variant:'lhopital_zero_exponential',form:'zero',approach:'x\\to0',expression:'\\frac{e^{'+k+'x}-1}{x}',answerValue:k,answerTex:String(k),
      formSteps:['Direct substitution gives \\(\\frac{e^0-1}{0}=\\frac00\\).'],
      limitSteps:['Differentiate the numerator and denominator to obtain \\(\\frac{'+k+'e^{'+k+'x}}{1}\\).','Substituting \\(x=0\\) gives \\('+k+'e^0='+k+'\\).']});
  }
  if(family==='logarithm'){
    const k=ri(1,6);
    return u3LhopitalProblem({id:'u3-lh-zero-log-'+k,variant:'lhopital_zero_logarithm',form:'zero',approach:'x\\to0',expression:'\\frac{\\ln(1+'+k+'x)}{x}',answerValue:k,answerTex:String(k),
      formSteps:['Direct substitution gives \\(\\frac{\\ln1}{0}=\\frac00\\).'],
      limitSteps:['Separately differentiate the numerator and denominator to get \\(\\frac{\\frac{'+k+'}{1+'+k+'x}}{1}=\\frac{'+k+'}{1+'+k+'x}\\).','At \\(x=0\\), the new quotient equals \\('+k+'\\).']});
  }
  if(family==='cosine'){
    const k=ri(1,5),answer=Q(k*k,2);
    return u3LhopitalProblem({id:'u3-lh-zero-cos-'+k,variant:'lhopital_zero_cosine',form:'zero',approach:'x\\to0',expression:'\\frac{1-\\cos('+k+'x)}{x^2}',answerValue:u3QValue(answer),answerTex:qTex(answer),
      formSteps:['Direct substitution gives \\(\\frac{1-\\cos0}{0^2}=\\frac00\\).'],
      limitSteps:['Separately differentiate the numerator and denominator to get \\(\\frac{'+k+'\\sin('+k+'x)}{2x}\\). Substitution still gives \\(\\frac00\\), so apply the rule again.','Separately differentiate the numerator and denominator again to get \\(\\frac{'+(k*k)+'\\cos('+k+'x)}{2}\\). Substituting \\(x=0\\) gives \\('+qTex(answer)+'\\).']});
  }
  if(family==='radical'){
    const r=ri(2,6),c=r*r,answer=Q(1,2*r);
    return u3LhopitalProblem({id:'u3-lh-zero-root-'+r,variant:'lhopital_zero_radical',form:'zero',approach:'x\\to0',expression:'\\frac{\\sqrt{x+'+c+'}-'+r+'}{x}',answerValue:u3QValue(answer),answerTex:qTex(answer),
      formSteps:['Direct substitution gives \\(\\frac{\\sqrt{'+c+'}-'+r+'}{0}=\\frac00\\).'],
      limitSteps:['Separately differentiate the numerator and denominator to get \\(\\frac{\\frac{1}{2\\sqrt{x+'+c+'}}}{1}=\\frac{1}{2\\sqrt{x+'+c+'}}\\).','At \\(x=0\\), the limit is \\(\\frac{1}{2\\sqrt{'+c+'}}='+qTex(answer)+'\\).']});
  }
  if(family==='polynomial'){
    const n=ri(2,5),a=ri(1,3),answer=n*a**(n-1);
    return u3LhopitalProblem({id:'u3-lh-zero-power-'+n+'-'+a,variant:'lhopital_zero_polynomial',form:'zero',approach:'x\\to'+a,expression:'\\frac{x^'+n+'-'+(a**n)+'}{x-'+a+'}',answerValue:answer,answerTex:String(answer),
      formSteps:['At \\(x='+a+'\\), both the numerator and denominator equal zero, so the form is \\(0/0\\).'],
      limitSteps:['Differentiate to get \\(\\frac{'+n+'x^{'+(n-1)+'}}{1}\\).','Substitute \\(x='+a+'\\): \\('+n+'('+a+')^{'+(n-1)+'}='+answer+'\\).']});
  }
  if(family==='tan-sine'){
    const k=ri(1,5),m=ri(1,5),answer=Q(k,m);
    return u3LhopitalProblem({id:'u3-lh-zero-tan-sin-'+k+'-'+m,variant:'lhopital_zero_trig_quotient',form:'zero',approach:'x\\to0',expression:'\\frac{\\tan('+k+'x)}{\\sin('+m+'x)}',answerValue:u3QValue(answer),answerTex:qTex(answer),
      formSteps:['Direct substitution gives \\(\\frac{\\tan0}{\\sin0}=\\frac00\\).'],
      limitSteps:['Differentiate the numerator and denominator: \\(\\frac{'+k+'\\sec^2('+k+'x)}{'+m+'\\cos('+m+'x)}\\).','Substitution at \\(x=0\\) gives \\('+qTex(answer)+'\\).']});
  }
  return u3LhopitalProblem({id:'u3-lh-zero-exp-second',variant:'lhopital_zero_repeated_exponential',form:'zero',approach:'x\\to0',expression:'\\frac{e^x-1-x}{x^2}',answerValue:.5,answerTex:'\\frac12',
    formSteps:['Direct substitution gives \\(\\frac{1-1-0}{0}=\\frac00\\).'],
    limitSteps:['Separately differentiate the numerator and denominator to get \\(\\frac{e^x-1}{2x}\\). At \\(x=0\\), this is still \\(\\frac00\\).','Separately differentiate the numerator and denominator again to get \\(\\frac{e^x}{2}\\). Substituting \\(x=0\\) gives \\(\\frac12\\).']});
}
function u3LhopitalInfinity(){
  const family=pick(['polynomial','polynomial-exponential','log-power','exponential-ratio','log-ratio','radical-ratio']);
  if(family==='polynomial'){
    const n=ri(2,5),a=ri(1,6),b=ri(1,6),p=ri(-8,8),q=ri(-8,8),answer=Q(a,b);
    return u3LhopitalProblem({id:'u3-lh-inf-poly-'+n+'-'+a+'-'+b+'-'+p+'-'+q,variant:'lhopital_infinity_polynomial',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{'+(sgn(a,'x^'+n,true)+sgn(p,'x'))+'}{'+(sgn(b,'x^'+n,true)+sgn(q,''))+'}',answerValue:u3QValue(answer),answerTex:qTex(answer),
      formSteps:['The numerator and denominator both grow without bound as \\(x\\to\\infty\\), so the form is \\(\\infty/\\infty\\).'],
      limitSteps:['Differentiate numerator and denominator: \\(\\frac{'+(a*n)+'x^{'+(n-1)+'}'+(p<0?'':'+')+p+'}{'+(b*n)+'x^{'+(n-1)+'}}\\).','The highest-power terms determine the new quotient, so the limit is \\(\\frac{'+(a*n)+'}{'+(b*n)+'}='+qTex(answer)+'\\).']});
  }
  if(family==='polynomial-exponential'){
    const n=ri(2,5);
    return u3LhopitalProblem({id:'u3-lh-inf-poly-exp-'+n,variant:'lhopital_infinity_polynomial_exponential',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{x^'+n+'}{e^x}',answerValue:0,answerTex:'0',
      formSteps:['Both \\(x^'+n+'\\) and \\(e^x\\) approach infinity, so the quotient has the form \\(\\infty/\\infty\\).'],
      limitSteps:u3RepeatedPolynomialExpSteps(n)});
  }
  if(family==='log-power'){
    const n=ri(1,4);
    return u3LhopitalProblem({id:'u3-lh-inf-log-power-'+n,variant:'lhopital_infinity_log_power',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{\\ln x}{x^'+n+'}',answerValue:0,answerTex:'0',
      formSteps:['Both \\(\\ln x\\) and \\(x^'+n+'\\) approach infinity, so the form is \\(\\infty/\\infty\\).'],
      limitSteps:['Differentiate once: \\(\\frac{1/x}{'+n+'x^{'+(n-1)+'}}=\\frac{1}{'+n+'x^'+n+'}\\).','That expression approaches \\(0\\) as \\(x\\to\\infty\\).']});
  }
  if(family==='exponential-ratio'){
    const a=ri(1,6),b=ri(1,6),k=ri(1,4),answer=Q(a,b);
    return u3LhopitalProblem({id:'u3-lh-inf-exp-ratio-'+a+'-'+b+'-'+k,variant:'lhopital_infinity_exponential_ratio',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{'+a+'e^{'+k+'x}+1}{'+b+'e^{'+k+'x}+2}',answerValue:u3QValue(answer),answerTex:qTex(answer),
      formSteps:['The exponential terms make both numerator and denominator approach infinity, so the form is \\(\\infty/\\infty\\).'],
      limitSteps:['Differentiate: \\(\\frac{'+(a*k)+'e^{'+k+'x}}{'+(b*k)+'e^{'+k+'x}}\\).','Cancel the common exponential factor to get \\('+qTex(answer)+'\\).']});
  }
  if(family==='log-ratio'){
    const m=ri(2,5),n=ri(2,5),answer=Q(m,n);
    return u3LhopitalProblem({id:'u3-lh-inf-log-ratio-'+m+'-'+n,variant:'lhopital_infinity_log_ratio',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{\\ln(x^'+m+'+1)}{\\ln(x^'+n+'+1)}',answerValue:u3QValue(answer),answerTex:qTex(answer),
      formSteps:['Each logarithm approaches infinity, so the quotient has the form \\(\\infty/\\infty\\).'],
      limitSteps:['Differentiate to obtain \\(\\frac{'+m+'x^{'+(m-1)+'}/(x^'+m+'+1)}{'+n+'x^{'+(n-1)+'}/(x^'+n+'+1)}\\).','After simplifying the dominant powers as \\(x\\to\\infty\\), the limit is \\('+qTex(answer)+'\\).']});
  }
  const a=ri(2,8),b=ri(2,8),answer=Math.sqrt(a/b);
  return u3LhopitalProblem({id:'u3-lh-inf-root-ratio-'+a+'-'+b,variant:'lhopital_infinity_radical_ratio',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{\\sqrt{'+a+'x^2+1}}{\\sqrt{'+b+'x^2+1}}',answerValue:answer,answerTex:'\\sqrt{\\frac{'+a+'}{'+b+'}}',
    formSteps:['Both radicals approach infinity, so the quotient has the form \\(\\infty/\\infty\\).'],
    limitSteps:['Differentiate to get \\(\\frac{'+a+'x/\\sqrt{'+a+'x^2+1}}{'+b+'x/\\sqrt{'+b+'x^2+1}}\\).','Cancel \\(x\\) and evaluate the remaining radical ratio as \\(x\\to\\infty\\), giving \\(\\sqrt{\\frac{'+a+'}{'+b+'}}\\).']});
}
function u3LhopitalProduct(){
  const family=pick(['power-log','exponential-decay','tangent-endpoint','shifted-log','log-reciprocal']);
  if(family==='power-log'){
    const n=ri(1,4);
    return u3LhopitalProblem({id:'u3-lh-product-power-log-'+n,variant:'lhopital_product_power_log',form:'product',approach:'x\\to0^+',expression:'x^'+n+'\\ln x',answerValue:0,answerTex:'0',
      formSteps:['As \\(x\\to0^+\\), \\(x^'+n+'\\to0\\) and \\(\\ln x\\to-\\infty\\), so the product has the indeterminate form \\(0\\cdot\\infty\\).','Rewrite it as \\(\\frac{\\ln x}{1/x^'+n+'}\\), which has an infinite-over-infinite form.'],
      limitSteps:['Apply L\'Hopital\'s Rule: \\(\\frac{1/x}{-'+n+'/x^{'+(n+1)+'}}=-\\frac{x^'+n+'}{'+n+'}\\).','As \\(x\\to0^+\\), this approaches \\(0\\).']});
  }
  if(family==='exponential-decay'){
    const n=ri(1,4);
    return u3LhopitalProblem({id:'u3-lh-product-exp-decay-'+n,variant:'lhopital_product_exponential_decay',form:'product',approach:'x\\to\\infty',expression:'x^'+n+'e^{-x}',answerValue:0,answerTex:'0',
      formSteps:['As \\(x\\to\\infty\\), \\(x^'+n+'\\to\\infty\\) and \\(e^{-x}\\to0\\), so the product is an indeterminate \\(0\\cdot\\infty\\) form.','Rewrite it as \\(\\frac{x^'+n+'}{e^x}\\), which has the form \\(\\infty/\\infty\\).'],
      limitSteps:u3RepeatedPolynomialExpSteps(n)});
  }
  if(family==='tangent-endpoint')return u3LhopitalProblem({id:'u3-lh-product-tan-endpoint',variant:'lhopital_product_trigonometric',form:'product',approach:'x\\to(\\pi/2)^-',expression:'(\\frac{\\pi}{2}-x)\\tan x',answerValue:1,answerTex:'1',
    formSteps:['The first factor approaches \\(0\\), while \\(\\tan x\\to\\infty\\), so this is an indeterminate \\(0\\cdot\\infty\\) product.','Let \\(u=\\frac{\\pi}{2}-x\\). Rewrite the expression as \\(u\\cot u=\\frac{u}{\\tan u}\\), a \\(0/0\\) quotient.'],
    limitSteps:['Separately differentiate the numerator and denominator in \\(\\frac{u}{\\tan u}\\) to get \\(\\frac{1}{\\sec^2u}\\).','As \\(u\\to0^+\\), this approaches \\(1\\).']});
  if(family==='shifted-log')return u3LhopitalProblem({id:'u3-lh-product-shifted-log',variant:'lhopital_product_shifted_log',form:'product',approach:'x\\to1^-',expression:'(1-x)\\ln(1-x)',answerValue:0,answerTex:'0',
    formSteps:['As \\(x\\to1^-\\), \\(1-x\\to0^+\\) and \\(\\ln(1-x)\\to-\\infty\\), so the product is an indeterminate \\(0\\cdot\\infty\\) form.','Rewrite it as \\(\\frac{\\ln(1-x)}{1/(1-x)}\\).'],
    limitSteps:['Differentiate numerator and denominator: \\(\\frac{-1/(1-x)}{1/(1-x)^2}=-(1-x)\\).','As \\(x\\to1^-\\), this approaches \\(0\\).']});
  return u3LhopitalProblem({id:'u3-lh-product-log-reciprocal',variant:'lhopital_product_log_reciprocal',form:'product',approach:'x\\to\\infty',expression:'\\frac1x\\ln x',answerValue:0,answerTex:'0',
    formSteps:['Here \\(1/x\\to0\\) and \\(\\ln x\\to\\infty\\), so the product has the indeterminate form \\(0\\cdot\\infty\\).','Rewrite it as the quotient \\(\\frac{\\ln x}{x}\\), which has the form \\(\\infty/\\infty\\).'],
    limitSteps:['Differentiate numerator and denominator: \\(\\frac{1/x}{1}=\\frac1x\\).','As \\(x\\to\\infty\\), this approaches \\(0\\).']});
}
function u3LhopitalNo(){
  const family=pick(['finite','zero-over-nonzero','nonzero-over-zero','trig-away','vanishing-reciprocal']);
  if(family==='finite')return u3LhopitalProblem({id:'u3-lh-no-finite',variant:'lhopital_not_indeterminate_finite',form:'none',approach:'x\\to0',expression:'\\frac{x^2+1}{x+2}',formSteps:['Direct substitution gives \\(\\frac{1}{2}\\), not \\(0/0\\) or \\(\\infty/\\infty\\).','Evaluate by direct substitution; L\'Hopital\'s Rule does not apply.']});
  if(family==='zero-over-nonzero')return u3LhopitalProblem({id:'u3-lh-no-zero',variant:'lhopital_not_indeterminate_zero',form:'none',approach:'x\\to0',expression:'\\frac{\\sin x}{x+1}',formSteps:['Direct substitution gives \\(\\frac01=0\\), which is already determined.','Because the form is not indeterminate, L\'Hopital\'s Rule does not apply.']});
  if(family==='nonzero-over-zero')return u3LhopitalProblem({id:'u3-lh-no-infinite',variant:'lhopital_not_indeterminate_nonzero_over_zero',form:'none',approach:'x\\to1^+',expression:'\\frac{x+1}{x-1}',formSteps:['The numerator approaches \\(2\\) while the denominator approaches \\(0^+\\). This is not \\(0/0\\).','The quotient is unbounded from the right, but L\'Hopital\'s Rule does not apply to the nonzero-over-zero form.']});
  if(family==='trig-away')return u3LhopitalProblem({id:'u3-lh-no-trig-away',variant:'lhopital_not_indeterminate_trigonometric',form:'none',approach:'x\\to\\pi',expression:'\\frac{\\sin x}{x}',formSteps:['Direct substitution gives \\(\\frac{0}{\\pi}=0\\).','The denominator is nonzero, so this is not an indeterminate quotient and L\'Hopital\'s Rule does not apply.']});
  return u3LhopitalProblem({id:'u3-lh-no-reciprocal',variant:'lhopital_not_indeterminate_reciprocal',form:'none',approach:'x\\to\\infty',expression:'\\frac{1}{x^2+1}',formSteps:['The numerator approaches \\(1\\) and the denominator approaches infinity, so the quotient approaches \\(0\\).','This is not \\(0/0\\) or \\(\\infty/\\infty\\), so L\'Hopital\'s Rule does not apply.']});
}
function u3LhopitalZeroV122(){
  const family=pick(['inverse-tangent','exp-sine','log-cosine','sine-remainder','radical-linear','log-minus-sine','tan-minus-sine','shifted-log']);
  if(family==='inverse-tangent'){
    const k=ri(2,6);
    return u3LhopitalProblem({id:'u3-v122-lh-atan-'+k,variant:'lhopital_zero_inverse_tangent',form:'zero',approach:'x\\to0',expression:'\\frac{\\tan^{-1}('+k+'x)}{x}',answerValue:k,answerTex:String(k),formSteps:['Direct substitution gives \\(\\frac{\\tan^{-1}(0)}0=\\frac00\\), so L\'Hopital\'s Rule applies.'],limitSteps:['Differentiate the numerator and denominator: \\(\\frac{\\frac{'+k+'}{1+'+(k*k)+'x^2}}1\\).','Substitute \\(x=0\\): \\(\\frac{'+k+'}{1}='+k+'\\).']});
  }
  if(family==='exp-sine'){
    const k=ri(1,5);
    return u3LhopitalProblem({id:'u3-v122-lh-exp-sin-'+k,variant:'lhopital_zero_exponential_trig_composition',form:'zero',approach:'x\\to0',expression:'\\frac{e^{\\sin('+k+'x)}-1}{x}',answerValue:k,answerTex:String(k),formSteps:['At \\(x=0\\), the numerator is \\(e^0-1=0\\) and the denominator is \\(0\\), giving \\(\\frac00\\).'],limitSteps:['Use the chain rule on the numerator: \\(\\frac{'+k+'e^{\\sin('+k+'x)}\\cos('+k+'x)}1\\).','At \\(x=0\\), this becomes \\('+k+'e^0\\cos0='+k+'\\).']});
  }
  if(family==='log-cosine'){
    const k=ri(1,4),answer=Q(-(k*k),2);
    return u3LhopitalProblem({id:'u3-v122-lh-log-cos-'+k,variant:'lhopital_zero_log_trig_composition',form:'zero',approach:'x\\to0',expression:'\\frac{\\ln(\\cos('+k+'x))}{x^2}',answerValue:u3QValue(answer),answerTex:qTex(answer),formSteps:['Direct substitution gives \\(\\frac{\\ln1}{0}=\\frac00\\).'],limitSteps:['Separately differentiate the numerator and denominator to get \\(\\frac{-'+k+'\\tan('+k+'x)}{2x}\\). Substitution still gives \\(\\frac00\\), so apply the rule again.','Separately differentiate the numerator and denominator again to get \\(\\frac{-'+(k*k)+'\\sec^2('+k+'x)}2\\). Substituting \\(x=0\\) gives \\('+qTex(answer)+'\\).']});
  }
  if(family==='sine-remainder'){
    const k=ri(1,4),answer=Q(-(k**3),6);
    return u3LhopitalProblem({id:'u3-v122-lh-sine-rem-'+k,variant:'lhopital_zero_trig_remainder',form:'zero',approach:'x\\to0',expression:'\\frac{\\sin('+k+'x)-'+k+'x}{x^3}',answerValue:u3QValue(answer),answerTex:qTex(answer),formSteps:['Both numerator and denominator approach \\(0\\), so the quotient has form \\(\\frac00\\).'],limitSteps:['Separately differentiate the numerator and denominator to get \\(\\frac{'+k+'\\cos('+k+'x)-'+k+'}{3x^2}\\). Substitution still gives \\(\\frac00\\).','Separately differentiate the numerator and denominator again to get \\(\\frac{-'+(k*k)+'\\sin('+k+'x)}{6x}\\). Substitution still gives \\(\\frac00\\).','Separately differentiate the numerator and denominator a third time to get \\(\\frac{-'+(k**3)+'\\cos('+k+'x)}6\\). Substituting \\(x=0\\) gives \\('+qTex(answer)+'\\).']});
  }
  if(family==='radical-linear'){
    const k=pick([2,3,4,5,6]),answer=Q(k,2);
    return u3LhopitalProblem({id:'u3-v122-lh-root-linear-'+k,variant:'lhopital_zero_radical_composition',form:'zero',approach:'x\\to0',expression:'\\frac{\\sqrt{1+'+k+'x}-1}{x}',answerValue:u3QValue(answer),answerTex:qTex(answer),formSteps:['Substitution gives \\(\\frac{\\sqrt1-1}{0}=\\frac00\\).'],limitSteps:['Differentiate numerator and denominator to get \\(\\frac{'+k+'}{2\\sqrt{1+'+k+'x}}\\).','At \\(x=0\\), the limit is \\('+qTex(answer)+'\\).']});
  }
  if(family==='log-minus-sine'){
    const k=ri(1,4),answer=Q(-(k*k),2);
    return u3LhopitalProblem({id:'u3-v122-lh-log-sin-'+k,variant:'lhopital_zero_logarithmic_trig_difference',form:'zero',approach:'x\\to0',expression:'\\frac{\\ln(1+'+k+'x)-\\sin('+k+'x)}{x^2}',answerValue:u3QValue(answer),answerTex:qTex(answer),formSteps:['The numerator and denominator both approach \\(0\\), giving \\(\\frac00\\).'],limitSteps:['Separately differentiate the numerator and denominator to get \\(\\frac{\\frac{'+k+'}{1+'+k+'x}-'+k+'\\cos('+k+'x)}{2x}\\). Substitution still gives \\(\\frac00\\).','Separately differentiate the numerator and denominator again to get \\(\\frac{-\\frac{'+(k*k)+'}{(1+'+k+'x)^2}+'+(k*k)+'\\sin('+k+'x)}2\\). Substituting \\(x=0\\) gives \\('+qTex(answer)+'\\).']});
  }
  if(family==='tan-minus-sine'){
    const k=ri(1,3),answer=Q(k**3,2);
    return u3LhopitalProblem({id:'u3-v122-lh-tan-sin-diff-'+k,variant:'lhopital_zero_trig_difference',form:'zero',approach:'x\\to0',expression:'\\frac{\\tan('+k+'x)-\\sin('+k+'x)}{x^3}',answerValue:u3QValue(answer),answerTex:qTex(answer),formSteps:['Direct substitution gives \\(\\frac{0-0}{0}=\\frac00\\).'],limitSteps:['Separately differentiate the numerator and denominator to get \\(\\frac{'+k+'\\sec^2('+k+'x)-'+k+'\\cos('+k+'x)}{3x^2}\\). Substitution still gives \\(\\frac00\\).','Separately differentiate the numerator and denominator again to get \\(\\frac{'+2*k*k+'\\sec^2('+k+'x)\\tan('+k+'x)+'+(k*k)+'\\sin('+k+'x)}{6x}\\). Substitution still gives \\(\\frac00\\).','Separately differentiate the numerator and denominator a third time to get \\(\\frac{'+4*k**3+'\\sec^2('+k+'x)\\tan^2('+k+'x)+'+2*k**3+'\\sec^4('+k+'x)+'+(k**3)+'\\cos('+k+'x)}6\\). Substituting \\(x=0\\) gives \\(\\frac{'+(3*k**3)+'}{6}='+qTex(answer)+'\\).']});
  }
  return u3LhopitalProblem({id:'u3-v122-lh-shifted-log',variant:'lhopital_zero_shifted_logarithm',form:'zero',approach:'x\\to1',expression:'\\frac{\\ln x}{x-1}',answerValue:1,answerTex:'1',formSteps:['At \\(x=1\\), the quotient has form \\(\\frac{\\ln1}{0}=\\frac00\\).'],limitSteps:['Differentiate numerator and denominator: \\(\\frac{\\frac1x}{1}=\\frac1x\\).','Substitute \\(x=1\\) to obtain \\(1\\).']});
}
function u3LhopitalInfinityV122(){
  const family=pick(['log-polynomial','exp-polynomial','radical-linear','log-perturbation','linear-trig','mixed-exponentials','inverse-hyperbolic-log']);
  if(family==='log-polynomial')return u3LhopitalProblem({id:'u3-v122-lh-inf-log-poly',variant:'lhopital_infinity_logarithmic_polynomial',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{\\ln(x^2+x)}{\\ln x}',answerValue:2,answerTex:'2',formSteps:['Both logarithms approach infinity, so the quotient has form \\(\\frac{\\infty}{\\infty}\\).'],limitSteps:['Differentiate numerator and denominator: \\(\\frac{\\frac{2x+1}{x^2+x}}{\\frac1x}=\\frac{x(2x+1)}{x^2+x}\\).','Divide numerator and denominator by \\(x^2\\); the limit is \\(2\\).']});
  if(family==='exp-polynomial')return u3LhopitalProblem({id:'u3-v122-lh-inf-exp-poly',variant:'lhopital_infinity_exponential_polynomial_mix',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{e^{3x}+x^2}{e^{3x}+x}',answerValue:1,answerTex:'1',formSteps:['Both numerator and denominator approach infinity, so the form is \\(\\frac{\\infty}{\\infty}\\).'],limitSteps:['Differentiate once: \\(\\frac{3e^{3x}+2x}{3e^{3x}+1}\\).','Divide the new numerator and denominator by \\(e^{3x}\\). The polynomial-over-exponential terms approach \\(0\\), leaving the limit \\(1\\).']});
  if(family==='radical-linear')return u3LhopitalProblem({id:'u3-v122-lh-inf-root-linear',variant:'lhopital_infinity_radical_linear',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{\\sqrt{x^2+x}}{x+1}',answerValue:1,answerTex:'1',formSteps:['The radical and the linear denominator both approach infinity, giving \\(\\frac{\\infty}{\\infty}\\).'],limitSteps:['Differentiate: \\(\\frac{\\frac{2x+1}{2\\sqrt{x^2+x}}}{1}=\\frac{2x+1}{2\\sqrt{x^2+x}}\\).','Divide numerator and the expression under the radical by \\(x\\); as \\(x\\to\\infty\\), the limit is \\(1\\).']});
  if(family==='log-perturbation')return u3LhopitalProblem({id:'u3-v122-lh-inf-log-perturb',variant:'lhopital_infinity_linear_logarithmic_mix',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{x+\\ln x}{x-\\ln x}',answerValue:1,answerTex:'1',formSteps:['Both numerator and denominator approach infinity, so the quotient has form \\(\\frac{\\infty}{\\infty}\\).'],limitSteps:['Differentiate numerator and denominator: \\(\\frac{1+\\frac1x}{1-\\frac1x}\\).','As \\(x\\to\\infty\\), \\(\\frac1x\\to0\\), so the limit is \\(1\\).']});
  if(family==='linear-trig'){
    const a=ri(1,5),b=ri(1,5),answer=Q(a,b);
    return u3LhopitalProblem({id:'u3-v122-lh-inf-linear-trig-'+a+'-'+b,variant:'lhopital_infinity_linear_trigonometric_mix',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{'+a+'x+\\sin(\\ln x)}{'+b+'x+\\cos(\\ln x)}',answerValue:u3QValue(answer),answerTex:qTex(answer),formSteps:['The linear terms make both numerator and denominator approach infinity, so the form is \\(\\frac{\\infty}{\\infty}\\).'],limitSteps:['Differentiate: \\(\\frac{'+a+'+\\frac{\\cos(\\ln x)}x}{'+b+'-\\frac{\\sin(\\ln x)}x}\\).','The trigonometric factors are bounded, so each trigonometric-over-\\(x\\) term approaches \\(0\\). The limit is \\('+qTex(answer)+'\\).']});
  }
  if(family==='mixed-exponentials'){
    const a=pick([2,3,4]),answer=Q(1,a);
    return u3LhopitalProblem({id:'u3-v122-lh-inf-exp-mix-'+a,variant:'lhopital_infinity_exponential_composition',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{e^{2x}+x^3}{'+a+'e^{2x}+x^2}',answerValue:u3QValue(answer),answerTex:qTex(answer),formSteps:['Both numerator and denominator approach infinity, giving \\(\\frac{\\infty}{\\infty}\\).'],limitSteps:['Differentiate once: \\(\\frac{2e^{2x}+3x^2}{'+(2*a)+'e^{2x}+2x}\\).','Divide by \\(e^{2x}\\). The polynomial-over-exponential terms approach \\(0\\), leaving \\(\\frac2{'+(2*a)+'}='+qTex(answer)+'\\).']});
  }
  return u3LhopitalProblem({id:'u3-v122-lh-inf-asinh',variant:'lhopital_infinity_logarithmic_radical_composition',form:'infinity',approach:'x\\to\\infty',expression:'\\frac{\\ln(x+\\sqrt{x^2+1})}{\\ln x}',answerValue:1,answerTex:'1',formSteps:['Both numerator and denominator approach infinity, so the quotient has form \\(\\frac{\\infty}{\\infty}\\).'],limitSteps:['Separately differentiate the numerator and denominator. The numerator derivative simplifies to \\(\\frac1{\\sqrt{x^2+1}}\\), so the new quotient is \\(\\frac{x}{\\sqrt{x^2+1}}\\).','Divide numerator and denominator by \\(x\\). The limit is \\(1\\).']});
}
function u3LhopitalProductV122(){
  const family=pick(['x-log-sine','square-cotangent','endpoint-log-cosine','root-exponential']);
  if(family==='x-log-sine')return u3LhopitalProblem({id:'u3-v122-lh-product-log-sine',variant:'lhopital_product_logarithmic_trig',form:'product',approach:'x\\to0^+',expression:'x\\ln(\\sin x)',answerValue:0,answerTex:'0',formSteps:['As \\(x\\to0^+\\), \\(x\\to0\\) and \\(\\ln(\\sin x)\\to-\\infty\\), giving the indeterminate product \\(0\\cdot\\infty\\).','Rewrite it as \\(\\frac{\\ln(\\sin x)}{\\frac1x}\\), which has form \\(\\frac{\\infty}{\\infty}\\).'],limitSteps:['Apply L\'Hopital\'s Rule: \\(\\frac{\\cot x}{-\\frac1{x^2}}=-x^2\\cot x\\).','Write \\(-x^2\\cot x=-x\\frac{x\\cos x}{\\sin x}\\). The ratio approaches \\(1\\) while \\(x\\to0\\), so the limit is \\(0\\).']});
  if(family==='square-cotangent')return u3LhopitalProblem({id:'u3-v122-lh-product-square-cot',variant:'lhopital_product_trigonometric',form:'product',approach:'x\\to0^+',expression:'x^2\\cot x',answerValue:0,answerTex:'0',formSteps:['Here \\(x^2\\to0\\) and \\(\\cot x\\to\\infty\\), so the product is indeterminate. Rewrite it as \\(\\frac{x^2}{\\tan x}\\), a \\(\\frac00\\) quotient.'],limitSteps:['Differentiate numerator and denominator: \\(\\frac{2x}{\\sec^2x}=2x\\cos^2x\\).','As \\(x\\to0^+\\), this approaches \\(0\\).']});
  if(family==='endpoint-log-cosine')return u3LhopitalProblem({id:'u3-v122-lh-product-end-log',variant:'lhopital_product_endpoint_logarithm',form:'product',approach:'x\\to(\\pi/2)^-',expression:'(\\frac{\\pi}{2}-x)\\ln(\\cos x)',answerValue:0,answerTex:'0',formSteps:['The first factor approaches \\(0\\) while \\(\\ln(\\cos x)\\to-\\infty\\), so the product is indeterminate. Let \\(u=\\frac{\\pi}{2}-x\\); then the expression becomes \\(u\\ln(\\sin u)\\).','Rewrite it as \\(\\frac{\\ln(\\sin u)}{\\frac1u}\\), which has form \\(\\frac{\\infty}{\\infty}\\).'],limitSteps:['Differentiate with respect to \\(u\\): \\(\\frac{\\cot u}{-\\frac1{u^2}}=-u^2\\cot u\\).','As \\(u\\to0^+\\), this approaches \\(0\\).']});
  return u3LhopitalProblem({id:'u3-v122-lh-product-root-exp',variant:'lhopital_product_radical_exponential',form:'product',approach:'x\\to\\infty',expression:'xe^{-\\sqrt{x}}',answerValue:0,answerTex:'0',formSteps:['As \\(x\\to\\infty\\), \\(x\\to\\infty\\) and \\(e^{-\\sqrt{x}}\\to0\\), giving an indeterminate product. Rewrite it as \\(\\frac{x}{e^{\\sqrt{x}}}\\), an \\(\\frac{\\infty}{\\infty}\\) quotient.'],limitSteps:['Separately differentiate the numerator and denominator to get \\(\\frac{1}{\\frac{e^{\\sqrt{x}}}{2\\sqrt{x}}}=\\frac{2\\sqrt{x}}{e^{\\sqrt{x}}}\\). This is still \\(\\frac{\\infty}{\\infty}\\).','Separately differentiate the numerator and denominator again to get \\(\\frac{\\frac1{\\sqrt{x}}}{\\frac{e^{\\sqrt{x}}}{2\\sqrt{x}}}=\\frac2{e^{\\sqrt{x}}}\\). As \\(x\\to\\infty\\), this approaches \\(0\\).']});
}
U3['l-hopital-s-rule']=function(){
  const source=R()<.15?'test':'assignment';
  let problem;
  if(R()<.20)problem=u3LhopitalNo();
  else{
    const formRoll=R();
    problem=formRoll<.80?(R()<.65?u3LhopitalZeroV122():u3LhopitalZero()):(formRoll<.90?(R()<.75?u3LhopitalInfinityV122():u3LhopitalInfinity()):(R()<.75?u3LhopitalProductV122():u3LhopitalProduct()));
  }
  return stamp(problem,'l-hopital-s-rule','noncalculator',source,problem.variant);
};

/* 15. Optimization — 75% course contexts, 25% comparable extensions. */
function optBox(){
  const side=pick([12,18,24,30,36,42,48,54]),x=side/6,V=x*(side-2*x)**2;
  return mc(`u3-opt-box-${side}`,'course_open_top_box',`Squares of side \\(x\\) are cut from each corner of a \\(${side}\\)-inch square sheet. What cut size maximizes the open box's volume?`,`V(x)=x(${side}-2x)^2`,`x=${fmt(x)}`,[`x=${fmt(side/4)}`,`x=${fmt(side/3)}`,`x=${fmt(side/8)}`],`Differentiate \\(V(x)=x(${side}-2x)^2\\). The interior critical value in \\((0,${side/2})\\) is \\(x=${fmt(x)}\\); the endpoints give zero volume, so this value gives the maximum. The maximum volume is \\(${fmt(V)}\\) cubic inches.`,{formulaGroup:'course'});
}
function optCylinder(){
  const r=ri(2,9),V=2*r**3;
  return mc(`u3-opt-cylinder-${r}`,'course_closed_cylinder',`A closed cylinder must have volume \\(${V}\\pi\\) cubic units. Find the radius that minimizes surface area.`,'',`r=${r}`,[`r=${2*r}`,`r=${r+1}`,`r=${Math.max(1,r-1)}`],`Use \\(h=\\frac{${V}}{r^2}\\) in \\(S=2\\pi r^2+2\\pi rh\\), giving \\(S(r)=2\\pi r^2+\\frac{${2*V}\\pi}{r}\\). Setting \\(S'(r)=0\\) gives \\(r^3=${V/2}\\), so \\(r=${r}\\).`,{formulaGroup:'course'});
}
function optRectangle(){
  const P=4*ri(8,25),x=P/4,area=x*x;
  return mc(`u3-opt-rect-${P}`,'course_rectangle_perimeter',`A rectangle has perimeter \\(${P}\\). What dimensions maximize its area?`,'',`${x}\\text{ by }${x}`,[`${P/3}\\text{ by }${P/6}`,`${P/2}\\text{ by }${P/4}`,`${x-2}\\text{ by }${x+2}`],`Write \\(2x+2y=${P}\\), so \\(A(x)=x(\\frac{${P}}2-x)\\). Its vertex occurs at \\(x=${x}\\), and then \\(y=${x}\\).`,{formulaGroup:'course'});
}
function optExtension(){
  const n=ri(1,8),p=n+.5,x=Math.sqrt(n),xTex=n===1?'1':`\\sqrt{${n}}`;
  return mc(`u3-opt-close-${p}`,'extension_closest_point_parabola',`Find the positive \\(x\\)-coordinate of the point on \\(y=x^2\\) closest to \\((0,${p})\\).`,'',xTex,[fmt(x*x),fmt(p),`\\sqrt{${2*p-1}}`],`Minimize squared distance: \\(D^2=x^2+(x^2-${p})^2\\). Its derivative factors as \\(2x[1+2(x^2-${p})]\\). The positive critical value satisfies \\(x^2=${p-.5}\\), giving \\(x=${xTex}\\).`,{formulaGroup:'extension'});
}
function optTest(){
  const L=pick([12,18,24,30,36,42]),x=L/6;
  return mc(`u3-opt-test-box-${L}`,'test_open_top_box',`A square piece of cardboard is \\(${L}\\) inches on a side. Squares are cut from the corners and the sides are folded up. Which cut size gives maximum volume?`,'',`x=${x}`,[`x=${L/9}`,`x=${L/4}`,`x=${L/3}`],`The model is \\(V=x(${L}-2x)^2\\), for \\(0\\lt x\\lt${L/2}\\). Solving \\(V'(x)=0\\) gives the interior maximum at \\(x=${x}\\); the endpoint value gives zero volume.`,{formulaGroup:'course'});
}
function optCalcCourse(){
  const k=pick([1,2,3]),root=bisect(x=>Math.cos(k*x)-k*x*Math.sin(k*x),.001,Math.PI/(2*k)-.001);
  return numeric(`u3-opt-calc-cos-${k}`,'course_rectangle_under_cosine',`Calculator Active: A rectangle in the first quadrant has upper-right corner on \\(y=\\cos(${k===1?'':k}x)\\) and width \\(x\\), with \\(0\\lt x\\lt\\frac{\\pi}{${2*k}}\\). Find the \\(x\\)-value that maximizes area. Round to three decimals.`,`A(x)=x\\cos(${k===1?'':k}x)`,root,root.toFixed(3),`Differentiate: \\(A'(x)=\\cos(${k===1?'':k}x)-${k===1?'':k}x\\sin(${k===1?'':k}x)\\). A numerical zero finder gives \\(x\\approx${root.toFixed(3)}\\); endpoint area is zero.`,.0006,{formulaGroup:'course'});
}
function optCalcExtension(){
  const p=pick([1.2,1.7,2.3]),r=Math.sqrt((2*p-1)/2);
  return numeric(`u3-opt-calc-ext-close-${p}`,'extension_closest_point',`Calculator Active: Find the positive \\(x\\)-coordinate of the point on \\(y=x^2\\) closest to \\((0,${p})\\). Round to three decimals.`,'',r,r.toFixed(3),`Minimize \\(D^2=x^2+(x^2-${p})^2\\). Then \\((D^2)'=2x[1+2(x^2-${p})]\\). The positive minimizer is \\(x\\approx${r.toFixed(3)}\\).`,.0006,{formulaGroup:'extension'});
}
function optCalcTest(){
  const root=bisect(x=>1+3*x*(x*x*x-1),.5,1);
  return numeric('u3-opt-calc-test-cubic','test_closest_point_cubic',`Calculator Active: Find the positive \\(x\\)-coordinate of the point on \\(y=x^3\\) closest to \\((0,1)\\). Round to three decimals.`,'',root,root.toFixed(3),`Minimize \\(D^2=x^2+(x^3-1)^2\\). For \\(x>0\\), the critical-point equation is \\(1+3x(x^3-1)=0\\). A numerical zero finder gives \\(x\\approx${root.toFixed(3)}\\).`,.0006,{formulaGroup:'course'});
}
function optimization(opts={}){
  const mode=modeOf(opts),source=R()<.15?'test':'assignment',extension=R()<.25;
  let p;
  if(mode==='calculator')p=extension?optCalcExtension():(source==='test'?optCalcTest():optCalcCourse());
  else p=extension?optExtension():(source==='test'?optTest():pick([optBox,optCylinder,optRectangle])());
  p.formulaGroup=p.formulaGroup|| (extension?'extension':'course');return stamp(p,'optimization',mode,source,p.variant);
}
U3.optimization=optimization;

/* 16. Related rates — 75% course contexts, 25% comparable extensions. */
function rrSphere(){
  const r=pick([2,3,5]),dr=pick([1,2,3]),rate=4*Math.PI*r*r*dr;
  return mc(`u3-rr-sphere-${r}-${dr}`,'course_sphere',`The radius of a sphere grows at \\(${dr}\\) unit${dr===1?'':'s'} per second. How fast is its volume changing when \\(r=${r}\\)?`,`V=\\frac43\\pi r^3`,`${rate/Math.PI}\\pi`,[`${4*r*dr}\\pi`,`${r*r*dr}\\pi`,`${3*r*r*dr}\\pi`],`Differentiate with respect to time: \\(\\frac{dV}{dt}=4\\pi r^2\\frac{dr}{dt}\\). Substitution gives \\(${rate/Math.PI}\\pi\\) cubic units per second.`,{formulaGroup:'course'});
}
function rrLadder(){
  const L=13,x=5,y=12,dx=pick([1,2,3]),dy=-x*dx/y;
  return mc(`u3-rr-ladder-${dx}`,'course_ladder',`A \\(13\\)-ft ladder leans against a wall. The foot moves away at \\(${dx}\\) ft/s. How fast is the top moving when the foot is \\(5\\) ft from the wall?`,`x^2+y^2=169`,`${frac(dy*12,12)}\\text{ ft/s}`,[`${frac(-y*dx,x)}\\text{ ft/s}`,`${frac(x*dx,y)}\\text{ ft/s}`,`${dx}\\text{ ft/s}`],`At that instant, \\(y=12\\). Differentiate: \\(2x\\frac{dx}{dt}+2y\\frac{dy}{dt}=0\\). Thus \\(\\frac{dy}{dt}=-\\frac{5(${dx})}{12}=${frac(-5*dx,12)}\\) ft/s. The negative sign means the top moves down.`,{formulaGroup:'course'});
}
function rrShadow(){
  const pole=pick([12,15,18]),person=pick([5,6]),walk=pick([2,3,4]),rate=person*walk/(pole-person);
  return mc(`u3-rr-shadow-${pole}-${person}-${walk}`,'course_shadow',`A \\(${person}\\)-ft person walks away from a \\(${pole}\\)-ft light at \\(${walk}\\) ft/s. How fast is the shadow length increasing?`,'',`${frac(person*walk,pole-person)}\\text{ ft/s}`,[`${frac(pole*walk,pole-person)}\\text{ ft/s}`,`${walk}\\text{ ft/s}`,`${frac(person,pole)}\\text{ ft/s}`],`Similar triangles give \\(\\frac{${pole}}{x+s}=\\frac{${person}}s\\), so \\((${pole-person})s=${person}x\\). Differentiate to get \\(\\frac{ds}{dt}=\\frac{${person}(${walk})}{${pole-person}}=${frac(person*walk,pole-person)}\\) ft/s.`,{formulaGroup:'course'});
}
function rrExtension(){
  const r=pick([3,4,5]),dr=pick([.5,1,1.5]),rate=2*Math.PI*r*dr;
  return numeric(`u3-rr-wave-${r}-${dr}`,'extension_circular_wave',`A circular ripple's radius grows at \\(${dr}\\) m/s. How fast is its area changing when \\(r=${r}\\)? Round to three decimals.`,`A=\\pi r^2`,rate,rate.toFixed(3),`Differentiate: \\(\\frac{dA}{dt}=2\\pi r\\frac{dr}{dt}\\). Substitution gives \\(${rate.toFixed(3)}\\) square meters per second.`,.0006,{formulaGroup:'extension'});
}
function rrTest(){
  const L=10,x=6,y=8,dx=2,dy=-x*dx/y;
  return mc('u3-rr-test-ladder','test_ladder_area',`A \\(10\\)-ft ladder has its foot moving away from a wall at \\(2\\) ft/s. When the foot is \\(6\\) ft from the wall, how fast is the triangular area between the ladder, wall, and floor changing?`,'',`\\frac72\\text{ ft}^2/\\text{s}`,[`-\\frac72\\text{ ft}^2/\\text{s}`,`1\\text{ ft}^2/\\text{s}`,`7\\text{ ft}^2/\\text{s}`],`At this instant, \\(y=8\\) and \\(\\frac{dy}{dt}=-\\frac32\\). With \\(A=\\frac{xy}{2}\\), \\(\\frac{dA}{dt}=\\frac{x\\frac{dy}{dt}+y\\frac{dx}{dt}}2=\\frac{6(-\\frac32)+8(2)}2=\\frac72\\) square feet per second.`,{formulaGroup:'course'});
}
function rrCalcCourse(){
  const h=pick([3.4,4.1,5.2]),dh=pick([.6,.8,1.1]),r=h/2,dr=dh/2,rate=Math.PI*r*r*dh+2*Math.PI*r*h*dr;
  return numeric(`u3-rr-calc-cone-${h}-${dh}`,'course_calculator_cone',`Calculator Active: Sand forms a cone whose radius is half its height. When \\(h=${h}\\) m, the height increases at \\(${dh}\\) m/min. Find \\(\\frac{dV}{dt}\\) to three decimals.`,`V=\\frac13\\pi r^2h`,rate/3,(rate/3).toFixed(3),`Since \\(r=\\frac h2\\), \\(\\frac{dr}{dt}=\\frac12\\frac{dh}{dt}\\). Differentiate \\(V=\\frac{\\pi r^2h}{3}\\) and substitute the instantaneous values.`,.0006,{formulaGroup:'course'});
}
function rrCalcTest(){
  const d=pick([15,20,25]),theta=pick([.6,.8,1]),omega=pick([.04,.05,.06]),rate=d*omega/(Math.cos(theta)**2);
  return numeric(`u3-rr-calc-test-light-${d}-${theta}-${omega}`,'test_rotating_spotlight',`Calculator Active: A spotlight is \\(${d}\\) meters from a straight wall and rotates at \\(${omega}\\) rad/s. How fast is its light spot moving along the wall when \\(\\theta=${theta}\\) radians? Round to three decimals.`,`y=${d}\\tan\\theta`,rate,rate.toFixed(3),`Differentiate \\(y=${d}\\tan\\theta\\): \\(\\frac{dy}{dt}=${d}\\sec^2\\theta\\frac{d\\theta}{dt}\\). Substitution gives \\(${rate.toFixed(3)}\\) m/s.`,.0006,{formulaGroup:'course'});
}
function rrCalcExtension(){
  const x=30,y=40,dx=4,dy=-3,d=Math.hypot(x,y),dd=(x*dx+y*dy)/d;
  return numeric('u3-rr-calc-ships','extension_two_moving_objects',`Calculator Active: One boat is \\(30\\) km east of a harbor and moves east at \\(4\\) km/h. Another is \\(40\\) km north and moves south at \\(3\\) km/h. How fast is the distance between them changing?`,'',dd,dd.toFixed(3),`Let \\(d^2=x^2+y^2\\). Then \\(\\frac{dd}{dt}=\\frac{x\\frac{dx}{dt}+y\\frac{dy}{dt}}d\\). Here \\(d=50\\), so the numerator is \\(30(4)+40(-3)=0\\); the distance is momentarily unchanged.`,.0006,{formulaGroup:'extension'});
}
function relatedRates(opts={}){
  const mode=modeOf(opts),source=R()<.15?'test':'assignment',extension=R()<.25;let p;
  if(mode==='calculator')p=extension?rrCalcExtension():(source==='test'?rrCalcTest():rrCalcCourse());
  else p=extension?rrExtension():(source==='test'?rrTest():pick([rrSphere,rrLadder,rrShadow])());
  p.formulaGroup=p.formulaGroup||(extension?'extension':'course');return stamp(p,'related-rates',mode,source,p.variant);
}
U3['related-rates']=relatedRates;

/* v11.11 concise POI and concavity explanation refinements. */
function retryFamily(families,predicate,tries=80){
  let candidate=null;for(let i=0;i<tries;i++){candidate=pick(families)();if(predicate(candidate))return candidate;}return candidate;
}
const motionExactCategories=[
  ()=>retryFamily(motionExactFamilies,p=>/motion_position_velocity_/.test(p.variant)),
  ()=>retryFamily(motionExactFamilies,p=>/motion_position_speed_/.test(p.variant)),
  ()=>retryFamily(motionExactFamilies,p=>/motion_position_acceleration_/.test(p.variant)),
  ()=>retryFamily(motionExactFamilies,p=>/motion_velocity_speed_/.test(p.variant)),
  ()=>retryFamily(motionExactFamilies,p=>/motion_velocity_acceleration_/.test(p.variant)),
  ()=>retryFamily(motionExactFamilies,p=>/direction_change/.test(p.variant)&&!/acceleration_first/.test(p.variant)),
  motionAccelerationAtDirectionChange,
  motionVelocityWhenPosition,
  ()=>pick([motionAccelerationWhenPosition,motionExponentialPositionRelation])(),
  ()=>pick([motionAccelerationWhenVelocity,motionLogVelocityRelation])()
];
const motionCalculatorCategories=[
  ()=>retryFamily(motionCalculatorFamilies,p=>/position_velocity_/.test(p.variant)),
  ()=>pick([motionCalcCompositeSpeed,motionCalcPositionRadical,motionCalcTest])(),
  ()=>pick([()=>retryFamily([motionCalcPositionExponential],p=>/position_acceleration_/.test(p.variant)),motionCalcPositionLogCos])(),
  ()=>retryFamily([motionCalcVelocityLogTrig,motionCalcVelocityRational],p=>/velocity_speed_/.test(p.variant)),
  ()=>retryFamily([motionCalcVelocityLogTrig,motionCalcVelocityRational],p=>/velocity_acceleration_/.test(p.variant)),
  ()=>pick([motionCalcDirectionExp,motionCalcDirectionTrig])(),
  motionCalcAccelerationAtDirectionChange,
  motionCalcVelocityAtPosition,
  motionCalcAccelerationAtPosition,
  motionCalcAccelerationAtVelocity
];
function explanationSentences(text){
  const source=String(text||'').replace(/\s+/g,' ').trim();
  if(!source)return[];
  return source.split(/\.\s+(?=[A-Z])/).map(part=>part.trim()).filter(Boolean).map(part=>/[.!?]$/.test(part)?part:`${part}.`);
}
function workedSegments(text){
  const source=String(text||'').replace(/\s+/g,' ').trim();
  if(!source)return[];
  if(/<strong>Step\s+\d+:<\/strong>/i.test(source)){
    return source.split(/<strong>Step\s+\d+:<\/strong>/i).map(part=>part.trim()).filter(Boolean);
  }
  return explanationSentences(source);
}
function removeRedundantFinalWorkedStep(sentences){
  const steps=[...(sentences||[])];
  if(steps.length<2)return steps;
  const previous=String(steps[steps.length-2]||'').replace(/<[^>]+>/g,' ').replace(/\\[()]/g,' ').replace(/\s+/g,' ').trim();
  const last=String(steps[steps.length-1]||'').replace(/<[^>]+>/g,' ').replace(/\\[()]/g,' ').replace(/\s+/g,' ').trim();
  if(!/^Therefore\b/i.test(last))return steps;
  const previousAlreadyConcludes=/(?:so|therefore|hence|proves?|proving|shows?)\b[\s\S]*?\b(?:local (?:maximum|minimum)|point of inflection|is (?:increasing|decreasing|concave)|requested (?:value|answer|approximation|location)|final (?:value|answer|approximation))\b/i.test(previous);
  if(!previousAlreadyConcludes)return steps;
  const finalNumbers=last.match(/-?\d+(?:\.\d+)?/g)||[];
  if(finalNumbers.length&&finalNumbers.every(value=>previous.includes(value)))steps.pop();
  return steps;
}
function numberedWorkedSolution(sentences){
  const steps=removeRedundantFinalWorkedStep(sentences);
  return `<div class="worked-steps">${steps.map((sentence,index)=>`<p><strong>Step ${index+1}:</strong> ${sentence}</p>`).join('')}</div>`;
}
function titledMethod(title,body,className=''){
  return `<section class="worked-method ${className}"><h4>${title}</h4>${body}</section>`;
}
function calculatorDirections(paragraphs){
  return `<div class="calculator-directions">${paragraphs.map(paragraph=>`<p>${paragraph}</p>`).join('')}</div>`;
}
function motionWorkedExplanation(problem,mode){
  const variant=String(problem.variant||''),calculator=mode==='calculator';
  const startsWithVelocity=/motion_(?:calculator_)?velocity_(?:speed|acceleration)|acceleration_when_velocity|log_a_at_velocity/.test(variant);
  const startsWithPosition=!startsWithVelocity&&/(?:position|direction_change|speed_composite|speed_radical|test_motion_speed|acceleration_log_trig|when_position)/.test(variant);
  const asksDirection=/direction_change/.test(variant)&&!/acceleration_first/.test(variant);
  const asksAcceleration=/_acceleration_/.test(variant)||/acceleration_log_trig|log_a_at_velocity|exp_a_at_position/.test(variant);
  const asksSpeed=/_speed_/.test(variant);
  const whenPosition=/when_position/.test(variant);
  const whenVelocity=/when_velocity/.test(variant);
  const needsNumericalTime=asksDirection||whenPosition||whenVelocity||/acceleration_first_direction_change/.test(variant);
  const handSteps=workedSegments(problem.explanation);
  if(handSteps.length<2)handSteps.push(`Substituting the required time gives \\(${problem.answerTex||''}\\).`);
  let rendered=titledMethod('Method 1: Differentiate by hand',numberedWorkedSolution(handSteps),'by-hand-method');
  if(calculator){
    const directions=[];
    if(needsNumericalTime){
      directions.push('Enter the equation whose zero is needed in \\(Y_1\\), press <strong>GRAPH</strong>, and use <strong>2nd</strong> → <strong>TRACE (CALC)</strong> → <strong>2:zero</strong>. If the time comes from two graphs meeting, use <strong>5:intersect</strong>. Keep the full calculator value for that time until the final calculation.');
    }
    if(asksAcceleration&&startsWithPosition){
      directions.push('Press <strong>MATH</strong> and choose <strong>8:d/dx</strong>. In the “with respect to” field, enter \\(x\\). Move to the expression field, press <strong>MATH</strong>, and choose <strong>8:d/dx</strong> again so the screen contains one \\(d/dx\\) template inside the other.');
      directions.push('Enter the position function in the inner template, using \\(x\\) in place of \\(t\\). Set the inner derivative’s evaluation value to \\(x\\). Set the outer derivative’s evaluation value to the requested time—or to the full unrounded time found with <strong>zero</strong> or <strong>intersect</strong>. The screen should have the form \\(\\left.\\frac{d}{dx}\\left(\\left.\\frac{d}{dx}(s(x))\\right|_{x=x}\\right)\\right|_{x=t_0}\\).');
    }else if(asksAcceleration&&startsWithVelocity){
      directions.push('Because velocity is already given, press <strong>MATH</strong> and choose <strong>8:d/dx</strong>. Enter the velocity formula using \\(x\\), differentiate with respect to \\(x\\), and place the requested time in the evaluation field.');
    }else if((asksSpeed||/_velocity_/.test(variant))&&startsWithPosition){
      directions.push(`Press <strong>MATH</strong> and choose <strong>8:d/dx</strong>. Enter the displayed position formula using \\(x\\), differentiate with respect to \\(x\\), and place the required time in the evaluation field.${asksSpeed?' Take the absolute value of the resulting velocity to obtain speed.':''}`);
    }else if(asksSpeed&&startsWithVelocity){
      directions.push('Enter the displayed velocity in \\(Y_1\\), then use <strong>2nd</strong> → <strong>TRACE (CALC)</strong> → <strong>1:value</strong> at the required time. Take the absolute value of that velocity to obtain speed.');
    }
    directions.push('Keep full calculator precision during the work. Round only the final requested value to exactly three decimal places.');
    rendered+=titledMethod('Method 2: Use the TI-84 Plus CE',calculatorDirections(directions),'calculator-method');
  }
  problem.motionExplanationSteps=handSteps.length;
  problem.motionSpecificWork=true;
  problem.motionMethodsSeparated=calculator;
  problem.explanation=rendered;
  return problem;
}
U3.motion=(opts={})=>{
  const mode=modeOf(opts),source=R()<.15?'test':'assignment',pool=mode==='calculator'?motionCalculatorCategories:motionExactCategories,p=motionWorkedExplanation(pick(pool)(),mode);
  return stamp(p,'motion',mode,source,p.variant);
};

function evtButtons(id,variant,math,correct,explanation){
  const choices=shuffle(['Yes','No']);return{id,variant,questionHtml:`<div><div class="question-prompt">Does the Extreme Value Theorem guarantee both an absolute maximum and an absolute minimum on the stated interval?</div><div>\\(${math}\\)</div></div>`,choices,correctIndex:choices.indexOf(correct),choicesAreText:true,retainChoices:true,explanation};
}
function evtExpandedRational(){
  const a=ri(-4,-1),b=ri(1,4),left=a-1,right=b+1,den=quad(1,-a-b,a*b);
  return evtButtons(`u3-evt-expanded-rational-${a}-${b}`,'evt_expanded_rational_domain',`f(x)=\\frac{x+${Math.abs(a)+Math.abs(b)+1}}{${den}},\\qquad [${left},${right}]`,'No',`The denominator factors as \\((x-${a})(x-${b})\\), so the function is undefined at \\(x=${a}\\) and \\(x=${b}\\) inside the interval. It is not continuous on the full closed interval, so EVT does not apply.`);
}
function evtRootDomain(){
  const a=ri(1,5),right=a+ri(3,8),valid=R()<.5,left=valid?a:a-1;
  return evtButtons(`u3-evt-root-domain-${a}-${left}-${right}`,'evt_radical_domain_expanded',`f(x)=(x+1)\\sqrt{x-${a}},\\qquad [${left},${right}]`,valid?'Yes':'No',valid?`The square root is defined at \\(x=${a}\\) and everywhere to its right. The function is continuous on the entire closed interval, so EVT guarantees both extrema.`:`Part of the interval lies to the left of \\(x=${a}\\), where the square root is not real. The function is not continuous on the full closed interval, so EVT does not apply.`);
}
function evtLogDomain(){
  const a=ri(1,5),right=a+ri(3,7),valid=R()<.5,left=valid?a+1:a;
  return evtButtons(`u3-evt-log-domain-${a}-${left}-${right}`,'evt_logarithmic_domain_expanded',`f(x)=x^2+\\ln(x-${a}),\\qquad [${left},${right}]`,valid?'Yes':'No',valid?`Every point of the closed interval satisfies \\(x>${a}\\). The logarithm and polynomial are continuous there, so EVT guarantees both extrema.`:`The logarithm is not defined at the left endpoint \\(x=${a}\\). The function is not continuous on the full closed interval, so EVT does not apply.`);
}
function evtExponentialDenominator(){
  const a=ri(1,4),b=a+ri(2,5);
  return evtButtons(`u3-evt-exp-den-${a}-${b}`,'evt_exponential_denominator',`f(x)=\\frac{x^2+1}{2+e^x},\\qquad [-${a},${b}]`,'Yes',`The denominator \\(2+e^x\\) is always positive, so the function is continuous for every real number. The interval is closed and bounded; EVT guarantees both extrema.`);
}
function evtLogDenominator(){
  const a=ri(2,5),left=1-a,right=3-a;
  return evtButtons(`u3-evt-log-den-${a}`,'evt_logarithmic_denominator',`f(x)=\\frac{x+1}{\\ln(x+${a})},\\qquad [${left},${right}]`,'No',`Although the logarithm is defined on this interval, \\(\\ln(x+${a})=0\\) at \\(x=${1-a}\\), the left endpoint. The original function is undefined there, so it is not continuous on the full closed interval.`);
}
function evtRadicalDenominator(){
  const a=ri(1,5),right=a+ri(3,7);
  return evtButtons(`u3-evt-rad-den-${a}-${right}`,'evt_radical_denominator',`f(x)=\\frac{x+2}{\\sqrt{x-${a}}},\\qquad [${a},${right}]`,'No',`The square root in the denominator is zero at the left endpoint \\(x=${a}\\). The function is not defined there, so EVT does not apply on the full closed interval.`);
}
function evtPolynomialButton(){
  const a=ri(1,5),b=a+ri(2,5);return evtButtons(`u3-evt-poly-button-${a}-${b}`,'evt_polynomial_closed_interval',`f(x)=x^4-${a}x^2+${b},\\qquad [-${a},${b}]`,'Yes',`A polynomial is continuous everywhere. Because the interval is closed and bounded, EVT guarantees both an absolute maximum and an absolute minimum.`);
}
const evtButtonFamilies=[evtPolynomialButton,evtExpandedRational,evtRootDomain,evtLogDomain,evtExponentialDenominator,evtLogDenominator,evtRadicalDenominator];
const extremaOnlyFamilies=[extremaTypedCubic,extremaTypedQuartic,extremaTypedExponential,extremaTypedLogarithmic,extremaTypedRational,extremaTypedTrig,extremaTypedRadical,extremaTypedAbsolutePolynomial];
function markExtrema(problem,category,form){problem.extremaCategory=category;problem.extremaQuestionForm=form;return problem;}
function extremaLocationOrValue(kind){
  const form=R()<.5?'location':'value',family=pick(kind==='local-maximum'?['cubic','rational','quartic']:['cubic','rational','quartic','log']);
  if(family==='cubic'){
    const a=ri(1,5),C=ri(-8,8),maximum=kind==='local-maximum',x=maximum?-a:a,y=C+(maximum?2:-2)*a**3,math=`f(x)=x^3-${3*a*a}x${sgn(C,'')}`;
    const p=form==='location'
      ?exactExpression(`u3-ext-${kind}-cubic-location-${a}-${C}`,'extrema_local_cubic_location',`Enter the x-coordinate where the local ${maximum?'maximum':'minimum'} occurs.`,math,String(x),String(x),`Differentiate: \\(f'(x)=3(x-${a})(x+${a})\\). The derivative changes ${maximum?'from positive to negative at \\(x=-'+a+'\\)':'from negative to positive at \\(x='+a+'\\)'}.`,{expressionPlaceholder:'Enter the x-coordinate'})
      :exactExpression(`u3-ext-${kind}-cubic-value-${a}-${C}`,'extrema_local_cubic_value',`Enter the local ${maximum?'maximum':'minimum'} value.`,math,String(y),String(y),`The local ${maximum?'maximum':'minimum'} occurs at \\(x=${x}\\). Substitute into the original function: \\(f(${x})=${y}\\).`,{expressionPlaceholder:`Enter the local ${maximum?'maximum':'minimum'} value`});
    return markExtrema(p,kind,form);
  }
  if(family==='rational'){
    const a=ri(1,6),maximum=kind==='local-maximum',x=maximum?a:-a,q=Q(maximum?1:-1,2*a),math=`f(x)=\\frac{x}{x^2+${a*a}}`;
    const p=form==='location'
      ?exactExpression(`u3-ext-${kind}-rational-location-${a}`,'extrema_local_rational_location',`Enter the x-coordinate where the local ${maximum?'maximum':'minimum'} occurs.`,math,String(x),String(x),`Since \\(f'(x)=\\frac{${a*a}-x^2}{(x^2+${a*a})^2}\\), the sign change at \\(x=${x}\\) produces the requested local extremum.`,{expressionPlaceholder:'Enter the x-coordinate'})
      :exactExpression(`u3-ext-${kind}-rational-value-${a}`,'extrema_local_rational_value',`Enter the local ${maximum?'maximum':'minimum'} value.`,math,qPlain(q),qTex(q),`The requested extremum occurs at \\(x=${x}\\). Evaluating the original function gives \\(f(${x})=${qTex(q)}\\).`,{expressionPlaceholder:`Enter the local ${maximum?'maximum':'minimum'} value`});
    return markExtrema(p,kind,form);
  }
  if(family==='log'){
    const a=ri(2,7),valueRaw=`${a}-${a}*ln(${a})`,valueTex=`${a}-${a}\\ln(${a})`,math=`f(x)=x-${a}\\ln x,\\qquad x>0`;
    const p=form==='location'
      ?exactExpression(`u3-ext-local-min-log-location-${a}`,'extrema_local_log_location','Enter the x-coordinate where the local minimum occurs.',math,String(a),String(a),`For \\(x>0\\), \\(f'(x)=\\frac{x-${a}}x\\), which changes from negative to positive at \\(x=${a}\\).`,{expressionPlaceholder:'Enter the x-coordinate'})
      :exactExpression(`u3-ext-local-min-log-value-${a}`,'extrema_local_log_value','Enter the local minimum value.',math,valueRaw,valueTex,`The local minimum occurs at \\(x=${a}\\). Substitution into the original function gives \\(f(${a})=${valueTex}\\).`,{expressionPlaceholder:'Enter the local minimum value'});
    return markExtrema(p,kind,form);
  }
  const a=ri(1,4),C=ri(-6,6),maximum=kind==='local-maximum',locations=maximum?[0]:[-a,a],value=maximum?C:C-a**4,math=`f(x)=x^4-${2*a*a}x^2${sgn(C,'')}`;
  const p=form==='location'
    ?(locations.length===1
      ?exactExpression(`u3-ext-${kind}-quartic-location-${a}-${C}`,'extrema_local_quartic_location',`Enter the x-coordinate where the local ${maximum?'maximum':'minimum'} occurs.`,math,String(locations[0]),String(locations[0]),`Factor \\(f'(x)=4x(x-${a})(x+${a})\\) and use a sign chart. The requested sign change occurs at \\(x=${locations[0]}\\).`,{expressionPlaceholder:'Enter the x-coordinate'})
      :valueListProblem(`u3-ext-${kind}-quartic-locations-${a}-${C}`,'extrema_local_quartic_locations','Enter every x-coordinate where a local minimum occurs.',math,'x',locations,`Factor \\(f'(x)=4x(x-${a})(x+${a})\\). It changes from negative to positive at \\(x=-${a}\\) and \\(x=${a}\\).`))
    :exactExpression(`u3-ext-${kind}-quartic-value-${a}-${C}`,'extrema_local_quartic_value',`Enter the local ${maximum?'maximum':'minimum'} value.`,math,String(value),String(value),`The ${maximum?'maximum occurs at \\(x=0\\)':'minima occur at \\(x=\\pm'+a+'\\)'}. Evaluating the original function gives the value \\(${value}\\).`,{expressionPlaceholder:`Enter the local ${maximum?'maximum':'minimum'} value`});
  return markExtrema(p,kind,form);
}
function extremaAbsoluteLocationOrValue(kind){
  const form=R()<.5?'location':'value',family=pick(['trig','polynomial','radical']),maximum=kind==='absolute-maximum';
  if(family==='trig'){
    const A=ri(2,7),C=ri(-5,5),x=maximum?'pi/2':'3*pi/2',xTex=maximum?'\\frac{\\pi}{2}':'\\frac{3\\pi}{2}',value=maximum?A+C:C-A,math=`f(x)=${A}\\sin x${sgn(C,'')},\\qquad [0,2\\pi]`;
    const p=form==='location'
      ?exactExpression(`u3-ext-${kind}-trig-location-${A}-${C}`,'extrema_absolute_trig_location',`Enter the x-coordinate where the absolute ${maximum?'maximum':'minimum'} occurs.`,math,x,xTex,`On \\([0,2\\pi]\\), sine reaches ${maximum?'1 at \\(x=\\frac{\\pi}{2}\\)':'-1 at \\(x=\\frac{3\\pi}{2}\\)'}.`,{expressionPlaceholder:'Enter the x-coordinate'})
      :exactExpression(`u3-ext-${kind}-trig-value-${A}-${C}`,'extrema_absolute_trig_value',`Enter the absolute ${maximum?'maximum':'minimum'} value.`,math,String(value),String(value),`Use ${maximum?'\\(\\sin x=1\\)':'\\(\\sin x=-1\\)'}. The requested value is \\(${value}\\).`,{expressionPlaceholder:`Enter the absolute ${maximum?'maximum':'minimum'} value`});
    return markExtrema(p,kind,form);
  }
  if(family==='polynomial'){
    const a=ri(1,4),C=ri(-5,5),bound=2*a,value=C+(maximum?2:-2)*a**3,locations=maximum?[-a,2*a]:[-2*a,a],math=`f(x)=x^3-${3*a*a}x${sgn(C,'')},\\qquad [-${bound},${bound}]`;
    const p=form==='location'
      ?valueListProblem(`u3-ext-${kind}-poly-locations-${a}-${C}`,'extrema_absolute_polynomial_locations',`Enter every x-coordinate where the absolute ${maximum?'maximum':'minimum'} occurs.`,math,'x',locations,`Check both endpoints and the critical numbers \\(x=\\pm${a}\\). The greatest value occurs at \\(x=-${a},${2*a}\\), while the least occurs at \\(x=-${2*a},${a}\\).`)
      :exactExpression(`u3-ext-${kind}-poly-value-${a}-${C}`,'extrema_absolute_polynomial_value',`Enter the absolute ${maximum?'maximum':'minimum'} value.`,math,String(value),String(value),`Evaluate the function at \\(x=-${bound},-${a},${a},${bound}\\). Comparing those values gives the requested absolute extremum value \\(${value}\\).`,{expressionPlaceholder:`Enter the absolute ${maximum?'maximum':'minimum'} value`});
    return markExtrema(p,kind,form);
  }
  const r=pick([2,4,6,8,10]),r2=r*r,locations=maximum?[`${r}/sqrt(2)`]:[0,r],value=maximum?Q(r2,2):Q(0,1),math=`f(x)=x\\sqrt{${r2}-x^2},\\qquad [0,${r}]`;
  let p;
  if(form==='location'&&maximum)p=exactExpression(`u3-ext-${kind}-radical-location-${r}`,'extrema_absolute_radical_location','Enter the x-coordinate where the absolute maximum occurs.',math,locations[0],`\\frac{${r}}{\\sqrt2}`,`The endpoints and the interior critical number must be checked. Solving \\(f'(x)=0\\) gives \\(x=\\frac{${r}}{\\sqrt2}\\), where the largest value occurs.`,{expressionPlaceholder:'Enter the x-coordinate'});
  else if(form==='location')p=valueListProblem(`u3-ext-${kind}-radical-locations-${r}`,'extrema_absolute_radical_locations','Enter every x-coordinate where the absolute minimum occurs.',math,'x',locations,`The function is nonnegative on the interval and equals zero at both endpoints, so the absolute minimum occurs at \\(x=0\\) and \\(x=${r}\\).`);
  else p=exactExpression(`u3-ext-${kind}-radical-value-${r}`,'extrema_absolute_radical_value',`Enter the absolute ${maximum?'maximum':'minimum'} value.`,math,qPlain(value),qTex(value),maximum?`The interior critical number is \\(x=\\frac{${r}}{\\sqrt2}\\). Evaluating there gives \\(${qTex(value)}\\), which is greater than both endpoint values.`:'The function is nonnegative and equals zero at each endpoint, so its absolute minimum value is \\(0\\).',{expressionPlaceholder:`Enter the absolute ${maximum?'maximum':'minimum'} value`});
  return markExtrema(p,kind,form);
}
function extremaSpecificWorkV117(problem){
  const id=String(problem.id||''),variant=String(problem.variant||'');let m,work='';
  if((m=id.match(/^u3-ext-local-(maximum|minimum)-cubic-(?:location|value)-(\d+)-(-?\d+)$/))){
    const kind=m[1],a=Number(m[2]),C=Number(m[3]),x=kind==='maximum'?-a:a,y=C+(kind==='maximum'?2:-2)*a**3;
    work='Differentiate: \\(f′(x)=3x^2-'+(3*a*a)+'=3(x-'+a+')(x+'+a+')\\). Thus the critical numbers are \\(x=-'+a+'\\) and \\(x='+a+'\\). A sign chart gives the local '+kind+' at \\(x='+x+'\\). Substitution gives \\(f('+x+')='+y+'\\).';
  }else if((m=id.match(/^u3-ext-local-(maximum|minimum)-rational-(?:location|value)-(\d+)$/))){
    const kind=m[1],a=Number(m[2]),x=kind==='maximum'?a:-a,value=Q(kind==='maximum'?1:-1,2*a);
    work='Use the quotient rule: \\(f′(x)=\\frac{'+(a*a)+'-x^2}{(x^2+'+(a*a)+')^2}\\). The critical numbers are \\(x=\\pm'+a+'\\). The derivative sign chart gives the local '+kind+' at \\(x='+x+'\\), and \\(f('+x+')='+qTex(value)+'\\).';
  }else if((m=id.match(/^u3-ext-local-min-log-(?:location|value)-(\d+)$/))){
    const a=Number(m[1]);
    work='Differentiate: \\(f′(x)=1-\\frac{'+a+'}{x}=\\frac{x-'+a+'}{x}\\). On the domain \\(x>0\\), this changes from negative to positive at \\(x='+a+'\\). Therefore the local minimum occurs there and has value \\(f('+a+')='+a+'-'+a+'\\ln('+a+')\\).';
  }else if((m=id.match(/^u3-ext-local-(maximum|minimum)-quartic-(?:location|locations|value)-(\d+)-(-?\d+)$/))){
    const kind=m[1],a=Number(m[2]),C=Number(m[3]),locations=kind==='maximum'?'0':'\\pm'+a,value=kind==='maximum'?C:C-a**4;
    work='Differentiate and factor: \\(f′(x)=4x^3-'+(4*a*a)+'x=4x(x-'+a+')(x+'+a+')\\). The critical numbers are \\(-'+a+',0,'+a+'\\). The sign chart gives the local '+kind+(kind==='minimum'?'s':'')+' at \\(x='+locations+'\\), and evaluating the original function gives the value \\('+value+'\\).';
  }else if((m=id.match(/^u3-ext-absolute-(maximum|minimum)-trig-(?:location|value)-(\d+)-(-?\d+)$/))){
    const kind=m[1],A=Number(m[2]),C=Number(m[3]);
    work='On \\([0,2\\pi]\\), \\(f′(x)='+A+'\\cos x\\), so the interior critical numbers are \\(\\pi/2\\) and \\(3\\pi/2\\). Evaluate the candidates: \\(f(0)=f(2\\pi)='+C+'\\), \\(f(\\pi/2)='+(A+C)+'\\), and \\(f(3\\pi/2)='+(C-A)+'\\). Comparing these values identifies the absolute '+kind+'.';
  }else if((m=id.match(/^u3-ext-absolute-(maximum|minimum)-poly-(?:locations|value)-(\d+)-(-?\d+)$/))){
    const kind=m[1],a=Number(m[2]),C=Number(m[3]),low=C-2*a**3,high=C+2*a**3;
    work='Differentiate: \\(f′(x)=3x^2-'+(3*a*a)+'=3(x-'+a+')(x+'+a+')\\). On the closed interval the candidates are \\(-'+(2*a)+',-'+a+','+a+','+(2*a)+'\\). Their outputs are \\('+low+','+high+','+low+','+high+'\\), respectively. Comparing them gives the requested absolute '+kind+'.';
  }else if((m=id.match(/^u3-ext-absolute-(maximum|minimum)-radical-(?:location|locations|value)-(\d+)$/))){
    const kind=m[1],r=Number(m[2]),value=kind==='maximum'?r*r/2:0;
    work='For \\(f(x)=x\\sqrt{'+(r*r)+'-x^2}\\), \\(f′(x)=\\frac{'+(r*r)+'-2x^2}{\\sqrt{'+(r*r)+'-x^2}}\\). The interior critical number is \\(x=\\frac{'+r+'}{\\sqrt2}\\). Compare it with the endpoints: \\(f(0)=0\\), \\(f('+r+')=0\\), and \\(f(\\frac{'+r+'}{\\sqrt2})='+value+'\\).';
  }
  if(work)problem.explanation=work;
  problem.extremaSpecificWork=true;
  return problem;
}
function extremaConclusion(problem){
  const category=String(problem.extremaCategory||''),form=String(problem.extremaQuestionForm||''),answer=String(problem.answerTex||'');
  if(category==='evt'){
    const response=Array.isArray(problem.choices)?problem.choices[problem.correctIndex]:answer;
    return `Therefore the correct EVT response is <strong>${response}</strong>.`;
  }
  const label=category.replace(/-/g,' ');
  if(form==='location'){
    const location=/^\s*x\s*=/.test(answer)?answer:`x=${answer}`;
    return `Therefore the ${label} occurs at \\(${location}\\).`;
  }
  if(form==='value')return `Therefore the ${label} value is \\(${answer}\\).`;
  return `Therefore the ${label} is \\(${answer}\\).`;
}
function extremaWorkedExplanation(problem){
  const steps=workedSegments(problem.explanation);
  const category=problem.extremaCategory||'';
  const conclusion=extremaConclusion(problem);
  if(!steps.some(step=>/therefore the (?:local|absolute|correct EVT)/i.test(step)))steps.push(conclusion);
  while(steps.length<3)steps.splice(Math.max(steps.length-1,0),0,category==='evt'?'Check whether the function is continuous at every point of the entire closed interval.':'Evaluate the needed critical point or endpoint in the original function.');
  problem.workedSteps=true;
  problem.extremaConcreteSolution=true;
  problem.explanation=numberedWorkedSolution(steps);
  return problem;
}
U3['absolute-and-local-extrema-and-the-extreme-value-theorem']=(opts={})=>{
  const source=R()<.15?'test':'assignment',category=pick(['evt','local-maximum','local-minimum','absolute-maximum','absolute-minimum']);
  const p=category==='evt'?markExtrema(pick(evtButtonFamilies)(),'evt','yes-no'):category.startsWith('local')?extremaLocationOrValue(category):extremaAbsoluteLocationOrValue(category);
  return stamp(extremaWorkedExplanation(extremaSpecificWorkV117(p)),'absolute-and-local-extrema-and-the-extreme-value-theorem','noncalculator',source,p.variant);
};

function analysisRadicalProduct(){
  const a=3*ri(2,6),critical=2*a/3,ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(0,critical)]:[closedPart(critical,a)];
  return intervalProblem(`u3-analysis-f-radical-${a}-${ask}`,'analysis_from_f_radical_product',`Where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f(x)=x\\sqrt{${a}-x}`,parts,`The domain is \\([0,${a}]\\). Differentiate: \\(f'(x)=\\frac{${2*a}-3x}{2\\sqrt{${a}-x}}\\). It is positive before \\(x=${critical}\\) and negative after it.`,{analysisGiven:'f'});
}
function analysisPoiFromF(){
  const a=ri(1,4),C=ri(-5,5),p=valueListProblem(`u3-analysis-poi-f-${a}-${C}`,'analysis_inflection_points_from_f',`Enter every x-coordinate where \\(f\\) has a point of inflection.`,`f(x)=x^4-${6*a*a}x^2${sgn(C,'')}`,'x',[-a,a],`Differentiate twice: \\(f''(x)=12(x^2-${a*a})=12(x-${a})(x+${a})\\). Its sign changes at both zeros, so both are inflection-point x-coordinates.`);p.analysisGiven='f';return p;
}
function analysisExtremaFromPrime(){
  const a=ri(-5,-1),b=ri(1,5),factored=R()<.25,ask=R()<.5?'maximum':'minimum',answer=ask==='maximum'?a:b,shown=analysisDerivativeShown(factored,`(x-${a})(x-${b})`,poly([1,-a-b,a*b])),p=exactExpression(`u3-analysis-ext-fp-${a}-${b}-${factored}-${ask}`,'analysis_extrema_from_first_derivative',`Enter the x-coordinate of the local ${ask}.`,`f'(x)=${shown}`,String(answer),String(answer),`The derivative is positive outside \\(${a}\\) and \\(${b}\\), and negative between them. It changes from positive to negative at \\(x=${a}\\), a local maximum, and from negative to positive at \\(x=${b}\\), a local minimum.`);p.analysisGiven='fp';p.givenFactored=factored;return p;
}
function analysisCombinedFromF(){
  const ask=pick(['increasing and concave up','increasing and concave down','decreasing and concave up','decreasing and concave down']);let parts;
  if(ask==='increasing and concave up')parts=[closedPart(1,Infinity)];
  else if(ask==='increasing and concave down')parts=[closedPart(-Infinity,-1)];
  else if(ask==='decreasing and concave up')parts=[{left:0,right:1,leftClosed:false,rightClosed:true}];
  else parts=[{left:-1,right:0,leftClosed:true,rightClosed:false}];
  return intervalProblem(`u3-analysis-combined-f-${ask.replace(/ /g,'-')}`,'analysis_combined_from_f',`Where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f(x)=x^3-3x`,parts,`Here \\(f'(x)=3(x-1)(x+1)\\) and \\(f''(x)=6x\\). Intersect the interval where the derivative has the requested sign with the interval where the second derivative has the requested sign.`,{analysisGiven:'f'});
}
function analysisCombinedFromPrime(){
  const factored=R()<.25,shown=factored?'3(x-1)(x+1)':'3x^2-3',ask=pick(['increasing and concave up','increasing and concave down','decreasing and concave up','decreasing and concave down']);let parts;
  if(ask==='increasing and concave up')parts=[closedPart(1,Infinity)];
  else if(ask==='increasing and concave down')parts=[closedPart(-Infinity,-1)];
  else if(ask==='decreasing and concave up')parts=[{left:0,right:1,leftClosed:false,rightClosed:true}];
  else parts=[{left:-1,right:0,leftClosed:true,rightClosed:false}];
  const p=intervalProblem(`u3-analysis-combined-fp-${factored}-${ask.replace(/ /g,'-')}`,'analysis_combined_from_first_derivative',`Given \\(f'\\), where is \\(f\\) ${ask}? Enter your answer in interval notation.`,`f'(x)=${shown}`,parts,`Use the sign of \\(f'\\) for increasing or decreasing. Then differentiate the displayed expression: \\(f''(x)=6x\\). Intersect the two requested sign intervals.`,{analysisGiven:'fp',givenFactored:factored});return p;
}
function tagGiven(p,given){p.analysisGiven=given;return p;}
function coordinateProblem(id,variant,prompt,math,xAnswer,yAnswer,answerTex,explanation,extra={}){
  return Object.assign({id,variant,questionHtml:`<div><div class="question-prompt">${prompt}</div><div>\\(${math}\\)</div></div>`,answerType:'coordinate-fields',pointAnswer:{x:String(xAnswer),y:String(yAnswer)},answerTex,explanation,fullWidthChoices:true},extra);
}
function analysisPoiCoordinates(){
  if(R()<.65){
    const h=ri(-4,4),C=ri(-8,8),middle=-3*h,y=C-2*h**3,p=coordinateProblem(`u3-analysis-poi-point-cubic-${h}-${C}`,'analysis_inflection_point_coordinates_from_f','Find the coordinates of the point of inflection.',`f(x)=x^3${sgn(middle,'x^2')}${sgn(C,'')}`,String(h),String(y),`(${h},${y})`,`Differentiate twice: \\(f''(x)=6(x-${h})\\). The second derivative changes sign at \\(x=${h}\\), so concavity changes there. Substitute into the original function: \\(f(${h})=${y}\\).`);p.analysisGiven='f';return p;
  }
  const C=ri(-6,6),p=coordinateProblem(`u3-analysis-poi-point-trig-${C}`,'analysis_inflection_point_coordinates_trigonometric','Find the coordinates of the point of inflection on \\(0\\lt x\\lt2\\pi\\).',`f(x)=\\sin x${sgn(C,'')}`,'pi',String(C),`(\\pi,${C})`,`The second derivative is \\(f''(x)=-\\sin x\\). It changes sign at \\(x=\\pi\\). Then \\(f(\\pi)=\\sin\\pi${sgn(C,'')}=${C}\\), so the point is \\((\\pi,${C})\\).`);p.analysisGiven='f';return p;
}
function analysisLocalExtremumPoint(){
  const family=pick(['cubic','rational','quartic']);
  if(family==='cubic'){
    const a=ri(1,5),C=ri(-8,8),maximum=R()<.5,x=maximum?-a:a,y=C+(maximum?2:-2)*a**3,p=coordinateProblem(`u3-analysis-local-point-cubic-${a}-${C}-${maximum}`,'analysis_local_extremum_point_cubic',`Find the coordinates of the local ${maximum?'maximum':'minimum'}.`,`f(x)=x^3-${3*a*a}x${sgn(C,'')}`,String(x),String(y),`(${x},${y})`,`Factor \\(f'(x)=3(x-${a})(x+${a})\\). A sign chart identifies \\(x=${x}\\) as the local ${maximum?'maximum':'minimum'}. Evaluate the original function: \\(f(${x})=${y}\\).`);p.analysisGiven='f';return p;
  }
  if(family==='rational'){
    const a=ri(1,6),maximum=R()<.5,x=maximum?a:-a,y=Q(maximum?1:-1,2*a),p=coordinateProblem(`u3-analysis-local-point-rational-${a}-${maximum}`,'analysis_local_extremum_point_rational',`Find the coordinates of the local ${maximum?'maximum':'minimum'}.`,`f(x)=\\frac{x}{x^2+${a*a}}`,String(x),qPlain(y),`(${x},${qTex(y)})`,`The derivative is \\(f'(x)=\\frac{${a*a}-x^2}{(x^2+${a*a})^2}\\). Its sign change gives the local ${maximum?'maximum':'minimum'} at \\(x=${x}\\). Substituting into \\(f\\) gives \\(f(${x})=${qTex(y)}\\).`);p.analysisGiven='f';return p;
  }
  const a=ri(1,4),C=ri(-6,6),maximum=R()<.5,x=maximum?0:a,y=maximum?C:C-a**4,p=coordinateProblem(`u3-analysis-local-point-quartic-${a}-${C}-${maximum}`,'analysis_local_extremum_point_quartic',maximum?'Find the coordinates of the local maximum.':'Find the coordinates of the local minimum with the positive x-coordinate.',`f(x)=x^4-${2*a*a}x^2${sgn(C,'')}`,String(x),String(y),`(${x},${y})`,`Factor \\(f'(x)=4x(x-${a})(x+${a})\\). The requested sign change occurs at \\(x=${x}\\). Evaluating the original function gives \\(f(${x})=${y}\\).`);p.analysisGiven='f';return p;
}
function orderedPairProblemV117(id,variant,prompt,math,xAnswer,yAnswer,answerTex,explanation){
  return{id,variant,questionHtml:'<div><div class="question-prompt">'+prompt+'</div><div>\\('+math+'\\)</div></div>',answerType:'ordered-pair',pointAnswer:{x:String(xAnswer),y:String(yAnswer)},answerTex,explanation,fullWidthChoices:true,analysisGiven:'f'};
}
function extremumFieldsProblemV117(id,variant,kind,math,location,value,valueTex,locationTex,explanation){
  return{id,variant,questionHtml:'<div><div class="question-prompt">Find the local '+kind+' and where it occurs.</div><div>\\('+math+'\\)</div></div>',answerType:'extremum-fields',extremumAnswer:{kind,value:String(value),location:String(location)},answerTex:'\\text{local '+kind+'}='+valueTex+',\\quad x='+locationTex,explanation,fullWidthChoices:true,analysisGiven:'f'};
}
function analysisPoiCoordinatesV117(){
  const family=pick(['cubic','trig','quartic','exponential']);
  if(family==='cubic'){
    const h=ri(-4,4),C=ri(-8,8),middle=-3*h,y=C-2*h**3,fpp=h===0?'6x':'6('+shift('x',h)+')';
    return orderedPairProblemV117('u3-analysis-poi-v117-cubic-'+h+'-'+C,'analysis_inflection_point_coordinates_cubic','Find the coordinates of the point of inflection.','f(x)=x^3'+sgn(middle,'x^2')+sgn(C,''),h,y,'('+h+','+y+')','<strong>Step 1:</strong> Use the power rule twice: \\(f′(x)=3x^2-'+(6*h)+'x\\) and \\(f″(x)='+fpp+'\\). <strong>Step 2:</strong> Solve \\(f″(x)=0\\), which gives \\(x='+h+'\\). <strong>Step 3:</strong> For \\(x<'+h+'\\), \\(f″(x)<0\\); for \\(x>'+h+'\\), \\(f″(x)>0\\). The change from negative to positive proves that concavity changes. <strong>Step 4:</strong> Evaluate the original function: \\(f('+h+')='+y+'\\). Therefore the point of inflection is \\(('+h+','+y+')\\).');
  }
  if(family==='quartic'){
    const a=ri(1,4),C=ri(-6,6),x=a,y=C-a**4;
    return orderedPairProblemV117('u3-analysis-poi-v117-quartic-'+a+'-'+C,'analysis_inflection_point_coordinates_quartic','Find the coordinates of the point of inflection with the positive x-coordinate.','f(x)=x^4-'+(2*a)+'x^3'+sgn(C,''),x,y,'('+x+','+y+')','<strong>Step 1:</strong> Use the power rule twice: \\(f′(x)=4x^3-'+(6*a)+'x^2\\) and \\(f″(x)=12x(x-'+a+')\\). <strong>Step 2:</strong> Solve \\(f″(x)=0\\): the possible inflection values are \\(x=0\\) and \\(x='+a+'\\). <strong>Step 3:</strong> The signs of \\(f″\\) are positive on \\(( -\\infty,0)\\), negative on \\((0,'+a+')\\), and positive on \\(('+a+',\\infty)\\). Because \\(f″\\) changes sign at \\(x='+a+'\\), a point of inflection occurs there. <strong>Step 4:</strong> \\(f('+a+')='+y+'\\), so the point of inflection is \\(('+a+','+y+')\\).');
  }
  if(family==='exponential'){
    return orderedPairProblemV117('u3-analysis-poi-v117-exp','analysis_inflection_point_coordinates_exponential','Find the coordinates of the point of inflection.','f(x)=xe^x','-2','-2/e^2','\\left(-2,-\\frac{2}{e^2}\\right)','<strong>Step 1:</strong> Use the product rule twice: \\(f′(x)=e^x(x+1)\\) and \\(f″(x)=e^x(x+2)\\). <strong>Step 2:</strong> Since \\(e^x>0\\), \\(f″(x)<0\\) for \\(x<-2\\) and \\(f″(x)>0\\) for \\(x>-2\\). <strong>Step 3:</strong> This negative-to-positive sign change proves that concavity changes at \\(x=-2\\). <strong>Step 4:</strong> \\(f(-2)=-2e^{-2}=-\\frac{2}{e^2}\\). Therefore the point of inflection is \\(\\left(-2,-\\frac{2}{e^2}\\right)\\).');
  }
  const C=ri(-6,6);
  return orderedPairProblemV117('u3-analysis-poi-v117-trig-'+C,'analysis_inflection_point_coordinates_trigonometric','Find the coordinates of the point of inflection on \\(0\\lt x\\lt2\\pi\\).','f(x)=\\sin x'+sgn(C,''),'pi',C,'(\\pi,'+C+')','<strong>Step 1:</strong> Use the trigonometric derivative rules twice: \\(f′(x)=\\cos x\\) and \\(f″(x)=-\\sin x\\). <strong>Step 2:</strong> On \\((0,\\pi)\\), \\(f″(x)<0\\); on \\((\\pi,2\\pi)\\), \\(f″(x)>0\\). <strong>Step 3:</strong> The negative-to-positive sign change proves that concavity changes at \\(x=\\pi\\). <strong>Step 4:</strong> \\(f(\\pi)=\\sin\\pi'+sgn(C,'')+'='+C+'\\). Therefore the point of inflection is \\((\\pi,'+C+')\\).');
}
function analysisLocalExtremumFieldsV117(){
  const family=pick(['cubic','rational','quartic','logarithmic','exponential','radical','trigonometric']);
  if(family==='cubic'){
    const a=ri(1,5),C=ri(-8,8),maximum=R()<.5,kind=maximum?'maximum':'minimum',x=maximum?-a:a,y=C+(maximum?2:-2)*a**3;
    return extremumFieldsProblemV117('u3-analysis-ext-v117-cubic-'+a+'-'+C+'-'+kind,'analysis_local_extremum_fields_cubic',kind,'f(x)=x^3-'+(3*a*a)+'x'+sgn(C,''),x,y,String(y),String(x),'<strong>Step 1:</strong> Use the power rule: \\(f′(x)=3x^2-'+(3*a*a)+'=3(x-'+a+')(x+'+a+')\\). <strong>Step 2:</strong> Setting \\(f′(x)=0\\) gives the critical numbers \\(x=-'+a+'\\) and \\(x='+a+'\\). <strong>Step 3:</strong> The signs of \\(f′\\) are positive, negative, and positive on the three consecutive intervals. At \\(x='+x+'\\), the derivative changes '+(maximum?'from positive to negative, proving a local maximum':'from negative to positive, proving a local minimum')+'. <strong>Step 4:</strong> \\(f('+x+')='+y+'\\). Therefore the local '+kind+' is \\('+y+'\\) and it occurs at \\(x='+x+'\\).');
  }
  if(family==='rational'){
    const a=ri(1,6),maximum=R()<.5,kind=maximum?'maximum':'minimum',x=maximum?a:-a,y=Q(maximum?1:-1,2*a);
    return extremumFieldsProblemV117('u3-analysis-ext-v117-rational-'+a+'-'+kind,'analysis_local_extremum_fields_rational',kind,'f(x)=\\frac{x}{x^2+'+(a*a)+'}',x,qPlain(y),qTex(y),String(x),'<strong>Step 1:</strong> Use the quotient rule: \\(f′(x)=\\frac{'+(a*a)+'-x^2}{(x^2+'+(a*a)+')^2}\\). <strong>Step 2:</strong> The denominator is positive and the numerator vanishes at \\(x=\\pm'+a+'\\), so the signs of \\(f′\\) are negative, positive, and negative. <strong>Step 3:</strong> At \\(x='+x+'\\), the derivative changes '+(maximum?'from positive to negative, proving a local maximum':'from negative to positive, proving a local minimum')+'. <strong>Step 4:</strong> \\(f('+x+')='+qTex(y)+'\\). Therefore the local '+kind+' is \\('+qTex(y)+'\\) and it occurs at \\(x='+x+'\\).');
  }
  if(family==='quartic'){
    const a=ri(1,4),C=ri(-6,6),maximum=R()<.5,kind=maximum?'maximum':'minimum',x=maximum?0:a,y=maximum?C:C-a**4;
    return extremumFieldsProblemV117('u3-analysis-ext-v117-quartic-'+a+'-'+C+'-'+kind,'analysis_local_extremum_fields_quartic',kind,'f(x)=x^4-'+(2*a*a)+'x^2'+sgn(C,''),x,y,String(y),String(x),'<strong>Step 1:</strong> Use the power rule and factor: \\(f′(x)=4x^3-'+(4*a*a)+'x=4x(x-'+a+')(x+'+a+')\\). <strong>Step 2:</strong> The critical numbers are \\(x=-'+a+',0,'+a+'\\), and the signs of \\(f′\\) are negative, positive, negative, and positive. <strong>Step 3:</strong> At \\(x='+x+'\\), the derivative changes '+(maximum?'from positive to negative, proving a local maximum':'from negative to positive, proving a local minimum')+'. <strong>Step 4:</strong> \\(f('+x+')='+y+'\\). Therefore the local '+kind+' is \\('+y+'\\) and it occurs at \\(x='+x+'\\).');
  }
  if(family==='logarithmic'){
    const a=ri(2,7),value=a+'-'+a+'*ln('+a+')',valueTex=a+'-'+a+'\\ln('+a+')';
    return extremumFieldsProblemV117('u3-analysis-ext-v117-log-'+a,'analysis_local_extremum_fields_logarithmic','minimum','f(x)=x-'+a+'\\ln x,\\quad x\\gt0',a,value,valueTex,String(a),'<strong>Step 1:</strong> Use the power and logarithm derivative rules: \\(f′(x)=1-\\frac{'+a+'}{x}=\\frac{x-'+a+'}{x}\\). <strong>Step 2:</strong> On the domain \\(x>0\\), \\(f′<0\\) on \\((0,'+a+')\\) and \\(f′>0\\) on \\(('+a+',\\infty)\\). <strong>Step 3:</strong> The derivative changes from negative to positive at \\(x='+a+'\\), proving a local minimum. <strong>Step 4:</strong> \\(f('+a+')='+valueTex+'\\). Therefore the local minimum is \\('+valueTex+'\\) and it occurs at \\(x='+a+'\\).');
  }
  if(family==='exponential'){
    const maximum=R()<.5,kind=maximum?'maximum':'minimum',sign=maximum?'':'-',value=maximum?'1/e':'-1/e',valueTex=maximum?'\\frac1e':'-\\frac1e';
    return extremumFieldsProblemV117('u3-analysis-ext-v117-exp-'+kind,'analysis_local_extremum_fields_exponential',kind,'f(x)='+sign+'xe^{-x}',1,value,valueTex,'1','<strong>Step 1:</strong> Use the product and chain rules: \\(f′(x)='+sign+'e^{-x}(1-x)\\). <strong>Step 2:</strong> Since \\(e^{-x}>0\\), the derivative is '+(maximum?'positive for \\(x<1\\) and negative for \\(x>1\\)':'negative for \\(x<1\\) and positive for \\(x>1\\)')+'. <strong>Step 3:</strong> The derivative changes '+(maximum?'from positive to negative, proving a local maximum':'from negative to positive, proving a local minimum')+' at \\(x=1\\). <strong>Step 4:</strong> \\(f(1)='+valueTex+'\\). Therefore the local '+kind+' is \\('+valueTex+'\\) and it occurs at \\(x=1\\).');
  }
  if(family==='radical'){
    const m=ri(1,5),a=3*m,x=2*m,value=2*m+'*sqrt('+m+')',valueTex=(2*m)+'\\sqrt{'+m+'}';
    return extremumFieldsProblemV117('u3-analysis-ext-v117-radical-'+m,'analysis_local_extremum_fields_radical','maximum','f(x)=x\\sqrt{'+a+'-x},\\quad 0\\le x\\le '+a,x,value,valueTex,String(x),'<strong>Step 1:</strong> Use the product and chain rules: \\(f′(x)=\\frac{'+(2*a)+'-3x}{2\\sqrt{'+a+'-x}}\\). <strong>Step 2:</strong> Inside the domain, the denominator is positive. The numerator is positive for \\(0<x<'+x+'\\) and negative for \\('+x+'<x<'+a+'\\). <strong>Step 3:</strong> The derivative changes from positive to negative at \\(x='+x+'\\), proving a local maximum. <strong>Step 4:</strong> \\(f('+x+')='+valueTex+'\\). Therefore the local maximum is \\('+valueTex+'\\) and it occurs at \\(x='+x+'\\).');
  }
  const A=ri(2,7),C=ri(-5,5),maximum=R()<.5,kind=maximum?'maximum':'minimum',x=maximum?'pi/2':'3*pi/2',xTex=maximum?'\\frac{\\pi}{2}':'\\frac{3\\pi}{2}',value=maximum?A+C:C-A;
  return extremumFieldsProblemV117('u3-analysis-ext-v117-trig-'+A+'-'+C+'-'+kind,'analysis_local_extremum_fields_trigonometric',kind,'f(x)='+A+'\\sin x'+sgn(C,'')+',\\quad 0\\lt x\\lt2\\pi',x,value,String(value),xTex,'<strong>Step 1:</strong> Use the trigonometric derivative rule: \\(f′(x)='+A+'\\cos x\\). <strong>Step 2:</strong> The critical numbers are \\(x=\\frac{\\pi}{2}\\) and \\(x=\\frac{3\\pi}{2}\\), and the signs of \\(f′\\) are positive, negative, and positive. <strong>Step 3:</strong> At \\(x='+xTex+'\\), the derivative changes '+(maximum?'from positive to negative, proving a local maximum':'from negative to positive, proving a local minimum')+'. <strong>Step 4:</strong> \\(f('+xTex+')='+value+'\\). Therefore the local '+kind+' is \\('+value+'\\) and it occurs at \\(x='+xTex+'\\).');
}
function analysisRuleDirection(problem){
  const variant=String(problem.variant||''),given=problem.analysisGiven;
  if(given==='fp')return 'The first derivative is already given, so no additional derivative rule is needed before making its sign chart.';
  if(given==='fpp')return 'The second derivative is already given, so no additional derivative rule is needed before making its sign chart.';
  if(/rational/.test(variant))return 'Use the quotient rule to find the first derivative.';
  if(/radical/.test(variant))return 'Use the product rule together with the chain rule for the square-root factor.';
  if(/exponential/.test(variant))return 'Use the product rule together with the chain rule for the exponential factor.';
  if(/logarithmic/.test(variant))return 'Use the power rule and the logarithm derivative rule.';
  if(/trigonometric/.test(variant))return 'Use the trigonometric derivative rules.';
  return 'Use the power rule to find the needed derivative or second derivative.';
}
function analysisInterpretationStep(problem,focus){
  const question=String(problem.questionHtml||'');
  if(focus==='incdec'){
    const increasing=/\bincreasing\b/i.test(question);
    return increasing
      ? 'Since we want to know when \\(f\\) is increasing, we choose the intervals where \\(f′(x)>0\\).'
      : 'Since we want to know when \\(f\\) is decreasing, we choose the intervals where \\(f′(x)<0\\).';
  }
  if(focus==='concavity'){
    const up=/concave up/i.test(question);
    return up
      ? 'Since we want to know where \\(f\\) is concave up, we choose the intervals where \\(f″(x)>0\\).'
      : 'Since we want to know where \\(f\\) is concave down, we choose the intervals where \\(f″(x)<0\\).';
  }
  if(focus==='extrema'){
    const maximum=(problem.extremumAnswer?.kind||'')==='maximum'||/local maximum/i.test(question);
    return maximum
      ? 'To find a local maximum, we look for where \\(f′(x)\\) changes from positive to negative.'
      : 'To find a local minimum, we look for where \\(f′(x)\\) changes from negative to positive.';
  }
  return 'To find a point of inflection, we look for where \\(f″(x)\\) changes sign because that is where the graph changes concavity.';
}
function explainAnalysisExactV119(problem,focus){
  const interpretation=analysisInterpretationStep(problem,focus);
  const genericSelection=/Select the intervals with the requested sign|include finite critical endpoints with brackets|Use brackets at the finite critical endpoints/i;
  let steps=workedSegments(problem.explanation)
    .map(step=>genericSelection.test(step)?interpretation:step)
    .filter(step=>!(focus==='concavity'&&/Therefore.*concave up where.*concave down where/i.test(step)))
    .filter(step=>!(focus==='incdec'&&/Therefore.*(?:increasing.*decreasing|decreasing.*increasing)/i.test(step))),rule=analysisRuleDirection(problem);
  if(focus==='concavity'){
    steps=steps
      .filter(step=>!/Concavity intervals use parentheses/i.test(step))
      .filter(step=>!/Since we want to know where .* is concave (?:up|down)/i.test(step))
      .filter(step=>!/Therefore .* is concave (?:up|down) on/i.test(step));
  }
  if(!steps.some(step=>/\brules?\b|already given/i.test(step)))steps.unshift(rule);
  const hasInterpretation=focus==='incdec'
    ?steps.some(step=>/Since we want to know when .* is (?:increasing|decreasing).*choose the intervals where/i.test(step))
    :focus==='concavity'
      ?true
      :focus==='extrema'
        ?steps.some(step=>/changes? (?:from )?positive to negative|changes? (?:from )?negative to positive/i.test(step))
        :steps.some(step=>/(?:f″|second derivative).*changes? sign|sign change.*(?:concavity changes|point of inflection)|concavity changes/i.test(step));
  if(!hasInterpretation){
    const conclusionIndex=steps.findIndex(step=>/^Therefore\b/i.test(step));
    steps.splice(conclusionIndex<0?steps.length:conclusionIndex,0,interpretation);
  }
  const answer=String(problem.answerTex||'');
  if(focus==='incdec'){
    const ask=/\bincreasing\b/i.test(problem.questionHtml||'')?'increasing':'decreasing';
    if(!steps.some(step=>new RegExp(`therefore.*is ${ask} on`,'i').test(step)))steps.push(`Therefore \\(f\\) is ${ask} on \\(${answer}\\).`);
  }else if(focus==='concavity'){
    const ask=/concave up/i.test(problem.questionHtml||'')?'up':'down';
    const relation=ask==='up'?'\\gt0':'\\lt0';
    steps.push(`Since we want to know where \\(f\\) is concave ${ask}, we choose the intervals where \\(f″(x)${relation}\\). Therefore \\(f\\) is concave ${ask} on \\(${answer}\\); concavity intervals use parentheses.`);
  }else if(focus==='poi'&&!steps.some(step=>/point of inflection is/i.test(step))){
    steps.push(`Therefore the point of inflection is \\(${answer}\\).`);
  }else if(focus==='extrema'&&!steps.some(step=>/therefore the local/i.test(step))){
    const kind=problem.extremumAnswer?.kind||'extremum';
    steps.push(`Therefore the local ${kind} is \\(${problem.extremumAnswer?.value}\\) and it occurs at \\(x=${problem.extremumAnswer?.location}\\).`);
  }
  problem.analysisWorkedSteps=true;
  problem.explanation=numberedWorkedSolution(steps);
  return problem;
}
function analysisExactFocus(focus){
  if(focus==='incdec')return R()<.75?pick([...analysisTypedFFamilies.filter(f=>f!==analysisTypedFConcavity),analysisRadicalProduct])():pick(analysisTypedPrimeFamilies)();
  if(focus==='concavity')return R()<.75?analysisTypedFConcavity():pick([analysisTypedSecondQuadratic,analysisTypedSecondCubic])();
  if(focus==='poi')return analysisPoiCoordinatesV117();
  return analysisLocalExtremumFieldsV117();
}
function analysisCalcFromFTrig(){
  const c=pick([.18,.27,.36]),r=bisect(x=>Math.cos(x)-2*c*x,0,2),ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(0,r)]:[closedPart(r,4)];
  return calculatorIntervalProblem(`u3-analysis-calc-f-trig-${c}-${ask}`,'analysis_calculator_from_f_trig_polynomial',`Calculator Active: Where is \\(f\\) ${ask} on \\([0,4]\\)?`,`f(x)=\\sin x-${c}x^2`,parts,`Differentiate: \\(f'(x)=\\cos x-${2*c}x\\). Its zero is \\(x=${r.toFixed(3)}\\); use the sign of \\(f'\\) on either side.`,{analysisGiven:'f'});
}
function analysisCalcInverseTrig(){
  const c=pick([.22,.31,.43]),r=Math.sqrt(1/c-1),ask=R()<.5?'increasing':'decreasing',parts=ask==='increasing'?[closedPart(0,r)]:[closedPart(r,4)];
  return calculatorIntervalProblem(`u3-analysis-calc-f-invtrig-${c}-${ask}`,'analysis_calculator_from_f_inverse_trig',`Calculator Active: Where is \\(f\\) ${ask} on \\([0,4]\\)?`,`f(x)=\\tan^{-1}x-${c}x`,parts,`Differentiate: \\(f'(x)=\\frac1{1+x^2}-${c}\\). Its positive zero is \\(x=${r.toFixed(3)}\\). Check the sign of \\(f'\\) on the two subintervals.`,{analysisGiven:'f'});
}
function analysisCalcConcavityFromF(){
  const k=pick([4,6,9]),r=bisect(x=>Math.exp(-x)-6*x/k,0,2),ask=R()<.5?'up':'down',parts=ask==='up'?[openPart(0,r)]:[openPart(r,3)];
  return calculatorIntervalProblem(`u3-analysis-calc-conc-f-${k}-${ask}`,'analysis_calculator_concavity_from_f',`Calculator Active: Where is \\(f\\) concave ${ask} on \\(0\\lt x\\lt3\\)?`,`f(x)=e^{-x}-\\frac{x^3}{${k}}`,parts,`The second derivative is \\(f''(x)=e^{-x}-\\frac{6x}{${k}}\\). Its zero is \\(x=${r.toFixed(3)}\\); test its sign on each side.`,{analysisGiven:'f'});
}
function analysisCalcPoiFromF(){
  const k=pick([4,6,9]),r=bisect(x=>Math.exp(-x)-6*x/k,0,2),p=numeric(`u3-analysis-calc-poi-f-${k}`,'analysis_calculator_poi_from_f',`Calculator Active: Find the x-coordinate of the point of inflection on \\((0,3)\\).`,`f(x)=e^{-x}-\\frac{x^3}{${k}}`,r,r.toFixed(3),`The second derivative is \\(f''(x)=e^{-x}-\\frac{6x}{${k}}\\). It is zero at \\(x=${r.toFixed(3)}\\) and changes sign there.`,.0006,{analysisGiven:'f'});return p;
}
function analysisCalcExtremaFromF(){
  const c=pick([.35,.55,.8]),r=bisect(x=>Math.cos(x)-c*x,0,2),p=numeric(`u3-analysis-calc-ext-f-${c}`,'analysis_calculator_extrema_from_f',`Calculator Active: Find the x-coordinate of the local maximum on \\((0,3)\\).`,`f(x)=\\sin x-\\frac{${c}}2x^2`,r,r.toFixed(3),`Differentiate: \\(f'(x)=\\cos x-${c}x\\). Its zero is \\(x=${r.toFixed(3)}\\), where the derivative changes from positive to negative.`,.0006,{analysisGiven:'f'});return p;
}
function analysisCalcCombined(){
  const c=pick([.4,.7,1.1]),r=bisect(x=>Math.cos(x)-c*x,0,2),ask=R()<.5?'increasing and concave down':'decreasing and concave down',parts=ask.startsWith('increasing')?[closedPart(0,r)]:[closedPart(r,3)];
  return calculatorIntervalProblem(`u3-analysis-calc-combined-${c}-${ask.startsWith('increasing')}`,'analysis_calculator_combined_behavior',`Calculator Active: Where is \\(f\\) ${ask} on \\([0,3]\\)?`,`f(x)=\\sin x-\\frac{${c}}2x^2`,parts,`The derivative \\(f'(x)=\\cos x-${c}x\\) is zero at \\(x=${r.toFixed(3)}\\). Also \\(f''(x)=-\\sin x-${c}\\lt0\\) on the interval. Intersect the requested conditions.`,{analysisGiven:'f'});
}
function analysisCalcLocalMaximumExp(){
  const k=pick([2,3,5,7]),r=bisect(x=>Math.exp(-x)-x/k,0,2);
  return numeric(`u3-analysis-calc-max-exp-${k}`,'analysis_calculator_local_maximum_exponential',`Calculator Active: Given \\(f'\\), find the x-coordinate of the local maximum on \\(0\\lt x\\lt3\\).`,`f'(x)=e^{-x}-\\frac{x}{${k}}`,r,r.toFixed(3),`Enter \\(Y_1=e^{-x}-\\frac{x}{${k}}\\), then use the zero/root command on \\(0\\lt x\\lt3\\). The zero is \\(x=${r.toFixed(3)}\\). Check values of \\(Y_1\\) on both sides: it changes from positive to negative, so this is a local maximum.`,.0006,{analysisGiven:'fp'});
}
function analysisCalcLocalMaximumSine(){
  const c=pick([.23,.37,.58]),a=Math.asin(c),r=Math.PI-a;
  return numeric(`u3-analysis-calc-max-sine-${c}`,'analysis_calculator_local_maximum_sine',`Calculator Active: Given \\(f'\\), find the x-coordinate of the local maximum on \\(0\\lt x\\lt2\\pi\\).`,`f'(x)=\\sin x-${c}`,r,r.toFixed(3),`Graph \\(Y_1=\\sin x-${c}\\) and use zero/root. There are two zeros; at \\(x=${r.toFixed(3)}\\), \\(Y_1\\) changes from positive to negative, so \\(f\\) has a local maximum there.`,.0006,{analysisGiven:'fp'});
}
function analysisCalcLocalMinimumSine(){
  const c=pick([.18,.32,.47]),r=2*Math.PI-Math.asin(c);
  return numeric(`u3-analysis-calc-min-sine-${c}`,'analysis_calculator_local_minimum_sine',`Calculator Active: Given \\(f'\\), find the x-coordinate of the local minimum on \\(0\\lt x\\lt2\\pi\\).`,`f'(x)=\\sin x+${c}`,r,r.toFixed(3),`Graph \\(Y_1=\\sin x+${c}\\) on the stated interval and use zero/root. At the later zero, \\(x=${r.toFixed(3)}\\), \\(f'\\) changes from negative to positive, so \\(f\\) has a local minimum.`,.0006,{analysisGiven:'fp'});
}
function analysisCalcPoiLog(){
  const c=pick([.73,1.06,1.31]),r=Math.exp(c)-2;
  return numeric(`u3-analysis-calc-poi-log-${c}`,'analysis_calculator_inflection_logarithmic',`Calculator Active: Given \\(f''\\), find the x-coordinate of the point of inflection on \\(0\\lt x\\lt4\\).`,`f''(x)=\\ln(x+2)-${c}`,r,r.toFixed(3),`Enter \\(Y_1=\\ln(x+2)-${c}\\) and use zero/root. The zero is \\(x=${r.toFixed(3)}\\). Values of \\(Y_1\\) change from negative to positive, so concavity changes there.`,.0006,{analysisGiven:'fpp'});
}
function analysisCalcPrimeGaussian(){
  const c=pick([.17,.29,.43]),r=Math.sqrt(-Math.log(c)),ask=R()<.5?'increasing':'decreasing';
  const parts=ask==='increasing'?[closedPart(-r,r)]:[closedPart(-3,-r),closedPart(r,3)];
  return calculatorIntervalProblem('u3-analysis-calc-fp-gaussian-'+c+'-'+ask,'analysis_calculator_first_derivative_gaussian','Calculator Active: Given \\(f′\\), where is \\(f\\) '+ask+' on \\([-3,3]\\)?','f′(x)=e^{-x^2}-'+c,parts,'The zeros are \\(x='+(-r).toFixed(3)+'\\) and \\(x='+r.toFixed(3)+'\\). The displayed first derivative is positive between them and negative outside them.',{analysisGiven:'fp'});
}
function analysisCalcSecondCosSquare(){
  const c=pick([.18,.36,.57]),r=Math.sqrt(Math.acos(c)),ask=R()<.5?'up':'down';
  const parts=ask==='up'?[openPart(0,r)]:[openPart(r,1.5)];
  return calculatorIntervalProblem('u3-analysis-calc-fpp-cossquare-'+c+'-'+ask,'analysis_calculator_second_derivative_cosine_composition','Calculator Active: Given \\(f″\\), where is \\(f\\) concave '+ask+' on \\(0<x<1.5\\)?','f″(x)=\\cos(x^2)-'+c,parts,'The displayed second derivative is zero at \\(x='+r.toFixed(3)+'\\). It is positive to the left and negative to the right.',{analysisGiven:'fpp'});
}
function analysisCalcPoiCosSquare(){
  const c=pick([.21,.39,.62]),r=Math.sqrt(Math.acos(c));
  return numeric('u3-analysis-calc-poi-cossquare-'+c,'analysis_calculator_inflection_cosine_composition','Calculator Active: Given \\(f″\\), find the x-coordinate of the point of inflection on \\(0<x<1.5\\).','f″(x)=\\cos(x^2)-'+c,r,r.toFixed(3),'The displayed second derivative is zero at \\(x='+r.toFixed(3)+'\\) and changes from positive to negative there.',.0006,{analysisGiven:'fpp'});
}
function analysisCalcExtremaGaussian(){
  const c=pick([.19,.32,.46]),r=Math.sqrt(-Math.log(c)),maximum=R()<.5,x=maximum?r:-r,kind=maximum?'maximum':'minimum';
  return numeric('u3-analysis-calc-ext-gaussian-'+c+'-'+kind,'analysis_calculator_local_extremum_gaussian','Calculator Active: Given \\(f′\\), find the x-coordinate of the local '+kind+' on \\((-3,3)\\).','f′(x)=e^{-x^2}-'+c,x,x.toFixed(3),'The displayed first derivative is zero at \\(x='+(-r).toFixed(3)+'\\) and \\(x='+r.toFixed(3)+'\\). At \\(x='+x.toFixed(3)+'\\), it changes '+(maximum?'from positive to negative':'from negative to positive')+', so this is the requested local '+kind+'.',.0006,{analysisGiven:'fp'});
}
/* Calculator-only derivative analysis.  Every displayed derivative is scanned
 * numerically before it is shown.  Candidates are rejected unless every root
 * is stable, separated, non-nice, and accompanied by a genuine sign change. */
function analysisCalcFixed(value){
  const shown=Number(value).toFixed(3);return shown==='-0.000'?'0.000':shown;
}
function analysisCalcCompact(value){
  const rounded=Number(Number(value).toFixed(3));return Object.is(rounded,-0)?'0':String(rounded);
}
function analysisCalcExpression(terms){
  let out='';
  for(const term of terms){
    const coefficient=Number(term.coefficient);if(!coefficient)continue;
    const body=String(term.body||''),absolute=Math.abs(coefficient),number=analysisCalcCompact(absolute);
    const fraction=body.match(/^\\frac\{([^{}]+)\}\{([^{}]+)\}$/);let payload;
    if(fraction){
      const numerator=fraction[1],denominator=fraction[2],needsGrouping=/[+-]/.test(numerator.slice(1));
      const scaledNumerator=Math.abs(absolute-1)<1e-12?numerator:(needsGrouping?`${number}\\left(${numerator}\\right)`:`${number}${numerator}`);
      payload=`\\frac{${scaledNumerator}}{${denominator}}`;
    }else payload=body?`${Math.abs(absolute-1)<1e-12?'':number}${body}`:number;
    if(!out)out=`${coefficient<0?'-':''}${payload}`;else out+=`${coefficient<0?'-':'+'}${payload}`;
  }
  return out||'0';
}
function analysisCalcSpec(key,terms,fn,left,right,signature){
  return{key,terms,tex:analysisCalcExpression(terms),fn,left,right,signature:String(signature),mixedFunction:true};
}
function analysisCalcReverseSpec(spec){
  const original=spec.fn,terms=spec.terms.map(term=>({coefficient:-term.coefficient,body:term.body}));
  return Object.assign({},spec,{terms,tex:analysisCalcExpression(terms),fn:x=>-original(x),reversed:!spec.reversed});
}
function analysisCalcTrig(name,k,argument='x'){
  const inside=k===1?argument:`${analysisCalcCompact(k)}${argument}`;return`\\${name}(${inside})`;
}
function analysisCalcSingleRootCandidate(){
  const key=pick(['quintic-cosine','cubic-sine','exponential-linear-sine','logarithmic-linear-cosine','rational-linear-sine','polynomial-exponential','logarithmic-quadratic','composed-sine-linear','exponential-rational-linear','inverse-trig-cosine']);
  let a,b,c,k,d,rate,shift,terms,fn,left,right,signature;
  if(key==='quintic-cosine'){
    a=pick([2.1,2.7,3.4]);b=pick([.45,.65,.85]);k=pick([1,1.4,1.8]);d=pick([-6.3,-3.7,2.6,4.6,7.4]);
    terms=[{coefficient:1,body:'x^5'},{coefficient:a,body:'x'},{coefficient:b,body:analysisCalcTrig('cos',k)},{coefficient:-d,body:''}];fn=x=>x**5+a*x+b*Math.cos(k*x)-d;left=-2.2;right=2.2;signature=`${a}-${b}-${k}-${d}`;
  }else if(key==='cubic-sine'){
    a=pick([2.2,2.8,3.5]);b=pick([.4,.6,.8]);k=pick([1,1.5,2]);d=pick([-8.4,-4.7,3.8,5.3,9.1]);
    terms=[{coefficient:1,body:'x^3'},{coefficient:a,body:'x'},{coefficient:b,body:analysisCalcTrig('sin',k)},{coefficient:-d,body:''}];fn=x=>x**3+a*x+b*Math.sin(k*x)-d;left=-3;right=3;signature=`${a}-${b}-${k}-${d}`;
  }else if(key==='exponential-linear-sine'){
    rate=pick([.4,.6,.8]);a=pick([1.6,2.1,2.6]);b=pick([.35,.5,.65]);k=pick([1,1.5,2]);d=pick([-1.8,.7,3.4,5.1,7.6]);
    terms=[{coefficient:1,body:`e^{${analysisCalcCompact(rate)}x}`},{coefficient:a,body:'x'},{coefficient:b,body:analysisCalcTrig('sin',k)},{coefficient:-d,body:''}];fn=x=>Math.exp(rate*x)+a*x+b*Math.sin(k*x)-d;left=-1.5;right=2.5;signature=`${rate}-${a}-${b}-${k}-${d}`;
  }else if(key==='logarithmic-linear-cosine'){
    shift=pick([2.2,2.6,3.1]);a=pick([1.4,1.8,2.3]);b=pick([.35,.5,.65]);k=pick([1,1.4,1.8]);d=pick([-1.6,1.2,3.3,5.7,8.1]);
    terms=[{coefficient:1,body:`\\ln(x+${analysisCalcCompact(shift)})`},{coefficient:a,body:'x'},{coefficient:b,body:analysisCalcTrig('cos',k)},{coefficient:-d,body:''}];fn=x=>Math.log(x+shift)+a*x+b*Math.cos(k*x)-d;left=-shift+.5;right=4;signature=`${shift}-${a}-${b}-${k}-${d}`;
  }else if(key==='rational-linear-sine'){
    a=pick([1.8,2.2,2.6]);b=pick([.6,.8,1.1]);c=pick([2.2,3.1,4.3]);d=pick([.3,.45,.6]);k=pick([1,1.5,2]);shift=pick([-5.2,-2.7,.9,3.1,5.4]);
    terms=[{coefficient:a,body:'x'},{coefficient:b,body:`\\frac{x}{x^2+${analysisCalcCompact(c)}}`},{coefficient:d,body:analysisCalcTrig('sin',k)},{coefficient:-shift,body:''}];fn=x=>a*x+b*x/(x*x+c)+d*Math.sin(k*x)-shift;left=-3;right=3;signature=`${a}-${b}-${c}-${d}-${k}-${shift}`;
  }else if(key==='polynomial-exponential'){
    a=pick([1.3,1.8,2.4]);b=pick([.6,.9,1.2]);rate=pick([.4,.6,.8]);d=pick([2.7,4.4,6.8,9.3,12.1]);
    terms=[{coefficient:1,body:'x^3'},{coefficient:a,body:'x'},{coefficient:b,body:`e^{-${analysisCalcCompact(rate)}x}`},{coefficient:-d,body:''}];fn=x=>x**3+a*x+b*Math.exp(-rate*x)-d;left=0;right=3;signature=`${a}-${b}-${rate}-${d}`;
  }else if(key==='logarithmic-quadratic'){
    a=pick([.8,1.2,1.7]);b=pick([.55,.8,1.1]);shift=pick([1.8,2.4,3.2]);d=pick([2.8,4.9,7.3,10.6,14.2]);
    terms=[{coefficient:1,body:'x^2'},{coefficient:a,body:'x'},{coefficient:b,body:`\\ln(x+${analysisCalcCompact(shift)})`},{coefficient:-d,body:''}];fn=x=>x*x+a*x+b*Math.log(x+shift)-d;left=0;right=4;signature=`${a}-${b}-${shift}-${d}`;
  }else if(key==='composed-sine-linear'){
    a=pick([3.2,3.7,4.3]);b=pick([.3,.4,.5]);d=pick([1.9,3.6,5.2,7.1,8.6]);
    terms=[{coefficient:a,body:'x'},{coefficient:b,body:'\\sin(x^2)'},{coefficient:-d,body:''}];fn=x=>a*x+b*Math.sin(x*x)-d;left=0;right=2.5;signature=`${a}-${b}-${d}`;
  }else if(key==='exponential-rational-linear'){
    rate=pick([.35,.5,.7]);a=pick([1.4,1.9,2.4]);b=pick([.45,.7,.95]);c=pick([2.1,3.3,4.6]);d=pick([-1.4,1.8,4.2,6.7,9.4]);
    terms=[{coefficient:1,body:`e^{${analysisCalcCompact(rate)}x}`},{coefficient:a,body:'x'},{coefficient:b,body:`\\frac{x}{x^2+${analysisCalcCompact(c)}}`},{coefficient:-d,body:''}];fn=x=>Math.exp(rate*x)+a*x+b*x/(x*x+c)-d;left=-1.5;right=3;signature=`${rate}-${a}-${b}-${c}-${d}`;
  }else{
    a=pick([1.6,2.1,2.6]);b=pick([.55,.8,1.05]);c=pick([.3,.45,.6]);k=pick([1,1.5,2]);d=pick([-4.6,-2.1,1.3,3.7,6.2]);
    terms=[{coefficient:a,body:'x'},{coefficient:b,body:'\\tan^{-1}x'},{coefficient:c,body:analysisCalcTrig('cos',k)},{coefficient:-d,body:''}];fn=x=>a*x+b*Math.atan(x)+c*Math.cos(k*x)-d;left=-3;right=3;signature=`${a}-${b}-${c}-${k}-${d}`;
  }
  return analysisCalcSpec(key,terms,fn,left,right,signature);
}
function analysisCalcMultipleRootCandidate(){
  const key=pick(['cubic-cosine-mix','quartic-sine-mix','damped-exponential-sine','logarithmic-cosine-mix','rational-sine-mix','polynomial-exponential-mix','cosine-composition-mix','quotient-cosine-mix','logarithmic-polynomial-mix','exponential-sine-polynomial']);
  let a,b,c,k,d,rate,shift,terms,fn,left,right,signature;
  if(key==='cubic-cosine-mix'){
    a=pick([2.4,3.3,4.5]);b=pick([.45,.7,1.05]);k=pick([1,1.5,2]);d=pick([-1.7,-.6,.4,1.3]);
    terms=[{coefficient:1,body:'x^3'},{coefficient:-a,body:'x'},{coefficient:b,body:analysisCalcTrig('cos',k)},{coefficient:d,body:''}];fn=x=>x**3-a*x+b*Math.cos(k*x)+d;left=-3;right=3;signature=`${a}-${b}-${k}-${d}`;
  }else if(key==='quartic-sine-mix'){
    a=pick([3.2,4.4,5.6]);b=pick([.5,.8,1.1]);k=pick([1,1.5,2]);d=pick([-3.1,-1.4,.7,2.2]);
    terms=[{coefficient:1,body:'x^4'},{coefficient:-a,body:'x^2'},{coefficient:b,body:analysisCalcTrig('sin',k)},{coefficient:d,body:''}];fn=x=>x**4-a*x*x+b*Math.sin(k*x)+d;left=-3;right=3;signature=`${a}-${b}-${k}-${d}`;
  }else if(key==='damped-exponential-sine'){
    rate=pick([.25,.4,.6]);a=pick([.8,1.1,1.4]);k=pick([1.2,1.6,2.1]);d=pick([.25,.45,.7,.95]);
    terms=[{coefficient:1,body:`e^{-${analysisCalcCompact(rate)}x}`},{coefficient:a,body:analysisCalcTrig('sin',k)},{coefficient:-d,body:''}];fn=x=>Math.exp(-rate*x)+a*Math.sin(k*x)-d;left=0;right=6;signature=`${rate}-${a}-${k}-${d}`;
  }else if(key==='logarithmic-cosine-mix'){
    shift=pick([2.2,2.7,3.3]);a=pick([.7,1,1.3]);k=pick([1.1,1.6,2]);d=pick([-.2,.35,.8,1.25]);
    terms=[{coefficient:1,body:`\\ln(x+${analysisCalcCompact(shift)})`},{coefficient:a,body:analysisCalcTrig('cos',k)},{coefficient:-d,body:''}];fn=x=>Math.log(x+shift)+a*Math.cos(k*x)-d;left=-shift+.5;right=4.5;signature=`${shift}-${a}-${k}-${d}`;
  }else if(key==='rational-sine-mix'){
    a=pick([1.4,2,2.6]);b=pick([.7,1,1.3]);c=pick([1.8,2.7,4.1]);k=pick([1.1,1.6,2.1]);d=pick([-.45,-.15,.2,.55]);
    terms=[{coefficient:a,body:`\\frac{x}{x^2+${analysisCalcCompact(c)}}`},{coefficient:b,body:analysisCalcTrig('sin',k)},{coefficient:-d,body:''}];fn=x=>a*x/(x*x+c)+b*Math.sin(k*x)-d;left=-4;right=4;signature=`${a}-${b}-${c}-${k}-${d}`;
  }else if(key==='polynomial-exponential-mix'){
    a=pick([2.2,3.1,4.3]);b=pick([.5,.8,1.1]);rate=pick([.4,.6,.8]);d=pick([-1.5,-.4,.7,1.8]);
    terms=[{coefficient:1,body:'x^3'},{coefficient:-a,body:'x'},{coefficient:b,body:`e^{-${analysisCalcCompact(rate)}x}`},{coefficient:-d,body:''}];fn=x=>x**3-a*x+b*Math.exp(-rate*x)-d;left=-1.5;right=3;signature=`${a}-${b}-${rate}-${d}`;
  }else if(key==='cosine-composition-mix'){
    a=pick([.18,.32,.47]);d=pick([.25,.55,.85,1.15]);
    terms=[{coefficient:1,body:'\\cos(x^2)'},{coefficient:a,body:'x'},{coefficient:-d,body:''}];fn=x=>Math.cos(x*x)+a*x-d;left=0;right=3;signature=`${a}-${d}`;
  }else if(key==='quotient-cosine-mix'){
    a=pick([1.7,2.6,3.8]);b=pick([.4,.65,.9]);c=pick([1.8,2.7,4.2]);k=pick([1,1.5,2]);d=pick([-.7,-.2,.35,.8]);
    terms=[{coefficient:1,body:`\\frac{x^3-${analysisCalcCompact(a)}x}{x^2+${analysisCalcCompact(c)}}`},{coefficient:b,body:analysisCalcTrig('cos',k)},{coefficient:-d,body:''}];fn=x=>(x**3-a*x)/(x*x+c)+b*Math.cos(k*x)-d;left=-3;right=3;signature=`${a}-${b}-${c}-${k}-${d}`;
  }else if(key==='logarithmic-polynomial-mix'){
    shift=pick([2.8,3.4,4.1]);a=pick([.25,.4,.6]);b=pick([.8,1.3,1.9]);d=pick([.6,1.1,1.7,2.4]);
    terms=[{coefficient:1,body:`\\ln(x+${analysisCalcCompact(shift)})`},{coefficient:a,body:'x^2'},{coefficient:-b,body:'x'},{coefficient:-d,body:''}];fn=x=>Math.log(x+shift)+a*x*x-b*x-d;left=-shift+.5;right=4;signature=`${shift}-${a}-${b}-${d}`;
  }else{
    rate=pick([.25,.4,.55]);a=pick([.65,.9,1.2]);k=pick([1.2,1.7,2.2]);b=pick([.12,.2,.28]);d=pick([.35,.6,.9,1.2]);
    terms=[{coefficient:1,body:`e^{-${analysisCalcCompact(rate)}x}`},{coefficient:a,body:analysisCalcTrig('sin',k)},{coefficient:b,body:'x'},{coefficient:-d,body:''}];fn=x=>Math.exp(-rate*x)+a*Math.sin(k*x)+b*x-d;left=0;right=6;signature=`${rate}-${a}-${k}-${b}-${d}`;
  }
  return analysisCalcSpec(key,terms,fn,left,right,signature);
}
function analysisCalcScanRoots(fn,left,right,steps){
  const roots=[],width=(right-left)/steps,push=value=>{if(value>left+1e-7&&value<right-1e-7&&!roots.some(root=>Math.abs(root-value)<width*1.6))roots.push(value);};
  let x0=left,y0=fn(x0);if(!Number.isFinite(y0))return[];
  for(let index=1;index<=steps;index++){
    const x1=left+width*index,y1=fn(x1);if(!Number.isFinite(y1))return[];
    if(Math.abs(y0)<1e-11)push(x0);
    if(y0*y1<0)push(bisect(fn,x0,x1,90));
    if(index===steps&&Math.abs(y1)<1e-11)push(x1);
    x0=x1;y0=y1;
  }
  return roots.sort((a,b)=>a-b);
}
function analysisCalcRootLooksNice(value){
  if(Math.abs(value)<.06)return true;
  if(/[05]$/.test(Math.abs(value).toFixed(3)))return true;
  for(let denominator=1;denominator<=10;denominator++){
    const tolerance=denominator<=2?.025:denominator<=4?.012:denominator<=6?.006:.0025;
    if(Math.abs(value-Math.round(value*denominator)/denominator)<tolerance)return true;
  }
  for(let numerator=-24;numerator<=24;numerator++)if(Math.abs(value-numerator*Math.PI/12)<.01)return true;
  for(const common of [Math.SQRT2,Math.sqrt(3),Math.E,Math.PI])for(const sign of [-1,1])if(Math.abs(value-sign*common)<.01)return true;
  return false;
}
function analysisCalcSegmentProbe(fn,left,right){
  const samples=[.16,.28,.4,.5,.6,.72,.84].map(fraction=>{const x=left+(right-left)*fraction;return{x,value:fn(x)};});
  if(samples.some(sample=>!Number.isFinite(sample.value)||Math.abs(sample.value)<1e-5))return null;
  const signs=new Set(samples.map(sample=>Math.sign(sample.value)));if(signs.size!==1)return null;
  return samples.reduce((best,sample)=>Math.abs(sample.value)>Math.abs(best.value)?sample:best,samples[0]);
}
function analysisCalcValidateCandidate(spec,{exactRoots=0,maxRoots=3}={}){
  if(!spec?.mixedFunction||!(spec.right>spec.left))return null;
  const coarse=analysisCalcScanRoots(spec.fn,spec.left,spec.right,720),roots=analysisCalcScanRoots(spec.fn,spec.left,spec.right,1440);
  if(!roots.length||roots.length>maxRoots||(exactRoots&&roots.length!==exactRoots)||coarse.length!==roots.length)return null;
  if(roots.some((root,index)=>Math.abs(root-coarse[index])>.00015||analysisCalcRootLooksNice(root)||root-spec.left<.18||spec.right-root<.18))return null;
  if(roots.some((root,index)=>index&&root-roots[index-1]<.38))return null;
  if(new Set(roots.map(analysisCalcFixed)).size!==roots.length)return null;
  const boundaries=[spec.left,...roots,spec.right],probes=[],signs=[];
  for(let index=0;index<boundaries.length-1;index++){
    const probe=analysisCalcSegmentProbe(spec.fn,boundaries[index],boundaries[index+1]);if(!probe)return null;
    probes.push(probe.x);signs.push(Math.sign(probe.value));
  }
  for(let index=1;index<signs.length;index++)if(signs[index]===signs[index-1])return null;
  const transitions=[];
  for(let index=0;index<roots.length;index++){
    const gap=Math.min(roots[index]-boundaries[index],boundaries[index+2]-roots[index]),delta=Math.min(.08,gap*.18),leftX=roots[index]-delta,rightX=roots[index]+delta,leftValue=spec.fn(leftX),rightValue=spec.fn(rightX);
    if(delta<.015||!Number.isFinite(leftValue)||!Number.isFinite(rightValue)||Math.abs(leftValue)<.001||Math.abs(rightValue)<.001||leftValue*rightValue>=0||Math.abs(spec.fn(roots[index]))>1e-7)return null;
    transitions.push({leftX,rightX,leftValue,rightValue,leftSign:Math.sign(leftValue),rightSign:Math.sign(rightValue)});
  }
  const fineStep=(spec.right-spec.left)/1440;
  for(let index=1;index<1440;index++){
    const x=spec.left+fineStep*index,value=Math.abs(spec.fn(x));
    if(value<.0008&&!roots.some(root=>Math.abs(root-x)<fineStep*2.5))return null;
  }
  return Object.assign({},spec,{roots,boundaries,probes,probeValues:probes.map(spec.fn),signs,transitions,nonNice:true,allRootsNonNice:true,signChangeValidated:true,rootStabilityValidated:true,painfulMixedFunction:true,calculatorRequired:true});
}
function analysisCalcValidatedProfile({exactRoots=0}={}){
  for(let attempt=1;attempt<=240;attempt++){
    const candidate=exactRoots?analysisCalcSingleRootCandidate():(R()<.72?analysisCalcMultipleRootCandidate():analysisCalcSingleRootCandidate()),profile=analysisCalcValidateCandidate(candidate,{exactRoots,maxRoots:3});
    if(profile){profile.validationAttempts=attempt;return profile;}
  }
  const fallback=analysisCalcSpec('validated-quintic-cosine-fallback',[{coefficient:1,body:'x^5'},{coefficient:2.7,body:'x'},{coefficient:.8,body:'\\cos(1.3x)'},{coefficient:-4.55,body:''}],x=>x**5+2.7*x+.8*Math.cos(1.3*x)-4.55,-2,2,'2.7-.8-1.3-4.55'),profile=analysisCalcValidateCandidate(fallback,{exactRoots:exactRoots||1,maxRoots:3});
  if(!profile)throw new Error('Unable to build a validated calculator derivative-analysis problem.');
  profile.validationAttempts=241;return profile;
}
function analysisCalcReverseProfile(profile){
  const reversed=analysisCalcReverseSpec(profile),fn=reversed.fn;
  return Object.assign({},profile,reversed,{probeValues:profile.probeValues.map(value=>-value),signs:profile.signs.map(sign=>-sign),transitions:profile.transitions.map(transition=>({leftX:transition.leftX,rightX:transition.rightX,leftValue:-transition.leftValue,rightValue:-transition.rightValue,leftSign:-transition.leftSign,rightSign:-transition.rightSign})),fn,reversed:!profile.reversed});
}
function analysisCalcProfileAudit(profile,focus){
  return{validationVersion:'11.13',focus,family:profile.key,validationAttempts:profile.validationAttempts,domain:[profile.left,profile.right],roots:[...profile.roots],signs:[...profile.signs],testPoints:[...profile.probes],testValues:[...profile.probeValues],transitions:profile.transitions.map(transition=>Object.assign({},transition)),allRootsNonNice:profile.allRootsNonNice,rootStabilityValidated:profile.rootStabilityValidated,signChangeValidated:profile.signChangeValidated,evaluate:profile.fn};
}
function analysisCalcParts(profile,wantPositive,closed){
  const parts=[];for(let index=0;index<profile.signs.length;index++)if((profile.signs[index]>0)===wantPositive)parts.push({left:profile.boundaries[index],right:profile.boundaries[index+1],leftClosed:closed,rightClosed:closed});return parts;
}
function analysisCalcPartsTex(parts){
  const fixed=parts.map(part=>Object.assign({},part,{left:Number.isFinite(part.left)?{raw:String(part.left),tex:analysisCalcFixed(part.left)}:part.left,right:Number.isFinite(part.right)?{raw:String(part.right),tex:analysisCalcFixed(part.right)}:part.right}));return intervalText(fixed,true);
}
function analysisCalcDomainTex(profile,closed){
  return`${closed?'[':'('}${analysisCalcCompact(profile.left)},${analysisCalcCompact(profile.right)}${closed?']':')'}`;
}
function analysisCalcRootsStep(profile,symbol){
  const roots=profile.roots.map(root=>`x\\approx${analysisCalcFixed(root)}`).join(',\\;');
  return`On a TI-84 Plus, enter \\(Y_1=${profile.tex}\\), graph it on \\(${analysisCalcDomainTex(profile,false)}\\), and use <strong>2nd</strong> → <strong>TRACE (CALC)</strong> → <strong>2:zero</strong> at every crossing. The calculator gives ${profile.roots.length===1?'the zero':'the zeros'} \\(${roots}\\) of \\(${symbol}\\).`;
}
function analysisCalcPartitionStep(profile){
  const intervals=profile.boundaries.slice(0,-1).map((left,index)=>`(${analysisCalcFixed(left)},${analysisCalcFixed(profile.boundaries[index+1])})`).join('\\cup');
  return`These values divide the stated domain into \\(${intervals}\\).`;
}
function analysisCalcGraphSignStep(profile,symbol){
  const positive=analysisCalcPartsTex(analysisCalcParts(profile,true,false)),negative=analysisCalcPartsTex(analysisCalcParts(profile,false,false));
  return`The graph of \\(${symbol}\\) is above the x-axis on \\(${positive}\\), so \\(${symbol}(x)\\gt0\\) there. It is below the x-axis on \\(${negative}\\), so \\(${symbol}(x)\\lt0\\) there.`;
}
function analysisCalcIntervalExplanation(profile,symbol,ask,parts,focus){
  const wantsPositive=focus==='incdec'?ask==='increasing':ask==='up',inequality=wantsPositive?'\\gt0':'\\lt0',description=focus==='incdec'?`${ask}`:`concave ${ask}`,criterion=focus==='incdec'?`Since we want to know where \\(f\\) is ${ask}, we choose the intervals where \\(f′(x)${inequality}\\). Therefore \\(f\\) is ${description} on \\(${analysisCalcPartsTex(parts)}\\).`:`Since we want to know where \\(f\\) is concave ${ask}, we choose the intervals where \\(f″(x)${inequality}\\). Therefore \\(f\\) is ${description} on \\(${analysisCalcPartsTex(parts)}\\).`;
  return numberedWorkedSolution([
    `The given ${focus==='incdec'?'first':'second'} derivative is \\(${symbol}(x)=${profile.tex}\\).`,
    analysisCalcRootsStep(profile,`${symbol}(x)`),
    analysisCalcPartitionStep(profile),
    analysisCalcGraphSignStep(profile,symbol),
    criterion
  ]);
}
function analysisCalcPointExplanation(profile,symbol,kind,focus){
  const root=profile.roots[0],transition=profile.transitions[0],leftWord=transition.leftSign>0?'positive':'negative',rightWord=transition.rightSign>0?'positive':'negative';
  const leftPosition=transition.leftSign>0?'above':'below',rightPosition=transition.rightSign>0?'above':'below';
  const graphSign=`The graph of \\(${symbol}\\) is ${leftPosition} the x-axis to the left of \\(x\\approx${analysisCalcFixed(root)}\\) and ${rightPosition} the x-axis to the right. Thus \\(${symbol}\\) is ${leftWord} on the left and ${rightWord} on the right.`;
  const reasoning=focus==='extrema'
    ?`Therefore \\(f′\\) changes from ${leftWord} to ${rightWord} at \\(x\\approx${analysisCalcFixed(root)}\\), so \\(f\\) has a local ${kind} there.`
    :`Therefore \\(f″\\) changes from ${leftWord} to ${rightWord} at \\(x\\approx${analysisCalcFixed(root)}\\), so concavity changes and \\(f\\) has a point of inflection there.`;
  return numberedWorkedSolution([
    `The given ${focus==='extrema'?'first':'second'} derivative is \\(${symbol}(x)=${profile.tex}\\).`,
    analysisCalcRootsStep(profile,`${symbol}(x)`),
    graphSign,
    reasoning
  ]);
}
function analysisCalcHardIncDec(){
  let profile=analysisCalcValidatedProfile();if(R()<.5)profile=analysisCalcReverseProfile(profile);
  const ask=R()<.5?'increasing':'decreasing',parts=analysisCalcParts(profile,ask==='increasing',true),audit=analysisCalcProfileAudit(profile,'incdec');
  return calculatorIntervalProblem(`u3-analysis-validated-incdec-${profile.key}-${profile.signature}-${ask}-${profile.reversed?'r':'n'}`,`analysis_calculator_validated_incdec_${profile.key}`,`Calculator Active: Given \\(f′\\), where is \\(f\\) ${ask} on \\(${analysisCalcDomainTex(profile,true)}\\)?`,`f′(x)=${profile.tex}`,parts,analysisCalcIntervalExplanation(profile,'f′',ask,parts,'incdec'),{analysisGiven:'fp',calculatorWorked:true,calculatorValidated:true,calculatorRequired:true,painfulMixedFunction:true,nonNiceRoot:true,numericalRoot:profile.roots[0],validatedRoots:[...profile.roots],calculatorAudit:audit});
}
function analysisCalcHardConcavity(){
  let profile=analysisCalcValidatedProfile();if(R()<.5)profile=analysisCalcReverseProfile(profile);
  const ask=R()<.5?'up':'down',parts=analysisCalcParts(profile,ask==='up',false),audit=analysisCalcProfileAudit(profile,'concavity');
  return calculatorIntervalProblem(`u3-analysis-validated-concavity-${profile.key}-${profile.signature}-${ask}-${profile.reversed?'r':'n'}`,`analysis_calculator_validated_concavity_${profile.key}`,`Calculator Active: Given \\(f″\\), where is \\(f\\) concave ${ask} on \\(${analysisCalcDomainTex(profile,false)}\\)?`,`f″(x)=${profile.tex}`,parts,analysisCalcIntervalExplanation(profile,'f″',ask,parts,'concavity'),{analysisGiven:'fpp',calculatorWorked:true,calculatorValidated:true,calculatorRequired:true,painfulMixedFunction:true,nonNiceRoot:true,numericalRoot:profile.roots[0],validatedRoots:[...profile.roots],calculatorAudit:audit});
}
function analysisCalcHardPoi(){
  let profile=analysisCalcValidatedProfile({exactRoots:1});if(R()<.5)profile=analysisCalcReverseProfile(profile);
  const root=profile.roots[0],audit=analysisCalcProfileAudit(profile,'poi');
  return numeric(`u3-analysis-validated-poi-${profile.key}-${profile.signature}-${profile.reversed?'r':'n'}`,`analysis_calculator_validated_poi_${profile.key}`,`Calculator Active: Given \\(f″\\), find the x-coordinate of the point of inflection on \\(${analysisCalcDomainTex(profile,false)}\\).`,`f″(x)=${profile.tex}`,root,analysisCalcFixed(root),analysisCalcPointExplanation(profile,'f″','point of inflection','poi'),.0006,{analysisGiven:'fpp',calculatorWorked:true,calculatorValidated:true,calculatorRequired:true,painfulMixedFunction:true,nonNiceRoot:true,numericalRoot:root,validatedRoots:[root],calculatorAudit:audit});
}
function analysisCalcHardExtrema(){
  const kind=R()<.5?'minimum':'maximum';let profile=analysisCalcValidatedProfile({exactRoots:1});
  const currentMinimum=profile.signs[0]<0&&profile.signs[1]>0;if((kind==='minimum')!==currentMinimum)profile=analysisCalcReverseProfile(profile);
  const root=profile.roots[0],audit=analysisCalcProfileAudit(profile,'extrema');
  return numeric(`u3-analysis-validated-extrema-${profile.key}-${profile.signature}-${kind}`,`analysis_calculator_validated_extrema_${profile.key}_${kind}`,`Calculator Active: Given \\(f′\\), find the x-coordinate of the local ${kind} on \\(${analysisCalcDomainTex(profile,false)}\\).`,`f′(x)=${profile.tex}`,root,analysisCalcFixed(root),analysisCalcPointExplanation(profile,'f′',kind,'extrema'),.0006,{analysisGiven:'fp',calculatorWorked:true,calculatorValidated:true,calculatorRequired:true,painfulMixedFunction:true,nonNiceRoot:true,numericalRoot:root,validatedRoots:[root],calculatorAudit:audit});
}
function explainAnalysisCalculatorV1113(problem){
  if(!problem?.calculatorValidated||!problem?.calculatorAudit?.signChangeValidated)throw new Error('Unvalidated calculator derivative-analysis problem.');
  return problem;
}
const analysisCalcFocusPools={
  incdec:[analysisCalcHardIncDec],
  concavity:[analysisCalcHardConcavity],
  poi:[analysisCalcHardPoi],
  extrema:[analysisCalcHardExtrema]
};
U3['increasing-decreasing-intervals-concavity-and-extrema']=(opts={})=>{
  const mode=modeOf(opts),requested=String(opts.analysisFocus||opts.focus||opts.practiceType||'mixed').toLowerCase(),focus=requested==='mixed'?pick(['incdec','concavity','poi','extrema']):(analysisCalcFocusPools[requested]?requested:'incdec'),source=R()<.15?'test':'assignment';
  const p=mode==='calculator'?explainAnalysisCalculatorV1113(pick(analysisCalcFocusPools[focus])()):explainAnalysisExactV119(analysisExactFocus(focus),focus);p.analysisFocus=focus;return stamp(p,'increasing-decreasing-intervals-concavity-and-extrema',mode,source,p.variant);
};

function piExpression(n,d=1){
  const q=Q(n,d),sign=q.n<0?'-':'',a=Math.abs(q.n);
  const raw=q.d===1?`${sign}${a===1?'':`${a}*`}pi`:`${sign}${a===1?'':`${a}*`}pi/${q.d}`;
  const tex=q.d===1?`${sign}${a===1?'':a}\\pi`:`${sign}\\frac{${a===1?'':a}\\pi}{${q.d}}`;
  return{raw,tex};
}
function linSqrt(){
  const a=pick([4,9,16,25]),r=Math.sqrt(a),delta=pick([-1,1,2]),q=Q(delta,2*r),value=r+q.n/q.d;
  const answer=frac(Math.round(value*q.d),q.d),target=a+delta;
  return exactExpression(`u3-lin-sqrt-${a}-${delta}`,'linearization_square_root',`Use a linearization at \\(x=${a}\\) to approximate \\(\\sqrt{${target}}\\).`,`f(x)=\\sqrt{x}`,String(value),answer,`<strong>Step 1:</strong> Rewrite \\(f(x)=x^{\\frac12}\\) and use the power rule: \\(f′(x)=\\frac{1}{2\\sqrt{x}}\\). <strong>Step 2:</strong> At \\(x=${a}\\), \\(f(${a})=${r}\\) and \\(f′(${a})=\\frac{1}{${2*r}}\\). <strong>Step 3:</strong> The linearization for this problem is \\(L(x)=${r}+\\frac{1}{${2*r}}(x-${a})\\). <strong>Step 4:</strong> Evaluate it at the requested input: \\(L(${target})=${r}+\\frac{1}{${2*r}}(${target}-${a})=${answer}\\).`);
}
function linCubeRoot(){
  const r=pick([2,3,4]),a=r**3,delta=pick([-2,-1,1,2]),q=Q(delta,3*r*r),value=Q(r*q.d+q.n,q.d);
  const target=a+delta,answer=qTex(value);
  return exactExpression(`u3-lin-cuberoot-${a}-${delta}`,'linearization_cube_root',`Use a linearization at \\(x=${a}\\) to approximate \\(\\sqrt[3]{${target}}\\).`,`f(x)=\\sqrt[3]{x}`,qPlain(value),answer,`<strong>Step 1:</strong> Rewrite \\(f(x)=x^{\\frac13}\\) and use the power rule: \\(f′(x)=\\frac{1}{3x^{\\frac23}}\\). <strong>Step 2:</strong> At \\(x=${a}\\), \\(f(${a})=${r}\\) and \\(f′(${a})=\\frac{1}{${3*r*r}}\\). <strong>Step 3:</strong> The linearization for this problem is \\(L(x)=${r}+\\frac{1}{${3*r*r}}(x-${a})\\). <strong>Step 4:</strong> Evaluate it at the requested input: \\(L(${target})=${r}+\\frac{1}{${3*r*r}}(${target}-${a})=${answer}\\).`);
}
function diffCircle(){
  const r=ri(3,10),dr=pick([1,2]),q=Q(2*r*dr,10),ans=piExpression(q.n,q.d);
  return exactExpression(`u3-diff-circle-${r}-${dr}`,'differentials_circle_area',`A circle's radius changes from \\(${r}\\) to \\(${r+dr/10}\\). Estimate the change in its area.`,'',ans.raw,ans.tex,`Start with \\(A=\\pi r^2\\), so \\(dA=2\\pi r\\,dr\\). With \\(r=${r}\\) and \\(dr=\\frac{${dr}}{10}\\), \\(dA=${ans.tex}\\).`,{hint:'<strong>Circle area:</strong> \\(A=\\pi r^2\\)',hintButtonLabel:'Show Formula'});
}
function diffRectangle(){
  const x=ri(4,10),y=ri(3,9),dx=pick([1,2]),dy=pick([-1,1]),q=Q(y*dx+x*dy,10);
  return exactExpression(`u3-diff-rectangle-${x}-${y}-${dx}-${dy}`,'differentials_rectangle_two_variables',`A rectangle has side lengths \\(x=${x}\\) and \\(y=${y}\\). Estimate the change in area when \\(dx=\\frac{${dx}}{10}\\) and \\(dy=${frac(dy,10)}\\).`,'',qPlain(q),qTex(q),`Start with \\(A=xy\\). The differential is \\(dA=y\\,dx+x\\,dy\\). Substitution gives \\(dA=${y}\\left(\\frac{${dx}}{10}\\right)+${x}\\left(${frac(dy,10)}\\right)=${qTex(q)}\\).`,{hint:'<strong>Rectangle area:</strong> \\(A=xy\\)',hintButtonLabel:'Show Formula'});
}
function diffTriangle(){
  const b=2*ri(2,6),h=ri(3,9),db=pick([1,2]),dh=pick([-1,1]),q=Q(h*db+b*dh,20);
  return exactExpression(`u3-diff-triangle-${b}-${h}-${db}-${dh}`,'differentials_triangle_two_variables',`A triangle has base \\(b=${b}\\) and height \\(h=${h}\\). Estimate the change in area when \\(db=\\frac{${db}}{10}\\) and \\(dh=${frac(dh,10)}\\).`,'',qPlain(q),qTex(q),`Start with \\(A=\\frac12bh\\). Then \\(dA=\\frac12(h\\,db+b\\,dh)\\). Substitute the given values to obtain \\(dA=${qTex(q)}\\).`,{hint:'<strong>Triangle area:</strong> \\(A=\\frac12bh\\)',hintButtonLabel:'Show Formula'});
}
function diffEquilateral(){
  const s=2*ri(2,7),ds=pick([1,2]),q=Q(s*ds,20),raw=`${qPlain(q)}*sqrt(3)`,tex=q.d===1?`${q.n}\\sqrt3`:`\\frac{${q.n}\\sqrt3}{${q.d}}`;
  return exactExpression(`u3-diff-equilateral-${s}-${ds}`,'differentials_equilateral_triangle',`An equilateral triangle's side length changes from \\(${s}\\) to \\(${s+ds/10}\\). Estimate the change in its area.`,'',raw,tex,`Start with \\(A=\\frac{\\sqrt3}{4}s^2\\). Thus \\(dA=\\frac{\\sqrt3}{2}s\\,ds\\). With \\(ds=\\frac{${ds}}{10}\\), this gives \\(dA=${tex}\\).`,{hint:'<strong>Equilateral triangle area:</strong> \\(A=\\frac{\\sqrt3}{4}s^2\\)',hintButtonLabel:'Show Formula'});
}
function diffSphere(){
  const r=ri(2,7),dr=pick([1,2]),q=Q(4*r*r*dr,10),ans=piExpression(q.n,q.d);
  return exactExpression(`u3-diff-sphere-${r}-${dr}`,'differentials_sphere_volume',`A sphere's radius changes from \\(${r}\\) to \\(${r+dr/10}\\). Estimate the change in its volume.`,'',ans.raw,ans.tex,`Start with \\(V=\\frac43\\pi r^3\\). The differential is \\(dV=4\\pi r^2\\,dr\\). Substitution gives \\(dV=${ans.tex}\\).`,{hint:'<strong>Sphere volume:</strong> \\(V=\\frac43\\pi r^3\\)',hintButtonLabel:'Show Formula'});
}
function diffCylinder(){
  const r=ri(2,6),h=ri(4,10),dr=pick([1,2]),dh=pick([-1,1]),q=Q(2*r*h*dr+r*r*dh,10),ans=piExpression(q.n,q.d);
  return exactExpression(`u3-diff-cylinder-${r}-${h}-${dr}-${dh}`,'differentials_cylinder_two_variables',`A right circular cylinder has radius \\(r=${r}\\) and height \\(h=${h}\\). Estimate the change in volume when \\(dr=\\frac{${dr}}{10}\\) and \\(dh=${frac(dh,10)}\\).`,'',ans.raw,ans.tex,`Start with \\(V=\\pi r^2h\\). Then \\(dV=2\\pi rh\\,dr+\\pi r^2\\,dh\\). Substitution and simplification give \\(dV=${ans.tex}\\).`,{hint:'<strong>Cylinder volume:</strong> \\(V=\\pi r^2h\\)',hintButtonLabel:'Show Formula'});
}
function diffCone(){
  const r=3*ri(1,3),h=3*ri(2,5),dr=pick([1,2]),dh=pick([-1,1]),q=Q(2*r*h*dr+r*r*dh,30),ans=piExpression(q.n,q.d);
  return exactExpression(`u3-diff-cone-${r}-${h}-${dr}-${dh}`,'differentials_cone_two_variables',`A right circular cone has radius \\(r=${r}\\) and height \\(h=${h}\\). Estimate the change in volume when \\(dr=\\frac{${dr}}{10}\\) and \\(dh=${frac(dh,10)}\\).`,'',ans.raw,ans.tex,`Start with \\(V=\\frac13\\pi r^2h\\). Differentiate: \\(dV=\\frac13\\pi(2rh\\,dr+r^2\\,dh)\\). Substitution gives \\(dV=${ans.tex}\\).`,{hint:'<strong>Cone volume:</strong> \\(V=\\frac13\\pi r^2h\\)',hintButtonLabel:'Show Formula'});
}
function diffPrism(){
  const l=ri(3,8),w=ri(2,7),h=ri(4,9),dl=pick([1,2]),dw=pick([-1,1]),q=Q(w*h*dl+l*h*dw,10);
  return exactExpression(`u3-diff-prism-${l}-${w}-${h}-${dl}-${dw}`,'differentials_rectangular_prism',`A rectangular prism has dimensions \\(l=${l}\\), \\(w=${w}\\), and \\(h=${h}\\). Estimate the change in volume when \\(dl=\\frac{${dl}}{10}\\), \\(dw=${frac(dw,10)}\\), and \\(dh=0\\).`,'',qPlain(q),qTex(q),`Start with \\(V=lwh\\). Since \\(dh=0\\), \\(dV=wh\\,dl+lh\\,dw\\). Substitution gives \\(dV=${qTex(q)}\\).`,{hint:'<strong>Rectangular prism volume:</strong> \\(V=lwh\\)',hintButtonLabel:'Show Formula'});
}
function diffTrapezoid(){
  const b1=ri(4,9),b2=ri(3,8),h=ri(3,7),db=pick([1,2]),dh=pick([-1,1]),q=Q(h*db+(b1+b2)*dh,20);
  return exactExpression(`u3-diff-trapezoid-${b1}-${b2}-${h}-${db}-${dh}`,'differentials_trapezoid_area',`A trapezoid has bases \\(b_1=${b1}\\), \\(b_2=${b2}\\), and height \\(h=${h}\\). Estimate the change in area when \\(db_1=\\frac{${db}}{10}\\), \\(db_2=0\\), and \\(dh=${frac(dh,10)}\\).`,'',qPlain(q),qTex(q),`Start with \\(A=\\frac12(b_1+b_2)h\\). Thus \\(dA=\\frac12[h(db_1+db_2)+(b_1+b_2)dh]\\). Substitution gives \\(dA=${qTex(q)}\\).`,{hint:'<strong>Trapezoid area:</strong> \\(A=\\frac12(b_1+b_2)h\\)',hintButtonLabel:'Show Formula'});
}
function diffCircleCircumference(){
  const r=ri(2,10),dr=pick([1,2,3]),q=Q(2*dr,10),ans=piExpression(q.n,q.d);
  return exactExpression(`u3-diff-circle-circ-${r}-${dr}`,'differentials_circle_circumference',`A circle's radius is \\(${r}\\) and changes by \\(dr=\\frac{${dr}}{10}\\). Estimate the change in its circumference.`,'',ans.raw,ans.tex,`Start with \\(C=2\\pi r\\). Then \\(dC=2\\pi\\,dr=2\\pi\\left(\\frac{${dr}}{10}\\right)=${ans.tex}\\).`,{hint:'<strong>Circle circumference:</strong> \\(C=2\\pi r\\)',hintButtonLabel:'Show Formula'});
}
function diffSphereSurfaceArea(){
  const r=ri(2,8),dr=pick([1,2]),q=Q(8*r*dr,10),ans=piExpression(q.n,q.d);
  return exactExpression(`u3-diff-sphere-sa-${r}-${dr}`,'differentials_sphere_surface_area',`A sphere's radius is \\(${r}\\) and changes by \\(dr=\\frac{${dr}}{10}\\). Estimate the change in its surface area.`,'',ans.raw,ans.tex,`Start with \\(S=4\\pi r^2\\). Then \\(dS=8\\pi r\\,dr\\), which gives \\(dS=${ans.tex}\\).`,{hint:'<strong>Sphere surface area:</strong> \\(S=4\\pi r^2\\)',hintButtonLabel:'Show Formula'});
}
function diffCylinderSurfaceArea(){
  const r=ri(2,6),h=ri(4,10),dr=pick([1,2]),dh=pick([-1,1]),q=Q((4*r+2*h)*dr+2*r*dh,10),ans=piExpression(q.n,q.d);
  return exactExpression(`u3-diff-cylinder-sa-${r}-${h}-${dr}-${dh}`,'differentials_cylinder_surface_area',`A closed right circular cylinder has radius \\(r=${r}\\) and height \\(h=${h}\\). Estimate the change in surface area when \\(dr=\\frac{${dr}}{10}\\) and \\(dh=${frac(dh,10)}\\).`,'',ans.raw,ans.tex,`Start with \\(S=2\\pi r^2+2\\pi rh\\). Therefore \\(dS=(4\\pi r+2\\pi h)dr+2\\pi r\\,dh\\). Substitution gives \\(dS=${ans.tex}\\).`,{hint:'<strong>Closed-cylinder surface area:</strong> \\(S=2\\pi r^2+2\\pi rh\\)',hintButtonLabel:'Show Formula'});
}
function diffIncludedAngleTriangle(){
  const a=ri(4,9),b=ri(3,8),da=pick([1,2]),db=pick([-1,1]),q=Q(b*da+a*db,40);
  return exactExpression(`u3-diff-triangle-angle-${a}-${b}-${da}-${db}`,'differentials_triangle_included_angle',`A triangle has side lengths \\(a=${a}\\) and \\(b=${b}\\) with fixed included angle \\(\\theta=\\frac{\\pi}{6}\\). Estimate the change in area when \\(da=\\frac{${da}}{10}\\) and \\(db=${frac(db,10)}\\).`,'',qPlain(q),qTex(q),`Start with \\(A=\\frac12ab\\sin\\theta\\). Since \\(\\theta\\) is fixed, \\(dA=\\frac12\\sin\\theta(b\\,da+a\\,db)\\). Use \\(\\sin(\\pi/6)=\\frac12\\) to obtain \\(dA=${qTex(q)}\\).`,{hint:'<strong>Triangle area with an included angle:</strong> \\(A=\\frac12ab\\sin\\theta\\)',hintButtonLabel:'Show Formula'});
}
function diffRightTriangleHypotenuse(){
  const [a,b,c]=pick([[3,4,5],[5,12,13],[8,15,17]]),da=pick([1,2]),db=pick([-1,1]),q=Q(a*da+b*db,10*c);
  return exactExpression(`u3-diff-right-triangle-${a}-${b}-${da}-${db}`,'differentials_right_triangle_hypotenuse',`A right triangle has legs \\(a=${a}\\) and \\(b=${b}\\). Estimate the change in its hypotenuse when \\(da=\\frac{${da}}{10}\\) and \\(db=${frac(db,10)}\\).`,'',qPlain(q),qTex(q),`Start with \\(a^2+b^2=c^2\\), so \\(c=${c}\\). Differentiate: \\(a\\,da+b\\,db=c\\,dc\\). Therefore \\(dc=\\frac{a\\,da+b\\,db}{c}=${qTex(q)}\\).`,{hint:'<strong>Pythagorean Theorem:</strong> \\(a^2+b^2=c^2\\)',hintButtonLabel:'Show Formula'});
}
function differentialPromptBox(problem,prompt){
  problem.questionHtml='<div><div class="question-prompt">'+prompt+'</div></div>';
  return problem;
}
function differentialForwardWording(problem){
  const oldNew=R()<.85,id=String(problem.id||'');
  let match,prompt='';
  if((match=id.match(/^u3-diff-circle-(\d+)-(\d+)$/))){
    const r=Number(match[1]),d=Number(match[2]);
    prompt=oldNew
      ?"A circle's radius changes from \\("+r+"\\) to \\("+fmt(r+d/10,2)+"\\). Estimate the change in its area."
      :"A circle has radius \\(r="+r+"\\), and \\(dr="+frac(d,10)+"\\). Estimate \\(dA\\).";
  }else if((match=id.match(/^u3-diff-rectangle-(\d+)-(\d+)-(\d+)-(-?\d+)$/))){
    const x=Number(match[1]),y=Number(match[2]),dx=Number(match[3]),dy=Number(match[4]);
    prompt=oldNew
      ?"A rectangle's side lengths change from \\(x="+x+"\\), \\(y="+y+"\\) to \\(x="+fmt(x+dx/10,2)+"\\), \\(y="+fmt(y+dy/10,2)+"\\). Estimate the change in area."
      :"A rectangle has side lengths \\(x="+x+"\\), \\(y="+y+"\\), with \\(dx="+frac(dx,10)+"\\) and \\(dy="+frac(dy,10)+"\\). Estimate \\(dA\\).";
  }else if((match=id.match(/^u3-diff-triangle-(\d+)-(\d+)-(\d+)-(-?\d+)$/))){
    const b=Number(match[1]),h=Number(match[2]),db=Number(match[3]),dh=Number(match[4]);
    prompt=oldNew
      ?"A triangle's base and height change from \\(b="+b+"\\), \\(h="+h+"\\) to \\(b="+fmt(b+db/10,2)+"\\), \\(h="+fmt(h+dh/10,2)+"\\). Estimate the change in area."
      :"A triangle has \\(b="+b+"\\), \\(h="+h+"\\), \\(db="+frac(db,10)+"\\), and \\(dh="+frac(dh,10)+"\\). Estimate \\(dA\\).";
  }else if((match=id.match(/^u3-diff-equilateral-(\d+)-(\d+)$/))){
    const s=Number(match[1]),ds=Number(match[2]);
    prompt=oldNew
      ?"An equilateral triangle's side length changes from \\("+s+"\\) to \\("+fmt(s+ds/10,2)+"\\). Estimate the change in its area."
      :"An equilateral triangle has side length \\(s="+s+"\\), and \\(ds="+frac(ds,10)+"\\). Estimate \\(dA\\).";
  }else if((match=id.match(/^u3-diff-sphere-(\d+)-(\d+)$/))){
    const r=Number(match[1]),dr=Number(match[2]);
    prompt=oldNew
      ?"A sphere's radius changes from \\("+r+"\\) to \\("+fmt(r+dr/10,2)+"\\). Estimate the change in its volume."
      :"A sphere has radius \\(r="+r+"\\), and \\(dr="+frac(dr,10)+"\\). Estimate \\(dV\\).";
  }else if((match=id.match(/^u3-diff-cylinder-(\d+)-(\d+)-(\d+)-(-?\d+)$/))){
    const r=Number(match[1]),h=Number(match[2]),dr=Number(match[3]),dh=Number(match[4]);
    prompt=oldNew
      ?"A right circular cylinder's radius and height change from \\(r="+r+"\\), \\(h="+h+"\\) to \\(r="+fmt(r+dr/10,2)+"\\), \\(h="+fmt(h+dh/10,2)+"\\). Estimate the change in volume."
      :"A right circular cylinder has \\(r="+r+"\\), \\(h="+h+"\\), \\(dr="+frac(dr,10)+"\\), and \\(dh="+frac(dh,10)+"\\). Estimate \\(dV\\).";
  }else if((match=id.match(/^u3-diff-cone-(\d+)-(\d+)-(\d+)-(-?\d+)$/))){
    const r=Number(match[1]),h=Number(match[2]),dr=Number(match[3]),dh=Number(match[4]);
    prompt=oldNew
      ?"A right circular cone's radius and height change from \\(r="+r+"\\), \\(h="+h+"\\) to \\(r="+fmt(r+dr/10,2)+"\\), \\(h="+fmt(h+dh/10,2)+"\\). Estimate the change in volume."
      :"A right circular cone has \\(r="+r+"\\), \\(h="+h+"\\), \\(dr="+frac(dr,10)+"\\), and \\(dh="+frac(dh,10)+"\\). Estimate \\(dV\\).";
  }else if((match=id.match(/^u3-diff-prism-(\d+)-(\d+)-(\d+)-(\d+)-(-?\d+)$/))){
    const l=Number(match[1]),w=Number(match[2]),h=Number(match[3]),dl=Number(match[4]),dw=Number(match[5]);
    prompt=oldNew
      ?"A rectangular prism changes from \\(l="+l+"\\), \\(w="+w+"\\), \\(h="+h+"\\) to \\(l="+fmt(l+dl/10,2)+"\\), \\(w="+fmt(w+dw/10,2)+"\\), \\(h="+h+"\\). Estimate the change in volume."
      :"A rectangular prism has \\(l="+l+"\\), \\(w="+w+"\\), \\(h="+h+"\\), with \\(dl="+frac(dl,10)+"\\), \\(dw="+frac(dw,10)+"\\), and \\(dh=0\\). Estimate \\(dV\\).";
  }else if((match=id.match(/^u3-diff-trapezoid-(\d+)-(\d+)-(\d+)-(\d+)-(-?\d+)$/))){
    const b1=Number(match[1]),b2=Number(match[2]),h=Number(match[3]),db=Number(match[4]),dh=Number(match[5]);
    prompt=oldNew
      ?"A trapezoid changes from \\(b_1="+b1+"\\), \\(b_2="+b2+"\\), \\(h="+h+"\\) to \\(b_1="+fmt(b1+db/10,2)+"\\), \\(b_2="+b2+"\\), \\(h="+fmt(h+dh/10,2)+"\\). Estimate the change in area."
      :"A trapezoid has \\(b_1="+b1+"\\), \\(b_2="+b2+"\\), \\(h="+h+"\\), with \\(db_1="+frac(db,10)+"\\), \\(db_2=0\\), and \\(dh="+frac(dh,10)+"\\). Estimate \\(dA\\).";
  }else if((match=id.match(/^u3-diff-circle-circ-(\d+)-(\d+)$/))){
    const r=Number(match[1]),dr=Number(match[2]);
    prompt=oldNew
      ?"A circle's radius changes from \\("+r+"\\) to \\("+fmt(r+dr/10,2)+"\\). Estimate the change in circumference."
      :"A circle has radius \\(r="+r+"\\), and \\(dr="+frac(dr,10)+"\\). Estimate \\(dC\\).";
  }else if((match=id.match(/^u3-diff-sphere-sa-(\d+)-(\d+)$/))){
    const r=Number(match[1]),dr=Number(match[2]);
    prompt=oldNew
      ?"A sphere's radius changes from \\("+r+"\\) to \\("+fmt(r+dr/10,2)+"\\). Estimate the change in surface area."
      :"A sphere has radius \\(r="+r+"\\), and \\(dr="+frac(dr,10)+"\\). Estimate \\(dS\\).";
  }else if((match=id.match(/^u3-diff-cylinder-sa-(\d+)-(\d+)-(\d+)-(-?\d+)$/))){
    const r=Number(match[1]),h=Number(match[2]),dr=Number(match[3]),dh=Number(match[4]);
    prompt=oldNew
      ?"A closed right circular cylinder changes from \\(r="+r+"\\), \\(h="+h+"\\) to \\(r="+fmt(r+dr/10,2)+"\\), \\(h="+fmt(h+dh/10,2)+"\\). Estimate the change in surface area."
      :"A closed right circular cylinder has \\(r="+r+"\\), \\(h="+h+"\\), \\(dr="+frac(dr,10)+"\\), and \\(dh="+frac(dh,10)+"\\). Estimate \\(dS\\).";
  }else if((match=id.match(/^u3-diff-triangle-angle-(\d+)-(\d+)-(\d+)-(-?\d+)$/))){
    const a=Number(match[1]),b=Number(match[2]),da=Number(match[3]),db=Number(match[4]);
    prompt=oldNew
      ?"A triangle has fixed included angle \\(\\pi/6\\). Its adjacent sides change from \\(a="+a+"\\), \\(b="+b+"\\) to \\(a="+fmt(a+da/10,2)+"\\), \\(b="+fmt(b+db/10,2)+"\\). Estimate the change in area."
      :"A triangle has \\(a="+a+"\\), \\(b="+b+"\\), fixed included angle \\(\\pi/6\\), \\(da="+frac(da,10)+"\\), and \\(db="+frac(db,10)+"\\). Estimate \\(dA\\).";
  }else if((match=id.match(/^u3-diff-right-triangle-(\d+)-(\d+)-(\d+)-(-?\d+)$/))){
    const a=Number(match[1]),b=Number(match[2]),da=Number(match[3]),db=Number(match[4]);
    prompt=oldNew
      ?"A right triangle's legs change from \\(a="+a+"\\), \\(b="+b+"\\) to \\(a="+fmt(a+da/10,2)+"\\), \\(b="+fmt(b+db/10,2)+"\\). Estimate the change in its hypotenuse."
      :"A right triangle has legs \\(a="+a+"\\), \\(b="+b+"\\), with \\(da="+frac(da,10)+"\\) and \\(db="+frac(db,10)+"\\). Estimate \\(dc\\).";
  }
  if(prompt)differentialPromptBox(problem,prompt);
  problem.isDifferentialWord=true;
  problem.differentialDirection='forward';
  problem.differentialWording=oldNew?'old-new':'explicit-differential';
  return problem;
}
function reverseDifferentialCircle(){
  const r=ri(3,10),dr=pick([1,2]),change=piExpression(2*r*dr,10),answer=Q(dr,10),natural=R()<.85;
  const prompt=natural
    ?"A circle has radius \\("+r+"\\). Its area increases by approximately \\("+change.tex+"\\). Estimate how much the radius increases."
    :"For a circle with \\(r="+r+"\\), suppose \\(dA="+change.tex+"\\). Estimate \\(dr\\).";
  const p=exactExpression('u3-diff-reverse-circle-'+r+'-'+dr,'differentials_reverse_circle_radius',prompt,'',qPlain(answer),qTex(answer),'<strong>Step 1:</strong> Use \\(A=\\pi r^2\\), so \\(dA=2\\pi r\\,dr\\). <strong>Step 2:</strong> Solve for the requested change: \\(dr=\\frac{dA}{2\\pi r}\\). <strong>Step 3:</strong> Substitute \\(r='+r+'\\) and \\(dA='+change.tex+'\\) to get \\(dr='+qTex(answer)+'\\).',{hint:'<strong>Circle area:</strong> \\(A=\\pi r^2\\)',hintButtonLabel:'Show Formula'});p.isDifferentialWord=true;p.differentialDirection='reverse';p.differentialWording=natural?'old-new':'explicit-differential';return p;
}
function reverseDifferentialSphere(){
  const r=ri(2,7),dr=pick([1,2]),change=piExpression(4*r*r*dr,10),answer=Q(dr,10),natural=R()<.85;
  const prompt=natural
    ?"A sphere has radius \\("+r+"\\). Its volume increases by approximately \\("+change.tex+"\\). Estimate how much the radius increases."
    :"For a sphere with \\(r="+r+"\\), suppose \\(dV="+change.tex+"\\). Estimate \\(dr\\).";
  const p=exactExpression('u3-diff-reverse-sphere-'+r+'-'+dr,'differentials_reverse_sphere_radius',prompt,'',qPlain(answer),qTex(answer),'<strong>Step 1:</strong> Use \\(V=\\frac43\\pi r^3\\), so \\(dV=4\\pi r^2\\,dr\\). <strong>Step 2:</strong> Solve: \\(dr=\\frac{dV}{4\\pi r^2}\\). <strong>Step 3:</strong> Substitute the given values to obtain \\(dr='+qTex(answer)+'\\).',{hint:'<strong>Sphere volume:</strong> \\(V=\\frac43\\pi r^3\\)',hintButtonLabel:'Show Formula'});p.isDifferentialWord=true;p.differentialDirection='reverse';p.differentialWording=natural?'old-new':'explicit-differential';return p;
}
function reverseDifferentialCylinder(){
  const r=ri(2,6),h=ri(4,10),dh=pick([1,2]),change=piExpression(r*r*dh,10),answer=Q(dh,10),natural=R()<.85;
  const prompt=natural
    ?"A right circular cylinder has fixed radius \\("+r+"\\) and height \\("+h+"\\). Its volume increases by approximately \\("+change.tex+"\\). Estimate how much the height increases."
    :"A right circular cylinder has \\(r="+r+"\\), \\(h="+h+"\\), and \\(dr=0\\). If \\(dV="+change.tex+"\\), estimate \\(dh\\).";
  const p=exactExpression('u3-diff-reverse-cylinder-'+r+'-'+h+'-'+dh,'differentials_reverse_cylinder_height',prompt,'',qPlain(answer),qTex(answer),'<strong>Step 1:</strong> Use \\(V=\\pi r^2h\\). Since the radius is fixed, \\(dV=\\pi r^2\\,dh\\). <strong>Step 2:</strong> Solve: \\(dh=\\frac{dV}{\\pi r^2}\\). <strong>Step 3:</strong> Substitute to get \\(dh='+qTex(answer)+'\\).',{hint:'<strong>Cylinder volume:</strong> \\(V=\\pi r^2h\\)',hintButtonLabel:'Show Formula'});p.isDifferentialWord=true;p.differentialDirection='reverse';p.differentialWording=natural?'old-new':'explicit-differential';return p;
}
function reverseDifferentialRectangle(){
  const l=ri(4,10),w=ri(3,9),dl=pick([1,2]),change=Q(w*dl,10),answer=Q(dl,10),natural=R()<.85;
  const prompt=natural
    ?"A rectangle has fixed width \\("+w+"\\) and length \\("+l+"\\). Its area increases by approximately \\("+qTex(change)+"\\). Estimate how much the length increases."
    :"A rectangle has \\(l="+l+"\\), \\(w="+w+"\\), and \\(dw=0\\). If \\(dA="+qTex(change)+"\\), estimate \\(dl\\).";
  const p=exactExpression('u3-diff-reverse-rectangle-'+l+'-'+w+'-'+dl,'differentials_reverse_rectangle_length',prompt,'',qPlain(answer),qTex(answer),'<strong>Step 1:</strong> Use \\(A=lw\\). Since the width is fixed, \\(dA=w\\,dl\\). <strong>Step 2:</strong> Solve: \\(dl=\\frac{dA}{w}\\). <strong>Step 3:</strong> Substitute to obtain \\(dl='+qTex(answer)+'\\).',{hint:'<strong>Rectangle area:</strong> \\(A=lw\\)',hintButtonLabel:'Show Formula'});p.isDifferentialWord=true;p.differentialDirection='reverse';p.differentialWording=natural?'old-new':'explicit-differential';return p;
}
const differentialForwardFamilies=[diffCircle,diffRectangle,diffTriangle,diffEquilateral,diffSphere,diffCylinder,diffCone,diffPrism,diffTrapezoid,diffCircleCircumference,diffSphereSurfaceArea,diffCylinderSurfaceArea,diffIncludedAngleTriangle,diffRightTriangleHypotenuse];
const differentialReverseFamilies=[reverseDifferentialCircle,reverseDifferentialSphere,reverseDifferentialCylinder,reverseDifferentialRectangle];
function linearizationWorkedExplanation(problem){
  const steps=workedSegments(problem.explanation);
  if(steps.length<3){
    const isLinearization=/^linearization_/.test(String(problem.variant||''));
    steps.push(isLinearization?`Therefore the linearization gives the approximation \\(${problem.answerTex}\\).`:`Therefore the estimated change for this problem is \\(${problem.answerTex}\\).`);
  }
  problem.explanation=numberedWorkedSolution(steps);
  problem.linearizationSpecificWork=true;
  return problem;
}
U3['linearization-and-differentials']=(opts={})=>{
  const source=R()<.15?'test':'assignment',roll=R();let p;
  if(roll<.125)p=pick([linSqrt,linCubeRoot])();
  else if(roll<.34375)p=pick(differentialReverseFamilies)();
  else p=differentialForwardWording(pick(differentialForwardFamilies)());
  return stamp(linearizationWorkedExplanation(p),'linearization-and-differentials','noncalculator',source,p.variant);
};

function boringNewtonValue(value,places){
  const tolerance=.5*10**(-places),display=Math.abs(value).toFixed(places),digits=display.split('.')[1]||'';
  if(Math.abs(value-Math.round(value))<=tolerance)return true;
  for(let denominator=2;denominator<=60;denominator++)if(Math.abs(value-Math.round(value*denominator)/denominator)<=tolerance)return true;
  if(/^([0-9])\1{5,}$/.test(digits))return true;
  if(digits.length>=8&&digits===digits.slice(0,2).repeat(Math.ceil(digits.length/2)).slice(0,digits.length))return true;
  return false;
}
function strictRootProblem(id,variant,prompt,math,value,explanation){
  const places=Math.abs(value)<1?10:9,p=numeric(id,variant,prompt,math,value,Number(value).toFixed(places),explanation,.5*10**(-places)+1e-12);p.requiredDecimals=places;p.newtonBoring=boringNewtonValue(value,places);return p;
}
function fixedNewtonValue(value,places){
  const shown=Number(value).toFixed(places);
  return /^-0\.0+$/.test(shown)?shown.slice(1):shown;
}
function newtonIterates(fn,df,x0,places,maxCount=20){
  const values=[x0];let x=x0,previous=fixedNewtonValue(x0,places);
  for(let i=0;i<maxCount;i++){
    const slope=df(x);if(!Number.isFinite(slope)||Math.abs(slope)<1e-12)break;
    x=x-fn(x)/slope;values.push(x);
    const shown=fixedNewtonValue(x,places);
    if(shown===previous)break;
    previous=shown;
  }
  return values;
}
function newtonSpecificExplanation(functionTex,derivativeTex,iterationTex,fn,df,x0,value,places){
  const iterates=newtonIterates(fn,df,x0,places),shown=iterates.map((x,index)=>`x_${index}\\approx${fixedNewtonValue(x,places)}`).join(',\\quad ');
  return numberedWorkedSolution([
    'Newton’s Method always uses \\(x_{k+1}=x_k-\\frac{f(x_k)}{f′(x_k)}\\).',
    `For this problem, \\(f(x)=${functionTex}\\) and \\(f′(x)=${derivativeTex}\\).`,
    `Substitute this function and derivative into the formula: \\(${iterationTex}\\).`,
    `Starting with \\(x_0=${x0}\\) gives \\(${shown}\\).`,
    `Therefore the requested approximation is \\(${Number(value).toFixed(places)}\\).`
  ]);
}
function newtonNthRoot(){
  const n=pick([2,3,4,5]),target=pick([2,3,5,6,7,10,11,13,17,19]),value=target**(1/n),symbol=n===2?`\\sqrt{${target}}`:`\\sqrt[${n}]{${target}}`,fn=x=>x**n-target,df=x=>n*x**(n-1),derivativeTex=n===2?'2x':`${n}x^{${n-1}}`,iterationDenominator=n===2?'2x_k':`${n}x_k^{${n-1}}`,places=Math.abs(value)<1?10:9,x0=Math.max(1,Math.round(value));
  return strictRootProblem(`u3-newton-nth-${n}-${target}`,'newton_nth_root',`Use Newton's method to approximate \\(${symbol}\\).`,`f(x)=x^{${n}}-${target}`,value,newtonSpecificExplanation(`x^{${n}}-${target}`,derivativeTex,`x_{k+1}=x_k-\\frac{x_k^{${n}}-${target}}{${iterationDenominator}}`,fn,df,x0,value,places));
}
function newtonCubicRoot(){
  const c=pick([3,4,5,6,7,8,9]),fn=x=>x*x*x+x-c,df=x=>3*x*x+1,value=bisect(fn,0,2),places=value<1?10:9;
  return strictRootProblem(`u3-newton-cubic-${c}`,'newton_function_cubic',`Use Newton's method to approximate the root on \\((0,2)\\).`,`f(x)=x^3+x-${c}`,value,newtonSpecificExplanation(`x^3+x-${c}`,'3x^2+1',`x_{k+1}=x_k-\\frac{x_k^3+x_k-${c}}{3x_k^2+1}`,fn,df,1,value,places));
}
function newtonTrigRoot(){
  const c=pick([.5,.75,1,1.25]),fn=x=>Math.cos(x)-c*x,df=x=>-Math.sin(x)-c,value=bisect(fn,0,1.5),places=value<1?10:9;
  return strictRootProblem(`u3-newton-trig-${c}`,'newton_function_trigonometric',`Use Newton's method to approximate the root on \\((0,1.5)\\).`,`f(x)=\\cos x-${c}x`,value,newtonSpecificExplanation(`\\cos x-${c}x`,`-\\sin x-${c}`,`x_{k+1}=x_k-\\frac{\\cos x_k-${c}x_k}{-\\sin x_k-${c}}`,fn,df,.75,value,places));
}
function newtonExponentialRoot(){
  const k=pick([2,3,5,7]),fn=x=>Math.exp(-x)-x/k,df=x=>-Math.exp(-x)-1/k,value=bisect(fn,0,2),places=value<1?10:9;
  return strictRootProblem(`u3-newton-exp-${k}`,'newton_function_exponential',`Use Newton's method to approximate the root on \\((0,2)\\).`,`f(x)=e^{-x}-\\frac{x}{${k}}`,value,newtonSpecificExplanation(`e^{-x}-\\frac{x}{${k}}`,`-e^{-x}-\\frac{1}{${k}}`,`x_{k+1}=x_k-\\frac{e^{-x_k}-\\frac{x_k}{${k}}}{-e^{-x_k}-\\frac{1}{${k}}}`,fn,df,1,value,places));
}
function newtonLogRoot(){
  const a=ri(2,5),b=pick([.4,.7,1.1]),fn=x=>Math.log(x+a)-b,df=x=>1/(x+a),value=Math.exp(b)-a,left=Math.max(-a+.01,value-1),right=value+1,places=Math.abs(value)<1?10:9,x0=Number(((left+right)/2).toFixed(2));
  return strictRootProblem(`u3-newton-log-${a}-${b}`,'newton_function_logarithmic',`Use Newton's method to approximate the root on \\((${fmt(left,2)},${fmt(right,2)})\\).`,`f(x)=\\ln(x+${a})-${b}`,value,newtonSpecificExplanation(`\\ln(x+${a})-${b}`,`\\frac{1}{x+${a}}`,`x_{k+1}=x_k-\\frac{\\ln(x_k+${a})-${b}}{\\frac{1}{x_k+${a}}}=x_k-(x_k+${a})[\\ln(x_k+${a})-${b}]`,fn,df,x0,value,places));
}
const newtonRootFamilies=[newtonNthRoot,newtonCubicRoot,newtonTrigRoot,newtonExponentialRoot,newtonLogRoot];
function ensureNewtonFormula(problem){
  problem.newtonFormulaShown=true;
  problem.newtonSpecificFormulaShown=true;
  return problem;
}
U3['newton-s-method-for-approximating-roots-of-a-function']=(opts={})=>{const source=R()<.15?'test':'assignment',p=ensureNewtonFormula(retryFamily(newtonRootFamilies,candidate=>!candidate.newtonBoring,120));return stamp(p,'newton-s-method-for-approximating-roots-of-a-function','calculator',source,p.variant);};

/* Graphing topics remain lesson/resource pages, but have no practice engines. */
delete U3['graphing-the-derivative'];
delete U3['graphing-functions'];

const api={
  get(slug){return U3[slug]||base?.get?.(slug);},
  slugs(){return Array.from(new Set([...(base?.slugs?.()||[]),...Object.keys(U3)]));},
  unit3Slugs:()=>Object.keys(U3)
};
window.BatchMathUnit3ApplicationsGenerators={get:slug=>U3[slug],slugs:()=>Object.keys(U3)};
window.BatchMathAPTopicGenerators=api;
})();
