#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const unit=path.join(root,'im1/unit-3-linear-equation');
const errors=[];const fail=m=>errors.push(m);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(unit),html=files.filter(f=>f.endsWith('.html')),pdfs=files.filter(f=>f.endsWith('.pdf'));
const practices=html.filter(f=>f.endsWith('/practice/index.html'));
if(practices.length!==23)fail(`expected 23 practice engines, found ${practices.length}`);
if(pdfs.length!==46)fail(`expected 46 Unit 3 PDFs, found ${pdfs.length}`);
if(files.some(f=>/\.docx$/i.test(f)))fail('Unit 3 contains a DOCX file');
if(files.some(f=>/(?:^|\/)tests?(?:\/|$)/i.test(f)))fail('Unit 3 contains a Tests folder/file');
const unitHtml=fs.readFileSync(path.join(unit,'index.html'),'utf8');
if(!unitHtml.includes('>A. Arithmetic Sequences</a>'))fail('category A does not use the exact requested title');
for(const file of practices){
 const page=fs.readFileSync(file,'utf8'),rel=path.relative(root,file);
 for(const asset of ['im1-unit3-generators.js','im1-unit3-practice.js','im1-keypad.js','im1-keypad.css','answer-normalization.js'])if(!page.includes(asset))fail(`${rel}: missing ${asset}`);
 if(page.includes('<select')&&(!page.includes('bm-practice-select')||!page.includes('>Practice Type</label>')))fail(`${rel}: practice selector is not standardized`);
}
const sandbox={window:{},Math};sandbox.window.window=sandbox.window;sandbox.window.BatchMathRNG={random:Math.random};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'assets/im1-unit3-generators.js'),'utf8'),sandbox);
const api=sandbox.window.BatchMathIM1Unit3Generators,slugs=api?.list?.()||[];
if(slugs.length!==23)fail(`expected 23 registered generators, found ${slugs.length}`);
let generated=0;
for(const slug of slugs){
 const generator=api.get(slug);if(typeof generator!=='function'){fail(`${slug}: missing generator`);continue;}
 for(let i=0;i<400;i++){
  const p=generator({mode:'mixed'});generated++;
  if(!p?.id||!p.q||!p.explain)fail(`${slug}: malformed problem`);
  if(p?.kind==='mc'&&(!Array.isArray(p.choices)||p.correctIndex<0||p.correctIndex>=p.choices.length))fail(`${slug}: invalid choices`);
  if(p?.kind==='input'&&!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:\/-?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(p.answer))fail(`${slug}: invalid numeric answer ${p.answer}`);
  if(p?.kind==='formula'&&(!Number.isFinite(p.formula?.a)||!Number.isFinite(p.formula?.d)))fail(`${slug}: invalid formula target`);
  if(p?.kind==='multi'&&(!Array.isArray(p.fields)||!p.fields.length||p.fields.some(field=>!['number','formula'].includes(field.check))))fail(`${slug}: invalid structured fields`);
 }
}
for(const slug of ['common-difference-next-terms','explicit-formulas-arithmetic-sequences','arithmetic-sequence-word-problems']){
 for(let i=0;i<200;i++)if(api.get(slug)().kind==='mc')fail(`${slug}: old multiple-choice problem remains`);
}
for(const [section,lessons] of Object.entries(api.sections||{}))for(const lesson of lessons){const p=api.get(`section-${section}-review`)({mode:lesson});if(!p?.id)fail(`section ${section} focus ${lesson} failed`);}
const report={ok:errors.length===0,practiceEngines:practices.length,pdfs:pdfs.length,generatedProblems:generated,errors};
fs.mkdirSync(path.join(root,'qa-results'),{recursive:true});fs.writeFileSync(path.join(root,'qa-results/im1-unit3-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(`IM1 Unit 3 QA: ${report.ok?'PASS':'FAIL'}\nPractice engines: ${report.practiceEngines}\nPDFs: ${report.pdfs}\nGenerated problems checked: ${generated}\nErrors: ${errors.length}`);for(const e of errors)console.log(`- ${e}`);if(errors.length)process.exit(1);
