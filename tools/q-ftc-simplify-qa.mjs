// v12.8.T FTC regression: correctness, simplification, trig notation, explanation consistency, checker behavior.
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sb={window:{},console};sb.window.window=sb.window;vm.createContext(sb);
for(const f of ['derivative-expression-checker.js','unit4-exact-answers.js','ap-topic-generators.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',f),'utf8'),sb);
let seed=Number(process.env.SEED||8128);sb.window.BatchMathRNG={random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;}};
const G=sb.window.BatchMathAPTopicGenerators.get('fundamental-theorem-of-calculus'),check=sb.window.BatchMathUnit4DefiniteAnswers.check;
const errors=[],counts={},stats={samples:0,accepted:0,equivalentAccepted:0,wrongRejected:0,linesChecked:0,texConverted:0};
const err=(m)=>{if(errors.length<40)errors.push(m);};
// ---------- independent math ----------
const F={sin:Math.sin,cos:Math.cos,tan:Math.tan,sec:x=>1/Math.cos(x),ln:Math.log,exp:Math.exp};
const bound=b=>x=>b.type==='constant'?b.d:b.type==='identity'?x:b.type==='linear'?b.k*x+b.d:b.type==='power'?b.k*x**b.d:b.type==='exp'?Math.exp(b.k*x):b.type==='sin'?Math.sin(b.k*x):Math.tan(b.k*x);
const integrand=(type,k,c)=>t=>{switch(type){
 case 'trig_product':return Math.sin(t)**k*Math.cos(t);case 'exponential_product':return Math.exp(k*t)*Math.cos(t**c);case 'polynomial_exponential':return t**c-Math.exp(k*t);
 case 'power_cosine':return t**c*Math.cos(t);case 'polynomial':return t**c-k*t**(c-1);case 'cosine_linear':return Math.cos(k*t)-t;case 'linear_sine':return k*t-Math.sin(t);
 case 'gaussian':return Math.exp(-k*t*t);case 'cosine_composition':return Math.cos(t**c);case 'log_positive':return Math.log(k+t*t);case 'rational_positive':return (t-c)/(t*t+k);
 default:return t*t*(k+Math.exp(t));}};
