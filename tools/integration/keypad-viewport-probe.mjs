import assert from 'node:assert/strict';

// Broad ordinary-key probe used by the 138-route sweep. The detailed stability
// suite additionally covers short viewports, held pointers, structures and zoom.
export async function probeKeypadViewport(page){
 const selector='.bm-calc-keypad,.bm-keypad,.bm-u3-shared-keypad';
 await page.evaluate(async()=>{await window.MathJax?.startup?.promise;await document.fonts.ready;});
 const pad=page.locator(selector.split(',').map(s=>s+':visible').join(',')).first();
 assert.ok(await pad.count(),'No active MathLive keypad');
 await pad.evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-20,behavior:'instant'}));
 await page.waitForTimeout(350);
 await page.evaluate(selector=>{
  const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,docX:r.x+scrollX,docY:r.y+scrollY,width:r.width,height:r.height};};
  const visible=e=>e.getBoundingClientRect().width>10&&e.getBoundingClientRect().height>10;
  const pad=[...document.querySelectorAll(selector)].find(visible);
  window.__bmViewportSnapshot=()=>({x:scrollX,y:scrollY,pad:box(pad),fields:[...document.querySelectorAll('math-field')].filter(visible).map(box),focus:document.activeElement?.tagName,viewport:visualViewport?{x:visualViewport.offsetLeft,y:visualViewport.offsetTop,width:visualViewport.width,height:visualViewport.height}:null});
  window.__bmViewportPointer=event=>{if(pad.contains(event.target))window.__bmViewportBefore=__bmViewportSnapshot();};
  document.addEventListener('pointerdown',__bmViewportPointer,true);
 },selector);
 const actions=[];
 try{for(const label of ['7','8','←','→','⌫','Clear']){
  const button=pad.locator('button').filter({hasText:new RegExp('^'+label+'$')}).first();
  if(!await button.count()||await button.isDisabled())continue;
  await page.evaluate(()=>window.__bmViewportBefore=null);await button.click();await page.waitForTimeout(180);
  const action=await page.evaluate(()=>({before:__bmViewportBefore,after:__bmViewportSnapshot()}));actions.push({label,...action});
  const{before:a,after:b}=action;assert.ok(a,'No actual pointerdown measurement');
  for(const key of ['x','y'])assert.ok(Math.abs(b[key]-a[key])<=2,`${label}: viewport ${key} changed ${b[key]-a[key]}`);
  for(const key of ['docX','docY'])assert.ok(Math.abs(b.pad[key]-a.pad[key])<=2,`${label}: keypad ${key} changed ${b.pad[key]-a.pad[key]}`);
  assert.equal(b.focus,'MATH-FIELD',`${label}: mathematical focus lost`);
  assert.deepEqual(b.viewport,a.viewport,`${label}: visual viewport changed`);
 }
 assert.ok(actions.length>=3,'Insufficient supported ordinary keys');return actions;
 }finally{await page.evaluate(()=>{document.removeEventListener('pointerdown',__bmViewportPointer,true);delete window.__bmViewportPointer;delete window.__bmViewportBefore;delete window.__bmViewportSnapshot;});}
}
