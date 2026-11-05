> Updated by the Test 2 corrections. See [current changes and verification](CORRECTIONS.md). Download the custom `BatchMath MathLive Test 2.zip` attachment; its root is `BM-ML2`, not a GitHub source-archive folder.

# MathLive advanced integration pilot

This experimental branch extends the verified Power Rule and Chain Rule pilot to Basic Integrals, FTC, Integral Rules, Newton Sums & Limits, and Separable Differential Equations. The requested FTC & Rules group has two existing practice pages, so there are seven participating pages across six engine groups.

The branch is `experiment/mathlive-advanced-pilot`, based on derivatives commit `58d98cda663ff21b0a7e9f434bf0e5ca504ae03b`. It has not been merged or deployed. Unit 6, mathematical generators/checkers, family weights and progression rules are unchanged.

## Download and run on Windows

Download the complete ZIP using the commit-pinned GitHub link in the delivery message. Extract it, open a terminal **inside the extracted website folder** (the folder containing `index.html`), and run:

```bat
py -m http.server 8000
```

Keep that terminal open and visit these links. MathLive is also the default without an `editor` parameter.

| Practice | MathLive | Standard editor |
| --- | --- | --- |
| Basic Integrals | [Open](http://localhost:8000/ap-calculus/unit-4-integrals/topics/basic-integrals/practice/?editor=mathlive) | [Open](http://localhost:8000/ap-calculus/unit-4-integrals/topics/basic-integrals/practice/?editor=legacy) |
| FTC | [Open](http://localhost:8000/ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/practice/?editor=mathlive) | [Open](http://localhost:8000/ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/practice/?editor=legacy) |
| Integral Rules | [Open](http://localhost:8000/ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/integral-rules-practice/?editor=mathlive) | [Open](http://localhost:8000/ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/integral-rules-practice/?editor=legacy) |
| Newton Sums & Limits | [Open](http://localhost:8000/ap-calculus/unit-4-integrals/topics/evaluating-definite-integrals-with-a-limit-and-summation/practice/?editor=mathlive) | [Open](http://localhost:8000/ap-calculus/unit-4-integrals/topics/evaluating-definite-integrals-with-a-limit-and-summation/practice/?editor=legacy) |
| Separable Equations | [Open](http://localhost:8000/ap-calculus/unit-5-differential-equations/topics/separable-differential-equations/practice/?editor=mathlive) | [Open](http://localhost:8000/ap-calculus/unit-5-differential-equations/topics/separable-differential-equations/practice/?editor=legacy) |

Retained pages:

- [Power Rule](http://localhost:8000/ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/?editor=mathlive)
- [Chain Rule](http://localhost:8000/ap-calculus/unit-2-derivatives/topics/the-chain-rule/practice/?editor=mathlive)
- [Advanced notation scratchpad](http://localhost:8000/experiments/mathlive-advanced-notation/) — editable templates only, with no grading.

MathLive 0.111.1 JavaScript, CSS and fonts are hosted locally in the ZIP; no npm install or build is needed to test the website. Existing external services such as MathJax, videos and analytics retain the site's original network behavior.

## Field coverage

| Engine group | MathLive fields | Retained controls / contract |
| --- | --- | --- |
| Power Rule and Chain Rule | Existing derivative answer fields | Successful prior pilot retained |
| Basic Integrals | Antiderivative including typed C; exact definite-integral value | Existing C and exactness decisions |
| FTC & Rules | FTC derivative expressions; Rules exact scalar values | Two existing pages; no integral-entry answers |
| Newton Sums & Limits | Explicit sum/limit construction and existing exact second-part value | Current checker requires explicit expressions in k,n; no expansion of indexed placeholders |
| Separable Equations | Part A explicit particular solution; Part B interval of validity | Both fields use editable MathLive |

Each page uses its existing engine-specific keypad. No universal keypad or new shared profile is introduced. The existing C key works in Basic Integrals; Newton adds signed infinity, a bare limit operator, subscript and approach arrow alongside its templates; the Separable theta key maps to a MathLive theta. Interval controls now use the restricted interval adapter; bracket and union controls are available on this page. Missing assets or runtime failures restore the standard editor and retain the answer; unsupported content offers recovery including an exact LaTeX copy when translation is unavailable.

Reusable templates cover indefinite, definite and double integrals; sums; limits; subscripts/indexed variables; delta; arrows; and infinity. Integral bounds, regions, integrands and nested structures can be edited in the scratchpad. This establishes insertion/editing capability, **not** compatibility with future Unit 6 graders. No integral buttons were added to engines where an integral is only the question statement.

## Readiness and limitations

The results support a larger **staged** rollout with a field and checker audit for each engine. The interval adapter preserves punctuation and translates exact endpoints for the original checker. Newton's existing checker cannot grade unexpanded `f(x_k) Δx`, arbitrary indexed symbols, integral answers or arbitrary nested sums. These are not evaluated or rewritten to award credit. Separable questions require explicit particular solutions; general C answers and arbitrary implicit equations do not gain a new grading contract.

The adapter preserves grouping, constants, decimal digits and unsimplified arithmetic; original checkers decide mathematical equivalence, exactness and validity. It never integrates, solves, evaluates a sum or supplies C. Testing found and fixed one translator grouping error for bare trig powers followed by a parenthesized factor; the original graders were unchanged.

Linux Chromium browser tests do not establish Windows, Chromebook, touch or assistive-technology compatibility. Those device checks remain useful before a broad release.

## Change and merge boundary

Production changes beyond the five target HTML pages are confined to the existing pilot adapter, keypad bridge and pilot stylesheet, plus new modules under `assets/mathlive/`. The shared question renderer, calculus keypad source/profiles, all generators/checkers, service worker and Unit 6 files are unchanged from the derivatives checkpoint. The inherited Power Rule profile refinements remain part of that checkpoint.

Later reconciliation with a newer main may require reviewing the five page script tags, pilot adapter/bridge/styles and any overlapping pilot modules. This task performs no reconciliation. If Unit 6 later changes shared keypad or staged-renderer contracts, validate the wrappers against those changes before merging; do not replace newer generators or graders with this experimental snapshot.

See the [per-engine audit](AUDIT.md) and [exact verification report](TEST-RESULTS.md) for family distributions, field contracts, staged commits, test counts and baseline findings.
