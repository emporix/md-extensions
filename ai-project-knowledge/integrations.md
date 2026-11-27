# Integrations

Last scanned: 05d8d1d (2026-11-06)
Sources: `agentic-ai/src/services`, `agentic-ai/src/components/tool`, `algolia-synonyms/src`, `brands/src`, `brands/package.json`, `customer-groups/src`, `customer-groups/package.json`, `dashboard/src/dashboard/api`, `dashboard/src/dashboard/widgets/OrdersByCountryMapWidget/OrdersByCountryMapWidget.tsx`, `dashboard/src/vite-env.d.ts`, `labels/src`, `labels/package.json`, `companies/src`, `companies/package.json`, `categories/src`, `categories/package.json`, `classifications/src`, `classifications/package.json`, `status-codes/src`, `catalogs/src`, `catalogs/package.json`, `coupons/src`, `coupons/package.json`, `status-codes/package.json`, `orders/src`, `orders/package.json`, `products/src/api`, `products/src/hooks/api`, `products/src/context`, `products/src/helpers/hostUrls.ts`, `products/package.json`, `returns/src`, `returns/package.json`, `statistics/src/api.ts`, `users-and-groups/src`, `users-and-groups/package.json`, `.github/workflows`

Twenty UI extensions call the Emporix HTTP API. Nineteen take the base URL from `VITE_API_URL`. `algolia-synonyms` takes it from the host callback field `emporixApiUrl`. No `.env*` file was opened. Env names below are names only. No literal API key, token, or tenant id was found in source; UI strings in `agentic-ai/src/translations/en/index.ts` label fields such as an API key and a client secret and are not values. HTTP paths inside `@emporix/api-calls` were not read (`node_modules` skipped), so those paths are unknown.

Firebase Hosting deploy and preview workflows under `.github/workflows/*firebase*.yaml` are deployment only and are not a runtime API.

`vite.config.ts` `corsOrigins` entries (`https://admin.emporix.io`, `https://dev-admin.emporix.io`, `https://stage-admin.emporix.io`, `http://localhost:4200`) are allowed browser origins for the remote, not outbound calls.

## Shared Emporix client

### `@emporix/api-calls` (axios)

`quotes` 1.7.1 (its own calls on `./next`, see **quotes** below), `taxes` 1.7.1 (its own tax and country calls on `./next`, client as in `quotes`), `sites-settings` 1.7.1 (its own site, payment-mode and country calls on `./next`, see **sites-settings** below), `categories` and `classifications` 1.5.3, `coupons` 1.7.1 (its audit log on `./next`), `companies` 1.7.1 (its audit log on `./next`, see **companies** below), `customers` 1.7.1 (its audit log on `./next`), `products` 1.7.1 (its audit log on `./next`), `returns` and `status-codes` 1.5.1, `orders` 1.7.1 (its audit log on `./next`), `labels` 1.2.14, `customer-groups` 1.7.1 (its audit log on `./next`), `brands` 1.2.1, `users-and-groups` 1.7.1 (its audit log on `./next`) (`*/package.json`). Each `src/api/bootstrap.ts` calls `createApiClient` with `baseURL` `VITE_API_URL` and throws `VITE_API_URL is not configured` when that value is missing. The access token and tenant come from the host via `setApiCredentials` / `useApiCredentials`. Retry and the concrete URL paths live in the package and are unknown here.

Screens that only check permissions call `getAccessControlsTemplates` and `getScopesForUser` (`*/src/context/PermissionsProvider.tsx` in orders, returns, brands, labels, status-codes, coupons, companies, categories, classifications, and quotes). `products/src/context/PermissionsProvider.tsx` also loads tenant access controls and templates, and renders its children only after the load. `hooks/api/iam.ts` in those ten also imports user, group, scope, and access-control mutators. No file outside that hook imports `useIamApi` except `PermissionsProvider`, so those mutators have no caller outside the hook.

`customer-groups` and `users-and-groups` do call IAM from group and user screens (`GroupsTable`, `UsersTable`, `Group.provider`, `GroupPageActions`, `GroupMembers`, `GroupAddMembersDialog`, `User.page`, `UserAccessForm`). Wrapped calls cover groups, users, membership, scopes, and access controls. Paths unknown.

All thirteen (`brands`, `categories`, `classifications`, `companies`, `coupons`, `customer-groups`, `labels`, `orders`, `products`, `quotes`, `returns`, `status-codes`, `users-and-groups`) also call:

- Sites: `getSitesCall` from `src/api/sites.ts`, used by `src/context/SitesProvider.tsx`.
- Feature toggles: `getFeatureToggleValuesCall` from `src/hooks/api/featureToggles.ts`, used by `src/context/FeatureTogglesProvider.tsx`.
- Configuration: `fetchBasicConfiguration` and `updateSingleConfiguration` from `src/context/ConfigurationProvider.tsx`. `fetchSingleConfiguration`, `updateSingleConfiguration`, `createSingleConfiguration` (on 404 from update), and `deleteSingleConfiguration` are wrapped in `src/hooks/api/configuration.ts` (not present in `labels`, `status-codes`, `categories`, or `classifications`).

### Direct HTTP

