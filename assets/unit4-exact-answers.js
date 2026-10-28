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
