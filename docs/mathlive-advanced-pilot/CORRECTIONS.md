# MathLive Test 2 corrections

Continues `experiment/mathlive-advanced-pilot` from fetched remote `63d7005d4aeea026c3325004bf150b54788e1910`. The prior native Part B decision is superseded: **both Separable parts now use editable MathLive by default**. `?editor=legacy` and answer-preserving runtime fallback remain available.

Newton's construction field now has standalone positive/negative infinity, a bare limit operator, subscript and approach-arrow controls. The complete limit and sum templates remain. Controls use the established dense grid and precede navigation/Check. They are added only to this engine's construction profile; numerical Part 2 and unrelated keypads are unchanged. Legacy signed infinity is tested too. Manually built MathLive limits serialize through the original Newton normalizer and checker; a negative-infinity approach remains incorrect where the problem requires positive infinity.

Separable Part B now translates interval punctuation separately from restricted endpoint expressions. It preserves bracket choices, endpoint order, exact fractions, radicals, logarithms, inverse sine, constants, infinity signs, unions and safely recognizable inequalities. It does not sort, simplify, repair, widen or close intervals. The original Unit 5 checker alone decides invalid versus wrong answers, initial-value containment, connectedness and domain restrictions. Missing endpoints and unsupported notation retain their original MathLive content and offer standard-editor recovery. The interval keypad uses the original profile with bracket/union controls enabled on this page; actual generated answers can be entered entirely on screen.

No question generator, grader, shared calculus keypad source, Unit 6 engine, production deployment or main branch is changed. The keypad bridge adds three insertion mappings; new behavior lives in page-specific modules and the interval adapter. All six family weights and tiers are retained.

## Verification

**100/100 focused tests pass**, including the existing six-engine suites and 7 new interval groups: 2,400 generated Separable intervals, 14,400 paired checker comparisons, canonical generated TeX, and direct punctuation/inequality/union cases. **183/183 browser checks pass**: Power 38, Chain 27, Basic 22, FTC/Rules 22, Newton 27, Separable 42, corrections 5; zero unhandled page errors. See [machine-readable results](../../tools/mathlive-advanced-pilot/artifacts/test2-results.json). All nine production-source integrity comparisons and 24 vendor hashes pass. The final report counts successful completed reruns, not interrupted attempts.

Browser tests use real local MathLive 0.111.1 and real cached MathJax; no mathematical grader is mocked. Tests cover all 26 Separable subtypes through both parts and both editors, invalid/wrong brackets, incomplete structures, signed infinity, exact endpoint expressions, inequalities, copy/paste, history separation, Enter/Continue/Next, first-key focus, reset, narrow layouts and fallback. Uninstrumented HTML also uses MathLive in both parts. The existing complete Newton templates and other engines are rerun as regressions.

The first browser attempts exposed an extra-controls DOM selector error, which was fixed before delivery. An interrupted shared test server and an initial Power Rule timing failure are recorded separately from successful completed reruns. Historical display-format findings and the obsolete Newton revision-suite expectations remain documented in the prior report; none of those production sources changed in these corrections.

## Custom short package and Windows use

The task attachment is exactly `BatchMath MathLive Test 2.zip`, built with the single internal root `BM-ML2/`. It is a custom archive, not a renamed GitHub source ZIP. It contains the complete exported website, including local MathLive runtime/styles/fonts, without Git history, dependencies, build caches or scratch directories. Existing developer-only export exclusions remain in effect.

Extract the ZIP. Open Command Prompt **inside `BM-ML2`**, where `index.html` is directly present, then run:

```bat
py -m http.server 8000
```

| Practice | MathLive | Legacy |
| --- | --- | --- |
| Newton | [Open](http://localhost:8000/ap-calculus/unit-4-integrals/topics/evaluating-definite-integrals-with-a-limit-and-summation/practice/?editor=mathlive) | [Open](http://localhost:8000/ap-calculus/unit-4-integrals/topics/evaluating-definite-integrals-with-a-limit-and-summation/practice/?editor=legacy) |
| Separable | [Open](http://localhost:8000/ap-calculus/unit-5-differential-equations/topics/separable-differential-equations/practice/?editor=mathlive) | [Open](http://localhost:8000/ap-calculus/unit-5-differential-equations/topics/separable-differential-equations/practice/?editor=legacy) |

Newton still requires the current checker's explicit index-variable expressions; unexpanded indexed/delta placeholders and integral answers are not evaluated to force acceptance. Arbitrary interval prose, unsupported set notation and unknown endpoint grammar use recovery rather than guessing. Linux Chromium checks do not establish Windows, Chromebook, touchscreen or assistive-technology compatibility.
