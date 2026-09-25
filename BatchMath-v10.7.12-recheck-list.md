# BatchMath v10.7.12 Browser Recheck List

## Introduction to Limits

- Confirm the graph is substantially larger on desktop and scales to the viewport on mobile.
- Complete every part of several graph sets; verify the graph remains unchanged for all 3–5 parts.
- Confirm prompts ask only for one-sided/two-sided limits and display the closed domain.
- Confirm no prompt asks for `f(a)`, undefined versus DNE, or whether behavior is unbounded.

## Answer editor

- Reload each representative calculus practice engine and type immediately without first clicking the answer area.
- Click the nth-root key, type an index, move right, type a radicand, and submit an exact answer such as `root(5,3)`.
- Check nth-root cursor placement, backspace, delete, reset, next-question focus, desktop, and mobile behavior.

## Continuous functions, oscillation, and one-sided limits

- Confirm the continuous-function engine has no Core/Later selector and rotates through algebraic, radical, nth-root, trig, exponential, and logarithmic compositions.
- Confirm trig expressions render with function arguments correctly grouped.
- Confirm conceptual oscillation answer choices render as words and generated expressions contain no visible first powers or artificial sums such as `2+x+1`.
- Confirm infinite one-sided explanations identify numerator sign, denominator sign from the selected side, and quotient sign.

## Comprehensive Review and cache

- Select Limits from Graphs and confirm linked graph parts remain consecutive.
- Confirm focused continuous, oscillation, and one-sided families match their individual engines.
- Hard refresh once after deployment and confirm `assets/app-version.json` reports 10.7.12.
