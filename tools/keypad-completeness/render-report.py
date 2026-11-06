"""Write the auditable field CSV and readable findings checkpoint."""
import csv,json,re,sys
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'docs/audits';data=json.loads((D/'KEYPAD-COMPLETENESS-INVENTORY.json').read_text());s=data['summary']
assert not s['pendingRoutes'] and not s['unresolvedDriverFailures'];assert all(r['runtimeProfile'] for r in data['fields'] if not r['retainedControl'])
columns=['course','unit','route','family','questionId','selector','seed','representation','part','field','runtimeProfile','requiredAnswer','requiredRepresentation','enteredLatex','serializedSource','answerForms','requiredControls','displayedControls','keypadEnterable','originalCorrectAccepted','wrongRejected','missingControl','semanticCorrectAccepted','meaningfulAlternatives','evidencePhase','resumedFrom','driverRetestEvidence','evidence','error']
def labels(keys):return' | '.join(data['controls'][k]['aria'] or data['controls'][k]['label'] for k in keys)
with (D/'KEYPAD-COMPLETENESS-MATRIX.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=columns,lineterminator="\n");w.writeheader()
 for r in data['fields']:
  row={k:r.get(k) for k in columns};row['requiredControls']=labels(r['requiredControlsUsed']);row['displayedControls']=labels(data['buttonSets'].get(r['buttonSet'],[]));
  for k,v in row.items():
   if isinstance(v,(dict,list)):row[k]=json.dumps(v,separators=(',',':'))
  w.writerow(row)
if '--matrix-only' in sys.argv:
 print('Wrote',len(data['fields']),'current field rows');raise SystemExit
if data['state']!='findings-complete':raise SystemExit('Only --matrix-only is supported for corrected/final inventories; preserve the C/D report text.')
counts=Counter()
for r in data['coverage']:
 if r['kind']=='mathematical':
  path=r['route'];course='AP Calculus' if path.startswith('ap-calculus') else'IM1' if path.startswith('im1') else'Calculus Prep';unit=re.search(r'unit-(\d)',path);counts[(course,unit.group(1) if unit else'Prep')]+=1
route_table='\n'.join(f"| {r['route']} | {r['caseCount']} | {r['passingCases']} | {r['failingCases']} |" for r in data['coverage'] if r['kind']=='mathematical')
course_table='\n'.join(f'| {course} | {unit} | {n} |' for (course,unit),n in sorted(counts.items()))
text=f'''# Sitewide keypad completeness — completed findings

**Checkpoint B is complete. These are findings before corrections. Product keypad files are unchanged from video checkpoint `57a51aae03ba6ef7544b746e1e5f4c504f1fdfdf`; Checkpoints C and D remain pending.**

The approved video work is preserved: 66 pages, 198 recordings, seven wider expandable review recordings and the narrow-heading correction. It has not been repeated or redesigned.

## Scope and new evidence

All **118 mathematical routes** in the 138-route inventory were reviewed. The other 20 retain specialized choices, graph/drawing interactions or navigation. No mathematical editor was added to those controllers. Unit 6 is excluded.

| Course | Unit | Mathematical routes |
|---|---|---:|
{course_table}

The [field matrix](KEYPAD-COMPLETENESS-MATRIX.csv) and [machine-readable inventory](KEYPAD-COMPLETENESS-INVENTORY.json) contain every reviewed field/family record, selector/seed, active profile, displayed controls, controls pressed, expression, original checker result, missing control and evidence reference. Repeated control definitions use explicit dictionaries in the JSON.

| Fresh finding metric | Count |
|---|---:|
| Deterministic question/form cases, including retained native interactions | {s['questionFormCases']:,} |
| Mathematical field rows | {s['mathematicalFieldRows']:,} |
| Route/family/part/field/profile signature groups | {s['familyFieldContracts']:,} |
| Keypad-only correct mathematical-part assertions | {s['keypadCorrectPartTests']:,} |
| Wrong mathematical-part rejection assertions | {s['wrongPartTests']:,} |
| Separately labeled original-checker acceptance witnesses | {s['semanticOnlyAcceptanceWitnesses']:,} |
| Actual runtime profile names observed | {s['runtimeProfileNames']} |
| Distinct displayed control sequences | {s['runtimeButtonSets']} |
| Field rows blocked by a confirmed control gap | {s['missingControlRows']} |
| Unresolved driver failures / pending mathematical routes | 0 / 0 |

These are finite metadata/signature groups, not counts of independent mathematical families or every possible coefficient. Correct-part counts include explicit meaningful-alternative assertions, while setup/replay submissions are not counted again. Semantic-only legacy/Node checker witnesses are never counted as keypad-only successes. The profile specification currently contains 150 registered names; registration alone does not establish reachability or completeness.

## Confirmed gaps and planned corrections

| Finding | Reproduction and actual profile | Necessary correction in C |
|---|---|---|
| Required absolute value | Derivative comprehensive review, `review_chain_inverse_trig`, inverse secant/cosecant; active `migration-derivative-exp` lacks `\\|u\\|` | Select a scoped inverse-chain review profile retaining current controls and exposing absolute value |
| Exact intervals on calculator analysis | `u3-analysis-f-qf-increasing` requires radical/arithmetic endpoints; `u3-analysis-f-trig-increasing` requires exact π fractions; active `ml-unit3-rounded-interval` | Choose the keypad from the generated field's required decimal precision; retain the decimal keypad for rounded fields |
| Accepted decimal representation | Linearization `u3-lin-sqrt-16-1` accepts `4.125` and displays `33/8`; standalone uses `ml-unit3-algebraic-exact`, assignment review uses `ml-unit3-exact` | Enable decimal controls only on fields whose generated, non-exact-required answer contract calls for them |
| Degree profile changes after typesetting | Reference angle `ref-210-false` accepts `30°`; question text becomes `𝜃 =210∘`, and active `ml-prep-radians` omits ° | Recognize source and rendered degree notation when selecting the existing degrees profile |
| Indexed-root representations | 106 blocked field rows; 15 existing named profiles across derivatives, integrals, basic differential equations and separable intervals | Expose the existing editable indexed-root template only on the demonstrated profiles |
| Square-root representation in θ substitution | Three supported radical-form cases on `unit4-usub-theta` | Expose the existing square-root template on this profile; no unnecessary indexed-root key is needed |

The 119 blocked rows are repeated question/form witnesses, **not 119 independent bugs**. Every root-form finding is backed by the unchanged original checker accepting the representation. Examples include cube/fourth roots in derivative answers, radical antiderivatives with student-entered `+C`, basic differential-equation solutions in x/t, and the interval endpoint `root(4,e)`.

Indexed-root gaps affect `derivative-power`, `derivative-product`, `derivative-chain`, `migration-derivative-exp`, `migration-derivative-log`, `migration-derivative-trig`, `migration-derivative-implicit`, `migration-derivative-inverse`, `unit4-basic-indef`, `unit4-usub-x`, `unit4-usub-t`, `unit4-usub-r`, `ml-unit5-basic-x`, `ml-unit5-basic-t`, and `unit5-sep-interval`. Standalone and review registrations of the last profile must remain aligned.

No product fix is claimed at this checkpoint. The source patch is prepared separately for application after this findings commit is pushed.

## Priority approximation investigation

The reachable tangent/secant exercise is an exact-value field followed by four native Underestimate/Overestimate-plus-reason choices. At 375px and 1280px, the browser constructs `9/4`, rejects `9/5`, rejects an incorrect classification, then accepts the correct numerical/classification sequence. The numerical part explicitly requires exact form. No missing decimal or classification-word control is demonstrated; its existing profile and native classification interaction are preserved. See `evidence/keypad-approximation-investigation-negative-verified.json`.

The separate linearization decimal finding has a different contract: its generator supplies an accepted decimal expression and does not require exact form. It must not cause decimal keys to appear in the strict approximation exercise.

## Required forms and meaningful alternatives

Canonical cases exercise signed integers, decimals and required precision, fractions, powers, roots, π/e, trigonometric/inverse-trigonometric functions, logarithms, absolute value, variables, equations, lists, pairs, intervals, union/infinity, DNE/Undefined/None, integration constants, sequence subscripts and limit/summation setups. Required equation forms, simplification and precision checks remain owned by their original graders.

Meaningful alternatives include indexed-root versus rational-power notation, explicit `f(n)` sequence notation, existing `a₁`, `aₙ`, `aₙ₋₁` controls, factored/simplified forms where allowed, ± rational-root lists, degree notation, and the demonstrated accepted linearization decimal. Artificial identities such as replacing an integer by a trigonometric expression are outside this audit.

Existing cube-root buttons on separable solution profiles correctly construct third roots; they do not require an additional nth-root key merely because the test's internal AST calls the function `root(3,…)`. Given variable prefixes, currency decorations and percentage units are supplied by the question/field; their numeric values are tested without requiring decorative input buttons. Choice-only branches remain native.

## How coverage was established

The harness serves actual local pages, pinned MathLive 0.111.1 and real MathJax fixtures. Test-only instrumentation exposes original generator fixtures, preserves rich browser-generated functions, and stamps the mode inside the actual `buildPad` call. Earlier private-pad observations are named by an exact route and visible-button-sequence match against fresh live observations. All mathematical field rows now identify a runtime profile.

`enter-answer.mjs` reads the public selection/last-offset data and clicks the controls actually displayed for the active field. It does not type missing symbols or call MathLive answer setters/insertion APIs. The original button callbacks perform insertion and translation, and the page's unchanged checker grades the result. Batched DOM clicks exercise those callbacks; physical pointer/touch geometry and viewport movement are checked separately.

Each public generator mode is sampled deterministically. Browser witnesses cover observed structural/control features within generator-family and field-contract groups, with explicit required/covered feature lists. Numeric parameter combinations that add no new input requirement are not represented as new mathematical families. Every eligible registered Unit 5 family is reconciled against its source declarations and calculator eligibility in `evidence/keypad-generator-catalog-coverage.json`.

Dynamic cases advance through native parts, switch active fields and profiles, and preserve earlier values. Shared field contracts are exercised in standalone and review pages. Optional slope/curve entry covers all existing typed alternative fields on the standalone page and both Unit 5 reviews, with original correct/wrong grading. These alternatives do not replace drawing controls.

## Driver corrections and exclusions

Initial failures were investigated before being called website defects. The driver now distinguishes approach arrows from cursor arrows, handles mixed interval delimiters/unions and ± lists, waits for native progression/unlocking, uses cube-root buttons already present, omits redundant scalar grouping when no grouping key is required, and separates supplied labels/units from student input. A transient staged-advance timeout passed isolated reproduction; native continuation is activated after state readiness to avoid MathJax reflow during automated pointer targeting. Pointer behavior remains part of the established browser regressions.

{ s['cancelledAttemptsExcluded'] } attempts from deliberately interrupted exploratory runs are explicitly excluded from pass/fail totals. Their cancellation evidence is retained; no success is inferred. Later complete coverage witnesses and focused reruns replace the interrupted work. There are no remaining unresolved driver failures in this findings ledger.

## Mathematical-route findings matrix

`Blocked/failed` below describes pre-correction findings. The complete field-level details and required controls are in the linked CSV/JSON.

| Practice route | Cases | Passing | Blocked/failed |
|---|---:|---:|---:|
{route_table}

## Completion steps

Checkpoint C must apply only the confirmed profile/renderer corrections, preserve the failing-before evidence, demonstrate correct insertion and original correct/wrong grading, test shared profiles and dynamic fields, update profile documentation, then commit/push.

Checkpoint D must run fresh established Node, default/legacy/missing-runtime route, stability, IM1 responsive, video-presentation and video-sizing suites; complete source/content protection checks; verify the unchanged Unit 6 tree; then commit/push and prepare the complete-site test ZIP. This findings checkpoint is not final regression or delivery approval.

## Reproduction and limitations

Run from the repository root with Chromium/Playwright and `MATHJAX_FIXTURE_ROOT` pointing to the real local fixture directory. Evidence files record selectors, seeds, question IDs, active parts, controls and expressions. Examples:

```sh
node tools/keypad-completeness/unit2-browser.mjs
ALTERNATIVE_ROOTS=1 REPORT_SUFFIX=-roots-before node tools/keypad-completeness/unit2-browser.mjs
EXPAND_ANSWER_FORMS=1 ROUTE_INDEX=36,37,38,39,40,41,42,43,44,45,46 node tools/keypad-completeness/dynamic-browser.mjs
REQUIRE_PASS=1 VERIFY_LAYOUT=1 REPORT_SUFFIX=-corrected node tools/keypad-completeness/unit2-browser.mjs
```

`REQUIRE_PASS=1` makes any recorded failure or page error fail the run. Finding collection intentionally retains expected failures without claiming repair. `REPLAY_FILE` selects prior failed IDs; `AUDIT_PRIOR` reuses explicitly passing witnesses; retest-only rows do not substitute for a full route's coverage. `coverage-witnesses.mjs` records the finite control-feature proof.

Finite seeded/source-family coverage does not prove every arbitrary equivalent expression. Tests use headless Chromium, rather than physical-device or assistive-technology certification. Original YouTube media playback is outside the keypad audit; the approved sizing/presentation evidence and its stated limits remain in the video report. No generator, checker or answer-acceptance rule has been changed in B.
'''
(D/'KEYPAD-COMPLETENESS-FINAL.md').write_text(text)
print('Wrote',len(data['fields']),'field rows and',len([r for r in data['coverage'] if r['kind']=='mathematical']),'route summaries')
