> Final status: this is historical checkpoint evidence. Remaining reviews and the full approved-scope inventory are completed in [Batch 8](BATCH-8.md) and [FINAL-AUDIT.md](FINAL-AUDIT.md).

# Batch 3 — AP Calculus Unit 3 topic fields

Implemented on migration/mathlive-sitewide after Batch 2 commit 1c95ed904133521320ede2b03ca27bda8a1f7a51. All 19 topic routes default to MathLive; ?editor=legacy remains. Comprehensive reviews were subsequently completed in Batch 8.

## Engine/field checklist

Listed contracts are the original renderer modes. applications-profiles.mjs selects each verified keypad. Exact family names/grammar are retained in artifacts/applications-node.json; optimization/rates descriptors and visible selectors in applications-families.json.

| Topic / route variant | Mathematical fields | Sampled variants | Contracts |
|---|---|---:|---|
| ✓ absolute-and-local-extrema-and-the-extreme-value-theorem (noncalc) | exact-expression, value-list | 23 | unit3-exact, unit3-list |
| ✓ equations-of-tangent-and-normal-lines (noncalc) | line-equation | 62 | unit3-equation |
| ✓ horizontal-and-vertical-tangent-lines (noncalc) | line-equation | 17 | unit3-equation |
| ✓ horizontal-and-vertical-tangent-lines-implicitly (calc) | rounded-line-fields | 11 | unit3-rounded-line |
| ✓ horizontal-and-vertical-tangent-lines-implicitly (noncalc) | line-equation, value-list | 19 | unit3-equation, unit3-list |
| ✓ increasing-decreasing-intervals-concavity-and-extrema (calc) | interval-answer, numeric | 68 | unit3-rounded, unit3-interval |
| ✓ increasing-decreasing-intervals-concavity-and-extrema (noncalc) | extremum-fields, interval-answer, ordered-pair | 26 | unit3-pair, unit3-interval, unit3-coordinate |
| ✓ l-hopital-s-rule (noncalc) | staged-calculus | 42 | unit3-limit |
| ✓ linearization-and-differentials (noncalc) | exact-expression | 20 | unit3-exact |
| ✓ motion (calc) | numeric | 16 | unit3-rounded |
| ✓ motion (noncalc) | exact-expression, value-list | 24 | unit3-exact, unit3-list |
| ✓ newton-s-method-for-approximating-roots-of-a-function (noncalc) | numeric | 5 | unit3-rounded |
| ✓ optimization (calc) | calculus-fields, numeric | 27 | unit3-rounded |
| ✓ optimization (noncalc) | calculus-fields, exact-expression | 36 | unit3-geometry-exact |
| ✓ related-rates (calc) | calculus-fields, numeric | 41 | unit3-rounded |
| ✓ related-rates (noncalc) | calculus-fields, exact-expression | 41 | unit3-geometry-exact |
| ✓ rolle-s-theorem-and-the-mean-value-theorem (noncalc) | staged-calculus | 60 | unit3-theorem |
| ✓ tangent-and-secant-line-approximations (noncalc) | staged-calculus | 33 | unit3-approximation |
| ✓ using-your-graphing-calculator (noncalc) | numeric | 10 | unit3-rounded |

## Preserved grading and serialization

Generators, graders, renderer and inline configuration are byte-for-byte unchanged (source-isolation regression). Contracts distinguish expressions, Number-first numerics, equations, lists, ordered pairs and intervals. Trailing decimal zeros remain intact: calculator values, interval endpoints and rounded lines still face original exact-three-decimal checks. Expressions never become rounded literals.

Explicit multiplication prevents a MathLive product such as 2 e 3 becoming JavaScript numeric literal 2e3. Late import of a legacy scientific numeric literal preserves its meaning through unevaluated multiplication by a power of ten. Equation sides, grouping, order, duplicates and approximation annotations remain. Compact U and inf interval aliases are transported without changing brackets.

Nth roots use structural fractional powers where the old Unit 3 parser lacks root. Line coefficients also lower square roots to constant powers because that checker has no function identifiers. No evaluation, simplification, factoring or equation solving occurs. Negative odd-radicand real-root extensions are not introduced into the old checker.

## Verified keypad corrections

- Exact tangent/normal and implicit lines gain missing pi, e and radical coefficients, alongside fractions, powers, arithmetic, x/y and equality. Unsupported logarithm/trig coefficient controls are excluded.
- Exact geometry gains nth roots for positive cubic-root forms. No unrelated trig, log, equation or interval keys.
- Exact extrema/motion retain ln, e, pi, roots/powers plus sin/cos for relevant function evaluation forms. Linearization uses a smaller algebraic/pi profile.
- Pairs and separate coordinates retain distinct contracts, constants, logs, roots and relevant trig/inverse trig. Comma appears in the pair field.
- Exact intervals have arithmetic, roots/powers, logs/constants, inverse-trig endpoints, brackets, union and signed infinity. Calculator intervals instead use decimal endpoints and interval punctuation, preserving strict precision.
- Polynomial critical-value lists gain powers and omit irrelevant pi. Theorem lists retain constants, logs, trig/inverse trig and comma.
- Tangent/secant stage 1 uses exact expressions and relevant functions. Under/Over stays separate stage-2 choices.
- Reachable L'Hopital typed stage-2 results are finite: DNE/infinity are omitted only from this field. Applicability remains choices.
- Rounded numbers/lines retain compact decimal keypads. Infinity keys inherit existing styling.

## Evidence and limits

- 1,200 native deterministic samples per route: 22,800 questions, 22,052 typed questions, 110,260 original/translated checker comparisons. Correct, wrong, blank, incomplete and +0 cases retain result/feedback/disabled behavior.
- All visible selector values receive another 40 samples. Every applicable optimization/rates assignment/test/extension descriptor receives five direct native builds, accepted-path comparisons and wrong answers; aliases recorded separately.
- 30 new Unit 3 Node tests, 17 shared Unit 4/5 tests and 67 focused original derivative/source-keypad regressions pass.
- Chromium 154, real local MathLive and same-origin real MathJax: 19/19 routes, 185 paired submissions, no page errors. Supplementary browser reports cover keypad controls, Enter, next-question progression, multipart focus, 375px layout and runtime recovery.
- Theorem/applicability/classification choices, selectors and graphical context remain specialized. Current topic registries do not reach older mixed text/classification renderer paths.
- This covers enumerated source templates and sampled coefficients, not arbitrary equivalent identities or physical-device/accessibility certification. Legacy checker decisions are preserved. No new mathematical defect confirmed.
- Subsequent batches completed Unit 1, IM1, Calculus Prep and mixed/review routes; see FINAL-AUDIT.md.
