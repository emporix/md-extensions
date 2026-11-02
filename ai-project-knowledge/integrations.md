# Integrations

Last scanned: da99643 (2026-11-02)
Sources: `agentic-ai/src/services`, `agentic-ai/src/components/tool`, `algolia-synonyms/src`, `brands/src`, `brands/package.json`, `customer-groups/src`, `customer-groups/package.json`, `dashboard/src/dashboard/api`, `dashboard/src/dashboard/widgets/OrdersByCountryMapWidget/OrdersByCountryMapWidget.tsx`, `dashboard/src/vite-env.d.ts`, `orders/src`, `orders/package.json`, `products/src/api`, `products/src/context`, `products/package.json`, `returns/src`, `returns/package.json`, `statistics/src/api.ts`, `users-and-groups/src`, `users-and-groups/package.json`, `.github/workflows`

Ten UI extensions call the Emporix HTTP API. Nine take the base URL from `VITE_API_URL`. `algolia-synonyms` takes it from the host callback field `emporixApiUrl`. No `.env*` file was opened. Env names below are names only. No literal API key, token, or tenant id was found in source; UI strings in `agentic-ai/src/translations/en/index.ts` label fields such as an API key and a client secret and are not values. HTTP paths inside `@emporix/api-calls` were not read (`node_modules` skipped), so those paths are unknown.

Firebase Hosting deploy and preview workflows under `.github/workflows/*firebase*.yaml` are deployment only and are not a runtime API.

`vite.config.ts` `corsOrigins` entries (`https://admin.emporix.io`, `https://dev-admin.emporix.io`, `https://stage-admin.emporix.io`, `http://localhost:4200`) are allowed browser origins for the remote, not outbound calls.

## Shared Emporix client

### `@emporix/api-calls` (axios)

`orders` 1.2.14, `customer-groups` 1.2.9, `brands` 1.2.1, `returns` 1.2.1, `users-and-groups` 1.2.1 (`*/package.json`). Each `src/api/bootstrap.ts` calls `createApiClient` with `baseURL` `VITE_API_URL` and throws `VITE_API_URL is not configured` when that value is missing. The access token and tenant come from the host via `setApiCredentials` / `useApiCredentials`. Retry and the concrete URL paths live in the package and are unknown here.

Screens that only check permissions call `getAccessControlsTemplates` and `getScopesForUser` (`*/src/context/PermissionsProvider.tsx` in orders, returns, and brands). `hooks/api/iam.ts` in those three also imports user, group, scope, and access-control mutators. No file outside that hook imports `useIamApi` except `PermissionsProvider`, so those mutators have no caller outside the hook.

`customer-groups` and `users-and-groups` do call IAM from group and user screens (`GroupsTable`, `UsersTable`, `Group.provider`, `GroupPageActions`, `GroupMembers`, `GroupAddMembersDialog`, `User.page`, `UserAccessForm`). Wrapped calls cover groups, users, membership, scopes, and access controls. Paths unknown.

All five also call:

- Sites: `getSitesCall` from `src/api/sites.ts`, used by `src/context/SitesProvider.tsx`.
- Feature toggles: `getFeatureToggleValuesCall` from `src/hooks/api/featureToggles.ts`, used by `src/context/FeatureTogglesProvider.tsx`.
- Configuration: `fetchBasicConfiguration` and `updateSingleConfiguration` from `src/context/ConfigurationProvider.tsx`. `fetchSingleConfiguration`, `updateSingleConfiguration`, `createSingleConfiguration` (on 404 from update), and `deleteSingleConfiguration` are wrapped in `src/hooks/api/configuration.ts`.

### Direct HTTP

Bearer token plus an Emporix tenant header. Products and the api-calls client also send language headers. Dashboard retries idempotent GETs. The others do not retry in this repo.

## agentic-ai

`fetch` in `agentic-ai/src/services/apiClient.ts`. Base URL is `VITE_API_URL`, or the literal `https://api.emporix.io` when that env value is missing. Headers: `Authorization: Bearer`, `Emporix-tenant`, `Content-Type: application/json`, `Content-Language: *`, `Accept-Language: *`. `postSse` sets `Accept: text/event-stream`. No retry loop. `getArrayBuffer` refuses bodies larger than `MAX_ZIP_DOWNLOAD_BYTES` (`agentic-ai/src/constants/zipLimits`).

Paths on that base URL:

