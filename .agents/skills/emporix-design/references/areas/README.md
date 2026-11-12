# Design areas and area rules

Design rules differ by product area (the storefront is not the Management
Dashboard). Rules are therefore kept **per area**, and an area is identified
by the Figma files it is designed in.

## Layers of rules (later wins)

1. **Global** — `../guidelines.md`: process, structure, reporting, WCAG default.
2. **Area (shared)** — `references/areas/<area>.md` in this skill: rules for one
   product area, with the observed facts about its design system.
3. **Area (local)** — `${DESIGNS_DIR}/areas/<area>.md`, optional, in the
   product repo (not committed): team-specific additions.
4. **Catalog** — `${DESIGNS_DIR}/decisions.json`: decisions and guidelines
   with `"area": "<id>"` (or `"global"`), including issue-specific ones.

A rule that contradicts a lower layer must say which rule it overrides.

## Resolving the area (read-only, no shell)

Needs only the **Read** tool. No execution, no network, no auto mode.

1. Read `registry.json` (and `${DESIGNS_DIR}/areas.local.json` if present).
2. From the Figma link (or key) take the file key, the segment after
   `/design/` (after `/branch/` for branch links). Form its fingerprint:
   first 4 characters, `…`, last 4 characters.
3. Match it against each file's `fingerprint`. As a second signal compare the
   file-name part of the link (`MAIN---B2B-New-Showcase` ≈ alias
   `MAIN - B2B New Showcase`); a link may lack it.
4. Outcomes:
   - fingerprint matches and the name does not contradict → that area; say so
     in one line ("Area: B2B Commerce Frontend, from the prior-art file")
   - fingerprint matches but the name contradicts, several files match,
     or the sources of one design belong to different areas → **ask**
   - no match → unknown: apply global rules only, **ask** which area this is,
     and offer to register it (below)

Resolve from, in order: the prior-art file(s), the guidance file, the target
file. A fingerprint is a matching hint, not authentication; never use it to
grant access or to skip a question the user should answer.

Optional stricter check, for users who allow shell commands:
`sh scripts/resolve-area.sh "<link>" [areas.local.json]` compares a SHA-256
hash and prints `area=`, `role=`, `rules=` (exit 3 = unknown). The skills do
not require it.

Extra read-only signal (also no shell): the Figma MCP `get_libraries` call on
the target file lists the library names it uses; a name equal to an area
alias supports the match.

## Registry and security

`registry.json` lists areas and their Figma files as **alias + role +
fingerprint** (first 4 and last 4 characters of the file key) plus an optional
**hash** (first 16 hex characters of the SHA-256 of the key). Never
put Figma links, file keys, node ids, or library keys in committed files: they
are not secret by themselves, but they have not been cleared for the
repository. `.ai/` (designs, catalog, prior art) is not committed, so full
links belong only there and in chat reports.

Registering an area or a file:

1. Fingerprint: first 4 characters, `…`, last 4 characters of the file key.
   Optional hash: `printf %s "<file key>" | shasum -a 256 | cut -c1-16`.
2. Add them under the area's `files` with an alias and a role
   (`release`, `design`, `working-copy`; a release names its design file in `integratesInto`). Do not
   write the full key anywhere.
   New area: add an entry and a `<area>.md` rule file (copy the stub of
   `management-dashboard.md`).
3. Team-only additions go to `${DESIGNS_DIR}/areas.local.json` (same shape).

## Managing rules

- Scope each rule in rule intake (`../guidelines.md`): **global** (holds for
  all areas and projects, for example WCAG control), **area** (this product
  only), or **issue-specific**. If the scope is not clear from the context,
  **ask**; do not default. Area rules: append `<PREFIX>-n` to the area file and
  add a catalog `guideline` entry with that `area`. Global rules go in
  `../guidelines.md` and the catalog with `"area": "global"`.
- Moving a rule between areas or to global: `/emporix-design --action refine
  --decision <id> --area <id|global>`; keep its id, add a `history` entry.
- Never copy another area's rules into a new area silently. Ask whether the
  new area inherits them.
- Area files hold: confirmed rules (with date and source), known facts about
  the area's design system (dated, re-verify), and pending questions.
