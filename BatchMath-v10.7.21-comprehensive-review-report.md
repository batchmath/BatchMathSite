# BatchMath v10.7.21 — Unit 1 Comprehensive Review Rebuild

## Outcome

The AP Calculus Unit 1 **Comprehensive Review** now acts as a synchronization layer over the approved individual Limits & Continuity engines. The old copied review generator block was removed. Each focus routes to the same active generator source used by its individual engine, with only the small adapters needed to preserve the review UI's answer format and linked-set behavior.

## Exact Practice Type menu

1. Everything — Full Unit Review (default)
2. Tables
3. Graphs
4. Direct Substitution / Continuous Functions
5. Factoring
6. Root Substitution
7. Rationalizing
8. Complex Fractions
9. One-Sided Limits
10. Regular Trigonometric Limits
11. Squeeze Theorem
12. Finite-Point Oscillation / sin(1/x)
13. Advanced Trigonometric Limits
14. Limits at Infinity
15. Classifying Discontinuities
16. Continuity Parameters
17. Intermediate Value Theorem

No numbering is displayed in the selector. No formal-proof or separate asymptote selector was added.

## Source mapping

| Review focus | Shared source used |
|---|---|
| Tables | `BMUnit1Representations.table()` |
| Graphs | `BMUnit1Representations.graph()`; 3–5 linked questions keep the same graph |
| Direct Substitution / Continuous Functions | `BMUnit1CoreExpansions.continuous('mixed')` |
| Factoring | `BMUnit1BasicTechniques.generate('factoring')` |
| Root Substitution | `BMUnit1BasicTechniques.generate('substitution')` |
| Rationalizing | `BMUnit1BasicTechniques.generate('rationalizing')` |
| Complex Fractions | `BMUnit1BasicTechniques.generate('complex')` |
| One-Sided Limits | `BMUnit1OneSided.generate/sequence('mixed')`; linked left/right/two-sided sets are preserved |
| Regular Trigonometric Limits | `BMUnit1CourseTrig.generate()` filtered to non-squeeze families |
| Squeeze Theorem | `BMUnit1CourseTrig.generate()` filtered to squeeze families |
| Finite-Point Oscillation / sin(1/x) | approved `sin-one-over-x` topic generator |
| Advanced Trigonometric Limits | `BMAdvancedTrigAll.generate('mixed')`, including exact surd answers |
| Limits at Infinity | `BMUnit1InfinityExpansions.generate('mixed', BMUnit1InfinityLegacy.generate)` |
| Classifying Discontinuities | `BMUnit1Discontinuities.generate()` with the shared location/classification workflow |
| Continuity Parameters | `BMUnit1ContinuityParameters.generate()` with typed fraction-capable fields |
| Intermediate Value Theorem | `BMUnit1IVT.generate({mode:'mixed'})` |

The Basic Techniques individual engine and Comprehensive Review now share `unit1-basic-techniques.js`. The Limits at Infinity individual engine and Comprehensive Review now share `unit1-infinity-legacy.js` plus the existing expansion module. This removes the remaining review-only copied versions for those active routes.

## Everything distribution — observed seeded audit

The audit sampled 200,000 newly selected problem sets. Multipart graph and one-sided sequences count once at selection time.

| Group | Target | Observed |
|---|---:|---:|
| Algebra block | 25% | 24.988% |
| Regular trig (no squeeze) | 12% | 12.042% |
| Advanced trig | 8% | 8.046% |
| Squeeze + finite-point oscillation | 8% | 8.069% |
| One-sided limits | 10% | 10.079% |
| Limits at infinity | 12% | 11.973% |
| Graphs | 8% | 7.985% |
| Tables | 2% | 1.980% |
| Classifying discontinuities | 5% | 4.886% |
| Continuity parameters | 5% | 5.005% |
| IVT | 5% | 4.947% |

Within the algebra block, the observed shares were 7.706% continuous substitution and 23.036%, 23.376%, 23.362%, and 22.521% for factoring, root substitution, rationalizing, and complex fractions respectively, matching the requested 1:3:3:3:3 relative weights. Continuity Parameters produced 49.737% three-piece and 50.263% two-piece sets across 30,000 seeded samples.

## Verification completed

- Exact 17-option order, labels, values, and default.
- 2,500 seeded generations for every focus, with answer/explanation shape checks and family-routing checks.
- Advanced Trig reached 43 registered variants, covering all 38 required families.
- Regular Trig never emitted squeeze; Squeeze emitted only squeeze families.
- Limits at Infinity never emitted finite-point `sin(1/x)` practice.
- Typed numeric/exact/DNE/infinity answers, multiple-choice, continuity-parameter fields, and discontinuity location/classification flows were exercised by the production-controller VM harness.
- Correct responses retain **Show Method**; incorrect responses reveal the full approved explanation.
- Linked graph and one-sided problem sets preserve their function/graph between parts.
- Selector changes reset linked state and generate from the selected family.
- Enter handling is guarded against duplicate submission; custom-answer completion moves focus to **Next Question**.
- Full non-browser site regression suites passed, including 280,000 deterministic AP stress problems, 40,000 targeted Basic Techniques problems, 30,000 Unit 1 controller samples, explanation identity checks, PWA/static/reference checks, fraction-sign parsing, and all existing Unit 1 family suites.

## Exceptions

No generator focus was left unmapped, and no requested category was omitted.

The packaged environment did not contain Playwright or a Chromium executable. The cloud browser also blocks `file:` URLs, so a true rendered-browser pass could not be run here. This is an environment limitation, not a silently skipped check. Production controller behavior was instead exercised in the existing DOM/VM interaction harness, and the manual browser recheck list below is included for final visual confirmation.

## Manual browser recheck list

1. Open Comprehensive Review and confirm the 17 options appear in the exact order above, with **Everything — Full Unit Review** selected.
2. Switch through all 16 focused modes and confirm the displayed problem belongs to the selected family.
3. In Everything, advance through at least 50 sets and confirm the mix includes algebra, trig, oscillation/squeeze, one-sided, infinity, representations, and continuity topics.
4. On a graph set, confirm the same large graph remains for all 3–5 questions.
5. On a linked one-sided set, confirm the same function is used for left, right, and two-sided parts.
6. Submit one correct and one incorrect typed answer; verify Show Method/full explanation behavior and exact fractions, roots, DNE, and signed infinity.
7. Complete one Continuity Parameters problem, one IVT choice problem, and one Classifying Discontinuities workflow.
8. After answering, press Enter and confirm exactly one next problem appears.
9. Check a narrow/mobile viewport for selector width, math wrapping, graph sizing, and keypad usability.
10. Confirm no console errors while switching selectors or advancing multipart sets.
