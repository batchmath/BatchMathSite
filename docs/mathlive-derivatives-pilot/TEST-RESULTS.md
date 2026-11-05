# Combined derivatives pilot verification

Verified on 2026-10-31 UTC with Node 24.19.0 and Linux headless Chromium **154.0.8037.57**. There was no actual Windows browser, Chromebook, touch device or assistive technology available. A 375 px viewport verifies layout, not touchscreen compatibility.

The new branch starts from remote Power Rule pilot `1fdbcbec2550d08dc900aacbc83529389e942e7f`. Remote main was `26ec4f15185c37f9e8843e96a09d583b47babcdf`; neither main nor the original pilot was changed. Part A was committed as `dcd48a7c9a83922dc6cdac55c850370456a9e08e` before Chain Rule implementation.

## Focused mathematical and integrity tests

**67/67 Node tests pass** (44 Power Rule/audit + 23 Chain Rule).

Power Rule retains its previous 1,080 randomized problem round trips and 3,240 paired grading comparisons, mathematical structure/invalid-input tests, dormant formatting-gate tests, unchanged-engine proof and SHA-256 checks for all 24 vendor files. The new keypad audit samples another 3,600 actual generated answers and observes exactly `x`, `e`, `pi`, and `sqrt` identifiers/functions. The shared keypad source is identical to the checkpoint after excluding only the two audited profile declarations.

Chain Rule adds:

- 12,000 actual randomized questions: 3,000 per mode. Both `answerExpr` converted to LaTeX and actual generated `answerTex` translate back and pass the existing equivalence checker (24,000 structural grading checks).
- Coverage of every active family in every mode: 5 simple, 4 multiple-layer, 24 product/quotient combinations, and all 51 combinations in the combined pool. Both inside-polynomial shapes and quotient numerator orientations occur.
- 336 paired calls through the actual `check()` function, comparing translated and direct legacy correct, wrong, unsimplified and incomplete responses for the first sample of each family/mode cell.
- Nested trig/exponent/log/root composition, function powers versus argument powers, negative signs, compound fractions, fractional powers, real supported logarithms and an explicit missing-inner-factor rejection.
- Blank/nonempty malformed/unsupported behavior retained; arithmetic and grouping are not simplified.
- Byte-for-byte equality of the complete Chain Rule engine script to the checkpoint and equality of the two engines' actual grading grammars.

See [mathematical-results.json](../../tools/mathlive-derivatives-pilot/artifacts/mathematical-results.json).

## Actual browser checks

**65/65 checks pass: 38 Power Rule + 27 Chain Rule**, zero unhandled page errors.

Both suites run the actual practice pages, native MathLive 0.111.1 and actual local fonts/keypads. Test-only closure access is injected into intercepted test HTML; the shipped engines expose no QA API. Both suites also exercise uninstrumented HTML with explicit MathLive mode.

Power Rule retains all previous focus/editing/progression/fallback tests. Its new capstone uses only visible keypad clicks to construct and grade complete actual answers for `e`, `pi`, `sqrt2` and `sqrt3` questions in both editors.

Chain Rule verifies:

- Real question and worked-feedback typesetting, 20 loaded local MathLive fonts, no Compute Engine, one visible editor/keypad and identical legacy/MathLive button labels.
- 69 paired actual browser grading submissions: every one of the 51 family combinations, all four modes with correct/wrong/unsimplified/incomplete responses, an alternate cube-root form, and a missing chain-factor rejection.
- Another 16 complete answers (eight actual families × both editors) constructed solely by clicking the visible keypad: polynomial and trig compositions, square/cube roots, trig powers, exponentials, a secant product and a cosecant quotient.
- All six trig and `ln`/root keys produce their intended functions; no irrelevant pi/inverse-trig keys appear in Chain Rule.
- Physical entry, first-key focus, slash/fraction movement, exponent exit, nested fractions, selection/structural deletion, keyboard undo/redo, native and legacy structured clipboard.
- Three consecutive submission/advancement cycles, no change/blur grading, held Enter without skipped feedback/questions, stable Next focus, new-question focus, no old undo/inline-shortcut state, and all Practice Type selections.
- Long nested answers and the existing dense keypad within 375/1600 px viewports.
- Missing runtime, fonts and stylesheet; successful delayed startup; refused unsupported import; runtime command failure preserving a nested answer; exact unsupported-LaTeX recovery.
- Unrelated Product Rule (Power suite) and Quotient Rule (Chain suite) retain their original editors and make no MathLive requests even with `?editor=mathlive`.

