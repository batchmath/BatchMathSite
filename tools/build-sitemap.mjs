import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const full=path.join(dir,entry.name);if(entry.isDirectory()){if(['.git','node_modules','qa-results','tools'].includes(entry.name))return[];return walk(full);}return entry.name==='index.html'?[full]:[];});}
function noindex(html){return /<meta\b[^>]*(?:name=["']robots["'][^>]*content=["'][^"']*noindex|content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["'])/i.test(html);}
const urls=walk(root).filter(file=>!noindex(fs.readFileSync(file,'utf8'))).map(file=>{let rel=path.relative(root,file).split(path.sep).join('/');const route=rel==='index.html'?'/':`/${rel.slice(0,-'index.html'.length)}`;return `https://batchmath.net${route}`;}).sort();
const xml=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',...urls.map(url=>`  <url><loc>${url}</loc></url>`),'</urlset>',''].join('\n');
fs.writeFileSync(path.join(root,'sitemap.xml'),xml);
console.log(`Wrote ${urls.length} sitemap URLs.`);
