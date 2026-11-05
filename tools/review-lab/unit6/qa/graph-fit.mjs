// v12.9.C Unit 6 graph fit: every figure in every Unit 6 problem (question and explanations), from every engine,
// family and tier, read from the SVG the page receives. Relevant geometry must lie inside the frame with a margin:
//   shaded regions (their outlines include the intersections and the extremes of each boundary on the region),
//   marked points, slice and radius end points, axes of rotation, and the graph of f in Graph Analysis problems.
// Curves that continue past the region may run off the frame. Also: no tick labelled 0, tick labels inside the frame.
// Usage: node tools/review-lab/unit6/qa/graph-fit.mjs [problems per family and tier=120] [margin fraction=0.025]
import {load} from './lib.mjs';
const N=+(process.argv[2]||120),MF=+(process.argv[3]||0.025);
const L=load(['unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js']);
L.ctx.console={...console,warn(){}};
const W=L.W,ENG=[['area',W.BatchMathUnit6Area,'make','FAMILIES'],['area_y',W.BatchMathUnit6Area,'makeY','FAMILIES_Y'],['cs',W.BatchMathUnit6Volume,'makeCS','FAMILIES_CS'],
 ['solids',W.BatchMathUnit6Volume,'makeSolid','FAMILIES_SOLID'],['frq',W.BatchMathUnit6FRQ,'make','FAMILIES']];
const kt=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});
const nums=s=>(s.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
function figuresOf(html){return [...String(html||'').matchAll(/<svg viewBox="0 0 ([\d.]+) ([\d.]+)"[^>]*class="(u6-svg)"[^>]*>([\s\S]*?)<\/svg>/g)].map(m=>({W:+m[1],H:+m[2],body:m[4]}));}
function check(fig){
 const bad=[],mx=MF*fig.W,my=MF*fig.H,inside=(x,y,what)=>{if(!(x>=mx-1e-6&&x<=fig.W-mx+1e-6&&y>=my-1e-6&&y<=fig.H-my+1e-6))bad.push(`${what} at (${x.toFixed(1)}, ${y.toFixed(1)}) outside ${fig.W}x${fig.H} less ${mx.toFixed(1)}/${my.toFixed(1)}`);};
 let worst=Infinity;const track=(x,y)=>{worst=Math.min(worst,x/fig.W,(fig.W-x)/fig.W,y/fig.H,(fig.H-y)/fig.H);};
 for(const m of fig.body.matchAll(/<polygon points="([^"]+)" class="u6-shade"\/>/g))for(const pt of m[1].trim().split(/\s+/)){const [x,y]=pt.split(',').map(Number);inside(x,y,'shaded region');track(x,y);}
 for(const m of fig.body.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="[\d.]+" class="(u6-mark|u6-slice-end|u6-axis-pt|u6-radius-end)"\/>/g)){inside(+m[1],+m[2],m[3]);track(+m[1],+m[2]);}
 for(const m of fig.body.matchAll(/<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)" class="(u6-slice|u6-radius-r)"\/>/g)){inside(+m[1],+m[2],m[5]);inside(+m[3],+m[4],m[5]);}
 for(const m of fig.body.matchAll(/<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)" class="u6-rot"\/>/g)){const [x1,y1,x2,y2]=[+m[1],+m[2],+m[3],+m[4]];if(y1===y2&&!(y1>=my&&y1<=fig.H-my))bad.push(`axis of rotation y at ${y1}`);if(x1===x2&&!(x1>=mx&&x1<=fig.W-mx))bad.push(`axis of rotation x at ${x1}`);}
 for(const m of fig.body.matchAll(/<path d="([^"]+)" class="u6-curve u6-graph-f"\/>/g)){const v=nums(m[1]);for(let i=0;i+1<v.length;i+=2){inside(v[i],v[i+1],'graph of f');track(v[i],v[i+1]);}}
 for(const m of fig.body.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)" class="u6-tick[^"]*">([^<]*)<\/text>/g)){if(m[3].trim()==='0')bad.push('a tick labelled 0');if(+m[1]<0||+m[1]>fig.W||+m[2]<0||+m[2]>fig.H)bad.push(`tick ${m[3]} outside`);}
 return{bad,worst};
}
const out={figures:0,problems:0,byFamily:{},failures:[],tightest:[]};
for(const [name,E,mk,FK] of ENG)for(const [fam,f] of Object.entries(E[FK]))for(const kind of ['calculator','non-calculator'])for(const tier of kt(f)[kind==='calculator'?'calculator':'noncalculator'])for(let i=0;i<N;i++){
 L.seed(i*7919+fam.length*131+tier.length*17+kind.length);let p;try{p=E[mk]({family:fam,tier,calc:kind});}catch(e){continue;}out.problems++;
 const places=[['question',p.questionHtml],...p.parts.map((q,j)=>[`part ${j+1} explanation`,q.explanation]),...p.parts.map((q,j)=>[`part ${j+1} prompt`,q.prompt])];
 const key=`${name}/${fam}/${kind}`;out.byFamily[key]=out.byFamily[key]||{figures:0,failures:0,tightest:1};
 for(const [where,html] of places)for(const fig of figuresOf(html)){out.figures++;out.byFamily[key].figures++;const r=check(fig);out.byFamily[key].tightest=Math.min(out.byFamily[key].tightest,+r.worst.toFixed(3));
  if(r.bad.length){out.byFamily[key].failures++;if(out.failures.length<40)out.failures.push(`${p.id} [${where}] ${r.bad[0]}${r.bad.length>1?` (+${r.bad.length-1} more)`:''}`);}}
}
// the reported case: y = x^3 - 4x + 3 and y = -x^3 + 4x + 3 (two lobes; the extremes are 3 ± 16/(3√3) ≈ 3 ± 3.079)
{const want='y=x^{3} - 4x + 3|y=-x^{3} + 4x + 3';let hit=null;
 for(let s=1;s<20000&&!hit;s++){L.seed(s);const p=W.BatchMathUnit6Area.make({family:'between_enclosed',tier:'intermediate',calc:'non-calculator'});if(p.id.includes(want))hit=p;}
 const figs=hit?[hit.questionHtml,...hit.parts.map(q=>q.explanation)].flatMap(figuresOf):[];
 out.reportedCase={found:!!hit,id:hit?.id,figures:figs.length,failures:figs.map(check).flatMap(r=>r.bad).length,tightestMargin:figs.length?Math.min(...figs.map(f=>check(f).worst)).toFixed(3):null};
 if(!hit||!figs.length||out.reportedCase.failures)out.failures.push('reported cubic case: '+JSON.stringify(out.reportedCase));}
out.failureCount=Object.values(out.byFamily).reduce((a,b)=>a+b.failures,0)+(out.reportedCase.failures||!out.reportedCase.found?1:0);
console.log(JSON.stringify(out,null,1));if(out.failureCount)process.exitCode=1;
