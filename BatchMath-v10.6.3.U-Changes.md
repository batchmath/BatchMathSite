# BatchMath v10.6.3.U — approved Limits & Continuity updates

Cumulative release built from the complete v10.6.3.T website, including the earlier R/S keyboard and Advanced Trig fixes. This document supersedes the pending-decision list in the T release notes.

## Changes by engine

| Engine | Changes in U |
|---|---|
| Introduction to Limits | Added a Tables / Graphs selector. Tables cover matching and differing one-sided behavior, point values (including undefined), and signed infinite behavior. Graphs cover continuous junctions, holes, jumps, and vertical asymptotes, with questions about left/right/two-sided limits, function values, and continuity. Methods distinguish point values from limits and explain why the two sides agree or disagree. Table conclusions are explicitly estimates, not proofs. |
| Limits of Continuous Functions | Preserved its three substitution families and explanations. Correct answers stay visible with optional Show Method. Invalid input does not count; valid wrong answers count and reveal the method. |
| Basic Techniques | Restricted All Topics to continuous functions, factoring, substitution, rationalizing, and complex fractions. Preserved all families, coefficients, difficulty and existing weights within those categories. Applied the same answer/feedback rules. |
| One-Sided Limits | Preserved its four families and T explanations. Applied the answer/feedback rules, including signed infinity and DNE input. |
| Limits at Infinity | Preserved all 22 families, both directions and the radical-family variety. Applied the answer/feedback rules. |
| sin(1/x) | Preserved oscillating and damped families and their explanations. Correct answers now offer Show Method; wrong answers reveal it. |
| Regular Squeeze / Trig | Preserved existing assignment-style families and methods. Correct answers offer Show Method; wrong answers reveal it. |
| Advanced Trig | Preserved all 38 families, hints and worked methods. Valid DNE/infinity answers now count as wrong for its finite-limit questions. Blank, undefined, division-by-zero and malformed answers do not count. Existing radical answers remain supported. |
| Classifying Discontinuities | Preserved all five generator families. Equivalent numerical location forms are accepted. Repeating a found location gives a reminder without penalty. Correct classifications offer Show Method; incorrect classifications reveal it. The completed set stays visible with a method option and New Problem. |
| Continuity Parameters | Preserved existing families and boundary-equation methods. Correct answers offer Show Method; wrong answers reveal it. The same generator is now available in Comprehensive Review. |
| IVT | Preserved guaranteed-output and root-guarantee families, including continuity/domain checks. Correct answers offer Show Method; wrong answers reveal it. Both modes are included in Comprehensive Review. |
| Comprehensive Review | Added selectable Tables, Graphs, Classifying Discontinuities, Continuity Parameters, IVT, and Asymptote Interpretation categories, also included in All Topics. Asymptote interpretation covers horizontal/vertical inference, different end asymptotes, and crossing a horizontal asymptote. Uses the same table/graph/parameter/IVT generators as their topic engines and a synchronized copy of all five discontinuity families. Existing ten algebraic categories remain intact. Numeric, multiple-choice and multi-stage questions receive suitable controls. |

## Answer behavior

- A completed correct answer stays on screen. Show Method is optional; Next Question or Enter advances. Advanced Trig retains its hint control.
- A completed wrong answer counts and shows the mathematical method.
- Blank or unparseable input does not count and leaves the question active.
- Equivalent fractions and decimals, DNE and signed infinity are supported where relevant. `1/0` is invalid input, not an infinity shorthand.
- `undefined` is not a substitute for DNE in a limit question. It is a legitimate choice when the question asks for an undefined function value.
- A discontinuity set is scored once after its stages. Repeated locations do not penalize the set. Its existing short transitions between stages remain; these do not generate another problem.

## Approved boundaries and future work

No assignments or answer keys were edited, including the IVT endpoint wording discussed earlier. All 235 PDFs and the DOCX are byte-for-byte identical to T. No proof family was added. No advanced family was removed or simplified.

The proposed graph/table interpretation assignment is future work, not part of this release. The new graph explanations are available for your review in the engine; wording can be adjusted after you try them. No new claim is made here that the unedited assignments are completely covered by the engines; the earlier assignment audit remains the basis for that discussion.

## Verification

- 30,000 seeded new representation/asymptote problems: expected answers checked independently against generated data; all 35 family/question combinations exercised.
- 53 production-controller scenarios in a simulated DOM, including correct/wrong feedback, optional methods, category switching, invalid input, repeated discontinuity locations, and completed-set scoring.
- 17,500 existing explanation samples and 13,124 numerical identity checks. The elementary checker skips unsupported expressions; this is not complete symbolic verification.
- Existing stress tests passed: algebraic Limits families, 22 infinity families, IVT, all five discontinuity families, and all 38 Advanced Trig families.
- Advanced Trig: 5,700 samples and 35,771 numerical identity/arithmetic checks, plus controller tests including the revised inputs.
- Fraction-sign equivalence tests passed, including 58,806 factoring-answer acceptance checks.
- Static release, display safety, cache dependencies, analytics, topic audits and the other existing non-browser regression gates passed. Test DOM stubs now supply the feedback dataset used by production controls; parser tests load the shared parser they now exercise.
- All five legacy generator blocks and the Advanced Trig generator/lesson block remain byte-for-byte identical to T. All assignments/documents remain unchanged.
- Representative graph SVGs were rasterized and visually inspected for open/filled points, branch separation, grid labels and asymptote arrows.

**Browser limitation:** Chromium is unavailable locally and its download timed out. Real browser, MathJax layout and the added browser workflow tests have not been run here. GitHub Actions retains the full seeded browser suite and now also exercises the new modes and answer flows. This ZIP is ready for that deployment/test cycle; it is not a claim of a successful GitHub run.

No deployment was performed.
