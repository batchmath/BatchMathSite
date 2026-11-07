import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {serve,browser,context} from './review-lab/lib/browser.mjs';
import {exerciseAnsweredEnter} from './answered-enter-browser-qa.mjs';
import {exerciseUnit1Approved} from './unit1-approved-browser-qa.mjs';
const cases=[['unit1-approved',null,173],['power-rule','ap_topic_derivatives_with_the_power_rule',1040000],['ftc','ap_topic_fundamental_theorem_of_calculus',1040000],['prep-trig','calc_prep_trig_equations',1040000],['prep-circle','calc_prep_unit_circle_values',1040000],['rectangular-one','ap_topic_rectangular_approximations',1040000],['rectangular-two','ap_topic_rectangular_approximations',1040001]];
const port=10979,server=await serve(port),b=await browser(),results=[];
const out=process.env.HOTFIX_CASE_OUT||'docs/unit2-hotfix/evidence/seven-browser-cases.json';
try{
 for(const [name,id,seed] of cases)for(const legacy of [false,true]){
  if(process.env.HOTFIX_CASES&&!process.env.HOTFIX_CASES.split(',').includes(name))continue;
  const c=await context(b);
  // Match the production seeded suite: verify the local UI, excluding external CDN availability.
  await c.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='127.0.0.1'||u.hostname==='localhost')route.continue();else route.abort();});
  const r={case:name,seed,editor:legacy?'legacy':'mathlive',errors:[]};
  c.on('page',p=>{p.on('pageerror',e=>{r.errors.push(e.message);if(process.env.HOTFIX_DEBUG)console.log('PAGE ERROR',e.stack);});if(!id)p.on('close',()=>{r.answerEvidence=p._answerEvidence||[];});p.setDefaultTimeout(12000);});
  try{
   if(!id)r.checks=await exerciseUnit1Approved(c,'http://127.0.0.1:'+port,{legacy});
   else{
    r.route=execFileSync('rg',['-l','engineId:"'+id+'"','.','--glob','index.html'],{encoding:'utf8'}).trim().replace(/^\.\//,'');
    const p=await c.newPage();await p.goto(`http://127.0.0.1:${port}/${r.route}?bm_seed=${seed}${legacy?'&editor=legacy':''}`,{waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>window.BatchMathRepro?.problemCount===1);
    r.flow=await exerciseAnsweredEnter(p);r.answerEvidence=p._answerEvidence||[];
    if(name.startsWith('rectangular')&&r.flow.parts!==(name.endsWith('one')?1:2))throw Error('Wrong rectangular fixture part count');
    if(!legacy&&!r.answerEvidence.length)throw Error('No actual MathLive serialization was recorded');
   }
   if(r.errors.length)throw Error(r.errors.join('; '));r.passed=true;
  }catch(e){r.passed=false;r.failure=e.stack;}
  finally{await c.close();results.push(r);fs.writeFileSync(out,JSON.stringify({results},null,2)+'\n');}
  console.log(name,r.editor,r.passed?'PASS':'FAIL',r.failure?.split('\n')[0]||'');
 }
}finally{await b.close();await new Promise(r=>server.close(r));}
if(results.some(r=>!r.passed))process.exitCode=1;
