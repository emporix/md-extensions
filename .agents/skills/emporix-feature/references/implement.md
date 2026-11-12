# Stage `implement`

Turn the approved plan into code on a ticket branch, with tests and up-to-date project knowledge. Implement **exactly** the plan. Do not re-plan, widen scope, or invent a design from the Jira description. Leave `PROJECT.md` and `ai-project-knowledge/` true for the code as it is after the change.

Does not commit, push, or open a PR. Does not comment on a parent ticket. Does not close or transition Jira.

```text
implement progress:
- [ ] 1. load the approved plan (ready gate)
- [ ] 2. load mockups
- [ ] 3. ticket (light) + existing PR
- [ ] 4. branch or worktree
- [ ] 5. apply todos (tests included)
- [ ] 6. execute the existing suite + validation.commands
- [ ] 7. project knowledge
- [ ] 8. report → review
```

## 1. Load the approved plan

Do not invent a plan. No approved plan → stop; point at `/emporix-feature {KEY}`.

**File (preferred):**

1. The `Plan:` path from this conversation.
2. Else `ISSUE_PLAN` from `emporix-setup/references/runs-layout.md` in **this** checkout, then in the **primary** worktree (`git worktree list`, first path). Do not pass `--title`. The resolver still returns a legacy flat file and older `*-issue-prepare.md` / `*-prepare-issue.md` names. `AMBIGUOUS=1` or `PLAN_ELSEWHERE=1` → ask once; do not implement against a plan you guessed.
3. Use the **Approved plan** section (legacy: **Implementation plan**). Title and business description are outcome only.
4. `**Status:** draft` → not approved. Stop; the user must `approve` first. A file on disk is not approval. Other `*.md` files in the same folder are notes (`runs-layout.md` § Other notes). Read one when the user cites it or the work needs it. Do not implement from it.

**Fallback (no local file):** **get-issue** / **plan-issue** → structured `approvedPlan`, else the latest comment with `🤖 emporix-feature` or `Approved plan` (older: `🤖 emporix-issue-plan`, `🤖 emporix-issue-prepare`, `🤖 emporix-prepare-issue`). Missing too → **stop**. Do not implement from the Jira description alone.

**Caller plans.** The plan's `**Source:**` (in the Jira fallback: the comment's `**Source:**` line) names another skill (for example `emporix-dev`) and this run was **not** started by that skill's own step (`/emporix-feature implement {KEY}` typed directly) → stop before any branch or edit. Say that the plan belongs to that skill's flow, which adds steps before and inside implement, and point at `/{caller} implement {KEY}`. Review and pr have no such stop; they work on any plan.

**Ready gate** — stop (no branch, no edit) when any is true:

- **Open questions → Blocking** is not `none` / empty.
- A `Ready: no` from this conversation is still in force and the user did not override ("implement anyway", explicit in this turn).
- A cited seam no longer exists and you cannot find its replacement in the routed area.

Re-open every seam the plan cites. Code may have moved. A seam that is gone → stop and say what drifted. Do not silently replace the plan.

## 2. Load mockups

`references/mockups.md`. `{KEY}-*` folders under `{MOCKUPS_DIR}` (and a Jira mockup comment when local is empty) are the **visual spec** for UI the plan already includes. None → continue. Do not create one.

## 3. Ticket (light) + existing PR

**get-issue** for summary, `browseUrl`, `registeredFeatureId`. **search-prs** for `{KEY}`: an open PR already → reuse its branch name. GitHub **auth-check** and **default-branch** resolve `$BASE_BRANCH` (`auto` → default branch). Do not push.

## 4. Branch or worktree

`references/worktree.md`. Branch name is `TASK_BRANCH` from the resolver run in step 1 (the folder the plan lives in, or `**Branch:**` in the plan). Example: `COP-6532-vendor-tax-id`. No `feat/` / `fix/` prefix; the branch starts with the key. Do not derive a second slug from the title when `TASK_BRANCH` is already set. A legacy flat plan with no folder: re-run the resolver with `--title` from the plan title and `--adopt --create`, then use that `TASK_BRANCH`.

First `scripts/resolve-checkout.sh` (`references/worktree.md` § Choose): the developer's worktree mode decides, `--fallback IN_PLACE`, and `--worktree` passes `--force-worktree`. `DECISION=ask` → ask the user (§ Ask the user), one question for this repository.

