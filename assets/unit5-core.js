/* BatchMath v12.8.X — Unit 5 generator toolkit.
   Exact arithmetic (rationals and sums of rational multiples of constants such as √3, π, e, ln 2), term builders
   whose TeX, parser expression and JS function stay in step, numerical integration and root finding for
   calculator problems, explanation builders in the approved Unit 4 style, weighted family selection with
   difficulty tiers, and registration with the shared AP topic generator registry. */
(function(){
'use strict';
const rand=()=>window.BatchMathRNG.random(); // the site's seeded generator, so sessions are reproducible
const ri=(a,b)=>a+Math.floor(rand()*(b-a+1));
const pick=a=>a[Math.floor(rand()*a.length)];
const nz=(a,b)=>{let v=0;while(v===0)v=ri(a,b);return v;};
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
function weighted(table){let total=0;for(const w of Object.values(table))total+=w;let r=rand()*total;for(const [k,w] of Object.entries(table)){r-=w;if(r<0)return k;}return Object.keys(table).pop();}

// ---------- rationals ----------
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a||1;};
function Q(n,d=1){if(d===0)throw Error('zero denominator');if(d<0){n=-n;d=-d;}const g=gcd(n,d);return Object.freeze({n:n/g,d:d/g});}
const qv=q=>q.n/q.d;
const qadd=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d),qsub=(a,b)=>Q(a.n*b.d-b.n*a.d,a.d*b.d),qmul=(a,b)=>Q(a.n*b.n,a.d*b.d),qdiv=(a,b)=>Q(a.n*b.d,a.d*b.n),qneg=a=>Q(-a.n,a.d);
const qint=q=>q.d===1,qzero=q=>q.n===0,qone=q=>q.n===1&&q.d===1,qeq=(a,b)=>a.n===b.n&&a.d===b.d;
const asQ=v=>typeof v==='number'?Q(v):v;
function qtex(q){q=asQ(q);if(q.d===1)return String(q.n);return `${q.n<0?'-':''}\\frac{${Math.abs(q.n)}}{${q.d}}`;}
function qexpr(q){q=asQ(q);return q.d===1?(q.n<0?`(${q.n})`:String(q.n)):`(${q.n}/${q.d})`;}

// ---------- exact constants: Σ q_i · atom_i ----------
// atom: {key, tex, expr, val}; key '1' is the rational part.
const ATOMS={};
function atom(key,tex,expr,val){return ATOMS[key]||(ATOMS[key]={key,tex,expr,val});}
const ONE=atom('1','','1',1);
const K={
 one:ONE,pi:atom('pi','\\pi','pi',Math.PI),e:atom('e','e','e',Math.E),
 sqrt2:atom('sqrt2','\\sqrt{2}','sqrt(2)',Math.SQRT2),sqrt3:atom('sqrt3','\\sqrt{3}','sqrt(3)',Math.sqrt(3)),
 ln2:atom('ln2','\\ln 2','ln(2)',Math.LN2),ln3:atom('ln3','\\ln 3','ln(3)',Math.log(3)),
};
function lnAtom(n){if(n===2)return K.ln2;if(n===3)return K.ln3;return atom(`ln${n}`,`\\ln ${n}`,`ln(${n})`,Math.log(n));}
function expAtom(qk){ // e^{q}
 const tex=qint(qk)?(qk.n===1?'e':`e^{${qk.n}}`):`e^{${qtex(qk)}}`;
 return atom(`e^${qk.n}/${qk.d}`,tex,`e^(${qk.n}/${qk.d})`,Math.exp(qv(qk)));
}
function E(map={}){ // exact: Map key -> {atom,q}
 const m=new Map();for(const [k,v] of Object.entries(map))if(!qzero(asQ(v.q)))m.set(k,{atom:v.atom,q:asQ(v.q)});
 return m;
}
const ex=(q,a=ONE)=>E({[a.key]:{atom:a,q:asQ(q)}});
function eadd(...list){const m=new Map();for(const x of list)for(const [k,v] of x){const prev=m.get(k);const q=prev?qadd(prev.q,v.q):v.q;if(qzero(q))m.delete(k);else m.set(k,{atom:v.atom,q});}return m;}
const escale=(x,s)=>{s=asQ(s);const m=new Map();if(qzero(s))return m;for(const [k,v] of x)m.set(k,{atom:v.atom,q:qmul(v.q,s)});return m;};
const eneg=x=>escale(x,Q(-1));
const esub=(a,b)=>eadd(a,eneg(b));
const eval_=x=>{let s=0;for(const v of x.values())s+=qv(v.q)*v.atom.val;return s;};
const ezero=x=>x.size===0;
const erational=x=>x.size===0||(x.size===1&&x.has('1'));
function eorder(x){const order=['1','pi','sqrt2','sqrt3','e'];return [...x.values()].sort((a,b)=>{const ia=order.indexOf(a.atom.key),ib=order.indexOf(b.atom.key);return (ia<0?9:ia)-(ib<0?9:ib);});}
// TeX of a sum, rational part first unless lead='last'.
function etex(x,{lead='first'}={}){
 if(x.size===0)return '0';
 let items=eorder(x);if(lead==='last'&&x.has('1')){items=items.filter(v=>v.atom.key!=='1').concat(items.filter(v=>v.atom.key==='1'));}
 return items.map((v,i)=>termTex(v.q,v.atom.tex,i===0)).join('');
}
function eexpr(x){if(x.size===0)return '0';return [...x.values()].map(v=>`${qexpr(v.q)}*${v.atom.expr}`).join('+');}

