// Summarize a folder of scan-page.mjs results: pages with findings, kinds of findings, one example per page.
// Usage: node overflow/summary.mjs <outdir>
import fs from 'node:fs';import path from 'node:path';
const d=process.argv[2];const agg={};let pages=0,bad=0,po=0,errs=0,probs=0,consoleErrs=0;const per=[];
for(const f of fs.readdirSync(d).filter(f=>f.endsWith('.json')).sort()){
 let j;try{j=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));}catch(e){errs++;per.push('   NO RESULT '+f);continue;}
 pages++;probs+=j.problems;if(j.overflowBoxes)bad++;if(j.pageOverflow)po++;if(j.errors?.length)consoleErrs++;
 for(const [k,v] of Object.entries(j.kinds))agg[k]=(agg[k]||0)+v;
 if(j.overflowBoxes||j.pageOverflow)per.push('   '+f.replace(/^ap-calculus_|_practice\.json$|\.json$/g,'')+': '+JSON.stringify(j.kinds)+(j.pageOverflow?` page overflow on ${j.pageOverflow} problems`:'')+' e.g. '+JSON.stringify(j.examples[0]||{}).slice(0,180));
}
console.log(`${path.basename(d)}: pages ${pages}, problems ${probs} | pages with findings ${bad} | pages with horizontal page overflow ${po} | pages with console errors ${consoleErrs} | no result ${errs}`);
console.log(JSON.stringify(agg));console.log(per.join('\n'));
