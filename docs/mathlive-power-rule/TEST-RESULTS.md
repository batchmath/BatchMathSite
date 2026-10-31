# Power Rule MathLive pilot verification

Verified 2026-10-31 UTC using Node 24.19.0 and Linux headless Chromium **154.0.8037.57**. No actual Chromebook, Windows browser, touch device or assistive technology was available. A 375 px viewport is a responsive-layout check, not a claim of mobile-device compatibility.

Starting remote `main`: `26ec4f15185c37f9e8843e96a09d583b47babcdf`.
Comparison branch reviewed: `experiment/math-entry-comparison`, commit `e4481a410a8c3c8b36376295514226e3215bf9b2`.
Both remote refs were rechecked before delivery. The original checkout and comparison worktree were left unchanged; all pilot edits use an isolated worktree.

## Focused mathematical tests

**42/42 Node tests pass.**

- 1,080 actual generated problems: 120 seeds in each of the nine available first/higher derivative and function-type combinations. This includes polynomial, negative, fractional/radical, irrational, mixed and second–fourth derivatives.
- For every problem, translated correct, deliberately incorrect, and equivalent unsimplified responses are checked through the page's actual `check()` function and compared with direct legacy inputs: 3,240 paired grading comparisons. Correct round trips also pass the actual equivalence checker.
- Nested fractions, fractional powers, square/nth roots, functions and bare function arguments, unary minus versus a negative base, grouping, answer labels, incomplete denominators/exponents/root slots and unsupported syntax.
- Arithmetic and unsimplified structure stay present. The dormant `pb` expanded-polynomial gate retains its existing decisions through a test-only fixture; current `pr-*` problems keep accepting equivalent unsimplified answers.
- Blank input stays non-consuming; nonempty malformed input stays incorrect and consumes one attempt.
- The complete inline engine script matches the verified main baseline byte for byte.
- All 24 vendored MathLive runtime/font/license/metadata files match the SHA-256 manifest copied from the integrity-verified comparison dependency. Version remains 0.111.1; no Compute Engine.

## Browser tests

**37/37 checks pass**, with zero unhandled page errors. See the [machine-readable results](../../tools/mathlive-power-rule/artifacts/browser-results.json) and [375 px](../../tools/mathlive-power-rule/artifacts/power-rule-375.png) / [1600 px](../../tools/mathlive-power-rule/artifacts/power-rule-1600.png) screenshots.

Tests run on the actual Power Rule page. Test-only closure access is injected into intercepted HTML; shipping HTML exposes no generator/checker QA API. One test also runs the original uninstrumented HTML in explicit MathLive mode.

- Real MathJax 4.1.3 renders the existing question and worked feedback alongside MathLive. To isolate restricted external networking, its exact cached runtime, NewCM fonts and speech-worker assets are served through temporary local test URLs. No renderer or math functions are mocked, and no MathJax assets/configuration are added to the application.
- Actual generated questions in all nine mode combinations: four response types per question produce matching legacy/MathLive grading statuses (36 paired browser cases). A further 45 generated `answerTex` responses survive actual MathLive canonicalization and grade correctly.
- Physical entry, first-key focus without clicking, fraction navigation, native slash behavior, exponent entry/exit, simulated dead-key Shift+6, all existing keypad mappings, structural selection/deletion, copy/paste, legacy structured clipboard, keyboard undo/redo and long horizontal overflow.
- Blank prompting, synchronous final-key submission, one check per Enter/keypad Check, no change/blur submission, held Enter without skipped feedback/questions, Next focus after delayed callbacks, new-question focus, cleared old history, selector changes and higher-order irrational restriction.
- The reset regression explicitly types a previous fraction ending in `x`, starts a new question and types `x` again. It verifies that no old expression returns through MathLive's native inline-shortcut snapshots, and that the first new character can be undone back to empty.
- 375/1600 px layouts stay within the viewport. MathLive virtual keyboard stays manual. The visible keypad's labels/order equal the actual existing legacy keypad.
- Missing runtime with an answer typed during loading; missing stylesheet; missing fonts with a current answer; successful delayed import; refused unsupported legacy import; injected runtime command exception; runtime error with exact unsupported LaTeX recovery. The real original editor remains/restores usable and preserves the answer in each applicable case.
- An unrelated Product Rule page loads its existing editor and makes no MathLive requests even with `?editor=mathlive`.

