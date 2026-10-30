// Comprehensive Review audit: topic and difficulty percentages, their independence (chi-square on the topic ×
// difficulty table), the Slope Fields drawing share, focused Practice Types, and that every part's answer checks.
// Usage: node tools/review-lab/unit5/qa/review-audit.mjs [N=10000]
import {load} from './lib.mjs';
const N=+(process.argv[2]||10000);
const L=load(['unit5-basic.js','unit5-motion.js','unit5-slope-fields.js','unit5-separable.js','unit5-growth.js','unit5-rate.js','unit5-review.js']),gen=L.G.get('unit5-comprehensive-review');
// v12.8.X: rounded answers are entered as their correctly rounded decimal
const R=(a,v)=>a.places===undefined||typeof v!=='number'||!Number.isFinite(v)?v:L.W.BatchMathUnit5Core.fix(v,a.places);
const TOP=['basic','motion','slope','separable','growth','rate'],TIERS=['foundational','intermediate','challenging'];
const tab={};TOP.forEach(t=>tab[t]=Object.fromEntries(TIERS.map(x=>[x,0])));let slopeDraw=0,slopeAll=0,errors=0,fails=[];
const S=L.W.BatchMathUnit5Slope;
for(let i=1;i<=N;i++){L.seed(i*6007);let p;try{p=gen({});}catch(e){errors++;continue;}const m=p.unit5Meta;tab[m.reviewTopic][m.reviewTier]++;
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
console.log('topics (target 20/20/20/20/10/10):',TOP.map(t=>`${t} ${pct(rowT[t])}`).join(', '));
console.log('difficulty (target 40/40/20):',TIERS.map(x=>`${x} ${pct(colT[x])}`).join(', '));
console.log(`independence: chi-square ${chi.toFixed(2)} on 10 degrees of freedom (95% critical value 18.31)`);
console.log('per-topic difficulty split:',TOP.map(t=>`${t} ${TIERS.map(x=>(100*tab[t][x]/rowT[t]).toFixed(0)).join('/')}`).join('; '));
console.log(`slope fields drawing share: ${(100*slopeDraw/slopeAll).toFixed(1)}% of ${slopeAll} (target 50%)`);
// focused Practice Types
for(const mode of [...TOP,...TIERS]){const c={};for(let i=1;i<=600;i++){L.seed(i*31+mode.length);const p=gen({mode});const k=TOP.includes(mode)?p.unit5Meta.reviewTier:p.unit5Meta.reviewTopic;c[k]=(c[k]||0)+1;
  if(TOP.includes(mode)&&p.unit5Meta.reviewTopic!==mode||TIERS.includes(mode)&&p.unit5Meta.reviewTier!==mode)fails.push(`mode ${mode} produced ${p.unit5Meta.reviewTopic}/${p.unit5Meta.reviewTier}`);}
 console.log(`mode ${mode}: ${Object.entries(c).map(([k,v])=>`${k} ${(v/6).toFixed(0)}%`).join(', ')}`);}
console.log(`answer checks on the first 3000 problems: ${fails.length} failures`);console.log(fails.slice(0,10).join('\n'));process.exitCode=fails.length||errors?1:0;
