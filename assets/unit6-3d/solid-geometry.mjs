// BatchMath v13.0.B (experimental): the geometry of a solid with known cross sections, built from the generator's own
// base region (problem.u6Solid). Every cross-section shape of the Volume by Cross Sections engine and both directions:
//   squares, rectangles of height m*s, semicircles with the slice as DIAMETER, quarter circles with the slice as RADIUS,
//   equilateral triangles, isosceles right triangles with the slice as a LEG or as the HYPOTENUSE;
//   slices perpendicular to the x-axis (pieces give bot(x) and top(x)) or to the y-axis (pieces give left(y), right(y)).
// No rendering here, so it can be tested on its own.
//
// Math coordinates, one scale on every axis: the base lies in the xy-plane (z = 0) and the cross sections stand up in z.
// t is the slicing variable (x or y). At t the slice runs across the base from lo(t) to hi(t), length s(t) = hi - lo.
// The cross section is a profile in local coordinates (u, w): u along the slice from its lo end (0 <= u <= s), w up (z).
//   perpendicular to the x-axis: (u, w) at t  ->  (x, y, z) = (t, lo(t) + u, w)   (the section lies in the plane of x)
//   perpendicular to the y-axis: (u, w) at t  ->  (x, y, z) = (lo(t) + u, t, w)   (the section lies in the plane of y)
// Both are built directly in their own orientation (the y solid is not a rotated x solid). A profile's first edge is
// the slice itself, (0,0)-(s,0); the profile goes counterclockwise in (u, w).
// The quarter circle has its centre, and the leg-type isosceles right triangle its right angle, at the lo end of the
// slice (u = 0), as in the 2D pictures (the left end of the base).
//
// The surface is sampled with cosine spacing on each piece (more samples near the ends, where boundaries such as
// sqrt(r^2 - x^2) are steep), every breakpoint between pieces is a sample, and the highlighted cross section and the
// outlines are computed from the boundary functions themselves at their t, not interpolated. Arcs are polygons whose
// vertices lie exactly on the circle (64 segments for the semicircle, 32 for the quarter circle); their area is the
// circle's times chordFactor(key) = 0.999598, which the tests account for explicitly.

const EPS=1e-9,R3=Math.sqrt(3);
export const ARC_SEGMENTS=Object.freeze({semicircle_d:64,quarter:32});
// the eight shapes the generator uses (rect2, rect3: rectangles of height 2s and 3s)
export const SHAPE_KEYS=Object.freeze(['square','rect2','rect3','semicircle_d','quarter','equilateral','iso_leg','iso_hyp']);
const FIXED_K={square:1,semicircle_d:Math.PI/8,quarter:Math.PI/4,equilateral:R3/4,iso_leg:1/2,iso_hyp:1/4};
const rectMult=key=>{const m=/^rect(\d+)$/.exec(key||'');return m?Number(m[1]):0;};
// the area of the exact profile with side s is areaFactor(key) * s^2
export function areaFactor(key){const m=rectMult(key);return m?m:(FIXED_K[key]??NaN);}
// drawn polygon area / exact area (1 for shapes with straight sides)
export function chordFactor(key){
 if(key==='semicircle_d'){const M=ARC_SEGMENTS.semicircle_d;return M*Math.sin(Math.PI/M)/Math.PI;}
 if(key==='quarter'){const M=ARC_SEGMENTS.quarter;return 2*M*Math.sin(Math.PI/(2*M))/Math.PI;}
 return 1;
}
export function shapeKey(desc){
 if(!desc)return null;
 if(desc.shape==='rect')return Number.isInteger(desc.mult)&&desc.mult>0&&desc.mult<=4?`rect${desc.mult}`:null;
 return SHAPE_KEYS.includes(desc.shape)?desc.shape:null;
}
// what the shape is called (legend, aria label)
export const SHAPE_WORDS=Object.freeze({
 square:{solid:'square cross sections',one:'a square with side s'},
 rect2:{solid:'rectangular cross sections',one:'a rectangle with base s and height 2s'},
 rect3:{solid:'rectangular cross sections',one:'a rectangle with base s and height 3s'},
 semicircle_d:{solid:'semicircular cross sections',one:'a semicircle with diameter d = s (radius s/2)'},
 quarter:{solid:'quarter-circle cross sections',one:'a quarter circle with radius s'},
 equilateral:{solid:'equilateral triangle cross sections',one:'an equilateral triangle with side s'},
 iso_leg:{solid:'isosceles right triangle cross sections',one:'an isosceles right triangle with leg s'},
 iso_hyp:{solid:'isosceles right triangle cross sections',one:'an isosceles right triangle with hypotenuse s'},
});

