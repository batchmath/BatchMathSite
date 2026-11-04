# Batch 5 — Integrated Math 1 Units 1 and 2

Twelve mathematical topic routes now default to MathLive. Original inputs, local editors, keypads and ?editor=legacy remain available. Main, Unit 6 and the separate IM1 content branch are not modified.

## Engine / field checklist

| Route | Answer/keypad contract | Deterministic questions | Checker pairs |
|---|---|---:|---:|
| ✓ unit1 / adding-and-subtracting-negative-numbers | ml-im1-integer | 200 | 1400 |
| ✓ unit1 / decimals | ml-im1-decimal | 800 | 5600 |
| ✓ unit1 / fractions | ml-im1-fraction | 1200 | 10800 |
| ✓ unit1 / multiplication | ml-im1-digits | 1100 | 7700 |
| ✓ unit1 / multiplying-and-dividing-negative-numbers | ml-im1-integer | 600 | 4200 |
| ✓ unit1 / order-of-operations | ml-im1-integer | 200 | 1400 |
| ✓ unit1 / percents | ml-im1-decimal | 1200 | 8400 |
| ✓ unit1 / reducing-fractions | ml-im1-fraction | 200 | 1800 |
| ✓ unit1 / square-roots-and-exponents | ml-im1-integer | 200 | 1400 |
| ✓ unit2 / equivalent-expressions-combining-like-terms | dynamic polynomial variables/powers | 1200 | 6138 |
| ✓ unit2 / graphing-inequalities-interval-notation | ml-im1-interval | 1200 | 2340 |
| ✓ unit2 / solving-linear-equations | ml-im1-equation-value | 1200 | 7200 |

Unit 1 classification remains checkboxes. Unit 2 Distributive Property, Solving Linear Inequalities (including creation/solve parts), and Coordinate System/Nine Key Features remain choices/graphical context. The converted combining-like-terms route retains its conceptual like-term choices. Graphing/Intervals retains six conceptual/graph/union choice families; its solve-then-interval fields are mathematical.

## Verified families and controls

- Unit 1 modes: integer addition/subtraction sign cases; decimal add/subtract/multiply/divide; fraction common/unlike denominators, multiplication/division, powers/roots and fractions of numbers; reducing; all 12 order-of-operations generators; all five percent categories and successive-change subtypes; square roots/powers.
- Multiplication includes all ten question-count settings and all five weighted tiers, including rare zero/one facts. Signed integer fields share a small number keypad. Positive multiplication omits minus. Decimal fields add decimal entry; fraction fields add stacked fraction entry.
- Unit 2 polynomial fields cover six typed families and six possible variable pairs, narrowed to the actual question's variables. Controls: integer coefficients, signs, multiplication, positive powers and cursor utilities. No roots, fractions, equations or unrelated functions are introduced into this simplified-polynomial contract.
- Equation-solution fields cover all 11 families, including identity/contradiction and fractional-coefficient/expression forms. Their keypad provides signed literal numbers, decimals/fractions, No Solution and Infinite Solutions. The question asks for a value of x, so a full x/y equation keypad is unnecessary.
- Typed intervals cover five solve templates and use integer endpoints, parentheses/brackets, comma and both signed infinities. Decimal/fraction/union controls are excluded: the current checker accepts integer endpoints, and union questions are choices.
- Existing infinity styling is inherited. Keypad variable buttons, fraction/exponent structures, sign toggling and decimal behavior are exercised in Chromium.

## Mathematical preservation

All IM1 generators, checkers, renderer scripts and inline controllers are unchanged. A byte-comparison test removes only the added editor-loading tags/root attribute before comparing entire practice HTML, protecting videos, notes, headings, breadcrumbs and navigation.

Literal numbers and fractions share a structural transport without evaluation. Numerators and denominators remain unreduced; Unit 1's original reduced-fraction requirement still rejects 2/4 for 1/2. Equation-solution fields independently accept equivalent literal fractions as before. Polynomial products, duplicate terms and zero terms are not combined: original unsimplified-form feedback remains. Interval bracket/endpoint policies remain unchanged.

Legacy parentheses are preserved during import so an invalid literal form cannot become accepted through formatting. Special equation-result aliases, including empty-set notation, map to the original accepted words. Decimal spelling and optional currency/grouping marks are left for the owning checker. A pre-entered JavaScript scientific literal such as 1e3 safely retains the original editor rather than being misinterpreted as multiplication by e; no expression is evaluated to manufacture a literal result.

The reusable native-input bridge discovers completed legacy controls before hiding them, preserves accessible labels/help, supports question-specific contracts/keypads and waits for initially hidden practice cards. It retains original timed progression. On failure it restores raw input and dispatches the original input notification so the legacy fraction/preview display is current. Unit 1 sign-toggle, decimal-key and touch-lock behavior are retained.

## Evidence

- 18 new Node tests: 9,300 generated questions, 58,378 original/translated comparisons, correct/wrong/blank/incomplete answers, accepted alternatives and form-sensitive rejections. Independent linear-equation checks verify the generated coefficients against the solution. Exact families, selector modes, question counts and interval templates are retained in artifacts/im1-batch5-node.json.
- 21 existing derivative/keypad source guards also pass: 39 tests in the combined checkpoint run.
- Final real Chromium run: 12/12 routes, 370 paired submissions, 70 representative typed cases and seven retained choice cases. Real pinned MathLive and same-origin real MathJax, actual on-screen/physical entry, undo/redo, Enter, timer-driven progression, dynamic variable profiles and 375px layouts.
- Five runtime-recovery groups pass (decimal, fraction, polynomial, interval, equation result), plus cached-answer recovery when the MathLive value getter fails, pending fractional input on missing runtime, delayed successful import, and a 375px touch context with locked/unlocked keypad checks.
- Focused Unit 1 native-editor regressions pass across the advanced, classification-location and regular-course paths after the shared bridge changes. The course harness now targets its actual numeric-answer ID.

## Confirmed existing MathJax limitation

The interval-choice engine has an optional MathJax 4.1.3 speech-explorer race: rapid successive clicks/reloads can raise addSpeech / setCurrent errors while grading remains correct. This reproduces with all MathLive loading tags removed and the original legacy controls: the 30-choice baseline records four such errors. The final migration run records two matching errors and zero unexpected page errors.

A trial resource cleanup did not eliminate the error and was reverted. Production MathJax, its accessibility features, the renderer and grading are unchanged. The browser harness reports the full stacks and distinguishes this specifically reproduced baseline failure; unrelated page errors still fail the run. See im1-batch5-browser-mathjax-baseline.json and the final browser report. This remains a separate MathJax follow-up, not a mathematical grading correction.

## Remaining work

No mathematical source correction was needed in Batch 5. Sampling covers the declared families and modes, not every coefficient or arbitrary equivalent identity. Physical-device/assistive-technology certification is not claimed.

IM1 Unit 1 hub/review and Unit 2 comprehensive review remain Batch 8. Next: Batch 6 IM1 Unit 3, with sequence subscripts, recursive/explicit formulas, equations and multipart active-field behavior. Then Calculus Prep and comprehensive/mixed-route coverage.
