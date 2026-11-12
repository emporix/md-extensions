# Playbook: brand-apply

Internal playbook of `emporix-design`. The supervisor does not read this
file; one `generalPurpose` subagent reads it (`references/dispatch.md`). Do
not read the other playbooks. Resolve `DESIGNS_DIR` (`.ai/designs`; source
`emporix-setup/scripts/load-config.sh`) if the supervisor did not pass it.

Map canonical brand tokens onto one app through a **target profile**, show
the result in the running app, and only then write it. The app's code is
never edited by this action: everything the profile cannot express is
reported as a gap. No Figma needed.

## Arguments

- `{brand}` (required) — brand folder from brand-create (uses `chosen.json`)
  or a `{id}.tokens.json` path
- `--site <code>` — the site to theme. Never defaulted: when it is not
  given, ask (step 2). Passed explicitly to both scripts.
- `--fonts fontsource|bunny|google` — how the brand's web fonts reach
  visitors. Never assumed silently: when not given, ask (step 2).
  - `fontsource` (default, recommended): font files are downloaded once at
    generation time (pinned Fontsource version) and self-hosted next to
    the theme; visitors' browsers contact no third party.
  - `bunny`: `@import` from fonts.bunny.net (EU-hosted, no-logging claim);
    still a third-party request.
  - `google`: `@import` from fonts.googleapis.com; third-party request
    with known GDPR exposure in the EU.
- `--write` — write the theme into the app (default is preview only)
- `--register` — with `--write`, add the site to the app's theme registry
  when it is missing
- `--routes <a,b>` / `--viewports desktop,mobile` — narrow the preview

## Files

- Target profile: `${DESIGNS_DIR}/target.json` in the app repo. Schema:
  `references/brand/profile-schema.md`.
- Runs: `${DESIGNS_DIR}/brand-runs/{yyyymmdd-hhmm}-{site}-{direction}/` in the app
  repo (`theme.css`, `emit-report.json`, screenshots, `index.html`,
  `summary.json`). Runs are evidence, not source; keep them out of commits.

## Workflow

`SCRIPTS` = `scripts/brand/` in this skill; `TARGET` = app repo root.

1. **Resolve the profile.** Use `TARGET/${DESIGNS_DIR}/target.json`. When it is
   missing and `references/brand/profiles/{repo-name}.json` exists, copy that seed
   there and say so. Otherwise stop: write a profile with
   `references/brand/profile-schema.md` first.
2. **Ask for the site, every run.** Unless `--site` was given in this
   request, ask the user which site to theme before emitting anything. Offer
   the sites in `profile.preview.sites` (reachable in the running app) plus
   "a new site code", and mark `profile.preview.suggestedSite` as
   recommended when set. For a new site code, say that preview will append
   the CSS (`injected`) and that `--write` needs `--register`. Before
   `--write`, repeat the chosen site and any `knownConflicts` that apply to
   it, and write only after the user confirms. A site chosen earlier in the
   conversation does not carry over to a later write.
   **Ask for font hosting in the same question** when the brand uses web
   fonts (`fontSources` with `source: "google"`) and `--fonts` was not
   given: offer `fontsource` (self-hosted, recommended), `bunny` and
   `google`, with the one-line trade-off from Arguments; preselect
   `profile.fonts.hosting` when set. Pass the answer as `--fonts` to every
   emit in this run. For `bunny`/`google`, say in the report that the site's
   privacy notice must list the provider (not legal advice).
3. **Emit for preview.**
   ```bash
   node SCRIPTS/emit-css-vars.mjs --tokens {tokens} --profile TARGET/${DESIGNS_DIR}/target.json \
     --target TARGET --site {site} --fonts {fonts} --css-out {run}/theme.css --report {run}/emit-report.json
   ```
   With `fontsource` this downloads the woff2 files (needs network) into
   `{run}/fonts/{site}/`; the preview serves them from there. A family
   missing on Fontsource stops the emit: offer `bunny`/`google` or another
   font (a `font` substitution in brand-create). A `font licence:` line
   means a non-open licence; ask before writing.
   Any `drift:` line means the app changed under the profile (renamed or
   removed variable). Stop and show it; fix the profile, not the brand.
4. **Check the app is running** at `profile.preview.baseUrl` (`curl -s -o
   /dev/null -w '%{http_code}'`). If not, ask the user to start it (for
   emporix-showcase: `npm run dev`). Never start, stop, or restart an app
   server yourself; ask first, every time. Switching the branch under a
   running dev server (step 7) is fine only when no tracked files differ;
   say that the server now serves the branch's files.
5. **Preview.**
   ```bash
   node SCRIPTS/preview.mjs --target TARGET --profile TARGET/${DESIGNS_DIR}/target.json \
     --css {run}/theme.css --report {run}/emit-report.json --site {site} --out {run}
   open {run}/index.html
   ```
   It loads every route twice (as served, then with the site's theme
   request answered by the generated CSS) at 1440×900 and 390×844.
   No file in `TARGET` outside `.ai/` changes.
6. **Review.** Show 1-2 after screenshots inline and summarise:
   - theme applied (`intercepted` / `injected`) and variables changed per page
   - heading/body font before → after, and font hosting (self-hosted files
     and size, or the third-party host visitors will contact)
   - accessibility tree identical on every page (if not: show the diff; a
     difference with only CSS swapped is dynamic content or a CSS-driven
     visibility change and must be explained before writing)
   - **text contrast regressions** (new failures caused by the brand, with
     text, ratio and colours); each one blocks `--write` until the user
     accepts it or the direction changes
   - **closest alternatives**, as two explicit lists: substitutions chosen
     in the brand, and approximate mappings this app forces (`approx`)
   - **gaps** (brand tokens the app cannot express, or mapped but
     overridden in components, with where/why/fix), **unmapped** tokens,
     things the user may expect but will not see
7. **Write** only when the user asks (`--write`). First make sure the
   change is isolated: when `TARGET` is on a shared branch (`develop`,
   `main`, `master`, or the remote default branch), create a local branch
   `design/brand-{direction}-{site}` from it (`git -C TARGET switch -c …`;
   no files change). When `TARGET` already has uncommitted tracked changes
   outside the theme file, stop and ask. Never commit or push.
   ```bash
   node SCRIPTS/emit-css-vars.mjs --tokens {tokens} --profile TARGET/${DESIGNS_DIR}/target.json \
     --target TARGET --site {site} --fonts {fonts} --write [--register]
   git -C TARGET diff --stat
   ```
   With `fontsource` the write also syncs `profile.fonts.dir` (only the
   referenced files; stale ones are removed, so switching to `bunny` or
   `google` empties it). Run the same command again and confirm it prints
   `no change` (idempotent).
   List `profile.knownConflicts` that apply (tests that pin the default
   look); report them, do not edit those tests. Do not commit.
8. **Report** with `references/brand/apply-report-template.md`.

## Rules

- Design-only: never edit components, layouts, or tests to make a brand
  fit. An inexpressible token is a gap with a proposed upstream fix.
- Visitors' browsers must not contact a font host the user did not choose:
  the brand sheet may load Google Fonts on the designer's machine, the
  app theme follows `--fonts`.
- Never hand-edit the generated theme file; change the direction in
  brand-create and re-run.
- The preview is evidence only when the accessibility tree is identical;
  otherwise say what differs.
