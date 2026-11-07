// v13.0.B experimental 3D cross sections: the solid drawn for the 3D model agrees with the problem's own mathematics, for
// EVERY problem of the Volume by Cross Sections engine (all eight shapes, both directions, every family, tier and
// calculator kind, every region family, one or several pieces).
//
// 1. Fixtures (deterministic): every region builder the engine uses x every direction it can be sliced in x every shape,
//    several parameter draws each, through the engine's own descriptor (describeSolid) and the geometry module:
//    - the shape: each drawn cross section (the highlighted one and the outlines) is checked against INDEPENDENT formulas:
//      square s by s; rectangle s by m s with right angles; semicircle whose DIAMETER is the whole slice (every arc point
//      at distance s/2 from the slice's midpoint); quarter circle whose RADIUS is the slice (centre at the lo end, every
//      arc point at distance s, the other radius vertical); equilateral triangle (three sides s, apex sqrt(3)/2 s above
//      the midpoint); isosceles right triangle with leg s (legs s and s, right angle at the lo end) or hypotenuse s (legs
//      s/sqrt(2), right angle at the apex);
//    - the area: exact profile area = k s^2 with the engine's k; the drawn polygon's area = k s^2 times the known chord
//      factor of its arc polygon (1 for straight sides);
//    - the orientation: every section lies in the plane of its x (slices perpendicular to the x-axis) or of its y
//      (perpendicular to the y-axis), spans the slice from lo(t) to hi(t), and stands up in z (the y solid is built in
//      its own orientation, not rotated from an x solid);
//    - the mesh: closed (its divergence-theorem volume does not change when the solid is moved), outward (positive), and
//      equal to the exact volume of its own piecewise-linear sweep; against the independent integral k * integral of s^2
//      (times the chord factor) the difference is the sampling of s(t), and it shrinks by about 4 when the sampling is
//      doubled (second order);
//    - the highlighted section is at the descriptor's slice, its labels are the shape's, the base follows the boundaries.
// 2. Generated problems (random seeds): every family x tier x calculator kind x Practice Type (all, perp_x, perp_y):
//    - the descriptor is attached (cs_basic, cs_setup AND cs_calc), never enumerable, never in stored data;
//    - it is the SAME region as the 2D pictures: the figure in the question (Show Graph) and the figure with the slice in
//      Part A's explanation are drawn from the very region object whose boundary functions the descriptor holds, and the
//      2D slice is the descriptor's slice (same segment end points);
//    - its area factor k is the answer's: typed A(x)/A(y) answers equal k s^2, and the answer's volume (exact, setup or
//      calculator value) equals k * integral of s^2 (independent Simpson) and the mesh (with the chord factor);
//    - a coverage table: shape x direction x family x tier x calculator kind x region x one/several pieces.
// 3. Refusals: damaged descriptors are refused with their exact reason (no model is drawn from unsafe data).
// Usage: node tools/review-lab/unit6/qa/solid3d.mjs [problems per family, tier, kind and Practice Type=60]
import fs from 'node:fs';import vm from 'node:vm';
import {ROOT,rng} from './lib.mjs';
import * as G from '../../../../assets/unit6-3d/solid-geometry.mjs';
const N=+(process.argv[2]||60);
// the site's scripts in a vm, with the 2D figure function wrapped so every figure drawn records its region and slice
const ctx={window:{},console:{...console,warn(){}},document:{addEventListener(){}},Math};vm.createContext(ctx);ctx.window.BatchMathRNG={random:rng(1)};
const run=f=>vm.runInContext(fs.readFileSync(`${ROOT}/assets/${f}`,'utf8'),ctx,{filename:f});
for(const f of ['derivative-expression-checker.js','unit4-exact-answers.js','ap-topic-generators.js','unit5-core.js','unit5-answers.js','unit6-core.js'])run(f);
const C0=ctx.window.BatchMathUnit6Core,figures=[];
ctx.window.BatchMathUnit6Core=Object.freeze({...C0,figure:(R,o={})=>{figures.push({R,slice:o.slice||null,label:o.label||''});return C0.figure(R,o);}});
for(const f of ['unit6-regions.js','unit6-area.js','unit6-volume.js'])run(f);
const seed=s=>{ctx.window.BatchMathRNG={random:rng(s)};};
const V=ctx.window.BatchMathUnit6Volume,RG=ctx.window.BatchMathUnit6Regions,C=C0;
const rel=(a,b)=>Math.abs(a-b)/Math.max(1e-300,Math.abs(b));
const near=(a,b,r=1e-9)=>Math.abs(a-b)<=r*Math.max(1,Math.abs(a),Math.abs(b));
const out={fixtures:{cases:0,sections:0,byShape:{},byRegion:{}},checks:0,maxDiscrepancy:{},convergence:{worstRatio:0},problems:{total:0},coverage:{},refusals:{},failures:[]};
const fail=m=>{if(out.failures.length<60)out.failures.push(m);};
const ok=(c,m)=>{out.checks++;if(!c)fail(m);return c;};
const simpson=(f,a,b,n=4000)=>{const g=u=>f(a+(b-a)*(3*u*u-2*u*u*u))*(b-a)*6*u*(1-u),h=1/n;let s=g(0)+g(1);for(let i=1;i<n;i++)s+=(i%2?4:2)*g(i*h);return s*h/3;};
const intS2=d=>d.pieces.reduce((t,q)=>t+simpson(x=>(q.top(x)-q.bot(x))**2,q.a,q.b),0);
// independent shape data: the exact area of the profile with side s, its height, the chord factor of the drawn arc
const R3=Math.sqrt(3);
const EXACT_AREA={square:s=>s*s,rect2:s=>s*2*s,rect3:s=>s*3*s,semicircle_d:s=>Math.PI*(s/2)**2/2,quarter:s=>Math.PI*s*s/4,equilateral:s=>s*(R3/2*s)/2,iso_leg:s=>s*s/2,iso_hyp:s=>(s/Math.SQRT2)**2/2};
const HEIGHT={square:1,rect2:2,rect3:3,semicircle_d:0.5,quarter:1,equilateral:R3/2,iso_leg:1,iso_hyp:0.5};
const CHORD={semicircle_d:64*Math.sin(Math.PI/64)/Math.PI,quarter:64*Math.sin(Math.PI/64)/Math.PI};
const LABELS={square:['s','s'],rect2:['s','2s'],rect3:['s','3s'],semicircle_d:['d = s','r = s/2'],quarter:['r = s','s'],equilateral:['s','s','s'],iso_leg:['s','s'],iso_hyp:['s']};
const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
// local (u, w) of a drawn point of the section at t (independent of the module's own mapping)
const local=(dir,lo,p)=>dir==='x'?[p[1]-lo,p[2]]:[p[0]-lo,p[2]];
const planeOf=(dir,p)=>dir==='x'?p[0]:p[1];
// one drawn cross section against the independent formulas for its shape
function checkSection(tag,key,dir,sec,s,lo,hi,t){
 out.fixtures.sections++;const P=sec.pts,L=P.map(p=>local(dir,lo,p)),tol=1e-9*Math.max(1,s,Math.abs(lo),Math.abs(hi));
 ok(P.every(p=>p[2]>=-tol),`${tag}: below the base`);
 ok(P.every(p=>Math.abs(planeOf(dir,p)-t)<=tol),`${tag}: not in the plane ${dir} = ${t}`);
 ok(near(L[0][0],0)&&near(L[0][1],0)&&near(L[1][0],s,1e-9)&&near(L[1][1],0),`${tag}: the section does not stand on the whole slice (${JSON.stringify(L.slice(0,2))}, s = ${s})`);
 ok(near(lo+L[1][0],hi,1e-9),`${tag}: the slice does not reach hi`);
 ok(L.every(([u,w])=>u>=-tol&&u<=s+tol),`${tag}: the section leaves the slice's width`);
 const H=Math.max(...L.map(q=>q[1]));ok(near(H,HEIGHT[key]*s,1e-9),`${tag}: height ${H}, expected ${HEIGHT[key]*s}`);
 if(key==='square'||key.startsWith('rect')){const m=key==='square'?1:+key.slice(4);ok(L.length===4&&near(L[2][0],s)&&near(L[2][1],m*s)&&near(L[3][0],0)&&near(L[3][1],m*s),`${tag}: not an s by ${m}s rectangle`);}
 else if(key==='semicircle_d'){const c=[s/2,0];ok(L.slice(1).every(q=>Math.abs(dist(q,c)-s/2)<=tol),`${tag}: arc points are not at distance s/2 from the slice's midpoint (the diameter is not the slice)`);ok(L.slice(2).every(q=>q[1]>0),`${tag}: arc below the base`);}
 else if(key==='quarter'){ok(L.slice(1).every(q=>Math.abs(dist(q,[0,0])-s)<=tol),`${tag}: arc points are not at distance s from the lo end (the radius is not the slice)`);const top=L[L.length-1];ok(near(top[0],0)&&near(top[1],s),`${tag}: the other radius is not vertical at the lo end`);}
 else if(key==='equilateral'){ok(L.length===3&&near(dist(L[0],L[1]),s)&&near(dist(L[1],L[2]),s)&&near(dist(L[2],L[0]),s),`${tag}: sides are not all s`);}
 else if(key==='iso_leg'){const [A,B,Cc]=L,dot=(B[0]-A[0])*(Cc[0]-A[0])+(B[1]-A[1])*(Cc[1]-A[1]);ok(L.length===3&&near(dist(A,B),s)&&near(dist(A,Cc),s)&&Math.abs(dot)<=tol*Math.max(1,s)&&near(dist(B,Cc),s*Math.SQRT2),`${tag}: not legs s, s with the right angle at the lo end`);}
 else if(key==='iso_hyp'){const [A,B,Cc]=L,dot=(A[0]-Cc[0])*(B[0]-Cc[0])+(A[1]-Cc[1])*(B[1]-Cc[1]);ok(L.length===3&&near(dist(A,B),s)&&near(dist(A,Cc),s/Math.SQRT2)&&near(dist(B,Cc),s/Math.SQRT2)&&Math.abs(dot)<=tol*Math.max(1,s),`${tag}: not hypotenuse s with legs s/sqrt(2) and the right angle at the apex`);}
 // areas: exact profile = k s^2 (the engine's k); drawn polygon = exact times the chord factor
 const drawn=Math.abs(G.polygonArea(L)),exact=EXACT_AREA[key](s);
 if(s>1e-6){ok(rel(drawn,exact*(CHORD[key]||1))<=1e-10,`${tag}: drawn area ${drawn}, expected ${exact}*${CHORD[key]||1}`);}
 return{drawn,exact};
}
// the whole solid of one descriptor
function checkSolid(tag,d){
 const key=G.shapeKey(d),v=G.validate(d);if(!ok(v.ok,`${tag}: refused: ${v.reason}`))return null;
 ok(near(d.k*1,EXACT_AREA[key](1)),`${tag}: the engine's area factor ${d.k} is not the exact area of the ${key} profile with side 1 (${EXACT_AREA[key](1)})`);
 const S=G.buildSolid(d),dir=d.dir;
 for(const sec of [...S.sections,S.highlight]){const q=G.evalAt(d,sec.t);
  ok(near(sec.lo,q.lo,1e-12)&&near(sec.hi,q.hi,1e-12)&&near(sec.s,Math.max(0,q.hi-q.lo),1e-12),`${tag}: section at ${sec.t} is not from the boundary functions`);
  checkSection(`${tag} @${dir}=${sec.t}`,key,dir,sec,sec.s,sec.lo,sec.hi,sec.t);}
 ok(S.highlight.t===d.slice,`${tag}: highlight at ${S.highlight.t}, slice ${d.slice}`);
 ok(near(S.highlight.area,EXACT_AREA[key](S.highlight.s)*(CHORD[key]||1),1e-10),`${tag}: highlighted area ${S.highlight.area}`);
 ok(JSON.stringify(S.highlight.labels.map(l=>l.text))===JSON.stringify(LABELS[key]),`${tag}: labels ${S.highlight.labels.map(l=>l.text)}`);
 ok(S.highlight.labels.every(l=>Math.abs(planeOf(dir,l.at)-S.highlight.t)<1e-9),`${tag}: a label is off the highlighted section's plane`);
 ok(!/\\int|dx|dy|\bV\b|pi|\d\.\d/.test(S.highlight.labels.map(l=>l.text).join(' ')),`${tag}: a label gives a formula or a value`);
 // the base and the edges follow the boundary functions at every sample
 S.samples.forEach((q,i)=>{const e=G.evalAt(d,q.t),lo=S.outline.lo[i],hi=S.outline.hi[i];
  ok(near(q.lo,e.lo,1e-12)&&near(q.hi,e.hi,1e-12),`${tag}: sample ${q.t} off the boundaries`);
  const want=dir==='x'?[[q.t,e.lo,0],[q.t,e.hi,0]]:[[e.lo,q.t,0],[e.hi,q.t,0]];
  ok([lo,hi].every((p,j)=>p.every((c,k)=>near(c,want[j][k],1e-12))),`${tag}: base outline at ${q.t} is not (${want})`);});
 // the mesh: closed, outward, its own sweep's exact volume; the independent integral and second-order convergence
 const parts=[S.base,S.surface.flat,S.surface.curved,S.surface.caps],mv=G.meshVolume(...parts);
 const moved=parts.map(a=>a.map((c,i)=>c+[5,-3,2][i%3])),mv2=G.meshVolume(...moved);
 ok(mv>0,`${tag}: mesh volume ${mv} is not positive (inward faces)`);
 ok(rel(mv2,mv)<=2e-5,`${tag}: the mesh is not closed (volume ${mv} becomes ${mv2} when moved)`);
 ok(S.surface.curvedNormals.length===S.surface.curved.length,`${tag}: curved faces without normals`);
 ok((S.surface.curved.length>0)===(key==='semicircle_d'||key==='quarter'),`${tag}: curved faces ${S.surface.curved.length} for ${key}`);
 let lin=0;for(let i=0;i+1<S.samples.length;i++){const a=S.samples[i],b=S.samples[i+1];lin+=(b.t-a.t)*(a.s*a.s+a.s*b.s+b.s*b.s)/3;}
 const chord=CHORD[key]||1;lin*=d.k*chord;
 ok(rel(mv,lin)<=2e-6,`${tag}: mesh volume ${mv} differs from its own sweep ${lin}`);
 const I=d.k*intS2(d)*chord,disc=(mv-I)/I;
 const m=out.maxDiscrepancy[key]=out.maxDiscrepancy[key]||{max:0,at:''};if(Math.abs(disc)>Math.abs(m.max)){m.max=disc;m.at=tag;}
 ok(Math.abs(disc)<=2e-3,`${tag}: mesh ${mv} vs integral ${I} (${disc})`);
 if(Math.abs(disc)>1e-5){const S2=G.buildSolid(d,{n:144}),mv3=G.meshVolume(S2.base,S2.surface.flat,S2.surface.curved,S2.surface.caps),r=Math.abs((mv3-I)/I)/Math.abs(disc);
  out.convergence.worstRatio=Math.max(out.convergence.worstRatio,r);ok(r<=0.3,`${tag}: doubling the sampling did not shrink the difference by about 4 (ratio ${r})`);}
 return{S,mv,I,disc};
}

