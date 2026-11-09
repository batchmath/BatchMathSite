// FRQ archive QA (AP Test Preparation > AP Free-Response Questions), in Chromium on the real page.
// Checks: every exam has FRQ and scoring links; the 2026 exam's scoring links (header and Q1-Q6, By Year and By Type)
// point at the official 2026 scoring guidelines with the expected #page anchors; no "Not Posted" placeholder; the
// 2026 videos stay "Coming Soon"; year and form filters, By Year / By Type switching (mouse, keyboard, #by-type);
// no page wider than the screen (1366x900 and 390x844 touch); no console errors or failed local requests.
// With BM_BASE=<port>, every link on the page (By Year, all exams; By Type, every type) is also compared with the
// same page served from another tree (for example main): the differences are listed.
// Usage: BM_PORT=<port> [BM_BASE=<port>] node tools/review-lab/frq/frq-archive-browser.mjs   (screenshots in $REVIEW_OUT/frq)
import {browser,context,open,outDir} from '../lib/browser.mjs';
const PAGE='ap-calculus/ap-test-preparation/free-response-questions/',PORT=+process.env.BM_PORT,BASE=process.env.BM_BASE?+process.env.BM_BASE:null;
const SG26='https://apcentral.collegeboard.org/media/pdf/ap26-sg-calculus-ab.pdf',FRQ26='https://apcentral.collegeboard.org/media/pdf/ap26-frq-calculus-ab.pdf';
const SG_PAGES=[2,6,11,15,19,23],FRQ_PAGES=[3,4,7,8,9,10];
const shots=outDir('frq'),b=await browser(),out={checks:0,failures:[]};
const ok=(c,m)=>{out.checks++;if(!c)out.failures.push(m);};
// every link on the page in both views, as "view | card | label | href"
async function allLinks(p){
 await p.click('#tab-year');await p.selectOption('#year-filter','all');await p.selectOption('#form-filter','all');await p.waitForTimeout(100);
 const year=await p.$$eval('#year-list .exam-card',cards=>cards.flatMap(c=>{const t=c.querySelector('.exam-title').textContent.trim();
  return[...c.querySelectorAll('a,.resource-disabled')].map(a=>`year | ${t}${a.closest('.question-card')?' '+a.closest('.question-card').querySelector('.question-number').textContent:''} | ${a.textContent.trim()} | ${a.getAttribute('href')||'(disabled)'}`);}));
 await p.click('#tab-type');const types=await p.$$eval('#type-buttons .type-chip',bs=>bs.map(b=>b.dataset.type));const type=[];
 for(const t of types){await p.click(`#type-buttons .type-chip[data-type="${t}"]`);await p.waitForTimeout(50);
  type.push(...await p.$$eval('#type-content a,#type-content .resource-disabled',(as,t)=>as.map(a=>`type ${t} | ${a.closest('.type-item')?.querySelector('.type-item-title').textContent||'heading'} | ${a.textContent.trim()} | ${a.getAttribute('href')||'(disabled)'}`),t));}
 await p.click('#tab-year');return[...year,...type];}
