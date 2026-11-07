// v13.0.C experimental 3D solids of revolution: the solid drawn for the 3D model agrees with the problem's own
// mathematics, for EVERY problem of the Solids of Revolution engine (disk_basic, washer, shells, two_axes, trig_solid,
// solid_calc, calc_two_axes; every tier and calculator kind; every axis kind; one rotation or two).
//
// 1. Fixtures (deterministic): every region builder the engine uses x every axis it uses for that region (axesFor: the
//    coordinate axes when the region lies on one side, lines beyond it on every side) x every method that applies, built
//    through the engine's own descriptor (describeRevolution) and the geometry module.
// 2. Generated problems (random seeds): every family x tier x calculator kind x Practice Type (all, disks/washers,
//    shells), including the trigonometric and the v10.6 calculator solids that exist only inside their families.
// For every rotation:
//  - the mesh is closed (its divergence-theorem volume does not change when it is moved), outward (positive), and equals
//    the exact volume of the revolved boundary polygon (Pappus) times the known angular factor of 128 segments;
//  - every vertex of the solid lies on a circle about the ACTUAL axis (y = c or x = c, z = 0) whose radius is the
//    distance from that axis to a point of the region's boundary, at that point's position along the axis;
//  - the volume, integrated independently from the region's slices by BOTH methods where the region allows (washers:
//    pi * integral of (R^2 - r^2) over slices perpendicular to the axis; shells: 2 pi * integral of radius * height over
//    slices parallel to it), equals the problem's own answer for that rotation (exact value, setup value or calculator
//    value), and the two methods agree; the mesh differs from it only by the sampling of the boundary, which shrinks by
//    about 4 when the sampling is doubled (second order);
//  - the highlighted disk, washer or shell is the explanation's own slice (the same region object, position and end
//    points as the 2D picture): a disk or washer has outer radius R and inner radius r equal to the engine's own R(t)
//    and r(t) at that slice (r = 0 and no hole for a disk), measured from the axis; a shell has radius equal to the
//    engine's radius r(t) and height equal to its h(t); typed R/r and r/h answers equal the model's distances;
//  - the axis line lies on the axis; the region lies on one side of it.
// 3. Refusals: damaged descriptors are refused with their exact reason. Two-axis problems: two solids, each against its
//    own answer, about two different axes.
// Usage: node tools/review-lab/unit6/qa/revolution3d.mjs [problems per family, tier, kind and Practice Type=40]
import fs from 'node:fs';import vm from 'node:vm';
import {ROOT,rng} from './lib.mjs';
import * as RV from '../../../../assets/unit6-3d/revolution-geometry.mjs';
const N=+(process.argv[2]||40);
const ctx={window:{},console:{...console,warn(){}},document:{addEventListener(){}},Math};vm.createContext(ctx);ctx.window.BatchMathRNG={random:rng(1)};
const run=f=>vm.runInContext(fs.readFileSync(`${ROOT}/assets/${f}`,'utf8'),ctx,{filename:f});
for(const f of ['derivative-expression-checker.js','unit4-exact-answers.js','ap-topic-generators.js','unit5-core.js','unit5-answers.js','unit6-core.js'])run(f);
const C0=ctx.window.BatchMathUnit6Core,figures=[];
ctx.window.BatchMathUnit6Core=Object.freeze({...C0,figure:(R,o={})=>{figures.push({R,slice:o.slice||null,axes:o.axes||(o.axis?[o.axis]:[])});return C0.figure(R,o);}});
for(const f of ['unit6-regions.js','unit6-area.js','unit6-volume.js'])run(f);
const seed=s=>{ctx.window.BatchMathRNG={random:rng(s)};};
const V=ctx.window.BatchMathUnit6Volume,RG=ctx.window.BatchMathUnit6Regions,C=C0;
const rel=(a,b)=>Math.abs(a-b)/Math.max(1e-300,Math.abs(b));
const near=(a,b,r=1e-9)=>Math.abs(a-b)<=r*Math.max(1,Math.abs(a),Math.abs(b));
const out={checks:0,fixtures:{rotations:0,regions:{}},problems:{total:0,rotations:0},maxDiscrepancy:{},methodAgreement:0,convergence:{worstRatio:0},coverage:{},refusals:{},failures:[]};
const fail=m=>{if(out.failures.length<60)out.failures.push(m);};
const ok=(c,m)=>{out.checks++;if(!c)fail(m);return c;};
const simpson=(f,a,b,n=4000)=>{const g=u=>f(a+(b-a)*(3*u*u-2*u*u*u))*(b-a)*6*u*(1-u),h=1/n;let s=g(0)+g(1);for(let i=1;i<n;i++)s+=(i%2?4:2)*g(i*h);return s*h/3;};
// independent volumes from the region's slices: washers (slices perpendicular to the axis) and shells (parallel)
function volumes(d,axis){
 const perp=axis.type==='y'?d.xs:d.ys,par=axis.type==='y'?d.ys:d.xs,c=axis.c,res={};
 if(perp)res.washer=Math.PI*perp.reduce((t,q)=>t+simpson(s=>{const a=Math.abs(q.top(s)-c),b=Math.abs(q.bot(s)-c);return Math.max(a,b)**2-Math.min(a,b)**2;},q.a,q.b),0);
 if(par)res.shell=2*Math.PI*par.reduce((t,q)=>t+simpson(s=>Math.abs(s-c)*(q.top(s)-q.bot(s)),q.a,q.b),0);
 return res;
}
const axisKind=(d,axis)=>{const P=RV.boundary(d);let lo=Infinity,hi=-Infinity;for(const p of P){const v=axis.type==='y'?p[1]:p[0];lo=Math.min(lo,v);hi=Math.max(hi,v);}
 const name=axis.type==='y'?(axis.c===0?'x-axis':axis.c>=hi-1e-9?(Math.abs(axis.c-hi)<1e-9?'y=c on the top edge':'y=c above'):(Math.abs(axis.c-lo)<1e-9?'y=c on the bottom edge':'y=c below'))
  :(axis.c===0?'y-axis':axis.c>=hi-1e-9?(Math.abs(axis.c-hi)<1e-9?'x=c on the right edge':'x=c right'):(Math.abs(axis.c-lo)<1e-9?'x=c on the left edge':'x=c left'));
 return axis.c===0&&(Math.abs(lo)<1e-9||Math.abs(hi)<1e-9)?`${name} (touching)`:name;};
