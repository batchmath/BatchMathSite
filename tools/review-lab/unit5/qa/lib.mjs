// Loads the Unit 5 checker and engines into a VM context with a seedable RNG (no browser needed).
import fs from 'node:fs';import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
export const ROOT=fileURLToPath(new URL('../../../../',import.meta.url)).replace(/\/$/,'');
export function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
export function load(files=['unit5-basic.js'],extra={}){
 const ctx={window:{...extra},console,document:{addEventListener(){}},Math};vm.createContext(ctx);ctx.window.BatchMathRNG={random:rng(1)};
 for(const f of ['derivative-expression-checker.js','unit4-exact-answers.js','ap-topic-generators.js','unit5-core.js','unit5-answers.js',...files])vm.runInContext(fs.readFileSync(`${ROOT}/assets/${f}`,'utf8'),ctx,{filename:f});
 return{ctx,G:ctx.window.BatchMathAPTopicGenerators,A:ctx.window.BatchMathUnit5Answers,W:ctx.window,seed:s=>{ctx.window.BatchMathRNG={random:rng(s)};}};
}
export {keypadForm} from '../../lib/keypad.mjs';
