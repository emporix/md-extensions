# Target profile (`${DESIGNS_DIR}/target.json`)

Describes how canonical brand tokens land in one app. It lives in the app
repo so it is upgraded together with the code it describes. Seed profiles
ship in `profiles/`.

| Field | Meaning |
|---|---|
| `target` | Repo name; matches `profiles/{target}.json` |
| `emitter` | `css-vars-override` (only emitter in v1): one CSS file of `:root` overrides |
| `tokenSources` | App files that declare the CSS variables. Every mapped variable must be declared here or it is reported as drift |
| `output.file` | Where `--write` puts the theme; `{site}` is substituted |
| `fonts` | Optional. `hosting` (`fontsource` \| `bunny` \| `google`; preselected answer when the skill asks, default `fontsource`), `subsets` (Fontsource subsets to self-host, default `["latin", "latin-ext"]`), `dir` (repo path for self-hosted files, `{site}` substituted, default `public/themes/fonts/{site}`), `href` (URL path the theme references them by, default `/themes/fonts/{site}`) |
| `figma` | Optional. `labels` (`brand`, `accent`, `neutral`): how the target's own Figma file names the colour ramps, e.g. "Secondary colors" for the accent. Used by `brand-figma` |
| `output.registry` | Optional. `file`, `anchor` (line after which entries live), `entry` template with `{site}` / `{siteKey}` (quoted only when needed) |
| `preview.baseUrl` | Running app, e.g. `http://localhost:3000` |
| `preview.themeHref` | URL the app loads the site theme from; the preview answers it with the generated CSS. When a page has no such request the CSS is appended instead (`injected`) |
| `preview.sites` | Site code → path prefix of sites reachable in the running app |
| `preview.suggestedSite` | Optional. Site offered as the recommended answer when the skill asks which site to theme; never used as a silent default |
| `preview.routes` | `{name, path}` or `{name, discover: {from, selector}}` (first matching link's href) |
| `map[]` | `{from, to, refOnly?, fontImport?, approx?}` — see below |
| `gaps[]` | Brand tokens the app cannot express: `{token, ticket?, where, why, fix}`; `ticket` is the id of the gap-ticket row that tracks it (read by `gap-catalogue.mjs`) |
| `knownConflicts[]` | Tests that pin the current look: `{file, when, why}` |

## `map` entries

- `from`: canonical token path (`color.surface.action`) or palette wildcard
  (`palette.brand.*`).
- `to`: one variable or a list. With a wildcard, `*` is replaced by the
  step (`--color-primary-*` → `--color-primary-600`). Steps the app has no
  variable for are skipped silently.
- `refOnly`: do not emit; only use this variable when another token
  references the palette entry (keeps `var()` chains, e.g. white).
- `fontImport`: load the font family for this variable, the way `--fonts`
  says: self-hosted `@font-face` rules (`fontsource`) or an `@import` from
  fonts.bunny.net / fonts.googleapis.com.
- `approx`: the target variable only approximates the role; say why. Every
  approximate mapping is listed in the emit report and the preview sheet.
- A mapping that a component overrides (e.g. a hard-coded utility class)
  also goes into `gaps[]` with `where`, so it is not reported as working.

The emitter writes `var(--mapped-palette-var)` when a role points at a
mapped palette step and a literal value otherwise, in map order, with no
timestamps: identical input gives identical bytes.

## Coverage the emitter reports

- **gap** — token listed in `gaps[]`: expected, needs an upstream change
- **unmapped** — brand token neither mapped nor a gap: decide which
- **drift** — `to` variable no longer declared by `tokenSources`, or `from`
  token unknown: the app or the vocabulary moved; update the profile

Writing a profile for a new app (until the readiness skill exists): list
the app's colour, radius and font variables, map each canonical role to the
variables that express it, run the emitter, and resolve every `unmapped`
line as either a mapping or a gap.
