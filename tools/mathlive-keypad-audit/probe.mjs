import fs from 'node:fs';import vm from 'node:vm';
let seed=42;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const profiles={},window={BatchMathRNG:{random},BatchMathCalculusKeypad:{registerProfile:(k,v)=>profiles[k]=v}},document={addEventListener(){},querySelectorAll(){return[];},getElementById(){return null;}};
const box={window,document,console,Math:Object.create(Math),setTimeout(){}};box.Math.random=random;vm.createContext(box);
for(const name of ['derivative-expression-checker','unit4-exact-answers','ap-topic-generators','unit5-core','unit5-answers','unit5-basic','unit5-motion','unit5-slope-fields','unit5-separable','unit5-growth','unit5-rate','unit5-review','im1-unit2-generators','im1-unit3-generators','unit1-practice-ui','unit1-core-expansions'])vm.runInContext(fs.readFileSync('assets/'+name+'.js','utf8'),box,{filename:name});
const s=fs.readFileSync('assets/calculus-keypad.js','utf8'),m=s.match(/const contextualUnit3=(\{[\s\S]*?\})\[mode\]/);Object.assign(profiles,vm.runInContext('('+m[1]+')',box));
const records=[],errors=[];
for(const [course,registry,slugs] of [['AP',window.BatchMathAPTopicGenerators,window.BatchMathAPTopicGenerators.slugs()],['IM1-U2',window.BatchMathIM1Unit2Generators,window.BatchMathIM1Unit2Generators.slugs],['IM1-U3',window.BatchMathIM1Unit3Generators,window.BatchMathIM1Unit3Generators.list()]]){
 for(const slug of slugs){if(/area-below|finding-area|piecewise-defined-functions|solids-of-revolution|volume-by-cross|unit-6/.test(slug))continue;
  const schemas=new Map(),families=new Set();let generated=0;const examples=[];
  for(let i=0;i<16;i++)try{seed=42+i*719;const p=registry.get(slug)({});generated++;families.add(p.unit4Meta?.family||p.unit5Meta?.family||p.variant||p.kind||'unspecified');
   function walk(x,path){if(!x||typeof x!=='object')return;if(x.keypadMode){const k=path.replace(/\d+/g,'*')+'|'+x.keypadMode+'|'+(x.answer?.kind||x.unit4Answer?.kind||x.type||'');schemas.set(k,{field:path.replace(/\d+/g,'*'),profile:x.keypadMode,kind:x.answer?.kind||x.unit4Answer?.kind||x.type||'',example:x.answerTex||'',answer:x.answer||x.unit4Answer});}
    if(x.fields)for(const [i,v]of x.fields.entries())schemas.set('field-'+(v.check||v.inputKind||'value'),{field:'fields: '+(v.check||v.inputKind||'value'),profile:'dispatcher/local',kind:v.check||v.inputKind||'value',example:v.answerText||String(v.answer||'')});
    for(const [k,v]of Object.entries(x))if(['parts','stage1','stage2'].includes(k)){if(Array.isArray(v))v.forEach((y,j)=>walk(y,path+'.'+k+'.'+j));else walk(v,path+'.'+k);}}
   walk(p,'answer');if(!p.parts&&!p.stage1&&!p.keypadMode)schemas.set(p.answerType||p.kind||'choice',{field:p.answerType||p.kind||'choice',profile:'dispatcher/local',kind:p.answerType||p.kind||'choice',example:p.answerTex||p.answerText||String(p.answer||'')});
   if(examples.length<2)examples.push({id:p.id,answer:p.answerTex||p.answerText||'',kind:p.answerType||p.kind||'',family:[...families].at(-1)});
  }catch(e){if(!errors.some(x=>x.course===course&&x.slug===slug))errors.push({course,slug,error:e.message});}
  records.push({course,slug,generated,families:[...families],schemas:[...schemas.values()].map(({answer,...r})=>r),examples});
 }
}
const probes=[];
for(const raw of ['sqrt(2)','pi','e','ln(e)','log(100)','root(3,8)','2^3','1+1','sin(0)'])probes.push({checker:'BMUnit1UI.parse',raw,result:window.BMUnit1UI.parse(raw)});
vm.runInContext(fs.readFileSync('assets/im1-unit3-practice.js','utf8'),box);
for(const raw of ['3/4','0.75','sqrt(4)','1+1'])probes.push({checker:'IM1 numericEqual target 3/4',raw,result:window.BatchMathIM1Unit3PracticeQA.numericEqual(raw,'3/4')});
vm.runInContext(fs.readFileSync('assets/calc-prep-common.js','utf8'),box);
for(const raw of ['1,0','1','1°','undefined,'])probes.push({checker:'CalcPrep safeExactEval',raw,result:String(window.BMPrep.safeExactEval(raw))});
const numericExample=window.BatchMathIM1Unit3Generators.get('common-difference-next-terms')({});
const field=numericExample.fields[0], alternative=String(Number(field.answer)*2)+'/2';probes.push({checker:'Actual IM1 '+numericExample.id,raw:alternative,expected:field.answer,result:window.BatchMathIM1Unit3PracticeQA.fieldResult(alternative,field)});
const unit5=window.BatchMathUnit5Answers.check;
for(const raw of ['(0,sqrt(2))','[0,sqrt(2))','0<x<sqrt(2)','(0,1)∪(2,3)'])probes.push({checker:'Unit5 interval',raw,result:unit5(raw,{kind:'interval',left:'0',right:'sqrt(2)',validity:true,x0:1})});
const actual=window.BatchMathAPTopicGenerators.get('combining-integral-rules')({});
const target=window.BatchMathUnit4Answers.expression(actual.stage1.unit4Answer.value);
for(const raw of [target,`(${target})+ln(1)`,`(${target})+sin(0)`,`(${target})+sqrt(0)`])probes.push({checker:'Actual Rules '+actual.id,raw,result:window.BatchMathUnit4Answers.check(raw,actual.stage1.unit4Answer)});

console.log(JSON.stringify({profiles,records,errors,probes},null,2));
