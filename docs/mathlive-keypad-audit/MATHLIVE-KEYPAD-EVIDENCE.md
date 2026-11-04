> Small correction update: the IM1 numeric multipart division gap and Unit Circle comma are fixed; infinity-button appearance is standardized. See [focused checkpoint](../keypad-corrections/CHECKPOINT.md). Historical findings below are retained as evidence. The separate Unit 1 common-log gap is outside this correction scope.

> Batch 1 update: Product and Quotient Rule are converted and family-tested; the Quotient qa8 inconsistency was corrected in a separate, authorized mathematical commit. See [checkpoint](../mathlive-batch1/CHECKPOINT.md). Original sitewide coverage figures below describe the historical partial audit.

# Keypad evidence and coverage boundaries

Reference: `d01896853c8af0950089714fdc2a7a8eccba23d0`. Deterministic sampler uses 16 seeds per registry engine. No production source is changed.

## Executed results

63 registry entries examined; 1008 generated instances; 0 recorded generator failures; 26 focused probe calls. These are not exhaustive family enumerations and not migration regression runs.

## Checker probes

| Checker | Input | Result |

| --- | --- | --- |

| BMUnit1UI.parse | `sqrt(2)` | `{"kind": "num", "value": 1.4142135623730951}` |

| BMUnit1UI.parse | `pi` | `{"kind": "num", "value": 3.141592653589793}` |

| BMUnit1UI.parse | `e` | `{"kind": "num", "value": 2.718281828459045}` |

| BMUnit1UI.parse | `ln(e)` | `{"kind": "num", "value": 1}` |

| BMUnit1UI.parse | `log(100)` | `{"kind": "num", "value": 2}` |

| BMUnit1UI.parse | `root(3,8)` | `{"kind": "num", "value": 2}` |

| BMUnit1UI.parse | `2^3` | `{"kind": "num", "value": 8}` |

| BMUnit1UI.parse | `1+1` | `{"kind": "num", "value": 2}` |

| BMUnit1UI.parse | `sin(0)` | `{"error": "Enter a valid exact value, decimal, DNE, or signed infinity. You may use fractions, roots, pi, e, and ln. This has not counted as an attempt."}` |

| IM1 numericEqual target 3/4 | `3/4` | `{"ok": true}` |

| IM1 numericEqual target 3/4 | `0.75` | `{"ok": true}` |

| IM1 numericEqual target 3/4 | `sqrt(4)` | `{"error": "Enter a number, decimal, or fraction such as 3/4."}` |

| IM1 numericEqual target 3/4 | `1+1` | `{"error": "Enter a number, decimal, or fraction such as 3/4."}` |

| CalcPrep safeExactEval | `1,0` | `"NaN"` |

| CalcPrep safeExactEval | `1` | `"1"` |

| CalcPrep safeExactEval | `1°` | `"1"` |

| CalcPrep safeExactEval | `undefined,` | `"NaN"` |

| Actual IM1 u3-01b--29-9 | `18/2` | `{"ok": true}` |

| Unit5 interval | `(0,sqrt(2))` | `{"valid": true, "ok": true}` |

| Unit5 interval | `[0,sqrt(2))` | `{"valid": true, "ok": false, "note": "The endpoints are right, but check which endpoints are included. Include an endpoint only if the solution and the differential equation are both defined there."}` |

| Unit5 interval | `0<x<sqrt(2)` | `{"valid": true, "ok": true}` |

| Unit5 interval | `(0,1)∪(2,3)` | `{"valid": true, "ok": false, "note": "An interval of validity is one connected interval containing x = 1. Keep only the piece of the domain that contains the initial value."}` |

| Actual Rules u4N-rules-interval_decomposition-1ba42c6ad1c46a8a | `(-17/1)` | `{"valid": true, "ok": true}` |

| Actual Rules u4N-rules-interval_decomposition-1ba42c6ad1c46a8a | `((-17/1))+ln(1)` | `{"valid": true, "ok": true}` |

| Actual Rules u4N-rules-interval_decomposition-1ba42c6ad1c46a8a | `((-17/1))+sin(0)` | `{"valid": true, "ok": true}` |

| Actual Rules u4N-rules-interval_decomposition-1ba42c6ad1c46a8a | `((-17/1))+sqrt(0)` | `{"valid": true, "ok": true}` |

## Deterministic reachable examples

| Registry / engine | Samples | Observed families | Representative question ID and answer |

| --- | ---: | --- | --- |

| AP / introduction-to-limits | 16 | table_matching, table_jump | [{"id": "intro--2--6--6-left", "answer": "", "kind": "", "family": "table_matching"}] |

| AP / sin-one-over-x | 16 | oscillation_vanishing_bounds, squeeze_bounds_inconclusive, oscillation_persistent_dne, oscillation_nonzero_amplitude_dne, sinx_over_x_contrast | [{"id": "osc-vanish-vanishing_absolute--2-1-1", "answer": "", "kind": "", "family": "oscillation_vanishing_bounds"}] |

| AP / intermediate-value-theorem | 16 | guaranteed_value, root_polynomial_no_sign_change, root_rational_discontinuity_outside, root_polynomial_yes, root_rational_discontinuity_inside | [{"id": "ivt-value--4-0--7-5--6", "answer": "", "kind": "", "family": "guaranteed_value"}] |

| AP / difference-quotient | 16 | point_form_simplification, quadratic_difference_quotient, cubic_difference_quotient, point_form_radical_simplification, point_form_reciprocal_simplification, linear_difference_quotient, reciprocal_difference_quotient, point_form_cubic_simplification, radical_difference_quotient | [{"id": "dqj-point-q-1--4--2--3", "answer": "", "kind": "", "family": "point_form_simplification"}] |

| AP / equations-of-tangent-and-normal-lines | 16 | radical_tangent, sine_tangent, exponential_tangent, quadratic_tangent, cosine_normal, log_tangent, cubic_normal, reciprocal_normal | [{"id": "tnL-root-2", "answer": "", "kind": "", "family": "radical_tangent"}] |

| AP / horizontal-and-vertical-tangent-lines | 16 | horizontal_trig, horizontal_logarithmic, vertical_fifth_root, horizontal_cubic, horizontal_exponential, vertical_root_plus_linear, horizontal_rational, vertical_cube_root, horizontal_quartic | [{"id": "hvL-sin-1-1", "answer": "", "kind": "", "family": "horizontal_trig"}] |

| AP / horizontal-and-vertical-tangent-lines-implicitly | 16 | implicit_hyperbola_vertical, implicit_cubic_horizontal, implicit_exponential_vertical, implicit_ellipse_vertical, implicit_mixed_quadratic_horizontal, implicit_trig_horizontal, implicit_product_vertical, implicit_hyperbola_horizontal, implicit_trig_vertical, implicit_ellipse_horizontal, implicit_cubic_vertical, implicit_product_horizontal, implicit_mixed_quadratic_vertical | [{"id": "ihvL-hyv-2-4", "answer": "", "kind": "", "family": "implicit_hyperbola_vertical"}] |

