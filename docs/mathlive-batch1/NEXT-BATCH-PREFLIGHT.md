# Next-batch derivative preflight

Reference: `adae2a2b00580f29befba88f593f4f627e2850c5`. No production source or checker was changed during this check.

No mathematical defect or incorrect-answer rejection was confirmed in the bounded sample.

| Engine / mode | Questions | Stored/display comparisons | Independent derivative cases / finite points | Correct / wrong checker submissions |
| --- | ---: | ---: | --- | --- |
| derivatives-of-trigonometric-functions / without | 60 | 60 | 60 / 300 | 60 / 60 |
| derivatives-of-trigonometric-functions / with | 240 | 240 | 240 / 1200 | 240 / 240 |
| exponential-functions / topic | 100 | 100 | 100 / 494 | 100 / 100 |
| exponential-functions / cumulative | 40 | 40 | 0 / 0 | 40 / 40 |
| derivatives-of-logarithmic-functions / topic | 120 | 120 | 120 / 600 | 120 / 120 |
| derivatives-of-logarithmic-functions / cumulative | 40 | 40 | 0 / 0 | 40 / 40 |

## Reachable topic families

Trig without Chain: tnc-sin, tnc-cos, tnc-tan, tnc-sec, tnc-csc, tnc-mix (sin + tan). With Chain: tcj1–tcj10, tcj-cube-{sin,cos,tan}, tcj-poly-{sin,cos,tan,sec,csc,cot}. All 25 signatures were sampled.

Exponential: e1–e5 and eadv-sec, eadv-cot, eadv-tan; all eight sampled. Logarithmic: lg-linear, lg-poly, lg-sin, lg-cos, lg-log, lg-exp, lg-root, lg-base-poly, lg-base-trig, lg-base-log, lg-rational, lg-product; all 12 sampled.

Cumulative exponential includes basic/product/quotient/trig/chain/exponential, filtering the factor catalog to 13 product pairings / 25 quotient orientations. Cumulative logarithmic additionally includes implicit/log, with 19 product pairings / 37 quotient orientations. The 40-question cumulative samples reached all category names, but do not exhaust their inherited families.

## Method and limits

600 deterministic questions; 520 topic-focused questions were also differentiated using dual-number arithmetic on the displayed function AST, independently of the original grader evaluation. Five positive x values (.23,.51,.87,1.17,1.63) were attempted per topic question; 2,594 finite/moderate points were compared (six nonfinite/very large points excluded). This is numerical evidence, not a symbolic proof or a domain-boundary audit.

Displayed derivative TeX was translated structurally and compared with stored answerExpr through each original checker. Stored correct and +12345 incorrect responses were submitted to each real check() closure: 1,200 checker submissions, no mismatches. No question was skipped. Cumulative samples received stored/display and checker comparisons, not independent differentiation. No browser suites ran.

Seed per sample: i*719+mode.length, LCG step (1664525*seed+1013904223) modulo 2^32. Existing TeX AST parsing was reused; dual arithmetic/evaluation was separate. VM-only hooks exposed closures without shipping changes.

Sources: each topic practice/index.html functions trig(), exponential(), logDeriv(), makeProblem(), check(); assets/derivative-rule-factors.js; existing adapter parser. Topic selectors are Without/With Chain for trig and Topic/Cumulative for exponential/logarithmic. Hidden copied generators are not counted as reachable topic families.

Proceed with the migration while retaining targeted grading regression checks. No proof of exhaustive parameter, accepted-alternative, floating-point edge, or cumulative-family coverage is claimed.
