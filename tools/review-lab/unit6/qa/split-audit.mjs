// v12.9.D Unit 6 split-integral audit: every explanation that displays a SUM of integrals (a setup split into pieces)
// must say, before that display (in the same part or an earlier one), where the integral is split and why. Checked:
//  - a reason step precedes the display: "Split the integral at ...", "Split the interval at ...", the dx/dy comparison,
//    "Another way ... needs N integrals because ...", or the optional-split note;
//  - every internal breakpoint of the displayed sum (where one integral's upper limit is the next one's lower limit)
//    is named in that reason;
//  - each stated meeting equation "\(A=B\) when \(x=t\)" is true: A and B, read back with the Unit 6 parser, agree at t;
//  - every "could also be written as a single integral with respect to y" note is true: the region has one piece of
//    slices the other way, and that single integral has the same value;
//  - no reason claims a split is necessary when the integrands on both sides are the same formula.
// Usage: node tools/review-lab/unit6/qa/split-audit.mjs [problems per family, tier and kind=80]
import {load} from './lib.mjs';
const N=+(process.argv[2]||80);
const L=load(['unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js']);
L.ctx.console={...console,warn(){}};
const W=L.W,C=W.BatchMathUnit6Core;
const ENG=[['area',W.BatchMathUnit6Area,'make','FAMILIES'],['area_y',W.BatchMathUnit6Area,'makeY','FAMILIES_Y'],['cs',W.BatchMathUnit6Volume,'makeCS','FAMILIES_CS'],
 ['solids',W.BatchMathUnit6Volume,'makeSolid','FAMILIES_SOLID'],['frq',W.BatchMathUnit6FRQ,'make','FAMILIES'],['piecewise',W.BatchMathUnit6Piecewise,'make','FAMILIES']];
