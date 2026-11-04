# Separate mathematical corrections before Batch 1B

Source: `adae2a2b00580f29befba88f593f4f627e2850c5`. These defects reproduce with the legacy editor; neither correction changes the MathLive adapter or equivalence tolerances.

1. **Inverse-trig topic, cumulative Product/Quotient factors:** the reachable factor catalogue includes all six inverse functions, but this page's lexer/evaluator omitted them. Example `pa-wide-atan2-log5_q4_3_13` rejects its own stored derivative of `atan(x/2)*log_5(x^4+3x^2+13)`. Add only the six missing lexer names and their standard evaluations, following the already working Product/Quotient engines. Wrong answers remain rejected.
2. **Comprehensive derivative-at-a-point, base-polynomial exponential:** `base-polynomial-2-2-6--2` stores `2*2^2*ln(2)` correctly but displays `22^2 ln(2)`. Group the numerical exponential factor before appending the coefficient. The function, stored answer, distribution and checker remain unchanged.

`node --test tools/mathlive-sitewide/math-corrections.test.mjs` failed both tests before correction, then passed both. The first covers reachable cumulative inverse-factor combinations; the second samples 100 deterministic exponential generations over several bases, exponents and coefficients. No global parser changes.
