/* BatchMath v12.9.A — Unit 6 engines: Volume by Cross Sections and Solids of Revolution.
   Volume by Cross Sections (slices perpendicular to the x-axis or the y-axis, about equally often)
     cs_basic    find the volume (exact); intermediate problems first ask for the cross-sectional area A(x) or A(y)
     cs_setup    "Write, but do not evaluate, an integral expression" (tests), including regions that need two integrals
     cs_calc     calculator: regions whose intersections need the calculator (tests: 2 ln(x+1), -x + 3, the x-axis)
     Shapes: squares, rectangles (height a multiple of the base), semicircles (diameter or radius across the region),
     quarter circles, equilateral triangles, isosceles right triangles (leg or hypotenuse across the region).
   Solids of Revolution (the teacher's convention: disks/washers about a horizontal axis use dx, about a vertical axis
   dy; shells the other way round)
     disk_basic  regions touching the axis: disks about the x-axis or the y-axis (exact)
     washer      washers about the axes and about shifted lines y = c and x = c; radii measured from the axis
     shells      vertical shells (dx) about vertical lines, horizontal shells (dy) about horizontal lines; some
                 intermediate problems ask for the radius r and the height h first
     two_axes    one region, two rotations: a washer setup and a shell setup about different lines, then a volume
     trig_solid  y = A + sin x on [0, pi/2] about y = -c or y = d (assignment: answers with pi^2)
     solid_calc  calculator: 1 + ln x with x^2 - 1, e^{kx} with the axes, 2 ln(x+1) with a line, cos x with x^2; the
                 v10.6 calculator solids */
