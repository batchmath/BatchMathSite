const byTopic = {
  'basic-techniques-indeterminate-limits': 'Evaluate indeterminate limits by rewriting expressions. Use factoring, rationalizing, and other algebraic techniques to find the limiting value.',
  'limits-at-infinity': 'Evaluate limits as x tends to positive or negative infinity. Compare dominant terms and check your reasoning with the worked explanation.',
  'limits-of-continuous-functions': 'Evaluate limits of continuous functions, using substitution and the properties of each function where they apply.',
  'one-sided-limits': 'Find left- and right-hand limits. Use the two sides to decide whether the two-sided limit exists.',
  'continuity-parameters': 'Find the missing parameter that makes a piecewise function continuous at a boundary. Match the limiting values before checking your answer.',
  'introduction-to-limits': 'Read graphs and other representations to identify limits. Choose an answer and use the explanation to check your reasoning.',
  'sin-one-over-x': 'Analyze how sin(1/x) behaves near zero. Choose an answer and compare your reasoning with the explanation.',
  'course-practice': 'Evaluate the trigonometric limits covered in the course assignment. Rewrite expressions to use standard limits and enter an exact result.',
  'conceptual-practice': 'Work through conceptual and AP-style questions about derivatives and their interpretation. Check each response for feedback.',
  'derivatives-of-inverse-functions': 'Use the relationship between a function and its inverse to find derivatives. Enter an exact answer when prompted.',
  'derivatives-of-logarithmic-functions': 'Differentiate logarithms and expressions that contain logarithms. Enter a derivative to check your result.',
  'derivatives-of-trigonometric-functions': 'Differentiate trigonometric expressions, using derivative rules together when needed.',
  'difference-quotient': 'Use the difference quotient to find or interpret rates of change. Choose an answer and read the explanation.',
  'exponential-functions': 'Differentiate exponential expressions and apply the chain rule when the exponent is a function of x.',
  'implicit-differentiation': 'Differentiate both sides of an equation relating x and y, then solve for the requested derivative.',
  'inverse-trigonometric-functions': 'Differentiate expressions involving inverse trigonometric functions. Apply other derivative rules when the expression calls for them.',
  'logarithmic-differentiation': 'Use logarithms to simplify differentiation when variables appear in both the base and exponent or in products and quotients.',
  'the-product-rule': 'Differentiate products of functions. Enter the derivative and check whether it is equivalent to the expected expression.',
  'the-quotient-rule': 'Differentiate quotients of functions. Enter the derivative and check whether it is equivalent to the expected expression.',
  'absolute-and-local-extrema-and-the-extreme-value-theorem': 'Identify absolute and local extrema or determine when the Extreme Value Theorem applies.',
  'equations-of-tangent-and-normal-lines': 'Use a derivative to find a slope at the given point and write the equation of a tangent or normal line.',
  'horizontal-and-vertical-tangent-lines-implicitly': 'Find horizontal or vertical tangents to an implicitly defined curve by examining the derivative.',
  'horizontal-and-vertical-tangent-lines': 'Find where a curve has horizontal or vertical tangents and identify the limiting slope when applicable.',
  'increasing-decreasing-intervals-concavity-and-extrema': 'Use derivative information to identify increasing and decreasing intervals, concavity, or extrema.',
  'l-hopital-s-rule': 'Recognize indeterminate forms and evaluate limits using L’Hôpital’s Rule when its conditions hold.',
  'linearization-and-differentials': 'Use tangent-line approximations and differentials to estimate values or changes.',
  'motion': 'Use position, velocity, and acceleration to analyze motion. Answer questions about direction, speed, and other features as prompted.',
  'newton-s-method-for-approximating-roots-of-a-function': 'Apply Newton’s method to estimate a root. Use each approximation to compute the next one.',
  'optimization': 'Set up a function from a word problem and use its derivative to find a maximum or minimum.',
  'related-rates': 'Relate quantities in a changing situation and differentiate with respect to time to find the requested rate.',
  'rolle-s-theorem-and-the-mean-value-theorem': 'Check the hypotheses of Rolle’s Theorem or the Mean Value Theorem and find the value the theorem guarantees.',
  'tangent-and-secant-line-approximations': 'Use secant slopes and tangent lines to compare average and instantaneous rates of change.',
  'using-your-graphing-calculator': 'Use a graphing calculator to answer questions about a function and its derivative. Follow the rounding directions for each problem.',
  'introduction-to-sigma-notation': 'Translate between sigma notation and expanded sums, and evaluate sums using the requested index and limits.',
  'rectangular-approximations': 'Approximate area or a definite integral using rectangles. Use the specified sample points and interval widths.',
  'trapezoidal-approximations': 'Use the trapezoidal rule to estimate a definite integral from given interval or table values.',
  'basic-integrals': 'Find antiderivatives and evaluate basic integrals. Enter exact answers using the math keypad.',
  'integrals-using-geometry': 'Interpret the definite integral as signed area. Use geometric shapes and enter an exact result.',
  'mean-value-theorem-for-integrals': 'Find a function’s average value on an interval and apply the Mean Value Theorem for Integrals.',
  'u-substitution-integrals': 'Choose a substitution and use it to evaluate an integral. Enter an exact answer using the math keypad.',
  'integrals-resulting-in-natural-log-and-inverse-trigonometric-functions': 'Recognize when an antiderivative involves a natural logarithm or an inverse trigonometric function. Enter an exact answer.',
  'fundamental-theorem-of-calculus-and-integral-rules': 'Use the Fundamental Theorem of Calculus to connect accumulation functions, derivatives, and definite integrals.',
  'integral-rules-practice': 'Use definite integral rules to combine, split, reverse, or scale integrals. Enter exact answers.',
  'multiplication': 'Practice multiplication facts through 12 × 12 and perfect squares through 20². Enter each product to check it.',
  'adding-and-subtracting-negative-numbers': 'Add and subtract signed numbers. Enter the resulting integer.',
  'multiplying-and-dividing-negative-numbers': 'Multiply and divide signed numbers. Check the sign as well as the magnitude of each result.',
  'square-roots-and-exponents': 'Evaluate square roots and powers. Pay attention to parentheses and the sign of the base.',
  'order-of-operations': 'Evaluate numerical expressions using the order of operations. Work through parentheses, powers, and arithmetic as shown.',
  'reducing-fractions': 'Write fractions in simplest form. Use a common factor to reduce the numerator and denominator.',
  'fractions': 'Work with fractions and simplify your result when the question calls for it.',
  'decimals': 'Practice operations with decimals. Watch the place value when you enter your answer.',
  'percents': 'Work with percentages and their decimal or fractional equivalents. Answer the quantity each problem asks for.',
  'classifying-numbers': 'Classify real numbers by their properties, including whether they are rational, irrational, integers, whole numbers, or natural numbers.',
  'distributive-property': 'Distribute a factor across each term in parentheses and simplify the resulting expression.',
  'graphing-inequalities-interval-notation': 'Translate between inequalities, number-line graphs, and interval notation. Pay attention to open and closed endpoints.',
  'solving-linear-inequalities': 'Solve linear or compound inequalities. Reverse the inequality sign when you multiply or divide by a negative number.',
  'coordinate-system-nine-key-features': 'Read coordinates and identify features of graphs, such as intercepts, extrema, and intervals of increase or decrease. Use Practice Type to focus on a skill.',
};

