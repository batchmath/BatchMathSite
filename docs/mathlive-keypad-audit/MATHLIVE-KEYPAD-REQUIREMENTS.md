> Small correction update: the IM1 numeric multipart division gap and Unit Circle comma are fixed; infinity-button appearance is standardized. See [focused checkpoint](../keypad-corrections/CHECKPOINT.md). Historical findings below are retained as evidence. The separate Unit 1 common-log gap is outside this correction scope.

> Batch 1 update: Product and Quotient Rule are converted and family-tested; the Quotient qa8 inconsistency was corrected in a separate, authorized mathematical commit. See [checkpoint](../mathlive-batch1/CHECKPOINT.md). Original sitewide coverage figures below describe the historical partial audit.

# Mathematical keypad requirements audit

Reference: `experiment/mathlive-advanced-pilot` at `d01896853c8af0950089714fdc2a7a8eccba23d0`. This audit changes documentation and audit tools only. Unit 6 is excluded until its independent implementation is approved.

## Delivery status: verified findings inside a partial audit

This is **not a definitive certification of every keypad**. The executable pass examines 63 generator registrations, 1,008 deterministic generated instances and 26 focused parser/checker calls. The matrix includes 133 candidate page routes and 215 observed/provisional field rows. These are **not 133 deduplicated engines or 215 fully enumerated field types**: redirects are excluded, but some landing pages, historical registry aliases and unresolved inline engines still need manual reconciliation. Zero complete profiles are certified against all reachable families and accepted alternatives.

This explicitly uses the request's partial-audit allowance. It provides permanent, reproducible evidence rather than marking missing work complete. Required-button lower bounds from sampled answers are distinguished from checker-verified alternatives. Rows saying “None confirmed” do not mean no defect exists. A future implementation task must resolve the row's remaining uncertainty rather than treat the candidate profile as a final specification.

The [CSV matrix](MATHLIVE-KEYPAD-MATRIX.csv) is organized by course, unit, page/engine and field. It names current controls individually where their source profile is resolved, records observed required controls, and separates confirmed gaps/removals from unresolved requirements. The [evidence report](MATHLIVE-KEYPAD-EVIDENCE.md) includes every sampled registry entry, observed family, representative generated ID, focused probe result, source routes and reproducibility instructions.

## Confirmed missing controls — two engine/control pairs

1. **AP Unit 1, Limits of Continuous Functions, exact limit field: common logarithm `log` (base 10).** The actual page mounts the shared calculus editor, remapped from `limits` to `limits-finite`. That profile supplies `ln`, but not `log`. The Unit 1 parser explicitly accepts common logs: the probe `log(100)` returns 2. A constant-limit question with value 2 is reachable in `continuous()` (`k` ranges from -12 to 12), so this is a legitimate exact accepted representation, not a symbol inferred from the question. Physical keyboard entry works. A different expression for the same value can be entered today; this is a **representation gap**, not inability to express the value 2 at all. Source: `unit1-core-expansions.js` constant family; `unit1-practice-ui.js` exactNumberExpression log branch; `calculus-keypad.js` limits-finite and contextualMode; continuous-limit page's actual input attribute. Line references are in the matrix.
2. **IM1 Unit 3, Common Difference/Next Terms, numeric multipart fallback: division/fraction control.** Numeric-only multipart fields fall through to local `numberEntries`, which offers digits, minus and decimal but no slash/fraction. Actual generated case `u3-01b--29-9` has common difference 9; its actual field checker accepts `18/2`. The source imposes no reduced-fraction requirement on that field. Keyboard slash is a workaround; the value can also be entered as 9. This is again a missing supported representation. The shared `unit3-number` profile does have fractions, but is **not** the path used for these numeric-only multipart fields. Source: `im1-unit3-practice.js` normalizeNumber, fieldResult, numberEntries and renderStructured branch; `im1-unit3-generators.js` common-difference fields. See exact probe and matrix references.

Do not generalize either finding to every page in its course. In particular, single-answer slope drills use `BatchMathKeypad` through `inputKind`, not necessarily the multipart fallback. Their fraction key must not be reported missing on the basis of `numberEntries` alone.

## Confirmed unnecessary control — one engine/control pair

