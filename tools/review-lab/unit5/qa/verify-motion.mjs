// Independent check of the Motion engine. From the question as displayed it re-parses v(t) (or a(t) with v(0) and
// s(0)), the time interval and the given position, then recomputes each part with its own numerics: zeros of v by
// dense sampling and bisection (touching zeros by refining minima of |v|), displacement and total distance by
// adaptive Simpson on v and |v|, direction and speed intervals from the signs of v and v·a, positions by
// integrating from the given value. Parts it cannot interpret are counted, not guessed.
// Usage: node tools/review-lab/unit5/qa/verify-motion.mjs [N] [practice type] [calculator / non-calculator]
import {load,keypadForm} from './lib.mjs';
const N=+(process.argv[2]||2000);const L=load(['unit5-motion.js']),gen=L.G.get('motion-problems'),A=L.A;
const lin=t=>keypadForm(String(t).replace(/\{,\}/g,'').replace(/\\lt|\\gt/g,''));
const fn=tex=>{const tree=A.parse(lin(tex),'t');return t=>A.value(tree,t);};
const numOf=tex=>{const tree=A.parse(lin(tex),null);return A.value(tree,0);};
const simpson=(f,a,b)=>{const S=(a,b,fa,fm,fb)=>(b-a)/6*(fa+4*fm+fb);const rec=(a,b,fa,fm,fb,w,eps,d)=>{const m=(a+b)/2,l1=(a+m)/2,r1=(m+b)/2,fl=f(l1),fr=f(r1),l=S(a,m,fa,fl,fm),r=S(m,b,fm,fr,fb);if(!Number.isFinite(l+r))return NaN;if(d>40||Math.abs(l+r-w)<=15*eps)return l+r+(l+r-w)/15;return rec(a,m,fa,fl,fm,l,eps/2,d+1)+rec(m,b,fm,fr,fb,r,eps/2,d+1);};
 if(a===b)return 0;const n=32,h=(b-a)/n;let s=0;for(let i=0;i<n;i++){const x=a+i*h,y=x+h,fx=f(x),fy=f(y),fm=f((x+y)/2);s+=rec(x,y,fx,fm,fy,S(x,y,fx,fm,fy),1e-11,0);}return s;};
function zeros(v,a,b){const n=20000,out=[];let px=a,pv=v(a);for(let k=1;k<=n;k++){const x=a+(b-a)*k/n,y=v(x);
  if(pv===0&&k>1)out.push(px);else if(pv*y<0){let lo=px,hi=x,fl=pv;for(let i=0;i<80;i++){const m=(lo+hi)/2,fm=v(m);if(fl*fm<=0)hi=m;else{lo=m;fl=fm;}}out.push((lo+hi)/2);}px=x;pv=y;}
 // touching zeros: a local minimum of |v| that refines to 0
 for(let k=1;k<n;k++){const x0=a+(b-a)*(k-1)/n,x1=a+(b-a)*k/n,x2=a+(b-a)*(k+1)/n,y0=Math.abs(v(x0)),y1=Math.abs(v(x1)),y2=Math.abs(v(x2));
  if(y1<=y0&&y1<=y2&&Math.sign(v(x0))===Math.sign(v(x2))&&y1<1e-3){let lo=x0,hi=x2;for(let i=0;i<100;i++){const m1=lo+(hi-lo)/3,m2=hi-(hi-lo)/3;if(Math.abs(v(m1))<Math.abs(v(m2)))hi=m2;else lo=m1;}const z=(lo+hi)/2;if(Math.abs(v(z))<1e-9&&!out.some(o=>Math.abs(o-z)<1e-6))out.push(z);}}
 return out.filter(z=>z>a+1e-9&&z<b-1e-9).sort((p,q)=>p-q);}
const deriv=(f,t)=>{const h=1e-4;return(f(t-2*h)-8*f(t-h)+8*f(t+h)-f(t+2*h))/(12*h);};
function signIntervals(g,a,b,zs){const pts=[a,...zs,b],out=[];for(let i=0;i<pts.length-1;i++)if(g((pts[i]+pts[i+1])/2)>0)out.push([pts[i],pts[i+1]]);
 for(let i=out.length-1;i>0;i--)if(Math.abs(out[i][0]-out[i-1][1])<1e-9){out[i-1][1]=out[i][1];out.splice(i,1);}return out;}
