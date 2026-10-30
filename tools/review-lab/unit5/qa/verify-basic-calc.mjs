// v12.8.X independent check of the Basic calculator families: from the question as displayed it re-parses f'(x),
// the known value and the requested point (halves, tenths or multiples of π), integrates with adaptive Simpson
// (the engine uses Gauss-Legendre) and compares the value and its rounding to three places.
// Usage: node tools/review-lab/unit5/qa/verify-basic-calc.mjs [N]
import {load,keypadForm} from './lib.mjs';
const N=+(process.argv[2]||1500);const L=load(['unit5-basic.js']),gen=L.G.get('basic-first-order-differential-equations'),A=L.A,C=L.W.BatchMathUnit5Core;
const lin=t=>keypadForm(String(t).replace(/\\lt|\\gt/g,''));
const num=tex=>A.value(A.parse(lin(tex),null),0);
const simpson=(f,a,b)=>{if(a===b)return 0;if(a>b)return -simpson(f,b,a);const S=(a,b,fa,fm,fb)=>(b-a)/6*(fa+4*fm+fb);
 const rec=(a,b,fa,fm,fb,w,eps,d)=>{const m=(a+b)/2,l1=(a+m)/2,r1=(m+b)/2,fl=f(l1),fr=f(r1),l=S(a,m,fa,fl,fm),r=S(m,b,fm,fr,fb);if(d>40||Math.abs(l+r-w)<=15*eps)return l+r+(l+r-w)/15;return rec(a,m,fa,fl,fm,l,eps/2,d+1)+rec(m,b,fm,fr,fb,r,eps/2,d+1);};
 const n=64,h=(b-a)/n;let s=0;for(let i=0;i<n;i++){const x=a+i*h,y=x+h,fx=f(x),fy=f(y),fm=f((x+y)/2);s+=rec(x,y,fx,fm,fy,S(x,y,fx,fm,fy),1e-12,0);}return s;};
let checked=0;const bad=[],kinds={};
for(let i=1;i<=N;i++){L.seed(i*3301);const p=gen({calc:'calculator'});const q=p.questionHtml;
 const fp=q.match(/\\\(\\displaystyle ([fgh])'\(([xt])\)=(.*?)\\\)<\/div>/);if(!fp){bad.push(`${p.id}: derivative not found`);continue;}
 const [,fn,v,tex]=fp;const tree=A.parse(lin(tex),v),g=x=>A.value(tree,x);
 const known=q.match(new RegExp(`\\\\\\(\\\\displaystyle ${fn}\\\\left\\((.*?)\\\\right\\)=(-?\\d+)\\\\\\)`));
 for(const part of p.parts){const pr=part.prompt;let want,kind;
  const chg=pr.match(/from \\\([xt]=(.*?)\\\) to \\\([xt]=(.*?)\\\)/);
  const at=pr.match(new RegExp(`Find \\\\\\(${fn}\\\\left\\((.*?)\\\\right\\)\\\\\\)`));
  if(/change in/.test(pr)&&chg){want=simpson(g,num(chg[1]),num(chg[2]));kind='net change';}
  else if(at&&known){const x0=num(known[1]),y0=+known[2],x=num(at[1]);want=y0+simpson(g,x0,x);kind=p.unit5Meta.family;}
  else{bad.push(`${p.id}: part not interpreted: ${pr.slice(0,80)}`);continue;}
  checked++;kinds[kind]=(kinds[kind]||0)+1;const got=part.answer.value;
  if(Math.abs(got-want)>1e-7*Math.max(1,Math.abs(want)))bad.push(`${p.id} [${kind}]: engine ${got} independent ${want}`);
  else if(C.fix(got,3)!==C.fix(want,3))bad.push(`${p.id} [${kind}]: rounds to ${C.fix(got,3)} but the independent value rounds to ${C.fix(want,3)}`);
  if(part.answerTex!==C.fix(got,3))bad.push(`${p.id}: shown answer ${part.answerTex} is not the rounded value ${C.fix(got,3)}`);}}
console.log(`problems ${N}; parts checked independently ${checked}; disagreements ${bad.length}`);console.log(JSON.stringify(kinds));
console.log(bad.slice(0,15).join('\n'));process.exitCode=bad.length?1:0;
