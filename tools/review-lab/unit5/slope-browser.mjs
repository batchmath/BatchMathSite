// Slope-field drawing QA in a real browser: wrong and imperfect drawings, erase, the typed-slope and typed-point
// keyboard alternatives, the post-check overlay, and Try again. Mouse on desktop sizes, CDP touch on mobile.
// Usage: node tools/review-lab/unit5/slope-browser.mjs [width=1366] [height=768] [mobile]
import {serve,browser,context,open,outDir,randomPort} from '../lib/browser.mjs';
const [W='1366',H='768',mob='']=process.argv.slice(2);
const PORT=randomPort(9000),srv=await serve(PORT),b=await browser({scrollbars:true}),c=await context(b,{width:+W,height:+H,mobile:!!mob});
const URL0=`http://127.0.0.1:${PORT}/ap-calculus/unit-5-differential-equations/topics/slope-fields/practice/`;
const results=[];const ok=(name,cond,detail='')=>results.push({name,pass:!!cond,detail});
async function page(mode,seed){const p=await open(c,`${URL0}?bm_seed=${seed}`);await p.selectOption('#u5Mode',mode);await p.waitForTimeout(400);p.cdp=mob?await c.newCDPSession(p):null;await p.locator('svg.u5-board').first().scrollIntoViewIfNeeded();return p;}
async function drag(p,pts){if(p.cdp){await p.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pts[0][0],y:pts[0][1]}]});for(const [x,y] of pts.slice(1))await p.cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await p.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 else{await p.mouse.move(...pts[0]);await p.mouse.down();for(const q of pts.slice(1))await p.mouse.move(...q);await p.mouse.up();}}
const client=(p,pts)=>p.evaluate(pts=>{const svg=document.querySelector('#choices svg.u5-board'),w=JSON.parse(svg.dataset.win);return pts.map(([x,y])=>window.BatchMathUnit5SlopeUI.toClient(svg,w,x,y));},pts);
const segPts=(t,deg)=>{const a=deg*Math.PI/180,dx=0.3*Math.cos(a),dy=0.3*Math.sin(a);return[[t.x-dx,t.y-dy],[t.x,t.y],[t.x+dx,t.y+dy]];};
const angle=t=>t.vertical?90:Math.atan(t.slope)*180/Math.PI;
const state=p=>p.evaluate(()=>({result:document.querySelector('#choices .staged-feedback .result')?.textContent||'',note:document.querySelector('#choices .answer-format-note')?.textContent||'',
 bad:document.querySelectorAll('#choices .mark-bad').length,good:document.querySelectorAll('#choices .mark-good').length,model:document.querySelectorAll('#choices .model-seg,#choices .model-curve').length,
 student:document.querySelectorAll('#choices .student-seg:not(.preview),#choices .student-curve').length,status:document.querySelector('#choices .u5-board-status')?.textContent||'',legend:!!document.querySelector('#choices .u5-legend')}));
