#!/usr/bin/env node
import assert from 'node:assert/strict';
import {chromium, devices} from 'playwright';
import {localMathJax} from '../mathjax-browser-qa.mjs';

const base = process.env.BM_NAV_ORIGIN || 'http://127.0.0.1:4317';
const executablePath = process.env.BATCHMATH_CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? {executablePath} : {});
const chain = '/ap-calculus/unit-2-derivatives/topics/the-chain-rule/';
const area = '/ap-calculus/unit-6-applications-integration/topics/area-below-and-between-curves/';
const multiply = '/im1/unit-1-review/topics/multiplication/';
const unit4 = '/im1/unit-4-exponential-functions/topics/a-geometric-sequences/geometric-or-not/practice/';
const errors = [];
const screenshots = process.env.BM_NAV_SCREENSHOTS;
async function context(options = {}) {
  const ctx = await browser.newContext({serviceWorkers: 'block', ...options});
  await ctx.route('**/*', route => {
    const url = route.request().url();
    if (new URL(url).origin === base) return route.continue();
    return route.abort();
  });
  if (process.env.BM_NAV_MATHJAX) await localMathJax(ctx);
  ctx.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  return ctx;
}
async function go(page, route) {
  const response = await page.goto(base + route, {waitUntil: 'domcontentloaded'});
  assert.ok(response.ok(), route);
}
async function checkMenu(page, width, fixed) {
  const details = page.locator('.bm-topics');
  const toggle = details.locator('summary');
  const panel = page.locator('#bm-topics-panel');
  await toggle.waitFor();
  assert.equal(await details.evaluate(node => getComputedStyle(node).position), fixed ? 'fixed' : 'static', `${width}px menu position`);
  assert.equal(await panel.isVisible(), false);
  await toggle.focus();
  await page.keyboard.press('Space');
  await panel.waitFor();
  await page.waitForFunction(() => {
    const bounds = document.getElementById('bm-topics-panel').getBoundingClientRect();
    return bounds.height && bounds.top >= -1 && bounds.bottom <= innerHeight + 1;
  });
  const bounds = await panel.boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
  assert.ok(bounds.y >= -1 && bounds.y + bounds.height <= page.viewportSize().height + 1);
  assert.ok(await panel.locator('[aria-current]').count() >= 1);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await panel.waitFor({state: 'hidden'});
  assert.equal(await toggle.evaluate(el => document.activeElement === el), true);
  await page.keyboard.press('Enter');
  await panel.waitFor();
  await page.mouse.click(width - 3, 5);
  await panel.waitFor({state: 'hidden'});
  if (fixed) {
    const edge = await page.locator('main').evaluate(node => node.getBoundingClientRect().left);
    assert.ok(bounds.x + bounds.width <= edge, 'fixed topic menu should stay in the gutter');
    await page.evaluate(() => window.scrollTo({top: 900, behavior: 'instant'}));
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.bm-topics')).top === '12px');
    assert.ok((await page.locator('.topbar').boundingBox()).y < 0);
    await toggle.click();
    await panel.waitFor();
    await page.keyboard.press('Escape');
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
}

async function assertResourceEvent(page, clickTarget, details) {
  await page.evaluate(() => {
    window.dataLayer = window.dataLayer.filter(item => item[1] !== 'resource_click');
  });
  await clickTarget.evaluate(anchor => anchor.addEventListener('click', event => event.preventDefault(), {once: true}));
  await clickTarget.click();
  const events = await page.evaluate(() => window.dataLayer.filter(item => item[1] === 'resource_click').map(item => item[2]));
  assert.deepEqual(events, [details]);
}

try {
  const desktop = await context({viewport: {width: 1440, height: 900}});
  const page = await desktop.newPage();
  await go(page, chain);
  const launches = page.locator('#topic-practice a');
  assert.equal(await launches.count(), 3);
  assert.ok(await page.getByRole('heading', {name: 'Practice This Topic'}).isVisible());
  assert.equal(await page.locator('#topic-practice').evaluate(el =>
    !!(el.compareDocumentPosition(document.querySelector('.lecture-section')) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  const top = await page.locator('.bm-topics summary').boundingBox();
  const courses = page.locator('.topbar .menu-toggle');
  const right = await courses.boundingBox();
  assert.ok(Math.abs(top.y - right.y) <= 2);
  await courses.click();
  await page.locator('#course-menu.open').waitFor();
  assert.equal(await courses.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  await page.locator('#course-menu.open').waitFor({state: 'hidden'});
  assert.equal(await courses.getAttribute('aria-expanded'), 'false');
  if (screenshots) {
    await page.locator('.bm-topics summary').click();
    await page.screenshot({path: screenshots + '/desktop-topics.png'});
    await page.keyboard.press('Escape');
  }
  await checkMenu(page, 1440, true);
  const cdp = await desktop.newCDPSession(page);
  await cdp.send('Emulation.setPageScaleFactor', {pageScaleFactor: 1.5});
  await page.waitForFunction(() => visualViewport.scale > 1 && !document.querySelector('.bm-topics-fixed'));
  await cdp.send('Emulation.setPageScaleFactor', {pageScaleFactor: 1});
  await page.locator('.bm-topics-fixed').waitFor();
  await page.setViewportSize({width: 1280, height: 800});
  await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
  await checkMenu(page, 1280, true);
  await page.setViewportSize({width: 1024, height: 768});
  await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
  await checkMenu(page, 1024, false);
  await page.setViewportSize({width: 1440, height: 900});
  await page.locator('.bm-topics-fixed').waitFor();
  const apDetails = {course: 'ap_calculus_ab', unit: '2', topic: 'the-chain-rule'};
  await assertResourceEvent(page, launches.first(), {resource_type: 'practice', destination_category: 'practice_engine', ...apDetails});
  const assignment = page.locator('a[data-bm-resource="assignment"]').first();
  const pdf = await page.request.get(new URL(await assignment.getAttribute('href'), page.url()).href);
  assert.ok(pdf.ok());
  assert.match(pdf.headers()['content-type'], /application\/pdf/);
  await assertResourceEvent(page, assignment, {resource_type: 'assignment', destination_category: 'pdf', ...apDetails});
  await assertResourceEvent(page, page.locator('a[data-bm-resource="answer-key"]').first(),
    {resource_type: 'answer_key', destination_category: 'pdf', ...apDetails});

  await go(page, chain + 'practice/?bm_seed=1040000');
  await page.waitForFunction(() => window.BatchMathRepro?.problemCount === 1);
  assert.equal(await page.locator('.bm-related-practice a[data-bm-engagement="related-practice"]').count(), 2);
  assert.equal(await page.locator('.bm-related-practice a[data-bm-engagement="lesson"]').getAttribute('href'), chain);
  await assertResourceEvent(page, page.locator('.bm-related-practice a[data-bm-engagement="related-practice"]').first(),
    {resource_type: 'related_practice', destination_category: 'practice_engine', ...apDetails});
  await page.locator('#chain-mode').selectOption('multiple');
  await page.waitForFunction(() => window.BatchMathRepro?.problemCount > 1);
  await go(page, area + 'calculator-practice/?bm_seed=1040000');
  await page.waitForFunction(() => window.BatchMathRepro?.problemCount === 1);
  assert.match(await page.locator('.bm-related-practice a[data-bm-engagement="related-practice"]').getAttribute('href'), /non-calculator-practice/);
  await go(page, '/calculus-prep/domains/?bm_seed=1040000');
  await page.waitForFunction(() => window.BatchMathRepro?.problemCount === 1);
  assert.equal(await page.locator('#bm-topics-panel [aria-current="page"]').textContent(), 'Function Domains');
  assert.ok(await page.locator('.bm-related-practice a').count() > 0);

  const phone = await context({...devices['iPhone 13'], defaultBrowserType: undefined});
  const mobile = await phone.newPage();
  await go(mobile, multiply);
  await checkMenu(mobile, 390, false);
  await mobile.locator('.bm-topics summary').tap();
  await mobile.locator('#bm-topics-panel a[href*="adding-and-subtracting-negative"]').tap();
  await mobile.waitForURL('**/adding-and-subtracting-negative-numbers/');
  assert.equal(await mobile.locator('.bm-topics').getAttribute('open'), null);
  await go(mobile, multiply + 'practice/?bm_seed=1040000');
  await mobile.locator('#startBtn').tap();
  await mobile.waitForFunction(() => window.BatchMathRepro?.problemCount === 1);
  assert.equal(await mobile.locator('.bm-topics').evaluate(el => getComputedStyle(el).position), 'static');
  const mathField = mobile.locator('math-field.bm-mathlive-answer');
  await mathField.waitFor();
  await mathField.focus();
  await mobile.setViewportSize({width: 390, height: 510});
  assert.equal(await mobile.locator('.bm-topics').evaluate(el => getComputedStyle(el).position), 'static');
  assert.ok(await mathField.isVisible());
  await mobile.setViewportSize({width: 390, height: 844});
  const question = await mobile.locator('#question').innerText();
  const factors = question.match(/(\d+)\s*(?:\\times|[×x·])\s*(\d+)/);
  assert.ok(factors, question);
  const keypad = mobile.locator('[data-experimental-bridge="true"]');
  for (const digit of String(Number(factors[1]) * Number(factors[2]))) {
    await keypad.getByRole('button', {name: digit, exact: true}).tap();
  }
  await keypad.getByRole('button', {name: /check/i}).tap();
  assert.equal(await mobile.locator('#score').textContent(), '1');
  assert.equal(await mobile.locator('.bm-topics').getAttribute('open'), null);
  await go(mobile, unit4 + '?bm_seed=1040000');
  await mobile.waitForFunction(() => window.BatchMathRepro?.problemCount === 1);
  assert.ok(await mobile.locator('#question').innerText());
  assert.equal(await mobile.locator('.bm-related-practice a[href*="common-ratios"]').count(), 1);
  await mobile.locator('#resetBtn').tap();
  await mobile.waitForFunction(() => window.BatchMathRepro?.problemCount === 2);
  assert.equal(await mobile.locator('#score').textContent(), '0');
  await go(mobile, '/sat-act-math/');
  assert.equal(await mobile.locator('.bm-topics').count(), 0);
  await go(mobile, '/');
  if (screenshots) await mobile.screenshot({path: screenshots + '/phone-home.png', fullPage: true});
  assert.equal(await mobile.locator('main a[href="ap-calculus/ap-test-preparation/"]').count(), 1);
  assert.deepEqual(errors, []);
  console.log('Navigation browser QA passed at 1440, 1280, 1024 and 390 CSS pixels, including zoom and a reduced mobile viewport.');
} finally {
  await browser.close();
}
