# MathLive sitewide migration status

Branch: `migration/mathlive-sitewide`. Verified starting remote head: `migration/mathlive-batch1-derivatives` at `adae2a2b00580f29befba88f593f4f627e2850c5`. The sitewide migration is **not complete**.

## Stable checkpoints

- `3c88dac`: separately tested legacy mathematical corrections (inverse-factor evaluator and exponential point-solution display). See [MATH-CORRECTIONS.md](MATH-CORRECTIONS.md).
- `54a428f`: Batch 1B integration completed and tested. Batch 2 follows below.

- Batch 2: 1c95ed904133521320ede2b03ca27bda8a1f7a51, completed and tested.
- Batch 3: ca2fe0e4628f688f1023fd054473d03e15e49e6e; tested Unit 3 integration.
- 0f4f54e93911253becef67f9cb77a431e64dce0a: separate Unit 1 unary-minus/exponent precedence correction; see MATH-CORRECTIONS.md.
- 517ffee72bec8b9c540bcc3549b00c27a880cfbf: Batch 4 Unit 1 topic integration, tested and pushed.
- Batch 5: 4fe3861d41302ff82d5cba90c5928b6a7c020720, tested and pushed IM1 Units 1/2 topic integration.
- Batch 6: efd452620760f7f900b57f97fd703c71ca027f4e, tested and pushed IM1 Unit 3 topic integration.
- 1c4a17a1c799caea45fa102a06e92e1ce9d1bb02 and 96cdfd422c283a4cda9ef79e5d072c573e4fdb51: separately tested/pushed Prep mathematical corrections.
- Batch 7: c2d6b9f9bc309e96787d390244e17c663b568d90, tested and pushed.
- 19ab475: separate duplicated review qa8 denominator correction.
- 2764b4a3feffa89358fffc32db4f2034b2fcebc7: separate review h identifier/sample-scope correction.
- Batch 8 checkpoint A1: Unit 1 and Unit 2 comprehensive typed reviews, 350 Chromium pairs / zero errors and 14,080 checker comparisons, tested in this checkpoint commit.

## Completion inventory

Inherited: Power, Chain, Product, Quotient, Basic Integrals, FTC/Integral Rules, Newton Sums/Limits and Separable Differential Equations, including their already converted secondary fields.

Batch 1B: 18 additional Unit 2 routes, covering Trig, Exponential, Log, Implicit, Logarithmic Differentiation, Inverse Trig, Inverse Function derivatives, Nested Chain, nine topic point-derivative pages and the comprehensive point-derivative page. Exact field/profile/family details and limits: [BATCH-1B.md](BATCH-1B.md). The engine/field checklist remains separate from sitewide completion.

Batch 2: 15 further routes cover all remaining Unit 4/5 topic typed fields, including calculator/non-calculator pages. See [BATCH-2.md](BATCH-2.md). Navigation pages, qualitative selections, graph drawing and slope-field manipulation stay specialized.

Batch 3: 19 Unit 3 topic routes, including calculator/non-calculator, equations, lists, pairs, intervals, exact/rounded and multipart fields. See [BATCH-3.md](BATCH-3.md).

Batch 4: seven Unit 1 typed topic routes complete; three choice-only routes retained. See [BATCH-4.md](BATCH-4.md). Unit 1 comprehensive review remains pending.

Batch 5: 12 IM1 U1/U2 topic mathematical routes complete; classification, distributive/inequality and coordinate/graph choices retained. See [BATCH-5.md](BATCH-5.md). Reviews remain pending.

Batch 6: 17 IM1 Unit 3 typed topic routes complete, with dynamic number/initial/recursive/formula/line keypads and preserved Yes/No/graph displays. See [BATCH-6.md](BATCH-6.md). Five section/comprehensive reviews remain Batch 8.

Batch 7: all six typed Calculus Prep engines complete; five selection-only engines retained. See [BATCH-7.md](BATCH-7.md).

Difference Quotient and conceptual review retain multiple choice. All graphing, matching, drawing and other specialized controls remain unchanged. Their eventual full route audit is still pending.

## Validation

- 21/21 new mathematical/Unit 2 Node tests and 19/19 keypad/source-isolation tests pass. Deterministic mode/family counts, checker pairs and displayed-answer comparisons are in `tools/mathlive-sitewide/artifacts/unit2-node.json`.
- New Chromium harness: 18/18 routes, 144 paired submissions plus 24 focused control pairs, zero page errors; final run also replays real MathJax from same-origin test fixtures. Default, legacy, physical entry, buttons, nested structures, Enter/Next, undo/redo, narrow layout and missing-runtime fallback.
- 69/69 original Power/Chain/Product/Quotient Node tests; 10/10 focused FTC/Separable tests pass. Power browser 38/38; Chain 27/27 (69 paired submissions); Product 5/5 and Quotient 6/6 focused interaction checks (4 and 6 pairs), all with zero page errors.
- Local pinned MathLive 0.111.1/fonts retained. No external editor CDN. Linux Chromium only; no physical-device or assistive-technology certification.
- The earlier bounded preflight for Trig/Exponential/Log is recorded in `docs/mathlive-batch1/NEXT-BATCH-PREFLIGHT.md`; its no-defect finding applies only to that sample. Later inverse-cumulative and point-display defects are recorded separately.

