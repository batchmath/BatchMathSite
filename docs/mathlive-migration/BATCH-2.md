# Batch 2 — remaining Integrals and Differential Equations

15 additional practice routes default to local MathLive, retaining ?editor=legacy. Seven Unit 4 topics and eight Unit 5 calculator/non-calculator/topic pages are covered. Three Unit 5 practice-navigation pages stay unchanged. Reviews/assignments remain Batch 8 work.

## Engine and field checklist

| Unit | Engine | Reachable families / field contracts |
| --- | --- | --- |
| 4 | U-substitution | 11 weighted families; antiderivatives in x/t/θ/r with student-entered C; exact definite values |
| 4 | Natural-log / inverse-trig integrals | 8 families; antiderivatives with C, absolute value, asin/atan; exact definite values |
| 4 | Integral MVT | 5 families; exact averages; exact c lists / inverse-trig values / Does not apply |
| 4 | Sigma | Numerical, identities and Riemann: all 12 subtypes; integer values or expressions in n, no sum/limit entry |
| 4 | Rectangular / trapezoidal | 9 function families; table/function data; left/right/midpoint/trapezoidal methods; exact values; estimate/behavior choices retained |
| 4 | Geometry | 7 area families; exact rational/π values |
| 5 | Basic first-order DE | 6 families; every declared tier/calculator axis; x/t IVPs, general solutions with C, validity intervals, rounded values |
| 5 | Growth/decay/cooling/interest | 6 families; exact logarithmic parameters, t model functions, rounded decimals/money |
| 5 | Motion | 8 families; exact/rounded values, functions, exact/rounded lists and intervals; qualitative choices retained |
| 5 | Rate problems | 5 families; exact integer/π/log values and rounded calculator values |
| 5 | Slope fields | 4 families; exact slopes/second derivatives, zero-slope equations, equilibrium lists, increasing intervals; segment/curve drawing and graphical choices retained |

Per-family/profile evidence: tools/mathlive-sitewide/artifacts/staged-node.json. Browser fixtures use native generators, retaining functions and infinite endpoints.

## Verified implementation and keypads

- Extend the existing dynamic adapter with an optional keypad override. Existing pilot contracts have no override and retain their behavior. Each original part still selects its editor and checker.
- Separate expression, rounded-number, exact/rounded-list and interval contracts. Preserve equality labels, order, duplicates, brackets, unions and result tokens. Original checkers enforce exactness, rounding, C, domains and set requirements.
- Preserve ± inside groups/fractions; expansion remains in the original Unit 4 checker. Regressions cover native MathLive output without spacing after the operator and a quadratic-form fraction.
- Scoped keypad corrections: growth-model arithmetic; MVT nth roots/±; radical alternatives in general solutions; exact evaluation arithmetic/fractions/powers and appropriate trig/log constants; terminating decimals where the Unit 5 checker accepts them. Rounded-only fields keep small decimal keypads.
- The unit4-exact field selects a small numerical-sum profile on Sigma and an exact-height profile on approximation pages. C, variables, functions and list/interval punctuation remain part-specific. No integral/sum/limit controls are added when students enter an antiderivative, scalar or expression in n.
- Infinity buttons retain math-infinity-key styling, only in existing unbounded-interval contracts. No global editor preference or generator/checker changes.

## Tests

- 17/17 new Node tests: 4,860 generated questions; 5,506 mathematical parts; 23,028 original/translated checker comparisons. Correct displayed mathematics, wrong/blank/incomplete input, missing C, lists, precision and source integrity are checked.
- Unit 5 samples cover every declared family/tier/calculator combination. Sigma covers all 12 subtypes; rectangular sampling covers all three methods. Other coefficient/tree/representation combinations are sampled, not exhausted.
- 15/15 routes pass Chromium grading/progression and 375 px field checks, with native generators, real local MathLive/fonts and same-origin MathJax fixtures. Initial grading run: 121 pairs; expanded field/profile run and targeted reruns are linked by staged-browser-complete.json.
- Physical fractions, selection/deletion, actual arithmetic/decimal/C/root/nth-root/±/infinity/DNA controls and Enter are exercised. Calculator and non-calculator routes are checked separately. Drawing and graphical/qualitative controls remain present.
- Existing Basic Integrals browser regression: 22/22, including Enter/held Enter, reset/history, selection, undo/redo, clipboard, missing runtime/fonts/styles, answer-preserving recovery and an uninstrumented real page. Existing derivative keypad/source regressions: 21/21.

## Limits

No mathematical defect was confirmed in Batch 2. Generators, graders, mode definitions, explanations and renderer code are byte-identical to Batch 1B. Display-only gathered lines, thousands formatting and unit suffixes are removed from test answer previews; the adapter does not accept unit suffixes the checker rejects. Arbitrary identity-based alternatives, every coefficient/angle, physical devices and assistive technology are not exhaustively certified. Legacy fallback remains available for unsupported notation.

No main/Unit 6/content-branch edits, merge, deployment or ZIP.

## Route checklist

| Route | Converted fields |
| --- | --- |
| integrals-resulting-in-natural-log-and-inverse-trigonometric-functions/practice | Original typed staged parts; selections/drawings retained |
| integrals-using-geometry/practice | Original typed staged parts; selections/drawings retained |
| introduction-to-sigma-notation/practice | Original typed staged parts; selections/drawings retained |
| mean-value-theorem-for-integrals/practice | Original typed staged parts; selections/drawings retained |
| rectangular-approximations/practice | Original typed staged parts; selections/drawings retained |
| trapezoidal-approximations/practice | Original typed staged parts; selections/drawings retained |
| u-substitution-integrals/practice | Original typed staged parts; selections/drawings retained |
| basic-first-order-differential-equations/calculator-practice | Original typed staged parts; selections/drawings retained |
| basic-first-order-differential-equations/non-calculator-practice | Original typed staged parts; selections/drawings retained |
| exponential-growth-and-decay-interest-newton-s-law-of-cooling/practice | Original typed staged parts; selections/drawings retained |
| motion-problems/calculator-practice | Original typed staged parts; selections/drawings retained |
| motion-problems/non-calculator-practice | Original typed staged parts; selections/drawings retained |
| rate-problems/calculator-practice | Original typed staged parts; selections/drawings retained |
| rate-problems/non-calculator-practice | Original typed staged parts; selections/drawings retained |
| slope-fields/practice | Original typed staged parts; selections/drawings retained |

Focused new-profile recovery tests also pass on Geometry and Growth: current answers survive an injected runtime-command failure and still grade correctly in the restored editor; a delayed missing runtime preserves a typed legacy answer. Reproduction: run node --test tools/mathlive-sitewide/staged.test.mjs tools/mathlive-sitewide/contracts.test.mjs; run staged-browser.mjs with CONTROLS=1 ENTER=1 SPECIALIZED=1. Set MATHJAX_FIXTURE_ROOT to a directory containing cached mathjax and mathjax-newcm fixtures for full rendering checks.
