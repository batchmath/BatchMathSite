# Separate mathematical corrections before Batch 1B

Source: `adae2a2b00580f29befba88f593f4f627e2850c5`. These defects reproduce with the legacy editor; neither correction changes the MathLive adapter or equivalence tolerances.

1. **Inverse-trig topic, cumulative Product/Quotient factors:** the reachable factor catalogue includes all six inverse functions, but this page's lexer/evaluator omitted them. Example `pa-wide-atan2-log5_q4_3_13` rejects its own stored derivative of `atan(x/2)*log_5(x^4+3x^2+13)`. Add only the six missing lexer names and their standard evaluations, following the already working Product/Quotient engines. Wrong answers remain rejected.
2. **Comprehensive derivative-at-a-point, base-polynomial exponential:** `base-polynomial-2-2-6--2` stores `2*2^2*ln(2)` correctly but displays `22^2 ln(2)`. Group the numerical exponential factor before appending the coefficient. The function, stored answer, distribution and checker remain unchanged.

`node --test tools/mathlive-sitewide/math-corrections.test.mjs` failed both tests before correction, then passed both. The first covers reachable cumulative inverse-factor combinations; the second samples 100 deterministic exponential generations over several bases, exponents and coefficients. No global parser changes.

## Separate correction before Batch 4

Unit 1's exact-number parser bound unary minus more tightly than exponentiation: legacy input -2^2 evaluated to positive 4. A numerical answer of -4 could reject this valid expression and an answer of +4 could accept it incorrectly.

Three local grammar functions now put powers above unary signs, keep powers right-associative and permit signed exponents. Parenthesized negative bases remain distinct. No generator, tolerance, formatting requirement or MathLive adapter changes in this correction.

The unit1-math.test.mjs regression fails before this change (4 versus -4) and passes afterward. It covers signed/parenthesized bases, negative/chained exponents, products, nested fractions, real odd roots and invalid input. This deliberately corrects the old mathematical interpretation; other checker policies stay unchanged.

## Calculus Prep unary negative monomial powers (Batch 7 precondition)

Confirmed before conversion: Synthetic Division fixture div--1_-5_1_10_23--5 divides -x^4-5x^3+x^2+10x+23 by x+5. Its stored/displayed quotient is -x^3+x+5 and remainder -2. The original BMPrep.exprEquivalent rejects the quotient even against itself: prepareXExpr produces -x**3+x+5, which JavaScript rejects as an unparenthesized unary expression before exponentiation. Explicit -(x^3)+x+5 also failed because the stored comparison target was invalid.

Small correction in assets/calc-prep-common.js: spell an omitted unary monomial coefficient as -1*x before converting ^ to **. Only a unary -x immediately followed by ^ at the beginning of an expression or after an arithmetic/group opener is affected. No derivative parser, MathLive adapter, generator, form gate, tolerance or sampling policy changes. Subtraction, (-x)^2, negative exponents and ordinary coefficients retain their meanings.

Reproduction/regression: node --test tools/mathlive-sitewide/prep-math.test.mjs. Both tests failed before the correction and pass afterward. Checks cover powers 2/3/4/6/12, signed sample values, the exact polynomial division identity, accepted stored quotient and incorrect positive-leading quotient. The focused six-engine deterministic Prep checker comparison also passes after the source correction; integration evidence belongs to the separate Batch 7 commit.

## Prep factoring: numeric parentheses counted as factors

Confirmed independently of MathLive: looksFactored('(x^2-4)/(1)', {minGroups:2}) returned true. The same occurs for (x^3-8)*(1). These expanded expressions do not satisfy the generated instruction to factor completely; numeric-only parentheses were counted toward the minimum polynomial factor groups. The sitewide sign normalizer also made the result depend on whether a copied minus glyph was Unicode, because it can remove the numeric denominator parentheses. Neither behavior should be concealed by adding fraction groups in an editor adapter.

Small correction confined to the existing looksFactored form gate: omit parentheses containing only a signed numeric literal when counting polynomial factor groups. No generator, expression-equivalence logic, global normalizer, tolerance or MathLive translation change in this correction. True binomial/quadratic factors, grouped numeric coefficients alongside actual factors, fractional coefficients and perfect powers remain accepted. This is a correction to the confirmed loophole, not a comprehensive redesign/certification of the existing factoring heuristic.

Regression: node --test tools/mathlive-sitewide/prep-factoring-math.test.mjs. The numeric-parenthesis negative test fails before the correction and passes afterward; the valid-alternative test passes on both versions. The complete bounded six-engine Prep generator/checker comparison also passes after this correction. MathLive factoring serialization is verified separately and does not manufacture factor parentheses around both operands of a fraction.

