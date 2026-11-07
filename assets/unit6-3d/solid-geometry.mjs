// BatchMath v13.0.A (experimental): the geometry of a solid whose cross sections perpendicular to the x-axis are
// SQUARES, built from the generator's own base region (problem.u6Solid: consecutive pieces, each with its bottom and top
// boundary as functions of x). No rendering here, so it can be tested on its own.
//
// Math coordinates: the base lies in the xy-plane (z = 0). The cross section at x stands in the plane of that x: a square
// whose side is the slice across the base, s(x) = top(x) - bot(x). It spans y from bot(x) to top(x) and z from 0 to s(x):
// the same length in both directions (never a radius, a half-width or any other distance).
//
// The surface is sampled with cosine spacing on each piece (more samples near the ends, where boundaries such as
// sqrt(r^2 - x^2) are steep), every breakpoint between pieces is a sample, and the representative cross section is
// computed from the boundary functions themselves at its x, not from the samples.

const EPS=1e-9;
export const SUPPORTED={dir:'x',shape:'square'};

// the boundaries at x: the piece containing x (the first one at a shared end), and s = top - bot
export function evalAt(desc,x){
 const ps=desc.pieces,p=ps.find(q=>x>=q.a-EPS&&x<=q.b+EPS)||(x<ps[0].a?ps[0]:ps[ps.length-1]);
 const bot=p.bot(x),top=p.top(x);return{x,bot,top,s:top-bot};
}

// can this problem be shown as a solid with square cross sections perpendicular to the x-axis? (reason when not)
export function validate(desc,{n=72}={}){
 if(!desc||desc.dir!==SUPPORTED.dir||desc.shape!==SUPPORTED.shape)return{ok:false,reason:'not square cross sections perpendicular to the x-axis'};
 const ps=desc.pieces;if(!Array.isArray(ps)||!ps.length)return{ok:false,reason:'no base region'};
 for(let i=0;i<ps.length;i++){const p=ps[i];
  if(!(Number.isFinite(p.a)&&Number.isFinite(p.b)&&p.b-p.a>EPS)||typeof p.top!=='function'||typeof p.bot!=='function')return{ok:false,reason:`piece ${i+1} is not an interval with two boundaries`};
  if(i&&Math.abs(ps[i-1].b-p.a)>1e-9*Math.max(1,Math.abs(p.a)))return{ok:false,reason:'the pieces do not join'};
  // consecutive pieces must give the same boundary at the breakpoint (the region has no jump)
  if(i){const q=ps[i-1],x=p.a,tol=1e-7*Math.max(1,Math.abs(q.top(x)),Math.abs(q.bot(x)));if(Math.abs(q.top(x)-p.top(x))>tol||Math.abs(q.bot(x)-p.bot(x))>tol)return{ok:false,reason:`the boundaries jump at x = ${x}`};}}
 let smax=0,big=0;
 for(const x of sampleXs(ps,n)){const {bot,top,s}=evalAt(desc,x);
  if(![bot,top].every(Number.isFinite))return{ok:false,reason:`a boundary is undefined at x = ${x}`};
  if(s<-1e-9*Math.max(1,Math.abs(top),Math.abs(bot)))return{ok:false,reason:`the curves are out of order at x = ${x}`};
  smax=Math.max(smax,s);big=Math.max(big,Math.abs(x),Math.abs(top),Math.abs(bot),s);}
 if(!(smax>EPS))return{ok:false,reason:'the region has no width'};
 if(big>1e3)return{ok:false,reason:'the region is too large to draw'};
 const sx=desc.slice;if(!(Number.isFinite(sx)&&sx>ps[0].a&&sx<ps[ps.length-1].b))return{ok:false,reason:'no slice inside the region'};
 return{ok:true};
}

// x-values on the pieces: cosine spacing on each piece, with every piece end exactly once
export function sampleXs(pieces,n=72){
 const xs=[];
 pieces.forEach((p,i)=>{for(let j=i?1:0;j<=n;j++)xs.push(j===0?p.a:j===n?p.b:p.a+(p.b-p.a)*(1-Math.cos(Math.PI*j/n))/2);});
 return xs;
}