const reviews = {
  'im1/unit-2': 'Review expressions, equations, inequalities, and features of coordinate graphs. Use Practice Type to focus on one skill or mix them.',
  'im1/unit-3': 'Review arithmetic sequences, function notation, slope, equations of lines, and recursive formulas. Choose a section or mix skills.',
  'im1/unit-4': 'Review geometric sequences, recursive and explicit formulas, exponential models, and solving exponential equations. Choose a section or mix skills.',
  'ap-calculus/unit-3': 'Review applications of derivatives, including motion, graph analysis, extrema, and modeling.',
  'ap-calculus/unit-4': 'Review integration concepts, including numerical methods, sigma notation, and definite integrals.',
};

export function practiceDescription(route, existing, topicCopy) {
  const generic = /same generator logic|^Randomized practice for|^Practice problem families modeled|^Assignment-style randomized practice|^Enter exact answers(?: with the math keypad)?, check|^Enter exact answers with the math keypad, check|^(?:Non-calculator|Calculator-active) randomized practice/i;
  if (existing && !generic.test(existing)) return null;
  const parts = route.split('/').filter(Boolean);
  const mode = parts.at(-1);
  const topic = parts.at(-2);
  const unit = parts.slice(0, 2).join('/').replace(/(\/unit-\d+)-.*$/, '$1');
  let copy = mode !== 'practice' && mode !== 'calculator-practice' ? byTopic[mode] : null;
  if (topic === 'comprehensive-review') copy ||= reviews[unit];
  copy ||= byTopic[topic] || topicCopy;
  if (!copy) return null;
  if (/^Calculator-active randomized/.test(existing) && !/calculator/i.test(copy)) copy += ' Use a graphing calculator as directed.';
  if (/^Non-calculator randomized/.test(existing)) copy += ' Work without a calculator.';
  return copy;
}
