# Integrated Math 1 Navigation Standard

The curriculum mapping lives in `tools/im1-nav/structure.mjs`. It supplies the labels and routes for the section cards, breadcrumbs, TOPICS menu, and lesson sequence.

## Organization

- Each unit has four instructional sections. Use the labels Section 1 through Section 4, followed by the section name.
- Start each unit at 1A. Number parts by section and letter, for example `1A — Identifying Arithmetic Sequences` and `2C — Slope from Two Points`.
- Use the final part code for each section review. The unit comprehensive review is a separate destination after the four sections. Use the existing titles for versions of a unit review.
- Keep public page URLs and supplied PDF filenames as published. Section and part numbering applies to the labels students see on the website.
- Apply this standard to Integrated Math 1.

## Pages and resources

- A unit page links to all four sections, its unit review, and any separate unit practice index.
- On each section page, list the parts in teaching order. Topic headings, breadcrumbs, practice launches, and previous/next links use the same part codes. Practice Type option values belong to the engine.
- The TOPICS menu lists the four sections, their parts, and the unit review. It highlights the current lesson on the lesson and practice pages.
- Publish assignments, answer keys, reviews, and approved lesson videos. Student notes are excluded from IM1 publication, including PDFs, buttons, cards, manifests, and navigation.
- Link a topic to an exercise once the engine has a public page. Link back to the topic and use its existing lesson videos and resources.

## Maintenance

1. Add or revise the unit in `tools/im1-nav/structure.mjs`. Use that mapping in any new unit generator. Use `tools/build-im1-unit4-pages.mjs` for changes to Unit 4 materials.
2. Run `npm run nav:build` after any page generator. It applies the IM1 labels, refreshes the static TOPICS and practice navigation, and updates the sitemap.
3. Run `node tools/im1-nav/apply.mjs --check`, `npm run qa:site-navigation` and `npm run qa:seo`. To verify preservation, set `BM_NAV_BASELINE` to a local checkout of the prior production commit.

The current Unit 3 HTML remains the source for its approved video and practice markup. The historical Unit 3 builder is available to reproduce old test fixtures with `--legacy-rebuild` in an isolated checkout.

## Current mapping

### Unit 1 — Review

- **Section 1 — Multiplication and Integer Operations.** 1A — Multiplication · 1B — Adding and Subtracting Negative Numbers · 1C — Multiplying and Dividing Negative Numbers
- **Section 2 — Exponents and Order of Operations.** 2A — Square Roots and Exponents · 2B — Order of Operations
- **Section 3 — Fractions, Decimals, and Percents.** 3A — Reducing Fractions · 3B — Fractions · 3C — Decimals · 3D — Percents
- **Section 4 — Classifying Numbers.** 4A — Classifying Numbers

Unit 1 Comprehensive Review.

Unit 1 Practice.

### Unit 2 — Algebraic Operations, Equations, and Inequalities

- **Section 1 — Algebraic Expressions.** 1A — Equivalent Expressions and Combining Like Terms · 1B — Distributive Property
- **Section 2 — Solving Linear Equations.** 2A — Solving Linear Equations
- **Section 3 — Linear Inequalities.** 3A — Solving Linear Inequalities · 3B — Graphing Inequalities and Interval Notation
- **Section 4 — The Coordinate System.** 4A — Coordinate System and Nine Key Features

Unit 2 Comprehensive Review.

### Unit 3 — Linear

- **Section 1 — Arithmetic Sequences.** 1A — Identifying Arithmetic Sequences · 1B — Common Difference and Next Terms · 1C — Explicit Formulas for Arithmetic Sequences · 1D — Finding a Specific Term · 1E — Finding the Term Number · 1F — Arithmetic Sequence Word Problems · 1G — Section 1 Review
- **Section 2 — Functions, Function Notation, and Slope.** 2A — Evaluating Functions · 2B — Solving Function Equations · 2C — Slope from Two Points · 2D — Collinearity and Slope · 2E — Slope from Graphs · 2F — Section 2 Review
- **Section 3 — Slope-Intercept and Point-Slope Form.** 3A — Slope-Intercept Form · 3B — Writing Equations of Lines · 3C — Converting Point-Slope to Slope-Intercept Form · 3D — Linear Function Word Problems · 3E — Section 3 Review
- **Section 4 — Recursive Formulas for Linear Relationships.** 4A — Recursive Formulas from Sequences · 4B — Recursive to Explicit Formulas · 4C — Common Difference and Recursive Formulas · 4D — Section 4 Review

Unit 3 Comprehensive Review.

### Unit 4 — Exponential Functions

- **Section 1 — Geometric Sequences.** 1A — Geometric or Not · 1B — Common Ratios and Next Terms · 1C — Finding Terms of Geometric Sequences · 1D — Geometric Growth and Decay Modeling · 1E — Section 1 Comprehensive Review
- **Section 2 — Recursive Formulas.** 2A — Writing Recursive Formulas · 2B — Using Recursive Formulas · 2C — Recursive Formulas from Tables and Contexts · 2D — Section 2 Comprehensive Review
- **Section 3 — Explicit Formulas and Exponential Models.** 3A — Writing Explicit Formulas · 3B — Converting Recursive to Explicit · 3C — Converting Explicit to Recursive · 3D — Explicit Formulas from Tables and Terms · 3E — Exponential Growth and Decay Models · 3F — Writing Exponential Equations from y-Intercept and Common Ratio · 3G — Writing Equivalent Explicit Exponential Equations from a Point · 3H — Section 3 Comprehensive Review
- **Section 4 — Solving Exponential Equations.** 4A — Solving Basic Exponential Equations · 4B — Solving Exponential Equations with Algebraic Exponents · 4C — Solving Exponential Equations with Coefficients · 4D — Section 4 Comprehensive Review

Unit 4 Comprehensive Review · Versions 1 and 2.
