# Statistics

Last scanned: da99643 (2026-11-02)
Sources: `statistics/...`

Management Dashboard module-federation remote that shows tenant usage charts. `statistics/README.md` is the generic extension template and does not describe this behaviour. No test files were found under `statistics/`.

## Remote entry

`statistics/vite.config.ts` exposes `./RemoteComponent` as `remoteEntry.js` (federation name `extension`). Shared modules: `react`, `react-dom`, `react-router`, `react-i18next`, `chart.js`, `quill`. `react-router` and `quill` are also in `statistics/package.json`; no import of either was found under `statistics/src`. Vite `server` and `preview` CORS origins are `https://admin.emporix.io`, `https://dev-admin.emporix.io`, and `https://stage-admin.emporix.io`.

`statistics/src/RemoteComponent.tsx` applies `appState.language` through i18next and renders `Statistics` inside `DashboardProvider`. `statistics/src/context/Dashboard.context.tsx` stores `tenant`, `language`, and `token` (`statistics/src/models/AppState.model.ts`). Defaults when `appState` is omitted are the string `default` for all three.

Standalone shell `statistics/src/main.tsx` mounts `statistics/src/App.tsx`, which asks for tenant, token, and language and stores them in `localStorage` under those keys before rendering `RemoteComponent`. How the dashboard host supplies `appState` is outside this module.

Locales: `en` and `de` in `statistics/src/translations/i18n.ts`, fallback `en`. English labels below are from `statistics/src/translations/en/index.ts`. German copy was not compared.

## What it shows

One screen, title `statistics`, with a tenant multi-select and six tabs (`statistics/src/Statistics.tsx`, `statistics/src/tabs/statisticsTabConfig.ts`). Default range is the local calendar today minus 7 days through today. Default time unit is `day`. Units are `day`, `week`, `month` (`statistics/src/components/TimeUnitSelector.tsx`, `TimeUnit` in `statistics/src/models/Statistics.model.ts`). `statistics/src/components/DateRangePicker.tsx` has two calendars (`mm/dd/yy`) and no check that the start is on or before the end.

Each non-AI tab uses `statistics/src/components/MultiTenantStatisticsTab.tsx`. The AI tab uses `statistics/src/components/tabs/AiStatisticsTab.tsx`. One selected tenant: that tenant's view, with time unit, dates, and CSV on the view. More than one: shared controls (`statistics/src/components/SharedControls.tsx`), then a "Total (All Selected Tenants)" block (`totalAllSelectedTenants`), then one card per tenant. Per-tenant views hide their own time and date controls when more than one tenant is selected. Missing tenant data renders as zeros.

Summary cards (`statistics/src/components/SummaryCards.tsx`): yesterday, this week, this month, this year, and an agreement figure. Empty or non-numeric values display as 0. The agreement figure uses compact `K` / `M` formatting. Cards do not divide by the period length; they show the API summary fields mapped in `statistics/src/hooks/useStatisticsData.ts`.

Charts (`statistics/src/components/StatisticsChart.tsx`): a dashed horizontal line at `summary.agreedAnnual`, bars for each range point, and (except database and Cloudinary) a cumulative line. `range.values` is reversed before labels and bars are drawn. The cumulative series is a running sum of that reversed order. Database and Cloudinary series are detected by `totalBytes` or `storageBytes` on a point; those charts omit the cumulative line and format ticks and tooltips as GB to 4 decimal places. Loading text is the literal `Loading...`.

CSV is a client-side download (`statistics/src/utils/csvUtils.ts`, filenames in `statistics/src/utils/csvDownloaders.ts`). Single-tenant files are `{kind}-statistics-{tenantName}-{UTC date}.csv`. Multi-tenant totals are `{kind}-statistics-all-tenants-{UTC date}.csv`. Single-tenant rows with no range values become the text `No data available`.

| Tab index | Label key | View | Chart / cards measure | Agreement field | CSV columns |
|---|---|---|---|---|---|
| 0 | `apiCalls` (API Calls) | `statistics/src/views/ApiCallsView.tsx` | `requestsCount` | `maxAllowedRequests` | Date, Tenant, API Calls, Cumulative API Calls |
| 1 | `make` (Make) | `statistics/src/views/MakeView.tsx` | `operations` | `maxAllowedOperations` | Date, Tenant, Operations, Cumulative Operations, Data Transfer (Bytes), Cumulative Data Transfer (Bytes) |
| 2 | `database` (Database) | `statistics/src/views/DatabaseView.tsx` | `totalBytes` as GB | `maxAllowedStorageBytes` | Date, Tenant, Storage (GB), Cumulative Storage (GB). Multi-tenant file drops the cumulative column |
| 3 | `cloudinary` (Cloudinary) | `statistics/src/views/CloudinaryView.tsx` | `storageBytes` as GB | `maxAllowedStorageBytes` | Date, Tenant, Storage (GB), Cumulative Storage (GB), Number of Objects, Cumulative Objects. Multi-tenant file keeps Storage (GB) and Number of Objects only |
| 4 | `ai` (AI) | `statistics/src/views/AiView.tsx` | `inputUsage` and `outputUsage` as two blocks (labels say input/output tokens) | `maxAllowedAiInput` and `maxAllowedAiOutput` | Date, Tenant, Input Tokens, Cumulative Input Tokens, Output Tokens, Cumulative Output Tokens. Multi-tenant file drops both cumulative columns |
| 5 | `webhooks` (Webhooks) | `statistics/src/views/WebhooksView.tsx` | `emittedEvents` | `maxAllowedEmittedEvents` | Date, Tenant, Emitted Events, Cumulative Emitted Events. Multi-tenant file drops the cumulative column |

