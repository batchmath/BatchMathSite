import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');let seed=173,random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const ctx={window:{BatchMathRNG:{random}}};ctx.BatchMathRNG=ctx.window.BatchMathRNG;vm.createContext(ctx);
for(const f of ['ap-topic-generators','unit1-course-trig','unit1-representations','unit1-discontinuities','unit1-practice-ui'])vm.runInContext(read('assets/'+f+'.js'),ctx);
let samples=0;const coverage=new Set(),val=x=>x===Infinity?'\\infty':x===-Infinity?'-\\infty':String(x);
for(const mode of ['table','graph','asymptote'])for(let i=0;i<10000;i++){
 const p=ctx.window.BMUnit1Representations[mode](),d=p.representationData,ans=p.choices[p.correctIndex];coverage.add(mode+':'+d.kind+':'+(d.ask||''));samples++;
 assert.equal(new Set(p.choices).size,p.choices.length);assert(!p.choices.includes('null'));assert(p.explanation.length>50);assert(!/NaN|undefinedundefined/.test(p.questionHtml));
 let expected;
 if(mode==='table'){
  const l=d.kind==='infinite'?d.sign*(d.opposite?-1:1)*Infinity:d.L,r=d.kind==='infinite'?d.sign*Infinity:d.right;
  expected=d.ask==='point'?(d.fa===null?'undefined':String(d.fa)):d.ask==='-'?val(l):d.ask==='+'?val(r):l===r?val(l):'DNE';
  assert.equal(d.xs.length,7);assert.equal(d.ys[3],d.fa);
  for(const j of [0,1,2,4,5,6]){const dx=d.xs[j]-d.a;const y=d.kind==='infinite'?d.sign*(d.opposite?Math.sign(dx):1)/Math.abs(dx):(dx<0?d.L:d.right)+dx;assert(Math.abs(y-d.ys[j])<1e-9);assert(p.questionHtml.includes(Number(y.toFixed(5)).toString()));}
  if(d.ask!=='point')assert(p.explanation.includes('does not prove'));
 }else if(mode==='graph'){
  const l=d.kind==='asymptote'?d.sign*(d.even?1:-1)*Infinity:d.L,r=d.kind==='asymptote'?d.sign*Infinity:d.right;
  expected=d.ask==='point'?(d.fa===null?'undefined':String(d.fa)):d.ask==='continuity'?(d.kind==='continuous'?'Yes':'No'):d.ask==='left'?val(l):d.ask==='right'?val(r):l===r?val(l):'DNE';
  if(d.ask==='continuity')assert.equal(p.choices.length,2);
  assert.equal((p.questionHtml.match(/<circle /g)||[]).length,(d.kind==='asymptote'?0:d.L===d.right?1:2)+(d.fa===null?0:1));
  assert(p.questionHtml.includes('<svg'));if(d.kind==='jump')assert.notEqual(d.L,d.right);
  if(i<12)fs.writeFileSync(path.join(root,'qa-results',`unit1-graph-${i}.svg`),p.questionHtml.match(/<svg[\s\S]*?<\/svg>/)[0]);
 }else expected=d.kind==='crossing'?'No':d.kind==='horizontal'?`y=${d.L}`:d.kind==='vertical'?`x=${d.a}`:`y=${d.L} and y=${d.right}`;
 assert.equal(ans,expected,p.id);
}
assert.equal([...coverage].filter(x=>x.startsWith('graph:')).length,20);assert.equal([...coverage].filter(x=>x.startsWith('table:')).length,11);assert.equal([...coverage].filter(x=>x.startsWith('asymptote:')).length,4);
const parse=ctx.window.BMUnit1UI.parse;
for(const v of ['', 'undefined','1/0','foo','(1/2','1)/2','0/0'])assert(parse(v).error,v);
for(const v of ['-1/2','-.5','-0.50','1/-2'])assert.equal(parse(v).value,-.5,v);
for(const v of ['inf','+infinity','∞'])assert.equal(parse(v).sign,1);
assert.equal(parse('-∞').sign,-1);assert.equal(parse('DNE').kind,'dne');
// Minimal DOM runs production controllers and real callbacks, without claiming browser coverage.
class E{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={};this.listeners={};this.value='';this.hidden=false;this.disabled=false;this.className='';this._html='';this.textContent='';this.classList={add:(...a)=>this.className+=' '+a.join(' '),remove:(...a)=>this.className=this.className.split(' ').filter(x=>!a.includes(x)).join(' '),contains:x=>this.className.split(' ').includes(x),toggle:(x,on)=>on?this.classList.add(x):this.classList.remove(x)};}
 set innerHTML(s){this._html=s;this.children=[];if(s.includes('<input'))this.appendChild(new E('input'));}get innerHTML(){return this._html;}
 appendChild(e){e.parent=this;this.children.push(e);return e;}append(...a){a.forEach(e=>this.appendChild(e));}remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}after(){}focus(){}setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}setAttribute(k,v){this[k]=v;}addEventListener(k,f){this.listeners[k]=f;}click(){if(!this.disabled)this.listeners.click?.({currentTarget:this});}
 querySelectorAll(s){const all=this.children.flatMap(x=>[x,...x.querySelectorAll('*')]);return s==='*'?all:all.filter(x=>s==='button'?x.tagName==='BUTTON':s==='input'?x.tagName==='INPUT':s.startsWith('.')?x.classList.contains(s.slice(1)):false);}querySelector(s){return this.querySelectorAll(s)[0]||null;}
}
function harness(route,shared=false,slug='introduction-to-limits'){const html=read(route),els={},doc={body:new E(),createElement:t=>new E(t),getElementById:id=>els[id]||(els[id]=new E()),addEventListener(){},querySelectorAll:s=>Object.values(els).flatMap(e=>e.querySelectorAll(s)),createTreeWalker:()=>({nextNode:()=>false})};let generated=[],checked=[];const w={BatchMathRNG:{random},BMAnalytics:{problemGenerated:p=>generated.push(p),answerChecked:(p,ok)=>checked.push(ok),ensurePracticeStarted(){},solutionRevealed(){}},addEventListener(){}};const c={window:w,BatchMathRNG:w.BatchMathRNG,document:doc,NodeFilter:{SHOW_TEXT:4},setTimeout:()=>0,clearTimeout(){},console};vm.createContext(c);
 for(const f of ['ap-topic-generators','unit1-course-trig','unit1-representations','unit1-discontinuities','unit1-practice-ui'])vm.runInContext(read('assets/'+f+'.js'),c);
 if(shared){w.BM_TOPIC_PRACTICE={unit1:true,slug,modeSelectId:'representation-mode'};doc.getElementById('representation-mode').value='tables';vm.runInContext(read('assets/ap-topic-practice.js'),c);}
 else{doc.getElementById('category').value='continuous';let code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const generators='));vm.runInContext(code,c);}
 return{els,doc,w,generated,checked};}
const rel='ap-calculus/unit-1-limits-continuity/topics/';let flows=0;
for(const name of ['basic-techniques-indeterminate-limits','limits-of-continuous-functions','one-sided-limits','limits-at-infinity','comprehensive-review']){
 const h=harness(rel+name+'/practice/index.html'),{els,generated,checked}=h;for(const v of ['', 'undefined','1/0','nonsense']){els.answer.value=v;els.submit.click();assert.equal(checked.length,0);assert.equal(generated.length,1);assert.equal(els.answer.disabled,false);flows++;}
 const p=generated.at(-1);els.answer.value=String(p.ans.n/p.ans.d);els.submit.click();assert.deepEqual(checked,[true]);assert.equal(generated.length,1);assert.equal(els.next.style.display,'inline-block');assert(!els.feedback.innerHTML.includes(p.sol));els.feedback.querySelector('button').click();assert.equal(els.feedback.children.at(-1).innerHTML,p.sol);els.submit.click();assert.equal(checked.length,1);els.next.click();assert.equal(generated.length,2);els.answer.value='123456789';els.submit.click();assert.equal(checked.at(-1),false);assert(els.feedback.innerHTML.includes(generated.at(-1).sol));flows++;
 if(name==='basic-techniques-indeterminate-limits'){els.category.value='all';for(let i=0;i<1000;i++){els.category.listeners.change();assert(['continuous','factoring','substitution','rationalizing','complex'].includes(generated.at(-1).cat));}}
 if(name==='comprehensive-review')for(const cat of ['tables','graphs','parameters','ivt']){els.category.value=cat;els.category.listeners.change();const p=generated.at(-1),host=els['u1-options'];host.children[p.correctIndex].click();assert.equal(checked.at(-1),true);flows++;}
}
{
 const h=harness(rel+'introduction-to-limits/practice/index.html',true),{els,generated,checked}=h;els.choices.children[generated[0].correctIndex].click();assert.deepEqual(checked,[true]);assert.equal(generated.length,1);assert.equal(els.next.hidden,false);assert(els.feedback.querySelector('button'));els.next.click();els['representation-mode'].value='graphs';els['representation-mode'].listeners.change();assert(generated.at(-1).variant.startsWith('graph_'));flows++;
}
// Exercise classification stages, repeated locations, invalid entry and set scoring.
for(const wrong of [false,true]){const host=new E(),w=ctx.window;ctx.document={createElement:t=>new E(t)};let score=[];w.BMUnit1UI.render({points:[{x:1,type:'removable',why:'Finite matching limit but the point is missing.'},{x:2,type:'jump',why:'Unequal finite one-sided limits.'}]},host,ok=>score.push(ok));const stage=host.children[0],note=host.children[1];
 let input=stage.querySelector('input');input.value='1/0';stage.querySelector('button').click();assert.equal(score.length,0);assert(note.innerHTML.includes('zero'));input.value='2/2';stage.querySelector('button').click();stage.children[wrong?1:0].click();stage.children[1].click();input=stage.querySelector('input');input.value='1.0';stage.querySelector('button').click();assert(note.innerHTML.includes('already'));assert.equal(input.disabled,false);input.value='2';stage.querySelector('button').click();stage.children[1].click();stage.children[0].click();assert.deepEqual(score,[!wrong]);flows++;}
// Run the standalone classification controller, including its timed stage transitions.
for(let run=0;run<20;run++){
 const els={},timers=[],types=['removable','jump','infinite'].map(type=>{const e=new E('button');e.dataset.type=type;e.className='type-choice';return e;});
 const get=id=>els[id]||(els[id]=new E());let p,score=[];const w={BMUnit1UI:ctx.window.BMUnit1UI,BMAnalytics:{ensurePracticeStarted(){},problemGenerated:q=>p=q,answerChecked:(q,ok)=>score.push(ok),solutionRevealed(){}}};
 const doc={getElementById:get,createElement:t=>new E(t),querySelectorAll:s=>s==='.type-choice'?types:s==='#no-more,#another'?[get('no-more'),get('another')]:[]};
 const c={window:w,document:doc,BatchMathRNG:{random},setTimeout:fn=>timers.push(fn)};
 // Each controller has its own method renderer and DOM.
 vm.createContext(c);vm.runInContext(read('assets/unit1-practice-ui.js'),c);
 const code=[...read(rel+'introduction-to-continuity/practice/index.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(x=>x.includes('function numeric(raw)'));
 vm.runInContext(code,c);const flush=()=>{while(timers.length)timers.shift()();};flush();
 get('location').value='1/0';get('check-location').click();assert.equal(score.length,0);assert.equal(get('location').disabled,false);
 for(let i=0;i<p.points.length;i++){
  if(i){get('location').value=String(p.points[0].x);get('check-location').click();assert(get('location-feedback').textContent.includes('already'));assert.equal(get('location').disabled,false);}
  get('location').value=String(p.points[i].x*2)+'/2';get('check-location').click();types.find(e=>e.dataset.type===p.points[i].type).click();assert(get('point-explanation').querySelector('button'));get(i<p.points.length-1?'another':'no-more').click();flush();
 }
 assert.deepEqual(score,[true]);assert(get('more-feedback').querySelector('button'));flows++;
}

{
 const h=harness(rel+'squeeze-theorem-trigonometric-limits/course-practice/index.html',true,'squeeze-course-practice'),{els,generated,checked}=h;
 for(let i=0;i<40;i++){
  const p=generated.at(-1),input=els.choices.children[0],check=els.choices.children[1];assert.equal(p.answerType,'numeric');input.value='';input.setSelectionRange(0,0);const keys=els.choices.children[2].children;
  for(const label of ['1','a/b','2'])keys.find(b=>b.textContent===label).click();assert.equal(input.value,'1/2');
  for(const raw of ['', 'undefined','1/0']){const n=checked.length;input.value=raw;check.click();assert.equal(checked.length,n);assert.equal(input.disabled,false);}
  const n=generated.length;input.value=String(p.numericAnswer);check.click();assert.equal(checked.at(-1),true);assert.equal(generated.length,n);assert(els.feedback.querySelector('button'));assert(keys.every(b=>b.disabled));els.next.click();flows++;
 }
}
const report={ok:true,samples,familiesAndPrompts:coverage.size,controllerFlows:flows,browser:'not run: Chromium unavailable; download timed out'};fs.writeFileSync(path.join(root,'qa-results/unit1-approved-qa.json'),JSON.stringify(report,null,2));console.log(report);
