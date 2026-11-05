# Final MathLive migration audit

**Complete and tested for the approved scope** on `migration/mathlive-sitewide`, ready for later integration. Every eligible mathematical field is accounted for; specialized controls are retained. No merge or deployment has been performed. Tested implementation checkpoint: `cfefbe5ad6e18f5086cc221505e065a41e24b0db`.

## Inventory and field coverage

| Course / unit | Routes | Mathematical | Specialized | Navigation |
|---|---:|---:|---:|---:|
| AP Calculus 1 | 12 | 9 | 3 | 0 |
| AP Calculus 2 | 25 | 23 | 2 | 0 |
| AP Calculus 3 | 21 | 21 | 0 | 0 |
| AP Calculus 4 | 13 | 13 | 0 | 0 |
| AP Calculus 5 | 15 | 11 | 0 | 4 |
| IM1 1 | 11 | 9 | 1 | 1 |
| IM1 2 | 7 | 4 | 3 | 0 |
| IM1 3 | 23 | 22 | 1 | 0 |
| Calculus Prep | 11 | 6 | 5 | 0 |
| **Total** | **138** | **118** | **15** | **5** |

[ROUTES.csv](ROUTES.csv) records the controller/bridge, actual answer contracts, dynamic profiles, specialized controls, fallback, evidence and limits for each route. The [full field inventory](../../tools/mathlive-sitewide/artifacts/final-field-inventory.json) retains family enumerations and selector options. [IM1 field tracing](../../tools/mathlive-sitewide/artifacts/field-contracts-im1.json) records 83 distinct route/field contracts across 22 typed Unit 3 routes, including native numeric multipart paths.

The earlier 137-route inventory was incomplete. Scanning every course HTML/controller, practice directory and Prep engine found one additional actual engine: `ap-calculus/unit-1-limits-continuity/topics/introduction-to-continuity/continuity-parameters/index.html`, linked by its topic and sitemap. Its eleven variants and all k/a/b fields now use the existing Unit 1 bridge. All original sixteen pending URLs are resolved; see [Batch 8](BATCH-8.md). No eligible mathematical field remains knowingly unmigrated in this scope.

Navigation-only pages have no mathematical entry: IM1 Unit 1 Practice, the old Unit 5 assignment-review redirect, and the Basic DE / Motion / Rate practice launchers. Fifteen other routes retain only their original choices/classification/feature selections. Mathematical routes also retain theorem decisions, graph/table interpretation, Yes/No, graph matching, slope/curve drawing and appropriate specialized tools. Optional typed slopes and curve-point values beneath drawing boards were separately converted; drawings and their graders remain original.

## Mathematical and editor preservation

Local MathLive **0.111.1** and fonts remain pinned; no editor CDN was introduced. Existing shared/native/dynamic bridges are reused. Source generators, question distributions, difficulty and Practice Type controls, calculator distinctions, original form gates, exact/rounded rules, explanations, scoring and progression remain intact.

[Source preservation evidence](../../tools/mathlive-sitewide/artifacts/source-preservation.json) checks 66 classical JavaScript assets against the verified starting branch. The sole changed classical asset is the separately corrected list-boundary fraction normalizer. Other generator/checker/renderer assets are unchanged. Two mathematical corrections confined to the symbolic review's inline source—qa8 and declared h—were separately committed. See [MATH-CORRECTIONS.md](MATH-CORRECTIONS.md) for failing-before reproductions, correct/incorrect checks and the two missing-dependency repairs.

Editor regressions resolved separately include [empty-to-empty question undo history](HISTORY-ISOLATION.md), braced exponent bases mistaken for enclosing answer sets, and first-question initialization order on six AP reviews. The latter was caught by the uninstrumented sweep: forced fixtures had re-rendered after installation. Deferring only the existing review driver installs the bridge before the first question; generators and graders do not change.

Contracts structurally serialize the student's entry. They do not solve, evaluate, expand, factor, rationalize or rearrange it to satisfy an instructional requirement. Literal fractions stay unreduced; uncombined polynomial terms still fail; required line forms and sequence identifiers remain enforced; C stays student-entered; interval endpoints/brackets and original rounding spelling remain checker responsibilities.

## Node evidence

The shared final run passed **273/273 tests** after the native-field history correction, covering original pilots, every completed batch, reviews, the discovered continuity engine, startup order/isolation, mathematical fixes, contracts and source guards. [Summary](../../tools/mathlive-sitewide/artifacts/final-node-summary.json). The older pilot isolation assertion now uses the verified Batch 7 source rather than rejecting its already approved corrections; no grader assertion was weakened.

