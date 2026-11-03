---
applyTo: "md-extensions/**/src/**,md-extensions/**/vite.config.ts,md-extensions/**/package.json"
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
- Firebase Hosting **sites created** before first deploy (not only `.firebaserc`)

## Skill

Follow `md-extensions/.github/skills/md-module-extraction/` + `docs/MIGRATED_MODULES.md` + `docs/REUSABLE_FROM_USERS_AND_GROUPS.md`.  
Host Phase 3: `management-dashboard/.github/instructions/federated-module-wiring.instructions.md`.
