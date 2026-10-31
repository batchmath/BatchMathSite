// Comprehensive Review audit: topic and difficulty percentages, their independence (chi-square on the topic ×
// difficulty table), the Slope Fields drawing share, focused Practice Types, and that every part's answer checks.
// v12.8.X: also the Calculator and Non-Calculator Reviews (topic weights renormalized over the eligible topics, the
// same 40/40/20 difficulty, no problem of the wrong kind); shares and independence are now pass / fail checks.
// v12.8.Y: the reviews are chosen by difficulty only (no topic Practice Type).
// Usage: node tools/review-lab/unit5/qa/review-audit.mjs [N=10000] [mixed|calculator|non-calculator]
import {load} from './lib.mjs';
const N=+(process.argv[2]||10000),CALC=process.argv[3]&&process.argv[3]!=='mixed'?process.argv[3]:undefined;
const L=load(['unit5-basic.js','unit5-motion.js','unit5-slope-fields.js','unit5-separable.js','unit5-growth.js','unit5-rate.js','unit5-review.js']),gen=L.G.get('unit5-comprehensive-review');
// v12.8.X: rounded answers are entered as their correctly rounded decimal
const R=(a,v)=>a.places===undefined||typeof v!=='number'||!Number.isFinite(v)?v:L.W.BatchMathUnit5Core.fix(v,a.places);
const ALL={basic:20,motion:20,slope:20,separable:20,growth:10,rate:10},ELIG={calculator:['basic','motion','growth','rate'],'non-calculator':['basic','motion','slope','separable','rate']};
const TOP=CALC?ELIG[CALC]:Object.keys(ALL),TIERS=['foundational','intermediate','challenging'],TW={foundational:40,intermediate:40,challenging:20};
const wsum=TOP.reduce((a,t)=>a+ALL[t],0),TARGET=Object.fromEntries(TOP.map(t=>[t,ALL[t]/wsum]));
const tab={};TOP.forEach(t=>tab[t]=Object.fromEntries(TIERS.map(x=>[x,0])));let slopeDraw=0,slopeAll=0,errors=0,fails=[];
const S=L.W.BatchMathUnit5Slope;
for(let i=1;i<=N;i++){L.seed(i*6007);let p;try{p=gen({calc:CALC});}catch(e){errors++;if(errors<4)fails.push(`generation: ${e.message}`);continue;}const m=p.unit5Meta;
 if(!TOP.includes(m.reviewTopic)){fails.push(`${p.id}: topic ${m.reviewTopic} is not part of this review`);continue;}tab[m.reviewTopic][m.reviewTier]++;
 if(CALC&&p.calculatorActive!==(CALC==='calculator'))fails.push(`${p.id}: ${p.calculatorActive?'calculator':'non-calculator'} problem in the ${CALC} review`);
 if(m.tier!==m.reviewTier)fails.push(`${p.id}: tier ${m.tier} vs requested ${m.reviewTier}`);
 if(m.reviewTopic==='slope'){slopeAll++;if(/draw_/.test(p.variant))slopeDraw++;}
 if(i<=3000)for(const part of p.parts){if(part.control==='choice'||part.control==='svg-choice'){if(!(part.correctIndex>=0))fails.push(`${p.id} choice`);continue;}
  if(part.control==='slope-segments'){const T=part.board.targets;if(!S.gradeSegments(T,T.map(x=>x.vertical?90:S.angleOf(x.slope))).ok)fails.push(`${p.id} segments`);continue;}
  if(part.control==='solution-curve'){if(!S.gradeCurve(part.board.ref,part.board.ref,part.board.ic,S.ODES[part.board.ode]).ok)fails.push(`${p.id} curve`);continue;}
  const a=part.answer;let raw;if(a.kind==='ivp'||a.kind==='function'||a.kind==='general'){raw=a.expression+(a.kind==='general'?'+C':'');if(a.variable==='t')raw=raw.replace(/(?<![a-z])x(?![a-z])/g,'t');if(a.variable==='theta')raw=raw.replace(/(?<![a-z])x(?![a-z])/g,'θ');}
  else if(a.kind==='interval'){const ps=a.parts||[{left:a.left,right:a.right,lc:a.lc,rc:a.rc}];raw=a.none?'none':ps.map(q=>`${q.lc?'[':'('}${R(a,q.left)},${R(a,q.right)}${q.rc?']':')'}`).join('U');}
  else if(a.kind==='list')raw=a.values.length?a.values.map(v=>R(a,v)).join(','):'none';else raw=String(R(a,a.value)??a.expression);
  if(!L.A.check(raw,a).ok)fails.push(`${p.id} ${a.kind}: ${raw}`);}}
