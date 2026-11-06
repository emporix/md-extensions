# Emporix documentation standards

Index for the snapshot bundled with `emporix-docs-update`. Not a slash command.

The bundled files are a narrowed snapshot of the `docs-standards` repository:
`.style-guide/` and `.cursor/docs-review/` only (excluding `.git/` metadata and
`.DS_Store`).

Define `STANDARDS_ROOT` as `emporix-docs-update`'s `references/docs-standards` directory.

Callers must read the exact relevant files under `STANDARDS_ROOT`; do not restate, summarize, duplicate, or paraphrase their rules.

When a bundled instruction refers to `.style-guide/` or `.cursor/docs-review/`,
resolve it relative to `STANDARDS_ROOT`, not the documentation checkout or
product repository.

## Where to find what

Index only. Read the files for the rules.

| Need | Read under `$STANDARDS_ROOT/.style-guide/` |
|---|---|
| Deciding where content fits, which form, how it aligns with the existing set | `writing-standards/planning-and-structure.md` |
| Reader-focused wording, no quoted UI text, punctuation | `writing-standards/language-and-tone.md` |
| Titles, lists, steps, hints, UI elements | `writing-standards/format-and-structure.md` |
| Terminology and trademarks | `writing-standards/word-choice.md` |
| Same-space and cross-space links, API reference endpoint links, space ID registry | `writing-standards/links.md` |
| Images, captions, screenshots | `visuals/images-and-icons.md` |
| Diagram branding | `visuals/diagrams.md` |
| Release notes, changelog, API reference | `templates/` |

| Need | Read under `$STANDARDS_ROOT/.cursor/docs-review/` |
|---|---|
| Review contract, prompts, sufficiency/task-fit, author guide | companion files used by `references/playbooks/style-review.md` |

## Playbooks (not in this snapshot)

| Need | Read |
|---|---|
| Post-write / manual style self-review | `references/playbooks/style-review.md` |
| Branded, validated Mermaid diagrams | `references/playbooks/diagrams.md` |

After every documentation edit, the style-review playbook is automatically
mandatory. For Mermaid work, use the diagrams playbook; every diagram must be
branded.

## Maintaining the snapshot

The snapshot is refreshed from the `docs-standards` checkout with
`scripts/sync-docs-standards.sh` at the root of the skills repository
(`--check` reports drift). Never edit files under `references/docs-standards`
by hand; change `docs-standards` first and then sync.

Do not fall back to a documentation checkout's vendored copy of these standards.
`emporix-docs-update` must remain self-contained and use only its bundled snapshot.
