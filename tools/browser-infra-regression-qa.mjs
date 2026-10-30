#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[];const stats={};const fail=m=>errors.push(m);

// Report-a-problem race regression: both late-UI and early-generation paths must reveal the control.
const repro=fs.readFileSync(path.join(ROOT,'assets/reproducible-rng.js'),'utf8');
if(!/if \(problemCount > 0\) button\.style\.display = 'block';/.test(repro))fail('report UI does not reveal button when generation precedes UI creation');
if(!/if \(!document\.getElementById\('bm-report-problem'\) && document\.body\) ensureReportUI\(\);/.test(repro))fail('noteProblem does not synchronously create report UI when possible');
stats.reportRaceGuards=2;

// Integer add/subtract reproducibility IDs.
const ints=fs.readFileSync(path.join(ROOT,'im1/unit-1-review/topics/adding-and-subtracting-negative-numbers/practice/index.html'),'utf8');
if(!/id:`int-\$\{op===\"\+\"\?\"add\":\"sub\"\}-\$\{x\}-\$\{y\}`/.test(ints))fail('IM1 integer add/sub problems missing deterministic id');
if(!/key:`int-\$\{op===\"\+\"\?\"add\":\"sub\"\}-\$\{x\}-\$\{y\}`/.test(ints))fail('IM1 integer add/sub problems missing deterministic key');
stats.integerIdKeyGuards=2;

// Unit 5 comprehensive review (v12.8.W): one generator, unit5-comprehensive-review, drawing on all six rebuilt
// Unit 5 engines. The page must load every engine script, and the review must reach every topic.
const u5rel='ap-calculus/unit-5-differential-equations/topics/comprehensive-review/assignment-practice/index.html';
const u5=fs.readFileSync(path.join(ROOT,u5rel),'utf8');
let u5cfg=null;try{u5cfg=JSON.parse((u5.match(/window\.BM_TOPIC_PRACTICE=(\{[^<]*?\});/)||[])[1]);}catch(e){}
if(!u5cfg?.slug)fail('Unit 5 comprehensive review config could not be parsed');
const u5scripts=[...u5.matchAll(/<script[^>]*src="\/assets\/([^"]+)"/g)].map(x=>x[1]);
const u5engines=['unit5-basic.js','unit5-motion.js','unit5-slope-fields.js','unit5-separable.js','unit5-growth.js','unit5-rate.js'];
for(const f of ['ap-topic-generators.js','unit5-core.js','unit5-answers.js',...u5engines,'unit5-review.js'])if(!u5scripts.includes(f))fail(`Unit 5 comprehensive review does not load ${f}`);
let u5seed=12345;const u5rng=()=>{u5seed=(u5seed*1103515245+12345)%2147483648;return u5seed/2147483648;};
const box={window:{BatchMathRNG:{random:u5rng}},console,Math,document:{addEventListener(){}}};box.window.window=box.window;vm.createContext(box);
try{for(const f of u5scripts.filter(f=>/^(?:derivative-expression-checker|unit4-exact-answers|ap-topic-generators|unit5-(?!ui))/.test(f)))vm.runInContext(fs.readFileSync(path.join(ROOT,'assets',f),'utf8'),box,{filename:f});}catch(e){fail(`Unit 5 review scripts failed to load: ${e.message}`);}
const u5review=u5cfg?.slug&&box.window.BatchMathAPTopicGenerators?.get?.(u5cfg.slug);
const reached=new Set();
if(typeof u5review!=='function')fail(`Unit 5 comprehensive review references unavailable generator: ${u5cfg?.slug}`);
else{try{for(let i=0;i<300;i++)reached.add(u5review({}).unit5Meta?.reviewTopic);}catch(e){fail(`Unit 5 comprehensive review failed to generate: ${e.message}`);}}
for(const t of ['basic','motion','slope','separable','growth','rate'])if(!reached.has(t))fail(`Unit 5 comprehensive review never drew from ${t} in 300 problems`);
stats.unit5LiveReviewGenerators=reached.size;

// Seeded browser QA itself must preserve the repaired snapshot reference and normalizer/browser checks.
const seeded=fs.readFileSync(path.join(ROOT,'tools/seeded-browser-qa.mjs'),'utf8');
if(/return \{snap,/.test(seeded))fail('seeded browser QA regressed to undefined snap variable');
if(!/snap:s/.test(seeded))fail('seeded browser QA no longer returns snapshot as snap:s');
if(!/BatchMathAnswers/.test(seeded))fail('seeded browser QA no longer waits for/tests answer normalizer');
stats.seededHarnessGuards=3;

// Execute keyboard and generation-accounting regressions against production code.
await import('./keyboard-regression-qa.mjs');
stats.keyboardBehaviorSuite=1;

// Classifying Discontinuities has a custom multi-stage question container and
// should not be forced through the standard one-step Enter-advance test.
if(!/['"]#problem['"]/.test(seeded))fail('seeded browser QA does not inspect the custom #problem question container');
if(!/ENTER_ADVANCE_EXCLUSIONS=new Set\(\['ap_classifying_discontinuities'\]\)/.test(seeded))fail('custom discontinuity engine is not excluded from inappropriate standard Enter-advance QA');
if(!/Expected 141 engines/.test(seeded))fail('seeded browser QA expected engine count is not 141');
stats.seededCustomEngineGuards=3;

// Unit 1 comprehensive-review cleanup requested for this checkpoint.
const unit1ReviewPath='ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/index.html';
const unit1Review=fs.readFileSync(path.join(ROOT,unit1ReviewPath),'utf8');
if(/Limits &amp; Continuity Assignment Review|Limits & Continuity Assignment Review/.test(unit1Review))fail('removed Limits & Continuity Assignment Review launch is still present');
if(!/class="bm-practice-label">Comprehensive Review<\/span>/.test(unit1Review))fail('Comprehensive Review launch label is missing');
if(/L’Hôpital’s Rule/.test(unit1Review))fail('Unit 1 extra-video heading still mentions L’Hôpital’s Rule');
if(fs.existsSync(path.join(ROOT,'ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/assignment-practice/index.html')))fail('removed Unit 1 assignment-review engine page still exists');
stats.unit1ReviewCleanupGuards=4;

const ok=!errors.length;
console.log('BatchMath browser-infrastructure regression QA');
console.log(`Result: ${ok?'PASS':'FAIL'}`);
for(const [k,v] of Object.entries(stats))console.log(`${k}: ${v}`);
console.log(`Errors: ${errors.length}`);for(const e of errors)console.log(`- ${e}`);
if(!ok)process.exit(1);
