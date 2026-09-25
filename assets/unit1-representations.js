(function(){'use strict';
const R=()=>window.BatchMathRNG.random(),ri=(a,b)=>Math.floor(R()*(b-a+1))+a,pick=a=>a[ri(0,a.length-1)],M=s=>`\\(${s}\\)`,T=String.raw;
const fmt=x=>Number(x.toFixed(5)).toString(),limit=(a,side='')=>T`\\lim_{x\\to${a}${side?`^{${side}}`:''}}f(x)`;
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=ri(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;}
function mc(id,variant,question,answer,wrong,explanation,data){
 let choices=[...new Set([answer,...wrong].map(String))].slice(0,4);
 for(let n=-9;choices.length<4;n++)if(!choices.includes(String(n)))choices.push(String(n));
 choices=shuffle(choices);
 return{id,variant,questionHtml:question,choices,correctIndex:choices.indexOf(String(answer)),choicesAreText:true,explanation,representationData:data};
}

/* Tables deliberately assess nearby behavior only. There is no f(a) row,
   no undefined-versus-DNE distractor, and no unbounded table family. */
function table(){
 const kind=pick(['matching','matching','jump']),a=ri(-5,5),left=ri(-8,8);
 const right=kind==='jump'?pick(Array.from({length:17},(_,i)=>i-8).filter(x=>x!==left)):left;
 const ask=pick(['-','+','both']);
 const offsets=[-.1,-.01,-.001,.001,.01,.1],xs=offsets.map(d=>a+d);
 const slopes=[-.8,-.4,.4,.8],ml=pick(slopes),mr=pick(slopes);
 const ys=offsets.map(d=>(d<0?left+ml*d:right+mr*d));
 const answer=ask==='-'?String(left):ask==='+'?String(right):left===right?String(left):'DNE';
 const prompt=`Use the table to estimate ${M(limit(a,ask==='both'?'':ask))}.`;
 const reason=ask==='-'?`The entries with \\(x<${a}\\) move toward \\(${left}\\), so the estimated left-hand limit is \\(${left}\\). A finite table supports an estimate rather than a proof.`
  :ask==='+'?`The entries with \\(x>${a}\\) move toward \\(${right}\\), so the estimated right-hand limit is \\(${right}\\). A finite table supports an estimate rather than a proof.`
  :left===right?`The values on both sides move toward \\(${left}\\). Because the two one-sided estimates agree, the table suggests that the two-sided limit is \\(${left}\\). A finite table supports an estimate rather than a proof.`
  :`From the left, the values move toward \\(${left}\\); from the right, they move toward \\(${right}\\). Since those one-sided values differ, the two-sided limit is DNE.`;
 const grid=`<div class="u1-table"><table><tr><th scope="row">x</th>${xs.map(x=>`<td>${fmt(x)}</td>`).join('')}</tr><tr><th scope="row">f(x)</th>${ys.map(y=>`<td>${fmt(y)}</td>`).join('')}</tr></table></div>`;
 return mc(`table-limit-${kind}-${a}-${left}-${right}-${ml}-${mr}-${ask}`,'table_'+kind,`<p>${prompt}</p>${grid}`,answer,[String(left),String(right),'DNE',String(left+1)],reason,{kind,a,L:left,right,ask,xs,ys});
}

let graphState=null,activeMode=null;
function makeGraphState(){
 const xMin=-6,xMax=6,yMin=-7,yMax=7,xs=[-3,0,3];
 const featureOrders=[['hole','jump','continuous'],['jump','continuous','hole'],['continuous','hole','jump']];
 const features=pick(featureOrders);
 const points=features.map((kind,i)=>{
  const x=xs[i],left=ri(-4,4),right=kind==='jump'?pick(Array.from({length:9},(_,j)=>j-4).filter(v=>v!==left)):left;
  const pointValue=kind==='continuous'?left:kind==='jump'?pick([left,right]):null;
  return{x,kind,left,right,pointValue};
 });
 const endpointStart=ri(-4,4),endpointEnd=ri(-4,4);
 const W=900,H=585,X=x=>70+(x-xMin)*760/(xMax-xMin),Y=y=>505-(y-yMin)*420/(yMax-yMin);
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Graph of f on the closed domain from negative six to six" class="u1-graph u1-graph-large"><defs><clipPath id="u1-limit-graph-clip"><rect x="70" y="70" width="760" height="435"/></clipPath></defs><rect x="70" y="70" width="760" height="435" fill="#090909"/>`;
 for(let x=xMin;x<=xMax;x++)svg+=`<path d="M${X(x)},70 V505" stroke="#303030"/><text x="${X(x)}" y="535" text-anchor="middle" fill="#e8e8e8" font-size="18">${x}</text>`;
 for(let y=yMin;y<=yMax;y++)svg+=`<path d="M70,${Y(y)} H830" stroke="#303030"/><text x="54" y="${Y(y)+6}" text-anchor="end" fill="#e8e8e8" font-size="18">${y}</text>`;
 svg+=`<path d="M70,${Y(0)} H830 M${X(0)},70 V505" stroke="#b7b7b7" stroke-width="2"/><text x="855" y="535" fill="white" font-size="21">x</text><text x="35" y="48" fill="white" font-size="21">y</text>`;
 const bounds=[xMin,...xs,xMax],segments=[];
 for(let i=0;i<4;i++){
  const leftX=bounds[i],rightX=bounds[i+1],start=i===0?endpointStart:points[i-1].right,end=i===3?endpointEnd:points[i].left;
  const bend=pick([-1.25,-.75,.75,1.25]),c1x=leftX+(rightX-leftX)/3,c2x=leftX+2*(rightX-leftX)/3;
  const c1y=Math.max(yMin+.4,Math.min(yMax-.4,start+bend)),c2y=Math.max(yMin+.4,Math.min(yMax-.4,end-bend));
  segments.push({left:leftX,right:rightX,start,end});
  svg+=`<path clip-path="url(#u1-limit-graph-clip)" d="M${X(leftX)},${Y(start)} C${X(c1x)},${Y(c1y)} ${X(c2x)},${Y(c2y)} ${X(rightX)},${Y(end)}" stroke="#f5c400" fill="none" stroke-width="4"/>`;
 }
 for(const p of points){
  for(const y of [...new Set([p.left,p.right])])svg+=`<circle cx="${X(p.x)}" cy="${Y(y)}" r="7" fill="#090909" stroke="#f5c400" stroke-width="3"/>`;
  if(p.pointValue!==null)svg+=`<circle cx="${X(p.x)}" cy="${Y(p.pointValue)}" r="7" fill="#f5c400" stroke="#f5c400"/>`;
 }
 svg+=`<circle cx="${X(xMin)}" cy="${Y(endpointStart)}" r="7" fill="#f5c400" stroke="#f5c400"/><circle cx="${X(xMax)}" cy="${Y(endpointEnd)}" r="7" fill="#f5c400" stroke="#f5c400"/></svg>`;

 const pointOrder=shuffle(points);
 const required=[
  {type:'both',point:pointOrder[0]},
  {type:'left',point:pointOrder[1]},
  {type:'right',point:pointOrder[2]}
 ];
 const extras=shuffle([
  ...points.flatMap(point=>['left','right','both'].map(type=>({type,point}))),
  {type:'endpoint-left',x:xMin,value:endpointStart},
  {type:'endpoint-right',x:xMax,value:endpointEnd}
 ]).filter(t=>!required.some(r=>r.type===t.type&&r.point===t.point));
 const count=ri(3,5),tasks=shuffle(required.concat(extras.slice(0,count-3)));
 return{xMin,xMax,points,segments,endpointStart,endpointEnd,svg,tasks,index:0};
}
function multiGraph(){
 if(!graphState||graphState.index>=graphState.tasks.length)graphState=makeGraphState();
 const s=graphState,task=s.tasks[s.index],part=s.index+1,total=s.tasks.length;s.index++;
 let answer,prompt,reason,wrong,data={multi:true,part,partCount:total,domain:[s.xMin,s.xMax]};
 if(task.type==='endpoint-left'){
  answer=String(task.value);prompt=`Find ${M(limit(task.x,'+'))}.`;
  reason=`The domain begins at \\(x=${task.x}\\). Following the graph from within the domain, the y-values approach \\(${task.value}\\), so the right-hand limit is \\(${task.value}\\).`;
  wrong=['DNE',String(task.value+1),String(-task.value)];data={...data,kind:'endpoint',a:task.x,ask:'right',leftLimit:null,rightLimit:task.value};
 }else if(task.type==='endpoint-right'){
  answer=String(task.value);prompt=`Find ${M(limit(task.x,'-'))}.`;
  reason=`The domain ends at \\(x=${task.x}\\). Following the graph from within the domain, the y-values approach \\(${task.value}\\), so the left-hand limit is \\(${task.value}\\).`;
  wrong=['DNE',String(task.value+1),String(-task.value)];data={...data,kind:'endpoint',a:task.x,ask:'left',leftLimit:task.value,rightLimit:null};
 }else{
  const p=task.point,l=p.left,r=p.right;data={...data,kind:p.kind,a:p.x,L:l,right:r,ask:task.type,leftLimit:l,rightLimit:r};
  if(task.type==='left'){
   answer=String(l);prompt=`Find ${M(limit(p.x,'-'))}.`;
   reason=`Trace the branch with \\(x<${p.x}\\) toward \\(x=${p.x}\\). Its y-values approach \\(${l}\\), so the left-hand limit is \\(${l}\\).`;
  }else if(task.type==='right'){
   answer=String(r);prompt=`Find ${M(limit(p.x,'+'))}.`;
   reason=`Trace the branch with \\(x>${p.x}\\) toward \\(x=${p.x}\\). Its y-values approach \\(${r}\\), so the right-hand limit is \\(${r}\\).`;
  }else{
   answer=l===r?String(l):'DNE';prompt=`Find ${M(limit(p.x))}.`;
   reason=l===r?`The left-hand and right-hand limits both equal \\(${l}\\). Because they agree, the two-sided limit is \\(${l}\\).`:`The left-hand limit is \\(${l}\\), while the right-hand limit is \\(${r}\\). Because they differ, the two-sided limit is DNE.`;
  }
  wrong=[String(l),String(r),'DNE',String(l+1)];
 }
 const q=`<div class="u1-graph-part"><strong>Graph set: Part ${part} of ${total}</strong></div><p>${prompt}</p><div class="u1-graph-domain">Domain: ${M(`[${s.xMin},${s.xMax}]`)}</div>${s.svg}`;
 return mc(`graph-set-${s.points.map(p=>`${p.kind}:${p.left}:${p.right}`).join('|')}-${part}-${task.type}-${data.a}`,'graph_multi_'+data.kind,q,answer,wrong,reason,data);
}
function graphPractice(){return multiGraph();}
function mixed(){if(graphState&&graphState.index<graphState.tasks.length)return multiGraph();return R()<.5?multiGraph():table();}

/* Retained for the Limits-at-Infinity engine; Introduction to Limits does not
   route to this generator. */
function asymptote(){
 const kind=pick(['horizontal','vertical','directions','crossing']),a=ri(-4,4),L=ri(-5,5),right=L+pick([-4,-2,2,4]);let question,answer,wrong,reason;
 if(kind==='horizontal'){const dir=pick(['\\infty','-\\infty']);question=`Given ${M(T`\\lim_{x\\to${dir}}f(x)=${L}`)}, identify the horizontal asymptote in that direction.`;answer=`y=${L}`;wrong=[`x=${L}`,`y=${L+1}`,'No horizontal asymptote'];reason=`The outputs approach ${M(String(L))} as x goes toward ${M(dir)}, so the graph approaches the horizontal line ${M(answer)}.`;}
 if(kind==='vertical'){const side=pick(['+','-']),inf=pick(['\\infty','-\\infty']);question=`Given ${M(T`\\lim_{x\\to${a}^{${side}}}f(x)=${inf}`)}, identify a vertical asymptote.`;answer=`x=${a}`;wrong=[`y=${a}`,`x=${a+1}`,'No vertical asymptote'];reason=`The function grows without bound as x approaches ${M(String(a))} from one side, so ${M(answer)} is a vertical asymptote.`;}
 if(kind==='directions'){question=`Given ${M(T`\\lim_{x\\to-\\infty}f(x)=${L}`)} and ${M(T`\\lim_{x\\to\\infty}f(x)=${right}`)}, identify the horizontal asymptotes.`;answer=`y=${L} and y=${right}`;wrong=[`x=${L} and x=${right}`,`Only y=${L}`,`Only y=${right}`];reason=`Each finite end limit gives a horizontal asymptote: ${M(`y=${L}`)} to the left and ${M(`y=${right}`)} to the right.`;}
 if(kind==='crossing'){question=`A function has horizontal asymptote ${M(`y=${L}`)} as ${M('x\\to\\infty')}. Must its graph avoid crossing that line?`;answer='No';wrong=['Yes'];reason=`A horizontal asymptote describes end behavior, not a barrier.`;}
 const p=mc(`asymptote-${kind}-${a}-${L}-${right}`,'asymptote_'+kind,`<p>${question}</p>`,answer,wrong,reason,{kind,a,L,right});if(kind==='crossing'){p.choices=['Yes','No'];p.correctIndex=1;}return p;
}

window.BMUnit1Representations={table,graph:graphPractice,multiGraph,mixed,asymptote,resetGraph:()=>{graphState=null;}};
const old=window.BatchMathAPTopicGenerators.get;
window.BatchMathAPTopicGenerators.get=slug=>slug==='introduction-to-limits'?(opts={})=>{
 const mode=opts.mode||'mixed';if(mode!==activeMode){activeMode=mode;graphState=null;}
 return mode==='graphs'?graphPractice():mode==='tables'?table():mixed();
}:old(slug);
})();
