#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let seed=330910;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const box={window:{BatchMathRNG:{random}}};
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(root,'assets/im1-unit2-generators.js'),'utf8'),box);
const gen=box.window.BatchMathIM1Unit2Generators;
const modes=['plot_point','domain','range','increasing','decreasing','constant','x_intercepts','y_intercept','absolute_max','absolute_min'];
const inner=s=>{const match=String(s).match(/\\\(([\s\S]*?)\\\)/);return match?.[1]||'';};

const shapes=new Set(),families=new Set(),normalized=new Set(),vertexCounts=new Set();let openEndpointDistractors=0,highlightedClosedEndpoints=0;
const endCounts={open:0,closed:0,infinite:0,bothInfinite:0,positiveInfinity:0,negativeInfinity:0};
for(let i=0;i<30000;i++){
 const p=gen.get('coordinate-system-nine-key-features')({mode:'mixed'});
 families.add(p.variant);
 assert.equal(p.choices.length,4);
 assert.equal(new Set(p.choices).size,4);
 assert(p.correctIndex>=0&&p.correctIndex<4);
 assert(!/cannot be determined|none of these/i.test(p.choices.join(' ')));
 if(p.graph.dot)continue;
 const pts=p.graph.points,xs=pts.map(a=>a[0]),ys=pts.map(a=>a[1]);
 assert(xs.every((x,j)=>j===0||x>xs[j-1]));
 assert(xs.includes(0));
 assert(pts.every(([x,y])=>Number.isInteger(x)&&Number.isInteger(y)&&Math.abs(x)<=5&&Math.abs(y)<=4));
 shapes.add(p.graph.shape);vertexCounts.add(pts.length);
 normalized.add(JSON.stringify({shape:pts.map(([x,y])=>[x-xs[0],y-ys[0]]),left:p.graph.leftEnd,right:p.graph.rightEnd,leftInf:p.graph.leftInfinity,rightInf:p.graph.rightInfinity}));
 for(const side of ['leftEnd','rightEnd'])endCounts[p.graph[side]]++;
 if(p.graph.leftEnd==='infinite'&&p.graph.rightEnd==='infinite')endCounts.bothInfinite++;
 for(const side of ['leftInfinity','rightInfinity']){if(p.graph[side]>0)endCounts.positiveInfinity++;if(p.graph[side]<0)endCounts.negativeInfinity++;}
 if(p.graph.leftEnd==='infinite'||p.graph.rightEnd==='infinite')assert(p.q.includes('marker-end="url(#bm-graph-arrow)"'));
 if(p.graph.leftEnd==='open'||p.graph.rightEnd==='open')assert(p.q.includes('fill="#050505"'));
 const answer=p.choices[p.correctIndex];
 if(p.variant==='domain')assert.equal(inner(answer),p.graph.domain);
 if(p.variant==='range')assert.equal(inner(answer),p.graph.range);
 if(p.variant==='y_intercept')assert(inner(answer).includes(`0, ${ys[xs.indexOf(0)]}`));
 if(['increasing','decreasing','constant'].includes(p.variant)){
  const left=xs[0],right=xs.at(-1),touches=x=>p.correctIntervals.some(([a,b])=>x>=a&&x<=b),bound=x=>Number.isFinite(x)?String(x):x<0?'-\\infty':'\\infty';
  const touchesOpen=p.graph.leftEnd==='open'&&touches(left)||p.graph.rightEnd==='open'&&touches(right);
  if(touchesOpen){const allBracket=p.correctIntervals.map(([a,b])=>`\\(${Number.isFinite(a)?'[':'('}${bound(a)}, ${bound(b)}${Number.isFinite(b)?']':')'}\\)`).join(' and ');assert(p.choices.includes(allBracket));assert.equal(p.allBracketDistractor,allBracket);openEndpointDistractors++;}
  const expectedYellow=[];if(p.graph.leftEnd==='closed'&&touches(left))expectedYellow.push(0);if(p.graph.rightEnd==='closed'&&touches(right))expectedYellow.push(pts.length-1);
  for(const j of expectedYellow){const [x,y]=pts[j],marker=`<circle cx="${250+x*31}" cy="${190-y*31}" r="6" fill="#f5c400" stroke="#f5c400" stroke-width="3"/>`;assert(p.graph.correctIntervalGraph.includes(marker));highlightedClosedEndpoints++;}
 }
 if(p.variant==='x_intercepts'){
  const zeros=pts.filter(([,y])=>y===0);
  assert.equal((answer.match(/\\\(/g)||[]).length,zeros.length);
  assert(ys.every((y,j)=>j===0||y===0||ys[j-1]===0||Math.sign(y)===Math.sign(ys[j-1])));
 }
 if(p.variant==='absolute_max'){
  const unbounded=p.graph.leftInfinity>0||p.graph.rightInfinity>0;
  const hi=Math.max(...ys),attained=ys.some((y,j)=>y===hi&&(j>0&&j<ys.length-1||j===0&&p.graph.leftEnd!=='open'||j===ys.length-1&&p.graph.rightEnd!=='open'))||ys.some((y,j)=>j&&y===hi&&ys[j-1]===y);
  assert.equal(answer==='Does not exist',unbounded||!attained);
 }
 if(p.variant==='absolute_min'){
  const unbounded=p.graph.leftInfinity<0||p.graph.rightInfinity<0;
  const lo=Math.min(...ys),attained=ys.some((y,j)=>y===lo&&(j>0&&j<ys.length-1||j===0&&p.graph.leftEnd!=='open'||j===ys.length-1&&p.graph.rightEnd!=='open'))||ys.some((y,j)=>j&&y===lo&&ys[j-1]===y);
  assert.equal(answer==='Does not exist',unbounded||!attained);
 }
 assert(!/unbounded|attained|finite boundary|excluded finite endpoint/i.test(String(p.explain||'')));
}

assert.equal(families.size,9);assert(!families.has('plot_point'));assert.equal(shapes.size,6);assert.equal(vertexCounts.size,4);assert(normalized.size>12000);
for(const key of ['open','closed','infinite','bothInfinite','positiveInfinity','negativeInfinity'])assert(endCounts[key]>500,`${key}: ${endCounts[key]}`);
assert(openEndpointDistractors>500,`open-endpoint all-bracket distractors: ${openEndpointDistractors}`);assert(highlightedClosedEndpoints>500,`highlighted closed endpoints: ${highlightedClosedEndpoints}`);

const fixedCounts={};
for(const mode of modes){
 fixedCounts[mode]=0;
 for(let i=0;i<800;i++){
  const p=gen.get('coordinate-system-nine-key-features')({mode});
  assert.equal(p.variant,mode);fixedCounts[mode]++;
 }
}

let reviewGraphs=0;
for(let i=0;i<5000;i++){const p=gen.get('comprehensive-review')();if(p.graph)reviewGraphs++;}
assert(reviewGraphs>500);

const page=fs.readFileSync(path.join(root,'im1/unit-2-algebraic-operations-equations-inequalities/topics/coordinate-system-nine-key-features/practice/index.html'),'utf8');
assert(page.includes('id="featureMode"'));
assert(page.includes('<option value="mixed" selected>'));
for(const mode of modes)assert(page.includes(`value="${mode}"`));
assert(page.includes('modeElementId:"featureMode"'));
const controller=fs.readFileSync(path.join(root,'assets/im1-unit2-practice.js'),'utf8');
assert(controller.includes("{mode:$(cfg.modeElementId)?.value||'mixed'}"));
assert(controller.includes("addEventListener('change'"));

const report={ok:true,checked:30000,families:[...families],shapes:[...shapes],vertexCounts:[...vertexCounts],distinctGraphsIgnoringTranslation:normalized.size,endCounts,openEndpointDistractors,highlightedClosedEndpoints,fixedCounts,reviewGraphs};
fs.mkdirSync(path.join(root,'qa-results'),{recursive:true});
fs.writeFileSync(path.join(root,'qa-results/coordinate-variety-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(report);
