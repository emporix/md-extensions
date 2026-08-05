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
| `customer-groups` | `customerGroups` | COP-6096 | A | `5174` | `2.4.2` (migrate pinned ≥2.2.0) | Derived from U&G (customer groups only). Company field (`b2b.legalEntityId`); CL ConfirmBox/BackButton/DateValue/ProgressSpinner direct imports; `vite --mode dev`. Expose ships named+default `RemoteComponent` so MD `return module.default` works (2026-08-07). |
| `brands` | `brands` | COP-6180 | A | `5175` | `2.4.0` | Green-field from template. First remote to import CL `SectionBox` instead of copying it, and first to need CL `Editor` / `FileUpload` / `ProgressBar` (added in 2.4.0 — see below). Ports `TableExtensions` (column visibility, `ext_brands`) using CL Dialog+Checkbox since CL has no Sidebar/InputSwitch. Media tab (`AssetsViewer`, `MediaAssetUpload`) opens the host's `/media-assets/:id` via `window.location.assign` — no in-remote route exists for it. |

**Next free local port:** `5176` (update when claiming).

### Deltas worth reusing from `brands` (COP-6180)

- **CL 2.4.0 adds `Editor`, `FileUpload`, `ProgressBar`** (Pattern B). Any remote needing rich text or media upload should import these rather than adding `primereact` — that is what kept `brands` PrimeReact-free.
- **`SectionBox` is a CL export since 2.3.0.** Do not copy `components/shared/SectionBox.tsx` into new remotes.
- **`quill` must be 1.x.** PrimeReact 8's Editor calls `clipboard.convert(htmlString)`, which is Quill 1 API; with Quill 2 the editor silently fails to load existing content. CL pins `quill@^1.3.7`. `management-dashboard` still ships the broken pairing (quill 2.0.3 + primereact 8.7.0).
- **`ConfigurationProvider` table-config surface.** `brands` extends it with `tableConfigurations` / `fetchTableConfiguration` / `fetchVisibleColumns` / `updateTableConfiguration`; `fetchBasicConfiguration` already returned `tableConfigurations`, it just was not exposed. Copy from `brands` if the next module needs column visibility.
- **CL gaps found:** no `Sidebar`, no `InputSwitch`, and `Checkbox` has no `label` prop. Consider promoting these if more screens need them.

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
