#!/usr/bin/env sh
# Behaviour tests for resolve-user-email.sh.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
RESOLVE="$ROOT/skills/emporix-feature/scripts/resolve-user-email.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }
field() { printf '%s\n' "$1" | sed -n "s/^$2=//p" | head -n 1; }
expect() { # $1 output, $2 email, $3 source
  [ "$(field "$1" EMAIL)" = "$2" ] || fail "email '$2' expected: $1"
  [ "$(field "$1" SOURCE)" = "$3" ] || fail "source $3 expected: $1"
}

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Never read the developer's real Claude config, git identity, or GitHub account.
unset EMPORIX_USER_EMAIL || true
export CLAUDE_CONFIG_DIR="$TMP/claude"
mkdir -p "$CLAUDE_CONFIG_DIR" "$TMP/bin"
export HOME="$TMP/home"; mkdir -p "$HOME"
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL="$TMP/gitconfig"
: > "$GIT_CONFIG_GLOBAL"
# Fake gh: prints $GH_EMAILS for user/emails, $GH_PUBLIC for user.
cat > "$TMP/bin/gh" <<'EOF'
#!/usr/bin/env sh
case "$2" in
  user/emails) [ -n "${GH_EMAILS:-}" ] || exit 1; printf '%s\n' $GH_EMAILS ;;
  user) printf '%s\n' "${GH_PUBLIC:-}" ;;
esac
EOF
chmod +x "$TMP/bin/gh"
export PATH="$TMP/bin:$PATH"

P="$TMP/repo"
git init -q "$P"
run() { sh "$RESOLVE" --root "$P" "$@"; }

# Nothing anywhere → none, exit 0.
out=$(run); expect "$out" "" none

# GitHub public email at the company domain.
out=$(GH_PUBLIC=dev@emporix.com run); expect "$out" dev@emporix.com github
# user/emails wins over the public one and skips private addresses.
out=$(GH_EMAILS="me@gmail.com work@Emporix.com" GH_PUBLIC=dev@emporix.com run)
expect "$out" work@Emporix.com github
# Only private addresses → none.
out=$(GH_EMAILS="me@gmail.com" GH_PUBLIC=me@gmail.com run); expect "$out" "" none

# git user.email at the domain wins over GitHub; a private one is skipped.
git -C "$P" config user.email me@gmail.com
out=$(GH_PUBLIC=dev@emporix.com run); expect "$out" dev@emporix.com github
git -C "$P" config user.email git@emporix.com
out=$(GH_PUBLIC=dev@emporix.com run); expect "$out" git@emporix.com git

# Claude account wins over git.
printf '{"oauthAccount":{"emailAddress":"claude@emporix.com"}}\n' > "$CLAUDE_CONFIG_DIR/.claude.json"
out=$(run); expect "$out" claude@emporix.com claude
# A private Claude account is skipped.
printf '{"oauthAccount":{"emailAddress":"me@gmail.com"}}\n' > "$CLAUDE_CONFIG_DIR/.claude.json"
out=$(run); expect "$out" git@emporix.com git
# Broken JSON is skipped, not fatal.
printf 'not json' > "$CLAUDE_CONFIG_DIR/.claude.json"
out=$(run); expect "$out" git@emporix.com git

# Another domain.
out=$(run --domain example.org); expect "$out" "" none
git -C "$P" config user.email a@Example.org
out=$(run --domain EXAMPLE.org); expect "$out" a@Example.org git

# The env var wins, whatever its domain.
out=$(EMPORIX_USER_EMAIL=x@other.io run); expect "$out" x@other.io env

# Unknown argument is refused.
if out=$(run --bogus 2>&1); then fail "unknown argument accepted: $out"; fi

echo "resolve-user-email.test.sh: ok"
