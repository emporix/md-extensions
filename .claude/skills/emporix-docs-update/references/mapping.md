# Resolve documentation workspaces

Config lives in the **product** repo. Pages live in **other** git checkouts that are already Cursor workspace folders.

## Load targets

```bash
DOCS_TARGETS=$(jq -c '.docs.targets // []' ai-setup.json)
```

Each element:

| Field | Required | Meaning |
|---|---|---|
| `flavor` | yes | `api-references` \| `changelog` \| `tutorials` \| `user-guides` \| `release-notes` |
| `workspace` | yes | Folder **basename** to match a workspace root |
| `repo` | yes | GitHub `owner/name` for `gh --repo` |
| `paths` | yes | Relative dirs/files this product owns |
| `service` | no | Buddy service slug |
| `notes` | no | Extra hint |

Before `--flavors` and before the unknown-name check, treat a saved `flavor`
of the retired name `business-docs` as `user-guides` for this run. Keep its
`paths`. Do not rewrite the product config. `--flavors user-guides` therefore
keeps that row. Do not accept `business-docs` as a `--flavors` value.
Unknown flavor name after that → stop. `--flavors a,b` then keeps only those
flavors.

## Find the checkout

For each distinct `workspace`:

1. Match a Cursor workspace folder whose basename equals `workspace` (case-sensitive first, then case-insensitive).
2. Confirm it is a git repo and `origin` parses to `repo` (or ask once if the remote slug differs — do not silently retarget).
3. If several folders match, prefer the one whose remote is `repo`.

Not found → **stop**. Tell the user to add that folder to the Cursor workspace (same window as the product repo). The documentation portal is required for `user-guides` and `release-notes`. Tutorials, API references, and the changelog require `api-references`. Do not `git clone`. Do not search the whole disk. Do not fall back to Buddy.

`repo` is for `gh`. Git commands run with that folder as cwd.

## Which targets this change touches

Mapped ≠ automatically edited.

- Start from `$DOCS_TARGETS` (minus `--flavors`).
- Keep a target when the ticket / diff / plan changes behavior that page would describe (API contract → `api-references` + usually `changelog`; a portal guide task → `user-guides`; how-to for integrators → `tutorials`; customer-facing feature, improvement, or deprecation → `release-notes`). A release note is not implied by a user guide or by a changelog entry.
- `release-notes` does not require a `docs.targets` row. When the portal checkout is open, the parent may plan `content/release-notes/README.md`. A `release-notes` row, when present, names the file instead.
- Skip a mapped target when this change does not affect it. Say why in the plan. Do not skip a could-touch flavor before its candidate pages are listed.
- One change may update several targets in more than one repo. That is normal.
- Do not add a new space unless the user names it. Then add the target with `/emporix-setup --set docs.targets=<json array>` (show the resulting edit first).

## Style authority

`emporix-docs-update` owns the bundled voice, templates, review, and diagram
instructions. Set `STANDARDS_ROOT` to its `references/docs-standards`
directory. Do not read these files during intake or classification. The
dispatched playbook reads the bundled sources it needs, plus a neighbouring
published page:

| Workspace kind | Read first |
|---|---|
| Portal (`content/*/SUMMARY.md`) | `$STANDARDS_ROOT/.style-guide/README.md`, `writing-standards/planning-and-structure.md`, `writing-standards/links.md`, relevant bundled writing/visual standards, and an existing neighbour under the mapped path |
| API references | `$STANDARDS_ROOT/.style-guide/writing-standards/api-references.md` and/or `api-tutorials.md`, `$STANDARDS_ROOT/.style-guide/templates/changelog.md` |
| Release notes | `$STANDARDS_ROOT/.style-guide/templates/release-notes.md`, `links.md`, and the bullet-list section of `format-and-structure.md` |

Do not use the docs checkout's vendored standards, copy standards into the
product repo, or invent a second house style.
