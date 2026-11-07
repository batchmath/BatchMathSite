// BatchMath v13.0.B (experimental): the interactive 3D model of a solid with known cross sections (every shape of the
// Volume by Cross Sections engine, slices perpendicular to the x-axis or to the y-axis). Loaded only when a student opens
// the model (three.js is about 0.7 MB).
//
// The scene uses the math coordinates directly (x, y, z), at ONE scale on every axis so every shape keeps its true
// proportions: the base region lies in the xy-plane, z points up. Drawn: the base region (gold, as the shaded region of
// the 2D graph), the solid (translucent blue; faces swept by arcs are smooth-shaded and a lighter blue, faces swept by
// straight sides are flat-shaded), its edges, light cross-section outlines along it showing how the sections stack, the
// highlighted cross section (yellow, at the slice the 2D picture highlights, with the labels of the 2D cross-section
// picture), and the x, y and z axes with a light grid on the base plane. Mouse: drag to rotate, wheel to zoom; touch:
// one finger rotates, two fingers pinch to zoom. The scene is drawn only when something changes (no animation loop) and
// everything is released when the model is hidden or the question changes. No volume, integral or area formula is shown.
import * as THREE from './vendor/three/three.module.min.mjs';
import {OrbitControls} from './vendor/three/OrbitControls.mjs';
import {buildSolid,SHAPE_WORDS} from './solid-geometry.mjs';

const COLORS={solid:0x4aa3ff,curved:0x7cc4ff,solidEdge:0x9fd0ff,section:0x9fc9f2,base:0xffd400,baseEdge:0xf4f4f4,slice:0xffd400,mark:0xffffff,axis:0xd8d8d8,grid:0x2a2a2a};

// a text sprite (canvas texture) whose height is size; wide texts get a wider canvas
function label(text,{size=0.5,color='#f4f4f4'}={}){
 const k=128,font=`italic 700 ${Math.round(k*0.62)}px "Times New Roman",Times,serif`,c=document.createElement('canvas');
 let g=c.getContext('2d');g.font=font;const w=Math.max(k,Math.ceil(g.measureText(text).width+k*0.34));
 c.width=w;c.height=k;g=c.getContext('2d');g.font=font;g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';
 g.lineWidth=k*0.06;g.strokeStyle='rgba(0,0,0,.85)';g.strokeText(text,w/2,k/2);g.fillText(text,w/2,k/2);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,depthWrite:false,transparent:true}));s.scale.set(size*w/k,size,1);s.renderOrder=10;s.userData.label=text;return s;
}
const pts3=pts=>pts.map(p=>new THREE.Vector3(p[0],p[1],p[2]));
const line=(pts,color,opacity=1)=>new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3(pts)),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));
const loop=(pts,color,opacity=1)=>new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts3(pts)),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));
function mesh(positions,material,normals=null){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));
 if(normals)g.setAttribute('normal',new THREE.BufferAttribute(normals,3));else g.computeVertexNormals();
 return new THREE.Mesh(g,material);
}
// the WebGL2 context three.js needs, or a clear error (no console error from three.js when WebGL is off)
function context(canvas){
 let gl=null;try{gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'default'});}catch(_){gl=null;}
 if(!gl)throw Object.assign(Error('WebGL is not available'),{webgl:false});
 return gl;
}

