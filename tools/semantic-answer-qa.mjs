#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const errors=[],warnings=[];const stats={im1Problems:0,apTopicProblems:0,apTopicValidated:0,im1Engines:0,apTopicGenerators:0};
const VERSION=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/app-version.json'),'utf8')).version;
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1}
function rat(n,d=1){if(d<0){n=-n;d=-d}const g=gcd(n,d);return[n/g,d/g]}
function sameFrac(ans,n,d=1){const [a,b]=rat(n,d);return ans&&Number(ans.n)===a&&Number(ans.d)===b}
function near(a,b,t=1e-9){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b))}
function hashSeed(value){let h=2166136261>>>0;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}h+=h<<13;h^=h>>>7;h+=h<<3;h^=h>>>17;h+=h<<5;return h>>>0}
function rng(seed){let state=hashSeed(seed)||0x6d2b79f5;return()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function elem(value=''){return {value,innerHTML:'',textContent:'',className:'',disabled:false,checked:false,style:{display:''},dataset:{},listeners:{},addEventListener(t,f){this.listeners[t]=f},focus(){},appendChild(){},append(){},querySelectorAll(){return[]},classList:{add(){},remove(){},contains(){return false},toggle(){}}}}
function inlineScripts(html){return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!(/\bsrc\s*=/.test(m[1]))).map(m=>m[2])}
function im1Sandbox(file,seed){
  const html=fs.readFileSync(file,'utf8'); const code=inlineScripts(html).find(s=>s.includes('problemGenerated')&&(s.includes('buildPool')||s.includes('buildWeightedUniquePool')||s.includes('function build(')));
  if(!code)throw new Error(`main generator script not found in ${file}`);
  const els={};const E=id=>els[id]||(els[id]=elem(id==='questionSelect'?'100':id==='timeSelect'?'5':id==='categorySelect'?'mixed':''));
  const doc={getElementById:E,querySelectorAll(){return[]},querySelector(){return null},createElement:t=>elem(t),addEventListener(){},body:{appendChild(){}}};
  const display={set(el,v){el.innerHTML=String(v)},html:v=>String(v),typeset(){},setFeedback(){}};
  const BMAnalytics={problemGenerated(){},practiceStarted(){},ensurePracticeStarted(){},answerChecked(){},solutionRevealed(){}};
  const window={BMAnalytics,BatchMathDisplayMath:display,BatchMathKeypad:{touchMode:false},MathJax:null};
  const sb={window,document:doc,BMAnalytics,BatchMathRNG:{random:rng(seed)},BatchMathDisplayMath:display,BatchMathKeypad:window.BatchMathKeypad,console,Math,structuredClone,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},URLSearchParams,location:{search:'',protocol:'http:'},navigator:{}};
  vm.createContext(sb);vm.runInContext(code,sb,{filename:file,timeout:5000});return sb;
}
function evalSimpleTex(tex){
  let s=String(tex).trim().replace(/^\\\(/,'').replace(/\\\)$/,'').replace(/\\displaystyle/g,'').replace(/\\,/g,'').replace(/\s+/g,'');
  s=s.replace(/\\left\[/g,'(').replace(/\\right\]/g,')').replace(/\\left\(/g,'(').replace(/\\right\)/g,')');
  function braced(str,start){if(str[start]!=='{')throw Error('expected {');let d=0;for(let i=start;i<str.length;i++){if(str[i]==='{')d++;else if(str[i]==='}'&&--d===0)return [str.slice(start+1,i),i+1]}throw Error('unclosed brace')}
  function expand(str){let out='';for(let i=0;i<str.length;){if(str.startsWith('\\frac',i)){let [a,j]=braced(str,i+5);let [b,k]=braced(str,j);out+=`((${expand(a)})/(${expand(b)}))`;i=k;continue}if(str.startsWith('\\sqrt',i)){let [a,j]=braced(str,i+5);out+=`Math.sqrt(${expand(a)})`;i=j;continue}out+=str[i++]}return out}
  s=expand(s);
  s=s.replace(/\^\{(-?\d+)\}/g,'**($1)').replace(/\^(\d+)/g,'**($1)');
  s=s.replace(/[{}]/g,'');
  s=s.replace(/\)\(/g,')*(').replace(/(\d|\))\(/g,'$1*(').replace(/\)(\d)/g,')*$1');
  if(!/^[0-9+\-*/().Mathsqrt]+$/.test(s))throw Error(`unsafe/unparsed TeX ${s}`);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict";return (${s});`)();
}
function validateIm1(engine,p){
  let m,expected;
  if(engine==='im1_multiplication'){m=String(p.key).match(/^(-?\d+)x(-?\d+)$/);if(!m)return'bad multiplication key';expected=+m[1]*+m[2];if(p.text!==`${+m[1]} × ${+m[2]} = ?`)return`display/key mismatch ${p.text}`;return p.answer===expected?'':`answer ${p.answer} != ${expected}`}
  if(engine==='im1_integer_add_subtract'){m=String(p.text).match(/^(\(-?\d+\)|-?\d+) ([+-]) (\(-?\d+\)|-?\d+) = \?$/);if(!m)return`cannot parse display ${p.text}`;const a=Number(m[1].replace(/[()]/g,'')),b=Number(m[3].replace(/[()]/g,''));expected=m[2]==='+'?a+b:a-b;return p.answer===expected?'':`display value ${expected} != answer ${p.answer}`}
  if(engine==='im1_integer_multiply_divide'){m=String(p.id).match(/^([md])-(-?\d+)-(-?\d+)$/);if(!m)return`bad id ${p.id}`;const a=+m[2],b=+m[3];expected=m[1]==='m'?a*b:a/b;return p.answer===expected?'':`id value ${expected} != answer ${p.answer}`}
  if(engine==='im1_exponents_radicals'){if((m=String(p.key).match(/^sqrt-(\d+)$/)))expected=Math.sqrt(+m[1]);else if((m=String(p.key).match(/^pow-(\d+)-(\d+)$/)))expected=(+m[1])**(+m[2]);else return`bad key ${p.key}`;return p.answer===expected?'':`key value ${expected} != answer ${p.answer}`}
  if(engine==='im1_order_of_operations'){try{expected=evalSimpleTex(p.q)}catch(e){return`cannot independently evaluate ${p.q}: ${e.message}`}return near(Number(p.answer),expected)?'':`display evaluates to ${expected}, answer=${p.answer}, q=${p.q}`}
  if(engine==='im1_reducing_fractions'){m=String(p.id).match(/^r-(\d+)-(\d+)$/);if(!m)return`bad id ${p.id}`;return sameFrac(p.answer,+m[1],+m[2])?'':`fraction answer mismatch ${p.id}`}
  if(engine==='im1_decimals'){
    const id=String(p.id);if((m=id.match(/^a-(\d+)-(\d+)-(-?1)-(\d+)$/))){const scale=+m[1],a=+m[2]/scale,op=+m[3],b=+m[4]/scale;expected=op===1?a+b:a-b}
    else if((m=id.match(/^m-(\d+)-(\d+)-(\d+)$/))){const a=+m[1],b=+m[2],mode=+m[3];const x=mode===1?a:a/10,y=mode===0?b:b/10;expected=x*y}
    else if((m=id.match(/^d-(\d+)-(\d+)-(\d+)$/))){expected=(+m[1])/(+m[2])}
    else return`bad id ${id}`;return near(Number(p.answer),expected)?'':`id value ${expected} != answer ${p.answer}`
  }
  if(engine==='im1_fractions'){
    const id=String(p.id);let n,d;
    if((m=id.match(/^c-(\d+)-([\d-]+)-([\d-]+)$/))){ // display is stronger/easier than ambiguous ID
      try{expected=evalSimpleTex(p.q.replace(/\\cdot/g,'*').replace(/\\div/g,'/'))}catch(e){expected=null}
    } else if(id.startsWith('u-')||id.startsWith('m-')||id.startsWith('o-')||id.startsWith('p-')||id.startsWith('s-')){
      try{let q=p.q.replace(/\\text\{ of \}/g,'*').replace(/\\cdot/g,'*').replace(/\\div/g,'/');expected=evalSimpleTex(q)}catch(e){expected=null}
    } else return`bad id ${id}`;
    if(expected==null||!Number.isFinite(expected))return`cannot evaluate fraction display ${p.q}`;const got=Number(p.answer.n)/Number(p.answer.d);return near(got,expected)?'':`display ${expected} != answer ${got}`
  }
  if(engine==='im1_percents'){
    const id=String(p.id);if((m=id.match(/^p-(\d+)-(\d+)$/)))expected=+m[1]/100*(+m[2]);
    else if((m=id.match(/^o-(\d+)-(\d+)$/)))expected=+m[1]/100*(+m[2]);
    else if((m=id.match(/^dm-(\d+)-(\d+)-(true|false)$/))){const b=+m[1],pct=+m[2];expected=b*(m[3]==='true'?1+pct/100:1-pct/100)}
    else if((m=id.match(/^t-(\d+)-(\d+)-(\d+)$/))){const b=+m[1],disc=+m[2],tax=+m[3];expected=Math.round((b*(1-disc/100)*(1+tax/100))*100)/100}
    else if((m=id.match(/^s-(upup|downdown|updown|upthenloss)-(\d+)-(\d+)-(\d+)$/))){const kind=m[1],b=+m[2],p1=+m[3],p2=+m[4];const first=b*(kind==='downdown'?1-p1/100:1+p1/100);expected=first*(kind==='upup'?1+p2/100:1-p2/100);expected=Math.round(expected*100)/100}
    else return`bad id ${id}`;return near(Number(p.answer),expected,1e-8)?'':`id value ${expected} != answer ${p.answer}`
  }
  return '';
}
const im1Specs=[
 ['im1_multiplication','im1/unit-1-review/topics/multiplication/practice/index.html','totalQuestions=100;buildWeightedUniquePool()'],
 ['im1_integer_add_subtract','im1/unit-1-review/topics/adding-and-subtracting-negative-numbers/practice/index.html','total=100;build()'],
 ['im1_integer_multiply_divide','im1/unit-1-review/topics/multiplying-and-dividing-negative-numbers/practice/index.html','buildPool("mixed",1000)'],
 ['im1_exponents_radicals','im1/unit-1-review/topics/square-roots-and-exponents/practice/index.html','total=300;buildPool()'],
 ['im1_order_of_operations','im1/unit-1-review/topics/order-of-operations/practice/index.html','buildPool(5000)'],
 ['im1_fractions','im1/unit-1-review/topics/fractions/practice/index.html','[...buildPool("common",500),...buildPool("unlike",500),...buildPool("muldiv",500),...buildPool("of",300),...buildPool("powers",500)]'],
 ['im1_reducing_fractions','im1/unit-1-review/topics/reducing-fractions/practice/index.html','buildPool("reduce",1000)'],
 ['im1_decimals','im1/unit-1-review/topics/decimals/practice/index.html','[...buildPool("addsub",1000),...buildPool("multiply",500),...buildPool("divide",500)]'],
 ['im1_percents','im1/unit-1-review/topics/percents/practice/index.html','[...buildPool("percent",500),...buildPool("original",300),...buildPool("discount",500),...buildPool("tax",300),...buildPool("successive",500)]']
];
for(const [engine,rel,expr] of im1Specs){try{const sb=im1Sandbox(path.join(ROOT,rel),`semantic:${engine}:${VERSION}`);const problems=vm.runInContext(expr,sb,{timeout:10000});stats.im1Engines++;for(let i=0;i<problems.length;i++){stats.im1Problems++;const err=validateIm1(engine,structuredClone(problems[i]));if(err){errors.push(`${engine} #${i+1}: ${err}`);break}}}catch(e){errors.push(`${engine}: ${e.stack||e.message}`)}}

