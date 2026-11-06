# Context brief (readonly subagent)

The supervisor launches one `generalPurpose` subagent with `readonly: true` to
collect source material for the documentation decision. The subagent does not
write documentation, open a PR, or take screenshots. Give it this contract.

## Inputs the supervisor passes

- User request (feature, screen, API, or change)
- Jira key if any
- Product repo root and the product diff (or a summary), if any
- Resolved docs workspace root(s) and the mapped `docs.targets` (flavor + paths)
- Which flavors are in scope (`api-references`, `changelog`, `tutorials`,
  `user-guides`, `release-notes`)
- Mode: `candidates` or `structure`
  - `candidates` — list candidate pages only. Leave Documentation structure and
    User goal empty.
  - `structure` — fill Documentation structure and User goal for the flavors
    named in `detail_for` (`user-guides`, `tutorials` only).

If a required input is missing, state what you assumed. Do not stall.

## Allowed Buddy tools (context only)

MCP namespace `user-emporix-ai-buddy`. If tools fail with auth / unauthorized,
tell the supervisor to authenticate that namespace and stop. Do not invent
answers.

When a Jira key is present:

1. `jira_get_ticket` with the key
2. `jira_plan_ticket` with the key

Always, when the change is not fully clear from the diff:

3. `talk_to_buddy` with one focused message: what the change is, who uses it,
   and what they do in the UI or API
4. `get_service_context` when the change touches a named service or an
   architecture question

**Forbidden.** Do not call `buddy_run_workflow` / any `doc-input`, `changelog`,
`api-references`, or `full` workflow. Those produce ticket comments, not pages.
Treat every Buddy answer as notes, not publishable copy.

## What else to collect

### Product diff (required when available)

Read the product diff or summary. Extract only what a doc would describe:
new/changed endpoints, fields, statuses, UI labels, actions, operator-visible
side effects. Do not return file-by-file implementation notes.

### Existing docs (required in `candidates` mode)

In each mapped docs workspace, search the mapped paths and nearby `SUMMARY.md`
entries for the feature, view, or service. A `user-guides` target includes
every mapped `content/` space, including a saved `business-docs` row. List
candidate pages with paths per flavor. For `release-notes`, list
`content/release-notes/README.md` and the titles of the newest entries only.
Do not rewrite them. Do not read playbooks.

### Documentation structure (`structure` mode only)

The supervisor needs this to plan where new information fits. Only for flavors
named in `detail_for`. Collect:

- The `SUMMARY.md` branch (group and neighbouring entries) the topic belongs to
- The parent page and sibling pages, each with its form (concept, procedure,
  reference, tutorial) and rough length
- Terminology the neighbours use for the same thing
- Links the neighbours already have to or from this topic, and whether each
  target is in the same space or in another space

### User goal (`structure` mode only, portal flavors and tutorials)

State from the reader's side, not from the implementation:

- Who the reader is and what they want to achieve
- What triggers the task and what they have when it is done
- Why they would look for the new or changed option, button, icon, or dialog
  window (the reason, not the label)

Treat anything the diff only shows as "how a view changed" as source material,
not as the user goal.

## Return this brief (and nothing else)

```markdown
# Context brief

## Change
- Name:
- Flavors in scope:
- Audience per flavor: (engineer / portal reader / mixed)
- Outcome in one sentence:

## Source material
- Jira: key, summary, status (or none)
- Product diff: endpoints / fields / labels / statuses that a doc needs (or none)
- Buddy: 5-10 bullets (label anything unverified)
- Service context: only what a doc needs (or none)

## Existing docs
| Flavor | Workspace | Candidate page(s) | Covers this already? |
|---|---|---|---|

## Documentation structure
| Space | SUMMARY.md branch | Parent / sibling pages (form, rough length) | Neighbour terminology | Existing links in / out |
|---|---|---|---|---|

## User goal
- Reader:
- Goal and outcome:
- Trigger:
- Why they look for the changed option / button / icon / dialog:

## Open questions
- What is unknown or conflicting (Buddy vs diff vs pages)
```

Never invent UI or API behavior. If Buddy, ticket, and diff disagree, list the
conflict under Open questions.
