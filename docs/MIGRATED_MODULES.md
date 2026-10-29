# Migrated MD modules registry

Living list of Management Dashboard modules extracted into `md-extensions` under the **module-migration playbook** (COP-5597).

**Update this file after every new migration** (Phase 7 / cleanup). Also refresh [REUSABLE_FROM_USERS_AND_GROUPS.md](./REUSABLE_FROM_USERS_AND_GROUPS.md) when Tier 1 inventory changes, and append playbook decisions-log rows.

**Related:** [MODULE_MIGRATION_PLAYBOOK.md](./MODULE_MIGRATION_PLAYBOOK.md) · [CL_WIDGET_STATUS.md](./CL_WIDGET_STATUS.md) (PrimeReact → CL lookup) · skill `md-module-extraction`

## How agents should use this

1. **Do not depend on U&G alone.** Before copying shared UI / providers / hooks, check **all** playbook-aligned remotes below (newest first when they diverge).
2. Prefer **CL exports** when available — look up each MD `primereact` import in [CL_WIDGET_STATUS.md](./CL_WIDGET_STATUS.md). Otherwise take the best copy from a migrated remote and **ask** about promoting to CL (playbook §5).
3. Legacy folders may exist in the repo but are **not** Tier 1 SoT unless listed here as playbook-aligned.
4. After finishing a migration, add a row to the table and note reusable deltas (new shared shells, CL bumps, ports, Mode A/B).

## Playbook-aligned remotes (Tier 1 sources)

| Folder | Federation `name` | Ticket | Mode | Local port | CL pin (at migrate) | Notes / reusable deltas |
|--------|-------------------|--------|------|------------|---------------------|-------------------------|
| `users-and-groups` | `usersAndGroups` | COP-5598 | A (post-cleanup; was B) | `5173` | ≥ 2.2.0 | Original pilot. Full employee users + groups. Tier 1 shared UI / providers / hooks originated here. |
| `customer-groups` | `customerGroups` | COP-6096 | A | `5174` | `2.4.2` (migrate pinned ≥2.2.0) | Derived from U&G (customer groups only). Company field (`b2b.legalEntityId`); CL ConfirmBox/BackButton/DateValue/ProgressSpinner direct imports; `vite --mode dev`. Expose ships named+default `RemoteComponent` so MD `return module.default` works (2026-08-07). |
| `brands` | `brands` | COP-6180 | A | `5175` | `2.6.0` | Green-field from template. First remote to import CL `SectionBox` instead of copying it, and first to need CL `Editor` / `FileUpload` / `ProgressBar` (added in 2.4.0 — see below). Ports `TableExtensions` (column visibility, `ext_brands`) with local `SidePanel` + CL `InputSwitch` (matching MD/returns). Columns trigger uses CL `SecondaryButton` `size="small"` `iconOnly` (2.6.0). Media tab (`AssetsViewer`, `MediaAssetUpload`) opens the host's `/media-assets/:id` via `window.location.assign` — no in-remote route exists for it. |
| `returns` | `returns` | COP-6256 | A | `5176` | `2.9.2` | Green-field from MD `src/modules/returns`. First remote to port the **mixins subsystem** (form tabs + mixin table columns) and the first to need CL `InputSwitch` / `MoneyValue` / `StatusBadge` and `Tabs` `disabled` + `keepMounted` (added in 2.5.0 — see below). Columns toolbar uses CL `SecondaryButton` `size="small"` `iconOnly` (2.6.0). Date table filters and mixin date/datetime fields use CL `Calendar` (2.7.0). Forms prefer CL built-in `label`/`error` (no lean `InputField`). Tier 1 taken from `brands` (+ shared shells from `customer-groups`). |
| `orders` | `orders` | COP-6917 | A | `5177` | `2.13.2` | Green-field from MD `src/modules/orders` (+ `router/Orders.routes.tsx`). Largest port so far: list (lazy table, row expansion, `ext_orders` column visibility + mixin columns, CSV export, master/sub-order dialog, site restrictions), detail (status, current + **legacy** data/entries views, payment tab, order + entry mixins, audit log). First remote to need CL `InputNumber` / `Skeleton` / `Chip` (promoted in 2.11.0). MD `RestrictionsProvider` ported as `useOrderRestrictions()` over remote `PermissionsProvider.userScopes`. Legacy MD key `order` (`/apps/management/order/*`) redirects host-side. Tier 1 from `returns`, audit log from `customer-groups`. |
| `products` | `products` | COP-6993 | A | `5178` | `2.13.2` | Replaces the legacy `emporix-product-module` remote in the same folder (re-scaffolded from the template). Green-field from MD `components/products` + `modules/Products.module.tsx`: list (lazy table, `ext_products` + mixin columns, list ↔ category-tree view, batch delete + dynamic-variant recalculation, create dialog, mocked CSV import), create/edit (general + AI assistant, categories, classifications, prices + tax, availability (+ availability mixins), bundle, media, linked, attributes/variants, dynamic-variant hierarchy, product mixins, audit log). First remote with the **full MD mixins subsystem** (site-aware mixins, classification accordion, arrays/objects, localized, reference fields via `ReferenceSelector` for 10 entity types) and the first to need CL `Tree` (promoted in 2.12.0). Tier 1 from `orders` (+ media from `brands`). Legacy MD keys `productsEdit` / `productsAdd` redirect host-side (`ProductsPathRedirect`). |

