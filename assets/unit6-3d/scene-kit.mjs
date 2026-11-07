// BatchMath v13.0.C (experimental): the parts every Unit 6 3D model shares, taken unchanged from the v13.0.A/B
// cross-section viewer: the WebGL renderer (with a clear error when WebGL is off), the dark stage, the light grid on the
// base plane, the x, y and z axes with their labels, text sprites, lines, meshes, the camera fitted to the canvas,
// mouse and touch controls (no panning), drawing only when the view changes, resizing, and releasing everything.
// The scene uses the math coordinates directly, at ONE scale on every axis; z points up.
import * as THREE from './vendor/three/three.module.min.mjs';
import {OrbitControls} from './vendor/three/OrbitControls.mjs';
export {THREE};

export const COLORS={solid:0x4aa3ff,curved:0x7cc4ff,solidEdge:0x9fd0ff,section:0x9fc9f2,base:0xffd400,baseEdge:0xf4f4f4,slice:0xffd400,mark:0xffffff,axis:0xd8d8d8,grid:0x2a2a2a,rotation:0xff4fa3};

// a text sprite (canvas texture) whose height is size; wide texts get a wider canvas
export function label(text,{size=0.5,color='#f4f4f4'}={}){
 const k=128,font=`italic 700 ${Math.round(k*0.62)}px "Times New Roman",Times,serif`,c=document.createElement('canvas');
 let g=c.getContext('2d');g.font=font;const w=Math.max(k,Math.ceil(g.measureText(text).width+k*0.34));
 c.width=w;c.height=k;g=c.getContext('2d');g.font=font;g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';
 g.lineWidth=k*0.06;g.strokeStyle='rgba(0,0,0,.85)';g.strokeText(text,w/2,k/2);g.fillText(text,w/2,k/2);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,depthWrite:false,transparent:true}));s.scale.set(size*w/k,size,1);s.renderOrder=10;s.userData.label=text;return s;
}
export const pts3=pts=>pts.map(p=>new THREE.Vector3(p[0],p[1],p[2]));
export const line=(pts,color,opacity=1)=>new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3(pts)),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));
export const loop=(pts,color,opacity=1)=>new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts3(pts)),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));
export function mesh(positions,material,normals=null,index=null){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));if(index)g.setIndex(new THREE.BufferAttribute(index,1));
 if(normals)g.setAttribute('normal',new THREE.BufferAttribute(normals,3));else g.computeVertexNormals();
 return new THREE.Mesh(g,material);
}
// the WebGL2 context three.js needs, or a clear error (no console error from three.js when WebGL is off)
function context(canvas){
 let gl=null;try{gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'default'});}catch(_){gl=null;}
 if(!gl)throw Object.assign(Error('WebGL is not available'),{webgl:false});
 return gl;
}