let checked=0,skipped=0;const bad=[],skipKinds={};
const close=(x,y,tol)=>Math.abs(x-y)<=tol;
const MODE=process.argv[3]||undefined,CALC=process.argv[4]||undefined; // optional Practice Type and calculator mode
for(let i=1;i<=N;i++){L.seed(i*5153);const p=gen({mode:MODE,calc:CALC});const q=p.questionHtml;
 const mv=q.match(/\\\(v\(t\)=(.*?)\\\)/),ma=q.match(/\\\(a\(t\)=(.*?)\\\)/);
 const dom=q.match(/\\\(([-\d.]+)\\le t\\le ([-\d.]+)\\\)/)||q.match(/\\\(([-\d.]+)\\lt t\\lt ([-\d.]+)\\\)/);
 let v=null,a=null,s=null,T0=0,T1=null;
 if(dom){T0=+dom[1];T1=+dom[2];}else if(/\\\(t\\ge 0\\\)/.test(q)){T0=0;T1=60;}
 const val=x=>numOf(x);
 // a position given at some time: s(c)=S or x(c)=S, or "position at t=c is S"
 const posAt=q.match(/\\\((?:x|s)\(([^)]*)\)=(-?[\d.]+)\\\)/);
 if(mv){v=fn(mv[1]);a=t=>deriv(v,t);
  if(posAt){const c=val(posAt[1]),S=+posAt[2];s=t=>S+simpson(v,c,t);}}
 else if(ma){const af=fn(ma[1]);a=af;
  const v0=null;
  const vAt=q.match(/[Vv]elocity at \\\(t=(.*?)\\\) is \\\((-?[\d.]+)\\\)/)||q.match(/At \\\(t=(.*?)\\\) its velocity is \\\((-?[\d.]+)\\\)/)||(m=>m&&[m[0],m[1],m[2]])(q.match(/\\\(v\(([^)]*)\)=(-?[\d.]+)\\\)/));
  const sAt=q.match(/position at \\\(t=(.*?)\\\) is \\\((-?[\d.]+)\\\)/);
  const two=q.match(/position is \\\((-?[\d.]+)\\\) at \\\(t=(.*?)\\\) and \\\((-?[\d.]+)\\\) at \\\(t=(.*?)\\\)/);
  // v and s from a(t) with single integrals only: v(t) = V + ∫_c^t a, and
  // s(t) = S + V(t - c2) + t·A1(t) - c2·A1(c2) - ∫_{c2}^t u·a(u) du with A1(u) = ∫_c^u a  (integration by parts)
  const fromA=(c,V,c2,S)=>{const A1=u=>simpson(af,c,u);v=t=>V+A1(t);if(c2!==null)s=t=>S+V*(t-c2)+t*A1(t)-c2*A1(c2)-simpson(u=>u*af(u),c2,t);};
  const pos=posAt?[val(posAt[1]),+posAt[2]]:sAt?[val(sAt[1]),+sAt[2]]:null;
  if(v0)fromA(0,+v0[1],pos?pos[0]:null,pos?pos[1]:null);
  else if(vAt)fromA(val(vAt[1]),+vAt[2],pos?pos[0]:null,pos?pos[1]:null);
  else if(two){ // positions at two times: s(t) = S1 + v1 (t - t1) + ∫_{t1}^t (t - w) a(w) dw, v1 from the second position
   const S1=+two[1],t1=val(two[2]),S2=+two[3],t2=val(two[4]);const G=t=>simpson(w=>(t-w)*af(w),t1,t);const v1=(S2-S1-G(t2))/(t2-t1);
   v=t=>v1+simpson(af,t1,t);s=t=>S1+v1*(t-t1)+G(t);}}
 for(const part of p.parts){const pr=part.prompt.replace(/\\\(|\\\)/g,''),ans=part.answer;let want=null,kind=null;
  const tRaw=(pr.match(/at t=(.+?)(?:\? |\?$|\. |\.$|$)/)||[])[1],tAt=tRaw===undefined?undefined:numOf(tRaw);
  const range=pr.match(/from t=([-\d.]+) to t=([-\d.]+)/);
  const pd=pr.match(/for ([-\d.]+)\\lt t\\lt ([-\d.]+)/);if(pd){T0=+pd[1];T1=+pd[2];}
  if(!v){kind='no v';}
  else if(/total distance/.test(pr)&&range){const [x,y]=[+range[1],+range[2]];want=simpson(t=>Math.abs(v(t)),x,y);kind='distance';}
  else if(/displacement/.test(pr)&&range){const [x,y]=[+range[1],+range[2]];want=simpson(v,x,y);kind='displacement';}
  else if(/at rest/.test(pr)&&T1!==null){want=zeros(v,T0,T1);kind='rest';}
  else if(/change direction/.test(pr)&&T1!==null){want=zeros(v,T0,T1).filter(z=>Math.sign(v(z-1e-4))!==Math.sign(v(z+1e-4)));kind='direction change';}
  else if(/moving to the (right|left)/.test(pr)&&T1!==null){const sg=/right/.test(pr)?1:-1;want=signIntervals(t=>sg*v(t),T0,T1,zeros(v,T0,T1));kind='direction intervals';}
  else if(/speed of the particle increasing\?|speed .* increasing\?$/.test(pr)&&/interval/.test(pr)&&T1!==null){const zs=[...zeros(v,T0,T1),...zeros(a,T0,T1)].sort((x,y)=>x-y);want=signIntervals(t=>v(t)*a(t),T0,T1,zs);kind='speed intervals';}
  else if(/increasing or decreasing/.test(pr)&&tAt!==undefined){want=v(+tAt)*a(+tAt)>0?0:1;kind='speed choice';}
  else if(/acceleration/.test(pr)&&tAt!==undefined){want=a(+tAt);kind='acceleration';}
  else if(/Find the speed/.test(pr)&&tAt!==undefined){want=Math.abs(v(+tAt));kind='speed';}
  else if(/average velocity/.test(pr)&&range){const [x,y]=[+range[1],+range[2]];want=simpson(v,x,y)/(y-x);kind='average velocity';}
  else if(/velocity function/.test(pr)){want=v;kind='v function';}
  else if(/position function/.test(pr)&&s){want=s;kind='s function';}
  else if((/velocity/.test(pr)&&tAt!==undefined)||/^Find v\(/.test(pr)){const c=tAt!==undefined?+tAt:numOf((pr.match(/v\(([^)]*)\)/)||[])[1]);want=v(c);kind='velocity';}
  else if(s&&(/position/.test(pr)&&tAt!==undefined||/^Find s\(/.test(pr))){const c=tAt!==undefined?+tAt:numOf((pr.match(/s\(([^)]*)\)/)||[])[1]);want=s(c);kind='position';}
  else kind='unrecognized';
  if(want===null){skipped++;const k=`${p.variant}: ${kind}`;skipKinds[k]=(skipKinds[k]||0)+1;if(process.env.SHOW_SKIPS&&skipKinds[k]<=2)console.log('skip',k,'|',q.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,200),'|',pr);continue;}
  checked++;let ok=true,got='';
  if(kind==='rest'||kind==='direction change'){const vals=ans.values.map(Number);ok=vals.length===want.length&&vals.every((x,j)=>close(x,want[j],1e-6));got=JSON.stringify(vals);}
  else if(kind.endsWith('intervals')){const ps=(ans.parts||[]).map(x=>[typeof x.left==='string'?numOf(x.left):x.left,typeof x.right==='string'?numOf(x.right):x.right]);const tol=1e-6; // v12.8.X: calculator endpoints are stored unrounded
   ok=ps.length===want.length&&ps.every((x,j)=>close(x[0],want[j][0],tol)&&close(x[1],want[j][1],tol));got=JSON.stringify(ps);}
  else if(kind==='speed choice'){ok=part.correctIndex===want;got=part.correctIndex;}
  else if(kind.endsWith('function')){const f=fn(part.answerTex.replace(/^[a-z]\(t\)=/,''));ok=[0.3,1.1,2.7,4.2].every(t=>close(f(t),want(t),1e-6*Math.max(1,Math.abs(want(t)))));got=part.answerTex;}
  else{const val=ans.kind==='numeric'?ans.value:ans.kind==='exact'?(typeof ans.value==='number'?ans.value:numOf(ans.expression)):NaN;ok=close(val,want,ans.kind==='numeric'?1e-6*Math.max(1,Math.abs(want)):1e-6*Math.max(1,Math.abs(want)));got=val;
   // v12.8.X: the rounded answer students must give agrees with the independent value rounded the same way
   if(ok&&ans.places!==undefined&&L.W.BatchMathUnit5Core.fix(val,ans.places)!==L.W.BatchMathUnit5Core.fix(want,ans.places)){ok=false;got=`rounded ${L.W.BatchMathUnit5Core.fix(val,ans.places)} vs ${L.W.BatchMathUnit5Core.fix(want,ans.places)}`;}}
  if(!ok)bad.push(`${p.id} [${kind}] ${pr.slice(0,70)} | engine ${typeof got==='number'?got.toFixed?.(6):got} independent ${JSON.stringify(typeof want==='function'?'fn':want)}`);}}
console.log(`problems ${N}; parts checked independently ${checked}; parts not interpreted ${skipped}; disagreements ${bad.length}`);
console.log('not interpreted by kind:',JSON.stringify(skipKinds));console.log(bad.slice(0,15).join('\n'));process.exitCode=bad.length?1:0;
