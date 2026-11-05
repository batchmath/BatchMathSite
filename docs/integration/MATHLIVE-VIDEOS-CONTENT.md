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
