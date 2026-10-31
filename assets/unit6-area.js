/* BatchMath v12.9.A — Unit 6 engines: Area Below and Between Curves (dx) and Finding Area in Terms of y (dy).
   Answers are typed: exact values without a calculator, values correct to three decimals with one, x- or y-values as
   lists, and integral setups (graded by value, so either variable is accepted unless a question fixes it).
   Area Below and Between Curves
     axis_basic        area between a curve and the x-axis (curve above the axis): shifted caps, k sqrt(x), powers,
                       semicircles, sine and cosine arches (the v10.6 families, now typed)
     axis_sign         a curve that crosses the x-axis: find the zeros, split, take the opposite of the parts below
     between_enclosed  two curves enclosing a region: find the intersections, then top minus bottom
     between_switch    curves that change places on the interval: one integral per piece
     multi_boundary    regions with three or more boundaries: two dx integrals or one dy integral
     trig_area         A + cos(x/n) and sin(kx) on [0, pi] (tests), sec^2 x with sin x or cos x, 2a sin x and a sin 2x
     calc_given        calculator: non-elementary curves on a given interval (the v10.6 families, now typed)
     calc_find         calculator: intersections found with the calculator (a ln(x+1) with a line, 1 + ln x with
                       x^2 - 1, cos x with x^2, e^{x/2} with c - x^2)
   Finding Area in Terms of y
     y_given           right minus left with given y-bounds (the v10.6 families, now typed)
     y_between         two curves x = f(y): find where they meet, then right minus left
     y_axis_cross      a curve x = f(y) and the y-axis, where the curve crosses the axis
     y_choose          decide which slices need only one integral, set up the area and evaluate it */
