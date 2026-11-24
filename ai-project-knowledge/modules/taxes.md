# Taxes

Last scanned: COP-7191 (2026-11-20)
Sources: `taxes/README.md`, `taxes/package.json`, `taxes/vite.config.ts`, `taxes/src/RemoteComponent.tsx`, `taxes/src/Taxes.module.tsx`, `taxes/src/constants/paths.ts`, `taxes/src/models/Tax.model.ts`, `taxes/src/hooks/api/taxes.ts`, `taxes/src/hooks/api/countries.ts`, `taxes/src/hooks/useCountries.ts`, `taxes/src/pages/Taxes.page.tsx`, `taxes/src/pages/TaxClass.page.tsx`, `taxes/src/components/taxes/`, `taxes/src/translations/`, `taxes/src/**/*.test.ts(x)`, `docs/MIGRATED_MODULES.md`

Management Dashboard (MD) Settings → Tax as a Vite federated remote, extracted in COP-7191 (`docs/MIGRATED_MODULES.md`). The Tax Service keeps one record per country; each record holds the tax classes of that country. Federation name `taxes`, exposes `./RemoteComponent` (named and default), local port `5189` with `strictPort` (`taxes/vite.config.ts`). Scaffold, Tier 1 providers and shared UI are copied from `units` (see `ai-project-knowledge/modules/units.md`); `useCountries` follows `companies` without regions or taxes. MD keeps its own `hooks/api/taxes.ts` and `models/Taxes.ts` (quotes, delivery zones and countries still read taxes).

## Record

`Tax`, `TaxClass` and `Country` are the `@emporix/api-calls/next` types (`taxes/src/models/Tax.model.ts`).

- A country record: `locationCode` (the country code), `location.countryCode`, `taxClasses[]`, `metadata.version`.
- A tax class: unique `code`, localized `name`, optional localized `description`, `rate` in percent, and `order` / `isDefault`, which the form does not show.
- New form: rate `0`, empty code, name and description (`createTaxClassForm`).
- The stored class is the base of an edit: `order` and `isDefault` stay as they are; a description with no text is left out (`toTaxClass`).
- An update sends `location`, the full class list and only `metadata.version` of the loaded record (`toTaxUpdate`).
- Rate keeps one fraction digit (`InputNumber` `maxFractionDigits` 1), as in MD: `7.25` cannot be entered, `7.2` is stored.

Pinned by `taxes/src/models/Tax.model.test.ts`.

## API

`useTaxesApi` (`taxes/src/hooks/api/taxes.ts`) binds `listTaxesCall`, `getTaxCall`, `createTaxCall`, `updateTaxCall` and `deleteTaxCall` (`@emporix/api-calls` 1.7.1 `./next`) to the host tenant (`options.tenant`).

- List query: `pageNumber`, `pageSize`, the `countryCode` filter (named parameter, contains) and `sort` as `countryCode:ASC|DESC`. No other filter or sort goes to the service.
- `addTaxClass(countryCode, taxClass)` reads the country with `getTaxCall`. A 404 creates the record (`createTaxCall` with the one class, result `created`). A record that exists is updated with the class appended (`updateTaxCall`, result `updated`), including a country that sat beyond the first 1000 records in the MD scan. A class code the record already has throws `DuplicateTaxClassError` before anything is written. Any other lookup error is rethrown.
- `removeTaxClass(countryCode, taxClassCode)` reads the current record, then updates it without the class; when no class would remain it deletes the country record instead. It never trusts the row the list showed, so an earlier edit cannot leave it with a stale version.
- `deleteTax(countryCode)` deletes one record. `getTax` and `updateTaxClasses(tax, classes)` serve the edit page.
- `useCountries` loads every country with `fetchAll(listCountriesCall, { sort: 'code:asc' })`: active ones feed the dropdown options; only an active country has a name for the list.

Pinned by `TaxClass.page.test.tsx` and `TaxesTable.test.tsx`.

## Routes

Hash routes (`taxes/src/constants/paths.ts`, `taxes/src/RemoteComponent.tsx`): `/` list, `/add` add a class, `/:countryCode/:taxClassCode` edit a class (both segments URL-encoded); other paths redirect to `/`.

## Permissions

`Taxes Viewer` can see the list and open a class, which then renders read-only. `Taxes Manager` (`taxes/src/configs/accessControls.ts`, ids copied from MD) is needed for Add tax class, row delete, class delete, batch delete, Save and Discard (which also need a changed form), and to change fields. Permissions come from the remote's own `PermissionsProvider`.

