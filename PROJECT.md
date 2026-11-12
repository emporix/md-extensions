# Management Dashboard Extensions

Management Dashboard extensions, one Vite app per top-level folder, loaded by the host as module-federation remotes. Operators use them for brands, labels, orders, returns, products, customer groups, users and groups, status codes, coupons, companies, units, catalogs, statistics, the home dashboard, agentic AI, and Algolia synonyms. Source: `README.md`, `docs/MIGRATED_MODULES.md`.

Platform context (callers, deployment, cross-service conventions): ask Emporix
AI Buddy `get_service_context` with `service: "Management Dashboard Extensions"`. This repository's own
knowledge is below; open only what the task needs.

## Knowledge files

| File | What it answers | Last scanned |
|---|---|---|
| `ai-project-knowledge/domain.md` | Per-remote vocabulary, the host `AppState` fields, mixins engine, product and return rules | `05d8d1d` 2026-11-06 |
| `ai-project-knowledge/ui.md` | Federation expose, provider order, standalone boot, dev ports, routes | `05d8d1d` 2026-11-06 |
| `ai-project-knowledge/integrations.md` | Emporix (`@emporix/api-calls` and direct HTTP), Algolia, Slack, Teams, Cloudinary calls | `05d8d1d` 2026-11-06 |
| `ai-project-knowledge/modules/agentic-ai.md` | Agents, triggers, LLM config, tools (incl. file generator), MCP, tokens/OAuth, import/export, chat attachments and artifacts, logs | `05d8d1d` 2026-11-06 |
| `ai-project-knowledge/modules/algolia-synonyms.md` | Synonym types and the Algolia index screen | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/brands.md` | Brand list and edit | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/customer-groups.md` | IAM groups with `userType: CUSTOMER` | `05d8d1d` 2026-11-06 |
| `ai-project-knowledge/modules/dashboard.md` | Operator home widgets and layout | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/labels.md` | Label record and overlay positions, list query, add/edit with single-image media, delete, permissions | `05d8d1d` 2026-11-06 |
| `ai-project-knowledge/modules/orders.md` | Order list, detail and status rules, add-entry product picker, mixins, documents, payment and refund, site restrictions | `05d8d1d` 2026-11-06 |
| `ai-project-knowledge/modules/products.md` | ProductsBrowser list and category tree, edit tabs, templates, dynamic-variant inheritance, site-aware and localized mixins, variant overrides, prices | `05d8d1d` 2026-11-06 |
| `ai-project-knowledge/modules/returns.md` | Return list with site filter and restriction, create wizard, detail edit, mixin tabs | `05d8d1d` 2026-11-06 |
| `ai-project-knowledge/modules/status-codes.md` | Status codes (quote reasons): list with client-side filters and sequential delete, add/edit with localized comment and version, permissions, host wiring | `74b6236` 2026-11-06 |
| `ai-project-knowledge/modules/coupons.md` | Coupons: server-side list with `ext_coupons` columns and batch delete, add/edit with discount, validity, audience and vendor restrictions, mixins, audit log, permissions, host wiring | `d8edeb2` 2026-11-06 |
| `ai-project-knowledge/modules/companies.md` | Companies (legal entities): list with column visibility, editor with subsidiaries, locations, approval group, contact assignments, customer groups, mixins and audit log; location, contact and customer-assignment pages; permissions, host wiring | `d8edeb2` 2026-11-09 |
| `ai-project-knowledge/modules/units.md` | Units: lazy list with server filters and parallel delete, add/edit with free-text type, base unit, factor and version, permissions, host wiring | `d8edeb2` 2026-11-07 |
| `ai-project-knowledge/modules/catalogs.md` | Catalogs: lazy sortable list with date filters, `ext_catalogs` columns and parallel delete, add/edit tabs with categories, sites and visibility window, permissions, host wiring | COP-7180 2026-11-12 |
| `ai-project-knowledge/modules/statistics.md` | Tenant usage charts | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/users-and-groups.md` | Employee users and their IAM groups | `05d8d1d` 2026-11-06 |

Modules still at `da99643` had no source changes since that scan.

`agentic-ai/` also has its own nested setup (`agentic-ai/AGENTS.md`, `agentic-ai/PROJECT.md`, `agentic-ai/ai-project-knowledge/`, `agentic-ai/ai-setup.json`) used when an agent works from that folder.

## Not yet scanned

- HTTP paths inside `@emporix/api-calls` (`node_modules` was skipped).
- `agentic-ai` chat rich content, MCP zip parsing, and test bodies (file budget).
- `products` mixin form widgets, secondary `hooks/api` clients, and price form rules; `orders` and `returns` mixin widgets (see each module's `Not yet scanned`).
- `docs/` beyond the files cited in `domain.md` and `ui.md`.
- i18n catalogs and styles in every extension.

Run `/emporix-setup --rescan <module>` to fill one of these.

## Maintenance

Update the matching file in the same PR when a change alters business rules,
data model, API, UI behaviour, or integrations. Refresh everything with
`/emporix-setup --rescan`.
