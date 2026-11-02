# Batch 1A completed: Product and Quotient Rule

Branch: `migration/mathlive-batch1-derivatives`. Base advanced pilot: `d01896853c8af0950089714fdc2a7a8eccba23d0`. Both symbolic practice pages now default to MathLive, with `?editor=legacy` retained. No other engine is newly converted. Main, Unit 6 and production deployment are untouched.

## Separate mathematical correction

Commit `d05fdb14bb591d85a17068e6fb1eb37dca3c8e43` was committed and pushed **before** Quotient's MathLive conversion. It changes only the qa8 stored exponential denominator from `e^(k*x)^2` to `(e^(k*x))^2` by adding explicit grouping. The question, difficulty, displayed answer and explanation are unchanged. No global parser/equivalence/checking code changes.

`qa8.test.mjs` exercises all **80 combinations** of a=2..5, b=1..5, k=2..5 using actual generated questions. It compares the stored and displayed expressions to the independent derivative `(a/(a*x+b)-k*ln(a*x+b))*e^(-k*x)`, checks credit through the real checker, and rejects both wrong squared-exponent denominators and wrong answers with an added constant. The test fails against the previous representation. The original 23 sampled displayed-answer disagreements are now **zero**.

## Integration and keypad

Quotient reuses the Product page's `rule-derivative.mjs`, existing answer-field lifecycle, keypad bridge and `derivative-product` profile. That profile name is retained for compatibility; it now serves these two explicit opt-in pages. There is no additional shared runtime change in this completion step. All generators/checkers are preserved except the separately authorized qa8 stored-answer correction.

The common profile supplies digits, decimal, signs/arithmetic, fractions, parentheses, exponent, square root, x, e, π, ln, log, absolute value and all six direct/inverse trig functions. Cubic/nth-root forms can be entered through fractional powers; MathLive root structures translate without evaluation. Inverse trig/base-log translation remains opt-in; Power/Chain retain their previous restricted defaults. Required basic Product polynomial simplification remains enforced. No supported controls are removed on preferred-answer evidence alone.

Product covers 43 reachable signatures: pb1–pb3, pa1–pa8 and 32 factor pairs. Quotient covers 72: one basic polynomial family, qa1–qa8 and 63 ordered catalog pairings (polynomial/polynomial is symmetric). This covers logarithmic and exponential denominators, nested fractions, radicals, reciprocal/fractional/negative powers, general-base logs and all six inverse factors. Basic, Advanced and Mixed selector behavior and distributions are unchanged.

## Completed checks

- **71/71 focused Node tests pass**: previous Power/Chain tests, both 900-question rule samples, actual correct/wrong/unsimplified/incomplete parity for every identified signature, source-integrity checks and the 80-case qa8 regression.
- Product: **900 questions**, **172 paired checker comparisons**; Quotient: **900 questions**, **288 pairs**. Both generated TeX and stored-expression imports are checked; displayed-answer disagreements are zero.
- Product browser: **48/48 checks**, **90 paired submissions**.
- Quotient browser: **77/77 checks**, **148 paired submissions**, plus **6/6 targeted interaction/qa8 checks** with six additional pairs. The latter explicitly grades the displayed qa8 derivative and rejects the old wrong denominator through both real editors.
- Power and Chain focused browser regressions: **38/38 Power + 27/27 Chain checks pass**, zero unhandled page errors.
- Browser coverage includes all identified signatures, exact serialized input, simplification rules, all function keys, decimal entry in both modes, nested fractions/negative powers, structural selection/deletion, cursor movement, undo/redo, Enter counted once, Next/reset/history isolation, 375 px layout, uninstrumented default, missing runtime and answer-preserving runtime fallback. No QA hooks ship.

Reports are in `tools/mathlive-batch1/artifacts/`, including `math.json`, `product-browser.json`, `quotient-browser.json`, and `quotient-current-profile-browser.json`. Real local MathLive 0.111.1 and fonts are used. Real MathJax is replayed from temporary same-origin fixtures to isolate CDN availability; no grader is mocked. Linux headless Chromium 154 was used; actual Windows, touch and assistive-technology testing are not claimed.

## Test 3 package

The custom complete-site archive is named `BatchMath MathLive Test 3.zip`, with the single root `BM-ML3/`. It is built only after completed rule/regression tests. Existing export exclusions remove Git history, dependencies and developer-only review tooling. A branch-scoped read-only packaging job may host the same tested source as a temporary GitHub Actions artifact; it does not deploy or modify production workflows.

Extract, open Command Prompt inside `BM-ML3` (where `index.html` is directly present), then run:

```bat
py -m http.server 8000
```

- Product: `http://localhost:8000/ap-calculus/unit-2-derivatives/topics/the-product-rule/practice/?editor=mathlive`
- Quotient: `http://localhost:8000/ap-calculus/unit-2-derivatives/topics/the-quotient-rule/practice/?editor=mathlive`
- Replace `editor=mathlive` with `editor=legacy` to compare.

## Remaining limits and next steps

No Batch 1A engine remains partially enabled. Unsupported notation uses the existing recovery path; arbitrary equivalent-expression closure is not exhaustively certified. Root domain and numerical-equivalence policies remain those of the existing checker. Other copied/legacy generators are outside this targeted correction; no sitewide qa8 repair or parser change is claimed.

Resume by verifying this branch and the package artifact, then request the next small migration batch. Do not begin additional derivative engines or reconcile Unit 6 as part of this checkpoint.

Commands: `node --test tools/mathlive-batch1/rules.test.mjs tools/mathlive-batch1/qa8.test.mjs` plus the existing Power/Chain focused paths. Run `RULE=product` or `RULE=quotient node tools/mathlive-batch1/browser.mjs` with the same Playwright/Chromium/MathJax fixture environment as the pilot. `INTERACTIONS_ONLY=1` runs the smaller follow-up and writes its own report.
