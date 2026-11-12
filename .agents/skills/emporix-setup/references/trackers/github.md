# Tracker provider: GitHub

GitHub implementation of the tracker operations. Skills name operations (**get-pr**, **comment-pr**, …); this file says how to run them with the `gh` CLI.

`ai-setup.json` selects this file with `"codeHost": "github"`. `load-config.sh` resolves it as `$CODE_HOST_FILE` from the installed skill, or from a repo-local override at `.ai/overrides/trackers/github.md` when one exists. Nothing is copied into the repo.

## Prerequisites

- `gh` CLI installed and authenticated; `jq` available. Verify with **auth-check** before a batch run.
- **Minimum `gh` version: 2.82.1.** Older clients abort `gh pr edit` / `gh issue edit` on the retired Projects (classic) GraphQL fields. Every label, assignee, and title/body mutation below uses the REST API (`gh api`) so it still works on older clients. Do not switch those mutations back to `gh pr edit --add-label`.
- All operations accept an optional `{repo}` (`owner/name`). When omitted, `gh` infers it from the current checkout. Pass `--repo {owner}/{repo}` when operating on another repository.

## Conventions

- Issue and PR identifiers are numbers; in text they are `#123`.
- Never include `projectCards` in a `--json` field list.
- A PR links a GitHub issue with `Fixes #{issueId}` in the body. That does **not** close a Jira work item. Buddy has no transition tool — do not close Jira from this file.
- Multi-line bodies use `--body-file` (or process substitution) so formatting survives.
- CI truth for a PR comes from **get-pr-checks**. Required checks come from **get-required-checks**; on 404, treat every reported check as required.

## Label guards

`labels.enabled` defaults to `false` in `ai-setup.json`. When it is not `true`, every guard is a no-op. Mutations use REST, not `gh pr edit`.

```bash
tracker_repo() {
  if [ -n "${REPO:-}" ]; then printf '%s' "$REPO"
  else gh repo view --json nameWithOwner --jq .nameWithOwner; fi
}

label_exists() {
  gh api --paginate "repos/$(tracker_repo)/labels" --jq '.[].name' | grep -Fxq "$1"
}

# $1 = label, $2 = PR or issue number
apply_label() {
  if [ "$LABELS_ENABLED" != "true" ]; then return 0; fi
  if label_exists "$1"; then
    gh api -X POST "repos/$(tracker_repo)/issues/$2/labels" -f "labels[]=$1" >/dev/null
  else
    echo "Skipping label '$1' (not defined in this repo)."
  fi
}
apply_issue_label() { apply_label "$1" "$2"; }

remove_label() {
  if [ "$LABELS_ENABLED" != "true" ]; then return 0; fi
  gh api -X DELETE \
    "repos/$(tracker_repo)/issues/$2/labels/$(printf '%s' "$1" | jq -sRr @uri)" \
    >/dev/null 2>&1 || true
}
remove_issue_label() { remove_label "$1" "$2"; }
```

Read labels back (`gh pr view {prNumber} --json labels`) when a later decision depends on them.

## Operations

### Identity and repository

#### auth-check

```bash
gh auth status || exit 1
GH_VERSION=$(gh --version | sed -n '1s/.*gh version \([0-9][0-9.]*\).*/\1/p')
MIN_GH_VERSION=2.82.1
if [ "$(printf '%s\n%s\n' "$MIN_GH_VERSION" "$GH_VERSION" | sort -V | head -n1)" != "$MIN_GH_VERSION" ]; then
  echo "WARNING: gh $GH_VERSION predates $MIN_GH_VERSION — upgrade gh. Mutations in this file use REST and still work."
fi
```

#### current-user

```bash
CURRENT_USER=$(gh api user --jq '.login')
```

#### committer-identity

Resolve the human who owns the GitHub token. Use this for **author and committer**. Never Cursor, Copilot, or an agent. Do not `git config user.*` — pass identity per commit (`git-commit-as-user.sh` or `git -c user.name= -c user.email=`).

