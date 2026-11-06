import {withoutApprovedKeypadCorrections} from '../integration/editor-source-guards.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import fs from 'node:fs';
import {exactList,intervalsWithNone,roundedNumber} from '../../assets/mathlive/structured-contracts.mjs';import {engine,root} from './staged-engine.mjs';import {stagedProfiles,stagedKeypads} from '../../assets/mathlive/staged-profiles.mjs';
const e=engine(),a4=e.b.BatchMathUnit4Answers,a5=e.b.BatchMathUnit5Answers;
test('lists retain exactness, order, duplicates, separators, labels and plus/minus without solving',()=>{const spec={kind:'exact-list',values:['1-sqrt(2)','1+sqrt(2)']};
 for(const tex of ['1\\pm\\sqrt{2}','1-\\sqrt{2};1+\\sqrt{2}','\\left\\lbrace1-\\sqrt{2},1+\\sqrt{2}\\right\\rbrace'])assert.equal(a4.check(exactList(tex,{doesNotApply:true}).input,spec).ok,true,tex);
 assert.equal(a4.check(exactList('1+\\sqrt{2},1+\\sqrt{2}',{doesNotApply:true}).input,spec).ok,false);
 assert.equal(exactList('\\pm2',{doesNotApply:true}).input,'±2');
 assert.equal(a4.check(exactList('\\frac{1\\pm\\sqrt{2}}{2}',{doesNotApply:true}).input,{kind:'exact-list',values:['(1-sqrt(2))/2','(1+sqrt(2))/2']}).ok,true);
 assert.equal(exactList('2,1').input,'2,1');assert.equal(exactList('c=2,c=1',{doesNotApply:true}).input,'c=2,c=1');
 assert.equal(exactList('\\text{Does not apply}',{doesNotApply:true}).input,'Does not apply');assert.equal(exactList('\\text{None}').input,'None');
});
test('rounded decimals preserve spelling and precision; fractions and expressions never become evaluated numbers',()=>{const spec={kind:'numeric',value:1.25,places:3};
 for(const s of ['1.2500','1.25'])assert.equal(a5.check(roundedNumber(s).input,spec).ok,true);
 for(const [tex,raw]of [['\\frac{5}{4}','(5)/(4)'],['1.25+0','1.25+0'],['1.2503','1.2503'],['\\$1,250.00','$1,250.00']])assert.equal(JSON.stringify(a5.check(roundedNumber(tex).input,spec)),JSON.stringify(a5.check(raw,spec)));
 assert.equal(a5.check(roundedNumber('1.2503').input,spec).ok,false);
});
test('intervals retain brackets, unions, None and fractional endpoints for the original checker',()=>{const spec={kind:'interval',parts:[{left:-Infinity,right:0,lc:false,rc:false},{left:1,right:Infinity,lc:false,rc:false}]};
 assert.equal(a5.check(intervalsWithNone('(-\\infty,0)\\cup(1,\\infty)').input,spec).ok,true);
 assert.equal(a5.check(intervalsWithNone('[-\\infty,0)\\cup(1,\\infty)').input,spec).valid,false);
 assert.equal(a5.check(intervalsWithNone('\\text{None}').input,{kind:'interval',none:true}).ok,true);
});
test('new profile controls cover generated grammar and accepted evaluation forms',()=>{const records=JSON.parse(fs.readFileSync(root+'tools/mathlive-sitewide/artifacts/staged-node.json'));for(const record of records)for(const [mode,grammar]of Object.entries(record.profiles)){
 const c=stagedProfiles[mode];assert.ok(c,mode);const profile=stagedKeypads[c.keypad]||e.profiles[mode];assert.ok(profile,mode);
 const fn=new Set((profile.functions||[]).map(x=>x[1]));for(const [flag,name]of [['radical','sqrt'],['cubeRoot','cbrt'],['nthRoot','root'],['logarithm','ln']])if(profile[flag])fn.add(name);if(profile.exponent&&profile.constants?.includes('e'))fn.add('exp');
 for(const name of grammar.functions)assert.ok(fn.has(name),mode+': '+name);
 for(const name of grammar.symbols){if(['infinity','None','Does not apply'].includes(name)||grammar.kinds.includes('list')&&['t','y'].includes(name))continue;assert.ok([...(profile.constants||[]),...(profile.variables||[])].includes(name),mode+': '+name);}
 }
 assert.equal(a4.check('pi*4^2/2',{kind:'scalar',value:{pi:[8,1]}}).ok,true);
 assert.equal(a4.check('sin(pi/6)',{kind:'scalar',value:{'':[1,2]}}).ok,true);
 assert.equal(a4.check('ln(e^2)-ln(e)',{kind:'exact-number',expression:'1'}).ok,true);
 assert.equal(a5.check('0.5',{kind:'exact',value:.5}).ok,true);
 assert.equal(a5.check('0.5*x^2+C',{kind:'general',expression:'x^2/2'}).ok,false);
});
test('Batch 2 changes no generators, graders, selectors or renderer code',()=>{for(const f of ['ap-topic-generators','ap-topic-practice','unit4-exact-answers','unit5-core','unit5-answers','unit5-ui','unit5-basic','unit5-growth','unit5-motion','unit5-rate','unit5-slope-fields'])assert.equal(withoutApprovedKeypadCorrections(fs.readFileSync(root+'assets/'+f+'.js','utf8'),'assets/'+f+'.js'),execFileSync('git',['show','a3c8c3d:assets/'+f+'.js'],{cwd:root,encoding:'utf8',maxBuffer:8000000}));const routes=JSON.parse(fs.readFileSync(root+'tools/mathlive-sitewide/staged-routes.json'));for(const r of routes){const before=execFileSync('git',['show','a3c8c3d:'+r.path],{cwd:root,encoding:'utf8'}),after=fs.readFileSync(root+r.path,'utf8');const inline=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!m[1].includes('src=')).map(x=>x[2]);assert.deepEqual(inline(after),inline(before));}});
