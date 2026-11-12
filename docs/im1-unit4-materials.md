# Integrated Math 1 Unit 4: Exponential Functions

This branch, `claude/im1-unit4-materials`, adds Unit 4 to the website as downloadable materials. It was created from
`main` at `66af306` (v13.0.G) and has not been merged or deployed.

**What Unit 4 contains.** Unit 4 publishes:
- the student assignments and section reviews;
- their answer keys;
- the unit comprehensive reviews.

**What it deliberately leaves out**
- **Student notes,** by decision: no notes are published in Unit 4. The notes in Units 1–3 are untouched.
- **Videos** (they will be supplied later): no players, placeholders or video URLs.
- **Practice engines:** none were supplied.

**What else stays untouched.** Unit 3 and its 18 instructional videos are unchanged, byte for byte. No video player,
video mapping or video behaviour changed.

## Source and verification

The source is the classroom ZIP `Temp-20261112T054006Z-1-001.zip`.

**Contents.**
- 112 files: 56 PDF and 56 DOCX.
- They form 28 student documents, each with an answer key, in both formats.
- There are no notes, tests, test keys or unrelated files.
- The DOCX files are the editable sources and are not published.

**Checks on each of the 28 pairs**
- **Pairing.** The answer key has the same code and title as the document, followed by "- Answer Key".
- **Problem counts.** The numbered problems match one for one between document and key (from 8/8 to 56/56).
- **PDF against DOCX.** The words of each PDF match its DOCX source. One small difference was found: in 02C,
  problem 3, the PDF says "the value of a **machine**" where the DOCX says "a **car**". The numbers (16000, 8000, 4000,
  2000) and the key's answer are the same, so the PDF was published as supplied. Re-export it if you prefer "car".
- **File health.** Every PDF is valid and unencrypted.
- **Byte-for-byte copies.** The 56 PDFs are published exactly as supplied. Their SHA-256 hashes are recorded in
  `tools/im1-unit4/pdf-manifest.json`.

**The "Mixed" reviews are different problem sets, not reshuffles.** Checked by comparing problem text:
- each section's Mixed review shares at most 1 problem with the regular review;
- the unit review's Version 2 shares no problems with Version 1;
- the unit review's Mixed version shares 12 of 56 problems with Version 1.

**Section names** come from the unit review keys:
- Section A, "Geometric Sequences". The documents say "Geometric Sequences and Growth/Decay"; the shorter name is the
  one you gave.
- Section B, "Recursive Formulas".
- Section C, "Explicit Formulas and Exponential Models".
- Section D, "Solving Exponential Equations".

## Website structure

Unit 4 is at `/im1/unit-4-exponential-functions/`. It has 27 pages built by `tools/build-im1-unit4-pages.mjs`:
- **Unit page:** "Unit 4 - Exponential Functions", with a "Sections" grid.
- **Four section pages:** for example "Unit 4 — Section A: Geometric Sequences", with an "Assignments" grid.
- **One page per lesson document:** 17 pages, for example "Unit 4 — 01A: Geometric or Not". Each page offers
  **Assignment PDF** and **Answer Key PDF**.
- **One review page per section:** 4 pages, for example "Section A Review". Each holds the section's comprehensive
  review and its Mixed version: 01E and 01F, 02D and 02E, 03H and 03I, 04D and 04E.
- **The Unit 4 Comprehensive Review page:** 05A Version 1, 05B Version 2 and 05C Mixed, each with its key.

**Shared with the Unit 3 pages**
- the page layout, styles (`assets/im1-unit3.css`) and navigation script (`assets/im1-unit3-nav.js`);
- the "Jump to topic" menu, the previous/next topic pager and the breadcrumbs;
- the metadata: description, canonical URL, Open Graph, Twitter, and JSON-LD with WebPage and BreadcrumbList;
- the Google Analytics tag.

**PDF paths.** Each PDF is published under `resources/assignments/<code>-<title>.pdf` and
`resources/answer-keys/<code>-<title>-answer-key.pdf`. Both open in a new tab.

