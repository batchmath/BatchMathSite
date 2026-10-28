# Targeted Newton sums revision

Baseline: completed N package `561ca3e1a20ded8a0443bed73d07b3a00d1ccf70`.

This revision changes only Evaluating Definite Integrals with a Limit and Summation, including its shared Newton factory when selected through review. Other generators, topic pages, modes, resources, global versions, and release tags are preserved. Shared editor, checker, renderer and CSS changes are guarded by the Newton answer kind/profile/classes.

- Remove the redundant Part 1 prompt, including its copy under Completed Part 1.
- Give ordinary question/equation boxes natural content height, modest minimum sizes and sufficient vertical padding. Vertical micro-scrollbars are removed without shrinking mathematics; long equations retain horizontal scrolling.
- Use stacked TeX fractions throughout setup, identities, finite sums, limits and feedback.
- Add editable limit and summation structures to the existing math editor. Limit direction, lower index, upper bound, and body have separate cursor/pointer zones. The keypad includes the notation, variables and functions used here, with a smaller numerical keypad for Part 2.
- Keep physical typing, cursor navigation, structured fractions/exponents, selection, clipboard, undo/redo and the approved staged Check/Enter/Next flow.
- Show delta x, the right endpoint, the actual summand, the finite sum, expansion, only the relevant identities, the simplified finite sum in n, the explicit limit of that expression, substitution of limiting ratios, and the exact result.
- For the supplied 4x on [-3,3] example, display the finite sum `-72 + 72(n+1)/n`, then its explicit limit, then `-72 + 72(1)`, then `0`. No square-sum identity is shown.
- Retain the evaluated polynomial families and approximately 80% evaluated / 20% construction-only mix. Expand the latter to eight patterns covering polynomial/trig, exponential/tangent, polynomial/exponential, radical/linear, exponential/cosine, rational/polynomial, logarithm/polynomial and logarithm/radical combinations. Each has exactly two top-level terms and a continuous integrand over its interval.
- Accept complete limit/summation expressions, ordinary unsimplified equivalents, and the previously accepted summand forms. Delta x may be factored outside the summation. Common TeX/Unicode paste and root/half-power equivalents work; incorrect direction, bounds, or terms are rejected.

Validation:

- 10,000 deterministic targeted cases, including 5,118 nonnegative, 2,034 nonpositive, and 2,848 mixed-sign intervals; all eight construction-only patterns; complete notation and equivalence checks; relevant-identity and explicit-limit sequence checks.
- Independent broader N mathematics: 48,000 cases. The revised Newton sample has 9,299 distinct visible tasks/IDs in 12,000 raw samples, with no immediate repeats. The other three engines retain their baseline deterministic measurements.
- All 38 other shared factories and all ten unrelated Unit 4 review modes produce identical baseline outputs for the tested seeds.
- Actual browser checks at 1280, 1024 (768 px high), and 390 px widths verify the PDF's example, all revised families, real key/keyboard construction, edits, layout and feedback.
- Before/after screenshots and editor DOM for Rectangular, Trapezoidal, Sigma, FTC and Geometry match exactly at desktop/mobile widths. Every other existing keypad profile also retains identical markup, controls, dimensions and computed styles in the browser.
- The existing N workflow retains its independent M/N regressions and all 17 production-equivalent QA commands, and adds the two Newton-focused suites. The production QA workflow itself remains unchanged.

No production deployment or replacement of the completed N prerelease is part of this targeted revision. A source ZIP at the final green commit provides the updated test build.
