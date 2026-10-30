// v12.8.X check of the Separable "Solve for y" steps: every displayed chain U = E1 = E2 = … (for example
// |y| = e^{3x + ln 6} = e^{3x}·e^{ln 6} = 6e^{3x}) is evaluated at points of the interval of validity with y taken
// from the particular solution; every member must agree, so an exponent law, a dropped absolute value or a wrong
// branch shows up as a mismatch. Lines listing both branches ("U = … or U = −…") must contain the true branch.
// Usage: node tools/review-lab/unit5/qa/verify-sep-exp.mjs [N]
import {load,keypadForm} from './lib.mjs';
const N=+(process.argv[2]||2000);const L=load(['unit5-separable.js']),gen=L.G.get('separable-differential-equations'),A=L.A;
const varOf=p=>p.parts[0].answer.variable==='theta'?'θ':p.parts[0].answer.variable;
// the dependent variable (y, u, r, …) becomes the checker's constant slot C; \ln \frac{a}{b} means \ln(a/b)
const lnFrac=t=>{let out=t,i;while((i=out.indexOf('\\ln \\frac'))>=0){let j=i+9,d=0,n=0;for(;j<out.length;j++){if(out[j]==='{')d++;else if(out[j]==='}'&&--d===0&&++n===2){j++;break;}}out=out.slice(0,i)+'\\ln\\left('+out.slice(i+4,j)+'\\right)'+out.slice(j);}return out;};
let DEP='y';
const ev=(tex,v,x,y)=>{const lin=keypadForm(lnFrac(tex.replace(/\\text\{[^}]*\}/g,'').replace(/\\(sin|cos|tan) ([a-zθ])(?![a-z])/g,'\\$1\\left($2\\right)'))).replace(new RegExp(`(?<![a-z])${DEP}(?![a-z])`,'g'),'C');const tree=A.parse(lin,v==='θ'?'theta':v);return A.value(tree,x,y);};
const splitTop=t=>{const out=[];let d=0,st=0;for(let i=0;i<t.length;i++){const c=t[i];if(c==='{'||c==='(')d++;else if(c==='}'||c===')')d--;else if(c==='='&&d===0){out.push(t.slice(st,i));st=i+1;}}out.push(t.slice(st));return out;};
let chains=0,branchLines=0,probs=0;const bad=[];const seen={};
for(let i=1;i<=N;i++){L.seed(i*2741);const p=gen({});const a=p.parts[0],ans=a.answer,v=varOf(p);
 DEP=(a.prefix||'y=').replace(/=$/,'');const html=a.explanation,k=html.indexOf('Solve for');if(k<0)continue;const step=html.slice(k);
 const eqs=[...step.matchAll(/\\\(\\displaystyle (.*?)\\\)<\/div>/g)].map(x=>x[1]);if(!eqs.some(e=>/e\^\{/.test(e)&&/\\ln/.test(e)))continue;probs++;
 const [lo,hi]=ans.interval,x0=ans.x0;const L0=Number.isFinite(lo)?lo:x0-3,H0=Number.isFinite(hi)?hi:x0+3;
 const xs=[0.11,0.27,0.43,0.5,0.61,0.78,0.92].map(t=>L0+(H0-L0)*t);
 const sol=L.A.parse(ans.expression,'x');const y=x=>L.A.value(sol,x);
 for(const e of eqs){
  if(/\\text\{or\}|\\quad/.test(e)){ // both branches listed: one of them is the solution
   branchLines++;const [l,r]=e.split(/\\quad\\text\{or\}\\quad/);const ok=xs.every(x=>[l,r].some(side=>{const [U,B]=splitTop(side);try{return Math.abs(ev(U,v,x,y(x))-ev(B,v,x,y(x)))<1e-7*Math.max(1,Math.abs(ev(B,v,x,y(x))));}catch(_){return false;}}));
   if(!ok)bad.push(`${p.id}: neither branch of ${e.slice(0,90)} is the solution`);continue;}
  const segs=splitTop(e);if(segs.length<2)continue;chains++;seen[p.unit5Meta.family]=(seen[p.unit5Meta.family]||0)+1;
  for(const x of xs){let vals;try{vals=segs.map(sg=>ev(sg,v,x,y(x)));}catch(err){bad.push(`${p.id}: cannot read ${e.slice(0,80)} (${err.message})`);break;}
   if(vals.some(z=>!Number.isFinite(z))){bad.push(`${p.id}: undefined value in ${e.slice(0,80)} at ${x}`);break;}
   if(vals.some(z=>Math.abs(z-vals[0])>1e-7*Math.max(1,Math.abs(vals[0])))){bad.push(`${p.id}: ${e.slice(0,100)} disagrees at x=${x.toFixed(3)}: ${vals.map(z=>z.toFixed(6)).join(' / ')}`);break;}}}}
console.log(`problems with logarithmic exponentiation ${probs}; chains evaluated ${chains}; branch lines ${branchLines}; disagreements ${bad.length}`);
console.log(JSON.stringify(seen));console.log(bad.slice(0,12).join('\n'));process.exitCode=bad.length?1:0;
