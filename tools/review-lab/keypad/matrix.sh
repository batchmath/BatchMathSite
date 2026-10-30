#!/usr/bin/env bash
# Keypad-only entry on the four typed Unit 4 engines at four screen sizes, plus the Comprehensive Review's four
# typed modes at laptop and phone size; 3 runs at a time. One JSON result per run, then a one-line summary each.
# Usage: keypad/matrix.sh [outdir]
. "$(dirname "${BASH_SOURCE[0]}")/../lib/env.sh"; OUT="${1:-$REVIEW_HOME/out/keypad-matrix}"; mkdir -p "$OUT"; rm -f "$OUT"/*.json
jobs=()
for vp in "1920 1080" "1366 768" "1024 768" "390 844 m"; do set -- $vp
  for pg in basic-integrals u-substitution-integrals integrals-resulting-in-natural-log-and-inverse-trigonometric-functions mean-value-theorem-for-integrals; do
    n=8; [ "$pg" = mean-value-theorem-for-integrals ] && n=12; jobs+=("-|$pg|$n|$1|$2|${3:-}"); done; done
for vp in "1366 768" "390 844 m"; do set -- $vp
  for m in basic usub log mvt; do jobs+=("$m|comprehensive-review|8|$1|$2|${3:-}"); done; done
run(){ IFS='|' read -r m pg n w h mob <<< "$1"
  if [ "$m" = - ]; then f="$OUT/$pg-${w}x$h.json"; timeout 500 node "$LAB/keypad/entry.mjs" "$pg" "$n" "$w" "$h" $mob > "$f" 2>&1
  else f="$OUT/review-$m-${w}x$h.json"; BM_SELECT=$m timeout 500 node "$LAB/keypad/entry.mjs" "$pg" "$n" "$w" "$h" $mob > "$f" 2>&1; fi; }
export -f run; export OUT LAB
printf '%s\n' "${jobs[@]}" | xargs -P 3 -I{} bash -c 'run "{}"'
cd "$OUT" && for f in *.json; do node -e "
const f=process.argv[1];try{const j=JSON.parse(require('fs').readFileSync(f,'utf8'));
console.log(f.padEnd(82),'checked',j.checked,'failures',j.failures.length,'overflow',j.overflow.length,'undo',j.undo?.ok,'errors',j.errors.length,j.failures[0]||'');}
catch(e){console.log(f,'NO RESULT')}" "$f"; done | tee "$OUT/summary.txt"
