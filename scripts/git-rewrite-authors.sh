#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   NEW_NAME="Your Public Name" NEW_EMAIL="your+123@users.noreply.github.com" \
#   bash scripts/git-rewrite-authors.sh
#
# Optional:
#   REMOTE=origin PUSH=1  # will force-push after rewrite

NEW_NAME=${NEW_NAME:-}
NEW_EMAIL=${NEW_EMAIL:-}

if [[ -z "${NEW_NAME}" || -z "${NEW_EMAIL}" ]]; then
  echo "ERROR: Set NEW_NAME and NEW_EMAIL environment variables." >&2
  echo "Example: NEW_NAME=MARVElOUS-DEV NEW_EMAIL=84298842+MARVElOUS-DEV@users.noreply.github.com" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is required." >&2
  exit 1
fi

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "ERROR: git-filter-repo is required. Install one of:" >&2
  echo "  brew install git-filter-repo   # macOS" >&2
  echo "  python3 -m pip install git-filter-repo" >&2
  exit 1
fi

# Safety checks
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "ERROR: Not a git repository." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: Working tree has uncommitted changes. Commit/stash before rewriting history." >&2
  exit 1
fi

# Compose a temporary mailmap mapping old private identities to the new public identity.
MAILMAP_FILE="$(mktemp)"

# Known private identities detected in this repo's history:
# - Fang Kai <kai.fang@thoughtworks.com>
# - Kai Fang <kai.fang@thoughtworks.com>
# - fang.kai <fang.kai@cestc.cn>

{
  printf '%s <%s> %s <%s>\n' "$NEW_NAME" "$NEW_EMAIL" "Fang Kai" "kai.fang@thoughtworks.com"
  printf '%s <%s> %s <%s>\n' "$NEW_NAME" "$NEW_EMAIL" "Kai Fang" "kai.fang@thoughtworks.com"
  printf '%s <%s> %s <%s>\n' "$NEW_NAME" "$NEW_EMAIL" "fang.kai" "fang.kai@cestc.cn"
} >>"$MAILMAP_FILE"

echo "Using mailmap (preview):"
cat "$MAILMAP_FILE"

echo
echo "Rewriting commit history with git-filter-repo..."
git filter-repo --mailmap "$MAILMAP_FILE" --force

REMOTE=${REMOTE:-origin}
PUSH=${PUSH:-0}

echo
echo "Done. To update the remote, run:"
echo "  git push --force --tags $REMOTE --all"

if [[ "$PUSH" == "1" ]]; then
  echo "Force-pushing rewritten history to $REMOTE..."
  git push --force --tags "$REMOTE" --all
fi

echo "Complete. Ensure collaborators re-clone or hard-reset to the updated refs."
