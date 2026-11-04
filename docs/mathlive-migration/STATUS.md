# MathLive sitewide migration status

Branch: `migration/mathlive-sitewide`. Verified starting remote head: `migration/mathlive-batch1-derivatives` at `adae2a2b00580f29befba88f593f4f627e2850c5`. The sitewide migration is **not complete**.

## Stable checkpoints

- `3c88dac`: separately tested legacy mathematical corrections (inverse-factor evaluator and exponential point-solution display). See [MATH-CORRECTIONS.md](MATH-CORRECTIONS.md).
- Batch 1B integration: completed and tested in this checkpoint commit. No subsequent batch has begun implementation.

## Completion inventory

Inherited: Power, Chain, Product, Quotient, Basic Integrals, FTC/Integral Rules, Newton Sums/Limits and Separable Differential Equations, including their already converted secondary fields.

Batch 1B: 18 additional Unit 2 routes, covering Trig, Exponential, Log, Implicit, Logarithmic Differentiation, Inverse Trig, Inverse Function derivatives, Nested Chain, nine topic point-derivative pages and the comprehensive point-derivative page. Exact field/profile/family details and limits: [BATCH-1B.md](BATCH-1B.md). The engine/field checklist remains separate from sitewide completion.

Difference Quotient and conceptual review retain multiple choice. All graphing, matching, drawing and other specialized controls remain unchanged. Their eventual full route audit is still pending.

## Validation

- 21/21 new mathematical/Unit 2 Node tests and 19/19 keypad/source-isolation tests pass. Deterministic mode/family counts, checker pairs and displayed-answer comparisons are in `tools/mathlive-sitewide/artifacts/unit2-node.json`.
- New Chromium harness: 18/18 routes, 144 paired submissions, zero page errors; final run also replays real MathJax from same-origin test fixtures. Default, legacy, physical entry, buttons, nested structures, Enter/Next, undo/redo, narrow layout and missing-runtime fallback.
- 69/69 original Power/Chain/Product/Quotient Node tests; 10/10 focused FTC/Separable tests pass. Power browser 38/38; Chain 27/27 (69 paired submissions); Product 5/5 and Quotient 6/6 focused interaction checks (4 and 6 pairs), all with zero page errors.
- Local pinned MathLive 0.111.1/fonts retained. No external editor CDN. Linux Chromium only; no physical-device or assistive-technology certification.
- The earlier bounded preflight for Trig/Exponential/Log is recorded in `docs/mathlive-batch1/NEXT-BATCH-PREFLIGHT.md`; its no-defect finding applies only to that sample. Later inverse-cumulative and point-display defects are recorded separately.

## Remaining work and exact resume order

1. Verify this checkpoint/remote head before editing another batch.
2. Batch 2: remaining Unit 4 U-sub/log-inverse/MVT/sigma/numerical/geometry fields and Unit 5 basic/growth/motion/rates/typed slope-field analysis. Extend the explicit dynamic-field contracts after inspecting each checker/profile; preserve drawings and selections.
3. Batch 3: Unit 3 equation, interval/list/pair, exact and rounded contracts; calculator distinctions.
4. Batch 4: Unit 1 local/shared fields and result tokens; conceptual controls retained.
5. Batches 5/6: IM1 U1/U2 then U3 with form/fraction/sequence/multipart restrictions; no video/notes/topic-content edits.
6. Batch 7: Calculus Prep, including form-sensitive factor/quotient/list contracts and Undefined tokens.
7. Batch 8: symbolic Unit 2 review, remaining reviews/assignments/mixed practice, dynamic profile verification and final reachable-route audit.

[ROUTES.csv](ROUTES.csv) lists 126 practice pages found under the three course trees, excluding Unit 6. Pending rows still need field inspection; some will correctly retain specialized controls. The 215-row keypad matrix remains the more detailed field-level starting inventory. Neither count is a completion claim.

## Isolation and later reconciliation

No merge, deployment, ZIP, main change, Unit 6 change or separate IM1 content-branch change. Only this branch is pushed. Later combine the tested migration branch through normal review, then reconcile Unit 6 and the independent IM1 content branch in separate integration work. Preserve this branch's checker regressions and the legacy fallback while resolving any mathematical-editor conflicts.
