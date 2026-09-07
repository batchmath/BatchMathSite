# BatchMath automated QA

## Corrective Limits display patch
- Fixed a sign-cleanup bug that could change the displayed mathematics when a fraction denominator was a multi-term expression beginning with a negative coefficient.
- Example regression: the intended `(2x+3)/(-4x-5)` could display incorrectly as `-(2x+3)/(4x-5)`, while the stored answer still corresponded to the intended expression.
- The unsafe cleanup existed in the comprehensive Limits generator and its topic-specific copies. All five copies are patched.
- Automated AP generator QA now independently parses displayed continuous-rational limits and verifies the displayed value matches the coefficients encoded by the generated problem ID and stored answer.
- Static QA now rejects the unsafe broad negative-denominator rewrite if it is ever reintroduced.

BatchMath v10.5.5 extends the reliability system with deeper semantic-answer, analytics, PWA/cache, generator-diversity, and instructional-overlap audits before the next production release.

## Static release QA

Run:

```text
node tools/release-qa.mjs
```

This checks JavaScript syntax, internal references, sitemap/canonical agreement, metadata, GA4 coverage, PWA version agreement, MathJax pinning, FRQ database invariants, practice-engine instrumentation, reproducible-RNG coverage, and basic packaged PDF/DOCX integrity.

Results are written to `qa-results/release-qa.txt` and `qa-results/release-qa.json`.

## Deterministic AP generator stress QA

Run:

```text
node tools/ap-generator-stress-qa.mjs
```

The default run generates 10,000 seeded problems in each of 26 AP comprehensive-review categories: 10 Limits categories, 12 Derivatives categories, and 4 Integrals categories. That is 260,000 generated problems per run. It checks IDs/questions, numeric finiteness, category consistency, and targeted malformed-sign/string failures. Every category uses a fixed seed, so any failure is exactly repeatable.

For a deeper release run:

```text
BM_QA_AP_PER_CATEGORY=20000 node tools/ap-generator-stress-qa.mjs
```

That generates 520,000 deterministic AP problems.

Results are written to `qa-results/ap-generator-stress-qa.txt` and `qa-results/ap-generator-stress-qa.json`.

## Targeted Limits family QA

Run:

```text
node tools/limits-family-qa.mjs
```

This specifically stress-tests **Using Variable Substitution** and **Complex Fraction Limits**. It independently recomputes answers from reproducible IDs, verifies meaningful analytics problem-type/variant labels, checks family coverage and intended mixture, rejects the retired opaque IDs, and scans for malformed signs and structural errors.

Current design targets:

- Variable Substitution: about 60% cube-root-based problems and 40% other higher fractional-power problems. Square-root / x^(1/2) forms are intentionally excluded because those belong in Rationalizing. Shifted cube-root problems may use nonzero approach values and visually unclean constants when the substitution value is still a clean integer, such as x -> 2 with cubeRoot(x + 62) -> 4.
- Complex Fractions: about 44% routine, 31% intermediate, and 25% challenging.

Results are written to `qa-results/limits-family-qa.txt` and `qa-results/limits-family-qa.json`.

## Individual AP topic-generator QA

Run:

```text
node tools/ap-topic-generator-qa.mjs
```

This stress-tests the shared randomized generators used by the new individual AP Calculus topic-practice pages. It covers the 38 topic families that are not direct category-restricted clones of the comprehensive Limits/Derivatives/Integrals engines. The test checks problem construction, answer choices, answer-key consistency, family variation, and malformed output.

Results are written to `qa-results/ap-topic-generator-qa.txt` and `qa-results/ap-topic-generator-qa.json`.

## New calculus-engine stress QA

Run:

```text
node tools/new-calculus-engines-qa.mjs
```

This stress-tests the three newly integrated specialized practice engines:

- Limit Proof Practice: epsilon-delta, delta-M, N-epsilon, and N-M families, including one-sided infinite limits and limits at infinity modeled after the course assignments.
- Classifying Discontinuities Practice: removable, jump, infinite, and continuous/no-discontinuity cases across rational, trigonometric/rational, and piecewise families.
- Advanced Trigonometric Limits: all 38 retained problem families from the standalone v2 prototype.

The proof test also performs targeted numerical/witness checks where applicable.

Results are written to `qa-results/new-calculus-engines-qa.txt` and `qa-results/new-calculus-engines-qa.json`.

## Seeded generator browser QA

Install the pinned QA dependency and Chromium once:

```text
npm install
npx playwright install chromium
```

Then run:

```text
node tools/seeded-browser-qa.mjs
```

