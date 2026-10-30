# Unit 5 generator QA (no browser)

Run from the repository root with Node 18+. Each script loads the shared checker and an engine in a VM with a
seedable RNG, so results are reproducible.

| Script | What it checks |
| --- | --- |
| `smoke.mjs <slug> <engine file> [N]` | family and tier percentages, TeX macro lint, and that every part's canonical and displayed answer passes the checker |
| `throws.mjs <engine global> <engine file> [N]` | self-check failures and rejected parameter sets per family and tier (the engine retries them silently) |
| `kinds.mjs <slug> <engine file>` | one sample per generator kind with the full worked explanation, for reading |
| `show.mjs <slug> <count> fam= tier= seed= files=` | samples filtered by family or tier |
| `nested.mjs <slug> <engine file> [N]` | answers with a fraction inside a fraction |
| `wrong-sep.mjs` | Separable: wrong branch, missing restriction, closed brackets and leftover C are rejected with feedback |
| `slope-qa.mjs [N]` | Slope Fields: grading of correct, imperfect and wrong segment sets and curves (reversal, near-horizontal and near-vertical, undefined slopes, wrong branch, short curves) |
| `dump-ivp.mjs <slug> <file> [N]` then `python3 -I sympy_ivp.py` | Basic and Separable: independent SymPy check. The equation and initial condition are re-parsed from the displayed TeX; the answer is verified by symbolic differentiation and the initial condition, and the interval of validity is recomputed from the structure of the solution and of the original equation (needs `pip install sympy`) |
| `review-audit.mjs [N]` | Comprehensive Review: topic and difficulty percentages, independence, slope-field drawing share, focused modes |
| `verify-rate.mjs [N]` | Rate: independent recomputation of every displayed integral (adaptive Simpson on the re-parsed TeX formula), candidate amounts, instantaneous rates and derivatives |

Example: `node tools/review-lab/unit5/qa/smoke.mjs separable-differential-equations unit5-separable.js 3000`

Browser entry tests are in `tools/review-lab/unit5/entry.mjs` (see `tools/review-lab/README.md`).
