# prior-art.md

Write `${DESIGNS_DIR}/${SLUG}/prior-art.md` in this shape. Keep it scannable;
later skills grep it for keys. No secrets, no customer data.

```markdown
# Prior art — {slug}

**Ticket:** {KEY or none}
**Area:** {area id from the fingerprint match in the create skill's areas/registry.json, or unknown}
**Confidence:** high | medium | low
**Collected:** {YYYY-MM-DD}

## Sources

| # | Kind | Reference | Used for |
|---|---|---|---|
| 1 | figma-library | {fileKey} {name} | components, variables, styles |
| 2 | figma-screen | {fileKey} node {id} "{name}" | closest existing pattern |
| 3 | screenshot | references/prior-art-01-cart.png | current live UI |
| 4 | code | {path} | token gap-fill |

## Foundations

- **Font family:** {family} — source: {text style / variable / code path}
- **Colors (variables):** {collection/name → key} for surface, text, border,
  primary action, danger, success. Modes: {light, dark…}
- **Spacing / radius:** {variable names → keys} or the observed scale
- **Text styles:** {style name → key} for page title, section title, body,
  label, caption, table cell
- **Effect styles:** {name → key}

## Components

| Role | Component | Key | Type | Key properties |
|---|---|---|---|---|
| Primary button | Button | {key} | component_set | `Label#…` TEXT, `Size` VARIANT |

## Component rules

Behavior stated on the library's documentation pages. One line per component
the brief needs: placement, size, timing, dismissal, states. Cite the page node.

- Notification (node 3907:5231439): full content width, 16px below the header,
  overlays content, closes after 4 s or with X.

## Patterns

One bullet per pattern the brief touches: page chrome, list/table with
filters, create/edit form, dialog/drawer, empty state, error banner.
Each cites a reference screen and states the rule ("forms use a 2-col grid,
labels above inputs, primary action bottom-right").

## Prior-art defects

Everything that will cost the next step. One row each; cite key or node id.

| # | Type | Where | Effect |
|---|---|---|---|
| 1 | not-published | Button set {key} | resolves in the library file, not importable elsewhere |
| 2 | misbound-token | {node}: effects bound to `spacing/none` | wrong token |
| 3 | wcag | {node}: values in placeholder grey, 2.8:1 | fails 1.4.3 |

Types: `not-published`, `misbound-token`, `naming`, `duplicate`,
`unscoped-variable`, `missing-state`, `raw-paint`, `wcag`, `other`.

## Gaps

Things the brief likely needs that prior art does not cover. Each becomes a
**proposal** item in the new design.

- {gap} — suggested handling

## Assumptions

- {inferred, not observed}
```
