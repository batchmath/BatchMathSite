// v12.9.A Unit 6 review-lab loader: runs the Unit 6 engines in a Node vm with the same scripts a Unit 6 page loads
// (the Unit 4 parser, the Unit 5 core and answers as libraries, the Unit 6 core and engines), seeded like the site.
import fs from 'node:fs';import vm from 'node:vm';import {fileURLToPath} from 'node:url';
export const ROOT=fileURLToPath(new URL('../../../../',import.meta.url)).replace(/\/$/,'');
export function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
export function load(files=[],extra={}){
 const ctx={window:{...extra},console,document:{addEventListener(){}},Math};vm.createContext(ctx);ctx.window.BatchMathRNG={random:rng(1)};
 for(const f of ['derivative-expression-checker.js','unit4-exact-answers.js','ap-topic-generators.js','unit5-core.js','unit5-answers.js','unit6-core.js',...files])vm.runInContext(fs.readFileSync(`${ROOT}/assets/${f}`,'utf8'),ctx,{filename:f});
 return{ctx,W:ctx.window,G:ctx.window.BatchMathAPTopicGenerators,C:ctx.window.BatchMathUnit6Core,A5:ctx.window.BatchMathUnit5Answers,seed:s=>{ctx.window.BatchMathRNG={random:rng(s)};}};
}
