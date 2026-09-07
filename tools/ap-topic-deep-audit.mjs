#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const PER_TOPIC=Math.max(250,Number(process.env.BM_QA_TOPIC_DEEP||2000));
const REVIEW_COUNT=Math.max(4,Number(process.env.BM_QA_REVIEW_SAMPLES||10));
const errors=[],warnings=[],records=[];

function hashSeed(value){let h=2166136261>>>0;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}h+=h<<13;h^=h>>>7;h+=h<<3;h^=h>>>17;h+=h<<5;return h>>>0;}
function rng(seed){let s=hashSeed(seed)||0x6d2b79f5;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function walk(dir){let out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out=out.concat(walk(p));else out.push(p);}return out;}
function stripHtml(s){return String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&rsquo;/g,"'").replace(/&ndash;/g,'-').replace(/\s+/g,' ').trim();}
function unitName(rel){const u=rel.split('/')[0];const m=u.match(/^unit-(\d+)-(.+)$/);return m?`Unit ${m[1]} - ${m[2].replace(/-/g,' ')}`:u;}
function titleFrom(html,slug){const m=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);return m?stripHtml(m[1]).replace(/\s+Practice$/i,''):slug.replace(/-/g,' ');}
function engineId(html){return (html.match(/engineId\s*:\s*["']([^"']+)/)||[])[1]||'';}
function selectedCategory(html){const m=html.match(/<select[^>]*id=["']category["'][^>]*>([\s\S]*?)<\/select>/i);if(!m)return '';return (m[1].match(/<option\s+value="([^"]+)"\s+selected/i)||m[1].match(/<option\s+selected\s+value="([^"]+)"/i)||[])[1]||'';}
function topicSlug(html,folder){return (html.match(/BM_TOPIC_PRACTICE\s*=\s*\{\s*slug\s*:\s*"([^"]+)"/)||[])[1]||folder;}
function inlineScripts(html){return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!(/\bsrc\s*=/.test(m[1]))).map(m=>m[2]);}
function elem(value=''){return {value,innerHTML:'',textContent:'',className:'',disabled:false,placeholder:'',style:{display:''},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},focus(){},classList:{add(){},remove(){},contains(){return false;},toggle(){}}};}
function normalizedChoice(x){return String(x??'').trim().replace(/\s+/g,' ');}
function malformedText(p){
  const text=[p?.questionHtml,p?.q,p?.question,...(Array.isArray(p?.choices)?p.choices:[])].filter(Boolean).join(' ');
  if(/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text))return 'control character in displayed math';
  if(/(^|[^\\A-Za-z])(?:qquad|displaystyle|frac\{|sqrt\{|sum_|lim_|infty\b|right\))/i.test(text))return 'likely dropped TeX backslash in displayed math';
  if(/(?:^|[^\^])--|\+\s*-/.test(text))return 'malformed sign sequence';
  if(/\b(?:NaN|undefined)\b/.test(text))return 'NaN/undefined in displayed content';
  return '';
}
function structuralFingerprint(p){
  let s=String(p?.questionHtml||p?.q||p?.question||p?.math||p?.tex||'');
  s=stripHtml(s).toLowerCase().replace(/\\[a-z]+/g,m=>m).replace(/-?\d+(?:\.\d+)?/g,'#').replace(/\s+/g,' ').trim();
  return s;
}
function inspectProblem(p,topicLabel,index){
  if(!p||typeof p!=='object'){errors.push(`${topicLabel} #${index}: non-object problem`);return;}
  const id=String(p.id||p.key||'').trim();if(!id)errors.push(`${topicLabel} #${index}: missing id/key`);
  if(Array.isArray(p.choices)){
    if(p.choices.length!==4)errors.push(`${topicLabel} #${index} ${id}: expected 4 choices, got ${p.choices.length}`);
    const n=p.choices.map(normalizedChoice);if(new Set(n).size!==n.length)errors.push(`${topicLabel} #${index} ${id}: visually duplicate choices ${JSON.stringify(p.choices)}`);
    if(Number.isInteger(p.correctIndex)&&(p.correctIndex<0||p.correctIndex>=p.choices.length))errors.push(`${topicLabel} #${index} ${id}: invalid correctIndex`);
  }
  const bad=malformedText(p);if(bad)errors.push(`${topicLabel} #${index} ${id}: ${bad}`);
}
function selectReviewSamples(problems,count=4){const out=[],seenVariants=new Set(),seenIds=new Set();for(const p of problems){const v=String(p.variant||p.problemVariant||p.cat||p.kind||'unspecified'),id=String(p.id||p.key||'');if(!seenVariants.has(v)&&!seenIds.has(id)){out.push(structuredClone(p));seenVariants.add(v);seenIds.add(id);if(out.length===count)return out}}for(const p of problems){const id=String(p.id||p.key||'');if(!seenIds.has(id)){out.push(structuredClone(p));seenIds.add(id);if(out.length===count)break}}return out;}
function summarize(record,problems){
  const ids=problems.map(p=>String(p.id||p.key||''));
  const unique=new Set(ids);let immediate=0;for(let i=1;i<ids.length;i++)if(ids[i]===ids[i-1])immediate++;
  const variants={};for(const p of problems){const v=String(p.variant||p.problemVariant||p.cat||p.kind||'unspecified');variants[v]=(variants[v]||0)+1;}
  const ranked=Object.entries(variants).sort((a,b)=>b[1]-a[1]);
  record.samples=problems.length;record.uniqueIds=unique.size;record.rawImmediateRepeatRate=problems.length>1?immediate/(problems.length-1):0;record.variants=Object.fromEntries(ranked);
  record.variantCount=ranked.length;record.dominantVariant=ranked[0]?.[0]||'';record.dominantVariantShare=ranked[0]?ranked[0][1]/problems.length:0;
  if(problems.length>=500&&unique.size<20)warnings.push(`${record.title}: only ${unique.size} unique problem IDs in ${problems.length} raw samples; UI anti-repeat mitigates short-window repeats but content space is narrow.`);
  if(record.rawImmediateRepeatRate>.08)warnings.push(`${record.title}: raw immediate-repeat rate ${(100*record.rawImmediateRepeatRate).toFixed(1)}%; UI recent-ID protection should prevent visible short-window repeats.`);
}

const topicFiles=walk(path.join(ROOT,'ap-calculus')).filter(f=>/[/\\]topics[/\\][^/\\]+[/\\]practice[/\\]index\.html$/.test(f)&&!/[/\\](?:comprehensive-review|semester-1-review)[/\\]practice[/\\]index\.html$/.test(f)).sort();
if(topicFiles.length!==51)errors.push(`Expected exactly 51 individual AP topic practice pages, found ${topicFiles.length}`);

const sharedSource=fs.readFileSync(path.join(ROOT,'assets/ap-topic-generators.js'),'utf8');
const sharedBox={window:{},console};vm.createContext(sharedBox);vm.runInContext(sharedSource,sharedBox,{filename:'ap-topic-generators.js'});

function sampleShared(slug,seedBase){const gen=sharedBox.window.BatchMathAPTopicGenerators?.get(slug);if(typeof gen!=='function')throw new Error(`shared generator ${slug} missing`);const out=[];for(let i=0;i<PER_TOPIC;i++){sharedBox.window.BatchMathRNG={random:rng(`${seedBase}:${i}`)};out.push(structuredClone(gen()));}return out;}
function sampleFiltered(html,category,seedBase){
  const code=inlineScripts(html).find(s=>s.includes('function makeProblem')&&s.includes('const generators=')&&s.includes('problemGenerated'));
  if(!code)throw new Error('filtered comprehensive generator script not found');
  const generated=[],elements={category:elem(category),question:elem(),answer:elem(),submit:elem(),next:elem(),feedback:elem(),'topic-name':elem(),'correct-count':elem('0'),attempted:elem('0')};
  const listeners={};const random=rng(seedBase);
  const fakeDocument={getElementById:id=>elements[id]||(elements[id]=elem()),addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};
  const BMAnalytics={ensurePracticeStarted(){},problemGenerated(p){generated.push(structuredClone(p));},answerChecked(){},solutionRevealed(){}};
  const window={BMAnalytics,MathJax:null,addEventListener:(t,fn)=>{listeners[t]=fn;},BatchMathCalculusKeypad:null};
  const sb={window,document:fakeDocument,BatchMathRNG:{random},console,Math,structuredClone,setTimeout:()=>0,clearTimeout:()=>{},location:{},navigator:{}};vm.createContext(sb);vm.runInContext(code,sb,{timeout:8000});if(listeners.load)listeners.load();
  const next=elements.next.listeners.click;if(typeof next!=='function')throw new Error('Next Question handler missing');while(generated.length<PER_TOPIC)next();return generated.slice(0,PER_TOPIC);
}
function evalDefs(file,needle,cut,expose,seed){const html=fs.readFileSync(file,'utf8');const code=inlineScripts(html).find(x=>x.includes(needle));if(!code)throw Error(`script containing ${needle} not found`);let body=code;const i=body.indexOf(cut);if(i<0)throw Error(`cut ${cut} not found`);body=body.slice(0,i)+`\n;globalThis.QA={${expose.join(',')}};\n`;body=body.replace(/^\s*\(function\(\)\{\s*['"]use strict['"];?/,'').replace(/^\s*\(\(\) => \{\s*['"]use strict['"];?/,'');const sb={console,BatchMathRNG:{random:rng(seed)},window:{},document:{getElementById(){return null}}};vm.createContext(sb);vm.runInContext(body,sb,{filename:path.basename(file)});return sb;}
function sampleSpecial(file,id,seedBase){
  if(id==='ap_limit_proofs'){const sb=evalDefs(file,'function ed()','function make()',['ed','dm','ne','nm'],seedBase);const out=[];for(let i=0;i<Math.ceil(PER_TOPIC/4);i++){sb.BatchMathRNG.random=rng(`${seedBase}:${i}`);for(const n of ['ed','dm','ne','nm'])out.push(structuredClone(sb.QA[n]()));}return out.slice(0,PER_TOPIC);}
  if(id==='ap_classifying_discontinuities'){const sb=evalDefs(file,'function rational()','function make()',['rational','trig','rational2','piece'],seedBase);const out=[];for(let i=0;i<Math.ceil(PER_TOPIC/4);i++){sb.BatchMathRNG.random=rng(`${seedBase}:${i}`);for(const n of ['rational','trig','rational2','piece'])out.push(structuredClone(sb.QA[n]()));}return out.slice(0,PER_TOPIC);}
  if(id==='ap_advanced_trig_limits'){
    const html=fs.readFileSync(file,'utf8'),code=inlineScripts(html).find(x=>x.includes('const families=[]'));if(!code)throw Error('advanced trig family script missing');let body=code;const cut=body.indexOf('let current=null');body=body.slice(0,cut)+'\n;globalThis.QA={families};';body=body.replace(/^\s*\(function\(\)\{\s*['"]use strict['"];?/,'');const sb={console,BatchMathRNG:{random:rng(seedBase)},window:{}};vm.createContext(sb);vm.runInContext(body,sb);const out=[];for(let i=0;i<Math.ceil(PER_TOPIC/sb.QA.families.length);i++){sb.BatchMathRNG.random=rng(`${seedBase}:${i}`);for(const f of sb.QA.families){const p=structuredClone(f.make());p.variant=f.id;out.push(p);}}return out.slice(0,PER_TOPIC);
  }
  throw Error(`unknown specialized engine ${id}`);
}

for(const file of topicFiles){
  const html=fs.readFileSync(file,'utf8'),rel=path.relative(path.join(ROOT,'ap-calculus'),file).replaceAll(path.sep,'/'),folder=path.basename(path.dirname(path.dirname(file))),id=engineId(html),title=titleFrom(html,folder);
  let sourceType,sourceKey,problems=[];
  try{
    if(html.includes('/assets/ap-topic-generators.js')){sourceType='shared_topic_generator';sourceKey=topicSlug(html,folder);problems=sampleShared(sourceKey,`deep:${sourceKey}`);}
    else if(['ap_limit_proofs','ap_classifying_discontinuities','ap_advanced_trig_limits'].includes(id)){sourceType='specialized';sourceKey=id;problems=sampleSpecial(file,id,`deep:${id}`);}
    else{sourceType='filtered_comprehensive';const cat=selectedCategory(html);if(!cat)throw Error('selected category not found');const family=rel.startsWith('unit-1-')?'limits':rel.startsWith('unit-2-')?'derivatives':rel.startsWith('unit-4-')?'integrals':'unknown';sourceKey=`${family}:${cat}`;problems=sampleFiltered(html,cat,`deep:${sourceKey}`);}
  }catch(e){errors.push(`${title}: ${e.stack||e.message}`);continue;}
  const record={unit:unitName(rel),title,slug:folder,path:`/ap-calculus/${rel.replace(/index\.html$/,'')}`,engineId:id,sourceType,sourceKey};
  problems.forEach((p,i)=>inspectProblem(p,title,i+1));summarize(record,problems);record.structuralFingerprints=[...new Set(problems.map(structuralFingerprint).filter(Boolean))];record.reviewSamples=selectReviewSamples(problems,REVIEW_COUNT);records.push(record);
}

// Every individual topic should have its own analytics identity and its own backing mapping.
const ids=new Map(),backs=new Map();for(const r of records){if(!r.engineId)errors.push(`${r.title}: missing analytics engine ID`);else if(ids.has(r.engineId))errors.push(`duplicate analytics engine ID ${r.engineId}: ${ids.get(r.engineId)} and ${r.title}`);else ids.set(r.engineId,r.title);const key=`${r.sourceType}:${r.sourceKey}`;if(backs.has(key))errors.push(`duplicate topic backing mapping ${key}: ${backs.get(key)} and ${r.title}`);else backs.set(key,r.title);}

// Structural instructional-overlap checks for pairs that should remain distinct.
const pairs=[
 ['horizontal-and-vertical-tangent-lines','horizontal-and-vertical-tangent-lines-implicitly'],
 ['motion','motion-problems'],['area-below-and-between-curves','finding-area-in-terms-of-y']
];
const bySlug=Object.fromEntries(records.map(r=>[r.slug,r]));const overlap=[];for(const [a,b] of pairs){const A=bySlug[a],B=bySlug[b];if(!A||!B){warnings.push(`overlap pair missing: ${a}/${b}`);continue;}const distinct=A.sourceKey!==B.sourceKey||A.sourceType!==B.sourceType;overlap.push({a:A.title,b:B.title,distinctBacking:distinct,aVariants:Object.keys(A.variants),bVariants:Object.keys(B.variants)});if(!distinct)errors.push(`instructionally distinct pair shares backing generator: ${A.title} / ${B.title}`);}

// All-topic structural-overlap audit. Numeric constants are normalized so repeated mathematical templates can be detected across different topic pages.
const structuralOverlap=[];
for(let i=0;i<records.length;i++)for(let j=i+1;j<records.length;j++){
  const A=new Set(records[i].structuralFingerprints||[]),B=new Set(records[j].structuralFingerprints||[]);
  if(!A.size||!B.size)continue;let inter=0;for(const x of A)if(B.has(x))inter++;
  const union=A.size+B.size-inter,score=union?inter/union:0;
  if(score>0)structuralOverlap.push({a:records[i].title,b:records[j].title,score,sharedTemplates:inter,aTemplates:A.size,bTemplates:B.size});
}
structuralOverlap.sort((a,b)=>b.score-a.score||b.sharedTemplates-a.sharedTemplates);
for(const o of structuralOverlap.filter(x=>x.score>=0.60&&x.sharedTemplates>=1)){warnings.push(`High cross-topic structural overlap: ${o.a} / ${o.b} (${(100*o.score).toFixed(0)}% normalized-template Jaccard).`);}
// Fingerprints are QA-only and omitted from the public-sized topic records after overlap computation.
for(const r of records)delete r.structuralFingerprints;

const totals={topics:records.length,shared:records.filter(r=>r.sourceType==='shared_topic_generator').length,filtered:records.filter(r=>r.sourceType==='filtered_comprehensive').length,specialized:records.filter(r=>r.sourceType==='specialized').length,samples:records.reduce((s,r)=>s+r.samples,0)};
const report={ok:errors.length===0,generatedAt:new Date().toISOString(),perTopic:PER_TOPIC,reviewSamplesPerTopic:REVIEW_COUNT,totals,warnings,errors,overlap,structuralOverlap:structuralOverlap.slice(0,25),topics:records};fs.writeFileSync(path.join(OUT,'ap-topic-deep-audit.json'),JSON.stringify(report,null,2)+'\n');
const txt=['BatchMath AP individual-topic deep audit',`Result: ${report.ok?'PASS':'FAIL'}`,`Topics: ${totals.topics} (${totals.shared} shared, ${totals.filtered} filtered comprehensive, ${totals.specialized} specialized)`,`Raw generated samples: ${totals.samples}`,`Samples per topic: ${PER_TOPIC}`,'',`Warnings: ${warnings.length}`,...warnings.map(x=>`- ${x}`),'',`Errors: ${errors.length}`,...errors.slice(0,200).map(x=>`- ${x}`),''];fs.writeFileSync(path.join(OUT,'ap-topic-deep-audit.txt'),txt.join('\n'));
const md=['# AP Calculus Individual Practice - Generator Coverage','','Generated from the actual current site generators. Raw repeat rates are measured before the six-problem recent-ID suppression used by shared AP topic pages.','',`**Coverage:** ${totals.topics} topic pages - ${totals.shared} shared topic generators, ${totals.filtered} filtered comprehensive generators, ${totals.specialized} specialized generators.`,`**Audit sample:** ${PER_TOPIC.toLocaleString()} raw generations per topic (${totals.samples.toLocaleString()} total).`,'', '| Unit | Topic | Source | Families / variants observed | Unique IDs in sample | Raw immediate repeat |','|---|---|---|---|---:|---:|'];
for(const r of records){const vs=Object.entries(r.variants).map(([v,n])=>`${v} (${(100*n/r.samples).toFixed(0)}%)`).join(', ');md.push(`| ${r.unit.replaceAll('|','\\|')} | ${r.title.replaceAll('|','\\|')} | ${r.sourceType.replaceAll('_',' ')}: \`${r.sourceKey}\` | ${vs.replaceAll('|','\\|')} | ${r.uniqueIds} | ${(100*r.rawImmediateRepeatRate).toFixed(1)}% |`);}md.push('','## Structural overlap checks','');for(const o of overlap)md.push(`- **${o.a}** vs **${o.b}:** distinct backing generators confirmed. ${o.aVariants.join(', ')} vs ${o.bVariants.join(', ')}.`);md.push('','## Highest cross-topic normalized-template overlap','');if(structuralOverlap.length){for(const o of structuralOverlap.slice(0,15))md.push(`- **${o.a}** / **${o.b}:** ${(100*o.score).toFixed(1)}% Jaccard (${o.sharedTemplates} shared normalized templates; ${o.aTemplates} vs ${o.bTemplates} total).`)}else md.push('- No exact normalized mathematical templates were shared across topic generators.');md.push('','## Audit notes','',`- Warnings: ${warnings.length}.`,`- Errors: ${errors.length}.`);if(warnings.length)md.push(...warnings.map(x=>`- ${x}`));fs.writeFileSync(path.join(OUT,'ap-generator-coverage.md'),md.join('\n')+'\n');
console.log(txt.join('\n'));if(errors.length)process.exit(1);
