// Dump initial-value problems as the student sees them (differential equation and initial condition from the
// question's TeX, converted to linear text) plus the engine's answers, for the independent SymPy check.
// Usage: node tools/review-lab/unit5/qa/dump-ivp.mjs <slug> <engine file> [N] > problems.jsonl
import {load,keypadForm} from './lib.mjs';
const [slug,file,N0]=process.argv.slice(2);const N=+N0||500;const L=load([file]),gen=L.G.get(slug);
const lin=t=>keypadForm(String(t).replace(/\{,\}/g,'').replace(/\\theta/g,'θ'));
for(let i=1;i<=N;i++){L.seed(i*4241);const p=gen({});const ivp=p.parts.find(x=>x.answer?.kind==='ivp');if(!ivp)continue;
 const forms=[...p.questionHtml.matchAll(/<div class="u4-formula">\\\(\\displaystyle (.*?)\\\)<\/div>/g)].map(m=>m[1]);
 const de=forms.find(f=>/^\\frac\{d[A-Za-z]\}\{d(?:[a-z]|\\theta)\}=/.test(f)),ic=forms.find(f=>f!==de);if(!de||!ic){console.error('skip',p.id);continue;}
 const dm=de.match(/^\\frac\{d([A-Za-z])\}\{d([a-z]|\\theta)\}=(.*)$/),yv=dm[1],xv=dm[2]==='\\theta'?'θ':dm[2];
 let m=ic.match(/^[A-Za-z]\\left\((.*)\\right\)=(.*)$/)||ic.match(/^[A-Za-z]\((.*?)\)=(.*)$/);let x0,y0;if(m){x0=m[1];y0=m[2];}else{m=ic.match(/^[A-Za-z]=(.*)\\text\{ when \}(?:[a-z]|\\theta)=(.*)$/);if(!m){console.error('ic?',ic);continue;}y0=m[1];x0=m[2];}
 const iv=p.parts.find(x=>x.answer?.kind==='interval');
 console.log(JSON.stringify({id:p.id,family:p.variant,x:xv,y:yv,rhs:lin(dm[3]),x0:lin(x0),y0:lin(y0),answer:ivp.answer.expression,
  interval:iv?{left:String(iv.answer.left),right:String(iv.answer.right),lc:!!iv.answer.lc,rc:!!iv.answer.rc}:null}));}
