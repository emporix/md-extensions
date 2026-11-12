#!/usr/bin/env sh
# Commit staged files as the GitHub token owner — never as Cursor/agent/bot.
# Does not change git config. Requires gh auth and staged changes.
#
#   sh git-commit-as-user.sh "COP-6532 add vendor tax ID matching"
#   sh git-commit-as-user.sh "my-branch address review comments"   # key-less re-ship
set -eu

MSG="${1:-}"
[ -n "$MSG" ] || {
  echo "Usage: git-commit-as-user.sh <message starting with ISSUE-KEY or the branch name>" >&2
  exit 1
}

# A Jira key, or — for a key-less re-ship (emporix-feature references/pr.md § Rules) — the branch name.
BRANCH=$(git branch --show-current 2>/dev/null || true)
case "$MSG" in
  [A-Z][A-Z0-9_]*-*) ;;
  *)
    if [ -z "$BRANCH" ] || [ "${MSG#"$BRANCH "}" = "$MSG" ]; then
      echo "Commit message must start with a Jira key (e.g. COP-6532 …) or, for a key-less re-ship, the branch name (${BRANCH:-detached HEAD}) and a space." >&2
      exit 1
    fi
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

is_agent() {
  echo "$1" | grep -Ei 'cursor[[:space:]]*agent|^cursor$|noreply@cursor|copilot\[bot\]|github-actions\[bot\]' >/dev/null
}

# One plain address: no spaces, quotes, braces, or a second @. Rejects error bodies like {"message":"Not Found",…}.
is_email() {
  printf '%s\n' "$1" | grep -Eq '^[^][[:space:]@{}"<>(),;:]+@[^][[:space:]@{}"<>(),;:]+\.[^][[:space:]@{}"<>(),;:]+$'
}

LOGIN=$(gh api user --jq .login)
NAME=$(gh api user --jq 'if (.name | type) == "string" and (.name | length) > 0 then .name else .login end')
USER_ID=$(gh api user --jq .id)
EMAIL=$(gh api user --jq 'if (.email | type) == "string" and (.email | length) > 0 then .email else empty end' 2>/dev/null || true)
is_email "$EMAIL" || EMAIL=""
if [ -z "$EMAIL" ]; then
  # Needs the token's "user" scope; without it gh prints the 404 JSON body on stdout.
  EMAIL=$(gh api user/emails --jq '[.[] | select(.primary == true)][0].email // empty' 2>/dev/null || true)
  is_email "$EMAIL" || EMAIL=""
fi
if [ -z "$EMAIL" ]; then
  # The human's own git identity, unless an agent set it.
  EMAIL=$(git config user.email 2>/dev/null || true)
  { is_email "$EMAIL" && ! is_agent "$EMAIL"; } || EMAIL=""
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

if is_agent "$AN" || is_agent "$AE" || is_agent "$CN" || is_agent "$CE"; then
  echo "Commit was attributed to an agent ($AN <$AE> / $CN <$CE>). Soft-reset; do not push." >&2
  git reset --soft HEAD~1
  exit 1
fi

if ! is_email "$AE" || ! is_email "$CE" || [ "$AE" != "$EMAIL" ] || [ "$CE" != "$EMAIL" ]; then
  echo "Commit author/committer email is not the resolved address <$EMAIL> ($AN <$AE> / $CN <$CE>). Soft-reset; do not push." >&2
  git reset --soft HEAD~1
  exit 1
fi

echo "Committed as $AN <$AE> (GitHub: $LOGIN)"
