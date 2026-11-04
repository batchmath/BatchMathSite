# Batch 4 — AP Calculus Unit 1

Seven typed-answer topic routes now default to MathLive. Existing native/shared editors remain available with ?editor=legacy. Unit 1 comprehensive review remains Batch 8.

| Route | Deterministic questions | Observed families | Comparisons |
|---|---:|---:|---:|
| ✓ basic-techniques-indeterminate-limits/practice | 1200 | 43 | 7200 |
| ✓ limits-of-continuous-functions/practice | 200 | 11 | 1200 |
| ✓ one-sided-limits/practice | 1000 | 32 | 6000 |
| ✓ limits-at-infinity/practice | 1200 | 8 | 6000 |
| ✓ squeeze-theorem-trigonometric-limits/practice | 430 | 43 | 2580 |
| ✓ introduction-to-continuity/practice | 130 | 13 | 220 |
| ✓ squeeze-theorem-trigonometric-limits/course-practice | 200 | 24 | 1200 |

## Fields and retained interfaces

- Basic Techniques and Limits of Continuous Functions: finite exact/numerical expressions, including fractions, nested fractions, square/cube/nth roots, powers, pi/e and logs.
- One-Sided Limits and Limits at Infinity: the same scalar contract plus signed infinities and DNE. End-behavior/asymptote questions retain their original choices, with mathematical editors hidden.
- Advanced Trig Limits: exact finite rational/surd values, all 43 declared family templates. Its local text input/keypad is bridged through a reusable native-input component.
- Regular Course Trig Limits: rational numerical values; compact arithmetic/fraction keypad, including nested denominators.
- Classifying Discontinuities: numerical x-location only; all 13 source generator templates. Classification, another-location decisions, set scoring and feedback remain specialized.
- Introduction to Limits (tables/graphs), IVT (guaranteed values/root verification) and sin(1/x) remain choice-only. Static inspection and all declared mode/family tests confirm those contracts. Their graphs and conceptual controls are unchanged.

## Verified keypad profiles

The two opt-in shared limit profiles are defined before keypad initialization: migration-limit-finite and migration-limit-signed. Both provide digits, signs/decimal, arithmetic/grouping, fraction, square/cube/nth roots, powers, pi, e, ln and common log. The common-log omission recorded in the audit is resolved. Only the signed profile provides infinity, negative infinity and DNE. No variables or unusable trig functions are supplied to the Unit 1 number parser.

The advanced-trig value profile provides fractions, square roots, powers, decimal arithmetic and grouping. The rational/course/location profile omits radical/function/constant/result-token controls not required by those generated answer contracts. Classification and theorem words stay in existing choice controls. Infinity styling is inherited unchanged.

The browser explicitly asserts required buttons and forbidden variable/trig/result-token keys; loading a generic derivative keypad cannot pass these tests.

## Preservation and reusable integration

Except for the separately committed mathematical fix below, generators, graders, inline controllers, explanations and modes are unchanged; byte-comparison tests enforce this.

The new native-fields component preserves original local inputs, pads, listeners and resets. It reuses the pinned runtime, structural translator and keypad bridge. The public createPad helper builds the existing BatchMath layout without substituting a new engine. Native sources use the existing clipped-input convention so original focus calls still reach the editable mathematical field.

The shared field adapter gains an opt-in visibility callback for routes switching to conceptual selections. Defaults on the existing derivative engines are unchanged.

A real browser regression found MathLive retaining text mode after DNE. Shared reset now explicitly parses in math mode; Clear returns to math mode while retaining undo behavior. DNE-to-number/reset and native physical fraction entry are tested.

## Evidence

- 4,360 generated questions/sets. 24,180 actual original-UI checker comparisons plus 220 discontinuity-location parser/value comparisons. Correct, incorrect, blank, incomplete, division-by-zero and supported +0 alternatives retain original decisions.
- All 43 advanced-trig descriptors receive ten native builds. All 13 discontinuity descriptors receive ten builds. Other engines sample 200 questions per available selector mode, with observed families recorded in artifacts/unit1-node.json. This is bounded coefficient sampling, not exhaustive mathematical-identity closure.
- 11 focused Unit 1 Node tests pass, including the separate mathematical regression and source/choice isolation; 17 shared Unit 4/5 contract tests and focused derivative/keypad regressions pass.
- Chromium 154 / real local MathLive and same-origin real MathJax: 7/7 routes, 421 paired submissions, no page errors. Final profile/focus runs verify actual buttons, DNE transitions, undo/redo, Enter, fresh-question first-key entry, 375px layouts and choice-only end-behavior transitions.
- Native editor recovery tests cover all three local paths, restoring both typed answers and original controls; delayed successful initialization imports pending fractional input. Missing runtime leaves usable original inputs.
- Shared regressions: original Power Rule browser 38/38, Quotient 6/6 (six pairs), Basic Integrals 22/22, no page errors.

## Separate mathematical correction and limits

Commit 0f4f54e93911253becef67f9cb77a431e64dce0a corrected Unit 1 unary-minus/exponent precedence before migration. See MATH-CORRECTIONS.md. No other grading policy changed.

Browser evidence is Linux Chromium, desktop and 375px. Physical devices and assistive technology are not certified. Unit 1 comprehensive/mixed practice remains pending Batch 8. Next: IM1 Units 1 and 2, then IM1 Unit 3, Calculus Prep and comprehensive/assignment audit.
