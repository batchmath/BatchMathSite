// v12.8.Y Unit 5 pages and Practice Type menus (prompt items 1, 3, 5 and the review part of 1), read from the pages:
// A. every surviving practice page has exactly the prompt's choices in order (none on Basic Calculator and
//    Separable), and no page or topic button says "Mixed"; the topic pages offer only Non-Calculator and Calculator;
// B. the four retired combined URLs are engine-less noindex redirects to their topic page, outside the sitemap;
// C. each choice produces its named kind of problem, of the page's calculator kind; All Problems draws from every
//    eligible family with the page's weights; the reviews keep their topic weights and 40/40/20;
// D. every X-era value that is no longer a choice gives the page's whole pool (never a retired family or kind);
// E. All Problems draws the same problems as X's page for the same seed (family, tier and answers), except the
//    Basic Calculator pool (one family by design) and the Calculator Review's Basic questions.
// Usage: node tools/review-lab/unit5/qa/y-menus.mjs [N per choice] [X tree]   (E runs only with an X tree)
import fs from 'node:fs';import path from 'node:path';import {load,ROOT} from './lib.mjs';
const [NS='1200',XTREE]=process.argv.slice(2);const N=+NS;
const XLIB=XTREE?await import(path.join(path.resolve(XTREE),'tools/review-lab/unit5/qa/lib.mjs')):null;
const T='ap-calculus/unit-5-differential-equations/topics';
const ALL='All Problems',RATE=[ALL,'Accumulation from One Rate','Initial Amount and Net Change','Delayed and Piecewise Rates'],REV=['All Review Problems','Foundational','Intermediate','Challenging'];
const EXPECT={
 'basic-first-order-differential-equations/calculator-practice':null,
 'basic-first-order-differential-equations/non-calculator-practice':[ALL,'Initial-Value Problems','Domain-Restricted IVPs','General Solutions'],
 'motion-problems/calculator-practice':[ALL,'Position and Displacement','Total Distance','Motion Analysis'],
 'motion-problems/non-calculator-practice':[ALL,'Recover Velocity or Position','Displacement and Total Distance','Direction and Speed'],
 'slope-fields/practice':[ALL,'Draw Slope Segments','Draw Solution Curves','Match Fields, Equations and Curves','Analyze Slopes and Solutions'],
 'separable-differential-equations/practice':null,
 'exponential-growth-and-decay-interest-newton-s-law-of-cooling/practice':[ALL,'Exponential Growth and Decay',"Newton's Law of Cooling and Warming",'Compound and Continuous Interest'],
 'rate-problems/calculator-practice':RATE,'rate-problems/non-calculator-practice':RATE,
 'comprehensive-review/calculator-practice':REV,'comprehensive-review/non-calculator-practice':REV};
const LEGACY=['basic-first-order-differential-equations/practice','motion-problems/practice','rate-problems/practice','comprehensive-review/assignment-practice'];
const BUTTONS={'basic-first-order-differential-equations':['Basic First-Order Differential Equations Non-Calculator Practice','Basic First-Order Differential Equations Calculator Practice'],
 'motion-problems':['Motion Problems Non-Calculator Practice','Motion Problems Calculator Practice'],'rate-problems':['Rate Problems Non-Calculator Practice','Rate Problems Calculator Practice'],
 'comprehensive-review':['Differential Equations Non-Calculator Review','Differential Equations Calculator Review']};
// X-era Practice Type values that are no longer offered on each page
const STALE={
 'basic-first-order-differential-equations/calculator-practice':['calc_value','calc_initial','calc_two_point','calculator_ftc','poly_power'],
 'basic-first-order-differential-equations/non-calculator-practice':['poly_power','trig','exp_composition','log_domain','calculator_ftc','calc_initial'],
 'motion-problems/calculator-practice':['calc_position','calc_distance','calc_speed','calc_direction','calculator','recover'],
 'motion-problems/non-calculator-practice':['multipart','calculator','calc_distance'],
 'separable-differential-equations/practice':['product','powers_y','log_rational','trig','exp_y','radical_branch'],
 'exponential-growth-and-decay-interest-newton-s-law-of-cooling/practice':['growth','decay','cooling','heating','reverse'],
 'rate-problems/calculator-practice':['initial_change','in_out','multipart','monotonic'],'rate-problems/non-calculator-practice':['initial_change','in_out','multipart','monotonic'],
 'comprehensive-review/calculator-practice':['basic','motion','growth','rate','slope','separable'],'comprehensive-review/non-calculator-practice':['basic','motion','slope','separable','rate','growth']};
