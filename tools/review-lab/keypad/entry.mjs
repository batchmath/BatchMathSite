// On-screen keypad test for a typed Unit 4 practice page: every displayed answer is entered only by clicking
// keypad buttons (fractions, exponents, functions, inverse trig, Does not apply) and submitted with the keypad's
// Check key. Also checks undo/redo/Clear, focus after Next, keypad or page overflow and console errors.
// Usage: node keypad/entry.mjs <unit-4-topic-slug> [count=8] [width=1366] [height=768] [mobile]
//   BM_SELECT=basic|usub|log|mvt|... picks a mode on the comprehensive-review page.
import {serve,browser,context,open,rendered,recordGenerated,outDir,randomPort,unit4Practice} from '../lib/browser.mjs';
import {keypadForm,parse,keypad,readResult,isCorrect} from '../lib/keypad.mjs';
const [page,count='8',W='1366',H='768',mob='']=process.argv.slice(2);
if(!page){console.error('usage: keypad/entry.mjs <slug> [count] [width] [height] [mobile]');process.exit(2);}
const PORT=randomPort(8771),srv=await serve(PORT),b=await browser(),c=await context(b,{width:+W,height:+H,mobile:!!mob});
await recordGenerated(c);
const p=await open(c,`http://127.0.0.1:${PORT}${unit4Practice(page)}?bm_seed=keypad-${page}-${W}`);
if(process.env.BM_SELECT){await p.selectOption('#unit4Mode',process.env.BM_SELECT);await p.waitForTimeout(500);}
const k=keypad(p);
const out={page,viewport:`${W}x${H}${mob?' mobile':''}`,mode:process.env.BM_SELECT||'',checked:0,failures:[],focusAfterNext:[],overflow:[],undo:null,errors:p._errs,entered:[]};
async function enterStage(sc,tex,none){
 k.scope=sc;await p.locator(`${sc} .bm-calc-editor`).first().click();await k.key('Clear');
 if(none)await k.key('Does not apply');
 else{const parts=tex.split(',\\ ').map(keypadForm);for(let j=0;j<parts.length;j++){if(j)await k.key(',');await k.emit(parse(parts[j]));}}
 const src=await k.source();
 await k.key('Check');await p.waitForTimeout(350);const r=await readResult(p,sc);return{src,res:r.result||r.message};
}
for(let i=0;i<+count;i++){
 const info=await p.evaluate(()=>{const c=window.__bmLast;return{id:c.id,variant:c.variant,tex:c.stage1.answerTex,stage2:c.stage2?{tex:c.stage2.answerTex,none:!!c.stage2.unit4Answer?.none}:null};});
 if(i===0){// undo / redo / Clear on the first problem's editor
  k.scope=info.stage2?'#choices .staged-part-one':'#choices';await p.locator(`${k.scope} .bm-calc-editor`).first().click();await k.key('Clear');
  await k.key('5');await k.key('·');await k.key('2');const typed=await k.source();
  await p.keyboard.press('Control+z');const undone=await k.source();
  await p.keyboard.press('Control+y');const redone=await k.source();
  await k.key('Clear');const cleared=await k.source();
  out.undo={typed,undone,redone,cleared,ok:typed==='5*2'&&undone!==typed&&redone===typed&&cleared===''};
 }
 const row={variant:info.variant,id:info.id};
 try{
  const s1=info.stage2?'#choices .staged-part-one':'#choices';const r1=await enterStage(s1,info.tex,false);row.s1=r1;
  if(!isCorrect(r1.res))row.problem=`part 1 not accepted (${r1.src} -> ${r1.res})`;
  else if(info.stage2){await p.locator('#choices .staged-continue').first().click();await p.waitForTimeout(250);const r2=await enterStage('#choices .staged-part-two',info.stage2.tex,info.stage2.none);row.s2=r2;if(!isCorrect(r2.res))row.problem=`part 2 not accepted (${r2.src} -> ${r2.res})`;}
 }catch(e){row.problem='entry error: '+e.message.slice(0,160);}
 out.entered.push(`${info.variant}: ${row.s1?.src||''}${row.s2?` | ${row.s2.src}`:''} => ${row.s1?.res||''}${row.s2?` / ${row.s2.res}`:''}`);
 if(row.problem)out.failures.push(`${row.variant} ${row.id}: ${row.problem}`);
 out.checked++;
 const ov=await p.evaluate(()=>({doc:document.documentElement.scrollWidth-document.documentElement.clientWidth,pad:[...document.querySelectorAll('.bm-calc-keypad')].filter(k=>k.offsetParent).map(k=>Math.round(k.getBoundingClientRect().right-window.innerWidth))}));
 if(ov.doc>0||ov.pad.some(v=>v>0))out.overflow.push({i,...ov});
 if(i===0)await p.screenshot({path:`${outDir('keypad')}/keypad-${page}${out.mode?'-'+out.mode:''}-${W}x${H}.png`,fullPage:true});
 if(await p.locator('#next').isHidden()){out.failures.push(`${row.variant}: Next hidden`);break;}
 await p.locator('#next').click();await p.waitForTimeout(300);
 out.focusAfterNext.push(await p.evaluate(()=>{const a=document.activeElement;return a?(a.className||a.tagName).toString().split(' ')[0]:'none';}));
}
out.rendered=await rendered(p);
console.log(JSON.stringify(out,null,1));
await b.close();srv.close();if(out.failures.length||out.overflow.length||out.errors.length||!out.undo?.ok)process.exitCode=1;