// ---------- terms: coefficient × body ----------
// termTex(q, body, first): sign handling, 1 and -1 suppressed, fractions written in front: \frac{3}{2}x^{2}.
function termTex(q,body,first=false){
 q=asQ(q);const neg=q.n<0,a=Math.abs(q.n),d=q.d;
 let mag;
 if(!body)mag=d===1?String(a):`\\frac{${a}}{${d}}`;
 else if(a===1&&d===1)mag=body;
 else if(d===1)mag=`${a}${body}`;
 else mag=`\\frac{${a}}{${d}}${body}`;
 if(first)return (neg?'-':'')+mag;
 return (neg?' - ':' + ')+mag;
}
// A sum of {q, tex, expr, f} items plus an exact constant; returns {tex, expr, f}.
function sum(items,constant=E(),{constantFirst=false}={}){
 const live=items.filter(t=>!qzero(t.q));
 const ctex=ezero(constant)?[]:eorder(constant).map(v=>({q:v.q,tex:v.atom.tex,isConst:true}));
 const all=constantFirst?[...ctex,...live]:[...live,...ctex];
 const tex=all.length?all.map((t,i)=>termTex(t.q,t.tex,i===0)).join(''):'0';
 const exprs=live.map(t=>`${qexpr(t.q)}*(${t.expr})`);if(!ezero(constant))exprs.push(`(${eexpr(constant)})`);
 const cval=eval_(constant),fs=live.map(t=>({q:qv(t.q),f:t.f}));
 return{tex,expr:exprs.join('+')||'0',f:x=>fs.reduce((s,t)=>s+t.q*t.f(x),0)+cval};
}

// ---------- exact trig values and x-values ----------
const TRIG_CANDIDATES=(()=>{const list=[];const add=e=>{list.push(e);list.push(escale(e,Q(-1)));};
 const R2=K.sqrt2,R3=K.sqrt3;add(E());add(ex(Q(1,2)));add(ex(1));add(ex(2));add(ex(Q(1,2),R2));add(ex(1,R2));add(ex(Q(1,2),R3));add(ex(1,R3));add(ex(Q(1,3),R3));add(ex(Q(2,3),R3));
 return list;})();
// exact value of fn(qπ) for standard angles; undefined where the function is undefined; null if not standard
function trigExact(fn,qpi){
 if(![1,2,3,4,6].includes(qpi.d))return null;
 const a=qv(qpi)*Math.PI,s=Math.sin(a),c=Math.cos(a);
 const val={sin:s,cos:c,tan:s/c,sec:1/c,csc:1/s,cot:c/s}[fn];
 if(!Number.isFinite(val)||Math.abs(val)>1e6)return undefined;
 for(const cand of TRIG_CANDIDATES)if(Math.abs(eval_(cand)-val)<1e-12)return cand;
 return null;
}
function piTexQ(q){if(qzero(q))return '0';const s=q.n<0?'-':'',a=Math.abs(q.n);if(q.d===1)return `${s}${a===1?'':a}\\pi`;return `${s}\\frac{${a===1?'':a}\\pi}{${q.d}}`;}
const xRat=q=>{q=typeof q==='number'?Q(q):q;return{tex:qtex(q),val:qv(q),exact:ex(q),q};};
const xPi=q=>{q=typeof q==='number'?Q(q):q;return{tex:piTexQ(q),val:qv(q)*Math.PI,exact:qzero(q)?E():ex(q,K.pi),qpi:q};};