// ---------- 1. fixtures ----------
const BUILDERS=[...['cap','halfCap','semicircle','disk','triangle','pair','underRoot','underPower','leftOfPower','rootLineAxis','wedge'].map(n=>[n,()=>RG.build(n)]),['expBase',()=>V.expBase()],
 ...['logLine','logParabola','expAxes','cosParabola'].map(n=>[n,()=>RG.build(n)])];
for(const [name,make] of BUILDERS)for(let k=0;k<6;k++){
 seed(1000+k*37+name.length);const R=make();
 for(const dir of ['x','y'])for(const key of G.SHAPE_KEYS){
  const d=V.describeSolid(R,dir,V.shapeOf(key));if(!d){out.fixtures.noSlices=(out.fixtures.noSlices||new Set()).add(`${name} ${dir}`);continue;}
  out.fixtures.cases++;out.fixtures.byShape[`${key} ${dir}`]=(out.fixtures.byShape[`${key} ${dir}`]||0)+1;out.fixtures.byRegion[`${R.data.kind} ${dir} (${d.pieces.length} piece${d.pieces.length>1?'s':''})`]=1;
  checkSolid(`fixture ${name}#${k} ${dir} ${key}`,d);}
}
if(out.fixtures.noSlices)out.fixtures.noSlices=[...out.fixtures.noSlices];

