#!/usr/bin/env bash
# Extract a site ZIP, serve it exactly as the instructions say (python -m http.server 8000) and check key pages
# in a browser at laptop and phone size. Usage: zip/serve-check.sh <site.zip> [version]
set -uo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/../lib/env.sh"; ZIP="$(readlink -f "$1")"; VERSION="${2:-}"
DIR="$REVIEW_HOME/out/zip-extract"; rm -rf "$DIR"; mkdir -p "$DIR"; (cd "$DIR" && unzip -q "$ZIP")
SITE="$(find "$DIR" -mindepth 1 -maxdepth 1 -type d | head -1)"
(cd "$SITE" && exec python3 -m http.server 8000 --bind 127.0.0.1 > "$DIR/http.log" 2>&1) & SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT; sleep 1
EXPECT_VERSION="$VERSION" node "$LAB/zip/serve-check.mjs"; rc=$?
echo "server 404s: $(grep -c ' 404 ' "$DIR/http.log")"; grep ' 404 ' "$DIR/http.log" | head -5
exit $rc
