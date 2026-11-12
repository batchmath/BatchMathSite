# Integrated Math 1 Navigation Standard

This is the permanent convention for every Integrated Math 1 (IM1) unit, current and future. The authoritative data is
`tools/im1-nav/structure.mjs`; pages, builders, `tools/seo-build.mjs` and the IM1 QA all read it, so labels cannot drift.

## Organization

- **Four sections per unit**, numbered from 1: "Section 1 — Arithmetic Sequences" … "Section 4 — …". A unit with more
  material still uses four sections; never create a Section 5.
- **Parts** are numbered by section number and letter, restarting at 1A in every unit: 1A, 1B, 1C … 2A, 2B … 4D.
  - Label: `1A — Identifying Arithmetic Sequences` (code, space, em dash, space, title).
  - **No leading zeros** on the website: `1A`, never `01A`. No bare `Part A`, and no lettered sections (`Section A`).
- **Section reviews** are the last parts of their section, with their own codes: `1G — Section 1 Review`. A page that
  holds several documents shows each with its code (`1E — Section 1 Review`, `1F — Section 1 Review (Mixed)`); the page
  itself is labeled with the range, `1E–1F — Section 1 Review`, and each document has an anchor (`#part-1e`).
- **Unit comprehensive reviews** sit outside the four sections: `Unit 4 Comprehensive Review`, with document labels such
  as `Unit 4 Comprehensive Review — Version 1`, `— Version 2`, `— Mixed`.
- **File names keep their original codes.** Supplied PDFs keep names such as `01a-geometric-or-not.pdf` or `05a-…`; only
  the visible labels follow this standard. Never rename or regenerate a supplied PDF to match a label.

## Pages and navigation

| Page | Heading (H1) | Breadcrumb trail |
| --- | --- | --- |
| Unit | `Unit 3 - Linear` | Home › Integrated Math 1 › Unit |
| Section | `Unit 3: Section 1 — Arithmetic Sequences` | … › Unit › Section 1 — … |
| Part (topic) | `Unit 3: 1A — Identifying Arithmetic Sequences` | … › Section 1 — … › 1A — … |
| Practice | `Unit 3: 1A — Identifying Arithmetic Sequences Practice` | … › 1A — … › 1A — … Practice |
| Unit review | `Unit 3 Comprehensive Review` | … › Unit › Unit 3 Comprehensive Review |

- **Browser-tab title:** the heading followed by ` | BatchMath`. If that exceeds 85 characters, a part's `short` title is
  used. Unit and unit-review pages end in ` | Integrated Math 1 | BatchMath`.
- **"Jump to topic" menu**, on every unit, section, topic and unit-review page. It holds one `optgroup` per section
  (`Section 1 — …` to `Section 4 — …`), with every part as an option (`1A — …`), then an optgroup `Unit Review`. The
  current page's option is selected; elsewhere the first option is "Select a topic". Option values are the existing
  page URLs (absolute in Units 3–4, relative in Units 1–2, whose pages also open from disk).
- **Cards.** A unit page shows the four section cards, any unit-wide extra (Unit 1 Practice), then the unit review. A
  section page shows one card per part.
- **Back link.** A topic links back to its section, a section or unit review to its unit.
- **Previous/next links** run through every part in order, then the unit review: `← 1F — …` and `1G — … →`.
- **Practice.** The launch button reads `1A — … Practice`. Practice-type menus use the same labels, and their option
  values never change.
- **URLs never change.** New pages are only added; existing deep links keep working.

## Content rules

- **No student notes** are published anywhere in IM1: no notes PDFs, links, cards or menu entries. Assignments, answer
  keys, reviews, practice-engine explanations and instructional videos are unaffected. This applies to IM1 only.
- **Videos are added only when supplied**, through `tools/v13-im1-videos/markup.mjs`. They are matched by full page path.
- **No placeholders.** Never publish an empty, broken or "coming soon" practice button or video player.

## Making changes

1. Edit `tools/im1-nav/structure.mjs`: sections, parts, codes and titles.
2. Run `node tools/im1-nav/apply.mjs` (Units 1–3, in place) and `node tools/build-im1-unit4-pages.mjs` (Unit 4).
   `apply.mjs` rewrites only navigation and labels. It creates missing section pages for units whose topics are not
   nested under sections, and running it twice changes nothing.
3. For a new unit, add it to the structure. Write a builder that renders with the structure's functions, as the Unit 4
   builder does, and add its pages to the sitemap.
4. Run `npm run qa:im1-nav`. It confirms that every IM1 page matches the standard and checks numbering, menus, links,
   breadcrumbs, notes, Unit 4 PDFs and videos.

`tools/build-im1-unit3-pages.mjs` is historical: the published Unit 3 pages have since gained metadata and markup that it
does not produce. It refuses to run without `--legacy-rebuild`, and even then takes its labels from the structure.
`tools/seo-build.mjs` takes IM1 breadcrumbs from the structure, so a later SEO run keeps these labels.

## Current mapping

**Unit 1 — Review:**
- Section 1 — Multiplication and Integer Operations: 1A Multiplication; 1B Adding and Subtracting Negative Numbers;
  1C Multiplying and Dividing Negative Numbers.
- Section 2 — Exponents and Order of Operations: 2A Square Roots and Exponents; 2B Order of Operations.
- Section 3 — Fractions, Decimals, and Percents: 3A Reducing Fractions; 3B Fractions; 3C Decimals; 3D Percents.
- Section 4 — Classifying Numbers: 4A Classifying Numbers.
- Unit 1 Comprehensive Review; Unit 1 Practice.

**Unit 2 — Algebraic Operations, Equations, and Inequalities:**
- Section 1 — Algebraic Expressions: 1A Equivalent Expressions and Combining Like Terms; 1B Distributive Property.
- Section 2 — Solving Linear Equations: 2A Solving Linear Equations.
- Section 3 — Linear Inequalities: 3A Solving Linear Inequalities; 3B Graphing Inequalities and Interval Notation.
- Section 4 — The Coordinate System: 4A Coordinate System and Nine Key Features.
- Unit 2 Comprehensive Review.

**Unit 3 — Linear:**
- Section 1 — Arithmetic Sequences: 1A–1F; 1G Section 1 Review.
- Section 2 — Functions, Function Notation, and Slope: 2A–2E; 2F Section 2 Review.
- Section 3 — Slope-Intercept and Point-Slope Form: 3A–3D; 3E Section 3 Review.
- Section 4 — Recursive Formulas for Linear Relationships: 4A–4C; 4D Section 4 Review.
- Unit 3 Comprehensive Review.

**Unit 4 — Exponential Functions:**
- Section 1 — Geometric Sequences: 1A–1D; 1E Section 1 Review; 1F Section 1 Review (Mixed).
- Section 2 — Recursive Formulas: 2A–2C; 2D Section 2 Review; 2E Section 2 Review (Mixed).
- Section 3 — Explicit Formulas and Exponential Models: 3A–3G; 3H Section 3 Review; 3I Section 3 Review (Mixed).
- Section 4 — Solving Exponential Equations: 4A–4C; 4D Section 4 Review; 4E Section 4 Review (Mixed).
- Unit 4 Comprehensive Review: Version 1, Version 2, Mixed.

The full titles of every part are in `tools/im1-nav/structure.mjs`.
