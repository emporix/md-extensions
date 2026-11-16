# PR merge operations

GitHub operations **PR merge** (`references/playbooks/pr-merge.md`) runs that
the shared `github` descriptor (`$CODE_HOST_FILE`) lacks, or needs with flags
it does not list. Everything else stays on the descriptor's operations. Every
command passes `--repo {owner}/{repo}` (or `repos/{owner}/{repo}/…`) from
step 1, never the current checkout's repository.

## Branch names

`headRefName` comes from the PR, and Git allows shell metacharacters in branch
names (`;`, `$`, `` ` ``, `|`, `&`, `'`). In this order, before any command
uses it:

1. Check the literal `headRefName` text, as data and not in a shell: every character is in `[A-Za-z0-9._/-]`. Anything else → never paste it anywhere; the remote and the local branch are both `kept (unsafe branch name)`.
2. Only then set it, single-quoted (`BRANCH='{headRefName}'`; the allowlist leaves no quote to break out of; shell state does not persist between commands, so repeat this assignment at the start of each later command with the same validated value), and confirm `git check-ref-format --branch "$BRANCH"` succeeds (fails → the same `kept (unsafe branch name)`).
3. From then on pass it only as a double-quoted variable (`"$BRANCH"`, `"refs/heads/$BRANCH"`, `"branch.$BRANCH"`), never pasted into a command line.

## get-pr-merge-fields (read)

```bash
gh pr view {prNumber} --repo {owner}/{repo} --json number,title,body,url,state,isDraft,baseRefName,headRefName,headRefOid,isCrossRepository,mergeable,mergeStateStatus,reviewDecision,mergedAt
```

**get-pr**'s fields that PR merge uses (the title and body feed the step 4
squash message), plus `isCrossRepository` (a fork's head branch).

## get-pr-diff-repo (read)

```bash
gh pr diff {prNumber} --repo {owner}/{repo}
```

The PR's full diff, from its own repository.

## get-pr-commits (read)

```bash
gh pr view {prNumber} --repo {owner}/{repo} --json author,commits --jq '.author.login as $a | [.commits[].authors[] | select(.login != null and .login != "" and .login != $a and (.login | endswith("[bot]") | not) and ((.email // "") | contains("[bot]") | not)) | {login, name, email}] | unique'
```

The `Co-authored-by:` trailers: commit authors with a GitHub login other than
the PR author's, without bots. An author with no login (an email GitHub
cannot link) is left out, since it may be the PR author's own second address.
An author whose `email` is empty gets `{login}@users.noreply.github.com`,
GitHub's no-reply address for that account.

## branch-guards (reads)

```bash
gh repo view {owner}/{repo} --json defaultBranchRef --jq .defaultBranchRef.name
gh api "repos/{owner}/{repo}/branches/$BRANCH" --jq .protected
gh pr list --repo {owner}/{repo} --base "$BRANCH" --state open --json number --jq '[.[].number]'
gh pr list --repo {owner}/{repo} --head "$BRANCH" --state open --json number --jq '[.[].number | select(. != {prNumber})]'
gh api "repos/{owner}/{repo}/git/ref/heads/$BRANCH" --jq .object.sha
```

`$BRANCH` is the validated name (§ Branch names). The default branch, whether
it is protected, the open PRs whose base is `$BRANCH` and the other open PRs
whose head is `$BRANCH` (both filter on
the server, so a non-empty first page already means "at least one"; the jq
drops the PR being merged), and the branch's current tip.

Only the two branch reads (`branches/$BRANCH` and `git/ref/heads/$BRANCH`)
can mean the branch is gone: a `404` there is `not protected` in step 2 (the
base repository has no such branch, as for a fork's branch) and `already
deleted` in step 7. Any other failed read, a `404` from `gh repo view` or
`gh pr list` included (a missing repository or no access), is an error:
report it and keep the branch; never read it as deleted.

## merge-pr-with-message (write)

```bash
gh pr merge {prNumber} --repo {owner}/{repo} {--squash | --merge | --rebase} --match-head-commit {headRefOid} [--subject "$(cat "$SUBJECT_FILE")" --body-file "$BODY_FILE"]
```

The descriptor's **merge-pr** plus `--subject` and `--body-file`, which set
the squash commit message. The subject comes from the PR title, which is
untrusted text, so it is never pasted into the command: write it to a file
(`SUBJECT_FILE=$(mktemp)`, with the file-writing tool, not `echo`) and pass
`"$(cat "$SUBJECT_FILE")"`, whose output the shell does not expand again. The
same for the body (`--body-file`). Neither flag is used with `--rebase`; a
merge queue may apply its own message. Exactly one method flag, never `gh`'s default. Never `--admin`,
`--auto`, or `--delete-branch` (it also checks out the base and deletes the
local branch in the current checkout; **delete-remote-branch** and step 8 do
that work instead).

## delete-remote-branch (write)

```bash
gh api -X DELETE "repos/{owner}/{repo}/git/refs/heads/$BRANCH"
```

Deletes the branch on GitHub only. The API has no compare-and-delete, so run
all of **branch-guards** again right before it (default, protection, open PRs,
tip) and delete only when none of them says keep and the tip is still the
merged head. `404`, or `422` whose message is `Reference does not exist` → already
deleted (for example by the repository's auto-delete setting); report it, it
is not a failure. Any other error, another `422` included (a protected ref),
→ not deleted; report GitHub's message. Never for a fork's branch, the
default branch, or a protected branch, and never while an open PR uses the
branch as its base (deleting it closes that PR) or as its head.
