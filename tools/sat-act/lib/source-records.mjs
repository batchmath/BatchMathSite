// Shared, build-time helpers for turning verified Shorts records into SAT & ACT library records.
// Mathematics, choices, explanations and solution steps are copied verbatim; nothing here
// rewrites, recomputes or paraphrases a mathematical statement.
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const RECORD_SCHEMA = 'batchmath.sat-act.problem/1';
export const CONTENT_STATUSES = new Set(['development-fixture', 'approved']);
export const LABELS = ['A', 'B', 'C', 'D'];
export const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');

export class ImportError extends Error {}
export function must(condition, message) {
  if (!condition) throw new ImportError(message);
}

// Reads a file exactly as it exists in a given commit of a local git checkout.
export function gitShow(repoDir, commit, file) {
  try {
    return execFileSync('git', ['-C', repoDir, 'show', `${commit}:${file}`], { maxBuffer: 256 * 1024 * 1024 });
  } catch (error) {
    throw new ImportError(`cannot read ${file} at ${commit} in ${repoDir}: ${String(error.stderr || error.message).trim()}`);
  }
}

export function gitResolve(repoDir, ref) {
  try {
    return execFileSync('git', ['-C', repoDir, 'rev-parse', '--verify', `${ref}^{commit}`], { encoding: 'utf8' }).trim();
  } catch (error) {
    throw new ImportError(`cannot resolve ${ref} in ${repoDir}`);
  }
}

export function gitParent(repoDir, commit) {
  const raw = execFileSync('git', ['-C', repoDir, 'cat-file', '-p', commit], { encoding: 'utf8' });
  return (raw.match(/^parent ([0-9a-f]{40})$/m) || [])[1] || '';
}

// The Shorts release code digests JSON with Python's json.dumps(sort_keys=True,
// ensure_ascii=False, allow_nan=False, separators=(',', ':')). JavaScript number
// formatting differs from Python's for floats such as 1.0, so the digest is
// reproduced with Python itself rather than approximated.
export function pythonCanonicalDigest(jsonBytes) {
  const script = [
    'import hashlib, json, sys',
    'value = json.loads(sys.stdin.buffer.read().decode("utf-8"))',
    'out = json.dumps(value, sort_keys=True, ensure_ascii=False, allow_nan=False, separators=(",", ":"))',
    'print(hashlib.sha256(out.encode()).hexdigest())'
  ].join('\n');
  try {
    return execFileSync('python3', ['-I', '-c', script], { input: jsonBytes, encoding: 'utf8' }).trim();
  } catch (error) {
    throw new ImportError('python3 is required to verify the Shorts canonical scene digest');
  }
}