**Calc Prep, Unit Circle Values, single function-value answer: comma.** The common exact editor displays comma. Every finite answer passes through `BMPrep.safeExactEval`, whose character whitelist rejects commas; the Undefined branch accepts only its explicit undefined/undef/DNE spellings. No supported finite or Undefined answer containing comma can pass either branch. The focused probes reject `1,0` and `undefined,`; the source-path argument, not sample absence, supports removal here. Keep comma in Trig Equations' solution-list fields.

**Do not remove the degree key on this evidence.** `BMPrep.normalize` strips `°`, and `safeExactEval('1°')` returns 1. Its mathematical usefulness is debatable, but it cannot be classified as excluded by accepted-answer syntax. The previous preliminary cleanup suggestion was too broad.

## Accepted alternatives change the audit

An actual generated Integral Rules answer in this run is `-17`. The unchanged checker accepts `(-17)+ln(1)`, `(-17)+sin(0)` and `(-17)+sqrt(0)`. Thus “this engine generates integers” does not prove its logarithm/root/function controls unnecessary. Conversely, this example is not a recommendation to add every cancellation identity to every keypad.

The policy needs two layers: (a) controls sufficient for every reachable educational answer contract, and (b) additional checker-supported representations. Under the request's conservative rule, an available control with a verified accepted representation must not be removed simply because it does not occur in preferred solutions. Arbitrary equivalent-expression closure is not exhaustively decidable from a finite sample. No other removals are certified in this audit.

## Unit 1 routing findings

The route ledger distinguishes HTML shared-editor inputs from Unit 1's local UI helpers. Continuous Functions, Basic Techniques, One-Sided Limits, Limits at Infinity and Comprehensive Review contain a shared `data-bm-calc-keypad="limits"` input. Their final profile still depends on `contextualMode()`; continuous/basic techniques resolve to finite contexts. Discontinuity location and other dynamically mounted fields require separate tracing. Loading `unit1-practice-ui.js` does **not** prove that its smaller keypad is mounted.

The Unit 1 parser probes accept square/cube/nth roots, powers, π, e, ln, common log and arithmetic; `sin(0)` is rejected by that parser. Therefore trig functions appearing in limit questions do not establish a trig-function answer requirement for these fields. Root/π entry on the main continuous-limit page is already supplied by its shared profile. Full family-by-family routing for all Unit 1 pages remains unfinished.

## Dynamic profile recommendations

- AP Unit 2: separate symbolic derivatives, numeric point evaluations, implicit x/y expressions and inline review paths. Do not inherit the entire broad derivative pad for a numeric field.
- AP Unit 3: choose exact, rounded, equation, coordinate, list or interval profiles by active field. Required decimal places and equation forms remain checker rules.
- AP Unit 4: keep antiderivative C/variable profiles separate from exact evaluated answers; keep MVT c-value lists/applicability separate from average values. Sigma/Newton structures belong only to actual construction fields. No evidence here establishes a new requirement for student-entered integral setup in the remaining Unit 4 engines.
- AP Unit 5: retain existing particular/general/function/exact/rounded/money/list/interval distinctions. Motion and reviews need per-part dispatch. Separable's page-specific interval override differs from the legacy profile inherited by other pages/reviews.
- IM1: distinguish single numeric IM1-keypad routing, local numeric-multipart fallback and shared structured fields. Do not attach an equation/recursive pad to all numeric fields in a mixed problem.
- Calc Prep: split unit-circle values, degree/radian values and solution lists. Keep choices/selectors as choices/selectors. Factored form, polynomial quotients, candidate lists and slash-sensitive calculus algebra need separate contracts.

## MathLive insertion versus grading

