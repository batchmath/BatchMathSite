import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),data=require(path.join(root,'mogollon2026/mogollon2026.js'));
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),rows=data.parseCsv(read('mogollon2026/starter.csv')),entries=data.normalizeRows(rows),headers=rows[0];
assert.deepEqual(headers,['Mile','Published','Topic','ProblemLaTeX','SolutionLaTeX','Explanation','VideoURL','VideoLabel','PublishedDate']);
assert.deepEqual(entries.map(e=>e.mile),[1,2,3,4,6,7]);
assert.ok(entries.every(e=>e.solution&&e.explanation&&e.video));
assert.equal(entries[1].video.id,entries[2].video.id);assert.equal(entries[2].video.id,entries[3].video.id);assert.equal(entries[4].video.id,entries[5].video.id);
assert.match(entries[4].solution,/2x\+1/);assert.doesNotMatch(entries[4].problem,/x\s*=/);
assert.deepEqual(data.parseCsv('a,b\r\n"one, two","first\nsecond ""quoted"""\r\n'),[['a','b'],['one, two','first\nsecond "quoted"']]);
assert.throws(()=>data.parseCsv('a,b\n"unclosed'));assert.throws(()=>data.parseCsv('a,b\n"closed"stray,c'));
const variant=headers.map(s=>'  '+s.toUpperCase().replace('LATEX',' LATEX')+'  ');
assert.equal(data.normalizeRows([variant,...rows.slice(1)]).length,6);
const invalid=[
 ['5','FALSE','Later','x','x','','','',''],
 ['5','TRUE','Later','','x','','','',''],
 ['5','TRUE','Later','x','','','','',''],
 ['0','TRUE','','x','x','','','',''],
 ['2.5','TRUE','','x','x','','','',''],
 ['no','TRUE','','x','x','','','','']
];
assert.equal(data.normalizeRows([headers,...invalid]).length,0);
assert.equal(data.normalizeRows([headers,['8','TRUE','Exact Topic','x','','A complete explanation of the result.','','','']])[0].topic,'Exact Topic');
assert.throws(()=>data.normalizeRows([headers,rows[1],rows[1]]),/published more than once/);
const growth=[headers];for(let i=104;i>=1;i--)if(i!==5)growth.push([String(i),'TRUE','Test topic',`x^{${i}}`,'x','Written steps.','','','']);
assert.equal(data.normalizeRows(growth).length,103);assert.equal(data.normalizeRows(growth)[0].mile,1);assert.equal(data.normalizeRows(growth).at(-1).mile,104);
for(const url of ['javascript:alert(1)','https://youtube.com.evil.test/watch?v=MQif1qWGxQ0','http://youtu.be/MQif1qWGxQ0','https://example.com/shorts/MQif1qWGxQ0',''])assert.equal(data.youtube(url),null);
assert.equal(data.youtube('https://youtu.be/MQif1qWGxQ0').id,'MQif1qWGxQ0');assert.equal(data.youtube('https://www.youtube.com/shorts/MQif1qWGxQ0').portrait,true);assert.equal(data.youtube('https://www.youtube.com/watch?v=IAn8hB0_lOM').portrait,false);
const html=read('mogollon2026/index.html'),js=read('mogollon2026/mogollon2026.js'),sw=read('sw.js');
assert.match(html,/rel="canonical" href="https:\/\/batchmath.net\/mogollon2026\/"/);assert.match(html,/Watch the Full Mogollon Monster 100 Video/);assert.match(html,/IAn8hB0_lOM/);assert.match(read('sitemap.xml'),/<loc>https:\/\/batchmath.net\/mogollon2026\/<\/loc>/);
const liveUrl='https://docs.google.com/spreadsheets/d/e/2PACX-1vSk4KcSiCIWnvCibqoiMlieK0ivKTttMMpnoqLKWAIC1wv1hx4LE_TwF63_W3InPnfRJ5sylvvN4fN3/pub?gid=1190649406&single=true&output=csv';
assert.ok(js.includes(`const SHEET_CSV_URL = '${liveUrl}'`));assert.match(js,/cache:'no-store'/);assert.match(js,/credentials:'omit'/);assert.match(js,/_bm_refresh/);assert.match(sw,/url.pathname === '\/mogollon2026\/starter.csv'/);assert.doesNotMatch(js,/innerHTML|eval\(/);
assert.match(read('index.html'),/href="archive\/"/);assert.match(read('index.html'),/href="\/mogollon2026"/);
// Execute the actual SW fetch handler. Merely having a data-URL helper does
// not prove the same-origin starter CSV bypasses the runtime cache.
const handlers={},worker={location:{origin:'https://batchmath.net'},addEventListener:(type,fn)=>handlers[type]=fn};vm.runInNewContext(sw,{self:worker,URL});
for(const url of ['https://batchmath.net/mogollon2026/starter.csv?_bm_refresh=1',liveUrl]){let cached=false;handlers.fetch({request:{method:'GET',url,mode:'cors'},respondWith:()=>{cached=true;}});assert.equal(cached,false,'CSV must bypass the service worker: '+url);}
const response=await fetch(liveUrl+'&_bm_refresh='+Date.now(),{headers:{Accept:'text/csv'}});assert.equal(response.ok,true);const liveText=await response.text();assert.doesNotMatch(liveText,/^\s*<html|^\s*<!doctype/i);const liveRows=data.parseCsv(liveText);assert.deepEqual(liveRows[0],headers);const live=data.normalizeRows(liveRows);assert.ok(live.length>=6);assert.deepEqual(live.map(e=>e.mile),[...live.map(e=>e.mile)].sort((a,b)=>a-b));assert.ok([1,2,3,4,6,7].every(n=>live.some(e=>e.mile===n)));console.log('PASS actual live Mogollon CSV:',live.map(e=>e.mile).join(', '));
console.log('PASS Mogollon schema, six verified published miles, gaps, CSV quotations, publication rules, optional fields, URLs, growth, safe text, and live-only data policy');
