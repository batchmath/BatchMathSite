# SAT & ACT Math Practice — Google Analytics 4

Property: the existing BatchMath GA4 tag `G-377MTFXSF3`. Every SAT & ACT page loads the standard gtag snippet.

## How it is wired

- The library uses the **shared tracker** `/assets/problem-tracking.js` (`BMAnalytics`): same offline queue, common
  parameters, `?bm_debug=1` panel and `debug_mode` flag as the 165 practice engines. It is not a second tracking system.
- The library's runtime (`/assets/sat-act/sat-act-practice.js`) sets the engine identity before loading the tracker:
  `course = sat_act_math`, `engine_id = sat_act_library`, `generator_version = 1`.
- SAT & ACT pages do **not** contain the static `BM_ANALYTICS_CONFIG` + `problem-tracking.js` tags that
  `tools/release-qa.mjs` and `tools/analytics-qa.mjs` use to identify the 165 seeded generator engines, so those checks
  (and their count of 165) are unchanged. `npm run qa:sat-act` checks the library's analytics instead.
- One additive change to the shared tracker: `BMAnalytics.trackEvent(name, problem, extra)` for named events such as
  the video events. It reuses the same queue and parameters and **refuses** the five contract names
  (`practice_started`, `problem_generated`, `answer_checked`, `answer_correct`, `solution_revealed`), so
  `answerChecked()` remains the only source of `answer_checked` / `answer_correct`. Existing engines are unaffected.
- **Not sent:** names, accounts, the chosen letter, typed answers, question text or any other personal data.
  Parameter values are normalized to lowercase slugs by the tracker.

## Events

Every event carries the tracker's common parameters: `course`, `engine_id`, `generator_version`, `app_version`,
`tracking_schema`, `event_sequence`, `offline_queued` (and `debug_mode` with `?bm_debug=1`).

Question events also carry: `problem_id` (stable source ID, e.g. `radical_equation_s0003`), `problem_number`
(`002`), `subject`, `skill`, `exam_scope` (`sat_act`), `difficulty`, `question_format`, `practice_mode`
(`topic`, `mixed` or `browse`), `session_position`, plus the tracker's `problem_type` (= skill) and
`problem_variant` (= problem ID).

| Requirement | Event | When | Extra parameters |
|---|---|---|---|
| Practice session started | `practice_started` | Once per session: first question page of a topic/mixed set, or the first interaction of a visitor who arrived directly on a question | `practice_mode`, `difficulty_filter`, `subject_filter`, `skill_filter`, `session_size`, `entry_page` |
| Problem presented | `problem_generated` (existing name, kept so engine reports stay comparable) | Once per question per session (a reload does not resend) | — |
| Answer submitted + result | `answer_checked` | **Once per question per session: the first (scored) answer** | `answer_result` (`correct`/`incorrect`), `attempt_number` = 1 |
| Correct on first attempt | `answer_correct` | With `answer_checked`, only when that first answer is correct | same as above |
| Later attempts | `answer_retry` | Each later answer to the same question | `answer_result`, `attempt_number` |
| Distinct problem completed | `problem_completed` | Once per question per session, when the student has the answer in hand: correct answer, written solution opened, or explanation video finished | `completion_method` (`correct_answer`, `written_solution`, `video_ended`), `first_attempt_result` (`correct`, `incorrect`, `not_answered`) |
| Written solution revealed | `solution_revealed` (existing name) | Once per question per session | `reveal_trigger` (`button`, `summary_toggle`, `incorrect_no_video`, `video_panel_button`, `video_ended`, `video_unavailable`), `first_attempt_result` |
| YouTube explanation started | `explanation_video_start` | First time the player reports PLAYING for that question | `video_trigger` (`after_incorrect`, `after_correct`, `requested`), `start_seconds` |
| YouTube explanation completed | `explanation_video_complete` | Player reports ENDED | `video_trigger` |
| Video problem (monitoring) | `explanation_video_error` | Player error, blocked/slow API, or a player that never becomes ready | `error_type` (`player_error_<code>`, `api_blocked`, `api_timeout`, `player_timeout`) |
| Practice session completed | `practice_completed` | Once per session: the student finishes the set or presses End Session | `end_reason` (`finished`, `ended_early`), `problems_answered`, `problems_correct`, `problems_completed`, `problems_presented`, `session_size` |

Duplicate prevention lives in the tab's session state (`sessionStorage`), so reloads, Back/Forward and returning to a
question do not resend presentation, answer, completion, reveal or video events. Scoring counts each question once,
using the first submitted answer; retries never produce `answer_checked` or `answer_correct`.

