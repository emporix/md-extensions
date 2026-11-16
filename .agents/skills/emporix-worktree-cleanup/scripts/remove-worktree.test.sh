#!/usr/bin/env sh
# Behaviour tests for remove-worktree.sh.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
RM="$ROOT/skills/emporix-worktree-cleanup/scripts/remove-worktree.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }
field() { printf '%s\n' "$1" | sed -n "s/^$2=//p" | head -n 1; }

TMP=$(mktemp -d)
trap 'chmod -R u+w "$TMP" 2>/dev/null; rm -rf "$TMP"' EXIT
TMP=$(cd "$TMP" && pwd -P)

# A primary checkout (path with a space) on main that ignores .ai/, as emporix-setup leaves it.
P="$TMP/my repo"
git init -q -b main "$P"
git -C "$P" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m init
git init -q --bare "$TMP/origin.git"
git -C "$P" remote add origin "$TMP/origin.git"
git -C "$P" push -q origin main
git -C "$P" fetch -q origin
git -C "$P" remote set-head origin main
echo "/.ai" >> "$P/.git/info/exclude"

# $1 = key → a pushed worktree "my repo-$1" on branch "$1-feature".
new_wt() {
  git -C "$P" worktree add -q -b "$1-feature" "$TMP/my repo-$1" main
  git -C "$TMP/my repo-$1" push -q origin "$1-feature"
}

# --- Preserve: ignored run folder copied, differing primary file kept, identical skipped.
new_wt COP-1
RF=".ai/runs/COP-1-feature"
mkdir -p "$TMP/my repo-COP-1/$RF" "$P/$RF"
echo plan > "$TMP/my repo-COP-1/$RF/2026-11-13-COP-1 issue-plan.md"
echo ledger > "$TMP/my repo-COP-1/$RF/COP-1-review-findings.md"
echo ledger > "$P/$RF/COP-1-review-findings.md"
echo old > "$P/$RF/2026-11-13-COP-1 issue-plan.md"
echo earlier > "$P/$RF/2026-11-13-COP-1 issue-plan.md.from-my repo-COP-1"

out=$(sh "$RM" --root "$P" --key COP-1)
[ ! -d "$TMP/my repo-COP-1" ] || fail "worktree should be removed: $out"
[ "$(field "$out" REMOVED)" = 1 ] || fail "removal not reported: $out"
[ "$(cat "$P/$RF/2026-11-13-COP-1 issue-plan.md")" = old ] || fail "primary plan overwritten"
[ "$(cat "$P/$RF/2026-11-13-COP-1 issue-plan.md.from-my repo-COP-1")" = earlier ] || fail "earlier preserved copy overwritten"
[ "$(cat "$P/$RF/2026-11-13-COP-1 issue-plan.md.from-my repo-COP-1-2")" = plan ] || fail "worktree plan lost: $out"
[ "$(field "$out" PRESERVED)" = "$RF/2026-11-13-COP-1 issue-plan.md.from-my repo-COP-1-2" ] || fail "preserved path: $out"
[ ! -e "$P/$RF/COP-1-review-findings.md.from-my repo-COP-1" ] || fail "identical ledger duplicated"

# --- Re-run after an earlier preserve: an identical .from- copy is not duplicated,
#     and a symlink in .ai/ is skipped and reported.
new_wt COP-6
RF6=".ai/runs/COP-6-feature"
mkdir -p "$TMP/my repo-COP-6/$RF6" "$P/$RF6"
echo new > "$TMP/my repo-COP-6/$RF6/plan.md"
echo old > "$P/$RF6/plan.md"
echo new > "$P/$RF6/plan.md.from-my repo-COP-6"
ln -s /nonexistent "$TMP/my repo-COP-6/$RF6/link.md"
out=$(sh "$RM" --root "$P" --key COP-6)
[ ! -d "$TMP/my repo-COP-6" ] || fail "COP-6 should be removed: $out"
[ ! -e "$P/$RF6/plan.md.from-my repo-COP-6-2" ] || fail "identical .from- copy duplicated: $out"
printf '%s\n' "$out" | grep -q '^PRESERVED=' && fail "nothing new to preserve: $out"
[ "$(field "$out" SKIPPED_LINK)" = "$RF6/link.md" ] || fail "symlink not reported: $out"

