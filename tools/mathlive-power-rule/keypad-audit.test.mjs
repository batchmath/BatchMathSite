import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {engine,rng,root} from './engine.mjs';
import {parseInput} from '../../assets/mathlive/answer-adapter.mjs';

test('the shared keypad implementation and unrelated profiles are unchanged from the successful pilot',()=>{
  const before=execFileSync('git',['show','1fdbcbec2550d08dc900aacbc83529389e942e7f:assets/calculus-keypad.js'],{cwd:root,encoding:'utf8'});
  const current=fs.readFileSync(root+'assets/calculus-keypad.js','utf8');
  const withoutPilots=s=>s.replace(/^.*"derivative-(?:power|chain)":.*$/gm,'');
  assert.equal(withoutPilots(current),withoutPilots(before));
});

test('Power Rule profile covers the actual generated answer grammar, including all irrational constants',()=>{
  const code=fs.readFileSync(root+'assets/calculus-keypad.js','utf8');
  const profile=vm.runInNewContext('('+code.match(/"derivative-power":(\{[^\n]+\})/)[1]+')');
  const symbols=new Set(),functions=new Set(),operators=new Set(),irrational=new Set();let count=0;
  function visit(node){
    if(node.type==='sym')symbols.add(node.name);
    if(node.type==='call')functions.add(node.name);
    if(node.type==='binary')operators.add(node.op);
    for(const child of Object.values(node)){
      if(Array.isArray(child))child.forEach(x=>x&&typeof x==='object'&&visit(x));
      else if(child&&typeof child==='object')visit(child);
    }
  }
  const {qa,BatchMathRNG}=engine();
  for(const order of ['first','higher'])for(const family of ['mixed','polynomial','negative','fractional','irrational']){
    if(order==='higher'&&family==='irrational')continue;
    for(let seed=1;seed<=400;seed++){
      BatchMathRNG.random=rng(seed*173+family.length*59);const p=qa.powerRuleProblem(order,family);
      const parsed=parseInput(p.answerExpr);assert.equal(parsed.status,'complete');visit(parsed.tree);count++;
      if(p.id.startsWith('pr-irr-'))irrational.add(p.id.split('-')[3]);
    }
  }
  assert.equal(count,3600);
  assert.deepEqual([...symbols].sort(),['e','pi','x']);assert.deepEqual([...functions],['sqrt']);
  for(const symbol of symbols)assert.ok([...profile.constants,...profile.variables].includes(symbol),symbol);
  assert.ok(profile.radical&&profile.fraction&&profile.exponent&&profile.arithmetic&&profile.parentheses);
  for(const key of ['sqrt2','sqrt3','pi','e'])assert.ok(irrational.has(key));
  assert.ok(operators.has('/')&&operators.has('^'));
  assert.equal(profile.functions,undefined);assert.equal(profile.logarithm,undefined);
  // The unchanged checker has no root() identifier. Nth roots have an existing
  // keypad-only representation x^(p/q), rather than an ungradeable root() key.
  assert.equal(profile.nthRoot,undefined);
});
