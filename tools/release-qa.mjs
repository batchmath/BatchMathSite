#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const SITE_ORIGIN='https://batchmath.net';
const errors=[]; const warnings=[]; const stats={};
const fail=(msg)=>errors.push(msg); const warn=(msg)=>warnings.push(msg);
const norm=p=>p.split(path.sep).join('/');

function walk(dir){
  const out=[];
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','qa-results'].includes(e.name)) continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory()) out.push(...walk(full)); else out.push(full);
  }
  return out;
}
const all=walk(ROOT);
const siteFiles=all.filter(f=>!norm(path.relative(ROOT,f)).startsWith('.github/')&&!norm(path.relative(ROOT,f)).startsWith('tools/'));
const htmlFiles=siteFiles.filter(f=>f.endsWith('.html'));
const jsFiles=siteFiles.filter(f=>f.endsWith('.js'));
stats.htmlPages=htmlFiles.length; stats.standaloneJs=jsFiles.length;

function attr(tag,name){const m=tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`,'i'));return m?m[1]:'';}
function meta(html,name){for(const m of html.matchAll(/<meta\b[^>]*>/gi)){const t=m[0];if(attr(t,'name').toLowerCase()===name.toLowerCase()||attr(t,'property').toLowerCase()===name.toLowerCase())return attr(t,'content');}return '';}
function linkRel(html,rel){for(const m of html.matchAll(/<link\b[^>]*>/gi)){const t=m[0];if(attr(t,'rel').toLowerCase().split(/\s+/).includes(rel.toLowerCase()))return attr(t,'href');}return '';}
function title(html){return (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/\s+/g,' ').trim();}
function countTag(html,tag){return [...html.matchAll(new RegExp(`<${tag}\\b`,'gi'))].length;}
function noindex(html){return /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)||/<meta\b[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(html);}
function routeForFile(f){let rel=norm(path.relative(ROOT,f));if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return '/'+rel.slice(0,-10);return '/'+rel;}
function expectedCanonical(f){return SITE_ORIGIN+routeForFile(f);}

const indexable=[]; const titles=new Map(), descriptions=new Map(), canonicals=new Map();
let gaCount=0, inlineJsCount=0, internalRefCount=0, brokenRefs=0, imageCount=0;
const refs=[];
for(const f of htmlFiles){
  const rel=norm(path.relative(ROOT,f)); const html=fs.readFileSync(f,'utf8'); const isNoindex=noindex(html);
  if(!isNoindex) indexable.push(f);
  if(html.includes('G-377MTFXSF3')) gaCount++; else if(!isNoindex) fail(`${rel}: missing GA4 tag on indexable page`);
  const t=title(html), d=meta(html,'description'), c=linkRel(html,'canonical');
  if(!t) fail(`${rel}: missing title`);
  if(countTag(html,'h1')!==1) fail(`${rel}: expected exactly one H1, found ${countTag(html,'h1')}`);
  for(const im of html.matchAll(/<img\b[^>]*>/gi)){imageCount++;if(!/\balt\s*=/.test(im[0]))fail(`${rel}: image missing alt attribute`);}
  if(!isNoindex){
    if(!d) fail(`${rel}: missing meta description`);
    if(!c) fail(`${rel}: missing canonical`); else if(c!==expectedCanonical(f)) fail(`${rel}: canonical ${c} != ${expectedCanonical(f)}`);
    for(const key of ['og:title','og:description','og:url']) if(!meta(html,key)) fail(`${rel}: missing ${key}`);
    for(const [map,value,label] of [[titles,t,'title'],[descriptions,d,'description'],[canonicals,c,'canonical']]){
      if(value){if(map.has(value))fail(`${rel}: duplicate ${label} also used by ${map.get(value)}`);else map.set(value,rel);}
    }
  }
  // Inline JS syntax. Skip external scripts and non-JS script types.
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    const attrs=m[1]||'', code=m[2]||'';
    if(/\bsrc\s*=/.test(attrs)) continue;
    const typ=(attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]||'').toLowerCase();
    if(typ && !['text/javascript','application/javascript','module'].includes(typ)) continue;
    if(!code.trim()) continue; inlineJsCount++;
    try{new vm.Script(code,{filename:`${rel}:inline`});}catch(e){fail(`${rel}: inline JS syntax error: ${e.message}`);}
  }
  // Internal href/src references.
  for(const m of html.matchAll(/\b(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi)) refs.push({from:f,rel,url:m[1]});
}
stats.gaTagged=gaCount; stats.inlineJs=inlineJsCount; stats.images=imageCount;

for(const f of jsFiles){const rel=norm(path.relative(ROOT,f));const code=fs.readFileSync(f,'utf8');try{new vm.Script(code,{filename:rel});}catch(e){fail(`${rel}: JS syntax error: ${e.message}`);}}

function resolveInternal(from,url){
  if(!url||url.startsWith('#')||/^(?:https?:|mailto:|tel:|data:|javascript:|blob:)/i.test(url))return null;
  let clean=url.split('#')[0].split('?')[0]; if(!clean)return null;
  try{clean=decodeURIComponent(clean);}catch{}
  let target=clean.startsWith('/')?path.join(ROOT,clean.replace(/^\/+/,'')):path.resolve(path.dirname(from),clean);
  if(clean.endsWith('/')) target=path.join(target,'index.html');
  else if(fs.existsSync(target)&&fs.statSync(target).isDirectory()) target=path.join(target,'index.html');
  return target;
}
for(const r of refs){const target=resolveInternal(r.from,r.url);if(!target)continue;internalRefCount++;if(!fs.existsSync(target)){brokenRefs++;fail(`${r.rel}: broken internal reference ${r.url}`);}}
stats.internalReferences=internalRefCount;stats.brokenInternalReferences=brokenRefs;

// Sitemap must exactly equal indexable canonical set.
const sitemapPath=path.join(ROOT,'sitemap.xml');
const sitemap=fs.readFileSync(sitemapPath,'utf8');
const sitemapUrls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].trim());
const canonicalSet=new Set(indexable.map(expectedCanonical)); const sitemapSet=new Set(sitemapUrls);
for(const u of canonicalSet)if(!sitemapSet.has(u))fail(`sitemap missing ${u}`);
for(const u of sitemapSet)if(!canonicalSet.has(u))fail(`sitemap contains non-indexable/unknown URL ${u}`);
stats.indexablePages=indexable.length; stats.sitemapUrls=sitemapUrls.length; stats.noindexPages=htmlFiles.length-indexable.length;

// Version agreement.
const app=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/app-version.json'),'utf8'));const version=app.version;
const versionFiles=['assets/pwa.js','assets/problem-tracking.js','sw.js'];
for(const rel of versionFiles){const s=fs.readFileSync(path.join(ROOT,rel),'utf8');if(!s.includes(version))fail(`${rel}: does not contain app version ${version}`);}
if(app.release!==`v${version}`)fail(`app-version.json release ${app.release} != v${version}`);
stats.version=version;

// Future-proof answer equivalence: every practice route must load the shared
// answer normalizer, even before/independent of analytics instrumentation.
for(const f of htmlFiles){
  const rel=norm(path.relative(ROOT,f));
  if(!/(?:\/practice\/|\/assignment-practice\/)/.test('/'+rel))continue;
  const html=fs.readFileSync(f,'utf8');
  if(!html.includes('/assets/answer-normalization.js'))fail(`${rel}: practice route missing sitewide answer-normalization.js`);
}

// Every analytics engine must also load reproducible RNG, before tracking/config.
const engines=[];
for(const f of htmlFiles){const html=fs.readFileSync(f,'utf8');if(!html.includes('problem-tracking.js'))continue;const rel=norm(path.relative(ROOT,f));const m=html.match(/window\.BM_ANALYTICS_CONFIG=\{course:"([^"]+)",engineId:"([^"]+)",generatorVersion:"([^"]+)"\}/);if(!m){fail(`${rel}: analytics engine config not parsed`);continue;}const seedPos=html.indexOf('/assets/reproducible-rng.js'), trackPos=html.indexOf('/assets/problem-tracking.js'), answerPos=html.indexOf('/assets/answer-normalization.js');if(seedPos<0)fail(`${rel}: missing reproducible-rng.js`);else if(seedPos>trackPos)fail(`${rel}: reproducible-rng.js must load before problem tracking`);if(answerPos<0)fail(`${rel}: missing answer-normalization.js`);else if(answerPos>trackPos)fail(`${rel}: answer-normalization.js must load before problem tracking`);engines.push({rel,course:m[1],engineId:m[2],generatorVersion:m[3]});}
const ids=engines.map(x=>x.engineId);if(new Set(ids).size!==ids.length)fail('duplicate analytics engineId detected');
if(engines.length!==89)fail(`expected 89 instrumented engines, found ${engines.length}`);stats.practiceEngines=engines.length;


// Generator randomness must use the dedicated seeded RNG, never raw Math.random.
for(const f of [...htmlFiles,...jsFiles]){
  const rel=norm(path.relative(ROOT,f));
  if(rel==='assets/reproducible-rng.js') continue;
  const s=fs.readFileSync(f,'utf8');
  if(s.includes('Math.random')) fail(`${rel}: raw Math.random remains; use BatchMathRNG.random for reproducibility`);
}

// Guard against the v10.5.0 Limits sign-cleanup regression. Pulling only the
// leading minus from a multi-term denominator changes expressions such as
// (-4x-5) into -(4x-5). Only constant negative denominators may be normalized.
const unsafeNegativeDenominatorCleanup=String.raw`out=out.replace(/\\frac\{([^{}]+)\}\{-([^{}]+)\}/g`;
for(const f of siteFiles.filter(f=>/\.(?:html|js)$/.test(f))){
  const src=fs.readFileSync(f,'utf8');
  if(src.includes(unsafeNegativeDenominatorCleanup))fail(`${norm(path.relative(ROOT,f))}: unsafe multi-term negative-denominator cleanup detected`);
}

// MathJax must be pinned, never floating @4.
let mathjaxRefs=0;
for(const f of siteFiles.filter(f=>/\.(?:html|js)$/.test(f))){const s=fs.readFileSync(f,'utf8');for(const m of s.matchAll(/https:\/\/cdn\.jsdelivr\.net\/npm\/mathjax@([^/"']+)/g)){mathjaxRefs++;if(m[1]!=='4.1.3')fail(`${norm(path.relative(ROOT,f))}: MathJax version ${m[1]} is not pinned to 4.1.3`);}}
stats.mathjaxRefs=mathjaxRefs;

// FRQ data invariants.
const frqFile=path.join(ROOT,'ap-calculus/ap-test-preparation/free-response-questions/frq-data.js');
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(frqFile,'utf8'),sandbox,{filename:'frq-data.js'});const frq=sandbox.window.BATCHMATH_FRQ_DATA;
if(!frq?.rows||!frq?.examLinks)fail('FRQ data missing rows/examLinks');else{
  const rows=frq.rows, examEntries=Object.entries(frq.examLinks), videos=rows.filter(r=>r.video).map(r=>r.video);
  if(rows.length!==228)fail(`FRQ rows ${rows.length} != 228`);if(examEntries.length!==38)fail(`FRQ exam sets ${examEntries.length} != 38`);if(new Set(videos).size!==videos.length)fail('FRQ video URLs are not unique');if(videos.length!==216)fail(`FRQ video count ${videos.length} != 216`);
  for(const [key,e] of examEntries){if(!e.frq)fail(`${key}: missing FRQ URL`);if(key!=='2026|Regular'&&!e.scoring)fail(`${key}: missing scoring URL`);if(!Array.isArray(e.frqPages)||e.frqPages.length!==6)fail(`${key}: FRQ page map incomplete`);if(e.scoring&&(!Array.isArray(e.scoringPages)||e.scoringPages.length!==6))fail(`${key}: scoring page map incomplete`);}
  stats.frqRows=rows.length;stats.frqExamSets=examEntries.length;stats.frqVideos=videos.length;
}

// Basic package integrity for documents.
const pdfs=siteFiles.filter(f=>f.toLowerCase().endsWith('.pdf'));const docx=siteFiles.filter(f=>f.toLowerCase().endsWith('.docx'));
for(const f of pdfs){const b=fs.readFileSync(f,{encoding:null,flag:'r'}).subarray(0,5).toString('ascii');if(b!=='%PDF-')fail(`${norm(path.relative(ROOT,f))}: invalid PDF header`);}
for(const f of docx){const b=fs.readFileSync(f).subarray(0,2).toString('ascii');if(b!=='PK')fail(`${norm(path.relative(ROOT,f))}: invalid DOCX/ZIP header`);}
stats.pdfFiles=pdfs.length;stats.docxFiles=docx.length;

// Production-string hygiene.
let identifyingHits=0;
const forbiddenIdentityTerms=[['Open','AI'].join(''),['Chat','GPT'].join('')];
for(const f of siteFiles.filter(f=>/\.(?:html|js|css|json|xml|txt|md|webmanifest)$/i.test(f))){const s=fs.readFileSync(f,'utf8');for(const term of forbiddenIdentityTerms){if(s.toLowerCase().includes(term.toLowerCase())){identifyingHits++;fail(`${norm(path.relative(ROOT,f))}: contains a forbidden assistant/vendor identifying string`);break;}}}
stats.identifyingStringHits=identifyingHits;

// Execute the actual reproducible RNG runtime in a minimal sandbox and verify determinism.
function rngSequence(seed){
  const listeners={};
  const fakeDocument={readyState:'loading',addEventListener:(n,fn)=>{listeners[n]=fn;},getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,head:{appendChild(){}},body:null};
  const fakeWindow={location:{search:`?bm_seed=${encodeURIComponent(seed)}`},BM_ANALYTICS_CONFIG:{course:'qa',engineId:'qa_engine',generatorVersion:'1'}};
  const sb={window:fakeWindow,document:fakeDocument,URLSearchParams,crypto:{getRandomValues:a=>{a[0]=123456789;return a;}},performance:{now:()=>0},navigator:{userAgent:'BatchMath-QA'},location:{pathname:'/qa/'},console};
  vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/reproducible-rng.js'),'utf8'),sb,{filename:'reproducible-rng.js'});
  return Array.from({length:12},()=>sb.window.BatchMathRNG.random());
}
const seqA=rngSequence('repeatable-seed'),seqB=rngSequence('repeatable-seed'),seqC=rngSequence('different-seed');
if(JSON.stringify(seqA)!==JSON.stringify(seqB))fail('reproducible RNG: same seed does not reproduce same sequence');
if(JSON.stringify(seqA)===JSON.stringify(seqC))fail('reproducible RNG: different seeds produced identical sequence');
if(seqA.some(x=>!(x>=0&&x<1)))fail('reproducible RNG: value outside [0,1)');
stats.seededRngUnitTest='pass';

// Diagnostics and reproducibility feature assertions.
const diag=fs.readFileSync(path.join(ROOT,'diagnostics/index.html'),'utf8');if(!noindex(diag))fail('diagnostics page must remain noindex');
const rng=fs.readFileSync(path.join(ROOT,'assets/reproducible-rng.js'),'utf8');for(const needle of ['window.BatchMathRNG','Report a Problem','noteProblem(problem)','bm_seed'])if(!rng.includes(needle))fail(`reproducible-rng.js missing ${needle}`);

const report={ok:errors.length===0,generatedAt:new Date().toISOString(),stats,warnings,errors,engines};
const outDir=path.join(ROOT,'qa-results');fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,'release-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=[`BatchMath ${version} automated release QA`,`Result: ${report.ok?'PASS':'FAIL'}`,'',...Object.entries(stats).map(([k,v])=>`${k}: ${v}`),'',`Warnings: ${warnings.length}`,...warnings.map(x=>`- ${x}`),'',`Errors: ${errors.length}`,...errors.map(x=>`- ${x}`),''];fs.writeFileSync(path.join(outDir,'release-qa.txt'),lines.join('\n'));
console.log(lines.join('\n'));if(errors.length)process.exit(1);
