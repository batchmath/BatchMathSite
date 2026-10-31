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
