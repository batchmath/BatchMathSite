# Sitewide keypad completeness — final verified audit

**Checkpoints A and B are preserved. Checkpoint C resolves all 119 blocked field rows, and Checkpoint D is complete. No confirmed control gap or unresolved driver failure remains.**

The approved video work is preserved: 66 pages, 198 recordings, seven wider expandable review recordings and the narrow-heading correction. It has not been repeated or redesigned.

## Checkpoint D — final results

The final code checkpoint is `f5d0a73a446e0fe55b285aab5c933cf1548911bf`; subsequent delivery changes contain QA evidence, documentation and archive exclusions. The [consolidated QA record](evidence/KEYPAD-FINAL-QA.json) and [fresh field inventory](evidence/keypad-final-fresh-field-inventory.json) contain the new results, separately from B and C.

| Fresh verification | Result |
|---|---:|
| Mathematical routes / retained specialized and navigation routes | **118 / 20** |
| Deterministic question/form cases, including native interactions | **6,038** |
| Mathematical field records | **6,614** |
| Route/family/part/field/profile signature groups | **4,066** |
| Keypad-only correct mathematical-part assertions | **6,034** |
| Wrong mathematical-part rejection assertions | **6,022** |
| Observed runtime names / registered or pattern definitions | **117 / 153** |
| Node tests | **274/274** |
| Default / legacy / missing-runtime route visits | **374/374 across 138 routes** |
| Detailed pointer/touch, focus and viewport stability | **130/130; 16 controllers, 27 URLs, 3,232 actions** |
| Focused mathematical browsers | **132/132; 543 counted grader pairs, 11 suites** |
| IM1 responsive overlap checks | **102/102** |
| Video presentation | **198 visits; 288 simulated activations** |
| Video sizing | **340/340 visits; 1,056 player checks** |
| Static QA | **0 errors, 0 warnings, 0 broken references** |
| Unresolved controls / driver failures | **0 / 0** |

Every one of the **6,614 fresh mathematical field rows** records the actual runtime profile, displayed controls, buttons used, rendered LaTeX, serialized answer, original correct acceptance and wrong rejection. Whole-part checks can contain multiple fields, so part and field counts differ. Twelve additional accepted-form assertions explain the difference between correct- and wrong-part totals. Three separately labeled original-checker degree probes are not counted as keypad-only successes.

The final browser runs cover all seven Unit 1 runner routes, all 23 derivative routes, all 47 dynamic AP routes, all 13 primary IM1 value/algebra routes, all 22 IM1 Unit 3 routes, and all six Prep routes. Some course/review drawing contexts overlap these groups. Supplemental runs exercise 84 derivative root cases, 18 exact original Unit 4 root witnesses, ten Unit 5 root cases, the four original Unit 3 interval/decimal witnesses, **13 Unit 1 multipart cases and 69 dynamic multi-input contexts**. The original before/after comparison remains **119/119 resolved**. Separable solution cube-root controls remain intact.

All default, `?editor=legacy` and missing-runtime paths pass their applicable route checks. Focused tests verify original correct/wrong distinctions, exactness, required rounding, reduced fractions and equation forms, student-entered `+C`, Enter/Next, physical typing, cursor navigation, undo/redo isolation, active-field changes and fallback recovery. The native degree/radian flow additionally verifies the real Next button and the original automatic advance, with fresh unpinned questions. Two complete legacy root answers and eight separate index/radicand serialization probes verify the precedence follow-up below.

The A video assets and approved HTML remain preserved: 66 pages and 198 recordings, including all 13 IM1 instructional videos, the large lecture/supporting-gallery hierarchy, homework/review toggles and the intentional table-video overrides. A fresh sizing/presentation regression passes; it does not reopen the completed sizing audit. Assignment/key links, removed IM1 notes links, numbering, all 290 PDFs and the exact Unit 6 tree pass source/content checks.

### Evidence phases and counts

