/* BatchMath v12.9.A — Unit 6 regions shared by the area, volume and free-response engines.
   Each builder returns a region with vertical slices (xs: top/bottom on [a, b]) and, where it exists, horizontal
   slices (ys: right/left on [c, d]), the boundary equations for the prompt, how the bounds are found (for the
   explanation), and what to draw. Non-calculator regions use exact algebraic boundaries (powers with rational
   exponents, so areas and volumes come out exact); pieces whose width is a square root carry s2, the exact square
   of the width, for cross sections. Calculator regions have intersections that need the calculator.
   The regions follow the teacher's notes, assignments and tests: sqrt(x) and x^2 revolved about many lines,
   x = y^2 with x = y + 2, sqrt(x) with x - 2 and the x-axis, caps such as 1 - x^2 and 2 - x^2, semicircles,
   triangles, y = 8 with y = x^3, x = 2y^2 - y^3, 4/x on [2, 4], 2 ln(x + 1) with a line, 1 + ln x with x^2 - 1,
   e^{2x}, cos x with x^2. */
(function(){
'use strict';
const C=window.BatchMathUnit6Core;
if(!C){console.error('unit6-regions: load unit6-core.js first');return;}
const {U5,Q,qv,P,pc,pm,padd,psub,pscale,qpow,fp,fnc,fconst,bq,bn,region,zeros,fixed}=C;
const {pick,ri}=U5;
const mono=(c,e)=>fp(pm(typeof c==='number'?Q(c):c,typeof e==='number'?Q(e):e));
const line=(mq,b)=>fp(padd(pm(typeof mq==='number'?Q(mq):mq,1),pc(typeof b==='number'?Q(b):b)));
const nice=v=>Math.abs(v-Math.round(v))<1e-12?Math.round(v):v;

// ---------- non-calculator (exact) ----------
// two increasing power curves through the origin meeting again at x = s; top on (0, s). [cTop,eTop,cBot,eBot,s]
const PAIRS=[[1,'1/2',1,2,1],[1,'1/2',1,1,1],[1,1,1,2,1],[1,1,1,3,1],[1,'1/2',1,3,1],[2,'1/2',1,1,4],[1,'1/2','1/2',1,4],
 [2,1,1,2,2],[4,1,1,3,2],[3,1,1,2,3],[2,'1/2','1/4',2,4],[1,2,1,3,1]];
const rq=t=>{if(typeof t==='number')return Q(t);const [n,d]=t.split('/').map(Number);return Q(n,d);};
function inversePow(c,e){const k=qpow(Q(c.d,c.n),Q(e.d,e.n));return k?fp(pm(k,Q(e.d,e.n))):null;} // x = (y/c)^(1/e)
function pair(){
 const [ct,et,cb,eb,s]=pick(PAIRS).map((v,i)=>i===4?v:rq(v));
 const top=fp(pm(ct,et)),bot=fp(pm(cb,eb)),Y=top.f(s);
 const L=inversePow(ct,et),Rr=inversePow(cb,eb);
 return region({name:'R',xs:[{a:bq(0),b:bq(s),top,bot}],ys:L&&Rr?[{a:bq(0),b:bq(nice(Y)),right:Rr,left:L}]:null,
  eqs:[`y=${top.tex('x')}`,`y=${bot.tex('x')}`],text:`the region enclosed by \\(y=${top.tex('x')}\\) and \\(y=${bot.tex('x')}\\)`,
  bounds:`Set \\(${top.tex('x')}=${bot.tex('x')}\\): the curves meet at \\(x=0\\) and \\(x=${s}\\) (where \\(y=${nice(Y)}\\)).`,
  boundsTex:[`x=0`,`x=${s}`],xb:[0,s],yb:[0,nice(Y)],
  view:{xmin:-1,xmax:s+1,ymin:-1,ymax:Math.ceil(Y)+1},draw:[{f:top.f,tex:`y=${top.tex('x')}`,dom:[0,s+1]},{f:bot.f,tex:`y=${bot.tex('x')}`,dom:[0,s+1]}],
  data:{kind:'pair',touchesOrigin:true}});
}
// y = k sqrt(x), the x-axis and x = n^2 (tests: 3 sqrt x, x = 4)
function underRoot(){
 const k=pick([1,2,3]),n=pick([1,2,3]),s=n*n,top=mono(k,Q(1,2)),Y=k*n;
 return region({xs:[{a:bq(0),b:bq(s),top,bot:fconst(0)}],ys:[{a:bq(0),b:bq(Y),right:fconst(s),left:mono(Q(1,k*k),2)}],
  eqs:[`y=${top.tex('x')}`,`x=${s}`,`y=0`],text:`the region bounded by \\(y=${top.tex('x')}\\), the x-axis and the line \\(x=${s}\\)`,
  bounds:`The curve meets the x-axis at \\(x=0\\); the region runs to \\(x=${s}\\), where \\(y=${Y}\\). Solved for x, the curve is \\(x=${mono(Q(1,k*k),2).tex('y')}\\).`,
  xb:[0,s],yb:[0,Y],view:{xmin:-1,xmax:s+1,ymin:-1,ymax:Y+1},draw:[{f:top.f,tex:`y=${top.tex('x')}`,dom:[0,s+1]},{g:()=>s,tex:`x=${s}`,dom:[-1,Y+1]}],data:{kind:'under_root'}});
}
// y = x^p (or 1/8 x^3 ...), the line y = H and the y-axis (tests: y = 8, y = x^3, the y-axis)
function leftOfPower(){
 const p=pick([2,3]),n=pick(p===2?[1,2,3]:[1,2,3]),H=n**p,top=fconst(H),bot=mono(1,p);
 return region({xs:[{a:bq(0),b:bq(n),top,bot}],ys:[{a:bq(0),b:bq(H),right:mono(1,Q(1,p)),left:fconst(0)}],
  eqs:[`y=${H}`,`y=x^{${p}}`,`x=0`],text:`the region bounded by the line \\(y=${H}\\), the curve \\(y=x^{${p}}\\) and the y-axis`,
  bounds:`\\(x^{${p}}=${H}\\) at \\(x=${n}\\). Solved for x, the curve is \\(x=${mono(1,Q(1,p)).tex('y')}\\), and y runs from 0 to ${H}.`,
  xb:[0,n],yb:[0,H],view:{xmin:-1,xmax:n+1,ymin:-1,ymax:H+1},draw:[{f:bot.f,tex:`y=x^{${p}}`,dom:[0,n+0.6]},{f:()=>H,tex:`y=${H}`,dom:[-1,n+1]}],data:{kind:'left_of_power'}});
}
// y = x^p, the x-axis and x = n
function underPower(){
 const p=pick([1,2,3]),n=pick([1,2,3]),top=mono(1,p),Y=n**p;
 return region({xs:[{a:bq(0),b:bq(n),top,bot:fconst(0)}],ys:[{a:bq(0),b:bq(Y),right:fconst(n),left:mono(1,Q(1,p))}],
  eqs:[`y=${top.tex('x')}`,`x=${n}`,`y=0`],text:`the region bounded by \\(y=${top.tex('x')}\\), the x-axis and the line \\(x=${n}\\)`,
  bounds:`The curve meets the x-axis at \\(x=0\\); at \\(x=${n}\\), \\(y=${Y}\\). Solved for x, the curve is \\(x=${mono(1,Q(1,p)).tex('y')}\\).`,
  xb:[0,n],yb:[0,Y],view:{xmin:-1,xmax:n+1,ymin:-1,ymax:Y+1},draw:[{f:top.f,tex:`y=${top.tex('x')}`,dom:[0,n+0.4]},{g:()=>n,tex:`x=${n}`,dom:[-1,Y+1]}],data:{kind:'under_power'}});
}
// x = y^2 and x = m y + k (assignment: x = y + 2, x = y^2): one dy integral, two dx integrals
function sidewaysLine(){
 const [m,r1,r2]=pick([[1,-1,2],[1,-2,3],[1,-3,4],[2,-1,3],[2,-2,4]]),k=-r1*r2;
 const sq=mono(1,Q(1,2)),nsq=mono(-1,Q(1,2)),ln=line(Q(1,m),Q(-k,m)),xl=line(m,k);
 return region({xs:[{a:bq(0),b:bq(r1*r1),top:sq,bot:nsq},{a:bq(r1*r1),b:bq(r2*r2),top:sq,bot:ln}],ys:[{a:bq(r1),b:bq(r2),right:xl,left:mono(1,2)}],
  eqs:[`x=y^{2}`,`x=${xl.tex('y')}`],text:`the region enclosed by \\(x=y^{2}\\) and \\(x=${xl.tex('y')}\\)`,
  bounds:`Set \\(y^{2}=${xl.tex('y')}\\): \\(y^{2}-${m===1?'':m}y-${k}=(y-${r2})(y+${-r1})=0\\), so \\(y=${r1}\\) and \\(y=${r2}\\) (the points \\((${r1*r1},${r1})\\) and \\((${r2*r2},${r2})\\)). Solved for y, the line is \\(y=${ln.tex('x')}\\).`,
  xb:[0,r2*r2],yb:[r1,r2],view:{xmin:-1,xmax:r2*r2+1,ymin:r1-1,ymax:r2+1},draw:[{g:y=>y*y,tex:'x=y^{2}',dom:[r1-0.8,r2+0.8]},{g:y=>m*y+k,tex:`x=${xl.tex('y')}`,dom:[r1-1,r2+1]}],
  data:{kind:'sideways_line',dyBetter:true,splitX:r1*r1}});
}
// y = c sqrt(x), y = x - k and the x-axis (notes: sqrt(x), x - 2): one dy integral, two dx integrals
function rootLineAxis(){
 const [c,t]=pick([[1,2],[1,3],[1,4],[2,3],[2,4]]),k=t*t-c*t,top=mono(c,Q(1,2)),Y=c*t;
 return region({xs:[{a:bq(0),b:bq(k),top,bot:fconst(0)},{a:bq(k),b:bq(t*t),top,bot:line(1,-k)}],ys:[{a:bq(0),b:bq(Y),right:line(1,k),left:mono(Q(1,c*c),2)}],
  eqs:[`y=${top.tex('x')}`,`y=x-${k}`,'y=0'],text:`the region in the first quadrant bounded above by \\(y=${top.tex('x')}\\) and below by the x-axis and the line \\(y=x-${k}\\)`,
  bounds:`\\(${top.tex('x')}=x-${k}\\) at \\(x=${t*t}\\) (then \\(y=${Y}\\)); the line meets the x-axis at \\(x=${k}\\). In terms of y the left boundary is \\(x=${mono(Q(1,c*c),2).tex('y')}\\) and the right boundary is \\(x=y+${k}\\), for \\(0\\le y\\le ${Y}\\).`,
  xb:[0,t*t],yb:[0,Y],view:{xmin:-1,xmax:t*t+1,ymin:-1,ymax:Y+1},draw:[{f:x=>c*Math.sqrt(x),tex:`y=${top.tex('x')}`,dom:[0,t*t+1]},{f:x=>x-k,tex:`y=x-${k}`,dom:[k-1,t*t+1]}],
  data:{kind:'root_line_axis',dyBetter:true,splitX:k}});
}
// y = c - k x^2 and the x-axis (assignments: 1 - x^2, 2 - x^2 with the x-axis); half: first quadrant
function cap(half=false){
 const k=pick([1,1,2]),n=pick(k===1?[1,2,3]:[1,2]),c=k*n*n,top=fp(padd(pc(c),pm(-k,2)));
 const w=y=>Math.sqrt(Math.max(0,(c-y)/k));
 const right=fnc({tex:v=>`\\sqrt{${k===1?'':`\\frac{`}${c}-${v}${k===1?'':`}{${k}}`}}`,key:v=>`sqrt((${c}-${v})/${k})`,f:w});
 const left=half?fconst(0):fnc({tex:v=>`-${right.tex(v)}`,key:v=>`-sqrt((${c}-${v})/${k})`,f:y=>-w(y)});
 const s2=fp(half?P([{c:Q(c,k),e:Q(0)},{c:Q(-1,k),e:Q(1)}]):P([{c:Q(4*c,k),e:Q(0)},{c:Q(-4,k),e:Q(1)}]));
 const wid=half?right:fnc({tex:v=>`2${right.tex(v)}`,key:v=>`2*sqrt((${c}-${v})/${k})`,f:y=>2*right.f(y)});
 return region({xs:[{a:bq(half?0:-n),b:bq(n),top,bot:fconst(0)}],ys:[{a:bq(0),b:bq(c),right,left,s2,w:wid}],
  eqs:[`y=${top.tex('x')}`,'y=0'],text:half?`the region in the first quadrant bounded by \\(y=${top.tex('x')}\\) and the coordinate axes`:`the region enclosed by \\(y=${top.tex('x')}\\) and the x-axis`,
  bounds:`\\(${top.tex('x')}=0\\) at \\(x=\\pm ${n}\\); the top of the region is \\(y=${c}\\). Solved for x, \\(x=\\pm\\sqrt{${k===1?'':`\\frac{`}${c}-y${k===1?'':`}{${k}}`}}\\).`,
  xb:[half?0:-n,n],yb:[0,c],view:{xmin:-n-1,xmax:n+1,ymin:-1,ymax:c+1},draw:[{f:top.f,tex:`y=${top.tex('x')}`,dom:[-n-0.5,n+0.5]}],data:{kind:half?'half_cap':'cap',half}});
}
// x^2 + y^2 = r^2: the upper half disk (semicircle on the x-axis) or the whole disk
function disk(whole=false){
 const r=pick([1,2,3]),r2=r*r,root=v=>`\\sqrt{${r2}-${v}^{2}}`;
 const top=fnc({tex:v=>root(v),key:v=>`sqrt(${r2}-${v}^2)`,f:t=>Math.sqrt(Math.max(0,r2-t*t))});
 const neg=fnc({tex:v=>`-${root(v)}`,key:v=>`-sqrt(${r2}-${v}^2)`,f:t=>-Math.sqrt(Math.max(0,r2-t*t))});
 const s2x=fp(whole?P([{c:Q(4*r2),e:Q(0)},{c:Q(-4),e:Q(2)}]):P([{c:Q(r2),e:Q(0)},{c:Q(-1),e:Q(2)}])),s2y=fp(P([{c:Q(4*r2),e:Q(0)},{c:Q(-4),e:Q(2)}]));
 const w2=fnc({tex:v=>`2${root(v)}`,key:v=>`2*sqrt(${r2}-${v}^2)`,f:t=>2*Math.sqrt(Math.max(0,r2-t*t))});
 return region({xs:[{a:bq(-r),b:bq(r),top,bot:whole?neg:fconst(0),s2:s2x,...(whole?{w:w2}:{})}],ys:[{a:bq(whole?-r:0),b:bq(r),right:top,left:neg,s2:s2y,w:w2}],
  eqs:whole?[`x^{2}+y^{2}=${r2}`]:[`y=\\sqrt{${r2}-x^{2}}`,'y=0'],text:whole?`the disk \\(x^{2}+y^{2}\\le ${r2}\\)`:`the region enclosed by the semicircle \\(y=\\sqrt{${r2}-x^{2}}\\) of radius ${r} and the x-axis`,
  bounds:`The circle has radius ${r}: x runs from \\(-${r}\\) to \\(${r}\\)${whole?'':` and y from 0 to ${r}`}; solved for x, \\(x=\\pm\\sqrt{${r2}-y^{2}}\\).`,
  xb:[-r,r],yb:[whole?-r:0,r],view:{xmin:-r-1,xmax:r+1,ymin:whole?-r-1:-1,ymax:r+1},draw:[{f:top.f,tex:`y=\\sqrt{${r2}-x^{2}}`,dom:[-r,r]},...(whole?[{f:neg.f,tex:`y=-\\sqrt{${r2}-x^{2}}`,dom:[-r,r]}]:[])],data:{kind:whole?'disk':'semicircle'}});
}
// triangle with vertices (0,0), (a,0), (0,b)
function triangle(){
 const a=pick([1,2,3,4]),b=pick([1,2,3,4]),hyp=line(Q(-b,a),b);
 return region({xs:[{a:bq(0),b:bq(a),top:hyp,bot:fconst(0)}],ys:[{a:bq(0),b:bq(b),right:line(Q(-a,b),a),left:fconst(0)}],
  eqs:[`y=${hyp.tex('x')}`,'x=0','y=0'],text:`the triangular region with vertices \\((0,0)\\), \\((${a},0)\\) and \\((0,${b})\\)`,
  bounds:`The slanted side is \\(y=${hyp.tex('x')}\\), or solved for x, \\(x=${line(Q(-a,b),a).tex('y')}\\); x runs from 0 to ${a} and y from 0 to ${b}.`,
  xb:[0,a],yb:[0,b],view:{xmin:-1,xmax:a+1,ymin:-1,ymax:b+1},draw:[{f:hyp.f,tex:`y=${hyp.tex('x')}`,dom:[-0.3,a+0.3]}],data:{kind:'triangle'}});
}
// x = a y^2 - y^3 and the y-axis in the first quadrant (shells assignment); only horizontal slices
function sidewaysCubic(){
 const a=pick([2,3]),g=fp(P([{c:Q(a),e:Q(2)},{c:Q(-1),e:Q(3)}]));
 return region({xs:null,ys:[{a:bq(0),b:bq(a),right:g,left:fconst(0)}],eqs:[`x=${g.tex('y')}`,'x=0'],
  text:`the region in the first quadrant enclosed by \\(x=${g.tex('y')}\\) and the y-axis`,
  bounds:`\\(${g.tex('y')}=y^{2}(${a}-y)=0\\) at \\(y=0\\) and \\(y=${a}\\).`,yb:[0,a],
  view:{xmin:-1,xmax:Math.ceil(4*a**3/27)+1,ymin:-1,ymax:a+1},draw:[{g:g.f,tex:`x=${g.tex('y')}`,dom:[-0.4,a+0.3]}],data:{kind:'sideways_cubic',dyOnly:true}});
}
// x = y^2 and x = m y (or a constant c): horizontal-slice regions for area in terms of y
function sidewaysPair(){
 const m=pick([1,2,3,4]),g=mono(1,2),ln=line(m,0);
 return region({xs:[{a:bq(0),b:bq(m*m),top:mono(1,Q(1,2)),bot:line(Q(1,m),0)}],ys:[{a:bq(0),b:bq(m),right:ln,left:g}],eqs:['x=y^{2}',`x=${ln.tex('y')}`],
  text:`the region enclosed by \\(x=y^{2}\\) and \\(x=${ln.tex('y')}\\)`,bounds:`\\(y^{2}=${ln.tex('y')}\\) at \\(y=0\\) and \\(y=${m}\\).`,xb:[0,m*m],yb:[0,m],
  view:{xmin:-1,xmax:m*m+1,ymin:-1,ymax:m+1},draw:[{g:g.f,tex:'x=y^{2}',dom:[-0.5,m+0.6]},{g:ln.f,tex:`x=${ln.tex('y')}`,dom:[-0.3,m+0.6]}],data:{kind:'sideways_pair'}});
}
// y = m1 x, y = m2 x and x = b: one dx integral, two dy integrals (the right boundary changes at y = m2 b)
function wedge(){
 const [m1,m2]=pick([[1,2],[1,3],[2,3],[Q(1,2),1]]).map(q=>typeof q==='number'?Q(q):q),b=pick([1,2,3]);
 const lo=line(m1,0),hi=line(m2,0),y1=qv(m1)*b,y2=qv(m2)*b;
 return region({xs:[{a:bq(0),b:bq(b),top:hi,bot:lo}],ys:[{a:bq(0),b:bq(nice(y1)),right:line(Q(m1.d,m1.n),0),left:line(Q(m2.d,m2.n),0)},{a:bq(nice(y1)),b:bq(nice(y2)),right:fconst(b),left:line(Q(m2.d,m2.n),0)}],
  eqs:[`y=${hi.tex('x')}`,`y=${lo.tex('x')}`,`x=${b}`],text:`the region bounded by \\(y=${hi.tex('x')}\\), \\(y=${lo.tex('x')}\\) and \\(x=${b}\\)`,
  bounds:`The lines meet at the origin and reach \\(x=${b}\\) at \\(y=${nice(y1)}\\) and \\(y=${nice(y2)}\\). With horizontal slices the right boundary is \\(x=${line(Q(m1.d,m1.n),0).tex('y')}\\) up to \\(y=${nice(y1)}\\) and \\(x=${b}\\) above it.`,
  xb:[0,b],yb:[0,nice(y2)],view:{xmin:-1,xmax:b+1,ymin:-1,ymax:Math.ceil(y2)+1},draw:[{f:hi.f,tex:`y=${hi.tex('x')}`,dom:[-0.3,b+0.4]},{f:lo.f,tex:`y=${lo.tex('x')}`,dom:[-0.3,b+0.4]},{g:()=>b,tex:`x=${b}`,dom:[-1,y2+1]}],data:{kind:'wedge',dxBetter:true,splitY:y1}});
}
// y = k/x on [a, b] and the x-axis (notes: 4/x, x = 2, x = 4)
function reciprocal(){
 const k=pick([2,4,6]),a=pick([1,2]),b=a*2,top=mono(k,-1);
 return region({xs:[{a:bq(a),b:bq(b),top,bot:fconst(0)}],ys:[{a:bq(0),b:bq(Q(k,b)),right:fconst(b),left:fconst(a)},{a:bq(Q(k,b)),b:bq(Q(k,a)),right:mono(k,-1),left:fconst(a)}],
  eqs:[`y=\\frac{${k}}{x}`,'y=0',`x=${a}`,`x=${b}`],text:`the region bounded by \\(y=\\frac{${k}}{x}\\), the x-axis, \\(x=${a}\\) and \\(x=${b}\\)`,
  bounds:`x runs from ${a} to ${b}; the curve falls from \\(y=${C.U5.qtex(Q(k,a))}\\) to \\(y=${C.U5.qtex(Q(k,b))}\\).`,xb:[a,b],yb:[0,k/a],
  view:{xmin:-1,xmax:b+2,ymin:-1,ymax:Math.ceil(k/a)+1},draw:[{f:top.f,tex:`y=\\frac{${k}}{x}`,dom:[0.3,b+2]},{g:()=>a,tex:`x=${a}`,dom:[-1,k/a+1]},{g:()=>b,tex:`x=${b}`,dom:[-1,k/a+1]}],data:{kind:'reciprocal'}});
}
const EXACT={pair,underRoot,leftOfPower,underPower,sidewaysLine,rootLineAxis,cap,halfCap:()=>cap(true),semicircle:()=>disk(false),disk:()=>disk(true),triangle,sidewaysCubic,sidewaysPair,wedge,reciprocal};

// ---------- calculator regions ----------
const fx=(tex,key,f)=>fnc({tex:v=>tex.replace(/@/g,v),key:v=>key.replace(/@/g,v),f});
// y = a ln(x+1), y = b - x and the x-axis (tests 2023-2026, calculator question 1)
function logLine(){
 const a=pick([1,2,3,4]),b=pick([2,3,4,5]),g=x=>a*Math.log(x+1)-(b-x) /* the curve rises from 0 and the line falls to 0: one crossing */,xs=zeros(g,0,b);if(xs.length!==1)return null;const p=xs[0],Y=b-p;
 const lg=fx(`${a}\\ln\\left(@+1\\right)`,`${a}*ln(@+1)`,x=>a*Math.log(x+1)),ln=fx(`${b}-@`,`${b}-@`,x=>b-x);
 return region({xs:[{a:bq(0),b:bn(p),top:lg,bot:fconst(0)},{a:bn(p),b:bq(b),top:ln,bot:fconst(0)}],
  ys:[{a:bq(0),b:bn(Y),right:fx(`${b}-@`,`${b}-@`,y=>b-y),left:fx(`e^{\\frac{@}{${a}}}-1`,`e^(@/${a})-1`,y=>Math.exp(y/a)-1)}],
  eqs:['y=0',`y=${a}\\ln(x+1)`,`y=-x+${b}`],text:`the region enclosed by \\(y=0\\), \\(y=${a}\\ln(x+1)\\) and \\(y=-x+${b}\\)`,
  bounds:`The curve meets the x-axis at \\(x=0\\) and the line at \\(x=b\\approx${fixed(p,4)}\\) (calculator), where \\(y\\approx${fixed(Y,4)}\\); the line meets the x-axis at \\(x=${b}\\). Solved for x: \\(x=e^{\\frac{y}{${a}}}-1\\) and \\(x=${b}-y\\).`,
  xb:[0,b],yb:[0,Y],view:{xmin:-1,xmax:b+1,ymin:-1,ymax:Math.ceil(Y)+1},draw:[{f:lg.f,tex:`y=${a}\\ln(x+1)`,dom:[-0.6,b+1]},{f:ln.f,tex:`y=-x+${b}`,dom:[-1,b+1]}],data:{kind:'log_line',p}});
}
// y = 1 + ln x and y = x^2 - 1 (tests, calculator questions 2-5)
function logParabola(){
 const c=pick([1,2]),d=pick([1,2,3]),f=x=>c+Math.log(x) /* f - g is c + d > 0 at x = 1 and tends to -infinity at both ends: two crossings */,g=x=>x*x-d,r=zeros(x=>f(x)-g(x),0.02,4);if(r.length!==2)return null;const [p,q]=r;
 const F=fx(`${c}+\\ln @`,`${c}+ln(@)`,f),G=fx(`@^{2}-${d}`,`@^2-${d}`,g),y0=g(p),y1=g(q);
 // horizontal slices: left x = e^{y-c}, right x = sqrt(y+d)
 return region({xs:[{a:bn(p),b:bn(q),top:F,bot:G}],ys:[{a:bn(y0),b:bn(y1),right:fx(`\\sqrt{@+${d}}`,`sqrt(@+${d})`,y=>Math.sqrt(y+d)),left:fx(`e^{@-${c}}`,`e^(@-${c})`,y=>Math.exp(y-c))}],
  eqs:[`f(x)=${c}+\\ln x`,`g(x)=x^{2}-${d}`],text:`the region enclosed by \\(f(x)=${c}+\\ln x\\) and \\(g(x)=x^{2}-${d}\\)`,
  bounds:`With a calculator, \\(f(x)=g(x)\\) at \\(x=A\\approx${fixed(p,4)}\\) and \\(x=B\\approx${fixed(q,4)}\\) (y from ${fixed(y0,4)} to ${fixed(y1,4)}). Solved for x: \\(x=e^{y-${c}}\\) and \\(x=\\sqrt{y+${d}}\\).`,
  xb:[p,q],yb:[y0,y1],view:{xmin:-1,xmax:Math.ceil(q)+1,ymin:Math.floor(y0)-1,ymax:Math.ceil(y1)+1},draw:[{f,tex:`y=${c}+\\ln x`,dom:[0.05,q+1]},{f:g,tex:`y=x^{2}-${d}`,dom:[-0.5,q+0.8]}],data:{kind:'log_parabola',p,q}});
}
// y = e^{kx}, the axes and x = s (tests: e^{2x}, x = 1)
function expAxes(){
 const k=pick([1,2]),s=1,f=x=>Math.exp(k*x),top=fx(k===1?'e^{@}':`e^{${k}@}`,`e^(${k}*@)`,f),Y=f(s);
 return region({xs:[{a:bq(0),b:bq(s),top,bot:fconst(0)}],ys:[{a:bq(0),b:bq(1),right:fconst(s),left:fconst(0)},{a:bq(1),b:bn(Y,k===1?'e':`e^{${k}}`),right:fconst(s),left:fx(k===1?'\\ln @':`\\frac{\\ln @}{${k}}`,`ln(@)/${k}`,y=>Math.log(y)/k)}],
  eqs:[`y=${top.tex('x')}`,'y=0','x=0',`x=${s}`],text:`the region enclosed by the x-axis, the y-axis, \\(x=${s}\\) and \\(y=${top.tex('x')}\\)`,
  bounds:`x runs from 0 to ${s}; the curve rises from \\(y=1\\) to \\(y=${k===1?'e':`e^{${k}}`}\\). Below \\(y=1\\) the region is a rectangle; above it the left boundary is \\(x=${k===1?'\\ln y':`\\frac{\\ln y}{${k}}`}\\).`,
  xb:[0,s],yb:[0,Y],view:{xmin:-1,xmax:s+1,ymin:-1,ymax:Math.ceil(Y)+1},draw:[{f,tex:`y=${top.tex('x')}`,dom:[-1,s+0.3]},{g:()=>s,tex:`x=${s}`,dom:[-1,Y+1]}],data:{kind:'exp_axes'}});
}
// y = cos x and y = x^2 (or a x^2)
function cosParabola(){
 const a=pick([1,2,3]),k=pick([1,2]),f=x=>k*Math.cos(x),g=x=>a*x*x,r=zeros(x=>f(x)-g(x),0,2);if(r.length!==1)return null;const p=r[0];
 const ct=`${k===1?'':k}\\cos x`,F=fx(`${k===1?'':k}\\cos @`,`${k}*cos(@)`,f),G=fx(`${a===1?'':a}@^{2}`,`${a}*@^2`,g);
 return region({xs:[{a:bn(-p),b:bn(p),top:F,bot:G}],ys:null,eqs:[`y=${ct}`,`y=${G.tex('x')}`],text:`the region enclosed by \\(y=${ct}\\) and \\(y=${G.tex('x')}\\)`,
  bounds:`With a calculator, \\(${ct}=${G.tex('x')}\\) at \\(x\\approx\\pm${fixed(p,4)}\\).`,xb:[-p,p],yb:[0,k],
  view:{xmin:-2,xmax:2,ymin:-1,ymax:k+1},draw:[{f,tex:`y=${ct}`,dom:[-2,2]},{f:g,tex:`y=${G.tex('x')}`,dom:[-1.4,1.4]}],data:{kind:'cos_parabola',p}});
}
// y = e^(x/2) and y = 4 - x^2 (enclosed, both intersections from the calculator)
function expParabola(){
 const c=pick([3,4,5,6]),f=x=>Math.exp(x/2),g=x=>c-x*x,r=zeros(x=>g(x)-f(x),-3,3);if(r.length!==2)return null;const [p,q]=r;
 return region({xs:[{a:bn(p),b:bn(q),top:fx(`${c}-@^{2}`,`${c}-@^2`,g),bot:fx('e^{\\frac{@}{2}}','e^(@/2)',f)}],ys:null,eqs:[`y=${c}-x^{2}`,'y=e^{\\frac{x}{2}}'],
  text:`the region enclosed by \\(y=${c}-x^{2}\\) and \\(y=e^{\\frac{x}{2}}\\)`,bounds:`With a calculator, the curves meet at \\(x\\approx${fixed(p,4)}\\) and \\(x\\approx${fixed(q,4)}\\).`,xb:[p,q],
  view:{xmin:-3,xmax:3,ymin:-1,ymax:c+1},draw:[{f:g,tex:`y=${c}-x^{2}`,dom:[-2.6,2.6]},{f,tex:'y=e^{\\frac{x}{2}}',dom:[-3,2.8]}],data:{kind:'exp_parabola',p,q}});
}
const CALC={logLine,logParabola,expAxes,cosParabola,expParabola};
function build(name,...args){for(let i=0;i<20;i++){const R=(EXACT[name]||CALC[name])(...args);if(R)return R;}throw Error(`region ${name} failed`);}

// ---------- worked steps shared by the engines ----------
const {step,setupTex,evalSteps,exactValue,numValue,etex}=C;
const axisTex=a=>`${a.type}=${a.tex??a.c}`;
function sliceText(R,v){
 const ps=v==='x'?R.xs:R.ys;
 return ps.map(p=>v==='x'?`from \\(x=${p.a.tex}\\) to \\(x=${p.b.tex}\\) the top is \\(y=${p.top.tex('x')}\\) and the bottom is \\(y=${p.bot.tex('x')}\\)`:`from \\(y=${p.a.tex}\\) to \\(y=${p.b.tex}\\) the right side is \\(x=${p.right.tex('y')}\\) and the left side is \\(x=${p.left.tex('y')}\\)`).join('; ');
}
function boundsStep(R,heading='Find the bounds.'){return step(heading,R.bounds||'');}
function areaWork(R,v,terms){
 const hv=v==='x'?'vertical slices of width \\(dx\\): each has height top minus bottom':'horizontal slices of height \\(dy\\): each has length right minus left';
 return step(`Set up the area with ${v==='x'?'vertical':'horizontal'} slices.`,`Use ${hv}. ${sliceText(R,v).replace(/^./,c=>c.toUpperCase())}${terms.length>1?'. The boundary changes, so the area needs one integral for each piece':''}.`,`A=${setupTex(terms)}`);
}
function washerWork(R,axis,terms){
 const horiz=axis.type==='y',v=horiz?'x':'y';
 const words=horiz?`The axis \\(${axisTex(axis)}\\) is horizontal, so slice perpendicular to it: the slices are ${terms[0].r?'washers':'disks'} of thickness \\(dx\\).`:`The axis \\(${axisTex(axis)}\\) is vertical, so slice perpendicular to it: the slices are ${terms[0].r?'washers':'disks'} of thickness \\(dy\\), and every boundary is written as x in terms of y.`;
 const radii=terms.map(t=>`\\(R(${v})=${t.R.tex(v)}\\)${t.r?` and \\(r(${v})=${t.r.tex(v)}\\)`:''}${terms.length>1?` for \\(${t.a.tex}\\le ${v}\\le ${t.b.tex}\\)`:''}`).join('; ');
 const where=horiz?(terms[0].R&&R.xs&&R.xs[0].bot.f(R.xs[0].a.v+1e-6)>=axis.c-1e-9?'The region lies above the axis, so each radius is a boundary height minus':'The region lies below the axis, so each radius is')
  :(R.ys&&R.ys[0].left.f(R.ys[0].a.v+1e-6)>=axis.c-1e-9?'The region lies to the right of the axis, so each radius is a boundary x-value minus':'The region lies to the left of the axis, so each radius is');
 const tail=horiz?(where.endsWith('minus')?` \\(${axis.c}\\).`:` \\(${axis.c}\\) minus a boundary height.`):(where.endsWith('minus')?` \\(${axis.c}\\).`:` \\(${axis.c}\\) minus a boundary x-value.`);
 return step('Choose the slices.',words)+step('Measure the radii from the axis.',`${where}${tail} The outer radius R reaches the boundary farther from the axis${terms[0].r?'; the inner radius r reaches the nearer one':''}: ${radii}.`)+step('Set up the volume.',terms[0].r?'Each washer has area \\(\\pi\\left(R^{2}-r^{2}\\right)\\) (square each radius before subtracting).':'Each disk has area \\(\\pi R^{2}\\).',`V=${setupTex(terms)}`);
}
function shellWork(R,axis,terms){
 const vert=axis.type==='x',v=vert?'x':'y';
 const words=vert?`The axis \\(${axisTex(axis)}\\) is vertical, so the shells are vertical: slice parallel to the axis with thickness \\(dx\\).`:`The axis \\(${axisTex(axis)}\\) is horizontal, so the shells are horizontal: slice parallel to the axis with thickness \\(dy\\), and every boundary is written as x in terms of y.`;
 const t=terms[0];
 return step('Choose the shells.',words)+step('Find the radius and height.',`The radius is the distance from the axis to the shell: \\(r(${v})=${t.rad.tex(v)}\\). The height is ${vert?'top minus bottom':'right minus left'}: ${terms.map(q=>`\\(h(${v})=${q.htex}\\)${terms.length>1?` for \\(${q.a.tex}\\le ${v}\\le ${q.b.tex}\\)`:''}`).join('; ')}.`)+step('Set up the volume.','Each shell has volume \\(2\\pi\\,r\\,h\\) times its thickness.',`V=${setupTex(terms)}`);
}
function sectionWork(R,v,shape,terms){
 const t=terms[0];
 return step('Choose the slices.',`Cross sections are perpendicular to the ${v}-axis, so integrate with respect to \\(${v}\\). ${v==='x'?'Each slice is vertical; its length across the region is top minus bottom':'Each slice is horizontal; its length across the region is right minus left'}: ${terms.map(q=>`\\(s(${v})=${q.stex}\\)${terms.length>1?` for \\(${q.a.tex}\\le ${v}\\le ${q.b.tex}\\)`:''}`).join('; ')}.`)
  +step('Find the area of one cross section.',`${shape.rule} So \\(A(${v})=${shape.area(t.stex)}\\).`)
  +step('Set up the volume.','Add the cross sections: integrate their area.',`V=${setupTex(terms)}`);
}
function evalWork(terms,heading='Evaluate.'){
 const parts=terms.map(evalSteps);if(!parts.every(Boolean))return '';
 const eqs=[];for(const s of parts)eqs.push(s.expanded,`=${s.anti}`,`=${s.value}`);
 const total=exactValue(terms);
 return step(heading,terms.length>1?'Evaluate each integral and add the results.':'Expand the integrand, find an antiderivative and evaluate it at the limits.',...eqs,...(terms.length>1?[`\\text{Total}=${etex(total)}`]:[]));
}
function calcWork(terms,label='V'){return step('Evaluate with the calculator.','Use the numerical integration feature; store intersection values instead of retyping rounded ones.',`${label}=${setupTex(terms)}\\approx ${fixed(numValue(terms),3)}`);}

window.BatchMathUnit6Regions=Object.freeze({EXACT,CALC,build,mono,line,fx,work:Object.freeze({axisTex,sliceText,boundsStep,areaWork,washerWork,shellWork,sectionWork,evalWork,calcWork})});
})();
