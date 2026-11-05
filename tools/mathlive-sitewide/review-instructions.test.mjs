import test from 'node:test';
import assert from 'node:assert/strict';
import {instructionCases} from '../integration/review-instruction-fixture.mjs';
function check(e,q,raw){e.qa.current={...q,answered:false};e.el('answer').value=raw;e.qa.check();return e.el('feedback').innerHTML.match(/class="status">([^<]+)/)?.[1];}
test('all reachable review selectors retain authored task instructions and identical mathematics',()=>{
 const {e,old,reps,changed,generated,modes}=instructionCases();
 assert.equal(generated,26400);assert.equal(modes.length,22);assert.equal(reps.size,610);
 for(const {q,before}of reps.values())if(q.__authoredPrompt!==undefined)assert.ok(q.q.includes(`<div class="question-prompt">${q.__authoredPrompt||'Find the derivative.'}</div>`),q.id+': '+q.q);else assert.equal(q.q,before.q);
 assert.equal(changed.size,93);
 for(const{q,before}of changed.values()){
  assert.equal(check(e,q,q.answerExpr),'Correct.',q.id);assert.equal(check(old,before,q.answerExpr),'Correct.',q.id);
  assert.equal(check(e,q,'('+q.answerExpr+')+12345'),'Not quite.',q.id);
 }
 for(const kind of['dqmix-l-','dqmix-q-','dqmix-r-','dqmix-rec-'])assert.ok([...changed.values()].some(({q})=>q.id.startsWith(kind)),kind);
 for(const order of['third','fourth'])assert.ok([...changed.values()].some(({q})=>q.__authoredPrompt.includes(order)),order);
 assert.ok([...changed.values()].some(({q})=>q.__authoredPrompt.includes('implicit differentiation')));
 assert.ok([...changed.values()].some(({q})=>q.__authoredPrompt.includes('simplify completely')));
 assert.ok([...changed.values()].some(({q})=>q.__authoredPrompt.includes('x>0')));
 // No derivative-by-limit family is present in the actual reachable catalog.
 assert.equal([...reps.values()].map(r=>r.q).filter(q=>/limit definition/i.test(q.__authoredPrompt)).length,0);
 // A derivative with h set to zero is not the quadratic difference quotient.
 for(const q of [...reps.values()].map(r=>r.q).filter(q=>q.id.startsWith('dqmix-q-')).slice(0,3))assert.equal(check(e,q,q.answerExpr.replace(/\*h/g,'*0')),'Not quite.');
 // Required polynomial form remains enforced independently of equivalence.
 for(const{q}of changed.values())if(/^pb[123]-/.test(q.id))assert.equal(check(e,q,'('+q.answerExpr+')'),'Equivalent, but distribute and combine like terms to simplify completely.');
});