```bash
CURRENT_USER=$(gh api user --jq '.login')
COMMIT_NAME=$(gh api user --jq 'if (.name | type) == "string" and (.name | length) > 0 then .name else .login end')
is_email() { printf '%s\n' "$1" | grep -Eq '^[^][[:space:]@{}"<>(),;:]+@[^][[:space:]@{}"<>(),;:]+\.[^][[:space:]@{}"<>(),;:]+$'; }
is_agent() { echo "$1" | grep -Ei 'cursor[[:space:]]*agent|^cursor$|noreply@cursor|copilot\[bot\]|github-actions\[bot\]' >/dev/null; }
COMMIT_EMAIL=$(gh api user --jq 'if (.email | type) == "string" and (.email | length) > 0 then .email else empty end' 2>/dev/null || true)
is_email "$COMMIT_EMAIL" || COMMIT_EMAIL=""
if [ -z "$COMMIT_EMAIL" ]; then
  # Without the token's "user" scope this 404s and gh prints the JSON error body on stdout — never use it.
  COMMIT_EMAIL=$(gh api user/emails --jq '[.[] | select(.primary == true)][0].email // empty' 2>/dev/null || true)
  is_email "$COMMIT_EMAIL" || COMMIT_EMAIL=""
fi
if [ -z "$COMMIT_EMAIL" ]; then
  COMMIT_EMAIL=$(git config user.email 2>/dev/null || true)   # the human's own identity; skip if an agent set it
  { is_email "$COMMIT_EMAIL" && ! is_agent "$COMMIT_EMAIL"; } || COMMIT_EMAIL=""
fi
if [ -z "$COMMIT_EMAIL" ]; then
  COMMIT_EMAIL="$(gh api user --jq .id)+${CURRENT_USER}@users.noreply.github.com"
fi
```

The commit message starts with `{KEY}`, or with the branch name and a space on a key-less re-ship (`emporix-feature/references/pr.md` § Rules); the script refuses anything else. It soft-resets the commit when the author or committer is an agent or is not the resolved address.

Skills call `"$(skill_script emporix-feature git-commit-as-user.sh)"`. After commit, `git log -1 --format='%an <%ae>'` must match `$COMMIT_NAME` / `$COMMIT_EMAIL`.

#### review-agent-identity

The **Emporix Review Agent** is a second GitHub identity that posts review findings on a PR, so the finding and the human's "fixed" reply come from different authors. No skill in this collection posts as it today (the `emporix-pr-create` skill that did was removed; `emporix-feature` posts a `<!-- emporix-self-review -->` summary with the human token instead). The operations stay for older PRs and future use. Its token lives in the env var named by `review.agentTokenEnv` (`$REVIEW_AGENT_TOKEN_ENV`, default `EMPORIX_REVIEW_AGENT_TOKEN`). The account needs write access to the repository. Never print the token.

```bash
REVIEW_AGENT_TOKEN=$(printenv "$REVIEW_AGENT_TOKEN_ENV" 2>/dev/null || true)
if [ -n "$REVIEW_AGENT_TOKEN" ]; then
  REVIEW_AGENT_LOGIN=$(GH_TOKEN="$REVIEW_AGENT_TOKEN" gh api user --jq .login)
  REVIEW_AGENT_MODE=token
else
  REVIEW_AGENT_LOGIN=$(gh api user --jq .login)   # fallback: human token, visible header
  REVIEW_AGENT_MODE=fallback
fi
```

`REVIEW_AGENT_MODE=fallback` means the finding is posted by the human token under a visible header. Say so in the report; do not pretend a separate account posted it.

Comments posted by either mode carry the marker `<!-- emporix-review-agent -->` on the first line and the header `**Emporix Review Agent**`. Skills recognise Review Agent findings by that marker, not by the author login.

#### repo-info

```bash
gh repo view --json nameWithOwner,defaultBranchRef
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
```

#### default-branch

```bash
BASE_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || true)
[ -z "$BASE_BRANCH" ] && BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
[ -z "$BASE_BRANCH" ] && BASE_BRANCH="main"
```

### Issues

#### get-issue
```bash
gh issue view {issueId} --repo {owner}/{repo} --json number,title,body,state,author,url,labels,assignees,comments
```

