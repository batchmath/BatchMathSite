(() => {
  'use strict';

  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSE-I_jrGGCCHBosWe8aeBBp7CrN8s-Oxqz4tMXLE6UZ-jfr14jRIme4dRQasM-eg/pub?gid=599000823&single=true&output=csv';
  const PAGE_SIZE = 12;
  const AUTO_REFRESH_MS = 5 * 60 * 1000;
  const REFRESH_WHEN_VISIBLE_AFTER_MS = 60 * 1000;

  const state = {
    entries: [],
    view: 'problems',
    query: '',
    visibleCount: PAGE_SIZE,
    loadedAt: null,
    loading: false,
    renderToken: 0,
    modalReturnFocus: null
  };

  const FIELD_ALIASES = {
    number: ['number', 'problemnumber', 'problemno', 'problemnum'],
    date: ['publisheddate', 'datepublished', 'publicationdate', 'date'],
    location: ['location', 'publishedlocation'],
    topic: ['topic', 'problemtopic'],
    problem: ['problemlatex', 'problem', 'problemexpression', 'problemstatement'],
    solution: ['solutionlatex', 'workedsolutionlatex', 'workedsolution', 'primarysolutionlatex', 'primarysolution'],
    explanation: ['explanation', 'workedexplanation', 'primaryexplanation'],
    video: ['videourl', 'videolink', 'socialmediavideo', 'sociallink'],
    solutionVideo: ['solutionvideourl', 'solutionvideo', 'videosolutionurl', 'workedsolutionvideourl'],
    solutionVideoOrientation: ['solutionvideoorientation'],
    primaryMethod: ['primarymethod', 'primarysolutionmethod', 'workedsolutionmethod'],
    alt1Method: ['alternativemethod1', 'alternative1method', 'alt1method'],
    alt1Solution: ['alternativesolution1', 'alternative1solution', 'alt1solution'],
    alt2Method: ['alternativemethod2', 'alternative2method', 'alt2method'],
    alt2Solution: ['alternativesolution2', 'alternative2solution', 'alt2solution']
  };

  const byId = id => document.getElementById(id);

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    const source = String(text || '').replace(/^\uFEFF/, '');
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        if (character === '"') {
          if (source[index + 1] === '"') {
            field += '"';
            index += 1;
          } else {
            quoted = false;
          }
        } else {
          field += character;
        }
      } else if (character === '"') {
        quoted = true;
      } else if (character === ',') {
        row.push(field);
        field = '';
      } else if (character === '\n') {
        row.push(field.replace(/\r$/, ''));
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += character;
      }
    }

    if (field.length || row.length) {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
    }

    return rows.filter(candidate => candidate.some(value => String(value).trim() !== ''));
  }

  function normalizedHeader(value) {
    return String(value || '').replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function headerLookup(headerRow) {
    const normalized = headerRow.map(normalizedHeader);
    const lookup = {};
    Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
      lookup[field] = normalized.findIndex(header => aliases.includes(header));
    });
    return lookup;
  }

  function cell(row, lookup, field) {
    const index = lookup[field];
    return index >= 0 ? String(row[index] ?? '').trim() : '';
  }

  function problemNumber(raw) {
    const match = String(raw || '').match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : NaN;
  }

  function parseDateValue(raw) {
    const value = String(raw || '').trim();
    if (!value) return NaN;
    let match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) return Date.UTC(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
    match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function formatDate(raw) {
    const timestamp = parseDateValue(raw);
    if (!Number.isFinite(timestamp)) return String(raw || '').trim();
    return new Intl.DateTimeFormat('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
    }).format(new Date(timestamp));
  }

  function cleanPrimaryMethod(explicitMethod, explanation, topic) {
    if (explicitMethod) return explicitMethod;
    const match = String(explanation || '').match(/^Primary(?:\s+Solution)?\s*[—–:\-]\s*([^:]+):/i);
    if (match) return match[1].trim();
    return String(topic || '').trim();
  }

  function normalizeRows(rows) {
    if (!Array.isArray(rows) || rows.length < 2) return [];
    const lookup = headerLookup(rows[0]);
    const required = ['number', 'problem'];
    if (required.some(field => lookup[field] < 0)) {
      throw new Error('The published sheet is missing a problem-number or problem-LaTeX column.');
    }

    const entries = [];
    const sourceRows = rows.slice(1);
    sourceRows.forEach((row, rowOffset) => {
      const number = problemNumber(cell(row, lookup, 'number'));
      const problem = cell(row, lookup, 'problem');
      if (!Number.isFinite(number) || !problem) return;

      const explanation = cell(row, lookup, 'explanation');
      const topic = cell(row, lookup, 'topic');
      entries.push({
        number,
        numberLabel: `#${String(number).padStart(3, '0')}`,
        date: cell(row, lookup, 'date'),
        dateValue: parseDateValue(cell(row, lookup, 'date')),
        location: cell(row, lookup, 'location'),
        topic,
        problem,
        solution: cell(row, lookup, 'solution'),
        explanation,
        video: safeUrl(cell(row, lookup, 'video')),
        solutionVideo: safeUrl(cell(row, lookup, 'solutionVideo')),
        solutionVideoOrientation: cell(row, lookup, 'solutionVideoOrientation'),
        primaryMethod: cleanPrimaryMethod(cell(row, lookup, 'primaryMethod'), explanation, topic),
        alternatives: [
          { index: 1, method: cell(row, lookup, 'alt1Method'), solution: cell(row, lookup, 'alt1Solution'), explanation: '' },
          { index: 2, method: cell(row, lookup, 'alt2Method'), solution: cell(row, lookup, 'alt2Solution'), explanation: '' }
        ],
        sourceRow: rowOffset + 2
      });
    });

    // Some sheets keep optional alternative explanations on otherwise blank rows.
    // Associate only clearly labelled notes with a prior entry that actually has
    // the corresponding alternative, so an orphan row can never attach to the
    // next Problem of the Day by accident.
    sourceRows.forEach(row => {
      if (cell(row, lookup, 'number') || cell(row, lookup, 'problem')) return;
      const note = cell(row, lookup, 'explanation');
      const match = note.match(/^Alternative\s*#?\s*([12])\s*[—–:\-]/i);
      if (!match) return;
      const alternativeIndex = Number(match[1]);
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const alternative = entries[index].alternatives[alternativeIndex - 1];
        if (alternative && alternative.method && alternative.solution && !alternative.explanation) {
          alternative.explanation = note;
          break;
        }
      }
    });

    return entries.sort((left, right) => {
      if (Number.isFinite(left.dateValue) && Number.isFinite(right.dateValue) && left.dateValue !== right.dateValue) {
        return right.dateValue - left.dateValue;
      }
      return right.number - left.number;
    });
  }

  function safeUrl(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    try {
      const url = new URL(value);
      return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function youtubeVideo(raw) {
    const safe = safeUrl(raw);
    if (!safe) return null;
    try {
      const url = new URL(safe);
      const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
      let id = '';
      let vertical = false;
      if (host === 'youtu.be') {
        id = url.pathname.split('/').filter(Boolean)[0] || '';
      } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
        else if (parts[0] === 'shorts') {
          id = parts[1] || '';
          vertical = true;
        } else if (parts[0] === 'embed' || parts[0] === 'live') {
          id = parts[1] || '';
        }
      }
      id = id.trim();
      if (!/^[A-Za-z0-9_-]{6,15}$/.test(id)) return null;
      return { id, vertical };
    } catch (_) {
      return null;
    }
  }

  function displayMath(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (/\\\[[\s\S]*\\\]|\\\([\s\S]*\\\)/.test(value)) return value;
    return `\\[${value}\\]`;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function problemPermalink(entry) {
    return `${location.origin}${location.pathname}?view=problems#problem-${String(entry.number).padStart(3, '0')}`;
  }

  function solutionPermalink(entry) {
    return `${location.origin}${location.pathname}?view=solutions#solution-${String(entry.number).padStart(3, '0')}`;
  }

  function cardHeader(entry) {
    const header = element('header', 'archive-card-header');
    const number = element('span', 'problem-number', entry.numberLabel);

    const metadata = element('div', 'problem-meta');
    if (entry.date) metadata.appendChild(element('span', 'problem-date', formatDate(entry.date)));
    if (entry.location) metadata.appendChild(element('span', 'problem-location', entry.location));
    if (entry.topic) metadata.appendChild(element('span', 'problem-topic', entry.topic));

    header.append(number, metadata);
    return header;
  }

  function mathBlock(latex, className = '') {
    const scroller = element('div', `potd-math-scroller${className ? ` ${className}` : ''}`);
    const math = element('div', 'potd-math', displayMath(latex));
    scroller.appendChild(math);
    return scroller;
  }

  function videoButton(label, url, orientation = '') {
    const video = youtubeVideo(url);
    if (!video) return null;
    const button = element('button', 'video-link', label);
    button.type = 'button';
    button.dataset.youtubeId = video.id;
    button.dataset.youtubeVertical = String(video.vertical || /^portrait$/i.test(String(orientation).trim()));
    button.addEventListener('click', () => openVideoModal(button, label));
    return button;
  }

  function openVideoModal(button, label) {
    const id = String(button?.dataset.youtubeId || '');
    if (!/^[A-Za-z0-9_-]{6,15}$/.test(id)) return;
    const modal = byId('archive-video-modal');
    const frameWrap = byId('archive-video-frame');
    if (!modal || !frameWrap) return;
    const dialog = modal.querySelector('.archive-video-dialog');
    state.modalReturnFocus = button;
    byId('archive-video-title').textContent = label;
    const isVertical = button.dataset.youtubeVertical === 'true';
    frameWrap.classList.toggle('is-vertical', isVertical);
    if (dialog) dialog.classList.toggle('is-vertical', isVertical);
    const iframe = document.createElement('iframe');
    iframe.title = label;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
    frameWrap.replaceChildren(iframe);
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('archive-modal-open');
    byId('archive-video-close').focus();
  }

  function closeVideoModal() {
    const modal = byId('archive-video-modal');
    if (!modal || modal.hidden) return;
    const frameWrap = byId('archive-video-frame');
    if (frameWrap) frameWrap.replaceChildren();
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('archive-modal-open');
    const returnFocus = state.modalReturnFocus;
    state.modalReturnFocus = null;
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
  }

  function problemCard(entry) {
    const id = `problem-${String(entry.number).padStart(3, '0')}`;
    const article = element('article', 'archive-card problem-card');
    article.id = id;
    article.dataset.problemNumber = String(entry.number);
    article.appendChild(cardHeader(entry));

    const body = element('div', 'archive-card-body');
    body.appendChild(mathBlock(entry.problem, 'problem-math'));
    const actions = element('div', 'problem-actions');
    if (entry.solution) {
      const solutionLink = element('a', 'problem-jump-link', 'View Worked Solution');
      solutionLink.href = solutionPermalink(entry);
      actions.appendChild(solutionLink);
    }
    const originalVideo = videoButton('Watch Original Short', entry.video);
    if (originalVideo) actions.appendChild(originalVideo);
    if (actions.childElementCount) body.appendChild(actions);
    article.appendChild(body);
    return article;
  }

  function solutionCard(entry) {
    const id = `solution-${String(entry.number).padStart(3, '0')}`;
    const article = element('article', 'archive-card solution-card');
    article.id = id;
    article.dataset.problemNumber = String(entry.number);
    article.appendChild(cardHeader(entry));

    const body = element('div', 'archive-card-body');
    body.appendChild(mathBlock(entry.problem, 'problem-math'));

    const primary = element('section', 'solution-primary');
    const heading = element('h2', 'solution-heading');
    heading.appendChild(element('span', 'method-label', 'Primary:'));
    heading.appendChild(document.createTextNode(` ${entry.primaryMethod || 'Worked Solution'}`));
    primary.appendChild(heading);
    primary.appendChild(mathBlock(entry.solution, 'solution-math'));
    if (entry.explanation) primary.appendChild(element('p', 'solution-explanation', entry.explanation));
    body.appendChild(primary);

    const alternatives = entry.alternatives.filter(alternative => alternative.method && alternative.solution);
    if (alternatives.length) {
      const list = element('div', 'alternative-list');
      alternatives.forEach(alternative => {
        const details = element('details', 'alternative');
        const summary = element('summary', '', `Alternative #${alternative.index}: ${alternative.method}`);
        const alternativeBody = element('div', 'alternative-body');
        alternativeBody.appendChild(mathBlock(alternative.solution, 'solution-math'));
        if (alternative.explanation) alternativeBody.appendChild(element('p', 'solution-explanation', alternative.explanation));
        details.append(summary, alternativeBody);
        details.addEventListener('toggle', () => {
          if (details.open) typeset(details);
        });
        list.appendChild(details);
      });
      body.appendChild(list);
    }

    const actions = element('div', 'problem-actions');
    const original = element('a', 'problem-jump-link', 'View Original Problem');
    original.href = problemPermalink(entry);
    actions.appendChild(original);
    const solutionVideo = videoButton('Watch Video Solution', entry.solutionVideo, entry.solutionVideoOrientation);
    if (solutionVideo) actions.appendChild(solutionVideo);
    body.appendChild(actions);
    article.appendChild(body);
    return article;
  }

  function filteredEntries() {
    const solutionOnly = state.view === 'solutions';
    const query = state.query.toLowerCase().trim();
    return state.entries.filter(entry => {
      if (solutionOnly && !entry.solution) return false;
      if (!query) return true;
      const haystack = [entry.number, entry.numberLabel, entry.date, entry.location, entry.topic].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  function updateTabs() {
    document.querySelectorAll('.archive-tab').forEach(tab => {
      const selected = tab.dataset.view === state.view;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
  }

  function updateUrl(replace = false) {
    const url = new URL(location.href);
    if (state.view === 'solutions') url.searchParams.set('view', 'solutions');
    else url.searchParams.delete('view');
    const method = replace ? 'replaceState' : 'pushState';
    history[method]({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function ensureHashTargetVisible(entries) {
    const match = location.hash.match(/^#(?:problem|solution)-(\d+)$/);
    if (!match) return;
    const targetNumber = Number.parseInt(match[1], 10);
    const index = entries.findIndex(entry => entry.number === targetNumber);
    if (index >= 0) state.visibleCount = Math.max(state.visibleCount, index + 1);
  }

  async function typeset(container) {
    if (!container || !window.MathJax || typeof window.MathJax.typesetPromise !== 'function') return;
    try {
      if (typeof window.MathJax.typesetClear === 'function') window.MathJax.typesetClear([container]);
      await window.MathJax.typesetPromise([container]);
    } catch (error) {
      console.warn('Archive math rendering was incomplete:', error);
    }
  }

  async function render() {
    const token = ++state.renderToken;
    const list = byId('archive-list');
    if (!list) return;
    const entries = filteredEntries();
    ensureHashTargetVisible(entries);
    const visible = entries.slice(0, state.visibleCount);

    if (window.MathJax && typeof window.MathJax.typesetClear === 'function') {
      try { window.MathJax.typesetClear([list]); } catch (_) {}
    }
    list.replaceChildren();
    updateTabs();

    if (!visible.length) {
      const empty = element('div', 'archive-empty');
      empty.appendChild(element('strong', '', state.view === 'solutions' ? 'No published solutions match.' : 'No problems match.'));
      empty.appendChild(document.createTextNode(state.query ? 'Try a different problem number, topic, or location.' : 'Check back after the next archive update.'));
      list.appendChild(empty);
    } else {
      const fragment = document.createDocumentFragment();
      visible.forEach(entry => fragment.appendChild(state.view === 'solutions' ? solutionCard(entry) : problemCard(entry)));
      list.appendChild(fragment);
    }

    list.setAttribute('aria-busy', 'false');
    const more = byId('show-older');
    more.hidden = visible.length >= entries.length;
    if (!more.hidden) more.textContent = state.view === 'solutions' ? 'Show Older Solutions' : 'Show Older Problems';
    await typeset(list);
    if (token !== state.renderToken) return;

    let target = null;
    if (location.hash) {
      try {
        const targetId = decodeURIComponent(location.hash.slice(1));
        if (/^(?:problem|solution)-\d+$/.test(targetId)) target = document.getElementById(targetId);
      } catch (_) {}
    }
    if (target) window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function setView(view, options = {}) {
    state.view = view === 'solutions' ? 'solutions' : 'problems';
    state.visibleCount = PAGE_SIZE;
    if (!options.keepHash) location.hash = '';
    updateUrl(Boolean(options.replace));
    render();
  }

  function currentTimeLabel(date) {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
  }

  function setLoading(isLoading) {
    state.loading = isLoading;
    const refresh = byId('refresh-archive');
    refresh.disabled = isLoading;
    refresh.classList.toggle('is-loading', isLoading);
    refresh.textContent = isLoading ? 'Refreshing…' : 'Refresh';
  }

  function showFailure(error, hadData) {
    const message = error && error.message ? error.message : 'The live spreadsheet did not respond.';
    if (hadData) {
      const status = byId('archive-status');
      status.className = 'archive-status is-warning';
      status.textContent = `Refresh failed. The visible archive was loaded at ${currentTimeLabel(state.loadedAt)} and may be out of date. Try again in a moment.`;
      return;
    }
    const status = byId('archive-status');
    status.className = 'archive-status';
    status.textContent = '';
    byId('archive-error').hidden = false;
    byId('archive-error-message').textContent = `${message} Check your connection, then try again.`;
    byId('archive-list').setAttribute('aria-busy', 'false');
  }

  async function fetchCsv(attempt = 1) {
    const separator = SHEET_URL.includes('?') ? '&' : '?';
    const url = `${SHEET_URL}${separator}_batchmath=${Date.now()}`;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal,
        headers: { Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.1' }
      });
      if (!response.ok) throw new Error(`The spreadsheet returned status ${response.status}.`);
      const text = await response.text();
      if (!text.trim()) throw new Error('The spreadsheet returned an empty response.');
      return text;
    } catch (error) {
      if (attempt < 2 && navigator.onLine !== false) {
        await new Promise(resolve => window.setTimeout(resolve, 700));
        return fetchCsv(attempt + 1);
      }
      if (error && error.name === 'AbortError') throw new Error('The live archive request timed out.');
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function loadArchive(options = {}) {
    if (state.loading) return;
    const hadData = state.entries.length > 0;
    setLoading(true);
    byId('archive-error').hidden = true;
    if (!hadData) {
      const status = byId('archive-status');
      status.className = 'archive-status';
      status.textContent = 'Loading the latest problems…';
      byId('archive-list').setAttribute('aria-busy', 'true');
    }

    try {
      const csv = await fetchCsv();
      const entries = normalizeRows(parseCsv(csv));
      if (!entries.length) throw new Error('No published problems were found in the spreadsheet.');
      state.entries = entries;
      state.loadedAt = new Date();
      state.visibleCount = options.keepCount ? state.visibleCount : PAGE_SIZE;

      byId('archive-error').hidden = true;
      const solutions = entries.filter(entry => entry.solution).length;
      const newest = entries[0];
      byId('archive-summary').textContent = `${entries.length} ${entries.length === 1 ? 'problem' : 'problems'} • ${solutions} worked ${solutions === 1 ? 'solution' : 'solutions'} • Newest: ${newest.numberLabel}`;
      const status = byId('archive-status');
      status.className = 'archive-status';
      status.textContent = `Live data refreshed at ${currentTimeLabel(state.loadedAt)}. Spreadsheet updates may take a few minutes to publish.`;
      await render();
    } catch (error) {
      showFailure(error, hadData);
    } finally {
      setLoading(false);
    }
  }

  function initialView() {
    const params = new URLSearchParams(location.search);
    if (params.get('view') === 'solutions' || location.hash.startsWith('#solution-')) return 'solutions';
    return 'problems';
  }

  function bindControls() {
    const menuButton = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.dropdown');
    if (menuButton && menu) {
      const close = () => {
        menu.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      };
      menuButton.addEventListener('click', event => {
        event.stopPropagation();
        const open = !menu.classList.contains('open');
        menu.classList.toggle('open', open);
        menuButton.setAttribute('aria-expanded', String(open));
      });
      menu.addEventListener('click', event => event.stopPropagation());
      document.addEventListener('click', close);
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          close();
          menuButton.focus();
        }
      });
    }

    document.querySelectorAll('.archive-tab').forEach(tab => {
      tab.addEventListener('click', () => setView(tab.dataset.view));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const nextView = state.view === 'problems' ? 'solutions' : 'problems';
        setView(nextView);
        document.querySelector(`.archive-tab[data-view="${nextView}"]`).focus();
      });
    });

    byId('archive-search').addEventListener('input', event => {
      state.query = event.target.value;
      state.visibleCount = PAGE_SIZE;
      render();
    });
    byId('show-older').addEventListener('click', () => {
      state.visibleCount += PAGE_SIZE;
      render();
    });
    byId('refresh-archive').addEventListener('click', () => loadArchive({ keepCount: true }));
    byId('retry-archive').addEventListener('click', () => loadArchive());
    byId('archive-video-close').addEventListener('click', closeVideoModal);
    byId('archive-video-modal').addEventListener('click', event => {
      if (event.target === byId('archive-video-modal')) closeVideoModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !byId('archive-video-modal').hidden) {
        event.preventDefault();
        closeVideoModal();
      }
    });
    window.addEventListener('popstate', () => {
      state.view = initialView();
      state.visibleCount = PAGE_SIZE;
      render();
    });
    window.addEventListener('hashchange', () => {
      const nextView = initialView();
      if (nextView !== state.view) state.view = nextView;
      render();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !state.loadedAt) return;
      if (Date.now() - state.loadedAt.getTime() >= REFRESH_WHEN_VISIBLE_AFTER_MS) loadArchive({ keepCount: true });
    });
    window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine !== false) loadArchive({ keepCount: true });
    }, AUTO_REFRESH_MS);
  }

  const publicApi = Object.freeze({
    sourceUrl: SHEET_URL,
    parseCsv,
    normalizeRows,
    safeUrl,
    youtubeVideo,
    formatDate,
    getEntries: () => state.entries.map(entry => ({ ...entry, alternatives: entry.alternatives.map(alternative => ({ ...alternative })) }))
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = publicApi;
  if (typeof window !== 'undefined') window.BatchMathArchive = publicApi;
  // The running document reuses only the approved data parser/source. It must
  // not initialize archive controls, pagination, or players on that page.
  if (typeof document === 'undefined' || document.currentScript?.hasAttribute('data-archive-data-only')) return;

  state.view = initialView();
  bindControls();
  updateTabs();
  loadArchive();
})();