The cumulative [CSV](KEYPAD-COMPLETENESS-MATRIX.csv) / [JSON](KEYPAD-COMPLETENESS-INVENTORY.json) retain **6,680 question/form cases and 7,415 mathematical field rows**, with 6,835 correct-part and 6,823 wrong-part assertions. They combine retained findings, corrections and final observations; they are not a sum of every replay. Each row identifies its observation phase and evidence source. Earlier button observations remain historical; the separate fresh inventory is the complete post-correction scope above.

B used additional coefficient/coverage witnesses. D uses the complete route/contract scope with its deterministic control-feature witnesses, root regressions and multipart revalidation. Thus fresh and cumulative counts differ; **all 118 mathematical routes and all 4,066 contract signature groups remain covered**, and no B evidence is deleted. These groups are not counts of independent mathematical families or a proof of arbitrary equivalent-expression closure.

### Investigated test failures and exact resumption

- The first full Node run passed 271/274. Its three failures were historical assertions that required no Chain Rule nth-root key or exact pre-metadata renderer bytes. The updated assertions require the new justified key and first verify exact approved asset hashes before historical comparisons. No mathematical grading assertion was relaxed. Fresh complete reruns pass 274/274.
- Initial functional runs spent time targeting animated field/button geometry. Two diagnostic runs were stopped and excluded. Later final runs resumed **2,193 explicitly passing recorded cases** by exact route, question, family, seed and selector; every retained record must match the regenerated catalog. Unrecorded in-flight work is never counted. Fresh page contexts bound automated state after 40 new cases. See [attempt history](evidence/keypad-final-interrupted-attempts.json).
- Direct MathfieldElement focus in the optimized driver failed to select a second/third active binding in one Unit 1 parameter case and one related-rates case. Their empty mirrors and original rejections are preserved. Using the site's established source-input focus route fixes activation; the values still come only from displayed keypad buttons. Both exact cases pass their original correct/wrong checks, and the full multipart revalidation above passes. The complete final ledgers explicitly link the failing and passing driver evidence.
- One initial legacy stability case coincided with the question growing 15px while the keypad remained within 0.2px in the viewport. The current question typesetting queue was not finished. The harness now awaits that queue and fonts before taking its initial baseline. The old focused run passed 2/3; the ready-state repeat passes 3/3, and a **fresh full 130/130** passes. All original movement, clipping, focus, DOM-replacement and hook-restoration assertions remain unchanged.
- Six of the initial 374 route visits timed out at the unchanged 6,000ms navigation limit while expensive jobs overlapped. They recorded zero page errors. A fresh full single-worker run under reduced load passes **374/374**; it is not an overlay of six reruns.

All initial reports are retained. The 248 canceled B exploratory attempts remain labeled separately; the final fresh inventory includes no canceled attempts. [Attempt review](evidence/keypad-final-attempt-review.json) records the exact resolutions.

### Isolation and delivery

Only `integration/mathlive-im1-videos-content` was pushed. Main and the original MathLive/content heads match their protected values. Unit 6 has zero differences from `919ca1806f07e3cd2af552142926e7ca2b78e8d5`, tree `f50ff9c7c56ca6b02c93d8f8bb88299b37ef2c11`. An independent Unit 6 integration ref advanced externally; it was observed read-only and was not fetched, copied, merged or pushed here. Nothing was merged into main, deployed or published as a release.

The complete local test package is `batchmath-video-sizing-keypad-audit.zip`, built from the final audit commit. `tools/keypad-completeness/package-test.py` checks every included blob, all 24 locked MathLive files, 280 HTML pages, 290 PDFs and eight extracted HTTP resources. Git metadata, temporary caches and machine QA evidence are excluded; the ZIP is not committed. The exact commit-pinned GitHub archive is the authorized fallback delivery.

