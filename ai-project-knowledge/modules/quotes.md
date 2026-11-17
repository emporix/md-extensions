# Quotes

Last scanned: COP-7116 (2026-11-16)
Sources: `quotes/README.md`, `quotes/package.json`, `quotes/vite.config.ts`, `quotes/src/RemoteComponent.tsx`, `quotes/src/Quotes.routes.tsx`, `quotes/src/Quotes.module.tsx`, `quotes/src/pages/`, `quotes/src/constants/paths.ts`, `quotes/src/helpers/hostUrls.ts`, `quotes/src/models/Quotes.model.ts`, `quotes/src/models/Shipping.model.ts`, `quotes/src/hooks/api/{quotes,prices,shipping,taxes,customers,customerManagement}.ts`, `quotes/src/context/Quote.provider.tsx`, `quotes/src/context/SitesProvider.tsx`, `quotes/src/components/quotes/`, `quotes/src/components/shared/CompaniesSelector.tsx`, `quotes/src/helpers/quote*.helpers.ts`, `quotes/src/helpers/restrictions.ts`, `quotes/src/translations/`, `quotes/src/**/*.test.ts(x)`, `docs/MIGRATED_MODULES.md`

Management Dashboard (MD) Sales → Quotes as a Vite federated remote, extracted in COP-7116 (`docs/MIGRATED_MODULES.md`). A quote is a Quote Service document a merchant prepares for a B2B company (legal entity and contact) or a B2C customer: lines with prices and discounts, shipping, a validity date, shared as a PDF and approved or declined. Federation name `quotes`, exposes `./RemoteComponent` (named and default), local port `5188` with `strictPort` (`quotes/vite.config.ts`). The module was first rebuilt in MD as `src/modules/quotes` and tested there, then ported 1:1; Tier 1 infrastructure comes from `companies`, pruned to what the module uses. Needs component library ≥ 2.29.0 (`Calendar` `hideOnDateTimeSelect`) and `currency-symbol-map` for the net-price prefix.

## Records

`quotes/src/models/Quotes.model.ts` and `Shipping.model.ts` are MD's shapes (only import paths changed).

- **Statuses** (`QuoteStatus`): `CREATING`, `OPEN`, `AWAITING`, `IN_PROGRESS`, `ACCEPTED`, `DECLINED`, `DECLINED_BY_MERCHANT`, `EXPIRED`. "Completed" (read-only) = `ACCEPTED | DECLINED | DECLINED_BY_MERCHANT | EXPIRED` (`helpers/quoteStatus.helpers.ts`). Badges (`components/quotes/QuoteStatusBadge.tsx`: the list column, the status filter, the heading of a completed quote) show the status name of the Quotes user guide in the `QuoteStatusColor` colour, upper-cased by CL `StatusBadge`, whose 0.75rem text (CL ≥ 2.29.1) is the size of MD's PrimeReact badges: Creating, Awaiting, Open, Pending (`IN_PROGRESS`, the customer asked for changes), Accepted, Declined, Declined by Merchant, Expired (`quotes.status.*`). MD showed the API code; the names come from the COP-7116 acceptance criteria. A status without a name shows its code.
- **Transitions the remote makes**: `CREATING` → `OPEN` (Approval tab "create", then back to the list); `AWAITING` / `IN_PROGRESS` → `OPEN` (approve) or `DECLINED_BY_MERCHANT` (decline with a required `DECLINE` reason and an optional comment; MD let the reason be empty). Other transitions are made outside this module.
- **Quote reasons** come from the Quote Service (`listQuoteReasonsCall`); only type `DECLINE` is offered when declining. Reasons themselves are edited in the `status-codes` remote.

## API

The quote, price and shipping calls come from `@emporix/api-calls/next` (1.6.0), the others from the package root. All are bound to the host tenant (`useDashboardContext().tenant`, passed to `./next` as `options.tenant`), and the hooks keep MD's results, so the screens stay as in MD:

