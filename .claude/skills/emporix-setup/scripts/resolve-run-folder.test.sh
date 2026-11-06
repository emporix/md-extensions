#!/usr/bin/env sh
# Behaviour tests for resolve-run-folder.sh.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
RESOLVE="$ROOT/skills/emporix-setup/scripts/resolve-run-folder.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }
field() { printf '%s\n' "$1" | sed -n "s/^$2=//p" | head -n 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Title names the folder when nothing else does. The key is not doubled.
R="$TMP/title"
mkdir -p "$R"
out=$(sh "$RESOLVE" --root "$R" --key COP-5020 --title "Fix authentication" --create)
[ "$(field "$out" TASK_BRANCH)" = "COP-5020-fix-authentication" ] || fail "title slug: $out"
[ "$(field "$out" RUN_FOLDER)" = ".ai/runs/COP-5020-fix-authentication" ] || fail "title folder: $out"
[ -d "$R/.ai/runs/COP-5020-fix-authentication" ] || fail "title folder was not created"

D="$TMP/dedupe"
mkdir -p "$D"
out=$(sh "$RESOLVE" --root "$D" --key COP-5020 --title "COP-5020 Fix authentication" --create)
[ "$(field "$out" TASK_BRANCH)" = "COP-5020-fix-authentication" ] || fail "title doubled the key: $out"

# A second title must not create a second folder once one exists.
out=$(sh "$RESOLVE" --root "$R" --key COP-5020 --title "Something else" --create)
[ "$(field "$out" TASK_BRANCH)" = "COP-5020-fix-authentication" ] || fail "existing folder lost to a new title: $out"
[ ! -d "$R/.ai/runs/COP-5020-something-else" ] || fail "second folder was created"

# Current ticket branch wins over the title and over a feat/ prefix.
G="$TMP/git"
mkdir -p "$G"
git -C "$G" init -q
git -C "$G" checkout -q -b 'feat/COP-5020-fix-authentication'
out=$(sh "$RESOLVE" --root "$G" --key COP-5020 --title "Other name")
[ "$(field "$out" TASK_BRANCH)" = "COP-5020-fix-authentication" ] || fail "feat/ branch not normalized: $out"

# main is not a task folder; the title is.
git -C "$G" checkout -q -B main
out=$(sh "$RESOLVE" --root "$G" --key COP-5020 --title "Fix authentication" --create)
[ "$(field "$out" TASK_BRANCH)" = "COP-5020-fix-authentication" ] || fail "main was used as the folder: $out"

# Legacy flat file is found, then --adopt moves it. A newer dated file wins.
L="$TMP/legacy"
mkdir -p "$L/.ai/runs"
printf 'old\n' >"$L/.ai/runs/2026-10-01-COP-5020-issue-plan.md"
printf 'new\n' >"$L/.ai/runs/2026-11-02-COP-5020-issue-plan.md"
printf 'ledger\n' >"$L/.ai/runs/COP-5020-review-findings.md"
printf 'questions\n' >"$L/.ai/runs/2026-11-02-COP-5020-questions-for-po.md"
touch -t 202610010000 "$L/.ai/runs/2026-10-01-COP-5020-issue-plan.md"
touch -t 202611020000 "$L/.ai/runs/2026-11-02-COP-5020-issue-plan.md"
out=$(sh "$RESOLVE" --root "$L" --key COP-5020 --title "Fix authentication")
[ "$(field "$out" ISSUE_PLAN)" = ".ai/runs/2026-11-02-COP-5020-issue-plan.md" ] || fail "newest flat plan: $out"
[ "$(field "$out" LEGACY)" = "1" ] || fail "flat plan not marked legacy: $out"
[ "$(field "$out" LEDGER)" = ".ai/runs/COP-5020-review-findings.md" ] || fail "flat ledger: $out"
out=$(sh "$RESOLVE" --root "$L" --key COP-5020 --title "Fix authentication" --adopt)
[ "$(field "$out" ISSUE_PLAN)" = ".ai/runs/COP-5020-fix-authentication/2026-11-02-COP-5020-issue-plan.md" ] || fail "adopted plan: $out"
[ "$(field "$out" LEDGER)" = ".ai/runs/COP-5020-fix-authentication/COP-5020-review-findings.md" ] || fail "adopted ledger: $out"
[ "$(field "$out" LEGACY)" = "0" ] || fail "adopted plan still legacy: $out"
echo "$out" | grep -q 'ADOPT_MOVED=.ai/runs/COP-5020-fix-authentication/2026-11-02-COP-5020-issue-plan.md' || fail "adopt move not reported: $out"
[ ! -f "$L/.ai/runs/2026-11-02-COP-5020-issue-plan.md" ] || fail "flat plan was left behind"
[ -f "$L/.ai/runs/COP-5020-fix-authentication/2026-11-02-COP-5020-questions-for-po.md" ] || fail "flat note was not adopted"
grep -q 'questions' "$L/.ai/runs/COP-5020-fix-authentication/2026-11-02-COP-5020-questions-for-po.md" || fail "adopted note lost its body"

# Adopt does not overwrite a file already in the folder.
printf 'kept\n' >"$L/.ai/runs/2026-12-01-COP-5020-pr-plan.md"
printf 'already\n' >"$L/.ai/runs/COP-5020-fix-authentication/2026-12-01-COP-5020-pr-plan.md"
out=$(sh "$RESOLVE" --root "$L" --key COP-5020 --adopt)
echo "$out" | grep -q 'ADOPT_SKIP=.ai/runs/2026-12-01-COP-5020-pr-plan.md' || fail "adopt overwrite was not skipped: $out"
grep -q 'already' "$L/.ai/runs/COP-5020-fix-authentication/2026-12-01-COP-5020-pr-plan.md" || fail "existing pr plan was overwritten"

# The plan in another folder is visible, and that folder is not merged.
O="$TMP/elsewhere"
mkdir -p "$O/.ai/runs/COP-5020-other-slug" "$O/.ai/runs/COP-5020-fix-authentication"
printf 'here\n' >"$O/.ai/runs/COP-5020-other-slug/2026-11-02-COP-5020-issue-plan.md"
git -C "$O" init -q
git -C "$O" checkout -q -b COP-5020-fix-authentication
out=$(sh "$RESOLVE" --root "$O" --key COP-5020)
[ "$(field "$out" TASK_BRANCH)" = "COP-5020-fix-authentication" ] || fail "branch did not win: $out"
[ "$(field "$out" PLAN_ELSEWHERE)" = "1" ] || fail "plan in the other folder was hidden: $out"
[ "$(field "$out" ISSUE_PLAN)" = ".ai/runs/COP-5020-other-slug/2026-11-02-COP-5020-issue-plan.md" ] || fail "elsewhere plan: $out"
echo "$out" | grep -q 'OTHER_FOLDER=.ai/runs/COP-5020-other-slug' || fail "other folder not listed: $out"
out=$(sh "$RESOLVE" --root "$O" --key COP-5020 --adopt)
[ -f "$O/.ai/runs/COP-5020-other-slug/2026-11-02-COP-5020-issue-plan.md" ] || fail "adopt merged two ticket folders"

# Two folders and no branch: ask, do not pick, do not create a third.
A="$TMP/ambiguous"
mkdir -p "$A/.ai/runs/COP-5020-one" "$A/.ai/runs/COP-5020-two"
printf 'a\n' >"$A/.ai/runs/COP-5020-one/2026-11-02-COP-5020-issue-plan.md"
printf 'b\n' >"$A/.ai/runs/COP-5020-two/2026-11-02-COP-5020-issue-plan.md"
set +e
out=$(sh "$RESOLVE" --root "$A" --key COP-5020 --title "Fix authentication" --create)
code=$?
set -e
[ "$code" -eq 1 ] || fail "ambiguous create exited $code: $out"
[ "$(field "$out" AMBIGUOUS)" = "1" ] || fail "not ambiguous: $out"
[ "$(field "$out" ERROR)" = "ambiguous" ] || fail "ambiguous error: $out"
[ -z "$(field "$out" TASK_BRANCH)" ] || fail "ambiguous create picked a branch: $out"
[ -z "$(field "$out" ISSUE_PLAN)" ] || fail "ambiguous create picked a plan: $out"
echo "$out" | grep -q 'MATCH=.ai/runs/COP-5020-one' || fail "missing match one: $out"
echo "$out" | grep -q 'MATCH=.ai/runs/COP-5020-two' || fail "missing match two: $out"
[ ! -d "$A/.ai/runs/COP-5020-fix-authentication" ] || fail "third folder created while ambiguous"

# Parent key becomes the child key, folder slug included.
P="$TMP/parent"
mkdir -p "$P/.ai/runs/COP-6900-soft-cap"
printf 'plan\n' >"$P/.ai/runs/COP-6900-soft-cap/2026-11-02-COP-6900-issue-plan.md"
printf 'ledger\n' >"$P/.ai/runs/COP-6900-soft-cap/COP-6900-review-findings.md"
printf 'questions\n' >"$P/.ai/runs/COP-6900-soft-cap/2026-11-02-COP-6900-questions-for-po.md"
out=$(sh "$RESOLVE" --root "$P" --key COP-7079 --rename-from COP-6900)
[ "$(field "$out" TASK_BRANCH)" = "COP-7079-soft-cap" ] || fail "rename folder: $out"
[ "$(field "$out" ISSUE_PLAN)" = ".ai/runs/COP-7079-soft-cap/2026-11-02-COP-7079-issue-plan.md" ] || fail "rename plan file: $out"
[ "$(field "$out" LEDGER)" = ".ai/runs/COP-7079-soft-cap/COP-7079-review-findings.md" ] || fail "rename ledger: $out"
[ ! -d "$P/.ai/runs/COP-6900-soft-cap" ] || fail "parent folder kept"
[ -f "$P/.ai/runs/COP-7079-soft-cap/2026-11-02-COP-7079-questions-for-po.md" ] || fail "note kept the parent key"

# A flat parent-key file is renamed and then adopted into the child folder.
F="$TMP/flat-parent"
mkdir -p "$F/.ai/runs"
printf 'plan\n' >"$F/.ai/runs/2026-11-02-COP-6900-issue-plan.md"
out=$(sh "$RESOLVE" --root "$F" --key COP-7079 --rename-from COP-6900 --title "Soft cap" --adopt)
[ "$(field "$out" ISSUE_PLAN)" = ".ai/runs/COP-7079-soft-cap/2026-11-02-COP-7079-issue-plan.md" ] || fail "flat parent adopt: $out"
[ ! -f "$F/.ai/runs/2026-11-02-COP-6900-issue-plan.md" ] || fail "old flat parent file remains"

# Key-less branch keeps a slash-free folder name.
K="$TMP/keyless"
mkdir -p "$K"
git -C "$K" init -q
git -C "$K" checkout -q -b 'feat/no-ticket'
out=$(sh "$RESOLVE" --root "$K" --create)
[ "$(field "$out" TASK_BRANCH)" = "feat-no-ticket" ] || fail "key-less branch: $out"
[ -d "$K/.ai/runs/feat-no-ticket" ] || fail "key-less folder missing"

# A dot path is never a task branch.
DOT="$TMP/dot"
mkdir -p "$DOT"
set +e
out=$(sh "$RESOLVE" --root "$DOT" --branch .. --create)
code=$?
set -e
[ "$code" -eq 1 ] || fail "dot branch exited $code: $out"
[ -z "$(field "$out" TASK_BRANCH)" ] || fail "dot branch was used: $out"
[ ! -d "$DOT/.ai/runs" ] || [ -z "$(ls -A "$DOT/.ai/runs")" ] || fail "dot branch created a folder"

# A branch equal to the key is the task branch.
E="$TMP/exact"
mkdir -p "$E"
out=$(sh "$RESOLVE" --root "$E" --key COP-5020 --branch COP-5020 --title "Other name")
[ "$(field "$out" TASK_BRANCH)" = "COP-5020" ] || fail "exact-key branch: $out"

# Rename stops before moving anything when the child key already has a folder.
C="$TMP/child-exists"
mkdir -p "$C/.ai/runs/COP-6900-soft-cap" "$C/.ai/runs/COP-7079-other"
printf 'plan\n' >"$C/.ai/runs/COP-6900-soft-cap/2026-11-02-COP-6900-issue-plan.md"
set +e
out=$(sh "$RESOLVE" --root "$C" --key COP-7079 --rename-from COP-6900)
code=$?
set -e
[ "$code" -eq 1 ] || fail "child-exists rename exited $code: $out"
[ -d "$C/.ai/runs/COP-6900-soft-cap" ] || fail "parent folder moved despite child folder"
[ -f "$C/.ai/runs/COP-6900-soft-cap/2026-11-02-COP-6900-issue-plan.md" ] || fail "parent file renamed despite child folder"

# --create does not make a new folder when the plan lives in another one.
W="$TMP/defer"
mkdir -p "$W/.ai/runs/COP-5020-other-slug"
printf 'here\n' >"$W/.ai/runs/COP-5020-other-slug/2026-11-02-COP-5020-issue-plan.md"
out=$(sh "$RESOLVE" --root "$W" --key COP-5020 --branch COP-5020-new-slug --create)
[ "$(field "$out" PLAN_ELSEWHERE)" = "1" ] || fail "defer: plan elsewhere hidden: $out"
[ ! -d "$W/.ai/runs/COP-5020-new-slug" ] || fail "defer: folder created while plan is elsewhere"

# A folder named exactly the key is found without a branch.
X="$TMP/exact-folder"
mkdir -p "$X/.ai/runs/COP-5020"
out=$(sh "$RESOLVE" --root "$X" --key COP-5020 --title "Other name" --create)
[ "$(field "$out" TASK_BRANCH)" = "COP-5020" ] || fail "exact-key folder not found: $out"
[ ! -d "$X/.ai/runs/COP-5020-other-name" ] || fail "second folder created next to exact-key folder"

# An exact parent folder becomes the exact child folder.
XP="$TMP/exact-parent"
mkdir -p "$XP/.ai/runs/COP-6900"
printf 'plan\n' >"$XP/.ai/runs/COP-6900/2026-11-02-COP-6900-issue-plan.md"
out=$(sh "$RESOLVE" --root "$XP" --key COP-7079 --rename-from COP-6900)
[ "$(field "$out" TASK_BRANCH)" = "COP-7079" ] || fail "exact parent rename: $out"
[ -f "$XP/.ai/runs/COP-7079/2026-11-02-COP-7079-issue-plan.md" ] || fail "exact parent file not renamed"

# A file-level rename conflict leaves the parent folder untouched.
PF="$TMP/preflight"
mkdir -p "$PF/.ai/runs/COP-6900-soft-cap"
printf 'a\n' >"$PF/.ai/runs/COP-6900-soft-cap/2026-11-02-COP-6900-issue-plan.md"
printf 'b\n' >"$PF/.ai/runs/COP-6900-soft-cap/2026-11-02-COP-7079-issue-plan.md"
set +e
out=$(sh "$RESOLVE" --root "$PF" --key COP-7079 --rename-from COP-6900)
code=$?
set -e
[ "$code" -eq 1 ] || fail "preflight conflict exited $code: $out"
[ -d "$PF/.ai/runs/COP-6900-soft-cap" ] || fail "parent folder moved despite a file conflict"
[ ! -d "$PF/.ai/runs/COP-7079-soft-cap" ] || fail "partial child folder left behind"

# Repeated hyphens in a branch are kept.
HY="$TMP/hyphen"
mkdir -p "$HY"
out=$(sh "$RESOLVE" --root "$HY" --key COP-5020 --branch COP-5020-a--b)
[ "$(field "$out" TASK_BRANCH)" = "COP-5020-a--b" ] || fail "hyphens collapsed: $out"

# A flat rename conflict retargets nothing.
FC="$TMP/flat-conflict"
mkdir -p "$FC/.ai/runs"
printf 'd\n' >"$FC/.ai/runs/2026-11-02-COP-6900-docs-update.md"
printf 'p\n' >"$FC/.ai/runs/2026-11-02-COP-6900-issue-plan.md"
printf 'x\n' >"$FC/.ai/runs/2026-11-02-COP-7079-issue-plan.md"
set +e
out=$(sh "$RESOLVE" --root "$FC" --key COP-7079 --rename-from COP-6900)
code=$?
set -e
[ "$code" -eq 1 ] || fail "flat conflict exited $code: $out"
[ -f "$FC/.ai/runs/2026-11-02-COP-6900-docs-update.md" ] || fail "flat file retargeted despite a conflict"

# A plan in another folder defers creation even when a flat copy exists.
FL="$TMP/flat-and-folder"
mkdir -p "$FL/.ai/runs/COP-5020-other"
printf 'f\n' >"$FL/.ai/runs/2026-11-01-COP-5020-issue-plan.md"
printf 'o\n' >"$FL/.ai/runs/COP-5020-other/2026-11-02-COP-5020-issue-plan.md"
out=$(sh "$RESOLVE" --root "$FL" --key COP-5020 --branch COP-5020-new --create --adopt)
[ "$(field "$out" PLAN_ELSEWHERE)" = "1" ] || fail "deferred create not reported: $out"
[ ! -d "$FL/.ai/runs/COP-5020-new" ] || fail "third folder created next to a plan elsewhere"

# Bad key is a usage error.
set +e
out=$(sh "$RESOLVE" --root "$TMP" --key 'not a key' 2>"$TMP/err")
code=$?
set -e
[ "$code" -eq 2 ] || fail "bad key exited $code"

echo "ok"
