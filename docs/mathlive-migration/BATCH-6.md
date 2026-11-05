> Final status: this is historical checkpoint evidence. Remaining reviews and the full approved-scope inventory are completed in [Batch 8](BATCH-8.md) and [FINAL-AUDIT.md](FINAL-AUDIT.md).

# Batch 6 — Integrated Math 1 Unit 3

Seventeen typed topic routes default to MathLive; their original local or shared editors remain available through ?editor=legacy and runtime recovery. All existing generator/controller files and original practice content remain unchanged. Section reviews and comprehensive review were subsequently completed in Batch 8.

## Engine / field checklist

| Engine | Fields / profile | Reachable variants sampled | Checker pairs |
|---|---|---|---:|
| ✓ converting-point-slope-to-slope-intercept | required line form; x/y, equals, parentheses, operations, fraction/decimal; numeric fields in identify branch | convert | 2400 |
| ✓ linear-function-word-problems | line model (y or f(x)) + literal value; active-part keypad | model | 4800 |
| ✓ writing-equations-of-lines | required line form; x/y, equals, parentheses, operations, fraction/decimal; numeric fields in identify branch | point_slope_given, slope_intercept_points, point_slope_points | 2400 |
| ✓ slope-intercept-form | required line form; x/y, equals, parentheses, operations, fraction/decimal; numeric fields in identify branch | identify, write | 3558 |
| ✓ recursive-formulas-from-sequences | number: signed literal integer/decimal/fraction | write, terms, difference | 11136 |
| ✓ common-difference-recursive-formulas | literal difference + a₁ or literal initial value + aₙ=aₙ₋₁±literal rule; active-part keypad | missing_difference | 7600 |
| ✓ recursive-to-explicit-formulas | explicit formula: n, aₙ, y/f(n), equality, operations, exponent, fraction/decimal | convert | 3200 |
| ✓ finding-the-term-number | number: signed literal integer/decimal/fraction | term_number | 2400 |
| ✓ common-difference-next-terms | number: signed literal integer/decimal/fraction | next_terms | 9600 |
| ✓ arithmetic-sequence-word-problems | explicit formula + literal value; active-part keypad | model | 5600 |
| ✓ finding-a-specific-term | number: signed literal integer/decimal/fraction | specific_term | 2400 |
| ✓ explicit-formulas-arithmetic-sequences | explicit formula: n, aₙ, y/f(n), equality, operations, exponent, fraction/decimal | from_sequence, from_values | 3200 |
| ✓ identifying-arithmetic-sequences | Yes/No retained; common-difference follow-up uses literal value profile | identify-true, identify-false | 1422 |
| ✓ solving-function-equations | number: signed literal integer/decimal/fraction | solve | 2400 |
| ✓ slope-from-graphs | number: signed literal integer/decimal/fraction | graph | 2400 |
| ✓ slope-from-two-points | number: signed literal integer/decimal/fraction | two_points | 2400 |
| ✓ evaluating-functions | number: signed literal integer/decimal/fraction | quadratic, linear | 2400 |

Collinearity and Slope is choice-only and deliberately retains Yes/No. Existing graph displays remain graphical; slope answers remain mathematical fields. No videos, notes, topic headings, breadcrumbs or navigation changed.

## Contracts and keypad findings

- Local numeric-only multipart fields and arithmetic-identification follow-ups use the native bridge. Structured equation/sequence fields use the existing dynamic bridge with an optional per-field contract/profile. Switching parts selects the relevant keypad. Existing AP consumers retain their original contract/profile behavior.
- Literal values preserve fractions (including unreduced values), decimals and signs. They are never evaluated as general expressions. The existing number checker still rejects arithmetic such as 2+0. Initial-term labels and recursive identifiers are serialized explicitly; no formula is simplified or rearranged.
- Line forms retain the original isolated-left-side/order/point requirements. Negative fractional coefficients use the original checker's a/b or -(a/b) spelling instead of generic nested wrappers. This is structural serialization, not a change to equivalence or grading. The slope-one point-slope checker continues requiring the omitted unit coefficient; it is not broadened by this adapter.
- Numeric parts receive decimal/fraction controls even where generated values happen to be integers, because the checker accepts fractional/decimal equivalents. Explicit formulas receive fraction, exponent and decimal controls supported by their parser. Recursive rules receive decimal/fraction controls, aₙ/aₙ₋₁, equality and signs; they do not receive unrelated exponent/trig/infinity/list controls. Initial-term fields receive a₁/equality plus literal numeric controls.
- f(x) is limited to linear-model fields accepting that left side; other line fields receive x/y only. Explicit formula fields accept aₙ/a(n), f(n), y or unlabelled/reversed formulas. No parameter a₁ button is shown there because the accepted expression body requires substituted numbers and n.
- Display-only labels such as d= are stripped only by the evidence harness when checking a displayed numeric value. They are not automatically stripped from student input; the original numeric checker still owns acceptance.

## Validation and limits

- 6,800 deterministic questions, 11,086 typed parts, 69,316 original-checker/translated-answer comparisons. Displayed mathematical responses checked against their original field checkers. Tests include accepted alternative labels, decimal/fraction values, wrong/blank/incomplete expressions and required forms.
- 18 new Node tests pass; 49 combined contract/keypad tests pass, plus 43 existing staged/AP applications/IM1 Unit 1–2 generator/checker regressions.
- Chromium evidence: tools/mathlive-sitewide/artifacts/im1-batch6-browser-complete.json. Real cached MathJax 4.1.3, desktop and 375px, physical/structural editing, per-part pads, Enter/Next/reset, undo/redo, missing runtime and answer-preserving recovery. 17/17 routes, 42 signatures and 252 checker pairs pass with zero page errors; four injected-runtime recovery groups and missing-runtime fallback pass. A separate 375px touch/physical-keyboard run passes five routes / 66 pairs with zero page errors, including final line/model keypad distinctions and mixed-part switching.
- AP Unit 3 shared-bridge browser regression: two routes / 15 pairs, zero page errors. Unit 4/5 shared-bridge regression: natural-log/inverse-trig integrals and typed slope fields, 18 pairs, zero page errors.
- Bounded deterministic coefficients, not exhaustive arbitrary identities or physical-device/assistive-technology certification. No new mathematical source defect confirmed. Original checkers' accepted-language limits remain intentional migration constraints.

Next: push this stable checkpoint, then Batch 7 Calculus Prep; Batch 8 reviews/assignments and final route audit. Unit 6 and the independent IM1 content branch remain separate.
