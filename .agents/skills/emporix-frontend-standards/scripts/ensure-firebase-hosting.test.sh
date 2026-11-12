#!/usr/bin/env sh
# Behaviour tests for ensure-firebase-hosting.sh with stubbed firebase and gh CLIs.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
SCRIPT="$ROOT/skills/emporix-frontend-standards/scripts/ensure-firebase-hosting.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
BIN="$TMP/bin"
mkdir -p "$BIN"

# firebase stub: sites listed in $TMP/sites ("project site" per line) exist;
# create appends to that file and to $TMP/created.
cat >"$BIN/firebase" <<EOF
#!/usr/bin/env sh
case "\$1" in
  login:list) echo "Logged in as dev@example.com" ;;
  hosting:sites:get)
    if grep -qx "\$4 \$2" "$TMP/sites"; then echo "Site: \$2"
    else echo "Error: could not find site \"\$2\" for project \"\$4\""; fi ;;
  hosting:sites:create) echo "\$4 \$2" >>"$TMP/sites"; echo "\$4 \$2" >>"$TMP/created" ;;
esac
EOF
# gh stub: repo secret DEPLOY_SA_DEV, org secret DEPLOY_SA_STAGE; every call
# fails while $TMP/gh-fail exists.
cat >"$BIN/gh" <<EOF
#!/usr/bin/env sh
[ ! -f "$TMP/gh-fail" ] || exit 1
case "\$*" in
  "repo view"*) echo "acme/remotes" ;;
  *"repos/acme/remotes/actions/secrets"*) echo "DEPLOY_SA_DEV" ;;
  *"organization-secrets"*) echo "DEPLOY_SA_STAGE" ;;
esac
EOF
chmod +x "$BIN/firebase" "$BIN/gh"
PATH="$BIN:$PATH"
export PATH

R="$TMP/repo"
mkdir -p "$R/.github/workflows" "$R/alpha" "$R/beta"
cat >"$R/firebase.json" <<'EOF'
{ "hosting": [
  { "target": "alpha-develop", "public": "alpha/dist" },
  { "target": "alpha-stage", "public": "alpha/dist" },
  { "target": "beta-develop", "public": "beta/dist" },
  { "target": "delta", "public": "delta/dist" },
  { "target": "delta-stage", "public": "deltastage/dist" }
] }
EOF
cat >"$R/.firebaserc" <<'EOF'
{ "targets": {
  "proj-develop": { "hosting": { "alpha-develop": ["alpha-develop"], "beta-develop": ["beta-develop"], "delta": ["delta"], "delta-stage": ["delta-stage"] } },
  "proj-stage": { "hosting": { "alpha-stage": ["alpha-stage"] } }
} }
EOF
cat >"$R/.github/workflows/alpha-preview.yaml" <<'EOF'
firebaseServiceAccount: "${{ secrets.DEPLOY_SA_DEV }}"
target: alpha-develop
repoToken: "${{ secrets.GITHUB_TOKEN }}"
EOF
cat >"$R/.github/workflows/alpha-stage.yaml" <<'EOF'
firebaseServiceAccount: "${{ secrets.DEPLOY_SA_STAGE }}"
target: alpha-stage
EOF
cat >"$R/.github/workflows/beta-preview.yaml" <<'EOF'
firebaseServiceAccount: "${{ secrets.BETA_SA }}"
target: beta-develop
EOF
cat >"$R/.github/workflows/delta.yaml" <<'EOF'
firebaseServiceAccount: "${{ secrets.DEPLOY_SA_DEV }}"
target: delta
EOF
cat >"$R/.github/workflows/delta-stage.yaml" <<'EOF'
firebaseServiceAccount: "${{ secrets.DELTA_STAGE_SA }}"
target: delta-stage
EOF
printf 'proj-develop alpha-develop\nproj-develop beta-develop\nproj-develop delta\n' >"$TMP/sites"
cd "$R"

# Missing stage site → reported, exit 3, nothing created.
set +e; out=$(sh "$SCRIPT" --remote alpha); code=$?; set -e
[ "$code" = 3 ] || fail "missing site exit $code: $out"
echo "$out" | grep -qx "SITE proj-develop alpha-develop ok" || fail "existing site: $out"
echo "$out" | grep -qx "SITE proj-stage alpha-stage missing" || fail "missing site: $out"
echo "$out" | grep -qx "SECRET DEPLOY_SA_DEV ok" || fail "repo secret: $out"
echo "$out" | grep -qx "SECRET DEPLOY_SA_STAGE ok" || fail "org secret: $out"
echo "$out" | grep -q "GITHUB_TOKEN" && fail "GITHUB_TOKEN listed: $out"
echo "$out" | grep -q "beta" && fail "beta out of scope: $out"
[ ! -f "$TMP/created" ] || fail "created without --create"