- AI service (`agentic-ai/src/services/agentService.ts`, `toolsService.ts`, `tokensService.ts`, `oauthService.ts`, `mcpService.ts`, `modelsService.ts`, `logService.ts`, `jobService.ts`, `conversationsService.ts`, `analyticsService.ts`): `/ai-service/{tenant}/agentic/agents` (GET, PUT, PATCH, DELETE with optional `?force=true`), `/ai-service/{tenant}/agentic/agents/export` (POST), `/ai-service/{tenant}/agentic/agents/import` (POST), `/ai-service/{tenant}/agentic/templates` (GET), `/ai-service/{tenant}/agentic/templates/{id}/agents` (POST), `/ai-service/{tenant}/agentic/chat` (POST), `/ai-service/{tenant}/agentic/chat-stream` (POST SSE; optional `session-id` header), `/ai-service/{tenant}/agentic/commerce-events` (GET), `/ai-service/{tenant}/agentic/tools` (GET, PUT, PATCH, DELETE, optional `force`), `/ai-service/{tenant}/agentic/tokens` (GET, PUT, DELETE, optional `force`), `/ai-service/{tenant}/agentic/oauths` (GET, PUT, PATCH, DELETE, optional `force`), `/ai-service/{tenant}/agentic/mcp-servers` (GET, PUT, PATCH, DELETE, optional `force`), `/ai-service/{tenant}/agentic/models` (GET), `/ai-service/{tenant}/agentic/oauth/installations/slack` (GET), `/ai-service/{tenant}/agentic/oauth/installations/teams` and `.../teams/status` (GET), `/ai-service/{tenant}/agentic/logs/requests` and `/ai-service/{tenant}/agentic/logs/sessions` (GET), `/ai-service/{tenant}/jobs` (GET), `/ai-service/{tenant}/agentic/conversations` (GET), `/ai-service/{tenant}/agentic/analytics` (GET, in-memory cache in `analyticsService.ts`).
- Feature toggle (`featureToggleService.ts`): GET `/feature-toggle/{tenant}/features?pageNumber=1&pageSize=1000`.
- IAM (`iamScopesService.ts`): GET `/iam/{tenant}/scopes` and `/iam/{tenant}/users/me/scopes`.
- Indexing (`indexingService.ts`): GET and POST `/indexing/{tenant}/reindex-jobs`.
- RAG indexer (`aiRagIndexerService.ts`): GET `.../rag-metadata` and `.../filter-metadata`, POST `.../reindex` under `/ai-rag-indexer/{tenant}/{entityType}`.
- Schema (`schemaService.ts`): GET `/schema/{tenant}/custom-entities`.
- Webhook (`agentService.ts` `fetchEventSubscriptions`): GET `/webhook/{tenant}/event-subscriptions`.
- Automation and media (`hostingFunctionsService.ts`): GET `/automation/{tenant}/projects/functions` and `.../functions/{id}/deployments` (404 and 403 are handled in that file), GET `/media/{tenant}/assets/{id}/download` as an array buffer.

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

Shared api-calls client (`@emporix/api-calls` 1.2.9). IAM group and user screens call the IAM wrappers described above.

Also:

- Vendors: `GroupDetailsGeneralFormRolesVendor.tsx` calls `getVendors`. `hooks/api/vendors.ts` also wraps `getVendor`, `postVendor`, `putVendor`, `deleteVendor`, and location calls. No caller of those other wrappers was found outside that file.
- Legal entities: `CompanySelector.tsx` calls `getLegalEntities` and `getLegalEntity` (`fetchLegalEntitiesCall`, `fetchLegalEntityCall` in `hooks/api/customerManagement.ts`).
- Changelog: `EntityChangelogTab.tsx` calls `getEntityChangelog` (`getChangelogs`).
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

## orders

Shared api-calls client (`@emporix/api-calls` 1.2.14), plus sites, configuration, feature toggles, and the two IAM permission reads.

Callers outside the hook files:

- Orders (`hooks/api/orders.ts`): list, get, put, patch, delete, status change, possible statuses, recalculate, add entries, CSV export, delivery note, shipping confirmation, invoice send, invoice link. Used from the orders table, order page, entry dialogs, and `OrderDocumentActions.tsx`. `getOrderInvoiceLink` is also called directly in `legacy/OrderInvoice.tsx`.
- Products: `fetchPaginatedProduct`, `fetchProductCall` (`hooks/api/products.ts`), used by entry dialogs.
- Customers: `getCustomers`, `getCustomer` (`hooks/api/customers.ts`), used by `OrderDetailsCustomer.tsx`.
- Payment gateway: `getPaymentMethodsCall` (orders table), `fetchTransactionCall` and `refundCall` (`OrderPaymentInfo.tsx`).
- Invoice job: `sendInvoiceJobCall` from `OrderDocumentActions.tsx` when the `PAYMENT_GATEWAY` toggle is on. `getInvoiceJobStatusCall` is wrapped in `hooks/api/invoice.ts` and has no caller outside that file.
- Changelog: `getChangelogs` from `EntityChangelogTab.tsx`.
- Schema: `getSchemasCall`, `getSchemaCall`, `getReferencesCall`, `getReferenceCall` (`hooks/api/schema.ts`). Mixin JSON is `getMixinsSchemaCall(url)` with an absolute URL from schema metadata (`components/mixins/useMixinsForm.tsx`). The host is that URL. `components/mixins/helpers.ts` matches Cloudinary `res.cloudinary.com/saas-ag/raw/upload/schemata2/...` URLs; it does not itself send HTTP.
- Configuration sync flag: `OrdersTable.tsx` calls `getSyncBetweenRestrictionsAndSiteCodes`.