**Other files changed**
- `im1/index.html`: "Available now: Units 1–4", plus a Unit 4 option and card.
- `im1/unit-1-review/index.html`: a Unit 4 option in the unit menu.
- `index.html`: the IM1 course card now reads "Units 1–4: foundations, algebra, sequences, linear & exponential
  relationships".
- `sitemap.xml`: the 27 new URLs.
- `tools/seo-build.mjs`: its copies of those navigation strings, updated so that a later run keeps Unit 4.

The Unit 4 pages are written complete by the builder. Do not run `tools/seo-build.mjs` over the whole site for this
change. On the current `main` that script rewrites 238 unrelated files, mostly reordering, including pages with video
players.

## Labels: a decision for you

- **Unit 3** shows "Section 1–4" and "Part A–F", from the standardization of Nov 4.
- **Unit 4** uses the letters on the documents themselves ("Section A–D", "Section A Comprehensive Review"), with the
  document codes as labels ("01A: Geometric or Not").

If you prefer Unit 3's numbering, for example "Section 1, Part A", it is a small change in the builder.

## Document map

| Code | Page | Assignment file | Answer key file |
| --- | --- | --- | --- |
| 01A | Section A › 01A: Geometric or Not | `01a-geometric-or-not.pdf` | `01a-geometric-or-not-answer-key.pdf` |
| 01B | Section A › 01B: Common Ratios and Next Terms | `01b-common-ratios-and-next-terms.pdf` | `…-answer-key.pdf` |
| 01C | Section A › 01C: Finding Terms of Geometric Sequences | `01c-finding-terms-of-geometric-sequences.pdf` | `…-answer-key.pdf` |
| 01D | Section A › 01D: Geometric Growth and Decay Modeling | `01d-geometric-growth-and-decay-modeling.pdf` | `…-answer-key.pdf` |
| 01E | Section A › Section A Review | `01e-section-a-comprehensive-review.pdf` | `…-answer-key.pdf` |
| 01F | Section A › Section A Review | `01f-section-a-comprehensive-review-mixed.pdf` | `…-answer-key.pdf` |
| 02A | Section B › 02A: Writing Recursive Formulas | `02a-writing-recursive-formulas.pdf` | `…-answer-key.pdf` |
| 02B | Section B › 02B: Using Recursive Formulas | `02b-using-recursive-formulas.pdf` | `…-answer-key.pdf` |
| 02C | Section B › 02C: Recursive Formulas from Tables and Contexts | `02c-recursive-formulas-from-tables-and-contexts.pdf` | `…-answer-key.pdf` |
| 02D | Section B › Section B Review | `02d-section-b-comprehensive-review.pdf` | `…-answer-key.pdf` |
| 02E | Section B › Section B Review | `02e-section-b-comprehensive-review-mixed.pdf` | `…-answer-key.pdf` |
| 03A | Section C › 03A: Writing Explicit Formulas | `03a-writing-explicit-formulas.pdf` | `…-answer-key.pdf` |
| 03B | Section C › 03B: Converting Recursive to Explicit | `03b-converting-recursive-to-explicit.pdf` | `…-answer-key.pdf` |
| 03C | Section C › 03C: Converting Explicit to Recursive | `03c-converting-explicit-to-recursive.pdf` | `…-answer-key.pdf` |
| 03D | Section C › 03D: Explicit Formulas from Tables and Terms | `03d-explicit-formulas-from-tables-and-terms.pdf` | `…-answer-key.pdf` |
| 03E | Section C › 03E: Exponential Growth and Decay Models | `03e-exponential-growth-and-decay-models.pdf` | `…-answer-key.pdf` |
| 03F | Section C › 03F: Writing Exponential Equations from y-Intercept and Common Ratio | `03f-writing-exponential-equations-from-y-intercept-and-common-ratio.pdf` | `…-answer-key.pdf` |
| 03G | Section C › 03G: Writing Equivalent Explicit Exponential Equations from a Point | `03g-writing-equivalent-explicit-exponential-equations-from-a-point.pdf` | `…-answer-key.pdf` |
| 03H | Section C › Section C Review | `03h-section-c-comprehensive-review.pdf` | `…-answer-key.pdf` |
| 03I | Section C › Section C Review | `03i-section-c-comprehensive-review-mixed.pdf` | `…-answer-key.pdf` |
| 04A | Section D › 04A: Solving Basic Exponential Equations | `04a-solving-basic-exponential-equations.pdf` | `…-answer-key.pdf` |
| 04B | Section D › 04B: Solving Exponential Equations with Algebraic Exponents | `04b-solving-exponential-equations-with-algebraic-exponents.pdf` | `…-answer-key.pdf` |
| 04C | Section D › 04C: Solving Exponential Equations with Coefficients | `04c-solving-exponential-equations-with-coefficients.pdf` | `…-answer-key.pdf` |
| 04D | Section D › Section D Review | `04d-section-d-comprehensive-review.pdf` | `…-answer-key.pdf` |
| 04E | Section D › Section D Review | `04e-section-d-comprehensive-review-mixed.pdf` | `…-answer-key.pdf` |
| 05A | Unit 4 Comprehensive Review | `05a-unit-4-comprehensive-review-version-1.pdf` | `…-answer-key.pdf` |
| 05B | Unit 4 Comprehensive Review | `05b-unit-4-comprehensive-review-version-2.pdf` | `…-answer-key.pdf` |
| 05C | Unit 4 Comprehensive Review | `05c-unit-4-comprehensive-review-mixed.pdf` | `…-answer-key.pdf` |

