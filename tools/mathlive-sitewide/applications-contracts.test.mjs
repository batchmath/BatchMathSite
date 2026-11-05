import test from 'node:test';import assert from 'node:assert/strict';import {engine,routes} from './applications-engine.mjs';
import {applicationExpression,applicationNumber,numericToLatex,applicationPair,applicationInterval,applicationIntervalToLatex} from '../../assets/mathlive/applications-contracts.mjs';
function numericProblem(){const e=engine(routes.find(r=>r.slug==='using-your-graphing-calculator')),p=e.generate(719);p.requiredDecimals=0;return{e,p};}
function check(e,p,raw){e.load(p);e.mount.inputs[0].value=raw;e.mount.options.onCheck();return e.snapshot().feedback;}
test('numeric Number-first checkers cannot mistake MathLive multiplication by e for scientific notation',()=>{const {e,p}=numericProblem();p.numericAnswer=6*Math.E;
 assert.match(check(e,p,applicationNumber('2e3').input),/result good/);
 assert.match(check(e,p,'2e3'),/result bad/);
 p.numericAnswer=2000;const imported=applicationNumber(numericToLatex('2e3').latex);assert.match(check(e,p,imported.input),/result good/);assert.match(check(e,p,'2e3'),/result good/);
});
test('decimal spelling, approximation annotations and thousands separators retain original formatting policy',()=>{const {e,p}=numericProblem();p.numericAnswer=1.23;p.requiredDecimals=3;
 for(const s of ['1.230','1.23','1.230+0','≈1.230'])assert.equal(check(e,p,applicationNumber(s.replace('≈','\\approx ')).input),check(e,p,s));
 p.numericAnswer=1000;assert.equal(check(e,p,applicationNumber('1{,}000.000').input),check(e,p,'1,000.000'));
 assert.equal(applicationExpression('x=1.230').input,'x=1.230');
});
test('equations stay equations, including required-left-side failures and unsimplified forms',()=>{const e=engine(routes.find(r=>r.slug==='equations-of-tangent-and-normal-lines')),p=e.generate(719);p.lineAnswer={equation:'y=2*x-5',requiredVariable:'y'};
 for(const s of ['y=2*(x-3)+1','y-1=2*(x-3)','x=(y+5)/2'])assert.equal(check(e,p,applicationExpression(s,{line:true}).input),check(e,p,s));
 assert.match(check(e,p,applicationExpression('y=\\sqrt{4}x-5',{line:true}).input),/result good/);
});
test('ordered pairs and intervals keep their distinct brackets, order and endpoint contracts',()=>{
 assert.equal(applicationPair('\\left(\\frac{1}{2},\\sqrt3\\right)').input,'((1)/(2),sqrt(3))');
 assert.equal(applicationPair('[1,2]').input,null);
 const tex=applicationIntervalToLatex('(-inf,1.230]U[2.000,inf)').latex;assert.ok(tex);assert.equal(applicationInterval(tex).input,'(-infinity,1.230]∪[2.000,infinity)');
 assert.equal(applicationExpression('\\sqrt[3]{8}').input.includes('root('),false);
});
