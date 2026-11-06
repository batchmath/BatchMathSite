// v12.9.B Unit 6 integral checker, adversarial cases: the setup is checked, not only its value. For the region between
// y = sqrt(x) and y = x^2 revolved about y = -4: equivalent washer forms (expanded, pi inside, split, reversed and
// negated) and the shell setup (when the problem allows it) are accepted; shells when washers are named, (R - r)^2,
// a missing pi and three setups engineered to have the right value (a constant, a scaled polynomial, wrong limits with
// a rescaled integrand) are refused. A symmetric region's half, doubled, is accepted; the half alone is refused.
// Usage: node tools/review-lab/unit6/qa/checker-adversarial.mjs (exit code 1 on any failure)
import {load} from './lib.mjs';
const {C}=load();const {Q,pm,fp,bq,region,washerTerms,shellTerms,areaTerms,integralPart}=C;
const sq=fp(pm(1,Q(1,2))),x2=fp(pm(1,2));
const R=region({xs:[{a:bq(0),b:bq(1),top:sq,bot:x2}],ys:[{a:bq(0),b:bq(1),right:sq,left:x2}],view:{xmin:-1,xmax:2,ymin:-1,ymax:2}});
const W=washerTerms(R,{type:'y',c:-4}),S=shellTerms(R,{type:'y',c:-4});
const pNamed=integralPart('w',W,'',{variable:'x',others:[{terms:S,note:'shells not asked'}]}),pAny=integralPart('w',W,'',{alt:[S]});
const r=(coef,lo,up,f,v='x')=>({coef,lower:lo,upper:up,integrand:f,v});
const cases=[
 ['washers',pAny,[r('pi','0','1','(4+sqrt(x))^2-(4+x^2)^2')],true],
 ['washers expanded',pAny,[r('pi','0','1','8sqrt(x)+x-8x^2-x^4')],true],
 ['pi inside',pAny,[r('','0','1','pi((4+sqrt(x))^2-(4+x^2)^2)')],true],
 ['split at 1/3',pAny,[r('pi','0','1/3','(4+sqrt(x))^2-(4+x^2)^2'),r('pi','1/3','1','(4+sqrt(x))^2-(4+x^2)^2')],true],
 ['reversed limits, negated',pAny,[r('-pi','1','0','(4+sqrt(x))^2-(4+x^2)^2')],true],
 ['shells (alt)',pAny,[r('2pi','0','1','(y+4)(sqrt(y)-y^2)','y')],true],
 ['shells when washers named',pNamed,[r('2pi','0','1','(y+4)(sqrt(y)-y^2)','y')],false],
 ['(R-r)^2',pAny,[r('pi','0','1','(sqrt(x)-x^2)^2')],false],
 ['same value, wrong integrand (constant)',pAny,[r('','0','1',String(C.numValue(W)))],false],
 ['same value, wrong integrand (scaled polynomial)',pAny,[r('','0','1',`${C.numValue(W)*2}x`)],false],
 ['same value, wrong limits',pAny,[r('pi','0','2',`((4+sqrt(x))^2-(4+x^2)^2)*${C.numValue(W)/(Math.PI*C.quad(t=>(4+Math.sqrt(t))**2-(4+t*t)**2,0,2))}`)],false],
 ['missing pi',pAny,[r('','0','1','(4+sqrt(x))^2-(4+x^2)^2')],false],
];
let failed=0;
for(const [name,part,rows,want] of cases){const res=C.checkIntegral(rows,part.answer);if(res.ok!==want)failed++;console.log((res.ok===want?'PASS':'FAIL').padEnd(5),name.padEnd(48),JSON.stringify(res).slice(0,140));}
// area: symmetric region (cap) halved and doubled
const cap=region({xs:[{a:bq(-2),b:bq(2),top:fp(C.padd(C.pc(4),pm(-1,2))),bot:C.fconst(0)}]}),Ta=areaTerms(cap,'x'),pa=integralPart('a',Ta,'');
for(const [name,rows,want] of [['cap',[r('','-2','2','4-x^2')],true],['cap halved, doubled',[r('2','0','2','4-x^2')],true],['cap wrong half',[r('','0','2','4-x^2')],false]]){const res=C.checkIntegral(rows,pa.answer);if(res.ok!==want)failed++;console.log((res.ok===want?'PASS':'FAIL').padEnd(5),name.padEnd(48),JSON.stringify(res).slice(0,100));}

console.log(failed?`${failed} case(s) FAILED`:'All checker cases pass.');if(failed)process.exitCode=1;
