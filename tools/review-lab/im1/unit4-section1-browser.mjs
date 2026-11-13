// IM1 Unit 4 Section 1 practice engines in Chromium, at 1366x900 and 390x844 (touch): each engine and Practice Type is
// answered through the page itself (MathLive fields, the keypad's keys, Enter, Yes/No buttons, the typed growth/decay box),
// alternately
// correctly and incorrectly. Checks: the right feedback and a worked solution every time; the complete correct response
// after a wrong answer; the Correct/Attempted counters; equivalent forms (a decimal or an unreduced fraction for a
// fraction answer) accepted; Enter moves on after a correct typed answer and Next Problem always does; every Practice
// Type option gives its own kind of problem; the keypad has digits, minus, decimal point and fraction keys; no script
// errors, failed requests or horizontal overflow. v13.0.I: 1D is typed only (no choice buttons); the growth/decay answer is a
// plain text box. All Unit 4 engines, Section 1 included, are also tested by unit4-practice-browser.mjs.
// Usage: BM_PORT=<port of a server for the site root> node tools/review-lab/im1/unit4-section1-browser.mjs
import fs from 'node:fs';
import {browser, context, outDir} from '../lib/browser.mjs';

const BASE = `http://127.0.0.1:${+process.env.BM_PORT}`, U = '/im1/unit-4-exponential-functions/topics/a-geometric-sequences/';
const out = {checks: 0, failures: [], answered: 0, correctRounds: 0, wrongRounds: 0, modes: 0, labSpeechEngineErrors: 0}, shots = outDir('im1-unit4-section1');
const ok = (c, m) => {out.checks++; if (!c) out.failures.push(m);};
const ENGINES = [
 ['geometric-or-not', [null], /^u4-01a/],
 ['common-ratios-and-next-terms', [null], /^u4-01b/],
 ['finding-terms-of-geometric-sequences', [null], /^u4-01c/],
 ['geometric-growth-and-decay-modeling', ['mixed', 'factors', 'models'], /^u4-01d/],
 ['section-a-review', ['mixed', 'geometric-or-not', 'common-ratios-and-next-terms', 'finding-terms-of-geometric-sequences', 'geometric-growth-and-decay-modeling'], /^u4-01[a-d]/]
];
const MODE_PREFIX = {factors: /^u4-01d-factor/, models: /^u4-01d-model/, 'geometric-or-not': /^u4-01a/, 'common-ratios-and-next-terms': /^u4-01b/, 'finding-terms-of-geometric-sequences': /^u4-01c/, 'geometric-growth-and-decay-modeling': /^u4-01d/};
// an equivalent but differently written form of an exact answer
function variantForm(answer, k) {
 const m = String(answer).match(/^(-?\d+)\/(\d+)$/);
 if (!m) return answer;
 const n = +m[1], d = +m[2];
 let t = d; for (const p of [2, 5]) while (t % p === 0) t /= p;
 if (k % 2 === 0 && t === 1) return String(n / d);           // 3/4 -> 0.75
 return `${n * 2}/${d * 2}`;                                    // 1/3 -> 2/6
}
const wrongOf = answer => {const m = String(answer).match(/^(-?\d+)\/(\d+)$/); return m ? `${+m[1] + +m[2]}/${m[2]}` : String(Number(answer) + 1);};

