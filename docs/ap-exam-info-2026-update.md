# AP Calculus AB exam information: 2026 scoring guidelines and the May 2027 exam format

Branch `claude/ap-calc-exam-info-2026`, created from `main` at `d846d75` (v13.0.F). It is not merged and not deployed.
No practice generator, MathLive, 3D model, video layout or course content changes.

## What changed

| File | Change |
| --- | --- |
| `ap-calculus/ap-test-preparation/free-response-questions/frq-data.js` | Adds the 2026 scoring guidelines, corrects the 2023–2026 FRQ page anchors, and updates two notes. |
| `ap-calculus/ap-test-preparation/free-response-questions/index.html` | Replaces the "not yet posted" sentence; the "Not Posted" placeholder is now driven by data. |
| `ap-calculus/ap-test-preparation/index.html` | Adds the May 2027 exam-format reference. |
| `tools/release-qa.mjs` | Removes the 2026 exemption from the scoring-URL check (stricter). |
| `tools/review-lab/frq/frq-archive-browser.mjs` | New browser QA for the FRQ archive and the exam-format section. |

**`frq-data.js`.** The edits are targeted string edits; the file is not re-serialized.
- **2026 Regular:**
  - `scoring` and `originalScoring` are `https://apcentral.collegeboard.org/media/pdf/ap26-sg-calculus-ab.pdf`;
  - `scoringPages` is `[2,6,11,15,19,23]`.
- **FRQ booklet page anchors** (`frqPages`), each checked against the official PDF:

  | Exam | Before | After |
  | --- | --- | --- |
  | 2026 | `[2,3,6,7,8,9]` | `[3,4,7,8,9,10]` |
  | 2025 | `[2,3,6,7,8,9]` | `[3,4,6,7,8,9]` |
  | 2024 | `[2,3,6,7,8,9]` | `[3,4,7,8,9,10]` |
  | 2023 | `[2,3,6,7,8,9]` | `[3,4,7,8,9,10]` |

  The old values were a template. They sent "FRQ • Q1" to the Section II cover page and, in 2023, 2024 and 2026, every
  other question to the page before it.
- **Notes.** `notes["2026"]` and `notes.pageLinks` are updated. The page does not display the notes; they document the
  data.

**`free-response-questions/index.html`**
- The archive note's "College Board has released the 2026 FRQs but has not yet posted 2026 scoring guidelines" now
  says that both the FRQs and the scoring guidelines are released, and that 2026 BatchMath videos are coming soon.
- The "Scoring — Not Posted" placeholder was hard-coded to the year 2026. It now appears only for an exam whose data
  has `scoringPending: true`.
  - No exam has that flag now, so no "Not Posted" label is shown.
  - The state stays available for a future year whose FRQs are released before its scoring guidelines.

**`ap-test-preparation/index.html`**
- A new section, "AP Calculus AB Exam Format — Beginning with the May 2027 Exam":
  - the hybrid digital format (Bluebook for multiple choice; handwritten free response);
  - Section I and Section II with question counts, timing, weighting and calculator rules;
  - a short note on what changed and links to the two official sources.
- It uses the page's existing `resource-section` style, with two cards side by side that stack on phones.

**`tools/release-qa.mjs`.** The FRQ data check now requires a scoring URL for every exam set; 2026 was exempt.

## Sources (fetched and read on 2026-11-09)

- **2026 scoring guidelines**, `https://apcentral.collegeboard.org/media/pdf/ap26-sg-calculus-ab.pdf`
  - HTTP 200, `application/pdf`, 26 pages.
  - Title "2026 Scoring Guidelines: AP® Calculus AB".
  - It is linked as "Scoring Guidelines" on the official
    [Exam Questions and Scoring Information](https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam/past-exam-questions)
    page.
- **2026 free-response questions**, `https://apcentral.collegeboard.org/media/pdf/ap26-frq-calculus-ab.pdf`: HTTP 200,
  10 pages.
- **[AP Calculus AB Exam](https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam)** (HTTP 200).
  - Hybrid digital exam: multiple choice answered in Bluebook; free-response answers handwritten in exam booklets.
  - Section I: 42 questions, 1 hour 40 minutes, 50%. Part A: 29 questions, 62 minutes, calculator not permitted. Part B:
    13 questions, 38 minutes, graphing calculator required.
  - Section II: 6 questions, 1 hour 30 minutes, 50%. Part A: 2 questions, 30 minutes, graphing calculator required. Part
    B: 4 questions, 60 minutes, calculator not permitted.
  - "The updates will be effective starting with the May 2027 exams."
- **[Course and Exam Description Clarifications](https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-bc-course-and-exam-description-clarifications.pdf)**
  ("Effective Fall 2026", HTTP 200):
  - multiple-choice Part A changed from 30 to 29 questions, and from 60 to 62 minutes;
  - Part B changed from 15 to 13 questions, and from 45 to 38 minutes.
- **The free-response timing is unchanged.** The 2026 FRQ booklet shows Section II Part A, 30 minutes, and Part B, 1
  hour.

