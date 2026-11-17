# SAT & ACT Math Practice — source of truth, approval boundary and publishing

## Roles of the two repositories

| | `batchmath/Shorts` (private) | `batchmath/BatchMathSite` |
|---|---|---|
| Owns | Verified mathematics, answer key, choices, explanations, solution steps, classification, renders, narration timing, human review decisions | Permanent numbering and URLs, page design, practice runtime, analytics, SEO |
| Decides approval | Yes — its review server and `release-status` gate | **Never.** The website only reads approval decisions |
| Holds media | Narrated MP4s | Never. Only a published YouTube ID, added by hand |

The website never rewrites mathematics. Importers copy learner-facing content verbatim; the generator only wraps it in
HTML and MathJax delimiters (`npm run qa:sat-act` verifies every TeX string appears unchanged on its page).

## The boundary

```
Shorts (verified records) ──► human review gate ──► APPROVED EXPORT ──► website importer ──► pages
                                                     (file, explicit)    (validates, refuses)
                 approved narrated MP4 ──► human uploads to YouTube ──► youtube-publications.json (by hand)
```

Safeguards built into the tools:

- **No automatic publication.** Nothing here uploads to YouTube, deploys, or merges. Builds only write files on a branch.
- **No blind import of Shorts `main`.** The development importer reads one pinned commit; the production importer reads
  only an export file whose items each carry a recorded human approval.
- **A passing test is not approval.** `status: "verified"` and an audit verdict are recorded as provenance, never as
  approval. Development fixtures carry `approval.text = null`, `approval.video = null`, `releaseEligible = false`.
- **No invented video IDs.** A YouTube ID can only come from `tools/sat-act/config/youtube-publications.json`, must
  look like a real ID, must be unique, and must be bound to the SHA-256 of the exact approved MP4. The explanation start
  time is derived from that same render, so it matches the uploaded file.
- **No credentials.** Importers read a local checkout or a local file; no token is used and nothing reaches client code.
- **Shorts is read-only.** No tool writes to the Shorts repository or its approval records.
- **Release gate.** `npm run qa:sat-act-release` fails while any question is a development fixture, lacks a recorded
  approval, or any page still shows the development-preview notice. Run it before any merge to `main`.

## What the prototype contains

The five questions are **development fixtures** imported from `claude/phase8-final-corrections` at
`22113846d3f83f10eef9a9c19f64b2e5848a9b6f`, cross-checked against the independent audit on
`codex/phase8-final-audit` (`4409e16…`, verdict PASS WITH MINOR ISSUES). They are not approved and have no YouTube IDs.
Every generated page shows a visible "Development preview — not for publication" notice.

Re-import (from a local Shorts checkout that has both commits):

```
node tools/sat-act/import-shorts-fixtures.mjs --shorts <path-to-Shorts>
npm run sat-act:build
```

The importer refuses if a record is not verified, a check failed, the answer key disagrees, the MP4 bytes differ from the
manifest or from the audit report's SHA-256 table, or the scene digest does not reproduce.

## Explanation start time

For each narrated render: `explanationStartSeconds` = the first whole second at or after the end of the on-screen
thinking countdown, and never later than the first spoken explanation sentence. Both come from the render's own scene
and narration manifest (not estimated). Current values:

| # | Record | Countdown ends | First explanation sentence | Start used |
|---|---|---|---|---|
| 001 | right-triangle-trig-s0031 | 18.014 s | 19.114 s | **0:19** |
| 002 | radical-equation-s0003 | 15.463 s | 17.013 s | **0:16** |
| 003 | system-no-solution-s0001 | 19.482 s | 21.332 s | **0:20** |
| 004 | reverse-percent-s0001 | 22.143 s | 24.593 s | **0:23** |
| 005 | circle-radius-s0001 | 17.576 s | 18.726 s | **0:18** |

Whole seconds are used because YouTube's `start` player parameter and `&t=` links accept whole seconds.

## Production path (after human approval)

1. **Approve in Shorts.** In the matching production environment, approve current text and then each exact narrated
   video variant through the review server; confirm `python -m shorts release-status <id>-narrated --scope video`
   reports `release_eligible=true`.
2. **Export.** Produce an approved export file in the format in [APPROVED-EXPORT-SPEC.md](APPROVED-EXPORT-SPEC.md)
   (Shorts does not have this exporter yet; it is the one piece to add on the Shorts side).
3. **Publish video manually** (optional per question). Upload the approved MP4 to YouTube by hand. Add an entry to
   `tools/sat-act/config/youtube-publications.json` with the real ID, the MP4's SHA-256 and the publication date.
4. **Register new questions.** Append each new source ID to `tools/sat-act/config/registry.json` with the next number,
   a permanent slug (`NNN-short-description`) and a title. Never renumber or reuse a number. If the question uses a new
   subject, it is already listed in `taxonomy.json`; a new skill can be given a display label there (optional).
5. **Import.** `node tools/sat-act/import-approved-export.mjs --export <file> --replace`
   (`--replace` removes records not in the export, i.e. the development fixtures).
6. **Build.** `npm run sat-act:build` regenerates every library page, the catalog, SEO metadata, breadcrumbs and the
   sitemap entries for `/sat-act-math/` only. No page is written by hand.
7. **QA.** `npm run qa:sat-act`, `npm run qa:sat-act-browser`, `npm run qa:sat-act-release` (must now pass), plus the
   site's usual QA.
8. **Review and merge** through the normal BatchMath release process (version markers, package, deploy).

A question without a published video is fully usable: students get immediate feedback and the written solution, and
the video interface never appears. Adding the YouTube ID later only requires steps 3, 5 and 6.

## Adding problems later (summary)

Approve in Shorts → export → (optional) publish video and record its ID → append to the registry → import → build →
QA → merge. Pages, topic counts, filters, mixed-practice pools, sitemap and structured data update automatically.
The design has no per-question code, so 500+ questions only grow the registry, the records folder and `catalog.js`
(about 300 bytes per question).
