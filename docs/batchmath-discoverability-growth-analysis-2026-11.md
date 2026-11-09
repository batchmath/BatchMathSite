# BatchMath discoverability and growth analysis (November 2026)

This is an analysis only. Nothing below has been implemented, and the website is unchanged by this report.

**How the evidence was gathered.** All findings come from four sources, examined on 2026-11-09:
- the `main` source at `d846d75` (v13.0.F);
- the live site at `https://batchmath.net` (which serves v13.0.F);
- page-by-page measurements made with scripts in a browser;
- web searches.

**What was not available**
- No Google Search Console, Google Analytics 4 or YouTube Studio data was accessible to this session: no connector is
  installed, and none was examined. Nothing below claims rankings, search volumes or traffic numbers. The only traffic
  figures are the October 1–28, 2026 baseline you supplied: 182 clicks, 3,005 impressions, 6.06% click-through rate.
- Search results were observed through a general web-search tool. They show which kinds of resources compete for an
  intent, but not positions in Google for a particular location or device.
- YouTube video descriptions could not be read: the session's network sends YouTube watch pages to a consent host it
  cannot reach. Video titles were read through YouTube's public oEmbed endpoint.

---

## A. Executive summary

BatchMath is technically clean, and its content is genuinely distinctive. The problem is that this content is hard to
see from where visitors land. The three most important opportunities follow.

1. **Make the practice engines the obvious next step on every page where students land.** The unlimited, randomized,
   answer-checked practice engines are the site's clearest advantage over the resources that rank for the same
   searches. Those competitors are mostly fixed quizzes, flashcards, study guides and PDF worksheets. Yet:
   - on 78 of the 80 topic pages that have practice, the practice links come after the videos and assignments, a median
     85% of the way down the page;
   - 131 of 132 practice pages link nowhere except back up the breadcrumb trail;
   - the static HTML of a practice page carries a median of only 82 words.

   Fixing this is mostly template work that Claude Code can do safely, with no redesign.
2. **Close the loop between YouTube and the website.** The site embeds 436 distinct BatchMath videos: 201 AP Calculus
   lecture, example and walkthrough videos, 216 FRQ solutions, 18 IM1 videos and 1 Mogollon video. YouTube is where BatchMath already has
   an audience, and that traffic keeps arriving long after a video is posted. Two links decide it:
   - **Video to website:** whether each description links to the matching BatchMath page. Only you can change this, and
     it could not be checked from here.
   - **Website to video:** whether the matching practice page links back to the video. Practice pages currently do not.
3. **Own the AP free-response season with the archive you already have.** The FRQ archive covers 38 exams with 216
   solution videos and, as of Phase 1, working 2026 scoring links.
   - In the web search for 2026 AP Calculus AB FRQ solution videos, the results were mostly low-quality mirror and
     aggregator pages; no clearly authoritative video series showed.
   - Your six 2026 videos, plus crawlable per-year pages, are a realistic opening, especially from March to May.
   - Today the whole archive is one 56,864-pixel-tall phone page, rendered by JavaScript.

---

## B. Confirmed problems (with evidence)

Each item is a verified fact about the site, not a design preference.

