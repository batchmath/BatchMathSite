# SAT & ACT Math Practice — prototype p1: implementation and QA report

**Status: private development prototype for review. Not approved, not merged, not deployed.**

- Branch: `claude/great-euler-unrdiw`, built on `main` at `c04baa0` (v13.0.I plus its QA hotfixes; the newest
  baseline — no newer approved work existed on other branches). Version markers stay at 13.0.I; a release number is
  assigned when this is approved.
- Content source: `batchmath/Shorts` `claude/phase8-final-corrections` at `22113846d3f8…`, cross-checked against the
  independent audit `codex/phase8-final-audit` (`4409e16…`, PASS WITH MINOR ISSUES). Read-only; nothing was written to
  Shorts.

## What was built

| Area | Result |
|---|---|
| Homepage | Wide "SAT & ACT Math Practice" button in the archive button's black/red/yellow style, placed directly above the Problem of the Day Archive button. Nothing else on the homepage moved. |
| Library home `/sat-act-math/` | Practice by Topic and Mixed Practice; filters for exam (SAT / ACT / both), subject, skill and difficulty; live counts; honest single-question counts; no-results state; resume-session banner. |
| Numbered library | Permanent registry (`tools/sat-act/config/registry.json`): #001–#005, stable source IDs, permanent slugs and URLs. Append-only by policy and checked against git history by QA. |
| Pages (static, indexable) | 12 generated pages: library home, all-questions list, 5 topic pages, 5 question pages. Question text, choices and full solutions are in the HTML (no JavaScript needed to read them). |
| Question experience | Four-choice questions, immediate feedback, Check Again retries, first-attempt scoring, Next Problem / Finish Session, session bar ("X correct out of Y answered · Z completed"), End Session, summary with Practice Again / Choose a Topic / Mixed Practice. |
| Written solutions | From the verified records: every step (TeX verbatim), check lines with verdicts, answer, key idea, the chosen wrong answer's own explanation, and all wrong-choice explanations (collapsed). Always available without the video. |
| Video | YouTube IFrame API on `youtube-nocookie.com`, vertical 9:16 player, cued to each problem's explanation start, never autoplayed. Wrong answer → video panel opens; Show Written Solution always visible; video end → solution opens; errors, blocked API and silently blocked embeds fall back to the solution; Watch on YouTube link with `&t=`. With no published video (all five today) the solution opens directly. |
| Future formats | Typed (student-produced response) answers supported end to end (equivalent forms such as 3/4, .75, 6/8); tested with a QA-only synthetic record that is never published. |
| Analytics | Shared `BMAnalytics` tracker, engine `sat_act_library`; 11 events; see `GA4-ANALYTICS.md`. |
| SEO | Unique titles/descriptions, canonical URLs, Open Graph/Twitter, WebPage + BreadcrumbList JSON-LD and visible breadcrumbs, all produced by the existing `seo-build`; 12 URLs added to `sitemap.xml`. |
| Pipeline | Development-fixture importer, production approved-export importer, generator, QA, release gate. See `PUBLISHING-WORKFLOW.md`. |

## Files changed outside the new section

| File | Change |
|---|---|
| `index.html` | New button and its CSS (separate `satact-spotlight` class; archive/Mogollon markup and styles unchanged). |
| `assets/problem-tracking.js` | Additive `BMAnalytics.trackEvent()`; debug panel also lists new event names. Existing methods unchanged. |
| `tools/seo-build.mjs` | Opt-in `--only=<dir>/` scope. Without it, output is byte-identical to before for all 325 pages and the sitemap (verified on two scratch copies). |
| `sitemap.xml` | 12 new `/sat-act-math/` lines; no other line changed. |
| `package.json` | `sat-act:*` and `qa:sat-act*` scripts; `qa:sat-act` appended to `qa:nobrowser`. |

New: `sat-act-math/`, `assets/sat-act/`, `tools/sat-act/`, `docs/sat-act/`, `SAT-ACT-PREVIEW.txt`.

## Design decisions worth reviewing

1. **Taxonomy mirrors Shorts.** Subjects are the Shorts `TOPICS`, skills its `SKILLS`; a question is listed under its
   primary skill, with secondary skills as tags (so #002 is not double-counted as a quadratics question). Five subjects
   with one question each today.
2. **Analytics loading.** SAT & ACT pages load the shared tracker from the library runtime instead of a static tag, so
   the existing release/analytics QA keep counting exactly the 165 generator engines. New QA covers the library.
3. **Indexable on this branch, guarded by process and a gate.** Pages are indexable and in the sitemap so SEO is
   exercised for real; the branch must not be merged before approval. Every page shows a visible development-preview
   notice, and `npm run qa:sat-act-release` fails until all questions are approved. (Alternative if preferred: emit
   `noindex` for fixtures — this would require an explicit allowance in `seo-qa`.)
4. **"Completed"** = the student has the answer in hand (answered correctly, opened the solution, or watched the video
   to the end); "answered" = the first submitted answer. Both are counted once per question per session.
5. **Solution before answering** locks the question as "not scored" so first-attempt statistics cannot be inflated.
6. **Inline fractions** in the records' explanations render display-style (MathJax macro), and KaTeX-style
   `\htmlClass` maps to MathJax `\class`; the TeX in the HTML stays verbatim.

## QA results

QA_RESULTS_PLACEHOLDER

## Remaining steps before approval and deployment

1. Human review of the five questions and narrated videos in the Shorts production environment (the audit's checklist),
   ending with `release-status … release_eligible=true` for each item to be published.
2. A Shorts exporter for the approved-export format (`APPROVED-EXPORT-SPEC.md`).
3. Manual YouTube upload of approved MP4s, then entries in `youtube-publications.json` (real IDs + MP4 SHA-256).
4. Import with `--replace`, rebuild, and run `qa:sat-act`, `qa:sat-act-browser`, `qa:sat-act-release` (must pass).
5. Register the GA4 custom dimensions/metrics in `GA4-ANALYTICS.md` before launch.
6. Your review of copy, the homepage placement and the decisions above; optional real-device check of the YouTube
   player (this sandbox's network blocks the embedded player document, so real playback was not observed here).
7. Normal BatchMath release: version markers, package, deploy, post-deploy check.

## Adding approved problems later

Approve in Shorts → export → (optional) upload video and record its ID → append the source ID to the registry with
the next number → `import-approved-export.mjs` → `npm run sat-act:build` → QA → merge. No page is written by hand.
