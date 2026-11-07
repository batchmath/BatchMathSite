// BatchMath v13.0.A (experimental): "Show 3D Model (Beta)" on Volume by Cross Sections, Non-Calculator Practice.
// Supported: square cross sections perpendicular to the x-axis (the generator's cs_basic and cs_setup families with
// shape "square" and slices on x). Every other problem is left exactly as it is: no button appears.
//
// The practice driver writes each new question into #question, and the generator wrapper records the problem it served
// as window.BatchMathUnit5Last. When #question is rewritten, the previous model (if any) is released and, for a
// supported problem, a closed toggle is added after the 2D "Show Graph" control. The model is built from that problem's
// own data (problem.u6Solid) only when it is opened; three.js is loaded at that moment.
import {validate} from './solid-geometry.mjs';

const SHOW='Show 3D Model (Beta)',HIDE='Hide 3D Model';
let current=null; // {problem, wrap, button, stage, viewer, opening}

export function supported(p){
 const d=p&&p.u6Solid;
 return !!(d&&p.unit5Meta&&p.unit5Meta.engine==='cross_sections'&&!p.calculatorActive&&d.dir==='x'&&d.shape==='square'&&validate(d).ok);
}
function release(){
 if(!current)return;
 try{current.viewer?.dispose();}catch(_){}
 current.wrap.remove();current=null;
}
function close(c){
 try{c.viewer?.dispose();}catch(_){}
 c.viewer=null;c.stage.hidden=true;c.view.innerHTML='';c.button.textContent=SHOW;c.button.setAttribute('aria-expanded','false');c.wrap.classList.remove('is-open');
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
  if(current!==c)return;
  c.viewer=null;c.view.innerHTML=`<p class="u6-3d-note">${e&&e.webgl===false?'This browser cannot show the 3D model (WebGL is not available). The 2D graph above still shows the base.':'The 3D model could not be shown for this question. The 2D graph above still shows the base.'}</p>`;
  console.warn('3D model:',e);
 }
}
function attach(){
 const q=document.getElementById('question'),p=window.BatchMathUnit5Last;
 if(current&&current.problem===p&&current.wrap.isConnected)return;
 release();
 if(!q||!supported(p))return;
 const wrap=document.createElement('div');wrap.className='u6-3d';wrap.dataset.problemId=p.id;
 const id=`u6-3d-${Math.random().toString(36).slice(2,8)}`;
 wrap.innerHTML=`<button type="button" class="u6-graph-btn u6-3d-btn" aria-expanded="false" aria-controls="${id}">${SHOW}</button>`
  +`<div class="u6-3d-stage" id="${id}" hidden><div class="u6-3d-view"></div>`
  +`<div class="u6-3d-bar"><span class="u6-3d-help">Drag to rotate · scroll or pinch to zoom</span><button type="button" class="u6-3d-reset">Reset view</button></div>`
  +`<div class="u6-3d-legend"><span><i class="u6-3d-key u6-3d-key-base"></i>base region</span><span><i class="u6-3d-key u6-3d-key-solid"></i>solid made of square cross sections</span><span><i class="u6-3d-key u6-3d-key-slice"></i>one cross section: a square with side <em class="u6-3d-s">s</em></span></div></div>`;
 const anchor=q.querySelector('.u6-graph-toggle');
 if(anchor)anchor.after(wrap);else (q.querySelector('.u5-question')||q).appendChild(wrap);
 const c={problem:p,wrap,button:wrap.querySelector('.u6-3d-btn'),stage:wrap.querySelector('.u6-3d-stage'),view:wrap.querySelector('.u6-3d-view'),viewer:null,opening:null};
 current=c;
 c.button.addEventListener('click',()=>{if(current!==c)return;if(c.stage.hidden)open(c);else close(c);});
 wrap.querySelector('.u6-3d-reset').addEventListener('click',()=>c.viewer?.resetView());
}
function start(){
 const q=document.getElementById('question');if(!q)return;
 // a new question replaces the children of #question (the driver sets its innerHTML); the 3D control lives deeper
 new MutationObserver(()=>attach()).observe(q,{childList:true});
 attach();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
// read-only state for the review lab's browser tests
window.BatchMathCrossSections3D=Object.freeze({supported,get state(){return current?{problemId:current.problem.id,open:!current.stage.hidden,viewer:current.viewer?current.viewer.info:null}:null;}});
