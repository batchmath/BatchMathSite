// v12.9.A Unit 6 QA (npm run qa:unit6): no browser. Runs the Unit 6 engines as the pages load them and checks
//  1. every page and Practice Type: problems of the page's calculator kind and of the chosen type only, finite answers,
//     no NaN/undefined or "+ -" signs in the text, a setup followed by its value agreeing with it;
//  2. the course materials' own results: washers and shells for sqrt(x) and x^2 (assignment keys), the trig solid,
//     f(x) = 8/(1+x^2) with y = 4, and the two 2025-26 graph questions rebuilt piece by piece (values, points of
//     inflection, extrema, the limit);
//  3. the integral checker: washers and shells both accepted, the method, sign, pi and (R - r)^2 notes, decimal limits
//     on calculator problems only, an integrand undefined or with a pole on its interval answered quickly;
//  4. every region: area with dx equals area with dy, washers equal shells about six lines, exact values equal numeric;
//  5. graph problems: values of g by numeric integration, inflection points and extrema from the graph of f;
//  6. the review distributions (topic and difficulty) and the review's Practice Types;
//  7. the pages: scripts and styles, page config, Practice Type options, redirects, launch buttons, sitemap; the Unit 5
//     Growth and Decay labels (Calculator Practice, calculator icon).
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),A=f=>path.join(ROOT,'assets',f),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const ctx={window:{},console:{...console,warn(){}},document:{addEventListener(){}},Math};vm.createContext(ctx);ctx.window.BatchMathRNG={random:rng(1)};
for(const f of ['derivative-expression-checker.js','unit4-exact-answers.js','ap-topic-generators.js','unit5-core.js','unit5-answers.js','unit6-core.js','unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js'])vm.runInContext(fs.readFileSync(A(f),'utf8'),ctx,{filename:f});
const W=ctx.window,C=W.BatchMathUnit6Core,G=W.BatchMathAPTopicGenerators,RG=W.BatchMathUnit6Regions,FRQ=W.BatchMathUnit6FRQ,REV=W.BatchMathUnit6Review,A5=W.BatchMathUnit5Answers;
const seed=s=>{W.BatchMathRNG={random:rng(s)};};
const errors=[],stats={};const fail=m=>{if(errors.length<200)errors.push(m);};
const rel=(a,b,r=1e-7)=>Math.abs(a-b)<=r*Math.max(1,Math.abs(a),Math.abs(b));
const N=+(process.env.U6_N||40);

// ---------- 1. pages and Practice Types ----------
const PAGES=[
 ['area-below-and-between-curves','non-calculator',['mixed','under_curve','between','choose']],['area-below-and-between-curves','calculator',['mixed','under_curve','between']],
 ['finding-area-in-terms-of-y',null,['mixed']],['integrals-on-piecewise-defined-functions',null,['mixed']],
 ['volume-by-cross-sections','non-calculator',['mixed','perp_x','perp_y']],['volume-by-cross-sections','calculator',['mixed','perp_x','perp_y']],
 ['solids-of-revolution','non-calculator',['mixed','disks_washers','shells']],['solids-of-revolution','calculator',['mixed','disks_washers','shells']],
 ['unit6-comprehensive-review','non-calculator',['mixed','frq_region','frq_graph','short']],['unit6-comprehensive-review','calculator',['mixed','frq_region','short']],
];
const modeOk={perp_x:p=>p.unit5Meta.dir==='x',perp_y:p=>p.unit5Meta.dir==='y',disks_washers:p=>(p.unit5Meta.shown||p.unit5Meta.method)!=='shell',shells:p=>(p.unit5Meta.shown||p.unit5Meta.method)==='shell',
 under_curve:p=>['axis_basic','axis_sign','exp_log_under','calc_given'].includes(p.unit5Meta.family),between:p=>!['axis_basic','axis_sign','exp_log_under','calc_given'].includes(p.unit5Meta.family),
 choose:p=>p.unit5Meta.family==='choose_dx_dy',frq_region:p=>p.unit6Review.reviewTopic==='frq_region',frq_graph:p=>p.unit6Review.reviewTopic==='frq_graph',short:p=>!/^frq_/.test(p.unit6Review.reviewTopic)};
