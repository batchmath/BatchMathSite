# Import approved SAT and ACT questions

The **Prepare approved SAT and ACT questions** GitHub Action imports formal Shorts text approvals and opens a draft website PR. `main` and production Pages change only when you separately authorize and merge the reviewed PR.

## One-time setup

1. Review the website automation changes and approve adding them to the website’s `main`. GitHub only accepts manual dispatches after the workflow exists on the default branch. Start future Shorts work from a revision that includes `shorts/website_export.py`. The current integration branch is `codex/sat-act-approved-export` in `batchmath/Shorts`.
2. In `batchmath/BatchMathSite` under **Settings → Secrets and variables → Actions**, add these repository secrets. Use short-lived fine-grained credentials or an equivalent GitHub App token setup.

   | Secret | Selected repository | Repository permissions |
   | --- | --- | --- |
   | `SAT_ACT_SHORTS_READ_TOKEN` | `batchmath/Shorts` only | Contents read |
   | `SAT_ACT_SITE_PR_TOKEN` | `batchmath/BatchMathSite` only | Contents read/write and Pull requests read/write |

   GitHub also includes read-only metadata. The write token allows the PR to trigger the existing BatchMath QA workflow. Keep normal `main` protections and limit approval snapshot publishing and workflow dispatch to the owner or delegated maintainers.

## Each batch

1. Open the exact Shorts revision you reviewed. Run `review.bat` or `python -m shorts review`. In the server-backed question bank, review the question, answers, solution and flags, complete the text review checkboxes, enter your reviewer name and click **Approve** for each question. The private review file stays local. A separate approval on the video page is optional for website import and must pass the existing rendering gate.
2. Finish the review and commit any source changes in Shorts before taking approval. With an empty Git index, in the same Python environment you used to approve, run the commands below. The snapshot command allows the review server’s generated page changes. Repeat `--id <ProblemID>` to select a specific batch when the checkout contains older decisions. Use `--text-only` to export without optional video evidence.

   ```sh
   python -m shorts.website_export snapshot
   git add review/website-approvals.json
   git commit --only -m "Record owner approvals for website import" -- review/website-approvals.json
   git push
   git rev-parse HEAD
   ```

   Push to a branch in the **private** `batchmath/Shorts` repository. Commit only `review/website-approvals.json` in this commit. Its parent pins the reviewed source. Keep the original `review/reviews.json` local, and keep the snapshot and raw export out of the public website repository.
3. In `batchmath/BatchMathSite`, open **Actions → Prepare approved SAT and ACT questions → Run workflow**, select `main` and paste the full approval commit SHA into `shorts_approval_sha`. Check **dry_run** to generate the review files without pushing an import branch or opening a draft PR. Use the latest approval snapshot for the batch you intend to import.
4. Review the draft PR and wait for BatchMath QA. Its description lists the assigned numbers, permanent URLs and an artifact link. An existing open import PR must be resolved before another batch receives numbers. When you are ready to deploy, explicitly authorize and merge the tested PR through the normal release process.
5. Append `video-rows.csv` from the run artifact to the existing video worksheet, using one row per permanent `ProblemID`. Rows have blank URLs and `Pending` status. If a cue is blank, add the verified explanation start time before marking the row `Published`. Add the YouTube URL after publishing the Short. The website reads the sheet, and spreadsheet edits require no deployment.

## Verification and retries

The exporter re-runs the Shorts mathematical and standards gate using the recorded Python, SymPy, mpmath and Lark versions. The approval SHA and its parent are checked before export. The workflow validates record hashes, approval revisions, the registry, generated pages, and the sitemap, then checks desktop and phone layouts and practice-session behavior. It compares sitewide SEO against the starting revision and fails on any new or SAT/ACT-specific findings. The ordinary PR also runs the sitewide BatchMath QA workflow.

Temporary worktrees and output directories keep incomplete imports out of the branch. Previously registered IDs, including retired IDs, retain their numbers and URLs. New IDs are ordered alphabetically within the batch and appended after the highest reserved number. A retry reuses the approved candidate or reports that its IDs are already registered. If `main` advanced during verification, repeat the same workflow against the current base after the existing PR is resolved.

Video identity is optional. If a full narrated approval can be revalidated on the review machine, the staged import binds the cue to the pinned MP4, manifest and scene. An unavailable or stale video approval leaves the corresponding cue blank and the mathematical question can still be imported. In that case confirm the cue separately when you add the published link. The Google worksheet remains the source for public video associations.

An optional future Sheets API integration could append missing problem IDs using an account authorized to edit the worksheet. The public CSV is read-only, and the import works with the downloadable rows alone.

Batch 2 and Batch 3 need formal text approval records even where an owner comment already approved a rendered video. Use the current verified revision in the private Shorts branch. A review made against an earlier verifier, dependency version or changed record can become stale, in which case repeat the text review on the intended revision.