`helpers/images.ts` rewrites image URLs that contain `cloudinary` before they are used as image sources. That is not a Cloudinary Admin API client. `window.open` in `OrderDocumentActions.tsx` opens a blob URL for a delivery-note PDF, not a remote host.

## products

Axios instance in `products/src/api/index.ts`, `baseURL` `import.meta.env.VITE_API_URL` (no throw when it is missing). `products/src/context/ApiProvider.tsx` sets `Authorization: Bearer`, `Emporix-Tenant`, `Accept-Language` (default `*`), `Content-Language: *`, and rejects 401 through the host `onError`. No retry interceptor. `axios-retry` is in `products/package.json` and is not imported under `products/src`.

Paths are those written in `products/src/api/` (whether every export is mounted on a page was not fully traced):

- Product: `/product/{tenant}/products` and `/product/{tenant}/product-templates` (GET, POST, PUT, PATCH, DELETE). One products list GET sends `x-version: v2` (`products.ts`). Media: `/product/{tenant}/products/{id}/media` and `.../media2` (`products.ts`, `productsMedia.ts`).
- Category: `/category/{tenant}/categories` including assignments, parents, subcategories, with header `x-version: v2` (`categories.ts`). PATCH is `/category/{tenant}/categories/{id}` plus an optional `publish` query.
- Price: `price/{tenant}/prices`, `price/{tenant}/prices/search`, `price/{tenant}/prices/matchProductCurrency`, `price/{tenant}/match-prices`, `price/{tenant}/priceModels`. `prices_v2.ts` and `priceModels.ts` send `x-version: v2`. `prices.ts` sends `x-version: v2` on search.
- Availability: `availability/{tenant}/availability/{productId}` GET, PUT, POST.
- Brand list: GET `brand/brands` (no tenant segment in the string). Label list: GET `label/labels`.
- Site: `site/{tenant}/sites` GET, POST, PUT, DELETE.
- Supplier: `/supplier/suppliers` and `/supplier/PSRelations/{productId}/{siteCode}` (no tenant segment).
- Tax: `tax/{tenant}/taxes` and PUT `tax/{tenant}/taxes/calculation-commands`.
- Currency: `currency/{tenant}/currencies` and `currency/{tenant}/exchanges`.
- Country: `country/{tenant}/countries` and `country/{tenant}/regions`; PATCH `country/{tenant}/countries/{code}`.
- Schema: `schema/{tenant}/types`, `references`, `schemas`, including POST `schema/{tenant}/schemas/file`.
- Configuration: GET `/configuration/{tenant}/basic-configuration`, GET and PUT `/configuration/{tenant}/configurations/{key}`, POST `/configuration/{tenant}/configurations/`.
- Media assets: `/media/{tenant}/assets` POST, GET, PUT, DELETE.
- AI text: POST `ai-service/{tenant}/texts` (`ai.ts`).

Mixin schemas: `products/src/api/mixins.ts` does `axios.get` on the absolute URL passed in (not the Emporix `baseURL`). `ProductDataProvider.tsx` stores `https://res.cloudinary.com/saas-ag/raw/upload/v1684918636/jsonschemas/subscription.json` plus a random query as the subscription mixin schema URL. `helpers/images.ts` only rewrites Cloudinary image URLs for display.

## returns

Shared api-calls client (`@emporix/api-calls` 1.2.1), plus sites, configuration, feature toggles, and the two IAM permission reads.

- Returns: `getReturnsCall`, `getReturnsDetailsCall`, `createReturnCall`, `updateReturnCall`, `patchReturnCall`, `deleteReturnCall` (`hooks/api/returns.ts`), used by `ReturnsTable.tsx`, `ReturnEdit.page.tsx`, and `ReturnForm.provider.tsx`.
- Orders: `getOrdersCall` (`hooks/api/orders.ts`), used by `ReturnForm.provider.tsx`.
- Customers: `getCustomers`, `getCustomer`, used by `ReturnForm.provider.tsx`.
- Schema and mixin absolute-URL GET: same shape as orders (`hooks/api/schema.ts`, `components/mixins/useMixinsForm.tsx`, Cloudinary schemata2 matcher in `components/mixins/helpers.ts`).

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

Shared api-calls client (`@emporix/api-calls` 1.2.1). Same IAM screen usage as customer-groups (groups, users, membership, scopes, access controls). Same vendor note: only `getVendors` is called from `GroupDetailsGeneralFormRolesVendor.tsx`; other wrappers in `hooks/api/vendors.ts` have no caller outside that file. Changelog and configuration-restriction calls match customer-groups (`EntityChangelogTab.tsx`, `GroupDetailsGeneralForm.tsx`). No legal-entity client was found under `users-and-groups/src`.
