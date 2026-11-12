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
- **Practice engines:** Section 1 has them from v13.0.H (`docs/v13.0.H-im1-unit4-section1.md`); Sections 2–4 get theirs
  in later releases and show no practice button until then.

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

**Section names** come from the unit review keys. The documents letter their sections A–D; the website numbers them 1–4
(the numbering of the IM1 navigation standard, `tools/im1-nav/structure.mjs`):
- Section 1 (A on the documents), "Geometric Sequences". The documents say "Geometric Sequences and Growth/Decay"; the
  shorter name is the one you gave.
- Section 2 (B), "Recursive Formulas".
- Section 3 (C), "Explicit Formulas and Exponential Models".
- Section 4 (D), "Solving Exponential Equations".

## Website structure

Unit 4 is at `/im1/unit-4-exponential-functions/`. It has 27 pages built by `tools/build-im1-unit4-pages.mjs`:
Labels use Sections 1–4 and part codes such as 1A; the builder takes them from `tools/im1-nav/structure.mjs`.
- **Unit page:** "Unit 4 - Exponential Functions", with a "Sections" grid.
- **Four section pages:** for example "Unit 4: Section 1 — Geometric Sequences", with an "Assignments" grid (one card
  per part).
- **One page per lesson document:** 17 pages, for example "Unit 4: 1A — Geometric or Not". Each page offers
  **Assignment PDF** and **Answer Key PDF**.
- **One review page per section:** 4 pages, for example "Unit 4: 1E–1F — Section 1 Review". Each holds the section's
  comprehensive review and its Mixed version, each labeled with its own part code and anchor (`#part-1e`, `#part-1f`):
  1E–1F, 2D–2E, 3H–3I, 4D–4E.
- **The Unit 4 Comprehensive Review page:** "Unit 4 Comprehensive Review — Version 1", "— Version 2" and "— Mixed"
  (documents 05A, 05B and 05C), each with its key.

**Shared with the Unit 3 pages**
- the page layout, styles (`assets/im1-unit3.css`) and navigation script (`assets/im1-unit3-nav.js`);
- the "Jump to topic" menu, the previous/next topic pager and the breadcrumbs;
- the metadata: description, canonical URL, Open Graph, Twitter, and JSON-LD with WebPage and BreadcrumbList;
- the Google Analytics tag.

**PDF paths.** Each PDF is published under `resources/assignments/<code>-<title>.pdf` and
`resources/answer-keys/<code>-<title>-answer-key.pdf`. Both open in a new tab.

**Other files changed**
- `im1/index.html`: "Available now: Units 1–4", plus a Unit 4 option and card.
- `index.html`: the IM1 course card now reads "Units 1–4: foundations, algebra, sequences, linear & exponential
  relationships".
- `sitemap.xml`: the 27 new URLs.
- `tools/seo-build.mjs`: its copies of those navigation strings, updated so that a later run keeps Unit 4.

The Unit 4 pages are written complete by the builder. Do not run `tools/seo-build.mjs` over the whole site for this
change. On the current `main` that script rewrites 238 unrelated files, mostly reordering, including pages with video
players.

## Labels

Unit 4 uses Sections 1–4 and part codes such as 1A, without leading zeros. The PDFs keep their original file names (`01a-…`, `05a-…`), as the table below shows.

## Document map

