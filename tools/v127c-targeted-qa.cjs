#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.BM_V127C_QA_PORT || 4197);
const BASE = `http://127.0.0.1:${PORT}`;
const results = [];
const check = (condition, message) => { assert(condition, message); results.push(message); };

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon'
};

function server() {
  return http.createServer((request, response) => {
    const url = new URL(request.url, BASE);
    let target = path.resolve(ROOT, decodeURIComponent(url.pathname).replace(/^\/+/, ''));
    if (!target.startsWith(ROOT)) return response.writeHead(403).end();
    if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return response.writeHead(404).end('Not found');
    response.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(target).pipe(response);
  });
}

async function workerChecks() {
  const worker = (await import(pathToFileURL(path.join(ROOT, 'cloudflare/report-problem-worker/src/index.js')).href)).default;
  let sent = null;
  const env = {
    ALLOWED_ORIGINS: 'https://batchmath.net,https://www.batchmath.net',
    REPORT_FROM: 'reports@batchmath.net',
    REPORT_TO: 'private-destination@example.invalid',
    REPORT_RATE_LIMITER: { async limit() { return { success: true }; } },
    REPORT_EMAIL: { async send(message) { sent = message; return { messageId: 'qa-message' }; } }
  };
  const diagnostic = {
    schema: 2, appVersion: '12.7', course: 'ap_calculus_ab', engineId: 'qa_engine', generatorVersion: '1',
    seed: '123', problemNumber: 2, problemId: 'qa-problem', problemMeta: {}, randomCalls: 4, settings: {},
    path: '/qa/', submittedAnswer: { status: 'answer entered', fields: [{ value: '(2)/(3)' }] }
  };
  const makeRequest = body => new Request('https://batchmath.net/api/report-problem', {
    method: 'POST', headers: { Origin: 'https://batchmath.net', 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  let response = await worker.fetch(makeRequest({ schema: 1, description: 'The equivalent answer was rejected.', diagnostic, clientToken: 'qa_client_token_12345', website: '' }), env);
  check(response.status === 200 && (await response.json()).ok === true, 'Worker accepts a valid same-origin report');
  check(sent?.to === env.REPORT_TO && sent?.from === 'reports@batchmath.net', 'Worker uses the secret destination and BatchMath sender');
  check(sent?.text.includes('The equivalent answer was rejected.') && sent?.text.includes('(2)/(3)'), 'Worker email retains the description, ticket, and entered answer');

  sent = null;
  response = await worker.fetch(makeRequest({ schema: 1, description: 'Bot text', diagnostic, clientToken: 'qa_client_token_12345', website: 'filled' }), env);
  check(response.status === 200 && sent === null, 'Worker honeypot quietly suppresses automated mail');

  response = await worker.fetch(new Request('https://batchmath.net/api/report-problem', {
    method: 'POST', headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ schema: 1, description: 'Cross-origin report', diagnostic, clientToken: 'qa_client_token_12345', website: '' })
  }), env);
  check(response.status === 403, 'Worker rejects a disallowed origin');

  response = await worker.fetch(makeRequest({ schema: 1, description: 'x', diagnostic, clientToken: 'qa_client_token_12345', website: '' }), env);
  check(response.status === 400, 'Worker rejects an invalid short description');

  response = await worker.fetch(makeRequest({ schema: 1, description: 'Rate limited report', diagnostic, clientToken: 'qa_client_token_12345', website: '' }), {
    ...env, REPORT_RATE_LIMITER: { async limit() { return { success: false }; } }
  });
  check(response.status === 429, 'Worker rate limiter blocks excess reports');
}

async function browserChecks(context) {
  const reportPage = await context.newPage();
  let reportMode = 'success';
  let submittedPayload = null;
  await reportPage.route('**/api/report-problem', async route => {
    submittedPayload = route.request().postDataJSON();
    await route.fulfill({ status: reportMode === 'success' ? 200 : 503, contentType: 'application/json', body: JSON.stringify({ ok: reportMode === 'success' }) });
  });
  await reportPage.goto(`${BASE}/ap-calculus/unit-2-derivatives/topics/derivatives-of-trigonometric-functions/practice/?bm_seed=1001&bm_qa=1`, { waitUntil: 'load' });
  await reportPage.waitForFunction(() => window.BatchMathRepro?.problemCount === 1);
  await reportPage.evaluate(() => window.BatchMathCalculusKeypad.setRaw('2*x/(3*(x^2+5)^(2/3))'));
  await reportPage.click('#bm-report-problem');
  check(await reportPage.locator('#bm-report-dialog').evaluate(dialog => dialog.open), 'Report modal opens from a generated problem');
  await reportPage.fill('#bm-report-description', 'My equivalent derivative was marked wrong.');
  await reportPage.click('.bm-report-send');
  await reportPage.waitForFunction(() => document.querySelector('.bm-report-status')?.textContent.includes('Report sent. Thank you.'));
  check(submittedPayload?.description === 'My equivalent derivative was marked wrong.', 'Report request contains the student description');
  check(submittedPayload?.diagnostic?.engineId === 'ap_topic_derivatives_of_trigonometric_functions', 'Report preserves the existing diagnostic engine ID');
  check(submittedPayload?.diagnostic?.submittedAnswer?.fields?.some(field => field.value === '2*x/(3*(x^2+5)^(2/3))'), 'Report captures the entered structured expression');
  check(!JSON.stringify(submittedPayload).includes('private-destination@example.invalid'), 'Client report payload exposes no private destination address');

  await reportPage.click('.bm-report-close');
  reportMode = 'failure';
  await reportPage.click('#bm-report-problem');
  await reportPage.fill('#bm-report-description', 'This request should fail safely.');
  await reportPage.click('.bm-report-send');
  await reportPage.waitForFunction(() => document.querySelector('.bm-report-status')?.textContent.includes('Report could not be sent. Please try again.'));
  check(await reportPage.locator('.bm-report-send').isEnabled(), 'A failed report remains retryable and never shows false success');
  await reportPage.setViewportSize({ width: 390, height: 700 });
  const modalRect = await reportPage.locator('#bm-report-dialog').evaluate(dialog => {
    const r = dialog.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: innerWidth, height: innerHeight };
  });
  check(modalRect.top >= 0 && modalRect.bottom <= modalRect.height && modalRect.left >= 0 && modalRect.right <= modalRect.width, 'Report modal fits a narrow Chromebook/mobile viewport');
  await reportPage.close();

  const trigPage = await context.newPage();
  await trigPage.goto(`${BASE}/ap-calculus/unit-2-derivatives/topics/derivatives-of-trigonometric-functions/practice/?bm_seed=3144268345&bm_qa=1`, { waitUntil: 'load' });
  await trigPage.waitForFunction(() => window.BatchMathRepro?.problemCount === 1 && window.BatchMathTrigDerivativeQA?.current);
  await trigPage.selectOption('#ruleMode', 'with');
  await trigPage.waitForFunction(() => window.BatchMathRepro?.problemCount === 2);
  const trigResult = await trigPage.evaluate(() => {
    const qa = window.BatchMathTrigDerivativeQA;
    const reported = qa.cubeTrigProblem('tan', 5);
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
    return {
      snapshot: window.BatchMathRepro.snapshot(),
      problem: { id: reported.id, answerExpr: reported.answerExpr, answerTex: reported.answerTex, q: reported.q },
      correct: correct.map(value => [value, qa.equivalent(value, reported.answerExpr, reported.vars)]),
      wrong: wrong.map(value => [value, qa.equivalent(value, reported.answerExpr, reported.vars)])
    };
  });
  check(trigResult.snapshot.problemNumber === 2 && trigResult.problem.id === 'tcj-cube-tan-5', 'Exact trig report family reconstructs tcj-cube-tan-5 while exercising problem 2 of the reported seed');
  check(trigResult.correct.every(([, accepted]) => accepted), 'Fractional-power, cbrt, root, reordered, and denominator-equivalent derivatives are accepted');
  check(trigResult.wrong.every(([, accepted]) => !accepted), 'Nearby incorrect trig derivatives remain rejected');
  check(await trigPage.evaluate(() => window.BatchMathTrigDerivativeQA.equivalent('(2*x/3)*(x^2+5)^(-2/3)*sec(root(3,x^2+5))^2', window.BatchMathTrigDerivativeQA.cubeTrigProblem('tan', 5).answerExpr, ['x'])), 'The live trig validator accepts a root-notation equivalent answer');
  await trigPage.close();

  const pointPage = await context.newPage({ viewport: { width: 1366, height: 768 } });
  await pointPage.goto(`${BASE}/ap-calculus/unit-2-derivatives/topics/comprehensive-review/derivatives-at-a-point-practice/?bm_seed=1263461089&bm_qa=1`, { waitUntil: 'load' });
  await pointPage.waitForFunction(() => window.BatchMathRepro?.problemCount === 1 && window.__BM_CURRENT_PROBLEM);
  for (let problem = 2; problem <= 11; problem++) await pointPage.evaluate(() => document.getElementById('next').click());
  await pointPage.waitForFunction(() => window.BatchMathRepro?.problemCount === 11 && window.__BM_CURRENT_PROBLEM?.id === 'linear-plus-log--4-3--5--1-3');
  const atPoint = await pointPage.evaluate(() => ({ snapshot: window.BatchMathRepro.snapshot(), problem: window.__BM_CURRENT_PROBLEM }));
  check(atPoint.problem.math.includes('\\ln(3x - 5)') && atPoint.problem.answerExpr === '-19/4', 'At-point report reconstructs the correct original function and stored quotient');
  check(atPoint.problem.answerTex === '-\\frac{19}{4}' && atPoint.problem.steps.some(step => step.includes('-\\frac{19}{4}')), 'At-point final answer and walkthrough retain a proper displayed fraction');
  await pointPage.evaluate(() => window.BatchMathCalculusKeypad.setRaw('0'));
  await pointPage.click('#submit');
  await pointPage.waitForFunction(() => document.querySelector('#feedback')?.textContent.includes('One correct answer'));
  try { await pointPage.waitForFunction(() => document.querySelectorAll('#feedback mjx-mfrac').length >= 2, null, { timeout: 12000 }); } catch (_) {}
  const rendered = await pointPage.evaluate(() => ({
    fractions: [...document.querySelectorAll('#feedback mjx-mfrac')].map(node => {
      const rect = node.getBoundingClientRect();
      return { width: rect.width, height: rect.height, line: !!node.querySelector('mjx-line') };
    }),
    overflow: document.querySelector('#feedback').scrollWidth > document.querySelector('#feedback').clientWidth + 1
  }));
  check(rendered.fractions.length >= 2 && rendered.fractions.every(item => item.width > 0 && item.height > 0 && item.line), 'At-point feedback renders visible MathJax fraction bars in current styling');
  check(!rendered.overflow, 'At-point fraction feedback does not clip or overflow its container');
  fs.mkdirSync(path.join(ROOT, 'qa-results'), { recursive: true });
  await pointPage.screenshot({ path: path.join(ROOT, 'qa-results/v127c-at-point-render.png'), fullPage: true });
  await pointPage.close();
}

