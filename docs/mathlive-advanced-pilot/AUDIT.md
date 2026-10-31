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

## Stage 3 — Newton Sums and Limits

Actual page: `evaluating-definite-integrals-with-a-limit-and-summation/practice/`. Existing weights are linear construction 35, quadratic monomial 20, quadratic combination 25, nonpolynomial representation 20. The last family has eight subtypes: polynomial/exponential, logarithm/polynomial, exponential/tangent, exponential/cosine, polynomial/sine, logarithm/radical, rational/polynomial and radical/linear.

Part 1 now uses MathLive for the explicit right-endpoint sum/limit, or the summand expression already accepted by the unchanged `newton-expression` checker. Polynomial questions retain their second part, an exact scalar evaluation, also using MathLive. Nonpolynomial construction-only questions retain their existing single-part flow. The `unit4-newton` and `unit4-newton-value` profiles remain unchanged; the existing limit/sum buttons now insert editable MathLive structures instead of static text. No integral key is added, since the definite integral is the question statement rather than a permitted final answer.

The adapter canonicalizes TeX argument shells (including compact fractions) and preserves bare grouping with parentheses, then uses the existing **non-evaluating** Newton notation normalizer. Bounds, approach values, index names, powers, signs and summands are not evaluated or corrected. The original checker alone decides whether the index/bounds/limit and expression are correct. Supported legacy command notation imports structurally; expressions that cannot be imported safely stay in the usable legacy editor.

The library `templates.mjs` separately provides indefinite/definite/double integrals, editable sum/limit notation, subscripts, delta, arrows and infinity. The isolated scratchpad at `experiments/mathlive-advanced-notation/` exercises integral bounds, regions, integrands, differentials, indexed variables, limits and nesting. **It has no grading contract.** Double integrals and future Unit 6 input are not claimed as supported by unfinished graders. No Unit 6 file or keypad is changed.

The current Newton grader does not accept unexpanded indexed placeholders such as `x_k Δx`, integral answers, or arbitrary nested sums. Those remain unsupported with lossless standard-editor recovery; the adapter never expands `f(x_k)` or evaluates a sum/integral to force acceptance. Use the explicit expression in `k,n` required by the current question. Indexed roots in a Newton sum can be entered as fractional powers; the legacy Newton TeX grammar does not parse `sqrt[index]` directly.

Stage 3 checkpoint: 3 focused test groups covering 4,000 actual questions, 16,000 paired wrong-bound/body checker comparisons, legacy import round trips and all existing exact second parts. All 27 browser checks pass, including all 11 family/subtype cases, direct lower/upper sum-bound edits, limit-variable/approach edits, Part 1/Continue/Part 2 behavior, independent histories, fallback, seven isolated template types and nested integral/summation editing. Zero page errors.
