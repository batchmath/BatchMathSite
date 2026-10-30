#!/usr/bin/env bash
# Compare two summary.txt files from run-nobrowser.sh / run-browser.sh (e.g. main vs a new build).
# Prints scripts that fail only in the new run (regressions), fail only in the baseline (fixed),
# and fail in both (pre-existing), with the first error line of each log for the pre-existing ones.
# Usage: qa/compare.sh <baseline-outdir> <new-outdir>
B="$1"; N="$2"
fails(){ grep 'rc=' "$1/summary.txt" | grep -v ' rc=0 ' | cut -d' ' -f1 | sort; }
echo "== New failures (regressions to explain):"; comm -13 <(fails "$B") <(fails "$N") | sed 's/^/  /'
echo "== Fixed (fail in baseline only):"; comm -23 <(fails "$B") <(fails "$N") | sed 's/^/  /'
echo "== Pre-existing (fail in both):"
for s in $(comm -12 <(fails "$B") <(fails "$N")); do
  first(){ grep -m1 -iE 'error|fail|assert' "$1/$s.log" 2>/dev/null | cut -c1-140; }
  same=$([ "$(first "$B")" = "$(first "$N")" ] && echo same || echo DIFFERENT)
  echo "  $s  [$same first error] $(first "$N")"
done
