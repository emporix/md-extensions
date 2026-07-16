# Agent tooling placement (MD ↔ md-extensions)

| Concern | Location |
|---------|----------|
| End-to-end extraction skill + reference | `.cursor/skills/md-module-extraction/` (**canonical**) |
| Remote rules (federation, AppState, CL, validation) | `.cursor/rules/md-extension-migration.mdc`, `md-extension-port-validation.mdc` |
| Validation hooks | `.cursor/hooks.json` + `.cursor/hooks/` |
| Playbook + Tier 1 copy inventory | `docs/MODULE_MIGRATION_PLAYBOOK.md`, `docs/REUSABLE_FROM_USERS_AND_GROUPS.md` |
| Host wiring (Mode A/B, env, cleanup) | **`management-dashboard`** `.cursor/rules/federated-module-wiring.mdc` (+ Copilot/Claude mirrors) |
| MD discovery skill (pointer only) | `management-dashboard/.cursor/skills/md-module-extraction/` |

Do not duplicate host wiring rules in this repo. Keep `~/.cursor/skills/md-module-extraction/` in sync with this canonical skill when editing.