const tot=Object.values(tab).reduce((s,r)=>s+Object.values(r).reduce((a,b)=>a+b,0),0);
const rowT=Object.fromEntries(TOP.map(t=>[t,Object.values(tab[t]).reduce((a,b)=>a+b,0)])),colT=Object.fromEntries(TIERS.map(x=>[x,TOP.reduce((a,t)=>a+tab[t][x],0)]));
let chi=0;for(const t of TOP)for(const x of TIERS){const e=rowT[t]*colT[x]/tot;chi+=(tab[t][x]-e)**2/e;}
const pct=v=>(100*v/tot).toFixed(1)+'%';
console.log(`review problems: ${tot} (generation errors ${errors})`);
const CRIT={4:9.49,6:12.59,8:15.51,10:18.31},df=(TOP.length-1)*(TIERS.length-1);
const near=(got,want)=>Math.abs(got-want)<=Math.max(0.01,4*Math.sqrt(want*(1-want)/tot));
console.log(`review: ${CALC||'mixed'}`);
console.log(`topics (target ${TOP.map(t=>(100*TARGET[t]).toFixed(1)).join('/')}):`,TOP.map(t=>`${t} ${pct(rowT[t])}`).join(', '));
console.log('difficulty (target 40/40/20):',TIERS.map(x=>`${x} ${pct(colT[x])}`).join(', '));
console.log(`independence: chi-square ${chi.toFixed(2)} on ${df} degrees of freedom (95% critical value ${CRIT[df]})`);
for(const t of TOP)if(!near(rowT[t]/tot,TARGET[t]))fails.push(`topic ${t}: ${pct(rowT[t])} vs target ${(100*TARGET[t]).toFixed(1)}%`);
for(const x of TIERS)if(!near(colT[x]/tot,TW[x]/100))fails.push(`difficulty ${x}: ${pct(colT[x])} vs target ${TW[x]}%`);
if(chi>CRIT[df]*1.3)fails.push(`topic and difficulty look dependent: chi-square ${chi.toFixed(2)}`);
console.log('per-topic difficulty split:',TOP.map(t=>`${t} ${TIERS.map(x=>(100*tab[t][x]/rowT[t]).toFixed(0)).join('/')}`).join('; '));
if(slopeAll)console.log(`slope fields drawing share: ${(100*slopeDraw/slopeAll).toFixed(1)}% of ${slopeAll} (target 50%)`);
// focused Practice Types (v12.8.Y: difficulty only; a former topic value gives all review problems of the review's kind)
for(const t of Object.keys(ALL)){const seen=new Set();for(let i=1;i<=200;i++){L.seed(i*53+t.length);const p=gen({mode:t,calc:CALC});seen.add(p.unit5Meta.reviewTopic);if(CALC&&p.calculatorActive!==(CALC==='calculator'))fails.push(`former topic mode ${t}: wrong calculator kind`);}
 if(seen.size<2)fails.push(`former topic mode ${t} still fixes the topic`);}
for(const mode of TIERS){const c={};for(let i=1;i<=600;i++){L.seed(i*31+mode.length);const p=gen({mode,calc:CALC});if(CALC&&p.calculatorActive!==(CALC==='calculator'))fails.push(`mode ${mode}: wrong calculator kind`);const k=p.unit5Meta.reviewTopic;c[k]=(c[k]||0)+1;
  if(p.unit5Meta.reviewTier!==mode)fails.push(`mode ${mode} produced ${p.unit5Meta.reviewTopic}/${p.unit5Meta.reviewTier}`);}
 console.log(`mode ${mode}: ${Object.entries(c).map(([k,v])=>`${k} ${(v/6).toFixed(0)}%`).join(', ')}`);}
console.log(`checks (answers on the first 3000 problems, shares, independence, kinds, modes): ${fails.length} failures`);console.log(fails.slice(0,10).join('\n'));process.exitCode=fails.length||errors?1:0;