const b = await browser();
for (const [w, h, mob] of [[1366, 900, false], [390, 844, true]]) {
 const vp = `${w}x${h}`, c = await context(b, {width: w, height: h, mobile: mob});
 await c.addInitScript(() => {let real; Object.defineProperty(window, 'BMAnalytics', {configurable: true, get() {return real;}, set(v) {real = v; const g = v.problemGenerated?.bind(v); v.problemGenerated = p => {window.__bmProblem = p; window.__bmCount = (window.__bmCount || 0) + 1; return g?.(p);};}});});
 for (const [slug, modes, prefix] of ENGINES) {
  const p = await c.newPage(), errs = [], failed = [], label = `${vp} ${slug}`;
  p.on('pageerror', e => {const s = `${e.message} ${(e.stack || '').split('\n')[1] || ''}`; if (/at addSpeech \(https:\/\/cdn\.jsdelivr\.net\/npm\/mathjax@4\.1\.3\//.test(s)) out.labSpeechEngineErrors++; else errs.push(s);});
  p.on('console', m => {if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push(m.text());});
  p.on('requestfailed', r => {if (r.url().startsWith(BASE)) failed.push(r.url());});
  p.on('response', r => {if (r.url().startsWith(BASE) && r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);});
  await p.goto(`${BASE}${U}${slug}/practice/?bm_seed=u4s1-${slug}-${w}`);
  await p.waitForFunction(() => window.__bmProblem && document.querySelector('#question')?.textContent.trim(), null, {timeout: 20000}).catch(() => {});
  ok(await p.locator('h1').count() === 1, `${label}: H1`);
  const options = await p.$$eval('#practiceMode option', os => os.map(o => o.value));
  ok(JSON.stringify(options) === JSON.stringify(modes[0] === null ? [] : modes), `${label}: Practice Type options ${JSON.stringify(options)}`);
  let score = 0, attempted = 0, round = 0;
  for (const mode of modes) {
   if (mode && mode !== 'mixed') {await p.selectOption('#practiceMode', mode); await p.waitForTimeout(500); out.modes++;}
   for (let r = 0; r < (mode && mode !== 'mixed' ? 2 : 4); r++, round++) {
    await p.waitForFunction(() => window.__bmProblem && document.querySelector('#question')?.textContent.trim(), null, {timeout: 15000}).catch(() => {});
    const prob = await p.evaluate(() => {const x = window.__bmProblem; return x && {id: x.id, kind: x.kind, correctIndex: x.correctIndex, choices: x.choices, arithmetic: x.arithmetic, difference: x.difference, fields: x.fields?.map(f => f.answer), checks: x.fields?.map(f => f.check)};});
    const where = `${label}${mode ? `[${mode}]` : ''} ${prob?.id}`;
    if (!prob) {ok(false, `${where}: no problem`); break;}
    ok(prefix.test(prob.id) && (!MODE_PREFIX[mode] || MODE_PREFIX[mode].test(prob.id)), `${where}: wrong kind of problem for this page or Practice Type`);
    const right = round % 2 === 0, before = await p.evaluate(() => window.__bmCount);
    let typed = false;
    const typeInto = async (field, value) => {await field.click(); await p.keyboard.press('Control+A').catch(() => {}); await p.keyboard.type(String(value));};
    if (prob.kind === 'arithmetic-identification') {
     const choose = right ? prob.correctIndex : 1 - prob.correctIndex;
     await p.locator('.choice-btn').nth(choose).click(); await p.waitForTimeout(250);
     if (right && prob.arithmetic) {
      const field = p.locator('#answerArea math-field').first();
      await field.waitFor({state: 'visible', timeout: 8000}).catch(() => {});
      ok(await field.count() === 1, `${where}: no common-ratio field after "Yes"`);
      await typeInto(field, variantForm(prob.difference, round)); await p.keyboard.press('Enter'); typed = true;
     }
    } else {
     ok(prob.kind === 'multi' && await p.locator('.choice-btn').count() === 0, `${where}: a ${prob.kind} problem with choice buttons`);
     const fields = p.locator('.bm-u3-answer-field math-field'), mathCount = prob.checks.filter(c => c !== 'word').length;
     ok(await fields.count() === mathCount, `${where}: ${await fields.count()} MathLive fields for ${mathCount} answers`);
     const keys = await p.$$eval('button:visible', bs => bs.map(x => x.textContent.trim()));
     ok(['0', '1', '9', '−', '.', 'Check'].every(k => keys.includes(k)) && keys.some(k => /^a\s*b$|a⁄b|ab/.test(k)), `${where}: keypad keys ${keys.join(' ')}`);
     for (let i = 0, m = 0; i < prob.fields.length; i++) {
      if (prob.checks[i] === 'word') {const box = p.locator('.bm-u3-answer-field input.bm-word-input'); await box.fill(''); await box.click(); await p.keyboard.type(right || i > 0 ? prob.fields[i] : (prob.fields[i] === 'growth' ? 'decay' : 'growth')); continue;}
      await typeInto(fields.nth(m++), right ? variantForm(prob.fields[i], round + i) : i === 0 ? wrongOf(prob.fields[i]) : prob.fields[i]);
     }
     if (round % 4 === 0) await p.locator('button:visible:text-is("Check")').first().click(); else await p.keyboard.press('Enter');
     typed = true;
    }
    await p.waitForFunction(() => /\bcorrect\b|\bincorrect\b/.test(document.querySelector('#feedback')?.className || '') && !document.querySelector('#nextBtn').hidden, null, {timeout: 8000}).catch(() => {});
    const fb = await p.evaluate(() => ({cls: document.querySelector('#feedback').className, text: document.querySelector('#feedback').innerText, steps: !!document.querySelector('#feedback .bm-u3-worked-steps'), score: +document.querySelector('#score').textContent, attempted: +document.querySelector('#attempted').textContent}));
    attempted++; if (right) score++;
    ok(right ? /\bcorrect\b/.test(fb.cls) && !/incorrect/.test(fb.cls) : /incorrect/.test(fb.cls), `${where}: ${right ? 'correct' : 'wrong'} answer graded "${fb.cls}" (${fb.text.slice(0, 80)})`);
    ok(fb.steps, `${where}: no worked solution shown`);
    if (!right) ok(/Complete correct response/.test(fb.text), `${where}: the correct response is not shown after a wrong answer`);
    ok(fb.score === score && fb.attempted === attempted, `${where}: counters ${fb.score}/${fb.attempted}, expected ${score}/${attempted}`);
    if (right) out.correctRounds++; else out.wrongRounds++;
    out.answered++;
    if (round === 0 && !mob) await p.screenshot({path: `${shots}/${slug}-answered-${w}.png`, fullPage: true});
    // move on: Enter after a correct typed answer, otherwise Next Problem
    if (right && typed) await p.keyboard.press('Enter'); else await p.locator('#nextBtn').click();
    await p.waitForFunction(n => window.__bmCount > n, before, {timeout: 8000}).catch(() => {});
    ok(await p.evaluate(n => window.__bmCount > n, before), `${where}: did not move to a new problem (${right && typed ? 'Enter' : 'Next Problem'})`);
   }
  }
  ok(await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0, `${label}: wider than the screen`);
  for (const e of errs) ok(false, `${label}: ${e}`); for (const f of failed) ok(false, `${label}: failed request ${f}`);
  await p.close();
 }
 await c.close();
}
await b.close();
fs.writeFileSync(`${shots}/results.json`, JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({...out, failures: out.failures.slice(0, 40), failureCount: out.failures.length}, null, 1));
if (out.failures.length) process.exitCode = 1;
