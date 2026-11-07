// BatchMath v13.0.B (experimental): the interactive 3D model of a solid with known cross sections (every shape of the
// Volume by Cross Sections engine, slices perpendicular to the x-axis or to the y-axis). Loaded only when a student opens
// the model (three.js is about 0.7 MB). v13.0.C: the stage (renderer, grid, axes, camera, controls, release) is shared
// with the Solids of Revolution model through scene-kit.mjs; what is drawn and how is unchanged.
//
// The scene uses the math coordinates directly (x, y, z), at ONE scale on every axis so every shape keeps its true
// proportions: the base region lies in the xy-plane, z points up. Drawn: the base region (gold, as the shaded region of
// the 2D graph), the solid (translucent blue; faces swept by arcs are smooth-shaded and a lighter blue, faces swept by
// straight sides are flat-shaded), its edges, light cross-section outlines along it showing how the sections stack, the
// highlighted cross section (yellow, at the slice the 2D picture highlights, with the labels of the 2D cross-section
// picture), and the x, y and z axes with a light grid on the base plane. Mouse: drag to rotate, wheel to zoom; touch:
// one finger rotates, two fingers pinch to zoom. The scene is drawn only when something changes (no animation loop) and
// everything is released when the model is hidden or the question changes. No volume, integral or area formula is shown.
import {THREE,COLORS,label,pts3,line,loop,mesh,createStage} from './scene-kit.mjs';
import {buildSolid,SHAPE_WORDS} from './solid-geometry.mjs';

