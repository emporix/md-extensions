---
paths:
  - "md-extensions/**/src/**"
  - "md-extensions/**/vite.config.ts"
  - "md-extensions/**/package.json"
---

# Extension Port Validation

After porting domain code into a remote, verify:

## Must be absent in remote `src/` (not docs)

- `primereact` / `primeicons` imports
- `MdDataTable`, `useTenant(`
- Host absolute navigate paths containing `/administration/`
- `permissions` field on `AppState`
- `jest.mock` / `jest.requireActual` (use Vitest `vi`)
- MD `InputField` / `ProductDataProvider` imports

Exclude `*.md` from anti-pattern greps — notes often name forbidden patterns.

## Must be absent in the remote folder

- `frontend-ai-rules` in `package.json` / `package-lock.json`, and `postinstall` / `sync:ai-rules` scripts
- `.claude/`, `.cursor/`, `.github/`, `.cursorrules`, `scripts/customize-ai-rules-index.mjs` — project rules live at the repository root

## Must be present

- Federation `name` matching MD route key
- `VITE_API_URL` (not `VITE_API_BASE_URL`)
- `@emporix/component-library/styles` at `RemoteComponent`
- Lean `InputField` from local `components/shared/`
- Hash-relative `constants/paths.ts` helpers
- U&G-style `.gitignore` env exceptions + `.vite`
- SCSS Modules for feature UI (avoid global styles MD can override)

## Parity

Do not claim “matches pilot” without `diff -rq` (file counts are not enough). Compare against playbook-aligned remotes in `docs/MIGRATED_MODULES.md`.

## Lockfile / CI

- Published `@emporix/component-library` semver — no `file:` / `"link": true`

## Deploy (shared Hosting site)

The remote deploys only through `.github/actions/deploy-remote` into the shared site of each environment (`docs/MODULE_MIGRATION_PLAYBOOK.md` §9). Each grep below must print nothing (`{module}` = the remote folder):

```bash
grep -n 'action-hosting-deploy' .github/workflows/{module}-firebase-*.yaml
grep -n '"public": "{module}/' firebase.json
grep -n 'emporix-{module}' .firebaserc
grep -nE '\b(base|assetsDir)\s*:' {module}/vite.config.ts
grep -n -- '--base' {module}/package.json
```

And each of the three workflows uses `./.github/actions/deploy-remote` (prod: `./.deploy-tooling/.github/actions/deploy-remote`) with the `MD_EXTS_FIREBASE_SA_DEV` / `_STAGE` / `MD_EXTS_FIREBASE_SA` secret of its site.

## Skill

Follow `md-extensions/.claude/skills/md-module-extraction/` + `docs/MIGRATED_MODULES.md` + `docs/REUSABLE_FROM_USERS_AND_GROUPS.md`.  
Host Phase 3: `management-dashboard/.claude/rules/federated-module-wiring.md`.
