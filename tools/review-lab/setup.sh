#!/usr/bin/env bash
# One-time setup for the review lab; safe to re-run. Downloads pinned MathJax, KaTeX and SymPy into REVIEW_HOME
# (default ~/.cache/batchmath-review-lab, outside the checkout) and links the packages the repo's own browser QA
# tools expect into node_modules/. Nothing it creates is committed or shipped in the site ZIP.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib/env.sh"; CACHE="$REVIEW_HOME"
MATHJAX=4.1.3 NEWCM=4.1.3 KATEX=0.16.11 SYMPY=1.14.0 MPMATH=1.3.0

fetch(){ # npm package -> $CACHE/vendor/<dir>/package
  local spec=$1 dir=$2 want=$3
  if [ -f "$CACHE/vendor/$dir/package/package.json" ] && grep -q "\"version\": \"$want\"" "$CACHE/vendor/$dir/package/package.json"; then return; fi
  rm -rf "$CACHE/vendor/$dir"; mkdir -p "$CACHE/vendor/$dir"
  (cd "$CACHE/vendor/$dir" && npm pack --silent "$spec" > /dev/null && tar -xzf ./*.tgz && rm -f ./*.tgz)
  echo "downloaded $spec"
}
fetch "mathjax@$MATHJAX" mathjax "$MATHJAX"
fetch "@mathjax/mathjax-newcm-font@$NEWCM" newcm "$NEWCM"
fetch "katex@$KATEX" katex "$KATEX"

# SymPy and mpmath for the independent cross-check (installed into the cache, not system-wide)
if [ ! -d "$CACHE/pylib/sympy-$SYMPY.dist-info" ]; then
  python3 -m pip install --quiet --disable-pip-version-check --target "$CACHE/pylib" "sympy==$SYMPY" "mpmath==$MPMATH"
  echo "installed sympy $SYMPY into the cache"
fi

# Playwright: link a preinstalled copy (do not install a second one; it would not find the installed browser)
PW=""
for d in "$REPO/node_modules/playwright" /opt/node-tools/node_modules/playwright "$(npm root -g 2>/dev/null)/playwright"; do
  if [ -f "$d/package.json" ]; then PW="$(readlink -f "$d")"; break; fi
done
mkdir -p "$REPO/node_modules/@mathjax"
if [ -n "$PW" ]; then
  ln -sfn "$PW" "$REPO/node_modules/playwright"
  [ -d "$(dirname "$PW")/playwright-core" ] && ln -sfn "$(dirname "$PW")/playwright-core" "$REPO/node_modules/playwright-core"
else
  echo "Playwright not found. Install it once with: npm install --no-save playwright && npx playwright install chromium" >&2
fi
# the repo's mathjax-browser-qa resolves these packages from node_modules
ln -sfn "$CACHE/vendor/mathjax/package" "$REPO/node_modules/mathjax"
ln -sfn "$CACHE/vendor/newcm/package" "$REPO/node_modules/@mathjax/mathjax-newcm-font"

# keep node_modules/ and QA output out of git in this clone (local exclude, not a committed file)
EXCLUDE="$(git -C "$REPO" rev-parse --git-path info/exclude)"; case "$EXCLUDE" in /*) ;; *) EXCLUDE="$REPO/$EXCLUDE";; esac
mkdir -p "$(dirname "$EXCLUDE")"; touch "$EXCLUDE"
for p in node_modules/ qa-results/; do grep -qxF "$p" "$EXCLUDE" || echo "$p" >> "$EXCLUDE"; done

# the repo's q-* browser tools read KaTeX from KATEX_DIR
echo "export KATEX_DIR='$CACHE/vendor/katex/package/dist'" > "$CACHE/env.sh"

node -e "require('$REPO/node_modules/playwright')" 2>/dev/null && echo "playwright: ok" || echo "playwright: NOT available" >&2
echo "review lab ready: $LAB"