// ---------- polynomials with rational coefficients (ascending powers) ----------
class Poly{
 constructor(c){this.c=c.map(asQ);while(this.c.length>1&&qzero(this.c[this.c.length-1]))this.c.pop();}
 static fromRoots(lead,roots){let p=new Poly([lead]);for(const r of roots)p=p.mul(new Poly([qneg(asQ(r)),Q(1)]));return p;}
 get deg(){return this.c.length-1;}
 mul(o){const out=Array(this.c.length+o.c.length-1).fill(Q(0));this.c.forEach((a,i)=>o.c.forEach((b,j)=>{out[i+j]=qadd(out[i+j],qmul(a,b));}));return new Poly(out);}
 add(o){const n=Math.max(this.c.length,o.c.length),out=[];for(let i=0;i<n;i++)out.push(qadd(this.c[i]||Q(0),o.c[i]||Q(0)));return new Poly(out);}
 scale(s){return new Poly(this.c.map(a=>qmul(a,asQ(s))));}
 deriv(){return new Poly(this.c.length>1?this.c.slice(1).map((a,i)=>qmul(a,Q(i+1))):[Q(0)]);}
 integ(C=0){return new Poly([asQ(C),...this.c.map((a,i)=>qdiv(a,Q(i+1)))]);}
 at(x){x=asQ(x);let s=Q(0);for(let i=this.c.length-1;i>=0;i--)s=qadd(qmul(s,x),this.c[i]);return s;}
 f(x){let s=0;for(let i=this.c.length-1;i>=0;i--)s=s*x+qv(this.c[i]);return s;}
 tex(v='t'){const items=[];for(let i=this.c.length-1;i>=0;i--){const q=this.c[i];if(qzero(q))continue;items.push({q,tex:i===0?'':i===1?v:`${v}^{${i}}`});}return items.length?items.map((it,k)=>termTex(it.q,it.tex,k===0)).join(''):'0';}
 expr(){return this.c.map((q,i)=>`${qexpr(q)}*x^${i}`).join('+');}
 isZero(){return this.c.length===1&&qzero(this.c[0]);}
}
// ---------- numerics ----------
const GL=[[-0.9739065285171717,0.0666713443086881],[-0.8650633666889845,0.1494513491505806],[-0.6794095682990244,0.2190863625159820],[-0.4333953941292472,0.2692667193099963],[-0.1488743389816312,0.2955242247147529],[0.1488743389816312,0.2955242247147529],[0.4333953941292472,0.2692667193099963],[0.6794095682990244,0.2190863625159820],[0.8650633666889845,0.1494513491505806],[0.9739065285171717,0.0666713443086881]];
function glPanel(f,a,b){const m=(a+b)/2,h=(b-a)/2;let s=0;for(const [x,w] of GL)s+=w*f(m+h*x);return s*h;}
function integrate(f,a,b,{tol=1e-12,maxDepth=40}={}){
 if(a===b)return 0;if(a>b)return -integrate(f,b,a,{tol,maxDepth});
 const rec=(lo,hi,whole,depth)=>{const mid=(lo+hi)/2,l=glPanel(f,lo,mid),r=glPanel(f,mid,hi);if(depth>=maxDepth||Math.abs(l+r-whole)<=tol*Math.max(1,Math.abs(l+r)))return l+r;return rec(lo,mid,l,depth+1)+rec(mid,hi,r,depth+1);};
 const n=16,h=(b-a)/n;let s=0;for(let i=0;i<n;i++){const lo=a+i*h,hi=lo+h;s+=rec(lo,hi,glPanel(f,lo,hi),0);}
 if(!Number.isFinite(s))throw Error('integral not finite');return s;
}
// All roots of f on [a,b] by a fine sign scan and bisection; touching zeros found by a min |f| scan.
function roots(f,a,b,{steps=4000,tol=1e-12}={}){
 const out=[];let x0=a,f0=f(a);
 if(Math.abs(f0)<1e-14)out.push(a);
 for(let i=1;i<=steps;i++){
  const x1=a+(b-a)*i/steps,f1=f(x1);
  if(Math.abs(f1)<1e-14){out.push(x1);}
  else if(f0*f1<0&&Math.abs(f0)>=1e-14){let lo=x0,hi=x1,flo=f0;for(let k=0;k<200&&hi-lo>tol;k++){const m=(lo+hi)/2,fm=f(m);if(flo*fm<=0)hi=m;else{lo=m;flo=fm;}}out.push((lo+hi)/2);}
  x0=x1;f0=f1;
 }
 return out.filter((r,i)=>i===0||Math.abs(r-out[i-1])>1e-9);
}
// ---------- rounding (v12.8.X) ----------
// Correct rounding to p decimal places, half away from zero (1.2345 -> 1.235, -1.2345 -> -1.235), returned as
// the integer x·10^p. A value within floating-point noise of a half step (1e-9 of the last place plus a relative
// 1e-12) counts as exactly half, so the binary form of 1.2345 does not round it down. Generated answers never sit
// that close to a half step: problem() rejects them (nearTie), so their rounding does not depend on noise.
function roundScaled(x,p){
 const N=Math.abs(x)*10**p,fl=Math.floor(N),fr=N-fl,eps=1e-9+1e-12*N;
 const r=fr<0.5-eps?fl:fl+1;
 return x<0&&r!==0?-r:r;
}
const nearTie=(x,p)=>{const N=Math.abs(x)*10**p;return Math.abs(N-Math.floor(N)-0.5)<2e-6+1e-10*N;};
function scaledText(s,p){
 const digits=String(Math.abs(s)).padStart(p+1,'0'),int=digits.slice(0,digits.length-p),frac=digits.slice(digits.length-p);
 return `${s<0?'-':''}${int}${p?'.'+frac:''}`;
}
const fix=(x,p=3)=>scaledText(roundScaled(x,p),p);
const money=x=>fix(x,2);

