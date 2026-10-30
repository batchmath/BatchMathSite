#!/usr/bin/env bash
# Run every script in the repo's qa:nobrowser chain separately, so one failure does not stop the rest.
# Usage: qa/run-nobrowser.sh [tree] [outdir]   (tree: a checkout or baseline worktree; default this checkout)
# Writes <outdir>/summary.txt ("qa:name rc=N seconds") and one log per script.
. "$(dirname "${BASH_SOURCE[0]}")/../lib/env.sh"
TREE="$(cd "${1:-$REPO}" && pwd)"; OUT="${2:-$REVIEW_HOME/out/qa-nobrowser-$(basename "$TREE")}"
mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"; cd "$TREE"
scripts=$(node -e "const p=require('./package.json');console.log(p.scripts['qa:nobrowser'].split('&&').map(s=>s.trim().replace('npm run ','')).join(' '))")
: > "$OUT/summary.txt"
for s in $scripts; do
  start=$(date +%s)
  timeout 900 npm run -s "$s" > "$OUT/$s.log" 2>&1
  echo "$s rc=$? $(( $(date +%s)-start ))s" >> "$OUT/summary.txt"
done
echo DONE >> "$OUT/summary.txt"
echo "$(grep -c 'rc=0' "$OUT/summary.txt") of $(grep -c 'rc=' "$OUT/summary.txt") passed; results in $OUT"
