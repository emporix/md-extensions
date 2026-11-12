# Report template

Write `{out}/report.md` using this structure. Replace placeholders. Do not
include API keys, secrets, or raw credential env names with values.

```markdown
# Certification question review

- **Goal:** Confirm each question and marked answer(s) are still valid against
  developer.emporix.io and emporix.com, or flag product/docs change.
- **Source:** classmarker_api | csv
- **Snapshot / path:** {relative path}
- **Scope:** banks={…}; category={…|all}; limit={n|all}
- **Fetched / reviewed:** {ISO-8601 date}
- **Complete ingest:** yes | no (resume note)

## Summary

| Verdict | Count |
|---------|------:|
| ok | {n} |
| stale | {n} |
| wrong_answer | {n} |
| ambiguous | {n} |
| docs_gap | {n} |

**Actionable (stale + wrong_answer):** {n}

## Findings

### {question_id or csv:Bank:row} — {verdict}

- **Bank / category:** {parent} / {category}
- **Type:** {question_type}
- **Stem:** {question text}
- **Marked correct:** {A,B,…}
- **Options:**
  - A: …
  - B: …
- **Evidence:**
  - [title](url) — short quote or fact checked on developer.emporix.io or emporix.com
- **Reason:** {for `ok`: "Still matches current docs/site." | for others: required —
  what the item claims, what sources say now, why it is no longer correct or unclear}
- **Supported correct (from sources):** {keys or unknown}
- **Proposed rewrite:** {omit when `ok` | stem / options / correct keys | (needs author)}

(repeat per reviewed question)

## Open questions

- {credentials, missing workspace, rate-limit resume, product facts}
- or `none`
```

## Chat summary

Keep chat short: source, counts, report path, open questions. For actionable
items, mention how many need author attention; do not paste every finding
unless the user asked for a scoped dry run (`--limit` small).