| AP / motion | 16 | trig_position_acceleration, trig_velocity_speed, velocity_at_position, position_velocity, exponential_position_speed, exponential_velocity_acceleration, projectile_maximum_altitude, trig_position_speed, velocity_speed, rest_time_numeric, position_acceleration, velocity_acceleration | [{"id": "motM-pt-1-acceleration-zero", "answer": "", "kind": "", "family": "trig_position_acceleration"}] |

| AP / absolute-and-local-extrema-and-the-extreme-value-theorem | 16 | absolute_radical, local_cubic, local_logarithm, absolute_quartic, absolute_trig_combination, local_quartic_max, local_rational, absolute_rational, absolute_exponential_product, absolute_cubic, local_quartic_min, local_trig | [{"id": "extM-root-2-p1-m2-maximum", "answer": "", "kind": "", "family": "absolute_radical"}] |

| AP / increasing-decreasing-intervals-concavity-and-extrema | 16 | f_given_log_increasing, first_derivative_given_increasing, f_given_rational_concavity, f_given_decreasing, f_given_trig_increasing, second_derivative_given_concavity, factored_first_derivative, f_given_rational_increasing, f_given_concavity_hard, f_given_increasing, first_derivative_given_concavity, first_derivative_given_local_extrema, f_given_exponential_increasing | [{"id": "curveM-flog-m4-4", "answer": "", "kind": "", "family": "f_given_log_increasing"}] |

| AP / linearization-and-differentials | 16 | linearization_logarithm, differential_polynomial, differential_sphere, linearization_square_root, linearization_tangent, differential_implicit, differential_trig_degrees, linearization_sine, differential_trig_composition, differential_equilateral_triangle, linearization_cube_root | [{"id": "linM-log--0_08", "answer": "", "kind": "", "family": "linearization_logarithm"}] |

| AP / tangent-and-secant-line-approximations | 16 | tangent_quadratic_up, secant_sqrt, secant_log, tangent_reciprocal, tangent_sine, secant_quadratic_down, tangent_exponential, secant_quadratic_up, tangent_quadratic_down, tangent_log, secant_exponential, secant_cosine, tangent_sqrt | [{"id": "tsaM-tq-3--3--1--2-0.5", "answer": "9.500", "kind": "approx-classification", "family": "tangent_quadratic_up"}] |

| AP / rolle-s-theorem-and-the-mean-value-theorem | 16 | mvt_reciprocal, mvt_exponential, rolle_cosine, mvt_quadratic, mvt_logarithm, rolle_sine, mvt_hypothesis_corner, mvt_square_root, rolle_quadratic, mvt_hypothesis_rational, mvt_cubic_symmetric | [{"id": "mvtM-rec-1-3", "answer": "", "kind": "", "family": "mvt_reciprocal"}] |

| AP / l-hopital-s-rule | 16 | two_application_exponential, nested_log_trig, power_over_exponential, simple_radical, shifted_exponential_trig, three_application_trig, logarithm_over_power, exponential_cosine_remainders, radical_difference_quotient, simple_exponential, cosine_exponential_remainders, inverse_trig_limit | [{"id": "lhM-er-4", "answer": "", "kind": "", "family": "two_application_exponential"}] |

| AP / rectangular-approximations | 16 | table, exponential, rational, higher-degree, logarithmic, trigonometric, cubic | [{"id": "u4K-rectangular-table_left-e4d405606dc6fff8", "answer": "6", "kind": "staged-calculus", "family": "table"}] |

| AP / trapezoidal-approximations | 16 | table, exponential, rational, quadratic, logarithmic, higher-degree, trigonometric, cubic | [{"id": "u4K-trapezoidal-table_equal-e68332291fd09a31", "answer": "-2", "kind": "staged-calculus", "family": "table"}] |

| AP / introduction-to-sigma-notation | 16 | identities, riemann, numerical | [{"id": "u4K-sigma-identities-constant-25126c15e4be7ba5", "answer": "n", "kind": "staged-calculus", "family": "identities"}] |

| AP / evaluating-definite-integrals-with-a-limit-and-summation | 16 | linear_construction, quadratic_monomial, nonpolynomial_representation, quadratic_combination | [{"id": "u4N-newton-linear_construction-84486e4b24330977", "answer": "0", "kind": "staged-calculus", "family": "linear_construction"}] |

| AP / fundamental-theorem-of-calculus-and-integral-rules | 16 | lower_identity, upper_power, both_algebraic, upper_identity, upper_linear, lower_power, both_transcendental, upper_trig | [{"id": "u4N-ftc-lower_identity-94e6f628abbe0006", "answer": "-x^{3}+x^{2}", "kind": "staged-calculus", "family": "lower_identity"}] |

| AP / integrals-using-geometry | 16 | linear_trapezoid, absolute_value, rectangle_circle, linear_triangle, cross_axis_line, semicircle, quarter_circle | [{"id": "u4N-geometry-linear_trapezoid-d612df95e2692453", "answer": "12", "kind": "staged-calculus", "family": "linear_trapezoid"}] |

| AP / basic-first-order-differential-equations | 16 | trig, exp_composition, log_domain, poly_power, general_solution, calc_value | [{"id": "u5-basic-trig-sin1-0-2-kdrdkg", "answer": "y=\\cos x + 3x^{2} + 1", "kind": "unit5-staged", "family": "trig"}] |

| AP / motion-problems | 16 | displacement_distance, direction_speed, calc_speed, recover, multipart, calc_distance | [{"id": "u5-motion-dist-1_-1-0-2-both-3swi09", "answer": "1", "kind": "unit5-staged", "family": "displacement_distance"}] |

| AP / separable-differential-equations | 16 | powers_y, log_rational, exp_y, product, trig, radical_branch | [{"id": "u5-separable-y2--1-0--1_4-u4jnc0", "answer": "\\left(-\\infty,\\,4\\right)", "kind": "unit5-staged", "family": "powers_y"}] |

| AP / rate-problems | 16 | initial_change, in_out, delayed_piecewise, one_rate, multipart | [{"id": "u5-rate-ini-ex-U-poly-3500-10-xizoco", "answer": "1300\\text{ bushels}", "kind": "unit5-staged", "family": "initial_change"}] |

| AP / continuity-parameters | 16 | three_piece_system, removable_fill, piecewise_parameter, piecewise_value, quadratic_parameter | [{"id": "cont-param-system--2--1--6--3-1--3-3", "answer": "", "kind": "", "family": "three_piece_system"}] |

| AP / squeeze-course-practice | 16 | standard_sine_over_x, standard_x_over_sine, standard_x_over_tangent, squeeze_cosine, cosine_minus_one_over_x, standard_tangent_over_x, one_minus_cosine_over_x, squeeze_sine | [{"id": "sq-sinx-6", "answer": "", "kind": "", "family": "standard_sine_over_x"}] |