The retained sitewide batch evidence contains **445,457 original/translated checker comparisons**, excluding original-pilot comparison totals and repeated reruns. Batch 8 plus the discovered continuity route accounts for **130,834** of those comparisons. These are bounded deterministic generator/checker samples, not proof of arbitrary mathematical equivalence.

| Evidence group | Checker comparisons |
|---|---:|
| Unit 2 Batch 1B | 7,700 |
| Unit 4/5 topic fields | 23,028 |
| Unit 3 topic fields | 110,260 |
| Unit 1 topic fields, including locations | 24,400 |
| IM1 Units 1/2 topics | 58,378 |
| IM1 Unit 3 topics | 69,316 |
| Calculus Prep | 21,541 |
| AP Unit 1/2 reviews | 14,080 |
| AP Unit 3–5 reviews | 42,258 |
| IM1 Unit 2 review | 5,409 |
| IM1 Unit 3 reviews | 64,087 |
| Additional Continuity Parameters | 5,000 |

Original-pilot suites also check Power/Chain/Product/Quotient, Basic Integrals, FTC, Newton and Separable DE; their existing evidence remains intact. The final application rerun uses the suite's default 360 seeds and is archived separately, preserving the broader original 1,200-seed evidence.

## Chromium evidence

The latest [route/mode results](../../tools/mathlive-sitewide/artifacts/route-sweep.json) pass **374/374 checks across 138 routes**: 118 MathLive, 118 explicit legacy, 118 missing-runtime and 20 specialized/navigation visits. These use real uninstrumented pages, generated questions, local editor/fonts and cached real MathJax at 375px. They verify actual active mathematical inputs, editor coverage, no duplicate legacy editor and field/keypad bounds; script tags alone are insufficient.

This is a fresh full 374-check run after both the startup and native-field history corrections. Eight initial startup failures remain in `route-sweep-initial.json`; the intermediate eighteen corrected-route visits remain in `route-sweep-startup.json`. The final results are not a composite overlay, and the original failing run is not represented as clean.

| Batch 8 functional browser checks | Paired submissions / scope |
|---|---|
| AP Unit 1/2 reviews | 350 pairs; static and custom multipart fields |
| AP Unit 3–5 reviews | 632 pairs across six routes |
| Expanded AP application review | 395 signatures / 390 pairs; calculator review also passes its 177 typed signatures |
| IM1 Unit 2 review | 132 pairs; 24 typed / 31 selection signatures; three recovery contracts |
| IM1 Unit 3 reviews | 960 pairs; 168 signatures; all 27 selector options; five recovery groups |
| Continuity Parameters | Eleven variants / 55 pairs; all fields, reset/history, recovery and missing runtime |
| Optional drawing entries | Twelve correct/incorrect graphical-grader comparisons across three routes |

Functional suites cover actual buttons and physical typing, structural fractions/exponents/roots, variable and sequence notation, Enter/Next, reset, clear/selection/deletion, undo/redo, question/part transitions, active-field focus, strict wrong/blank/incomplete/form-sensitive checks and answer-preserving injected failures. Explicit legacy and missing runtime are verified on every mathematical route; injected recovery is sampled per shared adapter/contract group. Desktop/narrow and prior touch-emulation checks are automated Chromium evidence, not physical-device or assistive-technology certification.

Final focused legacy-suite reruns pass **132/132 checks**, with **543 explicitly counted paired submissions** plus the Power/Basic functional checks and zero page errors. [Consolidated results](../../tools/mathlive-sitewide/artifacts/final-regressions/summary.json) cover Power 38, Chain 27, Product 5, Quotient 6, Basic Integrals 22, limits 3, applications 3, integrals/DE 4, IM1 value/form checks 11, IM1 structured checks 8 and Prep 5. Original browser assertions expecting an unmigrated comprehensive review were updated to its completed default/legacy behavior; paired application recovery now resets both sides to the same stage. Mathematical assertions remain intact.

The final reused-field history check passes three real-page cases (Unit Circle, advanced trig limits and IM1 practice restart), with zero page errors. Before/after evidence preserves the two original reproduced failures; same-question Undo remains functional. The affected four existing browser groups were rerun after this correction: 27/27 checks and 387 paired submissions, with zero page errors (included in the 132-check total). See [history isolation](HISTORY-ISOLATION.md).

