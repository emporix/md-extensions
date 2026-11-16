#!/usr/bin/env sh
# Suggest the developer's company email, used to offer "assign to me" when
# approve creates a Jira ticket. Read-only; never asks, never writes.
#
#   resolve-user-email.sh [--domain <company domain>] [--root <checkout>]
#
# First address at the company domain (default emporix.com, any case) wins:
#   EMPORIX_USER_EMAIL env var                         (SOURCE=env)
#   Claude Code account: .oauthAccount.emailAddress in
#     ${CLAUDE_CONFIG_DIR:-$HOME}/.claude.json         (SOURCE=claude)
#   git config user.email in --root (default: cwd)     (SOURCE=git)
#   GitHub: gh api user/emails, then gh api user .email (SOURCE=github)
# EMPORIX_USER_EMAIL is taken as given, whatever its domain: it is the
# developer's explicit choice.
#
# Prints:
#   EMAIL=<address or empty>
#   SOURCE=env|claude|git|github|none
# Exit 0 also when nothing matched (SOURCE=none): the caller then asks the
# user to type the address. A source that is missing or fails is skipped.
set -eu

DOMAIN=emporix.com
ROOT=.
while [ $# -gt 0 ]; do
  case "$1" in
    --domain) DOMAIN=${2:?--domain needs a value}; shift 2 ;;
    --root) ROOT=${2:?--root needs a value}; shift 2 ;;
    *) echo "resolve-user-email.sh: unknown argument $1" >&2; exit 2 ;;
  esac
done
DOMAIN=$(printf '%s' "$DOMAIN" | tr '[:upper:]' '[:lower:]')

emit() { printf 'EMAIL=%s\nSOURCE=%s\n' "$1" "$2"; exit 0; }

# First line of stdin that is an address at $DOMAIN.
pick() {
  while IFS= read -r line; do
    line=$(printf '%s' "$line" | tr -d '[:space:]')
    lower=$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')
    case "$lower" in
      *@"$DOMAIN") printf '%s\n' "$line"; return 0 ;;
    esac
  done
  return 1
}

if [ -n "${EMPORIX_USER_EMAIL:-}" ]; then emit "$EMPORIX_USER_EMAIL" env; fi

CLAUDE_JSON="${CLAUDE_CONFIG_DIR:-$HOME}/.claude.json"
if [ -f "$CLAUDE_JSON" ] && command -v jq >/dev/null 2>&1; then
  if e=$(jq -r '.oauthAccount.emailAddress // empty' "$CLAUDE_JSON" 2>/dev/null | pick); then
    emit "$e" claude
  fi
fi

if e=$(git -C "$ROOT" config user.email 2>/dev/null | pick); then emit "$e" git; fi

if command -v gh >/dev/null 2>&1; then
  # user/emails needs the user:email scope; user .email is the public address.
  if e=$(gh api user/emails --jq '.[].email' 2>/dev/null | pick); then emit "$e" github; fi
  if e=$(gh api user --jq '.email // empty' 2>/dev/null | pick); then emit "$e" github; fi
fi

emit "" none