| AP / derivatives-conceptual-review | 16 | table_scaled_quotient, table_two_scaled_quotient, table_reverse_nested, nondifferentiability, table_two_scaled_product, table_product, table_scaled_quotient_chain, inverse_derivative_rule, table_scaled_chain, table_quotient, differentiability_continuity, table_nested_square, table_scaled_plus_monomial, table_nested_scaled | [{"id": "dconceptL-table_scaled_quotient-1-0-0-0-0-0-1_-2_2_-1_-4-2_6_6_4_2-3_6_1_-5_-4-6_8_6_4_1", "answer": "", "kind": "", "family": "table_scaled_quotient"}] |

| AP / basic-integrals | 16 | expand_first, basic_trig_exponential, definite_trig_exponential, polynomial_power_rule, divide_each_term, trig_identity_rewrite, power_reduction, radicals_negative_powers, definite_power_root, divide_each_term_ln | [{"id": "u4U-basic-expand_first-ef3bf6d4ba9e5738", "answer": "\\frac{1}{3}x^{3}-\\frac{9}{2}x^{2}+14x+C", "kind": "staged-calculus", "family": "expand_first"}] |

| AP / u-substitution-integrals | 16 | polynomial_inner_constant_adjust, back_substitution, definite_polynomial_trig_inner, linear_inner_trig_exp, shifted_quadratic_power, definite_linear_inner, odd_trig_powers, composite_exponential_log, linear_inner_power_root, trig_power_chain | [{"id": "u4U-usub-polynomial_inner_constant_adjust-8196bb84d2246f60", "answer": "\\frac{7}{10}\\left(x^{2}-9\\right)^{5}+C", "kind": "staged-calculus", "family": "polynomial_inner_constant_adjust"}] |

| AP / mean-value-theorem-for-integrals | 16 | average_substitution_trig_exp_log, average_piecewise, find_c_single, average_polynomial, find_c_piecewise | [{"id": "u4U-mvt-average_substitution_trig_exp_log-a1cd8e1680d4bf96", "answer": "\\frac{9}{4\\pi}", "kind": "staged-calculus", "family": "average_substitution_trig_exp_log"}] |

| AP / integrals-resulting-in-natural-log-and-inverse-trigonometric-functions | 16 | derivative_over_function, division_to_log, definite_log, linear_denominator, inverse_tangent, inverse_sine, tan_cot_composite | [{"id": "u4U-log-derivative_over_function-442387f2dbea2e48", "answer": "-\\frac{1}{2}\\ln\|x^{2}-8x-2\|+C", "kind": "staged-calculus", "family": "derivative_over_function"}] |

| AP / unit-4-comprehensive | 16 | numerical, lower_identity, back_substitution, radical, rectangle_circle, radicals_negative_powers, average_substitution_trig_exp_log, riemann, both_algebraic, linear_inner_trig_exp, table, quadratic_monomial, combined_rules, definite_log, cross_axis_line | [{"id": "u4K-sigma-numerical-quadratic-65398d3d245f0a5d", "answer": "-64", "kind": "staged-calculus", "family": "numerical"}] |

| AP / fundamental-theorem-of-calculus | 16 | lower_identity, upper_power, both_algebraic, upper_identity, upper_linear, lower_power, both_transcendental, upper_trig | [{"id": "u4N-ftc-lower_identity-94e6f628abbe0006", "answer": "-x^{3}+x^{2}", "kind": "staged-calculus", "family": "lower_identity"}] |

| AP / combining-integral-rules | 16 | linearity, interval_decomposition, combined_rules, reverse_limits, reversed_combination | [{"id": "u4N-rules-linearity-fcd5e9785b070366", "answer": "-68", "kind": "staged-calculus", "family": "linearity"}] |

| IM1-U2 / equivalent-expressions-combining-like-terms | 16 | constants, two_variables, three_groups, combine, multi, mixed_products, like_terms | [{"id": "u2-like-input-constants-[[-3,\"\"],[-4,\"x\"],[-9,\"\"],[-6,\"x\"]]", "answer": "\\(-10x - 12\\)", "kind": "polynomial", "family": "constants"}] |

| IM1-U2 / distributive-property | 16 | multiterm, two_groups, equivalent, basic, combine, three_groups, construct, negative, reverse | [{"id": "u2-dist-multi--5-4--3--1", "answer": "", "kind": "", "family": "multiterm"}] |

| IM1-U2 / solving-linear-equations | 16 | one_step, distribution, both_sides, identity, fraction_linear, two_step, both_distribute_unique, contradiction, fraction_x, fraction_expression | [{"id": "u2-equation-one_step-x - 6=-8", "answer": "\\(x=-2\\)", "kind": "equation", "family": "one_step"}] |

| IM1-U2 / solving-linear-inequalities | 16 | negative_flip, both_sides, compound, basic, distribution, creation | [{"id": "u2-ineq-flip-2--3--7-<--3 - 2x", "answer": "", "kind": "", "family": "negative_flip"}] |

| IM1-U2 / graphing-inequalities-interval-notation | 16 | solve_then_interval, ineq_to_graph, interval_to_ineq, ineq_to_interval, union | [{"id": "u2-int-solve-linear-3x - 9->--24", "answer": "\\((-5, \\infty)\\)", "kind": "interval", "family": "solve_then_interval"}] |

| IM1-U2 / coordinate-system-nine-key-features | 16 | increasing, constant, absolute_max, domain, decreasing, x_intercepts, absolute_min, range, y_intercept | [{"id": "u2-coord-increasing-{\"pts\":[[-5,0],[-1,0],[0,3],[4,1]],\"ends\":{\"leftEnd\":\"closed\",\"rightEnd\":\"infinite\",\"leftInfinity\":0,\"rightInfinity\":1}}", "answer": "", "kind": "", "family": "increasing"}] |

| IM1-U3 / identifying-arithmetic-sequences | 16 | identify | [{"id": "u3-01a--25_-23_-21_-19_-17", "answer": "Yes; \\(d=2\\)", "kind": "arithmetic-identification", "family": "identify"}] |

| IM1-U3 / common-difference-next-terms | 16 | next_terms | [{"id": "u3-01b--20--13", "answer": "\\(d=-13\\); next terms: -72, -85, -98", "kind": "multi", "family": "next_terms"}] |

| IM1-U3 / explicit-formulas-arithmetic-sequences | 16 | from_values, from_sequence | [{"id": "u3-01c-0--8--12", "answer": "\\(a_n=-8 - 12(n-1)\\)", "kind": "formula", "family": "from_values"}] |

| IM1-U3 / finding-a-specific-term | 16 | specific_term | [{"id": "u3-01d--9--8-19", "answer": "\\(-153\\)", "kind": "input", "family": "specific_term"}] |

| IM1-U3 / finding-the-term-number | 16 | term_number | [{"id": "u3-01e-1--11-22", "answer": "\\(22\\)", "kind": "input", "family": "term_number"}] |

| IM1-U3 / arithmetic-sequence-word-problems | 16 | model | [{"id": "u3-01f-seats-17-3-13", "answer": "\\(a_n=17 + 3(n-1)\\); 53 seats", "kind": "multi", "family": "model"}] |

