// IM1 Unit 4 Sections 2-4, the section reviews and the Unit 4 Comprehensive Review practice engines
// (assets/im1-unit4-generators.js): mathematics, grading, variety, explanations, keypads, Practice Types.
// Each generated problem is re-read from its visible question text and solved independently with exact BigInt
// fractions; the fields' answers must agree, and the worked solution must state them. Grading uses the site's own code
// (assets/im1-unit3-practice.js with the Unit 4 registry, and the MathLive contracts in assets/mathlive/), so a typed
// answer, a keypad answer and a MathLive answer are all checked the way the page checks them:
//   - formulas and equations are accepted in every equivalent form (a_n = 4(2)^(n-1) = 2(2)^n = 4*2^(n-1); y = (12)(1/4)^(x-1)
//     = 48(0.25)^x) and rejected when wrong (an off-by-one exponent, a swapped base, an arithmetic rule, a linear formula);
//   - numbers, first terms and solutions accept equivalent exact forms (3/2 = 1.5 = 6/4, x = 3) and reject wrong or
//     rounded ones (0.333 for 1/3); percents accept 20 or 20%; the words growth and decay are typed;
//   - "write different equations" (3G) rejects the same equation entered twice.
// No problem is multiple choice. Every field's keypad has the keys its answer needs.
// Usage: node tools/im1-unit4/sections2-4-qa.mjs [problems per engine and Practice Type, default 3000]
//        (report: qa-results/im1-unit4-sections2-4-qa.json)
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const ROOT = process.cwd(), N = +process.argv[2] || 3000, LATEX_SAMPLE = 300, errors = [], stats = {};
const fail = m => {if (errors.length < 300) errors.push(m);};
function rng(seed) {let s = seed >>> 0; return () => {s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;};}

