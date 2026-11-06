# Mermaid-MCP Calls

Use these MCP tools in this order:

1. `get_mermaid_syntax_document`
   - `diagramType` (required)
   - `clientName` (required, use `cursor`)
2. `validate_and_render_mermaid_diagram`
   - `prompt` (required)
   - `mermaidCode` (required)
   - `diagramType` (required)
   - `clientName` (required, use `cursor`)
   - `useUrlShortener` (optional, defaults to `true`)

If rendering fails, use the returned error details to correct the Mermaid code and run validation again.

## Style Guide Mapping

Source of truth (via `STANDARDS_ROOT`):

- `$STANDARDS_ROOT/.style-guide/visuals/diagrams.md`
- any additional style files referenced from it

### Global config baseline

```mermaid
---
config:
  layout: fixed
  theme: base
  look: classic
  themeVariables:
    background: transparent
    lineColor: "#9CBBE3"
    arrowheadColor: "#9CBBE3"
    edgeLabelBackground: "#FFC128"
    edgeLabelTextColor: "#4C5359"
---
```

### Diagram-specific notes

- Palette policy:
  - Use only approved brand palette colors from the style guide.
  - Do not hard-code universal entity mappings (for example, "employee must always be one color") unless the user request or local diagram legend requires it.
  - Keep color usage semantically consistent within a single diagram (same role/state -> same color).
- `sequenceDiagram`
  - Prefer signal accent `#E86C07`
  - Actor/background values should align with `#DDE6EE` and text/borders `#4C5359`
- `classDiagram`
  - Class box styling via `style` lines:
    - `fill:#F2F6FA`
    - `stroke:#4C5359`
- `flowchart` / `graph`
  - Apply role-based node fills from palette (illustrative defaults, not mandatory identity bindings):
    - light neutral: `#DDE6EE`, `#F2F6FA`
    - secondary accent: `#A1BDDC`
    - muted accent: `#99ACBC`
    - strong accent: `#3B73BB`
  - Keep borders/text on `#4C5359` for readability

## Quality Checks

- Diagram type matches user intent.
- Brand colors are from approved palette only.
- No low-contrast label/background combinations.
- Transparent background is used when expected.
- Validation/render succeeds in Mermaid-MCP.
