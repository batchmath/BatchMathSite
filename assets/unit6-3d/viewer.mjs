// BatchMath v13.0.A (experimental): the interactive 3D model of a solid with square cross sections perpendicular to the
// x-axis. Loaded only when a student opens the model (three.js is about 0.7 MB).
//
// The scene uses the math coordinates directly (x, y, z), at ONE scale on every axis so a square looks square: the base
// region lies in the xy-plane, z points up. Drawn: the base region (gold, as the shaded region of the 2D graph), the
// solid (translucent blue) with the edges along its top and nine square outlines showing how the squares stack, the
// highlighted cross section (yellow, at the slice the 2D picture highlights; both of its sides labelled s), and the
// x, y and z axes with a light grid on the base plane. Mouse: drag to rotate, wheel to zoom; touch: one finger rotates,
// two fingers pinch to zoom. The scene is drawn only when something changes (no animation loop) and everything is
// released when the model is hidden or the question changes. No volume or integral is shown.
import * as THREE from './vendor/three/three.module.min.mjs';
import {OrbitControls} from './vendor/three/OrbitControls.mjs';
import {buildSquareSolid} from './solid-geometry.mjs';

const COLORS={solid:0x4aa3ff,solidEdge:0x9fd0ff,section:0x7fb8f0,base:0xffd400,baseEdge:0xf4f4f4,slice:0xffd400,axis:0xd8d8d8,grid:0x2a2a2a};

function label(text,{size=0.5,color='#f4f4f4',italic=true}={}){
 const c=document.createElement('canvas'),k=128;c.width=k;c.height=k;const g=c.getContext('2d');
 g.font=`${italic?'italic ':''}700 ${Math.round(k*0.62)}px "Times New Roman",Times,serif`;g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';
 g.lineWidth=k*0.06;g.strokeStyle='rgba(0,0,0,.85)';g.strokeText(text,k/2,k/2);g.fillText(text,k/2,k/2);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,depthWrite:false,transparent:true}));s.scale.set(size,size,size);s.renderOrder=10;s.userData.label=text;return s;
}
const line=(pts,color,opacity=1)=>{const g=new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p)));return new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));};
const loop=(pts,color,opacity=1)=>{const g=new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p)));return new THREE.LineLoop(g,new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));};
function mesh(positions,material){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.computeVertexNormals();return new THREE.Mesh(g,material);}