Reports/screenshots: [Power Rule results](../../tools/mathlive-power-rule/artifacts/browser-results.json), [Chain Rule results](../../tools/mathlive-derivatives-pilot/artifacts/browser-results.json), [Chain 375 px](../../tools/mathlive-derivatives-pilot/artifacts/chain-rule-375.png), [Chain 1600 px](../../tools/mathlive-derivatives-pilot/artifacts/chain-rule-1600.png).

The real MathJax 4.1.3 runtime, NewCM fonts and speech-worker assets are replayed from cached comparison assets through temporary same-origin test URLs because external browser networking is restricted. No renderer or checker is mocked, and no MathJax assets/configuration changes ship in the application. Test contexts block service workers and external analytics to isolate the application checks.

## Existing regression suites and baseline comparison

| Suite | Outcome |
| --- | --- |
| Power Rule family QA | PASS: 22,500 individual + 12,000 review samples |
| Shared keypad structure QA | PASS: 139 reported cases, with the obsolete Power Rule omission expectation corrected |
| Keyboard/accounting regressions | PASS: 46 cases |
| Derivative/topic enhancements | PASS: 102,000 samples |
| New derivative engines unit QA | PASS: 9,148 checks |
| FTC/shared parser checker QA | PASS: 9,047 checks |
| Fraction-sign equivalence QA | Same baseline failure: one negative-numerator display finding in `assets/unit3-applications-generators.js` |
| Sitewide fractional-exponent QA | Same baseline failure: 22 display-format findings in the unchanged `unit3-optimization-related-rates.js`, `ap-topic-generators.js`, `unit3-applications-generators.js` |

The last two suites were rerun in a detached worktree at the exact unchanged main commit; their findings match the experimental branch. No finding was suppressed and none of those three sources was edited. The intentional Power Rule keypad test update is separate from these preexisting display failures. See [regression results](../../tools/mathlive-derivatives-pilot/artifacts/regressions.json).

## Reproduce

The ZIP/site itself requires only `py -m http.server 8000`; see the [download and Windows guide](README.md). Developer tests require a Git checkout containing the baseline objects, Node, Playwright and Chromium.

```sh
node --test tools/mathlive-power-rule/adapter.test.mjs tools/mathlive-power-rule/keypad-audit.test.mjs tools/mathlive-derivatives-pilot/chain.test.mjs
CHROMIUM_PATH=/path/to/chromium node tools/mathlive-power-rule/browser.mjs
CHROMIUM_PATH=/path/to/chromium node tools/mathlive-derivatives-pilot/browser.mjs
```

Each browser script starts a Python static server (8138 for Power, 8139 for Chain) unless `PILOT_URL`/`CHAIN_PILOT_URL` specifies an existing server. For the full real-MathJax runs, set `MATHJAX_FIXTURE_ROOT` to the original comparison worktree's `experiments/math-entry/vendor/` folder. Only MathJax/NewCM are copied into unique temporary `work/` directories and removed afterward. Without those fixtures the external CDN is blocked and the suites use the engines' existing load-event fallback; the extra rendering check is omitted.

Here Playwright was resolved with `NODE_PATH=/workspace/BatchMathSite/node_modules`, Chromium with `CHROMIUM_PATH=/usr/bin/chromium`, and the renderer fixture root was `/workspace/work/math-entry-comparison/experiments/math-entry/vendor`. Run the existing suites with `node tools/<suite-name>.mjs`. `git diff --check` passes.

## Remaining limits

The existing numerical equivalence and `Math.pow` domain limitations are unchanged. Nth roots use the existing fractional-power interpretation; the legacy `root()` template is intentionally absent. Unsupported grammar is refused instead of guessed and remains recoverable in MathLive/LaTeX. Nonempty malformed input still consumes an incorrect attempt, and equivalent unsimplified responses remain accepted for the active families. These are existing grading policies, not new restrictions or improvements.

Windows startup is the ordinary static-server procedure; actual Windows/Chromebook, touch and assistive-technology behavior still needs device verification. The results support supervised testing and a carefully audited staged expansion to compatible engines, not a sitewide migration or production deployment.
