# Batch 8 — comprehensive reviews and assignments

## Checkpoint A1 (migration still incomplete)

- Unit 1 comprehensive: 18 category options, scalar exact/finite/signed-limit fields, multipart continuity parameters and each discontinuity-location stage default to MathLive. Graph/table/theorem/continuity decisions, classifications and further-location decisions retain their original controls. Field keypads follow the actual category/part; finite parameter/location fields use the compact rational profile.
- Unit 2 symbolic comprehensive: all 22 category options, including mixed and focused Product/Quotient/Chain variants. Actual generated category selects the keypad (h for difference quotients; x/y for implicit/logarithmic fields; compact numeric inverse values; trig/log/inverse controls where needed). The original simplified-polynomial gate remains intact.
- Unit 5 old assignment-practice URL: navigation-only meta-refresh to its review landing page, with a choice of calculator/non-calculator review links. No editor/input is present, and the redirect stays unchanged.

Two preexisting legacy mathematical defects in the symbolic review were separately corrected/pushed before editor activation: duplicated qa8 exponential denominator (19ab475) and omitted h identifier/scopes (2764b4a). See MATH-CORRECTIONS.md and their failing-before/passing-after regressions. No other mathematical source changes in A1.

## Evidence

- Unit1: 2720 deterministic questions, 2243 representative typed parts, 11215 checker comparisons; 17 selector options.
- Unit2: 26400 deterministic questions, 573 representative typed parts, 2865 checker comparisons; 22 selector options.

Unit 2 also checks 573 displayed solutions. Counts are bounded source-family sampling, not exhaustive mathematical equivalence. Seventeen combined contract/isolation tests pass, including the new opt-in h adapter guard. Existing derivative symbol defaults are unchanged. Fifty-six focused original Power/Product/Quotient/FTC/Separable regression tests also pass.

Chromium: both routes, 28 Unit 1 and 48 Unit 2 signatures, 350 paired submissions, zero page errors. Static/multipart recovery and missing-runtime checks pass. Evidence is in tools/mathlive-sitewide/artifacts/reviews-static-browser-complete.json. Actual questions, original checks, correct/wrong/blank/incomplete/+0 answers, custom stages, selector transitions, physical typing, fraction controls, undo/redo/deletion, Enter/Next, 375px rendering, missing runtime and answer-preserving static/multipart recovery are exercised with local MathLive and real cached MathJax. The initial Unit 1 legacy CSS rule hid the new custom-part keypad; review.css restores only that keypad inside its own host. No unrelated styling changes.

## Next checkpoint

Finish the six remaining actual AP Unit 3/4/5 review engines (the seventh listed AP URL is the handled redirect), then the seven IM1 reviews. Preserve the nine original AP URLs and all seven IM1 directory paths. Rebuild the full reachable-route/field inventory, reconcile keypad evidence, run shared regressions, and write FINAL-AUDIT.md before claiming sitewide completion.

No main/Unit 6/content-branch changes, merge, deployment, release or ZIP.

### A1 editor reset regression

A focused browser test reproduced old answer text returning through Undo after the student cleared a field and changed questions. The review reset now explicitly resets MathLive history even when both old and new source values are empty. Both comprehensive reviews pass the failing-before/passing-after test (zero page errors); legacy behavior and grading are unchanged. Evidence: `reviews-static-browser-history-before.json` and `reviews-static-browser-history-after.json`. The native bridge's reset event is opt-in, so unrelated controllers are unaffected.