| IM1-U3 / evaluating-functions | 16 | linear, quadratic | [{"id": "u3-02a-l--5--4--7", "answer": "\\(31\\)", "kind": "input", "family": "linear"}] |

| IM1-U3 / solving-function-equations | 16 | solve | [{"id": "u3-02b--6-3-15", "answer": "\\(-2\\)", "kind": "input", "family": "solve"}] |

| IM1-U3 / slope-from-two-points | 16 | two_points | [{"id": "u3-02c--2--5-0--12", "answer": "\\(-\\frac{7}{2}\\)", "kind": "input", "family": "two_points"}] |

| IM1-U3 / collinearity-and-slope | 16 | collinearity | [{"id": "u3-02d--3_-4_-1_-10_1_-16", "answer": "Yes", "kind": "mc", "family": "collinearity"}] |

| IM1-U3 / slope-from-graphs | 16 | graph | [{"id": "u3-02e--1-0-3-4", "answer": "\\(1\\)", "kind": "input", "family": "graph"}] |

| IM1-U3 / slope-intercept-form | 16 | identify, write | [{"id": "u3-03a-id--4-1", "answer": "Slope \\(-4\\); y-intercept \\((0,1)\\)", "kind": "multi", "family": "identify"}] |

| IM1-U3 / writing-equations-of-lines | 16 | slope_intercept_points, point_slope_given, point_slope_points | [{"id": "u3-03b-si--3--8-2", "answer": "\\(y=-3x - 8\\)", "kind": "multi", "family": "slope_intercept_points"}] |

| IM1-U3 / converting-point-slope-to-slope-intercept | 16 | convert | [{"id": "u3-03c--4-1--5", "answer": "\\(y=-4x - 1\\)", "kind": "multi", "family": "convert"}] |

| IM1-U3 / linear-function-word-problems | 16 | model | [{"id": "u3-03d-10-8-6-hours", "answer": "\\(f(x)=8x + 10\\); $58", "kind": "multi", "family": "model"}] |

| IM1-U3 / recursive-formulas-from-sequences | 16 | terms, difference, write | [{"id": "u3-04a-terms--9--10", "answer": "\\(-9, -19, -29, -39, -49, -59\\)", "kind": "multi", "family": "terms"}] |

| IM1-U3 / recursive-to-explicit-formulas | 16 | convert | [{"id": "u3-04b--6--9", "answer": "\\(a_n=-6 - 9(n-1)\\)", "kind": "formula", "family": "convert"}] |

| IM1-U3 / common-difference-recursive-formulas | 16 | missing_difference | [{"id": "u3-04c--8--8-8", "answer": "\\(d=-8\\); \\(a_1=-8\\); \\(a_n=a_{n-1} - 8\\)", "kind": "multi", "family": "missing_difference"}] |

| IM1-U3 / section-a-review | 16 | next_terms, specific_term, term_number, identify, from_values, model, from_sequence | [{"id": "u3-01b--40-2", "answer": "\\(d=2\\); next terms: -32, -30, -28", "kind": "multi", "family": "next_terms"}] |

| IM1-U3 / section-b-review | 16 | solve, two_points, graph, quadratic, collinearity, linear | [{"id": "u3-02b-3--9--36", "answer": "\\(-9\\)", "kind": "input", "family": "solve"}] |

| IM1-U3 / section-c-review | 16 | slope_intercept_points, convert, model, write, point_slope_points, identify, point_slope_given | [{"id": "u3-03b-si-2--1--6", "answer": "\\(y=2x - 1\\)", "kind": "multi", "family": "slope_intercept_points"}] |

| IM1-U3 / section-d-review | 16 | write, convert, missing_difference, terms, difference | [{"id": "u3-04a-write--23-2", "answer": "\\(a_1=-23,\\quad a_n=a_{n-1} + 2\\)", "kind": "multi", "family": "write"}] |

| IM1-U3 / unit-3-comprehensive-review | 16 | term_number, collinearity, model, next_terms, linear, identify, convert, specific_term, two_points, graph, write, from_values, solve | [{"id": "u3-01e--16-2-13", "answer": "\\(13\\)", "kind": "input", "family": "term_number"}] |

## Page-route ledger

This includes alternate drills and nonstandard pages; listed routes are not automatically distinct mathematical factories. Unit 1 HTML `limits` routes must pass through `contextualMode()` before selecting a final pad. A false `BMUnit1UI.render` flag does not mean that no Unit 1 parsing helper is used.

| Course/unit/page | Source | Slug | Static keypad attribute | Loads calculus keypad | Calls Unit 1 renderer |

| --- | --- | --- | --- | --- | --- |

| AP Calculus AB/unit-1-limits-continuity/Indeterminate Limits Practice | `ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/practice/index.html` | basic-techniques-indeterminate-limits | limits | True | False |

| AP Calculus AB/unit-1-limits-continuity/Comprehensive Review Practice | `ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html` | comprehensive-review | limits | True | False |

| AP Calculus AB/unit-1-limits-continuity/Intermediate Value Theorem Practice | `ap-calculus/unit-1-limits-continuity/topics/intermediate-value-theorem/practice/index.html` | intermediate-value-theorem |  | False | False |

| AP Calculus AB/unit-1-limits-continuity/Classifying Discontinuities Practice | `ap-calculus/unit-1-limits-continuity/topics/introduction-to-continuity/practice/index.html` | introduction-to-continuity |  | False | False |

| AP Calculus AB/unit-1-limits-continuity/Introduction to Limits Practice | `ap-calculus/unit-1-limits-continuity/topics/introduction-to-limits/practice/index.html` | introduction-to-limits |  | False | False |

| AP Calculus AB/unit-1-limits-continuity/Limits at Infinity Practice | `ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/practice/index.html` | limits-at-infinity | limits | True | True |

| AP Calculus AB/unit-1-limits-continuity/Limits of Continuous Functions Practice | `ap-calculus/unit-1-limits-continuity/topics/limits-of-continuous-functions/practice/index.html` | limits-of-continuous-functions | limits | True | False |

| AP Calculus AB/unit-1-limits-continuity/One-Sided Limits Practice | `ap-calculus/unit-1-limits-continuity/topics/one-sided-limits/practice/index.html` | one-sided-limits | limits | True | False |

| AP Calculus AB/unit-1-limits-continuity/sin(1/x) Practice | `ap-calculus/unit-1-limits-continuity/topics/sin-one-over-x/practice/index.html` | sin-one-over-x |  | False | False |

| AP Calculus AB/unit-1-limits-continuity/Course Assignment Limits Practice | `ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/course-practice/index.html` | squeeze-course-practice |  | False | False |

| AP Calculus AB/unit-1-limits-continuity/Advanced Trigonometric Limits Practice | `ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/practice/index.html` | squeeze-theorem-trigonometric-limits |  | False | False |

| AP Calculus AB/unit-2-derivatives/Derivative Conceptual &amp; AP-Style Practice | `ap-calculus/unit-2-derivatives/topics/comprehensive-review/conceptual-practice/index.html` | derivatives-conceptual-review |  | False | False |

