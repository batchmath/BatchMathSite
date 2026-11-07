// BatchMath v13.0.C (experimental): the "Show 3D Model (Beta)" control shared by the Unit 6 3D models (Volume by Cross
// Sections and Solids of Revolution), taken unchanged from v13.0.A/B: a closed toggle styled like Show Graph; opening
// it loads the viewer module (three.js) only then, and builds the model from the problem's own data; closing it or
// releasing it (a new question) gives back every GPU geometry and texture. What each release left is recorded in
// `disposals` for the review lab's browser tests.
export const SHOW='Show 3D Model (Beta)',HIDE='Hide 3D Model';
export const disposals=[];
const record=c=>{try{if(c.viewer){c.viewer.dispose();disposals.push(c.viewer.info.released);}}catch(_){}c.viewer=null;};

// problem: the problem shown; legend: the legend's HTML; above/caption: optional lines (above the button; at the top of
// the open model); load(): imports the viewer module; make(module, host): builds the viewer in host; fallback: what
// the WebGL message says still works
export function createToggle({problem,legend,above='',caption='',label='',load,make,fallback='The 2D graph above still shows the base.'}){
 const wrap=document.createElement('div');wrap.className='u6-3d';wrap.dataset.problemId=problem.id;
 const id=`u6-3d-${Math.random().toString(36).slice(2,8)}`;
 wrap.innerHTML=`${above?`<div class="u6-3d-for">${above}</div>`:''}<button type="button" class="u6-graph-btn u6-3d-btn" aria-expanded="false" aria-controls="${id}"${label?` aria-label="${label}"`:''}>${SHOW}</button>`
  +`<div class="u6-3d-stage" id="${id}" hidden>${caption?`<div class="u6-3d-title">${caption}</div>`:''}<div class="u6-3d-view"></div>`
  +`<div class="u6-3d-bar"><span class="u6-3d-help">Drag to rotate · scroll or pinch to zoom</span><button type="button" class="u6-3d-reset">Reset view</button></div>`
  +legend+`</div>`;
 const c={problem,wrap,button:wrap.querySelector('.u6-3d-btn'),stage:wrap.querySelector('.u6-3d-stage'),view:wrap.querySelector('.u6-3d-view'),viewer:null,opening:null,alive:true,
  get open(){return!c.stage.hidden;},
  close(){record(c);c.opening=null;c.stage.hidden=true;c.view.innerHTML='';c.button.textContent=SHOW;c.button.setAttribute('aria-expanded','false');c.wrap.classList.remove('is-open');},
  release(){c.alive=false;record(c);c.wrap.remove();}};
 const open=async()=>{
  c.button.textContent=HIDE;c.button.setAttribute('aria-expanded','true');c.stage.hidden=false;c.wrap.classList.add('is-open');
  c.view.innerHTML='<p class="u6-3d-note">Loading the 3D model…</p>';
  const token=c.opening={};
  try{
   const mod=await load();
   if(!c.alive||c.opening!==token||c.stage.hidden)return; // the question changed or the model was closed meanwhile
   c.view.innerHTML='';
   c.viewer=make(mod,c.view);
  }catch(e){
   if(!c.alive||c.opening!==token)return;
   c.viewer=null;c.view.innerHTML=`<p class="u6-3d-note">${e&&e.webgl===false?'This browser cannot show the 3D model (WebGL is not available).':'The 3D model could not be shown for this question.'} ${fallback}</p>`;
   console.warn('3D model:',e&&e.message);
  }
 };
 c.button.addEventListener('click',()=>{if(!c.alive)return;if(c.stage.hidden)open();else c.close();});
 wrap.querySelector('.u6-3d-reset').addEventListener('click',()=>c.viewer?.resetView());
 return c;
}
