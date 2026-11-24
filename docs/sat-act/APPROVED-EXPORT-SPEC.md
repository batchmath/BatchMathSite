# Approved content export — format accepted by the website

`tools/sat-act/import-approved-export.mjs` accepts this format. The private Shorts exporter rechecks the committed
owner decisions before producing it. The [automated import workflow](APPROVED-IMPORT-WORKFLOW.md) validates and
stages new records through that importer. JSON text fields carry the pinned file bytes so both systems can check
content identity.

```json
{
  "schema": "batchmath.shorts.approved-export/1",
  "exportedAt": "2026-12-01T18:00:00Z",
  "source": {
    "repository": "batchmath/Shorts",
    "commit": "<40-hex commit the records were exported from>",
    "taxonomy": "<exact text of shorts/taxonomy.py at that commit>"
  },
  "items": [
    {
      "recordJson": "<exact text of data/…/<id>.json>",
      "text": {
        "decision": "approved",
        "releaseEligible": true,
        "reviewer": "<reviewer recorded by the review server>",
        "approvedRevision": "<text approval revision>",
        "contentHash": "<record content_hash the approval covers>",
        "decidedAt": "<ISO 8601>"
      },
      "video": {
        "decision": "approved",
        "releaseEligible": true,
        "reviewer": "<reviewer>",
        "approvedRevision": "<video approval revision>",
        "textApprovedRevision": "<the text revision this video approval is bound to>",
        "decidedAt": "<ISO 8601>",
        "mediaSha256": "<SHA-256 of the exact approved narrated MP4>",
        "manifestJson": "<exact text of output/videos/<id>-narrated.json>",
        "sceneJson": "<exact text of data/scenes/<id>-narrated.json>"
      }
    }
  ]
}
```

`video` is optional (text-only approval). The MP4 itself is never included.

## What the importer enforces

- Schema, source repository and a full commit SHA; the taxonomy text parses.
- Every record: `status = verified`, verification passed with zero failures, quality gate passed, four labelled
  choices, answer key consistent with the choices, every wrong choice explained, solution steps present.
- Text approval: `decision = approved`, `releaseEligible = true`, a reviewer and revision recorded, and `contentHash`
  equal to the record's `content_hash`.
- Video approval: same rules, bound to the same text revision; `mediaSha256` equals the manifest's media hash; the
  scene's canonical digest equals the manifest's scene hash; explanation timing is recomputed from scene + manifest.
- The question is registered (has a permanent number) in `tools/sat-act/config/registry.json`.
- `youtube-publications.json` entries: valid and unique YouTube IDs, a publication date, an MP4 hash equal to the
  approved video's hash, and only for questions that have an approved video in the export.
- Reviewer names are **not** copied into website files; only revisions and dates are kept.

Any failure stops the import with `IMPORT REFUSED: <reason>` and writes nothing. `npm run qa:sat-act` exercises these
rules with 13 synthetic accept/refuse cases.

## Legacy static publications

The automated batch workflow leaves static publication records alone. The owner links published YouTube videos
through the existing worksheet. The legacy importer accepts `youtube-publications.json` when explicitly used
for a hash-backed static association.

```json
{
  "schema": "batchmath.sat-act.youtube-publications/1",
  "publications": [
    { "sourceId": "radical-equation-s0003", "youtubeId": "<11-character ID>", "mediaSha256": "<SHA-256 of the uploaded MP4>", "publishedOn": "2026-12-02" }
  ]
}
```