| Controls | Existing insertion support | Remaining grading work |
| --- | --- | --- |
| Digits, decimal, arithmetic, parentheses/brackets, equals, ordinary letters | Existing bridge | Per-checker decimals, form gates and equation-label rules |
| Fractions, exponents, square/cube/nth roots | Existing bridge/templates | Root domains, exactness and accepted serialized syntax per checker |
| π, e, θ, signed infinity | Existing bridge | Domain/result-token and variable-specific contracts |
| sin, cos, tan, sec, csc, cot, ln, log and six inverse-trig functions | Existing bridge mappings | A mapping alone does not establish parser acceptance; common log/inverse functions differ by checker |
| Absolute value | Existing bridge | Checker support and grouping |
| Interval brackets, comma, union | Existing bridge; interval adapter on Separable | Other interval/list/ordered-pair checkers still need endpoint and punctuation adapters/verification |
| Limit/sum templates, bare limit, approach arrow and subscript | Newton page-scoped controls and notation adapter | Explicit k/n expressions only; unexpanded indexed/delta shorthand is not made gradable |
| a₁, aₙ, aₙ₋₁ | Existing insertion literals | Recurrence/formula-specific translation is still required; generic expression translation is insufficient |
| DNE, None, Undefined, Does not apply | Some text insertion paths exist | Preserve exact supported tokens; verify missing mappings such as Undefined before migration |
| Indefinite/definite/double integrals, delta, indexed structures | Isolated reusable templates | No generic integral/double-integral grading contract; do not add to unrelated engine pads |
| Ordered pairs and solution lists | Punctuation can be inserted | List/pair boundaries, labels, sorting and format checks need dedicated contracts |
| Required factored/expanded/line forms | Ordinary symbol insertion | Never simplify, expand or rearrange on behalf of students |

Newton's signed-infinity controls already work. The known infinity-button appearance issue is a **cosmetic polish item**, not a missing-input finding.

## Remaining work and implementation order

1. Resolve the two confirmed gaps and one removal alongside their owning migrations; do not edit production code during this audit.
2. Finish Unit 1 per-family route coverage and IM1 local-versus-shared mounting coverage first.
3. Complete derivative-family enumeration, especially inverse/logarithmic controls and separate point-evaluation pages; then exact Unit 4/5 profiles using existing adapters.
4. Trace AP Unit 3 field-specific checkers and calculator variants; finish mixed reviews only after constituent contracts.
5. Finish IM1 reduced-fraction, polynomial/form and recurrence contracts; preserve form gates.
6. Finish Calc Prep symbolic field parsing and exact-list contracts; retain choice-only engines.
7. Audit Unit 6 only after Claude's development branch is approved.

No profile is newly certified fully complete here. Existing pilot evidence supports the seven MathLive practice pages and their tested answer contracts; historical Unit 5 sampled key coverage is useful but does not prove all accepted alternatives. The matrix intentionally leaves current buttons or reachable field kinds unresolved for inline pages that were not traced deeply enough.

## Scope integrity

Only `docs/mathlive-keypad-audit/` and `tools/mathlive-keypad-audit/` may differ from the reference. No identifying author metadata is written into reports. The branch contains no generator, grader, keypad, UI, deployment or Unit 6 change.

## Engine/field checklist

Row numbers identify CSV records, excluding its header. Exact named controls and source references are in the CSV. Observed requirements are lower bounds, not complete specifications.

### AP Calculus AB / unit-1-limits-continuity

| Row | Engine / field | Current profile | Audit state |
| --- | --- | --- | --- |
| 1 | Indeterminate Limits Practice — page-native fields; see route ledger  | limits-finite | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 2 | Comprehensive Review Practice — page-native fields; see route ledger  | HTML limits; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 3 | Intermediate Value Theorem Practice — page-native fields; see route ledger  | page-local/conditional | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 4 | Classifying Discontinuities Practice — page-native fields; see route ledger  | page-local/conditional | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 5 | Introduction to Limits Practice — page-native fields; see route ledger  | page-local/conditional | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 6 | Limits at Infinity Practice — page-native fields; see route ledger  | HTML limits; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 7 | Limits of Continuous Functions Practice — page-native fields; see route ledger  | limits-finite | Verified missing common-log representation control; remaining alternatives unresolved |
| 8 | One-Sided Limits Practice — page-native fields; see route ledger  | HTML limits; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 9 | sin(1/x) Practice — page-native fields; see route ledger  | page-local/conditional | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 10 | Course Assignment Limits Practice — page-native fields; see route ledger  | page-local/conditional | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 11 | Advanced Trigonometric Limits Practice — page-native fields; see route ledger  | page-local/conditional | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |

### AP Calculus AB / unit-2-derivatives

