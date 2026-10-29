// v12.8.Q focused QA: limit-and-summation worked solutions.
// Converts every displayed equation line back into a number and checks that each line
// agrees with the actual right-endpoint sum, so an algebra typo in any step is caught.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rng=seed=>{let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)|0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};};
const sb={window:{},console,Math:Object.create(Math)};sb.Math.random=()=>sb.window.BatchMathRNG.random();vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(root,'assets/ap-topic-generators.js'),'utf8'),sb);
const gen=sb.window.BatchMathAPTopicGenerators.get('evaluating-definite-integrals-with-a-limit-and-summation');
function braces(s,i){let d=0;for(let j=i;j<s.length;j++){if(s[j]==='{')d++;else if(s[j]==='}'&&!--d)return j;}throw Error('brace');}
function tex2js(t){
  t=t.replace(/\\displaystyle|\\,|\\!/g,'').replace(/\\left|\\right/g,'').replace(/\\cdot/g,'*');
  for(let g=0;g<40&&t.includes('\\frac');g++){const i=t.lastIndexOf('\\frac'),a=i+5,e1=braces(t,a),e2=braces(t,e1+1);t=t.slice(0,i)+`((${t.slice(a+1,e1)})/(${t.slice(e1+2,e2)}))`+t.slice(e2+1);}
  t=t.replace(/\^\{([^{}]*)\}/g,'**($1)').replace(/\\(sin|cos|tan|ln|exp)/g,'$1').replace(/\\sqrt\{([^{}]*)\}/g,'sqrt($1)').replace(/e\*\*\(([^)]*)\)/g,'exp($1)');
  t=t.replace(/\[/g,'(').replace(/\]/g,')').replace(/(\d|\))\s*(?=\(|n\b|k\b)/g,'$1*').replace(/(\))(?=\d)/g,'$1*').replace(/\bn\b(?=\()/g,'n*').replace(/(\d)(?=n\b|k\b)/g,'$1*');
  t=t.replace(/(^|[(*+\/-])-\(/g,'$1-1*(').replace(/(^|[(*+\/-])-(?=(?:sin|cos|tan|ln|exp|sqrt)\()/g,'$1-1*').replace(/(\d|\))(?=(?:sin|cos|tan|ln|exp|sqrt)\()/g,'$1*').replace(/(\d)(?=\()/g,'$1*').replace(/\)(?=(?:sin|cos|tan|ln|exp|sqrt)\()/g,')*');return t.replace(/\{|\}/g,'');
}
const mk=src=>{try{return mk0(src)}catch(e){throw Error('cannot parse: '+src)}};const mk0=src=>new Function('n','k','sin','cos','tan','ln','exp','sqrt',`return (${src});`);
const ev=(src,n,k=0)=>mk(src)(n,k,Math.sin,Math.cos,Math.tan,Math.log,Math.exp,Math.sqrt);
const exprJs=e=>e.replace(/\^/g,'**').replace(/\b(sin|cos|tan|ln|exp|sqrt)\(/g,'$1(');
const report={samples:0,withEvaluation:0,errors:[]};
sb.window.BatchMathRNG={random:rng(1280017)};
try{
 for(let i=0;i<3000;i++){
  const p=gen(),d=p.unit4Meta,all=p.stage1.explanation+(p.stage2?.explanation||'')+p.questionHtml;report.samples++;
  assert.doesNotMatch(all,/T\s*\(\s*k\s*,\s*n\s*\)/,'T(k,n) must not appear');assert.doesNotMatch(all,/S_\{?n\}?/,'S_n must not appear');assert.doesNotMatch(all,/Construct the right-endpoint/);
  for(const m of all.matchAll(/\\\(([\s\S]*?)\\\)/g))assert.ok(!m[1].includes('/'),'slash fraction: '+m[1]);
  const html=p.stage2?p.stage2.explanation:p.stage1.explanation;
  for(const name of ['width','endpoint','definition','representation'])assert.ok(html.includes(`data-newton-step="${name}"`),'missing step '+name);
  const lines=Object.fromEntries([...html.matchAll(/data-newton-step="([^"]+)"[^>]*>\\\(([\s\S]*?)\\\)/g)].map(m=>[m[1],m[2]]));
  const body=p.stage1.unit4Answer.expression;const S=n=>{let t=0;for(let k=1;k<=n;k++)t+=ev(exprJs(body),n,k);return t;};
  // the substituted limit-and-sum line must equal the Riemann sum when evaluated for a particular n
  {const rhs=lines.representation.split('=').slice(1).join('=');
   const inner=rhs.replace(/^\s*\\lim_\{n\\to\\infty\}\\sum_\{k=1\}\^\{n\}/,'');const js=tex2js(inner);
   for(const n of [3,8]){let t=0;for(let k=1;k<=n;k++)t+=ev(js,n,k);assert.ok(Math.abs(t-S(n))<1e-9*Math.max(1,Math.abs(t)),`representation line differs: ${t} vs ${S(n)} :: ${inner}`);}}
  if(p.stage2){
   report.withEvaluation++;const n0=7,target=S(n0);
   const rhsOf=name=>{const s=lines[name];return s.slice(s.indexOf('=')+1).replace(/^.*?(?=\\lim)/,m=>m)};
   const inner=name=>lines[name].replace(/^[\s\S]*?\\dx|^[\s\S]*?\\,dx=/,'');
   const afterDx=name=>lines[name].split(/\\,dx=/)[1];
   {const t=afterDx('expanded').replace(/^\\lim_\{n\\to\\infty\}\\sum_\{k=1\}\^\{n\}/,'');let s=0;for(let k=1;k<=n0;k++)s+=ev(tex2js(t),n0,k);assert.ok(Math.abs(s-target)<1e-9*Math.max(1,Math.abs(target)),'expanded line '+t);}
   for(const name of ['identities','finite','split']){if(!lines[name])continue;const t=afterDx(name).replace(/^\\lim_\{n\\to\\infty\}/,'');const v=ev(tex2js(t),n0);assert.ok(Math.abs(v-target)<1e-9*Math.max(1,Math.abs(target)),`${name} line ${t}: ${v} vs ${target}`);}
   for(const name of ['substitution','result']){const t=afterDx(name);const v=ev(tex2js(t),1);assert.ok(Math.abs(v-d.result[0]/d.result[1])<1e-12,`${name} ${t} -> ${v} vs ${d.result}`);}
   // as n grows the finite sum tends to the stated value
   const big=1e11,fv=ev(tex2js(afterDx('finite').replace(/^\\lim_\{n\\to\\infty\}/,'')),big);assert.ok(Math.abs(fv-d.result[0]/d.result[1])<1e-5,'limit value '+fv+' vs '+d.result+' :: '+afterDx('finite'));
   for(let j=0;j<3;j++)assert.equal(html.includes(`data-newton-step="identity-${j}"`),d.neededPowers.includes(j),'only needed identities shown');
   assert.ok(d.explicitLimitTex.includes(d.finiteTex));
  }
 }
 assert.ok(report.withEvaluation>1000);
}catch(e){console.error(e.stack);process.exit(1);}
console.log(JSON.stringify({ok:true,...report},null,1));
