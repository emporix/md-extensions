# Domain

Last scanned: 05d8d1d (2026-11-06)
Sources: `README.md`, `docs/MIGRATED_MODULES.md`, `status-codes/src/models/QuoteReason.model.ts`, `status-codes/src/configs/accessControls.ts`, `returns/README.md`, `orders/README.md`, `users-and-groups/README.md`, `customer-groups/README.md`, `brands/README.md`, `products/README.md`, `statistics/README.md`, `dashboard/README.md`, `agentic-ai/README.md`, `algolia-synonyms/README.md`, `*/src/models/AppState.model.ts`, `*/src/RemoteComponent.tsx`, `agentic-ai/src/types/common.ts`, `agentic-ai/src/types/Agent.ts`, `orders/src/models/Order.model.ts`, `returns/src/models/Returns.model.ts`, `users-and-groups/src/models/Groups.model.ts`, `users-and-groups/src/models/User.model.ts`, `products/src/models/Category.model.ts`, `products/src/models/PriceModel.model.ts`, `products/src/helpers/dynamicVariants/inheritableFields.helpers.ts`, `products/src/helpers/parentVariantPath.ts`, `products/src/helpers/variantMixinOverrides.helpers.ts`, `products/src/components/mixins/helpers.ts`, `orders/src/components/mixins/useMixinsForm.tsx`, `returns/src/helpers/returnsSiteAccess.ts`, `labels/src/models/Label.model.ts`, `labels/src/configs/accessControls.ts`, `users-and-groups/src/configs/accessControls.ts`, `agentic-ai/src/utils/constants.ts`, `dashboard/src/dashboard/data/widgetRegistry.tsx`, `statistics/src/models/Statistics.model.ts`, `algolia-synonyms/src/App.jsx`

## What this repository is

Each top-level folder is a Management Dashboard extension, loaded by the host as its own module-federation remote. There is no shared domain package. `docs/MIGRATED_MODULES.md` lists playbook-aligned remotes `users-and-groups`, `customer-groups`, `brands`, `returns`, `orders`, `products`, and `labels`, and treats `statistics`, `dashboard`, `agentic-ai`, and `algolia-synonyms` as other remotes. `README.md` does not name those folders; it describes one local app and a B2B Showcase disclaimer.

## Embed contract

There is no shared `AppState` type. Each remote declares its own. Confirmed by opening the files below.

Fields present on every opened `AppState`: `tenant`, `language`, `token`.

| Remote | `AppState` | `RemoteComponent` |
|---|---|---|
| `returns`, `orders` | `tenant`, `language`, `token`, optional `currency`, `contentLanguage`, optional `user`, `onError`. No permissions field. | `appState` required. |
| `products` | Same shape, with `currency` required. No permissions field. | `appState` required. |
| `brands`, `users-and-groups`, `customer-groups`, `labels`, `status-codes` | Same shape as returns/orders. | `appState` optional; fallback tenant/token `'default'`, language and content language `'en'`. |
| `dashboard` | `tenant`, `language`, `token`, required `currency` and `user`, optional `permissions`. No `onError`. | Optional. Missing tenant or token renders “Missing required configuration”. Omitted language and content language become `'en'`. Omitted currency becomes `id`/`label` `EUR`, `default: true`. |
| `statistics` | `tenant`, `language`, `token` only. | Optional; fallback tenant/language/token `'default'`. |
| `agentic-ai` | `tenant`, `language`, `token`, `contentLanguage` in `agentic-ai/src/types/common.ts`. The provider keeps only those four. | Optional; same four-field fallback, content language `'en'`. UI language is `en` or `de`; anything else becomes `en`. |
| `algolia-synonyms` | No `AppState` and no `RemoteComponent`. | Host context arrives through `md-ext` `registerCallback`: `emporixApiUrl`, `tenant`, `accessToken`. |

`currency` on returns is `Currency`, an alias of `Entry` (`id`, `label`, `default`, `required`) in `returns/src/models/Configuration.model.ts`. Dashboard `Entry` has the same four fields in `dashboard/src/shared/models/AppState.model.ts`. Orders, brands, users-and-groups, and customer-groups import `Currency` the same way; their `Entry` bodies were not re-read.

