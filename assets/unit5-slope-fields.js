/* BatchMath v12.8.X — Unit 5 engine 3: Slope Fields.
   Families (mixed mode): draw slope segments at marked points 25%, draw the solution curve through an initial
   point 25%, match fields / equations / solution curves 25%, analyze slopes and solution behavior 25%.
   Drawing is graded mathematically, never by pixels: a segment by the angle of its direction (a segment and its
   180° reversal are the same), a curve by its distance from an RK4 reference solution, the point it starts from,
   agreement with the field's direction along the way, and how much of the solution it covers. After a drawing is
   checked, the model segments or curve are overlaid on the same grid in a contrasting, labeled style; nothing
   is shown before submission. Multiple choice is used only for matching representations. */
(function(){
'use strict';
const U=window.BatchMathUnit5Core;
if(!U)return;
const {Q,qv,qtex,qadd,qmul,qsub,qneg,qdiv,qzero,pick,ri,shuffle,step,m,question,problem}=U;

// ---------- the differential equations ----------
// f: numeric slope; q: exact slope at integer (or half-integer) points as a rational, or null where undefined;
// num: numerator for deciding vertical (nonzero numerator over zero) versus indeterminate 0/0 points.
const R=(n,d=1)=>Q(n,d);
const ODE=(id,tex,f,q,o={})=>({id,tex,f,q,...o});
const ODES={
 'x+y':ODE('x+y','x+y',(x,y)=>x+y,(x,y)=>R(x+y),{d2:(x,y)=>R(1+x+y),d2tex:'1+\\frac{dy}{dx}=1+x+y',zero:{tex:'-x',expr:'-x'}}),
 'x-y':ODE('x-y','x-y',(x,y)=>x-y,(x,y)=>R(x-y),{d2:(x,y)=>R(1-x+y),d2tex:'1-\\frac{dy}{dx}=1-(x-y)',zero:{tex:'x',expr:'x'}}),
 'y-x':ODE('y-x','y-x',(x,y)=>y-x,(x,y)=>R(y-x),{d2:(x,y)=>R(y-x-1),d2tex:'\\frac{dy}{dx}-1=(y-x)-1',zero:{tex:'x',expr:'x'}}),
 '2x-y':ODE('2x-y','2x-y',(x,y)=>2*x-y,(x,y)=>R(2*x-y),{d2:(x,y)=>R(2-2*x+y),d2tex:'2-\\frac{dy}{dx}=2-(2x-y)',zero:{tex:'2x',expr:'2*x'}}),
 'x+2y':ODE('x+2y','x+2y',(x,y)=>x+2*y,(x,y)=>R(x+2*y),{d2:(x,y)=>R(1+2*(x+2*y)),d2tex:'1+2\\frac{dy}{dx}=1+2(x+2y)',zero:{tex:'-\\frac{x}{2}',expr:'-x/2'}}),
 'x^2-y':ODE('x^2-y','x^{2}-y',(x,y)=>x*x-y,(x,y)=>R(x*x-y),{d2:(x,y)=>R(2*x-x*x+y),d2tex:'2x-\\frac{dy}{dx}=2x-(x^{2}-y)',zero:{tex:'x^{2}',expr:'x^2'}}),
 'x':ODE('x','x',(x)=>x,(x)=>R(x)),
 '-x':ODE('-x','-x',(x)=>-x,(x)=>R(-x)),
 '2x':ODE('2x','2x',(x)=>2*x,(x)=>R(2*x)),
 'y':ODE('y','y',(x,y)=>y,(x,y)=>R(y),{auto:true,equil:[0],up:[[0,Infinity]],d2:(x,y)=>R(y),d2tex:'\\frac{dy}{dx}=y'}),
 '-y':ODE('-y','-y',(x,y)=>-y,(x,y)=>R(-y),{auto:true,equil:[0],up:[[-Infinity,0]],d2:(x,y)=>R(y),d2tex:'-\\frac{dy}{dx}=-(-y)=y'}),
 'y-1':ODE('y-1','y-1',(x,y)=>y-1,(x,y)=>R(y-1),{auto:true,equil:[1],up:[[1,Infinity]],d2:(x,y)=>R(y-1),d2tex:'\\frac{dy}{dx}=y-1'}),
 '1-y':ODE('1-y','1-y',(x,y)=>1-y,(x,y)=>R(1-y),{auto:true,equil:[1],up:[[-Infinity,1]],d2:(x,y)=>R(y-1),d2tex:'-\\frac{dy}{dx}=-(1-y)=y-1'}),
 'y(2-y)':ODE('y(2-y)','y(2-y)',(x,y)=>y*(2-y),(x,y)=>R(y*(2-y)),{auto:true,equil:[0,2],up:[[0,2]],d2:(x,y)=>R((2-2*y)*y*(2-y)),d2tex:'(2-2y)\\frac{dy}{dx}=(2-2y)\\,y(2-y)'}),
 '(y-1)(y+2)':ODE('(y-1)(y+2)','(y-1)(y+2)',(x,y)=>(y-1)*(y+2),(x,y)=>R((y-1)*(y+2)),{auto:true,equil:[-2,1],up:[[-Infinity,-2],[1,Infinity]]}),
 'xy':ODE('xy','xy',(x,y)=>x*y,(x,y)=>R(x*y),{d2:(x,y)=>R(y+x*x*y),d2tex:'y+x\\frac{dy}{dx}=y+x(xy)'}),
 '-xy':ODE('-xy','-xy',(x,y)=>-x*y,(x,y)=>R(-x*y),{d2:(x,y)=>R(-y+x*x*y),d2tex:'-y-x\\frac{dy}{dx}=-y-x(-xy)'}),
 'x/y':ODE('x/y','\\frac{x}{y}',(x,y)=>x/y,(x,y)=>y===0?null:R(x,y),{num:(x)=>x,d2:(x,y)=>y===0?null:R(y*y-x*x,y*y*y),d2tex:'\\frac{y-x\\frac{dy}{dx}}{y^{2}}=\\frac{y-x\\cdot\\frac{x}{y}}{y^{2}}=\\frac{y^{2}-x^{2}}{y^{3}}',undef:{tex:'0',val:0}}),
 '-x/y':ODE('-x/y','-\\frac{x}{y}',(x,y)=>-x/y,(x,y)=>y===0?null:R(-x,y),{num:(x)=>-x,undef:{tex:'0',val:0}}),
 'x/(2y)':ODE('x/(2y)','\\frac{x}{2y}',(x,y)=>x/(2*y),(x,y)=>y===0?null:R(x,2*y),{num:(x)=>x,undef:{tex:'0',val:0}}),
 '(x-1)/(y-1)':ODE('(x-1)/(y-1)','\\frac{x-1}{y-1}',(x,y)=>(x-1)/(y-1),(x,y)=>y===1?null:R(x-1,y-1),{num:(x)=>x-1,undef:{tex:'1',val:1}}),
 '(x-y)/y':ODE('(x-y)/y','\\frac{x-y}{y}',(x,y)=>(x-y)/y,(x,y)=>y===0?null:R(x-y,y),{num:(x,y)=>x-y,undef:{tex:'0',val:0}}),
 'x/(y+1)':ODE('x/(y+1)','\\frac{x}{y+1}',(x,y)=>x/(y+1),(x,y)=>y===-1?null:R(x,y+1),{num:(x)=>x,undef:{tex:'-1',val:-1}}),
 '(x-1)cos(pi y)':ODE('(x-1)cos(pi y)','(x-1)\\cos(\\pi y)',(x,y)=>(x-1)*Math.cos(Math.PI*y),(x,y)=>Number.isInteger(y)?R((x-1)*(Math.abs(y)%2?-1:1)):Number.isInteger(2*y)?R(0):null),
 'x+y^2':ODE('x+y^2','x+y^{2}',(x,y)=>x+y*y,(x,y)=>R(x+y*y)),
};
const slopeAt=(o,x,y)=>{const v=o.f(x,y);return Number.isFinite(v)?v:null;};
// truth at a lattice point: exact slope, vertical (nonzero over zero), or none (0/0)
function truthAt(o,x,y){const q=o.q(x,y);if(q)return{q,slope:qv(q),vertical:false};const n=o.num?o.num(x,y):1;return n===0?null:{q:null,slope:null,vertical:true};}

// ---------- geometry ----------
const VB=400,P0=30,P1=390;
const win=(lo,hi,ylo=lo,yhi=hi)=>({xmin:lo,xmax:hi,ymin:ylo,ymax:yhi});
const scale=w=>(P1-P0)/(w.xmax-w.xmin);
const X=(w,x)=>P0+(x-w.xmin)*scale(w),Y=(w,y)=>P1-(y-w.ymin)*scale(w);
const fx2=v=>Math.round(v*100)/100;
const angleOf=s=>s===null?90:((Math.atan(s)*180/Math.PI)+180)%180;          // a slope's direction, 0 to 180 degrees
const angDiff=(a,b)=>{const d=Math.abs(((a-b)%180+180)%180);return Math.min(d,180-d);};// segments are unoriented
function segment(w,x,y,ang,half){const s=scale(w),r=ang*Math.PI/180,dx=Math.cos(r)*half*s,dy=Math.sin(r)*half*s,cx=X(w,x),cy=Y(w,y);return[cx-dx,cy+dy,cx+dx,cy-dy];}

// a static board: grid, axes and labels, optional field, curves and marked points (an SVG string)
function boardSVG(w,{field=null,spacing=1,curves=[],points=[],labels=true,title='Slope field',cls=''}={}){
 const s=scale(w);let g='';
 for(let x=Math.ceil(w.xmin);x<=w.xmax;x++)g+=`<line class="grid-line" x1="${fx2(X(w,x))}" y1="${P0}" x2="${fx2(X(w,x))}" y2="${P1}"/>`;
 for(let y=Math.ceil(w.ymin);y<=w.ymax;y++)g+=`<line class="grid-line" x1="${P0}" y1="${fx2(Y(w,y))}" x2="${P1}" y2="${fx2(Y(w,y))}"/>`;
 if(w.xmin<=0&&w.xmax>=0)g+=`<line class="axis" x1="${fx2(X(w,0))}" y1="${P0}" x2="${fx2(X(w,0))}" y2="${P1}"/>`;
 if(w.ymin<=0&&w.ymax>=0)g+=`<line class="axis" x1="${P0}" y1="${fx2(Y(w,0))}" x2="${P1}" y2="${fx2(Y(w,0))}"/>`;
 if(labels){
  const ax=Math.min(Math.max(0,w.ymin),w.ymax),ay=Math.min(Math.max(0,w.xmin),w.xmax);
  for(let x=Math.ceil(w.xmin);x<=w.xmax;x++)if(x!==0)g+=`<text x="${fx2(X(w,x))}" y="${fx2(Math.min(P1+16,Y(w,ax)+15))}" text-anchor="middle">${x<0?'−'+(-x):x}</text>`;
  for(let y=Math.ceil(w.ymin);y<=w.ymax;y++)if(y!==0)g+=`<text x="${fx2(Math.max(14,X(w,ay)-7))}" y="${fx2(Y(w,y)+4)}" text-anchor="end">${y<0?'−'+(-y):y}</text>`;
  g+=`<text x="${P1-4}" y="${fx2(Y(w,ax)-6)}" text-anchor="end" class="axis-name">x</text><text x="${fx2(X(w,ay)+6)}" y="${P0+10}" class="axis-name">y</text>`;
 }
 if(field){const half=0.32*spacing;
  for(let x=w.xmin;x<=w.xmax+1e-9;x+=spacing)for(let y=w.ymin;y<=w.ymax+1e-9;y+=spacing){
   const xr=Math.round(x*1000)/1000,yr=Math.round(y*1000)/1000,v=field.f(xr,yr);if(Number.isNaN(v))continue; // 0/0: no segment
   const [a,b,c,d]=segment(w,xr,yr,Number.isFinite(v)?angleOf(v):90,half);g+=`<line class="field-seg" x1="${fx2(a)}" y1="${fx2(b)}" x2="${fx2(c)}" y2="${fx2(d)}"/>`;}}
 for(const cv of curves){if(cv.pts.length<2)continue;g+=`<polyline class="${cv.cls||'model-curve'}" points="${cv.pts.map(([x,y])=>`${fx2(X(w,x))},${fx2(Y(w,y))}`).join(' ')}"/>`;}
 for(const p of points)g+=`<circle class="${p.cls||'ic-point'}" cx="${fx2(X(w,p.x))}" cy="${fx2(Y(w,p.y))}" r="${p.r||5}"/>`;
 return `<svg class="u5-board ${cls}" viewBox="0 0 ${VB} ${VB}" role="img" aria-label="${title}"><title>${title}</title>${g}</svg>`;
}

// ---------- reference solutions ----------
// RK4 from the initial point in both directions, stopping at the edge of the window, at an undefined slope, or where
// the curve becomes nearly vertical; returns points ordered by x.
function solve(o,x0,y0,w,h=0.004){
 const out=[];const run=dir=>{const pts=[];let x=x0,y=y0;
  for(let k=0;k<20000;k++){const F=(xx,yy)=>o.f(xx,yy);const k1=F(x,y),k2=F(x+dir*h/2,y+dir*h/2*k1),k3=F(x+dir*h/2,y+dir*h/2*k2),k4=F(x+dir*h,y+dir*h*k3);
   if(![k1,k2,k3,k4].every(Number.isFinite)||Math.abs(k1)>40)break;const ny=y+dir*h/6*(k1+2*k2+2*k3+k4),nx=x+dir*h;
   if(nx<w.xmin-1e-9||nx>w.xmax+1e-9||ny<w.ymin-0.05||ny>w.ymax+0.05)break;x=nx;y=ny;if(k%5===4)pts.push([x,y]);}
  return pts;};
 const left=run(-1).reverse(),right=run(1);out.push(...left,[x0,y0],...right);return out;
}

// ---------- grading (pure functions; also used by the QA tools) ----------
const TOL_SEG=11; // degrees
function gradeSegments(targets,drawn,tol=TOL_SEG){
 const rows=targets.map((t,i)=>{const a=drawn[i];if(a===undefined||a===null)return{ok:false,missing:true};const want=t.vertical?90:angleOf(t.slope),diff=angDiff(a,want);return{ok:diff<=tol,diff,want,got:a};});
 return{ok:rows.every(r=>r.ok),correct:rows.filter(r=>r.ok).length,missing:rows.filter(r=>r.missing).length,rows};
}
const dist2seg=(p,a,b)=>{const vx=b[0]-a[0],vy=b[1]-a[1],L=vx*vx+vy*vy;let t=L?((p[0]-a[0])*vx+(p[1]-a[1])*vy)/L:0;t=Math.max(0,Math.min(1,t));const dx=a[0]+t*vx-p[0],dy=a[1]+t*vy-p[1];return Math.hypot(dx,dy);};
const distPoly=(p,poly)=>{let d=Infinity;for(let i=0;i<poly.length-1;i++)d=Math.min(d,dist2seg(p,poly[i],poly[i+1]));return poly.length===1?Math.hypot(p[0]-poly[0][0],p[1]-poly[0][1]):d;};
function resample(pts,step=0.05){if(pts.length<2)return pts.slice();const out=[pts[0]];let carry=0;
 for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]);let s=step-carry;while(s<=L){out.push([a[0]+(b[0]-a[0])*s/L,a[1]+(b[1]-a[1])*s/L]);s+=step;}carry=L-(s-step);}
 if(out.length<2)out.push(pts[pts.length-1]);return out;}
