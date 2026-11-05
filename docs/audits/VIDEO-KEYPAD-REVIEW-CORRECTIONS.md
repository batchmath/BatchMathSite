# Video, keypad and review-instruction corrections

Branch: `integration/mathlive-im1-videos-content`.
Starting checkpoint: `535527a172b4a2e4c26d9cf970a6d061e7802849`.
The original merge and both completed source branches are preserved.

## Checkpoint A — video hierarchy

All 66 in-scope video-bearing pages were audited against the actual markup,
including specialized players outside the standard grids. Fifteen explicitly
designated lecture-plus-examples/proof pages now retain a prominent lecture
group and use one unified compact supporting gallery. Every supporting card
opens the shared modal even when the gallery contains only one or two cards.
The four rule proofs preserve their Proof labels, optional explanatory context,
recordings, titles, thumbnails, URL parameters and accessible controls.

The Chain Rule reference retains lecture `73RKQ9ybsDc` and places proof
`RhxU25eA1a8` plus examples `uDWcP2R8UMo` and `JbPkKwquxm0` in its supporting
gallery. All six homework walkthrough controls remain attached to assignments.
IM1 collections without a designated primary retain their approved layouts,
13 recordings, titles, order and 0:00 starts.

Browser QA passes 198 page/width visits at 375, 768 and 1280px, 288 card
activations, three retained specialized-control checks and four migrated-proof
checks, with zero page errors. It verifies 55 large collections, four pairs and
17 galleries (15 supporting). The initial added proof check needed to wait for
the native dialog's close event before asserting player removal; the existing
close/stop assertions remain intact. External YouTube responses are simulated.

Source preservation independently checks all video IDs, full URLs/configuration,
titles, thumbnails, links and optional notes, and compares the entire remainder
of each page outside the authorized instructional sections. The content audit
retains 96 byte-identical content HTML pages plus 15 tightly checked authorized
video-layout changes, all 34 MathLive overlaps and all 90 IM1 pages. Static QA
passes with zero errors, warnings or broken references.

See [all 66 page decisions](VIDEO-HIERARCHY.md),
[machine inventory](VIDEO-HIERARCHY.json), and
[browser evidence](evidence/video-hierarchy-browser.json).

## Checkpoint B — keypad stability and sizing

The confirmed causes and fixes are documented in [the keypad audit](KEYPAD-STABILITY.md).
They include MathLive host scrolling during repeated focus/cursor commands,
programmatic focus of clipped source inputs, IM1 exercise-card transforms,
empty-field intrinsic height, multiplication's broad Check minimum width,
a legacy input stacking conflict, and fixed-height continuation rows that
allowed Check Answer to cover Clear in IM1 equation/interval keypads.
The shared focus changes preserve physical typing and normal user scrolling;
all mathematical commands, translators, graders and answer-history contracts
remain unchanged.

Coverage selects all 16 controllers from the existing 138-route inventory:
26 target entries / 27 distinct URLs (legacy Prep uses its actual exact-editor
keypad; its algebra page has only a native text box). The initial 130-case run
passed 125 with zero page errors. It exposed two reproducible continuation-row
failures, two nonapplicable legacy Prep cases, and one legacy typing observation.
Those results are retained in
[the initial summary](evidence/keypad-stability-initial-summary.json).
The typing probe now verifies focus has settled before entering characters at
35ms intervals; three independent repeats of both legacy comparison paths pass.
This is a test setup correction, not a claim that an initial failed run passed.

Focused validation on the final B source passes:

- 15/15 legacy IM1 stability cases, including equation and interval Clear controls.
- 20/20 multiplication width, mouse/touch, zoom and resizing cases; 375px document
  width is now 375px, with all buttons inside the viewport. All five requested
  widths (320/375/390/768/1280) pass without overflow clipping.
- 9/9 repeated legacy AP review / Prep exact-editor cases, including touch.
- 65/65 Power Rule and Chain Rule browser checks, including fallback, keyboard,
  history, structural input and grading interactions.
- 27/27 focused Node source/contract checks.
- 3/3 default/legacy/missing-runtime route-sweep smoke visits. The sweep now also
  measures ordinary-key viewport stability on every editable MathLive route.
- Content preservation: 34 reconciled overlaps, 90 IM1 pages, 96 exact HTML
  pages plus 15 guarded video-layout changes; PDFs and Unit 6 unchanged.

Evidence: [legacy IM1](evidence/keypad-stability-legacy-im1.json),
[multiplication](evidence/keypad-stability-multiplication-final.json),
[legacy repetitions](evidence/keypad-stability-legacy-recheck.json),
[focus suites](evidence/keypad-focus-regressions/pilots-summary.json).
The full corrected matrix and broad 138-route sweep will be rerun at D.

## Checkpoint C — review instructions

[The instruction audit](COMPREHENSIVE-REVIEW-INSTRUCTIONS.md) accounts for
99 engines/route contexts, 144,100 actual generated questions and 5,352
family/selector/contract records. Its machine ledger includes each sampled
family, selector, original/intended task, before/after instruction, answer
contract and no-change decision. Reviews in AP Units 1–5, IM1 Units 1–3 and
all eleven Calculus Prep mixed engines are covered. Public selectors are
enumerated; parameter sampling is finite and structural wrapper comparisons
protect tasks beyond the sampled coefficients.

