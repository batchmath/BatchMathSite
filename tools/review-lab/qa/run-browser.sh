#!/usr/bin/env bash
# Run the repo's browser QA tools separately, each with a time limit, recording pass/fail and time.
# Usage: qa/run-browser.sh [tree] [outdir] [tool ...]   (tools default to the list below)
# unit4-v128m and unit4-v128p ran past 3 minutes on main as well, so they get a 3-minute limit.
. "$(dirname "${BASH_SOURCE[0]}")/../lib/env.sh"
TREE="$(cd "${1:-$REPO}" && pwd)"; OUT="${2:-$REVIEW_HOME/out/qa-browser-$(basename "$TREE")}"
if [ $# -ge 2 ]; then shift 2; else set --; fi
tools=("$@")
[ ${#tools[@]} -eq 0 ] && tools=(seeded-browser-qa q-geometry-browser-qa q-ftc-keypad-browser-qa q-newton-keypad-browser-qa newton-sums-browser-qa unit4-approximation-sigma-browser-qa unit4-v128k-browser-qa unit4-v128l-browser-qa unit4-v128m-browser-qa unit4-v128n-browser-qa unit4-v128p-browser-qa unit1-approved-browser-qa browser-infra-regression-qa mathjax-browser-qa)
[ -f "$REVIEW_HOME/env.sh" ] && . "$REVIEW_HOME/env.sh"
[ -e "$TREE/node_modules" ] || ln -s "$REPO/node_modules" "$TREE/node_modules"
mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"; cd "$TREE"; : > "$OUT/summary.txt"
for t in "${tools[@]}"; do
  to=900; case $t in unit4-v128m*|unit4-v128p*) to=180;; esac
  start=$(date +%s); timeout $to node "tools/$t.mjs" > "$OUT/$t.log" 2>&1
  echo "$t rc=$? $(( $(date +%s)-start ))s" >> "$OUT/summary.txt"
done
echo DONE >> "$OUT/summary.txt"
echo "$(grep -c 'rc=0' "$OUT/summary.txt") of $(grep -c 'rc=' "$OUT/summary.txt") passed; results in $OUT"
