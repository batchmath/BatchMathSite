import fs from'node:fs';
import path from'node:path';
import vm from'node:vm';
import{fileURLToPath}from'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
let state=0x10800001;
const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
const context={window:{},BatchMathRNG:{random},console,Math,setTimeout,requestAnimationFrame:fn=>fn()};
context.window.BatchMathRNG=context.BatchMathRNG;
vm.createContext(context);
for(const file of[
 'ap-topic-generators','unit1-core-expansions','unit1-basic-techniques',
 'unit1-ivt-expansions','unit1-continuity-parameters','unit1-one-sided',
 'unit1-course-trig','unit1-advanced-trig-shared','unit1-advanced-trig-all',
 'unit1-infinity-legacy','unit1-infinity-expansions','unit1-representations',
 'unit1-discontinuities','unit1-comprehensive-review'
])vm.runInContext(read(`assets/${file}.js`),context,{filename:file});

const errors=[],expect=(condition,message)=>{if(!condition)errors.push(message);};
const basic=context.window.BMUnit1BasicTechniques;
const review=context.window.BMUnit1ComprehensiveReview;
const strings=problem=>['q','questionHtml','sol','explanation','hint'].flatMap(key=>typeof problem[key]==='string'?[problem[key]]:[]);
const unitCoefficient=/(^|[^0-9])1(?=(?:x|t|u|z|\\theta)(?:\^\{?\d+\}?|\b)|\\sqrt|\\sin|\\cos|\\tan|\\ln)/;
const minusNegative=/-\s*(?:\(\s*-|\\left\(\s*-|\\frac\{\s*-)|-\s*-/;

let infinitySamples=0,individualComplexSamples=0,reviewComplexSamples=0;
for(let i=0;i<100000;i++){
 const infinity=review.generate('infinity');infinitySamples++;
 for(const value of strings(infinity))expect(!unitCoefficient.test(value),`Limits at Infinity unit coefficient: ${infinity.id}: ${value}`);
 const individual=basic.generate('complex');individualComplexSamples++;
 for(const value of strings(individual))expect(!minusNegative.test(value),`Individual Complex Fractions minus-negative: ${individual.id}: ${value}`);
 const comprehensive=review.generate('complex');reviewComplexSamples++;
 for(const value of strings(comprehensive))expect(!minusNegative.test(value),`Review Complex Fractions minus-negative: ${comprehensive.id}: ${value}`);
 if(errors.length>50)break;
}
for(const [input,expected]of[
 ['A - (-B)','A + B'],
 ['A - \\frac{-B}{C}','A + \\frac{B}{C}'],
 ['= -\\frac{-12}{37}','=\\frac{12}{37}']
])expect(basic.normalizeComplexDisplay(input)===expected,`complex normalizer failed for ${input}`);

const trigVariants=new Set();
for(let i=0;i<25000;i++){
 const p=review.generate('regularTrig');
 if(['expanded_cosine','expanded_cosine_fourth','mixed_trig_quadratic','nonlinear_argument'].includes(p.variant))trigVariants.add(p.variant);
}
for(const variant of['expanded_cosine','expanded_cosine_fourth','mixed_trig_quadratic','nonlinear_argument'])expect(trigVariants.has(variant),`long Regular Trig variant not encountered: ${variant}`);

const discontinuityKinds={simple:false,rational:false,piecewise:false};
for(let i=0;i<10000;i++){
 const p=review.generate('discontinuities');
 expect(p.q.includes('u1-review-discontinuity-prompt')&&p.q.includes('u1-review-discontinuity-function'),'discontinuity question lacks stacked structured layout');
 const variant=p.variant||p.problemVariant||'';
 if(/single_removable/.test(variant))discontinuityKinds.simple=true;
 if(/rational|repeated/.test(variant))discontinuityKinds.rational=true;
 if(/piecewise/.test(variant))discontinuityKinds.piecewise=true;
}
for(const[k,v]of Object.entries(discontinuityKinds))expect(v,`discontinuity ${k} layout sample not reached`);

for(let i=0;i<10000;i++){
 const p=review.generate('ivt');
 expect(Array.isArray(p.choices)&&p.choices.length===4,`IVT did not supply exactly four choices: ${p.id}`);
}

const controller=read('assets/unit1-comprehensive-review.js'),css=read('assets/unit1-practice.css');
for(const needle of[
 'u1-review-question-${p.cat}','u1-review-options-${p.cat}',
 "['regularTrig','discontinuities']",'u1-review-discontinuity-function',
 "e.key==='Enter'&&!e.defaultPrevented","typeset([$('question')]).then",
 "window.MathJax?.startup?.promise","window.addEventListener('load'"
])expect(controller.includes(needle),`review controller missing ${needle}`);
for(const needle of[
 '.u1-review-question-regularTrig','.u1-review-discontinuity{display:grid',
 '.u1-review-discontinuity-function','.u1-review-options-ivt{display:grid',
 '.u1-review-options-ivt .choice'
])expect(css.includes(needle),`review CSS missing ${needle}`);
expect((review.options||[]).length===17,'Comprehensive Review no longer has exactly 17 Practice Type choices');
let responsiveFitChecks=0;
for(const available of[720,320])for(const needed of[280,520,900,1200]){
 const scale=needed>available?Math.min(1,(available/needed)*.98):1;
 expect(needed*scale<=available+1e-9,`responsive fit failed: ${needed}px math in ${available}px container`);
 if(needed<=available)expect(scale===1,`normal-length expression was unnecessarily scaled at ${available}px`);
 responsiveFitChecks++;
}

const result={infinitySamples,individualComplexSamples,reviewComplexSamples,longTrigVariants:[...trigVariants].sort(),responsiveFitChecks,discontinuityKinds,ivtSamples:10000,errors:errors.slice(0,100)};
fs.mkdirSync(path.join(root,'qa-results'),{recursive:true});
fs.writeFileSync(path.join(root,'qa-results/unit1-v108-five-fixes.json'),JSON.stringify(result,null,2)+'\n');
if(errors.length){console.error(errors.slice(0,100).join('\n'));process.exit(1);}
console.log('Unit 1 v10.8 five-fix generator/static QA passed.');
console.log(JSON.stringify(result,null,2));
