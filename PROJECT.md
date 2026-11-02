# Management Dashboard Extensions

Management Dashboard extensions, one Vite app per top-level folder, loaded by the host as module-federation remotes. Operators use them for brands, orders, returns, products, customer groups, users and groups, statistics, the home dashboard, agentic AI, and Algolia synonyms. Source: `README.md`, `docs/MIGRATED_MODULES.md`.

Platform context (callers, deployment, cross-service conventions): ask Emporix
AI Buddy `get_service_context` with `service: "Management Dashboard Extensions"`. This repository's own
knowledge is below; open only what the task needs.

## Knowledge files

| File | What it answers | Last scanned |
|---|---|---|
| `ai-project-knowledge/domain.md` | Per-remote vocabulary and the host `AppState` fields | `da99643` 2026-11-02 |
| `ai-project-knowledge/ui.md` | Federation expose, standalone boot, dev ports | `da99643` 2026-11-02 |
| `ai-project-knowledge/integrations.md` | Emporix, Algolia, Slack, Teams, Cloudinary calls | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/agentic-ai.md` | Agents, tools, tokens, OAuth, MCP, logs | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/algolia-synonyms.md` | Synonym types and the Algolia index screen | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/brands.md` | Brand list and edit | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/customer-groups.md` | IAM groups with `userType: CUSTOMER` | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/dashboard.md` | Operator home widgets and layout | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/orders.md` | Order list, detail, status, payment | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/products.md` | Product list and edit | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/returns.md` | Return list and operator actions | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/statistics.md` | Tenant usage charts | `da99643` 2026-11-02 |
| `ai-project-knowledge/modules/users-and-groups.md` | Employee users and their IAM groups | `da99643` 2026-11-02 |

## Not yet scanned

- HTTP paths inside `@emporix/api-calls` (`node_modules` was skipped).
- `agentic-ai` chat rich content, MCP zip parsing, and test bodies (file budget).
- `products` mixin widgets and several API client bodies; `orders` mixin widgets and shared chrome.
- `docs/` beyond the files cited in `domain.md` and `ui.md`.
- i18n catalogs and styles in every extension.

Run `/emporix-setup --rescan <module>` to fill one of these.

## Maintenance

Update the matching file in the same PR when a change alters business rules,
data model, API, UI behaviour, or integrations. Refresh everything with
`/emporix-setup --rescan`.
