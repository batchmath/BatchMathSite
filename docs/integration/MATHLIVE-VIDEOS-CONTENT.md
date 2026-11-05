# MathLive, video and review corrections — final tested state

The current correction audit supersedes the historical integration results
below. Checkpoints A, B and C are complete and pushed; D verifies their combined
behavior. The previous multiplication overflow is fixed, and the current IM1
responsive result is **102/102**. All implementation files match tested source
`96309582a69ea7c8b38d51156ae75ea47baf65b2`; the delivery URL is pinned to the
final pushed audit commit. Nothing has been merged into main or deployed.

| Final verification | Result |
|---|---|
| MathLive Node | **274/274** |
| Routes / default, legacy, missing runtime | **374/374 visits, 138 routes** |
| Broad ordinary-key stability | **118 typed routes, 708 activations** |
| Detailed responsive/focus stability | **130/130, 16 controllers, 27 URLs** |
| Focused mathematical browsers | **132/132, 543 counted grader pairs** |
| IM1 overlapping content pages | **102/102 widths and typing/focus** |
| Review instructions | **416/416 browser checks; 144,100 generated questions, 99 contexts** |
| Video | **66 pages, 198 visits, 288 simulated activations** |
| Preservation | **34 overlaps, all 90 IM1 pages, 96 exact HTML + 15 guarded video layouts, all PDFs** |
| Static/reference checks | **Zero errors, warnings or broken references** |
| Unit 6 | Exact tree from `919ca1806f07e3cd2af552142926e7ca2b78e8d5` |

Video checkpoint A is intact: one designated lecture remains large and inline;
multiple designated lectures follow the established collection count rule.
Supporting examples/proofs form one subordinate gallery and always open the
shared modal, even for one or two cards. Proof context, assignment-specific
walkthroughs and all 13 IM1 recordings remain preserved. Pages without a
primary lecture retain the one-large/two-medium/three-plus-gallery rule.
The [66-page ledger](../audits/VIDEO-HIERARCHY.md) lists all 15 changed pages.

Keypad fixes address MathLive host scrolling, hidden-source focus, IM1 card
transforms, intrinsic field height, the broad multiplication Check minimum
width, legacy input stacking and clipped continuation rows. Shared policy covers
16 controllers; original failures were directly reproduced on multiplication,
Power Rule, sequence formulas, basic integrals and legacy IM1 equation/interval
inputs. No grader, translator, token mapping or answer-history contract changes.
See [causes and measurements](../audits/KEYPAD-STABILITY.md).

Mixed Derivatives retains authored quotient-simplification, derivative-order,
implicit-differentiation, domain and complete-simplification instructions.
The audit records 5,352 family/selector/contract groups; 93 changed records
represent 47 distinct family/instruction combinations. All original question
IDs, answers, solutions, variables and distributions are preserved. There is
no genuine derivative-by-limit family in the existing review; that curriculum
coverage gap is documented without manufacturing an answer/method mismatch.
Standalone deliberately simplified directions are unchanged.
See [the instruction ledger](../audits/COMPREHENSIVE-REVIEW-INSTRUCTIONS.md).

[Full final audit and limitations](../audits/VIDEO-KEYPAD-REVIEW-CORRECTIONS.md)
and [machine results](../audits/evidence/FINAL-QA.json) provide exact evidence,
including the initial historical-source guard failure and its fresh all-pass
rerun. YouTube responses are simulated; actual external availability/audio and
universal physical-device/browser behavior are not claimed. Unit 6 and observed
source/main refs are unchanged.

Download the commit-specific ZIP linked in the final delivery response. Extract
it, open a terminal beside `index.html`, run `py -m http.server 8000`, and open
`http://localhost:8000/`. The local package contains all site pages/resources and
pinned MathLive files. Normal MathJax CDN and YouTube use require internet.

---

The following material is retained for traceability. Its older 101/102 layout
result and preserved-overflow limitation do not describe the corrected build.

# Historical integration audit through 535527a

