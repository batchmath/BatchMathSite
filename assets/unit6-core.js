/* BatchMath v12.9.A — Unit 6 (Applications of Integration) core.
   Builds on the Unit 5 core (rationals, exact constants, engines, page registration, worked-step HTML) without
   changing it. Adds:
   - P: polynomials with rational exponents in one variable (x or y), so areas and volumes of algebraic regions are
     integrated exactly (antiderivative and value) and the worked explanation can show the expanded integrand;
   - boundary functions (fn) with TeX, keypad text and numeric values, and their combinations;
   - regions described both by vertical slices (dx: top/bottom) and horizontal slices (dy: right/left);
   - setups for area, cross sections, washers/disks and shells as lists of integral terms, each with an exact value
     when possible and always a numeric value;
   - checking a typed integral setup by its value (any correct setup is accepted, including another method or
     correctly transformed bounds), plus expressions in x or y;
   - SVG figures of regions (shaded, with the axis of rotation dashed). */
(function(){
'use strict';
const U5=window.BatchMathUnit5Core;
if(!U5){console.error('unit6-core: load unit5-core.js first');return;}
const {Q,qv,qadd,qsub,qmul,qdiv,qneg,qzero,qtex,K,E,ex,eadd,escale,etex,step,m,question}=U5;
const evalE=U5.eval;

// ---------- P: Σ c·v^e with rational c and e ----------
const ek=e=>`${e.n}/${e.d}`;
function P(terms=[]){ // terms: [{c:Q,e:Q}]
 const map=new Map();
 for(const t of terms){if(qzero(t.c))continue;const k=ek(t.e),o=map.get(k);const c=o?qadd(o.c,t.c):t.c;if(qzero(c))map.delete(k);else map.set(k,{c,e:t.e});}
 return Object.freeze([...map.values()].sort((a,b)=>qv(b.e)-qv(a.e)));
}
const pc=c=>P([{c:typeof c==='number'?Q(c):c,e:Q(0)}]);
const pm=(c,e)=>P([{c:typeof c==='number'?Q(c):c,e:typeof e==='number'?Q(e):e}]);
const pv=pm(1,1);
const padd=(a,b)=>P([...a,...b]),pneg=a=>P(a.map(t=>({c:qneg(t.c),e:t.e}))),psub=(a,b)=>padd(a,pneg(b));
const pscale=(a,q)=>P(a.map(t=>({c:qmul(t.c,typeof q==='number'?Q(q):q),e:t.e})));
function pmul(a,b){const out=[];for(const s of a)for(const t of b)out.push({c:qmul(s.c,t.c),e:qadd(s.e,t.e)});return P(out);}
function ppow(a,n){let r=pc(1);for(let i=0;i<n;i++)r=pmul(r,a);return r;}
const pzero=a=>a.length===0;
function pint(a){ // antiderivative; null when a term needs ln
 if(a.some(t=>t.e.n===-t.e.d))return null;
 return P(a.map(t=>{const e1=qadd(t.e,Q(1));return{c:qdiv(t.c,e1),e:e1};}));
}
function pval(a,x){let s=0;for(const t of a){const e=qv(t.e);s+=qv(t.c)*(t.e.d===1?x**e:(x<0?NaN:x**e));}return s;}
// exact x^(p/q) for rational x when it is rational
function iroot(n,k){if(n<0)return k%2?(r=>r===null?null:-r)(iroot(-n,k)):null;const r=Math.round(n**(1/k));for(const c of [r-1,r,r+1])if(c>=0&&c**k===n)return c;return null;}
function qpow(x,e){
 if(qzero(x))return qv(e)>0?Q(0):null;
 const rn=iroot(x.n,e.d),rd=iroot(x.d,e.d);if(rn===null||rd===null)return null;
 let b=Q(rn,rd),p=e.n;if(p<0){b=Q(b.d*Math.sign(b.n),Math.abs(b.n));p=-p;}
 let r=Q(1);for(let i=0;i<p;i++)r=qmul(r,b);return r;
}
function pvalQ(a,x){let s=Q(0);for(const t of a){const w=qpow(x,t.e);if(w===null)return null;s=qadd(s,qmul(t.c,w));}return s;}
function pdef(a,lo,hi){const F=pint(a);if(!F||!lo.q||!hi.q)return null;const A=pvalQ(F,lo.q),B=pvalQ(F,hi.q);return A&&B?qsub(B,A):null;}
// TeX and keypad text
function powTex(e,v){
 if(e.d===1)return e.n===1?v:`${v}^{${e.n}}`;
 if(e.n===1&&e.d===2)return `\\sqrt{${v}}`;
 if(e.n===1&&e.d===3)return `\\sqrt[3]{${v}}`;
 return `${v}^{\\frac{${e.n}}{${e.d}}}`;
}
function termTex(t,v,first){
 const neg=t.c.n<0,c=Q(Math.abs(t.c.n),t.c.d),sign=neg?(first?'-':' - '):(first?'':' + ');
 if(qzero(t.e))return sign+qtex(c);
 if(t.e.n<0){const den=powTex(Q(-t.e.n,t.e.d),v);return sign+`\\frac{${c.n}}{${c.d===1?'':c.d}${den}}`;}
 const body=powTex(t.e,v);
 if(c.n===1&&c.d===1)return sign+body;
 if(c.d===1)return sign+`${c.n}${body}`;
 return sign+`\\frac{${c.n===1?'':c.n}${body}}{${c.d}}`;
}
// constFirst: the constant term first (radii such as 2-x^2, 4+\sqrt{x}); otherwise descending powers
function ptex(a,v='x',constFirst=false){
 if(pzero(a))return '0';
 const ts=constFirst?[...a.filter(t=>qzero(t.e)),...a.filter(t=>!qzero(t.e))]:a;
 return ts.map((t,i)=>termTex(t,v,i===0)).join('');
}
function pkey(a,v='x'){
 if(pzero(a))return '0';
 return a.map(t=>{const c=`(${t.c.n}/${t.c.d})`;if(qzero(t.e))return c;return `${c}*${v}^(${t.e.n}/${t.e.d})`;}).join('+');
}

// ---------- functions of one variable ----------
// fn: {tex(v), key(v), f(t), P|null, simple} ; simple: TeX needs no parentheses when squared or subtracted
const simpleTex=s=>/^(?:\d+|[a-z]|\\pi)$/.test(s);
// a sum or difference at the top level (outside braces and \left( \right)) needs parentheses as a factor
function topSum(s){let d=0;for(let i=0;i<s.length;i++){const c=s[i];if(s.startsWith('\\left',i)){d++;i+=4;continue;}if(s.startsWith('\\right',i)){d--;i+=5;continue;}if(c==='{')d++;else if(c==='}')d--;else if((c==='+'||c==='-')&&d===0&&s.slice(0,i).trim())return true;}return false;}
const wrap=s=>topSum(s)||/^-/.test(s)?`\\left(${s}\\right)`:s;
function fp(a,constFirst=false){return Object.freeze({tex:v=>ptex(a,v,constFirst),key:v=>pkey(a,v),f:t=>pval(a,t),P:a,get zero(){return pzero(a);}});}
function fnc({tex,key,f,P:a=null}){return Object.freeze({tex,key,f,P:a,zero:false});}
const fconst=c=>fp(pc(c));
// d = g - h, with exact P when both are polynomial
function fsub(g,h){
 if(g.P&&h.P)return fp(psub(g.P,h.P));
 const T=v=>`${g.tex(v)}-${wrap(h.tex(v))}`;
 return fnc({tex:T,key:v=>`(${g.key(v)})-(${h.key(v)})`,f:t=>g.f(t)-h.f(t)});
}
function fmul(g,h){
 if(g.P&&h.P)return fp(pmul(g.P,h.P));
 const w=wrap;
 return fnc({tex:v=>`${w(g.tex(v))}${w(h.tex(v))}`,key:v=>`(${g.key(v)})*(${h.key(v)})`,f:t=>g.f(t)*h.f(t)});
}
const sqTex=s=>simpleTex(s)?`${s}^{2}`:`\\left(${s}\\right)^{2}`;
const parTex=wrap;

// ---------- numeric integration and roots ----------
function quad(f,a,b,eps=1e-11){
 if(a===b)return 0;if(a>b)return -quad(f,b,a,eps);
 const n=48,h=(b-a)/n;let total=0;
 const simpson=(l,r,fl,fm,fr)=>(r-l)/6*(fl+4*fm+fr);
 function rec(l,r,fl,fm,fr,whole,e,depth){
  const m=(l+r)/2,lm=(l+m)/2,rm=(m+r)/2,flm=f(lm),frm=f(rm),L=simpson(l,m,fl,flm,fm),Rr=simpson(m,r,fm,frm,fr);
  if(depth>40||Math.abs(L+Rr-whole)<=15*e)return L+Rr+(L+Rr-whole)/15;
  return rec(l,m,fl,flm,fm,L,e/2,depth+1)+rec(m,r,fm,frm,fr,Rr,e/2,depth+1);
 }
 for(let i=0;i<n;i++){const l=a+i*h,r=l+h,fl=f(l),fr=f(r),fm=f((l+r)/2);total+=rec(l,r,fl,fm,fr,simpson(l,r,fl,fm,fr),eps/n,0);}
 return total;
}
function zeros(f,a,b,n=3000){
 const out=[];let x0=a,f0=f(a);
 for(let i=1;i<=n;i++){const x1=a+(b-a)*i/n,f1=f(x1);
  if(f0===0){if(!out.length||Math.abs(out[out.length-1]-x0)>1e-9)out.push(x0);}
  else if(f0*f1<0){let l=x0,r=x1,fl=f0;for(let k=0;k<80;k++){const mid=(l+r)/2,fm=f(mid);if(fl*fm<=0)r=mid;else{l=mid;fl=fm;}}out.push((l+r)/2);}
  x0=x1;f0=f1;}
 if(f0===0&&(!out.length||Math.abs(out[out.length-1]-x0)>1e-9))out.push(x0);
 return out;
}

// ---------- bounds and integral terms ----------
// a bound: {v:number, q:Q|null, tex}
function bq(q){q=typeof q==='number'?Q(q):q;return Object.freeze({v:qv(q),q,tex:qtex(q)});}
function bn(v,tex){return Object.freeze({v,q:null,tex:tex??fixed(v,3)});}
const fixed=(v,p=3)=>U5.fix?U5.fix(v,p):(Math.round(v*10**p)/10**p).toFixed(p);
// factor: {q:Q, atom: K.pi|K.sqrt3|null}
const F1={q:Q(1),atom:null},FPI={q:Q(1),atom:K.pi},F2PI={q:Q(2),atom:K.pi};
const fval=k=>qv(k.q)*(k.atom?k.atom.val:1);
function factorTex(k){
 const q=k.q,a=k.atom?k.atom.tex:'';
 if(q.n===1&&q.d===1)return a;
 if(q.d===1)return `${q.n===-1?'-':q.n}${a}`;
 return `\\frac{${Math.abs(q.n)===1&&a?'':Math.abs(q.n)}${a}}{${q.d}}`.replace(/^/,q.n<0?'-':'');
}
// term: {k:factor, a:bound, b:bound, v:'x'|'y', g:fn (integrand), tex (integrand TeX, as written in the setup)}
function term(k,a,b,v,g,tex){return{k,a,b,v,g,tex:tex||g.tex(v)};}
function setupTex(terms){
 return terms.map((t,i)=>{const f=factorTex(t.k);return `${i?' + ':''}${f}\\int_{${t.a.tex}}^{${t.b.tex}}${parTex(t.tex)}\\,d${t.v}`;}).join('');
}
function numValue(terms){return terms.reduce((s,t)=>s+fval(t.k)*quad(t.g.f,t.a.v,t.b.v),0);}
// exact value as a Unit 5 exact constant, or null
function exactValue(terms){
 let total=null;
 for(const t of terms){if(!t.g.P)return null;const d=pdef(t.g.P,t.a,t.b);if(!d)return null;const part=ex(qmul(d,t.k.q),t.k.atom||undefined);total=total?eadd(total,part):part;}
 return total;
}
// an exact answer: {value, tex, E}
function exactAnswer(e){return{value:evalE(e),tex:etex(e),E:e};}
// work for one term: the expanded integrand, its antiderivative and the value
function evalSteps(t){
 if(!t.g.P)return null;const F=pint(t.g.P);if(!F)return null;const d=pdef(t.g.P,t.a,t.b);if(!d)return null;
 const f=factorTex(t.k);
 return{expanded:`${f}\\int_{${t.a.tex}}^{${t.b.tex}}${parTex(ptex(t.g.P,t.v))}\\,d${t.v}`,
  anti:`${f}\\left[${ptex(F,t.v)}\\right]_{${t.a.tex}}^{${t.b.tex}}`,value:etex(ex(qmul(d,t.k.q),t.k.atom||undefined))};
}

// ---------- regions ----------
// R = {xs:[{a,b,top,bot}], ys:[{a,b,right,left}], eqs:[TeX], view:{xmin,xmax,ymin,ymax}, draw:[{f|g, dom, tex}]}
function region(o){return Object.freeze({xs:o.xs||null,ys:o.ys||null,eqs:o.eqs||[],text:o.text||'',view:o.view,draw:o.draw||[],marks:o.marks||[],name:o.name||'R',data:o.data||{}});}
// area
function areaTerms(R,v){
 if(v==='x')return R.xs.map(p=>term(F1,p.a,p.b,'x',fsub(p.top,p.bot),areaTex(p.top,p.bot,'x')));
 return R.ys.map(p=>term(F1,p.a,p.b,'y',fsub(p.right,p.left),areaTex(p.right,p.left,'y')));
}
function areaTex(g,h,v){const d=fsub(g,h);if(h.zero)return g.tex(v);if(g.P&&h.P&&!h.zero)return `${g.tex(v)}-${parTex(h.tex(v))}`;return d.tex(v);}
// distance from the axis line c to a boundary g on the side where the region lies (sign s: +1 region beyond c)
function dist(g,c,s){ // distance from the line at c to the boundary g, for a region on side s (+1 beyond c, -1 before)
 if(g.P)return fp(s>0?psub(g.P,pc(Q(c))):psub(pc(Q(c)),g.P),true);
 if(c===0)return s>0?g:fsub(fconst(0),g);
 if(s>0)return fnc({tex:v=>c<0?`${g.tex(v)}+${-c}`:`${g.tex(v)}-${c}`,key:v=>`(${g.key(v)})-(${c})`,f:t=>g.f(t)-c});
 return fsub(fconst(c),g);
}
// which side of the line c a family of slices lies on: +1 (all >= c), -1 (all <= c), 0 (crosses)
function side(pieces,hi,lo,c){
 let pos=true,neg=true;
 for(const p of pieces)for(let i=0;i<=20;i++){const t=p.a.v+(p.b.v-p.a.v)*i/20,u=p[hi].f(t),w=p[lo].f(t);if(w<c-1e-9)pos=false;if(u>c+1e-9)neg=false;}
 return pos?1:neg?-1:0;
}
const isZero=g=>g.zero||(g.P&&pzero(g.P));
// washers/disks about a horizontal line y=c (dx) or a vertical line x=c (dy); null if the axis cuts the region
function washerTerms(R,axis){
 const v=axis.type==='y'?'x':'y',pieces=v==='x'?R.xs:R.ys,hi=v==='x'?'top':'right',lo=v==='x'?'bot':'left';
 if(!pieces)return null;const s=side(pieces,hi,lo,axis.c);if(!s)return null;
 return pieces.map(p=>{
  const Rf=s>0?dist(p[hi],axis.c,1):dist(p[lo],axis.c,-1),rf=s>0?dist(p[lo],axis.c,1):dist(p[hi],axis.c,-1);
  const disk=isZero(rf),g=disk?fmul(Rf,Rf):fsub(fmul(Rf,Rf),fmul(rf,rf));
  const tex=disk?sqTex(Rf.tex(v)):`${sqTex(Rf.tex(v))}-${sqTex(rf.tex(v))}`;
  return Object.assign(term(FPI,p.a,p.b,v,g,tex),{R:Rf,r:disk?null:rf});
 });
}
// shells about a vertical line x=c (dx) or a horizontal line y=c (dy)
function shellTerms(R,axis){
 const v=axis.type==='x'?'x':'y',pieces=v==='x'?R.xs:R.ys,hi=v==='x'?'top':'right',lo=v==='x'?'bot':'left';
 if(!pieces)return null;
 const lo0=Math.min(...pieces.map(p=>p.a.v)),hi0=Math.max(...pieces.map(p=>p.b.v));
 if(lo0<axis.c-1e-9&&hi0>axis.c+1e-9)return null;
 const s=lo0>=axis.c-1e-9?1:-1,rad=dist(fp(pv),axis.c,s);
 return pieces.map(p=>{const h=fsub(p[hi],p[lo]),htex=areaTex(p[hi],p[lo],v),rt=rad.tex(v);
  return Object.assign(term(F2PI,p.a,p.b,v,fmul(rad,h),`${parTex(rt)}${parTex(htex)}`),{rad,h,htex});});
}
// cross sections: shape factor applied to the side length s (top-bottom or right-left)
const SHAPES={
 square:{k:F1,sq:true,name:'squares',area:s=>sqTex(s),rule:'A square with side s has area s^{2}.'},
 semicircle_d:{k:{q:Q(1,8),atom:K.pi},sq:true,name:'semicircles whose diameter lies across the region',area:s=>`\\frac{\\pi}{8}${sqTex(s)}`,rule:'A semicircle with diameter s has radius \\frac{s}{2}, so its area is \\frac{1}{2}\\pi\\left(\\frac{s}{2}\\right)^{2}=\\frac{\\pi}{8}s^{2}.'},
 semicircle_r:{k:{q:Q(1,2),atom:K.pi},sq:true,name:'semicircles whose radius lies across the region',area:s=>`\\frac{\\pi}{2}${sqTex(s)}`,rule:'A semicircle with radius s has area \\frac{1}{2}\\pi s^{2}.'},
 quarter:{k:{q:Q(1,4),atom:K.pi},sq:true,name:'quarter circles whose radius lies across the region',area:s=>`\\frac{\\pi}{4}${sqTex(s)}`,rule:'A quarter circle with radius s has area \\frac{1}{4}\\pi s^{2}.'},
 equilateral:{k:{q:Q(1,4),atom:K.sqrt3},sq:true,name:'equilateral triangles with one side across the region',area:s=>`\\frac{\\sqrt{3}}{4}${sqTex(s)}`,rule:'An equilateral triangle with side s has height \\frac{\\sqrt{3}}{2}s, so its area is \\frac{\\sqrt{3}}{4}s^{2}.'},
 iso_leg:{k:{q:Q(1,2),atom:null},sq:true,name:'isosceles right triangles with one leg across the region',area:s=>`\\frac{1}{2}${sqTex(s)}`,rule:'An isosceles right triangle with legs s has area \\frac{1}{2}s^{2}.'},
 iso_hyp:{k:{q:Q(1,4),atom:null},sq:true,name:'isosceles right triangles with the hypotenuse across the region',area:s=>`\\frac{1}{4}${sqTex(s)}`,rule:'With hypotenuse s, each leg is \\frac{s}{\\sqrt{2}}, so the area is \\frac{1}{2}\\left(\\frac{s}{\\sqrt{2}}\\right)^{2}=\\frac{1}{4}s^{2}.'},
};
function rectShape(mult){return{k:{q:Q(mult),atom:null},sq:true,name:`rectangles whose height is ${mult===1?'equal to':`${['','','twice','three times','four times'][mult]}`} the base across the region`,area:s=>`${mult===1?'':mult}${sqTex(s)}`,rule:`The base is s and the height is ${mult===1?'s':`${mult}s`}, so the area is ${mult===1?'':mult}s^{2}.`};}
function sectionTerms(R,v,shape){
 const pieces=v==='x'?R.xs:R.ys,hi=v==='x'?'top':'right',lo=v==='x'?'bot':'left';
 return pieces.map(p=>{const s=fsub(p[hi],p[lo]),stex=areaTex(p[hi],p[lo],v);return Object.assign(term(shape.k,p.a,p.b,v,fmul(s,s),sqTex(stex)),{s,stex});});
}

// ---------- typed-answer checking ----------
const I=()=>window.BatchMathUnit4Integrals;
// read an expression in variable v ('x', 'y' or null for a number); returns {f} or {error}
function readExpr(raw,v){
 let s=String(raw??'').trim();
 if(!s)return{error:'empty'};
 s=s.replace(/\s*\*?\s*d\s*([xy])\s*$/,(m0,w)=>{return w===v?'':m0;});
 if(v==='y'){if(/(?<![a-z])x(?![a-z])/i.test(s.replace(/exp|max/g,'')))return{error:'other-variable'};s=s.replace(/y/g,'x');}
 else if(v==='x'){if(/y/.test(s))return{error:'other-variable'};}
 let tree;try{tree=I().parseInput(s,v?'x':null);}catch(e){return{error:'parse',code:e.code};}
 const f=t=>{try{const r=I().evaluate(tree,{x:t});return Number.isFinite(r)?r:NaN;}catch(_){return NaN;}};
 return{f,tree};
}
const closeRel=(a,b,r)=>Math.abs(a-b)<=r*Math.max(1,Math.abs(a),Math.abs(b));
// rows: [{coef, lower, upper, integrand, v}] as typed; spec: {value, variable?, notes?:[{value,note}], methodNote?}
function checkIntegral(rows,spec){
 const used=rows.filter(r=>[r.coef,r.lower,r.upper,r.integrand].some(t=>String(t||'').trim()));
 if(!used.length)return{valid:false,message:'Enter an integral before checking.'};
 let total=0,depends=false,vars=new Set();
 for(const [i,r] of used.entries()){
  const which=used.length>1?` in integral ${i+1}`:'';
  if(!r.v)return{valid:false,message:`Choose dx or dy${which}.`};
  if(!String(r.lower||'').trim()||!String(r.upper||'').trim())return{valid:false,message:`Enter both limits of integration${which}.`};
  if(!String(r.integrand||'').trim())return{valid:false,message:`Enter the integrand${which}.`};
  const a=readExpr(r.lower,null),b=readExpr(r.upper,null),c=String(r.coef||'').trim()?readExpr(r.coef,null):{f:()=>1};
  if(a.error||b.error)return{valid:false,message:`Each limit of integration${which} must be a number (exact forms such as \\(\\sqrt{2}\\), \\(\\pi\\) or \\(\\ln 3\\) are fine).`};
  if(c.error)return{valid:false,message:`The number in front of the integral${which} must be a constant such as \\(\\pi\\) or \\(2\\pi\\).`};
  const g=readExpr(r.integrand,r.v);
  if(g.error==='other-variable')return{valid:false,message:`With d${r.v}${which}, write the integrand in terms of ${r.v}.`};
  if(g.error)return{valid:false,message:`The integrand${which} could not be read. Check the parentheses and operations.`};
  const A=a.f(0),B=b.f(0),C=c.f(0);
  if(![A,B,C].every(Number.isFinite))return{valid:false,message:`Check the limits${which}; one of them is undefined.`};
  const probe=[0.1,0.3,0.5,0.7,0.9].map(t=>g.f(A+(B-A)*t));
  if(probe.some(z=>!Number.isFinite(z)))return{valid:true,ok:false,note:`The integrand${which} is undefined on part of its interval of integration. Check the limits and the expression.`};
  if(new Set(probe.map(z=>z.toFixed(9))).size>1)depends=true;
  vars.add(r.v);
  total+=C*quad(g.f,A,B,1e-10);
 }
 if(!depends)return{valid:true,ok:false,note:'Write the integral itself: the integrand should be an expression in x or y, not a single number.'};
 if(!Number.isFinite(total))return{valid:true,ok:false,note:'Your integral could not be evaluated. Check the limits and the expression.'};
 const T=spec.value;
 if(closeRel(total,T,2e-6)){
  if(spec.variable&&[...vars].some(w=>w!==spec.variable))return{valid:true,ok:false,note:spec.methodNote||`That integral has the right value, but this question asks for the method that integrates with respect to ${spec.variable}.`};
  return{valid:true,ok:true};
 }
 for(const w of spec.notes||[])if(Number.isFinite(w.value)&&closeRel(total,w.value,2e-6))return{valid:true,ok:false,note:w.note};
 if(closeRel(total,-T,2e-6))return{valid:true,ok:false,note:'Your integral has the opposite sign. Check the order of the limits and of the subtraction.'};
 if(closeRel(total*Math.PI,T,2e-6))return{valid:true,ok:false,note:'Your integral is missing the factor \\(\\pi\\).'};
 if(closeRel(total*2*Math.PI,T,2e-6))return{valid:true,ok:false,note:'Your integral is missing the factor \\(2\\pi\\).'};
 return{valid:true,ok:false};
}
// an expression in v that must equal spec.expr (a fn) on spec.domain [lo, hi]
function checkExpr(raw,spec){
 const g=readExpr(raw,spec.variable);
 if(g.error==='empty')return{valid:false,message:'Enter an expression before checking.'};
 if(g.error==='other-variable')return{valid:false,message:`Write this expression in terms of ${spec.variable}.`};
 if(g.error)return{valid:false,message:'That expression could not be read. Check the parentheses and operations.'};
 const [lo,hi]=spec.domain;let ok=true;
 for(let i=1;i<12;i++){const t=lo+(hi-lo)*i/12,w=spec.expr.f(t),z=g.f(t);if(!Number.isFinite(z)||!closeRel(z,w,1e-8)){ok=false;break;}}
 if(ok)return{valid:true,ok:true};
 for(const w of spec.notes||[]){let hit=true;for(let i=1;i<12;i++){const t=lo+(hi-lo)*i/12;if(!closeRel(g.f(t),w.expr.f(t),1e-8)){hit=false;break;}}if(hit)return{valid:true,ok:false,note:w.note};}
 return{valid:true,ok:false};
}

// ---------- parts ----------
const exactKeys='unit6-exact',numberKeys='unit5-number';
function exactPart(prompt,ans,explanation,extra={}){return{prompt,control:'input',answer:{kind:'exact',value:ans.value,wrongValues:extra.wrong||[]},answerTex:ans.tex,explanation,keypadMode:exactKeys,placeholder:'Exact answer',...extra.part};}
function numPart(prompt,value,explanation,extra={}){return{prompt:`${prompt} Give your answer correct to three decimal places.`,control:'input',answer:{kind:'numeric',value,places:3,wrongValues:extra.wrong||[]},answerTex:fixed(value,3),explanation,keypadMode:numberKeys,placeholder:'Decimal answer',...extra.part};}
function integralPart(prompt,terms,explanation,extra={}){
 return{prompt,control:'u6-integral',answer:{kind:'u6-integral',value:numValue(terms),variable:extra.variable||null,notes:extra.notes||[],methodNote:extra.methodNote},answerTex:setupTex(terms),explanation,maxIntegrals:extra.max||3,help:extra.help};
}
function exprPart(prompt,label,fn,v,domain,explanation,extra={}){
 return{prompt,control:'u6-expr',prefix:label,answer:{kind:'u6-expr',expr:fn,variable:v,domain,notes:extra.notes||[]},answerTex:`${label}${fn.tex(v)}`,explanation,keypadMode:'unit6-integral',placeholder:`Expression in ${v}`};
}
function choicePart(prompt,choices,correctIndex,explanation,extra={}){return{prompt,control:'choice',choices,correctIndex,answerIsText:true,answerTex:choices[correctIndex],explanation,...extra};}
function listPart(prompt,values,texs,explanation,extra={}){return{prompt,control:'input',answer:{kind:'list',values},answerTex:texs.length?texs.join(',\\ '):'\\text{None}',explanation,keypadMode:'unit6-list',placeholder:'Values separated by commas, or None',...extra};}

// ---------- problem objects ----------
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function problem({engine,family,tier,id,questionHtml,parts,calculator=false,data={}}){
 if(!U5.TIERS.includes(tier))throw Error(`tier ${tier}`);
 for(const q of parts){const a=q.answer;if(a?.kind==='numeric'&&U5.nearTie(a.value,a.places))throw Error('an answer lies on a rounding half step');
  if(a?.kind==='numeric'&&!Number.isFinite(a.value))throw Error('numeric answer is not finite');}
 const meta={unit:6,engine,family,tier,calculator:!!calculator,parts:parts.length,...data};
 return{id:`u6-${engine}-${id}-${hash(questionHtml+parts.map(x=>x.answerTex||'').join('|'))}`,variant:family,normalizedMathDisplay:true,answerType:'unit5-staged',calculatorActive:!!calculator,
  questionHtml,parts,answerTex:parts[parts.length-1].answerTex,explanation:parts.map(p=>p.explanation||'').join(''),unit5Meta:meta,unit6Meta:meta};
}

// ---------- figures ----------
// A region figure: grid, axes, the region shaded, boundary curves, optional axis of rotation (dashed) and marks.
const COLORS=['#4aa3ff','#ff6b6b','#7bd389','#f7b955','#c58cff'];
function figure(R,opt={}){
 const V=R.view,W=opt.width||360,H=Math.round(W*(V.ymax-V.ymin)/(V.xmax-V.xmin)*(opt.aspect||1));
 const hmax=Math.min(Math.max(H,180),420),sx=W/(V.xmax-V.xmin),sy=hmax/(V.ymax-V.ymin);
 const X=x=>((x-V.xmin)*sx).toFixed(1),Y=y=>((V.ymax-y)*sy).toFixed(1);
 const parts=[];
 const step0=opt.grid||((V.xmax-V.xmin)>12?2:1);
 for(let x=Math.ceil(V.xmin/step0)*step0;x<=V.xmax;x+=step0)parts.push(`<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="${hmax}" class="u6-grid"/>`);
 for(let y=Math.ceil(V.ymin/step0)*step0;y<=V.ymax;y+=step0)parts.push(`<line x1="0" y1="${Y(y)}" x2="${W}" y2="${Y(y)}" class="u6-grid"/>`);
 if(V.ymin<0&&V.ymax>0)parts.push(`<line x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}" class="u6-axis"/>`);
 if(V.xmin<0&&V.xmax>0)parts.push(`<line x1="${X(0)}" y1="0" x2="${X(0)}" y2="${hmax}" class="u6-axis"/>`);
 const lab=[];for(let x=Math.ceil(V.xmin/step0)*step0;x<=V.xmax;x+=step0)if(x!==0)lab.push(`<text x="${X(x)}" y="${Math.min(hmax-3,+Y(0)+13)}" class="u6-tick">${x}</text>`);
 for(let y=Math.ceil(V.ymin/step0)*step0;y<=V.ymax;y+=step0)if(y!==0)lab.push(`<text x="${Math.max(3,+X(0)-5)}" y="${+Y(y)+4}" class="u6-tick u6-tick-y">${y}</text>`);
 // shading
 if(R.xs&&!opt.noShade)for(const p of R.xs){const pts=[];for(let i=0;i<=60;i++){const t=p.a.v+(p.b.v-p.a.v)*i/60;pts.push(`${X(t)},${Y(p.top.f(t))}`);}for(let i=60;i>=0;i--){const t=p.a.v+(p.b.v-p.a.v)*i/60;pts.push(`${X(t)},${Y(p.bot.f(t))}`);}parts.push(`<polygon points="${pts.join(' ')}" class="u6-shade"/>`);}
 else if(R.ys&&!opt.noShade)for(const p of R.ys){const pts=[];for(let i=0;i<=60;i++){const t=p.a.v+(p.b.v-p.a.v)*i/60;pts.push(`${X(p.right.f(t))},${Y(t)}`);}for(let i=60;i>=0;i--){const t=p.a.v+(p.b.v-p.a.v)*i/60;pts.push(`${X(p.left.f(t))},${Y(t)}`);}parts.push(`<polygon points="${pts.join(' ')}" class="u6-shade"/>`);}
 // curves
 R.draw.forEach((c,i)=>{const col=COLORS[i%COLORS.length],pts=[];const [lo,hi]=c.dom||(c.g?[V.ymin,V.ymax]:[V.xmin,V.xmax]);let seg=[];
  const flush=()=>{if(seg.length>1)pts.push(`<polyline points="${seg.join(' ')}" class="u6-curve" stroke="${col}"/>`);seg=[];};
  for(let k=0;k<=240;k++){const t=lo+(hi-lo)*k/240;const xy=c.g?[c.g(t),t]:[t,c.f(t)];if(!xy.every(Number.isFinite)||xy[1]<V.ymin-0.5*(V.ymax-V.ymin)||xy[1]>V.ymax+0.5*(V.ymax-V.ymin)||xy[0]<V.xmin-1||xy[0]>V.xmax+1){flush();continue;}seg.push(`${X(xy[0])},${Y(xy[1])}`);}
  flush();parts.push(...pts);c.color=col;});
 if(opt.axis){const a=opt.axis;parts.push(a.type==='y'?`<line x1="0" y1="${Y(a.c)}" x2="${W}" y2="${Y(a.c)}" class="u6-rot"/>`:`<line x1="${X(a.c)}" y1="0" x2="${X(a.c)}" y2="${hmax}" class="u6-rot"/>`);}
 for(const mk of R.marks||[])parts.push(`<circle cx="${X(mk[0])}" cy="${Y(mk[1])}" r="3" class="u6-mark"/>`);
 const legend=R.draw.map(c=>`<span class="u6-key"><span class="u6-swatch" style="background:${c.color}"></span>\\(${c.tex}\\)</span>`).join('')+(opt.axis?`<span class="u6-key"><span class="u6-swatch u6-swatch-rot"></span>axis of rotation \\(${opt.axis.type}=${opt.axis.tex??opt.axis.c}\\)</span>`:'');
 return `<figure class="u6-figure"><svg viewBox="0 0 ${W} ${hmax}" role="img" aria-label="${opt.label||'Graph of the region'}" class="u6-svg">${parts.join('')}${lab.join('')}</svg>${legend?`<figcaption class="u6-legend">${legend}</figcaption>`:''}</figure>`;
}

// keypad profiles: exact values; expressions and integrands in x or y; lists of exact values
const fnKeys=[['sin','sin'],['cos','cos'],['tan','tan'],['sec','sec'],['tan⁻¹','atan'],['|u|','abs']];
U5.profile('unit6-exact',{fraction:true,radical:true,exponent:true,logarithm:true,constants:['pi','e'],arithmetic:true,parentheses:true});
U5.profile('unit6-integral',{fraction:true,radical:true,exponent:true,logarithm:true,constants:['pi','e'],variables:['x','y'],functions:fnKeys,arithmetic:true,parentheses:true});
U5.profile('unit6-list',{fraction:true,radical:true,constants:['pi'],arithmetic:true,parentheses:true,list:true});

window.BatchMathUnit6Core=Object.freeze({U5,Q,qv,K,E,ex,eadd,escale,etex,evalE,P,pc,pm,pv,padd,psub,pmul,pscale,ppow,pint,pval,pdef,ptex,pkey,qpow,
 fp,fnc,fconst,fsub,fmul,dist,sqTex,parTex,topSum,simpleTex,quad,zeros,bq,bn,fixed,F1,FPI,F2PI,factorTex,term,setupTex,numValue,exactValue,exactAnswer,evalSteps,
 region,areaTerms,areaTex,washerTerms,shellTerms,sectionTerms,SHAPES,rectShape,side,readExpr,checkIntegral,checkExpr,
 exactPart,numPart,integralPart,exprPart,choicePart,listPart,problem,figure,step,m,question,hash});
})();
