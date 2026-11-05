# MathLive migration status

Branch: `migration/mathlive-sitewide`.

**Complete and tested for the approved scope:** all eligible mathematical fields in AP Calculus Units 1–5, IM1 Units 1–3 and Calculus Prep default to editable MathLive. The branch is ready for later integration; it has not been merged or deployed. Last tested implementation checkpoint: `cfefbe5ad6e18f5086cc221505e065a41e24b0db` (subsequent changes are audit documentation/tools and browser-harness corrections).

The original sixteen pending URLs are resolved: fourteen mathematical routes and two navigation/redirect URLs. A linked Continuity Parameter engine omitted from the earlier ledger was also converted. The actual inventory contains **138 routes: 118 mathematical, 15 specialized and 5 navigation**. Unit 6 is excluded.

See [FINAL-AUDIT.md](FINAL-AUDIT.md) for evidence, limits and integration guidance; [ROUTES.csv](ROUTES.csv) for every route/field contract and [BATCH-8.md](BATCH-8.md) for the review checklist. The original successful pilots and Batches 1B–7 remain the foundation.

## Final verification

- 273/273 shared Node tests pass after the final history correction, including continuity and startup isolation.
- 445,457 recorded sitewide batch checker comparisons; 130,834 in Batch 8 plus the additional continuity route. Bounded samples, not exhaustive equivalence.
- All 138 routes: 374/374 current default/legacy/missing-runtime/specialized checks pass in a fresh full run after the documented startup and history corrections.
- Existing focused Chromium suites: 132/132 checks, 543 explicitly counted paired submissions plus Power/Basic checks, zero page errors.
- 226 keypad records reconciled; no confirmed missing required control in verified reachable contracts.
- Known limitation: preexisting IM1 MathJax speech-explorer race; Unit 6 remains separate. No eligible unmigrated mathematical field is known.

## Verified checkpoints

- `19ab475`: separate duplicated review qa8 correction.
- `2764b4a`: separate review h identifier/scope correction.
- `7aaca84`: Unit 1/2 AP reviews; `a27e07b`: empty-question undo isolation.
- `ab62a1a`: separate existing Unit 4 review dependency repair.
- `0b2f28f`: six AP Unit 3–5 reviews and optional typed drawing fields.
- `a60cc84`: separate exact-list fraction-normalization boundary correction.
- `4234174`: separate existing IM1 review interval dependency repair.
- `af7ae3c`: structural braced-base list translation correction.
- `2d4694e`: IM1 Unit 2 review and Unit 1 navigation verification.
- `03e5495`: all five IM1 Unit 3 reviews.
- `671f5ad`: additional linked Continuity Parameter engine.
- `12bf9b3`: six AP reviews initialize their first question after editor installation.
- `cfefbe5`: reused native-field Undo/shortcut history isolated between generated questions; three real-page history cases and the affected shared regressions pass.

## Scope protection

Only this migration branch is pushed. No merge, deployment, release or ZIP. Main and Claude's Unit 6 remain untouched. The independent IM1 content/video branch has not been edited or merged; 34 overlapping practice paths are listed in the final audit's integration evidence. Keep both editor changes and content changes when later reconciling those paths.
