# Classifications

Management Dashboard "Classifications" module (Management → Classifications), extracted into an `md-extensions` federated remote (COP-7182, epic COP-5597). A classification is a category of the Category Service with `type: CLASSIFICATION`: a code, a localized name and description, a parent and a position among its siblings, a validity and a published flag, and its own classification schemas (`ownClassificationMixins`: key, schema URL, required). React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch); Tier 1 infrastructure, the providers, the tree, the parent selector and the table settings are copied from `categories`. The mixins engine, media and `ReferenceOptionsProvider` are not part of this remote. See the `md-module-extraction` skill at the repository root for the workflow.

## Screens

Hash routes inside the remote (`src/constants/paths.ts`), mounted by the host on `/apps/management/classifications/*`:

| Path                           | Screen                                                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                            | List: server-paged table of classifications, unpublished included, with name, valid from and valid to columns, sorting and filters; row edit and delete, batch delete. Column visibility is stored under `ext_classifications` |
| `/?view=tree` (`&categoryId=`) | Tree: the selected classification's ancestors open and a side panel shows its quick-edit fields; the node menu adds a classification above, below or as a child; drag and drop moves and reorders                              |
| `/add`                         | Create a classification                                                                                                                                                                                                        |
| `/:classificationId`           | Edit a classification: Details, Classification (schema tiles), Path (parent and position) and Validity tabs                                                                                                                    |
| anything else                  | Back to the list                                                                                                                                                                                                               |

Every change rebuilds the affected root trees (`/category-trees` is cached per root); a move rebuilds the old and the new root, a delete removes the sub-classifications too.

`Categories Viewer` can view; `Categories Manager` can create, edit, move and delete. The remote loads permissions itself (`PermissionsProvider`).

API calls come from `@emporix/api-calls`, bound to the host tenant in `src/hooks/api/categories.ts`, `categoryTree.ts`, `categoryTreeRebuild.ts` and `schema.ts`; the table settings use `updateSingleConfiguration` in `src/context/ConfigurationProvider.tsx`. An own schema is read with `fetch` from the URL typed into its tile.

### Classification schemas

The Classification tab holds one tile per schema of the classification (`src/components/classifications/ClassificationMixins*.tsx`):

- The schema is either an Emporix mixins schema (picked from the tenant's schemas of type `CLASSIFICATION`, which fills the key and the URL) or an own schema (a URL ending in `.json`). Each tile has a key (letters, digits and `_`), a required switch and a read-only attribute table (name, read only, nullable, required, localized).
- When the stored URL points to an older version of an Emporix schema, the tile shows the new version (`vN`), the tab label becomes `Classification (!)`, and the table shows the differences (added, deleted, changed). "Keep old" shows the old attributes, "New version" the differences, "Apply Version N" moves the tile to the new URL.

### Component library pieces

Tree drag and drop (`dragdropScope` / `onDragDrop`), `Tabs` and the table settings (`TableExtensions`) come from `@emporix/component-library` 2.29.0. The data behind them stays in the remote: the move handler in `CategoryTreeBase.tsx` (`categoryTreeMove.helpers.ts`) and `useClassificationsTableConfig`. The table settings offer the three columns only (no mixin column picker).

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

The remote runs on a fixed local port, `5187` (`server.port` and `preview.port` in `vite.config.ts`, `strictPort: true`). The dashboard's `.env.local-*` files point `VITE_CLASSIFICATIONS_URL` at `http://localhost:5187/assets/remoteEntry.js`.

```bash
npm run build:dev
npx vite preview --mode dev
```

Then start the dashboard with `serve:local-qa` (or another `local-*` mode) and open `/apps/management/classifications`.

Every `build*` script first runs `scripts/ensure-cors-origin.mjs`, which checks that the dashboard origin for that mode is in the `corsOrigins` list of `vite.config.ts` (`npm run check:cors -- --mode dev`).

### Standalone

```bash
npm run dev
```

The dev shell asks for tenant, token and language.

### Deploying

Firebase Hosting targets `emporix-classifications-develop`, `emporix-classifications-stage` and `emporix-classifications` (root `firebase.json`, `.firebaserc`). Workflows: `.github/workflows/classifications-firebase-*.yaml` — a preview per PR, dev and stage on merge to `master`, prod on a `classifications-*` tag. The Firebase Hosting sites must exist before the first deploy.

## UI

No PrimeReact, PrimeFlex or PrimeIcons dependency. UI comes from `@emporix/component-library`, whose stylesheet is imported once in `RemoteComponent.tsx` (it also carries the primeicons font, so MD's `pi pi-*` glyphs stay); feature styles are SCSS Modules. See `docs/CL_WIDGET_STATUS.md` for the component-library equivalent of each PrimeReact widget.
