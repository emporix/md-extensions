# Documentation mapping (setup)

Record **which published docs this product owns**. Later `emporix-docs-update` reads this instead of guessing. One service often maps to several flavors and more than one docs repository.

Do not store absolute paths. Machines differ. Store a workspace **folder name**, a GitHub `owner/name`, and paths relative to that folder.

## Flavors

| Flavor | Audience | Typical workspace | Typical paths |
|---|---|---|---|
| `api-references` | Engineers | `api-references` | service folder with OpenAPI `.yml` |
| `changelog` | Engineers | `api-references` | `changelog/` (current year file + in-progress) |
| `tutorials` | Engineers / implementers | `api-references` | API how-to `.md` files |
| `user-guides` | Portal readers | `emporix-documentation-portal` | any mapped `content/` space, for example `content/user-guides/…` or `content/order-intake-guides/` |

`release-notes` is not a setup question. `emporix-docs-update` may plan `content/release-notes/README.md` when the portal workspace is open, and its release-notes playbook writes that file. Add a `docs.targets` row with flavor `release-notes` only when the user asks to point at a different file.

A product may have **multiple targets of the same flavor** (two portal spaces, or several API paths).

## What to write

`ai-setup.json` → `docs`:

```json
"docs": {
  "targets": [
    {
      "flavor": "user-guides",
      "workspace": "emporix-documentation-portal",
      "repo": "emporix/emporix-documentation-portal",
      "paths": ["content/user-guides/management-dashboard/product-management"]
    },
    {
      "flavor": "api-references",
      "workspace": "api-references",
      "repo": "emporix/api-references",
      "paths": ["orders/order"]
    },
    {
      "flavor": "changelog",
      "workspace": "api-references",
      "repo": "emporix/api-references",
      "paths": ["changelog"]
    }
  ]
}
```

- `flavor` — one of the four values above, or `release-notes` only when the user asks to point at a file other than `content/release-notes/README.md`. A saved `business-docs` row is `user-guides`; keep its paths and do not rewrite the product config.
- `workspace` — Cursor workspace folder **basename** (how the agent finds the checkout).
- `repo` — GitHub `owner/name` for `gh --repo`. Read it from that folder’s `origin`. Do not invent the slug.
- `paths` — relative dirs or files this product owns. Empty `paths` is invalid for a target.
- `service` — optional Buddy service slug when it helps `get_service_context`.
- `notes` — optional one-liner (which SUMMARY section, which OpenAPI file).

Omit the whole `docs` object when this product publishes nothing. An empty `"targets": []` is also allowed — later skills will say so and stop.

Never store tokens or local absolute paths.

## Detect (no deep crawl)

1. **Workspace folders already open** in this Cursor window. Then siblings of the product repo (`../emporix-documentation-portal`, `../api-references`).
2. **Portal** — folder has `content/*/SUMMARY.md` and `.style-guide/`. `repo` from `git remote get-url origin` (expect `emporix/emporix-documentation-portal`).
3. **API references** — folder has `changelog/` and `.style-guide/writing-standards/api-references.md`. `repo` from origin (expect `emporix/api-references`).
4. **Candidate paths** — match the product repo name / `PROJECT.md` title / Buddy service name against:
   - portal: `content/*/SUMMARY.md` titles and first-level folder names only
   - api-references: one level of category folders, then service folder names; `changelog` when API flavor is selected
5. If nothing matches, leave that flavor’s paths for the user. Do not invent a space.

Do not recursively search `content/` or the OpenAPI tree.

## Decide (default mode)

Flavor hint from `app.kind`: `backend` → `api-references` + `changelog` (+ `tutorials` when a matching how-to folder exists); `ui` → `user-guides`; `fullstack` → API-side flavors and `user-guides`. One `user-guides` flavor can own several `content/` paths.

- Docs checkout open **and** a candidate path matches this product → write the target. No question.
- Docs checkout open, no candidate path → ask for the path (one of the few setup questions). The user may answer “none”.
- No docs checkout open → omit `docs`, no question. Report: “no docs mapping — add `emporix-documentation-portal` / `api-references` to the workspace and run `/emporix-setup --set docs.targets=…` or re-run setup”.

`--interactive` confirms every flavor, workspace, and path.

## Docs screenshot helper

When `docs.targets` maps `user-guides` (a saved `business-docs` row counts as `user-guides`), `emporix-docs-update` frames original filesystem screenshots (not chat pastes) with `$SKILLS_ROOT/emporix-docs-update/scripts/polish_screenshot.py` (`--check`, `--self-test`; venv under `.ai/venv/`, created on first use; `#DDE6EE` border, PhotoScape roundness 10, no downscale by default). Nothing is installed by setup beyond offering `.cursor/emporix-docs-inbox/` in `.gitignore`. There are no Cursor Task agents: `emporix-docs-update` is the only documentation command in the collection; its playbooks cover API references, changelog, tutorials, user guides, release notes, diagrams, style review, and API preview.

## `AGENTS.md`

The **Task routing** row “Documentation” points at `ai-setup.json` → `docs.targets`. No separate section.
