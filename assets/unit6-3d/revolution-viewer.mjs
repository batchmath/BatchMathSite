// BatchMath v13.0.C (experimental): the interactive 3D model of a solid of revolution (every family of the Solids of
// Revolution engine: disks, washers, shells, two axes, the trigonometric solid and the calculator solids). Loaded only
// when a student opens the model. Same stage, colours and controls as the cross-section models (scene-kit.mjs).
//
// Drawn, at one scale on every axis: the region (gold, in the xy-plane, with its white outline), the axis of rotation
// (a distinct pink line along y = c or x = c, labelled with its equation), the solid it sweeps out in a full turn
// (translucent blue, smooth around the axis, with a hole wherever the region stays away from the axis), the circles
// traced by the region's corners, light outlines of the region turned to eight positions, and the representative disk,
// washer or shell (yellow) at the explanation's own slice, with R and r (disks and washers, measured from the axis) or
// r and h (shells). No volume or integral is shown.
import {THREE,COLORS,label,pts3,line,loop,mesh,createStage} from './scene-kit.mjs';
import {buildRevolution,rhoOf} from './revolution-geometry.mjs';

const KIND_WORDS={disk:'disk',washer:'washer',shell:'cylindrical shell'};
// host: the element the canvas goes in. desc: problem.u6Revolution; i: which rotation. Returns {dispose, resetView, info, canvas}.
export function createRevolutionViewer(host,desc,i,{problemId=''}={}){
 const rot=desc.rotations[i],G=buildRevolution(desc,rot),B=G.bounds,u=G.unit,ax=rot.axis;
 const S=createStage(host,{bounds:B,unit:u,ariaLabel:`Interactive 3D model: the region${desc.eqs.length?` ${desc.eqs.join(', ')}`:''} revolved about the line ${rot.axisTex.replace('=',' = ')}; one ${KIND_WORDS[rot.kind]} is highlighted. Drag to rotate; scroll or pinch to zoom.`});
 const scene=S.scene;
 // the region (gold, a little above the grid) and its outline
 scene.add(mesh(G.base,new THREE.MeshBasicMaterial({color:COLORS.base,transparent:true,opacity:0.32,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1})));
 scene.add(loop(G.outline,COLORS.baseEdge,0.9));
 // the solid: one smooth translucent surface, with its normals turned with it
 const solidMat=new THREE.MeshPhongMaterial({color:COLORS.solid,transparent:true,opacity:0.3,side:THREE.DoubleSide,depthWrite:false,shininess:60,specular:0x557799});
 const solid=mesh(G.solid.positions,solidMat,G.solid.normals,G.solid.index);solid.renderOrder=2;scene.add(solid);
 for(const e of G.edges)scene.add(line(e,COLORS.solidEdge,0.85));
 for(const m of G.meridians)scene.add(loop(m,COLORS.section,0.3));
 // the axis of rotation: a thin pink rod along the whole solid, and its equation
 const [p0,p1]=G.axisLine,len=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),rod=new THREE.Mesh(new THREE.CylinderGeometry(u*0.07,u*0.07,len,12,1),new THREE.MeshBasicMaterial({color:COLORS.rotation}));
 rod.position.set((p0[0]+p1[0])/2,(p0[1]+p1[1])/2,0);if(ax.type==='y')rod.rotation.z=-Math.PI/2;rod.renderOrder=6;rod.userData.kind='axis';scene.add(rod);
 const al=label(G.axisLabel.text,{size:u*1.3,color:'#ff7cc0'});al.position.set(...G.axisLabel.at);scene.add(al);
 // the representative disk, washer or shell: yellow, with the circles of its edges, the slice itself (white), its radii
 // (and height) and their labels
 const H=G.highlight,hm=mesh(H.mesh.positions,new THREE.MeshBasicMaterial({color:COLORS.slice,transparent:true,opacity:0.55,side:THREE.DoubleSide,depthWrite:false}),H.mesh.normals,H.mesh.index);hm.renderOrder=3;scene.add(hm);
 for(const r of H.rings){const l=line(r,COLORS.slice,0.95);l.renderOrder=4;scene.add(l);}
 const seg=line(H.slice,0xffffff);seg.renderOrder=5;scene.add(seg);
 for(const L of H.lines){const l=line([L.from,L.to],COLORS.mark,0.95);l.renderOrder=5;scene.add(l);}
 for(const l of H.labels){const sp=label(l.text,{size:u*1.6,color:'#ffd400'});sp.position.set(...l.at);scene.add(sp);}
 // the camera: as in the 2D graph (x to the right, y up the screen) seen a little from the right and from above, so the
 // region keeps its familiar orientation and the solid comes out of the page around the axis; the solid, the axis and
 // every label in view
 const keyPts=[],every=(a,k)=>a.filter((p,j)=>j%k===0||j===a.length-1);
 keyPts.push(...pts3(every(G.outline,4)),...pts3(G.axisLine));
 for(const e of [...G.edges,...G.meridians,...H.rings])keyPts.push(...pts3(every(e,8)));
 const V=S.finish(keyPts,{dir:[0.42,0.3,0.86],up:[0,1,0],centerZ:(B.zmin+B.zmax)/2});
 const axisPts=()=>{rod.updateMatrixWorld();const a=rod.geometry.getAttribute('position'),v=new THREE.Vector3(),out=[];for(let j=0;j<a.count;j++){v.fromBufferAttribute(a,j).applyMatrix4(rod.matrixWorld);out.push([v.x,v.y,v.z]);}return out;};
 const info={problemId,rotation:i,axis:{...ax},method:rot.method,kind:rot.kind,highlight:{kind:H.kind,R:H.R,r:H.r,radius:H.radius,height:H.height,thickness:H.thickness,at:H.at,axial:H.axial},bounds:{...B},disposed:false,released:null,
  get frames(){return V.frames;},get resizes(){return V.resizes;},get distance(){return V.distance;},get azimuth(){return V.azimuth;},get polar(){return V.polar;},
  get memory(){return V.memory;},
  // what is actually drawn, read back from the GPU-bound buffers (for the review lab's browser tests): every vertex of
  // the solid and of the highlighted slice as (distance along the axis, distance from the axis), and the drawn rod
  drawn(){const meas=a=>{let a0=Infinity,a1=-Infinity,r0=Infinity,r1=-Infinity;for(let j=0;j<a.length;j+=3){const p=[a[j],a[j+1],a[j+2]],al=ax.type==='y'?p[0]:p[1],rr=Math.hypot(ax.type==='y'?p[1]-ax.c:p[0]-ax.c,p[2]);a0=Math.min(a0,al);a1=Math.max(a1,al);r0=Math.min(r0,rr);r1=Math.max(r1,rr);}return{axial:[a0,a1],radius:[r0,r1],vertices:a.length/3};};
   const sp=solid.geometry.getAttribute('position').array,hp=hm.geometry.getAttribute('position').array,rp=axisPts();
   const mid=k=>(Math.min(...rp.map(p=>p[k]))+Math.max(...rp.map(p=>p[k])))/2;
   return{solid:{...meas(sp),triangles:solid.geometry.getIndex().count/3,smooth:!solidMat.flatShading&&!!solid.geometry.getAttribute('normal')},highlight:meas(hp),
    rod:{center:[mid(0),mid(1),mid(2)],along:ax.type==='y'?[Math.min(...rp.map(p=>p[0])),Math.max(...rp.map(p=>p[0]))]:[Math.min(...rp.map(p=>p[1])),Math.max(...rp.map(p=>p[1]))]},
    labels:(()=>{const l=[];scene.traverse(o=>{if(o.isSprite)l.push(o.userData.label);});return l;})()};}};
 S.canvas.__bm3d=info;
 return{info,canvas:S.canvas,resetView:()=>V.resetView(),dispose:()=>V.dispose(info)};
}
export {rhoOf};
