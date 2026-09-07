#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const errors=[],warnings=[];
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const source=fs.readFileSync(path.join(ROOT,'assets/ap-topic-generators.js'),'utf8');
const box={window:{},console};vm.createContext(box);
function generate(seed,mode){box.window.BatchMathRNG={random:rng(seed)};vm.runInContext(source,box,{filename:'ap-topic-generators.js'});const gen=box.window.BatchMathAPTopicGenerators?.get('intermediate-value-theorem');if(typeof gen!=='function')throw new Error('IVT generator missing');return gen({mode});}
const mixed={value:0,root:0};const rootVariants=new Map();let count=0;
for(let i=1;i<=20000;i++){
  const p=generate(i*104729,'mixed');count++;
  mixed[p.ivtMode]=(mixed[p.ivtMode]||0)+1;
  if(!['value','root'].includes(p.ivtMode))errors.push(`mixed seed ${i}: invalid ivtMode ${p.ivtMode}`);
  if(/[\f\v]/.test(p.questionHtml)||/(^|[^\\])(?:qquad|frac\{)/.test(p.questionHtml))errors.push(`mixed seed ${i}: malformed TeX ${p.questionHtml}`);
}
const rootShare=mixed.root/(mixed.root+mixed.value);
if(rootShare<0.48||rootShare>0.52)errors.push(`mixed IVT ratio outside 48-52%: root ${(100*rootShare).toFixed(2)}%`);
for(const mode of ['value','root']){
  for(let i=1;i<=10000;i++){
    const p=generate(i*99991+(mode==='root'?17:3),mode);count++;
    if(p.ivtMode!==mode)errors.push(`${mode} seed ${i}: mode leakage -> ${p.ivtMode}`);
    if(mode==='value'&&p.variant!=='guaranteed_value')errors.push(`value seed ${i}: unexpected variant ${p.variant}`);
    if(mode==='root'){
      rootVariants.set(p.variant,(rootVariants.get(p.variant)||0)+1);
      if(!p.choicesAreText)errors.push(`root seed ${i}: text-choice flag missing`);
      if(!p.ivtQA)errors.push(`root seed ${i}: QA metadata missing`);
      else {
        const q=p.ivtQA;
        if(q.kind==='rational_pole_outside_yes' && !(q.pole<q.left||q.pole>q.right))errors.push(`root seed ${i}: outside pole lies on interval`);
        if(q.kind==='rational_pole_inside_no' && !(q.pole>q.left&&q.pole<q.right))errors.push(`root seed ${i}: inside pole is not strictly inside interval`);
        const correct=String(p.choices[p.correctIndex]);
        if(q.continuous&&q.signChange&&!correct.startsWith('Yes'))errors.push(`root seed ${i}: expected Yes, got ${correct}`);
        if(!q.continuous&&!correct.includes('not continuous'))errors.push(`root seed ${i}: discontinuity reason mismatch`);
        if(q.continuous&&!q.signChange&&!correct.includes('do not have opposite signs'))errors.push(`root seed ${i}: sign-change reason mismatch`);
      }
      if(/[\f\v]/.test(p.questionHtml)||/(^|[^\\])(?:qquad|frac\{)/.test(p.questionHtml))errors.push(`root seed ${i}: malformed TeX ${p.questionHtml}`);
      if(new Set(p.choices).size!==4)errors.push(`root seed ${i}: duplicate choices`);
    }
  }
}
const needed=['root_polynomial_yes','root_polynomial_no_sign_change','root_rational_discontinuity_outside','root_rational_discontinuity_inside'];
for(const v of needed)if(!rootVariants.has(v))errors.push(`root variant missing: ${v}`);
const ivtPage=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-1-limits-continuity/topics/intermediate-value-theorem/practice/index.html'),'utf8');
if(!/<select id="ivt-mode">[\s\S]*?<option value="mixed" selected>Mixed Practice<\/option>[\s\S]*?<option value="value">Guaranteed Value<\/option>[\s\S]*?<option value="root">Verify a Root<\/option>/.test(ivtPage))errors.push('IVT page selector missing or Mixed is not the default');
if(!/modeSelectId:"ivt-mode",defaultMode:"mixed"/.test(ivtPage))errors.push('IVT page configuration is not wired to mixed selector');
const infinityPage=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/practice/index.html'),'utf8');
if(!/<option value="infinity" selected>Limits at Infinity<\/option>/.test(infinityPage))errors.push('Limits at Infinity topic is not pinned to the pure infinity family');
if(/<option value="infinitySpecial" selected>/.test(infinityPage))errors.push('Limits at Infinity still selects infinitySpecial');
const report={ok:errors.length===0,generatedAt:new Date().toISOString(),problems:count,mixed,rootShare,rootVariants:Object.fromEntries(rootVariants),warnings,errors};
fs.writeFileSync(path.join(OUT,'unit1-ivt-infinity-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath Unit 1 IVT / Limits at Infinity QA',`Result: ${report.ok?'PASS':'FAIL'}`,`IVT generated problems: ${count}`,`Mixed split: value ${mixed.value}, root ${mixed.root} (root ${(rootShare*100).toFixed(2)}%)`,`Root variants: ${JSON.stringify(Object.fromEntries(rootVariants))}`,`Warnings: ${warnings.length}`,...warnings.map(x=>'- '+x),`Errors: ${errors.length}`,...errors.slice(0,100).map(x=>'- '+x),''];
fs.writeFileSync(path.join(OUT,'unit1-ivt-infinity-qa.txt'),lines.join('\n'));
console.log(lines.join('\n'));if(errors.length)process.exit(1);
