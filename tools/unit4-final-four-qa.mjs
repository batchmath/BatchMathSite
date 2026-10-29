#!/usr/bin/env node
// v12.8.U — independent QA for the final four Unit 4 integrals engines.
// The generators' own expression strings are NOT trusted: questions and answers
// are re-read from the displayed TeX by a separate parser below, then checked by
// numerical differentiation, adaptive quadrature and root scanning.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,'..'),OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const N=Number(process.env.BM_QA_U4_SAMPLES||12000);
const ONLY=(process.env.BM_QA_U4_ENGINES||'basic,usub,log,mvt').split(',');
const SLUGS={basic:'basic-integrals',usub:'u-substitution-integrals',log:'integrals-resulting-in-natural-log-and-inverse-trigonometric-functions',mvt:'mean-value-theorem-for-integrals'};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const ctx={window:{},console,document:{addEventListener(){}}};vm.createContext(ctx);ctx.window.BatchMathRNG={random:rng(1)};
for(const f of ['assets/derivative-expression-checker.js','assets/unit4-exact-answers.js','assets/ap-topic-generators.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f});
const G=ctx.window.BatchMathAPTopicGenerators,A=ctx.window.BatchMathUnit4Answers,META=ctx.window.BatchMathUnit4FinalFour;
const keypadSource=fs.readFileSync(path.join(ROOT,'assets/calculus-keypad.js'),'utf8');

// ---------------- independent TeX reader ----------------
const FNS=['arcsin','arccos','arctan','sin','cos','tan','sec','csc','cot','ln','exp'];
function texTokens(tex){
 const s=String(tex).replace(/\\,/g,'§').replace(/\\displaystyle|\\left|\\right|\\!|\;|\\quad|\\qquad/g,' ').replace(/\\cdot/g,'*').replace(/\\theta/g,'θ').replace(/\\pi/g,'π').replace(/\\infty/g,'∞');
 const out=[];let i=0;
 while(i<s.length){
  const ch=s[i];
  if(/\s/.test(ch)){i++;continue;}
  // a thin space ends a bare function argument: \cos x\,e^{u} is cos(x)·e^u
  if(ch==='§'){if(out.length)out.at(-1).sepAfter=true;i++;continue;}
  if(ch==='\\'){const m=s.slice(i+1).match(/^[A-Za-z]+/);if(!m)throw Error('tex command at '+i+' in '+tex);out.push({t:'cmd',v:m[0]});i+=1+m[0].length;continue;}
  if(/[0-9.]/.test(ch)){let j=i;while(j<s.length&&/[0-9.]/.test(s[j]))j++;out.push({t:'num',v:Number(s.slice(i,j))});i=j;continue;}
  if(/[A-Za-zθπ]/.test(ch)){out.push({t:'id',v:ch});i++;continue;}
  out.push({t:ch});i++;
 }
 return out;
}
// AST: {k:'n',v} {k:'v',v} {k:'+',a,b} {k:'*',a,b} {k:'/',a,b} {k:'^',a,b} {k:'neg',a} {k:'f',f,a} {k:'root',n,a} {k:'abs',a}
function parseTex(tex,variable='x'){
 const T=texTokens(tex);let i=0;const peek=()=>T[i],take=()=>T[i++];
 const expect=t=>{const x=take();if(!x||x.t!==t)throw Error(`expected ${t} in ${tex}`);return x;};
 function group(){if(peek()?.t==='{'){take();const e=sum();expect('}');return e;}return atom();}
 function sum(stop){let a=product();while(peek()&&(peek().t==='+'||peek().t==='-')){const op=take().t;const b=product();a=op==='+'?{k:'+',a,b}:{k:'+',a,b:{k:'neg',a:b}};}return a;}
 function product(){let a=unary();while(true){const p=peek();if(!p)break;if(p.t==='*'){take();a={k:'*',a,b:unary()};continue;}if(p.t==='/'){take();a={k:'/',a,b:unary()};continue;}if(['num','id','cmd','('].includes(p.t)||p.t==='|'&&absOpenable()){a={k:'*',a,b:power()};continue;}break;}return a;}
 let absDepth=0;function absOpenable(){return absDepth===0;}
 function unary(){if(peek()?.t==='-'){take();return {k:'neg',a:unary()};}if(peek()?.t==='+'){take();return unary();}return power();}
 function power(){let a=atom();while(peek()?.t==='^'){take();const b=peek()?.t==='{'?group():atom();a={k:'^',a,b};}return a;}
 function fnArg(){
  // (…) or {…} or a bare factor like x, 2x, θ, a number
  const p=peek();
  if(p?.t==='('){take();const e=sum();expect(')');return e;}
  if(p?.t==='{')return group();
  if(p?.t==='|'){return atom();}
  let e=null;
  while(peek()&&(peek().t==='num'||peek().t==='id')){const last=peek();const x=atom();e=e?{k:'*',a:e,b:x}:x;if(peek()?.t==='^'){take();e={k:'^',a:e,b:peek()?.t==='{'?group():atom()};}if(last.sepAfter||T[i-1]?.sepAfter)break;}
  if(e)return e;
  if(peek()?.t==='cmd')return atom();
  throw Error('function argument in '+tex);
 }
 function atom(){
  const p=take();if(!p)throw Error('end of '+tex);
  if(p.t==='num')return {k:'n',v:p.v};
  if(p.t==='id'){if(p.v==='π')return {k:'n',v:Math.PI};if(p.v==='e')return {k:'n',v:Math.E};if(p.v===variable||p.v==='θ'&&variable==='theta')return {k:'v'};if(p.v==='C')return {k:'C'};throw Error(`unexpected letter ${p.v} in ${tex}`);}
  if(p.t==='('){const e=sum();expect(')');return e;}
  if(p.t==='{'){const e=sum();expect('}');return e;}
  if(p.t==='|'){absDepth++;const e=sum();absDepth--;expect('|');return {k:'abs',a:e};}
  if(p.t==='cmd'){
   if(p.v==='frac'||p.v==='dfrac'||p.v==='tfrac'){const a=group(),b=group();return {k:'/',a,b};}
   if(p.v==='sqrt'){let n=2;if(peek()?.t==='['){take();n=take().v;expect(']');}return {k:'root',n,a:group()};}
   if(FNS.includes(p.v)){
    let f=p.v,pw=null;
    if(peek()?.t==='^'){take();const e=group();const val=evalAst(e,0);if(val===-1)f={sin:'asin',cos:'acos',tan:'atan'}[f];else pw=e;}
    if(f==='arcsin')f='asin';if(f==='arccos')f='acos';if(f==='arctan')f='atan';
    const arg=fnArg();const node={k:'f',f,a:arg};return pw?{k:'^',a:node,b:pw}:node;
   }
   throw Error('unknown command \\'+p.v+' in '+tex);
  }
  throw Error(`unexpected ${p.t} in ${tex}`);
 }
 const e=sum();if(i!==T.length)throw Error('trailing tokens in '+tex);return e;
}
function realPow(a,b){if(a>=0||Number.isInteger(b))return Math.pow(a,b);for(let q=1;q<=64;q++){const p=Math.round(b*q);if(Math.abs(b*q-p)<1e-9){if(q%2===0)return NaN;const m=Math.pow(-a,b);return p%2===0?m:-m;}}return NaN;}
function evalAst(n,x,C=0){
 switch(n.k){
  case 'n':return n.v;case 'v':return x;case 'C':return C;
  case '+':return evalAst(n.a,x,C)+evalAst(n.b,x,C);case 'neg':return -evalAst(n.a,x,C);
  case '*':return evalAst(n.a,x,C)*evalAst(n.b,x,C);case '/':return evalAst(n.a,x,C)/evalAst(n.b,x,C);
  case '^':return realPow(evalAst(n.a,x,C),evalAst(n.b,x,C));
  case 'root':{const v=evalAst(n.a,x,C);return n.n%2===0?(v>=0?Math.pow(v,1/n.n):NaN):Math.sign(v)*Math.pow(Math.abs(v),1/n.n);}
  case 'abs':return Math.abs(evalAst(n.a,x,C));
  case 'f':{const v=evalAst(n.a,x,C);switch(n.f){case 'sin':return Math.sin(v);case 'cos':return Math.cos(v);case 'tan':return Math.tan(v);case 'sec':return 1/Math.cos(v);case 'csc':return 1/Math.sin(v);case 'cot':return Math.cos(v)/Math.sin(v);case 'ln':return v>0?Math.log(v):NaN;case 'exp':return Math.exp(v);case 'asin':return Math.asin(v);case 'acos':return Math.acos(v);case 'atan':return Math.atan(v);}}
 }
 throw Error('ast '+n.k);
}
const hasC=n=>!!n&&(n.k==='C'||['a','b'].some(k=>hasC(n[k])));
// ---- pull the integral apart from the displayed question
function questionMath(html){const m=String(html).match(/<div class="u4-formula">\\\(\\displaystyle ([\s\S]*)\\\)<\/div>/);if(!m)throw Error('no formula');return m[1];}
function splitIntegral(tex){
 const brace=(str,i)=>{let d=0;for(let j=i;j<str.length;j++){if(str[j]==='{')d++;else if(str[j]==='}'&&--d===0)return j;}throw Error('brace in '+tex);};
 if(!tex.startsWith('\\int'))throw Error('not an integral: '+tex);
 let rest=tex.slice(4),lo,hi;
 if(rest.startsWith('_{')){const e=brace(rest,1);lo=rest.slice(2,e);rest=rest.slice(e+1);if(!rest.startsWith('^{'))throw Error('upper bound in '+tex);const f=brace(rest,1);hi=rest.slice(2,f);rest=rest.slice(f+1);}
 const m=rest.match(/^([\s\S]*)\\,d(x|t|\\theta|r)$/);if(!m)throw Error('differential in '+tex);
 return {lo,hi,integrand:m[1].trim(),variable:m[2]==='\\theta'?'theta':m[2]};
}
// ---- numerics
const deriv=(f,x)=>{const h=1e-4*Math.max(1,Math.abs(x));return (-f(x+2*h)+8*f(x+h)-8*f(x-h)+f(x-2*h))/(12*h);};
function simpson(f,a,b,eps,whole,fa,fm,fb,depth){const m=(a+b)/2,lm=(a+m)/2,rm=(m+b)/2,flm=f(lm),frm=f(rm),left=(m-a)/6*(fa+4*flm+fm),right=(b-m)/6*(fm+4*frm+fb);if(depth<=0||Math.abs(left+right-whole)<=15*eps)return left+right+(left+right-whole)/15;return simpson(f,a,m,eps/2,left,fa,flm,fm,depth-1)+simpson(f,m,b,eps/2,right,fm,frm,fb,depth-1);}
function integrate(f,a,b){const fa=f(a),fb=f(b),fm=f((a+b)/2);return simpson(f,a,b,1e-12,(b-a)/6*(fa+4*fm+fb),fa,fm,fb,40);}
function finiteOn(f,a,b,n=2000){for(let i=0;i<=n;i++){const x=a+(b-a)*i/n,v=f(x);if(!Number.isFinite(v)||Math.abs(v)>1e9)return false;}return true;}

// ---- keypad profiles, read from the shipped keypad source
function profiles(){const out={};const re=/"(unit4-(?:basic|usub|log|mvt)[^"]*)":(\{[^\n]*?\}),?\n/g;let m;while((m=re.exec(keypadSource)))out[m[1]]=Function(`return (${m[2]})`)();
 const gen=keypadSource.match(/\.\.\.Object\.fromEntries\((\[\[[^\n]*?\]\])\.map\(\(\[id,v\]\)=>\[`unit4-usub-\$\{id\}`,(\{[^\n]*?\})\]\)\),/);
 if(gen){for(const [id,v] of Function(`return ${gen[1]}`)())out[`unit4-usub-${id}`]=Function('v',`return (${gen[2]})`)(v);}
 return out;}
