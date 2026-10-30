// v12.8.W Unit 5 release QA without a browser: every engine's generation and answer checks, the slope-field
// grading cases, the independent Rate, Motion, Growth and Slope Fields recomputations, the Comprehensive Review
// distribution audit, and the keypad audit (every key an answer needs is on its keypad).
// The SymPy check of Basic and Separable is separate (npm run qa:unit5-sympy; needs Python with sympy).
// Usage: node tools/unit5-qa.mjs [scale=1]   (scale multiplies the sample sizes)
import {spawnSync} from 'node:child_process';import fs from 'node:fs';
const scale=Number(process.argv[2]||1),n=k=>String(Math.max(50,Math.round(k*scale)));
const QA='tools/review-lab/unit5/qa/';
const runs=[
 ['Basic generation and answers',[QA+'smoke.mjs','basic-first-order-differential-equations','unit5-basic.js',n(1500)]],
 ['Motion generation and answers',[QA+'smoke.mjs','motion-problems','unit5-motion.js',n(1500)]],
 ['Slope Fields generation and answers',[QA+'smoke.mjs','slope-fields','unit5-slope-fields.js',n(1500)]],
 ['Separable generation and answers',[QA+'smoke.mjs','separable-differential-equations','unit5-separable.js',n(1500)]],
 ['Growth generation and answers',[QA+'smoke.mjs','exponential-growth-and-decay-interest-newton-s-law-of-cooling','unit5-growth.js',n(1500)]],
 ['Rate generation and answers',[QA+'smoke.mjs','rate-problems','unit5-rate.js',n(1500)]],
 ['Slope-field grading cases',[QA+'slope-qa.mjs',n(600)]],
 ['Rate independent recomputation',[QA+'verify-rate.mjs',n(800)]],
 ['Motion independent recomputation',[QA+'verify-motion.mjs',n(400)]],
 ['Growth independent recomputation',[QA+'verify-growth.mjs',n(1500)]],
 ['Slope Fields independent recomputation',[QA+'verify-slope.mjs',n(600)]],
 ['Comprehensive Review audit',[QA+'review-audit.mjs',n(4000)]],
 ['Keypad coverage audit',[QA+'keypad-audit.mjs',n(1000)]],
 ['Rounding matrix (v12.8.X)',[QA+'rounding.mjs',n(400)]],
];
// tools/review-lab is developer-only and left out of the site package (export-ignore); skip there
if(!fs.existsSync(QA+'smoke.mjs')){console.log('Unit 5 QA scripts live in tools/review-lab, which the site package leaves out; skipped.');process.exit(0);}
let failed=0;
for(const [name,args] of runs){const r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:64*1024*1024});
 const out=(r.stdout||'')+(r.stderr||'');const smokeFail=/parts \d+ fails (\d+)/.exec(out);
 const ok=r.status===0&&(!smokeFail||smokeFail[1]==='0');if(!ok)failed++;
 const summary=out.trim().split('\n').filter(l=>/fails|issues|disagreements|failed|FAIL|chi-square|topics|difficulty|checks|recomputed|checked|keypad|MISSING|rounding/.test(l)).slice(0,4).join(' | ');
 console.log(`${ok?'PASS':'FAIL'}  ${name}${summary?`: ${summary}`:''}`);if(!ok)console.log(out.split('\n').slice(-12).join('\n'));}
console.log(failed?`${failed} Unit 5 check(s) failed`:'All Unit 5 checks passed');process.exitCode=failed?1:0;
