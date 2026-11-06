# Agent tooling placement (MD ↔ md-extensions)

Keep Cursor / Copilot / Claude mirrors in sync whenever you edit migration rules or the extraction skill.

| Concern | Cursor | Copilot | Claude Code |
|---------|--------|---------|-------------|
| Extraction skill + reference | `.cursor/skills/md-module-extraction/` | `.github/skills/md-module-extraction/` | `.claude/skills/md-module-extraction/` |
| Remote migration rule | `.cursor/rules/md-extension-migration.mdc` | `.github/instructions/md-extension-migration.instructions.md` | `.claude/rules/md-extension-migration.md` |
| Port validation rule | `.cursor/rules/md-extension-port-validation.mdc` | `.github/instructions/md-extension-port-validation.instructions.md` | `.claude/rules/md-extension-port-validation.md` |
| Validation hooks | `.cursor/hooks.json` + `.cursor/hooks/` | — | — |
| Playbook + registry + Tier 1 | `docs/MODULE_MIGRATION_PLAYBOOK.md`, `docs/MIGRATED_MODULES.md`, `docs/REUSABLE_FROM_USERS_AND_GROUPS.md` (shared markdown — all agents) | same | same |
| Host wiring | **`management-dashboard`** `.cursor/rules/federated-module-wiring.mdc` | `.github/instructions/federated-module-wiring.instructions.md` | `.claude/rules/federated-module-wiring.md` |
| MD discovery skill (pointer) | `management-dashboard/.cursor/skills/md-module-extraction/` | `.github/skills/…` | `.claude/skills/…` |

These root files are the only copies in this repository. Remotes no longer sync rules from **`frontend-ai-rules`**; generic frontend rules come from the global `emporix-frontend-standards` skill (see `AGENTS.md`, which Cursor and Copilot read directly and Claude Code reads through `CLAUDE.md`). **`md-module-template`** still ships the old sync, so strip it when scaffolding (`md-extension-migration` § Agent rules).

**Pilots:** see `docs/MIGRATED_MODULES.md` (`users-and-groups`, `customer-groups`, …).

Do not duplicate host wiring rules in this repo. When editing the extraction skill, update all three skill roots (and `~/.cursor/skills/md-module-extraction/` if used locally).
