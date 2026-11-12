# Postman mapping (setup)

Record **which Postman test folder this product owns**. Later
`emporix-qa-postman` and `emporix-qa-local-api` read this instead of guessing.

Do not store absolute paths. Store a workspace **folder name**, a GitHub
`owner/name`, and the service directory name inside that checkout.

## What to write

`ai-setup.json` → `qa.postman`:

```json
"qa": {
  "postman": {
    "workspace": "postman-collections",
    "repo": "emporix/postman-collections",
    "folder": "cart"
  }
}
```

- `workspace` — Cursor folder basename (default `postman-collections`).
- `repo` — from that folder's `origin` (expect `emporix/postman-collections`).
- `folder` — top-level directory in that checkout (`cart`, `order`,
  `webhook-service`). Not a file path.

Omit `qa.postman` when this product has no Postman tests or the checkout is
not in the workspace. Never store tenant, client id, or client secret here.
Env **names** stay the defaults (`EMPORIX_QA_API_URL`, `EMPORIX_QA_TENANT`,
`EMPORIX_QA_CLIENT_ID`, `EMPORIX_QA_CLIENT_SECRET`).

## Detect (no deep crawl)

1. Workspace folders already open, then sibling `../postman-collections`.
2. Checkout looks like Postman collections: top-level `*-tests.postman_collection.json`
   files and `package.json` depending on `newman`.
3. Candidate `folder`: match product repo name / `PROJECT.md` title / Buddy
   service name against **top-level directory names** only.

## Decide (default mode)

- Checkout open and one folder matches → write it, no question.
- Checkout open, no match → ask for the folder (the user may answer “none”).
- Checkout not open → omit `qa.postman`, no question. Report: “no Postman mapping — add `postman-collections` to the workspace, then `/emporix-setup --set qa.postman.folder=<name>`”.

## Scripts

Nothing is copied. `emporix-qa-postman` and `emporix-qa-local-api` run
`$SKILLS_ROOT/emporix-qa-postman/scripts/prepare-env.sh`,
`$SKILLS_ROOT/emporix-qa-postman/scripts/run-newman.sh`, and
`$SKILLS_ROOT/emporix-qa-local-api/scripts/publish-jira-evidence.sh` via
`skill_script`. Evidence lands in `.ai/qa/` (gitignored).
