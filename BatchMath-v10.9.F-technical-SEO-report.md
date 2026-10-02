# BatchMath v10.9.F Technical SEO Report

## Scope

This release is a technical SEO pass on the complete v10.9.E site. It preserves the student-facing design, course sequence, assignments, practice-generator logic, question distributions, answer checking, keypads, explanations, analytics events, and offline behavior.

The implementation follows current Google Search Central guidance for:

- [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls);
- [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap);
- [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro);
- [title links](https://developers.google.com/search/docs/appearance/title-link);
- [snippets and meta descriptions](https://developers.google.com/search/docs/appearance/snippet);
- [breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb);
- [site names](https://developers.google.com/search/docs/appearance/site-names);
- [organization markup](https://developers.google.com/search/docs/appearance/structured-data/organization);
- [video markup](https://developers.google.com/search/docs/appearance/structured-data/video);
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).

## Baseline audit

The v10.9.E baseline contained:

- 285 HTML files;
- 242 indexable canonical pages;
- 43 noindex pages, including 40 unfinished Integrated Math 1 Unit 4–11 placeholders;
- 242 sitemap URLs;
- 107 indexable pages without JSON-LD;
- 100 internal links that created tracking-only from=topic or from=unit-practice URL variants;
- one crawlable orphan: Nested Chain Rule Practice, linked only by JavaScript;
- repeated wording in several titles and nine titles longer than 85 characters;
- two public pages without complete social-image metadata and 53 pages with incomplete Twitter metadata;
- generic Unit 3 practice descriptions and practice pages without concise crawlable context;
- one H1-to-H3 heading-level skip;
- public Integrated Math 1 navigation that still advertised or linked unfinished Units 4–11.

The existing sitemap and robots.txt were fundamentally sound. The sitemap already contained exactly the 242 intended canonical pages, and robots.txt allowed crawling and referenced the sitemap.

## Changes made

### Crawlability, canonicals, and internal links

- Every indexable page now has one absolute HTTPS canonical URL on the preferred batchmath.net host.
- All canonical routes use the site’s directory-style trailing-slash convention.
- The 100 tracking-only internal URL variants were replaced with clean links.
- Back, topic, and practice navigation behavior remains intact because those parameters did not change page content.
- Nested Chain Rule Practice now has a normal crawlable anchor in the Chain Rule topic page; its JavaScript-only link injector was removed.
- The final crawl reports zero broken internal targets and zero crawlable orphan pages.

### Sitemap, robots, and indexability

- sitemap.xml was regenerated from the actual indexable canonical set.
- Sitemap count before: 242.
- Sitemap count after: 242.
- Every sitemap URL is an absolute HTTPS URL on batchmath.net.
- The sitemap contains no parameter variants, redirects, utility pages, optional fabricated lastmod values, change-frequency values, or priority values.
- robots.txt continues to allow the assets Google needs to render the site and references https://batchmath.net/sitemap.xml.
- Only 404.html, offline.html, and diagnostics/index.html remain noindex.
- The 40 unfinished IM1 Unit 4–11 placeholder HTML pages were removed from the release rather than published as thin or speculative pages.

### Titles and descriptions

- All 242 indexable pages have unique titles and unique meta descriptions.
- Repeated title wording was removed from Indeterminate Limits, One-Sided Limits, U-Substitution, and Mean Value Theorem for Integrals practice pages.
- Long titles were shortened while keeping the topic, course context, and BatchMath branding.
- Unit 3 practice descriptions now identify the actual skill and relevant unit section rather than repeating a generic assignment-model phrase.
- Incomplete or awkwardly truncated descriptions were replaced with accurate topic-specific practice descriptions.

### Heading structure and static practice context

- Every indexable page has exactly one H1.
- The Advanced Trig identity-reference headings now use H2 rather than skipping from H1 to H3.
- All 103 practice-style pages include one concise visible, crawlable context sentence identifying the course, skill, and practice purpose.
- No large SEO prose blocks, hidden text, doorway content, or keyword stuffing were added.

### Breadcrumbs and hierarchy

- A lightweight visible breadcrumb trail was added to all 241 non-home public pages.
- Breadcrumbs use normal anchor links, wrap on narrow screens, and allow long labels to break safely without horizontal overflow.
- Matching BreadcrumbList JSON-LD was added to those pages.
- Breadcrumb paths are based on live parent pages in the normal course → unit → topic → practice hierarchy, not merely every URL folder.

### Structured data and site identity

- All 242 indexable pages now contain valid parseable JSON-LD.
- The home page includes WebSite and EducationalOrganization/Organization identity.
- The About page includes AboutPage, EducationalOrganization/Organization, and BreadcrumbList.
- Other public pages include WebPage and BreadcrumbList.
- Organization identity includes the canonical site URL, logo, social image, YouTube channel, and Instagram profile.
- Course and PracticeProblem markup were deliberately not added because Google removed those search-appearance features from current documentation. VideoObject was also not added because the existing topic pages are not dedicated watch pages and complete reliable per-video metadata was not available. This avoids unsupported or misleading markup.

### Social and search appearance

- Every indexable page now has consistent Open Graph title, description, URL, image, image dimensions, image type, and image alt text.
- Every indexable page now has a complete summary-large-image Twitter card.
- Existing favicons, manifest links, BatchMath branding, and social profiles were preserved.

### Stale content and navigation

- The Integrated Math 1 landing page now lists only live Units 1–3.
- Unit 3 is correctly presented as available.
- The Unit 1 jump menu now links only to live Units 1–3.
- The home-page IM1 summary now accurately describes the available Units 1–3.
- Legitimate AP free-response status messaging was preserved.

## Shared implementation

- tools/seo-build.mjs is an idempotent sitewide metadata, canonical, breadcrumb, static-context, and clean-link build step.
- tools/seo-qa.mjs audits canonicals, metadata uniqueness, social tags, JSON-LD, breadcrumbs, practice context, indexability, sitemap coverage, robots.txt, internal targets, orphans, query variants, and HTTP consistency.
- tools/build-sitemap.mjs remains the maintainable sitemap generator.
- assets/site.css contains the shared responsive breadcrumb and practice-context styling.
- tools/release-qa.mjs received a small attribute-parser correction so apostrophes inside double-quoted metadata are read correctly.
- package.json exposes seo:build and qa:seo and includes the SEO audit in the no-browser regression chain.
- The site version is consistently v10.9.F in the application version, PWA, service worker, analytics, and reproducible-session files.

## Validation results

- HTML files: 245.
- Indexable pages: 242.
- Intentional noindex utility pages: 3.
- Sitemap URLs: 242.
- Structured-data pages: 242.
- Visible breadcrumb pages: 241.
- Practice pages with static context: 103.
- Unique titles: 242.
- Unique descriptions: 242.
- Internal targets checked by the SEO crawler: 6,994.
- Broken internal targets: 0.
- Crawlable orphan pages: 0.
- Tracking-only internal query links: 0.
- HTTP links to the preferred BatchMath host: 0.
- Representative home, course, unit, topic, complex practice, and IM1 practice pages parsed as strict HTML without duplicate IDs.
- Shared mobile rules were statically verified for wrapping, overflow safety, readable type, and viewport metadata.
- The largest local raster image is approximately 501 KiB; existing deferred MathJax, lazy-loaded video thumbnails/iframes, asynchronous analytics, and PWA loading behavior were preserved.
- Live-host checks confirmed HTTP-to-HTTPS redirection, HTTPS delivery, and HSTS.
- Audited external YouTube thumbnail, MathJax CDN, analytics, YouTube-channel, and Instagram URLs responded successfully at audit time.

The full no-browser regression chain passed every completed site, generator, distribution, and answer-equivalence test through more than one million generated samples. Its only stop was the pre-existing fractional-exponent display lint for two unchanged strings in assets/derivative-at-point-practice.js. Byte comparison confirms both that file and the lint rule are identical to v10.9.E. Because this release is restricted to technical SEO, that unrelated baseline issue was documented rather than changed. The two tests after that stop and the dedicated IM1 Unit 3 Section A suite were run separately and passed.

## Deliberately unchanged

- No generator family, probability, answer type, scoring behavior, explanation, keypad, Enter-to-advance behavior, assignment, answer key, test, or curriculum sequence was changed.
- No large-scale content SEO rewrite was started.
- No unsupported education schema, fake FAQ content, hidden text, mass-generated landing page, redirect scheme, or keyword-stuffed copy was added.
- No speculative redirect was added for the removed unfinished IM1 placeholders because they had no live replacement content and were already noindex.
- The math-rendering architecture and video-loading architecture were not rewritten for marginal performance gains.

## Deployment follow-up

The remaining owner actions are limited to deploying the full v10.9.F package and completing the separate Search Console checklist. Google’s live Rich Results Test and canonical selection can only be confirmed against the deployed production URLs.
