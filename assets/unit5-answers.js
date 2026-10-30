/* BatchMath v12.8.X — Unit 5 answer checking.
   Kinds:
   ivp        a particular solution y = f(x): equal to the exact solution at many points spread over the whole
              interval of validity; diagnoses a wrong constant, a wrong branch, a missing initial condition, an
              answer that is undefined on part of the interval, and leftover C.
   function   y = f(x) with no initial condition to satisfy (for example the line of horizontal segments).
   general    a general solution y = F(x) + C (the Unit 4 antiderivative checker).
   interval   one interval or a union of intervals, in interval or inequality notation, with exact endpoints.
   numeric    a calculator value rounded as the question directs (places: 3 for three decimal places, 2 for cents,
              0 for a whole number). v12.8.X: the entry must be a decimal number equal to the correctly rounded
              value (half away from zero); trailing zeros are optional, more digits are not. See checkNumeric.
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
 if(/^(?:all\s*real\s*numbers?|all\s*reals?|r|ℝ|\(-∞,\s*∞\))$/i.test(s))return{left:-Infinity,right:Infinity,lc:false,rc:false,leftRaw:'-∞',rightRaw:'∞'};
 // inequality forms: a<x<b, x>a, x<=b, a<=x
 const ineq=s.replace(/\s+/g,'').match(/^(?:(.+?)(<=|<))?([xytθ])(?:(<=|<|>=|>)(.+))?$/i);
 if(ineq&&(ineq[1]!==undefined||ineq[4]!==undefined)&&!/^[(\[]/.test(s)){
  const [, lo, lop, , op, rhs]=ineq;let left=-Infinity,right=Infinity,lc=false,rc=false,leftRaw='-∞',rightRaw='∞';
  if(lo!==undefined){left=endpointValue(lo);lc=lop==='<=';leftRaw=lo;}
  if(op!==undefined){const v=endpointValue(rhs);if(op[0]==='<'){right=v;rc=op==='<=';rightRaw=rhs;}else{if(lo!==undefined)throw Error('form');left=v;lc=op==='>=';leftRaw=rhs;}}
  return{left,right,lc,rc,leftRaw,rightRaw};
 }
 if(!/^[(\[]/.test(s)||!/[)\]]$/.test(s))throw Error('form');
 const inner=s.slice(1,-1),parts=splitTop(inner,ch=>ch===',');
 if(parts.length!==2)throw Error('form');
 const left=endpointValue(parts[0]),right=endpointValue(parts[1]);
 if(!Number.isFinite(left)&&left>0||!Number.isFinite(right)&&right<0)throw Error('order');
 const lc=s[0]==='[',rc=s[s.length-1]===']';
 if((lc&&!Number.isFinite(left))||(rc&&!Number.isFinite(right)))throw Error('infinite-bracket');
 if(!(left<right))throw Error('order');
 return{left,right,lc,rc,leftRaw:parts[0].trim(),rightRaw:parts[1].trim()};
}
function parseIntervals(raw){
 const text=normalizeIntervalText(raw);
 if(!text)return{empty:true};
 if(/^(?:none|never|no\s*(?:times?|intervals?)|∅|\{\s*\})$/i.test(text))return{none:true,parts:[]};
 const pieces=splitTop(text,(ch,i)=>ch==='∪'||(ch==='U'&&!/[a-z]/i.test(text[i-1]||'')&&!/[a-z]/i.test(text[i+1]||'')));
 const parts=pieces.map(parseOneInterval).sort((p,q)=>p.left-q.left);
 return{parts};
}
const sameEnd=(a,b)=>a===b||(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a)));
function expectedParts(spec){
 const list=spec.parts||[{left:spec.left,right:spec.right,lc:!!(spec.lc??spec.leftClosed),rc:!!(spec.rc??spec.rightClosed)}];
 return list.map(p=>({left:typeof p.left==='string'?endpointValue(p.left):p.left,right:typeof p.right==='string'?endpointValue(p.right):p.right,lc:!!(p.lc??p.leftClosed),rc:!!(p.rc??p.rightClosed)}));
}
// Calculator intervals (v12.8.X): every finite endpoint is a decimal rounded to spec.places and must equal the
// correctly rounded endpoint (core roundScaled); an exact whole-number endpoint such as 0 may be written as 0.
function checkRoundedIntervals(parts,want,spec){
 const p=placesOf(spec),words=precisionWords(spec,p);
 const end=(rawEnd,value)=>{
  if(!Number.isFinite(value))return{scaled:value};
  const r=readRounded(rawEnd,spec,'each endpoint');if(r.error)return{error:`Give each endpoint as a decimal rounded to ${words}.`};
  return r;
 };
 const read=parts.map(q=>({lc:q.lc,rc:q.rc,l:end(q.leftRaw,q.left),r:end(q.rightRaw,q.right)}));
 const bad=read.find(q=>q.l.error||q.r.error);if(bad)return{valid:false,message:(bad.l.error||bad.r.error)};
 if(read.some(q=>q.l.tooPrecise||q.r.tooPrecise))return{valid:true,ok:false,note:`Round each endpoint to ${words} as the question asks.`};
 const target=w=>({l:Number.isFinite(w.left)?C5().roundScaled(w.left,p):w.left,r:Number.isFinite(w.right)?C5().roundScaled(w.right,p):w.right});
 const sameEnds=read.length===want.length&&read.every((q,i)=>{const t=target(want[i]);return q.l.scaled===t.l&&q.r.scaled===t.r;});
 if(sameEnds&&(spec.anyBrackets||read.every((q,i)=>q.lc===want[i].lc&&q.rc===want[i].rc)))return{valid:true,ok:true};
 if(sameEnds)return{valid:true,ok:false,note:'The endpoints are right, but check which endpoints are included.'};
 const near=read.length===want.length&&read.every((q,i)=>{const t=target(want[i]);return [[q.l.scaled,t.l],[q.r.scaled,t.r]].every(([a,b])=>a===b||Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=2);});
 if(near)return{valid:true,ok:false,note:`Close, but at least one endpoint is not correctly rounded. Keep full calculator precision, then round each endpoint to ${words}.`};
 return{valid:true,ok:false};
}
function checkInterval(raw,spec){
 const rounded=spec.places!==undefined||spec.tolerance!==undefined;
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
 if(rounded)return checkRoundedIntervals(got.parts,want,spec);
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
const UNITS=/\s*(?:dollars?|years?|weeks?|days?|hours?|minutes?|mg|milligrams?|grams?|units?|%|percent|°\s*[CF]?|degrees?)\s*$/i;
function numberOf(raw){
 const text=String(raw||'').trim().replace(/[$,](?=\d)/g,'').replace(UNITS,'');
 const tree=parse(text,null);if(usesVar(tree,'y'))throw Object.assign(Error('C'),{code:'variable'});
 const v=I.evaluate(tree,{});if(!Number.isFinite(v))throw Object.assign(Error('undefined'),{code:'undefined'});
 return v;
}
// ---------- rounded answers (v12.8.X) ----------
// Policy: a question that says "round to three decimal places", "to the nearest cent" or "to the nearest whole
// number" takes a decimal number, and that number must equal the correctly rounded value of the exact answer
// (rounded half away from zero; core roundScaled). Accepted: a leading decimal point (.923), a sign, -0, trailing
// zeros (1.25, 1.250, 1.2500 for 1.250), a dollar sign, thousands commas and a unit word. Graded wrong: a
// neighbouring rounded value (1.234 for 1.235) and an unrounded value with extra non-zero digits (1.2503 for
// 1.250). Not graded (the student is asked to re-enter): an expression such as ln(2)/5, so an unrounded
// calculator expression cannot stand in for the rounded number the question asks for.
const C5=()=>window.BatchMathUnit5Core;
const LEGACY_PLACES={0.001:3,0.0015:3,0.005:2,0.5:0};
function placesOf(spec){
 if(Number.isInteger(spec.places))return spec.places;
 const p=LEGACY_PLACES[spec.tolerance];if(p===undefined)throw Error(`unit5-answers: rounded answer without places (${JSON.stringify(spec).slice(0,80)})`);
 return p;
}
const precisionWords=(spec,p)=>spec.money?'the nearest cent':p===0?'the nearest whole number':`${['zero','one','two','three','four','five','six'][p]} decimal places`;
// A plain decimal as typed, or null: optional sign, optional dollar sign, digits with an optional decimal point
// (".923", "5.", "-0"), thousands commas, an optional unit word.
function decimalParts(raw){
 let t=String(raw||'').trim().replace(/[−–—]/g,'-').replace(UNITS,'').trim();
 let neg=false;
 const sign=()=>{if(t[0]==='-'||t[0]==='+'){neg=neg!==(t[0]==='-');t=t.slice(1).trim();return true;}return false;};
 sign();if(t[0]==='$'){t=t.slice(1).trim();sign();}
 if(/^\d{1,3}(?:,\d{3})+(?:\.\d*)?$/.test(t))t=t.replace(/,/g,'');
 const m=t.match(/^(\d*)(?:\.(\d*))?$/);
 if(!m||!m[1]&&!m[2])return null;
 return{neg,int:m[1]||'0',frac:m[2]||''};
}
// The entry as an integer count of the last place (1.25 at three places -> 1250), or tooPrecise when it has more
// non-zero decimal places than were asked for.
function scaledEntry(d,p){
 const frac=d.frac.replace(/0+$/,'');
 if(frac.length>p)return{tooPrecise:true};
 const v=Number((d.int.replace(/^0+(?=\d)/,''))+frac.padEnd(p,'0'));
 return{scaled:d.neg&&v!==0?-v:v};
}
function readRounded(raw,spec,what){
 const p=placesOf(spec),words=precisionWords(spec,p),d=decimalParts(raw);
 if(!d){
  let bad=false;try{numberOf(raw);}catch(_){bad=true;}
  return{error:bad?`Enter ${what||'a number'} rounded to ${words}${p===3?', for example 2.718 or .923':''}.`:`Enter ${what||'your answer'} as a decimal number rounded to ${words}, not as an expression.`,p,words};
 }
 return{...scaledEntry(d,p),p,words};
}
function checkNumeric(raw,spec){
 if(!String(raw||'').trim())return{valid:false,message:'Enter an answer before checking.'};
 const r=readRounded(raw,spec);
 if(r.error)return{valid:false,message:r.error};
 if(r.tooPrecise)return{valid:true,ok:false,note:`Round your answer to ${r.words} as the question asks; it has more decimal places than that.`};
 const target=C5().roundScaled(Number(spec.value),r.p),got=r.scaled;
 if(got===target)return{valid:true,ok:true};
 for(const w of spec.wrongValues||[])if(Number.isFinite(w.value)&&got===C5().roundScaled(w.value,r.p))return{valid:true,ok:false,note:w.note};
 if(target!==0&&got===-target)return{valid:true,ok:false,note:'Check the sign of your answer.'};
 if(Math.abs(got-target)<=2)return{valid:true,ok:false,note:spec.roundingNote||`Close, but not the correctly rounded value. Keep full calculator precision until the last step, then round to ${r.words}.`};
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
// A list of calculator values (v12.8.X): each one a decimal rounded to spec.places, in any order.
function checkRoundedList(items,spec){
 const read=items.map(t=>readRounded(t,spec,'each value'));
 const bad=read.find(r=>r.error);if(bad)return{valid:false,message:bad.error};
 const p=placesOf(spec);
 if(read.some(r=>r.tooPrecise))return{valid:true,ok:false,note:`Round each value to ${precisionWords(spec,p)} as the question asks.`};
 const g=read.map(r=>r.scaled).sort((a,b)=>a-b),want=(spec.values||[]).map(v=>C5().roundScaled(Number(v),p)).sort((a,b)=>a-b);
 for(let i=1;i<g.length;i++)if(g[i]===g[i-1])return{valid:true,ok:false,note:'List each value only once.'};
 if(g.length===want.length&&g.every((v,i)=>v===want[i]))return{valid:true,ok:true};
 if(g.length<want.length&&g.every(v=>want.includes(v)))return{valid:true,ok:false,note:'Those values are correct, but at least one is missing.'};
 if(g.length>want.length&&want.every(w=>g.includes(w)))return{valid:true,ok:false,note:spec.extraNote||'All the correct values are there, but you also included at least one value that does not belong.'};
 return{valid:true,ok:false};
}
function checkList(raw,spec){
 const text=String(raw||'').trim();
 if(!text)return{valid:false,message:'Enter every value, separated by commas, or choose None.'};
 if(/^(?:none|never|no\s*(?:times?|values?|solutions?)|∅|\{\s*\})$/i.test(text))return{valid:true,ok:!(spec.values||[]).length,note:(spec.values||[]).length?'There is at least one value; solve the equation.':''};
 const items=splitList(text.replace(/^\s*\{|\}\s*$/g,'')).map(p=>p.replace(/^\s*[a-zθ]\s*=\s*/i,''));
 if(spec.places!==undefined)return checkRoundedList(items,spec);
 let got;
 try{got=items.map(numberOf);}
 catch(_){return{valid:false,message:'Enter each value, separated by commas.'};}
 const want=(spec.values||[]).map(v=>typeof v==='number'?v:I.evaluate(parse(v,null),{})).sort((a,b)=>a-b),g=[...got].sort((a,b)=>a-b);
 for(let i=1;i<g.length;i++)if(close(g[i],g[i-1],1e-10))return{valid:true,ok:false,note:'List each value only once.'};
 const same=(a,b)=>close(a,b,1e-10);
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
window.BatchMathUnit5Answers=Object.freeze({check,parseIntervals,parse,value,probes,decimalParts});
})();
