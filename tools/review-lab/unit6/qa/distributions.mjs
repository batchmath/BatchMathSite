// v12.9.B Unit 6 distributions: seeded draws from each page's default pool (All Problems) and from the reviews, with
// the shares the v12.9.B corrections ask for. Prints a JSON report; exits 1 when a share is outside its range.
// Usage: node tools/review-lab/unit6/qa/distributions.mjs [draws per pool=1500]
import {load} from './lib.mjs';
const N=+(process.argv[2]||1500);
const L=load(['unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js'],{});
const G=L.W.BatchMathAPTopicGenerators,REV=L.W.BatchMathUnit6Review;L.ctx.console={...console,warn(){}};
const out={},bad=[];
function draw(name,fn,keyOf){const c={};for(let i=0;i<N;i++){L.seed(i*7919+name.length*131);const p=fn();for(const k of [].concat(keyOf(p)).filter(Boolean))c[k]=(c[k]||0)+1;}
 const pct=Object.fromEntries(Object.entries(c).sort().map(([k,v])=>[k,+(100*v/N).toFixed(1)]));out[name]=pct;return pct;}
const within=(name,pct,key,lo,hi)=>{const v=pct[key]||0;if(v<lo||v>hi)bad.push(`${name}: ${key} ${v}% (expected ${lo}-${hi}%)`);};
const M=p=>p.unit5Meta;
// Area Below and Between Curves (non-calculator and calculator): families, direction tasks, setup-only, graphs
for(const calc of ['non-calculator','calculator']){
 const g=()=>G.get('area-below-and-between-curves')({calc});
 draw(`area ${calc}: families`,g,p=>M(p).family);
 const t=draw(`area ${calc}: direction tasks (area_directions / calc_directions)`,g,p=>['area_directions','calc_directions'].includes(M(p).family)?`task ${M(p).dir}`:null);
 for(const k of ['task x','task y','task either','task both'])if(!(k in t))bad.push(`area ${calc}: no ${k} problems`);
 draw(`area ${calc}: setup-only and graph in the question`,g,p=>[M(p).setupOnly?'setup only':null,/<svg/.test(p.questionHtml)?'graph shown':'no graph']);
}
draw('area non-calculator: Choosing dx or dy',()=>G.get('area-below-and-between-curves')({calc:'non-calculator',mode:'choose'}),p=>[`better ${M(p).best}`,M(p).graph?'graph shown':'no graph',`${p.parts.filter(q=>q.control==='choice').length} choice parts`]);
// Finding Area in Terms of y
draw('area in y: families',()=>G.get('finding-area-in-terms-of-y')({}),p=>M(p).family);
// Cross sections: direction about 50/50 on both pages; the graph toggle on non-calculator questions
for(const calc of ['non-calculator','calculator']){
 const d=draw(`cross sections ${calc}: direction`,()=>G.get('volume-by-cross-sections')({calc}),p=>`perpendicular to ${M(p).dir}`);
 within(`cross sections ${calc}`,d,'perpendicular to x',42,58);
 draw(`cross sections ${calc}: graph in the question`,()=>G.get('volume-by-cross-sections')({calc}),p=>/u6-graph-toggle/.test(p.questionHtml)?'Show Graph toggle':/<svg/.test(p.questionHtml)?'graph shown':'no graph');
}
// Solids: non-calculator graph about half the time; calculator axis kinds and the two-axis family
const sg=draw('solids non-calculator: graph in the question',()=>G.get('solids-of-revolution')({calc:'non-calculator'}),p=>/<svg/.test(p.questionHtml)?'graph shown':'no graph');
within('solids non-calculator',sg,'graph shown',42,58);
const sc=draw('solids calculator: graph in the question',()=>G.get('solids-of-revolution')({calc:'calculator'}),p=>/<svg|u6-graph-toggle/.test(p.questionHtml)?'graph shown':'no graph');
within('solids calculator',sc,'no graph',100,100);
draw('solids calculator: families',()=>G.get('solids-of-revolution')({calc:'calculator'}),p=>M(p).family);
const ax=draw('solids calculator: axis kinds (each rotation)',()=>G.get('solids-of-revolution')({calc:'calculator'}),p=>String(M(p).axisKind||'').split('; '));
for(const k of ['x_axis','y_axis','above','below','left','right','boundary'])if(!(k in ax))bad.push(`solids calculator: no ${k} axis`);
// Piecewise integrals and the reviews
draw('piecewise: families',()=>G.get('integrals-on-piecewise-defined-functions')({}),p=>M(p).family);
for(const calc of ['non-calculator','calculator'])draw(`review ${calc}: topics`,()=>REV.make({calc}),p=>p.unit6Review.reviewTopic);
console.log(JSON.stringify({draws:N,distributions:out,failures:bad},null,1));
if(bad.length)process.exitCode=1;