| AP Calculus AB/unit-2-derivatives/Finding Derivatives at a Point Practice | `ap-calculus/unit-2-derivatives/topics/comprehensive-review/derivatives-at-a-point-practice/index.html` | derivatives-at-a-point-practice | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Derivatives Practice | `ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html` | comprehensive-review | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Derivatives of Inverse Functions Practice | `ap-calculus/unit-2-derivatives/topics/derivatives-of-inverse-functions/practice/index.html` | derivatives-of-inverse-functions | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Logarithmic Derivative at a Point Practice | `ap-calculus/unit-2-derivatives/topics/derivatives-of-logarithmic-functions/derivative-at-a-point-practice/index.html` | derivative-at-a-point-practice | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Derivatives of Logarithmic Functions Practice | `ap-calculus/unit-2-derivatives/topics/derivatives-of-logarithmic-functions/practice/index.html` | derivatives-of-logarithmic-functions | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Trigonometric Derivatives at a Point Practice | `ap-calculus/unit-2-derivatives/topics/derivatives-of-trigonometric-functions/derivative-at-a-point-practice/index.html` | derivative-at-a-point-practice | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Derivatives of Trigonometric Functions Practice | `ap-calculus/unit-2-derivatives/topics/derivatives-of-trigonometric-functions/practice/index.html` | derivatives-of-trigonometric-functions | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Power Rule Derivative at a Point Practice | `ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/derivative-at-a-point-practice/index.html` | derivative-at-a-point-practice | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Derivatives with the Power Rule Practice | `ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/index.html` | derivatives-with-the-power-rule | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Difference Quotient Practice | `ap-calculus/unit-2-derivatives/topics/difference-quotient/practice/index.html` | difference-quotient |  | False | False |

| AP Calculus AB/unit-2-derivatives/Exponential Derivative at a Point Practice | `ap-calculus/unit-2-derivatives/topics/exponential-functions/derivative-at-a-point-practice/index.html` | derivative-at-a-point-practice | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Exponential Functions Practice | `ap-calculus/unit-2-derivatives/topics/exponential-functions/practice/index.html` | exponential-functions | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Implicit Derivative at a Point Practice | `ap-calculus/unit-2-derivatives/topics/implicit-differentiation/derivative-at-a-point-practice/index.html` | derivative-at-a-point-practice | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Implicit Differentiation Practice | `ap-calculus/unit-2-derivatives/topics/implicit-differentiation/practice/index.html` | implicit-differentiation | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Inverse Trigonometric Derivative at a Point Practice | `ap-calculus/unit-2-derivatives/topics/inverse-trigonometric-functions/derivative-at-a-point-practice/index.html` | derivative-at-a-point-practice | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Inverse Trigonometric Functions Practice | `ap-calculus/unit-2-derivatives/topics/inverse-trigonometric-functions/practice/index.html` | inverse-trigonometric-functions | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Logarithmic Differentiation Practice | `ap-calculus/unit-2-derivatives/topics/logarithmic-differentiation/practice/index.html` | logarithmic-differentiation | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Chain Rule Derivative at a Point Practice | `ap-calculus/unit-2-derivatives/topics/the-chain-rule/derivative-at-a-point-practice/index.html` | derivative-at-a-point-practice | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Nested Chain Rule Practice | `ap-calculus/unit-2-derivatives/topics/the-chain-rule/nested-chain-rule-practice/index.html` | nested-chain-rule-practice | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/The Chain Rule Practice | `ap-calculus/unit-2-derivatives/topics/the-chain-rule/practice/index.html` | the-chain-rule | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Product Rule Derivative at a Point Practice | `ap-calculus/unit-2-derivatives/topics/the-product-rule/derivative-at-a-point-practice/index.html` | derivative-at-a-point-practice | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/The Product Rule Practice | `ap-calculus/unit-2-derivatives/topics/the-product-rule/practice/index.html` | the-product-rule | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/Quotient Rule Derivative at a Point Practice | `ap-calculus/unit-2-derivatives/topics/the-quotient-rule/derivative-at-a-point-practice/index.html` | derivative-at-a-point-practice | derivative | True | False |

| AP Calculus AB/unit-2-derivatives/The Quotient Rule Practice | `ap-calculus/unit-2-derivatives/topics/the-quotient-rule/practice/index.html` | the-quotient-rule | derivative | True | False |

| AP Calculus AB/unit-3-applications-derivative/Extrema &amp; Extreme Value Theorem Practice | `ap-calculus/unit-3-applications-derivative/topics/absolute-and-local-extrema-and-the-extreme-value-theorem/practice/index.html` | absolute-and-local-extrema-and-the-extreme-value-theorem |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Unit 3 Non-Calculator Mixed Practice | `ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/assignment-practice/index.html` | assignment-practice |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Unit 3 Calculator Mixed Practice | `ap-calculus/unit-3-applications-derivative/topics/comprehensive-review/calculator-practice/index.html` | calculator-practice |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Equations of Tangent and Normal Lines Practice | `ap-calculus/unit-3-applications-derivative/topics/equations-of-tangent-and-normal-lines/practice/index.html` | equations-of-tangent-and-normal-lines |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Horizontal and Vertical Tangent Lines Practice | `ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines/practice/index.html` | horizontal-and-vertical-tangent-lines |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Implicit Tangent Lines Calculator Practice | `ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines-implicitly/calculator-practice/index.html` | horizontal-and-vertical-tangent-lines-implicitly |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Implicit Tangent Lines Practice | `ap-calculus/unit-3-applications-derivative/topics/horizontal-and-vertical-tangent-lines-implicitly/practice/index.html` | horizontal-and-vertical-tangent-lines-implicitly |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Derivative Analysis Calculator Practice | `ap-calculus/unit-3-applications-derivative/topics/increasing-decreasing-intervals-concavity-and-extrema/calculator-practice/index.html` | increasing-decreasing-intervals-concavity-and-extrema |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Increasing, Decreasing &amp; Concavity Practice | `ap-calculus/unit-3-applications-derivative/topics/increasing-decreasing-intervals-concavity-and-extrema/practice/index.html` | increasing-decreasing-intervals-concavity-and-extrema |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/L'Hopital's Rule Practice | `ap-calculus/unit-3-applications-derivative/topics/l-hopital-s-rule/practice/index.html` | l-hopital-s-rule |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Linearization and Differentials Practice | `ap-calculus/unit-3-applications-derivative/topics/linearization-and-differentials/practice/index.html` | linearization-and-differentials |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Motion Calculator Practice | `ap-calculus/unit-3-applications-derivative/topics/motion/calculator-practice/index.html` | motion |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Motion Non-Calculator Practice | `ap-calculus/unit-3-applications-derivative/topics/motion/practice/index.html` | motion |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Newton's Method Calculator Practice | `ap-calculus/unit-3-applications-derivative/topics/newton-s-method-for-approximating-roots-of-a-function/practice/index.html` | newton-s-method-for-approximating-roots-of-a-function |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Optimization Calculator Practice | `ap-calculus/unit-3-applications-derivative/topics/optimization/calculator-practice/index.html` | optimization |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Optimization Non-Calculator Practice | `ap-calculus/unit-3-applications-derivative/topics/optimization/practice/index.html` | optimization |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Related Rates Calculator Practice | `ap-calculus/unit-3-applications-derivative/topics/related-rates/calculator-practice/index.html` | related-rates |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Related Rates Non-Calculator Practice | `ap-calculus/unit-3-applications-derivative/topics/related-rates/practice/index.html` | related-rates |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Rolle &amp; Mean Value Theorems Practice | `ap-calculus/unit-3-applications-derivative/topics/rolle-s-theorem-and-the-mean-value-theorem/practice/index.html` | rolle-s-theorem-and-the-mean-value-theorem |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Tangent and Secant Line Approximations Practice | `ap-calculus/unit-3-applications-derivative/topics/tangent-and-secant-line-approximations/practice/index.html` | tangent-and-secant-line-approximations |  | True | False |

