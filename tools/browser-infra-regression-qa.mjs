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

// Unit 5 comprehensive review must reference only live shared generators.
const u5rel='ap-calculus/unit-5-differential-equations/topics/comprehensive-review/assignment-practice/index.html';
const u5=fs.readFileSync(path.join(ROOT,u5rel),'utf8');
const m=u5.match(/window\.BM_TOPIC_PRACTICE=\{slugs:\[([^\]]+)\]/);
if(!m)fail('Unit 5 comprehensive review slugs could not be parsed');
let slugs=[];
if(m){slugs=[...m[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]);}
const genSrc=fs.readFileSync(path.join(ROOT,'assets/ap-topic-generators.js'),'utf8');
const box={window:{BatchMathRNG:{random:()=>0.5}},console,Math};box.window.window=box.window;vm.createContext(box);
try{vm.runInContext(genSrc,box,{filename:'ap-topic-generators.js'});}catch(e){fail(`shared generator registry failed to load: ${e.message}`);}
for(const slug of slugs){if(typeof box.window.BatchMathAPTopicGenerators?.get?.(slug)!=='function')fail(`Unit 5 comprehensive review references unavailable generator: ${slug}`);}
for(const retired of ['slope-fields','exponential-growth-and-decay-interest-newton-s-law-of-cooling'])if(slugs.includes(retired))fail(`Unit 5 review still contains retired generator: ${retired}`);
stats.unit5LiveReviewGenerators=slugs.length;

// Seeded browser QA itself must preserve the repaired snapshot reference and normalizer/browser checks.
const seeded=fs.readFileSync(path.join(ROOT,'tools/seeded-browser-qa.mjs'),'utf8');
if(/return \{snap,/.test(seeded))fail('seeded browser QA regressed to undefined snap variable');
if(!/snap:s/.test(seeded))fail('seeded browser QA no longer returns snapshot as snap:s');
if(!/BatchMathAnswers/.test(seeded))fail('seeded browser QA no longer waits for/tests answer normalizer');
stats.seededHarnessGuards=3;

// Enter-to-advance regression: shared calculus handler must be fallback-only so
// page-native Enter handlers cannot race it and generate two problems.
const pwa=fs.readFileSync(path.join(ROOT,'assets/pwa.js'),'utf8');
if(!/If a page-specific handler already handled Enter/.test(pwa))fail('shared calculus Enter handler is not documented/implemented as fallback-only');
if(!/if \(event\.defaultPrevented\) return;/.test(pwa))fail('shared calculus Enter handler does not yield to native handled events');
if(!/const before = Number\(window\.BatchMathRepro\?\.problemCount \|\| 0\);/.test(pwa))fail('shared calculus Enter fallback does not snapshot the problem counter');
if(!/if \(afterNative > before\) return;/.test(pwa))fail('shared calculus Enter fallback does not suppress a second advance after native handling');
if(!/button#next, button#new/.test(pwa)||!/lastAdvanceClickAt/.test(pwa))fail('Next/New rapid duplicate-click latch missing');
stats.enterAdvanceRaceGuards=5;

// Classifying Discontinuities has a custom multi-stage question container and
// should not be forced through the standard one-step Enter-advance test.
if(!/['"]#problem['"]/.test(seeded))fail('seeded browser QA does not inspect the custom #problem question container');
if(!/ENTER_ADVANCE_EXCLUSIONS=new Set\(\['ap_classifying_discontinuities'\]\)/.test(seeded))fail('custom discontinuity engine is not excluded from inappropriate standard Enter-advance QA');
if(!/Expected 88 engines/.test(seeded))fail('seeded browser QA expected engine count is not 88');
stats.seededCustomEngineGuards=3;

// Unit 1 comprehensive-review cleanup requested for this checkpoint.
const unit1ReviewPath='ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/index.html';
const unit1Review=fs.readFileSync(path.join(ROOT,unit1ReviewPath),'utf8');
if(/Limits &amp; Continuity Assignment Review|Limits & Continuity Assignment Review/.test(unit1Review))fail('removed Limits & Continuity Assignment Review launch is still present');
if(!/Computational Limits Practice/.test(unit1Review))fail('Computational Limits Practice launch was accidentally removed');
if(/L’Hôpital’s Rule/.test(unit1Review))fail('Unit 1 extra-video heading still mentions L’Hôpital’s Rule');
if(fs.existsSync(path.join(ROOT,'ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/assignment-practice/index.html')))fail('removed Unit 1 assignment-review engine page still exists');
stats.unit1ReviewCleanupGuards=4;

const ok=!errors.length;
console.log('BatchMath browser-infrastructure regression QA');
console.log(`Result: ${ok?'PASS':'FAIL'}`);
for(const [k,v] of Object.entries(stats))console.log(`${k}: ${v}`);
console.log(`Errors: ${errors.length}`);for(const e of errors)console.log(`- ${e}`);
if(!ok)process.exit(1);