// distance from the reference that does not under-count vertical error where the curve is steep: the vertical gap,
// capped at twice the perpendicular distance (so tiny sideways errors on near-vertical stretches are not over-counted)
const refY=(ref,x)=>{if(x<ref[0][0]||x>ref[ref.length-1][0])return null;let lo=0,hi=ref.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(ref[mid][0]<=x)lo=mid;else hi=mid;}const [x1,y1]=ref[lo],[x2,y2]=ref[hi];return x2===x1?y1:y1+(y2-y1)*(x-x1)/(x2-x1);};
const hybrid=(p,ref)=>{const n=distPoly(p,ref),y=refY(ref,p[0]);return y===null?n:Math.min(Math.abs(p[1]-y),2*n);};
// how far the drawing misses the initial point: the vertical gap where it crosses x0, otherwise the straight-line distance
function missIC(drawn,ic){let best=Infinity;for(let i=0;i<drawn.length-1;i++){const [x1,y1]=drawn[i],[x2,y2]=drawn[i+1];if((x1-ic[0])*(x2-ic[0])<=0&&x1!==x2){const y=y1+(y2-y1)*(ic[0]-x1)/(x2-x1);best=Math.min(best,Math.abs(y-ic[1]));}}
 return Math.min(best,Math.min(...drawn.map(p=>Math.hypot(p[0]-ic[0],p[1]-ic[1]))));}
