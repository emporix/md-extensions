#!/usr/bin/env sh
# Behaviour tests for git-commit-as-user.sh, with a fake gh on PATH.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
COMMIT="$ROOT/skills/emporix-feature/scripts/git-commit-as-user.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
TMP=$(cd "$TMP" && pwd -P)

# Fake gh. FAKE_PUBLIC_EMAIL: public profile email (empty = none).
# FAKE_EMAILS: primary from user/emails; unset = 404 with the JSON body on stdout, as real gh does.
mkdir "$TMP/bin"
cat > "$TMP/bin/gh" <<'EOF'
#!/usr/bin/env sh
[ "$1" = auth ] && exit 0
case "$2 $4" in
  "user .login") echo jdoe ;;
  "user .id") echo 42 ;;
  user\ if*name*) echo "Jane Doe" ;;
  user\ if*email*) [ -n "${FAKE_PUBLIC_EMAIL:-}" ] && echo "$FAKE_PUBLIC_EMAIL"; exit 0 ;;
  user/emails\ *)
    if [ -n "${FAKE_EMAILS+x}" ]; then echo "$FAKE_EMAILS"; exit 0; fi
    printf '{"message":"Not Found","documentation_url":"https://docs.github.com/rest/users/emails","status":"404"}'
    echo 'gh: Not Found (HTTP 404)' >&2
    exit 1 ;;
  *) echo "unexpected gh call: $*" >&2; exit 2 ;;
esac
EOF
chmod +x "$TMP/bin/gh"
PATH="$TMP/bin:$PATH"
export PATH

R="$TMP/repo"
git init -q -b main "$R"
git -C "$R" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m init
cd "$R"

stage() { echo "$1" >> f.txt; git add f.txt; }
author() { git log -1 --format='%an <%ae>|%cn <%ce>'; }

# Public email wins.
stage a
FAKE_PUBLIC_EMAIL=public@example.com sh "$COMMIT" "COP-1 public" >/dev/null
[ "$(author)" = "Jane Doe <public@example.com>|Jane Doe <public@example.com>" ] || fail "public email: $(author)"

# No public email, user/emails 404s → the 404 body must not become the email; git config is used.
stage b
git config user.email human@example.com
sh "$COMMIT" "COP-1 git config" >/dev/null 2>&1
[ "$(author)" = "Jane Doe <human@example.com>|Jane Doe <human@example.com>" ] || fail "404 fallback to git config: $(author)"

# Primary email from user/emails when the token has the scope.
stage c
FAKE_EMAILS=primary@example.com sh "$COMMIT" "COP-1 primary" >/dev/null
[ "$(author)" = "Jane Doe <primary@example.com>|Jane Doe <primary@example.com>" ] || fail "user/emails primary: $(author)"

# 404 and an agent's git email → noreply.
stage d
git config user.email noreply@cursor.com
sh "$COMMIT" "COP-1 noreply" >/dev/null 2>&1
[ "$(author)" = "Jane Doe <42+jdoe@users.noreply.github.com>|Jane Doe <42+jdoe@users.noreply.github.com>" ] || fail "noreply fallback: $(author)"
git config user.email human@example.com

# Key-less re-ship: a message starting with the branch name is accepted.
git checkout -q -b marek-adjustments
stage e
sh "$COMMIT" "marek-adjustments address review comments" >/dev/null 2>&1 || fail "branch-prefixed message should be accepted"
[ "$(git log -1 --format=%s)" = "marek-adjustments address review comments" ] || fail "branch-prefixed commit missing"

# Neither a key nor the branch name → refused, nothing committed.
stage f
HEAD_BEFORE=$(git rev-parse HEAD)
if out=$(sh "$COMMIT" "fix things" 2>&1); then fail "message without key or branch must be refused"; fi
printf '%s\n' "$out" | grep -q "marek-adjustments" || fail "error should name the branch: $out"
if sh "$COMMIT" "marek-adjustmentsX fix" >/dev/null 2>&1; then fail "branch name must be followed by a space"; fi
[ "$(git rev-parse HEAD)" = "$HEAD_BEFORE" ] || fail "refused messages must not commit"

echo "git-commit-as-user.test.sh: ok"