`user` on the returns/orders shape is `SessionUser`: `userId`, optional name and email, `termsAndConditions` (`orders/src/models/SessionUser.model.ts`). Dashboard `User` has the same fields (`dashboard/src/shared/models/AppState.model.ts`).

Returns and orders READMEs say permissions are not on `AppState`; the remote fetches IAM access controls with the token. Products does the same since the COP-6993 re-scaffold (`products/src/context/PermissionsProvider.tsx`). Dashboard uses `permissions.systemPreferences.manager` from the host (`dashboard/src/dashboard/pages/DashboardPage.tsx`).

Standalone READMEs for returns, orders, users-and-groups, customer-groups, brands, products, statistics, and dashboard ask for tenant, JWT, and language `en` or `de`. That prompt UI was not opened. Agentic README states English and German i18n; the `en`/`de` clamp is in `agentic-ai/src/RemoteComponent.tsx`.

## Copied vocabulary

These names are declared per remote, not imported from one module.

- **Tenant** — string on `AppState`. Statistics responses also carry `tenant` (`statistics/src/models/Statistics.model.ts`). How data is partitioned is unknown — not found in these remotes.
- **Token** — JWT string on `AppState`, passed into API credentials (`returns/src/RemoteComponent.tsx`, `orders/src/RemoteComponent.tsx`). Algolia uses `accessToken` on the callback context (`algolia-synonyms/src/App.jsx`).
- **Language** — UI language string. **Content language** — catalog language, present on the returns/orders shape, products, dashboard, and agentic. Statistics has no content language.
- **Site** — storefront: `code`, `name`, `currency`, `default`, `active`, languages, ship-to countries (`orders/src/models/Site.model.ts`). Tax determination is `BILLING_ADDRESS` or `SHIPPING_ADDRESS`. A `Site` interface is also declared under `brands`, `returns`, `users-and-groups`, and `customer-groups`; only the orders file was read field by field. Dashboard uses a smaller `DashboardSite` (`code`, `name`, `currency`, optional `default`) in `dashboard/src/dashboard/models/DashboardContext.types.ts`.
- **Mixin** — open map of custom data (`returns/src/models/Mixins.model.ts`). Property types: `string`, `number`, `boolean`, `array`, `object`, `null`, `integer`. Formats: `time`, `date`, `date-time`. The same enums are declared under orders, brands, products, users-and-groups, and customer-groups; only the returns file was read. `orders`, `returns`, and `products` carry a port of the Management Dashboard mixins engine: localized values as v1 arrays or v2 language maps (including localized `OBJECT` fields), schema version switching with a technical diff, and reference fields of type `PRODUCT`, `ORDER`, `CART`, `CUSTOMER`, `COMPANY`, `MEDIA`, `PRICE_LIST`, `CUSTOMER_SEGMENT`, `CATEGORY`, or a custom entity id (`orders/src/components/mixins/useMixinsForm.tsx`, `products/src/context/ReferenceOptionsProvider.tsx`). Site-aware mixins are stored under `<schemaId>__<siteCode>` (`products/src/components/mixins/helpers.ts`); in orders and returns no screen turns site-aware mode on.
- **Schema type** (returns): `CATEGORY`, `COMPANY`, `COUPON`, `CUSTOM_ENTITY`, `CUSTOMER`, `CUSTOMER_ADDRESS`, `ORDER`, `PRICE_LIST`, `PRODUCT`, `QUOTE`, `RETURN` (`returns/src/models/Schema.model.ts`). Orders declares its own `SchemaType`; those values were not read.
- **Metadata** — optional `createdAt`, `modifiedAt`, `version` plus an index signature (`users-and-groups/src/models/Metadata.model.ts`). Brand metadata in `brands/src/models/Brand.model.ts` requires those three fields. They are not one type.
- **Localized text** — string map (`users-and-groups/src/models/Localized.model.ts`, `agentic-ai/src/types/Agent.ts`).
- **Access control** — named bundle of scopes and domains, with `restrictionAware`, `predefined`, optional `vendorAware`, and `restrictedTo` `CUSTOMER` or `EMPLOYEE` (`users-and-groups/src/models/Permissions.model.ts`).
- **Role code** on a template: `viewer`, `editor`, `manager`, `administrator` (`users-and-groups/src/models/Groups.model.ts`).
- **Group user type**: `CUSTOMER` or `EMPLOYEE`.

## Orders

