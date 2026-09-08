/* BatchMath engine analytics — v10.6.3.Q
   Anonymous usage instrumentation for practice engines.
   No names, email addresses, student IDs, typed answers, or literal problem text are sent.
   Events generated while offline are queued locally and flushed after connectivity returns. */
(() => {
  'use strict';

  const APP_VERSION = '10.6.3.Q';
  const TRACKING_SCHEMA = '1';
  const QUEUE_KEY = 'batchmath.analytics.queue.v1';
  const DEBUG_KEY = 'batchmath.analytics.debug.v1';
  const SEQUENCE_KEY = 'batchmath.analytics.sequence.v1';
  const MAX_QUEUE = 2500;
  const config = Object.assign({ course: '', engineId: '', generatorVersion: '1' }, window.BM_ANALYTICS_CONFIG || {});
  const query = new URLSearchParams(window.location.search);
  const debugParam = query.get('bm_debug');
  try {
    if (debugParam === '1') sessionStorage.setItem(DEBUG_KEY, '1');
    else if (debugParam === '0') sessionStorage.removeItem(DEBUG_KEY);
  } catch (_) {}
  let debugMode = debugParam === '1';
  if (!debugMode && debugParam !== '0') {
    try { debugMode = sessionStorage.getItem(DEBUG_KEY) === '1'; } catch (_) {}
  }
  let ensuredPracticeStarted = false;
  let flushing = false;
  const debugCounts = Object.create(null);
  let debugLastEvent = '';

  const clean = value => String(value ?? '')
    .trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);


  const nextSequence = () => {
    let value = 0;
    try {
      value = Number(sessionStorage.getItem(SEQUENCE_KEY) || '0');
      if (!Number.isFinite(value) || value < 0) value = 0;
      value += 1;
      sessionStorage.setItem(SEQUENCE_KEY, String(value));
    } catch (_) { value = Date.now(); }
    return value;
  };

  function ensureDebugPanel() {
    if (!debugMode || !document.body || document.getElementById('bm-analytics-debug')) return;
    const panel = document.createElement('aside');
    panel.id = 'bm-analytics-debug';
    panel.setAttribute('aria-label', 'BatchMath analytics debug');
    panel.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:2147483647;width:min(310px,calc(100vw - 20px));max-height:48vh;overflow:auto;background:#080808;color:#f4f4f4;border:1px solid #f5c400;border-radius:10px;padding:10px 12px;font:12px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 5px 24px rgba(0,0,0,.45)';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong style="color:#f5c400">Analytics Debug</strong><button type="button" id="bm-analytics-debug-clear" style="background:#151515;color:#fff;border:1px solid #555;border-radius:6px;padding:3px 7px;cursor:pointer">Clear</button></div><div id="bm-analytics-debug-engine" style="color:#aaa;margin-top:4px"></div><div id="bm-analytics-debug-counts" style="margin-top:7px"></div><div id="bm-analytics-debug-last" style="color:#aaa;margin-top:7px"></div>';
    document.body.appendChild(panel);
    document.getElementById('bm-analytics-debug-clear')?.addEventListener('click', () => {
      for (const key of Object.keys(debugCounts)) delete debugCounts[key];
      debugLastEvent = '';
      renderDebugPanel();
    });
    renderDebugPanel();
  }

  function renderDebugPanel() {
    if (!debugMode) return;
    ensureDebugPanel();
    const engine = document.getElementById('bm-analytics-debug-engine');
    const counts = document.getElementById('bm-analytics-debug-counts');
    const last = document.getElementById('bm-analytics-debug-last');
    if (!engine || !counts || !last) return;
    engine.textContent = `${config.engineId || 'unknown engine'} · debug stays on in this tab`;
    const names = ['practice_started','problem_generated','answer_checked','answer_correct','solution_revealed'];
    counts.innerHTML = names.map(name => `<div style="display:flex;justify-content:space-between;gap:10px"><span>${name}</span><strong>${debugCounts[name] || 0}</strong></div>`).join('');
    const queued = readQueue().length;
    last.textContent = `${debugLastEvent ? `Last: ${debugLastEvent} · ` : ''}Queued offline: ${queued}`;
  }

  function recordDebug(item) {
    if (!debugMode) return;
    debugCounts[item.name] = (debugCounts[item.name] || 0) + 1;
    debugLastEvent = `${item.name} #${item.params.event_sequence || '?'}`;
    try { console.info('[BatchMath analytics]', item.name, item.params); } catch (_) {}
    if (document.body) renderDebugPanel();
    else document.addEventListener('DOMContentLoaded', renderDebugPanel, { once:true });
  }

  const readQueue = () => {
    try {
      const value = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  };
  const writeQueue = queue => {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE))); } catch (_) {}
  };
  const enqueue = item => {
    const queue = readQueue();
    queue.push(item);
    writeQueue(queue);
  };
  const canSend = () => navigator.onLine !== false && typeof window.gtag === 'function';

  function commonParams(extra = {}) {
    const out = {
      course: clean(config.course),
      engine_id: clean(config.engineId),
      generator_version: clean(config.generatorVersion || '1'),
      app_version: APP_VERSION,
      tracking_schema: TRACKING_SCHEMA,
      event_sequence: nextSequence()
    };
    if (debugMode) out.debug_mode = true;
    for (const [key, value] of Object.entries(extra || {})) {
      if (value === undefined || value === null || value === '') continue;
      const k = clean(key);
      if (!k) continue;
      out[k] = typeof value === 'number' ? value : clean(value);
    }
    return out;
  }

  function sendItem(item, fromQueue = false) {
    if (!canSend()) return false;
    try {
      window.gtag('event', item.name, Object.assign({}, item.params, {
        offline_queued: fromQueue ? 'yes' : 'no'
      }));
      return true;
    } catch (_) { return false; }
  }

  function emit(name, params = {}) {
    if (!config.engineId || !config.course) return;
    const item = { name, params: commonParams(params), queuedAt: Date.now() };
    recordDebug(item);
    if (!sendItem(item, false)) enqueue(item);
    if (debugMode) renderDebugPanel();
  }

  async function flush() {
    if (flushing || !canSend()) return;
    flushing = true;
    try {
      const queue = readQueue();
      if (!queue.length) return;
      const remaining = [];
      for (const item of queue) {
        if (!sendItem(item, true)) remaining.push(item);
      }
      writeQueue(remaining);
      if (debugMode) renderDebugPanel();
    } finally { flushing = false; }
  }

  const firstToken = id => clean(String(id || '').split('-')[0]);
  const starts = (id, prefix) => String(id || '').startsWith(prefix);

  const orderFamilies = {
    1:'add_sub_with_multiplication',
    2:'parentheses_exponent_then_multiply',
    3:'grouped_power_with_another_power',
    4:'radical_over_multistep_expression',
    5:'large_fraction_with_radicals',
    6:'multistep_fraction_numerator',
    7:'power_multiplication_signed_number',
    8:'fraction_bar_grouping',
    9:'radical_and_grouped_fraction',
    10:'product_of_groups_then_add_subtract',
    11:'nested_grouping',
    12:'fraction_then_power'
  };

  const classifyingPrefixes = {
    di:'direct_integer', df:'direct_fraction', dd:'terminating_decimal', dr:'irrational_square_root', pi:'pi',
    rep:'repeating_decimal', nonrep:'nonrepeating_decimal', sp:'simplify_perfect_square_root', sf:'simplify_fraction_to_integer',
    sr:'reduce_fraction_then_classify', sq:'radical_fraction_to_integer', si:'simplify_irrational_root', negroot:'negative_perfect_square_root',
    wholedec:'decimal_equal_to_integer', negirr:'negative_irrational_root'
  };

  function rootExponentMeta(problem) {
    const key = String(problem?.key || '');
    if (key.startsWith('sqrt-')) return { problem_type:'square_root', problem_variant:'square_root' };
    const m = key.match(/^pow-(\d+)-(\d+)$/);
    if (!m) return {};
    const base = Number(m[1]), exp = Number(m[2]);
    if (exp === 2) return { problem_type:'square', problem_variant: base >= 30 ? 'square_tens_30_100' : 'square_2_20' };
    if (exp === 3) return { problem_type:'cube', problem_variant:'cube_2_10' };
    if (exp === 4) return { problem_type:'fourth_power', problem_variant:'fourth_power_2_5' };
    if (exp === 5) return { problem_type:'fifth_power', problem_variant:'fifth_power_2_3' };
    if (exp === 6) return { problem_type:'sixth_power', problem_variant:'sixth_power_2_3' };
    if (base === 2) return { problem_type:'power_of_two', problem_variant:`two_to_power_${exp}` };
    return { problem_type:'exponent', problem_variant:`power_${exp}` };
  }

  function limitVariant(id) {
    const s=String(id||'');
    for (const p of ['c-poly','c-rat','c-root','f-ds','f-q','f-ratio','f-cube']) if (s.startsWith(p+'-')) return clean(p);
    return firstToken(s);
  }

  function domainVariant(id) {
    const s=String(id||'');
    let m=s.match(/^(r[12]|rad[123]|log[12]|c(?:1[0-5]|[0-9]))(?:-|$)/); if(m) return clean(m[1]);
    m=s.match(/^tr-([a-z]+)-/); if(m) return clean('tr_'+m[1]);
    m=s.match(/^inv-([a-z]+)-/); if(m) return clean('inv_'+m[1]);
    return firstToken(s);
  }

  function inferProblemMeta(problem) {
    problem = problem || {};
    const engine = clean(config.engineId);
    const id = String(problem.id ?? problem.key ?? '');
    if (problem.problemType) return { problem_type:clean(problem.problemType), problem_variant:clean(problem.problemVariant || problem.problemType) };

    if (engine === 'im1_multiplication') return { problem_type:clean(problem.problemType || 'multiplication_fact'), problem_variant:clean(problem.problemType || 'multiplication_fact') };
    if (engine === 'im1_integer_add_subtract') return { problem_type:clean(problem.problemType || 'integer_add_subtract'), problem_variant:clean(problem.problemType || 'integer_add_subtract') };
    if (engine === 'im1_integer_multiply_divide') return { problem_type:clean(problem.problemType || problem.kind || 'integer_multiply_divide'), problem_variant:clean(problem.problemType || problem.kind || 'integer_multiply_divide') };
    if (engine === 'im1_exponents_radicals') return rootExponentMeta(problem);
    if (engine === 'im1_order_of_operations') { const v=orderFamilies[problem.family] || `family_${problem.family || 'unknown'}`; return {problem_type:v,problem_variant:`family_${String(problem.family || 'unknown').padStart(2,'0')}`}; }
    if (engine === 'im1_fractions') return {problem_type:clean(problem.problemType || problem.kind || 'fractions'),problem_variant:clean(problem.problemVariant || problem.problemType || problem.kind || 'fractions')};
    if (engine === 'im1_reducing_fractions') return {problem_type:'reduce_fraction',problem_variant:'reduce_fraction'};
    if (engine === 'im1_decimals') return {problem_type:clean(problem.problemType || problem.kind || 'decimals'),problem_variant:clean(problem.problemType || problem.kind || 'decimals')};
    if (engine === 'im1_percents') return {problem_type:clean(problem.problemType || problem.kind || 'percents'),problem_variant:clean(problem.problemVariant || problem.problemType || problem.kind || 'percents')};
    if (engine === 'im1_classifying_numbers') { const p=firstToken(id); const v=classifyingPrefixes[p] || p || 'classifying_numbers'; return {problem_type:v,problem_variant:v}; }

    if (engine === 'calc_prep_algebra') {
      const v = starts(id,'rat-num-')?'rationalize_numeric':starts(id,'rat-var-')?'rationalize_variable':starts(id,'cx-')?'complex_fraction':starts(id,'rs')?'simplify_rational_expression':'algebra';
      const variant = starts(id,'rat-num-')?'rat_num':starts(id,'rat-var-')?'rat_var':starts(id,'cx-')?'complex_fraction':starts(id,'rs3-')?'rational_expression_3':starts(id,'rs2-')?'rational_expression_2':starts(id,'rs-')?'rational_expression_1':firstToken(id);
      return {problem_type:v,problem_variant:variant};
    }
    if (engine === 'calc_prep_angle_skills') {
      const p=firstToken(id); const types={coord:'unit_circle_coordinate',d2r:'degrees_to_radians',r2d:'radians_to_degrees',ref:'reference_angle',cot:'coterminal_angle',quad:'quadrant'};
      return {problem_type:types[p]||p,problem_variant:p};
    }
    if (engine === 'calc_prep_domains') {
      const v=domainVariant(id); let t='combined_domain';
      if(/^r[12]$/.test(v))t='rational_domain'; else if(/^rad/.test(v))t='radical_domain'; else if(/^log/.test(v))t='logarithmic_domain'; else if(/^tr_/.test(v))t='trig_domain'; else if(/^inv_/.test(v))t='inverse_trig_domain';
      return {problem_type:t,problem_variant:v};
    }
    if (engine === 'calc_prep_special_factoring') {
      const p=firstToken(id); const types={dos:'difference_of_squares',cube:'sum_difference_of_cubes',perfect:'perfect_power',high:'higher_special_pattern',group:'factor_by_grouping',sub:'substitution_factoring',subp:'substitution_factoring',pascal:'pascal_triangle',gcf:'gcf_then_factor'};
      return {problem_type:types[p]||p,problem_variant:p};
    }
    if (engine === 'calc_prep_function_graphs') {
      const s=String(id); const qkind=s.startsWith('eq-')?'equation_matching':'feature_analysis'; const rest=s.replace(/^(?:eq|feat)-/,''); const p=firstToken(rest); const families={pq:'quadratic',pc:'cubic',r:'rational',e:'exponential',l:'logarithmic',t:'trigonometric'};
      return {problem_type:qkind,problem_variant:families[p]||p};
    }
    if (engine === 'calc_prep_trig_identities') {
      const recall=starts(id,'rec-'); const variant=clean(String(id).replace(/^(?:rec|rew)-/,'')); return {problem_type:recall?'identity_recall':'identity_rewrite',problem_variant:variant};
    }
    if (engine === 'calc_prep_log_rules') {
      const p=firstToken(id); let t='log_rules';
      if(/^prod\d+$/.test(p))t='product_rule'; else if(/^quo\d+$/.test(p))t='quotient_rule'; else if(p==='pow')t='power_rule'; else if(p==='exp')t='expand_logarithm'; else if(p==='con')t='condense_logarithm'; else if(p==='cb')t='change_of_base'; else if(p==='eval')t='evaluate_logarithm'; else if(/^inv\d+$/.test(p))t='inverse_log_exp';
      return {problem_type:t,problem_variant:p};
    }
    if (engine === 'calc_prep_rational_functions') return {problem_type:'rational_function_analysis',problem_variant:clean(`${problem.type || 'unknown'}_${problem.dm || 'unknown'}`)};
    if (engine === 'calc_prep_synthetic_division_rrt') { const k=clean(problem.kind || firstToken(id)); const types={rrt:'rational_root_theorem',division:'synthetic_division',factor:'factor_theorem'}; return {problem_type:types[k]||k,problem_variant:k}; }
    if (engine === 'calc_prep_trig_equations') {
      const p=firstToken(id); let t='trig_equation'; let variant=p;
      if(p==='basic'){t='basic_trig_equation'; const m=String(id).match(/^basic-([a-z]+)/);variant=m?`basic_${m[1]}`:'basic';}
      else if(/^fac\d+$/.test(p))t='factor_trig_equation'; else if(/^q\d+$/.test(p))t='quadratic_trig_equation'; else if(/^id\d+$/.test(p))t='identity_trig_equation';
      return {problem_type:t,problem_variant:variant};
    }
    if (engine === 'calc_prep_unit_circle_values') { const fn=firstToken(id); return {problem_type:'unit_circle_exact_value',problem_variant:fn}; }

    if (engine === 'ap_limits_comprehensive') {
      const types={continuous:'continuous_functions',factoring:'factoring_limits',substitution:'variable_substitution',rationalizing:'rationalizing_limits',complex:'complex_fraction_limits',squeeze:'squeeze_theorem',trig:'trigonometric_limits',onesided:'one_sided_limits',infinity:'limits_involving_infinity',special:'oscillating_dne_limits',infinityspecial:'infinity_and_oscillating_limits'};
      const cat=clean(problem.cat); return {problem_type:types[cat]||cat||'limits',problem_variant:limitVariant(id)};
    }
    if (engine === 'ap_derivatives_comprehensive') {
      const types={basic:'basic_derivative_rules',product:'product_rule',quotient:'quotient_rule',trig:'trigonometric_derivatives',chain:'chain_rule',exponential:'exponential_derivatives',implicit:'implicit_differentiation',log:'logarithmic_derivatives',logdiff:'logarithmic_differentiation',invtrig:'inverse_trig_derivatives',inverse:'inverse_function_derivatives',point:'derivative_at_a_point'};
      const cat=clean(problem.cat); return {problem_type:types[cat]||cat||'derivatives',problem_variant:firstToken(id)};
    }
    if (engine === 'ap_integrals_comprehensive') {
      const types={basic:'basic_integrals',usub:'u_substitution',log:'natural_log_integrals',average:'average_value_mvt_integrals'};
      const cat=clean(problem.cat); return {problem_type:types[cat]||cat||'integrals',problem_variant:firstToken(id)};
    }

    const fallback=clean(problem.kind || problem.type || problem.cat || firstToken(id) || 'unknown');
    return {problem_type:fallback,problem_variant:fallback};
  }

  function eventParams(problem, extra = {}) {
    const meta=inferProblemMeta(problem);
    return Object.assign({}, meta, extra || {});
  }

  const api = {
    config: Object.freeze(Object.assign({}, config)),
    inferProblemMeta,
    practiceStarted(extra = {}) { emit('practice_started', extra); },
    ensurePracticeStarted(extra = {}) { if (ensuredPracticeStarted) return; ensuredPracticeStarted = true; emit('practice_started', extra); },
    problemGenerated(problem, extra = {}) { try { window.BatchMathRepro?.noteProblem(problem); } catch (_) {} emit('problem_generated', eventParams(problem, extra)); },
    answerChecked(problem, correct, extra = {}) {
      const params=eventParams(problem, Object.assign({ answer_result: correct ? 'correct' : 'incorrect' }, extra || {}));
      emit('answer_checked', params);
      if (correct) emit('answer_correct', params);
    },
    solutionRevealed(problem, extra = {}) { emit('solution_revealed', eventParams(problem, extra)); },
    flush,
    queuedCount() { return readQueue().length; },
    debugEnabled: debugMode,
    debugCounts() { return Object.assign({}, debugCounts); }
  };

  window.BMAnalytics = api;
  window.addEventListener('online', () => { setTimeout(flush, 250); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') flush(); });
  if (debugMode) {
    if (document.body) renderDebugPanel();
    else document.addEventListener('DOMContentLoaded', renderDebugPanel, { once:true });
  }
  setTimeout(flush, 1200);
})();
