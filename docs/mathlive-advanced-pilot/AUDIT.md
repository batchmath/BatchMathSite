# Advanced pilot: field and checker audit

Base: derivatives pilot `58d98cda663ff21b0a7e9f434bf0e5ca504ae03b`. Work is staged on an isolated branch; no generator or grader may change to accommodate an editor.

## Stage 1 — Basic Integrals

Actual page: `ap-calculus/unit-4-integrals/topics/basic-integrals/practice/`. The final registration in `ap-topic-generators.js` uses `BatchMathUnit4FinalFour`. It renders one dynamically created answer field, with either `unit4-basic-indef` or `unit4-basic-def` keypad mode. The actual checker is `BatchMathUnit4Answers.check`, dispatching to the unchanged antiderivative or exact-number checker in `unit4-exact-answers.js`.

| Family | Existing weight |
| --- | ---: |
| Polynomial power rule | 10 |
| Radicals / negative powers | 11 |
| Expand first | 8 |
| Divide each term | 13 |
| Divide each term with logarithm | 5 |
| Basic trig / exponential | 10 |
| Trig identity rewrite | 8 |
| Definite power / root | 14 |
| Definite trig / exponential | 9 |
| Power reduction | 8 |
| Exponential with base a | 4 |

Both exact answer fields use editable MathLive by default. The original keypads already provide the required digits, variables, fractions, powers, roots, logs, trig functions, absolute value, constants and **C**; no Basic Integrals profile changes are needed. Integral notation is a problem statement, not a valid antiderivative/value response, so no integral key is added.

The adapter preserves the typed C, equation labels, decimals and fraction arithmetic exactly. It does not add C or turn an antiderivative into a particular solution. Missing/wrongly placed C and non-exact decimal answers retain the existing checker's decisions. Malformed input remains editable and non-consuming; mathematically wrong valid input produces the existing feedback and Next action.

The new `dynamic-fields.mjs` wraps only the public keypad mount/focus contract on explicitly opted-in pages. Each new stage gets a fresh MathLive field, the same actual keypad layout, original check callback and disabled state. The shared question renderer, all generators/checkers, existing keypads and production service worker remain unchanged. The target page defers its existing renderer script so the opt-in wrapper is installed before its first synchronous question render. Legacy mode uses the same renderer and original controls.

Unsupported content is retained in the editable field and offers a standard-editor fallback. Missing runtime/fonts/styling or a refused initial import restores the actual original binding without clearing the source answer. Runtime fallback translates the current structure or retains exact LaTeX in a selectable recovery copy. Completed fields and current fields keep separate histories; native editor behavior is retained.

Stage 1 checkpoint: 13 focused tests (2,200 generated questions and 8,800 paired checker comparisons), 22 real-browser checks, zero page errors. The existing final-four-integrals QA also passes (12,000 samples per engine; 51,650 independently verified answers).

## Stage 2 — FTC and Combining Integral Rules

This requested topic is split across two existing pages: `fundamental-theorem-of-calculus-and-integral-rules/practice/` uses the `fundamental-theorem-of-calculus` generator; `integral-rules-practice/` uses `combining-integral-rules`. Both now opt into MathLive. Each has one exact answer field; neither requires integral entry.

FTC has eight families with existing weights: upper identity 25, lower identity 10, upper linear 10, upper power 15, lower power 10, upper trig 10, both algebraic 12, both transcendental 8. Its `function-expression` answer is checked by the existing Unit 4 definite/FTC checker, with domain-specific probes when supplied. The original `unit4-ftc` keypad provides the needed variable, constants, arithmetic, fractions, powers, roots, logs and trigonometric functions; no profile change is needed.

Combining Rules has six families: reverse limits 10, zero width 5, linearity 20, interval decomposition 30, combined rules 25, reversed combination 10. Its `scalar` answer uses the existing exact numerical checker and `unit4-exact` keypad. These are exact-value questions, not a new rounded-decimal grading path.

The stress tests found and corrected a translator grouping error for generated TeX such as `sec² x (−2 + tan x)`: the parenthesized factor must remain outside secant's argument. The original checker/generator were not changed. The exact generated case is retained as a browser regression, alongside explicit `2x sec(x^6)` factor/power checks. No integration, evaluation or simplification is performed by the adapter.

Stage 2 checkpoint: 3 focused test groups (8,000 generated questions, 32,000 paired checker comparisons), 22 browser checks including all 14 families, zero page errors. Both modes retain correct/incorrect/invalid/unsimplified decisions, first-key focus, single submission, Enter progression, new-question history and answer-preserving fallback.
