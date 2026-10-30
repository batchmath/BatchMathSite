#!/usr/bin/env bash
# Check out another version of the site next to this one, for before/after comparisons.
# Usage: baseline.sh [ref] [name]   (default: origin/main as "main")
# Creates $REVIEW_HOME/trees/<name> (a detached git worktree, outside this checkout) and prints its path.
# Use it with BM_ROOT=<path> for the browser tools, or as the tree argument of qa/run-*.sh.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/lib/env.sh"
REF="${1:-origin/main}"; NAME="${2:-main}"; DIR="$REVIEW_HOME/trees/$NAME"
git -C "$REPO" fetch -q origin "${REF#origin/}" 2>/dev/null || true
if [ -d "$DIR" ]; then git -C "$DIR" checkout -q --detach "$REF"; else mkdir -p "$(dirname "$DIR")"; git -C "$REPO" worktree add -q --detach "$DIR" "$REF"; fi
[ -e "$DIR/node_modules" ] || ln -s "$REPO/node_modules" "$DIR/node_modules"
echo "$DIR ($(git -C "$DIR" rev-parse --short HEAD))"