- `src/hooks/api/quotes.ts`: `listQuotesCall` (table state through `fromDataTableState` from `@emporix/api-calls/primereact`; the site is the first filter, sent as `siteCode:"main"` where MD sent `siteCode:main`; resolves to `{ data, totalRecords }`), `getQuoteCall`, `createQuoteCall` (resolves to the new id), `patchQuoteCall` (JSON-patch style `ADD` / `REMOVE` / `REPLACE` operations, always an array), `deleteQuoteCall`, `generateQuotePdfCall` (a `Blob`), `listQuoteReasonsCall` (one page of 1000, as MD).
- `prices.ts`: `matchPricesCall` (`X-Version: v2`) for new lines and quantity changes; `shipping.ts`: `listShippingZonesCall` with `expand=methods,fees`. That call returns every translation, so the hook keeps the English zone and method names MD got with `Accept-Language: en`: the Preview lists them and saves the method name on the quote. `taxes.ts`: `calculateTaxCall` (root) for gross shipping.
- Client: `src/api/bootstrap.ts` creates it with `createApiCredentials` from `./next` (tenant and token from AppState; `onUnauthorized` is wired for a future host `refreshToken`). Root and `./next` calls share it.
- `customerManagement.ts` (legal entities and contacts), `customers.ts` (customer list for the B2C dialog and the selected customer), `configuration.ts` (tenant `restrictions` and `enableSyncBetweenRestrictionsAndSiteCodes`), `schema.ts` / `mixins.ts` (quote mixins, schema type `QUOTE`), `changelog.ts` (audit log).

## Routes

Hash routes (`src/Quotes.routes.tsx`, paths in `src/constants/paths.ts`, ids URL-encoded):

| Path        | Screen                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `/`         | List                                                                                                      |
| `/add`      | New quote draft (only General enabled, no quote request)                                                  |
| `/:quoteId` | Quote editor; `?tab=` selects a tab by name (`general`, `products`, `preview`, `approval`, mixin ids, `audit-log`) or by MD's index |
| `*`         | Redirects to `/` (MD showed its not-found page)                                                           |

`add` and `:quoteId` share `pages/QuoteAddEdit.route.tsx`: a tenant guard (a host tenant switch navigates to the list), then `RemountOnParams`, then `QuoteDataProvider`, then the page. Saving a draft on `/add` navigates to `/{newId}`, which remounts the provider and the form. `QuoteDataProvider` loads the quote with `loadLatest`, ignores responses after it unmounts, and on a failed load navigates to the list with an error toast. `Quotes.module.tsx` keys `RefreshValuesProvider` by pathname, so a refresh requested on a quote page never re-fetches the list.

## Permissions

`Quotes Manager` creates, edits (until the quote is completed), approves, declines and deletes; without it the create button and row actions are disabled. The user's quote scopes (`quote.quote_manage`, then `quote.quote_read`) restrict sites (`helpers/restrictions.ts`, `useQuoteRestrictions`). The contact dropdown needs `Companies Viewer`, the products tree view `Categories Viewer`, the audit log tab `Audit Log Viewer`. The remote loads permissions itself (`PermissionsProvider`).

## List

`pages/QuotesList.page.tsx`, `components/quotes/QuotesTable.tsx`, `hooks/useQuotesColumns.tsx`: site select (no "All sites"), create button, lazy table sorted by `metadata.createdAt` descending. Columns: company name, id, created at, total gross, status (dropdown filter over all statuses, shown by name, filtering on the API code); number and date filters as MD. Column visibility under config key `ext_quotes` with quote mixin columns. Row expansion shows the lines (name, quantity, unit, unit price, gross). Row click opens the quote; row and batch delete need manage permission; approve and decline row actions only for `AWAITING` / `IN_PROGRESS` and a manager. The list loads once on entry (MD sent two identical GETs), and a delete reloads the rows and the paginator total (MD kept the total stale).

## Quote editor

`pages/QuotesAddEdit.page.tsx`: tabs General, Products, Preview, Approval, quote mixin tabs, audit log (`entity: quote`). Products, Preview, Approval and the audit log are disabled until a quote id exists. The site select is disabled once a quote is loaded, and loading a quote switches to `quote.siteCode`. Mixin saves patch `ADD /mixins/{key}` and `ADD /metadata/mixins/{key}`. The mixin forms load once per loaded quote (MD requested the schemas and references again on every render).

