# Sites Settings

Last scanned: COP-7195 (2026-11-23)
Sources: `sites-settings/README.md`, `sites-settings/package.json`, `sites-settings/vite.config.ts`, `sites-settings/src/RemoteComponent.tsx`, `sites-settings/src/Sites.module.tsx`, `sites-settings/src/constants/paths.ts`, `sites-settings/src/models/Site.model.ts`, `sites-settings/src/models/AppState.model.ts`, `sites-settings/src/helpers/sites.helpers.ts`, `sites-settings/src/helpers/timezone.helpers.ts`, `sites-settings/src/hooks/api/sites.ts`, `sites-settings/src/hooks/api/paymentGateway.ts`, `sites-settings/src/hooks/useCountries.ts`, `sites-settings/src/hooks/useNotifySitesChanged.ts`, `sites-settings/src/pages/SitesList.page.tsx`, `sites-settings/src/pages/SiteAddEdit.page.tsx`, `sites-settings/src/components/sites/`, `sites-settings/src/configs/entityLinkConfig.ts`, `sites-settings/src/translations/`, `sites-settings/src/**/*.test.ts(x)`, `docs/MIGRATED_MODULES.md`

Management Dashboard (MD) Settings → Sites (MD `src/modules/sites/`) as a Vite federated remote, extracted in COP-7195 (`docs/MIGRATED_MODULES.md`). Federation name `sitesSettings`, exposes `./RemoteComponent` (named and default), local port `5190` with `strictPort` (`sites-settings/vite.config.ts`). Scaffold from `md-module-template`; Tier 1 providers, config and shared UI from `taxes`; mixins engine, `ReferenceOptionsProvider` and the audit-log tab from `customers`. MD keeps `models/Site.ts`, `hooks/api/sites.ts`, `hooks/api/paymentGateway.ts`, `SitesProvider` and the site switcher (`SitesSelect`, translation key `sites.select`).

## Record

`Site` is the `@emporix/api-calls/next` type (`sites-settings/src/models/Site.model.ts`); a payment entry is its `SiteServiceConfiguration`. The form (`SiteFormFields`, `sites-settings/src/helpers/sites.helpers.ts`) flattens it:

- General: `active`, `default`, `name`, `code`, `languages`, `defaultLanguage`, `shipToCountries`, `currency`, `cartCalculationScale`, `payment`, `taxDeterminationBasedOn`, `availableCurrencies`.
- Home base: `city`, `country`, `state`, `street`, `streetNumber`, `zipCode`, `timezone`; coordinates `longitude`, `latitude`; `assistedBuying.storefrontUrl`.
- New form (`createForm`): active, not default, tax by `BILLING_ADDRESS`, 2 decimal digits, everything else empty.
- An edit sends the loaded site with the form on top (`mapToUpdatePayload`), so mixins, metadata and fields the form does not show stay.

## API

`sites-settings/src/hooks/api/sites.ts` (`useSiteSettingsApi`) on `@emporix/api-calls/next`, host tenant as `options.tenant`: `getAllSites(includeInactive)` → `fetchAll(listSitesCall, { includeInactive })`; `getSite` → `getSiteCall(code, { expand: 'mixin:*' })`; `createSite` → `createSiteCall` (resolves to the new code); `editSite` → `updateSiteCall` (PUT); `patchSite` → `patchSiteCall`; `deleteSite` → `deleteSiteCall`. Payment modes: `listPaymentModesCall` (`hooks/api/paymentGateway.ts`). Countries: `listCountriesCall` via `useCountries` (all countries for the address, active ones for ship-to). Currencies: `fetchCurrencies` via `useCurrencies`.

## Routes

Hash routes (`sites-settings/src/constants/paths.ts`): `/` list, `/add`, `/:siteCode` (URL-encoded). `SiteAddEditPage` remounts per site code (`key`) and goes back to the list when the host switches tenant. Other paths redirect to `/`.

## Permissions

`Sites Viewer` opens the module (host menu node). `Sites Manager` enables Create, Save, Delete, every form control and mixin editing (`useCanManageSites`), and makes the list include inactive sites. `Audit Log Viewer` adds the changelog tab. Permissions are loaded by the remote's own `PermissionsProvider`.

