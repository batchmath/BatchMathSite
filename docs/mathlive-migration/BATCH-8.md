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

## Checkpoint A2 — AP Units 3–5 review fields

The six remaining AP review engines reuse one dynamic installer and pure review contracts. Unit 3 preserves non-calculator exact equations, intervals, lists, coordinates, theorem decisions, geometry and limits, plus separate calculator line/decimal/interval policies. Unit 4 dispatches each exact value, antiderivative (with student-entered C), MVT list/applicability, n-expression and Newton construction/value part separately. Unit 5 retains calculator/non-calculator review dispatch, differential equations, general/particular solutions, intervals, growth/rate/motion parts and qualitative/drawing/matching controls. The original selectors, distributions and graders are unchanged.

The Unit 4 assignment page's previously missing dependencies were repaired separately in ab62a1a, before editor activation. See MATH-CORRECTIONS.md for the legacy reproduction.

Source inspection additionally found optional typed slopes/curve-point inputs beneath the retained drawing boards. `slope-entry.mjs` uses the existing native bridge: literal signed slope fractions/decimals/Undefined versus literal decimal curve coordinates. Original input listeners continue to update the drawing and original graphical graders. No arbitrary arithmetic evaluation is introduced. The existing show/hide toggle now honors its hidden attribute; the bridge and its compact keypad appear only when the optional entry is opened. This applies to the slope-field topic and both reviews. Drawing/matching remain specialized.

Node evidence (`reviews-dynamic-node.json`): 9,060 deterministic generated questions, 10,085 typed parts, 42,258 original/translated checker comparisons and 56 requested part modes. Correct stored/displayed answers, plausible wrong values, blank/incomplete input, permitted alternatives, C requirements and calculator selection are compared. Review generators with recent-question histories are replayed with both seeded RNG and test-only history snapshots; browser fixtures regenerate native question objects, retaining function closures. These are bounded family samples, not exhaustive mathematical certification.

Chromium evidence: `reviews-dynamic-browser-verified.json`, six routes / 632 paired submissions / zero errors, with real generators/MathJax, legacy comparisons, typed submission, multipart and choice transitions, selector changes, Enter, fraction/C/Newton/interval controls, undo/redo/deletion, recovery, missing runtime and 375px checks. `slope-entry-browser.json` adds three routes / 12 good/bad graphical-grader comparisons and all optional typed fields, actual fraction/Undefined buttons, Enter, undo/redo, 375px, missing runtime and answer-preserving recovery; zero page errors. Broader Unit 3 variant coverage is being recorded separately for the final audit. Eleven review/application contract guards and 28 derivative-keypad/IM1/limit guards pass. The old advanced-pilot source-isolation assertion is anchored to the verified Batch 7 source, preserving its approved mathematical corrections; its targeted rerun passes.

Next: inspect/handle seven IM1 URLs (Unit 1 is navigation-only), then reconcile the full 137-route inventory and final audit. No production generator or shared mathematical checker was changed in this editor checkpoint.

### Extended AP regression correction

Broader Unit 3 review fixtures exposed a list-adapter defect on `u3-v122-mvt-xlnx`: MathLive's `{e}^{...}` spelling was mistaken for a single enclosing set because the translator stripped the first/last braces without matching them. The structural list adapter now removes only a genuine whole-list wrapper. No mathematical grader changed. The failing-before regression and 11 combined list/contract tests pass; the focused legacy/MathLive Chromium rerun passes four pairs with zero errors (`reviews-dynamic-browser-braces.json`). Original set notation and incomplete-input handling remain covered.

## IM1 checkpoint A1 — Unit 2 review and Unit 1 navigation

Unit 2 comprehensive review reuses `im1.mjs`: simplified integer-monomial expressions get actual-question variables and powers; equation solutions get literal signed decimals/fractions and existing special-solution tokens; typed intervals retain integer endpoints, correct brackets and signed infinity. Decimal/fraction/union controls are excluded from contracts that reject them. Graphs, conceptual choices and the two-stage inequality creation/solve selections remain specialized. The original HTML's omitted interval module was repaired separately in 4234174 before activation. No generator/checker/controller changed.

Evidence: 2,400 deterministic review questions, 1,035 typed parts, 5,409 checker comparisons, all three typed contracts and 54 multipart selections (`im1-review-unit2-node.json`). Chromium: 24 typed signatures, 31 choice signatures, 132 paired submissions, real fraction/exponent/variable/infinity buttons, Enter/Next, undo/redo/deletion, 375px, three contract recovery checks, missing runtime and multipart selection progression pass. `im1-review-unit2-browser-complete.json` records five matching preexisting MathJax speech-explorer errors and zero unexpected errors. The independent no-MathLive legacy reproduction records 34 identical addSpeech/setCurrent errors (`*-legacy-baseline.json`); only that precise route/stack is classified, and every error remains recorded.

`im1/unit-1-review/practice/index.html` has ten topic navigation links and no input, form, generator or answer controller. It remains byte-identical and receives no MathLive dependency. The ten topic destinations were handled in Batch 5 (nine typed, one classification-only). Five Unit 3 reviews remain next, followed by the final route/field/keypad audit.
