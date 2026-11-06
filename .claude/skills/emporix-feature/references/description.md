# Child-issue description — business only

This is the Jira **description** in parent + prompt mode. Write for a product owner. No service names, APIs, file paths, class names, or implementation steps.

**How we will know it is done** states the same outcomes as the plan’s Scenarios, in product language.

Buddy converts Markdown to Jira ADF. Use real headings.

Title: outcome in plain language (`Use embedded XML as the primary source for invoice data`), not `Implement: …`.

```markdown
## Background

{why this matters, from the parent and the prompt — not invented}

## Who it is for

{role and situation, e.g. AP clerk receiving a hybrid invoice}

## What should happen

{the outcome in user terms: what they see or can do when it is done}

## What is out of scope

- …

## How we will know it is done

- [ ] {observable check a PO can verify, matching a Scenario — not a unit test}

## Open questions

- Blocking: …
- Not blocking: …
```