const badSign=/(?:^|[^\^])--|\+\s*-(?!\s*\d*\s*\\infty)/;
let made=0,partsSeen=0;const fams={};
for(const [slug,calc,modes] of PAGES)for(const mode of modes)for(let i=0;i<N;i++){
 seed(i*7919+slug.length*31+mode.length);let p;
 try{p=G.get(slug)({...(calc?{calc}:{}),mode});}catch(e){fail(`${slug}/${calc}/${mode}: ${e.message}`);continue;}made++;
 const tag=`${slug}/${calc||'page'}/${mode} ${p.id}`;fams[`${slug}/${calc||'page'}`]=fams[`${slug}/${calc||'page'}`]||new Set();fams[`${slug}/${calc||'page'}`].add(p.variant);
 if(p.answerType==='unit5-staged'){
  if(calc&&p.calculatorActive!==(calc==='calculator'))fail(`${tag}: ${p.calculatorActive?'calculator':'non-calculator'} problem on the ${calc} page`);
  if(mode!=='mixed'&&modeOk[mode]&&!modeOk[mode](p))fail(`${tag}: not a ${mode} problem`);
  const text=[p.questionHtml,...p.parts.flatMap(q=>[q.prompt,q.answerTex,q.explanation,...(q.choices||[])])].join(' ');
  if(/NaN|undefined|Infinity/.test(text))fail(`${tag}: NaN/undefined in the text`);
  if(badSign.test(text.replace(/<[^>]+>/g,' ')))fail(`${tag}: malformed sign: ${text.replace(/<[^>]+>/g,' ').match(new RegExp('.{0,40}(?:'+badSign.source+').{0,20}'))?.[0]}`);
  for(const [j,q] of p.parts.entries()){partsSeen++;const a=q.answer;
   if(a&&['exact','numeric','u6-integral'].includes(a.kind)&&!Number.isFinite(a.value))fail(`${tag} [${j}]: answer ${a.value}`);
   if(a?.kind==='list'&&!(a.values||[]).every(Number.isFinite))fail(`${tag} [${j}]: list ${a.values}`);
   if(q.control==='choice'&&!(q.correctIndex>=0&&q.correctIndex<q.choices.length))fail(`${tag} [${j}]: choice index`);
   const nx=p.parts[j+1];if(a?.kind==='u6-integral'&&nx&&['exact','numeric'].includes(nx.answer?.kind)&&/^(Find the (area|volume)|Evaluate)/.test(nx.prompt)&&!rel(a.value,nx.answer.value,1e-6))fail(`${tag} [${j}]: setup ${a.value} vs value ${nx.answer.value}`);
   // the shown answer, typed, is graded correct
   if(q.control==='input'&&a&&['exact','list'].includes(a.kind)){const typed=a.kind==='list'?(a.places!==undefined?a.values.map(v=>v.toFixed(a.places)):a.values).join(', '):String(a.value);const r=A5.check(typed,a);if(!r.valid||!r.ok)fail(`${tag} [${j}]: "${typed}" not accepted`);}
  }
 }else if(!Array.isArray(p.choices)||!(p.correctIndex>=0))fail(`${tag}: not a staged problem and not multiple choice`);
}
stats.pagesAndModes={problems:made,parts:partsSeen,variants:Object.fromEntries(Object.entries(fams).map(([k,v])=>[k,v.size]))};

// ---------- 2. the course materials' results ----------
const {Q,pm,fp,bq,region,washerTerms,shellTerms,areaTerms,exactValue,numValue,etex}=C;
const sq=fp(pm(1,Q(1,2))),x2=fp(pm(1,2));
const RX=region({xs:[{a:bq(0),b:bq(1),top:sq,bot:x2}],ys:[{a:bq(0),b:bq(1),right:sq,left:x2}],view:{xmin:-1,xmax:2,ymin:-1,ymax:2}});
const keys=[['washers about y = -4',washerTerms(RX,{type:'y',c:-4}),'\\frac{89}{30}\\pi'],['washers about y = 2',washerTerms(RX,{type:'y',c:2}),'\\frac{31}{30}\\pi'],
 ['washers about x = 1',washerTerms(RX,{type:'x',c:1}),'\\frac{11}{30}\\pi'],['washers about x = -3',washerTerms(RX,{type:'x',c:-3}),'\\frac{23}{10}\\pi'],
 ['shells about y = -2',shellTerms(RX,{type:'y',c:-2}),'\\frac{49}{30}\\pi'],['area',areaTerms(RX,'x'),'\\frac{1}{3}']];
