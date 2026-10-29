// Local Unit 4 answer equivalence. Reuses the established expression parser
// and math editor; rational functions of n are compared symbolically, not by
// string matching or by a handful of test substitutions.
(function(){
  'use strict';
  const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
  function Q(a,b=1n){a=BigInt(a);b=BigInt(b);if(!b)throw Error('zero denominator');if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return[a/g,b/g];}
  const add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),neg=a=>[-a[0],a[1]],mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]);
  const trim=p=>{while(p.length>1&&!p.at(-1)[0])p.pop();return p;};
  const pa=(a,b)=>trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>add(a[i]||Q(0),b[i]||Q(0))));
  function pm(a,b){if(a.length+b.length>70)throw Error('expression too large');const out=Array.from({length:a.length+b.length-1},()=>Q(0));a.forEach((v,i)=>b.forEach((w,j)=>out[i+j]=add(out[i+j],mul(v,w))));return trim(out);}
  const eq=(a,b)=>{a=trim(a);b=trim(b);return a.length===b.length&&a.every((v,i)=>v[0]===b[i][0]&&v[1]===b[i][1]);};
  const one=()=>[Q(1)],zero=()=>[Q(0)];
  function literal(n){if(!Number.isFinite(n))throw Error('number');const s=String(n);if(/e/i.test(s))throw Error('use an ordinary number');const [a,b='']=s.split('.');return Q(BigInt(a+b),10n**BigInt(b.length));}
  function rational(tree){
    if(tree.kind==='number')return{a:[literal(tree.value)],b:one()};
    if(tree.kind==='variable'&&tree.name==='x')return{a:[Q(0),Q(1)],b:one()};
    if(tree.kind==='unary'){const v=rational(tree.value);return tree.op==='-'?{a:v.a.map(neg),b:v.b}:v;}
    if(tree.kind!=='op')throw Error('use an algebraic expression in n');
    const l=rational(tree.left);
    if(tree.op==='^'){
      const exponent=rational(tree.right);if(exponent.a.length!==1||exponent.b.length!==1)throw Error('power');
      const e=Number(exponent.a[0][0]*exponent.b[0][1])/Number(exponent.a[0][1]*exponent.b[0][0]);if(!Number.isInteger(e)||Math.abs(e)>15)throw Error('power');
      let a=one(),b=one();for(let i=0;i<Math.abs(e);i++){a=pm(a,l.a);b=pm(b,l.b);}return e<0?{a:b,b:a}:{a,b};
    }
    const r=rational(tree.right);
    if(tree.op==='+')return{a:pa(pm(l.a,r.b),pm(r.a,l.b)),b:pm(l.b,r.b)};
    if(tree.op==='-')return{a:pa(pm(l.a,r.b),pm(r.a,l.b).map(neg)),b:pm(l.b,r.b)};
    if(tree.op==='*')return{a:pm(l.a,r.a),b:pm(l.b,r.b)};
    if(tree.op==='/')return{a:pm(l.a,r.b),b:pm(l.b,r.a)};
    throw Error('operator');
  }
  function expectedRational(value){
    let a=zero(),b=one();
    for(const [power,c] of Object.entries(value)){const k=Number(power),term=Array.from({length:Math.abs(k)+1},()=>Q(0));term[Math.abs(k)]=Q(c[0],c[1]);const ta=k<0?[Q(c[0],c[1])]:term,tb=k<0?[...Array.from({length:-k},()=>Q(0)),Q(1)]:one();a=pa(pm(a,tb),pm(ta,b));b=pm(b,tb);}
    return{a,b};
  }
  function atom(k){return k.split('*').map(s=>{if(s==='pi')return'pi';if(s.startsWith('sqrt'))return`sqrt(${s.slice(4)})`;if(s.startsWith('ln'))return`ln(${s.slice(2)})`;if(s.startsWith('exp:')){const[,base,n,d]=s.split(':');return`${base}^(${n}/${d})`;}throw Error('atom');}).join('*');}
  function expression(value){return Object.entries(value).filter(([,c])=>c[0]).map(([k,c])=>`(${c[0]}/${c[1]})${k?'*('+atom(k)+')':''}`).join('+')||'0';}
  function check(raw,answer){
    const parser=window.BatchMathDerivativeExpressions;
    let text=String(raw||'').trim().replace(/[−–—]/g,'-').replace(/^\s*(?:S|L_?\d*|R_?\d*|M_?\d*|T_?\d*)\s*=\s*/,'');
    if(!text)return{valid:false,message:'Enter an answer before checking.'};
    if(text.length>2500)return{valid:false,message:'Enter a shorter expression.'};
    try{
      if(answer.kind==='n-expression'){
        if(/[xy]/i.test(text))throw Error('variable');
        text=text.replace(/(?<![a-z])n(?![a-z])/gi,'x');
        const got=rational(parser.parse(text)),want=expectedRational(answer.value);
        if(eq(got.b,zero()))throw Error('zero denominator');
        return{valid:true,ok:eq(pm(got.a,want.b),pm(want.a,got.b))};
      }
      const expected=expression(answer.value),tree=parser.parse(text),value=parser.evaluate(tree,{}),nonrational=Object.keys(answer.value).some(k=>k&&answer.value[k][0]);
      if(!Number.isFinite(value))throw Error('finite');
      if(!nonrational){
        try{const got=rational(tree),want={a:[Q(...(answer.value['']||[0,1]))],b:one()};return{valid:true,ok:eq(pm(got.a,want.b),pm(want.a,got.b))};}catch(_){/* An equivalent radical/logarithmic exact form is also valid. */}
      }
      if(nonrational&&/(?:^|[^A-Za-z])(?:\d*\.\d+)/.test(text))return{valid:true,ok:false,format:true};
      const want=parser.evaluate(parser.parse(expected),{});
      return{valid:true,ok:Math.abs(value-want)<=1e-11*Math.max(1,Math.abs(want))};
    }catch(_){return{valid:false,message:answer.kind==='n-expression'?'Enter a valid algebraic expression in n.':'Enter a valid exact numerical expression.'};}
  }
  window.BatchMathUnit4Answers={check,expression};
})();

