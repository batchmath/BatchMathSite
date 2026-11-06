/* BatchMath v12.9.C — Unit 6 (Applications of Integration) core.
   Builds on the Unit 5 core (rationals, exact constants, engines, page registration, worked-step HTML) without
   changing it. Adds:
   - P: polynomials with rational exponents in one variable (x or y), so areas and volumes of algebraic regions are
     integrated exactly (antiderivative and value) and the worked explanation can show the expanded integrand;
   - boundary functions (fn) with TeX, keypad text and numeric values, and their combinations;
   - regions described both by vertical slices (dx: top/bottom) and horizontal slices (dy: right/left);
   - setups for area, cross sections, washers/disks and shells as lists of integral terms, each with an exact value
     when possible and always a numeric value;
   - checking a typed integral setup by its structure (v12.9.B): the typed integrals must describe the same signed
     integrand in each variable as a model setup (sampled pointwise between the limits), so a different setup that
     only happens to have the same value is refused. Models are the expected setup, any alternatives the problem
     lists (the other method or variable where it applies) and halves of symmetric regions doubled; setups the
     question excludes, and common mistakes, get their own notes. Expressions in x or y are checked by value;
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
// constFirst: a positive constant term first (radii such as 2-x^2, 4+\sqrt{x}); otherwise descending powers
function ptex(a,v='x',constFirst=false){
 if(pzero(a))return '0';
 const ts=constFirst&&a.some(t=>qzero(t.e)&&t.c.n>0)?[...a.filter(t=>qzero(t.e)),...a.filter(t=>!qzero(t.e))]:a; // 2-x^2, 4+\sqrt{x}, but x-6
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
// at most QUAD_BUDGET evaluations of f: an integrand with a pole in the interval (typed by a student) gives NaN
// instead of an endless subdivision; the engines' own integrals need far fewer (QUAD_USED records the last count)
const QUAD_BUDGET=400000;let quadUsed=0;
function quad(f,a,b,eps=1e-11){
 if(a===b)return 0;if(a>b)return -quad(f,b,a,eps);
 const n=48,h=(b-a)/n;let total=0,count=0;const g=t=>{if(++count>QUAD_BUDGET)throw QUAD_BUDGET;return f(t);};
 try{total=quadRun(g,a,b,eps,n,h);}catch(e){if(e===QUAD_BUDGET){quadUsed=count;return NaN;}throw e;}
 quadUsed=count;return total;
}
function quadRun(f,a,b,eps,n,h){let total=0;
 const simpson=(l,r,fl,fm,fr)=>(r-l)/6*(fl+4*fm+fr);
 function rec(l,r,fl,fm,fr,whole,e,depth){
  const m=(l+r)/2,lm=(l+m)/2,rm=(m+r)/2,flm=f(lm),frm=f(rm),L=simpson(l,m,fl,flm,fm),Rr=simpson(m,r,fm,frm,fr);
  if(!Number.isFinite(L+Rr))return NaN; // undefined somewhere (a typed integrand outside its domain): stop, do not subdivide forever
  if(depth>40||Math.abs(L+Rr-whole)<=15*e)return L+Rr+(L+Rr-whole)/15;
  return rec(l,m,fl,flm,fm,L,e/2,depth+1)+rec(m,r,fm,frm,fr,Rr,e/2,depth+1);
 }
 for(let i=0;i<n;i++){const l=a+i*h,r=l+h,fl=f(l),fr=f(r),fm=f((l+r)/2);total+=rec(l,r,fl,fm,fr,simpson(l,r,fl,fm,fr),eps/n,0);if(!Number.isFinite(total))return NaN;}
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
 return terms.map((t,i)=>{let f=factorTex(t.k),sign=i?' + ':'';if(i&&f.startsWith('-')){sign=' - ';f=f.slice(1);} // a later integral with a negative factor: " - \\int", not " + -\\int"
  return `${sign}${f}\\int_{${t.a.tex}}^{${t.b.tex}}${parTex(t.tex)}\\,d${t.v}`;}).join('');
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
// bounds: how the limits are found (for the explanation); xb, yb: the region's x and y extent (for choosing axes)
function region(o){return Object.freeze({xs:o.xs||null,ys:o.ys||null,eqs:o.eqs||[],text:o.text||'',bounds:o.bounds||'',xb:o.xb||null,yb:o.yb||null,view:o.view,draw:o.draw||[],marks:o.marks||[],name:o.name||'R',data:o.data||{}});}
// area
function areaTerms(R,v){
 const ps=v==='x'?R.xs:R.ys,hi=v==='x'?'top':'right',lo=v==='x'?'bot':'left';
 return ps.map(p=>p.w?term(F1,p.a,p.b,v,p.w,p.w.tex(v)):term(F1,p.a,p.b,v,fsub(p[hi],p[lo]),areaTex(p[hi],p[lo],v)));
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
  // a constant height goes first (2\pi\int y\,dy, 2\pi\int 3(1+x)\,dx), never after the radius ("y1")
  const num=/^\d+(?:\.\d+)?$/.test(htex),tex=num?`${htex==='1'?'':htex}${parTex(rt)}`:`${parTex(rt)}${parTex(htex)}`;
  return Object.assign(term(F2PI,p.a,p.b,v,fmul(rad,h),tex),{rad,h,htex});});
}
// cross sections: shape factor applied to the side length s (top-bottom or right-left)
const SHAPES={
 square:{id:'square',k:F1,sq:true,name:'squares',area:s=>sqTex(s),rule:'A square with side \\(s\\) has area \\(s^{2}\\).'},
 // v12.9.D: a semicircle always stands on its slice as its DIAMETER (d = s, r = s/2, A = pi s^2/8); the former variant
 // with the radius across the region is gone. A quarter circle has the slice as a RADIUS (r = s, A = pi s^2/4).
 semicircle_d:{id:'semicircle_d',k:{q:Q(1,8),atom:K.pi},sq:true,name:'semicircles whose diameter lies across the region',area:s=>`\\frac{\\pi}{8}${sqTex(s)}`,rule:'The slice across the region is the diameter of the semicircle: \\(d=s\\). So its radius is \\(r=\\frac{s}{2}\\), and its area is \\(\\frac{1}{2}\\pi r^{2}=\\frac{1}{2}\\pi\\left(\\frac{s}{2}\\right)^{2}=\\frac{\\pi}{8}s^{2}\\).'},
 quarter:{id:'quarter',k:{q:Q(1,4),atom:K.pi},sq:true,name:'quarter circles whose radius lies across the region',area:s=>`\\frac{\\pi}{4}${sqTex(s)}`,rule:'The slice across the region is a radius of the quarter circle: \\(r=s\\). So its area is \\(\\frac{1}{4}\\pi r^{2}=\\frac{\\pi}{4}s^{2}\\).'},
 equilateral:{id:'equilateral',k:{q:Q(1,4),atom:K.sqrt3},sq:true,name:'equilateral triangles with one side across the region',area:s=>`\\frac{\\sqrt{3}}{4}${sqTex(s)}`,rule:'An equilateral triangle with side \\(s\\) has height \\(\\frac{\\sqrt{3}}{2}s\\), so its area is \\(\\frac{1}{2}s\\cdot\\frac{\\sqrt{3}}{2}s=\\frac{\\sqrt{3}}{4}s^{2}\\).'},
 iso_leg:{id:'iso_leg',k:{q:Q(1,2),atom:null},sq:true,name:'isosceles right triangles with one leg across the region',area:s=>`\\frac{1}{2}${sqTex(s)}`,rule:'An isosceles right triangle with legs \\(s\\) has area \\(\\frac{1}{2}s^{2}\\).'},
 iso_hyp:{id:'iso_hyp',k:{q:Q(1,4),atom:null},sq:true,name:'isosceles right triangles with the hypotenuse across the region',area:s=>`\\frac{1}{4}${sqTex(s)}`,rule:'With hypotenuse \\(s\\), each leg is \\(\\frac{s}{\\sqrt{2}}\\), so the area is \\(\\frac{1}{2}\\left(\\frac{s}{\\sqrt{2}}\\right)^{2}=\\frac{1}{4}s^{2}\\).'},
};
function rectShape(mult){return{id:'rect',mult,k:{q:Q(mult),atom:null},sq:true,name:`rectangles whose height is ${mult===1?'equal to':`${['','','twice','three times','four times'][mult]}`} the base across the region`,area:s=>`${mult===1?'':mult}${sqTex(s)}`,rule:`The base is \\(s\\) and the height is \\(${mult===1?'s':`${mult}s`}\\), so the area is \\(${mult===1?'':mult}s^{2}\\).`};}
function sectionTerms(R,v,shape){
 const pieces=v==='x'?R.xs:R.ys,hi=v==='x'?'top':'right',lo=v==='x'?'bot':'left';
 return pieces.map(p=>{const s=p.w||fsub(p[hi],p[lo]),stex=p.w?p.w.tex(v):areaTex(p[hi],p[lo],v);
  const g=p.s2?Object.freeze({...p.s2,tex:p.s2.tex,key:p.s2.key,f:p.s2.f}):fmul(s,s);
  return Object.assign(term(shape.k,p.a,p.b,v,g,sqTex(stex)),{s,stex});});
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
// decimal places of a limit typed as a plain decimal (0.138 -> 3), or null
const placesOf=t=>{const m=String(t??'').trim().match(/^[-−]?\d*\.(\d+)$/);return m?m[1].length:null;};
// ---------- integral setups: checked against verified models, not only by their value ----------
// A model is a list of terms {k, a, b, v, f}: k times the integral of f(v) from a to b. Two setups are the same when,
// for each variable, their signed integrands agree as functions: at t, the sum of k f(t) over the integrals whose
// interval contains t (with a minus sign when the limits are reversed). That accepts a sum split at any points, one
// integral for several, reversed limits with the opposite sign, a constant inside or outside, and any algebraically
// equivalent integrand, and rejects an integrand that only happens to give the same number.
function densityOf(terms,w){const ts=terms.filter(t=>t.v===w);
 return x=>{let s=0;for(const t of ts){const lo=Math.min(t.a,t.b),hi=Math.max(t.a,t.b);if(x>lo&&x<hi)s+=(t.b>t.a?1:-1)*t.k*t.f(x);}return s;};}
// compare two setups at sample points of every variable either one uses, away from all limits (tol: how far a typed
// rounded limit may be from the exact one); ratio: compare S with c times M instead
function sameSetup(S,M,tol=1e-9,c=1){
 const vars=new Set([...S,...M].map(t=>t.v));if(!vars.size)return false;
 for(const w of vars){
  const ends=[...S,...M].filter(t=>t.v===w).flatMap(t=>[t.a,t.b]),L=Math.min(...ends),H=Math.max(...ends),span=(H-L)||1,eps=Math.max(tol*1.01,1e-9*span);
  const ds=densityOf(S,w),dm=densityOf(M,w);let n=0;
  for(let j=0;j<67;j++){const x=L-0.03*span+1.06*span*(j+0.381966)/67;if(ends.some(e=>Math.abs(x-e)<=eps))continue;
   const a=ds(x),b=c*dm(x);if(!Number.isFinite(a)||!Number.isFinite(b))return false;if(Math.abs(a-b)>1e-7*Math.max(1,Math.abs(a),Math.abs(b)))return false;n++;}
  if(n<24)return false;
 }
 return true;
}
// a model for one variable whose integrand is symmetric about the middle of its interval may also be written as twice
// the integral over either half
function symmetricForms(M){
 const vs=[...new Set(M.map(t=>t.v))];if(vs.length!==1)return[];
 const w=vs[0],L=Math.min(...M.flatMap(t=>[t.a,t.b])),H=Math.max(...M.flatMap(t=>[t.a,t.b])),c=(L+H)/2,d=densityOf(M,w);
 for(let j=1;j<12;j++){const u=(H-c)*j/12.37,a=d(c+u),b=d(c-u);if(!Number.isFinite(a)||Math.abs(a-b)>1e-9*Math.max(1,Math.abs(a)))return[];}
 return[[{k:2,a:c,b:H,v:w,f:d}],[{k:2,a:L,b:c,v:w,f:d}]];
}
const modelOf=terms=>terms.map(t=>({k:qv(t.k.q)*(t.k.atom?t.k.atom.val:1),a:t.a.v,b:t.b.v,v:t.v,f:t.g.f}));
// rows: [{coef, lower, upper, integrand, v}] as typed; spec (integralPart): {value, variable?, models, others?, wrong?,
// methodNote?, decimals?}. models: the accepted setups (with their symmetric forms); others: correct setups by a method
// the question does not ask for (they get methodNote); wrong: common mistakes with their notes.
// decimals (calculator problems): a limit typed as a decimal with at least three places stands for a stored calculator
// value, so the integral may differ from the exact value by what that rounding can change: |coefficient times the
// integrand at the limit| times half a unit in the last place typed. Exact limits get no such allowance.
// v12.9.C: a whole integral setup typed as one expression. The MathLive field (assets/mathlive/integral-setup.mjs)
// writes it in this linear form, which can also be typed in the standard editor:
//   [coefficient*]int(lower,upper,integrand,x) ± [coefficient*]int(...) ...
// parseSetup returns the rows checkIntegral grades ({coef, lower, upper, integrand, v}, limits kept as typed so the
// decimal places of calculator limits are known), or {error} with what to fix. "?" marks a piece the field could not
// read; an empty piece is missing.
function parseSetup(raw){
 const s=String(raw??'').trim();
 if(!s)return{error:'Enter an integral before checking.'};
 if(s==='?')return{error:'Part of this entry could not be read. Use the keypad symbols, and finish every fraction, power and root.'};
 // split into terms at + and - outside parentheses (a sign right after an operator or "(" belongs to a number)
 const terms=[];let depth=0,start=0,sign='+';
 for(let i=0;i<s.length;i++){const ch=s[i];
  if(ch==='('){depth++;continue;}if(ch===')'){depth--;if(depth<0)return{error:'Check the parentheses: one closes before it opens.'};continue;}
  if(depth===0&&(ch==='+'||ch==='-')){const prev=s.slice(0,i).trimEnd().slice(-1);
   if(!prev){sign=ch==='-'?(sign==='-'?'+':'-'):sign;start=i+1;continue;}
   if('*/^,('.includes(prev))continue;
   terms.push({sign,text:s.slice(start,i)});sign=ch;start=i+1;}}
 if(depth!==0)return{error:'Check the parentheses: one is not closed.'};
 terms.push({sign,text:s.slice(start)});
 if(!/int\(/.test(s))return{error:'Write the setup as a definite integral: press ∫, enter the lower and upper limits and the integrand, then dx or dy.'};
 const rows=[];
 for(const [n,t] of terms.entries()){
  const text=t.text.trim(),which=terms.length>1?` (integral ${n+1})`:'';
  const at=text.search(/int\(/);
  if(at<0)return{error:terms.length>1?'Every term must be an integral: add integrals with + or −, and put any number in front of an integral.':'Write the setup as a definite integral: press ∫, enter the lower and upper limits and the integrand, then dx or dy.'};
  // the matching parenthesis of int( ... )
  let d=0,end=-1;for(let i=at+3;i<text.length;i++){if(text[i]==='(')d++;else if(text[i]===')'){d--;if(d===0){end=i;break;}}}
  if(end<0)return{error:`Finish the integral${which}.`};
  const after=text.slice(end+1).trim();
  if(after)return{error:`Put any number that multiplies an integral in front of it${which}, and write nothing after dx or dy except + or − and another integral.`};
  if(/int\(/.test(text.slice(at+4,end)))return{error:'Write integrals side by side with + or −, not one inside another.'};
  const args=[];d=0;let from=at+4;for(let i=at+4;i<end;i++){const ch=text[i];if(ch==='(')d++;else if(ch===')')d--;else if(ch===','&&d===0){args.push(text.slice(from,i).trim());from=i+1;}}
  args.push(text.slice(from,end).trim());
  if(args.length!==4)return{error:`Each integral needs a lower limit, an upper limit, an integrand and dx or dy${which}.`};
  const [lower,upper,integrand,dv]=args,v=dv.replace(/^d/,'');
  if(lower==='?'||upper==='?')return{error:`Finish both limits of integration${which}.`};
  if(!lower||!upper)return{error:`Enter both the lower and the upper limit${which}.`};
  if(integrand==='?')return{error:`Finish the integrand${which}: complete every fraction, power and root.`};
  if(!integrand)return{error:`Enter the integrand${which}, between the integral sign and dx or dy.`};
  if(!v)return{error:`Write dx or dy at the end of each integral${which}.`};
  if(v!=='x'&&v!=='y')return{error:`Integrate with respect to x or y: end each integral with dx or dy${which}.`};
  let coef=text.slice(0,at).trim().replace(/\*\s*$/,'').trim();
  if(coef==='?')return{error:`Finish the number in front of the integral${which}.`};
  if(t.sign==='-')coef=coef?`-(${coef})`:'-1';
  rows.push({coef,lower,upper,integrand,v});
 }
 return{rows};
}
function checkIntegral(rows,spec){
 const used=rows.filter(r=>[r.coef,r.lower,r.upper,r.integrand].some(t=>String(t||'').trim()));
 if(!used.length)return{valid:false,message:'Enter an integral before checking.'};
 let total=0,depends=false,vars=new Set(),slack=0,coarse=false,tol=1e-9;const S=[];
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
  if(new Set(probe.map(z=>z.toFixed(9))).size>1||new RegExp(`(?<![a-z])${r.v}(?![a-z])`).test(String(r.integrand).replace(/exp|max/g,''))
   ||(spec.constLimits||[]).some(([p,q])=>Math.abs(p-A)<1e-9&&Math.abs(q-B)<1e-9))depends=true;
  vars.add(r.v);S.push({k:C,a:A,b:B,v:r.v,f:g.f});
  total+=C*quad(g.f,A,B,1e-10);
  if(spec.decimals)for(const [txt,at,inward] of [[r.lower,A,B],[r.upper,B,A]]){const pl=placesOf(txt);if(pl===null)continue;if(pl<3){coarse=true;continue;}
   tol=Math.max(tol,0.6*10**-pl);let y=g.f(at);if(!Number.isFinite(y))y=g.f(at+(inward-at)*1e-6);if(Number.isFinite(y))slack+=Math.abs(C*y)*0.6*10**-pl;}
 }
 if(!Number.isFinite(total))return{valid:true,ok:false,note:'Your integral could not be evaluated. Check the limits and the expression.'};
 const T=spec.value,valueOk=closeRel(total,T,2e-6)||Math.abs(total-T)<=slack;
 if(spec.models){
  const match=list=>(list||[]).find(M=>sameSetup(S,M,tol));
  if(valueOk&&match(spec.models)){
   if(spec.variable&&[...vars].some(w=>w!==spec.variable))return{valid:true,ok:false,note:spec.methodNote||`That integral is correct, but this question asks you to integrate with respect to ${spec.variable}.`};
   return{valid:true,ok:true};
  }
  const other=(spec.others||[]).find(o=>sameSetup(S,o.terms,tol));
  if(other&&valueOk)return{valid:true,ok:false,note:other.note||spec.methodNote||'That integral is correct, but it is not the method this question asks for.'};
  for(const w of spec.wrong||[])if(sameSetup(S,w.terms,tol))return{valid:true,ok:false,note:w.note};
  const ratioOf=c=>spec.models.some(M=>sameSetup(S,M,tol,c));
  if(ratioOf(-1))return{valid:true,ok:false,note:'Your integral has the opposite sign. Check the order of the limits and of the subtraction.'};
  if(ratioOf(1/Math.PI))return{valid:true,ok:false,note:'Your integral is missing the factor \\(\\pi\\).'};
  if(ratioOf(1/(2*Math.PI)))return{valid:true,ok:false,note:'Your integral is missing the factor \\(2\\pi\\).'};
  if(!depends)return{valid:true,ok:false,note:'Write the integral itself: the integrand should be an expression in x or y, not a single number.'};
  if(valueOk)return{valid:true,ok:false,note:'Your integral has the right value, but it is not a setup for this region: check the integrand (the boundary difference, radius or height) and the limits.'};
  if(coarse&&closeRel(total,T,2e-2))return{valid:true,ok:false,note:'Close, but your limits were rounded too much. Do not round intermediate values: keep calculator intersections at full precision.'};
  return{valid:true,ok:false};
 }
 // a spec without models (none are built that way since v12.9.B): graded by value only
 if(!depends)return{valid:true,ok:false,note:'Write the integral itself: the integrand should be an expression in x or y, not a single number.'};
 if(valueOk){
  if(spec.variable&&[...vars].some(w=>w!==spec.variable))return{valid:true,ok:false,note:spec.methodNote||`That integral has the right value, but this question asks for the method that integrates with respect to ${spec.variable}.`};
  return{valid:true,ok:true};
 }
 for(const w of spec.notes||[])if(Number.isFinite(w.value)&&closeRel(total,w.value,2e-6))return{valid:true,ok:false,note:w.note};
 if(closeRel(total,-T,2e-6))return{valid:true,ok:false,note:'Your integral has the opposite sign. Check the order of the limits and of the subtraction.'};
 if(closeRel(total*Math.PI,T,2e-6))return{valid:true,ok:false,note:'Your integral is missing the factor \\(\\pi\\).'};
 if(closeRel(total*2*Math.PI,T,2e-6))return{valid:true,ok:false,note:'Your integral is missing the factor \\(2\\pi\\).'};
 if(coarse&&closeRel(total,T,2e-2))return{valid:true,ok:false,note:'Close, but your limits were rounded too much. Do not round intermediate values: keep calculator intersections at full precision.'};
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
// common wrong setups (a width or a radius not squared, (R - r)^2 for a washer, a shell without its radius); a setup is
// graded by its value, so a problem where one of them has the right value too is not used (the engine draws again)
function wrongValues(terms){
 const out=[],k=t=>qv(t.k.q)*(t.k.atom?t.k.atom.val:1),sum=g=>terms.reduce((a,t)=>a+k(t)*quad(z=>g(t,z),t.a.v,t.b.v,1e-9),0);
 if(terms.every(t=>t.s))out.push(sum((t,z)=>t.s.f(z)));
 if(terms.every(t=>t.R)){out.push(sum((t,z)=>t.R.f(z)-(t.r?t.r.f(z):0)));if(terms.some(t=>t.r))out.push(sum((t,z)=>(t.R.f(z)-(t.r?t.r.f(z):0))**2));}
 if(terms.every(t=>t.rad&&t.h))out.push(sum((t,z)=>t.h.f(z)));
 return out;
}
// common mistakes as models with notes: a width or radius not squared, (R - r)^2 for a washer, a shell without its radius
function wrongModels(terms){
 const out=[],k=t=>qv(t.k.q)*(t.k.atom?t.k.atom.val:1),mk=(g,note)=>out.push({terms:terms.map(t=>({k:k(t),a:t.a.v,b:t.b.v,v:t.v,f:z=>g(t,z)})),note});
 if(terms.every(t=>t.s))mk((t,z)=>t.s.f(z),'Square the width: the area of each cross section uses the side length squared.');
 if(terms.every(t=>t.R)){if(terms.some(t=>t.r)){mk((t,z)=>(t.R.f(z)-(t.r?t.r.f(z):0))**2,'Square each radius before subtracting: use \\(R^{2}-r^{2}\\), not \\((R-r)^{2}\\).');mk((t,z)=>t.R.f(z)-(t.r?t.r.f(z):0),'Each washer has area \\(\\pi\\left(R^{2}-r^{2}\\right)\\): square both radii.');}
  else mk((t,z)=>t.R.f(z),'Each disk has area \\(\\pi R^{2}\\): square the radius.');}
 if(terms.every(t=>t.rad&&t.h))mk((t,z)=>t.h.f(z),'A shell has volume \\(2\\pi\\,r\\,h\\) times its thickness: include the radius.');
 return out;
}
// an integral setup. terms: the model that the explanation shows. extra.alt: other accepted setups (the other
// variable, the other method); extra.others: [{terms, note}] correct setups the question does not accept (a fixed
// method or variable); extra.variable: the required variable, if any.
function integralPart(prompt,terms,explanation,extra={}){
 const value=numValue(terms);
 for(const w of wrongValues(terms))if(closeRel(w,value,1e-5))throw Error('a common wrong setup has the same value');
 const models=[terms,...(extra.alt||[])].filter(Boolean).map(modelOf);
 for(const M of [...models])for(const f of symmetricForms(M))models.push(f);
 const others=(extra.others||[]).filter(o=>o&&o.terms).map(o=>({terms:modelOf(o.terms),note:o.note}));
 // rows: the model setup, one row per integral (TeX), kept for the review lab's typed-entry tests
 return{prompt,control:'u6-integral',answer:{kind:'u6-integral',value,variable:extra.variable||null,notes:extra.notes||[],methodNote:extra.methodNote,models,others,wrong:wrongModels(terms),
  rows:terms.map(t=>({coef:factorTex(t.k),lower:t.a.tex,upper:t.b.tex,integrand:t.tex,v:t.v})),
  altRows:(extra.alt||[]).filter(Boolean).map(T=>T.map(t=>({coef:factorTex(t.k),lower:t.a.tex,upper:t.b.tex,integrand:t.tex,v:t.v}))),
  otherRows:(extra.others||[]).filter(o=>o&&o.terms).map(o=>o.terms.map(t=>({coef:factorTex(t.k),lower:t.a.tex,upper:t.b.tex,integrand:t.tex,v:t.v}))),
  constLimits:terms.filter(t=>new Set([0.13,0.41,0.77].map(z=>t.g.f(t.a.v+(t.b.v-t.a.v)*z).toFixed(9))).size===1).map(t=>[t.a.v,t.b.v])},answerTex:setupTex(terms),explanation,maxIntegrals:extra.max||3,help:extra.help};
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
 if(calculator)for(const q of parts)if(q.answer?.kind==='u6-integral')q.answer.decimals=true; // stored calculator values may be typed as decimals
 const meta={unit:6,engine,family,tier,calculator:!!calculator,parts:parts.length,...data};
 return{id:`u6-${engine}-${id}-${hash(questionHtml+parts.map(x=>x.answerTex||'').join('|'))}`,variant:family,normalizedMathDisplay:true,answerType:'unit5-staged',calculatorActive:!!calculator,
  questionHtml,parts,answerTex:parts[parts.length-1].answerTex,explanation:parts.map(p=>p.explanation||'').join(''),unit5Meta:meta,unit6Meta:meta};
}

// ---------- figures ----------
// A region figure: grid, axes, the region shaded, boundary curves, optional axis of rotation (dashed) and marks.
const COLORS=['#4aa3ff','#ff6b6b','#7bd389','#f7b955','#c58cff'];
// v12.9.C: the extent of a region's shaded pieces: each boundary is sampled on its piece and every local extreme is
// refined (golden section), so a peak or trough between samples is not missed; marked points count too
function regionExtent(R){
 let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
 const see=(x,y)=>{if(Number.isFinite(x)&&Number.isFinite(y)){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}};
 const peak=(f,lo,hi,sgn)=>{const g=(Math.sqrt(5)-1)/2;let a=lo,b=hi;for(let k=0;k<60;k++){const c=b-g*(b-a),d=a+g*(b-a);if(sgn*f(c)>sgn*f(d))b=d;else a=c;}return (a+b)/2;};
 // one boundary u = fn(t) for t in [a, b]; at(t, u) records the point in (x, y)
 const scan=(fn,a,b,at)=>{const n=240,v=[];for(let i=0;i<=n;i++){const t=a+(b-a)*i/n,u=fn(t);v.push(u);at(t,u);}
  for(let i=1;i<n;i++){const t0=a+(b-a)*(i-1)/n,t1=a+(b-a)*(i+1)/n;
   if(v[i]>=v[i-1]&&v[i]>=v[i+1]){const t=peak(fn,t0,t1,1);at(t,fn(t));}
   if(v[i]<=v[i-1]&&v[i]<=v[i+1]){const t=peak(fn,t0,t1,-1);at(t,fn(t));}}};
 for(const p of R.xs||[]){const a=Math.min(p.a.v,p.b.v),b=Math.max(p.a.v,p.b.v);for(const fn of [p.top,p.bot])scan(fn.f,a,b,(t,u)=>see(t,u));}
 if(!R.xs)for(const p of R.ys||[]){const a=Math.min(p.a.v,p.b.v),b=Math.max(p.a.v,p.b.v);for(const fn of [p.right,p.left])scan(fn.f,a,b,(t,u)=>see(u,t));}
 for(const mk of R.marks||[])see(mk[0],mk[1]);
 return x0<=x1&&y0<=y1?{x0,x1,y0,y1}:null;
}
// a nice grid step for a span (at most about 12 lines)
const niceStep=span=>[1,2,5,10,20,50,100,200].find(t=>span/t<=12)||500;
function figure(R,opt={}){
 // v12.9.C: the frame holds every shaded piece (with its intersections and the extremes of its boundaries) with a
 // modest padding, whatever fixed view the generator gave; a view that already holds it is kept as it is. The edge
 // moves out to the next half grid step.
 let V={...R.view};
 const G=regionExtent(R);
 if(G){const fit=(lo,hi,vlo,vhi)=>{const span=Math.max(hi-lo,1e-9),pad=Math.max(0.25,0.06*span),inc=niceStep(Math.max(vhi,hi+pad)-Math.min(vlo,lo-pad))/2;
   return[Math.min(vlo,Math.floor((lo-pad)/inc)*inc),Math.max(vhi,Math.ceil((hi+pad)/inc)*inc)];};
  [V.xmin,V.xmax]=fit(G.x0,G.x1,V.xmin,V.xmax);[V.ymin,V.ymax]=fit(G.y0,G.y1,V.ymin,V.ymax);}
 // the axis of rotation is always inside the frame (with a margin), never only named in the legend
 const axes=opt.axes||(opt.axis?[opt.axis]:[]); // v12.9.B: several axes (the same region about two lines)
 for(const a of axes){const c=a.c,m=0.6;if(a.type==='y'){V.ymin=Math.min(V.ymin,Math.floor(c-m));V.ymax=Math.max(V.ymax,Math.ceil(c+m));}else{V.xmin=Math.min(V.xmin,Math.floor(c-m));V.xmax=Math.max(V.xmax,Math.ceil(c+m));}}
 // uniform: one scale for both axes (circles stay round, distances are true); a very tall or very flat frame gets extra
 // empty space on the short side instead of a distorted scale
 if(opt.uniform){const xr=V.xmax-V.xmin,yr=V.ymax-V.ymin;if(yr/xr>1.5){const e=(yr/1.5-xr)/2;V.xmin-=e;V.xmax+=e;}else if(yr/xr<0.45){const e=(0.45*xr-yr)/2;V.ymin-=e;V.ymax+=e;}}
 const W=opt.width||360,H=Math.round(W*(V.ymax-V.ymin)/(V.xmax-V.xmin)*(opt.aspect||1));
 const hmax=opt.uniform?H:Math.min(Math.max(H,180),420),sx=W/(V.xmax-V.xmin),sy=hmax/(V.ymax-V.ymin);
 const X=x=>((x-V.xmin)*sx).toFixed(1),Y=y=>((V.ymax-y)*sy).toFixed(1);
 const parts=[];
 const step0=opt.grid||((V.xmax-V.xmin)>12?2:1),ystep=Math.max(step0,[1,2,5,10,20,50,100,200].find(t=>(V.ymax-V.ymin)/t<=12)||500); // y labels at most about 12
 for(let x=Math.ceil(V.xmin/step0)*step0;x<=V.xmax;x+=step0)parts.push(`<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="${hmax}" class="u6-grid"/>`);
 for(let y=Math.ceil(V.ymin/ystep)*ystep;y<=V.ymax;y+=ystep)parts.push(`<line x1="0" y1="${Y(y)}" x2="${W}" y2="${Y(y)}" class="u6-grid"/>`);
 if(V.ymin<0&&V.ymax>0)parts.push(`<line x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}" class="u6-axis"/>`);
 if(V.xmin<0&&V.xmax>0)parts.push(`<line x1="${X(0)}" y1="0" x2="${X(0)}" y2="${hmax}" class="u6-axis"/>`);
 const lab=[],inside=(t,lo,hi)=>t>lo+0.3*step0&&t<hi-0.3*step0; // no label on the frame's edges
 // tick labels beside the axes; when an axis lies off the frame, its labels stay on the frame's nearer edge (v12.9.C)
 const xLabY=Math.min(hmax-3,Math.max(13,+Y(0)+13)),yLabX=+X(0)-5,yLabStart=yLabX<22,yLabEnd=yLabX>W-3;
 for(let x=Math.ceil(V.xmin/step0)*step0;x<=V.xmax;x+=step0)if(x!==0&&inside(x,V.xmin,V.xmax))lab.push(`<text x="${X(x)}" y="${xLabY.toFixed(1)}" class="u6-tick">${x}</text>`);
 for(let y=Math.ceil(V.ymin/ystep)*ystep;y<=V.ymax;y+=ystep)if(y!==0&&y>V.ymin+0.3*ystep&&y<V.ymax-0.3*ystep)lab.push(yLabStart?`<text x="${Math.max(4,+X(0)+5).toFixed(1)}" y="${+Y(y)+4}" class="u6-tick u6-tick-start">${y}</text>`:`<text x="${yLabEnd?W-3:yLabX}" y="${+Y(y)+4}" class="u6-tick u6-tick-y">${y}</text>`);
 // shading
 if(R.xs&&!opt.noShade)for(const p of R.xs){const pts=[];for(let i=0;i<=60;i++){const t=p.a.v+(p.b.v-p.a.v)*i/60;pts.push(`${X(t)},${Y(p.top.f(t))}`);}for(let i=60;i>=0;i--){const t=p.a.v+(p.b.v-p.a.v)*i/60;pts.push(`${X(t)},${Y(p.bot.f(t))}`);}parts.push(`<polygon points="${pts.join(' ')}" class="u6-shade"/>`);}
 else if(R.ys&&!opt.noShade)for(const p of R.ys){const pts=[];for(let i=0;i<=60;i++){const t=p.a.v+(p.b.v-p.a.v)*i/60;pts.push(`${X(p.right.f(t))},${Y(t)}`);}for(let i=60;i>=0;i--){const t=p.a.v+(p.b.v-p.a.v)*i/60;pts.push(`${X(p.left.f(t))},${Y(t)}`);}parts.push(`<polygon points="${pts.join(' ')}" class="u6-shade"/>`);}
 // curves
 R.draw.forEach((c,i)=>{const col=COLORS[i%COLORS.length],pts=[];const [lo,hi]=c.dom||(c.g?[V.ymin,V.ymax]:[V.xmin,V.xmax]);let seg=[];
  const flush=()=>{if(seg.length>1)pts.push(`<polyline points="${seg.join(' ')}" class="u6-curve" stroke="${col}"/>`);seg=[];};
  for(let k=0;k<=240;k++){const t=lo+(hi-lo)*k/240;const xy=c.g?[c.g(t),t]:[t,c.f(t)];if(!xy.every(Number.isFinite)||xy[1]<V.ymin-0.5*(V.ymax-V.ymin)||xy[1]>V.ymax+0.5*(V.ymax-V.ymin)||xy[0]<V.xmin-1||xy[0]>V.xmax+1){flush();continue;}seg.push(`${X(xy[0])},${Y(xy[1])}`);}
  flush();parts.push(...pts);c.color=col;});
 for(const a of axes)parts.push(a.type==='y'?`<line x1="0" y1="${Y(a.c)}" x2="${W}" y2="${Y(a.c)}" class="u6-rot"/>`:`<line x1="${X(a.c)}" y1="0" x2="${X(a.c)}" y2="${hmax}" class="u6-rot"/>`);
 for(const mk of R.marks||[])parts.push(`<circle cx="${X(mk[0])}" cy="${Y(mk[1])}" r="3" class="u6-mark"/>`);
 // compact: the size on screen (see below); fsz is the svg font-size that keeps text at its usual size on screen
 const cw=Math.min(opt.maxW||340,Math.round((opt.maxH||265)*W/hmax)),fsz=opt.compact?11.5*W/cw:11;
 // v12.9.B: a representative slice, opt.slice={v, at, kind, axis}, at x = at (v x: a vertical slice, bottom to top) or
 // y = at (v y: horizontal, left to right). kind cs (default): the slice a cross section stands on. disk / washer: the
 // slice perpendicular to the axis, with the radius R from the axis to the farther end and r to the nearer end.
 // shell: the slice parallel to the axis (its length is the height h) and the radius r from the axis to the slice.
 let keys=[];
 if(opt.slice){const sl=opt.slice,seg=sliceSegment(R,sl.v,sl.at),kind=sl.kind||'cs';
  if(seg){const [x1,y1,x2,y2]=seg,vert=sl.v==='x',off=0.7*fsz,big=(1.3*fsz).toFixed(1);
   const ln=(a,b,c,d,cls)=>`<line x1="${X(a)}" y1="${Y(b)}" x2="${X(c)}" y2="${Y(d)}" class="${cls}"/>`,dot=(a,b,cls='u6-slice-end')=>`<circle cx="${X(a)}" cy="${Y(b)}" r="3.2" class="${cls}"/>`;
   // a label beside the middle of a segment: right of a vertical one, above a horizontal one (or left / below)
   const lab=(a,b,c,d,t,flip=false)=>{const mx=(+X(a)+ +X(c))/2,my=(+Y(b)+ +Y(d))/2,v2=Math.abs(+X(a)-+X(c))<1;
    const x=v2?mx+(flip?-off:off):mx,y=v2?my+0.35*fsz:my+(flip?1.25*fsz:-off*0.8);return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="u6-slice-label" style="font-size:${big}px" text-anchor="${v2?(flip?'end':'start'):'middle'}">${t}</text>`;};
   if(kind==='cs'){parts.push(ln(x1,y1,x2,y2,'u6-slice'),dot(x1,y1),dot(x2,y2));keys=[['slice',sl.legend||'one slice (length \\(s\\))']];}
   else if(kind==='shell'){const c=sl.axis.c,m=vert?(y1+y2)/2:(x1+x2)/2,[ra,rb,rc,rd]=vert?[c,m,sl.at,m]:[m,c,m,sl.at];
    parts.push(ln(x1,y1,x2,y2,'u6-slice'),dot(x1,y1),dot(x2,y2),ln(ra,rb,rc,rd,'u6-radius-r'),dot(ra,rb,'u6-axis-pt'),lab(x1,y1,x2,y2,'h'),lab(ra,rb,rc,rd,'r',true));
    keys=[['slice','shell height \\(h\\)'],['r','shell radius \\(r\\)']];}
   else{const c=sl.axis.c,[ax,ay]=vert?[sl.at,c]:[c,sl.at],d=q=>vert?Math.abs(q[1]-c):Math.abs(q[0]-c),[o,i]=d([x1,y1])>=d([x2,y2])?[[x1,y1],[x2,y2]]:[[x2,y2],[x1,y1]],disk=d(i)<1e-6;
    parts.push(ln(ax,ay,o[0],o[1],'u6-slice'),dot(o[0],o[1]));
    if(disk){parts.push(dot(ax,ay,'u6-axis-pt'),lab(ax,ay,o[0],o[1],'R'));keys=[['slice','radius \\(R\\)']];}
    else{parts.push(ln(ax,ay,i[0],i[1],'u6-radius-r'),dot(i[0],i[1],'u6-radius-end'),dot(ax,ay,'u6-axis-pt'),lab(i[0],i[1],o[0],o[1],'R'),lab(ax,ay,i[0],i[1],'r',true));keys=[['slice','outer radius \\(R\\)'],['r','inner radius \\(r\\)']];}}
  }}
 const legend=R.draw.map(c=>`<span class="u6-key"><span class="u6-swatch" style="background:${c.color}"></span>\\(${c.tex}\\)</span>`).join('')
  +axes.map(a=>`<span class="u6-key"><span class="u6-swatch u6-swatch-rot"></span>${a.name||'axis of rotation'} \\(${a.type}=${a.tex??a.c}\\)</span>`).join('')
  +keys.map(([k,t])=>`<span class="u6-key"><span class="u6-swatch u6-swatch-${k}"></span>${t}</span>`).join('');
 // compact (Area Below and Between Curves): at most 340px wide and about 265px tall on screen, same drawing and
 // proportions; tick labels keep their on-screen size (the svg's font-size, inherited by the ticks) and lines their
 // width as the figure scales down
 const fig=opt.compact?`<figure class="u6-figure u6-figure-compact" style="max-width:min(100%,${cw}px)">`:'<figure class="u6-figure">';
 return `${fig}<svg viewBox="0 0 ${W} ${hmax}" role="img" aria-label="${opt.label||'Graph of the region'}" class="u6-svg"${opt.compact?` style="font-size:${fsz.toFixed(1)}px"`:''}>${parts.join('')}${lab.join('')}</svg>${legend?`<figcaption class="u6-legend">${legend}</figcaption>`:''}</figure>`;
}

// the slice of R at x = at (v x) or y = at (v y): its end points [x1, y1, x2, y2], or null outside the region
function sliceSegment(R,v,at){
 const ps=v==='x'?R.xs:R.ys,p=(ps||[]).find(q=>at>=Math.min(q.a.v,q.b.v)-1e-9&&at<=Math.max(q.a.v,q.b.v)+1e-9);if(!p)return null;
 const seg=v==='x'?[at,p.bot.f(at),at,p.top.f(at)]:[p.left.f(at),at,p.right.f(at),at];return seg.every(Number.isFinite)?seg:null;
}
// where to draw a representative slice: inside the widest piece, a little left of (below) its middle
function sliceAt(R,v){const ps=(v==='x'?R.xs:R.ys)||[];if(!ps.length)return null;const p=ps.reduce((a,b)=>Math.abs(b.b.v-b.a.v)>Math.abs(a.b.v-a.a.v)?b:a);return p.a.v+0.42*(p.b.v-p.a.v);}
// v12.9.B: one cross section standing on its slice, drawn flat (as seen looking along the axis): the slice (length s,
// highlighted like the slice on the base graph) and the shape built on it, with the shape's area formula
const CS_NAMES={square:'a square with side \\(s\\)',semicircle_d:'a semicircle with diameter \\(s\\) (radius \\(\\frac{s}{2}\\))',quarter:'a quarter circle with radius \\(s\\)',
 equilateral:'an equilateral triangle with side \\(s\\)',iso_leg:'an isosceles right triangle with leg \\(s\\)',iso_hyp:'an isosceles right triangle with hypotenuse \\(s\\)'};
function sectionPicture(shape){
 const id=shape.id,B=120,lab=(x,y,t,a='middle')=>`<text x="${x}" y="${y}" class="u6-cs-label" text-anchor="${a}">${t}</text>`;let body='',L,x0;
 const base=(a,b)=>`<line x1="${a}" y1="${B}" x2="${b}" y2="${B}" class="u6-slice"/>`;
 if(id==='square'){L=96;x0=110-L/2;body=`<rect x="${x0}" y="${B-L}" width="${L}" height="${L}" class="u6-cs-shape"/>`+base(x0,x0+L)+lab(110,B+18,'s')+lab(x0+L+8,B-L/2+5,'s','start');}
 else if(id==='rect'){const m=shape.mult;L=Math.min(120,100/m);x0=110-L/2;body=`<rect x="${x0}" y="${B-m*L}" width="${L}" height="${m*L}" class="u6-cs-shape"/>`+base(x0,x0+L)+lab(110,B+18,'s')+lab(x0+L+8,B-m*L/2+5,`${m===1?'':m}s`,'start');}
 else if(id==='semicircle_d'){L=150;x0=110-L/2;const r=L/2,a=Math.PI*0.3,ex=(110+r*Math.cos(a)).toFixed(1),ey=(B-r*Math.sin(a)).toFixed(1);
  body=`<path d="M${x0} ${B} A${r} ${r} 0 0 1 ${x0+L} ${B} Z" class="u6-cs-shape"/>`+base(x0,x0+L)+`<line x1="110" y1="${B}" x2="${ex}" y2="${ey}" class="u6-radius-r"/><circle cx="110" cy="${B}" r="3.2" class="u6-cs-center"/>`
   +lab(110,B+18,'d = s')+lab(((110+ +ex)/2+10).toFixed(1),((B+ +ey)/2+4).toFixed(1),'s/2','start');}
 else if(id==='quarter'){L=100;x0=110-L/2;body=`<path d="M${x0} ${B} L${x0+L} ${B} A${L} ${L} 0 0 0 ${x0} ${B-L} Z" class="u6-cs-shape"/>`+base(x0,x0+L)+lab(110,B+18,'s')+lab(x0-8,B-L/2+5,'s','end');}
 else if(id==='equilateral'){L=118;x0=110-L/2;const h=L*Math.sqrt(3)/2;body=`<path d="M${x0} ${B} L${x0+L} ${B} L110 ${(B-h).toFixed(1)} Z" class="u6-cs-shape"/>`+base(x0,x0+L)+lab(110,B+18,'s')+lab(x0+L/4-8,B-h/2,'s','end')+lab(x0+3*L/4+8,B-h/2,'s','start');}
 else if(id==='iso_leg'){L=98;x0=110-L/2;body=`<path d="M${x0} ${B} L${x0+L} ${B} L${x0} ${B-L} Z" class="u6-cs-shape"/><path d="M${x0} ${B-11} H${x0+11} V${B}" class="u6-cs-mark"/>`+base(x0,x0+L)+lab(110,B+18,'s')+lab(x0-8,B-L/2+5,'s','end');}
 else if(id==='iso_hyp'){L=150;x0=110-L/2;const t=110,ty=B-L/2,d=9;body=`<path d="M${x0} ${B} L${x0+L} ${B} L${t} ${ty} Z" class="u6-cs-shape"/><path d="M${t-d} ${ty+d} L${t} ${ty+2*d} L${t+d} ${ty+d}" class="u6-cs-mark"/>`+base(x0,x0+L)+lab(110,B+18,'s');}
 else return '';
 const name=id==='rect'?`a rectangle with base \\(s\\) and height \\(${shape.mult===1?'':shape.mult}s\\)`:CS_NAMES[id];
 return `<figure class="u6-figure u6-cs-figure"><svg viewBox="0 0 220 146" role="img" aria-label="One cross section: ${name.replace(/\\\(|\\\)/g,'').replace(/\\frac\{s\}\{2\}/g,'s/2')}" class="u6-cs-svg">${body}</svg><figcaption class="u6-legend"><span>One cross section: ${name}; \\(A=${shape.area('s')}\\)</span></figcaption></figure>`;
}
// v12.9.B: one disk or washer seen face on (its radii from the axis), or one cylindrical shell around its axis (radius r,
// height h); a shell about a horizontal axis lies on its side. Colors match the slice on the region graph.
function solidPicture(kind,horizontal=false){
 const lab=(x,y,t,a='middle')=>`<text x="${x}" y="${y}" class="u6-cs-label" text-anchor="${a}">${t}</text>`,pt=(x,y,c='u6-axis-pt')=>`<circle cx="${x}" cy="${y}" r="3.2" class="${c}"/>`;let body,cap;
 if(kind==='disk'){body=`<circle cx="110" cy="73" r="56" class="u6-cs-shape"/><line x1="110" y1="73" x2="166" y2="73" class="u6-slice"/>`+pt(110,73)+lab(138,66,'R');cap='One disk, face on: area \\(\\pi R^{2}\\)';}
 else if(kind==='washer'){body=`<path d="M54 73a56 56 0 1 0 112 0a56 56 0 1 0-112 0ZM84 73a26 26 0 1 0 52 0a26 26 0 1 0-52 0Z" fill-rule="evenodd" class="u6-cs-shape"/><line x1="110" y1="73" x2="155.9" y2="40.9" class="u6-slice"/><line x1="110" y1="73" x2="131.3" y2="87.9" class="u6-radius-r"/>`+pt(131.3,87.9,'u6-radius-end')+pt(110,73)+lab(126,47,'R','end')+lab(126,106,'r','end');cap='One washer, face on: area \\(\\pi\\left(R^{2}-r^{2}\\right)\\)';}
 else if(!horizontal){body=`<line x1="110" y1="6" x2="110" y2="140" class="u6-cs-axis"/><path d="M50 30V116A60 13 0 0 0 170 116V30" class="u6-cs-shape"/><path d="M50 116A60 13 0 0 1 170 116" class="u6-cs-hidden"/><ellipse cx="110" cy="30" rx="60" ry="13" class="u6-cs-shape"/><line x1="110" y1="30" x2="170" y2="30" class="u6-radius-r"/><line x1="170" y1="30" x2="170" y2="116" class="u6-slice"/>`+pt(110,30)+lab(140,22,'r')+lab(178,78,'h','start');cap='One shell: volume \\(2\\pi r h\\) times its thickness';}
 else{body=`<line x1="6" y1="73" x2="214" y2="73" class="u6-cs-axis"/><path d="M40 21H180A13 52 0 0 1 180 125H40" class="u6-cs-shape"/><path d="M180 21A13 52 0 0 0 180 125" class="u6-cs-hidden"/><ellipse cx="40" cy="73" rx="13" ry="52" class="u6-cs-shape"/><line x1="40" y1="73" x2="40" y2="21" class="u6-radius-r"/><line x1="40" y1="21" x2="180" y2="21" class="u6-slice"/>`+pt(40,73)+lab(26,50,'r','end')+lab(110,14,'h');cap='One shell, on its side: volume \\(2\\pi r h\\) times its thickness';}
 return `<figure class="u6-figure u6-cs-figure"><svg viewBox="0 0 220 146" role="img" aria-label="${cap.replace(/\\\(.*$/,'').replace(/[:,]\s*$/,'')}" class="u6-cs-svg">${body}</svg><figcaption class="u6-legend"><span>${cap}</span></figcaption></figure>`;
}
// v12.9.B: a graph the student may open in the question (closed at first): Show Graph / Hide Graph
function graphToggle(inner){return `<details class="u6-graph-toggle"><summary class="u6-graph-btn"><span class="u6-when-closed">Show Graph</span><span class="u6-when-open">Hide Graph</span></summary>${inner}</details>`;}
// a region built only from its slices (no frame or curves given): the frame around the slices and one curve per
// distinct boundary, so it can be drawn like the others
function withPicture(R){
 if(R.view&&R.draw&&R.draw.length)return R;
 let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;const draw=[],seen=new Map();
 const see=(x,y)=>{if(Number.isFinite(x)&&Number.isFinite(y)){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}};
 const curve=(fn,lo,hi,isY)=>{const tex=isY?`x=${fn.tex('y')}`:`y=${fn.tex('x')}`,d=seen.get(tex);if(d){d.dom=[Math.min(d.dom[0],lo),Math.max(d.dom[1],hi)];return;}const c=isY?{g:fn.f,tex,dom:[lo,hi]}:{f:fn.f,tex,dom:[lo,hi]};seen.set(tex,c);draw.push(c);};
 for(const p of R.xs||[]){for(let i=0;i<=40;i++){const t=p.a.v+(p.b.v-p.a.v)*i/40;see(t,p.top.f(t));see(t,p.bot.f(t));}curve(p.top,p.a.v,p.b.v,false);curve(p.bot,p.a.v,p.b.v,false);}
 if(!R.xs)for(const p of R.ys||[]){for(let i=0;i<=40;i++){const t=p.a.v+(p.b.v-p.a.v)*i/40;see(p.right.f(t),t);see(p.left.f(t),t);}curve(p.right,p.a.v,p.b.v,true);curve(p.left,p.a.v,p.b.v,true);}
 for(const c of draw){const w=c.dom[1]-c.dom[0];c.dom=[c.dom[0]-Math.max(0.4,0.15*w),c.dom[1]+Math.max(0.4,0.15*w)];}
 const view=R.view||{xmin:Math.floor(Math.min(x0,0))-1,xmax:Math.ceil(Math.max(x1,0))+1,ymin:Math.floor(Math.min(y0,0))-1,ymax:Math.ceil(Math.max(y1,0))+1};
 return region({...R,view,draw:R.draw&&R.draw.length?R.draw:draw.filter(c=>!/^[xy]=0$/.test(c.tex))});
}
// the region at the start of an explanation (when the question did not show it)
function regionStep(R,label='Region R',opt={}){return step('The region.',opt.text||'')+figure(withPicture(R),{compact:true,label,...opt});}

// keypad profiles: exact values; expressions and integrands in x or y; lists of exact values
const fnKeys=[['sin','sin'],['cos','cos'],['tan','tan'],['sec','sec'],['tan⁻¹','atan'],['|u|','abs']];
U5.profile('unit6-exact',{fraction:true,radical:true,exponent:true,logarithm:true,constants:['pi','e'],arithmetic:true,parentheses:true});
U5.profile('unit6-integral',{fraction:true,radical:true,exponent:true,logarithm:true,constants:['pi','e'],variables:['x','y'],functions:fnKeys,arithmetic:true,parentheses:true});
// v12.9.C integral setups: the standard editor's keys (MathLive pages use ml-unit6-setup with the integral key instead);
// a comma separates the parts of int(lower,upper,integrand,x) when typed in the standard editor
const setupKeys={fraction:true,radical:true,exponent:true,logarithm:true,constants:['pi','e'],variables:['x','y'],functions:[['sin','sin'],['cos','cos']],arithmetic:true,parentheses:true,list:true};
U5.profile('unit6-setup',setupKeys);U5.profile('unit6-setup-calc',{...setupKeys,decimal:true});
U5.profile('unit6-list',{fraction:true,radical:true,constants:['pi'],arithmetic:true,parentheses:true,list:true});

window.BatchMathUnit6Core=Object.freeze({U5,Q,qv,K,E,ex,eadd,escale,etex,evalE,P,pc,pm,pv,padd,psub,pmul,pscale,ppow,pint,pval,pdef,ptex,pkey,qpow,
 fp,fnc,fconst,fsub,fmul,dist,sqTex,parTex,topSum,simpleTex,quad,quadUsed:()=>quadUsed,zeros,bq,bn,fixed,F1,FPI,F2PI,factorTex,term,setupTex,numValue,exactValue,exactAnswer,evalSteps,
 region,areaTerms,areaTex,washerTerms,shellTerms,sectionTerms,SHAPES,rectShape,side,readExpr,parseSetup,checkIntegral,checkExpr,sameSetup,modelOf,densityOf,
 exactPart,numPart,integralPart,exprPart,choicePart,listPart,problem,figure,withPicture,regionStep,sliceSegment,sliceAt,sectionPicture,solidPicture,graphToggle,step,m,question,hash});
})();
