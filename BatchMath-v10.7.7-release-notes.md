# BatchMath v10.7.7 — Limits and Continuity, Part 1

## Standing rebuild rules retained

The approved scope/progression rules, exact-answer requirements, explanation/presentation requirements, and validation/delivery requirements (items 1, 2, 16, and 17 of the rebuild prompt) remain the working rules for the next Limits rebuilds.

## Engine changes

### Introduction to Limits: Tables and Graphs

- Added **Mixed** as the default setting while retaining **Tables** and **Graphs**.
- Mixed delivers exactly eight table questions and eight graph questions in each 16-problem cycle. The graph questions stay together so a linked multi-part graph does not disappear midway through its sequence.
- Preserved existing table and simple-graph families.
- Added multi-feature graph sets with holes, separate point values, jumps, continuous junctions, vertical asymptotes, finite-domain endpoints, open/closed endpoints, and varied piece shapes.
- Added linked questions about point value, left limit, right limit, two-sided limit, continuity, interpretation, endpoint one-sided behavior, and endpoint two-sided behavior.
- Table explanations now say that finite rows suggest a limit rather than prove one.

### Limits of Continuous Functions

- Added a selector with **Core Direct Substitution** as the default and **Later-Unit Direct Substitution Review** as the second setting.
- Core includes constants, linear/quadratic/cubic polynomials, richer rational functions, exact irrational square-root results, and cube roots.
- Later review includes familiar-angle trigonometric limits, exponentials, and natural logarithms with valid inputs.
- Solutions show substitution, denominator checks, or domain checks rather than merely naming continuity.

### Basic Techniques for Indeterminate Limits

- Preserved the five-category selector and its restricted Mixed pool: continuous substitution, factoring, root substitution, rationalizing, and complex fractions only.
- Expanded factoring with nonmonic quadratics, sums of cubes, GCF followed by another factorization, reversed factors, and richer polynomial cancellation.
- Expanded root substitution with eighth roots, squared cancellations, and polynomial-over-polynomial expressions in a cube-root substitution.
- Expanded rationalizing with irrational target values, affine radicands, reversed differences, and polynomial factors accompanying a radical difference.
- Expanded complex fractions with two distinct variable-dependent fractions and explicit common-denominator/factorization work.
- Existing harder legacy families remain in the pools; the new families supplement rather than replace them.

### Comprehensive Review

- Uses the same shared direct-substitution and algebraic-expansion implementations as the focused engines.
- Existing review families remain present.

### Shared exact-answer and keypad support

- Added restricted parsing for rational arithmetic, parentheses, powers, implicit multiplication, square/cube/nth roots, pi, e, and natural logarithms of valid positive constants.
- Equivalent exact forms such as `1/(2sqrt(3))` and `sqrt(3)/6` are accepted.
- DNE, positive infinity, negative infinity, undefined point values, invalid syntax, and wrong mathematical answers remain distinct.
- The Limits keypad now includes digits, fractions, powers, square/cube/nth roots, ln, e, pi, signs, parentheses, DNE, and signed infinity.

## Validation result

- Full non-browser QA suite: **PASS**.
- Static release audit: 237 HTML pages, 4,910 internal references, zero broken references, zero errors.
- AP generator stress: 220,000 generated problems, zero errors.
- Targeted Limits family QA: 40,000 generated problems, zero errors.
- Deep AP topic audit: 100,000 samples, zero errors.
- New-family deterministic probe: every added family appeared thousands of times; independent answer invariants passed.
- Exact-input equivalence and malformed-input probes passed.
- Mixed representation cycle verified at 8 tables / 8 graphs.
- Existing controller/keypad Node-VM regressions passed.

Actual Chromium interaction could not be run in this workspace because a Chromium executable was unavailable. Browser items are therefore listed for manual/deployment recheck rather than reported as passed.

## Source-material conflicts recorded, not edited

- An IVT worksheet uses endpoint-inclusive wording where an interior-value conclusion may be intended.
- Some reminder language can be read as overgeneralizing that nonzero-over-zero automatically proves DNE or that every 0/0 form is removable. The generators continue to use correct mathematics.

