# BatchMath v10.7.8 — Limits Sections 6–7

Built from v10.7.7 under the standing scope, exact-answer/input, explanation/presentation, and validation/delivery requirements in sections 1, 2, 16, and 17.

## Understanding sin(1/x)

- Preserved as a separate conceptual engine.
- Added sine, cosine, absolute-value forms, vanishing amplitudes, nonzero amplitudes, and `e^x sin(1/x)` behavior.
- Separates: squeeze proves a limit when bounds converge together; unequal bound limits make squeeze inconclusive; separate persistent oscillation can prove DNE.
- DNE explanations use different approaches or persistent oscillation, never the invalid bounds-only inference.
- Added explicit `sin(x)/x` versus `sin(1/x)` comparison.
- Comprehensive Review uses this shared generator.

## One-Sided Limits

- Added Mixed (default), Absolute Value, Rational / Infinite Behavior, Piecewise, and Domain Endpoints focus settings.
- Mixed selects the four groups equally.
- Preserved the original four forms and added reversed signs, coefficients, products, side-dependent cancellation, nonconstant numerators, multiplicities, repeated factors, removable cases, and cancellation leaving a pole.
- Added linear/quadratic piecewise functions, independent point definitions, matching/nonmatching sides, roots, logs, and exponential endpoint compositions.
- Added linked left/right/two-sided sequences that retain one function.
- Explanations identify the branch/domain and show numerator/denominator sign reasoning.
- Comprehensive Review uses the same shared generator.

## Validation

- Dedicated family QA forces each oscillation family 250 times, samples 24,000 focused One-Sided cases, 1,600 linked sequences, and 100,000 Mixed cases.
- Full non-browser regression suite passed, including 220,000 deterministic AP stress problems.
- Browser checks were not run because Chromium is unavailable; see the recheck list.