## The six 2026 links (where each button goes)

Each link was read from the rendered page, in By Year and in By Type, at 1366×900 and 390×844. The target page was
read from the official PDF with `pdftotext`.

| Question | Scoring button | Page shows | FRQ button | Page shows |
| --- | --- | --- | --- | --- |
| Q1 | `ap26-sg-calculus-ab.pdf#page=2` | Part A (AB or BC): Graphing Calculator Required · Question 1 · 9 points | `ap26-frq-calculus-ab.pdf#page=3` | 1. Male birds of a certain species… |
| Q2 | `#page=6` | Part A (AB): Graphing Calculator Required · Question 2 · 9 points | `#page=4` | 2. The function f is defined by… |
| Q3 | `#page=11` | Part B (AB or BC): Graphing Calculator Not Allowed · Question 3 · 9 points | `#page=7` | 3. A pie is taken from a hot oven… |
| Q4 | `#page=15` | Part B (AB or BC): Graphing Calculator Not Allowed · Question 4 · 9 points | `#page=8` | 4. Let f be a twice-differentiable function… |
| Q5 | `#page=19` | Part B (AB): Graphing Calculator Not Allowed · Question 5 · 9 points | `#page=9` | 5. A remote-controlled toy car… |
| Q6 | `#page=23` | Part B (AB): Graphing Calculator Not Allowed · Question 6 · 9 points | `#page=10` | 6. The function f is twice differentiable… |

The 2026 exam header also has "Scoring Guidelines ↗", linking to the PDF without an anchor.

The scoring anchors already stored for 2023–2025 were checked the same way and are correct:
- 2023: `[2,5,8,12,15,18]`;
- 2024: `[2,5,9,12,15,19]`;
- 2025: `[2,6,11,15,20,24]`.

## Tests

- **`tools/review-lab/frq/frq-archive-browser.mjs`** (`BM_PORT=8820 BM_BASE=8821`, this branch against `main`):
  **657 checks, 0 failures, 0 console errors, 0 failed local requests**, at 1366×900 and 390×844 touch. It checks:
  - **Links:** all 38 exam sets have FRQ and scoring links in their header, and all 228 questions have an FRQ and a
    scoring button. All 216 video links are present.
  - **2026:** the scoring and FRQ links point at the pages above, in By Year and in every By Type category, and its
    videos read "BatchMath Video — Coming Soon". No "Not Posted" text appears.
  - **Filters:** 2026 shows 1 exam set and 6 FRQs; Form B 10 and 60; Regular 28 and 168; 2011 2 and 12; 2026 with Form
    B shows the empty state.
  - **Views:** By Year and By Type switch with the mouse, Enter and Space, and `#by-type` opens By Type. Tab reaches the
    2026 scoring links, which show a visible focus outline.
  - **Layout:** no page wider than the screen.
  - **Landing page:** the exam-format section has the right text, and its two source links open in a new tab.
- **Link comparison with `main`** (all 1,432 links in both views). The only differences are:
  - the 2026 header scoring link;
  - the twelve 2026 question scoring links (six questions, in By Year and in By Type), which replace the "Not Posted"
    labels;
  - the corrected FRQ anchors for 2023–2026.

  Every historical FRQ, scoring, video and playlist link is unchanged.
- **Repository checks:**
  - `qa:static` passes (0 errors, 0 warnings), including the stricter scoring-URL check.
  - `qa:pwa`, `qa:analytics`, `qa:display` and `qa:semantic` pass.
  - `qa:seo` fails with output identical to `main`. The failures predate this change and concern other pages, among
    them `mogollon2026/problem-list/` and `experiments/mathlive-advanced-notation/`.
  - The CI browser checks `qa:seeded` and `qa:browser-infra` pass with 0 errors.
- **Caching.** The service worker is network-first for pages and scripts, so online visitors get the new data without a
  version change. No version number was changed.

## Limitations

- **Pre-2023 links were not re-checked.** They are Internet Archive snapshots (`web.archive.org`), which this session
  could not reach.
  - Their FRQ anchors use template values (`[2,3,4,5,6,7]` for 1998–2019 and Form B; `[2,3,6,7,8,9]` for 2021–2022), so
    some likely point a page early.
  - Checking them needs network access to `web.archive.org`. Each correction is a one-line data edit.
- **The PDF viewer was not exercised.** The `#page=N` fragment is handled by the student's PDF viewer, as the archive
  already relies on. It could not be exercised in the headless browser, so the targets were checked in the PDFs
  themselves. Some mobile PDF viewers ignore the fragment and open page 1.
- **Adding the 2026 videos.** Set the `video` field of each 2026 row in `frq-data.js` (rows 1–6 of `rows`). The page then
  shows "BatchMath Video" instead of "Coming Soon", in both views.
  - `tools/release-qa.mjs` expects exactly 216 unique video links. Raise it to 222 when the six are added.
  - Update `notes.videos` too.