for(const [name,T,want] of keys){const e=exactValue(T),got=e?etex(e):null;if(got!==want)fail(`sqrt(x) and x^2, ${name}: ${got} (key ${want})`);}
seed(3);let trigOk=false;for(let i=0;i<400&&!trigOk;i++){seed(i);const p=W.BatchMathUnit6Volume.makeSolid({family:'trig_solid',tier:'intermediate',calc:'non-calculator'});if(/1\+\\sin x/.test(p.questionHtml)&&p.unit5Meta.axis==='y=-2'){trigOk=true;const t=p.parts[p.parts.length-1].answerTex;if(t!=='6\\pi + \\frac{11}{4}\\pi^{2}'&&t!=='\\frac{11}{4}\\pi^{2} + 6\\pi')fail(`trig solid 1 + sin x about y = -2: ${t} (assignment 6\\pi + 11\\pi^2/4)`);}}
if(!trigOk)fail('trig solid 1 + sin x about y = -2 not generated in 400 draws');
for(let i=0,found=false;i<600&&!found;i++){seed(i);const p=FRQ.make({family:'frq_cap_line',tier:'intermediate',calc:'non-calculator'});if(/\\frac\{8\}\{1\+x\^\{2\}\}/.test(p.questionHtml)&&/y=4\\\)/.test(p.questionHtml)){found=true;if(!rel(p.parts[0].answer.value,4*Math.PI-8,1e-12))fail(`8/(1+x^2) and y = 4: area ${p.parts[0].answer.value}, test 4pi - 8`);}if(i===599)fail('8/(1+x^2) with y = 4 not generated');}
// 2025-26 Test A question 2 (f = g', g(0) = 2) and question 3 (g = integral from -3 of f)
const seg=(a,ya,b,yb)=>({type:'seg',a,b,ya,yb});
const testA={pieces:[seg(-6,0,-4,-2),seg(-4,-2,0,2),{type:'semi',a:0,b:4,ya:2,yb:2,cx:2,cy:2,r:2,s:-1},seg(4,2,6,0),seg(6,0,8,4)],L:-6,R:8};
const testB={pieces:[seg(-6,2,-4,-2),seg(-4,-2,-2,2),seg(-2,2,0,1),{type:'quarter',a:0,b:1,ya:1,yb:0,cx:1,cy:1,r:1,s:-1},{type:'quarter',a:1,b:3,ya:0,yb:-2,cx:1,cy:-2,r:2,s:1},seg(3,-2,4,0)],L:-6,R:4};
const GA=FRQ.analyze(testA.pieces,-6,8),GB=FRQ.analyze(testB.pieces,-6,4);
if(!GA||!GB)fail('the test graphs are not accepted by the graph analyzer');
else{
 Object.assign(GA,{c:0,k:2});Object.assign(GB,{c:-3,k:0});
 const val=(Gx,x)=>FRQ.qpVal(FRQ.gOf(Gx,x));
 const expect=[['Test A g(8)',val(GA,8),16-2*Math.PI],['Test A g(-6)',val(GA,-6),4],['Test A g(-4)',val(GA,-4),2],['Test B g(-6)',val(GB,-6),1],['Test B g(3)',val(GB,3),1+3*Math.PI/4]];
 for(const [n,got,want] of expect)if(!rel(got,want,1e-12))fail(`${n} = ${got}, expected ${want}`);
 if(JSON.stringify(GA.poi)!=='[-4,0,2,4,6]')fail(`Test A points of inflection ${GA.poi} (expected -4, 0, 2, 4, 6)`);
 if(JSON.stringify(GB.poi)!=='[-4,-2,3]')fail(`Test B points of inflection ${GB.poi} (expected -4, -2, 3)`);
 if(JSON.stringify(GB.maxes)!=='[-5,1]'||JSON.stringify(GB.mins)!=='[-3]')fail(`Test B extrema: max ${GB.maxes} min ${GB.mins}`);
 const cand=[-6,...GA.crit,8].map(x=>val(GA,x));if(!rel(Math.min(...cand),0))fail(`Test A absolute minimum ${Math.min(...cand)} (expected 0 at x = -2)`);
 // limit x -> -4 of (g(x) + 2x + 6)/(x^2 - 16) = (f(-4) + 2)/(-8) = 0
 if(val(GA,-4)+2*-4+6!==0)fail('Test A limit is not 0/0');
}
stats.courseResults=keys.length+8;

// ---------- 3. the integral checker ----------
const TW=washerTerms(RX,{type:'y',c:-4}),v=numValue(TW),spec={value:v,variable:null,notes:[]};
const ck=(rows,s=spec)=>C.checkIntegral(rows,s);
const cases=[
 ['washers',[{coef:'pi',lower:'0',upper:'1',integrand:'(4+sqrt(x))^2-(4+x^2)^2',v:'x'}],r=>r.ok],
 ['shells, the other method',[{coef:'2pi',lower:'0',upper:'1',integrand:'(y+4)(sqrt(y)-y^2)',v:'y'}],r=>r.ok],
 ['pi inside',[{coef:'',lower:'0',upper:'1',integrand:'pi((4+sqrt(x))^2-(4+x^2)^2)',v:'x'}],r=>r.ok],
 ['two integrals',[{coef:'pi',lower:'0',upper:'1/2',integrand:'(4+sqrt(x))^2-(4+x^2)^2',v:'x'},{coef:'pi',lower:'1/2',upper:'1',integrand:'(4+sqrt(x))^2-(4+x^2)^2',v:'x'}],r=>r.ok],
 ['(R - r)^2',[{coef:'pi',lower:'0',upper:'1',integrand:'(sqrt(x)-x^2)^2',v:'x'}],r=>r.valid&&!r.ok],
 ['missing pi',[{coef:'',lower:'0',upper:'1',integrand:'(4+sqrt(x))^2-(4+x^2)^2',v:'x'}],r=>!r.ok&&/\\pi/.test(r.note||'')],
 ['reversed limits',[{coef:'pi',lower:'1',upper:'0',integrand:'(4+sqrt(x))^2-(4+x^2)^2',v:'x'}],r=>!r.ok&&/opposite sign/.test(r.note||'')],
 ['no dx or dy',[{coef:'pi',lower:'0',upper:'1',integrand:'(4+sqrt(x))^2',v:null}],r=>!r.valid],
 ['wrong variable in the integrand',[{coef:'pi',lower:'0',upper:'1',integrand:'(4+sqrt(y))^2',v:'x'}],r=>!r.valid],
 ['a constant integrand',[{coef:'',lower:'0',upper:'1',integrand:String(v),v:'x'}],r=>!r.ok],
 ['undefined on part of the interval',[{coef:'',lower:'0',upper:'4',integrand:'sqrt(x-0.2)',v:'x'}],r=>!r.ok],
 ['a pole in the interval',[{coef:'',lower:'0',upper:'2',integrand:'1/(x-0.03)',v:'x'}],r=>!r.ok],
];
for(const [name,rows,okf] of cases){const t0=Date.now(),r=ck(rows);if(!okf(r))fail(`checker, ${name}: ${JSON.stringify(r)}`);if(Date.now()-t0>3000)fail(`checker, ${name}: took ${Date.now()-t0} ms`);}
const r1=C.checkIntegral([{coef:'pi',lower:'0',upper:'1',integrand:'(4+sqrt(x))^2-(4+x^2)^2',v:'x'}],{...spec,variable:'y',methodNote:'method'});if(r1.ok||r1.note!=='method')fail('checker: the method note is not given');
// decimal limits: accepted with three or more decimals on calculator problems only
const cub=x=>x**3,ex3=Math.cbrt(2),Tc=[{coef:'',lower:'0',upper:ex3.toFixed(3),integrand:'x^2',v:'x'}],vc=2/3;
if(!C.checkIntegral(Tc,{value:vc,decimals:true}).ok)fail('checker: three-decimal calculator limit rejected');
if(C.checkIntegral(Tc,{value:vc}).ok)fail('checker: a rounded limit is accepted on a non-calculator problem');
if(C.checkIntegral([{coef:'',lower:'0',upper:ex3.toFixed(1),integrand:'x^2',v:'x'}],{value:vc,decimals:true}).ok)fail('checker: a one-decimal calculator limit is accepted');
void cub;stats.checkerCases=cases.length+4;

