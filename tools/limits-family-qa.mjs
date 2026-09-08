#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const VERSION=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/app-version.json'),'utf8')).version;
const PER_CATEGORY=Math.max(1000,Number(process.env.BM_QA_LIMIT_FAMILY_COUNT||20000));
const FILE=path.join(ROOT,'ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html');
const errors=[];

function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1;}
function rat(n,d=1){if(d<0){n=-n;d=-d}const g=gcd(n,d);return [n/g,d/g];}
function sameRat(ans,expected){return ans?.kind==='rat'&&ans.n===expected[0]&&ans.d===expected[1];}
function hashSeed(value){let h=2166136261>>>0;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}h+=h<<13;h^=h>>>7;h+=h<<3;h^=h>>>17;h+=h<<5;return h>>>0;}
function rng(seed){let state=hashSeed(seed)||0x6d2b79f5;return()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function elem(value=''){return {value,innerHTML:'',textContent:'',className:'',disabled:false,placeholder:'',style:{display:''},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},focus(){},classList:{add(){},remove(){},contains(){return false;},toggle(){}}};}
function scriptsFromHtml(html){return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!(/\bsrc\s*=/.test(m[1]))).map(m=>m[2]);}
function generatorScript(html){const found=scriptsFromHtml(html).filter(s=>s.includes('function makeProblem')&&s.includes('const generators='));if(found.length!==1)throw new Error(`Expected one generator script, found ${found.length}`);return found[0];}
function generate(category,count){
  const html=fs.readFileSync(FILE,'utf8'),code=generatorScript(html),generated=[];
  const elements={category:elem(category),question:elem(),answer:elem(),submit:elem(),next:elem(),feedback:elem(),'topic-name':elem(),'correct-count':elem('0'),attempted:elem('0')};
  const winListeners={},random=rng(`Limits:${category}:${VERSION}:targeted`);
  const fakeDocument={getElementById:id=>elements[id]||(elements[id]=elem()),addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};
  const BMAnalytics={ensurePracticeStarted(){},problemGenerated(p){generated.push(structuredClone(p));},answerChecked(){},solutionRevealed(){}};
  const window={BMAnalytics,MathJax:null,addEventListener:(t,fn)=>{winListeners[t]=fn;},BatchMathCalculusKeypad:null};
  const sandbox={window,document:fakeDocument,BatchMathRNG:{random},console,Math,structuredClone,setTimeout:()=>0,clearTimeout:()=>{},location:{},navigator:{}};
  vm.createContext(sandbox);vm.runInContext(code,sandbox,{filename:`limits-${category}.js`,timeout:5000});winListeners.load?.();
  const next=elements.next.listeners.click;if(typeof next!=='function')throw new Error('Next Question handler missing');
  while(generated.length<count)next();return generated;
}

