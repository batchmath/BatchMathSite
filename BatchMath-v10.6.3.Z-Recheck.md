# BatchMath v10.6.3.Z

Full cumulative website, including Y and every earlier checkpoint.

## Completed in Z

- Fixed Advanced Trig square-root deletion. Backspace/Delete can no longer remove only one parenthesis from the inserted radical shell.
- Fixed the shared Calculus keypad used by derivative and integral engines. Function, radical, fraction, and exponent structures remain valid while students edit them.
- Empty structures now delete as complete units.
- Backspace/Delete at a structural boundary moves into, out of, or between editable areas instead of exposing internal parser characters.
- Nested entries such as a fraction inside a square root or a function inside a square root are protected.
- Added executable regression coverage for roots, functions, fractions, exponents, nesting, Backspace, and Delete.

## Recheck after deployment

1. In Advanced Trig, press the square-root key and immediately press Backspace. The whole empty radical should disappear.
2. Enter a number inside a radical, move outside it, and backspace through the expression. No unmatched parentheses should appear.
3. In a derivative engine, try empty and nonempty versions of square roots, trigonometric functions, logarithms, fractions, and exponents.
4. Try nested structures, especially a fraction inside a square root and a function inside another function.
5. Check both the on-screen Backspace/Delete buttons and the physical keyboard keys.
6. Confirm Clear still removes the complete answer immediately.

No deployment has been performed.
