#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
const check = (condition, message) => { assert(condition, message); results.push(message); };
const source = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

function rng(seedLabel) {
  const hashSeed = value => {
    const s = String(value ?? ''); let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
    return h >>> 0;
  };
  let state = hashSeed(seedLabel) || 0x6d2b79f5;
  return { random() { state = (state + 0x6D2B79F5) >>> 0; let t = state; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } };
}

function fakePage(seed, values = {}) {
  const elements = new Map(), windowEvents = new Map();
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const events = new Map();
    const node = {
      id, value: values[id] ?? '', disabled: false, hidden: false, innerHTML: '', textContent: '', className: '', style: { display: '' },
      get selectedOptions() { return [{ textContent: this.value }]; },
      addEventListener(type, handler) { if (!events.has(type)) events.set(type, []); events.get(type).push(handler); },
      setAttribute(name, value = '') { this[name] = value; }, focus() {},
      _fire(type, event = {}) { for (const handler of events.get(type) || []) handler(event); }
    };
    elements.set(id, node); return node;
  }
  const context = {
    console, Math, URLSearchParams, location: { search: '?bm_qa=1' },
    document: { getElementById: element, querySelectorAll() { return []; }, querySelector() { return null; }, addEventListener() {} },
    BatchMathRNG: rng(seed), BatchMathCalculusKeypad: { reset() {}, focus() {}, setRaw() {} },
    BMAnalytics: { ensurePracticeStarted() {}, problemGenerated() {}, answerChecked() {}, solutionRevealed() {} }
  };
  context.window = context; context.globalThis = context;
  context.addEventListener = (type, handler) => { if (!windowEvents.has(type)) windowEvents.set(type, []); windowEvents.get(type).push(handler); };
  vm.createContext(context);
  return { context, element, load() { for (const handler of windowEvents.get('load') || []) handler(); } };
}

