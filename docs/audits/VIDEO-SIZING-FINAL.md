# Final instructional-video sizing audit

Final v12.9.E scope: 72 video pages and 215 players, including six Unit 6 pages and 17 players. Fresh sizing: 370/370 visits, 1,141 player measurements, zero errors. The 66-page audit below records Source A history. Current evidence: `../final-integration/evidence/video-sizing-v12.9.E.json`.

Starting checkpoint: `63ef79b1271974072daa2f1f99a968671a45f2c7` on
`integration/mathlive-im1-videos-content`. The approved lecture/supporting
hierarchy was preserved. Unit 6 was excluded at that historical checkpoint; the final E scope above includes all six Unit 6 video pages.

## Inventory and decisions

A fresh scan of AP Calculus Units 1–5, IM1 Units 1–3 and Calculus Prep finds
**66 video-bearing pages and 198 recordings**. There are no video players in
Calculus Prep or IM1 Units 1/3, and no unrelated iframe embeds in these scanned
course pages. Six Unit 6 video-bearing pages are explicitly deferred.

| Player system | Recordings | Existing sizing / decision |
|---|---:|---|
| Shared large inline | 55 | Up to 760px, 16:9; retain |
| Shared two-video collections | 8 | Two medium inline cards on desktop, stacked on mobile; retain |
| Shared modal-gallery cards | 33 | Compact supporting/collection cards, fit-to-viewport modal up to 1600px; retain |
| Expandable homework walkthroughs | 95 | Width constrained by assignment card; 16:9; retain handlers and sizing |
| Expandable Unit 1 review videos | 7 | Previously capped at 560px despite additional usable space; widen within the existing card |

The [source inventory](VIDEO-SIZING-INVENTORY.json) records each actual player,
role, source URL, title, card/slot and playback attributes. It counts legacy
iframes outside `[data-bm-videos]`, rather than treating the shared grids as the
whole inventory. All 66 HTML sources are byte-identical to the starting
checkpoint: IDs, ordering, thumbnail configuration, timestamps, accessibility
attributes, homework placement and handlers are unchanged.

## Confirmed defects and corrections

**Unit 1 comprehensive-review width.** Seven `.review-video-frame` recordings
occupied 560px inside a 730px usable card on desktop. There is no side-by-side
workflow requiring the smaller width. A reusable scoped rule in `assets/site.css`,
`body .review-video-slot .review-video-frame{width:min(100%,760px)}`, permits the
same instructional width as the assignment players. The frame stays centered
and retains its existing 16:9 aspect and expand/collapse interface.

| Viewport | Before outer frame | After outer frame | Decision |
|---|---|---|---|
| 320px | 254 × 142.875px | 254 × 142.875px | Preserve mobile scaling |
| 375px | 309 × 173.8125px | 309 × 173.8125px | Preserve mobile scaling |
| 390px | 324 × 182.25px | 324 × 182.25px | Preserve mobile scaling |
| 768px | 560 × 315px | 702 × 394.875px | Use available card width |
| 1280px | 560 × 315px | 730 × 410.625px | Use available card width |

At 1280px the actual iframe grows from 558×313 to 728×408.625px: approximately
30% more width and 70% more display area for mathematical writing. This is a
geometry/readability improvement, not certification of the handwriting in every
external recording. The usable card width, not an arbitrary full-page iframe
rule, remains the limit.

**320px Unit 3 topic heading.** The Increasing/Decreasing Intervals, Concavity
and Extrema page had 344px document width because its compound heading did not
wrap; its players already fit. The new wrapping rule is limited to screens at
most 360px and the existing Unit 3 breadcrumb context. Document width is now
320px. Text, font sizing, routes and video roles are unchanged. Overflow is
resolved at its cause; no overflow-hiding workaround is used. Neither new
selector matches the excluded Unit 6 pages.

The initial all-page run after the review-width correction passed 339/340 visits;
the remaining 320px flag identified the heading defect. Its focused rerun passes
5/5, and a fresh all-page run now passes 340/340. The original width report and
initial finding remain in evidence; failed results are not relabeled as passes.

