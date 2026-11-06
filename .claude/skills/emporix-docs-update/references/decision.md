# Documentation decision (the gate)

Decide **whether** this change needs documentation, and if so **which flavors**,
before deciding how. This is the supervisor's own step (readonly). Be concrete:
paths, sections, and shot frames. Do not write pages here.

## Inputs

- Context brief (from the readonly subagent)
- Original user request
- Mapped `docs.targets` (flavor + workspace + paths), limited by `--flavors`
- Resolved docs workspace root(s)

## How to decide

1. Consider **only** mapped targets (further limited by `--flavors`), plus
   release notes when the portal checkout is open. Do not invent a space or
   path setup did not map. Release notes may use `content/release-notes/README.md`
   without a `docs.targets` row, or the path a `release-notes` row names. If
   the change needs a new page, place it under an existing mapped folder and
   name it in kebab-case.
2. For each flavor `references/classify.md` marked could-touch, use the
   candidate pages from the brief. Compare behavior in the brief to what those
   pages say. Do not open flavors the signal pass marked out.
3. **Default to skip.** Keep a flavor only when this change alters something a
   page of that flavor would describe:
   - `api-references` — an API contract changed (endpoint, field, scope, status,
     example). Usually pairs with a `changelog` entry.
   - `changelog` — a released, user-visible API change worth announcing to
     integrators. This is not a release note.
   - `tutorials` — an integrator how-to needs adding or updating.
   - `user-guides` — a portal guide task changed (cockpit, operator, admin, or
     dashboard). The path is the mapped `content/` space, including cockpit
     spaces. Do not move that page under `content/user-guides/`. This is not a
     release note.
   - `release-notes` — customers should hear about a feature, improvement, or
     deprecation. Written later by `references/playbooks/release-notes.md`, after page
     flavors, so Documentation and links can point at those pages.
4. Prefer **updating** an existing page over creating a near-duplicate.
5. **Place the content.** For every kept `user-guides` and `tutorials` page, read
   `$STANDARDS_ROOT/.style-guide/writing-standards/planning-and-structure.md`
   and use the brief's **Documentation structure** and **User goal**. Decide
   where the information fits (update a page, add a section, or create a page),
   where the page sits in `SUMMARY.md`, which form suits it, and how it aligns
   with its neighbours. Plan from the reader's goal and flow, not from the
   views the implementation touched.
   Changelog, API reference, and release-note rows still name reader goal,
   placement, form, and links. Their placement is the existing file (prepend
   for changelog and release notes). Do not run the neighbour-structure pass
   for them.
6. **Plan links.** In the plan, record for each page the links it needs: pages it
   will link to (out) and existing pages that should link to it (in). Mark each
   target as the same space or another space, following
   `$STANDARDS_ROOT/.style-guide/writing-standards/links.md`. Look up space IDs
   in its registry; do not guess an ID. This is planning input only. Do not add
   a list of links to the page itself; place links in the text where the reader
   needs them (release notes keep their `Documentation and links` section).
7. When you skip a mapped flavor, say why in one line.
8. If no confirmed user-facing or contract change exists across every flavor,
   the verdict is **no-docs-change**. Explain and stop.

## Return this plan (into the plan file, see plan.md)

```markdown
# Change plan

## Verdict
create | update | mixed | no-docs-change

## Targets
| Flavor | Playbook | Workspace | Path | Action | Why |
|---|---|---|---|---|---|

## Pages
### [create|update] `{workspace}/{path}`
- Flavor / playbook:
- Why:
- Reader goal: who, what they want to achieve, what triggers it, the outcome (portal flavors and tutorials)
- Placement: space, parent section, `SUMMARY.md` position, sibling pages; update / add section / create, and why
- Sections to add or change:
- SUMMARY.md: add / already listed / n/a
- Depends on screenshots: yes/no
- Page form: concept | procedure (stepper) | reference list | tutorial | OpenAPI | changelog entry | release note, and why
- Links needed (planning input, not a link list on the page): in / out, each marked same space (relative `.md` path) or other space (app path with the registry space ID); an API reference endpoint uses the path-based `developer.emporix.io/api-documentation/…` URL instead
- Style notes: which exact bundled `$STANDARDS_ROOT/.style-guide/` sources the playbook must follow

## Diagrams
| id | Type | What it must show and why the reader needs it | Target page |
|---|---|---|---|
| (or none) | | | |

Every listed diagram is created with `references/playbooks/diagrams.md`. Do not
plan a diagram the reader does not need.

## Screenshot shot list
Author supplies each shot as an original filesystem PNG (Desktop path, `@` file,
or drop) — not a chat paste (chat downscales to ~1024px). Do not ask for a
browser capture.
| id | What the author must show | Suggested asset filename | Target page |
|---|---|---|---|

## Do not write
- Implementation details that do not belong in the target flavor
- Unverified claims from the brief

## Open questions
- Anything a playbook must not guess
```

If verdict is `no-docs-change`, keep Pages and the shot list empty and explain.
Do not approve the plan yourself. The supervisor shows it to the author.
