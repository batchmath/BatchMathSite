// IM1 Unit 4 practice engines in Chromium, at 1366x900 and 390x844 (touch): all 22 engines (Sections 1-4, the four
// section reviews, the Unit 4 Comprehensive Review) and every Practice Type option, answered through the page itself.
// Each round answers alternately correctly and incorrectly:
//   - number answers are typed on the keyboard into their MathLive fields (equivalent forms: 0.75 for 3/4, 2/6 for 1/3);
//   - formulas and equations are entered as MathLive LaTeX, alternately in the stated form and an equivalent one
//     (a_n = 2(2)^n for 4(2)^(n-1); y = (48)(1/4)^x for (12)(1/4)^(x-1));
//   - growth/decay is typed into its plain text box;
//   - Check and Enter are used alternately.
// Checks: the right feedback and a worked solution every time; the complete correct response after a wrong answer;
// the Correct/Attempted counters; Enter moves on after a correct answer and Next Problem always does; each Practice Type
// gives only its own kind of problem; every field is a MathLive field except the growth/decay box; each field's keypad
// has the keys its answer needs (digits, minus, decimal point, fraction; a₁; aₙ and aₙ₋₁; exponent and n; x, y and f(x));
// no multiple-choice buttons (only 1A's Yes/No); the keypad alone can enter a recursive rule, an explicit formula, an
// exponential equation and a solution; no script errors, failed requests or horizontal overflow.
// Usage: BM_PORT=<port of a server for the site root> node tools/review-lab/im1/unit4-practice-browser.mjs [section ...]
//        (sections: 1 2 3 4 unit; default all)
import fs from 'node:fs';
import {browser, context, outDir} from '../lib/browser.mjs';

const BASE = `http://127.0.0.1:${+process.env.BM_PORT}`, UNIT = '/im1/unit-4-exponential-functions/topics/';
const out = {checks: 0, failures: [], answered: 0, correctRounds: 0, wrongRounds: 0, modes: 0, keypadEntries: 0, labSpeechEngineErrors: 0}, shots = outDir('im1-unit4-practice');
const ok = (c, m) => {out.checks++; if (!c) out.failures.push(m);};
const S = ['a-geometric-sequences', 'b-recursive-formulas', 'c-explicit-formulas-and-exponential-models', 'd-solving-exponential-equations'];
const lessons = {
 1: ['geometric-or-not', 'common-ratios-and-next-terms', 'finding-terms-of-geometric-sequences', 'geometric-growth-and-decay-modeling'],
 2: ['writing-recursive-formulas', 'using-recursive-formulas', 'recursive-formulas-from-tables-and-contexts'],
 3: ['writing-explicit-formulas', 'converting-recursive-to-explicit', 'converting-explicit-to-recursive', 'explicit-formulas-from-tables-and-terms', 'exponential-growth-and-decay-models', 'writing-exponential-equations-from-y-intercept-and-common-ratio', 'writing-equivalent-explicit-exponential-equations-from-a-point'],
 4: ['solving-basic-exponential-equations', 'solving-exponential-equations-with-algebraic-exponents', 'solving-exponential-equations-with-coefficients']
};
const prefixOf = {}; Object.entries(lessons).forEach(([n, list]) => list.forEach((slug, i) => {prefixOf[slug] = `u4-0${n}${'abcdefg'[i]}`;}));
const ENGINES = [];   // [route, slug, modes, allowed id prefix]
for (const n of [1, 2, 3, 4]) {
 for (const slug of lessons[n]) ENGINES.push([`${UNIT}${S[n - 1]}/${slug}/practice/`, slug, slug === 'geometric-growth-and-decay-modeling' ? ['mixed', 'factors', 'models'] : [null], new RegExp(`^${prefixOf[slug]}`), n]);
 ENGINES.push([`${UNIT}${S[n - 1]}/section-${'abcd'[n - 1]}-review/practice/`, `section-${'abcd'[n - 1]}-review`, ['mixed', ...lessons[n]], new RegExp(`^u4-0${n}`), n]);
}
ENGINES.push([`${UNIT}comprehensive-review/practice/`, 'comprehensive-review', ['mixed', 'section-1', 'section-2', 'section-3', 'section-4'], /^u4-0[1-4]/, 'unit']);
const MODE_PREFIX = {factors: /^u4-01d-factor/, models: /^u4-01d-model/, ...Object.fromEntries(Object.entries(prefixOf).map(([slug, pre]) => [slug, new RegExp(`^${pre}`)])), 'section-1': /^u4-01/, 'section-2': /^u4-02/, 'section-3': /^u4-03/, 'section-4': /^u4-04/};
const only = process.argv.slice(2);

