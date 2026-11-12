# Canonical brand vocabulary (v1)

The contract between the `brand-create` action (writes it) and every
consumer: `brand-apply` (maps it onto an app through a profile) and Figma
exports. Names describe **roles**, never hues or a specific app's variables.

A consumer shows only values from these tokens. When it needs a brand value
the vocabulary lacks (a weight, a colour role), add the token here and to
`scripts/brand/tokens.mjs` with a default; never choose the value inside the
consumer. Layout constants (paddings, sizes of a sample component) are not
brand values.

## direction.json

```json
{
  "id": "raw-steel",                       // kebab-case, unique in the folder
  "name": "Raw steel",                      // short, evocative
  "brief": "…",                             // the original brief, verbatim
  "archetype": "industrial-b2b",            // see archetypes.md
  "summary": "One sentence a stakeholder understands.",
  "seeds": { "brand": "#c2410c", "accent": "#334155", "neutral": "#64748b" },
  "roles": { "text.muted": "neutral.700" }, // only overrides of the defaults below
  "radius": { "control": "2px", "container": "2px", "feature": "4px" },
  "font": {
    "heading": { "family": "Barlow Condensed", "weights": [500, 700] },
    "body": { "family": "Inter", "weights": [400, 600] }
  },
  "type": { "heading.weight": 700, "body.weight": 400, "action.weight": 700, "action.transform": "uppercase", "action.letterSpacing": "0.06em" },
  "sample": { "shop": "…", "headline": "domain headline for the mock-up", "products": [{ "name": "…", "price": "€…", "badge": "…" }] },
  "source": { "url": "https://…", "use": "own|inspiration", "brandFile": "source/site-brand.json" },
  "polarityOverride": "only when the user asked to reverse light/dark: who and why",
  "references": [{ "source": "web", "app": "…", "url": "…", "image": "source/refs/site-….png", "note": "…" }],
  "decisions": [{ "id": "DEC-1", "topic": "…", "choice": "…", "why": "…", "references": [0] }],
  "substitutions": [{ "kind": "font", "what": "font.heading", "wanted": "Brandon Grotesque (commercial)", "used": "Josefin Sans", "why": "not on Google Fonts; nearest geometric match" }]
}
```

Comments above are explanatory; the real file is plain JSON. `sample`,
`references`, `decisions`, `summary` are optional but expected. `source`
only with `--from-site`. `substitutions` is required whenever any value is a
closest alternative (kinds: `font`, `colour`, `contrast`, `shape`, `type`,
`vocabulary`, `other`); see the rule in SKILL.md.

## Palettes

Each seed (`#hex` or `oklch()`) becomes a 10-step ramp `50…900`. The seed
lands unchanged on its nearest step (marked ◆ in the sheet); the other steps
follow fixed lightness targets with chroma tapered toward the ends and
clamped to sRGB. Plus `palette.white` and `palette.black`.

| Palette | Use |
|---|---|
| `brand` | action colour family (buttons, links, focus) |
| `accent` | secondary emphasis, gradients, highlight surfaces |
| `neutral` | text, borders, quiet surfaces; give it the brand's temperature |

## Roles (`color.*`) and defaults

A role value is a palette step (`brand.600`) or `white` / `black`.

| Role | Default | Meaning |
|---|---|---|
| `surface.canvas` | white | page background |
| `surface.raised` | white | cards, header, panels |
| `surface.subtle` | neutral.50 | quiet sections, image wells, inputs |
| `surface.accent` | accent.500 | highlight surface, gradient end |
| `surface.inverse` | neutral.900 | footer / dark band |
| `surface.action` | brand.600 | primary button |
| `surface.action-hover` | brand.700 | primary button hover |
| `surface.action-subtle` | brand.50 | secondary hover, selected row, badge |
| `text.heading` | neutral.900 | headings |
| `text.body` | neutral.800 | running text |
| `text.muted` | neutral.600 | placeholders, meta text |
| `text.action` | brand.600 | links, secondary buttons |
| `text.action-hover` | brand.700 | link hover |
| `text.on-action` | white | label on `surface.action` |
| `text.on-inverse` | white | text on `surface.inverse` |
| `border.default` | neutral.200 | dividers, card borders |
| `border.strong` | neutral.900 | input borders, emphasis outlines |
| `border.action` | brand.600 | secondary button outline |
| `border.focus` | brand.600 | focus ring |

`contrast.mjs` checks 13 pairs: all text roles against their surfaces at
4.5:1 (WCAG 1.4.3) and action/focus/strong borders against the canvas at
3:1 (WCAG 1.4.11).

## Shape, type

| Token | Default | Meaning |
|---|---|---|
| `radius.control` | 4px | buttons, inputs, pills, badges |
| `radius.container` | 8px | cards, panels, notifications |
| `radius.feature` | 16px | hero blocks, large teasers |
| `font.heading` / `font.body` | — | family + weights (required); the weights used by `type.*` are added automatically |
| `type.heading.weight` | 700 | all heading levels |
| `type.body.weight` | 400 | running text |
| `type.action.weight` | 700 | button and badge labels |
| `type.action.transform` | none | button label casing (`none`, `uppercase`) |
| `type.action.letterSpacing` | 0 | button label tracking |

Not in v1 (backlog, with the evidence that asked for it). Add to this file
first, then to the scripts and the profiles:

| Missing | Evidence |
|---|---|
| `color.feedback.*` (success/warning/error/info) | dark brand: green availability and red sale prices fell to ~2.5:1 |
| `color.surface.header` | adamfabrication.com, birkmann.de: header band colour is part of the identity |
| `type.heading.transform` | birkmann.de: uppercase headings recorded as substitution |
| `color.shadow.*` (light, strong) and `shadow.*` style | card shadows stay on square/flat brands; the showcase library's Drop Shadows page has 6 elevation levels that need a shadow colour (`--colors-shadow-light` / `-strong`, the primary at 5% / 10%). `brand-figma` skips that page until the token exists |
| `color.icon.*` | showcase library `mapped` has 12 icon colours; the vocabulary derives none (`icon-primary-dark` is an approximate mapping) |
| `color.gradient.*` | showcase library Colors page and `mapped`: 4 gradient variables |
| `type.body.italic`, `type.body.bold` | showcase library text styles: body regular, italic, bold, link and link bold at each size |
| radius nesting rule | showcase library Border radius page: nested radii must be one step apart; the vocabulary has no check for it |
| `asset.logo` (light/dark) | dark brand: storefront logo disappeared |
| `radius.media` | mondaymerch.com: 18px-rounded image wells inside square or rounded tiles |
| `radius.selection` (checkbox), `radius.input` separate from buttons | mondaymerch.com: pill buttons with square inputs; one control radius turned checkboxes round |
| density/spacing, motion, dark-mode switch | not tested yet |
