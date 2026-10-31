import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {batchmathToLatex,translateLatex,parseInput} from '../answer-adapter.mjs';
import {fixtures} from '../fixtures.mjs';
import {grade} from '../grading.mjs';
import {loadCheckers,root} from './checkers.mjs';
const api=loadCheckers();
const translated=(latex,mode)=>{const value=translateLatex(latex,mode);assert.equal(value.status,'complete',JSON.stringify(value));return value.input;};
const value=(latex,context={})=>api.BatchMathDerivativeExpressions.evaluate(api.BatchMathDerivativeExpressions.parse(translated(latex)),context);

for(const [label,latex,context,want] of [
 ['nested fractions','\\frac{1}{1+\\frac{1}{2}}',{},2/3],
 ['compact TeX fractions','\\frac34',{},.75],
 ['single-token TeX exponent','x^12',{x:3},6],
 ['fractional exponent','x^{\\frac{1}{2}}',{x:9},3],
 ['nested exponent','2^{3^{2}}',{},512],
 ['negative square','-2^{2}',{},-4],
 ['squared negative','(-2)^{2}',{},4],
 ['fraction raised to power','\\frac{1}{2}^{2}',{},.25],
 ['denominator grouping','\\frac{x+1}{x-1}',{x:3},2],
 ['subtracted quotient','3-\\frac{1}{2}',{},2.5],
 ['scientific notation','1\\times10^{-3}',{},.001],
 ['function power','\\sin^{2}(x)',{x:.7},Math.sin(.7)**2],
 ['inverse function','\\sin^{-1}(x)',{x:.5},Math.asin(.5)],
 ['implicit multiplication','2x(x+1)',{x:2},12],
 ['decimal preservation','1.250',{},1.25]
 ,['absolute value of a fraction','\\left|\\frac{-3}{2}\\right|',{},1.5]
 ,['nested absolute values','\\left|-2+\\left|-3\\right|\\right|',{},1]
])test(label,()=>assert.ok(Math.abs(value(latex,context)-want)<1e-10));

test('nth-root index and real odd-root grading are retained',()=>{
 const raw=translated('\\sqrt[3]{-8}');assert.equal(raw,'root(3,-8)');assert.equal(grade(raw,{checker:'unit5',expected:{kind:'exact',expression:'-2'}},api).status,'correct');
});
test('square root grouping',()=>assert.equal(translated('\\sqrt{x+1}'),'sqrt(x+1)'));
test('literal fraction is not reduced',()=>assert.equal(translated('\\frac{6}{8}','literal'),'6/8'));
test('decimal digits are not canonicalized',()=>assert.equal(translated('1.2500','literal'),'1.2500'));
test('literal translator refuses to evaluate arithmetic',()=>assert.equal(translateLatex('1+2','literal').status,'unsupported'));
test('unsimplified polynomial remains unsimplified',()=>{
 const raw=translated('x^{2}+2x^{2}');assert.equal(grade(raw,{checker:'im1-polynomial',expected:'3x^2'},api).status,'unsimplified');
});
test('required equation form is not rearranged',()=>{
 const field={checker:'im1-line',expected:{form:'slope-intercept',m:.5,b:3}};
 assert.equal(grade(translated('2y=x+6'),field,api).status,'invalid');
 assert.equal(grade(translated('y=\\frac{1}{2}x+3'),field,api).status,'correct');
});
test('Unit 5 rounded decimals keep their existing policy',()=>{
 const field={checker:'unit5',expected:{kind:'numeric',value:1.25,places:3}};
 for(const raw of ['1.25','1.250','1.2500'])assert.equal(grade(translated(raw,'literal'),field,api).status,'correct');
 assert.equal(grade(translated('1.2503','literal'),field,api).status,'incorrect');
 assert.equal(grade(translated('\\frac{5}{4}','literal'),field,api).status,'invalid');
});
test('constant of integration is preserved, never supplied',()=>{
 const field={checker:'unit5',expected:{kind:'general',expression:'x^2',variable:'x'}};
 assert.equal(grade(translated('x^{2}+C'),field,api).status,'correct');
 assert.equal(grade(translated('x^{2}'),field,api).status,'incorrect');
});
test('an IVP does not lose a leftover C',()=>assert.equal(grade(translated('x+C'),{checker:'unit5',expected:{kind:'ivp',expression:'x+1',variable:'x',x0:0,y0:1,interval:[-2,2]}},api).status,'incorrect'));
test('interval brackets and unions are retained',()=>{
 const raw=translated('\\left(-\\infty,2\\right]\\cup\\left(3,\\infty\\right)');assert.equal(raw,'(-infinity,2]U(3,infinity)');
});
test('sequence subscripts and recurrence survive',()=>{
 const raw=translated('a_{1}=2,a_n=a_{n-1}+3');assert.equal(raw,'a₁=2,aₙ=aₙ₋₁+3');assert.equal(grade(raw,{checker:'im1-recursive',expected:{a:2,d:3}},api).status,'correct');
});
test('the existing IM1 interval checker keeps its restricted endpoint grammar',()=>{
 const field={checker:'im1-interval',expected:'(-∞,5]'};
 assert.equal(grade(translated('(-\\infty,5]'),field,api).status,'correct');
 assert.equal(grade(translated('(0,\\frac12]'),field,api).status,'invalid');
});
for(const latex of ['','\\frac{1}{}','x^{}','x^{\\placeholder{}}','\\sqrt{}','y=','\\left(x+1\\right.'])test('incomplete: '+latex,()=>{const result=translateLatex(latex);assert.equal(result.status,'incomplete');assert.equal(result.input,null);});
for(const latex of ['\\int x dx','\\log_{2}(x)','\\href{https://example.com}{x}','\\htmlData{x}{y}','a_{q}','x%2','\\lVert x\\rVert'])test('unsupported: '+latex,()=>assert.equal(translateLatex(latex).status,'unsupported'));
test('input and depth limits fail closed',()=>{
 assert.equal(translateLatex('x'.repeat(5001)).status,'unsupported');assert.equal(parseInput('('.repeat(80)+'1'+')'.repeat(80)).status,'unsupported');
});

for(const fixture of fixtures)for(const [index,field] of fixture.fields.entries())test(`fixture parity: ${fixture.id} / ${index+1}`,()=>{
 const preview=batchmathToLatex(field.raw);assert.ok(preview.latex,preview.message);
 const candidate=translateLatex(preview.latex,field.translation||'expression');
 if(preview.status==='incomplete'){assert.equal(candidate.status,'incomplete');return;}
 assert.equal(candidate.status,'complete',candidate.message);
 const baseline=grade(field.raw,field,api),proposed=grade(candidate.input,field,api);
 assert.equal(proposed.status,baseline.status,JSON.stringify({raw:field.raw,translated:candidate.input,baseline,proposed}));
 if(field.checker!=='unsupported'&&fixture.id!=='unsimplified')assert.equal(proposed.status,'correct',JSON.stringify(proposed));
});

test('all vendored asset hashes match the dependency lock',()=>{
 const dir=path.join(root,'experiments/math-entry'),lock=JSON.parse(fs.readFileSync(path.join(dir,'dependency-lock.json'),'utf8'));
 for(const entry of Object.values(lock))for(const asset of entry.files){const bytes=fs.readFileSync(path.join(dir,asset.path));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.path);}
 assert.equal(lock.mathlive.version,'0.111.1');
});
