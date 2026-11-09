# Units

Last scanned: d8edeb2 (2026-11-07)
Sources: `units/README.md`, `units/package.json`, `units/vite.config.ts`, `units/src/RemoteComponent.tsx`, `units/src/Units.module.tsx`, `units/src/constants/paths.ts`, `units/src/models/Unit.model.ts`, `units/src/hooks/api/units.ts`, `units/src/pages/Units.page.tsx`, `units/src/pages/Unit.page.tsx`, `units/src/components/units/UnitsTable.tsx`, `units/src/translations/`, `units/src/**/*.test.ts(x)`, `docs/MIGRATED_MODULES.md`

Management Dashboard (MD) Management → Units as a Vite federated remote, extracted in COP-7192 (`docs/MIGRATED_MODULES.md`). A unit belongs to the Unit Handling Service; MD price models (which stay in MD) list units and label their measurement unit with them. Federation name `units`, exposes `./RemoteComponent` (named and default), local port `5182` with `strictPort` (`units/vite.config.ts`). Tier 1 providers, shared UI and session code are copied from `status-codes` (see `ai-project-knowledge/modules/status-codes.md`); the lazy table follows `labels`.

## Record

`Unit` (`units/src/models/Unit.model.ts`) is derived from the return type of `getUnitByCodeCall`, because `@emporix/api-calls` does not export the model: `code`, localized `name`, `type`, optional `symbol`, `baseUnit`, `factor`, optional `metadata` (`version`).

- New form: empty code, name, type and symbol; base unit `false`; factor `1` (`createUnitForm`).
- Create sends code, name, type, base unit, factor and the symbol when not empty; update also sends `metadata.version` of the loaded unit (`toUnitPayload`).
- A name counts as given when at least one language value is not blank (`hasName`). MD looked only at the last language of the map.

Pinned by `units/src/models/Unit.model.test.ts`.

## API

`useUnitsApi` (`units/src/hooks/api/units.ts`) binds the six api-calls functions to the host tenant: `getAllUnitsPaginatedCall` (`pageSize`, `pageNumber`, and the `code`, `symbol`, `type`, `factor`, `name.<lang>` filter values as query params; no sort), `getUnitByCodeCall`, `getAllUnitTypesCall`, `createUnitCall`, `updateUnitCall`, `deleteUnitCall`. The api-calls functions put the code into the URL path as is, so the hook URL-encodes it for get, update and delete (a code such as `km/h`); the hash route `/:code` is encoded the same way (`units/src/constants/paths.ts`). Pinned by `Unit.page.test.tsx` and `UnitsTable.test.tsx`.

## Routes

Hash routes (`units/src/constants/paths.ts`, `units/src/RemoteComponent.tsx`): `/` list, `/add` create, `/:code` edit; other paths redirect to `/`.

## Permissions

`Units Viewer` can view; `Units Manager` (`units/src/configs/accessControls.ts`) is needed for Add New Unit, row delete, batch delete, Save and Discard, and to change fields (they render disabled otherwise). Permissions come from the remote's own `PermissionsProvider`.

## List

`UnitsTable` (`units/src/components/units/UnitsTable.tsx`) is lazy, as MD was: every page, filter or tenant change or refresh loads one page from the service.

- Columns Code, Name (content language), Symbol, Type, each with a contains filter (Name filters on `name.<contentLanguage>`), and Factor (right-aligned, no filter). No sorting and no column visibility (MD had neither).
- Row click and row edit open `/:code`. A failed load shows an error toast and an empty table.
- Delete (row or batch) asks for confirmation, then deletes the units in parallel; a failed code gets an error toast naming it; the selection clears and the table reloads. A successful delete shows no toast (as MD).
- A host tenant switch clears the rows and the selection before the new tenant loads.

Pinned by `units/src/components/units/UnitsTable.test.tsx`.

## Create and edit

`UnitPage` (`units/src/pages/Unit.page.tsx`): header "Unit" with the code as subtitle and a back button to the list; Discard and Save in the header; one section with Name (component-library `LocalizedInput`), Code (read-only on edit), Symbol, Type (component-library `AutoComplete` with a dropdown button: suggests the tenant's types from `getAllUnitTypesCall` and keeps any typed value), Base Unit (True / False dropdown) and Factor (`InputNumber`, decimal, up to two fractions, UI-language locale).

- Save is enabled only for a dirty, valid form: a name in one language, code and type not blank.
- Create: success toast "Unit was created!", then the page switches to `/:code` (replace).
- Update: sends the loaded version, success toast "Unit was edited!", reloads the unit.
- A failed save shows "Something went wrong. Check form data or try later." with the service details; the form keeps the entered values.
- A code that cannot be loaded shows "Unit not found. Please create a new one" (an error toast; MD used an info toast, which the component library does not have) and goes to `/add`.
- A host tenant switch empties and locks the form until the unit of the new tenant has loaded.

Pinned by `units/src/pages/Unit.page.test.tsx`.

## Translations

`units/src/translations/{en,de}/units.ts` keep MD's `units.*` keys, plus `toasts.errorFetch` and `toasts.errorDelete`. EN and DE key parity and the absence of `primereact` are pinned by `units/src/translations/translations.test.ts`.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned |
| Federation `name` | `units` (`units/vite.config.ts`) |
| Host route `key` → path | `units` → `/apps/management/units/*` (`management-dashboard` `src/router/module-routes.tsx`; the MD key was `unitsNode` with children `units`, `unitsAdd`, `unitsEdit` before COP-7192) |
| Host env var | `VITE_UNITS_URL` (`management-dashboard` `.env.*`) |
| Local port | `5182`, `strictPort` |
| Hosting | Firebase targets `emporix-units`, `-stage`, `-develop`; `.github/workflows/units-firebase-*.yaml` |
| Local deviations | none |

## Not yet scanned

- Tier 1 copies shared with `status-codes` (providers, IAM hooks, shared UI) — see `ai-project-knowledge/modules/status-codes.md`.