async function workerChecks() {
  const worker = (await import(pathToFileURL(path.join(ROOT, 'cloudflare/report-problem-worker/src/index.js')).href)).default;
  let sent = null;
  const env = {
    ALLOWED_ORIGINS: 'https://batchmath.net,https://www.batchmath.net', REPORT_FROM: 'reports@batchmath.net',
    REPORT_TO: 'qa-only@example.invalid', REPORT_RATE_LIMITER: { async limit() { return { success: true }; } },
    REPORT_EMAIL: { async send(message) { sent = message; return { messageId: 'qa' }; } }
  };
  const diagnostic = { schema: 2, appVersion: '12.7', course: 'ap_calculus_ab', engineId: 'qa_engine', generatorVersion: '1', seed: '123', problemNumber: 2, problemId: 'qa-problem', problemMeta: {}, randomCalls: 4, settings: {}, path: '/qa/', submittedAnswer: { status: 'answer entered', fields: [{ value: '(2)/(3)' }] } };
  const request = body => new Request('https://batchmath.net/api/report-problem', { method: 'POST', headers: { Origin: 'https://batchmath.net', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let response = await worker.fetch(request({ schema: 1, description: 'Equivalent answer rejected.', diagnostic, clientToken: 'qa_client_token_12345', website: '' }), env);
  check(response.status === 200 && (await response.json()).ok, 'Worker accepts a valid same-origin report');
  check(sent?.to === env.REPORT_TO && sent?.from === 'reports@batchmath.net', 'Worker sends to the secret destination from the BatchMath domain sender');
  check(sent?.text.includes('Equivalent answer rejected.') && sent?.text.includes('(2)/(3)'), 'Worker email includes the description, diagnostic ticket, and entered answer');
  sent = null;
  response = await worker.fetch(request({ schema: 1, description: 'Bot text', diagnostic, clientToken: 'qa_client_token_12345', website: 'filled' }), env);
  check(response.status === 200 && sent === null, 'Worker honeypot suppresses automated mail');
  response = await worker.fetch(new Request('https://batchmath.net/api/report-problem', { method: 'POST', headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ schema: 1, description: 'Cross origin', diagnostic, clientToken: 'qa_client_token_12345', website: '' }) }), env);
  check(response.status === 403, 'Worker rejects disallowed origins');
  response = await worker.fetch(request({ schema: 1, description: 'Rate limited', diagnostic, clientToken: 'qa_client_token_12345', website: '' }), { ...env, REPORT_RATE_LIMITER: { async limit() { return { success: false }; } } });
  check(response.status === 429, 'Worker throttles excess reports');
}

function trigChecks() {
  const html = source('ap-calculus/unit-2-derivatives/topics/derivatives-of-trigonometric-functions/practice/index.html');
  const start = html.indexOf('(function(){\nconst $=id=>document.getElementById(id);');
  const end = html.indexOf('\n})();\n</script>', start) + '\n})();'.length;
  check(start >= 0 && end > start, 'Trig engine test harness located the live generator source');
  const page = fakePage('3144268345', { category: 'trig', ruleMode: 'without' });
  vm.runInContext(source('assets/answer-normalization.js'), page.context, { filename: 'answer-normalization.js' });
  vm.runInContext(html.slice(start, end), page.context, { filename: 'trig-practice-inline.js' });
  page.load();
  page.element('ruleMode').value = 'with';
  page.element('ruleMode')._fire('change');
  const qa = page.context.BatchMathTrigDerivativeQA;
  const problem = qa.cubeTrigProblem('tan', 5);
  check(problem.id === 'tcj-cube-tan-5', 'Exact reported trig family reconstructs tcj-cube-tan-5 with its original constants');
  const correct = [
    '2*x*sec(cbrt(x^2+5))^2/(3*(x^2+5)^(2/3))',
    '(2*x/3)*(x^2+5)^(-2/3)*sec(root(3,x^2+5))^2',
    'sec((x^2+5)^(1/3))^2*2*x/(3*(x^2+5)^(2/3))',
    '2*x*sec(root(3,x^2+5))^2/(3*cbrt((x^2+5)^2))'
  ];
  const wrong = [
    '2*x*sec(cbrt(x^2+5))^2/(3*(x^2+5)^(1/3))',
    '2*x*tan(cbrt(x^2+5))^2/(3*(x^2+5)^(2/3))',
    'sec(cbrt(x^2+5))^2/(3*(x^2+5)^(2/3))'
  ];
  check(correct.every(value => qa.equivalent(value, problem.answerExpr, problem.vars)), 'Trig validator accepts fractional powers, negative powers, cbrt, nth-root, reordered factors, and denominator equivalents');
  check(wrong.every(value => !qa.equivalent(value, problem.answerExpr, problem.vars)), 'Trig validator rejects nearby incorrect derivatives');
}

function atPointChecks() {
  const page = fakePage('1263461089', { 'practice-type': 'mixed' });
  vm.runInContext(source('assets/answer-normalization.js'), page.context, { filename: 'answer-normalization.js' });
  vm.runInContext(source('assets/derivative-expression-checker.js'), page.context, { filename: 'derivative-expression-checker.js' });
  vm.runInContext(source('assets/derivative-at-point-practice.js'), page.context, { filename: 'derivative-at-point-practice.js' });
  page.load();
  for (let number = 2; number <= 11; number++) page.element('next')._fire('click');
  const problem = page.context.__BM_CURRENT_PROBLEM;
  check(problem.id === 'linear-plus-log--4-3--5--1-3', 'Exact derivative-at-a-point report reconstructs problem 11');
  check(problem.math === 'y=-4x - \\ln(3x - 5),\\quad x=3', 'Reported at-point original function is mathematically and typographically intact');
  check(problem.answerExpr === '-19/4' && problem.answerTex === '-\\frac{19}{4}', 'Reported at-point answer retains division and a proper TeX fraction');
  check(problem.steps.some(step => step.includes('-\\frac{19}{4}')), 'Reported at-point walkthrough retains the final stacked-fraction form');
  const pageHtml = source('ap-calculus/unit-2-derivatives/topics/comprehensive-review/derivatives-at-a-point-practice/index.html');
  check(pageHtml.includes('mathjax@4.1.3/tex-chtml.js') && source('assets/derivative-at-point-practice.js').includes('\\\\(${current.answerTex}\\\\)'), 'Current at-point page sends the valid fraction TeX through the established MathJax renderer');
}

const reportSource = source('assets/reproducible-rng.js');
check(!/mailto:|Copy Report|copy it manually/i.test(reportSource), 'Legacy manual copy/email workflow is removed');
check(reportSource.includes("const REPORT_ENDPOINT = '/api/report-problem'"), 'Report modal uses the same-origin Cloudflare endpoint');
check(reportSource.includes('submittedAnswer: captureSubmittedAnswer()'), 'Diagnostic ticket includes the entered-answer capture');
check(reportSource.includes('Report sent. Thank you.') && reportSource.includes('Report could not be sent. Please try again.'), 'Report UI has honest success and failure states');
check(!source('cloudflare/report-problem-worker/wrangler.jsonc').includes('qa-only@example.invalid'), 'Worker configuration contains no receiving address');
check(fs.existsSync(path.join(ROOT, 'CLOUDFLARE-REPORT-PROBLEM-SETUP.md')), 'Exact Cloudflare setup guide is packaged');
check(fs.existsSync(path.join(ROOT, '.github/workflows/batchmath-qa.yml')), 'Existing GitHub Actions workflow is preserved');

await workerChecks();
trigChecks();
atPointChecks();

const report = { ok: true, checks: results.length, results };
fs.mkdirSync(path.join(ROOT, 'qa-results'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'qa-results/v127c-targeted-nobrowser-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`BatchMath 12.7.C targeted non-browser QA: PASS (${results.length} checks)`);
