# Investigation

**A read-only question: how does X work, why is Y built this way, where should Z live, is this a bug or intended. The deliverable is an answer, not a change.**

No plan file, no Jira write, no branch, no product edit, no PR.

1. Restate the question in one line and name what would answer it (a code path, a knowledge statement, a log line, a ticket decision).
2. Read `AGENTS.md`, `PROJECT.md`, and the `ai-project-knowledge/` files the routing table points at. With a key: Buddy **get-issue**. For how the service fits the platform: Buddy **service-context** or **ask-buddy**.
3. Run `how` over the subsystem: walkthrough, runtime flow, or a placement and ownership question.
4. Runtime evidence only when the question needs it. Offer `/emporix-logs-check` once (it asks which project). Do not query logs unasked.
5. Answer. Every claim carries its evidence (a repo-relative path, a knowledge file, a log entry) or a label: measured, inferred, or guess.
6. If the answer leads to a change, name the playbook (**Bugfix**, **Feature**, **Refactor**) and the one-line ask for it. Do not start it.

**Reply:** the answer first, then the evidence for each claim, the unknowns, and the suggested next playbook, and the principles that changed a decision.
