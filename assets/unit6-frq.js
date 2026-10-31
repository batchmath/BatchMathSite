/* BatchMath v12.9.A — Unit 6 free-response problems (used by the Unit 6 Comprehensive Review pages).
   Region free-response problems: one region, two to four parts, in the style of the first question of each test.
     frq_region     non-calculator: an algebraic region (sqrt(x) and x^2, x = y^2 and x = y + 2, caps, wedges, triangles...):
                    the area, then cross sections, washers and shells (written setups and exact volumes)
     frq_cap_line   non-calculator: f(x) = k/(1 + x^2) and a horizontal line (tests 2025-26): the area (arctangent), a
                    volume setup about another horizontal line, the rate of change of the vertical distance h(x)
     frq_calc       calculator: 2 ln(x + 1) with a line and the x-axis, 1 + ln x with x^2 - 1, e^{kx} with the axes,
                    4 - x^2 with e^(x/2), cos x with x^2: intersections, area, cross sections, volumes about lines
   Graph free-response problems (non-calculator, modelled on the 2025-26 tests): the graph of f is made of line
   segments with a semicircle or quarter circles, drawn on integer grid points.
     graph_derivative  f is the derivative of g and one value of g is given: values of g, points of inflection, the
                       absolute maximum or minimum, a limit that needs L'Hopital's Rule, or g''
     graph_accum       g(x) = integral from c to x of f(t) dt: values (including x < c), points of inflection, local
                       extrema, intervals of increase, the absolute maximum or minimum
   Every value is exact (rationals and multiples of pi). Reasons are checked as a choice among statements; written
   reasoning is not graded, and each explanation ends with a model written justification to compare with. */
