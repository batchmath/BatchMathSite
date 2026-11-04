import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const topicRoot = '/im1/unit-2-algebraic-operations-equations-inequalities/topics/';
const comparison = topicRoot + 'solving-linear-equations/';
const expected = {
  'solving-linear-equations': [
    ['rLTzuyGUl1I', 'Solving Linear Equations Using Addition and Subtraction'],
    ['fggYnVaqV-4', 'Solving Linear Equations Using Multiplication and Division'],
    ['iLAKVKLYowI', 'Solving Linear Equations with Fractional Coefficients'],
    ['wsPw-zD0BPs', 'Solving Two Step Linear Equations'],
    ['Ad43JwhtAFY', 'Solving Linear Equations when the Variable is Being Subtracted']
  ],
  'graphing-inequalities-interval-notation': [
    ['lTUmdsLb0cc', 'Graphing Linear Inequalities on a Number Line'],
    ['He4DtkI0EMw', 'Interval Notation']
  ],
  'coordinate-system-nine-key-features': [
    ['xalP_Y75UaM', 'Domain'], ['BrU_7ThMrpY', 'Range'],
    ['jwuWyvokBmY', 'Increasing, Decreasing, and Constant Intervals'],
    ['MJu2qdXJeGY', 'Finding x and y Intercepts from a Graph']
  ]
};

