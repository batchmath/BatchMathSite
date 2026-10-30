#!/usr/bin/env bash
# Run overflow/scan-page.mjs over a list of pages, 4 at a time, then print the summary.
# Usage: overflow/scan-all.sh <width> <height> [mobile|-] [outdir] [pagelist|all] [count]
#   pagelist: default overflow/pages.txt (the 53 practice pages that share the AP topic / Unit 1 styles);
#             "all" scans every practice page in the site (any folder named *practice*).
#   Set BM_ROOT to scan another tree (baseline worktree, extracted ZIP).
# Example: overflow/scan-all.sh 390 844 mobile; overflow/scan-all.sh 1366 768 - out/main-1366 all
. "$(dirname "${BASH_SOURCE[0]}")/../lib/env.sh"; ROOT="${BM_ROOT:-$REPO}"
W=${1:?width}; H=${2:?height}; MOB=${3:--}; [ "$MOB" = - ] && MOB=""
OUT="${4:-$REVIEW_HOME/out/overflow-${W}x${H}}"; LIST="${5:-$LAB/overflow/pages.txt}"; COUNT=${6:-5}
mkdir -p "$OUT"; rm -f "$OUT"/*.json
if [ "$LIST" = all ]; then
  LIST="$OUT/pages-all.txt"
  (cd "$ROOT" && find ap-calculus im1 calculus-prep -name index.html -path '*practice*' 2>/dev/null | sed 's#/index.html$##' | sort) > "$LIST"
fi
run(){ f="$OUT/$(echo "$1" | tr '/' '_').json"; timeout 300 node "$LAB/overflow/scan-page.mjs" "$1" "$COUNT" "$W" "$H" $MOB > "$f" 2>&1; }
export -f run; export OUT W H MOB COUNT LAB
grep -v '^\s*$' "$LIST" | xargs -P 4 -I{} bash -c 'run {}'
node "$LAB/overflow/summary.mjs" "$OUT" | tee "$OUT/summary.txt"