const CURVE={ic:0.3,mean:0.25,p90:0.5,angle:22,near:0.5,cover:0.7};
function gradeCurve(drawn,ref,ic,o,opt=CURVE){
 if(!drawn||drawn.length<2)return{ok:false,reason:'empty',note:'Draw a curve through the marked point before checking.'};
 const pts=resample(drawn,0.05);const icD=missIC(pts,ic);
 const d=pts.map(p=>hybrid(p,ref)),sorted=[...d].sort((a,b)=>a-b),mean=d.reduce((a,b)=>a+b,0)/d.length,p90=sorted[Math.floor(0.9*(sorted.length-1))];
 // direction agreement with the field along the drawing
 let angSum=0,angN=0;for(let i=0;i+2<pts.length;i+=2){const a=pts[i],b=pts[i+2],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,s=o.f(mx,my);if(!Number.isFinite(s))continue;
  const da=((Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI)+180)%180;angSum+=angDiff(da,angleOf(s));angN++;}
 const ang=angN?angSum/angN:0;
 // coverage: how far the drawing follows the solution on each side of the initial point
 const close=pts.filter((p,i)=>d[i]<=opt.near),x0=ic[0];
 const refL=x0-Math.min(...ref.map(p=>p[0])),refR=Math.max(...ref.map(p=>p[0]))-x0;
 const stuL=close.length?Math.max(0,x0-Math.min(...close.map(p=>p[0]))):0,stuR=close.length?Math.max(0,Math.max(...close.map(p=>p[0]))-x0):0;
 const needL=Math.min(refL,3)*opt.cover,needR=Math.min(refR,3)*opt.cover;
 const metrics={icDist:icD,mean,p90,angle:ang,stuL,stuR,refL,refR,needL,needR};
 let note='';
 if(icD>opt.ic)note=`Your curve does not pass through the initial point; its closest approach is about ${icD.toFixed(2)} units away. Start the curve at the marked point.`;
 else if(mean>opt.mean||p90>opt.p90){const worst=pts[d.indexOf(Math.max(...d))];note=`Your curve drifts away from the solution, by about ${Math.max(...d).toFixed(2)} units near x = ${worst[0].toFixed(1)}. Keep the curve tangent to the segments it passes through.`;}
 else if(ang>opt.angle)note=`Your curve crosses the slope segments instead of following them (average difference ${ang.toFixed(0)}°). A solution curve is tangent to the field at every point.`;
 else if(stuL+1e-9<needL||stuR+1e-9<needR)note=`Your curve is too short. Extend it ${stuL+1e-9<needL&&stuR+1e-9<needR?'in both directions':stuL+1e-9<needL?'to the left':'to the right'} of the initial point, following the field as far as the solution goes in the window.`;
 return{ok:!note,metrics,note};
}

// ---------- problems ----------
const DY='\\frac{dy}{dx}';
const coord=(x,y)=>`\\left(${x},\\,${y}\\right)`;
const qTex=q=>qtex(q);
function slopeLine(o,x,y){const t=truthAt(o,x,y);const sub=o.sub?o.sub(x,y):subTex(o,x,y);
 if(!t)return `${coord(x,y)}:\\ ${DY}=${sub}\\ \\text{(no segment)}`;
 return t.vertical?`${coord(x,y)}:\\ ${DY}=${sub}\\ \\text{undefined (vertical)}`:`${coord(x,y)}:\\ ${DY}=${sub}=${qTex(t.q)}`;}