// host: the element the canvas goes in. desc: problem.u6Solid. Returns {dispose, resetView, info, canvas}.
export function createViewer(host,desc,{problemId=''}={}){
 const G=buildSolid(desc),B=G.bounds,key=G.key,words=SHAPE_WORDS[key];
 const canvas=document.createElement('canvas');canvas.className='u6-3d-canvas';canvas.setAttribute('role','img');
 canvas.setAttribute('aria-label',`Interactive 3D model: the base region ${desc.eqs.join(', ')} with ${words.solid} perpendicular to the ${desc.dir}-axis; one cross section is ${words.one}. Drag to rotate; scroll or pinch to zoom.`);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,context:context(canvas),antialias:true,alpha:true});}catch(e){throw Object.assign(Error('WebGL is not available'),{webgl:false,cause:e});}
 renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.setClearColor(0x050505,1);
 host.appendChild(canvas);
 const scene=new THREE.Scene(),span=Math.max(B.xmax-B.xmin,B.ymax-B.ymin,B.zmax,1),u=G.unit; // u = span/10: labels and arrow heads
 scene.add(new THREE.AmbientLight(0xffffff,1.6));const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(B.xmin-span,B.ymin-2*span,3*span);scene.add(sun);
 // the base plane: a light grid and the axes (x, y along the base; z up), each labelled at its positive end
 const lo=[Math.min(0,B.xmin)-u*2,Math.min(0,B.ymin)-u*2],hi=[Math.max(0,B.xmax)+u*3,Math.max(0,B.ymax)+u*3],zTop=B.zmax+u*3;
 const step=[0.5,1,2,5,10,20].find(t=>span/t<=14)||50,grid=new THREE.Group();
 for(let x=Math.ceil(lo[0]/step)*step;x<=hi[0];x+=step)grid.add(line([[x,lo[1],0],[x,hi[1],0]],COLORS.grid));
 for(let y=Math.ceil(lo[1]/step)*step;y<=hi[1];y+=step)grid.add(line([[lo[0],y,0],[hi[0],y,0]],COLORS.grid));
 scene.add(grid);
 const axes=new THREE.Group(),head=u*0.55;
 const axis=(from,to,dir,name)=>{axes.add(line([from,to],COLORS.axis));const cone=new THREE.Mesh(new THREE.ConeGeometry(head*0.32,head,16),new THREE.MeshBasicMaterial({color:COLORS.axis}));
  cone.position.set(...to);cone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...dir));axes.add(cone);
  const l=label(name,{size:u*1.5});l.position.set(to[0]+dir[0]*u*1.1,to[1]+dir[1]*u*1.1,to[2]+dir[2]*u*1.1);axes.add(l);};
 axis([lo[0],0,0],[hi[0],0,0],[1,0,0],'x');axis([0,lo[1],0],[0,hi[1],0],[0,1,0],'y');axis([0,0,0],[0,0,zTop],[0,0,1],'z');
 scene.add(axes);
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
 const camera=new THREE.PerspectiveCamera(36,1,span/200,span*80);camera.up.set(0,0,1);
 const box=new THREE.Box3().setFromObject(axes).expandByPoint(new THREE.Vector3(B.xmin,B.ymin,0)).expandByPoint(new THREE.Vector3(B.xmax,B.ymax,B.zmax));
 const center=new THREE.Vector3((B.xmin+B.xmax)/2,(B.ymin+B.ymax)/2,B.zmax*0.45),radius=box.getBoundingSphere(new THREE.Sphere()).radius;
 const dir=(desc.dir==='y'?new THREE.Vector3(0.74,-0.62,0.5):new THREE.Vector3(0.62,-0.74,0.5)).normalize(),keyPts=[];
 const every=(a,k)=>a.filter((p,i)=>i%k===0||i===a.length-1);
 for(const a of [G.outline.lo,G.outline.hi,...G.edges,...(G.crest?[G.crest]:[])])keyPts.push(...pts3(every(a,6)));
 for(const a of [...G.ends,...G.sections.map(q=>q.pts),H.pts])keyPts.push(...pts3(every(a,4)));
 scene.traverse(o=>{if(o.isSprite||(o.isMesh&&o.parent===axes))keyPts.push(o.getWorldPosition(new THREE.Vector3()));});
 keyPts.push(new THREE.Vector3(lo[0],0,0),new THREE.Vector3(0,lo[1],0));
 const place=d=>{camera.position.copy(center).addScaledVector(dir,d);camera.lookAt(center);camera.updateMatrixWorld();};
 // the nearest distance at which every one of those points projects inside the canvas, with a margin
 const fits=d=>{place(d);return keyPts.every(c=>{const q=c.clone().project(camera);return q.z<1&&Math.abs(q.x)<=0.88&&Math.abs(q.y)<=0.86;});};
 const home=()=>{let a=radius*0.3,b=radius*12;for(let i=0;i<40;i++){const m=(a+b)/2;if(fits(m))b=m;else a=m;}place(b);};
 let touched=false;
 const controls=new OrbitControls(camera,canvas);controls.target.copy(center);controls.enableDamping=false;controls.enablePan=false;
 controls.minDistance=radius*0.5;controls.maxDistance=radius*8;controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
 controls.addEventListener('start',()=>{touched=true;});
 let frames=0;const render=()=>{frames++;renderer.render(scene,camera);};
 controls.addEventListener('change',render);
 let sized=0;
 const size=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,Math.round(Math.min(460,Math.max(280,w*0.72))));sized++;renderer.setSize(w,h,true);camera.aspect=w/h;camera.updateProjectionMatrix();
  if(!touched){home();controls.target.copy(center);controls.update();}render();};
 const ro=new ResizeObserver(size);ro.observe(host);size();
 const info={problemId,key,dir:desc.dir,highlight:{t:H.t,lo:H.lo,hi:H.hi,s:H.s,area:H.area},bounds:{...B},sections:G.sections.length,samples:G.samples.length,disposed:false,released:null,
  get frames(){return frames;},get resizes(){return sized;},get distance(){return camera.position.distanceTo(controls.target);},get azimuth(){return controls.getAzimuthalAngle();},get polar(){return controls.getPolarAngle();},
  get memory(){return{...renderer.info.memory};},
  // what is actually drawn, read back from the GPU-bound buffers (for the review lab's browser tests)
  drawn(){const h=hl.geometry.getAttribute('position').array,outline=[];for(let i=0;i<h.length;i+=3)outline.push([h[i],h[i+1],h[i+2]]);
   let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity,z0=Infinity,z1=-Infinity,n=0,curvedN=0;
   for(const m of parts){const a=m.geometry.getAttribute('position').array;n+=a.length/3;if(m.userData.kind==='curved')curvedN+=a.length/3;for(let i=0;i<a.length;i+=3){x0=Math.min(x0,a[i]);x1=Math.max(x1,a[i]);y0=Math.min(y0,a[i+1]);y1=Math.max(y1,a[i+1]);z0=Math.min(z0,a[i+2]);z1=Math.max(z1,a[i+2]);}}
   const fill=hq.getAttribute('position').array;let area=0;for(let i=0;i<fill.length;i+=9){const ax=fill[i+3]-fill[i],ay=fill[i+4]-fill[i+1],az=fill[i+5]-fill[i+2],bx=fill[i+6]-fill[i],by=fill[i+7]-fill[i+1],bz=fill[i+8]-fill[i+2];area+=Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)/2;}
   return{highlight:outline,highlightArea:area,solid:{xmin:x0,xmax:x1,ymin:y0,ymax:y1,zmin:z0,zmax:z1,vertices:n,curvedVertices:curvedN},
    shading:{flat:flatMat.flatShading===true,curvedSmooth:curvedMat.flatShading!==true&&parts.some(m=>m.userData.kind==='curved'&&!!m.geometry.getAttribute('normal'))},
    labels:(()=>{const l=[];scene.traverse(o=>{if(o.isSprite)l.push(o.userData.label);});return l;})(),marks:H.marks.length,aux:H.aux.length};}};
 canvas.__bm3d=info;
 return{info,canvas,
  resetView(){touched=false;home();controls.target.copy(center);controls.update();render();},
  dispose(){ro.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose?.();const m=o.material;if(m){m.map?.dispose?.();m.dispose?.();}});
   info.released={...renderer.info.memory};info.disposed=true;renderer.dispose();renderer.forceContextLoss?.();canvas.remove();}};
}
