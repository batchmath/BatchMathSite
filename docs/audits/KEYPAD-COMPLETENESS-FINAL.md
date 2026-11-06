# Sitewide keypad completeness — completed findings

**Checkpoint B is complete. These are findings before corrections. Product keypad files are unchanged from video checkpoint `57a51aae03ba6ef7544b746e1e5f4c504f1fdfdf`; Checkpoints C and D remain pending.**

The approved video work is preserved: 66 pages, 198 recordings, seven wider expandable review recordings and the narrow-heading correction. It has not been repeated or redesigned.

## Scope and new evidence

All **118 mathematical routes** in the 138-route inventory were reviewed. The other 20 retain specialized choices, graph/drawing interactions or navigation. No mathematical editor was added to those controllers. Unit 6 is excluded.

| Course | Unit | Mathematical routes |
|---|---|---:|
| AP Calculus | 1 | 9 |
| AP Calculus | 2 | 23 |
| AP Calculus | 3 | 21 |
| AP Calculus | 4 | 13 |
| AP Calculus | 5 | 11 |
| Calculus Prep | Prep | 6 |
| IM1 | 1 | 9 |
| IM1 | 2 | 4 |
| IM1 | 3 | 22 |

The [field matrix](KEYPAD-COMPLETENESS-MATRIX.csv) and [machine-readable inventory](KEYPAD-COMPLETENESS-INVENTORY.json) contain every reviewed field/family record, selector/seed, active profile, displayed controls, controls pressed, expression, original checker result, missing control and evidence reference. Repeated control definitions use explicit dictionaries in the JSON.

| Fresh finding metric | Count |
|---|---:|
| Deterministic question/form cases, including retained native interactions | 6,561 |
| Mathematical field rows | 7,255 |
| Route/family/part/field/profile signature groups | 4,065 |
| Keypad-only correct mathematical-part assertions | 6,556 |
| Wrong mathematical-part rejection assertions | 6,658 |
| Separately labeled original-checker acceptance witnesses | 118 |
| Actual runtime profile names observed | 114 |
| Distinct displayed control sequences | 96 |
| Field rows blocked by a confirmed control gap | 119 |
| Unresolved driver failures / pending mathematical routes | 0 / 0 |

These are finite metadata/signature groups, not counts of independent mathematical families or every possible coefficient. Correct-part counts include explicit meaningful-alternative assertions, while setup/replay submissions are not counted again. Semantic-only legacy/Node checker witnesses are never counted as keypad-only successes. The profile specification currently contains 150 registered names; registration alone does not establish reachability or completeness.

## Confirmed gaps and planned corrections

| Finding | Reproduction and actual profile | Necessary correction in C |
|---|---|---|
| Required absolute value | Derivative comprehensive review, `review_chain_inverse_trig`, inverse secant/cosecant; active `migration-derivative-exp` lacks `\|u\|` | Select a scoped inverse-chain review profile retaining current controls and exposing absolute value |
| Exact intervals on calculator analysis | `u3-analysis-f-qf-increasing` requires radical/arithmetic endpoints; `u3-analysis-f-trig-increasing` requires exact π fractions; active `ml-unit3-rounded-interval` | Choose the keypad from the generated field's required decimal precision; retain the decimal keypad for rounded fields |
| Accepted decimal representation | Linearization `u3-lin-sqrt-16-1` accepts `4.125` and displays `33/8`; standalone uses `ml-unit3-algebraic-exact`, assignment review uses `ml-unit3-exact` | Enable decimal controls only on fields whose generated, non-exact-required answer contract calls for them |
| Degree profile changes after typesetting | Reference angle `ref-210-false` accepts `30°`; question text becomes `𝜃 =210∘`, and active `ml-prep-radians` omits ° | Recognize source and rendered degree notation when selecting the existing degrees profile |
| Indexed-root representations | 106 blocked field rows; 15 existing named profiles across derivatives, integrals, basic differential equations and separable intervals | Expose the existing editable indexed-root template only on the demonstrated profiles |
| Square-root representation in θ substitution | Three supported radical-form cases on `unit4-usub-theta` | Expose the existing square-root template on this profile; no unnecessary indexed-root key is needed |