const num=(f,x,h=1e-6)=>(f(x+h)-f(x-h))/(2*h);
function simpson(f,a,b,n=2000){const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=f(a+i*h)*(i%2?4:2);return s*h/3;}
// ---------- TeX -> JS for displayed lines ----------
function texToJs(src){
 let i=0;const s=src.replace(/\\displaystyle/g,'').replace(/\\,/g,'').replace(/\\left|\\right/g,m=>m==='\\left'?'':'').replace(/\s+/g,'');
 const peek=()=>s[i],starts=t=>s.startsWith(t,i);
 function group(){if(s[i]!=='{')throw Error('brace');i++;const v=expr();if(s[i]!=='}')throw Error('brace close');i++;return v;}
 function expr(){let out=term();while(peek()==='+'||peek()==='-'){const o=s[i++];out+=o+term();}return out;}
 function term(){
  let out='';let first=true;
  if(peek()==='-'){i++;out+='(-1)*';}
  while(i<s.length&&peek()!=='+'&&peek()!=='-'&&peek()!==')'&&peek()!=='}'){
   if(starts('\\cdot')){i+=5;out+='*';first=true;continue;}
   const f=factor();if(!first&&!/[*]$/.test(out))out+='*';out+=f;first=false;
  }
  return out;
 }
 function argument(){if(peek()==='('){i++;const v=expr();if(peek()!==')')throw Error('paren');i++;return `(${v})`;}if(peek()==='x'||peek()==='t'){i++;return `(${s[i-1]})`;}if(/[0-9]/.test(peek())){let j=i;while(/[0-9.]/.test(s[j]))j++;const v=s.slice(i,j);i=j;return `(${v})`;}throw Error('arg '+s.slice(i,i+10));}
 function atom(){
  if(peek()==='('){i++;const v=expr();if(peek()!==')')throw Error('paren');i++;return `(${v})`;}
  if(starts('\\frac')){i+=5;const a=group(),b=group();return `((${a})/(${b}))`;}
  for(const fn of ['sin','cos','tan','sec','ln']){if(starts('\\'+fn)){i+=fn.length+1;let pw=null;if(peek()==='^'){i++;pw=group();}const arg=argument();return pw?`(F.${fn}${arg})**(${pw})`:`F.${fn}${arg}`;}}
  if(peek()==='e'&&s[i+1]==='^'){i+=2;const v=group();return `F.exp(${v})`;}
  if(peek()==='x'||peek()==='t'){return s[i++];}
  if(/[0-9]/.test(peek())){let j=i;while(/[0-9.]/.test(s[j]))j++;const v=s.slice(i,j);i=j;return v;}
  throw Error('atom '+s.slice(i,i+12));
 }
 function factor(){let a=atom();if(peek()==='^'){i++;const p=group();a=`(${a})**(${p})`;}return a;}
 const out=expr();if(i!==s.length)throw Error('trailing '+s.slice(i,i+12));return out;
}
const evalJs=(js,x)=>new Function('F','x','t',`return ${js}`)(F,x,x);
const eqLines=h=>[...h.matchAll(/<div class="u4-work-equation[^"]*">\\\(\\displaystyle ([\s\S]*?)\\\)<\/div>/g)].map(m=>m[1]);
// ---------- structure checks on the final answer ----------
function splitDepth(str,seps){const out=[];let d=0,cur='';for(const ch of str){if(ch==='(')d++;if(ch===')')d--;if(d===0&&seps.includes(ch)){out.push(cur);cur='';}else cur+=ch;}out.push(cur);return out;}
const normOrder=t=>t.replace(/\\left\(/g,'(').replace(/\\right\)/g,')').replace(/\\cdot|\\,|\\ |\s/g,'').split('').sort().join('');
function checkSimplified(expr,label){ // expr is the parseable answer e-string
 const body=expr.replace(/^\((.*)\)$/s,'$1');
 for(const term of splitDepth(body,['+'])){
  const factors=splitDepth(term,['*']);
  const nums=factors.filter(f=>/^\(?-?\d+\)?$/.test(f)),xs=factors.filter(f=>/^x(\^\d+)?$/.test(f)||/^\(x\)(\^\d+)?$/.test(f));
  if(nums.length>1)err(`${label}: two numeric factors in ${term}`);
  if(xs.length>1)err(`${label}: uncombined powers of x in ${term}`);
  for(const f of factors){
   if(/^\(\(?-?\d+\*?\(?x\)?(\^\d+)?\)?\)\^\d+$/.test(f)||/^\(-?\d+\*x(\^\d+)?\)\^\d+$/.test(f)||/^\(x\^\d+\)\^\d+$/.test(f))err(`${label}: unexpanded monomial power ${f}`);
   if(/^1$/.test(f)&&factors.length>1)err(`${label}: redundant factor 1 in ${term}`);
   if(/^\(?x\)?\^[01]$/.test(f)||/^\(x\)\^[01]$/.test(f))err(`${label}: x^0 / x^1 power ${f}`);
  }
 }
}
function checkTexHygiene(t,label){
 const bad=[[/\\(?:sin|cos|tan|sec|ln)\\left\(x\\right\)/,'function of plain x in parentheses'],[/\^\{1\}/,'^{1}'],[/\^\{0\}/,'^{0}'],[/(?:^|[^0-9a-z{^.\\])1\\cdot/,'1\\cdot'],[/\\cdot 1(?![0-9.])/,'\\cdot 1'],[/\+-|--|\+\+/,'double sign'],[/\\left\(\\left\([^()]*?\\right\)\\right\)/,'redundant nested parentheses'],[/\d \d/,'adjacent digits'],[/\)\^\{[0-9]+\}\^/,'stacked exponents'],[/\\left\(\\right\)/,'empty parentheses'],[/\+0(?![0-9.])|-0(?![0-9.])/,'+0 term'],[/(?:sin|cos|tan|sec)\([a-z0-9]*\)\^/,'literal sin(x)^n text']];
 for(const m of t.matchAll(/\\(?:sin|cos|tan|sec)\\left\(/g)){let d=1,j=m.index+m[0].length;while(j<t.length&&d){if(t.startsWith('\\left(',j)){d++;j+=6;}else if(t.startsWith('\\right)',j)){d--;j+=7;}else j++;}if(t[j]==='^')err(`${label}: exponent placed after function argument in ${t.slice(m.index,m.index+60)}`);}
 for(const [rx,why] of bad){const m=t.match(rx);if(m)err(`${label}: ${why} :: ...${t.slice(Math.max(0,m.index-50),m.index+40)}`);}
}
// ---------- main sampling ----------
const N=Number(process.env.N||2500);
const unsafe=p=>['exp'].includes(p.upper.type)||['exp'].includes(p.lower.type);
for(let n=0;n<N;n++){
 const p=G(),d=p.unit4Meta,fam=p.variant;counts[fam]=(counts[fam]||0)+1;stats.samples++;
 const ans=p.stage1.unit4Answer,tex=p.stage1.explanation,answerTex=p.stage1.answerTex;
 const f=integrand(d.integrandType,d.k,d.c),gu=bound(d.upper),gl=bound(d.lower);
 const pts=d.upper.type==='tan'?[-.9,-.4,.2,.5].map(v=>v*(Math.PI/(2*d.upper.k))*.5):unsafe(d)?[-.5,-.1,.2]:[-.8,-.3,.4,.9];
 const cf=x=>evalJs(texToJs(answerTex),x);
 for(const x of pts){
  // 1. mathematically correct derivative: FTC identity with independent f and numeric g'
  const expected=f(gu(x))*num(gu,x)-f(gl(x))*num(gl,x),got=evalJs(texToJs(answerTex),x),viaE=sb.window.BatchMathDerivativeExpressions.evaluate(sb.window.BatchMathDerivativeExpressions.parse(ans.expression),{x});
  if(Number.isFinite(expected)&&Math.abs(expected-got)>1e-5*Math.max(1,Math.abs(expected)))err(`${fam} ${d.integrandType} wrong derivative at ${x}: want ${expected} got ${got} :: ${answerTex}`);
  if(Math.abs(viaE-got)>1e-8*Math.max(1,Math.abs(got)))err(`${fam} tex/checker expression disagree at ${x}`);
 }
 // real numeric integration on benign cases (not just the identity)
 if(n%25===0&&!unsafe(d)&&d.upper.type!=='tan'&&Math.abs(gu(.31)-gl(.31))<=3){const x=.31,H=z=>simpson(f,gl(z),gu(z),1200),nd=(H(x+1e-4)-H(x-1e-4))/2e-4,got=cf(x);if(Number.isFinite(nd)&&Math.abs(nd)<1e5&&Math.abs(nd-got)>1e-4*Math.max(1,Math.abs(nd)))err(`${fam} integral derivative mismatch ${nd} vs ${got}`);}
 // 2. simplified, notation, hygiene
 checkSimplified(ans.expression,fam);checkTexHygiene(answerTex,fam);checkTexHygiene(tex,fam+' explanation');
 // 3. explanation consistency: every displayed H'(x)= line and every chain element equals the answer numerically
 const lines=eqLines(tex);let sawFinal=false;
 // no two consecutive displayed H'(x)= lines are identical or differ only by factor order
 {const shownLines=lines.filter(l=>/^H'\(x\)=/.test(l));for(let i=1;i<shownLines.length;i++)if(normOrder(shownLines[i])===normOrder(shownLines[i-1]))err(`${fam} consecutive lines only reorder/repeat: ${shownLines[i-1].slice(0,80)} || ${shownLines[i].slice(0,80)}`);
  const rl=lines.filter(l=>!/^H'\(x\)=-?f\\left\(/.test(l));if(new Set(rl).size!==rl.length)err(`${fam} a displayed line is repeated`);}
 for(const line of lines){
  if(/^H'\(x\)=f\\left\(/.test(line)||/^H'\(x\)=-f\\left\(/.test(line)){stats.ruleLines=(stats.ruleLines||0)+1;continue;} // symbolic FTC/chain-rule template line
  const term=line.match(/^\\text\{(?:upper|lower) term: \}(.*)$/),chainBody=term?term[1]:/^H'\(x\)=/.test(line)?line.slice(line.indexOf('=')+1):null;
  if(chainBody===null)continue;
  const segs=chainBody.split('=');const vals=[];
  for(const seg of segs)try{vals.push(seg);texToJs(seg);}catch(e){err(`${fam} unparsed line atom ${e.message}: ${line.slice(0,150)}`);}
  for(const x of pts.slice(0,2)){const ev=segs.map(sg=>evalJs(texToJs(sg),x));stats.linesChecked+=ev.length;
   if(ev.some(v=>Math.abs(v-ev[0])>1e-8*Math.max(1,Math.abs(ev[0]))))err(`${fam} chain pieces disagree: ${line.slice(0,160)}`);
   if(!term){const want=cf(x);if(Math.abs(ev[0]-want)>1e-8*Math.max(1,Math.abs(want)))err(`${fam} displayed line differs from answer: ${line.slice(0,150)}`);}}
  stats.texConverted++;
  if(!term&&normOrder(segs.at(-1))===normOrder(answerTex))sawFinal=true;
 }
 if(!sawFinal)err(`${fam} explanation never ends with the displayed answer`);
 if(!/^H'\(x\)=/.test(lines.at(-1)||''))err(`${fam} last displayed line is not H'(x)=...`);
 // concise wording: every step is one short instruction plus the math
 {const steps=tex.split('<div class="u4-work-step">').slice(1).map(x=>x.replace(/<div class="u4-work-equation[\s\S]*?<\/div>/g,' ').replace(/\\\([\s\S]*?\\\)/g,' ').replace(/<[^>]+>/g,' ').trim().split(/\s+/).filter(Boolean).length);
  stats.maxStepWords=Math.max(stats.maxStepWords||0,...steps);stats.maxTotalWords=Math.max(stats.maxTotalWords||0,steps.reduce((a,b)=>a+b,0));
  if(steps.some(w=>w>18))err(`${fam} step too wordy: ${steps}`);if(steps.reduce((a,b)=>a+b,0)>50)err(`${fam} explanation too wordy: ${steps}`);
  {const m=tex.match(/antiderivative|Let <|Rule\.<|Upper evaluation|Lower evaluation|constant limit|contributes|Simplify each term|Write the result|Differentiate each|Substitute into/);if(m)err(`${fam} old/unnatural wording present: ${m[0]}`);}
  {const first=tex.split('<div class="u4-work-step">')[1]||'';const chainWord=/chain rule/.test(first),needs=[d.upper,d.lower].some(b=>b.type!=='constant'&&!(b.type==='identity'||(b.type==='linear'&&b.k===1)));if(chainWord&&!needs)err(`${fam} mentions chain rule although every bound has derivative 1`);if(!chainWord&&needs)err(`${fam} omits chain rule although a bound has derivative other than 1`);}
  if(steps.length<2||steps.length>4)err(`${fam} unexpected step count ${steps.length}`);}
 // 4. checker: accepts displayed answer, unsimplified raw form, reordered/readable variants; rejects wrong answers
 const A={kind:'function-expression',expression:ans.expression,probes:ans.probes};
 const ok=r=>{const o=check(r,A);return o.valid&&o.ok;};
 if(!ok(ans.expression))err(`${fam} checker rejects displayed answer ${ans.expression}`);else stats.accepted++;
 const raw=`${d.rawUpper}-(${d.rawLower})`;
 if(!ok(raw))err(`${fam} checker rejects unsimplified form ${raw}`);else stats.equivalentAccepted++;
 const readable=ans.expression.replace(/\((sin|cos|tan|sec)\(([^()]*)\)\)\^(\d+)/g,(m,f,a,p)=>a==='x'?`${f}^${p} x`:`${f}^${p}(${a})`).replace(/\*/g,' ').replace(/\(x\)/g,'x');
 if(readable!==ans.expression&&!ok(readable)&&!/\)\)\(|exp\(/.test('')){ // readable conventional notation (implicit multiplication) must be accepted
  err(`${fam} checker rejects conventional notation ${readable}`);} else if(readable!==ans.expression)stats.equivalentAccepted++;
 const superscript=ans.expression.replace(/\((sin|cos|tan|sec)\(([^()]*)\)\)\^2/g,(m,f,a)=>`${f}²(${a})`);
 if(superscript!==ans.expression){if(!ok(superscript))err(`${fam} rejects ${superscript}`);else stats.equivalentAccepted++;}
 const wrongs=[[`-(${ans.expression})`,'negated'],[`(${ans.expression})+x^2+1`,'extra term'],[ans.expression.replace(/\d+/,m=>String(Number(m)+1)),'changed coefficient']];
 if(d.lower.type!=='constant')wrongs.push([`(${d.rawUpper})`,'upper only (missing lower term)']);
 if(d.lower.type!=='constant'&&d.upper.type!=='constant')wrongs.push([`(${d.rawUpper})-(${d.rawLower})*(-1)`,'wrong sign on lower']);
 // missing chain factor: use the integrand-at-limit without derivative factors
 for(const [w,why] of wrongs){if(w===ans.expression)continue;const o=check(w,A);if(o.valid&&o.ok)err(`${fam} checker ACCEPTED wrong answer (${why}): ${w}`);else stats.wrongRejected++;}
}
// ---------- second PDF example: H(x)=int_{-1}^{x-3} sin^3(t)cos(t) dt must be exactly two short steps ----------
{
 let found=null;for(let n=0;n<600000&&!found;n++){const p=G(),d=p.unit4Meta;if(d.integrandType==='trig_product'&&d.k===3&&d.upper.type==='linear'&&d.upper.k===1&&d.upper.d===-3&&d.lower.type==='constant'&&d.lower.d===-1)found=p;}
 if(!found)err('sin^3 x-3 PDF example problem not generated');else{
  const t=found.stage1.explanation,parts=t.split('<div class="u4-work-step">').slice(1);
  if(parts.length!==2)err(`sin^3 PDF example should have exactly 2 steps, has ${parts.length}`);
  if(!/>Apply the FTC\.<\/strong>/.test(parts[0]||''))err('sin^3 PDF example opening should be "Apply the FTC."');
  if(/chain|constant|contribut/i.test(t))err('sin^3 PDF example mentions chain rule/constant bound');
  if(!/Substitute .*x-3.* into the function/.test((parts[1]||'').replace(/\\\(|\\\)/g,'')))err('sin^3 PDF example step 2 wording');
  const ls=eqLines(t);if(ls[0]!=="H'(x)=f\\left(x-3\\right)")err('sin^3 PDF example rule line: '+ls[0]);
  if(ls[1]!=="H'(x)=\\sin^{3}\\left(x-3\\right)\\,\\cos\\left(x-3\\right)")err('sin^3 PDF example substituted line: '+ls[1]);
  if(ls.length!==2)err('sin^3 PDF example shows extra lines: '+ls.slice(2).join(' | '));
  const A={kind:'function-expression',expression:found.stage1.unit4Answer.expression,probes:found.stage1.unit4Answer.probes};
  for(const r of ['sin^3(x-3)cos(x-3)','cos(x-3)sin^3(x-3)','sin³(x-3)cos(x-3)','(sin(x-3))^3cos(x-3)','sin(x-3)^3*cos(x-3)'])if(!(check(r,A).ok))err('checker rejects '+r);
  for(const r of ['sin^3(x)cos(x)','sin^3(x-3)cos(x)','-sin^3(x-3)cos(x-3)','sin^2(x-3)cos(x-3)','sin^3(x-3)'])if(check(r,A).ok)err('checker accepts wrong '+r);
  stats.secondPdfExample='found, 2 steps, checker verified';
 }
}
// ---------- the exact problem from the PDF, found in the real generator ----------
{
 let found=null;for(let n=0;n<600000&&!found;n++){const p=G(),d=p.unit4Meta;if(d.integrandType==='power_exponential'&&d.k===2&&d.upper.type==='tan'&&d.upper.k===1&&d.lower.type==='power'&&d.lower.k===3&&d.lower.d===2)found=p;}
 if(!found)err('PDF example problem not generated');else{
  const text=found.stage1.explanation,expected='\\sec^{2} x\\,\\tan^{2} x\\left(2+e^{\\tan x}\\right)-54x^{5}\\left(2+e^{3x^{2}}\\right)';
  if(found.stage1.answerTex!==expected)err('PDF example answer is '+found.stage1.answerTex);
  for(const need of ['\\left(3x^{2}\\right)^{2}','9x^{4}','54x^{5}','\\tan^{2} x','\\sec^{2} x'])if(!text.includes(need))err('PDF example explanation lacks '+need);
  if(/\\sec\\left\(x\\right\)|\\tan\\left\(x\\right\)/.test(text+found.stage1.answerTex))err('PDF example shows tan(x)/sec(x) instead of tan x/sec x');
  const A={...found.stage1.unit4Answer};for(const a of ['sec² x tan² x(2 + e^(tan x)) − 54x⁵(2 + e^(3x²))','tan² x(2 + e^(tan x))sec² x − 6x(3x²)²(2 + e^(3x²))','sec² x tan² x(2 + e^(tan x)) − 108x⁵ − 54x⁵e^(3x²)','sec(x)^2*tan(x)^2*(2+e^(tan(x)))-54*x^5*(2+e^(3*x^2))']){const o=check(a,A);if(!(o.valid&&o.ok))err('PDF example: checker rejects '+a);}
  stats.pdfExample='found, simplified, verified';
 }
}
// ---------- exact PDF example and listed forms ----------
const pdf={kind:'function-expression',expression:'(sec(x))^2*(tan(x))^2*(2+exp(tan(x)))-54*x^5*(2+exp(3*x^2))',probes:[-.22,-.1,0,.12,.24]};
const accept=['sec^2 x tan^2 x(2+e^(tan x))-54x^5(2+e^(3x^2))','sec²(x)tan²(x)(2+e^(tan(x)))-54x⁵(2+e^(3x²))','tan(x)^2(2+e^(tan(x)))sec(x)^2-6x(3x^2)^2(2+e^(3x^2))','sec(x)^2*tan(x)^2*(2+e^(tan(x)))-108x^5-54x^5e^(3x^2)','(sec x)^2(tan x)^2(2+e^(tan x))-54x^5(2+e^(3x^2))','sec^(2)(x)*tan^(2)(x)*(2+e^(tan(x)))-54x^5*(2+e^(3x^2))'];
for(const a of accept){const o=check(a,pdf);if(!(o.valid&&o.ok))err('PDF equivalent form rejected: '+a);}
const reject=['sec(x)^2*tan(x)^2*(2+e^(tan(x)))+54x^5(2+e^(3x^2))','tan(x)^2*(2+e^(tan(x)))-54x^5(2+e^(3x^2))','sec(x)^2*tan(x)^2*(2+e^(tan(x)))-6x^5(2+e^(3x^2))','sec(x)^2*tan(x)^2*(2+e^(tan(x)))-54x^4(2+e^(3x^2))','sec(x)^2*tan(x)^2*(2+e^(tan(x)))','sec(x)^2*tan(x)^2*(2+e^(tan(x)))-54x^5(2+e^(3x))'];
for(const a of reject){const o=check(a,pdf);if(o.valid&&o.ok)err('PDF wrong form accepted: '+a);}
// sin^2 x == (sin x)^2 and sin^2(3x) == (sin(3x))^2
const t1={kind:'function-expression',expression:'(sin(x))^2'},t2={kind:'function-expression',expression:'(sin(3*x))^2'};
for(const [a,e] of [['sin² x',t1],['sin^2 x',t1],['(sin x)^2',t1],['sin(x)^2',t1],['sin^2(x)',t1],['sin²(3x)',t2],['(sin(3x))^2',t2],['sin^2(3x)',t2],['sin(3x)^2',t2],['sin^(2)(3x)',t2],['1-cos(x)^2',t1]]){const o=check(a,e);if(!(o.valid&&o.ok))err(`rejects ${a}`);}
for(const [a,e] of [['sin(x^2)',t1],['sin(2x)^2',t2],['sin(3x)',t2],['sin x',t1]]){const o=check(a,e);if(o.valid&&o.ok)err(`accepts wrong ${a}`);}
console.log(JSON.stringify({ok:!errors.length,stats,families:counts,errorCount:errors.length,errors},null,1));process.exit(errors.length?1:0);
