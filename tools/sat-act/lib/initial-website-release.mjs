import { must, sha256, stableJson, YOUTUBE_ID } from './source-records.mjs';

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function initialWebsiteRelease({ release, source, publications, records, registry }) {
  must(release.schema === 'batchmath.sat-act.initial-website-release/1', 'invalid initial website release schema');
  const expectedIds = source.records.map(r => r.sourceId);
  must(Array.isArray(release.records) && release.records.map(r => r.sourceId).join() === expectedIds.join(),
    'initial website release must contain the five pinned Shorts records in their original order');

  const authorization = release.authorization;
  if (authorization !== null) {
    must(authorization?.decision === 'authorize-website-publication' &&
      typeof authorization.owner === 'string' && authorization.owner.trim() && validDate(authorization.authorizedOn),
    'initial website release requires an explicit owner decision and authorization date');
    must(authorization.recordsSha256 === sha256(stableJson(release.records)),
      'owner authorization does not cover this exact set of website records');
  }

  const registered = new Map(registry.problems.map(p => [p.sourceId, p]));
  const reviewed = new Set();
  for (const entry of release.records) {
    const id = entry.sourceId;
    const question = registered.get(id);
    const record = records.get(id);
    if (!question && !record) continue; // Standalone QA can supply a different registry and records directory.
    must(question?.number === entry.number && question.slug === entry.slug, `${id}: initial website number or URL changed`);
    if (authorization && question.status === 'active') must(record, `${id}: authorized website record is missing`);
    if (!record || (record.contentStatus === 'approved' && !record.provenance?.audit)) continue;
    must(record.contentStatus === 'development-fixture', `${id}: audited fixture must retain its original Shorts approval status`);
    must(record.provenance?.repository === source.repository && record.provenance?.commit === source.commit &&
      record.provenance?.audit?.commit === source.audit.commit,
    `${id}: initial website record does not have the pinned Shorts provenance`);
    must(sha256(stableJson(record)) === entry.websiteSha256, `${id}: initial website record differs from the reviewed record`);
    reviewed.add(id);
  }

  // These entries document manual public uploads of the audited renders.
  must(publications.schema === 'batchmath.sat-act.youtube-publications/1', 'invalid publications file');
  const entries = publications.initialWebsitePublications ?? [];
  must(Array.isArray(entries), 'initialWebsitePublications must be an array');
  const links = new Map();
  for (const publication of entries) {
    const { sourceId, youtubeId, mediaSha256, publishedOn } = publication;
    must(reviewed.has(sourceId) && registered.get(sourceId).status === 'active', `${sourceId}: upload is outside the initial website release`);
    must(!links.has(sourceId), `${sourceId}: duplicate initial website publication`);
    must(typeof youtubeId === 'string' && YOUTUBE_ID.test(youtubeId), `${sourceId}: invalid YouTube ID`);
    must(validDate(publishedOn), `${sourceId}: publishedOn must be a calendar date in YYYY-MM-DD format`);
    const video = records.get(sourceId).video;
    must(/^[0-9a-f]{64}$/.test(mediaSha256) && mediaSha256 === video.mediaSha256,
      `${sourceId}: uploaded MP4 does not match the audited render`);
    links.set(sourceId, { ...video, youtubeId, published: true, publication: { publishedOn } });
  }
  return { authorized: authorization ? reviewed : new Set(), links };
}
