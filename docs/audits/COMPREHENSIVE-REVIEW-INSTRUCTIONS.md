# Comprehensive, section and mixed-review instructions

Checkpoint C continues from keypad checkpoint `040ad3040b15f74671f52a95dbd9346e6a9e1a12`.
Unit 6 is excluded. The only student-facing change is the Mixed Derivatives
`mk()` prompt policy: retain its authored task instead of replacing it with a
neutral derivative prompt. No questions, distributions, answer expressions,
solutions, variable lists, parsers or graders change. Standalone topic wording
that was deliberately simplified remains unchanged.

## Coverage and findings

The deterministic audit generated **144,100 questions across 99 engines/route contexts** and retained **5,352 family/selector/contract records**. These are audit records, not counts of independent mathematical families or all possible numerical parameter values. All public selector combinations are enumerated, with seeded family samples and structural comparisons of the shared review wrappers. The [complete ledger](COMPREHENSIVE-REVIEW-INSTRUCTIONS.json) includes every recorded family, selector, original/intended instruction, review before/after, answer object, contract, decision and evidence.

Mixed Derivatives contributes 26,400 paired generations over all 22 selectors and 610 family/instruction records. **93 selector/family/instruction records (47 distinct family/instruction combinations)** change their displayed wording. Several notation/inverse-function versions were already mathematically equivalent; preserving those authored prompts avoids another special-case rewriting policy. The material corrections restore:

- Four difference-quotient families (linear, quadratic, radical and reciprocal): **Simplify the difference quotient.** Nonlinear answers retain `h`; substituting `h=0` is rejected where it changes the required quotient.
- First through fourth derivative orders in polynomial, negative-power, rational-power, irrational-power and mixed Power Rule families, including the original `x>0` assumption where supplied.
- The authored implicit-differentiation task, including the distinct second-derivative target.
- Required complete simplification for the three basic Product Rule families. The original expanded-polynomial checker still rejects an equivalent unexpanded form.
- Domain assumptions in logarithmic differentiation (`x>0` or `sin x>0`).

There is **no genuine derivative-by-limit family in the reachable symbolic review catalog**, nor in its derivative-at-a-point catalog. Its `difference()` questions simplify a quotient; none computes a derivative by taking its limit. That is a review-coverage gap if the curriculum intends to assess first principles here. No new question is added without a separately justified curriculum/answer contract. The standalone Difference Quotient engine is unchanged.

A requested method remains part of the directions even where the original grader checks only the final expression. This correction does not claim that such a grader verifies a student's written method.

## Instruction decisions outside the changed helper

| Course/unit and review | Task/form/method checked | Decision and preservation evidence |
|---|---|---|
| AP 1 comprehensive and mixed topics | Limit target, side, tables/graphs, continuity parameters, discontinuity locations and classifications, IVT hypotheses | Existing generators retain their complete question. Discontinuity review explicitly asks to find and classify every discontinuity. Evaluate is sufficient beside an explicit limit target. |
| AP 2 conceptual and at-point reviews; standalone comparison engines | Conceptual choices, indicated x-value/point, inverse-function data and derivative target | Actual generated/rendered targets remain explicit. Standalone simplified directions are preserved; they are not overwritten with review-specific imperatives. |
| AP 3 assignment/calculator reviews and topic mixed modes | Tangent versus normal equations, slope and point, approximation, theorem hypotheses, intervals, motion, optimization and related rates | Reviews resolve the same registered topic functions. Complete question and multipart prompts remain present; line/interval input hints and answer contracts remain distinct. |
| AP 4 assignment/comprehensive and topic mixed modes | Exact/decimal values, constant of integration, integration variable, setup versus evaluation, geometry, finite-sum limit, area/signed integral, approximation | Original main and part directions are retained. The only three `hidePrompt` groups have empty redundant first-part prompts: Newton setup, geometry and integral rules. Their actual tasks are already visible in the main question. No restoration is needed. |
| AP 5 calculator/non-calculator reviews and six topic engines | Calculator eligibility, precision/money, general/particular solutions, initial conditions, validity intervals, motion distinctions, slope-field drawing/typed alternatives, complete lists | Capturing the standalone object before the review wrapper proves all parts remain byte-equivalent. The wrapper adds only its topic/difficulty tag and review metadata. Calculator-active flags and topic eligibility remain unchanged. |
| IM1 1 topic mixed review sets and classification | Literal numbers/decimals, reduced fractions, arithmetic and all applicable classifications | The same controller renders topic and mixed modes with the existing answer-format directions. No copied prompt-stripping wrapper exists. |
| IM1 2 comprehensive | Polynomial simplification, equation solutions/special cases, interval endpoints, multipart choices | The review returns the complete standalone generator object; primary and secondary task text and answer contracts are identical. |
| IM1 3 four section reviews and comprehensive | Explicit versus recursive formula, initial term, differences/terms, function/line equations, point-slope versus slope-intercept | Each review returns its original lesson object. All formula/line field labels, conventions and multipart instructions are retained. |
| Calculus Prep eleven mixed engines | Exact values, coordinate pairs, complete trig solution sets, factored form, coefficients, quotient/remainder, domains/logs/identities, graph and rational-function features | Every public generator-selector combination was generated; mixed and focused modes share the same maker and renderer. No review-specific loss was demonstrated. Rational-function tasks use the visible feature labels with the Analyze prompt. |