// ---- the site's code ----
const sandbox = {window: {}, Math, console}; sandbox.window.window = sandbox.window;
sandbox.document = {addEventListener() {}, documentElement: {classList: {add() {}, toggle() {}}}, getElementById: () => null, querySelectorAll: () => []};
sandbox.window.document = sandbox.document; sandbox.window.BM_UNIT3_PRACTICE = {registry: 'BatchMathIM1Unit4Generators'};
vm.createContext(sandbox);
for (const f of ['assets/im1-unit4-generators.js', 'assets/im1-unit3-practice.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, {filename: f});
const G = sandbox.window.BatchMathIM1Unit4Generators, CHECK = sandbox.window.BatchMathIM1Unit3PracticeQA;
if (!G || !CHECK || typeof G.checkField !== 'function') throw new Error('generators or checker did not load');
globalThis.window ??= globalThis; globalThis.document ??= {addEventListener() {}, readyState: 'loading', querySelectorAll: () => []};
const {unit4Contract, unit4Keypads} = await import(pathToFileURL(path.join(ROOT, 'assets/mathlive/im1-unit4-contracts.mjs')).href);
const {unit3Keypads} = await import(pathToFileURL(path.join(ROOT, 'assets/mathlive/im1-unit3-contracts.mjs')).href);
const KEYPADS = {...unit3Keypads, ...unit4Keypads};

// ---- exact arithmetic (independent of the generators) ----
const big = n => BigInt(n), babs = a => a < 0n ? -a : a, bgcd = (a, b) => {a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a || 1n;};
function Q(n, d = 1n) {n = big(n); d = big(d); if (d === 0n) throw Error('zero denominator'); if (d < 0n) {n = -n; d = -d;} const g = bgcd(n, d); return {n: n / g, d: d / g};}
const qadd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d), qsub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const qmul = (a, b) => Q(a.n * b.n, a.d * b.d), qdiv = (a, b) => Q(a.n * b.d, a.d * b.n), qeq = (a, b) => a.n === b.n && a.d === b.d, qneg = a => Q(-a.n, a.d);
const qpow = (a, k) => {let out = Q(1); for (let i = 0; i < Math.abs(k); i++) out = qmul(out, a); return k < 0 ? qdiv(Q(1), out) : out;};
const qstr = q => q.d === 1n ? String(q.n) : `${q.n}/${q.d}`, qnum = q => Number(q.n) / Number(q.d);
const qtex = q => q.d === 1n ? String(q.n) : `${q.n < 0n ? '-' : ''}\\frac{${babs(q.n)}}{${q.d}}`;
const terminating = q => {let d = q.d; for (const p of [2n, 5n]) while (d % p === 0n) d /= p; return d === 1n;};
const qdec = q => String(qnum(q));
function parseNum(t) {
 t = String(t).replace(/\\displaystyle\s*/g, '').replace(/\\left\(|\\right\)/g, '').replace(/^\((.*)\)$/, '$1').trim();
 let m = t.match(/^(-?)\\frac\{(\d+)\}\{(\d+)\}$/); if (m) return Q((m[1] ? -1n : 1n) * big(m[2]), big(m[3]));
 m = t.match(/^(-?\d+)(?:\.(\d+))?$/); if (m) return m[2] ? Q(big(m[1] + m[2]) * (m[1].startsWith('-') ? 1n : 1n), 10n ** big(m[2].length)) : Q(big(m[1]));
 throw Error(`unreadable number ${t}`);
}
const answerOf = s => {const x = String(s); return x.includes('/') ? Q(...x.split('/').map(big)) : x.includes('.') ? parseNum(x) : Q(big(x));};
const coefOf = t => t === '' ? Q(1) : t === '-' ? Q(-1) : parseNum(t);
const maths = q => [...q.matchAll(/\\\((.*?)\\\)/g)].map(m => m[1]);
const seqFromQ = q => {const m = q.match(/\\\((.*?), \\ldots\\\)/); if (!m) throw Error('no sequence'); return m[1].replace(/\\displaystyle\s*/, '').split(/,\s*/).map(parseNum);};
const termsOf = (a1, r, k) => {const out = [a1]; while (out.length < k) out.push(qmul(out.at(-1), r)); return out;};
function parseRec(t) {const m = t.match(/^a_1=(.+?),\\ a_n=(.*?)a_\{n-1\}$/); if (!m) throw Error(`unreadable recursive formula ${t}`); return {a1: parseNum(m[1]), r: coefOf(m[2])};}
function table(q) {
 const rows = [...q.matchAll(/<tr>(.*?)<\/tr>/g)].map(m => [...m[1].matchAll(/<td>(.*?)<\/td>/g)].map(c => c[1]));
 if (rows.length !== 2) throw Error('no two-row table');
 return {periods: rows[0].map(Number), values: rows[1].map(v => parseNum(v.replace(/^\\\(|\\\)$/g, '')))};
}
const constantRatio = values => {const r = qdiv(values[1], values[0]); return values.slice(1).every((v, i) => qeq(qdiv(v, values[i]), r)) ? r : null;};
// integer k-th root of a BigInt, or null
function iroot(n, k) {if (n < 0n) return null; let lo = 0n, hi = 1n; while (hi ** big(k) < n) hi *= 2n; while (lo < hi) {const m = (lo + hi + 1n) / 2n; if (m ** big(k) <= n) lo = m; else hi = m - 1n;} return lo ** big(k) === n ? lo : null;}
// every rational r with r^k = q
function rationalRoots(q, k) {
 const sign = q.n < 0n ? -1n : 1n; if (sign < 0n && k % 2 === 0) return [];
 const a = iroot(babs(q.n), k), b = iroot(q.d, k); if (a === null || b === null) return [];
 const r = Q(sign * a, b); return k % 2 === 0 ? [r, qneg(r)] : [r];
}

// ---- grading: the page's own checks, on typed text and on MathLive LaTeX through the Unit 4 contracts ----
let gradingChecks = 0, latexChecks = 0;
const accepts = (field, raw, values = {}) => CHECK.fieldResult(raw, field, values).ok === true;
const contractOf = field => unit4Contract({dataset: {bmMathKind: field.mathKind || '', bmStructuredKind: field.check}, id: `answer-${field.id}`});
const viaLatex = (field, latex) => {const t = contractOf(field).translate(latex); return t.input ?? (latex.trim() ? '?' : '');};
function expectForms(field, label, good, bad, {latexGood = [], latexBad = [], values = {}, latex = false} = {}) {
 for (const raw of good) {gradingChecks++; if (!accepts(field, raw, values)) fail(`${label} field ${field.id}: equivalent answer "${raw}" was not accepted (${JSON.stringify(CHECK.fieldResult(raw, field, values))})`);}
 for (const raw of bad) {gradingChecks++; if (accepts(field, raw, values)) fail(`${label} field ${field.id}: wrong answer "${raw}" was accepted`);}
 if (!latex) return;
 for (const l of latexGood) {latexChecks++; const raw = viaLatex(field, l); if (!accepts(field, raw, values)) fail(`${label} field ${field.id}: MathLive answer ${l} (-> ${raw}) was not accepted`);}
 for (const l of latexBad) {latexChecks++; const raw = viaLatex(field, l); if (accepts(field, raw, values)) fail(`${label} field ${field.id}: wrong MathLive answer ${l} (-> ${raw}) was accepted`);}
}
const paren = q => `(${qstr(q)})`, ptex = q => q.d === 1n && q.n >= 0n ? qtex(q) : `\\left(${qtex(q)}\\right)`;
function gradeNumber(field, q, label, latex) {
 const good = [qstr(q), qstr(q).replace('-', '−'), ` ${qstr(q)} `], bad = [];
 if (q.d !== 1n) good.push(`${q.n * 2n}/${q.d * 2n}`);
 if (terminating(q) && q.d !== 1n) good.push(qdec(q));
 for (const w of [qadd(q, Q(1)), qneg(q), q.n ? qdiv(Q(1), q) : Q(7)]) if (!qeq(w, q)) bad.push(qstr(w));
 if (!terminating(q)) bad.push(String(Number(qnum(q).toFixed(3))));
 expectForms(field, label, good, bad, {latex, latexGood: [qtex(q)], latexBad: [qtex(qadd(q, Q(1)))]});
}
function gradeInitial(field, q, label, latex) {
 const s = qstr(q);
 expectForms(field, label, [s, `a_1=${s}`, `a1=${s}`, `a₁ = ${s}`, `a_{1}=${s}`], [qstr(qadd(q, Q(1))), `a_2=${s}`, ...(q.n ? [qstr(qneg(q))] : [])],
  {latex, latexGood: [qtex(q), `a_{1}=${qtex(q)}`, `a_1=${qtex(q)}`], latexBad: [`a_{1}=${qtex(qadd(q, Q(1)))}`]});
}
function gradeRule(field, r, label, latex) {
 const s = qstr(r), good = [`a_n=${paren(r)}a_{n-1}`, `${paren(r)}*a_{n-1}`, `aₙ=${paren(r)}aₙ₋₁`, `a_n=a_{n-1}*${paren(r)}`, `an=${paren(r)}*a(n-1)`, `a_n = ${s}a_{n-1}`];
 if (terminating(r) && r.d !== 1n) good.push(`a_n=${qdec(r)}a_{n-1}`);
 const bad = [`a_n=a_{n-1}+${paren(r)}`, `a_n=${paren(qadd(r, Q(1)))}a_{n-1}`, `a_n=${paren(qneg(r))}a_{n-1}`, s, `a_n=${paren(r)}^(n-1)`, `a_n=${paren(r)}a_n`];
 if (!qeq(qdiv(Q(1), r), r)) bad.push(`a_n=${paren(qdiv(Q(1), r))}a_{n-1}`);
 expectForms(field, label, good, bad, {latex, latexGood: [`a_{n}=${qtex(r)}a_{n-1}`, `a_n=a_{n-1}\\cdot ${ptex(r)}`, `${qtex(r)}a_{n-1}`, ...(r.d !== 1n && r.n > 0n ? [`a_n=\\frac{${r.n}a_{n-1}}{${r.d}}`] : [])],
  latexBad: [`a_{n}=a_{n-1}+${ptex(r)}`, `a_n=${ptex(qadd(r, Q(1)))}a_{n-1}`]});
}
function gradeExplicit(field, a1, r, label, latex) {
 const A = paren(a1), R = paren(r), good = [`a_n=${A}${R}^(n-1)`, `${A}*${R}^(n-1)`, `a_n=${paren(qdiv(a1, r))}${R}^n`, `f(n)=${A}(${qstr(r)})^(n-1)`, `aₙ=${paren(qmul(a1, r))}${R}^(n−2)`];
 const bad = [`a_n=${A}${R}^n`, `a_n=${A}${R}^(n+1)`, `a_n=${A}*${R}*(n-1)`, `a_n=${A}+(n-1)*${R}`, `a_n=${paren(qneg(a1))}${R}^(n-1)`, `a_n=${A}${paren(qneg(r))}^(n-1)`];
 if (!qeq(a1, r)) bad.push(`a_n=${R}${A}^(n-1)`);
 expectForms(field, label, good, [...bad, `a_n=${R}a_{n-1}`], {latex, latexGood: [`a_n=${qtex(a1)}\\left(${qtex(r)}\\right)^{n-1}`, `a_{n}=${qtex(a1)}\\cdot\\left(${qtex(r)}\\right)^{n-1}`, `${ptex(qdiv(a1, r))}\\left(${qtex(r)}\\right)^{n}`],
  latexBad: [`a_n=${qtex(a1)}\\left(${qtex(r)}\\right)^{n}`, `a_n=${qtex(a1)}+\\left(n-1\\right)\\cdot${ptex(r)}`]});
}
function exponentialForms(b, r) {
 const B = paren(b), R = paren(r), good = [`y=${B}${R}^x`, `f(x)=${B}*${R}^x`, `y=f(x)=${B}${R}^(x)`, `y=${paren(qmul(b, r))}${R}^(x-1)`, `y=${paren(qmul(b, qmul(r, r)))}${R}^(x-2)`, `y=${paren(qdiv(b, r))}${R}^(x+1)`];
 if (terminating(r) && r.d !== 1n) good.push(`y=${B}(${qdec(r)})^x`);
 const bad = [`y=${B}${R}^(x-1)`, `y=${B}+${R}x`, `y=${B}${R}x`, `y=${paren(qneg(b))}${R}^x`];
 if (!qeq(b, r)) bad.push(`y=${R}${B}^x`);
 if (!qeq(qdiv(Q(1), r), r)) bad.push(`y=${B}${paren(qdiv(Q(1), r))}^x`);
 return {good, bad, latexGood: [`y=\\left(${qtex(b)}\\right)\\left(${qtex(r)}\\right)^{x}`, `f\\left(x\\right)=${qtex(b)}\\cdot${ptex(r)}^x`, `y=f\\left(x\\right)=${ptex(qmul(b, r))}\\left(${qtex(r)}\\right)^{x-1}`],
  latexBad: [`y=\\left(${qtex(b)}\\right)\\left(${qtex(r)}\\right)^{x+1}`]};
}
function gradeExponential(field, b, r, label, latex) {const f = exponentialForms(b, r); expectForms(field, label, f.good, f.bad, {latex, latexGood: f.latexGood, latexBad: f.latexBad});}
function gradeSolution(field, x, label, latex) {
 const s = qstr(x), good = [`x=${s}`, s, `x = ${s}`, s.replace('-', '−')], bad = [qstr(qadd(x, Q(1))), `x=${qstr(qadd(x, Q(1)))}`, '', 'x='];
 if (x.n) bad.push(qstr(qneg(x)));
 if (x.d !== 1n) good.push(`${x.n * 2n}/${x.d * 2n}`);
 if (terminating(x) && x.d !== 1n) good.push(qdec(x)); else if (x.d !== 1n) bad.push(String(Number(qnum(x).toFixed(3))));
 expectForms(field, label, good, bad, {latex, latexGood: [`x=${qtex(x)}`, qtex(x)], latexBad: [`x=${qtex(qadd(x, Q(1)))}`]});
}
function gradePercent(field, p, label, latex) {
 const s = qstr(p), bad = [qdec(qdiv(p, Q(100))), qstr(qsub(Q(100), p)), qstr(qadd(Q(100), p)), qstr(qneg(p))].filter(w => !qeq(answerOf(w), p));
 expectForms(field, label, [s, `${s}%`, `${s} %`, `${s}.0`], bad, {latex, latexGood: [s, `${s}\\%`], latexBad: [qdec(qdiv(p, Q(100)))]});
}
function gradeWord(field, word, label) {
 const other = word === 'growth' ? 'decay' : 'growth';
 expectForms(field, label, [word, word.toUpperCase(), ` ${word[0].toUpperCase()}${word.slice(1)} `, word === 'growth' ? 'grows' : 'decays', `exponential ${word}`], [other, '', 'linear', word.slice(0, 3)]);
}

// ---- fields: the expected answers, the field kinds, the keypads ----
const KIND = {number: ['number', undefined, undefined], initial: ['initial-term', undefined, undefined], rule: ['recursive-rule', 'rule', 'rule'], explicit: ['formula', 'explicit', 'explicit'],
 exponential: ['line', 'exponential', 'exponential'], solution: ['number', 'solution', 'number'], percent: ['number', 'percent', 'percent'], word: ['word', 'word', undefined]};
// the keys each kind of answer needs, by keypad profile option
const NEEDS = {number: ['fraction', 'decimal'], initial: ['fraction', 'decimal', 'equality', 'op:a₁'], rule: ['fraction', 'decimal', 'equality', 'op:aₙ', 'op:aₙ₋₁'],
 explicit: ['fraction', 'decimal', 'exponent', 'parentheses', 'equality', 'op:aₙ', 'var:n'], exponential: ['fraction', 'decimal', 'exponent', 'parentheses', 'equality', 'equation', 'var:x', 'var:y'],
 solution: ['fraction', 'decimal'], percent: ['fraction', 'decimal']};
let keypadChecks = 0;
function checkKeypad(field, kind, label) {
 if (kind === 'word') return;
 const name = contractOf(field).keypad, spec = KEYPADS[name];
 if (!spec) {fail(`${label} field ${field.id}: no keypad profile ${name}`); return;}
 for (const need of NEEDS[kind]) {
  keypadChecks++;
  const [what, key] = need.split(':'), ok = what === 'op' ? spec.operators?.some(([l]) => l === key) : what === 'var' ? spec.variables?.includes(key) : spec[what] === true;
  if (!ok) fail(`${label} field ${field.id}: keypad ${name} lacks ${need}`);
 }
 if (spec.signed === false) fail(`${label} field ${field.id}: keypad ${name} has no minus key`);
}
// spec: field id -> [kind, expected value(s)]
function expectFields(p, label, spec, gradeLatex) {
 const ids = p.fields?.map(f => f.id) || [];
 if (JSON.stringify(ids) !== JSON.stringify(Object.keys(spec))) {fail(`${label}: fields ${ids.join(',')}, expected ${Object.keys(spec).join(',')}`); return;}
 for (const f of p.fields) {
  const [kind, want] = spec[f.id], [check, custom, mathKind] = KIND[kind];
  if (f.check !== check || f.custom !== custom || f.mathKind !== mathKind) fail(`${label} field ${f.id}: kind ${f.check}/${f.custom}/${f.mathKind}, expected ${check}/${custom}/${mathKind}`);
  if (!f.labelHtml && !f.label) fail(`${label} field ${f.id}: no label`);
  if (!f.answerText) fail(`${label} field ${f.id}: no answer text`);
  checkKeypad(f, kind, label);
  try {
   if (kind === 'number' || kind === 'initial' || kind === 'solution' || kind === 'percent') {if (!qeq(answerOf(f.answer), want)) fail(`${label} field ${f.id}: answer ${f.answer}, expected ${qstr(want)}`);}
   else if (kind === 'rule') {if (!qeq(answerOf(f.ratio), want)) fail(`${label} field ${f.id}: rule ratio ${f.ratio}, expected ${qstr(want)}`);}
   else if (kind === 'explicit') {if (!qeq(answerOf(f.a1), want[0]) || !qeq(answerOf(f.ratio), want[1])) fail(`${label} field ${f.id}: a1=${f.a1}, r=${f.ratio}, expected ${qstr(want[0])}, ${qstr(want[1])}`);}
   else if (kind === 'exponential') {if (!qeq(answerOf(f.b), want[0]) || !qeq(answerOf(f.ratio), want[1])) fail(`${label} field ${f.id}: b=${f.b}, r=${f.ratio}, expected ${qstr(want[0])}, ${qstr(want[1])}`);}
   else if (kind === 'word' && f.answer !== want) fail(`${label} field ${f.id}: ${f.answer}, expected ${want}`);
  } catch (e) {fail(`${label} field ${f.id}: ${e.message}`);}
  const grade = {number: gradeNumber, initial: gradeInitial, solution: gradeSolution, percent: gradePercent}[kind];
  if (grade) grade(f, want, label, gradeLatex);
  else if (kind === 'rule') gradeRule(f, want, label, gradeLatex);
  else if (kind === 'explicit') gradeExplicit(f, want[0], want[1], label, gradeLatex);
  else if (kind === 'exponential' && !f.distinctFrom) gradeExponential(f, want[0], want[1], label, gradeLatex);
  else if (kind === 'word') gradeWord(f, want, label);
 }
}
// the worked solution states this problem's own values
function explainHas(p, label, items) {for (const item of items) if (!p.explain.includes(item)) fail(`${label}: the worked solution does not state ${item}`);}
const explicitTex = (a1, r, e = 'n-1') => `a_n=${qtex(a1)}\\left(${qtex(r)}\\right)^{${e}}`;
const ruleTex = (r, dec) => `a_n=${r.d === 1n ? String(r.n) : dec ? qdec(r) : qtex(r)}a_{n-1}`;

// ---- independent solvers ----
const variety = {}, note = (k, v) => {variety[k] ??= {}; variety[k][v] = (variety[k][v] || 0) + 1;};
const ratioKind = r => `${r.n < 0n ? 'negative ' : ''}${r.d === 1n ? 'whole' : babs(r.n) === 1n ? 'unit fraction' : 'fraction'} ratio`;
function check2A(p, L, latex) {
 const terms = seqFromQ(p.q), r = constantRatio(terms);
 if (!r || terms.length !== 4) {fail(`${L}: four terms of a geometric sequence expected`); return;}
 expectFields(p, L, {a1: ['initial', terms[0]], rule: ['rule', r]}, latex);
 explainHas(p, L, [`a_1=${qtex(terms[0])}`, `r=${qtex(r)}`, ruleTex(r)]);
 note('2A', ratioKind(r)); if (terms.some(t => t.d !== 1n)) note('2A', 'fractional terms'); if (terms[0].n < 0n) note('2A', 'negative first term');
}
function check2B(p, L, latex) {
 const m = maths(p.q);
 if (p.variant === 'from_given_term') {
  const r = coefOf(m[0].match(/^a_n=(.*?)a_\{n-1\}$/)[1]), [, k, v] = m[1].match(/^a_\{(\d+)\}=(.+)$/), am = parseNum(v), asked = m.slice(2).map(t => +t.match(/^a_\{(\d+)\}$/)[1]);
  if (asked.join() !== `${+k + 1},${+k + 2}`) fail(`${L}: asks for ${asked}, expected the next two terms after a_${k}`);
  expectFields(p, L, {[`term-${+k + 1}`]: ['number', qmul(am, r)], [`term-${+k + 2}`]: ['number', qmul(qmul(am, r), r)]}, latex);
  explainHas(p, L, [qtex(qmul(am, r)), qtex(qmul(qmul(am, r), r))]); note('2B', 'from_given_term'); return;
 }
 const {a1, r} = parseRec(m[0]);
 if (/first (\d) terms/.test(p.q)) {
  const k = +p.q.match(/first (\d) terms/)[1], want = termsOf(a1, r, k);
  expectFields(p, L, Object.fromEntries(want.map((t, i) => [`term-${i + 1}`, ['number', t]])), latex);
  explainHas(p, L, want.map(qtex)); note('2B', `first ${k} terms`); if (want.some(t => t.d !== 1n)) note('2B', 'fractional terms');
 } else {
  const [i, j] = m.slice(1).map(t => +t.match(/^a_\{(\d+)\}$/)[1]), want = termsOf(a1, r, j);
  expectFields(p, L, {[`term-${i}`]: ['number', want[i - 1]], [`term-${j}`]: ['number', want[j - 1]]}, latex);
  explainHas(p, L, [`${`a_{${i}}`}=${qtex(want[i - 1])}`, `a_{${j}}=${qtex(want[j - 1])}`]); note('2B', 'requested_terms');
 }
 note('2B', ratioKind(r));
}
// rates in words, read independently
function rateOf(text) {
 let m = text.match(/increases by (\d+)%/); if (m) return Q(100 + +m[1], 100);
 m = text.match(/(?:decreases by|loses) (\d+)%/); if (m) return Q(100 - +m[1], 100);
 for (const [re, r] of [[/\bdoubles\b/, Q(2)], [/\btriples\b/, Q(3)], [/\bquadruples\b/, Q(4)], [/is cut in half/, Q(1, 2)], [/one third of it remains/, Q(1, 3)], [/loses one fourth of it/, Q(3, 4)]]) if (re.test(text)) return r;
 throw Error(`no rate in "${text}"`);
}
function check2C(p, L, latex) {
 if (p.variant === 'table') {
  const {periods, values} = table(p.q), r = constantRatio(values);
  if (!r || periods.join() !== '1,2,3,4' || values.some(v => v.d !== 1n || v.n <= 0n)) {fail(`${L}: the table must show periods 1-4 and positive whole values of a geometric sequence`); return;}
  expectFields(p, L, {ratio: ['number', r], a1: ['initial', values[0]], rule: ['rule', r]}, latex);
  explainHas(p, L, [`a_1=${values[0].n}`]); note('2C', `table ${qnum(r) > 1 ? 'growth' : 'decay'}`); if (r.d !== 1n && terminating(r) && r.d <= 10n && r.n !== 1n) note('2C', 'table decimal ratio'); return;
 }
 if (p.variant === 'formula_terms') {
  const {a1, r} = parseRec(maths(p.q)[0]), want = termsOf(a1, r, 5);
  expectFields(p, L, {ratio: ['number', r], ...Object.fromEntries(want.map((t, i) => [`term-${i + 1}`, ['number', t]]))}, latex);
  explainHas(p, L, want.map(qtex)); note('2C', 'formula_terms'); return;
 }
 const text = p.q, a1 = Q(big(text.match(/^A .+? (?:has|is worth|contains) \$?(\d+)/)[1])), r = rateOf(text), spec = {a1: ['initial', a1], rule: ['rule', r]};
 if (!/at the end of (?:hour|day|year) 1\b|in level 1\b/.test(text)) fail(`${L}: the first term must be the end of period 1 (or level 1)`);
 const at = text.match(/Then find .+? (?:at the end of \w+|in level) (\d+)\./);
 if (at) {const want = termsOf(a1, r, +at[1]).at(-1); if (want.d !== 1n || want.n <= 0n) fail(`${L}: value ${qstr(want)} must be a positive whole number`); spec.value = ['number', want]; note('2C', 'context value');}
 expectFields(p, L, spec, latex);
 explainHas(p, L, [`a_1=${a1.n}`]); note('2C', /%/.test(text) ? (qnum(r) > 1 ? 'context percent increase' : 'context percent decrease') : /remains|loses one/.test(text) ? 'context fraction remains' : 'context multiplying word');
}
function check3A(p, L, latex) {
 const terms = seqFromQ(p.q), r = constantRatio(terms), a1 = terms[0], spec = {formula: ['explicit', [a1, r]]};
 const k = p.q.match(/find \\\(a_\{(\d+)\}\\\)/)?.[1];
 if (k) {spec.term = ['number', qmul(a1, qpow(r, +k - 1))]; note('3A', 'formula and term');}
 expectFields(p, L, spec, latex);
 explainHas(p, L, [explicitTex(a1, r), ...(k ? [qtex(spec.term[1])] : [])]); note('3A', ratioKind(r));
}
function check3B(p, L, latex) {
 const {a1, r} = parseRec(maths(p.q)[0]), spec = {formula: ['explicit', [a1, r]]}, k = p.q.match(/find \\\(a_\{(\d+)\}\\\)/)?.[1];
 if (k) {spec.term = ['number', qmul(a1, qpow(r, +k - 1))]; note('3B', 'convert and term');}
 expectFields(p, L, spec, latex);
 explainHas(p, L, [explicitTex(a1, r), ...(k ? [qtex(spec.term[1])] : [])]); note('3B', ratioKind(r));
}
function check3C(p, L, latex) {
 const m = maths(p.q)[0].match(/^a_n=(.+?)\\left\((.+?)\\right\)\^\{(n-1|n)\}$/), c = parseNum(m[1]), r = parseNum(m[2]), a1 = m[3] === 'n' ? qmul(c, r) : c;
 expectFields(p, L, {a1: ['initial', a1], rule: ['rule', r]}, latex);
 explainHas(p, L, [`a_1=${qtex(a1)}`, ruleTex(r)]); note('3C', m[3] === 'n' ? 'exponent n (a1 is not the coefficient)' : 'exponent n-1'); note('3C', ratioKind(r));
}
function check3D(p, L, latex) {
 if (p.variant === 'table') {
  const {periods, values} = table(p.q), r = constantRatio(values), m = +p.q.match(/find the value at \w+ (\d+)\./)[1], a1 = values[0];
  if (!r || periods.join() !== '1,2,3,4') {fail(`${L}: table of periods 1-4 expected`); return;}
  const value = qmul(a1, qpow(r, m - 1));
  expectFields(p, L, {ratio: ['number', r], formula: ['explicit', [a1, r]], value: ['number', value]}, latex);
  explainHas(p, L, [explicitTex(a1, r), qtex(value)]); note('3D', 'table'); return;
 }
 const [first, second] = maths(p.q).map(t => t.match(/^a_\{(\d+)\}=(.+)$/)).filter(Boolean), m = +first[1], n2 = +second[1], am = parseNum(first[2]), an2 = parseNum(second[2]);
 const gap = n2 - m, sign = p.q.match(/with a (positive|negative) common ratio/)?.[1];
 let roots = rationalRoots(qdiv(an2, am), gap);
 if (sign) roots = roots.filter(x => (x.n > 0n) === (sign === 'positive'));
 if (roots.length !== 1) {fail(`${L}: ${roots.length} possible common ratios (gap ${gap}${sign ? `, ${sign}` : ''}); the problem must have exactly one`); return;}
 if (gap % 2 === 0 && !sign) fail(`${L}: an even gap needs the sign of the ratio stated`);
 const r = roots[0], a1 = qdiv(am, qpow(r, m - 1));
 expectFields(p, L, {ratio: ['number', r], formula: ['explicit', [a1, r]]}, latex);
 explainHas(p, L, [`r=${qtex(r)}`, explicitTex(a1, r)]);
 note('3D', gap % 2 ? 'odd gap' : `even gap, ${sign} ratio`); if (a1.d !== 1n) note('3D', 'fractional a1'); if (r.n < 0n) note('3D', 'negative ratio');
}
function check3E(p, L, latex) {
 if (p.variant === 'identify') {
  const [, b, r] = maths(p.q)[0].match(/^y=\((\d+)\)\(([\d.]+)\)\^\{x\}$/), B = Q(big(b)), R = parseNum(r), growth = qnum(R) > 1, pct = qmul(qsub(R, Q(1)), Q(growth ? 100 : -100));
  if (pct.d !== 1n) fail(`${L}: percent ${qstr(pct)} is not whole`);
  expectFields(p, L, {intercept: ['number', B], ratio: ['number', R], percent: ['percent', pct], type: ['word', growth ? 'growth' : 'decay']}, latex);
  explainHas(p, L, [`${pct.n}% ${growth ? 'growth' : 'decay'}`]); note('3E', `identify ${growth ? 'growth' : 'decay'}`); return;
 }
 const b = Q(big(p.q.match(/^A [a-z ]+? (?:has|is worth|contains|is) (\d+)\b/)[1])), r = rateOf(p.q), k = +p.q.match(/What is .+? after (\d+) \w+\?$/)[1], value = qmul(b, qpow(r, k));
 if (!terminating(value)) fail(`${L}: value ${qstr(value)} is not exact as a decimal`);
 if (/organisms|cells|points/.test(p.q) && value.d !== 1n) fail(`${L}: a count must be whole (${qstr(value)})`);
 if (/dollars/.test(p.q) && 100n % value.d !== 0n) fail(`${L}: money must be whole cents (${qstr(value)})`);
 expectFields(p, L, {equation: ['exponential', [b, r]], value: ['number', value]}, latex);
 explainHas(p, L, [qdec(value)]); note('3E', `context ${qnum(r) > 1 ? 'growth' : 'decay'}`); if (value.d !== 1n) note('3E', 'decimal value'); if (/dollars/.test(p.q)) note('3E', 'money');
}
function check3F(p, L, latex) {
 let b, r;
 if (p.variant === 'table') {
  const t = table(p.q); if (t.periods.join() !== '0,1,2,3') fail(`${L}: the table must start at x = 0`);
  b = t.values[0]; r = constantRatio(t.values); if (!r) {fail(`${L}: table values are not exponential`); return;}
  expectFields(p, L, {intercept: ['number', b], ratio: ['number', r], equation: ['exponential', [b, r]]}, latex);
 } else {
  const given = p.q.match(/intercept is \\\((.+?)\\\) and the common ratio is \\\((.+?)\\\)/), point = p.q.match(/common ratio \\\((.+?)\\\) and passes through the point \\\(\(0,\\ (.+?)\)\\\)/);
  if (given) {b = parseNum(given[1]); r = parseNum(given[2]);} else {r = parseNum(point[1]); b = parseNum(point[2]);}
  expectFields(p, L, {equation: ['exponential', [b, r]]}, latex);
 }
 if (qnum(r) <= 0) fail(`${L}: the common ratio of an exponential function must be positive`);
 explainHas(p, L, [`\\left(${qtex(b)}\\right)\\left(${qtex(r)}\\right)^{x}`]);
 note('3F', p.variant === 'table' ? 'table' : p.variant === 'point_on_y_axis' ? 'point (0, b)' : 'given'); if (b.n < 0n) note('3F', 'negative intercept'); if (b.d !== 1n) note('3F', 'fractional intercept'); if (r.d !== 1n) note('3F', 'fraction ratio');
}
let distinctChecks = 0;
function check3G(p, L, latex) {
 const m = p.q.match(/Point: \\\(\((\d+),\\ (.+?)\)\\\); common ratio \\\((.+?)\\\)\. Write (two|three) different/), h = +m[1], k = parseNum(m[2]), r = parseNum(m[3]), count = m[4] === 'two' ? 2 : 3, b = qdiv(k, qpow(r, h));
 expectFields(p, L, Object.fromEntries([...Array(count)].map((_, i) => [`eq-${i + 1}`, ['exponential', [b, r]]])), latex);
 if (p.fields.length !== count) return;
 // the complete correct response is accepted as a set; the same equation twice is not; equivalent different forms are
 const answers = p.fields.map(f => f.answerText.replace(/^\\\(|\\\)$/g, '')), raw = Object.fromEntries(p.fields.map((f, i) => [f.id, viaLatex(f, answers[i])]));
 p.fields.forEach((f, i) => {distinctChecks++; if (!accepts(f, raw[f.id], raw)) fail(`${L}: ${f.id} "${answers[i]}" not accepted with the other answers`);});
 const forms = exponentialForms(b, r).good, dup = {...raw, 'eq-2': raw['eq-1']};
 distinctChecks++; if (accepts(p.fields[1], dup['eq-2'], dup)) fail(`${L}: the same equation twice was accepted`);
 const dupSpaced = {...raw, 'eq-2': ` ${raw['eq-1']} `.replace(/\*/g, '')};
 distinctChecks++; if (accepts(p.fields[1], dupSpaced['eq-2'], dupSpaced)) fail(`${L}: the same equation, respaced, was accepted twice`);
 const different = {'eq-1': forms[0], 'eq-2': forms[3], 'eq-3': forms[5]};
 p.fields.forEach(f => {distinctChecks++; if (!accepts(f, different[f.id], different)) fail(`${L}: different equivalent equation ${different[f.id]} not accepted for ${f.id}`);});
 for (const f of p.fields) {const forms2 = exponentialForms(b, r); expectForms(f, L, [], forms2.bad, {latex, latexBad: forms2.latexBad});}
 explainHas(p, L, [`=${qtex(b)}\\)`]);
 note('3G', `${count} equations`); note('3G', `point x=${h}`); if (k.d !== 1n) note('3G', 'fractional point value'); if (k.n < 0n) note('3G', 'negative point value'); if (r.d !== 1n) note('3G', 'fraction ratio');
}
// exponents: "x", "3x-1", "-x+2"
function linear(e) {const m = e.match(/^(-?\d*)x([+-]\d+)?$/); if (!m) throw Error(`unreadable exponent ${e}`); return {m: m[1] === '' ? 1n : m[1] === '-' ? -1n : big(m[1]), c: big(m[2] || 0)};}
function exponentOf(base, value) {for (let k = -14; k <= 14; k++) if (qeq(qpow(Q(base), k), value)) return k; return null;}
function check4(p, L, latex, lesson) {
 const t = maths(p.q)[0];
 let x, b;
 if (lesson === '4C') {
  const m = t.match(/^(.+?)\\cdot (\d+)\^\{(.+?)\}=(.+)$/), a = parseNum(m[1]); b = big(m[2]);
  const {m: mm, c} = linear(m[3]), k = exponentOf(b, qdiv(parseNum(m[4]), a));
  if (k === null) {fail(`${L}: ${m[4]} / ${m[1]} is not a power of ${b}`); return;}
  x = Q(big(k) - c, mm); note('4C', a.d === 1n ? 'whole coefficient' : 'fraction coefficient'); if (k < 0) note('4C', 'negative exponent'); if (m[3] !== 'x') note('4C', `exponent ${m[3].replace(/\d+/g, 'k')}`);
 } else {
  const m = t.match(/^(\d+)\^\{(.+?)\}=(.+)$/); b = big(m[1]);
  const right = m[3].match(/^(\d+)\^\{(.+?)\}$/);
  if (right) {
   if (right[1] !== m[1]) fail(`${L}: different bases`);
   const l1 = linear(m[2]), l2 = linear(right[2]); if (l1.m === l2.m) {fail(`${L}: no single solution`); return;}
   x = Q(l2.c - l1.c, l1.m - l2.m); note(lesson, 'both sides');
  } else {
   const {m: mm, c} = linear(m[2]), k = exponentOf(b, parseNum(m[3]));
   if (k === null) {fail(`${L}: ${m[3]} is not a power of ${b}`); return;}
   if (lesson === '4A' && m[2] !== 'x') fail(`${L}: 4A exponents are x`);
   x = Q(big(k) - c, mm); note(lesson, k < 0 ? 'reciprocal (negative power)' : k === 0 ? 'equals 1' : 'power');
  }
 }
 expectFields(p, L, {x: ['solution', x]}, latex);
 explainHas(p, L, [`x=${qtex(x)}`]);
 if (x.d !== 1n) note(lesson, 'fractional solution'); if (x.n < 0n) note(lesson, 'negative solution'); if (x.n === 0n) note(lesson, 'zero solution');
}
const CHECKERS = {'u4-02a': check2A, 'u4-02b': check2B, 'u4-02c': check2C, 'u4-03a': check3A, 'u4-03b': check3B, 'u4-03c': check3C, 'u4-03d': check3D, 'u4-03e': check3E, 'u4-03f': check3F, 'u4-03g': check3G,
 'u4-04a': (p, L, l) => check4(p, L, l, '4A'), 'u4-04b': (p, L, l) => check4(p, L, l, '4B'), 'u4-04c': (p, L, l) => check4(p, L, l, '4C')};
const LESSON_OF = Object.fromEntries([...G.sections.b, ...G.sections.c, ...G.sections.d].map((slug, i) => [slug, Object.keys(CHECKERS)[i]]));
const SECTION_OF_PREFIX = p => ({'u4-01': 'section-1', 'u4-02': 'section-2', 'u4-03': 'section-3', 'u4-04': 'section-4'})[p.slice(0, 5)];

function common(p, label) {
 for (const k of ['id', 'variant', 'kind', 'q', 'answerText', 'explain']) if (!p[k]) fail(`${label}: missing ${k}`);
 if (/NaN|undefined|Infinity|\[object/.test(JSON.stringify(p))) fail(`${label}: contains NaN/undefined/Infinity`);
 if (!/bm-u3-worked-steps/.test(p.explain)) fail(`${label}: no worked solution`);
 for (const s of [p.q, p.explain, p.answerText]) if ((s.match(/\\\(/g) || []).length !== (s.match(/\\\)/g) || []).length) fail(`${label}: unbalanced math delimiters`);
 const isYesNo = p.kind === 'arithmetic-identification' && p.choices?.join() === 'Yes,No';
 if (p.kind === 'mc' || (p.choices && !isYesNo)) fail(`${label}: multiple choice`);
 if (isYesNo && !/^u4-01a/.test(p.id)) fail(`${label}: a Yes/No problem outside 1A`);
}

// ---- run ----
const SECTIONS = {b: G.sections.b, c: G.sections.c, d: G.sections.d};
if (JSON.stringify(G.reviews) !== JSON.stringify({a: 'section-a-review', b: 'section-b-review', c: 'section-c-review', d: 'section-d-review', unit: 'comprehensive-review'})) fail(`review engines: ${JSON.stringify(G.reviews)}`);
const expected = [...G.sections.a, ...SECTIONS.b, ...SECTIONS.c, ...SECTIONS.d, 'section-a-review', 'section-b-review', 'section-c-review', 'section-d-review', 'comprehensive-review'];
if (JSON.stringify([...G.list()].sort()) !== JSON.stringify([...expected].sort())) fail(`engines: ${G.list()}`);
if (SECTIONS.b.length !== 3 || SECTIONS.c.length !== 7 || SECTIONS.d.length !== 3) fail('Sections 2-4 must have 3, 7 and 3 lessons');
const runs = [
 ...[...SECTIONS.b, ...SECTIONS.c, ...SECTIONS.d].map(slug => [slug, [undefined]]),
 ...Object.entries(SECTIONS).map(([key, lessons]) => [G.reviews[key], [undefined, ...lessons]]),
 ['comprehensive-review', [undefined, 'section-1', 'section-2', 'section-3', 'section-4']]
];
let generated = 0;
for (const [slug, modes] of runs) {
 for (const mode of modes) {
  const seen = new Set(), routed = {}, key = `${slug}${mode ? `[${mode}]` : ''}`;
  for (let i = 0; i < N; i++) {
   sandbox.window.BatchMathRNG = {random: rng(0x4d200 + i * 7919 + slug.length * 131 + (mode || '').length * 17)};
   const p = G.get(slug)({mode}), label = `${key} #${i} ${p.id}`;
   generated++; seen.add(p.id); common(p, label);
   const prefix = p.id.slice(0, 6), lessonRoute = Object.keys(LESSON_OF).find(s => LESSON_OF[s] === prefix);
   routed[slug === 'comprehensive-review' ? SECTION_OF_PREFIX(p.id) : prefix] = (routed[slug === 'comprehensive-review' ? SECTION_OF_PREFIX(p.id) : prefix] || 0) + 1;
   if (slug === 'comprehensive-review') {if (mode && SECTION_OF_PREFIX(p.id) !== mode) fail(`${label}: Practice Type ${mode} produced ${p.id}`);}
   else if (G.reviews.b === slug || G.reviews.c === slug || G.reviews.d === slug) {const sec = Object.keys(SECTIONS).find(k => G.reviews[k] === slug); if (!SECTIONS[sec].includes(lessonRoute)) fail(`${label}: the ${slug} engine produced ${p.id}`); if (mode && lessonRoute !== mode) fail(`${label}: Practice Type ${mode} produced ${p.id}`);}
   else if (lessonRoute !== slug) fail(`${label}: the ${slug} engine produced ${p.id}`);
   if (p.kind !== 'multi' && !/^u4-01/.test(p.id)) fail(`${label}: Sections 2-4 problems must be typed`);
   const checker = CHECKERS[prefix];
   if (checker) {try {checker(p, label, i < LATEX_SAMPLE);} catch (e) {fail(`${label}: ${e.message}`);}}
  }
  stats[key] = {problems: N, distinct: seen.size, routed};
  // 4A has about 100 possible equations (b^x = b^k or 1/b^k within the assignments' powers), so it must reach nearly all of them
  const basic = [slug, mode].includes('solving-basic-exponential-equations'), least = basic ? Math.min(N, 85) : Math.min(N, 300) * .5;
  if (seen.size < least) fail(`${key}: only ${seen.size} distinct problems in ${N}`);
 }
}
// review mixes: 02D 8:8:8, 03H 4:4:4:4:5:5:6, 04D 8:12:8; the unit review 12:12:19:12 (05A, 05B)
const shares = (routed, weights) => {const total = weights.reduce((s, [, w]) => s + w, 0); for (const [k, w] of weights) if (Math.abs((routed[k] || 0) / N - w / total) > .03) fail(`mix: ${k} ${((routed[k] || 0) / N * 100).toFixed(1)}%, expected about ${(w / total * 100).toFixed(1)}%`);};
shares(stats['section-b-review'].routed, [['u4-02a', 8], ['u4-02b', 8], ['u4-02c', 8]]);
shares(stats['section-c-review'].routed, [['u4-03a', 4], ['u4-03b', 4], ['u4-03c', 4], ['u4-03d', 4], ['u4-03e', 5], ['u4-03f', 5], ['u4-03g', 6]]);
shares(stats['section-d-review'].routed, [['u4-04a', 8], ['u4-04b', 12], ['u4-04c', 8]]);
shares(stats['comprehensive-review'].routed, [['section-1', 12], ['section-2', 12], ['section-3', 19], ['section-4', 12]]);
// variety the assignments require
const need = {
 '2A': ['whole ratio', 'negative whole ratio', 'unit fraction ratio', 'negative unit fraction ratio', 'fraction ratio', 'negative fraction ratio', 'fractional terms', 'negative first term'],
 '2B': ['first 4 terms', 'first 5 terms', 'first 6 terms', 'requested_terms', 'from_given_term', 'fractional terms', 'negative whole ratio', 'fraction ratio'],
 '2C': ['table growth', 'table decay', 'table decimal ratio', 'context percent increase', 'context percent decrease', 'context multiplying word', 'context fraction remains', 'context value', 'formula_terms'],
 '3A': ['whole ratio', 'negative whole ratio', 'unit fraction ratio', 'negative unit fraction ratio', 'fraction ratio', 'formula and term'],
 '3B': ['whole ratio', 'negative unit fraction ratio', 'fraction ratio', 'convert and term'],
 '3C': ['exponent n-1', 'exponent n (a1 is not the coefficient)', 'negative whole ratio', 'fraction ratio'],
 '3D': ['table', 'odd gap', 'even gap, positive ratio', 'even gap, negative ratio', 'fractional a1', 'negative ratio'],
 '3E': ['identify growth', 'identify decay', 'context growth', 'context decay', 'decimal value', 'money'],
 '3F': ['given', 'point (0, b)', 'table', 'negative intercept', 'fractional intercept', 'fraction ratio'],
 '3G': ['2 equations', '3 equations', 'point x=1', 'point x=2', 'point x=3', 'point x=4', 'fractional point value', 'negative point value', 'fraction ratio'],
 '4A': ['power', 'reciprocal (negative power)', 'equals 1', 'negative solution', 'zero solution'],
 '4B': ['power', 'reciprocal (negative power)', 'both sides', 'fractional solution', 'negative solution'],
 '4C': ['whole coefficient', 'fraction coefficient', 'negative exponent', 'exponent x+k', 'exponent x-k', 'exponent kx']
};
for (const [k, keys] of Object.entries(need)) for (const v of keys) if (!variety[k]?.[v]) fail(`${k}: no "${v}" problems`);
stats.variety = variety; stats.generated = generated; stats.gradingChecks = gradingChecks; stats.mathLiveChecks = latexChecks; stats.keypadChecks = keypadChecks; stats.distinctEquationChecks = distinctChecks;
const report = {ok: !errors.length, generatedAt: new Date().toISOString(), problemsPerEngineAndPracticeType: N, stats, errors};
fs.mkdirSync(path.join(ROOT, 'qa-results'), {recursive: true});
fs.writeFileSync(path.join(ROOT, 'qa-results/im1-unit4-sections2-4-qa.json'), JSON.stringify(report, null, 1) + '\n');
console.log(['BatchMath IM1 Unit 4 Sections 2-4 and review practice QA', `Result: ${report.ok ? 'PASS' : 'FAIL'}`, `Engines: ${G.list().length - 5} checked here (+ 5 Section 1 engines in section1-qa.mjs)`,
 `Engine and Practice Type runs: ${Object.keys(stats).filter(k => stats[k]?.problems).length}`, `Generated problems checked: ${generated}`,
 `Grading checks (typed equivalent and wrong answers): ${gradingChecks}`, `MathLive-LaTeX grading checks: ${latexChecks}`, `"Different equations" checks: ${distinctChecks}`, `Keypad checks: ${keypadChecks}`,
 'Multiple-choice problems: none', ...Object.entries(variety).map(([k, v]) => `${k} varieties: ${Object.keys(v).length}`), `Errors: ${errors.length}`, ...errors.slice(0, 40).map(e => '- ' + e), ''].join('\n'));
if (errors.length) process.exit(1);