| Row | Engine / field | Current profile | Audit state |
| --- | --- | --- | --- |
| 12 | Derivative Conceptual &amp; AP-Style Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 13 | Finding Derivatives at a Point Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 14 | Derivatives Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 15 | Derivatives of Inverse Functions Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 16 | Logarithmic Derivative at a Point Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 17 | Derivatives of Logarithmic Functions Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 18 | Trigonometric Derivatives at a Point Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 19 | Derivatives of Trigonometric Functions Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 20 | Power Rule Derivative at a Point Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 21 | Derivatives with the Power Rule Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 22 | Difference Quotient Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 23 | Exponential Derivative at a Point Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 24 | Exponential Functions Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 25 | Implicit Derivative at a Point Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 26 | Implicit Differentiation Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 27 | Inverse Trigonometric Derivative at a Point Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 28 | Inverse Trigonometric Functions Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 29 | Logarithmic Differentiation Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 30 | Chain Rule Derivative at a Point Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 31 | Nested Chain Rule Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 32 | The Chain Rule Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 33 | Product Rule Derivative at a Point Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 34 | The Product Rule Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 35 | Quotient Rule Derivative at a Point Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 36 | The Quotient Rule Practice — inline/renderer fields — enumeration unfinished  | HTML derivative; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |

### AP Calculus AB / unit-3-applications-derivative

| Row | Engine / field | Current profile | Audit state |
| --- | --- | --- | --- |
| 37 | Extrema &amp; Extreme Value Theorem Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 38 | Unit 3 Non-Calculator Mixed Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 39 | Unit 3 Calculator Mixed Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 40 | Equations of Tangent and Normal Lines Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 41 | Horizontal and Vertical Tangent Lines Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 42 | Implicit Tangent Lines Calculator Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 43 | Implicit Tangent Lines Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 44 | Derivative Analysis Calculator Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 45 | Increasing, Decreasing &amp; Concavity Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 46 | L'Hopital's Rule Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 47 | Linearization and Differentials Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 48 | Motion Calculator Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 49 | Motion Non-Calculator Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 50 | Newton's Method Calculator Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 51 | Optimization Calculator Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 52 | Optimization Non-Calculator Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 53 | Related Rates Calculator Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 54 | Related Rates Non-Calculator Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 55 | Rolle &amp; Mean Value Theorems Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 56 | Tangent and Secant Line Approximations Practice — approx-classification approx-classification | unit3-approximation | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 57 | Using Your Graphing Calculator Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |

### AP Calculus AB / unit-4-integrals

| Row | Engine / field | Current profile | Audit state |
| --- | --- | --- | --- |
| 58 | Basic Integrals Practice — answer.stage* antiderivative | unit4-basic-indef | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 59 | Basic Integrals Practice — answer.stage* exact-number | unit4-basic-def | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 60 | Integral Concepts &amp; Numerical Methods Review — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 61 | Unit 4 Comprehensive Review Practice — answer.stage* scalar | unit4-exact | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 62 | Unit 4 Comprehensive Review Practice — answer.stage* function-expression | unit4-ftc | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 63 | Unit 4 Comprehensive Review Practice — answer.stage* antiderivative | unit4-usub-x | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 64 | Unit 4 Comprehensive Review Practice — answer.stage* scalar | unit4-geometry | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 65 | Unit 4 Comprehensive Review Practice — answer.stage* antiderivative | unit4-basic-indef | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 66 | Unit 4 Comprehensive Review Practice — answer.stage* exact-number | unit4-mvt-avg | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 67 | Unit 4 Comprehensive Review Practice — answer.stage* n-expression | unit4-sigma | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 68 | Unit 4 Comprehensive Review Practice — answer.stage* newton-expression | unit4-newton | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 69 | Unit 4 Comprehensive Review Practice — answer.stage* scalar | unit4-newton-value | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 70 | Unit 4 Comprehensive Review Practice — answer.stage* exact-number | unit4-log-def | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 71 | Definite Integrals from Sums Practice — answer.stage* newton-expression | unit4-newton | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 72 | Definite Integrals from Sums Practice — answer.stage* scalar | unit4-newton-value | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 73 | Combining Integral Rules Practice — answer.stage* scalar | unit4-exact | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 74 | Fundamental Theorem &amp; Integral Rules Practice — answer.stage* function-expression | unit4-ftc | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 75 | Integrals Resulting in Natural Log Practice — answer.stage* antiderivative | unit4-log-indef | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 76 | Integrals Resulting in Natural Log Practice — answer.stage* exact-number | unit4-log-def | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 77 | Integrals Using Geometry Practice — answer.stage* scalar | unit4-geometry | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 78 | Introduction to Sigma Notation Practice — answer.stage* n-expression | unit4-sigma | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 79 | Introduction to Sigma Notation Practice — answer.stage* scalar | unit4-exact | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 80 | Mean Value Theorem for Integrals Practice — answer.stage* exact-number | unit4-mvt-avg | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 81 | Mean Value Theorem for Integrals Practice — answer.stage* exact-list | unit4-mvt-c | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 82 | Rectangular Approximations Practice — answer.stage* scalar | unit4-exact | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 83 | Trapezoidal Approximations Practice — answer.stage* scalar | unit4-exact | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 84 | U-Substitution Integrals Practice — answer.stage* antiderivative | unit4-usub-x | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 85 | U-Substitution Integrals Practice — answer.stage* exact-number | unit4-usub-def | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 86 | U-Substitution Integrals Practice — answer.stage* antiderivative | unit4-usub-theta | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |

