// v12.8.X independent check of the Rate engine from the question text: the rate formulas (including piecewise
// ones), which rate is an inflow and which an outflow, the window each rate applies on, the starting (or later)
// amount and every prompt are re-read; each answer is recomputed with adaptive Simpson and compared, for exact
// answers to 1e-9 and for calculator answers to 1e-7 and again after rounding to three places. It also scans
// every problem for content that routine accumulation practice must not contain (the derivative of a rate,
// increasing / decreasing, greatest / least amounts, target times, above-a-level windows, the net rate at an
// instant). Usage: node tools/review-lab/unit5/qa/verify-rate-x.mjs [N] [calculator|non-calculator|mixed] [file...]
import {load,keypadForm} from './lib.mjs';
const N=+(process.argv[2]||1500),CALC=process.argv[3]&&process.argv[3]!=='mixed'?process.argv[3]:undefined;
const L=load(['unit5-rate.js']),gen=L.G.get('rate-problems'),A=L.A,C=L.W.BatchMathUnit5Core;
const lin=t=>keypadForm(String(t).replace(/\{,\}/g,'').replace(/\\lt|\\gt/g,'').replace(/\\cdot/g,'*'));
const fn=tex=>{const tree=A.parse(lin(tex),'t');return t=>A.value(tree,t);};
const num=s=>Number(String(s).replace(/\{,\}|,/g,''));
const simpson=(f,a,b)=>{if(a===b)return 0;if(a>b)return -simpson(f,b,a);const S=(a,b,fa,fm,fb)=>(b-a)/6*(fa+4*fm+fb);
 const rec=(a,b,fa,fm,fb,w,eps,d)=>{const m=(a+b)/2,l1=(a+m)/2,r1=(m+b)/2,fl=f(l1),fr=f(r1),l=S(a,m,fa,fl,fm),r=S(m,b,fm,fr,fb);if(d>45||Math.abs(l+r-w)<=15*eps)return l+r+(l+r-w)/15;return rec(a,m,fa,fl,fm,l,eps/2,d+1)+rec(m,b,fm,fr,fb,r,eps/2,d+1);};
 const n=64,h=(b-a)/n;let s=0;for(let i=0;i<n;i++){const x=a+i*h,y=x+h,fx=f(x),fy=f(y),fm=f((x+y)/2);s+=rec(x,y,fx,fm,fy,S(x,y,fx,fm,fy),1e-13,0);}return s;};