## Special overrides retained

Chain Rule “Derivatives from Tables” (`07a-tables`) and Quotient Rule's analogous
`05a-tables` retain their intentional auto-height wrapper and 16:9 iframe rule.
At 1280px the Chain Rule wrapper measures 730×412.375px, including its borders;
the iframe fits within it at 16:9. It scales to 254×144.625px at 320px and
702×396.625px at 768px. No extra wrapper height, distortion, title/control overlap
or clipping is reproduced. Removing the override would be an unnecessary change.

All other standard and expandable players retain their existing layout and
educational role. Homework and review controls remain attached to their original
resources; no handlers or iframe source settings were replaced. Inline content
lives in normally scrollable pages. Short-height modals, including their title
and Close control, are tested fully within the viewport.

## Browser verification

The new sizing suite passes **340/340 page/viewport visits** and **1,056 actual
player checks**, with **zero page errors**. Every recording is activated or
expanded at 320/375/390/768/1280px. Five representative pages also run at 844×390
landscape and 1280×480 short height. Assertions cover actual iframe geometry,
16:9 ratios, usable width, parent containment, no horizontal overflow, title/
control overlap, collapse state, modal fitting, Escape/Close/backdrop behavior,
iframe removal and focus restoration. Source URLs, including parameters, are
compared on every activation.

The existing presentation regression also passes **198 visits / 288 activations**,
zero page errors; IM1 mappings, lazy players, gallery rules and specialized
controls remain intact. Static QA reports zero errors, warnings and broken
references. The independent preservation audit still passes all 34 reconciled
IM1 files, all 90 IM1 pages, the approved content/video changes, all PDFs and
exact Unit 6 tree protection.

YouTube responses and thumbnails are simulated for deterministic DOM testing.
Actual recording availability, audio, baked-in letterboxing and subjective
handwriting quality are not certified. Chromium viewport/touch emulation does
not establish every physical device/browser combination.

Evidence: [complete sizing measurements](evidence/video-sizing.json),
[review before](evidence/video-sizing-review-before.json),
[review after](evidence/video-sizing-review-after.json),
[initial all-page finding](evidence/video-sizing-initial.json),
[320px before](evidence/video-sizing-overflow-before.json),
[320px after](evidence/video-sizing-overflow-after.json).

Reproduce with `python3 tools/video-sizing-inventory.py --verify` and
`node tools/video-sizing-qa.mjs`. `VIDEO_SIZE_FILTER`, `REPORT_SUFFIX` and
`VIDEO_SIZE_CONCURRENCY` support focused checks without replacing the full result.

## Every page inspected

“Retain” records an actual measured no-change decision. The two corrections are
shared CSS; no video HTML file was edited.

