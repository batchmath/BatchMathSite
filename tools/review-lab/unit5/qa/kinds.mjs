// node kinds.mjs <slug> <files> — one sample per id prefix (generator kind) with full explanations
import {load} from './lib.mjs';
const [slug,files,only]=process.argv.slice(2);const L=load(files.split(',')),gen=L.G.get(slug);
const strip=h=>h.replace(/<div class="u4-work-step">/g,'\n  • ').replace(/<div class="u4-work-equation[^"]*">/g,'\n      ').replace(/<[^>]+>/g,'').replace(/\\\(|\\\)/g,'');
const seen=new Set();
for(let i=1;i<4000;i++){L.seed(i*7907);const p=gen({});const key=p.variant+':'+p.id.split('-')[2]+':'+p.parts.length+':'+(p.parts[0].prompt||'').slice(0,18);if(seen.has(key))continue;seen.add(key);if(only&&!p.id.includes(only))continue;
 console.log(`\n=== ${p.id} [${p.variant} / ${p.unit5Meta.tier}${p.calculatorActive?' / calc':''}]`);console.log('Q:',strip(p.questionHtml).replace(/\n/g,' '));
 p.parts.forEach((pt,k)=>{console.log(` P${k+1}: ${strip(pt.prompt)} | ANSWER: ${pt.answerTex}`);console.log(strip(pt.explanation));});}
