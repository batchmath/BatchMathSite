#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const errors=[];const warnings=[];const stats={};
const norm=p=>p.split(path.sep).join('/');
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','qa-results'].includes(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else out.push(f)}return out}
const files=walk(ROOT).filter(f=>/\.(?:html|js)$/.test(f));
const engineFiles=files.filter(f=>f.endsWith('.html')&&fs.readFileSync(f,'utf8').includes('problem-tracking.js'));
stats.practiceEngines=engineFiles.length;

// TeX commands inside JavaScript string/template literals must escape the backslash.
// A source token like `x\lt 0` inside JS loses the backslash at runtime and displays
// as `xlt 0`.  Strict inequalities previously exposed this exact failure class.
const badStrictIneqSource=/(?<!\\)\\(?:lt|gt)\b/g;
let strictIneqEscapingHits=0;
for(const f of files){
  const rel=norm(path.relative(ROOT,f));const src=fs.readFileSync(f,'utf8');
  const chunks=f.endsWith('.js')?[src]:[...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!/\bsrc\s*=/.test(m[1])).map(m=>m[2]);
  for(const chunk of chunks){for(const m of chunk.matchAll(badStrictIneqSource)){strictIneqEscapingHits++;errors.push(`${rel}: unescaped TeX strict-inequality command in JavaScript source: ${m[0]}`);}}
}
stats.unescapedStrictInequalityCommands=strictIneqEscapingHits;

// A generated problem object should be immutable with respect to its mathematical
// question after the answer has been computed. The only current exception is the
// audited Limits cleanSigns pass, whose permitted rewrites are algebraically exact.
const approvedMutators=new Set([
  'ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html',
  'ap-calculus/unit-1-limits-continuity/topics/limits-of-continuous-functions/practice/index.html',
  'ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/practice/index.html',
  'ap-calculus/unit-1-limits-continuity/topics/one-sided-limits/practice/index.html',
  'ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/practice/index.html'
]);
const mutationRe=/\b([A-Za-z_$][\w$]*)\.(q|question|questionHTML|tex|math|prompt)\s*=\s*([A-Za-z_$][\w$]*)\(\1\.\2\)\s*;/g;
let mutations=0;
for(const f of files){
  const rel=norm(path.relative(ROOT,f));const src=fs.readFileSync(f,'utf8');
  for(const m of src.matchAll(mutationRe)){
    mutations++;
    const field=m[2],fn=m[3];
    if(!(approvedMutators.has(rel)&&field==='q'&&fn==='cleanSigns'))errors.push(`${rel}: unaudited post-generation math mutation ${m[0]}`);
  }
}
stats.postGenerationMathMutations=mutations;
if(mutations!==approvedMutators.size)errors.push(`expected ${approvedMutators.size} audited post-generation math mutations, found ${mutations}`);

// Explicitly reject the v10.5.0 bug pattern everywhere, not only in Limits.
// This pattern pulls a leading minus out of an arbitrary multi-term denominator
// without negating every remaining term.
const unsafePatterns=[
  {label:'arbitrary negative denominator rewrite',re:/replace\(\/\\\\frac\\\{\(\[\^\{\}\]\+\)\\\}\\\{\-\(\[\^\{\}\]\+\)\\\}\/g/},
  {label:'generic braced negative denominator capture',re:/\\frac\\\{\(\[\^\{\}\]\+\)\\\}\\\{\-\(\[\^\{\}\]\+\)\\\}/}
];
// Direct string check is more reliable than trying to parse the regex literal.
const unsafeLiteral=String.raw`out=out.replace(/\\frac\{([^{}]+)\}\{-([^{}]+)\}/g`;
for(const f of files){const rel=norm(path.relative(ROOT,f));const src=fs.readFileSync(f,'utf8');if(src.includes(unsafeLiteral))errors.push(`${rel}: unsafe multi-term negative-denominator cleanup detected`);}

// Verify the five audited cleanSigns copies all use the safe constant-only rule.
let cleanCopies=0;let referenceBody=null;
for(const rel of approvedMutators){
  const src=fs.readFileSync(path.join(ROOT,rel),'utf8');
  const m=src.match(/const cleanSigns=s=>\{([\s\S]*?)\n\s*\};\n\s*const approach=/);
  if(!m){errors.push(`${rel}: cleanSigns definition not found`);continue;}
  cleanCopies++;const body=m[1].replace(/\s+/g,' ').trim();
  if(!body.includes(String.raw`\\frac1\{-([0-9]+)\}`))errors.push(`${rel}: cleanSigns missing constant negative reciprocal normalization`);
  if(!body.includes(String.raw`\\frac\{([^{}]+)\}\{-([0-9]+)\}`))errors.push(`${rel}: cleanSigns denominator normalization is not restricted to numeric constants`);
  if(body.includes(String.raw`\\frac\{([^{}]+)\}\{-([^{}]+)\}`))errors.push(`${rel}: cleanSigns contains unsafe arbitrary denominator normalization`);
  if(referenceBody===null)referenceBody=body;else if(body!==referenceBody)errors.push(`${rel}: cleanSigns differs from the audited Limits reference copy`);
}
stats.auditedCleanSignsCopies=cleanCopies;

// Rendering helpers outside Limits are permitted only to convert notation/markup,
// not algebra. These are source-level invariants that make a later risky rewrite
// fail visibly in QA instead of silently changing a student's problem.
const im1Display=fs.readFileSync(path.join(ROOT,'assets/im1-display-math.js'),'utf8');
if(/replace\([^\n]*(?:--|\\\+\\s\*|-\\s\*-)/.test(im1Display))errors.push('assets/im1-display-math.js: algebra-changing sign rewrite detected');
const prepCommon=fs.readFileSync(path.join(ROOT,'assets/calc-prep-common.js'),'utf8');
if(prepCommon.includes(unsafeLiteral))errors.push('assets/calc-prep-common.js: unsafe denominator rewrite detected');

// Every practice engine is included in this audit; any future post-generation
// mutation must be explicitly added to the audited allowlist above.
stats.engineFilesAudited=engineFiles.length;
stats.sourceFilesAudited=files.length;
const report={ok:errors.length===0,generatedAt:new Date().toISOString(),stats,warnings,errors};
fs.writeFileSync(path.join(OUT,'display-safety-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath sitewide display-safety QA',`Result: ${report.ok?'PASS':'FAIL'}`,...Object.entries(stats).map(([k,v])=>`${k}: ${v}`),`Warnings: ${warnings.length}`,...warnings.map(x=>`- ${x}`),`Errors: ${errors.length}`,...errors.map(x=>`- ${x}`),''];
fs.writeFileSync(path.join(OUT,'display-safety-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
