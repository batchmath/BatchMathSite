/* BatchMath v12.8.W — Unit 5 answer checking.
   Kinds:
   ivp        a particular solution y = f(x): equal to the exact solution at many points spread over the whole
              interval of validity; diagnoses a wrong constant, a wrong branch, a missing initial condition, an
              answer that is undefined on part of the interval, and leftover C.
   function   y = f(x) with no initial condition to satisfy (for example the line of horizontal segments).
   general    a general solution y = F(x) + C (the Unit 4 antiderivative checker).
   interval   one interval or a union of intervals, in interval or inequality notation, with exact endpoints.
   numeric    a calculator value, correct to the stated tolerance (three decimal places: within 0.001).
   exact      one exact value; terminating decimals that equal it are fine, approximations are not.
   list       a set of exact values, or None.
   Expressions are read with the shared Unit 4 parser (x, t, θ; e, π; trig, inverse trig, ln, roots, |u|). */
(function(){
'use strict';
const I=window.BatchMathUnit4Integrals;
if(!I){console.error('unit5-answers: load unit4-exact-answers.js first');return;}

const decimalUsed=raw=>/(?:^|[^A-Za-z0-9.])(?:\d+\.\d*|\.\d+)/.test(String(raw||''));
const usesVar=(t,name)=>!!t&&typeof t==='object'&&(t.kind==='variable'&&t.name===name||['value','left','right','argument'].some(k=>usesVar(t[k],name)));
const close=(a,b,rel=1e-8)=>Math.abs(a-b)<=rel*Math.max(1,Math.abs(a),Math.abs(b));
const shownVar=v=>v==='theta'?'θ':(v||'x');

function parse(raw,variable){return I.parseInput(raw,variable);}
function value(tree,x,c=0){try{const v=I.evaluate(tree,{x,y:c});return Number.isFinite(v)?v:NaN;}catch(_){return NaN;}}
function message(e,variable,what){
 const v=shownVar(variable);
 if(e?.code==='wrong-variable')return `This problem uses ${v}. Write your answer in terms of ${v}.`;
 if(e?.code==='variable')return 'Enter a number. This answer should not contain a variable.';
 if(e?.code==='constant-name')return 'Use C for a constant of integration.';
 if(e?.code==='bars')return 'Close each absolute value.';
 if(e?.code==='equals')return 'Enter only the expression after the equals sign.';
 return what||`Enter a valid expression in ${v}.`;
}

// Points spread across an interval (open at finite ends); an infinite end uses a window around x0.
function probes(interval,x0,count=31){
 let [a,b]=interval||[-Infinity,Infinity];
 const w=Math.max(4,1.5*Math.abs(x0||0));
 const lo=Number.isFinite(a)?a:Math.min(x0,Number.isFinite(b)?b:x0)-w,hi=Number.isFinite(b)?b:Math.max(x0,Number.isFinite(a)?a:x0)+w;
 const pts=[];for(let k=0;k<count;k++)pts.push(lo+(hi-lo)*(k+0.37)/count);
 if(Number.isFinite(x0)&&x0>lo&&x0<hi)pts.push(x0);
 return pts.filter(x=>x>lo&&x<hi);
}

// ---------- functions ----------
function compareFunction(tree,expected,points){
 let used=0,offset=null,constant=true,mismatch=false;
 for(const x of points){
  const want=value(expected,x);if(!Number.isFinite(want))continue;
  const got=value(tree,x);if(!Number.isFinite(got))return{ok:false,undefinedAt:x};
  used++;
  const d=got-want;if(Math.abs(want)<1e6){if(offset===null)offset=d;else if(!close(d,offset,1e-8))constant=false;} // a difference of huge values has no precision left
  if(!close(got,want))mismatch=true;
 }
 if(used<8)return{ok:false,tooFew:true};
 return{ok:!mismatch,offsetOnly:!!mismatch&&constant,offset};
}
function residualOk(tree,spec,points){
 // y' - f(x, y) at sample points, from a central difference of the student's function.
 if(typeof spec.ode!=='function')return null;
 let used=0;
 for(const x of points){
  const y=value(tree,x);if(!Number.isFinite(y))continue;
  const h=1e-5*Math.max(1,Math.abs(x)),yp=(value(tree,x+h)-value(tree,x-h))/(2*h),f=spec.ode(x,y);
  if(!Number.isFinite(yp)||!Number.isFinite(f))continue;
  used++;if(Math.abs(yp-f)>1e-4*Math.max(1,Math.abs(f)))return false;
 }
 return used>=6;
}
function checkFunction(raw,spec){
 const variable=spec.variable||'x',text=String(raw||'').trim();
 if(!text)return{valid:false,message:'Enter an answer before checking.'};
 let tree;try{tree=parse(text,variable);}catch(e){return{valid:false,message:message(e,variable)};}
 const expected=parse(spec.expression,'x');
 if(spec.kind==='ivp'&&usesVar(tree,'y'))return{valid:true,ok:false,note:'Use the initial condition to find the value of C. The particular solution should not contain C.'};
 const pts=probes(spec.interval,spec.x0);
 const r=compareFunction(tree,expected,pts);
 if(r.ok)return{valid:true,ok:true};
 const v=shownVar(variable),approx=decimalUsed(text)?' Use exact values; a rounded decimal is not equal to the exact coefficient.':'';
 if(r.undefinedAt!==undefined)return{valid:true,ok:false,note:`Your function is not defined at every ${v}-value in the interval of validity (for example ${v} = ${+r.undefinedAt.toFixed(3)}). Check absolute values, logarithms and roots.`};
 if(spec.kind!=='ivp')return{valid:true,ok:false,note:approx.trim()};
 const atX0=value(tree,spec.x0),icOk=Number.isFinite(atX0)&&close(atX0,spec.y0,1e-9);
 if(r.offsetOnly)return{valid:true,ok:false,note:`Your function has the correct derivative, but the constant is wrong. Substitute ${v} = ${spec.x0Tex||spec.x0} into your general solution and solve for C.${approx}`};
 const res=residualOk(tree,spec,pts);
 if(res===true&&!icOk)return{valid:true,ok:false,note:`Your function satisfies the differential equation but not the initial condition. Check how you solved for C${spec.branchNote?` and which branch (sign) you chose`:''}.${approx}`};
 if(res===false&&icOk)return{valid:true,ok:false,note:`Your function passes through the initial point, but its derivative does not match the differential equation. Check your integration.${approx}`};
 return{valid:true,ok:false,note:approx.trim()};
}
function checkGeneral(raw,spec){
 const r=I.check(raw,{kind:'antiderivative',expression:spec.expression,variable:spec.variable||'x',components:spec.components});
 if(!r.valid)return r;
 if(r.note&&/forgot \+ C/.test(r.note))r.note='Your function is correct, but a general solution needs + C.';
 return r;
}

// ---------- intervals ----------
const INF=/^(?:\+?(?:∞|inf(?:inity)?|oo))$/i,NINF=/^(?:-(?:∞|inf(?:inity)?|oo))$/i;
function normalizeIntervalText(raw){
 return String(raw||'').trim().replace(/[−–—]/g,'-').replace(/\s+/g,' ').replace(/infinity/gi,'∞').replace(/\binf\b/gi,'∞').replace(/≤/g,'<=').replace(/≥/g,'>=');
}
function endpointValue(s){
 const t=s.replace(/\s+/g,'');
 if(INF.test(t))return Infinity;if(NINF.test(t))return -Infinity;
 return I.evaluate(parse(t,null),{});
}
function splitTop(text,sep){
 const out=[];let depth=0,start=0;
 for(let i=0;i<text.length;i++){const ch=text[i];if('(['.includes(ch))depth++;else if(')]'.includes(ch))depth--;else if(depth===0&&sep(ch,i)){out.push(text.slice(start,i));start=i+1;}}
 out.push(text.slice(start));return out;
}
function parseOneInterval(s){
 s=s.trim();
 if(/^(?:all\s*real\s*numbers?|all\s*reals?|r|ℝ|\(-∞,\s*∞\))$/i.test(s))return{left:-Infinity,right:Infinity,lc:false,rc:false};
 // inequality forms: a<x<b, x>a, x<=b, a<=x
 const ineq=s.replace(/\s+/g,'').match(/^(?:(.+?)(<=|<))?([xtθ])(?:(<=|<|>=|>)(.+))?$/i);
 if(ineq&&(ineq[1]!==undefined||ineq[4]!==undefined)&&!/^[(\[]/.test(s)){
  const [, lo, lop, , op, rhs]=ineq;let left=-Infinity,right=Infinity,lc=false,rc=false;
  if(lo!==undefined){left=endpointValue(lo);lc=lop==='<=';}
  if(op!==undefined){const v=endpointValue(rhs);if(op[0]==='<'){right=v;rc=op==='<=';}else{if(lo!==undefined)throw Error('form');left=v;lc=op==='>=';}}
  return{left,right,lc,rc};
 }
 if(!/^[(\[]/.test(s)||!/[)\]]$/.test(s))throw Error('form');
 const inner=s.slice(1,-1),parts=splitTop(inner,ch=>ch===',');
 if(parts.length!==2)throw Error('form');
 const left=endpointValue(parts[0]),right=endpointValue(parts[1]);
 if(!Number.isFinite(left)&&left>0||!Number.isFinite(right)&&right<0)throw Error('order');
 const lc=s[0]==='[',rc=s[s.length-1]===']';
 if((lc&&!Number.isFinite(left))||(rc&&!Number.isFinite(right)))throw Error('infinite-bracket');
 if(!(left<right))throw Error('order');
 return{left,right,lc,rc};
}
function parseIntervals(raw){
 const text=normalizeIntervalText(raw);
 if(!text)return{empty:true};
 if(/^(?:none|never|no\s*(?:times?|intervals?)|∅|\{\s*\})$/i.test(text))return{none:true,parts:[]};
 const pieces=splitTop(text,(ch,i)=>ch==='∪'||(ch==='U'&&!/[a-z]/i.test(text[i-1]||'')&&!/[a-z]/i.test(text[i+1]||'')));
 const parts=pieces.map(parseOneInterval).sort((p,q)=>p.left-q.left);
 return{parts};
}
let endTol=0;// set per check: calculator answers may give rounded endpoints
const sameEnd=(a,b)=>a===b||(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=Math.max(endTol,1e-9*Math.max(1,Math.abs(a))));
function expectedParts(spec){
 const list=spec.parts||[{left:spec.left,right:spec.right,lc:!!(spec.lc??spec.leftClosed),rc:!!(spec.rc??spec.rightClosed)}];
 return list.map(p=>({left:typeof p.left==='string'?endpointValue(p.left):p.left,right:typeof p.right==='string'?endpointValue(p.right):p.right,lc:!!(p.lc??p.leftClosed),rc:!!(p.rc??p.rightClosed)}));
}
function checkInterval(raw,spec){
 endTol=Number(spec.tolerance||0);
 let got;
 try{got=parseIntervals(raw);}
 catch(e){
  if(e.message==='infinite-bracket')return{valid:false,message:'Use a parenthesis at ∞ or −∞; infinity is never included.'};
  if(e.message==='order')return{valid:false,message:'Write each interval with the smaller endpoint first.'};
  return{valid:false,message:'Enter an interval such as (−1, 3) or [0, ∞), or a union of intervals.'};
 }
 if(got.empty)return{valid:false,message:'Enter an answer before checking.'};
 const want=spec.none?[]:expectedParts(spec);
 if(got.none)return{valid:true,ok:want.length===0,note:want.length?'There is at least one interval; find where the condition holds.':''};
 const ok=got.parts.length===want.length&&got.parts.every((p,i)=>sameEnd(p.left,want[i].left)&&sameEnd(p.right,want[i].right)&&(spec.anyBrackets||p.lc===want[i].lc&&p.rc===want[i].rc)); // anyBrackets: open or closed finite endpoints (intervals of increase, direction)
 if(ok)return{valid:true,ok:true};
 const v=shownVar(spec.variable);
 if(spec.validity){
  if(got.parts.length>1)return{valid:true,ok:false,note:`An interval of validity is one connected interval containing ${v} = ${spec.x0Tex??spec.x0}. Keep only the piece of the domain that contains the initial value.`};
  const p=got.parts[0],w=want[0],x0=spec.x0;
  if(Number.isFinite(x0)&&!(p.left<x0&&x0<p.right||p.lc&&sameEnd(p.left,x0)||p.rc&&sameEnd(p.right,x0)))return{valid:true,ok:false,note:`Your interval does not contain the initial value ${v} = ${spec.x0Tex??x0}.`};
  if(sameEnd(p.left,w.left)&&sameEnd(p.right,w.right))return{valid:true,ok:false,note:spec.bracketNote||'The endpoints are right, but check which endpoints are included. Include an endpoint only if the solution and the differential equation are both defined there.'};
  if(p.left<=w.left&&p.right>=w.right)return{valid:true,ok:false,note:'Your interval is too large: the solution or the differential equation is undefined somewhere in it.'};
  return{valid:true,ok:false,note:'Your interval stops too soon: the solution is valid on a larger interval around the initial value.'};
 }
 if(got.parts.length===want.length&&got.parts.every((p,i)=>sameEnd(p.left,want[i].left)&&sameEnd(p.right,want[i].right)))return{valid:true,ok:false,note:'The endpoints are right, but check which endpoints are included.'};
 return{valid:true,ok:false};
}

// ---------- numbers ----------
function numberOf(raw){
 const text=String(raw||'').trim().replace(/[$,](?=\d)/g,'').replace(/\s*(?:dollars?|years?|weeks?|days?|hours?|minutes?|mg|milligrams?|grams?|units?|%|percent|°\s*[CF]?|degrees?)\s*$/i,'');
 const tree=parse(text,null);if(usesVar(tree,'y'))throw Object.assign(Error('C'),{code:'variable'});
 const v=I.evaluate(tree,{});if(!Number.isFinite(v))throw Object.assign(Error('undefined'),{code:'undefined'});
 return v;
}
function checkNumeric(raw,spec){
 if(!String(raw||'').trim())return{valid:false,message:'Enter an answer before checking.'};
 let got;try{got=numberOf(raw);}catch(e){return{valid:false,message:e.code==='undefined'?'That expression is undefined. Check it and try again.':message(e,null,'Enter a number, or an expression a calculator can evaluate.')};}
 const want=Number(spec.value),tol=Number(spec.tolerance??0.001);
 if(Math.abs(got-want)<=tol+1e-12)return{valid:true,ok:true};
 for(const w of spec.wrongValues||[])if(Math.abs(got-w.value)<=tol+1e-12)return{valid:true,ok:false,note:w.note};
 if(Math.abs(got+want)<=tol+1e-12&&Math.abs(want)>tol)return{valid:true,ok:false,note:'Check the sign of your answer.'};
 if(Math.abs(got-want)<=0.01*Math.abs(want))return{valid:true,ok:false,note:spec.roundingNote||'Very close. Keep full calculator precision until the last step, then round as directed.'};
 return{valid:true,ok:false};
}
function checkExact(raw,spec){
 if(!String(raw||'').trim())return{valid:false,message:'Enter an answer before checking.'};
 let got;try{got=numberOf(raw);}catch(e){return{valid:false,message:e.code==='undefined'?'That expression is undefined. Check it and try again.':message(e,null,'Enter an exact value.')};}
 const want=typeof spec.value==='number'?spec.value:I.evaluate(parse(spec.expression,null),{});
 if(close(got,want,1e-10))return{valid:true,ok:true};
 for(const w of spec.wrongValues||[])if(close(got,w.value,1e-10))return{valid:true,ok:false,note:w.note};
 if(decimalUsed(raw)&&Math.abs(got-want)<=1e-3*Math.max(1,Math.abs(want)))return{valid:true,ok:false,note:'Use an exact value. A rounded decimal is only an approximation.'};
 if(close(got,-want,1e-10))return{valid:true,ok:false,note:'Check the sign of your answer.'};
 return{valid:true,ok:false};
}
function splitList(text){
 return splitTop(text,ch=>ch===','||ch===';').flatMap(p=>p.split(/\band\b/i)).map(p=>p.trim()).filter(Boolean);
}
function checkList(raw,spec){
 const text=String(raw||'').trim();
 if(!text)return{valid:false,message:'Enter every value, separated by commas, or choose None.'};
 if(/^(?:none|never|no\s*(?:times?|values?|solutions?)|∅|\{\s*\})$/i.test(text))return{valid:true,ok:!(spec.values||[]).length,note:(spec.values||[]).length?'There is at least one value; solve the equation.':''};
 let got;
 try{got=splitList(text.replace(/^\s*\{|\}\s*$/g,'')).map(p=>numberOf(p.replace(/^\s*[a-zθ]\s*=\s*/i,'')));}
 catch(_){return{valid:false,message:'Enter each value, separated by commas.'};}
 const want=(spec.values||[]).map(v=>typeof v==='number'?v:I.evaluate(parse(v,null),{})).sort((a,b)=>a-b),g=[...got].sort((a,b)=>a-b);
 for(let i=1;i<g.length;i++)if(close(g[i],g[i-1],1e-10))return{valid:true,ok:false,note:'List each value only once.'};
 const tol=spec.tolerance;
 const same=(a,b)=>tol?Math.abs(a-b)<=tol+1e-12:close(a,b,1e-10);
 const ok=g.length===want.length&&g.every((v,i)=>same(v,want[i]));
 if(ok)return{valid:true,ok:true};
 if(g.length<want.length&&g.every(v=>want.some(w=>same(v,w))))return{valid:true,ok:false,note:'Those values are correct, but at least one is missing.'};
 if(g.length>want.length&&want.every(w=>g.some(v=>same(v,w))))return{valid:true,ok:false,note:spec.extraNote||'All the correct values are there, but you also included at least one value that does not belong.'};
 return{valid:true,ok:false};
}

function check(raw,spec){
 switch(spec?.kind){
  case 'ivp':case 'function':return checkFunction(raw,spec);
  case 'general':return checkGeneral(raw,spec);
  case 'interval':return checkInterval(raw,spec);
  case 'numeric':return checkNumeric(raw,spec);
  case 'exact':return checkExact(raw,spec);
  case 'list':return checkList(raw,spec);
 }
 return{valid:false,message:'This answer type is not supported.'};
}
window.BatchMathUnit5Answers=Object.freeze({check,parseIntervals,parse,value,probes});
})();