## List

`SitesTable`: client-side CL `DataTable` (`lazy={false}`), `dataKey="code"`. Columns: Code (with ` (default)` on the default site; contains filter, sort), Name (contains filter, sort), Languages (gold pills), Currency (contains filter), Ship to (blue pills), Active (`DotIndicator`, yes/no dropdown filter, sort). Row click and Edit open the site. Delete (row or batch, after the CL confirmation) runs one site after another with a toast per site; a default site in the run shows `Default site cannot be deleted` and stops the run there (MD order), but the selection is cleared and the page unblocked in every case. After at least one deletion the list reloads and the host is told.

## Add and edit

`SiteAddEditPage`: four `SectionBox`es (General, Home Base Address, Location Coordinates, Assisted Buying). On `/add` they render without tabs; on `/:siteCode` inside CL `Tabs` (`keepMounted`, `?tab=`): `details`, one tab per site mixin schema (`useMixinsForm` with `SchemaType.SITE`), and `audit-log` (entity `site`). With the toggle `filter-site-mixins` on, the mixins `customerSettings`, `orderProcessSettings`, `merchantInfo`, `productSettings`, `feeService`, `imageSize`, `couponSettings`, `hubspotProperties`, `linkablePages`, `mapsApiKey` get no tab (`EXCLUDED_MIXIN_IDS`).

- Required: name, code, languages, default language, ship-to countries, currency, country. Save needs a valid, changed form and Sites Manager; Discard resets to the loaded site.
- Removing the default language from Languages clears Default Language (`keepDefaultLanguage`).
- Decimal digits: integers ≥ 0; an empty input becomes 2 and a negative one 0.
- Payment methods: multi-select of the tenant's payment modes by id; entries of modes the gateway no longer offers stay (`toSitePayments`).
- Timezone: every IANA zone with its current UTC offset; a saved zone the browser does not know is listed first (`timezone.helpers.ts`).
- Tax determination options are fixed EN/DE names shown in the content language.
- Create → success toast, the host is told, the page replaces itself with `/:newCode`. Edit → PUT, toast, host told, reload. Mixin save → PATCH `{ mixins: { ...site.mixins, [key]: data }, metadata: { mixins: { [key]: url } } }`, toast, host told, reload.
- Rows of the form are 12-column grids that stack one field per line when the row is narrower than three 200px controls (container query).

## Host callback

`AppState.onSitesChanged` (optional) is called through `useNotifySitesChanged` after a successful create, update, mixin save, and after a delete run that removed at least one site; never after a failure. The Management Dashboard passes `SitesProvider.refreshSites`, which reloads its site list and keeps the selected site (with fresh data) or falls back to the default site.

## MD defects fixed in the port

- Error toasts read `e.response.data.message` and crashed when the error had no response; they now use `getApiErrorDetails` (Scenario 11).
- A batch delete that reached the default site returned early and left the delete button busy and the selection set; both reset now.
- A failed mixin save only logged to the console; it shows `Error while updating` now.
- `errorFetchMethods` said "Error while loading sites" (DE "ehler…"); it names payment methods now. A countries load error has its own text.

## Translations

`sites` (MD `modules/sites/translations`, without `select`, which stays in MD for the switcher) plus `global`, `auditLog`, `confirmBox`, `errors`, `mixins`. `translations.test.ts` checks EN/DE key parity and the MD `sites` keys.

## Host wiring

MD route `sitesSettings` → `/apps/management/sites-settings/*` as an `ExternalModule` with `VITE_SITES_SETTINGS_URL` (`frontend-extensions{-develop,-stage,}.web.app/sites-settings/remoteEntry.js`, local `http://localhost:5190/assets/remoteEntry.js`). `SitesPathRedirect` moves former pathname links (`/add`, `/:siteCode`) into the hash; the MD audit log links a site to `/apps/management/sites-settings#/{code}`. The keys `sitesSettingsAdd` / `sitesSettingsEdit` are gone. Deploy: `.github/workflows/sites-settings-firebase-*.yaml` into the shared Hosting site folder `sites-settings/`; the workflows include `audit-log/**`.

## Not yet scanned

Rendering in the host and the PR preview (structural gates only).
