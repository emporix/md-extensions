# Playbook: brand-create

Internal playbook of `emporix-design`. The supervisor does not read this
file; one `generalPurpose` subagent reads it (`references/dispatch.md`). Do
not read the other playbooks. Resolve `DESIGNS_DIR` (`.ai/designs`; source
`emporix-setup/scripts/load-config.sh`) if the supervisor did not pass it.

Turn a brief (optionally a live website) into 2-3 brand directions as W3C
design tokens, gate them on WCAG AA, and show them in a brand sheet. Works for
any app; nothing in the target repository changes. No Figma needed.

Produce brand **directions**, not code. Each direction is a small
`direction.json` written by you; scripts expand it into a full
`tokens.json` (W3C DTCG, canonical vocabulary), check contrast, and render
the brand sheet. Never hand-write or hand-edit `tokens.json`.

## Arguments

- `{brief}` (required) — industry, audience, character, e.g. *"Baking
  equipment manufacturer, heavy industrial steel aesthetic"*
- `--policy <text|file>` (optional) — fixed brand facts that must survive:
  existing brand colour(s), mandated fonts, things to avoid
- `--refs <paths or URLs>` (optional) — inspiration screenshots or links
  (mood boards, competitor pages); see `references/brand/references.md`
- `--from-site <url>` (optional) — measure a live website's brand (colours,
  fonts, corners, button voice) and build directions from it
- `--pages <url,url>` (with `--from-site`) — more pages of the same site;
  expect at least a category listing (PLP) and a product page (PDP). When
  not given, ask for them (offer two links found on the home page); a
  storefront brand judged from the home page alone misses tiles, prices,
  filters and buy boxes
- `--use own|inspiration` (with `--from-site`) — `own`: the site's brand is
  ours or a customer's and stays fixed; `inspiration`: foreign brand, borrow
  patterns but not identity. Ask when not given; never assume `own`.
- `--directions <n>` (optional) — 1-3, default 3
- `--slug <kebab-case>` (optional) — output folder name; default from the brief

## Output

Inside a git repository: `${DESIGNS_DIR}/brand/{slug}/`; otherwise `./brand/{slug}/`.

```
brief.md                      brief, policy, archetype choice, open questions
{id}.direction.json           your input per direction (edit these)
{id}.tokens.json              generated, canonical tokens (never edit)
refs/                         reference images copied in, if any
source/site-brand.json        measured brand of --from-site (+ source/refs/ screenshot)
brand-sheet.html              side-by-side sheet of all directions
chosen.json                   {"direction": "{id}"} once the user picks
```

`direction.json` + `tokens.json` are the durable brand source; re-applying
a brand after an upgrade starts from them. Where the repo ignores `.ai/`
(emporix-showcase does), they stay local for now: say so in the report so
the user knows the generated theme has no versioned source.

## Workflow

`SCRIPTS` = `scripts/brand/` in this skill. Node 18+ only, no install.

1. **Read the brief.** Note industry, audience (B2B buyer, consumer, trade),
   the character words, and any policy. A policy colour becomes a fixed seed
   in every direction. Ask only when a missing fact changes every direction
   (e.g. "keep our existing logo colour?"); otherwise assume and write the
   assumption into `brief.md`.
2. **Collect references** when `--refs` is given: follow
   `references/brand/references.md`. They inform choices; they are never copied.
   With `--from-site`, measure the site first (it opens one page headless;
   Playwright comes from the app repo):
   ```bash
   node SCRIPTS/extract-site-brand.mjs {url} --pages {plp},{pdp} --out {folder}/source \
     --use {own|inspiration} --playwright-from {app repo with node_modules/playwright}
   ```
   Check the printed values against the screenshots (one per page) before
   using them: is the action colour really the site's main call to action,
   are fonts and tile corners right? When another action candidate is the
   real one (e.g. the measured one only appears in a dark header), name it
   in every direction as `"source": {…, "action": "<candidate hex>"}`; the
   distance and vector checks then use it and say so. Add the site to every direction as
   `"source": {"url", "use", "brandFile": "source/site-brand.json"}` and as
   reference #0 with the screenshot. `own`: measured action colour and
   fonts become fixed seeds (like a policy). `inspiration`: name the
   borrowed patterns in a decision; action colour and heading font must
   not both stay; the logo and imagery are never used.