Bearer token plus an Emporix tenant header. The api-calls client also sends language headers; a call can override `Accept-Language: *` (`labels/src/api/labels.ts`). Dashboard retries idempotent GETs. The others do not retry in this repo.

## agentic-ai

`fetch` in `agentic-ai/src/services/apiClient.ts`. Base URL is `VITE_API_URL`, or the literal `https://api.emporix.io` when that env value is missing. Headers: `Authorization: Bearer`, `Emporix-tenant`, `Content-Type: application/json`, `Content-Language: *`, `Accept-Language: *`. `postSse` sets `Accept: text/event-stream`. No retry loop. `getArrayBuffer` refuses bodies larger than `MAX_ZIP_DOWNLOAD_BYTES` (`agentic-ai/src/constants/zipLimits`).

Paths on that base URL:

- AI service (`agentic-ai/src/services/agentService.ts`, `toolsService.ts`, `tokensService.ts`, `oauthService.ts`, `mcpService.ts`, `modelsService.ts`, `logService.ts`, `jobService.ts`, `conversationsService.ts`, `analyticsService.ts`): `/ai-service/{tenant}/agentic/agents` (GET, PUT, PATCH, DELETE with optional `?force=true`), `/ai-service/{tenant}/agentic/agents/export` (POST), `/ai-service/{tenant}/agentic/agents/import` (POST), `/ai-service/{tenant}/agentic/templates` (GET), `/ai-service/{tenant}/agentic/templates/{id}/agents` (POST), `/ai-service/{tenant}/agentic/chat` (POST; optional `session-id` header; used as the fallback when `chat-stream` answers 400), `/ai-service/{tenant}/agentic/chat-stream` (POST SSE; optional `session-id` header), `/ai-service/{tenant}/agentic/commerce-events` (GET), `/ai-service/{tenant}/agentic/tools` (GET, PUT, PATCH, DELETE, optional `force`), `/ai-service/{tenant}/agentic/tokens` (GET, PUT, DELETE, optional `force`), `/ai-service/{tenant}/agentic/oauths` (GET, PUT, PATCH, DELETE, optional `force`), `/ai-service/{tenant}/agentic/mcp-servers` (GET, PUT, PATCH, DELETE, optional `force`), `/ai-service/{tenant}/agentic/models` (GET), `/ai-service/{tenant}/agentic/oauth/installations/slack` (GET), `/ai-service/{tenant}/agentic/oauth/installations/teams` and `.../teams/status` (GET), `/ai-service/{tenant}/agentic/logs/requests` and `/ai-service/{tenant}/agentic/logs/sessions` (GET), `/ai-service/{tenant}/jobs` (GET), `/ai-service/{tenant}/agentic/conversations` (GET), `/ai-service/{tenant}/agentic/analytics` (GET, in-memory cache in `analyticsService.ts`).
- Feature toggle (`featureToggleService.ts`): GET `/feature-toggle/{tenant}/features?pageNumber=1&pageSize=1000`.
- IAM (`iamScopesService.ts`): GET `/iam/{tenant}/scopes` and `/iam/{tenant}/users/me/scopes`.
- Indexing (`indexingService.ts`): GET and POST `/indexing/{tenant}/reindex-jobs`.
- RAG indexer (`aiRagIndexerService.ts`): GET `.../rag-metadata` and `.../filter-metadata`, POST `.../reindex` under `/ai-rag-indexer/{tenant}/{entityType}`.
- Schema (`schemaService.ts`): GET `/schema/{tenant}/custom-entities`.
- Webhook (`agentService.ts` `fetchEventSubscriptions`): GET `/webhook/{tenant}/event-subscriptions`.
- Automation and media (`hostingFunctionsService.ts`): GET `/automation/{tenant}/projects/functions` and `.../functions/{id}/deployments` (404 and 403 are handled in that file), GET `/media/{tenant}/assets/{id}/download` as an array buffer.
- Chat attachments (`agentService.ts`): multipart POST `/ai-service/{tenant}/agentic/{agentId}/attachments`; chat request bodies then carry `attachments` refs.
- Chat artifacts: the chat stream emits an `artifact` event (image or file, `ready` / `pending` / `failed`, `generation_id`) (`agentic-ai/src/utils/sseHelpers.ts`). The file is read from GET `/media/{tenant}/assets/{artifactId}/download`, capped at 8 MB (`MAX_ARTIFACT_DOWNLOAD_BYTES` in `agentic-ai/src/utils/chatArtifacts.ts`).

Browser navigations, not `fetch`:

- Slack: after the slack installation GET, `SlackInstallSection.tsx` sets `window.location.href` to `https://slack.com/oauth/v2/authorize` with `client_id` and `state` from that response. Scopes are a fixed query string in that file. The client id is not a literal in the repo.
- Teams: `TeamsInstallSection.tsx` opens `appInstallUrl` and `adminConsentUrl` from the teams installation GET (hosts are whatever that response returns), and also opens `https://teams.microsoft.com/v2/` and `https://admin.teams.microsoft.com/policies/manage-apps`. Install status is polled on the Emporix teams status path. `TeamsInstallCallbackHandler.tsx` only reads the current page URL.

