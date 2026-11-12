# Review checks

Each audit is one read-only `use_figma` call per screen frame. Return counts
and node ids only (never whole property bundles across a collection). Pass
`figma-use` in `skillNames`.

## 1. Conformance (prior art)

Measure on each screen frame:

- instances: total, library-backed (remote main component), local
- local components outside `proposal/`; detached instances (frames named like
  a library component with no instance ancestry)
- fills/strokes: variable-bound vs raw paints (ids of raw ones)
- text: nodes with a text style vs without; font families in use
- layout: frames with absolute positioning where auto-layout is expected;
  spacing values not on the prior-art scale
- effects: shadows not from an effect style

Findings: raw paint where a variable exists (cite the variable from
`prior-art.md`); unstyled text; wrong font family; a drawn control where the
library has a component; wrong variant (primary vs secondary action).

## 2. Guidance fidelity

Compare each screen screenshot with its `references/guidance-*.png`:
structure, hierarchy, content blocks, flow, copy. Findings: missing or
reordered block, lost primary action, content present in guidance but absent
in the design (and not listed as a deliberate change in `brief.md`).

## 3. Brief coverage

From `brief.md`: every screen in the plan exists; outcome is reachable; the
primary action is the most prominent control and appears once; the states the
brief names exist (empty/error/loading/validation); assumptions are visible in
the Notes frame; nothing out of scope was added.

## 3-0. Structure (guidelines G-1)

- frames sit in Sections: a happy-path section first, an Error Handling
  section, side flows separate, proposals separate; names follow
  `{KEY} - {Feature}[ - Error Handling | - {Side flow}]`
- no error or side-flow frame inside the happy-path section
- no duplicate of a container that already existed in the file
- responsive versions of every main flow exist in their own section at the area's standard viewports (G-13); error screens have them only for new components
- lists show 10 items (BCF-8); action/context buttons carry a semantically matching icon and Save/Cancel have none (BCF-9)
- tables and lists show a pager (G-12); in the B2B Commerce Frontend the German section exists (BCF-6) and My Account lists follow the Order History structure (BCF-7): quick search, sortable standard table, action column if applicable, pager
- the Notes frame has a Provenance block (area, prior art, guidance, ticket,
  records) and a multi-ticket file has an `About this file` page (G-9)
- the design honours the global rules, the rules of its product area (resolve
  by fingerprint, `references/areas/README.md`), and catalogued
  guidelines for those scopes (for the B2B Commerce Frontend: Notification for
  feedback, BCF-1). Do not apply another area's rules.

## 3a. Validation states

Every form with required or format-checked fields has a validation screen:
error state on the field, error text below it, the submit path blocked, focus
on the first invalid field, error text contrast ≥ 4.5:1, error not conveyed by
colour alone. A disabled submit button as the only validation is a finding
(3.3.1, 3.3.3, 4.1.2) unless catalogued as `wcag-reported`.

## 3b. Content and context

- no placeholder text left from prior art (`Link`, `Current page`,
  `Company Name`, `Placeholder`, lorem ipsum), in instances or the header
- the breadcrumb is meaningful and its last item is plain text
- the same context value (selected company, tenant, user) is identical in
  header, breadcrumb, title, and data on every screen

## 4. Accessibility (design-time, WCAG 2.1 AA)

Prior art can itself fail WCAG. Judge against 2.1 AA, not against prior art.
Check that every place where the design differs from prior art for
accessibility is flagged `[DEVIATION]` in the Notes frame and report; an
unflagged deviation is a finding. A design that copied a failing prior-art
pattern is a **high** finding that cites both the criterion and the prior-art
node.

- heading order: exactly one H1, no skipped levels, same style for the same
  role on every screen, level visible in the layer name

- text contrast against its background: ≥ 4.5:1 body, ≥ 3:1 large text and UI
  boundaries (compute from resolved fills; report the pair and ratio)
- text below 12px; interactive targets below 24px in either dimension
- state conveyed by color alone (error, selected)
- icon-only controls without a visible or documented label
- heading order and a logical reading order (layer order matches visual order)

## 5. Consistency and craft

Shadows: every card or panel with an effect style shows its shadow on all four
sides (look at the left and bottom edges); clipped shadows mean a container
frame still clips its content.

Clipped or truncated text, overlap, uneven gutters, misaligned columns,
inconsistent corner radii or icon sizes within a screen, default placeholder
text left in instances, unrealistic content that hides layout problems
(only short names, one row).

## Severity

| Level | Meaning |
|---|---|
| high | Breaks the brief, prior-art conformance on a core element, or fails accessibility |
| medium | Visible inconsistency or missing non-core state |
| low | Polish that prior art supports |

## Shape of `reviews/review-NN.md`

```markdown
# Review NN — {slug}

**Design iteration:** {design.json iteration}
**Verdict:** ship-as-proposal | refine | rework
**Measured:** instances {n} ({lib} library) · raw paints {n} · unstyled text {n} · fonts {list}

## Findings

### 1. [high] {short title}
- **Where:** {screen} · node `{id}` "{name}"
- **Evidence:** {count, contrast ratio, or what the screenshot shows}
- **Why it matters:** {link to brief / prior art / a11y rule}
- **Proposed fix:** {concrete, uses a library key/variable/style when relevant}
- **Type:** fix | decision | proposal

## Open decisions

- DEC-001 [provisional] {title} — {consequence}

## Noted, out of scope

- {idea}
```