3. **Pick the archetype** from `references/brand/archetypes.md` (or describe a new
   one in `brief.md` when none fits). Then design `n` directions that differ
   on named axes (temperature, contrast, shape, type voice), not just hue.
   Give each a short evocative `name` and a one-sentence `summary`.
4. **Write each `{id}.direction.json`** per `references/brand/canonical-tokens.md`
   (format, roles, defaults; `references/brand/example.direction.json` is a full
   example). Record every non-default choice as a decision with a one-line
   *why*, citing reference numbers when a reference drove it. Use sample
   products/shop name from the brief's domain so the mock-up feels real.
5. **Build and gate** each direction:
   ```bash
   node SCRIPTS/build-tokens.mjs {id}.direction.json --out {id}.tokens.json
   node SCRIPTS/contrast.mjs {id}.tokens.json
   ```
   A FAIL is fixed by re-pointing the role to another palette step (e.g.
   `"text.muted": "neutral.700"`), then rebuild. At most two passes. A
   policy colour that cannot pass stays, and the failure is reported, never
   hidden. WCAG 2.1 AA wins over taste. With a source site also run
   `node SCRIPTS/site-distance.mjs {id}.tokens.json source/site-brand.json`:
   FAIL in `inspiration` means the identity was copied; FAIL in `own` means
   a departure from the brand has no recorded substitution.
6. **Render the sheet** and open it:
   ```bash
   node SCRIPTS/brand-sheet.mjs brand-sheet.html a.tokens.json b.tokens.json c.tokens.json
   open brand-sheet.html     # xdg-open on Linux
   ```
7. **Review with the user.** Summarise each direction in one line plus its
   gate result. Feedback is applied by editing the direction (seed, role,
   radius, font, decision) and rebuilding; mention which decision changed.
   When the user picks, write `chosen.json`. A combination ("A's colours
   with B's type") becomes a new direction, not an edit of both.
8. **Report** (chat): output folder, sheet path, the chosen direction and
   its decisions, contrast results, distance check (with a source site),
   **a table of all substitutions per direction**, open questions. Next steps:
   `/emporix-design --action brand-figma {folder}` for reviewable Figma
   components, `/emporix-design --action brand-apply {folder}` to see it in
   the real app.

## Rules

- **Deviate along the source's vectors** (`own` and `inspiration` alike).
  Each pair keeps its direction of change in perceived lightness (OKLCH L):
  text vs page, label vs button, hover vs normal. If the source's labels are
  darker than its buttons, ours are too; if its hover darkens, ours darkens;
  a light page stays light. Hue, saturation and step size are free, so a
  direction can be far from the source and still feel related. When contrast
  fails, move along the vector (pick another step in the same direction)
  instead of flipping it. `site-distance.mjs` fails a reversed vector. Only
  when the user explicitly asks for a reversal, set `"polarityOverride":
  "<who asked and why>"`; it is then shown as a warning.
- **Button fill vs page is advisory.** WCAG 1.4.11 does not require a
  labelled button's fill to contrast with the page; the gate reports it as
  WARN. Never trade a nicer label or the vectors for this pair.
- **Every closest alternative is recorded, never silent.** Whenever the
  direction uses something other than what was wanted (a commercial font
  replaced by the nearest Google font, a colour moved to another step to
  pass contrast, a measured colour rounded to the nearest ramp step, a
  pattern the vocabulary cannot express), add a `substitutions[]` entry:
  `kind` (`font`, `colour`, `contrast`, `shape`, `type`, `vocabulary`,
  `other`), `what` (token path), `wanted`, `used`, `why`. The brand sheet
  counts and lists them at the top; the chat report repeats them as a table.
  A site font with `googleFonts: false` always yields a `font` substitution.
- Directions are generic: no target app's variable names or file paths.
  Mapping to an app is brand-apply's job.
- Feedback colours (success/warning/error/info) stay with the target's
  defaults in this version; do not encode them in roles.
- Never reproduce another company's identity (logo, exact palette + type
  pairing of a named competitor). References inform, they do not define.
- Fonts default to Google Fonts (`source: "google"`) so the sheet and the
  app preview can load them; name a licensed font only when the policy
  provides it, with `source: "local"`. `source: "google"` means an
  open-licence family from that catalogue, not how the app serves it:
  brand-apply asks for hosting (self-hosted via Fontsource by default,
  Bunny Fonts, or Google).
