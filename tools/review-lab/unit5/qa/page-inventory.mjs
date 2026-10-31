// v12.8.Y before/after inventory of the Unit 5 practice pages, read from the pages themselves: each topic page's
// practice buttons, and for each practice page its kind (calculator, non-calculator, single, legacy redirect), its
// Practice Type choices, and the families its default choice draws from (with weights). Prints Markdown.
// Usage: node tools/review-lab/unit5/qa/page-inventory.mjs [repo root]   (default: this checkout)
import fs from 'node:fs';import path from 'node:path';
const ROOT=path.resolve(process.argv[2]||new URL('../../../../',import.meta.url).pathname);
const lib=await import(path.join(ROOT,'tools/review-lab/unit5/qa/lib.mjs'));
const U5=path.join(ROOT,'ap-calculus/unit-5-differential-equations/topics');
const GLOBAL={'unit5-basic.js':'BatchMathUnit5Basic','unit5-motion.js':'BatchMathUnit5Motion','unit5-slope-fields.js':'BatchMathUnit5Slope','unit5-separable.js':'BatchMathUnit5Separable','unit5-growth.js':'BatchMathUnit5Growth','unit5-rate.js':'BatchMathUnit5Rate'};
const KIND={calculator:'calculator','non-calculator':'noncalculator'};
const kindTiers=F=>F.calc||(F.calculator?{calculator:F.tiers,noncalculator:[]}:{calculator:[],noncalculator:F.tiers});
const text=h=>h.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#x27;|&#39;/g,"'").trim();
const out=[];
for(const topic of fs.readdirSync(U5).sort()){
 const tf=path.join(U5,topic,'index.html');if(!fs.existsSync(tf))continue;const th=fs.readFileSync(tf,'utf8');
 const sec=(th.match(/<section class="resource-section" data-bm-topic-practice="1">(.*?)<\/section>/s)||[])[1]||'';
 const buttons=[...sec.matchAll(/<a aria-label="([^"]+)"[^>]*href="([^"]+)"/g)].map(m=>`${text(m[1])} → \`${m[2]}\``);
 out.push(`### ${topic}`,`Topic page buttons: ${buttons.join('; ')||'(none)'}`,'');
 for(const pg of ['practice','non-calculator-practice','calculator-practice','assignment-practice']){
  const f=path.join(U5,topic,pg,'index.html');if(!fs.existsSync(f))continue;const h=fs.readFileSync(f,'utf8');
  const conf=(h.match(/window\.BM_TOPIC_PRACTICE=(\{.*?\});/)||[])[1];
  if(!conf){const to=(h.match(/http-equiv="refresh" content="0; url=([^"]+)"/)||[])[1];out.push(`- \`${pg}/\`: no practice engine${to?`; redirects to \`${to}\``:''}`);continue;}
  const c=JSON.parse(conf),title=text((h.match(/<h1 class="page-title">(.*?)<\/h1>/s)||[])[1]||'');
  const sel=(h.match(/<select id="u5Mode"[^>]*>(.*?)<\/select>/s)||[])[1];
  const modes=sel?[...sel.matchAll(/<option value="([^"]+)"[^>]*>([^<]*)/g)].map(m=>`${text(m[2])} (\`${m[1]}\`)`):[];
  const scripts=[...h.matchAll(/<script src="\/assets\/(unit5-(?!core|answers|ui)[a-z-]+\.js)"/g)].map(m=>m[1]);
  let pool='';
  if(!scripts.includes('unit5-review.js')){const file=scripts[0],L=lib.load([file]),eng=L.W[GLOBAL[file]];
   const k=c.calculator?KIND[c.calculator]:null;
   pool=Object.entries(eng.FAMILIES).filter(([,F])=>k?kindTiers(F)[k].length:true).map(([n,F])=>`${n} ${F.weight}`).join(', ');}
  else{const L=lib.load(Object.values(scripts).filter(s=>s!=='unit5-review.js').concat('unit5-review.js'));const R=L.W.BatchMathUnit5Review;
   pool=R.topicsFor(c.calculator||null).map(t=>`${t.key} ${t.weight}`).join(', ');}
  out.push(`- \`${pg}/\` — ${title} [${c.calculator||'single/mixed'}]`,`  - Practice Type: ${modes.length?modes.join(' · '):'(no dropdown)'}`,`  - Default draws from: ${pool}`);
 }
 out.push('');
}
console.log(out.join('\n'));