// signed volume of a closed, outward-oriented triangle list [x0,y0,z0, x1,y1,z1, ...] (divergence theorem)
export function meshVolume(tris){
 let v=0;for(let i=0;i<tris.length;i+=9){const [a,b,c,d,e,f,g,h,k]=tris.slice(i,i+9);v+=a*(e*k-f*h)-b*(d*k-f*g)+c*(d*h-e*g);}
 return v/6;
}

// the whole solid: surface pieces (outward-oriented triangles), the base region, its outline, the top edges, a set of
// cross-section outlines along the solid, the highlighted cross section and the bounds
export function buildSquareSolid(desc,{n=72,sections=9}={}){
 const check=validate(desc,{n});if(!check.ok)throw Error(`3D model: ${check.reason}`);
 const S=sampleXs(desc.pieces,n).map(x=>{const q=evalAt(desc,x);return{...q,s:Math.max(0,q.s)};});
 const top=[],walls=[],bottom=[],caps=[],base=[];
 const tri=(arr,...p)=>{for(const v of p)arr.push(v[0],v[1],v[2]);};
 for(let i=0;i+1<S.length;i++){const L=S[i],R=S[i+1];
  // top of the solid: z = s(x) for y between the curves (outward normal up)
  const A=[L.x,L.bot,L.s],B=[R.x,R.bot,R.s],C=[R.x,R.top,R.s],D=[L.x,L.top,L.s];tri(top,A,B,C);tri(top,A,C,D);
  // the two side walls over the boundary curves, from the base up to the top of the squares
  const P=[L.x,L.top,0],Q=[R.x,R.top,0],Rt=[R.x,R.top,R.s],St=[L.x,L.top,L.s];tri(walls,P,Rt,Q);tri(walls,P,St,Rt);
  const P2=[L.x,L.bot,0],Q2=[R.x,R.bot,0],R2=[R.x,R.bot,R.s],S2=[L.x,L.bot,L.s];tri(walls,P2,Q2,R2);tri(walls,P2,R2,S2);
  // the base region (z = 0): drawn as the base, and the bottom of the closed solid (outward normal down)
  const a0=[L.x,L.bot,0],b0=[R.x,R.bot,0],c0=[R.x,R.top,0],d0=[L.x,L.top,0];tri(bottom,a0,c0,b0);tri(bottom,a0,d0,c0);tri(base,a0,b0,c0);tri(base,a0,c0,d0);}
 // end squares (zero size where the curves meet)
 const end=(E,sign)=>{if(E.s<EPS)return;const e0=[E.x,E.bot,0],e1=[E.x,E.top,0],e2=[E.x,E.top,E.s],e3=[E.x,E.bot,E.s];if(sign>0){tri(caps,e0,e1,e2);tri(caps,e0,e2,e3);}else{tri(caps,e0,e2,e1);tri(caps,e0,e3,e2);}};
 end(S[0],-1);end(S[S.length-1],1);
 const first=desc.pieces[0].a,last=desc.pieces[desc.pieces.length-1].b;
 const square=x=>{const q=evalAt(desc,x),s=Math.max(0,q.s);return{x,bot:q.bot,top:q.top,s,corners:[[x,q.bot,0],[x,q.top,0],[x,q.top,s],[x,q.bot,s]]};};
 const outlines=[];for(let k=1;k<=sections;k++){const sq=square(first+(last-first)*k/(sections+1));if(sq.s>EPS)outlines.push(sq);}
 const outline={bottom:S.map(q=>[q.x,q.bot,0]),top:S.map(q=>[q.x,q.top,0]),ends:[S[0],S[S.length-1]].filter(q=>q.s>EPS).map(q=>[[q.x,q.bot,0],[q.x,q.top,0]])};
 const edges={bottom:S.map(q=>[q.x,q.bot,q.s]),top:S.map(q=>[q.x,q.top,q.s])};
 let ymin=Infinity,ymax=-Infinity,zmax=0;for(const q of S){ymin=Math.min(ymin,q.bot);ymax=Math.max(ymax,q.top);zmax=Math.max(zmax,q.s);}
 return{samples:S,surface:{top:new Float32Array(top),walls:new Float32Array(walls),caps:new Float32Array(caps),bottom:new Float32Array(bottom)},base:new Float32Array(base),
  outline,edges,sections:outlines,highlight:square(desc.slice),bounds:{xmin:first,xmax:last,ymin,ymax,zmax}};
}
