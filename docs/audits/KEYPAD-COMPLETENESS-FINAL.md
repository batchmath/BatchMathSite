# Keypad completeness audit — recovery checkpoint

**Status: Checkpoint B remains in progress. No production keypad corrections have been applied. Checkpoints C and D and the final test ZIP remain outstanding.**

The approved video checkpoint `57a51aae03ba6ef7544b746e1e5f4c504f1fdfdf` is preserved. This checkpoint saves the resumed browser harness and completed evidence while the longer calculus review runs continue. It is not the completed findings checkpoint.

The scope remains 138 inventoried routes, including 118 with mathematical entry. Unit 6 is excluded. Registered profile counts and editor-loading checks are inventories, not evidence of answer completeness.

## Verification method

`tools/keypad-completeness/browser-harness.mjs` serves the actual local pages, pinned MathLive, real local MathJax fixtures and original generators/checkers. Test-only instrumentation exposes existing generator fixtures and labels the actual runtime keypad. It does not alter acceptance rules.

`enter-answer.mjs` parses an expected answer, clicks the buttons actually displayed for the active field, reads the resulting MathLive expression, and lets the page submit through its original checker. Answer construction never calls MathLive insertion/value setters or physical-keyboard typing. Batched DOM button clicks exercise the actual callbacks; pointer geometry, touch and viewport movement are covered separately by the established stability suites.

The ledgers retain question IDs, selector/seed data, active profiles, visible controls, pressed controls, serialized expressions, original correct/wrong results and failures. Choice and drawing interactions remain specialized. Currency decorations and repeated supplied variable prefixes are distinct from mathematical input requirements. Native progression and field-lock timers must settle before the test advances.

## Completed fresh runs saved here

| Scope | Result | Evidence |
|---|---:|---|
| AP Calculus Unit 2, all 23 mathematical routes | 2,363 passing cases; 2 reproducible missing-absolute-value cases | `evidence/keypad-completeness-unit2.json` |
| IM1 Unit 3, all 22 mathematical routes | 251/251 cases, including multipart fields and explicit-form `f(n)` alternatives | `evidence/keypad-completeness-im1-unit3-verified.json` |
| IM1 Units 1–2, all 13 mathematical routes | Initial findings plus passing focused interval, comprehensive-review and equation reruns; see ledger | `evidence/keypad-completeness-im1*.json` |
| Calculus Prep, all 6 mathematical routes | 92 initial passes; RRT driver corrected and 5/5 rerun; degree-symbol gap reproduced | `evidence/keypad-completeness-prep*.json` |
| Optional slope/curve entry on standalone and both Unit 5 reviews | 6/6 cases, each correct and wrong, all optional fields | `evidence/keypad-completeness-slope.json` |

These are finite family/form cases, not counts of mathematically independent families. The partial machine-readable [inventory](KEYPAD-COMPLETENESS-INVENTORY.json) explicitly identifies routes awaiting inclusion. Initial harness failures are retained in their source evidence and superseded by named focused reruns where available.

## Findings under verification

1. **Required absolute value:** derivative comprehensive review, `review_chain_inverse_trig`, inverse secant and inverse cosecant cases use `migration-derivative-exp`, which lacks `|u|`. The generated denominators require absolute value. Targeted before evidence: `evidence/keypad-completeness-unit2-absolute-before.json`.
2. **Supported degree notation:** reference-angle question `ref-210-false` expects `30°`. MathJax renders the degree glyph as `∘`; the profile picker checks only literal `°`, and selects `ml-prep-radians`. Three settled-browser prior-mode states reproduce this in `evidence/keypad-degree-investigation.json`. Bare `30` also passes the original checker, so this is a useful accepted representation gap, rather than a numerical-input dead end.
3. **Required exact interval controls on a calculator page:** analysis families can generate exact radical and π endpoints with no required decimal precision. The page-wide calculator flag selects `ml-unit3-rounded-interval`, omitting the required radical/fraction/π controls. Ongoing Unit 3 evidence contains the exact question IDs and active buttons. The correction must follow the generated field's answer contract.
4. **Supported decimals:** linearization question `u3-lin-sqrt-16-1` stores accepted expression `4.125`, displays `33/8`, and does not require exact form. Its active `ml-unit3-exact` profile lacks a decimal control. This is distinct from tangent/secant questions that explicitly require exact form. Original-checker acceptance and appropriate field-specific selection are being verified.
5. **Indexed-root alternatives:** fractional powers that arise in generated radical exercises have meaningful indexed-root representations. Browser tests are verifying these against the actual keypad and unchanged checker. A separate legacy-checker acceptance witness is labeled as semantic evidence; it is never counted as a keypad-only pass. No root-control fix is claimed here.

The priority tangent/secant page uses one exact-value field followed by native Underestimate/Overestimate-plus-reason choices. Two viewport cases enter `9/4` through the keypad and complete classification. No missing decimal or word controls have been demonstrated for that actual contract. Its existing behavior is preserved.

## Resume and completion requirements

1. Finish AP Unit 1 review/location tests and all dynamic AP Units 3–5 families and answer forms. Recheck driver failures after waiting for native progression, disambiguating approach versus cursor arrows, preserving interval/rounding syntax and separating supplied labels from input.
2. Reconcile registered finite generator-family catalogs with seeded family/form coverage. Finish supported-alternative and multipart/selector checks. Complete this report and the ledger with truthful coverage and limitations.
3. Commit and push the completed findings as Checkpoint B before product changes.
4. Implement only confirmed profile/renderer/button gaps, preserve before evidence and original graders, test correct/wrong results and shared profiles, then commit/push Checkpoint C.
5. Rerun the full established suites and new keypad-only tests, verify the Unit 6 tree against `919ca1806f07e3cd2af552142926e7ca2b78e8d5`, check protected branch heads, and commit/push Checkpoint D.
6. Prepare `batchmath-video-sizing-keypad-audit.zip`, or provide the exact archive URL pinned to the final tested commit. Do not deploy, merge to main or create a release.

All scripts run from the repository root with Node/Playwright and Chromium. Set `MATHJAX_FIXTURE_ROOT` to a local MathJax fixture directory. Examples:

```sh
node tools/keypad-completeness/unit2-browser.mjs
REPORT_SUFFIX=-verified node tools/keypad-completeness/im1-unit3-browser.mjs
ROUTE_INDEX=26 REPORT_SUFFIX=-newton-complete node tools/keypad-completeness/dynamic-browser.mjs
ALTERNATIVE_ROOTS=1 REPORT_SUFFIX=-indexed-roots-before node tools/keypad-completeness/unit2-browser.mjs
```

Dynamic route indexes are defined by filtering the current field inventory for mathematical pages that load `BM_TOPIC_PRACTICE`. `REPLAY_FILE` selects prior failed question IDs; `AUDIT_PRIOR` skips explicitly passing IDs; `EXPAND_ANSWER_FORMS` retains distinct structural/control signatures. Retest-only coverage rows do not replace a full route's coverage. Scripts currently record expected pre-correction failures; final acceptance must inspect the evidence and enable strict pass gating.
