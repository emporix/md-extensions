# Build in Figma

`figma-use` and `figma-generate-design` are authoritative for Plugin API
rules, discovery, componentization, and validation. This file only adds what
is specific to a proposal page. Do not repeat their rules here.

## Target file and session

1. `--figma` URL → parse `fileKey` (branch key when present). Otherwise
   `create_new_file` named with every ticket key it will hold plus
   `Generated Designs` (for example `COP-4827, CIO-4813 - Generated Designs`)
   and use the returned key. A new file comes with an empty `Page 1`: after
   creating your own page, remove it if it is still empty and tell the user.
2. `create_session` with the file key and a one-line task description. Reuse
   the `sessionId` on every file tool call.
3. Prior-art libraries must be added to the target file (`get_libraries`).
   If one is only in `libraries_available_to_add`, add it; if that is not
   possible, say so and continue with imported-by-key components from the
   library file.

## Use the documented component and its rules

Pick components by the library's documentation page (see
`references/sources.md`), not by name match, and
apply the documented behavior (placement, size, timing) to the design and the
Notes frame. If a documented behavior fails WCAG 2.1 AA, follow it and report
it as `[WCAG-REPORTED]` when the user has chosen prior art, otherwise flag a
`[DEVIATION]` (see `accessibility.md`). Feedback components (status messages)
go where the page says, absolute inside the screen frame, not inside the
layout flow.

## Probe importability first

Keys read inside the library file can be **unpublished**: they resolve there
(`remote: false`) but fail from any other file. From the target file, in one
`use_figma` call, try `importComponentSetByKeyAsync` /
`importComponentByKeyAsync` / `importVariableByKeyAsync` /
`importStyleByKeyAsync` for every key in `prior-art.md` and return
`{ok, variants | err}` per key. A new draft in another team may not list the
library in `get_libraries`; import-by-key still works for published assets.

For each key that fails:

1. Search again with `search_design_system` for a published equivalent.
2. Compose from published parts (for example a header from Top Bar, Middle
   Bar, Navbar) and name the frame `… (assembled from published parts)`.
3. Otherwise build a local `proposal/<name>` component from the same
   variables and styles.

Record each failure and fallback in the **Prior-art issues** list. Never place
a hand-drawn lookalike without flagging it.

## Mechanics learned in practice

- Component property names carry an id suffix (`Label#703:7`). Resolve the key
  by prefix at runtime (`Object.keys(inst.componentProperties).find(...)`).
  Only toggle properties whose `type` is `BOOLEAN`; `INSTANCE_SWAP` and
  `VARIANT` reject booleans.
- Load every font the library text uses (`Open Sans` Regular/Bold, `Ubuntu`
  Bold) before appending instances, or `appendChild` throws.
- `resize()` resets sizing to FIXED. For hug-width local buttons call
  `resize()` first, then set `primaryAxisSizingMode = "AUTO"`.
- Adding an item the library lacks to a library component (for example a menu
  entry): `instance.detachInstance()` on the top-level instance, clone an
  existing item, edit its nested text and swap its icon with
  `swapComponent`, then `figma.createComponentFromNode(frame)` to get one
  reusable local `proposal/` component; report the missing item as a library
  gap and place the component in the proposals section.
- Hide an optional library part (a breadcrumb level) with `visible = false`
  on the nested instance; set the visible ones through their `Label` property.
- When a ticket has no guidance and no design, take the closest existing page
  of the same kind from the library (for My Account lists, the Order History
  page) as the layout pattern, and say so in the Notes.
- Each design page gets its own Notes frame; a file that holds several
  tickets also gets an `About this file` page. The tools cannot rename a
  file: report the intended name (every ticket key plus `Generated Designs`).
- German (or any language) layer: clone the happy-path frames into the language
  section, then translate with a dictionary in two passes: first the TEXT
  component properties of every instance (`setProperties`), then the remaining
  TEXT nodes (`characters`). Translated nested text inside instances works as an
  override. Re-generate the clones whenever the source screens change. Report
  nodes that still hold source-language text (library placeholders such as the
  banner) instead of translating them silently.
- A list/table card in the B2B Commerce Frontend follows area rule BCF-7: the
  library Input as quick search (`.label` instance `visible = false`, right icon
  swapped through the `↘ Icon right` instance-swap property), header cells with
  the `chevrons-up-down` icon, zebra rows, then a local pager component.
- When data may repeat (a coupon used in several orders), show one row per use
  and repeat the coupon name in each row; avoid merged cells.
- Icons on buttons follow area rule BCF-9 (semantic match, ask if unsure; never on Save/Cancel). Icon on a local button: insert the library icon instance first in the
  component, bind `Icon` (INSTANCE_SWAP) and `Icon left` (BOOLEAN) through
  `componentPropertyReferences`, then set the icon per instance with
  `setProperties`. Swapping resets the icon colour: re-apply the label colour
  variable to the nested vector strokes afterwards (in a second call).