const GLOBAL={'basic-first-order-differential-equations':'BatchMathUnit5Basic','motion-problems':'BatchMathUnit5Motion','slope-fields':'BatchMathUnit5Slope','separable-differential-equations':'BatchMathUnit5Separable','exponential-growth-and-decay-interest-newton-s-law-of-cooling':'BatchMathUnit5Growth','rate-problems':'BatchMathUnit5Rate'};
const KIND={calculator:'calculator','non-calculator':'noncalculator'};
const kindTiers=F=>F.calc||(F.calculator?{calculator:F.tiers,noncalculator:[]}:{calculator:[],noncalculator:F.tiers});
const dec=t=>t.replace(/&#x27;|&#39;/g,"'").replace(/&amp;/g,'&');
const fails=[];const fail=s=>fails.push(s);const lines=[];
const read=(root,rel)=>{const f=path.join(root,T,rel,'index.html');return fs.existsSync(f)?fs.readFileSync(f,'utf8'):null;};
const pageOf=(root,rel,h)=>{const conf=JSON.parse(h.match(/window\.BM_TOPIC_PRACTICE=(\{.*?\});/)[1]);const sel=h.match(/<select id="u5Mode"[^>]*>(.*?)<\/select>/);
 return{conf,scripts:[...h.matchAll(/<script src="\/assets\/(unit5-(?!core|answers|ui)[a-z-]+\.js)"/g)].map(m=>m[1]),modes:sel?[...sel[1].matchAll(/<option value="([^"]+)"[^>]*>([^<]*)/g)].map(m=>[m[1],dec(m[2])]):null};};
const visible=h=>h.replace(/<script.*?<\/script>|<style.*?<\/style>|<head>.*?<\/head>/gs,'').replace(/<[^>]+>/g,' ');
// A and B: pages, labels, buttons, redirects
const sitemap=fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8');
for(const [topic,want] of Object.entries(BUTTONS)){const h=read(ROOT,topic);const sec=(h.match(/data-bm-topic-practice="1">(.*?)<\/section>/s)||[])[1]||'';
 const got=[...sec.matchAll(/<a aria-label="([^"]+)"[^>]*href="([^"]+)"/g)].map(m=>[m[1],m[2]]);
 if(JSON.stringify(got.map(g=>g[0]))!==JSON.stringify(want))fail(`${topic}: topic buttons ${JSON.stringify(got.map(g=>g[0]))}`);
 if(got.some(g=>!/^(non-)?calculator-practice\/$/.test(g[1])))fail(`${topic}: a button links to ${got.map(g=>g[1])}`);
 if(/Mixed/.test(visible(h)))fail(`${topic}: topic page still says Mixed`);}
for(const rel of LEGACY){const h=read(ROOT,rel);if(!h){fail(`${rel}: missing (old bookmarks would 404)`);continue;}
 if(/BM_TOPIC_PRACTICE|unit5-|ap-topic-practice\.js|<select/.test(h))fail(`${rel}: still loads a practice engine or menu`);
 if(!/<meta http-equiv="refresh" content="0; url=\.\.\/">/.test(h)||!/<a href="\.\.\/">/.test(h))fail(`${rel}: does not send the student to the topic page`);
 if(!/<meta name="robots" content="noindex">/.test(h))fail(`${rel}: not noindex`);
 if(sitemap.includes(`/${T}/${rel}/`))fail(`${rel}: still in the sitemap`);}
const surviving=[];
for(const [rel,want] of Object.entries(EXPECT)){const h=read(ROOT,rel);if(!h){fail(`${rel}: missing`);continue;}const pg=pageOf(ROOT,rel,h);pg.rel=rel;surviving.push(pg);
 if(!sitemap.includes(`/${T}/${rel}/`))fail(`${rel}: not in the sitemap`);
 const labels=pg.modes?pg.modes.map(m=>m[1]):null;
 if(JSON.stringify(labels)!==JSON.stringify(want))fail(`${rel}: Practice Type ${JSON.stringify(labels)} (want ${JSON.stringify(want)})`);
 if(pg.modes&&pg.modes[0][0]!=='mixed')fail(`${rel}: the default choice is not the whole pool`);
 if(/Mixed/.test(visible(h)))fail(`${rel}: page still says Mixed`);}
// C, D and E: generation through each page's own generator and config
const share=(c,n)=>`${(100*c/n).toFixed(1)}`;
for(const pg of surviving){const calc=pg.conf.calculator||null,isReview=pg.scripts.includes('unit5-review.js');
 const L=load(pg.scripts,{BM_TOPIC_PRACTICE:pg.conf}),gen=L.G.get(pg.conf.slug),eng=isReview?null:L.W[GLOBAL[pg.conf.slug]],R=L.W.BatchMathUnit5Review;
 const k=calc?KIND[calc]:null,elig=eng?Object.entries(eng.FAMILIES).filter(([,F])=>k?kindTiers(F)[k].length:true):null;
 const draw=(mode,i)=>{L.seed(i*4243+(mode||'').length*17);return gen(mode?{mode,modes:{u5Mode:mode},u5Mode:mode}:{});};
 const sample=mode=>{const fam={},tier={},topic={};let wrongKind=0,errs=0,n=0;const probs=[];
  for(let i=1;i<=N;i++){let p;try{p=draw(mode,i);}catch(e){errs++;if(errs<2)fail(`${pg.rel} [${mode||'(none)'}]: ${e.message}`);continue;}n++;probs.push(p);
   if(calc&&p.calculatorActive!==(calc==='calculator'))wrongKind++;const m=p.unit5Meta;fam[m.family]=(fam[m.family]||0)+1;tier[m.reviewTier||m.tier]=(tier[m.reviewTier||m.tier]||0)+1;if(m.reviewTopic)topic[m.reviewTopic]=(topic[m.reviewTopic]||0)+1;}
  if(wrongKind)fail(`${pg.rel} [${mode||'(none)'}]: ${wrongKind} problems of the other calculator kind`);
  return{fam,tier,topic,n,probs};};
 const allPool=s=>{ // the whole pool: every eligible family (or review topic) at its weight
  if(isReview){const pool=R.topicsFor(calc),tot=pool.reduce((a,t)=>a+t.weight,0);
   for(const t of pool){const want=t.weight/tot,got=(s.topic[t.key]||0)/s.n;if(Math.abs(got-want)>Math.max(0.03,4*Math.sqrt(want*(1-want)/s.n)))fail(`${pg.rel}: topic ${t.key} ${share(s.topic[t.key]||0,s.n)}% vs ${(100*want).toFixed(1)}%`);}
   const extra=Object.keys(s.topic).filter(t=>!pool.some(q=>q.key===t));if(extra.length)fail(`${pg.rel}: review topics outside the pool ${extra}`);
   for(const [t,w] of Object.entries({foundational:.4,intermediate:.4,challenging:.2})){const got=(s.tier[t]||0)/s.n;if(Math.abs(got-w)>Math.max(0.03,4*Math.sqrt(w*(1-w)/s.n)))fail(`${pg.rel}: ${t} ${share(s.tier[t]||0,s.n)}%`);}
   return Object.entries(s.topic).map(([t,c])=>`${t} ${share(c,s.n)}`).join(', ');}
  const tot=elig.reduce((a,[,F])=>a+F.weight,0);
  for(const [f,F] of elig){const want=F.weight/tot,got=(s.fam[f]||0)/s.n;if(!s.fam[f])fail(`${pg.rel}: family ${f} never drawn`);else if(Math.abs(got-want)>Math.max(0.03,4*Math.sqrt(want*(1-want)/s.n)))fail(`${pg.rel}: ${f} ${share(s.fam[f],s.n)}% vs ${(100*want).toFixed(1)}%`);}
  const extra=Object.keys(s.fam).filter(f=>!elig.some(([e])=>e===f));if(extra.length)fail(`${pg.rel}: families outside the pool ${extra}`);
  return elig.map(([f])=>`${f} ${share(s.fam[f]||0,s.n)}`).join(', ');};
 // the default choice (or the page without a dropdown)
 const s0=sample(pg.modes?'mixed':null);lines.push(`${pg.rel}${calc?` [${calc}]`:''}: All: ${allPool(s0)}`);
 // each named choice
 for(const [mode,label] of (pg.modes||[]).slice(1)){const s=sample(mode);const bad=[];
  for(const p of s.probs){const m=p.unit5Meta;
   if(isReview){if(m.reviewTier!==mode)bad.push(`tier ${m.reviewTier}`);continue;}
   const M=eng.MODES[mode];if(!M){bad.push('no such mode in the engine');break;}
   if(!(m.family in M.families)||(Array.isArray(M.families[m.family])&&!M.families[m.family].includes(m.tier))||(M.accept&&!M.accept(p)))bad.push(m.family);
   // the named kind, read from the problem itself
   const text=p.parts.map(q=>q.prompt).join(' ');
   if(mode==='total_distance'&&!/total distance/i.test(text))bad.push('no total-distance part');
   if(mode==='domain_restricted'&&!p.parts.some(q=>q.answer?.kind==='interval'))bad.push('no interval of validity');
   if(mode==='ivp'&&!p.parts.some(q=>q.answer?.kind==='ivp'))bad.push('not an IVP');
   if(mode==='general_solution'&&m.family!=='general_solution')bad.push(m.family);}
  if(bad.length)fail(`${pg.rel} [${label}]: ${bad.length} problems outside the choice (${[...new Set(bad)].slice(0,4)})`);
  const got=isReview?Object.entries(s.topic):Object.entries(s.fam);lines.push(`   ${label}: ${got.map(([f,c])=>`${f} ${share(c,s.n)}`).join(', ')}${isReview?` | tiers ${JSON.stringify(s.tier)}`:''}`);
  // every family a grouped choice names is actually drawn
  if(!isReview)for(const f of Object.keys(eng.MODES[mode].families))if(elig.some(([e])=>e===f)&&!s.fam[f])fail(`${pg.rel} [${label}]: ${f} never drawn`);}
 // stale X-era values give the whole pool
 for(const stale of STALE[pg.rel]||[]){const s=sample(stale);allPool(s);if(isReview&&Object.keys(s.topic).length<2)fail(`${pg.rel}: stale "${stale}" fixed the topic`);if(!isReview&&Object.keys(s.fam).length<Math.min(2,elig.length))fail(`${pg.rel}: stale "${stale}" narrowed the pool to ${Object.keys(s.fam)}`);}
 // E. All Problems against X's page with the same seed
 if(XLIB&&pg.rel!=='basic-first-order-differential-equations/calculator-practice'){const xh=read(path.resolve(XTREE),pg.rel);const xp=pageOf(XTREE,pg.rel,xh);
  const XL=XLIB.load(xp.scripts,{BM_TOPIC_PRACTICE:xp.conf}),xgen=XL.G.get(xp.conf.slug);let cmp=0,diff=0;
  for(let i=1;i<=Math.min(N,600);i++){L.seed(i*911);const y=gen({mode:'mixed',modes:{u5Mode:'mixed'},u5Mode:'mixed'});XL.seed(i*911);const x=xgen({mode:'mixed',modes:{u5Mode:'mixed'},u5Mode:'mixed'});
   if(isReview&&(x.unit5Meta.reviewTopic==='basic'&&calc==='calculator'))continue;cmp++;
   const key=p=>JSON.stringify([p.unit5Meta.family,p.unit5Meta.tier,p.unit5Meta.reviewTopic,p.parts.map(q=>q.answer?.value??q.answer?.expression??q.correctIndex??null)]);
   if(key(x)!==key(y)){diff++;if(diff<3)fail(`${pg.rel}: All Problems differs from X at seed ${i*911}: ${key(y).slice(0,90)} vs ${key(x).slice(0,90)}`);}}
  lines.push(`   All Problems vs X: ${cmp} compared, ${diff} different`);}}
console.log(lines.join('\n'));console.log(`pages ${surviving.length}; redirects ${LEGACY.length}; problems ${N} per choice; failures ${fails.length}`);
if(fails.length)console.log(fails.slice(0,40).join('\n'));process.exitCode=fails.length?1:0;