const PROFILES=profiles();
function neededKeys(tex){
 const need=new Set();let s=String(tex);
 if(/\\text\{Does not apply\}/.test(s)){need.add('dna');s=s.replace(/\\text\{Does not apply\}/g,'');}
 if(/,\\ /.test(s))need.add('comma');
 if(/\\frac/.test(s))need.add('fraction');if(/\\sqrt/.test(s))need.add('radical');if(/\^/.test(s.replace(/\\(?:sin|cos|tan)\^\{-1\}/g,'')))need.add('exponent');// sin⁻¹ keys enter the whole function
 if(/\\ln/.test(s))need.add('logarithm');if(/\\pi/.test(s))need.add('pi');if(/(^|[^a-z\\])e(?![a-z])|e\^/.test(s.replace(/\\[a-z]+/gi,' ')))need.add('e');
 if(/\|/.test(s))need.add('abs');if(/\+C$/.test(s))need.add('C');
 for(const f of ['sin','cos','tan','sec','csc','cot'])if(new RegExp(`\\\\${f}(?!\\^\\{-1\\})`).test(s))need.add(f);
 if(/\\sin\^\{-1\}/.test(s))need.add('asin');if(/\\cos\^\{-1\}/.test(s))need.add('acos');if(/\\tan\^\{-1\}/.test(s))need.add('atan');
 const vars=s.replace(/\\[A-Za-z]+/g,' ').match(/[xtr]/g)||[];for(const v of vars)need.add('var:'+v);if(/\\theta/.test(s))need.add('var:θ');
 return need;
}
function profileKeys(p){const k=new Set(['digits']);if(p.fraction)k.add('fraction');if(p.radical)k.add('radical');if(p.exponent)k.add('exponent');if(p.logarithm)k.add('logarithm');for(const c of p.constants||[])k.add(c==='pi'?'pi':c);for(const [,name] of p.functions||[])k.add(name);for(const v of p.variables||[])k.add(v==='C'?'C':'var:'+v);if(p.list)k.add('comma');if(p.dna)k.add('dna');return k;}