// ---------- 2. generated problems ----------
const famTiers=Object.entries(V.FAMILIES_CS).flatMap(([fam,f])=>f.tiers.map(tier=>[fam,tier,f.calculator?'calculator':'non-calculator']));
for(const [fam,tier,kind] of famTiers)for(const mode of [undefined,'perp_x','perp_y'])for(let i=0;i<N;i++){
 seed(i*7919+fam.length*131+tier.length*17+kind.length+(mode?mode.length*3+mode.charCodeAt(5):0));figures.length=0;let p;
 try{p=V.makeCS({family:fam,tier,calc:kind,mode});}catch(e){out.problems.generatorErrors=(out.problems.generatorErrors||0)+1;continue;}
 out.problems.total++;const d=p.u6Solid,meta=p.unit5Meta,tag=`${p.id} [${fam} ${tier} ${kind} ${mode||'all'}]`;
 ok(!Object.keys(p).includes('u6Solid'),`${tag}: the descriptor is enumerable`);
 ok(!JSON.stringify(p).includes('u6Solid')&&!JSON.stringify(p).includes('"pieces"'),`${tag}: the descriptor reaches stored data`);
 if(!ok(!!d,`${tag}: no descriptor`))continue;
 const key=G.shapeKey(d);
 ok(d.dir===meta.dir,`${tag}: descriptor direction ${d.dir}, problem ${meta.dir}`);
 ok(V.shapeOf(key).name===meta.shape,`${tag}: descriptor shape ${key}, problem "${meta.shape}"`);
 ok(d.region===meta.region,`${tag}: descriptor region ${d.region}, problem ${meta.region}`);
 ok(!!p.calculatorActive===(kind==='calculator'),`${tag}: calculator flag`);
 // the same region as the 2D pictures
 const ps=dir=>dir==='x'?'xs':'ys',same=R=>R&&R[ps(d.dir)]&&R[ps(d.dir)].length===d.pieces.length&&R[ps(d.dir)].every((q,j)=>(d.dir==='x'?q.top:q.right).f===d.pieces[j].top&&(d.dir==='x'?q.bot:q.left).f===d.pieces[j].bot&&q.a.v===d.pieces[j].a&&q.b.v===d.pieces[j].b);
 // (the engine may generate and discard problems first, e.g. for a Practice Type: the served problem draws last)
 const qFig=figures.findLast(f=>!f.slice),eFig=figures.findLast(f=>f.slice);
 if(kind==='non-calculator')ok(qFig&&same(qFig.R),`${tag}: the question's 2D graph is not drawn from the descriptor's region`);
 else ok(!qFig,`${tag}: a calculator question draws a graph in the question`);
 if(ok(eFig&&same(eFig.R),`${tag}: Part A's 2D picture is not drawn from the descriptor's region`)){
  ok(eFig.slice.v===d.dir&&eFig.slice.at===d.slice,`${tag}: the 2D slice ${eFig.slice.v} = ${eFig.slice.at}, the 3D slice ${d.dir} = ${d.slice}`);
  const seg=C.sliceSegment(eFig.R,eFig.slice.v,eFig.slice.at),q=G.evalAt(d,d.slice),want=d.dir==='x'?[d.slice,q.lo,d.slice,q.hi]:[q.lo,d.slice,q.hi,d.slice];
  ok(seg&&seg.every((c,j)=>near(c,want[j],1e-12)),`${tag}: the 2D slice segment ${seg} is not the 3D slice ${want}`);}
 // the answer's own k and volume
 const ap=p.parts.find(q=>q.control==='u6-expr');
 if(ap){for(const t of G.sampleXs(d.pieces,6).slice(1,-1)){const q=G.evalAt(d,t);ok(near(ap.answer.expr.f(t),d.k*q.s*q.s,1e-9),`${tag}: A(${t}) = ${ap.answer.expr.f(t)}, k s^2 = ${d.k*q.s*q.s}`);}out.problems.areaParts=(out.problems.areaParts||0)+1;}
 const vol=[...p.parts].reverse().find(q=>q.answer&&Number.isFinite(q.answer.value)&&['exact','u6-integral','numeric'].includes(q.answer.kind));
 const R=checkSolid(tag,d);if(!R)continue;
 if(ok(!!vol,`${tag}: no volume answer`)){const A=vol.answer.value,I=d.k*intS2(d);
  ok(rel(I,A)<=1e-7,`${tag}: k * integral of s^2 = ${I}, the answer is ${A} (${vol.answer.kind})`);
  const disc=(R.mv-A*(CHORD[key]||1))/A;const m=out.maxDiscrepancy[`answer ${key}`]=out.maxDiscrepancy[`answer ${key}`]||{max:0,at:''};if(Math.abs(disc)>Math.abs(m.max)){m.max=disc;m.at=tag;}
  ok(Math.abs(disc)<=2e-3,`${tag}: mesh ${R.mv} vs answer ${A} x chord (${disc})`);}
 const cov=`${key} | ${d.dir} | ${fam} | ${tier} | ${kind} | ${meta.region} | ${d.pieces.length>1?'multi':'single'}`;out.coverage[cov]=(out.coverage[cov]||0)+1;
}

