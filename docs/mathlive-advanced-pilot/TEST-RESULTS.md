> Historical verification at `63d7005`. See [Test 2 corrections](CORRECTIONS.md) for the current interval coverage and rerun results.

# Advanced pilot verification

Verified on 2026-10-31 UTC with Node 24.19.0 and Linux headless Chromium **154.0.8037.57**. The final combined run passed **93/93 focused tests** and **178/178 browser checks**, with zero unhandled page errors. No tests were skipped in the focused run. There was no actual Windows, Chromebook, touch-device or assistive-technology testing.

## Checkpoints and scope

The starting remote derivatives pilot was verified at `58d98cda663ff21b0a7e9f434bf0e5ca504ae03b`. An isolated worktree and new branch were created from that commit. Main remained `26ec4f15185c37f9e8843e96a09d583b47babcdf`.

| Stage | Commit | Focused result at that checkpoint |
| --- | --- | --- |
| Basic Integrals | `1318c0a3c96dce21503847fea5ea3a252ea7f841` | 13 tests + 22 browser checks pass |
| FTC & Integral Rules | `04603abd83959ab036e970cd2a9f9031af0437a9` | 3 test groups + 22 browser checks pass |
| Newton & isolated templates | `97ab57bd0120113487e3015e737cb37706ea4446` | 3 test groups + 27 browser checks pass |
| Separable multipart workflow | `a3102457bc06047c71662045deebf5427194e218` | 7 test groups + 42 browser checks pass |
| Combined verification | Final delivery commit | All 93 focused tests + all 178 browser checks pass |

The final integrity test compares nine complete production sources byte for byte with the derivatives checkpoint: the shared generator, Unit 4 checker, derivative expression checker, staged renderer, Separable generator, Unit 5 answers/UI/core, and calculus keypad. All are unchanged. Unit 6 and other engines are untouched. The prior derivative tests independently retain engine/script integrity and SHA-256 verification of all **24** pinned vendor files.

## Mathematical and translation checks

The newly integrated engines use **17,200 actual generated questions** and **71,800 paired checker comparisons**. A pair means comparing the unchanged checker's complete response for translated MathLive input with its response for the corresponding direct legacy input. Canonical generated-answer checks and interval checks run in addition; these are not counted again as paired comparisons.

| Engine | Generated questions | Paired comparisons | Coverage |
| --- | ---: | ---: | --- |
| Basic Integrals | 2,200 | 8,800 | 200 per each of 11 families; generated TeX, C, incorrect/unsimplified/incomplete responses |
| FTC | 4,000 | 16,000 | All 8 families; variable bounds, nested functions, factors and trig powers |
| Integral Rules | 4,000 | 16,000 | All 6 families; exact numerical answers and invalid/unsimplified forms |
| Newton | 4,000 | 16,000 | All 4 families and 8 nonpolynomial subtypes; actual notation, wrong bounds/body, 3,185 exact second parts |
| Separable | 3,000 | 15,000 | 500 per each of 6 families; all 26 subtypes, all family tiers, x/t/theta, particular solutions and native intervals |

Basic tests additionally verify missing C rejection, exact decimal digits, unreduced fractions, roots, equation-label preservation and unsupported-content refusal. FTC includes explicit `2x sec(x^6)` and a real generated secant-squared/parenthesized-product case. That case exposed an adapter grouping error, which was corrected without editing a grader. Newton tests verify compact TeX fraction arguments, unchanged indices/bounds/approach, incomplete slots, safe legacy imports and refusal of unexpanded indexed/delta/integral answers. Separable tests compare correct, wrong, unsimplified, unwanted-C and incomplete responses; each generated question also checks its correct native interval and rejects incorrect endpoint brackets.

Actual checking paths are the existing derivative `check()`/equivalence logic; `BatchMathUnit4Answers.check` and its antiderivative, exact-number, FTC and Newton paths; and `BatchMathUnit5Answers.check` for IVPs and validity intervals. The adapter supplies syntax, never a new mathematical decision.

The 67 retained derivative tests also pass in this combined run, including 1,080 Power Rule round trips / 3,240 pairs, the 3,600-answer keypad inventory, 12,000 Chain Rule questions / 24,000 generated-answer translation checks, and 336 actual `check()` pairs. These counts are separate from the new Unit 4/5 table.

## Real-browser checks

| Group | Passed / executed |
| --- | ---: |
| Power Rule | 38 / 38 |
| Chain Rule | 27 / 27 |
| Basic Integrals | 22 / 22 |
| FTC & Rules | 22 / 22 |
| Newton & isolated templates | 27 / 27 |
| Separable | 42 / 42 |
| **Total** | **178 / 178** |

These are compound scripted checks, not 178 individual questions. The suites load actual practice pages, real MathLive 0.111.1, all 20 local font faces, original keypads, and actual checker/progression code. Test-only closure hooks are injected into intercepted test responses; no QA hooks ship in the application. Uninstrumented pages are also exercised.

Coverage includes default/explicit MathLive and legacy modes; correct/wrong/incomplete/unsimplified grading; all generator families; C and theta keys; cursor/selection, nested fractions/exponents, native structural editing, undo/redo and clipboard; first key and correct active-field focus; Enter/held Enter, Check/Continue/Next; new-question and multipart history isolation; Practice Type selectors where present; long input and 375/1500 or 1600 px layouts; missing runtime/fonts/styles, delayed startup, runtime exceptions and lossless unsupported-LaTeX recovery. Unrelated Product/Quotient pages retain their native editors and make no MathLive requests.