| AP Calculus AB/unit-3-applications-derivative/Using Your Graphing Calculator Practice | `ap-calculus/unit-3-applications-derivative/topics/using-your-graphing-calculator/practice/index.html` | using-your-graphing-calculator |  | True | False |

| AP Calculus AB/unit-4-integrals/Basic Integrals Practice | `ap-calculus/unit-4-integrals/topics/basic-integrals/practice/index.html` | basic-integrals |  | True | False |

| AP Calculus AB/unit-4-integrals/Integral Concepts &amp; Numerical Methods Review | `ap-calculus/unit-4-integrals/topics/comprehensive-review/assignment-practice/index.html` | assignment-practice |  | False | False |

| AP Calculus AB/unit-4-integrals/Unit 4 Comprehensive Review Practice | `ap-calculus/unit-4-integrals/topics/comprehensive-review/practice/index.html` | unit-4-comprehensive |  | True | False |

| AP Calculus AB/unit-4-integrals/Definite Integrals from Sums Practice | `ap-calculus/unit-4-integrals/topics/evaluating-definite-integrals-with-a-limit-and-summation/practice/index.html` | evaluating-definite-integrals-with-a-limit-and-summation |  | True | False |

| AP Calculus AB/unit-4-integrals/Combining Integral Rules Practice | `ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/integral-rules-practice/index.html` | combining-integral-rules |  | True | False |

| AP Calculus AB/unit-4-integrals/Fundamental Theorem &amp; Integral Rules Practice | `ap-calculus/unit-4-integrals/topics/fundamental-theorem-of-calculus-and-integral-rules/practice/index.html` | fundamental-theorem-of-calculus |  | True | False |

| AP Calculus AB/unit-4-integrals/Integrals Resulting in Natural Log Practice | `ap-calculus/unit-4-integrals/topics/integrals-resulting-in-natural-log-and-inverse-trigonometric-functions/practice/index.html` | integrals-resulting-in-natural-log-and-inverse-trigonometric-functions |  | True | False |

| AP Calculus AB/unit-4-integrals/Integrals Using Geometry Practice | `ap-calculus/unit-4-integrals/topics/integrals-using-geometry/practice/index.html` | integrals-using-geometry |  | True | False |

| AP Calculus AB/unit-4-integrals/Introduction to Sigma Notation Practice | `ap-calculus/unit-4-integrals/topics/introduction-to-sigma-notation/practice/index.html` | introduction-to-sigma-notation |  | True | False |

| AP Calculus AB/unit-4-integrals/Mean Value Theorem for Integrals Practice | `ap-calculus/unit-4-integrals/topics/mean-value-theorem-for-integrals/practice/index.html` | mean-value-theorem-for-integrals |  | True | False |

| AP Calculus AB/unit-4-integrals/Rectangular Approximations Practice | `ap-calculus/unit-4-integrals/topics/rectangular-approximations/practice/index.html` | rectangular-approximations |  | True | False |

| AP Calculus AB/unit-4-integrals/Trapezoidal Approximations Practice | `ap-calculus/unit-4-integrals/topics/trapezoidal-approximations/practice/index.html` | trapezoidal-approximations |  | True | False |

| AP Calculus AB/unit-4-integrals/U-Substitution Integrals Practice | `ap-calculus/unit-4-integrals/topics/u-substitution-integrals/practice/index.html` | u-substitution-integrals |  | True | False |

| AP Calculus AB/unit-5-differential-equations/Basic First-Order DEs Calculator Practice | `ap-calculus/unit-5-differential-equations/topics/basic-first-order-differential-equations/calculator-practice/index.html` | basic-first-order-differential-equations |  | True | False |

| AP Calculus AB/unit-5-differential-equations/Basic First-Order DEs Non-Calculator Practice | `ap-calculus/unit-5-differential-equations/topics/basic-first-order-differential-equations/non-calculator-practice/index.html` | basic-first-order-differential-equations |  | True | False |

| AP Calculus AB/unit-5-differential-equations/Differential Equations Calculator Review | `ap-calculus/unit-5-differential-equations/topics/comprehensive-review/calculator-practice/index.html` | unit5-comprehensive-review |  | True | False |

| AP Calculus AB/unit-5-differential-equations/Differential Equations Non-Calculator Review | `ap-calculus/unit-5-differential-equations/topics/comprehensive-review/non-calculator-practice/index.html` | unit5-comprehensive-review |  | True | False |

| AP Calculus AB/unit-5-differential-equations/Growth, Decay and Newton's Law Practice | `ap-calculus/unit-5-differential-equations/topics/exponential-growth-and-decay-interest-newton-s-law-of-cooling/practice/index.html` | exponential-growth-and-decay-interest-newton-s-law-of-cooling |  | True | False |

| AP Calculus AB/unit-5-differential-equations/Motion Problems Calculator Practice | `ap-calculus/unit-5-differential-equations/topics/motion-problems/calculator-practice/index.html` | motion-problems |  | True | False |

| AP Calculus AB/unit-5-differential-equations/Motion Problems Non-Calculator Practice | `ap-calculus/unit-5-differential-equations/topics/motion-problems/non-calculator-practice/index.html` | motion-problems |  | True | False |

| AP Calculus AB/unit-5-differential-equations/Rate Problems Calculator Practice | `ap-calculus/unit-5-differential-equations/topics/rate-problems/calculator-practice/index.html` | rate-problems |  | True | False |

| AP Calculus AB/unit-5-differential-equations/Rate Problems Non-Calculator Practice | `ap-calculus/unit-5-differential-equations/topics/rate-problems/non-calculator-practice/index.html` | rate-problems |  | True | False |

| AP Calculus AB/unit-5-differential-equations/Separable Differential Equations Practice | `ap-calculus/unit-5-differential-equations/topics/separable-differential-equations/practice/index.html` | separable-differential-equations |  | True | False |

| AP Calculus AB/unit-5-differential-equations/Slope Fields Practice | `ap-calculus/unit-5-differential-equations/topics/slope-fields/practice/index.html` | slope-fields |  | True | False |

| Integrated Math 1/unit-1-review/Unit 1 Practice | `im1/unit-1-review/practice/index.html` | unit-1-review |  | False | False |

