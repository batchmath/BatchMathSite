/* BatchMath reproducible generator sessions — v12.8.G
   Gives every practice-engine session a deterministic random seed so generated
   problems can be reproduced for QA and bug reports. Problem reports contain
   the entered answer, but no student identity or contact information. */
(() => {
  'use strict';

  const query = new URLSearchParams(window.location.search);
  const suppliedSeed = query.get('bm_seed');

  function hashSeed(value) {
    const s = String(value ?? '');
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h += h << 13; h ^= h >>> 7;
    h += h << 3; h ^= h >>> 17;
    h += h << 5;
    return h >>> 0;
  }

  function freshSeed() {
    try {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0] >>> 0;
    } catch (_) {
      return hashSeed(`${Date.now()}-${performance.now()}-${navigator.userAgent}`);
    }
  }

  const seedLabel = suppliedSeed !== null && suppliedSeed !== '' ? suppliedSeed : String(freshSeed());
  let state = hashSeed(seedLabel) || 0x6d2b79f5;
  let randomCalls = 0;
  let problemCount = 0;
  let currentProblemId = '';
  let currentProblemMeta = {};
  const REPORT_ENDPOINT = '/api/report-problem';
  const DESCRIPTION_LIMIT = 800;
  const ANSWER_LIMIT = 4000;

  function seededRandom() {
    randomCalls += 1;
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Generator code calls this dedicated RNG. We intentionally do NOT replace
  // global Math.random, so MathJax/browser/third-party code cannot consume or
  // disturb the reproducible BatchMath sequence.
  window.BatchMathRNG = Object.freeze({ random: seededRandom, seed: seedLabel });

  const clean = value => String(value ?? '').trim().slice(0, 160);
  const problemId = problem => clean(problem?.id ?? problem?.key ?? problem?.problemId ?? '');

  function practiceSettings() {
    const out = {};
    const controls = document.querySelectorAll('select, input[type="radio"], input[type="checkbox"]');
    for (const el of controls) {
      if (!el.id && !el.name) continue;
      const key = clean(el.id || el.name);
      if (!key || /answer|response|email|name|student/i.test(key)) continue;
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) continue;
      out[key] = clean(el.value);
    }
    return out;
  }

  function configSnapshot() {
    const config = window.BM_ANALYTICS_CONFIG || window.BMAnalytics?.config || {};
    return {
      course: clean(config.course || ''),
      engineId: clean(config.engineId || ''),
      generatorVersion: clean(config.generatorVersion || '1')
    };
  }

  function clipped(value, limit = ANSWER_LIMIT) {
    return String(value ?? '').slice(0, limit);
  }

  function answerFieldLabel(element, index) {
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const text = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ').trim();
      if (text) return clipped(text, 180);
    }
    const explicit = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    const wrapping = element.closest('label');
    return clipped(
      element.getAttribute('aria-label') ||
      explicit?.textContent ||
      wrapping?.textContent ||
      element.placeholder ||
      element.id ||
      element.name ||
      `Answer field ${index + 1}`,
      180
    ).replace(/\s+/g, ' ').trim();
  }

  function captureSubmittedAnswer() {
    const fields = [];
    const choices = [];
    const seen = new Set();
    const fieldElements = document.querySelectorAll('input, textarea');

    for (const element of fieldElements) {
      if (element.closest('#bm-report-dialog')) continue;
      const type = String(element.type || '').toLowerCase();
      if (['button', 'submit', 'reset', 'file', 'password', 'email', 'radio', 'checkbox'].includes(type)) continue;
      const clues = [element.id, element.name, element.className, element.getAttribute('aria-label'), element.placeholder,
        element.dataset?.bmCalcKeypad, element.dataset?.bmCalcSource, element.dataset?.bmFractionReady].join(' ');
      const inAnswerArea = !!element.closest('.answer-row, .answer-area, .answer-block, .question-area, .response-area, [data-answer-area]');
      if (!inAnswerArea && !/answer|response|solution|coordinate|slope|formula|equation|value|interval/i.test(clues)) continue;
      const value = clipped(element.value);
      if (!value.trim()) continue;
      const key = `${element.id || element.name || fields.length}\u0000${value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      fields.push({
        id: clipped(element.id || element.name || '', 160),
        label: answerFieldLabel(element, fields.length),
        value,
        structured: element.classList.contains('bm-calc-source') || !!element.dataset?.bmCalcKeypad
      });
    }

    for (const element of document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked')) {
      if (element.closest('#bm-report-dialog')) continue;
      const clues = [element.id, element.name, element.className, element.getAttribute('aria-label')].join(' ');
      if (!element.closest('.choice-grid, .choices, .answer-area, .question-area') && !/answer|response|choice/i.test(clues)) continue;
      choices.push({
        label: answerFieldLabel(element, choices.length),
        value: clipped(element.value || element.getAttribute('aria-label') || 'selected', 1000)
      });
    }

    const selectedButtons = document.querySelectorAll(
      '.choice.selected, .choice.chosen, .choice.incorrect, .choice.wrong, .choice[aria-pressed="true"], .choice[aria-checked="true"]'
    );
    for (const element of selectedButtons) {
      if (element.closest('#bm-report-dialog')) continue;
      const value = clipped(element.dataset?.value || element.getAttribute('aria-label') || element.textContent, 1000)
        .replace(/\s+/g, ' ').trim();
      if (value && !choices.some(choice => choice.value === value)) choices.push({ label: 'Selected choice', value });
    }

    let activeStructuredExpression = '';
    try { activeStructuredExpression = clipped(window.BatchMathCalculusKeypad?.raw || ''); } catch (_) {}
    return {
      status: fields.length || choices.length || activeStructuredExpression ? 'answer entered' : 'no answer entered',
      fields,
      choices,
      activeStructuredExpression
    };
  }

  function reportObject() {
    const config = configSnapshot();
    return {
      schema: 2,
      appVersion: clean(window.BatchMathPWA?.version || '12.8.G'),
      course: config.course,
      engineId: config.engineId,
      generatorVersion: config.generatorVersion,
      seed: seedLabel,
      problemNumber: problemCount,
      problemId: currentProblemId,
      problemMeta: currentProblemMeta,
      randomCalls,
      settings: practiceSettings(),
      path: location.pathname,
      submittedAnswer: captureSubmittedAnswer()
    };
  }

  function reportText() {
    return `BatchMath problem report\n${JSON.stringify(reportObject())}`;
  }

  function reportClientToken() {
    const storageKey = 'batchmath-report-client';
    try {
      const prior = localStorage.getItem(storageKey);
      if (/^[a-zA-Z0-9_-]{16,100}$/.test(prior || '')) return prior;
      const token = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(18)), byte => byte.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(storageKey, token);
      return token;
    } catch (_) {
      return `${seedLabel}-${Date.now().toString(36)}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100);
    }
  }

  function ensureReportUI() {
    if (document.getElementById('bm-report-problem')) return;
    const style = document.createElement('style');
    style.id = 'bm-report-problem-style';
    style.textContent = `
      #bm-report-problem{display:none;margin:16px auto 0;background:#0b0b0b;color:#cfcfcf;border:1px solid #444;border-radius:8px;padding:8px 12px;font:700 13px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer}
      #bm-report-problem:hover,#bm-report-problem:focus-visible{color:#f5c400;border-color:#f5c400;outline:none}
      #bm-report-dialog{border:1px solid #555;border-radius:12px;background:#090909;color:#f4f4f4;width:min(520px,calc(100% - 28px));max-height:calc(100dvh - 28px);padding:0;box-shadow:0 18px 60px rgba(0,0,0,.65)}
      #bm-report-dialog::backdrop{background:rgba(0,0,0,.72)}
      .bm-report-inner{padding:18px;overflow:auto}.bm-report-inner h2{margin:0 0 14px;font:900 1.25rem/1.2 system-ui,-apple-system,Segoe UI,sans-serif;color:#f5c400}.bm-report-label{display:block;margin:0 0 5px;color:#fff;font:800 .98rem/1.3 system-ui,-apple-system,Segoe UI,sans-serif}.bm-report-help{margin:0 0 9px;color:#bbb;font:400 .9rem/1.4 system-ui,-apple-system,Segoe UI,sans-serif}.bm-report-description{display:block;width:100%;min-height:96px;max-height:180px;resize:vertical;background:#030303;color:#eee;border:1px solid #666;border-radius:8px;padding:10px 11px;font:1rem/1.4 system-ui,-apple-system,Segoe UI,sans-serif}.bm-report-description:focus{border-color:#f5c400;outline:2px solid rgba(245,196,0,.22);outline-offset:1px}.bm-report-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.bm-report-actions button{min-height:44px;border-radius:8px;padding:8px 14px;font-weight:800;cursor:pointer}.bm-report-send{background:#d71920;color:#fff;border:1px solid #d71920}.bm-report-send:disabled{opacity:.62;cursor:wait}.bm-report-close{background:#111;color:#eee;border:1px solid #555}.bm-report-status{min-height:1.4em;margin:9px 0 0;font:700 .88rem/1.4 system-ui,-apple-system,Segoe UI,sans-serif}.bm-report-status[data-state="success"]{color:#9fda9f}.bm-report-status[data-state="error"]{color:#ff9b9b}.bm-report-honeypot{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important}
      @media(max-width:520px){.bm-report-inner{padding:15px}.bm-report-actions{display:grid;grid-template-columns:1fr 1fr}.bm-report-actions button{width:100%}}
    `;
    document.head.appendChild(style);

    const button = document.createElement('button');
    button.id = 'bm-report-problem';
    button.type = 'button';
    button.textContent = 'Report a Problem';

    const dialog = document.createElement('dialog');
    dialog.id = 'bm-report-dialog';
    dialog.innerHTML = `<form class="bm-report-inner" novalidate><h2>Report a Problem</h2><label class="bm-report-label" for="bm-report-description">What went wrong?</label><p class="bm-report-help" id="bm-report-help">Briefly describe the problem you noticed.</p><textarea id="bm-report-description" class="bm-report-description" aria-describedby="bm-report-help" maxlength="${DESCRIPTION_LIMIT}" required></textarea><label class="bm-report-honeypot" aria-hidden="true">Leave this field blank<input class="bm-report-website" name="website" type="text" tabindex="-1" autocomplete="off"></label><div class="bm-report-actions"><button type="submit" class="bm-report-send">Send Report</button><button type="button" class="bm-report-close">Close</button></div><p class="bm-report-status" role="status" aria-live="polite"></p></form>`;

    const footer = document.querySelector('footer');
    if (footer) footer.parentNode.insertBefore(button, footer);
    else document.body.appendChild(button);
    document.body.appendChild(dialog);
    // A generator may have produced its first problem before DOMContentLoaded
    // inserted this UI. In that case show the button immediately rather than
    // leaving it hidden for the rest of the session.
    if (problemCount > 0) button.style.display = 'block';

    const form = dialog.querySelector('form');
    const description = dialog.querySelector('.bm-report-description');
    const send = dialog.querySelector('.bm-report-send');
    const status = dialog.querySelector('.bm-report-status');
    const setStatus = (message, state = '') => {
      status.textContent = message;
      if (state) status.dataset.state = state;
      else delete status.dataset.state;
    };

    button.addEventListener('click', () => {
      form.reset();
      description.disabled = false;
      send.disabled = false;
      send.hidden = false;
      send.textContent = 'Send Report';
      setStatus('');
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      requestAnimationFrame(() => description.focus());
    });
    dialog.querySelector('.bm-report-close').addEventListener('click', () => dialog.close?.() || dialog.removeAttribute('open'));
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const written = description.value.trim();
      if (written.length < 3) {
        setStatus('Please add a brief description.', 'error');
        description.focus();
        return;
      }
      send.disabled = true;
      send.textContent = 'Sending…';
      setStatus('');
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timeout = controller ? setTimeout(() => controller.abort(), 15000) : null;
      try {
        const response = await fetch(REPORT_ENDPOINT, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          signal: controller?.signal,
          body: JSON.stringify({
            schema: 1,
            description: written.slice(0, DESCRIPTION_LIMIT),
            diagnostic: reportObject(),
            clientToken: reportClientToken(),
            website: dialog.querySelector('.bm-report-website').value
          })
        });
        let result = null;
        try { result = await response.json(); } catch (_) {}
        if (!response.ok || result?.ok !== true) throw new Error('report failed');
        description.disabled = true;
        send.hidden = true;
        setStatus('Report sent. Thank you.', 'success');
      } catch (_) {
        send.disabled = false;
        send.textContent = 'Send Report';
        setStatus('Report could not be sent. Please try again.', 'error');
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    });
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close?.(); });
  }

  const api = {
    seed: seedLabel,
    seedSource: suppliedSeed !== null && suppliedSeed !== '' ? 'query' : 'generated',
    noteProblem(problem) {
      problemCount += 1;
      currentProblemId = problemId(problem);
      currentProblemMeta = {};
      try {
        if (window.BMAnalytics?.inferProblemMeta) currentProblemMeta = window.BMAnalytics.inferProblemMeta(problem) || {};
      } catch (_) {}
      // Avoid an initialization race: some engines generate immediately in an
      // inline script, before DOMContentLoaded has created the report UI.
      if (!document.getElementById('bm-report-problem') && document.body) ensureReportUI();
      const button = document.getElementById('bm-report-problem');
      if (button) button.style.display = 'block';
    },
    snapshot() { return Object.assign(reportObject(), { problemCount }); },
    reportObject,
    reportText,
    get randomCalls() { return randomCalls; },
    get problemCount() { return problemCount; },
    get currentProblemId() { return currentProblemId; }
  };

  window.BatchMathRepro = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureReportUI, { once: true });
  else ensureReportUI();
})();
