import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const approved=JSON.parse(fs.readFileSync(new URL('docs/unit2-hotfix/evidence/preservation.json',root)));
const blob=s=>createHash('sha1').update(`blob ${Buffer.byteLength(s)}\0`).update(s).digest('hex');
// Reconcile only the exact two reviewed prompt edits; every other byte is guarded.
export function withoutInversePromptHotfix(source,name){
 const entry=approved.pages.find(p=>p.path===name);if(!entry)return source;
 assert.equal(blob(source),entry.afterBlob,name+': unexpected hotfix revision');
 const before=execFileSync('git',['show',approved.baseline+':'+name],{cwd:root,encoding:'utf8'});
 assert.equal(blob(before),entry.beforeBlob);
 let normalized=source;
 for(const family of ['iv-exp-','iv-log-']){
  const line=source.split('\n').find(l=>l.includes(family));
  const old=before.split('\n').find(l=>l.includes(family));
  assert.equal(line.replace('Let g be the inverse of f. ',''),old.replace('Let g=f⁻¹. ',''));
  normalized=normalized.replace(line,old);
 }
 assert.equal(normalized,before,name+': change outside inverse prompts');
 return before;
}
