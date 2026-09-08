#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const page=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/practice/index.html'),'utf8');
const scripts=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
let code=scripts.find(s=>s.includes('function infinityLimit(){'));
if(!code)throw new Error('infinity generator script not found');
const iife=code.lastIndexOf('(function(){',code.indexOf('function infinityLimit(){'));
if(iife<0)throw new Error('generator IIFE start not found');
code=code.slice(iife);
const cut=code.indexOf('  $("category").addEventListener');
if(cut<0)throw new Error('generator tail marker not found');
code=code.slice(0,cut)+'  window.__infinityLimit=infinityLimit;\n})();';
function mulberry(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const ctx={window:{},console,BatchMathRNG:{random:mulberry(0x12345678)}};vm.createContext(ctx);vm.runInContext(code,ctx,{filename:'limits-at-infinity-inline.js'});
const gen=ctx.window.__infinityLimit;if(typeof gen!=='function')throw new Error('infinity generator not exposed');
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1}
function rat(n,d=1){if(d<0){n=-n;d=-d}const g=gcd(n,d);return {kind:'rat',n:n/g,d:d/g}}
function inf(sign){return {kind:'inf',sign:sign<0?-1:1}}
function same(a,b){return a&&b&&a.kind===b.kind&&(a.kind==='rat'?a.n===b.n&&a.d===b.d:a.kind==='inf'?a.sign===b.sign:true)}
const counts=new Map(),dir={pos:0,neg:0};const errors=[];let radical=0;
function expected(p){let m,id=p.id;
  if((m=id.match(/^i1-(\d+)-(-?\d+)-(-?\d+)-/)))return rat(+m[2],+m[3]);
  if(/^i2-/.test(id))return rat(0);
  if((m=id.match(/^i3-\d+-(-?\d+)-(-?\d+)-.*-(true|false)$/))){const A=+m[1],B=+m[2],neg=m[3]==='true';return inf((A*B>0?1:-1)*(neg?-1:1));}
  if((m=id.match(/^i4-radquad-over-lin-(\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(true|false)$/))){const k=+m[1],mm=+m[4],neg=m[6]==='true';return rat((neg?-1:1)*k,mm);}
  if((m=id.match(/^i5-lin-over-radquad-(\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(true|false)$/))){const k=+m[1],mm=+m[4],neg=m[6]==='true';return rat((neg?-1:1)*mm,k);}
  if((m=id.match(/^i6-radquad-ratio-(\d+)-(\d+)-/)))return rat(+m[1],+m[2]);
  if((m=id.match(/^i7-conjugate-(\d+)-(-?\d+)-(-?\d+)-(true|false)$/))){const k=+m[1],B=+m[2],neg=m[4]==='true';return rat((neg?-1:1)*B,2*k);}
  if((m=id.match(/^i8-recip-conjugate-(\d+)-(-?\d+)-(-?\d+)-(true|false)$/))){const k=+m[1],B=+m[2],neg=m[4]==='true';return rat(2*k,(neg?-1:1)*B);}
  if(/^i9-/.test(id))return rat(0);
  if((m=id.match(/^i10-quad-over-radquad-\d+--?\d+--?\d+-(-?\d+)-/)))return inf(+m[1]>0?1:-1);
  if(/^i11-/.test(id))return rat(0);
  if((m=id.match(/^i12-lin-over-radlin-\d+--?\d+-(-?\d+)--?\d+-(true|false)$/))){const mm=+m[1],neg=m[2]==='true';return inf(mm*(neg?-1:1)>0?1:-1);}
  if(/^i13-/.test(id))return rat(0);
  if(/^i14-/.test(id))return inf(1);
  if(/^i15-/.test(id))return rat(0);
  if(/^i16-/.test(id))return inf(1);
  if(/^i17-/.test(id))return inf(-1);
  if(/^i18-/.test(id))return inf(1);
  if(/^i19-/.test(id))return inf(1);
  if((m=id.match(/^i20-exp-poly-(\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(true|false)$/))){const n=+m[1],lead=+m[2],neg=m[5]==='true';const s=Math.sign(lead)*(neg&&n%2===1?-1:1);return s>0?inf(1):rat(0);}
  if((m=id.match(/^i21-exp-rat-\d+-(-?\d+)-(-?\d+)-.*-(true|false)$/))){const A=+m[1],B=+m[2],neg=m[3]==='true';const s=(A*B>0?1:-1)*(neg?-1:1);return s>0?inf(1):rat(0);}
  if(/^i22-/.test(id))return rat(1);
  return null;
}
const N=100000;
ctx.BatchMathRNG.random=mulberry(0x9e3779b9);
for(let i=0;i<N;i++){
  const p=gen();
  const fam=Number((p.id.match(/^i(\d+)/)||[])[1]);
  counts.set(fam,(counts.get(fam)||0)+1);
  if(fam>=4&&fam<=14)radical++;
  if(/-true$/.test(p.id)){dir.neg++;if(!p.q.includes('x\\to-\\infty'))errors.push(`${p.id}: negative direction id/display mismatch`);}else{dir.pos++;if(!p.q.includes('x\\to\\infty'))errors.push(`${p.id}: positive direction id/display mismatch`);}
  const exp=expected(p);if(!exp)errors.push(`${p.id}: no independent checker`);else if(!same(p.ans,exp))errors.push(`${p.id}: answer ${JSON.stringify(p.ans)} != ${JSON.stringify(exp)}`);
  const all=String(p.q)+' '+String(p.sol);if(/undefined|NaN|\+\s*-|--/.test(all))errors.push(`${p.id}: malformed display ${all}`);
}
for(let i=1;i<=22;i++)if(!counts.has(i))errors.push(`family i${i} missing`);
if(dir.pos!==N/2||dir.neg!==N/2)errors.push(`direction split not exact 50/50: +inf=${dir.pos}, -inf=${dir.neg}`);
const radicalShare=radical/N;if(radicalShare<0.47||radicalShare>0.53)errors.push(`radical share unexpected: ${(100*radicalShare).toFixed(2)}%`);
const report={ok:!errors.length,samples:N,direction:dir,radicalShare,families:Object.fromEntries([...counts].sort((a,b)=>a[0]-b[0])),errors:errors.slice(0,200)};
fs.writeFileSync(path.join(OUT,'unit1-infinity-variety-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath Limits at Infinity Variety QA',`Result: ${report.ok?'PASS':'FAIL'}`,`Samples: ${N}`,`Directions: +infinity ${dir.pos}, -infinity ${dir.neg}`,`Radical-family share: ${(100*radicalShare).toFixed(3)}%`,`Families observed: ${counts.size}/22`,`Errors: ${errors.length}`,...errors.slice(0,50).map(x=>'- '+x),''];
fs.writeFileSync(path.join(OUT,'unit1-infinity-variety-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
