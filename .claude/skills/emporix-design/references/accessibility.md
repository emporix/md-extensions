# Accessibility (WCAG 2.1 level AA)

Prior art may not meet WCAG 2.1 AA. Where it does not, **WCAG wins**. Do not
copy a prior-art pattern that fails; use the nearest compliant library
component, style, or variant, or a `proposal/` component, and **flag the
decision** wherever it differs from prior art.

## When the user chooses prior art over WCAG

The default above is a default. If the user decides a pattern should follow
prior art even though it fails WCAG 2.1 AA, follow prior art **exactly** (no
partial fix, no semantic renaming that hides the difference) and report the
incompatibility instead:

- record a decision with `kind: "wcag-reported"` (it supersedes any earlier
  `wcag-deviation` for the same pattern; keep the old one as `superseded`)
- name layers by role and the prior-art style actually used
- mark it `[WCAG-REPORTED]` in the Notes frame and the report
- add a `WCAG-n` row to `gap-report.md` under "WCAG incompatibilities
  reported (not fixed)": criterion, where, observation, impact, suggested
  fix, decision id, status
- keep the other WCAG decisions in force unless the user changes them too

Switching back is `/emporix-design --action refine --decision <id> --use …`.

## Flagging

Mark each such decision `[DEVIATION]` in three places: the Notes frame in
Figma, `brief.md` under **Accessibility deviations**, and `report.md`. Each
entry states: what prior art does, what this design does instead, the WCAG
criterion. Choices that comply and match prior art need no flag. A gap prior
art cannot cover (for example, no focus state on a `proposal/` component) is
`OPEN`, not silently ignored.

## Design-time checklist

| Area | Rule | Criteria |
|---|---|---|
| Heading levels | One H1 per page; no skipped levels (H1 → H2 → H3). The same semantic role uses the same style on every screen. Put the level in the layer name (`H1 — …`). Choose the library `h<n>` style that matches the level, even when prior art used a different one for the look. | 1.3.1, 2.4.6 |
| Same element, same place | Page title, section title, primary action, feedback area use the same component and position across screens and states. | 3.2.3, 3.2.4 |
| Breadcrumb | Every page has a **meaningful** breadcrumb, even where prior art shows placeholders (`Link`, `Current page`, `Company Name`). Use the real hierarchy; the last item is the current page and is plain text, not a link. Name the layer `Landmark: breadcrumb nav`. | 1.3.1, 2.4.4, 2.4.5 |
| Landmarks and order | Name header, nav (with its purpose), main, footer in layer names. Layer order = reading order. | 1.3.1, 1.3.2, 2.4.1 |
| Labels | Every input has a visible label. Never use a placeholder as label or as a filled value. | 1.3.1, 3.3.2 |
| Read-only data | Show as label/value pairs. Do not fake it with a disabled input. | 1.3.1, 1.4.3 |
| Contrast | Text ≥ 4.5:1 (≥ 3:1 for ≥ 24px or ≥ 18.66px bold); UI component boundaries and focus indicators ≥ 3:1. Measure resolved colours, report the failing pair. | 1.4.3, 1.4.11 |
| Colour alone | Error, success, selected, required never rely on colour alone: add icon, text, or pattern. | 1.4.1 |
| Status messages | Success/failure feedback has icon + title + text, is announced (status/alert), does not auto-dismiss before it can be read, and does not cover content or controls. | 1.4.1, 2.2.1, 4.1.3 |
| Errors | Field errors name the field and the fix, next to the field. A failed save has a visible state. Design a validation state for every form with required or format-checked fields: use the library field's error state and its error text; show errors on submit, block the save, and move focus to the first invalid field. Prefer an enabled submit button over a disabled one (a disabled button cannot be focused and gives no reason). Error text is tied to its field. | 3.3.1, 3.3.3, 4.1.2 |
| States | Interactive components show hover, focus, disabled. A `proposal/` control without these is `OPEN`. | 2.4.7 |
| Text and spacing | Body text ≥ 12px as in prior art tokens; layouts survive 200% zoom and text spacing: no fixed-height text containers. | 1.4.4, 1.4.12 |
| Responsive | Every viewport reflows without horizontal scroll at 320px. | 1.4.10 |
| Icons | Icon-only controls need an accessible name in the annotation. | 1.1.1, 4.1.2 |

Design cannot prove compliance (no assistive-technology testing). State what
was checked at design time; do not claim conformance.