# --- A dangling symlink at the destination is never written through.
new_wt COP-11
RF11=".ai/runs/COP-11-feature"
mkdir -p "$TMP/my repo-COP-11/$RF11" "$P/$RF11"
echo plan > "$TMP/my repo-COP-11/$RF11/plan.md"
ln -s "$TMP/outside-target.md" "$P/$RF11/plan.md"
out=$(sh "$RM" --root "$P" --key COP-11)
[ ! -e "$TMP/outside-target.md" ] || fail "copy wrote through a dangling symlink: $out"
[ "$(cat "$P/$RF11/plan.md.from-my repo-COP-11")" = plan ] || fail "copy not placed beside the symlink: $out"

# --- A symlinked directory on the destination path is never written through
#     (here .ai/qa links outside and the copy would need .ai/qa/sub/).
new_wt COP-14
mkdir -p "$TMP/my repo-COP-14/.ai/qa/sub" "$TMP/outside-14"
echo evidence > "$TMP/my repo-COP-14/.ai/qa/sub/report.md"
[ ! -e "$P/.ai/qa" ] || mv "$P/.ai/qa" "$TMP/qa-saved"
ln -s "$TMP/outside-14" "$P/.ai/qa"
if out=$(sh "$RM" --root "$P" --key COP-14 2>&1); then
  fail "a symlinked parent must refuse: $out"
fi
[ -z "$(ls -A "$TMP/outside-14")" ] || fail "copy wrote through a symlinked parent: $out"
[ -d "$TMP/my repo-COP-14" ] || fail "worktree removed despite a symlinked parent"
printf '%s\n' "$out" | grep -q 'is a symlink' || fail "refusal reason: $out"
# Same, with the subfolder already present behind the link (caught by the pwd -P check).
mkdir -p "$TMP/outside-14/sub"
if out=$(sh "$RM" --root "$P" --key COP-14 2>&1); then
  fail "an existing folder behind a symlinked parent must refuse: $out"
fi
[ ! -e "$TMP/outside-14/sub/report.md" ] || fail "copy wrote into a folder behind a symlink: $out"
rm "$P/.ai/qa"
[ ! -e "$TMP/qa-saved" ] || mv "$TMP/qa-saved" "$P/.ai/qa"
sh "$RM" --root "$P" --key COP-14 >/dev/null

# --- A file name with a newline is refused, nothing removed.
new_wt COP-12
mkdir -p "$TMP/my repo-COP-12/.ai/runs"
printf 'x' > "$TMP/my repo-COP-12/.ai/runs/bad
name.md"
if out=$(sh "$RM" --root "$P" --key COP-12 2>&1); then
  fail "a newline in a name must refuse: $out"
fi
[ -d "$TMP/my repo-COP-12" ] || fail "worktree removed despite a newline name"
rm "$TMP/my repo-COP-12/.ai/runs/bad
name.md"
sh "$RM" --root "$P" --key COP-12 >/dev/null

# --- --key never matches a longer key: COP-1 does not pick COP-13-x (no COP-1 folder).
git -C "$P" worktree add -q -b COP-13-x "$TMP/custom-13" main
git -C "$TMP/custom-13" push -q origin COP-13-x
if out=$(sh "$RM" --root "$P" --key COP-1 2>&1); then fail "COP-1 matched COP-13-x: $out"; fi
[ -d "$TMP/custom-13" ] || fail "COP-1 removed COP-13's worktree"
sh "$RM" --root "$P" --key COP-13 >/dev/null
[ ! -d "$TMP/custom-13" ] || fail "COP-13 exact-prefix match should remove it"

# --- --not-cwd refuses the worktree the command runs in; without it, removal works from inside.
new_wt COP-7
if out=$(cd "$TMP/my repo-COP-7" && sh "$RM" --root "$P" --key COP-7 --not-cwd 2>&1); then
  fail "--not-cwd must refuse the current worktree: $out"
fi
[ -d "$TMP/my repo-COP-7" ] || fail "current worktree removed under --not-cwd"
out=$(cd "$TMP/my repo-COP-7" && sh "$RM" --root "$P" --key COP-7)
[ ! -d "$TMP/my repo-COP-7" ] || fail "without --not-cwd, removal from inside should work: $out"

