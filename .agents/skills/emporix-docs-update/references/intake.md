# Intake

Read this at the start. Do not read playbooks, the style guide,
`references/screenshots.md`, or `references/ship.md` in this phase.

## Setup

Follow `references/agentic-setup.md`, then `references/mapping.md` through
**Find the checkout**. Skip the **Style authority** reads in `mapping.md`;
playbooks read those files after approval.

## What changed

Resolve one source, in this order:

1. A pull request the user named (URL or number). `gh pr view` and `gh pr diff`
   for that PR. Use the PR body and the PR diff, not the whole branch history.
2. Otherwise the open pull request for the current product branch, if one exists.
3. Otherwise `git diff` against `$BASE_BRANCH`, plus the Jira key when the
   change is ticket-driven.

`{issue_key}` is optional. Validate it as `ABC-123` when present. Infer it from
the branch or conversation. Ask once if the change is ticket-driven and the key
is still unknown.

Load targets through `references/mapping.md` first. A saved config row whose
flavor is the retired name `business-docs` is treated as `user-guides` for
this run. Then apply `--flavors`. Allowed names: `api-references`,
`changelog`, `tutorials`, `user-guides`, `release-notes`. Unknown name →
stop. Do not accept `business-docs` as a `--flavors` value.

## Workspaces

Load `$DOCS_TARGETS`. Empty → run `emporix-setup` docs questions, reload,
continue. Still empty → stop (`this product publishes no docs`).

Resolve each target to a workspace folder that already exists. Portal flavors
require the documentation-portal checkout (or the mapped portal basename) in
this window. Missing folder → stop and ask to add it. Do not clone.

Release notes do not need their own `docs.targets` row. When the portal
checkout is open, the candidate file is `content/release-notes/README.md`
unless a row with flavor `release-notes` names another file.

## Playbooks on disk

Confirm these files exist inside this skill. Do not read them.

- `references/docs-standards`
- `references/playbooks/` for each flavor in scope
- `references/playbooks/release-notes.md` when the portal checkout is open

Missing file → stop. These ship inside `emporix-docs-update`; do not install a
separate docs skill.

## Stop this phase

Return a short change card: PR or diff source, Jira key if any, mapped targets,
whether the portal checkout is open, and which playbook files exist. Do not scan
mapped pages here. Candidate pages are the next phase.
