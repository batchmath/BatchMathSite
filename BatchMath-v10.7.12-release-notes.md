# BatchMath v10.7.12 — Limits Interface and Variety Update

## Introduction to Limits

- Enlarged graph practice to a 900-by-585 view box with a responsive 930-pixel desktop presentation.
- Rebuilt graph practice as 3–5 consecutive limit questions about one unchanged graph.
- Restricted graph prompts to one-sided and two-sided limits. Point-value, continuity, undefined-versus-DNE, and unbounded prompts were removed.
- Every graph displays the closed domain `[-6,6]`; endpoint questions use the admissible one-sided approach.
- Table practice now omits the target input and assesses nearby limit behavior only.

## Limits of Continuous Functions and shared answer entry

- Combined the former Core/Later presentation into one mixed continuous-function engine.
- Added richer polynomial, rational, radical, nth-root, trigonometric, exponential, and logarithmic compositions while preserving the algebra-only Basic Techniques allocation.
- Corrected trigonometric TeX construction.
- The shared calculus answer editor now takes focus as soon as a problem is ready, including when a legacy engine focuses its hidden source input.
- Rebuilt the nth-root control as separately editable index and radicand zones stored as `root(index,radicand)`.

## Finite-point oscillation and one-sided limits

- Cleaned oscillation amplitudes, parentheses, text answer choices, and first powers.
- Preserved the logical distinction among squeeze success, inconclusive bounds, and a separate oscillation proof of DNE.
- Expanded absolute-value, rational/pole, piecewise, and domain-endpoint one-sided families and widened coefficient/approach-value ranges.
- Reworked infinite-limit explanations to state numerator sign, denominator sign from the requested side, and the resulting quotient sign.
- Added a shared display cleanup that suppresses first powers across affected Limits engines.

## Comprehensive Review and release integrity

- Comprehensive Review uses the same updated continuous, graph, oscillation, and one-sided generators as the focused engines.
- Multi-part graph sets stay together before the review samples another category.
- Updated application, analytics, reproducibility, PWA, and service-worker versions to 10.7.12.
- No deployment was performed.
