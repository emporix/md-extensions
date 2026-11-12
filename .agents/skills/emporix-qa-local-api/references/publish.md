# Publish collection + Newman report to Jira

The ticket must get **file attachments** (collection JSON + Newman HTML) and a
comment. Never send file bytes through Buddy MCP.

## One command

```bash
PUBLISH=$(skill_script emporix-qa-local-api publish-jira-evidence.sh)
sh "$PUBLISH" "$ISSUE_KEY" "$VERDICT" "$ARTIFACTS_DIR" \
  "🤖 emporix-qa-local-api — $VERDICT"
```

Shell: host network / VPN (`required_permissions: ["all"]`). Do not base64
files. Do not call `jira_attach_files`.

The script:

1. Uploads `*.postman_collection.json`, `newman-report.html`, and
   `evidence-*.txt` to `{buddyUrl}/api/jira/issues/{key}/attachments`
2. Posts `{buddyUrl}/api/jira/issues/{key}/qa-report` with `report.md` as
   `body` and preamble `🤖 emporix-qa-local-api — {VERDICT}`

Buddy URL: `EMPORIX_BUDDY_URL`, or `jira.buddyUrl`, else
`http://ai-buddy.vpn.emporix.io`. Needs VPN.

It refuses `report.md` and `*postman_environment*` as attachments.

## Done when

The script prints JSON with at least one uploaded file and `commentId` set.
Otherwise publish failed (Buddy not deployed, VPN down, or HTTP 400 if Buddy
is still image-only — say to deploy the Buddy attachment allowlist for
`.html` / `.json`).

## No issue key

Write the local artifacts only. Say how to publish later:

`/emporix-qa-local-api {KEY}` with artifacts already under `{QA_DIR}/local-api/`.