| # | Problem | Evidence |
| --- | --- | --- |
| B1 | **Practice is buried on topic pages.** Of the 90 topic pages, 80 link to practice, and on 78 of those the practice links come after the videos and assignments. | Static analysis of every topic page: the median position of the first practice link is 85% of the way through `<main>`. On a phone (390×844) the Chain Rule topic page, `/ap-calculus/unit-2-derivatives/topics/the-chain-rule/`, is 3,440 px tall, and its three practice links start at about 2,800 px. |
| B2 | **Practice pages are dead ends.** 131 of 132 indexable practice pages have no links except breadcrumbs and "← back". | They lack links to the topic's lecture video, to sibling engines (for example "Chain Rule Derivative at a Point Practice"), to the calculator / non-calculator counterpart, and to the next topic. One example is `/ap-calculus/unit-6-applications-integration/topics/area-below-and-between-curves/calculator-practice/`. |
| B3 | **Little crawlable text where it matters.** Practice pages have a median of 82 words in `<main>`; 64 indexable pages have fewer than 80; the home page has 51. | Static audit of all 276 indexable pages. Medians: topic pages 160 words, practice pages 82, section pages 86. The second intro sentence of every practice page is internal wording, for example "Practice The Chain Rule with the same generator logic used in the comprehensive review, focused on this topic." |
| B4 | **The home page does not say what BatchMath is for.** It shows a 9-word heading ("Math instruction, practice, videos, worksheets, and resources.") and four course cards. | It does not mention the interactive answer-checked practice, worked solutions, the AP FRQ archive, free use without accounts, or anything for teachers. There are no direct links to popular practice or exam prep. |
| B5 | **The Problem of the Day and Mogollon archives are not in the HTML.** Both load their problems from published Google Sheets (CSV) in the browser, on a single URL each. | `archive/archive.js` (`SHEET_URL`) and `mogollon2026/mogollon2026.js` (`SHEET_CSV_URL`). There are no per-problem URLs, and the `<main>` HTML has 67 and 84 words. Google can render JavaScript, but it recommends server-side or static rendering for content that should be indexed ([JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)). |
| B6 | **The PDF worksheets are hard to find in search.** Of 290 assignment and answer-key PDFs, 229 have no title metadata and 39 are titled "Scanned Documents". 104 have almost no extractable text on their first two pages (scanned images). | Checked with `pdfinfo` and `pdftotext` on every PDF under `ap-calculus/` and `im1/`. A PDF that does appear in results is shown under that title. |
| B7 | **The header image is oversized on every page.** `assets/batchmath-portrait.jpg` is 520×850 px and 116 KB, but is shown at about 118×145 CSS px (twice per page, at most 236×290 device pixels on a 2× screen). | It accounts for 117 KB of every page's first visit, live and measured, the largest single item on non-practice pages. On a phone the two portraits and the logo take the top ~300 px. |
| B8 | **The FRQ archive is one very long JavaScript-rendered page.** On a phone it is 56,864 px tall (all 38 exams shown), and its static HTML has 236 words; the 228 questions are drawn by `frq-data.js`. | There is no URL per year or per question, so a search for "2015 AP Calculus AB FRQ 3" can only land on the whole archive, or on YouTube. |
| B9 | **Embedded videos and resource clicks are not measured.** GA4 events cover the practice engines only: `practice_started`, `problem_generated`, `answer_checked`, `answer_correct`, `solution_revealed`. | Per GA4's own help, enhanced-measurement video events fire only for YouTube embeds with JS API support ([Enhanced measurement events](https://support.google.com/analytics/answer/9216061?hl=en)). The site's embeds do not set `enablejsapi=1`. Assignment, answer-key, FRQ and scoring links carry `data-bm-resource` attributes, but nothing reports clicks on them. |
| B10 | **The repository's own SEO check fails on `main`** (`npm run qa:seo`, 32 findings). | The ten Unit 1 topic pages skip from H1 to H3. `archive/problem-list/` and `mogollon2026/problem-list/` lack Open Graph and Twitter tags, JSON-LD and a visible breadcrumb. `mogollon2026/` lacks a visible breadcrumb. |
| B11 | **Calculus Prep has no videos.** Its 11 skill areas have 0 embedded videos, whereas AP Calculus has 201 lecture, example and walkthrough videos and IM1 has 18. | Count of `data-video-id` and YouTube embeds per section. |
| B12 | **Small items** | The sitemap has no `<lastmod>`. A stale URL, `/mathanimate/tutorial/`, still appears in search results; it returns 404 with `noindex` and will drop out. The 2026 FRQ page anchors were wrong (fixed in Phase 1); the pre-2023 FRQ anchors are template values that have not been checked. |

**Verified strengths: keep these.**
- **Sitemap.** It lists exactly the 276 indexable pages; no indexable page is missing and no listed page is non-indexable.
- **Page signals.**
  - Every indexable page has a self-referencing canonical, a unique title and description, and one H1.
  - 273 have BreadcrumbList JSON-LD.
  - No page is orphaned.
- **Server behaviour.**
  - A missing page returns a real 404.
  - URLs without a trailing slash get a 301.
  - HTTPS uses HSTS, and pages are compressed (78 KB of HTML transfers as 22 KB).
- **Loading.**
  - MathJax is `defer`, GA `async`, and MathLive a module.
  - Layout shift was measured at 0 to 0.002 on the pages tested.
  - Practice pages show a problem immediately, with no start button.
- **Access and privacy.**
  - No accounts are needed.
  - Analytics sends no student identity, typed answers or problem text.

