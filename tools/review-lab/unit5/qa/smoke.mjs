// node smoke.mjs <slug> <engine file> [N] — generate, check every part's canonical and displayed answers, lint TeX
import {load,keypadForm} from './lib.mjs';import {lint} from './texlint.mjs';
const [slug,file,N0]=process.argv.slice(2);const N=+N0||2000;
const L=load(file.split(',')),gen=L.G.get(slug);
const fam={},tier={},fails=[],errs={},kinds={};let parts=0,multi=0,calc=0;
const canon=(a)=>{
 if(a.kind==='ivp'||a.kind==='function'||a.kind==='general'){let r=a.expression+(a.kind==='general'?'+C':'');if(a.variable==='t')r=r.replace(/(?<![a-z])x(?![a-z])/g,'t');if(a.variable==='theta')r=r.replace(/(?<![a-z])x(?![a-z])/g,'θ');return r;}
 // v12.8.X: a rounded answer is entered as its correctly rounded decimal, not as the raw value
 const R=v=>a.places===undefined||typeof v!=='number'||!Number.isFinite(v)?v:L.W.BatchMathUnit5Core.fix(v,a.places);
 if(a.kind==='interval'){if(a.none)return 'none';const ps=a.parts||[{left:a.left,right:a.right,lc:a.lc??a.leftClosed,rc:a.rc??a.rightClosed}];return ps.map(p=>`${p.lc?'[':'('}${R(p.left)},${R(p.right)}${p.rc?']':')'}`).join('U');}
 if(a.kind==='numeric'||a.kind==='exact')return String(R(a.value)??a.expression);
 if(a.kind==='list')return a.values.length?a.values.map(R).join(','):'none';
};
for(let i=1;i<=N;i++){L.seed(i*7919);let p;try{p=gen({});}catch(e){errs[e.message]=(errs[e.message]||0)+1;continue;}
 fam[p.variant]=(fam[p.variant]||0)+1;tier[p.unit5Meta.tier]=(tier[p.unit5Meta.tier]||0)+1;if(p.parts.length>1)multi++;if(p.calculatorActive)calc++;
 const bad=lint(p.questionHtml+p.parts.map(x=>x.prompt+(x.answerIsText?'':x.answerTex)+x.explanation).join(''));if(bad.length)fails.push(`${p.id} TeX: ${bad.join(',')}`);
 for(const part of p.parts){parts++;
  if(part.control==='slope-segments'||part.control==='solution-curve'){const S=L.W.BatchMathUnit5Slope;kinds[part.control]=(kinds[part.control]||0)+1;
   if(part.control==='slope-segments'){const t=part.board.targets;const good=S.gradeSegments(t,t.map(x=>x.vertical?90:S.angleOf(x.slope)));const bad=S.gradeSegments(t,t.map(x=>(x.vertical?90:S.angleOf(x.slope))+30));
    if(!good.ok||bad.ok)fails.push(`${p.id} segment grading: exact ${good.ok} rotated ${bad.ok}`);}
   else{const o=S.ODES[part.board.ode],g=S.gradeCurve(part.board.ref,part.board.ref,part.board.ic,o);if(!g.ok)fails.push(`${p.id} reference curve not accepted: ${g.note}`);}
   continue;}
  if(part.control==='choice'||part.control==='svg-choice'){kinds.choice=(kinds.choice||0)+1;if(!(part.correctIndex>=0&&part.correctIndex<part.choices.length))fails.push(`${p.id} choice index`);continue;}
  const a=part.answer;kinds[a.kind]=(kinds[a.kind]||0)+1;const raw=canon(a);
  const r=L.A.check(raw,a);if(!r.ok)fails.push(`${p.id} canonical ${a.kind}: ${raw} -> ${JSON.stringify(r)}`);
  let tex=part.answerTex.replace(/^[A-Za-z](\([a-z]\))?=/,'');if(a.kind==='interval')tex=tex.replace(/\\left|\\right|\\,/g,'').replace(/\\infty/g,'infinity').replace(/\\cup/g,'U');
  if(a.kind==='list')tex=tex.replace(/[a-z]=/g,'').replace(/\\ /g,'');
  tex=tex.replace(/\\\$|\\%/g,'').replace(/\{,\}/g,'');const typed=keypadForm(tex).replace(/\\text\{[^}]*\}/g,'');const r2=L.A.check(typed,a);if(!r2.ok)fails.push(`${p.id} typed ${a.kind}: ${typed} <- ${part.answerTex} -> ${JSON.stringify(r2)}`);
 }}
const pct=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,`${v} (${(100*v/N).toFixed(1)}%)`]));
console.log('families',JSON.stringify(pct(fam)));console.log('tiers',JSON.stringify(pct(tier)));console.log('multi-part',multi,'calculator',calc,'answer kinds',JSON.stringify(kinds));console.log('errors',JSON.stringify(errs));console.log('parts',parts,'fails',fails.length);console.log(fails.slice(0,20).join('\n'));