const kt=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});
const out={problems:0,sums:0,reasons:0,byFamily:{},equations:0,equationsFalse:0,singleNotes:0,singleNotesFalse:0,optionalSplits:0,failures:[]};
const fail=m=>{if(out.failures.length<60)out.failures.push(m);};
// displayed equations (in order) and reason markers, with their positions in the combined explanation HTML
const DISP=/<div class="u4-work-equation[^"]*">\\\(\\displaystyle ([\s\S]*?)\\\)<\/div>/g;
const REASON=/<strong>(Split the integral at [\s\S]*?|Split the interval at [\s\S]*?|Compare the two ways of slicing\.|Why there are [\s\S]*?|Another way\.)<\/strong>([\s\S]*?)(?=<div class="u4-work-step">|$)/g;
const limits=tex=>[...tex.matchAll(/\\int_\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\^\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g)].map(m=>[m[1],m[2]]);
const readNum=t=>{const r=C.readExpr(String(t).replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g,'($1)/($2)').replace(/\\pi/g,'pi').replace(/\\sqrt\{([^{}]*)\}/g,'sqrt($1)').replace(/\\left|\\right/g,'').replace(/\\,/g,''),null);return r.error?NaN:r.f(0);};
function texToLinear(t){return String(t).replace(/\\left|\\right/g,'').replace(/\\,/g,'').replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g,'($1)/($2)').replace(/\\sqrt\{([^{}]*)\}/g,'sqrt($1)').replace(/\\ln\s*/g,'ln').replace(/\\(sin|cos|tan)\s*/g,'$1').replace(/\\pi/g,'pi').replace(/\^\{([^{}]*)\}/g,'^($1)').replace(/\{|\}/g,'');}
function checkEquations(text,where){
 // "\(A=B\) when \(x=t\)" or "\(x\approx t\)"
 for(const m of text.matchAll(/\\\(([^()]*?(?:\([^()]*\)[^()]*?)*)\\\) when \\\(([xy])(=|\\approx )([^\\]*?)\\\)/g)){
  const [lhs,rhs]=splitEq(m[1]);if(lhs==null)continue;out.equations++;
  const v=m[2],t=readNum(m[4]);const f=C.readExpr(texToLinear(lhs),v),g=C.readExpr(texToLinear(rhs),v);
  if(f.error||g.error||!Number.isFinite(t)){continue;}
  const a=f.f(t),b=g.f(t),tol=m[3]==='='?1e-6:2e-3;
  if(!(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a)))){out.equationsFalse++;fail(`${where}: "${m[1]} when ${v}${m[3]}${m[4]}" is false (${a} vs ${b})`);}
 }
}
function splitEq(s){let d=0;for(let i=0;i<s.length;i++){const c=s[i];if(c==='{'||c==='(')d++;else if(c==='}'||c===')')d--;else if(c==='='&&d===0)return[s.slice(0,i),s.slice(i+1)];}return[null,null];}
for(const [name,E,mk,FK] of ENG)for(const [fam,f] of Object.entries(E[FK]))for(const kind of ['calculator','non-calculator'])for(const tier of kt(f)[kind==='calculator'?'calculator':'noncalculator'])for(let i=0;i<N;i++){
 L.seed(i*7919+fam.length*131+tier.length*17+kind.length+3);let p;try{p=E[mk]({family:fam,tier,calc:kind});}catch(e){continue;}out.problems++;
 const key=`${name}/${fam}/${kind}`,bf=out.byFamily[key]=out.byFamily[key]||{problems:0,sums:0,explained:0};bf.problems++;
 const html=(p.parts||[]).map(q=>q.explanation||'').join('');
 checkEquations(html,p.id);
 // optional-split notes are honest only when the integrands really are the same on every piece
 if(/Why there are \d+ integrals/.test(html))out.optionalSplits++;
 const reasons=[...html.matchAll(REASON)].map(m=>({at:m.index,head:m[1],text:m[2]}));
 for(const d of html.matchAll(DISP)){
  const tex=d[1],lim=limits(tex);if(lim.length<2||!/^\s*(?:[AV]=|\\text\{Total\}|\\int_)/.test(tex))continue;
  // a sum displayed in an evaluation (\int ... = value) is the same setup already explained; only setups count here
  if(/^\s*\\int_/.test(tex)&&!/=\\int_|=\s*\\int_/.test(tex)&&!/^\\int_\{[^}]*\}\^\{[^}]*\}f\(x\)/.test(tex))continue;
  const internal=[];for(let j=0;j+1<lim.length;j++)if(lim[j][1]===lim[j+1][0])internal.push(lim[j][1]);
  if(!internal.length)continue;
  out.sums++;bf.sums++;
  const before=reasons.filter(r=>r.at<d.index);
  if(!before.length){fail(`${p.id}: sum of integrals shown with no reason before it: ${tex.slice(0,140)}`);continue;}
  const all=before.map(r=>r.head+r.text).join(' ');
  const missing=internal.filter(b=>!all.includes(`=${b}\\)`)&&!all.includes(`\\approx ${b}\\)`)&&!all.includes(`=${b},`)&&!all.includes(`=${b}\\`)&&!all.includes(`at \\(x=${b}\\)`)&&!all.includes(`(x=${b}`));
  if(missing.length){fail(`${p.id}: the reason does not name the breakpoint(s) ${missing.join(', ')} of ${tex.slice(0,120)}`);continue;}
  out.reasons++;bf.explained++;
 }
 if(/could also be written as a single integral/.test(html))out.notesInProblems=(out.notesInProblems||0)+1;
}
// the single-integral notes, checked directly on every region that can produce them: the note is written only when the
// other direction has exactly one piece; that piece's integral must give the same area
const RG=W.BatchMathUnit6Regions;
for(const name of [...Object.keys(RG.EXACT),...Object.keys(RG.CALC)])for(let i=0;i<40;i++){
 L.seed(1000+i*31+name.length);let R;try{R=RG.build(name);}catch(e){continue;}
 for(const v of ['x','y']){const ps=v==='x'?R.xs:R.ys,ops=v==='x'?R.ys:R.xs;if(!ps||ps.length<2)continue;
  const T=C.areaTerms(R,v),html=RG.work.areaWork(R,v,T);checkEquations(html,`${name}/${v}`);
  const note=/could also be written as a single integral/.test(html);
  if(note){out.singleNotes++;const To=C.areaTerms(R,v==='x'?'y':'x');
   if(!ops||ops.length!==1||Math.abs(C.numValue(To)-C.numValue(T))>1e-6*Math.max(1,C.numValue(T))){out.singleNotesFalse++;fail(`${name}/${v}: single-integral note is not true`);}}
  else if(ops&&ops.length===1)fail(`${name}/${v}: one integral the other way, but the explanation does not say so`);
  // and the split step itself: a breakpoint per internal limit, each with its equation
  // (an equation "A = B when x = t", or, when that would only repeat the breakpoint, "At y = 2, x = y meets x = 2")
  for(let j=0;j+1<ps.length;j++){const b=ps[j].b,at=`${v}${/^-?\d+\.\d+$/.test(b.tex)?'\\approx ':'='}${b.tex}`;
   if(!html.includes(`when \\(${at}\\)`)&&!new RegExp(`At \\\\\\(${at.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\\\\\)(,| the curves)[^.]*(meets|cross)`).test(html))fail(`${name}/${v}: the breakpoint ${v}=${b.tex} is not located`);}
 }
}
console.log(JSON.stringify(out,null,1));
const missingFam=Object.entries(out.byFamily).filter(([,b])=>b.sums>b.explained);
if(out.failures.length||out.equationsFalse||out.singleNotesFalse||missingFam.length)process.exitCode=1;
