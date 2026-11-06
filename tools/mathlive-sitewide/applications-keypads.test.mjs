import {withoutApprovedKeypadCorrections} from '../integration/editor-source-guards.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {execFileSync} from 'node:child_process';
import {root} from './applications-engine.mjs';import {applicationProfiles,applicationKeypads} from '../../assets/mathlive/applications-profiles.mjs';
const records=JSON.parse(fs.readFileSync(root+'tools/mathlive-sitewide/artifacts/applications-node.json')),source=fs.readFileSync(root+'assets/calculus-keypad.js','utf8');
test('all observed Unit 3 answer grammar has controls in its field-specific profile',()=>{
 for(const r of records){const defs=applicationProfiles({calculator:r.route.includes('/calculator-practice/'),algebraic:r.route.includes('/linearization-and-differentials/')});
  for(const [mode,g]of Object.entries(r.modes)){
   const def=defs[mode];assert.ok(def,mode);const name=def.keypad||mode,match=source.match(new RegExp('"'+name+'":(\\{[^\\n]+\\})'));
   const profile=applicationKeypads[name]||(match&&vm.runInNewContext('('+match[1].replace(/,\s*$/,'')+')'));assert.ok(profile,name);
   const functions=new Set((profile.functions||[]).map(x=>x[1]));if(profile.radical)functions.add('sqrt');if(profile.logarithm)functions.add('ln');if(profile.exponent&&profile.constants?.includes('e'))functions.add('exp');
   for(const f of g.functions)assert.ok(functions.has(f),r.route+': '+mode+' missing '+f);
   for(const s of g.symbols){if(['infinity','inf','None'].includes(s)){if(s!=='None')assert.ok(profile.infinity);continue;}assert.ok([...(profile.constants||[]),...(profile.variables||[])].includes(s),mode+' missing '+s);}
  }
 }
});
test('Unit 3 sources and inline configuration are unchanged',()=>{
 for(const f of ['ap-topic-generators','ap-topic-practice','unit3-applications-generators','unit3-optimization-related-rates','derivative-expression-checker','line-equation-checker'])
  assert.equal(withoutApprovedKeypadCorrections(fs.readFileSync(root+'assets/'+f+'.js','utf8'),'assets/'+f+'.js'),execFileSync('git',['show','1c95ed9:assets/'+f+'.js'],{cwd:root,encoding:'utf8',maxBuffer:8000000}));
 for(const r of records){const before=execFileSync('git',['show','1c95ed9:'+r.route],{cwd:root,encoding:'utf8'}),after=fs.readFileSync(root+r.route,'utf8'),inline=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!m[1].includes('src=')).map(x=>x[2]);assert.deepEqual(inline(after),inline(before));}
});