#### search-issues
```bash
gh issue list --repo {owner}/{repo} --state open --search "<query> in:title,body" --json number,title,url
```

#### create-issue
```bash
gh issue create --repo {owner}/{repo} --title "<title>" --body-file <body-file>
```

#### close-issue
```bash
gh issue close {issueId} --repo {owner}/{repo} --reason completed --comment "<comment>"
```

#### comment-issue
```bash
gh issue comment {issueId} --repo {owner}/{repo} --body-file <body-file>
```

#### update-issue
```bash
gh api -X PATCH repos/{owner}/{repo}/issues/{issueId} -f title="<title>"
gh api -X PATCH repos/{owner}/{repo}/issues/{issueId} -F body=@<file>
```

#### assign-issue / unassign-issue
```bash
gh api -X POST   repos/{owner}/{repo}/issues/{issueId}/assignees -f "assignees[]=<login>"
gh api -X DELETE repos/{owner}/{repo}/issues/{issueId}/assignees -f "assignees[]=<login>"
```

#### label-issue / unlabel-issue
`apply_issue_label "<label>" {issueId}` / `remove_issue_label "<label>" {issueId}`.

#### get-issue-comment
```bash
gh api repos/{owner}/{repo}/issues/comments/{commentId} --jq '{body,user:.user.login,url:.html_url}'
```

#### list-issue-comments
```bash
gh api --paginate repos/{owner}/{repo}/issues/{number}/comments --jq '.[] | {id,user:.user.login,body}'
```

#### update-comment
```bash
gh api -X PATCH repos/{owner}/{repo}/issues/comments/{commentId} -F body=@<path>
```

### Pull requests

#### get-pr
```bash
gh pr view {prNumber} --json number,title,url,body,state,author,isDraft,baseRefName,headRefName,headRefOid,mergeable,mergeStateStatus,reviewDecision,labels,assignees,comments,createdAt,mergedAt,closedAt
```

#### list-prs
```bash
gh pr list --state open --json number,title,url,author,labels,reviewDecision,headRefName,baseRefName,isDraft --limit 100
```

#### search-prs
```bash
gh search prs --repo {owner}/{repo} "<query>" --state open --json number,title,url,state
```

#### create-pr
```bash
gh pr create --repo {owner}/{repo} --base "$BASE_BRANCH" --draft --title "<title>" --body-file <body-file>
PR_URL=$(gh pr view --json url --jq .url)
PR_NUMBER=$(gh pr view --json number --jq .number)
```

#### update-pr
```bash
gh api -X PATCH repos/{owner}/{repo}/pulls/{prNumber} -f title="<title>"
gh api -X PATCH repos/{owner}/{repo}/pulls/{prNumber} -F body=@<path>
```

#### comment-pr
```bash
gh pr comment {prNumber} --body-file <path>
```

#### review-agent-comment

Post one review finding on a PR as the **Emporix Review Agent** (**review-agent-identity** first). Body starts with the marker and header:

```markdown
<!-- emporix-review-agent -->
**Emporix Review Agent** · {severity}

{finding — what is wrong and why it matters}

Source: {review source}. Plan: {KEY} {plan path, or none}.
```

Pick the shape by what the finding can anchor to on the PR **head** (`HEAD_SHA` = pushed head):

```bash
RUN() { if [ "$REVIEW_AGENT_MODE" = token ]; then GH_TOKEN="$REVIEW_AGENT_TOKEN" "$@"; else "$@"; fi; }

# inline — path and line are in the head diff
RUN gh api -X POST "repos/{owner}/{repo}/pulls/{prNumber}/comments" \
  -f commit_id="$HEAD_SHA" -f path="{path}" -F line={line} -f side=RIGHT -F body=@<body-file>

# file-level — path is in the PR, line is not in the head diff (or unknown)
RUN gh api -X POST "repos/{owner}/{repo}/pulls/{prNumber}/comments" \
  -f commit_id="$HEAD_SHA" -f path="{path}" -f subject_type=file -F body=@<body-file>

# conversation — no path (summary-level finding)
RUN gh pr comment {prNumber} --body-file <body-file>
```

