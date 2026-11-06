# Docs change plan

Write this file in the **product** repo. Do not edit documentation until the author approves it.

Path: `{RUN_FOLDER}/{YYYY-MM-DD}-{KEY}-docs-update.md`  
If `{KEY}` is unknown: `{RUN_FOLDER}/{YYYY-MM-DD}-docs-update.md`.

`{RUN_FOLDER}` is `.ai/runs/{TASK_BRANCH}/` from `emporix-setup/references/runs-layout.md` (`--key` when known, `--branch` the product branch, `--create --adopt`). Same folder as the issue plan. Do not write this file directly under `.ai/runs`.

Do not `git add` this file.

## Quality gate (before writing the file)

- Every row’s `workspace` resolved to a real **local** folder already in this Cursor window (`references/mapping.md`). Portal rows require the documentation-portal checkout.
- Every path is under a mapped `docs.targets[].paths` (or the user named a new path in this run). A release-notes row may use `content/release-notes/README.md` when the portal checkout is open and no `release-notes` target exists.
- Create / update / skip is chosen per target, with a one-line why.
- At least one create or update, or the plan is explicitly “no docs change”.
- No invented API fields, UI labels, or screens.
- Every page names the **reader goal** and its **placement** (space, parent section, `SUMMARY.md` position, update / add section / create, and why). Missing → blocking question.
- Every page names its form and why it suits the content, and its links in and out marked same space or other space. A cross-space link has a space ID taken from the registry in `$STANDARDS_ROOT/.style-guide/writing-standards/links.md`.
- The plan describes what the reader does and why, not which views the implementation changed.
- Every diagram is listed with the reason the reader needs it.

Fail → blocking question in the file, `Ready: no`. Do not write pages.

## File to write

```markdown
# Docs plan — {KEY or "unticketed"}

Product branch: {current product branch, or unknown}
Same docs branch: {TASK_BRANCH}

## Change (one paragraph)

{what landed in the product, from the ticket / plan / diff — outcomes, not file lists}

## Targets

| Flavor | Playbook | Workspace | Path | Action | Why |
|---|---|---|---|---|---|
| user-guides | references/playbooks/user-guides.md | emporix-documentation-portal | content/<mapped-space>/… | update | any mapped portal guide, including `content/user-guides/…` and cockpit spaces such as `content/order-intake-guides/` |
| release-notes | references/playbooks/release-notes.md | emporix-documentation-portal | content/release-notes/README.md | create entry | customers should hear about this; not implied by the user guide |
| changelog | references/playbooks/changelog.md | api-references | changelog/README.md | create entry | integrator-visible API change; not a release note |
| tutorials | references/playbooks/tutorials.md | api-references | … | skip | this change is operator-only |

## Pages

### {path}

- Action: create | update
- Audience: …
- Reader goal: who wants to achieve what, what triggers it, what they have at the end
- Placement: space / parent section / `SUMMARY.md` position / sibling pages; update vs add section vs create, and why
- Form: concept | procedure | reference | tutorial | release note | changelog entry, and why
- What the reader must learn (and why they would look for the changed option, button, icon, or dialog window)
- Links needed (planning input, not a link list on the page): in / out; mark each target as same space (relative `.md` path) or other space (app path, space ID `…`)
- Diagram: id from the Diagrams table, or none
- Open questions

## Diagrams

| Diagram id | Type | What it must show and why the reader needs it | Target page |
|---|---|---|---|
| {id or none} | flowchart / sequence / … | … | … |

Created with `references/playbooks/diagrams.md` (branded, validated).

## Screenshots (portal flavors only)

| Shot id | What it must show | Asset path | Check |
|---|---|---|---|
| {id or none} | … | content/<space>/.gitbook/assets/….png | pending / pass / skip |

`--check` must be `pass` before a figure is embedded. Intake is original PNG
paths (not chat paste). Form: `#DDE6EE`, PhotoScape roundness 10 (not 10px),
stroke 2, transparent corners.

## Out of scope

- {mapped targets skipped}
- Product-repo files

## Ship

- Writes are local files in those checkouts (not Buddy)
- Docs repos that will get branch `{branch}` + a PR: {repo slugs}
- Draft PR: yes | no
```

Open the file in the editor. Chat: link to the file, whether questions remain, then approve / change / cancel. Do not paste the plan body into chat.

If every row is skip: say why, `Ready: no`, stop. That is a successful “nothing to document” run, not a failure.
