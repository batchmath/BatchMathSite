# BatchMath v10.7.13 — Trig Display and Infinity Practice Update

## Regular Squeeze / Trigonometric Limits

- Normalized TeX at the shared math boundary so the nonlinear-argument, expanded cosine-fourth, mixed trig-product, squeeze-bounds, and reciprocal-root families no longer expose raw commands such as `displaystyle`, `lim`, or `frac`.
- Removed displayed powers of one while preserving typed answers and the established 20% squeeze / 80% trigonometric allocation.
- Added an automated display scan across all 25 generated variants.

## Limits at Infinity

- Enforced balanced positive- and negative-infinity approaches in every focus group and in Mixed practice.
- Reweighted Mixed practice to 17.5% rational/polynomial, 25% radicals, 32.5% exponential/logarithmic, 20% growth-rate comparisons, and 5% oscillation.
- Removed Oscillation at Infinity from the focus menu while retaining it at about 5% in Mixed practice and the shared Comprehensive Review adapter.
- Increased logarithmic/exponential compositions and gave `ln(constant/f(x))` a substantial share of the exponential/logarithmic focus.
- Added Growth-Rate Comparisons, including exponential versus high polynomial powers, polynomial versus root, root versus logarithm, and reverse quotients.
- Limited complex radical layouts (roots in both numerator and denominator or outside-root cancellation forms) to about 12.5%; the remaining radical problems put a radical on only one side of the quotient.
- Renamed and rebuilt End Behavior and Horizontal Asymptotes with a separated prompt, displayed function, readable answer rows, five families, both end limits, and all finite horizontal asymptotes.

## Shared Review and QA

- Comprehensive Review now calls the same updated mixed Limits at Infinity adapter.
- Preserved all 24 legacy infinity families and the existing Advanced Trigonometric Limits engine.
- Added distribution, direction, radical-structure, log-reciprocal, growth-family, and end-behavior regression checks.