- In place: `scripts/ensure-branch.sh` — create or checkout the branch **in this checkout**. Continue here.
- Worktree: `scripts/ensure-worktree.sh` — sibling `{basename}-{KEY}`. Continue with cwd = `WORKTREE`. Do not `git checkout` the ticket branch in the primary.

Unrelated dirty files **in the folder you will edit** → stop and ask. Do not stash or discard them.

## 5. Apply the plan

### Scope

- Do the **Todos** in dependency order. Each Scenario todo includes the behaviour **and** its black-box test.
- Stay inside **Seams** and **Approach**. Honour **Out of scope**. A legacy plan (headings **Implementation steps**, **What we will change**, **Do not touch**) still uses those.
- A todo for a seam in another repository follows the workflow the plan names for it. A change in another repository that turns out to be needed but the plan does not name is a deviation: stop and ask; do not make it on your own.
- Business description = outcome and done-when, not extra features.
- Acceptance criteria are contracts to prove, not a patch recipe. Choose the patch inside the seam.
- No drive-by refactors, dependency bumps, or formatting of unrelated files.
- Mark todos in the plan file as you go (`[x]` / `[ ]` after the id, or a `Progress:` line) so a resumed conversation knows where it stopped.

### Style

From `AGENTS.md`: stack, layout, every listed code-style authority, generated-code restrictions, command matrix, relevant test suites, task routing — read before editing. From `PROJECT.md`: open the `ai-project-knowledge/` files the plan's **Project knowledge → Read** and the routing name for the rules the change must respect. Those files are a map; the code you open is the proof.

- Follow the cited style/config files, then match neighbouring code (names, errors, imports, tests). If they conflict, the explicit repository authority wins and the conflict is reported.
- React code: `$RULES_ROOT/core.md` plus every listed frontend rule whose `paths` match a touched file.
- UI in scope: follow the loaded mockups for layout, flow, chrome, and named states. Plan = scope; mockup = look.
- Tests are mandatory — `references/tests.md`. Write or extend them. A change with no test diff is not done.

### When stuck

- Path moved → find it in the routed area; if you cannot, **stop**.
- Plan step is wrong against current code → **stop** and say what drifted. Do not silently replace the plan.
- Validation fails because of this change → fix in scope and re-run. Failures outside scope → **stop**; do not "clean up the repo".

## 6. Execute tests

`references/tests.md` § Execute. Every command in `validation.commands`, then the `AGENTS.md` test command when that list has none. New tests must be part of that run. Any non-zero exit is a gate failure. Red → fix in scope and re-run; outside scope → stop. **Do not commit.**

## 7. Project knowledge

`references/knowledge.md`. Open the files under **Project knowledge → Update after implementation** and the knowledge file that owns each seam you edited. Fix every statement the diff made wrong. Cite the paths as they are now. Do not touch `Last scanned:`. Nothing applies → `Knowledge: no change needed`. Changed at least one file → push those files to Buddy (`knowledge.md § 3`, **upsert-service-context**, `mode=merge`); a failed push is reported, never blocking.

## 8. Report → review

`references/report-templates.md` § Implement. Branch, files, test files, commands and results, `Knowledge:` and `Buddy:` lines, `Mockups:` line, how to try it. Do not `git add`, commit, or push.

Gate green → start `references/review.md` in the same turn. Jira evidence is posted once by the review stage (implement + review together). Gate red → `Ready: no`; post the failed-gate evidence (**comment-issue**, preamble `🤖 emporix-feature — implement`) and stop.

## Rules

- No plan, no implementation. Do not substitute a fresh analysis for a missing or unapproved plan.
- Tests are mandatory: write or extend them for this change, and execute the existing suite. Do not skip or defer.
- Do not edit files outside the plan's seams. `PROJECT.md` and `ai-project-knowledge/` are inside every plan for statements this change made wrong, and for nothing else.
- Knowledge is part of done. A rule, data, contract, UI, or integration change with no matching knowledge edit is not green.
- When mockups exist for `{KEY}`, match them. Do not widen the plan to match extra mockup screens.
- Do not commit, push, or open a PR here. That is `pr`, after `review`.