// ---------- 4. regions ----------
let regions=0;
for(const name of [...Object.keys(RG.EXACT),...Object.keys(RG.CALC)])for(let s=1;s<=12;s++){seed(s*101+name.length);let R;try{R=RG.build(name);}catch(e){fail(`region ${name}: ${e.message}`);break;}regions++;
 const ax=R.xs?numValue(areaTerms(R,'x')):null,ay=R.ys?numValue(areaTerms(R,'y')):null;if(ax!==null&&ay!==null&&!rel(ax,ay))fail(`${name}: area dx ${ax} vs dy ${ay}`);
 for(const T of [R.xs&&areaTerms(R,'x'),R.ys&&areaTerms(R,'y')].filter(Boolean)){const e=exactValue(T);if(e&&!rel(C.evalE(e),numValue(T)))fail(`${name}: exact area ${etex(e)} vs ${numValue(T)}`);}
 const V=R.view;for(const axis of [{type:'y',c:0},{type:'y',c:Math.floor(V.ymin)-1},{type:'y',c:Math.ceil(V.ymax)+1},{type:'x',c:0},{type:'x',c:Math.floor(V.xmin)-1},{type:'x',c:Math.ceil(V.xmax)+1}]){
  const Tw=washerTerms(R,axis),Ts=shellTerms(R,axis);if(Tw&&Ts&&!rel(numValue(Tw),numValue(Ts)))fail(`${name} about ${axis.type}=${axis.c}: washers ${numValue(Tw)} vs shells ${numValue(Ts)}`);
  for(const T of [Tw,Ts].filter(Boolean)){const e=exactValue(T);if(e&&!rel(C.evalE(e),numValue(T)))fail(`${name}: exact volume ${etex(e)} vs ${numValue(T)}`);}}}
stats.regions=regions;

// ---------- 5. graph problems ----------
let graphs=0;
for(const fam of ['graph_derivative','graph_accum'])for(const tier of ['intermediate','challenging'])for(let i=1;i<=Math.ceil(N/2);i++){
 seed(i*104729+tier.length*7+fam.length);const p=FRQ.make({family:fam,tier,calc:'non-calculator'}),M=p.unit6Meta;graphs++;
 const pieceAt=x=>M.pieces.find(q=>x>=q.a-1e-12&&x<=q.b+1e-12),f=x0=>{const x=Math.min(Math.max(x0,M.L),M.R);return FRQ.fAt(pieceAt(x),x);},g=x=>M.k+C.quad(f,M.c,x,1e-10);
 const inner=[];for(let x=M.L+1;x<M.R;x++)inner.push(x);
 const dir=(x,h)=>Math.sign(f(x+h)-f(x)),poi=inner.filter(x=>{const l=dir(x-1e-4,1e-5),r=dir(x+1e-5,1e-5);return l&&r&&l!==r;});
 const maxes=inner.filter(x=>f(x-1e-6)>0&&f(x+1e-6)<0),mins=inner.filter(x=>f(x-1e-6)<0&&f(x+1e-6)>0);
 for(const [j,q] of p.parts.entries()){const pr=q.prompt.replace(/<[^>]+>/g,'');let m,want=null;
  if((m=pr.match(/^Find \\\(g\((-?\d+)\)\\\)\.$/)))want=g(+m[1]);
  else if(/point of inflection\? Enter/.test(pr)){if(JSON.stringify([...q.answer.values].sort((a,b)=>a-b))!==JSON.stringify(poi))fail(`${p.id} [${j}]: inflection ${q.answer.values} vs ${poi}`);}
  else if(/local maximum\? Enter/.test(pr)){if(JSON.stringify(q.answer.values)!==JSON.stringify(maxes))fail(`${p.id} [${j}]: maxima ${q.answer.values} vs ${maxes}`);}
  else if(/local minimum\? Enter/.test(pr)){if(JSON.stringify(q.answer.values)!==JSON.stringify(mins))fail(`${p.id} [${j}]: minima ${q.answer.values} vs ${mins}`);}
  else if(/absolute (maximum|minimum) value/.test(pr)){const xs=[];for(let x=M.L;x<=M.R+1e-9;x+=0.25)xs.push(g(x));want=/maximum/.test(pr)?Math.max(...xs):Math.min(...xs);
   if(/maximum/.test(pr)?q.answer.value<want-1e-7:q.answer.value>want+1e-7)fail(`${p.id} [${j}]: absolute value ${q.answer.value} beaten by sampling ${want}`);want=null;}
  else if((m=pr.match(/^Find \\\(g''\((-?\d+)\)\\\)\.$/)))want=(f(+m[1]+1e-6)-f(+m[1]-1e-6))/2e-6;
  else if((m=pr.match(/lim_\{x\\to (-?\d+)\}/)))want=null; // checked by the course-result test and the engine's 0/0 construction
  if(want!==null&&!rel(want,q.answer.value,1e-6))fail(`${p.id} [${j}] ${pr.slice(0,30)}: ${q.answer.value} vs numeric ${want}`);}
}
stats.graphProblems=graphs;