The initial browser pass exposed two 0.111.1 reset details, now covered by regressions: inline-shortcut snapshots survive `resetUndo()`, and clearing undo after `setValue()` removes the new empty baseline. The adapter handles both using public APIs; native editing and shortcut behavior remain enabled within each question.

## Existing regressions

| Suite | Result |
| --- | --- |
| `power-rule-family-qa.mjs` | PASS: 22,500 individual-engine + 12,000 comprehensive-review samples |
| `calculus-keypad-structure-qa.mjs` | PASS: 139 cases |
| `keyboard-regression-qa.mjs` | PASS: 46 cases |
| `ftc-checker-regression-qa.mjs` | PASS: 9,047 checks |
| `new-derivative-engines-unit-qa.mjs` | PASS: 9,148 checks |
| `derivative-topic-enhancements-qa.mjs` | PASS: 102,000 sampled problems; zero errors/warnings |
| `fraction-sign-equivalence-qa.mjs` | Same baseline failure: one existing generated negative-numerator display finding in `assets/unit3-applications-generators.js` |
| `sitewide-fractional-exponent-qa.mjs` | Same baseline failure: 22 existing display-format findings in `unit3-optimization-related-rates.js`, `ap-topic-generators.js`, `unit3-applications-generators.js` |

The two failing suites were rerun against a fresh detached worktree at the exact unchanged main commit. Their findings match the pilot; none of those three source files was edited. They are preexisting failures, not newly introduced regressions. Reports generated by existing suites remain in their ignored `qa-results/` directory.

## Reproduce

The site itself needs only a static server; see [Windows instructions](README.md#try-it-on-windows). Developer tests need a Git checkout containing the baseline commit, Node, Playwright and a Chromium installation.

```sh
node --test tools/mathlive-power-rule/adapter.test.mjs
CHROMIUM_PATH=/path/to/chromium node tools/mathlive-power-rule/browser.mjs
```

The browser script starts a Python static server on 8138 unless `PILOT_URL` specifies an existing server. It blocks service workers and external analytics/CDN requests in test contexts. Without renderer fixtures it exercises the existing page's load-event fallback and skips the extra real-MathJax rendering check (36 checks). For the full 37-check run, supply `MATHJAX_FIXTURE_ROOT` pointing to the comparison branch's `experiments/math-entry/vendor/` directory; the script copies just MathJax and NewCM into a unique `work/` scratch directory and removes it after closing the browser. The MathLive application assets always come from this pilot.

Exact full browser invocation used here:

```sh
NODE_PATH=/workspace/BatchMathSite/node_modules \
CHROMIUM_PATH=/usr/bin/chromium \
PILOT_URL=http://127.0.0.1:8001 \
MATHJAX_FIXTURE_ROOT=/workspace/work/math-entry-comparison/experiments/math-entry/vendor \
node tools/mathlive-power-rule/browser.mjs
```

Run each existing suite above with `node tools/<filename>` from its checkout root. Manifest/source integrity checks are included in the focused Node suite. `git diff --check` passes.

## Limits and recommendation

MathLive's native editing differences are intentional and accepted for this pilot. The restricted translator refuses unsupported grammar instead of guessing. Nth roots retain the unchanged checker's fractional-power domain limitations. Unsupported LaTeX remains recoverable, but legacy cannot render every MathLive structure. A browser crash or JavaScript completely stopping cannot be recovered by the adapter. The site's existing MathJax CDN/PWA behavior is unchanged; offline question rendering is not a new guarantee.

Ready for a **small supervised classroom pilot after the teacher's local Windows/device check**. Actual Chromebook, touch, screen-reader/keyboard-accessibility and additional-browser testing should precede broader adoption. No other engine migration, merge, production deployment or Unit 6 branch change was performed.
