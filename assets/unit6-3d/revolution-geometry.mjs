// BatchMath v13.0.C (experimental): the geometry of a solid of revolution, built from the generator's own region and
// axis (problem.u6Revolution). No rendering here, so it can be tested on its own.
//
// Math coordinates, one scale on every axis: the region lies in the xy-plane (z = 0). The axis of rotation is the line
// y = c, z = 0 (parallel to the x-axis) or x = c, z = 0 (parallel to the y-axis). Turning the plane by an angle t about
// that line takes (x, y, 0) to
//   about y = c:  (x, c + (y - c) cos t, (y - c) sin t)
//   about x = c:  (c + (x - c) cos t, y, (x - c) sin t)
// The solid is the region's own boundary, a closed polygon sampled densely from the generator's boundary functions
// (cosine spacing on each piece, every breakpoint a sample), turned through a full revolution: its surface is the
// surface of revolution of that boundary, smooth around the axis. This is the solid itself, the same whichever method
// (disks, washers or shells) computes its volume. A hole appears exactly where the region stays away from the axis,
// and radii are measured from the actual axis, wherever it is.
// The representative disk, washer or shell is the explanation's own slice (the same position and end points as the 2D
// picture), given a small thickness as a visual aid and turned about the same axis.
// Around the axis the surface is a polygon of 128 segments with its vertices exactly on the circles, so its volume is
// the exact volume of the revolved boundary polygon times angularFactor() = 128 sin(2 pi / 128) / (2 pi) = 0.999598.
import {sampleXs,evalAt} from './solid-geometry.mjs';

export const ANGLES=128;
const EPS=1e-9,CORNER=Math.cos(35*Math.PI/180);
export const angularFactor=(M=ANGLES)=>M*Math.sin(2*Math.PI/M)/(2*Math.PI);
const axial=(axis,[x,y])=>axis.type==='y'?x:y;
export const rhoOf=(axis,[x,y])=>axis.type==='y'?y-axis.c:x-axis.c;
const fromAR=(axis,a,r)=>axis.type==='y'?[a,axis.c+r]:[axis.c+r,a];
// a point of the plane turned by t about the axis, and a direction (a normal) turned with it
export function turn(axis,[x,y],t){const c=Math.cos(t),s=Math.sin(t);return axis.type==='y'?[x,axis.c+(y-axis.c)*c,(y-axis.c)*s]:[axis.c+(x-axis.c)*c,y,(x-axis.c)*s];}
const turnN=(axis,[nx,ny],t)=>{const c=Math.cos(t),s=Math.sin(t);return axis.type==='y'?[nx,ny*c,ny*s]:[nx*c,ny,nx*s];};

// the region's boundary, counterclockwise, from its slices perpendicular to the x-axis (xs) or, if it has none, to the
// y-axis (ys)
export function boundary(desc,n=72){
 const useX=!!desc.xs,ps=useX?desc.xs:desc.ys,ts=sampleXs(ps,n),q=ts.map(t=>evalAt({pieces:ps},t));
 // xs: along the lower boundary left to right, back along the upper one; ys: up the right boundary, down the left one
 const P=useX?[...q.map(e=>[e.t,e.lo]),...q.map(e=>[e.t,e.hi]).reverse()]:[...q.map(e=>[e.hi,e.t]),...q.map(e=>[e.lo,e.t]).reverse()];
 let scale=1;for(const p of P)scale=Math.max(scale,Math.abs(p[0]),Math.abs(p[1]));
 const out=[];for(const p of P){const l=out[out.length-1];if(!l||Math.hypot(p[0]-l[0],p[1]-l[1])>1e-12*scale)out.push(p);}
 while(out.length>2&&Math.hypot(out[0][0]-out[out.length-1][0],out[0][1]-out[out.length-1][1])<=1e-12*scale)out.pop();
 if(polyArea(out)<0)out.reverse();
 return out;
}
export function polyArea(P){let a=0;for(let i=0;i<P.length;i++){const [x0,y0]=P[i],[x1,y1]=P[(i+1)%P.length];a+=x0*y1-x1*y0;}return a/2;}
// the exact volume of the polygon turned about the axis (Pappus): 2 pi |integral of rho dA|
export function polygonVolume(P,axis){
 let m=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],cr=p[0]*q[1]-q[0]*p[1];
  m+=axis.type==='y'?cr*(p[1]+q[1])/6:cr*(p[0]+q[0])/6;}
 return 2*Math.PI*Math.abs(m-axis.c*polyArea(P));
}
// vertices where the boundary turns by more than 35 degrees (the solid's edges: its normals are not shared there)
export function corners(P){
 const out=[];for(let i=0;i<P.length;i++){const a=P[(i+P.length-1)%P.length],b=P[i],c=P[(i+1)%P.length];
  const u=[b[0]-a[0],b[1]-a[1]],w=[c[0]-b[0],c[1]-b[1]],d=(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)||1);if(d<CORNER)out.push(i);}
 return out;
}

