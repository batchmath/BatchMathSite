# Derivatives pilot keypad audit

## Part A: Power Rule

The actual `powerRuleProblem()` generator has polynomial, negative-power, fractional/radical, irrational-exponent and synthesis families. Higher-derivative mode samples orders 2–4 and omits irrational exponents, exactly as before. First-derivative irrational questions choose `sqrt(2)`, `sqrt(3)`, `pi` or `e` as a constant exponent; their answers still contain these constants.

| Required mathematical input | Keypad access |
| --- | --- |
| Integer coefficients, zero and negative signs | Existing digits and minus |
| Variable and polynomial terms | Existing `x`, exponent, arithmetic and grouping keys |
| Rational coefficients and negative/fractional powers | Existing fraction, exponent, parentheses and navigation keys |
| Irrational constants `e`, `pi` | Added `e` and `π` in the existing visual style |
| `sqrt(2)`, `sqrt(3)` and square-root answer forms | Added `√` using the existing root key builder |
| Nth roots / rational powers | Exponent plus a fraction in the exponent, e.g. `x^(1/3)` |

Only the existing `derivative-power` profile configuration changes. The five structural/constant keys—fraction, square root, exponent, pi, e—flow through the existing dense five-column layout. No builder, CSS, constant interpretation, generator or checker changes are needed. Both legacy and MathLive receive exactly the same actual keypad layout and labels.

The unchanged checker supports `sqrt()` but not `root()`/`cbrt()`. The generic legacy nth-root template emits `root(...)`, so adding that button would offer an answer the checker cannot parse. Nth roots remain fully expressible on screen as fractional powers; MathLive also retains its native typed/pasted nth-root notation, translated structurally to fractional powers. No inverse trig, log, unrelated variables, infinity or other answer-outcome buttons are needed here. Decimal coefficients are not emitted by these families; exact rational coefficients use the fraction key.

Verification samples 3,600 actual generated answers across all nine available selector combinations, confirming that their identifier/function grammar is exactly `x`, `e`, `pi`, `sqrt`. Browser coverage constructs and grades complete actual `e`, `pi`, `sqrt2` and `sqrt3` answers using only visible keypad clicks in **both** editors. The original Power Rule grading, focus, history, fallback and responsive suites are retained.

The old shared-keypad QA explicitly required Power Rule to omit `e` and `π`. That obsolete expectation is updated to require the audited keys, while retaining its unrelated profile/editor tests. A separate scope test proves that the shared keypad implementation and all unrelated profiles are otherwise identical to the successful pilot checkpoint.

Part A checkpoint: 44/44 focused Node tests, 38/38 real Chromium checks, shared-keypad QA (139 reported cases), keyboard/accounting QA (46 cases), and Power Rule family QA (22,500 individual + 12,000 review samples) pass. The original generator/checker script is byte-for-byte unchanged.

## Part B: Chain Rule

The actual page has four modes and one first-derivative answer field. There is no higher-order or multipart workflow to migrate here.

| Mode | Actual active families |
| --- | --- |
| Simple | Cube root; power of a linear/quadratic expression; sine of a quadratic; square root of a quadratic |
| Multiple | Cosine of a power; power of sine; sine of cosine; nested square roots |
| Product/quotient | All six trig functions composed with a linear/cubic expression, paired with a polynomial or cube-root factor |
| Everything combined | Those families plus simple exponential/logarithmic questions; exponential-of-sine and sine-squared; logarithm of a square root; tangent of a square root of an exponential; exponential product/quotient factors |

The combined pool has 51 structural family/function combinations: seven simple, eight multiple-layer, and 36 product/quotient × trig function × other-factor combinations. High/low inside polynomials and either numerator orientation in quotients are also sampled. The label says “Full-Unit Review,” but its actual generator still selects these Chain Rule pools; it does not invoke the page's unused inverse-trig or unrelated derivative generators.

The Chain Rule profile retains digits, signs, arithmetic, grouping, fractions, exponents, `x`, `e`, `√` and `ln`. **`sec` and `csc` are added**: differentiating tangent/cotangent/secant/cosecant legitimately produces these functions. All six trig keys are required. The existing `π` button is removed from this profile because no active family uses pi; Power Rule retains its newly required pi key. No inverse trig, base-log, other-variable or special-outcome buttons are added. Natural logarithm entry remains available as requested, although canonical derivatives of the active logarithm questions reduce to rational expressions. Exponentials use `e` plus the exponent key.

Nth roots are accessible as fractional powers with the existing exponent/fraction keys. The shared unchanged checkers do not accept the legacy `root()` template, so neither profile exposes that ungradeable shortcut. MathLive's native nth-root notation remains editable and translates structurally; the browser suite grades an alternate cube-root derivative form for an actual generated problem.

The existing dense-grid builder, key styles, insertion handlers and every unrelated profile remain unchanged. Only the two appropriate profile declarations differ from the original pilot's shared keypad source. Browser tests construct complete actual composition, cube-root, trig-power, exponential, secant-product and cosecant-quotient answers through visible keypad clicks in both editors.