Generic Evaluate, Find the derivative or Solve remains appropriate when the
notation, indicated point, named quantity, field labels and existing page
instructions completely specify the result. Those questions permit students to
choose a method unless the original task explicitly names one. The audit adds
no hints to such questions.

AP 3 semester-review navigation/PDF resources, the IM1 1 review landing page and
the old AP 5 assignment-review redirect contain no additional question generator;
their reachable destinations are accounted for below. The source-preservation
audit protects those resources and links.

## Changed instruction records

The original/intended column below is the authored **review** task supplied to
`mk()`. Some public standalone engines intentionally use simpler directions;
this table does not claim that their current pages display the restored wording.
All rows change only prompt rendering; mathematical generators/checkers remain
unchanged. Each row is covered by paired generator/answer checks and real
MathLive/legacy browser rendering, correct/incorrect grading and selector transitions.

| Course/unit | Review engine | Family / selector | Original/intended instruction | Review before | Final instruction | Problem | Mathematical generator/checker change | Evidence |
|---|---|---|---|---|---|---|---|---|
|AP 2|Mixed Derivatives|difference:dqmix-r / mixed|Simplify the difference quotient.|Find the derivative.|Simplify the difference quotient.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record dqmix-r-4|
|AP 2|Mixed Derivatives|basic:pr-poly-3 / mixed|Find the third derivative, \(f^{(3)}(x)\).|Find the derivative.|Find the third derivative, \(f^{(3)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-poly-3-5,1-2,-2-9|
|AP 2|Mixed Derivatives|implicit:imp-hard2 / mixed|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-hard2-4|
|AP 2|Mixed Derivatives|logdiff:ld-simple-xkx / mixed|Find the derivative. Assume \(x>0\).|Find the derivative.|Find the derivative. Assume \(x>0\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record ld-simple-xkx-2|
|AP 2|Mixed Derivatives|implicit:imp-mixed / mixed|Find dy/dx by implicit differentiation.|Find \(\frac{dy}{dx}\).|Find dy/dx by implicit differentiation.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-mixed-3-3-9|
|AP 2|Mixed Derivatives|basic:pr-neg-1 / mixed|Find \(f'(x)\).|Find the derivative.|Find \(f'(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-neg-1--5_1_-4,-3_2_-2|
|AP 2|Mixed Derivatives|difference:dqmix-l / mixed|Simplify the difference quotient.|Find the derivative.|Simplify the difference quotient.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record dqmix-l--2-0|
|AP 2|Mixed Derivatives|logdiff:ld-simple-xsine / mixed|Find the derivative. Assume \(x>0\).|Find the derivative.|Find the derivative. Assume \(x>0\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record ld-simple-xsine-2|
|AP 2|Mixed Derivatives|implicit:imp-sin-sum / mixed|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-sin-sum|
|AP 2|Mixed Derivatives|inverse:iv2 / mixed|Let g be the inverse of f. Find the indicated derivative.|The functions \(f\) and \(g\) are inverses. Find the indicated derivative.|Let g be the inverse of f. Find the indicated derivative.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record iv2-2--1--1|
|AP 2|Mixed Derivatives|basic:pr-poly-1 / mixed|Find \(f'(x)\).|Find the derivative.|Find \(f'(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-poly-1-7,5,1--4,1,6-8|
|AP 2|Mixed Derivatives|basic:pr-poly-4 / mixed|Find the fourth derivative, \(f^{(4)}(x)\).|Find the derivative.|Find the fourth derivative, \(f^{(4)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-poly-4-6,5,2-1,2,-2-|
|AP 2|Mixed Derivatives|implicit:imp-second-circle / mixed|Find the second derivative d²y/dx².|Find the second derivative.|Find the second derivative d²y/dx².|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-second-circle-4|
|AP 2|Mixed Derivatives|difference:dqmix-q / mixed|Simplify the difference quotient.|Find the derivative.|Simplify the difference quotient.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record dqmix-q--3-5--1|
|AP 2|Mixed Derivatives|inverse:iv-log / mixed|Find the indicated derivative.|The functions \(f\) and \(g\) are inverses. Find the indicated derivative.|Find the indicated derivative.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record iv-log-1|
|AP 2|Mixed Derivatives|implicit:imp-sin-xy / mixed|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-sin-xy|
|AP 2|Mixed Derivatives|implicit:imp-higher / mixed|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-higher-3-3-7|
|AP 2|Mixed Derivatives|implicit:imp-hard3 / mixed|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-hard3-1-1-1|
|AP 2|Mixed Derivatives|inverse:iv-exp / mixed|Find the indicated derivative.|The functions \(f\) and \(g\) are inverses. Find the indicated derivative.|Find the indicated derivative.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record iv-exp-3-3|
|AP 2|Mixed Derivatives|difference:dqmix-rec / mixed|Simplify the difference quotient.|Find the derivative.|Simplify the difference quotient.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record dqmix-rec--1-8|
|AP 2|Mixed Derivatives|logdiff:ld-simple-sin / mixed|Find the derivative. Assume \(\sin x>0\).|Find the derivative.|Find the derivative. Assume \(\sin x>0\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record ld-simple-sin-cos|
|AP 2|Mixed Derivatives|implicit:imp-sin-quadratic / mixed|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-sin-quadratic-4|
|AP 2|Mixed Derivatives|product:pb3 / mixed|Find the derivative and simplify completely.|Find the derivative.|Find the derivative and simplify completely.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pb3--4--4-4-3-3-3|
|AP 2|Mixed Derivatives|basic:pr-irr-1 / mixed|Find \(f'(x)\). Assume \(x>0\).|Find the derivative.|Find \(f'(x)\). Assume \(x>0\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-irr-1-pi--4-1-2|
|AP 2|Mixed Derivatives|product:pb1 / mixed|Find the derivative and simplify completely.|Find the derivative.|Find the derivative and simplify completely.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pb1--3--6-3-4-1-1|
|AP 2|Mixed Derivatives|basic:pr-frac-1 / mixed|Find \(f'(x)\).|Find the derivative.|Find \(f'(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-frac-1-5_1_5_4,2_2_4_3|
|AP 2|Mixed Derivatives|basic:pr-mixed-1 / mixed|Find \(f'(x)\).|Find the derivative.|Find \(f'(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-mixed-1--4_1_5_1,3_1_-3_1,1_1_-4_3|
|AP 2|Mixed Derivatives|implicit:imp-cubic-curve / mixed|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-cubic-curve|
|AP 2|Mixed Derivatives|inverse:iv1 / mixed|Let g be the inverse of f. Find the indicated derivative.|The functions \(f\) and \(g\) are inverses. Find the indicated derivative.|Let g be the inverse of f. Find the indicated derivative.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record iv1-2-2-0|
|AP 2|Mixed Derivatives|implicit:imp-xy / mixed|Find dy/dx by implicit differentiation.|Find \(\frac{dy}{dx}\).|Find dy/dx by implicit differentiation.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-xy-10|
|AP 2|Mixed Derivatives|implicit:imp-exp-xy / mixed|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-exp-xy|
|AP 2|Mixed Derivatives|basic:pr-mixed-2 / mixed|Find the second derivative, \(f^{(2)}(x)\).|Find the second derivative.|Find the second derivative, \(f^{(2)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-mixed-2-1_1_3_1,-1_2_-1_1,3_1_-1_2|
|AP 2|Mixed Derivatives|implicit:imp-sin-y / mixed|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-sin-y-3|
|AP 2|Mixed Derivatives|implicit:imp-circle / mixed|Find dy/dx by implicit differentiation.|Find \(\frac{dy}{dx}\).|Find dy/dx by implicit differentiation.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-circle-5|
|AP 2|Mixed Derivatives|basic:pr-frac-2 / mixed|Find the second derivative, \(f^{(2)}(x)\).|Find the second derivative.|Find the second derivative, \(f^{(2)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-frac-2--2_1_1_2,3_1_2_3|
|AP 2|Mixed Derivatives|product:pb2 / mixed|Find the derivative and simplify completely.|Find the derivative.|Find the derivative and simplify completely.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pb2-2-4-4-5-2-1|
|AP 2|Mixed Derivatives|implicit:imp-sin-y-squared / mixed|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-sin-y-squared|
|AP 2|Mixed Derivatives|basic:pr-frac-4 / mixed|Find the fourth derivative, \(f^{(4)}(x)\).|Find the derivative.|Find the fourth derivative, \(f^{(4)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-frac-4--1_2_1_3,-1_3_-1_2,-1_2_-1_3|
|AP 2|Mixed Derivatives|implicit:imp-second-xy / mixed|Find the second derivative d²y/dx².|Find the second derivative.|Find the second derivative d²y/dx².|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-second-xy-6|
|AP 2|Mixed Derivatives|basic:pr-poly-2 / mixed|Find the second derivative, \(f^{(2)}(x)\).|Find the second derivative.|Find the second derivative, \(f^{(2)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-poly-2-4,3,2-2,2,-3-|
|AP 2|Mixed Derivatives|implicit:imp-hard1 / mixed|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-hard1-1-4|
|AP 2|Mixed Derivatives|basic:pr-mixed-4 / mixed|Find the fourth derivative, \(f^{(4)}(x)\).|Find the derivative.|Find the fourth derivative, \(f^{(4)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-mixed-4-2_1_5_1,2_1_-1_1,-3_1_3_2|
|AP 2|Mixed Derivatives|basic:pr-neg-4 / mixed|Find the fourth derivative, \(f^{(4)}(x)\).|Find the derivative.|Find the fourth derivative, \(f^{(4)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-neg-4--1_1_-1,-4_1_-2|
|AP 2|Mixed Derivatives|basic:pr-frac-3 / mixed|Find the third derivative, \(f^{(3)}(x)\).|Find the derivative.|Find the third derivative, \(f^{(3)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-frac-3-1_3_2_3,2_1_-1_3,3_3_-1_2|
|AP 2|Mixed Derivatives|basic:pr-mixed-3 / mixed|Find the third derivative, \(f^{(3)}(x)\).|Find the derivative.|Find the third derivative, \(f^{(3)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-mixed-3--1_1_4_1,1_2_-2_1,3_1_3_2|
|AP 2|Mixed Derivatives|basic:pr-neg-3 / mixed|Find the third derivative, \(f^{(3)}(x)\).|Find the derivative.|Find the third derivative, \(f^{(3)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-neg-3-1_2_-1,-4_1_-4|
|AP 2|Mixed Derivatives|difference:dqmix-l / difference|Simplify the difference quotient.|Find the derivative.|Simplify the difference quotient.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record dqmix-l--2-1|
|AP 2|Mixed Derivatives|difference:dqmix-rec / difference|Simplify the difference quotient.|Find the derivative.|Simplify the difference quotient.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record dqmix-rec--3-4|
|AP 2|Mixed Derivatives|difference:dqmix-q / difference|Simplify the difference quotient.|Find the derivative.|Simplify the difference quotient.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record dqmix-q-4-2--6|
|AP 2|Mixed Derivatives|difference:dqmix-r / difference|Simplify the difference quotient.|Find the derivative.|Simplify the difference quotient.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record dqmix-r-9|
|AP 2|Mixed Derivatives|basic:pr-frac-1 / basic|Find \(f'(x)\).|Find the derivative.|Find \(f'(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-frac-1--1_2_-2_3,1_3_4_3|
|AP 2|Mixed Derivatives|basic:pr-neg-1 / basic|Find \(f'(x)\).|Find the derivative.|Find \(f'(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-neg-1-1_1_-4,4_2_-1,5_2_-2|
|AP 2|Mixed Derivatives|basic:pr-irr-1 / basic|Find \(f'(x)\). Assume \(x>0\).|Find the derivative.|Find \(f'(x)\). Assume \(x>0\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-irr-1-sqrt3-2-3-2|
|AP 2|Mixed Derivatives|basic:pr-mixed-1 / basic|Find \(f'(x)\).|Find the derivative.|Find \(f'(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-mixed-1--1_1_2_1,-3_2_-3_1,-5_1_4_3|
|AP 2|Mixed Derivatives|basic:pr-frac-2 / basic|Find the second derivative, \(f^{(2)}(x)\).|Find the second derivative.|Find the second derivative, \(f^{(2)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-frac-2-2_3_-1_2,1_1_-5_2|
|AP 2|Mixed Derivatives|basic:pr-poly-1 / basic|Find \(f'(x)\).|Find the derivative.|Find \(f'(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-poly-1-6,4,3,1-4,1,-4,-1-|
|AP 2|Mixed Derivatives|basic:pr-mixed-4 / basic|Find the fourth derivative, \(f^{(4)}(x)\).|Find the derivative.|Find the fourth derivative, \(f^{(4)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-mixed-4-2_1_5_1,2_2_-1_1,-2_1_4_3|
|AP 2|Mixed Derivatives|basic:pr-frac-4 / basic|Find the fourth derivative, \(f^{(4)}(x)\).|Find the derivative.|Find the fourth derivative, \(f^{(4)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-frac-4-3_3_1_2,-3_2_-1_2|
|AP 2|Mixed Derivatives|basic:pr-poly-3 / basic|Find the third derivative, \(f^{(3)}(x)\).|Find the derivative.|Find the third derivative, \(f^{(3)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-poly-3-5,4,3,1--3,2,1,1-|
|AP 2|Mixed Derivatives|basic:pr-mixed-3 / basic|Find the third derivative, \(f^{(3)}(x)\).|Find the derivative.|Find the third derivative, \(f^{(3)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-mixed-3-1_1_4_1,-4_1_-1_1,-2_1_3_2|
|AP 2|Mixed Derivatives|basic:pr-poly-2 / basic|Find the second derivative, \(f^{(2)}(x)\).|Find the second derivative.|Find the second derivative, \(f^{(2)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-poly-2-2-3-|
|AP 2|Mixed Derivatives|basic:pr-frac-3 / basic|Find the third derivative, \(f^{(3)}(x)\).|Find the derivative.|Find the third derivative, \(f^{(3)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-frac-3--3_1_-1_4,2_1_1_2|
|AP 2|Mixed Derivatives|basic:pr-poly-4 / basic|Find the fourth derivative, \(f^{(4)}(x)\).|Find the derivative.|Find the fourth derivative, \(f^{(4)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-poly-4-4,3,2-3,-1,1-|
|AP 2|Mixed Derivatives|basic:pr-neg-3 / basic|Find the third derivative, \(f^{(3)}(x)\).|Find the derivative.|Find the third derivative, \(f^{(3)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-neg-3-3_1_-1,-2_1_-2,2_2_-3|
|AP 2|Mixed Derivatives|basic:pr-neg-4 / basic|Find the fourth derivative, \(f^{(4)}(x)\).|Find the derivative.|Find the fourth derivative, \(f^{(4)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-neg-4--2_3_-1,-3_1_-4,-1_2_-3|
|AP 2|Mixed Derivatives|basic:pr-neg-2 / basic|Find the second derivative, \(f^{(2)}(x)\).|Find the second derivative.|Find the second derivative, \(f^{(2)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-neg-2-1_1_-3,-3_1_-2|
|AP 2|Mixed Derivatives|basic:pr-mixed-2 / basic|Find the second derivative, \(f^{(2)}(x)\).|Find the second derivative.|Find the second derivative, \(f^{(2)}(x)\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pr-mixed-2--1_1_3_1,-3_2_-2_1,1_2_-1_2|
|AP 2|Mixed Derivatives|product:pb3 / product|Find the derivative and simplify completely.|Find the derivative.|Find the derivative and simplify completely.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pb3--1-2--2-5-3-3|
|AP 2|Mixed Derivatives|product:pb2 / product|Find the derivative and simplify completely.|Find the derivative.|Find the derivative and simplify completely.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pb2--1-6-3-0-2-1|
|AP 2|Mixed Derivatives|product:pb1 / product|Find the derivative and simplify completely.|Find the derivative.|Find the derivative and simplify completely.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record pb1--1-0--4--3-1-1|
|AP 2|Mixed Derivatives|implicit:imp-exp-xy / implicit|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-exp-xy|
|AP 2|Mixed Derivatives|implicit:imp-hard3 / implicit|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-hard3-1-3-1|
|AP 2|Mixed Derivatives|implicit:imp-circle / implicit|Find dy/dx by implicit differentiation.|Find \(\frac{dy}{dx}\).|Find dy/dx by implicit differentiation.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-circle-5|
|AP 2|Mixed Derivatives|implicit:imp-hard1 / implicit|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-hard1-4-3|
|AP 2|Mixed Derivatives|implicit:imp-second-xy / implicit|Find the second derivative d²y/dx².|Find the second derivative.|Find the second derivative d²y/dx².|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-second-xy-6|
|AP 2|Mixed Derivatives|implicit:imp-xy / implicit|Find dy/dx by implicit differentiation.|Find \(\frac{dy}{dx}\).|Find dy/dx by implicit differentiation.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-xy-10|
|AP 2|Mixed Derivatives|implicit:imp-second-circle / implicit|Find the second derivative d²y/dx².|Find the second derivative.|Find the second derivative d²y/dx².|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-second-circle-8|
|AP 2|Mixed Derivatives|implicit:imp-hard2 / implicit|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-hard2-4|
|AP 2|Mixed Derivatives|implicit:imp-sin-xy / implicit|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-sin-xy|
|AP 2|Mixed Derivatives|implicit:imp-sin-sum / implicit|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-sin-sum|
|AP 2|Mixed Derivatives|implicit:imp-sin-y-squared / implicit|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-sin-y-squared|
|AP 2|Mixed Derivatives|implicit:imp-sin-y / implicit|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-sin-y-5|
|AP 2|Mixed Derivatives|implicit:imp-higher / implicit|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-higher-5-4-2|
|AP 2|Mixed Derivatives|implicit:imp-sin-quadratic / implicit|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-sin-quadratic-3|
|AP 2|Mixed Derivatives|implicit:imp-cubic-curve / implicit|Find dy/dx.|Find \(\frac{dy}{dx}\).|Find dy/dx.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-cubic-curve|
|AP 2|Mixed Derivatives|implicit:imp-mixed / implicit|Find dy/dx by implicit differentiation.|Find \(\frac{dy}{dx}\).|Find dy/dx by implicit differentiation.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record imp-mixed-2-4-10|
|AP 2|Mixed Derivatives|logdiff:ld-simple-xsine / logdiff|Find the derivative. Assume \(x>0\).|Find the derivative.|Find the derivative. Assume \(x>0\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record ld-simple-xsine-4|
|AP 2|Mixed Derivatives|logdiff:ld-simple-xkx / logdiff|Find the derivative. Assume \(x>0\).|Find the derivative.|Find the derivative. Assume \(x>0\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record ld-simple-xkx-5|
|AP 2|Mixed Derivatives|logdiff:ld-simple-sin / logdiff|Find the derivative. Assume \(\sin x>0\).|Find the derivative.|Find the derivative. Assume \(\sin x>0\).|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record ld-simple-sin-cos|
|AP 2|Mixed Derivatives|inverse:iv-exp / inverse|Find the indicated derivative.|The functions \(f\) and \(g\) are inverses. Find the indicated derivative.|Find the indicated derivative.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record iv-exp-4-3|
|AP 2|Mixed Derivatives|inverse:iv1 / inverse|Let g be the inverse of f. Find the indicated derivative.|The functions \(f\) and \(g\) are inverses. Find the indicated derivative.|Let g be the inverse of f. Find the indicated derivative.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record iv1-4--1-1|
|AP 2|Mixed Derivatives|inverse:iv2 / inverse|Let g be the inverse of f. Find the indicated derivative.|The functions \(f\) and \(g\) are inverses. Find the indicated derivative.|Let g be the inverse of f. Find the indicated derivative.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record iv2-6-2--1|
|AP 2|Mixed Derivatives|inverse:iv-log / inverse|Find the indicated derivative.|The functions \(f\) and \(g\) are inverses. Find the indicated derivative.|Find the indicated derivative.|Authored task replaced; order/form/domain can be lost|No; prompt only|Node paired generation + browser record iv-log-1|

## Every inspected engine

The complete family and selector lists for each row are in the linked machine
ledger. “No change” means no instruction correction was required, not that a
source-string search was treated as sufficient evidence.

| Course / unit | Engine / route | Actual generated questions | Family/selector/contract records | Change |
|---|---|---:|---:|---|
|AP Calculus 1|ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html|6,800|372|No change|
|AP Calculus 1|ap-calculus/unit-1-limits-continuity/topics/intermediate-value-theorem/practice/index.html|300|5|No change|
|AP Calculus 1|ap-calculus/unit-1-limits-continuity/topics/introduction-to-continuity/continuity-parameters/index.html|300|5|No change|
|AP Calculus 1|ap-calculus/unit-1-limits-continuity/topics/introduction-to-limits/practice/index.html|300|2|No change|
|AP Calculus 1|ap-calculus/unit-1-limits-continuity/topics/sin-one-over-x/practice/index.html|300|5|No change|
|AP Calculus 1|ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/course-practice/index.html|300|8|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/comprehensive-review/conceptual-practice/index.html|300|19|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/comprehensive-review/derivatives-at-a-point-practice/index.html|3,000|132|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html|26,400|610|Authored prompt policy|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/derivatives-of-inverse-functions/practice/index.html|300|5|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/derivatives-of-logarithmic-functions/derivative-at-a-point-practice/index.html|1,800|38|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/derivatives-of-logarithmic-functions/practice/index.html|600|112|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/derivatives-of-trigonometric-functions/derivative-at-a-point-practice/index.html|1,800|30|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/derivatives-of-trigonometric-functions/practice/index.html|600|25|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/derivative-at-a-point-practice/index.html|1,800|10|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/difference-quotient/practice/index.html|300|9|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/exponential-functions/derivative-at-a-point-practice/index.html|1,800|14|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/exponential-functions/practice/index.html|600|78|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/implicit-differentiation/derivative-at-a-point-practice/index.html|1,500|12|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/implicit-differentiation/practice/index.html|600|97|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/inverse-trigonometric-functions/derivative-at-a-point-practice/index.html|1,500|64|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/inverse-trigonometric-functions/practice/index.html|600|151|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/logarithmic-differentiation/practice/index.html|600|179|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/the-chain-rule/derivative-at-a-point-practice/index.html|1,500|18|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/the-chain-rule/nested-chain-rule-practice/index.html|1,500|480|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/the-product-rule/derivative-at-a-point-practice/index.html|1,500|8|No change|
|AP Calculus 2|ap-calculus/unit-2-derivatives/topics/the-quotient-rule/derivative-at-a-point-practice/index.html|1,500|8|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/absolute-and-local-extrema-and-the-extreme-value-theorem/practice/index.html|300|23|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/assignment-practice/index.html|3,600|395|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/calculator-practice/index.html|2,100|177|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/equations-of-tangent-and-normal-lines/practice/index.html|300|59|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines-implicitly/calculator-practice/index.html|300|11|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines-implicitly/practice/index.html|300|19|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines/practice/index.html|300|17|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/increasing-decreasing-intervals-concavity-and-extrema/calculator-practice/index.html|1,500|52|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/increasing-decreasing-intervals-concavity-and-extrema/practice/index.html|1,500|52|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/l-hopital-s-rule/practice/index.html|300|40|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/linearization-and-differentials/practice/index.html|300|20|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/motion/calculator-practice/index.html|300|16|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/motion/practice/index.html|300|23|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/newton-s-method-for-approximating-roots-of-a-function/practice/index.html|300|5|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/optimization/calculator-practice/index.html|300|25|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/optimization/practice/index.html|300|36|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/related-rates/calculator-practice/index.html|300|41|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/related-rates/practice/index.html|300|41|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/rolle-s-theorem-and-the-mean-value-theorem/practice/index.html|900|115|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/tangent-and-secant-line-approximations/practice/index.html|900|66|No change|
|AP Calculus 3|ap-calculus/unit-3-applications-derivative/topics/using-your-graphing-calculator/practice/index.html|300|10|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/basic-integrals/practice/index.html|300|12|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/comprehensive-review/assignment-practice/index.html|1,800|59|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/comprehensive-review/practice/index.html|3,600|187|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/evaluating-definite-integrals-with-a-limit-and-summation/practice/index.html|300|4|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/integral-rules-practice/index.html|300|6|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/practice/index.html|300|8|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/integrals-resulting-in-natural-log-and-inverse-trigonometric-functions/practice/index.html|300|8|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/integrals-using-geometry/practice/index.html|300|7|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/introduction-to-sigma-notation/practice/index.html|300|3|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/mean-value-theorem-for-integrals/practice/index.html|300|6|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/rectangular-approximations/practice/index.html|300|20|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/trapezoidal-approximations/practice/index.html|300|17|No change|
|AP Calculus 4|ap-calculus/unit-4-integrals/topics/u-substitution-integrals/practice/index.html|300|20|No change|
|AP Calculus 5|ap-calculus/unit-5-differential-equations/topics/basic-first-order-differential-equations/calculator-practice/index.html|300|1|No change|
|AP Calculus 5|ap-calculus/unit-5-differential-equations/topics/basic-first-order-differential-equations/non-calculator-practice/index.html|1,200|38|No change|
|AP Calculus 5|ap-calculus/unit-5-differential-equations/topics/comprehensive-review/calculator-practice/index.html|1,200|102|No change|
|AP Calculus 5|ap-calculus/unit-5-differential-equations/topics/comprehensive-review/non-calculator-practice/index.html|1,200|181|No change|
|AP Calculus 5|ap-calculus/unit-5-differential-equations/topics/exponential-growth-and-decay-interest-newton-s-law-of-cooling/practice/index.html|1,200|43|No change|
|AP Calculus 5|ap-calculus/unit-5-differential-equations/topics/motion-problems/calculator-practice/index.html|1,200|20|No change|
|AP Calculus 5|ap-calculus/unit-5-differential-equations/topics/motion-problems/non-calculator-practice/index.html|1,200|23|No change|
|AP Calculus 5|ap-calculus/unit-5-differential-equations/topics/rate-problems/calculator-practice/index.html|1,200|10|No change|
|AP Calculus 5|ap-calculus/unit-5-differential-equations/topics/rate-problems/non-calculator-practice/index.html|1,200|26|No change|
|AP Calculus 5|ap-calculus/unit-5-differential-equations/topics/separable-differential-equations/practice/index.html|300|13|No change|
|AP Calculus 5|ap-calculus/unit-5-differential-equations/topics/slope-fields/practice/index.html|1,500|18|No change|
|Calculus Prep Prep|calculus-prep/calculus-algebra/index.html|400|5|No change|
|Calculus Prep Prep|calculus-prep/domains/index.html|700|12|No change|
|Calculus Prep Prep|calculus-prep/function-graphs/index.html|1,800|24|No change|
|Calculus Prep Prep|calculus-prep/log-rules/index.html|900|16|No change|
|Calculus Prep Prep|calculus-prep/rational-functions/index.html|300|9|No change|
|Calculus Prep Prep|calculus-prep/special-factoring/index.html|1,800|20|No change|
|Calculus Prep Prep|calculus-prep/synthetic-division/index.html|1,200|18|No change|
|Calculus Prep Prep|calculus-prep/trig-angle-skills/index.html|12,000|150|No change|
|Calculus Prep Prep|calculus-prep/trig-equations/index.html|600|9|No change|
|Calculus Prep Prep|calculus-prep/trig-identities/index.html|600|8|No change|
|Calculus Prep Prep|calculus-prep/unit-circle-values/index.html|13,500|270|No change|
|IM1 1|im1/unit-1-review/topics/adding-and-subtracting-negative-numbers/practice/index.html|100|5|No change|
|IM1 1|im1/unit-1-review/topics/classifying-numbers/practice/index.html|100|15|No change|
|IM1 1|im1/unit-1-review/topics/decimals/practice/index.html|400|8|No change|
|IM1 1|im1/unit-1-review/topics/fractions/practice/index.html|600|14|No change|
|IM1 1|im1/unit-1-review/topics/multiplication/practice/index.html|100|5|No change|
|IM1 1|im1/unit-1-review/topics/multiplying-and-dividing-negative-numbers/practice/index.html|300|8|No change|
|IM1 1|im1/unit-1-review/topics/order-of-operations/practice/index.html|100|12|No change|
|IM1 1|im1/unit-1-review/topics/percents/practice/index.html|600|18|No change|
|IM1 1|im1/unit-1-review/topics/reducing-fractions/practice/index.html|100|1|No change|
|IM1 1|im1/unit-1-review/topics/square-roots-and-exponents/practice/index.html|100|1|No change|
|IM1 2|im1/unit-2-algebraic-operations-equations-inequalities/topics/comprehensive-review/practice/index.html|3,200|49|No change|
|IM1 3|im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/section-a-review/practice/index.html|2,800|16|No change|
|IM1 3|im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/section-b-review/practice/index.html|2,400|12|No change|
|IM1 3|im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/section-c-review/practice/index.html|2,000|14|No change|
|IM1 3|im1/unit-3-linear-equation/topics/comprehensive-review/practice/index.html|2,000|52|No change|
|IM1 3|im1/unit-3-linear-equation/topics/d-recursive-formulas-for-linear-relationships/section-d-review/practice/index.html|1,600|10|No change|

## Validation and practical limits

- New deterministic Node regression passes: all 22 selectors / 26,400 paired generations, all 610 records, all 93 changed records, correct/incorrect grading, four quotient types, derivative orders, domain assumptions and unchanged polynomial-form rejection.
- Real Chromium + MathJax browser regression passes **416/416 checks**, zero page errors: all 93 changed records with correct/incorrect answers in MathLive and legacy modes, plus 44 actual selector transitions. Keypad initialization and original grading remain active.
- The before-change positive control fails on a radical difference quotient that displayed Find the derivative. The final source-preservation guard permits exactly the `mk()` prompt replacement and rejects every other change to this HTML file.
- The generated-family audit passes **144,100 generations / 99 engine contexts / 5,352 family-selector-contract records**, with zero fixture/generation failures. The Prep semantic validators run on every sampled selector combination.
- Existing full mathematical, focused-browser, route, video and content regressions are recorded at Checkpoint D. Their historical evidence is retained.

Seeded parameter sampling is finite. The audit compares complete review wrappers
and shared generator objects so its prompt-preservation conclusion does not rely
on seeing every possible coefficient. It does not claim exhaustive testing of
all mathematical input strings, browser engines or physical devices.

Reproduce with `node --test tools/mathlive-sitewide/review-instructions.test.mjs`,
`node tools/integration/review-instruction-audit.mjs`, and
`MATHJAX_FIXTURE_ROOT=/path/to/cache node tools/integration/review-instructions-browser.mjs`.
Browser evidence is in [review-instructions-browser.json](evidence/review-instructions-browser.json).