---

## C. Recommended improvements (ranked)

Ratings are relative judgements, not forecasts. **Impact** is the expected effect on useful student or teacher traffic
and engagement; **Confidence** is in the evidence that it helps.

| Rank | Action | Impact | Confidence | Effort | Risk | Claude Code alone? | Needs from you |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A "Practice this topic" block near the top of every topic page (B1) | High | High (usability); medium (search) | Low (template) | Low | Yes | Approval |
| 2 | Related links on practice pages: the lecture video, sibling engines, the calculator / non-calculator counterpart, the next topic (B2) | High | High | Low–medium | Low | Yes | Approval |
| 3 | YouTube descriptions, pinned comments and end screens pointing to the matching BatchMath page | High | Medium | Medium, done once, in batches | None | No | Your time in YouTube Studio; Claude can prepare the full video → page list |
| 4 | Publish the six 2026 FRQ videos, then a crawlable 2026 FRQ page with official links, the videos and links to matching practice | High (Mar–May) | Medium | Medium | Low | Partly | The six video URLs |
| 5 | A one-paragraph, student-facing description on each practice page: what it covers, calculator or not, answer format. This replaces the internal-wording sentence (B3) | Medium | Medium | Medium (276 pages, done in reviewed batches) | Low | Draft yes; publish after your review | Review |
| 6 | Home page: a two-sentence statement of what BatchMath offers, plus three entry paths (Practice by topic · AP exam prep · For teachers) (B4) | Medium | Medium | Low | Low | Yes | Wording approval |
| 7 | PDF title metadata for the 290 worksheets, taken from their link text (metadata only; content untouched) (B6) | Medium (teachers) | Medium | Low (scripted) | Low | Yes | Approval |
| 8 | Measurement: register the GA4 custom dimensions, a `resource_click` event, and `enablejsapi=1` for video events (B9) | Enables everything else | High | Low | Low (needs a regression check of the video layout) | Code yes | GA4 admin steps (section H) |
| 9 | Resize the header portrait (WebP plus JPEG fallback, about 240×392) (B7) | Low–medium (mobile speed) | High | Low | Very low | Yes | Approval |
| 10 | Fix the 32 `qa:seo` findings (B10) | Low | High | Low | Very low | Yes | — |
| 11 | Per-year FRQ pages (38), each with real content: official links, classification, the 6 videos and links to matching practice. College Board question text is not reproduced (B8) | Medium | Medium | Medium | Low | Yes | Approval of the page design |
| 12 | Problem of the Day and Mogollon: build static HTML from the sheets at release time, and link each problem to its practice engine (B5) | Medium (long-term) | Medium | Medium–high | Medium (changes the publishing workflow) | Yes | Decide whether the sheets stay the source of truth |
| 13 | A "For Teachers" page explaining assignments, keys, walkthrough videos and how to use the practice engines in class | Medium (teachers) | Medium | Low–medium | Low | Draft yes | Your voice and approval |
| 14 | Accurate sitemap `<lastmod>` from the git history (B12) | Low | Medium ([Google uses lastmod only when consistently accurate](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)) | Low | Very low | Yes | — |
| 15 | `VideoObject` structured data on topic pages whose lecture video is the main content | Low–medium | Low (check the Search Console Video indexing report first) | Medium | Low | Yes | Search Console data first |