// ---- TeX answer → what a student types with the keypad (independent of the generator's expression)
function keypadForm(tex){
 let s=String(tex).replace(/\\left|\\right|\\,|\\displaystyle/g,'').replace(/\\cdot/g,'*').replace(/\\theta/g,'θ').replace(/\\pi/g,'pi');
 const brace=(str,i)=>{let d=0;for(let j=i;j<str.length;j++){if(str[j]==='{')d++;else if(str[j]==='}'&&--d===0)return j;}throw Error('brace');};
 for(let guard=0;guard<200;guard++){
  let i=s.indexOf('\\frac');if(i>=0){const a=s.indexOf('{',i),ae=brace(s,a),be=brace(s,ae+1);s=s.slice(0,i)+`(${s.slice(a+1,ae)})/(${s.slice(ae+2,be)})`+s.slice(be+1);continue;}
  i=s.indexOf('\\sqrt[');if(i>=0){const c=s.indexOf(']',i),n=s.slice(i+6,c),a=c+1,ae=brace(s,a);s=s.slice(0,i)+`(${s.slice(a+1,ae)})^((1)/(${n}))`+s.slice(ae+1);continue;}
  i=s.indexOf('\\sqrt{');if(i>=0){const a=i+5,ae=brace(s,a);s=s.slice(0,i)+`sqrt(${s.slice(a+1,ae)})`+s.slice(ae+1);continue;}
  i=s.indexOf('^{');if(i>=0){const ae=brace(s,i+1);s=s.slice(0,i)+`^(${s.slice(i+2,ae)})`+s.slice(ae+1);continue;}
  break;
 }
 s=s.replace(/\\(sin|cos|tan)\^\(-1\)/g,'a$1').replace(/\\(sin|cos|tan|sec|csc|cot|ln)/g,'$1').replace(/\|([^|]*)\|/g,'abs($1)');
 return s.replace(/\s+/g,'');
}

