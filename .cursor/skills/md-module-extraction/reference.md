# MD Module Extraction — Reference

FAQ, validation greps, and anti-patterns for the extraction workflow. For the step-by-step phases, see [SKILL.md](SKILL.md). For policy and federation contract, see the [playbook](../../docs/MODULE_MIGRATION_PLAYBOOK.md). For copy inventory, see [REUSABLE](../../docs/REUSABLE_FROM_USERS_AND_GROUPS.md). For PrimeReact → CL coverage, see [CL_WIDGET_STATUS](../../docs/CL_WIDGET_STATUS.md).

## AppState FAQ

**Q: Should permissions be in AppState?**  
A: No. Port slim `PermissionsProvider` using token + tenant from DashboardContext. (Ignore products if it still passes permissions.)

**Q: Should the remote fetch Ory session?**  
A: No. Host may pass optional `user` for contract compatibility only.

**Q: contentLanguage / currency?**  
A: Required in AppState. Seed ConfigurationProvider and sync on `appState` changes.

**Q: InputField or FormField?**  
A: Prefer each CL control's built-in `label` / `error` / `required` / `tooltip` props — do **not** wrap `InputText`, `Dropdown`, `Calendar`, `LocalizedInput`, etc. in lean `InputField` or standalone `FieldLabel`. Use `FieldLabel` only when the child has no label API (e.g. `InputSwitch`, plain text). Skip copying lean `InputField` when every field can use built-in labels. Never MD `InputField` (ProductDataProvider). There is no CL `FormField` replacement for that wrapper.

**Q: Local ConfirmBox / BackButton / DateValue?**  
A: On CL ≥ 2.2.0, import from `@emporix/component-library` **directly** in feature components and delete local copies. Do **not** add a pass-through wrapper. Cascade to sibling remotes when bumping.

**Q: When is a CL wrapper allowed?**  
A: Only when the library component is context-free and the remote must inject app dependencies (i18n, tenant languages, config). Canonical example: `components/shared/LocalizedInput.tsx`. Wrappers that only re-export props are forbidden.

**Q: Shared UI already exists in a prior remote — copy again?**  
A: **Ask first.** If `@emporix/component-library` already exports it → import directly. If only prior remotes have a local copy → prompt the user to migrate to CL now (skill `migrate-to-component-library`, Pattern A vs B) or keep a local copy for this remote. Do not silently third-copy forever.

**Q: Does CL export the PrimeReact widget this module uses?**  
A: Look up the `primereact/{path}` in [CL_WIDGET_STATUS.md](../../docs/CL_WIDGET_STATUS.md) (`in-cl` / `partial` / `missing`). Do not trust gap lists copied into this skill or the registry — they go stale.

**Q: Global CSS vs SCSS Modules?**  
A: Prefer **SCSS Modules** (`Component.module.scss`) co-located with the component. Avoid unscoped / global class names for feature UI — when federated into MD, host global styles can override them (and vice versa). Keep remote `index.css` to minimal shell resets only. No inline styles.

## Router sharing note

Host Vite often shares `react-router-dom`; remotes share/import `react-router` (v7). Match the **pilot U&G** remote (`react-router` in `shared` + imports). Do not invent a third package mix without verifying federation at runtime.

## products vs users-and-groups vs customer-groups

| Topic | products | users-and-groups (SoT) | customer-groups (derived) |
|-------|----------|------------------------|---------------------------|
| Scaffold source | Avoid for new ports | **Use this** | Copy U&G then reduce |
| PermissionsProvider | May vary / AppState | Required remote provider | Same as U&G (slim OK) |
| Scope | Products domain | Employee users + groups | Customer groups only |
| Local port | varies | `5173` | `5174` + `strictPort` |
| MD mode | typically A | was B → A | Mode A from day one |
| Template | Start from `md-module-migration` branch | Same | Same — absorb then reduce |

## Validation greps (run after domain port)

Scope greps to `src/`, `vite.config.ts`, `package.json`, and `.env*` — **not** README / migration notes (docs often mention anti-patterns by name and create false positives).