GB on screen and in CSV is bytes divided by `1024 * 1024 * 1024` (`DatabaseView.tsx`, `CloudinaryView.tsx`, `csvUtils.ts`). Database CSV prints GB to 3 decimal places and still accumulates those GB values even though the chart has no cumulative series.

Make cards and the Make chart use operations only. `dataTransferBytes` is on `MakeStatisticsResponse` and in the Make CSV; it is not a chart series (`getValue` in `StatisticsChart.tsx` returns `operations` when that field is present). Cloudinary cards and the Cloudinary chart use storage. `numberOfObjects` is on the response, in aggregation, and in the CSV; it is not plotted.

The English agreement label for webhooks is "Agreed Monthly Webhooks" (`agreedAnnualWebhooks`). The number is still `maxAllowedEmittedEvents`. Whether that quota is monthly is unknown beyond that label.

API Calls has an extra "Show Advanced Data" panel (`apiProxyBreakdown`). Opening it calls the expanded API-calls endpoint. The panel resets when time unit or either date changes (`ApiCallsView.tsx`); that effect does not list the tenant. `statistics/src/components/ApiProxyChart.tsx` draws a stacked bar of `requestsCount` where the count is greater than 0. A missing `apiproxy` is labeled `unknown`. These ids are renamed before display: `cop-bff`, `cxp-bff`, and `copb-api` to `orchestration-engine`; `caas-product` to `product`; `caas-cart` to `cart`; `caas-site` to `site`; `caas-category` to `category`; `caas-indexing-service` to `indexing-service`; `caas-customer` to `customer`; `caas-order` to `order`. Any other id is shown as returned. Series are limited to `selectedProxies`, which is set to every such proxy the first time the list is non-empty. The chart control markup after that state was not fully read.

## APIs

Every call goes through `callApi` in `statistics/src/api.ts`: `GET` `${import.meta.env.VITE_API_URL}${path}` with `Content-Type: application/json`, `emporix-tenant`, and `Authorization: Bearer ${token}`. The only env name referenced under `statistics/src` is `VITE_API_URL`. `statistics/src/vite-env.d.ts` does not declare env vars. `.env*` files were not opened. The base URL value is unknown.

`callApi` does not check HTTP status. It always parses JSON. Hook and selector failures are `console.error` only (`useStatisticsData.ts`, `ApiCallsView.tsx`, `TenantSelector.tsx`). There is no error banner in the views that were read. A failed tenant-list call sets the option list to `[]`.

Query string on usage calls: `timeunit`, `startTime`, `endTime`. Times are UTC midnight ISO strings of the local calendar year, month, and day (`toAPIDateISOString` in `Statistics.tsx` and again in `ApiCallsView.tsx`). The expanded API-calls call adds `expand=proxy`.

`emporix-tenant` is the signed-in tenant when that tenant is `emporix`, `emporixstage`, or `emporixdev`. Otherwise it is the tenant whose usage is being loaded (`createStatisticsFetcher`, `fetchAiStatistics`, and `fetchExpandedApiCallsStatistics` in `api.ts`). The path tenant is always the data tenant.

| Function | Path |
|---|---|
| `fetchStatistics` | `/statistics/${dataTenant}/usages/apicalls` |
| `fetchExpandedApiCallsStatistics` | same path plus `expand=proxy` |
| `fetchMakeStatistics` | `/statistics/${dataTenant}/usages/make` |
| `fetchDatabaseStatistics` | `/statistics/${dataTenant}/usages/mongodbStorage` |
| `fetchCloudinaryStatistics` | `/statistics/${dataTenant}/usages/cloudinary` |
| `fetchAiStatistics` | `/statistics/${dataTenant}/usages/ai` |
| `fetchWebhooksStatistics` | `/statistics/${dataTenant}/usages/webhooks` |
| `fetchAllTenants` | `/statistics/emporix/allTenants` |
| `fetchUserTenants` | `/auth-adapter/users/me/tenants` |