## Keypad reconciliation

The [master matrix](../mathlive-keypad-audit/MATHLIVE-KEYPAD-MATRIX.csv) contains **226 reconciled field/control records**. [Actual profile definitions](../mathlive-keypad-audit/MATHLIVE-PROFILE-SPECS.json) record 150 registered/pattern definitions, including retained legacy profiles; the ledger identifies the profiles actually selected. They are not combined into a universal keypad.

Question/part-specific profiles distinguish symbolic derivatives, literal/exact/rounded numbers, equations, coordinates, lists, intervals, formulas/recursion and antiderivatives. Fractions/roots/powers, necessary trig/inverse trig/log/exp functions, constants, variables and subscripts follow actual field contracts. C appears on antiderivative/general-solution parts. Sum/limit/subscript/arrow controls belong to Newton construction; sigma-result fields do not need setup notation. No existing approved engine requires student-entered integral setup notation. Infinity keeps the polished shared mathematical styling and appears only on applicable result/interval/construction profiles. Unit Circle comma remains absent; legitimate solution-list commas remain available.

No confirmed missing required control remains for verified reachable answer contracts. Source construction, shared bridge translation, generated answers, checker comparisons and representative real button insertion support that finding. Unrestricted identity-based alternatives, incidental parser aliases and every possible coefficient/device combination are not exhaustively certified. The original legacy editor remains available for supported legacy notation outside a structural adapter's grammar; it does not broaden mathematical acceptance.

## Known issues and scope limits

- The preexisting MathJax 4.1.3 speech-explorer `addSpeech/setCurrent` race remains reproducible on IM1 Unit 2 graphical-choice interactions. The review functional run recorded five matching errors and zero unexpected errors; a separate no-MathLive legacy run reproduced 34 identical errors. Every error is retained. Only that exact route/stack family is classified; unrelated errors fail tests. The final route sweep itself records zero page errors.
- No newly confirmed mathematical grading defect remains open after the documented targeted fixes. Original literal-number, exact/rounding, reduction and form restrictions remain; accepted-response closure is bounded by original checkers and tested forms.
- No physical-device, screen-reader, universal browser, offline/PWA-cache or exhaustive mathematical-equivalence certification is claimed. Comprehensive human testing before integration remains useful.
- Unit 6 is deliberately excluded and needs separate compatibility verification when its independent development is ready.

## Integration guidance and isolation

Main remains `26ec4f15185c37f9e8843e96a09d583b47babcdf`; no production merge/deployment, release or ZIP was performed. Claude's Unit 6 branches and source paths were not modified or merged. The separate IM1 video/content branch was fetched only for read-only path comparison and was never edited or merged.

[Integration overlap evidence](../../tools/mathlive-sitewide/artifacts/integration-overlap.json) lists **34 overlapping IM1 practice HTML paths** at observed content head `bba32f929d6630d096bc4510ceafd586ab8c4a53`. This is a path intersection, not a performed merge or proof of line conflicts. Recompute it if that branch advances.

For later authorized integration, preserve this branch's editor dependencies, data attributes, contracts, mathematical fixes and regressions while retaining the content branch's videos, notes removal and numbering changes. Reconcile overlapping HTML in a separate integration checkout; do not overwrite whole practice files with either branch's copy. Re-run Node, the route sweep and focused IM1 form/sequence/keypad tests after reconciliation. Add Unit 6 only through its separate contract/route verification. Keep `?editor=legacy` during the human-testing phase.

## Reproduction

Node: `node --test --test-concurrency=2 tools/mathlive-sitewide/*.test.mjs tools/mathlive-power-rule/*.test.mjs tools/mathlive-derivatives-pilot/chain.test.mjs tools/mathlive-batch1/*.test.mjs tools/mathlive-advanced-pilot/*.test.mjs`. The final shared run includes all 273 tests, including the discovered continuity route and startup order/isolation.

Browser tools use installed Playwright/Chromium and the existing `MATHJAX_FIXTURE_ROOT` cache containing real `mathjax` / `mathjax-newcm` files. Run `route-sweep.mjs` for production-page default/legacy/missing-runtime checks, the Batch 8 browser harnesses for family/part grading, and `final-browser-regressions.py pilots` / `contracts` for the archived legacy-suite subset. The website itself uses its existing MathJax transport and local MathLive dependency. No large fixture bundle or ZIP was added.
