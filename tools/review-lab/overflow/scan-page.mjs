// Find math scroll boxes and clipped or spilling math on one practice page, with real (classic) scrollbars.
// For each problem it reveals the explanation (answers 0, continues staged parts), then checks every box in
// the question, answer area and feedback:
//   scrollbar  a box that scrolls (vertical on short math is the v12.8.V bug; horizontal = wide math)
//   clipped    math cut off by overflow:hidden/clip
//   spill      math drawn outside a math box that does not clip
// and whether the page itself scrolls sideways.
// Usage: node overflow/scan-page.mjs <page> [count=6] [width=1366] [height=768] [mobile] [screenshot.png]
//   page: a path such as ap-calculus/unit-1-limits-continuity/topics/introduction-to-limits/practice,
//         or a bare Unit 4 slug such as basic-integrals. BM_SELECT picks a Comprehensive Review mode.
import {serve,browser,context,open,randomPort} from '../lib/browser.mjs';
const [slug,count='6',W='1366',H='768',mob='',shot='']=process.argv.slice(2);
if(!slug){console.error('usage: scan-page.mjs <page> [count] [width] [height] [mobile] [shot.png]');process.exit(2);}
const PORT=randomPort(9000),srv=await serve(PORT),b=await browser({scrollbars:true}),c=await context(b,{width:+W,height:+H,mobile:!!mob});
const pathOf=s=>s.includes('/')?`/${s.replace(/^\/|\/$/g,'')}/`:`/ap-calculus/unit-4-integrals/topics/${s}/practice/`;
const p=await open(c,`http://127.0.0.1:${PORT}${pathOf(slug)}?bm_seed=overflow-${slug.replace(/\//g,'-')}-${W}`);
if(process.env.BM_SELECT){await p.selectOption('#unit4Mode',process.env.BM_SELECT);await p.waitForTimeout(500);}
const found=[];let pageOverflow=0,problems=0;
async function reveal(){
 for(let k=0;k<2;k++){
  const ed=p.locator('#choices .staged-part:not(.staged-completed) .bm-calc-editor, #choices > .bm-calc-editor').first();
  if(await ed.count()&&await ed.isVisible()){await ed.click();await p.keyboard.type('0');await p.keyboard.press('Enter');await p.waitForTimeout(250);}
  else{const ch=p.locator('#choices .choice:not([disabled])').first();if(await ch.count()&&await ch.isVisible()){await ch.click();await p.waitForTimeout(250);}}
  const cont=p.locator('#choices .staged-continue:not([disabled]):not([hidden])').first();if(await cont.count()&&await cont.isVisible()){await cont.click();await p.waitForTimeout(250);}else break;
 }
 await p.evaluate(()=>window.MathJax?.typesetPromise?.()).catch(()=>{});await p.waitForTimeout(300);
}
for(let i=0;i<+count;i++){
 await reveal();problems++;
 const r=await p.evaluate(()=>{
  const out=[];const roots=[...document.querySelectorAll('#question, #choices, #feedback')];
  for(const root of roots)for(const el of [root,...root.querySelectorAll('*')]){
   if(!el.getClientRects().length||el.closest('.bm-calc-keypad,.bm-calc-editor,mjx-assistive-mml'))continue;
   const cs=getComputedStyle(el),scroll=v=>['auto','scroll'].includes(v);
   if(cs.display==='inline'||cs.display==='contents')continue;// overflow does not apply to in-line boxes
   const v=el.scrollHeight-el.clientHeight,h=el.scrollWidth-el.clientWidth;
   const base={cls:(el.className||el.tagName).toString().slice(0,60),ox:cs.overflowX,oy:cs.overflowY,text:(el.textContent||'').replace(/\s+/g,' ').slice(0,50)};
   if((scroll(cs.overflowY)&&v>1)||(scroll(cs.overflowX)&&h>1)){out.push({...base,kind:'scrollbar',v,h});continue;}
   const hidden=cs.overflowY==='hidden'||cs.overflowX==='hidden'||cs.overflowX==='clip'||cs.overflowY==='clip';
   const isMathBox=el.matches('.u4-work-equation,.u4-formula,.u4-newton-equation,.method,.staged-feedback,.question-box,.correct-answer,.u1-limit-expression,.u1-piecewise-limit');
   if(!hidden&&!isMathBox)continue;
   const r=el.getBoundingClientRect(),bt=parseFloat(cs.borderTopWidth),bl=parseFloat(cs.borderLeftWidth),top=r.top+bt,left=r.left+bl,bottom=top+el.clientHeight,right=left+el.clientWidth;
   let worst=0,what='';
   for(const d of el.querySelectorAll('mjx-container *')){if(d.closest('mjx-assistive-mml,mjx-speech'))continue;const q=d.getBoundingClientRect();if(!q.width||!q.height)continue;
    const o=hidden?Math.max(top-q.top,q.bottom-bottom,cs.overflowX==='hidden'||cs.overflowX==='clip'?Math.max(left-q.left,q.right-right):0):Math.max(left-q.left,q.right-right);
    if(o>worst){worst=o;what=d.tagName.toLowerCase();}}
   if(worst>1)out.push({...base,kind:hidden?'clipped':'spill',by:+worst.toFixed(1),what});
  }
  return{out,page:document.documentElement.scrollWidth-document.documentElement.clientWidth};
 });
 for(const o of r.out)found.push({problem:i,...o});if(r.page>0)pageOverflow++;
 if(i===0&&shot)await p.screenshot({path:shot,fullPage:true});
 const nx=p.locator('#next');if(await nx.isVisible())await nx.click();await p.waitForTimeout(300);
}
const kinds={};for(const f of found){const k=`${f.kind} ${f.kind==='scrollbar'?(f.v>1?'vertical':'')+(f.v>1&&f.h>1?'+':'')+(f.h>1?'horizontal':''):f.what} ${f.ox}/${f.oy} .${f.cls.split(' ')[0]}`;kinds[k]=(kinds[k]||0)+1;}
console.log(JSON.stringify({slug,mode:process.env.BM_SELECT||'',viewport:`${W}x${H}`,problems,overflowBoxes:found.length,pageOverflow,kinds,examples:found.slice(0,4),errors:p._errs},null,1));
await b.close();srv.close();