The 119 blocked rows are repeated question/form witnesses, **not 119 independent bugs**. Every root-form finding is backed by the unchanged original checker accepting the representation. Examples include cube/fourth roots in derivative answers, radical antiderivatives with student-entered `+C`, basic differential-equation solutions in x/t, and the interval endpoint `root(4,e)`.

Indexed-root gaps affect `derivative-power`, `derivative-product`, `derivative-chain`, `migration-derivative-exp`, `migration-derivative-log`, `migration-derivative-trig`, `migration-derivative-implicit`, `migration-derivative-inverse`, `unit4-basic-indef`, `unit4-usub-x`, `unit4-usub-t`, `unit4-usub-r`, `ml-unit5-basic-x`, `ml-unit5-basic-t`, and `unit5-sep-interval`. Standalone and review registrations of the last profile must remain aligned.

No product fix is claimed at this checkpoint. The source patch is prepared separately for application after this findings commit is pushed.

## Priority approximation investigation

The reachable tangent/secant exercise is an exact-value field followed by four native Underestimate/Overestimate-plus-reason choices. At 375px and 1280px, the browser constructs `9/4`, rejects `9/5`, rejects an incorrect classification, then accepts the correct numerical/classification sequence. The numerical part explicitly requires exact form. No missing decimal or classification-word control is demonstrated; its existing profile and native classification interaction are preserved. See `evidence/keypad-approximation-investigation-negative-verified.json`.

The separate linearization decimal finding has a different contract: its generator supplies an accepted decimal expression and does not require exact form. It must not cause decimal keys to appear in the strict approximation exercise.

## Required forms and meaningful alternatives

Canonical cases exercise signed integers, decimals and required precision, fractions, powers, roots, π/e, trigonometric/inverse-trigonometric functions, logarithms, absolute value, variables, equations, lists, pairs, intervals, union/infinity, DNE/Undefined/None, integration constants, sequence subscripts and limit/summation setups. Required equation forms, simplification and precision checks remain owned by their original graders.

Meaningful alternatives include indexed-root versus rational-power notation, explicit `f(n)` sequence notation, existing `a₁`, `aₙ`, `aₙ₋₁` controls, factored/simplified forms where allowed, ± rational-root lists, degree notation, and the demonstrated accepted linearization decimal. Artificial identities such as replacing an integer by a trigonometric expression are outside this audit.

Existing cube-root buttons on separable solution profiles correctly construct third roots; they do not require an additional nth-root key merely because the test's internal AST calls the function `root(3,…)`. Given variable prefixes, currency decorations and percentage units are supplied by the question/field; their numeric values are tested without requiring decorative input buttons. Choice-only branches remain native.

## How coverage was established

The harness serves actual local pages, pinned MathLive 0.111.1 and real MathJax fixtures. Test-only instrumentation exposes original generator fixtures, preserves rich browser-generated functions, and stamps the mode inside the actual `buildPad` call. Earlier private-pad observations are named by an exact route and visible-button-sequence match against fresh live observations. All mathematical field rows now identify a runtime profile.

`enter-answer.mjs` reads the public selection/last-offset data and clicks the controls actually displayed for the active field. It does not type missing symbols or call MathLive answer setters/insertion APIs. The original button callbacks perform insertion and translation, and the page's unchanged checker grades the result. Batched DOM clicks exercise those callbacks; physical pointer/touch geometry and viewport movement are checked separately.

Each public generator mode is sampled deterministically. Browser witnesses cover observed structural/control features within generator-family and field-contract groups, with explicit required/covered feature lists. Numeric parameter combinations that add no new input requirement are not represented as new mathematical families. Every eligible registered Unit 5 family is reconciled against its source declarations and calculator eligibility in `evidence/keypad-generator-catalog-coverage.json`.

Dynamic cases advance through native parts, switch active fields and profiles, and preserve earlier values. Shared field contracts are exercised in standalone and review pages. Optional slope/curve entry covers all existing typed alternative fields on the standalone page and both Unit 5 reviews, with original correct/wrong grading. These alternatives do not replace drawing controls.

