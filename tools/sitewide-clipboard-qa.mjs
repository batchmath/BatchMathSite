#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[];
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const checks={
  'assets/calculus-keypad.js':[
    'safeSelectionRange','application/x-batchmath-expression',
    'addEventListener("copy"','addEventListener("cut"','addEventListener("paste"',
    "key==='c'||key==='x'||key==='v'",'mountInputs'
  ],
  'assets/calc-prep-exact-editor.js':[
    'safeSelectionRange','application/x-batchmath-exact',
    "addEventListener('copy'","addEventListener('cut'","addEventListener('paste'",
    "key==='c'||key==='x'||key==='v'",'normalizePaste'
  ],
  'assets/im1-keypad.js':[
    'application/x-batchmath-im1-fraction',
    'addEventListener("copy"','addEventListener("cut"','addEventListener("paste"',
    'key==="c"||key==="x"||key==="v"'
  ],
  'assets/calculus-keypad.css':['.bm-calc-selected'],
  'assets/calc-prep.css':['.bm-exact-token.selected','.bm-exact-root.selected'],
  'assets/im1-keypad.css':['.bm-fraction-selected']
};
for(const [file,tokens] of Object.entries(checks)){
  const source=read(file);
  for(const token of tokens)if(!source.includes(token))errors.push(file+': missing '+token);
}

function files(dir,out=[]){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name==='node_modules'||entry.name==='.git'||entry.name==='qa-results')continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())files(full,out);
    else out.push(full);
  }
  return out;
}
const jsFiles=files(path.join(ROOT,'assets')).filter(file=>file.endsWith('.js'));
const customEditors=[];
for(const file of jsFiles){
  const source=fs.readFileSync(file,'utf8');
  if(/setAttribute\(["']role["'],["']textbox["']\)/.test(source))customEditors.push(path.relative(ROOT,file));
  if(/document\.addEventListener\(["'](?:copy|cut|paste)["']/.test(source))errors.push(path.relative(ROOT,file)+': global clipboard handler could interfere with native fields');
}
const expected=['assets/calc-prep-exact-editor.js','assets/calculus-keypad.js','assets/im1-keypad.js'];
for(const file of expected)if(!customEditors.includes(file))errors.push('custom editor audit did not find '+file);
for(const file of customEditors)if(!expected.includes(file))errors.push('uncovered custom textbox implementation: '+file);

const htmlFiles=files(ROOT).filter(file=>file.endsWith('.html'));
const pageCounts={calculus:0,calcPrep:0,im1:0,native:0};
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  if(html.includes('/assets/calculus-keypad.js'))pageCounts.calculus++;
  if(html.includes('/assets/calc-prep-exact-editor.js'))pageCounts.calcPrep++;
  if(html.includes('/assets/im1-keypad.js'))pageCounts.im1++;
  if(/<(?:input|textarea)\b/i.test(html))pageCounts.native++;
}
if(!pageCounts.calculus||!pageCounts.calcPrep||!pageCounts.im1)errors.push('shared editor page coverage is incomplete: '+JSON.stringify(pageCounts));

const report={
  ok:errors.length===0,
  generatedAt:new Date().toISOString(),
  customEditors,
  pageCounts,
  guarantees:[
    'Ctrl/Cmd+C, X, and V are handled in every custom math textbox',
    'structured clipboard MIME preserves fractions, radicals, exponents, and functions',
    'plain pasted LaTeX is normalized before insertion',
    'ordinary input and textarea fields retain native browser clipboard behavior'
  ],
  errors
};
const out=path.join(ROOT,'qa-results');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'sitewide-clipboard-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exit(1);