MCP server URLs are validated and stored on the tool payload (`mcpValidationHelpers.ts`, `mcpService.ts`). This extension does not `fetch` that URL.

`downloadPng.ts` fetches a local data URL. No `WebSocket` or `EventSource` constructor was found under `agentic-ai/src`.

## algolia-synonyms

Two outbound systems. No `VITE_` read under `algolia-synonyms/src`.

- Emporix indexing. `algolia-synonyms/src/App.jsx` uses `md-ext` `registerCallback`. On context update it `axios.get`s `{emporixApiUrl}/indexing/{tenant}/configurations/ALGOLIA` with `Authorization: Bearer` and `Emporix-tenant`. The JSON body is stored in `localStorage` under `algoliaConfig`. A 404 or any thrown error sets the missing-config state. The body is not recorded here.
- Algolia. `algolia-synonyms/package.json` depends on `algoliasearch` `^4.24.0`. `algolia-synonyms/src/lib/algolia-search.js` builds a client from `applicationId` and `writeKey` on that stored object and calls `browseSynonyms`, `saveSynonym`, and `deleteSynonym` (with `forwardToReplicas`) on `indexName`. The SDK host is not set in this repo.

## brands

Same shared api-calls client as above (`brands/package.json` `@emporix/api-calls` 1.2.1). Extra calls beyond sites, configuration, feature toggles, and the two IAM permission reads:

- Brands: `fetchBrands`, `deleteBrand` (`brands/src/components/brands/BrandsTable.tsx`); `fetchBrand`, `createBrand`, `editBrand` (`brands/src/pages/Brand.page.tsx`).
- Media: `postFileAsset`, `putAsset`, `delAsset`, `downloadAsset`, `fetchAsset`, `getAssetsForId` (`brands/src/hooks/api/mediaAssets.ts`), used from `AssetsViewer.tsx`, `MediaAssetUpload.tsx`, and `Brand.page.tsx`.

Paths for those symbols are inside `@emporix/api-calls` and are unknown. No direct Cloudinary or Algolia client was found under `brands/src`.

## customer-groups

Shared api-calls client (`@emporix/api-calls` 1.7.1). IAM group and user screens call the IAM wrappers described above.

Also:

- Vendors: `GroupDetailsGeneralFormRolesVendor.tsx` calls `getVendors`. `hooks/api/vendors.ts` also wraps `getVendor`, `postVendor`, `putVendor`, `deleteVendor`, and location calls. No caller of those other wrappers was found outside that file.
- Legal entities: `CompanySelector.tsx` calls `getLegalEntities` and `getLegalEntity` (`fetchLegalEntitiesCall`, `fetchLegalEntityCall` in `hooks/api/customerManagement.ts`).
- Audit Logs (Changelog) Service, in `customer-groups/src/hooks/api/changelog.ts`: `getChangelogCursorPage` calls `listChangelogsWithCursorCall` from `@emporix/api-calls/next` (`GET /changelog/{tenant}/changelogs?pagination=cursor`, `next`/`prev` from the `x-next-cursor`/`x-prev-cursor` headers, no totals). `q` always carries the tab's date window as UTC instants (`changelogWindowQ` in the shared `audit-log/src/window/changelogWindow.ts`, `buildChangelogQ` with an `occurredAt` range); the tab is the shared `EntityChangelog` from `audit-log/` (`ai-project-knowledge/modules/audit-log.md`).
- Configuration restrictions: `GroupDetailsGeneralForm.tsx` calls `getRestrictions` and `getSyncBetweenRestrictionsAndSiteCodes`.

## dashboard

`fetch` via `apiFetch` in `dashboard/src/dashboard/api/base.api.ts`. Base URL is `VITE_API_URL` with a trailing slash removed; a missing URL becomes `''`, and `ensureApiContext` then throws `Missing API base URL, tenant, or token`. Timeout is `VITE_API_TIMEOUT` (milliseconds), or 30000. Headers: `Authorization: Bearer`, `Emporix-Tenant`, `Accept`. Some calls add `Content-Type` and `X-Total-Count: true`. GET and HEAD retry up to 2 times on status 429, 502, 503, 504 and on `TypeError`, delay 500ms times the attempt number. Other methods are not retried. Abort becomes a timeout error.

Paths (all under that base URL):

- GET `/configuration/{tenant}/basic-configuration`, GET and PUT `/configuration/{tenant}/configurations/{key}`, POST `/configuration/{tenant}/configurations` (`configuration.api.ts`).
- GET `/caas-customer/{tenant}/customers` (`customers.api.ts`).
- GET `/order-v2/{tenant}/salesorders/` (`orders.api.ts`).
- POST `/cart/{tenant}/carts/search` (`carts.api.ts`).
- GET `/statistics/tenants/{tenant}/orderStats` and `.../quoteStats` (`orderStats.api.ts`, `quoteStats.api.ts`).
- GET `/coupon/{tenant}/coupons` (`coupons.api.ts`).
- GET `/quote/{tenant}/quotes` (`quotes.api.ts`).
- POST `/product/{tenant}/products/search` (`products.api.ts`).
- GET `/return/{tenant}/returns` (`returns.api.ts`).
- GET `/site/{tenant}/sites` (`sites.api.ts`).
- GET `/iam/{tenant}/users` (`employees.api.ts`).
- GET `/vendor/{tenant}/vendors` (`vendors.api.ts`).