const FORBIDDEN=[/increasing/i,/decreasing/i,/greatest/i,/least/i,/maximum/i,/minimum/i,/[A-Z]'\(/,/derivative/i,/rate at which the amount/i,/at what time/i,/when (?:will|does|is)/i,/reach/i,/greater than/i,/exceed/i,/is the amount .* changing/i];
const plain=h=>h.replace(/<[^>]+>/g,' ').replace(/\\\(|\\\)/g,'').replace(/\s+/g,' ');
let checked=0,leaks=0;const bad=[],kinds={};
for(let i=1;i<=N;i++){L.seed(i*7577);const p=gen({calc:CALC});const q=p.questionHtml,txt=plain(q);
 const allText=txt+' '+p.parts.map(x=>plain(x.prompt)).join(' ');
 for(const re of FORBIDDEN)if(re.test(allText)){leaks++;bad.push(`${p.id}: forbidden content ${re}: ${allText.slice(0,160)}`);break;}
 if(CALC&&p.calculatorActive!==(CALC==='calculator'))bad.push(`${p.id}: wrong calculator kind`);
 // formulas: F(t)=... (a piecewise formula: \begin{cases} f, & a\le t\lt b\\ g, & b\le t\le c\end{cases})
 const F={};for(const m of q.matchAll(/<div class="u4-formula">\\\(\\displaystyle ([A-Z])\(t\)=(.*?)\\\)<\/div>/g)){const [,name,tex]=m;
  const cs=tex.match(/\\begin\{cases\}(.*?), & 0\\le t\\lt (\d+)\\\\ (.*?), & \d+\\le t\\le (\d+)\\end\{cases\}/);
  if(cs){const f1=fn(cs[1]),f2=fn(cs[3]),b=+cs[2];F[name]=t=>t<b?f1(t):f2(t);F[name].breaks=[b];}else F[name]=fn(tex);}
 // the rates and their windows, sentence by sentence
 const rates=[];for(const sent of txt.split(/(?<=\.)\s+/).flatMap(x=>x.split(/, and (?=[a-z]+ [a-z ]*?(?:is|are|leave|join|enter)\b)/i))){ // each clause names one rate
  const mm=sent.match(/rate of ([A-Z])\(t\)/)||sent.match(/rate of (\d+) /);if(!mm)continue;
  const f=F[mm[1]]||(()=>{const c=+mm[1];return()=>c;})();
  const out=/drained|leave|unloaded|removed/.test(sent),inn=!out;
  let a=0,b=Infinity;const until=sent.match(/from t=(\d+)(?: \([^)]*\))? until t=(\d+)/),start=sent.match(/starting at t=(\d+)/);
  if(until){a=+until[1];b=+until[2];}if(start){a=+start[1];}
  rates.push({f,inn,a,b,name:mm[1]});}
 const at0=txt.match(/At t=(\d+)(?: \([^)]*\))?, [^.]*? contains ([\d,]+) /),known=at0?{t:+at0[1],A:num(at0[2])}:null;
 const unitHours=/measured in hours/.test(txt),clk=txt.match(/measured in (hours|minutes) after (\d+):(\d+) (AM|PM)/)||txt.match(/measured in (hours|minutes) after (noon|midnight)/);
 const clockToT=s=>{if(!clk)return NaN;const start=clk[2]==='noon'?720:clk[2]==='midnight'?0:((+clk[2]%12)+(clk[4]==='PM'?12:0))*60+(+clk[3]);
  const m=s.match(/(\d+):(\d+) (AM|PM)/);let mins;if(s==='noon')mins=720;else if(s==='midnight')mins=0;else mins=((+m[1]%12)+(m[3]==='PM'?12:0))*60+(+m[2]);let d=mins-start;if(d<0)d+=1440;return clk[1]==='hours'?d/60:d;};
 const flow=(r,x,y)=>{if(x>y)return -flow(r,y,x);const lo=Math.max(r.a,x),hi=Math.min(r.b,y);return hi>lo?simpson(r.f,lo,hi):0;}; // backward in time: the change is reversed
 const net=(x,y)=>rates.reduce((s,r)=>s+(r.inn?1:-1)*flow(r,x,y),0);
 for(const part of p.parts){const pr=plain(part.prompt),ans=part.answer;let want=null,kind;
  const win=pr.match(/from t=(\d+)(?: \([^)]*\))? to t=(\d+)/),atT=pr.match(/(?:are|were) in [^?]*? at t=(\d+)/);
  const cmp=pr.match(/How many (more|fewer) .* from t=(\d+)(?: \([^)]*\))? to t=(\d+)(?: \([^)]*\))? than from t=(\d+)(?: \([^)]*\))? to t=(\d+)/);
  const clkWin=pr.match(/from ((?:\d+:\d+ (?:AM|PM))|noon|midnight) to ((?:\d+:\d+ (?:AM|PM))|noon|midnight)\?/);
  if(cmp){const [,mf,a2,b2,a1,b1]=cmp;const d=simpson(rates[0].f,+a2,+b2)-simpson(rates[0].f,+a1,+b1);want=mf==='more'?d:-d;kind='compare';}
  else if(/average rate/.test(pr)&&win){want=simpson(rates[0].f,+win[1],+win[2])/(+win[2]-+win[1]);kind='average';}
  else if(clkWin&&rates.length===1){want=simpson(rates[0].f,clockToT(clkWin[1]),clockToT(clkWin[2]));kind='clock window';}
  else if(/change from t=0 to t=(\d+)/.test(pr)){const t1=+pr.match(/change from t=0 to t=(\d+)/)[1];want=net(0,t1);kind='net change';}
  else if(atT&&known){const t1=+atT[1];want=known.A+net(known.t,t1);kind='amount';}
  else if(win&&/enter/.test(pr)){want=rates.filter(r=>r.inn).reduce((s,r)=>s+flow(r,+win[1],+win[2]),0);kind='inflow total';}
  else if(win&&/leave|drained|removed|unloaded/.test(pr)&&rates.some(r=>!r.inn)){want=rates.filter(r=>!r.inn).reduce((s,r)=>s+flow(r,+win[1],+win[2]),0);kind='outflow total';}
  else if(win&&rates.length===1){want=simpson(rates[0].f,+win[1],+win[2]);kind='one rate';}
  if(want===null){bad.push(`${p.id}: part not interpreted: ${pr.slice(0,90)}`);continue;}
  checked++;kinds[kind]=(kinds[kind]||0)+1;const got=ans.value;
  const tol=ans.kind==='exact'?1e-9:1e-7;
  if(!(Math.abs(got-want)<=tol*Math.max(1,Math.abs(want))))bad.push(`${p.id} [${kind}] ${pr.slice(0,70)} | engine ${got} independent ${want}`);
  else if(ans.places!==undefined&&C.fix(got,ans.places)!==C.fix(want,ans.places))bad.push(`${p.id} [${kind}]: rounds to ${C.fix(got,ans.places)}, independent ${C.fix(want,ans.places)}`);
  if(ans.kind==='exact'&&!part.calculatorActive&&p.calculatorActive)bad.push(`${p.id}: exact part in a calculator problem`);}}
console.log(`problems ${N}${CALC?` (${CALC})`:''}; parts recomputed ${checked}; forbidden-content problems ${leaks}; disagreements ${bad.length}`);
console.log(JSON.stringify(kinds));console.log(bad.slice(0,15).join('\n'));process.exitCode=bad.length?1:0;
