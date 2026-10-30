// v12.8.X rounding matrix for the Unit 5 checker: rounded answers must equal the correctly rounded value (half away
// from zero), with optional trailing zeros, a leading decimal point, -0, dollar signs, commas and unit words; a
// neighbouring rounded value, extra non-zero digits and expressions are not accepted. Exact answers are unchanged.
// Usage: node tools/review-lab/unit5/qa/rounding.mjs
import {load} from './lib.mjs';
const L=load(['unit5-growth.js']),A=L.A,C=L.W.BatchMathUnit5Core;
let pass=0;const fails=[];
const grade=(raw,spec)=>{const r=A.check(raw,spec);return !r.valid?'invalid':r.ok?'accept':'reject';};
function t(spec,raw,want,label=''){const got=grade(raw,spec);if(got===want)pass++;else fails.push(`${label||JSON.stringify(spec.value??spec.parts??spec.values)} places ${spec.places}: ${JSON.stringify(raw)} -> ${got}, expected ${want}`);}
const num=(value,places=3,extra={})=>({kind:'numeric',value,places,...extra});
const acc=(spec,...raws)=>raws.forEach(r=>t(spec,r,'accept'));
const rej=(spec,...raws)=>raws.forEach(r=>t(spec,r,'reject'));
const inv=(spec,...raws)=>raws.forEach(r=>t(spec,r,'invalid'));

// 03.03 examples
acc(num(0),'0','0.0','0.000','-0','-0.000','.0','0.','+0');rej(num(0),'0.001','-0.001');
acc(num(1.25),'1.25','1.250','1.2500','01.25');rej(num(1.25),'1.249','1.251');
acc(num(0.923),'.923','0.923','0.9230',' .923 ','+.923','0.923 hours');rej(num(0.923),'.922','.924','-.923');
acc(num(1.2346),'1.235','1.2350');rej(num(1.2346),'1.234','1.2346','1.236');
acc(num(2.718281828),'2.718');rej(num(2.718281828),'2.719','2.7183','2.72');
acc(num(1.2503),'1.25','1.250','1.25000');rej(num(1.2503),'1.2503','1.251','1.249');
// ties: half away from zero, symmetric for negatives, not at the mercy of binary representation
acc(num(1.2345),'1.235');rej(num(1.2345),'1.234');
acc(num(-1.2345),'-1.235','−1.235');rej(num(-1.2345),'-1.234','1.235');
acc(num(0.0005),'0.001');rej(num(0.0005),'0','0.000');
acc(num(-0.0005),'-0.001');rej(num(-0.0005),'0');
acc(num(1.005,2),'1.01');rej(num(1.005,2),'1.00','1');            // 1.005 is stored as 1.00499999999999989...
acc(num(2.5,0),'3');rej(num(2.5,0),'2');acc(num(-2.5,0),'-3');rej(num(-2.5,0),'-2');
// either side of a threshold
acc(num(1.2344999),'1.234');rej(num(1.2344999),'1.235');
acc(num(1.2345001),'1.235');rej(num(1.2345001),'1.234');
acc(num(-1.2346),'-1.235');rej(num(-1.2346),'-1.234');
// small values that round to zero, and the sign of zero
acc(num(0.0004),'0','-0','0.000','.000');rej(num(0.0004),'0.001');
acc(num(-0.0004),'0','-0','-0.000');rej(num(-0.0004),'-0.001');
// true values that are whole numbers or short decimals, computed with numerical noise
acc(num(5.000000000001),'5','5.0','5.000');acc(num(4.9999999999998),'5','5.000');rej(num(4.9999999999998),'4.999');
acc(num(0.1+0.2),'0.3','.3','0.300');acc(num(2.0000000000004,0),'2','2.0');
// money: nearest cent
const cents=(v,w)=>num(v,2,{money:true,...(w?{wrongValues:w}:{})});
acc(cents(1.2),'1.2','1.20','$1.20','$1.2','1.200','$ 1.20');rej(cents(1.2),'1.21','1.19','1.205');
acc(cents(1234.5),'$1,234.50','1234.5','1,234.5');rej(cents(1234.5),'1234.51');
acc(cents(1234.567),'1234.57','$1,234.57');rej(cents(1234.567),'1234.56','1234.567');
acc(cents(-15.125),'-15.13','-$15.13','$-15.13');rej(cents(-15.125),'-15.12');
// whole numbers
acc(num(2538.4,0),'2538','2538.0','2538.','2,538');rej(num(2538.4,0),'2539','2537','2538.4');
acc(num(2538.5,0),'2539');rej(num(2538.5,0),'2538');
// not a decimal number: re-entry, not a wrong attempt
inv(num(0.13862943611198905),'ln(2)/5','1/4','sqrt(2)','abc','1.2.3','','1e-3','pi');
inv(cents(1.2),'6/5');inv(num(3,0),'9/3');
// legacy tolerance specs map to places
acc({kind:'numeric',value:1.2346,tolerance:0.001},'1.235');rej({kind:'numeric',value:1.2346,tolerance:0.001},'1.234');
acc({kind:'numeric',value:7.255,tolerance:0.005},'7.26');
// wrong-value notes compare rounded values
{const s=num(1.2346,3,{wrongValues:[{value:5.4321,note:'n'}]});const r=A.check('5.432',s);if(r.ok===false&&r.note==='n')pass++;else fails.push('wrong-value note not matched at the rounded value');}
{const s=num(1.2346);const r=A.check('1.234',s);if(r.ok===false&&/Close/.test(r.note))pass++;else fails.push('near-miss note missing');}
{const r=A.check('1.2346',num(1.2346));if(r.ok===false&&/more decimal places/.test(r.note))pass++;else fails.push('too-precise note missing');}

