# Audit log (shared package)

Sources: `audit-log/package.json`, `audit-log/src/index.ts`, `audit-log/src/EntityChangelog.tsx`, `audit-log/src/labels.ts`, `audit-log/src/window/`, `audit-log/src/paging/`, `audit-log/src/card/`, `audit-log/eslint.config.js`, `companies/src/components/auditLog/EntityChangelogTab.tsx`, `companies/vite.config.ts`, `companies/tsconfig.app.json`

`audit-log/` is not a remote. It is the entity history ("Audit Log" tab) used by `companies`, `coupons`, `customer-groups`, `customers`, `orders`, `products`, `quotes` and `users-and-groups`, kept once instead of copied per remote. It is shaped like a library so it can later move to a published package: `package.json` name `@emporix/md-audit-log` (`private`), peer dependencies only at runtime (`react ^18`, `@emporix/component-library >=2.10.2`, `@emporix/api-calls ^1.7.1`), one entry `src/index.ts`. Nothing inside reads app context: no i18n, no router, no remote context or config. `eslint.config.js` forbids `react-router*`, `react-i18next`, `i18next` and relative imports that leave the folder.

## Public API (`src/index.ts`)

- `EntityChangelog` and its props: `entity`, `entityId`, `enabled` (the tab is shown; a hidden tab stays mounted and requests nothing), `tenant` (`''` = not ready), `fetchPage(q, rows, cursor)` (rejects on failure), `labels` (`EntityChangelogLabels`: the static texts plus `changeType(key)` for `created` / `updated` / `deleted` and `entity(name)` for entity names), `locale`, `dateFormat` (Calendar format), optional `entityLinks` (`pathOf(entity, id)` returns a path or `undefined`, `render` draws the link with the consumer's router), `className`.
- The pieces, for a consumer that composes its own layout: the window rules (`defaultChangelogWindow`, `limitChangelogWindow`, `latestChangelogWindowEnd`, `changelogWindowQ`, `MAX_CHANGELOG_WINDOW_DAYS`), `useChangelogCursorPage`, `ChangelogWindowPicker`, `ChangelogPaginator`, `ChangelogCard`. The md-extensions remotes use only `EntityChangelog`.
- Types: `EntityChangelogProps`, `EntityChangelogLabels`, `EntityChangelogLinks`, `ChangelogLinkProps`, `ChangelogChangeTypeKey`, `FetchChangelogPage`, `ChangelogCursorPageOptions`, `ChangelogCursor`, `ChangelogCursorPage`, `ChangelogCursorPageStatus`, `ChangelogWindow`, `LimitedChangelogWindow`, `ChangelogScope`.

## Behaviour

- A Period range picker (`window/ChangelogWindowPicker.tsx`) prefilled with the last 3 full local days, local midnight two days ago to the end of today (`window/changelogWindow.ts` `defaultChangelogWindow`), shown in the browser's local time; a range longer than 7 days is cut at 7 local days from its start, less 1 ms (`limitChangelogWindow`), with the limit hint; a one-ended pick is a draft and requests nothing.
- Every request's `q` holds the entity, the entity id and the window as UTC instants (`changelogWindowQ` → `buildChangelogQ` with an `occurredAt` range).
- `paging/useChangelogCursorPage.ts`: one reducer; a change of tenant, rows or `q` restarts at the newest page; a response for an old key is dropped; an empty page reached by cursor restarts at the first page; an error keeps the rows shown; retry re-sends the same cursor; `fetchPage` is kept in a ref, so a new function identity alone requests nothing.
- `EntityChangelog.tsx`: the picker header, then a spinner, the load error with Try again, the empty text, or the cards with Previous / Next and rows per page (10 of 10, 25, 50, 100; `paging/ChangelogPaginator.tsx`); no totals, page numbers or countdown.
- `card/`: actor (badges for `system`, `external`, `unknown`), change-type badge (`CHANGE_TYPE_KEY`; an unknown type shows as it came), local time (CL `DateValue` with `locale`), a related-entity badge linked only when `pathOf` returns a path, and the changed-fields table (shown on create and update, empty values filtered out).
- Styles are CSS modules; MD's grey scale is written `var(--grey-N, #hex)`.

## Consumers

Each consumer keeps `src/components/auditLog/EntityChangelogTab.tsx` with props `{ entity, entityId, isActive?, className? }`: it maps its `auditLog.*` / `global.*` translations to `labels`, takes `tenant` from `useDashboardContext`, `fetchPage` from `hooks/api/changelog.ts` (`getChangelogCursorPage` → `listChangelogsWithCursorCall`), links from `configs/entityLinkConfig.ts` with a react-router `Link` (so the remote's navigation guard still sees the navigation), and the locale from i18n. Its `EntityChangelogTab.test.tsx` checks that wiring.

Wiring per consumer: `vite.config.ts` aliases `@emporix/md-audit-log` to `../audit-log/src/index.ts`, sets `resolve.dedupe` (react, react-dom, component library, api-calls, so the shared files use the remote's copies and the bundle has one React) and `server.fs.allow: ['..']`; `tsconfig.app.json` maps the alias and those packages' types to the remote's `node_modules` and includes `../audit-log/src` (tests excluded); `tsconfig.node.json` adds the `DOM` lib. A remote builds without `audit-log/node_modules`, as its CI does.

## Tests and delivery

`audit-log` runs its own `npm run typecheck`, `lint`, `test:run` (8 files) and `build:dev` (a typecheck) against component library 2.10.2, the lowest version a consumer pins. The repository validation loop runs it, and every consumer, when `audit-log/` changes. Each consumer's preview and dev/stage workflows include `audit-log/**`; a production release of a shared change needs a `{remote}-*` tag for each consumer.