This records the integration audit through checkpoint
`535527a172b4a2e4c26d9cf970a6d061e7802849`. The subsequently authorized video,
keypad and instruction corrections are tracked in the
[current correction audit](../audits/VIDEO-KEYPAD-REVIEW-CORRECTIONS.md).

## Source checkpoints and scope

- Integration branch: `integration/mathlive-im1-videos-content`.
- MathLive base: `919ca1806f07e3cd2af552142926e7ca2b78e8d5`.
- Video/content source: `bba32f929d6630d096bc4510ceafd586ab8c4a53`.
- Common ancestor: `26ec4f15185c37f9e8843e96a09d583b47babcdf`.
- Both source heads were fetched explicitly and matched the requested checkpoints.
- A normal two-parent merge preserves both source histories. All 34 recalculated
  overlapping IM1 practice paths produced textual conflicts. Content fragments
  were reconciled against the common ancestor while retaining the MathLive
  implementation; whole-file `ours`/`theirs` resolution was not used.

## Unit 6 exclusion

The entire `ap-calculus/unit-6-applications-integration/` tree was explicitly
restored from the exact MathLive base before the merge commit. Its five content
branch video-presentation page changes are excluded. Unit 6 video adoption and
MathLive compatibility work are deferred until the independent Claude work is
ready. Shared video assets are included for the approved courses/units.

No Claude Unit 6 branch was fetched or merged. No source branch or main is to be
modified, and this work does not authorize deployment or a production release.

## Checkpoints

Stage A resolves the merge and restores Unit 6. Shared Node regressions, rendered
route checks, video/browser checks, and content preservation verification follow.
The initial static check found seven metadata/indexing errors on the preexisting
`experiments/mathlive-advanced-notation/index.html`; source-baseline verification
and final results will be recorded below before delivery.

### Stage B — combined behavior and test scope

- `tools/integration/content-preservation-qa.py` verifies all 34 overlaps:
  executable script bodies/import order and input/selector contracts exactly
  match MathLive; links and headings match the approved content source.
- All 90 IM1 HTML pages retain content-source headings and link destinations,
  with zero notes links. All 111 changed, nonoverlapping in-scope content HTML
  files exactly match their content-source blobs. PDFs and IM1/MathLive code
  assets remain unchanged.
- Video QA covers all 13 approved videos, now including explicit title, order,
  player title, thumbnail, accessible play label, and 0:00 assertions for all
  five IM1 collections. Unit 6's five video pages are explicitly deferred.
- Two historical IM1 Node assertions compared entire HTML files against a
  premigration checkpoint. They correctly rejected the newly authorized content
  edits. They now compare every executable script/import, style block, and
  input/selector tag against the completed MathLive source; original shared
  generator/checker equality and all grading assertions remain intact. The
  independent content audit checks the authorized headings, links, and notes
  removal against the other source, rather than ignoring their changes.
- The seven scratchpad static failures reproduce on the untouched MathLive
  source. The scratchpad now declares `noindex, nofollow`, as appropriate for
  the existing development experiment. Static QA subsequently passes with zero
  errors, zero warnings, and zero broken internal references. No curriculum or
  mathematical behavior was changed to repair this preexisting metadata defect.
- Focused browser output can now be saved to a separate integration evidence
  directory, preserving the historical source-branch reports.

### Stage C — final integration results

**Ready for local human testing with one documented preexisting mobile layout
failure. This is not an all-green responsive result.** No confirmed integration
regression remains, and no mathematical runtime/generator/checker was changed
during final QA.

Tested implementation/harness checkpoint: `904641f8d06a15c138957b26cb3631c64584c775`.
The site/runtime files are byte-identical to the Node-tested integration
checkpoint `5b9b9fb488ea8d60ddadf082a36449355695c709`; subsequent commits change
only test harnesses, documentation, and evidence. The final delivery report and
manifest record the exact pushed audit commit and ZIP checksum. The final audit
commit adds no site behavior changes.