(function(){
'use strict';
const C=window.BatchMathUnit6Core,RG=window.BatchMathUnit6Regions;
if(!C||!RG){console.error('unit6-area: load unit6-core.js and unit6-regions.js first');return;}
const {U5,Q,qv,K,ex,eadd,etex,evalE,P,pc,pm,padd,psub,pscale,pmul,ppow,pdef,ptex,fp,fnc,fconst,bq,bn,region,areaTerms,setupTex,numValue,exactValue,exactAnswer,
 step,m,question,problem,figure,quad,zeros,fixed,exactPart,numPart,integralPart,choicePart,listPart}=C;
const {pick,ri,shuffle}=U5,W=RG.work;
U5.profile('unit6-list-dec',{decimal:true,arithmetic:true,list:true});
const lin=(a,b)=>padd(pm(typeof a==='number'?Q(a):a,1),pc(typeof b==='number'?Q(b):b));
const fromRoots=(k,rs,v=lin)=>rs.reduce((acc,r)=>pmul(acc,v(1,typeof r==='number'?-r:Q(-r.n,r.d))),pc(typeof k==='number'?Q(k):k));
const qx=r=>typeof r==='number'?Q(r):r;
const tq=r=>U5.qtex(qx(r));
const ans=e=>exactAnswer(e);
const sumE=list=>list.reduce((a,b)=>a?eadd(a,b):b,null);
const one=(prompt0,parts,o)=>{const prompt=parts.length>1?prompt0:(o.calc?'Use your calculator.':'');return problem(o.calc?{...o,calculator:true,questionHtml:question({context:o.context,prompt,formulas:o.formulas,calculator:true,extra:o.extra||''}),parts}:{...o,questionHtml:question({context:o.context,prompt,formulas:o.formulas,calculator:false,extra:o.extra||''}),parts});};
const ROUND=x=>Math.round(x*1e9)/1e9;
// signed pieces of a polynomial between consecutive zeros on [a, b]: [{a,b,sign}]
function signPieces(Pp,a,b,roots){
 const cuts=[a,...roots.filter(r=>qv(r)>qv(a)+1e-12&&qv(r)<qv(b)-1e-12).sort((u,w)=>qv(u)-qv(w)),b];
 return cuts.slice(1).map((r,i)=>{const l=cuts[i],mid=(qv(l)+qv(r))/2;return{a:l,b:r,sign:Math.sign(C.pval(Pp,mid))};});
}
// area of |p| over the pieces, with the work
function absArea(Pp,pieces,v='x',name='f(x)'){
 let total=Q(0);const lines=[],sym=[];
 for(const pc0 of pieces){const d=pdef(Pp,bq(pc0.a),bq(pc0.b));const val=pc0.sign<0?U5.qneg(d):d;total=U5.qadd(total,val);
  sym.push(`${pc0.sign<0?'-':''}\\int_{${tq(pc0.a)}}^{${tq(pc0.b)}}${C.parTex(ptex(Pp,v))}\\,d${v}`);
  lines.push(`\\int_{${tq(pc0.a)}}^{${tq(pc0.b)}}${C.parTex(ptex(Pp,v))}\\,d${v}=${tq(d)}`);}
 return{total,sym,lines};
}

// ---------------- Area Below and Between Curves ----------------
function famAxis(tier){
 const sub=pick(['cap','root','power','semicircle','trig']);
 if(sub==='semicircle'){
  const a=ri(1,5),k=ri(1,4),e=ex(Q(k*a*a,2),K.pi),f=`${k===1?'':k}\\sqrt{${a*a}-x^{2}}`;
  return one('Find the area of the region between the curve and the x-axis.',[exactPart('Find the area.',ans(e),
   step('Recognize the shape.',`The graph of \\(y=\\sqrt{${a*a}-x^{2}}\\) is the upper half of the circle of radius ${a}; multiplying by ${k} stretches it vertically, which multiplies the area by ${k}.`,`A=\\int_{-${a}}^{${a}}${f}\\,dx=${k}\\cdot\\frac{1}{2}\\pi(${a})^{2}=${etex(e)}`))],
   {engine:'area',family:'axis_basic',tier,id:`semi-${a}-${k}`,context:'A curve lies above the x-axis on the interval shown.',formulas:[`y=${f},\\quad -${a}\\le x\\le ${a}`],data:{sub}});
 }
 if(sub==='trig'){
  const k=ri(1,5),c=ri(-2,3),useSin=pick([true,false]);
  const f=`${c===0?'':`${c}+`}${k===1?'':k}\\${useSin?'sin':'cos'} x`,I=useSin?'0\\le x\\le \\pi':'-\\frac{\\pi}{2}\\le x\\le \\frac{\\pi}{2}';
  return one('Find the area between the curve and the horizontal line.',[exactPart('Find the area.',ans(ex(2*k)),
   step('Subtract the line.',`The vertical distance between the curve and \\(y=${c}\\) is \\(${k===1?'':k}\\${useSin?'sin':'cos'} x\\), which is never negative on the interval.`,
    useSin?`A=\\int_{0}^{\\pi}${k===1?'':k}\\sin x\\,dx=\\left[-${k===1?'':k}\\cos x\\right]_{0}^{\\pi}=${k}+${k}=${2*k}`:`A=\\int_{-\\pi/2}^{\\pi/2}${k===1?'':k}\\cos x\\,dx=\\left[${k===1?'':k}\\sin x\\right]_{-\\pi/2}^{\\pi/2}=${2*k}`))],
   {engine:'area',family:'axis_basic',tier,id:`trig-${k}-${c}-${useSin}`,context:'Find the area of the region between the curve and the line.',formulas:[`y=${f},\\qquad y=${c},\\qquad ${I}`],data:{sub}});
 }
 let Pp,a,b,ftex,why;
 if(sub==='cap'){const h=ri(-3,3),c=ri(1,3),r=ri(1,4);Pp=padd(pc(c*r*r),pscale(ppow(lin(1,-h),2),-c));a=Q(h-r);b=Q(h+r);
  ftex=`${c*r*r}-${c===1?'':c}${h===0?'x^{2}':`\\left(x${h>0?'-':'+'}${Math.abs(h)}\\right)^{2}`}`;why=`The parabola opens down and meets the x-axis at \\(x=${h-r}\\) and \\(x=${h+r}\\); between them it is above the axis.`;}
 else if(sub==='root'){const k=ri(1,3),n=ri(1,3);Pp=pm(k,Q(1,2));a=Q(0);b=Q(n*n);ftex=`${k===1?'':k}\\sqrt{x}`;why=`\\(${ftex}\\ge 0\\) for \\(x\\ge 0\\).`;}
 else{const o=pick([[padd(pm(1,3),pc(-1)),1,2],[padd(pm(1,2),pc(1)),0,3],[padd(pm(1,2),pc(-1)),1,3],[padd(pm(1,3),pc(2)),0,2],[padd(pm(1,3),pm(1,1)),0,2]]);
  Pp=o[0];a=Q(o[1]);b=Q(o[2]);ftex=ptex(Pp,'x');why=`\\(${ftex}\\ge 0\\) on \\([${o[1]},${o[2]}]\\).`;}
 const R=region({xs:[{a:bq(a),b:bq(b),top:fp(Pp),bot:fconst(0)}]}),T=areaTerms(R,'x'),e=exactValue(T);
 return one('Find the area of the region between the curve and the x-axis on the interval.',[exactPart('Find the area.',ans(e),step('Check the sign.',why)+step('Integrate.','',`A=\\int_{${tq(a)}}^{${tq(b)}}${C.parTex(ftex)}\\,dx`)+W.evalWork(T))],
  {engine:'area',family:'axis_basic',tier,id:`${sub}-${ftex}-${tq(a)}-${tq(b)}`,context:'Find the area of the region between the curve and the x-axis.',formulas:[`y=${ftex},\\qquad ${tq(a)}\\le x\\le ${tq(b)}`],data:{sub}});
}
function famSign(tier){
 let Pp,a,b,roots;
 if(pick([true,false])){ // cubic with three integer zeros, area of the regions it encloses with the x-axis (tests: 4x^3-16x^2+12x)
  let r;do{r=[ri(-3,1),ri(-1,3),ri(1,5)].sort((u,w)=>u-w);}while(new Set(r).size<3||r[2]-r[0]>6);
  const k=pick([1,2,4,-1,-2]);Pp=fromRoots(k,r);roots=r.map(Q);a=roots[0];b=roots[2];
 }else{ // quadratic with rational zeros on an interval that extends past both (assignment: 2x^2 - x - 3 on [-2, 2])
  const pairs=[[Q(-1),Q(3,2),2],[Q(-1),Q(2),1],[Q(-2),Q(1),1],[Q(-1,2),Q(2),2],[Q(-3,2),Q(1),2]];const [r1,r2,k]=pick(pairs);
  Pp=pscale(pmul(lin(1,U5.qneg(r1)),lin(1,U5.qneg(r2))),k);roots=[r1,r2];a=Q(Math.floor(qv(r1))-pick([0,1]));b=Q(Math.ceil(qv(r2))+pick([0,1]));
  if(qv(a)===qv(r1))a=Q(qv(a)-1);if(qv(b)===qv(r2))b=Q(qv(b)+1);
 }
 const pieces=signPieces(Pp,a,b,roots),A=absArea(Pp,pieces),inside=roots.filter(r=>qv(r)>qv(a)&&qv(r)<qv(b));
 const ftex=ptex(Pp,'x'),e=ex(A.total);
 const work=step('Find where the curve crosses the x-axis.',`\\(${ftex}=0\\) at ${roots.map(r=>`\\(x=${tq(r)}\\)`).join(', ')}.`)
  +step('Split the interval at the crossings.',`Areas below the axis come from integrals that are negative, so take their opposites: ${pieces.map(p=>`on \\([${tq(p.a)},${tq(p.b)}]\\) the curve is ${p.sign>0?'above':'below'} the axis`).join('; ')}.`,`A=${A.sym.join('+')}`)
  +step('Evaluate each integral.','',...A.lines,`A=${etex(e)}`);
 const ctx=qv(a)===qv(roots[0])&&qv(b)===qv(roots[roots.length-1])?'Find the total area of the regions enclosed by the graph and the x-axis.':`Find the total area of the regions between the graph and the x-axis from \\(x=${tq(a)}\\) to \\(x=${tq(b)}\\).`;
 const parts=tier==='foundational'?[exactPart('Find the total area.',ans(e),work)]:[listPart(`Find every x-value in \\((${tq(a)},${tq(b)})\\) where the graph crosses the x-axis.`,inside.map(qv),inside.map(tq),step('Factor and solve.',`\\(${ftex}=0\\) at ${roots.map(r=>`\\(x=${tq(r)}\\)`).join(', ')}; inside the interval: ${inside.map(r=>`\\(${tq(r)}\\)`).join(', ')}.`)),exactPart('Find the total area.',ans(e),work)];
 return one(parts.length>1?'Answer each part.':'',parts,{engine:'area',family:'axis_sign',tier,id:`sign-${ftex}-${tq(a)}-${tq(b)}`,context:ctx,formulas:[`f(x)=${ftex}`]});
}
// two curves y = top and y = bot on [p, q] meeting at p and q
function enclosedRegion(){
 const sub=pick(['pair','pair','line_parabola','two_parabolas','cubic_lobes']);
 if(sub==='pair'){const R=RG.build('pair');return{R,xs:[0,R.xb[1]],sub};}
 if(sub==='line_parabola'){ // y = L(x) - k(x-p)(x-q) above y = L(x)
  const p=ri(-3,1),q=p+ri(2,4),k=pick([1,2]),u=ri(-2,2),w=ri(-3,3),L=lin(u,w),Top=psub(L,fromRoots(k,[p,q]));
  const R=region({xs:[{a:bq(p),b:bq(q),top:fp(Top),bot:fp(L)}],eqs:[`y=${ptex(Top,'x')}`,`y=${ptex(L,'x')}`],bounds:`Set the expressions equal: \\(${ptex(fromRoots(k,[p,q]),'x')}=0\\), so \\(x=${p}\\) and \\(x=${q}\\).`,
   view:{xmin:p-1,xmax:q+1,ymin:Math.floor(Math.min(L.length?C.pval(L,p):w,C.pval(L,q)))-1,ymax:Math.ceil(Math.max(...[p,q,(p+q)/2].map(x=>C.pval(Top,x))))+1},draw:[{f:x=>C.pval(Top,x),tex:`y=${ptex(Top,'x')}`},{f:x=>C.pval(L,x),tex:`y=${ptex(L,'x')}`}]});
  return{R,xs:[p,q],sub};
 }
 if(sub==='two_parabolas'){ // the v10.6 shifted pair
  const a=ri(1,3),k=ri(1,3),mm=ri(1,3),h=ri(-2,2),v=ri(-2,2),u=lin(1,-h),Top=padd(pc(v+k*a*a),pscale(ppow(u,2),-k)),Bot=padd(pc(v-mm*a*a),pscale(ppow(u,2),mm));
  const R=region({xs:[{a:bq(h-a),b:bq(h+a),top:fp(Top),bot:fp(Bot)}],eqs:[`y=${ptex(Top,'x')}`,`y=${ptex(Bot,'x')}`],bounds:`Set them equal: \\(${k+mm}(x${h?(h>0?`-${h}`:`+${-h}`):''})^{2}=${(k+mm)*a*a}\\), so \\(x=${h-a}\\) and \\(x=${h+a}\\).`,
   view:{xmin:h-a-1,xmax:h+a+1,ymin:v-mm*a*a-1,ymax:v+k*a*a+1},draw:[{f:x=>C.pval(Top,x),tex:`y=${ptex(Top,'x')}`},{f:x=>C.pval(Bot,x),tex:`y=${ptex(Bot,'x')}`}]});
  return{R,xs:[h-a,h+a],sub};
 }
 // y = x^3 - m x + c and y = -x^3 + m x + c (assignment): two lobes
 const mm=pick([1,4]),c=ri(-2,3),r=Math.sqrt(mm),F=padd(padd(pm(1,3),pm(-mm,1)),pc(c)),G=padd(padd(pm(-1,3),pm(mm,1)),pc(c));
 const R=region({xs:[{a:bq(-r),b:bq(0),top:fp(F),bot:fp(G)},{a:bq(0),b:bq(r),top:fp(G),bot:fp(F)}],eqs:[`y=${ptex(F,'x')}`,`y=${ptex(G,'x')}`],
  bounds:`Set them equal: \\(2x^{3}-${2*mm}x=2x\\left(x^{2}-${mm}\\right)=0\\), so \\(x=-${r}\\), \\(x=0\\) and \\(x=${r}\\). The curves change places at \\(x=0\\).`,view:{xmin:-r-1,xmax:r+1,ymin:c-3,ymax:c+3},draw:[{f:x=>C.pval(F,x),tex:`y=${ptex(F,'x')}`},{f:x=>C.pval(G,x),tex:`y=${ptex(G,'x')}`}]});
 return{R,xs:[-r,0,r],sub};
}
function famEnclosed(tier){
 const {R,xs,sub}=enclosedRegion(),T=areaTerms(R,'x'),e=exactValue(T);
 const work=W.boundsStep(R,'Find where the curves meet.')+W.areaWork(R,'x',T)+W.evalWork(T);
 const ctx=sub==='cubic_lobes'?'Find the total area of the regions enclosed between the two curves.':'Find the area of the region enclosed by the two curves.';
 let parts;
 if(tier==='challenging')parts=[integralPart('Write an integral expression (or a sum of integrals) for the area of the region enclosed by the curves.',T,W.boundsStep(R,'Find where the curves meet.')+W.areaWork(R,'x',T),{help:'You may integrate with respect to x or y.'}),exactPart('Evaluate the area.',ans(e),W.evalWork(T))];
 else parts=[listPart('Find the x-coordinates of all points where the curves intersect.',xs,xs.map(String),W.boundsStep(R,'Find where the curves meet.')),exactPart('Find the area.',ans(e),W.areaWork(R,'x',T)+W.evalWork(T))];
 if(tier==='foundational')parts=[exactPart('Find the area.',ans(e),work)];
 return one(parts.length>1?'Answer each part.':'',parts,{engine:'area',family:'between_enclosed',tier,id:`enc-${sub}-${R.eqs.join('|')}`,context:ctx,formulas:R.eqs,extra:tier!=='foundational'&&pick([true,false])?figure(R,{label:'The two curves'}):'',data:{sub}});
}
function famSwitch(tier){
 if(pick([true,false])){ // sin x and cos x
  const full=pick([true,false]),bT=full?'\\pi':'\\frac{\\pi}{2}',e=full?ex(2,K.sqrt2):eadd(ex(2,K.sqrt2),ex(-2));
  const R=region({xs:[{a:bq(0),b:bn(Math.PI/4,'\\frac{\\pi}{4}'),top:fnc({tex:()=>'\\cos x',key:()=>'cos(x)',f:Math.cos}),bot:fnc({tex:()=>'\\sin x',key:()=>'sin(x)',f:Math.sin})},{a:bn(Math.PI/4,'\\frac{\\pi}{4}'),b:bn(full?Math.PI:Math.PI/2,bT),top:fnc({tex:()=>'\\sin x',key:()=>'sin(x)',f:Math.sin}),bot:fnc({tex:()=>'\\cos x',key:()=>'cos(x)',f:Math.cos})}]});
  const T=areaTerms(R,'x');
  const work=step('Find where the curves cross.',`\\(\\sin x=\\cos x\\) at \\(x=\\frac{\\pi}{4}\\): cosine is on top before it and sine after it.`)+W.areaWork(R,'x',T)
   +step('Evaluate.','',`\\int_{0}^{\\pi/4}(\\cos x-\\sin x)\\,dx=\\left[\\sin x+\\cos x\\right]_{0}^{\\pi/4}=\\sqrt{2}-1`,full?`\\int_{\\pi/4}^{\\pi}(\\sin x-\\cos x)\\,dx=\\left[-\\cos x-\\sin x\\right]_{\\pi/4}^{\\pi}=1+\\sqrt{2}`:`\\int_{\\pi/4}^{\\pi/2}(\\sin x-\\cos x)\\,dx=\\left[-\\cos x-\\sin x\\right]_{\\pi/4}^{\\pi/2}=\\sqrt{2}-1`,`A=${etex(e)}`);
  const parts=tier==='challenging'?[integralPart(`Write a sum of integrals for the area between the curves on \\([0,${bT}]\\).`,T,step('Find where the curves cross.','\\(\\sin x=\\cos x\\) at \\(x=\\frac{\\pi}{4}\\).')+W.areaWork(R,'x',T)),exactPart('Evaluate the area.',ans(e),work)]:[exactPart('Find the area.',ans(e),work)];
  return one(parts.length>1?'Answer each part.':'',parts,{engine:'area',family:'between_switch',tier,id:`sincos-${full}`,context:`Find the area of the regions between the curves on \\(\\left[0,${bT}\\right]\\).`,formulas:['f(x)=\\sin x','g(x)=\\cos x'],data:{sub:'sin_cos'}});
 }
 // a parabola and a line on an interval that extends past both intersections: three pieces (notes: 2x^2+10, 4x+16, [-2,5])
 const p=ri(-2,1),q=p+ri(2,4),k=pick([1,2]),u=ri(-2,4),w=ri(-2,6),L=lin(u,w),Par=padd(L,fromRoots(k,[p,q])),a=p-ri(1,2),b=q+ri(1,2);
 const D=fromRoots(k,[p,q]),pieces=signPieces(D,Q(a),Q(b),[Q(p),Q(q)]),A=absArea(D,pieces);
 const xsR=pieces.map(pc0=>pc0.sign>0?{a:bq(pc0.a),b:bq(pc0.b),top:fp(Par),bot:fp(L)}:{a:bq(pc0.a),b:bq(pc0.b),top:fp(L),bot:fp(Par)});
 const R=region({xs:xsR,eqs:[`y=${ptex(Par,'x')}`,`y=${ptex(L,'x')}`],view:{xmin:a-1,xmax:b+1,ymin:Math.floor(Math.min(...[a,b,(p+q)/2].map(x=>Math.min(C.pval(Par,x),C.pval(L,x)))))-1,ymax:Math.ceil(Math.max(...[a,b].map(x=>Math.max(C.pval(Par,x),C.pval(L,x)))))+1},draw:[{f:x=>C.pval(Par,x),tex:`y=${ptex(Par,'x')}`},{f:x=>C.pval(L,x),tex:`y=${ptex(L,'x')}`}]});
 const T=areaTerms(R,'x'),e=exactValue(T);
 const cross=step('Find where the curves cross.',`\\(${ptex(Par,'x')}=${ptex(L,'x')}\\) gives \\(${ptex(D,'x')}=0\\), so \\(x=${p}\\) and \\(x=${q}\\); both are inside \\([${a},${b}]\\), so the curves change places twice.`);
 const parts=tier==='challenging'?[integralPart(`Set up, but do not evaluate, integrals for the area of the regions between the curves on \\([${a},${b}]\\).`,T,cross+W.areaWork(R,'x',T)),exactPart('Evaluate the total area.',ans(e),W.evalWork(T))]
  :[listPart(`Find the x-values in \\((${a},${b})\\) where the curves cross.`,[p,q],[String(p),String(q)],cross),exactPart(`Find the total area of the regions between the curves on \\([${a},${b}]\\).`,ans(e),W.areaWork(R,'x',T)+W.evalWork(T))];
 return one('Answer each part.',parts,{engine:'area',family:'between_switch',tier,id:`switch-${ptex(Par,'x')}-${a}-${b}`,context:`Consider the curves below on the interval \\([${a},${b}]\\).`,formulas:R.eqs,data:{sub:'parabola_line'}});
}
function cornerRegion(){ // y = x, y = 1/x^2, x = b and the x-axis (assignment)
 const b=pick([2,3,4]),inv=fp(pm(1,-2));
 return region({xs:[{a:bq(0),b:bq(1),top:fp(pm(1,1)),bot:fconst(0)},{a:bq(1),b:bq(b),top:inv,bot:fconst(0)}],ys:[{a:bq(0),b:bq(Q(1,b*b)),right:fconst(b),left:fp(pm(1,1))},{a:bq(Q(1,b*b)),b:bq(1),right:fp(pm(1,Q(-1,2))),left:fp(pm(1,1))}],
  eqs:['y=x',`x=${b}`,'y=\\frac{1}{x^{2}}','y=0'],text:`the region in the first quadrant bounded by the line \\(y=x\\), the line \\(x=${b}\\), the curve \\(y=\\frac{1}{x^{2}}\\) and the x-axis`,
  bounds:`\\(x=\\frac{1}{x^{2}}\\) at \\(x=1\\). Up to \\(x=1\\) the top is the line; from 1 to ${b} it is the curve.`,view:{xmin:-1,xmax:b+1,ymin:-1,ymax:2},
  draw:[{f:x=>x,tex:'y=x',dom:[-0.5,1.6]},{f:x=>1/(x*x),tex:'y=\\frac{1}{x^{2}}',dom:[0.6,b+1]},{g:()=>b,tex:`x=${b}`,dom:[-1,2]}],data:{kind:'corner'}});
}
function famMulti(tier){
 const sub=pick(['rootLineAxis','sidewaysLine','corner']),R=sub==='corner'?cornerRegion():RG.build(sub);
 const Tx=areaTerms(R,'x'),Ty=areaTerms(R,'y'),e=exactValue(Tx)||exactValue(Ty);
 const both=step('Two ways to slice.',`With vertical slices the top or bottom boundary changes, so you need ${Tx.length} integrals in x; with horizontal slices you need ${Ty.length===1?'only one integral':`${Ty.length} integrals`} in y.`,`A=${setupTex(Tx)}`,`A=${setupTex(Ty)}`);
 const better=Ty.length<Tx.length?Ty:Tx;
 const parts=[integralPart(`Write an integral expression (or a sum of integrals) for the area of \\(R\\).`,better,W.boundsStep(R)+both,{help:'Use dx or dy; choose whichever needs fewer integrals.'}),exactPart('Find the area of \\(R\\).',ans(e),W.evalWork(better))];
 return one('Answer each part.',parts,{engine:'area',family:'multi_boundary',tier,id:`multi-${sub}-${R.eqs.join('|')}`,context:`Let \\(R\\) be ${R.text}.`,formulas:R.eqs,extra:figure(R,{label:'Region R'}),data:{sub}});
}
const SIN_PI={2:[ex(1)],3:[ex(Q(1,2),K.sqrt3)],4:[ex(Q(1,2),K.sqrt2)],6:[ex(Q(1,2))]};
function famTrig(tier){
 const sub=pick(['shift_cos','shift_cos','sec','double']);
 if(sub==='shift_cos'){ // tests: y = sin(kx) and y = A + cos(x/n) on [0, pi]
  const A=pick([2,3,4,5]),n=pick([2,3,4,6]),k=pick([2,3,4,5]),sinTerm=SIN_PI[n][0];
  const e=sumE([ex(A,K.pi),U5.escale(sinTerm,Q(n)),...(k%2?[ex(Q(-2,k))]:[])]);
  const top=`${A}+\\cos\\left(\\frac{x}{${n}}\\right)`,bot=`\\sin(${k}x)`;
  const work=step('Decide which curve is on top.',`\\(${A}+\\cos\\left(\\frac{x}{${n}}\\right)\\ge ${A-1}\\gt 1\\ge \\sin(${k}x)\\), so the first curve is above the second on the whole interval and one integral is enough.`,`A=\\int_{0}^{\\pi}\\left(${top}-${bot}\\right)dx`)
   +step('Evaluate.',`An antiderivative of \\(\\cos\\left(\\frac{x}{${n}}\\right)\\) is \\(${n}\\sin\\left(\\frac{x}{${n}}\\right)\\), and of \\(\\sin(${k}x)\\) is \\(-\\frac{1}{${k}}\\cos(${k}x)\\).`,`A=\\left[${A}x+${n}\\sin\\left(\\frac{x}{${n}}\\right)+\\frac{1}{${k}}\\cos(${k}x)\\right]_{0}^{\\pi}=${A}\\pi+${n}\\sin\\frac{\\pi}{${n}}+\\frac{${k%2?-1:1}-1}{${k}}=${etex(e)}`);
  return one('Find the area of the region between the curves.',[exactPart('Find the area.',ans(e),work)],{engine:'area',family:'trig_area',tier,id:`tc-${A}-${n}-${k}`,context:'Find the area of the region between the curves from \\(x=0\\) to \\(x=\\pi\\).',formulas:[`y=${bot}`,`y=${top}`],data:{sub}});
 }
 if(sub==='sec'){
  const withCos=pick([true,false]),e=withCos?eadd(ex(1),ex(Q(-1,2),K.sqrt2)):ex(Q(1,2),K.sqrt2);
  const g=withCos?'\\cos x':'\\sin x',anti=withCos?'\\tan x-\\sin x':'\\tan x+\\cos x';
  return one('Find the area between the curves.',[exactPart('Find the area.',ans(e),step('Decide which curve is on top.',`On \\(\\left[0,\\frac{\\pi}{4}\\right]\\), \\(\\sec^{2}x\\ge 1\\ge ${g}\\).`,`A=\\int_{0}^{\\pi/4}\\left(\\sec^{2}x-${g}\\right)dx=\\left[${anti}\\right]_{0}^{\\pi/4}=${etex(e)}`))],
   {engine:'area',family:'trig_area',tier,id:`sec-${withCos}`,context:'Find the area between the curves from \\(x=0\\) to \\(x=\\frac{\\pi}{4}\\).',formulas:['f(x)=\\sec^{2}x',`g(x)=${g}`],data:{sub}});
 }
 const a=pick([1,2,3]);
 return one('Find the area of the region enclosed by the curves.',[exactPart('Find the area.',ans(ex(4*a)),step('Compare the curves.',`\\(${2*a}\\sin x-${a===1?'':a}\\sin 2x=${2*a}\\sin x(1-\\cos x)\\ge 0\\) on \\([0,\\pi]\\), and the curves meet at both ends.`,`A=\\int_{0}^{\\pi}\\left(${2*a}\\sin x-${a===1?'':a}\\sin 2x\\right)dx=\\left[-${2*a}\\cos x+\\frac{${a}}{2}\\cos 2x\\right]_{0}^{\\pi}=${4*a}`))],
  {engine:'area',family:'trig_area',tier,id:`dbl-${a}`,context:'Find the area of the region enclosed by the curves for \\(0\\le x\\le\\pi\\).',formulas:[`y=${2*a}\\sin x`,`y=${a===1?'':a}\\sin 2x`],data:{sub:'double'}});
}
// calculator, bounds given (v10.6 families)
const OLD=[
 ()=>{const A=pick([2,3,4]),B=pick([1,2]),T=pick([1.5,2,2.5]);return{id:`c1-${A}-${B}-${T}`,f:x=>A+Math.sin(x*x)+B*x/5,g:()=>0,tex:[`y=${A}+\\sin(x^{2})+\\frac{${B}}{5}x`,'y=0'],T,why:'The curve stays above the x-axis.'};},
 ()=>{const q=pick([2,3,4]),r=pick([3,4,5]),T=pick([1.5,2]);return{id:`c2-${q}-${r}-${T}`,f:x=>Math.exp(x/q)+Math.log(x+2),g:x=>x*x/r+0.5*Math.cos(x),tex:[`y=e^{\\frac{x}{${q}}}+\\ln(x+2)`,`y=\\frac{x^{2}}{${r}}+\\frac{1}{2}\\cos x`],T,why:'The first curve stays above the second.'};},
 ()=>{const T=pick([1.5,2,2.5]),k=pick([1,2]);return{id:`c3-${k}-${T}`,f:x=>2+Math.sqrt(x+3)+Math.sin(k*x*x/2),g:x=>1+Math.log(x+1),tex:[`y=2+\\sqrt{x+3}+\\sin\\left(\\frac{${k}x^{2}}{2}\\right)`,'y=1+\\ln(x+1)'],T,why:'The first curve stays above the second.'};},
 ()=>{const A=pick([3,4,5]),T=pick([2,2.5,3]);return{id:`c4-${A}-${T}`,f:x=>A+Math.cos(x*x),g:x=>Math.exp(-x/2)+x/3,tex:[`y=${A}+\\cos(x^{2})`,'y=e^{-x/2}+\\frac{x}{3}'],T,why:'The first curve stays above the second.'};},
 ()=>{const A=pick([2,3,4]),T=pick([1.5,2,2.5]);return{id:`c5-${A}-${T}`,f:x=>A+Math.exp(-x*x/3)+0.4*Math.sin(x*x),g:x=>Math.sqrt(x+1)/2,tex:[`y=${A}+e^{-x^{2}/3}+\\frac{2}{5}\\sin(x^{2})`,'y=\\frac{1}{2}\\sqrt{x+1}'],T,why:'The first curve stays above the second.'};},
];
function famCalcGiven(tier){
 const o=pick(OLD)(),v=quad(x=>o.f(x)-o.g(x),0,o.T);
 return one('Use your calculator.',[numPart(`Find the area of the region between the curves on \\([0,${o.T}]\\).`,v,step('Set up.',o.why,`A=\\int_{0}^{${o.T}}\\left(\\text{top}-\\text{bottom}\\right)dx\\approx ${fixed(v,3)}`))],
  {engine:'area',family:'calc_given',tier,id:o.id,calc:true,context:'Find the area of the region between the curves on the interval.',formulas:o.tex});
}
function famCalcFind(tier){
 const sub=pick(['logLine','logParabola','cosParabola','expParabola']),R=RG.build(sub),T=areaTerms(R,'x'),v=numValue(T);
 const pts=sub==='logLine'?[R.data.p]:sub==='cosParabola'?[-R.data.p,R.data.p]:[R.data.p,R.data.q];
 const ask=sub==='logLine'?'Find the x-coordinate of the point where the curve and the line intersect.':'Find the x-coordinates of the points where the curves intersect.';
 const listP={prompt:`${ask} Give each value correct to three decimal places.`,control:'input',answer:{kind:'list',values:pts,places:3},answerTex:pts.map(x=>fixed(x,3)).join(',\\ '),explanation:W.boundsStep(R,'Use the calculator.'),keypadMode:'unit6-list-dec',placeholder:'Decimal values separated by commas'};
 const parts=tier==='challenging'?[integralPart('Write an integral expression (or a sum of integrals) for the area of \\(R\\). You may use decimal limits.',T,W.boundsStep(R)+W.areaWork(R,'x',T),{help:'Use the stored intersection values (at least four decimals) as limits.'}),numPart('Find the area of \\(R\\).',v,W.calcWork(T,'A'))]
  :[listP,numPart('Find the area of \\(R\\).',v,W.areaWork(R,'x',T)+W.calcWork(T,'A'))];
 return one('Use your calculator. Answer each part.',parts,{engine:'area',family:'calc_find',tier,id:`cf-${sub}-${R.eqs.join('|')}`,calc:true,context:`Let \\(R\\) be ${R.text}.`,formulas:R.eqs,extra:figure(R,{label:'Region R'}),data:{sub}});
}
const T3=['foundational','intermediate','challenging'];
const AREA={
 axis_basic:{weight:15,tiers:['foundational','intermediate'],make:famAxis,calculator:false},
 axis_sign:{weight:15,tiers:['foundational','intermediate'],make:famSign,calculator:false},
 between_enclosed:{weight:20,tiers:T3,make:famEnclosed,calculator:false},
 between_switch:{weight:12,tiers:['intermediate','challenging'],make:famSwitch,calculator:false},
 multi_boundary:{weight:12,tiers:['intermediate','challenging'],make:famMulti,calculator:false},
 trig_area:{weight:10,tiers:['intermediate'],make:famTrig,calculator:false},
 calc_given:{weight:8,tiers:['foundational','intermediate'],make:famCalcGiven,calculator:true},
 calc_find:{weight:12,tiers:['intermediate','challenging'],make:famCalcFind,calculator:true},
};
const AREA_MODES={under_curve:{families:{axis_basic:true,axis_sign:true,calc_given:true}},between:{families:{between_enclosed:true,between_switch:true,multi_boundary:true,trig_area:true,calc_find:true}}};

// ---------------- Finding Area in Terms of y ----------------
function famYGiven(tier){ // v10.6 families, now typed
 const sub=pick(['sideways','line','two','triangle','cubic','translated']);let R,ctx;
 const y=(c,e)=>fp(pm(typeof c==='number'?Q(c):c,typeof e==='number'?Q(e):e));
 if(sub==='sideways'){const h=ri(1,4),k=ri(1,3);R=region({ys:[{a:bq(-h),b:bq(h),right:fconst(k*h*h),left:y(k,2)}],eqs:[`x=${k===1?'':k}y^{2}`,`x=${k*h*h}`]});ctx=`Find the area of the region between the curves for \\(-${h}\\le y\\le ${h}\\).`;}
 else if(sub==='line'){const kk=ri(2,5),c=ri(1,3);R=region({ys:[{a:bq(0),b:bq(kk),right:y(c*kk,1),left:y(c,2)}],eqs:[`x=${c===1?'':c}y^{2}`,`x=${c*kk}y`]});ctx='Find the area of the region enclosed by the curves.';}
 else if(sub==='two'){const r=ri(1,3),k=ri(1,3);R=region({ys:[{a:bq(-r),b:bq(r),right:fp(padd(pc(k*r*r),pm(-k,2))),left:fp(padd(pm(k,2),pc(-k*r*r)))}],eqs:[`x=${k===1?'':k}\\left(${r*r}-y^{2}\\right)`,`x=${k===1?'':k}\\left(y^{2}-${r*r}\\right)`]});ctx='Find the area of the region enclosed by the curves.';}
 else if(sub==='triangle'){const h=ri(2,5),c=ri(1,3);R=region({ys:[{a:bq(0),b:bq(h),right:fp(padd(pc(c*h),pm(-c,1))),left:fconst(0)}],eqs:['x=0',`x=${c===1?'':c}(${h}-y)`]});ctx=`Find the area of the region between the curves for \\(0\\le y\\le ${h}\\).`;}
 else if(sub==='cubic'){const a=ri(1,3),k=ri(1,2);R=region({ys:[{a:bq(0),b:bq(a),right:fconst(k*a**3),left:y(k,3)}],eqs:[`x=${k===1?'':k}y^{3}`,`x=${k*a**3}`]});ctx=`Find the area of the region between the curves for \\(0\\le y\\le ${a}\\).`;}
 else{const h=ri(-2,2),a=ri(1,3),k=ri(1,2),u=padd(pm(1,1),pc(-h));R=region({ys:[{a:bq(h-a),b:bq(h+a),right:fconst(k*a*a),left:fp(pscale(ppow(u,2),k))}],eqs:[`x=${k*a*a}`,`x=${k===1?'':k}${h===0?'y^{2}':`\\left(y${h>0?'-':'+'}${Math.abs(h)}\\right)^{2}`}`]});ctx='Find the area of the region enclosed by the curves.';}
 const T=areaTerms(R,'y'),e=exactValue(T);
 return one('Integrate with respect to y.',[exactPart('Find the area.',ans(e),W.areaWork(R,'y',T)+W.evalWork(T))],{engine:'area_y',family:'y_given',tier,id:`yg-${sub}-${R.eqs.join('|')}`,context:ctx,formulas:R.eqs,data:{sub}});
}
function famYBetween(tier){
 const sub=pick(['sidewaysLine','sidewaysPair','sidewaysCubic','two_sideways']);let R;
 if(sub==='two_sideways'){ // x = A - y^2 and x = (y - h)^2 (notes: -y^2 + 10 and (y - 2)^2)
  const [h,r1,r2]=pick([[2,-1,3],[1,-1,2],[3,0,3],[2,0,2],[4,1,3]]),A=(r1*r1+(r1-h)**2),Lf=fp(ppow(padd(pm(1,1),pc(-h)),2)),Rf=fp(padd(pc(A),pm(-1,2)));
  if(Math.abs(Rf.f(r2)-Lf.f(r2))>1e-9)return famYBetween(tier);
  R=region({ys:[{a:bq(r1),b:bq(r2),right:Rf,left:Lf}],eqs:[`x=${Rf.tex('y')}`,`x=\\left(y-${h}\\right)^{2}`],bounds:`Set them equal: \\(${A}-y^{2}=(y-${h})^{2}\\) gives \\(2y^{2}-${2*h}y+${h*h-A}=0\\), so \\(y=${r1}\\) and \\(y=${r2}\\).`,
   view:{xmin:-1,xmax:A+1,ymin:r1-2,ymax:r2+2},draw:[{g:Rf.f,tex:`x=${Rf.tex('y')}`},{g:Lf.f,tex:`x=(y-${h})^{2}`}]});
 }else R=RG.build(sub);
 const T=areaTerms(R,'y'),e=exactValue(T),ys=sub==='sidewaysCubic'?[0,R.yb[1]]:[R.ys[0].a.v,R.ys[R.ys.length-1].b.v];
 const parts=[listPart(sub==='sidewaysCubic'?'Find the y-values where the curve meets the y-axis.':'Find the y-coordinates of the points where the curves intersect.',ys,ys.map(String),W.boundsStep(R,'Find where the boundaries meet.')),
  exactPart('Find the area of the region by integrating with respect to y.',ans(e),W.areaWork(R,'y',T)+W.evalWork(T))];
 return one('Answer each part.',parts,{engine:'area_y',family:'y_between',tier,id:`yb-${sub}-${R.eqs.join('|')}`,context:`Let \\(R\\) be ${R.text||'the region enclosed by the curves'}.`,formulas:R.eqs,extra:pick([true,false])?figure(R,{label:'Region R'}):'',data:{sub}});
}
function famYAxis(tier){ // x = k(y - r1)(y - r2) and the y-axis from y = a to y = b: parts left of the axis count with the opposite sign
 const r1=ri(-2,1),r2=r1+ri(2,3),k=pick([1,-1,2]),Pp=fromRoots(k,[r1,r2]),a=r1-pick([0,1]),b=r2+pick([0,1]);
 const pieces=signPieces(Pp,Q(a),Q(b),[Q(r1),Q(r2)]),A=absArea(Pp,pieces,'y'),e=ex(A.total),ftex=ptex(Pp,'y');
 const work=step('Find where the curve crosses the y-axis.',`\\(${ftex}=0\\) at \\(y=${r1}\\) and \\(y=${r2}\\).`)
  +step('Split at the crossings.',`Where the curve is to the right of the y-axis the integral is the area; where it is to the left the integral is negative, so take its opposite: ${pieces.map(p=>`on \\([${tq(p.a)},${tq(p.b)}]\\) the curve is ${p.sign>0?'right':'left'} of the axis`).join('; ')}.`,`A=${A.sym.join('+')}`)
  +step('Evaluate each integral.','',...A.lines,`A=${etex(e)}`);
 return one('Integrate with respect to y.',[exactPart(`Find the total area of the regions between the curve and the y-axis from \\(y=${a}\\) to \\(y=${b}\\).`,ans(e),work)],{engine:'area_y',family:'y_axis_cross',tier,id:`ya-${ftex}-${a}-${b}`,context:'A curve is given with x as a function of y.',formulas:[`x=${ftex}`]});
}
function famYChoose(tier){
 const sub=pick(['rootLineAxis','sidewaysLine','wedge']),R=RG.build(sub),Tx=areaTerms(R,'x'),Ty=areaTerms(R,'y'),e=exactValue(Ty)||exactValue(Tx);
 const dyBetter=Ty.length<Tx.length,choices=['Vertical slices (integrate with respect to x)','Horizontal slices (integrate with respect to y)'];
 const why=step('Compare the two ways of slicing.',`${dyBetter?'With vertical slices the bottom (or top) boundary changes partway across, so dx needs two integrals; horizontal slices always run from the same left curve to the same right curve, so dy needs one.':'With horizontal slices the right boundary changes partway up, so dy needs two integrals; vertical slices always run between the same two lines, so dx needs one.'}`,`A=${setupTex(Tx)}`,`A=${setupTex(Ty)}`);
 const best=dyBetter?Ty:Tx;
 const parts=[choicePart('Which slices describe \\(R\\) with a single integral?',choices,dyBetter?1:0,why),integralPart('Write an integral expression for the area of \\(R\\).',best,W.boundsStep(R)+W.areaWork(R,dyBetter?'y':'x',best),{help:'Any correct setup is accepted.'}),exactPart('Find the area of \\(R\\).',ans(e),W.evalWork(best))];
 return one('Answer each part.',parts,{engine:'area_y',family:'y_choose',tier,id:`yc-${sub}-${R.eqs.join('|')}`,context:`Let \\(R\\) be ${R.text}.`,formulas:R.eqs,extra:figure(R,{label:'Region R'}),data:{sub}});
}
const AREA_Y={
 y_given:{weight:25,tiers:['foundational','intermediate'],make:famYGiven,calculator:false},
 y_between:{weight:30,tiers:['intermediate','challenging'],make:famYBetween,calculator:false},
 y_axis_cross:{weight:15,tiers:['intermediate'],make:famYAxis,calculator:false},
 y_choose:{weight:30,tiers:['intermediate','challenging'],make:famYChoose,calculator:false},
};
const areaEngine=U5.makeEngine('unit6-area',AREA,AREA_MODES),areaYEngine=U5.makeEngine('unit6-area-y',AREA_Y,{});
window.BatchMathUnit6Area=Object.freeze({make:areaEngine.make,FAMILIES:AREA,MODES:AREA_MODES,makeY:areaYEngine.make,FAMILIES_Y:AREA_Y,enclosedRegion,cornerRegion});
U5.register('area-below-and-between-curves',o=>areaEngine.make(o||{}));
U5.register('finding-area-in-terms-of-y',o=>areaYEngine.make(o||{}));
})();
