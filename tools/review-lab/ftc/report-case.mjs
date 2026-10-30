// The v12.8.V report case on the FTC page: the keypad sequence 2 x sec x xⁿ 6 → →, what the editor serializes,
// and what the page's own checker says for it and for related right and wrong answers to F'(x) = 2x sec(x^6).
// Usage: node ftc/report-case.mjs        (BM_ROOT=<tree> to run it on another version)
import {serve,browser,context,open,randomPort} from '../lib/browser.mjs';
import {keypad} from '../lib/keypad.mjs';
const PORT=randomPort(9950),srv=await serve(PORT),b=await browser(),c=await context(b,{width:1366,height:768});
const p=await open(c,`http://127.0.0.1:${PORT}/ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/practice/?bm_seed=2xsec`);
const k=keypad(p);
await p.locator('#choices .bm-calc-editor').first().click();await k.key('Clear');
const seq=['2','x','sec','x','xⁿ','6','→','→'];for(const s of seq)await k.key(s);
const keypadSerialized=await k.source();
// F(x) = ∫ from 1 to x^2 of sec(t^3) dt  =>  F'(x) = 2x sec(x^6); probes inside the domain, as the generator picks them
const answer={kind:'function-expression',expression:'2*x*sec((x)^6)',probes:[-0.22,-0.1,0,0.12,0.24]};
const inputs=[[keypadSerialized,true],['2xsec(x^6)',true],['2*x*sec(x^6)',true],['2x sec(x^6)',true],['sec(x^6)',false],['2xsec(x^5)',false],['2xcos(x^6)',false],['xsec(x^6)',false]];
const results=await p.evaluate(([inputs,answer])=>inputs.map(([s])=>({input:s,result:window.BatchMathUnit4Answers.check(s,answer)})),[inputs,answer]);
console.log(`keypad sequence: ${seq.join(' ')}  ->  ${keypadSerialized}`);
let wrong=0;
results.forEach((r,i)=>{const want=inputs[i][1],got=r.result.valid?(r.result.ok?'correct':'not correct'):`invalid ("${r.result.message}")`;const ok=want?got==='correct':got==='not correct';if(!ok)wrong++;console.log(`${r.input.padEnd(16)} ${got.padEnd(48)} expected ${want?'correct':'not correct'}${ok?'':'  <-- differs'}`);});
console.log(wrong?`${wrong} result(s) differ from the v12.8.V expectation`:'all as expected (v12.8.V behavior)');
await b.close();srv.close();if(wrong)process.exitCode=1;
