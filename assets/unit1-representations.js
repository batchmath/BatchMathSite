(function(){'use strict';
const R=()=>window.BatchMathRNG.random(),ri=(a,b)=>Math.floor(R()*(b-a+1))+a,pick=a=>a[ri(0,a.length-1)],M=s=>`\\(${s}\\)`,T=String.raw;
const fmt=x=>Number(x.toFixed(5)).toString(),val=x=>x===Infinity?'\\infty':x===-Infinity?'-\\infty':String(x),limit=(a,side='')=>T`\lim_{x\to${a}${side?`^{${side}}`:''}}f(x)`;
function mc(id,variant,question,answer,wrong,explanation,data){let choices=[...new Set([answer,...wrong])].slice(0,4);for(let n=0;choices.length<(wrong.length===2&&wrong.includes('Yes')?2:4);n++)if(!choices.includes(String(n)))choices.push(String(n));for(let i=choices.length-1;i>0;i--){const j=ri(0,i);[choices[i],choices[j]]=[choices[j],choices[i]];}return{id,variant,questionHtml:question,choices,correctIndex:choices.indexOf(answer),choicesAreText:true,explanation,representationData:data};}
function table(){
 const kind=pick(['matching','jump','point','infinite']),a=ri(-4,4),L=ri(-7,7);let right=kind==='jump'?pick([-5,-4,-3,-2,-1,0,1,2,3,4,5].filter(x=>x!==L)):L;
 const sign=pick([-1,1]),opposite=pick([false,true]),side=pick(['-','+','both']),pointKind=pick(['same','different','missing']);
 const fa=pointKind==='missing'?null:pointKind==='same'?L:L+pick([-3,-2,2,3]);
 const xs=[-.1,-.01,-.001,0,.001,.01,.1].map(d=>a+d);
 const ys=xs.map(x=>{const d=x-a;if(d===0)return fa;return kind==='infinite'?sign*(opposite?Math.sign(d):1)/Math.abs(d):(d<0?L:right)+d;});
 const ask=kind==='point'?pick(['point','both']):side;let answer,reason,prompt;
 if(ask==='point'){answer=fa===null?'undefined':String(fa);prompt=`Read ${M(`f(${a})`)} from the table.`;reason=fa===null?`The entry at ${M(`x=${a}`)} is marked undefined, so ${M(`f(${a})`)} is undefined. Nearby values answer a different question: the limit.`:`Use the entry at ${M(`x=${a}`)}, which gives ${M(`f(${a})=${fa}`)}. The nearby values do not replace this point value.`;}
 else{
 const l=kind==='infinite'?sign*(opposite?-1:1)*Infinity:L,r=kind==='infinite'?sign*Infinity:right;
 answer=ask==='-'?val(l):ask==='+'?val(r):l===r?val(l):'DNE';prompt=`Use the table to estimate ${M(limit(a,ask==='both'?'':ask))}.`;
 reason=kind==='infinite'?`From the left, the displayed values suggest ${M(val(l))}; from the right, they suggest ${M(val(r))}. ${ask==='both'?(l===r?'Both sides suggest the same infinite behavior.':'The two sides suggest different behavior, so the two-sided limit is DNE.'):`Use the ${ask==='-'?'left':'right'} side requested.`}`:`The nearby left values suggest ${M(String(L))}, and the nearby right values suggest ${M(String(right))}. ${ask==='both'?(L===right?`They agree, so the estimated two-sided limit is ${M(String(L))}.`:'They disagree, so the table suggests the two-sided limit is DNE.'):`The requested ${ask==='-'?'left':'right'}-hand limit is estimated by that side.`}`;
 reason+=' A finite table suggests behavior; it does not prove a limit.';
 }
 const grid=`<div class="u1-table"><table><tr><th scope="row">x</th>${xs.map(x=>`<td>${fmt(x)}</td>`).join('')}</tr><tr><th scope="row">f(x)</th>${ys.map(y=>`<td>${y===null?'undefined':fmt(y)}</td>`).join('')}</tr></table></div>`;
 return mc(`table-${kind}-${a}-${L}-${right}-${sign}-${opposite}-${fa}-${ask}`,'table_'+kind,`<p>${prompt}</p>${grid}`,answer,[String(L),String(right),fa===null?'undefined':String(fa),'DNE','\\infty','-\\infty'],reason,{kind,a,L,right,fa,ask,xs,ys,sign,opposite});
}
function graph(){
 const kind=pick(['continuous','hole','jump','asymptote']),a=ri(-2,2),L=ri(-3,3),right=kind==='jump'?pick([-3,-2,-1,0,1,2,3].filter(x=>x!==L)):L;
 const fa=kind==='continuous'?L:pick([null,...[-4,-3,-2,-1,0,1,2,3,4].filter(x=>x!==L&&x!==right)]),sign=pick([-1,1]),even=pick([false,true]);
 const ml=pick([-1,-.5,.5,1]),mr=pick([-1,-.5,.5,1]),curve=pick([0,.25,-.25]);
 const ask=pick(['left','right','both','point','continuity']);
 const l=kind==='asymptote'?(even?sign:-sign)*Infinity:L,r=kind==='asymptote'?sign*Infinity:right;
 let answer,reason,prompt;
 if(ask==='point'){answer=fa===null?'undefined':String(fa);prompt=`Find ${M(`f(${a})`)}.`;reason=fa===null?`There is no filled point at ${M(`x=${a}`)}, so ${M(`f(${a})`)} is undefined.`:`The filled point at ${M(`x=${a}`)} has height ${M(String(fa))}, so ${M(`f(${a})=${fa}`)}. Open circles are excluded.`;}
 else if(ask==='continuity'){answer=kind==='continuous'?'Yes':'No';prompt=`Is ${M('f')} continuous at ${M(`x=${a}`)}?`;reason=kind==='continuous'?`Both branches approach ${M(String(L))}, and the filled point gives ${M(`f(${a})=${L}`)}. The limit equals the defined value, so the function is continuous.`:kind==='asymptote'?'The function is unbounded near this input, so it cannot have the finite limit required for continuity.':kind==='jump'?`The branches approach ${M(String(L))} and ${M(String(right))}. These unequal one-sided limits prevent continuity.`:`Both branches approach ${M(String(L))}, but ${fa===null?'the point value is undefined':`the filled point has the different value ${M(String(fa))}`}. Continuity requires the limit and defined value to agree.`;}
 else{answer=ask==='left'?val(l):ask==='right'?val(r):l===r?val(l):'DNE';prompt=`Find ${M(limit(a,ask==='left'?'-':ask==='right'?'+':''))}.`;reason=`Following the curve toward ${M(`x=${a}`)} from the left gives ${M(val(l))}; from the right it gives ${M(val(r))}. ${ask==='both'?(l===r?'The one-sided limits agree, giving the two-sided limit.':'The one-sided limits disagree, so the two-sided limit is DNE.'):`Use the ${ask==='left'?'left':'right'} branch requested.`} A filled point at the approach input does not change the limit.`;}
 const W=540,H=420,x0=a-4,x1=a+4,y0=-7,y1=7,X=x=>48+(x-x0)*444/8,Y=y=>370-(y-y0)*322/14;
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Graph of f. Determine the requested value at x equals ${a}." class="u1-graph"><defs><clipPath id="u1-clip"><rect x="48" y="48" width="444" height="322"/></clipPath></defs><rect x="48" y="48" width="444" height="322" fill="#090909"/>`;
 for(let x=x0;x<=x1;x++)svg+=`<path d="M${X(x)},48 V370" stroke="#333"/><text x="${X(x)}" y="392" text-anchor="middle" fill="#ddd" font-size="14">${x}</text>`;
 for(let y=y0;y<=y1;y++)svg+=`<path d="M48,${Y(y)} H492" stroke="#333"/><text x="35" y="${Y(y)+5}" text-anchor="end" fill="#ddd" font-size="14">${y}</text>`;
 svg+=`<path d="M48,${Y(0)} H492 M${X(0)},48 V370" stroke="#aaa" stroke-width="1.5"/><text x="510" y="392" fill="white">x</text><text x="15" y="30" fill="white">y</text>`;
 if(kind==='asymptote')svg+=`<path d="M${X(a)},48 V370" stroke="#888" stroke-dasharray="5 5"/>`;
 const f=x=>kind==='asymptote'?sign/(even?(x-a)**2:(x-a)):(x<a?L+ml*(x-a)+curve*(x-a)**2:right+mr*(x-a));
 for(const side of [-1,1]){let d='';for(let i=0;i<=160;i++){const x=side<0?a-4+i*(4-.025)/160:a+.025+i*(4-.025)/160;d+=(i?'L':'M')+X(x)+','+Y(f(x));}svg+=`<path clip-path="url(#u1-clip)" d="${d}" stroke="#f5c400" fill="none" stroke-width="3"/>`;
 if(kind==='asymptote'){const direction=side<0?Math.sign(l):Math.sign(r),xx=a+side*(even?Math.sqrt(1/6.6):1/6.6),px=X(xx),py=Y(direction*6.6);svg+=`<path d="M${px-5},${py+direction*9} L${px},${py} L${px+5},${py+direction*9}" stroke="#f5c400" fill="none" stroke-width="2"/>`;}}
 if(kind!=='asymptote')for(const y of [...new Set([L,right])])svg+=`<circle cx="${X(a)}" cy="${Y(y)}" r="5" fill="#090909" stroke="#f5c400" stroke-width="2.5"/>`;
 if(fa!==null)svg+=`<circle cx="${X(a)}" cy="${Y(fa)}" r="5" fill="#f5c400" stroke="#f5c400"/>`;
 svg+='</svg>';
 return mc(`graph-${kind}-${a}-${L}-${right}-${fa}-${sign}-${even}-${ml}-${mr}-${curve}-${ask}`,'graph_'+kind,`<p>${prompt}</p>${svg}<p class="u1-key">Open circles exclude a point; filled circles give the function value.${kind==='asymptote'?' Arrows indicate unbounded continuation.':''}</p>`,answer,ask==='continuity'?['Yes','No']:['DNE','undefined',String(L),String(right),fa===null?'undefined':String(fa),'\\infty','-\\infty'],reason,{kind,a,L,right,fa,ask,sign,even,ml,mr,curve,leftLimit:l,rightLimit:r});
}
function asymptote(){const kind=pick(['horizontal','vertical','directions','crossing']),a=ri(-4,4),L=ri(-5,5),right=L+pick([-4,-2,2,4]);let question,answer,wrong,reason;
 if(kind==='horizontal'){const dir=pick(['\\infty','-\\infty']);question=`Given ${M(T`\lim_{x\to${dir}}f(x)=${L}`)}, identify the horizontal asymptote in that direction.`;answer=`y=${L}`;wrong=[`x=${L}`,`y=${L+1}`,'No horizontal asymptote'];reason=`The outputs approach ${M(String(L))} as x goes toward ${M(dir)}, so the graph approaches the horizontal line ${M(answer)}.`;}
 if(kind==='vertical'){const side=pick(['+','-']),inf=pick(['\\infty','-\\infty']);question=`Given ${M(T`\lim_{x\to${a}^{${side}}}f(x)=${inf}`)}, identify a vertical asymptote.`;answer=`x=${a}`;wrong=[`y=${a}`,`x=${a+1}`,'No vertical asymptote'];reason=`The function is unbounded as x approaches the finite input ${M(String(a))} from one side. Thus ${M(answer)} is a vertical asymptote; one infinite one-sided limit is sufficient.`;}
 if(kind==='directions'){question=`Given ${M(T`\lim_{x\to-\infty}f(x)=${L}`)} and ${M(T`\lim_{x\to\infty}f(x)=${right}`)}, identify the horizontal asymptotes.`;answer=`y=${L} and y=${right}`;wrong=[`x=${L} and x=${right}`,`Only y=${L}`,`Only y=${right}`];reason=`Each finite end limit gives a horizontal asymptote: ${M(`y=${L}`)} to the left and ${M(`y=${right}`)} to the right. A function can have different horizontal asymptotes in the two directions.`;}
 if(kind==='crossing'){question=`A function has horizontal asymptote ${M(`y=${L}`)} as ${M('x\\to\\infty')}. Must its graph avoid crossing that line?`;answer='No';wrong=['Yes'];reason=`A horizontal asymptote describes end behavior, not a barrier. For example, ${M(T`f(x)=${L}+\frac{x}{x^2+1}`)} approaches ${M(String(L))} at infinity and crosses ${M(`y=${L}`)} at ${M('x=0')}.`;}
 // Binary conceptual questions stay binary; no irrelevant numeric filler.
 const p=mc(`asymptote-${kind}-${a}-${L}-${right}-${question}`,'asymptote_'+kind,`<p>${question}</p>`,answer,wrong,reason,{kind,a,L,right});if(kind==='crossing'){p.choices=['Yes','No'];p.correctIndex=1;}if(kind==='directions')p.choicesHtml=true;
 return p;}
window.BMUnit1Representations={table,graph,asymptote};
const old=window.BatchMathAPTopicGenerators.get;window.BatchMathAPTopicGenerators.get=slug=>slug==='introduction-to-limits'?(opts={})=>(opts.mode==='graphs'?graph():table()):old(slug);
})();