// Static parse of shorts/taxonomy.py: TOPICS list and Skill(id, name, TOPICS[i], ...) entries.
export function parseShortsTaxonomy(source) {
  const topicsBlock = (source.match(/^TOPICS\s*=\s*\[([\s\S]*?)^\]/m) || [])[1];
  must(topicsBlock, 'taxonomy.py: TOPICS list not found');
  const topics = [...topicsBlock.matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const skills = {};
  for (const m of source.matchAll(/Skill\(\s*"([^"]+)",\s*"([^"]+)",\s*TOPICS\[(\d+)\]/g)) {
    const topic = topics[Number(m[3])];
    must(topic, `taxonomy.py: skill ${m[1]} refers to missing TOPICS[${m[3]}]`);
    skills[m[1]] = { id: m[1], name: m[2], topic };
  }
  must(topics.length >= 1 && Object.keys(skills).length >= 1, 'taxonomy.py: no topics or skills parsed');
  return { topics, skills };
}

// Parses the MP4 identity table of the independent audit report:
// | `record-id` | duration | `sha256` |
export function parseAuditMediaTable(markdown) {
  const out = {};
  for (const m of String(markdown).matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|\s*([0-9.]+)\s*\|\s*`([0-9a-f]{64})`\s*\|\s*$/gm)) {
    out[m[1]] = { durationSeconds: Number(m[2]), mediaSha256: m[3] };
  }
  return out;
}

function stemParts(question) {
  must(Array.isArray(question.stem) && question.stem.length, 'question.stem must be a non-empty list');
  for (const part of question.stem) {
    must(typeof part === 'string' || (part && typeof part.math === 'string'), 'question.stem parts must be text or {math}');
  }
  must(typeof question.prompt === 'string' && question.prompt.trim(), 'question.prompt is missing');
}

// Validates a verified source record before anything is imported from it.
export function validateSourceRecord(rec, expectedId) {
  const where = `record ${expectedId}`;
  must(rec && rec.id === expectedId, `${where}: id mismatch (${rec && rec.id})`);
  must(rec.status === 'verified', `${where}: status is ${rec.status}, not verified`);
  must(rec.verification && rec.verification.passed === true && rec.verification.n_failed === 0,
    `${where}: verification did not pass with zero failures`);
  must(rec.quality && rec.quality.passed === true && (rec.quality.errors || []).length === 0,
    `${where}: quality gate did not pass`);
  must(typeof rec.content_hash === 'string' && /^[0-9a-f]{16}$/.test(rec.content_hash), `${where}: content_hash missing`);
  const cls = rec.classification || {};
  must(typeof cls.topic === 'string' && cls.topic, `${where}: classification.topic missing`);
  must(Array.isArray(cls.skills) && cls.skills.length, `${where}: classification.skills missing`);
  must(Array.isArray(cls.exams) && cls.exams.length && cls.exams.every(e => e === 'SAT' || e === 'ACT'),
    `${where}: classification.exams must list SAT and/or ACT`);
  must((cls.needs_spec_check || []).length === 0, `${where}: classification still needs a specification check`);
  must(cls.format === 'multiple_choice_4', `${where}: unsupported source format ${cls.format}`);
  stemParts(rec.question || {});
  must(Array.isArray(rec.choices) && rec.choices.length === 4, `${where}: expected four choices`);
  rec.choices.forEach((c, i) => {
    must(c.label === LABELS[i], `${where}: choice ${i} label ${c.label} out of order`);
    must(typeof c.display === 'string' && c.display.trim(), `${where}: choice ${c.label} display missing`);
  });
  const answer = rec.answer || {};
  must(LABELS.includes(answer.label), `${where}: answer label missing`);
  const keyed = rec.choices.find(c => c.label === answer.label);
  must(keyed && keyed.display === answer.display, `${where}: answer display differs from its keyed choice`);
  must(keyed.note === 'Correct', `${where}: keyed choice is not marked Correct`);
  for (const c of rec.choices) {
    if ('correct' in c) must(c.correct === (c.label === answer.label), `${where}: choice ${c.label} correct flag disagrees with the key`);
    if (c.label !== answer.label) {
      must(typeof c.why === 'string' && c.why.trim(), `${where}: wrong choice ${c.label} has no explanation`);
      must(c.note !== 'Correct', `${where}: wrong choice ${c.label} is marked Correct`);
    }
  }
  const sol = rec.solution || {};
  must(Array.isArray(sol.steps) && sol.steps.length >= 2, `${where}: solution steps missing`);
  for (const step of sol.steps) {
    must(step.id && step.title && typeof step.caption === 'string', `${where}: incomplete solution step ${step.id}`);
    const lines = [...(step.lines || []), ...((step.check && step.check.lines) || [])];
    for (const line of lines) must(typeof line.tex === 'string' && line.tex.trim(), `${where}: step ${step.id} has an empty line`);
  }
  must(typeof sol.key_idea === 'string' && sol.key_idea.trim(), `${where}: key idea missing`);
  const presentation = (rec.template || {}).presentation;
  if (presentation === 'diagram') must(rec.figure && rec.figure.vertices, `${where}: diagram problem without a figure`);
  return true;
}

// Timing evidence from the exact rendered scene and narration manifest.
// explanationStartSeconds is the first whole second at or after the end of the
// on-screen thinking countdown, and must not be later than the first spoken
// explanation sentence. YouTube's embed and watch URLs accept whole seconds.
export function extractVideoTiming(scene, manifest, record) {
  const timers = [];
  const firstIns = [];
  (function walk(node) {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (!node || typeof node !== 'object') return;
    if (node.type === 'timer') timers.push(node);
    for (const a of node.anims || []) if (a && a.type === 'in' && typeof a.t === 'number') firstIns.push(a.t);
    for (const [key, value] of Object.entries(node)) if (key !== 'anims' && value && typeof value === 'object') walk(value);
  })(scene.root);
  must(timers.length === 1, `${record.id}: expected exactly one countdown timer in the scene, found ${timers.length}`);
  const timer = timers[0];
  const countdownStart = timer.t0;
  const countdownEnd = Math.round((timer.t0 + timer.d) * 1000) / 1000;
  const timerOut = (timer.anims || []).find(a => a.type === 'out');
  must(timerOut && Math.abs(timerOut.t - countdownEnd) < 0.002, `${record.id}: countdown exit does not match t0 + d`);
  const segments = [...((manifest.narration || {}).segments || [])].sort((a, b) => a.t - b.t);
  must(segments.length, `${record.id}: narration segments missing`);
  const questionPhase = segments.filter(s => s.seg === 'question' || s.seg === 'pause');
  const explanation = segments.filter(s => s.seg !== 'question' && s.seg !== 'pause');
  must(questionPhase.length && explanation.length, `${record.id}: narration lacks question or explanation segments`);
  for (const s of questionPhase) must(s.t + s.dur <= countdownEnd, `${record.id}: question narration ${s.key} runs past the countdown`);
  const firstExplanation = explanation[0];
  must(firstExplanation.seg === record.solution.steps[0].id,
    `${record.id}: first explanation segment ${firstExplanation.seg} is not the first solution step ${record.solution.steps[0].id}`);
  const solutionIn = Math.min(...firstIns.filter(t => t >= countdownEnd));
  const explanationStartSeconds = Math.ceil(countdownEnd - 1e-9);
  must(explanationStartSeconds <= firstExplanation.t,
    `${record.id}: no whole second lies between the countdown end ${countdownEnd} and the first explanation ${firstExplanation.t}`);
  must(Math.abs(scene.duration - manifest.duration) < 0.001, `${record.id}: scene and manifest durations differ`);
  return {
    explanationStartSeconds,
    rule: 'first whole second at or after the end of the thinking countdown; never after the first spoken explanation sentence',
    countdownStartSeconds: countdownStart,
    countdownSeconds: timer.d,
    countdownEndSeconds: countdownEnd,
    solutionVisualInSeconds: Math.round(solutionIn * 1000) / 1000,
    firstExplanationSegment: firstExplanation.key,
    firstExplanationNarrationSeconds: firstExplanation.t,
    sceneDurationSeconds: scene.duration
  };
}

// Builds the website record. Learner-facing content is copied verbatim from the source.
export function toWebsiteRecord({ rec, contentStatus, approval, provenance, video, taxonomy }) {
  must(CONTENT_STATUSES.has(contentStatus), `unknown content status ${contentStatus}`);
  const cls = rec.classification;
  const skillNames = {};
  for (const id of cls.skills) {
    const skill = taxonomy.skills[id];
    must(skill, `${rec.id}: skill ${id} is not defined in the Shorts taxonomy`);
    skillNames[id] = skill.name;
  }
  must(taxonomy.skills[cls.skills[0]].topic === cls.topic,
    `${rec.id}: primary skill ${cls.skills[0]} belongs to "${taxonomy.skills[cls.skills[0]].topic}", not "${cls.topic}"`);
  const pick = (obj, keys) => Object.fromEntries(keys.filter(k => obj && obj[k] !== undefined).map(k => [k, obj[k]]));
  return {
    schema: RECORD_SCHEMA,
    sourceId: rec.id,
    contentStatus,
    approval,
    provenance,
    series: rec.series,
    topicLabel: rec.topic,
    classification: cls,
    skillNames,
    difficulty: rec.difficulty || (rec.template || {}).difficulty,
    format: cls.format,
    template: pick(rec.template || {}, ['name', 'presentation', 'techniques', 'misconceptions']),
    concept: rec.concept || null,
    question: pick(rec.question, ['stem', 'prompt']),
    figure: rec.figure || null,
    rightAngle: ((rec.question || {}).spec || {}).right_angle || null,
    choices: rec.choices.map(c => ({
      label: c.label,
      display: c.display,
      correct: c.label === rec.answer.label,
      note: c.note,
      why: c.why || '',
      rationale: c.rationale || ''
    })),
    answer: pick(rec.answer, ['label', 'display']),
    solution: {
      steps: rec.solution.steps,
      keyIdea: rec.solution.key_idea,
      trap: rec.solution.trap || null,
      summary: rec.solution.summary || ''
    },
    meta: rec.meta || {},
    video
  };
}

export function stableJson(value) {
  return JSON.stringify(value, null, 2) + '\n';
}
