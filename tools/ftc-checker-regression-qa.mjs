#!/usr/bin/env node
// v12.8.V regression: products typed as the keypad serializes them, such as 2xsec(x^6) (2, x, then the
// sec key), were rejected as invalid because the shared parser read "xsec" as one unknown name.
// Checks the shared parser, the FTC checker, every generated FTC answer typed in keypad form, and that
// wrong derivatives (missing chain factor, wrong function, wrong exponent) are still rejected.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SEEDS=Number(process.env.BM_QA_FTC_SEEDS||3000);
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const ctx={window:{},console,document:{addEventListener(){}}};vm.createContext(ctx);ctx.window.BatchMathRNG={random:rng(1)};
for(const f of ['assets/derivative-expression-checker.js','assets/unit4-exact-answers.js','assets/ap-topic-generators.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f});
const D=ctx.window.BatchMathDerivativeExpressions,A=ctx.window.BatchMathUnit4Answers,G=ctx.window.BatchMathAPTopicGenerators;
const errors=[];let checks=0;
const expect=(cond,msg)=>{checks++;if(!cond&&errors.length<60)errors.push(msg);};

// 1. The shared parser, as the derivative engines use it.
const x=[0.31,0.47,0.63,0.82,1.07].map(v=>({x:v}));
for(const [typed,expected] of [
 ['2xsec(x^6)','2*x*sec(x^6)'],['xsin(x)','x*sin(x)'],['2xsin(x)+x^2cos(x)','2*x*sin(x)+x^2*cos(x)'],['xe^(x)','x*e^x'],
 ['e^xcos(x)','e^x*cos(x)'],['xln(x)','x*ln(x)'],['3x^2csc(x^3)','3*x^2*csc(x^3)'],['sinxcosx','sin(x)*cos(x)'],['sin2x','sin(2*x)'],
 ['xsqrt(x)','x*sqrt(x)'],['pix','pi*x'],['ex','e*x'],['exp(x)','e^x'],['2x*sec(x^6)','2*x*sec(x^6)']])
 expect(D.equivalent(typed,expected,x),`shared parser: ${typed} should equal ${expected}`);
for(const bad of ['xz','zsin(x)','sinz','xsec'])expect((()=>{try{D.parse(bad);return bad==='xsec'?false:false;}catch(_){return true;}})(),`shared parser: ${bad} should be invalid`);
for(const [typed,expected] of [['xsec(x^6)','2*x*sec(x^6)'],['2xcos(x^6)','2*x*sec(x^6)'],['2xsec(x^5)','2*x*sec(x^6)'],['sin(xcos(x))','sin(x)*cos(x)']])
 expect(!D.equivalent(typed,expected,x),`shared parser: ${typed} must not equal ${expected}`);

// 2. The FTC checker with the reported answer and related forms.
const ans=(e,probes=[-0.22,-0.1,0,0.12,0.24])=>({kind:'function-expression',expression:e,probes});
const pos=[0.3,0.5,0.7,0.9,1.1];
for(const [expected,typed,accept,probes] of [
 ['2*x*sec(x^6)','2xsec(x^6)',true],['2*x*sec(x^6)','2xsec(x^(6))',true],['2*x*sec(x^6)','2x*sec(x^6)',true],['2*x*sec(x^6)','2*x*sec(x^6)',true],['2*x*sec(x^6)','sec(x^6)2x',true],['2*x*sec(x^6)','2x sec(x^6)',true],
 ['2*x*sec(x^6)','sec(x^6)',false],['2*x*sec(x^6)','2xsec(x^5)',false],['2*x*sec(x^6)','2xcos(x^6)',false],['2*x*sec(x^6)','xsec(x^6)',false],['2*x*sec(x^6)','2xsec(x^6)+1',false],
 ['2*x*sin(x^2)','2xsin(x^(2))',true],['2*x*cos(x^2)','2xcos(x^(2))',true],['2*x*tan(x^2)','2xtan(x^(2))',true],['3*x^2*csc(x^3)','3x^(2)csc(x^(3))',true,pos],['3*x^2*cot(x^3)','3x^(2)cot(x^(3))',true,pos],
 ['(-6)*x*cos(3*(x)^2)*(sin(3*(x)^2))^2','-6xcos(3x^(2))(sin(3x^(2)))^(2)',true],['(-6)*x*cos(3*(x)^2)*(sin(3*(x)^2))^2','-6xcos(3x^(2))sin^(2)(3x^(2))',true],['(-6)*x*cos(3*(x)^2)*(sin(3*(x)^2))^2','-6xcos(3x^(2))sin(3x^(2))',false],
 ['(-1)*exp(x)*cos((x)^3)','-e^xcos(x^3)',true],['x*exp(x)','xe^(x)',true],['sin(x)*cos(x)','sinxcosx',true],['sin(x)*cos(x)','sin(x)cos(x)',true],['x^3*cos(x)','x^(3)cos(x)',true],['x^3*cos(x)','x^(3)sin(x)',false]]){
 const r=A.check(typed,ans(expected,probes));expect(Boolean(r.valid&&r.ok)===accept,`FTC checker: ${typed} for ${expected} should be ${accept?'accepted':'rejected'} (${JSON.stringify(r)})`);
}

// 3. Every generated FTC answer, typed in keypad form, is accepted; wrong derivatives are not.
function keypadForm(tex){
 let s=String(tex).replace(/\\left|\\right|\\,|\\displaystyle/g,'').replace(/\\cdot/g,'*').replace(/\\pi/g,'pi');
 const brace=(str,i)=>{let d=0;for(let j=i;j<str.length;j++){if(str[j]==='{')d++;else if(str[j]==='}'&&--d===0)return j;}throw Error('brace');};
 for(let g=0;g<300;g++){
  let i=s.indexOf('\\frac');if(i>=0){const a=s.indexOf('{',i),ae=brace(s,a),be=brace(s,ae+1);s=s.slice(0,i)+`(${s.slice(a+1,ae)})/(${s.slice(ae+2,be)})`+s.slice(be+1);continue;}
  i=s.indexOf('\\sqrt{');if(i>=0){const a=i+5,ae=brace(s,a);s=s.slice(0,i)+`sqrt(${s.slice(a+1,ae)})`+s.slice(ae+1);continue;}
  i=s.indexOf('^{');if(i>=0){const ae=brace(s,i+1);s=s.slice(0,i)+`^(${s.slice(i+2,ae)})`+s.slice(ae+1);continue;}
  break;}
 return s.replace(/\\(sin|cos|tan|sec|csc|cot|ln)/g,'$1').replace(/\s+/g,'');
}
const gen=G.get('fundamental-theorem-of-calculus-and-integral-rules');let typedForms=0,adjacent=0;
for(let i=1;i<=SEEDS;i++){
 for(const mode of i%5?['ftc']:['ftc','rules']){
  ctx.window.BatchMathRNG={random:rng(i*104729+mode.length)};const p=gen({ftcMode:mode});
  for(const st of [p.stage1,p.stage2].filter(Boolean)){
   const a=st.unit4Answer;if(a?.kind!=='function-expression')continue;
   const typed=keypadForm(st.answerTex);typedForms++;if(/[0-9a-z)]\s*(?:sin|cos|tan|sec|csc|cot|ln|sqrt)\(|x(?:e|x)/.test(typed))adjacent++;
   const r=A.check(typed,a);expect(r.valid&&r.ok,`${p.id}: keypad form not accepted: ${typed} -> ${JSON.stringify(r)}`);
   for(const wrong of [`2(${typed})`,`(${typed})+x`])expect(!(A.check(wrong,a).ok),`${p.id}: wrong derivative accepted: ${wrong}`);
  }
 }
}

const lines=['BatchMath v12.8.V FTC / shared-parser checker regression',`Result: ${errors.length?'FAIL':'PASS'}`,`Checks: ${checks}`,`Generated FTC and Integral Rules answers typed in keypad form: ${typedForms} (${adjacent} with a factor directly before a function)`,`Errors: ${errors.length}`,...errors.map(e=>'- '+e)];
fs.mkdirSync(path.join(ROOT,'qa-results'),{recursive:true});fs.writeFileSync(path.join(ROOT,'qa-results','ftc-checker-regression-qa.txt'),lines.join('\n')+'\n');
console.log(lines.join('\n'));if(errors.length)process.exit(1);
