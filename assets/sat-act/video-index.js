/* Published video associations for existing SAT & ACT questions. */
(() => {
  'use strict';

  const config = String(window.BM_SAT_ACT_VIDEO_FEED_URL || '').trim();
  const source = getFeedUrl(config);
  const knownIds = new Set((window.BM_SAT_ACT_CATALOG?.problems || []).map(problem => problem.id));
  const storage = window.BatchMathStorage;
  const cacheKey = 'sat-act-video-index';
  const freshFor = 5 * 60 * 1000;
  const retainFor = 24 * 60 * 60 * 1000;
  const retryAfter = 60 * 1000;
  const timeout = 4500;
  let memory;
  let inFlight;

  function getFeedUrl(value) {
    if (!value) return null;
    if (value === '/assets/sat-act/video-preview.csv' && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
      return new URL(value, location.origin);
    }
    let url;
    try { url = new URL(value); } catch (_) { return null; }
    const published = url.protocol === 'https:' && url.host === 'docs.google.com' &&
      !url.username && !url.password && !url.hash &&
      /^\/spreadsheets\/d\/(?:e\/)?[A-Za-z0-9_-]+\/pub\/?$/.test(url.pathname) &&
      url.searchParams.getAll('output').join() === 'csv';
    return published ? url : null;
  }

  // Match the archive CSV conventions for quoted cells, CRLF, and a leading BOM.
  function parseCsv(csv) {
    const text = csv.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    let closed = false;
    const finishCell = () => { row.push(cell.trim()); cell = ''; closed = false; };
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else if (char === '"') {
          quoted = false;
          closed = true;
        } else {
          cell += char;
        }
      } else if (char === '"') {
        if (closed || cell.trim()) throw new Error('Malformed CSV quotation');
        quoted = true;
        cell = '';
      } else if (char === ',') {
        finishCell();
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && text[i + 1] === '\n') i += 1;
        finishCell();
        rows.push(row);
        row = [];
      } else if (!closed) {
        cell += char;
      } else if (!/\s/.test(char)) {
        throw new Error('Malformed CSV quotation');
      }
    }
    if (quoted) throw new Error('Unterminated CSV quotation');
    finishCell();
    rows.push(row);
    return rows.filter(cells => cells.some(Boolean));
  }

  function youtubeId(value) {
    let url;
    try { url = new URL(value); } catch (_) { return ''; }
    if (url.protocol !== 'https:' || url.port || url.username || url.password) return '';
    let id;
    if (url.hostname === 'youtu.be') {
      id = url.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      id = url.pathname === '/watch'
        ? url.searchParams.getAll('v').join()
        : url.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
    }
    return typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
  }

  function readIndex(csv) {
    if (csv.length > 1024 * 1024) throw new Error('Video index is too large');
    const [header = [], ...rows] = parseCsv(csv);
    const names = header.map(cell => cell.toLowerCase());
    const columns = ['problemid', 'youtubeurl', 'explanationstartseconds', 'status'].map(name => {
      const column = names.indexOf(name);
      if (column < 0 || names.lastIndexOf(name) !== column) throw new Error('Invalid video index columns');
      return column;
    });

    const videos = new Map();
    const problemsSeen = new Set();
    for (const row of rows) {
      const [id, url, seconds, status] = columns.map(i => row[i] ?? '');
      if (!knownIds.has(id)) continue;
      // Ambiguous rows fail closed, including a Published row paired with a Pending one.
      if (problemsSeen.has(id)) {
        videos.delete(id);
        continue;
      }
      problemsSeen.add(id);
      if (status.toLowerCase() !== 'published' || !/^\d+$/.test(seconds)) continue;
      const start = Number(seconds);
      const video = youtubeId(url);
      if (start > 86400 || !video) continue;
      videos.set(id, { youtubeId: video, explanationStartSeconds: start });
    }
    const videoCounts = new Map();
    for (const { youtubeId: id } of videos.values()) videoCounts.set(id, (videoCounts.get(id) || 0) + 1);
    for (const [problem, { youtubeId: id }] of videos) {
      if (videoCounts.get(id) > 1) videos.delete(problem);
    }
    return videos;
  }

  function remember(entry) {
    memory = { ...entry, url: source.href, checkedAt: Date.now() };
    storage?.set(cacheKey, memory);
  }

  async function fetchIndex(cached, lastGood) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(source, {
        mode: 'cors', credentials: 'omit', cache: 'no-store', redirect: 'follow',
        signal: controller.signal, headers: { Accept: 'text/csv,text/plain;q=0.9' }
      });
      if (!response.ok) throw new Error('Video index unavailable');
      const csv = await response.text();
      const videos = readIndex(csv);
      remember({ csv, loadedAt: Date.now() });
      return videos;
    } catch (_) {
      remember(lastGood ? cached : {});
      return lastGood ?? new Map();
    } finally {
      clearTimeout(timer);
    }
  }

  function load() {
    if (!source) return Promise.resolve(new Map());
    if (inFlight) return inFlight;
    const entry = memory ?? storage?.get(cacheKey);
    const cached = entry?.url === source.href ? entry : null;
    const now = Date.now();
    const age = now - cached?.loadedAt;
    let lastGood;
    if (age >= 0 && age < retainFor && typeof cached.csv === 'string') {
      try { lastGood = readIndex(cached.csv); } catch (_) {}
      if (lastGood && age < freshFor) return Promise.resolve(lastGood);
    }
    const elapsed = now - cached?.checkedAt;
    if (elapsed >= 0 && elapsed < retryAfter) return Promise.resolve(lastGood ?? new Map());
    inFlight = fetchIndex(cached, lastGood).finally(() => { inFlight = null; });
    return inFlight;
  }

  window.BMSatActVideoIndex = Object.freeze({ configured: Boolean(config), valid: !config || Boolean(source), load });
})();
