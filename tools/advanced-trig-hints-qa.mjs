#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const page=fs.readFileSync(path.join(root,'ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/practice/index.html'),'utf8');
const code=[...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const families=[]'));
let seed=173;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const source=code.slice(0,code.indexOf('  let current=null'))+'globalThis.test={families,numValue,lesson,rat};})();';
const ctx={BatchMathRNG:{random},window:{},document:{getElementById(){}}};vm.runInNewContext(source,ctx);
// Independent parser/evaluator for the elementary TeX used by this engine.
// Checks identities at ordinary nonzero x and limit values from both sides.
function evaluate(s,vars={x:.173}){
  s=s.replace(/\\(sin|cos|tan|sec|csc|cot)\s+(\d*x)/g,'\\$1($2)');
  s=s.replace(/\\(?:left|right|displaystyle)\b/g,'').replace(/\\[,!; ]/g,'').replace(/\\cdot/g,'*').replace(/\s/g,'');
  const tokens=s.match(/\\[A-Za-z]+|\d+(?:\.\d+)?|[A-Za-z]|[-+*/^(){}\[\]]/g)||[];let i=0;
  const take=()=>tokens[i++],peek=()=>tokens[i];
  const fn={sin:Math.sin,cos:Math.cos,tan:Math.tan,sec:x=>1/Math.cos(x),csc:x=>1/Math.sin(x),cot:x=>1/Math.tan(x)};
  function group(){const t=peek();if(['{','(','['].includes(t)){take();const v=expr();assert.equal(take(),{'{':'}','(':')','[':']'}[t],s);return v;}return atom();}
  function atom(){
    const t=take();if(t===undefined)throw Error('Missing atom: '+s);
    if(t==='+')return atom();if(t==='-')return -atom();
    if(['{','(','['].includes(t)){i--;return group();}
    if(t==='\\frac')return group()/group();
    if(t==='\\sqrt')return Math.sqrt(group());
    if(t==='\\pi')return Math.PI;
    if(fn[t.slice(1)]&&t.startsWith('\\')){
      let power=1;if(peek()==='^'){take();power=group();}
      let arg=group();if(/^\d/.test(tokens[i-1]||'')&&peek()==='x'){take();arg*=vars.x;}
      return fn[t.slice(1)](arg)**power;
    }
    if(/^\d/.test(t))return Number(t);
    if(t in vars)return vars[t];throw Error('Unknown token '+t+' in '+s);
  }
  function power(){let v=atom();if(peek()==='^'){take();v**=group();}return v;}
  const begins=t=>t&&t!==')'&&t!==']'&&t!=='}'&&t!=='+'&&t!=='-';
  function product(){let v=power();while(begins(peek())){if(peek()==='*'){take();v*=power();}else if(peek()==='/'){take();v/=power();}else v*=power();}return v;}
  function expr(){let v=product();while(peek()==='+'||peek()==='-'){const op=take();const w=product();v=op==='+'?v+w:v-w;}return v;}
  const v=expr();assert.equal(i,tokens.length,'unparsed '+s);assert(Number.isFinite(v),'nonfinite '+s);return v;
}
function close(a,b,where,tol=1e-8){assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${where}: ${a} != ${b}`);}
function limitParts(q){
  let s=q.replace(/^\\\(\\displaystyle\s*\\lim_/,''),depth=0,end=0;
  for(;end<s.length;end++){if(s[end]==='{')depth++;if(s[end]==='}'&&!--depth)break;}
  const target=s.slice(1,end).replace(/^x\\to\s*/,'');return {target:evaluate(target),expr:s.slice(end+1).replace(/\\\)$/,'')};
}
let samples=0,identities=0;const variants=new Set();
for(let n=0;n<150;n++)for(const family of ctx.test.families){
  const p=family.make();samples++;variants.add(p.id.split('-')[0]);
  assert(p.hint?.length>25,`${family.id} missing hint`);assert(p.sol.startsWith('<ol'),family.id);
  assert(!/second.order|first.order|behaves like|conceptually|undefined|NaN/i.test(p.hint+p.sol),family.id+' unclear text');
  assert(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(p.hint+p.sol),'control character');
  const {target,expr}=limitParts(p.q),h=family.id==='perfect-square'?.008:target===0?.0008:.00003;
  const at=t=>(evaluate(expr,{x:target+t})+evaluate(expr,{x:target-t}))/2;
  const approx=(4*at(h/2)-at(h))/3;close(approx,ctx.test.numValue(p.ans),p.id+' limit',2e-5);
  const vars={x:.173};
  for(const m of p.sol.matchAll(/\\\[([\s\S]*?)\\\]/g)){
    for(let line of m[1].split(/,\\qquad/)){
    line=line.trim();
    if(/^[UV]=/.test(line)){for(const assignment of line.split(/,\\qquad/)){const [key,value]=assignment.split('=');vars[key.trim()]=evaluate(value,vars);}continue;}
    if(line.includes('\\longrightarrow')){
      const [before,after]=line.split('\\longrightarrow');
      if(before.includes('=')){const parts=before.split('=').map(s=>evaluate(s,vars));for(const v of parts)close(v,parts[0],p.id+' identity');identities++;}
      const parts=after.split('=').map(s=>evaluate(s,vars));for(const v of parts)close(v,parts[0],p.id+' limit arithmetic');identities++;
    }else if(line.includes('=')){
      const parts=line.split('=').map(s=>evaluate(s,vars));for(const v of parts)close(v,parts[0],p.id+' identity/arithmetic');identities++;
    }
    }
  }
}
// Full production controller, with minimal DOM elements and real event handlers.
const els=new Map();function el(id){if(!els.has(id))els.set(id,{id,style:{},dataset:{},hidden:false,disabled:false,value:'',innerHTML:'',textContent:'',className:'',events:{},addEventListener(t,fn){this.events[t]=fn},setAttribute(k,v){this[k]=v},focus(){},setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b},click(){this.events.click?.()}});return els.get(id);}
const quickKeys=[...page.matchAll(/<button class="quick"[^>]*data-(insert|action)="([^"]+)"[^>]*>/g)].map((m,i)=>{const b=el('quick-'+i);b.dataset[m[1]]=m[2];return b;});
let generated=0,checked=0,lastProblem;const sb={BatchMathRNG:{random},window:{BMAnalytics:{ensurePracticeStarted(){},problemGenerated(p){generated++;lastProblem=p;},answerChecked(){checked++},solutionRevealed(){}}},document:{getElementById:el,querySelectorAll:s=>s==='.quick'?quickKeys:[]},Promise};vm.createContext(sb);vm.runInContext(fs.readFileSync(path.join(root,'assets/unit1-practice-ui.js'),'utf8'),sb);vm.runInContext(code.replace("  function showHint(){", "  window.testParseAnswer=parseAnswer;\n  function showHint(){"),sb);
for(const token of ['1','2','/','3'])quickKeys.find(b=>b.dataset.insert===token).click();assert.equal(el('answer').value,'12/3');quickKeys.find(b=>b.dataset.action==='clear').click();assert.equal(el('answer').value,'');el('answer').setSelectionRange(0,0);
// Exercise insertion, cursor placement, exiting the root, and submission.
assert.equal(quickKeys.filter(b=>b.dataset.action==='sqrt').length,1);
assert(!quickKeys.some(b=>/sqrt/.test(b.dataset.insert||'')));
quickKeys.find(b=>b.dataset.action==='sqrt').click();
assert.equal(el('answer').value,'√()');assert.equal(el('answer').selectionStart,2);
quickKeys.find(b=>b.dataset.insert==='2').click();
quickKeys.find(b=>b.dataset.action==='right').click();
quickKeys.find(b=>b.dataset.insert==='/').click();
quickKeys.find(b=>b.dataset.insert==='3').click();
assert.equal(el('answer').value,'√(2)/3');
el('answer').value='';el('answer').setSelectionRange(0,0);
const before=el('question').innerHTML;el('answer').value='7/9';el('hint').click();
assert.equal(generated,1);assert.equal(checked,0);assert.equal(el('answer').value,'7/9');assert.equal(el('question').innerHTML,before);assert.equal(el('hint-panel').hidden,false);assert.equal(el('next').style.display,'none');
el('hint').click();assert.equal(el('hint-panel').hidden,true);
el('new').click();assert.equal(generated,2);assert.equal(el('hint-panel').innerHTML,'');assert.equal(el('hint')['aria-expanded'],'false');
el('answer').value='';el('check').click();assert.equal(checked,0);assert.equal(el('feedback').dataset.answerState,'invalid');
el('answer').value='1234567';el('check').click();assert.equal(checked,1);assert.equal(generated,2);assert(el('feedback').innerHTML.includes('method-steps'));assert.equal(el('next').style.display,'inline-block');
el('next').click();assert.equal(generated,3);assert.equal(el('feedback').innerHTML,'');
el('answer').value=String(ctx.test.numValue(lastProblem.ans));el('check').click();assert.equal(checked,2);assert.equal(el('correct').textContent,1);assert.equal(el('method').style.display,'inline-block');el('method').click();assert(el('feedback').innerHTML.includes('method-steps'));el('method').click();assert.equal((el('feedback').innerHTML.match(/method-steps/g)||[]).length,1);
for(const raw of ['undefined','1/0','garbage']){el('next').click();const n=checked;el('answer').value=raw;el('check').click();assert.equal(checked,n);assert.equal(el('check').disabled,false);}
for(const raw of ['DNE','infinity','-infinity']){el('next').click();const n=checked;el('answer').value=raw;el('check').click();assert.equal(checked,n+1);assert.equal(el('check').disabled,true);}
for(const [raw,want] of [['√(5)',Math.sqrt(5)],['sqrt(2)',Math.sqrt(2)],['sqrt3',Math.sqrt(3)],['2√(3)/5',2*Math.sqrt(3)/5],['1/√(2)',1/Math.sqrt(2)],['√(1/4)',.5],['√(2)+√(8)',3*Math.sqrt(2)],['√(√(16))',2],['(√(3)+1)/(√(3)-1)',2+Math.sqrt(3)]]){
  close(sb.window.testParseAnswer(raw),want,'radical parser '+raw);
}
// A radical equivalent of each generated expected answer must score correct.
for(let j=0;j<100;j++){
  el('next').click();const a=lastProblem.ans,n=checked,c=Number(el('correct').textContent);
  el('answer').value=`${a.n<0?'-':''}√(${a.n*a.n*(a.rad||1)})/${a.d}`;
  el('check').click();assert.equal(checked,n+1);assert.equal(Number(el('correct').textContent),c+1);
}
for(const raw of ['√()','√(-2)','1/√(0)','√(2','sqrt(2)junk','√(2)/0']){
  el('next').click();const n=checked;el('answer').value=raw;el('check').click();assert.equal(checked,n);assert.equal(el('check').disabled,false);
}
const example=ctx.test.lesson('cos-over-xsin',{a:2,b:4,m:2,n:3,g:'sin'},ctx.test.rat(1,3));assert(example.sol.includes('\\frac{1}{3}'));assert(example.hint.includes('conjugate'));
const report={ok:true,families:ctx.test.families.length,samples,identities,controller:'PASS',browser:'not run'};
fs.mkdirSync(path.join(root,'qa-results'),{recursive:true});fs.writeFileSync(path.join(root,'qa-results/advanced-trig-hints-qa.json'),JSON.stringify(report,null,2));console.log(report);