// ---------- explanation and question HTML ----------
// < and > inside math become the TeX commands lt and gt, so HTML never mistakes them for tags
const safe=tex=>String(tex).replace(/</g,'\\lt ').replace(/>/g,'\\gt ');
const eq=tex=>`<div class="u4-work-equation u4-definite-equation">\\(\\displaystyle ${safe(tex)}\\)</div>`;
function step(heading,text='',...eqs){return `<div class="u4-work-step"><strong>${heading}</strong>${text?' '+text:''}${eqs.map(eq).join('')}</div>`;}
const m=tex=>`\\(${safe(tex)}\\)`;
function question({prompt,formula,formulas,context,calculator,extra=''}){
 const badge=calculator===undefined?'':`<div class="u5-calculator-badge ${calculator?'is-active':'is-inactive'}">${calculator?'Calculator active':'No calculator'}</div>`;
 const fs=(formulas||(formula?[formula]:[])).map(f=>`<div class="u4-formula">\\(\\displaystyle ${safe(f)}\\)</div>`).join('');
 return `<div class="u4-unit4-question u4-revised-question u5-question">${badge}${context?`<div class="question-prompt u5-context">${context}</div>`:''}${prompt?`<div class="question-prompt">${prompt}</div>`:''}${fs}${extra}</div>`;
}