// Riemann notation belongs to the Newton engine. Other answer kinds do not use it.
(function(){
 'use strict';
 function close(s,open){let d=0;for(let i=open;i<s.length;i++){if(s[i]==='(')d++;else if(s[i]===')'&&!--d)return i;}throw Error('Close the parentheses.');}
 function args(s){let d=0,start=0,out=[];for(let i=0;i<s.length;i++){if(s[i]==='(')d++;else if(s[i]===')')d--;else if(s[i]===','&&!d){out.push(s.slice(start,i));start=i+1;}}out.push(s.slice(start));return out;}
 function normalize(raw){
  let s=String(raw||'').trim().toLowerCase().replace(/[−–—]/g,'-').replace(/→/g,'->').replace(/∞/g,'infinity').replace(/[×·⋅]/g,'*').replace(/π/g,'pi').replace(/∑|Σ|σ/g,'\\sum');
  s=s.replace(/^\s*(?:T\s*(?:\(\s*k\s*,\s*n\s*\))?|I|L)\s*=\s*/i,'').replace(/^\$+|\$+$/g,'').replace(/\\[()[\]]|\\displaystyle|\\left|\\right|\\[,;!]/g,'');
  let under=null,tex=s.match(/^(?:\\lim|lim)_\{([^{}]+)\}/);if(tex){under=tex[1];s=s.slice(tex[0].length);}
  const sum=s.match(/\\sum_\{([^{}]+)\}\^(?:\{([^{}]+)\}|([a-z0-9]+))/);if(sum)s=s.slice(0,sum.index)+`sum(${sum[1]},${sum[2]||sum[3]},`+s.slice(sum.index+sum[0].length)+')';
  s=s.replace(/\\(?:rightarrow|to)/g,'->').replace(/\\infty/g,'infinity').replace(/\\(?:cdot|times)/g,'*');
  let before;do{before=s;s=s.replace(/\^\{([^{}]*)\}/g,'^($1)').replace(/\\(?:dfrac|tfrac|frac)\{([^{}]*)\}\{([^{}]*)\}/g,'($1)/($2)').replace(/\\sqrt\{([^{}]*)\}/g,'sqrt($1)');}while(before!==s);
  s=s.replace(/\\(sin|cos|tan|sec|csc|cot|ln|exp)\b/g,'$1').replace(/\\pi/g,'pi').replace(/[\[{]/g,'(').replace(/[\]}]/g,')').replace(/\s+/g,'').replace(/\^([+-]?\d+)\b/g,'^($1)').replace(/\.$/,'');
  if(under)s=`lim(${under.replace(/\\(?:rightarrow|to)/g,'->').replace(/\\infty/g,'infinity').replace(/\s+/g,'')},${s})`;
  return s.replace(/\bsigma\(/gi,'sum(');
 }
 function read(raw){
  let s=normalize(raw);while(s[0]==='('&&close(s,0)===s.length-1)s=s.slice(1,-1);
  let limit=null;
  if(s.startsWith('lim(')){
   const end=close(s,3);if(end!==s.length-1)throw Error('Put the summation inside the limit.');const fields=args(s.slice(4,end));
   if(fields.length===2)limit=fields[0].split('->');else if(fields.length===3)limit=fields.slice(0,2);else throw Error('Complete the limit.');
   s=fields.at(-1);
  }
  const found=s.match(/\bsum\(/);if(!found){if(limit)throw Error('Include the summation.');return{body:s,complete:false};}
  const start=found.index,end=close(s,start+3),fields=args(s.slice(start+4,end));if(fields.length!==3||!fields[2])throw Error('Complete the summation.');
  const index=fields[0].split('='),prefix=s.slice(0,start),suffix=s.slice(end+1);
  if(/(?<![a-z])[kxy](?![a-z])/i.test(prefix+suffix)||/\b(?:sum|lim)\(/.test(prefix+suffix+fields[2]))throw Error('Use one right-endpoint sum.');
  return{body:prefix+'('+fields[2]+')'+suffix,complete:true,limit,index,upper:fields[1],outer:prefix+'@'+suffix};
 }
 window.BatchMathNewtonNotation={normalize,read};
})();

/* Exact symbolic answers for the source-based Newton and FTC engines.
   Existing approximation/Sigma answer paths remain in unit4-exact-answers.js. */
(function(){
 'use strict';
 const legacy=window.BatchMathUnit4Answers,parser=window.BatchMathDerivativeExpressions;
 const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
 const q=(a,b=1n)=>{a=BigInt(a);b=BigInt(b);if(!b)throw Error('zero denominator');if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return[a/g,b/g];};
 const qa=(a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),qm=(a,b)=>q(a[0]*b[0],a[1]*b[1]),qn=a=>[-a[0],a[1]],qd=(a,b)=>q(a[0]*b[1],a[1]*b[0]);
 const literal=n=>{const s=String(n);if(!Number.isFinite(n)||/e/i.test(s))throw Error('ordinary exact number');const [a,b='']=s.split('.');return q(BigInt(a+b),10n**BigInt(b.length));};
 function poweredFunctions(text){
  for(let i=0;i<30;i++){
   const m=text.match(/\b(sin|cos|tan|sec|csc|cot)\^([+-]?\d+)\(/);if(!m)break;
   const start=m.index,open=start+m[0].length-1;let depth=1,end=open+1;for(;end<text.length&&depth;end++){if(text[end]==='(')depth++;if(text[end]===')')depth--;}
   if(depth)throw Error('parenthesis');text=text.slice(0,start)+`(${m[1]}(${text.slice(open+1,end-1)}))^(${m[2]})`+text.slice(end);
  }
  return text.replace(/\b(sin|cos|tan|sec|csc|cot)\^([+-]?\d+)([xykn])\b/g,'($1($3))^($2)');
 }
 // Conventional trig notation: sin² x, sin^2(3x), sin^(2)(x), tan x -> parser form.
 function readableTrig(text){
  const sup={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'};
  let s=String(text).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,m=>'^'+[...m].map(c=>sup[c]).join(''));
  s=s.replace(/\b(sin|cos|tan|sec|csc|cot)\s*\^\s*\(\s*(-?\d+)\s*\)/gi,'$1^$2');
  return s.replace(/\b(sin|cos|tan|sec|csc|cot|ln)((?:\s*\^\s*-?\d+)?)\s*(?![\s(])(\d*\.?\d*\s*(?:x|y|k|n)(?:\s*\^\s*\(?-?\d+\)?)?|\d+\.?\d*)/gi,(m,f,pw,arg)=>`${f}${pw.replace(/\s+/g,'')}(${arg.replace(/\s+/g,'')})`);
 }
 function spacedFactors(text){
  return String(text).replace(/\b(sin|cos|tan|sec|csc|cot|ln|exp|sqrt|abs)\s+\(/gi,'$1(').replace(/(?<=[0-9a-z)])[ \t]+(?=[a-z(])/gi,'*').replace(/(?<=[a-z)])[ \t]+(?=[0-9])/gi,'*');
 }
 function prepare(raw,kind){
  let s=String(raw||'').trim().replace(/[−–—]/g,'-');
  if(kind==='newton-expression'){
   s=window.BatchMathNewtonNotation.read(s).body;
   if(/(?<![a-z])[xy](?![a-z])/i.test(s))throw Error('use k and n');
   s=s.replace(/(?<![a-z])[kn]+(?![a-z])/gi,t=>t.toLowerCase().split('').join('*'));
   s=s.replace(/(?<![a-z])n(?![a-z])/gi,'x').replace(/(?<![a-z])k(?![a-z])/gi,'y');
  }else{
   s=s.replace(/^\s*(?:F\s*['′]\s*(?:\(\s*x\s*\))?|y\s*['′]|dy\s*\/\s*dx)\s*=\s*/i,'');
   // A factor written directly before a function, as the keypad serializes 2x·sec(x^6) ("2xsec(x^6)",
   // "3sin^(2)(3x)"), is a product: mark it so the trig-notation rules below, which start at a word
   // boundary, still apply. asin, acos, … are left whole (the "a" is not a factor).
   s=s.replace(/([0-9x)])(?=(?:sin|cos|tan|sec|csc|cot|ln|exp|sqrt|abs)(?![a-z]))/gi,'$1*');
  }
  return poweredFunctions(spacedFactors(readableTrig(s)).toLowerCase().replace(/\s+/g,''));
 }
 function normalForm(tree,{positiveX=false,newtonRoots=false}={}){
  const expArgs=new Map(),trigArgs=new Map();let operations=0;
  const zero=()=>new Map(),constant=c=>c[0]?new Map([['[]',c]]):zero();
  const monomial=items=>JSON.stringify([...items].filter(([,p])=>p).sort((a,b)=>a[0].localeCompare(b[0])));
  function bump(){if(++operations>15000)throw Error('expression too large');}
  function addTerm(poly,key,value){const total=qa(poly.get(key)||q(0),value);if(total[0])poly.set(key,total);else poly.delete(key);if(poly.size>400)throw Error('expression too large');}
  const pa=(a,b)=>{const out=new Map(a);for(const[k,c]of b)addTerm(out,k,c);return out;};
  const pn=a=>new Map([...a].map(([k,c])=>[k,qn(c)]));
  const scalar=(a,c)=>new Map([...a].map(([k,d])=>[k,qm(c,d)]).filter(([,d])=>d[0]));
  function trigReduce(poly){
   const out=zero(),queue=[...poly];
   while(queue.length){bump();const [key,c]=queue.pop(),items=JSON.parse(key),found=items.find(([name,p])=>p>=2&&name.startsWith('cos:'));
    if(!found){addTerm(out,key,c);continue;}
    const [name]=found,rest=items.map(([n,p])=>[n,p-(n===name?2:0)]).filter(([,p])=>p),sin='sin:'+name.slice(4),other=new Map(rest);other.set(sin,(other.get(sin)||0)+2);
    queue.push([monomial(rest),c],[monomial(other),qn(c)]);
   }
   return out;
  }
  function pm(a,b){
   const out=zero();for(const[ka,ca]of a)for(const[kb,cb]of b){bump();const items=new Map(JSON.parse(ka));for(const[n,p]of JSON.parse(kb))items.set(n,(items.get(n)||0)+p);
    let exponential=R(0);for(const[n,p]of [...items])if(expArgs.has(n)){exponential=ra(exponential,rs(expArgs.get(n),q(p)));items.delete(n);}
    if(exponential.a.size){const name='exp:'+serialize(exponential);expArgs.set(name,exponential);items.set(name,(items.get(name)||0)+1);}
    addTerm(out,monomial(items),qm(ca,cb));
   }return trigReduce(out);
  }
  function normalize(a,b){
   a=trigReduce(a);b=trigReduce(b);if(!b.size)throw Error('zero denominator');if(!a.size)return{a:zero(),b:constant(q(1))};
   const common=new Map();let first=true;
   for(const poly of [a,b])for(const key of poly.keys()){const items=new Map(JSON.parse(key));if(first){for(const[n,p]of items)common.set(n,p);first=false;}else for(const[n,p]of [...common]){const low=Math.min(p,items.get(n)||0);if(low)common.set(n,low);else common.delete(n);}}
   if(common.size){const cancel=poly=>{const out=zero();for(const[key,c]of poly){const items=new Map(JSON.parse(key));for(const[n,p]of common)items.set(n,items.get(n)-p);addTerm(out,monomial(items),c);}return out;};a=cancel(a);b=cancel(b);}
   const lead=[...b].sort((l,r)=>l[0].localeCompare(r[0]))[0][1];return{a:scalar(a,qd(q(1),lead)),b:scalar(b,qd(q(1),lead))};
  }
  const R=n=>({a:constant(q(n)),b:constant(q(1))});
  const ra=(a,b)=>normalize(pa(pm(a.a,b.b),pm(b.a,a.b)),pm(a.b,b.b));
  const rn=a=>({a:pn(a.a),b:a.b});
  const rs=(a,c)=>normalize(scalar(a.a,c),a.b);
  const rm=(a,b)=>normalize(pm(a.a,b.a),pm(a.b,b.b));
  const rd=(a,b)=>normalize(pm(a.a,b.b),pm(a.b,b.a));
  const serialize=r=>{const pack=p=>[...p].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,c])=>[k,c.map(String)]);r=normalize(r.a,r.b);return JSON.stringify([pack(r.a),pack(r.b)]);};
  const atom=name=>({a:new Map([[monomial([[name,1]]),q(1)]]),b:constant(q(1))});
  const integer=r=>{r=normalize(r.a,r.b);if(r.b.size!==1||!r.b.has('[]')||r.a.size>1||r.a.size&&!r.a.has('[]'))return null;const c=r.a.get('[]')||q(0);return c[1]===1n?Number(c[0]):null;};
  function exponential(arg){arg=normalize(arg.a,arg.b);if(!arg.a.size)return R(1);const name='exp:'+serialize(arg);expArgs.set(name,arg);return atom(name);}
  function fun(name,arg){
   arg=normalize(arg.a,arg.b);if(name==='exp')return exponential(arg);
   if(!arg.a.size){if(['sin','tan'].includes(name))return R(0);if(['cos','sec'].includes(name))return R(1);}
   if(['sin','cos','tan','sec','csc','cot'].includes(name)){
    // Normalize parity before assigning a formal function atom.
    const first=[...arg.a].sort((a,b)=>a[0].localeCompare(b[0]))[0]?.[1];let sign=1;if(first?.[0]<0n){arg=rn(arg);if(['sin','tan','csc','cot'].includes(name))sign=-1;}
    const key=serialize(arg),sin=atom('sin:'+key),cos=atom('cos:'+key);trigArgs.set(key,arg);
    const value=name==='sin'?sin:name==='cos'?cos:name==='tan'?rd(sin,cos):name==='sec'?rd(R(1),cos):name==='csc'?rd(R(1),sin):rd(cos,sin);
    return sign<0?rn(value):value;
   }
   return atom(name+':'+serialize(arg));
  }
  function build(t,depth=0){
   bump();if(depth>70)throw Error('expression too deep');
   if(t.kind==='number')return{a:constant(literal(t.value)),b:constant(q(1))};
   if(t.kind==='variable')return atom(t.name);
   if(t.kind==='constant')return t.name==='e'?exponential(R(1)):atom('pi');
   if(t.kind==='unary'){const v=build(t.value,depth+1);return t.op==='-'?rn(v):v;}
   if(t.kind==='function'){
    if(!['sin','cos','tan','sec','csc','cot','ln','exp','sqrt','abs'].includes(t.name))throw Error('unsupported function');
    if(t.name==='ln'&&positiveX&&t.argument.kind==='op'&&t.argument.op==='^'&&t.argument.left.kind==='variable'&&t.argument.left.name==='x'){
     const power=integer(build(t.argument.right,depth+1));if(power!==null)return rs(fun('ln',atom('x')),q(power));
    }
    return fun(t.name,build(t.argument,depth+1));
   }
   if(t.kind!=='op')throw Error('expression');
   if(t.op==='^'&&t.left.kind==='constant'&&t.left.name==='e')return exponential(build(t.right,depth+1));
   const a=build(t.left,depth+1),b=build(t.right,depth+1);
   if(t.op==='+')return ra(a,b);if(t.op==='-')return ra(a,rn(b));if(t.op==='*')return rm(a,b);if(t.op==='/')return rd(a,b);
   if(t.op==='^'){const n=integer(b);if(n===null){
    if(newtonRoots&&b.a.size===1&&b.a.has('[]')&&b.b.size===1&&b.b.has('[]')){const r=qd(b.a.get('[]'),b.b.get('[]'));if(r[1]===2n&&[1n,-1n].includes(r[0])){const root=fun('sqrt',a);return r[0]<0n?rd(R(1),root):root;}}
    return atom('pow:'+serialize(a)+':'+serialize(b));}if(Math.abs(n)>16)throw Error('power too large');let out=R(1);for(let i=0;i<Math.abs(n);i++)out=rm(out,a);return n<0?rd(R(1),out):out;}
   throw Error('operator');
  }
  const result=build(tree);return{result,serialize,equal:other=>{const b=build(other),difference=trigReduce(pa(pm(result.a,b.b),pn(pm(b.a,result.b))));return difference.size===0;}};
 }

 // At least 12 valid points across the domain, purely relative tolerance 1e-9 (no absolute slack, so tiny functions are not confused with 0), and the student's
 // expression must be defined wherever the intended answer is defined.
 function numericAgreement(tree,expected,probes){
  const span=probes&&probes.length?Math.max(...probes.map(Math.abs))*.95:.95,points=Array.from({length:25},(_,i)=>-span+2*span*i/24);
  let valid=0;
  const wants=points.map(x=>{try{const v=parser.evaluate(expected,{x});return Number.isFinite(v)?v:null;}catch(_){return null;}});
  // Round-off slack scaled to this function's typical (median) size: a fixed 1e-15 hid factors such as 2
  // when the answer is near 1e-28 everywhere (e^(-4(x-4)^2) close to x = 0), and the largest value would
  // let one huge point (e^(3e^(3x)) near x = 1) excuse errors everywhere else.
  const sizes=wants.filter(v=>v!==null).map(Math.abs).sort((a,b)=>a-b),slack=sizes.length?1e-12*sizes[Math.floor(sizes.length/2)]:0;
  for(let i=0;i<points.length;i++){
   const want=wants[i],x=points[i];if(want===null)continue;
   let got;try{got=parser.evaluate(tree,{x});}catch(_){return false;}
   if(!Number.isFinite(got)||Math.abs(want-got)>1e-9*Math.max(Math.abs(want),Math.abs(got))+slack)return false;
   valid++;
  }
  return valid>=12;
 }
 function check(raw,answer){
  if(!['newton-expression','function-expression'].includes(answer.kind))return legacyCheck(raw,answer);
  const message=answer.kind==='newton-expression'?'Enter a valid expression using k and n.':'Enter a valid exact expression in x.';
  if(!String(raw||'').trim())return{valid:false,message:'Enter an answer before checking.'};if(String(raw).length>2500)return{valid:false,message:'Enter a shorter expression.'};
  try{
   if(answer.kind==='newton-expression'){
    const form=window.BatchMathNewtonNotation.read(raw);
    if(form.complete){
     const mapN=s=>{if(/(?<![a-z])[kxy](?![a-z])/i.test(s))throw Error('bound variable');return s.replace(/(?<![a-z])n(?![a-z])/g,'x');};
     const same=(a,b)=>normalForm(parser.parse(mapN(a))).equal(parser.parse(b));
     if(form.limit?.length!==2||form.limit[0]!=='n'||!['infinity','+infinity'].includes(form.limit[1])||form.index.length!==2||form.index[0]!=='k'||!same(form.index[1],'1')||!same(form.upper,'x'))return{valid:true,ok:false};
     const outside=mapN(form.outer),factor=outside.replace('@','1'),outer=outside.replace('@','y');
     if(!normalForm(parser.parse(outer)).equal(parser.parse(`(${factor})*y`)))return{valid:true,ok:false};
    }
   }
   const text=prepare(raw,answer.kind),want=prepare(answer.expression,answer.kind),tree=parser.parse(text),expected=parser.parse(want);
   const contexts=answer.kind==='newton-expression'?[{x:2,y:1},{x:3,y:3},{x:7,y:2},{x:11,y:7},{x:23,y:13}]:(answer.probes||[-.83,-.37,0,.19,.61,.94]).map(x=>({x}));
   for(const context of contexts){const actual=parser.evaluate(tree,context);if(!Number.isFinite(actual))throw Error('undefined answer');}
   const normal=normalForm(tree,{positiveX:Boolean(answer.positiveX),newtonRoots:answer.kind==='newton-expression'});
   let ok=false;try{ok=normal.equal(expected);}catch(_){ok=false;}
   // Safety net for equivalent forms the exact normal form cannot reduce: require agreement at many domain points.
   if(!ok&&answer.kind==='function-expression')ok=numericAgreement(tree,expected,answer.probes);
   return{valid:true,ok};
  }catch(_){return{valid:false,message};}
 }
 const legacyCheck=legacy.check.bind(legacy);legacy.check=check;
 window.BatchMathUnit4DefiniteAnswers={check,prepare};
})();

/* v12.8.U exact checking for the final four integrals engines.
   antiderivative: equal to the intended answer up to an additive constant on
   every interval of its domain, defined wherever it is defined, and + C present.
   exact-number: one exact real value. exact-list: a set of exact values, or
   "Does not apply". Decimals never stand in for exact answers. */
(function(){
 'use strict';
 const answers=window.BatchMathUnit4Answers,parser=window.BatchMathDerivativeExpressions;
 if(!answers||!parser)return;
 const prior=answers.check.bind(answers);
 const FN=['asin','acos','atan','acot','asec','acsc','sqrt','cbrt','root','sin','cos','tan','sec','csc','cot','ln','log','exp','abs'];
 const TRIG=['sin','cos','tan','sec','csc','cot'];
 const LETTER={x:'x',t:'t',theta:'θ',r:'r'};
 const fail=(code,extra)=>{const e=Error(code);e.code=code;e.extra=extra;throw e;};

 function lex(raw,variable){
  let s=String(raw??'').trim()
   .replace(/[−–—]/g,'-').replace(/[×·⋅∙]/g,'*').replace(/÷/g,'/').replace(/π/g,'pi').replace(/√/g,'sqrt').replace(/∛/g,'cbrt')
   .replace(/⁻¹/g,'^(-1)').replace(/²/g,'^2').replace(/³/g,'^3').replace(/[\[{]/g,'(').replace(/[\]}]/g,')').replace(/theta/gi,'θ');
  s=s.replace(/^\s*[A-Za-zθ]\s*(?:\(\s*[A-Za-zθ]\s*\))?\s*=\s*/,'');
  if(s.includes('='))fail('equals');
  for(let i=0;i<20&&/\|[^|]*\|/.test(s);i++)s=s.replace(/\|([^|]*)\|/,'(abs($1))');
  if(s.includes('|'))fail('bars');
  s=s.replace(/arc(sin|cos|tan|sec|csc|cot)/gi,'a$1');
  const tokens=[],letter=LETTER[variable];let i=0;
  while(i<s.length){
   const ch=s[i];
   if(/\s/.test(ch)){i++;continue;}
   if(/[0-9.]/.test(ch)){let j=i;while(j<s.length&&/[0-9.]/.test(s[j]))j++;const lit=s.slice(i,j);if(lit==='.'||(lit.match(/\./g)||[]).length>1)fail('number');tokens.push({t:'num',v:lit});i=j;continue;}
   if('+-*/^(),'.includes(ch)){tokens.push({t:ch});i++;continue;}
   if(/[A-Za-zθ]/.test(ch)){
    const rest=s.slice(i).toLowerCase(),fn=FN.find(f=>rest.startsWith(f));
    if(fn){tokens.push({t:'fn',v:fn});i+=fn.length;continue;}
    if(rest.startsWith('pi')){tokens.push({t:'const',v:'pi'});i+=2;continue;}
    if(ch==='e'){tokens.push({t:'const',v:'e'});i++;continue;}
    if(ch==='C'||ch==='c'){tokens.push({t:'C'});i++;continue;}
    if(letter&&ch===letter){tokens.push({t:'var'});i++;continue;}
    if(/[xtrθ]/.test(ch))fail(letter?'wrong-variable':'variable',ch);
    fail(/[kK]/.test(ch)?'constant-name':'letter',ch);
   }
   fail('character',ch);
  }
  return tokens;
 }
 // Matching close for the token at i, which must be '('.
 function closeAt(tokens,i){let d=0;for(let j=i;j<tokens.length;j++){if(tokens[j].t==='(')d++;else if(tokens[j].t===')'&&--d===0)return j;}fail('parenthesis');}
 // An argument written without parentheses, as in sin 3x, ln x or sin x^2.
 function bareArgument(tokens,i){
  if(tokens[i]?.t==='fn')return tokens[i+1]?.t==='('?closeAt(tokens,i+1)+1:bareArgument(tokens,i+1);
  let j=i;if(tokens[j]?.t==='num')j++;
  if(['var','const','C'].includes(tokens[j]?.t))j++;
  if(j===i)fail('function');
  if(tokens[j]?.t==='^'){j++;if(tokens[j]?.t==='-')j++;if(tokens[j]?.t==='('){j=closeAt(tokens,j)+1;}else if(['num','var','const'].includes(tokens[j]?.t))j++;else fail('power');}
  return j;
 }
 // Rewrites trig powers (sin^2 x), inverse notation (tan^-1 x), bare arguments,
 // cube roots and nth roots into the shared parser's grammar.
 function canonical(tokens){
  const out=[];
  for(let i=0;i<tokens.length;i++){
   const tok=tokens[i];
   if(tok.t!=='fn'){out.push(tok);continue;}
   let name=tok.v,power=null,j=i+1;
   if(TRIG.includes(name)&&tokens[j]?.t==='^'){
    j++;let sign='';
    if(tokens[j]?.t==='('&&tokens[j+1]?.t==='-'&&tokens[j+2]?.t==='num'&&tokens[j+3]?.t===')'){sign='-';power=tokens[j+2].v;j+=4;}
    else if(tokens[j]?.t==='('&&tokens[j+1]?.t==='num'&&tokens[j+2]?.t===')'){power=tokens[j+1].v;j+=3;}
    else if(tokens[j]?.t==='-'&&tokens[j+1]?.t==='num'){sign='-';power=tokens[j+1].v;j+=2;}
    else if(tokens[j]?.t==='num'){power=tokens[j].v;j++;}
    else fail('function power');
    power=sign+power;if(power==='-1'){name='a'+name;power=null;}
   }
   let arg;
   if(tokens[j]?.t==='('){const c=closeAt(tokens,j);arg=canonical(tokens.slice(j+1,c));j=c+1;}
   else{const e=bareArgument(tokens,j);arg=canonical(tokens.slice(j,e));j=e;}
   let piece;
   if(name==='cbrt')piece=[{t:'('},{t:'('},...arg,{t:')'},{t:'^'},{t:'('},{t:'num',v:'1'},{t:'/'},{t:'num',v:'3'},{t:')'},{t:')'}];
   else if(name==='root'){
    const comma=arg.findIndex(x=>x.t===',');if(comma<1)fail('root');
    piece=[{t:'('},{t:'('},...arg.slice(comma+1),{t:')'},{t:'^'},{t:'('},{t:'num',v:'1'},{t:'/'},{t:'('},...arg.slice(0,comma),{t:')'},{t:')'},{t:')'}];
   }else piece=[{t:'fn',v:name},{t:'('},...arg,{t:')'}];
   if(power!==null)piece=[{t:'('},...piece,{t:')'},{t:'^'},{t:'('},...(power.startsWith('-')?[{t:'-'},{t:'num',v:power.slice(1)}]:[{t:'num',v:power}]),{t:')'}];
   out.push({t:'group',items:piece});i=j-1;
  }
  return out;
 }
 function emit(tokens){
  const ends=t=>['num','var','const','C',')','group'].includes(t?.t),starts=t=>['num','var','const','C','fn','(','group'].includes(t?.t);
  let s='',prev=null;
  for(const tok of tokens){
   if(tok.t===','&&!tok.keep)fail('comma');
   if(ends(prev)&&starts(tok))s+='*';
   s+=tok.t==='num'?tok.v:tok.t==='var'?'x':tok.t==='C'?'y':tok.t==='const'?tok.v:tok.t==='fn'?tok.v:tok.t==='group'?emit(tok.items.map(x=>x.t===','?{...x,keep:true}:x)):tok.t;
   prev=tok;
  }
  return s;
 }
 function parseInput(raw,variable){return parser.parse(emit(canonical(lex(raw,variable))));}

 // Real-valued evaluation: odd roots of negative numbers are real, as in class.
 function rational(v){for(let q=1;q<=64;q++){const p=Math.round(v*q);if(Math.abs(v*q-p)<1e-9)return[p,q];}return null;}
 function realPow(a,b){
  if(a>=0||Number.isInteger(b))return Math.pow(a,b);
  const r=rational(b);if(!r||r[1]%2===0)return NaN;
  const m=Math.pow(-a,b);return r[0]%2===0?m:-m;
 }
 function evaluate(t,ctx){
  if(t.kind==='number')return t.value;
  if(t.kind==='constant')return t.name==='pi'?Math.PI:Math.E;
  if(t.kind==='variable'){const v=ctx[t.name];if(!Number.isFinite(v))throw Error('variable');return v;}
  if(t.kind==='unary'){const v=evaluate(t.value,ctx);return t.op==='-'?-v:v;}
  if(t.kind==='op'){
   const a=evaluate(t.left,ctx),b=evaluate(t.right,ctx);
   return t.op==='+'?a+b:t.op==='-'?a-b:t.op==='*'?a*b:t.op==='/'?a/b:realPow(a,b);
  }
  const a=evaluate(t.argument,ctx);
  switch(t.name){
   case 'sin':return Math.sin(a);case 'cos':return Math.cos(a);case 'tan':return Math.tan(a);
   case 'sec':return 1/Math.cos(a);case 'csc':return 1/Math.sin(a);case 'cot':return Math.cos(a)/Math.sin(a);
   case 'asin':return Math.asin(a);case 'acos':return Math.acos(a);case 'atan':return Math.atan(a);
   case 'acot':return Math.PI/2-Math.atan(a);case 'asec':return Math.acos(1/a);case 'acsc':return Math.asin(1/a);
   case 'ln':return a>0?Math.log(a):NaN;case 'log':return a>0?Math.log10(a):NaN;case 'exp':return Math.exp(a);
   case 'sqrt':return a>=0?Math.sqrt(a):NaN;case 'abs':return Math.abs(a);
  }
  throw Error('function');
 }
 const uses=(t,name)=>!!t&&(t.kind==='variable'&&t.name===name||['value','left','right','argument'].some(k=>uses(t[k],name)));
 const decimalUsed=raw=>/(?:^|[^A-Za-z0-9.])(?:\d+\.\d*|\.\d+)/.test(String(raw||''));
 const shown=v=>v==='theta'?'θ':v||'x';
 function inputMessage(e,variable,kind){
  const v=shown(variable);
  if(e.code==='constant-name')return 'Use C for the constant of integration.';
  if(e.code==='wrong-variable')return `This problem uses ${v}. Write your answer in terms of ${v}.`;
  if(e.code==='variable')return 'Enter a number. The answer should not contain a variable.';
  if(e.code==='bars')return 'Close each absolute value.';
  if(kind==='antiderivative')return `Enter a valid expression in ${v}, including + C.`;
  return 'Enter a valid exact value.';
 }
 function points(components){
  return (components&&components.length?components:[[-3,3]]).map(([a,b])=>Array.from({length:29},(_,k)=>a+(b-a)*(k+0.41)/29));
 }

 function checkAntiderivative(raw,answer){
  if(!String(raw||'').trim())return{valid:false,message:'Enter an answer before checking.'};
  let tree;try{tree=parseInput(raw,answer.variable||'x');}catch(e){return{valid:false,message:inputMessage(e,answer.variable,'antiderivative')};}
  if(decimalUsed(raw))return{valid:true,ok:false,note:'Use exact values. Decimal approximations are not accepted.'};
  const expected=parseInput(answer.expression,'x'),groups=points(answer.components);
  // Equal up to one additive constant on each interval of the intended domain,
  // and defined at every point where the intended answer is defined.
  for(const group of groups){
   let ref=null,count=0;
   for(const x of group){
    let want;try{want=evaluate(expected,{x,y:0});}catch(_){continue;}
    if(!Number.isFinite(want))continue;
    let got;try{got=evaluate(tree,{x,y:0});}catch(_){got=NaN;}
    if(!Number.isFinite(got))return{valid:true,ok:false};
    const d=got-want,scale=Math.abs(got)+Math.abs(want);
    if(!ref)ref={d,scale};else if(Math.abs(d-ref.d)>1e-9*(scale+ref.scale)+1e-10)return{valid:true,ok:false};
    count++;
   }
   if(count<8)return{valid:true,ok:false};
  }
  if(!uses(tree,'y'))return{valid:true,ok:false,note:'Your antiderivative is correct, but you forgot + C.'};
  // C must be an added arbitrary constant, not a factor of another term.
  let k=null;
  for(const group of groups)for(const x of group.slice(0,8)){
   let f0,f1,f2;try{f0=evaluate(tree,{x,y:0});f1=evaluate(tree,{x,y:1});f2=evaluate(tree,{x,y:2});}catch(_){f0=NaN;}
   const tol=1e-9*(Math.abs(f0)+Math.abs(f1)+Math.abs(f2))+1e-10,d1=f1-f0;
   if(![f0,f1,f2].every(Number.isFinite)||Math.abs(d1)<1e-6||Math.abs(f2-f0-2*d1)>tol||k!==null&&Math.abs(d1-k)>tol)return{valid:true,ok:false,note:'Add the constant of integration as + C.'};
   k=d1;
  }
  return{valid:true,ok:true};
 }
 function exactValue(raw){
  const tree=parseInput(raw,null);
  if(uses(tree,'y'))fail('constant-in-number');
  const v=evaluate(tree,{});if(!Number.isFinite(v))fail('undefined');return v;
 }
 const same=(a,b)=>Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));
 function checkNumber(raw,answer){
  if(!String(raw||'').trim())return{valid:false,message:'Enter an answer before checking.'};
  let got;try{got=exactValue(raw);}catch(e){return{valid:false,message:e.code==='undefined'?'That expression is undefined. Check it and try again.':inputMessage(e,null,'number')};}
  if(decimalUsed(raw))return{valid:true,ok:false,note:'Use an exact value. Decimal approximations are not accepted.'};
  return{valid:true,ok:same(got,evaluate(parseInput(answer.expression,null),{}))};
 }
 function splitList(text){
  const parts=[];let depth=0,start=0;
  for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='('||ch==='[')depth++;else if(ch===')'||ch===']')depth--;else if((ch===','||ch===';')&&depth===0){parts.push(text.slice(start,i));start=i+1;}}
  parts.push(text.slice(start));
  return parts.flatMap(p=>p.split(/\band\b/i)).map(p=>p.trim()).filter(Boolean)
   .flatMap(p=>p.includes('±')?[p.replace('±','+'),p.replace('±','-')]:[p]);
 }
 function checkList(raw,answer){
  const text=String(raw||'').trim();
  if(!text)return{valid:false,message:'Enter every value of c, or choose Does not apply.'};
  const none=/^(?:does\s*not\s*apply|dna|none)$/i.test(text.replace(/\s+/g,' '));
  if(none)return{valid:true,ok:!!answer.none};
  if(/does\s*not\s*apply/i.test(text))return{valid:false,message:'Enter either the values of c or Does not apply, not both.'};
  let values;
  try{values=splitList(text.replace(/^\s*\{|\}\s*$/g,'')).map(p=>exactValue(p.replace(/^\s*c\s*=\s*/i,'')));}
  catch(e){return{valid:false,message:'Enter each exact value of c, separated by commas.'};}
  if(decimalUsed(text))return{valid:true,ok:false,note:'Use exact values. Decimal approximations are not accepted.'};
  if(answer.none)return{valid:true,ok:false};
  const want=answer.values.map(v=>evaluate(parseInput(v,null),{})).sort((a,b)=>a-b),got=[...values].sort((a,b)=>a-b);
  for(let i=1;i<got.length;i++)if(same(got[i],got[i-1]))return{valid:true,ok:false,note:'List each value of c only once.'};
  return{valid:true,ok:got.length===want.length&&got.every((v,i)=>same(v,want[i]))};
 }
 function check(raw,answer){
  if(answer?.kind==='antiderivative')return checkAntiderivative(raw,answer);
  if(answer?.kind==='exact-number')return checkNumber(raw,answer);
  if(answer?.kind==='exact-list')return checkList(raw,answer);
  return prior(raw,answer);
 }
 answers.check=check;
 window.BatchMathUnit4Integrals=Object.freeze({check,parseInput,evaluate,realPow});
})();