Newton checks edit the lower and upper sum bounds, limit variable and infinity approach, preserve actual serialized checker input, and exercise exact Part 2 values. The separate scratchpad fills indefinite/definite/double integrals, indexed variables, delta, sum and limit templates, and nests a sum inside a definite integral. Those integral and double-integral checks establish editable notation only; no unimplemented grading contract is claimed. Separable browser tests take all 26 actual subtypes through both parts in both modes and verify the intentionally native interval stage.

Real MathJax 4.1.3, NewCM fonts and worker assets are replayed from cached comparison fixtures via temporary same-origin URLs because external browser networking is restricted. No renderer/checker is mocked and no MathJax application changes ship. Focused contexts block service workers and external analytics to isolate the editor checks. Delivery verification separately uses the extracted GitHub ZIP with the normal service worker enabled.

Reports and screenshots are in [advanced artifacts](../../tools/mathlive-advanced-pilot/artifacts/), [Power Rule artifacts](../../tools/mathlive-power-rule/artifacts/) and [Chain Rule artifacts](../../tools/mathlive-derivatives-pilot/artifacts/).

## Existing regressions and unchanged-baseline findings

| Existing suite | Completed outcome |
| --- | --- |
| Final-four-integrals QA | PASS: 12,000 samples per engine, 51,650 independently verified answers, zero errors/warnings |
| Power Rule family QA | PASS: 22,500 individual + 12,000 review samples |
| Shared calculus keypad structure | PASS: 139 cases |
| Keyboard/accounting regression | PASS: 46 cases |
| Derivative/topic enhancements | PASS: 102,000 samples |
| New derivative engines unit QA | PASS: 9,148 checks |
| FTC/shared-parser regression | PASS: 9,047 checks, including 3,000 generated FTC/Rules answers |
| Current Newton explanations QA | PASS: 3,000 questions, 2,336 with exact evaluation, zero errors |
| Unit 5 release QA | PASS: all 23 release check groups, including Separable generation, branch/exponent checks and keypad coverage |
| Fraction-sign equivalence | Same unchanged-main failure: one negative-numerator display finding |
| Sitewide fractional exponents | Same unchanged-main failure: 22 display-format findings |
| Historical Newton revision QA | Same unchanged-main failure before the question-sample loop: obsolete comparison of Basic Integrals with its older generator |

The last three original suites were executed on this branch and on a detached worktree at exact main `26ec4f15185c37f9e8843e96a09d583b47babcdf`. The fraction findings match exactly: the negative-numerator finding is in `unit3-applications-generators.js`; the 22 superscript findings are in that file, `unit3-optimization-related-rates.js` and `ap-topic-generators.js`. These are preexisting display issues, not new MathLive grading changes. None of those sources was edited and no finding was suppressed.

The older `newton-sums-revision-qa.mjs` hardcodes checkpoint `561ca3e...`, preceding later Basic Integrals changes. Both trees stop with `Other factory changed: basic-integrals`. A diagnostic copy changing only its comparison SHA to the derivatives checkpoint then stops at its stale `summand` explanation-marker expectation; it is **not counted as a passed 10,000-question run**. The current 3,000-question explanation suite and new 4,000-question adapter/checker suite complete successfully. Original QA files remain unchanged.

Early sandbox-restricted attempts could not launch some Git/rg subprocess checks. The completed focused totals above come from a rerun with subprocess access, with test concurrency set to one. Interrupted/restricted attempts and the diagnostic Newton copy are not counted as passes.

See [regressions.json](../../tools/mathlive-advanced-pilot/artifacts/regressions.json) for recorded outcomes and baseline findings. `git diff --check` passes.

## Reproduce

The website ZIP needs only the static server in the [Windows guide](README.md). Developer tests require a Git checkout containing baseline objects, Node, Playwright and Chromium. The Unit 5 review-lab tooling is intentionally export-ignored in website ZIPs, as in the original repository.

```sh
node --test --test-concurrency=1 \
  tools/mathlive-power-rule/adapter.test.mjs \
  tools/mathlive-power-rule/keypad-audit.test.mjs \
  tools/mathlive-derivatives-pilot/chain.test.mjs \
  tools/mathlive-advanced-pilot/basic.test.mjs \
  tools/mathlive-advanced-pilot/ftc.test.mjs \
  tools/mathlive-advanced-pilot/newton.test.mjs \
  tools/mathlive-advanced-pilot/separable.test.mjs

node tools/mathlive-power-rule/browser.mjs
node tools/mathlive-derivatives-pilot/browser.mjs
node tools/mathlive-advanced-pilot/basic-browser.mjs
node tools/mathlive-advanced-pilot/ftc-browser.mjs
node tools/mathlive-advanced-pilot/newton-browser.mjs
node tools/mathlive-advanced-pilot/separable-browser.mjs
```

Set `CHROMIUM_PATH` for the available browser executable and `NODE_PATH` if needed to resolve Playwright. For full MathJax checks set `MATHJAX_FIXTURE_ROOT` to the comparison worktree's `experiments/math-entry/vendor` directory. Without it, suites use the site's existing external-load fallback and omit extra rendering checks. Power/Chain start ports 8138/8139; each advanced suite uses 8150, so run advanced suites sequentially or provide `ADVANCED_URL` for an existing server. Temporary renderer fixtures are removed afterward.

Existing suites run as `node tools/<suite-name>.mjs`. Results support further audited stages, with the documented native interval field and unsupported Newton forms retained. They do not establish a universal editor migration or compatibility with future Unit 6 graders.
