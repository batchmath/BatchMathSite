#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const U=path.join(ROOT,'im1/unit-2-algebraic-operations-equations-inequalities');const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const errors=[],warnings=[],coverage={},checks={generated:0,semantic:0};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const src=fs.readFileSync(path.join(ROOT,'assets/im1-unit2-generators.js'),'utf8');const sb={window:{BatchMathRNG:{random:rng(1)}},console};vm.createContext(sb);vm.runInContext(src,sb);
const expected={
'equivalent-expressions-combining-like-terms':['combine','constants','multi','two_variables','mixed_products','three_groups','like_terms'],
'distributive-property':['basic','negative','multiterm','combine','two_groups','three_groups','reverse','equivalent','construct'],
'solving-linear-equations':['one_step','two_step','distribution','both_sides','identity','contradiction','fraction_coefficient','fraction_expression','two_fractions'],
'solving-linear-inequalities':['basic','negative_flip','distribution','both_sides','compound','creation'],
'graphing-inequalities-interval-notation':['ineq_to_interval','interval_result','interval_to_ineq','ineq_to_graph','graph_to_interval','union','solve_then_interval'],
'coordinate-system-nine-key-features':['plot_point','domain','range','increasing','decreasing','constant','x_intercepts','y_intercept','absolute_max','absolute_min']};
const ans=p=>String(p.kind?p.answer:p.choices[p.correctIndex]??'');const plain=s=>String(s).replace(/^\\\(|\\\)$/g,'').replace(/≤/g,'<=').replace(/≥/g,'>=').trim();
function expect(cond,msg){checks.semantic++;if(!cond)errors.push(msg)}
function validate(slug,p){checks.generated++;if(!p||!p.id||!p.variant)errors.push(`${slug}: missing id/variant`);if(p.kind==='polynomial'){
 expect(Array.isArray(p.terms)&&p.terms.length>=2,`${p.id}: missing term data`);
 expect(typeof p.answer==='string'&&p.explain.includes('<ol>'),`${p.id}: missing answer or explanation`);
 }else if(p.kind==='equation'){expect(!!p.math&&!!p.hint&&p.explain.includes('<ol>'),`${p.id}: missing equation solution/hint`);
 }else{
 if(!Array.isArray(p.choices)||p.choices.length<2)errors.push(`${slug} ${p?.id}: missing choices`);
 if(!Number.isInteger(p.correctIndex)||p.correctIndex<0||p.correctIndex>=p.choices.length)errors.push(`${slug} ${p?.id}: invalid correctIndex`);
 if(new Set(p.choices).size!==p.choices.length)errors.push(`${slug} ${p.id}: duplicate choices`);
 }
 const display=[p.q,...(p.choices||[])].join(' ');if(/\+\s*-|--|\bundefined\b|\bNaN\b/.test(display))errors.push(`${slug} ${p.id}: malformed display sequence`);
 let m;
 if((m=p.id.match(/^u2-eq-same-(-?\d+)-(-?\d+)-(-?\d+)$/)))expect(Number(plain(ans(p)))===+m[3],`${p.id}: wrong same-value answer`);
 if((m=p.id.match(/^u2-eq-yn-(-?\d+)-(-?\d+)-(0|1)$/)))expect(ans(p)===(m[3]==='1'?'Equivalent':'Not equivalent'),`${p.id}: equivalence classification wrong`);
 if((m=p.id.match(/^u2-eqn-(?:one_step|two_step)-(-?\d+)-(-?\d+)-(-?\d+)$/))){const a=+m[1],b=+m[2],rhs=+m[3],x=(rhs-b)/a;expect(plain(ans(p))===`x = ${x}`,`${p.id}: equation solution wrong`)}
 if((m=p.id.match(/^u2-eqn-dist-(-?\d+)-(-?\d+)-(-?\d+)$/))){const k=+m[1],shift=+m[2],rhs=+m[3],x=rhs/k-shift;expect(plain(ans(p))===`x = ${x}`,`${p.id}: distributed equation wrong`)}
 if((m=p.id.match(/^u2-eqn-both-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)$/))){const a=+m[1],b=+m[2],c=+m[3],d=+m[4],x=(d-b)/(a-c);expect(plain(ans(p))===`x = ${x}`,`${p.id}: both-sides equation wrong`)}
 if(p.variant==='identity')expect(ans(p)==='Infinitely many solutions',`${p.id}: identity classification wrong`);if(p.variant==='contradiction')expect(ans(p)==='No solution',`${p.id}: contradiction classification wrong`);
 if((m=p.id.match(/^u2-ineq-flip-(\d+)-(-?\d+)-(-?\d+)-(0|1)$/))){const a=+m[1],b=+m[2],rhs=+m[3],strict=m[4]==='1',x=(b-rhs)/a;expect(plain(ans(p))===`x ${strict?'>':'>='} ${x}`,`${p.id}: negative flip wrong`)}
 if((m=p.id.match(/^u2-ineq-comp-(\d+)-(-?\d+)-(-?\d+)-(-?\d+)$/))){expect(plain(ans(p))===`${m[3]} < x <= ${m[4]}`,`${p.id}: compound inequality wrong`)}
 if((m=p.id.match(/^u2-graph-point-(-?\d+)-(-?\d+)$/)))expect(plain(ans(p))===`(${m[1]}, ${m[2]})`,`${p.id}: plotted point wrong`);
 if((m=p.id.match(/^u2-graph-domain-(-?\d+)-(-?\d+)$/)))expect(plain(ans(p))===`[${-4+(+m[1])}, ${4+(+m[1])}]`,`${p.id}: domain wrong`);
 if((m=p.id.match(/^u2-graph-range-(-?\d+)-(-?\d+)$/)))expect(plain(ans(p))===`[${-2+(+m[2])}, ${2+(+m[2])}]`,`${p.id}: range wrong`);
 if((m=p.id.match(/^u2-graph-max-(-?\d+)-(-?\d+)$/)))expect(Number(ans(p))===2+(+m[2]),`${p.id}: absolute max wrong`);
 if((m=p.id.match(/^u2-graph-min-(-?\d+)-(-?\d+)$/)))expect(Number(ans(p))===-2+(+m[2]),`${p.id}: absolute min wrong`);
}
for(const [slug,req] of Object.entries(expected)){const seen=new Set();const fn=sb.window.BatchMathIM1Unit2Generators.get(slug);if(typeof fn!=='function'){errors.push(`missing generator ${slug}`);continue}for(let i=1;i<=20000;i++){sb.window.BatchMathRNG.random=rng((i*2654435761+slug.length)>>>0);const p=fn();seen.add(p.variant);validate(slug,p)}coverage[slug]=[...seen].sort();for(const v of req)if(!seen.has(v))errors.push(`${slug}: missing assignment family ${v}`)}
// Mixed review must reach every topic family category.
{const fn=sb.window.BatchMathIM1Unit2Generators.get('comprehensive-review'),seen=new Set();for(let i=1;i<=30000;i++){sb.window.BatchMathRNG.random=rng((0x12345678+i*7919)>>>0);const p=fn();seen.add(p.variant);validate('comprehensive-review',p)}const all=new Set(Object.values(expected).flat());for(const v of all)if(!seen.has(v))errors.push(`comprehensive-review: did not reach ${v}`);coverage['comprehensive-review']=[...seen].sort()}
const files=[];for(const dir of ['resources/notes','resources/assignments','resources/answer-keys'])for(const name of fs.readdirSync(path.join(U,dir)))files.push(`${dir}/${name}`);files.sort();const expectedFiles=['resources/notes/00-unit-2-notes.pdf',...['01-equivalent-expressions-combining-like-terms','02-distributive-property','03-solving-linear-equations','04-solving-linear-inequalities','05-graphing-inequalities-interval-notation','06-coordinate-system-nine-key-features','07-unit-2-comprehensive-review'].flatMap(x=>[`resources/assignments/${x}.pdf`,`resources/answer-keys/${x}-answer-key.pdf`])].sort();
expect(JSON.stringify(files)===JSON.stringify(expectedFiles),`Unit 2 public resource whitelist mismatch. Found: ${files.join(', ')}`);for(const f of files)if(!f.toLowerCase().endsWith('.pdf'))errors.push(`non-PDF Unit 2 resource: ${f}`);const allTree=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else allTree.push(path.relative(U,p))}}walk(U);for(const f of allTree){if(/test|student notes/i.test(f))errors.push(`prohibited Unit 2 public file/path: ${f}`);if(/\.docx$/i.test(f))errors.push(`DOCX present in Unit 2 site tree: ${f}`)}
const topicSlugs=[...Object.keys(expected),'comprehensive-review'];for(const slug of topicSlugs){for(const rel of [`topics/${slug}/index.html`,`topics/${slug}/practice/index.html`])if(!fs.existsSync(path.join(U,rel)))errors.push(`missing Unit 2 page ${rel}`)}
const report={ok:!errors.length,generatedAt:new Date().toISOString(),checks,coverage,resourceFiles:files,warnings,errors};fs.writeFileSync(path.join(OUT,'im1-unit2-qa.json'),JSON.stringify(report,null,2)+'\n');const lines=['BatchMath IM1 Unit 2 QA',`Result: ${report.ok?'PASS':'FAIL'}`,`Generated practice problems: ${checks.generated}`,`Independent semantic checks: ${checks.semantic}`,`Public Unit 2 PDFs: ${files.length}`,`Warnings: ${warnings.length}`,...warnings.map(x=>'- '+x),`Errors: ${errors.length}`,...errors.slice(0,120).map(x=>'- '+x),''];fs.writeFileSync(path.join(OUT,'im1-unit2-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