// ---------- 5b. graph fit (v12.9.C) ----------
// every figure of every family keeps its shaded region, marked points, slice and radius end points, axes of rotation
// and the graph of f inside the frame with a margin; no tick reads 0
{const fams=[[W.BatchMathUnit6Area,'make','FAMILIES'],[W.BatchMathUnit6Area,'makeY','FAMILIES_Y'],[W.BatchMathUnit6Volume,'makeCS','FAMILIES_CS'],[W.BatchMathUnit6Volume,'makeSolid','FAMILIES_SOLID'],[FRQ,'make','FAMILIES']];
 const kt=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});let figs=0;
 for(const [E,mk,FK] of fams)for(const [fam,f] of Object.entries(E[FK]))for(const kind of ['calculator','non-calculator'])for(const tier of kt(f)[kind==='calculator'?'calculator':'noncalculator'])for(let i=0;i<8;i++){
  seed(i*977+fam.length*13+tier.length);let p;try{p=E[mk]({family:fam,tier,calc:kind});}catch(e){continue;}
  for(const html of [p.questionHtml,...p.parts.map(q=>q.explanation)])for(const m of String(html).matchAll(/<svg viewBox="0 0 ([\d.]+) ([\d.]+)"[^>]*class="u6-svg"[^>]*>([\s\S]*?)<\/svg>/g)){figs++;
   const Wd=+m[1],Hd=+m[2],b=m[3],mx=0.02*Wd,my=0.02*Hd,pts=[];
   for(const g of b.matchAll(/<polygon points="([^"]+)" class="u6-shade"\/>/g))for(const pt of g[1].trim().split(/\s+/))pts.push(pt.split(',').map(Number));
   for(const g of b.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="[\d.]+" class="u6-(?:mark|slice-end|axis-pt|radius-end)"\/>/g))pts.push([+g[1],+g[2]]);
   for(const g of b.matchAll(/<path d="([^"]+)" class="u6-curve u6-graph-f"\/>/g)){const v=(g[1].match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);for(let k=0;k+1<v.length;k+=2)pts.push([v[k],v[k+1]]);}
   for(const g of b.matchAll(/<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)" class="u6-rot"\/>/g))if(g[2]===g[4])pts.push([Wd/2,+g[2]]);else pts.push([+g[1],Hd/2]);
   const out=pts.find(([x,y])=>!(x>=mx&&x<=Wd-mx&&y>=my&&y<=Hd-my));
   if(out)fail(`${p.id}: graph cut off at (${out[0]}, ${out[1]}) in a ${Wd}x${Hd} frame`);
   if(/class="u6-tick[^"]*">0</.test(b))fail(`${p.id}: a tick labelled 0`);}}
 // the reported case (teacher testing of v12.9.B): y = x^3 - 4x + 3 and y = -x^3 + 4x + 3, lobes reaching 3 ± 3.079
 let cubic=null;for(let s=1;s<20000&&!cubic;s++){seed(s);const p=W.BatchMathUnit6Area.make({family:'between_enclosed',tier:'intermediate',calc:'non-calculator'});if(p.id.includes('y=x^{3} - 4x + 3|y=-x^{3} + 4x + 3'))cubic=p;}
 if(!cubic)fail('graph fit: the reported cubic case was not generated');
 else{const m=[cubic.questionHtml,...cubic.parts.map(q=>q.explanation)].join('').match(/<svg viewBox="0 0 ([\d.]+) ([\d.]+)"[^>]*class="u6-svg"[^>]*>([\s\S]*?)<\/svg>/);
  const Hd=m?+m[2]:0,ys=m?[...m[3].matchAll(/<polygon points="([^"]+)" class="u6-shade"\/>/g)].flatMap(g=>g[1].trim().split(/\s+/).map(pt=>+pt.split(',')[1])):[];
  if(!ys.length||Math.min(...ys)<0.02*Hd||Math.max(...ys)>0.98*Hd)fail(`graph fit: the reported cubic case is cut off (${Math.min(...ys)}..${Math.max(...ys)} of ${Hd})`);}
 stats.graphFit=figs;}

// ---------- 5c. cross-section shapes (v12.9.D) ----------
// a semicircle always stands on its slice as its DIAMETER (d = s, r = s/2, A = pi s^2/8); a quarter circle has the slice
// as a RADIUS (A = pi s^2/4). The former radius-across semicircle is gone from the shapes and from every generated
// question, setup and explanation. The teacher's case: y = -x^2 + 4 and y = 0, semicircles perpendicular to the y-axis,
// V = 4 pi (16 pi, the radius-across value, is refused, as value and as setup).
{const V6=W.BatchMathUnit6Volume,SHAPES=C.SHAPES;let checked=0,semis=0,quarters=0,regions=0;
 if(SHAPES.semicircle_r)fail('shapes: the radius-across semicircle still exists');
 if(V6.SH.some(n=>/semicircle/.test(n)&&n!=='semicircle_d'))fail(`shapes: the shape pool still has ${V6.SH.filter(n=>/semicircle/.test(n)&&n!=='semicircle_d')}`);
 // every region and direction: pi/8 and pi/4 times an independent integral of s^2 (Simpson on the slice length itself)
 // (Simpson after z = a + (b - a)(3u^2 - 2u^3), which smooths endpoint behaviour such as y^(1/3) at 0)
 const simpson=(f,a,b,n=4000)=>{const g=u=>f(a+(b-a)*(3*u*u-2*u*u*u))*(b-a)*6*u*(1-u),h=1/n;let s=g(0)+g(1);for(let i=1;i<n;i++)s+=(i%2?4:2)*g(i*h);return s*h/3;};
 for(const name of [...Object.keys(RG.EXACT),...Object.keys(RG.CALC)])for(let i=0;i<8;i++){seed(500+i*17+name.length);let R;try{R=RG.build(name);}catch(e){continue;}
  for(const v of ['x','y']){const ps=v==='x'?R.xs:R.ys;if(!ps)continue;regions++;
   const s2=ps.reduce((t,p)=>t+simpson(z=>{const w=p.w?p.w.f(z):v==='x'?p.top.f(z)-p.bot.f(z):p.right.f(z)-p.left.f(z);return w*w;},p.a.v,p.b.v),0);
   for(const [id,k] of [['semicircle_d',Math.PI/8],['quarter',Math.PI/4]]){const T=C.sectionTerms(R,v,SHAPES[id]),val=C.numValue(T),ex=C.exactValue(T);
    if(!rel(val,k*s2,1e-6))fail(`${id} on ${name} (${v}): volume ${val}, expected ${k*s2}`);
    if(ex&&!rel(C.evalE(ex),val,1e-7))fail(`${id} on ${name} (${v}): exact ${C.evalE(ex)} differs from numeric ${val}`);}}}
 // generated problems: no radius-across semicircle anywhere; setups use pi/8 (semicircles) and pi/4 (quarter circles)
 const kt=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});
 const look=p=>{checked++;const text=[p.questionHtml,...p.parts.flatMap(q=>[q.prompt,q.explanation,q.answerTex])].join(' ');
  if(/semicircles? whose radius|semicircle with radius|radius lies across the region[^<]*semicircle/.test(text))fail(`${p.id}: a radius-across semicircle`);
  const semi=/semicircles whose diameter lies across the region/.test(text),quarter=/quarter circles whose radius lies across the region/.test(text);
  if(semi){semis++;if(!/d=s\\\)/.test(text)||!/>d = s</.test(text)&&/u6-cs-svg/.test(text))fail(`${p.id}: semicircle without the diameter d = s in its explanation or picture`);}
  if(quarter)quarters++;
  // a cross-section setup about semicircles: pi/8; about quarter circles: pi/4 (the problem's other parts may be washers)
  for(const q of p.parts){const ask=`${p.questionHtml} ${q.prompt}`,cs=/semicircles whose diameter/.test(q.prompt)||(!/rotated|revolved/.test(q.prompt)&&/semicircles whose diameter/.test(p.questionHtml)&&!/quarter circles/.test(ask));
   const qc=/quarter circles whose radius/.test(q.prompt)||(!/rotated|revolved/.test(q.prompt)&&/quarter circles whose radius/.test(p.questionHtml));
   for(const r of (q.answer?.rows||[])){const c=String(r.coef||'');
    if(cs&&!/\\frac\{\\pi\}\{8\}/.test(c))fail(`${p.id}: semicircle setup with coefficient ${c}`);
    if(qc&&!/\\frac\{\\pi\}\{4\}/.test(c))fail(`${p.id}: quarter-circle setup with coefficient ${c}`);}}};
 for(const [E,mk,FK] of [[V6,'makeCS','FAMILIES_CS'],[FRQ,'make','FAMILIES']])for(const [fam,f] of Object.entries(E[FK]))for(const kind of ['calculator','non-calculator'])for(const tier of kt(f)[kind==='calculator'?'calculator':'noncalculator'])for(let i=0;i<Math.max(N,40);i++){
  seed(i*613+fam.length*7+tier.length+kind.length);let p;try{p=E[mk]({family:fam,tier,calc:kind});}catch(e){continue;}look(p);}
 for(const calc of ['non-calculator','calculator'])for(let i=0;i<400;i++){seed(9000+i*7+calc.length);look(REV.make({calc}));}
 if(semis<20||quarters<10)fail(`shapes: too few semicircle (${semis}) or quarter-circle (${quarters}) problems sampled`);
 // the teacher's case, as a generated problem: the value 4 pi; 16 pi and the radius-across setup refused
 let hit=null,setup=null;
 for(let s=1;s<40000&&!(hit&&setup);s++){seed(s);if(!hit){const p=V6.makeCS({family:'cs_basic',tier:'foundational',calc:'non-calculator'});if(p.unit5Meta.region==='cap'&&p.id.includes('y=-x^{2} + 4|y=0-y-semicircles'))hit=p;}
  if(!setup){seed(s);const p=V6.makeCS({family:'cs_setup',tier:'intermediate',calc:'non-calculator'});if(p.unit5Meta.region==='cap'&&p.id.includes('y=-x^{2} + 4|y=0-y-semicircles'))setup=p;}}
 if(!hit)fail('shapes: the teacher case (y = -x^2 + 4, semicircles perpendicular to the y-axis) was not generated');
 else{const a=hit.parts[0].answer;if(!rel(a.value,4*Math.PI))fail(`shapes: the teacher case has volume ${a.value}, not 4 pi`);
  if(!A5.check('4pi',a).ok)fail('shapes: 4 pi refused for the teacher case');if(A5.check('16pi',a).ok)fail('shapes: 16 pi (radius across) accepted for the teacher case');}
 if(!setup)fail('shapes: the teacher case setup was not generated');
 else{const sp=setup.parts[0].answer;
  const ok=C.checkIntegral([{coef:'pi/8',lower:'0',upper:'4',integrand:'(2sqrt(4-y))^2',v:'y'}],sp),old=C.checkIntegral([{coef:'pi/2',lower:'0',upper:'4',integrand:'(2sqrt(4-y))^2',v:'y'}],sp);
  if(!(ok.valid&&ok.ok))fail(`shapes: the diameter setup is refused: ${JSON.stringify(ok)}`);if(old.ok)fail('shapes: the radius-across setup (pi/2) is accepted');}
 stats.shapes={regionsChecked:regions,problems:checked,semicircles:semis,quarterCircles:quarters,teacherCase:hit?hit.parts[0].answerTex:null};}