An order has `status`, entries, customer, currency, prices, optional payments, shipping, tax, addresses, mixins, `calculatedPrice`, `quoteId`, `cartId`, `legalEntityId`, `siteCode`, `masterOrder`, and `subOrders` (`orders/src/models/Order.model.ts`).

Status enum: `IN_CHECKOUT`, `CREATED`, `CONFIRMED`, `DECLINED`, `SHIPPED`, `COMPLETED`. Allowed next statuses are loaded per order (`orders/src/components/orders/ChangeStatusDialog.tsx`). The transition graph is unknown — not found in this repo.

Extended status is the mixin string `generalAttributes.extendedOrderStatus`. Options come from configuration `extendedOrderStatuses`. When the current status has `possibleTransitions`, only those keys plus the current (disabled) status are offered; with no `possibleTransitions`, every configured status is offered (`orders/src/components/orders/ExtendedOrderStatusSwitcher.tsx`).

Document actions (delivery note, delivery confirmation, invoice) require an orders manager or vendor orders manager. They are blocked when status is `CREATED` or `DECLINED`. Delivery confirmation also requires extended status number `>= 60`; invoice requires `>= 70`. A missing value parses to `NaN`, and `NaN < 60` does not add that block (`orders/src/components/orders/OrderDocumentActions.tsx`). With feature toggle `PAYMENT_GATEWAY`, invoice uses the invoice job; otherwise it uses send-invoice.

Entries are not editable when status is `COMPLETED` (`orders/src/hooks/orders/useEntriesColumns.tsx`). An order with `calculatedPrice` uses the current data and entries views; without it, the legacy views (`orders/src/components/orders/legacy/OrderData.tsx`).

A vendor-aware list with no vendor id asks the API to `excludeSuborders=true` (`orders/src/helpers/orders.ts`). Site restrictions: an unrestricted scope yields no site filter; a scope `…--SITE_A#SITE_B` yields those site codes (`orders/src/helpers/restrictions.ts`).

Discount type: `PERCENT`, `ABSOLUTE`, `FREE_SHIPPING`. Price calculation type: `ApplyDiscountBeforeTax`, `ApplyDiscountAfterTax`. Line product type: `BASIC`, `VARIANT`, `PARENT_VARIANT`, `BUNDLE`. Item origin: `EXTERNAL`, `INTERNAL`.

## Returns

A return has `approvalStatus`, requestor, submitter, reason, `received`, orders with items, expiry, total, and mixins (`returns/src/models/Returns.model.ts`).

Status enum: `PENDING`, `APPROVED`, `REJECTED`, `CLOSED`, `REVIEWED`. Who may move between them is unknown — not found under `returns/src`.

A return has an optional `siteCode`. It is shown on the list and the detail and never sent on update. Site restriction reads IAM scopes `returns.returns_read` and `returns.returns_manage`: the bare scope means unrestricted, a `--SITE_A#SITE_B` suffix limits the user to those sites (`returns/src/helpers/returnsSiteAccess.ts`). Whether the API enforces it is unknown.

Create requires at least one order, each with at least one item, and a reason `code` or `details` (`returns/src/contexts/ReturnForm.provider.tsx`). Submitter name and email default from the session user. With no customer selected, only orders whose customer id is `ANONYMOUS` are eligible; the first selected order’s email is then required to match (`returns/src/components/returns/ReturnAddOrders.tsx`). That path sets `requestor.anonymous` and clears `customerId`. A `?customerId` query seeds the wizard from that customer. Updates use ops `ADD`, `REMOVE`, `REPLACE`.

## Users and groups

A user has `active`, `status`, login, contact email, name, preferred currency, language, and site, optional `groupIds`, and `isAccountLocked` (`users-and-groups/src/models/User.model.ts`). Status enum: `ACTIVE`, `INACTIVE`, `PROVISIONED`. The employee table’s inactive filter value is `PROVISIONED`; the customer table’s inactive filter value is `INACTIVE` (`users-and-groups/src/hooks/useUsersTableColumns.tsx`). What those statuses allow is unknown — not found beyond the filter.

The employee domain map has an `Agent Assistant Viewer` domain made of the agent viewer access control and `AGENT_EXECUTE_MANAGER`, so the group access-control picker offers agent execution (`users-and-groups/src/configs/accessControls.ts`).

