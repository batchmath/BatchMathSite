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

Environment: Node 22.23.4, Playwright 1.62.1 with the sandbox's pre-installed Chromium, pinned MathJax 4.1.3 served
locally to the browser tests. Run on 2026-11-17.

### New SAT & ACT checks

| Command | Result |
|---|---|
| `npm run qa:sat-act` | **PASS** — 5 questions, 12 pages; 184 TeX strings found verbatim on their pages; fresh rebuild byte-identical to the committed output; registry permanence checked against git HEAD; explanation starts bound to MP4 hashes; real tracker contract in a sandbox; 13 approved-importer accept/refuse cases |
| `npm run qa:sat-act-browser -- --real-youtube` | **PASS, 14/14** — filters and no-results state; mixed set of 5 with no repeats; first-attempt scoring with retry and pre-answer reveal (2 correct of 4 answered, 5 completed); reload without duplicate events; single-question topic finish; direct visit; video cued at 0:19 with no autoplay, Show Written Solution, ended → solution; player error, blocked API and silent-embed timeout fallbacks; keyboard; phone layout on every page; MathJax on all five; navigation and links; typed answers; real IFrame API builds `youtube-nocookie.com/embed/…?start=19&enablejsapi=1&autoplay=0` |
| `npm run qa:sat-act-release` | **FAIL by design (18)** — 5 questions unapproved, library still development fixtures, 12 pages show the preview notice |
| Fixture re-import from Shorts | Identical to the committed records; Shorts checkout unchanged at `22113846` |
| `seo-build` default mode | Byte-identical output for all 325 existing pages and the sitemap, before vs after the `--only` change |

### Existing site QA (every script in `qa:nobrowser`, plus `qa:seeded` and `qa:problem-of-day-archive`)

Each script was run individually on the branch and on a pristine worktree of `main` (`c04baa0`), because
`qa:nobrowser` is an `&&` chain that already stops at `qa:seo` on `main`.

| | Branch | `main` baseline |
|---|---|---|
| Pass | 42 of 52 (including `qa:sat-act`) | 41 of 51 |
| Fail | 10 | the same 10, with identical error messages |

- **Pass on both:** `qa:static` (release QA: 337 indexable pages, sitemap exact, 0 broken references, 165 engines),
  `qa:analytics` (165 engines), `qa:pwa`, `qa:display`, `qa:semantic`, `qa:prep`, `qa:math`, `qa:limits`, `qa:topics`,
  `qa:deep`, `qa:newcalc`, `qa:browser-infra` and the rest, and **`qa:seeded`: 165 engines, 495 reproducibility
  samples, 0 errors** with the modified shared tracker.
- **Fail on both, unchanged by this branch (pre-existing on `main`):** `qa:seo` (32 errors: AP Calculus heading levels,
  Mogollon metadata, one noindex page), `qa:topic-at-point`, `qa:unit3`, `qa:fractions`, `qa:clipboard`,
  `qa:im1-like-terms`, `qa:im1-equations-update`, `qa:fractional-exponent-display`, `qa:practice-selects`.
  Only their page/file counts change, by the new pages.
- **Environment-blocked:** `qa:problem-of-day-archive` fetches the live archive from `docs.google.com`, which this
  sandbox cannot resolve. Its homepage assertions (archive button markup and styles) were run directly and pass.
- The seeded suite needed `PLAYWRIGHT_BROWSERS_PATH` pointed at the sandbox's Chromium build; no QA script was edited.
- No file under `ap-calculus/`, `im1/`, `calculus-prep/`, `archive/`, `mogollon2026/` or `about/` changed.

Not verified here: real YouTube playback and the ENDED event with a real video (this sandbox blocks the embedded player
document; the player integration is covered by the mocked IFrame API, and the real API call by the smoke test), a real
phone, and GA4 receipt of events (events were captured in the browser before sending).

## Observations outside this task (not changed)

- `main` currently fails 9 of its own QA scripts (listed above), and `qa:nobrowser` stops at `qa:seo`.
- A full `node tools/seo-build.mjs` run on `main` would rewrite 285 existing pages (later page builders appended
  assets after the SEO block, and the sitemap was last edited by hand). That is why this branch uses the new scoped mode.
- On phones, the shared header's COURSES button overlaps the first breadcrumb line on existing pages (archive, About,
  AP Calculus). SAT & ACT pages pad their breadcrumbs to stay clear; the shared header itself is unchanged.
- `qa:seeded` needs the Playwright browser build matching 1.62.1; in environments without it, set
  `PLAYWRIGHT_BROWSERS_PATH` or install that build.

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
