// wrong-answer probe for Separable: wrong branch, missing restriction, closed brackets, C left in
import {load} from './lib.mjs';
const L=load(['unit5-separable.js']),gen=L.G.get('separable-differential-equations');
const tally={},ex={};let restricted=0,N=1500;
const note=(k,r)=>{const key=`${k}: ${r.ok?'ACCEPTED':'rejected'}${r.note?' / '+r.note.slice(0,90):''}`;tally[key]=(tally[key]||0)+1;};
for(let i=1;i<=N;i++){L.seed(i*613);const p=gen({});const [A,B]=p.parts;const a=A.answer,b=B.answer;
 const v=a.variable==='t'?'t':a.variable==='theta'?'θ':'x';const sub=e=>e.replace(/(?<![a-z])x(?![a-z])/g,v);
 if(a.branchNote)note('negated branch',L.A.check(sub(`-(${a.expression})`),a));
 note('C left in',L.A.check(sub(`${a.expression}+C`),a));
 note('off by 1',L.A.check(sub(`${a.expression}+1`),a));
 const ps=b.parts||[{left:b.left,right:b.right}];const lr=ps[0];
 if(p.unit5Meta.restricted??p.unit5Meta.data?.restricted){}
 const isR=lr.left.includes('Infinity')&&lr.right.includes('Infinity')||(String(lr.left)==='-Infinity'&&String(lr.right)==='Infinity');
 const fin=[lr.left,lr.right].filter(e=>!/infinity/.test(String(e)));
 if(fin.length){restricted++;note('all reals',L.A.check('(-infinity,infinity)',b));
  const l=/infinity/.test(String(lr.left))?'(-infinity':`[${lr.left}`,r=/infinity/.test(String(lr.right))?'infinity)':`${lr.right}]`;note('closed',L.A.check(`${l},${r}`,b));}
}
console.log('restricted intervals',restricted,'of',N,`(${(100*restricted/N).toFixed(1)}%)`);console.log(Object.entries(tally).sort().map(([k,v])=>`${v}\t${k}`).join('\n'));
