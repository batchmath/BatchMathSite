# Batch 1A stable checkpoint: Product Rule

Base: verified remote advanced pilot `d01896853c8af0950089714fdc2a7a8eccba23d0`. Development branch: `migration/mathlive-batch1-derivatives`. Product Rule is the only newly enabled engine. Quotient Rule remains byte-identical to the base, with its original editor. No production deployment, merge, Unit 6 change or generator/checker alteration occurs.

## Completed Product Rule

The symbolic practice page defaults to MathLive and accepts `?editor=legacy`. It reuses the existing answer-field lifecycle, keypad bridge, focus/keyboard/reset/fallback and the original `check()` function. Its entire inline mathematical engine is byte-identical to the base.

Reachable families are `pb1`, `pb2`, `pb3`; `pa1`–`pa8`; and all 32 catalog factor pairings. Those pairings cover polynomial, reciprocal, radical, cube root, fractional/negative powers, sin/cos/tan/sec/csc/cot, ln, general-base logarithms, exponentials, base exponentials and all six inverse functions. The original Basic/Mixed/Advanced selector and weights remain unchanged. Basic pb answers must still be distributed and combined; advanced equivalent unsimplified answers retain their original decisions.

The old algebra-only pad did not cover advanced answers. The new `derivative-product` profile supplies digits, decimal, signs/arithmetic, fraction, parentheses, exponent, square root, x, e, π, ln, log, absolute value and all six direct/inverse trig functions. Cubic/nth roots are expressible using fractional exponents, consistent with the legacy grammar; MathLive root notation translates structurally to fractional powers. No unsupported native `root()`/`cbrt()` keys are added. No additional supported alternatives are removed. Arbitrary equivalent-expression closure remains unresolved; this is reachable-family verification, not a claim about every possible mathematical identity.

A single new built-in keypad declaration avoids profile-registration timing races. All other keypad implementation and profile lines are unchanged, verified against the prior checkpoint. The generic derivative mounting function now accepts an optional translator. Product alone opts into inverse functions and base-subscript logarithms; the latter become `ln(argument)/ln(base)` without evaluation or simplification. Default Power/Chain inverse/base-log restrictions remain tested. No mathematical equivalence checker changes.

## Completed validation

- **70/70 Node tests pass**: the 67 focused Power/Chain tests plus three Batch 1 test groups. Product uses 900 seeded questions across all three modes, checks generated TeX and legacy-expression structural imports, and compares 172 correct/wrong/unsimplified/incomplete outcomes across all 43 families.
- **48/48 Product browser checks pass**, including all 43 families and 90 paired grading submissions, original simplification policy, function keys, nested fractions/negative exponents, native cursor/deletion, undo/redo, Enter counted once, Next/reset, narrow layout, uninstrumented default and missing-runtime/runtime-exception recovery.
- **5/5 final-profile interaction checks pass** (4 additional paired submissions). It repeats the interaction checks against the final keypad declaration, including decimal entry in both modes.
- **38/38 Power Rule + 27/27 Chain Rule browser checks pass**. The Power suite's unrelated-engine sentinel now points to still-unconverted Quotient rather than newly converted Product. Test-only closure hooks never ship in the application.
- Real local MathLive 0.111.1 and 20 fonts; real cached MathJax replayed through temporary test endpoints. No grader is mocked. Linux headless Chromium 154 was used; no claim of Windows/touch/assistive-technology testing.

Reports: `tools/mathlive-batch1/artifacts/math.json`, `browser.json`, `current-profile-browser.json`. Early registration/layout attempts failed and were corrected before this checkpoint; only completed successful runs are counted here.

## Quotient blocker — no partial integration enabled

The unchanged `qa8` family stores a denominator such as `e^(2*x)^2`, which its parser interprets as `e^((2*x)^2)`. Its worked/displayed answer uses `e^(4x)`. These are different functions. Example generated question: `f(x)=ln(2x+4)/e^(2x)`; the displayed derivative uses the mathematically intended `e^(4x)` denominator, but the stored answer checker rejects it. This predates MathLive; changing an adapter to reproduce the erroneous value would change mathematical meaning.

The diagnostic samples 900 Quotient questions and observes **23 displayed-answer disagreements, all qa8**. All 72 family/orientation signatures were reached: one basic polynomial family, eight direct advanced families, and 63 ordered catalog pairings (the polynomial/polynomial pair is symmetric). The diagnostic preserves this known failure explicitly rather than claiming 900 valid displayed answers. Its 288 legacy/translated stored-answer comparisons pass; these comparisons do not cure the underlying mathematical issue. Both engines' original script equality is asserted.

## Exact resume steps

1. Review and authorize a separate fix for the preexisting Quotient qa8 generator/checker disagreement. Add a regression for exponent associativity and compare the displayed answer with the intended derivative. Do not solve this by silently changing the adapter.
2. Once that mathematical correction is approved/tested, opt only the symbolic Quotient page into the reusable rule-derivative module and the verified profile (or a separate equivalent named profile).
3. Reuse the existing diagnostic family fixtures for all 72 Quotient signatures. Run actual paired browser checks, key entry, focus/history/Enter/reset/fallback and Product/Power/Chain focused regressions.
4. Update the two audit rows and this checkpoint. Only when both engines are fully converted, create `BatchMath MathLive Test 3.zip` with root `BM-ML3`, verify extraction and all participating practice URLs, then provide its custom download. No Test 3 package is claimed at this Product-only checkpoint.

Developer commands: `node --test tools/mathlive-batch1/rules.test.mjs` and the existing Power/Chain test paths; `node tools/mathlive-batch1/browser.mjs`. Browser dependencies/environment match the prior pilot. `INTERACTIONS_ONLY=1` writes the separate final-profile report; `CHAIN_PILOT_URL` can select another local test port.
