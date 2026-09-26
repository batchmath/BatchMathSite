#!/usr/bin/env node
import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';import{execFileSync}from'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=execFileSync('rg',['--files','-g','*.js','-g','*.html','-g','*.mjs','assets','ap-calculus','calculus-prep','im1'],{cwd:root,encoding:'utf8'}).trim().split(/\n/).filter(Boolean);
const failures=[];let superscripts=0;
for(const file of files){const source=fs.readFileSync(path.join(root,file),'utf8');for(let i=0;i<source.length-2;i++){if(source[i]!=='^'||source[i+1]!=='{')continue;let depth=1,j=i+2;for(;j<source.length&&depth;j++){if(source[j]==='{')depth++;else if(source[j]==='}')depth--}if(depth)continue;superscripts++;const raw=source.slice(i,j),visible=raw.replace(/\$\{[^{}]*\}/g,'');if(visible.includes('/'))failures.push(`${file}: ${raw.slice(0,180)}`);i=j-1}}
assert.deepEqual(failures,[],`Fractional superscripts must use \\frac so they render vertically:\n${failures.slice(0,25).join('\n')}`);
const report={ok:true,files:files.length,superscriptsChecked:superscripts};fs.mkdirSync(path.join(root,'qa-results'),{recursive:true});fs.writeFileSync(path.join(root,'qa-results/sitewide-fractional-exponent-qa.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
