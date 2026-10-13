#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[];
const stats={};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const sandbox={window:{BatchMathRNG:{random:rng(1)}},console,Math};
vm.createContext(sandbox);
for(const file of ['assets/ap-topic-generators.js','assets/unit3-applications-generators.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),sandbox);
const get=slug=>sandbox.window.BatchMathAPTopicGenerators.get(slug);
function generate(slug,seed,options={}){sandbox.window.BatchMathRNG={random:rng(seed)};return get(slug)(options);}
function expect(condition,message){if(!condition)errors.push(message);}

const APPROX_CHOICES=[
  'Overestimate because the function is concave up on the interval',
  'Overestimate because the function is concave down on the interval',
  'Underestimate because the function is concave up on the interval',
  'Underestimate because the function is concave down on the interval'
];
{
  const families=new Set(),methods={tangent:0,secant:0};
  for(let i=1;i<=8000;i++){
    const p=generate('tangent-and-secant-line-approximations',i*2654435761);
    families.add(p.variant);methods[p.approximationMethod]++;
    expect(p.answerType==='staged-calculus',`approximation: non-staged problem ${p.id}`);
    expect(p.stage1?.type==='exact'&&Number.isFinite(Number(p.stage1.numericAnswer)),`approximation: invalid exact Part 1 ${p.id}`);
    expect(p.stage1?.keypadMode==='unit3-approximation',`approximation: wrong keypad mode ${p.id}`);
    expect(p.stage2?.type==='choice'&&JSON.stringify(p.stage2.choices)===JSON.stringify(APPROX_CHOICES),`approximation: fixed Part 2 choices changed ${p.id}`);
    const estimate=p.approximationMethod==='tangent'?(p.concavity==='up'?'Underestimate':'Overestimate'):(p.concavity==='up'?'Overestimate':'Underestimate');
    const expected=estimate+' because the function is concave '+p.concavity+' on the interval';
    expect(p.stage2?.choices?.[p.stage2.correctIndex]===expected,`approximation: concavity mapping is wrong ${p.id}`);
    expect(/Step 1:/.test(p.stage1?.explanation||'')&&/Step 2:/.test(p.stage2?.explanation||''),`approximation: incomplete worked explanation ${p.id}`);
  }
  expect(families.size>=14,`approximation: only ${families.size} families sampled`);
  expect(methods.tangent>3500&&methods.secant>3500,`approximation: tangent/secant split is unbalanced ${JSON.stringify(methods)}`);
  stats.approximation={families:[...families].sort(),methods};
}

{
  const theoremStats={};
  for(const theorem of ['mvt','rolle']){
    let applies=0;const families=new Set();
    for(let i=1;i<=10000;i++){
      const p=generate('rolle-s-theorem-and-the-mean-value-theorem',(i*2246822519+(theorem==='rolle'?71:0))>>>0,{mvtMode:theorem});
      families.add(p.variant);if(p.theoremApplies)applies++;
      expect(p.answerType==='staged-calculus'&&p.theoremKind===theorem,`theorem: wrong focused generator ${theorem}/${p.id}`);
      expect(p.stage1?.type==='choice'&&p.stage1.choices.length===(theorem==='rolle'?5:4),`theorem: wrong Part 1 choices ${p.id}`);
      expect(p.stage1.correctIndex>=0&&p.stage1.correctIndex<p.stage1.choices.length,`theorem: invalid reason index ${p.id}`);
      if(p.theoremApplies){
        expect(p.stage2?.type==='exact-list'&&p.stage2.expectedValues.every(Number.isFinite),`theorem: missing c-value stage ${p.id}`);
        expect(p.stage2.keypadMode==='unit3-theorem',`theorem: wrong c-value keypad ${p.id}`);
      }else expect(!p.stage2,`theorem: failure problem incorrectly asks for c ${p.id}`);
      expect(/Step 1:/.test(p.stage1?.explanation||''),`theorem: hypotheses are not worked ${p.id}`);
      if(p.stage2)expect(/Step 1:/.test(p.stage2.explanation)&&/(?:differentiat|derivative|f(?:'|′)\(|\\frac\{d)/i.test(p.stage2.explanation),`theorem: c solution is incomplete ${p.id}`);
    }
    const share=applies/10000;
    expect(share>.72&&share<.78,`theorem: ${theorem} applies share ${share.toFixed(3)} is not 75%`);
    expect(families.size>=10,`theorem: ${theorem} has only ${families.size} sampled families`);
    theoremStats[theorem]={appliesShare:share,families:[...families].sort()};
  }
  stats.theorems=theoremStats;
}

{
  const counts={none:0,zero:0,infinity:0,product:0},families=new Set();
  for(let i=1;i<=20000;i++){
    const p=generate('l-hopital-s-rule',(i*3266489917)>>>0);
    counts[p.lhopitalForm]++;families.add(p.variant);
    expect(p.answerType==='staged-calculus',`L'Hopital: non-staged problem ${p.id}`);
    expect(/\\displaystyle\\lim\\limits_/.test(p.questionHtml),`L'Hopital: malformed centered limit ${p.id}`);
    expect(p.stage1?.type==='choice'&&p.stage1.choices.length===4,`L'Hopital: wrong decision choices ${p.id}`);
    if(p.lhopitalApplies){
      expect(p.stage2?.type==='exact'&&Number.isFinite(Number(p.stage2.numericAnswer)),`L'Hopital: invalid exact Part 2 ${p.id}`);
      expect(p.stage2.keypadMode==='unit3-limit',`L'Hopital: wrong Part 2 keypad ${p.id}`);
    }else expect(!p.stage2,`L'Hopital: non-applicable problem has Part 2 ${p.id}`);
    if(p.lhopitalForm==='product')expect(/Rewrite/i.test(p.stage1.explanation),`L'Hopital: product rewrite missing ${p.id}`);
    expect(/Step 1:/.test(p.stage1?.explanation||''),`L'Hopital: form explanation missing ${p.id}`);
    if(p.stage2)expect(/Step 1:/.test(p.stage2.explanation),`L'Hopital: limit work missing ${p.id}`);
  }
  const noShare=counts.none/20000,yes=20000-counts.none,zeroShare=counts.zero/yes;
  expect(noShare>.18&&noShare<.22,`L'Hopital: non-applicable share ${noShare.toFixed(3)} is not 20%`);
  expect(zeroShare>.77&&zeroShare<.83,`L'Hopital: 0/0 share among applicable ${zeroShare.toFixed(3)} is not 80%`);
  expect(counts.infinity>1000&&counts.product>1000,`L'Hopital: infinity/product families are underrepresented ${JSON.stringify(counts)}`);
  expect(families.size>=20,`L'Hopital: only ${families.size} families sampled`);
  stats.lhopital={counts,noShare,zeroShare,families:[...families].sort()};
}

{
  const keypad=fs.readFileSync(path.join(ROOT,'assets/calculus-keypad.js'),'utf8');
  const im1=fs.readFileSync(path.join(ROOT,'assets/im1-unit3-practice.js'),'utf8');
  const practice=fs.readFileSync(path.join(ROOT,'assets/ap-topic-practice.js'),'utf8');
  for(const mode of ['unit3-number','unit3-formula','unit3-equation','unit3-recursive','unit3-approximation','unit3-theorem','unit3-limit'])expect(keypad.includes('"'+mode+'"'),`keypad: missing ${mode}`);
  expect(/keypadMode:'unit3-approximation'/.test(fs.readFileSync(path.join(ROOT,'assets/unit3-applications-generators.js'),'utf8')),`keypad: tangent/secant does not request its focused keypad`);
  expect(/equation:'unit3-equation'.*formula:'unit3-formula'.*recursive:'unit3-recursive'.*number:'unit3-number'/.test(im1),`keypad: IM1 field-type routing is missing`);
  expect(/pendingStageAdvance/.test(practice)&&/blockEnterAdvance/.test(practice)&&/enterAdvanceAllowed/.test(practice),`staging: guarded Enter behavior is missing`);
  expect(!/mountInputs\(inputs,byId\('answerArea'\),\{mode:'unit3'/.test(im1),`keypad: IM1 still mounts the catch-all Unit 3 keypad`);
}

{
  const workflow=path.join(ROOT,'.github/workflows/batchmath-qa.yml');
  expect(fs.existsSync(workflow),'packaging: .github/workflows/batchmath-qa.yml is missing');
}

const report={ok:errors.length===0,errors,stats};
fs.mkdirSync(path.join(ROOT,'qa-results'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'qa-results/v121-staged-keypad-qa.json'),JSON.stringify(report,null,2)+'\n');
if(errors.length){console.error(errors.slice(0,80).join('\n'));console.error(`FAILED with ${errors.length} error(s)`);process.exit(1);}
console.log(JSON.stringify(stats,null,2));
console.log('Version 12.1 targeted staged/keypad QA passed.');
