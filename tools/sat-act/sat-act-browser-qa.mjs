#!/usr/bin/env node
// SAT & ACT Math Practice — browser QA (Playwright + Chromium, pinned local MathJax).
//
//   node tools/sat-act/sat-act-browser-qa.mjs [--real-youtube]
//
// Flows: filters and no-results state, mixed practice with no repeats, first-attempt scoring and
// retries, single-question topic sets, direct visits, written-solution reveal, video-unavailable
// state, YouTube player integration (mocked IFrame API: cueing, no autoplay, start time, ended,
// errors, blocked API), analytics events and duplicate prevention, keyboard, phone layout,
// MathJax rendering, navigation, and the future typed-answer format (QA-only synthetic record).
// --real-youtube additionally loads the real YouTube IFrame API with a published BatchMath video.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { localMathJax } from '../mathjax-browser-qa.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const CATALOG_SRC = fs.readFileSync(path.join(ROOT, 'assets/sat-act/catalog.js'), 'utf8');
const catalog = JSON.parse(CATALOG_SRC.slice(CATALOG_SRC.indexOf('{'), CATALOG_SRC.lastIndexOf('}') + 1));
const problems = catalog.problems;
const results = [];
const MOCK_ID = 'QAmockVid01';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml' };
function serve(root) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` })));
}

// Records every gtag('event', …) synchronously into sessionStorage so navigation cannot lose it.
const CAPTURE = `(() => {
  const dl = window.dataLayer = window.dataLayer || [];
  const push = Array.prototype.push;
  dl.push = function (args) {
    try {
      const a = Array.from(args);
      if (a[0] === 'event') {
        const list = JSON.parse(sessionStorage.getItem('qa.events') || '[]');
        list.push({ name: a[1], params: a[2], page: location.pathname });
        sessionStorage.setItem('qa.events', JSON.stringify(list));
      }
    } catch (_) {}
    return push.apply(this, arguments);
  };
})();`;

// Minimal stand-in for the YouTube IFrame API: records options, never plays by itself.
const MOCK_YT = `(() => {
  window.__yt = { created: [], plays: 0 };
  window.YT = { PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
    Player: function (id, opts) {
      const mount = document.getElementById(id);
      const frame = document.createElement('iframe');
      frame.src = 'about:blank';
      mount.replaceWith(frame);
      window.__yt.created.push(JSON.parse(JSON.stringify({ host: opts.host, videoId: opts.videoId, playerVars: opts.playerVars })));
      const self = this;
      this.getIframe = () => frame;
      this.playVideo = () => { window.__yt.plays++; };
      window.__yt.fire = state => opts.events.onStateChange({ data: state, target: self });
      window.__yt.error = code => opts.events.onError({ data: code, target: self });
      if (!window.__ytSilent) setTimeout(() => opts.events.onReady({ target: self }), 0);
    } };
  setTimeout(() => window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(), 0);
})();`;

async function newContext(browser, origin, { viewport = { width: 1280, height: 900 }, youtube = 'mock', catalogPatch = null, videoFor = null, videoId = MOCK_ID, withoutVideos = false } = {}) {
  const context = await browser.newContext({ viewport });
  await localMathJax(context);
  await context.route(/googletagmanager\.com|google-analytics\.com/, route => route.abort());
  await context.addInitScript(CAPTURE);
  if (youtube === 'mock') await context.route('https://www.youtube.com/iframe_api', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: MOCK_YT }));
  else if (youtube === 'blocked') await context.route('https://www.youtube.com/iframe_api', route => route.abort());
  if (catalogPatch) await context.route(`${origin}/assets/sat-act/catalog.js`, route => route.fulfill({ status: 200, contentType: 'text/javascript', body: catalogPatch(CATALOG_SRC) }));
  if (videoFor || withoutVideos) {
    await context.route(videoFor ? `${origin}${videoFor}` : `${origin}/sat-act-math/problems/*/`, async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/"youtubeId":(?:null|"[\w-]+")/, `"youtubeId":${videoFor ? JSON.stringify(videoId) : 'null'}`);
      if (videoFor) assert.ok(body.includes(videoId), 'test video injection failed');
      await route.fulfill({ response, body });
    });
  }
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) pageErrors.push(m.text()); });
  return { context, page, pageErrors };
}
const events = page => page.evaluate(() => JSON.parse(sessionStorage.getItem('qa.events') || '[]'));
const named = (list, name) => list.filter(e => e.name === name);
const session = page => page.evaluate(() => JSON.parse(sessionStorage.getItem('batchmath.satact.session.v1') || 'null'));
async function problemData(page) {
  return page.evaluate(() => JSON.parse(document.getElementById('satact-problem-data').textContent));
}
async function ready(page) {
  await page.waitForFunction(() => document.querySelector('[data-satact-page]') && (!document.getElementById('satact-problem-data') || window.BMSatAct));
  await page.waitForFunction(() => window.BMAnalytics);
}
async function answer(page, letter) {
  await page.locator(`label[data-choice="${letter}"]`).click();
  await page.locator('#satact-check').click();
  await page.waitForFunction(() => document.getElementById('satact-feedback').textContent.trim().length > 0);
}
const wrongLetter = data => ['A', 'B', 'C', 'D'].find(l => l !== data.answer);

async function scenario(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - started, error: error.stack || String(error) });
  }
}

const { server, origin } = await serve(ROOT);
const browserPath = process.env.BATCHMATH_CHROMIUM_PATH;
let browser;
try { browser = await chromium.launch(browserPath ? { executablePath: browserPath } : {}); } catch (e) {
  if (browserPath || !fs.existsSync('/opt/pw-browsers/chromium')) throw e;
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
}

await scenario('unified practice starts an individual topic with the selected difficulty', async () => {
  const { context, page, pageErrors } = await newContext(browser, origin);
  const problem = problems[0];
  const topic = catalog.subjects.find(s => s.slug === problem.subject);
  await page.goto(`${origin}/sat-act-math/`);
  await ready(page);
  assert.equal(await page.getByRole('heading', { name: 'Practice', exact: true }).count(), 1);
  assert.deepEqual(await page.locator('#practice select:visible').evaluateAll(els => els.map(el => el.labels[0].textContent)),
    ['Topic', 'Difficulty', 'Questions']);
  assert.match(await page.locator('#satact-practice-summary').innerText(), new RegExp(`${problems.length} questions available`));
  assert.equal(await page.locator('#satact-topic option:checked').innerText(), 'Mixed — All Topics');
  assert.equal(await page.locator('#satact-difficulty option:checked').innerText(), 'Any Difficulty');
  assert.deepEqual(await page.locator('#satact-size option').allInnerTexts(), ['All available']);

  await page.selectOption('#satact-topic', topic.slug);
  await page.selectOption('#satact-difficulty', problem.difficulty);
  assert.equal(await page.locator('#satact-skill').isVisible(), false, 'one eligible skill stays hidden');
  assert.equal(await page.locator('#satact-skill').isDisabled(), true);
  assert.match(await page.locator('#satact-practice-summary').innerText(), /1 question available/);
  await page.getByRole('button', { name: 'Start Practice', exact: true }).click();
  await page.waitForURL(`${origin}${problem.url}`);
  await ready(page);
  const s = await session(page);
  assert.equal(s.mode, 'topic');
  assert.equal(s.label, topic.label);
  assert.deepEqual(s.filters, { subject: topic.slug, skill: 'all', difficulty: problem.difficulty });
  assert.deepEqual(s.queue, [problem.id]);
  assert.equal(s.randomized, true);
  const started = named(await events(page), 'practice_started')[0].params;
  assert.equal(started.practice_mode, 'topic');
  assert.equal(started.subject_filter, topic.slug.replaceAll('-', '_'));
  assert.equal(started.difficulty_filter, problem.difficulty);
  assert.equal(started.skill_filter, 'all');
  assert.equal(started.session_size, 1);
  assert.deepEqual(pageErrors, []);
  await context.close();
});

await scenario('expanded catalog: conditional skills, eligible set sizes, resume and Practice Again', async () => {
  const fixture = structuredClone(catalog);
  const [source, other] = fixture.problems;
  const topic = fixture.subjects.find(s => s.slug === source.subject);
  const alternateSkill = { id: 'qa-second-skill', label: 'QA Second Skill', subject: topic.slug };
  const alternateDifficulty = 'qa-other-difficulty';
  other.difficulty = alternateDifficulty;
  topic.skills.push(alternateSkill.id);
  fixture.skills.push(alternateSkill);
  const extra = Array.from({ length: 12 }, (_, i) => ({
    ...source,
    id: `qa-extra-${i}`,
    number: 100 + i,
    url: `/sat-act-math/problems/qa-extra-${i}/`,
    ...(i === 11 ? { skill: alternateSkill.id, difficulty: alternateDifficulty } : {})
  }));
  fixture.problems.push(...extra);

  const { context, page } = await newContext(browser, origin, {
    catalogPatch: () => `window.BM_SAT_ACT_CATALOG = ${JSON.stringify(fixture)};`
  });
  const sourceHtml = fs.readFileSync(path.join(ROOT, source.url, 'index.html'), 'utf8');
  for (const problem of extra) {
    const body = sourceHtml.replace(`"id":"${source.id}"`, `"id":"${problem.id}"`);
    await context.route(`${origin}${problem.url}`, route => route.fulfill({ contentType: 'text/html', body }));
  }
  await page.goto(`${origin}/sat-act-math/`);
  await ready(page);
  assert.equal(await page.locator('#satact-skill').isVisible(), false, 'mixed mode hides skills');
  await page.selectOption('#satact-topic', topic.slug);
  assert.equal(await page.locator('#satact-skill').isVisible(), true);
  assert.deepEqual(await page.locator('#satact-skill option').evaluateAll(els => els.map(el => el.value)),
    ['all', source.skill, alternateSkill.id]);
  assert.equal(await page.locator('#satact-skill option:checked').innerText(), 'All Skills');
  assert.equal(await page.locator('#satact-topic option:checked').innerText(), `${topic.label} (13)`);

  await page.selectOption('#satact-skill', alternateSkill.id);
  assert.match(await page.locator('#satact-practice-summary').innerText(), /1 question available/);
  assert.deepEqual(await page.locator('#satact-size option').allInnerTexts(), ['All available']);
  await page.selectOption('#satact-topic', other.subject);
  assert.equal(await page.locator('#satact-skill').isVisible(), false, 'one eligible skill hides the control');
  assert.equal(await page.locator('#satact-skill').inputValue(), 'all', 'topic change clears the previous skill');
  await page.selectOption('#satact-difficulty', source.difficulty);
  assert.equal(await page.locator('#satact-skill').isVisible(), false, 'zero eligible skills hide the control');
  assert.equal(await page.locator('#satact-practice-start').isDisabled(), true);
  assert.match(await page.locator('#satact-practice-summary').innerText(), /No questions match/);
  assert.equal(await page.locator('#satact-topic').inputValue(), other.subject, 'an empty topic stays selected');
  await page.selectOption('#satact-topic', topic.slug);
  assert.equal(await page.locator('#satact-skill').isVisible(), false, 'difficulty limits eligible skills');
  await page.selectOption('#satact-difficulty', 'all');
  assert.equal(await page.locator('#satact-skill').isVisible(), true);
  assert.equal(await page.locator('#satact-skill').inputValue(), 'all');
  await page.selectOption('#satact-skill', source.skill);
  assert.deepEqual(await page.locator('#satact-size option').allInnerTexts(), ['10 questions', 'All available']);
  await page.selectOption('#satact-size', '10');
  assert.match(await page.locator('#satact-practice-summary').innerText(), /10 of 12 questions per session/);
  await page.setViewportSize({ width: 320, height: 800 });
  assert.equal(await page.locator('#satact-skill').isVisible(), true);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'the expanded form fits a narrow phone');
  await page.selectOption('#satact-skill', alternateSkill.id);
  assert.equal(await page.locator('#satact-size').inputValue(), 'all', 'oversized selection resets when the pool shrinks');
  await page.selectOption('#satact-skill', source.skill);
  await page.selectOption('#satact-size', '10');
  await page.getByRole('button', { name: 'Start Practice', exact: true }).click();
  await page.waitForURL(/\/problems\//);
  await ready(page);
  const firstSession = await session(page);
  assert.equal(firstSession.queue.length, 10);
  assert.equal(new Set(firstSession.queue).size, 10, 'session contains no repeat IDs');
  assert.ok(firstSession.queue.every(id => fixture.problems.find(p => p.id === id).skill === source.skill));
  assert.equal(firstSession.label, fixture.skills.find(s => s.id === source.skill).label);
  const started = named(await events(page), 'practice_started')[0].params;
  assert.equal(started.skill_filter, source.skill.replaceAll('-', '_'));
  assert.equal(started.session_size, 10);

  await answer(page, (await problemData(page)).answer);
  const question = page.url();
  await page.locator('#satact-session-bar').getByRole('link', { name: 'Practice Options' }).click();
  await page.waitForURL(`${origin}/sat-act-math/#practice`);
  assert.match(await page.locator('#satact-resume').innerText(), /1 correct out of 1 answered/);
  await page.getByRole('link', { name: 'Resume Session' }).click();
  await page.waitForURL(question);
  await ready(page);
  assert.equal((await session(page)).id, firstSession.id);
  assert.match(await page.locator('#satact-session-bar').innerText(), /1 correct out of 1 answered/);

  await page.getByRole('button', { name: 'End Session' }).click();
  assert.equal(await page.locator('#satact-summary').getByRole('link', { name: 'Practice Options' }).getAttribute('href'),
    '/sat-act-math/#practice');
  await page.locator('#satact-summary').getByRole('button', { name: 'Practice Again' }).click();
  await page.waitForFunction(() => JSON.parse(sessionStorage.getItem('qa.events') || '[]')
    .filter(event => event.name === 'practice_started').length === 2);
  await ready(page);
  const replay = await session(page);
  assert.notEqual(replay.id, firstSession.id);
  assert.deepEqual(replay.filters, firstSession.filters);
  assert.equal(replay.queue.length, 10);
  assert.equal(replay.randomized, true);
  assert.equal(named(await events(page), 'practice_started').length, 2);
  await context.close();
});

await scenario('mixed practice: no repeats, first-attempt scoring, retries, reveal, summary and events', async () => {
  const { context, page, pageErrors } = await newContext(browser, origin, { withoutVideos: true });
  await page.goto(`${origin}/sat-act-math/`);
  await ready(page);
  await page.getByRole('button', { name: 'Start Practice', exact: true }).click();
  await page.waitForURL(/\/sat-act-math\/problems\//);
  await ready(page);
  const initial = await session(page);
  assert.equal(initial.mode, 'mixed');
  assert.deepEqual(initial.filters, { subject: 'all', skill: 'all', difficulty: 'all' });
  assert.equal(initial.size, 'all');
  assert.equal(initial.randomized, true);
  const visited = [];
  for (let i = 0; i < problems.length; i++) {
    await ready(page);
    const data = await problemData(page);
    visited.push(data.id);
    const label = await page.locator('#satact-session-bar').innerText();
    assert.match(label, new RegExp(`Mixed practice · Question ${i + 1} of ${problems.length}`));
    if (i === 0) {
      await answer(page, data.answer);
      assert.match(await page.locator('#satact-feedback').innerText(), /Correct!/);
      assert.equal(await page.locator('#satact-show-solution').isVisible(), true, 'View Written Solution offered after a correct answer');
      assert.equal(await page.locator('#satact-watch').isVisible(), false, 'no video button without a published video');
      assert.equal(await page.locator('#satact-solution').evaluate(d => d.open), false, 'solution stays closed after a correct answer');
      await page.reload();
      await ready(page);
      assert.match(await page.locator('#satact-feedback').innerText(), /earlier in this session/);
      assert.equal(await page.locator(`label[data-choice="${data.answer}"] input`).isDisabled(), true);
    } else if (i === 1) {
      const wrong = wrongLetter(data);
      await answer(page, wrong);
      assert.match(await page.locator('#satact-feedback').innerText(), /Not quite/);
      assert.equal(await page.locator('#satact-solution').evaluate(d => d.open), true, 'no video: the written solution opens immediately');
      assert.equal(await page.locator('#satact-video').isVisible(), false, 'no video interface without a published video');
      assert.equal(await page.locator(`[data-your-answer="${wrong}"]`).isVisible(), true, 'the chosen wrong answer is explained');
      assert.equal(await page.locator(`label[data-choice="${wrong}"] input`).isDisabled(), true);
      await answer(page, data.answer);
      assert.match(await page.locator('#satact-feedback').innerText(), /attempt 2/);
    } else if (i === 2) {
      await answer(page, wrongLetter(data));
    } else if (i === 3) {
      await page.locator('#satact-solution > summary').click();
      await page.waitForFunction(() => /not scored/.test(document.getElementById('satact-feedback').textContent));
      assert.equal(await page.locator('#satact-check').isVisible(), false);
      assert.equal(await page.locator(`label[data-choice="${data.answer}"]`).getAttribute('class'), 'satact-choice is-correct is-locked');
    } else {
      await answer(page, data.answer);
      assert.equal((await page.locator('#satact-next').innerText()).trim(), 'Finish Session');
    }
    await page.locator('#satact-next').click();
    if (i < problems.length - 1) await page.waitForURL(u => !u.pathname.endsWith(new URL(page.url()).pathname) || true);
    if (i < problems.length - 1) await page.waitForFunction(id => { const el = document.getElementById('satact-problem-data'); return el && JSON.parse(el.textContent).id !== id; }, data.id);
  }
  assert.equal(new Set(visited).size, problems.length, 'mixed practice repeated a question');
  await page.locator('#satact-summary').waitFor({ state: 'visible' });
  const summary = await page.locator('#satact-summary').innerText();
  assert.match(summary, /Session Complete/);
  assert.match(summary, new RegExp(`2 correct out of 4 answered on the first try · ${problems.length} of ${problems.length} completed`));
  const ev = await events(page);
  const count = n => named(ev, n).length;
  assert.equal(count('practice_started'), 1);
  assert.equal(count('problem_generated'), problems.length, 'reload must not re-send problem_generated');
  assert.equal(count('answer_checked'), 4, 'one scored answer per answered question');
  assert.equal(count('answer_correct'), 2, 'answer_correct counts first-attempt correct answers only');
  assert.equal(count('answer_retry'), 1);
  assert.equal(count('problem_completed'), problems.length);
  assert.equal(count('solution_revealed'), 3);
  assert.equal(count('practice_completed'), 1);
  const done = named(ev, 'practice_completed')[0].params;
  assert.deepEqual([done.problems_answered, done.problems_correct, done.problems_completed, done.session_size, done.end_reason],
    [4, 2, problems.length, problems.length, 'finished']);
  for (const e of ev) {
    assert.equal(e.params.engine_id, 'sat_act_library');
    assert.equal(e.params.course, 'sat_act_math');
    for (const key of Object.keys(e.params)) assert.ok(!/answer$|^choice|selected|response|question_text/.test(key) || key === 'answer_result', `unexpected parameter ${key}`);
    for (const [key, value] of Object.entries(e.params)) {
      if (key === 'app_version') continue; // shared tracker parameter, e.g. 13.0.I
      assert.ok(typeof value === 'number' || typeof value === 'boolean' || /^[a-z0-9_]*$/.test(String(value)), `non-normalized value ${key}=${value}`);
    }
  }
  const checked = named(ev, 'answer_checked')[0].params;
  for (const key of ['problem_id', 'problem_number', 'subject', 'skill', 'exam_scope', 'difficulty', 'practice_mode', 'answer_result']) assert.ok(key in checked, `answer_checked missing ${key}`);
  assert.equal(checked.practice_mode, 'mixed');
  const s = await session(page);
  assert.equal(s.status, 'completed');
  assert.deepEqual(pageErrors, []);
  await context.close();
});

await scenario('each initial question scores the first answer and preserves it through retries', async () => {
  const keys = ['B', 'B', 'A', 'C', 'C'];
  for (const [i, correct] of keys.entries()) {
    const problem = problems.find(p => p.number === i + 1);
    for (const firstTryCorrect of [true, false]) {
      const { context, page } = await newContext(browser, origin, { withoutVideos: true });
      try {
        await page.goto(`${origin}${problem.url}`);
        await ready(page);
        const data = await problemData(page);
        assert.equal(data.answer, correct, `question ${i + 1} disagrees with the independent answer key`);
        const wrong = wrongLetter(data);
        await answer(page, firstTryCorrect ? correct : wrong);
        if (!firstTryCorrect) {
          assert.equal(await page.locator('#satact-solution').evaluate(d => d.open), true);
          assert.equal(await page.locator(`label[data-choice="${wrong}"] input`).isDisabled(), true);
          await answer(page, correct);
        }
        assert.match(await page.locator('#satact-feedback').innerText(), /Correct!/);
        const log = await events(page);
        assert.deepEqual(named(log, 'answer_checked').map(e => e.params.answer_result), [firstTryCorrect ? 'correct' : 'incorrect']);
        assert.equal(named(log, 'answer_correct').length, firstTryCorrect ? 1 : 0);
        assert.equal(named(log, 'answer_retry').length, firstTryCorrect ? 0 : 1);
        assert.equal(named(log, 'problem_completed').length, 1);
      } finally {
        await context.close();
      }
    }
  }
});

await scenario('topic practice with one question finishes gracefully', async () => {
  const { context, page, pageErrors } = await newContext(browser, origin);
  const skill = catalog.skills.find(k => problems.filter(p => p.skill === k.id).length === 1);
  await page.goto(`${origin}${catalog.subjects.find(s => s.slug === skill.subject).url}`);
  await ready(page);
  await page.locator(`#${skill.id} [data-start-practice]`).click();
  await page.waitForURL(/\/problems\//);
  await ready(page);
  assert.match(await page.locator('#satact-session-bar').innerText(), new RegExp(`${skill.label} · Question 1 of 1`));
  const data = await problemData(page);
  assert.equal(data.skill, skill.id);
  assert.equal((await page.locator('#satact-next').innerText()).trim(), 'Finish Session');
  await answer(page, data.answer);
  await page.locator('#satact-next').click();
  const text = await page.locator('#satact-summary').innerText();
  assert.match(text, new RegExp(`That's every question currently available for ${skill.label} \\(1 question\\)`));
  assert.equal(await page.locator('#satact-next').isVisible(), false);
  const ev = await events(page);
  assert.equal(named(ev, 'practice_started')[0].params.practice_mode, 'topic');
  assert.equal(named(ev, 'practice_started')[0].params.skill_filter, skill.id.replace(/-/g, '_'));
  assert.equal(named(ev, 'practice_completed').length, 1);
  await page.locator('#satact-summary').getByRole('button', { name: 'Practice Again' }).click();
  await page.waitForURL(/\/problems\//);
  await ready(page);
  assert.match(await page.locator('#satact-session-bar').innerText(), /Question 1 of 1/);
  assert.equal(named(await events(page), 'practice_started').length, 2, 'a new session starts a new practice_started');
  assert.deepEqual(pageErrors, []);
  await context.close();
});

await scenario('direct visit: lazy session start, then Next continues with other questions', async () => {
  const { context, page, pageErrors } = await newContext(browser, origin);
  const target = problems[2];
  await page.goto(`${origin}${target.url}`);
  await ready(page);
  assert.equal(await page.locator('#satact-session-bar').isVisible(), false);
  let ev = await events(page);
  assert.equal(named(ev, 'problem_generated').length, 1);
  assert.equal(named(ev, 'practice_started').length, 0, 'reading a page is not a practice session');
  const data = await problemData(page);
  await answer(page, wrongLetter(data));
  ev = await events(page);
  assert.equal(named(ev, 'practice_started').length, 1);
  assert.equal(named(ev, 'practice_started')[0].params.practice_mode, 'browse');
  assert.match(await page.locator('#satact-session-bar').innerText(), /0 correct out of 1 answered/);
  await page.locator('#satact-next').click();
  await page.waitForFunction(id => { const el = document.getElementById('satact-problem-data'); return el && JSON.parse(el.textContent).id !== id; }, data.id);
  await ready(page);
  const s = await session(page);
  assert.equal(s.mode, 'mixed');
  assert.equal(s.queue.length, problems.length);
  assert.equal(new Set(s.queue).size, problems.length);
  assert.equal(s.queue[0], target.id);
  assert.match(await page.locator('#satact-session-bar').innerText(), new RegExp(`Mixed practice · Question 2 of ${problems.length}`));
  assert.equal(named(await events(page), 'practice_started').length, 1, 'continuing does not restart the session');
  assert.deepEqual(pageErrors, []);
  await context.close();
});

const first = problems[0];
await scenario('video: incorrect answer cues the explanation without autoplay; ended opens the solution', async () => {
  const { context, page, pageErrors } = await newContext(browser, origin, { videoFor: first.url });
  await page.goto(`${origin}${first.url}`);
  await ready(page);
  const data = await problemData(page);
  assert.equal(data.video.youtubeId, MOCK_ID);
  await answer(page, wrongLetter(data));
  await page.locator('#satact-video').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.__yt && window.__yt.created.length === 1);
  const created = await page.evaluate(() => window.__yt.created[0]);
  assert.equal(created.videoId, MOCK_ID);
  assert.equal(created.host, 'https://www.youtube-nocookie.com');
  assert.equal(created.playerVars.start, data.video.explanationStartSeconds);
  assert.equal(created.playerVars.start, 19, 'explanation start from the audited render data');
  assert.equal(created.playerVars.autoplay, 0);
  assert.equal(created.playerVars.playsinline, 1);
  assert.equal(created.playerVars.rel, 0);
  assert.equal(await page.evaluate(() => window.__yt.plays), 0, 'the page must never start playback');
  assert.match(await page.locator('#satact-video .satact-video-note').innerText(), /0:19/);
  assert.equal(await page.locator('#satact-youtube-link').getAttribute('href'), `https://www.youtube.com/watch?v=${MOCK_ID}&t=19s`);
  assert.equal(await page.locator('#satact-video-solution').isVisible(), true, 'Show Written Solution is visible during the video');
  assert.equal(await page.locator('#satact-solution').evaluate(d => d.open), false, 'with a video, the solution waits for the student');
  assert.equal(await page.locator('iframe[title="Video explanation for question #001"]').count(), 1);
  const frame = await page.locator('.satact-video-frame').boundingBox();
  assert.ok(frame.width >= 240 && Math.abs(frame.width / frame.height - 9 / 16) < 0.02, `vertical 9:16 player, got ${frame.width}x${frame.height}`);
  const playerBox = await page.locator('.satact-video-frame iframe').boundingBox();
  assert.ok(playerBox && Math.abs(playerBox.width - frame.width) < 3 && Math.abs(playerBox.height - frame.height) < 3, 'the player fills its frame');
  assert.equal(named(await events(page), 'explanation_video_start').length, 0);
  await page.evaluate(() => { window.__yt.fire(YT.PlayerState.PLAYING); window.__yt.fire(YT.PlayerState.PAUSED); window.__yt.fire(YT.PlayerState.PLAYING); });
  await page.waitForTimeout(50);
  let ev = await events(page);
  assert.equal(named(ev, 'explanation_video_start').length, 1, 'start is sent once');
  assert.equal(named(ev, 'explanation_video_start')[0].params.start_seconds, 19);
  assert.equal(named(ev, 'problem_completed').length, 0, 'leaving early or mid-video is not a completion');
  await page.evaluate(() => window.__yt.fire(YT.PlayerState.ENDED));
  await page.waitForFunction(() => document.getElementById('satact-solution').open);
  ev = await events(page);
  assert.equal(named(ev, 'explanation_video_complete').length, 1);
  assert.equal(named(ev, 'solution_revealed')[0].params.reveal_trigger, 'video_ended');
  assert.equal(named(ev, 'problem_completed')[0].params.completion_method, 'video_ended');
  await page.evaluate(() => window.__yt.fire(YT.PlayerState.ENDED));
  await page.waitForTimeout(50);
  assert.equal(named(await events(page), 'explanation_video_complete').length, 1, 'complete is sent once');
  assert.deepEqual(pageErrors, []);
  await context.close();
});

await scenario('video: correct answer offers the video; Show Written Solution works immediately', async () => {
  const { context, page, pageErrors } = await newContext(browser, origin, { videoFor: first.url });
  await page.goto(`${origin}${first.url}`);
  await ready(page);
  const data = await problemData(page);
  await answer(page, data.answer);
  assert.equal(await page.locator('#satact-video').isVisible(), false, 'a correct answer does not open the video');
  assert.equal(await page.locator('#satact-watch').isVisible(), true);
  await page.locator('#satact-watch').click();
  await page.waitForFunction(() => window.__yt && window.__yt.created.length === 1);
  assert.equal(await page.evaluate(() => window.__yt.plays), 0);
  await page.locator('#satact-video-solution').click();
  await page.waitForFunction(() => document.getElementById('satact-solution').open);
  // The native <details> toggle event is asynchronous; wait for the GA4 event, not just the open property.
  await page.waitForFunction(() => JSON.parse(sessionStorage.getItem('qa.events') || '[]').some(e => e.name === 'solution_revealed'));
  const ev = await events(page);
  assert.equal(named(ev, 'solution_revealed')[0].params.reveal_trigger, 'video_panel_button');
  assert.equal(named(ev, 'problem_completed')[0].params.completion_method, 'correct_answer');
  assert.deepEqual(pageErrors, []);
  await context.close();
});

await scenario('video: player error and blocked API fall back to the written solution', async () => {
  for (const mode of ['error', 'blocked']) {
    const { context, page } = await newContext(browser, origin, { videoFor: first.url, youtube: mode === 'blocked' ? 'blocked' : 'mock' });
    await page.goto(`${origin}${first.url}`);
    await ready(page);
    const data = await problemData(page);
    await answer(page, wrongLetter(data));
    if (mode === 'error') {
      await page.waitForFunction(() => window.__yt && window.__yt.error);
      await page.evaluate(() => window.__yt.error(150));
    }
    await page.waitForFunction(() => document.getElementById('satact-solution').open);
    assert.match(await page.locator('#satact-video-status').innerText(), mode === 'error' ? /cannot be played here/ : /could not load/);
    assert.equal(await page.locator('#satact-youtube-link').isVisible(), true);
    const err = named(await events(page), 'explanation_video_error');
    assert.equal(err.length, 1);
    assert.equal(err[0].params.error_type, mode === 'error' ? 'player_error_150' : 'api_blocked');
    await context.close();
  }
});

await scenario('video: a silently blocked embed times out to the written solution', async () => {
  const { context, page } = await newContext(browser, origin, { videoFor: first.url });
  await context.addInitScript(() => { window.__ytSilent = true; });
  await page.goto(`${origin}${first.url}`);
  await ready(page);
  await answer(page, wrongLetter(await problemData(page)));
  await page.waitForFunction(() => window.__yt && window.__yt.created.length === 1);
  assert.equal(await page.locator('#satact-solution').evaluate(d => d.open), false);
  await page.waitForFunction(() => document.getElementById('satact-solution').open, null, { timeout: 20000 });
  assert.match(await page.locator('#satact-video-status').innerText(), /not loading here/);
  assert.equal(named(await events(page), 'explanation_video_error')[0].params.error_type, 'player_timeout');
  await context.close();
});

await scenario('keyboard: skip link, arrow keys between choices, Enter checks, visible focus', async () => {
  const { context, page } = await newContext(browser, origin);
  await page.goto(`${origin}${problems[1].url}`);
  await ready(page);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
  await page.waitForFunction(() => document.querySelector('.skip-link').getBoundingClientRect().top >= 0, null, { timeout: 2000 });
  await page.locator('label[data-choice="A"] input').focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(() => document.activeElement.value), 'B');
  assert.equal(await page.locator('label[data-choice="B"] input').isChecked(), true);
  const outline = await page.locator('label[data-choice="B"]').evaluate(e => getComputedStyle(e).outlineStyle);
  assert.equal(outline, 'solid', 'focused choice shows a focus ring');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.getElementById('satact-feedback').textContent.trim().length > 0);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'satact-feedback', 'focus moves to the result');
  await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(() => !!document.activeElement.closest('.satact-question-card, .satact-video, .satact-solution-section, main')));
  await context.close();
});

await scenario('phone layout: no horizontal scrolling, single-column choices, 44px targets', async () => {
  const { context, page } = await newContext(browser, origin, { viewport: { width: 390, height: 844 }, videoFor: first.url });
  const urls = ['/', '/sat-act-math/', '/sat-act-math/problems/', ...catalog.subjects.map(s => s.url), ...problems.map(p => p.url)];
  for (const url of urls) {
    await page.goto(`${origin}${url}`);
    await page.waitForLoadState('networkidle');
    if (url.includes('/problems/') && url !== '/sat-act-math/problems/') {
      await page.evaluate(() => MathJax.startup.promise);
      await page.evaluate(() => { document.querySelectorAll('details').forEach(d => { d.open = true; }); });
      await page.evaluate(() => MathJax.startup.promise);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `${url}: horizontal overflow ${overflow}px`);
    if (url === '/sat-act-math/') {
      const targets = await page.locator('#practice :is(select,button):visible').evaluateAll(els => els.map(el => {
        const { x, height } = el.getBoundingClientRect();
        return { x, height };
      }));
      assert.equal(targets.length, 4);
      assert.equal(new Set(targets.map(r => Math.round(r.x))).size, 1, 'controls and button stack on phones');
      assert.ok(targets.every(r => r.height >= 44));
    }
  }
  await context.close();
  // Opening every solution above marks those questions as viewed; answer in a fresh tab session.
  const fresh = await newContext(browser, origin, { viewport: { width: 390, height: 844 }, videoFor: first.url });
  const page2 = fresh.page;
  await page2.goto(`${origin}${first.url}`);
  await ready(page2);
  const boxes = await page2.locator('.satact-choice').evaluateAll(els => els.map(e => e.getBoundingClientRect()).map(r => ({ x: Math.round(r.x), w: Math.round(r.width), h: r.height })));
  assert.equal(new Set(boxes.map(b => b.x)).size, 1, 'choices stack in one column');
  for (const b of boxes) assert.ok(b.h >= 44);
  for (const h of await page2.locator('.satact-actions .satact-btn:visible').evaluateAll(els => els.map(e => e.getBoundingClientRect().height))) assert.ok(h >= 44);
  const data = await problemData(page2);
  await answer(page2, wrongLetter(data));
  await page2.waitForFunction(() => window.__yt && window.__yt.created.length === 1);
  const frame = await page2.locator('.satact-video-frame').boundingBox();
  assert.ok(frame.width >= 240 && frame.width <= 390 && frame.height <= 844 * 0.75, `phone player fits the screen, got ${frame.width}x${frame.height}`);
  assert.ok(Math.abs(frame.width / frame.height - 9 / 16) < 0.02);
  const home = await page2.goto(`${origin}/`);
  assert.equal(home.status(), 200);
  const spot = await page2.locator('a.satact-spotlight').boundingBox();
  assert.ok(spot.width <= 362 && spot.height >= 44, 'homepage button follows the archive button phone sizing');
  await fresh.context.close();
});

await scenario('MathJax renders every question, choice and solution without errors', async () => {
  const { context, page } = await newContext(browser, origin);
  for (const p of problems) {
    await page.goto(`${origin}${p.url}`);
    await ready(page);
    await page.evaluate(() => MathJax.startup.promise);
    await page.evaluate(() => { document.querySelectorAll('details').forEach(d => { d.open = true; }); });
    await page.evaluate(() => MathJax.startup.promise);
    const info = await page.evaluate(() => ({
      errors: document.querySelectorAll('mjx-merror').length,
      raw: /\\\(|\\\[/.test([...document.querySelectorAll('.satact-question-card, .satact-solution-body')].map(e => e.innerText).join(' ')),
      math: document.querySelectorAll('mjx-container').length,
      fractions: document.querySelectorAll('.satact-choices mjx-mfrac, .satact-solution-body mjx-mfrac').length
    }));
    assert.equal(info.errors, 0, `${p.displayNumber}: MathJax error`);
    assert.equal(info.raw, false, `${p.displayNumber}: unrendered TeX delimiters`);
    assert.ok(info.math > 10, `${p.displayNumber}: too little math rendered`);
    if (p.id === 'right-triangle-trig-s0031') {
      assert.ok(info.fractions >= 4, 'stacked fractions in choices and solution');
      assert.equal(await page.locator('svg.satact-fig-svg text').evaluateAll(t => t.map(x => x.textContent).sort().join('')), 'ABC');
    }
    if (p.id === 'radical-equation-s0003') assert.equal(await page.locator('mjx-container .hlbox').count() >= 2, true, '\\htmlClass highlights render');
  }
  await context.close();
});

await scenario('navigation: homepage button, breadcrumbs and links back to the site', async () => {
  const { context, page } = await newContext(browser, origin);
  await page.goto(`${origin}/`);
  assert.equal(await page.locator('a.satact-spotlight').count(), 1);
  assert.equal(await page.locator('a.archive-spotlight').count(), 1);
  await page.locator('a.satact-spotlight').click();
  await page.waitForURL(`${origin}/sat-act-math/`);
  assert.equal(await page.locator('h1').innerText(), 'SAT & ACT Math Practice');
  await page.getByRole('link', { name: 'Browse all questions' }).click();
  await page.waitForURL(`${origin}/sat-act-math/problems/`);
  await page.getByRole('link', { name: 'Practice Options' }).click();
  await page.waitForURL(`${origin}/sat-act-math/#practice`);
  assert.equal(await page.locator('#practice').isVisible(), true);
  for (const url of ['/sat-act-math/', '/sat-act-math/problems/', ...catalog.subjects.map(s => s.url), ...problems.map(p => p.url)]) {
    await page.goto(`${origin}${url}`);
    const anchors = await page.locator('a[href*="#"]').evaluateAll(links => links.map(link => link.href));
    for (const href of new Set(anchors)) {
      const link = new URL(href);
      if (link.origin !== origin || !link.hash || !link.pathname.startsWith('/sat-act-math/')) continue;
      const response = await page.request.get(link.href);
      assert.equal(response.status(), 200, href);
      assert.ok((await response.text()).includes(`id="${decodeURIComponent(link.hash.slice(1))}"`), `broken anchor ${href}`);
    }
  }
  await page.goto(`${origin}${problems[0].url}`);
  const crumbs = await page.locator('.bm-breadcrumbs a').evaluateAll(as => as.map(a => a.getAttribute('href')));
  assert.deepEqual(crumbs, ['/', '/sat-act-math/', '/sat-act-math/problems/']);
  for (const href of await page.locator('a[href^="/"]').evaluateAll(as => [...new Set(as.map(a => a.getAttribute('href')))])) {
    const res = await page.request.get(`${origin}${href.split('#')[0]}`);
    assert.equal(res.status(), 200, `broken link ${href}`);
  }
  await page.locator('a.logo').click();
  await page.waitForURL(`${origin}/`);
  await context.close();
});

await scenario('typed answers (future format): equivalent forms, first-attempt scoring — QA-only synthetic record', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-satact-typed-'));
  try {
    for (const rel of ['assets/site.css', 'assets/sat-act/sat-act.css', 'assets/sat-act/sat-act-practice.js', 'assets/batchmath-storage.js', 'assets/answer-normalization.js', 'assets/pwa.js', 'assets/problem-tracking.js']) {
      fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
      fs.copyFileSync(path.join(ROOT, rel), path.join(tmp, rel));
    }
    const recDir = path.join(tmp, 'records');
    fs.mkdirSync(recDir);
    const id = 'qa-typed-s0001';
    fs.writeFileSync(path.join(recDir, `${id}.json`), JSON.stringify({
      schema: 'batchmath.sat-act.problem/1', sourceId: id, contentStatus: 'development-fixture',
      approval: { text: null, video: null, releaseEligible: false, note: 'QA-only synthetic record; never published.' },
      provenance: { commit: '0'.repeat(40), verification: { passed: true, checks: 0, failed: 0 } },
      series: 'QA', topicLabel: 'QA', classification: { topic: 'Coordinate geometry', skills: ['circle-equations'], exams: ['SAT'], format: 'student_produced_response' },
      skillNames: { 'circle-equations': 'QA skill' }, difficulty: 'medium', format: 'student_produced_response', template: {}, concept: null,
      question: { stem: ['QA-only synthetic typed-answer item.'], prompt: 'Enter three fourths.' }, figure: null, rightAngle: null,
      choices: [], answer: { display: '$\\dfrac{3}{4}$', accepted: ['3/4'] },
      solution: { steps: [{ id: 's1', kind: 'simple', title: 'QA', caption: 'Synthetic.', lines: [{ tex: '\\dfrac{3}{4} = 0.75' }] }, { id: 's2', kind: 'simple', title: 'QA', caption: 'Synthetic.', lines: [] }], keyIdea: 'QA only.', trap: null, summary: '' },
      meta: {}, video: { explanationStartSeconds: null, youtubeId: null, published: false }
    }));
    const registry = path.join(tmp, 'registry.json');
    fs.writeFileSync(registry, JSON.stringify({ problems: [{ number: 999, sourceId: id, slug: '999-qa-typed-answer', title: 'QA Typed Answer', status: 'active' }] }));
    execFileSync(process.execPath, [path.join(HERE, 'build-sat-act-pages.mjs'), '--no-seo'], { env: Object.assign({}, process.env, { BM_ROOT: tmp, BM_SAT_ACT_RECORDS: recDir, BM_SAT_ACT_REGISTRY: registry }), stdio: 'pipe' });
    const local = await serve(tmp);
    try {
      for (const [attempts, expectFirst] of [[['0.7', '6/8'], 'incorrect'], [['.75'], 'correct']]) {
        const { context, page } = await newContext(browser, local.origin);
        await page.goto(`${local.origin}/sat-act-math/problems/999-qa-typed-answer/`);
        await ready(page);
        for (const value of attempts) {
          await page.fill('#satact-answer-input', value);
          await page.locator('#satact-check').click();
          await page.waitForFunction(() => document.getElementById('satact-feedback').textContent.trim().length > 0);
        }
        assert.match(await page.locator('#satact-feedback').innerText(), /Correct!/);
        assert.equal(await page.locator('#satact-answer-input').isDisabled(), true);
        const ev = await events(page);
        assert.equal(named(ev, 'answer_checked')[0].params.answer_result, expectFirst);
        assert.equal(named(ev, 'answer_correct').length, expectFirst === 'correct' ? 1 : 0);
        assert.ok(!JSON.stringify(ev).includes('6/8') && !JSON.stringify(ev).includes('0.7'), 'typed answers must not be sent');
        await context.close();
      }
    } finally {
      local.server.close();
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

if (process.argv.includes('--real-youtube')) {
  await scenario('real YouTube IFrame API smoke test (published BatchMath video, QA only)', async () => {
    const frq = fs.readFileSync(path.join(ROOT, 'ap-calculus/ap-test-preparation/free-response-questions/frq-data.js'), 'utf8');
    const realId = (frq.match(/youtu(?:\.be\/|be\.com\/watch\?v=)([A-Za-z0-9_-]{11})/) || [])[1];
    assert.ok(realId, 'no published BatchMath video found');
    const { context, page } = await newContext(browser, origin, { youtube: 'real', videoFor: first.url, videoId: realId });
    await page.goto(`${origin}${first.url}`);
    await ready(page);
    await answer(page, wrongLetter(await problemData(page)));
    await page.waitForSelector('.satact-video-frame iframe', { state: 'attached', timeout: 20000 });
    const box = await page.locator('.satact-video-frame iframe').boundingBox();
    assert.ok(box && box.width >= 240 && Math.abs(box.width / box.height - 9 / 16) < 0.02, `real player is laid out 9:16, got ${box && box.width}x${box && box.height}`);
    const src = await page.locator('.satact-video-frame iframe').getAttribute('src');
    assert.match(src, /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
    assert.match(src, /[?&]start=19\b/);
    assert.match(src, /[?&]enablejsapi=1\b/);
    assert.ok(!/[?&]autoplay=1\b/.test(src), 'no autoplay');
    await context.close();
  });
}

await browser.close();
server.close();
const lines = ['SAT & ACT Math Practice browser QA', `Result: ${results.every(r => r.ok) ? 'PASS' : 'FAIL'}`, '',
  ...results.map(r => `${r.ok ? 'PASS' : 'FAIL'}  ${r.name} (${r.ms} ms)${r.ok ? '' : '\n' + r.error.split('\n').slice(0, 6).join('\n')}`), ''];
fs.mkdirSync(path.join(ROOT, 'qa-results'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'qa-results', 'sat-act-browser-qa.txt'), lines.join('\n'));
console.log(lines.join('\n'));
if (!results.every(r => r.ok)) process.exit(1);