Extract the site, open a terminal beside `index.html`, run `py -m http.server 8000`, and visit `http://localhost:8000/`. See the [human test checklist](../integration/LOCAL-KEYPAD-VIDEO-CHECKS.md). The delivery response and external delivery manifest record the exact final commit and archive link.

### Limits

This is finite generated-family/control-feature coverage in Chromium 154 with MathLive 0.111.1 and real MathJax 4.1.3/NewCM fixtures. It is not exhaustive coefficient, arbitrary-algebraic-equivalence, physical-device, screen-reader, universal-browser or offline/PWA certification. YouTube responses are simulated: recording availability, audio and subjective handwriting quality require human checks. Normal MathJax and YouTube transports require internet. Unit 6 remains deliberately excluded. No confirmed unresolved keypad defect remains.

## Checkpoint C — all 119 blocked fields resolved

The [explicit before/after comparison](evidence/keypad-corrections-before-after.json) maps **119/119** blocked B field rows to distinct passing current field rows. Every replacement includes actual displayed controls, buttons pressed, rendered LaTeX, the serialized hidden answer, original correct-answer acceptance and wrong-answer rejection. There are **zero unresolved control gaps or driver failures**. Original before-fix evidence remains unchanged and is also pinned at findings commit `961f54ed0d6e42701df0f65f43b2ea625d2c946c`.

| Correction | Verified behavior |
|---|---|
| Inverse-chain absolute value | `ml-review-chain-inverse` adds absolute value only to the targeted inverse-chain review category; five generated inverse-function cases pass |
| Exact interval endpoints | Active controls follow the generated field precision; radical/π endpoints pass on standalone and assignment review, while rounded calculator-review intervals retain decimal controls |
| Accepted linearization decimal | Two field-specific decimal aliases accept `4.125` in standalone and assignment review; exact-required approximation fields retain their original controls |
| Degree switching | Existing degree/radian profiles recognize both raw TeX and rendered `∘`; the three prior-mode witnesses and the full ten-case angle subset pass |
| Indexed roots | The 15 demonstrated profiles gain the existing editable nth-root template; standalone/review separable interval registrations agree; original checker rules are unchanged |
| θ-substitution square root | Only the demonstrated square-root control is added to `unit4-usub-theta`; all three original blocked radical witnesses pass |

The derivative MathLive adapter already translates roots to the original fractional-power grammar. The legacy editor now keeps its visible `root(index,radicand)` slots and serializes complete roots to `((radicand)^(1/(index)))` only in the eight affected derivative modes. Incomplete structures remain incomplete. Eight separate legacy serialization probes cover indices 3, 4, 5 and 12 on Power Rule and Chain Rule; these are not counted as complete-answer passes. Generated whole-answer root tests cover third and fourth roots. Existing cube-root controls remain unchanged where they already suffice.

The [C test summary](evidence/keypad-correction-summary.json) records 185 question/form cases, including one retained native choice, **194 keypad-only correct mathematical-part assertions and 194 wrong-part rejection assertions**. These runs include replay/setup overlap and are reported separately from the deduplicated full ledger. There are 315 active-field/keypad/control geometry checks at 320, 375, 390, 768 and 1280px, two focused pointer/touch stability cases, 34 passing source/contract Node tests, and zero page errors. Tangent/Secant Approximations still passes at both tested widths with exact numerical entry and native classification choices.

Only eight production assets changed from B: keypad profile flags, field-control metadata/selection, rendered degree detection and derivative legacy root serialization. No generator, mathematical checker or acceptance rule changed. The exact approved asset blobs are recorded in `tools/keypad-completeness/approved-corrections.json`; historical source guards first verify those exact bytes before comparing against their original baselines. Source/content preservation passes, including unchanged PDFs and Unit 6. The registry now contains 153 registered/pattern definitions; 117 runtime names appear in the cumulative field ledger.