- **General** (`QuotesTabGeneral.tsx`, `helpers/quoteGeneralForm.helpers.ts`): B2B needs a company (`components/shared/CompaniesSelector.tsx` on CL `PaginatedSelector`) and a contact with a customer; B2C needs a customer from `QuoteChooseCustomerDialog` (single-select table). Only addresses tagged shipping / billing are offered; "same addresses" copies shipping into billing. Restriction is required unless the user has full access. Create sends site, currency, customer, optional legal entity, address ids and restriction; edits send only dirty fields as patch operations. Completed quotes show a status box (order link, reason, comment). Save needs a shipping and a billing address, for B2B and B2C (MD let a quote without addresses save, because the address pickers only exist when there are addresses).
- **Products** (`QuotesTabProducts.tsx`, `hooks/useQuotesMatchPrices.tsx`, `helpers/quoteItems.helpers.ts`, `helpers/productsBrowser.helpers.ts`): CL `ProductsBrowser` (list, and tree with `Categories Viewer`) for a manager on a non-completed quote. Save sends `ADD /items` for new and `REMOVE /items` for dropped lines only; new lines are priced with match-prices (quote currency and site, shipping-address country, item type `PRODUCT`).
- **Preview** (`QuotesTabPreview.tsx`, `QuotesTabPreviewTable.tsx`, `helpers/quoteShipping.helpers.ts`): quantity, total and discount recompute each other; gross per line = net × (1 + tax rate). Shipping methods are the zones of the quote site that ship to the shipping country and have a tax code, filtered by `maxOrderValue`; the fee is the cheapest one whose minimum order value is reached. Validity uses CL `Calendar` with `showTime`, `hideOnDateTimeSelect` and `minDate`. A net value typed on a line without a quantity stays 0 (`getUnitPriceForNetValue`; MD divided by the zero quantity). Save sends `REPLACE` for the dirty `/validTo`, `/comment`, `/customerReference`, `/items`, `/shipping`; a failed save of Preview or Products shows an error toast (MD only logged it).
- **Approval** (`QuotesTabApproval.tsx`, `QuotesChangeStatus*.tsx`, `helpers/quoteChangeStatus.helpers.ts`): the quote PDF in an iframe; "create" for `CREATING`, approve and decline for `AWAITING` / `IN_PROGRESS`, then a confirm and `REPLACE /status` with `{ value, quoteReasonId?, comment? }` (empty fields stripped). A decline needs a reason of type `DECLINE`: its submit stays disabled until one is picked (COP-7116; MD let it be empty). "Create" sends the quote shown now, and the buttons follow permissions that arrive after the quote (MD kept the first render's quote and permissions, so a deep link to the tab could not send). A failed send, approval or decline, and a failed load of the reasons, show the API message or a translated fallback (MD read `response.data.message` unchecked, which threw without a response).

## Translations

`src/translations/{en,de}/quotes.ts` equal MD's `quotes` namespace (101 keys each) plus the eight status names `quotes.status.*`, `dialog.status.types.*`, `tabs.general.address` and `toasts.errorFetchReasons` (COP-7116), 113 keys each. Corrected after the A–Z run: the German decline dialog ("Angebot ablehnen" instead of "löschen", a German confirm question), DE "kann", "Zusätzliche", "freigegeben" after an approval, EN "shipping", and DE `segments` "Benutzer-E-Mail". `segments`, `sites`, `products` and `categories` are subsets of MD keys the screens use; `global`, `mixins`, `auditLog`, `confirmBox`, `errors`, `navigation` come with Tier 1 (DE `deleteConfirm` follows MD master). A few non-visible labels for CL controls were added (`global.clear`, `global.remove`, `products.browser.*`, the PDF iframe title).

## Host wiring

The MD host route `quotes` (`apps/management/quotes/*`) loads this remote from `VITE_QUOTES_URL` (Mode A); `QuotesPathRedirect` moves old pathname deep links (`/apps/management/quotes/{id}?tab=…`, `/add`) into the hash. Links that leave the remote use `window.location.assign`: company `/apps/management/companies#/{id}`, order `/apps/management/orders#/{id}`, cart `/apps/management/carts/{id}` (no `backTo`, it cannot cross the boundary), customer `/apps/management/customers#/{id}` (MD's `customerDetailUrl` since COP-7185; the other remotes still link the old pathname, which MD's `CustomersPathRedirect` rewrites). `SitesProvider` starts from the site MD persisted (`localStorage` `tenant` / `sites` / `currentSite`, only for the host tenant) and never writes back, so a site change inside quotes does not change the host's site.

## Not yet scanned

- Behaviour inside the running host (browser QA of the remote through MD local-dev, COP-7116).
- Who moves quotes into `AWAITING`, `IN_PROGRESS`, `ACCEPTED`, `DECLINED` and `EXPIRED` (outside this module).
