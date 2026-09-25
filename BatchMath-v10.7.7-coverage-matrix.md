# v10.7.7 Limits Coverage Matrix

Reproduction basis: deterministic QA seed `1077`, using `qa-unit1-part1.cjs`. Each listed generated family received well over 100 cases; the saved QA result records thousands per added family. “Expected” gives a representative result, while each generated problem stores its own coefficients and answer data.

| Engine / source target | Stable family ID | Representative expected answer | Status | Explanation invariant checked |
|---|---|---:|---|---|
| Continuous: constant | `continuous_direct_constant` | generated constant | Added | Constant output identified |
| Continuous: linear | `continuous_direct_linear` | direct evaluation | Added | Actual substitution shown |
| Continuous: quadratic | `continuous_direct_quadratic` | direct evaluation | Added | Actual substitution shown |
| Continuous: cubic | `continuous_direct_cubic` | direct evaluation | Added | Actual substitution shown |
| Continuous: richer rational | `continuous_direct_rational_quadratic` | reduced rational | Added | Remaining denominator explicitly nonzero |
| Continuous: irrational square root | `continuous_direct_irrational_square_root` | e.g. `sqrt(3)` | Added | Root domain and exact result shown |
| Continuous: cube root | `continuous_direct_cube_root` | exact cube-root value | Added | All-real cube-root domain stated |
| Later review: familiar-angle trig | `continuous_direct_trig` | familiar exact trig value | Added | Direct substitution only |
| Later review: exponential | `continuous_direct_exponential` | exact power of `e` | Added | Direct substitution shown |
| Later review: natural log | `continuous_direct_logarithm` | e.g. `ln(2)` | Added | Positive log input checked |
| Factoring: nonmonic quadratic | `factoring_nonmonic_quadratic` | `A(r-s)` | Added | 0/0, factor, cancel, evaluate |
| Factoring: sum of cubes | `factoring_sum_of_cubes` | `3a^2` | Added | Sum-of-cubes identity shown |
| Factoring: GCF then factor again | `factoring_gcf_then_difference_squares` | `2Ar^2` | Added | Both factoring stages shown |
| Factoring: reversed factor `a-x` | `factoring_reversed_common_factor` | `-2a` | Added | Reversal sign handled explicitly |
| Factoring: richer numerator/denominator | `factoring_richer_common_factor` | generated reduced rational | Added | Only common factor cancelled; denominator checked |
| Root substitution: eighth-root quotient | `substitution_eighth_root_over_power` | `m/(8k^7)` | Added | `u` substitution and new approach value shown |
| Root substitution: reciprocal orientation | `substitution_power_over_eighth_root` | `8k^7/m` | Added | Difference of eighth powers shown |
| Root substitution: squared cancellation | `substitution_cube_root_squared_reciprocal` | `1/(9k^4)` | Added | Squared factor cancellation shown |
| Root substitution: polynomial ratio | `substitution_cube_root_polynomial_over_polynomial` | `(k-r)/(k-s)` | Added | Both polynomials factored in `u` |
| Rationalizing: `sqrt(x)` at 3 | `rationalizing_irrational_target` | `sqrt(3)/6` | Added | Conjugate and equivalent exact forms shown |
| Rationalizing: affine radicand | `rationalizing_affine_radicand` | `m/(2k)` | Added | Conjugate creates cancellable linear factor |
| Rationalizing: reversed difference | `rationalizing_reversed_difference` | `-1/(2k)` | Added | Negative sign preserved |
| Rationalizing: polynomial companion | `rationalizing_polynomial_companion` | `12sqrt(3)` | Added | Polynomial factorization plus conjugate shown |
| Complex fraction: two variable fractions | `complex_two_variable_fractions` | source example `-2/25` included by construction | Added | Common denominator, factorization, cancellation shown |
| Existing factoring families | existing `problemVariant` identifiers | generated | Preserved | Legacy explanations retained unless shared display changed |
| Existing root-substitution families | existing `problemVariant` identifiers | generated | Preserved | Legacy cube/fourth/fifth/sixth-root work retained |
| Existing rationalizing families | existing `problemVariant` identifiers | generated | Preserved | Legacy conjugate work retained |
| Existing ten complex-fraction variants | existing `problemVariant` identifiers | generated | Preserved | All ten variants remain reachable |
| Tables: matching/jump/infinite/point evidence | `table_matching`, `table_jump`, `table_infinite`, `table_point` | generated | Preserved / clarified | Evidence-versus-proof wording checked |
| Simple graphs: continuous/hole/jump/asymptote | `graph_continuous`, `graph_hole`, `graph_jump`, `graph_asymptote` | generated | Preserved | Branch versus point value distinguished |
| Multi-feature graph sequence | `graph_multi_continuous`, `graph_multi_hole`, `graph_multi_jump`, `graph_multi_asymptote` | generated | Added | Same graph retained across eight separately scored parts |

## Probability checks

| Pool | Implemented check |
|---|---|
| Introduction Mixed | Exact 8 table / 8 graph cycle |
| Basic Mixed | Original five-category top-level weighting preserved |
| Factoring within focused/Review engines | 50% legacy / 50% expansion generator |
| Root substitution within focused/Review engines | 70% legacy / 30% expansion generator |
| Rationalizing within focused/Review engines | 50% legacy / 50% expansion generator |
| Complex fractions within focused/Review engines | 80% legacy / 20% expansion generator |
| Continuous Review | 60% core / 40% later-unit direct substitution |

