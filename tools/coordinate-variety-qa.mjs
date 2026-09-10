#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let seed=330910;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const b={window:{BatchMathRNG:{random}}};vm.createContext(b);vm.runInContext(fs.readFileSync(path.join(root,'assets/im1-unit2-generators.js'),'utf8'),b);const gen=b.window.BatchMathIM1Unit2Generators;
const m=s=>[...s.matchAll(/\\\(([\s\S]*?)\\\)/g)].map(x=>x[1]);
const pairs=s=>m(s).map(t=>{const a=t.match(/^[[(](-?\d+),\s*(-?\d+)[)\]]$/);assert(a,t);return [+a[1],+a[2]];});
const eq=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
const shapes=new Set(),families=new Set(),normalized=new Set(),counts=new Set(),samples=[];
for(let i=0;i<25000;i++){
 const p=gen.get('coordinate-system-nine-key-features')();families.add(p.variant);assert.equal(p.choices.length,4);assert.equal(new Set(p.choices).size,4);assert(!/cannot be determined|none of these/i.test(p.choices.join('')));assert(m(p.choices.join(' ')+p.explain).every(t=>!t.includes('and')&&!t.includes('or')));
 const answer=p.choices[p.correctIndex];
 if(p.graph.dot){eq(pairs(answer)[0],p.graph.dot);continue;}
 const pts=p.graph.points,xs=pts.map(a=>a[0]),ys=pts.map(a=>a[1]);shapes.add(p.graph.shape);counts.add(pts.length);normalized.add(JSON.stringify(pts.map(([x,y])=>[x-xs[0],y-ys[0]])));
 assert(xs.every((x,i)=>i===0||x>xs[i-1]));assert(xs.includes(0));assert(pts.every(([x,y])=>Number.isInteger(x)&&Number.isInteger(y)&&Math.abs(x)<=5&&Math.abs(y)<=4));
 if(samples.length<6&&!samples.some(q=>q.graph.shape===p.graph.shape))samples.push(p);
 const lo=Math.min(...ys),hi=Math.max(...ys);
 if(p.variant==='domain')eq(pairs(answer),[[xs[0],xs.at(-1)]]);
 if(p.variant==='range')eq(pairs(answer),[[lo,hi]]);
 if(p.variant==='absolute_max')assert(Number(m(answer)[0])===hi);
 if(p.variant==='absolute_min')assert(Number(m(answer)[0])===lo);
 if(p.variant==='y_intercept')eq(pairs(answer),[[0,ys[xs.indexOf(0)]]]);
 if(['increasing','decreasing','constant'].includes(p.variant)){
  const d={increasing:1,decreasing:-1,constant:0}[p.variant],intervals=pairs(answer);assert(intervals.length);
  for(let j=0;j<pts.length-1;j++){const midpoint=(xs[j]+xs[j+1])/2;assert.equal(intervals.some(([a,b])=>midpoint>a&&midpoint<b),Math.sign(ys[j+1]-ys[j])===d);}
  for(let j=1;j<intervals.length;j++)assert(intervals[j][0]>intervals[j-1][1]);
 }
 if(p.variant==='x_intercepts'){
  for(let j=0;j<pts.length-1;j++){assert(ys[j]*ys[j+1]>=0);assert(ys[j]!==0||ys[j+1]!==0);}
  eq(pairs(answer),pts.filter(a=>a[1]===0));
 }
}
assert.equal(families.size,10);assert.equal(shapes.size,6);assert.equal(counts.size,4);assert(normalized.size>10000);
for(let i=0;i<4000;i++){const p=gen.get('graphing-inequalities-interval-notation')();for(const c of p.choices){assert(!/^[[(]/.test(c));if(c.includes('infty'))assert(m(c).length);}}
let review=0;for(let i=0;i<5000;i++){const p=gen.get('comprehensive-review')();if(p.graph)review++;}assert(review>500);
const report={ok:true,checked:25000,families:[...families],shapes:[...shapes],vertexCounts:[...counts],distinctGraphsIgnoringTranslation:normalized.size,intervalChoiceChecks:4000,reviewGraphs:review,browser:'not run'};
fs.writeFileSync(path.join(root,'qa-results/coordinate-variety-qa.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync('/tmp/coordinate-samples.json',JSON.stringify(samples));console.log(report);
