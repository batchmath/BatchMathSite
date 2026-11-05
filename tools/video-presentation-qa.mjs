import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const courses = ['ap-calculus', 'im1', 'calculus-prep'];
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
const html = courses.flatMap(course => walk(path.join(root, course))).filter(p => p.endsWith('.html'));
// Unit 6 was deferred until its independent corrections were ready. In the Unit 6 / MathLive / video integration
// test branch its five topic pages adopt the approved content-source video markup, so every course page is in scope.
const relative = p => path.relative(root, p).replaceAll(path.sep, '/');
const hasVideo = p => /youtube\.com\/embed|data-video-id=/.test(fs.readFileSync(p, 'utf8'));
const deferredPages = [];
const inScopeHtml = html;
const pages = inScopeHtml.filter(hasVideo).map(relative);
const standardPages = pages.filter(p => fs.readFileSync(path.join(root, p), 'utf8').includes('data-bm-videos'));
const im1Root = '/im1/unit-2-algebraic-operations-equations-inequalities/topics/';
const approved = {
  'distributive-property': [['2FyZO5iTPYI', 'Distributive Property']],
  'equivalent-expressions-combining-like-terms': [['EgVS-qqYKVs', 'Combining Like Terms']],
  'solving-linear-equations': [
    ['rLTzuyGUl1I', 'Solving Linear Equations Using Addition and Subtraction'],
    ['fggYnVaqV-4', 'Solving Linear Equations Using Multiplication and Division'],
    ['iLAKVKLYowI', 'Solving Linear Equations with Fractional Coefficients'],
    ['wsPw-zD0BPs', 'Solving Two Step Linear Equations'],
    ['Ad43JwhtAFY', 'Solving Linear Equations when the Variable is Being Subtracted']
  ],
  'graphing-inequalities-interval-notation': [
    ['lTUmdsLb0cc', 'Graphing Linear Inequalities on a Number Line'], ['He4DtkI0EMw', 'Interval Notation']
  ],
  'coordinate-system-nine-key-features': [
    ['xalP_Y75UaM', 'Domain'], ['BrU_7ThMrpY', 'Range'],
    ['jwuWyvokBmY', 'Increasing, Decreasing, and Constant Intervals'], ['MJu2qdXJeGY', 'Finding x and y Intercepts from a Graph']
  ]
};
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
const errors = [];
const report = { htmlPagesAudited: inScopeHtml.length, deferredUnit6HtmlPages: html.length - inScopeHtml.length, deferredUnit6VideoPages: deferredPages, videoPages: pages.length, standardPages: standardPages.length, collections: {}, layoutCollections: {}, supportingCollections: 0, modalPages: [], pageLoads: 0, selections: 0, specializedChecks: 0, migratedProofChecks: 0 };
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.BM_CHROMIUM_EXECUTABLE ? { executablePath: process.env.BM_CHROMIUM_EXECUTABLE } : {}) });
  const context = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' });
  // Verify UI behavior deterministically, independently of YouTube availability.
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === base) return route.continue();
    if (url.hostname === 'i.ytimg.com') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><rect width="100%" height="100%" fill="#171717"/></svg>' });
    if (url.hostname.includes('youtube')) return route.fulfill({ contentType: 'text/html', body: '<title>Simulated player</title><button>Player control</button>' });
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
  async function checkFrame(frame, box) {
    const src = await box.getAttribute('data-video-src');
    const id = await box.getAttribute('data-video-id');
    const expected = new URL(src || `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`);
    expected.searchParams.set('autoplay', '1');
    assert.equal(await frame.getAttribute('src'), expected.href);
    assert.equal(await frame.getAttribute('title'), await box.getAttribute('data-player-title'));
    report.selections++;
  }
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const file of pages) {
      assert.equal((await page.goto(base + '/' + file.replace(/index.html$/, ''))).status(), 200);
      assert.equal(await page.locator('.bm-video-mode-switcher, .bm-video-inline').count(), 0);
      const grids = page.locator('[data-bm-videos]');
      if (!await grids.count()) { report.pageLoads++; continue; }
      const hasGallery = await grids.evaluateAll(nodes => nodes.some(g => g.dataset.videoRole === 'supporting' || g.children.length >= 3));
      assert.equal(await page.locator('dialog').count(), hasGallery ? 1 : 0, 'one shared modal per page');
      for (const grid of await grids.all()) {
        const cards = grid.locator(':scope > .video-item');
        const count = await cards.count();
        const supporting = await grid.getAttribute('data-video-role') === 'supporting';
        const layout = supporting || count >= 3 ? 'gallery' : count === 2 ? 'pair' : 'large';
        assert.equal(await grid.getAttribute('data-video-layout'), layout);
        assert.equal(await grid.locator('iframe').count(), 0, 'no initial player or autoplay');
        if (width === 375) {
          report.collections[count] = (report.collections[count] || 0) + 1;
          report.layoutCollections[layout] = (report.layoutCollections[layout] || 0) + 1;
          if (supporting) report.supportingCollections++;
          if (layout === 'gallery' && !report.modalPages.includes(file)) report.modalPages.push(file);
        }
        const dimensions = await cards.evaluateAll(nodes => nodes.map(node => {
          const card = node.getBoundingClientRect();
          const thumb = node.querySelector('.video-embed').getBoundingClientRect();
          const button = node.querySelector('button').getBoundingClientRect();
          const title = node.querySelector('.video-title');
          return { x: card.x, y: card.y, w: card.width, tw: thumb.width, th: thumb.height, bw: button.width, bh: button.height, titleClipped: title.scrollHeight > title.clientHeight + 1 };
        }));
        const columns = dimensions.filter(d => Math.abs(d.y - dimensions[0].y) < 1).length;
        assert.equal(columns, layout === 'gallery' ? Math.min(count, width >= 980 ? 3 : width >= 600 ? 2 : 1) : count === 2 && width > 760 ? 2 : 1, `${file}: columns for ${count} videos at ${width}`);
        for (const d of dimensions) {
          assert.ok(Math.abs(d.tw / d.th - 16 / 9) < .04);
          assert.ok(d.bw >= 44 && d.bh >= 44);
          assert.equal(d.titleClipped, false);
        }
        for (let index = 0; index < count; index++) {
          const card = cards.nth(index), box = card.locator('.video-embed'), button = card.getByRole('button');
          if (index === 0 && layout === 'gallery') { await button.focus(); await page.keyboard.press('Enter'); }
          else await button.click();
          if (layout === 'gallery') {
            const dialog = page.locator('dialog');
            assert.equal(await dialog.evaluate(d => d.open), true);
            assert.equal(await dialog.locator('iframe').count(), 1);
            await checkFrame(dialog.locator('iframe'), box);
            const panel = await dialog.boundingBox(), frame = await dialog.locator('.bm-video-player-frame').boundingBox();
            const close = page.getByRole('button', { name: 'Close video' });
            const closeRect = await close.boundingBox();
            assert.ok(panel.x >= 0 && panel.y >= 0 && panel.x + panel.width <= width + 1 && panel.y + panel.height <= 901);
            assert.ok(frame.y + frame.height <= 901 && closeRect.y >= 0 && closeRect.y + closeRect.height <= 900);
            assert.ok(Math.abs(frame.width / frame.height - 16 / 9) < .04);
            assert.ok(frame.width > (await box.boundingBox()).width);
            await dialog.locator('h2').click();
            assert.equal(await dialog.evaluate(d => d.open), true, 'clicking inside does not close the player');
            await dialog.locator('iframe').click();
            assert.equal(await dialog.evaluate(d => d.open), true, 'clicking the player does not close the dialog');
            assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
            if (index === 0) {
              const scrollY = await page.evaluate(() => window.scrollY);
              await page.mouse.move(2, 2); await page.mouse.wheel(0, 300); await page.waitForTimeout(80);
              assert.equal(await page.evaluate(() => window.scrollY), scrollY, 'background stays locked');
              await close.focus(); await page.keyboard.press('Tab');
              assert.equal(await dialog.evaluate(d => d.contains(document.activeElement)), true);
              await close.focus(); await page.keyboard.press('Escape');
            } else if (index === 1) await page.mouse.click(2, 2);
            else await close.click();
            await page.waitForFunction(() => !document.querySelector('dialog').open && !document.querySelector('dialog iframe'));
            assert.equal(await button.evaluate(b => document.activeElement === b), true);
            assert.equal(await page.evaluate(() => document.documentElement.style.overflow), '');
            assert.equal(await page.evaluate(() => document.body.style.overflow), '');
            assert.equal(await grid.locator('iframe').count(), 0);
          } else {
            await checkFrame(box.locator('iframe'), box);
            assert.equal(await box.locator('.video-cover').count(), 0);
            assert.equal(await page.locator('dialog[open]').count(), 0);
          }
        }
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, file + ': horizontal overflow');
      report.pageLoads++;
    }
    console.log(`Checked ${pages.length} video pages at ${width}px.`);
  }
  for (const [slug, entries] of Object.entries(approved)) {
    await page.goto(base + im1Root + slug + '/');
    assert.deepEqual(await page.locator('[data-bm-videos] .video-item').evaluateAll(cards => cards.map(c => [c.querySelector('[data-video-id]').dataset.videoId, c.querySelector('.video-title').textContent])), entries);
    for (const card of await page.locator('[data-bm-videos] .video-item').all()) {
      const box = card.locator('[data-video-id]'), id = await box.getAttribute('data-video-id');
      const title = await card.locator('.video-title').textContent();
      assert.equal(await box.getAttribute('data-player-title'), title);
      assert.equal(await card.getByRole('button').getAttribute('aria-label'), 'Play ' + title);
      assert.equal(await card.locator('img').getAttribute('src'), `https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
      assert.equal(await box.getAttribute('data-video-src'), null, 'new IM1 videos start at 0:00');
    }
  }
  const im1Ids = html.filter(p => p.includes(path.sep + 'im1' + path.sep)).flatMap(p => [...fs.readFileSync(p, 'utf8').matchAll(/data-video-id="([^"]+)"/g)].map(m => m[1]));
  assert.equal(im1Ids.length, 13); assert.equal(new Set(im1Ids).size, 13);
  for (const query of ['modal', 'inline']) {
    await page.goto(base + im1Root + 'solving-linear-equations/?videoPreview=' + query);
    assert.equal(await page.locator('[data-video-layout="gallery"]').count(), 1);
    assert.equal(await page.locator('.bm-video-mode-switcher, .bm-video-inline').count(), 0);
  }
  const specialized = [
    '/ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/',
    '/ap-calculus/unit-2-derivatives/topics/the-chain-rule/'
  ];
  for (const route of specialized) {
    await page.goto(base + route);
    const button = page.locator('.hw-video-button').first();
    await button.click(); assert.equal(await button.getAttribute('aria-expanded'), 'true');
    await button.click(); assert.equal(await button.getAttribute('aria-expanded'), 'false'); report.specializedChecks++;
  }
  for (const slug of ['derivatives-with-the-power-rule', 'the-chain-rule', 'the-product-rule', 'the-quotient-rule']) {
    await page.goto(base + '/ap-calculus/unit-2-derivatives/topics/' + slug + '/');
    assert.equal(await page.locator('[data-video-role="lecture"][data-video-layout="large"]').count(), 1);
    assert.equal(await page.locator('[data-video-role="supporting"][data-video-layout="gallery"]').count(), 1);
    assert.equal(await page.locator('dialog').count(), 1);
    const proof = page.locator('[data-video-kind="proof"]').first();
    assert.equal(await proof.locator('.bm-video-kind').textContent(), 'Proof');
    assert.ok((await proof.locator('.proof-note').textContent()).includes('Optional:'));
    await proof.locator('.video-play').click();
    assert.ok((await page.locator('dialog iframe').getAttribute('src')).includes('autoplay=1'));
    assert.equal(await proof.locator('iframe').count(), 0);
    await page.getByRole('button', { name: 'Close video' }).click();
    await page.waitForFunction(() => !document.querySelector('dialog').open && !document.querySelector('dialog iframe'));
    assert.equal(await page.locator('dialog iframe').count(), 0); report.migratedProofChecks++;
  }
  await page.goto(base + '/ap-calculus/unit-2-derivatives/topics/the-chain-rule/');
  assert.deepEqual(await page.locator('[data-video-role="lecture"] [data-video-id]').evaluateAll(xs => xs.map(x => x.dataset.videoId)), ['73RKQ9ybsDc']);
  assert.deepEqual(await page.locator('[data-video-role="supporting"] [data-video-id]').evaluateAll(xs => xs.map(x => x.dataset.videoId)), ['RhxU25eA1a8', 'uDWcP2R8UMo', 'JbPkKwquxm0']);
  assert.equal(await page.locator('.hw-video-button').count(), 6);
  // Unit 6 (integrated): lecture videos stay prominent; each Additional Example joins the supporting gallery.
  for (const [topic, lecture, supporting] of [['area-below-and-between-curves', ['96SD-qmkfbo'], ['sUXZa-abzPk']], ['volume-by-cross-sections', ['fhoEYkbq8Mo'], ['Pi8982b2TpA']]]) {
    await page.goto(base + '/ap-calculus/unit-6-applications-integration/topics/' + topic + '/');
    assert.deepEqual(await page.locator('[data-video-role="lecture"] [data-video-id]').evaluateAll(xs => xs.map(x => x.dataset.videoId)), lecture);
    assert.deepEqual(await page.locator('[data-video-role="supporting"] [data-video-id]').evaluateAll(xs => xs.map(x => x.dataset.videoId)), supporting);
    report.unit6Checks = (report.unit6Checks || 0) + 1;
  }
  await page.goto(base + '/ap-calculus/unit-6-applications-integration/topics/solids-of-revolution/');
  assert.deepEqual(await page.locator('[data-bm-videos] [data-video-id]').evaluateAll(xs => xs.map(x => x.dataset.videoId)), ['9QYUomuXLpw', 'Rxt7cIOK6mc', 'XvxqMcRx7-8']);
  await page.goto(base + '/ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/');
  const review = page.locator('.review-video-button').first();
  await review.click(); assert.equal(await review.getAttribute('aria-expanded'), 'true');
  await review.click(); assert.equal(await review.getAttribute('aria-expanded'), 'false'); report.specializedChecks++;
  // Future older recordings may carry intentional offsets: preserve them on activation.
  await page.goto(base + '/ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/');
  await page.locator('[data-video-id]').first().evaluate(box => { const u = new URL(box.dataset.videoSrc); u.searchParams.set('start', '42'); u.searchParams.set('end', '120'); box.dataset.videoSrc = u.href; });
  await page.locator('[data-bm-videos] .video-play').first().click();
  const timestamp = new URL(await page.locator('[data-bm-videos] iframe').getAttribute('src'));
  assert.equal(timestamp.searchParams.get('start'), '42'); assert.equal(timestamp.searchParams.get('end'), '120');
  // Narrow-height and orientation-change coverage for the largest approved IM1 title.
  for (const viewport of [{ width: 375, height: 667 }, { width: 812, height: 375 }]) {
    await page.setViewportSize(viewport); await page.goto(base + im1Root + 'solving-linear-equations/');
    await page.locator('.video-play').last().click();
    const dialog = page.locator('dialog'), screen = await dialog.locator('.bm-video-player-frame').boundingBox();
    assert.ok(screen.x >= 0 && screen.y >= 0 && screen.x + screen.width <= viewport.width + 1 && screen.y + screen.height <= viewport.height + 1);
    await page.setViewportSize({ width: viewport.height, height: viewport.width });
    await page.waitForFunction(() => { const r = document.querySelector('dialog').getBoundingClientRect(); return r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; });
    await page.getByRole('button', { name: 'Close video' }).click();
  }
  await page.goto(base + '/calculus-prep/');
  assert.equal(await page.locator('[data-bm-videos], dialog').count(), 0);
  assert.deepEqual(errors, []);
  fs.mkdirSync(path.join(root, 'qa-results'), { recursive: true });
  fs.writeFileSync(path.join(root, 'qa-results/video-presentation-qa.json'), JSON.stringify({ ok: true, ...report, externalPlaybackVerified: false, errors }, null, 2) + '\n');
  console.log('PASS: permanent video standard, every collection/card, approved titles/order, keyboard/focus, modal close/stop, responsive sizing, intentional offsets, and specialized controls.');
  console.log(JSON.stringify(report, null, 2));
  console.log('YouTube responses simulated for UI checks. External network playback is not verified.');
  console.log('Unit 6: integrated; its video pages are audited with every other page.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
