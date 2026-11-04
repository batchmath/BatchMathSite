import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {valueEngine,algebraEngine,routes,root,rng} from './im1-engine.mjs';import {im1Value,im1ToLatex,im1PolynomialContract,im1IntervalContract} from '../../assets/mathlive/im1-contracts.mjs';import {im1Profiles} from '../../assets/mathlive/im1-profiles.mjs';
test('fractions retain unreduced numerators, denominators and form rejection',()=>{
 const e=valueEngine(routes.find(r=>r.slug==='fractions')),q=e.generate(719,'common')[0];q.answer={n:1,d:2};
 assert.equal(im1Value('\\frac{2}{4}').input,'2/4');assert.equal(e.check(q,im1Value('\\frac{2}{4}').input).ok,false);assert.equal(e.check(q,im1Value('\\frac{1}{2}').input).ok,true);
 for(const value of ['1/2','2/4','-1/-2','1/0','0.5','(1)/(2)','1/2+0']){const tex=im1ToLatex(value).latex,out=im1Value(tex).input??'?';assert.equal(e.check(q,out).ok,e.check(q,value).ok);}
 assert.equal(im1ToLatex('1e3').latex,null);
});
test('equation solution fractions and special words obey their distinct checker',()=>{
 const b=algebraEngine(),c=b.BatchMathIM1Equation.check;
 for(const value of ['2/4','x=2/4','0.5','x=0.5','1/(1+1)','1/2+0','y=0.5']){const tex=im1ToLatex(value).latex,out=im1Value(tex).input??'?';assert.equal(c(out,'1/2').ok,c(value,'1/2').ok);}
 for(const value of ['No Solution','x=No solution','none','Infinitely many solutions','x=All real numbers']){const expected=/no|none/i.test(value)?'No Solution':'Infinite Solutions',out=im1Value(im1ToLatex(value).latex).input;assert.equal(c(out,expected).ok,true,value);}
 for(const value of ['\\varnothing','\\emptyset','x=\\emptyset'])assert.equal(c(im1Value(value).input,'No Solution').ok,true);
});
test('polynomial transport retains uncombined terms and repeated variable factors',()=>{
 const c=algebraEngine().BatchMathIM1Algebra.check;
 for(const value of ['2x^2','x^2+x^2','2*x*x','x*x+x*x','2x^2+0','(2)x^2','2/1*x^2']){const tex=im1PolynomialContract.toLatex(value).latex,out=im1PolynomialContract.translate(tex).input??'?',a=c(value,'2x^2'),b=c(out,'2x^2');assert.equal(b.ok,a.ok);assert.equal(b.unsimplified,a.unsimplified);assert.equal(!!b.error,!!a.error);}
 assert.equal(c(im1PolynomialContract.translate('x^2+x^2').input,'2x^2').ok,false);
});
test('interval profiles retain integer endpoint restrictions and keep unions outside the typed contract',()=>{
 const c=algebraEngine().BatchMathIM1Interval.check;
 for(const value of ['(-infinity,2]','[-infinity,2]','(-infinity,2.0]','(-infinity,4/2]','(-infinity,2] U [3,infinity)']){const preview=im1IntervalContract.toLatex(value).latex;if(preview===null)continue;const out=im1IntervalContract.translate(preview).input??'?',a=c(value,'(-infinity,2]'),b=c(out,'(-infinity,2]');assert.equal(b.ok,a.ok);assert.equal(!!b.error,!!a.error);}
 assert.equal(im1Profiles['ml-im1-interval'].union,false);assert.equal(im1Profiles['ml-im1-interval'].decimal,undefined);assert.equal(im1Profiles['ml-im1-digits'].signed,false);
});
test('IM1 mathematical sources and all non-editor HTML content remain unchanged',()=>{
 for(const name of ['im1-keypad','im1-display-math','im1-unit2-practice','im1-unit2-generators','im1-algebra-input','im1-equation-input','im1-interval-input'])assert.equal(fs.readFileSync(root+'assets/'+name+'.js','utf8'),execFileSync('git',['show','517ffee:assets/'+name+'.js'],{cwd:root,encoding:'utf8',maxBuffer:8000000}));
 for(const r of routes){const before=execFileSync('git',['show','517ffee:'+r.path],{cwd:root,encoding:'utf8'}),after=fs.readFileSync(root+r.path,'utf8').replace(/ data-mathlive-im1="unit[12]"/,'').replace('<link rel="stylesheet" href="/assets/calculus-keypad.css"><script defer src="/assets/calculus-keypad.js"></script><link rel="stylesheet" href="/assets/mathlive/pilot.css"><script type="module" src="/assets/mathlive/im1.mjs"></script>','');assert.equal(after,before,r.path);}
});
test('unconverted Unit 1 classification and three Unit 2 topics retain only specialized choices',()=>{
 const b=algebraEngine();for(const slug of ['distributive-property','solving-linear-inequalities','coordinate-system-nine-key-features'])for(let seed=1;seed<=200;seed++){b.BatchMathRNG={random:rng(seed*719)};const q=b.BatchMathIM1Unit2Generators.get(slug)();assert.ok(q.choices?.length);assert.ok(!q.kind);if(q.part2){assert.ok(q.part2.choices?.length);assert.ok(!q.part2.kind);}}
 const p='im1/unit-1-review/topics/classifying-numbers/practice/index.html';assert.equal(fs.readFileSync(root+p,'utf8'),execFileSync('git',['show','517ffee:'+p],{cwd:root,encoding:'utf8'}));
});
