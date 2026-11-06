# Playbook: brand-figma

Internal playbook of `emporix-design`. The supervisor does not read this
file; one `generalPurpose` subagent reads it (`references/dispatch.md`). Do
not read the other playbooks. Resolve `DESIGNS_DIR` (`.ai/designs`; source
`emporix-setup/scripts/load-config.sh`) if the supervisor did not pass it.

Turn a brand from `brand-create` into a reviewable Figma file: one variable
collection with one mode per direction, the atom pages (Colors, Typography,
Border radius) in the layout of the target's own design-system file, a
roles-and-gaps page, the molecule pages (Buttons, Form Fields, Tags) and the
organism page (Product Cards), with components bound to the variables. Every atom page
has one frame per direction, side by side, each in its own mode. The result
is a normal design folder, so `review` and `refine` work on it unchanged.

Two ways to use the same data. **B: a new file this action creates.** **A: a
duplicate of the target's library that the user makes**, with the brand added as
modes of the library's own variables, after a fidelity check (see the end).

## Arguments

- `{brand}` (required) — brand folder (`${DESIGNS_DIR}/brand/{slug}/`, all
  `{id}.tokens.json`, chosen direction first) or up to 4 token files.
- `--figma <url>` (optional) — existing file to update. Without it, create a
  new file named `Brand directions – {slug} (generated)`.
- `--profile <target.json>` and `--target <app repo>` (optional, together) —
  the target prior art. The profile adds the app's CSS variable to each
  variable's WEB code syntax, labels the ramps the way the target's file does
  (`figma.labels`), and says what the target does with each token. With the
  repo, the values the **target owns** are read from its CSS: type scale
  (sizes, line heights), radius scale and which roles each brand radius
  drives. Defaults: `${DESIGNS_DIR}/target.json`. Without them the pages show
  only brand values and say so.
- `--slug <kebab-case>` (optional) — design folder; default `brand-{slug}`.

## Workflow

`SCRIPTS` = `scripts/brand/` in this skill. Node 18+, no install.

1. **Spec.**
   ```bash
   node SCRIPTS/figma-spec.mjs {brand} --profile {profile} --target {app repo} \
     --out ${DESIGNS_DIR}/{design}/figma/spec.json
   ```
   More than 4 directions stops (Figma Professional: 4 modes per collection).
2. **File.** Load `figma-use` (and `figma-generate-library`; the output is a
   variable collection plus components). With `--figma`, use that file.
   Otherwise `whoami`; use the plan the user named, or the only plan with an
   editable seat; ask when several are editable. Load `figma-create-new-file`,
   then `create_new_file`. Call `create_session` once and pass its id on every
   call.
3. **Steps in order, one `use_figma` call each** (a script switches page at
   most once). Each script is assembled, never written by hand:
   ```bash
   node SCRIPTS/figma-code.mjs {step} --spec {spec} --out {tmp}/{step}.js
   ```
   | Step | Does |
   |---|---|
   | `variables` | collection `Brand`, one mode per direction, palette steps as hidden primitives, roles aliasing them, radius, font family and style. Style names come from Figma's font list, weights from the `type.*.weight` tokens (older tokens get the vocabulary defaults). A missing font stops it: report the family; it needs a `font` substitution in brand-create |
   | `pages` | page skeleton in the target's order (`BRAND ↓`, `Roles and gaps`, `I. ATOMS ↓`, `Typography`, `Colors`, `Border radius`, `II. MOLECULES ↓`, `Buttons`, `Form Fields`, `Tags`, `III. ORGANISMS ↓`, `Product Cards`); moves, never deletes |
   | `typography` | families and weights; desktop and mobile sizes from the target's scale; button casing and tracking from the brand |
   | `colors` | three labelled ramps with the seed marked `Base`, white and black |
   | `radius` | the three brand radii, the target roles each drives, a nesting example |
   | `brand` | per direction: closest alternatives first, every token with its value and what the target does with it (maps / approximate / mapped, not effective / no counterpart), WCAG pairs, what is not generated; once: the target's gaps |
   | `buttons` | page `Buttons`: `Button` (Style × State); returns the id |
   | `fields` | page `Form Fields`: `Input` |
   | `tags` | page `Tags`: `Badge`; returns the id |
   | `cards` | page `Product Cards`: `Product card` from Button and Badge instances (needs `--ids` with `components.Button` and `components.Badge`; save the ids of `buttons` and `tags` as `figma/ids.json`) |
   Each molecule page has a `Main components` frame plus one frame per direction with instances in its own mode.
   Pass the file content as `code`, unchanged. A run replaces only the
   frames it generated (exact names such as `Atoms / Colors — {direction}`);
   re-running updates in place. Never edit a generated node by hand; change
   the brand and re-run. Each frame's text uses the direction's own font
   through variables, so load every direction's fonts before any text edit
   in a patch script.
