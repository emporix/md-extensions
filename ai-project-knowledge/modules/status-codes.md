# Status codes

Last scanned: 74b6236 (2026-11-06)
Sources: `status-codes/README.md`, `status-codes/package.json`, `status-codes/vite.config.ts`, `status-codes/src/RemoteComponent.tsx`, `status-codes/src/StatusCodes.module.tsx`, `status-codes/src/constants/paths.ts`, `status-codes/src/models/QuoteReason.model.ts`, `status-codes/src/hooks/api/quoteReasons.ts`, `status-codes/src/pages/StatusCodes.page.tsx`, `status-codes/src/pages/StatusCode.page.tsx`, `status-codes/src/components/statusCodes/StatusCodesTable.tsx`, `status-codes/src/components/shared/LocalizedInput.tsx`, `status-codes/src/translations/`, `status-codes/src/**/*.test.ts(x)`, `docs/MIGRATED_MODULES.md`

Management Dashboard (MD) Quotes → Status codes as a Vite federated remote, extracted in COP-7172 (`docs/MIGRATED_MODULES.md`). A status code is a **quote reason** of the Quote Service; MD's quote change-status dialog (which stays in MD) offers the tenant's `DECLINE` reasons. Federation name `statusCodes`, exposes `./RemoteComponent` (named and default), local port `5180` with `strictPort` (`status-codes/vite.config.ts`). Tier 1 providers, shared UI and session code are copied from `labels` (see `ai-project-knowledge/modules/labels.md`); the comment field wrapper comes from `brands`.

## Record

`QuoteReason` (`status-codes/src/models/QuoteReason.model.ts`) is derived from the return type of `getQuoteReasonByIdCall`, because `@emporix/api-calls` exports neither the model nor its `QuoteChangeStatusType` enum: `id`, `code`, `type` (`CHANGE` or `DECLINE`), localized `message` (shown as "Comment"), optional `metadata` (`version`).

- New form: type `CHANGE`, empty code, no comment (`createQuoteReasonForm`).
- Create sends `{ type, code, message }`; update also sends `metadata.version` of the loaded reason (`toQuoteReasonPayload`, pinned by `QuoteReason.model.test.ts`).
- A comment counts as empty when every language value is blank (`isMessageEmpty`).

## API

`useQuoteReasonsApi` (`status-codes/src/hooks/api/quoteReasons.ts`) binds the five api-calls functions to the host tenant: `getQuotesReasonsCall` (one request, page size 1000), `getQuoteReasonByIdCall`, `createQuoteReasonCall` (resolves to the new id), `editQuoteReasonCall`, `deleteQuoteReasonCall`.

## Routes

Hash routes (`status-codes/src/constants/paths.ts`, `status-codes/src/RemoteComponent.tsx`): `/` list, `/add` create, `/:id` edit; other paths redirect to `/`.

## Permissions

`Status Codes Viewer` (the Quotes Viewer access control) can view; `Status Codes Manager` (the Quotes Manager access control, `status-codes/src/configs/accessControls.ts`) is needed for Create, row delete, batch delete, Save and Discard, and to change fields (they render disabled otherwise). Permissions come from the remote's own `PermissionsProvider`.

## List

`StatusCodesTable` (`status-codes/src/components/statusCodes/StatusCodesTable.tsx`) loads every reason once per tenant or refresh and filters and sorts on the client, as MD did (`lazy={false}`):

- Columns Code and Type, each with a contains filter (placeholders "Filter by code" / "Filter by type") and sorting. No column visibility (MD had none).
- Row click and row edit open `/:id`. A failed load shows an error toast and an empty table.
- Delete (row or batch) asks for confirmation, then deletes one reason after another, with a success or error toast per code, clears the selection, and reloads the list.

Pinned by `status-codes/src/pages/StatusCodes.page.test.tsx`.

## Create and edit

`StatusCodePage` (`status-codes/src/pages/StatusCode.page.tsx`): header "Status code" with the id as subtitle and a back button to the list; Discard and Save in the header; one "Details" section with Type (dropdown of the raw values), Code, and Comment (component-library `LocalizedInput` with `textarea`, content language first).

- Save is enabled only for a dirty, valid form: code not blank and comment not empty.
- Create: success toast "Status code created!", then the page switches to `/:newId` (replace).
- Update: sends the loaded version, success toast, reloads the reason.
- A failed save shows the service `message` as the toast title (else "Error while saving status code") and the service `details` as the body; the form keeps the entered values.
- An id that cannot be loaded shows the fetch error toast and goes to the list.

Pinned by `status-codes/src/pages/StatusCode.page.test.tsx`.

## Translations

`status-codes/src/translations/{en,de}/quotesReasons.ts` keep MD's `quotesReasons.*` keys, plus `toasts.errorSave`. EN and DE key parity and the absence of `primereact` are pinned by `status-codes/src/translations/translations.test.ts`.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned |
| Federation `name` | `statusCodes` (`status-codes/vite.config.ts`) |
| Host route `key` → path | `statusCodes` → `/apps/management/status-codes/*` (`management-dashboard` `src/router/module-routes.tsx`; the MD key was `status-codes` before COP-7172) |
| Host env var | `VITE_STATUS_CODES_URL` (`management-dashboard` `.env.*`) |
| Local port | `5180`, `strictPort` |
| Hosting | Firebase targets `emporix-status-codes`, `-stage`, `-develop`; `.github/workflows/status-codes-firebase-*.yaml` |
| Local deviations | none |

## Not yet scanned

- Tier 1 copies shared with `labels` (providers, IAM hooks, shared UI) — see `ai-project-knowledge/modules/labels.md`.
