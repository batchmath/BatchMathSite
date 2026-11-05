# Small keypad corrections

Base: `3be72d67ec339d32554306c68b75ca41d32d566b`, branch `migration/mathlive-batch1-derivatives`. No new engine conversion, ZIP, deployment, main change or Unit 6 branch change.

## Infinity appearance

Newton's standalone infinity controls added by `newton-controls.mjs` had `bm-calc-key function`, but lacked `math-infinity-key`; consequently they missed the existing mathematical-font rule in `calculus-keypad.css`. MathLive clones the legacy pad, so it inherited that omission.

Existing signed-infinity controls in shared calculus already carried the class. The separate Unit 1 pad (including parameter-field pads), AP renderer's local fallback pad and IM1 interval pad did not. These builders now mark only their already-existing infinity controls. The central `site.css` rule makes the mathematical font/weight/size available to local pads that do not use the calculus stylesheet. It matches the existing calculus rule. No dimensions, grid placement, padding or insertion callbacks change. No infinity control is added to any profile.

Static inspection of standalone infinity key definitions found these paths; infinity shown in questions, choices or limit-template subscripts is not treated as a standalone insertion key. Shared calculus uses its existing class; MathLive retains it through cloneNode. The AP fallback annotation was source-inspected; live browser tests cover shared calculus, Newton in both editors, the separate Unit 1 builder and IM1 interval entry.

## IM1 numeric multipart fraction entry

Only the local `numberEntries` array in `im1-unit3-practice.js` gains an `a⁄b` button using its existing literal-insert action with `/`. This enables accepted fractional responses such as `18/2` for common difference 9. Numeric multipart fields remain ordinary numeric text fields; this correction does not introduce another editor or change their checker. Division is displayed as `18/2`, consistent with their existing accepted syntax. Other formula/equation/recursive layouts are unchanged.

The browser selects an actual generated common-difference-9 problem, enters all multipart answers using only keypad clicks, then repeats for two further generated questions. It verifies active-field focus, correct grading and the actual Next button.

## Unit Circle comma

`BMExactEditor.mount` now accepts `allowList:false`; the default retains comma. Unit Circle alone supplies false. Its single-value checker is unchanged; exact trig values and Undefined still pass. Trigonometric Equations retains the same comma button and insertion behavior. Typed/pasted commas are not silently removed from answers.

## Focused verification

- **7/7 Chromium browser checks pass**, zero unhandled page errors.
- Newton MathLive and legacy, at 1400 and 375 px: both signed infinity insert correctly, use the math font/17.28 px computed size, and preserve button width/height when compared with the same button without the marker. Narrow page overflow is checked and a screenshot saved.
- Shared calculus, separate Unit 1 and IM1 interval paths: class/font and existing insertion checks. IM1 interval is also viewed at 375 px.
- Three actual IM1 multipart questions, including keypad-only `18/2`, actual grading, focus and Next progression.
- Unit Circle exact/Undefined acceptance, absent comma; Trig Equations comma present and usable.
- Browser tests use Linux Chromium and real locally hosted MathLive/fonts. External MathJax/CDN requests are blocked for these button/input checks; the screenshot's question TeX may therefore be untypeset. No checker is mocked. Actual Windows/touch/assistive-technology testing is not claimed.

Commands: `NODE_PATH=/path/to/playwright/node_modules node tools/keypad-corrections/browser.mjs` (Chromium at `/usr/bin/chromium`; local Python server uses 8170), and `node tools/keypad-corrections/ftc-probe.mjs`.

## Optional FTC investigation

Six focused checker cases plus 20 generated FTC correct/wrong pairs pass against the unchanged Unit 4 checker. `2xsec(x^6)` and its MathLive translation are accepted when the expected expression is `2*x*sec(x^6)`. Missing factors, argument-versus-function powers and a mismatching expected expression remain incorrect. The original rejected generated question is unavailable, so its historical rejection cannot be classified confidently as a contextual mathematical error or a former translator issue. No current format rejection was reproduced and no checker modification is justified. Record any recurrence with its exact question/answer before extending this investigation.

Reports: `tools/keypad-corrections/artifacts/browser.json`, `infinity-375.png`, and `ftc.json`. Initial test attempts selected choice-only/first-quadrant fixtures and were corrected to reach the actual interval and Undefined paths; only the completed successful run is counted.