## Driver corrections and exclusions

Initial failures were investigated before being called website defects. The driver now distinguishes approach arrows from cursor arrows, handles mixed interval delimiters/unions and ± lists, waits for native progression/unlocking, uses cube-root buttons already present, omits redundant scalar grouping when no grouping key is required, and separates supplied labels/units from student input. A transient staged-advance timeout passed isolated reproduction; native continuation is activated after state readiness to avoid MathJax reflow during automated pointer targeting. Pointer behavior remains part of the established browser regressions.

248 attempts from deliberately interrupted exploratory runs are explicitly excluded from pass/fail totals. Their cancellation evidence is retained; no success is inferred. Later complete coverage witnesses and focused reruns replace the interrupted work. There are no remaining unresolved driver failures in this findings ledger.

## Mathematical-route findings matrix

`Blocked/failed` below describes pre-correction findings. The complete field-level details and required controls are in the linked CSV/JSON.

| Practice route | Cases | Passing | Blocked/failed |
|---|---:|---:|---:|
| ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/practice/index.html | 50 | 50 | 0 |
| ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html | 742 | 742 | 0 |
| ap-calculus/unit-1-limits-continuity/topics/introduction-to-continuity/continuity-parameters/index.html | 11 | 11 | 0 |
| ap-calculus/unit-1-limits-continuity/topics/introduction-to-continuity/practice/index.html | 13 | 13 | 0 |
| ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/practice/index.html | 18 | 18 | 0 |
| ap-calculus/unit-1-limits-continuity/topics/limits-of-continuous-functions/practice/index.html | 15 | 15 | 0 |
| ap-calculus/unit-1-limits-continuity/topics/one-sided-limits/practice/index.html | 50 | 50 | 0 |
| ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/course-practice/index.html | 8 | 8 | 0 |
| ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/practice/index.html | 43 | 43 | 0 |
| ap-calculus/unit-2-derivatives/topics/comprehensive-review/derivatives-at-a-point-practice/index.html | 157 | 157 | 0 |
| ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html | 439 | 410 | 29 |
| ap-calculus/unit-2-derivatives/topics/derivatives-of-inverse-functions/practice/index.html | 7 | 7 | 0 |
| ap-calculus/unit-2-derivatives/topics/derivatives-of-logarithmic-functions/derivative-at-a-point-practice/index.html | 94 | 94 | 0 |
| ap-calculus/unit-2-derivatives/topics/derivatives-of-logarithmic-functions/practice/index.html | 142 | 136 | 6 |
| ap-calculus/unit-2-derivatives/topics/derivatives-of-trigonometric-functions/derivative-at-a-point-practice/index.html | 71 | 71 | 0 |
| ap-calculus/unit-2-derivatives/topics/derivatives-of-trigonometric-functions/practice/index.html | 37 | 34 | 3 |
| ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/derivative-at-a-point-practice/index.html | 18 | 18 | 0 |
| ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/index.html | 16 | 14 | 2 |
| ap-calculus/unit-2-derivatives/topics/exponential-functions/derivative-at-a-point-practice/index.html | 73 | 73 | 0 |
| ap-calculus/unit-2-derivatives/topics/exponential-functions/practice/index.html | 123 | 116 | 7 |
| ap-calculus/unit-2-derivatives/topics/implicit-differentiation/derivative-at-a-point-practice/index.html | 12 | 12 | 0 |
| ap-calculus/unit-2-derivatives/topics/implicit-differentiation/practice/index.html | 122 | 116 | 6 |
| ap-calculus/unit-2-derivatives/topics/inverse-trigonometric-functions/derivative-at-a-point-practice/index.html | 77 | 77 | 0 |
| ap-calculus/unit-2-derivatives/topics/inverse-trigonometric-functions/practice/index.html | 170 | 165 | 5 |
| ap-calculus/unit-2-derivatives/topics/logarithmic-differentiation/practice/index.html | 200 | 194 | 6 |
| ap-calculus/unit-2-derivatives/topics/the-chain-rule/derivative-at-a-point-practice/index.html | 34 | 34 | 0 |
| ap-calculus/unit-2-derivatives/topics/the-chain-rule/nested-chain-rule-practice/index.html | 404 | 404 | 0 |
| ap-calculus/unit-2-derivatives/topics/the-chain-rule/practice/index.html | 56 | 48 | 8 |
| ap-calculus/unit-2-derivatives/topics/the-product-rule/derivative-at-a-point-practice/index.html | 14 | 14 | 0 |
| ap-calculus/unit-2-derivatives/topics/the-product-rule/practice/index.html | 70 | 64 | 6 |
| ap-calculus/unit-2-derivatives/topics/the-quotient-rule/derivative-at-a-point-practice/index.html | 16 | 16 | 0 |
| ap-calculus/unit-2-derivatives/topics/the-quotient-rule/practice/index.html | 97 | 89 | 8 |
| ap-calculus/unit-3-applications-derivative/topics/absolute-and-local-extrema-and-the-extreme-value-theorem/practice/index.html | 23 | 23 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/assignment-practice/index.html | 408 | 407 | 1 |
| ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/calculator-practice/index.html | 182 | 182 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/equations-of-tangent-and-normal-lines/practice/index.html | 59 | 59 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines-implicitly/calculator-practice/index.html | 11 | 11 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines-implicitly/practice/index.html | 19 | 19 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines/practice/index.html | 17 | 17 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/increasing-decreasing-intervals-concavity-and-extrema/calculator-practice/index.html | 26 | 24 | 2 |
| ap-calculus/unit-3-applications-derivative/topics/increasing-decreasing-intervals-concavity-and-extrema/practice/index.html | 26 | 26 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/l-hopital-s-rule/practice/index.html | 45 | 45 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/linearization-and-differentials/practice/index.html | 20 | 19 | 1 |
| ap-calculus/unit-3-applications-derivative/topics/motion/calculator-practice/index.html | 16 | 16 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/motion/practice/index.html | 23 | 23 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/newton-s-method-for-approximating-roots-of-a-function/practice/index.html | 5 | 5 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/optimization/calculator-practice/index.html | 30 | 30 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/optimization/practice/index.html | 36 | 36 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/related-rates/calculator-practice/index.html | 41 | 41 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/related-rates/practice/index.html | 41 | 41 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/rolle-s-theorem-and-the-mean-value-theorem/practice/index.html | 59 | 59 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/tangent-and-secant-line-approximations/practice/index.html | 41 | 41 | 0 |
| ap-calculus/unit-3-applications-derivative/topics/using-your-graphing-calculator/practice/index.html | 10 | 10 | 0 |
| ap-calculus/unit-4-integrals/topics/basic-integrals/practice/index.html | 93 | 88 | 5 |
| ap-calculus/unit-4-integrals/topics/comprehensive-review/assignment-practice/index.html | 230 | 230 | 0 |
| ap-calculus/unit-4-integrals/topics/comprehensive-review/practice/index.html | 230 | 222 | 8 |
| ap-calculus/unit-4-integrals/topics/evaluating-definite-integrals-with-a-limit-and-summation/practice/index.html | 9 | 9 | 0 |
| ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/integral-rules-practice/index.html | 9 | 9 | 0 |
| ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/practice/index.html | 27 | 27 | 0 |
| ap-calculus/unit-4-integrals/topics/integrals-resulting-in-natural-log-and-inverse-trigonometric-functions/practice/index.html | 22 | 22 | 0 |
| ap-calculus/unit-4-integrals/topics/integrals-using-geometry/practice/index.html | 12 | 12 | 0 |
| ap-calculus/unit-4-integrals/topics/introduction-to-sigma-notation/practice/index.html | 5 | 5 | 0 |
| ap-calculus/unit-4-integrals/topics/mean-value-theorem-for-integrals/practice/index.html | 17 | 17 | 0 |
| ap-calculus/unit-4-integrals/topics/rectangular-approximations/practice/index.html | 34 | 34 | 0 |
| ap-calculus/unit-4-integrals/topics/trapezoidal-approximations/practice/index.html | 29 | 29 | 0 |
| ap-calculus/unit-4-integrals/topics/u-substitution-integrals/practice/index.html | 59 | 54 | 5 |
| ap-calculus/unit-5-differential-equations/topics/basic-first-order-differential-equations/calculator-practice/index.html | 2 | 2 | 0 |
| ap-calculus/unit-5-differential-equations/topics/basic-first-order-differential-equations/non-calculator-practice/index.html | 175 | 172 | 3 |
| ap-calculus/unit-5-differential-equations/topics/comprehensive-review/calculator-practice/index.html | 110 | 110 | 0 |
| ap-calculus/unit-5-differential-equations/topics/comprehensive-review/non-calculator-practice/index.html | 166 | 162 | 4 |
| ap-calculus/unit-5-differential-equations/topics/exponential-growth-and-decay-interest-newton-s-law-of-cooling/practice/index.html | 89 | 89 | 0 |
| ap-calculus/unit-5-differential-equations/topics/motion-problems/calculator-practice/index.html | 17 | 17 | 0 |
| ap-calculus/unit-5-differential-equations/topics/motion-problems/non-calculator-practice/index.html | 23 | 23 | 0 |
| ap-calculus/unit-5-differential-equations/topics/rate-problems/calculator-practice/index.html | 40 | 40 | 0 |
| ap-calculus/unit-5-differential-equations/topics/rate-problems/non-calculator-practice/index.html | 89 | 89 | 0 |
| ap-calculus/unit-5-differential-equations/topics/separable-differential-equations/practice/index.html | 37 | 37 | 0 |
| ap-calculus/unit-5-differential-equations/topics/slope-fields/practice/index.html | 18 | 18 | 0 |
| calculus-prep/calculus-algebra/index.html | 5 | 5 | 0 |
| calculus-prep/special-factoring/index.html | 16 | 16 | 0 |
| calculus-prep/synthetic-division/index.html | 5 | 5 | 0 |
| calculus-prep/trig-angle-skills/index.html | 13 | 9 | 4 |
| calculus-prep/trig-equations/index.html | 19 | 19 | 0 |
| calculus-prep/unit-circle-values/index.html | 40 | 40 | 0 |
| im1/unit-1-review/topics/adding-and-subtracting-negative-numbers/practice/index.html | 5 | 5 | 0 |
| im1/unit-1-review/topics/decimals/practice/index.html | 4 | 4 | 0 |
| im1/unit-1-review/topics/fractions/practice/index.html | 7 | 7 | 0 |
| im1/unit-1-review/topics/multiplication/practice/index.html | 5 | 5 | 0 |
| im1/unit-1-review/topics/multiplying-and-dividing-negative-numbers/practice/index.html | 4 | 4 | 0 |
| im1/unit-1-review/topics/order-of-operations/practice/index.html | 11 | 11 | 0 |
| im1/unit-1-review/topics/percents/practice/index.html | 9 | 9 | 0 |
| im1/unit-1-review/topics/reducing-fractions/practice/index.html | 1 | 1 | 0 |
| im1/unit-1-review/topics/square-roots-and-exponents/practice/index.html | 2 | 2 | 0 |
| im1/unit-2-algebraic-operations-equations-inequalities/topics/comprehensive-review/practice/index.html | 54 | 54 | 0 |
| im1/unit-2-algebraic-operations-equations-inequalities/topics/equivalent-expressions-combining-like-terms/practice/index.html | 13 | 13 | 0 |
| im1/unit-2-algebraic-operations-equations-inequalities/topics/graphing-inequalities-interval-notation/practice/index.html | 7 | 7 | 0 |
| im1/unit-2-algebraic-operations-equations-inequalities/topics/solving-linear-equations/practice/index.html | 11 | 11 | 0 |
| im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/arithmetic-sequence-word-problems/practice/index.html | 1 | 1 | 0 |
| im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/common-difference-next-terms/practice/index.html | 8 | 8 | 0 |
| im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/explicit-formulas-arithmetic-sequences/practice/index.html | 2 | 2 | 0 |
| im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/finding-a-specific-term/practice/index.html | 2 | 2 | 0 |
| im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/finding-the-term-number/practice/index.html | 1 | 1 | 0 |
| im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/identifying-arithmetic-sequences/practice/index.html | 3 | 3 | 0 |
| im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/section-a-review/practice/index.html | 17 | 17 | 0 |
| im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/evaluating-functions/practice/index.html | 4 | 4 | 0 |
| im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/section-b-review/practice/index.html | 17 | 17 | 0 |
| im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/slope-from-graphs/practice/index.html | 4 | 4 | 0 |
| im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/slope-from-two-points/practice/index.html | 4 | 4 | 0 |
| im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/solving-function-equations/practice/index.html | 4 | 4 | 0 |
| im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/converting-point-slope-to-slope-intercept/practice/index.html | 2 | 2 | 0 |
| im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/linear-function-word-problems/practice/index.html | 2 | 2 | 0 |
| im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/section-c-review/practice/index.html | 20 | 20 | 0 |
| im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/slope-intercept-form/practice/index.html | 10 | 10 | 0 |
| im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/writing-equations-of-lines/practice/index.html | 6 | 6 | 0 |
| im1/unit-3-linear-equation/topics/comprehensive-review/practice/index.html | 78 | 78 | 0 |
| im1/unit-3-linear-equation/topics/d-recursive-formulas-for-linear-relationships/common-difference-recursive-formulas/practice/index.html | 4 | 4 | 0 |
| im1/unit-3-linear-equation/topics/d-recursive-formulas-for-linear-relationships/recursive-formulas-from-sequences/practice/index.html | 28 | 28 | 0 |
| im1/unit-3-linear-equation/topics/d-recursive-formulas-for-linear-relationships/recursive-to-explicit-formulas/practice/index.html | 1 | 1 | 0 |
| im1/unit-3-linear-equation/topics/d-recursive-formulas-for-linear-relationships/section-d-review/practice/index.html | 33 | 33 | 0 |