| Integrated Math 1/unit-1-review/Integer Addition &amp; Subtraction Practice | `im1/unit-1-review/topics/adding-and-subtracting-negative-numbers/practice/index.html` | adding-and-subtracting-negative-numbers | integer | False | False |

| Integrated Math 1/unit-1-review/Classifying Numbers Practice | `im1/unit-1-review/topics/classifying-numbers/practice/index.html` | classifying-numbers |  | False | False |

| Integrated Math 1/unit-1-review/Decimals Practice | `im1/unit-1-review/topics/decimals/practice/index.html` | decimals | decimal | False | False |

| Integrated Math 1/unit-1-review/Fractions Practice | `im1/unit-1-review/topics/fractions/practice/index.html` | fractions | fraction | False | False |

| Integrated Math 1/unit-1-review/Multiplication Practice | `im1/unit-1-review/topics/multiplication/practice/index.html` | multiplication | digits | False | False |

| Integrated Math 1/unit-1-review/Integer Multiplication &amp; Division Practice | `im1/unit-1-review/topics/multiplying-and-dividing-negative-numbers/practice/index.html` | multiplying-and-dividing-negative-numbers | integer | False | False |

| Integrated Math 1/unit-1-review/Order of Operations Practice | `im1/unit-1-review/topics/order-of-operations/practice/index.html` | order-of-operations | integer | False | False |

| Integrated Math 1/unit-1-review/Percents Practice | `im1/unit-1-review/topics/percents/practice/index.html` | percents | decimal | False | False |

| Integrated Math 1/unit-1-review/Reducing Fractions Practice | `im1/unit-1-review/topics/reducing-fractions/practice/index.html` | reducing-fractions | fraction | False | False |

| Integrated Math 1/unit-1-review/Exponents &amp; Radicals Practice | `im1/unit-1-review/topics/square-roots-and-exponents/practice/index.html` | square-roots-and-exponents | integer | False | False |

| Integrated Math 1/unit-2-algebraic-operations-equations-inequalities/Unit 2 Comprehensive Review Practice | `im1/unit-2-algebraic-operations-equations-inequalities/topics/comprehensive-review/practice/index.html` | comprehensive-review |  | False | False |

| Integrated Math 1/unit-2-algebraic-operations-equations-inequalities/Coordinate System and Nine Key Features Practice | `im1/unit-2-algebraic-operations-equations-inequalities/topics/coordinate-system-nine-key-features/practice/index.html` | coordinate-system-nine-key-features |  | False | False |

| Integrated Math 1/unit-2-algebraic-operations-equations-inequalities/Distributive Property Practice | `im1/unit-2-algebraic-operations-equations-inequalities/topics/distributive-property/practice/index.html` | distributive-property |  | False | False |

| Integrated Math 1/unit-2-algebraic-operations-equations-inequalities/Combining Like Terms Practice | `im1/unit-2-algebraic-operations-equations-inequalities/topics/equivalent-expressions-combining-like-terms/practice/index.html` | equivalent-expressions-combining-like-terms |  | False | False |

| Integrated Math 1/unit-2-algebraic-operations-equations-inequalities/Graphing Inequalities and Interval Notation Practice | `im1/unit-2-algebraic-operations-equations-inequalities/topics/graphing-inequalities-interval-notation/practice/index.html` | graphing-inequalities-interval-notation |  | False | False |

| Integrated Math 1/unit-2-algebraic-operations-equations-inequalities/Solving Linear Equations Practice | `im1/unit-2-algebraic-operations-equations-inequalities/topics/solving-linear-equations/practice/index.html` | solving-linear-equations |  | False | False |

| Integrated Math 1/unit-2-algebraic-operations-equations-inequalities/Solving Linear Inequalities Practice | `im1/unit-2-algebraic-operations-equations-inequalities/topics/solving-linear-inequalities/practice/index.html` | solving-linear-inequalities |  | False | False |

| Integrated Math 1/unit-3-linear-equation/Arithmetic Sequence Word Problems Practice | `im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/arithmetic-sequence-word-problems/practice/index.html` | arithmetic-sequence-word-problems |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Common Difference and Next Terms Practice | `im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/common-difference-next-terms/practice/index.html` | common-difference-next-terms |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Explicit Formulas for Arithmetic Sequences Practice | `im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/explicit-formulas-arithmetic-sequences/practice/index.html` | explicit-formulas-arithmetic-sequences |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Finding a Specific Term Practice | `im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/finding-a-specific-term/practice/index.html` | finding-a-specific-term |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Finding the Term Number Practice | `im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/finding-the-term-number/practice/index.html` | finding-the-term-number |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Identifying Arithmetic Sequences Practice | `im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/identifying-arithmetic-sequences/practice/index.html` | identifying-arithmetic-sequences |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Section A Review Practice | `im1/unit-3-linear-equation/topics/a-arithmetic-sequences-and-arithmetic-progression-models/section-a-review/practice/index.html` | section-a-review |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Collinearity and Slope Practice | `im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/collinearity-and-slope/practice/index.html` | collinearity-and-slope |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Evaluating Functions Practice | `im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/evaluating-functions/practice/index.html` | evaluating-functions |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Section B Review Practice | `im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/section-b-review/practice/index.html` | section-b-review |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Slope from Graphs Practice | `im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/slope-from-graphs/practice/index.html` | slope-from-graphs |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Slope from Two Points Practice | `im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/slope-from-two-points/practice/index.html` | slope-from-two-points |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Solving Function Equations Practice | `im1/unit-3-linear-equation/topics/b-functions-function-notation-and-slope/solving-function-equations/practice/index.html` | solving-function-equations |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Point-Slope to Slope-Intercept Practice | `im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/converting-point-slope-to-slope-intercept/practice/index.html` | converting-point-slope-to-slope-intercept |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Linear Function Word Problems Practice | `im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/linear-function-word-problems/practice/index.html` | linear-function-word-problems |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Section C Review Practice | `im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/section-c-review/practice/index.html` | section-c-review |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Slope-Intercept Form Practice | `im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/slope-intercept-form/practice/index.html` | slope-intercept-form |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Writing Equations of Lines Practice | `im1/unit-3-linear-equation/topics/c-slope-intercept-form-and-point-slope-form/writing-equations-of-lines/practice/index.html` | writing-equations-of-lines |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Unit 3 Comprehensive Review Practice | `im1/unit-3-linear-equation/topics/comprehensive-review/practice/index.html` | unit-3-comprehensive-review |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Common Difference and Recursive Formulas Practice | `im1/unit-3-linear-equation/topics/d-recursive-formulas-for-linear-relationships/common-difference-recursive-formulas/practice/index.html` | common-difference-recursive-formulas |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Recursive Formulas from Sequences Practice | `im1/unit-3-linear-equation/topics/d-recursive-formulas-for-linear-relationships/recursive-formulas-from-sequences/practice/index.html` | recursive-formulas-from-sequences |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Recursive to Explicit Formulas Practice | `im1/unit-3-linear-equation/topics/d-recursive-formulas-for-linear-relationships/recursive-to-explicit-formulas/practice/index.html` | recursive-to-explicit-formulas |  | True | False |

