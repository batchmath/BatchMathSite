# BatchMath v10.7.18

## Limits and Continuity

- One-Sided Limits no longer place unnecessary parentheses around a lone `x`. Expressions such as `6(x)|x|/(x)^2` now display as `6x|x|/x^2` while genuine binomial factors remain grouped.
- Regular Squeeze / Trigonometric Limits now show only the mathematical limit expression above the answer area. The redundant “Find the limit” and radians directions were removed.
- Regular Squeeze / Trigonometric Limits received an additional coefficient-of-1 cleanup across every generated family and variable choice.
- Advanced Trigonometric Limits now uses the same current Practice Focus control styling as the other AP practice engines.
- Expanded polynomial factors multiplying radicals in Classifying Discontinuities are parenthesized so the intended numerator is clear.
- In Classifying Discontinuities factored products, a lone `x` is placed before powered binomials, and polynomial/binomial factors are placed before sine or cosine factors.
- Comprehensive Review inherits the One-Sided, regular trig/squeeze, and discontinuity generator changes through the shared engines.

## Quality assurance

- Added stress checks for redundant parentheses around `x`, coefficient 1 before trig functions, removed question directions, grouped radical numerators, factor order, and the current Advanced Trig selector styling.
- Re-ran the focused One-Sided, regular trig/squeeze, Advanced Trig, and discontinuity generator suites.