// can this rotation be drawn safely? {ok} or {ok:false, reason}
export function validate(desc,rot,{n=72}={}){
 if(!desc||!rot)return{ok:false,reason:'the problem has no region data'};
 const ps=desc.xs||desc.ys;if(!Array.isArray(ps)||!ps.length)return{ok:false,reason:'no region'};
 const v=desc.xs?'x':'y';
 for(let i=0;i<ps.length;i++){const p=ps[i];
  if(!(Number.isFinite(p.a)&&Number.isFinite(p.b)&&p.b-p.a>EPS)||typeof p.top!=='function'||typeof p.bot!=='function')return{ok:false,reason:`piece ${i+1} is not an interval with two boundaries`};
  if(i&&Math.abs(ps[i-1].b-p.a)>1e-9*Math.max(1,Math.abs(p.a)))return{ok:false,reason:'the pieces do not join'};
  if(i){const q=ps[i-1],t=p.a,tol=1e-7*Math.max(1,Math.abs(q.top(t)),Math.abs(q.bot(t)));if(Math.abs(q.top(t)-p.top(t))>tol||Math.abs(q.bot(t)-p.bot(t))>tol)return{ok:false,reason:`the boundaries jump at ${v} = ${t}`};}}
 for(const t of sampleXs(ps,n)){const e=evalAt({pieces:ps},t);if(![e.lo,e.hi].every(Number.isFinite))return{ok:false,reason:`a boundary is undefined at ${v} = ${t}`};
  if(e.hi-e.lo<-1e-9*Math.max(1,Math.abs(e.hi),Math.abs(e.lo)))return{ok:false,reason:`the boundaries are out of order at ${v} = ${t}`};}
 const ax=rot.axis;if(!ax||!['x','y'].includes(ax.type)||!Number.isFinite(ax.c))return{ok:false,reason:'unknown axis of rotation'};
 if(!['washer','shell'].includes(rot.method)||!['disk','washer','shell'].includes(rot.kind))return{ok:false,reason:`unknown method ${rot.method}/${rot.kind}`};
 const P=boundary(desc,n);if(!(polyArea(P)>EPS))return{ok:false,reason:'the region has no area'};
 let lo=Infinity,hi=-Infinity,big=0;for(const p of P){const r=rhoOf(ax,p);lo=Math.min(lo,r);hi=Math.max(hi,r);big=Math.max(big,Math.abs(p[0]),Math.abs(p[1]),Math.abs(r));}
 const tol=1e-9*Math.max(1,big);if(lo<-tol&&hi>tol)return{ok:false,reason:`the axis ${ax.type} = ${ax.c} cuts the region`};
 if(big>1e3)return{ok:false,reason:'the region is too large to draw'};
 if(!(Array.isArray(rot.seg)&&rot.seg.length===4&&rot.seg.every(Number.isFinite)))return{ok:false,reason:'no representative slice'};
 const r1=rhoOf(ax,[rot.seg[0],rot.seg[1]]),r2=rhoOf(ax,[rot.seg[2],rot.seg[3]]);
 if(Math.min(r1,r2)<-tol&&Math.max(r1,r2)>tol)return{ok:false,reason:'the representative slice crosses the axis'};
 if(rot.kind==='shell'&&!(Math.abs(r1)>tol))return{ok:false,reason:'the representative shell has no radius'};
 return{ok:true};
}

