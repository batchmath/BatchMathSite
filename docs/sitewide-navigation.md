# BatchMath sitewide navigation test

GitHub Pages and remote main reported production commit `c7f0e012f28907adde742be946e63f77cfa940a4` at the start of the work. The review branch incorporates the IM1 mapping from `claude/im1-standardize-sections-no-notes` and uses the current production Unit 4 scope. The discoverability analysis at `claude/ap-calc-exam-info-2026` informed the practice links and analytics. Its chain-rule and area examples were checked against the versions already on main.

## Coverage

- 362 HTML pages inspected. The update modifies 321 existing pages and adds eight section pages. The other 33 pages retain their original HTML.
- 323 TOPICS menus, 141 centered Jump to Topic selectors replaced, 124 topic pages with practice near the introduction, and 165 engines with related links.
- The 165 first-party engine pages cover 92 AP Calculus AB, 62 IM1 and 11 Calculus Prep engines. The Calculus Prep skill pages already contain their engine and link to the other skills.
- The 17 SAT & ACT pages keep their existing filters and question navigation. The AP exam and course hubs use their existing navigation. The homepage, archives, utility pages, and topic pages without an engine have no extra practice launch unless they have a verified destination.
- Eight section pages complete the IM1 Unit 1 and Unit 2 organization. All existing page routes are retained. The 12 unlinked IM1 notes PDFs have been removed. The static audit checks 23 Unit 4 assignments and 23 answer keys against the published hashes and verifies the 22 Unit 4 engines.
- The [page inventory](sitewide-navigation-coverage.csv) gives the disposition of each route. The [IM1 standard](IM1-NAVIGATION-STANDARD.md) lists every section and part.

## Regeneration

Run `npm install --ignore-scripts --no-audit --no-fund` in the checkout. After generating course pages, run `npm run nav:build`. This reapplies the IM1 labels, builds TOPICS and the practice links from the original curriculum order and verified engine destinations, and updates the sitemap. Run `npm run qa:site-navigation` to check for stale markup or broken curriculum links. Set `BM_NAV_BASELINE` to a checkout of the existing production site to add byte comparisons for practice scripts, embed markup, Practice Type values and PDFs.

For a new AP Calculus unit or Calculus Prep skill, put the topic links in teaching order on its existing landing page. For IM1, define the units, sections, parts, and reviews in `tools/im1-nav/structure.mjs`. Use `tools/site-navigation/practice-copy.mjs` for a skill-specific intro when the existing intro is generic. Keep problem and grading scripts in their existing components.

The SEO build accepts `--page=relative/path/index.html` for a targeted metadata refresh. It reads the current IM1 breadcrumb mapping and retains a practice page's existing static introduction. Repository QA now expects the advanced MathLive experiment to remain noindex. The production SEO baseline had 32 findings, including ten AP Unit 1 heading gaps and missing archive metadata and breadcrumb markers. The update adds a lecture heading above the affected grids, supplies metadata and breadcrumbs on the two running documents, and aligns the Mogollon archive breadcrumb with its metadata. The updated sitemap includes 350 indexable pages.

## GA4

`resource_click` records assignment and answer-key PDF clicks, practice and related-practice clicks, lesson and exam-prep links, and opens of instrumented video covers. Parameters are `resource_type`, `destination_category`, `course`, `unit` and `topic` when available. Values come from the resource and published curriculum labels. The event uses the existing GA tag and reads no form values or problem content.

In GA4, under **Admin → Data display → Custom definitions**, register event-scoped custom dimensions for `resource_type`, `destination_category`, `unit`, `topic`, and `course` if it is not already registered. Use the `resource_click` event in reports and confirm it with DebugView after an approved rollout. GA4 enhanced measurement may independently report downloads under `file_download`.

The release measures opening a cover. Start, progress and completion would require testing the YouTube IFrame API and enhanced-measurement settings across the modal, click-to-load and inline players. The existing video IDs, URLs and playback behavior remain in place.