// the cross section with side s in local (u, w): points counterclockwise starting with the slice (0,0)-(s,0);
// nrm[j]: the outward radial direction at an arc vertex (null elsewhere); curved[e]: edge e (pts[e] -> pts[e+1]) is an
// arc; corners: vertices off the base where the profile has a corner (their paths are the solid's edges); crest: the top
// of a semicircle (drawn as a lighter line)
export function profile(key,s){
 const pts=[],nrm=[],curved=[],corners=[];let crest=null;
 const add=(u,w,n=null)=>{pts.push([u,w]);nrm.push(n);};
 const m=rectMult(key);
 if(key==='square'||m){const h=m?m*s:s;add(0,0);add(s,0);add(s,h);add(0,h);corners.push(2,3);}
 else if(key==='equilateral'){add(0,0);add(s,0);add(s/2,R3*s/2);corners.push(2);}
 else if(key==='iso_leg'){add(0,0);add(s,0);add(0,s);corners.push(2);}
 else if(key==='iso_hyp'){add(0,0);add(s,0);add(s/2,s/2);corners.push(2);}
 else if(key==='semicircle_d'){ // centre (s/2, 0), radius s/2: from (s,0) over the top back to (0,0)
  const M=ARC_SEGMENTS.semicircle_d,r=s/2;add(0,0,[-1,0]);add(s,0,[1,0]);
  for(let j=1;j<M;j++){const a=Math.PI*j/M;add(r+r*Math.cos(a),r*Math.sin(a),[Math.cos(a),Math.sin(a)]);}
  crest=1+M/2;}
 else if(key==='quarter'){ // centre (0,0), radius s: the slice is one radius, the other stands at u = 0
  const M=ARC_SEGMENTS.quarter;add(0,0);add(s,0,[1,0]);
  for(let j=1;j<=M;j++){const a=Math.PI/2*j/M;add(j===M?0:s*Math.cos(a),j===M?s:s*Math.sin(a),[j===M?0:Math.cos(a),j===M?1:Math.sin(a)]);}
  corners.push(M+1);}
 else throw Error(`3D model: unknown cross-section shape ${key}`);
 for(let e=0;e<pts.length;e++){const f=(e+1)%pts.length;curved.push(!!(nrm[e]&&nrm[f]&&e>0&&!(key==='quarter'&&f===0)));}
 return{pts,nrm,curved,corners,crest};
}
// area of a closed polygon in (u, w) (shoelace)
export function polygonArea(pts){let a=0;for(let i=0;i<pts.length;i++){const [u0,w0]=pts[i],[u1,w1]=pts[(i+1)%pts.length];a+=u0*w1-u1*w0;}return a/2;}

// the boundaries at t: the piece containing t (the first one at a shared end), and s = hi - lo
export function evalAt(desc,t){
 const ps=desc.pieces,p=ps.find(q=>t>=q.a-EPS&&t<=q.b+EPS)||(t<ps[0].a?ps[0]:ps[ps.length-1]);
 const lo=p.bot(t),hi=p.top(t);return{t,lo,hi,s:hi-lo};
}
export const toWorld=(dir,t,lo,u,w)=>dir==='x'?[t,lo+u,w]:[lo+u,t,w];

