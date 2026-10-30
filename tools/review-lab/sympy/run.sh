#!/usr/bin/env bash
# Independent check of the four typed Unit 4 engines: export N problems per engine (default 500), then verify
# every displayed answer with SymPy/mpmath at 40 digits (derivatives, quadrature, MVT continuity and roots).
# Usage: sympy/run.sh [per-engine] [outdir]
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/../lib/env.sh"; N="${1:-500}"; OUT="${2:-$REVIEW_HOME/out/sympy}"; mkdir -p "$OUT"
node "$LAB/sympy/export-sample.mjs" "$N" "$OUT/sample.json"
python3 -I "$LAB/sympy/crosscheck.py" "$REVIEW_HOME/pylib" "$OUT/sample.json" "$OUT/report.json"
python3 -c "import json,sys;r=json.load(open(sys.argv[1]));f=sum(e['failures'] for e in r['byEngine'].values());print(f\"{r['checked']} problems, {r['answers']} answers, {f} failures\");sys.exit(1 if f else 0)" "$OUT/report.json"