// ---------- problem objects ----------
const TIERS=['foundational','intermediate','challenging'];
// a short content hash so that different problems never share an id (the parameters in an id do not always
// determine the problem) while the same problem always gets the same id
function hash(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}return(h>>>0).toString(36);}
// Every rounded answer (numeric values, calculator interval endpoints, rounded lists) must not sit within noise
// of a rounding half step; such a problem is regenerated (makeEngine retries) instead of graded on a coin flip.
function roundedValues(a){
 if(!a||a.places===undefined)return[];
 if(a.kind==='numeric')return[a.value];
 if(a.kind==='interval')return(a.parts||[]).flatMap(q=>[q.left,q.right]).filter(v=>typeof v==='number'&&Number.isFinite(v));
 if(a.kind==='list')return(a.values||[]).filter(v=>typeof v==='number');
 return[];
}
function problem({engine,family,tier,id,questionHtml,parts,calculator=false,data={}}){
 if(!TIERS.includes(tier))throw Error(`tier ${tier}`);
 for(const q of parts)for(const v of roundedValues(q.answer))if(nearTie(v,q.answer.places))throw Error('an answer lies on a rounding half step');
 return{id:`u5-${engine}-${id}-${hash(questionHtml+parts.map(x=>x.answerTex||'').join('|'))}`,variant:family,normalizedMathDisplay:true,answerType:'unit5-staged',calculatorActive:!!calculator,
  questionHtml,parts,answerTex:parts[parts.length-1].answerTex,explanation:parts.map(p=>p.explanation||'').join(''),
  unit5Meta:{engine,family,tier,calculator:!!calculator,parts:parts.length,...data}};
}
// A family table: {name:{weight, tiers:[...], make:(tier, calc)=>problem}}. Mixed mode follows the weights;
// a requested tier restricts to families offering it (weights renormalized among them).
// v12.8.X calculator eligibility: opts.calc is 'calculator', 'non-calculator' or absent (mixed). A family states
// which tiers offer each kind: calculator:true (every tier calculator active), calculator:false (none), or
// calc:{calculator:[tiers], noncalculator:[tiers]} for a family with both. Filtering happens before a family is
// chosen; the family is then asked for that kind (make(tier, true|false); undefined in mixed mode, where it keeps
// its own mix) and the result is checked. A request with no eligible family is an error, never a silent switch
// to all families; an unknown Practice Type (for example a retired one restored by the browser) is mixed.
const KINDS={calculator:'calculator','non-calculator':'noncalculator'};
function kindTiers(f){return f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});}
function makeEngine(engine,families){
 const known=new Set(Object.entries(families).flatMap(([k,f])=>[k,f.group].filter(Boolean)));
 function make(opts={}){
  if(opts.calc&&!KINDS[opts.calc])throw Error(`${engine}: unknown calculator mode ${opts.calc}`);
  const kind=KINDS[opts.calc]||null,flag=kind?kind==='calculator':undefined;
  let mode=opts.mode&&opts.mode!=='mixed'?opts.mode:null;
  if(mode&&!known.has(mode)){console.warn(`unit5 ${engine}: Practice Type "${mode}" is not offered; using mixed practice`);mode=null;}
  const tier=opts.tier||null;
  const tiersOf=f=>kind?kindTiers(f)[kind]:f.tiers;
  const eligible=([k,f])=>(!mode||k===mode||f.group===mode)&&tiersOf(f).length>0&&(!tier||tiersOf(f).includes(tier));
  const pool=Object.fromEntries(Object.entries(families).filter(eligible).map(([k,f])=>[k,f.weight]));
  if(opts.family&&!(opts.family in pool))throw Error(`${engine}: family ${opts.family} has no ${opts.calc||''} problems${tier?` at the ${tier} tier`:''}`);
  if(!Object.keys(pool).length)throw Error(`${engine}: no ${opts.calc?opts.calc+' ':''}problems for ${mode||'mixed practice'}${tier?` at the ${tier} tier`:''}`);
  const name=opts.family||weighted(pool);const fam=families[name];
  const t=tier||pick(tiersOf(fam));
  let last;
  for(let tries=0;tries<60;tries++){
   let p;try{p=fam.make(t,flag);}catch(e){last=e;continue;}
   if(!p)continue;
   if(flag!==undefined&&p.calculatorActive!==flag)throw Error(`${engine}/${name}: made a ${p.calculatorActive?'calculator':'non-calculator'} problem for ${opts.calc} practice`);
   return p;
  }
  throw last||Error(`${engine}/${name} failed`);
 }
 const eligibleKinds=Object.fromEntries(Object.entries(families).map(([k,f])=>[k,kindTiers(f)]));
 return{make,families,eligibleKinds,weights:Object.fromEntries(Object.entries(families).map(([k,f])=>[k,f.weight]))};
}
// The page's calculator mode (BM_TOPIC_PRACTICE.calculator) reaches every generator call unless the caller sets one.
function register(slug,gen){
 const api=window.BatchMathAPTopicGenerators;
 if(!api)throw Error('unit5-core: load ap-topic-generators.js first');
 const pageCalc=()=>window.BM_TOPIC_PRACTICE?.calculator;
 const old=api.get,wrapped=o=>{const opts={...(o||{})};if(!opts.calc&&pageCalc())opts.calc=pageCalc();const p=gen(opts);window.BatchMathUnit5Last=p;return p;};api.get=s=>s===slug?wrapped:old(s);
}

// Keypad profiles shared by the Unit 5 engines (registered once; engines add their own).
function profile(name,spec){window.BatchMathCalculusKeypad?.registerProfile?.(name,spec);}
profile('unit5-number',{decimal:true});
profile('unit5-money',{decimal:true});

window.BatchMathUnit5Core=Object.freeze({rand,ri,pick,nz,shuffle,weighted,Q,qv,qadd,qsub,qmul,qdiv,qneg,qint,qzero,qone,qeq,asQ,qtex,qexpr,gcd,
 K,atom,lnAtom,expAtom,E,ex,safe,trigExact,piTexQ,xRat,xPi,Poly,eadd,escale,eneg,esub,eval:eval_,ezero,erational,etex,eexpr,termTex,sum,integrate,roots,fix,money,eq,step,m,question,problem,
 makeEngine,register,profile,TIERS,roundScaled,nearTie,scaledText});
})();