// AP shared-topic generators: independently recompute the answer for tractable families.
const apSource=fs.readFileSync(path.join(ROOT,'assets/ap-topic-generators.js'),'utf8');
const apBox={window:{},console};vm.createContext(apBox);vm.runInContext(apSource,apBox,{filename:'ap-topic-generators.js'});
const ap=apBox.window.BatchMathAPTopicGenerators;
function texRat(n,d=1){const[a,b]=rat(n,d);return b===1?String(a):`\\frac{${a}}{${b}}`}
function correct(p){return p.choices[p.correctIndex]}
function signed(c,body,first=false){if(c===0)return'';const a=Math.abs(c),core=(a===1&&body?'':a)+body;if(first)return(c<0?'-':'')+core;return(c<0?' - ':' + ')+core}
function eqY(mn,md,bn,bd=1){let out='y=';if(mn===0)return out+texRat(bn,bd);out+=mn===md?'x':mn===-md?'-x':`${texRat(mn,md)}x`;const [n,d]=rat(bn,bd);if(n)out+=n<0?`-${texRat(-n,d)}`:`+${texRat(n,d)}`;return out}
function expectedAP(slug,p){const id=String(p.id);let m;
  if((m=id.match(/^intro-(-?\d+)-(-?\d+)-(-?\d+)$/)))return String(+m[2]);
  if(id.startsWith('osc-scaled-'))return '0'; if(id.startsWith('osc-'))return 'DNE';
  if((m=id.match(/^ivt-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)$/)))return String(+m[5]);
  if((m=id.match(/^dq-(-?\d+)-(-?\d+)-(-?\d+)$/))){const A=+m[1],B=+m[2];return `${signed(2*A,'x',true)}${signed(A,'h')}${signed(B,'')}`}
  if((m=id.match(/^hv-h-(\d+)-(-?\d+)-(\d+)-(-?\d+)$/))){const k=+m[1],h=+m[2];return `x=${h-k}, ${h+k}`}
  if((m=id.match(/^hv-v-(\d+)-(-?\d+)-(\d+)-(-?\d+)$/)))return `x=${+m[2]}`;
  if((m=id.match(/^ihv-s-(\d+)-(\d+)-(\d+)-(\d+)$/)))return texRat(-(+m[1])*(+m[3]),(+m[2])*(+m[4]));
  if((m=id.match(/^ihv-h-/)))return 'x=0'; if((m=id.match(/^ihv-v-/)))return 'y=0';
  if((m=id.match(/^motion-(\d+)-(-?\d+)-(-?\d+)-(\d+)-(velocity|acceleration|speed)$/))){const A=+m[1],B=+m[2],C=+m[3],t=+m[4],k=m[5],v=3*A*t*t+2*B*t+C,a=6*A*t+2*B;return String(k==='velocity'?v:k==='acceleration'?a:Math.abs(v))}
  if((m=id.match(/^gd-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(1|2)$/)))return String(+(m[6]==='1'?m[1]:m[2]));
  if((m=id.match(/^ext-(\d+)-(-?\d+)-(-?\d+)-(\d+)-(min|max)$/))){const A=+m[1],k=+m[3],r=+m[4];return String(m[5]==='min'?k:A*r*r+k)}
  if((m=id.match(/^inc-(-?\d+)-(-?\d+)-(increase|decrease)$/))){const r1=+m[1],r2=+m[2];return m[3]==='increase'?`(-\\infty,${r1})\\cup(${r2},\\infty)`:`(${r1},${r2})`}
  if((m=id.match(/^gf-mm-(-?\d+)-(-?\d+)$/)))return `Local maximum at x=${+m[1]}; local minimum at x=${+m[2]}`;
  if((m=id.match(/^gf-c-(-?\d+)-(-?\d+)$/)))return `An inflection point at x=${+m[1]}`;
  if((m=id.match(/^lin-(\d+)-(-?\d+)$/))){const r=+m[1],d=+m[2],a=r*r;return texRat(2*a+d,2*r)}
  if((m=id.match(/^newton-(\d+)-(\d+)$/))){const c=+m[1],x=+m[2];return texRat(x*x+c,2*x)}
  if((m=id.match(/^tsa-s-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(\d+)$/))){const A=+m[1],B=+m[2],C=+m[3],a=+m[4],h=+m[5],f=x=>A*x*x+B*x+C;return texRat(f(a+h)-f(a),h)}
  if((m=id.match(/^tsa-t-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(\d+)$/))){const A=+m[1],B=+m[2],C=+m[3],a=+m[4],h=+m[5],f=x=>A*x*x+B*x+C,fp=x=>2*A*x+B;return String(f(a)+fp(a)*h)}
  if((m=id.match(/^mvt-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)$/)))return texRat(+m[3]+(+m[4]),2);
  if((m=id.match(/^rolle-(-?\d+)-(\d+)$/)))return `c=${+m[1]}`;
  if((m=id.match(/^lh-[el]-(\d+)$/)))return String(+m[1]);
  if((m=id.match(/^lh-p-(\d+)-(\d+)$/)))return texRat(+m[1],+m[2]);
  if((m=id.match(/^opt-r-(\d+)$/))){const P=+m[1],s=P/4;return String(s*s)}
  if((m=id.match(/^opt-b-(\d+)$/))){const s=Math.round(Math.cbrt(+m[1]));return `${s}×${s}×${s}`}
  if((m=id.match(/^opt-river-(\d+)$/))){const F=+m[1];return String(F*F/8)}
  if((m=id.match(/^rr-c-(\d+)-(\d+)$/)))return `${2*(+m[1])*(+m[2])}\\pi`;
  if((m=id.match(/^rr-s-(\d+)-(\d+)$/)))return `${4*(+m[1])**2*(+m[2])}\\pi`;
  if((m=id.match(/^rr-l-(\d+)-(\d+)-(\d+)-(\d+)$/)))return texRat(-(+m[1])*(+m[4]),+m[2]);
  if((m=id.match(/^rect-(\d+)-(\d+)-(\d+)-(\d+)-(left|right|midpoint)$/))){const n=+m[1],b=+m[2],pwr=+m[3],k=+m[4],method=m[5],dx=b/n;let sum=0;for(let i=0;i<n;i++){const x=method==='left'?i*dx:method==='right'?(i+1)*dx:(i+.5)*dx;sum+=k*(x**pwr)*dx}return String(Number(sum.toFixed(4)))}
  if((m=id.match(/^trap-(\d+)-([\d-]+)$/))){const h=+m[1],v=m[2].split('-').map(Number);return String(Number((h*(v[0]/2+v[1]+v[2]+v[3]/2)).toFixed(4)))}
  if((m=id.match(/^sigma-(\d+)-(-?\d+)-(-?\d+)$/))){const n=+m[1],a=+m[2],b=+m[3];return String(a*n*(n+1)/2+b*n)}
  if((m=id.match(/^exactarea-(\d+)-(\d+)-(\d+)$/))){const b=+m[1],pow=+m[2],k=+m[3];return texRat(k*b**(pow+1),pow+1)}
  if((m=id.match(/^sumlim-(\d+)-(\d+)-(\d+)$/))){const pow=+m[1],b=+m[2],k=+m[3];return texRat(k*b**(pow+1),pow+1)}
  if((m=id.match(/^geo-s-(\d+)$/)))return `\\frac{${(+m[1])**2}\\pi}{2}`;
  if((m=id.match(/^geo-t-(\d+)-(\d+)$/)))return texRat((+m[1])*(+m[2]),2);
  if((m=id.match(/^de-s-(-?\d+)-(-?\d+)-(-?\d+)$/)))return String((+m[1])*(+m[2])+(+m[3]));
  if((m=id.match(/^dem-(-?\d+)-(-?\d+)-(-?\d+)-(\d+)-(velocity|position)$/))){const a=+m[1],v0=+m[2],s0=+m[3],t=+m[4];return String(Number((m[5]==='velocity'?v0+a*t:s0+v0*t+a*t*t/2).toFixed(4)))}
  if((m=id.match(/^sf-(xy|xminusy|yonly)-(-?\d+)-(-?\d+)-(-?\d+)$/)))return String(+m[4]);
  if((m=id.match(/^rate-(\d+)-(-?\d+)-(-?\d+)-(\d+)$/))){const A0=+m[1],a=+m[2],b=+m[3],t=+m[4];return String(Number((A0+a*t*t/2+b*t).toFixed(4)))}
  if((m=id.match(/^area-x-x2-(\d+)-(\d+)$/)))return texRat((+m[1])*(+m[2])**2,6);
  if((m=id.match(/^areay-(\d+)-(\d+)$/)))return texRat((+m[1])*(+m[2])**2,2);
  if((m=id.match(/^pieceint-(\d+)-(\d+)-(\d+)$/))){const a=+m[1],b=+m[2],c=+m[3];return texRat(2*(a+b)+5*c,2)}
  if((m=id.match(/^cross-(\d+)-(\d+)$/))){const k=+m[1],a=+m[2];return texRat(k*k*a**3,3)}
  if((m=id.match(/^solid-(\d+)-(\d+)$/))){const k=+m[1],a=+m[2],[n,d]=rat(k*k*a**3,3);return d===1?`${n}\\pi`:`\\frac{${n}\\pi}{${d}}`}
  return null;
}
const slugs=ap.slugs();stats.apTopicGenerators=slugs.length;const AP_PER=Number(process.env.BM_QA_SEMANTIC_AP_PER_TOPIC||1000);
for(let si=0;si<slugs.length;si++){const slug=slugs[si],gen=ap.get(slug);for(let i=0;i<AP_PER;i++){apBox.window.BatchMathRNG={random:rng(`semantic:${VERSION}:${slug}:${i}`)};const p=gen();stats.apTopicProblems++;const exp=expectedAP(slug,p);if(exp===null)continue;stats.apTopicValidated++;const got=correct(p);if(String(got)!==String(exp)){errors.push(`${slug} ${p.id}: expected correct choice ${exp}, got ${got}`);break}}}
if(stats.apTopicValidated<20000)warnings.push(`Only ${stats.apTopicValidated} shared AP samples had independent semantic validators.`);
const report={ok:errors.length===0,generatedAt:new Date().toISOString(),version:VERSION,stats,warnings,errors};
fs.writeFileSync(path.join(OUT,'semantic-answer-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=[`BatchMath ${VERSION} semantic answer QA`,`Result: ${report.ok?'PASS':'FAIL'}`,`IM1 engines independently checked: ${stats.im1Engines}`,`IM1 generated/displayed problems checked: ${stats.im1Problems}`,`Shared AP topic generators sampled: ${stats.apTopicGenerators}`,`Shared AP topic problems generated: ${stats.apTopicProblems}`,`Shared AP topic answers independently recomputed: ${stats.apTopicValidated}`,'',`Warnings: ${warnings.length}`,...warnings.map(x=>`- ${x}`),'',`Errors: ${errors.length}`,...errors.slice(0,120).map(x=>`- ${x}`),''];
fs.writeFileSync(path.join(OUT,'semantic-answer-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
