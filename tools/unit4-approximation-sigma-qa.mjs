#!/usr/bin/env node
// Focused independent mathematical QA for the three shared Unit 4 engines.
// No generated report is checked into the website; stdout is the current run.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'assets/ap-topic-generators.js'),'utf8');
let state=0x128abcdef;
function random(){state=(state+0x6D2B79F5)|0;let t=Math.imul(state^(state>>>15),1|state);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;}
const box={window:{BatchMathRNG:{random}},console};vm.createContext(box);vm.runInContext(source,box);
vm.runInContext(fs.readFileSync(path.join(root,'assets/derivative-expression-checker.js'),'utf8'),box);
vm.runInContext(fs.readFileSync(path.join(root,'assets/unit4-exact-answers.js'),'utf8'),box);
const get=slug=>box.window.BatchMathAPTopicGenerators.get(slug);
// Read the emitted TeX independently as arithmetic. This catches display-only
// errors (for example 2k -> 22 instead of 2(2)) that metadata-only tests miss.
function texArithmetic(tex){
 let s=String(tex),i=0;
 const spaces=()=>{while(/\s/.test(s[i]||'')&&i<s.length)i++;};
 function atom(){spaces();if(s[i]==='{'){i++;return '('+parse('}')+')';}if(s[i]==='('){i++;return '('+parse(')')+')';}const m=s.slice(i).match(/^[0-9]+/);if(m){i+=m[0].length;return m[0];}if(s[i]==='n'){i++;return 'x';}if(s[i]==='k'){i++;return 'y';}if(/[xy]/.test(s[i]||''))return s[i++];if(s[i]==='e'){i++;return '(e)';}throw Error('Unsupported TeX atom '+s.slice(i));}
 function parse(stop=''){
  let out='';while(i<s.length){const ch=s[i];if(stop&&ch===stop){i++;break;}if(/\s/.test(ch)||ch==='&'){i++;continue;}
   if(ch==='\\'){i++;if(s[i]==='\\'){i++;continue;}const m=s.slice(i).match(/^[A-Za-z]+/);if(!m){i++;continue;}const command=m[0];i+=command.length;
    if(['frac','dfrac','tfrac'].includes(command)){const a=atom(),b=atom();out+=`(${a}/${b})`;}
    else if(command==='sqrt')out+=`sqrt(${atom()})`;
    else if(command==='pi')out+='(pi)';
    else if(['ln','sin','cos'].includes(command))out+=`${command}(${atom()})`;
    else if(command==='cdot'||command==='times')out+='*';
    else if(command==='begin'||command==='end'){spaces();if(s[i]==='{'){i++;while(i<s.length&&s[i]!=='}')i++;i++;}}
    else if(!['displaystyle','left','right','quad','qquad','Bigl','Bigr','bigl','bigr'].includes(command))throw Error('Unsupported TeX command '+command);
    continue;
   }
   if(ch==='{'){i++;out+='('+parse('}')+')';continue;}if(ch==='('){i++;out+='('+parse(')')+')';continue;}
   if(ch==='n'){i++;out+='x';continue;}if(ch==='k'){i++;out+='y';continue;}if(ch==='e'){i++;out+='(e)';continue;}
   out+=ch;i++;
  }return out;
 }
 return parse();
}
function displayedNumber(tex,n,k){const parser=box.window.BatchMathDerivativeExpressions,expr=texArithmetic(tex);try{return parser.evaluate(parser.parse(expr),{x:n,y:k});}catch(e){throw Error(`Displayed TeX parse failed: ${tex} -> ${expr}: ${e}`);}}
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
function Q(a,b=1n){a=BigInt(a);b=BigInt(b);if(b<0n){a=-a;b=-b;}const d=gcd(a,b);return[a/d,b/d];}
const add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),sub=(a,b)=>add(a,[-b[0],b[1]]),div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]);
const from=a=>Q(a[0],a[1]),number=a=>Number(a[0])/Number(a[1]),zero=()=>Q(0),sum=xs=>xs.reduce(add,zero());
const near=(a,b,context)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${context}: ${a} != ${b}`);
function exactNumber(e){let out=0;for(const[k,c]of Object.entries(e)){let atom=1;for(const part of k.split('*').filter(Boolean)){if(part==='pi')atom*=Math.PI;else if(part.startsWith('sqrt'))atom*=Math.sqrt(Number(part.slice(4)));else if(part.startsWith('ln'))atom*=Math.log(Number(part.slice(2)));else if(part.startsWith('exp:')){const[,b,n,d]=part.split(':');atom*=(b==='e'?Math.E:Number(b))**(Number(n)/Number(d));}else throw Error('Unknown exact atom '+part);}out+=c[0]/c[1]*atom;}return out;}
const poly=(coeff,x)=>coeff.reduceRight((a,c)=>add(mul(a,x),from(c)),zero());
function evaluate(f,x){if(f.coeff)return number(poly(f.coeff,x));const t=number(x),A=f.A[0]/f.A[1],offset=f.offset[0]/f.offset[1];if(f.family==='logarithmic')return A*(offset+Math.log(t));if(f.family==='rational')return offset+A/(t+f.shift)**f.power;if(f.family==='exponential')return offset+A*(f.base==='e'?Math.E:f.base)**(f.rate*t);if(f.family==='radical')return offset+A*Math.sqrt(t+f.shift);if(f.family==='trigonometric')return offset+A*Math[f.trig](Math.PI*(f.rate*t+(f.phase||0)));throw Error('Unknown function');}
const polynomialAt=(c,x)=>c.reduceRight((s,v)=>s*x+v,0),differentiate=c=>c.slice(1).map((v,i)=>v*(i+1));
// Independent interval analysis: polynomial extrema occur only at endpoints
// or roots of the derivative. Recursive derivative isolation catches even
// narrow/tangent critical points that a uniform sampling grid could miss.
function polynomialRoots(c,a,b){
 c=c.slice();while(c.length>1&&Math.abs(c.at(-1))<1e-14)c.pop();if(c.length<=1)return [];
 if(c.length===2){const x=-c[0]/c[1];return x>a&&x<b?[x]:[];}
 const cuts=[a,...polynomialRoots(differentiate(c),a,b),b],roots=[];
 for(const x of cuts)if(Math.abs(polynomialAt(c,x))<1e-10)roots.push(x);
 for(let i=0;i<cuts.length-1;i++){let l=cuts[i],r=cuts[i+1],fl=polynomialAt(c,l),fr=polynomialAt(c,r);if(fl*fr>=0)continue;for(let j=0;j<60;j++){const m=(l+r)/2,fm=polynomialAt(c,m);if(fl*fm<=0){r=m;fr=fm;}else{l=m;fl=fm;}}roots.push((l+r)/2);}
 return roots.filter((x,i)=>x>a&&x<b&&!roots.slice(0,i).some(y=>Math.abs(x-y)<1e-8)).sort((x,y)=>x-y);
}
function verifyWholeInterval(model,a,b,second,sign){
 let values;
 if(model.coeff){let c=model.coeff.map(v=>v[0]/v[1]);c=differentiate(c);if(second)c=differentiate(c);values=[a,...polynomialRoots(differentiate(c),a,b),b].map(x=>polynomialAt(c,x));}
 else{
  const A=model.A[0]/model.A[1];
  if(model.family==='rational'){assert.ok(a+model.shift>0&&b+model.shift>0,'Rational domain on full interval');values=[second?A:-A];}
  else if(model.family==='logarithmic'){assert.ok(a>0,'Log domain on full interval');values=[second?-A:A];}
  else if(model.family==='radical'){assert.ok(a+model.shift>0,'Root derivative domain on full interval');values=[second?-A:A];}
  else if(model.family==='exponential'){assert.ok(model.base==='e'||model.base>0&&model.base!==1);values=[second?A:A*model.rate];}
  else{
   const lo=Math.PI*(model.rate*a+(model.phase||0)),hi=Math.PI*(model.rate*b+(model.phase||0)),angles=[lo,hi];for(let k=Math.ceil(lo/(Math.PI/2));k<=Math.floor(hi/(Math.PI/2));k++)angles.push(k*Math.PI/2);
   values=angles.map(t=>second?-A*Math[model.trig](t):A*(model.trig==='sin'?Math.cos(t):-Math.sin(t)));
  }
 }
 assert.ok(values.every(v=>sign*v>=-1e-8)&&values.some(v=>sign*v>1e-8),'Claim fails independent whole-interval derivative analysis');
}
const inc=(map,key)=>map[key]=(map[key]||0)+1;
const stats={};
function nValue(p,n){const N=Q(n);return sum(Object.entries(p).map(([power,c])=>{const k=Number(power),term=Q(BigInt(n)**BigInt(Math.abs(k)));return k<0?div(from(c),term):mul(from(c),term);}));}
function sigma(p){
 const d=p.unit4Meta,choices=[],selected=d.family==='numerical'?d.answer:{npoly:d.expected};assert.equal(d.kind,'sigma');assert.equal(p.answerType,'staged-calculus');assert.equal(p.stage1.type,'unit4-exact');assert.ok(['numerical','identities','riemann'].includes(d.family));assert.ok(!p.choices);
 const text=[p.questionHtml,p.explanation,p.answerTex].join(' ');
 assert.ok(!/(?:^|[^\d])1k|[kn]\^\{1\}|[kn]\^1(?!\d)|\\frac\{[^{}]+\}\{1\}/.test(text),'Bad sigma simplification');assert.ok(/<ol class="u4-work">/.test(p.explanation));
 const finite=(coeff,a,b)=>{const out=[];for(let k=a;k<=b;k++)out.push(poly(coeff,Q(k)));return out;};
 if(d.family==='read'){
  if(d.symbolic)assert.equal(selected,d.answer);
  else{const terms=finite(d.coeff,d.lower,d.upper).map(number);let answer;
   if(d.task==='expand')answer=terms;
   else if(d.task==='index')answer='k';
   else if(d.task==='first')answer=terms[0];else if(d.task==='last')answer=terms.at(-1);
   else if(d.task==='count')answer=d.upper-d.lower+1;else answer=d[d.task];
   assert.deepEqual(JSON.parse(JSON.stringify(selected)),answer,'Reading sigma notation');
  }
 }else if(d.family==='numerical')assert.equal(selected,number(sum(finite(d.coeff,d.lower,d.upper))),'Finite sum');
 else if(d.family==='write'){
  const expected=finite(d.coeff,d.lower,d.upper).map(number);
  choices.forEach((c,i)=>assert.equal(JSON.stringify(finite(c.coeff,c.lower,c.upper).map(number))===JSON.stringify(expected),i===p.correctIndex,'Writing sigma notation'));
 }else{
  const trials=[1,2,3,5,8,11];
  function actual(n){
   if(d.family==='identities')return sum(finite(d.coeff,1,n));
   if(d.subtype==='constant')return mul(Q(n),div(from(d.constant),Q(BigInt(n)**BigInt(d.power))));
   if(d.original){const {polynomial,a,width}=d.original;return sum(Array.from({length:n},(_,i)=>mul(poly(polynomial,add(Q(a),Q(width*(i+1),n))),Q(width,n))));}
   return sum(Array.from({length:n},(_,i)=>sum(d.coeff.map((c,p)=>div(mul(from(c),Q(BigInt(i+1)**BigInt(p))),Q(BigInt(n)**BigInt(p+1)))))));
  }
  trials.forEach(n=>{assert.deepEqual(nValue(d.expected,n),actual(n),'Independent symbolic sum at n='+n);assert.deepEqual(nValue(selected.npoly,n),actual(n),'Correct symbolic choice');});
  trials.forEach(n=>near(displayedNumber(p.answerTex,n),number(actual(n)),'Displayed symbolic answer'));
  const canonical=Object.entries(d.expected).map(([k,c])=>`(${c[0]}/${c[1]})*n^(${k})`).join('+')||'0';
  assert.equal(box.window.BatchMathUnit4Answers.check(canonical,p.stage1.unit4Answer).ok,true,'Canonical n answer');
  assert.equal(box.window.BatchMathUnit4Answers.check(`(${canonical})+1`,p.stage1.unit4Answer).ok,false,'Incorrect n answer');
  choices.forEach((c,i)=>{assert.ok(c.npoly);const equivalent=trials.every(n=>{const a=nValue(c.npoly,n),b=actual(n);return a[0]===b[0]&&a[1]===b[1];});assert.equal(equivalent,i===p.correctIndex,'Equivalent symbolic distractor');});
  choices.forEach((c,i)=>trials.forEach(n=>near(displayedNumber(p.choices[i],n),number(nValue(c.npoly,n)),'Displayed symbolic choice')));
  const flows=[...p.explanation.matchAll(/<div class="u4-work-equation u4-math-flow">([^]*?)<\/div>/g)].map(m=>[...m[1].matchAll(/\\\(\\displaystyle ([^]*?)\\\)/g)].map(t=>t[1]).join(''));
  for(const flow of flows)if(flow.startsWith('S=')&&!flow.includes('\\sum'))for(const n of [1,3,7])near(displayedNumber(flow.slice(2),n),number(actual(n)),'Worked identity substitution');
  if(d.family==='riemann'&&d.subtype==='constant'){
   const math=[...p.explanation.matchAll(/\\\((?:\\displaystyle\s*)?([^]*?)\\\)/g)].map(m=>m[1]).find(s=>s.includes('\\sum'));
   assert.ok(math);for(const part of math.split('=').slice(-2))for(const n of [1,3,7])near(displayedNumber(part,n),number(actual(n)),'Worked constant sum');
  }
  if(d.original){
   const equations=flows.filter(s=>s.startsWith('f'));assert.equal(equations.length,2);
   for(const n of [2,5,9])for(const k of [1,n]){const value=poly(d.original.polynomial,add(Q(d.original.a),Q(d.original.width*k,n)));equations.forEach((m,i)=>near(displayedNumber(m.split('=').at(-1),n,k),number(i?mul(value,Q(d.original.width,n)):value),'Worked sample-point expansion'));}
  }
  if(d.original){for(const n of [2,5,9])for(let k=1;k<=n;k++){const original=mul(poly(d.original.polynomial,add(Q(d.original.a),Q(d.original.width*k,n))),Q(d.original.width,n)),expanded=sum(d.coeff.map((c,p)=>div(mul(from(c),Q(BigInt(k)**BigInt(p))),Q(BigInt(n)**BigInt(p+1)))));assert.deepEqual(original,expanded,'Substituted sample-point expansion');}}
 }
 if(d.family==='numerical'||(d.family==='read'&&['first','last'].includes(d.task))){
  for(const m of p.explanation.matchAll(/\\\((?:\\displaystyle\s*)?([^]*?)\\\)/g)){const eq=m[1].match(/^([^=]+)=(-?\d+)$/);if(eq&&!/[A-Za-z\\]/.test(eq[1]))near(displayedNumber(eq[1]),Number(eq[2]),'Displayed numeric substitution');}
 }
 if(d.family==='write')for(const m of p.explanation.matchAll(/a_(?:\{\d+\}|\d+)=([^=]+)=(-?\d+)/g))near(displayedNumber(m[1]),Number(m[2]),'Displayed term formula');
 const s=stats.sigma||(stats.sigma={total:0,family:{},subtype:{},features:{}});s.total++;inc(s.family,d.family);inc(s.subtype,`${d.family}/${d.subtype}`);if(d.coeff)inc(s.features,`degree_${d.coeff.length-1}`);if(d.expected)inc(s.features,'symbolic_n_answer');if(d.subtype==='constant'&&d.family==='riemann')inc(s.features,'constant_with_respect_to_k');
}
function approximation(p){
 const d=p.unit4Meta;assert.ok(d,'Missing shared Unit 4 metadata');
 assert.ok(d.n>=2&&d.n<=4,'Approximation exceeds four subintervals');
 assert.equal(p.answerType,'staged-calculus');assert.equal(p.stage1.type,'unit4-exact');assert.ok(!p.choices);assert.ok(['left','right','midpoint','trapezoid'].includes(d.mode));
 const text=[p.questionHtml,p.explanation,p.answerTex].join(' ');
 if(d.representation==='table'){
  assert.equal((p.questionHtml.match(/<tr>/g)||[]).length,2,'Table must have two horizontal rows');
  assert.ok(!/Outlined|highlight|u4-partition-endpoint|u4-table-key/.test(p.questionHtml),'No table answer cues');
  for(const m of p.questionHtml.matchAll(/<td([^>]*)>/g))assert.equal(m[1],'','All data cells must have the same ordinary markup');
  assert.doesNotMatch(p.questionHtml,/Subintervals:|Use the partition|u4-partition"/,'No partition giveaway');
  if(d.mode==='midpoint'){assert.equal(d.uniform,true,'Midpoint tables must use equal subintervals');assert.equal(d.rows.length-1,2*d.n,'Midpoint half-step grid must never be finer than 2n');}
  if(d.uniform)assert.match(p.questionHtml,new RegExp(`${d.n} equal subintervals`));
  if(!d.uniform)assert.equal(d.extraData,false,'Unequal tables must not have ambiguous extra columns');
 }
 assert.ok(!/midpoint-endpoint|\\int_-|(?:^|[^\d])1k|[xkn]\^\{1\}|[xkn]\^1(?!\d)/.test(text),'Unwanted notation '+p.id);
 assert.ok(!/\.\d{5}/.test(text),'Unexpected decimal approximation');
 const ends=d.ends.map(from),mids=ends.slice(0,-1).map((x,i)=>div(add(x,ends[i+1]),Q(2))),widths=ends.slice(0,-1).map((x,i)=>sub(ends[i+1],x));
 assert.equal(ends.length,d.n+1);
 widths.forEach((w,i)=>{assert.ok(number(w)>0);assert.deepEqual(from(d.widths[i]),w);});
 if(d.uniform)widths.forEach(w=>assert.deepEqual(w,widths[0]));else assert.ok(new Set(widths.map(w=>w.join('/'))).size>1);
 const data=new Map(d.rows.map(r=>[from(r.x).join('/'),r.y]));
 const at=x=>{const e=data.get(x.join('/'));assert.ok(e,'Missing required sample '+x.join('/'));if(d.f)near(exactNumber(e),evaluate(d.f,x),'Independent function evaluation');return exactNumber(e);};
 const needed=[...ends,...((d.mode==='midpoint'||d.mode==='matched')?mids:[])];needed.forEach(at);
 if(d.f)needed.forEach(x=>near(displayedNumber(d.f.tex,number(x)*(d.f.family==='trigonometric'?Math.PI:1)),evaluate(d.f,x),`Displayed function ${d.f.tex} at ${x}: ${JSON.stringify(d.f)}`));
 if(d.extraData){const selected=d.mode==='midpoint'?mids:ends;assert.ok(d.rows.length>new Set(selected.map(x=>x.join('/'))).size,'Flagged extra data is not extra');assert.equal(d.rows.length-1,2*d.n,'Whole regular extra-data grid must be 2n, never 4n');}
 const unit=d.f?.family==='trigonometric'?Math.PI:1;
 const left=widths.reduce((s,w,i)=>s+unit*number(w)*at(ends[i]),0),right=widths.reduce((s,w,i)=>s+unit*number(w)*at(ends[i+1]),0),trap=widths.reduce((s,w,i)=>s+unit*number(w)*(at(ends[i])+at(ends[i+1]))/2,0);
 near(exactNumber(d.answers.left),left,'Left sum');near(exactNumber(d.answers.right),right,'Right sum');near(exactNumber(d.answers.trapezoid),trap,'Trapezoids');
 if(d.answers.midpoint){const mid=widths.reduce((s,w,i)=>s+unit*number(w)*at(mids[i]),0);near(exactNumber(d.answers.midpoint),mid,'Midpoint sum');}
 // Independently compare exact rational answers, not just floating values.
 if(!d.f||d.f.coeff||d.f.family==='rational'){
  const rationalAt=x=>{if(!d.f)return from(data.get(x.join('/'))['']||[0,1]);if(d.f.coeff)return poly(d.f.coeff,x);const u=add(x,Q(d.f.shift)),den=d.f.power===1?u:mul(u,u);return add(from(d.f.offset),div(from(d.f.A),den));};
  const result=xs=>sum(xs.map((x,i)=>mul(widths[i],rationalAt(x))));
  for(const[mode,xs]of [['left',ends.slice(0,-1)],['right',ends.slice(1)],...(d.answers.midpoint?[['midpoint',mids]]:[])])assert.deepEqual(from(d.answers[mode]['']||[0,1]),result(xs),'Exact rational '+mode);
  assert.deepEqual(from(d.answers.trapezoid['']||[0,1]),div(add(result(ends.slice(0,-1)),result(ends.slice(1))),Q(2)),'Exact rational trapezoids');
 }
 if(d.error){
  const model=d.f||d.tableModel;assert.ok(model,'Error claim requires a valid function or constructed table model');const useSecond=['midpoint','trapezoid'].includes(d.mode);let signs=[];
  if(d.representation==='table'){
   assert.match(p.questionHtml,new RegExp(`${useSecond?'':'strictly '}${d.error.behavior}`));
   d.rows.forEach(r=>near(exactNumber(r.y),evaluate(model,from(r.x)),'Table agrees with its construction'));
   const slopes=d.rows.slice(1).map((r,i)=>(exactNumber(r.y)-exactNumber(d.rows[i].y))/(number(from(r.x))-number(from(d.rows[i].x))));
   // Read every claimed property from the actual prompt, not its metadata.
   const monotone=/strictly increasing/.test(p.questionHtml)?1:/strictly decreasing/.test(p.questionHtml)?-1:0,concavity=/concave up/.test(p.questionHtml)?1:/concave down/.test(p.questionHtml)?-1:0;
   if(monotone)slopes.forEach(s=>assert.ok(monotone*s>1e-9,'Every stated monotonicity property must be true'));
   if(concavity)slopes.slice(1).forEach((s,i)=>assert.ok(concavity*(s-slopes[i])>1e-9,'Every stated concavity property must use actual x-spacing'));
   assert.ok(useSecond?concavity:monotone,'Required property was not stated');
   const required=d.error.behavior==='increasing'||d.error.behavior==='concave up'?1:-1;
   if(useSecond)slopes.slice(1).forEach((s,i)=>assert.ok(required*(s-slopes[i])>0,'Concavity must use actual x-spacing'));
   else slopes.forEach(s=>assert.ok(required*s>0,'Table monotonicity'));
  }
  for(let j=1;j<100;j++){const x=number(ends[0])+(number(ends.at(-1))-number(ends[0]))*j/100,t=d.f?.family==='trigonometric'?x*Math.PI:x;let derivative;
   if(model.coeff){const coeff=model.coeff.map(c=>c[0]/c[1]),ds=coeff.slice(1).map((c,i)=>c*(i+1)),dds=ds.slice(1).map((c,i)=>c*(i+1));derivative=(useSecond?dds:ds).reduceRight((a,c)=>a*x+c,0);}
   else if(d.f.family==='rational'){const A=d.f.A[0]/d.f.A[1],u=x+d.f.shift,k=d.f.power;derivative=useSecond?k*(k+1)*A/u**(k+2):-k*A/u**(k+1);}
   else if(d.f.family==='logarithmic'){const A=d.f.A[0]/d.f.A[1];derivative=useSecond?-A/x**2:A/x;}
   else if(d.f.family==='exponential'){const A=d.f.A[0]/d.f.A[1],b=d.f.base==='e'?Math.E:d.f.base,k=d.f.rate*Math.log(b);derivative=A*b**(d.f.rate*x)*(useSecond?k*k:k);}
   else if(d.f.family==='radical'){const A=d.f.A[0]/d.f.A[1],u=x+d.f.shift;derivative=useSecond?-A/(4*u**1.5):A/(2*Math.sqrt(u));}
   else derivative=useSecond?-d.f.A[0]/d.f.A[1]*Math[d.f.trig](d.f.rate*t):d.f.A[0]/d.f.A[1]*(d.f.trig==='sin'?Math.cos(d.f.rate*t):-Math.sin(d.f.rate*t));
   if(Math.abs(derivative)>1e-9)signs.push(Math.sign(derivative));
  }
  assert.ok(signs.length&&new Set(signs).size===1,'Error rule not valid on full interval');const sign=signs[0],over=d.mode==='midpoint'?sign<0:d.mode==='trapezoid'?sign>0:d.mode==='left'?sign<0:sign>0;assert.equal(d.error.over,over,'Incorrect over/underestimate');
  verifyWholeInterval(model,number(ends[0]),number(ends.at(-1)),useSecond,sign);
  const lo=number(ends[0]),hi=number(ends.at(-1));let integral;
  if(model.coeff)integral=model.coeff.reduce((s,c,i)=>s+c[0]/c[1]*(hi**(i+1)-lo**(i+1))/(i+1),0);
  else{let total=0;for(let i=0;i<=80;i++){const x=add(ends[0],mul(sub(ends.at(-1),ends[0]),Q(i,80)));total+=(i===0||i===80?1:i%2?4:2)*evaluate(model,x);}integral=(hi-lo)*total/240;}
  const error=exactNumber(d.answers[d.mode])-(model.family==='trigonometric'?Math.PI:1)*integral;
  assert.equal(error>0,d.error.over,'Independently integrated over/under classification');assert.ok(Math.abs(error)>1e-8,'Conceptual estimate should not accidentally be exact');
  const sketch=p.stage2.explanation;assert.match(sketch,/<svg/);assert.match(sketch,new RegExp(`data-method="${d.mode}"`));assert.equal(/Schematic:/.test(sketch),d.representation==='table');
  assert.doesNotMatch(sketch,/<figcaption/i,'Conceptual graphs must have no visible caption');
  assert.match(sketch,/<figure class="u4-approximation-sketch"><svg[^>]+role="img"[^>]+aria-label="[^"]+"[^>]*><title>[^<]+<\/title><desc>[^<]+<\/desc>[\s\S]*<\/svg><\/figure>$/,'Only the accessible SVG belongs inside the graph figure');
  const low=Number(sketch.match(/data-y-min="([^"]+)"/)[1]),high=Number(sketch.match(/data-y-max="([^"]+)"/)[1]);let gap=0,min=0,max=0;
  for(let i=0;i<d.n;i++)for(let j=0;j<=40;j++){
   const x=add(ends[i],mul(widths[i],Q(j,40))),y=evaluate(model,x),l=evaluate(model,ends[i]),r=evaluate(model,ends[i+1]),approx=d.mode==='trapezoid'?l+(r-l)*j/40:evaluate(model,d.mode==='left'?ends[i]:d.mode==='right'?ends[i+1]:mids[i]);
   assert.ok(y>low&&y<high&&approx>low&&approx<high,'Curve/approximation must not be clipped');gap=Math.max(gap,Math.abs(y-approx));min=Math.min(min,y,approx);max=Math.max(max,y,approx);
  }
  assert.ok(208*gap/(high-low)>=7.99,'Error geometry must have at least eight native pixels of visible separation');assert.ok((max-min)/(high-low)>.85,'Excessive unused graph range');
  for(const path of sketch.matchAll(/\bd="([ML0-9., Z-]+)"/g))for(const xy of path[1].matchAll(/(?:M|L)([0-9.-]+),([0-9.-]+)/g)){assert.ok(+xy[1]>=41.999&&+xy[1]<=422.001,'Sketch horizontal clipping');assert.ok(+xy[2]>=17.999&&+xy[2]<=226.001,'Sketch vertical clipping');}
  const pieces=[...sketch.matchAll(/data-left="([^"]+)" data-right="([^"]+)" data-left-height="([^"]+)" data-right-height="([^"]+)"/g)];assert.equal(pieces.length,d.n,'One shape per requested subinterval');
  pieces.forEach((m,i)=>{const l=number(ends[i]),r=number(ends[i+1]),sample=d.mode==='left'?ends[i]:d.mode==='right'?ends[i+1]:mids[i];near(+m[1],l,'Sketch left endpoint');near(+m[2],r,'Sketch right endpoint');near(+m[3],evaluate(model,d.mode==='trapezoid'?ends[i]:sample),'Sketch left height');near(+m[4],evaluate(model,d.mode==='trapezoid'?ends[i+1]:sample),'Sketch right height');});
 }
 const expected=exactNumber(d.answers[d.mode]);near(exactNumber(d.expected),expected,'Stored typed answer');near(displayedNumber(p.answerTex),expected,'Displayed typed answer');
 const checker=box.window.BatchMathUnit4Answers,answer=p.stage1.unit4Answer,canonical=checker.expression(d.expected);assert.equal(checker.check(canonical,answer).ok,true,'Typed exact answer');assert.equal(checker.check(`(${canonical})+1`,answer).ok,false,'Wrong typed answer');
 if(d.error){const stage=p.stage2;assert.equal(stage.choices.length,8);assert.equal(new Set(stage.choices).size,8);assert.equal(stage.choices[stage.correctIndex],`${d.error.over?'Overestimate':'Underestimate'} because the function is ${d.error.behavior}`);const reason=stage.choices[stage.correctIndex];assert.equal(/concave/.test(reason),['midpoint','trapezoid'].includes(d.mode),'Method-appropriate reason');}else assert.equal(p.stage2,null);
 assert.ok(/<ol class="u4-work">/.test(p.explanation),'Missing vertical worked solution');
 const s=stats[d.kind]||(stats[d.kind]={total:0,representation:{},family:{},mode:{},n:{},tableSpacing:{},extra:0,errors:0,features:{},cross:{}});s.total++;inc(s.representation,d.representation);inc(s.family,d.family);inc(s.mode,d.mode);inc(s.n,d.n);if(d.representation==='table'){inc(s.tableSpacing,d.uniform?'equal':'unequal');if(d.extraData)s.extra++;if(d.error)inc(s.features,'two_part_table');if(d.tableProperties?.monotone&&d.tableProperties?.concavity)inc(s.features,'dual_property_table');}else if(d.error)inc(s.features,'two_part_function');if(d.error){s.errors++;inc(s.features,`${d.mode}_${d.error.over?'overestimate':'underestimate'}`);}if(d.relation)inc(s.features,'left_right_relationship');if(d.f?.family==='quadratic')inc(s.features,`${d.f.coeff[2][0]>0?'upward':'downward'}_quadratic`);if(d.f?.coeff?.some(c=>c[1]!==1))inc(s.features,'fractional_coefficients');if(d.f?.trig)inc(s.features,d.f.trig);inc(s.cross,`${d.family}/${d.mode}/${d.n}`);
}
const sample=Number(process.env.BM_U4_QA_SAMPLES||12000),requested=process.argv.slice(2),slugs=requested.length?requested:['rectangular-approximations','trapezoidal-approximations','introduction-to-sigma-notation'];
for(const slug of slugs){for(let i=0;i<sample;i++){const p=get(slug)();if(p.unit4Meta?.kind==='sigma')sigma(p);else approximation(p);}console.log('PASS',slug,sample);}
for(const s of Object.values(stats).filter(s=>s.representation)){const ratio=s.representation.table/s.total;assert.ok(ratio>.47&&ratio<.53,'Representation not approximately 50/50');const two=s.features.two_part_table/s.representation.table,formula=s.features.two_part_function/s.representation.function;assert.ok(Math.abs(two-.75)<.025,'Table two-part distribution must be 75/25');assert.ok(Math.abs(formula-1/3)<.025,'Function two-part distribution must be 1/3');assert.ok(s.features.dual_property_table/s.features.two_part_table>.3,'Meaningful dual-property subset');assert.ok(s.extra/s.tableSpacing.equal>.25,'Extra-data equal tables must occur regularly');}
if(stats.sigma)for(const[family,target]of Object.entries({numerical:.15,identities:.4,riemann:.45}))assert.ok(Math.abs(stats.sigma.family[family]/stats.sigma.total-target)<.025,'Sigma weighting '+family);
for(const mode of ['left','right','midpoint'])for(let i=0;i<600;i++)assert.equal(get('rectangular-approximations')({rectangularMethod:mode}).unit4Meta.mode,mode,'Focused rectangular filter');
const answers=box.window.BatchMathUnit4Answers;for(const text of ['n(n+1)/2','(n^2+n)/2','n/2+n^2/2'])assert.equal(answers.check(text,{kind:'n-expression',value:{2:[1,2],1:[1,2]}}).ok,true,'Equivalent factored/reordered n expression');assert.equal(answers.check('n/0',{kind:'n-expression',value:{1:[1,1]}}).valid,false);
// With identical RNG state, filtered review must produce the exact same object.
for(const[mode,slug]of [['rect','rectangular-approximations'],['trap','trapezoidal-approximations'],['sigma','introduction-to-sigma-notation']]){
 if(!slugs.includes(slug))continue;
 for(let i=0;i<200;i++){state=128000+i;const focused=get(slug)();state=128000+i;const review=get('unit-4-comprehensive')({unit4Mode:mode});assert.equal(JSON.stringify(review),JSON.stringify(focused),'Comprehensive Review diverged: '+mode);}
 console.log('PASS shared Comprehensive Review inheritance',mode,200);
}
console.log(JSON.stringify(stats,null,2));
if(process.env.BM_U4_QA_OUTPUT)fs.writeFileSync(process.env.BM_U4_QA_OUTPUT,JSON.stringify({ok:true,samplePerEngine:sample,stats},null,2)+'\n');