# --create creates only the missing site, then all is ok.
out=$(sh "$SCRIPT" --remote alpha --create) || fail "create run failed: $out"
echo "$out" | grep -qx "SITE proj-stage alpha-stage created" || fail "create: $out"
[ "$(cat "$TMP/created")" = "proj-stage alpha-stage" ] || fail "created: $(cat "$TMP/created")"
out=$(sh "$SCRIPT" --remote alpha) || fail "after create: $out"

# A secret neither in the repo nor the org → missing.
set +e; out=$(sh "$SCRIPT" --remote beta); code=$?; set -e
[ "$code" = 3 ] || fail "missing secret exit $code"
echo "$out" | grep -qx "SECRET BETA_SA missing" || fail "missing secret: $out"
out=$(sh "$SCRIPT" --remote beta --no-secrets) || fail "--no-secrets: $out"

# A target is not matched inside a longer one: "delta" ignores the delta-stage workflow.
out=$(sh "$SCRIPT" --remote delta) || fail "prefix target: $out"
echo "$out" | grep -q "DELTA_STAGE_SA" && fail "prefix target matched delta-stage: $out"
echo "$out" | grep -qx "SECRET DEPLOY_SA_DEV ok" || fail "prefix target secret: $out"

# Secrets that cannot be listed → exit 2, unless --no-secrets.
touch "$TMP/gh-fail"
set +e; out=$(sh "$SCRIPT" --remote alpha 2>&1); code=$?; set -e
[ "$code" = 2 ] || fail "gh failure exit $code: $out"
out=$(sh "$SCRIPT" --remote alpha --no-secrets) || fail "gh failure with --no-secrets: $out"
rm "$TMP/gh-fail"

# --changed against a base git cannot resolve → exit 2, not a silent pass.
git init -q . && git add -A && git -c user.email=t@t -c user.name=t commit -q -m init
set +e; out=$(sh "$SCRIPT" --changed --base no-such-ref 2>&1); code=$?; set -e
[ "$code" = 2 ] || fail "bad --base exit $code: $out"
# --changed picks up a changed folder.
touch alpha/new-file
out=$(sh "$SCRIPT" --changed --base HEAD) || fail "--changed: $out"
echo "$out" | grep -qx "SITE proj-develop alpha-develop ok" || fail "--changed scope: $out"
echo "$out" | grep -q "beta" && fail "--changed beta out of scope: $out"
rm alpha/new-file
# Other .github files keep the per-folder scope.
echo "* @acme/team" >.github/CODEOWNERS
out=$(sh "$SCRIPT" --changed --base HEAD) || fail "--changed CODEOWNERS: $out"
echo "$out" | grep -q "SITE" && fail "--changed CODEOWNERS checked sites: $out"
rm .github/CODEOWNERS
# A change only to hosting or deploy config checks every hosting entry.
check_all() {
  set +e; out=$(sh "$SCRIPT" --changed --base HEAD --no-secrets); code=$?; set -e
  [ "$code" = 3 ] || fail "--changed $1 exit $code: $out"
  # All five entries, nothing skipped (alpha-stage was created above).
  sites=$(echo "$out" | grep '^SITE ' | LC_ALL=C sort)
  expected=$(printf '%s\n' \
    "SITE proj-develop alpha-develop ok" \
    "SITE proj-develop beta-develop ok" \
    "SITE proj-develop delta ok" \
    "SITE proj-develop delta-stage missing" \
    "SITE proj-stage alpha-stage ok" | LC_ALL=C sort)
  [ "$sites" = "$expected" ] || fail "--changed $1 sites: $out"
  git checkout -q -- . && git clean -qfd
}
echo >>firebase.json; check_all firebase.json
echo >>.firebaserc; check_all .firebaserc
echo "# touched" >>.github/workflows/beta-preview.yaml; check_all "modified workflow"
echo "on: push" >.github/workflows/new.yaml; check_all "new workflow"
rm -rf .git

# A target with no site in .firebaserc → UNMAPPED, exit 3.
cat >"$R/firebase.json" <<'EOF'
{ "hosting": [ { "target": "gamma-develop", "public": "gamma/dist" } ] }
EOF
set +e; out=$(sh "$SCRIPT" --no-secrets); code=$?; set -e
[ "$code" = 3 ] || fail "unmapped exit $code"
echo "$out" | grep -qx "UNMAPPED gamma-develop" || fail "unmapped: $out"

# No firebase.json → nothing to check.
rm "$R/firebase.json"
sh "$SCRIPT" >/dev/null || fail "no firebase.json should pass"

echo "ensure-firebase-hosting: ok"
