# Publish the QA report to Jira

The ticket must show **inline screenshots** in the comment (not just filenames).

**Never send screenshot bytes through Buddy MCP.** Cursor rejects large tool payloads, so
`jira_attach_files` always fails. Upload files with Buddy **HTTP**, then post the comment.

## When to publish

| Verdict | `{KEY}` | Do |
|---|---|---|
| PASS | known, not `--skip-publish` | Publish in this turn |
| PASS | none or `--skip-publish` | Local report only |
| FAIL | any | **Do not publish.** Report to the user first (below). |
| FAIL | known + they said **publish** / `--publish-fail` | Then publish |

A FAIL comment on Jira without the user asking is a failed run.

## FAIL — report to the user first

**Hard stop.** End the turn. In chat, show:

- `QA: FAIL` and which required steps failed (`not exercised` is not a pass)
- the local `{ARTIFACTS_DIR}/report.md` path
- each failed step’s screenshot (absolute path, inline)
- that artifacts are local only until they say otherwise

Then wait:

| User says | Do |
|---|---|
| **publish** / “post to Jira” / “attach the fail” | `qa-jira-publish.sh` with `FAIL` |
| **skip Jira** / “don’t publish” | Leave local artifacts. `Jira comment: skipped` |
| they will fix / **re-run** / “try again” | Do not publish. They fix; run this skill again |
| **fix X** in this chat | Honour it only if they asked you to change product code (usually they fix). Then re-run QA if they want |

Do not publish a FAIL in the same turn as the first fail report unless they
already passed `--publish-fail`.

## One command (PASS, or FAIL after consent)

```bash
PUBLISH=$(skill_script emporix-qa-ui qa-jira-publish.sh)
sh "$PUBLISH" "$ISSUE_KEY" "$VERDICT" "$ARTIFACTS_DIR"
```

Shell: `required_permissions: ["all"]` (VPN + curl). Do not base64 files. Do not call
`jira_attach_files`. Do not put attachments on `jira_post_qa_report`.

The script:

1. Shrinks `step-*.png` / `ask-*.png` to sibling JPEGs (max 1280px)
2. `POST` each JPEG to `{buddyUrl}/api/jira/issues/{key}/attachments` (raw body, `X-Filename`)
3. `POST` `{buddyUrl}/api/jira/issues/{key}/qa-report` with `report.md` as `body` (not as a file)

Buddy URL: `EMPORIX_BUDDY_URL`, or `ai-setup.json` `jira.buddyUrl`, else
`http://ai-buddy.vpn.emporix.io`. Needs VPN. Never attach `report.md` or a token screenshot.

## Done when

The script prints JSON with `screenshotsAttached` ≥ the number of step/ask JPEGs, and
`commentId` set. Otherwise publish failed (Buddy not deployed, VPN down, or HTTP 404).

## No issue key

Write the local report only. On FAIL, still hard-stop for the user (no Jira to ask about).
