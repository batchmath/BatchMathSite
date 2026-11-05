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

## Remaining checkpoints

1. Restore Mixed Derivatives' authored instructions; finish the generated-family
   ledger, deterministic prompt/answer tests and browser transition checks.
2. Run final Node, 138-route, focus, stability, instruction, video, static and
   preservation checks; record exact results and deliver the full-site archive.

Unit 6 remains byte-identical to MathLive source
`919ca1806f07e3cd2af552142926e7ca2b78e8d5`. No Claude branch is fetched or merged,
and no main/source branch update, production merge, release or deployment is
authorized or performed.
