# Publish to Jira

Write `{QA_DIR}/postman/{KEY}/report.md` from `references/report-templates.md`
first. The file is the comment body. It must not contain tenant, client id,
client secret, tokens, or the generated env.

Skip publish when coverage is `none` or the run stopped to ask a question.

## One command

Artifacts dir contains `report.md`, the Newman HTML for the runs that
finished, and the **draft** collection only. The develop collection stays in
`{QA_DIR}/postman/regression/`. The env file stays in `{QA_DIR}/postman/env/`.

Use the absolute `$PUBLISH` from the product checkout (`SKILL.md`). Do not
look the script up again.

```bash
sh "$PUBLISH" "$ISSUE_KEY" "$VERDICT" "$QA_DIR/postman/$KEY" \
  "🤖 emporix-qa-postman — $VERDICT"
```

Shell: host network / VPN (`required_permissions: ["all"]`). Do not base64
files. Do not call `jira_attach_files`. Do not call `acli` or Jira REST.

`$VERDICT` is `PASS` only when a pull request was opened or updated. A
regression failure or a draft failure is `FAIL`. The script posts
`report.md` as the comment and attaches `*.postman_collection.json` and
`*.html`. It skips `report.md` and `*postman_environment*` as attachments.

## Done when

The script prints JSON with `commentId` set. Otherwise publish failed
(Buddy not deployed, VPN down, or HTTP 400). The pull request URL in chat
still stands when the PR step already succeeded.

Then stop the local server (`emporix-qa-local-api` `references/boot.md`).
