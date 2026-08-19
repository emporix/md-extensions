# PrimeReact → `@emporix/component-library` widget status

**Audience:** agents extracting an MD module into `md-extensions`.  
**SoT:** this file. Do **not** copy the tables into the skill, playbook, or registry — those files **link here**. Stale gap lists (`no InputSwitch`) have already shipped in those docs.  
**CL version audited:** `2.7.0` (`component-library/src/index.ts`).  
**MD source:** `management-dashboard` `primereact@8.7.0`, unique `src/` files, 2026-08-17.  
**Related:** [MODULE_MIGRATION_PLAYBOOK.md](./MODULE_MIGRATION_PLAYBOOK.md) · skill `md-module-extraction` · CL skill `migrate-to-component-library`.

## How to use (pre-flight)

1. Inventory the MD module:

   ```bash
   rg "from ['\"]primereact" management-dashboard/src/modules/{module}/ \
     management-dashboard/src/components/{feature}/
   ```

2. For each `primereact/{path}`, find that path in **Lookup** below (`status` column).
3. Act on `status`:

   | `status` | Do |
   |----------|----|
   | `in-cl` | Import the **CL export**. Pin at least **Min CL**. Never wrap “for consistency”. |
   | `partial` | Use the listed stand-in. Note API gaps in the PR. Confirm UX diffs with the user. |
   | `missing` | **Stop and ask.** Promote to CL (Pattern A or B — ask) via `migrate-to-component-library`, publish, pin. Native substitutes in the Notes column are allowed only as listed. **Never** add `primereact` / `primeicons` to the remote. |
   | `type` | Not a widget. Use the CL companion type if listed; otherwise declare a local structural type. |

4. After promoting a widget: **move its row** (`missing`/`partial` → `in-cl`), bump **CL version audited**, add a one-line delta in [MIGRATED_MODULES.md](./MIGRATED_MODULES.md), append a playbook decisions-log row.

## Decision rule

Promote **generic** widgets to CL (Calendar, InputSwitch, Editor, …). Substitute only when the widget is **niche** and a substitute is listed here. Function + persisted data shape stay; presentation may differ — confirm with the user. `products` still imports `primereact`; it is **not** playbook SoT.

## Lookup

`MD files` = unique management-dashboard `src/` files importing that path (dedicated `primereact/{path}`; barrel `from 'primereact'` counted only where noted). Use it to prioritize promotions, not as a live grep.

