# Design references (Mobbin and others)

References are optional evidence for a direction: screenshots or links that
show a pattern, mood, or convention worth borrowing. They are stored with
the brand, shown in the brand sheet, and cited by decisions.

## Sources

| Source | How it arrives | `source` value |
|---|---|---|
| Mobbin | User saves screens/flows from mobbin.com and pastes images or gives exported files; links to the Mobbin screen as `url` | `mobbin` |
| Competitor / inspiration site | Screenshot the page (local browser) or user pastes one | `web` |
| Mood board, Figma frame, PDF page | Exported image | `moodboard`, `figma`, … |

This version reads what the user provides; it does not log in to or scrape
Mobbin. A later version can add a Mobbin connector behind the same
`references[]` format, so directions made now stay valid.

## Steps

1. Copy each image into `refs/` as `NN-short-name.png` (keep the original
   format); never reference files outside the brand folder.
2. Look at each image and note **what** it shows that matters for the brief
   (e.g. "dense spec table with tabular numbers", "orange used only for the
   primary action"). One line per reference.
3. Add to the direction's `references[]`: `source`, `app` (if known),
   `url` (if known), `image`, `note`.
4. Cite by index from decisions (`"references": [0, 2]`) when a reference
   drove the choice.

## Limits

- Extract patterns (proportions, contrast, casing, density, colour roles),
  not identities. Never take a referenced app's logo, exact palette plus
  type pairing, or illustration style.
- Reference images may be under the source's licence; keep them in the
  brand folder for internal review only and do not publish them in
  customer-facing material.
- Layout patterns seen in references (grid, navigation, flows) are noted in
  `brief.md` under "Layout ideas"; brand tokens cannot express them.
