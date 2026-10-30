# BatchMath review lab

Developer-only tools for reviewing a build in real browsers and checking the math independently. They were
built for v12.8.U and v12.8.V and are kept here so later builds and site-wide reviews start ready.

- **Not shipped.** `.gitattributes` marks this folder `export-ignore`, so `git archive` and the site ZIP leave it out.
- **Nothing large is committed.** Libraries, baseline checkouts and results live in `REVIEW_HOME`
  (default `~/.cache/batchmath-review-lab`), outside the checkout.

## Setup (once per clone or session, about a minute)

```bash
tools/review-lab/setup.sh
```

It downloads pinned MathJax 4.1.3 (plus the New Computer Modern font), KaTeX 0.16.11, SymPy 1.14.0 and mpmath 1.3.0
into `REVIEW_HOME`. It also:
- links the preinstalled Playwright into `node_modules/`;
- links MathJax into `node_modules/`, so the repo's own browser QA tools work too;
- writes `REVIEW_HOME/env.sh` with the `KATEX_DIR` the repo's q-* tools need.

It is safe to re-run. It needs npm and PyPI access. If Playwright is not preinstalled, it prints the install command.

## Tools

All commands run from the repo root. Browser tools serve the site themselves, load MathJax from `REVIEW_HOME` (not
the CDN), and report console errors. Set `BM_ROOT=<folder>` to run them on another version of the site.

| Command | What it checks |
| --- | --- |
| `tools/review-lab/qa/run-nobrowser.sh [tree] [out]` | every script in `qa:nobrowser`, separately, with pass/fail and time |
| `tools/review-lab/qa/run-browser.sh [tree] [out] [tool…]` | the repo's browser QA tools, each with a time limit |
| `tools/review-lab/qa/compare.sh <baseline-out> <new-out>` | new failures vs fixed vs pre-existing (with "same first error?") |
| `tools/review-lab/baseline.sh [ref] [name]` | checks out another version (default `origin/main`) into `REVIEW_HOME/trees/<name>` for comparisons |
| `tools/review-lab/overflow/scan-all.sh <w> <h> [mobile] [out] [list\|all]` | scroll boxes, clipped or spilling math, page overflow, with real scrollbars, on 53 practice pages (or every page with `all`) |
| `node tools/review-lab/overflow/scan-page.mjs <page> [n] [w] [h] [mobile]` | the same for one page |
| `node tools/review-lab/gallery.mjs [1366x768 390x844m …]` | screenshots of 10 hard Unit 4 cases with explanations open, plus scroll-box, MathJax and error counts |
| `tools/review-lab/keypad/matrix.sh` | keypad-only entry on the four typed Unit 4 engines at 4 sizes, plus Review modes |
| `node tools/review-lab/keypad/entry.mjs <slug> [n] [w] [h] [mobile]` | keypad-only entry on one page (`BM_SELECT=mode` for the Review) |
| `node tools/review-lab/keypad/keyboard-entry.mjs <slug> …` | physical-keyboard entry with Enter and Check, the missing + C note, MVT lists in either order |
| `node tools/review-lab/invtrig-keys.mjs [w] [h] [mobile]` | sin⁻¹ … csc⁻¹ keys: label fit, insertion, editing, arrows, backspace; product/quotient pages have none |
| `node tools/review-lab/ftc/report-case.mjs` | the 2xsec(x^6) keypad case and related right and wrong answers |
| `node tools/review-lab/ftc/repro.mjs [n]` | generated FTC answers with a factor before a function, by keypad, keyboard, Enter and Check |
| `node tools/review-lab/ftc/landing-check.mjs` | FTC topic page: practice buttons' section and order, links, HW videos, overflow |
| `tools/review-lab/sympy/run.sh [n]` | independent SymPy/mpmath check of n problems per typed Unit 4 engine |
| `python3 tools/review-lab/zip/build-verify.py <commit> <version>` | builds the site ZIP with git archive and verifies every file, Windows paths and the version |
| `tools/review-lab/zip/serve-check.sh <zip> [version]` | extracts the ZIP, serves it with `python -m http.server 8000`, checks pages at laptop and phone size |

Results and screenshots go to `REVIEW_HOME/out/`. Set `REVIEW_OUT` to put them elsewhere.

## A typical build review

1. Run `setup.sh`, then `baseline.sh` to get `origin/main` for comparison.
2. Run `qa/run-nobrowser.sh` and `qa/run-browser.sh` on the baseline tree and on this checkout. Then run
   `qa/compare.sh` on the two output folders. Only new failures are regressions; the rest fail on main too.
3. For layout changes, run `overflow/scan-all.sh` at `1366 768` and `390 844 mobile` on both trees (`BM_ROOT` for
   the baseline). Then run `gallery.mjs`, and look at the screenshots, not only the counts.
4. For answer checking or keypads, run `keypad/matrix.sh`, `keypad/keyboard-entry.mjs`, `invtrig-keys.mjs` and the
   repo's own `npm run qa:unit4-final-four` and `npm run qa:ftc-checker`.
5. For generator changes, run `sympy/run.sh 500`.
6. For packaging, run `zip/build-verify.py <commit> <version>`, then `zip/serve-check.sh <zip> <version>`.

## Lessons these tools encode

- **Headless Chromium hides scrollbars.** A plain screenshot misses scroll boxes that students see on Windows and
  ChromeOS. Layout tools launch with `browser({scrollbars:true})` and measure `scrollHeight`/`scrollWidth` too.
- **`overflow-x:auto` also makes `overflow-y` auto.** MathJax boxes stick out 3–9 px past the line box, so short
  math becomes a vertical scroll box. Inline elements and MathJax's hidden assistive MathML are skipped when
  measuring, because they report sizes that are not drawn.
- **MathJax 4 wraps in-line math at `mjx-break`.** Its `white-space` comes from
  `mjx-container[jax="CHTML"] mjx-break`. `\allowbreak` works, `\nobreak` does not, and `{…}` keeps a group on one
  line.
- **Keypad entry is the real student path.** `lib/keypad.mjs` turns the displayed TeX into key presses (fractions,
  exponents, functions, inverse trig). The editor's serialization can differ from typed text: `2xsec(x^(6))`
  exposed the v12.8.V parser bug.
- **Always compare against main before calling a failure new.** Several repo tools already fail or time out on
  main: as of v12.8.V, 8 non-browser scripts and newton-sums, approximation-sigma and v128k/l/m/p.
- **Never put a second copy of the site inside the checkout.** The repo's QA scripts walk every page. A baseline
  worktree or an extracted ZIP inside the checkout made `qa:analytics` and `qa:display` count every page twice.
  That is why everything generated lives in `REVIEW_HOME`.
- **`pkill -f pattern` can kill the shell that runs it.** Anchor the pattern, as in `pkill -f '^python3 -m http.server'`.

## Adding to it

- **Shared helpers.** `lib/browser.mjs` has `serve`, `browser`, `context`, `open`, `recordGenerated` (exposes the
  last generated problem as `window.__bmLast`) and `outDir`. `lib/keypad.mjs` has the keypad driver.
  `lib/engines.mjs` loads the generators in Node.
- **Gallery cases** are listed at the top of `gallery.mjs` as `[name, slug, variant, optional subtype test]`.
- **Overflow page list.** `overflow/pages.txt` holds the 53 shared-style practice pages.