// one rotation: geometry, volumes, highlight
function checkRotation(tag,d,i,R,answer){
 const rot=d.rotations[i],ax=rot.axis,v=RV.validate(d,rot);if(!ok(v.ok,`${tag}: refused: ${v.reason}`))return null;
 const G=RV.buildRevolution(d,rot),P=G.boundary,pos=G.solid.positions,idx=G.solid.index;
 const mv=RV.indexedVolume(pos,idx),moved=pos.map((x,k)=>x+[5,-3,2][k%3]),mv2=RV.indexedVolume(moved,idx);
 ok(mv>0,`${tag}: mesh volume ${mv} is not positive`);ok(rel(mv2,mv)<=2e-5,`${tag}: the mesh is not closed (${mv} vs ${mv2} moved)`);
 ok(rel(mv,G.angular*RV.polygonVolume(P,ax))<=2e-6,`${tag}: mesh ${mv} is not the revolved polygon ${G.angular*RV.polygonVolume(P,ax)}`);
 // every vertex on a circle about the actual axis, through a boundary point
 const pts=P.map(p=>({a:ax.type==='y'?p[0]:p[1],r:Math.abs(ax.type==='y'?p[1]-ax.c:p[0]-ax.c)})),scale=Math.max(1,...pts.map(q=>Math.abs(q.a)+q.r));let off=0;
 for(let k=0;k<pos.length;k+=3*7){const x=pos[k],y=pos[k+1],z=pos[k+2],a=ax.type==='y'?x:y,r=Math.hypot(ax.type==='y'?y-ax.c:x-ax.c,z);
  let best=Infinity;for(const q of pts)best=Math.min(best,Math.hypot(q.a-a,q.r-r));off=Math.max(off,best/scale);}
 ok(off<=2e-6,`${tag}: a vertex is ${off} (relative) off every circle of the boundary about the axis`);
 // the region on one side of the axis, the axis line on it
 const rhos=P.map(p=>RV.rhoOf(ax,p));ok(Math.min(...rhos)>=-1e-9*scale||Math.max(...rhos)<=1e-9*scale,`${tag}: the region crosses the axis`);
 ok(G.axisLine.every(p=>p[2]===0&&Math.abs(RV.rhoOf(ax,p))<1e-12),`${tag}: the axis line is not on ${ax.type} = ${ax.c}`);
 // volumes: both methods where the region allows, against the answer and each other; the mesh's sampling difference
 const vols=volumes(d,ax),exact=vols.washer??vols.shell;
 if(vols.washer!==undefined&&vols.shell!==undefined){out.methodAgreement++;ok(rel(vols.washer,vols.shell)<=1e-7,`${tag}: washers give ${vols.washer}, shells ${vols.shell}`);}
 if(answer!==undefined)ok(rel(exact,answer)<=1e-7,`${tag}: the integrated volume ${exact} is not the answer ${answer}`);
 const disc=(G.exactVolume-exact)/exact,k=d.rotations.length>1?'two axes':rot.kind,m=out.maxDiscrepancy[k]=out.maxDiscrepancy[k]||{max:0,at:''};
 if(Math.abs(disc)>Math.abs(m.max)){m.max=disc;m.at=tag;}
 ok(Math.abs(disc)<=2e-3,`${tag}: revolved polygon ${G.exactVolume} vs integral ${exact} (${disc})`);
 if(Math.abs(disc)>1e-5){const G2=RV.buildRevolution(d,rot,{n:144}),r=Math.abs((G2.exactVolume-exact)/exact)/Math.abs(disc);out.convergence.worstRatio=Math.max(out.convergence.worstRatio,r);ok(r<=0.3,`${tag}: doubling the sampling did not shrink the difference by about 4 (ratio ${r})`);}
 // the highlight: the explanation's slice, radii (and height) from the engine's own terms, measured from the axis
 const H=G.highlight,hp=H.mesh.positions;let a0=Infinity,a1=-Infinity,r0=Infinity,r1=-Infinity;
 for(let q=0;q<hp.length;q+=3){const x=hp[q],y=hp[q+1],z=hp[q+2],a=ax.type==='y'?x:y,r=Math.hypot(ax.type==='y'?y-ax.c:x-ax.c,z);a0=Math.min(a0,a);a1=Math.max(a1,a);r0=Math.min(r0,r);r1=Math.max(r1,r);}
 const T=R?V.termsFor(R,rot.method,ax):null,t=T&&T.find(q=>rot.at>=q.a.v-1e-9&&rot.at<=q.b.v+1e-9);
 ok(H.kind===rot.kind,`${tag}: highlighted ${H.kind}, rotation ${rot.kind}`);
 if(rot.kind==='shell'){
  if(t){ok(near(H.radius,t.rad.f(rot.at),1e-9),`${tag}: shell radius ${H.radius}, the engine's r = ${t.rad.f(rot.at)}`);ok(near(H.height,t.h.f(rot.at),1e-9),`${tag}: shell height ${H.height}, the engine's h = ${t.h.f(rot.at)}`);}
  ok(near(r0,H.radius-H.thickness/2,2e-6)&&near(r1,H.radius+H.thickness/2,2e-6)&&H.thickness>0&&H.radius-H.thickness/2>=-1e-12,`${tag}: shell drawn from ${r0} to ${r1}, radius ${H.radius}`);
  ok(near(a0,H.axial[0],2e-6)&&near(a1,H.axial[1],2e-6),`${tag}: shell drawn along ${a0}..${a1}, the slice runs ${H.axial}`);
 }else{
  if(t){ok(near(H.R,t.R.f(rot.at),1e-9),`${tag}: outer radius ${H.R}, the engine's R = ${t.R.f(rot.at)}`);ok(near(H.r,t.r?t.r.f(rot.at):0,1e-9),`${tag}: inner radius ${H.r}, the engine's r = ${t.r?t.r.f(rot.at):0}`);}
  ok(rot.kind==='disk'?H.r===0&&r0<1e-6:H.r>0&&near(r0,H.r,2e-6),`${tag}: ${rot.kind} drawn from radius ${r0} (r = ${H.r})`);ok(near(r1,H.R,2e-6),`${tag}: drawn out to ${r1}, R = ${H.R}`);
  ok(near((a0+a1)/2,rot.at,2e-6)&&near(a1-a0,H.thickness,1e-5),`${tag}: the ${rot.kind} is not at ${rot.at}`);
 }
 const s=rot.seg,dd=[RV.rhoOf(ax,[s[0],s[1]]),RV.rhoOf(ax,[s[2],s[3]])].map(Math.abs);
 if(rot.kind!=='shell')ok(near(H.R,Math.max(...dd),1e-12)&&(rot.kind==='disk'||near(H.r,Math.min(...dd),1e-12)),`${tag}: radii are not the slice's distances from the axis`);
 const want=rot.kind==='shell'?['r','h']:rot.kind==='disk'?['R']:['R','r'];ok(JSON.stringify(H.labels.map(l=>l.text))===JSON.stringify(want),`${tag}: labels ${H.labels.map(l=>l.text)}`);
 return{G,vols,exact,mv};
}

