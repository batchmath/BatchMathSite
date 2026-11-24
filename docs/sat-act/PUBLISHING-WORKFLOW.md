# SAT & ACT Math Practice publishing workflow

| Decision | Record |
|---|---|
| Mathematical verification | The verified Shorts record, its answer key, source commit and hashes, and the independent content audit. The website imports the learner-facing content verbatim. |
| Authorization to publish a website question | For #001–#005, the BatchMath owner's signoff in `config/initial-website-release.json`. Future additions use the formal approved-export path below. |
| Narrated video approval | A formal Shorts review decision, recorded by its review server. |
| Website video association | The owner-managed public video worksheet. It supplies YouTube URLs, cue times and publication status for existing website questions. |

All `config/` and `records/` paths below are under `tools/sat-act/`. The initial set comes from Shorts
`22113846d3f83f10eef9a9c19f64b2e5848a9b6f` and the independent audit
`4409e16316a615216f48db31e896d58f9849b421`. The importer verifies the source answer key, record bytes,
scene digest, MP4 hash and timestamps. The website release manifest binds the complete imported records to their
permanent numbers and URLs. The import manifest preserves the source record and MP4 hashes. Both existing Shorts
approval fields in each initial record remain empty.

## Owner signoff for questions #001–#005

1. Review the five numbered pages in the ZIP or locally on the development branch.
2. In `tools/sat-act/config/initial-website-release.json`, replace only `"authorization": null` with the object
   below. Enter your GitHub username and the actual date of your decision. Commit the signoff from your GitHub
   account on the development branch. The digest binds your decision to the five entries above it, including their
   website record hashes and permanent URLs. Leave those entries as reviewed.

   ```json
   "authorization": {
     "decision": "authorize-website-publication",
     "owner": "<your GitHub username>",
     "authorizedOn": "<YYYY-MM-DD>",
     "recordsSha256": "6dbe044fc2518d5e23fc8673a11de93b350db8537b4c71035503f456a8964bc9"
   }
   ```

3. Build and review the authorized output below. A separate owner decision authorizes merging to production.
   The website signoff covers the five questions. Formal Shorts video approvals and website video associations have separate records.

## Set up the video worksheet

1. Download [the CSV template](video-publications-template.csv). In Google Sheets, create a spreadsheet and use
   **File → Import → Upload** to import the CSV into a worksheet named **SAT ACT Videos**.
2. Use **File → Share → Publish to web**. Select **SAT ACT Videos** in the worksheet menu and
   **Comma-separated values (.csv)** in the format menu. Publish that worksheet and keep automatic
   republication enabled under **Published content and settings**.
3. Copy the public CSV link from that dialog. It uses `docs.google.com`, a path ending in `/pub`, and
   `output=csv` in the query. Open the URL in a signed-out browser and confirm it returns the worksheet as CSV.
4. Provide that URL for the one-time setting in `assets/sat-act/video-feed-config.js`. The tested branch leaves
   the setting blank. Review the two links through the configured worksheet before authorizing deployment.

The template already includes #001 and #003 as Published. Its five permanent IDs and cue times come from the
[import manifest](../../tools/sat-act/records/IMPORT-MANIFEST.json). A public worksheet should contain the video
columns and any public metadata you choose to include.

## Publish or update videos

For an existing row, enter the YouTube Short, watch or youtu.be URL and select `Published` after confirming
that the Short explains the listed problem. The existing cue time is prefilled. Use `Pending` to take a video out
of rotation. When a new approved question is added to the website, append a row with its permanent
`ProblemID` and cue from the imported record. Use whole seconds, with `0` for the start of the video.

Sheet edits take effect on navigation or reload after the five-minute browser cache expires and Google republishes
the worksheet. An interrupted request can use the last valid snapshot for up to 24 hours. Without a usable
snapshot, students can still open the written solution. Unknown problems, invalid entries and duplicate problem
or YouTube IDs are excluded. Keep each problem on one row.

