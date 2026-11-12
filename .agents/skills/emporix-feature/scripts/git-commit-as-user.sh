#!/usr/bin/env sh
# Commit staged files as the GitHub token owner — never as Cursor/agent/bot.
# Does not change git config. Requires gh auth and staged changes.
#
#   sh git-commit-as-user.sh "COP-6532 add vendor tax ID matching"
set -eu

MSG="${1:-}"
[ -n "$MSG" ] || {
  echo "Usage: git-commit-as-user.sh <message starting with ISSUE-KEY>" >&2
  exit 1
}

case "$MSG" in
  [A-Z][A-Z0-9_]*-*) ;;
  *)
    echo "Commit message must start with a Jira key, e.g. COP-6532 …" >&2
    exit 1
    ;;
esac

if git diff --cached --quiet; then
  echo "Nothing staged." >&2
  exit 1
fi

command -v gh >/dev/null 2>&1 || {
  echo "gh is required to resolve the GitHub token owner." >&2
  exit 1
}
gh auth status >/dev/null

LOGIN=$(gh api user --jq .login)
NAME=$(gh api user --jq 'if (.name | type) == "string" and (.name | length) > 0 then .name else .login end')
USER_ID=$(gh api user --jq .id)
EMAIL=$(gh api user --jq 'if (.email | type) == "string" and (.email | length) > 0 then .email else empty end')
if [ -z "$EMAIL" ]; then
  EMAIL=$(gh api user/emails --jq '[.[] | select(.primary == true)][0].email // empty' 2>/dev/null || true)
fi
if [ -z "$EMAIL" ]; then
  EMAIL="${USER_ID}+${LOGIN}@users.noreply.github.com"
fi

# Drop agent identity the process may have inherited. Do not git config.
unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL
export GIT_AUTHOR_NAME="$NAME"
export GIT_AUTHOR_EMAIL="$EMAIL"
export GIT_COMMITTER_NAME="$NAME"
export GIT_COMMITTER_EMAIL="$EMAIL"

git -c user.name="$NAME" -c user.email="$EMAIL" commit -m "$MSG"

AN=$(git log -1 --format='%an')
AE=$(git log -1 --format='%ae')
CN=$(git log -1 --format='%cn')
CE=$(git log -1 --format='%ce')

is_agent() {
  echo "$1" | grep -Ei 'cursor[[:space:]]*agent|^cursor$|noreply@cursor|copilot\[bot\]|github-actions\[bot\]' >/dev/null
}

if is_agent "$AN" || is_agent "$AE" || is_agent "$CN" || is_agent "$CE"; then
  echo "Commit was attributed to an agent ($AN <$AE> / $CN <$CE>). Soft-reset; do not push." >&2
  git reset --soft HEAD~1
  exit 1
fi

echo "Committed as $AN <$AE> (GitHub: $LOGIN)"