// a polygon turned about the axis: a smooth surface around the axis (normals turned with the points), split along the
// polygon's corners. Indexed triangles, oriented outward.
export function lathe(P,axis,{M=ANGLES,closed=true}={}){
 const N=P.length,cs=corners(P),edgeN=[];
 for(let i=0;i<N;i++){const a=P[i],b=P[(i+1)%N],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;edgeN.push([dy/l,-dx/l]);} // outward for a counterclockwise polygon
 const starts=cs.length?cs:[0],chains=[];
 for(let k=0;k<starts.length;k++){const s=starts[k],e=cs.length?starts[(k+1)%starts.length]:s,ch=[];let i=s;do{ch.push(i);i=(i+1)%N;}while(i!==e);ch.push(e);chains.push(ch);}
 const pos=[],nrm=[],idx=[],rings=M+1;let base=0;
 for(const ch of chains){
  ch.forEach((i,j)=>{const prev=edgeN[(i+N-1)%N],next=edgeN[i];let n=j===0?next:j===ch.length-1?prev:[prev[0]+next[0],prev[1]+next[1]];const l=Math.hypot(...n)||1;n=[n[0]/l,n[1]/l];
   for(let k=0;k<rings;k++){const t=2*Math.PI*(k%M)/M;pos.push(...turn(axis,P[i],t));nrm.push(...turnN(axis,n,t));}});
  for(let j=0;j+1<ch.length;j++)for(let k=0;k<M;k++){const a=base+j*rings+k,b=a+rings,c=b+1,d=a+1;idx.push(a,b,c,a,c,d);}
  base+=ch.length*rings;}
 const out={positions:new Float32Array(pos),normals:new Float32Array(nrm),index:new Uint32Array(idx)};
 if(indexedVolume(out.positions,out.index)<0)for(let i=0;i<out.index.length;i+=3){const t=out.index[i+1];out.index[i+1]=out.index[i+2];out.index[i+2]=t;}
 return out;
}
export function indexedVolume(pos,idx){
 let v=0;for(let i=0;i<idx.length;i+=3){const a=3*idx[i],b=3*idx[i+1],c=3*idx[i+2];
  v+=pos[a]*(pos[b+1]*pos[c+2]-pos[b+2]*pos[c+1])-pos[a+1]*(pos[b]*pos[c+2]-pos[b+2]*pos[c])+pos[a+2]*(pos[b]*pos[c+1]-pos[b+1]*pos[c]);}
 return v/6;
}
const circle=(axis,p,M=ANGLES)=>Array.from({length:M+1},(_,k)=>turn(axis,p,2*Math.PI*k/M));

