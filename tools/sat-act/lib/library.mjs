// Loads the SAT & ACT library: permanent registry + imported records + website taxonomy.
// Fails closed on any inconsistency so a page can never be built from an ambiguous source.
import fs from 'node:fs';
import path from 'node:path';
import { RECORD_SCHEMA, CONTENT_STATUSES, YOUTUBE_ID } from './source-records.mjs';
import { initialWebsiteRelease } from './initial-website-release.mjs';

export const SECTION = '/sat-act-math/';
export const SLUG_RE = /^(\d{3,})-[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function displayNumber(n) {
  return String(n).padStart(3, '0');
}

export function loadLibrary(toolDir, { recordsDir, registryPath } = {}) {
  const read = rel => JSON.parse(fs.readFileSync(path.join(toolDir, rel), 'utf8'));
  const registry = registryPath ? JSON.parse(fs.readFileSync(registryPath, 'utf8')) : read('config/registry.json');
  const taxonomy = read('config/taxonomy.json');
  const dir = recordsDir || path.join(toolDir, 'records');
  const records = new Map();
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith('.json') || f === 'IMPORT-MANIFEST.json') continue;
    const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (rec.schema !== RECORD_SCHEMA) throw new Error(`${f}: unexpected schema ${rec.schema}`);
    if (`${rec.sourceId}.json` !== f) throw new Error(`${f}: file name does not match sourceId ${rec.sourceId}`);
    if (!CONTENT_STATUSES.has(rec.contentStatus)) throw new Error(`${f}: unknown content status ${rec.contentStatus}`);
    records.set(rec.sourceId, rec);
  }

  const numbers = new Set(), slugs = new Set(), ids = new Set();
  for (const p of registry.problems) {
    if (!Number.isSafeInteger(p.number) || p.number < 1) throw new Error(`registry: invalid number ${p.number}`);
    if (numbers.has(p.number)) throw new Error(`registry: number ${p.number} is used twice`);
    if (ids.has(p.sourceId)) throw new Error(`registry: ${p.sourceId} is registered twice`);
    const m = String(p.slug).match(SLUG_RE);
    if (!m || m[1] !== displayNumber(p.number)) throw new Error(`registry: slug ${p.slug} must start with ${displayNumber(p.number)}-`);
    if (slugs.has(p.slug)) throw new Error(`registry: slug ${p.slug} is used twice`);
    if (!p.title || !String(p.title).trim()) throw new Error(`registry: ${p.sourceId} has no title`);
    if (!['active', 'retired'].includes(p.status)) throw new Error(`registry: ${p.sourceId} has unknown status ${p.status}`);
    numbers.add(p.number); slugs.add(p.slug); ids.add(p.sourceId);
  }
  for (const id of records.keys()) if (!ids.has(id)) throw new Error(`record ${id} is not registered (no permanent number)`);

  const initial = initialWebsiteRelease({
    release: read('config/initial-website-release.json'),
    source: read('config/dev-fixture-source.json'),
    publications: read('config/youtube-publications.json'),
    records,
    registry
  });
  const subjectByTopic = new Map(taxonomy.subjects.map(s => [s.sourceTopic, s]));
  const difficultyLabel = new Map(taxonomy.difficulties.map(d => [d.value, d]));
  const videoIds = new Set();
  const problems = [];
  for (const entry of [...registry.problems].sort((a, b) => a.number - b.number)) {
    if (entry.status !== 'active') continue;
    const record = records.get(entry.sourceId);
    if (!record) continue; // registered but not (yet) imported: not published
    const subjectEntry = subjectByTopic.get(record.classification.topic);
    if (!subjectEntry) throw new Error(`${entry.sourceId}: subject "${record.classification.topic}" has no website taxonomy entry`);
    const subject = { ...subjectEntry, url: `${SECTION}topics/${subjectEntry.slug}/` };
    const skillIds = record.classification.skills;
    const skillLabel = id => ((taxonomy.skills[id] || {}).label) || record.skillNames[id];
    if (!difficultyLabel.has(record.difficulty)) throw new Error(`${entry.sourceId}: unknown difficulty ${record.difficulty}`);
    const websiteAuthorized = initial.authorized.has(entry.sourceId);
    const shortsApproved = record.contentStatus === 'approved' && record.approval?.releaseEligible === true && Boolean(record.approval.text);
    const initialVideo = initial.links.get(entry.sourceId);
    const video = initialVideo || record.video;
    const hasVideo = Boolean(video?.youtubeId && video.published);
    if (video?.youtubeId) {
      if (!hasVideo || !YOUTUBE_ID.test(video.youtubeId) || (!initialVideo && !(shortsApproved && record.approval.video))) {
        throw new Error(`${entry.sourceId}: YouTube ID without a valid publication`);
      }
      if (videoIds.has(video.youtubeId)) throw new Error(`YouTube ID ${video.youtubeId} is assigned to more than one problem`);
      videoIds.add(video.youtubeId);
    }
    problems.push({
      ...entry,
      record,
      id: entry.sourceId,
      displayNumber: displayNumber(entry.number),
      url: `${SECTION}problems/${entry.slug}/`,
      subject,
      skill: { id: skillIds[0], label: skillLabel(skillIds[0]), sourceName: record.skillNames[skillIds[0]] },
      secondarySkills: skillIds.slice(1).map(id => ({ id, label: skillLabel(id), sourceName: record.skillNames[id] })),
      exams: [...record.classification.exams],
      difficulty: difficultyLabel.get(record.difficulty),
      video,
      hasVideo,
      websiteAuthorized,
      releaseAuthorized: websiteAuthorized || shortsApproved
    });
  }

  const subjects = taxonomy.subjects
    .map(s => ({ ...s, url: `${SECTION}topics/${s.slug}/`, problems: problems.filter(p => p.subject.slug === s.slug) }))
    .filter(s => s.problems.length)
    .sort((a, b) => a.order - b.order);
  for (const s of subjects) {
    const skills = new Map();
    for (const p of s.problems) {
      if (!skills.has(p.skill.id)) skills.set(p.skill.id, { ...p.skill, subject: s.slug, problems: [] });
      skills.get(p.skill.id).problems.push(p);
    }
    s.skills = [...skills.values()].sort((a, b) => a.problems[0].number - b.problems[0].number);
  }
  const releaseReady = problems.length > 0 && problems.every(p => p.releaseAuthorized);
  return {
    registry, taxonomy, problems, subjects, releaseReady,
    contentStatus: releaseReady ? (problems.some(p => p.websiteAuthorized) ? 'website-authorized' : 'approved') : 'development-fixture',
    difficulties: taxonomy.difficulties.filter(d => problems.some(p => p.difficulty.value === d.value)).sort((a, b) => a.order - b.order)
  };
}