# --- An unresolvable --merged-head does not count as merged.
new_wt COP-8
git -C "$TMP/my repo-COP-8" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m local
out=$(sh "$RM" --root "$P" --list --merged-head 0000000000000000000000000000000000000000)
printf '%s\n' "$out" | grep -A4 "^WORKTREE=$TMP/my repo-COP-8\$" | grep -q '^UNPUSHED=1$' || fail "unresolvable --merged-head counted as merged: $out"
git -C "$TMP/my repo-COP-8" push -q origin COP-8-feature
sh "$RM" --root "$P" --key COP-8 >/dev/null

# --- --path removes exactly that worktree, even when another one matches the same key.
git -C "$P" worktree add -q -b COP-9-feature "$TMP/my repo-COP-9" main
git -C "$TMP/my repo-COP-9" push -q origin COP-9-feature
git -C "$P" worktree add -q -b COP-9-other "$TMP/elsewhere COP-9" main
git -C "$TMP/elsewhere COP-9" push -q origin COP-9-other
out=$(sh "$RM" --root "$P" --path "$TMP/elsewhere COP-9")
[ ! -d "$TMP/elsewhere COP-9" ] || fail "--path did not remove its worktree: $out"
[ -d "$TMP/my repo-COP-9" ] || fail "--path removed a different worktree: $out"
if out=$(sh "$RM" --root "$P" --path "$P" 2>&1); then fail "--path must refuse the primary: $out"; fi
if out=$(sh "$RM" --root "$P" --path "$TMP" 2>&1); then fail "--path must refuse a non-worktree: $out"; fi
sh "$RM" --root "$P" --path "$TMP/my repo-COP-9" >/dev/null

# --- A detached HEAD with a commit only in that worktree reads as unpushed and is refused.
git -C "$P" worktree add -q --detach "$TMP/my repo-COP-10" main
git -C "$TMP/my repo-COP-10" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m only-here
out=$(sh "$RM" --root "$P" --list)
printf '%s\n' "$out" | grep -A4 "^WORKTREE=$TMP/my repo-COP-10\$" | grep -q '^UNPUSHED=1$' || fail "detached HEAD reported pushed: $out"
if out=$(sh "$RM" --root "$P" --path "$TMP/my repo-COP-10" 2>&1); then
  fail "a detached HEAD with local commits must be refused: $out"
fi
[ -d "$TMP/my repo-COP-10" ] || fail "detached worktree removed"
git -C "$TMP/my repo-COP-10" checkout -q --detach main
sh "$RM" --root "$P" --path "$TMP/my repo-COP-10" >/dev/null
[ ! -d "$TMP/my repo-COP-10" ] || fail "detached HEAD on base should be removable"

# --- Two target modes, a repeated mode, or an empty --key / --path are refused
#     (exit 2) before anything is removed.
new_wt COP-15
W15="$TMP/my repo-COP-15"
# $1 = expected message, the rest = arguments.
refuse() {
  msg="$1"; shift
  rc=0
  out=$(sh "$RM" --root "$P" "$@" 2>&1) || rc=$?
  [ "$rc" = 2 ] || fail "expected exit 2 for ($*), got $rc: $out"
  printf '%s\n' "$out" | grep -q -- "$msg" || fail "expected '$msg' for ($*): $out"
}
refuse "only one of" --all-merged --path "$W15"
refuse "only one of" --key COP-15 --path "$W15"
refuse "only one of" --key COP-15 --all-merged
refuse "only one of" --key COP-15 --list
refuse "only one of" --path "$W15" --list
refuse "only one of" --all-merged --list
refuse "only one of" --key COP-15 --key COP-1
refuse "only one of" --path "$W15" --path "$W15"
refuse "only one of" --all-merged --all-merged
refuse "only one of" --list --list
refuse "--key needs a value" --key ""
refuse "--path needs a value" --path ""
refuse "--key needs a value" --key
refuse "--path needs a value" --path
[ -d "$W15" ] || fail "a refused mode combination removed a worktree"
sh "$RM" --root "$P" --key COP-15 >/dev/null

# --- An untracked .ai/ that is NOT ignored is preserved too (removed with --force).
new_wt COP-2
mkdir -p "$TMP/my repo-COP-2/.ai/qa"
echo evidence > "$TMP/my repo-COP-2/.ai/qa/report.md"
sed -i.bak '/^\/\.ai$/d' "$P/.git/info/exclude"
out=$(sh "$RM" --root "$P" --key COP-2 --force)
echo "/.ai" >> "$P/.git/info/exclude"
[ ! -d "$TMP/my repo-COP-2" ] || fail "--force should remove: $out"
[ "$(cat "$P/.ai/qa/report.md")" = evidence ] || fail "non-ignored .ai file lost under --force: $out"