// ---------- 3. refusals ----------
{seed(77);const R=RG.build('rootLineAxis'),d=V.describeSolid(R,'x',V.shapeOf('square')),base={...d,pieces:d.pieces.map(q=>({...q}))};
 const cases={
  'pieces do not join':{...base,pieces:[base.pieces[0],{...base.pieces[1],a:base.pieces[1].a+0.5}]},
  'boundaries jump':{...base,pieces:[base.pieces[0],{...base.pieces[1],top:x=>base.pieces[1].top(x)+1}]},
  'undefined boundary':{...base,pieces:base.pieces.map(q=>({...q,top:x=>x>1?NaN:q.top(x)}))},
  'out of order':{...base,pieces:base.pieces.map(q=>({...q,top:q.bot,bot:q.top}))},
  'no width':{...base,pieces:base.pieces.map(q=>({...q,top:q.bot}))},
  'too large':{...base,pieces:base.pieces.map(q=>({...q,top:x=>q.top(x)*1e4}))},
  'slice outside':{...base,slice:base.pieces[1].b+1},
  'unknown shape':{...base,shape:'hexagon'},
  'wrong area factor':{...base,k:0.5},
  'unknown direction':{...base,dir:'z'},
  'no data':null};
 for(const [name,dd] of Object.entries(cases)){const v=G.validate(dd);out.refusals[name]=v.ok?'ACCEPTED':v.reason;ok(!v.ok,`refusal: ${name} was accepted`);}}