for(const seed of ['sqa1','sqa2','sqa3']){
 // segments: one segment 30° off, plus an erase in the middle
 let p=await page('draw_segments',seed);const T=await p.evaluate(()=>window.BatchMathUnit5Last.parts[0].board.targets);
 ok(`${seed} segments: no overlay before checking`,(await state(p)).model===0);
 await drag(p,await client(p,segPts(T[0],angle(T[0])+90)));await p.locator('#choices .u5-tools button',{hasText:'Erase'}).click();
 const [ex,ey]=(await client(p,[[T[0].x,T[0].y]]))[0];if(p.cdp){await p.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:ex,y:ey}]});await p.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else await p.mouse.click(ex,ey);
 ok(`${seed} segments: erase removes a segment`,(await state(p)).student===0);await p.locator('#choices .u5-tools button',{hasText:'Erase'}).click();
 for(const [i,t] of T.entries())await drag(p,await client(p,segPts(t,angle(t)+(i===T.length-1?30:(i%2?6:-6)))));
 await p.locator('#choices .staged-check').click();await p.waitForTimeout(300);let s=await state(p);
 ok(`${seed} segments: one 30° error is graded wrong`,/not correct/i.test(s.result),s.result);ok(`${seed} segments: exactly one red circle`,s.bad===1&&s.good===T.length-1,`${s.bad} red, ${s.good} green`);
 ok(`${seed} segments: model overlay and legend after checking`,s.model===T.length&&s.legend);ok(`${seed} segments: feedback names the point`,s.note.includes(`(${T[T.length-1].x}, ${T[T.length-1].y})`),s.note);
 await p.screenshot({path:`${outDir('unit5')}/slope-qa-segments-wrong-${W}${mob?'m':''}-${seed}.png`,fullPage:true});
 // Try again, then type every slope with the keyboard alternative
 await p.locator('#choices .u5-retry').click();s=await state(p);ok(`${seed} segments: Try again clears the overlay`,s.model===0&&s.student===0);
 await p.locator('#choices .u5-tools button',{hasText:'Type slopes instead'}).click();const inputs=p.locator('#choices .u5-slope-entry input');
 for(const [i,t] of T.entries()){const v=t.vertical?'undefined':(()=>{for(const d of [1,2,3,4,5,6,8]){const n=t.slope*d;if(Math.abs(n-Math.round(n))<1e-9)return d===1?String(Math.round(n)):`${Math.round(n)}/${d}`;}return t.slope.toFixed(4);})();await inputs.nth(i).fill(v);}
 await p.locator('#choices .staged-check').click();await p.waitForTimeout(200);s=await state(p);ok(`${seed} segments: typed slopes draw correct segments`,s.bad===0&&s.good===T.length,`${s.good}/${T.length}`);
 await p.close();
 // curve: a curve shifted by 0.7 is rejected with feedback, and the overlay appears
 p=await page('draw_curve',seed);const ref=await p.evaluate(()=>window.BatchMathUnit5Last.parts[0].board.ref.filter((_,i)=>i%4===0));
 ok(`${seed} curve: no overlay before checking`,(await state(p)).model===0);
 await drag(p,await client(p,ref.map(([x,y])=>[x,y+0.7]).filter(([,y])=>y<2.95)));await p.locator('#choices .staged-check').click();await p.waitForTimeout(300);s=await state(p);
 ok(`${seed} curve: shifted curve is graded wrong`,/not correct/i.test(s.result),s.result);ok(`${seed} curve: specific feedback`,/initial point|drifts|crosses|too short/.test(s.note),s.note);ok(`${seed} curve: overlay after checking`,s.model===1&&s.legend);
 await p.screenshot({path:`${outDir('unit5')}/slope-qa-curve-wrong-${W}${mob?'m':''}-${seed}.png`,fullPage:true});
 // Try again with the typed-point alternative along the solution
 await p.locator('#choices .u5-retry').click();await p.locator('#choices .u5-tools button',{hasText:'Enter points instead'}).click();
 const xs=await p.$$eval('#choices .u5-slope-entry label',ls=>ls.map(l=>Number(l.textContent.replace(/[^\d.-]/g,''))));
 const full=await p.evaluate(()=>window.BatchMathUnit5Last.parts[0].board.ref);const yAt=x=>{let best=full[0];for(const q of full)if(Math.abs(q[0]-x)<Math.abs(best[0]-x))best=q;return best[1];};
 const ins=p.locator('#choices .u5-slope-entry input');for(let i=0;i<xs.length;i++)await ins.nth(i).fill(yAt(xs[i]).toFixed(2));
 await p.locator('#choices .staged-check').click();await p.waitForTimeout(200);s=await state(p);ok(`${seed} curve: typed points along the solution are accepted on retry`,/passes through the initial point|dashed yellow/.test(s.status)&&s.model===1,s.status);
 await p.close();
}
const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({viewport:`${W}x${H}${mob?' mobile (touch)':' (mouse)'}`,checks:results.length,failed:failed.length,failures:failed},null,1));
await b.close();srv.close();process.exitCode=failed.length?1:0;
