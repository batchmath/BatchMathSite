> Final status: this is historical checkpoint evidence. Remaining reviews and the full approved-scope inventory are completed in [Batch 8](BATCH-8.md) and [FINAL-AUDIT.md](FINAL-AUDIT.md).

# Batch 7 — Calculus Prep

Six typed engines default to MathLive. Five selection-only engines retain specialized controls. All original generators remain unchanged. Two confirmed grading defects were corrected in separate commits before the integration checkpoint; see MATH-CORRECTIONS.md.

## Engine / field checklist

| Engine | Fields / verified keypad | Deterministic questions | Checker pairs |
|---|---|---:|---:|
| ✓ calculus-algebra | Simplified expression: x, signs, arithmetic, decimal/parentheses. Slash-free form gate preserved. Rationalization/complex-fraction choices retained. | 60 | 90 |
| ✓ special-factoring | Factored expression: x, exponent, fraction/decimal, operations and parentheses; Pascal coefficients: signed numeric list/comma, no fraction. | 270 | 2092 |
| ✓ synthetic-division | Polynomial quotient; literal numeric remainder (no fraction/evaluation); rational-root candidates: ±, fractions, decimal, comma. Factor-test Yes/No retained. | 180 | 690 |
| ✓ trig-angle-skills | Exact degree/radian scalar or coordinate pair with roots; profile follows question/part. Quadrant selections retained. | 1800 | 8010 |
| ✓ trig-equations | Radian solution list: π, fraction/decimal, signs/operations, parentheses and comma; no Undefined/degree controls. | 90 | 450 |
| ✓ unit-circle-values | Exact scalar: fraction, root, decimal, signs/operations, parentheses, Undefined. No comma, π or degree button. | 2025 | 10209 |

Retained: Function Domains choices, Function Graphs graph/feature choices, Logarithm Rules choices, Rational Function Analysis feature selectors, and Trigonometric Identities choices. Typed/choice modes inside converted engines keep their original selection and submission controls; hidden mathematical fields/keypads do not replace those choices.

## Integration / keypad verification

- The existing native bridge now accepts optional per-field contracts, a shared submit control, public editor binding/recovery callbacks and active-part profile changes. It preserves the original pre-submit answer normalization after synchronizing MathLive, including engine opt-outs. Existing native consumers retain their legacy paths.
- The exact legacy editor exposes a WeakMap of its existing public bindings; its parsing and keyboard implementation remain unchanged. The opt-in Prep module preserves raw/lock/clear/focus semantics and the P (π), U (Undefined) and Escape shortcuts. Runtime recovery restores the private legacy binding through its public setter.
- Unit Circle has no comma; Trigonometric Equations and coordinate/list fields retain comma. Undefined is available for Unit Circle's undefined families. Degree controls appear only on degree-answer profiles; π appears on radian-answer profiles. Algebra/quotient/number/list/factoring controls follow their actual checker contracts.
- Factoring uses a structural serializer that retains actual groups/operations and inserts only precedence-required fraction grouping. It does not invent two factor groups around a fraction or simplify expressions. Original form checks still own acceptance. Literal list items and remainders are not evaluated by the adapter. Coordinate pairs are serialized with their supported outer delimiters to avoid confusing a fraction's operand parentheses with pair delimiters.
- Rational-root ± notation, positive-only candidate lists, Pascal comma/space lists, exact scalar synonyms and wrapped/unwrapped coordinates are checked against original source behavior. Missing runtime and injected runtime failures retain the standard editor and entered answers.

## Mathematical corrections (separate commits)

- 1c4a17a1c799caea45fa102a06e92e1ce9d1bb02: Prep evaluator's unary -x^n syntax rejected a generated Synthetic Division quotient. Explicit omitted coefficient preserves exponent precedence and correct credit.
- 96cdfd422c283a4cda9ef79e5d072c573e4fdb51: numeric-only parentheses no longer count toward the required polynomial factor groups. Correct stored forms and legitimate numeric/fractional coefficients remain accepted.

Neither correction rewrites the global derivative parser or expression-equivalence architecture. The factoring heuristic is not claimed to be a comprehensive factorization prover.

## Validation / limits

- Original source/checker Node evidence: tools/mathlive-sitewide/artifacts/prep-node.json: 4,425 questions, 4,140 typed parts, 21,541 checker pairs. All selector plans sampled deterministically (15 seeds each), including both difficulties, polynomial degrees, angle sets/formats, six trig functions and mixed modes. Eleven engine/contract/mathematical tests pass; 19 combined contract/source-guard tests pass.
- Desktop Chromium: all six routes / 285 checker pairs, six answer-preserving recovery checks and missing runtime pass with zero page errors. Final narrow touch run and expanded factoring negatives: prep-browser-checkpoint.json: all six routes / 321 pairs, six recovery checks and missing-runtime fallback, zero page errors. Live checks include physical typing, buttons, degree/Undefined/±/fraction controls, shortcuts, undo/redo, structural deletion, correct/wrong/blank/incomplete answers, typed/choice transitions and original automatic progression. Real cached MathJax 4.1.3 is used.
- Existing native consumers: final IM1 Units 1/2 regressions pass 53 pairs and Unit 3 passes 24 pairs; additional recovery runs pass. AP Unit 1 advanced trig native regression passes six pairs. Evidence retained as *batch7* JSON. Matching preexisting IM1 graphing-interval MathJax explorer errors are counted separately; no unexpected page errors accepted.
- Bounded deterministic coefficients and existing checker behavior, not all arbitrary identities, physical devices or assistive-technology certification. Standard fallback remains available; legacy scientific numeric literals that cannot be safely imported remain in their original editor.

Next: push this stable checkpoint; Batch 8 converts remaining reviews/assignments, then audits every reachable course practice/editor route. Unit 6, production and independent content work stay separate.