// calculator intervals: each endpoint rounded; exact whole-number endpoints may stay whole
const iv={kind:'interval',variable:'t',places:3,anyBrackets:true,parts:[{left:0,right:1.2346},{left:3.5,right:5}]};
acc(iv,'(0, 1.235) U (3.5, 5)','(0,1.2350)∪(3.500,5.000)','[0, 1.235] U [3.5, 5]','(0.000, 1.235) U (3.5, 5)','(0, 1.235)∪(3.5, 5)');
rej(iv,'(0, 1.234) U (3.5, 5)','(0, 1.2346) U (3.5, 5)','(0, 1.235)','(0, 1.235) U (3.5, 5.001)');
inv(iv,'(0, ln(3.44)) U (3.5, 5)','(0, 1.235) U (3.5, 10/2)');
const iv1={kind:'interval',variable:'t',places:3,parts:[{left:0.9375,right:Infinity}]};
acc(iv1,'(0.938, ∞)','(.938, infinity)','t>0.938','t > .9380');rej(iv1,'[0.938, ∞)','(0.937, ∞)','(0.9375, ∞)');
const iv2={kind:'interval',variable:'t',places:3,anyBrackets:true,parts:[{left:-2.71828,right:-0.0004}]};
acc(iv2,'(-2.718, 0)','(-2.718, -0)','(-2.718,-0.000)');rej(iv2,'(-2.719, 0)','(-2.718, -0.001)');
// rounded lists
const li={kind:'list',places:3,values:[1.2346,3.0001]};
acc(li,'1.235, 3','3.000, 1.235','t = 1.235, t = 3');rej(li,'1.234, 3','1.235','1.235, 3, 4','1.2346, 3');inv(li,'1.235, ln(20)');
// exact answers are not rounded answers
const ex={kind:'exact',value:1/3};acc(ex,'1/3','(1)/(3)','2/6');rej(ex,'0.333','.3333');
acc({kind:'exact',value:1.25},'5/4','1.25','1.250');
// the core helpers
for(const [x,p,s] of [[1.2345,3,'1.235'],[-1.2345,3,'-1.235'],[-0.0004,3,'0.000'],[2.5,0,'3'],[1234.5,2,'1234.50'],[0.0005,3,'0.001'],[1e-12,3,'0.000'],[-999.9995,3,'-1000.000']])
 if(C.fix(x,p)===s)pass++;else fails.push(`fix(${x},${p}) = ${C.fix(x,p)}, expected ${s}`);
for(const [x,p,w] of [[1.2345,3,true],[1.2345000001,3,true],[1.23450001,3,false],[1.2346,3,false],[0.5,0,true],[1234.5678,3,false]])
 if(C.nearTie(x,p)===w)pass++;else fails.push(`nearTie(${x},${p}) should be ${w}`);
// generated problems: every rounded answer accepts its rounded value (also with a trailing zero, and with a bare
// leading point below 1) and rejects the neighbouring last digits and the unrounded value
const N=+(process.argv[2]||400);const gen={parts:0};
for(const [slug,file] of [['basic-first-order-differential-equations','unit5-basic.js'],['motion-problems','unit5-motion.js'],['exponential-growth-and-decay-interest-newton-s-law-of-cooling','unit5-growth.js'],['rate-problems','unit5-rate.js']]){
 const G=load([file]);const g=G.G.get(slug),F=G.W.BatchMathUnit5Core;
 for(let i=1;i<=N;i++){G.seed(i*4243);const p=g({});
  for(const q of p.parts){const a=q.answer;if(!a||a.places===undefined)continue;gen.parts++;const k=a.places;
   const step=10**-k,label=`${p.id}`;
   if(a.kind==='numeric'){const v=a.value,r=F.fix(v,k),sc=F.roundScaled(v,k);
    const forms=[r,k?r+'0':r+'.0'];if(Math.abs(v)<1&&k>0)forms.push(r.replace(/^(-?)0\./,'$1.'));
    for(const f of forms)t(a,f,'accept',label);
    for(const n of [sc-1,sc+1])t(a,F.scaledText(n,k),'reject',label);
    const raw=String(v);if(/\.\d*[1-9]\d*$/.test(raw)&&raw.split('.')[1].length>k)t(a,raw,'reject',label);}
   if(a.kind==='interval'){const ps=a.parts;const txt=(sh)=>ps.map((q,j)=>`(${Number.isFinite(q.left)?F.scaledText(F.roundScaled(q.left,k)+(j===0?sh:0),k):'-infinity'}, ${Number.isFinite(q.right)?F.scaledText(F.roundScaled(q.right,k),k):'infinity'})`).join(' U ');
    t(a,txt(0),'accept',label);if(Number.isFinite(ps[0].left)&&Math.abs(ps[0].left)>1e-9)t(a,txt(1),'reject',label);}
  }}}
console.log(`generated rounded parts checked: ${gen.parts}`);
console.log(`rounding matrix: ${pass} passed, ${fails.length} failed`);
if(fails.length)console.log(fails.join('\n'));process.exitCode=fails.length?1:0;
