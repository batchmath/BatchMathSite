#!/usr/bin/env bash
# Unit 6 answer entry on every Unit 6 page and Practice Type, at desktop and phone sizes (tools/review-lab/unit6/entry.mjs).
# Usage: tools/review-lab/unit6/entry-matrix.sh [count per run=6] [outdir]
. "$(dirname "${BASH_SOURCE[0]}")/../lib/env.sh"
N="${1:-6}"; OUT="${2:-$REVIEW_HOME/out/unit6/entry}"; mkdir -p "$OUT"; cd "$REPO"
T=ap-calculus/unit-6-applications-integration/topics
runs=(
 "$T/area-below-and-between-curves/non-calculator-practice:mixed under_curve between"
 "$T/area-below-and-between-curves/calculator-practice:mixed under_curve between"
 "$T/finding-area-in-terms-of-y/practice:"
 "$T/volume-by-cross-sections/non-calculator-practice:mixed perp_x perp_y"
 "$T/volume-by-cross-sections/calculator-practice:mixed perp_x perp_y"
 "$T/solids-of-revolution/non-calculator-practice:mixed disks_washers shells"
 "$T/solids-of-revolution/calculator-practice:mixed disks_washers shells"
 "$T/comprehensive-review/non-calculator-practice:mixed frq_region frq_graph short"
 "$T/comprehensive-review/calculator-practice:mixed frq_region short"
)
: > "$OUT/summary.txt"
for r in "${runs[@]}"; do page="${r%%:*}"; modes="${r#*:}"; [ -z "$modes" ] && modes="-"
 for mode in $modes; do for size in "1366 768" "390 844 mobile"; do
  name="$(echo "$page" | awk -F/ '{print $(NF-1)"-"$NF}')-$mode-$(echo $size | tr ' ' 'x')"
  if [ "$mode" = "-" ] || [ "$mode" = "mixed" ]; then m=""; else m="$mode"; fi
  BM_MODE="$m" timeout 900 node tools/review-lab/unit6/entry.mjs "$page" "$N" $size > "$OUT/$name.json" 2>&1; rc=$?
  echo "$name rc=$rc $(node -e "try{const o=JSON.parse(require('fs').readFileSync('$OUT/$name.json','utf8'));console.log('checked',o.checked,'parts',o.parts,'integrals',o.integrals,'failures',o.failures.length,'errors',o.errors.length,'scroll',o.scrollBoxes.length,'overflow',o.pageOverflow)}catch(e){console.log('unreadable')}")" >> "$OUT/summary.txt"
 done; done
done
echo DONE >> "$OUT/summary.txt"
