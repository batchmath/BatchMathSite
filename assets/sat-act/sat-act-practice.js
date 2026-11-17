/* BatchMath SAT & ACT Math Practice runtime — sat-act-p1
   Static, individually numbered questions; no generator, account or server.
   Sessions live in this tab's sessionStorage; a short local history uses BatchMathStorage.
   Analytics go through the shared /assets/problem-tracking.js (BMAnalytics) under engine
   sat_act_library. No answers, choice letters, question text or personal data are sent. */
(() => {
  'use strict';

  // ------------------------------------------------------------------ analytics bootstrap
  // The shared tracker reads window.BM_ANALYTICS_CONFIG when it loads, so set it first.
  window.BM_ANALYTICS_CONFIG = window.BM_ANALYTICS_CONFIG || { course: 'sat_act_math', engineId: 'sat_act_library', generatorVersion: '1' };
  const pendingAnalytics = [];
  let trackerFailed = false;
  function track(fn) {
    if (window.BMAnalytics) { try { fn(window.BMAnalytics); } catch (_) {} return; }
    if (!trackerFailed) pendingAnalytics.push(fn);
  }
  if (!window.BMAnalytics && !document.querySelector('script[data-satact-tracker]')) {
    const tag = document.createElement('script');
    tag.src = '/assets/problem-tracking.js';
    tag.dataset.satactTracker = '1';
    tag.onload = () => { pendingAnalytics.splice(0).forEach(fn => { try { fn(window.BMAnalytics); } catch (_) {} }); };
    tag.onerror = () => { trackerFailed = true; pendingAnalytics.length = 0; };
    document.head.appendChild(tag);
  }

  // ------------------------------------------------------------------ storage
  const SESSION_KEY = 'batchmath.satact.session.v1';
  const PLAYER_READY_TIMEOUT_MS = 15000;
  const memory = new Map();
  const tabStore = {
    get(key) {
      try { const raw = sessionStorage.getItem(key); if (raw != null) return JSON.parse(raw); } catch (_) {}
      return memory.has(key) ? memory.get(key) : null;
    },
    set(key, value) {
      memory.set(key, value);
      try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
    }
  };
  const localStore = () => window.BatchMathStorage || null;

  // ------------------------------------------------------------------ randomness (no generator: only shuffles order)
  function randomInt(n) {
    try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; } catch (_) {}
    randomInt.state = (randomInt.state || (Date.now() >>> 0) || 1);
    randomInt.state ^= randomInt.state << 13; randomInt.state ^= randomInt.state >>> 17; randomInt.state ^= randomInt.state << 5;
    return (randomInt.state >>> 0) % n;
  }
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = randomInt(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const newId = () => Array.from({ length: 4 }, () => randomInt(0x10000).toString(16).padStart(4, '0')).join('');

  // ------------------------------------------------------------------ catalog
  const CATALOG = window.BM_SAT_ACT_CATALOG || { problems: [], subjects: [], skills: [], section: '/sat-act-math/' };
  const SECTION = CATALOG.section || '/sat-act-math/';
  const byId = new Map(CATALOG.problems.map(p => [p.id, p]));
  const subjectLabel = slug => (CATALOG.subjects.find(s => s.slug === slug) || {}).label || slug;
  const skillLabel = id => (CATALOG.skills.find(s => s.id === id) || {}).label || id;
  const ALL = { difficulty: 'all', subject: 'all', skill: 'all' };
  const plural = (n, word = 'question') => `${n} ${word}${n === 1 ? '' : 's'}`;

  function filterProblems(f) {
    return CATALOG.problems.filter(p =>
      (f.difficulty === 'all' || !f.difficulty || p.difficulty === f.difficulty) &&
      (f.subject === 'all' || !f.subject || p.subject === f.subject) &&
      (f.skill === 'all' || !f.skill || p.skill === f.skill));
  }

  // Local "seen" history lets a new mixed set put unseen questions first.
  function seenMap() {
    const store = localStore();
    const value = store ? store.get('sat-act-seen', {}) : {};
    return value && typeof value === 'object' ? value : {};
  }
  function markSeen(id) {
    const store = localStore();
    if (store) store.update('sat-act-seen', current => Object.assign({}, current || {}, { [id]: new Date().toISOString().slice(0, 10) }), {});
  }

  // ------------------------------------------------------------------ sessions
  function loadSession() {
    const s = tabStore.get(SESSION_KEY);
    return s && s.v === 1 && Array.isArray(s.queue) ? s : null;
  }
  function saveSession(s) { tabStore.set(SESSION_KEY, s); }
  function blankResult() {
    return { presentedSent: false, firstResult: null, attempts: 0, tried: [], solved: false, completed: false,
      completion: null, revealedBeforeAnswer: false, solution: false, videoStart: false, videoComplete: false, videoError: false };
  }
  function result(s, id) {
    if (!s.results[id]) s.results[id] = blankResult();
    return s.results[id];
  }
  function createSession({ mode, filters, ids, label, entry, size }) {
    let queue;
    if (mode === 'mixed') {
      const seen = seenMap();
      queue = shuffle(ids.filter(id => !seen[id])).concat(shuffle(ids.filter(id => seen[id])));
    } else {
      queue = ids.slice().sort((a, b) => byId.get(a).number - byId.get(b).number);
    }
    if (size && size !== 'all') queue = queue.slice(0, Number(size));
    return { v: 1, id: newId(), mode, filters: Object.assign({}, ALL, filters || {}), label, entry: entry || 'landing',
      queue, index: 0, status: 'active', started: false, results: {}, completedSent: false, createdAt: Date.now() };
  }
  function sessionLabel(mode, f) {
    if (mode === 'mixed') return 'Mixed practice';
    if (f.skill && f.skill !== 'all') return skillLabel(f.skill);
    if (f.subject && f.subject !== 'all') return subjectLabel(f.subject);
    return 'Practice session';
  }
  const resolved = r => Boolean(r && (r.firstResult || r.revealedBeforeAnswer));
  function nextIndex(s) {
    for (let i = s.index + 1; i < s.queue.length; i++) if (!resolved(s.results[s.queue[i]])) return i;
    return -1;
  }
  function scores(s) {
    const rs = s.queue.map(id => s.results[id]).filter(Boolean);
    return {
      answered: rs.filter(r => r.firstResult).length,
      correct: rs.filter(r => r.firstResult === 'correct').length,
      completed: rs.filter(r => r.completed).length,
      presented: rs.filter(r => r.presentedSent).length,
      size: s.queue.length
    };
  }
  function scoreText(sc) {
    return `${sc.correct} correct out of ${sc.answered} answered · ${sc.completed} completed`;
  }
  function startedParams(s) {
    return { practice_mode: s.mode, difficulty_filter: s.filters.difficulty,
      subject_filter: s.filters.subject, skill_filter: s.filters.skill, session_size: s.queue.length, entry_page: s.entry };
  }
  function ensureStarted(s) {
    if (s.started) return;
    s.started = true;
    saveSession(s);
    track(a => a.practiceStarted(startedParams(s)));
  }
  function goToSessionStart(s) {
    saveSession(s);
    const first = byId.get(s.queue[0]);
    if (first) location.href = first.url;
  }
  function startFromControl(mode, filters, size, entry) {
    const ids = filterProblems(filters).map(p => p.id);
    if (!ids.length) return false;
    goToSessionStart(createSession({ mode, filters, ids, size, entry, label: sessionLabel(mode, filters) }));
    return true;
  }
  function recordHistory(s, sc, reason) {
    const store = localStore();
    if (!store) return;
    try {
      store.recordPracticeSession({ activityId: 'sat-act-math', course: 'sat_act_math', mode: s.mode, label: s.label,
        answered: sc.answered, correctFirstTry: sc.correct, completed: sc.completed, size: sc.size, endReason: reason });
      store.addRecentPractice({ id: 'sat-act-math', title: 'SAT & ACT Math Practice', url: SECTION, course: 'sat_act_math' });
    } catch (_) {}
  }

  // Start buttons on the library home and topic pages (each also works as a plain link without JS).
  function wireStartLinks(entry, currentFilters) {
    document.querySelectorAll('[data-start-practice]').forEach(link => {
      link.addEventListener('click', event => {
        const base = currentFilters ? currentFilters() : {};
        const filters = Object.assign({}, ALL, base, { subject: link.dataset.subject || 'all', skill: link.dataset.skill || 'all' });
        if (startFromControl(link.dataset.mode || 'topic', filters, 'all', entry)) event.preventDefault();
      });
    });
  }

  function renderResume(container) {
    const s = loadSession();
    if (!container || !s || s.status !== 'active' || !s.started) return;
    const current = byId.get(s.queue[s.index]);
    if (!current) return;
    const sc = scores(s);
    container.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = `Session in progress: ${s.label} · ${scoreText(sc)}.`;
    const actions = document.createElement('div');
    actions.className = 'satact-session-actions';
    const resume = document.createElement('a');
    resume.className = 'satact-btn satact-btn-primary';
    resume.href = current.url;
    resume.textContent = 'Resume Session';
    actions.append(resume);
    container.append(p, actions);
    container.hidden = false;
  }

  // ------------------------------------------------------------------ library home
  function initLanding() {
    const difficulty = document.getElementById('satact-difficulty');
    const mSubject = document.getElementById('satact-mixed-subject');
    const mSkill = document.getElementById('satact-mixed-skill');
    const mSize = document.getElementById('satact-mixed-size');
    const form = document.getElementById('satact-mixed-form');
    const globalFilters = () => ({ difficulty: difficulty ? difficulty.value : 'all' });

    function update() {
      const g = globalFilters();
      const pool = filterProblems(Object.assign({}, ALL, g));
      const summary = document.getElementById('satact-filter-summary');
      if (summary) summary.textContent = pool.length ? `${plural(pool.length)} match these filters.` : 'No questions match these filters yet.';
      let visibleSubjects = 0;
      document.querySelectorAll('.satact-subject-card').forEach(card => {
        const inSubject = pool.filter(p => p.subject === card.dataset.subject);
        card.hidden = !inSubject.length;
        if (inSubject.length) visibleSubjects++;
        const c = card.querySelector('[data-subject-count]');
        if (c) c.textContent = plural(inSubject.length);
        card.querySelectorAll('.satact-skill-row').forEach(row => {
          const inSkill = inSubject.filter(p => p.skill === row.dataset.skill);
          row.hidden = !inSkill.length;
          const rc = row.querySelector('[data-skill-count]');
          if (rc) rc.textContent = plural(inSkill.length);
          const link = row.querySelector('[data-start-practice]');
          if (link && inSkill.length) { link.href = inSkill[0].url; link.dataset.size = String(inSkill.length); }
        });
      });
      const topicEmpty = document.getElementById('satact-topic-empty');
      if (topicEmpty) topicEmpty.hidden = visibleSubjects > 0;

      if (mSubject && mSkill && mSize) {
        [...mSubject.options].forEach(o => {
          if (o.value === 'all') return;
          const n = pool.filter(p => p.subject === o.value).length;
          o.hidden = o.disabled = n === 0;
          o.textContent = `${subjectLabel(o.value)} (${n})`;
        });
        if (mSubject.selectedOptions[0] && mSubject.selectedOptions[0].disabled) mSubject.value = 'all';
        [...mSkill.options].forEach(o => {
          if (o.value === 'all') return;
          const n = pool.filter(p => p.skill === o.value).length;
          const other = mSubject.value !== 'all' && o.dataset.subject !== mSubject.value;
          o.hidden = o.disabled = other || n === 0;
          o.textContent = `${skillLabel(o.value)} (${n})`;
        });
        if (mSkill.selectedOptions[0] && mSkill.selectedOptions[0].disabled) mSkill.value = 'all';
        const mixedPool = filterProblems(Object.assign({}, g, { subject: mSubject.value, skill: mSkill.value }));
        const previous = mSize.value;
        mSize.innerHTML = '';
        for (const n of [10, 20, 50]) {
          if (n < mixedPool.length) mSize.add(new Option(`${n} questions`, String(n)));
        }
        mSize.add(new Option(`All available (${mixedPool.length})`, 'all'));
        mSize.value = [...mSize.options].some(o => o.value === previous) ? previous : 'all';
        const ms = document.getElementById('satact-mixed-summary');
        const size = mSize.value === 'all' ? mixedPool.length : Math.min(Number(mSize.value), mixedPool.length);
        if (ms) ms.textContent = mixedPool.length
          ? `${plural(mixedPool.length)} available · this set will have ${plural(size)} with no repeats.`
          : 'No questions match these filters yet.';
        const start = document.getElementById('satact-mixed-start');
        if (start) start.disabled = !mixedPool.length;
        const empty = document.getElementById('satact-mixed-empty');
        if (empty) empty.hidden = mixedPool.length > 0;
      }
    }
    [difficulty, mSubject, mSkill, mSize].forEach(el => el && el.addEventListener('change', update));
    document.querySelectorAll('[data-reset-filters]').forEach(b => b.addEventListener('click', () => {
      [difficulty, mSubject, mSkill].forEach(el => { if (el) el.value = 'all'; });
      update();
    }));
    if (form) form.addEventListener('submit', event => {
      event.preventDefault();
      const filters = Object.assign({}, ALL, globalFilters(), { subject: mSubject.value, skill: mSkill.value });
      startFromControl('mixed', filters, mSize.value, 'landing');
    });
    wireStartLinks('landing', globalFilters);
    renderResume(document.getElementById('satact-resume'));
    update();
  }

  // ------------------------------------------------------------------ question page
  function initProblem() {
    const dataEl = document.getElementById('satact-problem-data');
    if (!dataEl) return;
    const data = JSON.parse(dataEl.textContent);
    const meta = { id: data.id, problemType: data.skill, problemVariant: data.id };
    const $ = id => document.getElementById(id);
    const form = $('satact-answer-form');
    const feedback = $('satact-feedback');
    const checkBtn = $('satact-check');
    const watchBtn = $('satact-watch');
    const solutionBtn = $('satact-show-solution');
    const nextBtn = $('satact-next');
    const details = $('satact-solution');
    const videoSection = $('satact-video');
    const videoBody = $('satact-video-body');
    const bar = $('satact-session-bar');
    const summary = $('satact-summary');
    const choiceLabels = [...document.querySelectorAll('.satact-choice')];
    const typedInput = $('satact-answer-input');
    const video = data.video || {};
    const hasVideo = Boolean(video.youtubeId);
    let s, r;
    let pendingTrigger = '';
    let player = null;

    function attach() {
      s = loadSession();
      if (s && s.status === 'active') {
        if (!s.queue.includes(data.id)) { s.queue.splice(s.index + 1, 0, data.id); s.index += 1; }
        else s.index = s.queue.indexOf(data.id);
      } else {
        s = createSession({ mode: 'browse', filters: ALL, ids: [data.id], label: 'Practice session', entry: 'problem' });
      }
      r = result(s, data.id);
      saveSession(s);
    }
    const params = extra => Object.assign({
      problem_id: data.id, problem_number: data.displayNumber, subject: data.subject, skill: data.skill,
      exam_scope: data.exams.join('_'), difficulty: data.difficulty, question_format: data.format,
      practice_mode: s.mode, session_position: s.queue.indexOf(data.id) + 1
    }, extra || {});
    const firstAttempt = () => r.firstResult || 'not_answered';

    function complete(method) {
      if (r.completed) return;
      r.completed = true; r.completion = method;
      saveSession(s);
      track(a => a.trackEvent('problem_completed', meta, params({ completion_method: method, first_attempt_result: firstAttempt() })));
    }

    // ---------- rendering
    function setFeedback(kind, title, text) {
      feedback.innerHTML = '';
      const box = document.createElement('div');
      box.className = 'satact-feedback-box' + (kind ? ` is-${kind}` : '');
      const strong = document.createElement('strong');
      strong.className = 'satact-feedback-title';
      strong.textContent = title;
      box.append(strong);
      if (text) { const p = document.createElement('p'); p.textContent = text; box.append(p); }
      feedback.append(box);
    }
    function renderChoices() {
      const locked = r.solved || r.revealedBeforeAnswer;
      choiceLabels.forEach(label => {
        const letter = label.dataset.choice;
        const input = label.querySelector('input');
        const isAnswer = letter === data.answer;
        const tried = r.tried.includes(letter);
        label.classList.toggle('is-correct', isAnswer && (r.solved || r.revealedBeforeAnswer));
        label.classList.toggle('is-wrong', !isAnswer && tried);
        label.classList.toggle('is-locked', locked || (!isAnswer && tried));
        label.classList.toggle('is-dimmed', locked && !isAnswer && !tried);
        input.disabled = locked || (!isAnswer && tried);
        if (locked && isAnswer) input.checked = true;
        if (!locked && tried && input.checked) input.checked = false;
        const status = label.querySelector('.satact-choice-status');
        if (status) status.textContent = label.classList.contains('is-correct') ? 'Correct' : label.classList.contains('is-wrong') ? 'Not correct' : '';
        const sr = label.querySelector('.sr-only');
        if (sr) sr.textContent = `Choice ${letter}${label.classList.contains('is-correct') ? ' (correct answer)' : label.classList.contains('is-wrong') ? ' (not correct)' : ''}: `;
      });
      if (typedInput) typedInput.disabled = locked;
    }
    function nextLabel() { return s.mode !== 'browse' && nextIndex(s) < 0 ? 'Finish Session' : 'Next Problem'; }
    function renderActions() {
      const answeredOrDone = r.solved || r.revealedBeforeAnswer || Boolean(r.firstResult);
      checkBtn.hidden = r.solved || r.revealedBeforeAnswer;
      checkBtn.textContent = r.firstResult && !r.solved ? 'Check Again' : 'Check Answer';
      solutionBtn.hidden = !answeredOrDone || (details && details.open);
      watchBtn.hidden = !(hasVideo && r.solved) || !videoSection.hidden;
      nextBtn.textContent = nextLabel();
      nextBtn.classList.toggle('satact-btn-primary', r.solved || r.revealedBeforeAnswer);
    }
    function renderYourAnswer() {
      document.querySelectorAll('[data-your-answer]').forEach(el => {
        el.hidden = !(r.firstResult === 'incorrect' && el.dataset.yourAnswer === r.tried[0]);
      });
    }
    function renderBar() {
      if (!bar) return;
      const visible = s.mode !== 'browse' || s.started;
      bar.hidden = !visible;
      if (!visible) return;
      const sc = scores(s);
      bar.innerHTML = '';
      const label = document.createElement('span');
      label.className = 'satact-session-label';
      label.textContent = s.mode === 'browse' ? s.label : `${s.label} · Question ${s.index + 1} of ${s.queue.length}`;
      const score = document.createElement('span');
      score.className = 'satact-session-score';
      score.textContent = scoreText(sc);
      const actions = document.createElement('span');
      actions.className = 'satact-session-actions';
      const change = document.createElement('a');
      change.className = 'satact-btn';
      change.href = `${SECTION}#by-topic`;
      change.textContent = 'Change Topic';
      const end = document.createElement('button');
      end.type = 'button';
      end.className = 'satact-btn';
      end.textContent = 'End Session';
      end.addEventListener('click', () => finish('ended_early'));
      actions.append(change, end);
      bar.append(label, score, actions);
    }
    function renderAll() {
      renderChoices();
      renderYourAnswer();
      renderActions();
      renderBar();
    }

    // ---------- solution and video
    function openSolution(trigger) {
      if (!details) return;
      if (details.open) { handleSolutionOpened(trigger); return; }
      pendingTrigger = trigger;
      details.open = true;
    }
    function handleSolutionOpened(trigger) {
      if (!r.firstResult && !r.solved && !r.revealedBeforeAnswer) {
        r.revealedBeforeAnswer = true;
        setFeedback('', `The answer is ${data.answer}.`, 'You opened the solution before answering, so this question is not scored.');
      }
      ensureStarted(s);
      markSeen(data.id);
      if (!r.solution) {
        r.solution = true;
        saveSession(s);
        track(a => a.solutionRevealed(meta, params({ reveal_trigger: trigger, first_attempt_result: firstAttempt() })));
      }
      complete('written_solution');
      renderAll();
    }
    if (details) details.addEventListener('toggle', () => {
      if (!details.open) { renderActions(); return; }
      const trigger = pendingTrigger || 'summary_toggle';
      pendingTrigger = '';
      handleSolutionOpened(trigger);
    });

    function videoStatus(text, isError) {
      const el = document.getElementById('satact-video-status');
      if (!el) return;
      el.textContent = text;
      el.classList.toggle('is-error', Boolean(isError));
    }
    function videoFailed(errorType, message) {
      if (!r.videoError) {
        r.videoError = true;
        saveSession(s);
        track(a => a.trackEvent('explanation_video_error', meta, params({ error_type: errorType })));
      }
      videoStatus(message, true);
      openSolution('video_unavailable');
    }
    function loadYouTubeApi(timeoutMs) {
      if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
      if (!loadYouTubeApi.promise) {
        loadYouTubeApi.promise = new Promise((resolve, reject) => {
          const previous = window.onYouTubeIframeAPIReady;
          const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
          window.onYouTubeIframeAPIReady = () => {
            clearTimeout(timer);
            if (typeof previous === 'function') { try { previous(); } catch (_) {} }
            resolve(window.YT);
          };
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          tag.onerror = () => { clearTimeout(timer); reject(new Error('blocked')); };
          document.head.appendChild(tag);
        });
      }
      return loadYouTubeApi.promise;
    }
    function showVideo(trigger) {
      if (!hasVideo || !videoSection || !videoBody) return false;
      if (!videoSection.hidden) return true;
      videoSection.hidden = false;
      const start = Math.max(0, Math.floor(Number(video.explanationStartSeconds) || 0));
      const stamp = `${Math.floor(start / 60)}:${String(start % 60).padStart(2, '0')}`;
      const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(video.youtubeId)}${start ? `&t=${start}s` : ''}`;
      videoBody.innerHTML = '';
      const note = document.createElement('p');
      note.className = 'satact-video-note';
      note.textContent = start
        ? `The video is cued to the start of the explanation (${stamp}), after the question and pause. Press play when you're ready.`
        : "Press play when you're ready.";
      const layout = document.createElement('div');
      layout.className = 'satact-video-layout';
      const frame = document.createElement('div');
      frame.className = 'satact-video-frame';
      const mount = document.createElement('div');
      mount.id = 'satact-player';
      frame.append(mount);
      const side = document.createElement('div');
      side.className = 'satact-video-side';
      const solBtn = document.createElement('button');
      solBtn.type = 'button';
      solBtn.className = 'satact-btn satact-btn-primary';
      solBtn.id = 'satact-video-solution';
      solBtn.textContent = 'Show Written Solution';
      solBtn.addEventListener('click', () => { openSolution('video_panel_button'); details.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' }); });
      const yt = document.createElement('a');
      yt.className = 'satact-youtube-link';
      yt.id = 'satact-youtube-link';
      yt.href = watchUrl;
      yt.target = '_blank';
      yt.rel = 'noopener';
      yt.textContent = 'Watch on YouTube ↗';
      const status = document.createElement('p');
      status.className = 'satact-video-status';
      status.id = 'satact-video-status';
      status.setAttribute('role', 'status');
      side.append(solBtn, yt, status);
      layout.append(frame, side);
      videoBody.append(note, layout);
      renderActions();
      ensureStarted(s);
      loadYouTubeApi(12000).then(YT => {
        // A network that blocks YouTube embeds can leave the player silent (no ready, no error).
        let playerReady = false;
        const readyTimer = setTimeout(() => {
          if (!playerReady) videoFailed('player_timeout', 'The video is not loading here (YouTube may be blocked on this network). Use Watch on YouTube, or read the written solution below.');
        }, PLAYER_READY_TIMEOUT_MS);
        player = new YT.Player('satact-player', {
          host: 'https://www.youtube-nocookie.com',
          videoId: video.youtubeId,
          playerVars: { start, rel: 0, playsinline: 1, enablejsapi: 1, autoplay: 0, iv_load_policy: 3, origin: location.origin },
          events: {
            onReady: event => {
              playerReady = true;
              clearTimeout(readyTimer);
              try { event.target.getIframe().title = `Video explanation for question #${data.displayNumber}`; } catch (_) {}
            },
            onStateChange: event => {
              if (event.data === YT.PlayerState.PLAYING && !r.videoStart) {
                r.videoStart = true;
                saveSession(s);
                track(a => a.trackEvent('explanation_video_start', meta, params({ video_trigger: trigger, start_seconds: start })));
              }
              if (event.data === YT.PlayerState.ENDED) {
                if (!r.videoComplete) {
                  r.videoComplete = true;
                  saveSession(s);
                  track(a => a.trackEvent('explanation_video_complete', meta, params({ video_trigger: trigger })));
                }
                complete('video_ended');
                videoStatus('Video finished. The written solution is open below.');
                openSolution('video_ended');
              }
            },
            onError: event => videoFailed(`player_error_${event.data}`,
              'This video cannot be played here. Use Watch on YouTube, or read the written solution below.')
          }
        });
      }).catch(error => videoFailed(error && error.message === 'blocked' ? 'api_blocked' : 'api_timeout',
        'The video player could not load. Use Watch on YouTube, or read the written solution below.'));
      return true;
    }
    const reducedMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } };

    // ---------- answering
    function selectedAnswer() {
      if (typedInput) return typedInput.value;
      const checked = form.querySelector('input[name="satact-answer"]:checked');
      return checked ? checked.value : '';
    }
    function isCorrect(value) {
      if (typedInput) return typedMatches(value, data.accepted || []);
      return value === data.answer;
    }
    function onSubmit(event) {
      event.preventDefault();
      if (r.solved || r.revealedBeforeAnswer) return;
      const value = selectedAnswer();
      if (!String(value).trim()) {
        setFeedback('', typedInput ? 'Type an answer first.' : 'Choose an answer first.', '');
        return;
      }
      const correct = isCorrect(value);
      ensureStarted(s);
      r.attempts += 1;
      if (!typedInput && !r.tried.includes(value)) r.tried.push(value);
      if (!r.firstResult) {
        r.firstResult = correct ? 'correct' : 'incorrect';
        saveSession(s);
        // The scored attempt: answer_checked, plus answer_correct when right (shared contract).
        track(a => a.answerChecked(meta, correct, params({ attempt_number: 1 })));
      } else {
        saveSession(s);
        track(a => a.trackEvent('answer_retry', meta, params({ answer_result: correct ? 'correct' : 'incorrect', attempt_number: r.attempts })));
      }
      markSeen(data.id);
      if (correct) {
        r.solved = true;
        saveSession(s);
        complete('correct_answer');
        const firstTry = r.firstResult === 'correct';
        setFeedback('good', `Correct! The answer is ${data.answer}.`, firstTry
          ? (hasVideo ? 'Watch the video explanation or read the written solution, or go on to the next problem.' : 'Read the written solution, or go on to the next problem.')
          : `You found it on attempt ${r.attempts}. Your score counts your first answer.`);
      } else {
        const letter = typedInput ? '' : `${value} is not correct. `;
        if (hasVideo) {
          setFeedback('bad', 'Not quite.', `${letter}The video explanation is ready below, or open the written solution. You can also try another answer.`);
        } else {
          setFeedback('bad', 'Not quite.', `${letter}The written solution is open below. You can also try another answer.`);
        }
      }
      renderAll();
      if (!correct && r.attempts === 1) {
        if (!showVideo('after_incorrect')) openSolution('incorrect_no_video');
      }
      try { feedback.focus({ preventScroll: false }); } catch (_) { feedback.focus(); }
    }

    // ---------- navigation and summary
    function finish(reason) {
      const sc = scores(s);
      if (!s.completedSent && (s.started || sc.answered)) {
        s.completedSent = true;
        track(a => a.trackEvent('practice_completed', null, { practice_mode: s.mode, end_reason: reason,
          problems_answered: sc.answered, problems_correct: sc.correct, problems_completed: sc.completed,
          problems_presented: sc.presented, session_size: sc.size }));
        recordHistory(s, sc, reason);
      }
      s.status = 'completed';
      saveSession(s);
      if (nextBtn) nextBtn.hidden = true;
      showSummary(sc, reason);
      renderBar();
      if (bar) bar.hidden = true;
    }
    function showSummary(sc, reason) {
      if (!summary) return;
      summary.innerHTML = '';
      const h = document.createElement('h2');
      h.id = 'satact-summary-title';
      h.textContent = reason === 'finished' ? 'Session Complete' : 'Session Ended';
      const score = document.createElement('p');
      score.className = 'satact-summary-score';
      score.textContent = `${sc.correct} correct out of ${sc.answered} answered on the first try · ${sc.completed} of ${sc.size} completed`;
      summary.append(h, score);
      if (reason === 'finished') {
        const note = document.createElement('p');
        note.textContent = s.mode === 'topic' || (s.filters.skill !== 'all' || s.filters.subject !== 'all')
          ? `That's every question currently available for ${s.label} (${plural(sc.size)}). More are added as they are approved.`
          : `You have worked through every question in this set (${plural(sc.size)}).`;
        summary.append(note);
      }
      const list = document.createElement('ol');
      s.queue.forEach(id => {
        const p = byId.get(id);
        if (!p) return;
        const res = s.results[id];
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = p.url;
        a.textContent = `#${p.displayNumber} ${p.title}`;
        const status = !res || !res.presentedSent ? 'not reached'
          : res.firstResult === 'correct' ? 'correct on the first try'
          : res.firstResult === 'incorrect' ? (res.solved ? 'missed, then corrected' : 'missed')
          : res.revealedBeforeAnswer ? 'solution viewed' : 'skipped';
        li.append(a, document.createTextNode(` — ${status}`));
        list.append(li);
      });
      const actions = document.createElement('div');
      actions.className = 'satact-summary-actions';
      const again = document.createElement('button');
      again.type = 'button';
      again.className = 'satact-btn satact-btn-primary';
      again.textContent = 'Practice Again';
      again.addEventListener('click', () => {
        const ids = filterProblems(s.filters).map(p => p.id);
        const mode = s.mode === 'browse' ? 'mixed' : s.mode;
        goToSessionStart(createSession({ mode, filters: s.filters, ids, entry: 'summary', label: sessionLabel(mode, s.filters) }));
      });
      const topics = document.createElement('a');
      topics.className = 'satact-btn';
      topics.href = `${SECTION}#by-topic`;
      topics.textContent = 'Choose a Topic';
      const mixed = document.createElement('button');
      mixed.type = 'button';
      mixed.className = 'satact-btn';
      mixed.textContent = 'Mixed Practice';
      mixed.addEventListener('click', () => startFromControl('mixed', ALL, 'all', 'summary'));
      actions.append(again, topics, mixed);
      summary.append(list, actions);
      summary.hidden = false;
      try { summary.focus(); } catch (_) {}
      summary.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
    function onNext(event) {
      event.preventDefault();
      if (s.status !== 'active') { location.href = nextBtn.href; return; }
      if (s.mode === 'browse') {
        // A visitor who arrived on this page continues into a mixed set of the other questions.
        const seen = seenMap();
        const others = CATALOG.problems.map(p => p.id).filter(id => !s.queue.includes(id));
        const rest = shuffle(others.filter(id => !seen[id])).concat(shuffle(others.filter(id => seen[id])));
        if (!rest.length && nextIndex(s) < 0) { ensureStarted(s); finish('finished'); return; }
        s.mode = 'mixed';
        s.label = 'Mixed practice';
        s.queue = s.queue.concat(rest);
        ensureStarted(s);
      }
      const i = nextIndex(s);
      if (i < 0) { finish('finished'); return; }
      s.index = i;
      saveSession(s);
      location.href = byId.get(s.queue[i]).url;
    }

    // ---------- wire up
    function present() {
      if (!r.presentedSent) {
        r.presentedSent = true;
        saveSession(s);
        track(a => a.problemGenerated(meta, params({})));
      }
      if (s.mode !== 'browse') ensureStarted(s);
    }
    function restore() {
      if (r.solved) {
        const first = r.firstResult === 'correct';
        setFeedback('good', `Correct! The answer is ${data.answer}.`, first ? 'You answered this question earlier in this session.' : 'You corrected this answer earlier in this session. Your score counts your first answer.');
      } else if (r.revealedBeforeAnswer) {
        setFeedback('', `The answer is ${data.answer}.`, 'You opened the solution before answering, so this question is not scored.');
      } else if (r.firstResult === 'incorrect') {
        setFeedback('bad', 'Not quite.', 'You missed this question earlier in this session. You can try another answer; your score counts your first answer.');
      } else {
        feedback.innerHTML = '';
      }
      if (r.solution && details && !details.open) { pendingTrigger = 'restore'; details.open = true; }
    }
    attach();
    present();
    restore();
    renderAll();
    if (form) form.addEventListener('submit', onSubmit);
    if (nextBtn) nextBtn.addEventListener('click', onNext);
    if (solutionBtn) solutionBtn.addEventListener('click', () => {
      openSolution('button');
      details.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
    });
    if (watchBtn) watchBtn.addEventListener('click', () => {
      if (showVideo(r.firstResult === 'correct' ? 'after_correct' : 'requested')) videoSection.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
    });
    window.addEventListener('pageshow', event => {
      if (!event.persisted) return;
      attach();
      restore();
      renderAll();
    });
    // Test and debugging hook (read-only snapshot; no state can be changed through it).
    window.BMSatAct = Object.freeze({ session: () => JSON.parse(JSON.stringify(loadSession())), player: () => player });
  }

  // ------------------------------------------------------------------ typed answers (future SAT student-produced responses)
  // Accepts equivalent exact forms: 3/4, .75 and 0.75 all match an accepted answer of 3/4.
  function parseRational(raw) {
    let t = String(raw || '').trim().replace(/[−–—]/g, '-').replace(/\s+/g, '');
    if (window.BatchMathAnswers && typeof window.BatchMathAnswers.normalizeFractionSigns === 'function') {
      try { t = window.BatchMathAnswers.normalizeFractionSigns(t); } catch (_) {}
    }
    const frac = t.match(/^([+-]?)(\d+)\/(\d+)$/);
    if (frac) return frac[3] === '0' ? null : { n: BigInt(frac[1] + frac[2]), d: BigInt(frac[3]) };
    const dec = t.match(/^([+-]?)(\d*)(?:\.(\d*))?$/);
    if (dec && (dec[2] || dec[3])) {
      const digits = (dec[2] || '0') + (dec[3] || '');
      return { n: BigInt(dec[1] + digits), d: 10n ** BigInt((dec[3] || '').length) };
    }
    return null;
  }
  function typedMatches(value, accepted) {
    const a = parseRational(value);
    return accepted.some(ok => {
      const b = parseRational(ok);
      if (a && b) return a.n * b.d === b.n * a.d;
      return String(value).trim().toLowerCase().replace(/\s+/g, ' ') === String(ok).trim().toLowerCase().replace(/\s+/g, ' ');
    });
  }

  // ------------------------------------------------------------------ topic pages
  function initTopic() {
    wireStartLinks('topic', null);
    renderResume(document.getElementById('satact-resume'));
  }

  function init() {
    const page = document.body && document.body.dataset.satactPage;
    if (page === 'landing') initLanding();
    else if (page === 'topic') initTopic();
    else if (page === 'problem') initProblem();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