`OrdersByCountryMapWidget.tsx` passes `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` to `react-simple-maps` `Geographies`, which loads that file.

`dashboard/src/vite-env.d.ts` declares `VITE_SENTRY_DSN`, `VITE_DATADOG_APP_ID`, `VITE_DATADOG_CLIENT_TOKEN`, `VITE_FEATURE_*`, and other `VITE_` names. The only `import.meta.env.VITE_*` reads under `dashboard/src` are `VITE_API_URL` and `VITE_API_TIMEOUT`. No Sentry or Datadog client was found.

## labels

Shared api-calls client (`labels/package.json` `@emporix/api-calls` 1.2.14), plus sites, configuration, feature toggles, and the IAM permission reads.

- Label list: the one local call, `GET label/labels` in `labels/src/api/labels.ts`, with `pageNumber`, `pageSize`, `sort=field:ASC|DESC`, `q=name:~(…)`, headers `x-total-count: true` and `Accept-Language` set to the UI language. It is local because api-calls `fetchLabels` sends filter params the service ignores (`labels/src/helpers/labels.helpers.ts`).
- Delete: `removeLabelImageFromCloudinary` (api-calls) when the label has an image, then `deleteLabel`; on any failure `deleteLabel` is retried once (`labels/src/helpers/labels.helpers.ts`).
- Media: `getAssetsForId` and `postFileAsset` with ref type `LABEL` (`labels/src/hooks/api/mediaAssets.ts`, `labels/src/models/Assets.model.ts`).

## coupons

Shared api-calls client (`coupons/package.json` `@emporix/api-calls` 1.7.1 — boolean `equals` filters such as `categoryRestricted` are sent unquoted), plus sites, configuration (incl. `ext_coupons` table configuration via `updateSingleConfiguration`), feature toggles, schemas and mixins (copied from `orders`), the audit log changelog, and the IAM permission reads.

- Audit Logs (Changelog) Service, in `coupons/src/hooks/api/changelog.ts`: `getChangelogCursorPage` calls `listChangelogsWithCursorCall` from `@emporix/api-calls/next` (`GET /changelog/{tenant}/changelogs?pagination=cursor`, `next`/`prev` from the `x-next-cursor`/`x-prev-cursor` headers, no totals). `q` always carries the tab's date window as UTC instants (`changelogWindowQ` in the shared `audit-log/src/window/changelogWindow.ts`, `buildChangelogQ` with an `occurredAt` range); the tab is the shared `EntityChangelog` from `audit-log/` (`ai-project-knowledge/modules/audit-log.md`).
- Coupons (Coupon Service): `fetchCoupons` (server-side page, sort and `q` filters), `fetchCoupon`, `createNewCoupon` (returns the code), `modifyCoupon` (`PUT` by the original code, whole coupon), `patchCouponCall` (mixins and `metadata.mixins` only), `removeCoupon`, all bound to the host tenant in `coupons/src/hooks/api/coupons.ts`. Paths per api-calls: `/coupon/{tenant}/coupons[/{code}]`.
- Restriction selectors: `getCustomers` (only with Customers Viewer, `coupons/src/hooks/api/customers.ts`), `getSegmentsCall` (`segments.ts`), `getCategories` (`categories.ts`), `getVendorsCall` (`vendors.ts`); currencies: `fetchCurrencies` (`currencies.ts`).
- Media: `coupons/src/hooks/api/mediaAssets.ts` (copied from `orders`) wraps the api-calls asset calls; only the mixin reference selector reads assets through it (`useReferenceSelectorConfig.tsx`). No upload from the coupon screens, no direct HTTP.

## status-codes

Shared api-calls client (`status-codes/package.json` `@emporix/api-calls` 1.5.1), plus sites, configuration, feature toggles, and the IAM permission reads.

- Quote reasons (Quote Service): `getQuotesReasonsCall` (one page of 1000 with `X-Total-Count`), `getQuoteReasonByIdCall`, `createQuoteReasonCall` (returns the new id), `editQuoteReasonCall` (body carries `metadata.version`), `deleteQuoteReasonCall`, all bound to the host tenant in `status-codes/src/hooks/api/quoteReasons.ts`. Paths per api-calls: `/quote/{tenant}/quote-reasons[/{id}]`.
- No media, no direct HTTP.

## catalogs

Shared api-calls client (`catalogs/package.json` `@emporix/api-calls` 1.5.3), plus sites (`getSitesCall` through `SitesProvider`), configuration (incl. `ext_catalogs` table configuration via `updateSingleConfiguration`), feature toggles, and the IAM permission reads.

- Catalogs (Catalog Service): `fetchCatalogs` (sort, paging, and the filter fields `name.<lang>`, `publishedSite`, `visibilityFrom`, `visibilityTo`, `metadataUpdatedAt` as query params), `fetchCatalog`, `createNewCatalog` (returns the new id), `modifyCatalog` (`PUT` by the id in the body; deletes `status` from the object), `removeCatalog`, all bound to the host tenant in `catalogs/src/hooks/api/catalogs.ts`, which URL-encodes the id for get and delete (update sends it as is). Paths per api-calls: `catalog/{tenant}/catalogs[/{id}]`.
- Categories selector: `getCategories` and `fetchCategory` (`catalogs/src/hooks/api/categories.ts`, copied from `coupons`).
- No media, no direct HTTP.