| Prime import | Status | CL export | Min CL | MD files | Notes |
|--------------|--------|-----------|--------|----------|-------|
| `primereact/button` | `in-cl` | `PrimaryButton` / `SecondaryButton` | 1.2.0 | 181 | Toolbar icon buttons: `SecondaryButton` `size="small"` `iconOnly` (2.6.0). Keep `pi pi-*` glyphs. |
| `primereact/column` | `in-cl` | `DataTable` `columns` prop | 1.10.0 | 102 | **No** standalone `Column`. Never nest host `primereact/column` into CL DataTable. Types → `DataTableColumnProps`. |
| `primereact/dropdown` | `in-cl` | `Dropdown` | 1.3.0 | 61 | No `appendTo` / `showClear`. Multi-select since 1.7.0 (`multiple`). Explicit “All” option stands in for `showClear`. |
| `primereact/inputtext` | `in-cl` | `InputText` | 1.4.0 | 60 | Also `textarea` boolean (1.4.1) — prefer this over Prime `InputTextarea` when porting. |
| `primereact/dialog` | `in-cl` | `Dialog` / `ConfirmBox` | 1.10.0 / 2.2.0 | 35 | Confirm flows → `ConfirmBox` (`message` is required). |
| `primereact/tabview` | `in-cl` | `Tabs` / `TabItem` | 2.0.0 | 29 | `disabled` on `TabItem` + `keepMounted` (≡ `renderActiveOnly={false}`) since **2.5.0**. |
| `primereact/calendar` | `in-cl` | `Calendar` | **2.7.0** | 23 | Pattern B. Overlay via `panelClassName` (table filters). Do **not** fall back to `<input type="date">` when Calendar is available. |
| `primereact/inputswitch` | `in-cl` | `InputSwitch` | **2.5.0** | 21 | Use in `TableExtensions` (`brands`, `returns`). |
| `primereact/datatable` | `in-cl` | `DataTable` | 1.10.0 | 19 | `rowActions` prop, not an actions column. Filter APIs + `FilterMatchMode` since 2.0.0. |
| `primereact/checkbox` | `in-cl` | `Checkbox` | 1.10.0 | 14 | **No** `label` prop — render `<label htmlFor>`. |
| `primereact/progressspinner` | `in-cl` | `ProgressSpinner` | 2.0.0 | 11+ | Also imported from barrel. |
| `primereact/tooltip` | `in-cl` | `Tooltip` | 1.8.0 | 11 | Children mode or selector mode. |
| `primereact/radiobutton` | `in-cl` | `RadioButton` | 1.10.0 | 8 | |
| `primereact/message` | `in-cl` | `Message` | 1.10.0 | 7 | |
| `primereact/menu` | `in-cl` | `Menu` | 1.10.0 | 6 | `MenuItem` type re-exported. |
| `primereact/selectbutton` | `in-cl` | `SelectButton` | 1.4.0 | 5 | |
| `primereact/autocomplete` | `in-cl` | `AutoComplete` | 1.10.0 | 2 | |
| `primereact/editor` | `in-cl` | `Editor` | **2.4.0** | 2 | Pin `quill@^1.3.7` (Quill 2 breaks Prime 8 `clipboard.convert`). MD still ships quill 2. |
| `primereact/fileupload` | `in-cl` | `FileUpload` | **2.4.0** | 1+ | |
| `primereact/toast` | `in-cl` | `ToastProvider` / `useToast` | 1.6.2 | 1 | Wrap federated entry once. |
| `primereact/progressbar` | `in-cl` | `ProgressBar` | **2.4.0** | barrel | |
| `primereact/api` (`FilterMatchMode`) | `in-cl` | `FilterMatchMode` | 2.0.0 | 33 | Other `api` helpers (`locale`, `addLocale`) are `type` / host i18n — see below. |
| `primereact/multiselect` | `partial` | `Dropdown` `multiple` | 1.7.0 | 11+ | Not a dedicated MultiSelect. Chip display via `display="chip"`. |
| `primereact/inputtextarea` | `partial` | `InputText` `textarea` | 1.4.1 | 6+ | No separate textarea export. |
| `primereact/badge` | `partial` | `StatusBadge` is **not** a drop-in | 2.5.0 | 6+ | CL `StatusBadge` = outlined status pill (`status` + `color`). Prime `Badge` = notification count badge. Promote Badge if you need the Prime widget. |
| `primereact/inputnumber` | `missing` | — | — | 23 | **Highest-traffic gap.** Documented substitute: `InputText` `type="number"` (value shape unchanged). Promote if the module needs steppers / currency mode / `mode="decimal"`. |
| `primereact/skeleton` | `missing` | — | — | ~15 | Loading placeholders (`TabsLoader`, detail rows). Promote if the module has skeleton screens. |
| `primereact/chips` | `missing` | — | — | 10 | Free-text token input. **Not** Dropdown chip display. |
| `primereact/tree` | `missing` | — | — | 6 | Categories / modules trees. |
| `primereact/tag` | `missing` | — | — | 6 | List status/label chips. Do not silently swap to `StatusBadge` without checking API. |
| `primereact/treetable` | `missing` | — | — | 4 | `EmporixTreeTable`, categories. |
| `primereact/inputmask` | `missing` | — | — | 4 | Documented substitute: `InputText` `type="time"` for `"99:99"` masks. Promote for other masks. |
| `primereact/chip` | `missing` | — | — | 3 | Single chip (display), not `Chips` input. |
| `primereact/divider` | `missing` | — | — | 3 | Form section separators. |
| `primereact/sidebar` | `missing` | — | — | 1 | `TableExtensions.tsx`. Documented substitute: local `SidePanel` (right drawer, 20rem) + CL `InputSwitch`. Copy from `returns` or `brands` `components/shared/SidePanel`. Do not fall back to CL `Dialog` + `Checkbox`. |
| `primereact/paginator` | `missing` | — | — | 1 | Standalone (`EntityChangelogTab`). Table pagination is already on CL `DataTable`. `customer-groups` used custom control + CL `Dropdown`. |
| `primereact/panel` | `missing` | — | — | 1 | `ProductPricesPanelForm.tsx`. CL `SectionBox` may replace layout panels. |
| `primereact/splitbutton` | `missing` | — | — | 1 | `AddNewContactButton.tsx`. |
| `primereact/overlaypanel` | `missing` | — | — | 1 | `JsonPathFilterInput.tsx`. |
| `primereact/chart` | `missing` | — | — | 1 | `WebhooksStatistics.tsx`. Do not add `chart.js` to remote `shared` (playbook §2). |
| `primereact/togglebutton` | `missing` | — | — | 1 | `Language.module.tsx`. |
| `primereact/confirmpopup` | `missing` | — | — | 1 | `FeatureTogglesList.page.tsx`. Prefer CL `ConfirmBox` / `Dialog` unless the popover placement is required. |
| `primereact/image` | `missing` | — | — | 1 | `settings/Card.tsx`. |
| `primereact/password` | `missing` | — | — | 1 | Barrel. `CustomersAddEdit.module.tsx`. |
| `primereact/tristatecheckbox` | `missing` | — | — | 1 | Barrel. `TemplateAttributes.tsx`. |
| `primereact/treenode` | `type` | — | — | 13 | Default `TreeNode` type. Declare locally if you port Tree. |
| `primereact/selectitem` | `type` | — | — | 3 | `SelectItemOptionsType`. Map to CL `DropdownOption[]`. |
| `primereact/tooltip/tooltipoptions` | `type` | `TooltipProps` | 1.8.0 | 3 | |
| `primereact/menuitem` | `type` | `MenuItem` | 1.10.0 | 1 | |
| `primereact/api` (`locale` / `addLocale`) | `type` | — | — | 3 | Host/i18n bootstrap, not a remote widget. |
| `primereact/utils` (`classNames`) | `type` | — | — | 1 | Use the `classnames` package already in remotes. |

