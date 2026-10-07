#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const errors=[],warnings=[],stats={};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const sandbox={window:{BatchMathRNG:{random:rng(1)}},console,Math};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/ap-topic-generators.js'),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/unit3-applications-generators.js'),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/line-equation-checker.js'),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/derivative-expression-checker.js'),'utf8'),sandbox);
const get=slug=>sandbox.window.BatchMathAPTopicGenerators.get(slug);
const lineChecker=sandbox.window.BatchMathLineEquations;
const expressionChecker=sandbox.window.BatchMathDerivativeExpressions;
function gen(slug,seed,mode,extra={}){sandbox.window.BatchMathRNG={random:rng(seed)};const fn=get(slug);if(typeof fn!=='function')throw new Error(`Missing ${slug}`);return fn({...extra,mode});}
const topics={
 'equations-of-tangent-and-normal-lines':['noncalculator'],
 'horizontal-and-vertical-tangent-lines':['noncalculator'],
 'horizontal-and-vertical-tangent-lines-implicitly':['noncalculator','calculator'],
 'using-your-graphing-calculator':['calculator'],
 'motion':['noncalculator','calculator'],
 'absolute-and-local-extrema-and-the-extreme-value-theorem':['noncalculator'],
 'increasing-decreasing-intervals-concavity-and-extrema':['noncalculator','calculator'],
 'linearization-and-differentials':['noncalculator'],
 'newton-s-method-for-approximating-roots-of-a-function':['calculator'],
 'tangent-and-secant-line-approximations':['noncalculator'],
 'rolle-s-theorem-and-the-mean-value-theorem':['noncalculator'],
 'l-hopital-s-rule':['noncalculator'],
 optimization:['noncalculator','calculator'],
 'related-rates':['noncalculator','calculator']
};
function scan(p,slug,mode){
 if(!p||typeof p!=='object'){errors.push(`${slug}/${mode}: no problem object`);return;}
 const all=[p.questionHtml,p.explanation,p.answerTex,p.lineAnswer?.equation,p.lineAnswer?.answerTex,...(p.choices||[])].filter(Boolean).join(' ');
 if(p.calculatorActive!==(mode==='calculator'))errors.push(`${slug}/${mode}: calculatorActive mismatch ${p.id}`);
 if(!['assignment','test'].includes(p.sourceKind))errors.push(`${slug}/${mode}: missing sourceKind ${p.id}`);
 if(/\^\{1\}|\^1(?!\d)/.test(all))errors.push(`${slug}/${mode}: displayed power of 1 ${p.id}`);
 if(/\+\s*-|-\s*-|x--/.test(all))errors.push(`${slug}/${mode}: malformed signs ${p.id}`);
 if(/\\(?:dfrac|tfrac|frac)\{\s*-/.test(all))errors.push(`${slug}/${mode}: negative sign left inside a displayed fraction ${p.id}`);
 if(/(?:^|[+\-=({\s])1(?=[a-zA-Z]|\\(?:sin|cos|tan|sec|csc|cot|ln|log|sqrt))/.test(all.replace(/\d+\.\d+/g,'')))errors.push(`${slug}/${mode}: unnecessary coefficient 1 ${p.id}`);
 if(p.answerType==='line-equation'){
   if(!p.lineAnswer?.equation||!p.lineAnswer?.answerTex)errors.push(`${slug}/${mode}: incomplete typed line answer ${p.id}`);
   const parsed=lineChecker.parseEquation(p.lineAnswer?.equation||'');if(!parsed.ok)errors.push(`${slug}/${mode}: generated line does not parse ${p.id}: ${parsed.error}`);
   const self=lineChecker.check(p.lineAnswer?.equation||'',p.lineAnswer||{});if(!self.correct)errors.push(`${slug}/${mode}: generated line does not accept itself ${p.id}`);
   if(Array.isArray(p.choices))errors.push(`${slug}/${mode}: typed line problem still has choices ${p.id}`);
   if(p.lineAnswer?.requiredVariable){
     const v=p.lineAnswer.requiredVariable,scaled=`2${v}=2*(${String(p.lineAnswer.equation).split('=').slice(1).join('=')})`,strict=lineChecker.check(scaled,p.lineAnswer);
     if(strict.correct||strict.prefixCorrect)errors.push(`${slug}/${mode}: ${v}= format is not enforced ${p.id}`);
   }
 }else if(p.answerType==='numeric'){
   if(!Number.isFinite(Number(p.numericAnswer)))errors.push(`${slug}/${mode}: non-finite numeric answer ${p.id}`);
   if(!(Number(p.numericTolerance)>0))errors.push(`${slug}/${mode}: bad numeric tolerance ${p.id}`);
   if(mode==='calculator'){
     const places=slug==='newton-s-method-for-approximating-roots-of-a-function'?Number(p.requiredDecimals):3;
     if(slug==='newton-s-method-for-approximating-roots-of-a-function'&&![9,10].includes(places))errors.push(`${slug}/${mode}: Newton response does not require 9 or 10 decimals ${p.id}`);
     if(slug!=='newton-s-method-for-approximating-roots-of-a-function'&&p.requiredDecimals!==3)errors.push(`${slug}/${mode}: numeric response does not require exactly three decimals ${p.id}`);
     if(!new RegExp(`^-?\\d+\\.\\d{${places}}$`).test(String(p.answerTex)))errors.push(`${slug}/${mode}: final calculator answer has wrong decimal format ${p.id}`);
     if(!new RegExp(`${places===3?'three':places} decimal`,'i').test(p.questionHtml||''))errors.push(`${slug}/${mode}: decimal direction missing ${p.id}`);
   }
 }else if(p.answerType==='exact-expression'){
   if(!Array.isArray(p.acceptedExpressions)||!p.acceptedExpressions.length)errors.push(`${slug}/${mode}: exact response has no accepted expressions ${p.id}`);
   else if(!p.acceptedExpressions.some(answer=>expressionChecker.equivalent(String(p.expressionAnswer),String(answer),[{}],1e-7)))errors.push(`${slug}/${mode}: exact response rejects itself ${p.id}`);
   if(Array.isArray(p.choices))errors.push(`${slug}/${mode}: exact typed problem still has choices ${p.id}`);
 }else if(p.answerType==='text-answer'){
   if(!Array.isArray(p.acceptedText)||!p.acceptedText.length)errors.push(`${slug}/${mode}: text response has no accepted values ${p.id}`);
   if(Array.isArray(p.choices))errors.push(`${slug}/${mode}: text problem still has choices ${p.id}`);
 }else if(p.answerType==='interval-answer'){
   if(!p.intervalAnswer?.expected||!/^[[(].+[)\]](?:U[[(].+[)\]])*$/.test(String(p.intervalAnswer.expected)))errors.push(`${slug}/${mode}: malformed interval answer ${p.id}`);
   if(mode==='calculator'&&p.intervalAnswer?.requiredDecimals!==3)errors.push(`${slug}/${mode}: interval response does not require exactly three decimals ${p.id}`);
   if(mode==='calculator'&&!/three decimal/i.test(p.questionHtml||''))errors.push(`${slug}/${mode}: interval rounding direction missing ${p.id}`);
   if(Array.isArray(p.choices))errors.push(`${slug}/${mode}: interval problem still has choices ${p.id}`);
 }else if(p.answerType==='approximation-fields'){
   if(!Number.isFinite(Number(p.approximationAnswer?.value))||!['under','over'].includes(p.approximationAnswer?.classification))errors.push(`${slug}/${mode}: bad typed approximation object ${p.id}`);
 }else if(p.answerType==='value-list'){
   if(!['x','y','t','c'].includes(p.valueList?.variable))errors.push(`${slug}/${mode}: value-list variable missing ${p.id}`);
   if(!Array.isArray(p.valueList?.values)||!p.valueList.values.length||p.valueList.values.some(v=>!Number.isFinite(Number(v))))errors.push(`${slug}/${mode}: invalid value-list answer ${p.id}`);
   if(new Set((p.valueList?.values||[]).map(Number)).size!==(p.valueList?.values||[]).length)errors.push(`${slug}/${mode}: duplicate value-list answer ${p.id}`);
   if(Array.isArray(p.choices))errors.push(`${slug}/${mode}: value-list problem still has choices ${p.id}`);
 }else if(p.answerType==='rounded-line-fields'){
   if(!Array.isArray(p.roundedLines)||!p.roundedLines.length||p.roundedLines.length>4)errors.push(`${slug}/${mode}: invalid rounded-line field count ${p.id}`);
   for(const field of p.roundedLines||[]){if(!['x','y'].includes(field.variable)||!Number.isFinite(Number(field.value))||!/^[-]?\d+\.\d{3}$/.test(String(field.answerText)))errors.push(`${slug}/${mode}: invalid rounded-line field ${p.id}`);if(Math.abs(Number(field.answerText)-Math.round(Number(field.answerText)))<1e-12)errors.push(`${slug}/${mode}: calculator answer is not a non-nice decimal ${p.id}`);}
   if(Array.isArray(p.choices))errors.push(`${slug}/${mode}: rounded-line problem still has choices ${p.id}`);
	 }else if(p.answerType==='coordinate-fields'){
	   if(!p.pointAnswer||!['x','y'].every(key=>p.pointAnswer[key]!=null))errors.push(`${slug}/${mode}: incomplete coordinate answer ${p.id}`);
	   else for(const key of ['x','y']){try{expressionChecker.evaluate(expressionChecker.parse(String(p.pointAnswer[key])),{});}catch(_){errors.push(`${slug}/${mode}: invalid ${key}-coordinate ${p.id}`);}}
	   if(Array.isArray(p.choices))errors.push(`${slug}/${mode}: coordinate problem still has choices ${p.id}`);
	 }else if(p.answerType==='ordered-pair'){
	   if(!p.pointAnswer||!['x','y'].every(key=>p.pointAnswer[key]!=null))errors.push(`${slug}/${mode}: incomplete ordered-pair answer ${p.id}`);
	   else for(const key of ['x','y']){try{expressionChecker.evaluate(expressionChecker.parse(String(p.pointAnswer[key])),{});}catch(_){errors.push(`${slug}/${mode}: invalid ordered-pair ${key}-coordinate ${p.id}`);}}
	   if(Array.isArray(p.choices))errors.push(`${slug}/${mode}: ordered-pair problem still has choices ${p.id}`);
	 }else if(p.answerType==='extremum-fields'){
	   if(!p.extremumAnswer||!['maximum','minimum'].includes(p.extremumAnswer.kind)||p.extremumAnswer.value==null||p.extremumAnswer.location==null)errors.push(`${slug}/${mode}: incomplete extremum fields ${p.id}`);
	   else for(const key of ['value','location']){try{expressionChecker.evaluate(expressionChecker.parse(String(p.extremumAnswer[key])),{});}catch(_){errors.push(`${slug}/${mode}: invalid extremum ${key} ${p.id}`);}}
	   if(Array.isArray(p.choices))errors.push(`${slug}/${mode}: extremum-fields problem still has choices ${p.id}`);
	 }else{
   const evt=/^evt_/.test(p.variant||'');
   if(!evt||!p.retainChoices)errors.push(`${slug}/${mode}: unapproved answer choices ${p.id}`);
   if(!Array.isArray(p.choices)||p.choices.length!==2||!p.choices.includes('Yes')||!p.choices.includes('No'))errors.push(`${slug}/${mode}: EVT must have exactly Yes and No ${p.id}`);
   if(!Number.isInteger(p.correctIndex)||p.correctIndex<0||p.correctIndex>1)errors.push(`${slug}/${mode}: invalid EVT correctIndex ${p.id}`);
 }
}
for(const [slug,modes] of Object.entries(topics)){
 for(const mode of modes){
   let test=0,assignment=0,extension=0,course=0;const families=new Set();
   for(let i=1;i<=6000;i++){
     const p=gen(slug,(i*2654435761+slug.length*97+(mode==='calculator'?12345:0))>>>0,mode);scan(p,slug,mode);families.add(p.variant);p.sourceKind==='test'?test++:assignment++;if(p.formulaGroup==='extension')extension++;if(p.formulaGroup==='course')course++;
   }
   const testShare=test/(test+assignment);stats[`${slug}:${mode}`]={testShare,families:[...families].sort(),extensionShare:extension+course?extension/(extension+course):null};
   if(testShare<.125||testShare>.175)errors.push(`${slug}/${mode}: test share ${testShare.toFixed(3)} outside 15% tolerance`);
   if(['optimization','related-rates'].includes(slug)){
     const ext=extension/(extension+course);if(ext<.225||ext>.275)errors.push(`${slug}/${mode}: extension formula share ${ext.toFixed(3)} outside 25% tolerance`);
   }
   if(families.size<2)errors.push(`${slug}/${mode}: insufficient family variety`);
 }
}

for(const slug of ['equations-of-tangent-and-normal-lines','horizontal-and-vertical-tangent-lines']){
 for(let i=1;i<=4000;i++){const p=gen(slug,(i*3266489917)>>>0,'noncalculator');if(p.answerType!=='line-equation')errors.push(`${slug}: non-typed problem leaked: ${p.variant}`);}
}
for(let i=1;i<=4000;i++){
 const p=gen('horizontal-and-vertical-tangent-lines-implicitly',(i*668265263)>>>0,'noncalculator');
 if(!['line-equation','value-list'].includes(p.answerType))errors.push(`implicit non-calculator: non-typed problem leaked: ${p.variant}`);
 if(p.answerType==='line-equation'&&!['x','y'].includes(p.lineAnswer?.requiredVariable))errors.push(`implicit non-calculator: missing x=/y= requirement ${p.variant}`);
 if(/\bthrough\b/i.test(p.questionHtml||''))errors.push(`implicit non-calculator: supplied-point tangent prompt leaked ${p.id}`);
}

// Targeted tangent-line rebuild checks: distribution, family coverage, display cleanup, and exact rounding contracts.
{
 let implicit=0;const implicitFamilies=new Set();
 for(let i=1;i<=12000;i++){
  const p=gen('equations-of-tangent-and-normal-lines',(i*374761393)>>>0,'noncalculator');
  if(p.variant.startsWith('implicit_')){implicit++;implicitFamilies.add(p.variant.replace(/_(?:tangent|normal)$/,''));}
  if(/shifted_quartic/.test(p.variant)||/\([^)]*x[^)]*\)\^4/.test(p.questionHtml)&&/expanded_quartic/.test(p.variant))errors.push(`tangent/normal: unexpanded shifted quartic leaked ${p.id}`);
 }
 const share=implicit/12000;if(share<.27||share>.33)errors.push(`tangent/normal: implicit share ${share.toFixed(3)} is not about 30%`);
 if(implicitFamilies.size<16)errors.push(`tangent/normal: only ${implicitFamilies.size} implicit families found`);
}
{
 const needed=new Set(['horizontal_polynomial_quadratic_derivative','horizontal_polynomial_factoring_by_grouping','horizontal_polynomial_variable_substitution']);
 for(let i=1;i<=8000;i++){
  const p=gen('horizontal-and-vertical-tangent-lines',(i*1103515245)>>>0,'noncalculator');needed.delete(p.variant);
  if(/e\^\{-\(/.test(p.questionHtml)||/\\sqrt(?:\[\d+\])?\{\([^}]+\)\^/.test(p.questionHtml)||/\\sqrt\{\(x/.test(p.questionHtml))errors.push(`explicit H/V: unnecessary grouped shift leaked ${p.id}`);
 }
 if(needed.size)errors.push(`explicit H/V: missing polynomial-solving families ${[...needed].join(', ')}`);
}
{
 const coordinates=new Set(),calculatorFamilies=new Set();
 for(let i=1;i<=10000;i++){
  const exact=gen('horizontal-and-vertical-tangent-lines-implicitly',(i*214013)>>>0,'noncalculator');if(exact.answerType==='value-list')coordinates.add(exact.variant);
  if(/right-hand|left-hand/i.test(exact.questionHtml||''))errors.push(`implicit non-calculator: directional wording leaked ${exact.id}`);
  const calc=gen('horizontal-and-vertical-tangent-lines-implicitly',(i*2531011)>>>0,'calculator');calculatorFamilies.add(calc.variant);
  if(calc.answerType!=='rounded-line-fields')errors.push(`implicit calculator: old answer type leaked ${calc.variant}`);
  if(/\d+\.\d+/.test(calc.questionHtml))errors.push(`implicit calculator: decimal appears in given problem ${calc.id}`);
  if(!/three decimals/i.test(calc.questionHtml))errors.push(`implicit calculator: rounding direction missing ${calc.id}`);
 }
 if(coordinates.size<6)errors.push(`implicit non-calculator: only ${coordinates.size} coordinate-list families found`);
 if(calculatorFamilies.size<10)errors.push(`implicit calculator: only ${calculatorFamilies.size} families found`);
}
{
 const families=new Set();
 for(let i=1;i<=8000;i++){
  const p=gen('using-your-graphing-calculator',(i*1664525)>>>0,'calculator');families.add(p.variant);
  if(/critical number|second derivative is shown|find (?:its|the) zero/i.test(p.questionHtml||''))errors.push(`calculator skills: removed prompt type leaked ${p.id}`);
  if(!/(x-intercept|slope|maximum|minimum|f'\()/i.test((p.questionHtml||'').replace(/<[^>]*>/g,' ')))errors.push(`calculator skills: unapproved task wording ${p.id}`);
 }
 if(families.size<10)errors.push(`calculator skills: only ${families.size} approved families found`);
}
{
 const exactFamilies=new Set(),calcFamilies=new Set(),exactTasks=new Map(),calcTasks=new Map();
 const task=p=>{const v=p.variant||'';if(/acceleration_first_direction/.test(v))return'acceleration_at_direction_change';if(/velocity_when_position/.test(v))return'velocity_when_position';if(/acceleration_when_position/.test(v))return'acceleration_when_position';if(/acceleration_when_velocity/.test(v))return'acceleration_when_velocity';if(/direction_change/.test(v))return'direction_change';if(/position_speed|speed_composite|speed_radical|test_motion_speed/.test(v))return'position_speed';if(/position_velocity/.test(v))return'position_velocity';if(/velocity_speed/.test(v))return'velocity_speed';if(/velocity_acceleration/.test(v))return'velocity_acceleration';if(/position_acceleration|acceleration_log_trig/.test(v))return'position_acceleration';return'unknown';};
 for(let i=1;i<=10000;i++){
  const exact=gen('motion',(i*22695477)>>>0,'noncalculator'),calc=gen('motion',(i*1103515245)>>>0,'calculator');
  exactFamilies.add(exact.variant);calcFamilies.add(calc.variant);
  exactTasks.set(task(exact),(exactTasks.get(task(exact))||0)+1);calcTasks.set(task(calc),(calcTasks.get(task(calc))||0)+1);
  if(!['exact-expression','value-list'].includes(exact.answerType))errors.push(`motion non-calculator: response is not typed ${exact.id}`);
  if(Array.isArray(exact.choices))errors.push(`motion non-calculator: answer choices leaked ${exact.id}`);
  if(!/(velocity|speed|acceleration|chang(?:e|es) direction)/i.test(exact.questionHtml||''))errors.push(`motion non-calculator: unapproved task leaked ${exact.id}`);
  if(/When is the particle speeding up|moving to the (?:right|left)|distance traveled|displacement/i.test(exact.questionHtml||''))errors.push(`motion non-calculator: removed task leaked ${exact.id}`);
  if(/(?:s|v)\(t\)=\([^)]*t[^)]*\)\([^)]*t/.test(exact.questionHtml||''))errors.push(`motion non-calculator: factored given function leaked ${exact.id}`);
  if(!/(velocity|speed|acceleration|chang(?:e|es) direction)/i.test(calc.questionHtml||''))errors.push(`motion calculator: unapproved task leaked ${calc.id}`);
  if(calc.answerType!=='numeric'||calc.requiredDecimals!==3)errors.push(`motion calculator: non-strict calculator response leaked ${calc.id}`);
  if(/trigonometric/.test(exact.variant)&&/t=0(?:\D|$)/.test((exact.questionHtml||'').replace(/<[^>]*>/g,' ')))errors.push(`motion non-calculator: trig evaluation at zero leaked ${exact.id}`);
  if((exact.motionExplanationSteps||0)<2||!exact.motionSpecificWork||!/Step 1:.*Step 2:/s.test(exact.explanation||''))errors.push(`motion non-calculator: concrete worked steps missing ${exact.id}`);
  if(/Carry out the calculation|Identify whether the displayed function/i.test(exact.explanation||''))errors.push(`motion non-calculator: generic wrapper leaked ${exact.id}`);
  if(/position_(?:acceleration)|acceleration_(?:first_direction_change|when_position)|acceleration_log_trig/.test(exact.variant||'')&&/position is given/i.test(exact.questionHtml||'')){
    const work=exact.explanation||'',vAt=work.indexOf('v(t)'),aAt=work.indexOf('a(t)');
    if(vAt<0||aAt<0||vAt>aAt)errors.push(`motion non-calculator: position-to-acceleration work does not show velocity then acceleration ${exact.id}`);
  }
  if((calc.motionExplanationSteps||0)<2||!calc.motionSpecificWork||!calc.motionMethodsSeparated||!/Method 1: Differentiate by hand.*Method 2: Use the TI-84 Plus CE/is.test(calc.explanation||''))errors.push(`motion calculator: separated by-hand/calculator methods missing ${calc.id}`);
  if(/nDeriv/i.test(calc.explanation||''))errors.push(`motion calculator: obsolete nDeriv wording leaked ${calc.id}`);
  if(/position_(?:acceleration)|acceleration_(?:first_direction_change|when_position)|acceleration_log_trig/.test(calc.variant||'')&&/position is given/i.test(calc.questionHtml||'')){
    const work=calc.explanation||'',vAt=work.indexOf('v(t)'),aAt=work.indexOf('a(t)');
    if(vAt<0||aAt<0||vAt>aAt)errors.push(`motion calculator: position-to-acceleration work does not show velocity then acceleration ${calc.id}`);
    if(!/MATH.*8:d\/dx.*MATH.*8:d\/dx/is.test(work)||!/inner derivative’s evaluation value to \\?\(x\\?\)/i.test(work)||!/outer derivative’s evaluation value to the requested time/i.test(work))errors.push(`motion calculator: nested TI-84 second-derivative directions missing ${calc.id}`);
  }
 }
 if(exactFamilies.size<15)errors.push(`motion non-calculator: only ${exactFamilies.size} family variants found`);
 if(calcFamilies.size<11)errors.push(`motion calculator: only ${calcFamilies.size} family variants found`);
 for(const [label,counts] of [['non-calculator',exactTasks],['calculator',calcTasks]]){if(counts.size!==10||counts.has('unknown'))errors.push(`motion ${label}: categories are ${JSON.stringify(Object.fromEntries(counts))}`);for(const [name,count] of counts)if(Math.abs(count/10000-.10)>.02)errors.push(`motion ${label}: ${name} share ${(count/10000).toFixed(3)} is not equal-weighted`);}
}
{
 const families=new Set(),categories=new Map(),forms=new Map();
 for(let i=1;i<=12000;i++){
  const p=gen('absolute-and-local-extrema-and-the-extreme-value-theorem',(i*747796405)>>>0,'noncalculator');families.add(p.variant);
  categories.set(p.extremaCategory,(categories.get(p.extremaCategory)||0)+1);forms.set(p.extremaQuestionForm,(forms.get(p.extremaQuestionForm)||0)+1);
	  if(p.extremaCategory==='evt'){if(!p.retainChoices||p.choices?.length!==2)errors.push(`extrema/EVT: EVT Yes/No exception malformed ${p.id}`);}else if(!['exact-expression','value-list'].includes(p.answerType))errors.push(`extrema/EVT: answer choices leaked ${p.id}`);
	  if(/\(x\)e\^|e\^\{-\(x\)|\(x-[^)]*\)e\^\{-\(x-/.test(p.questionHtml||''))errors.push(`extrema/EVT: unnecessary grouped expression leaked ${p.id}`);
	  if(!p.workedSteps||!p.extremaConcreteSolution||!/Step 1:.*Step 2:.*Step 3:/s.test(p.explanation||''))errors.push(`extrema/EVT: concrete solution steps missing ${p.id}`);
	  if(/Work for this problem|Specific work:|Find the real domain of the function/i.test(p.explanation||''))errors.push(`extrema/EVT: generic-then-specific explanation leaked ${p.id}`);
	  if(p.extremaCategory!=='evt'&&!p.extremaSpecificWork)errors.push(`extrema/EVT: problem-specific calculation missing ${p.id}`);
	  if(p.extremaCategory!=='evt'&&(/requested (?:answer|value)/i.test(p.explanation||'')||!new RegExp(`Therefore the ${String(p.extremaCategory).replace(/-/g,' ')}`).test(p.explanation||'')))errors.push(`extrema/EVT: final conclusion is not category-specific ${p.id}`);
	 }
 for(const name of ['evt','local-maximum','local-minimum','absolute-maximum','absolute-minimum']){const share=(categories.get(name)||0)/12000;if(Math.abs(share-.2)>.025)errors.push(`extrema/EVT: ${name} share ${share.toFixed(3)} is not equal-weighted`);}
 const extremaTotal=12000-(categories.get('evt')||0),location=(forms.get('location')||0)/extremaTotal,value=(forms.get('value')||0)/extremaTotal;if(Math.abs(location-.5)>.03||Math.abs(value-.5)>.03)errors.push(`extrema/EVT: location/value forms are not balanced (${location.toFixed(3)}/${value.toFixed(3)})`);
 if(families.size<10)errors.push(`extrema/EVT: only ${families.size} typed families found`);
}
{
 const exactFamilies=new Set(),calcFamilies=new Set(),exactFocus=new Map(),calcFocus=new Map();
 for(let i=1;i<=30000;i++){
  const p=gen('increasing-decreasing-intervals-concavity-and-extrema',(i*2891336453)>>>0,'noncalculator');exactFamilies.add(p.variant);
  exactFocus.set(p.analysisFocus,(exactFocus.get(p.analysisFocus)||0)+1);
	  if(!['interval-answer','ordered-pair','extremum-fields'].includes(p.answerType))errors.push(`derivative analysis non-calculator: non-typed response leaked ${p.id}`);
  if(!/interval notation/i.test(p.questionHtml||'')&&p.answerType==='interval-answer')errors.push(`derivative analysis non-calculator: interval direction missing ${p.id}`);
  if(!['f','fp','fpp'].includes(p.analysisGiven))errors.push(`derivative analysis non-calculator: source type missing ${p.id}`);
  if(/absolute (?:maximum|minimum|extrem)/i.test(`${p.questionHtml} ${p.explanation}`))errors.push(`derivative analysis non-calculator: absolute extrema leaked ${p.id}`);
	  if(p.analysisFocus==='poi'&&p.answerType!=='ordered-pair')errors.push(`derivative analysis non-calculator: point of inflection did not use one ordered-pair field ${p.id}`);
	  if(p.analysisFocus==='extrema'&&p.answerType!=='extremum-fields')errors.push(`derivative analysis non-calculator: local extremum did not request value and location separately ${p.id}`);
	  if(p.analysisFocus==='extrema'&&!/Find the local (?:maximum|minimum) and where it occurs\./.test(p.questionHtml||''))errors.push(`derivative analysis non-calculator: local-extremum prompt is incorrect ${p.id}`);
	  if(/x\s*-\s*0|x\s*\+\s*0/.test(`${p.questionHtml} ${p.explanation}`))errors.push(`derivative analysis non-calculator: unnecessary x minus/plus zero leaked ${p.id}`);
	  if(/Let\s+\\?\(u\s*=\s*x\^2/i.test(p.explanation||''))errors.push(`derivative analysis non-calculator: unnecessary substitution wording leaked ${p.id}`);
	  if(!p.analysisWorkedSteps||!/class="worked-steps".*Step 1:.*Step 2:.*Step 3:/s.test(p.explanation||''))errors.push(`derivative analysis non-calculator: vertical worked steps missing ${p.id}`);
	  if(p.analysisFocus==='extrema'&&!/derivative changes|signs of .*f′/i.test(p.explanation||''))errors.push(`derivative analysis non-calculator: local-extremum sign chart reasoning missing ${p.id}`);
	  if(p.analysisFocus==='poi'&&!/sign change|changes? from|signs of .*f″/i.test(p.explanation||''))errors.push(`derivative analysis non-calculator: inflection sign-change reasoning missing ${p.id}`);
	  if(p.analysisFocus==='concavity'&&!/(negative|positive).*?(?:left|right|interval)|signs of .*f''/is.test(p.explanation||''))errors.push(`derivative analysis non-calculator: concavity sign work missing ${p.id}`);
	  const workedStepCount=((p.explanation||'').match(/<strong>Step \d+:<\/strong>/g)||[]).length;
	  if(p.analysisFocus==='poi'&&workedStepCount!==4)errors.push(`derivative analysis non-calculator: POI explanation should have exactly four steps ${p.id}`);
	  if(p.analysisFocus==='poi'&&/To find a point of inflection|Step [56]:/i.test(p.explanation||''))errors.push(`derivative analysis non-calculator: redundant POI steps leaked ${p.id}`);
	  if(p.variant==='analysis_inflection_point_coordinates_quartic'&&!/Step 3:.*(?:sign change|changes sign).*point of inflection/is.test(p.explanation||''))errors.push(`derivative analysis non-calculator: quartic POI sign-change conclusion missing ${p.id}`);
	  if(p.variant==='analysis_from_second_derivative_quadratic'&&(workedStepCount!==4||!/Step 4:.*Since we want to know where .*concave (?:up|down).*Therefore .*concave (?:up|down) on.*parentheses/is.test(p.explanation||'')))errors.push(`derivative analysis non-calculator: quadratic concavity conclusion was not consolidated ${p.id}`);
	  if(/Select the intervals with the requested sign|include finite critical endpoints with brackets|Use brackets at the finite critical endpoints/i.test(p.explanation||''))errors.push(`derivative analysis non-calculator: generic interval-selection wording leaked ${p.id}`);
	  if(p.analysisFocus==='incdec'&&!/Since we want to know when .* is (?:increasing|decreasing).*choose the intervals where/s.test(p.explanation||''))errors.push(`derivative analysis non-calculator: requested derivative-sign interpretation missing ${p.id}`);
	  if(p.analysisFocus==='concavity'&&!/Since we want to know where .* is concave (?:up|down).*choose the intervals where/s.test(p.explanation||''))errors.push(`derivative analysis non-calculator: requested second-derivative interpretation missing ${p.id}`);
	  for(const match of (`${p.questionHtml} ${p.explanation}`).matchAll(/\\\(([\s\S]*?)\\\)/g))if(/[<>]/.test(match[1]))errors.push(`derivative analysis non-calculator: raw inequality broke MathJax ${p.id}`);
  const c=gen('increasing-decreasing-intervals-concavity-and-extrema',(i*1181783497)>>>0,'calculator');calcFamilies.add(c.variant);
  calcFocus.set(c.analysisFocus,(calcFocus.get(c.analysisFocus)||0)+1);
  if(!['numeric','interval-answer'].includes(c.answerType))errors.push(`derivative analysis calculator: unexpected response type ${c.id}`);
  if(/1\.x/.test(c.questionHtml||''))errors.push(`derivative analysis calculator: broken decimal leaked ${c.id}`);
  if(c.answerType==='numeric'&&(c.requiredDecimals!==3||!/^[-]?\d+\.\d{3}$/.test(String(c.answerTex))))errors.push(`derivative analysis calculator: numeric answer is not strict three-decimal ${c.id}`);
  if(!['fp','fpp'].includes(c.analysisGiven)||/f\(x\)\s*=/.test(c.questionHtml||''))errors.push(`derivative analysis calculator: original function leaked ${c.id}`);
	  if(!c.calculatorWorked||!/TI-84 Plus.*2nd.*TRACE.*2:zero/is.test(c.explanation||''))errors.push(`derivative analysis calculator: TI-84 zero/sign method missing ${c.id}`);
	  if(!c.calculatorRequired||!c.painfulMixedFunction||!c.nonNiceRoot||!c.calculatorValidated||!/^analysis_calculator_validated_/.test(c.variant||''))errors.push(`derivative analysis calculator: a validated calculator-required family was not used ${c.id}`);
	  if(!Number.isFinite(c.numericalRoot)||Math.abs(c.numericalRoot-Math.round(c.numericalRoot*4)/4)<.01)errors.push(`derivative analysis calculator: root is missing or too neat ${c.id}`);
	  if(!/Step 1:.*Step 2:.*Step 3:.*graph of .*x-axis.*(?:positive|negative)/is.test(c.explanation||''))errors.push(`derivative analysis calculator: graph-based sign work missing ${c.id}`);
	  if(/Use a test value|Check the sign on both sides|Therefore the requested x-location/i.test(c.explanation||''))errors.push(`derivative analysis calculator: obsolete or redundant explanation step leaked ${c.id}`);
	  if(!/(?:\\sin|\\cos|\\ln|e\^|\\tan\^\{-1\})/.test(c.questionHtml||'')||!c.calculatorAudit?.allRootsNonNice||!c.calculatorAudit?.rootStabilityValidated||!c.calculatorAudit?.signChangeValidated)errors.push(`derivative analysis calculator: mixed-function numerical validation missing ${c.id}`);
	  if(/x\^2\s*-\s*16|\(x\s*[+-]\s*\d+\)\s*\(x\s*[+-]\s*\d+\)/.test(c.questionHtml||''))errors.push(`derivative analysis calculator: hand-solvable fallback leaked ${c.id}`);
 }
 for(const [mode,counts] of [['non-calculator',exactFocus],['calculator',calcFocus]])for(const focus of ['incdec','concavity','poi','extrema']){const share=(counts.get(focus)||0)/30000;if(Math.abs(share-.25)>.025)errors.push(`derivative analysis ${mode}: ${focus} share ${share.toFixed(3)} is not equal-weighted`);}
 if(exactFamilies.size<10)errors.push(`derivative analysis non-calculator: only ${exactFamilies.size} families found`);
	 if(calcFamilies.size<13)errors.push(`derivative analysis calculator: only ${calcFamilies.size} families found`);
}
{
	 const renderer=fs.readFileSync(path.join(ROOT,'assets/ap-topic-practice.js'),'utf8');
	 for(const token of ["answerType==='exact-expression'","answerType==='text-answer'","answerType==='interval-answer'","answerType==='value-list'","answerType==='rounded-line-fields'","answerType==='coordinate-fields'","answerType==='ordered-pair'","answerType==='extremum-fields'","answerType==='approximation-fields'",'renderExactExpression','renderTextAnswer','renderIntervalAnswer','renderValueList','renderRoundedLineFields','renderCoordinateFields','renderOrderedPair','renderExtremumFields','renderApproximationFields','mountUnit3Keypad','BatchMathCalculusKeypad.mountInputs','Example: x = a, b, c, …','requiredDecimals','\\d{3}'])if(!renderer.includes(token))errors.push(`practice renderer: missing ${token}`);
 const strictThree=/^[+-]?(?:\d+)?\.\d{3}$/;
 for(const accepted of ['0.000','.500','-.125','12.340','-7.125','+2.500'])if(!strictThree.test(accepted))errors.push(`three-decimal contract rejected ${accepted}`);
 for(const rejected of ['0','12.34','-7.1250','.50','.5000','2.5','2.5000'])if(strictThree.test(rejected))errors.push(`three-decimal contract accepted ${rejected}`);
 if(!renderer.includes('formatOk=!places||new RegExp'))errors.push('practice renderer does not enforce the decimal-format contract before checking value');
 if(!renderer.includes("current?.answered&&!$('next').hidden"))errors.push('practice renderer: Enter-to-next guard is missing');
}

for(const mode of ['noncalculator','calculator']){
 for(const focus of ['incdec','concavity','poi','extrema']){
  const seen=new Set();for(let i=1;i<=1500;i++){const p=gen('increasing-decreasing-intervals-concavity-and-extrema',(i*1597334677+focus.length*31)>>>0,mode,{analysisFocus:focus});seen.add(p.variant);if(p.analysisFocus!==focus)errors.push(`derivative analysis ${mode}: ${focus} leaked ${p.analysisFocus}`);}
  if(seen.size<2)errors.push(`derivative analysis ${mode}: ${focus} has insufficient variety`);
 }
}

{
	 const differentialFamilies=new Set();let linearizations=0,wordProblems=0,reverse=0,oldNew=0,explicit=0;
	 for(let i=1;i<=10000;i++){
	  const p=gen('linearization-and-differentials',(i*1013904223)>>>0,'noncalculator');
	  if(/^differentials_/.test(p.variant||'')){
	   wordProblems++;
	   differentialFamilies.add(p.variant);
	   if(!p.hint||p.hintButtonLabel!=='Show Formula')errors.push(`linearization/differentials: hidden formula hint missing ${p.id}`);
	   if(!/(circle|rectangle|triangle|trapezoid|sphere|cylinder|cone|prism)/i.test(p.questionHtml||''))errors.push(`linearization/differentials: shape is not named ${p.id}`);
	   if(p.differentialDirection==='reverse')reverse++;else if(p.differentialDirection!=='forward')errors.push(`linearization/differentials: direction metadata missing ${p.id}`);
	   if(p.differentialWording==='old-new')oldNew++;else if(p.differentialWording==='explicit-differential')explicit++;else errors.push(`linearization/differentials: wording metadata missing ${p.id}`);
	   if(!p.linearizationSpecificWork||!/Step 1:.*Step 2:.*Step 3:/s.test(p.explanation||''))errors.push(`linearization/differentials: worked steps missing ${p.id}`);
	   if(/Work for this problem|Start with the formula for the named shape|keep only the first-order differential terms/i.test(p.explanation||''))errors.push(`linearization/differentials: generic summary leaked ${p.id}`);
	   if(/\d+\\frac\{[^}]+\}\{[^}]+\}\\pi/.test(`${p.answerTex} ${p.explanation}`))errors.push(`linearization/differentials: mixed-number pi coefficient leaked ${p.id}`);
	 }else{
	  linearizations++;
	  if(!/f′\(x\)=/.test(p.explanation||''))errors.push(`linearization: derivative work missing ${p.id}`);
	  if(!/linearization for this problem is.*L\(x\)=/s.test(p.explanation||''))errors.push(`linearization: problem-specific L(x) formula missing ${p.id}`);
	  if(!/Evaluate it at the requested input/.test(p.explanation||''))errors.push(`linearization: requested input was not substituted ${p.id}`);
	 }
	 }
	 for(const family of ['differentials_trapezoid_area','differentials_circle_circumference','differentials_sphere_surface_area','differentials_cylinder_surface_area','differentials_triangle_included_angle','differentials_right_triangle_hypotenuse'])if(!differentialFamilies.has(family))errors.push(`linearization/differentials: formula-sheet family missing ${family}`);
	 const linearShare=linearizations/10000,reverseShare=reverse/wordProblems,oldNewShare=oldNew/wordProblems;
	 if(Math.abs(linearShare-.125)>.02)errors.push(`linearization/differentials: linearization share ${linearShare.toFixed(3)} is not about 12.5%`);
	 if(Math.abs(reverseShare-.25)>.03)errors.push(`linearization/differentials: reverse-word-problem share ${reverseShare.toFixed(3)} is not about 25%`);
	 if(Math.abs(oldNewShare-.85)>.03)errors.push(`linearization/differentials: old-to-new/natural wording share ${oldNewShare.toFixed(3)} is not about 85%`);
	 if(oldNew+explicit!==wordProblems)errors.push('linearization/differentials: wording counts do not cover every word problem');
}
{
	 for(let i=1;i<=12000;i++){
	  const p=gen('newton-s-method-for-approximating-roots-of-a-function',(i*1664525)>>>0,'calculator'),shown=String(p.answerTex||''),digits=shown.split('.')[1]||'';
	  if(p.newtonBoring)errors.push(`Newton: boring result leaked ${p.id} = ${shown}`);
	  if(/^[-+]?\d+\.0+$/.test(shown)||/^([0-9])\1{5,}$/.test(digits))errors.push(`Newton: trivial/repeating display leaked ${p.id} = ${shown}`);
	  if(!p.newtonFormulaShown||!/x_\{k\+1\}=x_k-\\frac\{f\(x_k\)\}\{f′\(x_k\)\}/.test(p.explanation||''))errors.push(`Newton: general iteration formula missing ${p.id}`);
	  if(!p.newtonSpecificFormulaShown||!(/Substitute this function and derivative into the formula/.test(p.explanation||'')&&/x_\{k\+1\}=x_k-\\frac/.test(p.explanation||'')))errors.push(`Newton: family-specific iteration formula missing ${p.id}`);
	  if(!/f\(x\)=.*f′\(x\)=/s.test(p.explanation||''))errors.push(`Newton: function and derivative not both shown ${p.id}`);
	  if(/Continue until .*digits stabilize/i.test(p.explanation||''))errors.push(`Newton: redundant stabilization instruction leaked ${p.id}`);
	  const displayed=[...(p.explanation||'').matchAll(/x_\d+\\approx(-?\d+\.\d+)/g)].map(match=>match[1]);
	  if(displayed.length<2||displayed.at(-1)!==displayed.at(-2))errors.push(`Newton: displayed iterations did not stop after two matching approximations ${p.id}`);
	  if(displayed.length>2&&displayed.at(-1)===displayed.at(-3))errors.push(`Newton: repeated stabilized approximation more than twice ${p.id}`);
	 }
}

// Preserve the approved MVT focus selector while using the rebuilt v11 pool.
for(const focus of ['theorem','find-c']){
 const families=new Set();
 for(let i=1;i<=4000;i++){
   const p=gen('rolle-s-theorem-and-the-mean-value-theorem',(i*2246822519)>>>0,'noncalculator',{mvtMode:focus});
   scan(p,'rolle-s-theorem-and-the-mean-value-theorem',focus);families.add(p.variant);
   if(focus==='theorem'&&!/^(?:rolle_|mvt_hypothesis_|test_mvt_hypotheses)/.test(p.variant))errors.push(`MVT theorem focus leaked ${p.variant}`);
   if(focus==='find-c'&&/(?:rolle_|hypothesis)/.test(p.variant))errors.push(`MVT find-c focus leaked ${p.variant}`);
 }
 if(families.size<3)errors.push(`MVT ${focus} focus has insufficient family variety`);
}

const UNIT=path.join(ROOT,'ap-calculus/unit-3-applications-derivative/topics');
for(const [slug,modes] of Object.entries(topics)){
 const topic=path.join(UNIT,slug,'index.html');if(!fs.existsSync(topic)){errors.push(`missing topic page ${slug}`);continue;}
 const html=fs.readFileSync(topic,'utf8');
 if(!html.includes('data-bm-topic-practice="1"'))errors.push(`${slug}: missing practice launch section`);
 if(!fs.existsSync(path.join(UNIT,slug,'practice/index.html')))errors.push(`${slug}: missing practice page`);
 if(modes.length===2&&!fs.existsSync(path.join(UNIT,slug,'calculator-practice/index.html')))errors.push(`${slug}: missing calculator companion`);
 if(modes.includes('calculator')&&!html.includes('bm-calculator-glyph'))errors.push(`${slug}: calculator launch lacks calculator icon`);
 for(const sub of ['practice','calculator-practice']){
   const page=path.join(UNIT,slug,sub,'index.html');if(!fs.existsSync(page))continue;const p=fs.readFileSync(page,'utf8');
   if(!p.includes('/assets/unit3-applications-generators.js'))errors.push(`${slug}/${sub}: Unit 3 generator layer not loaded`);
   if(!p.includes('/assets/line-equation-checker.js'))errors.push(`${slug}/${sub}: typed line-equation checker not loaded`);
   if(!p.includes('/assets/derivative-expression-checker.js'))errors.push(`${slug}/${sub}: exact-expression checker not loaded`);
   if(!p.includes('/assets/unit3-applications.css'))errors.push(`${slug}/${sub}: Unit 3 styles not loaded`);
   if(!p.includes('/assets/calculus-keypad.js')||!p.includes('/assets/calculus-keypad.css'))errors.push(`${slug}/${sub}: shared structured keypad assets not loaded`);
   if(/assignment-aligned|recent-test-style|aligned to (?:the )?course assignments|85%|15%/i.test(p))errors.push(`${slug}/${sub}: removed assignment/test alignment copy is still visible`);
 }
}
const removedGraphing=path.join(UNIT,'graphing-the-derivative');
const removedGraphingHtml=fs.readFileSync(path.join(removedGraphing,'index.html'),'utf8');
if(removedGraphingHtml.includes('data-bm-topic-practice="1"'))errors.push('graphing the derivative: practice launch was not removed');
if(fs.existsSync(path.join(removedGraphing,'practice/index.html'))||fs.existsSync(path.join(removedGraphing,'calculator-practice/index.html')))errors.push('graphing the derivative: obsolete practice page still exists');
if(sandbox.window.BatchMathUnit3ApplicationsGenerators.get('graphing-the-derivative'))errors.push('graphing the derivative: generator is still registered in the Unit 3 layer');
const removedGraphingFunctions=path.join(UNIT,'graphing-functions');
const removedGraphingFunctionsHtml=fs.readFileSync(path.join(removedGraphingFunctions,'index.html'),'utf8');
if(removedGraphingFunctionsHtml.includes('data-bm-topic-practice="1"'))errors.push('graphing functions: practice launch was not removed');
if(fs.existsSync(path.join(removedGraphingFunctions,'practice/index.html'))||fs.existsSync(path.join(removedGraphingFunctions,'calculator-practice/index.html')))errors.push('graphing functions: obsolete practice page still exists');
if(sandbox.window.BatchMathUnit3ApplicationsGenerators.get('graphing-functions'))errors.push('graphing functions: generator is still registered in the Unit 3 layer');
if(fs.existsSync(path.join(UNIT,'linearization-and-differentials/calculator-practice/index.html')))errors.push('linearization: calculator practice page was not removed');
const analysisPage=fs.readFileSync(path.join(UNIT,'increasing-decreasing-intervals-concavity-and-extrema/practice/index.html'),'utf8');
if(!analysisPage.includes('id="analysisFocus"')||!analysisPage.includes('Local Maxima / Minima')||analysisPage.includes('Combined First / Second Derivative Behavior'))errors.push('derivative analysis Practice Type selector is incorrect');
const analysisCalculatorPage=fs.readFileSync(path.join(UNIT,'increasing-decreasing-intervals-concavity-and-extrema/calculator-practice/index.html'),'utf8');
if(!analysisCalculatorPage.includes('id="analysisFocus"')||!analysisCalculatorPage.includes('"fixedMode":"calculator"'))errors.push('derivative analysis calculator Practice Type selector is not pinned to calculator mode');
const mvtPage=fs.readFileSync(path.join(UNIT,'rolle-s-theorem-and-the-mean-value-theorem/practice/index.html'),'utf8');
if(!mvtPage.includes('id="mvtMode"')||!mvtPage.includes('"modeSelectIds":["mvtMode"]'))errors.push('MVT Practice Type selector is missing or not wired to generation');
for(const sub of ['assignment-practice','calculator-practice']){
 const page=path.join(UNIT,'comprehensive-review',sub,'index.html');if(!fs.existsSync(page))errors.push(`review: missing ${sub}`);
 else{const html=fs.readFileSync(page,'utf8');if(!html.includes('unit3-applications-generators.js'))errors.push(`review/${sub}: shared generator layer missing`);if(!html.includes('derivative-expression-checker.js'))errors.push(`review/${sub}: exact-expression checker missing`);if(!html.includes('calculus-keypad.js')||!html.includes('calculus-keypad.css'))errors.push(`review/${sub}: shared structured keypad assets missing`);if(!html.includes('"unit3":true'))errors.push(`review/${sub}: Unit 3 keypad configuration missing`);if(html.includes('graphing-the-derivative')||html.includes('graphing-functions'))errors.push(`review/${sub}: removed graphing practice remains in the mixed pool`);if(sub==='calculator-practice'&&html.includes('linearization-and-differentials'))errors.push('review/calculator-practice: removed calculator linearization remains in the mixed pool');}
}
const calcReview=fs.readFileSync(path.join(UNIT,'comprehensive-review/calculator-practice/index.html'),'utf8');
if(!calcReview.includes('"defaultMode":"calculator"'))errors.push('calculator review does not force calculator mode');
const noncalcReview=fs.readFileSync(path.join(UNIT,'comprehensive-review/assignment-practice/index.html'),'utf8');
if(!noncalcReview.includes('"defaultMode":"noncalculator"'))errors.push('noncalculator review does not force noncalculator mode');

const forbidden=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/Unit 3 Test|Test [AB] Part/i.test(e.name))forbidden.push(path.relative(ROOT,p));}}walk(path.join(ROOT,'ap-calculus'));
if(forbidden.length)errors.push(`uploaded tests were published: ${forbidden.join(', ')}`);

const unit2Required=[
 ['the-quotient-rule','05a-product-and-quotient-rule-derivatives-from-tables.pdf','05a-product-and-quotient-rule-derivatives-from-tables-answer-key.pdf'],
 ['the-chain-rule','07a-derivatives-from-tables.pdf','07a-derivatives-from-tables-answers.pdf'],
 ['the-chain-rule','07b-finding-derivatives-at-a-point-power-product-quotient-trig-chain.pdf','07b-finding-derivatives-at-a-point-power-product-quotient-trig-chain-answers.pdf'],
 ['the-chain-rule','07c-nested-chain-rule-derivatives.pdf','07c-nested-chain-rule-derivatives-answers.pdf']
];
for(const [topic,a,k] of unit2Required){const html=fs.readFileSync(path.join(ROOT,'ap-calculus/unit-2-derivatives/topics',topic,'index.html'),'utf8');if(!html.includes(a)||!html.includes(k))errors.push(`Unit 2 ${topic}: missing links for ${a}`);for(const [dir,file] of [['assignments',a],['answer-keys',k]])if(!fs.existsSync(path.join(ROOT,'ap-calculus/unit-2-derivatives/resources',dir,file)))errors.push(`Unit 2 missing PDF ${file}`);}

const report={ok:errors.length===0,generatedAt:new Date().toISOString(),stats,warnings:[...new Set(warnings)].slice(0,100),errors:[...new Set(errors)].slice(0,200)};
fs.writeFileSync(path.join(OUT,'unit3-rebuild-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath Unit 3 Version 11.13 QA',`Result: ${report.ok?'PASS':'FAIL'}`,`Errors: ${report.errors.length}`,...report.errors.map(x=>`- ${x}`),`Warnings: ${report.warnings.length}`,...report.warnings.map(x=>`- ${x}`),'',JSON.stringify(stats,null,2)];
fs.writeFileSync(path.join(OUT,'unit3-rebuild-qa.txt'),lines.join('\n')+'\n');console.log(lines.join('\n'));if(errors.length)process.exit(1);
