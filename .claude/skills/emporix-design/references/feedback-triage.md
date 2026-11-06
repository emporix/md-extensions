# Feedback triage

Normalize every feedback item, whatever its source, into one row.

| # | Source | Item | Target (screen / node) | Decision | Reason |
|---|---|---|---|---|---|
| 1 | human | "Make the promo field wider" | 01-cart · `12:40` | apply | cosmetic, within layout |
| 2 | review-01 #2 | Raw fill on banner | 01-cart · `12:55` | apply | variable `surface/warning` in prior-art |
| 3 | human | "Add a bulk-apply flow" | — | ask | new flow, not in brief |
| 4 | human | "Use a purple primary button" | 02-checkout · `13:07` | ask | conflicts with prior-art primary color |

## Decisions

- **apply** — within the brief's scope, consistent with prior art, and
  unambiguous about target and outcome.
- **ask** — needs a product/UX decision, changes scope or behavior,
  conflicts with prior art or guidance, or is ambiguous about the target.
  Ask in one batched message with a recommended default for each.
- **reject** — contradicts a decision the user already made (see
  `changelog.md`), is out of scope, or is unsupported by prior art with no
  stated reason. State why; the user can overrule.

## Rule intake

Besides apply/ask/reject, give each human comment a **scope**: **global**
(holds for every product area and project, for example WCAG control),
**area** (this product area only, for example the storefront's feedback
component), **issue-specific** (this story), or **unsure**. Full table in
`references/guidelines.md`, "Rule intake". Resolve
the design's area from its prior-art file (fingerprint match in
`references/areas/registry.json`, read-only) or
from `decisions.json`.

- global → `guideline` entry with `"area": "global"` (and `guidelines.md` when
  the user wants it in the skill)
- area → `guideline` entry with the area id and a new `<PREFIX>-n` in the area
  file
- issue-specific → normal decision, scoped to this design
- unsure → **ask** with a recommendation; until answered treat as
  issue-specific

Apply it now and offer to re-apply it to other designs in scope
(`--decision`). State the scope and the reason in one line in the triage table
(extra column `Scope`). Never widen or narrow a scope silently. If the scope is
not clear from the context, ask the human.

## Resolving the target

1. A node id in the feedback or review wins.
2. A named screen/element in `design.json` / the Notes frame.
3. A pasted screenshot: match its frame by comparing with `screens/*.png`.
4. Still unclear → `ask`. Never guess a node.

## Conflicts between sources

Human feedback outranks AI review findings. If they contradict, apply the
human item, mark the review finding `reject — superseded by human feedback`,
and note it in `changelog.md`.

Two review findings or feedback items that touch the same node are applied
together in one edit so the result is coherent.

## Changelog entry

```markdown
## Iteration {N} — {YYYY-MM-DD}

Sources: {human, review-01}
Human edits preserved: {node ids or none}

| Item | Change | Nodes |
|---|---|---|
| 1 | Promo field width 240 → 320 | 12:40 |

Rejected: {#, reason}
Open: {#, question}
Audit: raw paints {before → after} · unstyled text {before → after}
```