const shapes=G.SHAPE_KEYS,table={};
for(const [k,n] of Object.entries(out.coverage)){const [key,dir,fam,tier,kind,region,pieces]=k.split(' | ');const row=table[`${key} ${dir}`]=table[`${key} ${dir}`]||{problems:0,families:new Set(),tiers:new Set(),kinds:new Set(),regions:new Set(),pieces:new Set()};
 row.problems+=n;row.families.add(fam);row.tiers.add(`${fam}:${tier}`);row.kinds.add(kind);row.regions.add(region);row.pieces.add(pieces);}
out.coverageTable=Object.fromEntries(shapes.flatMap(s=>['x','y'].map(dir=>{const r=table[`${s} ${dir}`];return[`${s} ${dir}`,r?{problems:r.problems,families:[...r.families].sort(),tiers:[...r.tiers].sort(),kinds:[...r.kinds].sort(),regions:[...r.regions].sort(),pieces:[...r.pieces].sort()}:'NONE'];})));
const missing=Object.entries(out.coverageTable).filter(([,r])=>r==='NONE').map(([k])=>k);if(missing.length)fail(`no generated problem for ${missing}`);
out.coverageCells=Object.keys(out.coverage).length;delete out.coverage;
console.log(JSON.stringify(out,null,1));
if(out.failures.length)process.exitCode=1;