| Document | Website label | Assignment file | Answer key file |
| --- | --- | --- | --- |
| 01A | Section 1 › 1A — Geometric or Not | `01a-geometric-or-not.pdf` | `01a-geometric-or-not-answer-key.pdf` |
| 01B | Section 1 › 1B — Common Ratios and Next Terms | `01b-common-ratios-and-next-terms.pdf` | `…-answer-key.pdf` |
| 01C | Section 1 › 1C — Finding Terms of Geometric Sequences | `01c-finding-terms-of-geometric-sequences.pdf` | `…-answer-key.pdf` |
| 01D | Section 1 › 1D — Geometric Growth and Decay Modeling | `01d-geometric-growth-and-decay-modeling.pdf` | `…-answer-key.pdf` |
| 01E | Section 1 › 1E — Section 1 Review | `01e-section-a-comprehensive-review.pdf` | `…-answer-key.pdf` |
| 01F | Section 1 › 1F — Section 1 Review (Mixed) | `01f-section-a-comprehensive-review-mixed.pdf` | `…-answer-key.pdf` |
| 02A | Section 2 › 2A — Writing Recursive Formulas | `02a-writing-recursive-formulas.pdf` | `…-answer-key.pdf` |
| 02B | Section 2 › 2B — Using Recursive Formulas | `02b-using-recursive-formulas.pdf` | `…-answer-key.pdf` |
| 02C | Section 2 › 2C — Recursive Formulas from Tables and Contexts | `02c-recursive-formulas-from-tables-and-contexts.pdf` | `…-answer-key.pdf` |
| 02D | Section 2 › 2D — Section 2 Review | `02d-section-b-comprehensive-review.pdf` | `…-answer-key.pdf` |
| 02E | Section 2 › 2E — Section 2 Review (Mixed) | `02e-section-b-comprehensive-review-mixed.pdf` | `…-answer-key.pdf` |
| 03A | Section 3 › 3A — Writing Explicit Formulas | `03a-writing-explicit-formulas.pdf` | `…-answer-key.pdf` |
| 03B | Section 3 › 3B — Converting Recursive to Explicit | `03b-converting-recursive-to-explicit.pdf` | `…-answer-key.pdf` |
| 03C | Section 3 › 3C — Converting Explicit to Recursive | `03c-converting-explicit-to-recursive.pdf` | `…-answer-key.pdf` |
| 03D | Section 3 › 3D — Explicit Formulas from Tables and Terms | `03d-explicit-formulas-from-tables-and-terms.pdf` | `…-answer-key.pdf` |
| 03E | Section 3 › 3E — Exponential Growth and Decay Models | `03e-exponential-growth-and-decay-models.pdf` | `…-answer-key.pdf` |
| 03F | Section 3 › 3F — Writing Exponential Equations from y-Intercept and Common Ratio | `03f-writing-exponential-equations-from-y-intercept-and-common-ratio.pdf` | `…-answer-key.pdf` |
| 03G | Section 3 › 3G — Writing Equivalent Explicit Exponential Equations from a Point | `03g-writing-equivalent-explicit-exponential-equations-from-a-point.pdf` | `…-answer-key.pdf` |
| 03H | Section 3 › 3H — Section 3 Review | `03h-section-c-comprehensive-review.pdf` | `…-answer-key.pdf` |
| 03I | Section 3 › 3I — Section 3 Review (Mixed) | `03i-section-c-comprehensive-review-mixed.pdf` | `…-answer-key.pdf` |
| 04A | Section 4 › 4A — Solving Basic Exponential Equations | `04a-solving-basic-exponential-equations.pdf` | `…-answer-key.pdf` |
| 04B | Section 4 › 4B — Solving Exponential Equations with Algebraic Exponents | `04b-solving-exponential-equations-with-algebraic-exponents.pdf` | `…-answer-key.pdf` |
| 04C | Section 4 › 4C — Solving Exponential Equations with Coefficients | `04c-solving-exponential-equations-with-coefficients.pdf` | `…-answer-key.pdf` |
| 04D | Section 4 › 4D — Section 4 Review | `04d-section-d-comprehensive-review.pdf` | `…-answer-key.pdf` |
| 04E | Section 4 › 4E — Section 4 Review (Mixed) | `04e-section-d-comprehensive-review-mixed.pdf` | `…-answer-key.pdf` |
| 05A | Unit 4 Comprehensive Review — Version 1 | `05a-unit-4-comprehensive-review-version-1.pdf` | `…-answer-key.pdf` |
| 05B | Unit 4 Comprehensive Review — Version 2 | `05b-unit-4-comprehensive-review-version-2.pdf` | `…-answer-key.pdf` |
| 05C | Unit 4 Comprehensive Review — Mixed | `05c-unit-4-comprehensive-review-mixed.pdf` | `…-answer-key.pdf` |

Two pages use shortened browser-tab titles, because the full titles would exceed the site's 85-character limit:
- 3F: "Exponential Equations from y-Intercept and Common Ratio";
- 3G: "Equivalent Exponential Equations from a Point".

Their headings and download labels keep the full document titles.

## Adding the videos later

The Unit 4 topic pages have the same resource section that `tools/v13-im1-videos/markup.mjs` inserts a video before.
The same mechanism can add your videos to these pages.
- Match each video by its **full page path**, not just the slug.
- Slugs such as `section-a-review` exist in both Unit 3 and Unit 4.

## Tests

- **`tools/review-lab/im1/unit4-browser.mjs`** (`BM_PORT=<port>`): **808 checks, 0 failures**, at 1366×900 and 390×844
  touch (with the standard labels: every document carries its part label).
  - **Pages:** all 27 load (54 page loads) with one H1, one breadcrumb, no console errors, no failed requests and no
    page wider than the screen.
  - **Documents:** each of the 28 appears exactly once, with an assignment and an answer key of the same code.
  - **PDFs:** all 56 links serve `application/pdf` with the recorded SHA-256, so each is the supplied file, byte for
    byte. Both buttons open in a new tab.
  - **Nothing extra:** there is no notes or video markup, and practice buttons only on the five Section 1 pages.
  - **Navigation:** the "Jump to topic" menu navigates, and every pager link resolves.
  - **Entry points:** the IM1 landing page (card, menu, "Units 1–4") and the home page card list Unit 4.
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