// ---------- 6. review distributions ----------
const want={'non-calculator':{area:14,area_y:10,cross_sections:12,washers:12,shells:9,frq_region:18,frq_graph:20,piecewise:5},calculator:{area:20,cross_sections:18,solids:27,frq_region:35}};
for(const calc of ['non-calculator','calculator']){const count={},tiers={};const n=1200;
 for(let i=0;i<n;i++){seed(i*31+calc.length);const p=REV.make({calc});count[p.unit6Review.reviewTopic]=(count[p.unit6Review.reviewTopic]||0)+1;tiers[p.unit6Review.reviewTier]=(tiers[p.unit6Review.reviewTier]||0)+1;}
 for(const [k,w] of Object.entries(want[calc])){const got=100*(count[k]||0)/n;if(Math.abs(got-w)>4)fail(`${calc} review: ${k} ${got.toFixed(1)}% (target ${w}%)`);}
 for(const k of Object.keys(count))if(!(k in want[calc]))fail(`${calc} review: unexpected topic ${k}`);
 stats[`review_${calc}`]={topics:Object.fromEntries(Object.entries(count).map(([k,c])=>[k,+(100*c/n).toFixed(1)])),tiers:Object.fromEntries(Object.entries(tiers).map(([k,c])=>[k,+(100*c/n).toFixed(1)]))};}

