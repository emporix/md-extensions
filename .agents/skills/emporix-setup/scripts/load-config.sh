#!/usr/bin/env sh
# Shared config loader for every emporix-* skill. Source it from the product
# repository root (or a ticket worktree of it):
#
#   . "${EMPORIX_SKILLS_ROOT:-.agents/skills}/emporix-setup/scripts/load-config.sh"
#
# It reads the committed ai-setup.json, resolves the installed skills root,
# the tracker / code-host / browser descriptors, and the fixed local artifact
# layout under .ai/. It fails (return 1) when ai-setup.json, AGENTS.md, or
# PROJECT.md is missing — the calling skill then runs emporix-setup and retries.
#
# Nothing in this file writes to disk. Values that may be absent are empty.
#
# Exported names:
#   CONFIG SKILLS_ROOT
#   TRACKER TRACKER_FILE CODE_HOST CODE_HOST_FILE BASE_BRANCH
#   JIRA_PROJECT JIRA_SITE BUDDY_URL LABELS_ENABLED
#   BUDDY_SERVICE BUDDY_SYNC       (Buddy registry service name, may be empty; sync on/off, default true)
#   VALIDATION_COMMANDS            (newline separated, may be empty)
#   REVIEW_AGENT_TOKEN_ENV         (env var *name* of the Emporix Review Agent token)
#   APP_KIND APP_AUTH APP_AUTH_LANGUAGE
#   APP_START APP_BASE_URL APP_READY_PATH
#   BROWSER_PROVIDER BROWSER_FILE  (BROWSER_FILE empty for backend)
#   DOCS_TARGETS                   (compact JSON array, "[]" when none)
#   POSTMAN_WORKSPACE POSTMAN_REPO POSTMAN_FOLDER
#   FRONTEND_RULES RULES_ROOT      (space-separated rule names; RULES_ROOT is the
#                                   emporix-frontend-standards rules dir, empty when none)
#   PRIOR_ART_URLS                 (newline-separated Figma URLs, empty when none)
#   RUNS_DIR SPECS_DIR QA_DIR MOCKUPS_DIR DESIGNS_DIR DEMOS_DIR OVERRIDES_DIR
#   AGENTS_FILE PROJECT_FILE KNOWLEDGE_DIR
# Functions:
#   skill_script <skill> <script>  -> prints the absolute path of an installed
#                                     skill script, fails when it is missing

# Print the message; the caller then leaves the file with
# `return 1 2>/dev/null || exit 1` (return works when sourced, exit otherwise).
_emporix_fail() { echo "$1" >&2; }

command -v jq >/dev/null 2>&1 || { _emporix_fail "jq is required by emporix-* skills. Install jq, then retry."; return 1 2>/dev/null || exit 1; }

CONFIG=ai-setup.json
[ -f "$CONFIG" ] || { _emporix_fail "Missing $CONFIG — run the emporix-setup skill, then retry."; return 1 2>/dev/null || exit 1; }
jq -e . "$CONFIG" >/dev/null 2>&1 || { _emporix_fail "$CONFIG is not valid JSON — fix it or re-run emporix-setup."; return 1 2>/dev/null || exit 1; }

# ---------------------------------------------------------------------------
# Installed skills root. Prefer an explicit env var, then the location of this
# file (bash), then the usual project and user install directories.
# ---------------------------------------------------------------------------
SKILLS_ROOT=""
if [ -n "${EMPORIX_SKILLS_ROOT:-}" ] && [ -d "$EMPORIX_SKILLS_ROOT/emporix-setup" ]; then
  SKILLS_ROOT=$EMPORIX_SKILLS_ROOT
fi
if [ -z "$SKILLS_ROOT" ]; then
  _emporix_self="${BASH_SOURCE:-}"
  if [ -n "$_emporix_self" ] && [ -f "$_emporix_self" ]; then
    SKILLS_ROOT=$(cd "$(dirname "$_emporix_self")/../.." 2>/dev/null && pwd)
  fi