(function(){
'use strict';
const C=window.BatchMathUnit6Core,RG=window.BatchMathUnit6Regions;
if(!C||!RG){console.error('unit6-volume: load unit6-core.js and unit6-regions.js first');return;}
const {U5,Q,qv,K,ex,eadd,etex,P,pc,pm,fp,fnc,fconst,bq,bn,region,sectionTerms,washerTerms,shellTerms,SHAPES,rectShape,setupTex,numValue,exactValue,exactAnswer,
 step,m,question,problem,figure,quad,fixed,exactPart,numPart,integralPart,exprPart,choicePart,factorTex}=C;
const {pick,ri}=U5,W=RG.work;
const one=(prompt0,parts,o)=>{const prompt=parts.length>1?prompt0:(o.calc?'Use your calculator.':'');return problem({...o,calculator:!!o.calc,questionHtml:question({context:o.context,prompt,formulas:o.formulas,calculator:!!o.calc,extra:o.extra||''}),parts});};
const SH=['square','square','semicircle_d','quarter','equilateral','iso_leg','iso_hyp','rect2','rect3','semicircle_r'];
const shapeOf=n=>n==='rect2'?rectShape(2):n==='rect3'?rectShape(3):SHAPES[n];
const EXACT_CS=['cap','halfCap','semicircle','disk','triangle','pair','underRoot','underPower','leftOfPower'];
// can the region be sliced in this direction with an exact volume?
const sliceable=(R,v)=>{const ps=v==='x'?R.xs:R.ys;if(!ps)return false;return ps.every(p=>p.s2||(v==='x'?p.top.P&&p.bot.P:p.right.P&&p.left.P));};
function csPick(exact=true){
 for(let i=0;i<40;i++){const R=RG.build(pick(EXACT_CS)),v=pick(['x','y']);if(sliceable(R,v))return{R,v};}
 throw Error('no sliceable region');
}
const where=v=>v==='x'?'perpendicular to the x-axis':'perpendicular to the y-axis';
function csContext(R,v,shape){return `The base of a solid is ${R.text}. Cross sections ${where(v)} are ${shape.name}.`;}
// the cross-sectional area as a function, for typed A(x) / A(y) answers
function areaFn(T,shape,v){const t=T[0],k=C.U5?shape.k:shape.k,kv=qv(k.q)*(k.atom?k.atom.val:1);
 return fnc({tex:()=>shape.area(t.stex),key:()=>'',f:z=>kv*t.g.f(z)});}

function famCsBasic(tier){
 const {R,v}=csPick(),shape=shapeOf(pick(SH)),T=sectionTerms(R,v,shape),e=exactValue(T);if(!e)throw Error('not exact');
 const work=W.boundsStep(R)+W.sectionWork(R,v,shape,T)+W.evalWork(T);
 const parts=tier==='foundational'||T.length>1?[exactPart('Find the volume of the solid.',exactAnswer(e),work)]
  :[exprPart(`Write the area of a cross section as a function of ${v}.`,`A(${v})=`,areaFn(T,shape,v),v,[T[0].a.v,T[0].b.v],W.boundsStep(R)+W.sectionWork(R,v,shape,T).split('Set up the volume.')[0].replace(/<div class="u4-work-step"><strong>$/,'')),exactPart('Find the volume of the solid.',exactAnswer(e),W.sectionWork(R,v,shape,T)+W.evalWork(T))];
 return one('Answer each part.',parts,{engine:'cross_sections',family:'cs_basic',tier,id:`csb-${R.eqs.join('|')}-${v}-${shape.name}`,context:csContext(R,v,shape),formulas:R.eqs,extra:tier!=='foundational'&&pick([true,false])?figure(R,{label:'The base of the solid'}):'',data:{dir:v,shape:shape.name,region:R.data.kind}});
}
// y = e^x, y = 1 and x = s (tests: setups in both directions)
function expBase(){
 const s=pick([1,2]),top=fnc({tex:()=>'e^{x}',key:()=>'e^x',f:Math.exp});
 return region({xs:[{a:bq(0),b:bq(s),top,bot:fconst(1)}],ys:[{a:bq(1),b:bn(Math.exp(s),s===1?'e':`e^{${s}}`),right:fconst(s),left:fnc({tex:()=>'\\ln y',key:()=>'ln(y)',f:Math.log})}],
  eqs:['y=e^{x}','y=1',`x=${s}`],text:`the region enclosed between \\(y=e^{x}\\), \\(y=1\\) and \\(x=${s}\\)`,
  bounds:`\\(e^{x}=1\\) at \\(x=0\\), so x runs from 0 to ${s} and y from 1 to \\(${s===1?'e':`e^{${s}}`}\\); solved for x, the curve is \\(x=\\ln y\\).`,
  view:{xmin:-1,xmax:s+1,ymin:-1,ymax:Math.ceil(Math.exp(s))+1},draw:[{f:Math.exp,tex:'y=e^{x}',dom:[-1,s+0.2]},{f:()=>1,tex:'y=1'},{g:()=>s,tex:`x=${s}`}],data:{kind:'exp_base'}});
}
function famCsSetup(tier){
 let R,v;
 const sub=pick(['exp','two_piece','exact']);
 if(sub==='exp'){R=expBase();v=pick(['x','y']);}
 else if(sub==='two_piece'){R=RG.build(pick(['rootLineAxis','wedge']));v=R.data.kind==='wedge'?'y':'x';}
 else({R,v}=csPick());
 const shape=shapeOf(pick(SH)),T=sectionTerms(R,v,shape),e=exactValue(T);
 const setup=integralPart(`Write, but do not evaluate, an integral expression${T.length>1?' (or a sum of integrals)':''} for the volume of the solid.`,T,W.boundsStep(R)+W.sectionWork(R,v,shape,T),{variable:v,methodNote:`That has the right value, but cross sections ${where(v)} are integrated with respect to ${v}.`});
 const parts=e&&tier==='challenging'&&pick([true,false])?[setup,exactPart('Evaluate the volume.',exactAnswer(e),W.evalWork(T))]:[setup];
 return one('Answer each part.',parts,{engine:'cross_sections',family:'cs_setup',tier,id:`css-${R.eqs.join('|')}-${v}-${shape.name}`,context:csContext(R,v,shape),formulas:R.eqs,extra:figure(R,{label:'The base of the solid'}),data:{dir:v,shape:shape.name,region:R.data.kind}});
}
function famCsCalc(tier){
 const sub=pick(['logLine','logLine','logParabola','cosParabola','expAxes']),R=RG.build(sub);
 const v=sub==='logLine'?pick(['x','y']):sub==='expAxes'?pick(['x','y']):'x',shape=shapeOf(sub==='logLine'?(v==='y'?pick(['iso_leg','square','equilateral']):pick(['rect2','semicircle_d','square'])):pick(SH)),T=sectionTerms(R,v,shape),val=numValue(T);
 const parts=tier==='challenging'?[integralPart('Write an integral expression for the volume of the solid. You may use decimal limits.',T,W.boundsStep(R)+W.sectionWork(R,v,shape,T),{variable:v,help:'Use stored values (at least four decimals) for limits found with the calculator.'}),numPart('Find the volume of the solid.',val,W.calcWork(T))]
  :[numPart('Find the volume of the solid.',val,W.boundsStep(R)+W.sectionWork(R,v,shape,T)+W.calcWork(T))];
 return one('Use your calculator. Answer each part.',parts,{engine:'cross_sections',family:'cs_calc',tier,id:`csc-${R.eqs.join('|')}-${v}-${shape.name}`,calc:true,context:csContext(R,v,shape),formulas:R.eqs,extra:figure(R,{label:'The base of the solid'}),data:{dir:v,shape:shape.name,region:R.data.kind}});
}
const CS={
 cs_basic:{weight:45,tiers:['foundational','intermediate'],make:famCsBasic,calculator:false},
 cs_setup:{weight:30,tiers:['intermediate','challenging'],make:famCsSetup,calculator:false},
 cs_calc:{weight:25,tiers:['intermediate','challenging'],make:famCsCalc,calculator:true},
};
const CS_MODES={perp_x:{families:{cs_basic:true,cs_setup:true,cs_calc:true},accept:p=>p.unit5Meta.dir==='x'},perp_y:{families:{cs_basic:true,cs_setup:true,cs_calc:true},accept:p=>p.unit5Meta.dir==='y'}};

// ---------------- Solids of Revolution ----------------
const axisWords=a=>a.type==='y'?(a.c===0?'the x-axis':`the line \\(y=${a.c}\\)`):(a.c===0?'the y-axis':`the line \\(x=${a.c}\\)`);
// axes that do not cut the region: the coordinate axes (when the region is on one side), and lines beyond it
function axesFor(R,kinds=['y','x']){
 const out=[];
 for(const type of kinds){const [lo,hi]=type==='y'?(R.yb||[R.view.ymin+1,R.view.ymax-1]):(R.xb||[R.view.xmin+1,R.view.xmax-1]);
  if(lo>=-1e-9||hi<=1e-9)out.push({type,c:0});
  out.push({type,c:Math.floor(lo)-pick([1,2,3])});out.push({type,c:Math.ceil(hi)+pick([0,1,2])});}
 return out;
}
const methodVar=(method,axis)=>method==='washer'?(axis.type==='y'?'x':'y'):(axis.type==='x'?'x':'y');
function termsFor(R,method,axis){return method==='washer'?washerTerms(R,axis):shellTerms(R,{type:axis.type,c:axis.c});}
function workFor(R,method,axis,T){return method==='washer'?W.washerWork(R,axis,T):W.shellWork(R,axis,T);}
const methodName=(method,T)=>method==='shell'?'cylindrical shells':T[0].r?'washers':'disks';
const EXACT_S=['pair','pair','underRoot','underPower','leftOfPower','cap','halfCap','triangle','reciprocal','sidewaysCubic','wedge','semicircle'];
function solidPick(method,{touch=false}={}){
 for(let i=0;i<80;i++){
  const R=RG.build(pick(EXACT_S)),axes=axesFor(R).filter(a=>!touch||a.c===0),axis=pick(axes.length?axes:axesFor(R));
  const T=termsFor(R,method,axis);if(!T)continue;const e=exactValue(T);if(!e)continue;
  if(touch&&method==='washer'&&T.some(t=>t.r))continue;
  return{R,axis,T,e};
 }
 throw Error('no exact solid');
}
const solidContext=(R,axis)=>`Let \\(R\\) be ${R.text}. \\(R\\) is revolved about ${axisWords(axis)}.`;
function famDisk(tier){
 const {R,axis,T,e}=solidPick('washer',{touch:true});
 return one('',[exactPart('Find the volume of the solid.',exactAnswer(e),W.boundsStep(R)+W.washerWork(R,axis,T)+W.evalWork(T))],
  {engine:'solids',family:'disk_basic',tier,id:`disk-${R.eqs.join('|')}-${axis.type}${axis.c}`,context:solidContext(R,axis),formulas:R.eqs,extra:pick([true,false])?figure(R,{axis,label:'Region R and the axis of rotation'}):'',data:{method:'washer',axis:`${axis.type}=${axis.c}`,region:R.data.kind}});
}
function famWasher(tier){
 const {R,axis,T,e}=solidPick('washer'),v=methodVar('washer',axis),work=W.washerWork(R,axis,T);
 let parts;
 if(T.length===1&&T[0].r&&pick([true,false])){const t=T[0],dom=[t.a.v,t.b.v];
  parts=[exprPart(`Find the outer radius \\(R(${v})\\), measured from the axis of rotation.`,`R(${v})=`,t.R,v,dom,work.split('Set up the volume.')[0].replace(/<div class="u4-work-step"><strong>$/,''),{notes:[{expr:t.r,note:'That is the inner radius: the boundary nearer the axis.'}]}),
   exprPart(`Find the inner radius \\(r(${v})\\).`,`r(${v})=`,t.r,v,dom,'',{notes:[{expr:t.R,note:'That is the outer radius: the boundary farther from the axis.'}]}),
   exactPart('Find the volume of the solid.',exactAnswer(e),work+W.evalWork(T))];
 }else parts=[integralPart(`Using ${methodName('washer',T)}, write an integral expression for the volume of the solid.`,T,W.boundsStep(R)+work,{variable:v,methodNote:`That integral has the right value, but with ${methodName('washer',T)} about this axis you integrate with respect to ${v}.`}),exactPart('Find the volume of the solid.',exactAnswer(e),W.evalWork(T))];
 return one('Answer each part.',parts,{engine:'solids',family:'washer',tier,id:`wash-${R.eqs.join('|')}-${axis.type}${axis.c}-${parts.length}`,context:solidContext(R,axis),formulas:R.eqs,extra:figure(R,{axis,label:'Region R and the axis of rotation'}),data:{method:'washer',axis:`${axis.type}=${axis.c}`,region:R.data.kind}});
}
function famShell(tier){
 const {R,axis,T,e}=solidPick('shell'),v=methodVar('shell',axis),work=W.boundsStep(R)+W.shellWork(R,axis,T);
 // intermediate problems with one integral may ask for the radius and the height first (as the washer problems ask for R and r)
 const typed=tier==='intermediate'&&T.length===1&&pick([true,false]),t=T[0],dom=[t.a.v,t.b.v];
 const parts=typed?[exprPart(`Find the radius \\(r(${v})\\) of a shell, measured from the axis of rotation.`,`r(${v})=`,t.rad,v,dom,work.split('Set up the volume.')[0].replace(/<div class="u4-work-step"><strong>$/,''),{notes:[{expr:t.h,note:'That is the height of the shell; the radius is the distance from the axis.'}]}),
   exprPart(`Find the height \\(h(${v})\\) of a shell.`,`h(${v})=`,t.h,v,dom,'',{notes:[{expr:t.rad,note:'That is the radius; the height is '+(v==='x'?'top minus bottom.':'right minus left.')}]}),
   exactPart('Find the volume of the solid.',exactAnswer(e),W.shellWork(R,axis,T)+W.evalWork(T))]
  :[integralPart('Using cylindrical shells, write an integral expression for the volume of the solid.',T,work,{variable:v,methodNote:`That integral has the right value, but shells about this axis are integrated with respect to ${v}.`}),exactPart('Find the volume of the solid.',exactAnswer(e),W.evalWork(T))];
 return one('Answer each part.',parts,{engine:'solids',family:'shells',tier,id:`shell-${R.eqs.join('|')}-${axis.type}${axis.c}`,context:solidContext(R,axis),formulas:R.eqs,extra:figure(R,{axis,label:'Region R and the axis of rotation'}),data:{method:'shell',axis:`${axis.type}=${axis.c}`,region:R.data.kind}});
}
function famTwoAxes(tier){ // assignment: the same region about several lines, with washers and with shells
 for(let i=0;i<60;i++){
  const R=RG.build(pick(['pair','pair','underRoot','leftOfPower','triangle','underPower'])),axes=axesFor(R),a1=pick(axes),a2=pick(axes.filter(a=>a!==a1&&a.type!==a1.type));if(!a2)continue;
  const T1=washerTerms(R,a1),T2=shellTerms(R,{type:a2.type,c:a2.c});if(!T1||!T2)continue;const e2=exactValue(T2);if(!e2)continue;
  const v1=methodVar('washer',a1),v2=methodVar('shell',a2);
  const parts=[integralPart(`\\(R\\) is revolved about ${axisWords(a1)}. Using ${methodName('washer',T1)}, write an integral expression for the volume.`,T1,W.washerWork(R,a1,T1),{variable:v1}),
   integralPart(`\\(R\\) is revolved about ${axisWords(a2)}. Using cylindrical shells, write an integral expression for the volume.`,T2,W.shellWork(R,a2,T2),{variable:v2}),
   exactPart(`Find the volume of the solid generated when \\(R\\) is revolved about ${axisWords(a2)}.`,exactAnswer(e2),W.evalWork(T2))];
  return one('Answer each part.',parts,{engine:'solids',family:'two_axes',tier,id:`two-${R.eqs.join('|')}-${a1.type}${a1.c}-${a2.type}${a2.c}`,context:`Let \\(R\\) be ${R.text}.`,formulas:R.eqs,extra:figure(R,{label:'Region R'}),data:{method:'both',region:R.data.kind}});
 }
 throw Error('two_axes failed');
}
const PI2=U5.atom('pi2','\\pi^{2}','pi^2',Math.PI**2);
function famTrigSolid(tier){ // y = A + sin x, the x-axis, 0 <= x <= pi/2, about y = -c (below) or y = d (above)
 const A=pick([1,2]),below=pick([true,false]),c=below?pick([1,2,3]):A+pick([2,3]);
 const f=fnc({tex:()=>`${A}+\\sin x`,key:()=>`${A}+sin(x)`,f:x=>A+Math.sin(x)}),R=region({xs:[{a:bq(0),b:bn(Math.PI/2,'\\frac{\\pi}{2}'),top:f,bot:fconst(0)}],yb:[0,A+1],
  eqs:[`f(x)=${A}+\\sin x`,'y=0','x=0','x=\\frac{\\pi}{2}'],text:`the region between \\(f(x)=${A}+\\sin x\\) and the x-axis from \\(x=0\\) to \\(x=\\frac{\\pi}{2}\\)`,view:{xmin:-1,xmax:3,ymin:below?-c-1:-1,ymax:below?A+2:c+1},draw:[{f:f.f,tex:`y=${A}+\\sin x`,dom:[-0.5,2.5]}]});
 const axis={type:'y',c:below?-c:c};
 // radii written directly (the region touches the x-axis): below, R = (A+c) + sin x and r = c; above, R = c and r = (c-A) - sin x
 const Rf=below?fnc({tex:()=>`${A+c}+\\sin x`,key:()=>`${A+c}+sin(x)`,f:x=>A+c+Math.sin(x)}):fconst(c),rf=below?fconst(c):fnc({tex:()=>`${c-A}-\\sin x`,key:()=>`${c-A}-sin(x)`,f:x=>c-A-Math.sin(x)});
 const g=fnc({tex:()=>'',key:()=>'',f:x=>Rf.f(x)**2-rf.f(x)**2});
 const T=[Object.assign(C.term(C.FPI,bq(0),bn(Math.PI/2,'\\frac{\\pi}{2}'),'x',g,`${C.sqTex(Rf.tex('x'))}-${C.sqTex(rf.tex('x'))}`),{R:Rf,r:rf})];
 const e=below?eadd(ex(Q(2*(A+c)*(A+c)+1-2*c*c,4),PI2),ex(Q(2*(A+c)),K.pi)):eadd(ex(Q(4*c*A-2*A*A-1,4),PI2),ex(Q(2*c-2*A),K.pi));
 const expand=below?`\\pi\\int_{0}^{\\frac{\\pi}{2}}\\left(${(A+c)**2-c*c}+${2*(A+c)}\\sin x+\\sin^{2}x\\right)dx`:`\\pi\\int_{0}^{\\frac{\\pi}{2}}\\left(${2*c*A-A*A}+${2*c-2*A}\\sin x-\\sin^{2}x\\right)dx`;
 const work=W.washerWork(R,axis,T)+step('Evaluate.','Use \\(\\sin^{2}x=\\frac{1-\\cos 2x}{2}\\), so \\(\\int_{0}^{\\frac{\\pi}{2}}\\sin^{2}x\\,dx=\\frac{\\pi}{4}\\), and \\(\\int_{0}^{\\frac{\\pi}{2}}\\sin x\\,dx=1\\).',expand,`=${etex(e)}`);
 const parts=tier==='challenging'?[integralPart('Write an integral expression for the volume of the solid.',T,W.washerWork(R,axis,T),{variable:'x'}),exactPart('Find the volume.',exactAnswer(e),work)]:[exactPart('Find the volume.',exactAnswer(e),work)];
 return one('Answer each part.',parts,{engine:'solids',family:'trig_solid',tier,id:`trig-${A}-${axis.c}`,context:solidContext(R,axis),formulas:R.eqs,extra:figure(R,{axis,label:'Region and axis of rotation'}),data:{method:'washer',axis:`y=${axis.c}`,region:'trig'}});
}
const OLD_CALC=[ // v10.6 calculator solids, bounds given
 ()=>{const A=pick([2,3]),T=pick([1.5,2]);return{id:`d1-${A}-${T}`,tex:`y=${A}+\\sin(x^{2}),\\ 0\\le x\\le ${T}`,axis:'the x-axis',method:'washer',v:Math.PI*quad(x=>(A+Math.sin(x*x))**2,0,T),why:`Disks of radius \\(${A}+\\sin(x^{2})\\): \\(V=\\pi\\int_{0}^{${T}}\\left(${A}+\\sin(x^{2})\\right)^{2}dx\\)`};},
 ()=>{const A=pick([1,2,3]),T=pick([1.5,2,2.5]);return{id:`s1-${A}-${T}`,tex:`y=${A}+e^{-x^{2}},\\ 0\\le x\\le ${T}`,axis:'the y-axis',method:'shell',v:2*Math.PI*quad(x=>x*(A+Math.exp(-x*x)),0,T),why:`Shells of radius x and height \\(${A}+e^{-x^{2}}\\): \\(V=2\\pi\\int_{0}^{${T}}x\\left(${A}+e^{-x^{2}}\\right)dx\\)`};},
 ()=>{const A=pick([2,3]),T=pick([1.5,2]),ax=pick([3,4]);return{id:`s2-${A}-${T}-${ax}`,tex:`y=${A}+\\sin(x^{2}),\\ 0\\le x\\le ${T}`,axis:`the line \\(x=${ax}\\)`,method:'shell',v:2*Math.PI*quad(x=>(ax-x)*(A+Math.sin(x*x)),0,T),why:`Shells of radius \\(${ax}-x\\): \\(V=2\\pi\\int_{0}^{${T}}(${ax}-x)\\left(${A}+\\sin(x^{2})\\right)dx\\)`};},
 ()=>{const A=pick([1,2,3]),T=pick([1.5,2,2.5]);return{id:`d4-${A}-${T}`,tex:`y=${A}+\\ln(x^{2}+2),\\ 0\\le x\\le ${T}`,axis:'the x-axis',method:'washer',v:Math.PI*quad(x=>(A+Math.log(x*x+2))**2,0,T),why:`Disks: \\(V=\\pi\\int_{0}^{${T}}\\left(${A}+\\ln(x^{2}+2)\\right)^{2}dx\\)`};},
];
const CALC_S=['logParabola','logParabola','expAxes','logLine','cosParabola'];
function famSolidCalc(tier){
 if(tier==='foundational'){const o=pick(OLD_CALC)();return one('',[numPart('Find the volume of the solid.',o.v,step('Set up and evaluate with the calculator.',o.why,`V\\approx ${fixed(o.v,3)}`))],{engine:'solids',family:'solid_calc',tier,id:o.id,calc:true,context:`The region under the curve on the interval is revolved about ${o.axis}.`,formulas:[o.tex],data:{method:o.method}});}
 for(let i=0;i<40;i++){
  const R=RG.build(pick(CALC_S)),axis=pick(axesFor(R,R.ys?['y','x']:['y'])),method=pick(['washer','shell']),T=termsFor(R,method,axis);if(!T)continue;const val=numValue(T);
  const free=tier!=='challenging';
  const parts=tier==='challenging'?[integralPart(`Write an integral expression for the volume of the solid${R.ys?'':' (use washers or disks)'}. You may use decimal limits.`,T,W.boundsStep(R)+workFor(R,method,axis,T),{help:'Any correct method is accepted; use stored values (at least four decimals) for calculator limits.'}),numPart('Find the volume of the solid.',val,W.calcWork(T))]
   :[numPart('Find the volume of the solid.',val,W.boundsStep(R)+workFor(R,method,axis,T)+W.calcWork(T))];
  return one('Use your calculator. Answer each part.',parts,{engine:'solids',family:'solid_calc',tier,id:`sc-${R.eqs.join('|')}-${axis.type}${axis.c}-${method}`,calc:true,context:solidContext(R,axis),formulas:R.eqs,extra:figure(R,{axis,label:'Region R and the axis of rotation'}),data:{method:free?'any':method,shown:method,axis:`${axis.type}=${axis.c}`,region:R.data.kind}});
 }
 throw Error('solid_calc failed');
}
const SOLIDS={
 disk_basic:{weight:18,tiers:['foundational','intermediate'],make:famDisk,calculator:false},
 washer:{weight:24,tiers:['intermediate','challenging'],make:famWasher,calculator:false},
 shells:{weight:20,tiers:['intermediate','challenging'],make:famShell,calculator:false},
 two_axes:{weight:12,tiers:['challenging'],make:famTwoAxes,calculator:false},
 trig_solid:{weight:8,tiers:['intermediate','challenging'],make:famTrigSolid,calculator:false},
 solid_calc:{weight:18,tiers:['foundational','intermediate','challenging'],make:famSolidCalc,calculator:true},
};
// a calculator problem that accepts any method is filed under the method its explanation uses (shown)
const shownMethod=p=>p.unit5Meta.shown||p.unit5Meta.method;
const SOLID_MODES={disks_washers:{families:{disk_basic:true,washer:true,trig_solid:true,solid_calc:true},accept:p=>shownMethod(p)!=='shell'},shells:{families:{shells:true,solid_calc:true},accept:p=>shownMethod(p)==='shell'}};
const csEngine=U5.makeEngine('unit6-cross-sections',CS,CS_MODES),solidEngine=U5.makeEngine('unit6-solids',SOLIDS,SOLID_MODES);
window.BatchMathUnit6Volume=Object.freeze({makeCS:csEngine.make,FAMILIES_CS:CS,MODES_CS:CS_MODES,makeSolid:solidEngine.make,FAMILIES_SOLID:SOLIDS,MODES_SOLID:SOLID_MODES,axesFor,termsFor,workFor,methodVar,axisWords,expBase,shapeOf,SH});
U5.register('volume-by-cross-sections',o=>csEngine.make(o||{}));
U5.register('solids-of-revolution',o=>solidEngine.make(o||{}));
})();