4. **Check.** One screenshot per direction frame. Look for clipped text,
   unequal cards, wrong fonts. Fix in the scripts, re-run the failing step.
5. **Design folder** `${DESIGNS_DIR}/{design}/`: `design.json` (file key,
   URL, page ids, component ids, one screen per direction frame with its
   mode), `brief.md` (outcome: choose or refine a direction; source brand
   folder; scope), `changelog.md` (iteration 0), `figma/spec.json`,
   `figma/ids.json`.
6. **Report:** file URL and one link per direction frame (`?node-id=`),
   variables and modes created, components, warnings, gaps (below), and the
   next step: `/emporix-design --action review {design}`.

## Rules

- Write only to a file this action created, or one the user explicitly named
  for writing in this request. Existing design-system files (a product library,
  the Management Dashboard file) have their own change control, so recommend a
  duplicate or a Figma branch and ask which file to write to. The user may still
  choose the original: then **warn and double-check before the first write**. Say
  that it is the shared original, what will be added (modes, variables, page-level
  modes, components) and that undoing it is manual, and proceed only on a second
  explicit yes that names the file. A link pasted for reading, "the library" or an
  earlier yes for another file is not that yes. Reading existing files for prior
  art is always fine.
- Values come only from the brand tokens; never pick colours, radii or fonts
  in Figma.
- Not generated, because the brand has no tokens for them yet: drop shadows
  (needs `color.shadow`), icon colours, spacing, border widths, semantic
  colours, italic and bold body styles. The `brand` page lists them. Never
  invent a value to fill the gap.
- Values the target owns (type scale, radius scale) are read from its CSS and
  labelled as the target's, never typed in.
- Action casing and letter spacing cannot be variables: they are per-frame
  overrides and reported as a gap.
- Figma file keys and links go only into `${DESIGNS_DIR}` and chat, never into
  committed files.

## Using the target's own library (A)

The same spec drives a **duplicate (or Figma branch) of the target's
design-system file** that the user makes and names for writing; this action
cannot copy files. Ask which file to write to and recommend the duplicate; if
the original is chosen, apply the warning and second confirmation from the Rules.

**Single lever.** Only the library's primitive collection (`brand`) gets a mode
per direction; `alias` and `mapped` keep their one mode, so one dropdown
switches a frame. The mapping is the profile's `figma.library` section:
`chain` (library role -> the primitive step it aliases), `anchors` (which brand
role owns a shared step, for example `color/primary/500` = `color.surface.action`),
`roleMap`, `radiusCap`, `fixedInLibrary`, `notGenerated`. The primitive ramps are
written **role-aligned** (the anchor's brand step goes onto the library's pinned
step), and a few new primitives carry values the library shares between roles
(radii, heading weight) with the library's original values in its own modes, so
the default look does not change.

### Fidelity check (mandatory before any write to a library)

A library hard-wires choices a brand may not share, so Figma can hold less than
the brand, and a later Figma -> CSS read-back would silently lose or invent
values. Run the check first and show **every element**, not a summary:

```bash
node SCRIPTS/figma-fidelity.mjs {spec} --profile {profile} \
  --out ${DESIGNS_DIR}/{design}/figma/fidelity.md --json ${DESIGNS_DIR}/{design}/figma/fidelity.json
```

It lists, per element and direction: **ramp re-ordered** (a library step is
pinned to a role, so the brand ramp no longer sits at its own steps), **roles
collapsed** (two brand roles land on one library variable, for example text
action and surface action), **role fixed by the library** (stays at the library
step in every direction), **approximate role** (closest brand token), **radius
capped**, **per-frame override**, **fixed in the library** and **no brand token**.
Refresh `chain` and `anchors` from the library when it changes (read the
`mapped` aliases once, read-only).

1. Print the table as it is. For each kind say in one sentence what it means for
   the designer, and name the affected elements. Do not collapse or paraphrase
   the rows.
2. Ask before writing: proceed, change the brand (a role that collapses may be
   fixed by choosing one shade for both), or choose the three-lever setup
   (modes on `brand`, `alias` and `mapped`: lossless both ways, three dropdowns).
3. Write only after a yes. List the variable modes and variables added, in which
   collections, before the first write. Writes are small calls, one direction per
   call, one page switch per call; font-family variables need the affected fonts
   loaded first; verify the state after any dropped call before retrying.