- Batch 2: 17/17 Node tests; 4,860 questions / 5,506 parts / 23,028 checker pairs. 15/15 browser routes pass across full/targeted runs, including controls, Enter and narrow fields. Existing Basic Integrals browser 22/22 and derivative keypad guards 21/21 pass.

- Batch 3: 22,800 deterministic questions / 110,260 checker pairs; all 19 Chromium routes pass, plus controls, Enter, progression, precision and recovery tests. Unit 3 generators/graders unchanged.

- Batch 4: 4,360 questions/sets; 24,180 UI checker pairs plus 220 location comparisons; seven Chromium routes / 421 pairs pass. Profile/focus/recovery checks and original Power/Quotient/Basic browser regressions pass. Separate precedence fix recorded above.

- Batch 5: 9,300 generated questions / 58,378 checker pairs; 39 combined Node tests pass. 12/12 Chromium routes / 370 pairs pass with zero unexpected page errors. Two matching preexisting MathJax speech-explorer errors are isolated by a legacy-only reproduction; see BATCH-5.md. Recovery, touch and Unit 1 native regressions pass.

- Batch 6: 6,800 deterministic questions / 11,086 typed parts / 69,316 checker pairs. 17/17 Chromium routes / 252 pairs, four recovery groups, zero page errors. Shared-bridge AP regressions: four routes / 33 pairs. See BATCH-6.md. No generator/grader changes.

- Batch 7: 4,425 questions / 21,541 checker pairs; final six-route touch Chromium / 321 pairs plus recovery and missing-runtime checks pass, zero page errors. Nineteen combined Node/guard tests pass. Separately committed evaluator/form fixes; see BATCH-7.md.

Batch 8 checkpoint A1: Unit 1 and Unit 2 comprehensive reviews converted, including parameters/discontinuity locations and difference-quotient h. Old Unit 5 assignment URL is explicitly verified as a redirect. See BATCH-8.md. The other review routes and final sitewide audit remain pending.

## Remaining work and exact resume order

1. Verify this checkpoint/remote head before editing another batch.
2. Batch 2 is complete for topic pages; comprehensive reviews/assignments remain Batch 8 work.
3. Batch 3 topic fields complete; two comprehensive-review variants remain Batch 8.
4. Batch 4 topic fields complete; comprehensive review remains Batch 8.
5. Batches 5 and 6 complete for topic routes; reviews remain Batch 8. No video/notes/topic-content edits.
6. Batch 7 complete; verify its remote checkpoint before Batch 8.
7. Batch 8: symbolic Unit 2 review, remaining reviews/assignments/mixed practice, dynamic profile verification and final reachable-route audit.

[ROUTES.csv](ROUTES.csv) lists 137 routes: the original 126 practice pages plus 11 top-level Calculus Prep engine pages, excluding Unit 6. Pending rows still need field inspection; some will correctly retain specialized controls. The keypad matrix (215 original records plus the verified Prep coordinate-pair record) remains the more detailed field-level inventory. Neither count is a completion claim.

## Isolation and later reconciliation

No merge, deployment, ZIP, main change, Unit 6 change or separate IM1 content-branch change. Only this branch is pushed. Later combine the tested migration branch through normal review, then reconcile Unit 6 and the independent IM1 content branch in separate integration work. Preserve this branch's checker regressions and the legacy fallback while resolving any mathematical-editor conflicts.

Batch 8 A1 follow-up: explicit question-reset history clearing verified on both comprehensive reviews, including empty-to-empty resets. See BATCH-8.md and history regression artifacts. Remaining Batch 8 work is still in progress.

Batch 8 A2: all six remaining actual AP Unit 3–5 review engines completed. 9,060 questions / 10,085 typed parts / 42,258 Node checker comparisons; six Chromium routes / 632 paired submissions / zero page errors. Optional typed slope/curve fields also converted on the slope-field topic and both reviews: three routes / 12 correct/incorrect comparisons, narrow layout, Enter, undo/redo, recovery and missing runtime pass with zero page errors. The seven listed IM1 URLs and final inventory/audit remain next. See BATCH-8.md.

Final regression correction: the original fraction-sign normalizer crossed an exact-list separator on a reachable MVT cubic answer. A two-line boundary guard, separate regression tests and four paired Chromium submissions pass. See MATH-CORRECTIONS.md. IM1 review implementation continues from the existing AP checkpoint.
