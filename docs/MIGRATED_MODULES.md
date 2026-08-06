# Migrated MD modules registry

Living list of Management Dashboard modules extracted into `md-extensions` under the **module-migration playbook** (COP-5597).

**Update this file after every new migration** (Phase 7 / cleanup). Also refresh [REUSABLE_FROM_USERS_AND_GROUPS.md](./REUSABLE_FROM_USERS_AND_GROUPS.md) when Tier 1 inventory changes, and append playbook decisions-log rows.

**Related:** [MODULE_MIGRATION_PLAYBOOK.md](./MODULE_MIGRATION_PLAYBOOK.md) · skill `md-module-extraction`

## How agents should use this

1. **Do not depend on U&G alone.** Before copying shared UI / providers / hooks, check **all** playbook-aligned remotes below (newest first when they diverge).
2. Prefer **CL exports** when available; otherwise take the best copy from a migrated remote and **ask** about promoting to CL (playbook §5).
3. `products` and other legacy folders may exist in the repo but are **not** Tier 1 SoT unless listed here as playbook-aligned.
4. After finishing a migration, add a row to the table and note reusable deltas (new shared shells, CL bumps, ports, Mode A/B).

## Playbook-aligned remotes (Tier 1 sources)

| Folder | Federation `name` | Ticket | Mode | Local port | CL pin (at migrate) | Notes / reusable deltas |
|--------|-------------------|--------|------|------------|---------------------|-------------------------|
| `users-and-groups` | `usersAndGroups` | COP-5598 | A (post-cleanup; was B) | `5173` | ≥ 2.2.0 | Original pilot. Full employee users + groups. Tier 1 shared UI / providers / hooks originated here. |
| `customer-groups` | `customerGroups` | COP-6096 | A | `5174` | `2.2.0` | Derived from U&G (customer groups only). Company field (`b2b.legalEntityId`); CL ConfirmBox/BackButton/DateValue/ProgressSpinner direct imports; `vite --mode dev`. |

**Next free local port:** `5175` (update when claiming).

## Not playbook SoT (legacy / other remotes)

These live under `md-extensions/` but should **not** be used as the default scaffold or Tier 1 copy source for new COP-5597 extractions:

| Folder | Why exclude as SoT |
|--------|--------------------|
| `products` | Older AppState / permissions patterns; may still differ from U&G contract |
| `statistics`, `dashboard`, `agentic-ai`, `algolia-synonyms`, `site-settings` | Often template-era (`extension` name) or domain-specific; verify before copying patterns |

When in doubt, prefer the newest **playbook-aligned** remote in the table above.

## Post-migration checklist (registry)

After each extraction:

- [ ] Add/update row in **Playbook-aligned remotes**
- [ ] Bump **Next free local port** if a new port was claimed
- [ ] Note reusable deltas (new shared components, CL version, Mode, env var)
- [ ] Update [REUSABLE_FROM_USERS_AND_GROUPS.md](./REUSABLE_FROM_USERS_AND_GROUPS.md) if Tier 1 inventory changed
- [ ] Append playbook decisions log (1–3 rows)
- [ ] If a shared shell was promoted to CL, note it here and remove “copy local” guidance for that shell in REUSABLE