| Page | Shared large / paired / gallery recordings | HW | Review | Decision |
|---|---:|---:|---:|---|
| `ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/index.html` | 0 / 2 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/index.html` | 0 / 0 / 0 | 4 | 7 | Widen 7 expandable review frames |
| `ap-calculus/unit-1-limits-continuity/topics/delta-epsilon-proofs/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-1-limits-continuity/topics/intermediate-value-theorem/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-1-limits-continuity/topics/introduction-to-continuity/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-1-limits-continuity/topics/introduction-to-limits/index.html` | 1 / 0 / 0 | 0 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/index.html` | 0 / 2 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-1-limits-continuity/topics/limits-of-continuous-functions/index.html` | 1 / 0 / 0 | 0 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-1-limits-continuity/topics/one-sided-limits/index.html` | 1 / 0 / 0 | 0 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-1-limits-continuity/topics/sin-one-over-x/index.html` | 1 / 0 / 0 | 0 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/comprehensive-review/index.html` | 0 / 0 / 0 | 4 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/derivatives-of-inverse-functions/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/derivatives-of-logarithmic-functions/index.html` | 1 / 0 / 1 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/derivatives-of-trigonometric-functions/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/index.html` | 1 / 0 / 2 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/difference-quotient/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/exponential-functions/index.html` | 1 / 0 / 1 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/implicit-differentiation/index.html` | 1 / 0 / 1 | 4 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/inverse-trigonometric-functions/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/logarithmic-differentiation/index.html` | 1 / 0 / 1 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/the-chain-rule/index.html` | 1 / 0 / 3 | 6 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/the-product-rule/index.html` | 1 / 0 / 2 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-2-derivatives/topics/the-quotient-rule/index.html` | 1 / 0 / 2 | 3 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/absolute-and-local-extrema-and-the-extreme-value-theorem/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/index.html` | 0 / 2 / 0 | 3 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/equations-of-tangent-and-normal-lines/index.html` | 1 / 0 / 4 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/graphing-functions/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/graphing-the-derivative/index.html` | 1 / 0 / 0 | 0 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines/index.html` | 1 / 0 / 0 | 0 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines-implicitly/index.html` | 1 / 0 / 1 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/increasing-decreasing-intervals-concavity-and-extrema/index.html` | 1 / 0 / 1 | 2 | 0 | Wrap compound heading at ≤360px; retain players |
| `ap-calculus/unit-3-applications-derivative/topics/l-hopital-s-rule/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/linearization-and-differentials/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/motion/index.html` | 1 / 0 / 2 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/newton-s-method-for-approximating-roots-of-a-function/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/optimization/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/related-rates/index.html` | 1 / 0 / 1 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/rolle-s-theorem-and-the-mean-value-theorem/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/semester-1-review/index.html` | 0 / 0 / 0 | 5 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/tangent-and-secant-line-approximations/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-3-applications-derivative/topics/using-your-graphing-calculator/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/basic-integrals/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/comprehensive-review/index.html` | 0 / 0 / 0 | 4 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/converting-a-rectangular-approximation-into-exact-area/index.html` | 1 / 0 / 0 | 0 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/evaluating-definite-integrals-with-a-limit-and-summation/index.html` | 1 / 0 / 1 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/integrals-resulting-in-natural-log-and-inverse-trigonometric-functions/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/integrals-using-geometry/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/introduction-to-sigma-notation/index.html` | 1 / 0 / 0 | 0 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/mean-value-theorem-for-integrals/index.html` | 1 / 0 / 1 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/rectangular-approximations/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/trapezoidal-approximations/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-4-integrals/topics/u-substitution-integrals/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-5-differential-equations/topics/basic-first-order-differential-equations/index.html` | 1 / 0 / 0 | 3 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-5-differential-equations/topics/comprehensive-review/index.html` | 0 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-5-differential-equations/topics/exponential-growth-and-decay-interest-newton-s-law-of-cooling/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-5-differential-equations/topics/motion-problems/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-5-differential-equations/topics/rate-problems/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-5-differential-equations/topics/separable-differential-equations/index.html` | 1 / 0 / 0 | 2 | 0 | Retain measured layout and controls |
| `ap-calculus/unit-5-differential-equations/topics/slope-fields/index.html` | 1 / 0 / 0 | 1 | 0 | Retain measured layout and controls |
| `im1/unit-2-algebraic-operations-equations-inequalities/topics/coordinate-system-nine-key-features/index.html` | 0 / 0 / 4 | 0 | 0 | Retain measured layout and controls |
| `im1/unit-2-algebraic-operations-equations-inequalities/topics/distributive-property/index.html` | 1 / 0 / 0 | 0 | 0 | Retain measured layout and controls |
| `im1/unit-2-algebraic-operations-equations-inequalities/topics/equivalent-expressions-combining-like-terms/index.html` | 1 / 0 / 0 | 0 | 0 | Retain measured layout and controls |
| `im1/unit-2-algebraic-operations-equations-inequalities/topics/graphing-inequalities-interval-notation/index.html` | 0 / 2 / 0 | 0 | 0 | Retain measured layout and controls |
| `im1/unit-2-algebraic-operations-equations-inequalities/topics/solving-linear-equations/index.html` | 0 / 0 / 5 | 0 | 0 | Retain measured layout and controls |
