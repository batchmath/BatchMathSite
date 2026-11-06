import {withoutApprovedKeypadCorrections} from '../integration/editor-source-guards.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {execFileSync} from 'node:child_process';import {root,routes} from './unit1-engine.mjs';import {translateLimit,unit1Profiles} from '../../assets/mathlive/unit1-contracts.mjs';
// ap-topic-generators.js carries one approved Unit 6 display change (v12.9.B checkpoint 2, 0c348c8: x, not 1x, in the
// piecewise generator); it is otherwise the MathLive baseline. Every other file is compared with its own baseline.
const UNIT6_GENERATORS='0c348c88860efd5b4c9e368fe4a1269140172331';
const b={window:{}};vm.createContext(b);vm.runInContext(fs.readFileSync(root+'assets/unit1-practice-ui.js','utf8'),b);const parse=b.window.BMUnit1UI.parse;
test('limit contracts preserve signed infinities, DNE, Undefined rejection and real roots',()=>{
 for(const [tex,expected]of [['\\text{DNE}','dne'],['\\infty','inf'],['-\\infty','inf'],['\\text{Undefined}','error']]){const value=parse(translateLimit(tex).input);assert.ok(expected==='error'?value.error:value.kind===expected);}
 for(const [tex,value]of [['\\sqrt[3]{-8}',-2],['\\frac{1}{\\frac{2}{3}}',1.5],['\\log(100)',2],['\\ln(e^2)',2],['-2^2',-4]])assert.equal(parse(translateLimit(tex).input).value,value);
 assert.ok(parse(translateLimit('\\frac{1}{0}').input).error);assert.notEqual(translateLimit('\\frac{1}{}').status,'complete');
 assert.ok(unit1Profiles['migration-limit-signed'].infinity);for(const n of ['migration-limit-finite','ml-unit1-trig-value','ml-unit1-rational-value'])assert.ok(!unit1Profiles[n].infinity&&!unit1Profiles[n].dne);
});
test('Batch 4 leaves generators, graders and inline controllers unchanged after the separate precedence fix',()=>{
 for(const name of ['unit1-practice-ui','unit1-core-expansions','unit1-basic-techniques','unit1-infinity-expansions','unit1-infinity-legacy','unit1-one-sided','unit1-discontinuities','unit1-course-trig','ap-topic-practice','ap-topic-generators'])assert.equal(withoutApprovedKeypadCorrections(fs.readFileSync(root+'assets/'+name+'.js','utf8'),'assets/'+name+'.js'),execFileSync('git',['show',(name==='ap-topic-generators'?UNIT6_GENERATORS:'0f4f54e')+':assets/'+name+'.js'],{cwd:root,encoding:'utf8',maxBuffer:8000000}));
 for(const r of routes){const before=execFileSync('git',['show','0f4f54e:'+r.path],{cwd:root,encoding:'utf8'}),after=fs.readFileSync(root+r.path,'utf8'),inline=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('src=')).map(x=>x[2]);assert.deepEqual(inline(after),inline(before));}
});
test('three conceptual Unit 1 routes remain choices in every declared generator mode',()=>{
 const c={window:{BatchMathRNG:{random:()=>.419}}};vm.createContext(c);c.BatchMathRNG=c.window.BatchMathRNG;
 for(const f of ['ap-topic-generators','unit1-representations','unit1-ivt-expansions'])vm.runInContext(fs.readFileSync(root+'assets/'+f+'.js','utf8'),c);
 const families=['raw_sine','raw_cosine','absolute_sine','absolute_cosine','vanishing_sine','vanishing_cosine','vanishing_absolute','nonzero_exponential','nonzero_affine','bounds_inconclusive','sinx_over_x_contrast'];
 for(const [slug,options]of [['introduction-to-limits',['mixed','tables','graphs'].map(mode=>({mode}))],['intermediate-value-theorem',['mixed','value','root'].map(mode=>({mode}))],['sin-one-over-x',families.map(family=>({family}))]]){
  for(const opts of options){const p=c.window.BatchMathAPTopicGenerators.get(slug)(opts);assert.ok(p.choices?.length,slug);assert.ok(Number.isInteger(p.correctIndex));assert.ok(!p.answerType);}
  const html=fs.readFileSync(root+'ap-calculus/unit-1-limits-continuity/topics/'+slug+'/practice/index.html','utf8');assert.ok(!html.includes('/assets/mathlive/unit1.mjs'));
 }
});