### AP Calculus AB / unit-5-differential-equations

| Row | Engine / field | Current profile | Audit state |
| --- | --- | --- | --- |
| 87 | Basic First-Order DEs Calculator Practice — answer.parts.* ivp | unit5-basic-x | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 88 | Basic First-Order DEs Calculator Practice — answer.parts.* ivp | unit5-basic-t | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 89 | Basic First-Order DEs Calculator Practice — answer.parts.* interval | unit5-interval-basic | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 90 | Basic First-Order DEs Calculator Practice — answer.parts.* general | unit5-basic-x-c | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 91 | Basic First-Order DEs Calculator Practice — answer.parts.* numeric | unit5-number | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 92 | Basic First-Order DEs Non-Calculator Practice — answer.parts.* ivp | unit5-basic-x | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 93 | Basic First-Order DEs Non-Calculator Practice — answer.parts.* ivp | unit5-basic-t | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 94 | Basic First-Order DEs Non-Calculator Practice — answer.parts.* interval | unit5-interval-basic | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 95 | Basic First-Order DEs Non-Calculator Practice — answer.parts.* general | unit5-basic-x-c | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 96 | Basic First-Order DEs Non-Calculator Practice — answer.parts.* numeric | unit5-number | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 97 | Differential Equations Calculator Review — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 98 | Differential Equations Non-Calculator Review — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 99 | Growth, Decay and Newton's Law Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 100 | Motion Problems Calculator Practice — answer.parts.* exact | unit5-motion-value | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 101 | Motion Problems Calculator Practice — answer.parts.* numeric | unit5-number | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 102 | Motion Problems Calculator Practice — answer.parts.* exact | unit5-motion-value-r | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 103 | Motion Problems Calculator Practice — answer.parts.* list | unit5-motion-list | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 104 | Motion Problems Calculator Practice — answer.parts.* ivp | unit5-motion-t | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 105 | Motion Problems Calculator Practice — answer.parts.* exact | unit5-motion-value-e | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 106 | Motion Problems Calculator Practice — answer.parts.* interval | unit5-motion-intervals | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 107 | Motion Problems Non-Calculator Practice — answer.parts.* exact | unit5-motion-value | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 108 | Motion Problems Non-Calculator Practice — answer.parts.* numeric | unit5-number | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 109 | Motion Problems Non-Calculator Practice — answer.parts.* exact | unit5-motion-value-r | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 110 | Motion Problems Non-Calculator Practice — answer.parts.* list | unit5-motion-list | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 111 | Motion Problems Non-Calculator Practice — answer.parts.* ivp | unit5-motion-t | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 112 | Motion Problems Non-Calculator Practice — answer.parts.* exact | unit5-motion-value-e | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 113 | Motion Problems Non-Calculator Practice — answer.parts.* interval | unit5-motion-intervals | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 114 | Rate Problems Calculator Practice — answer.parts.* exact | unit5-rate-exact | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 115 | Rate Problems Calculator Practice — answer.parts.* numeric | unit5-number | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 116 | Rate Problems Calculator Practice — answer.parts.* exact | unit5-rate-exact-ln | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 117 | Rate Problems Non-Calculator Practice — answer.parts.* exact | unit5-rate-exact | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 118 | Rate Problems Non-Calculator Practice — answer.parts.* numeric | unit5-number | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 119 | Rate Problems Non-Calculator Practice — answer.parts.* exact | unit5-rate-exact-ln | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 120 | Separable Differential Equations Practice — answer.parts.* ivp | unit5-sep-x | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 121 | Separable Differential Equations Practice — answer.parts.* interval | unit5-sep-interval | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 122 | Separable Differential Equations Practice — answer.parts.* ivp | unit5-sep-t | Strongly supported: observed field/profile; accepted-alternative completeness unresolved |
| 123 | Slope Fields Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |

