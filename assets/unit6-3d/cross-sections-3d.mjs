// BatchMath v13.0.B (experimental): "Show 3D Model (Beta)" on Volume by Cross Sections, Non-Calculator Practice and
// Calculator Practice. Every problem of the engine is supported: all eight cross-section shapes, slices perpendicular to
// the x-axis or to the y-axis, every family and tier. A problem whose data cannot be drawn safely gets no button (the
// geometry module gives the reason), and the question is left exactly as it is.
//
// The practice driver writes each new question into #question (and its answer parts into #choices), and the generator
// wrapper records the problem it served as window.BatchMathUnit5Last. Placement:
//  - non-calculator problems: a closed toggle right after the 2D "Show Graph" control in the question;
//  - calculator problems: students graph the region on their own calculators, and the page shows the region only in Part
//    A's explanation, after Part A is checked. The toggle appears there, right after that 2D figure, and only once the
//    explanation is on the page: before that nothing of the model is in the page.
// When the question changes the previous model (if any) is released, so stale geometry is never shown. The model is
// built from the problem's own data (problem.u6Solid) only when it is opened; three.js is loaded at that moment.
import {validate,shapeKey,SHAPE_WORDS} from './solid-geometry.mjs';

const SHOW='Show 3D Model (Beta)',HIDE='Hide 3D Model';
let current=null; // {problem, wrap, button, stage, view, viewer, opening}
const disposals=[]; // what each released model left in GPU memory (for the review lab's browser tests)

const checked=new WeakMap(); // descriptor -> validate() result (the page asks on every change of the question area)
const check=d=>{let v=checked.get(d);if(!v){v=validate(d);checked.set(d,v);}return v;};
export function supported(p){
 const d=p&&p.u6Solid;
 return !!(d&&p.unit5Meta&&p.unit5Meta.engine==='cross_sections'&&check(d).ok);
}
// why a problem has no model (for the review lab)
export function reason(p){
 const d=p&&p.u6Solid;if(!p)return'no problem';if(!p.unit5Meta||p.unit5Meta.engine!=='cross_sections')return'not a Volume by Cross Sections problem';
 if(!d)return'the problem has no base-region data';const v=check(d);return v.ok?null:v.reason;
}
const calculator=p=>!!p.calculatorActive;
// where the toggle goes, or null while it must not appear yet
function anchorFor(p){
 if(!calculator(p)){const q=document.getElementById('question');return q?{el:q.querySelector('.u6-graph-toggle'),fallback:q.querySelector('.u5-question')||q}:null;}
 // calculator: Part A's explanation, once it is shown (it holds the region's first picture)
 const fig=document.querySelector('#choices .unit5-part-1 .staged-feedback .u6-fig-row');
 return fig?{el:fig,fallback:null}:null;
}
function release(){
 if(!current)return;
 const c=current;current=null;
 try{if(c.viewer){c.viewer.dispose();disposals.push(c.viewer.info.released);}}catch(_){}
 c.viewer=null;c.wrap.remove();
}
function close(c){
 try{if(c.viewer){c.viewer.dispose();disposals.push(c.viewer.info.released);}}catch(_){}
 c.viewer=null;c.opening=null;c.stage.hidden=true;c.view.innerHTML='';c.button.textContent=SHOW;c.button.setAttribute('aria-expanded','false');c.wrap.classList.remove('is-open');
}
async function open(c){
 c.button.textContent=HIDE;c.button.setAttribute('aria-expanded','true');c.stage.hidden=false;c.wrap.classList.add('is-open');
 c.view.innerHTML='<p class="u6-3d-note">Loading the 3D model…</p>';
 const token=c.opening={};
 try{
  const {createViewer}=await import('./viewer.mjs');
  if(current!==c||c.opening!==token||c.stage.hidden)return; // the question changed or the model was closed meanwhile
  c.view.innerHTML='';
  c.viewer=createViewer(c.view,c.problem.u6Solid,{problemId:c.problem.id});
 }catch(e){
  if(current!==c||c.opening!==token)return;
  c.viewer=null;c.view.innerHTML=`<p class="u6-3d-note">${e&&e.webgl===false?'This browser cannot show the 3D model (WebGL is not available). The 2D graph above still shows the base.':'The 3D model could not be shown for this question. The 2D graph above still shows the base.'}</p>`;
  console.warn('3D model:',e&&e.message);
 }
}
function legend(d){
 const w=SHAPE_WORDS[shapeKey(d)],em=t=>t.replace(/\b(\d?)s\b/g,(m,n)=>`${n}<em class="u6-3d-s">s</em>`).replace(/\bd\b/g,'<em class="u6-3d-s">d</em>');
 return `<div class="u6-3d-legend"><span><i class="u6-3d-key u6-3d-key-base"></i>base region</span><span><i class="u6-3d-key u6-3d-key-solid"></i>solid made of ${w.solid}</span><span><i class="u6-3d-key u6-3d-key-slice"></i>one cross section: ${em(w.one)}</span></div>`;
}
function sync(){
 const p=window.BatchMathUnit5Last;
 if(current&&(current.problem!==p||!current.wrap.isConnected))release();
 if(current||!supported(p))return;
 const at=anchorFor(p);if(!at||!(at.el||at.fallback))return;
 const wrap=document.createElement('div');wrap.className='u6-3d';wrap.dataset.problemId=p.id;wrap.dataset.shape=shapeKey(p.u6Solid);wrap.dataset.dir=p.u6Solid.dir;
 const id=`u6-3d-${Math.random().toString(36).slice(2,8)}`;
 wrap.innerHTML=`<button type="button" class="u6-graph-btn u6-3d-btn" aria-expanded="false" aria-controls="${id}">${SHOW}</button>`
  +`<div class="u6-3d-stage" id="${id}" hidden><div class="u6-3d-view"></div>`
  +`<div class="u6-3d-bar"><span class="u6-3d-help">Drag to rotate · scroll or pinch to zoom</span><button type="button" class="u6-3d-reset">Reset view</button></div>`
  +legend(p.u6Solid)+`</div>`;
 if(at.el)at.el.after(wrap);else at.fallback.appendChild(wrap);
 const c={problem:p,wrap,button:wrap.querySelector('.u6-3d-btn'),stage:wrap.querySelector('.u6-3d-stage'),view:wrap.querySelector('.u6-3d-view'),viewer:null,opening:null};
 current=c;
 c.button.addEventListener('click',()=>{if(current!==c)return;if(c.stage.hidden)open(c);else close(c);});
 wrap.querySelector('.u6-3d-reset').addEventListener('click',()=>c.viewer?.resetView());
}
function start(){
 const q=document.getElementById('question');if(!q)return;
 // a new question replaces the children of #question (the driver sets its innerHTML); a calculator problem's Part A
 // explanation is added inside #choices when Part A is checked
 const mo=new MutationObserver(()=>sync());
 mo.observe(q,{childList:true});
 const box=document.getElementById('choices');if(box)mo.observe(box,{childList:true,subtree:true});
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
// read-only state for the review lab's browser tests
window.BatchMathCrossSections3D=Object.freeze({supported,reason,get disposals(){return disposals.slice();},get state(){return current?{problemId:current.problem.id,open:!current.stage.hidden,shape:current.wrap.dataset.shape,dir:current.wrap.dataset.dir,viewer:current.viewer?current.viewer.info:null}:null;}});