function expectedSub(p){
  const id=String(p.id);let m;
  if((m=id.match(/^sub-cuberoot-over-power-(\d+)-(?:fractional|radical)$/))){const k=+m[1];return rat(1,3*k*k);}
  if((m=id.match(/^sub-power-over-cuberoot-(\d+)-(?:fractional|radical)$/))){const k=+m[1];return rat(3*k*k);}
  if((m=id.match(/^sub-higher-cuberoot-(\d+)-(?:fractional|radical)$/))){const k=+m[1];return rat(2*k);}
  if((m=id.match(/^sub-higher-root-over-power-(\d+)-(\d+)-(?:fractional|radical)$/))){const n=+m[1],k=+m[2];return rat(1,n*Math.pow(k,n-1));}
  if((m=id.match(/^sub-power-over-higher-root-(\d+)-(\d+)-(?:fractional|radical)$/))){const n=+m[1],k=+m[2];return rat(n*Math.pow(k,n-1));}
  if((m=id.match(/^sub-higher-power-(\d+)-(\d+)-(\d+)-(?:fractional|radical)$/))){const mm=+m[2],k=+m[3];return rat(mm*Math.pow(k,mm-1));}
  if((m=id.match(/^sub-mixed-powers-(\d+)-(\d+)-(\d+)-(\d+)$/))){const pp=+m[2],qq=+m[3],k=+m[4];return rat(pp*Math.pow(k,pp-1),qq*Math.pow(k,qq-1));}
  if((m=id.match(/^sub-shifted-cuberoot-(\d+)-(-?\d+)-(\d+)$/))){const k=+m[1],coef=+m[3];return rat(coef*3*k*k);}
  if((m=id.match(/^sub-cuberoot-quadratic-(\d+)-(-?\d+)-(\d+)$/))){const k=+m[1],coef=+m[3];return rat(9*coef*Math.pow(k,4));}
  if((m=id.match(/^sub-cuberoot-poly-(\d+)-(\d+)-(\d+)-(-?\d+)$/))){const k=+m[1],r=+m[2],coef=+m[3];return rat(coef*k,k-r);}
  return null;
}
function expectedComplex(p){
  const id=String(p.id);let m;
  if((m=id.match(/^cf-recip-basic-(-?\d+)$/))){const a=+m[1];return rat(-1,a*a);}
  if((m=id.match(/^cf-recip-den-(-?\d+)$/))){const a=+m[1];return rat(-a*a);}
  if((m=id.match(/^cf-shifted-(-?\d+)-(-?\d+)$/))){const a=+m[1],c=+m[2];return rat(-1,(a+c)*(a+c));}
  if((m=id.match(/^cf-shifted-den-(-?\d+)-(-?\d+)$/))){const a=+m[1],c=+m[2];return rat(-(a+c)*(a+c));}
  if((m=id.match(/^cf-recip-quad-(-?\d+)-(\d+)$/))){const a=+m[1],c=+m[2],A=a*a+c;return rat(-2*a,A*A);}
  if((m=id.match(/^cf-recip-square-(-?\d+)$/))){const a=+m[1];return rat(-2,a*a*a);}
  if((m=id.match(/^cf-rational-diff-(\d+)-(\d+)-(\d+)$/))){const a=+m[1],b=+m[2],c=+m[3];return rat(c-b,(a+c)*(a+c));}
  if((m=id.match(/^cf-double-recip-(-?\d+)-(-?\d+)$/))){const a=+m[1],c=+m[2];return rat((a+c)*(a+c),a*a);}
  if((m=id.match(/^cf-square-over-recip-(-?\d+)$/))){const a=+m[1];return rat(2,a);}
  if((m=id.match(/^cf-recip-over-factor-(-?\d+)$/))){const a=+m[1];return rat(-1,2*a*a*a);}
  return null;
}

