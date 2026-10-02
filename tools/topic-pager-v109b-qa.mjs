#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[];
let pages=0;
const courses=new Set();

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full);
    else if(entry.name.endsWith('.html')){
      const html=fs.readFileSync(full,'utf8');
      if(!/class=["'][^"']*\btopic-pager\b/.test(html))continue;
      pages++;
      const rel=path.relative(ROOT,full).split(path.sep).join('/');
      courses.add(rel.split('/')[0]);
      if(!/assets\/site\.css/.test(html))errors.push(`${rel}: topic pager does not load the shared stylesheet`);
      if(!/class=["'][^"']*\btopic-pager-link\b/.test(html))errors.push(`${rel}: topic pager has no navigation link`);
    }
  }
}

walk(path.join(ROOT,'ap-calculus'));
walk(path.join(ROOT,'im1'));

const css=fs.readFileSync(path.join(ROOT,'assets/site.css'),'utf8');
for(const token of [
  'grid-template-columns:minmax(0,1fr) minmax(0,1fr)',
  'min-height:62px',
  'border-radius:12px',
  'linear-gradient(180deg,#121212 0%,#080808 100%)',
  'border:2px solid var(--bm-red)',
  '.topic-pager-link:focus-visible',
  '@media(max-width:760px)',
  'grid-template-columns:minmax(0,1fr);'
])if(!css.includes(token))errors.push(`shared pager CSS is missing ${token}`);

if(pages!==108)errors.push(`expected 108 topic-pager pages, found ${pages}`);
for(const course of ['ap-calculus','im1'])if(!courses.has(course))errors.push(`no pager pages found for ${course}`);
if(/border-left:4px solid var\(--bm-red\)|border-right:4px solid var\(--bm-red\)/.test(css))errors.push('shared pager still uses a one-sided red accent');

if(errors.length){
  console.error(`FAIL — ${errors.length} topic-pager issue(s)`);
  for(const error of errors)console.error(`- ${error}`);
  process.exit(1);
}
console.log(`PASS — shared v10.9.C topic pager verified on ${pages} pages across ${[...courses].sort().join(' and ')}`);