`users-and-groups` lists groups with `userType` `EMPLOYEE` and shows a role section for that type (`users-and-groups/src/pages/UsersAndGroups.page.tsx`, `users-and-groups/src/components/group/GroupDetailsGeneralForm.tsx`). `customer-groups` lists only `CUSTOMER` groups (`customer-groups/src/pages/CustomerGroups.page.tsx`, `customer-groups/src/RemoteComponent.tsx`). A customer group can store `b2b.legalEntityId` (a company). A group also has localized name and description, access-control ids, template ids, optional `vendorId`, and `restrictions`.

## Brands

A brand has optional `id`, `name`, `description`, `image`, `cloudinaryUrl`, and metadata (`brands/src/models/Brand.model.ts`). The editable form fields are `name` and `description`. Whether name is required or unique is unknown — not found in `brands/src`. Media attached to a brand uses ref type `BRAND`. Media type is `BLOB` or `LINK`; access is `PUBLIC` or `PRIVATE` (`brands/src/models/Assets.model.ts`). Other ref types on that enum are `CATEGORY`, `PRODUCT`, `LABEL`, `MODULE`.

## Labels

A label has a name, an HTML description, an optional image, and an overlay position: `NONE` (0), `TOP_LEFT`, `TOP_RIGHT`, `BOTTOM_LEFT`, `BOTTOM_RIGHT` (`labels/src/models/Label.model.ts`). Media attached to a label uses ref type `LABEL`. Managing labels needs both the Labels Manager access controls and `CONFIGURATION_MANAGER`; the Labels Viewer domain is declared but never checked (`labels/src/configs/accessControls.ts`). Rules: `ai-project-knowledge/modules/labels.md`.

## Status codes

A status code is a quote reason of the Quote Service: a type `CHANGE` or `DECLINE`, a code, and a localized comment (`status-codes/src/models/QuoteReason.model.ts`). Updates carry the loaded `metadata.version`. The Management Dashboard quote change-status dialog offers the `DECLINE` reasons; it stays in the host. Viewing needs Status Codes Viewer (Quotes Viewer), changing needs Status Codes Manager (Quotes Manager). Rules: `ai-project-knowledge/modules/status-codes.md`.

## Products

A product has `code`, localized `name`, `productType`, `published`, mixins, media, a template id and version, and optional brand, labels, tax classes, and related items (`products/src/models/Category.model.ts`). Product type: `BASIC`, `BUNDLE`, `VARIANT`, `PARENT_VARIANT`, `DYNAMIC_VARIANT`. Related-item ids: `CONSUMABLE`, `ACCESSORY`, `YOU-MIGHT-LIKE-THIS`, `SUGGESTED-RELATED-ITEMS`, `SIMILAR-ITEMS`. Category type: `STANDARD` or `CLASSIFICATION`.

A `VARIANT` stores its parent id. Product Service keeps a variant's own mixin values only for paths in `metadata.overridden`; a mixin save on a variant adds the changed mixin field paths and `metadata.mixins.<key>`, and never lists `productVariantAttributes` (`products/src/helpers/variantMixinOverrides.helpers.ts`).

`DYNAMIC_VARIANT` products form a hierarchy: `parentVariantId`, `parentVariantPath` (index 0 is the immediate parent, the last element the root), a `variants` map, own and inherited variant attributes, `sellable`, and `dynamicVariantType`. Inheritable fields are `name`, `published`, `sellable`, `brandId`, `labelIds`, `description`, `media`, `taxClasses`, and `relatedItems`; a child's overrides are listed in `metadata.overridden`, and other inheritable fields are stripped on save so they keep inheriting (`products/src/helpers/dynamicVariants/inheritableFields.helpers.ts`, `products/src/helpers/parentVariantPath.ts`). Deleting a dynamic variant uses the force delete. Rules: `ai-project-knowledge/modules/products.md`.

Price-model tier type: `BASIC`, `VOLUME`, `TIERED` (`products/src/models/PriceModel.model.ts`). A price model has `includesTax`, `includesMarkup`, and `default`. Further price rules are unknown — the price form field rules were not read.

## Dashboard

The dashboard remote shows tenant commerce figures for a selected site and time range. Presets: `last7`, `last30`, `mtd`, `ytd`, `custom`, each with `from` and `to` dates (`dashboard/src/dashboard/models/DashboardContext.types.ts`).

