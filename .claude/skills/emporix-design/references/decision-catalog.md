# Decision catalog and gap report

Design choices that differ from prior art (accessibility fixes, workarounds
for missing library parts, pattern calls) are **recorded, not buried**, so a
human can refine, reject, or re-apply them later, in this design and in
others.

## Files

| File | Scope | Purpose |
|---|---|---|
| `${DESIGNS_DIR}/decisions.json` | all designs in the repo | the catalog; one entry per decision |
| `${DESIGNS_DIR}/${SLUG}/gap-report.md` | one design | suggested library/design-system changes, shaped like the accessibility section |
| `${DESIGNS_DIR}/${SLUG}/design.json` | one design | lists the `DEC-` and `GAP-` ids the design uses, and the Figma links |

Read the catalog at the start of every design. **Reuse** `accepted` and
`provisional` decisions for the same pattern so designs stay consistent;
do not invent a second answer. `rejected` and `superseded` entries must not
be applied.

## `decisions.json`

```json
{
  "version": 1,
  "decisions": [{
    "id": "DEC-001",
    "kind": "guideline | wcag-deviation | wcag-reported | workaround | pattern",
    "status": "proposed | provisional | accepted | rejected | superseded",
    "title": "…",
    "priorArt": "what prior art does",
    "decision": "what this design does instead",
    "rationale": "…",
    "criteria": ["1.3.1"],
    "consequence": "visible cost, if any",
    "alternatives": ["B: …", "GAP-6"],
    "area": "global | b2b-commerce-frontend | management-dashboard | …",
    "scope": "global | pattern: … | screen: … | issue-specific: {design}",
    "appliedIn": [{ "design": "slug", "nodes": ["6:1368"], "iteration": 2 }],
    "reapply": "exact, repeatable edit instructions",
    "supersededBy": null,
    "history": [{ "date": "YYYY-MM-DD", "change": "…" }]
  }]
}
```

Rules:

- `kind: "guideline"` is a standing rule from user comments (see
  `guidelines.md`, rule intake), usually `accepted`, with `source`
  (who/when), `guideline` (its `G-n` or `<PREFIX>-n` id) and optional
  `overrides`. Its `area` decides where it applies: `global` = every area and
  project; an area id = that product area only. Read only entries whose
  `area` is `global` or the design's resolved area. `appliedIn` lists designs
  it has been applied to.
- Every entry has an `area`; issue-specific decisions carry the area of their
  design and an `issue-specific:` scope, and are not applied to other designs.
- New decisions start `proposed`; `provisional` when the user keeps them for
  now; `accepted` only on the user's say-so.
- IDs are never reused. `DEC-` numbers increase; append, never renumber.
- `reapply` must be precise enough for the refine playbook to
  execute without guessing (node name pattern, property, style key).
- Every `[DEVIATION]` flag in `brief.md` and `report.md` cites a `DEC-` id.
  The Figma Notes frame never does: it states the decision in plain words
  (its reader has no access to the catalog).
- Write the JSON with the repo's formatting; keep entries valid so tools can
  parse it.

## `gap-report.md`

The design-system owner's to-do list. Same shape as the accessibility
section: what is wrong, what the design did instead, what to change.

```markdown
# Design-system gap report — {slug}

**Prior art:** {library name + file key}
**Design:** {Figma URL} (page {id})
**Date:** {YYYY-MM-DD}

| ID | Type | Gap | Workaround (decision) | Suggested library change | Priority | Status |
|---|---|---|---|---|---|---|
| GAP-1 | not-published | … | proposal/… (DEC-006) | Publish … | high | suggested |
```

Types: `not-published`, `missing-state`, `misbound-token`, `naming`,
`duplicate`, `unscoped-variable`, `wcag`, `availability`, `metadata`,
`other`. Status: `suggested`, `accepted`, `in-library`, `resolved`,
`wont-fix`. Priority follows the cost to designers: `high` blocks reuse,
`medium` forces a workaround, `low` is cosmetic.

A second table, **WCAG incompatibilities reported (not fixed)**, lists the
`wcag-reported` decisions: `WCAG-n`, criterion, where, observation, impact,
suggested fix, decision id, status (`reported`, `accepted-risk`, `fixed`).

Make a concrete suggestion for every gap. "Publish X", "add Status=Y",
"rename A to B" — not "improve".

## Report integration

The Jira/chat report lists decision ids and gap ids with a one-line title and
status, and points at `decisions.json` and `gap-report.md`. `gap-report.md`
is local; for Jira, put its table in the comment body.