The sheet authorizes **video association** for existing registered questions. The owner's matching check pairs the
public video with the problem. The site uses the sheet's cue time and validates the association's fields.
The published stream's bytes are outside that check. The content approval gate continues to verify imported
mathematics and written solutions. Historical MP4 hashes and the hash-backed import workflow remain in the
repository. When the video worksheet is configured, it controls video availability.

## Check the configured feed in a browser

Before the first deployment with the sheet, serve the checkout on localhost and open the numbered questions.
In DevTools **Network**, confirm that the published CSV request succeeds from localhost, including any Google
redirects. On #001 and #003, check an answer and verify both explanation buttons appear. Click **Watch Video
Explanation** and confirm the player waits for Play at 0:19 or 0:20. Let the video finish and open the written
solution manually. A Pending question shows only **Show Written Solution** after checking an answer.

`npm run qa:sat-act-browser` tests the seeded CSV, invalid rows, cache refresh, and player behavior without a live
worksheet. `npm run qa:sat-act-browser -- --real-sheet` also checks cross-origin CSV access in Chromium against
the existing public BatchMath Problem of the Day worksheet. The first test above verifies the actual SAT/ACT URL
when it is supplied.

## Build and deploy after authorization

1. From the development branch at the owner-signed revision, install the QA dependencies and run the checks from
   the repository root.

   ```sh
   git switch codex/sat-act-explanation-controls
   git pull --ff-only
   npm install --no-package-lock --ignore-scripts --no-audit --no-fund
   npx playwright install chromium
   npm run sat-act:build
   npm run qa:sat-act
   npm run qa:sat-act-browser
   npm run qa:sat-act-release
   npm run qa:static
   npm run qa:analytics
   ```

   The release check must pass. A clean rebuild removes the notices from all 12 pages. Check the scoped SEO
   report and the recorded sitewide baseline failures in [the P2 audit](SAT-ACT-P2-REPORT.md). Register the GA4
   custom definitions before launch using [the analytics instructions](GA4-ANALYTICS.md).

2. Review the generated changes, stage the video feed config if edited, and commit and push the generated output.
   Deploy from the full Git tree, which includes the classroom downloads.

   ```sh
   git add tools/sat-act/config/initial-website-release.json assets/sat-act/video-feed-config.js sat-act-math assets/sat-act/catalog.js sitemap.xml
   git diff --cached --check
   git commit -m "Build authorized SAT and ACT practice release"
   git push origin codex/sat-act-explanation-controls
   ```

3. Once the owner authorizes production deployment, open a pull request from `codex/sat-act-explanation-controls` into `main`.
   Wait for the `BatchMath QA` check, including its SAT & ACT release authorization step. Review current `main`
   and resolve and retest any conflicts on the development branch. Merge only the candidate that passed review.
   GitHub Pages serves the root of `main` at `https://batchmath.net/`. The merge starts the existing Pages
   deployment automatically. Check that **Pages build and deployment** succeeds for the merge commit.
4. Verify the homepage link, library, five permanent questions and sitemap on the live site. Run a mixed session,
   check a linked video if present, and confirm the events in GA4 DebugView with the owner’s GA4 access. If a blocking
   issue appears, revert the release merge on `main` through the normal GitHub workflow and verify Pages rebuilds.

## Future approved Shorts exports

The existing [approved-export importer](APPROVED-EXPORT-SPEC.md) accepts recorded formal Shorts text approval.
Formally approved videos also require the matching text revision, media hash, scene digest and a publication entry in
`youtube-publications.json` under `publications`. Append new source IDs to `registry.json` with the next permanent
number, slug and title. Import verified approved additions and run the build and QA above.

```sh
node tools/sat-act/import-approved-export.mjs --export <path-to-approved-export.json>
npm run sat-act:build
```

Use `--replace` only for a complete approved export that intentionally supersedes the initial website records.
For a formal approved-export video, keep the verified approved MP4 hash with the corresponding export. The original
fixture import remains available for verification against a local Shorts checkout. Write the result to a scratch directory for comparison.

```sh
node tools/sat-act/import-shorts-fixtures.mjs --shorts <path-to-Shorts> --out <scratch-directory>
```
