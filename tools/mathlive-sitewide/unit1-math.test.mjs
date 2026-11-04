import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const b={window:{}};vm.createContext(b);vm.runInContext(fs.readFileSync(new URL('../../assets/unit1-practice-ui.js',import.meta.url),'utf8'),b);
test('Unit 1 numeric parser respects mathematical unary-minus and exponent precedence',()=>{
 const parse=b.window.BMUnit1UI.parse;
 for(const [s,value]of [['-2^2',-4],['(-2)^2',4],['2^-2',.25],['-2^-2',-.25],['-2^2+5',1],['2^3^2',512],['3*-2^2',-12],['sqrt(4)/-2',-1],['root(3,-8)',-2],['1/(2/3)',1.5]])assert.equal(parse(s).value,value,s);
 for(const s of ['','1/0','undefined','sqrt(-1)','root(2,-8)'])assert.ok(parse(s).error,s);
});