// the whole model of one rotation
export function buildRevolution(desc,rot,{n=72,M=ANGLES}={}){
 const check=validate(desc,rot,{n});if(!check.ok)throw Error(`3D model: ${check.reason}`);
 const ax=rot.axis,P=boundary(desc,n),solid=lathe(P,ax,{M});
 let side=0;for(const p of P){const r=rhoOf(ax,p);if(Math.abs(r)>Math.abs(side))side=r;}side=Math.sign(side)||1;
 // the base region (z = 0) from the slices, as in the 2D picture
 const ps=desc.xs||desc.ys,useX=!!desc.xs,ts=sampleXs(ps,n),base=[];
 const pt=(t,w)=>useX?[t,w,0]:[w,t,0];
 for(let i=0;i+1<ts.length;i++){const a=evalAt({pieces:ps},ts[i]),b=evalAt({pieces:ps},ts[i+1]);base.push(...pt(a.t,a.lo),...pt(b.t,b.lo),...pt(b.t,b.hi),...pt(a.t,a.lo),...pt(b.t,b.hi),...pt(a.t,a.hi));}
 let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity,zmin=Infinity,zmax=-Infinity;
 for(let i=0;i<solid.positions.length;i+=3){const x=solid.positions[i],y=solid.positions[i+1],z=solid.positions[i+2];xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);zmin=Math.min(zmin,z);zmax=Math.max(zmax,z);}
 const bounds={xmin,xmax,ymin,ymax,zmin,zmax},span=Math.max(xmax-xmin,ymax-ymin,zmax-zmin,1),U=span/10;
 let a0=Infinity,a1=-Infinity,rmax=0;for(const p of P){const a=axial(ax,p);a0=Math.min(a0,a);a1=Math.max(a1,a);rmax=Math.max(rmax,Math.abs(rhoOf(ax,p)));}
 // the representative slice, from the explanation's own end points
 const [x1,y1,x2,y2]=rot.seg,e1=[x1,y1],e2=[x2,y2],r1=rhoOf(ax,e1),r2=rhoOf(ax,e2),z3=([x,y])=>[x,y,0];
 let thick=Math.min(0.35*U,0.06*Math.max(a1-a0,rmax)),rect,H;
 if(rot.kind==='shell'){ // a slice parallel to the axis at distance rho; its length along the axis is the height h
  const rho=Math.abs(r1),b0=Math.min(axial(ax,e1),axial(ax,e2)),b1=Math.max(axial(ax,e1),axial(ax,e2));thick=Math.min(thick,rho);
  const ri=Math.max(0,rho-thick/2),ro=rho+thick/2,m=(b0+b1)/2;
  rect=[fromAR(ax,b0,side*ri),fromAR(ax,b1,side*ri),fromAR(ax,b1,side*ro),fromAR(ax,b0,side*ro)];
  const rFrom=z3(fromAR(ax,m,0)),rTo=z3(fromAR(ax,m,side*rho)),out=[...turn(ax,fromAR(ax,m,side*(rho+U*0.9)),0)];
  H={kind:'shell',radius:rho,height:b1-b0,axial:[b0,b1],thickness:ro-ri,inner:ri,outer:ro,
   lines:[{name:'r',from:rFrom,to:rTo},{name:'h',from:z3(fromAR(ax,b0,side*rho)),to:z3(fromAR(ax,b1,side*rho))}],
   labels:[{text:'r',at:z3(fromAR(ax,m+0.7*U,side*rho/2))},{text:'h',at:out}]};
 }else{ // a slice perpendicular to the axis: a disk (radius R) or a washer (radii R and r), measured from the axis
  const at=axial(ax,e1),R=Math.max(Math.abs(r1),Math.abs(r2)),r=rot.kind==='disk'?0:Math.min(Math.abs(r1),Math.abs(r2));
  rect=[fromAR(ax,at-thick/2,side*r),fromAR(ax,at+thick/2,side*r),fromAR(ax,at+thick/2,side*R),fromAR(ax,at-thick/2,side*R)];
  // R toward the region (as in the 2D picture), r to the inner circle on the other side of the axis, both in the
  // region's plane; each label beside its radius
  const c0=z3(fromAR(ax,at,0)),far=z3(fromAR(ax,at,side*R)),lines=[{name:'R',from:c0,to:far}],labels=[{text:'R',at:z3(fromAR(ax,at+0.7*U,side*R/2))}];
  if(r>0){lines.push({name:'r',from:c0,to:z3(fromAR(ax,at,-side*r))});labels.push({text:'r',at:z3(fromAR(ax,at+0.7*U,-side*r/2))});}
  H={kind:rot.kind,at,R,r,thickness:thick,lines,labels};
 }
 // rect is counterclockwise in the plane when side and the axis's orientation agree; make sure of it
 if(polyArea(rect)<0)rect.reverse();
 H.mesh=lathe(rect,ax,{M});H.rings=rect.map(p=>circle(ax,p,M));H.slice=[z3(e1),z3(e2)];
 // the axis of rotation, beyond the solid at both ends, and its label
 const ext=[a0-2*U,a1+2*U],axisLine=[z3(fromAR(ax,ext[0],0)),z3(fromAR(ax,ext[1],0))];
 const axisLabel={text:`${ax.type} = ${String(ax.c).replace('-','\u2212')}`,at:z3(fromAR(ax,ext[0]-1.5*U,0))}; // (at its low end: the coordinate axes are labelled at their high ends)
 // edges: the circles traced by the boundary's corners; light outlines: the boundary turned to eight angles
 const cs=corners(P),edges=cs.filter(i=>Math.abs(rhoOf(ax,P[i]))>1e-9*Math.max(1,rmax)).map(i=>circle(ax,P[i],M));
 const meridians=[1,2,3,4,5,6,7].map(k=>P.map(p=>turn(ax,p,k*Math.PI/4)));
 return{axis:ax,kind:rot.kind,boundary:P,corners:cs,solid,base:new Float32Array(base),outline:P.map(z3),edges,meridians,highlight:H,axisLine,axisLabel,
  bounds,unit:U,axialRange:[a0,a1],rmax,exactVolume:polygonVolume(P,ax),angular:angularFactor(M)};
}