const expectedSubVariants=new Set(['cube_root_over_power','power_over_cube_root','higher_cube_root_power','clean_shifted_cube_root','cube_root_quadratic_substitution','cube_root_polynomial_ratio','higher_root_over_power','power_over_higher_root','higher_fractional_power','mixed_fractional_powers']);
const expectedComplexVariants=new Set(['routine_reciprocal_basic','routine_reciprocal_denominator','routine_shifted_reciprocal','routine_shifted_reciprocal_denominator','intermediate_reciprocal_quadratic','intermediate_reciprocal_square','intermediate_rational_difference','challenging_double_reciprocal','challenging_reciprocal_square_over_reciprocal','challenging_reciprocal_over_factored']);
const summary={};
let sawNonzeroShiftedCubeRoot=false,sawXPlus62At2=false;
for(const category of ['substitution','complex']){
  const problems=generate(category,PER_CATEGORY),counts={};
  for(let i=0;i<problems.length;i++){
    const p=problems[i],variant=String(p.problemVariant||'');counts[variant]=(counts[variant]||0)+1;
    const expected=category==='substitution'?expectedSub(p):expectedComplex(p);
    if(!expected){errors.push(`${category} #${i+1}: unrecognized id ${p.id}`);break;}
    if(!sameRat(p.ans,expected)){errors.push(`${category} #${i+1} ${p.id}: answer ${JSON.stringify(p.ans)} != expected ${expected[0]}/${expected[1]}`);break;}
    const expectedType=category==='substitution'?'variable_substitution':'complex_fraction_limits';
    if(p.problemType!==expectedType){errors.push(`${category} ${p.id}: problemType ${p.problemType} != ${expectedType}`);break;}
    if(!variant){errors.push(`${category} ${p.id}: missing meaningful problemVariant`);break;}
    const display=`${p.q||''} ${p.sol||''}`;
    if(category==='substitution'){
      const q=String(p.q||'');
      if(/\\sqrt\{x/.test(q)||/x\^\{\\frac\{1\}\{2\}\}/.test(q))errors.push(`substitution ${p.id}: square-root/x^(1/2) problem leaked into U-sub category`);
    }
    if(category==='substitution'&&/^sub-shifted-cuberoot-/.test(String(p.id))){
      const mm=String(p.id).match(/^sub-shifted-cuberoot-(\d+)-(-?\d+)-(\d+)$/);
      if(mm&&+mm[2]!==0)sawNonzeroShiftedCubeRoot=true;
      if(mm&&+mm[1]===4&&+mm[2]===2&&/x\+62/.test(String(p.q)))sawXPlus62At2=true;
    }
    if(/\b(?:s1|s2|cf1|cf2|cf3)\b/.test(String(p.id)))errors.push(`${category} ${p.id}: legacy opaque variant id remains`);
    if(/\\frac1\{-\d+\}|(?:^|[^\^])--|\+\s*-/.test(display)){errors.push(`${category} ${p.id}: malformed sign pattern`);break;}
  }
  const expectedVariants=category==='substitution'?expectedSubVariants:expectedComplexVariants;
  for(const v of expectedVariants)if(!counts[v])errors.push(`${category}: missing generated variant ${v}`);
  summary[category]={generated:problems.length,counts};
}
const sub=summary.substitution?.counts||{};const subTotal=summary.substitution?.generated||1;
const cubeVariants=['cube_root_over_power','power_over_cube_root','higher_cube_root_power','clean_shifted_cube_root','cube_root_quadratic_substitution','cube_root_polynomial_ratio'];
const cubeSub=cubeVariants.reduce((n,v)=>n+(sub[v]||0),0)/subTotal;
if(cubeSub<0.55||cubeSub>0.65)errors.push(`substitution: cube-root share ${(100*cubeSub).toFixed(1)}% outside expected 55-65%`);
if(!sawNonzeroShiftedCubeRoot)errors.push('substitution: shifted cube-root family never used a nonzero approach value');
if(!sawXPlus62At2)errors.push('substitution: target style x -> 2 with cubeRoot(x+62) -> 4 did not appear');
const cx=summary.complex?.counts||{},cxTotal=summary.complex?.generated||1;
const routine=Object.entries(cx).filter(([k])=>k.startsWith('routine_')).reduce((n,[,v])=>n+v,0)/cxTotal;
const intermediate=Object.entries(cx).filter(([k])=>k.startsWith('intermediate_')).reduce((n,[,v])=>n+v,0)/cxTotal;
const challenging=Object.entries(cx).filter(([k])=>k.startsWith('challenging_')).reduce((n,[,v])=>n+v,0)/cxTotal;
if(routine<0.39||routine>0.49)errors.push(`complex: routine share ${(100*routine).toFixed(1)}% outside expected 39-49%`);
if(intermediate<0.26||intermediate>0.37)errors.push(`complex: intermediate share ${(100*intermediate).toFixed(1)}% outside expected 26-37%`);
if(challenging<0.20||challenging>0.30)errors.push(`complex: challenging share ${(100*challenging).toFixed(1)}% outside expected 20-30%`);

const report={ok:errors.length===0,generatedAt:new Date().toISOString(),perCategory:PER_CATEGORY,totalGenerated:PER_CATEGORY*2,errors,summary,shares:{cubeRootSubstitution:cubeSub,otherFractionalSubstitution:1-cubeSub,complex:{routine,intermediate,challenging}}};
fs.writeFileSync(path.join(OUT,'limits-family-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath targeted Limits family QA',`Result: ${report.ok?'PASS':'FAIL'}`,`Problems generated: ${report.totalGenerated}`,`Variable Substitution cube-root share: ${(100*cubeSub).toFixed(1)}% / other fractional-power share: ${(100*(1-cubeSub)).toFixed(1)}%`,`Complex mix: ${(100*routine).toFixed(1)}% routine / ${(100*intermediate).toFixed(1)}% intermediate / ${(100*challenging).toFixed(1)}% challenging`,'','Variable Substitution variants:',...Object.entries(sub).sort().map(([k,v])=>`- ${k}: ${v}`),'','Complex Fraction variants:',...Object.entries(cx).sort().map(([k,v])=>`- ${k}: ${v}`),'',`Errors: ${errors.length}`,...errors.map(e=>`- ${e}`),''];
fs.writeFileSync(path.join(OUT,'limits-family-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
