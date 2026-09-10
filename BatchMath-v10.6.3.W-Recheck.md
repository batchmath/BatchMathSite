# BatchMath v10.6.3.W

Full cumulative website. Includes all work through V and both subsequent saved checkpoints (Advanced Trig radicals and IM1 Combining Like Terms).

## Distributive Property

- Removes explicit coefficients of 1 and added zero terms from generated expressions and choices.
- Adds three sets of parentheses alongside the existing two-group problems, with positive and negative outside factors.
- Retains the equivalence families moved here in the previous checkpoint.
- No generic Cannot be determined, No solution, or None of these fillers.

## Solving Linear Equations

- All problems require an entered solution. The keypad provides digits, minus, fractions, cursor movement, deletion, No Solution and Infinite Solutions.
- No explicit 1x or + 0 terms. An implicit coefficient of 1 is displayed naturally as x, including in fraction numerators.
- Nine families: one-step, two-step, distribution, variables on both sides, fractional coefficients, a fraction containing a linear numerator, fractions on both sides, identities and contradictions.
- 78% unique-solution problems; 11% no solution; 11% infinitely many solutions. These are random selection probabilities, not a fixed ordering per 100 questions.
- Fraction bars group the entire numerator; no unnecessary parentheses around the numerator. Generated unique solutions are small integers, including negatives and zero.
- Show Hint / Hide Hint gives a method cue without changing the problem, answer or score.
- Wrong answers display a fully worked solution. Correct answers also show the work. Invalid input does not count as an attempt.
- Enter checks the response. Next Problem remains manual for typed answers.

## Linear Inequalities and Interval Notation

- Moves the Which interval represents family from Linear Inequalities to Interval Notation.
- The sign-reversal identification family now varies coefficients, constants, boundary and inequality direction.
- Both correct and incorrect Part 1 answers lead to a required Part 2 solving the identified negative-coefficient inequality. Next Problem appears after Part 2 is answered.
- Each part is scored as one response. Part 2 shows the solving steps after either result.
- Linear Inequalities no longer adds No solution, Cannot be determined or other generic filler choices. Remaining substantive choices may number fewer than four when duplicates are removed.

## Comprehensive Review

The review uses the same updated generators, equation entry controls, hints and two-part inequality workflow. The moved interval family now comes from the Interval Notation pool.

## Verification

- 30,000 equation samples; 449,424 independent checks of equation values and solution steps.
- Special equation outcomes: 3,272 no solution + 3,367 infinitely many solutions = 22.13% observed.
- 10,000 samples per distribution / inequality / interval pool checked for requested families and forbidden fillers.
- Actual controller/keypad handlers tested for hints, answer entry, malformed answers, duplicate submissions, next-question reset, and both Part 1 outcomes.
- Broader Unit 2 QA: 150,000 problems and 94,365 semantic checks passed.
- Combining Like Terms regression: 24,000 generated problems and 30,918 independent identities passed.
- Previous Advanced Trig regression: 38 families, 5,700 samples and 35,771 identities passed.
- Release syntax/internal links, display safety, PWA cache/version and analytics checks passed.
- All 236 PDF/DOCX files remain byte-identical to full V.
- Browser visual testing was not run because the local browser executable is unavailable. Automated controller tests are not a substitute for checking the final MathJax appearance in a browser.

## Recheck after deployment

1. Distributing: generate a three-parentheses question and check negative signs, coefficients and feedback.
2. Equations: try the keypad, a fractional answer, No Solution and Infinite Solutions; toggle the hint without losing an entered answer.
3. Equations: inspect stacked numerator fractions and intentionally answer incorrectly to inspect every worked step.
4. Inequalities: answer the sign-reversal question correctly once and incorrectly once; complete Part 2 both times.
5. Interval Notation: confirm the moved interval questions appear there.
6. Unit 2 Comprehensive Review: check an entered equation solution, its hint and a two-part inequality question.
7. Recheck the prior Combining Like Terms exponent keypad and Advanced Trig square-root control.

The ZIP has website files at its root, ready to replace the repository contents using the usual deployment workflow. No deployment has been performed.