**Next free local port:** `5179` (update when claiming).

### Deltas worth reusing from `brands` (COP-6180)

- **CL 2.4.0 adds `Editor`, `FileUpload`, `ProgressBar`** (Pattern B). Any remote needing rich text or media upload should import these rather than adding `primereact` — that is what kept `brands` PrimeReact-free.
- **`SectionBox` is a CL export since 2.3.0.** Do not copy `components/shared/SectionBox.tsx` into new remotes.
- **`quill` must be 1.x.** PrimeReact 8's Editor calls `clipboard.convert(htmlString)`, which is Quill 1 API; with Quill 2 the editor silently fails to load existing content. CL pins `quill@^1.3.7`. `management-dashboard` still ships the broken pairing (quill 2.0.3 + primereact 8.7.0).
- **`ConfigurationProvider` table-config surface.** `brands` extends it with `tableConfigurations` / `fetchTableConfiguration` / `fetchVisibleColumns` / `updateTableConfiguration`; `fetchBasicConfiguration` already returned `tableConfigurations`, it just was not exposed. Copy from `brands` if the next module needs column visibility.
- **Widget gaps at migrate time** (historical): no `Sidebar`, no `InputSwitch`, `Checkbox` has no `label`. **Current lookup:** [CL_WIDGET_STATUS.md](./CL_WIDGET_STATUS.md). CL 2.5.0 added `InputSwitch` (brands `TableExtensions` now uses it + local `SidePanel`); CL 2.6.0 added `SecondaryButton` `size="small"` + `iconOnly` for MD `p-button-secondary-small p-button-icon-only` toolbar triggers — use those instead of local overrides.

### Deltas worth reusing from `returns` (COP-6256)

- **CL 2.5.0 adds `InputSwitch`, `MoneyValue`, `StatusBadge`, and `Tabs` `disabled` / `keepMounted`.** `TableExtensions` should use CL `InputSwitch` + local `SidePanel` (matching MD). Multi-step wizards should use `Tabs` + `keepMounted` instead of reimplementing panel persistence — it is the equivalent of PrimeReact `renderActiveOnly={false}`.
- **CL 2.6.0 adds `SecondaryButton` `size="small"` + `iconOnly`.** Use for MD `p-button-secondary-small p-button-icon-only` toolbar triggers (e.g. Columns); do not restyle via local SCSS.
- **CL 2.7.0 adds `Calendar`.** Use it for table column date filters (`DateFilterTemplate`) and mixin/form date fields. Overlay styles are encapsulated in CL via `panelClassName` so the popup is not clipped by table overflow. Do not fall back to native `<input type="date">` when Calendar is available.
- **The mixins subsystem is portable.** `returns/src/components/mixins/` (helpers, `useMixinsForm`, `MixinsForm`, `MixinsFormInput`, `MixinsSectionBox`) is a CL-only rewrite of the `products` remote's copy; `MixinColumns` / `SelectedMixinRow` / `AddCustomMixinDialog` under `components/shared/` add the mixin-as-table-column feature. Take these from `returns`, not `products` (which still imports `primereact`).
- **`ConfigurationProvider` gained `getTableMixinColumns`**, and `TableExtensions` gained `tableColumnHeaders` + `schemaType`. Copy from `returns` when a table needs mixin columns.
- **`@emporix/api-calls` already exports schema and mixin calls** (`getSchemasCall`, `getSchemaCall`, `getReferencesCall`, `getReferenceCall`, `getMixinsSchemaCall`) — no local axios client is needed for mixins, unlike the `products` remote.
- **Remaining widget gaps** are not listed here (they go stale). Lookup: [CL_WIDGET_STATUS.md](./CL_WIDGET_STATUS.md). `returns` still substitutes native `<input type="number|time">` through CL `InputText` for `InputNumber` / `InputMask`, and an explicit “All” option for Dropdown `showClear`.