4. Verify with temporary clones switched through the modes (delete them) and a
   Mode 1 baseline that proves the default look is unchanged.
5. The final report repeats the fidelity table by element and says what a
   Figma -> CSS read-back can and cannot recover. Keep `fidelity.md` in the
   design folder.

**Read-back rule.** The brand tokens in the design folder stay the source of
truth. Changes made in Figma come back only as a diff of resolved role values
per mode against the tokens; collapsed, fixed and approximate roles are marked
not editable in Figma and are never written onto a brand token, and the
re-ordered ramps are never read back as the brand ramp.

### Figma readiness scan (library route; run before and after a brand is applied)

Read-only. Answers "can a brand reach everything in this file?" and, run again
after the brand is applied, "what did it miss and why?". Three scripts:

```bash
node SCRIPTS/figma-readiness-code.mjs --pages {ids} --frames all|widest --cursor {p,f} --budget 40000 --out {tmp}/scan.js
#   paste scan.js as `code` into use_figma; save the returned JSON as {tmp}/chunk-N.json
#   repeat with the returned `cursor` until `done` is true
node SCRIPTS/figma-readiness-report.mjs {tmp}/chunk-*.json --url {file URL without query} \
  --out ${DESIGNS_DIR}/{design}/figma/readiness.md --json ${DESIGNS_DIR}/{design}/figma/readiness.json
```

- Output is compact (names once per id, one array per finding) so a chunk fits the tool's
  48 KB return limit; the report script reads it. Pick a small `--budget` (12000) for
  heavy pages: one frame can still take long, so the script checks the time every 25
  layers and marks a cut frame `scan truncated`. Figma's own purple outline on component
  sets is folded into one "component set outline" row per frame (likely intentional).
- Pages: omit `--pages` for every page with content, or list ids. `--frames all`
  for atoms, molecules and organisms; `--frames widest` for screen pages (one
  1920 px variant per page, one level inside wrapper frames) because their trees
  are huge. Leave the tablet and mobile variants as a stated gap.
- It walks every layer itself (a plain `findAll` on a frame can miss layers
  inside component instances on first access) and stops after the time budget,
  returning a cursor. Heavy pages need several calls; never scan several heavy
  pages in one call (the connection drops and the call rolls back).
- Findings, each grouped per frame with up to three node ids: remote instances
  (component name and set), paints not bound to a variable (fixed marks such as
  logos, payment, social and artwork are grouped and marked "likely
  intentional"), gradients, shadows with a fixed colour, raster images, text not
  bound to the font variable, colour values typed as text, pages without the
  brand mode, heavy frames (size and layer count), pages not scanned.
- Run it before a write (what will not follow, and why) and after (did the mode
  reach what it should, which pages still show the default). Compare the two
  `readiness.json` files.
- Everything it prints is read-only and verifiable: see the rule below.

**Every automated result must be easy to verify by a human.** Each finding row
carries the id of the affected element (frame, instance, swatch, style) and a
ready link built from the file URL (`?node-id={id with : replaced by -}`), plus
the kind of finding, so the reader can click, look and confirm. A count without
a link is not a result. When the element is a variable or a style, link the page
where it shows. Scans print ids, not only totals; keep the machine-readable list
next to the report (`fidelity.json`, scan output, visual-diff tiles).

### Visual verification (library route)

Judge screens at **native size**, never from an overview thumbnail (a 9,000 px
frame shown 1,600 px wide hides text, icons and borders). Per representative
screen (Startpage, listing, detail, cart, one account page, one mail):

1. Pick one real variant, the widest breakpoint frame up to 1920 px, not the
   page's overview frame.
2. Export it in the brand mode with `get_screenshot` and `maxDimension` at least
   the frame's longest side (the response must say `width` = `original_width`;
   a 1920 x 11,685 px frame exports fine).
