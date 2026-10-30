import {load} from './lib.mjs';
const [slug,count,...rest]=process.argv.slice(2);const files=(rest.find(r=>r.startsWith('files='))||'files=unit5-basic.js').slice(6).split(',');
const L=load(files),gen=L.G.get(slug);const want=(rest.find(r=>r.startsWith('fam='))||'').slice(4);const tierW=(rest.find(r=>r.startsWith('tier='))||'').slice(5);
const strip=h=>h.replace(/<div class="u4-work-step">/g,'\n  • ').replace(/<div class="u4-work-equation[^"]*">/g,'\n      ').replace(/<[^>]+>/g,'').replace(/\\\(|\\\)/g,'');
let shown=0;for(let i=1;shown<+count&&i<5000;i++){L.seed(i*104729+ +(rest.find(r=>r.startsWith('seed='))||'seed=0').slice(5));const p=gen({family:want||undefined,tier:tierW||undefined});if(want&&p.variant!==want)continue;shown++;
 console.log(`=== ${p.id} [${p.variant} / ${p.unit5Meta.tier}${p.calculatorActive?' / calc':''}]`);console.log('Q:',strip(p.questionHtml).replace(/\n/g,' '));
 p.parts.forEach((pt,k)=>{console.log(` P${k+1}: ${strip(pt.prompt)} | ANSWER: ${pt.answerTex}`);console.log(strip(pt.explanation));});}
