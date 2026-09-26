# BatchMath v10.7.20 Dropdown Standardization Report

## Shared treatment

- Added reusable `bm-practice-select` and `bm-practice-select-label` classes in `assets/site.css`.
- The closed controls now match the Limits & Continuity “Jump to Topic” treatment: black background, yellow text, red border, 7px radius, matching padding and weight, yellow hover/focus border, and the existing high-visibility focus outline.
- Kept native browser and mobile select behavior. Controls use full available width, a zero minimum width, and a 16px mobile font size to prevent overflow and mobile zoom/readability problems.
- Applied the treatment to all 86 select controls on all 50 active generator pages, including answer selects and hidden fixed selectors so they are consistent if exposed later.

## Main labels standardized to **Practice Type**

- AP Calculus Unit 1: Basic Techniques, Comprehensive Review, Limits at Infinity, One-Sided Limits, and Advanced Trigonometric Limits.
- AP Calculus Unit 2: Comprehensive Review and Chain Rule.
- Calculus Prep: Function Domains, Function Graphs, Rational Function Analysis, Special Factoring, Trigonometric Equations, Trigonometric Identities, and Unit Circle Exact Values.
- Integrated Math 1: Coordinate System and Nine Key Features.

## Meaningful secondary labels intentionally preserved

- Power Rule: **Derivative Order** and **Function Type**.
- Solids of Revolution: **Calculator Use**.
- Function Graphs and Trigonometric Identities: **Question Type**.
- Special Factoring: **Difficulty**.
- Synthetic Division: **Polynomial Degree**.
- Trig Angle Skills and Unit Circle Exact Values: **Angle Set** and **Angle Format**.
- IM1 timed-review engines: **Time Limit** and **Number of Questions**.
- Rational Function Analysis answer selectors retain their feature-specific labels.

## Exceptions

No visible active practice-generator selector is exempt from the shared styling. Hidden fixed internal category controls retain their existing internal labels because they are not user-facing problem-family choices; they still receive the shared visual class.

## Verification

- Confirmed 50 generator pages, 86 selects, and 401 static options.
- Compared option names, order, values, and selected defaults with v10.7.19 using an exact manifest hash; no differences were found.
- Verified associated labels, responsive sizing, native select behavior, mouse hover, and keyboard focus rules.
- Existing generator/regression suites verify that selector values continue to invoke the same families and that scoring, URL, and problem-generation behavior remains intact.