## orders

Shared api-calls client (`@emporix/api-calls` 1.7.1), plus sites, configuration, feature toggles, and the two IAM permission reads.

Callers outside the hook files:

- Orders (`hooks/api/orders.ts`): list, get, put, patch, delete, status change, possible statuses, recalculate, add entries, CSV export, delivery note, shipping confirmation, invoice send, invoice link. Used from the orders table, order page, entry dialogs, and `OrderDocumentActions.tsx`. `getOrderInvoiceLink` is also called directly in `legacy/OrderInvoice.tsx`.
- Products: `fetchPaginatedProduct`, `fetchProductCall` (`hooks/api/products.ts`), used by `AddEntryDialog.tsx` (component-library `ProductsBrowser`), `legacy/EntryTableExpansion.tsx`, and the mixin reference selector.
- Customers: `getCustomers`, `getCustomer` (`hooks/api/customers.ts`), used by `OrderDetailsCustomer.tsx`.
- Payment gateway: `getPaymentMethodsCall` (orders table), `fetchTransactionCall` and `refundCall` (`OrderPaymentInfo.tsx`).
- Invoice job: `sendInvoiceJobCall` from `OrderDocumentActions.tsx` when the `PAYMENT_GATEWAY` toggle is on. `getInvoiceJobStatusCall` is wrapped in `hooks/api/invoice.ts` and has no caller outside that file.
- Audit Logs (Changelog) Service, in `orders/src/hooks/api/changelog.ts`: `getChangelogCursorPage` calls `listChangelogsWithCursorCall` from `@emporix/api-calls/next` (`GET /changelog/{tenant}/changelogs?pagination=cursor`, `next`/`prev` from the `x-next-cursor`/`x-prev-cursor` headers, no totals). `q` always carries the tab's date window as UTC instants (`changelogWindowQ` in the shared `audit-log/src/window/changelogWindow.ts`, `buildChangelogQ` with an `occurredAt` range); the tab is the shared `EntityChangelog` from `audit-log/` (`ai-project-knowledge/modules/audit-log.md`).
- Schema: `getSchemasCall`, `getSchemaCall`, `getReferencesCall`, `getReferenceCall` (`hooks/api/schema.ts`). Mixin JSON is `getMixinsSchemaCall(url)` with an absolute URL from schema metadata (`components/mixins/useMixinsForm.tsx`). The host is that URL. `components/mixins/helpers.ts` matches Cloudinary `res.cloudinary.com/saas-ag/raw/upload/schemata2/...` URLs; it does not itself send HTTP.
- Configuration sync flag: `OrdersTable.tsx` calls `getSyncBetweenRestrictionsAndSiteCodes`.
- Mixin reference fields (`components/mixins/useReferenceSelectorConfig.tsx`, `context/ReferenceOptionsProvider.tsx`): carts (`getCartByIdCall`, `searchCartsCall`), segments, custom entities and instances, legal entities, media assets, category trees, and orders (`getAllOrders`) through `hooks/api/*.ts`.
- Host links: reference chips navigate the host with `window.location.assign` to paths built in `orders/src/helpers/hostUrls.ts` (`/apps/management/products#/<id>`, media assets, categories, price lists, companies, segments, custom instances).

`helpers/images.ts` rewrites image URLs that contain `cloudinary` before they are used as image sources. That is not a Cloudinary Admin API client. `window.open` in `OrderDocumentActions.tsx` opens a blob URL for a delivery-note PDF, not a remote host.

## products

Shared api-calls client (`products/package.json` `@emporix/api-calls` 1.7.1, `products/src/api/bootstrap.ts`), plus sites, configuration, feature toggles, and IAM permission reads. The legacy axios modules under `products/src/api/` were replaced when COP-6993 re-scaffolded the remote; only `bootstrap.ts` and `sites.ts` remain there.

Calls used by the screens (`products/src/hooks/api/*.ts`):