## List

`TaxesTable` (`taxes/src/components/taxes/TaxesTable.tsx`) is lazy: every page, filter, sort, tenant change or refresh loads one page of country records.

- Columns: expander, Country code (dropdown filter of the active countries, sortable), Country name (content language; `<code> - Inactive` when the country is not active). Selection checkboxes and row actions (delete) come from the shared `TableActions` and `BatchDeleteButton`.
- A row expands to `TaxClassesTable`: Code, Name (content language), Rate (`N %`), sorted on the client (no filter row), with edit (opens `/:countryCode/:taxClassCode`) and delete per class.
- Delete (country row or batch) asks for confirmation, then deletes in parallel: a success toast "Tax was deleted" per record, an error toast "Error while deleting <code>" per failure. The selection clears and the list is read again from the server (MD filtered the stale rows after a batch delete).
- Deleting a class shows "Tax was deleted" and reloads the list; deleting the last class deletes the country record (as in MD).
- A failed load shows "Error while loading taxes. Please try again later" and an empty table; a failed country load shows its own toast.
- A host tenant switch clears the rows, the selection and the expansion before the new tenant loads.

Pinned by `taxes/src/components/taxes/TaxesTable.test.tsx`.

## Add and edit

`TaxClassPage` (`taxes/src/pages/TaxClass.page.tsx`): header "Tax" (edit adds `<country> - <code>`) with back to the list, Discard and Save. Fields: Country (dropdown of active countries with a filter; disabled on edit), Rate (`InputNumber`, suffix `%`, 0 to 1 fraction digits), Code (upper-cased as typed), Name and Description (localized, description a textarea).

- Save and Discard need a dirty form and Taxes Manager. Save validates first: no country or an empty code sends nothing and shows "Select a country" / "Enter a tax code" on the field (MD sent the request).
- Add: a code the country already has shows "This country already has a tax class with this code" on the code field and writes nothing (MD appended a duplicate). Otherwise the class is created or appended (see API), "Tax Class was added!", and the list opens.
- Edit: changes only that class in the loaded record, "Tax Class was edited!", the list opens. A changed code that another class of the country has is rejected like a duplicate.
- A failed lookup, create or update shows "Something went wrong. Check form data or try later." with the service details; the form keeps its values and the page stays. A failed load of the record shows the load error and keeps the form locked; a class missing from the record shows "Tax class not found".
- A host tenant switch returns to the list (as MD).

Pinned by `taxes/src/pages/TaxClass.page.test.tsx`.

## MD defects fixed in the port

1. Add scanned the first 1000 records to find the country; it now uses `getTaxCall` (a country beyond the first 1000 got a duplicate record).
2. Save needs a country and a code.
3. A duplicate class code in the country is rejected inline.
4. Failed load, save and delete show an error toast and the page stays.
5. Batch delete reloads the list from the server.

## Translations

`taxes/src/translations/{en,de}/taxes.ts` keep MD's `taxes.*` keys (`title`, `singular`, `plural`, `addTaxClass`, `editTaxClass`, `label.*`, `toast.success*`), plus `placeholder.country`, `validation.*` and `toast.error*`. EN and DE key parity and the absence of `primereact` are pinned by `taxes/src/translations/translations.test.ts`.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned |
| Federation `name` | `taxes` (`taxes/vite.config.ts`) |
| Host route `key` → path | `taxes` → `/apps/management/taxes/*` (`management-dashboard` `src/router/module-routes.tsx`; MD had `taxes`, `taxesAdd`, `taxesEdit` before COP-7191) |
| Host env var | `VITE_TAXES_URL` (`management-dashboard` `.env.*`) |
| Old pathname links | MD `TaxesPathRedirect` moves `/apps/management/taxes/add` and `/apps/management/taxes/:countryCode/:taxClassCode` into the hash (`#/add`, `#/:countryCode/:taxClassCode`) |
| Local port | `5189`, `strictPort` |
| Hosting | No site of its own: published into `/taxes/` of the shared site of each environment (`frontend-extensions-develop`, `-stage`, `frontend-extensions`) by `.github/actions/deploy-remote` from `.github/workflows/taxes-firebase-*.yaml` (COP-7348); MD `VITE_TAXES_URL` → `https://frontend-extensions[-develop\|-stage].web.app/taxes/remoteEntry.js` |
| Local deviations | none |

## Not yet scanned

- Tier 1 copies shared with `units` (providers, IAM hooks, shared UI) — see `ai-project-knowledge/modules/units.md`.
