import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {engine as dynamic,plans} from '../mathlive-sitewide/reviews-dynamic-engine.mjs';
import {limitsEngine,root,rng} from '../mathlive-sitewide/reviews-static-engine.mjs';
import {valueEngine,algebraEngine,routes as im1Routes} from '../mathlive-sitewide/im1-engine.mjs';
import {engine as u3engine} from '../mathlive-sitewide/im1-unit3-engine.mjs';
import {unit3Routes,slug,modes} from '../mathlive-sitewide/im1-reviews-engine.mjs';
const clean=q=>JSON.parse(JSON.stringify(q,(k,v)=>typeof v==='function'?undefined:v));
const records=new Map(),counts={},failures=[];
function add(route,family,q,options={},original=q,policy='The shared topic generator supplies this task unchanged; the selector chooses the family, not its instruction.'){
 counts[route]=(counts[route]||0)+1;
 const parts=q.parts||[q.stage1,q.stage2,q.part2].filter(Boolean),contracts=parts.map(p=>[p.type,p.control,p.keypadMode,p.answer?.kind||p.unit4Answer?.kind,p.hidePrompt]);
 const key=route+'|'+family+'|'+JSON.stringify(options)+'|'+JSON.stringify(contracts);
 if(records.has(key))return;
 const final=[q.q,q.questionHtml,q.question,q.questionHTML,q.text,q.prompt,q.lineInputHint,q.intervalInputHint,q.textInputHint,...parts.map(p=>p.prompt),...(q.fields||[]).map(f=>f.label||f.prompt)].filter(Boolean).join('\n');
 const originalInstruction=[original.q,original.questionHtml,original.question,original.questionHTML,original.text,original.prompt,...(original.parts||[original.stage1,original.stage2,original.part2].filter(Boolean)).map(p=>p.prompt)].filter(Boolean).join('\n');
 assert.ok(final,route+': no visible task '+family);
 records.set(key,{course:route.startsWith('im1/')?'IM1':route.startsWith('calculus-prep/')?'Calculus Prep':'AP Calculus',unit:route.match(/unit-(\d)/)?.[1]||'Prep',engine:route,family,selector:options,originalInstruction,reviewBefore:final,finalInstruction:final,problem:'None demonstrated',generatorOrCheckerChange:false,policy,contracts,example:clean(q),testEvidence:'Actual seeded generation through every public selector; existing semantic/grading/MathLive suites cover the answer contracts.'});
}
function walk(dir){return fs.readdirSync(root+dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):e.name==='index.html'?[dir+'/'+e.name]:[]);}
for(const route of walk('ap-calculus').filter(r=>!r.includes('/unit-6-')&&fs.readFileSync(root+r,'utf8').includes('BM_TOPIC_PRACTICE'))){
 try{const e=dynamic(route);let base;
  // Capture the standalone task before the Unit 5 review adds its topic tag.
  for(const name of['Basic','Motion','Slope','Separable','Growth','Rate']){const k='BatchMathUnit5'+name,o=e.b[k];if(o)e.b[k]={...o,make(...args){const q=o.make(...args);base=clean(q);return q;}};}
  for(const plan of plans(e))for(let seed=1;seed<=300;seed++){
   base=null;const q=e.generate(seed*719,plan.slug,plan.options),family=(q.unit5Meta?.reviewTopic||q.topicSlug||plan.slug)+':'+(q.unit4Meta?.family||q.unit5Meta?.family||q.variant||q.family||q.id?.split('-')[0]);
   if(base){assert.deepEqual(clean(q.parts),base.parts);const strip=s=>s.replace(/<div class="u5-review-tag">[^<]*<\/div>/,'');assert.equal(strip(q.questionHtml),base.questionHtml);}
   add(route,family,q,plan.options,base||q,base?'The review adds a topic/difficulty tag; every original task and part prompt is retained.':'Review and standalone resolve the same registered generator; its complete question and multipart instructions are retained.');
  }
 }catch(error){failures.push({route,error:error.stack});}
}
console.log('dynamic',Object.keys(counts).length,'routes',records.size,'groups',failures.length,'failures');
const b=limitsEngine(),api=b.BMUnit1ComprehensiveReview,route='ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html';
for(const[mode]of api.options){api.reset();for(let seed=1;seed<=400;seed++){b.BatchMathRNG.random=rng(seed*719);const q=api.generate(mode),family=q.cat+':'+(q.variant||q.familyId||q.familyName||q.id.split('-')[0]);add(route,family,q,{mode},q,q.cat==='discontinuities'?'The review explicitly asks to find and classify every discontinuity; its location and classification controls state both parts.':'The review preserves the original generator question (including limit target, one-sided direction, continuity parameter, graph/table and theorem conditions); symbolic limit notation makes Evaluate sufficient.');}}
for(const route of im1Routes.filter(r=>r.unit==='unit1')){const e=valueEngine(route),select=e.html.match(/<select[^>]*id="categorySelect"[^>]*>([\s\S]*?)<\/select>/),options=select?[...select[1].matchAll(/<option[^>]*value="([^"]+)"/g)].map(m=>m[1]):['mixed'];const directions=[...e.html.matchAll(/<div[^>]*class="instruction"[^>]*>([\s\S]*?)<\/div>/g)].map(m=>m[1]).join(' ');for(const mode of options)for(const q of e.generate(719,mode,100)){const visible={...q,prompt:[q.prompt,directions].filter(Boolean).join(' ')};add(route.path,mode+':'+(q.variant||q.problemType||q.type||q.kind||q.id?.split('-')[0]||'numeric'),visible,{mode},visible,'The mixed selector shares the same renderer and generated task as each operation mode; reduction, decimal and literal-input requirements remain visible.');}}
{const b=algebraEngine(),api=b.BatchMathIM1Unit2Generators;let base,source;for(const[k,f]of Object.entries(api.all))api.all[k]=(...args)=>{const q=f(...args);base=clean(q);source=k;return q;};const gen=api.get('comprehensive-review');for(let seed=1;seed<=3200;seed++){b.BatchMathRNG={random:rng(seed*719)};const q=gen();assert.deepEqual(clean(q),base);add('im1/unit-2-algebraic-operations-equations-inequalities/topics/comprehensive-review/practice/index.html',source+':'+q.variant,q,{},base,'The review returns the complete standalone object, including polynomial simplification, equation/interval wording and second-part prompts.');}}
{const b=u3engine(),api=b.BatchMathIM1Unit3Generators;let base,source;for(const[k,f]of Object.entries(api.lessons))api.lessons[k]=(...args)=>{const q=f(...args);base=clean(q);source=k;return q;};for(const route of unit3Routes)for(const mode of modes(route))for(let seed=1;seed<=400;seed++){b.BatchMathRNG={random:rng(seed*719)};const q=api.get(slug(route))({mode});assert.deepEqual(clean(q),base);add(route,source+':'+q.variant+(q.kind==='arithmetic-identification'?':'+q.arithmetic:''),q,{mode},base,'Section and comprehensive reviews return the complete standalone task and field labels: explicit versus recursive, initial term, slope, point-slope or slope-intercept form remain explicit.');}}

import {engine as derivativeEngine,modes as derivativeModes,routes as derivativeRoutes,signature} from '../mathlive-sitewide/unit2-engine.mjs';
import {prepSandbox,specs as prepSpecs} from '../calc-prep-semantic-qa.mjs';
import {instructionCases,instructionSignature,reviewPath,baseline} from './review-instruction-fixture.mjs';
// AP Unit 2 topic mixed selectors and derivatives at a point retain their
// intentionally simplified standalone directions. They are comparison sources,
// not targets for restoration of the comprehensive review's imperative text.
for(const route of derivativeRoutes){const e=derivativeEngine(route);for(const mode of derivativeModes(e)){for(const[k,v]of Object.entries(mode))e.el(k).value=v;for(let seed=1;seed<=300;seed++){e.b.BatchMathRNG.random=rng(seed*719);e.qa.makeProblem();const q=clean(e.qa.current);q.q=q.q||e.el('question').innerHTML;add(route.path,signature(q),q,mode,q,'Standalone wording was deliberately simplified previously; its symbolic target or indicated point supplies the task. This audit preserves that wording and the original answer.');}}}
// The classification review uses a retained checkbox controller, not MathLive.
{const route={path:'im1/unit-1-review/topics/classifying-numbers/practice/index.html',unit:'unit1',slug:'classifying-numbers'},e=valueEngine(route);for(const q of e.generate(719,'mixed',100)){const prompt=e.html.match(/<div class="instruction">([\s\S]*?)<\/div>/)?.[1]||'Select every classification that applies.';add(route.path,q.id.replace(/-.*$/,''),{...q,prompt},{},{...q,prompt},'The original checkbox directions require every applicable classification; mathematical-expression simplification does not replace that task.');}}
// Enumerate every public generator selector combination, excluding answer
// dropdowns. Each mixed option uses the same make/build and render functions.
const prepPaths={'unit_circle':'unit-circle-values','angle_skills':'trig-angle-skills','trig_equations':'trig-equations','algebra':'calculus-algebra','domains':'domains','logs':'log-rules','identities':'trig-identities','factoring':'special-factoring','synthetic':'synthetic-division','function_graphs':'function-graphs','rational_functions':'rational-functions'};
for(const spec of prepSpecs){const route='calculus-prep/'+prepPaths[spec.engine]+'/index.html',html=fs.readFileSync(root+route,'utf8'),ids=new Set(['mode','format','angleSet','quadrant','degree','family','qtype','difficulty','set','displayMode']);let combinations=[{}];for(const m of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g))if(ids.has(m[1])){const values=[...m[2].matchAll(/<option\b[^>]*value="([^"]*)"/g)].map(x=>x[1]);combinations=combinations.flatMap(o=>values.map(v=>({...o,[m[1]]:v})));}
 for(const options of combinations){const h=prepSandbox(spec.asset,{...spec.modes[0][1],...options},719,spec.fn||'make');for(let seed=1;seed<=100;seed++){h.sb.BatchMathRNG.random=rng(seed*719);const q=clean(h.make());assert.equal(spec.validate(q),'',route+': '+q.id);const prompt=q.prompt|| (spec.engine==='unit_circle'?'Find the exact value.':spec.engine==='rational_functions'?`Analyze the rational function (${q.dm} form). Identify holes, vertical asymptotes, the end asymptote and x-intercepts.`:null);add(route,(q.variant||q.kind||q.type||q.f||q.obj?.family||q.id?.replace(/[-\d].*$/,'')),{...q,prompt},options,{...q,prompt},'There is no copied review wrapper: all selector modes, including mixed, share this exact generator and renderer. Exact values, solution sets, factoring, coefficients and feature labels remain task-specific.');}}
}

const cases=instructionCases();
for(const {q,before,mode,seed}of cases.reps.values()){
 const key=reviewPath+'|'+instructionSignature(q)+'|'+mode+'|'+q.__authoredPrompt;
 const prompt=q.__authoredPrompt||q.q.match(/question-prompt">([\s\S]*?)<\/div>/)?.[1],changed=q.q!==before.q;
 records.set(key,{course:'AP Calculus',unit:'2',engine:reviewPath,family:instructionSignature(q),selector:{category:mode},seed,
 originalInstruction:prompt,reviewBefore:before.q,finalInstruction:q.q,
 problem:changed?'The mk helper replaced this authored instruction; retain its task/order/form/domain. Some inverse/notation wording is equivalent but should also be preserved.':'No instruction loss',generatorOrCheckerChange:false,
 policy:'Restore the authored comprehensive-review task; deliberately simplified standalone directions remain unchanged.',example:q,
 testEvidence:'26,400 paired generations compare identical IDs/answers/solutions/variables to video checkpoint '+baseline+'; all changed instruction groups have correct/incorrect grading and real browser render/transition checks.'});
}
counts[reviewPath]=cases.generated;
assert.equal(cases.reps.size,610);assert.equal(cases.changed.size,93);assert.equal(failures.length,0,JSON.stringify(failures));
const catalog={generated:Object.values(counts).reduce((a,b)=>a+b,0),engineCount:Object.keys(counts).length,familySelectorContractGroups:records.size,
 changedInstructionGroups:cases.changed.size,unit2Selectors:cases.modes,counts,records:[...records.values()],failures,
 note:'Family/selector/contract groups are distinct finite audit records, not counts of mathematically independent families or every possible parameter value. All public selector combinations are enumerated; seeded variants and wrapper preservation comparisons supplement the existing mathematical suites. Unit 6 excluded.'};
// Instructions omit only embedded SVG drawing markup; the original full
// generated question/answer object remains in each example for inspection.
for(const r of catalog.records)for(const k of['originalInstruction','reviewBefore','finalInstruction'])if(r[k])r[k]=r[k].replace(/<svg\b[\s\S]*?<\/svg>/g,'[diagram retained in example]').replace(/\s+/g,' ').trim();
fs.writeFileSync(root+'docs/audits/COMPREHENSIVE-REVIEW-INSTRUCTIONS.json',JSON.stringify(catalog,null,2)+'\n');
console.log(catalog.engineCount,'engines',catalog.generated,'generated questions',catalog.familySelectorContractGroups,'family/selector/contract records',catalog.changedInstructionGroups,'changed instruction records',failures.length,'failures');
