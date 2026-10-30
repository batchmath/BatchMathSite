# Shared paths for the review lab's shell scripts (sourced). Downloads, baseline checkouts, extracted ZIPs and
# results live outside the repo checkout, in REVIEW_HOME, so the repo's own QA scripts (which walk every page in
# the checkout) never see a second copy of the site.
LAB="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$LAB/../.." && pwd)"
REVIEW_HOME="${REVIEW_HOME:-${XDG_CACHE_HOME:-$HOME/.cache}/batchmath-review-lab}"
mkdir -p "$REVIEW_HOME"
