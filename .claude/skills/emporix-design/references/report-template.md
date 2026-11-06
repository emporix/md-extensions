# Design report and publish

Write `${DESIGNS_DIR}/${SLUG}/report.md` locally; it is the Jira comment body.
Name every exported PNG by **basename** on its own bullet so the Jira
converter inlines it. No `file://` paths, no secrets.

```markdown
# Design {slug}

**Ticket:** {KEY or none}
**Figma:** {file URL} — screens: {each ?node-id= link}

**Outcome:** {one sentence}

## Screens

- screen-01-{name}.png — {what this screen shows}
- screen-02-{name}.png — {what this screen shows}

## Prior art

{confidence}; {n} library components, {n} variables, {n} styles used.

## Proposals (not in the design system yet)

- {proposal/name} — {why}

## Accessibility (WCAG 2.1 AA)

- [DEVIATION] {what prior art does} → {what this design does} ({criterion})
- [WCAG-REPORTED] {prior-art pattern followed by instruction} — {criterion}, {impact} (WCAG-n, DEC-n)
- OPEN: {gap that needs a follow-up}

## Decisions (catalog: decisions.json)

- DEC-001 [provisional] {title}

## Design-system gaps (gap-report.md)

| ID | Type | Gap | Workaround | Suggested library change | Priority |
|---|---|---|---|---|---|
| GAP-1 | not-published | {component/variable/style, key} | {proposal/… or assembled} (DEC-…) | {Publish …} | high |

Types and statuses: see `decision-catalog.md`.

## Assumptions

- {assumption}
```

Do not list `references/` images.

## Publish (only with `{issue_key}`)

The Figma link is the primary artifact; PNGs are the inline preview.

The publish script uploads only **top-level** files of the folder it is
given (`*.png`, `brief.md`) and posts `report.md` as the comment body. Stage
them first so `screens/` and local-only files are not involved:

```bash
STAGE=$(mktemp -d)
cp "$DESIGNS_DIR/$SLUG"/screens/*.png "$DESIGNS_DIR/$SLUG"/brief.md \
   "$DESIGNS_DIR/$SLUG"/report.md "$STAGE"/
PUBLISH=$(skill_script emporix-qa-local-api publish-jira-evidence.sh)
sh "$PUBLISH" "$ISSUE_KEY" PASS "$STAGE" \
  "🤖 emporix-design create — PASS"
rm -rf "$STAGE"
```

Never stage `prior-art.md`, `plan.md`, `reviews/`, `references/`, or
`design.json`. Shell: host network / VPN (`required_permissions: ["all"]`).
Done when the output has a `commentId` and `screenshotsAttached` ≥ the screen
count. A comment with only the Figma link and no inline PNGs is not done.
Without a key, say how to publish later with `{KEY}`.

## Session report (chat)

```text
Design: {slug}
Outcome: {one sentence}
Figma: {file url}
Screens: {01 url} · {02 url} · …  (each ?node-id= deep link)
Notes: {notes frame url}
Assets: {DESIGNS_DIR}/{slug}/
Decisions: {DEC ids + status}
Gaps: {GAP ids, high-priority first}
Screens: {PNG basenames}
Prior art: {confidence}; {used}/{gaps}
Proposals: {count}
Assumptions: {count; see brief.md}
Status: ready-for-review | needs-decision | blocked
Issue: {KEY or none}
Jira comment: {commentId or skipped}
Next: /emporix-design --action review, then /emporix-design --action refine
```

Embed every exported PNG in chat by absolute local path. Mention only
decisions the user must make.
