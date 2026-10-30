// Independent check of the Rate engine: every displayed rate formula is re-parsed from its TeX, every equation of
// the form "∫…dt ± ∫…dt ≈ v" in an explanation is recomputed with composite Simpson (n = 4000, the earlier
// generator's rule), and each numeric answer must equal the final value its explanation shows.
import {load,keypadForm} from './lib.mjs';
const N=+(process.argv[2]||1500);const L=load(['unit5-rate.js']),gen=L.G.get('rate-problems'),A=L.A;
// adaptive Simpson (an integrator independent of the engine's Gauss-Legendre rule; adaptive so sqrt(t) at 0 converges)
const simpson=(f,a,b)=>{const S=(a,b,fa,fm,fb)=>(b-a)/6*(fa+4*fm+fb);const rec=(a,b,fa,fm,fb,whole,eps,d)=>{const m=(a+b)/2,lm=(a+m)/2,rm=(m+b)/2,flm=f(lm),frm=f(rm),l=S(a,m,fa,flm,fm),r=S(m,b,fm,frm,fb);if(!Number.isFinite(l+r))return NaN;if(d>40||Math.abs(l+r-whole)<=15*eps)return l+r+(l+r-whole)/15;return rec(a,m,fa,flm,fm,l,eps/2,d+1)+rec(m,b,fm,frm,fb,r,eps/2,d+1);};
 if(a===b)return 0;const n=64,h=(b-a)/n;let tot=0;for(let i=0;i<n;i++){const x=a+i*h,y=x+h,fx=f(x),fy=f(y),fm=f((x+y)/2);tot+=rec(x,y,fx,fm,fy,S(x,y,fx,fm,fy),1e-10,0);}return tot;};
const fn=tex=>{const tree=A.parse(keypadForm(tex.replace(/\{,\}/g,'')),'t');return t=>A.value(tree,t);};
const num=s=>Number(String(s).replace(/\{,\}/g,''));
const INT=/^([+-]?)\\int_\{([^}]*)\}\^\{([^}]*)\}(?:([A-Z])\(t\)\\,dt|\\left\((.*)\\right\)dt)$/;
let ints=0,eqs=0,bad=[],answers=0;
for(let i=1;i<=N;i++){L.seed(i*7331);const p=gen({});
 const F={};for(const m of p.questionHtml.matchAll(/\\displaystyle ([A-Z])\(t\)=(.*?)\\\)<\/div>/g))F[m[1]]=m[2];
 for(const part of p.parts){const ex=part.explanation;const lines=[...ex.matchAll(/\\\(\\displaystyle (.*?)\\\)<\/div>/g)].map(m=>m[1]);
  for(const line of lines){const seg=line.split('\\approx ');if(seg.length<2)continue;const lhs=seg[0].trim();if(!lhs.includes('\\int'))continue;
   const terms=lhs.split(/(?=[+-]\\int)/);let sum=0,ok=true,tolExtra=0;
   for(const t of terms){const m=t.match(INT);if(!m){ok=false;break;}const a=num(m[2]),b=num(m[3]);const tex=m[4]?F[m[4]]:m[5];if(!tex){ok=false;break;}
    let f;try{f=fn(tex);}catch(e){bad.push(`${p.id}: cannot parse ${tex}`);ok=false;break;}
    const v=simpson(f,a,b);sum+=(m[1]==='-'?-1:1)*v;ints++;
    for(const e of [m[2],m[3]])if(/\.\d{3}$/.test(e))tolExtra+=Math.abs(f(num(e)))*0.0005; // a rounded root as a limit
   }
   if(!ok)continue;eqs++;const shown=num(seg[seg.length-1]);if(Math.abs(sum-shown)>0.0011+tolExtra)bad.push(`${p.id}: ${lhs.slice(0,60)} Simpson ${sum.toFixed(4)} shown ${shown}`);}
  // amounts at candidate times: A(t) = A0 + ∫0^t (inflow - outflow), recomputed from the displayed formulas
  const A0m=p.questionHtml.match(/contains ([\d,]+) /),names=Object.keys(F);
  if(A0m&&names.length===2)for(const line of lines){const m=line.match(/^A\(([\d.{},]+)\)\\approx (-?[\d{},.]+)$/);if(!m)continue;const t=num(m[1]),fi=fn(F[names[0]]),fo=fn(F[names[1]]);
   const v=num(A0m[1].replace(/,/g,''))+simpson(x=>fi(x)-fo(x),0,t);eqs++;if(Math.abs(v-num(m[2]))>0.0011+Math.abs(fi(t)-fo(t))*0.0005)bad.push(`${p.id}: candidate A(${t}) ${v.toFixed(4)} shown ${m[2]}`);}
  // instantaneous rates: A'(c) = in(c) - out(c), and the derivative of a rate, recomputed from the displayed formulas
  for(const line of lines){let m=line.match(/^A'\((\d+)\)(?:=[A-Z]\(\d+\)-[A-Z]\(\d+\))?\\approx (-?[\d{},.]+)-(-?[\d{},.]+)\\approx (-?[\d{},.]+)$/);
   if(m&&names.length===2){const c=num(m[1]),a=fn(F[names[0]])(c),b=fn(F[names[1]])(c);eqs++;if(Math.abs(a-num(m[2]))>6e-4||Math.abs(b-num(m[3]))>6e-4||Math.abs(a-b-num(m[4]))>1.1e-3)bad.push(`${p.id}: A'(${c}) ${a-b} vs ${m[4]}`);}
   m=line.match(/^([A-Z])'\((\d+)\)\\approx (-?[\d{},.]+)$/);if(m&&F[m[1]]){const f=fn(F[m[1]]),c=num(m[2]),h=1e-4,d=(f(c-2*h)-8*f(c-h)+8*f(c+h)-f(c+2*h))/(12*h);eqs++;if(Math.abs(d-num(m[3]))>1.1e-3)bad.push(`${p.id}: ${m[1]}'(${c}) ${d} vs ${m[3]}`);}}
  if(part.answer?.kind==='numeric'&&!/At what time|greatest amount/.test(part.prompt)){answers++;const last=lines[lines.length-1]||'';const v=num((last.match(/(?:=|\\approx )\s*(-?[\d{},.]+)$/)||[])[1]);
   if(!(Math.abs(v-part.answer.value)<=0.0011))bad.push(`${p.id}: answer ${part.answer.value} vs explanation ${v} (${last.slice(-50)})`);}
 }}
console.log('problems',N,'integral terms rechecked',ints,'equations',eqs,'numeric answers matched to explanation',answers,'issues',bad.length);console.log(bad.slice(0,12).join('\n'));
