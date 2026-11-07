// BatchMath v13.0.C (experimental): the "Show 3D Model" control shared by the Unit 6 3D models (Volume by Cross
// Sections and Solids of Revolution), taken unchanged from v13.0.A/B: a closed toggle styled like Show Graph; opening
// it loads the viewer module (three.js) only then, and builds the model from the problem's own data; closing it or
// releasing it (a new question) gives back every GPU geometry and texture. What each release left is recorded in
// `disposals` for the review lab's browser tests. v13.0.D: a Transparent / Opaque display control beside Reset view.
// v13.0.E: no "(Beta)" in the button; a Hide / Show control for the highlighted slice (named by `slice`: Cross Section,
// Disk, Washer or Shell), beside the other two.
export const SHOW='Show 3D Model',HIDE='Hide 3D Model';
export const disposals=[];
const record=c=>{try{if(c.viewer){c.viewer.dispose();disposals.push(c.viewer.info.released);}}catch(_){}c.viewer=null;};

// problem: the problem shown; legend: the legend's HTML; above/caption: optional lines (above the button; at the top of
// the open model); label: what the model shows, for the button's accessible name ("Show 3D Model: <label>"); slice:
// the highlighted slice's name; load(): imports the viewer module; make(module, host): builds the viewer in host;
// fallback: what the WebGL message says still works
export function createToggle({problem,legend,above='',caption='',label='',slice='Cross Section',load,make,fallback='The 2D graph above still shows the base.'}){
 const wrap=document.createElement('div');wrap.className='u6-3d';wrap.dataset.problemId=problem.id;
 const id=`u6-3d-${Math.random().toString(36).slice(2,8)}`;
 wrap.innerHTML=`${above?`<div class="u6-3d-for">${above}</div>`:''}<button type="button" class="u6-graph-btn u6-3d-btn" aria-expanded="false" aria-controls="${id}"${label?` aria-label="${SHOW}: ${label}"`:''}>${SHOW}</button>`
  +`<div class="u6-3d-stage" id="${id}" hidden>${caption?`<div class="u6-3d-title">${caption}</div>`:''}<div class="u6-3d-view"></div>`
  +`<div class="u6-3d-bar"><span class="u6-3d-help">Drag to rotate · scroll or pinch to zoom</span><span class="u6-3d-actions">`
  // v13.0.D: how the solid is drawn (Transparent, the default, or Opaque), beside Reset view
  +`<span class="u6-3d-display" role="group" aria-label="Solid display"><button type="button" class="u6-3d-mode" data-mode="transparent" aria-pressed="true">Transparent</button>`
  +`<button type="button" class="u6-3d-mode" data-mode="opaque" aria-pressed="false">Opaque</button></span>`
  // v13.0.E: the highlighted slice shown (the default) or hidden
  +`<button type="button" class="u6-3d-slice">Hide ${slice}</button><button type="button" class="u6-3d-reset">Reset view</button></span></div>`
  +legend+`</div>`;
 const c={problem,wrap,button:wrap.querySelector('.u6-3d-btn'),stage:wrap.querySelector('.u6-3d-stage'),view:wrap.querySelector('.u6-3d-view'),viewer:null,opening:null,alive:true,display:'transparent',slice:true,
  get open(){return!c.stage.hidden;},
  close(){record(c);c.opening=null;c.stage.hidden=true;c.view.innerHTML='';c.button.textContent=SHOW;if(label)c.button.setAttribute('aria-label',`${SHOW}: ${label}`);c.button.setAttribute('aria-expanded','false');c.wrap.classList.remove('is-open');},
  release(){c.alive=false;record(c);c.wrap.remove();}};
 const open=async()=>{
  c.button.textContent=HIDE;if(label)c.button.setAttribute('aria-label',`${HIDE}: ${label}`);c.button.setAttribute('aria-expanded','true');c.stage.hidden=false;c.wrap.classList.add('is-open');
  c.view.innerHTML='<p class="u6-3d-note">Loading the 3D model…</p>';
  const token=c.opening={};
  try{
   const mod=await load();
   if(!c.alive||c.opening!==token||c.stage.hidden)return; // the question changed or the model was closed meanwhile
   c.view.innerHTML='';
   c.viewer=make(mod,c.view);
   if(c.display!=='transparent')c.viewer.setDisplay?.(c.display); // the mode chosen earlier for this model
   if(!c.slice)c.viewer.setSlice?.(false); // and the slice, if it was hidden
  }catch(e){
   if(!c.alive||c.opening!==token)return;
   c.viewer=null;c.view.innerHTML=`<p class="u6-3d-note">${e&&e.webgl===false?'This browser cannot show the 3D model (WebGL is not available).':'The 3D model could not be shown for this question.'} ${fallback}</p>`;
   console.warn('3D model:',e&&e.message);
  }
 };
 c.button.addEventListener('click',()=>{if(!c.alive)return;if(c.stage.hidden)open();else c.close();});
 wrap.querySelector('.u6-3d-reset').addEventListener('click',()=>c.viewer?.resetView());
 // Transparent / Opaque: immediate, on the model as it is (same geometry, same view); remembered for this model while
 // the question stays (a new question starts Transparent again)
 const modes=[...wrap.querySelectorAll('.u6-3d-mode')];
 c.setDisplay=m=>{c.display=m==='opaque'?'opaque':'transparent';for(const b of modes)b.setAttribute('aria-pressed',String(b.dataset.mode===c.display));c.viewer?.setDisplay?.(c.display);};
 for(const b of modes)b.addEventListener('click',()=>{if(c.alive)c.setDisplay(b.dataset.mode);});
 // v13.0.E: Hide / Show the highlighted slice: immediate, on the model as it is (same geometry, view and display mode);
 // remembered for this model like the display mode (a new question shows it again). Its legend entry is dimmed while
 // it is hidden.
 const sliceBtn=wrap.querySelector('.u6-3d-slice'),sliceKey=wrap.querySelector('.u6-3d-key-slice')?.parentElement;
 c.setSlice=v=>{c.slice=v!==false;sliceBtn.textContent=`${c.slice?'Hide':'Show'} ${slice}`;sliceKey?.classList.toggle('u6-3d-off',!c.slice);c.viewer?.setSlice?.(c.slice);};
 sliceBtn.addEventListener('click',()=>{if(c.alive)c.setSlice(!c.slice);});
 return c;
}