The default run tests deterministic seeds on every instrumented practice engine. Each seed is loaded twice and must reproduce the same first problem. The test checks that a problem is generated, the problem has a reproducible ID/key, the display is nonempty, Report a Problem is available, and no page/console JavaScript errors occur.

For a deeper run:

```text
BM_QA_SEEDS=20 node tools/seeded-browser-qa.mjs
```

Results are written to `qa-results/seeded-generator-qa.txt` and `qa-results/seeded-generator-qa.json`.

## Reproducing a reported problem

A report contains a `seed`, `path`, `problemNumber`, `problemId`, and relevant practice settings. Append:

```text
?bm_seed=THE_SEED
```

to the reported practice-engine URL, apply the reported settings, and advance to the reported problem number.

## GitHub Actions

`.github/workflows/batchmath-qa.yml` runs the static release QA, display-safety QA, independent semantic-answer QA, Calculus Prep semantic QA, analytics QA, PWA/cache QA, deterministic AP stress QA, targeted Limits QA, individual AP topic-generator QA, the 60-topic deep audit, specialized calculus-engine stress QA, and seeded browser QA automatically on pushes to `main`, pull requests, and manual workflow runs. Reports are uploaded as a workflow artifact even when a test fails.

## v10.5.2 display-safety hardening

After a student-facing Limits problem exposed a mismatch between the displayed rational expression and its stored answer, v10.5.2 adds a sitewide display-safety gate. The root cause was confined to five Limits-engine copies that post-processed generated question LaTeX. Those five copies now permit only algebraically safe normalization of constant negative denominators. The other practice engines do not post-process generated mathematical questions after answer construction.

`npm run qa:display` now audits every instrumented engine and all HTML/JS source files. It fails if a new engine rewrites a generated `q`, `question`, `questionHTML`, `tex`, `math`, or `prompt` field after generation unless that transform is explicitly audited. It also rejects the unsafe arbitrary negative-denominator regex responsible for the v10.5.0 mismatch and verifies all five Limits `cleanSigns` copies remain identical to the safe reference implementation.

## Expanded semantic, coverage, analytics, and PWA QA

The pre-Unit-2 hardening pass adds four permanent release gates:

- `npm run qa:semantic` independently recomputes answers from displayed/generated data for nine numeric IM1 engines and tens of thousands of tractable shared AP topic problems. This specifically guards against a displayed-problem/stored-answer mismatch rather than trusting the generator's own answer object.
- `npm run qa:deep` generates 2,000 raw problems from each of the 60 individual AP topic-practice pages (120,000 total), audits family distribution, duplicate choices, malformed TeX/signs, repeat-space width, analytics identities, backing-generator uniqueness, and selected instructional-overlap pairs. It also writes `qa-results/ap-generator-coverage.md`.

- `npm run qa:prep` directly executes and semantically audits 11 Calculus Prep engines (unit circle, trig angle skills, trig equations, calculus algebra, domains, logs, trig identities, special factoring, synthetic division/RRT, function graphs, and rational functions). The default run checks 5,500 generated problems, including independent synthetic-division/factor-theorem and rational-function feature verification.
- `npm run qa:analytics` audits all instrumented engines, unique engine IDs, GA tag coverage, problem-generation paths, and the `answerChecked(problem, correctBoolean, extra)` contract. A dynamic tracker test verifies incorrect answers cannot emit `answer_correct`.
- `npm run qa:pwa` audits service-worker/app version agreement, APP_SHELL size/content, required shared assets, network-first navigation, offline fallback, MathJax pinning, and local dependencies for every practice page.

The specialized calculus QA now independently validates all 17 proof-witness families over multiple epsilon/M values, independently recomputes discontinuity classifications from generator IDs, rejects cancellation of a claimed vertical-asymptote factor, and scans proof/discontinuity/trig display text for malformed signs.

## v10.5.5 derivative-topic enhancement QA

Run:

```text
npm run qa:derivative-topics
```

This gate covers the derivative-topic changes added during the AP instructional review. It verifies that Power Rule includes irrational real exponents, Difference Quotients include linear/quadratic/cubic/radical/reciprocal families, Chain Rule's visible Simple/Multiple/Both selector is isolated correctly and is 50/50 in Both mode, and the Product/Quotient Rule basic-vs-advanced selectors are likewise isolated and 50/50 in Both mode. It independently checks derivative formulas for the new chain/product/quotient and irrational-power families and rejects malformed TeX.

The v10.5.5 review also removes TeX delimiters from the plain-language prompts on Derivatives of Inverse Functions and Implicit Differentiation, and hardens piecewise discontinuity inequalities so `<`, `>`, `\\lt`, `\\le`, `\\gt`, and `\\ge` cannot be corrupted by JavaScript-string or HTML parsing.