// The stage: canvas, renderer, scene, lights, grid and axes for the bounds B ({xmin,xmax,ymin,ymax,zmax}, and zmin when
// the model reaches below the base plane), with u the size unit for labels and arrow heads. The model is added to
// stage.scene; stage.finish(keyPoints, {dir, centerZ, up}) then fits the camera so those points, the axes and every
// label fit the canvas, and starts the controls (up: the screen's up direction, z by default).
export function createStage(host,{bounds:B,unit:u,ariaLabel}){
 const canvas=document.createElement('canvas');canvas.className='u6-3d-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',ariaLabel);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,context:context(canvas),antialias:true,alpha:true});}catch(e){throw Object.assign(Error('WebGL is not available'),{webgl:false,cause:e});}
 renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.setClearColor(0x050505,1);
 host.appendChild(canvas);
 const zmin=Math.min(0,B.zmin??0),scene=new THREE.Scene(),span=Math.max(B.xmax-B.xmin,B.ymax-B.ymin,B.zmax-zmin,1);
 scene.add(new THREE.AmbientLight(0xffffff,1.6));const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(B.xmin-span,B.ymin-2*span,3*span);scene.add(sun);
 // the base plane: a light grid and the axes (x, y along the base; z up), each labelled at its positive end
 const lo=[Math.min(0,B.xmin)-u*2,Math.min(0,B.ymin)-u*2],hi=[Math.max(0,B.xmax)+u*3,Math.max(0,B.ymax)+u*3],zTop=B.zmax+u*3,zLo=zmin<0?zmin-u*2:0;
 const step=[0.5,1,2,5,10,20].find(t=>span/t<=14)||50,grid=new THREE.Group();
 for(let x=Math.ceil(lo[0]/step)*step;x<=hi[0];x+=step)grid.add(line([[x,lo[1],0],[x,hi[1],0]],COLORS.grid));
 for(let y=Math.ceil(lo[1]/step)*step;y<=hi[1];y+=step)grid.add(line([[lo[0],y,0],[hi[0],y,0]],COLORS.grid));
 scene.add(grid);
 const axes=new THREE.Group(),head=u*0.55;
 const axis=(from,to,dir,name)=>{axes.add(line([from,to],COLORS.axis));const cone=new THREE.Mesh(new THREE.ConeGeometry(head*0.32,head,16),new THREE.MeshBasicMaterial({color:COLORS.axis}));
  cone.position.set(...to);cone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...dir));axes.add(cone);
  const l=label(name,{size:u*1.5});l.position.set(to[0]+dir[0]*u*1.1,to[1]+dir[1]*u*1.1,to[2]+dir[2]*u*1.1);axes.add(l);};
 axis([lo[0],0,0],[hi[0],0,0],[1,0,0],'x');axis([0,lo[1],0],[0,hi[1],0],[0,1,0],'y');axis([0,0,zLo],[0,0,zTop],[0,0,1],'z');
 scene.add(axes);
 const stage={THREE,scene,canvas,renderer,axes,span,lo,hi,
  finish(keyPts,{dir:dir0=[0.62,-0.74,0.5],centerZ,up=[0,0,1]}={}){
   const camera=new THREE.PerspectiveCamera(36,1,span/200,span*80);camera.up.set(...up);
   const box=new THREE.Box3().setFromObject(axes).expandByPoint(new THREE.Vector3(B.xmin,B.ymin,zmin)).expandByPoint(new THREE.Vector3(B.xmax,B.ymax,B.zmax));
   const center=new THREE.Vector3((B.xmin+B.xmax)/2,(B.ymin+B.ymax)/2,centerZ??B.zmax*0.45),radius=box.getBoundingSphere(new THREE.Sphere()).radius;
   const dir=new THREE.Vector3(...dir0).normalize(),pts=[...keyPts];
   scene.traverse(o=>{if(o.isSprite||(o.isMesh&&o.parent===axes))pts.push(o.getWorldPosition(new THREE.Vector3()));});
   pts.push(new THREE.Vector3(lo[0],0,0),new THREE.Vector3(0,lo[1],0));if(zLo<0)pts.push(new THREE.Vector3(0,0,zLo));
   const place=d=>{camera.position.copy(center).addScaledVector(dir,d);camera.lookAt(center);camera.updateMatrixWorld();};
   // the nearest distance at which every one of those points projects inside the canvas, with a margin
   const fits=d=>{place(d);return pts.every(c=>{const q=c.clone().project(camera);return q.z<1&&Math.abs(q.x)<=0.88&&Math.abs(q.y)<=0.86;});};
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
   return{camera,controls,render,
    get frames(){return frames;},get resizes(){return sized;},get distance(){return camera.position.distanceTo(controls.target);},get azimuth(){return controls.getAzimuthalAngle();},get polar(){return controls.getPolarAngle();},
    get memory(){return{...renderer.info.memory};},
    resetView(){touched=false;home();controls.target.copy(center);controls.update();render();},
    // releases every geometry, material and texture, then the renderer and its context; info gets what was left
    dispose(info){ro.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose?.();const m=o.material;if(m){m.map?.dispose?.();m.dispose?.();}});
     info.released={...renderer.info.memory};info.disposed=true;renderer.dispose();renderer.forceContextLoss?.();canvas.remove();}};
  }};
 return stage;
}
