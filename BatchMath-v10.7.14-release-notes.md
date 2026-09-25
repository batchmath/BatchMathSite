# BatchMath v10.7.14 — Nine Key Features and Limits Refinement

## IM Unit 2: Coordinate System and Nine Key Features

- Mixed practice now samples the nine key features at equal 1/9 probability; Coordinates of a Point remains available as its own focus without diluting that distribution.
- Increasing, decreasing, and constant intervals now use parentheses when a section meets an open graph endpoint, brackets for included finite endpoints, and parentheses at infinity.
- Every intercept question includes both an x-intercept and a y-intercept answer possibility.
- Graphs are larger, use stronger axis and label contrast, and show markers only at meaningful endpoints rather than at every intermediate vertex.
- Unit 2 Comprehensive Review uses the same updated shared generator.

## AP Calculus: Classifying Discontinuities

- Removed displayed powers of one from expressions and explanations across every discontinuity family.
- Protected piecewise inequalities before HTML rendering, fixing the literal-TeX and malformed-condition failure shown in the supplied PDF.
- Preserved all 13 current families, multiple-location behavior, the approximately 95% expanded / 5% factored split, and the existing domain and endpoint conventions.
- The focused engine and Comprehensive Review continue to use the same shared generator.

## AP Calculus: Intermediate Value Theorem

- Fixed answer-choice rendering by keeping reason statements as readable text instead of wrapping an entire sentence as one math expression.
- Replaced target variable `N` with `w`.
- Preserved the 50/50 Guaranteed Value / Verify a Root split.
- Expanded Verify a Root to 15 equally sampled, parameterized families: unfactored quadratic and cubic polynomials, a same-sign polynomial contrast, sine, cosine, a positive-interval trig quotient, continuous rational functions, interior poles, interior holes, valid and invalid radical intervals, valid and invalid logarithmic intervals, rational-times-root interval selection, and exponential compositions.
- Explanations explicitly address continuity on the full closed interval, endpoint values or signs, target placement, and the exact conclusion IVT does or does not guarantee.
- AP Comprehensive Review calls this same shared IVT generator.

## Verification

- Added regression checks for the 1/9 feature distribution, open-endpoint interval notation, intercept distractors, endpoint-only graph markers, readable IVT choices, equal IVT root-family sampling, target-variable naming, power-of-one removal, safe piecewise inequalities, and review synchronization.
- No changes were made to Continuity Parameters.
- No deployment was performed.
