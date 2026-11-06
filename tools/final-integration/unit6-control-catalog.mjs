// Compare generated Unit 6 canonical/explicitly listed setup forms with the actual registered control specifications.
// This is a grammar inventory; real-browser entry and grading are reported separately.
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {load} from '../review-lab/unit6/qa/lib.mjs';
import {parseInput} from '../../assets/mathlive/answer-adapter.mjs';

const registered={};
const api={registerProfile:(name,spec)=>registered[name]=spec,createPad(){}};
const L=load(['unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js'],{BatchMathCalculusKeypad:api});
const sourceText=process.env.UNIT6_PROFILE_SOURCE_REF?execFileSync('git',['show',process.env.UNIT6_PROFILE_SOURCE_REF+':assets/mathlive/unit6.mjs'],{encoding:'utf8'}):fs.readFileSync(new URL('../../assets/mathlive/unit6.mjs',import.meta.url),'utf8');
const source=sourceText.replace(/^import .*;\s*$/gm,'').replace('export const profiles=','const profiles=');
const fn=()=>{};
vm.runInNewContext(source,{window:{BatchMathCalculusKeypad:api},installDynamicFields:fn,translateAdvancedExpression:fn,exactList:fn,listToLatex:fn,intervalsWithNone:fn,intervalsWithNoneToLatex:fn,roundedNumber:fn,translateIntegralSetup:fn,setupToLatex:fn});
const W=L.W,ENG=[['BatchMathUnit6Area','make','FAMILIES'],['BatchMathUnit6Area','makeY','FAMILIES_Y'],['BatchMathUnit6Volume','makeCS','FAMILIES_CS'],['BatchMathUnit6Volume','makeSolid','FAMILIES_SOLID'],['BatchMathUnit6FRQ','make','FAMILIES'],['BatchMathUnit6Piecewise','make','FAMILIES']];
const kt=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});
const N=+(process.env.UNIT6_CATALOG_SAMPLES||25),out={profileSource:process.env.UNIT6_PROFILE_SOURCE_REF||'current integration',samplesPerFamilyTierKind:N,problems:0,typedParts:0,setupParts:0,listedAlternativeSetups:0,profiles:registered,missingControls:[],parseIssues:[],fields:[]};
function needs(tree,set) {
 if(!tree||typeof tree!=='object')return;
 if(tree.type==='num'&&tree.raw.includes('.'))set.add('decimal');
 if(tree.type==='sym') {
  if(['pi','e'].includes(tree.name))set.add('constant:'+tree.name);
  else if(['infinity','Infinity','infty'].includes(tree.name))set.add('infinity');
  else if(/^(none|dne|undefined)$/i.test(tree.name))set.add(tree.name.toLowerCase());
  else set.add('variable:'+tree.name);
 }
 if(tree.type==='fraction')set.add('fraction');
 if(tree.type==='binary'&&tree.op==='^')set.add('exponent');
 if(tree.type==='list')set.add('list');
 if(tree.type==='call') {
  if(tree.name==='sqrt')set.add('radical');
  else if(tree.name==='root'||tree.name==='cbrt')set.add(tree.name==='cbrt'||tree.args[0]?.raw==='3'?'cubeRoot':'nthRoot');
  else if(tree.name==='ln')set.add('logarithm');
  else if(tree.name==='exp'){set.add('constant:e');set.add('exponent');}
  else set.add('function:'+tree.name);
 }
 for(const value of Object.values(tree))if(Array.isArray(value))value.forEach(x=>needs(x,set));else if(value&&typeof value==='object')needs(value,set);
}
function requirement(raw,set,record) {
 const tex=String(raw).replace(/\\(?:left|right)/g,'').replace(/\\cup/g,'U').replace(/\\ /g,'');
 const parsed=parseInput(tex,'latex');
 if(parsed.status==='complete'){needs(parsed.tree,set);return;}
 if(/^[[(]/.test(tex)&&/[)\]]$/.test(tex)) {
  set.add('list');if(/[\[\]]/.test(tex))set.add('brackets');if(tex.includes('U'))set.add('union');
  for(const interval of tex.split(/\s*U\s*/)) {
   const pair=interval.slice(1,-1).split(',');
   for(const endpoint of pair)requirement(endpoint,set,record);
  }
 } else out.parseIssues.push({...record,raw,status:parsed.status,message:parsed.message});
}
function available(spec,need) {
 if(need==='cubeRoot')return spec.cubeRoot||spec.nthRoot;
 if(need.startsWith('constant:'))return spec.constants?.includes(need.slice(9));
 if(need.startsWith('variable:'))return spec.variables?.includes(need.slice(9));
 if(need.startsWith('function:'))return spec.functions?.some(f=>f[1]===need.slice(9));
 return !!spec[need];
}
for(const [name,method,registry] of ENG)for(const [family,f] of Object.entries(W[name][registry]))for(const calc of ['calculator','non-calculator'])for(const tier of kt(f)[calc==='calculator'?'calculator':'noncalculator'])for(let i=0;i<N;i++) {
 const seed=i*7919+family.length*31+tier.length;L.seed(seed);let q;try{q=W[name][method]({family,tier,calc});}catch{continue;}out.problems++;
 for(const [partIndex,p] of q.parts.entries()) {
  if(p.control==='choice')continue;
  const record={name,method,family,calc,tier,seed,questionId:q.id,partIndex,control:p.control||'input',answerTex:p.answerTex};
  const required=new Set();let profile=p.keypadMode;
  if(p.control==='u6-integral') {
   profile=p.answer.decimals?'ml-unit6-setup-calc':'ml-unit6-setup';out.setupParts++;
   const forms=[p.answer.rows,...(p.answer.altRows||[])];out.listedAlternativeSetups+=forms.length-1;
   for(const rows of forms)for(const row of rows)for(const piece of ['coef','lower','upper','integrand'])if(row[piece])requirement(row[piece],required,record);
  } else {
   const raw=(p.answerTex||'').replace(/^.*?=/,'').replace(/[a-z]=/g,'');
   requirement(raw,required,record);
  }
  const spec=registered[profile];
  const missing=spec?[...required].filter(n=>!available(spec,n)):['unregistered:'+profile];
  if(missing.length)out.missingControls.push({...record,profile,missing,required:[...required]});
  out.fields.push({...record,profile,required:[...required],missing});out.typedParts++;
 }
}
fs.writeFileSync(process.env.UNIT6_CATALOG_OUT||'docs/final-integration/evidence/unit6/control-catalog.json',JSON.stringify(out,null,2)+'\n');
console.log({problems:out.problems,typedParts:out.typedParts,setups:out.setupParts,alternatives:out.listedAlternativeSetups,missing:out.missingControls.length,parseIssues:out.parseIssues.length});
console.log(out.missingControls.slice(0,6));console.log(out.parseIssues.slice(0,3));