// A temporary static server makes this check independent of a running dev server.
const server = http.createServer((req, res) => {
  let target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!target.startsWith(root + path.sep) && target !== root) { res.writeHead(403).end(); return; }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  if (!fs.existsSync(target)) { res.writeHead(404).end(); return; }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.pdf': 'application/pdf' };
  res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const errors = [];
const counters = { previewPages: 0, playerSelections: 0, ordinaryPages: 0 };

try {
  browser = await chromium.launch({ headless: true, ...(process.env.BM_CHROMIUM_EXECUTABLE ? { executablePath: process.env.BM_CHROMIUM_EXECUTABLE } : {}) });
  const context = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' });
  // Deterministic UI checks do not claim to verify external YouTube playback.
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === base) return route.continue();
    if (url.hostname === 'i.ytimg.com') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><rect width="100%" height="100%" fill="#171717"/></svg>' });
    if (url.hostname === 'www.youtube.com') return route.fulfill({ contentType: 'text/html', body: '<title>Simulated YouTube player</title><button>Player control</button>' });
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const gallerySizes = new Map();
  const layout = () => page.evaluate(() => {
    const rect = el => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height, x: r.x, y: r.y }; };
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      grid: rect(document.querySelector('.video-grid')),
      cards: [...document.querySelectorAll('.video-item')].map(rect),
      thumbs: [...document.querySelectorAll('.video-embed')].map(rect),
      buttons: [...document.querySelectorAll('.video-play')].map(rect)
    };
  });
  async function checkPlayer(id, title) {
    assert.equal(await page.locator('iframe').count(), 1, 'only one active player');
    const frame = page.locator('.bm-video-player iframe');
    const url = new URL(await frame.getAttribute('src'));
    assert.equal(url.pathname, `/embed/${id}`);
    assert.deepEqual([...url.searchParams.keys()], ['rel', 'playsinline', 'autoplay']);
    assert.equal(await frame.getAttribute('title'), title);
    assert.equal(await page.locator('.bm-video-player-header h3').innerText(), title);
    const size = await page.locator('.bm-video-player-frame').boundingBox();
    assert.ok(Math.abs(size.width / size.height - 16 / 9) < 0.04, 'expanded player is 16:9');
    assert.ok(size.width > (await page.locator('.video-embed').first().boundingBox()).width, 'expanded player is larger than the thumbnail');
    const close = await page.getByRole('button', { name: 'Close video' }).boundingBox();
    assert.ok(close.x >= 0 && close.y >= 0 && close.x + close.width <= page.viewportSize().width && close.y + close.height <= page.viewportSize().height, 'close button fits viewport');
    assert.equal((await layout()).overflow, false);
    counters.playerSelections++;
  }
  for (const width of [375, 768, 1280]) {
    for (const mode of ['modal', 'inline']) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + comparison + '?videoPreview=' + mode);
      assert.equal(await page.locator('.video-play').count(), 5);
      assert.equal(await page.locator('iframe').count(), 0, 'no iframe before selection');
      assert.equal(await page.locator('.bm-video-mode-switcher').count(), 1);
      assert.deepEqual(await page.locator('[data-video-id]').evaluateAll(nodes => nodes.map(n => n.dataset.videoId)), expected['solving-linear-equations'].map(v => v[0]));
      assert.deepEqual(await page.locator('.video-title').allTextContents(), expected['solving-linear-equations'].map(v => v[1]));
      const initial = await layout();
      assert.equal(initial.overflow, false);
      const columns = initial.cards.filter(c => Math.abs(c.y - initial.cards[0].y) < 1).length;
      assert.equal(columns, width >= 980 ? 3 : width >= 600 ? 2 : 1);
      for (const thumb of initial.thumbs) assert.ok(Math.abs(thumb.w / thumb.h - 16 / 9) < 0.04);
      for (const button of initial.buttons) assert.ok(button.w >= 44 && button.h >= 44);
      const dimensions = { grid: [initial.grid.w, initial.grid.h], cards: initial.cards.map(c => [c.w, c.h]) };
      if (mode === 'modal') gallerySizes.set(width, dimensions);
      else assert.deepEqual(dimensions, gallerySizes.get(width), 'both modes use identical gallery dimensions');
      let previousFrame;
      for (const [index, [id, title]] of expected['solving-linear-equations'].entries()) {
        const button = page.locator('.video-play').nth(index);
        assert.equal(await button.getAttribute('aria-label'), 'Play ' + title);
        if (index === 0) { await button.focus(); await page.keyboard.press('Enter'); }
        else await button.click();
        await page.locator('.bm-video-player iframe').waitFor();
        if (previousFrame) { assert.equal(await previousFrame.evaluate(node => node.isConnected), false, 'old player removed when switching'); await previousFrame.dispose(); }
        await checkPlayer(id, title);
        if (mode === 'modal') {
          assert.equal(await page.locator('dialog').evaluate(d => d.open), true);
          assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
          const scrollY = await page.evaluate(() => window.scrollY);
          await page.mouse.move(2, 2);
          await page.mouse.wheel(0, 350);
          await page.waitForTimeout(80);
          assert.equal(await page.evaluate(() => window.scrollY), scrollY, 'background cannot scroll behind the dialog');
          if (index === 0) {
            // Native modal focus containment includes an embedded player's controls.
            await page.keyboard.press('Tab');
            assert.equal(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)), true);
            await page.getByRole('button', { name: 'Close video' }).focus();
            await page.keyboard.press('Escape');
          } else if (index === 1) await page.mouse.click(2, 2);
          else await page.getByRole('button', { name: 'Close video' }).click();
          await page.waitForFunction(() => !document.querySelector('dialog').open && !document.querySelector('iframe'));
          assert.equal(await button.evaluate(b => document.activeElement === b), true, 'focus returns to selected thumbnail');
          assert.equal(await page.evaluate(() => document.documentElement.style.overflow), '');
          assert.equal(await page.evaluate(() => document.body.style.overflow), '');
        } else {
          assert.equal(await page.locator('dialog').count(), 0);
          assert.equal(await page.locator('.video-play').count(), 5, 'gallery remains available');
          previousFrame = await page.locator('.bm-video-player iframe').elementHandle();
        }
      }
      if (mode === 'inline') {
        await page.getByRole('button', { name: 'Close video' }).click();
        assert.equal(await page.locator('iframe').count(), 0);
        assert.equal(await page.locator('.bm-video-inline').isHidden(), true);
        assert.equal(await page.locator('.video-play').last().evaluate(b => document.activeElement === b), true);
        assert.equal(await previousFrame.evaluate(node => node.isConnected), false);
        await previousFrame.dispose();
      }
      // Switching modes is ordinary static navigation and stops any active player.
      await page.locator('.video-play').first().click();
      const oldFrame = await page.locator('.bm-video-player iframe').elementHandle();
      if (mode === 'modal') await page.getByRole('button', { name: 'Close video' }).click();
      await page.locator('.bm-video-mode-switcher a').nth(mode === 'modal' ? 1 : 0).click();
      await page.waitForURL('**videoPreview=' + (mode === 'modal' ? 'inline' : 'modal'));
      assert.equal(await page.locator('iframe').count(), 0);
      await oldFrame.dispose();
      counters.previewPages++;
    }
  }
  // Check exact titles, ordinary behavior and ignored preview parameters elsewhere.
  for (const slug of ['solving-linear-equations', 'graphing-inequalities-interval-notation', 'coordinate-system-nine-key-features', 'equivalent-expressions-combining-like-terms', 'distributive-property']) {
    await page.goto(base + topicRoot + slug + '/' + (slug === 'solving-linear-equations' ? '' : '?videoPreview=modal'));
    assert.equal(await page.locator('.bm-video-mode-switcher').count(), 0);
    assert.equal(await page.locator('[data-video-preview-active]').count(), 0);
    if (slug === 'solving-linear-equations') {
      assert.ok(gallerySizes.get(1280).grid[1] < (await layout()).grid.h * 0.75, 'compact desktop gallery uses substantially less vertical space');
    }
    if (expected[slug]) {
      assert.deepEqual(await page.locator('.video-item').evaluateAll(cards => cards.map(card => [
        card.querySelector('[data-video-id]').dataset.videoId,
        card.querySelector('.video-title').textContent,
        card.querySelector('.video-play').getAttribute('aria-label')
      ])), expected[slug].map(([id, title]) => [id, title, 'Play ' + title]));
    }
    await page.locator('.video-play').first().click();
    assert.equal(await page.locator('.video-embed iframe').count(), 1, 'ordinary inline replacement unchanged');
    assert.equal(await page.locator('dialog').count(), 0);
    assert.equal(await page.locator('.video-cover').count(), await page.locator('.video-item').count() - 1);
    for (const link of await page.locator('[data-bm-resource="assignment"], [data-bm-resource="answer-key"], [data-bm-resource="practice"]').all()) {
      const url = new URL(await link.getAttribute('href'), page.url()).href;
      assert.equal((await context.request.get(url)).status(), 200);
    }
    counters.ordinaryPages++;
  }
  await page.goto(base + comparison + '?videoPreview=unknown');
  assert.equal(await page.locator('.bm-video-mode-switcher').count(), 0);
  assert.equal(await page.locator('[data-video-preview-active]').count(), 0);
  for (const viewport of [{ width: 375, height: 667 }, { width: 812, height: 375 }]) {
    await page.setViewportSize(viewport);
    await page.goto(base + comparison + '?videoPreview=modal');
    await page.locator('.video-play').last().click();
    await checkPlayer(...expected['solving-linear-equations'][4]);
    await page.getByRole('button', { name: 'Close video' }).click();
    await page.waitForFunction(() => !document.querySelector('iframe'));
  }
  assert.deepEqual(errors, [], 'no JavaScript errors');
  console.log('PASS: IM1 video titles/order, preview URLs, identical responsive galleries, both expanded players, keyboard, focus, close/stop/switch, scroll restoration, ordinary behavior and resource links.');
  console.log(JSON.stringify(counters));
  console.log('YouTube responses simulated for UI tests; these checks do not verify external playback.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
