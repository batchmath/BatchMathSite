# MathLive, videos, and content integration

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

### Stage C — verified progress checkpoint

Fresh integration runs pass 273/273 shared Node tests and 132/132 focused browser
checks, including 543 explicitly counted paired grading submissions and zero
page errors. Video QA passes 198 visits, 276 card activations, and seven
specialized checks. Content preservation and static QA pass again.

The strengthened overlap suite verifies physical typing and MathLive focus on
all 102 route/width combinations, with zero page errors. Overall it passes
101/102: multiplication at 375px has a Check-button overflow that reproduces
identically on the unchanged MathLive source (458px document width). This
preexisting source defect is retained under the resume instruction to fix only
integration regressions. Its failure is not suppressed or marked passing.

The fixed-delay Power Rule fixture race was corrected with controlled transport
release, preserving all assertions; the full suite subsequently passes 38/38.
All protected remote refs still match their before-integration values.

Remaining before final delivery: collect the full 138-route sweep rerun, IM1
Unit 3 comprehensive-review grading run, and representative AP Unit 5 dynamic
review run; finish the final audit; push the final evidence; package and verify
the complete static-site ZIP. These three browser runs are still in progress.
