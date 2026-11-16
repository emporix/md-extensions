# PrimeReact → `@emporix/component-library` widget status

**Audience:** agents extracting an MD module into `md-extensions`.  
**SoT:** this file. Do **not** copy the tables into the skill, playbook, or registry — those files **link here**. Stale gap lists (`no InputSwitch`) have already shipped in those docs.  
**CL version audited:** `2.18.0` (`component-library/src/index.ts`).  
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
| `primereact/dropdown` | `in-cl` | `Dropdown` | 1.3.0 | 61 | No `appendTo`. `showClear` (× button, emits `null` / `[]`) since **2.22.0** — use it for column filters instead of an explicit “All” option. Multi-select since 1.7.0 (`multiple`). |
| `primereact/inputtext` | `in-cl` | `InputText` | 1.4.0 | 60 | Also `textarea` boolean (1.4.1) — prefer this over Prime `InputTextarea` when porting. |
| `primereact/dialog` | `in-cl` | `Dialog` / `ConfirmBox` | 1.10.0 / 2.2.0 | 35 | Confirm flows → `ConfirmBox` (`message` is required). |
| `primereact/tabview` | `in-cl` | `Tabs` / `TabItem` | 2.0.0 | 29 | `disabled` on `TabItem` + `keepMounted` (≡ `renderActiveOnly={false}`) since **2.5.0**. |
| `primereact/calendar` | `in-cl` | `Calendar` | **2.7.0** | 23 | Pattern B. Overlay via `panelClassName` (table filters). Do **not** fall back to `<input type="date">` when Calendar is available. |
| `primereact/inputswitch` | `in-cl` | `InputSwitch` | **2.5.0** | 21 | Use in `TableExtensions` (`brands`, `returns`). |
| `primereact/datatable` | `in-cl` | `DataTable` | 1.10.0 | 19 | `rowActions` prop, not an actions column. Filter APIs + `FilterMatchMode` since 2.0.0. `checkboxSelectionOnly` (only the row checkbox selects) + `selectionPageOnly` (header checkbox covers the current page) since 2.14.0. A `frozen` column (`alignFrozen: 'right'` for the right edge) stays in view while the table scrolls sideways since 2.16.0. |
| `primereact/checkbox` | `in-cl` | `Checkbox` | 1.10.0 | 14 | **No** `label` prop — render `<label htmlFor>`. |
| `primereact/progressspinner` | `in-cl` | `ProgressSpinner` | 2.0.0 | 11+ | Also imported from barrel. |
| `primereact/divider` | `in-cl` | `Divider` | **2.19.0** | 3 | Pattern A (no Prime runtime). Same props as Prime (`layout`, `align`, `type`, `children`); styled like MD lara `.p-divider`. Form section separators — coupons Rules tab (COP-7188). |
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
| `primereact/inputnumber` | `in-cl` | `InputNumber` | **2.11.0** | 23 | Pattern B. `showButtons` + `buttonLayout` (MD 24px blue steppers, `pi-plus`/`pi-minus`), `prefix`/`suffix`, `mode="currency"`, fraction digits, `allowEmpty`. Change event `{ originalEvent, value }`. Prefer over `InputText type="number"`. For **entry-quantity** steppers (circular ±, no currency/prefix) prefer CL `QuantityStepper` (≥ **2.12.0**) instead — see shells table. |
| `primereact/skeleton` | `in-cl` | `Skeleton` | **2.11.0** | ~15 | Pattern A. Prime props (`width`, `height`, `size`, `shape`, `borderRadius`, `animation`). |
| `primereact/chip` | `in-cl` | `Chip` | **2.11.0** | 3 | Pattern A. `label`, `icon`, `removable` + `onRemove` (`pi-times-circle`), `removeAriaLabel`. Not the `Chips` input. |
| `primereact/tree` | `in-cl` | `Tree` | **2.12.0** | 6 | Pattern B; host theme cannot leak in (2.12.1). `compact` (2.14.0) matches MD's category trees (28px nodes). A `nodeTemplate` replaces Prime's label, so put `options.className` on its text or compact nodes shrink to 20px. Product pickers by category: use `ProductsBrowser` (below). |
| `primereact/chips` | `in-cl` | `Chips` | **2.20.0** | 10 | Pattern A (COP-7186). `value` / `onChange` `{ value, originalEvent }`, `separator`, `addOnBlur`, `allowDuplicate`, `max`, plus `label` / `error` / `required`. Tokens are CL `Chip`. Like Prime, the separator is compared to one key press (MD's `", "` only splits pasted text). |
| `primereact/splitbutton` | `in-cl` | `SplitButton` | **2.20.0** | 1 | Pattern A (COP-7186). `label`, `icon`, `model` (`MenuItem[]`), `onClick`, `disabled`, `menuButtonAriaLabel`; the arrow opens CL `Menu`. |
| `primereact/multiselect` | `partial` | `Dropdown` `multiple` | 1.7.0 | 11+ | Not a dedicated MultiSelect. Chip display via `display="chip"`. |
| `primereact/inputtextarea` | `partial` | `InputText` `textarea` | 1.4.1 | 6+ | No separate textarea export. |
| `primereact/badge` | `partial` | `StatusBadge` is **not** a drop-in | 2.5.0 | 6+ | CL `StatusBadge` = outlined status pill (`status` + `color`). Prime `Badge` = notification count badge. Promote Badge if you need the Prime widget. |
| `primereact/tag` | `missing` | — | — | 6 | List status/label chips. Do not silently swap to `StatusBadge` without checking API. |
| `primereact/treetable` | `missing` | — | — | 4 | `EmporixTreeTable`, categories. |
| `primereact/inputmask` | `partial` | `TimePicker` | **2.21.0** | 4 | `"99:99"` time masks → `TimePicker` (Pattern A: typed `HH:mm` + branded hour/minute dropdown, emits `HH:mm`, clears invalid text on blur). Do not fall back to native `InputText type="time"`. Other masks: still missing — promote when needed (COP-7188). |
| `primereact/sidebar` | `missing` | — | — | 1 | `TableExtensions.tsx`. Documented substitute: local `SidePanel` (right drawer, 20rem) + CL `InputSwitch`. Copy from `returns` or `brands` `components/shared/SidePanel`. Do not fall back to CL `Dialog` + `Checkbox`. |
| `primereact/paginator` | `missing` | — | — | 1 | Standalone (`EntityChangelogTab`). Table pagination is already on CL `DataTable`. `customer-groups` used custom control + CL `Dropdown`. |
| `primereact/panel` | `missing` | — | — | 1 | `ProductPricesPanelForm.tsx`. Documented substitute (products, COP-6993): CL `SectionBox` with a custom collapsible header. |
| `primereact/overlaypanel` | `missing` | — | — | 1 | `JsonPathFilterInput.tsx`. |
| `primereact/chart` | `missing` | — | — | 1 | `WebhooksStatistics.tsx`. Do not add `chart.js` to remote `shared` (playbook §2). |
| `primereact/togglebutton` | `missing` | — | — | 1 | `Language.module.tsx`. |
| `primereact/confirmpopup` | `missing` | — | — | 1 | `FeatureTogglesList.page.tsx`. Prefer CL `ConfirmBox` / `Dialog` unless the popover placement is required. |
| `primereact/image` | `missing` | — | — | 1 | `settings/Card.tsx`. |
| `primereact/password` | `in-cl` | `InputText` `type="password"` | **2.26.0** | 1 | Pattern A (COP-7185). Eye toggle on by default (`toggleMask`), labels via `toggleMaskLabels`. MD used `feedback={false}`; no strength meter in CL. |
| `primereact/tristatecheckbox` | `missing` | — | — | 1 | Barrel. `TemplateAttributes.tsx`. |
| `primereact/treenode` | `type` | `TreeNode` | **2.12.0** | 13 | Exported by CL with `Tree` (plus `TreeExpandedKeys`, `TreeSelectionKeys`, event types). |
| `primereact/selectitem` | `type` | — | — | 3 | `SelectItemOptionsType`. Map to CL `DropdownOption[]`. |
| `primereact/tooltip/tooltipoptions` | `type` | `TooltipProps` | 1.8.0 | 3 | |
| `primereact/menuitem` | `type` | `MenuItem` | 1.10.0 | 1 | |
| `primereact/api` (`locale` / `addLocale`) | `type` | — | — | 3 | Host/i18n bootstrap, not a remote widget. |
| `primereact/utils` (`classNames`) | `type` | — | — | 1 | Use the `classnames` package already in remotes. |

Barrel-only extras already covered above: `Skeleton` (2.11.0), `Password`, `TriStateCheckbox`, `ProgressBar`, `FileUpload`, `MultiSelect`.

## CL shells with no Prime import in MD

Import these when the remote needs them; they are not Prime replacements:

| CL export | Min CL | Use |
|-----------|--------|-----|
| `FieldLabel` | 2.1.0 | Shared label + required + tooltip. **Avoid** when the control already has `label` — use the built-in prop on `InputText` / `Dropdown` / `Calendar` / `LocalizedInput` / etc. Reserve `FieldLabel` for children with no label API (e.g. `InputSwitch`, plain text). |
| `LocalizedInput` | 2.1.0 | Context-free; remote wraps to inject languages (`LocalizedInput` pattern) |
| `DateValue` | 2.2.0 | Formatted dates — import directly |
| `BackButton` | 2.2.0 | Header back — import directly |
| `ConfirmBox` | 2.2.0 | Confirm dialog — import directly |
| `SectionBox` / `SectionTitle` | 2.3.0 | Do **not** copy local `SectionBox` |
| `Accordion` / `AccordionTab` | 1.5.0 | MD does not import `primereact/accordion` |
| `MoneyValue` | 2.5.0 | Locale-aware currency display |
| `StatusBadge` | 2.5.0 | Outlined status pill — not Prime `Badge`/`Tag` |
| `QuantityStepper` | **2.12.0** | Compact circular `[-]` / `[+]` quantity control (`value`, `onChange` → `QuantityStepperChangeEvent`, `min`/`max`/`step`, `disabled`/`readOnly`, optional `label`/`error`). Native buttons (not `.p-button`) so MD host button chrome cannot hide steppers — prefer over `InputNumber` `showButtons` for entry quantities. Orders pins CL **2.18.0**. |
| `ProductsBrowser` | **2.14.0** | MD's `ProductsBrowser` (MD component, not Prime): products in a list view or a category tree view, with paging, filters and checkbox picks. The remote injects `loadProducts` / `loadCategoryTree` (tree query gets the branch as `categoryIds`), `labels` (incl. `pageReport`, `published`, `unpublished`) and `onLoadError(error, 'products' \| 'categories')`. Since 2.15.0 a node that sets `published` (`ProductsBrowserCategoryNode`) shows MD's status dot; `categoryNodeTemplate` replaces name and dot (e.g. checkboxes). Skip `loadCategoryTree` without `CATEGORIES_VIEWER`, as MD does. Since 2.16.0 it fits a dialog body: as a flex item with `min-height: 0` its rows scroll and the paginator stays in view, and ids and codes widen their column by at most 200px and end in an ellipsis. Freeze a quantity column with `frozen` + `alignFrozen: 'right'`. Since 2.18.0 `toProductsBrowserCategoryNodes(trees, contentLanguage)` builds the nodes from `getCategoryTreesCall` trees as MD shows them (position order, `name(lang)` labels, `published`); pair it with `withCategoryScope` from api-calls ≥ 1.5.1 in `loadProducts`. Orders add-entry dialog and the products list (COP-4287). |
| `DotIndicator` | **2.15.0** | MD's status dot: 8px circle, green (`value`) or grey, `label` for the accessible name and tooltip. No `color` prop — keep a local copy only for MD's custom-colour uses (orders payment log). |

## Promote-next (if the module needs them)

Order by MD usage. Ask the user before implementing; Pattern A vs B is mandatory in `migrate-to-component-library`.

1. ~~`InputNumber`~~ / ~~`Skeleton`~~ — done in 2.11.0 (COP-6917)
2. ~~`Chips`~~ — done in 2.20.0 (COP-7186)
4. ~~`Tree`~~ — done in 2.12.0; `TreeTable` (4)
5. `InputMask` (4) — time masks done in 2.21.0 (`TimePicker`); other masks still open
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
