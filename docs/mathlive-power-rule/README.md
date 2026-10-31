# MathLive Power Rule pilot

This describes the original single-engine checkpoint. For the current combined experimental build, use the [two-engine ZIP guide](../mathlive-derivatives-pilot/README.md) and its current keypad audit/results.

Branch: `experiment/mathlive-power-rule-pilot`.

This branch defaults to editable MathLive on the **AP Calculus Power Rule practice page only**. The generator, randomized distributions, higher derivatives, equivalence checker, scoring, feedback, explanations and practice selections are unchanged. The existing page has four added lines loading the pilot; its complete engine script matches the main baseline byte for byte.

## Try it on Windows

Download the experimental branch ZIP, extract it, and open a terminal in the extracted repository folder. Or use a separate clone:

```powershell
git clone --branch experiment/mathlive-power-rule-pilot --single-branch https://github.com/batchmath/BatchMathSite.git BatchMath-MathLive-Pilot
cd BatchMath-MathLive-Pilot
py -m http.server 8000
```

Open:

```text
http://localhost:8000/ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/
```

The default is MathLive. Explicit modes:

```text
http://localhost:8000/ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/?editor=mathlive
http://localhost:8000/ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/?editor=legacy
```

For the same initial question, add `&bm_seed=pilot` to each explicit-mode URL. These are separate page loads, not an in-place mode switch; switching URLs starts a new practice session. The existing RNG also supplies checker samples, so different answer histories can produce different later questions even with the same initial seed.

No npm install, build step, or new startup procedure is required. Serve from the repository root rather than opening the HTML with `file://`. MathLive and its fonts are local. The page's existing MathJax CDN dependency for questions and feedback is unchanged. Stop the server with Ctrl+C. No hosted preview or production deployment was created.

## What changed

Existing file modified:

- `ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/index.html`: stylesheet and module imports, with a scope comment.

New implementation files:

- `assets/mathlive/power-rule.mjs`: page-only boot and query selection.
- `assets/mathlive/answer-field.mjs`: source-input integration, focus, reset, submission synchronization, disabled state and fallback.
- `assets/mathlive/answer-adapter.mjs`: restricted structural parser and serialization; no evaluation, solving or simplification.
- `assets/mathlive/keypad-bridge.mjs`: maps a clone of the actual existing keypad to MathLive commands.
- `assets/mathlive/pilot.css`: field styling, responsive sizing and pilot-only visibility rules.
- `assets/mathlive/dependency-lock.json` and `assets/mathlive/vendor/mathlive/`: pinned MathLive 0.111.1 runtime, 20 WOFF2 fonts, package metadata and MIT notices (24 vendor files).

New verification and documentation:

- `tools/mathlive-power-rule/{engine.mjs,adapter.test.mjs,browser.mjs}`.
- `tools/mathlive-power-rule/artifacts/`: browser results JSON and 375/1600 px screenshots.
- This README and [TEST-RESULTS.md](TEST-RESULTS.md).

The parser, keypad bridge and vendored dependency originate from comparison commit `e4481a410a8c3c8b36376295514226e3215bf9b2`. No comparison UI, alternative editors, MathJax vendor bundle, Compute Engine, dependency installation or package-lock changes were brought into the application.

## Integration contract

The engine still reads and clears `#answer`, calls `BatchMathCalculusKeypad.reset()/focus()`, and handles its existing submit and Enter events. The adapter wraps only those two keypad methods in this page's runtime. It preserves the original legacy editor and keypad for recovery. Other engines do not import the adapter, and no existing shared JavaScript or CSS was edited.

MathLive owns editing, native slash capture, structural deletion, selection and undo/redo. Smart single-digit superscript exit, smart fences and removal of extra parentheses are disabled to retain explicit student structure. Right Arrow exits an exponent. MathLive's virtual keyboard stays manual and its toggle/menu controls are hidden. The actual `derivative-power` keypad layout is cloned, including all existing buttons; roots and functions can be typed or pasted without adding keys to that profile.

The field's exposed `keyboard-sink` part receives immediate DOM focus after `focus()`, addressing the pinned version's deferred focus. Enter reads the current MathLive value synchronously before dispatching the original source-input Enter handler. The Check button similarly synchronizes before the unchanged click handler. Batched input/change/blur notifications never grade. Question resets clear history before setting the new value, seeding a fresh undo baseline; a trailing, invisible TeX space avoids `setValue()` skipping an already blank value. A public `moveToMathfieldEnd` command also flushes 0.111.1's inline-shortcut snapshots: `resetUndo()` alone can otherwise restore a previous question's expression when a shortcut spans the reset. Existing global Enter protection remains in force, with a page-scoped repeat guard as well.

Fractions, nested fractions, unary signs, powers, fractional powers, grouping and supported functions are serialized structurally. Square roots use `sqrt()`. Nth roots lower to fractional powers because the existing checker has no `root()` identifier. The existing checker's `Math.pow` real-domain limitations are retained; this pilot does not extend its treatment of odd roots at negative radicands. Answer labels before the last `=` follow the existing normalizer's policy.

Empty slots stay malformed, e.g. `x^()` and `(1)/()`. An unsupported structure with no safe serialization uses a deliberately unparseable `?` for submission, never the last valid answer; the original LaTeX remains in MathLive. No expression is silently completed, reduced or evaluated.

### Existing grading details retained

Blank input prompts without consuming an attempt. Nonempty malformed/incomplete or unsupported input counts as incorrect. The current page does **not** have a separate non-consuming syntax-error outcome.

The current generators emit `pr-*` IDs. Their checker accepts equivalent unsimplified expressions. Its stricter expanded-polynomial requirement is conditioned on `pb*` IDs and is dormant for these generators. Both behaviors are retained; tests also exercise the existing `pb` formatting gate through a test-only fixture. This pilot does not silently add or remove simplification requirements.

## Fallback

The standard editor remains usable during loading. A missing runtime, missing fonts, missing pilot stylesheet, or refused initial legacy import leaves that editor and its current answer intact. Once mounted, command exceptions and errors attributed to the MathLive runtime restore the original editor and keypad, translating the current field back structurally. If the legacy grammar cannot represent it, a readonly, selectable textarea retains the exact LaTeX. The fallback notice appears only when needed.

These paths are browser-tested, including typing during delayed initialization, font failure with an existing answer, successful late import, runtime failure with a fraction, and unsupported LaTeX recovery. Fallback cannot recover from a whole-browser crash or a failure that stops JavaScript entirely. The pilot is not a new offline/PWA caching system.

## Verification and merge scope

See [TEST-RESULTS.md](TEST-RESULTS.md) for commands, counts, baseline comparisons and device limits. There are no shipping QA exports: tests instrument the actual page's closure in memory or in intercepted test HTML.

The only existing file that might conflict with later main/Unit 6 work is the Power Rule practice HTML above, if a cross-site update edits the same imports. The new `assets/mathlive/`, `tools/mathlive-power-rule/` and `docs/mathlive-power-rule/` namespaces are otherwise independent. No Unit 6 file or branch, shared keypad source, PWA/service worker, navigation, release metadata or deployment configuration was changed.

Recommendation: suitable for a small supervised classroom pilot after the teacher's local Windows/device check. Broader migration should wait for actual Chromebook, touch-device and assistive-technology testing. This implementation authorizes no other engine migration.