// can this problem be drawn safely? {ok} or {ok:false, reason}
export function validate(desc,{n=72}={}){
 if(!desc)return{ok:false,reason:'the problem has no base-region data'};
 if(desc.dir!=='x'&&desc.dir!=='y')return{ok:false,reason:`unknown slicing direction ${desc.dir}`};
 const key=shapeKey(desc);if(!key)return{ok:false,reason:`unknown cross-section shape ${desc.shape}${desc.mult?` (${desc.mult})`:''}`};
 // the engine's own area factor must be the drawn shape's (the model shows exactly the shape the answer uses)
 if(!(Number.isFinite(desc.k)&&Math.abs(desc.k-areaFactor(key))<=1e-12))return{ok:false,reason:`the engine's area factor ${desc.k} is not the ${key} factor ${areaFactor(key)}`};
 const ps=desc.pieces;if(!Array.isArray(ps)||!ps.length)return{ok:false,reason:'no base region'};
 const v=desc.dir;
 for(let i=0;i<ps.length;i++){const p=ps[i];
  if(!(Number.isFinite(p.a)&&Number.isFinite(p.b)&&p.b-p.a>EPS)||typeof p.top!=='function'||typeof p.bot!=='function')return{ok:false,reason:`piece ${i+1} is not an interval with two boundaries`};
  if(i&&Math.abs(ps[i-1].b-p.a)>1e-9*Math.max(1,Math.abs(p.a)))return{ok:false,reason:'the pieces do not join'};
  // consecutive pieces must give the same boundary at the breakpoint (the region has no jump)
  if(i){const q=ps[i-1],t=p.a,tol=1e-7*Math.max(1,Math.abs(q.top(t)),Math.abs(q.bot(t)));if(Math.abs(q.top(t)-p.top(t))>tol||Math.abs(q.bot(t)-p.bot(t))>tol)return{ok:false,reason:`the boundaries jump at ${v} = ${t}`};}}
 let smax=0,big=0;const m=rectMult(key)||1;
 for(const t of sampleXs(ps,n)){const {lo,hi,s}=evalAt(desc,t);
  if(![lo,hi].every(Number.isFinite))return{ok:false,reason:`a boundary is undefined at ${v} = ${t}`};
  if(s<-1e-9*Math.max(1,Math.abs(hi),Math.abs(lo)))return{ok:false,reason:`the boundaries are out of order at ${v} = ${t}`};
  smax=Math.max(smax,s);big=Math.max(big,Math.abs(t),Math.abs(hi),Math.abs(lo),m*s);}
 if(!(smax>EPS))return{ok:false,reason:'the region has no width'};
 if(big>1e3)return{ok:false,reason:'the region is too large to draw'};
 const st=desc.slice;if(!(Number.isFinite(st)&&st>ps[0].a&&st<ps[ps.length-1].b))return{ok:false,reason:'no slice inside the region'};
 if(!(evalAt(desc,st).s>EPS))return{ok:false,reason:'the highlighted slice has no length'};
 return{ok:true};
}

// values of t on the pieces: cosine spacing on each piece, with every piece end exactly once
export function sampleXs(pieces,n=72){
 const ts=[];
 pieces.forEach((p,i)=>{for(let j=i?1:0;j<=n;j++)ts.push(j===0?p.a:j===n?p.b:p.a+(p.b-p.a)*(1-Math.cos(Math.PI*j/n))/2);});
 return ts;
}

// signed volume of a closed, outward-oriented triangle list [x0,y0,z0, x1,y1,z1, ...] (divergence theorem)
export function meshVolume(...lists){
 let v=0;for(const tris of lists)for(let i=0;i<tris.length;i+=9){const a=tris[i],b=tris[i+1],c=tris[i+2],d=tris[i+3],e=tris[i+4],f=tris[i+5],g=tris[i+6],h=tris[i+7],k=tris[i+8];v+=a*(e*k-f*h)-b*(d*k-f*g)+c*(d*h-e*g);}
 return v/6;
}

// labels, right-angle marks and helper lines of one cross section, in local (u, w); U is the label size unit
export function decorations(key,s,U){
 const labels=[],marks=[],aux=[],lab=(text,u,w)=>labels.push({text,u,w}),below=-0.75*U,m=rectMult(key);
 if(key==='square'){lab('s',s/2,below);lab('s',s+0.75*U,s/2);}
 else if(m){lab('s',s/2,below);lab(`${m}s`,s+0.95*U,m*s/2);}
 else if(key==='semicircle_d'){const r=s/2,a=0.3*Math.PI,e=[r+r*Math.cos(a),r*Math.sin(a)];aux.push([[r,0],e]);
  // (the radius label sits beyond the end of the radius it names, clear of the diameter's label)
  lab('d = s',s/2,below);lab('r = s/2',r+(r+1.5*U)*Math.cos(a),(r+1.5*U)*Math.sin(a));}
 else if(key==='quarter'){lab('r = s',s/2,below);lab('s',-0.75*U,s/2);}
 else if(key==='equilateral'){const h=R3*s/2;lab('s',s/2,below);lab('s',s/4-0.75*U*R3/2,h/2+0.75*U/2);lab('s',3*s/4+0.75*U*R3/2,h/2+0.75*U/2);}
 else if(key==='iso_leg'){const d=Math.min(0.2*s,0.45*U);lab('s',s/2,below);lab('s',-0.75*U,s/2);marks.push([[d,0],[d,d],[0,d]]);}
 else if(key==='iso_hyp'){const d=Math.min(0.2*s,0.45*U),q=d/Math.SQRT2,ax=s/2,aw=s/2;lab('s',s/2,below);marks.push([[ax-q,aw-q],[ax,aw-2*q],[ax+q,aw-q]]);}
 return{labels,marks,aux};
}

