# Draft the scenario

Write only in the Postman worktree from `references/branch.md`, and only
after the regression gate has passed. `Regression: none` (no existing folder
for the changed paths, or no collection on `develop`) is a pass of that gate.
Create the first `*-tests.postman_collection.json` when
`references/collections.md` says the file is missing.

## Rules to read first

From the primary `postman-collections` checkout (read-only):

- `.cursor/rules/postman-standards.mdc`
- `.cursor/rules/collection-kinds.mdc`
- `.cursor/skills/add-or-update-tests/SKILL.md`

Follow those for the journey, assertion messages, and collection kind.
`references/tests.md` is the script shape when those files do not show an
example.

`qa-assistant.mdc` asks for a review before collection edits. This pull
request is that review. Write the branch in this skill. Do not wait for a
second confirmation in chat. Do not push to `develop`.

Missing rule files → say so and follow `references/tests.md`. Do not invent
a looser standard.

## Contract

Search Emporix developer docs for each new endpoint (method + path) before
writing assertions. Match documented status codes, fields, and error bodies.
When docs and the plan disagree, stop and ask. When the docs MCP is
unavailable, say so and use the published docs plus a sibling request.

## What to add

Add one user scenario for the gap: setup, action, effect, cleanup. Prefer a
new collection folder named for that scenario. With `--folder`, add the
requests in that folder.

Copy a sibling request (auth, headers, URL object, test script). Schema and
URL shape: `references/collections.md`. Assertion style: `references/tests.md`.

Capture ids with `pm.environment.set`. Use Postman dynamic variables for
emails and names. End with the same delete the sibling folders use.

## Leave in place

- Existing requests, tests, and folders. Do not reformat the file.
- Committed environment templates. Secrets stay empty.
- `public/` and any second service directory.
- Assertions that fail because the API does not match the plan. Fix the
  product code in a later implement pass. Do not change the assertion to
  match a wrong response.

## One fix

After the draft Newman run, fix the draft once only when the local API
matches the plan and the assertion is wrong (status, field name, missing id
capture). Re-run that folder once. A second failure, or a response that does
not match the plan, is a stop: publish the findings and leave the worktree
uncommitted.