### Integrated Math 1 / unit-1-review

| Row | Engine / field | Current profile | Audit state |
| --- | --- | --- | --- |
| 124 | Unit 1 Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 125 | Integer Addition &amp; Subtraction Practice — inline/renderer fields — enumeration unfinished  | HTML integer; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 126 | Classifying Numbers Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 127 | Decimals Practice — inline/renderer fields — enumeration unfinished  | HTML decimal; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 128 | Fractions Practice — inline/renderer fields — enumeration unfinished  | HTML fraction; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 129 | Multiplication Practice — inline/renderer fields — enumeration unfinished  | HTML digits; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 130 | Integer Multiplication &amp; Division Practice — inline/renderer fields — enumeration unfinished  | HTML integer; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 131 | Order of Operations Practice — inline/renderer fields — enumeration unfinished  | HTML integer; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 132 | Percents Practice — inline/renderer fields — enumeration unfinished  | HTML decimal; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 133 | Reducing Fractions Practice — inline/renderer fields — enumeration unfinished  | HTML fraction; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 134 | Exponents &amp; Radicals Practice — inline/renderer fields — enumeration unfinished  | HTML integer; contextual remap applies | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |

### Integrated Math 1 / unit-2-algebraic-operations-equations-inequalities

| Row | Engine / field | Current profile | Audit state |
| --- | --- | --- | --- |
| 135 | Unit 2 Comprehensive Review Practice — inline/renderer fields — enumeration unfinished  | local/inline | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 136 | Coordinate System and Nine Key Features Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 137 | Distributive Property Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 138 | Combining Like Terms Practice — polynomial polynomial | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 139 | Combining Like Terms Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 140 | Graphing Inequalities and Interval Notation Practice — interval interval | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 141 | Graphing Inequalities and Interval Notation Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 142 | Solving Linear Equations Practice — equation equation | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 143 | Solving Linear Inequalities Practice — choice choice | dispatcher/local | Strongly supported: selection route; no expression keypad required |

### Integrated Math 1 / unit-3-linear-equation