Usage responses share `tenant` and `tenantUsage.summary` plus `tenantUsage.range` (`period`, `startTime`, `endTime`, `values`) in `statistics/src/models/Statistics.model.ts`. Optional caps: `maxAllowedRequests`, `maxAllowedUsage`, `maxAllowedOperations`, `maxAllowedStorageBytes`, `maxAllowedAiInput`, `maxAllowedAiOutput`, `maxAllowedEmittedEvents`. The UI uses the cap named in the table above. `maxAllowedUsage` is on several response types and is not mapped into the cards.

`fetchAllTenants` expects `{ tenants: string[] }`. `fetchUserTenants` expects an array of `{ tenant, applications: { id, roles? }[] }`.

Tenant picker (`statistics/src/components/TenantSelector.tsx`): if the signed-in tenant is `emporix`, `emporixstage`, or `emporixdev`, options come from `fetchAllTenants`. Otherwise options are `fetchUserTenants` rows whose `applications` include `id === 'MANAGEMENT_DASHBOARD'`. The control is a PrimeReact `MultiSelect` with `showClear={false}`, filter, and chips. Initial selection is the signed-in tenant. Whether every chip can be removed was not verified.

## Load and aggregate rules

`useStatisticsData` fetches only the tab index passed in: 0 API calls, 1 Make, 2 database, 3 Cloudinary, 4 AI, 5 webhooks. Any other index logs `Tab ${tabIndex} not implemented yet`. That index is the `tabConfigs` array position, so the fetch and the visible tab stay aligned only while that array order is unchanged (`statisticsTabConfig.ts`).

On mount, tab 0 is in `loadedTabs` and is fetched. Opening a tab that is not yet loaded fetches it. Changing time unit, start date, end date, selected tenants, or token refetches the active tab only (`Statistics.tsx`). Previously opened tabs are not refetched until one of those changes while that tab is active, or until the tenant selection changes. A tenant-selection change resets `loadedTabs` to the active tab alone. Selected tenants are also reset to the signed-in tenant when `tenant` from context changes.

Each tab walks `selectedTenants` and awaits one request per tenant. A thrown error stops that tab's loop after the log; tenants already fetched in that pass are discarded because state is set only after the loop. The expanded API-calls multi-tenant request uses `Promise.all` instead (`ApiCallsView.tsx`).

Missing summary numbers become 0 (`|| 0` in `useStatisticsData.ts`).

When more than one tenant is selected, totals are summed in the browser (`statistics/src/utils/aggregationUtils.ts`). Summary fields and the agreement figure are sums. Range points are summed by `date`. The plotted date list is the first selected tenant's `range.values` only; a date that exists only on a later tenant is omitted. With one tenant, or with no usable payloads, the aggregate helpers return null data and zero summaries. The total card is rendered only when `selectedTenants.length > 1`. Make aggregation also sums `dataTransferBytes`. Cloudinary aggregation sums `storageBytes` and `numberOfObjects`. AI aggregation sums input and output separately. The aggregate `tenant` string is `aggregated`.

Expanded multi-tenant API calls sum `requestsCount` by date and `apiproxy` across the selected tenants, then store that as `tenant: 'aggregated'` with zeroed summary counts (`ApiCallsView.tsx`). A single tenant, including the total label when only one tenant is selected, calls the expanded endpoint for that tenant. The total label with one selected tenant uses the context tenant as the data tenant.

## Host wiring

| Fact | Value |
|---|---|
| Kind | legacy — PrimeReact 8, no component library (`statistics/package.json`) |
| Federation `name` | `extension` (`statistics/vite.config.ts`) |
| Host route `key` → path | `statistics` → `/apps/administration/statistics` (`management-dashboard` `src/router/module-routes.tsx`) |
| Host env var | `VITE_STATISTICS_URL` (`management-dashboard` `.env.*`) |
| Local port | not pinned (`npm run dev` is `vite`) |
| Local deviations | own `fetch` in `src/api.ts`; no router (PrimeReact `TabView`) |

## Not yet scanned

- `statistics/src/translations/de/index.ts` — German strings not compared with English.
- `statistics/src/components/ApiProxyChart.tsx` — render after the series filter (proxy multi-select markup and axis options).
- `statistics/src/utils/csvUtils.ts` — multi-tenant row loops past the header lines. Single-tenant API calls, Make, and database converters were read; Cloudinary, AI, and webhooks converters were checked for headers and the byte-to-GB division.
- `statistics/src/utils/csvDownloaders.ts` — handlers after the API-calls downloader. Filenames for the other kinds were read.
- Styling (`statistics/src/App.css`; `statistics/src/main.tsx` imports `./index.css`, which was not in the css file listing), `statistics/eslint.config.js`, `statistics/tsconfig*.json`, `statistics/package-lock.json`.
- `.env*`, `node_modules`, `dist`. Build modes in `statistics/package.json` are `dev`, `stage`, and `prod`. Which files those modes load was not opened.