3. Baseline: a temporary clone named `TMP baseline ...` set to the baseline mode
   (the library's own Mode 1) on the `brand` collection; export it the same way;
   **delete the clones** in the next call and confirm by name.
4. Diff: `python3 -I SCRIPTS/figma-visual-diff.py before.png after.png --out {dir}`
   (needs Pillow). It prints the changed share and a grid by area and writes
   `diff-overview.png` (changed pixels in red) and the side-by-side crops of the
   most changed tiles.
5. Read the overview and the crops; for anything that looks unchanged but should
   have changed, sample its colour numerically from both images instead of
   trusting the eye.
6. Report per screen: the size exported, the changed share, what changed (type,
   colour bands, buttons, links, gradients) and what did not (photos, semantic
   colours, fixed marks), each with a link to the frame.

Typeface changes alone mark almost every text pixel as changed, so a high
changed share does not mean a high colour change; read the crops.

### Read-back diff (Figma to tokens)

Read-only. Shows what the library shows differently from the brand tokens, as proposals.

```bash
node SCRIPTS/figma-readback-code.mjs --profile {target profile} --out {tmp}/readback.js
#   paste readback.js as `code` into use_figma on the library copy; save the returned JSON as {tmp}/dump.json
#   right after writing a brand, save one as baseline.json too
node SCRIPTS/figma-readback.mjs {tmp}/dump.json --profile {target profile} --tokens-dir {brand dir} \
  --fidelity ${DESIGNS_DIR}/{design}/figma/fidelity.json [--baseline {tmp}/baseline.json] \
  --out ${DESIGNS_DIR}/{design}/figma/readback.md --json ${DESIGNS_DIR}/{design}/figma/readback.json
```

- Roles are resolved through the alias chain per brand mode, plus the true `ramp/*` variables.
- Collapsed, fixed, approximate and capped roles are "not editable": a difference there
  is never proposed for a token, and a capped value (64) is never written over 999.
- With a baseline each row says who changed (`figma-changed`, `token-changed`, `conflict`);
  on conflict the tokens win. Without one, every difference is just `differs`.
- Only colour, radius and weight roles in the profile's `roleMap` come back. Layout,
  copy, new components and per-frame overrides cannot (T-03, T-05).

### Gap catalogue

One document for everything that stops a brand going from brand to Figma to the
app, assembled from the sources rather than written by hand:

```bash
node SCRIPTS/gap-catalogue.mjs --profile {target profile} --gap-table {ticket G table .md} \
  --readiness {readiness report.json} [--readiness ...] \
  --fidelity ${DESIGNS_DIR}/{design}/figma/fidelity.json --scan ${DESIGNS_DIR}/{design}/figma/readiness.json \
  --figma-url {file URL without query} --brand {name} --ticket {ticket id} --out ${DESIGNS_DIR}/{design}/gap-catalogue.md
```

- Sections: the app (ticket rows joined to the profile's `gaps[].ticket`, readiness
  results), Figma (fidelity and scan findings, each with links), transfer, divergence
  in both directions, and which inputs were given.
- It reports what does not join: a profile gap with no ticket row, a readiness result
  no ticket row tracks. Propose the ticket row; do not hide the mismatch.
- Severity of Figma findings comes from a fixed table in the script; the "which gaps
  weaken this brand" judgement stays a human step.
- Contains Figma links when `--figma-url` is given: keep it uncommitted.

### Showing the brand: atoms and molecules first, then the rest (library route)

A library has no global mode switch: the direction is set per page. Once the brand
is written into the library copy (after the fidelity check and its yes), do this in
order. The sections are the library's own divider pages (`I. ATOMS`, `II. Molecules`,
`III. Organisms`, `IV. Pages`, `V. My Account`, `VI. Mails`, `VII. Flows`).

1. **Ask which file to write to**, before any write: a duplicate the user made, a
   Figma branch, or another file they name; recommend the duplicate. If the answer
   is the original library, warn and ask for a second explicit confirmation naming
   the file (see Rules) before any write. Name the file back in the report. (A file
   this action created needs no question.)
2. **Atoms and molecules, automatically, no human step.** Set the default direction
   on every page of sections I and II. Default = the direction in the brand folder's
   `chosen.json`, else the first direction; say which one and why.
   ```bash
   node SCRIPTS/figma-apply-mode-code.mjs --profile {profile} --sections I,II --mode "{direction name}" --out {tmp}/apply.js
   #   paste apply.js as `code` into use_figma; repeat from `continueAt` if it is not null
   ```
   Without `--mode` the script only lists the pages and their current mode. It writes
   the page-level mode and nothing else, and re-running is a no-op.
3. **Ask which direction is the default for review.** One question, listing the
   directions with their links, recommending the one set in step 2. A different
   answer re-runs step 2 with that mode (cheap on these pages).
4. **Offer the rest of the design**: "Apply it to organisms, pages, account, mails and
   flows too?" Do it on a yes, or when the same request already asked for the full
   design. Run it section by section (`--sections III`, then `IV`, ...), one call each:
   large pages take 20 to 73 s to switch and a call that spans several heavy pages
   drops and rolls back, so check the state before retrying and keep the budget small.
5. **Report**: file, the default direction and where it is set (sections and page
   counts, from `rows`), what was skipped (`continueAt`, pages not yet set), and the
   readiness scan to run next (it flags pages without the mode: `page-mode-not-set`).

Frame-level modes a designer set by hand are not touched; a page-level mode only
applies to frames that do not carry their own.
