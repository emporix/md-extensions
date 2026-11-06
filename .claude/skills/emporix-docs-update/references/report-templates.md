# Reports

## After the plan (hard stop)

```text
Issue: {KEY} (link: {browseUrl})
Plan: .ai/runs/{TASK_BRANCH}/{YYYY-MM-DD}-{KEY}-docs-update.md
Ready: plan
```

`Ready: no` if a workspace is missing or a blocking question remains. Omit `Issue:` when there is no key.

## After write, waiting to ship

```text
Issue: {KEY} (link: {browseUrl})
Branch: {same branch name}
Worktree: {docs basename}-{KEY} path
Pages: {comma-separated paths, with workspace basename}
Ready: review
Next: ship / open the docs PR
```

## After ship

```text
Issue: {KEY} (link: {browseUrl})
Branch: {same branch name}
Worktree: {docs basename}-{KEY} path
Docs PR: {number} (link: {url}) [{owner}/{repo}]
Author: {token-owner login} ({commit author email})
Ready: yes
```

Repeat `Docs PR:` once per docs repo. `Ready: no` if commit, push, or create failed, or if the commit author is an agent.

Omit `Issue:` when no key. Do not emit a product-repo `PR:` line unless you are only citing it as context.