# --- A failed copy removes nothing. A plain file where the run folder must go makes
#     mkdir fail for any user, root included.
new_wt COP-3
mkdir -p "$TMP/my repo-COP-3/.ai/runs/COP-3-feature" "$P/.ai/runs"
echo plan > "$TMP/my repo-COP-3/.ai/runs/COP-3-feature/plan.md"
echo blocker > "$P/.ai/runs/COP-3-feature"
if out=$(sh "$RM" --root "$P" --key COP-3 2>&1); then
  fail "a failed copy must refuse: $out"
fi
rm "$P/.ai/runs/COP-3-feature"
[ -f "$TMP/my repo-COP-3/.ai/runs/COP-3-feature/plan.md" ] || fail "worktree removed after a failed copy"
printf '%s\n' "$out" | grep -q 'nothing removed' || fail "refusal reason: $out"

# --- A dirty worktree is refused, and --list reports its state.
echo wip > "$TMP/my repo-COP-3/wip.txt"
out=$(sh "$RM" --root "$P" --list)
printf '%s\n' "$out" | grep -A4 "^WORKTREE=$TMP/my repo-COP-3\$" | grep -q '^DIRTY=1$' || fail "--list DIRTY: $out"
if out=$(sh "$RM" --root "$P" --key COP-3 2>&1); then
  fail "a dirty worktree must be refused: $out"
fi
[ -d "$TMP/my repo-COP-3" ] || fail "dirty worktree removed"
rm "$TMP/my repo-COP-3/wip.txt"

# --- Squash merge: the remote branch is gone and the branch is not an ancestor of
#     main, so it reads as unpushed, unless --merged-head names the merged head.
new_wt COP-4
git -C "$TMP/my repo-COP-4" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m work
git -C "$TMP/my repo-COP-4" push -q origin COP-4-feature
HEAD4=$(git -C "$TMP/my repo-COP-4" rev-parse HEAD)
git -C "$P" push -q origin --delete COP-4-feature
git -C "$P" fetch -q --prune origin
out=$(sh "$RM" --root "$P" --list)
printf '%s\n' "$out" | grep -A4 "^WORKTREE=$TMP/my repo-COP-4\$" | grep -q '^UNPUSHED=1$' || fail "--list UNPUSHED: $out"
if out=$(sh "$RM" --root "$P" --key COP-4 2>&1); then
  fail "without --merged-head a squash-merged branch reads as unpushed: $out"
fi
# A worktree with a local commit beyond the merged head is still refused.
git -C "$TMP/my repo-COP-4" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m local
if out=$(sh "$RM" --root "$P" --key COP-4 --merged-head "$HEAD4" 2>&1); then
  fail "a commit beyond the merged head must be refused: $out"
fi
git -C "$TMP/my repo-COP-4" reset -q --hard "$HEAD4"
out=$(sh "$RM" --root "$P" --list --merged-head "$HEAD4")
printf '%s\n' "$out" | grep -A4 "^WORKTREE=$TMP/my repo-COP-4\$" | grep -q '^UNPUSHED=0$' || fail "--list --merged-head: $out"
out=$(sh "$RM" --root "$P" --key COP-4 --merged-head "$HEAD4")
[ ! -d "$TMP/my repo-COP-4" ] || fail "--merged-head should allow removal: $out"

# --- --all-merged: a refused worktree is skipped, the next one is still removed.
git -C "$P" worktree add -q -b COP-5-feature "$TMP/my repo-COP-5" main
git -C "$TMP/my repo-COP-5" push -q origin COP-5-feature
echo wip > "$TMP/my repo-COP-3/wip.txt"
out=$(sh "$RM" --root "$P" --all-merged 2>&1)
printf '%s\n' "$out" | grep -q "^SKIP=$TMP/my repo-COP-3\$" || fail "dirty worktree not skipped: $out"
[ ! -d "$TMP/my repo-COP-5" ] || fail "--all-merged stopped after a refusal: $out"
[ -d "$TMP/my repo-COP-3" ] || fail "dirty worktree removed by --all-merged"

echo "remove-worktree.test.sh: ok"
