# Keypad viewport and sizing audit

Scope: all 16 shared MathLive controllers, 26 selected routes (27 distinct URLs, including the legacy Prep comparison) across
AP Calculus Units 1–5, IM1 Units 1–3 and Calculus Prep. Unit 6 is excluded.
The complete route/field inventory is in
[the regression manifest](../../tools/integration/keypad-stability-routes.json).

## Confirmed causes and corrections

| Cause | Measured behavior | Correction |
|---|---|---|
| MathLive 0.111.1 public `focus()` discards FocusOptions and calls host `scrollIntoView`; cursor/delete commands also request host scrolling | With the answer scrolled above a visible keypad at 375×480, baseline maximum viewport shifts were 38px on multiplication, 100px on Power Rule and 402px on sequence formulas; corresponding legacy controls were 0px | Focus the exposed `keyboard-sink` part with native `preventScroll`; suppress the public host-scroll callback only during one synchronous keypad action and restore its exact previous value |
| Programmatic focus of clipped source inputs scrolls before their focus-event redirect | Blank Check on basic integrals moved scrollY from 846 to 526 before the redirect | Route source-input programmatic focus directly to the visible editor in all three shared adapters and in the legacy static/dynamic calculus keypad |
| Global navigation-card hover/active transforms also affect IM1 exercise `section.card` containers | Holding a key moved both question and keypad; the displacement scaled with zoom | Disable those transforms only for exercise sections containing a keypad input |
| Empty MathLive fields change intrinsic height when the first glyph appears | Approximately 1px mobile and 2.84px at 200% CSS zoom | Reserve 56px mobile / 64px desktop minimum field height |
| Multiplication's broad `.check {min-width:180px}` also styles the cloned keypad Check | A 375px viewport produced approximately 458px document width | Scope the geometry rule to the original separate `#checkBtn.check`; the keypad Check uses its shared grid sizing |
| Fixed-height keypad grid rows clip a two-row continuation | In legacy IM1 equation and interval input, Check Answer covered Clear | Let desktop/mobile rows grow beyond their original 32/48px minimums, so every continuation row contributes to keypad height |
| Positioned MathJax hit boxes can cover the legacy IM1 input | A real desktop pointer click missed the answer field | Position the existing legacy input in the same stacking context; physical pointer/typing is checked in Chromium |

Focus, physical typing, selection, mathematical command mappings, translations,
graders and history lifecycles are retained. There are no production
`window.scrollTo` compensation calls, vendor edits, disabled pointer events or
changes to mathematical generators/checkers.

## Measurement and regression method

[The browser regression](../../tools/keypad-stability-qa.mjs) uses real local
MathLive and MathJax. It captures scrollX/Y, visualViewport offsets/dimensions,
question/field/keypad/Check bounding rectangles in both screen and document
coordinates, focus, field height, active-pad identity and pad DOM mutations.
Measurements begin at the actual pointerdown/touch activation, after any
intentional automation navigation has settled. Held pointer activation catches
ancestor `:active` transforms.

Repeated digits, signs, decimal, cursor movement, delete and Clear are measured,
plus fractions, powers and roots where available. Every typed route exercises
physical keyboard input. Mouse, touch emulation, MathLive and legacy modes,
320/375/390/768/1280px widths, root CSS zoom 125/150/200% and desktop-to-mobile
resizing are included. CSS zoom is an emulation, not a claim about every browser's
native zoom UI. Actual mobile-device testing remains a manual follow-up.

A 2px tolerance covers subpixel geometry. Structural input may cause only its
measured local field-height reflow. Grading/question progression is classified
separately. A new validation message may expand its measured stage container
and trigger browser anchoring while the keypad stays at the exact same screen
position; this is recorded explicitly rather than treated as an ordinary-key
failure. User wheel scrolling must still work.

The original baseline is a positive control: the four selected multiplication
cases fail the new assertions before these corrections. Short-viewport probes
also reproduce the original MathLive scroll requests; visible-field controls
at 375×667 do not reproduce that specific focus-scroll problem. Initial probes
that overlapped smooth scrolling were discarded and replaced with settled,
instant-navigation measurements.

## Reproduction

```sh
MATHJAX_FIXTURE_ROOT=/path/to/cache node tools/keypad-stability-qa.mjs
```

The cache contains `mathjax/tex-chtml.js` (4.1.3) and `mathjax-newcm/` font files.
`STABILITY_FILTER` (comma-separated substrings), `STABILITY_MODE`,
`STABILITY_WIDTH`, `STABILITY_REPEATS` and `REPORT_SUFFIX`
select focused cases without overwriting the full report.
`STABILITY_BASE_REF=9c395be` serves the eight relevant baseline files for a
before/after positive control; this is intended for the multiplication baseline.

Final checkpoint measurements and exact totals are recorded in the correction
report and accompanying evidence. The shared historical source guards allow
only these precise focus/CSS changes and still compare every mathematical
command, source-input contract, generator and checker.

The route sweep also runs an ordinary-key viewport probe on every editable
MathLive route in the 138-route inventory, in addition to this detailed matrix.
The legacy algebra Prep page has no on-screen keypad; its comparison uses the
retained unit-circle exact editor/keypad. Native algebra typing remains covered
by the established Prep browser suite.
