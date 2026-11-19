# SAT & ACT Math Practice P2 audit

**Review branch** `codex/sat-act-launch`, based on Claude's prototype at
`81e76876fa0f38c7e29420e6d7f1e2d63bda545a`. Website authorization is pending.

## Launch corrections

- Removed the exam selector, exam badges and exam-specific filter copy. Topic, skill, difficulty and mixed practice
  drive navigation. The SAT and ACT classifications remain in the records, catalog and `exam_scope` analytics.
- Added an owner signoff bound to the five exact imported records and their permanent numbered URLs. The
  existing formal Shorts approved-export importer still has its original approval requirements. The existing
  GitHub QA workflow checks the website release gate on `main` and PRs targeting it.
- Added a place to record each manually published YouTube upload, validated against the audited MP4 hash,
  without changing the imported record. The build carries through the verified cue time. The branch contains
  no SAT & ACT YouTube IDs.
- Updated browser tests for difficulty filtering, empty states and first-attempt scoring on all five problems.

## Independent math and source audit

Checked every answer, distractor, written solution and notation. All five answer keys matched the independent
calculation. The numbered URLs, problem IDs, problem text, diagrams, answers, explanations and source records
are identical to P1. The read-only Shorts re-import tested the pinned content commit
`22113846d3f83f10eef9a9c19f64b2e5848a9b6f` against the audit
`4409e16316a615216f48db31e896d58f9849b421` and reproduced every website record byte for byte, including the
record hashes, audited MP4 hashes, scene digests and narration timings.

| # | Answer and independent check | Distractors | Cue |
|---|---|---|---|
| 001 | **B, 8/15.** The 8–15–17 right triangle gives sides 8 opposite B and 15 adjacent to B. | 8/17 is sin B, 15/17 is sin A, and 15/8 is tan A. | 0:19 |
| 002 | **B, 11.** Squaring gives candidates 4 and 11. Substitution into the original equation gives 3 ≠ −3 at 4 and 4 = 4 at 11. | Each other choice either includes 4 or omits the valid solution 11. | 0:16 |
| 003 | **A, −9.** Multiply the first equation by 3. Matching coefficients give parallel lines, with constants 3 and 10. | −3, −1 and 9 produce different slopes. | 0:20 |
| 004 | **C, $90.00.** Divide $76.32 by 0.8 × 1.06 and check both adjustments forward. | $86.09 applies opposite rates, $88.74 treats the net change as 14% off, and $95.40 omits undoing tax. | 0:23 |
| 005 | **C, 9.** Completing the square gives center (2, −2) and radius squared 81. | 2√2 is the distance to the center from the origin, √73 skips both additions, and 81 is the squared radius. | 0:18 |

## SAT & ACT QA

| Check | Result |
|---|---|
| Static, math and scoped SEO | Pass. 5 records, 12 pages, 184 verbatim TeX strings, deterministic rebuild, canonicals, breadcrumbs, structured data and sitemap. Existing importer passed 13 cases. Initial website authorization passed pending, signed and 9 refusal cases. |
| Browser | 14/14 pass in Chromium at desktop width and 390 px phone width. Includes all five questions with each first-attempt result, retries, mixed and topic completion, navigation, keyboard, MathJax and analytics. The extracted preview also fit at 320, 768 and 1280 px. Phone dimensions were emulated. |
| Unsigned release gate | Refused all five questions as expected. |
| Authorized build rehearsal | In a disposable full checkout, the test signoff removed notices from all 12 pages and passed the release gate, static release and analytics checks. The gate refused a signed build with a stale preview page. A test upload populated only its matching question and kept the 0:19 cue. The branch retains empty signoff and upload fields. |
| Video | Simulated player passed cue, autoplay disabled, start and end events, written solution reveal and fallback tests. The optional real YouTube smoke test timed out. The IFrame API request returned HTTP 403 from this environment. Actual playback remains unverified. |
| Analytics | Captured the real tracker emitting session start and completion, question presentation, first attempts, first-try correct answers, retries, completion, solution reveals and video start/end/error. Tests covered deduplication and parameter hygiene. Live GA4 receipt was unverified. |

## Existing courses and baseline

Compared the branch with `main` at `c04baa045e797d8243bd28530bd6c1ccc8780bf0`. The static and analytics checks passed
on both trees. Static QA found zero broken references and 12 additional indexable SAT & ACT routes on the branch.
The 165 existing analytics engines passed their instrumentation checks. No AP Calculus, IM1, Calculus Prep, Mogollon,
About, archive or service-worker file changed.

The standard BatchMath QA workflow passed on the review code and the exact baseline, including seeded
browser QA for all 165 existing engines. [Review CI](https://github.com/batchmath/BatchMathSite/actions/runs/44205026690)
[Baseline CI](https://github.com/batchmath/BatchMathSite/actions/runs/43450198186)

The archive check passed against the live spreadsheet on both trees with Node's inherited proxy enabled.
The same existing sitewide failures reproduced on both trees.

- `qa:seo` reported the same 32 findings in AP Calculus and Mogollon headings, metadata and indexing. All 12 SAT & ACT
  pages passed their section-specific SEO checks.
- `qa:topic-at-point`, `qa:unit3`, `qa:fractions`, `qa:clipboard`, `qa:im1-like-terms`, `qa:im1-equations-update`,
  `qa:fractional-exponent-display` and `qa:practice-selects` reproduced their existing failures.

The chained `qa:nobrowser` command exits at `qa:seo`. The baseline failures were checked individually.

## Owner handoff

Follow the [publishing workflow](PUBLISHING-WORKFLOW.md) for signoff, YouTube URLs and the GitHub Pages deployment.
For GA4, register the event-scoped dimensions for engine ID, problem ID, subject, skill, practice mode, answer result,
first attempt result and completion method. Add the four session metrics if session totals are needed. Verify
receipt with GA4 DebugView after deployment. [GA4 setup and full event list](GA4-ANALYTICS.md)

The local preview omits 346 existing classroom PDFs (322 MB uncompressed). The archive lists them in
`OMITTED-PDFS.txt`. The full checkout retains the PDFs.
