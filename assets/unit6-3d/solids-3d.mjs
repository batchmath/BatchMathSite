// BatchMath v13.0.C (experimental): "Show 3D Model (Beta)" on Solids of Revolution, Non-Calculator Practice and
// Calculator Practice. Every family is supported (disk_basic, washer, shells, two_axes, trig_solid, solid_calc,
// calc_two_axes), about every axis the engine uses: the x- and y-axes, lines y = c and x = c on any side of the region,
// and lines along its boundary. A rotation whose data cannot be drawn safely gets no button (the geometry module gives
// the reason) and keeps its 2D pictures.
//
// A model appears where the 2D picture of that rotation does, never earlier:
//  - a non-calculator question that shows the region and its axis: right after that graph; when the question asks about
//    two rotations (two_axes), each rotation's model sits with its own part, under the part's prompt, when the part is
//    reached;
//  - a question that does not show the region (calculator questions, where students graph it on their own calculators,
//    and non-calculator questions without a graph): right after the region's picture in the explanation of the part
//    that first draws that rotation, once that part is checked. Before that nothing of the model is in the page.
// When the question changes every model is released, so stale geometry is never shown. A model is built from the
// problem's own data (problem.u6Revolution) only when it is opened; three.js is loaded at that moment.
import {validate} from './revolution-geometry.mjs';
import {createToggle,disposals} from './model-toggle.mjs';

let current={problem:null,slots:[]}; // the problem shown and one toggle (or null) per rotation
const checked=new WeakMap();
const check=(d,i)=>{let v=checked.get(d);if(!v){v=d.rotations.map(r=>validate(d,r));checked.set(d,v);}return v[i];};
const isSolid=p=>!!(p&&p.unit5Meta&&p.unit5Meta.engine==='solids');
export function supported(p,i=0){const d=p&&p.u6Revolution;return !!(isSolid(p)&&d&&d.rotations[i]&&check(d,i).ok);}
// why a rotation has no model (for the review lab)
export function reason(p,i=0){
 if(!p)return'no problem';if(!isSolid(p))return'not a Solids of Revolution problem';const d=p.u6Revolution;if(!d)return'the problem has no region data';
 if(!d.rotations[i])return`no rotation ${i+1}`;const v=check(d,i);return v.ok?null:v.reason;
}
const PART=i=>String.fromCharCode(65+i);
// where rotation i's toggle goes, or null while it must not appear yet
function anchorFor(p,i){
 const d=p.u6Revolution,rot=d.rotations[i],multi=d.rotations.length>1;
 if(d.graph==='shown'&&!p.calculatorActive){
  if(!multi)return document.querySelector('#question figure.u6-figure');
  return document.querySelector(`#choices .unit5-part-${rot.ask+1} .staged-part-prompt`);
 }
 return document.querySelector(`#choices .unit5-part-${rot.reveal+1} .staged-feedback .u6-fig-row`);
}
const KEY={disk:'one disk: radius <em class="u6-3d-s">R</em> from the axis',washer:'one washer: outer radius <em class="u6-3d-s">R</em>, inner radius <em class="u6-3d-s">r</em>, from the axis',
 shell:'one cylindrical shell: radius <em class="u6-3d-s">r</em>, height <em class="u6-3d-s">h</em>'};
const eq=r=>`${r.axis.type} = ${String(r.axis.c).replace('-','\u2212')}`;
function legend(rot){
 return `<div class="u6-3d-legend"><span><i class="u6-3d-key u6-3d-key-base"></i>region</span><span><i class="u6-3d-key u6-3d-key-axis"></i>axis of rotation ${eq(rot)}</span>`
  +`<span><i class="u6-3d-key u6-3d-key-solid"></i>solid of revolution</span><span><i class="u6-3d-key u6-3d-key-slice"></i>${KEY[rot.kind]}</span></div>`;
}
function release(){for(const c of current.slots)c&&c.release();current={problem:null,slots:[]};}
function sync(){
 const p=window.BatchMathUnit5Last;
 if(current.problem!==p){release();current.problem=p;}
 if(!isSolid(p)||!p.u6Revolution)return;
 const d=p.u6Revolution,multi=d.rotations.length>1;
 d.rotations.forEach((rot,i)=>{
  let c=current.slots[i];
  if(c&&!c.wrap.isConnected){c.release();c=current.slots[i]=null;}
  if(c||!supported(p,i))return;
  const at=anchorFor(p,i);if(!at)return;
  const what=`R revolved about the line ${eq(rot)}`;
  c=createToggle({problem:p,legend:legend(rot),above:multi?`Part ${PART(rot.ask)}: ${what}`:'',caption:`${what}${multi?` (Part ${PART(rot.ask)})`:''}`,label:`Show 3D Model (Beta): ${what}`,
   fallback:'The 2D graph still shows the region and the axis.',load:()=>import('./revolution-viewer.mjs'),make:(m,host)=>m.createRevolutionViewer(host,d,i,{problemId:p.id})});
  c.wrap.dataset.rotation=String(i);c.wrap.dataset.axis=rot.axisTex;c.wrap.dataset.kind=rot.kind;c.wrap.classList.add('u6-3d-rev');
  at.after(c.wrap);current.slots[i]=c;
 });
}
function start(){
 const q=document.getElementById('question');if(!q)return;
 const mo=new MutationObserver(()=>sync());
 mo.observe(q,{childList:true});
 const box=document.getElementById('choices');if(box)mo.observe(box,{childList:true,subtree:true});
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
// read-only state for the review lab's browser tests
window.BatchMathSolids3D=Object.freeze({supported,reason,get disposals(){return disposals.slice();},
 get state(){const p=current.problem;return p?{problemId:p.id,models:current.slots.map((c,i)=>c?{rotation:i,axis:c.wrap.dataset.axis,kind:c.wrap.dataset.kind,open:c.open,viewer:c.viewer?c.viewer.info:null}:null)}:null;}});