for(const [w,h,mob] of [[1366,900,false],[390,844,true]]){
 const vp=`${w}x${h}`,c=await context(b,{width:w,height:h,mobile:mob}),p=await open(c,`http://127.0.0.1:${PORT}/${PAGE}`),failed=[];
 p.on('requestfailed',r=>{if(r.url().startsWith(`http://127.0.0.1:${PORT}`))failed.push(r.url());});
 p.on('response',r=>{if(r.url().startsWith(`http://127.0.0.1:${PORT}`)&&r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
 await p.waitForSelector('#year-list .exam-card');
 // ---- By Year, all exams ----
 const exams=await p.$$eval('#year-list .exam-card',cards=>cards.map(c=>({title:c.querySelector('.exam-title').textContent.trim(),
  head:[...c.querySelectorAll('.exam-actions a')].map(a=>[a.textContent.trim(),a.getAttribute('href')]),
  qs:[...c.querySelectorAll('.question-card')].map(q=>({n:q.querySelector('.question-number').textContent,links:[...q.querySelectorAll('a')].map(a=>[a.textContent.trim(),a.getAttribute('href'),a.title]),disabled:[...q.querySelectorAll('.resource-disabled')].map(d=>d.textContent)}))})));
 ok(exams.length===38,`${vp}: ${exams.length} exam sets, expected 38`);
 for(const e of exams){ok(e.head.some(([t])=>/FRQ/.test(t))&&e.head.some(([t])=>/Scoring/.test(t)),`${vp} ${e.title}: header FRQ/scoring links ${JSON.stringify(e.head)}`);
  for(const q of e.qs)ok(q.links.some(([t])=>t.startsWith('Scoring • Q'))&&q.links.some(([t])=>t.startsWith('FRQ • Q')),`${vp} ${e.title} ${q.n}: missing FRQ or scoring link`);}
 const e26=exams.find(e=>e.title==='2026');out[`2026 ${vp}`]=e26;
 ok(JSON.stringify(e26?.head)===JSON.stringify([['Official FRQ ↗',FRQ26],['Scoring Guidelines ↗',SG26]]),`${vp} 2026 header: ${JSON.stringify(e26?.head)}`);
 e26?.qs.forEach((q,i)=>{const s=q.links.find(([t])=>t==='Scoring • Q'+(i+1)+' ↗'),f=q.links.find(([t])=>t==='FRQ • Q'+(i+1)+' ↗');
  ok(s&&s[1]===`${SG26}#page=${SG_PAGES[i]}`,`${vp} 2026 Q${i+1} scoring link ${JSON.stringify(s)}`);
  ok(f&&f[1]===`${FRQ26}#page=${FRQ_PAGES[i]}`,`${vp} 2026 Q${i+1} FRQ link ${JSON.stringify(f)}`);
  ok(JSON.stringify(q.disabled)===JSON.stringify(['BatchMath Video — Coming Soon']),`${vp} 2026 Q${i+1} video state ${JSON.stringify(q.disabled)}`);});
 const text=await p.evaluate(()=>document.body.innerText);ok(!/Not Posted|not yet posted|has not posted/i.test(text),`${vp}: a "not posted" notice is still shown`);
 out[`videos ${vp}`]=exams.flatMap(e=>e.qs).filter(q=>q.links.some(([t])=>t==='BatchMath Video ↗')).length;
 // ---- filters ----
 await p.selectOption('#year-filter','2026');let s=await p.textContent('#year-summary');ok(s==='1 exam set • 6 FRQs',`${vp} 2026 filter: ${s}`);
 await p.selectOption('#form-filter','Form B');s=await p.textContent('#year-summary');ok(/^0 exam sets/.test(s)&&(await p.textContent('#year-list')).includes('No exams match'),`${vp} 2026 + Form B: ${s}`);
 await p.selectOption('#year-filter','all');s=await p.textContent('#year-summary');ok(s==='10 exam sets • 60 FRQs',`${vp} Form B: ${s}`);
 await p.selectOption('#form-filter','Regular');s=await p.textContent('#year-summary');ok(s==='28 exam sets • 168 FRQs',`${vp} Regular: ${s}`);
 await p.selectOption('#year-filter','2011');await p.selectOption('#form-filter','all');s=await p.textContent('#year-summary');ok(s==='2 exam sets • 12 FRQs',`${vp} 2011: ${s}`);
 await p.selectOption('#year-filter','all');
 // ---- By Type: 2026 questions in every type, links as in By Year ----
 await p.click('#tab-type');ok(await p.getAttribute('#tab-type','aria-selected')==='true'&&!(await p.isVisible('#year-view')),`${vp}: By Type did not open`);
 const types=await p.$$eval('#type-buttons .type-chip',bs=>bs.map(b=>b.dataset.type));const seen26=[];
 for(const t of types){await p.click(`#type-buttons .type-chip[data-type="${t}"]`);
  const items=await p.$$eval('#type-content .type-item',its=>its.map(i=>({title:i.querySelector('.type-item-title').textContent,links:[...i.querySelectorAll('a')].map(a=>[a.textContent.trim(),a.getAttribute('href')]),disabled:[...i.querySelectorAll('.resource-disabled')].map(d=>d.textContent)})));
  for(const it of items.filter(i=>i.title.startsWith('2026 • '))){const n=+it.title.slice(-1);seen26.push(n);
   ok(it.links.some(([l,h])=>l===`Scoring • Q${n} ↗`&&h===`${SG26}#page=${SG_PAGES[n-1]}`),`${vp} By Type ${t} 2026 Q${n} scoring ${JSON.stringify(it.links)}`);
   ok(it.links.some(([l,h])=>l===`FRQ • Q${n} ↗`&&h===`${FRQ26}#page=${FRQ_PAGES[n-1]}`),`${vp} By Type ${t} 2026 Q${n} FRQ ${JSON.stringify(it.links)}`);
   ok(JSON.stringify(it.disabled)===JSON.stringify(['BatchMath Video — Coming Soon']),`${vp} By Type 2026 Q${n} video ${JSON.stringify(it.disabled)}`);}
  ok(!items.some(i=>i.links.length===0),`${vp} By Type ${t}: an item without links`);}
 ok(JSON.stringify(seen26.sort())==='[1,2,3,4,5,6]',`${vp}: 2026 questions in By Type: ${seen26}`);
 if(!mob)await p.screenshot({path:`${shots}/by-type-${w}.png`,fullPage:false});
 // ---- keyboard: switch views with Enter and Space; reach a 2026 scoring link with Tab ----
 if(!mob){await p.focus('#tab-year');await p.keyboard.press('Enter');ok(await p.isVisible('#year-view'),`${vp}: Enter on By Year`);
  await p.focus('#tab-type');await p.keyboard.press('Space');ok(await p.isVisible('#type-view'),`${vp}: Space on By Type`);
  await p.focus('#tab-year');await p.keyboard.press('Enter');await p.selectOption('#year-filter','2026');await p.focus('#form-filter');
  let found=null;for(let i=0;i<40&&!found;i++){await p.keyboard.press('Tab');found=await p.evaluate(()=>{const a=document.activeElement;return a&&a.matches('a[data-bm-resource="scoring"]')?[a.textContent.trim(),a.getAttribute('href'),getComputedStyle(a).outlineStyle]:null;});}
  out.keyboardScoring=found;ok(found&&found[1].startsWith(SG26),`${vp}: Tab did not reach a 2026 scoring link (${JSON.stringify(found)})`);
  await p.selectOption('#year-filter','all');}
 // ---- #by-type opens By Type ----
 const p2=await open(c,`http://127.0.0.1:${PORT}/${PAGE}#by-type`);await p2.waitForSelector('#type-content .type-item');ok(await p2.isVisible('#type-view')&&!(await p2.isVisible('#year-view')),`${vp}: #by-type`);
 for(const e of p2._errs)ok(false,`${vp} #by-type console: ${e}`);await p2.close();
 // ---- layout ----
 await p.click('#tab-year');await p.selectOption('#year-filter','2026');
 const over=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);ok(over<=0,`${vp}: page wider than the screen by ${over}px`);
 await p.locator('#year-list .exam-card').first().screenshot({path:`${shots}/2026-${w}.png`});
 if(BASE&&!mob){const now=await allLinks(p),c2=await context(b,{width:w,height:h}),q=await open(c2,`http://127.0.0.1:${BASE}/${PAGE}`);await q.waitForSelector('#year-list .exam-card');const before=await allLinks(q);await c2.close();
  const A=new Set(before),B=new Set(now);out.linkDiff={before:before.length,after:now.length,removed:before.filter(x=>!B.has(x)),added:now.filter(x=>!A.has(x))};}
 for(const e of p._errs)ok(false,`${vp} console: ${e}`);for(const f of failed)ok(false,`${vp} failed request: ${f}`);
 out[`errors ${vp}`]=p._errs.length;await c.close();
}
// ---- the AP Test Preparation landing page: the May 2027 exam format ----
for(const [w,h,mob] of [[1366,900,false],[390,844,true]]){
 const vp=`${w}x${h}`,c=await context(b,{width:w,height:h,mobile:mob}),p=await open(c,`http://127.0.0.1:${PORT}/ap-calculus/ap-test-preparation/`);
 const f=await p.evaluate(()=>{const s=document.querySelector('.exam-format');return s&&{h2:s.querySelector('h2').textContent,cards:[...s.querySelectorAll('.resource-item')].map(i=>i.innerText.replace(/\s+/g,' ')),links:[...s.querySelectorAll('a')].map(a=>[a.textContent,a.href,a.target,a.rel])};});
 out[`landing ${vp}`]=f;
 ok(f&&/May 2027/.test(f.h2),`${vp} landing: heading ${f&&f.h2}`);
 ok(f&&f.cards.length===2&&/42 questions • 1 hour 40 minutes • 50%/.test(f.cards[0])&&/29 questions, 62 minutes — calculator not permitted/.test(f.cards[0])&&/13 questions, 38 minutes — graphing calculator required/.test(f.cards[0]),`${vp} landing: Section I ${f&&f.cards[0]}`);
 ok(f&&/6 questions • 1 hour 30 minutes • 50%/.test(f.cards[1])&&/2 questions, 30 minutes — graphing calculator required/.test(f.cards[1])&&/4 questions, 60 minutes — calculator not permitted/.test(f.cards[1]),`${vp} landing: Section II ${f&&f.cards[1]}`);
 ok(f&&f.links.length===2&&f.links.every(([,href,t,rel])=>href.startsWith('https://apcentral.collegeboard.org/')&&t==='_blank'&&/noopener/.test(rel)),`${vp} landing: source links ${JSON.stringify(f&&f.links)}`);
 ok(await p.isVisible('a.card[href="free-response-questions/"]'),`${vp} landing: FRQ archive card`);
 const over=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);ok(over<=0,`${vp} landing: wider than the screen by ${over}px`);
 await p.locator('.exam-format').screenshot({path:`${shots}/exam-format-${w}.png`});
 for(const e of p._errs)ok(false,`${vp} landing console: ${e}`);await c.close();
}
await b.close();console.log(JSON.stringify(out,null,1));if(out.failures.length)process.exitCode=1;