- **Shadows clip.** Frames created with `createAutoLayout` clip their content, so
  the drop shadow of a card that sits flush against the left edge or bottom of
  its container is cut off there (only top/right show). MAIN's layout
  containers have `clipsContent = false` (only the root screen frame clips).
  After building a screen, set `clipsContent = false` on every container frame
  you created (not inside instances), except scroll areas, which must clip.
  Then **verify at the card edges**: crop the screenshot at the left and bottom
  of every card with an effect style; the shadow must be visible on all four
  sides. Do this check on every screen type (cards, panels, notes).
- Recolouring a library icon: some icons paint with a **fill** (the layer is still named `Vector (Stroke)`), others with a stroke. Set the colour variable on both strokes and fills of every vector in the icon (skip empty paint lists), and verify white icons on blue backgrounds (cart button, primary button) in the screenshot.
- Frames created with `createAutoLayout` clip their content. Library parts
  that draw outside their own bounds (an Input's error text is absolute, below
  the field) are invisible until you set `clipsContent = false` on ancestors
  and reserve space (padding) in the layout.
- Never take a screenshot in the same message as the edit it should show:
  parallel calls can render the old state. Edit first, screenshot after.
- A form design includes a validation state: an empty required field and an
  invalid value, using the library's error state (see `accessibility.md`).
  Name it `NN-2-…-validation-failed` next to the save-failed screen.
- `textStyleId` is a symbol on mixed-style text; guard with
  `typeof n.textStyleId === "string"` in audits.
- A failed `use_figma` call is rolled back; a retry starts from the previous
  state. Read-only calls cannot import variables or styles.
- Header and footer instances can hold white-on-blue text whose blue is a
  parent fill you must recreate when assembling; check the first screenshot
  for missing bars, clipped right-hand groups, and toasts covering chrome.
- Do not guess style or variable keys; look them up with
  `search_design_system`.

## Page, sections and frames

- Create one page: `{KEY} — {slug}` (or `{slug}`), or reuse a matching page or
  section found in the target file. Switch to it once per `use_figma` call.
- Sections per `guidelines.md` G-1 via `figma.createSection()`,
  `resizeWithoutConstraints(w, h)`, then `section.appendChild(frame)` and set
  the frame's `x`/`y` (relative to the section). Frame node ids survive the
  move, so earlier links stay valid. Build screens directly inside their
  section when possible.
- Left → right inside a section, 160px apart, 100px padding: one frame per
  screen named `NN-<screen>` at the prior-art viewport (1440 desktop unless
  the brief or prior art says otherwise). The **Notes** frame sits outside the
  sections at the left and ends with a **Provenance** block (`guidelines.md`
  G-9: hyperlinked headers for prior art, guidance and integration target;
  plain words, no `DEC-`/`GAP-` ids; WCAG criteria and Jira keys are hyperlinks:
  G-10, G-11). A file with several tickets also gets an `About this file` page.
- **Notes** frame (editable text): outcome, assumptions, proposal items,
  prior-art sources used, `Proposal — not shipped UI`. Reviewers read this
  first.
- Build each screen inside its wrapper from the start; never reparent across
  calls.

## Assembly order per screen

1. Import prior-art **whole-view composites** or reference-screen patterns
   first (page chrome, nav, table, form shell).
2. Fill with library **component instances** by key from `prior-art.md`;
   override text via component properties.
3. Bind fills, strokes, spacing, radii to library **variables**; apply text
   and effect **styles**.
4. For each prior-art gap, build a local component once, named
   `proposal/<name>`, built from the same variables and styles; place
   instances. Add it to the Notes frame's proposal list.
5. Icons: import SVG from the codebase or library; never redraw from
   primitives.
6. Needed states (empty, error, loading, validation) only when the brief
   requires them: separate frames `NN-<screen> — <state>`.

Realistic fictional content that fits the layout: long names, long
translations, and the number of rows a real page shows.

## Validate (evidence, not vibes)

Run one read-only `use_figma` audit per screen and return counts only:

- INSTANCE nodes, and how many resolve to a library (remote) component
- nodes with fills/strokes bound to a variable vs. raw paints
- TEXT nodes with a text style vs. without, and font families in use
- detached instances and local components outside `proposal/`

Targets: no raw paints or unstyled text where a token exists; font family
equals `prior-art.md`; every `proposal/` component justified by a **Gap**.
Then one composition screenshot per screen. Compare against the guidance
(structure) and a prior-art reference screen (look). Check clipped text,
overlap, wrong variants, placeholder text left in instances.

## Export and record

- `get_screenshot` per screen frame (2x for small frames) → save under
  `screens/screen-NN-<name>.png`. Verify non-empty.
- `design.json`: file key, URL, page id, screen node ids, `iteration: 0`,
  and `snapshot` (child count and a hash of all text per screen frame).
- `changelog.md`: `## Iteration 0 — initial design` with the audit counts.