Results are written to `qa-results/derivative-topic-enhancements-qa.txt` and `qa-results/derivative-topic-enhancements-qa.json`.

## v10.5.5 Unit 1 IVT / Limits-at-Infinity refinement

- Intermediate Value Theorem topic practice now offers **Mixed Practice** (default), **Guaranteed Value**, and **Verify a Root**.
- Mixed IVT practice is a seeded 50/50 selection between the existing guaranteed-value question family and root-verification questions.
- Root-verification practice includes:
  - polynomials that are continuous for all real numbers with endpoint sign change (IVT verifies a root),
  - continuous polynomials whose endpoint values do not straddle 0 (IVT does not verify a root),
  - rational functions whose discontinuity lies outside the stated interval and whose endpoint values straddle 0 (IVT applies on the interval), and
  - rational functions with a discontinuity strictly inside the interval even though endpoint signs differ (IVT cannot be applied on the whole interval).
- Limits at Infinity individual-topic practice now selects only the true `infinityLimit` family; finite-point oscillating `sin(k/x)` / DNE problems remain in their appropriate separate topic/comprehensive material but are no longer served by the Limits at Infinity topic page.
- `tools/unit1-ivt-infinity-qa.mjs` permanently checks selector wiring, 50/50 mixed distribution, mode isolation, all four root-verification variants, continuity/pole placement logic, malformed TeX escapes, and the pure Limits-at-Infinity category selection.

## v10.6.0 Unit 3 generator rebuild

The Unit 3 practice review was rebuilt after instructional review. Three topic-practice engines were removed while their instructional topic pages/resources were retained: Graphing the Derivative, Newton's Method, and Using Your Graphing Calculator. The site now has 81 instrumented practice engines and 57 individual AP topic-practice pages.

Major Unit 3 changes include: broadened tangent/normal-line function families; explicit horizontal/vertical tangent formatting cleanup; six-family absolute-extrema practice; eight-family increasing/decreasing/concavity/extrema practice; TeX infinity symbols on graph-analysis prompts; seven-family linearization/differentials practice using square/cube/fourth roots and trig/differentials; nine-family L'Hopital practice including four two-application families; motion practice across cubic, quartic, trig, exponential, and radical position functions with velocity/speed/acceleration chosen one-third each and speed defined as |v|; seven-family Rolle/MVT practice; nine optimization families and ten related-rates families modeled on the site's course assignments; and tangent/secant approximation questions that require both a numerical approximation and an underestimate/overestimate classification.

A permanent `tools/unit3-rebuild-qa.mjs` gate checks family coverage, mode proportions, removed-engine absence, TeX infinity usage, L'Hopital multiple-application coverage, motion speed behavior, and the two-part approximation answer contract.


## v10.6.0 assignment fidelity and IM1 Unit 2 release gates

- `npm run qa:fidelity` enforces the repaired AP assignment-family coverage contracts and independently recomputes numerical answers for the new Unit 4-6 assignment-style families.
- `npm run qa:im1-unit2` stress-tests all seven Unit 2 practice modes, verifies assignment-family coverage and independent semantic checks, and enforces the Unit 2 public-resource whitelist.
- The Unit 2 whitelist permits only the Unit 2 Notes PDF, seven assignment/review PDFs, and seven matching assignment/review answer-key PDFs. It fails if a DOCX, Student Notes file, test, or test answer key appears anywhere in the public Unit 2 tree.

## v10.6.3.A manual-review rebuild

v10.6.3.A is the post-v10.6.0 manual-review rebuild. It removes the retired AP practice engines for Limit Proof, Optimization, Related Rates, Converting a Rectangular Approximation into Exact Area, Slope Fields, and Exponential Growth/Decay/Interest/Newton Cooling while retaining their instructional pages/resources. It also includes the assignment-aligned derivative, applications-of-derivative, integral, differential-equation, and applications-of-integration revisions; the first two-stage Riemann-sum practice flow; shared Enter-to-next behavior; stricter student-facing display checks; and the IM1 Unit 2 generator fixes found during manual review.

Release structure after these removals: 90 instrumented practice engines and 51 live AP individual topic-practice pages. The release gates explicitly treat the retired engines as intentionally absent.


## v10.6.3.D practice-launch UI

- Replaced topic-page practice links with centered glossy red/yellow “Open Interactive Practice” launch buttons.
- IM1 uses f(x); AP Calculus Unit 1 uses lim with x → ∞; Units 2–3 use d/dx; Units 4–6 use ∫.
- The IM1 Unit 1 whole-unit practice launch uses the same f(x) treatment.
- No practice-generator mathematics or answer logic was intentionally changed in this UI checkpoint.
