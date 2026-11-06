# Conventions (step 3)

Library code follows the library, not any one consumer. Do not pick a single
module — in the library or in a consumer such as a migrated Management
Dashboard remote — and copy it as "the reference". Build the conventions from
these sources, in this order; an earlier source wins over a later one.

1. **The library's agent instructions.** `CLAUDE.md`, `AGENTS.md`,
   `.cursor/rules/`, `.cursor/skills/`, `.github/copilot-instructions.md`,
   `.github/instructions/`. Follow them. Where they point at a specific
   consumer module as a pilot or template, use it only as an example of
   behaviour, never as the style to copy.
2. **Enforced tooling.** ESLint, Prettier, `tsconfig`, and the `package.json`
   scripts. What the tools enforce is the style; run them rather than
   imitating formatting by eye.
3. **The library README** — public API rules (what is exported, from where),
   package layout, contribution and release sections.
4. **Peer modules inside the library.** Pick two or three existing modules
   closest to the change (same service file or neighbouring service for an
   endpoint; same kind of component and the same build pattern for a
   component). Prefer recently changed ones (`git log -n 5 --format='%h %ad' -- <path>`).
   Use them for naming, file layout, types, error handling, and test shape.
   When peers disagree, follow the most recently changed one and say so.
5. **Recently merged pull requests** in the library
   (`gh pr list --repo <repo> --state merged --limit 5`) — what reviewers
   accept: tests, stories, changelog entries, export changes.

The code being replaced (a custom call, or the Management Dashboard component
being migrated) is the behaviour specification only: what it does, its props
or parameters, its edge cases. Do not carry its structure or styling into the
library.

## Summary for the user

Before writing code, show:

```markdown
**Conventions for {library} ({sources read})**
- Location: {file / folder for the change}
- Naming: {function or component naming}
- Types: {where types live, how they are exported}
- Tests: {test file location and style}
- Extras: {story / changelog / export entry required}
- Peers used: {2–3 paths} — {any disagreement and which one wins}
```

The user may correct it. Corrections win over every source above.