### Deltas worth reusing from `orders` (COP-6917)

- **CL 2.11.0 adds `InputNumber` (Pattern B), `Skeleton` and `Chip` (Pattern A).** `InputNumber` carries MD's 24px blue steppers (`showButtons` + `buttonLayout="horizontal"`), `prefix`, fraction digits and `mode="currency"` — use it instead of the `InputText type="number"` substitute wherever MD had steppers or a currency prefix. For entry-quantity steppers prefer `QuantityStepper` (CL ≥ 2.12.0): native circular buttons that host `.p-button` chrome cannot restyle, so no local stepper SCSS override is needed (orders switched in 2.13.2).
- **`useOrderRestrictions()` / `helpers/restrictions.ts`** port MD `RestrictionsProvider` scope parsing without an eighth provider; reuse the helper for quote/customer/company/cart restrictions.
- **`components/shared/LabeledValue`** replaces MD `InputField` wrapping read-only text (CL `FieldLabel` + value). **`LinkWithIcon`** takes `to` (in-remote) or `hostHref` (host route via `window.location.assign`). **`NumberFilterTemplate`** (`=`/`>`/`<` + CL `InputNumber`) and **`SitesSelect`** (CL Dropdown + "All sites") are reusable.
- **`MixinsForm` / `useMixinsForm` gained `onDirtyChange` / `onFormDirtyChange`** so expansion rows can confirm before discarding unsaved mixin edits.
- **Audit-log SCSS from `customer-groups` used MD CSS variables with fallbacks** (`var(--grey-5, #828a99)`); `orders` strips them to the fallback values. `customer-groups` / `users-and-groups` still carry the leak.
- **CL gaps that remain:** no accordion variant of the mixins form (entry mixins render one `MixinsForm` per schema), no `InputMask` (time → `InputText type="time"`), Prime-style severity `Badge` (→ `StatusBadge` colour map); CL `DataTable` always renders the selection column before an `expander` column (MD had expander first).

### Deltas worth reusing from `products` (COP-6993)

- **CL 2.12.0 adds `Tree` (Pattern B)** with its own `TreeNode` / `TreeExpandedKeys` / `TreeSelectionKeys` types — no `primereact/treenode` import needed. Use `borderless` for sidebars.
- **Full MD mixins subsystem** lives in `products/src/components/mixins` (site-aware storage keys + `MixinsSiteContextPanel`, classification accordion forms, `MixinsFormArray` / `MixinsFormBox`, `ReferenceSelector` + `useReferenceSelectorConfig` with lean reference hooks under `hooks/api/`). `useMixinsForm` returns CL `TabItem`s (`mixinsTabs`, `classificationsTab`). Take it from here, not `returns`, when a module needs site-aware or classification mixins or reference fields.
- **`hooks/useUpdateEffect`** compares previous dependency values, so React StrictMode's dev double-effect no longer counts as an update (MD's first-run flag navigated away from the edit page on mount in dev).
- **`SitesProvider`** starts from the host's persisted `currentSite` (localStorage, MD `persistentStore`) when it is valid for the tenant — the remote runs in the host page.
- **`hooks/useTabs`** also resolves numeric `?tab=<index>` (MD wrote indexes) besides tab ids.
- **Products-aware `components/shared/InputField`** (CL `FieldLabel` + "Inherited from parent" hint from `ProductDataProvider`) — products only; other remotes keep using CL built-in labels.

## Not playbook SoT (legacy / other remotes)

These live under `md-extensions/` but should **not** be used as the default scaffold or Tier 1 copy source for new COP-5597 extractions:

| Folder | Why exclude as SoT |
|--------|--------------------|
| `statistics`, `dashboard`, `agentic-ai`, `algolia-synonyms` | Often template-era (`extension` name) or domain-specific; verify before copying patterns |

When in doubt, prefer the newest **playbook-aligned** remote in the table above.

## Post-migration checklist (registry)

After each extraction:

- [ ] Add/update row in **Playbook-aligned remotes**
- [ ] Bump **Next free local port** if a new port was claimed
- [ ] Note reusable deltas (new shared components, CL version, Mode, env var)
- [ ] Update [REUSABLE_FROM_USERS_AND_GROUPS.md](./REUSABLE_FROM_USERS_AND_GROUPS.md) if Tier 1 inventory changed
- [ ] Append playbook decisions log (1–3 rows)
- [ ] If a shared shell was promoted to CL, note it here and remove “copy local” guidance for that shell in REUSABLE
- [ ] If a Prime widget was promoted to CL, move its row in [CL_WIDGET_STATUS.md](./CL_WIDGET_STATUS.md)
