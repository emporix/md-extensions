# Prior-art sources

## Priority

1. Figma URLs passed with `--figma` (library, file, or reference-screen node).
2. `design.priorArt` in `ai-setup.json` (`PRIOR_ART_URLS` from the loader).
3. Figma links documented in `PROJECT.md` / `ai-project-knowledge/ui.md`.
4. Libraries already added to a target file (`get_libraries` →
   `libraries_added_to_file`), when a target file is known.
5. User-pasted screenshots of the live app (full screens and the parts the
   design sits next to: chrome, trigger control, neighbouring table or form,
   empty/error states).
6. Design tokens and UI components in code (authority paths from the
   `AGENTS.md` Code style table and `ai-project-knowledge/ui.md`).

Guidance images (a screenshot or mockup of *what to design*) are **not**
prior art. They belong to the create playbook. A mockup under
`.ai/mockups/` is guidance, never style authority.

## The ask (hard stop)

Only when no Figma source and no screenshots exist. One short message:

- Link the Figma library or file with the product's components and styles
  (and node links to the closest existing screens).
- Or paste screenshots: name each (`Cart page`, `Promo field on cart`).
- **Skip** is allowed; the result is then labelled low-confidence and every
  style choice is an assumption.

Do not write `prior-art.md` in the same turn as the first ask.

## Reading Figma

- URL parsing: `design/:fileKey/...?node-id=1-2` → `1:2`; `branch/:branchKey`
  → use the branch key.
- One `create_session` per file key. Reuse the returned `sessionId`.
- Inventories (one call each, return ids/names/keys/counts only, never whole
  `componentPropertyDefinitions` across a collection):
  components and component sets with keys; variable collections with modes;
  text styles; effect styles; top-level frames of existing screens that match
  the brief.
- For each existing reference screen, run the inventory script from
  `figma-generate-design` step 2a-iii once to list the component keys,
  bound variables, and styles it actually uses. Usage on real screens beats
  the library listing when they disagree.
  Count **top-level** instances only (skip instances inside another instance)
  and group icons separately; a full-page inventory otherwise returns
  hundreds of header/footer/icon internals. Cite only the components the brief
  needs plus the page chrome.
- A node id from a ticket may exist in more than one file (library and working
  copy). Check both and say which one you treat as prior art and which as
  guidance.
- `get_screenshot` each reference screen (max 6) into `references/`.
- Discover the font family from variables/text styles, not from a guess.

## Documentation pages and component choice

A library usually has a documentation page per component ("Molecules /
Notification", "Buttons", "Tables"), with behavior text (placement, timing,
dismissal) and a screenshot of real use. Read those pages with
`get_metadata` + `get_screenshot` and record the behavior rules in
`prior-art.md` under **Component rules**. When `search_design_system` returns
several candidates, choose the one whose documentation page describes the job
(for example, "feedback after an action"), not the one whose name matches the
query: names and page titles can be wrong (a page titled "Toast Notification"
documented a tooltip). Record such mismatches as `naming` defects.

## Confidence

- **High** — Figma library with components, variables, and styles, plus at
  least one real reference screen.
- **Medium** — Figma partial, or screenshots plus code tokens.
- **Low** — screenshots only, or Skip.