Video event names deliberately avoid GA4's Enhanced Measurement names (`video_start`, `video_complete`). If the
property's Enhanced Measurement "Video engagement" option is on, GA may also record its own generic video events for the
embedded player; those carry no problem metadata. Use the `explanation_video_*` events for this library.

## Register these custom definitions (manual step in GA4)

GA4 only reports custom parameters after they are registered (Admin › Data display › Custom definitions), and only
from the registration date forward, so register them **before launch**. Skip any that already exist (the practice
engines may already have `practice_mode` or `answer_result`).

**Event-scoped custom dimensions — needed for the questions you asked**

| Dimension name | Event parameter |
|---|---|
| Problem ID | `problem_id` |
| Subject | `subject` |
| Skill | `skill` |
| Practice mode | `practice_mode` |
| Answer result | `answer_result` |
| First attempt result | `first_attempt_result` |
| Completion method | `completion_method` |

**Recommended**

| Dimension name | Event parameter |
|---|---|
| Problem number | `problem_number` |
| Exam scope | `exam_scope` |
| Difficulty | `difficulty` |
| Reveal trigger | `reveal_trigger` |
| Video trigger | `video_trigger` |
| Session end reason | `end_reason` |
| Engine ID | `engine_id` (to separate this library from the course engines) |

Optional: `entry_page`, `subject_filter`, `skill_filter`, `difficulty_filter`, `error_type`, `question_format`.

**Custom metrics (event-scoped, unit: Standard)**

| Metric name | Event parameter | Sent on |
|---|---|---|
| Problems answered in session | `problems_answered` | `practice_completed` |
| Problems correct first try in session | `problems_correct` | `practice_completed` |
| Problems completed in session | `problems_completed` | `practice_completed` |
| Session size | `session_size` | `practice_started`, `practice_completed` |

## Answering your questions in GA4

Filter every report to `engine_id = sat_act_library`.

| Question | Where to look |
|---|---|
| How many problems students actually answer | Event count of `answer_checked` |
| How many distinct problems are completed | Event count of `problem_completed` (one per question per session); unique `problem_id` values for library coverage |
| How many answers are correct on the first attempt | Event count of `answer_correct`; first-try accuracy = `answer_correct` ÷ `answer_checked`, by `problem_id` or `skill` |
| Which topics are most popular | `problem_generated` or `answer_checked` by `subject` and `skill`; page views of `/sat-act-math/topics/…` |
| How often students use video explanations | `explanation_video_start` vs `answer_checked` where `answer_result = incorrect`; completion rate = `explanation_video_complete` ÷ `explanation_video_start` |
| Questions completed per session | Average of the `problems_completed` metric on `practice_completed`; or an Exploration of `problem_completed` per session |

Sessions that are abandoned without Finish or End Session send no `practice_completed`, so per-session averages from
that event describe finished sessions. For all sessions, use an Exploration on `problem_completed` grouped by session.

## Verifying tracking

1. Open any library page with `?bm_debug=1`, for example `/sat-act-math/?bm_debug=1`. Debug mode stays on for that tab.
   A panel at the bottom right counts each event, and every event is printed to the browser console as
   `[BatchMath analytics] <event> {…}`.
2. In GA4: Admin › DebugView. Events from that tab arrive with `debug_mode` and appear within seconds. Walk through:
   start a mixed set → answer one question correctly, one incorrectly then correctly, open a solution before answering
   on a third → finish or end the session. Expect: 1 `practice_started`; one `problem_generated` per question;
   `answer_checked` once per answered question; `answer_correct` only for first-try correct; `answer_retry` for the
   corrected one; `problem_completed` once per question; `solution_revealed` once per question; 1 `practice_completed`.
3. Browser DevTools › Network, filter `collect`: each event is a request whose `en=` value is the event name.
4. Add `?bm_debug=0` to turn debug mode off for the tab.

Local previews (`py -m http.server 8000`) also send real events to the production property when online. Use
`?bm_debug=1` while testing and consider activating GA4's built-in **Developer traffic** data filter
(Admin › Data collection and modification › Data filters) so debug events stay out of standard reports.

Automated checks: `npm run qa:sat-act` runs the real tracker in a sandbox (contract, `trackEvent` validation and refusal
of contract names); `npm run qa:sat-act-browser` captures every event in a real browser and asserts the counts above,
parameter hygiene and duplicate prevention. `npm run qa:analytics` (165 engines) is unchanged and passes.
