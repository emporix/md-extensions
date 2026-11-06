# Guidance (what to design)

Guidance shows **intent**: a sketch, a competitor screen, a stakeholder
screenshot, an existing PNG under `.ai/mockups/`, or a Figma node. It is
not style authority; prior art is.

## Precedence

| Concern | Winner |
|---|---|
| Components, tokens, type, spacing, patterns | Prior art |
| Layout, content, hierarchy, flow, copy | Guidance |
| Accessibility (WCAG 2.1 AA) | WCAG, over prior art and guidance; flag `[DEVIATION]` |
| Scope (what screens exist, what is out) | Brief |
| Behavior or fields the brief does not list | Stop and ask |

A guidance image that uses off-system colors or custom controls is re-skinned
with prior-art equivalents; its structure is kept. Record each such swap in
`brief.md` under **Conflicts**.

## Collecting

1. `--guidance` paths/URLs.
2. With `{issue_key}`: `${MOCKUPS_DIR}/{KEY}-*` (newest wins): `mockup-*.png`,
   `brief.md`, `report.md`. Do not use `references/` shots there as guidance.
3. Pasted images in this chat.
4. Nothing and no `--no-guidance` → ask (part of the hard stop in the skill).

Persist guidance to `${DESIGNS_DIR}/${SLUG}/references/guidance-NN-<kebab>.png`
(copy, never edit originals; export Figma guidance nodes with
`get_screenshot`). Open every image before planning. For each, note in
`brief.md`: what it shows, what to keep, what to change.

## The ask (hard stop)

Only when prior art or guidance is missing. One short message:

- **Style:** the Figma library/file (and closest existing screens), or
  pasted screenshots of the live app.
- **Intent:** a screenshot or mockup of what to design, or **Skip** for
  brief-only.

Do not write `plan.md` or touch Figma in the same turn as the first ask.

## Using guidance

Never copy logos, customer data, or tokens visible in a shot; replace with
fictional content. If guidance and the brief disagree on scope, the brief
wins; list it as a decision for the user.
