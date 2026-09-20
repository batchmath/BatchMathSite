# BatchMath v10.6.3.AA

## Power Rule practice changes

- Added a visible **Derivative Order** selector:
  - First Derivatives (default)
  - Higher Derivatives (2nd–4th)
- Added a visible **Function Type** selector:
  - Mixed Practice (default)
  - Polynomial Functions
  - Negative Integer Exponents & Reciprocals
  - Fractional Exponents & Radicals
  - Irrational Exponents
- Polynomial problems vary whether linear and constant terms are present.
- Reciprocal problems include negative-exponent notation and constant-over-monomial forms.
- Fractional-power problems include positive and negative rational exponents, square roots, higher roots, reciprocal roots, and powers appearing in denominators.
- Irrational-power problems use exponents such as square root of 2, square root of 3, pi, and e. They are identified as power functions, not exponential functions.
- Mixed Practice includes every family plus expressions combining polynomial, reciprocal, and rational-power terms.
- No problems require dividing a sum term by term or using the product, quotient, chain, exponential, or logarithmic differentiation rules.
- Higher derivatives are capped at the fourth derivative. Coefficients and powers are constrained to keep arithmetic reasonable.
- Explanations state the necessary rewrite and the repeated power-rule reasoning.

## Comprehensive Review synchronization

- The Basic Derivative Rules family now includes the same polynomial, reciprocal, radical, rational-exponent, irrational-exponent, mixed-expression, and higher-derivative content.
- Comprehensive Review keeps its existing broader derivative-category interface.

## Automated QA

- New Power Rule family QA: 25,000 individual-engine samples and 12,000 Comprehensive Review samples.
- Verified both selectors, all families, derivative orders 1–4, reciprocal/radical/exponent forms, parser compatibility, display safety, controlled arithmetic, and Comprehensive Review coverage.
- Full non-browser site regression passed after updating the deep-topic audit for the new two-selector engine.
- Browser-based visual testing was not run in this environment.

## Manual deployment recheck

1. Confirm the page opens with **First Derivatives** and **Mixed Practice** selected.
2. Change each selector separately and confirm a new problem appears immediately.
3. Check all five function types under First Derivatives.
4. Check all five function types under Higher Derivatives and confirm only second, third, and fourth derivatives appear.
5. Verify roots, fractional exponents, negative exponents, reciprocal notation, pi, e, and square-root exponents render correctly.
6. Enter equivalent answers in exponent, radical, and reciprocal forms to confirm they are accepted.
7. Confirm Enter checks an unanswered problem and advances only once after feedback.
8. In Derivatives Comprehensive Review, generate several Basic Derivative Rules problems and confirm the expanded families appear.