fi
if [ -z "$SKILLS_ROOT" ]; then
  # Literal list (not a split variable) so it also works when sourced from zsh.
  for _c in .agents/skills .cursor/skills .claude/skills \
            "$HOME/.agents/skills" "$HOME/.cursor/skills" "$HOME/.claude/skills"; do
    if [ -f "$_c/emporix-setup/scripts/load-config.sh" ]; then SKILLS_ROOT=$_c; break; fi
  done
fi
[ -n "$SKILLS_ROOT" ] || { _emporix_fail "Cannot locate installed emporix-* skills. Set EMPORIX_SKILLS_ROOT or install with: npx skills add emporix/emporix-ai-sdlc-skills --skill '*'"; return 1 2>/dev/null || exit 1; }
SKILLS_ROOT=$(cd "$SKILLS_ROOT" && pwd)

skill_script() {
  _p="$SKILLS_ROOT/$1/scripts/$2"
  if [ -f "$_p" ]; then printf '%s\n' "$_p"; return 0; fi
  echo "Missing skill script $_p — install or update the $1 skill (npx skills update)." >&2
  return 1
}

# ---------------------------------------------------------------------------
# Fixed local layout. Everything under .ai/ is gitignored and never committed.
# Ticket markdown is not a direct child of RUNS_DIR. It lives in
# $RUNS_DIR/<ticket-branch>/ — references/runs-layout.md and
# scripts/resolve-run-folder.sh.
# ---------------------------------------------------------------------------
RUNS_DIR=.ai/runs
SPECS_DIR=.ai/specs
QA_DIR=.ai/qa
MOCKUPS_DIR=.ai/mockups
DESIGNS_DIR=.ai/designs
DEMOS_DIR=.ai/demos
OVERRIDES_DIR=.ai/overrides

# Committed knowledge files written by emporix-setup.
AGENTS_FILE=AGENTS.md
PROJECT_FILE=PROJECT.md
KNOWLEDGE_DIR=ai-project-knowledge

# ---------------------------------------------------------------------------
# Config values.
# ---------------------------------------------------------------------------
TRACKER=$(jq -r '.tracker // "jira"' "$CONFIG")
CODE_HOST=$(jq -r '.codeHost // "github"' "$CONFIG")
BASE_BRANCH=$(jq -r '.baseBranch // "auto"' "$CONFIG")
JIRA_PROJECT=$(jq -r '.jira.project // "COP"' "$CONFIG")
JIRA_SITE=$(jq -r '.jira.site // "emporix.atlassian.net"' "$CONFIG")
BUDDY_URL=$(jq -r '.jira.buddyUrl // "http://ai-buddy.vpn.emporix.io"' "$CONFIG")
# Name of this repository's service in the Buddy registry (service_upsert_context target).
BUDDY_SERVICE=$(jq -r '.buddy.service // empty' "$CONFIG")
BUDDY_SYNC=$(jq -r '.buddy.sync // true' "$CONFIG")
LABELS_ENABLED=$(jq -r '.labels.enabled // false' "$CONFIG")
VALIDATION_COMMANDS=$(jq -r '.validation.commands // [] | .[]' "$CONFIG")
REVIEW_AGENT_TOKEN_ENV=$(jq -r '.review.agentTokenEnv // "EMPORIX_REVIEW_AGENT_TOKEN"' "$CONFIG")

APP_KIND=$(jq -r '.app.kind // empty' "$CONFIG")
APP_AUTH=$(jq -r '.app.auth // empty' "$CONFIG")
APP_AUTH_LANGUAGE=$(jq -r '.app.authLanguage // "en"' "$CONFIG")
APP_START=$(jq -r '.app.start // empty' "$CONFIG")
APP_BASE_URL=$(jq -r '.app.baseUrl // empty' "$CONFIG")
APP_READY_PATH=$(jq -r '.app.readyPath // "/"' "$CONFIG")
BROWSER_PROVIDER=$(jq -r '.browser.provider // "agent-browser"' "$CONFIG")

DOCS_TARGETS=$(jq -c '.docs.targets // []' "$CONFIG")
POSTMAN_WORKSPACE=$(jq -r '.qa.postman.workspace // empty' "$CONFIG")
POSTMAN_REPO=$(jq -r '.qa.postman.repo // empty' "$CONFIG")
POSTMAN_FOLDER=$(jq -r '.qa.postman.folder // empty' "$CONFIG")