// ---------- 7. pages ----------
const U6='ap-calculus/unit-6-applications-integration/topics/';
const scriptsOf=h=>[...h.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]);
const BASE=['/assets/unit5-core.js','/assets/unit5-answers.js','/assets/unit5-ui.js','/assets/unit6-core.js','/assets/unit6-ui.js','/assets/unit6-regions.js'];
const WIRED=[['area-below-and-between-curves/non-calculator-practice','area-below-and-between-curves','non-calculator',['unit6-area.js'],['mixed','under_curve','between','choose']],
 ['area-below-and-between-curves/calculator-practice','area-below-and-between-curves','calculator',['unit6-area.js'],['mixed','under_curve','between']],
 ['finding-area-in-terms-of-y/practice','finding-area-in-terms-of-y',null,['unit6-area.js'],null],
 ['integrals-on-piecewise-defined-functions/practice','integrals-on-piecewise-defined-functions',null,['unit6-piecewise.js'],null],
 ['volume-by-cross-sections/non-calculator-practice','volume-by-cross-sections','non-calculator',['unit6-volume.js'],['mixed','perp_x','perp_y']],
 ['volume-by-cross-sections/calculator-practice','volume-by-cross-sections','calculator',['unit6-volume.js'],['mixed','perp_x','perp_y']],
 ['solids-of-revolution/non-calculator-practice','solids-of-revolution','non-calculator',['unit6-volume.js'],['mixed','disks_washers','shells']],
 ['solids-of-revolution/calculator-practice','solids-of-revolution','calculator',['unit6-volume.js'],['mixed','disks_washers','shells']],
 ['comprehensive-review/non-calculator-practice','unit6-comprehensive-review','non-calculator',['unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js'],['mixed','frq_region','frq_graph','short']],
 ['comprehensive-review/calculator-practice','unit6-comprehensive-review','calculator',['unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js'],['mixed','frq_region','short']]];
