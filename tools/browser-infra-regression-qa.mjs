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

const ok=!errors.length;
console.log('BatchMath browser-infrastructure regression QA');
console.log(`Result: ${ok?'PASS':'FAIL'}`);
for(const [k,v] of Object.entries(stats))console.log(`${k}: ${v}`);
console.log(`Errors: ${errors.length}`);for(const e of errors)console.log(`- ${e}`);
if(!ok)process.exit(1);