| Row | Engine / field | Current profile | Audit state |
| --- | --- | --- | --- |
| 144 | Arithmetic Sequence Word Problems Practice — fields: formula formula | unit3-formula | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 145 | Arithmetic Sequence Word Problems Practice — fields: number number | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 146 | Arithmetic Sequence Word Problems Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 147 | Common Difference and Next Terms Practice — fields: number number | local numberEntries | Verified accepted fractional alternative and actual numeric-multi fallback route |
| 148 | Common Difference and Next Terms Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 149 | Explicit Formulas for Arithmetic Sequences Practice — formula formula | unit3-formula | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 150 | Finding a Specific Term Practice — input input | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 151 | Finding the Term Number Practice — input input | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 152 | Identifying Arithmetic Sequences Practice — arithmetic-identification arithmetic-identification | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 153 | Section A Review Practice — fields: number number | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 154 | Section A Review Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 155 | Section A Review Practice — input input | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 156 | Section A Review Practice — arithmetic-identification arithmetic-identification | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 157 | Section A Review Practice — formula formula | unit3-formula | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 158 | Section A Review Practice — fields: formula formula | unit3-formula | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 159 | Collinearity and Slope Practice — mc mc | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 160 | Evaluating Functions Practice — input input | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 161 | Section B Review Practice — input input | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 162 | Section B Review Practice — mc mc | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 163 | Slope from Graphs Practice — input input | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 164 | Slope from Two Points Practice — input input | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 165 | Solving Function Equations Practice — input input | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 166 | Point-Slope to Slope-Intercept Practice — fields: line line | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 167 | Point-Slope to Slope-Intercept Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 168 | Linear Function Word Problems Practice — fields: line line | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 169 | Linear Function Word Problems Practice — fields: number number | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 170 | Linear Function Word Problems Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 171 | Section C Review Practice — fields: line line | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 172 | Section C Review Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 173 | Section C Review Practice — fields: number number | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 174 | Slope-Intercept Form Practice — fields: number number | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 175 | Slope-Intercept Form Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 176 | Slope-Intercept Form Practice — fields: line line | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 177 | Writing Equations of Lines Practice — fields: line line | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 178 | Writing Equations of Lines Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 179 | Unit 3 Comprehensive Review Practice — input input | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 180 | Unit 3 Comprehensive Review Practice — mc mc | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 181 | Unit 3 Comprehensive Review Practice — fields: line line | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 182 | Unit 3 Comprehensive Review Practice — fields: number number | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 183 | Unit 3 Comprehensive Review Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 184 | Unit 3 Comprehensive Review Practice — formula formula | unit3-formula | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 185 | Unit 3 Comprehensive Review Practice — arithmetic-identification arithmetic-identification | dispatcher/local | Strongly supported: selection route; no expression keypad required |
| 186 | Unit 3 Comprehensive Review Practice — fields: formula formula | unit3-formula | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 187 | Common Difference and Recursive Formulas Practice — fields: number number | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 188 | Common Difference and Recursive Formulas Practice — fields: initial-term initial-term | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 189 | Common Difference and Recursive Formulas Practice — fields: recursive-rule recursive-rule | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 190 | Common Difference and Recursive Formulas Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 191 | Recursive Formulas from Sequences Practice — fields: number number | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 192 | Recursive Formulas from Sequences Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 193 | Recursive to Explicit Formulas Practice — formula formula | unit3-formula | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 194 | Section D Review Practice — fields: number number | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 195 | Section D Review Practice — multi multi | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 196 | Section D Review Practice — formula formula | unit3-formula | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 197 | Section D Review Practice — fields: initial-term initial-term | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 198 | Section D Review Practice — fields: recursive-rule recursive-rule | dispatcher/local | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |

### Calculus Prep / Topic collection

| Row | Engine / field | Current profile | Audit state |
| --- | --- | --- | --- |
| 199 | Algebra for Calculus — free expression (slash gate)  | local input / selection | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 200 | Algebra for Calculus — choice  | local input / selection | Strongly supported: selection route; no expression keypad required |
| 201 | Function Domains — choice  | local input / selection | Strongly supported: selection route; no expression keypad required |
| 202 | Function Graphs — choice  | local input / selection | Strongly supported: selection route; no expression keypad required |
| 203 | Logarithm Rules — choice  | local input / selection | Strongly supported: selection route; no expression keypad required |
| 204 | Rational Function Analysis — hole / vertical asymptote / end asymptote / intercept selectors  | local input / selection | Strongly supported: selection route; no expression keypad required |
| 205 | Special Factoring — factored expression  | local input / selection | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 206 | Special Factoring — Pascal coefficient list  | local input / selection | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 207 | Synthetic Division &amp; Rational Root Theorem — polynomial quotient  | local input / selection | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 208 | Synthetic Division &amp; Rational Root Theorem — numeric remainder  | local input / selection | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 209 | Synthetic Division &amp; Rational Root Theorem — rational-root candidate list  | local input / selection | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 210 | Synthetic Division &amp; Rational Root Theorem — choice  | local input / selection | Strongly supported: selection route; no expression keypad required |
| 211 | Trig Angle Skills — exact degree/radian answer  | BMExactEditor | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 212 | Trig Angle Skills — choice  | local input / selection | Strongly supported: selection route; no expression keypad required |
| 213 | Trigonometric Equations — solution list  | BMExactEditor | Unresolved: field route, profile or exhaustive reachable kinds still need tracing |
| 214 | Trigonometric Identities — choice  | local input / selection | Strongly supported: selection route; no expression keypad required |

### Calculus Prep / unit-circle-values

| Row | Engine / field | Current profile | Audit state |
| --- | --- | --- | --- |
| 215 | Unit Circle Exact Values — exact trig value / Undefined  | BMExactEditor | Verified comma rejection in both finite/Undefined branches; full profile closure unresolved |
