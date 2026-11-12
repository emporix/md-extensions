---
title: Docs Standards and Self-Review Guide
---

# Docs Standards and Self-Review Guide

This guide explains how shared documentation standards work across Emporix documentation repositories, how to use the docs self-review flow in Cursor, and how maintainers publish updates.

## Who this is for

| Audience | Read |
|----------|------|
| **Authors** | [For authors](#for-authors) — daily workflow, self-review, `git pull` |
| **Maintainers** | [For maintainers](#for-maintainers) — editing standards, propagating updates |

## Architecture overview

Shared content lives in one source repository:

**[docs-standards](https://github.com/emporix/docs-standards)**

It is vendored into consumer repos via **git subtree**:

| Consumer repo | Shared paths |
|---------------|--------------|
| [api-references](https://github.com/emporix/api-references) | `.style-guide/`, `.cursor/docs-review/`, `.github/skills/` |
| [emporix-documentation-portal](https://github.com/emporix/emporix-documentation-portal) | same |
| [learning-certification](https://github.com/emporix/learning-certification) | same |

Cursor self-review and Mermaid skills live in **[emporix-ai-sdlc-skills](https://github.com/emporix/emporix-ai-sdlc-skills)** (`emporix-docs-style-review`, `emporix-docs-diagrams`, plus `emporix-docs-standards` for a bundled snapshot of the style guide and docs-review prompts). Install with `npx skills add`; they are not vendored via subtree.

```text
docs-standards (source of truth)
    │
    ├── split/style-guide      ──►  .style-guide/
    ├── split/docs-review      ──►  .cursor/docs-review/
    └── split/github-skills    ──►  .github/skills/
                                      └── code-review/

emporix-ai-sdlc-skills (installable Cursor skills)
    ├── emporix-docs-standards   ← snapshot of .style-guide + .cursor/docs-review
    ├── emporix-docs-style-review
    └── emporix-docs-diagrams
```

### What is shared vs local

| Path | Source | Notes |
|------|--------|-------|
| `.style-guide/` | docs-standards | Writing and formatting rules |
| `.cursor/docs-review/` | docs-standards | Self-review prompts and contract |
| `.github/skills/code-review/` | docs-standards | Copilot skill for PR docs review |
| `emporix-docs-style-review` / `emporix-docs-diagrams` | emporix-ai-sdlc-skills | Cursor skills (install; not subtree) |
| `.cursor/rules/` | **local per repo** | Repo-specific Cursor rules (e.g. changelog conventions in api-references) |
| `.github/copilot-docs-review/local-review-checks.md` | **local per repo** | Repo-specific Copilot review checks |
| `.github/copilot-instructions.md` | **local per repo** | Repo-wide Copilot review behavior (copy from `copilot-instructions.template.md`) |
| `.github/instructions/*.instructions.md` | **local per repo** | Path-specific Copilot checklists (copy from `.github/instructions/*.template.md`) |
| `.github/workflows/` and `.github/scripts/` | **docs-standards only** | Site-ops (Ask AI digest). Not a subtree prefix — listed in `scripts/subtree-paths.sh` as never-split. |

**Rule of thumb:** edit shared paths in `docs-standards`. Edit repo-specific paths in the consumer repo. Site-ops workflows stay in `docs-standards` and are never vendored. Edit Cursor docs skills in `emporix-ai-sdlc-skills`.

### How to recognize a subtree path

Subtree folders look like normal files. Check git history:

```bash
git log --oneline -3 -- .style-guide
```

Subtree imports show commits like:

```text
Merge commit '...' as '.style-guide'
Squashed '.style-guide/' content from commit ...
```

---

## For authors

### What you need to do

Authors work in `api-references`, `emporix-documentation-portal`, or `learning-certification`. You do **not** run subtree commands.

1. Install Cursor docs skills once (or update them): `emporix-docs-standards`, `emporix-docs-style-review`, and for diagrams `emporix-docs-diagrams` (+ Mermaid MCP) from [emporix-ai-sdlc-skills](https://github.com/emporix/emporix-ai-sdlc-skills)
2. `git pull` to get the latest shared standards (style guide, docs-review prompts, Copilot skill)
3. Write or update documentation
4. Run docs self-review in Cursor **before** opening a PR
5. Fix remaining issues and open a PR
6. Address GitHub Copilot code review feedback on the PR (style guide + completeness/fit)

### Getting the latest shared standards

```bash
git pull
```

After a standards merge to `master`, CI propagates updates into consumer repos; you receive them on pull. Refresh Cursor skills separately with `npx skills update` (project or global).

### Docs self-review — when to use it

Run self-review **before peer review**, after you have finished a meaningful docs change. Requires the `emporix-docs-style-review` skill (and sibling `emporix-docs-standards`) installed.

**Trigger phrase** (paste into Cursor chat):

```text
Run docs style self-review for my current changes.
```

Similar phrasing also works (for example `run self review on the changes`). Optionally include a task description, acceptance criteria, or a GitHub PR/issue URL in the same chat so the review can check task-fit.

### Self-review flow

One turn: review, apply unambiguous auto-fixes, then report. You Keep or Undo each edit in Cursor. There is no "Reply Yes" gate.

```text
Review (readonly subagent)
  │
  ├─ Scans changed docs against .style-guide/ and sufficiency-and-fit.md
  ├─ Checks task-fit when this chat includes AC, a task description, or a PR/issue URL
  └─ Returns findings (no file writes)
        │
        ▼
Apply (same turn)
  │
  ├─ Applies Auto-fixable: yes findings only
  └─ One edit per fix — Keep or Undo each in Cursor
        │
        ▼
Unified report
  │
  ├─ Applied auto-fixes (what was wrong and what changed)
  ├─ Needs your decision (remaining items)
  └─ Needs more information (when judgment is blocked)
```

#### Report

The report includes:

- **Verdict:** `blocked` | `pass-with-warnings` | `pass` (from remaining items after apply)
- **Ready for peer review:** `yes` | `no`
- **Task context:** none (task-fit skipped) or listed sources
- **Applied auto-fixes** at `path/to/file.md:LINE` with the issue and the change
- **Needs your decision** grouped by severity: `critical`, `major`, `minor`
- **Needs more information** when a source is too thin, a URL could not be fetched, or product confirmation is required

**Readiness rules** (remaining findings after apply):

| Verdict | Ready for peer review? |
|---------|------------------------|
| Any remaining `critical` finding | **No** — fix first |
| Only remaining `major` / `minor` | Yes (with warnings) |
| No remaining findings | Yes |

#### What is applied vs left for you

- `Auto-fixable: yes` items are applied in the same turn (title case, word choice, typos, token placeholders, unambiguous grammar)
- `Auto-fixable: no` items stay for you (structure, missing sections, product judgment, reader sufficiency, task-fit)
- If you want structural rewrites applied, reply to apply the structural suggestions (guided mode; each change still uses Keep/Undo)

#### Author checklist

- [ ] Update docs content
- [ ] Run: `Run docs style self-review for my current changes.` (include AC/task/PR URL in chat when you have them)
- [ ] Read the unified report (note `file:line` references)
- [ ] Keep/Undo each auto-applied edit
- [ ] Fix remaining decision items (and supply more information when asked)
- [ ] Re-run self-review after significant changes
- [ ] Open PR when verdict is `pass` or `pass-with-warnings`

### What self-review checks

- Structure and formatting (headings, sections, hints, lists with lead-in sentences and consistent items)
- Figure captions, diagram branding, and links (same-space paths, cross-space GitBook app paths with the space ID)
- Release note titles in title case
- Tone and clarity
- Grammar and spelling
- Word-choice compliance (see `.style-guide/writing-standards/word-choice.md`)
- Changelog / release-notes template conformance (when relevant) — changelog entries go in `changelog/README.md` with `date="RELEASE_DATE"` placeholders
- API tutorial completeness (when relevant)
- API reference completeness (when relevant) — OpenAPI structure, gerund summaries, scopes on `security`, schema/example quality
- Reader sufficiency (always) — purpose, prerequisites, complete procedures, coverage, understandability, user goal, fit in the documentation set, obvious or quoted UI statements
- Task-fit (when this chat includes a task description, AC, or PR/issue URL) — coverage vs the request, no contradictions with the provided source

### Mermaid diagrams skill

Install **`emporix-docs-diagrams`** from emporix-ai-sdlc-skills (plus Mermaid MCP). It enforces brand colors and styles from the style guide. It is not vendored into docs checkouts.

### Copilot PR docs review

After you open a PR, **GitHub Copilot code review** can apply the shared **code-review** skill from `.github/skills/code-review/`. GitHub looks for that directory name. It checks the same style guide, reader sufficiency, and task-fit as Cursor self-review, plus shared completeness/fit rules and any repo-specific checks in `.github/copilot-docs-review/local-review-checks.md`.

Copilot review runs **after** the PR is open. It does not replace Cursor self-review before peer review.

| | Cursor self-review | Copilot PR review |
|--|-------------------|-------------------|
| When | Before opening PR | After PR is open |
| Location | `emporix-docs-style-review` (skills install) | `.github/skills/code-review/` |
| Output | Unified chat report + same-turn auto-fix | PR review comments |
| Local overlay | `.cursor/rules/` | `.github/copilot-docs-review/local-review-checks.md` and `.github/instructions/*.instructions.md` |

---

## For maintainers

Maintainers edit **docs-standards** and propagate changes to consumer repos.

### Repository layout (docs-standards)

```text
docs-standards/
├── .style-guide/
├── .cursor/
│   └── docs-review/          ← prompts, contract, this guide
├── .github/
│   ├── skills/
│   │   └── code-review/  ← Copilot PR review skill (GitHub-discoverable name)
│   ├── copilot-docs-review/
│   │   └── local-review-checks.template.md  ← template for per-repo review checks
│   ├── copilot-instructions.template.md     ← template for per-repo Copilot instructions
│   └── instructions/                        ← path-specific Copilot checklist templates
│       ├── portal-guides, release-notes, navigation
│       ├── changelog, openapi
├── scripts/
│   ├── bootstrap-subtrees.sh  ← first-time setup
│   ├── refresh-splits.sh      ← regenerate split branches
│   └── update-subtrees.sh     ← pull into consumer repos
└── README.md
```

### Split branches (do not PR these)

After merging to `master`, regenerate export branches:

| Branch | Contents |
|--------|----------|
| `split/style-guide` | `.style-guide/` |
| `split/docs-review` | `.cursor/docs-review/` |
| `split/github-skills` | `.github/skills/` (Copilot PR review skill) |

`split/*` branches are **auto-generated artifacts**. Review changes via PRs to `master` only.

### Publishing an update (standard workflow)

1. Edit docs-standards on a feature branch → PR → merge to `master`.
2. **Propagate subtrees** runs automatically on push to `master` when shared paths change (`.style-guide/`, `.cursor/docs-review/`, `.github/skills/`). It refreshes `split/*` and pushes subtree updates into api-references, emporix-documentation-portal, and learning-certification.
3. A separate notify workflow refreshes the narrowed snapshot in emporix-ai-sdlc-skills (opens a PR there).
4. Authors in consumer repos receive the vendored update on their next `git pull`; refresh installed Cursor skills with `npx skills update`.

**One-time setup** (required before CI can publish): follow the header comments in [propagate-subtrees.yaml](https://github.com/emporix/docs-standards/blob/master/.github/workflows/propagate-subtrees.yaml) — set secret `SUBTREE_PROPAGATE_TOKEN`, allow force-push on `split/*` (or leave those branches unprotected), and ensure consumer default-branch protection allows the PAT identity to push.

Manual catch-up or dry-run (optional):

```bash
cd ~/emporix/docs-standards
./scripts/refresh-splits.sh --dry-run
./scripts/update-subtrees.sh --dry-run

./scripts/refresh-splits.sh --yes
./scripts/update-subtrees.sh --yes
# Or one repo at a time:
./scripts/update-subtrees.sh --yes --repo api-references
./scripts/update-subtrees.sh --yes --repo emporix-documentation-portal
./scripts/update-subtrees.sh --yes --repo learning-certification
```

You can also run **Actions → Propagate subtrees → Run workflow** for a full catch-up without a shared-path commit.

### What each script does

| Script | When to use |
|--------|-------------|
| `bootstrap-subtrees.sh` | First-time setup only (new consumer repo) |
| `refresh-splits.sh` | CI after merge to `master`; locally for dry-run or emergency catch-up |
| `update-subtrees.sh` | CI after `refresh-splits`; locally for dry-run or emergency catch-up |

Dry-run any script first:

```bash
./scripts/refresh-splits.sh --dry-run
./scripts/update-subtrees.sh --dry-run --repo api-references
```

### First-time subtree setup (new consumer repo)

Remove existing local copies first, then add:

```bash
git remote add docs-standards https://github.com/emporix/docs-standards.git
git fetch docs-standards

git subtree add --prefix=.style-guide docs-standards split/style-guide --squash
git subtree add --prefix=.cursor/docs-review docs-standards split/docs-review --squash
git subtree add --prefix=.github/skills docs-standards split/github-skills --squash
```

Or use `./scripts/bootstrap-subtrees.sh` from `docs-standards`. If the retired vendored skills remain, remove only those folders (`git rm -r .cursor/skills/docs-style-review-subagent .cursor/skills/mermaid-brand-diagrams`); leave any other `.cursor/skills/` content alone. Cursor self-review and Mermaid now come from emporix-ai-sdlc-skills.

### Contribution rules

1. **Never edit shared paths directly in consumer repos** — changes will be overwritten on the next subtree pull.
2. Edit in `docs-standards` and merge to `master`. CI runs `refresh-splits.sh` + `update-subtrees.sh`; use the scripts locally only for dry-run or emergency catch-up.
3. Edit Cursor Mermaid / style-review skills in `emporix-ai-sdlc-skills`, not in docs-standards.
4. Repo-specific Cursor rules (`.cursor/rules/`) stay in each consumer repo.
5. Repo-specific Copilot review checks (`.github/copilot-docs-review/local-review-checks.md`) stay in each consumer repo. Use [local-review-checks.template.md](../../.github/copilot-docs-review/local-review-checks.template.md) as the starting point.
6. Do not commit directly to `split/*` branches.

### Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `can't squash-merge: was never added` | Trying `subtree pull` before first `subtree add` | Run `subtree add` once; `update-subtrees.sh` does this automatically |
| Consumer repo differs from docs-standards | Local edits to shared paths | Revert local edits; pull from docs-standards |
| Self-review not triggered | Skill not installed | Install `emporix-docs-style-review` and `emporix-docs-standards` from emporix-ai-sdlc-skills |
| Copilot review ignores style guide | Skill not in consumer repo | Confirm `.github/skills/code-review/SKILL.md` exists; run `update-subtrees.sh` |
| Copilot prompts to create a review skill | Folder is not named `code-review` | Skill must live at `.github/skills/code-review/SKILL.md` (not `copilot-docs-code-review`) |

### Verifying sync

```bash
# Content parity
diff -qr ~/emporix/docs-standards/.style-guide ~/emporix/api-references/.style-guide
diff -qr ~/emporix/docs-standards/.cursor/docs-review ~/emporix/api-references/.cursor/docs-review
diff -qr ~/emporix/docs-standards/.github/skills ~/emporix/api-references/.github/skills

# Subtree pull health
cd ~/emporix/api-references
git fetch docs-standards
git subtree pull --prefix=.style-guide docs-standards split/style-guide --squash
# Expected: "Subtree is already at commit ..."
```

---

## Related files

| File | Purpose |
|------|---------|
| [workflow.md](workflow.md) | Self-review flow details |
| [review-contract.md](review-contract.md) | Output contract for review, apply, and unified report |
| [subagent-prompt.md](subagent-prompt.md) | Readonly subagent instructions |
| [fix-prompt.md](fix-prompt.md) | Same-turn auto-fix instructions |
| [sufficiency-and-fit.md](sufficiency-and-fit.md) | Reader sufficiency and optional task-fit checks |
| [emporix-docs-style-review](https://github.com/emporix/emporix-ai-sdlc-skills) | Cursor skill entry point (skills repo) |
| [../../.github/skills/code-review/SKILL.md](../../.github/skills/code-review/SKILL.md) | Copilot PR review skill |
| [../../.github/copilot-docs-review/local-review-checks.template.md](../../.github/copilot-docs-review/local-review-checks.template.md) | Template for per-repo Copilot review checks |
| [../../.github/instructions/](../../.github/instructions/) | Path-specific Copilot checklist templates (portal, release notes, navigation, changelog, OpenAPI) |

## Copilot skill rollout

Roll out the Copilot PR review skill to consumer repos after merging skill changes to `master`. CI propagates `.github/skills/` via subtree; then add the local (non-vendored) review checks in each consumer.

### Rollout order

1. **First:** [api-references](https://github.com/emporix/api-references) and [emporix-documentation-portal](https://github.com/emporix/emporix-documentation-portal)
2. **Later:** [learning-certification](https://github.com/emporix/learning-certification) (same subtree path when ready)

### Steps per consumer repo

```bash
# 1) Wait for Propagate subtrees CI (or run update-subtrees.sh --yes locally)

# 2) In each consumer repo: add local review checks (not subtree-managed)
cp .github/copilot-docs-review/local-review-checks.template.md .github/copilot-docs-review/local-review-checks.md
# Edit local-review-checks.md for repo-specific checks (OpenAPI layout, IA, etc.)

# 3) Commit and push the local-review-checks.md in the consumer repo
git add .github/copilot-docs-review/local-review-checks.md
git commit -m "Add local Copilot docs review fit checks"
git push

# 4) Verify on a docs PR that Copilot code review picks up the skill
```

The shared skill at `.github/skills/code-review/` is vendored via subtree. After a subtree pull that renames the skill, update the local `.github/copilot-instructions.md` path to `.github/skills/code-review/` if it still points at the old folder name. Only `.github/copilot-docs-review/local-review-checks.md` and `.github/instructions/*.instructions.md` are maintained locally in each consumer repo.

For learning-certification, repeat the same local-checks steps when ready.

## Planned: automatic review-only trigger

Not active yet. A future Cursor stop hook may auto-run a **review-only** self-review when docs files change. Hooks must not apply file edits. See [workflow.md](workflow.md).