Two pages use shortened browser-tab titles, because the full titles would exceed the site's 85-character limit:
- 03F: "Exponential Equations from y-Intercept and Common Ratio";
- 03G: "Equivalent Exponential Equations from a Point".

Their headings and download labels keep the full document titles.

## Adding the videos later

The Unit 4 topic pages have the same resource section that `tools/v13-im1-videos/markup.mjs` inserts a video before.
The same mechanism can add your videos to these pages.
- Match each video by its **full page path**, not just the slug.
- Slugs such as `section-a-review` exist in both Unit 3 and Unit 4.

## Tests

- **`tools/review-lab/im1/unit4-browser.mjs`** (`BM_PORT=<port>`): **753 checks, 0 failures**, at 1366×900 and 390×844
  touch.
  - **Pages:** all 27 load (54 page loads) with one H1, one breadcrumb, no console errors, no failed requests and no
    page wider than the screen.
  - **Documents:** each of the 28 appears exactly once, with an assignment and an answer key of the same code.
  - **PDFs:** all 56 links serve `application/pdf` with the recorded SHA-256, so each is the supplied file, byte for
    byte. Both buttons open in a new tab.
  - **Nothing extra:** there is no notes, video or practice markup.
  - **Navigation:** the "Jump to topic" menu navigates, and every pager link resolves.
  - **Entry points:** the IM1 landing page (card, menu, "Units 1–4"), the Unit 1 unit menu and the home page card all
    list Unit 4.
- **Unit 3 is unchanged.**
  - No file under `im1/unit-3-linear-equation/` and no video asset changed.
  - Its 18 video IDs on 18 pages are identical to `main`.
  - `tools/v13g-im1-videos/browser.mjs` (with its output redirected away from the committed evidence) gives **54/54
    desktop and mobile video checks passing**. Actual YouTube playback cannot be exercised from the test environment.
- **Repository checks**
  - `qa:static` passes (0 errors, 0 warnings; it now counts 346 PDFs, previously 290). `qa:pwa`, `qa:analytics`,
    `qa:display` and `qa:semantic` pass.
  - `qa:seo` counts 303 indexable pages (276 + 27), and every Unit 4 page passes: unique titles and descriptions,
    canonical URLs, social tags, JSON-LD, breadcrumbs, heading order, internal links, and the sitemap matching the page
    set exactly.
  - It still fails overall with the **same 32 findings as `main`**, all on other pages (the Unit 1 topic headings, the
    two running documents, Mogollon and an experiments page).
- **Pre-existing layout note.** On a phone, a long breadcrumb runs under the COURSES button on Unit 3 and Unit 4 pages
  alike. It comes from the shared header layout, which was left unchanged.