// ---------- 1. fixtures ----------
const EXACT_S=['pair','underRoot','underPower','leftOfPower','cap','halfCap','triangle','reciprocal','sidewaysCubic','wedge','semicircle'],CALC_S=['logParabola','expAxes','logLine','cosParabola'];
for(const name of [...EXACT_S,...CALC_S])for(let k=0;k<4;k++){
 seed(500+k*41+name.length);const R=RG.build(name),axes=V.axesFor(R);
 for(const axis of axes)for(const method of V.methodsFor(R,axis)){
  const d=V.describeRevolution(R,[{axis,method,ask:0,reveal:0}],'none');out.fixtures.rotations++;
  out.fixtures.regions[`${R.data.kind} ${method}`]=(out.fixtures.regions[`${R.data.kind} ${method}`]||0)+1;
  const val=C.numValue(V.termsFor(R,method,axis));
  checkRotation(`fixture ${name}#${k} about ${axis.type}=${axis.c} by ${method}`,d,0,R,val);}
}

// ---------- 2. generated problems ----------
const modes=[undefined,'disks_washers','shells'];
for(const [fam,f] of Object.entries(V.FAMILIES_SOLID))for(const tier of f.tiers)for(const mode of modes){
 if(mode&&!V.MODES_SOLID[mode].families[fam])continue;const kind=f.calculator?'calculator':'non-calculator';
 for(let i=0;i<N;i++){
  seed(i*7919+fam.length*131+tier.length*17+(mode?mode.length*7:0)+3);figures.length=0;let p;
  try{p=V.makeSolid({family:fam,tier,calc:kind,mode});}catch(e){out.problems.generatorErrors=(out.problems.generatorErrors||0)+1;continue;}
  out.problems.total++;const d=p.u6Revolution,meta=p.unit5Meta,tag=`${p.id} [${fam} ${tier} ${mode||'all'}]`;
  ok(!Object.keys(p).includes('u6Revolution'),`${tag}: the descriptor is enumerable`);
  ok(!JSON.stringify(p).includes('u6Revolution')&&!JSON.stringify(p).includes('"rotations"'),`${tag}: the descriptor reaches stored data`);
  if(!ok(!!d,`${tag}: no descriptor`))continue;
  const two=fam==='two_axes'||fam==='calc_two_axes';ok(d.rotations.length===(two?2:1),`${tag}: ${d.rotations.length} rotations`);
  ok(d.graph===(kind==='calculator'?'none':meta.graph),`${tag}: graph ${d.graph}, the question's ${meta.graph}`);
  const axesMeta=String(meta.axis).split('; ');
  d.rotations.forEach((rot,k)=>{out.problems.rotations++;
   // (two_axes keeps its two axes in the problem's id, the other families in its data)
   if(meta.axis!==undefined)ok(`${rot.axis.type}=${rot.axis.c}`===axesMeta[k],`${tag}: rotation ${k+1} about ${rot.axisTex}, the problem says ${axesMeta[k]}`);
   else ok(p.id.includes(`-${d.rotations.map(r=>`${r.axis.type}${r.axis.c}`).join('-')}-`),`${tag}: the problem's id does not name the axes ${d.rotations.map(r=>r.axisTex)}`);
   // the same region and slice as the explanation's picture of this rotation (and it is in the part the rotation reveals)
   const fig=figures.filter(F=>F.slice&&F.slice.axis&&F.slice.axis.type===rot.axis.type&&F.slice.axis.c===rot.axis.c).pop();
   const R=fig&&fig.R,same=R&&(['xs','ys'].every(key=>{const a=R[key],b=d[key];if(!a&&!b)return true;if(!a||!b||a.length!==b.length)return false;return a.every((q,j)=>(key==='xs'?q.top:q.right).f===b[j].top&&(key==='xs'?q.bot:q.left).f===b[j].bot&&q.a.v===b[j].a&&q.b.v===b[j].b);}));
   if(ok(same,`${tag}: rotation ${k+1}'s 2D picture is not drawn from the descriptor's region`)){
    ok(fig.slice.v===rot.v&&fig.slice.at===rot.at&&(fig.slice.kind==='shell'?'shell':fig.slice.kind==='washer'?['washer','disk'].includes(rot.kind):true),`${tag}: the 2D slice ${fig.slice.v} = ${fig.slice.at} (${fig.slice.kind}), the model's ${rot.v} = ${rot.at} (${rot.kind})`);
    const seg=C.sliceSegment(R,rot.v,rot.at);ok(seg&&seg.every((c,j)=>c===rot.seg[j]),`${tag}: slice end points ${seg} vs ${rot.seg}`);}
   ok(/u6-fig-row/.test(p.parts[rot.reveal]?.explanation||''),`${tag}: Part ${rot.reveal+1}'s explanation has no picture`);
   // the answer for this rotation: the last part about it with a value
   const own=two?(k===0?p.parts[0]:p.parts[p.parts.length-1]):p.parts[p.parts.length-1];
   const res=checkRotation(`${tag} rotation ${k+1} about ${rot.axisTex}`,d,k,R,own.answer?.value);
   // typed radius / height parts: the model's distances
   if(res&&!two)for(const q of p.parts.filter(q=>q.control==='u6-expr')){const fn=q.answer.expr,H=res.G.highlight;
    const val=fn.f(rot.at),want=/outer radius|R\(/.test(q.prompt)?H.R:/inner radius|r\(/.test(q.prompt)&&rot.kind!=='shell'?H.r:/height/.test(q.prompt)?H.height:H.radius;
    ok(near(val,want,1e-9),`${tag}: typed part "${q.prompt.slice(0,40)}" gives ${val} at ${rot.at}, the model ${want}`);out.problems.typedParts=(out.problems.typedParts||0)+1;}
   const ck=`${fam} | ${tier} | ${kind} | ${rot.method}:${rot.kind} | ${axisKind(d,rot.axis)} | ${d.region||(fam==='trig_solid'?'trig':'under_curve')} | ${two?'two axes':'one axis'}`;out.coverage[ck]=(out.coverage[ck]||0)+1;
  });
  if(two&&d.rotations.length===2){const [r1,r2]=d.rotations;ok(r1.axis.type!==r2.axis.type||r1.axis.c!==r2.axis.c,`${tag}: the two rotations have the same axis`);}
 }}

// ---------- 3. refusals ----------
{seed(91);const R=RG.build('pair'),d=V.describeRevolution(R,[{axis:{type:'y',c:-1},method:'washer',ask:0,reveal:0}],'none'),rot=d.rotations[0];
 const bad=(over,rotOver={})=>[{...d,...over},{...rot,...rotOver}];
 const cases={'axis cuts the region':bad({},{axis:{type:'y',c:0.3}}),'unknown axis':bad({},{axis:{type:'z',c:0}}),'undefined boundary':bad({xs:d.xs.map(q=>({...q,top:x=>x>0.5?NaN:q.top(x)}))}),
  'out of order':bad({xs:d.xs.map(q=>({...q,top:q.bot,bot:q.top}))}),'no area':bad({xs:d.xs.map(q=>({...q,top:q.bot}))}),'too large':bad({xs:d.xs.map(q=>({...q,top:x=>q.top(x)*1e5}))}),
  'no slice':bad({},{seg:null}),'unknown method':bad({},{method:'cones',kind:'cone'}),'shell on the axis':bad({},{kind:'shell',method:'shell',v:'y',seg:[0.2,-1,0.9,-1]}),'no data':[null,null]};
 for(const [name,[dd,rr]] of Object.entries(cases)){const v=RV.validate(dd,rr);out.refusals[name]=v.ok?'ACCEPTED':v.reason;ok(!v.ok,`refusal: ${name} was accepted`);}}

// the coverage table by family
const fams={};for(const [k,n] of Object.entries(out.coverage)){const [fam,tier,kind,mk,axis,region,two]=k.split(' | ');const r=fams[fam]=fams[fam]||{problems:0,tiers:new Set(),kinds:new Set(),methods:new Set(),axes:new Set(),regions:new Set()};
 r.problems+=n;r.tiers.add(tier);r.kinds.add(kind);r.methods.add(mk);r.axes.add(axis);r.regions.add(region);}
out.coverageByFamily=Object.fromEntries(Object.keys(V.FAMILIES_SOLID).map(f=>[f,fams[f]?Object.fromEntries(Object.entries(fams[f]).map(([k,v])=>[k,v instanceof Set?[...v].sort():v])):'NONE']));
const missing=Object.entries(out.coverageByFamily).filter(([,r])=>r==='NONE').map(([k])=>k);if(missing.length)fail(`no generated problem for ${missing}`);
out.coverageCells=Object.keys(out.coverage).length;delete out.coverage;
console.log(JSON.stringify(out,null,1));
if(out.failures.length)process.exitCode=1;