// ---- answers ----
const frac = s => {const m = String(s).match(/^(-?\d+)\/(\d+)$/); return m ? [+m[1], +m[2]] : [Number(s), 1];};
const texOf = s => {const [n, d] = frac(s); return d === 1 ? String(n) : `${n < 0 ? '-' : ''}\\frac{${Math.abs(n)}}{${d}}`;};
const mulS = (a, b) => {const [p, q] = frac(a), [r, s] = frac(b); let n = p * r, d = q * s; const g = (x, y) => y ? g(y, x % y) : Math.abs(x); const k = g(n, d) || 1; n /= k; d /= k; if (d < 0) {n = -n; d = -d;} return d === 1 ? String(n) : `${n}/${d}`;};
const divS = (a, b) => {const [r, s] = frac(b); return mulS(a, r < 0 ? `${-s}/${-r}` : `${s}/${r}`);};
const strip = t => String(t).replace(/^\\\(|\\\)$/g, '');
// an equivalent but differently written exact number
function variantNumber(answer, k) {
 const [n, d] = frac(answer); if (d === 1) return String(answer);
 let t = d; for (const p of [2, 5]) while (t % p === 0) t /= p;
 return k % 2 === 0 && t === 1 ? String(n / d) : `${n * 2}/${d * 2}`;
}
const wrongNumber = answer => {const [n, d] = frac(answer); return d === 1 ? String(n + 1) : `${n + d}/${d}`;};
// the value a field should receive: [how, value]; how = 'type' (keyboard), 'latex' (MathLive value) or 'word'
function entryFor(f, right, k) {
 if (f.check === 'word') return ['word', right ? (k % 2 ? f.answer.toUpperCase() : f.answer[0].toUpperCase() + f.answer.slice(1)) : (f.answer === 'growth' ? 'decay' : 'growth')];
 if (f.custom === 'explicit') {
  const forms = [`a_n=${texOf(f.a1)}\\left(${texOf(f.ratio)}\\right)^{n-1}`, `${texOf(divS(f.a1, f.ratio))}\\left(${texOf(f.ratio)}\\right)^{n}`];
  return ['latex', right ? forms[k % 2] : `a_n=${texOf(f.a1)}\\left(${texOf(f.ratio)}\\right)^{n}`];
 }
 if (f.custom === 'rule') return ['latex', right ? (k % 2 ? `${texOf(f.ratio)}a_{n-1}` : `a_n=a_{n-1}\\cdot\\left(${texOf(f.ratio)}\\right)`) : `a_n=a_{n-1}+${texOf(f.ratio)}`];
 if (f.custom === 'exponential') {
  const forms = [`y=\\left(${texOf(f.b)}\\right)\\left(${texOf(f.ratio)}\\right)^{x}`, `f\\left(x\\right)=\\left(${texOf(mulS(f.b, f.ratio))}\\right)\\left(${texOf(f.ratio)}\\right)^{x-1}`, `y=\\left(${texOf(divS(f.b, f.ratio))}\\right)\\left(${texOf(f.ratio)}\\right)^{x+1}`];
  return ['latex', right ? forms[(k + Number(f.id.match(/\d+$/)?.[0] || 0)) % 3] : `y=\\left(${texOf(f.b)}\\right)\\left(${texOf(f.ratio)}\\right)^{x+1}`];
 }
 if (f.check === 'initial-term') return ['latex', right ? (k % 2 ? `a_1=${texOf(f.answer)}` : texOf(f.answer)) : texOf(wrongNumber(f.answer))];
 if (f.custom === 'solution') return ['type', right ? (k % 2 ? variantNumber(f.answer, k) : f.answer) : wrongNumber(f.answer)];
 return ['type', right ? variantNumber(f.answer, k) : wrongNumber(f.answer)];
}
// keys each kind of field needs on its keypad
const keysFor = f => f.check === 'word' ? [] : [...['0', '1', '9', '−', '.', 'Check'], ...(f.check === 'initial-term' ? ['a₁', '='] : []), ...(f.custom === 'rule' ? ['aₙ', 'aₙ₋₁', '='] : []),
 ...(f.custom === 'explicit' ? ['aₙ', 'n', 'xⁿ', '(', ')', '='] : []), ...(f.custom === 'exponential' ? ['x', 'y', 'f(x)', 'xⁿ', '(', ')', '='] : [])];

