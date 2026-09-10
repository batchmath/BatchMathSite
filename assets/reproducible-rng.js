/* BatchMath reproducible generator sessions — v10.6.3.X
   Gives every practice-engine session a deterministic random seed so generated
   problems can be reproduced for QA and bug reports. No student identity or
   typed answers are captured. */
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

  function reportObject() {
    const config = configSnapshot();
    return {
      schema: 1,
      appVersion: clean(window.BatchMathPWA?.version || '10.6.3.X'),
      course: config.course,
      engineId: config.engineId,
      generatorVersion: config.generatorVersion,
      seed: seedLabel,
      problemNumber: problemCount,
      problemId: currentProblemId,
      problemMeta: currentProblemMeta,
      randomCalls,
      settings: practiceSettings(),
      path: location.pathname
    };
  }

  function reportText() {
    return `BatchMath problem report\n${JSON.stringify(reportObject())}`;
  }

  function ensureReportUI() {
    if (document.getElementById('bm-report-problem')) return;
    const style = document.createElement('style');
    style.id = 'bm-report-problem-style';
    style.textContent = `
      #bm-report-problem{display:none;margin:16px auto 0;background:#0b0b0b;color:#cfcfcf;border:1px solid #444;border-radius:8px;padding:8px 12px;font:700 13px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer}
      #bm-report-problem:hover,#bm-report-problem:focus-visible{color:#f5c400;border-color:#f5c400;outline:none}
      #bm-report-dialog{border:1px solid #555;border-radius:12px;background:#090909;color:#f4f4f4;width:min(620px,calc(100% - 28px));padding:0;box-shadow:0 18px 60px rgba(0,0,0,.65)}
      #bm-report-dialog::backdrop{background:rgba(0,0,0,.72)}
      .bm-report-inner{padding:18px}.bm-report-inner h2{margin:0 0 8px;font:900 1.25rem/1.2 system-ui,-apple-system,Segoe UI,sans-serif;color:#f5c400}.bm-report-inner p{color:#ccc;line-height:1.45}.bm-report-code{width:100%;min-height:138px;resize:vertical;background:#030303;color:#eee;border:1px solid #444;border-radius:8px;padding:10px;font:12px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace}.bm-report-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.bm-report-actions button{min-height:44px;border-radius:8px;padding:8px 12px;font-weight:800;cursor:pointer}.bm-report-copy{background:#d71920;color:#fff;border:1px solid #d71920}.bm-report-close{background:#111;color:#eee;border:1px solid #555}.bm-report-status{min-height:1.3em;margin-top:8px;color:#9fda9f;font-size:.86rem}
    `;
    document.head.appendChild(style);

    const button = document.createElement('button');
    button.id = 'bm-report-problem';
    button.type = 'button';
    button.textContent = 'Report a Problem';

    const dialog = document.createElement('dialog');
    dialog.id = 'bm-report-dialog';
    dialog.innerHTML = `<div class="bm-report-inner"><h2>Report a Problem</h2><p>Copy this report and send it to your teacher. It identifies the generator session and problem so BatchMath can reproduce it. It does not include your name or typed answer.</p><textarea class="bm-report-code" readonly aria-label="Problem report"></textarea><div class="bm-report-actions"><button type="button" class="bm-report-copy">Copy Report</button><button type="button" class="bm-report-close">Close</button></div><div class="bm-report-status" aria-live="polite"></div></div>`;

    const footer = document.querySelector('footer');
    if (footer) footer.parentNode.insertBefore(button, footer);
    else document.body.appendChild(button);
    document.body.appendChild(dialog);
    // A generator may have produced its first problem before DOMContentLoaded
    // inserted this UI. In that case show the button immediately rather than
    // leaving it hidden for the rest of the session.
    if (problemCount > 0) button.style.display = 'block';

    button.addEventListener('click', () => {
      const box = dialog.querySelector('.bm-report-code');
      box.value = reportText();
      dialog.querySelector('.bm-report-status').textContent = '';
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
    dialog.querySelector('.bm-report-close').addEventListener('click', () => dialog.close?.() || dialog.removeAttribute('open'));
    dialog.querySelector('.bm-report-copy').addEventListener('click', async () => {
      const text = dialog.querySelector('.bm-report-code').value;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (_) {}
      if (!ok) {
        const box = dialog.querySelector('.bm-report-code');
        box.focus(); box.select();
        try { ok = document.execCommand('copy'); } catch (_) {}
      }
      dialog.querySelector('.bm-report-status').textContent = ok ? 'Report copied.' : 'Select the report text and copy it manually.';
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