(function(){
'use strict';
const C=window.BatchMathUnit6Core,RG=window.BatchMathUnit6Regions;
if(!C||!RG){console.error('unit6-frq: load unit6-core.js and unit6-regions.js first');return;}
const {U5,Q,qv,K,ex,eadd,etex,fnc,fconst,bq,bn,region,areaTerms,sectionTerms,washerTerms,shellTerms,numValue,exactValue,exactAnswer,
 step,question,problem,figure,fixed,exactPart,numPart,integralPart,choicePart,listPart}=C;
const {pick,ri,shuffle,qadd,qmul,qtex}=U5;
const W=RG.work,V=()=>window.BatchMathUnit6Volume;
const frq=(parts,o)=>problem({...o,calculator:!!o.calc,questionHtml:question({context:o.context,prompt:o.prompt||'Answer each part.',formulas:o.formulas,calculator:!!o.calc,extra:o.extra||''}),parts});
// a negative rational part goes last (3\pi-6 rather than -6+3\pi)
const etexN=e=>{const r=e.get('1');return etex(e,r&&r.q.n<0&&e.size>1?{lead:'last'}:{});},ans=e=>({...exactAnswer(e),tex:etexN(e)});
const words=['zero','one','two','three','four','five','six','seven','eight'];
U5.profile('unit6-intervals',{parentheses:true,list:true,interval:true,brackets:false});
U5.profile('unit6-list-dec',{decimal:true,list:true});

// ---------- region free-response problems (non-calculator) ----------
const FRQ_EXACT=['pair','pair','underRoot','leftOfPower','underPower','sidewaysLine','rootLineAxis','cap','halfCap','wedge','triangle'];
const sliceable=(R,v)=>{const ps=v==='x'?R.xs:R.ys;return !!ps&&ps.every(p=>p.s2||(v==='x'?p.top.P&&p.bot.P:p.right.P&&p.left.P));};
function solidOf(R,type,method){ // an axis of the given direction that gives an exact volume with this method
 const axes=shuffle(V().axesFor(R,[type]));
 for(const axis of axes){const T=V().termsFor(R,method,axis);if(T&&exactValue(T))return{axis,T,e:exactValue(T)};}
 return null;
}
const rotWords=a=>V().axisWords(a);
function setupPart(R,method,s,named){
 const T=s.T,v=V().methodVar(method,s.axis),name=method==='shell'?'cylindrical shells':T[0].r?'washers':'disks';
 const prompt=named?`Using ${method==='shell'?'cylindrical shells':'the washer method'}, write, but do not evaluate, an integral expression for the volume of the solid generated when \\(R\\) is rotated about ${rotWords(s.axis)}.`
  :`Write, but do not evaluate, an integral expression for the volume of the solid generated when \\(R\\) is rotated about ${rotWords(s.axis)}.`;
 return integralPart(prompt,T,V().workFor(R,method,s.axis,T),named?{variable:v,methodNote:`That integral has the right value, but with ${name} about this axis you integrate with respect to ${v}.`}:{help:'Any correct method is accepted.'});
}
function famRegion(tier){
 for(let i=0;i<80;i++){
  const R=RG.build(pick(FRQ_EXACT)),four=tier==='challenging',parts=[];
  // the area: with dy when one dy integral replaces two dx integrals (x = y^2 and x = y + 2; sqrt(x), x - 2 and the x-axis)
  const vA=R.ys&&R.ys.length===1&&R.data.dyBetter?'y':'x';
  const TA=areaTerms(R,vA),eA=exactValue(TA);if(!eA)continue;
  if(vA==='y'&&four)parts.push(integralPart('Write, but do not evaluate, a single integral in terms of \\(y\\) for the area of \\(R\\).',TA,W.boundsStep(R)+W.areaWork(R,'y',TA),{variable:'y',max:1,methodNote:'That has the right value, but this part asks for one integral with respect to y.'}));
  parts.push(exactPart('Find the area of \\(R\\).',exactAnswer(eA),(parts.length?'':W.boundsStep(R)+W.areaWork(R,vA,TA))+W.evalWork(TA)));
  // the solids: cross sections, washers about a horizontal line, shells or washers about a vertical line
  const dirs=['x','y'].filter(v=>sliceable(R,v)),v=pick(dirs.length?dirs:['x']);
  const shape=V().shapeOf(pick(V().SH)),TC=sliceable(R,v)?sectionTerms(R,v,shape):null,eC=TC&&exactValue(TC);
  const wash=R.xs?solidOf(R,'y','washer'):null,shellV=R.xs?solidOf(R,'x','shell'):null,washV=R.ys?solidOf(R,'x','washer'):null;
  const cs=()=>pick([true,false])||!four?exactPart(`\\(R\\) is the base of a solid. Cross sections of the solid perpendicular to the ${v}-axis are ${shape.name}. Find the volume of the solid.`,exactAnswer(eC),W.sectionWork(R,v,shape,TC)+W.evalWork(TC))
   :integralPart(`\\(R\\) is the base of a solid. Cross sections of the solid perpendicular to the ${v}-axis are ${shape.name}. Write, but do not evaluate, an integral expression for the volume of the solid.`,TC,W.sectionWork(R,v,shape,TC),{variable:v,methodNote:`That has the right value, but cross sections perpendicular to the ${v}-axis are integrated with respect to ${v}.`});
  const plans=[];
  if(eC&&wash)plans.push(()=>[cs(),setupPart(R,'washer',wash,false)]);
  if(wash)plans.push(()=>[setupPart(R,'washer',wash,false),exactPart(`Find the volume of the solid generated when \\(R\\) is rotated about ${rotWords(wash.axis)}.`,exactAnswer(wash.e),W.evalWork(wash.T))]);
  if(eC&&shellV)plans.push(()=>[cs(),setupPart(R,'shell',shellV,true)]);
  if(four&&wash&&shellV)plans.push(()=>[setupPart(R,'washer',wash,false),setupPart(R,'shell',shellV,true),exactPart(`Find the volume of the solid generated when \\(R\\) is rotated about ${rotWords(shellV.axis)}.`,exactAnswer(shellV.e),W.evalWork(shellV.T))]);
  if(four&&eC&&wash&&(shellV||washV))plans.push(()=>[cs(),setupPart(R,'washer',wash,false),shellV?setupPart(R,'shell',shellV,true):setupPart(R,'washer',washV,true)]);
  if(!plans.length)continue;
  const more=pick(plans)();
  const all=[...parts,...more].slice(0,four?4:3);
  if(all.length<(four?4:3))continue;
  return frq(all,{engine:'frq',family:'frq_region',tier,id:`reg-${R.eqs.join('|')}-${all.length}`,context:`Let \\(R\\) be ${R.text}, as shown in the figure.`,formulas:R.eqs,
   extra:figure(R,{label:'Region R'}),data:{frq:'region',region:R.data.kind}});
 }
 throw Error('frq_region failed');
}

// f(x) = k/(1+x^2) and the line y = c (the line meets the curve at x = ±a, a = 1, sqrt 3 or 1/sqrt 3)
function famCapLine(tier){
 const A=pick(['1','1','sqrt3','isqrt3']),k=A==='1'?pick([2,4,6,8]):pick([4,8]);
 const a=A==='1'?1:A==='sqrt3'?Math.sqrt(3):1/Math.sqrt(3),aTex=A==='1'?'1':A==='sqrt3'?'\\sqrt{3}':'\\frac{1}{\\sqrt{3}}',c=A==='1'?k/2:A==='sqrt3'?k/4:3*k/4;
 const ang=A==='1'?'\\frac{\\pi}{4}':A==='sqrt3'?'\\frac{\\pi}{3}':'\\frac{\\pi}{6}';
 const f=fnc({tex:v=>`\\frac{${k}}{1+${v}^{2}}`,key:v=>`${k}/(1+${v}^2)`,f:t=>k/(1+t*t)}),line=fconst(c);
 const R=region({xs:[{a:A==='1'?bq(-1):bn(-a,`-${aTex}`),b:A==='1'?bq(1):bn(a,aTex),top:f,bot:line}],ys:null,xb:[-a,a],yb:[c,k],
  eqs:[`f(x)=\\frac{${k}}{1+x^{2}}`,`y=${c}`],text:`the region bounded by the graph of \\(f(x)=\\frac{${k}}{1+x^{2}}\\) and the horizontal line \\(y=${c}\\)`,
  view:{xmin:-4,xmax:4,ymin:-1,ymax:k+1},draw:[{f:f.f,tex:`y=\\frac{${k}}{1+x^{2}}`,dom:[-4,4]},{f:()=>c,tex:`y=${c}`,dom:[-4,4]}],data:{kind:'cap_line'}});
 const eA=A==='1'?eadd(ex(Q(k,2),K.pi),ex(Q(-k))):A==='sqrt3'?eadd(ex(Q(2*k,3),K.pi),ex(Q(-k,2),K.sqrt3)):eadd(ex(Q(k,3),K.pi),ex(Q(-k,2),K.sqrt3));
 const cross=step('Find where the curve meets the line.',`\\(\\frac{${k}}{1+x^{2}}=${c}\\) gives \\(1+x^{2}=${qtex(Q(k,c))}\\), so \\(x^{2}=${qtex(Q(k-c,c))}\\) and \\(x=\\pm ${aTex}\\).`);
 const areaW=cross+step('Set up and evaluate the area.',`On \\(\\left[-${aTex},${aTex}\\right]\\) the curve is above the line. An antiderivative of \\(\\frac{${k}}{1+x^{2}}\\) is \\(${k}\\tan^{-1}x\\).`,
  `A=\\int_{-${aTex}}^{${aTex}}\\left(\\frac{${k}}{1+x^{2}}-${c}\\right)dx`,`=\\left[${k}\\tan^{-1}x-${c}x\\right]_{-${aTex}}^{${aTex}}`,`=2\\left(${k}\\cdot${ang}-${c}\\cdot ${aTex}\\right)=${etexN(eA)}`);
 const parts=[exactPart('Find the area of \\(R\\).',ans(eA),areaW)];
 // a washer setup about a horizontal line above or below the region (not cutting it)
 const d=pick([pick([k,k+1,k+2]),pick([c-1,0,-1,-2].filter(t=>t<c))]),axis={type:'y',c:d},T=washerTerms(R,axis);
 parts.push(integralPart(`Write, but do not evaluate, an integral expression for the volume of the solid generated when \\(R\\) is rotated about ${d===0?'the x-axis':`the horizontal line \\(y=${d}\\)`}.`,T,W.washerWork(R,axis,T),{help:'Any correct method is accepted.'}));
 // h(x) = vertical distance from (x, f(x)) to the line; h'(x0)
 const x0=pick(A==='1'?[-3,-2,2,3,Q(1,2),Q(-1,2)]:A==='sqrt3'?[-2,2,3,1,-1]:[-2,-1,1,2]),xq=typeof x0==='number'?Q(x0):x0,xv=qv(xq);
 const inside=Math.abs(xv)<a,den=qmul(qadd(Q(1),qmul(xq,xq)),qadd(Q(1),qmul(xq,xq))),fp0=U5.qdiv(qmul(Q(-2*k),xq),den),hp=inside?fp0:qmul(fp0,Q(-1));
 const hW=step('Write h(x) without absolute values.',inside?`At \\(x=${qtex(xq)}\\), which lies between \\(-${aTex}\\) and \\(${aTex}\\), the curve is above the line, so \\(h(x)=f(x)-${c}\\) and \\(h'(x)=f'(x)\\).`
   :`At \\(x=${qtex(xq)}\\), outside \\(\\left[-${aTex},${aTex}\\right]\\), the curve is below the line, so \\(h(x)=${c}-f(x)\\) and \\(h'(x)=-f'(x)\\).`)
  +step('Differentiate.',`\\(f(x)=${k}\\left(1+x^{2}\\right)^{-1}\\), so \\(f'(x)=-\\frac{${2*k}x}{\\left(1+x^{2}\\right)^{2}}\\).`,`f'\\left(${qtex(xq)}\\right)=${qtex(fp0)}`,`h'\\left(${qtex(xq)}\\right)=${qtex(hp)}`);
 parts.push(exactPart(`Let \\(h(x)\\) be the vertical distance between the point \\((x,f(x))\\) and the line \\(y=${c}\\). Find the rate of change of \\(h(x)\\) with respect to \\(x\\) at \\(x=${qtex(xq)}\\).`,exactAnswer(ex(hp)),hW,{wrong:[{value:-qv(hp),note:'Check which is on top at this x-value: the distance is the top minus the bottom.'}]}));
 if(tier==='challenging'){const shape=V().shapeOf(pick(['square','semicircle_d','equilateral','iso_leg'])),TC=sectionTerms(R,'x',shape);
  parts.splice(2,0,integralPart(`\\(R\\) is the base of a solid whose cross sections perpendicular to the x-axis are ${shape.name}. Write, but do not evaluate, an integral expression for the volume of the solid.`,TC,W.sectionWork(R,'x',shape,TC),{variable:'x'}));}
 return frq(parts,{engine:'frq',family:'frq_cap_line',tier,id:`cap-${k}-${A}-${d}-${qtex(xq)}-${parts.length}`,context:`Let \\(f\\) be the function defined by \\(f(x)=\\frac{${k}}{1+x^{2}}\\). Let \\(R\\) be the region bounded by the graph of \\(f\\) and the horizontal line \\(y=${c}\\), as shown in the figure.`,
  extra:figure(R,{label:'Region R between the curve and the line'}),data:{frq:'region',region:'cap_line'}});
}

// ---------- region free-response problems (calculator) ----------
const FRQ_CALC=['logLine','logLine','logParabola','logParabola','expAxes','expParabola','cosParabola'];
const calcAxis=(R,type)=>{for(const axis of shuffle(V().axesFor(R,[type]))){const method=type==='y'?'washer':'shell',T=V().termsFor(R,method,axis);if(T)return{axis,T,method};}return null;};
function famCalc(tier){
 for(let i=0;i<60;i++){
  const R=RG.build(pick(FRQ_CALC)),four=tier==='challenging',kind=R.data.kind,parts=[];
  const cut=kind==='log_parabola'||kind==='exp_parabola'||kind==='cos_parabola';
  if(cut&&pick([true,false,four])){const vals=kind==='cos_parabola'?[-R.data.p,R.data.p]:[R.data.p,R.data.q];
   parts.push(listPart('Find the x-coordinates of the points where the two curves intersect. Give each value correct to three decimal places.',vals,vals.map(t=>fixed(t,3)),W.boundsStep(R,'Use the calculator to solve.'),{answer:{kind:'list',values:vals,places:3},keypadMode:'unit6-list-dec',placeholder:'Decimals separated by commas'}));}
  const TA=areaTerms(R,'x');
  parts.push(numPart(`Find the area of the region.`,numValue(TA),(parts.length?'':W.boundsStep(R))+W.areaWork(R,'x',TA)+W.calcWork(TA,'A')));
  const v=R.ys&&pick([true,false])?'y':'x',shape=V().shapeOf(pick(V().SH)),TC=sectionTerms(R,v,shape);
  const csPart=()=>numPart(`The region is the base of a solid. Cross sections perpendicular to the ${v}-axis are ${shape.name}. Find the volume of the solid.`,numValue(TC),W.sectionWork(R,v,shape,TC)+W.calcWork(TC));
  const h=calcAxis(R,'y'),vt=calcAxis(R,'x');
  const vol=(s,setup)=>{const words=rotWords(s.axis);if(setup)return[integralPart(`Write an integral expression for the volume of the solid generated when the region is revolved about ${words}. You may use decimal limits.`,s.T,V().workFor(R,s.method,s.axis,s.T),{help:'Any correct method is accepted; use stored values (at least four decimals) for limits found with the calculator.'}),numPart('Find the volume of that solid.',numValue(s.T),W.calcWork(s.T))];
   return[numPart(`Find the volume of the solid generated when the region is revolved about ${words}.`,numValue(s.T),V().workFor(R,s.method,s.axis,s.T)+W.calcWork(s.T))];};
  const opts=[];
  if(h)opts.push(()=>[csPart(),...vol(h,false)]);
  if(h&&vt)opts.push(()=>[...vol(h,false),...vol(vt,false)]);
  if(four&&h)opts.push(()=>[csPart(),...vol(h,true)]);
  if(four&&vt)opts.push(()=>[csPart(),...vol(vt,true)]);
  if(!opts.length)continue;
  const all=[...parts,...pick(opts)()].slice(0,four?4:3);
  if(all.length<3)continue;
  return frq(all,{engine:'frq',family:'frq_calc',tier,calc:true,id:`calc-${R.eqs.join('|')}-${all.map(p=>p.answerTex).join('|')}`,prompt:'Use your calculator. Answer each part.',
   context:`Let \\(S\\) be ${R.text}, as shown in the figure.`,formulas:R.eqs,extra:figure(R,{label:'Region S'}),data:{frq:'region',region:kind}});
 }
 throw Error('frq_calc failed');
}

// ---------- graph free-response problems ----------
// piece: {type:'seg'|'semi'|'quarter', a, b, ya, yb; arcs also cx, cy, r and s (+1: the arc lies above its center line)}
const sgn=t=>t>0?1:t<0?-1:0;
function fAt(p,x){return p.type==='seg'?p.ya+(p.yb-p.ya)*(x-p.a)/(p.b-p.a):p.cy+p.s*Math.sqrt(Math.max(0,p.r*p.r-(x-p.cx)**2));}
const dirStart=p=>p.type==='semi'?p.s:sgn(p.yb-p.ya),dirEnd=p=>p.type==='semi'?-p.s:sgn(p.yb-p.ya);
function nextPiece(type,a,ya){
 if(type==='seg'){
  for(let k=0;k<40;k++){
   const w=pick([1,2,2,3]),yb=ri(-3,3);if(yb===ya||Math.abs(yb-ya)/w>3)continue;
   if(ya*yb<0){const z=w*Math.abs(ya)/(Math.abs(ya)+Math.abs(yb));if(Math.abs(z-Math.round(z))>1e-9)continue;} // crosses the x-axis at a grid point
   return{type,a,b:a+w,ya,yb};
  }
  return null;
 }
 if(type==='semi'){ // stays on one side of the x-axis; it may touch it at its lowest or highest point
  const r=pick([1,2]),s=pick([1,-1]),h=ya,far=h+s*r;
  if(!(h===0||far===0||sgn(h)===sgn(far))||Math.abs(far)>4)return null;
  return{type,a,b:a+2*r,ya:h,yb:h,cx:a+r,cy:h,r,s};
 }
 const r=pick([1,2]),yb=ya+pick([1,-1])*r; // a quarter circle does not cross the x-axis inside
 if(Math.abs(yb)>3||ya*yb<0)return null;
 return pick([true,false])?{type,a,b:a+r,ya,yb,cx:a,cy:yb,r,s:sgn(ya-yb)}:{type,a,b:a+r,ya,yb,cx:a+r,cy:ya,r,s:sgn(yb-ya)};
}
// signed area of a whole piece, exactly: q + p*pi
function pieceArea(p){
 if(p.type==='seg')return{q:Q((p.b-p.a)*(p.ya+p.yb),2),p:Q(0)};
 if(p.type==='semi')return{q:Q(2*p.r*p.cy),p:Q(p.s*p.r*p.r,2)};
 return{q:Q(p.r*p.cy),p:Q(p.s*p.r*p.r,4)};
}
const qp0={q:Q(0),p:Q(0)},qpAdd=(u,w)=>({q:qadd(u.q,w.q),p:qadd(u.p,w.p)}),qpNeg=u=>({q:qmul(u.q,Q(-1)),p:qmul(u.p,Q(-1))});
const toE=u=>eadd(ex(u.q),ex(u.p,K.pi));
const qpTex=u=>etexN(toE(u)),qpVal=u=>qv(u.q)+qv(u.p)*Math.PI;
// the integral of f from the left end L to x (x a vertex, a grid point on a segment or the center of a semicircle)
function cum(G,x){
 let s=qp0;
 for(const p of G.pieces){
  if(x<=p.a)break;
  if(x>=p.b){s=qpAdd(s,pieceArea(p));continue;}
  if(p.type==='seg'){const fx=Q(p.ya*(p.b-p.a)+(p.yb-p.ya)*(x-p.a),p.b-p.a);s=qpAdd(s,{q:qmul(Q(x-p.a,2),qadd(Q(p.ya),fx)),p:Q(0)});}
  else if(p.type==='semi'&&x===p.cx)s=qpAdd(s,{q:Q(p.r*p.cy),p:Q(p.s*p.r*p.r,4)});
  else throw Error(`no exact value of the integral at x = ${x}`);
  break;
 }
 return s;
}
const fExact=(G,x)=>{const p=G.pieces.find(q=>x>=q.a&&x<=q.b);return p.type==='seg'?Q(p.ya*(p.b-p.a)+(p.yb-p.ya)*(x-p.a),p.b-p.a):Q(Math.round(fAt(p,x)));};
const PLANS=[['semi'],['semi'],['quarter','quarter'],['quarter','quarter'],['semi','quarter']];
function buildGraph(){
 for(let t=0;t<800;t++){
  const arcs=pick(PLANS),plan=shuffle([...arcs,...Array(arcs.length===1?4:pick([3,4])).fill('seg')]);
  if(arcs.length===2&&arcs[0]==='quarter'&&pick([true,false])){const i=plan.indexOf('quarter'),j=plan.lastIndexOf('quarter');if(j!==i+1){plan.splice(j,1);plan.splice(i+1,0,'quarter');}} // the S-shaped pair of the tests
  const L=pick([-6,-5,-4]);let x=L,y=ri(-2,2);const pieces=[];let ok=true;
  for(const type of plan){const p=nextPiece(type,x,y);if(!p){ok=false;break;}pieces.push(p);x=p.b;y=p.yb;}
  if(!ok)continue;const R=x;if(R-L<8||R-L>14||R>8)continue;
  const G=analyze(pieces,L,R);if(usable(G))return G;
 }
 throw Error('graph generation failed');
}
// a generated graph: crosses the x-axis both ways (at least one sign change of f), two to five inflection points of g,
// at most four extrema, and fits the figure (as the tests' graphs do)
const usable=G=>G.ymax-G.ymin<=7&&G.ymax>=1&&G.ymin<=-1&&G.poi.length>=2&&G.poi.length<=5&&G.maxes.length+G.mins.length>=1&&G.maxes.length+G.mins.length<=4;
function analyze(pieces,L,R){
 const G={pieces,L,R};
 let ymin=0,ymax=0;for(const p of pieces){for(const yv of [p.ya,p.yb,p.type==='seg'?p.ya:p.cy+p.s*p.r]){ymin=Math.min(ymin,yv);ymax=Math.max(ymax,yv);}}
 G.ymin=ymin;G.ymax=ymax;
 // sign runs of f, zeros, sign changes (local extrema of g)
 const runs=[],zerosAt=new Set(),touch=[];
 for(const p of pieces){
  if(p.type==='seg'&&p.ya*p.yb<0){const z=p.a+(p.b-p.a)*Math.abs(p.ya)/(Math.abs(p.ya)+Math.abs(p.yb));runs.push([p.a,z,sgn(p.ya)],[z,p.b,sgn(p.yb)]);zerosAt.add(Math.round(z));}
  else if(p.type==='semi'){runs.push([p.a,p.b,p.cy===0?p.s:sgn(p.cy)]);if(p.cy+p.s*p.r===0){zerosAt.add(p.cx);touch.push(p.cx);}}
  else runs.push([p.a,p.b,sgn(p.ya+p.yb)]);
  for(const e of [p.a,p.b])if(fAt(p,e)===0)zerosAt.add(e);
 }
 const merged=[];for(const r of runs){const last=merged[merged.length-1];if(last&&last[2]===r[2])last[1]=r[1];else merged.push([...r]);}
 const maxes=[],mins=[];for(let i=0;i+1<merged.length;i++){const z=merged[i][1];if(merged[i][2]>0&&merged[i+1][2]<0)maxes.push(z);else if(merged[i][2]<0&&merged[i+1][2]>0)mins.push(z);}
 // isolated zeros inside a run (f touches the axis without changing sign)
 const flat=[...zerosAt].filter(z=>z>L&&z<R&&!maxes.includes(z)&&!mins.includes(z));
 // points of inflection: f changes direction (at a vertex, or at the middle of a semicircle)
 const poi=[],corners=[];
 for(let i=0;i+1<pieces.length;i++){const v=pieces[i].b;if(dirEnd(pieces[i])!==dirStart(pieces[i+1]))poi.push(v);else corners.push(v);}
 for(const p of pieces)if(p.type==='semi')poi.push(p.cx);
 poi.sort((u,w)=>u-w);
 // grid points where the integral is exact
 const pts=new Set();for(const p of pieces){if(p.type==='seg')for(let x=p.a;x<=p.b;x++)pts.add(x);else{pts.add(p.a);pts.add(p.b);if(p.type==='semi')pts.add(p.cx);}}
 const crit=[...new Set([...maxes,...mins,...flat])].sort((u,w)=>u-w);
 Object.assign(G,{runs:merged,maxes,mins,flat,touch,poi,corners,crit,points:[...pts].sort((u,w)=>u-w)});
 return G;
}
// g(x) = g(c) + ∫_c^x f
function gOf(G,x){return qpAdd({q:Q(G.k),p:Q(0)},qpAdd(cum(G,x),qpNeg(cum(G,G.c))));}
function pieceText(G){
 const n=G.pieces.filter(p=>p.type==='seg').length,semis=G.pieces.filter(p=>p.type==='semi').length,qs=G.pieces.filter(p=>p.type==='quarter').length;
 const items=[`${words[n]} line segments`,semis?(semis===1?'a semicircle':`${words[semis]} semicircles`):'',qs?(qs===1?'a quarter circle':`${words[qs]} quarter circles`):''].filter(Boolean);
 return list(items);
}
function graphFigure(G,label){
 const xmin=G.L-1,xmax=G.R+1,ymin=Math.min(-1,G.ymin)-1,ymax=Math.max(1,G.ymax)+1,Wd=440,s=Wd/(xmax-xmin),Hd=Math.round(s*(ymax-ymin));
 const X=x=>((x-xmin)*s).toFixed(1),Y=y=>((ymax-y)*s).toFixed(1),out=[];
 for(let x=xmin;x<=xmax;x++)out.push(`<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="${Hd}" class="u6-grid"/>`);
 for(let y=ymin;y<=ymax;y++)out.push(`<line x1="0" y1="${Y(y)}" x2="${Wd}" y2="${Y(y)}" class="u6-grid"/>`);
 out.push(`<line x1="0" y1="${Y(0)}" x2="${Wd}" y2="${Y(0)}" class="u6-axis"/>`);
 if(xmin<0&&xmax>0)out.push(`<line x1="${X(0)}" y1="0" x2="${X(0)}" y2="${Hd}" class="u6-axis"/>`);
 const xstep=xmax-xmin>12?2:1;
 for(let x=xmin+1;x<xmax;x++)if(x!==0&&x%xstep===0)out.push(`<text x="${X(x)}" y="${(+Y(0)+14).toFixed(1)}" class="u6-tick">${x}</text>`);
 for(let y=ymin+1;y<ymax;y++)if(y!==0)out.push(`<text x="${(xmin<0&&xmax>0?+X(0)-5:12).toFixed(1)}" y="${(+Y(y)+4).toFixed(1)}" class="u6-tick u6-tick-y">${y}</text>`);
 const d=[`M${X(G.pieces[0].a)} ${Y(G.pieces[0].ya)}`];
 for(const p of G.pieces){
  if(p.type==='seg'){d.push(`L${X(p.b)} ${Y(p.yb)}`);continue;}
  let t0,t1;
  if(p.type==='semi'){t0=Math.PI;t1=p.s>0?0:2*Math.PI;}
  else if(p.cx===p.a){t0=p.s>0?Math.PI/2:3*Math.PI/2;t1=p.s>0?0:2*Math.PI;}
  else{t0=Math.PI;t1=p.s>0?Math.PI/2:3*Math.PI/2;}
  for(let i=1;i<=48;i++){const t=t0+(t1-t0)*i/48;d.push(`L${X(p.cx+p.r*Math.cos(t))} ${Y(p.cy+p.r*Math.sin(t))}`);}
 }
 out.push(`<path d="${d.join(' ')}" class="u6-curve u6-graph-f"/>`);
 return `<figure class="u6-figure u6-graph-figure"><svg viewBox="0 0 ${Wd} ${Hd}" role="img" aria-label="${label}" class="u6-svg">${out.join('')}</svg><figcaption class="u6-legend"><span class="u6-key"><span class="u6-swatch u6-swatch-f"></span>Graph of \\(f\\)</span></figcaption></figure>`;
}
// the signed areas from lo to hi, piece by piece (split at grid crossings), for the explanation
function areaLines(G,lo,hi){
 const cuts=new Set([lo,hi]);for(const p of G.pieces){if(p.a>lo&&p.a<hi)cuts.add(p.a);if(p.type==='seg'&&p.ya*p.yb<0){const z=Math.round(p.a+(p.b-p.a)*Math.abs(p.ya)/(Math.abs(p.ya)+Math.abs(p.yb)));if(z>lo&&z<hi)cuts.add(z);}}
 const xs=[...cuts].sort((u,w)=>u-w),lines=[];
 for(let i=0;i+1<xs.length;i++){const u=xs[i],w=xs[i+1],p=G.pieces.find(q=>u>=q.a&&w<=q.b),val=qpAdd(cum(G,w),qpNeg(cum(G,u)));
  let what;
  if(p.type==='seg'){const fu=fAt(p,u),fw=fAt(p,w);what=`${fu===0||fw===0?'triangle':'trapezoid'} ${fu+fw>0?'above':'below'} the x-axis`;}
  else{const part=w-u===2*p.r?'semicircle':'quarter circle';what=p.cy===0?`${part} ${p.s>0?'above':'below'} the x-axis (area \\(\\frac{\\pi r^{2}}{${part==='semicircle'?2:4}}\\) with \\(r=${p.r}\\))`:`rectangle of height \\(${Math.abs(p.cy)}\\) ${p.s*p.cy>0?'plus':'minus'} a ${part==='semicircle'?'half':'quarter'} disk of radius \\(${p.r}\\)`;}
  lines.push({tex:`\\int_{${u}}^{${w}}f(x)\\,dx=${qpTex(val)}`,what});}
 return lines;
}
function valueWork(G,x,derivative){
 const g=gOf(G,x),lo=Math.min(x,G.c),hi=Math.max(x,G.c),lines=areaLines(G,lo,hi),I=qpAdd(cum(G,hi),qpNeg(cum(G,lo)));
 const ftc=derivative?`By the Fundamental Theorem of Calculus, \\(g(${x})=g(${G.c})+\\int_{${G.c}}^{${x}}f(x)\\,dx\\).`:`\\(g(${x})=\\int_{${G.c}}^{${x}}f(t)\\,dt\\).`;
 return step('Use the graph of f.',`${ftc} The integral is the signed area between the graph of \\(f\\) and the x-axis: regions above the axis count as positive, regions below as negative.${x<G.c?` Because \\(${x}<${G.c}\\), \\(\\int_{${G.c}}^{${x}}f=-\\int_{${x}}^{${G.c}}f\\).`:''}`)
  +step('Add the signed areas.',lines.map(l=>`\\(${l.tex}\\) (${l.what})`).join('; ')+'.',`\\int_{${lo}}^{${hi}}f(x)\\,dx=${qpTex(I)}`,
   `g(${x})=${derivative?G.k:''}${x<G.c?'-':derivative?'+':''}\\left(${qpTex(I)}\\right)=${qpTex(g)}`);
}
const list=a=>a.length===1?`${a[0]}`:a.length===2?`${a[0]} and ${a[1]}`:`${a.slice(0,-1).join(', ')} and ${a[a.length-1]}`;
const mathList=a=>list(a.map(t=>`\\(x=${t}\\)`));
function poiParts(G){
 const why=G.poi.map(x=>{const semi=G.pieces.find(p=>p.type==='semi'&&p.cx===x);if(semi)return `at \\(x=${x}\\) (the ${semi.s<0?'lowest':'highest'} point of the semicircle) \\(f\\) changes from ${semi.s<0?'decreasing to increasing':'increasing to decreasing'}`;
  const i=G.pieces.findIndex(p=>p.b===x),l=dirEnd(G.pieces[i]);return `at \\(x=${x}\\) \\(f\\) changes from ${l>0?'increasing to decreasing':'decreasing to increasing'}`;});
 const expl=step('Connect g to the graph of f.','Since \\(g\'=f\\), \\(g\'\'=f\'\\). The graph of \\(g\\) has a point of inflection where \\(g\'\'\\) changes sign, that is, where \\(f\\) changes from increasing to decreasing or from decreasing to increasing.')
  +step('Read the graph.',`${why.join('; ').replace(/^./,c=>c.toUpperCase())}.${G.corners.length?` At ${mathList(G.corners)} the graph of \\(f\\) has a corner but keeps the same direction, so \\(g\'\'\\) does not change sign there.`:''}${G.flat.length||G.maxes.length?' A zero of \\(f\\) is not a point of inflection by itself.':''}`)
  +step('A complete written answer.',`\\(g\\) has points of inflection at ${mathList(G.poi)} because \\(g'=f\\) changes from increasing to decreasing or from decreasing to increasing there, so \\(g''\\) changes sign.`);
 const choices=['\\(g\'\'=f\'\\) changes sign there: \\(f\\) changes from increasing to decreasing or from decreasing to increasing.','\\(g\'=f\\) changes sign there: the graph of \\(f\\) crosses the x-axis.','\\(g\'=f\\) is equal to 0 there.','The graph of \\(f\\) has a corner there.'];
 const order=shuffle([0,1,2,3]);
 return[listPart(`For what values of \\(x\\) on \\((${G.L},${G.R})\\) does \\(g\\) have a point of inflection? Enter every value, separated by commas.`,G.poi,G.poi.map(String),expl,{placeholder:'x-values separated by commas',
   answer:{kind:'list',values:G.poi,extraNote:'At least one of your values is not a point of inflection: check that f changes direction there, not just that it has a corner or a zero.'}}),
  choicePart('Which statement explains why \\(g\\) has a point of inflection at each of these values?',order.map(i=>choices[i]),order.indexOf(0),step('Reason.','A point of inflection of \\(g\\) needs \\(g\'\'\\) to change sign. Because \\(g\'\'=f\'\\), that happens where \\(f\\) changes direction. Sign changes of \\(f\\) itself give the local maxima and minima of \\(g\\) instead.'))];
}
function extremaParts(G,kind){
 const xs=kind==='max'?G.maxes:G.mins,other=kind==='max'?G.mins:G.maxes,word=kind==='max'?'maximum':'minimum',from=kind==='max'?'positive to negative':'negative to positive';
 const expl=step('Use the sign of g\'.',`\\(g'=f\\). \\(g\\) has a local ${word} where \\(g'\\) changes from ${from}: the graph of \\(f\\) crosses the x-axis ${kind==='max'?'going down':'going up'} at ${mathList(xs)}.${other.length?` At ${mathList(other)} \\(f\\) changes from ${kind==='max'?'negative to positive':'positive to negative'}, giving a local ${kind==='max'?'minimum':'maximum'} instead.`:''}${G.flat.length?` At ${mathList(G.flat)} \\(f=0\\) but does not change sign, so there is no extremum there.`:''}`)
  +step('A complete written answer.',`\\(g\\) has a local ${word} at ${mathList(xs)} because \\(g'=f\\) changes from ${from} there.`);
 const choices=[`\\(g'=f\\) changes from ${from} there.`,`\\(g'=f\\) changes from ${kind==='max'?'negative to positive':'positive to negative'} there.`,`\\(f\\) changes from ${kind==='max'?'increasing to decreasing':'decreasing to increasing'} there.`,`\\(f\\) has a local ${word} there.`];
 const order=shuffle([0,1,2,3]);
 return[listPart(`For what values of \\(x\\) on \\((${G.L},${G.R})\\) does \\(g\\) have a local ${word}? Enter every value, separated by commas.`,xs,xs.map(String),expl,{placeholder:'x-values separated by commas',answer:{kind:'list',values:xs,extraNote:`At least one of your values is not a local ${word} of g.`}}),
  choicePart(`Which statement explains why \\(g\\) has a local ${word} at each of these values?`,order.map(i=>choices[i]),order.indexOf(0),step('Reason.',`The extrema of \\(g\\) come from sign changes of \\(g'=f\\). Changes in the direction of \\(f\\) give points of inflection of \\(g\\), not extrema.`))];
}
function absolutePart(G,kind,derivative){
 const cand=[...new Set([G.L,...G.crit,G.R])].sort((u,w)=>u-w),vals=cand.map(x=>({x,g:gOf(G,x)}));
 const best=vals.reduce((b,v)=>kind==='max'?(qpVal(v.g)>qpVal(b.g)+1e-12?v:b):(qpVal(v.g)<qpVal(b.g)-1e-12?v:b));
 const at=vals.filter(v=>Math.abs(qpVal(v.g)-qpVal(best.g))<1e-12).map(v=>v.x),word=kind==='max'?'maximum':'minimum';
 const expl=step('Candidates Test.',`An absolute ${word} on a closed interval occurs at an endpoint or at a critical point. \\(g'=f=0\\) at ${mathList(G.crit)}; the endpoints are \\(x=${G.L}\\) and \\(x=${G.R}\\).`)
  +step('Evaluate g at each candidate.',`Use ${derivative?`\\(g(x)=${G.k}+\\int_{${G.c}}^{x}f(t)\\,dt\\)`:`\\(g(x)=\\int_{${G.c}}^{x}f(t)\\,dt\\)`} with the signed areas from the graph.`,...vals.map(v=>`g(${v.x})=${qpTex(v.g)}${Math.abs(qpVal(v.g)-Math.round(qpVal(v.g)))>1e-9?`\\approx ${fixed(qpVal(v.g),2)}`:''}`))
  +step('A complete written answer.',`The absolute ${word} of \\(g\\) on \\([${G.L},${G.R}]\\) is \\(${qpTex(best.g)}\\), at ${mathList(at)}, the ${kind==='max'?'largest':'smallest'} of the values of \\(g\\) at the critical points and endpoints.`);
 const others=vals.filter(v=>!at.includes(v.x)).map(v=>({value:qpVal(v.g),note:`That is \\(g(${v.x})\\), but it is not the ${kind==='max'?'largest':'smallest'} value of \\(g\\) on the interval. Compare g at every critical point and both endpoints.`}));
 return exactPart(`Find the absolute ${word} value of \\(g\\) on the interval \\([${G.L},${G.R}]\\).`,ans(toE(best.g)),expl,{wrong:others});
}
function limitPart(G){ // lim (g(x) + m x + n)/(x^2 - x0^2) as x -> x0, with g(x0) + m x0 + n = 0 (tests 2025-26)
 for(let i=0;i<30;i++){
  const x0=pick(G.points.filter(x=>x!==0&&x>G.L&&x<G.R)),g0=gOf(G,x0);if(!U5.qzero(g0.p)||g0.q.d!==1)continue;
  const mm=pick([-4,-3,-2,2,3,4]),n=-(g0.q.n+mm*x0),f0=fExact(G,x0),val=U5.qdiv(qadd(f0,Q(mm)),Q(2*x0));
  const num=`g(x)${mm<0?'-':'+'}${Math.abs(mm)}x${n?(n<0?'-':'+')+Math.abs(n):''}`;
  const expl=step('Check the form.',`\\(g(${x0})=${qpTex(g0)}\\), so the numerator approaches \\(${qpTex(g0)}${mm<0?'-':'+'}${Math.abs(mm)}(${x0})${n?(n<0?'-':'+')+Math.abs(n):''}=0\\) and the denominator approaches \\(${x0*x0}-${x0*x0}=0\\). The limit has the form \\(\\frac{0}{0}\\).`)
   +step("Apply L'Hôpital's Rule.",`Differentiate the numerator and the denominator; \\(g'=f\\).`,`\\lim_{x\\to ${x0}}\\frac{f(x)${mm<0?'-':'+'}${Math.abs(mm)}}{2x}=\\frac{${qtex(f0)}${mm<0?'-':'+'}${Math.abs(mm)}}{${2*x0}}=${qtex(val)}`);
  return exactPart(`Find \\(\\displaystyle\\lim_{x\\to ${x0}}\\frac{${num}}{x^{2}-${x0*x0}}\\).`,exactAnswer(ex(val)),expl);
 }
 return null;
}
function secondPart(G){ // g''(x0) is the slope of f at a grid point inside a segment
 const opts=[];for(const p of G.pieces)if(p.type==='seg')for(let x=p.a+1;x<p.b;x++)opts.push({x,p});
 if(!opts.length)return null;const {x,p}=pick(opts),sl=Q(p.yb-p.ya,p.b-p.a);
 return exactPart(`Find \\(g''(${x})\\).`,exactAnswer(ex(sl)),step('Use the slope of f.',`\\(g''(x)=f'(x)\\), the slope of the graph of \\(f\\). At \\(x=${x}\\) the graph is the segment from \\((${p.a},${p.ya})\\) to \\((${p.b},${p.yb})\\).`,`g''(${x})=\\frac{${p.yb}-(${p.ya})}{${p.b}-(${p.a})}=${qtex(sl)}`),{wrong:[{value:qv(fExact(G,x)),note:'That is f(x) = g′(x). g″ is the slope of the graph of f.'}]});
}
function increasingPart(G){
 const ups=G.runs.filter(r=>r[2]>0);if(!ups.length||G.flat.some(z=>ups.some(r=>z>r[0]&&z<r[1])))return null; // a touching zero inside would allow a second correct answer
 const tex=ups.map(r=>`(${r[0]},${r[1]})`).join('\\cup ');
 return{prompt:`On what open intervals is \\(g\\) increasing? Use \\(\\cup\\) between intervals.`,control:'input',answer:{kind:'interval',variable:'x',anyBrackets:true,parts:ups.map(r=>({left:String(r[0]),right:String(r[1])}))},answerTex:tex,keypadMode:'unit6-intervals',placeholder:'e.g. (-5,-2)∪(1,4)',
  explanation:step('Use the sign of g\'.',`\\(g'=f\\), so \\(g\\) is increasing where the graph of \\(f\\) is above the x-axis: \\(${tex}\\).`)};
}
function graphContext(G,derivative){
 const what=pieceText(G);
 return derivative?`The graph of \\(f\\), the derivative of \\(g\\), is shown below for \\(${G.L}\\le x\\le ${G.R}\\). It consists of ${what}. The function \\(g\\) is defined on \\([${G.L},${G.R}]\\) with \\(g'(x)=f(x)\\), and \\(g(${G.c})=${G.k}\\).`
  :`The function \\(f\\) is shown below on the interval \\([${G.L},${G.R}]\\). It consists of ${what}. The function \\(g\\) is defined by \\(g(x)=\\displaystyle\\int_{${G.c}}^{x}f(t)\\,dt\\).`;
}
// the graph itself, kept with the problem for the review lab and QA
const graphData=G=>({L:G.L,R:G.R,c:G.c,k:G.k,pieces:G.pieces.map(p=>({...p}))});
function famGraphDerivative(tier){
 for(let i=0;i<40;i++){
  const G=buildGraph();G.c=G.points.includes(0)?0:pick(G.points.filter(x=>x>G.L&&x<G.R));G.k=ri(-3,4);
  const x1=pick([G.R,G.R,G.L,...G.points.filter(x=>x!==G.c)]),parts=[exactPart(`Find \\(g(${x1})\\).`,ans(toE(gOf(G,x1))),valueWork(G,x1,true))];
  parts.push(...poiParts(G),absolutePart(G,pick(['max','min']),true));
  const last=tier==='challenging'?limitPart(G)||secondPart(G):pick([true,false])?secondPart(G):null;
  if(last)parts.push(last);
  return frq(parts,{engine:'frq',family:'graph_derivative',tier,id:`gd-${G.pieces.map(p=>`${p.type}${p.a}${p.ya}${p.yb}${p.s||''}${p.cx??''}`).join('')}-${G.c}-${G.k}-${x1}-${parts.length}`,
   context:graphContext(G,true),extra:graphFigure(G,'Graph of f, made of line segments and circular arcs'),data:{frq:'graph',graph:'derivative',...graphData(G)}});
 }
 throw Error('graph_derivative failed');
}
function famGraphAccum(tier){
 for(let i=0;i<40;i++){
  const G=buildGraph(),inner=G.points.filter(x=>x>G.L&&x<G.R);G.c=pick(inner);G.k=0;
  const left=G.points.filter(x=>x<G.c),right=G.points.filter(x=>x>G.c);if(!left.length||!right.length)continue;
  const x1=pick([G.L,...left]),x2=pick([G.R,...right]),parts=[exactPart(`Find \\(g(${x1})\\).`,ans(toE(gOf(G,x1))),valueWork(G,x1,false))];
  if(tier==='challenging')parts.push(exactPart(`Find \\(g(${x2})\\).`,ans(toE(gOf(G,x2))),valueWork(G,x2,false)));
  const ext=pick([...(G.maxes.length?['max']:[]),...(G.mins.length?['min']:[])]),inc=increasingPart(G);
  if(tier==='challenging')parts.push(...poiParts(G),extremaParts(G,ext)[0]);
  else parts.push(...(pick([true,false])?poiParts(G):extremaParts(G,ext)));
  if(tier!=='challenging'&&inc&&pick([true,false,false]))parts.push(inc);
  parts.push(absolutePart(G,ext==='max'?'min':'max',false));
  return frq(parts,{engine:'frq',family:'graph_accum',tier,id:`ga-${G.pieces.map(p=>`${p.type}${p.a}${p.ya}${p.yb}${p.s||''}${p.cx??''}`).join('')}-${G.c}-${x1}-${x2}-${parts.length}`,
   context:graphContext(G,false),extra:graphFigure(G,'Graph of f, made of line segments and circular arcs'),data:{frq:'graph',graph:'accumulation',...graphData(G)}});
 }
 throw Error('graph_accum failed');
}

const FAMILIES={
 frq_region:{weight:30,tiers:['intermediate','challenging'],make:famRegion,calculator:false},
 frq_cap_line:{weight:12,tiers:['intermediate','challenging'],make:famCapLine,calculator:false},
 graph_derivative:{weight:15,tiers:['intermediate','challenging'],make:famGraphDerivative,calculator:false},
 graph_accum:{weight:15,tiers:['intermediate','challenging'],make:famGraphAccum,calculator:false},
 frq_calc:{weight:28,tiers:['intermediate','challenging'],make:famCalc,calculator:true},
};
const MODES={region:{families:{frq_region:true,frq_cap_line:true,frq_calc:true}},graph:{families:{graph_derivative:true,graph_accum:true}}};
const engine=U5.makeEngine('unit6-frq',FAMILIES,MODES);
window.BatchMathUnit6FRQ=Object.freeze({make:engine.make,FAMILIES,MODES,buildGraph,analyze,gOf,cum,fAt,pieceArea,graphFigure,qpVal,qpTex});
})();
