# Reused-field question history isolation

The final audit reproduced an editor-only regression on real Unit Circle and Advanced Trigonometric Limits pages. Type `12`, select/delete it, Undo, clear through the keypad, then change Practice Type while the answer is empty. Undo on the new question restored visible `12` from the previous question. The underlying legacy input was also empty at the transition, so the native bridge's value-change optimization did not reset MathLive's history.

The shared native bridge now observes the site's existing public `BatchMathRepro.problemCount`. Only a changed problem counter resets MathLive's Undo and inline-shortcut snapshots; ordinary DOM/MathJax changes, focus and answer editing retain the current history. It preserves the field's current LaTeX before importing any changed source value. No generator, checker, normalization, scoring or accepted-answer contract changes.

`tools/mathlive-sitewide/history-browser.mjs` uses uninstrumented generators, local MathLive, real cached MathJax, physical typing/deletion/Undo, the actual Clear button and visible Practice Type controls at 375px. Both original cases fail before the correction and pass afterward. An additional IM1 decimal-practice case advances its real one-minute timer using Playwright's clock, then uses Practice Again / Start Practice; its reused empty field also starts with clean history. Same-question Undo and subsequent new-question typing remain functional. All three checks pass with zero page errors.

Evidence: `tools/mathlive-sitewide/artifacts/history-browser-before.json` and `history-browser.json`. The before artifact intentionally retains the two reproduced failures. These are targeted browser checks, not a claim about every possible editing sequence or physical device.

After the correction, the complete shared Node run passes 273/273 tests. Focused limits, IM1 value/form, IM1 structured and Prep browser reruns pass 27/27 checks, with 387 paired submissions and zero page errors; fallback and answer-preserving recovery remain covered. The remaining existing suite groups are unchanged by this native-bridge-only correction.