- Products and templates: `fetchPaginatedProduct`, `fetchProductCall` (plain read; with `{ rawValue: true }` before a variant save, for the variant's own `metadata.overridden`), `deleteProductWithForceCall` (force for dynamic variants), `triggerDynamicVariantRecalculationCall`, `fetchProductTemplatesCall` (`products.ts`).
- Catalog: `getCategoryTreesCall` (`categoryTree.ts`; its `type` filter depends on backend change COP-6124), `assignProductToCategoryCall`, `deleteAssignmentToCategoryCall` (`categories.ts`), `fetchBrands`, `fetchLabels`.
- Pricing and stock: `searchPricesCall`, `createPriceV2Call` (`prices_v2.ts`), `searchAvailabilitiesCall` (`availability.ts`).
- Platform: `fetchBasicConfiguration`, `updateSingleConfiguration` (`configuration.ts`), `getFeatureToggleValuesCall` (`featureToggles.ts`), IAM access controls and scopes (`iam.ts`), `getVendors` (`vendors.ts`), `generateTextRequest` (`ai.ts`), `getChangelogCursorPage` (`changelog.ts`: `listChangelogsWithCursorCall` from `./next`, cursor paging inside the tab's date window, sent as UTC instants), `getSitesCall` (`products/src/api/sites.ts`).
- Mixin reference fields: the same reference-option clients as orders (`context/ReferenceOptionsProvider.tsx`).

Host links use `window.location.assign` with paths from `products/src/helpers/hostUrls.ts`. Other `hooks/api/*` clients (carts, orders, customers, segments, units, currencies, countries, schema, custom instances) were not traced to a caller; see `ai-project-knowledge/modules/products.md`.

## returns

Shared api-calls client (`@emporix/api-calls` 1.5.1), plus sites, configuration, feature toggles, and the two IAM permission reads.

- Returns: `getReturnsCall`, `getReturnsDetailsCall`, `createReturnCall`, `updateReturnCall`, `patchReturnCall`, `deleteReturnCall` (`hooks/api/returns.ts`), used by `ReturnsTable.tsx`, `ReturnEdit.page.tsx`, and `ReturnForm.provider.tsx`.
- Orders: `getOrdersCall` and `getOrder` (`hooks/api/orders.ts`). `ReturnForm.provider.tsx` loads orders without a site; the mixin reference selector loads the current site's orders (`syncOrders`).
- Customers: `getCustomers`, `getCustomer`, used by `ReturnForm.provider.tsx`.
- Schema and mixin absolute-URL GET: same shape as orders (`hooks/api/schema.ts`, `components/mixins/useMixinsForm.tsx`, Cloudinary schemata2 matcher in `components/mixins/helpers.ts`).
- Mixin reference fields and host links: same clients and `hostUrls.ts` helpers as orders (`returns/src/context/ReferenceOptionsProvider.tsx`, `returns/src/helpers/hostUrls.ts`).

## statistics

`fetch` in `statistics/src/api.ts`. URL is `VITE_API_URL` concatenated with a path that already starts with `/`. No empty-base check, no timeout, no retry. Headers: `Content-Type: application/json`, `emporix-tenant`, `Authorization: Bearer`. When the auth tenant is one of three names hardcoded in that file, that name is sent as the header tenant; otherwise the data tenant is sent. The names are not recorded here.

GET paths:

- `/statistics/emporix/allTenants`
- `/auth-adapter/users/me/tenants`
- `/statistics/{dataTenant}/usages/apicalls` (also with `expand=proxy`)
- `/statistics/{dataTenant}/usages/make`
- `/statistics/{dataTenant}/usages/mongodbStorage`
- `/statistics/{dataTenant}/usages/cloudinary`
- `/statistics/{dataTenant}/usages/webhooks`
- `/statistics/{dataTenant}/usages/ai`

Those usage paths read Emporix statistics. This extension does not call Make, MongoDB, Cloudinary, or a webhook receiver itself. `src/views/CloudinaryView.tsx` only renders that statistics payload.

## users-and-groups

Shared api-calls client (`@emporix/api-calls` 1.7.1). Same IAM screen usage as customer-groups (groups, users, membership, scopes, access controls). Same vendor note: only `getVendors` is called from `GroupDetailsGeneralFormRolesVendor.tsx`; other wrappers in `hooks/api/vendors.ts` have no caller outside that file. Configuration-restriction calls match customer-groups (`GroupDetailsGeneralForm.tsx`).

- Audit Logs (Changelog) Service, in `users-and-groups/src/hooks/api/changelog.ts`: `getChangelogCursorPage` calls `listChangelogsWithCursorCall` from `@emporix/api-calls/next` (`GET /changelog/{tenant}/changelogs?pagination=cursor`, `next`/`prev` from the `x-next-cursor`/`x-prev-cursor` headers, no totals). `q` always carries the tab's date window as UTC instants (`changelogWindowQ` in the shared `audit-log/src/window/changelogWindow.ts`, `buildChangelogQ` with an `occurredAt` range); the tab is the shared `EntityChangelog` from `audit-log/` (`ai-project-knowledge/modules/audit-log.md`). No legal-entity client was found under `users-and-groups/src`.

## companies

Shared api-calls client (`companies/package.json` `@emporix/api-calls` 1.7.1), plus sites, configuration (table config `ext_companies`, `restrictions` values), feature toggles, schemas and mixins, the changelog (audit log), and the IAM permission reads.

- Audit Logs (Changelog) Service, in `companies/src/hooks/api/changelog.ts`: `getChangelogCursorPage` calls `listChangelogsWithCursorCall` from `@emporix/api-calls/next` (`GET /changelog/{tenant}/changelogs?pagination=cursor`, `next`/`prev` from the `x-next-cursor`/`x-prev-cursor` headers, no totals). `q` always carries the tab's date window as UTC instants (`changelogWindowQ` in the shared `audit-log/src/window/changelogWindow.ts`, `buildChangelogQ` with an `occurredAt` range); the tab is the shared `EntityChangelog` from `audit-log/` (`ai-project-knowledge/modules/audit-log.md`). The entry type is the `./next` `ChangelogEntry`.

- Customer Management Service, bound to the host tenant in `companies/src/hooks/api/customerManagement.ts`: legal entities (`fetchLegalEntitiesCall`, `fetchLegalEntityCall`, `createLegalEntityCall`, `updateLegalEntityCall` — also used for the approval group and mixins, `deleteLegalEntityCall`), locations (`fetchLocationCall`, `createLocationCall` — POST then PUT of the legal entity, `updateLocationCall`, `deleteLocationCall`), contact assignments (`fetchContactsForEntityCall`, `fetchContactAssignmentCall`, `createContactFlow`, `updateContactFlow`, `deleteContactAssignmentCall`). Paths per api-calls: `/customer-management/{tenant}/legal-entities`, `/locations`, `/contact-assignments`.
- Customer Service, in `companies/src/hooks/api/customers.ts`: `getCustomers`, `getCustomer`, `addCustomer`, `updateCustomer`, `patchCustomerCall`, `removeCustomer`, `addCustomerAddress`, `updateCustomerAddress`.
- No media, no direct HTTP.

## customers

Shared api-calls client (`customers/package.json` `@emporix/api-calls` 1.7.1), plus sites, configuration (table config `ext_customers`, `restrictions`, `enableSyncBetweenRestrictionsAndSiteCodes`), feature toggles, schemas and mixins, the changelog (audit log), and the IAM permission reads.

- Audit Logs (Changelog) Service, in `customers/src/hooks/api/changelog.ts`: `getChangelogCursorPage` calls `listChangelogsWithCursorCall` from `@emporix/api-calls/next` (`GET /changelog/{tenant}/changelogs?pagination=cursor`, `next`/`prev` from the `x-next-cursor`/`x-prev-cursor` headers, no totals). `q` always carries the tab's date window as UTC instants (`changelogWindowQ` in the shared `audit-log/src/window/changelogWindow.ts`, `buildChangelogQ` with an `occurredAt` range); the tab is the shared `EntityChangelog` from `audit-log/` (`ai-project-knowledge/modules/audit-log.md`).
- Customer Service, in `customers/src/hooks/api/customers.ts`: `getCustomers`, `getCustomer`, `addCustomer`, `updateCustomer`, `patchCustomerCall`, `removeCustomer`, `addCustomerAddress`, `updateCustomerAddress`, `patchCustomerAddress`, `removeCustomerAddress`, `getAssistedBuyingLoginCall` (its tokens go into the assisted-buying storefront URL).
- Coupon Service: `fetchCoupons` for the referral coupon (`customers/src/hooks/api/coupons.ts`). IAM: `getAllGroupsForUserCall`. Customer Segments: `getSegmentsCall` with `customerId`. Legal entities (`customers/src/hooks/api/customerManagement.ts`) only for company mixin reference fields.
- No media, no direct HTTP.

## categories

Shared api-calls client (`categories/package.json` `@emporix/api-calls` ^1.5.3), plus sites, configuration (table config `ext_categories` via `updateSingleConfiguration` in `context/ConfigurationProvider.tsx`), feature toggles, schemas and mixins, the IAM permission reads, and the mixin reference selectors (copied from `orders` / `products`).

- Category Service, bound to the host tenant in `categories/src/hooks/api/categories.ts`: `getCategories` (paged list; `STANDARD`, unpublished included), `fetchCategory`, `createNewCategory` (returns the id), `modifyCategory` (PUT, whole category), `patchCategoryCall` (tree quick edit, moves, renumbering, mixins; needs `metadata.version`, re-read with `fetchCategory` first in the tree), `deleteSingleCategory` (with subcategories), `getSubcategoriesCall`, `getCategoryParentsCall`.
- Category trees, in `categories/src/hooks/api/categoryTree.ts`: `getCategoryTreesCall` (`type` filter depends on backend change COP-6124), `rebuildCategoryTreeCall` (per root category), `getCategoryParentsCall` with unpublished ancestors. `categoryTreeRebuild.ts` resolves the roots of changed categories (404 from `/parents` = root) and rebuilds them after every create, update, move and delete, ignoring roots that answer 404.
- Media, in `categories/src/hooks/api/mediaAssets.ts`: `getAssetsForId`, `postFileAsset` (ref type `CATEGORY`), `delAsset`, `downloadAsset`, used by the media tab (`hooks/useCategoryMedia.ts`); `fetchAsset` and `putAsset` are wrapped too.
- Host links: a media asset opens `/media-assets/<id>` with `window.location.assign` (`categories/src/helpers/hostUrls.ts`). No direct HTTP.

## classifications

Shared api-calls client (`classifications/package.json` `@emporix/api-calls` ^1.5.3), plus sites, configuration (table config `ext_classifications` read with `fetchSingleConfiguration` and written with `updateSingleConfiguration` in `hooks/useClassificationsTableConfig.ts`, since `fetchBasicConfiguration` does not return that key), feature toggles and the IAM permission reads. No media, no mixins engine and no reference selectors.

- Category Service, bound to the host tenant in `classifications/src/hooks/api/categories.ts`: `getCategories` (paged list with unpublished included, and the parent selector with published only; `CLASSIFICATION`), `fetchCategory`, `createNewCategory` (returns the id), `modifyCategory` (PUT, whole category with `type: CLASSIFICATION` and `ownClassificationMixins`), `patchCategoryCall` (tree quick edit, moves, renumbering; needs `metadata.version`, re-read with `fetchCategory` first), `deleteSingleCategory` (with subcategories); `getSubcategoriesCall` and `getCategoryParentsCall` are wrapped there without a caller.
- Category trees, in `classifications/src/hooks/api/categoryTree.ts`: `getCategoryTreesCall` with `type: CLASSIFICATION` (the filter depends on backend change COP-6124), `rebuildCategoryTreeCall` (per root category), `getCategoryParentsCall` with unpublished ancestors. `categoryTreeRebuild.ts` resolves the roots of changed classifications (404 from `/parents` = root) and rebuilds them after every create, update, move and delete, ignoring roots that answer 404.
- Schemas, in `classifications/src/hooks/api/schema.ts`: `getSchemasCall` with type `CLASSIFICATION` (the Emporix schemas offered in a schema tile) and `getSchemaCall` (the stored older version of a schema, for the version diff). `getReferencesCall`, `getReferenceCall` and `getMixinsSchemaCall` are wrapped without a caller.
- Direct HTTP: an own classification schema is read with `fetch` from the URL the user typed into the tile, once it passes `isSchemaUrlValid` (`http(s)`, path ending in `.json`); no token is added (`classifications/src/components/classifications/ClassificationMixinsTileForm.tsx`).
- No host links.

## quotes

Own api-calls client (`quotes/package.json` `@emporix/api-calls` 1.7.1; `quotes/src/api/bootstrap.ts` creates it with `createApiCredentials` and `createApiClient` from `./next`). The remote's own calls use the `./next` entry with the host tenant as `options.tenant`; the shared Tier 1 hooks stay on the package root, except the audit log, which pages by cursor on `./next` (`quotes/src/hooks/api/changelog.ts`: `listChangelogsWithCursorCall`, `q` with the tab's date window as UTC instants). Also used: sites, configuration (table config `ext_quotes`, `restrictions` values, `enableSyncBetweenRestrictionsAndSiteCodes`), feature toggles, schemas and mixins, the changelog (audit log), and the IAM permission reads.

- Quote Service on `./next`, bound to the host tenant in `quotes/src/hooks/api/quotes.ts`: `listQuotesCall` (paging and filters from `fromDataTableState` of `./primereact`, the site as an `eq` filter on `siteCode`), `getQuoteCall`, `createQuoteCall` (returns the new id), `patchQuoteCall` (patch operations, also for status changes), `deleteQuoteCall`, `generateQuotePdfCall` (the PDF shown on the Approval tab), `listQuoteReasonsCall` (one page of 1000). The hooks return MD's shapes (`{ data, totalRecords }`).
- Price Service `matchPricesCall` on `./next` (`quotes/src/hooks/api/prices.ts`, `X-Version: v2`), shipping zones `listShippingZonesCall` on `./next` with `expand: 'methods,fees'` (`shipping.ts`; zone and method names are mapped to the English translation, as MD read them with `Accept-Language: en`), tax calculation `calculateTaxCall` on the root (`taxes.ts`).
- Customer Management Service legal entities and contacts (`customerManagement.ts`) and Customer Service customers (`customers.ts`) for the B2B and B2C parties; products and categories (`products.ts`, `categories.ts`) for the CL `ProductsBrowser`.
- No media, no direct HTTP.

## sites-settings

Shared api-calls client (`sites-settings/package.json` `@emporix/api-calls` 1.7.1), plus configuration, feature toggles, schemas and mixins (mixin reference fields as in `customers`), the changelog (audit log), and the IAM permission reads.

- Site Service on `./next`, bound to the host tenant in `sites-settings/src/hooks/api/sites.ts`: `fetchAll(listSitesCall, { includeInactive })` (inactive sites only for Sites Manager), `getSiteCall` with `expand: 'mixin:*'`, `createSiteCall` (returns the new code), `updateSiteCall` (PUT of the loaded site with the form on top, so mixins and metadata stay), `patchSiteCall` (a saved mixin: `mixins` plus `metadata.mixins[key]`), `deleteSiteCall`. `SitesProvider` reads the active sites with `fetchAll(listSitesCall)` (`sites-settings/src/api/sites.ts`).
- Payment Gateway `listPaymentModesCall` on `./next` (`sites-settings/src/hooks/api/paymentGateway.ts`); a mode becomes a site payment entry `{ id, active, name: code, serviceType: provider, serviceUrl: '' }` as in MD.
- Country Service `listCountriesCall` on `./next` (`sites-settings/src/hooks/api/countries.ts`), currencies `fetchCurrencies` (`currencies.ts`).
- Audit Logs (Changelog) Service as in `customers` (`sites-settings/src/hooks/api/changelog.ts`, entity `site`).
- Host callback: after a successful create, update, mixin save or delete the remote calls the optional `appState.onSitesChanged` (`sites-settings/src/hooks/useNotifySitesChanged.ts`); the Management Dashboard passes its `SitesProvider.refreshSites`.
- No media, no direct HTTP.