// host: the element the canvas goes in. desc: problem.u6Solid. Returns {dispose, resetView, info}.
export function createViewer(host,desc,{problemId=''}={}){
 const G=buildSquareSolid(desc),B=G.bounds;
 const canvas=document.createElement('canvas');canvas.className='u6-3d-canvas';canvas.setAttribute('role','img');
 canvas.setAttribute('aria-label',`Interactive 3D model: the base region ${desc.eqs.join(', ')} with square cross sections perpendicular to the x-axis. Drag to rotate; scroll or pinch to zoom.`);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:false});}catch(e){throw Object.assign(Error('WebGL is not available'),{webgl:false});}
 renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.setClearColor(0x050505,1);
 host.appendChild(canvas);
 const scene=new THREE.Scene(),span=Math.max(B.xmax-B.xmin,B.ymax-B.ymin,B.zmax,1),u=span/10; // u: a size for labels and arrow heads
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
 const base=mesh(G.base,new THREE.MeshBasicMaterial({color:COLORS.base,transparent:true,opacity:0.32,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
 scene.add(base);
 scene.add(line(G.outline.bottom,COLORS.baseEdge,0.9),line(G.outline.top,COLORS.baseEdge,0.9));for(const e of G.outline.ends)scene.add(line(e,COLORS.baseEdge,0.9));
 // the solid: translucent, with its top edges, its end squares' edges and square outlines along it
 const solidMat=new THREE.MeshPhongMaterial({color:COLORS.solid,transparent:true,opacity:0.3,side:THREE.DoubleSide,depthWrite:false,shininess:40});
 const parts=['top','walls','caps'].filter(k=>G.surface[k].length).map(k=>mesh(G.surface[k],solidMat));parts.forEach(m=>{m.renderOrder=2;scene.add(m);});
 scene.add(line(G.edges.bottom,COLORS.solidEdge,0.85),line(G.edges.top,COLORS.solidEdge,0.85));
 for(const q of [G.samples[0],G.samples[G.samples.length-1]])if(q.s>1e-9)scene.add(loop([[q.x,q.bot,0],[q.x,q.top,0],[q.x,q.top,q.s],[q.x,q.bot,q.s]],COLORS.solidEdge,0.85));
 for(const sq of G.sections)scene.add(loop(sq.corners,COLORS.section,0.55));
 // the highlighted cross section: the slice on the base and the square standing on it, its two sides labelled s
 const H=G.highlight,hq=new THREE.BufferGeometry();
 hq.setAttribute('position',new THREE.BufferAttribute(new Float32Array([...H.corners[0],...H.corners[1],...H.corners[2],...H.corners[0],...H.corners[2],...H.corners[3]]),3));
 const hm=new THREE.Mesh(hq,new THREE.MeshBasicMaterial({color:COLORS.slice,transparent:true,opacity:0.62,side:THREE.DoubleSide,depthWrite:false}));hm.renderOrder=3;scene.add(hm);
 const hl=loop(H.corners,COLORS.slice);hl.renderOrder=4;scene.add(hl);
 const seg=line([H.corners[0],H.corners[1]],0xffffff);seg.renderOrder=5;scene.add(seg);
 const ls1=label('s',{size:u*1.6,color:'#ffd400'});ls1.position.set(H.x,(H.bot+H.top)/2,-u*0.7);scene.add(ls1);
 const ls2=label('s',{size:u*1.6,color:'#ffd400'});ls2.position.set(H.x,H.top+u*0.7,H.s/2);scene.add(ls2);
 // the camera: in front of the base and to its right (so the squares are seen partly face on), above it; the whole
 // scene (solid, axes and their labels) fits the canvas at its actual shape
 const camera=new THREE.PerspectiveCamera(36,1,span/200,span*80);camera.up.set(0,0,1);
 const box=new THREE.Box3().setFromObject(axes).expandByPoint(new THREE.Vector3(B.xmin,B.ymin,0)).expandByPoint(new THREE.Vector3(B.xmax,B.ymax,B.zmax));
 const center=new THREE.Vector3((B.xmin+B.xmax)/2,(B.ymin+B.ymax)/2,B.zmax*0.45),radius=box.getBoundingSphere(new THREE.Sphere()).radius;
 // the points that must be in view: the solid (base and top corners along it), the axis ends and the axis labels
 const dir=new THREE.Vector3(0.62,-0.74,0.5).normalize(),corners=[];
 G.samples.filter((q,i)=>i%6===0||i===G.samples.length-1).forEach(q=>{for(const y of [q.bot,q.top])for(const z of [0,q.s])corners.push(new THREE.Vector3(q.x,y,z));});
 axes.traverse(o=>{if(o.isSprite||o.isMesh)corners.push(o.position.clone());});
 corners.push(new THREE.Vector3(lo[0],0,0),new THREE.Vector3(0,lo[1],0));
 const place=d=>{camera.position.copy(center).addScaledVector(dir,d);camera.lookAt(center);camera.updateMatrixWorld();};
 // the nearest distance at which every one of those points projects inside the canvas, with a margin
 const fits=d=>{place(d);return corners.every(c=>{const q=c.clone().project(camera);return q.z<1&&Math.abs(q.x)<=0.88&&Math.abs(q.y)<=0.86;});};
 const home=()=>{let lo=radius*0.3,hi=radius*12;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(fits(m))hi=m;else lo=m;}place(hi);};
 let touched=false;
 const controls=new OrbitControls(camera,canvas);controls.target.copy(center);controls.enableDamping=false;controls.enablePan=false;
 controls.minDistance=radius*0.5;controls.maxDistance=radius*8;controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
 controls.addEventListener('start',()=>{touched=true;});
 let frames=0;const render=()=>{frames++;renderer.render(scene,camera);};
 controls.addEventListener('change',render);
 const size=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,Math.round(Math.min(460,Math.max(280,w*0.72))));renderer.setSize(w,h,true);camera.aspect=w/h;camera.updateProjectionMatrix();
  if(!touched){home();controls.target.copy(center);controls.update();}render();};
 const ro=new ResizeObserver(size);ro.observe(host);size();
 const info={problemId,highlight:{x:H.x,bot:H.bot,top:H.top,s:H.s},bounds:{...B},sections:G.sections.length,samples:G.samples.length,
  get frames(){return frames;},get distance(){return camera.position.distanceTo(controls.target);},get azimuth(){return controls.getAzimuthalAngle();},get polar(){return controls.getPolarAngle();},
  // what is actually drawn, read back from the GPU buffers (for the review lab's browser tests)
  drawn(){const h=hq.getAttribute('position').array,c=[0,1,2,5].map(i=>[h[3*i],h[3*i+1],h[3*i+2]]);let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity,z1=0,n=0;
   for(const m of parts){const a=m.geometry.getAttribute('position').array;n+=a.length/3;for(let i=0;i<a.length;i+=3){x0=Math.min(x0,a[i]);x1=Math.max(x1,a[i]);y0=Math.min(y0,a[i+1]);y1=Math.max(y1,a[i+1]);z1=Math.max(z1,a[i+2]);}}
   return{highlight:c,solid:{xmin:x0,xmax:x1,ymin:y0,ymax:y1,zmax:z1,vertices:n},scale:camera.scale.toArray(),labels:(()=>{const l=[];scene.traverse(o=>{if(o.isSprite)l.push(o.userData.label);});return l;})()};}};
 canvas.__bm3d=info;
 return{info,canvas,
  resetView(){touched=false;home();controls.target.copy(center);controls.update();render();},
  dispose(){ro.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose?.();const m=o.material;if(m){m.map?.dispose?.();m.dispose?.();}});renderer.dispose();renderer.forceContextLoss?.();canvas.remove();}};
}
