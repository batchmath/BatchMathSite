// v13.0.A experimental 3D cross sections: the solid built for the 3D model agrees with the problem's own mathematics.
// For many generated Volume by Cross Sections problems (every family, tier and calculator kind):
//  - the descriptor is attached to the non-calculator families (cs_basic, cs_setup) only, never enumerable;
//  - the model is offered only for square cross sections perpendicular to the x-axis, and every such problem validates;
//  - the closed mesh's volume (divergence theorem) equals the problem's own answer (exact value or setup value), and so
//    does an independent integral of s(x)^2 from the boundary functions;
//  - a typed A(x) answer (intermediate cs_basic) equals s(x)^2 of the model at sample points;
//  - every drawn square (the outlines along the solid and the highlighted one) has side top(x) - bot(x) in BOTH
//    directions, lies in the plane of its x, and the highlighted one sits where the 2D picture's slice is;
//  - the base and the walls follow the boundary functions exactly at every sample.
// Usage: node tools/review-lab/unit6/qa/solid3d.mjs [problems per family, tier and kind=60]
import {load} from './lib.mjs';
import {validate,buildSquareSolid,meshVolume,evalAt,sampleXs} from '../../../../assets/unit6-3d/solid-geometry.mjs';
const N=+(process.argv[2]||120);
const L=load(['unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js']);L.ctx.console={...console,warn(){}};
const W=L.W,V=W.BatchMathUnit6Volume,C=W.BatchMathUnit6Core;
const rel=(a,b,r)=>Math.abs(a-b)<=r*Math.max(1,Math.abs(a),Math.abs(b));
const out={problems:0,withDescriptor:0,supported:0,byRegion:{},maxMeshError:0,maxIntegralError:0,squaresChecked:0,aChecked:0,unsupportedRejected:0,failures:[]};
const fail=m=>{if(out.failures.length<40)out.failures.push(m);};
const kt=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});
const simpson=(f,a,b,n=4000)=>{const g=u=>f(a+(b-a)*(3*u*u-2*u*u*u))*(b-a)*6*u*(1-u),h=1/n;let s=g(0)+g(1);for(let i=1;i<n;i++)s+=(i%2?4:2)*g(i*h);return s*h/3;};
for(const [fam,f] of Object.entries(V.FAMILIES_CS))for(const kind of ['calculator','non-calculator'])for(const tier of kt(f)[kind==='calculator'?'calculator':'noncalculator'])for(let i=0;i<N;i++){
 // every family, and the "perpendicular to the x-axis" Practice Type, so squares on x come up often
 for(const mode of [undefined,'perp_x']){
  L.seed(i*7919+fam.length*131+tier.length*17+kind.length+(mode?5:0));let p;try{p=V.makeCS({family:fam,tier,calc:kind,mode});}catch(e){continue;}
  out.problems++;const d=p.u6Solid,meta=p.unit5Meta;
  if(Object.keys(p).includes('u6Solid'))fail(`${p.id}: the descriptor is enumerable`);
  if(JSON.stringify(p).includes('u6Solid'))fail(`${p.id}: the descriptor reaches stored data`);
  if(fam==='cs_calc'){if(d)fail(`${p.id}: a calculator problem has a descriptor`);continue;}
  if(!d){fail(`${p.id}: no descriptor`);continue;}out.withDescriptor++;
  const want=meta.dir==='x'&&d.shape==='square'&&!p.calculatorActive,v=validate(d);
  if(!want){if(v.ok)fail(`${p.id}: validates although it is ${d.shape} perpendicular to ${d.dir}`);else out.unsupportedRejected++;continue;}
  if(!v.ok){fail(`${p.id}: square on x but not drawable: ${v.reason}`);continue;}
  out.supported++;out.byRegion[meta.region]=(out.byRegion[meta.region]||0)+1;
  const G=buildSquareSolid(d);
  // the problem's own answer: the last part's value (an exact volume or the value of the setup)
  const ans=[...p.parts].reverse().find(q=>q.answer&&Number.isFinite(q.answer.value)&&['exact','u6-integral'].includes(q.answer.kind)).answer.value;
  const exact=d.pieces.reduce((t,q)=>t+simpson(x=>(q.top(x)-q.bot(x))**2,q.a,q.b),0);
  const closed=[...G.surface.top,...G.surface.walls,...G.surface.caps,...G.surface.bottom],mv=meshVolume(closed);
  const eI=Math.abs(exact-ans)/Math.max(1,Math.abs(ans)),eM=Math.abs(mv-ans)/Math.max(1,Math.abs(ans));
  out.maxIntegralError=Math.max(out.maxIntegralError,eI);out.maxMeshError=Math.max(out.maxMeshError,eM);
  if(eI>1e-7)fail(`${p.id}: the integral of s^2 is ${exact}, the answer is ${ans}`);
  if(eM>5e-3)fail(`${p.id}: the solid's volume is ${mv}, the answer is ${ans} (relative ${eM})`);
  // A(x) typed answers (intermediate cs_basic): the model's square area s(x)^2
  const ap=p.parts.find(q=>q.control==='u6-expr');
  if(ap){const target=ap.answer.expr;if(!target||typeof target.f!=='function')fail(`${p.id}: A(x) part without its function`);
   else for(const x of sampleXs(d.pieces,8).slice(1,-1)){out.aChecked++;const q=evalAt(d,x);if(!rel(target.f(x),q.s*q.s,1e-9))fail(`${p.id}: A(${x}) = ${target.f(x)} but s^2 = ${q.s*q.s}`);}}
  // every square: side top - bot both ways, in the plane of its x, standing on the base
  for(const sq of [...G.sections,G.highlight]){out.squaresChecked++;const q=evalAt(d,sq.x),[c0,c1,c2,c3]=sq.corners;
   if(!rel(sq.s,q.top-q.bot,1e-12)||!rel(c1[1]-c0[1],sq.s,1e-12)||!rel(c2[2]-c1[2],sq.s,1e-12)||!rel(c3[2],sq.s,1e-12)||c0[2]!==0||c1[2]!==0)fail(`${p.id}: the square at x = ${sq.x} is not ${q.top-q.bot} by ${q.top-q.bot}`);
   if(![c0,c1,c2,c3].every(c=>c[0]===sq.x))fail(`${p.id}: the square at x = ${sq.x} is not in the plane of x`);
   if(!rel(c0[1],q.bot,1e-12)||!rel(c1[1],q.top,1e-12))fail(`${p.id}: the square at x = ${sq.x} does not span from the lower to the upper curve`);}
  if(G.highlight.x!==d.slice)fail(`${p.id}: the highlighted square is not at the 2D slice`);
  if(!(G.highlight.s>0))fail(`${p.id}: the highlighted square has no size`);
  // the base and the walls follow the boundary functions at every sample
  for(const s of G.samples){const q=evalAt(d,s.x);if(!rel(s.bot,q.bot,1e-12)||!rel(s.top,q.top,1e-12)||!rel(s.s,Math.max(0,q.top-q.bot),1e-12))fail(`${p.id}: sample at x = ${s.x} is off the curves`);}
 }
}
console.log(JSON.stringify(out,null,1));
if(out.failures.length||out.supported<100)process.exitCode=1; // (about 130 square-on-x problems at the default 120)