## Batch 8 precondition: duplicated qa8 defect in symbolic derivative review

The symbolic Unit 2 comprehensive review has an independent qa8 generator copy. Its stored denominator e^(k*x)^2 still meant the exponential of the squared exponent to that page's unchanged parser, while the displayed solution correctly uses e^(2*k*x). The previously fixed Quotient topic engine did not update this review copy.

Small correction: only that review qa8 answerExpr denominator now stores e^((2*k)*x). Generated questions, difficulty, displayed correct solution, explanations, parser/equivalence checks and simplification policies remain unchanged.

Regression: node --test tools/mathlive-sitewide/review-qa8.test.mjs. It fails on the c2d6b9f legacy source and passes after correction. The unchanged legacy check() is exercised over 1,600 deterministic generations: at least 25 reachable qa8 questions and 20 distinct a/b/k tuples, checking the analytic derivative, displayed solution, stored expression and incorrect +1 response. This correction is committed separately before the review editor conversion.

## Batch 8 precondition: Difference Quotient review omitted h

The symbolic Unit 2 comprehensive review generates quadratic, radical and reciprocal difference-quotient answers depending on x and h, with vars=['x','h']. Its local identifier list omitted h, and its numerical sample scopes populated only x (or x/y). Correct stored answers such as dqmix-r-4 therefore received Not quite even in the unchanged legacy checking path.

Small correction: add h to this review's existing identifier list, and populate it from varied nonzero values in the already established sample scopes only when the generated question declares h. Expression grammar, sampling thresholds, tolerances, generators, displayed solutions and simplification gates are unchanged. Other derivative engines are not changed.

Regression: node --test tools/mathlive-sitewide/review-h.test.mjs fails before the correction and passes afterward. It checks 180 actual deterministic questions covering all four difference-quotient families, correct/stored and +0 forms, incorrect +h answers and removal of h from nonlinear answers. The qa8 regression also passes. This mathematical correction is separately committed before editor activation.

## Batch 8 runtime repair: Unit 4 assignment review omitted checker dependencies

The Unit 4 assignment review loads current typed generators, but its original HTML omitted derivative-expression-checker.js, unit4-exact-answers.js and the shared calculus editor. Before conversion, a real legacy-browser submission for reachable geometry question u4N-geometry-quarter_circle-9d3cda33f9ed7941 (correct signed area -16pi) threw Cannot read properties of undefined (reading 'check'). The page had no Unit4Answers checker at all.

Repair confined to that HTML: load the existing local checker dependencies and calculus keypad assets, matching the topic/review architecture. No generator or mathematical checking code changes. The legacy browser now credits -16pi and rejects -16pi+1, with zero page errors. No MathLive module is activated in this repair commit.

Evidence: tools/mathlive-sitewide/review-dependencies-browser.mjs, with review-dependencies-before.json and review-dependencies-after.json. The browser assertion fails before the dependency repair and passes afterward.

## Final regression: fraction normalization crossed an exact-list boundary

Extended legacy/MathLive comparisons reproduced `u3-mvt-cubic-9`: the correct MVT list `-((9)/(sqrt(3))),(9)/(sqrt(3))` was changed by the original pre-submit sign normalizer into `-(((9)/(sqrt(3))),(9))/sqrt(3)`, then rejected by the original legacy UI. This is normalization changing the mathematical structure, not a permissive MathLive grader.

Minimal repair: a top-level comma or semicolon prevents moving a sign across the numerator. Existing standalone fraction sign rules and nested function arguments are unchanged. Two failing-before/passing-after Node regressions cover reachable MVT cubic cases r=3,6,9, correct/incorrect lists and standalone signs. The focused real legacy/MathLive browser rerun passes four paired submissions with zero page errors (`reviews-dynamic-browser-normalization.json`); the broader failing legacy reproduction is preserved in `reviews-dynamic-browser-families-before.json`. No question, derivative, tolerance, list ordering or simplification rule changed.

## IM1 Unit 2 review runtime dependency repair

The reachable mixed-review interval question `u2-int-solve-distribution-4(2x + 3)-<--52` (seed 10×719; answer `(-∞, -8)`) failed before MathLive activation: the HTML omitted `im1-interval-input.js`, so the original renderer threw `Cannot read properties of undefined (reading 'mount')`. The repair adds only that existing local module. The same legacy browser regression now renders the field, credits its answer and rejects `(12345,12346)`, with zero page errors. Generator and checker code are unchanged. See `im1-review-dependencies-browser.mjs` and its before/after artifacts. This dependency repair is separately committed before editor activation.
