import assert from 'node:assert/strict';import fs from 'node:fs';
import {engine,slugs} from '../mathlive-advanced-pilot/engine.mjs';
import {translateAdvancedExpression} from '../../assets/mathlive/answer-adapter.mjs';
const w=engine(),check=w.BatchMathUnit4Answers.check,results=[];
const spec={kind:'function-expression',expression:'2*x*sec(x^6)'};
for(const [input,ok] of [['2xsec(x^6)',true],['2*x*sec(x^6)',true],['sec(x^6)',false],['2xsec(x)^6',false]]){const result=check(input,spec);assert.equal(result.ok,ok);results.push({input,result});}
const translated=translateAdvancedExpression('2x\\sec(x^6)');assert.equal(check(translated.input,spec).ok,true);results.push({latex:'2x\\sec(x^6)',translated,result:check(translated.input,spec)});
const wrongContext={kind:'function-expression',expression:'2*x*sec(x^6)^2'};assert.equal(check('2xsec(x^6)',wrongContext).ok,false);results.push({input:'2xsec(x^6)',expected:'2*x*sec(x^6)^2',result:check('2xsec(x^6)',wrongContext)});
for(let i=0;i<20;i++){const p=w.BatchMathAPTopicGenerators.get(slugs.ftc)(),a=p.stage1.unit4Answer,t=translateAdvancedExpression(p.stage1.answerTex);assert.equal(check(t.input,a).ok,true,p.id);assert.equal(check(`(${t.input})+1`,a).ok,false,p.id);}
fs.writeFileSync('tools/keypad-corrections/artifacts/ftc.json',JSON.stringify({focusedCases:results,generatedQuestions:20,generatedCheckerCalls:40,conclusion:'Matching-context format accepted; original rejected question unavailable. No checker change justified.'},null,2)+'\n');console.log('6 focused FTC cases + 20 generated correct/wrong pairs pass; checker unchanged.');
