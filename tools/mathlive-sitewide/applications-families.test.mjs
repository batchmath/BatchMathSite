import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {engine,routes,expected,rng,root} from './applications-engine.mjs';import {applicationProfiles} from '../../assets/mathlive/applications-profiles.mjs';import {batchmathToLatex} from '../../assets/mathlive/answer-adapter.mjs';
import {applicationList,applicationExpression} from '../../assets/mathlive/applications-contracts.mjs';
const report=[];
test('visible Unit 3 practice selectors preserve actual checker results',()=>{
 for(const route of routes){const html=fs.readFileSync(root+route.path,'utf8'),e=engine(route),covered=[];
  for(const select of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g))for(const option of select[2].matchAll(/<option\b[^>]*value="([^"]*)"/g)){
   const extra={[select[1]]:option[1]};covered.push(extra);
   for(let seed=1;seed<=40;seed++){const p=e.generate(seed*1297,extra);e.load(p);if(p.answerType==='staged-calculus'&&p.stage1.type==='choice'){e.el('choices').querySelectorAll('.staged-choice')[p.stage1.correctIndex].click();e.b.advancedQA.current.pendingStageAdvance?.();}
    if(!e.mount)continue;const part=p.stage1?.type==='choice'?p.stage2:p.stage1,values=expected(p)||[(part.expectedValues?applicationList:applicationExpression)(part.answerTex).input],mode=e.mount.options.mode,def=applicationProfiles({calculator:route.mode==='calculator'})[mode],contract=typeof def==='function'?def(e.mount):def;
    for(const raws of [values,values.map(x=>contract.translate((contract.toLatex||batchmathToLatex)(x).latex).input)]){e.load(p);if(p.answerType==='staged-calculus'&&p.stage1.type==='choice'){e.el('choices').querySelectorAll('.staged-choice')[p.stage1.correctIndex].click();e.b.advancedQA.current.pendingStageAdvance?.();}e.mount.inputs.forEach((input,i)=>input.value=raws[i]);e.mount.options.onCheck();assert.match(e.snapshot().feedback,/result good/,p.id+': '+JSON.stringify(extra)+': '+JSON.stringify(raws));}
   }
  }if(covered.length)report.push({route:route.path,selectors:covered,seedsPerSelector:40});
 }
});
for(const route of routes.filter(r=>['optimization','related-rates'].includes(r.slug)))test('every source descriptor '+route.slug+' '+route.mode,()=>{
 const e=engine(route),defs=applicationProfiles(),list=e.b.unit3FamilyQA[route.slug==='optimization'?'optimization':'related'],done=[];
 for(const d of list){if(d[route.mode]===false)continue;for(let seed=1;seed<=5;seed++){
  e.b.BatchMathRNG={random:rng(seed*719)};const p=d.build(route.mode,d.source),raw=expected(p);assert.ok(raw,p.id);
  e.load(p);const mode=e.mount.options.mode,def=defs[mode],contract=typeof def==='function'?def(e.mount):def,modern=raw.map(x=>{const tex=(contract.toLatex||batchmathToLatex)(x).latex;assert.ok(tex!==null,p.id+': '+x);const out=contract.translate(tex);assert.equal(out.status,'complete',p.id+': '+tex);return out.input;});
  for(const values of [raw,modern]){e.load(p);e.mount.inputs.forEach((input,i)=>input.value=values[i]);e.mount.options.onCheck();assert.match(e.snapshot().feedback,/result good/,p.id+': '+JSON.stringify(values));}
  e.load(p);e.mount.inputs.forEach(input=>input.value='1234567');e.mount.options.onCheck();assert.doesNotMatch(e.snapshot().feedback,/result good/,p.id);
 }done.push({family:d.family,source:d.source});}
 report.push({route:route.path,mode:route.mode,descriptors:done,seedsPerDescriptor:5});
});
process.on('exit',()=>fs.writeFileSync(root+'tools/mathlive-sitewide/artifacts/applications-families.json',JSON.stringify(report,null,2)+'\n'));
