# Feature plan rules

What the **Feature** playbook (`references/playbooks/feature.md`) steps 1–2, and
`update`, add to `emporix-feature`'s explore, draft, and update. Each runs the
`emporix-feature` file **as written** (plan mode, key rules, plan location,
quality gate, hard stop) plus these rules. Read this file only in those
steps; it never goes into the todo list.

## `draft`

Header: replace the `**Source:**` line with

```markdown
**Source:** emporix-dev
**Playbook:** feature
```

A plan with no `**Playbook:**` line (written by `/emporix-feature`) is also a
feature plan.

Scope through `experience-first.md`: name who consumes the change (end
user, API or library caller, next maintainer) and keep only the Scenarios,
options, and parameters that user would recognise as needed. Error, empty,
and loading states are Scenarios, not polish. A UI change with open layout
or flow questions settles them in a mockup (`emporix-design`) before
approve, not in code.

**Approach** names decisions and contracts, not class designs. Types,
signatures, and module layout are architect's job. Leave them out of the
plan so the perspectives are not anchored on a shape.

## `update`

Write `**Source:** emporix-dev` and `**Playbook:** feature` (a plan taken over from `/emporix-feature` gets both now, `SKILL.md` § Rules; an `emporix-dev` plan keeps them). A change to **Acceptance criteria**,
**Seams**, or **Todos** marks the design sketches it touches `stale`
(`SKILL.md` § Rules).
