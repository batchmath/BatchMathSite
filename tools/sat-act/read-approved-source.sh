#!/usr/bin/env bash
# Invoked with output redirected to a temporary file that is never uploaded.
set -euo pipefail
approval=$1
[[ "$approval" =~ ^[0-9a-f]{40}$ ]]

git init -q "$RUNNER_TEMP/shorts-source"
cd "$RUNNER_TEMP/shorts-source"
git remote add origin https://github.com/batchmath/Shorts.git
git config --local credential.helper '!gh auth git-credential'
git config --local remote.origin.promisor true
git config --local remote.origin.partialclonefilter blob:none

# A shallow filtered fetch pins the approval and its parent. Text-only approvals
# never download video blobs. Legacy approvals may need output/videos.
git fetch --no-tags --depth=2 --filter=blob:none origin "$approval"
mode=$(jq -r '.inputs.browser_approval // "false"' "$GITHUB_EVENT_PATH")
snapshot=review/website-approval-batch.json
changed=$(git diff --name-only FETCH_HEAD^ FETCH_HEAD)
paths=('/shorts/' '/config/' '/data/bank/' '/data/problems/' '/data/rejected/' '/review/website-approvals.json' "/$snapshot")
if [[ "$changed" != "$snapshot" ]]; then
  [[ "$mode" != true ]]
  paths+=('/data/scenes/' '/output/videos/')
fi
git sparse-checkout set --no-cone "${paths[@]}"
git checkout --quiet --detach FETCH_HEAD
[[ "$(git rev-parse HEAD)" == "$approval" ]]

if [[ "$changed" == "$snapshot" ]]; then
  issue=$(jq -er .githubReview.issueNumber "$snapshot")
  [[ "$issue" =~ ^[1-9][0-9]*$ ]]
  [[ "$(git ls-remote --refs origin "refs/heads/automation/website-approval/$issue" | cut -f1)" == "$approval" ]]
  source=$(jq -er .sourceCommit "$snapshot")
  branch=$(jq -er .githubReview.sourceBranch "$snapshot")
  [[ "$(gh api repos/batchmath/Shorts --jq .default_branch)" == "$branch" ]]
  [[ "$(git ls-remote --refs origin "refs/heads/$branch" | cut -f1)" == "$source" ]]
fi

# No private-repository authentication is retained in the checkout.
git config --local --unset credential.helper
