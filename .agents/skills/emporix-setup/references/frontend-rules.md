# Frontend rules

Used by step 1 (detect), step 2 (ask), step 5 (`AGENTS.md`) and step 5b
(migrate) when `app.kind` is `ui` or `fullstack`. Skip this file for `backend`.

Resolve paths from the installed skills root. Once `ai-setup.json` exists,
`scripts/load-config.sh` exports `SKILLS_ROOT`, `FRONTEND_RULES` and
`RULES_ROOT`; on a fresh setup resolve `SKILLS_ROOT` the same way the loader
does (`${EMPORIX_SKILLS_ROOT:-.agents/skills}`, then the user-level install
directories):

```bash
SKILLS_ROOT=${SKILLS_ROOT:-${EMPORIX_SKILLS_ROOT:-.agents/skills}}
DETECT="$SKILLS_ROOT/emporix-setup/scripts/detect-legacy-frontend-rules.sh"
STANDARDS="$SKILLS_ROOT/emporix-frontend-standards"
[ -f "$STANDARDS/SKILL.md" ] || STANDARDS=
RULES_ROOT="$STANDARDS/references/rules"
```

If `STANDARDS` is empty, say so, point at
`npx skills add emporix/emporix-ai-sdlc-skills --skill emporix-frontend-standards`,
and skip enabling `standards.frontend` for this run. Still offer the legacy
migration when step 1 found an old install.

## Detect (step 1)

1. Read `dependencies` and `devDependencies` in `package.json`.
   - `react` → this is a React frontend. Offer the base set:
     `core ui-components emporix-component-library testing e2e-test-ids api-data npm-dependencies i18n`.
   - `primereact` → also offer `primereact`.
   - `@originjs/vite-plugin-federation`, or a `vite.config.*` that calls
     `federation(` → also offer `module-federation`.
   - No `react` → do not offer frontend rules.
   - `package.json` unreadable or invalid → say so and treat it as missing.
2. No `package.json` → ask in step 2.
3. Existing `standards.frontend` in `ai-setup.json` → start from its `rules`.
   Add newly detected optional rules, and flag optional rules whose dependency
   is gone (report, do not silently drop). Add `e2e-test-ids` when it is
   missing (it joined the base set later) and name it in the report; the user
   trims it with `--set` if the repository is not tested in bugbug.io.
4. Run `sh "$DETECT" .` and keep the output for the migration.

## Ask (step 2)

Default mode writes the detected rules without a question and lists them in
the report; the user trims them with `--set standards.frontend.rules='[…]'`
(`core` stays while any rule is enabled). `--interactive` shows the base set
plus each optional rule with the dependency that triggered it and lets the
user deselect. Questions that are asked in every mode:

- No `package.json`: ask "Is this a React frontend?". Yes → base set; say a
  re-run adds optional rules once their dependencies exist. No → no frontend rules.
- Declined → omit `standards.frontend`. Still offer the legacy migration when
  an old install was found (step 5b is independent of enabling the new rules).
- Old install found: list the `REMOVE`, `KEEP` and `PKG` items and ask what to
  remove. `KEEP` items are never removed.
  - Default: every `REMOVE` item plus the `PKG` changes, except the items with
    no replacement (below).
  - When `PKG postinstall` is listed, offer `REMOVE` deletions only together with
    the `package.json` change. Otherwise the old `postinstall` sync copies the
    deleted files back on the next install. If the user declines the
    `package.json` change, keep the old files and say so in the report.
  - No replacement: these paths come from old FE syncs, and their content is not
    in `emporix-frontend-standards`: the `md-module-extraction` skill folders,
    and the `extension-module-template`, `md-extension-migration` and
    `md-extension-port-validation` rules. Mark them "no replacement" in the list
    and leave them unselected by default. The team may still use them.
- Unattended runs (no user to answer) → detected rules, no migration removals
  (report them instead).

Step 3 writes `standards.frontend` from these answers (omit when declined):

```json
"standards": { "frontend": { "rules": ["core", "ui-components", "…"] } }
```

## Migrate legacy `frontend-ai-rules` (step 5b)

Run when an old install was found and the user confirmed removals in step 2
(never without a yes). Independent of whether `standards.frontend` is set.

- `REMOVE <path>` → delete the file. Then delete any folder under
  `.cursor/skills/`, `.claude/skills/` or `.github/skills/` that is now empty
  (old syncs copied `contribute-global-rule` and, in early versions,
  `md-module-extraction`).
- `KEEP <path>` → leave it. Report it as kept: it was changed after the old
  sync. For the current FE rules, the generic content now lives in
  `emporix-frontend-standards`, so the team can keep only project-specific
  rules in the repo.
- `PKG dependency` / `PKG postinstall` → show the `package.json` diff that
  removes the `frontend-ai-rules` entry and its sync command from
  `postinstall` (drop the `postinstall` key if nothing else is left), apply
  it after a yes, then run the install command for the detected lockfile
  (`npm install`, `yarn install`, `pnpm install`) so the lockfile drops it.

## `AGENTS.md` (step 5)

When `standards.frontend` is set, the managed block's **Code style** table has
exactly one **Frontend rules** row — also on `--set` runs that only change
`standards.frontend.rules`. When `standards.frontend` is omitted, the row is
absent (the block is re-rendered, so a stale row disappears).

List the enabled rule files explicitly. Write `$RULES_ROOT/<name>.md` as
shown, not a machine-specific absolute path — `AGENTS.md` is committed and
`$RULES_ROOT` resolves per machine as above. Example with the base set:

| Authority | Path | What it governs |
|---|---|---|
| Frontend rules (`emporix-frontend-standards`) | `$RULES_ROOT/core.md`, `$RULES_ROOT/ui-components.md`, `$RULES_ROOT/emporix-component-library.md`, `$RULES_ROOT/testing.md`, `$RULES_ROOT/e2e-test-ids.md`, `$RULES_ROOT/api-data.md`, `$RULES_ROOT/npm-dependencies.md`, `$RULES_ROOT/i18n.md` | Read `core` always, then every listed rule whose `paths` match a touched file. If touched files are unknown yet, read every listed file. Do not paraphrase. |

## Commit (step 8)

After a migration, also offer to stage the deleted legacy files
(`git add -A -- <path>`), `package.json` and the lockfile. Prefer a migration
commit message such as `chore: remove frontend-ai-rules sync` when those are
the only staged changes.

## Report (step 9)

Frontend rules enabled (or "none"), and migration items removed and kept.
