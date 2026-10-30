// v12.8.X calculator / non-calculator eligibility, read from the real pages: for every Unit 5 practice page, its
// page config (slug, calculator mode) and every Practice Type option are sampled the way the page calls the
// generator. Checks: a calculator page never shows a non-calculator problem and vice versa; a fixed Practice Type
// stays in its family (or group); family shares on each Mixed option match the weights renormalized over the
// eligible families; every calculator kind offers all three tiers (the reviews need them); impossible requests
// raise an error instead of falling back to other families; an unknown or retired Practice Type gives mixed.
// Usage: node tools/review-lab/unit5/qa/calc-eligibility.mjs [N per option]
import fs from 'node:fs';import {load,ROOT} from './lib.mjs';
const N=+(process.argv[2]||1500);
const U5=`${ROOT}/ap-calculus/unit-5-differential-equations/topics`;
const pages=[];
for(const topic of fs.readdirSync(U5))for(const pg of ['practice','calculator-practice','non-calculator-practice','assignment-practice']){
 const f=`${U5}/${topic}/${pg}/index.html`;if(!fs.existsSync(f))continue;const h=fs.readFileSync(f,'utf8');
 const conf=JSON.parse(h.match(/window\.BM_TOPIC_PRACTICE=(\{.*?\});/)[1]);
 const scripts=[...h.matchAll(/<script src="\/assets\/(unit5-(?!core|answers|ui)[a-z-]+\.js)"/g)].map(m=>m[1]);
 const modes=[...h.match(/<select id="u5Mode"[^>]*>(.*?)<\/select>/)[1].matchAll(/<option value="([^"]+)"[^>]*>([^<]*)/g)].map(m=>[m[1],m[2]]);
 pages.push({rel:`${topic}/${pg}`,conf,scripts,modes});
}
const GLOBAL={'basic-first-order-differential-equations':'BatchMathUnit5Basic','motion-problems':'BatchMathUnit5Motion','slope-fields':'BatchMathUnit5Slope','separable-differential-equations':'BatchMathUnit5Separable','exponential-growth-and-decay-interest-newton-s-law-of-cooling':'BatchMathUnit5Growth','rate-problems':'BatchMathUnit5Rate'};
const KIND={calculator:'calculator','non-calculator':'noncalculator'};
const fails=[];const lines=[];
for(const pg of pages){
 const L=load(pg.scripts,{BM_TOPIC_PRACTICE:pg.conf});const gen=L.G.get(pg.conf.slug);const eng=L.W[GLOBAL[pg.conf.slug]];
 const calc=pg.conf.calculator||null;
 for(const [mode,label] of pg.modes){
  const fam={},tiers={};let leaks=0,errs=0,stray=0;
  for(let i=1;i<=N;i++){L.seed(i*6007+mode.length);let p;try{p=gen({mode,modes:{u5Mode:mode},u5Mode:mode});}catch(e){errs++;if(errs<3)fails.push(`${pg.rel} [${mode}] generation error: ${e.message}`);continue;}
   if(calc&&p.calculatorActive!==(calc==='calculator'))leaks++;
   const f=p.unit5Meta.family;fam[f]=(fam[f]||0)+1;tiers[p.unit5Meta.tier]=(tiers[p.unit5Meta.tier]||0)+1;
   if(eng&&mode!=='mixed'){const F=eng.FAMILIES[f];if(!(f===mode||F?.group===mode))stray++;}}
  if(leaks)fails.push(`${pg.rel} [${mode}]: ${leaks} problems of the wrong calculator kind`);
  if(stray)fails.push(`${pg.rel} [${mode}]: ${stray} problems outside the chosen Practice Type`);
  let dist='';
  if(eng&&mode==='mixed'){const el=Object.entries(eng.FAMILIES).filter(([,F])=>(calc?(F.calc||(F.calculator?{calculator:F.tiers,noncalculator:[]}:{calculator:[],noncalculator:F.tiers}))[KIND[calc]].length:true));
   const tot=el.reduce((s,[,F])=>s+F.weight,0);const got=N-errs;
   dist=el.map(([k,F])=>{const want=F.weight/tot,share=(fam[k]||0)/got;if(Math.abs(share-want)>Math.max(0.025,3*Math.sqrt(want*(1-want)/got)))fails.push(`${pg.rel} [mixed]: ${k} ${(100*share).toFixed(1)}% vs ${(100*want).toFixed(1)}%`);return `${k} ${(100*share).toFixed(1)}/${(100*want).toFixed(1)}`;}).join(', ');
   const extra=Object.keys(fam).filter(k=>!el.some(([e])=>e===k));if(extra.length)fails.push(`${pg.rel} [mixed]: ineligible families ${extra}`);}
  lines.push(`${pg.rel.padEnd(70)} ${calc?calc.padEnd(15):'mixed'.padEnd(15)} ${mode.padEnd(22)} leaks ${leaks} errors ${errs} tiers ${JSON.stringify(tiers)}${dist?`\n      shares (got/target %): ${dist}`:''}`);
 }
 // engine-level guarantees for this page's kind
 if(eng){
  for(const kind of calc?[calc]:['calculator','non-calculator']){const any=Object.values(eng.FAMILIES).some(F=>(F.calc||(F.calculator?{calculator:F.tiers,noncalculator:[]}:{calculator:[],noncalculator:F.tiers}))[KIND[kind]].length);
   if(!any)continue;
   for(const tier of ['foundational','intermediate','challenging']){try{L.seed(77);const p=eng.make({calc:kind,tier});if(p.unit5Meta.tier!==tier)fails.push(`${pg.rel}: ${kind} ${tier} gave ${p.unit5Meta.tier}`);}catch(e){lines.push(`  note: ${pg.conf.slug} has no ${kind} ${tier} problems (${e.message})`);}}}
  for(const [k,F] of Object.entries(eng.FAMILIES)){const ks=F.calc||(F.calculator?{calculator:F.tiers,noncalculator:[]}:{calculator:[],noncalculator:F.tiers});
   for(const kind of ['calculator','non-calculator'])if(!ks[KIND[kind]].length){let threw=false;try{eng.make({calc:kind,family:k});}catch(_){threw=true;}if(!threw)fails.push(`${pg.conf.slug}: ${kind} request for family ${k} did not raise an error`);}}
  let unk;try{L.seed(5);unk=gen({mode:'no-such-practice-type'});}catch(e){fails.push(`${pg.rel}: an unknown Practice Type raised ${e.message}`);}
  if(unk&&calc&&unk.calculatorActive!==(calc==='calculator'))fails.push(`${pg.rel}: unknown Practice Type escaped the calculator filter`);
 }
}
console.log(lines.join('\n'));
console.log(`pages ${pages.length}; Practice Type options ${pages.reduce((s,p)=>s+p.modes.length,0)}; problems ${N} per option; failures ${fails.length}`);
if(fails.length)console.log(fails.slice(0,30).join('\n'));process.exitCode=fails.length?1:0;
