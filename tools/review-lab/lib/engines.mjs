// Load the site's generators and answer checkers in Node (no browser), seeded like the audits.
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import {ROOT} from './root.mjs';
export {ROOT};
export function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
export function load(){
 const ctx={window:{},console,document:{addEventListener(){}}};vm.createContext(ctx);ctx.window.BatchMathRNG={random:rng(1)};
 for(const f of ['assets/derivative-expression-checker.js','assets/unit4-exact-answers.js','assets/ap-topic-generators.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f});
 const G=ctx.window.BatchMathAPTopicGenerators,A=ctx.window.BatchMathUnit4Answers,I=ctx.window.BatchMathUnit4Integrals;
 return {ctx,G,A,I,seed:s=>{ctx.window.BatchMathRNG={random:rng(s)};}};
}