| Verification | Historical MathLive source baseline | Fresh integration result |
| --- | --- | --- |
| Shared Node suite | 273/273 | **273/273**, zero failures/skips/cancellations |
| Full route sweep | 374/374 across 138 routes | **374/374 across 138 routes**, zero page errors |
| Default / legacy / missing runtime | 118 per mode | **118 / 118 / 118**, plus 20 specialized visits |
| Focused functional Chromium suites | 132 checks | **132/132**, 543 counted paired submissions, zero errors |
| All 34 overlap routes at 375/768/1280px | Not this integration-specific suite | **101/102** overall; **102/102 physical typing and focus**, zero page errors |
| IM1 Unit 3 comprehensive review | Historical source evidence only | **1/1 route**, 81 signatures, **462 pairs**, zero page errors |
| AP Unit 5 non-calculator dynamic review | Historical source evidence only | **1/1 route**, 63 signatures, 95 typed parts, **161 pairs**, zero page errors |
| Video presentation | Separate content-branch evidence | **198 visits**, 276 activations, seven specialized checks, zero page errors |
| Static QA | Source scratchpad failed seven metadata checks | **Zero errors, warnings, or broken internal references** |
| Content preservation | Separate source features | **34 overlaps, 90 IM1 pages, 111 exact nonoverlap HTML pages** |

These are new tests on this integration, not copied historical passing counts.
The three functional browser groups explicitly count **1,166 paired submissions**
in total, in addition to Power/Basic functional checks that do not expose a pair
counter. Tests exercise physical typing and keypad entry; fractions, exponents,
roots, subscripts, equations, exact/decimal/form-sensitive responses; correct,
incorrect, blank and incomplete grading; dynamic profiles; Enter/Next, focus,
multipart responses, reset/history and recovery. Source mathematical assertions
remain intact.

IM1 Unit 2 content/math QA additionally passes 150,000 generated problems and
165,062 independent semantic checks. Unit 3 QA passes 9,200 generated problems
across 23 practice engines. All 290 PDFs remain present and unchanged. Assignments,
keys, practice/video links, section/part headings and navigation match the
approved content source; student-facing notes links remain removed.

#### Failures and corrections retained in evidence

- The initial sweep passed 273/374; all 101 failures were 6,000ms navigation
  timeouts under concurrent expensive QA, with zero page errors. A fresh full
  run with `SWEEP_CONCURRENCY=1` passes all 374 with the original assertions.
  The final report is a complete run, not an overlay of selected reruns.
- The first Power Rule run passed 37/38. A fixed 800ms fixture delay could end
  before physical legacy typing. Controlled transport release now waits until
  typing is complete; all successful-import/answer-preservation assertions
  remain, and the full suite passes 38/38. No site runtime changed for this fix.
- **Unresolved preexisting defect:** multiplication practice at 375px has a
  458px document width because its existing `.check { min-width: 180px }` rule
  also applies to the MathLive Check button. The field/keypad container fit,
  but Check extends beyond the viewport. The exact MathLive source reproduces
  the same dimensions after MathJax and fonts settle. This is preserved under
  “Fix genuine integration regressions only.” Both responsive runs retain the
  failure; it is neither suppressed nor called passing. Focus and physical
  typing work in that case as well.

#### Videos and deferred Unit 6

All 13 IM1 videos retain their approved IDs, titles, order, thumbnail URLs,
accessible Play labels and 0:00 starts, including the corrected fractional-
coefficients / two-step ordering. The permanent large / pair / gallery rule
passes at 375, 768 and 1280px: 67 single-video collections, six pairs and three
galleries across 66 in-scope video pages (61 with standard collections).
Modal sizing, keyboard/focus, Escape, backdrop, Close, player removal/stop,
lazy iframe creation, reuse, intentional offsets and the seven in-scope
homework/proof/review controls pass. YouTube responses were simulated: actual
external recording availability and audio playback were not verified.

The entire Unit 6 tree has **zero differences** from
`919ca1806f07e3cd2af552142926e7ca2b78e8d5`. Its five pending shared-player
adoption pages are excluded, as is its specialized comprehensive-review video
page: six video-bearing pages and 13 HTML pages are separately deferred and
never counted as integrated rollout passes. Unit 6 video adoption and MathLive
verification await the independent Claude work.

#### Isolation and limits

