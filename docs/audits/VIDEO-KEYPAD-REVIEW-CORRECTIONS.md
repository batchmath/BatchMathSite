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

## Remaining checkpoints

1. Reproduce and measure keypad movement; repair shared causes and multiplication
   overflow; audit mouse, keyboard, touch and legacy behavior across architectures.
2. Audit generated questions and instructions in every reachable comprehensive,
   mixed and section-review family; correct demonstrated prompt loss and add
   deterministic generator/rendering/grading tests.
3. Run final MathLive, route, stability, instruction, video, static and preservation
   regressions; record exact results and deliver the full-site test archive.

Unit 6 remains byte-identical to MathLive source
`919ca1806f07e3cd2af552142926e7ca2b78e8d5`. No Claude branch is fetched or merged,
and no main/source branch update, production merge, release or deployment is
authorized or performed.