// substitute a point into the equation's TeX
function subTex(o,x,y){const P=v=>v<0?`(${v})`:String(v);
 const tex=o.tex.replace(/\\cos\(\\pi y\)/,`\\cos(${y===0?'0':`${P(y)}\\pi`})`).replace(/(?<![a-z\\])x/g,'#X#').replace(/(?<![a-z\\])y/g,'#Y#');
 return tex.replace(/(\d)#X#/g,'$1('+x+')').replace(/(\d)#Y#/g,'$1('+y+')').replace(/#X##Y#/g,`${P(x)}\\cdot ${P(y)}`).replace(/#X#\^\{2\}/g,`${P(x)}^{2}`).replace(/#Y#\^\{2\}/g,`${P(y)}^{2}`).replace(/#X#/g,P(x)).replace(/#Y#/g,P(y)).replace(/--/g,'+').replace(/\+-/g,'-');}
function slopeTable(o,pts){return `<div class="u5-slope-table">${pts.map(([x,y])=>`<div>\\(${slopeLine(o,x,y)}\\)</div>`).join('')}</div>`;}
const HOWTO=`A slope segment is a short piece of the tangent line: horizontal where ${m(`${DY}=0`)}, rising for a positive slope, falling for a negative slope, steeper as the slope grows in size, and vertical where the slope is undefined because a nonzero numerator is divided by 0.`;

function build(family,tier,id,questionHtml,parts,data={}){return problem({engine:'slope',family,tier,id:String(id).replace(/[^A-Za-z0-9_.-]+/g,''),questionHtml,parts,calculator:false,data});}
const latt=(xs,ys)=>{const out=[];for(const y of [...ys].reverse())for(const x of xs)out.push([x,y]);return out;};

// 1. draw slope segments at marked points
const SEG_POOL={foundational:['x+y','x-y','y-x','2x','y','-y','x','y-1','1-y','xy'],intermediate:['x/(2y)','xy','(x-y)/y','x^2-y','2x-y','x+2y','-xy','y(2-y)'],challenging:['(x-1)cos(pi y)','(x-1)/(y-1)','x/y','x/(y+1)','-x/y','x+y^2']};
function famSegments(tier){
 const o=ODES[pick(SEG_POOL[tier])];
 let xs=[-1,0,1],ys=[-1,0,1];
 if(tier!=='foundational'){xs=pick([[-1,0,1],[0,1,2],[-1,0,1,2]]);ys=pick([[-2,-1,1,2],[-1,0,1],[-1,0,1,2]]);}
 if(o.id==='x/(2y)')ys=[-2,-1,1,2];
 if(tier==='challenging'&&o.undef)ys=[o.undef.val-1,o.undef.val,o.undef.val+1].concat(U.rand()<0.5?[o.undef.val+2]:[]);
 const pts=latt(xs,ys).filter(([x,y])=>truthAt(o,x,y));if(pts.length<6)return null;
 const targets=pts.map(([x,y])=>{const t=truthAt(o,x,y);return{x,y,slope:t.slope,vertical:t.vertical};});
 const lo=Math.min(...xs,...ys)-1,hi=Math.max(...xs,...ys)+1,w=win(lo,hi);
 const expl=step('Find the slope at each marked point.','Substitute the coordinates of each point into the differential equation.')+slopeTable(o,pts)+step('Draw each segment.',HOWTO+(targets.some(t=>t.vertical)?` Where the denominator is 0 the segments are vertical.`:''));
 const part={prompt:`Draw the slope segment at each of the ${targets.length} marked points.`,control:'slope-segments',board:{win:w,targets,ode:o.id},tol:TOL_SEG,answerIsText:true,
  answerTex:'The correct segments are shown on the grid in yellow.',explanation:expl};
 return build('draw_segments',tier,`seg-${o.id}-${xs.join('_')}-${ys.join('_')}`,question({prompt:`Sketch the slope field for the differential equation at the marked points. Drag across a point to draw its segment.`,formulas:[`${DY}=${o.tex}`],calculator:false}),[part],{ode:o.id,points:targets.length});
}

// 2. draw the solution curve through an initial point
const CURVE_POOL={foundational:['x','2x','-x','y','-y'],intermediate:['x-y','y-x','1-y','y-1','-xy','2x-y'],challenging:['y(2-y)','-x/y','xy','x+y','x^2-y']};
const BEHAVIOR={
 'x':()=>'The slopes depend only on x: negative to the left of the y-axis and positive to the right, so the solution falls, levels off at x = 0 and rises (a parabola opening up).',
 '2x':()=>'The slopes depend only on x: negative for x < 0 and positive for x > 0, so the solution is a parabola opening up with its lowest point at x = 0.',
 '-x':()=>'The slopes are positive for x < 0 and negative for x > 0, so the solution rises to a highest point at x = 0 and then falls.',
 'y':(x0,y0)=>y0>0?'Above the x-axis the slopes are positive and grow with y, so the solution rises ever more steeply to the right and flattens toward y = 0 to the left.':'Below the x-axis the slopes are negative and grow in size as y decreases, so the solution falls ever more steeply to the right and flattens toward y = 0 to the left.',
 '-y':(x0,y0)=>y0>0?'Above the x-axis the slopes are negative, so the solution decreases toward y = 0 as x increases and grows steeply to the left.':'Below the x-axis the slopes are positive, so the solution increases toward y = 0 as x increases.',
 'x-y':()=>'The segments are horizontal along y = x. The solution approaches the line y = x − 1 as x increases: every slope along that line equals 1, the line\'s own slope.',
 'y-x':()=>'The segments are horizontal along y = x. Solutions move away from the line y = x + 1 (along which every slope equals 1): above it they curve upward, below it downward.',
 '1-y':(x0,y0)=>`y = 1 is an equilibrium (slope 0). The solution ${y0>1?'decreases':'increases'} toward y = 1 as x increases.`,
 'y-1':(x0,y0)=>`y = 1 is an equilibrium (slope 0). The solution moves away from it: it ${y0>1?'increases':'decreases'} more and more steeply as x increases and flattens toward y = 1 to the left.`,
 '-xy':(x0,y0)=>`The slopes are 0 on the y-axis and on y = 0. The solution stays on one side of y = 0 and has a ${y0>0?'highest':'lowest'} point at x = 0, flattening toward y = 0 on both sides (a bell shape).`,
 '2x-y':()=>'The segments are horizontal along y = 2x. The solution approaches the line y = 2x − 2 as x increases (its slope 2 matches the field along it).',
 'y(2-y)':(x0,y0)=>`y = 0 and y = 2 are equilibrium solutions. ${y0>0&&y0<2?'Between them the slopes are positive, so the solution increases toward y = 2 as x increases and decreases toward y = 0 to the left (an S-shaped curve).':y0>2?'Above y = 2 the slopes are negative, so the solution decreases toward y = 2 as x increases.':'Below y = 0 the slopes are negative, so the solution decreases ever more steeply as x increases.'}`,
 '-x/y':(x0,y0)=>`The segments are perpendicular to the line from the origin, so solutions are circles centered at the origin. The initial value is ${y0>0?'above':'below'} the x-axis, so the solution is the ${y0>0?'upper':'lower'} half of the circle through the point; it stops where the segments become vertical on the x-axis.`,
 'xy':(x0,y0)=>`The slopes are 0 on the y-axis. The solution stays ${y0>0?'above':'below'} the x-axis, with its ${y0>0?'lowest':'highest'} point at x = 0, and grows in size steeply on both sides.`,
 'x+y':()=>'The segments are horizontal along y = −x. The line y = −x − 1 has slope −1 everywhere, matching the field; solutions above it curve upward and those below it curve downward.',
 'x^2-y':()=>'The segments are horizontal along the parabola y = x². The solution is pulled toward that parabola: it falls where it is above y = x² and rises where it is below.',
};
function famCurve(tier){
 const o=ODES[pick(CURVE_POOL[tier])],w=win(-3,3);
 const ics=o.id==='-x/y'?[[0,2],[1,2],[0,-2],[-1,-2],[1,-2],[0,2.5]]:o.id==='y(2-y)'?[[0,1],[-1,1],[0,0.5],[1,1.5],[0,3]]:o.auto?[[0,1],[0,-1],[-1,2],[0,2],[-2,1],[1,-1],[0,0.5]]:[[0,0],[0,1],[-1,0],[1,-1],[0,-1],[-2,1],[1,1],[-1,2]];
 const [x0,y0]=pick(ics);const t=truthAt(o,x0,y0);if(!t||t.vertical)return null;
 const ref=solve(o,x0,y0,w);const span=Math.max(...ref.map(p=>p[0]))-Math.min(...ref.map(p=>p[0]));if(span<2.5)return null;
 if(o.equil&&o.equil.includes(y0))return null;
 const part={prompt:`Draw the solution curve that passes through the marked point ${m(coord(x0,y0))}.`,control:'solution-curve',board:{win:w,spacing:tier==='foundational'?1:0.5,ode:o.id,ic:[x0,y0],ref},answerIsText:true,
  answerTex:'The solution curve is shown on the grid in yellow.',
  explanation:step('Start at the initial point.',`The curve must pass through ${m(coord(x0,y0))}, where ${m(`${DY}=${subTex(o,x0,y0)}=${qTex(t.q)}`)}, so it ${t.slope>0?'rises':t.slope<0?'falls':'is level'} there.`)+
   step('Follow the field.',`A solution curve is tangent to every segment it passes through, so trace along the segments in both directions instead of crossing them. ${BEHAVIOR[o.id](x0,y0)}`)+
   step('Extend it across the window.','Continue the curve as far as the solution goes inside the grid, in both directions from the initial point.')};
 return build('draw_curve',tier,`curve-${o.id}-${x0}-${y0}`,question({prompt:'The slope field for the differential equation is shown. Draw the particular solution through the marked point.',formulas:[`${DY}=${o.tex}`],calculator:false}),[part],{ode:o.id});
}

// 3. matching
const MATCH_POOL=['x+y','x-y','y-x','2x','x','-x','y','-y','y-1','1-y','xy','-xy','x/y','-x/y','y(2-y)','x^2-y','2x-y','x+2y'];
function distinct(a,b,w){let n=0,diff=0;for(let x=w.xmin+0.5;x<w.xmax;x+=1)for(let y=w.ymin+0.5;y<w.ymax;y+=1){const sa=slopeAt(a,x,y),sb=slopeAt(b,x,y);n++;if(angDiff(angleOf(sa),angleOf(sb))>15)diff++;}return diff/n;}
function pickDistinct(first,pool,count,w,minFrac=0.3){const chosen=[first];for(const id of shuffle(pool.slice())){if(chosen.length>=count)break;const o=ODES[id];if(chosen.some(c=>c.id===id||distinct(c,o,w)<minFrac))continue;chosen.push(o);}return chosen.length===count?chosen:null;}
const LETTERS=['A','B','C','D'];
function famMatch(tier){
 const w=win(-2,2);
 if(tier==='foundational'){ // equation given: choose its slope field
  const o=ODES[pick(['x+y','x-y','2x','y','-y','xy','-x','y-1'])],set=pickDistinct(o,MATCH_POOL,4,w);if(!set)return null;
  const order=shuffle(set.slice()),correct=order.indexOf(o);
  const choices=order.map((c,i)=>`<span class="u5-choice-label">${LETTERS[i]}</span>${boardSVG(w,{field:c,spacing:0.5,labels:false,title:`Slope field ${LETTERS[i]}`,cls:'u5-mini'})}`);
  const why=step('Check a few points.',`For ${m(`${DY}=${o.tex}`)}: ${[[0,1],[1,0],[1,1],[-1,1]].map(([x,y])=>{const t=truthAt(o,x,y);return t?m(`${coord(x,y)}\\to ${t.vertical?'\\text{vertical}':qTex(t.q)}`):'';}).filter(Boolean).join(', ')}. ${o.zero?`The segments are horizontal along ${m(`y=${o.zero.tex}`)}.`:o.equil?`The segments are horizontal along ${o.equil.map(c=>m(`y=${c}`)).join(' and ')}.`:''}`)+
   step('Eliminate the others.',`Field ${LETTERS[correct]} is the only one with these slopes; each of the other fields has a different slope at one or more of those points.`);
  return build('match',tier,`mf-${o.id}-${order.map(c=>c.id).join('_')}`,question({prompt:'Which slope field belongs to this differential equation?',formulas:[`${DY}=${o.tex}`],calculator:false}),
   [{prompt:'Choose the matching slope field.',control:'svg-choice',choices,correctIndex:correct,answerIsText:true,answerTex:`Field ${LETTERS[correct]}`,explanation:why}],{ode:o.id});
 }
 if(tier==='intermediate'){ // field given: choose its equation
  const o=ODES[pick(MATCH_POOL)],set=pickDistinct(o,MATCH_POOL,4,w);if(!set)return null;
  const order=shuffle(set.slice()),correct=order.indexOf(o);
  const why=step('Read slopes from the field.',`Look where the segments are horizontal and where the slopes are positive or negative. ${o.zero?`Here the segments are horizontal along ${m(`y=${o.zero.tex}`)}.`:o.equil?`Here they are horizontal along ${o.equil.map(c=>m(`y=${c}`)).join(' and ')}, and the slope does not change along each horizontal line.`:o.undef?`Here the segments are vertical along ${m(`y=${o.undef.tex}`)}.`:''}`)+
   step('Test each equation.',order.map((c,i)=>`${LETTERS[i]}: ${m(`${DY}=${c.tex}`)} gives ${m(`${coord(1,1)}\\to ${(t=>t?t.vertical?'\\text{vertical}':qTex(t.q):'\\text{none}')(truthAt(c,1,1))}`)} and ${m(`${coord(-1,1)}\\to ${(t=>t?t.vertical?'\\text{vertical}':qTex(t.q):'\\text{none}')(truthAt(c,-1,1))}`)}.`).join(' ')+` Only ${LETTERS[correct]} matches the field at every point.`);
  return build('match',tier,`me-${o.id}-${order.map(c=>c.id).join('_')}`,question({prompt:'Which differential equation could have this slope field?',calculator:false,extra:`<div class="u5-board-wrap u5-figure">${boardSVG(w,{field:o,spacing:0.5,title:'Slope field'})}</div>`}),
   [{prompt:'Choose the matching differential equation.',control:'choice',choices:order.map((c,i)=>`${LETTERS[i]}. \\(${DY}=${c.tex}\\)`),correctIndex:correct,answerIsText:true,answerTex:`${LETTERS[correct]}. \\(${DY}=${o.tex}\\)`,explanation:why}],{ode:o.id});
 }
 // challenging: field and initial point given; choose the solution curve
 const w3=win(-3,3),o=ODES[pick(['x-y','y-x','1-y','-xy','2x-y','y(2-y)','xy','x^2-y'])],ic=pick([[0,1],[-1,0],[0,-1],[1,1],[-1,1]]);if(!truthAt(o,...ic))return null;
 const ref=solve(o,ic[0],ic[1],w3);if(Math.max(...ref.map(p=>p[0]))-Math.min(...ref.map(p=>p[0]))<3)return null;
 const others=[];for(const id of shuffle(MATCH_POOL.slice())){if(others.length>=3)break;const c=ODES[id];if(c.id===o.id||!truthAt(c,...ic))continue;const r=solve(c,ic[0],ic[1],w3);if(r.length<20)continue;
  const g=gradeCurve(r,ref,ic,o);if(g.ok||g.metrics.mean<0.6&&g.metrics.angle<25)continue;if(others.some(q=>gradeCurve(r,q.r,ic,c).metrics.mean<0.4))continue;others.push({c,r});}
 if(others.length<3)return null;
 const opts=shuffle([{r:ref,good:true},...others.map(q=>({r:q.r,good:false}))]),correct=opts.findIndex(q=>q.good);
 const choices=opts.map((q,i)=>`<span class="u5-choice-label">${LETTERS[i]}</span>${boardSVG(w3,{field:o,spacing:1,labels:false,curves:[{pts:q.r,cls:'choice-curve'}],points:[{x:ic[0],y:ic[1]}],title:`Curve ${LETTERS[i]}`,cls:'u5-mini'})}`);
 const t=truthAt(o,...ic);
 return build('match',tier,`mc-${o.id}-${ic.join('_')}`,question({prompt:`Each graph shows the slope field for the differential equation with a curve through ${m(coord(ic[0],ic[1]))}. Which curve could be the solution through that point?`,formulas:[`${DY}=${o.tex}`],calculator:false}),
  [{prompt:'Choose the solution curve.',control:'svg-choice',choices,correctIndex:correct,answerIsText:true,answerTex:`Curve ${LETTERS[correct]}`,
   explanation:step('A solution curve follows the field.',`It must be tangent to the segments everywhere it goes. At ${m(coord(ic[0],ic[1]))} the slope is ${m(`${subTex(o,...ic)}=${qTex(t.q)}`)}.`)+step('Compare the curves.',`${BEHAVIOR[o.id](...ic)} Curve ${LETTERS[correct]} does this; each of the others crosses segments at a clearly different angle somewhere.`)}],{ode:o.id});
}

// 4. analysis with typed answers
function famAnalysis(tier){
 const w=win(-3,3);
 const fig=o=>`<div class="u5-board-wrap u5-figure">${boardSVG(w,{field:o,spacing:1,title:'Slope field'})}</div>`;
 if(tier==='foundational'){
  const o=ODES[pick(['x+y','x-y','y-x','2x-y','x+2y','xy','-xy','x/(2y)','(x-y)/y','x^2-y','y(2-y)','(x-1)/(y-1)'])];
  const [x,y]=[ri(-3,3),ri(-3,3)];const t=truthAt(o,x,y);if(!t||t.vertical||(o.id==='xy'||o.id==='-xy')&&(x===0||y===0))return null;
  return build('analyze',tier,`slope-${o.id}-${x}-${y}`,question({prompt:'Use the differential equation.',formulas:[`${DY}=${o.tex}`],calculator:false,extra:fig(o)}),
   [{prompt:`Find the slope of the segment at ${m(coord(x,y))}.`,answer:{kind:'exact',value:t.slope},answerTex:qTex(t.q),keypadMode:'unit5-slope-exact',placeholder:'Slope',
    explanation:step('Substitute the point.',`The slope of the segment at a point is ${m(DY)} evaluated there.`,`${DY}\\Big|_{${coord(x,y)}}=${subTex(o,x,y)}=${qTex(t.q)}`)+step('Check against the field.',`The segment at ${m(coord(x,y))} ${t.slope>0?'rises':t.slope<0?'falls':'is horizontal'}, as the figure shows.`)}],{ode:o.id});
 }
 if(tier==='intermediate'){
  const kind=pick(['zero','equil','up']);
  if(kind==='zero'){const o=ODES[pick(['x+y','x-y','y-x','2x-y','x+2y','x^2-y'])];
   return build('analyze',tier,`zero-${o.id}`,question({prompt:'Use the differential equation and its slope field.',formulas:[`${DY}=${o.tex}`],calculator:false,extra:fig(o)}),
    [{prompt:'The slope segments are horizontal exactly along one curve. Write its equation.',control:'input',prefix:'y=',answer:{kind:'function',variable:'x',expression:o.zero.expr,interval:[-3,3],x0:0},answerTex:`y=${o.zero.tex}`,keypadMode:'unit5-slope-line',placeholder:'y in terms of x',
     explanation:step('Horizontal segments have slope 0.','Set the differential equation equal to 0 and solve for y.',`${o.tex}=0`,`y=${o.zero.tex}`)+step('Check against the field.',`Along ${m(`y=${o.zero.tex}`)} every segment in the figure is level; on one side the slopes are positive and on the other negative.`)}],{ode:o.id});}
  const o=ODES[pick(['y','-y','y-1','1-y','y(2-y)','(y-1)(y+2)'])];
  if(kind==='equil'){const list=o.equil;
   return build('analyze',tier,`eq-${o.id}`,question({prompt:'Use the differential equation and its slope field.',formulas:[`${DY}=${o.tex}`],calculator:false,extra:fig(o)}),
    [{prompt:`Find every constant solution ${m('y=c')} (equilibrium solution). Separate values with commas.`,answer:{kind:'list',values:list},answerTex:list.map(c=>`y=${c}`).join(',\\ '),keypadMode:'unit5-slope-list',placeholder:'e.g. 0, 2',
     explanation:step('A constant solution has slope 0 everywhere.',`If ${m('y=c')} for all x, then ${m(`${DY}=0`)}, so ${m('c')} must make the right side 0 for every x.`,`${o.tex}=0`,`y=${list.join('\\ \\text{or}\\ y=')}`)+step('Check against the field.',`Along ${list.map(c=>m(`y=${c}`)).join(' and ')} every segment is horizontal, so those horizontal lines are themselves solution curves.`)}],{ode:o.id});}
  const ivs=o.up,tex=ivs.map(([a,b])=>`\\left(${a===-Infinity?'-\\infty':a},\\,${b===Infinity?'\\infty':b}\\right)`).join('\\cup ');
  return build('analyze',tier,`up-${o.id}`,question({prompt:'Use the differential equation and its slope field.',formulas:[`${DY}=${o.tex}`],calculator:false,extra:fig(o)}),
   [{prompt:`For which values of ${m('y')} are solution curves increasing? Answer with an interval (or a union of intervals) of ${m('y')}-values.`,answer:{kind:'interval',variable:'y',anyBrackets:false,parts:ivs.map(([a,b])=>({left:a===-Infinity?'-infinity':String(a),right:b===Infinity?'infinity':String(b)}))},answerTex:tex,keypadMode:'unit5-slope-interval',placeholder:'e.g. (0, 2)',
    explanation:step('Solutions increase where the slope is positive.',`The slope depends only on ${m('y')}, so find the ${m('y')}-values that make ${m(o.tex)} positive.`,`${o.tex}=0\\ \\text{at}\\ y=${o.equil.join(',\\ ')}`)+
     step('Test each region.',`Between and beyond those values the sign is constant; testing one value in each region shows the slope is positive for ${m(tex.replace(/\\cup /g,'\\text{ or }'))}. The equilibrium values themselves have slope 0 and are excluded.`)}],{ode:o.id});
 }
 // challenging: concavity or the line of undefined slopes
 if(U.rand()<0.65){
  const o=ODES[pick(['x+y','x-y','y-x','2x-y','x^2-y','xy','-xy','y(2-y)','x/y'])];const [x,y]=[ri(-2,2),ri(-2,2)];const t=truthAt(o,x,y);if(!t||t.vertical)return null;const d2=o.d2(x,y);if(!d2)return null;
  return build('analyze',tier,`d2-${o.id}-${x}-${y}`,question({prompt:`A solution curve of the differential equation passes through ${m(coord(x,y))}.`,formulas:[`${DY}=${o.tex}`],calculator:false}),
   [{prompt:`Find ${m('\\frac{d^{2}y}{dx^{2}}')} at ${m(coord(x,y))}.`,answer:{kind:'exact',value:qv(d2)},answerTex:qTex(d2),keypadMode:'unit5-slope-exact',placeholder:'Exact value',
    explanation:step('Differentiate the differential equation.',`Differentiate both sides with respect to ${m('x')}, remembering that ${m('y')} is a function of ${m('x')} (chain rule: the derivative of ${m('y')} is ${m(DY)}).`,`\\frac{d^{2}y}{dx^{2}}=${o.d2tex}`)+
     step('Substitute the point.',`At ${m(coord(x,y))} the first derivative is ${m(`${DY}=${qTex(t.q)}`)}.`,`\\frac{d^{2}y}{dx^{2}}=${qTex(d2)}`)+
     step('Interpret.',qv(d2)>0?'Positive: the solution curve is concave up there.':qv(d2)<0?'Negative: the solution curve is concave down there.':'Zero: this test gives no concavity information at that point.')}],{ode:o.id});
 }
 const o=ODES[pick(['x/y','x/(2y)','(x-1)/(y-1)','(x-y)/y','x/(y+1)'])];
 return build('analyze',tier,`undef-${o.id}`,question({prompt:'Use the differential equation and its slope field.',formulas:[`${DY}=${o.tex}`],calculator:false,extra:fig(o)}),
  [{prompt:'Along which horizontal line are the slopes undefined?',control:'input',prefix:'y=',answer:{kind:'exact',value:o.undef.val},answerTex:`y=${o.undef.tex}`,keypadMode:'unit5-slope-exact',placeholder:'Value of y',
   explanation:step('A slope is undefined where the denominator is 0.',`The denominator is 0 when ${m(`y=${o.undef.tex}`)}.`)+step('Read the field.',`On ${m(`y=${o.undef.tex}`)} the segments are vertical wherever the numerator is not 0 (and there is no segment where the numerator is 0 too). Solution curves cannot cross this line, because the equation is not defined there.`)}],{ode:o.id});
}

const FAMILIES={
 draw_segments:{weight:25,tiers:['foundational','intermediate','challenging'],make:famSegments,calculator:false},
 draw_curve:{weight:25,tiers:['foundational','intermediate','challenging'],make:famCurve,calculator:false},
 match:{weight:25,tiers:['foundational','intermediate','challenging'],make:famMatch,calculator:false},
 analyze:{weight:25,tiers:['foundational','intermediate','challenging'],make:famAnalysis,calculator:false},
};
const engine=U.makeEngine('slope',FAMILIES);
U.profile('unit5-slope-exact',{fraction:true,parentheses:true});
U.profile('unit5-slope-line',{fraction:true,exponent:true,variables:['x'],parentheses:true});
U.profile('unit5-slope-list',{list:true});
U.profile('unit5-slope-interval',{parentheses:true,list:true,interval:true,union:true,infinity:true});

// ======================================================================
// interactive drawing controls (browser only)
const NS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs={},cls){const e=document.createElementNS(NS,tag);if(cls)e.setAttribute('class',cls);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;}
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e;}
// client (CSS pixel) coordinates to math coordinates, through the SVG's own transform: correct at any size or pixel ratio
function toMath(svg,w,cx,cy){const pt=svg.createSVGPoint();pt.x=cx;pt.y=cy;const p=pt.matrixTransform(svg.getScreenCTM().inverse());const s=scale(w);return[(p.x-P0)/s+w.xmin,(P1-p.y)/s+w.ymin];}
function toClient(svg,w,x,y){const pt=svg.createSVGPoint();pt.x=X(w,x);pt.y=Y(w,y);const p=pt.matrixTransform(svg.getScreenCTM());return[p.x,p.y];}
function makeBoard(w,opts){const holder=el('div','u5-board-wrap');holder.innerHTML=boardSVG(w,opts);const svg=holder.querySelector('svg');svg.dataset.win=JSON.stringify(w);svg.tabIndex=-1;return{holder,svg};}
function legend(){return el('div','u5-legend','<span><i></i>Your work</span><span><i class="model"></i>Correct</span>');}
function parseSlope(text){const t=String(text||'').trim().toLowerCase().replace(/−/g,'-');if(!t)return undefined;if(/^(u|und|undefined|v|vert|vertical|inf|infinity|∞)$/.test(t))return null;
 const f=t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);if(f){const d=+f[2];return d===0?null:+f[1]/d;}const v=Number(t);return Number.isFinite(v)?v:NaN;}

