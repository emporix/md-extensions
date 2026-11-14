# Categories

Management Dashboard "Categories" module (Management → Categories), extracted into an `md-extensions` federated remote (COP-7181, epic COP-5597). A category has an id, a code, a localized name, slug and description, ECNs, a parent and a position among its siblings, a validity and a published flag, media and mixins. React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch); Tier 1 infrastructure is aligned with `units`, the mixins engine and `ReferenceOptionsProvider` are copied from `companies`. See the `md-module-extraction` skill at the repository root for the workflow.

## Screens

Hash routes inside the remote (`src/constants/paths.ts`), mounted by the host on `/apps/management/categories/*`:

| Path                           | Screen                                                                                                                                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` (`?view=list`)             | List: server-paged table of standard categories, unpublished included, with id, published, name, code, slug and validity columns, sorting and filters; row edit and delete, batch delete. Column visibility is stored under `ext_categories` |
| `/?view=tree` (`&categoryId=`) | Tree: the selected category's ancestors open and a side panel shows its quick-edit fields; the node menu adds a category above, below or as a child                                                                                          |
| `/add`                         | Create a category                                                                                                                                                                                                                            |
| `/:categoryId`                 | Edit a category: details, path (parent and position), validity, media and mixin tabs                                                                                                                                                         |
| anything else                  | Back to the list                                                                                                                                                                                                                             |

Every change rebuilds the affected root trees (`/category-trees` is cached per root); a move rebuilds the old and the new root, a delete removes the subcategories too.

`Categories Viewer` can view; `Categories Manager` can create, edit, move and delete (the domains also bundle `Media Viewer` / `Media Manager`). The remote loads permissions itself (`PermissionsProvider`).

API calls come from `@emporix/api-calls`, bound to the host tenant in `src/hooks/api/categories.ts`, `categoryTree.ts`, `categoryTreeRebuild.ts` and `mediaAssets.ts`; the table settings use `updateSingleConfiguration` in `src/context/ConfigurationProvider.tsx`.

Media asset links leave the remote with `window.location.assign('/media-assets/<id>')` (a host route).

### Component library pieces

Tree drag and drop (`dragdropScope` / `onDragDrop`), the media tab (`AssetsViewer`, `MediaAssetUpload`) and the table settings (`TableExtensions`) come from `@emporix/component-library` 2.28.0. The data behind them stays in the remote: the move handler in `CategoryTreeBase.tsx` (`categoryTreeMove.helpers.ts`), `useCategoryMedia` and `useCategoriesTableConfig`; the mixin column picker (`components/shared/MixinColumns.tsx`) fills the `TableExtensions` `children` slot.

## AppState

When the module is embedded in the Management Dashboard, the host passes an `appState` prop to `RemoteComponent`.

| Field             | Type                       | Description                                                                   |
| ----------------- | -------------------------- | ----------------------------------------------------------------------------- |
| `tenant`          | `string`                   | Current tenant identifier.                                                    |
| `language`        | `string`                   | UI language from the dashboard (`en` or `de`).                                |
| `token`           | `string`                   | JWT access token for Emporix API calls.                                       |
| `currency`        | `Entry`                    | Active currency.                                                              |
| `contentLanguage` | `string`                   | Content language selected in the dashboard; names and the tree labels use it. |
| `user`            | `User`                     | Logged-in user.                                                               |
| `onError`         | `(error: unknown) => void` | Host error handler.                                                           |

`src/models/AppState.model.ts` defines the fields this remote reads. Read them through `useDashboardContext()`. The shared `@emporix/api-calls` client is created in `src/api/bootstrap.ts` from `VITE_API_URL`.

## Development

### Environment variables

Copy `.env.example` to `.env` and set:

- **VITE_API_URL** – Base URL for the Emporix API (e.g. `https://api-develop.emporix.io`).
- **VITE_DASHBOARD_ORIGIN** – Dashboard origin the build checks against the CORS list in `vite.config.ts`.

### Checks

```bash
npm install
npm run typecheck
npm run lint
npm run test:run
npm run build:dev
```

### Loading the remote in the Management Dashboard

The remote runs on a fixed local port, `5184` (`server.port` and `preview.port` in `vite.config.ts`, `strictPort: true`). The dashboard's `.env.local-*` files point `VITE_CATEGORIES_URL` at `http://localhost:5184/assets/remoteEntry.js`.

```bash
npm run build:dev
npx vite preview --mode dev
```

Then start the dashboard with `serve:local-qa` (or another `local-*` mode) and open `/apps/management/categories`.

Every `build*` script first runs `scripts/ensure-cors-origin.mjs`, which checks that the dashboard origin for that mode is in the `corsOrigins` list of `vite.config.ts` (`npm run check:cors -- --mode dev`).

### Standalone

```bash
npm run dev
```

The dev shell asks for tenant, token and language.

### Deploying

Firebase Hosting targets `emporix-categories-develop`, `emporix-categories-stage` and `emporix-categories` (root `firebase.json`, `.firebaserc`). Workflows: `.github/workflows/categories-firebase-*.yaml` — a preview per PR, dev and stage on merge to `master`, prod on a `categories-*` tag. The Firebase Hosting sites must exist before the first deploy.

## UI

No PrimeReact, PrimeFlex or PrimeIcons dependency. UI comes from `@emporix/component-library`, whose stylesheet is imported once in `RemoteComponent.tsx` (it also carries the primeicons font, so MD's `pi pi-*` glyphs stay); feature styles are SCSS Modules. See `docs/CL_WIDGET_STATUS.md` for the component-library equivalent of each PrimeReact widget.
