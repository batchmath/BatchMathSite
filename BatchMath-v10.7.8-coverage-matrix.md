# BatchMath v10.7.8 Coverage Matrix

| Requirement | Stable family IDs | Seeded coverage | Expected result / invariant |
|---|---|---:|---|
| Raw sine/cosine unbounded phase | `sin_one_over_x_raw_sine`, `sin_one_over_x_raw_cosine` | 250 each | DNE by persistent oscillation |
| Absolute-value oscillation | `sin_one_over_x_absolute_sine`, `sin_one_over_x_absolute_cosine` | 250 each | DNE using approaches near 0 and 1 |
| Vanishing amplitudes | `sin_one_over_x_vanishing_*` | 250 each | 0 by squeeze |
| Nonzero amplitudes | `sin_one_over_x_nonzero_exponential`, `sin_one_over_x_nonzero_affine` | 250 each | DNE by two approaches |
| Inconclusive bounds | `sin_one_over_x_bounds_inconclusive` | 250 | Bounds alone do not decide; separate oscillation proves DNE |
| `sin(x)/x` contrast | `sin_one_over_x_sinx_over_x_contrast` | 250 | 1 versus DNE |
| Original absolute-value forms | `one_sided_absolute_legacy_*` | >1,000 each | Preserved |
| New absolute-value structures | `one_sided_absolute_reversed_sign`, `_coefficient`, `_product_cancellation` | >1,000 each | Side sign independently verified |
| Original rational pole forms | `one_sided_rational_legacy_*` | >900 each | Preserved; signed infinity verified |
| Expanded rational behavior | `one_sided_rational_nonconstant_numerator`, `_repeated_factors`, `_removable`, `_cancellation_leaves_pole` | >900 each | Factor signs/cancellation independently verified |
| Piecewise side/two-sided limits | `one_sided_piecewise_left/right/two_sided` | >2,000 each | Branch values and matching condition verified |
| Domain endpoints | `one_sided_endpoint_*` | >300 each | Admissible side, missing side, and two-sided convention verified |
| Same-function progression | `one_sided_*_linked_left/right/two_sided` | 1,600 sequences | All three parts retain identical stored function data |
| Mixed balance | focus metadata | 100,000 | Each focus 24–26%; positive/negative rational infinity 47–53% |

No source-material conflict was found for sections 6–7.