// the whole solid: surface (outward-oriented triangles: flat faces, curved faces with their normals, end caps), the base
// region, its outline, the solid's edges, cross-section outlines along it, the highlighted cross section and the bounds
export function buildSolid(desc,{n=72,sections=9}={}){
 const check=validate(desc,{n});if(!check.ok)throw Error(`3D model: ${check.reason}`);
 const key=shapeKey(desc),dir=desc.dir,flip=dir==='y'; // (u, w, t) -> (y, z, x) is right-handed; (x, z, y) is not
 const W=(t,lo,[u,w])=>toWorld(dir,t,lo,u,w),Nw=([a,b])=>dir==='x'?[0,a,b]:[a,0,b];
 const topo=profile(key,1),NP=topo.pts.length,normals=topo.nrm.map(q=>q&&Nw(q));
 const section=t=>{const q=evalAt(desc,t),s=Math.max(0,q.s);return{t,lo:q.lo,hi:q.hi,s,pts:profile(key,s).pts.map(p=>W(t,q.lo,p))};};
 const S=sampleXs(desc.pieces,n).map(section);
 const base=[],flat=[],curved=[],curvedN=[],caps=[];
 const put=(arr,ps)=>{for(const p of ps)arr.push(p[0],p[1],p[2]);};
 const tri=(arr,a,b,c,nrm,na,nb,nc)=>{if(flip){put(arr,[a,c,b]);if(nrm)put(nrm,[na,nc,nb]);}else{put(arr,[a,b,c]);if(nrm)put(nrm,[na,nb,nc]);}};
 for(let i=0;i+1<S.length;i++){const L=S[i].pts,R=S[i+1].pts;
  for(let e=0;e<NP;e++){const j=e,k=(e+1)%NP,A=L[j],B=L[k],C=R[k],D=R[j];
   if(e===0){tri(base,A,B,C);tri(base,A,C,D);}
   else if(topo.curved[e]){tri(curved,A,B,C,curvedN,normals[j],normals[k],normals[k]);tri(curved,A,C,D,curvedN,normals[j],normals[k],normals[j]);}
   else{tri(flat,A,B,C);tri(flat,A,C,D);}}}
 // end cross sections (none where the boundaries meet): the profile's normal is +t, so the first end is reversed
 const end=(E,first)=>{if(E.s<EPS)return;const P=E.pts;for(let j=1;j+1<NP;j++)first?tri(caps,P[0],P[j+1],P[j]):tri(caps,P[0],P[j],P[j+1]);};
 end(S[0],true);end(S[S.length-1],false);
 let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity,zmax=0;
 for(const q of S)for(const p of q.pts){xmin=Math.min(xmin,p[0]);xmax=Math.max(xmax,p[0]);ymin=Math.min(ymin,p[1]);ymax=Math.max(ymax,p[1]);zmax=Math.max(zmax,p[2]);}
 const bounds={xmin,xmax,ymin,ymax,zmax},span=Math.max(xmax-xmin,ymax-ymin,zmax,1),U=span/10;
 const first=desc.pieces[0].a,last=desc.pieces[desc.pieces.length-1].b;
 const outlines=[];for(let j=1;j<=sections;j++){const q=section(first+(last-first)*j/(sections+1));if(q.s>EPS)outlines.push(q);}
 // the highlighted cross section at the 2D picture's slice, from the boundary functions themselves
 const H=section(desc.slice),dec=decorations(key,H.s,U),hw=p=>W(H.t,H.lo,p);
 const fill=[];for(let j=1;j+1<NP;j++)put(fill,[H.pts[0],H.pts[j],H.pts[j+1]]);
 const highlight={t:H.t,lo:H.lo,hi:H.hi,s:H.s,pts:H.pts,fill:new Float32Array(fill),slice:[H.pts[0],H.pts[1]],
  labels:dec.labels.map(l=>({text:l.text,at:hw([l.u,l.w])})),marks:dec.marks.map(m=>m.map(hw)),aux:dec.aux.map(m=>m.map(hw)),area:polygonArea(profile(key,H.s).pts)};
 return{key,dir,samples:S.map(({t,lo,hi,s})=>({t,lo,hi,s})),
  surface:{flat:new Float32Array(flat),curved:new Float32Array(curved),curvedNormals:new Float32Array(curvedN),caps:new Float32Array(caps)},base:new Float32Array(base),
  outline:{lo:S.map(q=>q.pts[0]),hi:S.map(q=>q.pts[1]),ends:[S[0],S[S.length-1]].filter(q=>q.s>EPS).map(q=>[q.pts[0],q.pts[1]])},
  edges:topo.corners.map(c=>S.map(q=>q.pts[c])),crest:topo.crest==null?null:S.map(q=>q.pts[topo.crest]),
  ends:[S[0],S[S.length-1]].filter(q=>q.s>EPS).map(q=>q.pts),
  sections:outlines.map(q=>({t:q.t,lo:q.lo,hi:q.hi,s:q.s,pts:q.pts})),highlight,bounds,unit:U};
}
