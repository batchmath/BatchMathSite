// Independent curriculum, exact-answer, distribution and architecture gate for N.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'qa-results');fs.mkdirSync(out,{recursive:true});
const source=JSON.parse(fs.readFileSync(path.join(root,'tools/unit4-v128n-curriculum.json'))),N=12000;
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)|0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
const sb={window:{},console};vm.createContext(sb);for(const f of ['ap-topic-generators','derivative-expression-checker','unit4-exact-answers'])vm.runInContext(fs.readFileSync(path.join(root,'assets/'+f+'.js'),'utf8'),sb);
const w=sb.window,parser=w.BatchMathDerivativeExpressions,get=slug=>w.BatchMathAPTopicGenerators.get(slug),check=w.BatchMathUnit4Answers.check;
const slug={newton:'evaluating-definite-integrals-with-a-limit-and-summation',geometry:'integrals-using-geometry',ftc:'fundamental-theorem-of-calculus',rules:'combining-integral-rules'};
const close=(a,b,label,tol=2e-9)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${label}: ${a} != ${b}`);
const evalExpr=(s,vars={})=>parser.evaluate(parser.parse(s),vars),qval=r=>r[0]/r[1];
const expr=a=>a.expression||w.BatchMathUnit4Answers.expression(a.value),scalar=s=>evalExpr(expr(s.unit4Answer));
const fn=(c,x)=>c.reduce((sum,n,i)=>sum+n*x**i,0);
function independentNewtonFunction(d,x){
 const {u,v,power,rate,shiftBy,denominator}=d;
 switch(d.subtype){
  case 'polynomial_sine':return u*x*x+v*Math.sin(x);
  case 'exponential_tangent':return u*Math.exp(x)+v*Math.tan(x);
  case 'polynomial_exponential':return u*x**power+v*Math.exp(rate*x);
  case 'radical_linear':return u*Math.sqrt(x+shiftBy)+v*x;
  case 'exponential_cosine':return u*Math.exp(rate*x)+v*Math.cos(rate*x);
  case 'rational_polynomial':return u/(x*x+denominator)+v*x**power;
  case 'logarithm_polynomial':return u*Math.log(x+shiftBy)+v*x**power;
  case 'logarithm_radical':return u*Math.log(x+shiftBy)+v*Math.sqrt(x+shiftBy);
  default:throw Error('Unrecognized Newton construction-only function');
 }
}
function newtonOracle(p){const d=p.unit4Meta,{a,b,width,coefficients:c}=d;assert.equal(b-a,width);const prepared=parser.parse(w.BatchMathUnit4DefiniteAnswers.prepare(p.stage1.unit4Answer.expression,'newton-expression'));
 for(const n of [7,13,31]){let sum=0;for(let k=1;k<=n;k++){const x=a+(b-a)*k/n,f=c?fn(c,x):independentNewtonFunction(d,x),term=f*(b-a)/n;close(parser.evaluate(prepared,{x:n,y:k}),term,'Newton substitution and delta x');sum+=term;}
  if(c){const [C,B=0,A=0]=c,dx=(b-a)/n;const finite=dx*(n*(A*a*a+B*a+C)+(2*A*a+B)*dx*n*(n+1)/2+A*dx*dx*n*(n+1)*(2*n+1)/6);close(sum,finite,'Independent finite sum');const e=d.expanded;close(sum,e[0]+e[1]*(n+1)/(2*n)+e[2]*(n+1)*(2*n+1)/(6*n*n),'Worked finite-sum coefficients');}
 }
 if(c){const value=c.reduce((s,n,i)=>s+n*(b**(i+1)-a**(i+1))/(i+1),0);close(scalar(p.stage2),value,'Independent polynomial integral');assert.match(p.stage2.explanation,/take the limit/);assert.doesNotMatch(p.stage2.explanation,/antiderivative/);}
 else{assert.equal(p.stage2,undefined);if(d.subtype==='exponential_tangent')assert.ok(a>-Math.PI/2&&b<Math.PI/2);}
 assert.equal(p.stage1.unit4Answer.kind,'newton-expression');assert.doesNotMatch(p.questionHtml,/Delta|x_k=|T\(k,n\)=/);
}
function geometryOracle(p){const d=p.unit4Meta,{a,b,h,m,offset,r,sign,shape}=d;let rational=0,picoeff=0;
 if(shape==='line')rational=m*((b-h)**2-(a-h)**2)/2+offset*(b-a);
 else if(shape==='absolute')rational=m*((b-h)*Math.abs(b-h)-(a-h)*Math.abs(a-h))/2+offset*(b-a);
 else{const primitive=x=>{const u=(x-h)/r;return .5*(u*Math.sqrt(Math.max(0,1-u*u))+Math.asin(u));};picoeff=sign*r*r*(primitive(b)-primitive(a))/Math.PI;rational=offset*(b-a);assert.ok(a>=h-r&&b<=h+r);}
 close(scalar(p.stage1),rational+picoeff*Math.PI,'Independent signed area');close(qval(d.rat),rational,'Rational area component');close(qval(d.pi),picoeff,'Circular area component');
 assert.match(p.stage1.explanation,/signed area/);assert.ok(p.stage1.explanation.includes(`_{${a}}^{${b}}`));
 const scales=[...p.explanation.matchAll(/data-scale-[xy]="([^"]+)"/g)].map(m=>+m[1]);assert.equal(scales.length,2);close(scales[0],scales[1],'Equal geometric unit scales');assert.match(p.explanation,/<title>[^<]+<\/title><desc>[^<]+<\/desc>/);
 // Inspect sampled curve vertices against an independent curve evaluation.
 const points=p.explanation.match(/<polyline points="([^"]+)"/)[1].split(' ').map(s=>s.split(',').map(Number)),scale=scales[0];
 for(const i of [0,40,80,120,160]){const x=a+(b-a)*i/160,expected=shape==='line'?m*(x-h)+offset:shape==='absolute'?m*Math.abs(x-h)+offset:offset+sign*Math.sqrt(Math.max(0,r*r-(x-h)**2));const x0=a+(b-a)*80/160,mid=shape==='line'?m*(x0-h)+offset:shape==='absolute'?m*Math.abs(x0-h)+offset:offset+sign*Math.sqrt(Math.max(0,r*r-(x0-h)**2));close((points[i][1]-points[80][1])/scale,mid-expected,'Diagram actual y coordinates',.012/scale);close((points[i][0]-points[0][0])/scale,x-a,'Diagram actual x coordinates',.012/scale);}
}
function independentBound(b,x){const {type,k,d}=b;if(type==='constant')return[d,0];if(type==='identity')return[x,1];if(type==='linear')return[k*x+d,k];if(type==='power')return[k*x**d,k*d*x**(d-1)];if(type==='sin')return[Math.sin(k*x),k*Math.cos(k*x)];if(type==='exp')return[Math.exp(k*x),k*Math.exp(k*x)];return[Math.tan(k*x),k/Math.cos(k*x)**2];}
function independentIntegrand(d,t){const {integrandType:f,k,c}=d;switch(f){case'trig_product':return Math.sin(t)**k*Math.cos(t);case'exponential_product':return Math.exp(k*t)*Math.cos(t**c);case'polynomial_exponential':return t**c-Math.exp(k*t);case'power_cosine':return t**c*Math.cos(t);case'polynomial':return t**c-k*t**(c-1);case'cosine_linear':return Math.cos(k*t)-t;case'linear_sine':return k*t-Math.sin(t);case'gaussian':return Math.exp(-k*t*t);case'cosine_composition':return Math.cos(t**c);case'log_positive':return Math.log(k+t*t);case'rational_positive':return(t-c)/(t*t+k);default:return t*t*(k+Math.exp(t));}}
function ftcOracle(p){const d=p.unit4Meta,answer=p.stage1.unit4Answer.expression;for(const x of [-.29,.13,.37]){const [lo,ld]=independentBound(d.lower,x),[hi,hd]=independentBound(d.upper,x);assert.ok(!d.domain||x>d.domain[0]&&x<d.domain[1]);const value=independentIntegrand(d,hi)*hd-independentIntegrand(d,lo)*ld;close(evalExpr(answer,{x}),value,'Independent FTC substitution, orientation and chain factor');}
 assert.equal(p.stage2,undefined);assert.equal(p.stage1.unit4Answer.kind,'function-expression');assert.match(p.explanation,/lower limit/);}
function solveFacts(facts,f,a,b){if(a===b)return 0;const relevant=facts.filter(x=>x.f===f),pot=new Map([[relevant[0].a,0]]);for(let i=0;i<10;i++)for(const fact of relevant){if(pot.has(fact.a))pot.set(fact.b,pot.get(fact.a)+fact.value);else if(pot.has(fact.b))pot.set(fact.a,pot.get(fact.b)-fact.value);}assert.ok(pot.has(a)&&pot.has(b),'Facts determine requested interval');for(const fact of relevant)close(pot.get(fact.b)-pot.get(fact.a),fact.value,'Consistent supplied facts');return pot.get(b)-pot.get(a);}
function rulesValue(target,facts){const match=target.match(/^\\int_\{(-?\d+)\}\^\{(-?\d+)\}(.+)\\,dx$/);assert.ok(match,'Parse requested integral');const a=+match[1],b=+match[2];let result=0;const terms=[...match[3].matchAll(/([+-]?\d*)([fgh])\(x\)/g)];assert.ok(terms.length);for(const t of terms){const coef=t[1]==='-'?-1:!t[1]||t[1]==='+'?1:+t[1];result+=coef*solveFacts(facts,t[2],a,b);}return result;}
function rulesOracle(p){const d=p.unit4Meta,value=rulesValue(d.target,d.facts);close(scalar(p.stage2||p.stage1),value,'Independent graph-potential integral rules');close(evalExpr(d.expression),value,'Explanation arithmetic corresponds');if(p.stage2){const target=p.stage1.prompt.match(/\\int_\{.*?\\,dx/)[0];close(scalar(p.stage1),rulesValue(target,d.facts),'Independent intermediate integral');}assert.equal(p.stage2,undefined,'P: rules now score only the requested integral');}
const oracle={newton:newtonOracle,geometry:geometryOracle,ftc:ftcOracle,rules:rulesOracle},report={ok:false,samplesPerEngine:N,engines:{},sourceInventory:{distinctPDFs:Object.keys(source.sources).length,notesGrouping:source.notes_grouping},failures:[]};
try{
assert.equal(Object.keys(source.sources).length,13);assert.deepEqual(source.notes_grouping.newton_pages,[1,2,3,4,5,6]);assert.deepEqual(source.notes_grouping.geometry_pages,[7,8,9,10,11]);
for(const [kind,route] of Object.entries(slug)){
 const families={},tiers={},parts={one:0,two:0},formats={},ids=new Set(),stems=new Set(),idStems=new Map();let repeat=0,last='',symbolic=0;const representatives={};
 w.BatchMathRNG={random:rng(13771+Object.keys(slug).indexOf(kind)*1000003)};
 for(let i=0;i<N;i++){
  const p=get(route)();assert.equal(p.unit4Meta.kind,kind);assert.equal(p.answerType,'staged-calculus');assert.equal(p.normalizedMathDisplay,true);assert.equal(p.choices,undefined);assert.equal(p.stage1Choices,undefined);
  const stem=p.questionHtml+p.stage1.prompt+(p.stage2?.prompt||'');if(idStems.has(p.id))assert.equal(idStems.get(p.id),stem,'IDs describe actual tasks');idStems.set(p.id,stem);ids.add(p.id);stems.add(stem);repeat+=last===p.id?1:0;last=p.id;
  families[p.variant]=(families[p.variant]||0)+1;tiers[p.unit4Meta.tier]=(tiers[p.unit4Meta.tier]||0)+1;parts[p.stage2?'two':'one']++;representatives[p.variant]??=p;
  for(const s of [p.stage1,p.stage2].filter(Boolean)){assert.equal(s.type,'unit4-exact');assert.ok(s.unit4Answer&&s.answerTex&&s.explanation);formats[s.unit4Answer.kind]=(formats[s.unit4Answer.kind]||0)+1;}
  const displayed=p.questionHtml+p.explanation+p.stage1.explanation;assert.doesNotMatch(displayed,/NaN|undefined|Infinity|\+\s*-|x--|[\x00-\x08\x0b\x0c\x0e-\x1f]/);assert.ok(p.explanation.includes(p.answerTex),'Final answer appears in worked feedback');oracle[kind](p);
  if(i<600||i%29===0){for(const s of [p.stage1,p.stage2].filter(Boolean)){const a=s.unit4Answer,e=expr(a);assert.deepEqual(JSON.parse(JSON.stringify(check(e,a))),{valid:true,ok:true},'Accept canonical exact answer '+p.id);assert.equal(check(`((${e})+0)*1`,a).ok,true,'Equivalent symbolic/numerical form');assert.notEqual(check(`(${e})+1`,a).ok,true,'Reject neighboring incorrect expression');assert.equal(check('',a).valid,false);symbolic++;}}
 }
 assert.equal(ids.size,stems.size,'No artificial ID diversity');assert.ok(ids.size>500,kind+' substantive diversity');assert.ok(repeat/(N-1)<.012,kind+' immediate-repeat ceiling');
 for(const f of source.families[kind]){const actual=100*(families[f.family]||0)/N;assert.ok(Math.abs(actual-f.targetPercent)<1.6,`${kind}/${f.family} weight ${actual}`);}
 assert.deepEqual(Object.keys(families).sort(),source.families[kind].map(x=>x.family).sort());assert.ok(Math.abs(100*parts.one/N-(kind==='rules'?100:source.interaction_targets[kind].onePart))<1.6);
 for(const [family,p] of Object.entries(representatives)){
  w.BatchMathRNG={random:rng(8191)};const review=get('unit-4-comprehensive')({unit4Mode:kind==='newton'?'riemann':kind});w.BatchMathRNG={random:rng(8191)};assert.equal(review.id,get(route)().id,'Comprehensive direct generator inheritance');
  const a=p.stage1.unit4Answer;if(a.kind==='function-expression'||a.kind==='newton-expression'){
   const v=a.kind==='newton-expression'?'n':'x',probes=a.kind==='newton-expression'?[2,3,7,11,23]:a.probes||[-.83,-.37,0,.19,.61,.94],spoof=`(${a.expression})+${probes.map(p=>`(${v}-(${p}))`).join('*')}`;assert.notEqual(check(spoof,a).ok,true,'Reject finite-probe collision using exact normalization');
  }
 }
 report.engines[kind]={slug:route,samples:N,uniqueIds:ids.size,uniqueTasks:stems.size,immediateRepeats:repeat,immediateRepeatPercent:100*repeat/(N-1),families:Object.fromEntries(Object.entries(families).map(([f,count])=>[f,{count,percent:100*count/N,target:source.families[kind].find(x=>x.family===f).targetPercent}])),difficulty:Object.fromEntries(Object.entries(tiers).map(([f,count])=>[f,100*count/N])),parts:Object.fromEntries(Object.entries(parts).map(([f,count])=>[f,100*count/N])),answerFields:formats,typedPercent:100,multipleChoicePercent:0,symbolicAcceptanceChecks:symbolic,independentMath:'PASS'};
 console.log(kind,JSON.stringify(report.engines[kind]));
}
// Mixed review: all eleven approved slots, each ~1/11, with the four new children.
w.BatchMathRNG={random:rng(928713)};const reviewCounts={};for(let i=0;i<11000;i++){const p=get('unit-4-comprehensive')();const k=p.unit4Meta?.kind||p.variant;reviewCounts[k]=(reviewCounts[k]||0)+1;}for(const k of ['newton','geometry','ftc','rules'])assert.ok(Math.abs((reviewCounts[k]||0)/11000-1/11)<.012);report.reviewCounts=reviewCounts;
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?['.git','node_modules','qa-results'].includes(e.name)?[]:walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const pages=walk(root).filter(f=>f.endsWith('index.html')).map(f=>({file:f,html:fs.readFileSync(f,'utf8')})).filter(x=>x.html.includes('problem-tracking.js')),engines=pages.map(p=>({route:'/'+path.relative(root,path.dirname(p.file)).split(path.sep).join('/')+'/',id:p.html.match(/engineId:"([^"]+)"/)[1]}));
assert.equal(engines.length,133);assert.equal(new Set(engines.map(e=>e.id)).size,133);report.practiceEngines=engines;
const parent=fs.readFileSync(path.join(root,'ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/index.html'),'utf8');assert.match(parent,/href="practice\/"/);assert.match(parent,/href="integral-rules-practice\/"/);assert.match(parent,/7\. Fundamental Theorem of Calculus and Integral Rules/);
report.ok=true;
}catch(e){report.failures.push(e.stack);console.error(e.stack);process.exitCode=1;}
fs.writeFileSync(path.join(out,'unit4-v128n-math.json'),JSON.stringify(report,null,2)+'\n');console.log('v12.8.N independent curriculum QA:',report.ok?'PASS':'FAIL');
