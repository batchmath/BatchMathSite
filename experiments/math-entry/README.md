# BatchMath Math Entry Comparison

An isolated, interactive three-way experiment. The production baseline is `main` at `26ec4f15185c37f9e8843e96a09d583b47babcdf` (v12.8.Y). All experiment changes are under this directory.

## Open it on Windows

No Node installation, package installation, build step, or internet connection is needed to **use** this page once you have the repository files.

1. Download the **experiment/math-entry-comparison** branch as a ZIP from GitHub, or check out that branch in a separate local copy.
2. Extract the ZIP. Open a terminal in the repository folder containing both `assets` and `experiments`. Do not start the server from inside this experimental directory.
3. Run your usual command:

```powershell
py -m http.server 8000
```

4. Open **<http://localhost:8000/experiments/math-entry/>**.

Stop the server with Ctrl+C. If you previously registered BatchMath’s service worker while testing on localhost:8000, a private browser window or a fresh local port avoids that older local worker; for example `py -m http.server 8001` and <http://localhost:8001/experiments/math-entry/>. This experiment does not register, unregister, or modify service workers.

No isolated remote preview host is configured for this repository/session. The GitHub branch is source code, not a running website. The local server above is the delivered access path; production hosting and publishing workflows are unchanged.

## Try the comparison

- **A — Existing editor:** the actual, unmodified `assets/calculus-keypad.js` and stylesheet. Rendering, physical keyboard handling, smart slash, structure-aware selection/deletion, and undo/redo are the existing code.
- **B — Existing editor + preview:** exactly the same control and keypad, with a display-only MathJax preview. Updates coalesce after 100ms of typing. Empty structures show squares; unsupported syntax has an explicit preview message. Preview conversion never feeds back into the editor or grader.
- **C — MathLive:** the actual **MathLive 0.111.1** editor, with its own mathematical layout and editing model. Its default virtual-keyboard display is disabled. A separate experimental bridge operates a clone of the actual BatchMath-generated keypad layout.

There are **26 selectable examples**: simple/nested fractions, polynomials, unsimplified terms, fractional/nested exponents, roots, trig/function powers, logarithms/exponentials, derivatives, antiderivatives, +C, an IVP with a second interval field, equations, ordered pairs, intervals/unions, arithmetic/recursive/geometric sequences, precision-sensitive decimals, and incomplete structures.

Selecting or reloading an example resets all three options to equivalent initial mathematics. Each then edits independently. Each option also has its own Reset button. Most examples include a separate, ungraded scratch field for testing keypad targeting; the IVP example has two graded fields. Check leaves answers editable, does not save progress, and does not reproduce a production scoring/Next workflow.

Open **Answer representation & grading details** to see the visible-expression text description, exact editing representation, translated checker input, selected existing checker, structural completeness, and grading result. Only explicit Check/Enter actions run a checker; blur does not. Open **What differs in this option?** for behavior differences.

The “all symbols” keypad profile is experimental configuration through BatchMath’s existing public `registerProfile` API. Arithmetic and equation fixtures also use existing topic profiles. The actual builder arranges the buttons in A/B; C clones those generated buttons and supplies new callbacks. Production keypad callbacks are not modified or claimed to be reusable unchanged.

## Grading and translation boundaries

`answer-adapter.mjs` is a restricted structural parser and serializer, not a computer algebra system. It reads fractions, grouping, powers, roots, supported functions, equations, intervals/lists, and selected sequence subscripts. It does **not** evaluate, solve, simplify, reduce fractions, rearrange equations, supply +C, or shorten decimals. Unsupported commands and incomplete structures do not receive a truncated grading submission.

The lab invokes actual exported BatchMath checking functions. `grading.mjs` only dispatches and presents their differing result shapes; it does not provide alternative equality rules. The existing files load after DOMContentLoaded so the IM1 Unit 3 QA exports are available without starting that practice page. No production generator, scoring system, analytics script, PWA script, or student storage module is started.

Lab source inputs opt out of document-wide pre-submit DOM normalization so the diagnostic strings remain explicit. Individual checkers retain any normalization they perform internally. This is a direct-checker experiment, not a reproduction of every production engine’s surrounding event flow.

Existing checkers exercised by the tests:

- `BatchMathDerivativeExpressions.parse/equivalent`
- `BatchMathLineEquations.check`
- `BatchMathUnit4Answers.check` (function expression and antiderivative cases)
- `BatchMathUnit5Answers.check` (exact, rounded numeric, general solution, IVP, interval)
- `BatchMathIM1Algebra.check`
- `BatchMathIM1Equation.check`
- `BatchMathIM1Interval.check` (focused tests)
- `BatchMathIM1Unit3PracticeQA.lineEquationEquivalent`, `formulaEquivalent`, and `recursiveFormulaEquivalent`