Registered widget ids cover customers, employees, revenue, orders, basket size, quotes (volume, count, average, accepted, cancelled), returns, products, vendors, open carts, abandoned carts, and coupons (`dashboard/src/dashboard/data/widgetRegistry.tsx`). How each widget computes its number was not read.

Saving the layout as the global configuration requires `permissions.systemPreferences.manager === true`. Reset clears local layout and, for that manager, also writes the default layout globally (`dashboard/src/dashboard/pages/DashboardPage.tsx`).

## Statistics

Usage is per tenant for API calls, Make, database, Cloudinary, AI, and webhooks (`statistics/src/views/`, `statistics/src/models/Statistics.model.ts`). A summary has yesterday, this week, this month, this year, and an agreed annual figure. Chart grain is `day`, `week`, or `month`. API-call payloads include `maxAllowedRequests` and request counts. Quota enforcement is unknown — not found in this remote.

## Agentic AI

A custom agent has localized name and description, prompts, `enabled`, triggers, an LLM config, MCP servers, native tools, collaborations, `maxRecursionLimit`, `enableMemory`, tags, and optional `requiredScopes` (`agentic-ai/src/types/Agent.ts`). A separate `AgentStatus` is `'active' | 'inactive'` (`agentic-ai/src/types/common.ts`). How that status relates to `enabled` is unknown — not found beside the type.

LLM provider: `anthropic`, `openai`, `google`, `emporix_openai`, `self_hosted_ollama`, `self_hosted_vllm`. Self-hosted `baseProvider`: `anthropic`, `google`, `openai`. OAuth grant seen here: `client_credentials`. MCP server `type`: `predefined`, `custom`, or `dynamic`. `modifiedBy.type`: `CUSTOMER`, `EMPLOYEE`, `EXTERNAL`, `SYSTEM`.

A new agent defaults to trigger `endpoint`, provider `emporix_openai`, `maxRecursionLimit` 20, memory on, and `enabled` false (`agentic-ai/src/utils/agentHelpers.ts`). Save requires a localized name and description, a prompt, a model, at least one trigger, and an id while creating. A token is required on create unless the provider is Emporix OpenAI or self-hosted. Self-hosted needs a URL, and an OAuth id when OAuth is selected. A `commerce_events` trigger needs at least one commerce event and a valid filter when a filter is set (`agentic-ai/src/hooks/useAgentConfig.ts`). Slack and Teams triggers each require exactly one matching tool (`agentic-ai/src/utils/agentTriggerValidationHelpers.ts`). Other trigger type strings seen in helpers and translations: `scheduled`, `api`, `time`, `slack`, `teams`. A closed enum of trigger types was not found.

RAG entity type: `product`, `order`, `customer`, `legal-entity`, or `invalid` (`agentic-ai/src/types/Tool.ts`). The import tool's MCP tool list includes connection and stream-file tools (`create-import-connection`, `update-import-connection`, `upload-connection-sample-file`, `list-stream-files`, `queue-stream-file`, `requeue-stream-file`, `remove-stream-file`, `reorder-stream-files`) (`agentic-ai/src/utils/constants.ts`). An agent import summary can report `MISSING_OAUTH` (`agentic-ai/src/types/common.ts`). Import summary state: `ENABLED`, `DISABLED`, `TO_CREATE`, `EXISTS`, `FAILED`.

## Algolia synonyms

The remote loads indexing configuration `ALGOLIA` for the callback tenant. HTTP 404 or a failed load shows that the config was not found (`algolia-synonyms/src/App.jsx`). The response body is stored in `localStorage` under `algoliaConfig`.

Synonym type strings: `synonym`, `onewaysynonym`, `placeholder`, `altcorrection1`, `altcorrection2` (`algolia-synonyms/src/components/SynonymType.jsx`). Save sends the synonym and a `forwardToReplicas` flag, defaulting that flag to false when absent (`algolia-synonyms/src/components/synonym-edit-types/SynonymEdit.jsx`). Matching rules inside Algolia are unknown — not found beyond these type names.

## Unknown

- One shared tenant, token, or language model — not found; each remote declares its own.
- Return approval transitions, brand name rules, and statistics quota enforcement — not found in the files opened above.
- Order status transitions — supplied by the API, not encoded here.
- Screen-level behaviour of each dashboard widget, product price rows, and agent chat — not read.