function segmentsControl(part,panel,done){
 const w=part.board.win,targets=part.board.targets,o=ODES[part.board.ode],s=scale(w);
 const {holder,svg}=makeBoard(w,{title:`Grid for drawing slope segments at ${targets.length} points`});
 const layer=svgEl('g'),marks=svgEl('g'),model=svgEl('g');svg.append(layer,model,marks); // the dashed model is drawn over the student's work so both stay visible
 const dots=targets.map((t,i)=>{const c=svgEl('circle',{cx:X(w,t.x),cy:Y(w,t.y),r:4.5,'data-i':i,'data-x':t.x,'data-y':t.y},'target');svg.appendChild(c);return c;});
 const drawn=new Array(targets.length).fill(null),lines=new Array(targets.length).fill(null);
 const status=el('div','u5-board-status','Drag across each marked point in the direction of its slope.');status.setAttribute('aria-live','polite');
 const tools=el('div','u5-tools unit5-tools');
 const btn=(label,cls='choice')=>{const b=el('button',cls,label);b.type='button';tools.appendChild(b);return b;};
 const eraseB=btn('Erase'),clearB=btn('Clear all'),typeB=btn('Type slopes instead');eraseB.setAttribute('aria-pressed','false');
 const check=el('button','choice staged-check','Check Segments');check.type='button';
 const entry=el('div','u5-slope-entry');entry.hidden=true;
 const inputs=targets.map((t,i)=>{const lab=el('label','',`(${t.x}, ${t.y})`);const inp=el('input');inp.type='text';inp.inputMode='text';inp.placeholder='slope';inp.setAttribute('aria-label',`Slope at (${t.x}, ${t.y}); type undefined for a vertical segment`);
  inp.addEventListener('input',()=>{const v=parseSlope(inp.value);if(v===undefined){set(i,null);return;}if(Number.isNaN(v))return;set(i,angleOf(v));});lab.appendChild(inp);entry.appendChild(lab);return inp;});
 panel.append(holder,tools,entry,status,check);
 let erase=false,locked=false;
 function set(i,ang){drawn[i]=ang;if(lines[i]){lines[i].remove();lines[i]=null;}dots[i].classList.toggle('active',ang!==null);
  if(ang!==null){const [a,b,c,d]=segment(w,targets[i].x,targets[i].y,ang,0.35);lines[i]=svgEl('line',{x1:a,y1:b,x2:c,y2:d},'student-seg');layer.appendChild(lines[i]);}
  const left=drawn.filter(v=>v===null).length;status.textContent=left?`${left} point${left>1?'s':''} still need a segment.`:'Every point has a segment. Check when you are ready.';}
 eraseB.addEventListener('click',()=>{erase=!erase;eraseB.setAttribute('aria-pressed',String(erase));status.textContent=erase?'Tap a point to erase its segment.':'Drag across a point to draw its segment.';});
 clearB.addEventListener('click',()=>{if(locked)return;targets.forEach((_,i)=>set(i,null));inputs.forEach(x=>x.value='');});
 typeB.addEventListener('click',()=>{entry.hidden=!entry.hidden;typeB.textContent=entry.hidden?'Type slopes instead':'Hide slope entry';if(!entry.hidden)inputs[0].focus();});
 const nearest=(x,y)=>{let best=-1,bd=0.55;targets.forEach((t,i)=>{const d=Math.hypot(t.x-x,t.y-y);if(d<bd){bd=d;best=i;}});return best;};
 let stroke=null,preview=null;
 svg.addEventListener('pointerdown',e=>{if(locked)return;e.preventDefault();svg.setPointerCapture(e.pointerId);stroke={a:toMath(svg,w,e.clientX,e.clientY)};stroke.b=stroke.a;});
 svg.addEventListener('pointermove',e=>{if(!stroke)return;stroke.b=toMath(svg,w,e.clientX,e.clientY);if(erase)return;
  const [ax,ay]=stroke.a,[bx,by]=stroke.b,L=Math.hypot(bx-ax,by-ay);if(L<0.15)return;const i=nearest((ax+bx)/2,(ay+by)/2);if(i<0)return;
  const ang=((Math.atan2(by-ay,bx-ax)*180/Math.PI)+180)%180,[a,b,c,d]=segment(w,targets[i].x,targets[i].y,ang,0.35);
  if(!preview){preview=svgEl('line',{},'student-seg preview');layer.appendChild(preview);}preview.setAttribute('x1',a);preview.setAttribute('y1',b);preview.setAttribute('x2',c);preview.setAttribute('y2',d);});
 const finish=e=>{if(!stroke)return;const [ax,ay]=stroke.a,[bx,by]=stroke.b;stroke=null;if(preview){preview.remove();preview=null;}
  const L=Math.hypot(bx-ax,by-ay);
  if(erase||L<0.15){const i=nearest(bx,by);if(i>=0&&erase){set(i,null);inputs[i].value='';}return;}
  const i=nearest((ax+bx)/2,(ay+by)/2);if(i<0){status.textContent='Start the stroke on or next to a marked point.';return;}
  set(i,((Math.atan2(by-ay,bx-ax)*180/Math.PI)+180)%180);inputs[i].value='';};
 svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);
 let first=true;
 check.addEventListener('click',()=>{
  const left=drawn.filter(v=>v===null).length;if(left){status.textContent=`Draw a segment at every marked point first (${left} left).`;return;}
  const g=gradeSegments(targets,drawn,part.tol||TOL_SEG);locked=true;check.disabled=true;eraseB.disabled=clearB.disabled=typeB.disabled=true;inputs.forEach(x=>x.disabled=true);
  // overlay: correct segments and a ring on each point
  targets.forEach((t,i)=>{const [a,b,c,d]=segment(w,t.x,t.y,t.vertical?90:angleOf(t.slope),0.42);model.appendChild(svgEl('line',{x1:a,y1:b,x2:c,y2:d},'model-seg'));
   marks.appendChild(svgEl('circle',{cx:X(w,t.x),cy:Y(w,t.y),r:11},g.rows[i].ok?'mark-good':'mark-bad'));});
  holder.appendChild(legend());
  const wrong=g.rows.map((r,i)=>r.ok?null:targets[i]).filter(Boolean);
  const note=g.ok?`All ${targets.length} segments are within ${part.tol||TOL_SEG}° of the correct slope.`:
   `${g.correct} of ${targets.length} segments are within ${part.tol||TOL_SEG}° of the correct slope. Check ${wrong.slice(0,3).map(t=>`(${t.x}, ${t.y}), where the slope is ${t.vertical?'undefined (vertical)':fmt(t.slope)}`).join('; ')}${wrong.length>3?'; and the other circled points':''}.`;
  status.textContent=g.ok?'Correct segments are dashed yellow; yours are solid blue.':'Red circles mark segments to fix. Correct segments are dashed yellow.';
  if(first){first=false;retry();done(g.ok,{note,grade:g});}
 });
 function retry(){const r=el('button','choice u5-retry','Try again');r.type='button';tools.after(r);
  r.addEventListener('click',()=>{model.innerHTML='';marks.innerHTML='';holder.querySelector('.u5-legend')?.remove();locked=false;check.disabled=false;eraseB.disabled=clearB.disabled=typeB.disabled=false;inputs.forEach(x=>{x.disabled=false;x.value='';});targets.forEach((_,i)=>set(i,null));status.textContent='Practice again: this attempt is not scored.';r.remove();
   check.textContent='Check Again';});}
 return{svg,targets,drawn,set};
}
const fmt=v=>{for(const d of [1,2,3,4,5,6,8,9,10,12]){const n=v*d;if(Math.abs(n-Math.round(n))<1e-9)return d===1?String(Math.round(n)):`${Math.round(n)}/${d}`;}return v.toFixed(2);};