# Frontend rules (React ui/fullstack only) and design prior art.
FRONTEND_RULES=$(jq -r '(.standards.frontend.rules // []) | join(" ")' "$CONFIG")
RULES_ROOT=
if [ -n "$FRONTEND_RULES" ]; then
  RULES_ROOT="$SKILLS_ROOT/emporix-frontend-standards/references/rules"
  [ -d "$RULES_ROOT" ] || { _emporix_fail "standards.frontend.rules is set but emporix-frontend-standards is not installed under $SKILLS_ROOT — run: npx skills add emporix/emporix-ai-sdlc-skills --skill emporix-frontend-standards"; RULES_ROOT=; }
fi
PRIOR_ART_URLS=$(jq -r '.design.priorArt[]? // empty' "$CONFIG")

# ---------------------------------------------------------------------------
# Descriptors: a repo-local override under .ai/overrides/ wins, otherwise the
# copy shipped with the installed emporix-setup skill is used.
# ---------------------------------------------------------------------------
_emporix_descriptor() {
  # $1 = trackers|browsers, $2 = name
  if [ -f "$OVERRIDES_DIR/$1/$2.md" ]; then printf '%s\n' "$OVERRIDES_DIR/$1/$2.md"
  else printf '%s\n' "$SKILLS_ROOT/emporix-setup/references/$1/$2.md"
  fi
}
TRACKER_FILE=$(_emporix_descriptor trackers "$TRACKER")
CODE_HOST_FILE=$(_emporix_descriptor trackers "$CODE_HOST")
[ -f "$TRACKER_FILE" ] || { _emporix_fail "Unknown tracker '$TRACKER' — no descriptor at $TRACKER_FILE."; return 1 2>/dev/null || exit 1; }
[ -f "$CODE_HOST_FILE" ] || { _emporix_fail "Unknown codeHost '$CODE_HOST' — no descriptor at $CODE_HOST_FILE."; return 1 2>/dev/null || exit 1; }

BROWSER_FILE=""
case "$APP_KIND" in
  ui|fullstack)
    BROWSER_FILE=$(_emporix_descriptor browsers "$BROWSER_PROVIDER")
    [ -f "$BROWSER_FILE" ] || { _emporix_fail "Unknown browser provider '$BROWSER_PROVIDER' — no descriptor at $BROWSER_FILE."; return 1 2>/dev/null || exit 1; }
    ;;
esac

# ---------------------------------------------------------------------------
# Committed knowledge files must exist. Setup writes them.
# ---------------------------------------------------------------------------
[ -f "$AGENTS_FILE" ] || { _emporix_fail "Missing $AGENTS_FILE — run the emporix-setup skill to write the agent instructions, then retry."; return 1 2>/dev/null || exit 1; }
[ -f "$PROJECT_FILE" ] || { _emporix_fail "Missing $PROJECT_FILE — run the emporix-setup skill to write the project knowledge, then retry."; return 1 2>/dev/null || exit 1; }

export CONFIG SKILLS_ROOT
export TRACKER TRACKER_FILE CODE_HOST CODE_HOST_FILE BASE_BRANCH
export JIRA_PROJECT JIRA_SITE BUDDY_URL BUDDY_SERVICE BUDDY_SYNC LABELS_ENABLED VALIDATION_COMMANDS REVIEW_AGENT_TOKEN_ENV
export APP_KIND APP_AUTH APP_AUTH_LANGUAGE
export APP_START APP_BASE_URL APP_READY_PATH BROWSER_PROVIDER BROWSER_FILE
export DOCS_TARGETS POSTMAN_WORKSPACE POSTMAN_REPO POSTMAN_FOLDER
export FRONTEND_RULES RULES_ROOT PRIOR_ART_URLS
export RUNS_DIR SPECS_DIR QA_DIR MOCKUPS_DIR DESIGNS_DIR DEMOS_DIR OVERRIDES_DIR
export AGENTS_FILE PROJECT_FILE KNOWLEDGE_DIR

unset _emporix_self _c _p