Barrel-only extras already covered above: `Skeleton`, `Password`, `TriStateCheckbox`, `ProgressBar`, `FileUpload`, `MultiSelect`.

## CL shells with no Prime import in MD

Import these when the remote needs them; they are not Prime replacements:

| CL export | Min CL | Use |
|-----------|--------|-----|
| `FieldLabel` | 2.1.0 | Shared label + required + tooltip |
| `LocalizedInput` | 2.1.0 | Context-free; remote wraps to inject languages (`LocalizedInput` pattern) |
| `DateValue` | 2.2.0 | Formatted dates — import directly |
| `BackButton` | 2.2.0 | Header back — import directly |
| `ConfirmBox` | 2.2.0 | Confirm dialog — import directly |
| `SectionBox` / `SectionTitle` | 2.3.0 | Do **not** copy local `SectionBox` |
| `Accordion` / `AccordionTab` | 1.5.0 | MD does not import `primereact/accordion` |
| `MoneyValue` | 2.5.0 | Locale-aware currency display |
| `StatusBadge` | 2.5.0 | Outlined status pill — not Prime `Badge`/`Tag` |

## Promote-next (if the module needs them)

Order by MD usage. Ask the user before implementing; Pattern A vs B is mandatory in `migrate-to-component-library`.

1. `InputNumber` (23)
2. `Skeleton` (~15)
3. `Chips` (10)
4. `Tree` / `TreeTable` (6 / 4)
5. `InputMask` (4) — unless `type="time"` is enough
6. `Sidebar` (1, but `TableExtensions` is common) — or keep the local `SidePanel` substitute
7. `Tag` / Prime `Badge` if `StatusBadge` is the wrong shape

## When this file is wrong

Re-audit:

```bash
# Unique Prime paths in MD
rg -o "from ['\"]primereact(?:/[^'\"]+)?['\"]" management-dashboard/src --glob '*.{ts,tsx}' | sort -u

# CL public exports
rg "^export \{ " ../component-library/src/index.ts
```

Then edit **this file only**, bump **CL version audited**, and leave skill/playbook/registry as links.