const b = await browser();
for (const [w, h, mob] of [[1366, 900, false], [390, 844, true]]) {
 const vp = `${w}x${h}`, c = await context(b, {width: w, height: h, mobile: mob});
 await c.addInitScript(() => {let real; Object.defineProperty(window, 'BMAnalytics', {configurable: true, get() {return real;}, set(v) {real = v; const g = v.problemGenerated?.bind(v); v.problemGenerated = p => {window.__bmProblem = p; window.__bmCount = (window.__bmCount || 0) + 1; return g?.(p);};}});});
 for (const [route, slug, modes, prefix, section] of ENGINES) {
  if (only.length && !only.includes(String(section))) continue;
  const p = await c.newPage(), errs = [], failed = [], label = `${vp} ${slug}`;
  p.on('pageerror', e => {const s = `${e.message} ${(e.stack || '').split('\n')[1] || ''}`; if (/at addSpeech \(https:\/\/cdn\.jsdelivr\.net\/npm\/mathjax@4\.1\.3\//.test(s)) out.labSpeechEngineErrors++; else errs.push(s);});
  p.on('console', m => {if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push(m.text()); if (m.type() === 'warning' && /MathLive fallback/.test(m.text())) errs.push(m.text());});
  p.on('requestfailed', r => {if (r.url().startsWith(BASE)) failed.push(r.url());});
  p.on('response', r => {if (r.url().startsWith(BASE) && r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);});
  await p.goto(`${BASE}${route}?bm_seed=u4p-${slug}-${w}`);
  await p.waitForFunction(() => window.__bmProblem && document.querySelector('#question')?.textContent.trim(), null, {timeout: 20000}).catch(() => {});
  ok(await p.locator('h1').count() === 1, `${label}: H1`);
  const options = await p.$$eval('#practiceMode option', os => os.map(o => o.value));
  ok(JSON.stringify(options) === JSON.stringify(modes[0] === null ? [] : modes), `${label}: Practice Type options ${JSON.stringify(options)}`);
  let score = 0, attempted = 0, round = 0;
  for (const mode of modes) {
   if (mode && mode !== 'mixed') {await p.selectOption('#practiceMode', mode); await p.waitForTimeout(500); out.modes++;}
   for (let r = 0; r < (mode && mode !== 'mixed' ? 2 : 4); r++, round++) {
    await p.waitForFunction(() => window.__bmProblem && document.querySelector('#question')?.textContent.trim(), null, {timeout: 15000}).catch(() => {});
    const prob = await p.evaluate(() => {const x = window.__bmProblem; return x && {id: x.id, kind: x.kind, correctIndex: x.correctIndex, choices: x.choices, arithmetic: x.arithmetic, difference: x.difference, fields: x.fields?.map(f => ({id: f.id, check: f.check, custom: f.custom, answer: f.answer, a1: f.a1, ratio: f.ratio, b: f.b}))};});
    const where = `${label}${mode ? `[${mode}]` : ''} ${prob?.id}`;
    if (!prob) {ok(false, `${where}: no problem`); break;}
    ok(prefix.test(prob.id) && (!MODE_PREFIX[mode] || MODE_PREFIX[mode].test(prob.id)), `${where}: wrong kind of problem for this page or Practice Type`);
    ok(await p.locator('.choice-btn').count() === (prob.kind === 'arithmetic-identification' ? 2 : 0) && prob.kind !== 'mc', `${where}: choice buttons on a typed problem`);
    const right = round % 2 === 0, before = await p.evaluate(() => window.__bmCount);
    let typed = false;
    if (prob.kind === 'arithmetic-identification') {
     const choose = right ? prob.correctIndex : 1 - prob.correctIndex;
     await p.locator('.choice-btn').nth(choose).click(); await p.waitForTimeout(250);
     if (right && prob.arithmetic) {
      const field = p.locator('#answerArea math-field').first();
      await field.waitFor({state: 'visible', timeout: 8000}).catch(() => {});
      await field.click(); await p.keyboard.type(variantNumber(prob.difference, round)); await p.keyboard.press('Enter'); typed = true;
     }
    } else {
     const wrappers = p.locator('.bm-u3-answer-field');
     ok(await wrappers.count() === prob.fields.length, `${where}: ${await wrappers.count()} fields for ${prob.fields.length} answers`);
     await p.locator('.bm-u3-answer-field math-field').first().waitFor({state: 'visible', timeout: 10000}).catch(() => {});
     for (let i = 0; i < prob.fields.length; i++) {
      const f = prob.fields[i], wrap = wrappers.nth(i), isWord = f.check === 'word';
      ok(await wrap.locator('math-field').count() === (isWord ? 0 : 1) && await wrap.locator('input.bm-word-input').count() === (isWord ? 1 : 0), `${where}: field ${f.id} is ${isWord ? 'not ' : ''}a MathLive field`);
      // the field's keypad has its keys
      if (!isWord && (round < 2 || i === 0)) {
       await wrap.locator('math-field').click(); await p.waitForTimeout(150);
       const keys = await p.$$eval('#answerArea button:visible', bs => bs.map(x => x.textContent.trim()));
       const missing = keysFor(f).filter(k => !keys.includes(k));
       ok(!missing.length && keys.some(k => /^a\s*b$|a⁄b|^ab$/.test(k)), `${where}: field ${f.id} keypad lacks ${missing.join(' ') || 'the fraction key'}`);
      }
      const [how, value] = entryFor(f, right || i > 0, round + i);
      if (how === 'word') {await wrap.locator('input').fill(''); await wrap.locator('input').click(); await p.keyboard.type(value);}
      else if (how === 'type') {const mf = wrap.locator('math-field'); await mf.click(); await p.keyboard.press('Control+A').catch(() => {}); await p.keyboard.type(String(value));}
      else await wrap.locator('math-field').evaluate((mf, latex) => {mf.setValue(latex); mf.dispatchEvent(new Event('input', {bubbles: true}));}, value);
     }
     // check with the Check key (the last field focused) or with Enter in the first field
     if (round % 3 === 0) {
      const check = p.locator('#answerArea button:visible:text-is("Check")').first();
      if (await check.isDisabled()) ok(false, `${where}: the Check key is disabled before checking (${JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('#answerArea button')].filter(x => x.textContent.trim() === 'Check').map(x => [x.className, x.disabled, !!x.getClientRects().length])))})`);
      await check.click({timeout: 5000}).catch(async () => {await p.keyboard.press('Enter');});
     }
     else {const first = wrappers.nth(0); if (prob.fields[0].check === 'word') await first.locator('input').click(); else await first.locator('math-field').click(); await p.keyboard.press('End').catch(() => {}); await p.keyboard.press('Enter');}
     typed = true;
    }
    await p.waitForFunction(() => /\bcorrect\b|\bincorrect\b/.test(document.querySelector('#feedback')?.className || '') && !document.querySelector('#nextBtn').hidden, null, {timeout: 8000}).catch(() => {});
    const fb = await p.evaluate(() => ({cls: document.querySelector('#feedback').className, text: document.querySelector('#feedback').innerText, steps: !!document.querySelector('#feedback .bm-u3-worked-steps'), score: +document.querySelector('#score').textContent, attempted: +document.querySelector('#attempted').textContent,
     fieldResults: [...document.querySelectorAll('.bm-u3-field-result')].map(x => x.textContent.trim()), values: [...document.querySelectorAll('.bm-u3-answer-field')].map(w => `${w.querySelector('math-field')?.value ?? ''} => ${w.querySelector('input')?.value}`)}));
    attempted++; if (right) score++;
    ok(right ? /\bcorrect\b/.test(fb.cls) && !/incorrect/.test(fb.cls) : /incorrect/.test(fb.cls), `${where}: ${right ? 'correct' : 'wrong'} answer graded "${fb.cls}" (${fb.text.slice(0, 90)} | ${fb.fieldResults.join(' / ')} | entered: ${fb.values.join(' ; ')})`);
    ok(fb.steps, `${where}: no worked solution shown`);
    if (!right) ok(/Complete correct response/.test(fb.text), `${where}: the correct response is not shown after a wrong answer`);
    ok(fb.score === score && fb.attempted === attempted, `${where}: counters ${fb.score}/${fb.attempted}, expected ${score}/${attempted}`);
    if (right) out.correctRounds++; else out.wrongRounds++;
    out.answered++;
    if (round === 0) await p.screenshot({path: `${shots}/${slug}-answered-${w}.png`, fullPage: true});
    if (right && typed) await p.keyboard.press('Enter'); else await p.locator('#nextBtn').click();
    await p.waitForFunction(n => window.__bmCount > n, before, {timeout: 8000}).catch(() => {});
    ok(await p.evaluate(n => window.__bmCount > n, before), `${where}: did not move to a new problem (${right && typed ? 'Enter' : 'Next Problem'})`);
   }
  }
  ok(await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0, `${label}: wider than the screen`);
  for (const e of errs) ok(false, `${label}: ${e}`); for (const f of failed) ok(false, `${label}: failed request ${f}`);
  await p.close();
 }
 // ---- the keypad alone can enter each kind of answer (whole-number problems, clicked key by key) ----
 const keyEntry = [
  ['2', `${UNIT}${S[1]}/writing-recursive-formulas/practice/`, f => f.every(x => /^-?\d+$/.test(x.answer ?? x.ratio)), f => [[...digits(f[0].answer)], ['aₙ', '=', ...digits(f[1].ratio), 'aₙ₋₁']]],
  ['3', `${UNIT}${S[2]}/converting-recursive-to-explicit/practice/`, f => f.length === 1 && /^-?\d+$/.test(f[0].a1) && /^\d+$/.test(f[0].ratio), f => [[...digits(f[0].a1), '(', ...digits(f[0].ratio), ')', 'xⁿ', 'n', '−', '1']]],
  ['3', `${UNIT}${S[2]}/writing-exponential-equations-from-y-intercept-and-common-ratio/practice/`, f => f.length === 1 && /^-?\d+$/.test(f[0].b) && /^\d+$/.test(f[0].ratio), f => [['y', '=', '(', ...digits(f[0].b), ')', '(', ...digits(f[0].ratio), ')', 'xⁿ', 'x']]],
  ['4', `${UNIT}${S[3]}/solving-exponential-equations-with-coefficients/practice/`, f => /^-?\d+$/.test(f[0].answer), f => [[...digits(f[0].answer)]]]
 ];
 function digits(s) {return [...String(s)].map(ch => ch === '-' ? '−' : ch);}
 for (const [section, route, suits, keysOf] of keyEntry) {
  if (only.length && !only.includes(section)) continue;
  const p = await c.newPage(), where = `${vp} keypad entry ${route.split('/').at(-3)}`;
  await p.goto(`${BASE}${route}?bm_seed=u4keys-${w}`);
  let fields = null;
  for (let tries = 0; tries < 40; tries++) {
   await p.waitForFunction(() => window.__bmProblem, null, {timeout: 15000}).catch(() => {});
   fields = await p.evaluate(() => window.__bmProblem.fields.map(f => ({id: f.id, answer: f.answer, a1: f.a1, ratio: f.ratio, b: f.b})));
   if (suits(fields)) break;
   const before = await p.evaluate(() => window.__bmCount);
   await p.locator('#resetBtn').click(); await p.waitForFunction(n => window.__bmCount > n, before, {timeout: 8000}).catch(() => {});
   fields = null;
  }
  if (!fields) {ok(false, `${where}: no whole-number problem found`); await p.close(); continue;}
  await p.locator('.bm-u3-answer-field math-field').first().waitFor({state: 'visible', timeout: 10000}).catch(() => {});
  const sequences = keysOf(fields);
  for (let i = 0; i < sequences.length; i++) {
   await p.locator('.bm-u3-answer-field math-field').nth(i).click(); await p.waitForTimeout(150);
   for (const key of sequences[i]) await p.locator('#answerArea button:visible').filter({hasText: new RegExp(`^${key.replace(/[()]/g, '\\$&')}$`)}).first().click();
  }
  await p.locator('#answerArea button:visible:text-is("Check")').first().click();
  await p.waitForFunction(() => /\bcorrect\b|\bincorrect\b/.test(document.querySelector('#feedback')?.className || ''), null, {timeout: 8000}).catch(() => {});
  const fb = await p.evaluate(() => ({cls: document.querySelector('#feedback').className, results: [...document.querySelectorAll('.bm-u3-field-result')].map(x => x.textContent.trim()), values: [...document.querySelectorAll('#answerArea math-field')].map(m => m.value)}));
  ok(/\bcorrect\b/.test(fb.cls) && !/incorrect/.test(fb.cls), `${where}: keypad entry ${JSON.stringify(sequences)} graded "${fb.cls}" (${fb.values.join(' | ')}; ${fb.results.join(' / ')})`);
  out.keypadEntries++;
  if (!mob) await p.screenshot({path: `${shots}/keypad-entry-${route.split('/').at(-3)}-${w}.png`, fullPage: true});
  await p.close();
 }
 await c.close();
}
await b.close();
fs.writeFileSync(`${shots}/results.json`, JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({...out, failures: out.failures.slice(0, 50), failureCount: out.failures.length}, null, 1));
if (out.failures.length) process.exitCode = 1;
