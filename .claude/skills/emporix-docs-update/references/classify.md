# Classify

Read this after intake. Decide which artifacts this change needs. Do not read
playbooks, screenshot rules, or ship rules. Do not write pages.

Default is **skip**. A user-guide update does not imply a release note. A
changelog entry does not imply a release note. Release notes are not the API
changelog.

## Signal pass

From the change card only, mark each artifact **could-touch** or **out**. Out
artifacts are not opened.

| Signal in the PR or diff | Could-touch |
|---|---|
| Endpoint, field, scope, status, or example changed | `api-references`, and `changelog` if integrators can see the change |
| An integrator must follow new or different steps | `tutorials` |
| A portal guide task changed (cockpit, operator, admin, or dashboard) | `user-guides` |
| Customers should hear about a feature, improvement, or deprecation, and the portal checkout is open | `release-notes` |
| Tests, refactor, or internal-only | none |

`--flavors` drops anything not listed. A mapped flavor the signal pass marks
**out** can be skipped without opening its pages. Say why in one line.

Diagrams and API preview are not decided here. Diagrams are listed later only
when a kept page needs a flow prose cannot carry. API preview is listed only
when the author asked and an API reference stays in the plan.

## Candidate pages, then keep or skip

For every **could-touch** mapped flavor, list candidate pages before skipping
it. Follow `references/context-brief.md` in **candidates** mode. When release
notes could-touch, the candidate is the live release-notes file (titles of the
newest entries only).

Then keep or skip:

| Artifact | Keep when | Playbook, read only after approval |
|---|---|---|
| `api-references` | The contract change is not already documented on the candidate page | `references/playbooks/api-references.md` |
| `changelog` | Integrators need the API change announced | `references/playbooks/changelog.md` |
| `tutorials` | An integrator how-to is missing or now wrong | `references/playbooks/tutorials.md` |
| `user-guides` | A portal guide is missing the change or is now wrong | `references/playbooks/user-guides.md` |
| `release-notes` | Customers should hear about it, and the newest entries do not already announce it | `references/playbooks/release-notes.md` |

Prefer updating an existing page over creating a near-duplicate. If nothing is
kept, the verdict is **no-docs-change**. Explain and stop. That is a successful
run.

## Detail only for kept pages

For kept `user-guides` and `tutorials` pages, run
`references/context-brief.md` in **structure** mode, then follow
`references/decision.md` (placement, form, reader goal, links). Read
`planning-and-structure.md` and `links.md` only for those kept pages.

Changelog and release notes do not need neighbour-page structure. Their
placement is the live file, prepended. Their form is `changelog entry` or
`release note`. The playbook reads the template after approval.

Write the plan with `references/plan.md` and stop for approval.
