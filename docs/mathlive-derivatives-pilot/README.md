# MathLive derivatives pilot

Branch: `experiment/mathlive-derivatives-pilot`, based on the verified original Power Rule checkpoint `1fdbcbec2550d08dc900aacbc83529389e942e7f`.

This build finalizes the Power Rule keypad and makes editable MathLive 0.111.1 the default on **Power Rule and Chain Rule practice only**. Both complete engine scripts—including generation, distributions, math checking, scoring, feedback, explanations, selectors and progression—remain byte-for-byte unchanged.

## Download and run on Windows

**[Download the complete experimental website ZIP](https://github.com/batchmath/BatchMathSite/archive/refs/heads/experiment/mathlive-derivatives-pilot.zip).** This contains the whole website, including the local MathLive runtime and all 20 fonts.

Extract it, open a terminal in the extracted folder containing the website's root `index.html`, and run your usual command:

```powershell
py -m http.server 8000
```

No npm install or build step is needed. Keep the full extracted folder structure. The site's existing MathJax CDN dependency for questions and feedback is unchanged; this is not a new offline-rendering system.

| Engine | MathLive | Legacy comparison |
| --- | --- | --- |
| Power Rule | [Open MathLive](http://localhost:8000/ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/?editor=mathlive) | [Open legacy](http://localhost:8000/ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/?editor=legacy) |
| Chain Rule | [Open MathLive](http://localhost:8000/ap-calculus/unit-2-derivatives/topics/the-chain-rule/practice/?editor=mathlive) | [Open legacy](http://localhost:8000/ap-calculus/unit-2-derivatives/topics/the-chain-rule/practice/?editor=legacy) |

Omitting `editor` defaults to MathLive on these two pages. This is a per-page URL switch, not a saved global preference; opening a different mode starts a new session. Add `&bm_seed=pilot` to compare the same initial randomized question. Different answer histories can affect later RNG samples, as before.

## Changes

Part A was committed separately before beginning Chain Rule implementation:

`dcd48a7c9a83922dc6cdac55c850370456a9e08e` — Power Rule keypad correction and verification.

- Power Rule adds `e`, `π`, and `√`, all needed by actual irrational-exponent answers. They use the existing keypad builder and visual style in both editors.
- Chain Rule adds missing `sec`/`csc` keys and omits its unused pi key. It retains natural logs, square roots, exponents, fractions, all six trig functions, `e`, and ordinary operations. See the [keypad audit](KEYPAD-AUDIT.md) for the actual generator families and nth-root access.
- `assets/mathlive/derivative-pilot.mjs` shares the existing boot, query selection and initialization fallback. `power-rule.mjs` and `chain-rule.mjs` are two-line entry points.
- `translateDerivative()` is the existing restricted structural translator under a shared name. Its `translatePowerRule` alias remains available. The two actual checker grammars are identical, verified by test; no second parser/editor was created.
- Both pages reuse the same answer-field controller, existing-keypad bridge, local runtime, fonts, focus solution and history/reset safeguards. MathLive owns normal editing, selection, deletion, slash behavior and undo grouping.
- The Chain Rule HTML only gains the stylesheet/module import block. No generator or checker was edited.

Files changed from the original pilot checkpoint:

| Existing files | Purpose |
| --- | --- |
| `assets/calculus-keypad.js` | Only the Power Rule and Chain Rule profile declarations |
| Chain Rule `practice/index.html` | Four added import/comment lines |
| `assets/mathlive/{answer-adapter,answer-field,power-rule}.mjs` | Shared translator naming, diagnostic label, thin boot wrapper |
| `tools/calculus-keypad-structure-qa.mjs` | Replace obsolete Power Rule “omit e/pi” expectations with the audited requirements |
| `tools/mathlive-power-rule/browser.mjs` and artifacts | Retain the original suite and add complete keypad-only irrational answers |
| Original Power Rule documentation | Links identifying its historical single-engine checkpoint |

New files:

- `assets/mathlive/{derivative-pilot,chain-rule}.mjs`.
- `tools/mathlive-power-rule/{keypad-audit.test,keypad-entry}.mjs`.
- `tools/mathlive-derivatives-pilot/{engine,chain.test,browser}.mjs` and mathematical/browser/regression JSON results plus two screenshots in `artifacts/`.
- This guide, [test report](TEST-RESULTS.md) and [keypad audit](KEYPAD-AUDIT.md).

The vendored MathLive runtime/fonts and integrity manifest are inherited unchanged from the original pilot. There are no new runtime dependencies or Compute Engine.

## Grading, workflow and fallback

The engine still reads `#answer`, handles its original Check/Enter events and owns all progression. The adapter only synchronizes MathLive into that contract. Nested composition, function powers, products/quotients, fractions and signs retain their structure. It does not differentiate, solve, evaluate, reduce or rearrange answers. Native nth roots lower structurally to the existing fractional-power grammar.

One Enter checks once; a later Enter advances. Held Enter cannot skip questions. Blur/change events do not grade. Each question resets focus, undo history and the pinned version's inline-shortcut snapshots. The existing keypad's actual layout is reused, and MathLive's conflicting virtual keyboard remains manual/hidden.

Both unchanged checkers prompt for blank input without consuming an attempt. Nonempty malformed, incomplete or unsupported expressions count as incorrect; there is no separate non-consuming syntax-error outcome in these engines. Current `pr-*`, `csj*`, `cmj*`, `coj*` families accept equivalent unsimplified responses. The stricter `pb*` formatting gate is retained but is not used by these active families. The adapter preserves this policy rather than introducing new simplification requirements.

Missing runtime/fonts/styling or refused initial import leaves the actual legacy editor usable. Runtime errors restore the current structurally translated answer. Unsupported LaTeX is retained in an exact selectable recovery copy if legacy cannot represent it. These paths are browser-tested on both engines. A browser crash or JavaScript stopping entirely cannot be recovered by the adapter.

## Reuse and merge scope

These two engines establish a reusable foundation for similar single-field expression graders. Future staged conversions still need a generator/keypad audit, an explicit grader-compatible translation contract, and real submission/progression tests. Literal answers, intervals, multi-field engines and different simplification rules should be handled by deliberate adapters rather than assuming this derivative grammar applies everywhere. Keep dependency integrity, focus/reset, clipboard and fallback regressions as shared tests. Review existing PWA caching and actual assistive-technology/device behavior before a production rollout.

The main shared conflict candidate with later Unit 6 work is `assets/calculus-keypad.js`; its diff is limited to two profile lines. The Chain Rule HTML import block could overlap a future cross-site page update. The MathLive namespace and test/doc directories are otherwise isolated. No Unit 6 file/branch, unrelated engine page, question generator, grader, production service worker, navigation, deployment or release configuration was changed. No reconciliation with a newer main was attempted.

Recommendation: ready for supervised teacher/classroom trials on the tested browser family, followed by actual Windows/Chromebook, touch and assistive-technology checks. The successful reuse supports a broader **staged** migration after separate authorization; it does not establish sitewide compatibility by itself.
