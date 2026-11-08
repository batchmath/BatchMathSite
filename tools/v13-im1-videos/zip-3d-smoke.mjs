// Standalone delivery smoke check. Mathematical/geometry coverage is in the unchanged review-lab suites.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {serve,browser,context,open,randomPort} from '../review-lab/lib/browser.mjs';
const port=process.env.BM_PORT?Number(process.env.BM_PORT):randomPort(11600),server=process.env.BM_PORT?{close(done){done?.();}}:await serve(port),b=await browser(),results=[];
const fixtures=[['cross-sections','volume-by-cross-sections','3db4'],['solids','solids-of-revolution','3dcn14']];
try{
 for(const width of [1366,390])for(const [kind,topic,seed] of fixtures){
  const c=await context(b,{width,height:900,mobile:width===390}),r={kind,width,seed,errors:[]};let p;
  try{
   p=await open(c,`http://127.0.0.1:${port}/ap-calculus/unit-6-applications-integration/topics/${topic}/non-calculator-practice/?bm_seed=${seed}`);
   const host=p.locator('.u6-3d').first();await host.locator('.u6-3d-btn').click();
   await p.waitForFunction(()=>document.querySelector('.u6-3d-canvas')?.__bm3d);
   const state=()=>host.locator('.u6-3d-canvas').evaluate(e=>{const v=e.__bm3d;return{camera:[v.azimuth,v.distance,v.polar],mode:v.display,slice:v.sliceVisible,geometry:v.geometryIds(),frames:v.frames,problem:window.BatchMathUnit5Last.id};});
   const first=await state();assert.equal(first.mode,'transparent');assert.ok(first.slice&&first.frames>0&&first.geometry.length);
   await host.locator('[data-mode="opaque"]').click();assert.equal((await state()).mode,'opaque');
   await host.locator('.u6-3d-slice').click();assert.equal((await state()).slice,false);
   const canvas=host.locator('.u6-3d-canvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();
   await p.mouse.move(box.x+box.width*.45,box.y+box.height*.5);await p.mouse.down();await p.mouse.move(box.x+box.width*.65,box.y+box.height*.55,{steps:8});await p.mouse.up();await p.waitForTimeout(300);
   const rotated=await state();assert.notDeepEqual(rotated.camera,first.camera);
   await p.mouse.wheel(0,120);await p.waitForTimeout(300);const zoomed=await state();assert.notEqual(zoomed.camera[1],rotated.camera[1]);
   await host.locator('.u6-3d-reset').click();const reset=await state();assert.deepEqual(reset.camera,first.camera);assert.equal(reset.slice,false);assert.equal(reset.mode,'opaque');
   await host.locator('[data-mode="transparent"]').click();await host.locator('.u6-3d-slice').click();const end=await state();assert.equal(end.mode,'transparent');assert.equal(end.slice,true);assert.equal(end.problem,first.problem);assert.deepEqual(end.geometry,first.geometry);
   await host.locator('.u6-3d-btn').click();assert.equal(await host.locator('canvas').count(),0);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.deepEqual(p._errs,[]);r.passed=true;r.rotationZoomResetAndBothToggles=true;
  }catch(e){r.passed=false;r.failure=e.stack;}finally{if(p)r.errors=p._errs;results.push(r);await c.close();}
 }
}finally{await b.close();await new Promise(r=>server.close(r));}
const out=process.env.ZIP_3D_OUT||'docs/v13.0.F/evidence/downloaded-3d-smoke.json';fs.writeFileSync(out,JSON.stringify({results},null,2)+'\n');
console.log(`${results.filter(r=>r.passed).length}/4 standalone desktop/mobile 3D checks pass`);if(results.some(r=>!r.passed)){console.log(results.filter(r=>!r.passed));process.exitCode=1;}
