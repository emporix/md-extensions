# System Preferences

Last scanned: COP-7194 (2026-11-24)
Sources: `system-preferences/README.md`, `system-preferences/package.json`, `system-preferences/vite.config.ts`, `system-preferences/src/RemoteComponent.tsx`, `system-preferences/src/configs/systemPreferences.ts`, `system-preferences/src/helpers/systemPreferences.helpers.ts`, `system-preferences/src/hooks/api/configuration.ts`, `system-preferences/src/pages/SystemPreferences.page.tsx`, `system-preferences/src/translations/`, `system-preferences/src/**/*.test.ts(x)`, `docs/MIGRATED_MODULES.md`

Management Dashboard (MD) System Preferences as a Vite federated remote, extracted in COP-7194 (`docs/MIGRATED_MODULES.md`). It edits a fixed set of tenant configuration keys of the Configuration Service, each inline in its table row. Federation name `systemPreferences`, exposes `./RemoteComponent` (named and default), local port `5191` with `strictPort` (`system-preferences/vite.config.ts`). Tier 1 providers, shared UI and session code are copied from `status-codes` (see `ai-project-knowledge/modules/status-codes.md`).

## Preferences

`SYSTEM_PREFERENCES` (`system-preferences/src/configs/systemPreferences.ts`) is MD's list of 32 keys, in MD order. Each has a `type` (`TEXT`, `PASSWORD`, `BOOLEAN`, `NUMBER`, `ENUM`, `LIST`), a translation `nameKey`, and optionally a `descriptionKey` (shown as an info tooltip), a `defaultValue` (shown while the tenant has no value), `options` (enums) and `secured`. Only `openAiApiToken` is `secured` (`PASSWORD`). Adding a preference means adding an entry and its EN and DE `systemPreferences.preferences.*` texts.

## API

`useConfigurationApi` (`system-preferences/src/hooks/api/configuration.ts`) binds the `@emporix/api-calls` 1.7.1 configuration calls to the host tenant (`options.tenant`): `getConfigurationCall` (`./next`), `createConfigurationsCall` (`./next`, one entry, with `secured: true` for a secured key), `upsertConfiguration` (`./platform`: PUT, and a POST when the PUT answers 404, as MD's update did), `deleteConfigurationCall` (`./next`). The client is created with `createApiCredentials` (`system-preferences/src/api/bootstrap.ts`, as in `sites-settings`).

## Routes

One hash route, `/` (`system-preferences/src/RemoteComponent.tsx`); other paths redirect to `/`. The MD URL `/apps/management/system-preferences` is unchanged.

## Permissions

`System Preferences Viewer` can view; `System Preferences Manager` (`system-preferences/src/configs/accessControls.ts`) is needed to edit, save and clear. Without it the edit button renders disabled. Permissions come from the remote's own `PermissionsProvider`.

## List

`SystemPreferencesPage` (`system-preferences/src/pages/SystemPreferences.page.tsx`) loads every key in parallel per tenant (`getConfigurationCall` each); a key the tenant has not set answers 404 and is listed with its default, without a toast. A secured key is never kept in the page: it shows `********` when set.

- Client-side CL `DataTable` (`lazy={false}`, 10 rows a page): Name (translated, info tooltip when there is a description), Key, Value; each with a contains filter. MD filtered the Name column on the translation key; the remote filters on the translated name.
- A boolean shows as a switch that cannot be toggled outside edit mode; a list as comma-separated text.
- A host tenant switch reloads the list for the new tenant; a late answer from the old one is dropped.

## Edit, save and clear

Row editing is Prime row editing through the CL `DataTable` pass-through (`editMode="row"`, `onRowEditComplete`, a `rowEditor` column whose `body` draws CL `IconButton`s with MD's react-icons: pencil, cancel, save, trash). The value editor matches the type: CL `Dropdown` of the options (`ENUM`), `InputSwitch` (`BOOLEAN`), comma-separated `InputText` (`LIST`), empty `InputText type="password"` (`PASSWORD`), else `InputText` starting from the default.

- Save turns the editor value into the stored type (`toPreferenceValue`: number, boolean, trimmed string array) and creates the key when the tenant did not have it, else updates it; success toast "System preference created / updated successfully".
- An empty secret is not saved (`shouldSkipSave`).
- A failed save shows "Failed to create / update system preference" with the API detail messages (else its message, `preferenceErrorDetails`); the row keeps its value.
- **Clear value** (trash) shows only while editing a stored secured key (`canClear`); after the CL `ConfirmBox` it deletes the key, closes the row editor and shows the row empty. A failure shows "Failed to delete system preference".

Pinned by `system-preferences/src/pages/SystemPreferences.page.test.tsx`, `system-preferences/src/helpers/systemPreferences.helpers.test.ts` and `system-preferences/src/configs/systemPreferences.test.ts` (which replaces MD's source-text tests for the site-deletion and webhook keys).

## Translations

`system-preferences/src/translations/{en,de}/systemPreferences.ts` keep MD's `systemPreferences.*` keys. EN and DE key parity and the absence of `primereact` are pinned by `system-preferences/src/translations/translations.test.ts`.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned |
| Federation `name` | `systemPreferences` (`system-preferences/vite.config.ts`) |
| Host route `key` → path | `systemPreferences` → `/apps/management/system-preferences/*` (`management-dashboard` `src/router/module-routes.tsx`) |
| Host env var | `VITE_SYSTEM_PREFERENCES_URL` (`management-dashboard` `.env.*`) |
| Local port | `5191`, `strictPort` |
| Hosting | no target of its own: published into `/system-preferences/` of the shared site of each project by `.github/actions/deploy-remote`; `.github/workflows/system-preferences-firebase-*.yaml` |
| Local deviations | none |

## Not yet scanned

- Tier 1 copies shared with `status-codes` (providers, IAM hooks, shared UI) — see `ai-project-knowledge/modules/status-codes.md`.