```bash
MODULE=customer-groups    # kebab folder
KEY=customerGroups        # camelCase federation name
SRC="md-extensions/$MODULE/src"

# Expect ZERO matches:
rg "from ['\"]primereact|from ['\"]primeicons|MdDataTable|useTenant\(" "$SRC"
rg "VITE_API_BASE_URL" "md-extensions/$MODULE" -g '!*.md'
rg "permissions\??:" "md-extensions/$MODULE/src/models/AppState"*
rg "administration/" "$SRC/constants" "$SRC/RemoteComponent.tsx"
rg "jest\.(mock|requireActual)" "$SRC"

# Expect REQUIRED matches:
rg "name:\s*'$KEY'" "md-extensions/$MODULE/vite.config.ts"
rg "strictPort:\s*true" "md-extensions/$MODULE/vite.config.ts"
rg "VITE_API_URL" "md-extensions/$MODULE/src" "md-extensions/$MODULE/.env"*
rg "@emporix/component-library/styles" "$SRC/RemoteComponent.tsx"
rg '"dev": "vite --mode dev"' "md-extensions/$MODULE/package.json"

# Parity / unexpected drift:
diff -rq md-extensions/users-and-groups "md-extensions/$MODULE" \
  --exclude node_modules --exclude dist --exclude .git --exclude .vite \
  --exclude package-lock.json --exclude '*.md'

# Lockfile: fail if CL is a local link
rg '"node_modules/@emporix/component-library"' -A2 "md-extensions/$MODULE/package-lock.json" | rg '"link":\s*true' && echo FAIL_LOCAL_CL_LINK

# MD wiring (Phase 3 hard gate):
rg "key:\s*'$KEY'" management-dashboard/src/router/module-routes.tsx
rg "VITE_.*_URL" management-dashboard/.env*

# --- Visual / parity drift (added after COP-6180 brands) ---

# MD global CSS variables leaking into remote SCSS — expect ZERO:
rg -- "--grey-|--blue-|var\(--red\)" "$SRC"

# Local SectionBox copy — expect ZERO (CL >= 2.3.0 exports it):
fd -t f 'SectionBox' "$SRC"

# quill must be 1.x wherever CL Editor is used; Quill 2 breaks
# PrimeReact 8's clipboard.convert(html) and silently loads no content:
rg '"quill"' md-extensions/*/package.json component-library/package.json

# Local node_modules drifting from the lockfile will make you code against
# the wrong library major. Expect no "invalid":
(cd "md-extensions/$MODULE" && npm ls primereact @emporix/component-library 2>&1 | rg invalid)

# Host-owned routes linked from the remote — each hit needs a deliberate
# decision + comment (no in-remote route exists for these):
rg "window\.location\.(assign|href)" "$SRC"

# PrimeReact inventory — then look up each path in docs/CL_WIDGET_STATUS.md:
rg "from ['\"]primereact|MdDataTable|ProductDataProvider|InputField" \
  "management-dashboard/src/modules/{Module}"* "management-dashboard/src/components/{module}"*

# Capabilities that vanish silently in a component-by-component port —
# run against the MD source module BEFORE Phase 2:
rg "TableExtensions|fetchVisibleColumns|tableConfigurationKey" \
  "management-dashboard/src/modules/{Module}"* "management-dashboard/src/components/{module}"*
rg "pi pi-" "management-dashboard/src/modules/{Module}"*   # exact glyphs to match
```

**Deployment reality check** (a green workflow only proves it deployed):

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  "https://emporix-$MODULE-develop.web.app/assets/remoteEntry.js"   # want 200
```

## Common anti-patterns

- Starting from template `master` or leaving a nested `.git` under `md-extensions/`
- Scaffolding from `products` for permissions/AppState
- Claiming parity with pilot from file counts alone (skipping `diff -rq`)
- Copying U&G domain folders when extracting a **different** MD module
- Assuming U&G employee forms are complete for a customer/vendor subtype (skip MD re-diff)
- Deleting every `*User*` file and breaking group member tables
- Leaving scaffold leftovers ("product list" in `.env.example` / README)
- Running anti-pattern greps on `*.md` notes (false positives)
- Federation name `extension` or mismatch with route key
- Colliding local ports with U&G (`5173`) / missing `strictPort`
- Using plain `vite` for `dev` so `.env.dev` never loads
- `BrowserRouter` inside remote
- Copying MD `InputField` / leaving `ProductDataProvider` imports
- Putting permissions on AppState
- Keeping forever-local ConfirmBox/BackButton/DateValue when CL ≥ 2.2.0 already exports them
- Silently third-copying shared UI without asking whether to migrate to CL
- Styling feature UI with global / unscoped CSS (prefer SCSS Modules)
- Adding pass-through wrappers "for consistency" (LocalizedInput is the only allowed pattern)
- Host absolute paths in HashRouter
- Adding `primereact` to remote `package.json`
- Committing `file:../../component-library` or lockfile `"link": true`
- Assuming Firebase works from `.firebaserc` alone (create Hosting sites first)
- Marking migration done when only the remote exists (MD env + route wiring missing)
- Deleting whole MD module folder while siblings share UI / skipping i18n re-home
- Jest syntax in Vitest tests
- Using `VITE_API_BASE_URL` instead of `VITE_API_URL`
- Blindly keeping U&G `usePagination(..., 'members')` when MD used shared `page`/`rows`
- Committing without the Jira key (`{KEY}-### Sentence case`) or branching without it — retrofitting means rewriting history
- Creating a Jira ticket without first asking whether one already exists (ask for the number or URL if it does), or inventing a key / defaulting to the COP-5597 epic when unsure
- Auditing for `TableExtensions` (or any capability invisible in a component diff) only at Phase 5, after the port is "done"
- Adding `primereact` to a remote because CL lacks a widget — promote it to CL as Pattern B instead (lookup `docs/CL_WIDGET_STATUS.md`; do not copy gap lists into the skill)
- Pairing PrimeReact 8's `Editor` with `quill` 2.x (silently loads no existing content; pin `^1.3.7`)
- Swapping MD's `pi pi-*` glyphs for react-icons without checking the shape matches (filled vs outline)
- Converting MD's fixed px control sizing to `rem` during the port
- Copying `SectionBox` locally instead of importing it from CL ≥ 2.3.0
- Trusting local `node_modules` over the lockfile when coding against a library API (`npm ls` reports `invalid` on drift)
- Merging the host PR before the remote is deployed and serving a `200` on `remoteEntry.js`
- Declaring done on structural gates alone — none of them prove the UI renders correctly

## Local dev loop

```bash
# Terminal 1 — remote (example: customer-groups on 5174)
cd md-extensions/customer-groups && npm run dev

# Terminal 2 — host
cd management-dashboard && npm run serve
# .env.local-dev: VITE_CUSTOMER_GROUPS_URL=http://localhost:5174/assets/remoteEntry.js
# Enable toggle on dev tenant only if using Mode B
```