**Deliberately not recommended**
- **Practice Problem or Quiz structured data.** Google has removed support for practice-problem rich results (see the
  [documentation updates](https://developers.google.com/search/updates)).
- **Bulk rewrites of titles or descriptions.** 154 of the 276 titles exceed 60 characters, but titles should be changed
  only where Search Console shows impressions with a low click-through rate.
- **Mass-produced keyword pages.** Google's scaled-content abuse policy covers pages produced at scale without added
  value ([Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)).

---

## D. Quick wins (low risk, implement first)

1. **"Practice this topic" block on topic pages** (rank 1).
   - A compact row of the topic's existing practice links, placed right after the topic description, above the videos.
   - The full lists further down stay as they are.
   - It is one template change, applied by the existing page builders, and is testable with the existing browser
     tooling.
2. **Related links on practice pages** (rank 2). Under the problem area, add:
   - "Watch the lesson" (the topic page's lecture);
   - other practice for the topic;
   - the calculator or non-calculator version, where both exist (Units 3, 5 and 6);
   - next topic →.

   All the data already exists in the topic pages and the unit navigation.
3. **Header portrait resize** (rank 9). Saves roughly 100 KB on every first page view, with no visual change.
4. **PDF titles** (rank 7). For example, "More Chain Rule — Assignment | AP Calculus AB | BatchMath". It is a scripted
   metadata edit, verified file by file, and touches no page content.
5. **Measurement first** (rank 8, with your GA4 steps). This lets every other change be judged on evidence.

The `qa:seo` fixes (rank 10) can ride along with any of these.

---

## E. Medium-term improvements (next 1–3 months)

- **AP season (January–May).**
  - The 2026 FRQ page as soon as your videos are up (rank 4), then the per-year FRQ pages (rank 11).
  - Link each FRQ type to the practice that builds the skill; for example, Area and Volume → Unit 6 area, cross
    sections and solids; Differential Equation → Unit 5 separable equations and slope fields.
  - The new May 2027 exam-format block (Phase 1) can be linked from the AP Calculus landing page.
- **Student-facing practice descriptions** (rank 5).
  - In batches, starting with the pages Search Console shows getting impressions.
  - Each description is written to be accurate to that engine. For example, the Unit 6 Area page: calculator and
    non-calculator versions; typed integral setups; graph shown or not.
- **Home page and For Teachers page** (ranks 6 and 13).
- **Problem of the Day and Mogollon** (rank 12).
  - A build step that turns the published sheets into static HTML: one page per problem, or one page per topic.
  - The live sheet stays the editing tool.
  - Each problem links to its matching practice engine and video.
- **A possible teacher feature (needs your design decision).** The engines already support reproducible problem sets
  (`?bm_seed=`, used today for QA and "Report a Problem"). A "Share these exact questions" link would let a teacher
  assign the same set to a class.

---

## F. Content strategy

**Improve existing pages before adding new ones.** Priority order, once Search Console data is available:
1. **Topic and practice pages with impressions but a low click-through rate.** Improve the title and description of
   those specific pages only.
2. **Pages at positions 8–20.** Strengthen their on-page content (rank 5) and internal links (ranks 1–2).
3. **Pages with clicks but no `answer_checked` events.** These are a landing-experience problem.

**Where BatchMath is differentiated** (observed in the search results; no volume data):
- **"[topic] practice problems" searches.** For example, the searches checked for chain rule, cross sections,
  separable differential equations and slope fields mostly returned:
  - fixed quizzes and flashcards: Varsity Tutors, Save My Exams;
  - study guides: Fiveable, TutorChase;
  - static problem lists: num8ers;
  - many low-quality PDF mirrors.

  BatchMath offers unlimited problems with typed answers, immediate checking and worked solutions, plus a matching
  lecture video and keyed assignment. That combination should be stated plainly on the page.
- **AP free-response by type.** Few free resources organize past FRQs by type with a video per question. BatchMath's
  By Type view plus 216 videos is unusual.
- **Free keyed unit assignments for teachers.** Searches for AP Calculus unit reviews with keys returned mostly paid
  products: Fiveable, Teachers Pay Teachers, Lesson Planet. BatchMath's assignments, keys and homework walkthroughs are
  free. That only matters if teachers can find and identify them (ranks 7 and 13).

**Long-tail opportunities a newer site can realistically compete for.** These are specific, high-intent searches where
BatchMath has a precise matching page:
- calculator and non-calculator split practice, for example "area between curves calculator practice";
- "volume by cross sections semicircle practice";
- "solids of revolution washer method practice";
- "separable differential equations initial condition practice";
- year-and-question FRQ searches, for example "2024 AP Calculus AB FRQ 3".

These are hypotheses to test against your Search Console queries, not measured demand.

**Reuse what you already produce**
- **FRQ videos.** Keep the consistent title pattern ("2026 AP Calculus AB FRQ #1 - Rate"). Put the BatchMath FRQ page
  link and the matching practice link in the first two lines of the description.
- **Lecture and homework walkthrough videos.** Description line 1: the topic page; line 2: the practice page.
- **Problem of the Day and short-form videos.** Point the Instagram bio and Shorts descriptions at one stable "start
  here" URL, for example the AP Calculus landing page or the Problem of the Day archive. Use one link that never
  changes, rather than a different link per post.
- **100 Miles of Calculus.** Tag each mile's problem with its topic, and link it to the topic's practice engine. The
  series becomes a doorway into the course rather than a one-off event.
- **New resources only with evidence.** Add one only when Search Console shows impressions for a topic BatchMath does
  not cover, or when a teacher need is clear.
  - **Calculus Prep videos** (B11) are the most natural addition, because those pages already have engines but no
    instruction.

---

## G. Measurement plan

**Baseline (before any change)**
- **Search Console:** the last 28 days and the previous 28 days, and a fixed comparison with your October 1–28 baseline
  (182 clicks, 3,005 impressions, 6.06% CTR).
- **GA4:** the same two 28-day windows.
- Record the date of each change, using GA4 annotations or a short log in `docs/`.

**What success looks like for each change**

| Change | Primary metric | Comparison |
| --- | --- | --- |
| Practice block on topic pages | Share of topic-page sessions that reach a practice page (GA4 path exploration); `practice_started` per topic-page session | 4 weeks before vs 4 weeks after, same weekdays |
| Related links on practice pages | Practice pages per session; `answer_checked` per session; sessions with 2 or more engines | 4 vs 4 weeks |
| Practice descriptions | Search Console impressions, clicks and click-through rate of the edited pages vs similar unedited pages | 6–8 weeks; recrawl takes time |
| YouTube descriptions | GA4 sessions with source `youtube.com` (or `utm_source=youtube`) and their `answer_checked` rate | Monthly |
| 2026 FRQ page and videos | Search Console queries containing "2026" and "frq"; FRQ page sessions; FRQ resource clicks | Seasonal: compare March–May 2027 with what can be learned from 2026 |
| PDF titles | Search Console impressions and clicks on `.pdf` URLs; GA4 `file_download` (if enhanced measurement is on) | 8 weeks |
| Header image | Field Core Web Vitals in Search Console (needs enough traffic); otherwise lab measurements | Before vs after |

**Seasonality.** AP Calculus traffic is likely to rise in spring and around school terms. Compare equal windows, and
expect noise at the current traffic level, about 6 clicks a day.

**Additional measurements worth adding.** All are privacy-preserving, with no student identity.
- **`resource_click` events.** Send one with `resource_type` from the existing `data-bm-resource` attribute
  (assignment, answer key, video, FRQ, scoring, playlist) and the page path. This shows teacher-style use of the PDFs.
- **YouTube embed events.** Add `enablejsapi=1` to the embeds so that GA4's built-in video events fire (`video_start`,
  `video_progress`, `video_complete`).
- **A UTM link convention** for links you place on YouTube and Instagram, for example
  `?utm_source=youtube&utm_medium=video_description&utm_campaign=frq`. The canonical tags already keep these URLs from
  being indexed separately.
- **Do not add** session recording, fingerprinting, or anything that collects typed answers or names.

---

## H. Your action items (in order)

1. **Search Console exports.** In Search Console → Performance → Search results, compare the last 28 days with the
   previous 28 days, then export:
   1. **Queries** (all rows).
   2. **Pages** (all rows).
   3. **Devices.**
   4. **Pages** filtered by **Device = Mobile**.

   Also export these reports:
   - **Indexing → Pages:** the "Why pages aren't indexed" table, with examples.
   - **Indexing → Video pages**, if present.
   - **Sitemaps:** a screenshot showing discovered vs indexed.

   A CSV or Google Sheets export is fine.
2. **GA4 exports, same two windows.**
   - Reports → Engagement → **Pages and screens** (views, users, engagement time).
   - Engagement → **Events** (event count by event name).
   - Acquisition → **Traffic acquisition** by session source/medium, showing `youtube.com`, `instagram.com` and
     `google`.
   - Retention → **New vs returning users**.
3. **GA4 settings** (Admin → Data display → Custom definitions → Create custom dimension).
   - Register the event-scoped custom dimensions `engine_id`, `course` and `answer_result`, plus `resource_type` once
     added.
   - Until they are registered, the practice events cannot be broken down by engine in reports, so register them now.
     Data is only collected from that point forward.
   - Also confirm, under Admin → Data streams → Enhanced measurement, that **outbound clicks**, **file downloads** and
     **video engagement** are on.
4. **YouTube.** Start with the 216 FRQ videos and the lecture videos.
   - In each description, put the matching BatchMath page in the first line and the practice page in the second.
   - Add a pinned comment with the same link, and an end screen linking the next video.
   - Claude Code can generate the complete list of video ID → BatchMath page → matching practice page from the site's
     data, so this is copy-and-paste work.
   - Also set the channel's Links section and the Instagram bio to one stable BatchMath URL.
5. **Record and publish the six 2026 FRQ videos.** Send the URLs, and they go into `frq-data.js`.
6. **Decide what to approve.** In order:
   1. the quick wins (section D);
   2. the 2026 FRQ page;
   3. per-year FRQ pages;
   4. the static Problem of the Day and Mogollon pages;
   5. the For Teachers page.
7. **Optional: add the site to Bing Webmaster Tools.** It can import your Search Console verification. This gives a
   second source of query data at little cost.

---

## Next steps Claude Code can implement (proposed order)

1. **Measurement.**
   - The `resource_click` event.
   - The video-embed JS API parameter, with a regression check of the existing video layouts.
   - A one-page note on the GA4 custom dimensions.
2. **Quick wins 1–4.**
   - The practice block on topic pages.
   - Related links on practice pages.
   - Portrait resize.
   - PDF titles.

   Then the `qa:seo` fixes. Each is a separate commit on a review branch, tested with the existing browser QA.
3. **The YouTube link sheet.** A CSV of every embedded video: video ID and title, the page it appears on, and the
   matching practice page, for your description updates.
4. **The 2026 FRQ page,** when the videos exist.
5. **Practice-page descriptions,** in reviewed batches, ordered by Search Console impressions.
6. **After your decision:** per-year FRQ pages, static Problem of the Day and Mogollon pages, the home page entry
   paths, and the For Teachers page.

---

## Appendix: method and sources

**Site audit**
- **Source pages.** Every `index.html` outside `tools/`, `docs/` and `node_modules/` (288 files) was parsed from `main`
  (`d846d75`). The audit read:
  - titles, descriptions, canonicals, robots meta and refresh redirects;
  - headings, JSON-LD types and words in `<main>`;
  - internal links, YouTube embeds and `data-video-id` attributes.

  The results were checked against `sitemap.xml`.
- **Live site.** It was checked with `curl` (status codes, redirects, headers, compression) and in Chromium with phone
  emulation.
- **Page weight.** Measurements cover first-party bytes only. The session could not reach the MathJax CDN, Google Tag
  Manager or YouTube, so those requests are excluded, and timings are indicative only.
- **Phone screenshots.** They used the local copy of `main`, with MathJax served from a local copy.
- **PDFs.** All 290 were checked with `pdfinfo` and `pdftotext` (pages 1–2).
- **Video titles.** They came from the YouTube oEmbed endpoint; for example, "2025 AP Calculus AB FRQ #1 - Value" by
  BatchMath (@batchmath7898).

**Search observations** (general web search, November 2026; not location-specific rankings)
- **Topic practice intents** (chain rule, cross sections, separable differential equations, slope fields): Varsity
  Tutors, Fiveable, Save My Exams, TutorChase, num8ers, Achievable and Khan Academy, plus many low-quality PDF mirror
  pages.
- **2026 FRQ solutions:** mirror and aggregator pages (findtube.ai, hollywoodcamerawork.com) and early written solutions
  (num8ers); no clearly authoritative video series surfaced.
- **FRQs by topic:** Cognito (by topic), TI (by question), Fiveable (guides).
- **Teacher unit reviews with keys:** mostly paid (Fiveable, Teachers Pay Teachers, Lesson Planet); free sources include
  apmath.github.io and Wayground.
- **A search restricted to batchmath.net returned indexed pages,** including the home page, topic pages, a practice page
  and the FRQ archive. It also returned the removed `/mathanimate/tutorial/`.

**Google and Analytics guidance**
- Google Search Central:
  - [Understand JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
  - [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
    (`lastmod`)
  - [Video SEO best practices](https://developers.google.com/search/docs/appearance/video)
  - [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies) (scaled content abuse)
  - [Simplifying the search results page](https://developers.google.com/search/blog/2025/06/simplifying-search-results)
    and the [documentation updates](https://developers.google.com/search/updates) (removed structured-data features,
    including practice problems)
- Google Analytics Help:
  [Enhanced measurement events](https://support.google.com/analytics/answer/9216061?hl=en) (video events require JS
  API support on YouTube embeds).