Inline and file-level comments create review threads that **reply-review-comment** and **resolve-review-thread** can act on. Conversation comments cannot be resolved; prefer the first two.

One comment per finding. Before posting, **list-review-comments** and skip a finding that already has an open Review Agent thread with the same path and substance.

#### review-agent-reply

The human's answer to a Review Agent finding. Always the **human token** (plain `gh`, never `GH_TOKEN=$REVIEW_AGENT_TOKEN`): **reply-review-comment** on that thread, then **resolve-review-thread**. Conversation findings get a **comment-pr** that quotes the finding's first line, since they cannot be resolved.

```markdown
Fixed in {short SHA}: {one line — what changed}.
```

Do not reply as the Review Agent. Do not resolve a finding that is still present.

#### attach-image-evidence
Post one comment that includes the caller's body plus links or markdown image tags for the local PNG paths. Prefer attaching via the tracker's comment so images render inline when the repo is public. Never commit evidence onto the change's own branch. If inline upload is not possible (private repo, no write access), post the comment with local artifact paths and say so — do not fail the caller.

#### assign-pr / unassign-pr
```bash
gh api -X POST   repos/{owner}/{repo}/issues/{prNumber}/assignees -f "assignees[]=<login>"
gh api -X DELETE repos/{owner}/{repo}/issues/{prNumber}/assignees -f "assignees[]=<login>"
```

#### label-pr / unlabel-pr
`apply_label "<label>" {prNumber}` / `remove_label "<label>" {prNumber}`.

#### get-pr-diff
```bash
gh pr diff {prNumber}
```

#### get-pr-files
```bash
gh api "repos/{owner}/{repo}/pulls/{prNumber}/files" --paginate --jq '.[] | {path: .filename, status: .status}'
```

#### checkout-pr

Default: `gh pr checkout {prNumber}` in this folder when it is already the
ticket checkout (or idle on `$BASE_BRANCH`). Do **not** steal a dirty primary
from another agent.

`--worktree` / a `Worktree:` line from the feature implement stage: **ensure-worktree** with the
PR `headRefName` and Jira key. Do not `gh pr checkout` in the primary then.

#### resolve-checkout

Before **ensure-branch** / **ensure-worktree** in implement (`emporix-feature`
and `emporix-dev`): reads the developer's worktree mode
(`references/local-settings.md`, per-repository override first) and prints
`DECISION=worktree|in-place|ask|move|current`. Changes nothing. `current`
(`CURRENT_BRANCH` mode): run neither ensure script; exit 1 is the mode refusing
the base branch, a detached HEAD, or another ticket's branch. `move`: a worktree is wanted but the branch is checked out in
the main checkout; ask the user (`emporix-feature` `references/worktree.md`
§ Branch in the main checkout), never **ensure-worktree**.

```bash
SCRIPT=$(skill_script emporix-feature resolve-checkout.sh)
sh "$SCRIPT" --root . --branch {branch} --base {base} --key {KEY} [--working-branch {plan's Working branch}] --fallback {IN_PLACE|ALWAYS_WORKTREE} [--force-worktree]
```

#### ensure-branch

`DECISION=in-place` (or the user picked in place):

```bash
SCRIPT=$(skill_script emporix-feature ensure-branch.sh)
sh "$SCRIPT" --root . --branch {branch} --base {base}
```

Creates or checks out `{branch}` in this checkout. Refuses a dirty switch and
refuses if the branch is already in another worktree.

#### ensure-worktree

`DECISION=worktree` (or the user picked a worktree), or a later skill must
join an existing ticket checkout (`--worktree` / a `Worktree:` line).

```bash
SCRIPT=$(skill_script emporix-feature ensure-worktree.sh)
sh "$SCRIPT" --root . --branch {branch} --base {base} --key {KEY}
```

Creates or reuses a sibling folder `{basename}-{KEY}`. Later commands use
`WORKTREE` as cwd. Same branch cannot exist in two worktrees — reuse.

#### remove-worktree

```bash
SCRIPT=$(skill_script emporix-worktree-cleanup remove-worktree.sh)
sh "$SCRIPT" --root . --key {KEY}
```

