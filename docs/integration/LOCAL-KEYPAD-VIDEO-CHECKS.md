# Local test checklist

Extract `batchmath-video-sizing-keypad-audit.zip`. Open a terminal inside
`BatchMathSite`, beside `index.html`, and run:

```sh
py -m http.server 8000
```

Open `http://localhost:8000/`. MathLive and its fonts are included locally;
the existing MathJax and YouTube services use the internet. Stop with Ctrl+C.

Use the answer appropriate to the problem currently displayed. The examples
below identify the forms to check; they are not answers to every random question.

1. **Inverse-chain derivatives.** In AP Unit 2 Comprehensive Review, select the
   inverse-trigonometric chain-rule practice type. For inverse secant/cosecant,
   check that absolute value is available and can enclose the complete inner
   expression. Try a correct derivative and a mathematically different answer.
2. **Exact and rounded intervals.** On Unit 3 calculator analysis and its review
   contexts, check exact radical/π endpoints when requested. Rounded questions
   should offer decimal controls and continue enforcing the stated precision.
   Enter interval brackets, stacked endpoint fractions, unions and infinity.
3. **Linearization decimals.** Check standalone Linearization/Differentials and
   the assignment review. A supported decimal such as `4.125` should be enterable
   when the question permits it. Tangent/Secant Approximations should still use
   an exact value followed by the separate classification choices.
4. **Degrees and radians.** In Calculus Prep Trig Angle Skills, switch between
   degree and radian reference angles. Check the displayed controls after math
   renders, after an incorrect answer followed by Next, and after a correct
   answer automatically advances. Degree answers should retain `°`; radian
   answers should have their exact π/fraction controls. Also switch through
   coordinate and coterminal-angle practice.
5. **Editable roots.** In fractional-power derivatives, relevant integrals,
   u-substitution and differential equations, enter a justified root form with
   the on-screen root control. Fill the index, move right into the radicand,
   then move outside the root. Check a root raised to another power, including
   a root in a denominator. Verify `+C` where required. Existing cube-root keys
   should continue working. θ-substitution should offer its square root.
6. **Multipart fields.** Advance through numeric, equation, list, interval and
   classification stages. Switch between fields and confirm their controls
   match the active field while earlier entries remain intact. Try Clear,
   cursor arrows, undo/redo, Check and Enter/Next.
7. **Mobile layout and focus.** Repeat at 320, 375 and 390px, then tablet and
   desktop widths. Buttons should fit and remain readable. Ordinary digits,
   deletion and cursor movement should not unexpectedly move the viewport.
   Fractions and roots can naturally change the answer field's height.
8. **Retained editor.** Add `?editor=legacy` to a practice URL and compare its
   grading. Pay particular attention to complete derivative answers containing
   powered indexed roots, rather than checking an isolated root fragment only.
9. **Videos and resources.** Check a large primary lecture, supporting galleries
   (including collections with only one or two supporting videos), and expanded
   homework/review recordings. Close a gallery player with Escape, its Close
   button and the backdrop; focus should return to the play button. Check the
   approved IM1 video order and starts, Unit 3 numbering, assignments and keys.

Unit 6 remains the unchanged source checkpoint and is outside this integration
audit. Automated video checks simulate YouTube's responses; human playback and
audio checks remain useful. Complete evidence and the 119-row correction
comparison are linked in [the audit report](../audits/KEYPAD-COMPLETENESS-FINAL.md).