function curveControl(part,panel,done){
 const w=part.board.win,o=ODES[part.board.ode],ic=part.board.ic,ref=part.board.ref;
 const {holder,svg}=makeBoard(w,{field:o,spacing:part.board.spacing,points:[{x:ic[0],y:ic[1],r:6}],title:'Slope field with the initial point marked'});
 const model=svgEl('g'),layer=svgEl('g');svg.insertBefore(layer,svg.querySelector('.ic-point'));svg.insertBefore(model,svg.querySelector('.ic-point'));
 const status=el('div','u5-board-status','Press on the marked point and drag to draw the curve. Drawing again replaces it.');status.setAttribute('aria-live','polite');
 const tools=el('div','u5-tools unit5-tools');const btn=label=>{const b=el('button','choice',label);b.type='button';tools.appendChild(b);return b;};
 const clearB=btn('Clear'),typeB=btn('Enter points instead');
 const check=el('button','choice staged-check','Check Curve');check.type='button';
 const xs=[];for(let x=Math.ceil((Math.min(...ref.map(p=>p[0]))+0.01)*2)/2;x<=Math.max(...ref.map(p=>p[0]))-0.01;x+=0.5)if(Math.abs(x-ic[0])>1e-9)xs.push(Math.round(x*2)/2);
 const entry=el('div','u5-slope-entry');entry.hidden=true;
 const inputs=xs.map(x=>{const lab=el('label','',`y at x = ${x}`);const inp=el('input');inp.type='text';inp.placeholder='y';inp.setAttribute('aria-label',`Estimated y-value of the solution at x = ${x}`);inp.addEventListener('input',fromInputs);lab.appendChild(inp);entry.appendChild(lab);return inp;});
 panel.append(holder,tools,entry,status,check);
 let pts=[],path=null,locked=false;
 const draw=()=>{if(path)path.remove();path=pts.length>1?svgEl('polyline',{points:pts.map(([x,y])=>`${X(w,x)},${Y(w,y)}`).join(' ')},'student-curve'):null;if(path)layer.appendChild(path);};
 function fromInputs(){const p=[[ic[0],ic[1]]];xs.forEach((x,i)=>{const v=Number(String(inputs[i].value).replace(/−/g,'-'));if(inputs[i].value.trim()!==''&&Number.isFinite(v))p.push([x,v]);});p.sort((a,b)=>a[0]-b[0]);pts=p;draw();}
 clearB.addEventListener('click',()=>{if(locked)return;pts=[];draw();inputs.forEach(x=>x.value='');});
 typeB.addEventListener('click',()=>{entry.hidden=!entry.hidden;typeB.textContent=entry.hidden?'Enter points instead':'Hide point entry';if(!entry.hidden)inputs[0]?.focus();});
 let drawing=false;
 svg.addEventListener('pointerdown',e=>{if(locked)return;e.preventDefault();svg.setPointerCapture(e.pointerId);drawing=true;pts=[toMath(svg,w,e.clientX,e.clientY)];draw();});
 svg.addEventListener('pointermove',e=>{if(!drawing)return;const p=toMath(svg,w,e.clientX,e.clientY),q=pts[pts.length-1];if(Math.hypot(p[0]-q[0],p[1]-q[1])>=0.03){pts.push(p);draw();}});
 const end=()=>{if(!drawing)return;drawing=false;status.textContent=pts.length>1?'Check when your curve follows the field across the grid.':'Drag to draw a curve.';};
 svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
 let first=true;
 check.addEventListener('click',()=>{
  if(pts.length<2){status.textContent='Draw the curve first.';return;}
  const g=gradeCurve(pts,ref,ic,o);locked=true;check.disabled=true;clearB.disabled=typeB.disabled=true;inputs.forEach(x=>x.disabled=true);
  model.appendChild(svgEl('polyline',{points:ref.map(([x,y])=>`${X(w,x)},${Y(w,y)}`).join(' ')},'model-curve'));holder.appendChild(legend());
  const note=g.ok?`Your curve passes through the initial point and stays within about ${g.metrics.mean.toFixed(2)} units of the solution on average.`:g.note;
  status.textContent='The solution is dashed yellow; your curve is solid blue.';
  if(first){first=false;retry();done(g.ok,{note,grade:g});}
 });
 function retry(){const r=el('button','choice u5-retry','Try again');r.type='button';tools.after(r);
  r.addEventListener('click',()=>{model.innerHTML='';holder.querySelector('.u5-legend')?.remove();locked=false;check.disabled=false;clearB.disabled=typeB.disabled=false;inputs.forEach(x=>{x.disabled=false;x.value='';});pts=[];draw();status.textContent='Practice again: this attempt is not scored.';check.textContent='Check Again';r.remove();});}
 return{svg};
}

window.BatchMathUnit5Slope=Object.freeze({make:engine.make,FAMILIES,weights:engine.weights,ODES,truthAt,solve,gradeSegments,gradeCurve,angleOf,angDiff,boardSVG,TOL_SEG,CURVE,win});
window.BatchMathUnit5SlopeUI=Object.freeze({controls:{'slope-segments':segmentsControl,'solution-curve':curveControl},toClient,toMath});
U.register('slope-fields',o=>engine.make(o||{}));
})();