At Checkpoint C, the cumulative ledger contained 6,580 question/form cases, 7,279 mathematical field rows, 6,699 correct-part assertions and 6,687 wrong-part assertions. These combine unchanged B evidence and corrected C replacements; they are **not a fresh sitewide post-correction regression count**. The historical findings section below retains its original counts and blocked examples. The completed D results above supersede that checkpoint-only status.

## Legacy-root precedence follow-up found during D

A new complete legacy-answer regression caught an input-serialization defect in the initial C patch: `root(3,x)^4` became `(x)^(1/(3))^4`, changing exponent association. The earlier standalone root-fragment comparison did not catch it. The correction wraps the entire serialized root power, producing `((x)^(1/(3)))^4`. It changes no mathematical generator or checker.

The [failing-before reproduction](evidence/keypad-legacy-root-grading-precedence-before.json) serves the exact initial C keypad from `db3fff911235018a1e7da7723a8ea94934dff9e1`. Complete generated Power Rule and Chain Rule answers fail there. Both now pass actual legacy keypad construction and original correct/wrong grading in [the corrected complete-answer evidence](evidence/keypad-legacy-root-grading-final-d.json). The Power Rule witness contains both third and fourth roots, including a powered root in a denominator. All eight separate index/radicand serialization probes still pass. These legacy tests are reported separately from MathLive-only assertion counts.

The exact approved blob manifest and prepared correction patch include the final grouping. Historical Node assertions are reconciled only for those exact tested bytes; the Chain Rule profile assertion now requires its justified indexed-root key. The full D suites now pass as recorded above; the final product checkpoint is `f5d0a73a446e0fe55b285aab5c933cf1548911bf`.

## Checkpoint B — preserved findings

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

These are finite metadata/signature groups, not counts of independent mathematical families or every possible coefficient. Correct-part counts include explicit meaningful-alternative assertions, while setup/replay submissions are not counted again. Semantic-only legacy/Node checker witnesses are never counted as keypad-only successes. At B, the profile specification contained 150 registered names; the final count is 153 above. Registration alone does not establish reachability or completeness.

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

This table preserves the findings as recorded in B. The corresponding product corrections and passing evidence are documented in Checkpoint C above.

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

## Completion

A, B, C and D are complete. The original findings, corrected status and fresh final results remain distinct. The final audit commit contains QA/documentation and delivery exclusions; the tested website code remains identical to `f5d0a73a446e0fe55b285aab5c933cf1548911bf`. No merge or deployment occurred.

## Reproduction and limitations

Run from the repository root with Chromium/Playwright and `MATHJAX_FIXTURE_ROOT` pointing to the real local fixture directory. Evidence files record selectors, seeds, question IDs, active parts, controls and expressions. Examples:

```sh
node tools/keypad-completeness/unit2-browser.mjs
ALTERNATIVE_ROOTS=1 REPORT_SUFFIX=-root-recheck node tools/keypad-completeness/unit2-browser.mjs
EXPAND_ANSWER_FORMS=1 ROUTE_INDEX=36,37,38,39,40,41,42,43,44,45,46 node tools/keypad-completeness/dynamic-browser.mjs
REQUIRE_PASS=1 VERIFY_LAYOUT=1 REPORT_SUFFIX=-corrected node tools/keypad-completeness/unit2-browser.mjs
```

`REQUIRE_PASS=1` makes any recorded failure or page error fail the run. Finding collection intentionally retains expected failures without claiming repair. `REPLAY_FILE` selects prior failed IDs; `AUDIT_PRIOR` reuses explicitly passing witnesses; retest-only rows do not substitute for a full route's coverage. `coverage-witnesses.mjs` records the finite control-feature proof.

Finite seeded/source-family coverage does not prove every arbitrary equivalent expression. Tests use headless Chromium, rather than physical-device or assistive-technology certification. Original YouTube media playback is outside the keypad audit; the approved sizing/presentation evidence and its stated limits remain in the video report. No mathematical generator, checker or answer-acceptance rule changed in this keypad task.
