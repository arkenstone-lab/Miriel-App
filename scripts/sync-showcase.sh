#!/bin/bash
set -e

# Sync to public showcase repo, excluding internal-only files
# from the ENTIRE git history (not just the latest commit).
#
# Usage: bash scripts/sync-showcase.sh

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXCLUDE_FILE="$PROJECT_ROOT/.showcase-exclude"
SHOWCASE_REMOTE="origin-showcase"
TEMP_BRANCH="__showcase_sync__"

cd "$PROJECT_ROOT"

# Verify we're on develop or main
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "develop" && "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: must be on develop or main (currently on $CURRENT_BRANCH)"
  exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: uncommitted changes exist. Commit or stash first."
  exit 1
fi

# Read exclude list
if [ ! -f "$EXCLUDE_FILE" ]; then
  echo "No .showcase-exclude found. Pushing as-is."
  git push "$SHOWCASE_REMOTE" "$CURRENT_BRANCH"
  exit 0
fi

EXCLUDES=()
while IFS= read -r line; do
  line=$(echo "$line" | sed 's/#.*//' | xargs)  # strip comments and whitespace
  [ -n "$line" ] && EXCLUDES+=("$line")
done < "$EXCLUDE_FILE"

if [ ${#EXCLUDES[@]} -eq 0 ]; then
  echo "No files to exclude. Pushing as-is."
  git push "$SHOWCASE_REMOTE" "$CURRENT_BRANCH"
  exit 0
fi

echo "=== Showcase Sync ($CURRENT_BRANCH) ==="
echo "Excluding: ${EXCLUDES[*]}"

# Build git rm command for filter-branch
RM_CMD="git rm -rf --cached --ignore-unmatch"
for f in "${EXCLUDES[@]}"; do
  RM_CMD="$RM_CMD '$f'"
done

# Create temp branch and rewrite entire history to remove excluded files
git checkout -b "$TEMP_BRANCH"

FILTER_BRANCH_SETUP=1 git filter-branch -f --index-filter "$RM_CMD" --prune-empty HEAD

# Push cleaned branch to showcase
git push "$SHOWCASE_REMOTE" "$TEMP_BRANCH:$CURRENT_BRANCH" --force

# Cleanup
git checkout "$CURRENT_BRANCH"
git branch -D "$TEMP_BRANCH"
rm -rf .git/refs/original/

echo ""
echo "=== Synced $CURRENT_BRANCH → $SHOWCASE_REMOTE ==="