(async () => {
  const reportSource = fs.readFileSync(path.join(ROOT, 'assets/reproducible-rng.js'), 'utf8');
  check(!/mailto:|Copy Report|copy it manually/i.test(reportSource), 'Legacy copy/email report workflow is absent');
  check(reportSource.includes("const REPORT_ENDPOINT = '/api/report-problem'"), 'Frontend uses the same-origin report endpoint');
  check(fs.existsSync(path.join(ROOT, '.github/workflows/batchmath-qa.yml')), 'GitHub Actions workflow is preserved');

  await workerChecks();

  const staticServer = server();
  await new Promise((resolve, reject) => { staticServer.once('error', reject); staticServer.listen(PORT, '127.0.0.1', resolve); });
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--disable-background-networking'] });
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.route('**/*', route => {
      const hostname = new URL(route.request().url()).hostname;
      if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === 'cdn.jsdelivr.net') route.continue();
      else route.abort();
    });
    await browserChecks(context);
    await context.close();
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => staticServer.close(resolve));
  }

  const report = { ok: true, checks: results.length, results };
  fs.mkdirSync(path.join(ROOT, 'qa-results'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'qa-results/v127c-targeted-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`BatchMath 12.7.C targeted QA: PASS (${results.length} checks)`);
})().catch(error => {
  console.error('BatchMath 12.7.C targeted QA: FAIL');
  console.error(error.stack || error);
  process.exit(1);
});
