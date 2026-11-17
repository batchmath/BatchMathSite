# SAT & ACT Math Practice publishing workflow

| Decision | Record |
|---|---|
| Mathematical verification | The verified Shorts record, its answer key, source commit and hashes, and the independent content audit. The website imports the learner-facing content verbatim. |
| Authorization to publish a website question | For #001–#005, the BatchMath owner's signoff in `config/initial-website-release.json`. Future additions use the formal approved-export path below. |
| Narrated video approval | A formal Shorts review decision, recorded by its review server. |
| Narrated video publication | The owner's manual upload to YouTube and the recorded ID, publication date and SHA-256 of the exact uploaded render. |

All `config/` and `records/` paths below are under `tools/sat-act/`. The initial set comes from Shorts
`22113846d3f83f10eef9a9c19f64b2e5848a9b6f` and the independent audit
`4409e16316a615216f48db31e896d58f9849b421`. The importer verifies the source answer key, record bytes,
scene digest, MP4 hash and timestamps. The website release manifest binds the complete imported records to their
permanent numbers and URLs. The import manifest preserves the source record and MP4 hashes. Both existing Shorts
approval fields in each initial record remain empty.

## Owner signoff for questions #001–#005

1. Review the five numbered pages in the ZIP or locally on `codex/sat-act-launch`.
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
   The website signoff covers the five questions. Video approvals remain in Shorts and actual YouTube publications
   are logged separately.

## Add a public YouTube Short

When a Short is public, open its link in a signed-out browser and confirm it is the matching problem. For a URL
such as `youtube.com/shorts/<ID>`, `youtube.com/watch?v=<ID>` or `youtu.be/<ID>`, copy the 11-character ID.
In `tools/sat-act/config/youtube-publications.json`, add one entry to `initialWebsitePublications` with the
corresponding `sourceId`, real `youtubeId`, SHA-256 of the uploaded MP4 in `mediaSha256`, and actual public date
in `publishedOn` (`YYYY-MM-DD`). The audited hashes are in
[`records/IMPORT-MANIFEST.json`](../../tools/sat-act/records/IMPORT-MANIFEST.json). The build checks the hash,
scope, ID format and uniqueness, and date. Leave the array empty for any Short still awaiting publication.
A YouTube URL cannot prove which local file was uploaded, so confirm the MP4 before recording the entry.

| Question | `sourceId` | Explanation start |
|---|---|---|
| #001 | `right-triangle-trig-s0031` | 0:19 |
| #002 | `radical-equation-s0003` | 0:16 |
| #003 | `system-no-solution-s0001` | 0:20 |
| #004 | `reverse-percent-s0001` | 0:23 |
| #005 | `circle-radius-s0001` | 0:18 |

The start is the first whole second at or after the on-screen countdown ends, no later than the first spoken
explanation line. Changing the upload can invalidate this timing. After editing the publication file, rebuild and
run SAT & ACT QA. In a browser, answer the linked question incorrectly, confirm the player waits for Play at the
expected start, and confirm the written solution opens at the end. The written solution is always available. A
question without a published video needs no setup and opens its written solution after an incorrect answer.

## Build and deploy after authorization

1. From the development branch at the owner-signed revision, install the QA dependencies and run the checks from
   the repository root.

   ```sh
   git switch codex/sat-act-launch
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

2. Review the generated changes, stage the publication config if edited, and commit and push the generated output.
   Deploy from the full Git tree, which includes the classroom downloads.

   ```sh
   git add tools/sat-act/config/initial-website-release.json tools/sat-act/config/youtube-publications.json sat-act-math assets/sat-act/catalog.js sitemap.xml
   git diff --cached --check
   git commit -m "Build authorized SAT and ACT practice release"
   git push origin codex/sat-act-launch
   ```

3. Once the owner authorizes production deployment, open a pull request from `codex/sat-act-launch` into `main`.
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
If one of the five moves to the formal video approval path, move its publication entry to `publications` with the
verified approved MP4 hash and import it with the corresponding approved export. The original fixture import remains
available for verification against a local Shorts checkout. Write the result to a scratch directory for comparison.

```sh
node tools/sat-act/import-shorts-fixtures.mjs --shorts <path-to-Shorts> --out <scratch-directory>
```