Never the primary worktree. Used by `/emporix-worktree-cleanup`.

#### review-pr
```bash
gh pr review {prNumber} --approve --body "<body>"
gh pr review {prNumber} --request-changes --body "<body>"
```
GitHub rejects self-approval; surface that instead of working around it.

#### merge-pr
```bash
gh pr merge {prNumber} --squash
```

#### mark-pr-ready
```bash
gh pr ready {prNumber}
```

#### get-pr-checks
```bash
gh pr checks {prNumber} --json name,state,link
```

#### get-required-checks
```bash
gh api repos/{owner}/{repo}/branches/{baseRefName}/protection/required_status_checks --jq '.contexts[]' 2>/dev/null
```

#### get-pr-comment / get-review-comment
```bash
gh api repos/{owner}/{repo}/issues/comments/{commentId} --jq '{body,user:.user.login,url:.html_url}'
gh api repos/{owner}/{repo}/pulls/comments/{commentId} --jq '{body,user:.user.login,url:.html_url}'
```

#### list-review-comments
```bash
gh api --paginate repos/{owner}/{repo}/pulls/{prNumber}/comments \
  --jq '.[] | {id,user:.user.login,path,line:(.line // .original_line),inReplyToId:.in_reply_to_id,pullRequestReviewId:.pull_request_review_id,createdAt:.created_at,body,url:.html_url}'
```

#### list-reviews
```bash
gh api --paginate repos/{owner}/{repo}/pulls/{prNumber}/reviews \
  --jq '.[] | {id,author:.user.login,state,body,submittedAt:.submitted_at,commitId:.commit_id}'
```

#### reply-review-comment
```bash
gh api -X POST "repos/{owner}/{repo}/pulls/{prNumber}/comments" \
  -f body="<markdown>" -F in_reply_to={commentId}
```

#### list-review-threads

GraphQL thread `id` is required to resolve. Match a REST comment `id` to
`comments.nodes[].databaseId`.

```bash
OWNER=$(gh repo view --json owner --jq .owner.login)
REPO=$(gh repo view --json name --jq .name)
gh api graphql -F owner="$OWNER" -F name="$REPO" -F number={prNumber} -f query='
query($owner:String!,$name:String!,$number:Int!){
  repository(owner:$owner,name:$name){
    pullRequest(number:$number){
      reviewThreads(first:100){
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          comments(first:50){ nodes { databaseId createdAt pullRequestReview { databaseId } } }
        }
      }
    }
  }
}'
```

If `hasNextPage`, fetch the next page with `$cursor`. Skip threads that are
already `isResolved`. Conversation (issue) comments have no thread — they
cannot be resolved.

#### resolve-review-thread

After **reply-review-comment** on that thread. `{threadId}` is the GraphQL
`id` from **list-review-threads**, not the REST comment id.

```bash
gh api graphql -f threadId='{threadId}' -f query='
mutation($threadId:ID!){
  resolveReviewThread(input:{threadId:$threadId}){
    thread { id isResolved }
  }
}'
```

Needs `repo` scope. If GitHub rejects (permissions or outdated thread), leave
the reply and report `Resolve failed` — do not fail the whole run. Do not
unresolve. Conversation comments cannot be resolved; reply only.

### CI runs

#### list-runs
```bash
gh run list --branch {branch} --limit 20 --json databaseId,workflowName,name,status,conclusion,headSha,url,createdAt
```

#### get-run
```bash
gh run view {runId} --json status,conclusion,workflowName,headSha,url,jobs
```

#### get-run-failed-logs
```bash
gh run view {runId} --log-failed
```

#### rerun-failed
```bash
gh run rerun {runId} --failed
```

#### watch-run
```bash
gh run watch {runId} --exit-status
```

### Labels

#### list-labels
```bash
gh api --paginate repos/{owner}/{repo}/labels --jq '.[].name'
```

#### create-label
```bash
gh label create <name> --color <hex> --description "<description>"
```
Never delete, rename, or recolor existing labels.

#### ensure-label-taxonomy
Not used. This collection has no label taxonomy yet. Do not create labels during setup.
