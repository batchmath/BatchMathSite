> Final status: this is historical checkpoint evidence. Remaining reviews and the full approved-scope inventory are completed in [Batch 8](BATCH-8.md) and [FINAL-AUDIT.md](FINAL-AUDIT.md).

# Batch 1B — Unit 2 typed derivatives

Baseline `adae2a2`; separate mathematical fixes `3c88dac`. New routes: **18**. Original eight engine groups remain integrated. This document records bounded deterministic verification, not an exhaustive equivalence proof.

- 1540 representative mode/family signatures; 7700 original/translated checker pairs and 1540 displayed-answer checks. Correct, wrong (+12345), equivalent (+0), incomplete and blank inputs use the actual checker.
- Inline expression engines: 1,200 deterministic generations per available mode; point/nested engines: 220 per selector option. Family lists are in `tools/mathlive-sitewide/artifacts/unit2-node.json`; repeated signatures across modes are counted separately.
- Trig: 6 without-chain + 19 with-chain templates; exponential: 8 topic templates; logarithmic: 12; implicit: 16 including second derivatives; log differentiation: 3 simple + 49 base/exponent combinations; inverse trig: 9 topic templates; inverse-function derivatives: 5. Cumulative paths use their original filtered factor catalogs.
- Topic point engines enumerate every public stage/group and sample their subtype branches. Nested Chain covers foundation/three/four/five layers with symbolic f/g derivatives, algebraic inner forms, roots and six direct trig functions. Combinatorial coefficients/angles/trees are sampled, not exhausted.
- Chromium: all 18 routes, 144 paired submissions; physical entry, fractions/nested roots, all displayed function controls, selection/deletion, undo/redo, Enter/Next/history isolation and 375 px width. Default and legacy editors and missing-runtime fallback are checked. Shared runtime recovery is also covered by the existing pilot suites.
- Existing Power/Chain/Product/Quotient and advanced pilot regressions are recorded in STATUS.md. Additional inverse/nested/comprehensive keypad controls were tested in a separate real-MathJax run, including stacked-fraction buttons. Linux Chromium only; physical mobile devices, Windows and assistive technology are not certified.

## Engine/field checklist

| Route under Unit 2 topics | Field | Profile | Mode/family representatives |
| --- | --- | --- | ---: |
| derivatives-of-trigonometric-functions/derivative-at-a-point-practice | value | migration-derivative-value | 30 |
| derivatives-of-trigonometric-functions/practice | expression | migration-derivative-trig | 25 |
| the-product-rule/derivative-at-a-point-practice | value | migration-derivative-algebraic-value | 8 |
| inverse-trigonometric-functions/derivative-at-a-point-practice | value | migration-derivative-value | 64 |
| inverse-trigonometric-functions/practice | expression | migration-derivative-inverse | 213 |
| the-quotient-rule/derivative-at-a-point-practice | value | migration-derivative-algebraic-value | 8 |
| derivatives-of-inverse-functions/practice | value | migration-derivative-rational | 5 |
| the-chain-rule/derivative-at-a-point-practice | value | migration-derivative-value | 18 |
| the-chain-rule/nested-chain-rule-practice | nested | derivative | 407 |
| implicit-differentiation/derivative-at-a-point-practice | value | migration-derivative-value | 12 |
| implicit-differentiation/practice | expression | migration-derivative-implicit | 110 |
| exponential-functions/derivative-at-a-point-practice | value | migration-derivative-value | 14 |
| exponential-functions/practice | expression | migration-derivative-exp | 86 |
| derivatives-of-logarithmic-functions/derivative-at-a-point-practice | value | migration-derivative-value | 36 |
| derivatives-of-logarithmic-functions/practice | expression | migration-derivative-log | 139 |
| comprehensive-review/derivatives-at-a-point-practice | value | migration-derivative-comprehensive-value | 131 |
| logarithmic-differentiation/practice | expression | migration-derivative-log | 224 |
| derivatives-with-the-power-rule/derivative-at-a-point-practice | value | migration-derivative-algebraic-value | 10 |

## Keypad findings

- Advanced trig needs roots, e and ln. Exponential/cumulative pages need all six direct trig functions. Log/implicit/log-differentiation cumulative answers need both x and y.
- Inverse trig needs absolute value and all six inverse functions for cumulative product/quotient answers. General-base logarithms retain structural ln ratios; expressions are never solved or simplified by the adapter.
- Nested functions add opt-in f/g/f′/g′ serialization and function-key templates. Other derivative contracts still refuse those functions. Existing root lowering remains structural.
- Inverse-slope answers use the small rational keypad. Power/Product/Quotient point routes use an algebraic numeric profile. Other point routes retain exact trig/log/exponential controls; the comprehensive point profile additionally supplies inverse tangent because its actual answers contain atan.
- No infinity, interval, equality, list, C or summation controls are added to these fields. Nth roots remain enterable through fractional exponents and native MathLive root structures; old Unit 2 checkers have no root() identifier.
- No controls were removed solely because a sampled preferred answer omitted them. New profiles remain page opt-ins; existing nonmigrated engines keep their prior layouts. Arbitrary identity-based alternative forms are not the criterion for adding buttons.

## Deliberate exclusions

Difference Quotient and conceptual review keep their choices. The symbolic comprehensive review and assignment routing were subsequently resolved in Batch 8; the separate derivative-at-a-point review is completed here using the same numeric contract. No Unit 6 route is touched.
