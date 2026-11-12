// IM1 Unit 4 Section 1 practice engines (assets/im1-unit4-generators.js): mathematics, grading, variety, explanations.
// Each generated problem is re-read from its visible question text and solved independently with exact BigInt
// fractions; the graded answers must agree. Grading uses the site's own checker (assets/im1-unit3-practice.js, loaded
// in a sandbox): equivalent forms (3/2 = 1.5 = 6/4, a unicode minus, spaces) are accepted; wrong answers and rounded
// decimals of repeating values (0.333 for 1/3) are rejected.
// Usage: node tools/im1-unit4/section1-qa.mjs [problems per engine, default 4000]   (report: qa-results/im1-unit4-section1-qa.json)
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const ROOT = process.cwd(), N = +process.argv[2] || 4000, errors = [], stats = {};
const fail = m => {if (errors.length < 200) errors.push(m);};
function rng(seed) {let s = seed >>> 0; return () => {s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;};}

// ---- the site's code ----
const sandbox = {window: {}, Math, console}; sandbox.window.window = sandbox.window;
sandbox.document = {addEventListener() {}, documentElement: {classList: {add() {}, toggle() {}}}, getElementById: () => null, querySelectorAll: () => []};
sandbox.window.document = sandbox.document; sandbox.window.BM_UNIT3_PRACTICE = {};
vm.createContext(sandbox);
for (const f of ['assets/im1-unit4-generators.js', 'assets/im1-unit3-practice.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, {filename: f});
const G = sandbox.window.BatchMathIM1Unit4Generators, CHECK = sandbox.window.BatchMathIM1Unit3PracticeQA;
if (!G || !CHECK) throw new Error('generators or checker did not load');

// ---- exact arithmetic (independent of the generators) ----
const big = n => BigInt(n), bgcd = (a, b) => {a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a || 1n;};
function Q(n, d = 1n) {n = big(n); d = big(d); if (d === 0n) throw Error('zero denominator'); if (d < 0n) {n = -n; d = -d;} const g = bgcd(n, d); return {n: n / g, d: d / g};}
const qmul = (a, b) => Q(a.n * b.n, a.d * b.d), qdiv = (a, b) => Q(a.n * b.d, a.d * b.n), qeq = (a, b) => a.n === b.n && a.d === b.d;
const qstr = q => q.d === 1n ? String(q.n) : `${q.n}/${q.d}`;
// a number as the question shows it: 12, -7, \frac{25}{2}, -\frac{1}{3}, 1.25
function parseNum(t) {
 t = t.replace(/\\displaystyle\s*/g, '').replace(/\\left\(|\\right\)/g, '').trim();
 let m = t.match(/^(-?)\\frac\{(\d+)\}\{(\d+)\}$/); if (m) return Q((m[1] ? -1n : 1n) * big(m[2]), big(m[3]));
 m = t.match(/^(-?\d+)(?:\.(\d+))?$/); if (m) return m[2] ? Q(big(m[1] + m[2]), 10n ** big(m[2].length)) : Q(big(m[1]));
 throw Error(`unreadable number ${t}`);
}
const answerOf = s => {const x = String(s); return x.includes('/') ? Q(...x.split('/').map(big)) : x.includes('.') ? parseNum(x) : Q(big(x));};
const seqFromQ = q => {const m = q.match(/\\\((.*?), \\ldots\\\)/); if (!m) throw Error('no sequence'); return m[1].replace(/\\displaystyle\s*/, '').split(/,\s*/).map(parseNum);};
const termsOf = (a1, r, k) => {const out = [a1]; while (out.length < k) out.push(qmul(out.at(-1), r)); return out;};

// ---- grading: the checker accepts every equivalent exact form and rejects wrong or approximate ones ----
let gradingChecks = 0;
function gradeField(answer, label) {
 const q = answerOf(answer), ok = raw => CHECK.numericEqual(raw, String(answer)).ok === true;
 const forms = [qstr(q), qstr(q).replace('-', '−'), ` ${qstr(q)} `];
 if (q.d !== 1n) forms.push(`${q.n * 2n}/${q.d * 2n}`);                                     // not reduced
 let d = q.d; for (const p of [2n, 5n]) while (d % p === 0n) d /= p;
 if (d === 1n && q.d !== 1n) forms.push(String(Number(q.n) / Number(q.d)));                 // exact decimal
 for (const f of forms) {gradingChecks++; if (!ok(f)) fail(`${label}: equivalent answer "${f}" for ${answer} was not accepted`);}
 for (const wrong of [qstr(Q(q.n + q.d, q.d)), qstr(Q(-q.n, q.d)), qstr(Q(q.d, q.n === 0n ? 1n : q.n))]) {
  if (qeq(answerOf(wrong), q)) continue; gradingChecks++; if (ok(wrong)) fail(`${label}: wrong answer "${wrong}" accepted for ${answer}`);
 }
 if (d !== 1n) {gradingChecks++; if (ok(String(Number((Number(q.n) / Number(q.d)).toFixed(3))))) fail(`${label}: rounded decimal accepted for ${answer}`);}
}

// ---- independent solvers for each engine ----
const variety = {}, note = (slug, key) => {variety[slug] ??= {}; variety[slug][key] = (variety[slug][key] || 0) + 1;};
function check1A(p, label) {
 const terms = seqFromQ(p.q), ratios = terms.slice(1).map((t, i) => qdiv(t, terms[i])), geometric = ratios.every(r => qeq(r, ratios[0]));
 if (terms.length !== 4) fail(`${label}: expected four shown terms`);
 if ((p.correctIndex === 0) !== geometric || p.choices[p.correctIndex] !== (geometric ? 'Yes' : 'No')) fail(`${label}: Yes/No answer is wrong for ${p.q}`);
 if (p.arithmetic !== geometric) fail(`${label}: the ratio follow-up must appear exactly for geometric sequences`);
 if (geometric) {if (!qeq(answerOf(p.difference), ratios[0])) fail(`${label}: common ratio ${p.difference}, expected ${qstr(ratios[0])}`); gradeField(p.difference, label);}
 if (p.followupKeypad !== 'fraction') fail(`${label}: the ratio follow-up needs the fraction keypad`);
 note('1A', geometric ? `geometric r=${qstr(ratios[0])}` : p.variant);
 if (!geometric && terms.slice(1).every((t, i) => qeq(Q(t.n * terms[i].d - terms[i].n * t.d, t.d * terms[i].d), Q(terms[1].n * terms[0].d - terms[0].n * terms[1].d, terms[1].d * terms[0].d))) && !/arithmetic sequence/.test(p.explain)) fail(`${label}: an arithmetic look-alike must explain adding versus multiplying`);
}
function check1B(p, label) {
 const shown = seqFromQ(p.q), r = qdiv(shown[1], shown[0]);
 if (!shown.slice(1).every((t, i) => qeq(qdiv(t, shown[i]), r))) fail(`${label}: shown sequence is not geometric`);
 const next = termsOf(shown[3], r, 4).slice(1), [ratio, ...rest] = p.fields;
 if (p.fields.length !== 4 || !qeq(answerOf(ratio.answer), r)) fail(`${label}: common ratio field`);
 rest.forEach((f, i) => {if (!qeq(answerOf(f.answer), next[i])) fail(`${label}: next term ${i + 1} is ${f.answer}, expected ${qstr(next[i])}`);});
 p.fields.forEach(f => gradeField(f.answer, label));
 note('1B', r.d === 1n ? (r.n < 0n ? 'negative whole ratio' : 'whole ratio') : (r.n < 0n ? 'negative fraction ratio' : 'fraction ratio'));
 if (next.some(t => t.d !== 1n)) note('1B', 'fractional next terms');
}
function check1C(p, label) {
 const a1 = parseNum(p.q.match(/a_1=([^\\]*?(?:\\frac\{\d+\}\{\d+\})?)\\\)/)[1]), r = parseNum(p.q.match(/r=([^\\]*?(?:\\frac\{\d+\}\{\d+\})?)\\\)/)[1]);
 if (/first five terms/.test(p.q)) {
  const want = termsOf(a1, r, 5);
  if (p.fields.length !== 5) fail(`${label}: five fields expected`);
  p.fields.forEach((f, i) => {if (!qeq(answerOf(f.answer), want[i])) fail(`${label}: term ${i + 1} is ${f.answer}, expected ${qstr(want[i])}`);});
  note('1C', 'first five terms');
 } else {
  const n = +p.q.match(/Find \\\(a_\{(\d+)\}\\\)/)[1], want = termsOf(a1, r, n).at(-1);
  if (p.fields.length !== 1 || !qeq(answerOf(p.fields[0].answer), want)) fail(`${label}: a_${n} is ${p.fields[0]?.answer}, expected ${qstr(want)}`);
  if (!p.explain.includes(`${n} − 1 = ${n - 1} multiplications`)) fail(`${label}: explanation must count the ${n - 1} multiplications`);
  note('1C', `find a_n (n=${n})`); if (want.d !== 1n) note('1C', 'fractional a_n'); if (want.n < 0n) note('1C', 'negative a_n');
 }
 if (r.d !== 1n) note('1C', 'fraction ratio'); if (r.n < 0n) note('1C', 'negative ratio');
 p.fields.forEach(f => gradeField(f.answer, label));
}
const PERCENT = /(increases by|decreases by|loses) (\d+)%/;
function factorFrom(text) {
 const m = text.match(PERCENT); if (m) return Q(m[1] === 'increases by' ? 100 + +m[2] : 100 - +m[2], 100);
 const words = [[/\bquadruples\b/, Q(4)], [/\btriples\b/, Q(3)], [/\bdoubles\b/, Q(2)], [/is cut in half/, Q(1, 2)], [/becomes 5 times as large/, Q(5)], [/(\d) times as many/, null],
  [/one third of/, Q(2, 3)], [/one fourth of/, Q(3, 4)], [/two thirds of/, Q(1, 3)], [/\bhalf of/, Q(1, 2)]];
 for (const [re, r] of words) {const w = text.match(re); if (w) return r || Q(+w[1]);}
 throw Error(`no rate in: ${text}`);
}
function check1D(p, label) {
 const text = p.q.replace(/\\\(|\\\)/g, '');
 if (p.kind === 'mc') {
  if (p.choices.length !== 4 || new Set(p.choices).size !== 4) fail(`${label}: four distinct choices expected`);
  if (p.variant === 'read_factor') {
   const r = parseNum(text.match(/multiplied by (\d+(?:\.\d+)?)/)[1]), pct = Number((Math.abs(Number(r.n) / Number(r.d) - 1) * 100).toFixed(6));
   const want = `${Number(r.n) > Number(r.d) ? 'Growth' : 'Decay'} by ${pct}%`;
   if (p.choices[p.correctIndex] !== want) fail(`${label}: chose ${p.choices[p.correctIndex]}, expected ${want}`);
  } else if (!qeq(answerOf(p.choices[p.correctIndex]), factorFrom(text))) fail(`${label}: common ratio choice ${p.choices[p.correctIndex]} is wrong for "${text}"`);
  note('1D', `factor ${p.variant}`); return;
 }
 const r = factorFrom(text), ratioField = p.fields.find(f => f.id === 'ratio'), valueField = p.fields.find(f => f.id === 'value');
 if (ratioField && !qeq(answerOf(ratioField.answer), r)) fail(`${label}: ratio ${ratioField.answer}, expected ${qstr(r)} for "${text}"`);
 if (p.variant === 'state_factor') {if (!ratioField || p.fields.length !== 1) fail(`${label}: one ratio field expected`); note('1D', `factor ${qstr(r)}`);}
 else {
  const start = text.match(/(\d+) (?:cells|organisms|mg|shares|people|grams|points)|\$(\d+)/), a1 = Q(big(start[1] || start[2]));
  const n = +text.match(/(?:end of (?:hour|year|day)|on day|in level) (\d+)\.(?: \(Enter|$)/)?.[1];
  if (!n) fail(`${label}: no target term in "${text}"`);
  const want = termsOf(a1, r, n).at(-1);
  if (!valueField || !qeq(answerOf(valueField.answer), want)) fail(`${label}: value ${valueField?.answer}, expected ${qstr(want)} for "${text}"`);
  if (want.d !== 1n || want.n <= 0n) fail(`${label}: word-problem values must be positive whole numbers (${qstr(want)})`);
  if (/State the common ratio/.test(text) !== Boolean(ratioField)) fail(`${label}: asks for the ratio exactly when the question says so`);
  if (!p.explain.includes(`${n} − 1 = ${n - 1} multiplications`)) fail(`${label}: explanation must count the ${n - 1} multiplications`);
  note('1D', `model ${p.variant}`); note('1D', r.d === 1n ? 'model whole ratio' : Number(r.n) > Number(r.d) ? 'model growth percent' : 'model decay');
 }
 p.fields.forEach(f => gradeField(f.answer, label));
}
const CHECKERS = {'geometric-or-not': check1A, 'common-ratios-and-next-terms': check1B, 'finding-terms-of-geometric-sequences': check1C, 'geometric-growth-and-decay-modeling': check1D};
const prefix = {'u4-01a': 'geometric-or-not', 'u4-01b': 'common-ratios-and-next-terms', 'u4-01c': 'finding-terms-of-geometric-sequences', 'u4-01d': 'geometric-growth-and-decay-modeling'};

function common(p, label) {
 for (const k of ['id', 'variant', 'kind', 'q', 'answerText', 'explain']) if (!p[k]) fail(`${label}: missing ${k}`);
 const all = JSON.stringify(p);
 if (/NaN|undefined|Infinity|\[object/.test(all)) fail(`${label}: contains NaN/undefined/Infinity`);
 if (!/bm-u3-worked-steps/.test(p.explain)) fail(`${label}: no worked solution`);
 if ((p.q.match(/\\\(/g) || []).length !== (p.q.match(/\\\)/g) || []).length) fail(`${label}: unbalanced math delimiters`);
 if (p.fields) for (const f of p.fields) if (!f.labelHtml && !f.label) fail(`${label}: unlabeled field`);
}

// ---- run ----
const engines = G.list();
if (JSON.stringify(engines) !== JSON.stringify(['geometric-or-not', 'common-ratios-and-next-terms', 'finding-terms-of-geometric-sequences', 'geometric-growth-and-decay-modeling', 'section-a-review'])) fail(`engines: ${engines}`);
let generated = 0;
for (const [slug, modes] of [['geometric-or-not', [undefined]], ['common-ratios-and-next-terms', [undefined]], ['finding-terms-of-geometric-sequences', [undefined]],
 ['geometric-growth-and-decay-modeling', [undefined, 'factors', 'models']], ['section-a-review', [undefined, ...Object.keys(CHECKERS)]]]) {
 for (const mode of modes) {
  const seen = new Set(), routed = {};
  for (let i = 0; i < N; i++) {
   sandbox.window.BatchMathRNG = {random: rng(0x4d000 + i * 7919 + slug.length * 31 + (mode || '').length)};
   const p = G.get(slug)({mode}), label = `${slug}${mode ? `[${mode}]` : ''} #${i} ${p.id}`;
   generated++; seen.add(p.id); common(p, label);
   const lesson = prefix[p.id.slice(0, 6)]; routed[lesson] = (routed[lesson] || 0) + 1;
   try {CHECKERS[lesson](p, label);} catch (e) {fail(`${label}: ${e.message}`);}
   if (slug === 'geometric-growth-and-decay-modeling' && mode === 'factors' && !/^u4-01d-factor/.test(p.id)) fail(`${label}: factors mode produced ${p.id}`);
   if (slug === 'geometric-growth-and-decay-modeling' && mode === 'models' && !/^u4-01d-model/.test(p.id)) fail(`${label}: models mode produced ${p.id}`);
   if (slug === 'section-a-review' && mode && lesson !== mode) fail(`${label}: Practice Type ${mode} produced ${lesson}`);
   if (slug !== 'section-a-review' && lesson !== slug) fail(`${label}: engine produced a ${lesson} problem`);
  }
  stats[`${slug}${mode ? `[${mode}]` : ''}`] = {problems: N, distinct: seen.size, routed};
  if (seen.size < Math.min(N, 300) * .5) fail(`${slug}${mode ? `[${mode}]` : ''}: only ${seen.size} distinct problems in ${N}`);
 }
}
// the review mixes the lessons in the proportions of 01E and 01F (6 : 4 : 10 : 4)
const mix = stats['section-a-review'].routed, want = {'geometric-or-not': 6 / 24, 'common-ratios-and-next-terms': 4 / 24, 'finding-terms-of-geometric-sequences': 10 / 24, 'geometric-growth-and-decay-modeling': 4 / 24};
for (const [k, share] of Object.entries(want)) if (Math.abs((mix[k] || 0) / N - share) > .04) fail(`review mix: ${k} ${((mix[k] || 0) / N * 100).toFixed(1)}%, expected about ${(share * 100).toFixed(1)}%`);
// variety the assignments require
const need = {
 '1A': ['geometric r=2', 'geometric r=3', 'geometric r=-2', 'geometric r=1/2', 'geometric r=-1/2', 'geometric r=1/3', 'geometric r=3/2', 'not_arithmetic', 'not_one_wrong_term', 'not_quadratic', 'not_irregular'],
 '1B': ['whole ratio', 'negative whole ratio', 'fraction ratio', 'negative fraction ratio', 'fractional next terms'],
 '1C': ['first five terms', 'fraction ratio', 'negative ratio', 'fractional a_n', 'negative a_n', 'find a_n (n=4)', 'find a_n (n=8)'],
 '1D': ['factor read_factor', 'factor choose_factor', 'factor 5/4', 'factor 4/5', 'factor 2/3', 'factor 2', 'model model_up', 'model model_down', 'model model_words', 'model model_times', 'model model_fraction']
};
for (const [k, keys] of Object.entries(need)) for (const key of keys) if (!variety[k]?.[key]) fail(`${k}: no "${key}" problems`);
stats.variety = variety; stats.generated = generated; stats.gradingChecks = gradingChecks;
const report = {ok: !errors.length, generatedAt: new Date().toISOString(), problemsPerEngine: N, stats, errors};
fs.mkdirSync(path.join(ROOT, 'qa-results'), {recursive: true});
fs.writeFileSync(path.join(ROOT, 'qa-results/im1-unit4-section1-qa.json'), JSON.stringify(report, null, 1) + '\n');
console.log(['BatchMath IM1 Unit 4 Section 1 practice QA', `Result: ${report.ok ? 'PASS' : 'FAIL'}`, `Engines: ${engines.length}`, `Generated problems checked: ${generated}`,
 `Grading checks (equivalent, wrong and approximate answers): ${gradingChecks}`, ...Object.entries(variety).map(([k, v]) => `${k} varieties: ${Object.keys(v).length}`),
 `Errors: ${errors.length}`, ...errors.slice(0, 40).map(e => '- ' + e), ''].join('\n'));
if (errors.length) process.exit(1);
