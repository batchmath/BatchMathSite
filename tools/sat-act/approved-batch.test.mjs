import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { planImport } from './stage-approved-batch.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const config = path.join(root, 'tools/sat-act/config');
const siteRegistry = JSON.parse(fs.readFileSync(path.join(config, 'registry.json'), 'utf8'));
const registry = { ...siteRegistry, problems: siteRegistry.problems.slice(0, 5) };
const sha = 'a'.repeat(40);
const batch = items => ({ schema: 'batchmath.shorts.approved-export/1',
  source: { repository: 'batchmath/Shorts', commit: sha, taxonomy: `TOPICS = [\n"Coordinates"\n]\nSkill("test-skill", "Test Skill", TOPICS[0])` }, items });

function item(id, revise = value => value) {
  const record = revise({ id, topic: 'Linear equation test', series: 'QA', difficulty: 'medium',
    classification: { topic: 'Coordinates', skills: ['test-skill'], exams: ['SAT'], format: 'multiple_choice_4' },
    question: { stem: ['Solve $2x+1=7$.'], prompt: 'What is $x$?' },
    choices: [2, 3, 4, 7].map((value, i) => ({ label: 'ABCD'[i], display: `$${value}$`, note: value === 3 ? 'Correct' : 'Distractor', why: 'Check by substitution.' })),
    answer: { label: 'B', display: '$3$' },
    solution: { steps: [{ id: 'subtract', title: 'Subtract one', caption: 'This gives $2x=6$.' },
      { id: 'divide', title: 'Divide by two', caption: 'The solution is $x=3$.' }], key_idea: 'Isolate $x$.' } });
  const contentHash = execFileSync('python3', ['-I', '-c', 'import hashlib,json,sys; print(hashlib.sha256(json.dumps(json.load(sys.stdin),sort_keys=True,ensure_ascii=False).encode()).hexdigest()[:16])'],
    { input: JSON.stringify(record), encoding: 'utf8' }).trim();
  return { recordJson: JSON.stringify({ ...record, status: 'verified', content_hash: contentHash,
      verification: { passed: true, n_checks: 5, n_failed: 0 }, quality: { passed: true, errors: [] } }),
    text: { decision: 'approved', releaseEligible: true, reviewer: 'Fixture only', approvedRevision: 'a'.repeat(32),
      contentHash, decidedAt: '2026-11-24T14:00:00Z' } };
}

const initialIds = registry.problems.map(p => p.sourceId);

test('five append-only numbers are deterministic, and reruns skip all registered IDs', () => {
  const input = batch([5, 3, 1, 4, 2].map(i => item(`qa-test-s000${i}`)).concat(item(initialIds[0])));
  const first = planImport(input, registry);
  assert.deepEqual(first.additions.map(p => [p.number, p.slug]), [6, 7, 8, 9, 10].map((n, i) => [n, `${String(n).padStart(3, '0')}-qa-test-s000${i + 1}`]));
  assert.deepEqual(first.registry.problems.slice(0, initialIds.length), registry.problems);
  assert.deepEqual(first.skipped, [initialIds[0]]);
  assert.ok(first.records.every(p => p.contentStatus === 'approved' && p.video === null && !JSON.stringify(p).includes('Fixture only')));
  const repeat = planImport(input, first.registry);
  assert.equal(repeat.additions.length, 0);
  assert.equal(repeat.skipped.length, 6);
});

test('registry retains retired IDs and can extend beyond #999', () => {
  const retired = { number: 999, sourceId: 'retired-test', slug: '999-retired-test', status: 'retired' };
  const result = planImport(batch([item(retired.sourceId), item('new-test')]), { ...registry, problems: [...registry.problems, retired] });
  assert.deepEqual(result.skipped, [retired.sourceId]);
  assert.deepEqual(result.additions.map(p => p.slug), ['1000-new-test']);
  assert.deepEqual(result.registry.problems[initialIds.length], retired);
});

test('append one question while preserving every published number and URL', () => {
  const published = siteRegistry.problems.slice(0, 7);
  const result = planImport(batch([item(published[6].sourceId), item('next-question')]),
    { ...siteRegistry, problems: published });
  assert.equal(published.length, 7);
  assert.equal(result.additions[0].number, 8);
  assert.equal(result.additions[0].slug, '008-next-question');
  assert.deepEqual(result.registry.problems.slice(0, 7), published);
  assert.deepEqual(result.skipped, [published[6].sourceId]);
  assert.deepEqual(result.registry.navigationBreaks, [published[6].sourceId]);
  const later = planImport(batch([item('later-question')]), result.registry);
  assert.deepEqual(later.registry.navigationBreaks, [published[6].sourceId, 'next-question']);
});

test('tables and figures cannot be silently omitted from approved questions', () => {
  for (const revise of [
    rec => ({ ...rec, question: { ...rec.question, table: { columns: [], rows: [] } } }),
    rec => ({ ...rec, question: { ...rec.question, figure: { points: {} } } }),
    rec => ({ ...rec, visual: { type: 'scatter_fit' } })
  ]) {
    assert.throws(() => planImport(batch([item('qa-test-s0001', revise)]), registry),
      /cannot yet display the table or figure/);
  }
});

test('rejects missing or stale approvals, bad manifests, wrong keys and unsupported formats', () => {
  const valid = item('qa-test-s0001');
  const cases = [
    [batch([valid, valid]), /duplicate/],
    [{ ...batch([valid]), source: { repository: 'batchmath/Shorts', commit: 'main' } }, /manifest/],
    [batch([valid, { ...item('qa-test-s0002'), text: null }]), /decision/],
    [batch([{ ...valid, text: { ...valid.text, contentHash: '0'.repeat(16) } }]), /text approval is for content/],
    [batch([{ ...valid, recordJson: valid.recordJson.replace('2x+1=7', '2x+1=8') }]), /content hash does not match/],
    [batch([item('qa-test-s0001', value => ({ ...value, answer: { label: 'A', display: '$2$' } }))]), /keyed choice/],
    [batch([item('qa-test-s0001', value => ({ ...value, choices: value.choices.map(c => ({ ...c, why: '' })) }))]), /no explanation/],
    [batch([item('qa-test-s0001', value => ({ ...value, classification: { ...value.classification, format: 'unsupported' } }))]), /unsupported source format/]
  ];
  for (const [input, expected] of cases) assert.throws(() => planImport(input, registry), expected);
});

test('a build failure after staging records leaves the branch and output untouched', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-approved-batch-'));
  try {
    // The source taxonomy is internally valid, but has no matching website subject.
    const input = path.join(tmp, 'export.json');
    fs.writeFileSync(input, JSON.stringify(batch([item('qa-test-s0001')])));
    const output = path.join(tmp, 'output');
    const registryBytes = fs.readFileSync(path.join(config, 'registry.json'));
    const sheetPath = path.join(root, 'assets/sat-act/video-feed-config.js');
    const sheetBytes = fs.readFileSync(sheetPath);
    const before = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root });
    const run = spawnSync(process.execPath, ['tools/sat-act/stage-approved-batch.mjs', '--export', input, '--out', output], { cwd: root, encoding: 'utf8' });
    assert.equal(run.status, 1, run.stderr);
    assert.match(run.stderr, /has no website taxonomy entry/);
    assert.equal(fs.existsSync(output), false);
    assert.deepEqual(fs.readFileSync(path.join(config, 'registry.json')), registryBytes);
    assert.deepEqual(fs.readFileSync(sheetPath), sheetBytes);
    assert.deepEqual(execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root }), before);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
