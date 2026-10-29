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
  }else s=s.replace(/^\s*(?:F\s*['′]\s*(?:\(\s*x\s*\))?|y\s*['′]|dy\s*\/\s*dx)\s*=\s*/i,'');
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
  for(const x of points){
   let want;try{want=parser.evaluate(expected,{x});}catch(_){continue;}
   if(!Number.isFinite(want))continue;
   let got;try{got=parser.evaluate(tree,{x});}catch(_){return false;}
   if(!Number.isFinite(got)||Math.abs(want-got)>1e-9*Math.max(Math.abs(want),Math.abs(got))+1e-15)return false;
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
