# Dispatch

Read this after setup (`SKILL.md` § Workflow step 3). Choose one playbook, or one
hand-off (`SKILL.md` § Hand-offs). Do not read a playbook until it is chosen.

## Sources, first match wins

Sources 2–4 read files or Jira. For ticket work starting at explore, draft,
or update, that happens inside plan mode (`SKILL.md` § Workflow step 2).

1. `--playbook <name>`, or a first token `feature`, `bugfix`, `refactor`, `investigation`, `auto`, `open-a-pr` (`pr` → `open-a-pr`), `pr-comments` (`comments` → `pr-comments`), `watch-pr` (`watch` → `watch-pr`). `review` is a playbook only as `--playbook review`; a first token `review` is the stage token (source 2), which runs the work playbook from its Review step.
2. The `**Playbook:**` line of an existing plan for `{KEY}` (`ISSUE_PLAN` from the run-folder resolver, `emporix-setup` `references/runs-layout.md`; the dev-plan in the same `{RUN_FOLDER}`; or the plan-mode file from this conversation). A plan with no such line was written by `emporix-feature`, so its playbook is `feature`. A stage token (`architect`, `implement`, …) uses this source for the work playbook.
3. The playbook already chosen earlier in this conversation for `{KEY}`.
4. The message and the ticket. With a key, Buddy **get-issue** first (a read, allowed in plan mode). Use the first row that matches:

| Signal | Route |
|---|---|
| An open PR to watch until it can merge: "watch PR 48", "get the PR green", "babysit the PR", "CI is red on the PR", "until it is mergeable" | `watch-pr` |
| Review comments on an open PR to fix: "fix PR comments", "address review feedback", "reply to the review", a PR number with comments to handle | `pr-comments` (never the `emporix-pr` skill: it runs Bugbot) |
| A hand-off row in `SKILL.md` § Hand-offs matches, and nothing asks for product code | that skill |
| A question with no change asked for ("how", "why", "where should", "is this a bug?") | `investigation` |
| "auto", "take it all the way", "finish this ticket" | `auto` |
| "open the PR", "ship it", with reviewed work on the branch | `open-a-pr` |
| Self-review the ticket's work against its approved plan: "review COP-123", "re-run the review", "review it again" (not comments on an open PR, which is `pr-comments`) | the work playbook from its Review step (source 2), as the `review` stage token does. No approved plan → say that Review needs one and stop |
| Jira type **Bug**, or wrong behaviour that exists today ("broken", "fails", "regression", "500 on …", a stack trace) | `bugfix` |
| Restructure with behaviour unchanged, said or clearly implied ("refactor", "extract", "split", "clean up", "simplify", "rename", "tech debt") | `refactor` |
| New or changed behaviour: a Story, a Task with a product outcome, "add", "support", "allow", "new endpoint/field/screen" | `feature` |

Two rows match (for example "refactor the cart so it stops rounding
wrong", both a bug and a restructure), or none does → ask once, naming the
options and what each would do, and stop. Do not guess.

**No key yet** (`/emporix-dev explore cart total rounding is off`, or a
message with no `ABC-123`): route from the message alone, and start the work
playbook at explore without a key, as `emporix-feature` does. Draft asks once
for the ticket or parent key (`emporix-feature` `references/draft.md`). Only
Investigation never needs one.

**Parent + brief** (a key for an Epic, a parent, or a thin ticket, plus a
prompt describing new work): route on the prompt, not the parent's issue
type. `emporix-feature` decides the mode during explore and creates the child
ticket at approve (`references/approve.md`), which also renames the run
folder and **Branch** to the child key. Every later step uses the child key.

A refactor that also changes behaviour is not a refactor. Suggest `bugfix`
or `feature` for the behaviour, and a separate `refactor` ticket for the
restructure.

An `investigation` whose answer calls for a change ends by naming the
playbook. It does not switch on its own.

## Work playbook for Auto

**Auto** (step 1) comes here only when `{KEY}` has no plan. It needs a
work playbook, so:

- Use sources 2 and 3 as written. Skip source 1: the `auto` token chose Auto, not the work playbook.
- In source 4, read only the `bugfix`, `refactor`, and `feature` rows, and match them on the ticket (Buddy **get-issue**: issue type, summary, description). Read the message too, ignoring the words that asked for Auto ("auto", "take it all the way", "finish this ticket"). Never route to `auto`, `review`, `pr-comments`, `watch-pr`, `open-a-pr`, `investigation`, or a hand-off from here.
- Two rows match, or none does → ask once, as above, and stop. This is not one of Auto's two auto-answered questions. A guessed playbook would set the wrong plan rules.
- The answer is written to the plan's `**Playbook:**` line at draft, so a resumed Auto reads it from source 2.

## Say it

One line before the first step, so the user can correct it early:

```text
Playbook: bugfix — issue type Bug, failing checkout total
```