// host: the element the canvas goes in. desc: problem.u6Solid. Returns {dispose, resetView, info, canvas}.
export function createViewer(host,desc,{problemId=''}={}){
 const G=buildSolid(desc),B=G.bounds,key=G.key,words=SHAPE_WORDS[key],u=G.unit; // u = span/10: labels and arrow heads
 const S=createStage(host,{bounds:B,unit:u,ariaLabel:`Interactive 3D model: the base region ${desc.eqs.join(', ')} with ${words.solid} perpendicular to the ${desc.dir}-axis; one cross section is ${words.one}. Drag to rotate; scroll or pinch to zoom.`});
 const scene=S.scene;
 // the base region (gold, a little above the grid), and its boundary
 scene.add(mesh(G.base,new THREE.MeshBasicMaterial({color:COLORS.base,transparent:true,opacity:0.32,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1})));
 scene.add(line(G.outline.lo,COLORS.baseEdge,0.9),line(G.outline.hi,COLORS.baseEdge,0.9));for(const e of G.outline.ends)scene.add(line(e,COLORS.baseEdge,0.9));
 // the solid: flat faces (swept by straight sides, and the end sections) and curved faces (swept by arcs), translucent
 const flatMat=new THREE.MeshPhongMaterial({color:COLORS.solid,transparent:true,opacity:0.3,side:THREE.DoubleSide,depthWrite:false,shininess:40,flatShading:true});
 const curvedMat=new THREE.MeshPhongMaterial({color:COLORS.curved,transparent:true,opacity:0.34,side:THREE.DoubleSide,depthWrite:false,shininess:90,specular:0x7a9cc0});
 const parts=[];
 for(const [arr,mat,nrm] of [[G.surface.flat,flatMat,null],[G.surface.caps,flatMat,null],[G.surface.curved,curvedMat,G.surface.curvedNormals]])if(arr.length){const m=mesh(arr,mat,nrm);m.renderOrder=2;m.userData.kind=mat===curvedMat?'curved':'flat';parts.push(m);scene.add(m);}
 for(const e of G.edges)scene.add(line(e,COLORS.solidEdge,0.85));
 if(G.crest)scene.add(line(G.crest,COLORS.solidEdge,0.4));
 for(const e of G.ends)scene.add(loop(e,COLORS.solidEdge,0.85));
 for(const q of G.sections)scene.add(loop(q.pts,COLORS.section,0.3));
 // the highlighted cross section: the slice on the base and the section standing on it, labelled like the 2D picture
 const H=G.highlight,hq=new THREE.BufferGeometry();hq.setAttribute('position',new THREE.BufferAttribute(H.fill,3));
 const hm=new THREE.Mesh(hq,new THREE.MeshBasicMaterial({color:COLORS.slice,transparent:true,opacity:0.62,side:THREE.DoubleSide,depthWrite:false}));hm.renderOrder=3;scene.add(hm);
 const hl=loop(H.pts,COLORS.slice);hl.renderOrder=4;scene.add(hl);
 const seg=line(H.slice,0xffffff);seg.renderOrder=5;scene.add(seg);
 for(const a of [...H.aux,...H.marks]){const l=line(a,COLORS.mark,0.95);l.renderOrder=5;scene.add(l);}
 for(const l of H.labels){const sp=label(l.text,{size:u*(l.text.length>2?1.45:1.6),color:'#ffd400'});sp.position.set(...l.at);scene.add(sp);}
 // the camera: in front of the base, to one side and above it, so the cross sections are seen partly face on (for slices
 // perpendicular to the y-axis the sections face the y-axis, so the view turns with them); the whole scene (solid, axes
 // and labels) fits the canvas at its actual shape
 const keyPts=[],every=(a,k)=>a.filter((p,i)=>i%k===0||i===a.length-1);
 for(const a of [G.outline.lo,G.outline.hi,...G.edges,...(G.crest?[G.crest]:[])])keyPts.push(...pts3(every(a,6)));
 for(const a of [...G.ends,...G.sections.map(q=>q.pts),H.pts])keyPts.push(...pts3(every(a,4)));
 const V=S.finish(keyPts,{dir:desc.dir==='y'?[0.74,-0.62,0.5]:[0.62,-0.74,0.5]});
 const info={problemId,key,dir:desc.dir,highlight:{t:H.t,lo:H.lo,hi:H.hi,s:H.s,area:H.area},bounds:{...B},sections:G.sections.length,samples:G.samples.length,disposed:false,released:null,
  get frames(){return V.frames;},get resizes(){return V.resizes;},get distance(){return V.distance;},get azimuth(){return V.azimuth;},get polar(){return V.polar;},
  get memory(){return V.memory;},
  // what is actually drawn, read back from the GPU-bound buffers (for the review lab's browser tests)
  drawn(){const h=hl.geometry.getAttribute('position').array,outline=[];for(let i=0;i<h.length;i+=3)outline.push([h[i],h[i+1],h[i+2]]);
   let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity,z0=Infinity,z1=-Infinity,n=0,curvedN=0;
   for(const m of parts){const a=m.geometry.getAttribute('position').array;n+=a.length/3;if(m.userData.kind==='curved')curvedN+=a.length/3;for(let i=0;i<a.length;i+=3){x0=Math.min(x0,a[i]);x1=Math.max(x1,a[i]);y0=Math.min(y0,a[i+1]);y1=Math.max(y1,a[i+1]);z0=Math.min(z0,a[i+2]);z1=Math.max(z1,a[i+2]);}}
   const fill=hq.getAttribute('position').array;let area=0;for(let i=0;i<fill.length;i+=9){const ax=fill[i+3]-fill[i],ay=fill[i+4]-fill[i+1],az=fill[i+5]-fill[i+2],bx=fill[i+6]-fill[i],by=fill[i+7]-fill[i+1],bz=fill[i+8]-fill[i+2];area+=Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)/2;}
   return{highlight:outline,highlightArea:area,solid:{xmin:x0,xmax:x1,ymin:y0,ymax:y1,zmin:z0,zmax:z1,vertices:n,curvedVertices:curvedN},
    shading:{flat:flatMat.flatShading===true,curvedSmooth:curvedMat.flatShading!==true&&parts.some(m=>m.userData.kind==='curved'&&!!m.geometry.getAttribute('normal'))},
    labels:(()=>{const l=[];scene.traverse(o=>{if(o.isSprite)l.push(o.userData.label);});return l;})(),marks:H.marks.length,aux:H.aux.length};}};
 S.canvas.__bm3d=info;
 return{info,canvas:S.canvas,resetView:()=>V.resetView(),dispose:()=>V.dispose(info)};
}