| Integrated Math 1/unit-3-linear-equation/Section D Review Practice | `im1/unit-3-linear-equation/topics/d-recursive-formulas-for-linear-relationships/section-d-review/practice/index.html` | section-d-review |  | True | False |

| Calculus Prep/Topic collection/Algebra for Calculus | `calculus-prep/calculus-algebra/index.html` | calculus-algebra |  | False | False |

| Calculus Prep/Topic collection/Function Domains | `calculus-prep/domains/index.html` | domains |  | False | False |

| Calculus Prep/Topic collection/Function Graphs | `calculus-prep/function-graphs/index.html` | function-graphs |  | False | False |

| Calculus Prep/Topic collection/Logarithm Rules | `calculus-prep/log-rules/index.html` | log-rules |  | False | False |

| Calculus Prep/Topic collection/Rational Function Analysis | `calculus-prep/rational-functions/index.html` | rational-functions |  | False | False |

| Calculus Prep/Topic collection/Special Factoring | `calculus-prep/special-factoring/index.html` | special-factoring |  | False | False |

| Calculus Prep/Topic collection/Synthetic Division &amp; Rational Root Theorem | `calculus-prep/synthetic-division/index.html` | synthetic-division |  | False | False |

| Calculus Prep/Topic collection/Trig Angle Skills | `calculus-prep/trig-angle-skills/index.html` | trig-angle-skills |  | False | False |

| Calculus Prep/Topic collection/Trigonometric Equations | `calculus-prep/trig-equations/index.html` | trig-equations |  | False | False |

| Calculus Prep/Topic collection/Trigonometric Identities | `calculus-prep/trig-identities/index.html` | trig-identities |  | False | False |

| Calculus Prep/unit-circle-values/Unit Circle Exact Values | `calculus-prep/unit-circle-values/index.html` | unit-circle-values |  | False | False |

## Excluded redirects

- `ap-calculus/unit-5-differential-equations/topics/basic-first-order-differential-equations/practice/index.html`

- `ap-calculus/unit-5-differential-equations/topics/comprehensive-review/assignment-practice/index.html`

- `ap-calculus/unit-5-differential-equations/topics/motion-problems/practice/index.html`

- `ap-calculus/unit-5-differential-equations/topics/rate-problems/practice/index.html`

Unit 6 is deliberately excluded. The route ledger may include navigation/landing false positives: those rows remain unresolved and must not be counted as verified engines. Registry entries without a current reachable page are evidence of code, not proof of a live student route.

## Reproduce

Run `python3 tools/mathlive-keypad-audit/report.py` from a Git checkout at this audit snapshot. It executes only focused VM sampling and writes this audit directory. The page scanner uses static HTML/config inspection, not a browser. No claim is made that every select-option family or calculator variant was exercised.


## Sitewide migration — verified Batch 1B

18 Unit 2 typed-answer routes now use MathLive by default. The route/field/profile checklist, actual generator families, keypad corrections and verification limits are recorded in [BATCH-1B.md](../mathlive-migration/BATCH-1B.md). Matching matrix records are updated; unrelated provisional records remain provisional. Legacy grading fixes were committed separately as `3c88dac`; see [MATH-CORRECTIONS.md](../mathlive-migration/MATH-CORRECTIONS.md).


## Sitewide migration — verified Batch 2

Remaining Unit 4/5 topic fields use separate expression, rounded, list and interval contracts. Source/checker-based corrections and the 15-route checklist are in [BATCH-2.md](../mathlive-migration/BATCH-2.md). Matching matrix rows are updated; review/assignment and unrelated provisional rows stay pending. No grader or generator changed.

## Sitewide migration — verified Batch 3

Nineteen Unit 3 topic routes now use field-specific MathLive contracts. 19 matching matrix records updated. See [BATCH-3.md](../mathlive-migration/BATCH-3.md) for verification and retained specialized controls. Reviews remain pending. No generator, renderer or grader changed.

## Sitewide migration — verified Batch 4

Seven Unit 1 mathematical routes converted; three choice-only routes retained. 10 matching matrix records updated. [BATCH-4.md](../mathlive-migration/BATCH-4.md) records controls, bounded generator evidence, browser tests and the separately committed precedence correction. Comprehensive review remains pending.

## Sitewide migration — verified Batch 5

Twelve IM1 Units 1/2 typed routes converted; four specialized topic interfaces retained. 18 matrix records updated. [BATCH-5.md](../mathlive-migration/BATCH-5.md) records original form gates, profiles, 9,300 questions / 58,378 comparisons, browser/recovery evidence and the legacy MathJax speech limitation. Video/notes/headings/navigation are unchanged. Reviews remain pending.

## Sitewide migration Batch 6 verified update

Seventeen IM1 Unit 3 typed topic routes now use verified per-field MathLive profiles; Collinearity remains Yes/No. 31 matching matrix records updated. Numeric/fraction, initial-term, recursive-rule, explicit-formula and line contracts preserve original checkers. See [BATCH-6.md](../mathlive-migration/BATCH-6.md), generator/checker evidence and real Chromium artifacts. Section/comprehensive review records remain unresolved until Batch 8; arbitrary alternative identities and physical-device certification are not claimed.

## Sitewide migration Batch 7 verified update

Six Calculus Prep typed engines converted; five specialized selection engines retained. 17 existing matrix rows verified/updated; a separate coordinate-pair record added for the previously omitted Trig Angle Skills field type. See [BATCH-7.md](../mathlive-migration/BATCH-7.md) for actual contracts, dynamic keypad distinctions, two separately committed source corrections and retained deterministic/browser evidence. Unit Circle remains comma-free; equation/list engines retain needed comma. No arbitrary-identity or physical-device certification claim.

## Batch 8 checkpoint A1

Unit 1/2 comprehensive review numerical, multipart/location and symbolic fields verified with per-category/part profiles; 2 original matrix rows updated. Difference Quotient requires h (separate source correction and opt-in adapter). See [BATCH-8.md](../mathlive-migration/BATCH-8.md). Other review records and final field-level reconciliation remain pending.

## Batch 8 AP review verification

Review profile selection is by actual generated part, using `review-contracts.mjs`, rather than a whole-review integral/derivative pad. Unit 3 calculator literals remain separate from exact equations/lists/intervals; Unit 4 Newton construction retains structural sum/limit controls, while value/sigma-result fields use numerical or n-expression profiles; C remains part-specific. Unit 5 retains its exact/rounded/function/list/interval dispatch. `reviews-dynamic-node.json` records 9,060 questions, 10,085 typed parts and 42,258 checker comparisons. See BATCH-8.md for browser evidence and limits.

The slope-field board's optional typed-entry paths are separately inventoried: fractions/decimals/Undefined for slopes; decimals for curve y-values (the original Number-based parser rejects fraction expressions). Their existing input listeners and graphical graders are retained. The shared native bridge has an optional source-input notification for these paths; it does not evaluate expressions or alter unrelated contracts.
