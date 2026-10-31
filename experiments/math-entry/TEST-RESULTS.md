# Recorded validation

Baseline: `main` / `26ec4f15185c37f9e8843e96a09d583b47babcdf`, v12.8.Y.
Recorded October 30, 2026 (America/Los_Angeles).

## Experiment tests

| Test group | Result |
|---|---|
| `tests/adapter.test.mjs` | **73 passed, 0 failed** |
| `tests/browser.mjs` | **55 passed, 0 failed** |
| Browser | **Linux headless Chromium 154.0.8037.57**, driven through Playwright |
| Normal-session uncaught browser errors | **0** |
| Normal-session failed HTTP responses | **0** |
| External network requests | **0** |
| Local-storage entries / service-worker registrations in fresh test context | **0 / 0** |
| Warm preview, physical typing through rendered superscript | **192ms** in this environment; not a school-device benchmark |

### Focused parser and checker tests

- Nested fractions, fraction powers, fractional/nested exponents, explicit grouping, unary minus, and scientific notation.
- Grouped and compact TeX, including MathLive’s `\frac34` serialization; single-token TeX argument boundaries.
- Square/nth roots, real odd roots of negative values through the existing integration checker, function powers, inverse trig, and nested absolute values.
- Incomplete groups, fraction denominators, radicals, exponent slots, and equations. Unsupported commands, base-log subscripts, norms, and general subscripts fail closed.
- Unsimplified polynomial rejection, unreduced fraction preservation, decimal digit preservation, existing rounded-number policy, required equation forms, +C and IVP restrictions, sequence subscripts/recurrences, and the existing IM1 interval grammar.
- Every initial fixture is translated and compared with its direct existing-checker result. All 26 examples retain their intended initial outcome. This includes deliberately **unsimplified**, **incomplete**, and **unsupported** outcomes; it does not mean every example is graded correct.
- All vendored file checksums match `dependency-lock.json`.

### Real browser checks

The browser tests exercised actual DOM elements, MathLive, MathJax, the unchanged BatchMath editor, and existing checkers. They are distinct from the simulated-DOM existing-editor QA below.

- All three options load and remain independent. C uses actual MathLive and the same generated keypad button arrangement/labels as A.
- A/B/C: physical typing, slash fractions, arrows, Backspace/Delete, partial keyboard selection/deletion, undo/redo, keypad targeting, structural insertion, nth-root editing, reset/history clearing, one Enter/one submission, and no submission on blur.
- C: completing a fraction inside an exponent and exiting to append a baseline term.
- A/B/C: a synthetic ChromeOS-shaped `Dead`/Shift/`Digit6` event. This tests the handler, not Chromebook hardware.
- A/B/C: supported structured clipboard import using synthetic ClipboardEvents in a real DOM. This does not certify the operating-system clipboard or interoperability across applications.
- B: visible numerator/denominator vertical separation, generated CHTML stylesheet, local font assets, and a warm live update after actual key events. Markup existence alone was not accepted as proof of typesetting.
- C: all 20 MathLive font faces register/load without a false warning. Blocked runtime shows a clear failure with A/B usable; blocked fonts show a typography warning while keeping controls available.
- Long expressions at **1600px** and **375px** viewport widths do not widen the document. Viewport emulation is not a physical mobile-device test.
- No production analytics, progress writes, external requests, or service-worker registration in the fresh test context.

Desktop and mobile screenshots were visually reviewed/generated in the ignored `test-artifacts/` directory. The final desktop review confirmed the real stacked MathJax preview and MathLive typography, rather than accepting DOM-only checks.

## Existing repository QA

These scripts ran against the unchanged baseline production code. The wrapper only redirects normal `qa-results` writes into this experiment’s ignored artifact directory and captures `process.exit` so every selected script can report. Assertions and production source are unchanged.

| Existing suite | Result |
|---|---|
| `tools/calculus-keypad-structure-qa.mjs` | **Passed**, 139 reported cases; simulated DOM |
| `tools/ftc-checker-regression-qa.mjs` | **Passed**, 9,047 checks, including 3,000 generated keypad-form answers |
| `tools/fraction-sign-equivalence-qa.mjs` | **Baseline failure**: one display-sign finding in `assets/unit3-applications-generators.js` |
| `tools/sitewide-fractional-exponent-qa.mjs` | **Baseline failure**: 22 slash-in-superscript findings in `assets/unit3-optimization-related-rates.js`, `assets/ap-topic-generators.js`, and `assets/unit3-applications-generators.js` |

The two failures involve existing production files that this branch does not change. They were documented, not repaired, because production edits are outside the authorized experiment. The existing-suite command intentionally returns a failing status for them.

## Limits of this evidence

- No actual Chromebook, tablet, phone, screen reader, IME, or comprehensive accessibility test was performed.
- No claim of exact MathLive/BatchMath editing parity: slash capture, structural deletion, and history grouping differ. C includes a version-specific focus bridge; see README.
- No production Unit 5 stage/Next workflow or every historical inline derivative grader is certified by these lab tests.
- Ordered pairs and geometric sequences demonstrate editing with explicit unsupported grading; no new grader replaces their production path.
- No root dependency install/update, production migration, deployment, or existing-file modification is part of this experiment.

Reproduction commands and known behavior differences are in [README.md](README.md). Raw browser and existing-suite reports are generated locally in the ignored `test-artifacts/` directory when tests are run.
