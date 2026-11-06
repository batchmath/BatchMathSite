import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const approved=JSON.parse(fs.readFileSync(root+'tools/keypad-completeness/approved-corrections.json'));
// Verify exact approved bytes before reconciling the historical source guard.
// Any additional edit fails the hash check. Functional tests use current files.
export function withoutApprovedKeypadCorrections(source,name='assets/calculus-keypad.js'){
  if(!approved.assets[name])return source;
  const bytes=Buffer.from(source),hash=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(hash,approved.assets[name].after,name+': unapproved change beyond keypad corrections');
  const before=execFileSync('git',['show',approved.baseline+':'+name],{cwd:root,encoding:'utf8',maxBuffer:8000000});
  const old=Buffer.from(before);assert.equal(createHash('sha1').update(`blob ${old.length}\0`).update(old).digest('hex'),approved.assets[name].before);
  return before;
}
// Narrow allowance for the two authorized mirror-focus routes.
export function withoutHiddenInputFocusRoutes(source) {
  return source
    .replace('\n      input.focus=()=>{if(!input.disabled)activateBinding(binding,true);};','')
    .replace('\n    input.focus=()=>{if(!input.disabled)editor.focus({preventScroll:true});};','');
}