Mixed Derivatives now retains its authored prompts: four difference-quotient
simplification families, higher derivative orders, domain assumptions, implicit
differentiation and complete polynomial simplification. Its 22 selectors yield
610 family/instruction records; 93 selector-specific records (47 distinct
family/instruction combinations) change wording. Some notation/inverse wording
was equivalent already and is preserved by the same simple policy.
No genuine derivative-by-limit family is reachable; this curriculum-coverage
gap is documented without changing an existing quotient's answer or adding an
unjustified new generator. Standalone topic instructions are unchanged.

Validation passes three focused Node regressions and 416 real-browser checks
with zero page errors. The tests compare all 26,400 paired generated IDs,
answers, solutions and variables with the video checkpoint, accept correct
answers, reject incorrect answers and preserve the original polynomial-form
rejection. Every changed record is rendered/graded in MathLive and legacy,
and all 44 actual editor/selector transitions pass. The permanent regression
fails against the old prompt helper on a radical difference quotient;
[before evidence](evidence/review-instructions-before.tap) and
[after evidence](evidence/review-instructions-node.tap) are retained.
Prep semantic QA separately passes 5,500 questions across eleven engines.
Static QA reports zero errors, warnings or broken references; the strict
content/source guard permits only the exact authored-prompt helper change.

## Checkpoint D — final integration QA complete

Site implementation: `96309582a69ea7c8b38d51156ae75ea47baf65b2`.
The final audit commit changes only documentation, evidence and test harnesses;
all website/runtime/style files remain identical to that tested implementation.
The delivery is pinned to the final pushed audit commit and is independently
checked against every included Git blob.

| Verification | Final result |
|---|---|
| Shared MathLive Node suites | **274/274**, zero failures/skips/cancellations |
| Complete route sweep | **374/374 visits across 138 routes**: 118 default, 118 legacy, 118 missing-runtime and 20 specialized |
| Broad keypad viewport probe | **118 editable default routes**, 708 actual ordinary-key activations |
| Detailed stability | **130/130 cases**, 16 controllers, 27 URLs, 3,232 measured activations, zero page errors |
| Focused functional browser suites | **132/132 checks**, 543 counted grader pairs, zero page errors |
| All 34 IM1 overlap pages at 375/768/1280px | **102/102** layout and physical typing/focus checks, zero page errors |
| Review instruction browser checks | **416/416**, all 93 changed records plus every actual selector transition, zero page errors |
| Generated instruction audit | **144,100 questions / 99 engine contexts / 5,352 family-selector-contract records** |
| Video presentation | **198 visits / 288 activations / 66 pages**, zero page errors |
| Content preservation | **34 overlaps / 90 IM1 pages / 96 exact HTML + 15 guarded video changes**; PDFs unchanged |
| Static/reference QA | **Zero errors, warnings and broken references**; 280 HTML pages, 290 PDFs |
| Unit 6 and protected branches | Exact original tree `f50ff9c7c56ca6b02c93d8f8bb88299b37ef2c11`; all observed protected source/main refs unchanged |

Ordinary-key maximum sampled movements are
`scrollX=0px`,
`scrollY=0px`, and
`keypad document Y=0.0px`.
Structural field reflow and intentional grading/validation are measured separately.
The original multiplication source still fails all four regression controls for
real movement/overflow, with no import or page errors. Its previously reported
375→458px overflow is resolved: 375px now stays 375px. Requested widths,
touch, desktop resizing and CSS zoom all pass. The previous integration's
101/102 responsive result is historical; the current result is 102/102.

The first final Node run passed 273/274: one historical Batch 7 source guard
rejected the two authorized legacy focus routes. That guard now uses the same
exact two-line normalization as the other preservation checks, only for
`calculus-keypad.js`; all remaining source bytes and functional assertions are
retained. A fresh complete rerun passes 274/274. Initial stability findings and
all focused corrections remain traceable in the B evidence; final results are
fresh runs, not relabeled earlier failures.

Evidence: [machine summary](evidence/FINAL-QA.json),
[Node run and attempt history](evidence/final-node-attempts.json),
[route sweep](evidence/route-sweep-final-d.json),
[full stability measurements](evidence/keypad-stability.json),
[focused browser suites](evidence/final-focused-regressions/contracts-summary.json),
[all overlap widths](evidence/final-overlap/overlap-responsive.json),
[final video QA](evidence/video-final-d.json),
[protected refs](evidence/protected-refs-final.json).

No confirmed functional, layout or instruction-loss defect remains in the
covered scope. The existing review has no genuine derivative-by-limit family;
that curriculum gap is documented, with no invented question or changed answer.
Chromium/touch and CSS-zoom emulation do not establish universal physical-device
or browser coverage. YouTube transport is simulated: actual recording
availability/audio is not verified. Numerical parameter sampling is finite,
supplemented by exact wrapper/source/answer preservation comparisons.

The complete `batchmath-mathlive-video-qa-corrections.zip` is created outside Git,
with all site content, 280 HTML pages, 290 PDFs and the pinned MathLive runtime/
fonts. QA tools, temporary artifacts and caches are excluded. The archive export policy
also excludes developer tooling and machine QA evidence from GitHub commit ZIPs,
while retaining every website page, resource and pinned runtime dependency. If direct file
delivery is unavailable, the final response supplies a GitHub ZIP URL pinned to
the exact tested final commit. Extract the site folder, open a terminal beside
`index.html`, run `py -m http.server 8000`, then open `http://localhost:8000/`.
Normal MathJax CDN/YouTube use requires internet.

Unit 6 remains byte-identical to MathLive source
`919ca1806f07e3cd2af552142926e7ca2b78e8d5`. No Claude branch is fetched or merged,
and no main/source branch update, production merge, release or deployment is
authorized or performed.
