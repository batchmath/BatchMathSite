// Slope-field grading QA (no browser): synthetic correct, imperfect and wrong drawings for every generated
// drawing problem, plus targeted edge cases (180° reversal, near-horizontal and near-vertical slopes, undefined
// slopes, wrong branch, missed initial point, short curves, curves that cross the field).
// Usage: node tools/review-lab/unit5/qa/slope-qa.mjs [N]
import {load} from './lib.mjs';
const N=+(process.argv[2]||600);const L=load(['unit5-slope-fields.js']),S=L.W.BatchMathUnit5Slope,gen=L.G.get('slope-fields');
let rnd=12345;const rand=()=>{rnd=(rnd*1103515245+12345)%2147483648;return rnd/2147483648;};const gauss=()=>{let u=0,v=0;while(!u)u=rand();while(!v)v=rand();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
const tally={};const t=(k,ok)=>{tally[k]=tally[k]||{pass:0,fail:0};tally[k][ok?'pass':'fail']++;};
const want=x=>x.vertical?90:S.angleOf(x.slope);
for(let i=1;i<=N;i++){L.seed(i*271);const p=gen({mode:i%2?'draw_segments':'draw_curve'});const part=p.parts[0];
 if(part.control==='slope-segments'){const T=part.board.targets;
  t('segments exact → accepted',S.gradeSegments(T,T.map(want)).ok);
  t('segments reversed 180° → accepted',S.gradeSegments(T,T.map(x=>(want(x)+180)%180+180)).ok);
  t('segments hand error ≤ 8° → accepted',S.gradeSegments(T,T.map(x=>want(x)+(rand()*16-8))).ok);
  t('segments one off by 20° → rejected',!S.gradeSegments(T,T.map((x,k)=>want(x)+(k===0?20:0))).ok);
  t('segments one missing → rejected',!S.gradeSegments(T,T.map((x,k)=>k===0?null:want(x))).ok);
  t('segments negated slopes → rejected',!S.gradeSegments(T,T.map(x=>x.vertical?90:S.angleOf(-x.slope))).ok||T.every(x=>x.vertical||x.slope===0));
  if(T.some(x=>x.vertical))t('vertical targets drawn horizontal → rejected',!S.gradeSegments(T,T.map(x=>x.vertical?0:want(x))).ok);
 }else{const o=S.ODES[part.board.ode],ref=part.board.ref,ic=part.board.ic;
  t('curve = reference → accepted',S.gradeCurve(ref,ref,ic,o).ok);
  // a hand-drawn version: sampled every 0.15 units with smooth wobble (≤ 0.08) and jitter (σ = 0.03)
  const ph=rand()*6;const hand=ref.filter((_,k)=>k%6===0).map(([x,y])=>[x+0.02*gauss(),y+0.07*Math.sin(3*x+ph)+0.03*gauss()]);
  t('curve hand-drawn wobble → accepted',S.gradeCurve(hand,ref,ic,o).ok);
  t('curve shifted up 0.6 → rejected',!S.gradeCurve(ref.map(([x,y])=>[x,y+0.6]),ref,ic,o).ok);
  t('curve starting 0.5 away from the point → rejected',!S.gradeCurve(ref.filter(([x])=>x>ic[0]+0.5),ref,ic,o).ok);
  const half=ref.filter(([x])=>x>=ic[0]);if(ic[0]-Math.min(...ref.map(q=>q[0]))>=0.75)t('curve drawn on one side only → rejected',!S.gradeCurve(half,ref,ic,o).ok);
  const sl=o.f(...ic),line=[];for(let x=-3;x<=3;x+=0.05){const y=ic[1]+(sl+1.5)*(x-ic[0]);if(Math.abs(y)<=3)line.push([x,y]);}
  t('straight line with the wrong slope → rejected',!S.gradeCurve(line,ref,ic,o).ok);
  if(o.id==='-x/y'){const other=ref.map(([x,y])=>[x,-y]);t('semicircle on the wrong branch → rejected',!S.gradeCurve(other,ref,ic,o).ok);}
 }}
// targeted angle cases
const one=(slope,vertical,drawn)=>S.gradeSegments([{x:0,y:0,slope,vertical}],[drawn]).ok;
const cases=[['slope 0 drawn at 10°',one(0,false,10),true],['slope 0 drawn at 170° (−10°)',one(0,false,170),true],['slope 1/4 drawn horizontal',one(0.25,false,0),false],['slope 1/2 drawn at slope 1/4',one(0.5,false,S.angleOf(0.25)),false],
 ['slope −1 drawn as slope 1',one(-1,false,45),false],['slope 6 drawn vertical',one(6,false,90),true],['slope 3 drawn vertical',one(3,false,90),false],['undefined drawn at 85°',one(null,true,85),true],['undefined drawn at 95°',one(null,true,95),true],['undefined drawn as slope 3',one(null,true,S.angleOf(3)),false]];
for(const [k,got,exp] of cases)t(`case: ${k} → ${exp?'accepted':'rejected'}`,got===exp);
let failures=0;for(const [k,v] of Object.entries(tally)){console.log(`${v.fail?'FAIL':'ok  '}  ${k}: ${v.pass} passed${v.fail?`, ${v.fail} failed`:''}`);failures+=v.fail;}
process.exitCode=failures?1:0;
