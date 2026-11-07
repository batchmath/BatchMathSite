import {withoutInversePromptHotfix} from '../inverse-prompt-source-guard.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {root,routes,samples} from './unit2-engine.mjs';import {batchmathToLatex,translateDerivative} from '../../assets/mathlive/answer-adapter.mjs';
const report=[];const run=(e,p,raw)=>{e.qa.current={...p,answered:false};e.el('answer').value=raw;e.qa.check();return e.el('feedback').innerHTML.match(/class="status">([^<]+)/)?.[1];};
for(const route of routes)test(route.path,()=>{const {e,reps}=samples(route,route.contract==='expression'?1200:220);let pairs=0,display=0;
 for(const [family,p]of reps){const ctx=JSON.stringify({family,id:p.id,answer:p.answerExpr,tex:p.answerTex}),translate=raw=>translateDerivative(raw,{inverseTrig:true,symbolicFunctions:route.contract==='nested'});
  const preview=batchmathToLatex(p.answerExpr);assert.equal(preview.status,'complete',ctx);const parsed=translate(preview.latex);assert.equal(parsed.status,'complete',ctx+' '+parsed.message);
  const original=run(e,p,p.answerExpr),converted=run(e,p,parsed.input);assert.equal(original,'Correct.',ctx);assert.equal(converted,original,ctx);pairs++;
  for(const raw of [p.answerExpr+'+12345','('+p.answerExpr+')+0','(1)/()','']){const latex=batchmathToLatex(raw).latex||raw;const t=translate(latex),source=t.input??'__unsupported__';assert.equal(run(e,p,source),run(e,p,raw),ctx+' '+raw);pairs++;}
  const t=translate(p.answerTex);assert.equal(t.status,'complete',ctx+' display '+t.message);assert.equal(run(e,p,t.input),'Correct.',ctx+' display '+t.input);display++;
 }
 if(route.path.includes('implicit-differentiation/practice/'))assert.equal([...reps.keys()].filter(k=>k.startsWith('{\"practice-scope\":\"topic\"}')).length,16);
 report.push({route:route.path,representatives:reps.size,checkerPairs:pairs,displayChecks:display,families:[...reps.keys()]});
});
test('only markup changed in converted engines; generator/checker source unchanged',()=>{for(const route of routes){const before=execFileSync('git',['show','3c88dac:'+route.path],{cwd:root,encoding:'utf8'}),after=withoutInversePromptHotfix(fs.readFileSync(root+route.path,'utf8'),route.path);const scripts=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!m[1].includes('src=')).map(x=>x[2]);assert.deepEqual(scripts(after),scripts(before));}for(const file of ['derivative-expression-checker','topic-derivative-at-point-practice','derivative-at-point-practice','nested-chain-rule-practice'])assert.equal(fs.readFileSync(root+'assets/'+file+'.js','utf8'),execFileSync('git',['show','3c88dac:assets/'+file+'.js'],{cwd:root,encoding:'utf8'}));});
process.on('exit',()=>fs.writeFileSync(root+'tools/mathlive-sitewide/artifacts/unit2-node.json',JSON.stringify(report,null,2)+'\n'));
