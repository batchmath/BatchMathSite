# BatchMath v10.6.3.V — changes and recheck list

This is the complete cumulative website, built from the saved U release. It carries forward the earlier website work and applies the changes approved in this conversation. No deployment was performed.

## What changed

| Area | V changes |
|---|---|
| Show Method | Explicit dark, red/yellow button styling across Limits & Continuity, including legacy pages that previously fell back to the browser's default button appearance. Focus, hover and spacing are defined. Correct answers retain optional methods; wrong answers still show methods automatically. |
| Regular Squeeze/Trig | Students now enter answers instead of selecting choices. Added an on-screen keypad with digits, fractions, signs, decimals, DNE, infinities, editing arrows, backspace and Clear. Correct answers stay visible; invalid input does not count. |
| Regular Squeeze/Trig content | Added 12 families: sine powers, tangent powers, cosine-difference powers, powered sine ratios, sine/tangent products, split sine/tangent sums, polynomial/cosine sums over squared sine, expanded squared cosine differences, Pythagorean rewrites, sine/cosine-difference products, cosine-difference ratios, and trig/polynomial products. The mix is approximately 60% these harder families, 20% existing standard trig forms and 20% squeeze. Outer squeeze powers now include fifth powers. |
| Advanced Trig | Added all ten digits and a decimal key to the existing fraction, sign and radical controls, arranged as a numerical keypad. Keys disable after an answer is checked and reset for the next question. All 38 problem families, hints and worked mathematics are preserved. |
| Limits at Infinity | Added two parameterized logarithm families whose inner quotient approaches zero. Positive approach gives negative infinity; an eventually negative argument gives DNE as a real limit in that direction. Explanations check the argument's sign and domain. All 22 existing families remain, for 24 total. The 50/50 direction balance and roughly 50% radical mix remain. |
| Classifying Discontinuities | Added repeated polynomial factors, sine-power cancellation, cosine-difference-power cancellation, and sine over a polynomial denominator. Powers can match, leave numerator powers, or leave denominator powers. Existing five families remain. Polynomial factors are expanded in approximately 95% of eligible algebraic/trig questions, with 5% factored. Methods show the factorization and analyze cancellation, remaining powers and domain exclusions. |
| Continuity Parameters | Two-piece and three-piece questions now have equal 50% selection weight. The existing four two-piece families and the two-parameter three-piece system remain. |
| Comprehensive Review | Removed Asymptote Interpretation from selection and mixed practice. Renamed the launch button and engine heading to Comprehensive Review. Added the same new trig families and synchronized the new logarithm, discontinuity and continuity-parameter behavior. Existing review trig families remain in its mixture. |

## Assignment basis

Reviewed Limits 3 and Limits 4 under Squeeze/Trig. Limits 4 problems 1, 5 and 7 motivate powered sine/tangent ratios; problem 2 motivates the Pythagorean rewrite; problem 3 motivates sine ratios; problems 4 and 6 motivate regrouping and splitting numerators. Limits 3 supplies bounded oscillation/squeeze forms. Extra trig limits was excluded as requested.

These are randomized families using the same techniques, not copies of every worksheet question. All 235 PDFs and the DOCX are byte-for-byte unchanged from U. No worksheet, answer key or new assignment was created or edited. The separate future graph/table assignment and other backlog ideas are not included.

## Recheck after installing or deploying V

1. **Version and buttons:** Confirm the updated version is loaded. In One-Sided Limits and Limits at Infinity, answer correctly and inspect Show Method: dark background, red border, yellow text and reasonable spacing. Click it once, then press Enter; verify exactly one new problem appears. Spot-check the other Unit 1 engines on desktop and a narrow/mobile screen.
2. **Regular Squeeze/Trig:** Confirm there are no answer choices. Enter a fraction entirely with the keypad; also try a decimal and a negative answer. Blank input, `undefined` and `1/0` should not count. A valid wrong answer should count and reveal the method. Review enough problems to see powers, products, sums and identity rewrites alongside the retained squeeze/basic forms.
3. **Regular trig explanations:** In particular, review the powered cosine-difference, split-cosine numerator, expanded cosine-square and product families. Check that the explanation is at the instructional level you want and that all fractions and powers render correctly.
4. **Advanced Trig keypad:** Enter an answer entirely with digits and the fraction button; try a negative radical fraction using the radical buttons. Check backspace and Clear. Confirm the keys disable after checking and work again on the next question. Check that hints, Show Method and Enter still work.
5. **Limits at Infinity:** Look for logarithms of small rational expressions. Check both positive and negative approaches of the inner expression. Expected conclusions are **negative infinity for 0+** and **DNE for 0−** in the real domain. Confirm the old radical, exponential and growth families still appear.
6. **Classifying Discontinuities:** Check expanded polynomial forms, repeated factors and trig powers. Find and classify every location, including cases where cancellation leaves an infinite discontinuity and cases where it leaves a hole. Re-enter a found location to confirm no penalty. Inspect both correct-answer methods and wrong-answer explanations. About 5% of eligible questions should still arrive factored; do not expect an exact ratio in a small sample.
7. **Continuity Parameters:** Check both two-piece and three-piece problems and their explanations. They have 50/50 selection weights; short runs can vary.
8. **Comprehensive Review:** Confirm the name and removal of Asymptote Interpretation. Check Trig, Limits at Infinity, Classifying Discontinuities and Continuity Parameters, then switch between numeric, multiple-choice and multi-stage categories. Verify the appropriate input controls appear and answers score once.
9. **GitHub QA:** Check the included workflow results after deployment. It retains the sitewide seeded browser checks and adds keypad, method-button-style and new-family checks. Send the results ZIP if any check fails.

## Verification completed here

- 20,000 regular trig samples, with all 12 new families present. Numerical checks compare the displayed new expressions from both sides near zero with their expected limits; this is numerical evidence, not symbolic proof.
- 30,000 discontinuity samples across all nine families, with independent classification rules and 53,544 numerical checks of polynomial expansions/displayed expressions.
- 4.98% of 23,427 eligible discontinuity samples were factored. Three-piece continuity questions represented 49.77% of a 20,000-question sample.
- 100,000 infinity samples: all 24 families appeared, exactly half in each direction, with approximately half from radical families. Both new logarithm families have independent sign/domain answer checks.
- 92 simulated-DOM controller scenarios, including typed regular trig, fraction-key entry, invalid input, methods, category switches and repeated discontinuity locations.
- Advanced Trig: all 38 families retained; 5,700 dedicated samples, 35,771 identity/arithmetic checks and keypad/controller checks passed.
- Existing generator stress QA passed 220,000 samples. Existing release, topic, mathematical, display, cache, analytics, fraction, keyboard and other non-browser gates passed after adapting obsolete test assumptions to the approved changes.
- Assignment bytes and the Advanced Trig generator/lesson block were compared with U. All five embedded legacy Limits generator copies remain synchronized.

**Limit:** No real browser or MathJax visual rendering run was completed locally. Chromium was unavailable in this environment. The browser checks included for GitHub have not been claimed as passed. The uploaded button PDF was inspected, and the missing styling was corrected in the code; the live visual recheck remains on the list above.