const sitemap=read('sitemap.xml');
for(const [page,slug,calc,eng,modes] of WIRED){const f=`${U6}${page}/index.html`;if(!fs.existsSync(path.join(ROOT,f))){fail(`${f}: missing`);continue;}const h=read(f),s=scriptsOf(h);
 const want=[...BASE,...eng.map(e=>`/assets/${e}`),'/assets/ap-topic-practice.js'],at=s.indexOf(want[0]);
 if(at<0||JSON.stringify(s.slice(at,at+want.length))!==JSON.stringify(want))fail(`${page}: engine scripts ${JSON.stringify(s.slice(at,at+want.length))}`);
 for(const head of ['/assets/derivative-expression-checker.js','/assets/unit4-exact-answers.js','/assets/calculus-keypad.js','/assets/ap-topic-generators.js'])if(!s.includes(head)||s.indexOf(head)>s.indexOf('/assets/unit5-core.js'))fail(`${page}: ${head} missing or after the engines`);
 for(const css of ['/assets/calculus-keypad.css','/assets/unit5.css','/assets/unit6.css'])if(!h.includes(`<link rel="stylesheet" href="${css}">`))fail(`${page}: ${css} missing`);
 // v12.9.C: MathLive answer fields, installed before the (deferred) practice driver draws the first question
 if(!h.includes('<link rel="stylesheet" href="/assets/mathlive/pilot.css"><script type="module" src="/assets/mathlive/unit6.mjs"></script></head>'))fail(`${page}: MathLive module missing`);
 if(!h.includes('<script defer src="/assets/ap-topic-practice.js"></script>'))fail(`${page}: practice driver not deferred`);
 const conf=JSON.parse(h.match(/window\.BM_TOPIC_PRACTICE=(\{.*?\});/)[1]);
 if(conf.slug!==slug||(conf.calculator||null)!==calc||conf.generatorVersion!=='12.9.C')fail(`${page}: page config ${JSON.stringify(conf)}`);
 const opts=[...(h.match(/<select id="u6Mode"[^>]*>(.*?)<\/select>/)||[,''])[1].matchAll(/value="([^"]+)"/g)].map(m=>m[1]);
 if(JSON.stringify(modes?opts:null)!==JSON.stringify(modes||(opts.length?opts:null)))fail(`${page}: Practice Types ${opts} (expected ${modes})`);
 if(!/generatorVersion:"12\.9\.C"/.test(h))fail(`${page}: analytics generator version`);
 if(calc&&!sitemap.includes(`/${U6}${page}/`))fail(`${page}: not in the sitemap`);
 if(calc==='calculator'&&!h.includes('calculator-active-note'))fail(`${page}: no calculator note`);if(calc!=='calculator'&&h.includes('calculator-active-note'))fail(`${page}: calculator note on a non-calculator page`);}
for(const page of ['area-below-and-between-curves/practice','volume-by-cross-sections/practice','solids-of-revolution/practice','comprehensive-review/assignment-practice']){
 const h=read(`${U6}${page}/index.html`);if(!/<meta http-equiv="refresh" content="0; url=\.\.\/">/.test(h)||!/name="robots" content="noindex"/.test(h)||/BM_TOPIC_PRACTICE/.test(h))fail(`${page}: not a redirect`);
 if(sitemap.includes(`/${U6}${page}/`))fail(`${page}: retired page still in the sitemap`);}
for(const [topic,links] of [['area-below-and-between-curves',['non-calculator-practice/','calculator-practice/']],['volume-by-cross-sections',['non-calculator-practice/','calculator-practice/']],['solids-of-revolution',['non-calculator-practice/','calculator-practice/']],['comprehensive-review',['non-calculator-practice/','calculator-practice/']],['finding-area-in-terms-of-y',['practice/']]]){
 const h=read(`${U6}${topic}/index.html`),row=(h.match(/<section class="resource-section" data-bm-topic-practice="1">.*?<\/section>/)||[''])[0],hrefs=[...row.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
 if(JSON.stringify(hrefs)!==JSON.stringify(links))fail(`${topic}: launch buttons ${hrefs}`);
 if(links.includes('calculator-practice/')&&!/calculator-practice\/"><span aria-hidden="true" class="bm-practice-icon bm-practice-icon-calculator">/.test(row))fail(`${topic}: calculator button without the calculator icon`);}
// Unit 5 Growth and Decay: Calculator Practice, calculator icon (labels only)
const gt=read('ap-calculus/unit-5-differential-equations/topics/exponential-growth-and-decay-interest-newton-s-law-of-cooling/index.html');
if(!/bm-practice-icon-calculator"><span class="bm-calculator-glyph"><\/span><\/span><span class="bm-practice-label">Exponential Growth and Decay, Interest, Newton's Law of Cooling Calculator Practice</.test(gt))fail('Growth and Decay topic page: not labeled Calculator Practice with the calculator icon');
const gp=read('ap-calculus/unit-5-differential-equations/topics/exponential-growth-and-decay-interest-newton-s-law-of-cooling/practice/index.html');
if(!/<h1 class="page-title">Exponential Growth and Decay, Interest, Newton's Law of Cooling Calculator Practice<\/h1>/.test(gp))fail('Growth and Decay practice page heading');

console.log(JSON.stringify({stats,errors:errors.length},null,1));
if(errors.length){console.log(errors.join('\n'));process.exitCode=1;}else console.log('Unit 6 QA: PASS');
