// Independent check of the Slope Fields engine against the differential equation as displayed: the slope (or
// vertical segment) at every marked point, the reference solution curve (re-integrated here with a different
// method, the classical midpoint rule at a much finer step), and the typed analysis answers: slope at a point,
// the curve of horizontal segments, equilibrium solutions, y-intervals where solutions increase, and d²y/dx²
// (by numerical differentiation of the parsed equation, y'' = f_x + f_y·f).
// Usage: node tools/review-lab/unit5/qa/verify-slope.mjs [N]
import {load,keypadForm} from './lib.mjs';
const N=+(process.argv[2]||1500);const L=load(['unit5-slope-fields.js']),gen=L.G.get('slope-fields'),A=L.A;
// the checker's expression parser has one variable plus the constant C, which plays the role of y here
const fn=tex=>{const tree=A.parse(keypadForm(tex).replace(/y/g,'C'),'x');return(x,y)=>A.value(tree,x,y);};
let checked=0;const bad=[];const tally={};const t=k=>tally[k]=(tally[k]||0)+1;
const f2=(f)=>(x,y)=>{try{return f(x,y);}catch(e){return NaN;}};
for(let i=1;i<=N;i++){L.seed(i*911);const p=gen({});const eq=p.questionHtml.match(/\\frac\{dy\}\{dx\}=(.*?)\\\)<\/div>/);if(!eq){t('no displayed equation (figure-only matching)');continue;}
 let f;try{f=f2(fn(eq[1]));}catch(e){bad.push(`${p.id}: cannot parse ${eq[1]}`);continue;}
 for(const part of p.parts){
  if(part.control==='slope-segments'){for(const tg of part.board.targets){const v=f(tg.x,tg.y);checked++;t('segment targets');
    if(tg.vertical){if(Number.isFinite(v))bad.push(`${p.id}: (${tg.x},${tg.y}) marked vertical but the equation gives ${v}`);}
    else if(!(Math.abs(v-tg.slope)<1e-9))bad.push(`${p.id}: slope at (${tg.x},${tg.y}) ${tg.slope} vs ${v}`);}}
  else if(part.control==='solution-curve'){const ref=part.board.ref,[x0,y0]=part.board.ic;t('reference curves');checked++;
   // midpoint rule with step 1e-4 from the initial point to each reference x, compared at a few reference points
   const at=xt=>{let x=x0,y=y0;const h=(xt>x0?1:-1)*1e-4;const n=Math.round(Math.abs(xt-x0)/1e-4);for(let k=0;k<n;k++){const k1=f(x,y),k2=f(x+h/2,y+h/2*k1);y+=h*k2;x+=h;}return y;};
   for(const pt of [ref[Math.floor(ref.length*0.15)],ref[Math.floor(ref.length*0.5)],ref[Math.floor(ref.length*0.85)]]){const yy=at(pt[0]);if(Math.abs(yy-pt[1])>2e-3*Math.max(1,Math.abs(pt[1])))bad.push(`${p.id}: reference curve at x=${pt[0].toFixed(3)} is ${pt[1].toFixed(5)}, independent ${yy.toFixed(5)}`);}}
  else if(part.answer){const a=part.answer,pr=part.prompt;checked++;
   if(/Find the slope of the segment at/.test(pr)){const m=pr.match(/\\left\((-?\d+),\\,(-?\d+)\\right\)/);const v=f(+m[1],+m[2]);t('slope at a point');if(!(Math.abs(v-a.value)<1e-9))bad.push(`${p.id}: slope ${a.value} vs ${v}`);}
   else if(/horizontal exactly along one curve/.test(pr)){const g=A.parse(a.expression,'x');t('horizontal-segment curve');for(const x of [-2.3,-0.7,0.4,1.9]){const v=f(x,A.value(g,x));if(Math.abs(v)>1e-9)bad.push(`${p.id}: slope on y=${a.expression} at x=${x} is ${v}`);}
    // and nowhere else on a sample grid
    for(let x=-3;x<=3;x+=0.5)for(let y=-3;y<=3;y+=0.5)if(Math.abs(f(x,y))<1e-12&&Math.abs(y-A.value(g,x))>1e-9)bad.push(`${p.id}: also horizontal at (${x},${y})`);}
   else if(/constant solution/.test(pr)){t('equilibrium solutions');const zs=[];for(let y=-6;y<=6;y+=0.25)if(Math.abs(f(0.3,y))<1e-12&&Math.abs(f(-1.7,y))<1e-12)zs.push(y);
    const want=[...a.values].map(Number).sort((u,v)=>u-v);if(zs.length!==want.length||zs.some((z,k)=>Math.abs(z-want[k])>1e-9))bad.push(`${p.id}: equilibria ${want} vs ${zs}`);}
   else if(/solution curves increasing/.test(pr)){t('increasing y-intervals');const parts=a.parts.map(q=>[q.left==='-infinity'?-Infinity:+q.left,q.right==='infinity'?Infinity:+q.right]);
    for(let y=-8;y<=8;y+=0.137){const inside=parts.some(([l,r])=>y>l&&y<r);if(inside!==(f(0.5,y)>0))bad.push(`${p.id}: at y=${y.toFixed(3)} f=${f(0.5,y)} but interval says ${inside}`);}}
   else if(/d\^\{2\}y/.test(pr)){t('second derivative');const m=pr.match(/\\left\((-?\d+),\\,(-?\d+)\\right\)/);const x=+m[1],y=+m[2],h=1e-5;
    const fx=(f(x+h,y)-f(x-h,y))/(2*h),fy=(f(x,y+h)-f(x,y-h))/(2*h),d2=fx+fy*f(x,y);if(!(Math.abs(d2-a.value)<1e-5*Math.max(1,Math.abs(d2))))bad.push(`${p.id}: y'' ${a.value} vs ${d2}`);}
   else if(/slopes undefined/.test(pr)){t('undefined-slope line');for(const x of [-2.5,0.5,1.5,2.5])if(Number.isFinite(f(x,a.value)))bad.push(`${p.id}: slope defined at (${x},${a.value})`);}
   else t('other typed answer');}
  else if(part.control==='svg-choice'||part.control==='choice'){t('matching (distinctness checked in the engine)');}}}
console.log(`problems ${N}; items checked independently ${checked}; disagreements ${bad.length}`);console.log(JSON.stringify(tally));console.log(bad.slice(0,15).join('\n'));process.exitCode=bad.length?1:0;