// ---------------- checks ----------------
const report={generatedAt:new Date().toISOString(),samplesPerEngine:N,engines:{}};const errors=[],warnings=[];let verified=0;
const fail=(engine,p,msg)=>{if(errors.length<400)errors.push(`${engine} ${p?.variant||''} ${p?.id||''}: ${msg}`);};
const close=(a,b,rel=1e-7)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=rel*Math.max(1,Math.abs(a),Math.abs(b));
function lint(engine,p,html){
 const s=String(html);
 const opens=(s.match(/\\\(/g)||[]).length,closes=(s.match(/\\\)/g)||[]).length;if(opens!==closes)fail(engine,p,'unbalanced math delimiters');
 const outside=s.replace(/\\\([\s\S]*?\\\)/g,'').replace(/<[^>]+>/g,'');if(/\\(?:frac|sqrt|sin|cos|ln|int|pi|left|right)\b|\^\{/.test(outside))fail(engine,p,'raw TeX outside math: '+outside.slice(0,120));
 const eqs=[...s.matchAll(/<div class="u4-work-equation[^"]*">([\s\S]*?)<\/div>/g)].map(m=>m[1]);for(let i=1;i<eqs.length;i++)if(eqs[i]===eqs[i-1])fail(engine,p,'repeated equation line');
 // v12.8.V: conventional, simplified notation in every question, answer and explanation
 const g=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};
 // limits of integration and evaluation (_{a}^{b}) are values, not powers: drop them before the notation rules
 const stripLimits=t=>{let out='',i=0;const close=(j)=>{let d=0;for(let k=j;k<t.length;k++){if(t[k]==='{')d++;else if(t[k]==='}'&&--d===0)return k;}return -1;};
  while(i<t.length){if(t.startsWith('_{',i)){const e=close(i+1);if(e>0&&t.startsWith('^{',e+1)){const f=close(e+2);if(f>0){out+=' ';i=f+1;continue;}}}out+=t[i++];}return out;};
 for(const m of s.matchAll(/\\\(([\s\S]*?)\\\)/g)){const t=stripLimits(m[1]);
  const rules=[[/\\frac\{[^{}]*\}\{1\}/,'denominator of 1'],[/\^\{1\}/,'power of 1'],[/(?:^|[^\d.}{_^])1(?=[a-zA-Z(]|\\(?:sin|cos|tan|sec|csc|cot|ln|sqrt|pi|left|theta|int)\b)/,'coefficient of 1'],[/\\cdot\s*1(?![\d.])|(?:^|[^\d.{])1\s*\\cdot/,'multiplication by 1'],[/\+\s*0(?![\d.])/,'+0'],[/(?:\+|-)\s*(?:\+|-)/,'doubled sign']];
  for(const [re,label] of rules)if(re.test(t)){fail(engine,p,`notation (${label}): ${t.slice(0,140)}`);break;}
  for(const f of t.matchAll(/\\frac\{(\d+)([a-zA-Z]?)\}\{(\d+)\}/g)){if(g(+f[1],+f[3])>1){fail(engine,p,`unreduced fraction ${f[0]} in ${t.slice(0,120)}`);break;}}
 }
 for(const e of eqs){const parts=e.replace(/^\\\(\\displaystyle |\\\)$/g,'').split('=');for(let i=1;i<parts.length;i++)if(parts[i].trim()===parts[i-1].trim()&&parts[i].trim())fail(engine,p,'repeated side in '+e.slice(0,120));}
}
function checkIndefinite(engine,p,stage){
 const q=splitIntegral(questionMath(p.questionHtml)),v=q.variable;
 const f=parseTex(q.integrand,v),ansTex=stage.answerTex;if(!/\+C$/.test(ansTex))fail(engine,p,'indefinite answer lacks +C');
 const F=parseTex(ansTex.replace(/\+C$/,''),v),comps=stage.unit4Answer.components;
 let pts=0;
 for(const [a,b] of comps){for(let k=0;k<17;k++){const x=a+(b-a)*(k+0.37)/17;const fx=evalAst(f,x);if(!Number.isFinite(fx))continue;const dF=deriv(t=>evalAst(F,t),x);if(!Number.isFinite(dF)){fail(engine,p,`answer undefined at ${x.toFixed(3)} where integrand is defined`);return;}if(Math.abs(dF-fx)>2e-5*Math.max(1,Math.abs(fx))){fail(engine,p,`d/d${v} of displayed answer ${dF} != integrand ${fx} at ${x.toFixed(4)}`);return;}pts++;}}
 if(pts<10)fail(engine,p,'too few verification points '+pts);
 // displayed answer equals the checker's expected answer (up to a constant)
 const expected=stage.unit4Answer.expression;
 const keyed=keypadForm(ansTex);const r=A.check(keyed,stage.unit4Answer);if(!r.valid||!r.ok)fail(engine,p,`keypad form rejected: ${keyed} -> ${JSON.stringify(r)}`);
 const noC=keypadForm(ansTex.replace(/\+C$/,''));const r2=A.check(noC,stage.unit4Answer);if(!r2.valid||r2.ok||!/forgot \+ C/.test(r2.note||''))fail(engine,p,`missing +C not flagged: ${JSON.stringify(r2)}`);
 const wrongs=[keyed.replace(/\+C$/,`+${v==='theta'?'θ':v}+C`),`2(${keyed.replace(/\+C$/,'')})+C`,`-(${keyed.replace(/\+C$/,'')})+C`];
 for(const w of wrongs){const rw=A.check(w,stage.unit4Answer);if(rw.valid&&rw.ok)fail(engine,p,'wrong answer accepted: '+w);}
 const dec=keyed.replace(/\+C$/,'')+'+0.5+C';const rd=A.check(dec,stage.unit4Answer);if(rd.valid&&rd.ok)fail(engine,p,'decimal accepted');
 if(/\\ln\|/.test(ansTex)){const noBars=keyed.replace(/abs\(/g,'(');const rb=A.check(noBars,stage.unit4Answer);const needs=comps.some(([a,b])=>{for(let k=0;k<17;k++){const x=a+(b-a)*(k+0.37)/17;if(!Number.isFinite(evalAst(parseTex(ansTex.replace(/\+C$/,'').replace(/\|([^|]*)\|/g,'($1)'),v),x)))return true;}return false;});if(needs&&rb.valid&&rb.ok)fail(engine,p,'missing absolute value accepted: '+noBars);}
 verified++;
}
function checkDefinite(engine,p,stage){
 const q=splitIntegral(questionMath(p.questionHtml)),v=q.variable,f=parseTex(q.integrand,v);
 const a=evalAst(parseTex(q.lo,v),0),b=evalAst(parseTex(q.hi,v),0),fn=x=>evalAst(f,x);
 if(!(a<b))fail(engine,p,`bounds not increasing ${a} ${b}`);
 if(!finiteOn(fn,a,b))fail(engine,p,`integrand undefined or unbounded on [${a},${b}]`);
 const I=integrate(fn,a,b),shown=evalAst(parseTex(stage.answerTex,v),0);
 if(!close(I,shown,1e-8))fail(engine,p,`quadrature ${I} != displayed ${shown}`);
 const keyed=keypadForm(stage.answerTex),r=A.check(keyed,stage.unit4Answer);if(!r.valid||!r.ok)fail(engine,p,`keypad form rejected: ${keyed} ${JSON.stringify(r)}`);
 const rw=A.check(`${keyed}+1`,stage.unit4Answer);if(rw.valid&&rw.ok)fail(engine,p,'wrong value accepted');
 const rd=A.check(shown.toFixed(6),stage.unit4Answer);if(rd.valid&&rd.ok&&!Number.isInteger(shown*1e6))fail(engine,p,'decimal accepted: '+shown.toFixed(6));
 verified++;
}
function checkKeys(engine,p,stage,usage){
 const prof=PROFILES[stage.keypadMode];if(!prof){fail(engine,p,'unknown keypad profile '+stage.keypadMode);return;}
 const have=profileKeys(prof),need=neededKeys(stage.answerTex);
 for(const k of need){if(k==='C'&&have.has('C'))continue;if(!have.has(k))fail(engine,p,`answer needs key ${k} missing from ${stage.keypadMode}: ${stage.answerTex}`);}
 const u=usage[stage.keypadMode]||(usage[stage.keypadMode]=new Set());for(const k of need)u.add(k);
}
// ---- MVT: f, the interval and any piecewise conditions are read from the displayed formula
const AVG_PROMPT='Find the average value of the function on the given interval.';
function parseMvt(p){
 const tex=questionMath(p.questionHtml),m=tex.match(/^f\(x\)=([\s\S]*)\\text\{ on \}\\left\[([\s\S]*),\\,([\s\S]*)\\right\]$/);
 if(!m)throw Error('MVT formula not recognized: '+tex.slice(0,120));
 const a=evalAst(parseTex(m[2]),0),b=evalAst(parseTex(m[3]),0),body=m[1];let pieces;
 if(body.startsWith('\\begin{cases}')){
  pieces=body.replace(/^\\begin\{cases\}/,'').replace(/\\end\{cases\}$/,'').split('\\\\').map(row=>{
   const [e,c]=row.split(', &'),cm=String(c||'').trim().match(/^x\s*\\(le|lt|ge|gt)\s*([\s\S]+)$/);if(!cm)throw Error('piece condition: '+row);
   return{f:parseTex(e.trim()),op:cm[1],v:evalAst(parseTex(cm[2]),0)};});
  if(pieces.length!==2||pieces[0].v!==pieces[1].v||!['le','lt'].includes(pieces[0].op)||(pieces[0].op==='le')===(pieces[1].op==='ge'))throw Error('piece conditions do not split the line at one point');
 }else pieces=[{f:parseTex(body),op:null}];
 const f=x=>{for(const P of pieces){if(!P.op)return evalAst(P.f,x);const ok=P.op==='le'?x<=P.v:P.op==='lt'?x<P.v:P.op==='ge'?x>=P.v:x>P.v;if(ok)return evalAst(P.f,x);}return NaN;};
 return{a,b,pieces,f,brk:pieces.length>1?pieces[0].v:null};
}
function mvtAverage(M){
 const segs=M.brk===null?[[M.a,M.b,M.pieces[0].f]]:[[M.a,M.brk,M.pieces[0].f],[M.brk,M.b,M.pieces[1].f]];
 let I=0;for(const [u,v,ast] of segs){const g=x=>evalAst(ast,x);if(!finiteOn(g,u,v))throw Error(`f undefined or unbounded on [${u},${v}]`);I+=integrate(g,u,v);}
 return{avg:I/(M.b-M.a),segs};
}
// every c in [a, b] with f(c) = average, piece by piece (each piece on its own closed subinterval)
function mvtRoots(M,avg){
 const roots=[];let tangent=false;
 for(const [u,v,ast] of mvtAverage(M).segs){const g=x=>evalAst(ast,x)-avg,N=20000;let px=u,pv=g(u);
  if(pv===0)roots.push(u);
  for(let i=1;i<=N;i++){const x=u+(v-u)*i/N,w=g(x);
   if(w===0)roots.push(x);
   else if(pv*w<0){let lo=px,hi=x;for(let k=0;k<200;k++){const mid=(lo+hi)/2;if(g(lo)*g(mid)<=0)hi=mid;else lo=mid;}roots.push((lo+hi)/2);}
   // a tangent root: |g| nearly 0 at a local minimum with the same sign on both sides
   else if(i<N){const nx=g(x+(v-u)/N);if(Math.abs(w)<1e-7&&Math.abs(w)<Math.abs(pv)&&Math.abs(w)<Math.abs(nx)&&pv*w>0&&w*nx>0)tangent=true;}
   px=x;pv=w;}
 }
 const out=[];for(const r of roots.sort((p,q)=>p-q))if(!out.some(o=>Math.abs(o-r)<1e-7))out.push(r);
 return{roots:out,tangent};
}
function checkMvt(engine,p,stage){
 const M=parseMvt(p),{avg}=mvtAverage(M);
 if(!p.questionHtml.includes(AVG_PROMPT))fail(engine,p,'average-value direction missing');
 if(stage.unit4Answer.kind==='exact-number'){
  const shown=evalAst(parseTex(stage.answerTex),0);if(!close(avg,shown,1e-8)){fail(engine,p,`average ${avg} != displayed ${shown}`);return;}
  const keyed=keypadForm(stage.answerTex),r=A.check(keyed,stage.unit4Answer);if(!r.valid||!r.ok)fail(engine,p,`average keypad form rejected: ${keyed} ${JSON.stringify(r)}`);
  const rw=A.check(`${keyed}+1`,stage.unit4Answer);if(rw.valid&&rw.ok)fail(engine,p,'wrong average accepted');
  const rd=A.check(shown.toFixed(6),stage.unit4Answer);if(rd.valid&&rd.ok&&!Number.isInteger(shown*1e6))fail(engine,p,'decimal average accepted');
  verified++;return;
 }
 // stage 2: does the theorem apply, and which values of c does it guarantee?
 let continuous=true;
 if(M.brk!==null){const L=evalAst(M.pieces[0].f,M.brk),R=evalAst(M.pieces[1].f,M.brk);continuous=close(L,R,1e-10);}
 const dna=/\\text\{Does not apply\}/.test(stage.answerTex);
 if(!continuous){
  if(!dna){fail(engine,p,'f is discontinuous but values of c are given');return;}
  if(!/does not apply/i.test(stage.explanation))fail(engine,p,'explanation does not say the theorem does not apply');
  const r=A.check('Does not apply',stage.unit4Answer);if(!r.valid||!r.ok)fail(engine,p,'Does not apply rejected');
  const rw=A.check('0',stage.unit4Answer);if(rw.valid&&rw.ok)fail(engine,p,'a value accepted when the theorem does not apply');
  verified++;return;
 }
 if(dna){fail(engine,p,'f is continuous but the answer is Does not apply');return;}
 const {roots,tangent}=mvtRoots(M,avg);if(tangent)warnings.push(`${engine} ${p.id}: possible tangent root of f(c) = average`);
 if(!roots.length){fail(engine,p,'continuous f with no c found (theorem violated?)');return;}
 const shownTex=stage.answerTex.split(',\\ '),shown=shownTex.map(t=>evalAst(parseTex(t),0)).sort((u,v)=>u-v);
 if(shown.length!==roots.length||!shown.every((v,i)=>close(v,roots[i],1e-7))){fail(engine,p,`c values ${JSON.stringify(shown)} != roots ${JSON.stringify(roots)}`);return;}
 const keyed=shownTex.map(keypadForm);
 for(const list of [keyed.join(','),[...keyed].reverse().join(', ')]){const r=A.check(list,stage.unit4Answer);if(!r.valid||!r.ok)fail(engine,p,`c list rejected: ${list} ${JSON.stringify(r)}`);}
 if(keyed.length>1){const r=A.check(keyed.slice(1).join(','),stage.unit4Answer);if(r.valid&&r.ok)fail(engine,p,'incomplete c list accepted');}
 const rn=A.check('Does not apply',stage.unit4Answer);if(rn.valid&&rn.ok)fail(engine,p,'Does not apply accepted for a continuous f');
 const rd=A.check(shown.map(v=>v.toFixed(6)).join(','),stage.unit4Answer);if(rd.valid&&rd.ok)fail(engine,p,'decimal c accepted');
 verified++;
}
for(const engine of ONLY){
 const slug=SLUGS[engine],gen=G.get(slug);if(!gen){errors.push(`${engine}: generator missing`);continue;}
 const fam={},tier={},ids=new Map(),texts=new Set(),usage={};let repeats=0,prev=null,t0=Date.now();
 for(let i=1;i<=N;i++){
  ctx.window.BatchMathRNG={random:rng(i*7919+Object.keys(SLUGS).indexOf(engine)*104729)};
  let p;try{p=gen({});}catch(e){fail(engine,null,'generator threw: '+e.message);continue;}
  fam[p.variant]=(fam[p.variant]||0)+1;tier[p.unit4Meta?.tier]=(tier[p.unit4Meta?.tier]||0)+1;
  ids.set(p.id,(ids.get(p.id)||0)+1);texts.add(p.questionHtml+'|'+(p.stage2?.prompt||''));if(prev===p.id)repeats++;prev=p.id;
  try{
   lint(engine,p,p.questionHtml+p.explanation);
   for(const stage of [p.stage1,p.stage2].filter(Boolean)){
    checkKeys(engine,p,stage,usage);
    const kind=stage.unit4Answer?.kind;
    if(kind==='antiderivative')checkIndefinite(engine,p,stage);
    else if(kind==='exact-number'&&p.unit4Meta.mode==='definite')checkDefinite(engine,p,stage);
    else if(engine==='mvt')checkMvt?.(engine,p,stage);
   }
  }catch(e){fail(engine,p,'verification error: '+e.message);}
 }
 const targets=Object.fromEntries(META.W[engine]);const famReport={};
 for(const [f,w] of Object.entries(targets)){const got=100*(fam[f]||0)/N;famReport[f]={target:w,generated:+got.toFixed(2)};if(Math.abs(got-w)>1.5)errors.push(`${engine}: family ${f} ${got.toFixed(2)}% vs target ${w}%`);}
 for(const f of Object.keys(fam))if(!(f in targets))errors.push(`${engine}: unexpected family ${f}`);
 const tierTarget={};for(const [f,w] of META.W[engine])tierTarget[META.TIER[f]]=(tierTarget[META.TIER[f]]||0)+w;
 const tierReport={};for(const [t,w] of Object.entries(tierTarget)){const got=100*(tier[t]||0)/N;tierReport[t]={target:w,generated:+got.toFixed(2)};if(Math.abs(got-w)>2)errors.push(`${engine}: tier ${t} ${got.toFixed(2)}% vs target ${w}%`);}
 const maxShare=Math.max(...ids.values())/N*100;if(maxShare>0.5)warnings.push(`${engine}: one problem appears ${maxShare.toFixed(2)}% of the time`);
 if(texts.size<0.6*N)errors.push(`${engine}: only ${texts.size} distinct questions in ${N}`);
 const unused={};for(const [mode,used] of Object.entries(usage)){const have=profileKeys(PROFILES[mode]||{});const extra=[...have].filter(k=>!used.has(k)&&!['digits','fraction','exponent'].includes(k)&&!(k==='C'));if(extra.length)unused[mode]=extra;}
 report.engines[engine]={slug,families:famReport,tiers:tierReport,distinctIds:ids.size,distinctQuestions:texts.size,maxSingleProblemPercent:+maxShare.toFixed(3),immediateRepeats:repeats,keysNeverUsed:unused,seconds:(Date.now()-t0)/1000};
}
report.independentlyVerified=verified;report.errors=errors;report.warnings=warnings;report.ok=errors.length===0;
fs.writeFileSync(path.join(OUT,'unit4-final-four-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath v12.8.U final four integrals QA',`Result: ${report.ok?'PASS':'FAIL'}`,`Samples per engine: ${N}`,`Independently verified answers: ${verified}`];
for(const [e,r] of Object.entries(report.engines)){lines.push(`\n${e} (${r.slug}): ${r.distinctQuestions} distinct questions, max single ${r.maxSingleProblemPercent}%, ${r.seconds}s`);for(const [f,x] of Object.entries(r.families))lines.push(`  ${f.padEnd(36)} target ${String(x.target).padStart(3)}%  generated ${x.generated.toFixed(2).padStart(6)}%`);for(const [t,x] of Object.entries(r.tiers))lines.push(`  tier ${t.padEnd(31)} target ${String(x.target).padStart(3)}%  generated ${x.generated.toFixed(2).padStart(6)}%`);if(Object.keys(r.keysNeverUsed).length)lines.push('  keys never needed: '+JSON.stringify(r.keysNeverUsed));}
lines.push(`\nWarnings: ${warnings.length}`,...warnings.map(w=>'- '+w),`Errors: ${errors.length}`,...errors.slice(0,80).map(e=>'- '+e));
fs.writeFileSync(path.join(OUT,'unit4-final-four-qa.txt'),lines.join('\n')+'\n');console.log(lines.join('\n'));
if(errors.length)process.exit(1);
