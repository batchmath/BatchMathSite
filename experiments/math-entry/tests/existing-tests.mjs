// Run existing tests without writing their normal root-level qa-results directory.
// Only report destinations are redirected; production code and assertions are unchanged.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from './checkers.mjs';
const output=path.join(root,'experiments/math-entry/test-artifacts/existing-tests');
const originalWrite=fs.writeFileSync,originalMkdir=fs.mkdirSync;
function destination(file){const target=path.resolve(String(file)),reports=path.join(root,'qa-results');if(target===reports||target.startsWith(reports+path.sep))return output+target.slice(reports.length);if(target.startsWith(path.join(root,'experiments/math-entry')+path.sep))return target;throw Error('Existing test attempted an out-of-scope write: '+target);}
fs.mkdirSync=(file,...args)=>originalMkdir(destination(file),...args);
fs.writeFileSync=(file,...args)=>originalWrite(destination(file),...args);
const results=[];process.chdir(root);
const originalExit=process.exit;
process.exit=code=>{throw Object.assign(Error('Existing test requested process.exit('+code+'). See its report above.'),{exitCode:code});};
for(const file of ['calculus-keypad-structure-qa.mjs','fraction-sign-equivalence-qa.mjs','ftc-checker-regression-qa.mjs','sitewide-fractional-exponent-qa.mjs']) {
  try{await import(pathToFileURL(path.join(root,'tools',file)));results.push({test:file,passed:true});}
  catch(error){const passed=error.exitCode===0;results.push({test:file,passed,error:error.message});if(!passed)console.error('FAIL',file,error.message);}
}
process.exit=originalExit;
originalMkdir(output,{recursive:true});originalWrite(path.join(output,'summary.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));if(results.some(r=>!r.passed))process.exitCode=1;