Ordered pairs and geometric sequences are **editing demonstrations with unsupported grading**. Their production checking paths are not replaced or extracted into a new grader. The older derivative graders embedded inside HTML pages are also outside the lab’s compatibility claim.

## Known differences and limits

1. A/B use the shared calculus editor, not the separate IM1 numeric/fraction editor or every historical BatchMath editor. In the restricted IM1 solution example, the initial `3/4` is accepted; a newly inserted shared-editor `(3)/(4)` can be rejected by that strict checker. This difference is deliberate and visible, not hidden by a new grader.
2. MathLive owns cursor navigation, selection, structural deletion, and undo coalescing. Its slash implicit-argument selection can differ from BatchMath’s preceding-term capture; its Backspace does not exactly copy BatchMath’s whole-shell deletion. Single-digit smart exponent exit is disabled; arrows leave the exponent.
3. MathLive 0.111.1 defers keyboard-sink focus. `focusMathfield()` uses its officially exposed `keyboard-sink` part to focus synchronously after a field click, reset, or keypad action. This fixes the first-key and cross-frame targeting failures found during browser testing. This small DOM bridge is **version-specific** and must be retested before upgrading MathLive.
4. The translator supports both grouped and compact MathLive output, such as `\frac{3}{4}` and `\frac34`. It preserves real odd-root syntax for a checker that supports it; it does not assume the basic derivative parser accepts nth roots. Base-subscript logarithms, integral operators, arbitrary macros, norms, general subscripts, and set notation are unsupported. Input length and nesting are bounded.
5. Partial structures remain incomplete. MathLive’s rendering of empty slots differs from the custom editor. No input is silently solved or filled in to get credit.
6. MathLive imports supported BatchMath structured clipboard data through the bridge; its normal plain-text/LaTeX clipboard behavior remains the library’s. The browser test uses synthetic structured clipboard events in a real DOM; this is not an OS clipboard audit across applications.
7. The B preview uses professional MathJax layout but remains separate from the editor. A malformed/unsupported expression can have no preview. The page reports that limitation rather than showing an apparently complete answer as the submitted value.
8. All runtime and font assets are local and pinned. Missing MathLive runtime shows a fallback message; missing fonts show a typography warning. A/B remain separately usable. No Compute Engine is included.
9. Testing used Linux Chromium and viewport emulation. **No actual Chromebook, tablet, phone, screen reader, or comprehensive accessibility validation is claimed.** A simulated `Dead` + `Digit6` + Shift event tests the event path, not Chromebook hardware.
10. This is not a complete replacement for the production Unit 5 stage/focus/progression logic. The experiment checks one-Enter/one-submission behavior and two-field targeting; full engine-by-engine staged workflow tests remain a rollout gate.

## Run the tests

Using Node 24 (or a version supporting the test-isolation flag), from the repository root:

```sh
node --test --test-isolation=none experiments/math-entry/tests/adapter.test.mjs
node experiments/math-entry/tests/existing-tests.mjs
```

The second command runs four existing repository QA scripts with only their report destinations redirected to `experiments/math-entry/test-artifacts/existing-tests/`. It catches their process-exit calls so all four results are reported. It returns a failing exit status for baseline failures; it does not weaken assertions or fix production files.

The real-browser script uses the repository’s existing Playwright dependency:

```sh
node experiments/math-entry/tests/browser.mjs
```

It starts a temporary Python server on port 8137. Alternatively, start your own server and set `ENTRY_LAB_URL` to its origin. `CHROMIUM_PATH` can select an installed Chromium binary; otherwise Playwright’s normal browser selection is used. `PYTHON` can select the Python executable. These are test-runner settings, not requirements for opening the experiment.

Generated screenshots and detailed reports go to the ignored `test-artifacts/` directory. Recorded results and baseline failures are described in [TEST-RESULTS.md](TEST-RESULTS.md).

## Dependency provenance and isolation

See [dependency-lock.json](dependency-lock.json) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). MathLive’s published SHA-512 tarball integrity and every vendored file’s SHA-256 hash were verified. MathJax and its NewCM font files were copied from the existing version-verified 4.1.3 packages; no dependency install/update was performed.

All source, assets, tests, documentation, and generated-report destinations for this experiment are under `experiments/math-entry/`. Existing production assets are referenced by relative URL and remain unchanged. Removing this directory removes the experiment.

## Current recommendation

MathLive is technically viable for **further selective integration work**: real browser typing, keypad commands, restricted translation, and representative existing graders work together here. This does not establish an exact behavioral replacement or sitewide compatibility. The version-specific focus bridge and different deletion/slash/history behavior are material integration costs. Make the next decision after personally comparing the editors and testing the school’s actual devices; keep production unchanged until those gates are satisfied.