Remote heads for main, both source branches, and all seven observed Claude
branches match their before-integration values. Only the integration branch was
pushed. The two-parent merge history is preserved. No deployment, production
merge, release publication, or live-file update was performed.

Tests used Chromium 154.0.8037.57, Node 24.19.0, Python 3.12.14, real local
MathLive 0.111.1/fonts, and real MathJax 4.1.3/NewCM through the fixture transport.
No physical-device, assistive-technology, universal-browser, exhaustive
mathematical-equivalence, or offline/PWA certification is claimed. Normal local
use still needs network access for existing MathJax and YouTube transports.

#### Evidence and reproduction

- [Consolidated results](evidence/summary.json)
- [New Node run](evidence/node-tests.tap) and [summary](evidence/node-summary.json)
- [Full route sweep](evidence/route-sweep.json), [initial failures](evidence/route-sweep-initial.json)
- [Overlap responsive result](evidence/overlap-responsive.json), [source reproduction](evidence/multiplication-preexisting-overflow.json)
- [Focused browser results](evidence/focused-browser/summary.json), [Power initial failure](evidence/power-initial.json)
- [IM1 comprehensive review](evidence/im1-review-unit3.json), [AP dynamic review](evidence/ap-review-dynamic.json)
- [Video result](evidence/video-presentation.json), [static result](evidence/static-qa.txt)
- [Content preservation](evidence/content-preservation.json), [protected refs](evidence/protected-refs.json)

```sh
node --test --test-reporter=tap --test-concurrency=2 tools/mathlive-sitewide/*.test.mjs tools/mathlive-power-rule/*.test.mjs tools/mathlive-derivatives-pilot/chain.test.mjs tools/mathlive-batch1/*.test.mjs tools/mathlive-advanced-pilot/*.test.mjs
MATHJAX_FIXTURE_ROOT=/path/to/real-fixture SWEEP_CONCURRENCY=1 REPORT_SUFFIX=-integration node tools/mathlive-sitewide/route-sweep.mjs
MATHJAX_FIXTURE_ROOT=/path/to/real-fixture node tools/integration/overlap-responsive-qa.mjs
MATHJAX_FIXTURE_ROOT=/path/to/real-fixture MATHLIVE_REGRESSION_OUT="$PWD/docs/integration/evidence/focused-browser" python3 tools/mathlive-sitewide/final-browser-regressions.py pilots
MATHJAX_FIXTURE_ROOT=/path/to/real-fixture MATHLIVE_REGRESSION_OUT="$PWD/docs/integration/evidence/focused-browser" python3 tools/mathlive-sitewide/final-browser-regressions.py contracts
MATHJAX_FIXTURE_ROOT=/path/to/real-fixture ROUTE_INDEX=4 REPORT_SUFFIX=-integration node tools/mathlive-sitewide/im1-review-unit3-browser.mjs
MATHJAX_FIXTURE_ROOT=/path/to/real-fixture ROUTE_INDEX=5 RECOVERY=1 REPORT_SUFFIX=-integration node tools/mathlive-sitewide/reviews-dynamic-browser.mjs
BM_CHROMIUM_EXECUTABLE=/usr/bin/chromium node tools/video-presentation-qa.mjs
python3 tools/integration/content-preservation-qa.py
npm run qa:static
```

The real fixture root contains `mathjax/` and `mathjax-newcm/`, as described in
the source final audit; fixture caches are test-only and excluded from delivery.
The overlap command intentionally exits nonzero while the documented preexisting
375px failure remains.

#### Local test delivery

The final commit-specific ZIP contains the complete static website, all site
assets, practice pages, PDFs and pinned local MathLive libraries. Git metadata,
untracked caches, QA tools and screenshot/evidence archives are excluded; the
full QA evidence remains in Git. The ZIP is not committed into the repository.

Extract it, open a terminal inside `BatchMathSite`, and run:

```sh
py -m http.server 8000
```

Open `http://localhost:8000/`. Use the IM1 Unit 2 video pages and practice links,
IM1 Unit 3 section navigation, and `?editor=legacy` on practice routes. Stop the
server with Ctrl+C. This is a human test build with the known mobile issue above;
no production merge or deployment is authorized or performed.