## Completion steps

Checkpoint C must apply only the confirmed profile/renderer corrections, preserve the failing-before evidence, demonstrate correct insertion and original correct/wrong grading, test shared profiles and dynamic fields, update profile documentation, then commit/push.

Checkpoint D must run fresh established Node, default/legacy/missing-runtime route, stability, IM1 responsive, video-presentation and video-sizing suites; complete source/content protection checks; verify the unchanged Unit 6 tree; then commit/push and prepare the complete-site test ZIP. This findings checkpoint is not final regression or delivery approval.

## Reproduction and limitations

Run from the repository root with Chromium/Playwright and `MATHJAX_FIXTURE_ROOT` pointing to the real local fixture directory. Evidence files record selectors, seeds, question IDs, active parts, controls and expressions. Examples:

```sh
node tools/keypad-completeness/unit2-browser.mjs
ALTERNATIVE_ROOTS=1 REPORT_SUFFIX=-roots-before node tools/keypad-completeness/unit2-browser.mjs
EXPAND_ANSWER_FORMS=1 ROUTE_INDEX=36,37,38,39,40,41,42,43,44,45,46 node tools/keypad-completeness/dynamic-browser.mjs
REQUIRE_PASS=1 VERIFY_LAYOUT=1 REPORT_SUFFIX=-corrected node tools/keypad-completeness/unit2-browser.mjs
```

`REQUIRE_PASS=1` makes any recorded failure or page error fail the run. Finding collection intentionally retains expected failures without claiming repair. `REPLAY_FILE` selects prior failed IDs; `AUDIT_PRIOR` reuses explicitly passing witnesses; retest-only rows do not substitute for a full route's coverage. `coverage-witnesses.mjs` records the finite control-feature proof.

Finite seeded/source-family coverage does not prove every arbitrary equivalent expression. Tests use headless Chromium, rather than physical-device or assistive-technology certification. Original YouTube media playback is outside the keypad audit; the approved sizing/presentation evidence and its stated limits remain in the video report. No generator, checker or answer-acceptance rule has been changed in B.
